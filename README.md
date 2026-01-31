# ⚡ Kenichi Converter

A high-performance, aesthetically pleasing media conversion utility built with **Tauri v2**, **React**, and **FFmpeg**. Designed with a "Pro Gray" aesthetic for maximum focus and efficiency.

![Kenichi Converter Interface](https://github.com/simplearyan/kenichi-converter/raw/main/public/screenshot.png) *(Note: Add your actual screenshot to public/screenshot.png)*

## ✨ Features

- **🚀 Rapid Conversion**: Powered by FFmpeg sidecars for direct, high-speed media processing.
- **🎨 Pro Gray UI**: A sleek, dark-themed interface built with **Tailwind CSS v4** and modern glassmorphism.
- **📥 Native Drag-and-Drop**: Effortlessly drop videos from your OS directly into the app.
- **🛠️ Precision Controls**: Adjust resolution (720p to 4K), quality (CRF), conversion speed, and format (MP4, MKV, GIF, etc.).
- **📜 Live Logs**: Real-time console output from the underlying FFmpeg process.
- **🌍 Cross-Platform**: Optimized for Windows, macOS (Intel/ARM), and Linux.

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (LTS)
- [Rust](https://www.rust-lang.org/tools/install)
- FFmpeg binaries (Handled automatically by our CI/CD, or place in `src-tauri/bin/` for local dev)

### Local Development
1. Clone the repository:
   ```bash
   git clone https://github.com/simplearyan/kenichi-converter.git
   cd kenichi-converter
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run in development mode:
   ```bash
   npm run tauri dev
   ```

## 🏗️ Technical Architecture

- **Frontend**: React + TypeScript + Vite.
- **Styling**: Tailwind CSS v4 (using `@tailwindcss/vite`).
- **Backend**: Rust (Tauri v2) for secure shell execution and filesystem access.
- **Sidecars**: Bundled `ffmpeg` and `ffprobe` binaries for platform-agnostic processing.
- **CI/CD**: GitHub Actions workflows for automated cross-platform builds and releases.

## � Project Structure

The project follows a modular architecture to separate UI, logic, and OS-level operations:

```text
kenichi-converter/
├── src/                # Frontend (React + TS)
│   ├── components/     # Reusable UI components (Panel, TitleBar, etc.)
│   ├── hooks/          # Custom hooks for state/logic (useConverter, etc.)
│   ├── utils/          # Pure helper functions (FFmpeg arg builder)
│   ├── App.tsx         # Main layout orchestrator
│   └── main.tsx        # Entry point
├── src-tauri/          # Backend (Rust)
│   ├── src/            # Rust bridge logic and plugins
│   ├── bin/            # FFmpeg & FFprobe sidecar binaries
│   └── tauri.conf.json # App configuration & permissions
└── public/             # Static assets
```


## �🗺️ Roadmap

We have ambitious plans for Kenichi Converter! Check out our [ROADMAP.md](./ROADMAP.md) for upcoming features like:
- Integrated Video Previews
- Trim & Clip tools
- High-fidelity GIF palette generation
- Batch processing

## 🛡️ License

Distributed under the MIT License. See `LICENSE` for more information.

---
Built with ❤️ by [aryan](https://github.com/simplearyan)
