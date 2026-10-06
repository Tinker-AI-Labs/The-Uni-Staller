use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::process::Command;
use tauri::Emitter;

mod pkg;
mod render;

// ═══════════════════════════════════════════════════════════════
// DATA STRUCTURES
// ═══════════════════════════════════════════════════════════════

#[derive(Serialize, Clone, Debug)]
pub struct PlatformInfo {
    pub os_family: String,
    pub os_id: String,
    pub arch: String,
    pub version: String,
    pub desktop_env: String,
    pub is_wsl: bool,
    /// The distro's own package manager (pacman / apt / dnf / ...), if known.
    pub pkg_manager: Option<String>,
}

#[derive(Serialize, Clone, Debug)]
pub struct PkgManagerInfo {
    pub name: String,
    pub available: bool,
    /// "native" (pacman/apt/dnf/...), "aur" helper, "universal" (flatpak) or "language".
    pub kind: String,
}

#[derive(Serialize)]
pub struct SaveResult {
    pub success: bool,
    pub path: Option<String>,
    pub error: Option<String>,
}

#[derive(Deserialize, Clone)]
pub struct InstallItem {
    pub name: String,
    pub cmd: String,
    pub cmd_type: String,
}

#[derive(Serialize, Clone)]
pub struct ProgressEvent {
    pub step: String,
    pub status: String,
    pub output: String,
}

// ═══════════════════════════════════════════════════════════════
// DETECTION
// ═══════════════════════════════════════════════════════════════

#[tauri::command]
fn detect_platform() -> PlatformInfo {
    let os_family = std::env::consts::OS.to_string();
    let arch = std::env::consts::ARCH.to_string();

    let os_id = match os_family.as_str() {
        "windows" => "win",
        "linux" => detect_linux_distro(),
        _ => "unknown",
    }
    .to_string();

    let version = detect_version(&os_family);
    let desktop_env = detect_desktop_env(&os_family);
    let is_wsl = detect_wsl();
    let pkg_manager = pkg::native_manager(&os_id).map(|s| s.to_string());

    PlatformInfo {
        os_family,
        os_id,
        arch,
        version,
        desktop_env,
        is_wsl,
        pkg_manager,
    }
}

fn detect_linux_distro() -> &'static str {
    if let Ok(content) = std::fs::read_to_string("/etc/os-release") {
        let mut id = "";
        let mut id_like = "";
        let mut variant_id = "";

        for line in content.lines() {
            if line.starts_with("ID=") {
                id = line.trim_start_matches("ID=").trim_matches('"');
            } else if line.starts_with("ID_LIKE=") {
                id_like = line.trim_start_matches("ID_LIKE=").trim_matches('"');
            } else if line.starts_with("VARIANT_ID=") {
                variant_id = line.trim_start_matches("VARIANT_ID=").trim_matches('"');
            }
        }

        if id == "fedora"
            && (variant_id == "bazzite"
                || std::path::Path::new("/usr/bin/bazzite-gnome-rpm-ostree").exists())
        {
            return "bazzite";
        }

        match id {
            "cachyos" => "cachy",
            "fedora" => "fedora",
            "ubuntu" | "debian" | "pop" | "mint" => "ubuntu",
            "arch" | "manjaro" | "endeavouros" | "garuda" => "arch",
            _ => {
                if id_like.contains("arch") {
                    "arch"
                } else if id_like.contains("debian") {
                    "ubuntu"
                } else if id_like.contains("fedora") {
                    "fedora"
                } else {
                    "linux"
                }
            }
        }
    } else {
        "linux"
    }
}

fn detect_version(os_family: &str) -> String {
    match os_family {
        "windows" => Command::new("cmd")
            .args(&["/C", "ver"])
            .output()
            .ok()
            .and_then(|o| String::from_utf8(o.stdout).ok())
            .unwrap_or_default()
            .trim()
            .to_string(),
        "linux" => Command::new("uname")
            .arg("-r")
            .output()
            .ok()
            .and_then(|o| String::from_utf8(o.stdout).ok())
            .unwrap_or_default()
            .trim()
            .to_string(),
        _ => "unknown".to_string(),
    }
}

fn detect_desktop_env(os_family: &str) -> String {
    match os_family {
        "windows" => "windows".to_string(),
        "linux" => std::env::var("XDG_CURRENT_DESKTOP")
            .unwrap_or_default()
            .to_lowercase()
            .split(':')
            .next()
            .unwrap_or("unknown")
            .to_string(),
        _ => "unknown".to_string(),
    }
}

fn detect_wsl() -> bool {
    std::fs::read_to_string("/proc/version")
        .unwrap_or_default()
        .to_lowercase()
        .contains("microsoft")
}

// ═══════════════════════════════════════════════════════════════
// PACKAGE MANAGER DETECTION
// ═══════════════════════════════════════════════════════════════

#[tauri::command]
fn detect_pkg_managers() -> Vec<PkgManagerInfo> {
    // Native distro managers first (pacman, apt, dnf side by side), then AUR
    // helpers, then universal and language tooling.
    let managers = vec![
        ("pacman", "pacman"),
        ("apt", "apt"),
        ("dnf", "dnf"),
        ("yay", "yay"),
        ("paru", "paru"),
        ("flatpak", "flatpak"),
        ("winget", "winget"),
        ("choco", "choco"),
        ("cargo", "cargo"),
        ("npm", "npm"),
        ("pip3", "pip3"),
        ("pkg", "pkg"),
    ];

    managers
        .into_iter()
        .map(|(name, cmd)| {
            // `which` does not exist on Windows; `where` does.
            let finder = if cfg!(windows) { "where" } else { "which" };
            let available = Command::new(finder)
                .arg(cmd)
                .output()
                .map(|o| o.status.success())
                .unwrap_or(false);
            PkgManagerInfo {
                name: name.to_string(),
                available,
                kind: pkg::manager_kind(name).to_string(),
            }
        })
        .collect()
}

