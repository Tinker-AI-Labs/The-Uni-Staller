# Sourced by the AppImage's AppRun (linuxdeploy runs every apprun-hooks/*.sh
# before starting the app). Works around the blank/white window WebKitGTK can
# show inside an AppImage on Wayland (its DMA-BUF renderer clashes with the
# graphics libraries bundled in the image).
#
# Each variable only applies if you have not already set it, so you can
# override from the command line:
#   WEBKIT_DISABLE_DMABUF_RENDERER=0 ./Uni-Staller.AppImage     # turn the fix off
#   UNI_STALLER_SAFE_RENDER=1 ./Uni-Staller.AppImage            # stronger: also disable compositing mode

: "${WEBKIT_DISABLE_DMABUF_RENDERER:=1}"
export WEBKIT_DISABLE_DMABUF_RENDERER

# Second step, only if the first is not enough on some machine. It costs some
# rendering performance, so it is opt-in.
if [ "${UNI_STALLER_SAFE_RENDER:-0}" = "1" ]; then
  : "${WEBKIT_DISABLE_COMPOSITOR_MODE:=1}"
  export WEBKIT_DISABLE_COMPOSITOR_MODE
fi
