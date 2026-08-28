# T1NK3R-V3R53 // UNI-STALLER

Universal sovereign software installer for the T1NK3R-V3R53 ecosystem. Built with Tauri v2 (Rust + vanilla JS). Generates ready-to-run bootstrap scripts for any OS from one interface — no cloud, [...]

## What it does

- **9 OS tabs** — Tiny11/Windows, CachyOS, Bazzite, Fedora, Ubuntu/Debian, Arch, macOS, iPadOS, Android
- **JUMPSTART God Mode** — curated "arm all" bootstrap block per OS: base tools, runtimes (nvm/Rust/pipx), Ollama, companions
- **Companion Models** — installer-default roster pulled per OS: Alfred (mistral:latest), Sage (mistral:latest), Steward (phi3:latest), Scout (phi3:mini), Daisy (llama3.2:1b), Coach (llama3.2:3b)
- **Full category library** — beyond JUMPSTART, each OS tab has dozens of expandable categories: Development, CLI AI Tools, Gaming, Audio/DAW/VST, Game Engines/3D, 3D Printing (Bambu P1S), SDR/R[...]
- **Script generator** — outputs `.ps1` (Windows) or `.sh` (Linux/macOS) from your selections, deduped and ordered correctly
- **OpenRouter importer** — writes your OR key to the correct OS-specific path, generates setup script
- **ROCm support** — AMD RX 6600 / RDNA2 paths on CachyOS, Bazzite, and Fedora
- **Cross-OS mode** — use any tab from any OS; cross-platform warning banners activate automatically
- **Native Tauri execution** — when running as a built app, scripts can execute directly with live terminal output (dry-run or live), backed by `detect_platform`/`detect_pkg_managers`/`run_insta[...]
- **Architecture detection** — x86_64 / aarch64 badge, detected via Tauri natively or browser `userAgentData` as fallback

## Recent Updates

### July 2026 - Bug Fixes
- **Windows PATH consolidation**: Fixed duplicate PATH writes across Machine/User environments. Now writes to single machine-level location.
- **Yazi FM snap installer**: Updated CachyOS JUMPSTART to use `snap install yazi` instead of cargo build for faster installation.
- **Octoprint integration**: Prepared framework for OctoPrint 3D printer controller integration (install source pending).
- **RPM support**: Added Fedora/RHEL/CentOS RPM packaging via local build script and GitHub Actions CI.

## Stack

```
src/
  index.html       — 9 OS tab structure, OpenRouter panel, header
  app.js           — all data (JUMPSTART + CATS), state, generators (~3000 lines)
  styles.css       — T1NK3R-V3R53 dark theme, OS color vars
  tauri-bridge.js  — Tauri v2 ↔ browser fallback bridge, save/download, terminal output, native install runner

src-tauri/
  src/lib.rs       — Rust: detect_platform(), detect_pkg_managers(), get_home_dir(), get_downloads_dir(), save_script(), run_install()
  capabilities/default.json — permission set (shell execute, dialog, fs read/write, os info, notifications)
  Cargo.toml       — tauri v2, shell, dialog, fs, os, notification, opener plugins
  tauri.conf.json  — window config (1280×900), identifier com.tinkerverse.uni-staller
```

## Build

Requires Rust + Cargo and Node.js.

```bash
# Install Tauri CLI (one-time)
cargo install tauri-cli --version "^2"

# Dev server
cargo tauri dev

# Production build
cargo tauri build
```

Output binaries land in `src-tauri/target/release/bundle/`.

## Linux AppImage & Debian packaging

Two paths to a portable `.AppImage` (plus a `.deb`):

**Local build** — `build-appimage-local.sh` installs system deps (webkit2gtk, gtk3, appindicator, librsvg, patchelf), installs Rust via rustup if missing (apt's rustc is too old for this project[...]

```bash
chmod +x build-appimage-local.sh
./build-appimage-local.sh
```

**CI build** — `build-appimage.yml` (GitHub Actions) builds on `ubuntu-24.04` for every push to `main` and every `v*` tag, uploads the AppImage + deb as a workflow artifact, and drafts a GitHub [...]

## Linux RPM packaging (Fedora/RHEL/CentOS)

Two paths to a `.rpm` package:

**Local build** — `build-rpm-local.sh` installs system deps (webkit2gtk4.1-devel, gtk3-devel, libappindicator-gtk3-devel, librsvg2-devel, patchelf), installs Rust via rustup if missing, then builds RPM:

```bash
chmod +x build-rpm-local.sh
./build-rpm-local.sh
```

**CI build** — `build-rpm.yml` (GitHub Actions) builds on Fedora latest for every push to `main` and every `v*` tag, uploads the RPM as a workflow artifact, and drafts a GitHub Release:

```bash
npm run tauri build -- --bundles rpm
```

Output `.rpm` lands in `src-tauri/target/release/bundle/rpm/`.

## Windows MSI & NSIS packaging

Two paths to a Windows installer (`.msi` or `.exe`):

**Local build (PowerShell)** — `build-windows-local.ps1` requires Rust and Node.js. Run from PowerShell on Windows:

```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
.\build-windows-local.ps1
```

**Local build (Bash/WSL)** — `build-windows-local.sh` for WSL environments:

```bash
chmod +x build-windows-local.sh
./build-windows-local.sh
```

**CI build** — `build-windows.yml` (GitHub Actions) builds on `windows-latest` for every push to `main` and every `v*` tag, uploads the MSI + NSIS EXE as workflow artifacts, and drafts a GitHub Release [...]

## Calsifer (second machine)

```bash
cd ~/Uni-staller
cargo tauri build
```

Tauri CLI v2.11.3 was compiled via `cargo install` on Calsifer/Ubuntu Studio. Use `cargo tauri build` for production bundles.

## Part of T1NK3R-V3R53

- GitHub org: [Tinker-AI-Labs](https://github.com/Tinker-AI-Labs)
- License: GPL v3
- Companion to: Alfred, Ollama, TinkerOS, the SR32 Corridor sovereign stack

---

**URL anchor support** — add `#osname` to the URL to auto-select a tab:
- `#win` → Tiny11/Windows
- `#cachy` → CachyOS
- `#bazzite` → Bazzite  
- `#fedora` → Fedora
- `#ubuntu` → Ubuntu/Debian
- `#arch` → Arch Linux
- `#macos` → macOS
- `#ipados` → iPadOS
- `#android` → Android
