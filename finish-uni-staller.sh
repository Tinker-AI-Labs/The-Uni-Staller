#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════
# Finish build + install for the recovered/fixed Uni-Staller
# Run this from inside the extracted Uni-staller-RECOVERED-v1 folder
# (the one containing src/, src-tauri/, package.json, etc.)
# ══════════════════════════════════════════════════════════════
set -euo pipefail

GREEN="\033[0;32m"; AMBER="\033[0;33m"; RED="\033[0;31m"; BLUE="\033[0;34m"; RESET="\033[0m"
ok()   { echo -e "${GREEN}[OK]${RESET} $*"; }
warn() { echo -e "${AMBER}[WARN]${RESET} $*"; }
err()  { echo -e "${RED}[ERR]${RESET} $*"; }
step() { echo -e "${BLUE}══ $* ══${RESET}"; }

# ── Sanity check: run from the right folder ──────────────────────
if [[ ! -f "src-tauri/tauri.conf.json" ]]; then
  err "Run this from inside the extracted project folder (src-tauri/tauri.conf.json not found here)."
  exit 1
fi

step "1/6 — System build dependencies (Fedora dnf5)"
sudo dnf group install -y development-tools rpm-development-tools || warn "Group install had issues — continuing, likely already installed"
sudo dnf install -y \
  webkit2gtk4.1-devel \
  gtk3-devel \
  libappindicator-gtk3-devel \
  librsvg2-devel \
  patchelf \
  curl \
  wget \
  file \
  openssl-devel \
  pkg-config
ok "System dependencies ready"

step "2/6 — Rust toolchain"
if ! command -v cargo >/dev/null 2>&1; then
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
  source "$HOME/.cargo/env"
  ok "Rust installed"
else
  ok "Rust already present: $(rustc --version)"
fi

step "3/6 — Node.js / npm dependencies"
if ! command -v node >/dev/null 2>&1; then
  err "Node.js not found. Install it first (e.g. via nvm or dnf), then re-run this script."
  exit 1
fi
npm install
ok "npm dependencies installed"

step "4/6 — Build (release, .deb + .rpm + AppImage attempt)"
cd src-tauri
cargo tauri build || {
  warn "Build reported an error — checking whether .deb/.rpm still succeeded before this line (AppImage/linuxdeploy is a known separate, harmless failure)."
}
cd ..

RPM_PATH=$(find src-tauri/target/release/bundle/rpm -name "*.rpm" 2>/dev/null | head -1)
if [[ -z "$RPM_PATH" ]]; then
  err "No .rpm found in src-tauri/target/release/bundle/rpm — build did not produce an installable package. Check the cargo tauri build output above."
  exit 1
fi
ok "Built: $RPM_PATH"

step "5/6 — Remove any previously installed Uni-Staller"
if rpm -qa | grep -qi "^uni-staller"; then
  INSTALLED_NAME=$(rpm -qa | grep -i "^uni-staller" | head -1)
  sudo dnf remove -y "$INSTALLED_NAME"
  ok "Removed previously installed: $INSTALLED_NAME"
else
  ok "No previous installation found — nothing to remove"
fi

step "6/6 — Install the freshly built RPM"
sudo dnf install -y "$RPM_PATH"
ok "Installed: $RPM_PATH"

echo ""
echo -e "${GREEN}══════════════════════════════════════════════════════${RESET}"
echo -e "${GREEN}Uni-Staller build + install complete.${RESET}"
echo -e "${AMBER}Launch it from your app menu, not any old shortcut/icon.${RESET}"
echo -e "${AMBER}If the AppImage step above failed, that's the known linuxdeploy/FUSE${RESET}"
echo -e "${AMBER}issue — unrelated to this install. The .deb/.rpm are unaffected.${RESET}"
echo -e "${GREEN}══════════════════════════════════════════════════════${RESET}"
