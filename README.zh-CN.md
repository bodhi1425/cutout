# AI 抠图去背景

[English](README.md) · **简体中文**

用运行在本机的 AI 模型，在浏览器里去掉照片背景，图片全程不上传。可以导出透明 PNG，也可以把主体放到白底或黑底上。

**在线使用：** https://cutout.bodhi.tools/

![抠图截图](docs/screenshot.png)

## 功能

- 一键去背景，使用最高质量档的 IS-Net 模型
- 透明、白底或黑底三种背景，下载前可预览
- 输出 PNG
- 下载模型和处理时显示进度
- 无水印、无需注册、不限次数
- 中英文界面

主体清晰、背景简单的图片效果最好。

## 实现原理

[@imgly/background-removal](https://github.com/imgly/background-removal-js) 通过 ONNX Runtime Web（WebAssembly）在浏览器中运行 IS-Net 分割模型。首次使用需下载约 190 MB：176 MB 的 `isnet` 模型，加上 ONNX Runtime 文件。之后由浏览器缓存，再次使用会快很多。

如果想减少下载量，可以把 `src/main.ts` 中的 `model: 'isnet'` 改为 `'isnet_fp16'`（88 MB）或 `'isnet_quint8'`（44 MB），边缘精度会有所下降。

## 隐私说明

- 图片只在你的浏览器里读取和处理，应用没有任何上传接口。
- 模型和运行时文件来自 IMG.LY 的 CDN（`staticimgly.com`），也可以通过该库的 `publicPath` 选项改为自己托管。字体从 Google Fonts 和 Fontshare 加载。
- cutout.bodhi.tools 上的线上版本接入了 Cloudflare Web Analytics，只统计页面访问量，不使用 Cookie。自行部署时如不需要，删除 `index.html` 和 `en/index.html` 中的 `cloudflareinsights` 脚本标签即可。

## 本地运行

需要 Node.js 20.19+（或 22.12+）和 [pnpm](https://pnpm.io)。

```bash
git clone https://github.com/bodhi1425/cutout.git
cd cutout
pnpm install
pnpm dev     # http://localhost:5173
pnpm build   # 静态文件输出到 dist/
```

`dist/` 里只有静态文件，可以部署到 Cloudflare Pages、Netlify、GitHub Pages 或任何 Web 服务器。

## 目录结构

```
index.html       中文页 (/)
en/index.html    英文页 (/en/)
src/main.ts      界面、去背景与导出
src/style.css    样式
public/          favicon、robots.txt、sitemap.xml
```

## 依赖

| 包 | 用途 | 许可证 |
|---|---|---|
| [@imgly/background-removal](https://github.com/imgly/background-removal-js) | 去背景 | AGPL-3.0 |
| [Vite](https://vite.dev)、[TypeScript](https://www.typescriptlang.org) | 构建 | MIT、Apache-2.0 |

## 许可证

本项目基于 AGPL-3.0 许可的 @imgly/background-removal 构建，因此采用 [GNU Affero 通用公共许可证 v3.0 或更高版本](LICENSE)。如果你把修改后的版本作为公开的网络服务运行，AGPL 要求你向用户提供对应的源代码。如果 AGPL 不适合你的用途，IMG.LY 提供该库的商业许可。

© 2026 bodhi1425

## 更多本地处理工具

以下工具都完全在浏览器中运行：

- [local-pdf-toolbox](https://github.com/bodhi1425/local-pdf-toolbox)：PDF 合并、拆分、压缩与格式转换
- [image-compressor](https://github.com/bodhi1425/image-compressor)：把图片压缩到指定 KB
- [heic-converter](https://github.com/bodhi1425/heic-converter)：iPhone HEIC 照片转 JPG 或 PNG
- [qrcode](https://github.com/bodhi1425/qrcode)：带 logo、渐变、Wi-Fi 和名片的二维码生成器
- [ocr](https://github.com/bodhi1425/ocr)：图片转文字

## 参与贡献

欢迎提交问题反馈和 Pull Request。较大的改动请先开 issue 讨论。贡献的代码将按 AGPL-3.0-or-later 授权。
