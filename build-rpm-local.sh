#!/usr/bin/env bash
# Build Uni-Staller as a Linux RPM on Fedora/RHEL/CentOS
# Run from inside the Uni-staller--main project folder.
set -euo pipefail

echo "==> Installing system build dependencies..."
sudo dnf groupinstall -y "Development Tools"
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

echo "==> Building RPM..."
npx tauri build --bundles rpm

echo ""
echo "==> Done. Output files:"
find src-tauri/target/release/bundle/rpm -name "*.rpm"
