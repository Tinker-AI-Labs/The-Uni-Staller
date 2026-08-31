#!/usr/bin/env bash
# Build Uni-Staller as a Windows MSI/EXE on Windows (via PowerShell)
# This script should be run on Windows. On Unix-like systems, use WSL or run directly in PowerShell.
# Run from inside the Uni-staller project folder.

set -euo pipefail

echo "==> Checking for Rust..."
if ! command -v cargo &> /dev/null; then
  echo "Rust not found — installing via rustup..."
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
  source "$HOME/.cargo/env"
else
  echo "Rust found: $(rustc --version)"
fi

echo "==> Installing JS dependencies..."
npm install

echo "==> Building Windows MSI and NSIS Installer..."
npx tauri build --bundles msi,nsis

echo ""
echo "==> Done. Output files:"
find src-tauri/target/release/bundle -name "*.msi" -o -name "*.exe" | grep -E "(msi|nsis)"
