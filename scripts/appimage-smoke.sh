#!/usr/bin/env bash
# Launch an AppImage under a virtual X display several ways and report, for each,
# whether the app stayed up, spawned a WebKit web process, and painted something
# other than a uniform (blank) window. It is a diagnostic, not a Wayland test.
#   scripts/appimage-smoke.sh path/to/Uni-Staller.AppImage
set -u
img="$1"
chmod +x "$img"
cases=(
  "A default|"
  "B default + software GL|LIBGL_ALWAYS_SOFTWARE=1"
  "C safe render (+compositor off)|UNI_STALLER_SAFE_RENDER=1"
  "D workaround OFF|WEBKIT_DISABLE_DMABUF_RENDERER=0"
  "E workaround OFF + software GL|WEBKIT_DISABLE_DMABUF_RENDERER=0 LIBGL_ALWAYS_SOFTWARE=1"
)
printf '%-34s %-6s %-8s %-9s %s\n' CASE ALIVE WEBPROC STDDEV "APP SAID"
for c in "${cases[@]}"; do
  name="${c%%|*}"; envs="${c#*|}"
  log=$(mktemp); shot=$(mktemp --suffix=.png)
  xvfb-run -a -s "-screen 0 1280x900x24" bash -c '
    env $0 UNI_STALLER_DEBUG=1 "$1" --appimage-extract-and-run >"$2" 2>&1 &
    sleep 22
    alive=no; pgrep -x uni-staller >/dev/null && alive=yes
    web=no
    for d in /proc/[0-9]*; do case "$(cat "$d/comm" 2>/dev/null)" in WebKitWebProc*) web=yes;; esac; done
    import -window root "$3" 2>/dev/null
    echo "$alive $web" > "$3.state"
    pkill -x uni-staller; sleep 1
  ' "$envs" "$img" "$log" "$shot"
  read -r alive web < "$shot.state" 2>/dev/null || { alive=?; web=?; }
  sd=$(identify -format "%[fx:standard_deviation]" "$shot" 2>/dev/null || echo "?")
  said=$(grep -o '\[Uni-Staller\].*' "$log" | head -n1)
  printf '%-34s %-6s %-8s %-9.4f %s\n' "$name" "$alive" "$web" "${sd:-0}" "${said:-(nothing)}"
  grep -v "AT-SPI" "$log" | grep -v '^\[Uni-Staller\]' | grep -v '^$' | head -n 5 | sed 's/^/      log: /'
done
exit 0
