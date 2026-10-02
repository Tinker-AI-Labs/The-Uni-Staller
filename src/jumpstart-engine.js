// ═══════════════════════════════════════════════════════════════
// JUMPSTART ENGINE — data + script generators for all nine OS tabs.
// win / cachy / bazzite came from the recovered 2026-08-28 prototype;
// fedora / ubuntu / arch / macos / ipados / android were built out
// afterwards against each platform's own package manager.
// iPadOS deliberately generates a checklist, not a shell script —
// nothing on iPadOS can run an installer script.
// This does NOT replace OS detection (tauri-bridge.js) or the
// OpenRouter panel (app.js).
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// DATA — JUMPSTART ITEMS PER OS
// ═══════════════════════════════════════════════════════════════
const JUMPSTART = {
  win: [
    {id:'w_policy',  name:'Execution Policy + Self-Elevate', desc:'Must run first on fresh Tiny11. Unlocks PS scripts.', tier:'sys',
     cmd:'Set-ExecutionPolicy RemoteSigned -Force; if(!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]"Administrator")){Start-Process PowerShell "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs;exit}'},
    {id:'w_winget',  name:'Winget Bootstrap', desc:'Ensure winget is installed (App Installer MSIX)', tier:'sys',
     cmd:'# Auto-handled in bootstrap script header'},
    {id:'w_choco',   name:'Chocolatey Package Manager', desc:'Fallback package manager for tools not in winget', tier:'sys',
     cmd:'Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol=[System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString("https://community.chocolatey.org/install.ps1"))'},
    {id:'w_wsl2',    name:'WSL2 + Ubuntu', desc:'Windows Subsystem for Linux — sovereign Linux layer on Win', tier:'sys',
     cmd:'wsl --install -d Ubuntu'},
    {id:'w_git',     name:'Git for Windows', desc:'Version control — required for Claude Code, repos', tier:'dev',
     cmd:'winget install -e --id Git.Git --silent'},
    {id:'w_node',    name:'Node.js LTS', desc:'Required for Claude Code, Gemini CLI, Codex', tier:'dev',
     cmd:'winget install -e --id OpenJS.NodeJS.LTS --silent'},
    {id:'w_vscode',  name:'VS Code', desc:'Primary code editor', tier:'dev',
     cmd:'winget install -e --id Microsoft.VisualStudioCode --silent'},
    {id:'w_claude',  name:'Claude Code (Hermes)', desc:'Agentic coding CLI — installs after Node', tier:'ai',
     cmd:'npm install -g @anthropic-ai/claude-code'},
    {id:'w_gemini',  name:'Gemini CLI', desc:'Google Gemini CLI — codegen layer', tier:'ai',
     cmd:'npm install -g @google/gemini-cli'},
    {id:'w_rust',    name:'Rust + Cargo', desc:'Systems lang — RTK, Yazi', tier:'dev',
     cmd:'winget install -e --id Rustlang.Rust.GNU --silent'},
    {id:'w_rtk',     name:'RTK (Token Compression)', desc:'Token savings for Claude Code', tier:'dev',
     cmd:'cargo install rtk && rtk init -g'},
    {id:'w_docker',  name:'Docker Desktop', desc:'Container engine', tier:'core',
     cmd:'winget install -e --id Docker.DockerDesktop --silent'},
    {id:'w_ollama',  name:'Ollama 0.17.1+', desc:'Local LLM runner — CVE patched', tier:'core',
     cmd:'winget install -e --id Ollama.Ollama --silent'},
    {id:'w_alfred',  name:'Alfred → qwen3:8b', desc:'Primary companion — always warm', tier:'ai',
     cmd:'ollama pull qwen3:8b'},
    {id:'w_steward', name:'Steward → deepseek-r1:14b', desc:'Safety watchdog — always warm', tier:'ai',
     cmd:'ollama pull deepseek-r1:14b'},
    {id:'w_scout',   name:'Scout → llama3.2:3b', desc:'Field recon — always warm', tier:'ai',
     cmd:'ollama pull llama3.2:3b'},
    {id:'w_embed',   name:'nomic-embed-text', desc:'RAG embeddings', tier:'ai',
     cmd:'ollama pull nomic-embed-text'},
    {id:'w_ps7',     name:'PowerShell 7', desc:'Modern PS — cross-platform, required for scripts', tier:'sys',
     cmd:'winget install -e --id Microsoft.PowerShell --silent'},
    {id:'w_winterm', name:'Windows Terminal', desc:'Modern terminal — replaces cmd.exe', tier:'sys',
     cmd:'winget install -e --id Microsoft.WindowsTerminal --silent'},
    {id:'w_7zip',    name:'7-Zip', desc:'Archive tool', tier:'sys',
     cmd:'winget install -e --id 7zip.7zip --silent'},
  ],
  cachy: [
    {id:'c_base',    name:'base-devel + git', desc:'Must be first. Needed to build yay and AUR packages.', tier:'sys',
     cmd:'sudo pacman -S --needed --noconfirm base-devel git'},
    {id:'c_yay',     name:'yay (AUR helper)', desc:'Bootstrap yay if no AUR helper present. Auto-detected.', tier:'sys',
     cmd:'# Auto-bootstrapped in script'},
    {id:'c_flatpak', name:'Flatpak + Flathub', desc:'App runtime — many GUI tools come via Flatpak', tier:'sys',
     cmd:'sudo pacman -S --needed --noconfirm flatpak && flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo'},
    {id:'c_nvm',     name:'Node.js via nvm', desc:'nvm → Node LTS. Required for Claude Code, Gemini CLI.', tier:'dev',
     cmd:'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash && source ~/.bashrc && nvm install --lts'},
    {id:'c_rust',    name:'Rust + Cargo', desc:'Required for RTK, Yazi, Bevy', tier:'dev',
     cmd:'curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y && source $HOME/.cargo/env'},
    {id:'c_pipx',    name:'pipx', desc:'Isolated Python tool installs — avoids system pip conflicts', tier:'dev',
     cmd:'sudo pacman -S --needed --noconfirm python-pipx && pipx ensurepath'},
    {id:'c_ollama',  name:'Ollama 0.17.1+', desc:'Local LLM runner — CVE-2026-7482 patched', tier:'core',
     cmd:'sudo pacman -S --needed --noconfirm ollama && sudo systemctl enable --now ollama'},
    {id:'c_docker',  name:'Docker CE', desc:'Container engine', tier:'core',
     cmd:'sudo pacman -S --needed --noconfirm docker docker-compose && sudo systemctl enable --now docker && sudo usermod -aG docker $USER'},
    {id:'c_claude',  name:'Claude Code (Hermes)', desc:'Agentic coding CLI', tier:'ai',
     cmd:'npm install -g @anthropic-ai/claude-code'},
    {id:'c_gemini',  name:'Gemini CLI', desc:'Google Gemini CLI — codegen layer', tier:'ai',
     cmd:'npm install -g @google/gemini-cli'},
    {id:'c_rtk',     name:'RTK', desc:'Token compression for Claude Code', tier:'dev',
     cmd:'cargo install rtk && rtk init -g'},
    {id:'c_yazi',    name:'Yazi File Manager', desc:'Iron Works themed terminal file manager', tier:'dev',
     cmd:'cargo install yazi-fm'},
    {id:'c_alfred',  name:'Alfred → qwen3:8b', desc:'Primary companion — always warm', tier:'ai',
     cmd:'ollama pull qwen3:8b'},
    {id:'c_steward', name:'Steward → deepseek-r1:14b', desc:'Safety watchdog — always warm', tier:'ai',
     cmd:'ollama pull deepseek-r1:14b'},
    {id:'c_scout',   name:'Scout → llama3.2:3b', desc:'Field recon — always warm', tier:'ai',
     cmd:'ollama pull llama3.2:3b'},
    {id:'c_embed',   name:'nomic-embed-text', desc:'RAG embeddings', tier:'ai',
     cmd:'ollama pull nomic-embed-text'},
    {id:'c_whisper', name:'Whisper STT', desc:'Local speech recognition — Alfred daemon', tier:'ai',
     cmd:'pipx install openai-whisper'},
    {id:'c_piper',   name:'Piper TTS', desc:'Local neural TTS — Alfred voice output', tier:'ai',
     cmd:'pipx install piper-tts'},
    {id:'c_rocm',    name:'ROCm (RX 6600)', desc:'AMD GPU compute — HSA override for RDNA2', tier:'sys',
     cmd:'sudo pacman -S --needed --noconfirm rocm-opencl-runtime rocm-device-libs hip-runtime-amd && echo "export HSA_OVERRIDE_GFX_VERSION=10.3.0" >> ~/.bashrc'},
    {id:'c_pw',      name:'PipeWire Full Stack', desc:'Audio engine — JACK bridge, realtime audio', tier:'sys',
     cmd:'sudo pacman -S --needed --noconfirm pipewire pipewire-jack pipewire-alsa pipewire-pulse wireplumber realtime-privileges && sudo usermod -aG realtime $USER'},
  ],
  bazzite: [
    {id:'b_flathub', name:'Flathub Remote', desc:'Ensure Flathub is configured — primary app source on Bazzite', tier:'sys',
     cmd:'flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo'},
    {id:'b_toolbox', name:'Toolbox Container (Fedora)', desc:'Mutable container for CLI tools. Required for pip/cargo/npm on immutable Bazzite.', tier:'sys',
     cmd:'toolbox create tinker && toolbox enter tinker'},
    {id:'b_nvm',     name:'Node.js via nvm (in toolbox)', desc:'nvm → Node LTS inside toolbox container', tier:'dev',
     cmd:'toolbox run --container tinker bash -c "curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash && source ~/.bashrc && nvm install --lts"'},
    {id:'b_rust',    name:'Rust + Cargo (in toolbox)', desc:'Rust inside toolbox container', tier:'dev',
     cmd:'toolbox run --container tinker bash -c "curl --proto \'=https\' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y"'},
    {id:'b_ollama',  name:'Ollama 0.17.1+', desc:'Layer via rpm-ostree OR run in toolbox', tier:'core',
     cmd:'toolbox run --container tinker bash -c "curl -fsSL https://ollama.com/install.sh | sh"'},
    {id:'b_claude',  name:'Claude Code (Hermes)', desc:'In toolbox container', tier:'ai',
     cmd:'toolbox run --container tinker bash -c "npm install -g @anthropic-ai/claude-code"'},
    {id:'b_gemini',  name:'Gemini CLI', desc:'In toolbox container', tier:'ai',
     cmd:'toolbox run --container tinker bash -c "npm install -g @google/gemini-cli"'},
    {id:'b_rtk',     name:'RTK (in toolbox)', desc:'Token compression for Claude Code', tier:'dev',
     cmd:'toolbox run --container tinker bash -c "cargo install rtk && rtk init -g"'},
    {id:'b_alfred',  name:'Alfred → qwen3:8b', desc:'Primary companion — always warm', tier:'ai',
     cmd:'ollama pull qwen3:8b'},
    {id:'b_steward', name:'Steward → deepseek-r1:14b', desc:'Safety watchdog', tier:'ai',
     cmd:'ollama pull deepseek-r1:14b'},
    {id:'b_scout',   name:'Scout → llama3.2:3b', desc:'Field recon — always warm', tier:'ai',
     cmd:'ollama pull llama3.2:3b'},
    {id:'b_embed',   name:'nomic-embed-text', desc:'RAG embeddings', tier:'ai',
     cmd:'ollama pull nomic-embed-text'},
    {id:'b_decky',   name:'Decky Loader', desc:'Steam Deck plugin loader — pre-installed on Bazzite', tier:'sys',
     cmd:'# Pre-installed on Bazzite'},
    {id:'b_vscode',  name:'VS Code', desc:'Via Flatpak', tier:'dev',
     cmd:'flatpak install -y flathub com.visualstudio.code'},
    {id:'b_whisper', name:'Whisper STT (toolbox)', desc:'Local STT in toolbox', tier:'ai',
     cmd:'toolbox run --container tinker pip install openai-whisper'},
    {id:'b_piper',   name:'Piper TTS (toolbox)', desc:'Local TTS in toolbox', tier:'ai',
     cmd:'toolbox run --container tinker pip install piper-tts'},
    {id:'b_rocm',    name:'ROCm (RX 6600)', desc:'Layer via rpm-ostree — requires reboot', tier:'sys',
     cmd:'rpm-ostree install rocm-opencl rocm-hip && echo "export HSA_OVERRIDE_GFX_VERSION=10.3.0" >> ~/.bashrc'},
    {id:'b_steam',   name:'Steam (pre-installed)', desc:'Already on Bazzite — verify only', tier:'sys',
     cmd:'# Pre-installed on Bazzite. Check: flatpak list | grep Steam'},
  ],
  fedora: [
    {id:'f_refresh', name:'dnf refresh + upgrade', desc:'Must run first on a fresh Workstation install.', tier:'sys',
     cmd:'sudo dnf upgrade --refresh -y'},
    {id:'f_rpmfusion', name:'RPM Fusion (free + nonfree)', desc:'Codecs, Steam, OBS, VLC all live here.', tier:'sys',
     cmd:'sudo dnf install -y https://mirrors.rpmfusion.org/free/fedora/rpmfusion-free-release-$(rpm -E %fedora).noarch.rpm https://mirrors.rpmfusion.org/nonfree/fedora/rpmfusion-nonfree-release-$(rpm -E %fedora).noarch.rpm'},
    {id:'f_devtools', name:'Development Tools group', desc:'gcc/make/autotools — needed to build anything', tier:'sys',
     cmd:'sudo dnf group install -y development-tools && sudo dnf install -y git curl wget'},
    {id:'f_flatpak', name:'Flatpak + Flathub', desc:'App runtime — many GUI tools come via Flatpak', tier:'sys',
     cmd:'sudo dnf install -y flatpak && flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo'},
    {id:'f_nvm',     name:'Node.js via nvm', desc:'nvm → Node LTS. Required for Claude Code, Gemini CLI.', tier:'dev',
     cmd:'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash && source ~/.bashrc && nvm install --lts'},
    {id:'f_rust',    name:'Rust + Cargo', desc:'Required for RTK, Yazi, Bevy', tier:'dev',
     cmd:'curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y && source $HOME/.cargo/env'},
    {id:'f_pipx',    name:'pipx', desc:'Isolated Python tool installs — avoids system pip conflicts', tier:'dev',
     cmd:'sudo dnf install -y pipx && pipx ensurepath'},
    {id:'f_ollama',  name:'Ollama 0.17.1+', desc:'Local LLM runner — no Fedora package, official installer', tier:'core',
     cmd:'curl -fsSL https://ollama.com/install.sh | sh && sudo systemctl enable --now ollama'},
    {id:'f_podman',  name:'Podman + Compose', desc:'Fedora-native rootless container engine', tier:'core',
     cmd:'sudo dnf install -y podman podman-compose podman-docker'},
    {id:'f_claude',  name:'Claude Code (Hermes)', desc:'Agentic coding CLI', tier:'ai',
     cmd:'npm install -g @anthropic-ai/claude-code'},
    {id:'f_gemini',  name:'Gemini CLI', desc:'Google Gemini CLI — codegen layer', tier:'ai',
     cmd:'npm install -g @google/gemini-cli'},
    {id:'f_rtk',     name:'RTK', desc:'Token compression for Claude Code', tier:'dev',
     cmd:'cargo install rtk && rtk init -g'},
    {id:'f_yazi',    name:'Yazi File Manager', desc:'Iron Works themed terminal file manager', tier:'dev',
     cmd:'sudo dnf install -y yazi'},
    {id:'f_alfred',  name:'Alfred → qwen3:8b', desc:'Primary companion — always warm', tier:'ai',
     cmd:'ollama pull qwen3:8b'},
    {id:'f_steward', name:'Steward → deepseek-r1:14b', desc:'Safety watchdog — always warm', tier:'ai',
     cmd:'ollama pull deepseek-r1:14b'},
    {id:'f_scout',   name:'Scout → llama3.2:3b', desc:'Field recon — always warm', tier:'ai',
     cmd:'ollama pull llama3.2:3b'},
    {id:'f_embed',   name:'nomic-embed-text', desc:'RAG embeddings', tier:'ai',
     cmd:'ollama pull nomic-embed-text'},
    {id:'f_whisper', name:'Whisper STT', desc:'Local speech recognition — Alfred daemon', tier:'ai',
     cmd:'pipx install openai-whisper'},
    {id:'f_piper',   name:'Piper TTS', desc:'Local neural TTS — Alfred voice output', tier:'ai',
     cmd:'pipx install piper-tts'},
    {id:'f_rocm',    name:'ROCm (RX 6600)', desc:'AMD GPU compute — HSA override for RDNA2', tier:'sys',
     cmd:'sudo dnf install -y rocm-opencl rocm-hip rocminfo && echo "export HSA_OVERRIDE_GFX_VERSION=10.3.0" >> ~/.bashrc'},
    {id:'f_pw',      name:'PipeWire JACK + realtime', desc:'PipeWire ships by default — add JACK bridge + RT priority', tier:'sys',
     cmd:'sudo dnf install -y pipewire-jack-audio-connection-kit wireplumber realtime-setup && sudo usermod -aG realtime $USER'},
  ],
  ubuntu: [
    {id:'u_update',  name:'apt update + upgrade', desc:'Must run first on a fresh install.', tier:'sys',
     cmd:'sudo apt update && sudo apt upgrade -y'},
    {id:'u_build',   name:'build-essential + git', desc:'gcc/make/headers — needed to build anything', tier:'sys',
     cmd:'sudo apt install -y build-essential git curl wget ca-certificates'},
    {id:'u_flatpak', name:'Flatpak + Flathub', desc:'App runtime — not installed by default on Ubuntu', tier:'sys',
     cmd:'sudo apt install -y flatpak && flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo'},
    {id:'u_snap',    name:'snapd', desc:'Ubuntu-native store — some apps are snap-only', tier:'sys',
     cmd:'sudo apt install -y snapd'},
    {id:'u_nvm',     name:'Node.js via nvm', desc:'nvm → Node LTS. Avoids Ubuntu\'s ancient apt node.', tier:'dev',
     cmd:'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash && source ~/.bashrc && nvm install --lts'},
    {id:'u_rust',    name:'Rust + Cargo', desc:'Required for RTK, Yazi, Bevy', tier:'dev',
     cmd:'curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y && source $HOME/.cargo/env'},
    {id:'u_pipx',    name:'pipx', desc:'Required — Ubuntu 24.04+ blocks system-wide pip installs', tier:'dev',
     cmd:'sudo apt install -y pipx && pipx ensurepath'},
    {id:'u_ollama',  name:'Ollama 0.17.1+', desc:'Local LLM runner — official installer, no apt package', tier:'core',
     cmd:'curl -fsSL https://ollama.com/install.sh | sh && sudo systemctl enable --now ollama'},
    {id:'u_docker',  name:'Docker + Compose', desc:'Container engine from Ubuntu repos', tier:'core',
     cmd:'sudo apt install -y docker.io docker-compose-v2 && sudo systemctl enable --now docker && sudo usermod -aG docker $USER'},
    {id:'u_claude',  name:'Claude Code (Hermes)', desc:'Agentic coding CLI', tier:'ai',
     cmd:'npm install -g @anthropic-ai/claude-code'},
    {id:'u_gemini',  name:'Gemini CLI', desc:'Google Gemini CLI — codegen layer', tier:'ai',
     cmd:'npm install -g @google/gemini-cli'},
    {id:'u_rtk',     name:'RTK', desc:'Token compression for Claude Code', tier:'dev',
     cmd:'cargo install rtk && rtk init -g'},
    {id:'u_yazi',    name:'Yazi File Manager', desc:'Not in apt on LTS — build from cargo', tier:'dev',
     cmd:'cargo install yazi-fm yazi-cli'},
    {id:'u_alfred',  name:'Alfred → qwen3:8b', desc:'Primary companion — always warm', tier:'ai',
     cmd:'ollama pull qwen3:8b'},
    {id:'u_steward', name:'Steward → deepseek-r1:14b', desc:'Safety watchdog — always warm', tier:'ai',
     cmd:'ollama pull deepseek-r1:14b'},
    {id:'u_scout',   name:'Scout → llama3.2:3b', desc:'Field recon — always warm', tier:'ai',
     cmd:'ollama pull llama3.2:3b'},
    {id:'u_embed',   name:'nomic-embed-text', desc:'RAG embeddings', tier:'ai',
     cmd:'ollama pull nomic-embed-text'},
    {id:'u_whisper', name:'Whisper STT', desc:'Local speech recognition — Alfred daemon', tier:'ai',
     cmd:'pipx install openai-whisper'},
    {id:'u_piper',   name:'Piper TTS', desc:'Local neural TTS — Alfred voice output', tier:'ai',
     cmd:'pipx install piper-tts'},
    {id:'u_rocm',    name:'ROCm (RX 6600)', desc:'AMD amdgpu-install repo — HSA override for RDNA2', tier:'sys',
     cmd:'sudo apt install -y rocm-opencl-runtime mesa-opencl-icd clinfo && echo "export HSA_OVERRIDE_GFX_VERSION=10.3.0" >> ~/.bashrc'},
    {id:'u_pw',      name:'PipeWire full stack', desc:'Audio engine — JACK bridge, realtime audio', tier:'sys',
     cmd:'sudo apt install -y pipewire pipewire-audio-client-libraries pipewire-jack wireplumber && sudo usermod -aG audio $USER'},
  ],
  arch: [
    {id:'a_base',    name:'base-devel + git', desc:'Must be first. Needed to build yay and AUR packages.', tier:'sys',
     cmd:'sudo pacman -S --needed --noconfirm base-devel git'},
    {id:'a_mirrors', name:'Reflector mirror sort', desc:'Fast mirrors first — a slow mirrorlist stalls everything after this.', tier:'sys',
     cmd:'sudo pacman -S --needed --noconfirm reflector && sudo reflector --latest 20 --sort rate --save /etc/pacman.d/mirrorlist'},
    {id:'a_yay',     name:'yay (AUR helper)', desc:'Bootstrap yay if no AUR helper present. Auto-detected.', tier:'sys',
     cmd:'# Auto-bootstrapped in script'},
    {id:'a_multilib',name:'multilib repo', desc:'Required for Steam and any 32-bit library', tier:'sys',
     cmd:'sudo sed -i "/^#\\[multilib\\]/,+1s/^#//" /etc/pacman.conf && sudo pacman -Sy'},
    {id:'a_flatpak', name:'Flatpak + Flathub', desc:'App runtime — many GUI tools come via Flatpak', tier:'sys',
     cmd:'sudo pacman -S --needed --noconfirm flatpak && flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo'},
    {id:'a_nvm',     name:'Node.js via nvm', desc:'nvm → Node LTS. Required for CLI AI tools.', tier:'dev',
     cmd:'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash && source ~/.bashrc && nvm install --lts'},
    {id:'a_rust',    name:'Rust + Cargo', desc:'Required for RTK, Yazi, Bevy', tier:'dev',
     cmd:'sudo pacman -S --needed --noconfirm rustup && rustup default stable'},
    {id:'a_pipx',    name:'pipx', desc:'Isolated Python tool installs — Arch blocks system pip', tier:'dev',
     cmd:'sudo pacman -S --needed --noconfirm python-pipx && pipx ensurepath'},
    {id:'a_ollama',  name:'Ollama 0.17.1+', desc:'Local LLM runner — in extra repo', tier:'core',
     cmd:'sudo pacman -S --needed --noconfirm ollama && sudo systemctl enable --now ollama'},
    {id:'a_docker',  name:'Docker CE', desc:'Container engine', tier:'core',
     cmd:'sudo pacman -S --needed --noconfirm docker docker-compose && sudo systemctl enable --now docker && sudo usermod -aG docker $USER'},
    {id:'a_claude',  name:'Claude Code (Hermes)', desc:'Agentic coding CLI', tier:'ai',
     cmd:'npm install -g @anthropic-ai/claude-code'},
    {id:'a_gemini',  name:'Gemini CLI', desc:'Google Gemini CLI — codegen layer', tier:'ai',
     cmd:'npm install -g @google/gemini-cli'},
    {id:'a_rtk',     name:'RTK', desc:'Token compression for Claude Code', tier:'dev',
     cmd:'cargo install rtk && rtk init -g'},
    {id:'a_yazi',    name:'Yazi File Manager', desc:'Iron Works themed terminal file manager', tier:'dev',
     cmd:'sudo pacman -S --needed --noconfirm yazi'},
    {id:'a_alfred',  name:'Alfred → qwen3:8b', desc:'Primary companion — always warm', tier:'ai',
     cmd:'ollama pull qwen3:8b'},
    {id:'a_steward', name:'Steward → deepseek-r1:14b', desc:'Safety watchdog — always warm', tier:'ai',
     cmd:'ollama pull deepseek-r1:14b'},
    {id:'a_scout',   name:'Scout → llama3.2:3b', desc:'Field recon — always warm', tier:'ai',
     cmd:'ollama pull llama3.2:3b'},
    {id:'a_embed',   name:'nomic-embed-text', desc:'RAG embeddings', tier:'ai',
     cmd:'ollama pull nomic-embed-text'},
    {id:'a_whisper', name:'Whisper STT', desc:'Local speech recognition — Alfred daemon', tier:'ai',
     cmd:'pipx install openai-whisper'},
    {id:'a_piper',   name:'Piper TTS', desc:'Local neural TTS — Alfred voice output', tier:'ai',
     cmd:'pipx install piper-tts'},
    {id:'a_rocm',    name:'ROCm (RX 6600)', desc:'AMD GPU compute — HSA override for RDNA2', tier:'sys',
     cmd:'sudo pacman -S --needed --noconfirm rocm-opencl-runtime rocm-hip-runtime rocminfo && echo "export HSA_OVERRIDE_GFX_VERSION=10.3.0" >> ~/.bashrc'},
    {id:'a_pw',      name:'PipeWire full stack', desc:'Audio engine — JACK bridge, realtime audio', tier:'sys',
     cmd:'sudo pacman -S --needed --noconfirm pipewire pipewire-jack pipewire-alsa pipewire-pulse wireplumber realtime-privileges && sudo usermod -aG realtime $USER'},
  ],
  macos: [
    {id:'m_clt',     name:'Xcode Command Line Tools', desc:'Must be first. Homebrew will not build without it.', tier:'sys',
     cmd:'xcode-select --install || true'},
    {id:'m_brew',    name:'Homebrew', desc:'Primary package manager on macOS', tier:'sys',
     cmd:'# Auto-bootstrapped in script'},
    {id:'m_git',     name:'Git', desc:'Newer than Apple\'s bundled git', tier:'dev',
     cmd:'brew install git'},
    {id:'m_node',    name:'Node.js LTS', desc:'Required for Claude Code, Gemini CLI', tier:'dev',
     cmd:'brew install node'},
    {id:'m_rust',    name:'Rust + Cargo', desc:'Required for RTK, Yazi', tier:'dev',
     cmd:'brew install rustup && rustup-init -y'},
    {id:'m_pipx',    name:'pipx', desc:'Isolated Python tool installs', tier:'dev',
     cmd:'brew install pipx && pipx ensurepath'},
    {id:'m_ollama',  name:'Ollama 0.17.1+', desc:'Local LLM runner — Metal accelerated on Apple Silicon', tier:'core',
     cmd:'brew install --cask ollama'},
    {id:'m_docker',  name:'Docker Desktop', desc:'Container engine', tier:'core',
     cmd:'brew install --cask docker'},
    {id:'m_claude',  name:'Claude Code (Hermes)', desc:'Agentic coding CLI', tier:'ai',
     cmd:'npm install -g @anthropic-ai/claude-code'},
    {id:'m_gemini',  name:'Gemini CLI', desc:'Google Gemini CLI — codegen layer', tier:'ai',
     cmd:'npm install -g @google/gemini-cli'},
    {id:'m_rtk',     name:'RTK', desc:'Token compression for Claude Code', tier:'dev',
     cmd:'cargo install rtk && rtk init -g'},
    {id:'m_yazi',    name:'Yazi File Manager', desc:'Iron Works themed terminal file manager', tier:'dev',
     cmd:'brew install yazi'},
    {id:'m_alfred',  name:'Alfred → qwen3:8b', desc:'Primary companion — always warm', tier:'ai',
     cmd:'ollama pull qwen3:8b'},
    {id:'m_steward', name:'Steward → deepseek-r1:14b', desc:'Safety watchdog — always warm', tier:'ai',
     cmd:'ollama pull deepseek-r1:14b'},
    {id:'m_scout',   name:'Scout → llama3.2:3b', desc:'Field recon — always warm', tier:'ai',
     cmd:'ollama pull llama3.2:3b'},
    {id:'m_embed',   name:'nomic-embed-text', desc:'RAG embeddings', tier:'ai',
     cmd:'ollama pull nomic-embed-text'},
    {id:'m_whisper', name:'Whisper STT', desc:'Local speech recognition — Alfred daemon', tier:'ai',
     cmd:'pipx install openai-whisper'},
    {id:'m_piper',   name:'Piper TTS', desc:'Local neural TTS — Alfred voice output', tier:'ai',
     cmd:'pipx install piper-tts'},
    {id:'m_iterm',   name:'iTerm2', desc:'Terminal replacement', tier:'sys',
     cmd:'brew install --cask iterm2'},
    {id:'m_vscode',  name:'VS Code', desc:'Primary code editor', tier:'dev',
     cmd:'brew install --cask visual-studio-code'},
    {id:'m_metal',   name:'Metal / MPS note (no ROCm)', desc:'Apple Silicon uses Metal — HSA_OVERRIDE does nothing here.', tier:'sys',
     cmd:'# Ollama and PyTorch use Metal (MPS) automatically. There is no ROCm on macOS.'},
  ],
  ipados: [
    {id:'i_ashell',  name:'a-Shell (App Store)', desc:'Sandboxed local shell — python3, pip, lua, ffmpeg built in', tier:'sys',
     cmd:'# App Store: a-Shell — https://apps.apple.com/app/id1473805438'},
    {id:'i_ish',     name:'iSH (App Store)', desc:'Alpine Linux in x86 emulation — apk package manager', tier:'sys',
     cmd:'# App Store: iSH Shell — then: apk update && apk add git python3'},
    {id:'i_blink',   name:'Blink Shell', desc:'Best SSH/mosh client — this is how you reach the sovereign box', tier:'core',
     cmd:'# App Store: Blink Shell — then: ssh tinkerv@<your-lan-ip>'},
    {id:'i_tailscale',name:'Tailscale', desc:'Mesh VPN — reach Ollama at home from anywhere', tier:'core',
     cmd:'# App Store: Tailscale — sign in, then the LAN box is reachable by name'},
    {id:'i_pip',     name:'pip bootstrap (a-Shell)', desc:'Python package installs inside a-Shell', tier:'dev',
     cmd:'pip install --upgrade pip'},
    {id:'i_pyreq',   name:'requests + httpx', desc:'Talk to a remote Ollama / OpenRouter from a-Shell', tier:'dev',
     cmd:'pip install requests httpx'},
    {id:'i_ollama_remote', name:'Remote Ollama endpoint', desc:'iPadOS cannot run Ollama natively — point at the LAN box', tier:'ai',
     cmd:'export OLLAMA_HOST=http://<lan-ip>:11434 && echo "export OLLAMA_HOST=http://<lan-ip>:11434" >> ~/.profile'},
    {id:'i_workingcopy', name:'Working Copy', desc:'Full git client for iPadOS — clones the tinker-verse repos', tier:'dev',
     cmd:'# App Store: Working Copy'},
    {id:'i_textastic',name:'Textastic', desc:'Code editor with SSH/SFTP + Working Copy integration', tier:'dev',
     cmd:'# App Store: Textastic Code Editor'},
    {id:'i_obsidian',name:'Obsidian', desc:'Markdown PKM — same vault as desktop via sync', tier:'dev',
     cmd:'# App Store: Obsidian'},
    {id:'i_shortcuts',name:'Siri Shortcuts → Alfred', desc:'Voice trigger that POSTs to the companion API over Tailscale', tier:'ai',
     cmd:'# Shortcuts app → Get Contents of URL → POST http://<lan-ip>:11434/api/generate'},
    {id:'i_localsend',name:'LocalSend', desc:'Sovereign LAN file transfer — same app as desktop', tier:'core',
     cmd:'# App Store: LocalSend'},
    {id:'i_vlc',     name:'VLC for Mobile', desc:'Plays anything — T1NK3R.TV client', tier:'sys',
     cmd:'# App Store: VLC for Mobile'},
    {id:'i_kodi_na', name:'No local LLM runtime', desc:'No Ollama/llama.cpp App Store build — remote inference only', tier:'ai',
     cmd:'# Honest limit: iPadOS sandboxing blocks local model servers. Use the LAN box.'},
  ],
  android: [
    {id:'n_termux',  name:'Termux (F-Droid build)', desc:'Must be the F-Droid/GitHub build — the Play Store one is abandoned.', tier:'sys',
     cmd:'# Install from https://f-droid.org/packages/com.termux/ — NOT Google Play'},
    {id:'n_pkgup',   name:'pkg update + upgrade', desc:'First command in a fresh Termux', tier:'sys',
     cmd:'pkg update -y && pkg upgrade -y'},
    {id:'n_storage', name:'termux-setup-storage', desc:'Grants access to shared device storage', tier:'sys',
     cmd:'termux-setup-storage'},
    {id:'n_base',    name:'git + curl + wget + openssh', desc:'Core CLI toolchain', tier:'sys',
     cmd:'pkg install -y git curl wget openssh'},
    {id:'n_python',  name:'Python 3', desc:'Termux python + pip', tier:'dev',
     cmd:'pkg install -y python'},
    {id:'n_node',    name:'Node.js LTS', desc:'Required for Claude Code, Gemini CLI', tier:'dev',
     cmd:'pkg install -y nodejs-lts'},
    {id:'n_rust',    name:'Rust + Cargo', desc:'Native Termux Rust toolchain', tier:'dev',
     cmd:'pkg install -y rust'},
    {id:'n_tur',     name:'tur-repo (extra packages)', desc:'Termux User Repository — where ollama lives', tier:'sys',
     cmd:'pkg install -y tur-repo'},
    {id:'n_ollama',  name:'Ollama (tur-repo)', desc:'CPU-only on Android — small models only', tier:'core',
     cmd:'pkg install -y ollama'},
    {id:'n_claude',  name:'Claude Code (Hermes)', desc:'Agentic coding CLI — runs in Termux', tier:'ai',
     cmd:'npm install -g @anthropic-ai/claude-code'},
    {id:'n_gemini',  name:'Gemini CLI', desc:'Google Gemini CLI — codegen layer', tier:'ai',
     cmd:'npm install -g @google/gemini-cli'},
    {id:'n_scout',   name:'Scout → llama3.2:3b', desc:'Smallest always-warm companion — the realistic one on-device', tier:'ai',
     cmd:'ollama pull llama3.2:3b'},
    {id:'n_daisy',   name:'Daisy → gemma2:2b', desc:'2B model — fits comfortably in phone RAM', tier:'ai',
     cmd:'ollama pull gemma2:2b'},
    {id:'n_spark',   name:'Spark → phi3.5:latest', desc:'Compact — fastest option on low-RAM devices', tier:'ai',
     cmd:'ollama pull phi3.5:latest'},
    {id:'n_remote',  name:'Remote Ollama fallback', desc:'Prefer the LAN box for anything above 3B', tier:'ai',
     cmd:'echo "export OLLAMA_HOST=http://<lan-ip>:11434" >> ~/.bashrc'},
    {id:'n_termuxapi',name:'Termux:API', desc:'Battery, clipboard, TTS, sensors from the shell', tier:'sys',
     cmd:'pkg install -y termux-api'},
    {id:'n_sshd',    name:'sshd on port 8022', desc:'SSH into the phone from the desktop', tier:'sys',
     cmd:'pkg install -y openssh && sshd && echo "Connect: ssh -p 8022 $(whoami)@<phone-ip>"'},
    {id:'n_tailscale',name:'Tailscale (Play Store)', desc:'Mesh VPN — joins the phone to the T1NK3R cluster', tier:'core',
     cmd:'# Play Store: Tailscale — sign in with the same account as the desktop'},
    {id:'n_termuxboot',name:'Termux:Boot', desc:'Run sshd/ollama at device boot', tier:'sys',
     cmd:'# F-Droid: Termux:Boot — then put scripts in ~/.termux/boot/'},
  ],
};

