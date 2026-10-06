//! Package-manager handling for the native installer.
//!
//! Pure, std-only helpers so they can be unit-tested without a Tauri build:
//! `rustc --test src-tauri/src/pkg.rs && ./pkg`.

/// The distro's own package manager for an OS tab id.
pub fn native_manager(os_id: &str) -> Option<&'static str> {
    match os_id {
        "arch" | "cachy" => Some("pacman"),
        "ubuntu" => Some("apt"),
        "fedora" => Some("dnf"),
        "bazzite" => Some("rpm-ostree"),
        "win" => Some("winget"),
        "android" => Some("pkg"),
        _ => None,
    }
}

/// How a detected tool is classified for the UI.
pub fn manager_kind(name: &str) -> &'static str {
    match name {
        "pacman" | "apt" | "dnf" | "winget" | "pkg" => "native",
        "yay" | "paru" => "aur",
        "flatpak" | "choco" => "universal",
        _ => "language",
    }
}

/// True for items that need an AUR helper. Official repos come first; these
/// only run when the caller explicitly opts in.
pub fn is_aur(cmd_type: &str) -> bool {
    cmd_type == "aur"
}

/// Package managers whose commands must never stop to ask a question.
pub fn is_system_pkg_type(cmd_type: &str) -> bool {
    matches!(cmd_type, "pacman" | "apt" | "dnf")
}

/// Ensure each `anchor` invocation in `cmd` carries every required flag.
/// A flag counts as present if it (or an alias) appears before the next
/// command separator. Flags are inserted right after the anchor.
fn ensure_flags(cmd: &str, anchor: &str, required: &[(&str, &[&str])]) -> String {
    let mut out = String::new();
    let mut rest = cmd;
    while let Some(pos) = rest.find(anchor) {
        let after = pos + anchor.len();
        out.push_str(&rest[..after]);
        let tail = &rest[after..];
        // Only treat it as the anchor when it ends a word ("pacman -S" not "pacman -Ss").
        let boundary = tail.chars().next().map_or(true, |c| c == ' ' || c == '\t' || c == '\n');
        let seg_end = ["&&", "||", ";", "|", "\n"]
            .iter()
            .filter_map(|s| tail.find(s))
            .min()
            .unwrap_or(tail.len());
        let segment = &tail[..seg_end];
        if boundary {
            for (flag, aliases) in required {
                let present = segment
                    .split_whitespace()
                    .any(|t| t == *flag || aliases.contains(&t));
                if !present {
                    out.push(' ');
                    out.push_str(flag);
                }
            }
        }
        rest = tail;
    }
    out.push_str(rest);
    out
}

/// Make a package-manager command non-interactive. Commands already carrying
/// the flags are returned unchanged. Anything that is not a plain install
/// (searches, queries, `-Syu`) is left alone apart from `--noconfirm`.
pub fn make_noninteractive(cmd_type: &str, cmd: &str) -> String {
    match cmd_type {
        "pacman" => {
            // `pacman -S pkg` only; `-Ss`, `-Si`, `-Syu` etc. are not plain installs.
            let c = ensure_flags(cmd, "pacman -S", &[("--needed", &[]), ("--noconfirm", &[])]);
            c
        }
        "apt" => {
            let c = ensure_flags(cmd, "apt install", &[("-y", &["--yes", "-qy"])]);
            ensure_flags(&c, "apt-get install", &[("-y", &["--yes", "-qy"])])
        }
        "dnf" => ensure_flags(cmd, "dnf install", &[("-y", &["--assumeyes"])]),
        _ => cmd.to_string(),
    }
}

/// Why pacman cannot run right now, in plain words. `lock_exists` is whether
/// /var/lib/pacman/db.lck is present.
pub fn pacman_lock_message(lock_exists: bool) -> Option<&'static str> {
    if lock_exists {
        Some("pacman is locked (/var/lib/pacman/db.lck exists). Another package manager may be running; if none is, remove the lock file and try again.")
    } else {
        None
    }
}

