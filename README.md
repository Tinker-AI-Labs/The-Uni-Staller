# T1NK3R-V3R53 // UNI-STALLER

Universal sovereign software installer for the T1NK3R-V3R53 ecosystem. Built with Tauri v2 (Rust + vanilla JS). Generates ready-to-run bootstrap scripts for any OS from one interface — no cloud, [...]

## What it does

- **9 OS tabs** — Tiny11/Windows, CachyOS, Bazzite, Fedora, Ubuntu/Debian, Arch, macOS, iPadOS, Android
- **JUMPSTART God Mode** — curated "arm all" bootstrap block per OS: base tools, runtimes (nvm/Rust/pipx), Ollama, companions
- **Companion Models** — installer-default roster pulled per OS: Alfred (mistral:latest), Sage (mistral:latest), Steward (phi3:latest), Scout (phi3:mini), Daisy (llama3.2:1b), Coach (llama3.2:3b)
- **Full category library** — beyond JUMPSTART, each OS tab has dozens of expandable categories: Development, CLI AI Tools, Gaming, Audio/DAW/VST, Game Engines/3D, 3D Printing (Bambu P1S), SDR/R[...]
- **Gap-Fill Companion on every tab** — a second catalog of general desktop apps (browsers, office, graphics, media, gaming, dev, system utilities) the curated stack doesn't cover, with its own script generator
- **Script generator** — outputs `.ps1` (Windows) or `.sh` (Linux/macOS) from your selections, deduped and ordered correctly
- **OpenRouter importer** — writes your OR key to the correct OS-specific path, generates setup script
- **ROCm support** — AMD RX 6600 / RDNA2 paths on CachyOS, Bazzite, and Fedora
- **Cross-OS mode** — use any tab from any OS; cross-platform warning banners activate automatically
- **Native Tauri execution** — when running as a built app, scripts can execute directly with live terminal output (dry-run or live), backed by `detect_platform`/`detect_pkg_managers`/`run_insta[...]
- **Architecture detection** — x86_64 / aarch64 badge, detected via Tauri natively or browser `userAgentData` as fallback

## Recent Updates

### August 2026 - All nine tabs completed
- **Six OSes filled in**: Fedora, Ubuntu/Debian, Arch, macOS, iPadOS and Android had empty JUMPSTART/CATS data and a placeholder script generator. All six now carry a full JUMPSTART block and a complete category library against their own package manager (`dnf`, `apt`, `pacman`/AUR, `brew`, App Store, `pkg`/Termux).
- **Real script generators** for those tabs: batched native-package installs, Flatpak/snap/AUR/cask sections, npm/pip/cargo, Ollama pulls, and manual notes. iPadOS deliberately generates a **checklist** rather than a script — nothing on iPadOS can run an installer.
- **Gap-Fill Companion for the remaining six tabs**: one shared `gapfill.html?os=<id>` page driven by `gapfill-data.js` (~400 extra apps). The older standalone `gapfill-windows/fedora/ubuntu.html` files are unchanged and still wired to their own tabs.
- **ADD ALL button now works** — it was wired to a function that was never defined.
- **URL anchors now work** — `#arch`, `#macos`, … actually switch tabs (documented before, never implemented).
- **Browser OS detection fallback** — outside the Tauri app the badges resolve from the user agent instead of sitting on "DETECTING…".
- **Markup escaping fix** — commands containing `<lan-ip>` were parsed as HTML tags and swallowed every item after them on the iPadOS/Android tabs.
- **Filter buttons** highlight the active mode; long unbreakable commands no longer blow out their grid column.

### July 2026 - Bug Fixes
- **Windows PATH consolidation**: Fixed duplicate PATH writes across Machine/User environments. Now writes to single machine-level location.
- **Yazi FM snap installer**: Updated CachyOS JUMPSTART to use `snap install yazi` instead of cargo build for faster installation.
- **Octoprint integration**: Prepared framework for OctoPrint 3D printer controller integration (install source pending).
- **RPM support**: Added Fedora/RHEL/CentOS RPM packaging via local build script and GitHub Actions CI.

## Stack