// ═══════════════════════════════════════════════════════════════
// DATA — CATEGORIES PER OS
// ═══════════════════════════════════════════════════════════════
const CATS = {
  win: [
    { id:'w-dev', icon:'💻', title:'DEVELOPMENT',
      items:[
        {name:'Git for Windows', desc:'Version control', cmd:'winget install -e --id Git.Git --silent', type:'winget'},
        {name:'GitHub CLI', desc:'GitHub from terminal — kalifurd', cmd:'winget install -e --id GitHub.cli --silent', type:'winget'},
        {name:'VS Code', desc:'Primary editor', cmd:'winget install -e --id Microsoft.VisualStudioCode --silent', type:'winget'},
        {name:'Node.js LTS', desc:'Required for CLI AI tools', cmd:'winget install -e --id OpenJS.NodeJS.LTS --silent', type:'winget'},
        {name:'Python 3', desc:'Python runtime', cmd:'winget install -e --id Python.Python.3.12 --silent', type:'winget'},
        {name:'Rust', desc:'Systems lang — RTK/Yazi', cmd:'winget install -e --id Rustlang.Rust.GNU --silent', type:'winget'},
        {name:'Go', desc:'Google systems language', cmd:'winget install -e --id GoLang.Go --silent', type:'winget'},
        {name:'Neovim', desc:'Hyperextensible Vim', cmd:'winget install -e --id Neovim.Neovim --silent', type:'winget'},
        {name:'Windows Terminal', desc:'Modern terminal replacement', cmd:'winget install -e --id Microsoft.WindowsTerminal --silent', type:'winget'},
        {name:'PowerShell 7', desc:'Cross-platform PS', cmd:'winget install -e --id Microsoft.PowerShell --silent', type:'winget'},
        {name:'tmux (via choco)', desc:'Terminal multiplexer', cmd:'choco install -y tmux', type:'choco'},
        {name:'bat', desc:'cat with syntax highlighting', cmd:'winget install -e --id sharkdp.bat --silent', type:'winget'},
        {name:'ripgrep', desc:'Fast grep', cmd:'winget install -e --id BurntSushi.ripgrep.MSVC --silent', type:'winget'},
        {name:'fzf', desc:'Fuzzy finder', cmd:'winget install -e --id junegunn.fzf --silent', type:'winget'},
      ]},
    { id:'w-cliai', icon:'🖥️', title:'CLI AI TOOLS',
      items:[
        {name:'Claude Code (Hermes)', desc:'Primary agentic coding CLI', cmd:'npm install -g @anthropic-ai/claude-code', type:'npm'},
        {name:'Gemini CLI', desc:'Google Gemini CLI — codegen layer', cmd:'npm install -g @google/gemini-cli', type:'npm'},
        {name:'OpenAI Codex CLI', desc:'OpenAI Codex via OpenRouter', cmd:'npm install -g @openai/codex', type:'npm'},
        {name:'OpenCode', desc:'Open-source multi-provider AI CLI', cmd:'npm install -g opencode-ai', type:'npm'},
        {name:'Aider', desc:'AI pair programmer — git-aware', cmd:'pip install aider-chat', type:'ps'},
        {name:'Shell-GPT', desc:'LLM in terminal', cmd:'pip install shell-gpt', type:'ps'},
        {name:'LLM (Simon Willison)', desc:'Universal LLM CLI', cmd:'pip install llm', type:'ps'},
        {name:'RTK', desc:'Token compression for Claude Code', cmd:'cargo install rtk && rtk init -g', type:'ps'},
      ]},
    { id:'w-sovereign', icon:'🛡️', title:'SOVEREIGN STACK',
      items:[
        {name:'Ollama 0.17.1+', desc:'Local LLM runner — CVE patched', cmd:'winget install -e --id Ollama.Ollama --silent', type:'winget'},
        {name:'Docker Desktop', desc:'Container engine', cmd:'winget install -e --id Docker.DockerDesktop --silent', type:'winget'},
        {name:'Open WebUI', desc:'Browser UI for Ollama — after Docker', cmd:'docker run -d -p 3000:8080 --add-host=host.docker.internal:host-gateway -v open-webui:/app/backend/data --name open-webui --restart always ghcr.io/open-webui/open-webui:main', type:'ps'},
        {name:'LocalSend', desc:'Sovereign LAN file transfer', cmd:'winget install -e --id LocalSend.LocalSend --silent', type:'winget'},
        {name:'KeePassXC', desc:'Offline password manager', cmd:'winget install -e --id KeePassXCTeam.KeePassXC --silent', type:'winget'},
        {name:'WSL2 + Ubuntu', desc:'Linux layer on Windows', cmd:'wsl --install -d Ubuntu', type:'ps'},
      ]},
    { id:'w-companions', icon:'🤝', title:'COMPANION MODELS',
      items:[
        {name:'Alfred — qwen3:8b', desc:'Primary orchestrator — always warm', cmd:'ollama pull qwen3:8b', type:'winget'},
        {name:'Steward — deepseek-r1:14b', desc:'Safety watchdog — always warm', cmd:'ollama pull deepseek-r1:14b', type:'winget'},
        {name:'Scout — llama3.2:3b', desc:'Field recon — always warm', cmd:'ollama pull llama3.2:3b', type:'winget'},
        {name:'Daisy — gemma2:2b', desc:'Safe Space support', cmd:'ollama pull gemma2:2b', type:'winget'},
        {name:'Coach — llama3.2:3b', desc:'Motivation', cmd:'ollama pull llama3.2:3b', type:'winget'},
        {name:'Spark — phi3.5:latest', desc:'Inspiration engine', cmd:'ollama pull phi3.5:latest', type:'winget'},
        {name:'Solace — llama3.2:1b', desc:'Deep creative voice', cmd:'ollama pull llama3.2:1b', type:'winget'},
        {name:'Sage — phi4:14b', desc:'Knowledge layer', cmd:'ollama pull phi4:14b', type:'winget'},
        {name:'Luna — gemma2:2b', desc:'P.A.W.S. / living systems', cmd:'ollama pull gemma2:2b', type:'winget'},
        {name:'Tink — qwen2.5vl:7b', desc:'Ward — vision-capable', cmd:'ollama pull qwen2.5vl:7b', type:'winget'},
        {name:'Wren — qwen2.5:1.5b', desc:'Ward', cmd:'ollama pull qwen2.5:1.5b', type:'winget'},
        {name:'Qwen — qwen2.5:3b', desc:'Ward', cmd:'ollama pull qwen2.5:3b', type:'winget'},
        {name:'Remy — smollm2:1.7b', desc:'Ward — lightweight', cmd:'ollama pull smollm2:1.7b', type:'winget'},
        {name:'moondream', desc:'Vision / daydreaming utility model', cmd:'ollama pull moondream', type:'winget'},
        {name:'nomic-embed-text', desc:'RAG embeddings', cmd:'ollama pull nomic-embed-text', type:'winget'},
      ]},
    { id:'w-gaming', icon:'🎮', title:'GAMING',
      items:[
        {name:'Steam', desc:'PC gaming platform', cmd:'winget install -e --id Valve.Steam --silent', type:'winget'},
        {name:'Epic Games Launcher', desc:'Epic + free games', cmd:'winget install -e --id EpicGames.EpicGamesLauncher --silent', type:'winget'},
        {name:'GOG Galaxy', desc:'DRM-free games', cmd:'winget install -e --id GOG.Galaxy --silent', type:'winget'},
        {name:'HeroicGamesLauncher', desc:'Epic/GOG/Amazon on Windows', cmd:'winget install -e --id HeroicGamesLauncher.HeroicGamesLauncher --silent', type:'winget'},
        {name:'RetroArch', desc:'Multi-system emulator frontend', cmd:'winget install -e --id Libretro.RetroArch --silent', type:'winget'},
        {name:'RPCS3 (PS3)', desc:'PlayStation 3 emulator', cmd:'winget install -e --id RPCS3.RPCS3 --silent', type:'winget'},
        {name:'PCSX2 (PS2)', desc:'PlayStation 2 emulator', cmd:'winget install -e --id PCSX2Team.PCSX2 --silent', type:'winget'},
        {name:'DuckStation (PS1)', desc:'PlayStation 1 emulator', cmd:'winget install -e --id stenzek.duckstation --silent', type:'winget'},
        {name:'Dolphin (GC/Wii)', desc:'Nintendo emulator', cmd:'winget install -e --id DolphinEmu.Dolphin --silent', type:'winget'},
        {name:'PPSSPP (PSP)', desc:'PSP emulator', cmd:'winget install -e --id PPSSPP.PPSSPP --silent', type:'winget'},
        {name:'Ryujinx (Switch)', desc:'Nintendo Switch emulator', cmd:'winget install -e --id Ryujinx.Ryujinx --silent', type:'winget'},
        {name:'ScummVM', desc:'Classic adventure engine', cmd:'winget install -e --id ScummVM.ScummVM --silent', type:'winget'},
        {name:'MangoHud (Windows)', desc:'N/A on Windows — use RivaTuner/MSI AB', cmd:'# Use MSI Afterburner + RivaTuner Statistics Server for overlay', type:'ps'},
      ]},
    { id:'w-gameengines', icon:'🕹️', title:'GAME ENGINES',
      items:[
        {name:'Godot 4', desc:'Open-source engine — T1NK3R Games', cmd:'winget install -e --id GodotEngine.GodotEngine --silent', type:'winget'},
        {name:'Unreal Engine 5', desc:'UE5 Live Desktop / Chrono-Crest', cmd:'winget install -e --id EpicGames.EpicGamesLauncher --silent', type:'winget'},
        {name:'Blender', desc:'3D modeling / VIGA / Modly', cmd:'winget install -e --id BlenderFoundation.Blender --silent', type:'winget'},
        {name:'Unity Hub', desc:'Unity engine manager', cmd:'winget install -e --id Unity.UnityHub --silent', type:'winget'},
      ]},
    { id:'w-daw', icon:'🎚️', title:'DAWs',
      items:[
        {name:'Reaper', desc:'Lightweight pro DAW — low CPU, best on Windows', cmd:'winget install -e --id Cockos.REAPER --silent', type:'winget'},
        {name:'LMMS', desc:'FL Studio-style beat production', cmd:'winget install -e --id LMMS.LMMS --silent', type:'winget'},
        {name:'Audacity', desc:'Audio editor & recorder', cmd:'winget install -e --id Audacity.Audacity --silent', type:'winget'},
        {name:'Bitwig Studio', desc:'Modern modular DAW', cmd:'# Download installer: bitwig.com/download', type:'ps'},
        {name:'FL Studio Trial', desc:'Classic beat DAW', cmd:'winget install -e --id ImageLine.FLStudio --silent', type:'winget'},
        {name:'Mixxx', desc:'DJ software — T1NK3R.FM', cmd:'winget install -e --id Mixxx.Mixxx --silent', type:'winget'},
      ]},
    { id:'w-audio', icon:'🔊', title:'AUDIO / VST / SYNTHS',
      items:[
        {name:'Surge XT', desc:'Hybrid wavetable synth — free, pro quality', cmd:'winget install -e --id SurgeSynth.SurgeXT --silent', type:'winget'},
        {name:'ASIO4ALL', desc:'Low-latency ASIO driver for Windows audio', cmd:'# Download from asio4all.org', type:'ps'},
        {name:'VB-Cable (Virtual Audio)', desc:'Virtual audio cable — routing between apps', cmd:'# Download from vb-audio.com/Cable', type:'ps'},
        {name:'Voicemeeter Banana', desc:'Advanced audio mixer / virtual cable', cmd:'winget install -e --id VB-Audio.Voicemeeter.Banana --silent', type:'winget'},
        {name:'EQ APO + Peace GUI', desc:'System-wide EQ — replaces EasyEffects', cmd:'choco install -y eqapo', type:'choco'},
        {name:'Hydrogen Drum Machine', desc:'Drum machine / step sequencer', cmd:'winget install -e --id Hydrogen.Hydrogen --silent', type:'winget'},
        {name:'Helm Synth', desc:'Polyphonic VST synth', cmd:'# Download from tytel.org/helm', type:'ps'},
        {name:'Vital Synth', desc:'Spectral wavetable — free tier', cmd:'# Download from vital.audio', type:'ps'},
        {name:'FluidSynth + GM soundfont', desc:'General MIDI synth engine', cmd:'choco install -y fluidsynth', type:'choco'},
      ]},
    { id:'w-media', icon:'📺', title:'MEDIA / T1NK3R.TV',
      items:[
        {name:'VLC', desc:'Universal media player', cmd:'winget install -e --id VideoLAN.VLC --silent', type:'winget'},
        {name:'mpv', desc:'CLI/GPU media player', cmd:'winget install -e --id mpv.net --silent', type:'winget'},
        {name:'yt-dlp', desc:'YouTube downloader', cmd:'winget install -e --id yt-dlp.yt-dlp --silent', type:'winget'},
        {name:'Spotify', desc:'Music streaming', cmd:'winget install -e --id Spotify.Spotify --silent', type:'winget'},
        {name:'Jellyfin Server', desc:'Local media streaming server', cmd:'winget install -e --id Jellyfin.JellyfinServer --silent', type:'winget'},
        {name:'Calibre', desc:'E-book manager', cmd:'winget install -e --id calibre.calibre --silent', type:'winget'},
        {name:'Kodi', desc:'Media center — T1NK3R.TV frontend', cmd:'winget install -e --id XBMCFoundation.Kodi --silent', type:'winget'},
      ]},
    { id:'w-art', icon:'🎨', title:'DIGITAL ART / VIDEO',
      items:[
        {name:'DaVinci Resolve', desc:'Pro video editor — ACE ViMax backend', cmd:'winget install -e --id BlackmagicDesign.DaVinciResolve --silent', type:'winget'},
        {name:'OBS Studio', desc:'Streaming & screen recording', cmd:'winget install -e --id OBSProject.OBSStudio --silent', type:'winget'},
        {name:'Krita', desc:'Professional digital painting', cmd:'winget install -e --id KDE.Krita --silent', type:'winget'},
        {name:'GIMP', desc:'GNU image manipulation', cmd:'winget install -e --id GIMP.GIMP --silent', type:'winget'},
        {name:'Inkscape', desc:'Vector graphics (SVG)', cmd:'winget install -e --id Inkscape.Inkscape --silent', type:'winget'},
        {name:'Blender', desc:'3D modeling / sculpting', cmd:'winget install -e --id BlenderFoundation.Blender --silent', type:'winget'},
        {name:'HandBrake', desc:'Video transcoder', cmd:'winget install -e --id HandBrake.HandBrake --silent', type:'winget'},
        {name:'FFmpeg', desc:'CLI multimedia toolkit', cmd:'winget install -e --id Gyan.FFmpeg --silent', type:'winget'},
      ]},
    { id:'w-writing', icon:'✍️', title:'WRITING / DOCS',
      items:[
        {name:'LibreOffice', desc:'Full office suite', cmd:'winget install -e --id TheDocumentFoundation.LibreOffice --silent', type:'winget'},
        {name:'Obsidian', desc:'Markdown PKM — Tinker-Verse vault', cmd:'winget install -e --id Obsidian.Obsidian --silent', type:'winget'},
        {name:'Notepad++', desc:'Fast text editor', cmd:'winget install -e --id Notepad++.Notepad++ --silent', type:'winget'},
      ]},
    { id:'w-network', icon:'🌐', title:'NETWORKING / SECURITY',
      items:[
        {name:'Tailscale', desc:'Mesh VPN — cluster access', cmd:'winget install -e --id tailscale.tailscale --silent', type:'winget'},
        {name:'WireGuard', desc:'Modern VPN', cmd:'winget install -e --id WireGuard.WireGuard --silent', type:'winget'},
        {name:'Wireshark', desc:'Network protocol analyzer', cmd:'winget install -e --id WiresharkFoundation.Wireshark --silent', type:'winget'},
        {name:'Nmap', desc:'Network scanner', cmd:'winget install -e --id Insecure.Nmap --silent', type:'winget'},
        {name:'PuTTY', desc:'SSH client for Windows', cmd:'winget install -e --id PuTTY.PuTTY --silent', type:'winget'},
      ]},
    { id:'w-creai', icon:'🤖', title:'CREATIVE AI / ACE STACK',
      items:[
        {name:'ComfyUI', desc:'Node-based Stable Diffusion — most powerful', cmd:'git clone https://github.com/comfyanonymous/ComfyUI.git %USERPROFILE%\\tinker-verse\\comfyui && cd %USERPROFILE%\\tinker-verse\\comfyui && python -m venv venv && venv\\Scripts\\activate && pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121 && pip install -r requirements.txt', type:'manual'},
        {name:'Fooocus', desc:'Easy high-quality local image gen', cmd:'git clone https://github.com/lllyasviel/Fooocus.git %USERPROFILE%\\tinker-verse\\fooocus && cd %USERPROFILE%\\tinker-verse\\fooocus && python -m venv venv && venv\\Scripts\\activate && pip install -r requirements_versions.txt', type:'manual'},
        {name:'Stable Diffusion WebUI Forge', desc:'Modern A1111 with video support', cmd:'git clone https://github.com/lllyasviel/stable-diffusion-webui-forge.git %USERPROFILE%\\tinker-verse\\sd-forge', type:'manual'},
        {name:'InvokeAI', desc:'Clean professional SD interface', cmd:'pip install InvokeAI', type:'ps'},
        {name:'ACE-Step UI', desc:'ACE music generation step UI', cmd:'git clone https://github.com/ace-step/ACE-Step.git %USERPROFILE%\\tinker-verse\\ace-step && cd %USERPROFILE%\\tinker-verse\\ace-step && python -m venv venv && venv\\Scripts\\activate && pip install -r requirements.txt', type:'manual'},
        {name:'FreeMoCap', desc:'Markerless motion capture — ACE Visual', cmd:'pip install freemocap', type:'ps'},
        {name:'text-generation-webui', desc:'Oobabooga — local model chat UI', cmd:'git clone https://github.com/oobabooga/text-generation-webui.git %USERPROFILE%\\tinker-verse\\text-gen-webui', type:'manual'},
        {name:'Diffusers (HuggingFace)', desc:'Core AI image library', cmd:'pip install diffusers transformers accelerate safetensors', type:'ps'},
      ]},
    { id:'w-homelab', icon:'🏠', title:'HOMELAB / SELF-HOSTED',
      items:[
        {name:'Portainer', desc:'Docker web UI — manage all containers', cmd:'docker run -d -p 9000:9000 --name portainer --restart always -v //./pipe/docker_engine:/var/run/docker.sock -v portainer_data:/data portainer/portainer-ce', type:'ps'},
        {name:'Jellyfin Server', desc:'Local media server — T1NK3R.TV backend', cmd:'winget install -e --id Jellyfin.JellyfinServer --silent', type:'winget'},
        {name:'Vaultwarden', desc:'Self-hosted Bitwarden', cmd:'docker run -d -p 8222:80 --name vaultwarden --restart unless-stopped -v %USERPROFILE%\\vaultwarden:/data vaultwarden/server:latest', type:'ps'},
        {name:'Nextcloud AIO', desc:'Full private cloud — Docker', cmd:'docker run -d -p 8080:8080 --name nextcloud-aio-mastercontainer --restart always -v nextcloud_aio_mastercontainer:/mnt/docker-aio-config -v //./pipe/docker_engine:/var/run/docker.sock nextcloud/all-in-one:latest', type:'ps'},
        {name:'Uptime Kuma', desc:'Monitoring dashboard', cmd:'docker run -d -p 3002:3001 --name uptime-kuma --restart unless-stopped -v uptime-kuma:/app/data louislam/uptime-kuma:1', type:'ps'},
        {name:'AnythingLLM', desc:'RAG + LLM front-end', cmd:'docker run -d -p 3003:3001 --name anythingllm --restart unless-stopped mintplexlabs/anythingllm', type:'ps'},
        {name:'TaxHacker', desc:'Sovereign tax AI — port 7331', cmd:'docker run -d -p 7331:7331 --name taxhacker --restart unless-stopped -e OLLAMA_HOST=host.docker.internal taxhacker/taxhacker', type:'ps'},
      ]},
    { id:'w-upgrades', icon:'⬆️', title:'UPGRADES / SYSTEM UPDATES',
      items:[
        {name:'Winget Upgrade All', desc:'Update all winget packages', cmd:'winget upgrade --all --silent', type:'ps'},
        {name:'Chocolatey Upgrade All', desc:'Update all choco packages', cmd:'choco upgrade all -y', type:'ps'},
        {name:'Claude Code Upgrade', desc:'Upgrade Hermes CLI', cmd:'npm update -g @anthropic-ai/claude-code', type:'ps'},
        {name:'Gemini CLI Upgrade', desc:'Upgrade Gemini CLI', cmd:'npm update -g @google/gemini-cli', type:'ps'},
        {name:'Ollama Upgrade', desc:'Reinstall to latest build', cmd:'winget upgrade -e --id Ollama.Ollama --silent', type:'winget'},
        {name:'pip Upgrade All', desc:'Upgrade all pip packages', cmd:'pip list --outdated --format=freeze | %{$_.split("==")[0]} | ForEach-Object {pip install --upgrade $_}', type:'ps'},
        {name:'Docker Pull Latest Images', desc:'Refresh all running container images', cmd:'docker ps --format "{{.Image}}" | ForEach-Object { docker pull $_ }', type:'ps'},
        {name:'WSL Update', desc:'Update WSL kernel', cmd:'wsl --update', type:'ps'},
      ]},
    { id:'w-crosstech', icon:'🔗', title:'CROSS-TECH EXTENSIONS',
      items:[
        {name:'HexaMedia Studio setup', desc:'Windows-side HexaMedia project dir', cmd:'New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\\HexaMedia"', type:'ps'},
        {name:'OpenRouter env (Windows)', desc:'Set OR key in user environment', cmd:'[System.Environment]::SetEnvironmentVariable("OPENROUTER_API_KEY","your-key-here","User")', type:'ps'},
        {name:'ANTHROPIC_API_KEY env', desc:'Set Claude API key in user env', cmd:'[System.Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY","your-key-here","User")', type:'ps'},
        {name:'WSL2 CachyOS bridge alias', desc:'Quick SSH into CachyOS from Windows', cmd:'# Add to PowerShell profile: function cachy { ssh tinkerv@192.168.1.138 }', type:'manual'},
        {name:'Tailscale mesh join', desc:'Join T1NK3R cluster mesh VPN', cmd:'tailscale up', type:'ps'},
        {name:'tinker-verse dir structure', desc:'Create canonical project dirs', cmd:'New-Item -ItemType Directory -Force "$env:USERPROFILE\\tinker-verse\\ai","$env:USERPROFILE\\tinker-verse\\games","$env:USERPROFILE\\tinker-verse\\luna"', type:'ps'},
      ]},
  ],

  cachy: [
    { id:'c-bootstrap', icon:'🔧', title:'BOOTSTRAP (AUTO-RUNS FIRST)',
      items:[
        {name:'base-devel + git', desc:'Prerequisite for yay / AUR builds', cmd:'sudo pacman -S --needed --noconfirm base-devel git', type:'pacman'},
        {name:'yay AUR helper', desc:'Auto-installed if missing', cmd:'# Auto-detected in script', type:'aur'},
        {name:'Flatpak + Flathub', desc:'App runtime', cmd:'sudo pacman -S --needed --noconfirm flatpak && flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo', type:'pacman'},
        {name:'pipx', desc:'Isolated Python tool runner', cmd:'sudo pacman -S --needed --noconfirm python-pipx && pipx ensurepath', type:'pacman'},
        {name:'nvm → Node LTS', desc:'Required for CLI AI tools', cmd:'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash && source ~/.bashrc && nvm install --lts', type:'manual'},
        {name:'Rust + Cargo', desc:'Required for RTK, Yazi, Bevy', cmd:'curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y && source $HOME/.cargo/env', type:'manual'},
        {name:'zsh + Oh My Zsh', desc:'Better shell', cmd:'sudo pacman -S --needed --noconfirm zsh && sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"', type:'manual'},
      ]},
    { id:'c-cliai', icon:'🖥️', title:'CLI AI TOOLS',
      items:[
        {name:'Claude Code (Hermes)', desc:'Primary agentic coding CLI v2.1.138+', cmd:'npm install -g @anthropic-ai/claude-code', type:'npm'},
        {name:'Gemini CLI', desc:'Google Gemini — codegen layer', cmd:'npm install -g @google/gemini-cli', type:'npm'},
        {name:'OpenAI Codex CLI', desc:'OpenAI Codex — OpenRouter Tier 1', cmd:'npm install -g @openai/codex', type:'npm'},
        {name:'OpenCode', desc:'Open-source multi-provider AI CLI', cmd:'npm install -g opencode-ai', type:'npm'},
        {name:'Aider', desc:'AI pair programmer — git-aware', cmd:'pipx install aider-chat', type:'pip'},
        {name:'Shell-GPT', desc:'LLM queries in terminal', cmd:'pipx install shell-gpt', type:'pip'},
        {name:'LLM (Willison)', desc:'Universal LLM CLI', cmd:'pipx install llm', type:'pip'},
        {name:'RTK', desc:'Token compression for Claude Code', cmd:'cargo install rtk && rtk init -g', type:'cargo'},
        {name:'Yazi File Manager', desc:'Iron Works themed Rust terminal FM', cmd:'cargo install yazi-fm', type:'cargo'},
        {name:'claude-mem plugin', desc:'Persistent memory for Claude Code', cmd:'# In Claude Code: /plugin install thedotmack/claude-mem', type:'manual'},
      ]},
    { id:'c-sovereign', icon:'🛡️', title:'SOVEREIGN STACK',
      items:[
        {name:'Ollama 0.17.1+', desc:'Local LLM — CVE-2026-7482 patched', cmd:'sudo pacman -S --needed --noconfirm ollama && sudo systemctl enable --now ollama', type:'pacman'},
        {name:'Docker CE', desc:'Container engine', cmd:'sudo pacman -S --needed --noconfirm docker docker-compose && sudo systemctl enable --now docker && sudo usermod -aG docker $USER', type:'pacman'},
        {name:'Open WebUI', desc:'Browser UI for Ollama — port 3000', cmd:'docker run -d -p 3000:8080 --add-host=host.docker.internal:host-gateway -v open-webui:/app/backend/data --name open-webui --restart always ghcr.io/open-webui/open-webui:main', type:'manual'},
        {name:'LocalSend', desc:'Sovereign LAN file transfer', cmd:'flatpak install -y flathub org.localsend.localsend_app', type:'flatpak'},
        {name:'Tailscale', desc:'Mesh VPN — cluster access', cmd:'yay -S --needed --noconfirm tailscale && sudo systemctl enable --now tailscaled', type:'aur'},
        {name:'Porcupine Wake Word', desc:'"Hey Alfred" wake engine', cmd:'pipx install pvporcupine', type:'pip'},
        {name:'Whisper STT', desc:'Local speech recognition', cmd:'pipx install openai-whisper', type:'pip'},
        {name:'Piper TTS', desc:'Local neural TTS', cmd:'pipx install piper-tts', type:'pip'},
      ]},
    { id:'c-companions', icon:'🤝', title:'COMPANION MODELS',
      items:[
        {name:'Alfred — qwen3:8b', desc:'Always warm', cmd:'ollama pull qwen3:8b', type:'ollama'},
        {name:'Steward — deepseek-r1:14b', desc:'Always warm', cmd:'ollama pull deepseek-r1:14b', type:'ollama'},
        {name:'Scout — llama3.2:3b', desc:'Always warm', cmd:'ollama pull llama3.2:3b', type:'ollama'},
        {name:'Daisy — gemma2:2b', desc:'Safe Space support', cmd:'ollama pull gemma2:2b', type:'ollama'},
        {name:'Coach — llama3.2:3b', desc:'Motivation', cmd:'ollama pull llama3.2:3b', type:'ollama'},
        {name:'Spark — phi3.5:latest', desc:'Inspiration engine', cmd:'ollama pull phi3.5:latest', type:'ollama'},
        {name:'Solace — llama3.2:1b', desc:'Deep creative voice', cmd:'ollama pull llama3.2:1b', type:'ollama'},
        {name:'Sage — phi4:14b', desc:'Knowledge layer', cmd:'ollama pull phi4:14b', type:'ollama'},
        {name:'Luna — gemma2:2b', desc:'P.A.W.S. / living systems', cmd:'ollama pull gemma2:2b', type:'ollama'},
        {name:'Tink — qwen2.5vl:7b', desc:'Ward — vision-capable', cmd:'ollama pull qwen2.5vl:7b', type:'ollama'},
        {name:'Wren — qwen2.5:1.5b', desc:'Ward', cmd:'ollama pull qwen2.5:1.5b', type:'ollama'},
        {name:'Qwen — qwen2.5:3b', desc:'Ward', cmd:'ollama pull qwen2.5:3b', type:'ollama'},
        {name:'Remy — smollm2:1.7b', desc:'Ward — lightweight', cmd:'ollama pull smollm2:1.7b', type:'ollama'},
        {name:'moondream', desc:'Vision / daydreaming utility model', cmd:'ollama pull moondream', type:'ollama'},
        {name:'nomic-embed-text', desc:'RAG embeddings', cmd:'ollama pull nomic-embed-text', type:'ollama'},
      ]},
    { id:'c-audio', icon:'🔊', title:'AUDIO CORE / PIPEWIRE',
      items:[
        {name:'PipeWire Full Stack', desc:'Main audio engine — JACK bridge + ALSA compat', cmd:'sudo pacman -S --needed --noconfirm pipewire pipewire-jack pipewire-alsa pipewire-pulse wireplumber', type:'pacman'},
        {name:'qpwgraph', desc:'PipeWire visual patchbay', cmd:'sudo pacman -S --needed --noconfirm qpwgraph', type:'pacman'},
        {name:'Carla Plugin Host', desc:'VST/LV2 host — run any plugin standalone', cmd:'sudo pacman -S --needed --noconfirm carla', type:'pacman'},
        {name:'EasyEffects', desc:'System audio effects — EQ/compression', cmd:'flatpak install -y flathub com.github.wwmm.easyeffects', type:'flatpak'},
        {name:'realtime-privileges', desc:'Low-latency audio scheduling', cmd:'sudo pacman -S --needed --noconfirm realtime-privileges && sudo usermod -aG realtime $USER', type:'pacman'},
        {name:'ALSA Utils', desc:'alsamixer, aplay, arecord', cmd:'sudo pacman -S --needed --noconfirm alsa-utils alsa-tools', type:'pacman'},
        {name:'Sonobus', desc:'P2P audio streaming — live sessions', cmd:'flatpak install -y flathub net.sonobus.SonoBus', type:'flatpak'},
      ]},
    { id:'c-daw', icon:'🎚️', title:'DAWs',
      items:[
        {name:'Ardour 8', desc:'Pro Linux DAW', cmd:'sudo pacman -S --needed --noconfirm ardour', type:'pacman'},
        {name:'LMMS', desc:'Beat/melody production', cmd:'sudo pacman -S --needed --noconfirm lmms', type:'pacman'},
        {name:'Zrythm', desc:'Modern FOSS DAW — Bitwig-inspired', cmd:'flatpak install -y flathub org.zrythm.Zrythm', type:'flatpak'},
        {name:'Reaper', desc:'Lightweight pro DAW — WINE or native', cmd:'# Download installer: reaper.fm/download.php', type:'manual'},
        {name:'Bitwig Studio', desc:'Modern modular DAW — Linux native', cmd:'# Download .deb from bitwig.com/download', type:'manual'},
        {name:'Mixxx', desc:'DJ software — T1NK3R.FM', cmd:'sudo pacman -S --needed --noconfirm mixxx', type:'pacman'},
        {name:'Audacity', desc:'Audio editor', cmd:'flatpak install -y flathub org.audacityteam.Audacity', type:'flatpak'},
      ]},
    { id:'c-synths', icon:'🎹', title:'SYNTHS / INSTRUMENTS',
      items:[
        {name:'Surge XT', desc:'Hybrid wavetable synth — free, pro quality', cmd:'sudo pacman -S --needed --noconfirm surge-xt', type:'pacman'},
        {name:'Helm Synth', desc:'Polyphonic VST synth', cmd:'sudo pacman -S --needed --noconfirm helm', type:'pacman'},
        {name:'ZynAddSubFX', desc:'Powerful additive/subtractive synth', cmd:'sudo pacman -S --needed --noconfirm zynaddsubfx', type:'pacman'},
        {name:'Sfizz (SFZ player)', desc:'SFZ/SF2 sample player', cmd:'sudo pacman -S --needed --noconfirm sfizz', type:'pacman'},
        {name:'FluidSynth + GM font', desc:'General MIDI engine + soundfont', cmd:'sudo pacman -S --needed --noconfirm fluidsynth soundfont-fluid', type:'pacman'},
        {name:'Vital Synth', desc:'Spectral wavetable — free tier', cmd:'# Download from vital.audio', type:'manual'},
        {name:'Geonkick', desc:'Kick drum synthesizer', cmd:'sudo pacman -S --needed --noconfirm geonkick', type:'pacman'},
        {name:'Yoshimi', desc:'ZynAddSubFX fork — advanced MIDI', cmd:'sudo pacman -S --needed --noconfirm yoshimi', type:'pacman'},
      ]},
    { id:'c-drums', icon:'🥁', title:'DRUMS / SAMPLERS / BEATS',
      items:[
        {name:'Hydrogen', desc:'Advanced drum machine — step sequencer', cmd:'sudo pacman -S --needed --noconfirm hydrogen', type:'pacman'},
        {name:'DrumGizmo', desc:'Multi-mic drum plugin — studio realism', cmd:'sudo pacman -S --needed --noconfirm drumgizmo', type:'pacman'},
        {name:'Luppp', desc:'Live loop machine — Ableton-style looping', cmd:'sudo pacman -S --needed --noconfirm luppp', type:'pacman'},
        {name:'GIADA', desc:'Minimal loop machine + sampler', cmd:'sudo pacman -S --needed --noconfirm giada', type:'pacman'},
        {name:'Sooperlooper', desc:'Infinite loop machine — live looping', cmd:'sudo pacman -S --needed --noconfirm sooperlooper', type:'pacman'},
        {name:'Seq66', desc:'MIDI sequencer — live pattern performance', cmd:'sudo pacman -S --needed --noconfirm seq66', type:'pacman'},
        {name:'LinuxSampler', desc:'Professional sampler engine', cmd:'sudo pacman -S --needed --noconfirm linuxsampler', type:'pacman'},
      ]},
    { id:'c-fx', icon:'🎛️', title:'AUDIO FX PLUGINS',
      items:[
        {name:'LSP Plugins', desc:'Pro LV2 suite — compressors, EQ, dynamics', cmd:'sudo pacman -S --needed --noconfirm lsp-plugins', type:'pacman'},
        {name:'Calf Studio Gear', desc:'27 LV2 plugins — EQ, chorus, rotary', cmd:'sudo pacman -S --needed --noconfirm calf', type:'pacman'},
        {name:'Dragonfly Reverb', desc:'Hall/room/plate reverb collection', cmd:'yay -S --needed --noconfirm dragonfly-reverb', type:'aur'},
        {name:'x42 Plugins', desc:'MIDI utility + pro meters', cmd:'sudo pacman -S --needed --noconfirm x42-plugins', type:'pacman'},
        {name:'Guitarix', desc:'Guitar amp simulator', cmd:'sudo pacman -S --needed --noconfirm guitarix', type:'pacman'},
        {name:'yabridge', desc:'Windows VST2/VST3 bridge on Linux', cmd:'yay -S --needed --noconfirm yabridge yabridgectl', type:'aur'},
        {name:'LADSPA plugins', desc:'Classic plugin collection', cmd:'sudo pacman -S --needed --noconfirm ladspa swh-plugins', type:'pacman'},
      ]},
    { id:'c-gaming', icon:'🎮', title:'GAMING',
      items:[
        {name:'Steam', desc:'PC gaming — Proton built-in', cmd:'sudo pacman -S --needed --noconfirm steam', type:'pacman'},
        {name:'Heroic Launcher', desc:'Epic / GOG / Amazon', cmd:'flatpak install -y flathub com.heroicgameslauncher.hgl', type:'flatpak'},
        {name:'Lutris', desc:'Unified game manager — Wine/Proton/native', cmd:'sudo pacman -S --needed --noconfirm lutris', type:'pacman'},
        {name:'Bottles', desc:'Wine bottle manager', cmd:'flatpak install -y flathub com.usebottles.bottles', type:'flatpak'},
        {name:'Wine Staging', desc:'Windows compat layer', cmd:'sudo pacman -S --needed --noconfirm wine-staging winetricks', type:'pacman'},
        {name:'MangoHud', desc:'In-game performance overlay', cmd:'sudo pacman -S --needed --noconfirm mangohud lib32-mangohud', type:'pacman'},
        {name:'GameMode', desc:'CPU/GPU governor daemon', cmd:'sudo pacman -S --needed --noconfirm gamemode lib32-gamemode', type:'pacman'},
        {name:'Gamescope', desc:'Micro-compositor — resolution scaling', cmd:'sudo pacman -S --needed --noconfirm gamescope', type:'pacman'},
        {name:'ProtonUp-Qt', desc:'Manage Proton-GE builds', cmd:'flatpak install -y flathub net.davidotek.pupgui2', type:'flatpak'},
        {name:'vkBasalt', desc:'Vulkan post-processing — reshade alt', cmd:'sudo pacman -S --needed --noconfirm vkbasalt', type:'pacman'},
        {name:'RetroArch', desc:'Multi-system emulator frontend', cmd:'flatpak install -y flathub org.libretro.RetroArch', type:'flatpak'},
        {name:'RPCS3 (PS3)', desc:'PlayStation 3 emulator', cmd:'flatpak install -y flathub net.rpcs3.RPCS3', type:'flatpak'},
        {name:'PCSX2 (PS2)', desc:'PlayStation 2 emulator', cmd:'flatpak install -y flathub net.pcsx2.PCSX2', type:'flatpak'},
        {name:'Dolphin (GC/Wii)', desc:'Nintendo GameCube/Wii emulator', cmd:'flatpak install -y flathub org.DolphinEmu.dolphin-emu', type:'flatpak'},
        {name:'Ryujinx (Switch)', desc:'Nintendo Switch emulator', cmd:'flatpak install -y flathub org.ryujinx.Ryujinx', type:'flatpak'},
        {name:'PPSSPP (PSP)', desc:'PSP emulator', cmd:'flatpak install -y flathub org.ppsspp.PPSSPP', type:'flatpak'},
        {name:'DuckStation (PS1)', desc:'Best PS1 emulator', cmd:'flatpak install -y flathub org.duckstation.DuckStation', type:'flatpak'},
        {name:'MAME', desc:'Arcade machine emulator', cmd:'sudo pacman -S --needed --noconfirm mame', type:'pacman'},
        {name:'ScummVM', desc:'Classic point-and-click engine', cmd:'sudo pacman -S --needed --noconfirm scummvm', type:'pacman'},
      ]},
    { id:'c-rocm', icon:'🔴', title:'ROCm / AMD GPU (RX 6600)',
      items:[
        {name:'ROCm Core', desc:'AMD GPU compute stack — RDNA2', cmd:'sudo pacman -S --needed --noconfirm rocm-opencl-runtime rocm-device-libs hip-runtime-amd rocm-smi-lib', type:'pacman'},
        {name:'HSA Override (RX 6600)', desc:'RDNA2 GFX version fix', cmd:'echo "export HSA_OVERRIDE_GFX_VERSION=10.3.0" >> ~/.bashrc && source ~/.bashrc', type:'manual'},
        {name:'PyTorch (ROCm)', desc:'Deep learning w/ AMD GPU', cmd:'pipx install torch --index-url https://download.pytorch.org/whl/rocm6.1', type:'pip'},
        {name:'clinfo', desc:'OpenCL info', cmd:'sudo pacman -S --needed --noconfirm clinfo', type:'pacman'},
      ]},
    { id:'c-dev', icon:'💻', title:'DEVELOPMENT',
      items:[
        {name:'VS Code', desc:'Primary editor', cmd:'flatpak install -y flathub com.visualstudio.code', type:'flatpak'},
        {name:'Neovim', desc:'Hyperextensible Vim fork', cmd:'sudo pacman -S --needed --noconfirm neovim', type:'pacman'},
        {name:'GitHub CLI', desc:'GitHub from terminal — kalifurd', cmd:'sudo pacman -S --needed --noconfirm github-cli', type:'pacman'},
        {name:'Docker Compose', desc:'Multi-container orchestration', cmd:'sudo pacman -S --needed --noconfirm docker-compose', type:'pacman'},
        {name:'tmux', desc:'Terminal multiplexer', cmd:'sudo pacman -S --needed --noconfirm tmux', type:'pacman'},
        {name:'bat / fd / ripgrep / fzf', desc:'Modern CLI replacements', cmd:'sudo pacman -S --needed --noconfirm bat fd ripgrep fzf eza lazygit', type:'pacman'},
        {name:'Kitty Terminal', desc:'GPU-accelerated terminal — primary T1NK3R terminal', cmd:'sudo pacman -S --needed --noconfirm kitty', type:'pacman'},
        {name:'KiCad 8', desc:'PCB & schematic EDA', cmd:'sudo pacman -S --needed --noconfirm kicad kicad-library', type:'pacman'},
        {name:'OpenSCAD', desc:'Script-based 3D modeling', cmd:'sudo pacman -S --needed --noconfirm openscad', type:'pacman'},
        {name:'FreeCAD', desc:'Parametric 3D CAD', cmd:'sudo pacman -S --needed --noconfirm freecad', type:'pacman'},
        {name:'Timeshift', desc:'System snapshots', cmd:'sudo pacman -S --needed --noconfirm timeshift', type:'pacman'},
        {name:'Wireshark', desc:'Network analyzer', cmd:'sudo pacman -S --needed --noconfirm wireshark-qt', type:'pacman'},
      ]},
    { id:'c-art', icon:'🎨', title:'ART / VIDEO',
      items:[
        {name:'Blender', desc:'3D modeling — VIGA/Modly', cmd:'flatpak install -y flathub org.blender.Blender', type:'flatpak'},
        {name:'Krita', desc:'Digital painting', cmd:'sudo pacman -S --needed --noconfirm krita', type:'pacman'},
        {name:'GIMP', desc:'Image editor', cmd:'sudo pacman -S --needed --noconfirm gimp', type:'pacman'},
        {name:'Inkscape', desc:'Vector graphics', cmd:'sudo pacman -S --needed --noconfirm inkscape', type:'pacman'},
        {name:'DaVinci Resolve', desc:'Pro video editor — ACE ViMax', cmd:'yay -S --needed --noconfirm davinci-resolve', type:'aur'},
        {name:'OBS Studio', desc:'Streaming & recording', cmd:'sudo pacman -S --needed --noconfirm obs-studio', type:'pacman'},
        {name:'Kdenlive', desc:'NLE video editor', cmd:'flatpak install -y flathub org.kde.kdenlive', type:'flatpak'},
        {name:'FFmpeg', desc:'CLI multimedia toolkit', cmd:'sudo pacman -S --needed --noconfirm ffmpeg', type:'pacman'},
        {name:'OrcaSlicer', desc:'Bambu P1S slicer', cmd:'flatpak install -y flathub com.softfever.OrcaSlicer', type:'flatpak'},
      ]},
    { id:'c-creai', icon:'🤖', title:'CREATIVE AI / ACE STACK',
      items:[
        {name:'ComfyUI (ROCm)', desc:'Node-based SD — AMD RX 6600 accelerated', cmd:'git clone https://github.com/comfyanonymous/ComfyUI.git ~/tinker-verse/comfyui && cd ~/tinker-verse/comfyui && python -m venv venv && source venv/bin/activate && pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/rocm6.1 && pip install -r requirements.txt', type:'manual'},
        {name:'Fooocus (ROCm)', desc:'Easy high-quality image gen — AMD GPU', cmd:'git clone https://github.com/lllyasviel/Fooocus.git ~/tinker-verse/fooocus && cd ~/tinker-verse/fooocus && python -m venv venv && source venv/bin/activate && HSA_OVERRIDE_GFX_VERSION=10.3.0 pip install -r requirements_versions.txt', type:'manual'},
        {name:'Stable Diffusion WebUI Forge', desc:'Modern A1111 — AMD ROCm path', cmd:'git clone https://github.com/lllyasviel/stable-diffusion-webui-forge.git ~/tinker-verse/sd-forge && cd ~/tinker-verse/sd-forge && python -m venv venv && source venv/bin/activate && pip install -r requirements_versions.txt', type:'manual'},
        {name:'InvokeAI', desc:'Clean professional SD interface', cmd:'pipx install invokeai', type:'pip'},
        {name:'ACE-Step UI', desc:'ACE music generation step UI — Zeth collab', cmd:'git clone https://github.com/ace-step/ACE-Step.git ~/tinker-verse/ace-step && cd ~/tinker-verse/ace-step && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt', type:'manual'},
        {name:'FreeMoCap', desc:'Markerless motion capture — ACE Visual layer', cmd:'python3 -m venv ~/tinker-verse/freemocap-env && source ~/tinker-verse/freemocap-env/bin/activate && pip install freemocap', type:'manual'},
        {name:'FLUX.2 (via ComfyUI)', desc:'Next-gen image model — install via ComfyUI model manager', cmd:'# After ComfyUI running: download flux1-dev.safetensors to models/checkpoints/', type:'manual'},
        {name:'text-generation-webui', desc:'Oobabooga — already on Ventoy float', cmd:'cd ~/tinker-verse && git clone https://github.com/oobabooga/text-generation-webui.git && cd text-generation-webui && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt', type:'manual'},
        {name:'VIGA (Video Gen)', desc:'AI video generation — ACE Visual', cmd:'pipx install viga || git clone https://github.com/viga-ai/viga ~/tinker-verse/viga', type:'pip'},
        {name:'Modly', desc:'3D AI generation — ACE Visual/Blender bridge', cmd:'# Install via Blender addon manager or: git clone https://github.com/modly-ai/modly ~/tinker-verse/modly', type:'manual'},
        {name:'ViMax (DaVinci bridge)', desc:'ACE video layer — DaVinci Resolve voice API', cmd:'# Setup after DaVinci Resolve: pip install vimax-client', type:'manual'},
        {name:'Diffusers (HuggingFace)', desc:'Core AI image library', cmd:'pipx install diffusers transformers accelerate safetensors', type:'pip'},
        {name:'Face Fusion', desc:'Face swap + enhancement', cmd:'git clone https://github.com/facefusion/facefusion.git ~/tinker-verse/facefusion && cd ~/tinker-verse/facefusion && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt', type:'manual'},
      ]},
    { id:'c-engines', icon:'🕹️', title:'GAME ENGINES / 3D',
      items:[
        {name:'Godot 4.6.2', desc:'T1NK3R Games — TinkerP4int, all 12 titles', cmd:'sudo pacman -S --needed --noconfirm godot', type:'pacman'},
        {name:'Godot 4 (Flatpak — latest)', desc:'Flatpak build — more up to date', cmd:'flatpak install -y flathub org.godotengine.Godot', type:'flatpak'},
        {name:'Unreal Engine 5', desc:'UE5 Live Desktop / alfred_ue5_desktop framework', cmd:'# Install via Epic Games Store on Windows, or: yay -S --needed --noconfirm unreal-engine', type:'aur'},
        {name:'Unity Hub', desc:'Unity engine manager', cmd:'yay -S --needed --noconfirm unityhub', type:'aur'},
        {name:'Bevy Engine (Rust)', desc:'ECS game engine — T1NK3R Rust games', cmd:'cargo install bevy', type:'cargo'},
        {name:'LÖVE 2D', desc:'Lightweight Lua game framework', cmd:'sudo pacman -S --needed --noconfirm love', type:'pacman'},
        {name:'OpenSCAD', desc:'Script 3D modeling — enclosure design', cmd:'sudo pacman -S --needed --noconfirm openscad', type:'pacman'},
        {name:'FreeCAD', desc:'Parametric 3D CAD — mechanical design', cmd:'sudo pacman -S --needed --noconfirm freecad', type:'pacman'},
        {name:'KiCad 8', desc:'PCB/schematic EDA — T1NK3R hardware', cmd:'sudo pacman -S --needed --noconfirm kicad kicad-library kicad-footprints', type:'pacman'},
      ]},
    { id:'c-homelab', icon:'🏠', title:'HOMELAB / SELF-HOSTED',
      items:[
        {name:'Portainer', desc:'Docker web UI — manage all containers', cmd:'docker run -d -p 9000:9000 --name portainer --restart always -v /var/run/docker.sock:/var/run/docker.sock -v portainer_data:/data portainer/portainer-ce', type:'manual'},
        {name:'Immich', desc:'Self-hosted Google Photos', cmd:'mkdir -p ~/tinker-verse/immich && cd ~/tinker-verse/immich && wget https://github.com/immich-app/immich/releases/latest/download/docker-compose.yml && docker compose up -d', type:'manual'},
        {name:'Nextcloud AIO', desc:'Full private cloud', cmd:'docker run -d -p 8080:8080 --name nextcloud-aio-mastercontainer --restart always -v nextcloud_aio_mastercontainer:/mnt/docker-aio-config -v /var/run/docker.sock:/var/run/docker.sock nextcloud/all-in-one:latest', type:'manual'},
        {name:'Jellyfin', desc:'Local media server — T1NK3R.TV backend', cmd:'docker run -d -p 8096:8096 --name jellyfin --restart unless-stopped -v ~/jellyfin/config:/config -v ~/jellyfin/cache:/cache -v /mnt:/media jellyfin/jellyfin', type:'manual'},
        {name:'Vaultwarden', desc:'Self-hosted Bitwarden password manager', cmd:'docker run -d -p 8222:80 --name vaultwarden --restart unless-stopped -v ~/vaultwarden:/data vaultwarden/server:latest', type:'manual'},
        {name:'Gitea', desc:'Self-hosted Git — sovereign codebase mirror', cmd:'docker run -d -p 3001:3000 -p 222:22 --name gitea --restart unless-stopped -v ~/gitea:/data gitea/gitea:latest', type:'manual'},
        {name:'Uptime Kuma', desc:'Self-hosted monitoring dashboard', cmd:'docker run -d -p 3002:3001 --name uptime-kuma --restart unless-stopped -v uptime-kuma:/app/data louislam/uptime-kuma:1', type:'manual'},
        {name:'Nginx Proxy Manager', desc:'Reverse proxy + SSL for all services', cmd:'docker run -d -p 80:80 -p 81:81 -p 443:443 --name nginx-proxy-manager --restart unless-stopped -v ~/nginx-pm/data:/data -v ~/nginx-pm/letsencrypt:/etc/letsencrypt jc21/nginx-proxy-manager:latest', type:'manual'},
        {name:'TaxHacker', desc:'Sovereign tax AI — port 7331, Ollama/mistral', cmd:'# Already installed at port 7331. Verify: docker ps | grep taxhacker', type:'manual'},
        {name:'AnythingLLM', desc:'RAG + LLM front-end', cmd:'docker run -d -p 3003:3001 --name anythingllm --restart unless-stopped -e STORAGE_DIR=/app/server/storage -v ~/anythingllm:/app/server/storage mintplexlabs/anythingllm', type:'manual'},
        {name:'PrivateGPT', desc:'100% local RAG — no cloud', cmd:'git clone https://github.com/zylon-ai/private-gpt ~/tinker-verse/privategpt && cd ~/tinker-verse/privategpt && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt', type:'manual'},
      ]},
    { id:'c-sdr', icon:'📡', title:'SDR / RF / T1NK3R.FM',
      items:[
        {name:'SigDigger', desc:'SDR signal analyzer — T1NK3R.FM (already installed)', cmd:'sudo pacman -S --needed --noconfirm sigdigger', type:'pacman'},
        {name:'GNU Radio', desc:'SDR processing framework', cmd:'sudo pacman -S --needed --noconfirm gnuradio', type:'pacman'},
        {name:'GQRX', desc:'SDR receiver GUI — RTL-SDR', cmd:'sudo pacman -S --needed --noconfirm gqrx', type:'pacman'},
        {name:'RTL-SDR drivers', desc:'USB SDR dongle support', cmd:'sudo pacman -S --needed --noconfirm rtl-sdr', type:'pacman'},
        {name:'SDR++', desc:'Cross-platform SDR receiver', cmd:'yay -S --needed --noconfirm sdrpp', type:'aur'},
        {name:'direwolf', desc:'AX.25 packet radio / APRS', cmd:'sudo pacman -S --needed --noconfirm direwolf', type:'pacman'},
        {name:'dump1090', desc:'ADS-B aircraft decoder', cmd:'yay -S --needed --noconfirm dump1090', type:'aur'},
      ]},
    { id:'c-3dprint', icon:'🖨️', title:'3D PRINTING / BAMBU P1S',
      items:[
        {name:'OrcaSlicer', desc:'Bambu P1S native slicer', cmd:'flatpak install -y flathub com.softfever.OrcaSlicer', type:'flatpak'},
        {name:'PrusaSlicer', desc:'Alternative slicer — Prusa/generic printers', cmd:'flatpak install -y flathub com.prusa3d.PrusaSlicer', type:'flatpak'},
        {name:'Cura', desc:'Ultimaker slicer — broad profile library', cmd:'flatpak install -y flathub com.ultimaker.cura', type:'flatpak'},
        {name:'OpenSCAD', desc:'Script-based model generator', cmd:'sudo pacman -S --needed --noconfirm openscad', type:'pacman'},
        {name:'Meshmixer', desc:'Mesh repair / support gen', cmd:'# Download from Autodesk — Wine compatible', type:'manual'},
        {name:'Sculpfun Laser Control', desc:'iCube Pro 10W laser engraver control', cmd:'yay -S --needed --noconfirm lasergrbl || flatpak install -y flathub io.github.jm_benoit.lasergrbl', type:'aur'},
      ]},
    { id:'c-writing', icon:'✍️', title:'WRITING / KNOWLEDGE',
      items:[
        {name:'Obsidian', desc:'Markdown PKM — LLM Wiki vault', cmd:'flatpak install -y flathub md.obsidian.Obsidian', type:'flatpak'},
        {name:'LibreOffice', desc:'Full office suite', cmd:'sudo pacman -S --needed --noconfirm libreoffice-fresh', type:'pacman'},
        {name:'Zettlr', desc:'Academic markdown editor', cmd:'flatpak install -y flathub com.zettlr.Zettlr', type:'flatpak'},
        {name:'Joplin', desc:'Encrypted note sync', cmd:'flatpak install -y flathub net.cozic.joplin_desktop', type:'flatpak'},
        {name:'Ghostwriter', desc:'Distraction-free markdown', cmd:'sudo pacman -S --needed --noconfirm ghostwriter', type:'pacman'},
        {name:'Kiwix Desktop', desc:'Offline Wikipedia/ZIM reader — Tinker Hands vault', cmd:'flatpak install -y flathub org.kiwix.desktop', type:'flatpak'},
      ]},
    { id:'c-upgrades', icon:'⬆️', title:'UPGRADES / SYSTEM UPDATES',
      items:[
        {name:'Full System Upgrade', desc:'pacman + AUR full upgrade', cmd:'sudo pacman -Syu --noconfirm && yay -Syu --noconfirm', type:'pacman'},
        {name:'Flatpak Update All', desc:'Update all Flatpak apps', cmd:'flatpak update -y', type:'manual'},
        {name:'Ollama Upgrade', desc:'Upgrade Ollama to latest patched build', cmd:'curl -fsSL https://ollama.com/install.sh | sh', type:'manual'},
        {name:'Claude Code Upgrade', desc:'Upgrade Hermes CLI', cmd:'npm update -g @anthropic-ai/claude-code', type:'npm'},
        {name:'Gemini CLI Upgrade', desc:'Upgrade Gemini CLI', cmd:'npm update -g @google/gemini-cli', type:'npm'},
        {name:'pipx Upgrade All', desc:'Upgrade all pipx-installed tools', cmd:'pipx upgrade-all', type:'manual'},
        {name:'Rust Toolchain Update', desc:'rustup update stable', cmd:'rustup update stable', type:'manual'},
        {name:'Docker Images Pull Latest', desc:'Refresh all running container images', cmd:'docker ps --format "{{.Image}}" | xargs -I{} docker pull {}', type:'manual'},
        {name:'RTK Update', desc:'Cargo update RTK token compressor', cmd:'cargo install rtk', type:'cargo'},
        {name:'Yazi Update', desc:'Cargo update Yazi file manager', cmd:'cargo install yazi-fm', type:'cargo'},
      ]},
    { id:'c-crosstech', icon:'🔗', title:'CROSS-TECH EXTENSIONS',
      items:[
        {name:'Spec-kit', desc:'T1NK3R spec generation tool', cmd:'cargo install spec-kit', type:'cargo'},
        {name:'claude-mem plugin', desc:'Persistent memory — Claude Code', cmd:'# In Claude Code session: /plugin install thedotmack/claude-mem', type:'manual'},
        {name:'AnthropicApiKey → env', desc:'Set ANTHROPIC_API_KEY in bash env', cmd:'echo "export ANTHROPIC_API_KEY=your-key-here" >> ~/.bashrc && source ~/.bashrc', type:'manual'},
        {name:'Pi5 SSH alias', desc:'Quick SSH to Pi5 anchor node', cmd:'echo "alias pi5=\'ssh tinkerv@192.168.1.110\'" >> ~/.bashrc && source ~/.bashrc', type:'manual'},
        {name:'Q6A SSH alias', desc:'Quick SSH to Radxa Q6A node', cmd:'echo "alias q6a=\'ssh tinkerv@192.168.1.236\'" >> ~/.bashrc && source ~/.bashrc', type:'manual'},
        {name:'Tailscale mesh join', desc:'Join T1NK3R cluster mesh VPN', cmd:'sudo tailscale up', type:'manual'},
        {name:'Ventoy float mount alias', desc:'Quick mount Ventoy float partition', cmd:'echo "alias float=\'cd /run/media/tinkerv/Ventoy/float\'" >> ~/.bashrc && source ~/.bashrc', type:'manual'},
        {name:'CLAUDE.md sync', desc:'Copy CLAUDE.md + tinker.md from Ventoy to ~/tinker-verse/', cmd:'cp /run/media/tinkerv/Ventoy/float/New\\ Folder/tinker-verse/CLAUDE.md ~/tinker-verse/ && cp /run/media/tinkerv/Ventoy/float/New\\ Folder/tinker-verse/tinker.md ~/tinker-verse/', type:'manual'},
        {name:'OpenRouter env load', desc:'Source OR key from config', cmd:'echo "source ~/.config/tinker-verse/openrouter.env" >> ~/.bashrc && source ~/.bashrc', type:'manual'},
        {name:'HSA ROCm env (RX 6600)', desc:'AMD GPU fix — permanent in bashrc', cmd:'echo "export HSA_OVERRIDE_GFX_VERSION=10.3.0" >> ~/.bashrc && source ~/.bashrc', type:'manual'},
        {name:'Shellbeats CLI', desc:'Shell-based music sequencer', cmd:'cargo install shellbeats || pip install shellbeats', type:'cargo'},
      ]},
  ],

  bazzite: [
    { id:'b-bootstrap', icon:'🔧', title:'BOOTSTRAP (AUTO-RUNS FIRST)',
      items:[
        {name:'Flathub Remote', desc:'Primary app source on Bazzite', cmd:'flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo', type:'flatpak'},
        {name:'Toolbox Create (tinker)', desc:'Mutable Fedora container — home for all CLI tools', cmd:'toolbox create tinker', type:'manual'},
        {name:'nvm + Node LTS (toolbox)', desc:'Node inside toolbox — CLI AI tools need this', cmd:'toolbox run --container tinker bash -c "curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash && source ~/.bashrc && nvm install --lts"', type:'manual'},
        {name:'Rust + Cargo (toolbox)', desc:'RTK, Yazi inside toolbox', cmd:'toolbox run --container tinker bash -c "curl --proto \'=https\' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y"', type:'manual'},
        {name:'pipx (toolbox)', desc:'Isolated Python tool runner', cmd:'toolbox run --container tinker bash -c "pip install pipx && pipx ensurepath"', type:'manual'},
        {name:'Git config', desc:'Set github:kalifurd credentials', cmd:'git config --global user.name "Brad" && git config --global user.email "your@email.com"', type:'manual'},
      ]},
    { id:'b-cliai', icon:'🖥️', title:'CLI AI TOOLS (TOOLBOX)',
      items:[
        {name:'Claude Code (Hermes)', desc:'In toolbox container', cmd:'toolbox run --container tinker bash -c "npm install -g @anthropic-ai/claude-code"', type:'toolbox'},
        {name:'Gemini CLI', desc:'In toolbox container', cmd:'toolbox run --container tinker bash -c "npm install -g @google/gemini-cli"', type:'toolbox'},
        {name:'OpenAI Codex CLI', desc:'In toolbox container', cmd:'toolbox run --container tinker bash -c "npm install -g @openai/codex"', type:'toolbox'},
        {name:'OpenCode', desc:'In toolbox container', cmd:'toolbox run --container tinker bash -c "npm install -g opencode-ai"', type:'toolbox'},
        {name:'Aider', desc:'AI pair programmer', cmd:'toolbox run --container tinker bash -c "pip install aider-chat"', type:'toolbox'},
        {name:'RTK', desc:'Token compression', cmd:'toolbox run --container tinker bash -c "cargo install rtk && rtk init -g"', type:'toolbox'},
        {name:'LLM (Willison)', desc:'Universal LLM CLI', cmd:'toolbox run --container tinker bash -c "pip install llm"', type:'toolbox'},
      ]},
    { id:'b-sovereign', icon:'🛡️', title:'SOVEREIGN STACK',
      items:[
        {name:'Ollama 0.17.1+ (toolbox)', desc:'Local LLM runner', cmd:'toolbox run --container tinker bash -c "curl -fsSL https://ollama.com/install.sh | sh"', type:'toolbox'},
        {name:'Open WebUI', desc:'Browser UI — port 3000', cmd:'flatpak install -y flathub io.github.openwebui.open_webui', type:'flatpak'},
        {name:'LocalSend', desc:'Sovereign LAN file transfer', cmd:'flatpak install -y flathub org.localsend.localsend_app', type:'flatpak'},
        {name:'Tailscale', desc:'Mesh VPN — cluster access', cmd:'rpm-ostree install tailscale && sudo systemctl enable --now tailscaled', type:'ostree'},
        {name:'Whisper STT (toolbox)', desc:'Local speech recognition', cmd:'toolbox run --container tinker bash -c "pip install openai-whisper"', type:'toolbox'},
        {name:'Piper TTS (toolbox)', desc:'Local TTS', cmd:'toolbox run --container tinker bash -c "pip install piper-tts"', type:'toolbox'},
      ]},
    { id:'b-companions', icon:'🤝', title:'COMPANION MODELS',
      items:[
        {name:'Alfred — qwen3:8b', desc:'Always warm', cmd:'ollama pull qwen3:8b', type:'ollama'},
        {name:'Steward — deepseek-r1:14b', desc:'Always warm', cmd:'ollama pull deepseek-r1:14b', type:'ollama'},
        {name:'Scout — llama3.2:3b', desc:'Always warm', cmd:'ollama pull llama3.2:3b', type:'ollama'},
        {name:'Daisy — gemma2:2b', desc:'Safe Space support', cmd:'ollama pull gemma2:2b', type:'ollama'},
        {name:'Coach — llama3.2:3b', desc:'Motivation', cmd:'ollama pull llama3.2:3b', type:'ollama'},
        {name:'Spark — phi3.5:latest', desc:'Inspiration engine', cmd:'ollama pull phi3.5:latest', type:'ollama'},
        {name:'Solace — llama3.2:1b', desc:'Deep creative voice', cmd:'ollama pull llama3.2:1b', type:'ollama'},
        {name:'Sage — phi4:14b', desc:'Knowledge layer', cmd:'ollama pull phi4:14b', type:'ollama'},
        {name:'Luna — gemma2:2b', desc:'P.A.W.S. / living systems', cmd:'ollama pull gemma2:2b', type:'ollama'},
        {name:'Tink — qwen2.5vl:7b', desc:'Ward — vision-capable', cmd:'ollama pull qwen2.5vl:7b', type:'ollama'},
        {name:'Wren — qwen2.5:1.5b', desc:'Ward', cmd:'ollama pull qwen2.5:1.5b', type:'ollama'},
        {name:'Qwen — qwen2.5:3b', desc:'Ward', cmd:'ollama pull qwen2.5:3b', type:'ollama'},
        {name:'Remy — smollm2:1.7b', desc:'Ward — lightweight', cmd:'ollama pull smollm2:1.7b', type:'ollama'},
        {name:'moondream', desc:'Vision / daydreaming utility model', cmd:'ollama pull moondream', type:'ollama'},
        {name:'nomic-embed-text', desc:'RAG embeddings', cmd:'ollama pull nomic-embed-text', type:'ollama'},
      ]},
    { id:'b-gaming', icon:'🎮', title:'GAMING (BAZZITE NATIVE)',
      items:[
        {name:'Steam', desc:'Pre-installed on Bazzite — verify active', cmd:'# Pre-installed. Verify: flatpak list | grep Steam', type:'flatpak'},
        {name:'MangoHud', desc:'Pre-installed on Bazzite', cmd:'# Pre-installed on Bazzite', type:'flatpak'},
        {name:'Gamescope', desc:'Pre-installed on Bazzite', cmd:'# Pre-installed on Bazzite', type:'flatpak'},
        {name:'Decky Loader', desc:'Plugin loader — pre-installed', cmd:'# Pre-installed on Bazzite', type:'flatpak'},
        {name:'ProtonUp-Qt', desc:'Manage Proton-GE builds', cmd:'flatpak install -y flathub net.davidotek.pupgui2', type:'flatpak'},
        {name:'Heroic Launcher', desc:'Epic / GOG / Amazon', cmd:'flatpak install -y flathub com.heroicgameslauncher.hgl', type:'flatpak'},
        {name:'Bottles', desc:'Wine bottle manager', cmd:'flatpak install -y flathub com.usebottles.bottles', type:'flatpak'},
        {name:'Lutris', desc:'Unified game manager', cmd:'flatpak install -y flathub net.lutris.Lutris', type:'flatpak'},
        {name:'RetroArch', desc:'Multi-system emulator', cmd:'flatpak install -y flathub org.libretro.RetroArch', type:'flatpak'},
        {name:'RPCS3 (PS3)', desc:'PlayStation 3 emulator', cmd:'flatpak install -y flathub net.rpcs3.RPCS3', type:'flatpak'},
        {name:'PCSX2 (PS2)', desc:'PS2 emulator', cmd:'flatpak install -y flathub net.pcsx2.PCSX2', type:'flatpak'},
        {name:'Dolphin (GC/Wii)', desc:'Nintendo emulator', cmd:'flatpak install -y flathub org.DolphinEmu.dolphin-emu', type:'flatpak'},
        {name:'Ryujinx (Switch)', desc:'Switch emulator', cmd:'flatpak install -y flathub org.ryujinx.Ryujinx', type:'flatpak'},
        {name:'PPSSPP (PSP)', desc:'PSP emulator', cmd:'flatpak install -y flathub org.ppsspp.PPSSPP', type:'flatpak'},
        {name:'DuckStation (PS1)', desc:'Best PS1 emu', cmd:'flatpak install -y flathub org.duckstation.DuckStation', type:'flatpak'},
        {name:'Antimicrox', desc:'Controller → keyboard mapper', cmd:'flatpak install -y flathub io.github.antimicrox.antimicrox', type:'flatpak'},
        {name:'Flatseal', desc:'Flatpak permission manager', cmd:'flatpak install -y flathub com.github.tchx84.Flatseal', type:'flatpak'},
      ]},
    { id:'b-audio', icon:'🔊', title:'AUDIO / DAW / SYNTHS',
      items:[
        {name:'Ardour 8', desc:'Pro Linux DAW — layer via rpm-ostree', cmd:'rpm-ostree install ardour', type:'ostree'},
        {name:'LMMS', desc:'Beat production', cmd:'flatpak install -y flathub io.lmms.LMMS', type:'flatpak'},
        {name:'Zrythm', desc:'Modern FOSS DAW', cmd:'flatpak install -y flathub org.zrythm.Zrythm', type:'flatpak'},
        {name:'Audacity', desc:'Audio editor', cmd:'flatpak install -y flathub org.audacityteam.Audacity', type:'flatpak'},
        {name:'Mixxx', desc:'DJ software — T1NK3R.FM', cmd:'flatpak install -y flathub org.mixxx.Mixxx', type:'flatpak'},
        {name:'EasyEffects', desc:'PipeWire audio effects', cmd:'flatpak install -y flathub com.github.wwmm.easyeffects', type:'flatpak'},
        {name:'Surge XT', desc:'Hybrid wavetable synth', cmd:'flatpak install -y flathub org.surge_synth_team.surge-xt', type:'flatpak'},
        {name:'Hydrogen', desc:'Drum machine / sequencer', cmd:'flatpak install -y flathub org.hydrogenmusic.Hydrogen', type:'flatpak'},
        {name:'Sonobus', desc:'P2P audio streaming', cmd:'flatpak install -y flathub net.sonobus.SonoBus', type:'flatpak'},
      ]},
    { id:'b-rocm', icon:'🔴', title:'ROCm / AMD GPU (rpm-ostree)',
      items:[
        {name:'ROCm (layer — needs reboot)', desc:'AMD GPU compute — REBOOT REQUIRED after this step', cmd:'rpm-ostree install rocm-opencl rocm-hip', type:'ostree'},
        {name:'HSA Override (RX 6600)', desc:'RDNA2 GFX version fix', cmd:'echo "export HSA_OVERRIDE_GFX_VERSION=10.3.0" >> ~/.bashrc', type:'manual'},
      ]},
    { id:'b-apps', icon:'🎨', title:'APPS / TOOLS',
      items:[
        {name:'VS Code', desc:'Primary editor', cmd:'flatpak install -y flathub com.visualstudio.code', type:'flatpak'},
        {name:'Obsidian', desc:'Markdown PKM — Tinker-Verse vault', cmd:'flatpak install -y flathub md.obsidian.Obsidian', type:'flatpak'},
        {name:'Blender', desc:'3D modeling — VIGA/Modly', cmd:'flatpak install -y flathub org.blender.Blender', type:'flatpak'},
        {name:'Krita', desc:'Digital painting', cmd:'flatpak install -y flathub org.kde.krita', type:'flatpak'},
        {name:'OBS Studio', desc:'Streaming & recording', cmd:'flatpak install -y flathub com.obsproject.Studio', type:'flatpak'},
        {name:'Kdenlive', desc:'NLE video editor', cmd:'flatpak install -y flathub org.kde.kdenlive', type:'flatpak'},
        {name:'LocalSend', desc:'LAN file transfer', cmd:'flatpak install -y flathub org.localsend.localsend_app', type:'flatpak'},
        {name:'Tailscale', desc:'Mesh VPN', cmd:'rpm-ostree install tailscale', type:'ostree'},
        {name:'VLC', desc:'Media player', cmd:'flatpak install -y flathub org.videolan.VLC', type:'flatpak'},
        {name:'FreeTube', desc:'Privacy YouTube client', cmd:'flatpak install -y flathub io.freetubeapp.FreeTube', type:'flatpak'},
        {name:'Spotify', desc:'Music streaming', cmd:'flatpak install -y flathub com.spotify.Client', type:'flatpak'},
        {name:'OrcaSlicer', desc:'Bambu P1S slicer', cmd:'flatpak install -y flathub com.softfever.OrcaSlicer', type:'flatpak'},
      ]},
    { id:'b-creai', icon:'🤖', title:'CREATIVE AI / ACE STACK',
      items:[
        {name:'ComfyUI (toolbox)', desc:'Node-based SD — inside toolbox container', cmd:'toolbox run --container tinker bash -c "git clone https://github.com/comfyanonymous/ComfyUI.git ~/comfyui && cd ~/comfyui && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt"', type:'toolbox'},
        {name:'ACE-Step UI (toolbox)', desc:'ACE music gen — toolbox', cmd:'toolbox run --container tinker bash -c "git clone https://github.com/ace-step/ACE-Step.git ~/ace-step && cd ~/ace-step && pip install -r requirements.txt"', type:'toolbox'},
        {name:'FreeMoCap (toolbox)', desc:'Markerless mocap — ACE Visual', cmd:'toolbox run --container tinker bash -c "pip install freemocap"', type:'toolbox'},
        {name:'InvokeAI (toolbox)', desc:'Clean SD interface', cmd:'toolbox run --container tinker bash -c "pip install InvokeAI"', type:'toolbox'},
        {name:'text-generation-webui (toolbox)', desc:'Oobabooga local model UI', cmd:'toolbox run --container tinker bash -c "git clone https://github.com/oobabooga/text-generation-webui.git && cd text-generation-webui && pip install -r requirements.txt"', type:'toolbox'},
        {name:'Diffusers (toolbox)', desc:'HuggingFace AI image library', cmd:'toolbox run --container tinker bash -c "pip install diffusers transformers accelerate safetensors"', type:'toolbox'},
      ]},
    { id:'b-homelab', icon:'🏠', title:'HOMELAB / SELF-HOSTED',
      items:[
        {name:'Docker CE (toolbox)', desc:'Container engine inside toolbox', cmd:'toolbox run --container tinker bash -c "curl -fsSL https://get.docker.com | sh"', type:'toolbox'},
        {name:'Portainer', desc:'Docker web UI', cmd:'flatpak install -y flathub io.portainer.Portainer || docker run -d -p 9000:9000 --name portainer --restart always -v /var/run/docker.sock:/var/run/docker.sock portainer/portainer-ce', type:'flatpak'},
        {name:'Jellyfin', desc:'Local media server — T1NK3R.TV', cmd:'flatpak install -y flathub com.github.iwalton3.jellyfin-media-player', type:'flatpak'},
        {name:'Uptime Kuma', desc:'Monitoring dashboard', cmd:'toolbox run --container tinker bash -c "docker run -d -p 3002:3001 --name uptime-kuma louislam/uptime-kuma:1"', type:'toolbox'},
        {name:'LocalSend', desc:'LAN sovereign file transfer', cmd:'flatpak install -y flathub org.localsend.localsend_app', type:'flatpak'},
        {name:'Kiwix Desktop', desc:'Offline Wikipedia/ZIM — Tinker Hands', cmd:'flatpak install -y flathub org.kiwix.desktop', type:'flatpak'},
      ]},
    { id:'b-upgrades', icon:'⬆️', title:'UPGRADES / SYSTEM UPDATES',
      items:[
        {name:'rpm-ostree Upgrade', desc:'Full system layer upgrade — needs reboot', cmd:'rpm-ostree upgrade', type:'ostree'},
        {name:'Flatpak Update All', desc:'Update all Flatpak apps', cmd:'flatpak update -y', type:'manual'},
        {name:'Toolbox packages update', desc:'Update all toolbox container packages', cmd:'toolbox run --container tinker bash -c "sudo dnf upgrade -y"', type:'toolbox'},
        {name:'Ollama Upgrade (toolbox)', desc:'Reinstall latest Ollama in toolbox', cmd:'toolbox run --container tinker bash -c "curl -fsSL https://ollama.com/install.sh | sh"', type:'toolbox'},
        {name:'Claude Code Upgrade', desc:'Upgrade Hermes CLI in toolbox', cmd:'toolbox run --container tinker bash -c "npm update -g @anthropic-ai/claude-code"', type:'toolbox'},
        {name:'Gemini CLI Upgrade', desc:'Upgrade in toolbox', cmd:'toolbox run --container tinker bash -c "npm update -g @google/gemini-cli"', type:'toolbox'},
      ]},
    { id:'b-crosstech', icon:'🔗', title:'CROSS-TECH EXTENSIONS',
      items:[
        {name:'OpenRouter env load', desc:'Source OR key from config file', cmd:'echo "source ~/.config/tinker-verse/openrouter.env" >> ~/.bashrc && source ~/.bashrc', type:'manual'},
        {name:'HSA ROCm env permanent', desc:'AMD RX 6600 GFX version fix in bashrc', cmd:'echo "export HSA_OVERRIDE_GFX_VERSION=10.3.0" >> ~/.bashrc && source ~/.bashrc', type:'manual'},
        {name:'Tailscale mesh join', desc:'Join T1NK3R cluster mesh', cmd:'sudo tailscale up', type:'manual'},
        {name:'CachyOS SSH alias', desc:'Quick SSH to CachyOS main rig', cmd:'echo "alias cachy=\'ssh tinkerv@192.168.1.138\'" >> ~/.bashrc && source ~/.bashrc', type:'manual'},
        {name:'Pi5 SSH alias', desc:'Quick SSH to Pi5 anchor node', cmd:'echo "alias pi5=\'ssh tinkerv@192.168.1.110\'" >> ~/.bashrc && source ~/.bashrc', type:'manual'},
        {name:'CLAUDE.md sync from Ventoy', desc:'Copy context files to project dir', cmd:'mkdir -p ~/tinker-verse && cp /run/media/$USER/Ventoy/float/New\\ Folder/tinker-verse/CLAUDE.md ~/tinker-verse/ && cp /run/media/$USER/Ventoy/float/New\\ Folder/tinker-verse/tinker.md ~/tinker-verse/', type:'manual'},
        {name:'toolbox enter alias', desc:'Quick drop into tinker container', cmd:'echo "alias tinker=\'toolbox enter tinker\'" >> ~/.bashrc && source ~/.bashrc', type:'manual'},
      ]},
  ],

  fedora: [
    { id:'f-bootstrap', icon:'🔧', title:'BOOTSTRAP (AUTO-RUNS FIRST)',
      items:[
        {name:'dnf upgrade --refresh', desc:'Sync metadata + update before anything else', cmd:'sudo dnf upgrade --refresh -y', type:'dnf'},
        {name:'RPM Fusion free + nonfree', desc:'Codecs, Steam, VLC, OBS all live here', cmd:'sudo dnf install -y https://mirrors.rpmfusion.org/free/fedora/rpmfusion-free-release-$(rpm -E %fedora).noarch.rpm https://mirrors.rpmfusion.org/nonfree/fedora/rpmfusion-nonfree-release-$(rpm -E %fedora).noarch.rpm', type:'dnf'},
        {name:'Development Tools group', desc:'gcc / make / autotools', cmd:'sudo dnf group install -y development-tools', type:'dnf'},
        {name:'Flatpak + Flathub', desc:'App runtime', cmd:'sudo dnf install -y flatpak && flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo', type:'dnf'},
        {name:'pipx', desc:'Isolated Python tool runner', cmd:'sudo dnf install -y pipx', type:'dnf'},
        {name:'nvm → Node LTS', desc:'Required for CLI AI tools', cmd:'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash && source ~/.bashrc && nvm install --lts', type:'manual'},
        {name:'Rust + Cargo', desc:'Required for RTK, Yazi, Bevy', cmd:'curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y && source $HOME/.cargo/env', type:'manual'},
        {name:'RPM codecs (multimedia)', desc:'Full ffmpeg + hardware decode', cmd:'sudo dnf swap -y ffmpeg-free ffmpeg --allowerasing', type:'manual'},
      ]},
    { id:'f-cliai', icon:'🖥️', title:'CLI AI TOOLS',
      items:[
        {name:'Claude Code (Hermes)', desc:'Primary agentic coding CLI', cmd:'npm install -g @anthropic-ai/claude-code', type:'npm'},
        {name:'Gemini CLI', desc:'Google Gemini — codegen layer', cmd:'npm install -g @google/gemini-cli', type:'npm'},
        {name:'OpenAI Codex CLI', desc:'OpenAI Codex — OpenRouter Tier 1', cmd:'npm install -g @openai/codex', type:'npm'},
        {name:'OpenCode', desc:'Open-source multi-provider AI CLI', cmd:'npm install -g opencode-ai', type:'npm'},
        {name:'Aider', desc:'AI pair programmer — git-aware', cmd:'pipx install aider-chat', type:'pip'},
        {name:'Shell-GPT', desc:'LLM queries in terminal', cmd:'pipx install shell-gpt', type:'pip'},
        {name:'LLM (Willison)', desc:'Universal LLM CLI', cmd:'pipx install llm', type:'pip'},
        {name:'RTK', desc:'Token compression for Claude Code', cmd:'cargo install rtk && rtk init -g', type:'cargo'},
        {name:'Yazi File Manager', desc:'Rust terminal file manager', cmd:'sudo dnf install -y yazi', type:'dnf'},
      ]},
    { id:'f-sovereign', icon:'🛡️', title:'SOVEREIGN STACK',
      items:[
        {name:'Ollama 0.17.1+', desc:'Local LLM runner — official installer', cmd:'curl -fsSL https://ollama.com/install.sh | sh', type:'manual'},
        {name:'Podman + Compose', desc:'Fedora-native rootless containers', cmd:'sudo dnf install -y podman podman-compose podman-docker', type:'dnf'},
        {name:'Docker CE (alternative)', desc:'If you need real Docker rather than Podman', cmd:'sudo dnf install -y moby-engine && sudo systemctl enable --now docker', type:'dnf'},
        {name:'Open WebUI', desc:'Browser UI for Ollama — port 3000', cmd:'podman run -d -p 3000:8080 --network=host -v open-webui:/app/backend/data --name open-webui ghcr.io/open-webui/open-webui:main', type:'manual'},
        {name:'LocalSend', desc:'Sovereign LAN file transfer', cmd:'flatpak install -y flathub org.localsend.localsend_app', type:'flatpak'},
        {name:'KeePassXC', desc:'Offline password manager', cmd:'sudo dnf install -y keepassxc', type:'dnf'},
        {name:'Whisper STT', desc:'Local speech recognition', cmd:'pipx install openai-whisper', type:'pip'},
        {name:'Piper TTS', desc:'Local neural TTS', cmd:'pipx install piper-tts', type:'pip'},
        {name:'Porcupine Wake Word', desc:'"Hey Alfred" wake engine', cmd:'pipx install pvporcupine', type:'pip'},
      ]},
    { id:'f-companions', icon:'🤝', title:'COMPANION MODELS',
      items:[
        {name:'Alfred — qwen3:8b', desc:'Always warm', cmd:'ollama pull qwen3:8b', type:'ollama'},
        {name:'Steward — deepseek-r1:14b', desc:'Always warm', cmd:'ollama pull deepseek-r1:14b', type:'ollama'},
        {name:'Scout — llama3.2:3b', desc:'Always warm', cmd:'ollama pull llama3.2:3b', type:'ollama'},
        {name:'Daisy — gemma2:2b', desc:'Safe Space support', cmd:'ollama pull gemma2:2b', type:'ollama'},
        {name:'Coach — llama3.2:3b', desc:'Motivation', cmd:'ollama pull llama3.2:3b', type:'ollama'},
        {name:'Spark — phi3.5:latest', desc:'Inspiration engine', cmd:'ollama pull phi3.5:latest', type:'ollama'},
        {name:'Solace — llama3.2:1b', desc:'Deep creative voice', cmd:'ollama pull llama3.2:1b', type:'ollama'},
        {name:'Sage — phi4:14b', desc:'Knowledge layer', cmd:'ollama pull phi4:14b', type:'ollama'},
        {name:'Luna — gemma2:2b', desc:'P.A.W.S. / living systems', cmd:'ollama pull gemma2:2b', type:'ollama'},
        {name:'Tink — qwen2.5vl:7b', desc:'Ward — vision-capable', cmd:'ollama pull qwen2.5vl:7b', type:'ollama'},
        {name:'Wren — qwen2.5:1.5b', desc:'Ward', cmd:'ollama pull qwen2.5:1.5b', type:'ollama'},
        {name:'Qwen — qwen2.5:3b', desc:'Ward', cmd:'ollama pull qwen2.5:3b', type:'ollama'},
        {name:'Remy — smollm2:1.7b', desc:'Ward — lightweight', cmd:'ollama pull smollm2:1.7b', type:'ollama'},
        {name:'moondream', desc:'Vision / daydreaming utility model', cmd:'ollama pull moondream', type:'ollama'},
        {name:'nomic-embed-text', desc:'RAG embeddings', cmd:'ollama pull nomic-embed-text', type:'ollama'},
      ]},
    { id:'f-dev', icon:'💻', title:'DEVELOPMENT',
      items:[
        {name:'Git + GitHub CLI', desc:'Version control — kalifurd', cmd:'sudo dnf install -y git gh', type:'dnf'},
        {name:'VS Code', desc:'Primary editor', cmd:'flatpak install -y flathub com.visualstudio.code', type:'flatpak'},
        {name:'Neovim', desc:'Hyperextensible Vim', cmd:'sudo dnf install -y neovim', type:'dnf'},
        {name:'Python 3 + pip + venv', desc:'Python toolchain', cmd:'sudo dnf install -y python3 python3-pip python3-virtualenv', type:'dnf'},
        {name:'Go', desc:'Google systems language', cmd:'sudo dnf install -y golang', type:'dnf'},
        {name:'Java 21 (OpenJDK)', desc:'JVM runtime + compiler', cmd:'sudo dnf install -y java-21-openjdk-devel', type:'dnf'},
        {name:'tmux + zsh + htop', desc:'Terminal essentials', cmd:'sudo dnf install -y tmux zsh htop', type:'dnf'},
        {name:'bat + ripgrep + fzf + fd', desc:'Modern CLI search stack', cmd:'sudo dnf install -y bat ripgrep fzf fd-find', type:'dnf'},
        {name:'Meld', desc:'Visual diff/merge', cmd:'sudo dnf install -y meld', type:'dnf'},
        {name:'SQLite + DB Browser', desc:'Local database work', cmd:'sudo dnf install -y sqlite sqlitebrowser', type:'dnf'},
      ]},
    { id:'f-gaming', icon:'🎮', title:'GAMING / EMULATION',
      items:[
        {name:'Steam', desc:'Needs RPM Fusion nonfree', cmd:'sudo dnf install -y steam', type:'dnf'},
        {name:'Lutris', desc:'Wine/Proton game manager', cmd:'sudo dnf install -y lutris', type:'dnf'},
        {name:'Wine + winetricks', desc:'Windows compatibility layer', cmd:'sudo dnf install -y wine winetricks', type:'dnf'},
        {name:'MangoHud + GOverlay', desc:'FPS/thermal overlay + GUI config', cmd:'sudo dnf install -y mangohud goverlay', type:'dnf'},
        {name:'GameMode', desc:'CPU governor switch while gaming', cmd:'sudo dnf install -y gamemode', type:'dnf'},
        {name:'Heroic Games Launcher', desc:'Epic / GOG / Amazon', cmd:'flatpak install -y flathub com.heroicgameslauncher.hgl', type:'flatpak'},
        {name:'ProtonUp-Qt', desc:'Install GE-Proton builds', cmd:'flatpak install -y flathub net.davidotek.pupgui2', type:'flatpak'},
        {name:'RetroArch', desc:'Multi-system emulator frontend', cmd:'flatpak install -y flathub org.libretro.RetroArch', type:'flatpak'},
        {name:'Dolphin (GC/Wii)', desc:'Nintendo emulator', cmd:'flatpak install -y flathub org.DolphinEmu.dolphin-emu', type:'flatpak'},
        {name:'PCSX2 (PS2)', desc:'PlayStation 2 emulator', cmd:'flatpak install -y flathub net.pcsx2.PCSX2', type:'flatpak'},
        {name:'DuckStation (PS1)', desc:'PlayStation 1 emulator', cmd:'flatpak install -y flathub org.duckstation.DuckStation', type:'flatpak'},
        {name:'RPCS3 (PS3)', desc:'PlayStation 3 emulator', cmd:'flatpak install -y flathub net.rpcs3.RPCS3', type:'flatpak'},
        {name:'PPSSPP (PSP)', desc:'PSP emulator', cmd:'flatpak install -y flathub org.ppsspp.PPSSPP', type:'flatpak'},
        {name:'ScummVM', desc:'Classic adventure engine', cmd:'flatpak install -y flathub org.scummvm.ScummVM', type:'flatpak'},
      ]},
    { id:'f-engines', icon:'🕹️', title:'GAME ENGINES / 3D',
      items:[
        {name:'Godot 4', desc:'Open-source engine — T1NK3R Games', cmd:'flatpak install -y flathub org.godotengine.Godot', type:'flatpak'},
        {name:'Blender', desc:'3D modeling / VIGA / Modly', cmd:'flatpak install -y flathub org.blender.Blender', type:'flatpak'},
        {name:'Unity Hub', desc:'Unity engine manager — AppImage/manual', cmd:'# Download Unity Hub AppImage from unity.com/download', type:'manual'},
        {name:'Unreal Engine 5', desc:'Build from source via Epic GitHub access', cmd:'# github.com/EpicGames/UnrealEngine — requires linked Epic account', type:'manual'},
        {name:'Bevy (Rust engine)', desc:'ECS game engine — cargo template', cmd:'cargo install cargo-generate', type:'cargo'},
        {name:'LÖVE 2D', desc:'Lua game framework', cmd:'sudo dnf install -y love', type:'dnf'},
        {name:'FreeCAD', desc:'Parametric CAD', cmd:'flatpak install -y flathub org.freecadweb.FreeCAD', type:'flatpak'},
        {name:'OpenSCAD', desc:'Script-driven CAD', cmd:'sudo dnf install -y openscad', type:'dnf'},
      ]},
    { id:'f-daw', icon:'🎚️', title:'DAWs',
      items:[
        {name:'Ardour', desc:'Full pro DAW', cmd:'flatpak install -y flathub org.ardour.Ardour', type:'flatpak'},
        {name:'Reaper', desc:'Lightweight pro DAW', cmd:'flatpak install -y flathub fm.reaper.Reaper', type:'flatpak'},
        {name:'LMMS', desc:'FL Studio-style beat production', cmd:'flatpak install -y flathub io.lmms.LMMS', type:'flatpak'},
        {name:'Audacity', desc:'Audio editor & recorder', cmd:'flatpak install -y flathub org.audacityteam.Audacity', type:'flatpak'},
        {name:'Zrythm', desc:'Modern modular DAW', cmd:'flatpak install -y flathub org.zrythm.Zrythm', type:'flatpak'},
        {name:'Mixxx', desc:'DJ software — T1NK3R.FM', cmd:'sudo dnf install -y mixxx', type:'dnf'},
        {name:'Qtractor', desc:'MIDI/audio sequencer', cmd:'sudo dnf install -y qtractor', type:'dnf'},
      ]},
    { id:'f-audio', icon:'🔊', title:'AUDIO / SYNTHS / FX',
      items:[
        {name:'PipeWire JACK bridge', desc:'Pro audio routing on stock PipeWire', cmd:'sudo dnf install -y pipewire-jack-audio-connection-kit wireplumber', type:'dnf'},
        {name:'qpwgraph', desc:'PipeWire visual patchbay', cmd:'sudo dnf install -y qpwgraph', type:'dnf'},
        {name:'Carla Plugin Host', desc:'VST/LV2 host — run any plugin standalone', cmd:'sudo dnf install -y carla', type:'dnf'},
        {name:'EasyEffects', desc:'System audio effects — EQ/compression', cmd:'flatpak install -y flathub com.github.wwmm.easyeffects', type:'flatpak'},
        {name:'Calf + LSP + x42 plugins', desc:'Core LV2 plugin suites', cmd:'sudo dnf install -y calf lsp-plugins x42-plugins', type:'dnf'},
        {name:'Surge XT', desc:'Hybrid wavetable synth', cmd:'flatpak install -y flathub org.surge_synth_team.SurgeXT', type:'flatpak'},
        {name:'Vital Synth', desc:'Spectral wavetable — free tier', cmd:'# Download from vital.audio (free account required)', type:'manual'},
        {name:'Hydrogen Drum Machine', desc:'Drum machine / step sequencer', cmd:'sudo dnf install -y hydrogen', type:'dnf'},
        {name:'FluidSynth + soundfont', desc:'General MIDI synth engine', cmd:'sudo dnf install -y fluidsynth fluid-soundfont-gm', type:'dnf'},
        {name:'ZynAddSubFX + Yoshimi', desc:'Classic Linux softsynths', cmd:'sudo dnf install -y zynaddsubfx yoshimi', type:'dnf'},
        {name:'realtime-setup', desc:'Low-latency audio scheduling', cmd:'sudo dnf install -y realtime-setup && sudo usermod -aG realtime $USER', type:'dnf'},
      ]},
    { id:'f-media', icon:'📺', title:'MEDIA / T1NK3R.TV',
      items:[
        {name:'VLC', desc:'Universal media player (RPM Fusion)', cmd:'sudo dnf install -y vlc', type:'dnf'},
        {name:'mpv', desc:'CLI/GPU media player', cmd:'sudo dnf install -y mpv', type:'dnf'},
        {name:'yt-dlp', desc:'YouTube downloader', cmd:'sudo dnf install -y yt-dlp', type:'dnf'},
        {name:'Kodi', desc:'Media center — T1NK3R.TV frontend', cmd:'flatpak install -y flathub tv.kodi.Kodi', type:'flatpak'},
        {name:'Jellyfin Server', desc:'Local media streaming server', cmd:'sudo dnf install -y jellyfin-server jellyfin-web', type:'dnf'},
        {name:'Strawberry', desc:'Local music library player', cmd:'flatpak install -y flathub org.strawberrymusicplayer.strawberry', type:'flatpak'},
        {name:'Calibre', desc:'E-book manager', cmd:'sudo dnf install -y calibre', type:'dnf'},
        {name:'HandBrake', desc:'Video transcoder', cmd:'flatpak install -y flathub fr.handbrake.ghb', type:'flatpak'},
      ]},
    { id:'f-art', icon:'🎨', title:'ART / VIDEO',
      items:[
        {name:'GIMP', desc:'GNU image manipulation', cmd:'sudo dnf install -y gimp', type:'dnf'},
        {name:'Krita', desc:'Professional digital painting', cmd:'flatpak install -y flathub org.kde.krita', type:'flatpak'},
        {name:'Inkscape', desc:'Vector graphics (SVG)', cmd:'sudo dnf install -y inkscape', type:'dnf'},
        {name:'Darktable', desc:'RAW photo workflow', cmd:'sudo dnf install -y darktable', type:'dnf'},
        {name:'OBS Studio', desc:'Streaming & screen recording', cmd:'sudo dnf install -y obs-studio', type:'dnf'},
        {name:'Kdenlive', desc:'KDE video editor', cmd:'flatpak install -y flathub org.kde.kdenlive', type:'flatpak'},
        {name:'DaVinci Resolve', desc:'Pro video editor — ACE ViMax backend', cmd:'# Download from blackmagicdesign.com — needs ROCm/OpenCL for AMD', type:'manual'},
        {name:'Upscayl', desc:'AI image upscaler', cmd:'flatpak install -y flathub org.upscayl.Upscayl', type:'flatpak'},
        {name:'FFmpeg', desc:'CLI multimedia toolkit', cmd:'sudo dnf install -y ffmpeg', type:'dnf'},
      ]},
    { id:'f-creai', icon:'🤖', title:'CREATIVE AI / ACE STACK',
      items:[
        {name:'ComfyUI', desc:'Node-based Stable Diffusion — ROCm build', cmd:'git clone https://github.com/comfyanonymous/ComfyUI.git ~/tinker-verse/comfyui && cd ~/tinker-verse/comfyui && python3 -m venv venv && source venv/bin/activate && pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/rocm6.0 && pip install -r requirements.txt', type:'manual'},
        {name:'Fooocus', desc:'Easy high-quality local image gen', cmd:'git clone https://github.com/lllyasviel/Fooocus.git ~/tinker-verse/fooocus', type:'manual'},
        {name:'SD WebUI Forge', desc:'Modern A1111 with video support', cmd:'git clone https://github.com/lllyasviel/stable-diffusion-webui-forge.git ~/tinker-verse/sd-forge', type:'manual'},
        {name:'InvokeAI', desc:'Clean professional SD interface', cmd:'pipx install InvokeAI', type:'pip'},
        {name:'ACE-Step UI', desc:'ACE music generation step UI', cmd:'git clone https://github.com/ace-step/ACE-Step.git ~/tinker-verse/ace-step', type:'manual'},
        {name:'text-generation-webui', desc:'Oobabooga — local model chat UI', cmd:'git clone https://github.com/oobabooga/text-generation-webui.git ~/tinker-verse/text-gen-webui', type:'manual'},
        {name:'Diffusers (HuggingFace)', desc:'Core AI image library', cmd:'pipx install diffusers', type:'pip'},
        {name:'FreeMoCap', desc:'Markerless motion capture — ACE Visual', cmd:'pipx install freemocap', type:'pip'},
      ]},
    { id:'f-homelab', icon:'🏠', title:'HOMELAB / SELF-HOSTED',
      items:[
        {name:'Portainer', desc:'Container web UI', cmd:'podman run -d -p 9000:9000 --name portainer --restart always -v /run/podman/podman.sock:/var/run/docker.sock -v portainer_data:/data portainer/portainer-ce', type:'manual'},
        {name:'Open WebUI', desc:'Ollama chat front-end — port 3000', cmd:'podman run -d -p 3000:8080 --network=host -v open-webui:/app/backend/data --name open-webui ghcr.io/open-webui/open-webui:main', type:'manual'},
        {name:'Vaultwarden', desc:'Self-hosted Bitwarden', cmd:'podman run -d -p 8222:80 --name vaultwarden -v ~/vaultwarden:/data vaultwarden/server:latest', type:'manual'},
        {name:'Nextcloud AIO', desc:'Full private cloud', cmd:'podman run -d -p 8080:8080 --name nextcloud-aio nextcloud/all-in-one:latest', type:'manual'},
        {name:'Uptime Kuma', desc:'Monitoring dashboard', cmd:'podman run -d -p 3002:3001 --name uptime-kuma -v uptime-kuma:/app/data louislam/uptime-kuma:1', type:'manual'},
        {name:'AnythingLLM', desc:'RAG + LLM front-end', cmd:'podman run -d -p 3003:3001 --name anythingllm mintplexlabs/anythingllm', type:'manual'},
        {name:'Home Assistant', desc:'Home automation hub', cmd:'podman run -d -p 8123:8123 --name homeassistant -v ~/homeassistant:/config ghcr.io/home-assistant/home-assistant:stable', type:'manual'},
        {name:'Syncthing', desc:'Peer-to-peer file sync', cmd:'sudo dnf install -y syncthing', type:'dnf'},
      ]},
    { id:'f-sdr', icon:'📡', title:'SDR / RF / T1NK3R.FM',
      items:[
        {name:'rtl-sdr tools', desc:'RTL2832U dongle drivers + CLI', cmd:'sudo dnf install -y rtl-sdr', type:'dnf'},
        {name:'GQRX', desc:'SDR receiver GUI', cmd:'sudo dnf install -y gqrx', type:'dnf'},
        {name:'GNU Radio', desc:'DSP flowgraph toolkit', cmd:'sudo dnf install -y gnuradio', type:'dnf'},
        {name:'SDR++', desc:'Modern cross-platform SDR receiver', cmd:'flatpak install -y flathub org.sdrpp.SDRPlusPlus', type:'flatpak'},
        {name:'CubicSDR', desc:'Wideband SDR waterfall', cmd:'sudo dnf install -y CubicSDR', type:'dnf'},
        {name:'multimon-ng', desc:'Digital mode decoder (POCSAG, etc.)', cmd:'sudo dnf install -y multimon-ng', type:'dnf'},
        {name:'dump1090', desc:'ADS-B aircraft tracking', cmd:'sudo dnf install -y dump1090', type:'dnf'},
        {name:'CHIRP', desc:'Radio programming (Baofeng etc.)', cmd:'flatpak install -y flathub com.danplanet.chirp', type:'flatpak'},
      ]},
    { id:'f-print3d', icon:'🖨️', title:'3D PRINTING (BAMBU P1S)',
      items:[
        {name:'Bambu Studio', desc:'Official P1S slicer', cmd:'flatpak install -y flathub com.bambulab.BambuStudio', type:'flatpak'},
        {name:'OrcaSlicer', desc:'Community fork — better P1S profiles', cmd:'flatpak install -y flathub io.github.softfever.OrcaSlicer', type:'flatpak'},
        {name:'PrusaSlicer', desc:'Alternative slicer', cmd:'flatpak install -y flathub com.prusa3d.PrusaSlicer', type:'flatpak'},
        {name:'Cura', desc:'Ultimaker slicer', cmd:'flatpak install -y flathub com.ultimaker.cura', type:'flatpak'},
        {name:'OctoPrint (container)', desc:'Printer web controller — LAN only', cmd:'podman run -d -p 5000:5000 --name octoprint -v octoprint:/octoprint octoprint/octoprint', type:'manual'},
        {name:'FreeCAD', desc:'Parametric CAD for printable parts', cmd:'flatpak install -y flathub org.freecadweb.FreeCAD', type:'flatpak'},
        {name:'Blender', desc:'Mesh sculpting / repair', cmd:'flatpak install -y flathub org.blender.Blender', type:'flatpak'},
        {name:'MeshLab', desc:'Mesh cleanup and repair', cmd:'flatpak install -y flathub net.meshlab.MeshLab', type:'flatpak'},
      ]},
    { id:'f-network', icon:'🌐', title:'NETWORKING / SECURITY',
      items:[
        {name:'Tailscale', desc:'Mesh VPN — cluster access', cmd:'curl -fsSL https://tailscale.com/install.sh | sh', type:'manual'},
        {name:'WireGuard tools', desc:'Modern VPN', cmd:'sudo dnf install -y wireguard-tools', type:'dnf'},
        {name:'Wireshark', desc:'Network protocol analyzer', cmd:'sudo dnf install -y wireshark', type:'dnf'},
        {name:'Nmap', desc:'Network scanner', cmd:'sudo dnf install -y nmap', type:'dnf'},
        {name:'OpenSSH server', desc:'Remote access into this box', cmd:'sudo dnf install -y openssh-server && sudo systemctl enable --now sshd', type:'dnf'},
        {name:'KeePassXC', desc:'Offline password manager', cmd:'sudo dnf install -y keepassxc', type:'dnf'},
        {name:'croc + magic-wormhole', desc:'One-shot encrypted file transfer', cmd:'sudo dnf install -y croc magic-wormhole', type:'dnf'},
      ]},
    { id:'f-writing', icon:'✍️', title:'WRITING / KNOWLEDGE',
      items:[
        {name:'LibreOffice', desc:'Full office suite', cmd:'sudo dnf install -y libreoffice', type:'dnf'},
        {name:'Obsidian', desc:'Markdown PKM — Tinker-Verse vault', cmd:'flatpak install -y flathub md.obsidian.Obsidian', type:'flatpak'},
        {name:'Logseq', desc:'Outliner PKM alternative', cmd:'flatpak install -y flathub com.logseq.Logseq', type:'flatpak'},
        {name:'Zotero', desc:'Reference manager', cmd:'flatpak install -y flathub org.zotero.Zotero', type:'flatpak'},
        {name:'Pandoc', desc:'Universal document converter', cmd:'sudo dnf install -y pandoc', type:'dnf'},
        {name:'TeX Live', desc:'LaTeX typesetting', cmd:'sudo dnf install -y texlive-scheme-medium', type:'dnf'},
      ]},
    { id:'f-upgrades', icon:'⬆️', title:'UPGRADES / SYSTEM UPDATES',
      items:[
        {name:'dnf upgrade all', desc:'Update every RPM', cmd:'sudo dnf upgrade --refresh -y', type:'dnf'},
        {name:'Flatpak update all', desc:'Update every Flatpak', cmd:'flatpak update -y', type:'flatpak'},
        {name:'Claude Code upgrade', desc:'Upgrade Hermes CLI', cmd:'npm update -g @anthropic-ai/claude-code', type:'npm'},
        {name:'Gemini CLI upgrade', desc:'Upgrade Gemini CLI', cmd:'npm update -g @google/gemini-cli', type:'npm'},
        {name:'Ollama upgrade', desc:'Re-run official installer', cmd:'curl -fsSL https://ollama.com/install.sh | sh', type:'manual'},
        {name:'pipx upgrade all', desc:'Upgrade every pipx tool', cmd:'pipx upgrade-all', type:'pip'},
        {name:'dnf autoremove', desc:'Drop orphaned dependencies', cmd:'sudo dnf autoremove -y', type:'dnf'},
      ]},
    { id:'f-crosstech', icon:'🔗', title:'CROSS-TECH EXTENSIONS',
      items:[
        {name:'tinker-verse dir structure', desc:'Create canonical project dirs', cmd:'mkdir -p ~/tinker-verse/{ai,games,luna,forge}', type:'manual'},
        {name:'OpenRouter env file', desc:'Key at the canonical path', cmd:'mkdir -p ~/.config/tinker-verse && chmod 600 ~/.config/tinker-verse/openrouter.env 2>/dev/null || true', type:'manual'},
        {name:'Tailscale mesh join', desc:'Join T1NK3R cluster mesh VPN', cmd:'sudo tailscale up', type:'manual'},
        {name:'rclone (offsite sync)', desc:'Backup layer for the float', cmd:'sudo dnf install -y rclone', type:'dnf'},
        {name:'Btrfs snapshot tools', desc:'Snapper — matches the float\'s btrfs layout', cmd:'sudo dnf install -y snapper btrfs-progs', type:'dnf'},
      ]},
  ],

  ubuntu: [
    { id:'u-bootstrap', icon:'🔧', title:'BOOTSTRAP (AUTO-RUNS FIRST)',
      items:[
        {name:'apt update + upgrade', desc:'Sync package lists before anything else', cmd:'sudo apt update && sudo apt upgrade -y', type:'apt'},
        {name:'build-essential + git', desc:'gcc/make/headers', cmd:'sudo apt install -y build-essential git curl wget ca-certificates', type:'apt'},
        {name:'Flatpak + Flathub', desc:'Not installed by default on Ubuntu', cmd:'sudo apt install -y flatpak && flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo', type:'apt'},
        {name:'snapd', desc:'Ubuntu-native store', cmd:'sudo apt install -y snapd', type:'apt'},
        {name:'pipx', desc:'Required — 24.04+ blocks system-wide pip', cmd:'sudo apt install -y pipx', type:'apt'},
        {name:'nvm → Node LTS', desc:'Avoids Ubuntu\'s ancient apt node', cmd:'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash && source ~/.bashrc && nvm install --lts', type:'manual'},
        {name:'Rust + Cargo', desc:'Required for RTK, Yazi, Bevy', cmd:'curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y && source $HOME/.cargo/env', type:'manual'},
        {name:'ubuntu-restricted-extras', desc:'Codecs + MS core fonts', cmd:'sudo apt install -y ubuntu-restricted-extras', type:'apt'},
      ]},
    { id:'u-cliai', icon:'🖥️', title:'CLI AI TOOLS',
      items:[
        {name:'Claude Code (Hermes)', desc:'Primary agentic coding CLI', cmd:'npm install -g @anthropic-ai/claude-code', type:'npm'},
        {name:'Gemini CLI', desc:'Google Gemini — codegen layer', cmd:'npm install -g @google/gemini-cli', type:'npm'},
        {name:'OpenAI Codex CLI', desc:'OpenAI Codex — OpenRouter Tier 1', cmd:'npm install -g @openai/codex', type:'npm'},
        {name:'OpenCode', desc:'Open-source multi-provider AI CLI', cmd:'npm install -g opencode-ai', type:'npm'},
        {name:'Aider', desc:'AI pair programmer — git-aware', cmd:'pipx install aider-chat', type:'pip'},
        {name:'Shell-GPT', desc:'LLM queries in terminal', cmd:'pipx install shell-gpt', type:'pip'},
        {name:'LLM (Willison)', desc:'Universal LLM CLI', cmd:'pipx install llm', type:'pip'},
        {name:'RTK', desc:'Token compression for Claude Code', cmd:'cargo install rtk && rtk init -g', type:'cargo'},
        {name:'Yazi File Manager', desc:'Not packaged on LTS — build via cargo', cmd:'cargo install yazi-fm yazi-cli', type:'cargo'},
      ]},
    { id:'u-sovereign', icon:'🛡️', title:'SOVEREIGN STACK',
      items:[
        {name:'Ollama 0.17.1+', desc:'Local LLM runner — official installer', cmd:'curl -fsSL https://ollama.com/install.sh | sh', type:'manual'},
        {name:'Docker + Compose', desc:'Container engine from Ubuntu repos', cmd:'sudo apt install -y docker.io docker-compose-v2', type:'apt'},
        {name:'Open WebUI', desc:'Browser UI for Ollama — port 3000', cmd:'docker run -d -p 3000:8080 --add-host=host.docker.internal:host-gateway -v open-webui:/app/backend/data --name open-webui --restart always ghcr.io/open-webui/open-webui:main', type:'manual'},
        {name:'LocalSend', desc:'Sovereign LAN file transfer', cmd:'flatpak install -y flathub org.localsend.localsend_app', type:'flatpak'},
        {name:'KeePassXC', desc:'Offline password manager', cmd:'sudo apt install -y keepassxc', type:'apt'},
        {name:'Whisper STT', desc:'Local speech recognition', cmd:'pipx install openai-whisper', type:'pip'},
        {name:'Piper TTS', desc:'Local neural TTS', cmd:'pipx install piper-tts', type:'pip'},
        {name:'Porcupine Wake Word', desc:'"Hey Alfred" wake engine', cmd:'pipx install pvporcupine', type:'pip'},
      ]},
    { id:'u-companions', icon:'🤝', title:'COMPANION MODELS',
      items:[
        {name:'Alfred — qwen3:8b', desc:'Always warm', cmd:'ollama pull qwen3:8b', type:'ollama'},
        {name:'Steward — deepseek-r1:14b', desc:'Always warm', cmd:'ollama pull deepseek-r1:14b', type:'ollama'},
        {name:'Scout — llama3.2:3b', desc:'Always warm', cmd:'ollama pull llama3.2:3b', type:'ollama'},
        {name:'Daisy — gemma2:2b', desc:'Safe Space support', cmd:'ollama pull gemma2:2b', type:'ollama'},
        {name:'Coach — llama3.2:3b', desc:'Motivation', cmd:'ollama pull llama3.2:3b', type:'ollama'},
        {name:'Spark — phi3.5:latest', desc:'Inspiration engine', cmd:'ollama pull phi3.5:latest', type:'ollama'},
        {name:'Solace — llama3.2:1b', desc:'Deep creative voice', cmd:'ollama pull llama3.2:1b', type:'ollama'},
        {name:'Sage — phi4:14b', desc:'Knowledge layer', cmd:'ollama pull phi4:14b', type:'ollama'},
        {name:'Luna — gemma2:2b', desc:'P.A.W.S. / living systems', cmd:'ollama pull gemma2:2b', type:'ollama'},
        {name:'Tink — qwen2.5vl:7b', desc:'Ward — vision-capable', cmd:'ollama pull qwen2.5vl:7b', type:'ollama'},
        {name:'Wren — qwen2.5:1.5b', desc:'Ward', cmd:'ollama pull qwen2.5:1.5b', type:'ollama'},
        {name:'Qwen — qwen2.5:3b', desc:'Ward', cmd:'ollama pull qwen2.5:3b', type:'ollama'},
        {name:'Remy — smollm2:1.7b', desc:'Ward — lightweight', cmd:'ollama pull smollm2:1.7b', type:'ollama'},
        {name:'moondream', desc:'Vision / daydreaming utility model', cmd:'ollama pull moondream', type:'ollama'},
        {name:'nomic-embed-text', desc:'RAG embeddings', cmd:'ollama pull nomic-embed-text', type:'ollama'},
      ]},
    { id:'u-dev', icon:'💻', title:'DEVELOPMENT',
      items:[
        {name:'Git + GitHub CLI', desc:'Version control — kalifurd', cmd:'sudo apt install -y git gh', type:'apt'},
        {name:'VS Code', desc:'Primary editor', cmd:'sudo snap install code --classic', type:'snap'},
        {name:'Neovim', desc:'Hyperextensible Vim', cmd:'sudo apt install -y neovim', type:'apt'},
        {name:'Python 3 + venv', desc:'Python toolchain', cmd:'sudo apt install -y python3 python3-pip python3-venv', type:'apt'},
        {name:'Go', desc:'Google systems language', cmd:'sudo apt install -y golang-go', type:'apt'},
        {name:'Java 21 (OpenJDK)', desc:'JVM runtime + compiler', cmd:'sudo apt install -y openjdk-21-jdk', type:'apt'},
        {name:'tmux + zsh + htop', desc:'Terminal essentials', cmd:'sudo apt install -y tmux zsh htop', type:'apt'},
        {name:'bat + ripgrep + fzf + fd', desc:'Modern CLI search stack', cmd:'sudo apt install -y bat ripgrep fzf fd-find', type:'apt'},
        {name:'Meld', desc:'Visual diff/merge', cmd:'sudo apt install -y meld', type:'apt'},
        {name:'SQLite + DB Browser', desc:'Local database work', cmd:'sudo apt install -y sqlite3 sqlitebrowser', type:'apt'},
      ]},
    { id:'u-gaming', icon:'🎮', title:'GAMING / EMULATION',
      items:[
        {name:'Steam', desc:'Ubuntu multiverse build', cmd:'sudo apt install -y steam', type:'apt'},
        {name:'Lutris', desc:'Wine/Proton game manager', cmd:'sudo apt install -y lutris', type:'apt'},
        {name:'Wine + winetricks', desc:'Windows compatibility layer', cmd:'sudo apt install -y wine winetricks', type:'apt'},
        {name:'MangoHud + GOverlay', desc:'FPS/thermal overlay + GUI config', cmd:'sudo apt install -y mangohud goverlay', type:'apt'},
        {name:'GameMode', desc:'CPU governor switch while gaming', cmd:'sudo apt install -y gamemode', type:'apt'},
        {name:'Heroic Games Launcher', desc:'Epic / GOG / Amazon', cmd:'flatpak install -y flathub com.heroicgameslauncher.hgl', type:'flatpak'},
        {name:'ProtonUp-Qt', desc:'Install GE-Proton builds', cmd:'flatpak install -y flathub net.davidotek.pupgui2', type:'flatpak'},
        {name:'RetroArch', desc:'Multi-system emulator frontend', cmd:'flatpak install -y flathub org.libretro.RetroArch', type:'flatpak'},
        {name:'Dolphin (GC/Wii)', desc:'Nintendo emulator', cmd:'flatpak install -y flathub org.DolphinEmu.dolphin-emu', type:'flatpak'},
        {name:'PCSX2 (PS2)', desc:'PlayStation 2 emulator', cmd:'flatpak install -y flathub net.pcsx2.PCSX2', type:'flatpak'},
        {name:'DuckStation (PS1)', desc:'PlayStation 1 emulator', cmd:'flatpak install -y flathub org.duckstation.DuckStation', type:'flatpak'},
        {name:'RPCS3 (PS3)', desc:'PlayStation 3 emulator', cmd:'flatpak install -y flathub net.rpcs3.RPCS3', type:'flatpak'},
        {name:'PPSSPP (PSP)', desc:'PSP emulator', cmd:'flatpak install -y flathub org.ppsspp.PPSSPP', type:'flatpak'},
        {name:'ScummVM', desc:'Classic adventure engine', cmd:'sudo apt install -y scummvm', type:'apt'},
      ]},
    { id:'u-engines', icon:'🕹️', title:'GAME ENGINES / 3D',
      items:[
        {name:'Godot 4', desc:'Open-source engine — T1NK3R Games', cmd:'sudo snap install godot-4', type:'snap'},
        {name:'Blender', desc:'3D modeling / VIGA / Modly', cmd:'sudo snap install blender --classic', type:'snap'},
        {name:'Unity Hub', desc:'Unity engine manager — AppImage/manual', cmd:'# Download Unity Hub AppImage from unity.com/download', type:'manual'},
        {name:'Unreal Engine 5', desc:'Build from source via Epic GitHub access', cmd:'# github.com/EpicGames/UnrealEngine — requires linked Epic account', type:'manual'},
        {name:'Bevy (Rust engine)', desc:'ECS game engine — cargo template', cmd:'cargo install cargo-generate', type:'cargo'},
        {name:'LÖVE 2D', desc:'Lua game framework', cmd:'sudo apt install -y love', type:'apt'},
        {name:'FreeCAD', desc:'Parametric CAD', cmd:'sudo apt install -y freecad', type:'apt'},
        {name:'OpenSCAD', desc:'Script-driven CAD', cmd:'sudo apt install -y openscad', type:'apt'},
      ]},
    { id:'u-daw', icon:'🎚️', title:'DAWs',
      items:[
        {name:'Ardour', desc:'Full pro DAW', cmd:'sudo apt install -y ardour', type:'apt'},
        {name:'Reaper', desc:'Lightweight pro DAW', cmd:'flatpak install -y flathub fm.reaper.Reaper', type:'flatpak'},
        {name:'LMMS', desc:'FL Studio-style beat production', cmd:'sudo apt install -y lmms', type:'apt'},
        {name:'Audacity', desc:'Audio editor & recorder', cmd:'sudo apt install -y audacity', type:'apt'},
        {name:'Zrythm', desc:'Modern modular DAW', cmd:'flatpak install -y flathub org.zrythm.Zrythm', type:'flatpak'},
        {name:'Mixxx', desc:'DJ software — T1NK3R.FM', cmd:'sudo apt install -y mixxx', type:'apt'},
        {name:'Qtractor', desc:'MIDI/audio sequencer', cmd:'sudo apt install -y qtractor', type:'apt'},
      ]},
    { id:'u-audio', icon:'🔊', title:'AUDIO / SYNTHS / FX',
      items:[
        {name:'PipeWire + JACK bridge', desc:'Pro audio routing', cmd:'sudo apt install -y pipewire pipewire-jack wireplumber', type:'apt'},
        {name:'qpwgraph', desc:'PipeWire visual patchbay', cmd:'sudo apt install -y qpwgraph', type:'apt'},
        {name:'Carla Plugin Host', desc:'VST/LV2 host', cmd:'sudo apt install -y carla', type:'apt'},
        {name:'EasyEffects', desc:'System audio effects — EQ/compression', cmd:'flatpak install -y flathub com.github.wwmm.easyeffects', type:'flatpak'},
        {name:'Calf + LSP + x42 plugins', desc:'Core LV2 plugin suites', cmd:'sudo apt install -y calf-plugins lsp-plugins x42-plugins', type:'apt'},
        {name:'Surge XT', desc:'Hybrid wavetable synth', cmd:'flatpak install -y flathub org.surge_synth_team.SurgeXT', type:'flatpak'},
        {name:'Vital Synth', desc:'Spectral wavetable — free tier', cmd:'# Download from vital.audio (free account required)', type:'manual'},
        {name:'Hydrogen Drum Machine', desc:'Drum machine / step sequencer', cmd:'sudo apt install -y hydrogen', type:'apt'},
        {name:'FluidSynth + soundfont', desc:'General MIDI synth engine', cmd:'sudo apt install -y fluidsynth fluid-soundfont-gm', type:'apt'},
        {name:'ZynAddSubFX + Yoshimi', desc:'Classic Linux softsynths', cmd:'sudo apt install -y zynaddsubfx yoshimi', type:'apt'},
        {name:'Ubuntu Studio audio config', desc:'Realtime privileges + low-latency tuning', cmd:'sudo apt install -y ubuntustudio-audio-core', type:'apt'},
      ]},
    { id:'u-media', icon:'📺', title:'MEDIA / T1NK3R.TV',
      items:[
        {name:'VLC', desc:'Universal media player', cmd:'sudo apt install -y vlc', type:'apt'},
        {name:'mpv', desc:'CLI/GPU media player', cmd:'sudo apt install -y mpv', type:'apt'},
        {name:'yt-dlp', desc:'YouTube downloader — newer than apt', cmd:'pipx install yt-dlp', type:'pip'},
        {name:'Kodi', desc:'Media center — T1NK3R.TV frontend', cmd:'sudo apt install -y kodi', type:'apt'},
        {name:'Jellyfin Server', desc:'Local media streaming server', cmd:'flatpak install -y flathub org.jellyfin.JellyfinServer', type:'flatpak'},
        {name:'Strawberry', desc:'Local music library player', cmd:'sudo apt install -y strawberry', type:'apt'},
        {name:'Calibre', desc:'E-book manager', cmd:'sudo apt install -y calibre', type:'apt'},
        {name:'HandBrake', desc:'Video transcoder', cmd:'sudo apt install -y handbrake', type:'apt'},
      ]},
    { id:'u-art', icon:'🎨', title:'ART / VIDEO',
      items:[
        {name:'GIMP', desc:'GNU image manipulation', cmd:'sudo apt install -y gimp', type:'apt'},
        {name:'Krita', desc:'Professional digital painting', cmd:'sudo apt install -y krita', type:'apt'},
        {name:'Inkscape', desc:'Vector graphics (SVG)', cmd:'sudo apt install -y inkscape', type:'apt'},
        {name:'Darktable', desc:'RAW photo workflow', cmd:'sudo apt install -y darktable', type:'apt'},
        {name:'OBS Studio', desc:'Streaming & screen recording', cmd:'sudo apt install -y obs-studio', type:'apt'},
        {name:'Kdenlive', desc:'KDE video editor', cmd:'sudo apt install -y kdenlive', type:'apt'},
        {name:'DaVinci Resolve', desc:'Pro video editor — ACE ViMax backend', cmd:'# Download from blackmagicdesign.com — needs ROCm/OpenCL for AMD', type:'manual'},
        {name:'Upscayl', desc:'AI image upscaler', cmd:'flatpak install -y flathub org.upscayl.Upscayl', type:'flatpak'},
        {name:'FFmpeg', desc:'CLI multimedia toolkit', cmd:'sudo apt install -y ffmpeg', type:'apt'},
      ]},
    { id:'u-creai', icon:'🤖', title:'CREATIVE AI / ACE STACK',
      items:[
        {name:'ComfyUI', desc:'Node-based Stable Diffusion — ROCm build', cmd:'git clone https://github.com/comfyanonymous/ComfyUI.git ~/tinker-verse/comfyui && cd ~/tinker-verse/comfyui && python3 -m venv venv && source venv/bin/activate && pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/rocm6.0 && pip install -r requirements.txt', type:'manual'},
        {name:'Fooocus', desc:'Easy high-quality local image gen', cmd:'git clone https://github.com/lllyasviel/Fooocus.git ~/tinker-verse/fooocus', type:'manual'},
        {name:'SD WebUI Forge', desc:'Modern A1111 with video support', cmd:'git clone https://github.com/lllyasviel/stable-diffusion-webui-forge.git ~/tinker-verse/sd-forge', type:'manual'},
        {name:'InvokeAI', desc:'Clean professional SD interface', cmd:'pipx install InvokeAI', type:'pip'},
        {name:'ACE-Step UI', desc:'ACE music generation step UI', cmd:'git clone https://github.com/ace-step/ACE-Step.git ~/tinker-verse/ace-step', type:'manual'},
        {name:'text-generation-webui', desc:'Oobabooga — local model chat UI', cmd:'git clone https://github.com/oobabooga/text-generation-webui.git ~/tinker-verse/text-gen-webui', type:'manual'},
        {name:'Diffusers (HuggingFace)', desc:'Core AI image library', cmd:'pipx install diffusers', type:'pip'},
        {name:'FreeMoCap', desc:'Markerless motion capture — ACE Visual', cmd:'pipx install freemocap', type:'pip'},
      ]},
    { id:'u-homelab', icon:'🏠', title:'HOMELAB / SELF-HOSTED',
      items:[
        {name:'Portainer', desc:'Docker web UI', cmd:'docker run -d -p 9000:9000 --name portainer --restart always -v /var/run/docker.sock:/var/run/docker.sock -v portainer_data:/data portainer/portainer-ce', type:'manual'},
        {name:'Open WebUI', desc:'Ollama chat front-end — port 3000', cmd:'docker run -d -p 3000:8080 --add-host=host.docker.internal:host-gateway -v open-webui:/app/backend/data --name open-webui --restart always ghcr.io/open-webui/open-webui:main', type:'manual'},
        {name:'Vaultwarden', desc:'Self-hosted Bitwarden', cmd:'docker run -d -p 8222:80 --name vaultwarden --restart unless-stopped -v ~/vaultwarden:/data vaultwarden/server:latest', type:'manual'},
        {name:'Nextcloud AIO', desc:'Full private cloud', cmd:'docker run -d -p 8080:8080 --name nextcloud-aio-mastercontainer --restart always -v nextcloud_aio_mastercontainer:/mnt/docker-aio-config -v /var/run/docker.sock:/var/run/docker.sock nextcloud/all-in-one:latest', type:'manual'},
        {name:'Uptime Kuma', desc:'Monitoring dashboard', cmd:'docker run -d -p 3002:3001 --name uptime-kuma --restart unless-stopped -v uptime-kuma:/app/data louislam/uptime-kuma:1', type:'manual'},
        {name:'AnythingLLM', desc:'RAG + LLM front-end', cmd:'docker run -d -p 3003:3001 --name anythingllm --restart unless-stopped mintplexlabs/anythingllm', type:'manual'},
        {name:'Home Assistant', desc:'Home automation hub', cmd:'docker run -d -p 8123:8123 --name homeassistant --restart unless-stopped -v ~/homeassistant:/config ghcr.io/home-assistant/home-assistant:stable', type:'manual'},
        {name:'Syncthing', desc:'Peer-to-peer file sync', cmd:'sudo apt install -y syncthing', type:'apt'},
      ]},
    { id:'u-sdr', icon:'📡', title:'SDR / RF / T1NK3R.FM',
      items:[
        {name:'rtl-sdr tools', desc:'RTL2832U dongle drivers + CLI', cmd:'sudo apt install -y rtl-sdr', type:'apt'},
        {name:'GQRX', desc:'SDR receiver GUI', cmd:'sudo apt install -y gqrx-sdr', type:'apt'},
        {name:'GNU Radio', desc:'DSP flowgraph toolkit', cmd:'sudo apt install -y gnuradio', type:'apt'},
        {name:'SDR++', desc:'Modern cross-platform SDR receiver', cmd:'flatpak install -y flathub org.sdrpp.SDRPlusPlus', type:'flatpak'},
        {name:'CubicSDR', desc:'Wideband SDR waterfall', cmd:'sudo apt install -y cubicsdr', type:'apt'},
        {name:'multimon-ng', desc:'Digital mode decoder (POCSAG, etc.)', cmd:'sudo apt install -y multimon-ng', type:'apt'},
        {name:'dump1090-fa', desc:'ADS-B aircraft tracking', cmd:'sudo apt install -y dump1090-fa', type:'apt'},
        {name:'CHIRP', desc:'Radio programming (Baofeng etc.)', cmd:'flatpak install -y flathub com.danplanet.chirp', type:'flatpak'},
      ]},
    { id:'u-print3d', icon:'🖨️', title:'3D PRINTING (BAMBU P1S)',
      items:[
        {name:'Bambu Studio', desc:'Official P1S slicer', cmd:'flatpak install -y flathub com.bambulab.BambuStudio', type:'flatpak'},
        {name:'OrcaSlicer', desc:'Community fork — better P1S profiles', cmd:'flatpak install -y flathub io.github.softfever.OrcaSlicer', type:'flatpak'},
        {name:'PrusaSlicer', desc:'Alternative slicer', cmd:'sudo apt install -y prusa-slicer', type:'apt'},
        {name:'Cura', desc:'Ultimaker slicer', cmd:'flatpak install -y flathub com.ultimaker.cura', type:'flatpak'},
        {name:'OctoPrint (container)', desc:'Printer web controller — LAN only', cmd:'docker run -d -p 5000:5000 --name octoprint --restart unless-stopped -v octoprint:/octoprint octoprint/octoprint', type:'manual'},
        {name:'FreeCAD', desc:'Parametric CAD for printable parts', cmd:'sudo apt install -y freecad', type:'apt'},
        {name:'Blender', desc:'Mesh sculpting / repair', cmd:'sudo snap install blender --classic', type:'snap'},
        {name:'MeshLab', desc:'Mesh cleanup and repair', cmd:'sudo apt install -y meshlab', type:'apt'},
      ]},
    { id:'u-network', icon:'🌐', title:'NETWORKING / SECURITY',
      items:[
        {name:'Tailscale', desc:'Mesh VPN — cluster access', cmd:'curl -fsSL https://tailscale.com/install.sh | sh', type:'manual'},
        {name:'WireGuard tools', desc:'Modern VPN', cmd:'sudo apt install -y wireguard-tools', type:'apt'},
        {name:'Wireshark', desc:'Network protocol analyzer', cmd:'sudo apt install -y wireshark', type:'apt'},
        {name:'Nmap', desc:'Network scanner', cmd:'sudo apt install -y nmap', type:'apt'},
        {name:'OpenSSH server', desc:'Remote access into this box', cmd:'sudo apt install -y openssh-server', type:'apt'},
        {name:'UFW firewall', desc:'Simple firewall front-end', cmd:'sudo apt install -y ufw', type:'apt'},
        {name:'croc + magic-wormhole', desc:'One-shot encrypted file transfer', cmd:'sudo apt install -y magic-wormhole', type:'apt'},
      ]},
    { id:'u-writing', icon:'✍️', title:'WRITING / KNOWLEDGE',
      items:[
        {name:'LibreOffice', desc:'Full office suite', cmd:'sudo apt install -y libreoffice', type:'apt'},
        {name:'Obsidian', desc:'Markdown PKM — Tinker-Verse vault', cmd:'flatpak install -y flathub md.obsidian.Obsidian', type:'flatpak'},
        {name:'Logseq', desc:'Outliner PKM alternative', cmd:'flatpak install -y flathub com.logseq.Logseq', type:'flatpak'},
        {name:'Zotero', desc:'Reference manager', cmd:'flatpak install -y flathub org.zotero.Zotero', type:'flatpak'},
        {name:'Pandoc', desc:'Universal document converter', cmd:'sudo apt install -y pandoc', type:'apt'},
        {name:'TeX Live', desc:'LaTeX typesetting', cmd:'sudo apt install -y texlive-latex-recommended', type:'apt'},
      ]},
    { id:'u-upgrades', icon:'⬆️', title:'UPGRADES / SYSTEM UPDATES',
      items:[
        {name:'apt full-upgrade', desc:'Update every package', cmd:'sudo apt update && sudo apt full-upgrade -y', type:'apt'},
        {name:'Flatpak update all', desc:'Update every Flatpak', cmd:'flatpak update -y', type:'flatpak'},
        {name:'snap refresh', desc:'Update every snap', cmd:'sudo snap refresh', type:'snap'},
        {name:'Claude Code upgrade', desc:'Upgrade Hermes CLI', cmd:'npm update -g @anthropic-ai/claude-code', type:'npm'},
        {name:'Gemini CLI upgrade', desc:'Upgrade Gemini CLI', cmd:'npm update -g @google/gemini-cli', type:'npm'},
        {name:'Ollama upgrade', desc:'Re-run official installer', cmd:'curl -fsSL https://ollama.com/install.sh | sh', type:'manual'},
        {name:'pipx upgrade all', desc:'Upgrade every pipx tool', cmd:'pipx upgrade-all', type:'pip'},
        {name:'apt autoremove', desc:'Drop orphaned dependencies', cmd:'sudo apt autoremove -y', type:'apt'},
      ]},
    { id:'u-crosstech', icon:'🔗', title:'CROSS-TECH EXTENSIONS',
      items:[
        {name:'tinker-verse dir structure', desc:'Create canonical project dirs', cmd:'mkdir -p ~/tinker-verse/{ai,games,luna,forge}', type:'manual'},
        {name:'OpenRouter env file', desc:'Key at the canonical path', cmd:'mkdir -p ~/.config/tinker-verse && chmod 600 ~/.config/tinker-verse/openrouter.env 2>/dev/null || true', type:'manual'},
        {name:'Tailscale mesh join', desc:'Join T1NK3R cluster mesh VPN', cmd:'sudo tailscale up', type:'manual'},
        {name:'rclone (offsite sync)', desc:'Backup layer for the float', cmd:'sudo apt install -y rclone', type:'apt'},
        {name:'WSL note (if this is WSL)', desc:'systemd needs enabling inside WSL2', cmd:'# Add to /etc/wsl.conf: [boot]\\nsystemd=true — then: wsl --shutdown', type:'manual'},
      ]},
  ],

  arch: [
    { id:'a-bootstrap', icon:'🔧', title:'BOOTSTRAP (AUTO-RUNS FIRST)',
      items:[
        {name:'base-devel + git', desc:'Prerequisite for yay / AUR builds', cmd:'sudo pacman -S --needed --noconfirm base-devel git', type:'pacman'},
        {name:'reflector mirror sort', desc:'Fast mirrors first — everything after depends on it', cmd:'sudo pacman -S --needed --noconfirm reflector', type:'pacman'},
        {name:'Flatpak + Flathub + FUSE', desc:'Flatpak runtime, FUSE for AppImages and the Flathub remote — needed before any Flatpak app', cmd:'sudo pacman -S --needed --noconfirm flatpak fuse2 && flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo', type:'pacman'},
        {name:'pipx', desc:'Isolated Python tool runner', cmd:'sudo pacman -S --needed --noconfirm python-pipx', type:'pacman'},
        {name:'nvm → Node LTS', desc:'Required for CLI AI tools', cmd:'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash && source ~/.bashrc && nvm install --lts', type:'manual'},
        {name:'rustup', desc:'Rust toolchain manager', cmd:'sudo pacman -S --needed --noconfirm rustup', type:'pacman'},
      ]},
    { id:'a-cliai', icon:'🖥️', title:'CLI AI TOOLS',
      items:[
        {name:'Claude Code (Hermes)', desc:'Primary agentic coding CLI', cmd:'npm install -g @anthropic-ai/claude-code', type:'npm'},
        {name:'Gemini CLI', desc:'Google Gemini — codegen layer', cmd:'npm install -g @google/gemini-cli', type:'npm'},
        {name:'OpenAI Codex CLI', desc:'OpenAI Codex — OpenRouter Tier 1', cmd:'npm install -g @openai/codex', type:'npm'},
        {name:'OpenCode', desc:'Open-source multi-provider AI CLI', cmd:'npm install -g opencode-ai', type:'npm'},
        {name:'Aider', desc:'AI pair programmer — git-aware', cmd:'pipx install aider-chat', type:'pip'},
        {name:'Shell-GPT', desc:'LLM queries in terminal', cmd:'pipx install shell-gpt', type:'pip'},
        {name:'LLM (Willison)', desc:'Universal LLM CLI', cmd:'pipx install llm', type:'pip'},
        {name:'RTK', desc:'Token compression for Claude Code', cmd:'cargo install rtk && rtk init -g', type:'cargo'},
        {name:'Yazi File Manager', desc:'Rust terminal file manager', cmd:'sudo pacman -S --needed --noconfirm yazi', type:'pacman'},
      ]},
    { id:'a-sovereign', icon:'🛡️', title:'SOVEREIGN STACK',
      items:[
        {name:'Ollama 0.17.1+', desc:'Local LLM — in extra repo', cmd:'sudo pacman -S --needed --noconfirm ollama', type:'pacman'},
        {name:'Ollama ROCm build', desc:'AMD GPU acceleration variant', cmd:'sudo pacman -S --needed --noconfirm ollama-rocm', type:'pacman'},
        {name:'Docker CE', desc:'Container engine', cmd:'sudo pacman -S --needed --noconfirm docker docker-compose', type:'pacman'},
        {name:'Open WebUI', desc:'Browser UI for Ollama — port 3000', cmd:'docker run -d -p 3000:8080 --add-host=host.docker.internal:host-gateway -v open-webui:/app/backend/data --name open-webui --restart always ghcr.io/open-webui/open-webui:main', type:'manual'},
        {name:'LocalSend', desc:'Sovereign LAN file transfer', cmd:'flatpak install -y flathub org.localsend.localsend_app', type:'flatpak'},
        {name:'KeePassXC', desc:'Offline password manager', cmd:'sudo pacman -S --needed --noconfirm keepassxc', type:'pacman'},
        {name:'Whisper STT', desc:'Local speech recognition', cmd:'pipx install openai-whisper', type:'pip'},
        {name:'Piper TTS', desc:'Local neural TTS', cmd:'pipx install piper-tts', type:'pip'},
        {name:'Porcupine Wake Word', desc:'"Hey Alfred" wake engine', cmd:'pipx install pvporcupine', type:'pip'},
      ]},
    { id:'a-companions', icon:'🤝', title:'COMPANION MODELS',
      items:[
        {name:'Alfred — qwen3:8b', desc:'Always warm', cmd:'ollama pull qwen3:8b', type:'ollama'},
        {name:'Steward — deepseek-r1:14b', desc:'Always warm', cmd:'ollama pull deepseek-r1:14b', type:'ollama'},
        {name:'Scout — llama3.2:3b', desc:'Always warm', cmd:'ollama pull llama3.2:3b', type:'ollama'},
        {name:'Daisy — gemma2:2b', desc:'Safe Space support', cmd:'ollama pull gemma2:2b', type:'ollama'},
        {name:'Coach — llama3.2:3b', desc:'Motivation', cmd:'ollama pull llama3.2:3b', type:'ollama'},
        {name:'Spark — phi3.5:latest', desc:'Inspiration engine', cmd:'ollama pull phi3.5:latest', type:'ollama'},
        {name:'Solace — llama3.2:1b', desc:'Deep creative voice', cmd:'ollama pull llama3.2:1b', type:'ollama'},
        {name:'Sage — phi4:14b', desc:'Knowledge layer', cmd:'ollama pull phi4:14b', type:'ollama'},
        {name:'Luna — gemma2:2b', desc:'P.A.W.S. / living systems', cmd:'ollama pull gemma2:2b', type:'ollama'},
        {name:'Tink — qwen2.5vl:7b', desc:'Ward — vision-capable', cmd:'ollama pull qwen2.5vl:7b', type:'ollama'},
        {name:'Wren — qwen2.5:1.5b', desc:'Ward', cmd:'ollama pull qwen2.5:1.5b', type:'ollama'},
        {name:'Qwen — qwen2.5:3b', desc:'Ward', cmd:'ollama pull qwen2.5:3b', type:'ollama'},
        {name:'Remy — smollm2:1.7b', desc:'Ward — lightweight', cmd:'ollama pull smollm2:1.7b', type:'ollama'},
        {name:'moondream', desc:'Vision / daydreaming utility model', cmd:'ollama pull moondream', type:'ollama'},
        {name:'nomic-embed-text', desc:'RAG embeddings', cmd:'ollama pull nomic-embed-text', type:'ollama'},
      ]},
    { id:'a-dev', icon:'💻', title:'DEVELOPMENT',
      items:[
        {name:'Neovim', desc:'Terminal editor', cmd:'sudo pacman -S --needed --noconfirm neovim', type:'pacman', license:'Apache-2.0', help:'https://neovim.io/', helpType:'site'},
        {name:'Code - OSS', desc:'Open-source build of VS Code', cmd:'sudo pacman -S --needed --noconfirm code', type:'pacman', license:'MIT'},
        {name:'Podman', desc:'Containers without a root daemon', cmd:'sudo pacman -S --needed --noconfirm podman', type:'pacman', license:'Apache-2.0', help:'https://podman.io/', helpType:'site'},
        {name:'Docker', desc:'Containers (the docker group is root-equivalent)', cmd:'sudo pacman -S --needed --noconfirm docker', type:'pacman', license:'Apache-2.0'},
        {name:'lazygit', desc:'Git in the terminal', cmd:'sudo pacman -S --needed --noconfirm lazygit', type:'pacman', license:'MIT', help:'https://github.com/sponsors/jesseduffield', helpType:'help'},
        {name:'GitHub CLI', desc:'GitHub from the terminal', cmd:'sudo pacman -S --needed --noconfirm github-cli', type:'pacman', license:'MIT'},
        {name:'Git + GitHub CLI', desc:'Version control — kalifurd', cmd:'sudo pacman -S --needed --noconfirm git github-cli', type:'pacman'},
        {name:'Python + pip', desc:'Python toolchain', cmd:'sudo pacman -S --needed --noconfirm python python-pip', type:'pacman'},
        {name:'Go', desc:'Google systems language', cmd:'sudo pacman -S --needed --noconfirm go', type:'pacman'},
        {name:'Java 21 (OpenJDK)', desc:'JVM runtime + compiler', cmd:'sudo pacman -S --needed --noconfirm jdk21-openjdk', type:'pacman'},
        {name:'tmux + zsh + htop', desc:'Terminal essentials', cmd:'sudo pacman -S --needed --noconfirm tmux zsh htop', type:'pacman'},
        {name:'bat + ripgrep + fzf + fd', desc:'Modern CLI search stack', cmd:'sudo pacman -S --needed --noconfirm bat ripgrep fzf fd', type:'pacman'},
        {name:'SQLite + DB Browser', desc:'Local database work', cmd:'sudo pacman -S --needed --noconfirm sqlite sqlitebrowser', type:'pacman'},
      ]},
    { id:'a-engines', icon:'🕹️', title:'GAME ENGINES / 3D',
      items:[
        {name:'Godot', desc:'Game engine', cmd:'sudo pacman -S --needed --noconfirm godot', type:'pacman', license:'MIT', help:'https://godotengine.org/donate/', helpType:'help'},
        {name:'Blender', desc:'3D modeling and animation', cmd:'sudo pacman -S --needed --noconfirm blender', type:'pacman', license:'GPL-3.0-or-later', help:'https://fund.blender.org/', helpType:'help'},
        {name:'Bevy (Rust engine)', desc:'ECS game engine — cargo template', cmd:'cargo install cargo-generate', type:'cargo'},
        {name:'LÖVE 2D', desc:'Lua game framework', cmd:'sudo pacman -S --needed --noconfirm love', type:'pacman'},
      ]},
    { id:'a-daw', icon:'🎚️', title:'DAWs',
      items:[
        {name:'Ardour', desc:'Full recording studio', cmd:'sudo pacman -S --needed --noconfirm ardour', type:'pacman', license:'GPL-2.0-or-later', help:'https://ardour.org/', helpType:'site'},
        {name:'Qtractor', desc:'Lighter audio and MIDI sequencer', cmd:'sudo pacman -S --needed --noconfirm qtractor', type:'pacman', license:'GPL-2.0-or-later', help:'https://qtractor.sourceforge.io/', helpType:'site'},
        {name:'LMMS', desc:'Beat-making for beginners. Stable build is 1.2.2; 1.3 is in testing', cmd:'sudo pacman -S --needed --noconfirm lmms', type:'pacman', license:'GPL-2.0-or-later', help:'https://lmms.io/get-involved/', helpType:'help'},
        {name:'Mixxx', desc:'DJ software — T1NK3R.FM', cmd:'sudo pacman -S --needed --noconfirm mixxx', type:'pacman'},
      ]},
    { id:'a-audio', icon:'🔊', title:'AUDIO / SYNTHS / FX',
      items:[
        {name:'Audacity', desc:'Audio editor', cmd:'sudo pacman -S --needed --noconfirm audacity', type:'pacman', license:'GPL-3.0-or-later', help:'https://www.audacityteam.org/community/', helpType:'help'},
        {name:'Surge XT', desc:'Synthesizer', cmd:'sudo pacman -S --needed --noconfirm surge-xt', type:'pacman', license:'GPL-3.0-only', help:'https://surge-synthesizer.github.io/', helpType:'site'},
        {name:'PipeWire full stack', desc:'Audio engine — JACK bridge + ALSA compat', cmd:'sudo pacman -S --needed --noconfirm pipewire pipewire-jack pipewire-alsa pipewire-pulse wireplumber', type:'pacman'},
        {name:'qpwgraph', desc:'PipeWire visual patchbay', cmd:'sudo pacman -S --needed --noconfirm qpwgraph', type:'pacman'},
        {name:'Carla Plugin Host', desc:'VST/LV2 host', cmd:'sudo pacman -S --needed --noconfirm carla', type:'pacman'},
        {name:'EasyEffects', desc:'System audio effects — EQ/compression', cmd:'sudo pacman -S --needed --noconfirm easyeffects', type:'pacman'},
        {name:'Calf + LSP + x42 plugins', desc:'Core LV2 plugin suites', cmd:'sudo pacman -S --needed --noconfirm calf lsp-plugins x42-plugins', type:'pacman'},
        {name:'Hydrogen Drum Machine', desc:'Drum machine / step sequencer', cmd:'sudo pacman -S --needed --noconfirm hydrogen', type:'pacman'},
        {name:'FluidSynth + soundfont', desc:'General MIDI synth engine', cmd:'sudo pacman -S --needed --noconfirm fluidsynth soundfont-fluid', type:'pacman'},
        {name:'ZynAddSubFX + Yoshimi', desc:'Classic Linux softsynths', cmd:'sudo pacman -S --needed --noconfirm zynaddsubfx yoshimi', type:'pacman'},
        {name:'realtime-privileges', desc:'Low-latency audio scheduling', cmd:'sudo pacman -S --needed --noconfirm realtime-privileges', type:'pacman'},
      ]},
    { id:'a-media', icon:'📺', title:'MEDIA / T1NK3R.TV',
      items:[
        {name:'mpv', desc:'Minimal, fast video player', cmd:'sudo pacman -S --needed --noconfirm mpv', type:'pacman', license:'GPL-2.0-or-later', help:'https://mpv.io/', helpType:'site'},
        {name:'VLC', desc:'Plays almost anything', cmd:'sudo pacman -S --needed --noconfirm vlc', type:'pacman', license:'GPL-2.0-or-later', help:'https://www.videolan.org/contribute.html', helpType:'help'},
        {name:'Strawberry', desc:'Music library player', cmd:'sudo pacman -S --needed --noconfirm strawberry', type:'pacman', license:'GPL-3.0-or-later', help:'https://www.strawberrymusicplayer.org/', helpType:'site'},
        {name:'Calibre', desc:'Ebook library and converter', cmd:'sudo pacman -S --needed --noconfirm calibre', type:'pacman', license:'GPL-3.0-only', help:'https://calibre-ebook.com/donate', helpType:'help'},
        {name:'HandBrake', desc:'Video converter', cmd:'sudo pacman -S --needed --noconfirm handbrake', type:'pacman', license:'GPL-2.0-only', help:'https://handbrake.fr/', helpType:'site'},
        {name:'FFmpeg', desc:'Command-line audio/video converter', cmd:'sudo pacman -S --needed --noconfirm ffmpeg', type:'pacman', license:'GPL-3.0-only', help:'https://ffmpeg.org/donations.html', helpType:'help'},
        {name:'Kodi', desc:'Media center — T1NK3R.TV frontend', cmd:'sudo pacman -S --needed --noconfirm kodi', type:'pacman'},
      ]},
    { id:'a-art', icon:'🎨', title:'ART / VIDEO',
      items:[
        {name:'Krita', desc:'Digital painting and illustration', cmd:'sudo pacman -S --needed --noconfirm krita', type:'pacman', license:'GPL-3.0', help:'https://krita.org/en/support-us/', helpType:'help'},
        {name:'GIMP', desc:'Photo and image editing', cmd:'sudo pacman -S --needed --noconfirm gimp', type:'pacman', license:'GPL-3.0-or-later', help:'https://www.gimp.org/donating/', helpType:'help'},
        {name:'Inkscape', desc:'Vector graphics', cmd:'sudo pacman -S --needed --noconfirm inkscape', type:'pacman', license:'GPL-2.0-or-later', help:'https://inkscape.org/support-us/', helpType:'help'},
        {name:'Kdenlive', desc:'Full video editor', cmd:'sudo pacman -S --needed --noconfirm kdenlive', type:'pacman', license:'GPL-2.0-or-later', help:'https://kdenlive.org/fund/', helpType:'help'},
        {name:'Shotcut', desc:'Simple video editor', cmd:'sudo pacman -S --needed --noconfirm shotcut', type:'pacman', license:'GPL-3.0', help:'https://www.shotcut.org/', helpType:'site'},
        {name:'OpenToonz', desc:'Professional 2D animation', cmd:'sudo pacman -S --needed --noconfirm opentoonz', type:'pacman', license:'BSD-3-Clause', help:'https://opentoonz.github.io/e/', helpType:'site'},
        {name:'Pencil2D', desc:'Simple hand-drawn animation', cmd:'sudo pacman -S --needed --noconfirm pencil2d', type:'pacman', license:'GPL-2.0-only', help:'https://www.pencil2d.org/contribute', helpType:'help'},
        {name:'Darktable', desc:'RAW photo workflow', cmd:'sudo pacman -S --needed --noconfirm darktable', type:'pacman'},
        {name:'OBS Studio', desc:'Streaming & screen recording', cmd:'sudo pacman -S --needed --noconfirm obs-studio', type:'pacman'},
        {name:'Upscayl', desc:'AI image upscaler', cmd:'flatpak install -y flathub org.upscayl.Upscayl', type:'flatpak'},
      ]},
    { id:'a-creai', icon:'🤖', title:'CREATIVE AI / ACE STACK',
      items:[
        {name:'ComfyUI', desc:'Node-based Stable Diffusion — ROCm build', cmd:'git clone https://github.com/comfyanonymous/ComfyUI.git ~/tinker-verse/comfyui && cd ~/tinker-verse/comfyui && python -m venv venv && source venv/bin/activate && pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/rocm6.0 && pip install -r requirements.txt', type:'manual'},
        {name:'Fooocus', desc:'Easy high-quality local image gen', cmd:'git clone https://github.com/lllyasviel/Fooocus.git ~/tinker-verse/fooocus', type:'manual'},
        {name:'SD WebUI Forge', desc:'Modern A1111 with video support', cmd:'git clone https://github.com/lllyasviel/stable-diffusion-webui-forge.git ~/tinker-verse/sd-forge', type:'manual'},
        {name:'InvokeAI', desc:'Clean professional SD interface', cmd:'pipx install InvokeAI', type:'pip'},
        {name:'ACE-Step UI', desc:'ACE music generation step UI', cmd:'git clone https://github.com/ace-step/ACE-Step.git ~/tinker-verse/ace-step', type:'manual'},
        {name:'text-generation-webui', desc:'Oobabooga — local model chat UI', cmd:'git clone https://github.com/oobabooga/text-generation-webui.git ~/tinker-verse/text-gen-webui', type:'manual'},
        {name:'Diffusers (HuggingFace)', desc:'Core AI image library', cmd:'pipx install diffusers', type:'pip'},
        {name:'FreeMoCap', desc:'Markerless motion capture — ACE Visual', cmd:'pipx install freemocap', type:'pip'},
      ]},
    { id:'a-rocm', icon:'🔴', title:'ROCm / AMD GPU (RX 6600)',
      items:[
        {name:'ROCm OpenCL runtime', desc:'AMD compute stack', cmd:'sudo pacman -S --needed --noconfirm rocm-opencl-runtime', type:'pacman'},
        {name:'HIP runtime', desc:'CUDA-equivalent API for AMD', cmd:'sudo pacman -S --needed --noconfirm rocm-hip-runtime', type:'pacman'},
        {name:'rocminfo + clinfo', desc:'Verify the GPU is actually visible', cmd:'sudo pacman -S --needed --noconfirm rocminfo clinfo', type:'pacman'},
        {name:'HSA override (RDNA2)', desc:'RX 6600 needs gfx1030 spoofing', cmd:'echo "export HSA_OVERRIDE_GFX_VERSION=10.3.0" >> ~/.bashrc', type:'manual'},
        {name:'PyTorch ROCm', desc:'GPU torch for ComfyUI / diffusers', cmd:'pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/rocm6.0', type:'manual'},
      ]},
    { id:'a-homelab', icon:'🏠', title:'HOMELAB / SELF-HOSTED',
      items:[
        {name:'Syncthing', desc:'File sync between your devices (service off)', cmd:'sudo pacman -S --needed --noconfirm syncthing', type:'pacman', license:'MPL-2.0'},
        {name:'Jellyfin', desc:'Media server (service off)', cmd:'sudo pacman -S --needed --noconfirm jellyfin-server', type:'pacman', license:'GPL-2.0-or-later'},
        {name:'Cockpit', desc:'Web admin panel (service off)', cmd:'sudo pacman -S --needed --noconfirm cockpit', type:'pacman', license:'LGPL-2.1-or-later'},
        {name:'Nextcloud', desc:'Personal cloud. Advanced: needs a web server and database (service off)', cmd:'sudo pacman -S --needed --noconfirm nextcloud', type:'pacman', license:'AGPL-3.0-or-later'},
        {name:'Portainer', desc:'Docker web UI', cmd:'docker run -d -p 9000:9000 --name portainer --restart always -v /var/run/docker.sock:/var/run/docker.sock -v portainer_data:/data portainer/portainer-ce', type:'manual'},
        {name:'Vaultwarden', desc:'Self-hosted Bitwarden', cmd:'docker run -d -p 8222:80 --name vaultwarden --restart unless-stopped -v ~/vaultwarden:/data vaultwarden/server:latest', type:'manual'},
        {name:'Uptime Kuma', desc:'Monitoring dashboard', cmd:'docker run -d -p 3002:3001 --name uptime-kuma --restart unless-stopped -v uptime-kuma:/app/data louislam/uptime-kuma:1', type:'manual'},
        {name:'AnythingLLM', desc:'RAG + LLM front-end', cmd:'docker run -d -p 3003:3001 --name anythingllm --restart unless-stopped mintplexlabs/anythingllm', type:'manual'},
      ]},
    { id:'a-sdr', icon:'📡', title:'SDR / RF / T1NK3R.FM',
      items:[
        {name:'Gqrx', desc:'Radio receiver', cmd:'sudo pacman -S --needed --noconfirm gqrx', type:'pacman', license:'GPL-3.0-or-later'},
        {name:'GNU Radio', desc:'Signal processing toolkit', cmd:'sudo pacman -S --needed --noconfirm gnuradio', type:'pacman', license:'GPL-3.0-or-later'},
        {name:'rtl-sdr', desc:'Drivers and tools for RTL dongles', cmd:'sudo pacman -S --needed --noconfirm rtl-sdr', type:'pacman', license:'GPL-2.0-only'},
        {name:'multimon-ng', desc:'Digital mode decoder (POCSAG, etc.)', cmd:'sudo pacman -S --needed --noconfirm multimon-ng', type:'pacman'},
        {name:'CHIRP', desc:'Radio programming (Baofeng etc.)', cmd:'flatpak install -y flathub com.chirpmyradio.chirp', type:'flatpak'},
      ]},
    { id:'a-print3d', icon:'🖨️', title:'3D PRINTING (BAMBU P1S)',
      items:[
        {name:'PrusaSlicer', desc:'Slicer, all-rounder', cmd:'sudo pacman -S --needed --noconfirm prusa-slicer', type:'pacman', license:'AGPL-3.0-only'},
        {name:'OrcaSlicer', desc:'Tuned slicer fork', cmd:'flatpak install -y flathub com.orcaslicer.OrcaSlicer', type:'flatpak'},
        {name:'UltiMaker Cura', desc:'Beginner-friendly slicer', cmd:'flatpak install -y flathub com.ultimaker.cura', type:'flatpak'},
        {name:'FreeCAD', desc:'Parametric CAD', cmd:'sudo pacman -S --needed --noconfirm freecad', type:'pacman', license:'LGPL-2.0-only'},
        {name:'OpenSCAD', desc:'Code-based CAD. 2021.01 is the last formal release', cmd:'sudo pacman -S --needed --noconfirm openscad', type:'pacman', license:'GPL-2.0-or-later'},
        {name:'MeshLab', desc:'Clean up scanned or broken 3D models', cmd:'flatpak install -y flathub net.meshlab.MeshLab', type:'flatpak'},
        {name:'Bambu Studio', desc:'Official P1S slicer', cmd:'flatpak install -y flathub com.bambulab.BambuStudio', type:'flatpak'},
        {name:'OctoPrint (container)', desc:'Printer web controller — LAN only', cmd:'docker run -d -p 5000:5000 --name octoprint --restart unless-stopped -v octoprint:/octoprint octoprint/octoprint', type:'manual'},
      ]},
    { id:'a-network', icon:'🌐', title:'NETWORKING / SECURITY',
      items:[
        {name:'Wireshark', desc:'Network analysis', cmd:'sudo pacman -S --needed --noconfirm wireshark-qt', type:'pacman', license:'GPL-2.0-only'},
        {name:'KeePassXC', desc:'Offline password manager', cmd:'sudo pacman -S --needed --noconfirm keepassxc', type:'pacman', license:'GPL-3.0-only'},
        {name:'UFW', desc:'Firewall (installed, not enabled)', cmd:'sudo pacman -S --needed --noconfirm ufw', type:'pacman', license:'GPL-3.0'},
        {name:'Tailscale', desc:'Mesh VPN — cluster access', cmd:'sudo pacman -S --needed --noconfirm tailscale', type:'pacman'},
        {name:'WireGuard tools', desc:'Modern VPN', cmd:'sudo pacman -S --needed --noconfirm wireguard-tools', type:'pacman'},
        {name:'OpenSSH', desc:'Remote access into this box', cmd:'sudo pacman -S --needed --noconfirm openssh', type:'pacman'},
        {name:'croc + magic-wormhole', desc:'One-shot encrypted file transfer', cmd:'sudo pacman -S --needed --noconfirm croc magic-wormhole', type:'pacman'},
      ]},
    { id:'a-writing', icon:'✍️', title:'WRITING / KNOWLEDGE',
      items:[
        {name:'LibreOffice (stable)', desc:'Office suite, stable branch', cmd:'sudo pacman -S --needed --noconfirm libreoffice-still', type:'pacman', license:'LGPL-3.0-or-later', help:'https://www.libreoffice.org/donate/', helpType:'help'},
        {name:'Ghostwriter', desc:'Distraction-free Markdown writing', cmd:'sudo pacman -S --needed --noconfirm ghostwriter', type:'pacman', license:'GPL-2.0-or-later', help:'https://kde.org/community/donations/', helpType:'help'},
        {name:'CherryTree', desc:'Quick hierarchical notes', cmd:'sudo pacman -S --needed --noconfirm cherrytree', type:'pacman', license:'GPL-3.0-or-later'},
        {name:'Zim', desc:'Desktop notebook / personal wiki', cmd:'sudo pacman -S --needed --noconfirm zim', type:'pacman', license:'GPL-2.0-or-later'},
        {name:'Joplin', desc:'Markdown notes, optional sync', cmd:'flatpak install -y flathub net.cozic.joplin_desktop', type:'flatpak', license:'AGPL-3.0-or-later', help:'https://joplinapp.org/donate/', helpType:'help'},
        {name:'Logseq', desc:'Linked notes and outlines', cmd:'flatpak install -y flathub com.logseq.Logseq', type:'flatpak'},
        {name:'Xournal++', desc:'Handwriting and PDF markup', cmd:'sudo pacman -S --needed --noconfirm xournalpp', type:'pacman', license:'GPL-2.0-or-later'},
        {name:'Zotero', desc:'Research citations', cmd:'flatpak install -y flathub org.zotero.Zotero', type:'flatpak'},
        {name:'KBibTeX', desc:'BibTeX editor', cmd:'flatpak install -y flathub org.kde.kbibtex', type:'flatpak'},
        {name:'Pandoc', desc:'Convert documents between formats', cmd:'sudo pacman -S --needed --noconfirm pandoc-cli', type:'pacman', license:'GPL-2.0-or-later', help:'https://pandoc.org/', helpType:'site'},
        {name:'TeX Live', desc:'LaTeX typesetting', cmd:'sudo pacman -S --needed --noconfirm texlive-basic texlive-latex', type:'pacman'},
      ]},
    { id:'a-system', icon:'🧰', title:'SYSTEM TOOLS',
      items:[
        {name:'Mission Center', desc:'Task-Manager-style system monitor', cmd:'sudo pacman -S --needed --noconfirm mission-center', type:'pacman', license:'GPL-3.0-or-later'},
        {name:'btop', desc:'Terminal system monitor', cmd:'sudo pacman -S --needed --noconfirm btop', type:'pacman', license:'Apache-2.0'},
        {name:'htop', desc:'Classic terminal monitor', cmd:'sudo pacman -S --needed --noconfirm htop', type:'pacman', license:'GPL'},
        {name:'nvtop', desc:'GPU monitor', cmd:'sudo pacman -S --needed --noconfirm nvtop', type:'pacman', license:'GPL-3.0-or-later'},
        {name:'Gear Lever (AppImages)', desc:'Drag-and-drop AppImage manager', cmd:'flatpak install -y flathub it.mijorus.gearlever', type:'flatpak', help:'https://github.com/mijorus/gearlever', helpType:'site'},
      ]},
    { id:'a-upgrades', icon:'⬆️', title:'UPGRADES / SYSTEM UPDATES',
      items:[
        {name:'Full system upgrade', desc:'pacman -Syu — never partial-upgrade Arch', cmd:'sudo pacman -Syu --noconfirm', type:'manual'},
        {name:'Flatpak update all', desc:'Update every Flatpak', cmd:'flatpak update -y', type:'flatpak'},
        {name:'Claude Code upgrade', desc:'Upgrade Hermes CLI', cmd:'npm update -g @anthropic-ai/claude-code', type:'npm'},
        {name:'pipx upgrade all', desc:'Upgrade every pipx tool', cmd:'pipx upgrade-all', type:'pip'},
        {name:'Orphan cleanup', desc:'Remove unneeded dependencies', cmd:'sudo pacman -Rns $(pacman -Qtdq) 2>/dev/null || true', type:'manual'},
        {name:'Clear package cache', desc:'Keep last 3 versions only', cmd:'sudo pacman -S --needed --noconfirm pacman-contrib && sudo paccache -rk3', type:'pacman'},
      ]},
    { id:'a-crosstech', icon:'🔗', title:'CROSS-TECH EXTENSIONS',
      items:[
        {name:'tinker-verse dir structure', desc:'Create canonical project dirs', cmd:'mkdir -p ~/tinker-verse/{ai,games,luna,forge}', type:'manual'},
        {name:'OpenRouter env file', desc:'Key at the canonical path', cmd:'mkdir -p ~/.config/tinker-verse && chmod 600 ~/.config/tinker-verse/openrouter.env 2>/dev/null || true', type:'manual'},
        {name:'Tailscale mesh join', desc:'Join T1NK3R cluster mesh VPN', cmd:'sudo tailscale up', type:'manual'},
        {name:'rclone (offsite sync)', desc:'Backup layer for the float', cmd:'sudo pacman -S --needed --noconfirm rclone', type:'pacman'},
        {name:'Snapper (btrfs snapshots)', desc:'Matches the float\'s btrfs layout', cmd:'sudo pacman -S --needed --noconfirm snapper snap-pac', type:'pacman'},
      ]},
  ],

  macos: [
    { id:'m-bootstrap', icon:'🔧', title:'BOOTSTRAP (AUTO-RUNS FIRST)',
      items:[
        {name:'Xcode Command Line Tools', desc:'Homebrew will not build without it', cmd:'xcode-select --install || true', type:'manual'},
        {name:'Homebrew', desc:'Primary package manager on macOS', cmd:'/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"', type:'manual'},
        {name:'Rosetta 2 (Apple Silicon)', desc:'Runs x86_64 binaries on M-series', cmd:'softwareupdate --install-rosetta --agree-to-license', type:'manual'},
        {name:'Node.js LTS', desc:'Required for CLI AI tools', cmd:'brew install node', type:'brew'},
        {name:'rustup + cargo', desc:'Required for RTK, Yazi', cmd:'brew install rustup', type:'brew'},
        {name:'pipx', desc:'Isolated Python tool runner', cmd:'brew install pipx', type:'brew'},
        {name:'mas (Mac App Store CLI)', desc:'Install App Store apps from the terminal', cmd:'brew install mas', type:'brew'},
        {name:'coreutils + gnu-sed', desc:'GNU tools — most Linux scripts assume these', cmd:'brew install coreutils gnu-sed gawk findutils', type:'brew'},
      ]},
    { id:'m-cliai', icon:'🖥️', title:'CLI AI TOOLS',
      items:[
        {name:'Claude Code (Hermes)', desc:'Primary agentic coding CLI', cmd:'npm install -g @anthropic-ai/claude-code', type:'npm'},
        {name:'Gemini CLI', desc:'Google Gemini — codegen layer', cmd:'npm install -g @google/gemini-cli', type:'npm'},
        {name:'OpenAI Codex CLI', desc:'OpenAI Codex — OpenRouter Tier 1', cmd:'npm install -g @openai/codex', type:'npm'},
        {name:'OpenCode', desc:'Open-source multi-provider AI CLI', cmd:'npm install -g opencode-ai', type:'npm'},
        {name:'Aider', desc:'AI pair programmer — git-aware', cmd:'pipx install aider-chat', type:'pip'},
        {name:'Shell-GPT', desc:'LLM queries in terminal', cmd:'pipx install shell-gpt', type:'pip'},
        {name:'LLM (Willison)', desc:'Universal LLM CLI', cmd:'brew install llm', type:'brew'},
        {name:'RTK', desc:'Token compression for Claude Code', cmd:'cargo install rtk && rtk init -g', type:'cargo'},
        {name:'Yazi File Manager', desc:'Rust terminal file manager', cmd:'brew install yazi', type:'brew'},
      ]},
    { id:'m-sovereign', icon:'🛡️', title:'SOVEREIGN STACK',
      items:[
        {name:'Ollama 0.17.1+', desc:'Metal accelerated on Apple Silicon', cmd:'brew install --cask ollama', type:'brew'},
        {name:'Docker Desktop', desc:'Container engine', cmd:'brew install --cask docker', type:'brew'},
        {name:'OrbStack (lighter alt)', desc:'Faster Docker/Linux VM runtime for macOS', cmd:'brew install --cask orbstack', type:'brew'},
        {name:'Open WebUI', desc:'Browser UI for Ollama — port 3000', cmd:'docker run -d -p 3000:8080 --add-host=host.docker.internal:host-gateway -v open-webui:/app/backend/data --name open-webui --restart always ghcr.io/open-webui/open-webui:main', type:'manual'},
        {name:'LM Studio', desc:'GUI local model runner — MLX support', cmd:'brew install --cask lm-studio', type:'brew'},
        {name:'LocalSend', desc:'Sovereign LAN file transfer', cmd:'brew install --cask localsend', type:'brew'},
        {name:'KeePassXC', desc:'Offline password manager', cmd:'brew install --cask keepassxc', type:'brew'},
        {name:'Whisper STT', desc:'Local speech recognition', cmd:'pipx install openai-whisper', type:'pip'},
        {name:'Piper TTS', desc:'Local neural TTS', cmd:'pipx install piper-tts', type:'pip'},
      ]},
    { id:'m-companions', icon:'🤝', title:'COMPANION MODELS',
      items:[
        {name:'Alfred — qwen3:8b', desc:'Always warm', cmd:'ollama pull qwen3:8b', type:'ollama'},
        {name:'Steward — deepseek-r1:14b', desc:'Always warm', cmd:'ollama pull deepseek-r1:14b', type:'ollama'},
        {name:'Scout — llama3.2:3b', desc:'Always warm', cmd:'ollama pull llama3.2:3b', type:'ollama'},
        {name:'Daisy — gemma2:2b', desc:'Safe Space support', cmd:'ollama pull gemma2:2b', type:'ollama'},
        {name:'Coach — llama3.2:3b', desc:'Motivation', cmd:'ollama pull llama3.2:3b', type:'ollama'},
        {name:'Spark — phi3.5:latest', desc:'Inspiration engine', cmd:'ollama pull phi3.5:latest', type:'ollama'},
        {name:'Solace — llama3.2:1b', desc:'Deep creative voice', cmd:'ollama pull llama3.2:1b', type:'ollama'},
        {name:'Sage — phi4:14b', desc:'Knowledge layer', cmd:'ollama pull phi4:14b', type:'ollama'},
        {name:'Luna — gemma2:2b', desc:'P.A.W.S. / living systems', cmd:'ollama pull gemma2:2b', type:'ollama'},
        {name:'Tink — qwen2.5vl:7b', desc:'Ward — vision-capable', cmd:'ollama pull qwen2.5vl:7b', type:'ollama'},
        {name:'Wren — qwen2.5:1.5b', desc:'Ward', cmd:'ollama pull qwen2.5:1.5b', type:'ollama'},
        {name:'Qwen — qwen2.5:3b', desc:'Ward', cmd:'ollama pull qwen2.5:3b', type:'ollama'},
        {name:'Remy — smollm2:1.7b', desc:'Ward — lightweight', cmd:'ollama pull smollm2:1.7b', type:'ollama'},
        {name:'moondream', desc:'Vision / daydreaming utility model', cmd:'ollama pull moondream', type:'ollama'},
        {name:'nomic-embed-text', desc:'RAG embeddings', cmd:'ollama pull nomic-embed-text', type:'ollama'},
      ]},
    { id:'m-dev', icon:'💻', title:'DEVELOPMENT',
      items:[
        {name:'Git + GitHub CLI', desc:'Newer than Apple\'s bundled git', cmd:'brew install git gh', type:'brew'},
        {name:'VS Code', desc:'Primary editor', cmd:'brew install --cask visual-studio-code', type:'brew'},
        {name:'iTerm2', desc:'Terminal replacement', cmd:'brew install --cask iterm2', type:'brew'},
        {name:'Neovim', desc:'Hyperextensible Vim', cmd:'brew install neovim', type:'brew'},
        {name:'Python 3', desc:'Homebrew python + venv', cmd:'brew install python', type:'brew'},
        {name:'Go', desc:'Google systems language', cmd:'brew install go', type:'brew'},
        {name:'Java 21 (Temurin)', desc:'JVM runtime + compiler', cmd:'brew install --cask temurin@21', type:'brew'},
        {name:'tmux + zsh tooling', desc:'Terminal essentials', cmd:'brew install tmux starship', type:'brew'},
        {name:'bat + ripgrep + fzf + fd', desc:'Modern CLI search stack', cmd:'brew install bat ripgrep fzf fd', type:'brew'},
        {name:'Xcode (full IDE)', desc:'Needed for iOS/iPadOS builds', cmd:'mas install 497799835', type:'manual'},
      ]},
    { id:'m-gaming', icon:'🎮', title:'GAMING / EMULATION',
      items:[
        {name:'Steam', desc:'PC gaming platform', cmd:'brew install --cask steam', type:'brew'},
        {name:'Whisky', desc:'Wine/Game Porting Toolkit front-end', cmd:'brew install --cask whisky', type:'brew'},
        {name:'CrossOver', desc:'Commercial Windows compat layer', cmd:'brew install --cask crossover', type:'brew'},
        {name:'RetroArch', desc:'Multi-system emulator frontend', cmd:'brew install --cask retroarch', type:'brew'},
        {name:'Dolphin (GC/Wii)', desc:'Nintendo emulator', cmd:'brew install --cask dolphin', type:'brew'},
        {name:'PPSSPP (PSP)', desc:'PSP emulator', cmd:'brew install --cask ppsspp', type:'brew'},
        {name:'DuckStation (PS1)', desc:'PlayStation 1 emulator', cmd:'brew install --cask duckstation', type:'brew'},
        {name:'OpenEmu', desc:'macOS-native multi-system emulator', cmd:'brew install --cask openemu', type:'brew'},
        {name:'ScummVM', desc:'Classic adventure engine', cmd:'brew install --cask scummvm', type:'brew'},
      ]},
    { id:'m-engines', icon:'🕹️', title:'GAME ENGINES / 3D',
      items:[
        {name:'Godot 4', desc:'Open-source engine — T1NK3R Games', cmd:'brew install --cask godot', type:'brew'},
        {name:'Blender', desc:'3D modeling / VIGA / Modly', cmd:'brew install --cask blender', type:'brew'},
        {name:'Unity Hub', desc:'Unity engine manager', cmd:'brew install --cask unity-hub', type:'brew'},
        {name:'Unreal Engine 5', desc:'Via Epic Games Launcher', cmd:'brew install --cask epic-games', type:'brew'},
        {name:'Bevy (Rust engine)', desc:'ECS game engine — cargo template', cmd:'cargo install cargo-generate', type:'cargo'},
        {name:'LÖVE 2D', desc:'Lua game framework', cmd:'brew install --cask love', type:'brew'},
        {name:'FreeCAD', desc:'Parametric CAD', cmd:'brew install --cask freecad', type:'brew'},
        {name:'OpenSCAD', desc:'Script-driven CAD', cmd:'brew install --cask openscad', type:'brew'},
      ]},
    { id:'m-daw', icon:'🎚️', title:'DAWs / AUDIO',
      items:[
        {name:'Reaper', desc:'Lightweight pro DAW', cmd:'brew install --cask reaper', type:'brew'},
        {name:'Ardour', desc:'Full pro DAW', cmd:'brew install --cask ardour', type:'brew'},
        {name:'LMMS', desc:'FL Studio-style beat production', cmd:'brew install --cask lmms', type:'brew'},
        {name:'Audacity', desc:'Audio editor & recorder', cmd:'brew install --cask audacity', type:'brew'},
        {name:'Mixxx', desc:'DJ software — T1NK3R.FM', cmd:'brew install --cask mixxx', type:'brew'},
        {name:'Surge XT', desc:'Hybrid wavetable synth', cmd:'brew install --cask surge-xt', type:'brew'},
        {name:'BlackHole (virtual audio)', desc:'Route audio between apps — macOS ASIO equivalent', cmd:'brew install --cask blackhole-2ch', type:'brew'},
        {name:'Hydrogen Drum Machine', desc:'Drum machine / step sequencer', cmd:'brew install --cask hydrogen', type:'brew'},
        {name:'FluidSynth', desc:'General MIDI synth engine', cmd:'brew install fluidsynth', type:'brew'},
        {name:'GarageBand', desc:'Free Apple DAW — App Store', cmd:'mas install 682658836', type:'manual'},
      ]},
    { id:'m-media', icon:'📺', title:'MEDIA / T1NK3R.TV',
      items:[
        {name:'VLC', desc:'Universal media player', cmd:'brew install --cask vlc', type:'brew'},
        {name:'IINA', desc:'macOS-native mpv front-end', cmd:'brew install --cask iina', type:'brew'},
        {name:'yt-dlp', desc:'YouTube downloader', cmd:'brew install yt-dlp', type:'brew'},
        {name:'Kodi', desc:'Media center — T1NK3R.TV frontend', cmd:'brew install --cask kodi', type:'brew'},
        {name:'Jellyfin Media Player', desc:'Client for the home server', cmd:'brew install --cask jellyfin-media-player', type:'brew'},
        {name:'Calibre', desc:'E-book manager', cmd:'brew install --cask calibre', type:'brew'},
        {name:'HandBrake', desc:'Video transcoder', cmd:'brew install --cask handbrake', type:'brew'},
        {name:'FFmpeg', desc:'CLI multimedia toolkit', cmd:'brew install ffmpeg', type:'brew'},
      ]},
    { id:'m-art', icon:'🎨', title:'ART / VIDEO',
      items:[
        {name:'GIMP', desc:'GNU image manipulation', cmd:'brew install --cask gimp', type:'brew'},
        {name:'Krita', desc:'Professional digital painting', cmd:'brew install --cask krita', type:'brew'},
        {name:'Inkscape', desc:'Vector graphics (SVG)', cmd:'brew install --cask inkscape', type:'brew'},
        {name:'Darktable', desc:'RAW photo workflow', cmd:'brew install --cask darktable', type:'brew'},
        {name:'OBS Studio', desc:'Streaming & screen recording', cmd:'brew install --cask obs', type:'brew'},
        {name:'DaVinci Resolve', desc:'Pro video editor — Metal accelerated', cmd:'brew install --cask davinci-resolve', type:'brew'},
        {name:'Kdenlive', desc:'Open-source video editor', cmd:'brew install --cask kdenlive', type:'brew'},
        {name:'Upscayl', desc:'AI image upscaler', cmd:'brew install --cask upscayl', type:'brew'},
      ]},
    { id:'m-creai', icon:'🤖', title:'CREATIVE AI / ACE STACK',
      items:[
        {name:'ComfyUI (MPS)', desc:'Node-based Stable Diffusion — Metal backend', cmd:'git clone https://github.com/comfyanonymous/ComfyUI.git ~/tinker-verse/comfyui && cd ~/tinker-verse/comfyui && python3 -m venv venv && source venv/bin/activate && pip install torch torchvision torchaudio && pip install -r requirements.txt', type:'manual'},
        {name:'Draw Things', desc:'Native macOS/iOS Stable Diffusion app', cmd:'mas install 6444050820', type:'manual'},
        {name:'MLX (Apple Silicon ML)', desc:'Apple\'s native array framework — fastest local inference', cmd:'pipx install mlx-lm', type:'pip'},
        {name:'InvokeAI', desc:'Clean professional SD interface', cmd:'pipx install InvokeAI', type:'pip'},
        {name:'text-generation-webui', desc:'Oobabooga — local model chat UI', cmd:'git clone https://github.com/oobabooga/text-generation-webui.git ~/tinker-verse/text-gen-webui', type:'manual'},
        {name:'Diffusers (HuggingFace)', desc:'Core AI image library', cmd:'pipx install diffusers', type:'pip'},
        {name:'FreeMoCap', desc:'Markerless motion capture — ACE Visual', cmd:'pipx install freemocap', type:'pip'},
      ]},
    { id:'m-network', icon:'🌐', title:'NETWORKING / SECURITY',
      items:[
        {name:'Tailscale', desc:'Mesh VPN — cluster access', cmd:'brew install --cask tailscale', type:'brew'},
        {name:'WireGuard', desc:'Modern VPN', cmd:'brew install wireguard-tools', type:'brew'},
        {name:'Wireshark', desc:'Network protocol analyzer', cmd:'brew install --cask wireshark', type:'brew'},
        {name:'Nmap', desc:'Network scanner', cmd:'brew install nmap', type:'brew'},
        {name:'Syncthing', desc:'Peer-to-peer file sync', cmd:'brew install syncthing', type:'brew'},
        {name:'croc + magic-wormhole', desc:'One-shot encrypted file transfer', cmd:'brew install croc magic-wormhole', type:'brew'},
      ]},
    { id:'m-writing', icon:'✍️', title:'WRITING / KNOWLEDGE',
      items:[
        {name:'LibreOffice', desc:'Full office suite', cmd:'brew install --cask libreoffice', type:'brew'},
        {name:'Obsidian', desc:'Markdown PKM — Tinker-Verse vault', cmd:'brew install --cask obsidian', type:'brew'},
        {name:'Logseq', desc:'Outliner PKM alternative', cmd:'brew install --cask logseq', type:'brew'},
        {name:'Zotero', desc:'Reference manager', cmd:'brew install --cask zotero', type:'brew'},
        {name:'Pandoc', desc:'Universal document converter', cmd:'brew install pandoc', type:'brew'},
        {name:'MacTeX (LaTeX)', desc:'Full LaTeX distribution', cmd:'brew install --cask mactex-no-gui', type:'brew'},
      ]},
    { id:'m-print3d', icon:'🖨️', title:'3D PRINTING (BAMBU P1S)',
      items:[
        {name:'Bambu Studio', desc:'Official P1S slicer', cmd:'brew install --cask bambu-studio', type:'brew'},
        {name:'OrcaSlicer', desc:'Community fork — better P1S profiles', cmd:'brew install --cask orcaslicer', type:'brew'},
        {name:'PrusaSlicer', desc:'Alternative slicer', cmd:'brew install --cask prusaslicer', type:'brew'},
        {name:'Cura', desc:'Ultimaker slicer', cmd:'brew install --cask ultimaker-cura', type:'brew'},
        {name:'MeshLab', desc:'Mesh cleanup and repair', cmd:'brew install --cask meshlab', type:'brew'},
      ]},
    { id:'m-upgrades', icon:'⬆️', title:'UPGRADES / SYSTEM UPDATES',
      items:[
        {name:'brew update + upgrade', desc:'Update every formula and cask', cmd:'brew update && brew upgrade && brew upgrade --cask', type:'manual'},
        {name:'macOS software update', desc:'System + security updates', cmd:'softwareupdate -ia', type:'manual'},
        {name:'Claude Code upgrade', desc:'Upgrade Hermes CLI', cmd:'npm update -g @anthropic-ai/claude-code', type:'npm'},
        {name:'Gemini CLI upgrade', desc:'Upgrade Gemini CLI', cmd:'npm update -g @google/gemini-cli', type:'npm'},
        {name:'pipx upgrade all', desc:'Upgrade every pipx tool', cmd:'pipx upgrade-all', type:'pip'},
        {name:'brew cleanup', desc:'Reclaim disk from old versions', cmd:'brew cleanup --prune=all', type:'manual'},
      ]},
    { id:'m-crosstech', icon:'🔗', title:'CROSS-TECH EXTENSIONS',
      items:[
        {name:'tinker-verse dir structure', desc:'Create canonical project dirs', cmd:'mkdir -p ~/tinker-verse/{ai,games,luna,forge}', type:'manual'},
        {name:'OpenRouter env file', desc:'Key at the canonical path', cmd:'mkdir -p ~/.config/tinker-verse && chmod 600 ~/.config/tinker-verse/openrouter.env 2>/dev/null || true', type:'manual'},
        {name:'Tailscale mesh join', desc:'Join T1NK3R cluster mesh VPN', cmd:'tailscale up', type:'manual'},
        {name:'rclone (offsite sync)', desc:'Backup layer for the float', cmd:'brew install rclone', type:'brew'},
        {name:'SSH alias to the Linux box', desc:'Quick jump into CachyOS/Fedora', cmd:'# Add to ~/.ssh/config: Host cachy\\n  HostName 192.168.1.138\\n  User tinkerv', type:'manual'},
      ]},
  ],

  ipados: [
    { id:'i-shells', icon:'🔧', title:'SHELLS & TERMINALS (START HERE)',
      items:[
        {name:'a-Shell', desc:'Sandboxed local shell — python3, pip, lua, ffmpeg built in', cmd:'# App Store: a-Shell', type:'manual'},
        {name:'iSH Shell', desc:'Alpine Linux in x86 emulation — apk packages', cmd:'# App Store: iSH — then: apk update && apk add git python3', type:'manual'},
        {name:'Blink Shell', desc:'Best SSH/mosh client — reaches the sovereign box', cmd:'# App Store: Blink Shell', type:'manual'},
        {name:'Termius', desc:'Free-tier SSH client with synced hosts', cmd:'# App Store: Termius', type:'manual'},
        {name:'Secure ShellFish', desc:'SSH + Files.app integration for remote mounts', cmd:'# App Store: Secure ShellFish', type:'manual'},
      ]},
    { id:'i-remote', icon:'🛡️', title:'SOVEREIGN STACK (REMOTE)',
      items:[
        {name:'Tailscale', desc:'Mesh VPN — reach home Ollama from anywhere', cmd:'# App Store: Tailscale', type:'manual'},
        {name:'OLLAMA_HOST endpoint', desc:'iPadOS cannot run Ollama — point at the LAN box', cmd:'export OLLAMA_HOST=http://<lan-ip>:11434', type:'manual'},
        {name:'Open WebUI (as web app)', desc:'Add the server\'s WebUI to the Home Screen', cmd:'# Safari → http://<lan-ip>:3000 → Share → Add to Home Screen', type:'manual'},
        {name:'LocalSend', desc:'Sovereign LAN file transfer', cmd:'# App Store: LocalSend', type:'manual'},
        {name:'KeePassium', desc:'KeePassXC-compatible vault reader', cmd:'# App Store: KeePassium', type:'manual'},
        {name:'No local LLM runtime', desc:'App Store sandbox blocks local model servers', cmd:'# Honest limit — inference happens on the LAN box, not here.', type:'na'},
      ]},
    { id:'i-dev', icon:'💻', title:'DEVELOPMENT',
      items:[
        {name:'Working Copy', desc:'Full git client — clones the tinker-verse repos', cmd:'# App Store: Working Copy', type:'manual'},
        {name:'Textastic', desc:'Code editor with SSH/SFTP + Working Copy integration', cmd:'# App Store: Textastic Code Editor', type:'manual'},
        {name:'Runestone', desc:'Free open-source code editor', cmd:'# App Store: Runestone', type:'manual'},
        {name:'Swift Playgrounds', desc:'Build real iPad/Mac apps on-device', cmd:'# App Store: Swift Playgrounds', type:'manual'},
        {name:'Pythonista 3', desc:'Full offline Python IDE with iOS APIs', cmd:'# App Store: Pythonista 3 (paid)', type:'manual'},
        {name:'pip in a-Shell', desc:'Python package installs inside a-Shell', cmd:'pip install --upgrade pip', type:'pip'},
        {name:'requests + httpx', desc:'Talk to remote Ollama / OpenRouter', cmd:'pip install requests httpx', type:'pip'},
        {name:'Jupyter (remote kernel)', desc:'Notebook UI against the LAN box\'s kernel', cmd:'# Carnets app, or Safari → http://<lan-ip>:8888', type:'manual'},
      ]},
    { id:'i-ai', icon:'🤖', title:'AI CLIENTS',
      items:[
        {name:'Claude', desc:'Official Anthropic client', cmd:'# App Store: Claude', type:'manual'},
        {name:'ChatGPT', desc:'Official OpenAI client', cmd:'# App Store: ChatGPT', type:'manual'},
        {name:'Enchanted', desc:'Native Ollama client — points at your LAN server', cmd:'# App Store: Enchanted (Ollama client)', type:'manual'},
        {name:'Draw Things', desc:'On-device Stable Diffusion — actually runs locally', cmd:'# App Store: Draw Things', type:'manual'},
        {name:'Siri Shortcut → Alfred', desc:'Voice trigger POSTing to the companion API', cmd:'# Shortcuts → Get Contents of URL → POST http://<lan-ip>:11434/api/generate', type:'manual'},
        {name:'OpenRouter via Shortcuts', desc:'Key stored in a Shortcut, not in a third-party app', cmd:'# Shortcuts → Text (key) → Get Contents of URL → openrouter.ai/api/v1/chat/completions', type:'manual'},
      ]},
    { id:'i-create', icon:'🎨', title:'ART / MUSIC / VIDEO',
      items:[
        {name:'Procreate', desc:'The reason to own an iPad — raster painting', cmd:'# App Store: Procreate (paid)', type:'manual'},
        {name:'Affinity Designer 2', desc:'Vector design — Inkscape equivalent', cmd:'# App Store: Affinity Designer 2 (paid)', type:'manual'},
        {name:'Affinity Photo 2', desc:'Raster editing — Photoshop equivalent', cmd:'# App Store: Affinity Photo 2 (paid)', type:'manual'},
        {name:'GarageBand', desc:'Free Apple DAW', cmd:'# App Store: GarageBand', type:'manual'},
        {name:'Cubasis 3', desc:'Full mobile DAW', cmd:'# App Store: Cubasis 3 (paid)', type:'manual'},
        {name:'AUM — Audio Mixer', desc:'AUv3 host/router — Carla equivalent', cmd:'# App Store: AUM (paid)', type:'manual'},
        {name:'LumaFusion', desc:'Pro multitrack video editing', cmd:'# App Store: LumaFusion (paid)', type:'manual'},
        {name:'Nomad Sculpt', desc:'3D sculpting — Blender-adjacent on iPad', cmd:'# App Store: Nomad Sculpt (paid)', type:'manual'},
        {name:'Shapr3D', desc:'Parametric CAD for 3D printing', cmd:'# App Store: Shapr3D', type:'manual'},
      ]},
    { id:'i-media', icon:'📺', title:'MEDIA / T1NK3R.TV',
      items:[
        {name:'VLC for Mobile', desc:'Plays anything', cmd:'# App Store: VLC for Mobile', type:'manual'},
        {name:'Infuse', desc:'Best Jellyfin/Plex front-end on iPadOS', cmd:'# App Store: Infuse', type:'manual'},
        {name:'Jellyfin Mobile', desc:'Official client for the home server', cmd:'# App Store: Jellyfin Mobile', type:'manual'},
        {name:'Kodi', desc:'Requires sideload — not on the App Store', cmd:'# Sideload via AltStore/TrollStore — not App Store distributed', type:'na'},
        {name:'Prologue / Doppler', desc:'Local music library players', cmd:'# App Store: Doppler', type:'manual'},
        {name:'Documents by Readdle', desc:'File manager + downloader + SMB client', cmd:'# App Store: Documents', type:'manual'},
      ]},
    { id:'i-writing', icon:'✍️', title:'WRITING / KNOWLEDGE',
      items:[
        {name:'Obsidian', desc:'Markdown PKM — same vault as desktop via sync', cmd:'# App Store: Obsidian', type:'manual'},
        {name:'iA Writer', desc:'Focused markdown writing', cmd:'# App Store: iA Writer (paid)', type:'manual'},
        {name:'LibreOffice? No', desc:'Use Apple Pages/Numbers or Google Docs instead', cmd:'# No LibreOffice build for iPadOS', type:'na'},
        {name:'Apple Pages / Numbers / Keynote', desc:'Free Apple office suite', cmd:'# App Store: Pages, Numbers, Keynote (free)', type:'manual'},
        {name:'GoodNotes 6', desc:'Handwriting + PDF annotation', cmd:'# App Store: GoodNotes 6', type:'manual'},
        {name:'Zotero (via web)', desc:'Reference manager — browser access only', cmd:'# Safari → zotero.org — no native iPadOS client', type:'na'},
      ]},
    { id:'i-sys', icon:'🛠️', title:'SYSTEM / UTILITIES',
      items:[
        {name:'Shortcuts', desc:'Built in — the automation layer for everything above', cmd:'# Pre-installed on iPadOS', type:'manual'},
        {name:'Screens 5', desc:'VNC into the desktop machines', cmd:'# App Store: Screens 5 (paid)', type:'manual'},
        {name:'Jump Desktop', desc:'RDP/VNC alternative', cmd:'# App Store: Jump Desktop (paid)', type:'manual'},
        {name:'iSH apk essentials', desc:'Base CLI toolchain inside iSH', cmd:'apk add git python3 py3-pip curl nano', type:'manual'},
        {name:'a-Shell ffmpeg', desc:'Built-in — no install needed', cmd:'ffmpeg -i in.mov -c:v h264 out.mp4', type:'manual'},
        {name:'Files.app + SMB mount', desc:'Mount the LAN box\'s shares natively', cmd:'# Files → ⋯ → Connect to Server → smb://<lan-ip>', type:'manual'},
      ]},
  ],

  android: [
    { id:'n-bootstrap', icon:'🔧', title:'TERMUX BOOTSTRAP (AUTO-RUNS FIRST)',
      items:[
        {name:'Termux (F-Droid build)', desc:'The Play Store build is abandoned — use F-Droid', cmd:'# https://f-droid.org/packages/com.termux/', type:'manual'},
        {name:'pkg update + upgrade', desc:'First command in a fresh Termux', cmd:'pkg update -y && pkg upgrade -y', type:'termux'},
        {name:'termux-setup-storage', desc:'Grants access to shared device storage', cmd:'termux-setup-storage', type:'manual'},
        {name:'git + curl + wget', desc:'Core CLI toolchain', cmd:'pkg install -y git curl wget', type:'termux'},
        {name:'Python 3 + pip', desc:'Termux python toolchain', cmd:'pkg install -y python', type:'termux'},
        {name:'Node.js LTS', desc:'Required for CLI AI tools', cmd:'pkg install -y nodejs-lts', type:'termux'},
        {name:'Rust + Cargo', desc:'Native Termux Rust toolchain', cmd:'pkg install -y rust', type:'termux'},
        {name:'tur-repo', desc:'Termux User Repository — where ollama lives', cmd:'pkg install -y tur-repo', type:'termux'},
        {name:'termux-api', desc:'Battery, clipboard, TTS, sensors from the shell', cmd:'pkg install -y termux-api', type:'termux'},
      ]},
    { id:'n-cliai', icon:'🖥️', title:'CLI AI TOOLS',
      items:[
        {name:'Claude Code (Hermes)', desc:'Runs in Termux on aarch64', cmd:'npm install -g @anthropic-ai/claude-code', type:'npm'},
        {name:'Gemini CLI', desc:'Google Gemini — codegen layer', cmd:'npm install -g @google/gemini-cli', type:'npm'},
        {name:'OpenCode', desc:'Open-source multi-provider AI CLI', cmd:'npm install -g opencode-ai', type:'npm'},
        {name:'Aider', desc:'AI pair programmer — git-aware', cmd:'pip install aider-chat', type:'pip'},
        {name:'Shell-GPT', desc:'LLM queries in terminal', cmd:'pip install shell-gpt', type:'pip'},
        {name:'LLM (Willison)', desc:'Universal LLM CLI', cmd:'pip install llm', type:'pip'},
        {name:'RTK', desc:'Token compression — builds from cargo', cmd:'cargo install rtk && rtk init -g', type:'cargo'},
        {name:'Yazi File Manager', desc:'Rust terminal file manager', cmd:'pkg install -y yazi', type:'termux'},
      ]},
    { id:'n-sovereign', icon:'🛡️', title:'SOVEREIGN STACK',
      items:[
        {name:'Ollama (tur-repo)', desc:'CPU-only on Android — small models only', cmd:'pkg install -y ollama', type:'termux'},
        {name:'Remote Ollama fallback', desc:'Anything above 3B belongs on the LAN box', cmd:'echo "export OLLAMA_HOST=http://<lan-ip>:11434" >> ~/.bashrc', type:'manual'},
        {name:'Tailscale (Play Store)', desc:'Mesh VPN — joins the phone to the cluster', cmd:'# Play Store: Tailscale', type:'manual'},
        {name:'OpenSSH server', desc:'SSH into the phone on port 8022', cmd:'pkg install -y openssh', type:'termux'},
        {name:'LocalSend', desc:'Sovereign LAN file transfer', cmd:'# F-Droid / Play Store: LocalSend', type:'manual'},
        {name:'KeePassDX', desc:'Offline password manager — KeePassXC compatible', cmd:'# F-Droid: KeePassDX', type:'manual'},
        {name:'Termux:Boot', desc:'Run sshd/ollama at device boot', cmd:'# F-Droid: Termux:Boot — scripts go in ~/.termux/boot/', type:'manual'},
        {name:'proot-distro (full Linux)', desc:'Real Debian/Ubuntu rootfs inside Termux', cmd:'pkg install -y proot-distro && proot-distro install debian', type:'termux'},
      ]},
    { id:'n-companions', icon:'🤝', title:'COMPANION MODELS (SMALL ONLY)',
      items:[
        {name:'Scout — llama3.2:3b', desc:'The realistic always-warm companion on-device', cmd:'ollama pull llama3.2:3b', type:'ollama'},
        {name:'Daisy — gemma2:2b', desc:'2B — fits comfortably in phone RAM', cmd:'ollama pull gemma2:2b', type:'ollama'},
        {name:'Spark — phi3.5:latest', desc:'Compact — fastest option on low-RAM devices', cmd:'ollama pull phi3.5:latest', type:'ollama'},
        {name:'Coach — llama3.2:3b', desc:'3B — needs 8GB+ RAM, expect slow tokens', cmd:'ollama pull llama3.2:3b', type:'ollama'},
        {name:'nomic-embed-text', desc:'RAG embeddings — small enough to run local', cmd:'ollama pull nomic-embed-text', type:'ollama'},
        {name:'Alfred (remote only)', desc:'qwen3:8b is too heavy for a phone', cmd:'# Route Alfred to the LAN box via OLLAMA_HOST', type:'na'},
      ]},
    { id:'n-dev', icon:'💻', title:'DEVELOPMENT',
      items:[
        {name:'GitHub CLI', desc:'GitHub from the phone terminal', cmd:'pkg install -y gh', type:'termux'},
        {name:'Neovim', desc:'Hyperextensible Vim', cmd:'pkg install -y neovim', type:'termux'},
        {name:'tmux + zsh + htop', desc:'Terminal essentials', cmd:'pkg install -y tmux zsh htop', type:'termux'},
        {name:'bat + ripgrep + fzf + fd', desc:'Modern CLI search stack', cmd:'pkg install -y bat ripgrep fzf fd', type:'termux'},
        {name:'clang + make', desc:'C/C++ toolchain', cmd:'pkg install -y clang make', type:'termux'},
        {name:'SQLite', desc:'Local database work', cmd:'pkg install -y sqlite', type:'termux'},
        {name:'Acode editor', desc:'GUI code editor that reads Termux storage', cmd:'# F-Droid / Play Store: Acode', type:'manual'},
        {name:'Termux:Styling', desc:'Fonts + color schemes for the terminal', cmd:'# F-Droid: Termux:Styling', type:'manual'},
      ]},
    { id:'n-media', icon:'📺', title:'MEDIA / T1NK3R.TV',
      items:[
        {name:'VLC for Android', desc:'Plays anything', cmd:'# F-Droid / Play Store: VLC', type:'manual'},
        {name:'mpv-android', desc:'GPU media player', cmd:'# F-Droid: mpv-android', type:'manual'},
        {name:'Jellyfin for Android', desc:'Client for the home server', cmd:'# F-Droid / Play Store: Jellyfin', type:'manual'},
        {name:'Kodi', desc:'Media center — T1NK3R.TV frontend', cmd:'# F-Droid / Play Store: Kodi', type:'manual'},
        {name:'yt-dlp (Termux)', desc:'Downloader — pairs with termux-setup-storage', cmd:'pip install yt-dlp', type:'pip'},
        {name:'NewPipe', desc:'Privacy-respecting YouTube front-end', cmd:'# F-Droid: NewPipe', type:'manual'},
        {name:'AntennaPod', desc:'Open-source podcast client', cmd:'# F-Droid: AntennaPod', type:'manual'},
        {name:'ffmpeg (Termux)', desc:'CLI multimedia toolkit', cmd:'pkg install -y ffmpeg', type:'termux'},
      ]},
    { id:'n-create', icon:'🎨', title:'ART / AUDIO / CREATION',
      items:[
        {name:'Krita? No', desc:'No Android build — use Infinite Painter / Ibis Paint', cmd:'# No official Krita Android release', type:'na'},
        {name:'Infinite Painter', desc:'Full-featured raster painting', cmd:'# Play Store: Infinite Painter', type:'manual'},
        {name:'Ibis Paint X', desc:'Free painting app with brush engine', cmd:'# Play Store: ibis Paint X', type:'manual'},
        {name:'FL Studio Mobile', desc:'Beat production on the phone', cmd:'# Play Store: FL Studio Mobile (paid)', type:'manual'},
        {name:'Audio Evolution Mobile', desc:'Multitrack DAW with USB audio support', cmd:'# Play Store: Audio Evolution Mobile Studio', type:'manual'},
        {name:'n-Track Studio', desc:'Alternative mobile DAW', cmd:'# Play Store: n-Track Studio', type:'manual'},
        {name:'Sox + ffmpeg (CLI audio)', desc:'Scriptable audio processing in Termux', cmd:'pkg install -y sox ffmpeg', type:'termux'},
        {name:'OpenCamera', desc:'Manual-control camera — raw capture', cmd:'# F-Droid: Open Camera', type:'manual'},
      ]},
    { id:'n-sdr', icon:'📡', title:'SDR / RF / T1NK3R.FM',
      items:[
        {name:'SDR Touch', desc:'RTL-SDR receiver over USB OTG', cmd:'# Play Store: SDR Touch', type:'manual'},
        {name:'RF Analyzer', desc:'Open-source SDR waterfall', cmd:'# F-Droid: RF Analyzer', type:'manual'},
        {name:'rtl_433 (Termux)', desc:'Decode 433MHz sensor traffic', cmd:'pkg install -y rtl-433', type:'termux'},
        {name:'RadioDroid', desc:'Internet radio client — T1NK3R.FM stream', cmd:'# F-Droid: RadioDroid', type:'manual'},
        {name:'APRSdroid', desc:'Ham radio APRS client', cmd:'# F-Droid: APRSdroid', type:'manual'},
      ]},
    { id:'n-sys', icon:'🛠️', title:'SYSTEM / UTILITIES',
      items:[
        {name:'F-Droid', desc:'The open-source app store — install this first', cmd:'# https://f-droid.org', type:'manual'},
        {name:'Obtainium', desc:'Installs apps straight from GitHub releases', cmd:'# F-Droid: Obtainium', type:'manual'},
        {name:'Syncthing-Fork', desc:'Peer-to-peer file sync with the float', cmd:'# F-Droid: Syncthing-Fork', type:'manual'},
        {name:'Material Files', desc:'Open-source file manager with root/SMB', cmd:'# F-Droid: Material Files', type:'manual'},
        {name:'Obsidian for Android', desc:'Markdown PKM — same vault via Syncthing', cmd:'# Play Store: Obsidian', type:'manual'},
        {name:'rclone (Termux)', desc:'Backup layer for the float', cmd:'pkg install -y rclone', type:'termux'},
        {name:'nmap (Termux)', desc:'Network scanner from the phone', cmd:'pkg install -y nmap', type:'termux'},
        {name:'Termux:Widget', desc:'Home-screen buttons for shell scripts', cmd:'# F-Droid: Termux:Widget', type:'manual'},
      ]},
    { id:'n-upgrades', icon:'⬆️', title:'UPGRADES / SYSTEM UPDATES',
      items:[
        {name:'pkg upgrade all', desc:'Update every Termux package', cmd:'pkg update -y && pkg upgrade -y', type:'termux'},
        {name:'Claude Code upgrade', desc:'Upgrade Hermes CLI', cmd:'npm update -g @anthropic-ai/claude-code', type:'npm'},
        {name:'pip upgrade tools', desc:'Upgrade the Python CLI tools', cmd:'pip install --upgrade aider-chat shell-gpt llm', type:'pip'},
        {name:'Ollama model refresh', desc:'Re-pull the on-device companions', cmd:'ollama pull phi3:mini', type:'ollama'},
        {name:'apt autoclean', desc:'Reclaim Termux package cache', cmd:'apt autoclean', type:'manual'},
      ]},
  ],
};