// ═══════════════════════════════════════════════════════════════
// FILE / PATH COMMANDS
// ═══════════════════════════════════════════════════════════════

fn get_home() -> Option<PathBuf> {
    #[cfg(target_os = "windows")]
    return std::env::var("USERPROFILE").ok().map(PathBuf::from);
    #[cfg(not(target_os = "windows"))]
    return std::env::var("HOME").ok().map(PathBuf::from);
}

fn get_downloads() -> Option<PathBuf> {
    get_home().map(|h| h.join("Downloads"))
}

#[tauri::command]
fn get_home_dir() -> Result<String, String> {
    get_home()
        .map(|p| p.to_string_lossy().to_string())
        .ok_or_else(|| "Could not determine home directory".to_string())
}

#[tauri::command]
fn get_downloads_dir() -> Result<String, String> {
    get_downloads()
        .map(|p| p.to_string_lossy().to_string())
        .ok_or_else(|| "Could not determine downloads directory".to_string())
}

// ═══════════════════════════════════════════════════════════════
// SAVE SCRIPT
// ═══════════════════════════════════════════════════════════════

#[tauri::command]
fn save_script(content: String, default_name: String) -> Result<SaveResult, String> {
    let downloads = get_downloads()
        .ok_or_else(|| "Could not find downloads directory".to_string())?;
    let path = downloads.join(&default_name);
    
    match std::fs::write(&path, content) {
        Ok(_) => Ok(SaveResult {
            success: true,
            path: Some(path.to_string_lossy().to_string()),
            error: None,
        }),
        Err(e) => Ok(SaveResult {
            success: false,
            path: None,
            error: Some(e.to_string()),
        }),
    }
}

// ═══════════════════════════════════════════════════════════════
// INSTALLATION ENGINE
// ═══════════════════════════════════════════════════════════════

/// Run one install item. Returns (ok, output).
fn run_item(os: &str, item: &InstallItem, allow_aur: bool) -> (bool, String) {
    let t = item.cmd_type.as_str();

    // Official repos first: AUR helpers only run when the caller opted in.
    if pkg::is_aur(t) {
        if !allow_aur {
            return (false, "Skipped: this is an AUR package and AUR installs are off. Official repositories only by default.".to_string());
        }
        let has_helper = ["yay", "paru"].iter().any(|h| {
            Command::new("which").arg(h).output().map(|o| o.status.success()).unwrap_or(false)
        });
        if !has_helper {
            return (false, "No AUR helper (yay or paru) is installed. Install one first, then retry.".to_string());
        }
    }

    if t == "pacman" {
        if let Some(msg) = pkg::pacman_lock_message(std::path::Path::new("/var/lib/pacman/db.lck").exists()) {
            return (false, msg.to_string());
        }
    }

    let known = matches!(
        t,
        "winget" | "choco" | "pacman" | "aur" | "flatpak" | "apt" | "dnf" | "pkg" | "termux"
            | "snap" | "npm" | "pip" | "cargo" | "sh" | "ps" | "ollama" | "toolbox" | "ostree"
    );
    if !known {
        return (false, format!("Skipped: unknown command type: {}", item.cmd_type));
    }

    let cmd = pkg::make_noninteractive(t, &item.cmd);
    let shell = if os == "win" { "powershell" } else { "bash" };
    let arg = if os == "win" { "-Command" } else { "-c" };

    match Command::new(shell).arg(arg).arg(&cmd).output() {
        Ok(o) => {
            let text = format!("{}{}", String::from_utf8_lossy(&o.stdout), String::from_utf8_lossy(&o.stderr));
            if o.status.success() {
                (true, text)
            } else {
                let code = o.status.code().map_or("signal".to_string(), |c| c.to_string());
                let why = pkg::explain_failure(&text).map(|w| format!("{}\n", w)).unwrap_or_default();
                (false, format!("{}(exit {})\n{}", why, code, text))
            }
        }
        Err(e) => (false, format!("Could not start {}: {}", shell, e)),
    }
}

#[tauri::command]
fn run_install(
    os: String,
    items: Vec<InstallItem>,
    dry_run: bool,
    allow_aur: Option<bool>,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let allow_aur = allow_aur.unwrap_or(false);
    std::thread::spawn(move || {
        for item in items {
            let (status, output) = if dry_run {
                let shown = pkg::make_noninteractive(&item.cmd_type, &item.cmd);
                let note = if pkg::is_aur(&item.cmd_type) && !allow_aur { " (would be skipped: AUR is off)" } else { "" };
                ("dry_run", format!("[DRY RUN] Would execute: {}{}", shown, note))
            } else {
                let (ok, out) = run_item(&os, &item, allow_aur);
                let status = if ok {
                    "ok"
                } else if out.starts_with("Skipped") {
                    "skipped"
                } else {
                    "error"
                };
                (status, out)
            };

            let _ = app_handle.emit(
                "install-progress",
                ProgressEvent { step: item.name.clone(), status: status.to_string(), output },
            );
        }

        let _ = app_handle.emit(
            "install-progress",
            ProgressEvent {
                step: "__COMPLETE__".to_string(),
                status: "complete".to_string(),
                output: "Installation finished".to_string(),
            },
        );
    });

    Ok(())
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Must run before any thread or webview exists (see render.rs).
    render::apply();
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            detect_platform,
            detect_pkg_managers,
            get_home_dir,
            get_downloads_dir,
            save_script,
            run_install,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
