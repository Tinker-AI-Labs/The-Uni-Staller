#!/usr/bin/env bash
# Build Uni-Staller as an Android package (.apk, or .aab for Play) on Linux/macOS.
# Run from inside the Uni-staller project folder.
#
#   ./build-android-local.sh        # universal release APK
#   ./build-android-local.sh --aab  # Android App Bundle for the Play Store
#
# Unlike the desktop targets this needs the Android SDK, NDK and a JDK. The
# script checks for them rather than installing them — the SDK licence has to
# be accepted interactively, so silently installing it would be wrong.
set -euo pipefail

FORMAT="--apk"
OUT_GLOB="*.apk"
if [ "${1:-}" = "--aab" ]; then FORMAT="--aab"; OUT_GLOB="*.aab"; fi

echo "==> Checking for a JDK..."
if [ -z "${JAVA_HOME:-}" ] && ! command -v javac &> /dev/null; then
  echo "error: no JDK found. Install JDK 17+ and set JAVA_HOME." >&2
  echo "  Fedora:  sudo dnf install java-17-openjdk-devel" >&2
  echo "  Debian:  sudo apt install openjdk-17-jdk" >&2
  echo "  Arch:    sudo pacman -S jdk17-openjdk" >&2
  echo "  macOS:   brew install openjdk@17" >&2
  exit 1
fi
echo "JDK found: ${JAVA_HOME:-$(command -v javac)}"

echo "==> Checking for the Android SDK..."
SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
if [ -z "$SDK" ] || [ ! -d "$SDK" ]; then
  echo "error: ANDROID_HOME (or ANDROID_SDK_ROOT) is not set to a real directory." >&2
  echo "Install the SDK via Android Studio, or the command-line tools, then export it:" >&2
  echo "  export ANDROID_HOME=\$HOME/Android/Sdk" >&2
  exit 1
fi
echo "Android SDK: $SDK"
export ANDROID_HOME="$SDK"

echo "==> Checking for the Android NDK..."
if [ -z "${NDK_HOME:-}" ] || [ ! -d "${NDK_HOME}" ]; then
  # Tauri wants NDK_HOME pointed at one concrete NDK version, not the parent dir.
  CANDIDATE="$(find "$SDK/ndk" -maxdepth 1 -mindepth 1 -type d 2>/dev/null | sort -V | tail -1 || true)"
  if [ -n "$CANDIDATE" ]; then
    export NDK_HOME="$CANDIDATE"
    echo "NDK_HOME was unset — using $NDK_HOME"
  else
    echo "error: no NDK found under $SDK/ndk. Install one via Android Studio's SDK Manager," >&2
    echo "then export NDK_HOME=\$ANDROID_HOME/ndk/<version>" >&2
    exit 1
  fi
else
  echo "NDK: $NDK_HOME"
fi

echo "==> Checking for Rust..."
if ! command -v cargo &> /dev/null; then
  echo "Rust not found — installing via rustup..."
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
  source "$HOME/.cargo/env"
else
  echo "Rust found: $(rustc --version)"
fi

echo "==> Adding the Android Rust targets..."
rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android

echo "==> Installing JS dependencies..."
npm install

if [ ! -d src-tauri/gen/android ]; then
  echo "==> First run — scaffolding the Android project (src-tauri/gen/android)..."
  npx tauri android init
else
  echo "==> Android project already scaffolded, reusing src-tauri/gen/android"
fi

echo "==> Building the Android package..."
npx tauri android build "$FORMAT"

echo ""
echo "==> Done. Output files:"
find src-tauri/gen/android/app/build/outputs -name "$OUT_GLOB" 2>/dev/null || true
echo ""
echo "Note: release builds are UNSIGNED unless you have configured a keystore in"
echo "src-tauri/gen/android/app/build.gradle.kts. An unsigned APK cannot be installed"
echo "on a device — sign it with apksigner, or use a debug build for local testing."