// ═══════════════════════════════════════════════════════════════
// STATE — every tab in allTabs gets a slot so nothing crashes;
// only win/cachy/bazzite actually have JUMPSTART/CATS content.
// ═══════════════════════════════════════════════════════════════
const jsState = {}, catState = {}, catFilter = {}, catSearch = {};
let activeTab = 'win';

(typeof allTabs !== 'undefined' ? allTabs : ['win','cachy','bazzite']).forEach(os => {
  jsState[os] = {}; catState[os] = {}; catFilter[os] = 'all'; catSearch[os] = '';
});
Object.keys(JUMPSTART).forEach(os => { JUMPSTART[os].forEach(it => { jsState[os][it.id] = false; }); });
Object.keys(CATS).forEach(os => { CATS[os].forEach(cat => { cat.items.forEach((_,i) => { catState[os][`${cat.id}_${i}`] = false; }); }); });

// Commands legitimately contain angle brackets (http://<lan-ip>:11434).
// Without escaping, the browser parses those as tags and swallows every
// item that follows into a phantom element.
function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
                  .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ═══════════════════════════════════════════════════════════════
// JUMPSTART RENDERING
// ═══════════════════════════════════════════════════════════════
function renderJS(os) {
  const el = document.getElementById(`js-items-${os}`);
  if (!el) return;
  if (!JUMPSTART[os]) {
    el.innerHTML = `<div style="padding:14px 4px;color:var(--dim);font-size:11px;line-height:1.6;">
      JUMPSTART data for this OS hasn't been built yet. Check the Gap-Fill Companion
      panel below (if available for this OS) for general desktop apps you can install today.
    </div>`;
    return;
  }
  el.innerHTML = JUMPSTART[os].map(it => `
    <div class="js-item ${jsState[os][it.id]?'checked':''}" onclick="toggleJS('${os}','${it.id}')">
      <div class="js-check">${jsState[os][it.id]?'✓':''}</div>
      <div class="js-info">
        <div class="js-name">${esc(it.name)}<span class="js-tier js-tier-${it.tier}">${it.tier}</span></div>
        <div class="js-desc">${esc(it.desc)}</div>
        <div class="js-cmd-preview">${esc(it.cmd.substring(0,80))}${it.cmd.length>80?'...':''}</div>
      </div>
    </div>`).join('');
}
function toggleJS(os,id){ if(!JUMPSTART[os]) return; jsState[os][id]=!jsState[os][id]; renderJS(os); updateCount(); }
function armJS(os){ if(!JUMPSTART[os]){ alert('JUMPSTART data for this OS hasn\'t been built yet.'); return; } JUMPSTART[os].forEach(it=>{ jsState[os][it.id]=true; }); renderJS(os); updateCount(); }
function disarmJS(os){ if(!JUMPSTART[os]) return; JUMPSTART[os].forEach(it=>{ jsState[os][it.id]=false; }); renderJS(os); updateCount(); }