/// Turn raw package-manager stderr into a short, readable reason.
pub fn explain_failure(output: &str) -> Option<&'static str> {
    let o = output.to_lowercase();
    if o.contains("a terminal is required") || o.contains("a password is required") || o.contains("no tty present") {
        Some("Administrator access is needed, but the app cannot ask for a password here. Run the generated script in a terminal instead.")
    } else if o.contains("target not found") {
        Some("A package name was not found in the enabled repositories.")
    } else if o.contains("unable to lock database") || o.contains("could not lock") {
        Some("Another package manager is running or left a lock behind.")
    } else if o.contains("failed retrieving file") || o.contains("could not resolve host") || o.contains("failed to synchronize") {
        Some("The download failed. Check the network connection and mirrors.")
    } else if o.contains("command not found") || o.contains("not found") && o.contains("sh:") {
        Some("A required command is not installed.")
    } else {
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn pacman_flags_added() {
        assert_eq!(make_noninteractive("pacman", "sudo pacman -S git"), "sudo pacman -S --needed --noconfirm git");
        assert_eq!(make_noninteractive("pacman", "sudo pacman -S --noconfirm git"), "sudo pacman -S --needed --noconfirm git");
    }
    #[test]
    fn pacman_already_ok_is_unchanged() {
        let c = "sudo pacman -S --needed --noconfirm base-devel git";
        assert_eq!(make_noninteractive("pacman", c), c);
    }
    #[test]
    fn pacman_each_chained_segment_handled() {
        assert_eq!(
            make_noninteractive("pacman", "sudo pacman -S a && sudo pacman -S --needed --noconfirm b"),
            "sudo pacman -S --needed --noconfirm a && sudo pacman -S --needed --noconfirm b"
        );
    }
    #[test]
    fn pacman_queries_untouched() {
        assert_eq!(make_noninteractive("pacman", "pacman -Ss firefox"), "pacman -Ss firefox");
        assert_eq!(make_noninteractive("pacman", "pacman -Qi git"), "pacman -Qi git");
    }
    #[test]
    fn apt_and_dnf() {
        assert_eq!(make_noninteractive("apt", "sudo apt install git"), "sudo apt install -y git");
        assert_eq!(make_noninteractive("apt", "sudo apt install -y git"), "sudo apt install -y git");
        assert_eq!(make_noninteractive("dnf", "sudo dnf install git"), "sudo dnf install -y git");
        assert_eq!(make_noninteractive("dnf", "sudo dnf install --assumeyes git"), "sudo dnf install --assumeyes git");
    }
    #[test]
    fn other_types_untouched() {
        assert_eq!(make_noninteractive("npm", "npm install -g x"), "npm install -g x");
    }
    #[test]
    fn managers() {
        assert_eq!(native_manager("arch"), Some("pacman"));
        assert_eq!(native_manager("cachy"), Some("pacman"));
        assert_eq!(native_manager("ubuntu"), Some("apt"));
        assert_eq!(native_manager("fedora"), Some("dnf"));
        assert_eq!(native_manager("unknown"), None);
        assert_eq!(manager_kind("pacman"), "native");
        assert_eq!(manager_kind("yay"), "aur");
    }
    #[test]
    fn aur_is_opt_in() {
        assert!(is_aur("aur"));
        assert!(!is_aur("pacman"));
        assert!(is_system_pkg_type("pacman") && is_system_pkg_type("apt") && is_system_pkg_type("dnf"));
    }
    #[test]
    fn lock_and_errors() {
        assert!(pacman_lock_message(true).is_some());
        assert!(pacman_lock_message(false).is_none());
        assert!(explain_failure("error: target not found: nope").unwrap().contains("not found"));
        assert!(explain_failure("sudo: a terminal is required to read the password").unwrap().contains("terminal"));
        assert!(explain_failure("all fine").is_none());
    }
}
