#!/usr/bin/env bash
# Build Uni-Staller as a Linux RPM on Fedora/RHEL/CentOS.
# Native builds run directly on the host's own architecture (x86_64 or
# aarch64). `--arm64` on a non-ARM64 host builds inside an emulated
# linux/arm64 Fedora container instead of cross-compiling: Fedora's
# cross-compiler packages (gcc-aarch64-linux-gnu etc.) officially only
# support building kernels, not full userspace/GUI apps, so there's no
# real cross-compilation path for a GTK/WebKit app here. Emulation trades
# build speed for a build that actually works.
# Run from inside the Uni-staller project folder.
# Usage: ./build-rpm-local.sh [--arm64]
set -euo pipefail

HOST_ARCH="$(uname -m)"
WANT_ARM64=false
[[ "$*" == *"--arm64"* ]] && WANT_ARM64=true

build_native() {
  echo "==> Installing system build dependencies..."
  # Installed explicitly rather than via the "Development Tools" group:
  # dnf5 dropped the `groupinstall` alias, and the group itself does not
  # resolve at all on hosts without comps metadata (verified: it fails
  # inside fedora:latest). gcc/gcc-c++/make are all the group actually
  # provided that this build needs.
  sudo dnf install -y \
    gcc \
    gcc-c++ \
    make \
    webkit2gtk4.1-devel \
    gtk3-devel \
    libappindicator-gtk3-devel \
    librsvg2-devel \
    patchelf \
    rpm-build \
    curl \
    wget \
    file \
    openssl-devel \
    pkg-config

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

  echo "==> Building RPM natively for $HOST_ARCH..."
  npx tauri build --bundles rpm

  echo ""
  echo "==> Done. Output files:"
  find src-tauri/target/release/bundle/rpm -name "*.rpm"
}

build_arm64_emulated() {
  echo "==> Host is $HOST_ARCH; building aarch64 RPM via a QEMU-emulated container."
  echo "==> (Fedora's cross-compiler packages don't support full userspace builds.)"

  if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is required for emulated ARM64 builds on a non-ARM64 host." >&2
    echo "Install Docker, then re-run: ./build-rpm-local.sh --arm64" >&2
    exit 1
  fi

  echo "==> Registering QEMU binfmt handlers (safe to re-run)..."
  docker run --privileged --rm tonistiigi/binfmt --install arm64 > /dev/null

  echo "==> Building inside an emulated linux/arm64 Fedora container..."
  # Uses Fedora's own nodejs/npm packages for simplicity in this one-off
  # container; switch to nvm here too if the project needs a specific
  # Node version newer than Fedora ships.
  docker run --rm --platform linux/arm64 \
    -v "$PWD":/work -w /work \
    fedora:latest \
    bash -c '
      set -euo pipefail
      dnf install -y \
        gcc gcc-c++ make webkit2gtk4.1-devel gtk3-devel \
        libappindicator-gtk3-devel librsvg2-devel patchelf rpm-build \
        curl wget file openssl-devel pkg-config nodejs npm
      curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
      source "$HOME/.cargo/env"
      npm install
      npx tauri build --target aarch64-unknown-linux-gnu --bundles rpm
    '

  echo "==> Fixing file ownership on build output (container ran as root)..."
  sudo chown -R "$(id -u):$(id -g)" src-tauri/target

  echo "==> Renaming artifacts for aarch64..."
  cd src-tauri/target/aarch64-unknown-linux-gnu/release/bundle/rpm
  for f in *.rpm; do
    [ -f "$f" ] && mv "$f" "${f%.rpm}-aarch64.rpm"
  done
  cd - > /dev/null

  echo ""
  echo "==> Done. Output files:"
  find src-tauri/target/aarch64-unknown-linux-gnu/release/bundle/rpm -name "*-aarch64.rpm"
}

if $WANT_ARM64 && [[ "$HOST_ARCH" != "aarch64" && "$HOST_ARCH" != "arm64" ]]; then
  build_arm64_emulated
else
  build_native
fi
