#!/usr/bin/env bash
# Remove every libwayland-* from a built AppImage and repack it in place.
#
# The AppImage bundles the build machine's libwayland-*. On a Wayland desktop
# those clash with the host's graphics stack (Mesa / EGL), which is a known
# cause of a blank window. Without them the host's own copies are used.
#
#   scripts/strip-appimage-wayland.sh path/to/Uni-Staller.AppImage
#
# Needs: readelf (binutils), unsquashfs + mksquashfs (squashfs-tools).
# The image is never executed, so an image for another architecture works too.
# The original runtime, compression and block size are reused.
set -euo pipefail

img="${1:?usage: $0 path/to/App.AppImage}"
[[ -f "$img" ]] || { echo "error: $img not found" >&2; exit 1; }
for t in readelf unsquashfs mksquashfs; do
  command -v "$t" >/dev/null || { echo "error: $t not found (apt install binutils squashfs-tools)" >&2; exit 1; }
done

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

# A type-2 AppImage is an ELF runtime followed by a squashfs; the squashfs starts
# right after the ELF's section header table.
hdr="$(readelf -h "$img")"
shoff="$(awk '/Start of section headers:/ {print $5}' <<<"$hdr")"
shentsize="$(awk '/Size of section headers:/ {print $5}' <<<"$hdr")"
shnum="$(awk '/Number of section headers:/ {print $5}' <<<"$hdr")"
offset=$(( shoff + shentsize * shnum ))

info="$(unsquashfs -s -o "$offset" "$img" 2>&1)" || { echo "error: no squashfs at offset $offset; is this a type-2 AppImage?" >&2; exit 1; }
comp="$(awk '/^Compression / {print $2; exit}' <<<"$info")"
bsize="$(awk '/^Block size / {print $3; exit}' <<<"$info")"
echo "runtime: $offset bytes, squashfs: compression=$comp block=$bsize"

unsquashfs -no-progress -o "$offset" -d "$work/AppDir" "$img" >/dev/null

found="$(find "$work/AppDir" \( -type f -o -type l \) -name 'libwayland-*' -print | sort)"
if [[ -z "$found" ]]; then
  echo "no libwayland-* in the image; left untouched"
  exit 0
fi
echo "removing:"
sed "s#^$work/AppDir/#  #" <<<"$found"
find "$work/AppDir" \( -type f -o -type l \) -name 'libwayland-*' -delete

head -c "$offset" "$img" > "$work/runtime"
mksquashfs "$work/AppDir" "$work/new.squashfs" -root-owned -noappend -no-progress \
  -comp "$comp" -b "$bsize" >/dev/null
cat "$work/runtime" "$work/new.squashfs" > "$work/new.AppImage"
chmod --reference="$img" "$work/new.AppImage"
mv -f "$work/new.AppImage" "$img"
echo "repacked $img ($(stat -c %s "$img") bytes)"