// ═══════════════════════════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════════════════════════
// Optional quiet link on an item: helpType 'help' -> "Help improve",
// 'site' -> "Project page". Nothing when help/helpType is blank or the URL
// is not http(s). The click must not toggle the item's checkbox.
function helpLink(it) {
  if (!it.help || !/^https?:\/\//i.test(it.help)) return '';
  const label = it.helpType === 'help' ? 'Help improve' : it.helpType === 'site' ? 'Project page' : '';
  if (!label) return '';
  return `<a class="item-help" href="${esc(it.help)}" onclick="event.preventDefault();event.stopPropagation();openExternal(this.getAttribute('href'));">${label}</a>`;
}

function buildGrid(os) {
  const grid = document.getElementById(`grid-${os}`);
  if (!grid) return;
  grid.innerHTML = '';
  if (!CATS[os]) {
    grid.innerHTML = `<div class="category" style="padding:14px;color:var(--dim);font-size:11px;line-height:1.6;">
      Category data for this OS hasn't been built yet. Check the Gap-Fill Companion
      panel below (if available for this OS) for general desktop apps you can install today.
    </div>`;
    return;
  }
  CATS[os].forEach(cat => {
    const el = document.createElement('div');
    el.className = 'category'; el.id = `cat-${os}-${cat.id}`;
    const total = cat.items.length;
    const done = cat.items.filter((_,i) => catState[os][`${cat.id}_${i}`]).length;
    const pct = total ? (done/total*100) : 0;
    el.innerHTML = `
      <div class="cat-header" onclick="toggleCat('${os}','${cat.id}')">
        <span class="cat-icon">${cat.icon}</span>
        <span class="cat-title">${cat.title}</span>
        <span class="cat-badge ${done===total?'done':''}" id="badge-${os}-${cat.id}">${done}/${total}</span>
        <span class="cat-toggle">▼</span>
      </div>
      <div class="progress-bar"><div class="progress-fill" id="prog-${os}-${cat.id}" style="width:${pct}%"></div></div>
      <div class="items" id="items-${os}-${cat.id}">
        ${cat.items.map((it,i) => {
          const key=`${cat.id}_${i}`, checked=catState[os][key];
          return `<label class="item ${checked?'checked':''}" id="item-${os}-${key}" onclick="toggleCat_item('${os}','${key}','${cat.id}')">
            <div class="check-box">${checked?'✓':''}</div>
            <div class="item-info">
              <div class="item-name">${esc(it.name)}<span class="tag tag-${it.type}">${it.type}</span></div>
              <div class="item-desc">${esc(it.desc)}</div>
              ${helpLink(it)}
              <div class="item-cmd">${esc(it.cmd)}</div>
            </div>
          </label>`;
        }).join('')}
      </div>`;
    grid.appendChild(el);
  });
}

function toggleCat(os, catId) { const el = document.getElementById(`cat-${os}-${catId}`); if (el) el.classList.toggle('collapsed'); }

function toggleCat_item(os, key, catId) {
  if (!catState[os] || !(key in catState[os])) return;
  catState[os][key] = !catState[os][key];
  const el = document.getElementById(`item-${os}-${key}`);
  if (el) {
    el.classList.toggle('checked', catState[os][key]);
    const cb = el.querySelector('.check-box');
    if (cb) cb.textContent = catState[os][key] ? '✓' : '';
  }
  updateBadge(os, catId);
  updateCount();
}

function updateBadge(os, catId) {
  if (!CATS[os]) return;
  const cat = CATS[os].find(c=>c.id===catId);
  if (!cat) return;
  const total=cat.items.length, done=cat.items.filter((_,i)=>catState[os][`${catId}_${i}`]).length;
  const pct=total?(done/total*100):0;
  const badge = document.getElementById(`badge-${os}-${catId}`);
  const prog = document.getElementById(`prog-${os}-${catId}`);
  if (badge) { badge.textContent=`${done}/${total}`; badge.className=`cat-badge ${done===total?'done':''}`; }
  if (prog) prog.style.width=pct+'%';
}

function filterCat(os, mode) {
  catFilter[os] = mode;
  const btns = document.querySelectorAll(`#content-${os} .controls .btn`);
  const order = ['all','pending','done'];
  btns.forEach((b,i) => b.classList.toggle('active', order[i] === mode));
  applyFilter(os);
}
function searchCat(os, val) { catSearch[os]=val; applyFilter(os); }

function applyFilter(os) {
  if (!CATS[os]) return;
  const q=(catSearch[os]||'').toLowerCase(), mode=catFilter[os]||'all';
  CATS[os].forEach(cat => {
    let vis=false;
    cat.items.forEach((it,i) => {
      const key=`${cat.id}_${i}`, el=document.getElementById(`item-${os}-${key}`);
      if(!el) return;
      const mSearch=!q||it.name.toLowerCase().includes(q)||it.desc.toLowerCase().includes(q);
      const mMode=mode==='all'?true:mode==='pending'?!catState[os][key]:catState[os][key];
      const show=mSearch&&mMode;
      el.classList.toggle('hidden',!show);
      if(show) vis=true;
    });
    const cel=document.getElementById(`cat-${os}-${cat.id}`);
    if(cel) cel.style.display=vis?'':'none';
  });
}

// Ticks every JUMPSTART item and every category item on every tab —
// the "ADD ALL" button in index.html.
function addAll() {
  const tabs = (typeof allTabs !== 'undefined') ? allTabs : Object.keys(CATS);
  tabs.forEach(os => {
    (JUMPSTART[os] || []).forEach(it => { jsState[os][it.id] = true; });
    (CATS[os] || []).forEach(cat => cat.items.forEach((_, i) => { catState[os][`${cat.id}_${i}`] = true; }));
    renderJS(os);
    buildGrid(os);
  });
  updateCount();
}

function clearOS(os) {
  if (catState[os]) Object.keys(catState[os]).forEach(k=>catState[os][k]=false);
  disarmJS(os);
  buildGrid(os);
  updateCount();
}

function updateCount() {
  const os = (typeof activeTab !== 'undefined' && activeTab) ? activeTab : 'win';
  const jsC = jsState[os] ? Object.values(jsState[os]).filter(Boolean).length : 0;
  const catC = catState[os] ? Object.values(catState[os]).filter(Boolean).length : 0;
  const el = document.getElementById('totalCount');
  if (el) el.textContent = jsC + catC;
}

// ═══════════════════════════════════════════════════════════════
// SCRIPT GENERATORS — real, working for win/cachy/bazzite.
// Other OSes get an honest placeholder instead of a fabricated script.
// ═══════════════════════════════════════════════════════════════
function collectJSItems(os) { return (JUMPSTART[os]||[]).filter(it=>jsState[os] && jsState[os][it.id]); }
function collectCatItems(os) {
  const items=[];
  (CATS[os]||[]).forEach(cat=>cat.items.forEach((it,i)=>{ if(catState[os] && catState[os][`${cat.id}_${i}`]) items.push(it); }));
  return items;
}

function generateScript(os) {
  let script='';
  if (os==='win') script=genWin();
  else if (os==='cachy') script=genCachy();
  else if (os==='bazzite') script=genBazzite();
  else if (os==='fedora') script=genFedora();
  else if (os==='ubuntu') script=genUbuntu();
  else if (os==='arch') script=genArch();
  else if (os==='macos') script=genMacos();
  else if (os==='android') script=genAndroid();
  else if (os==='ipados') script=genIpados();
  else script = `# Unknown OS tab: ${os}`;
  const codeEl = document.getElementById(`code-${os}`);
  if (codeEl) codeEl.textContent = script;
  const p = document.getElementById(`out-${os}`);
  if (p) { p.classList.add('visible'); if (typeof p.scrollIntoView === 'function') p.scrollIntoView({behavior:'smooth'}); }
}

function genWin() {
  const js=collectJSItems('win'), cat=collectCatItems('win');
  const all=[...js,...cat];
  const winget=all.filter(i=>i.type==='winget').map(i=>i.cmd);
  const npm=all.filter(i=>i.type==='npm').map(i=>i.cmd);
  const choco=all.filter(i=>i.type==='choco').map(i=>i.cmd);
  const ps=all.filter(i=>i.type==='ps').map(i=>i.cmd);
  const ollama=all.filter(i=>i.type==='ollama').map(i=>i.cmd);
  const manual=all.filter(i=>i.type==='manual').map(i=>`# MANUAL: ${i.name} — ${i.cmd}`);
  const uniq=a=>[...new Set(a)];

  return `# ══════════════════════════════════════════════════════════════
# T1NK3R-VER53 // TINY11 BOOTSTRAP — SAVE AS install.ps1
# Right-click → Run as Administrator  OR  from elevated PS:
# Set-ExecutionPolicy Bypass -Scope Process -Force; .\\install.ps1
# ══════════════════════════════════════════════════════════════

# ── STEP 0: SELF-ELEVATE ───────────────────────────────────────
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  Start-Process PowerShell "-NoProfile -ExecutionPolicy Bypass -File \`"$PSCommandPath\`"" -Verb RunAs
  exit
}
Set-ExecutionPolicy RemoteSigned -Force -Scope LocalMachine
Write-Host "⚡ T1NK3R-VER53 // TINY11 DEPLOYMENT INITIATED" -ForegroundColor Cyan

# ── STEP 1: BOOTSTRAP WINGET ──────────────────────────────────
Write-Host "[1/6] Checking winget..." -ForegroundColor Yellow
if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
  Write-Host "  Installing App Installer (winget)..." -ForegroundColor Yellow
  $uri = "https://aka.ms/getwinget"
  $msix = "$env:TEMP\\AppInstaller.msixbundle"
  Invoke-WebRequest -Uri $uri -OutFile $msix -UseBasicParsing
  Add-AppxPackage -Path $msix
  Write-Host "  ✓ winget installed" -ForegroundColor Green
} else { Write-Host "  ✓ winget found" -ForegroundColor Green }

# ── STEP 2: BOOTSTRAP CHOCOLATEY ──────────────────────────────
Write-Host "[2/6] Checking Chocolatey..." -ForegroundColor Yellow
if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
  Set-ExecutionPolicy Bypass -Scope Process -Force
  [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
  Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
  Write-Host "  ✓ Chocolatey installed" -ForegroundColor Green
} else { Write-Host "  ✓ Chocolatey found" -ForegroundColor Green }

${winget.length?`# ── STEP 3: WINGET PACKAGES ──────────────────────────────────
Write-Host "[3/6] Installing winget packages..." -ForegroundColor Yellow
${uniq(winget).map(c=>`try { ${c}; Write-Host "  ✓ done" -FG Green } catch { Write-Host "  ⚠ failed — may already be installed" -FG Yellow }`).join('\n')}
`:'# ── STEP 3: No winget packages selected\n'}
${choco.length?`# ── STEP 4: CHOCOLATEY PACKAGES ──────────────────────────────
Write-Host "[4/6] Installing Chocolatey packages..." -ForegroundColor Yellow
${uniq(choco).map(c=>`try { ${c} } catch { Write-Host "  ⚠ choco: failed" -FG Yellow }`).join('\n')}
`:''}
# ── STEP 5: NPM + AI CLI TOOLS ────────────────────────────────
Write-Host "[5/6] Installing npm + CLI AI tools..." -ForegroundColor Yellow
# Requires Node.js to be installed (Step 3)
$env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
${uniq(npm).map(c=>`try { ${c} } catch { Write-Host "  ⚠ npm: failed" -FG Yellow }`).join('\n')}

# ── STEP 6: OLLAMA MODELS ─────────────────────────────────────
Write-Host "[6/6] Pulling Ollama companion models..." -ForegroundColor Yellow
# Requires Ollama to be installed and running
Start-Sleep -Seconds 5
${uniq(ollama).map(c=>`try { ${c} } catch { Write-Host "  ⚠ ollama: failed — is Ollama running?" -FG Yellow }`).join('\n')}

${manual.length?`# ── MANUAL STEPS (do these yourself) ─────────────────────────
${uniq(manual).join('\n')}
`:''}
${ps.length?`# ── ADDITIONAL POWERSHELL STEPS ──────────────────────────────
${uniq(ps).join('\n')}
`:''}
Write-Host ""
Write-Host "══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "⚡ T1NK3R-VER53 // TINY11 DEPLOYMENT COMPLETE" -ForegroundColor Green
Write-Host "  → Restart recommended" -ForegroundColor Yellow
Write-Host "  → Then: ollama serve (in a new terminal)" -ForegroundColor Yellow
Write-Host "  → Open WebUI: http://localhost:3000" -ForegroundColor Yellow
Write-Host "══════════════════════════════════════════════════════" -ForegroundColor Cyan`;
}

function genCachy() {
  const js=collectJSItems('cachy'), cat=collectCatItems('cachy');
  const all=[...js,...cat];
  const pacman=[...new Set(all.filter(i=>i.type==='pacman').map(i=>{
    const m=i.cmd.match(/sudo pacman -S --needed --noconfirm (.+)/);
    return m?m[1].trim():null;
  }).filter(Boolean))];
  const aur=[...new Set(all.filter(i=>i.type==='aur').map(i=>{
    const m=i.cmd.match(/(?:yay|paru) -S --needed --noconfirm (.+)/);
    return m?m[1].trim():null;
  }).filter(Boolean))];
  const flatpak=[...new Set(all.filter(i=>i.type==='flatpak').map(i=>{
    const m=i.cmd.match(/flatpak install -y flathub (.+)/);
    return m?m[1].trim():null;
  }).filter(Boolean))];
  const npm=[...new Set(all.filter(i=>i.type==='npm').map(i=>i.cmd))];
  const pip=[...new Set(all.filter(i=>i.type==='pip').map(i=>i.cmd))];
  const cargo=[...new Set(all.filter(i=>i.type==='cargo').map(i=>i.cmd))];
  const ollama=[...new Set(all.filter(i=>i.type==='ollama').map(i=>i.cmd.replace('ollama pull','').trim()))];
  const manual=all.filter(i=>i.type==='manual').map(i=>`# MANUAL: ${i.name}\n# ${i.cmd}`);

  return `#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════
# T1NK3R-VER53 // CACHYOS BOOTSTRAP — FRESH INSTALL
# Generated by T1NK3R.TRIBOOT // NANITE GOD MODE
# bash install.sh        ← run with bash explicitly (fish: use bash, not ./)
# ══════════════════════════════════════════════════════════════
set -euo pipefail

RED="\\033[0;31m"; GREEN="\\033[0;32m"; AMBER="\\033[0;33m"; BLUE="\\033[0;34m"; RESET="\\033[0m"
ok()   { echo -e "\${GREEN}[OK]\${RESET} $*"; }
warn() { echo -e "\${AMBER}[WARN]\${RESET} $*"; }
err()  { echo -e "\${RED}[ERR]\${RESET} $*" >&2; }
step() { echo -e "\${BLUE}══ $* \${RESET}"; }

[[ $(id -u) -eq 0 ]] && { err "Do not run as root."; exit 1; }
command -v pacman >/dev/null 2>&1 || { err "pacman not found — are you on CachyOS/Arch?"; exit 1; }

echo -e "⚡ \${GREEN}T1NK3R-VER53 // CACHYOS DEPLOYMENT INITIATED\${RESET}"

# ── STEP 1: BASE-DEVEL + GIT ──────────────────────────────────
step "1/8 — base-devel + git (prerequisite)"
sudo pacman -S --needed --noconfirm base-devel git || warn "base-devel issue"

# ── STEP 2: AUR HELPER ────────────────────────────────────────
step "2/8 — AUR helper (yay)"
AUR_HELPER=""
for h in yay paru; do command -v "$h" >/dev/null 2>&1 && { AUR_HELPER="$h"; break; }; done
if [[ -z "$AUR_HELPER" ]]; then
  warn "No AUR helper found — installing yay..."
  tmpdir=$(mktemp -d)
  git clone https://aur.archlinux.org/yay.git "$tmpdir/yay"
  (cd "$tmpdir/yay" && makepkg -si --noconfirm)
  rm -rf "$tmpdir"
  AUR_HELPER="yay"
  ok "yay installed"
else
  ok "AUR helper: $AUR_HELPER"
fi

# ── STEP 3: FLATPAK + FLATHUB ─────────────────────────────────
step "3/8 — Flatpak + Flathub"
sudo pacman -S --needed --noconfirm flatpak || true
flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo || true
ok "Flatpak ready"

# ── STEP 4: LANG RUNTIMES (nvm, Rust, pipx) ──────────────────
step "4/8 — Language runtimes (nvm → Node, Rust, pipx)"
# nvm + Node LTS
if ! command -v nvm >/dev/null 2>&1 && [[ ! -d "$HOME/.nvm" ]]; then
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  source "$NVM_DIR/nvm.sh"
  nvm install --lts
  ok "Node LTS installed via nvm"
else
  ok "nvm/Node already present"
fi
# Rust
if ! command -v cargo >/dev/null 2>&1; then
  curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
  source "$HOME/.cargo/env"
  ok "Rust installed"
else ok "Rust already present"; fi
# pipx
sudo pacman -S --needed --noconfirm python-pipx || true
pipx ensurepath || true
ok "pipx ready"

${pacman.length?`# ── STEP 5: PACMAN PACKAGES ──────────────────────────────────
step "5/8 — pacman packages"
sudo pacman -S --needed --noconfirm \\
  ${pacman.join(' \\\n  ')} || warn "Some pacman packages may have failed"
ok "pacman done"
`:'# ── STEP 5: No pacman packages selected\n'}
${aur.length?`# ── STEP 5b: AUR PACKAGES ────────────────────────────────────
step "5b — AUR packages via $AUR_HELPER"
"$AUR_HELPER" -S --needed --noconfirm \\
  ${aur.join(' \\\n  ')} || warn "Some AUR packages may have failed"
ok "AUR done"
`:''}
${flatpak.length?`# ── STEP 5c: FLATPAK PACKAGES ────────────────────────────────
step "5c — Flatpak packages"
${flatpak.map(p=>`flatpak install -y flathub ${p} || warn "flatpak: ${p}"`).join('\n')}
ok "Flatpak done"
`:''}
# ── STEP 6: CLI AI TOOLS ──────────────────────────────────────
step "6/8 — CLI AI tools"
export NVM_DIR="$HOME/.nvm"; [[ -s "$NVM_DIR/nvm.sh" ]] && source "$NVM_DIR/nvm.sh"
${npm.map(c=>`${c} || warn "npm failed: ${c}"`).join('\n')}
${pip.map(c=>`${c} || warn "pip failed: ${c}"`).join('\n')}
${cargo.map(c=>`${c} || warn "cargo failed: ${c}"`).join('\n')}
ok "CLI AI tools done"

# ── STEP 7: OLLAMA + COMPANIONS ───────────────────────────────
step "7/8 — Ollama + companion models"
if ! command -v ollama >/dev/null 2>&1; then
  curl -fsSL https://ollama.com/install.sh | sh
fi
sudo systemctl enable --now ollama 2>/dev/null || true
sleep 4
${ollama.map(m=>`ollama pull ${m} || warn "ollama pull failed: ${m}"`).join('\n')}
ok "Companions pulled"

# ── STEP 8: GROUPS + SERVICES ─────────────────────────────────
step "8/8 — User groups + services"
sudo usermod -aG docker,realtime,audio,video,input,storage "$USER" 2>/dev/null || true
sudo systemctl enable --now docker 2>/dev/null || true
sudo systemctl enable --now ufw 2>/dev/null || true
ok "Groups + services configured"

${manual.length?`# ── MANUAL STEPS ──────────────────────────────────────────────
${manual.join('\n')}
`:''}
echo ""
echo "══════════════════════════════════════════════════════"
echo -e "⚡ \${GREEN}T1NK3R-VER53 // CACHYOS DEPLOYMENT COMPLETE\${RESET}"
echo -e "  \${AMBER}→ Reboot recommended\${RESET}"
echo -e "  \${AMBER}→ Then: ollama serve &\${RESET}"
echo -e "  \${AMBER}→ Open WebUI: http://localhost:3000\${RESET}"
echo "══════════════════════════════════════════════════════"`;
}

function genBazzite() {
  const js=collectJSItems('bazzite'), cat=collectCatItems('bazzite');
  const all=[...js,...cat];
  const flatpak=[...new Set(all.filter(i=>i.type==='flatpak').map(i=>{
    const m=i.cmd.match(/flatpak install -y flathub (.+)/);
    return m?m[1].trim():null;
  }).filter(Boolean))];
  const ostree=[...new Set(all.filter(i=>i.type==='ostree').map(i=>{
    const m=i.cmd.match(/rpm-ostree install (.+)/);
    return m?m[1].trim():null;
  }).filter(Boolean))];
  const toolbox=[...new Set(all.filter(i=>i.type==='toolbox').map(i=>i.cmd))];
  const ollama=[...new Set(all.filter(i=>i.type==='ollama').map(i=>i.cmd.replace('ollama pull','').trim()))];
  const manual=all.filter(i=>i.type==='manual').map(i=>`# MANUAL: ${i.name}\n# ${i.cmd}`);

  return `#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════
# T1NK3R-VER53 // BAZZITE BOOTSTRAP — FRESH INSTALL
# Generated by T1NK3R.TRIBOOT // NANITE GOD MODE
# bash install.sh        ← run with bash explicitly (fish: use bash, not ./)
# Run this script in two phases if layering packages
# ══════════════════════════════════════════════════════════════
set -euo pipefail

RED="\\033[0;31m"; GREEN="\\033[0;32m"; AMBER="\\033[0;33m"; BLUE="\\033[0;34m"; RESET="\\033[0m"
ok()   { echo -e "\${GREEN}[OK]\${RESET} $*"; }
warn() { echo -e "\${AMBER}[WARN]\${RESET} $*"; }
step() { echo -e "\${BLUE}══ $* \${RESET}"; }

echo -e "⚡ \${GREEN}T1NK3R-VER53 // BAZZITE DEPLOYMENT INITIATED\${RESET}"

# ── STEP 1: FLATHUB REMOTE ────────────────────────────────────
step "1/6 — Flathub remote"
flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo || true
ok "Flathub ready"

${ostree.length?`# ── STEP 2: RPM-OSTREE LAYERS ─────────────────────────────────
step "2/6 — rpm-ostree package layers"
echo -e "\${AMBER}⚠ NOTE: System will need to REBOOT after this step.\${RESET}"
echo -e "\${AMBER}  After reboot, re-run this script to continue remaining steps.\${RESET}"
rpm-ostree install \\
  ${ostree.join(' \\\n  ')} || warn "Some rpm-ostree layers may have failed"
echo -e "\${AMBER}  → rpm-ostree layers staged. Run: systemctl reboot\${RESET}"
ok "rpm-ostree layers staged — REBOOT RECOMMENDED before continuing"
`:`# ── STEP 2: No rpm-ostree layers selected\n`}
# ── STEP 3: TOOLBOX SETUP ─────────────────────────────────────
step "3/6 — Toolbox container (tinker)"
if ! toolbox list | grep -q "tinker"; then
  toolbox create tinker
  ok "Toolbox 'tinker' created"
else
  ok "Toolbox 'tinker' already exists"
fi

# Bootstrap toolbox with runtimes
toolbox run --container tinker bash -c "
  # nvm + Node LTS
  if [[ ! -d \\$HOME/.nvm ]]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    source \\$HOME/.nvm/nvm.sh && nvm install --lts
  fi
  # Rust
  if ! command -v cargo >/dev/null 2>&1; then
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source \\$HOME/.cargo/env
  fi
  # pipx
  pip install --user pipx && python3 -m pipx ensurepath 2>/dev/null || true
  echo '✓ Toolbox runtimes ready'
" || warn "Toolbox bootstrap issue"

# ── STEP 4: TOOLBOX CLI AI TOOLS ──────────────────────────────
step "4/6 — CLI AI tools in toolbox"
${toolbox.map(c=>`${c} || warn "toolbox: ${c.substring(0,50)}..."`).join('\n')}
ok "Toolbox CLI tools done"

${flatpak.length?`# ── STEP 5: FLATPAK PACKAGES ─────────────────────────────────
step "5/6 — Flatpak packages"
${flatpak.map(p=>`flatpak install -y flathub ${p} || warn "flatpak: ${p}"`).join('\n')}
ok "Flatpak done"
`:'# ── STEP 5: No flatpak packages selected\n'}
# ── STEP 6: OLLAMA + COMPANIONS ───────────────────────────────
step "6/6 — Ollama + companion models"
# Run Ollama inside toolbox
if ! toolbox run --container tinker command -v ollama >/dev/null 2>&1; then
  toolbox run --container tinker bash -c "curl -fsSL https://ollama.com/install.sh | sh"
fi
# Start Ollama in toolbox background
toolbox run --container tinker bash -c "ollama serve &" 2>/dev/null || true
sleep 5
${ollama.map(m=>`toolbox run --container tinker ollama pull ${m} || warn "ollama: ${m}"`).join('\n')}
ok "Companions pulled"

# HSA override for RX 6600 if not already set
grep -qxF 'export HSA_OVERRIDE_GFX_VERSION=10.3.0' ~/.bashrc || \\
  echo 'export HSA_OVERRIDE_GFX_VERSION=10.3.0' >> ~/.bashrc

${manual.length?`# ── MANUAL STEPS ──────────────────────────────────────────────
${manual.join('\n')}
`:''}
echo ""
echo "══════════════════════════════════════════════════════"
echo -e "⚡ \${GREEN}T1NK3R-VER53 // BAZZITE DEPLOYMENT COMPLETE\${RESET}"
echo -e "  \${AMBER}→ If rpm-ostree layers were added: systemctl reboot\${RESET}"
echo -e "  \${AMBER}→ To use CLI tools: toolbox enter tinker\${RESET}"
echo -e "  \${AMBER}→ Ollama runs inside toolbox: toolbox enter tinker → ollama serve\${RESET}"
echo -e "  \${AMBER}→ Open WebUI (if installed): http://localhost:3000\${RESET}"
echo "══════════════════════════════════════════════════════"`;
}

// ═══════════════════════════════════════════════════════════════
// BUCKETS — shared by the fedora/ubuntu/arch/macos/android
// generators. Package-manager commands only get batched when they
// are a plain single install line; anything chained with && / | / ;
// is emitted verbatim instead of being mis-parsed as a package name.
// ═══════════════════════════════════════════════════════════════
function collectBuckets(os) {
  const all = [...collectJSItems(os), ...collectCatItems(os)];
  const uniq = a => [...new Set(a)];
  const raw = t => uniq(all.filter(i => i.type === t).map(i => i.cmd));
  const names = (t, re) => uniq(all.filter(i => i.type === t)
    .map(i => { const m = i.cmd.match(re); return m ? m[1].trim() : null; }).filter(Boolean));
  const stray = (t, re) => uniq(all.filter(i => i.type === t && !re.test(i.cmd)).map(i => i.cmd));
  return {
    all, uniq, raw, names, stray,
    npm: raw('npm'), pip: raw('pip'), cargo: raw('cargo'),
    flatpak: names('flatpak', /^flatpak install -y flathub ([^&|;]+)$/),
    ollama: uniq(all.filter(i => i.type === 'ollama').map(i => i.cmd.replace('ollama pull', '').trim())),
    manual: uniq(all.filter(i => i.type === 'manual' || i.type === 'na')
      .map(i => `# MANUAL: ${i.name}\n#   ${i.cmd}`)),
  };
}

