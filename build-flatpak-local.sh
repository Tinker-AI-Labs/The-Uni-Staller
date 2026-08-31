#!/usr/bin/env bash
# Build Uni-Staller as a Flatpak bundle (.flatpak) on any Linux host with flatpak.
# Run from inside the Uni-staller project folder.
#
#   ./build-flatpak-local.sh            # build the working tree (default)
#   ./build-flatpak-local.sh --from-git # build github.com/Tinker-AI-Labs/The-Uni-Staller main,
#                                       # exactly as the CI workflow does
#
# flatpak-builder runs with the network off, so cargo and npm dependencies have
# to be resolved up front into generated-sources*.json — that is what the two
# generator scripts below do, and it is why there was CI-only packaging before.
set -euo pipefail

FROM_GIT=0
if [ "${1:-}" = "--from-git" ]; then FROM_GIT=1; fi

MANIFEST="com.tinkerverse.uni-staller.yml"
APP_ID="com.tinkerverse.uni-staller"
RUNTIME_VER="46"        # org.gnome.Platform version, from the manifest
SDK_EXT_VER="23.08"     # freedesktop base that GNOME 46 is built on

echo "==> Checking for flatpak and flatpak-builder..."
if ! command -v flatpak &> /dev/null; then
  echo "error: flatpak not found. Install it with your package manager first." >&2
  exit 1
fi
if ! command -v flatpak-builder &> /dev/null; then
  echo "flatpak-builder not found — installing it as a flatpak..."
  flatpak install -y --user flathub org.flatpak.Builder
  fpb() { flatpak run org.flatpak.Builder "$@"; }
else
  fpb() { flatpak-builder "$@"; }
fi

echo "==> Ensuring flathub remote and the runtime + SDK extensions..."
flatpak remote-add --if-not-exists --user flathub https://dl.flathub.org/repo/flathub.flatpakrepo
flatpak install -y --user flathub \
  "org.gnome.Platform//${RUNTIME_VER}" \
  "org.gnome.Sdk//${RUNTIME_VER}" \
  "org.freedesktop.Sdk.Extension.rust-stable//${SDK_EXT_VER}" \
  "org.freedesktop.Sdk.Extension.node20//${SDK_EXT_VER}"

echo "==> Setting up a Python venv for the offline-source generators..."
# Distro Pythons are externally managed (PEP 668), so never pip install system-wide.
python3 -m venv .flatpak-tools/venv
.flatpak-tools/venv/bin/pip install --quiet --upgrade pip
.flatpak-tools/venv/bin/pip install --quiet aiohttp toml requests

GEN_BASE="https://raw.githubusercontent.com/flatpak/flatpak-builder-tools/master"
echo "==> Generating cargo sources from src-tauri/Cargo.lock..."
curl -sL -o .flatpak-tools/flatpak-cargo-generator.py "${GEN_BASE}/cargo/flatpak-cargo-generator.py"
.flatpak-tools/venv/bin/python .flatpak-tools/flatpak-cargo-generator.py \
  src-tauri/Cargo.lock -o generated-sources.json

echo "==> Generating npm sources from package-lock.json..."
curl -sL -o .flatpak-tools/flatpak-node-generator.py "${GEN_BASE}/node/flatpak-node-generator.py"
.flatpak-tools/venv/bin/python .flatpak-tools/flatpak-node-generator.py \
  npm package-lock.json -o generated-sources-npm.json

if [ "$FROM_GIT" = "1" ]; then
  echo "==> Building from the pushed main branch (manifest unchanged)..."
  BUILD_MANIFEST="$MANIFEST"
else
  echo "==> Rewriting the manifest to build this working tree instead of GitHub main..."
  BUILD_MANIFEST=".flatpak-local-manifest.yml"
  .flatpak-tools/venv/bin/python - "$MANIFEST" "$BUILD_MANIFEST" <<'PY'
import sys, yaml
src, dst = sys.argv[1], sys.argv[2]
m = yaml.safe_load(open(src))
for mod in m["modules"]:
    if not isinstance(mod, dict) or "sources" not in mod:
        continue
    mod["sources"] = [
        {"type": "dir", "path": ".",
         "skip": ["node_modules", "src-tauri/target", ".flatpak-builder",
                  ".flatpak-tools", "build-dir", "repo", ".git"]}
        if isinstance(s, dict) and s.get("type") == "git" else s
        for s in mod["sources"]
    ]
yaml.safe_dump(m, open(dst, "w"), sort_keys=False, default_flow_style=False)
print("wrote", dst)
PY
fi

echo "==> Building the Flatpak..."
fpb --user --force-clean --repo=repo build-dir "$BUILD_MANIFEST"

echo "==> Exporting a single-file bundle..."
flatpak build-bundle repo uni-staller.flatpak "$APP_ID" --runtime-repo=https://dl.flathub.org/repo/flathub.flatpakrepo

echo ""
echo "==> Done. Output file:"
ls -lh uni-staller.flatpak
echo ""
echo "Install it with:  flatpak install --user uni-staller.flatpak"
echo "Run it with:      flatpak run $APP_ID"
