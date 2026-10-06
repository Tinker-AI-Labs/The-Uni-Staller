//! Workaround for the blank/white window WebKitGTK can show inside an
//! AppImage on Wayland: its DMA-BUF renderer clashes with the graphics
//! libraries bundled in the image. Only applied when running as an AppImage,
//! and never overrides a value the user already set.
//!
//!   WEBKIT_DISABLE_DMABUF_RENDERER=0 ./Uni-Staller.AppImage   turn the fix off
//!   UNI_STALLER_SAFE_RENDER=1 ./Uni-Staller.AppImage          also disable compositing mode

/// Variables to set, given the situation. `is_set` says whether the user
/// already provided a variable (any value counts, including "0").
pub fn webkit_workarounds(
    is_appimage: bool,
    safe_render: bool,
    is_set: impl Fn(&str) -> bool,
) -> Vec<(&'static str, &'static str)> {
    if !is_appimage {
        return vec![];
    }
    let mut want = vec![("WEBKIT_DISABLE_DMABUF_RENDERER", "1")];
    if safe_render {
        want.push(("WEBKIT_DISABLE_COMPOSITOR_MODE", "1"));
    }
    want.into_iter().filter(|(k, _)| !is_set(k)).collect()
}

/// Call first thing in `main`, before any thread or webview exists.
#[cfg(target_os = "linux")]
pub fn apply() {
    let is_appimage = std::env::var_os("APPIMAGE").is_some() || std::env::var_os("APPDIR").is_some();
    let safe = std::env::var("UNI_STALLER_SAFE_RENDER").map(|v| v == "1").unwrap_or(false);
    for (k, v) in webkit_workarounds(is_appimage, safe, |k| std::env::var_os(k).is_some()) {
        std::env::set_var(k, v);
    }
}

#[cfg(not(target_os = "linux"))]
pub fn apply() {}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn only_in_appimage() {
        assert!(webkit_workarounds(false, true, |_| false).is_empty());
    }
    #[test]
    fn dmabuf_first_compositor_only_when_asked() {
        assert_eq!(webkit_workarounds(true, false, |_| false), vec![("WEBKIT_DISABLE_DMABUF_RENDERER", "1")]);
        assert_eq!(
            webkit_workarounds(true, true, |_| false),
            vec![("WEBKIT_DISABLE_DMABUF_RENDERER", "1"), ("WEBKIT_DISABLE_COMPOSITOR_MODE", "1")]
        );
    }
    #[test]
    fn user_values_win() {
        assert!(webkit_workarounds(true, true, |_| true).is_empty());
        assert_eq!(
            webkit_workarounds(true, true, |k| k == "WEBKIT_DISABLE_DMABUF_RENDERER"),
            vec![("WEBKIT_DISABLE_COMPOSITOR_MODE", "1")]
        );
    }
}