// Shared bash preamble (colors + helpers + root/pkg-manager guards).
function unixHeader(label, requireCmd, requireMsg) {
  return `#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════
# T1NK3R-VER53 // ${label} BOOTSTRAP — FRESH INSTALL
# Generated by T1NK3R.TRIBOOT // NANITE GOD MODE
# bash install.sh        ← run with bash explicitly (fish: use bash, not ./)
# ══════════════════════════════════════════════════════════════
set -euo pipefail

RED="\\033[0;31m"; GREEN="\\033[0;32m"; AMBER="\\033[0;33m"; BLUE="\\033[0;34m"; RESET="\\033[0m"
ok()   { echo -e "\${GREEN}[OK]\${RESET} $*"; }
warn() { echo -e "\${AMBER}[WARN]\${RESET} $*"; }
err()  { echo -e "\${RED}[ERR]\${RESET} $*" >&2; }
step() { echo -e "\${BLUE}══ $* \${RESET}"; }

[[ $(id -u) -eq 0 ]] && { err "Do not run as root."; exit 1; }
command -v ${requireCmd} >/dev/null 2>&1 || { err "${requireMsg}"; exit 1; }

echo -e "⚡ \${GREEN}T1NK3R-VER53 // ${label} DEPLOYMENT INITIATED\${RESET}"`;
}

