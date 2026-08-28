use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::process::Command;
use tauri::Emitter;

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
}

#[derive(Serialize, Clone, Debug)]
pub struct PkgManagerInfo {
    pub name: String,
    pub available: bool,
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
        "macos" => "macos",
        "linux" => detect_linux_distro(),
        _ => "unknown",
    }
    .to_string();

    let version = detect_version(&os_family);
    let desktop_env = detect_desktop_env(&os_family);
    let is_wsl = detect_wsl();

    PlatformInfo {
        os_family,
        os_id,
        arch,
        version,
        desktop_env,
        is_wsl,
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
        "macos" => Command::new("sw_vers")
            .arg("-productVersion")
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
        "macos" => "macos".to_string(),
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
    let managers = vec![
        ("pacman", "pacman"),
        ("yay", "yay"),
        ("paru", "paru"),
        ("flatpak", "flatpak"),
        ("apt", "apt"),
        ("dnf", "dnf"),
        ("brew", "brew"),
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
            let available = Command::new("which")
                .arg(cmd)
                .output()
                .map(|o| o.status.success())
                .unwrap_or(false);
            PkgManagerInfo {
                name: name.to_string(),
                available,
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

#[tauri::command]
fn run_install(
    os: String,
    items: Vec<InstallItem>,
    dry_run: bool,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    std::thread::spawn(move || {
        for item in items {
            let output = if dry_run {
                format!("[DRY RUN] Would execute: {}", item.cmd)
            } else {
                match item.cmd_type.as_str() {
                    "winget" | "choco" | "pacman" | "aur" | "flatpak" | "apt" | "dnf"
                    | "brew" | "pkg" | "npm" | "pip" | "cargo" | "sh" | "ps" | "ollama"
                    | "toolbox" | "ostree" => {
                        let shell = if os == "win" { "powershell" } else { "bash" };
                        let arg = if os == "win" { "-Command" } else { "-c" };

                        match Command::new(shell).arg(arg).arg(&item.cmd).output() {
                            Ok(o) => {
                                let stdout = String::from_utf8_lossy(&o.stdout);
                                let stderr = String::from_utf8_lossy(&o.stderr);
                                format!("{}{}", stdout, stderr)
                            }
                            Err(e) => format!("Error: {}", e),
                        }
                    }
                    _ => format!("[SKIPPED] Unknown command type: {}", item.cmd_type),
                }
            };

            let event = ProgressEvent {
                step: item.name.clone(),
                status: if dry_run {
                    "dry_run".to_string()
                } else {
                    "running".to_string()
                },
                output,
            };

            let _ = app_handle.emit("install-progress", event);
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
