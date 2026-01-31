# 🗺️ Kenichi Converter Roadmap

Building the ultimate lightweight, high-performance media utility powered by **Tauri v2** and **FFmpeg**.

## 🚀 Phase 1: Foundation (Completed)
- [x] Initial Tauri v2 Setup with React & TypeScript
- [x] "Pro Gray" Design System & Tailwind v4 Integration
- [x] FFmpeg/FFprobe Sidecar Configuration
- [x] Native OS File Drag-and-Drop
- [x] Basic Conversion (Format, Resolution, Quality, Speed)
- [x] Cross-Platform CI/CD with GitHub Actions

## 🛠️ Phase 2: User Experience Enhancements
- [x] **Integrated Video Preview**
  - Use `ffprobe` to extract metadata and high-quality thumbnails.
  - Show a hover-preview or GIF of the selected video. (Thumbnail implemented)
- [x] **Trim & Clip Tool**
  - Add start/end time markers to convert specific segments.
  - Implement `-ss` and `-to` seeking logic.
- [x] **Pro GIF Mode**
  - Two-pass palette generation for high-fidelity GIFs (no more dithering issues).

## ⚡ Phase 3: Power Features
- [ ] **Batch Processing**
  - Queue multiple files for sequential or parallel conversion.
  - Track progress for the entire "Batch" in the dashboard.
- [ ] **Audio Master**
  - Dedicated mode for extracting high-quality MP3/WAV/FLAC.
  - ID3 metadata tag editing.
- [x] **Smart Compression**
  - "Target Size" mode (e.g., Compress for Discord < 25MB).
  - Automatic bitrate calculation.

## 🎨 Phase 4: Visual Polish
- [ ] Semi-transparent background (Acrylic/Vibrancy) for Windows/macOS.
- [ ] Context menus for recent files.
- [ ] Custom tray integration for background tasks.