// Shared tail: CLI AI tools → Ollama companions → manual notes.
function unixTail(b, opts) {
  const { ollamaInstall, services, closing } = opts;
  return `
# ── CLI AI TOOLS ──────────────────────────────────────────────
step "CLI AI tools"
export NVM_DIR="$HOME/.nvm"; [[ -s "$NVM_DIR/nvm.sh" ]] && source "$NVM_DIR/nvm.sh"
[[ -s "$HOME/.cargo/env" ]] && source "$HOME/.cargo/env"
${[...b.npm, ...b.pip, ...b.cargo].map(c => `${c} || warn "failed: ${c}"`).join('\n') || '# none selected'}
ok "CLI AI tools done"

${b.ollama.length ? `# ── OLLAMA + COMPANIONS ───────────────────────────────────────
step "Ollama + companion models"
${ollamaInstall}
sleep 4
${b.ollama.map(m => `ollama pull ${m} || warn "ollama pull failed: ${m}"`).join('\n')}
ok "Companions pulled"
` : '# ── No companion models selected\n'}
${services ? `# ── SERVICES + GROUPS ─────────────────────────────────────────
step "Services + user groups"
${services}
ok "Services configured"
` : ''}
${b.manual.length ? `# ── MANUAL STEPS (not automated on purpose) ───────────────────
${b.manual.join('\n')}
` : ''}
echo ""
echo "══════════════════════════════════════════════════════"
${closing.map(l => `echo -e "${l}"`).join('\n')}
echo "══════════════════════════════════════════════════════"`;
}

