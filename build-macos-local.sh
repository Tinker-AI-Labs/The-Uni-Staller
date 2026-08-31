#!/usr/bin/env bash
# Build Uni-Staller as a macOS .app + .dmg
# Run from inside the Uni-staller project folder, on macOS.
#
#   ./build-macos-local.sh              # native arch only (fastest)
#   ./build-macos-local.sh --universal  # universal binary (Intel + Apple Silicon)
set -euo pipefail

UNIVERSAL=0
if [ "${1:-}" = "--universal" ]; then UNIVERSAL=1; fi

if [ "$(uname -s)" != "Darwin" ]; then
  echo "error: macOS bundles can only be built on macOS — Apple's tooling is not cross-platform." >&2
  exit 1
fi

echo "==> Checking for Xcode Command Line Tools..."
if ! xcode-select -p &> /dev/null; then
  echo "Not found — launching the installer. Re-run this script once it finishes."
  xcode-select --install
  exit 1
fi
echo "Found: $(xcode-select -p)"

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
  echo "Node.js not found — install it first:  brew install node" >&2
  exit 1
fi
echo "Node.js found: $(node --version)"

echo "==> Installing JS dependencies..."
npm install

if [ "$UNIVERSAL" = "1" ]; then
  echo "==> Adding both Darwin targets to the Rust toolchain..."
  rustup target add aarch64-apple-darwin x86_64-apple-darwin
  echo "==> Building universal .app and .dmg..."
  npx tauri build --target universal-apple-darwin --bundles app,dmg
  BUNDLE_DIR="src-tauri/target/universal-apple-darwin/release/bundle"
else
  echo "==> Building .app and .dmg for $(uname -m)..."
  npx tauri build --bundles app,dmg
  BUNDLE_DIR="src-tauri/target/release/bundle"
fi

echo ""
echo "==> Done. Output files:"
find "$BUNDLE_DIR" -maxdepth 2 \( -name "*.dmg" -o -name "*.app" \)
echo ""
echo "Note: this bundle is unsigned and un-notarized. Gatekeeper will refuse it on"
echo "another Mac until you sign it with an Apple Developer ID. To open it locally:"
echo "  xattr -dr com.apple.quarantine <path to .app>"
