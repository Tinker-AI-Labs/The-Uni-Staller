#!/usr/bin/env bash
# Build Uni-Staller as an Arch package (.pkg.tar.zst) on Arch/CachyOS/Manjaro/EndeavourOS
# Run from inside the Uni-staller project folder.
#
# Tauri v2 has no pacman bundle target, so this builds the release binary with
# tauri and then wraps it with packaging/arch/PKGBUILD.
set -euo pipefail

echo "==> Installing system build dependencies..."
sudo pacman -S --needed --noconfirm \
  base-devel \
  webkit2gtk-4.1 \
  gtk3 \
  libayatana-appindicator \
  librsvg \
  curl \
  wget \
  file \
  openssl \
  pkgconf

echo "==> Checking for Rust..."
if ! command -v cargo &> /dev/null; then
  echo "Rust not found — installing via rustup..."
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
  source "$HOME/.cargo/env"
else
  echo "Rust found: $(rustc --version)"
fi

echo "==> Checking for Node.js..."
if ! command -v node &> /dev/null; then
  echo "Node.js not found — installing via pacman..."
  sudo pacman -S --needed --noconfirm nodejs npm
else
  echo "Node.js found: $(node --version)"
fi

echo "==> Installing JS dependencies..."
npm install

echo "==> Building release binary (no tauri bundle — pacman is not a tauri target)..."
npx tauri build --no-bundle

echo "==> Packaging with makepkg..."
# makepkg refuses to run as root, and must run in the PKGBUILD's directory.
( cd packaging/arch && makepkg --force --clean --noconfirm )

echo ""
echo "==> Done. Output files:"
find packaging/arch -maxdepth 1 -name "*.pkg.tar.zst"
echo ""
echo "Install it with:  sudo pacman -U packaging/arch/*.pkg.tar.zst"