function genFedora() {
  const b = collectBuckets('fedora');
  const re = /^sudo dnf install -y ([^&|;]+)$/;
  const dnf = b.names('dnf', re), dnfExtra = b.stray('dnf', re);
  return `${unixHeader('FEDORA', 'dnf', 'dnf not found — is this Fedora/RHEL/CentOS?')}

# ── STEP 1: SYSTEM REFRESH ────────────────────────────────────
step "1/6 — dnf refresh + upgrade"
sudo dnf upgrade --refresh -y || warn "dnf upgrade issue"
sudo dnf install -y git curl wget pipx || warn "core tools issue"

# ── STEP 2: RPM FUSION + FLATHUB ──────────────────────────────
step "2/6 — RPM Fusion + Flathub"
sudo dnf install -y \\
  https://mirrors.rpmfusion.org/free/fedora/rpmfusion-free-release-$(rpm -E %fedora).noarch.rpm \\
  https://mirrors.rpmfusion.org/nonfree/fedora/rpmfusion-nonfree-release-$(rpm -E %fedora).noarch.rpm || warn "RPM Fusion issue"
sudo dnf install -y flatpak || true
flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo || true
ok "Repos ready"

# ── STEP 3: LANG RUNTIMES (nvm, Rust, pipx) ───────────────────
step "3/6 — Language runtimes"
if [[ ! -d "$HOME/.nvm" ]]; then
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  export NVM_DIR="$HOME/.nvm"; source "$NVM_DIR/nvm.sh"; nvm install --lts
  ok "Node LTS installed via nvm"
else ok "nvm already present"; fi
if ! command -v cargo >/dev/null 2>&1; then
  curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
  source "$HOME/.cargo/env"
  ok "Rust installed"
else ok "Rust already present"; fi
pipx ensurepath || true

${dnf.length ? `# ── STEP 4: DNF PACKAGES ──────────────────────────────────────
step "4/6 — dnf packages"
sudo dnf install -y \\
  ${dnf.join(' \\\n  ')} || warn "Some dnf packages may have failed"
ok "dnf done"
` : '# ── STEP 4: No dnf packages selected\n'}
${dnfExtra.length ? `# ── STEP 4b: DNF EXTRAS (chained commands) ────────────────────
${dnfExtra.map(c => `${c} || warn "failed: ${c}"`).join('\n')}
` : ''}
${b.flatpak.length ? `# ── STEP 5: FLATPAK PACKAGES ──────────────────────────────────
step "5/6 — Flatpak packages"
${b.flatpak.map(p => `flatpak install -y flathub ${p} || warn "flatpak: ${p}"`).join('\n')}
ok "Flatpak done"
` : '# ── STEP 5: No flatpak packages selected\n'}
${unixTail(b, {
  ollamaInstall: `if ! command -v ollama >/dev/null 2>&1; then
  curl -fsSL https://ollama.com/install.sh | sh
fi
sudo systemctl enable --now ollama 2>/dev/null || true`,
  services: `sudo usermod -aG docker,realtime,audio,video,input "$USER" 2>/dev/null || true
sudo systemctl enable --now docker 2>/dev/null || true`,
  closing: [
    '⚡ ${GREEN}T1NK3R-VER53 // FEDORA DEPLOYMENT COMPLETE${RESET}',
    '  ${AMBER}→ Log out and back in to pick up new groups${RESET}',
    '  ${AMBER}→ Then: ollama serve &${RESET}',
    '  ${AMBER}→ Open WebUI: http://localhost:3000${RESET}',
  ],
})}`;
}

