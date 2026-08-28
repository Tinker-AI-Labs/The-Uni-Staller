#!/usr/bin/env bash
# Build Uni-Staller as a Linux AppImage on Kubuntu/Ubuntu
# Run from inside the Uni-staller--main project folder.
set -euo pipefail

echo "==> Installing system build dependencies..."
sudo apt-get update
sudo apt-get install -y \
  libwebkit2gtk-4.1-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  patchelf \
  build-essential \
  curl wget file libssl-dev pkg-config

echo "==> Checking for Rust..."
if ! command -v cargo &> /dev/null; then
  echo "Rust not found — installing via rustup (NOT apt, apt's rustc is too old for this project)..."
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
  source "$HOME/.cargo/env"
else
  echo "Rust found: $(rustc --version)"
fi

echo "==> Installing JS dependencies..."
npm install

echo "==> Building AppImage (and .deb)..."
npx tauri build --bundles appimage,deb

echo ""
echo "==> Done. Output files:"
find src-tauri/target/release/bundle -name "*.AppImage" -o -name "*.deb"
