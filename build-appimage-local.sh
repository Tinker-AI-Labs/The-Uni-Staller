#!/usr/bin/env bash
# Build Uni-Staller as a Linux AppImage on Kubuntu/Ubuntu.
# Native builds run directly on the host's own architecture (x86_64 or
# aarch64). `--arm64` on a non-ARM64 host builds inside an emulated
# linux/arm64 container instead of cross-compiling: cross-compiling
# WebKitGTK/GTK with a multiarch apt toolchain is unreliable in practice
# (Ubuntu's arm64 packages live on ports.ubuntu.com, which a plain
# `dpkg --add-architecture arm64` does not add, and Rust's pkg-config
# crate refuses to run under cross-compilation without extra sysroot
# setup). Emulation trades build speed for a build that actually works.
# Run from inside the Uni-staller project folder.
# Usage: ./build-appimage-local.sh [--arm64]
set -euo pipefail

HOST_ARCH="$(uname -m)"
WANT_ARM64=false
[[ "$*" == *"--arm64"* ]] && WANT_ARM64=true

build_native() {
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

  echo "==> Checking for Node.js..."
  if ! command -v node &> /dev/null; then
    echo "Node.js not found — installing via nvm..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    nvm install --lts
  else
    echo "Node.js found: $(node --version)"
  fi

  echo "==> Installing JS dependencies..."
  npm install

  echo "==> Building AppImage natively for $HOST_ARCH..."
  npx tauri build --bundles appimage,deb

  echo ""
  echo "==> Done. Output files:"
  find src-tauri/target/release/bundle -name "*.AppImage" -o -name "*.deb"
}

build_arm64_emulated() {
  echo "==> Host is $HOST_ARCH; building aarch64 via a QEMU-emulated container."
  echo "==> This is slower than native but avoids unreliable multiarch cross-compilation."

  if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is required for emulated ARM64 builds on a non-ARM64 host." >&2
    echo "Install Docker, then re-run: ./build-appimage-local.sh --arm64" >&2
    exit 1
  fi

  echo "==> Registering QEMU binfmt handlers (safe to re-run)..."
  docker run --privileged --rm tonistiigi/binfmt --install arm64 > /dev/null

  echo "==> Building inside an emulated linux/arm64 Ubuntu 24.04 container..."
  docker run --rm --platform linux/arm64 \
    -v "$PWD":/work -w /work \
    ubuntu:24.04 \
    bash -c '
      set -euo pipefail
      export DEBIAN_FRONTEND=noninteractive
      apt-get update
      apt-get install -y \
        libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev \
        librsvg2-dev patchelf build-essential curl wget file libssl-dev \
        pkg-config ca-certificates
      curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
      source "$HOME/.cargo/env"
      curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
      apt-get install -y nodejs
      npm install
      npx tauri build --target aarch64-unknown-linux-gnu --bundles appimage,deb
    '

  echo "==> Fixing file ownership on build output (container ran as root)..."
  sudo chown -R "$(id -u):$(id -g)" src-tauri/target

  echo "==> Renaming artifacts for aarch64..."
  cd src-tauri/target/aarch64-unknown-linux-gnu/release/bundle
  for f in appimage/*.AppImage; do
    [ -f "$f" ] && mv "$f" "${f%.AppImage}-aarch64.AppImage"
  done
  for f in deb/*.deb; do
    [ -f "$f" ] && mv "$f" "${f%.deb}-aarch64.deb"
  done
  cd - > /dev/null

  echo ""
  echo "==> Done. Output files:"
  find src-tauri/target/aarch64-unknown-linux-gnu/release/bundle -name "*-aarch64.AppImage" -o -name "*-aarch64.deb"
}

if $WANT_ARM64 && [[ "$HOST_ARCH" != "aarch64" && "$HOST_ARCH" != "arm64" ]]; then
  build_arm64_emulated
else
  build_native
fi