```
src/
  index.html            — 9 OS tab structure, OpenRouter panel, gap-fill panels, header
  jumpstart-engine.js   — all data (JUMPSTART + CATS for 9 OSes), state, rendering, script generators
  app.js                — OpenRouter key verification + setup-script generation
  styles.css            — T1NK3R-V3R53 dark theme, OS color vars
  tauri-bridge.js       — Tauri v2 ↔ browser fallback bridge, OS detection, save/download, terminal output, native install runner
  gapfill.html          — shared Gap-Fill Companion page: gapfill.html?os=cachy|bazzite|arch|macos|ipados|android
  gapfill-data.js       — gap-fill catalogs for those six systems
  gapfill-windows.html  — older standalone gap-fill companions, one file each,
  gapfill-fedora.html     still wired to their own tabs
  gapfill-ubuntu.html

src-tauri/
  src/lib.rs       — Rust: detect_platform(), detect_pkg_managers(), get_home_dir(), get_downloads_dir(), save_script(), run_install()
  capabilities/default.json — permission set (shell execute, dialog, fs read/write, os info, notifications)
  Cargo.toml       — tauri v2, shell, dialog, fs, os, notification, opener plugins
  tauri.conf.json  — window config (1280×900), identifier com.tinkerverse.uni-staller

.github/workflows/
  build-appimage.yml — AppImage + deb on ubuntu-24.04
  build-rpm.yml      — RPM on Fedora
  build-windows.yml  — MSI + NSIS on windows-latest
  build-flatpak.yml  — Flatpak in the gnome-46 builder container

packaging/
  com.tinkerverse.uni-staller.desktop      — desktop entry, shared by flatpak + arch
  com.tinkerverse.uni-staller.metainfo.xml — AppStream metadata, same
  arch/PKGBUILD    — wraps the built binary into a .pkg.tar.zst
com.tinkerverse.uni-staller.yml — Flatpak manifest (repo root; the workflow's
                                  manifest-path points here)

build-appimage-local.sh   .deb + .AppImage    build-macos-local.sh    .app + .dmg
build-rpm-local.sh        .rpm                build-android-local.sh  .apk / .aab
build-arch-local.sh       .pkg.tar.zst        build-windows-local.ps1 .msi + .exe
build-flatpak-local.sh    .flatpak            build-windows-local.sh  .msi + .exe (WSL)
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

## Packaging — one native package per system

Every system the app targets has a local build script that produces that
system's own package format. Each one checks for its toolchain, installs what
it can, and tells you what it cannot install for you.

| System | Package | Local script | CI |
|---|---|---|---|
| Ubuntu / Debian | `.deb` + `.AppImage` | `build-appimage-local.sh` | `build-appimage.yml` |
| Fedora / RHEL / CentOS | `.rpm` | `build-rpm-local.sh` | `build-rpm.yml` |
| Arch / CachyOS / Manjaro | `.pkg.tar.zst` | `build-arch-local.sh` | — |
| Bazzite + any Linux | `.flatpak` | `build-flatpak-local.sh` | `build-flatpak.yml` |
| Windows | `.msi` + NSIS `.exe` | `build-windows-local.ps1` / `.sh` | `build-windows.yml` |
| macOS | `.app` + `.dmg` | `build-macos-local.sh` | — |
| Android | `.apk` / `.aab` | `build-android-local.sh` | — |
| iPadOS / iOS | `.ipa` | not available — see below | — |

CI workflows in that last column live in `.github/workflows/`.

All the shell scripts are run the same way, from the project root:

```bash
./build-<target>-local.sh
```

Two notes that apply across the Linux targets. Tauri v2 bundles only `deb`,
`rpm` and `appimage` on Linux — there is no pacman target, which is why Arch
goes through a real `PKGBUILD` instead. And every desktop package installs the
same shared metadata from `packaging/`, so the app's name, icon and AppStream
entry are identical on every distro.

### Ubuntu / Debian — `.deb` and `.AppImage`

**Local build** — `build-appimage-local.sh` installs system deps (webkit2gtk, gtk3,
appindicator, librsvg, patchelf), installs Rust via rustup if missing (apt's rustc is
too old for this project), then builds both bundles:

```bash
./build-appimage-local.sh
```

**CI build** — `.github/workflows/build-appimage.yml` builds on `ubuntu-24.04` for every
push to `main` and every `v*` tag, uploads the AppImage + deb as workflow artifacts, and
drafts a GitHub Release on tags.

Output lands in `src-tauri/target/release/bundle/appimage/` and `.../deb/`.

### Fedora / RHEL / CentOS — `.rpm`

**Local build** — `build-rpm-local.sh` installs system deps (webkit2gtk4.1-devel,
gtk3-devel, libappindicator-gtk3-devel, librsvg2-devel, patchelf, rpm-build), installs
Rust via rustup if missing, then builds the RPM:

```bash
./build-rpm-local.sh
```

**CI build** — `.github/workflows/build-rpm.yml` builds on Fedora latest for every push to
`main` and every `v*` tag, uploads the RPM as a workflow artifact, and drafts a GitHub
Release on tags.

Output `.rpm` lands in `src-tauri/target/release/bundle/rpm/`.

### Arch / CachyOS / Manjaro — `.pkg.tar.zst`

Tauri has no pacman bundle target, so this is a two-step build: `tauri build --no-bundle`
produces the release binary, then `makepkg` wraps it using `packaging/arch/PKGBUILD`.

```bash
./build-arch-local.sh
sudo pacman -U packaging/arch/*.pkg.tar.zst
```

The PKGBUILD has no `source=()` — it packages the binary already built from your working
tree, and installs the shared desktop entry, AppStream metadata and icons from
`packaging/`. Don't call `makepkg` directly; it will fail without the prior tauri build.

### Any Linux, and Bazzite in particular — `.flatpak`

Flatpak is the answer for immutable/atomic systems like Bazzite, where installing a
`.rpm` into the base image is the wrong move.

```bash
./build-flatpak-local.sh              # builds your working tree
./build-flatpak-local.sh --from-git   # builds pushed main, exactly as CI does
```

`flatpak-builder` runs with the network turned off, so cargo and npm dependencies have to
be resolved up front into `generated-sources.json` and `generated-sources-npm.json`. The
script does that in a throwaway Python venv (distro Pythons are externally managed, so it
never pip-installs system-wide), pulls the runtime and both SDK extensions from Flathub,
then builds and exports `uni-staller.flatpak`.

Because the checked-in manifest takes its source from the GitHub repo, the default local
run rewrites it to a `type: dir` source pointed at your working tree — otherwise a "local"
build would silently build whatever was last pushed to `main`.

```bash
flatpak install --user uni-staller.flatpak
flatpak run com.tinkerverse.uni-staller
```

**CI build** — `.github/workflows/build-flatpak.yml` builds in the
`bilelmoussaoui/flatpak-github-actions:gnome-46` container, uploads `uni-staller.flatpak`
as a workflow artifact, and drafts a GitHub Release on tags.

### Windows — `.msi` and NSIS `.exe`

**Local build (PowerShell)** — `build-windows-local.ps1` requires Rust and Node.js. Run
from PowerShell on Windows:

```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
.\build-windows-local.ps1
```

**Local build (Bash/WSL)** — `build-windows-local.sh` for WSL environments:

```bash
./build-windows-local.sh
```

**CI build** — `.github/workflows/build-windows.yml` builds on `windows-latest` for every
push to `main` and every `v*` tag, uploads the MSI + NSIS EXE as workflow artifacts, and
drafts a GitHub Release on tags.

Output lands in `src-tauri/target/release/bundle/msi/` and `.../nsis/`.

### macOS — `.app` and `.dmg`

Must be run on macOS; Apple's bundling tools are not cross-platform.

```bash
./build-macos-local.sh              # native arch, fastest
./build-macos-local.sh --universal  # universal binary (Intel + Apple Silicon)
```

The bundle is unsigned and un-notarized, so Gatekeeper will refuse it on any other Mac
until it is signed with an Apple Developer ID. To run it on the build machine:

```bash
xattr -dr com.apple.quarantine "src-tauri/target/release/bundle/macos/Uni-Staller.app"
```

### Android — `.apk` / `.aab`

```bash
./build-android-local.sh        # universal release APK
./build-android-local.sh --aab  # App Bundle for the Play Store
```

This is the one target whose toolchain the script will not install for you — the Android
SDK licence has to be accepted interactively. It requires a JDK 17+, `ANDROID_HOME` (or
`ANDROID_SDK_ROOT`) and an NDK; if `NDK_HOME` is unset the script picks the newest NDK
under `$ANDROID_HOME/ndk`. On first run it scaffolds `src-tauri/gen/android` via
`tauri android init`, which is checked for and reused afterwards.

Release builds are **unsigned** until a keystore is configured in
`src-tauri/gen/android/app/build.gradle.kts`; an unsigned APK will not install on a device.

### iPadOS / iOS — not available

There is no build script and there cannot usefully be one from this repo: `tauri ios build`
only exists on macOS, and it needs Xcode plus a paid Apple Developer account to sign
anything installable. This is also the target the app itself treats as a special case — the
iPadOS tab generates a **checklist**, not a script, because nothing on iPadOS can run an
installer.


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