function genUbuntu() {
  const b = collectBuckets('ubuntu');
  const re = /^sudo apt install -y ([^&|;]+)$/;
  const apt = b.names('apt', re), aptExtra = b.stray('apt', re);
  const snap = b.raw('snap');
  return `${unixHeader('UBUNTU/DEBIAN', 'apt', 'apt not found — is this Ubuntu/Debian?')}

# ── STEP 1: APT REFRESH ───────────────────────────────────────
step "1/6 — apt update + upgrade"
sudo apt update || warn "apt update issue"
sudo apt upgrade -y || warn "apt upgrade issue"
sudo apt install -y build-essential git curl wget ca-certificates pipx || warn "core tools issue"

# ── STEP 2: FLATPAK + FLATHUB ─────────────────────────────────
step "2/6 — Flatpak + Flathub"
sudo apt install -y flatpak || true
flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo || true
ok "Flatpak ready"

# ── STEP 3: LANG RUNTIMES (nvm, Rust, pipx) ───────────────────
step "3/6 — Language runtimes"
if [[ ! -d "$HOME/.nvm" ]]; then
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  export NVM_DIR="$HOME/.nvm"; source "$NVM_DIR/nvm.sh"; nvm install --lts
  ok "Node LTS installed via nvm"
else ok "nvm already present"; fi
if ! command -v cargo >/dev/null 2>&1; then
  curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
  source "$HOME/.cargo/env"
  ok "Rust installed"
else ok "Rust already present"; fi
pipx ensurepath || true

${apt.length ? `# ── STEP 4: APT PACKAGES ──────────────────────────────────────
step "4/6 — apt packages"
sudo apt install -y \\
  ${apt.join(' \\\n  ')} || warn "Some apt packages may have failed"
ok "apt done"
` : '# ── STEP 4: No apt packages selected\n'}
${aptExtra.length ? `# ── STEP 4b: APT EXTRAS (chained commands) ────────────────────
${aptExtra.map(c => `${c} || warn "failed: ${c}"`).join('\n')}
` : ''}
${snap.length ? `# ── STEP 4c: SNAP PACKAGES ────────────────────────────────────
step "4c — snap packages"
${snap.map(c => `${c} || warn "snap failed: ${c}"`).join('\n')}
ok "snap done"
` : ''}
${b.flatpak.length ? `# ── STEP 5: FLATPAK PACKAGES ──────────────────────────────────
step "5/6 — Flatpak packages"
${b.flatpak.map(p => `flatpak install -y flathub ${p} || warn "flatpak: ${p}"`).join('\n')}
ok "Flatpak done"
` : '# ── STEP 5: No flatpak packages selected\n'}
${unixTail(b, {
  ollamaInstall: `if ! command -v ollama >/dev/null 2>&1; then
  curl -fsSL https://ollama.com/install.sh | sh
fi
sudo systemctl enable --now ollama 2>/dev/null || true`,
  services: `sudo usermod -aG docker,audio,video,input "$USER" 2>/dev/null || true
sudo systemctl enable --now docker 2>/dev/null || true`,
  closing: [
    '⚡ ${GREEN}T1NK3R-VER53 // UBUNTU DEPLOYMENT COMPLETE${RESET}',
    '  ${AMBER}→ Log out and back in to pick up new groups${RESET}',
    '  ${AMBER}→ Then: ollama serve &${RESET}',
    '  ${AMBER}→ Open WebUI: http://localhost:3000${RESET}',
  ],
})}`;
}

function genArch() {
  const b = collectBuckets('arch');
  const pRe = /^sudo pacman -S --needed --noconfirm ([^&|;]+)$/;
  const aRe = /^(?:yay|paru) -S --needed --noconfirm ([^&|;]+)$/;
  const pacman = b.names('pacman', pRe), pacExtra = b.stray('pacman', pRe);
  const aur = b.names('aur', aRe);
  // Only touch the Docker daemon (and the docker group) when a Docker package
  // was actually selected; nothing else is enabled or started here.
  const hasDocker = pacman.some(n => n.split(/\s+/).includes('docker'));
  return `${unixHeader('ARCH LINUX', 'pacman', 'pacman not found — is this Arch?')}

# ── STEP 1: BASE-DEVEL + MIRRORS ──────────────────────────────
step "1/6 — base-devel + git"
sudo pacman -S --needed --noconfirm base-devel git || warn "base-devel issue"

# ── STEP 2: AUR HELPER ────────────────────────────────────────
step "2/6 — AUR helper (yay)"
AUR_HELPER=""
for h in yay paru; do command -v "$h" >/dev/null 2>&1 && { AUR_HELPER="$h"; break; }; done
if [[ -z "$AUR_HELPER" ]]; then
  warn "No AUR helper found — installing yay..."
  tmpdir=$(mktemp -d)
  git clone https://aur.archlinux.org/yay.git "$tmpdir/yay"
  (cd "$tmpdir/yay" && makepkg -si --noconfirm)
  rm -rf "$tmpdir"
  AUR_HELPER="yay"
  ok "yay installed"
else ok "AUR helper: $AUR_HELPER"; fi

# ── STEP 3: FLATPAK + RUNTIMES ────────────────────────────────
step "3/6 — Flatpak + language runtimes"
sudo pacman -S --needed --noconfirm flatpak fuse2 python-pipx rustup || true
flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo || true
rustup default stable 2>/dev/null || true
pipx ensurepath || true
if [[ ! -d "$HOME/.nvm" ]]; then
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  export NVM_DIR="$HOME/.nvm"; source "$NVM_DIR/nvm.sh"; nvm install --lts
fi
ok "Runtimes ready"

${pacman.length ? `# ── STEP 4: PACMAN PACKAGES ───────────────────────────────────
step "4/6 — pacman packages"
sudo pacman -S --needed --noconfirm \\
  ${pacman.join(' \\\n  ')} || warn "Some pacman packages may have failed"
ok "pacman done"
` : '# ── STEP 4: No pacman packages selected\n'}
${pacExtra.length ? `# ── STEP 4b: PACMAN EXTRAS (chained commands) ─────────────────
${pacExtra.map(c => `${c} || warn "failed: ${c}"`).join('\n')}
` : ''}
${aur.length ? `# ── STEP 4c: AUR PACKAGES ─────────────────────────────────────
step "4c — AUR packages via $AUR_HELPER"
"$AUR_HELPER" -S --needed --noconfirm \\
  ${aur.join(' \\\n  ')} || warn "Some AUR packages may have failed"
ok "AUR done"
` : ''}
${b.flatpak.length ? `# ── STEP 5: FLATPAK PACKAGES ──────────────────────────────────
step "5/6 — Flatpak packages"
${b.flatpak.map(p => `flatpak install -y flathub ${p} || warn "flatpak: ${p}"`).join('\n')}
ok "Flatpak done"
` : '# ── STEP 5: No flatpak packages selected\n'}
${unixTail(b, {
  ollamaInstall: `if ! command -v ollama >/dev/null 2>&1; then
  sudo pacman -S --needed --noconfirm ollama || curl -fsSL https://ollama.com/install.sh | sh
fi
sudo systemctl enable --now ollama 2>/dev/null || true`,
  services: `sudo usermod -aG ${hasDocker ? 'docker,' : ''}realtime,audio,video,input,storage "$USER" 2>/dev/null || true${hasDocker ? '\nsudo systemctl enable --now docker 2>/dev/null || true' : ''}`,
  closing: [
    '⚡ ${GREEN}T1NK3R-VER53 // ARCH DEPLOYMENT COMPLETE${RESET}',
    '  ${AMBER}→ Never partial-upgrade: use pacman -Syu, not -Sy pkg${RESET}',
    '  ${AMBER}→ Then: ollama serve &${RESET}',
    '  ${AMBER}→ Open WebUI: http://localhost:3000${RESET}',
  ],
})}`;
}

function genMacos() {
  const b = collectBuckets('macos');
  const fRe = /^brew install ((?!--cask)[^&|;]+)$/;
  const cRe = /^brew install --cask ([^&|;]+)$/;
  const formula = b.names('brew', fRe), cask = b.names('brew', cRe);
  const brewExtra = b.raw('brew').filter(c => !fRe.test(c) && !cRe.test(c));
  return `#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════
# T1NK3R-VER53 // MACOS BOOTSTRAP — FRESH INSTALL
# Generated by T1NK3R.TRIBOOT // NANITE GOD MODE
# zsh install.sh    (or: bash install.sh — both work)
# ══════════════════════════════════════════════════════════════
set -euo pipefail

RED="\\033[0;31m"; GREEN="\\033[0;32m"; AMBER="\\033[0;33m"; BLUE="\\033[0;34m"; RESET="\\033[0m"
ok()   { echo -e "\${GREEN}[OK]\${RESET} $*"; }
warn() { echo -e "\${AMBER}[WARN]\${RESET} $*"; }
err()  { echo -e "\${RED}[ERR]\${RESET} $*" >&2; }
step() { echo -e "\${BLUE}══ $* \${RESET}"; }

[[ "$(uname -s)" == "Darwin" ]] || { err "This script is for macOS."; exit 1; }
[[ $(id -u) -eq 0 ]] && { err "Do not run as root — Homebrew refuses."; exit 1; }

echo -e "⚡ \${GREEN}T1NK3R-VER53 // MACOS DEPLOYMENT INITIATED\${RESET}"

# ── STEP 1: XCODE COMMAND LINE TOOLS ──────────────────────────
step "1/5 — Xcode Command Line Tools"
xcode-select -p >/dev/null 2>&1 || xcode-select --install || warn "CLT install may need a GUI confirm"

# ── STEP 2: HOMEBREW ──────────────────────────────────────────
step "2/5 — Homebrew"
if ! command -v brew >/dev/null 2>&1; then
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  # Apple Silicon installs to /opt/homebrew, Intel to /usr/local
  [[ -x /opt/homebrew/bin/brew ]] && eval "$(/opt/homebrew/bin/brew shellenv)"
  [[ -x /usr/local/bin/brew ]] && eval "$(/usr/local/bin/brew shellenv)"
  ok "Homebrew installed"
else ok "Homebrew already present"; fi
brew update || warn "brew update issue"

${formula.length ? `# ── STEP 3: BREW FORMULAE ─────────────────────────────────────
step "3/5 — brew formulae"
brew install \\
  ${formula.join(' \\\n  ')} || warn "Some formulae may have failed"
ok "Formulae done"
` : '# ── STEP 3: No brew formulae selected\n'}
${cask.length ? `# ── STEP 3b: BREW CASKS (GUI APPS) ────────────────────────────
step "3b — brew casks"
brew install --cask \\
  ${cask.join(' \\\n  ')} || warn "Some casks may have failed"
ok "Casks done"
` : ''}
${brewExtra.length ? `# ── STEP 3c: BREW EXTRAS (chained commands) ───────────────────
${brewExtra.map(c => `${c} || warn "failed: ${c}"`).join('\n')}
` : ''}
# ── STEP 4: RUNTIMES ──────────────────────────────────────────
step "4/5 — Runtimes (node, rustup, pipx)"
command -v node  >/dev/null 2>&1 || brew install node
command -v cargo >/dev/null 2>&1 || { brew install rustup && rustup-init -y; }
command -v pipx  >/dev/null 2>&1 || brew install pipx
pipx ensurepath || true
[[ -s "$HOME/.cargo/env" ]] && source "$HOME/.cargo/env"
ok "Runtimes ready"
${unixTail(b, {
  ollamaInstall: `if ! command -v ollama >/dev/null 2>&1; then
  brew install --cask ollama || warn "install Ollama.app manually from ollama.com"
fi
open -a Ollama 2>/dev/null || true`,
  services: null,
  closing: [
    '⚡ ${GREEN}T1NK3R-VER53 // MACOS DEPLOYMENT COMPLETE${RESET}',
    '  ${AMBER}→ Ollama uses Metal on Apple Silicon — no ROCm, no HSA override${RESET}',
    '  ${AMBER}→ Casks may prompt for your password and Gatekeeper approval${RESET}',
    '  ${AMBER}→ Open WebUI: http://localhost:3000${RESET}',
  ],
})}`;
}

function genAndroid() {
  const b = collectBuckets('android');
  const re = /^pkg install -y ([^&|;]+)$/;
  const pkg = b.names('termux', re), pkgExtra = b.stray('termux', re);
  return `#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════
# T1NK3R-VER53 // ANDROID (TERMUX) BOOTSTRAP
# Generated by T1NK3R.TRIBOOT // NANITE GOD MODE
# Run inside Termux:  bash install.sh
# Termux must be the F-Droid build — the Play Store one is dead.
# ══════════════════════════════════════════════════════════════
set -uo pipefail

GREEN="\\033[0;32m"; AMBER="\\033[0;33m"; RED="\\033[0;31m"; BLUE="\\033[0;34m"; RESET="\\033[0m"
ok()   { echo -e "\${GREEN}[OK]\${RESET} $*"; }
warn() { echo -e "\${AMBER}[WARN]\${RESET} $*"; }
err()  { echo -e "\${RED}[ERR]\${RESET} $*" >&2; }
step() { echo -e "\${BLUE}══ $* \${RESET}"; }

command -v pkg >/dev/null 2>&1 || { err "pkg not found — this must run inside Termux."; exit 1; }

echo -e "⚡ \${GREEN}T1NK3R-VER53 // TERMUX DEPLOYMENT INITIATED\${RESET}"

# ── STEP 1: PACKAGE REFRESH ───────────────────────────────────
step "1/5 — pkg update + upgrade"
pkg update -y && pkg upgrade -y || warn "pkg upgrade issue"

# ── STEP 2: STORAGE + CORE TOOLS ──────────────────────────────
step "2/5 — storage access + core tools"
termux-setup-storage || warn "storage permission not granted — approve the dialog and re-run"
pkg install -y git curl wget python nodejs-lts rust tur-repo || warn "core tools issue"
ok "Core tools ready"

${pkg.length ? `# ── STEP 3: TERMUX PACKAGES ───────────────────────────────────
step "3/5 — pkg packages"
pkg install -y \\
  ${pkg.join(' \\\n  ')} || warn "Some packages may have failed"
ok "pkg done"
` : '# ── STEP 3: No pkg packages selected\n'}
${pkgExtra.length ? `# ── STEP 3b: TERMUX EXTRAS (chained commands) ─────────────────
${pkgExtra.map(c => `${c} || warn "failed: ${c}"`).join('\n')}
` : ''}
${unixTail(b, {
  ollamaInstall: `if ! command -v ollama >/dev/null 2>&1; then
  pkg install -y ollama || warn "ollama not in your repos — enable tur-repo first"
fi
(ollama serve >/dev/null 2>&1 &) || true`,
  services: null,
  closing: [
    '⚡ ${GREEN}T1NK3R-VER53 // TERMUX DEPLOYMENT COMPLETE${RESET}',
    '  ${AMBER}→ On-device inference is CPU-only: 0.5B–3B models realistically${RESET}',
    '  ${AMBER}→ Anything bigger: export OLLAMA_HOST=http://<lan-ip>:11434${RESET}',
    '  ${AMBER}→ Start sshd with: sshd   (then ssh -p 8022 from the desktop)${RESET}',
  ],
})}`;
}

// iPadOS has no shell that can install desktop software — the honest
// output here is a checklist, not a script that would never run.
function genIpados() {
  const js = collectJSItems('ipados'), cat = collectCatItems('ipados');
  const all = [...js, ...cat];
  if (!all.length) {
    return `# T1NK3R-VER53 // IPADOS SETUP GUIDE
# Nothing selected yet — tick items above, then generate again.`;
  }
  const appStore = all.filter(i => i.cmd.trim().startsWith('#'));
  const shell = all.filter(i => !i.cmd.trim().startsWith('#'));
  return `# ══════════════════════════════════════════════════════════════
# T1NK3R-VER53 // IPADOS SETUP GUIDE
# Generated by T1NK3R.TRIBOOT // NANITE GOD MODE
# iPadOS cannot run an installer script — this is a work order.
# ══════════════════════════════════════════════════════════════

## 1. INSTALL FROM THE APP STORE (${appStore.length} item${appStore.length === 1 ? '' : 's'})
${appStore.length ? appStore.map((i, n) => `  ${String(n + 1).padStart(2, ' ')}. ${i.name}\n      ${i.desc}\n      ${i.cmd.replace(/^#\s*/, '')}`).join('\n') : '  (none selected)'}

## 2. RUN INSIDE a-Shell / iSH (${shell.length} command${shell.length === 1 ? '' : 's'})
${shell.length ? shell.map(i => `  # ${i.name} — ${i.desc}\n  ${i.cmd}`).join('\n') : '  (none selected)'}

## 3. WIRE IT TO THE SOVEREIGN STACK
  # Companions run on the LAN box, never on the iPad.
  export OLLAMA_HOST=http://<lan-ip>:11434
  echo 'export OLLAMA_HOST=http://<lan-ip>:11434' >> ~/.profile

  # Reach the box from outside the LAN via Tailscale, then use its
  # tailnet name instead of <lan-ip>.

  # OpenRouter key (a-Shell):
  mkdir -p ~/.config/tinker-verse
  echo 'export OPENROUTER_API_KEY=sk-or-...' > ~/.config/tinker-verse/openrouter.env

## 4. KNOWN LIMITS (not bugs — App Store policy)
  - No local Ollama / llama.cpp server: inference is remote-only.
  - No Docker, no systemd, no background daemons.
  - a-Shell is sandboxed per-app; iSH is x86 emulation and slow.
  - Draw Things is the exception: it really does run diffusion on-device.`;
}

// ═══════════════════════════════════════════════════════════════
// COPY SCRIPT — uses the Tauri-aware clipboard helper already
// defined in tauri-bridge.js (falls back to navigator.clipboard
// automatically outside Tauri).
// ═══════════════════════════════════════════════════════════════
function copyScript(os) {
  // Tabs that produce a downloadable .sh copy the run command instead of the
  // whole script; win (.ps1) and ipados (a checklist) copy their text.
  const isShellScript = ['cachy','bazzite','fedora','ubuntu','arch','macos','android'].includes(os);
  const codeEl = document.getElementById(`code-${os}`);
  const text = isShellScript ? 'bash ~/Downloads/tinker_install.sh' : (codeEl ? codeEl.textContent : '');
  const doCopy = (typeof copyToClipboard === 'function') ? copyToClipboard(text) : navigator.clipboard.writeText(text);
  Promise.resolve(doCopy).then(()=>{
    const b = document.querySelector(`#out-${os} .copy-btn`);
    if (!b) return;
    const orig = isShellScript ? '[ COPY RUN COMMAND ]' : '[ COPY TO CLIPBOARD ]';
    b.textContent='[ COPIED! ]'; setTimeout(()=>b.textContent=orig,2000);
  });
}

// ═══════════════════════════════════════════════════════════════
// INIT — render every tab's JUMPSTART/grid (placeholder for the
// six OSes without data yet), then set the counter.
// ═══════════════════════════════════════════════════════════════
(typeof allTabs !== 'undefined' ? allTabs : ['win','cachy','bazzite']).forEach(os => {
  renderJS(os);
  buildGrid(os);
});
updateCount();
