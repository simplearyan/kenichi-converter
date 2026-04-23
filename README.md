<div align="center">

<img src="app-icon.png" alt="Kenichi Converter" width="96" />

# ⚡ Kenichi Converter

**A high-performance, cross-platform media converter — powered by FFmpeg, built with Tauri v2.**

[![Release](https://img.shields.io/github/v/release/simplearyan/kenichi-converter?color=f59e0b&label=Latest%20Release&logo=github)](https://github.com/simplearyan/kenichi-converter/releases/latest)
[![Build Status](https://img.shields.io/github/actions/workflow/status/simplearyan/kenichi-converter/release.yml?label=CI%20Build&logo=github-actions)](https://github.com/simplearyan/kenichi-converter/actions/workflows/release.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)](#-download)

</div>

---

## 📦 Download

> Download the latest installer for your operating system from the [**Releases**](https://github.com/simplearyan/kenichi-converter/releases/latest) page.

| Platform | Installer | Notes |
|---|---|---|
| 🪟 **Windows** | `.msi` | Run the installer wizard |
| 🍎 **macOS (Apple Silicon)** | `.dmg` | M1 / M2 / M3 |
| 🍎 **macOS (Intel)** | `.dmg` | Intel Core |
| 🐧 **Linux (AppImage)** | `.AppImage` | Universal — make executable & run |
| 🐧 **Linux (Debian/Ubuntu)** | `.deb` | `sudo dpkg -i *.deb` |

> **macOS note:** If macOS blocks the app on first launch, right-click the `.app` → **Open** to bypass Gatekeeper.

---

## ✨ Features

- **🚀 Native-Speed Conversion** — FFmpeg sidecars run directly on your CPU, no cloud uploads, no latency.
- **🎨 Pro Gray UI** — Dark-themed glassmorphism interface with smooth micro-animations.
- **📥 Drag & Drop** — Drop any media file directly from your file explorer.
- **🛠️ Precision Controls** — Resolution (480p → 4K), quality (CRF), playback speed, and output format.
- **✂️ Trim & Clip** — Set start/end timestamps to extract specific segments.
- **🎬 GIF Export** — Basic or Pro mode (two-pass palette generation for crisp, dither-free GIFs).
- **🎵 Audio Extraction** — Output to MP3, M4A, WAV (lossless), or FLAC.
- **📐 Smart Compression** — Target a specific file size (e.g., ≤ 25 MB for Discord); bitrate is calculated automatically.
- **📜 Live Activity Log** — Real-time FFmpeg output with color-coded progress, errors, and timestamps.
- **🔔 Completion Alerts** — Native OS notification + audio chime when a job finishes.
- **🌍 Cross-Platform** — Windows, macOS (Intel & Apple Silicon), and Linux — all from one codebase.

---

## 🚀 Getting Started (Development)

### Prerequisites

| Requirement | Version | Install |
|---|---|---|
| Node.js | LTS | [nodejs.org](https://nodejs.org/) |
| Rust | Stable | [rustup.rs](https://rustup.rs/) |
| FFmpeg binaries | 6.1 | Auto-downloaded by CI; see below for local setup |

### 1 — Clone & Install

```bash
git clone https://github.com/simplearyan/kenichi-converter.git
cd kenichi-converter
npm install
```

### 2 — Download FFmpeg Sidecars (Local Development)

The app requires platform-specific FFmpeg and FFprobe binaries in `src-tauri/bin/`.
Run the included download script for your machine:

```bash
# Windows
node scripts/download-ffmpeg.cjs x86_64-pc-windows-msvc

# macOS (Apple Silicon)
node scripts/download-ffmpeg.cjs aarch64-apple-darwin

# macOS (Intel)
node scripts/download-ffmpeg.cjs x86_64-apple-darwin

# Linux
node scripts/download-ffmpeg.cjs x86_64-unknown-linux-gnu
```

### 3 — Run in Development Mode

```bash
npm run tauri dev
```

> The Vite dev server starts at `http://localhost:1420` and Tauri launches a native window automatically.

---

## 🏗️ Architecture

```
kenichi-converter/
├── src/                      # Frontend (React 19 + TypeScript)
│   ├── components/           # UI Components
│   │   ├── TitleBar.tsx      # Frameless window controls (minimize/maximize/close)
│   │   ├── LandingPage.tsx   # Empty state / file drop CTA
│   │   ├── MediaInfoCard.tsx # Thumbnail, filename, duration display
│   │   ├── OptionsPanel.tsx  # All conversion settings (format, resolution, trim…)
│   │   ├── ActivityTerminal.tsx # Live FFmpeg log viewer
│   │   └── ActionCenter.tsx  # Convert button + progress bar
│   ├── hooks/
│   │   ├── useConverter.ts   # FFmpeg execution, progress parsing, notifications
│   │   ├── useFileProcessing.ts # File dialog, thumbnail & metadata extraction
│   │   └── useDragDrop.ts    # Tauri OS drag-and-drop event listeners
│   ├── utils/
│   │   └── ffmpegUtils.ts    # FFmpeg argument builder (filter_complex, trim, CRF, target-size)
│   ├── types.ts              # VideoOptions interface & defaults
│   └── App.tsx               # Root layout orchestrator
│
├── src-tauri/                # Backend (Rust / Tauri v2)
│   ├── src/lib.rs            # Tauri commands & plugin registration
│   ├── bin/                  # FFmpeg & FFprobe sidecar binaries (git-ignored)
│   └── tauri.conf.json       # Window config, CSP, bundle metadata
│
├── scripts/
│   └── download-ffmpeg.cjs  # Cross-platform FFmpeg sidecar downloader
│
└── .github/workflows/
    ├── release.yml           # 🚀 Production release (tag → GitHub Release)
    ├── test.yml              # 🧪 Build verification on push / PR
    ├── manual-build.yml      # 🛠️ On-demand build with downloadable artifacts
    └── check-sidecars.yml    # 🔍 Weekly FFmpeg download health check
```

---

## 🔁 Release Workflow (CI/CD)

Releases are fully automated via **GitHub Actions**.

### Trigger a Release

1. Update `version` in `src-tauri/tauri.conf.json` and `src-tauri/Cargo.toml`.
2. Commit and push your changes.
3. Tag the commit and push the tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The `release.yml` workflow will automatically:
- Build for **Windows x86_64**, **macOS ARM64**, **macOS x86_64**, and **Linux x86_64**
- Download the correct FFmpeg 6.1 sidecars for each target
- Package installers (`.msi`, `.dmg`, `.AppImage`, `.deb`)
- Create a **GitHub Release** with all installers attached

### CI Pipelines

| Workflow | Trigger | Purpose |
|---|---|---|
| `release.yml` | Push a `v*.*.*` tag | Build all platforms & publish GitHub Release |
| `test.yml` | Push to `main` / PR | Verify the app builds on all 4 targets |
| `manual-build.yml` | Manual dispatch | Build a specific platform, download as artifact |
| `check-sidecars.yml` | Weekly + PR to `scripts/` | Verify FFmpeg download URLs are still live |

---

## 🐛 Known Issues

- **No cancellation** — Once conversion starts, the FFmpeg process cannot be interrupted via the UI.
- **macOS code signing** — Without an Apple Developer certificate, users must bypass Gatekeeper manually on first launch.

---

## 🗺️ Roadmap

See [ROADMAP.md](./ROADMAP.md) for the full plan. Next up:

- [ ] **Batch Processing** — Queue multiple files, track each job's progress independently
- [ ] **Cancel Button** — Kill the active FFmpeg process mid-conversion
- [ ] **macOS Code Signing** — Auto-sign & notarize via CI for seamless first launch

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit: `git commit -m 'feat: add my feature'`
4. Push and open a PR

---

## 🛡️ License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.

---

<div align="center">
Built with ❤️ by <a href="https://github.com/simplearyan">@simplearyan</a> · Powered by <a href="https://tauri.app">Tauri v2</a> & <a href="https://ffmpeg.org">FFmpeg</a>
</div>
