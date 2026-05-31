import './style.css';

const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector(s) as T;

const fileInput = $<HTMLInputElement>('#fileInput');
const dropzone = $('#dropzone');
const panel = $('#panel');
const origMeta = $('#origMeta');
const cutBtn = $<HTMLButtonElement>('#cutBtn');
const progressEl = $('#progress');
const bar = progressEl.querySelector('i') as HTMLElement;
const statusEl = $('#status');
const resultEl = $('#result');

let file: File | null = null;
let cutBlob: Blob | null = null;
let bg: string | null = null; // null=透明, '#ffffff', '#000000'

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

function fmt(b: number): string {
  if (b < 1024) return b + ' B';
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1024 / 1024).toFixed(2) + ' MB';
}
function setStatus(msg: string, kind: 'ok' | 'err' | '' = '') {
  statusEl.textContent = msg;
  statusEl.className = 'statusline' + (kind ? ' ' + kind : '');
}
function setProgress(r: number | null) {
  if (r === null) { progressEl.classList.remove('show'); bar.style.width = '0'; return; }
  progressEl.classList.add('show');
  bar.style.width = Math.round(Math.min(1, Math.max(0, r)) * 100) + '%';
}

function loadFile(f: File) {
  if (!f.type.startsWith('image/')) { setStatus('请选择图片(JPG / PNG / WebP)', 'err'); return; }
  file = f; cutBlob = null;
  const url = URL.createObjectURL(f);
  const img = new Image();
  img.onload = () => {
    origMeta.innerHTML =
      `<img class="op-thumb" src="${url}" alt="" />` +
      `<div class="op-info"><b class="op-name">${f.name}</b>` +
      `<div class="op-line mono">${img.naturalWidth}×${img.naturalHeight} · ${fmt(f.size)}</div></div>`;
  };
  img.src = url;
  (panel as HTMLElement).hidden = false;
  cutBtn.disabled = false;
  resultEl.classList.remove('show');
  resultEl.innerHTML = '';
  setProgress(null);
  setStatus('点「去除背景」开始(首次需下载模型,之后缓存)');
}

fileInput.addEventListener('change', () => {
  const f = fileInput.files?.[0];
  if (f) loadFile(f);
  fileInput.value = '';
});
(['dragenter', 'dragover'] as const).forEach((ev) =>
  dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.add('drag'); }),
);
(['dragleave', 'drop'] as const).forEach((ev) =>
  dropzone.addEventListener(ev, (e) => {
    e.preventDefault();
    if (ev === 'dragleave' && dropzone.contains((e as DragEvent).relatedTarget as Node)) return;
    dropzone.classList.remove('drag');
  }),
);
dropzone.addEventListener('drop', (e) => {
  const f = (e as DragEvent).dataTransfer?.files?.[0];
  if (f) loadFile(f);
});

// ---------- 抠图(懒加载 @imgly) ----------
cutBtn.addEventListener('click', async () => {
  if (!file) return;
  cutBtn.disabled = true;
  resultEl.classList.remove('show');
  setStatus('正在加载 AI 模型(首次较慢)…');
  setProgress(0.02);
  try {
    const { removeBackground } = await import('@imgly/background-removal');
    cutBlob = (await removeBackground(file, {
      model: 'isnet', // 最高质量模型(默认是半精度 fp16)
      output: { format: 'image/png', quality: 0.8 },
      progress: (key: string, current: number, total: number) => {
        const r = total ? current / total : 0;
        setProgress(r);
        setStatus(
          key.startsWith('fetch') ? `下载模型 ${Math.round(r * 100)}%…` : `本地抠图 ${Math.round(r * 100)}%…`,
        );
      },
    })) as Blob;
    setProgress(null);
    setStatus('抠图完成', 'ok');
    bg = null;
    await renderResult();
  } catch (e) {
    setProgress(null);
    setStatus((e as Error).message || '抠图失败,换一张主体更清晰的图试试', 'err');
  } finally {
    cutBtn.disabled = false;
  }
});

// 合成背景色(透明则原图)
async function compose(blob: Blob, bgc: string | null): Promise<Blob> {
  if (!bgc) return blob;
  const bmp = await createImageBitmap(blob);
  const c = document.createElement('canvas');
  c.width = bmp.width; c.height = bmp.height;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = bgc; ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(bmp, 0, 0);
  return await new Promise<Blob>((res) => c.toBlob((b) => res(b!), 'image/png'));
}

async function renderResult() {
  if (!cutBlob) return;
  const out = await compose(cutBlob, bg);
  const url = URL.createObjectURL(out);
  const base = file!.name.replace(/\.[^.]+$/, '');
  const suffix = bg === '#ffffff' ? '白底' : bg === '#000000' ? '黑底' : '透明';
  resultEl.innerHTML =
    `<div class="cut-preview"><img src="${url}" alt="抠图结果" /></div>` +
    `<div class="cut-bg-row">` +
    `<span class="lbl">背景</span>` +
    `<button class="cut-bg-btn" data-bg="" title="透明" aria-pressed="${bg === null}" style="background:repeating-conic-gradient(#ccc 0 25%,#fff 0 50%) 0 0/12px 12px"></button>` +
    `<button class="cut-bg-btn" data-bg="#ffffff" title="白底" aria-pressed="${bg === '#ffffff'}" style="background:#fff"></button>` +
    `<button class="cut-bg-btn" data-bg="#000000" title="黑底" aria-pressed="${bg === '#000000'}" style="background:#000"></button>` +
    `<a class="btn btn-primary cut-dl" href="${url}" download="${base}-${suffix}.png">下载 PNG</a>` +
    `</div>`;
  resultEl.classList.add('show');
  resultEl.querySelectorAll<HTMLButtonElement>('.cut-bg-btn').forEach((b) => {
    b.onclick = () => { bg = b.dataset.bg || null; renderResult(); };
  });
}
