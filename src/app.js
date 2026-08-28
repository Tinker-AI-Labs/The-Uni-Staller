// ═══════════════════════════════════════════════════════════════
// OS DETECTION
// ═══════════════════════════════════════════════════════════════
let detectedOS = 'unknown';
let detectedArch = 'unknown';

function detectArch() {
  // Try to detect architecture from navigator.userAgent or available APIs
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('arm64') || ua.includes('aarch64')) return 'aarch64';
  if (ua.includes('arm')) return 'arm';
  if (ua.includes('x86_64') || ua.includes('win64') || ua.includes('amd64')) return 'x86_64';
  const uaData = navigator.userAgentData;
  if (uaData && uaData.getHighEntropyValues) {
    uaData.getHighEntropyValues(['architecture']).then((hints) => {
      const a = (hints.architecture || '').toLowerCase();
      if (a.includes('arm') || a.includes('aarch64')) { detectedArch = 'aarch64'; renderArchBadge(); }
    }).catch(()=>{});
  }
  return 'x86_64';
}

function detectOS() {
  const ua = navigator.userAgent.toLowerCase();
  const plat = (navigator.platform||'').toLowerCase();
  detectedArch = detectArch();
  renderArchBadge();
  const hash = location.hash.replace('#','').toLowerCase();
  if (ua.includes('win') || plat.includes('win')) {
    detectedOS = 'win';
  } else if (ua.includes('mac')) {
    detectedOS = 'macos';
  } else if (ua.includes('ipad') || (plat.includes('mac') && navigator.maxTouchPoints > 1)) {
    detectedOS = 'ipados';
  } else if (ua.includes('android')) {
    detectedOS = 'android';
  } else if (ua.includes('linux')) {
    if (hash === 'cachy') detectedOS = 'cachy';
    else if (hash === 'bazzite') detectedOS = 'bazzite';
    else if (hash === 'fedora') detectedOS = 'fedora';
    else if (hash === 'ubuntu') detectedOS = 'ubuntu';
    else if (hash === 'arch') detectedOS = 'arch';
    else detectedOS = 'linux';
  } else {
    detectedOS = 'unknown';
  }
  renderDetect();
  // Auto-switch to the correct tab
  if (detectedOS === 'linux') switchTab('cachy');
  else if (detectedOS === 'cachy') switchTab('cachy');
  else if (detectedOS === 'bazzite') switchTab('bazzite');
  else if (detectedOS === 'fedora') switchTab('fedora');
  else if (detectedOS === 'ubuntu') switchTab('ubuntu');
  else if (detectedOS === 'arch') switchTab('arch');
  else if (detectedOS === 'macos') switchTab('macos');
  else if (detectedOS === 'ipados') switchTab('ipados');
  else if (detectedOS === 'android') switchTab('android');
  else switchTab('win');
}

function renderArchBadge() {
  const badge = document.getElementById('archBadge');
  if (!badge) return;
  const ARCH_LABELS = {aarch64:'AARCH64 / ARM64', arm:'ARM', x86_64:'x86_64', unknown:'DETECTING...'};
  if (detectedArch === 'aarch64' || detectedArch === 'arm') {
    badge.className='os-badge aarch64'; badge.textContent = ARCH_LABELS[detectedArch] || detectedArch;
  } else {
    badge.className='os-badge unknown'; badge.textContent = ARCH_LABELS[detectedArch] || detectedArch;
  }
}

function renderDetect() {
  const badge = document.getElementById('osBadge');
  const banner = document.getElementById('detectBanner');
  const OS_LABELS = {win:'TINY11 / WINDOWS', cachy:'CACHYOS', bazzite:'BAZZITE', fedora:'FEDORA', ubuntu:'UBUNTU/DEBIAN', arch:'ARCH', macos:'MACOS', ipados:'IPADOS', android:'ANDROID', linux:'LINUX'};

  function nativeBanner(osKey, color, msg, tip) {
    banner.className = `detect-banner ${osKey}`;
    banner.innerHTML = `<strong>✓ ${OS_LABELS[osKey]} detected.</strong> ${msg}<br>` + (tip || '');
  }

  if (detectedOS === 'win') {
    badge.className = 'os-badge win'; badge.textContent = 'TINY11 / WINDOWS';
    nativeBanner('win', 'var(--win)', 'Tiny11 tab is native — script will be a self-elevating PowerShell (.ps1). Other tabs are cross-OS.');
    setCrossWarnings('win');
  } else if (detectedOS === 'macos') {
    badge.className = 'os-badge macos'; badge.textContent = 'MACOS DETECTED';
    nativeBanner('macos', 'var(--macos)', 'macOS tab active — uses Homebrew. Other tabs are cross-OS.');
    setCrossWarnings('macos');
  } else if (detectedOS === 'ipados') {
    badge.className = 'os-badge ipados'; badge.textContent = 'IPADOS DETECTED';
    nativeBanner('ipados', 'var(--ipados)', 'iPadOS tab active — uses a-Shell or iSH. Many desktop apps unavailable.');
    setCrossWarnings('ipados');
  } else if (detectedOS === 'android') {
    badge.className = 'os-badge android'; badge.textContent = 'ANDROID DETECTED';
    nativeBanner('android', 'var(--android)', 'Android tab active — uses Termux. Ollama may need prooted env on older devices.');
    setCrossWarnings('android');
  } else if (detectedOS === 'fedora') {
    badge.className = 'os-badge fedora'; badge.textContent = 'FEDORA DETECTED';
    nativeBanner('fedora', 'var(--fedora)', 'Fedora tab active — uses dnf + Flatpak. Tiny11 tab generates a .ps1 to copy to Windows.',
      `<strong style="color:var(--amber)">⚠ Using fish shell?</strong> Run the script with <code>bash install.sh</code> — NOT <code>./install.sh</code>.<br><em>Tip: Add <code>#fedora</code> to your URL to auto-select this tab.</em>`);
    setCrossWarnings('linux');
  } else if (detectedOS === 'ubuntu') {
    badge.className = 'os-badge ubuntu'; badge.textContent = 'UBUNTU/DEBIAN DETECTED';
    nativeBanner('ubuntu', 'var(--ubuntu)', 'Ubuntu/Debian tab active — uses apt + Flatpak. Tiny11 tab generates a .ps1 to copy to Windows.',
      `<strong style="color:var(--amber)">⚠ Using fish shell?</strong> Run the script with <code>bash install.sh</code> — NOT <code>./install.sh</code>.<br><em>Tip: Add <code>#ubuntu</code> to your URL to auto-select this tab.</em>`);
    setCrossWarnings('linux');
  } else if (detectedOS === 'arch') {
    badge.className = 'os-badge arch'; badge.textContent = 'ARCH DETECTED';
    nativeBanner('arch', 'var(--arch)', 'Arch tab active — uses pacman/AUR + Flatpak. Tiny11 tab generates a .ps1 to copy to Windows.',
      `<strong style="color:var(--amber)">⚠ Using fish shell?</strong> Run the script with <code>bash install.sh</code> — NOT <code>./install.sh</code>.<br><em>Tip: Add <code>#arch</code> to your URL to auto-select this tab.</em>`);
    setCrossWarnings('linux');
  } else if (detectedOS === 'linux' || detectedOS === 'cachy' || detectedOS === 'bazzite') {
    const which = detectedOS === 'bazzite' ? 'BAZZITE' : 'CACHYOS';
    badge.className = `os-badge ${detectedOS === 'bazzite' ? 'bazzite' : 'cachy'}`; badge.textContent = 'LINUX DETECTED';
    nativeBanner(detectedOS === 'bazzite' ? 'bazzite' : 'cachy', detectedOS === 'bazzite' ? 'var(--bazzite)' : 'var(--cachy)',
      'CachyOS tab active — switch to your distro tab if needed. Tiny11 tab generates a .ps1 to copy to Windows.',
      `<strong style="color:var(--amber)">⚠ Using fish shell?</strong> Run the script with <code>bash install.sh</code> — NOT <code>./install.sh</code>. Fish can't execute bash scripts directly.<br><em>Tip: Add <code>#${detectedOS}</code> to your URL to auto-select this tab.</em>`);
    setCrossWarnings('linux');
  } else {
    badge.className = 'os-badge unknown'; badge.textContent = 'UNKNOWN';
    banner.className = 'detect-banner unknown';
    banner.innerHTML = '<strong>⚠ OS not detected.</strong> Select your target OS tab. All scripts generate correctly regardless — just copy to the right machine.<br><em>Tips: Add #osname to lock in a tab. Scripts are cross-platform safe.</em>';
    setCrossWarnings('unknown');
  }
}

function setCrossWarnings(os) {
  // Show cross-OS warnings on non-native tabs
  const allTabIds = ['win','cachy','bazzite','fedora','ubuntu','arch','macos','ipados','android'];
  const nativeMap = {win:'win', cachy:'linux', bazzite:'linux', fedora:'linux', ubuntu:'linux', arch:'linux', macos:'macos', ipados:'ipados', android:'android', linux:'linux'};
  allTabIds.forEach(t => {
    const xbanner = document.getElementById(`xbanner-${t}`);
    const cwarn = document.getElementById(`cwarn-${t}`);
    let isCross = false;
    if (os === 'unknown') isCross = false;
    else if (os === 'linux' && t === 'win') isCross = true;
    else if (os !== nativeMap[t] && t !== 'win') isCross = true;
    else if (os === 'win' && t !== 'win') isCross = true;
    if (xbanner) xbanner.style.display = isCross ? 'block' : 'none';
    if (cwarn) cwarn.textContent = isCross ? '⚠' : '';
  });
}

// ═══════════════════════════════════════════════════════════════
// DATA — JUMPSTART ITEMS PER OS
// ═══════════════════════════════════════════════════════════════

// availability: 'all' | 'win' | 'linux' | OS-specific
// fallback: for win-only items on linux, show AppImage or alt
const JUMPSTART = {
  win: [
    {id:'w_policy',  name:'Execution Policy + Self-Elevate', desc:'Must run first on fresh Tiny11. Unlocks PS scripts.', tier:'sys',
     cmd:'Set-ExecutionPolicy RemoteSigned -Force; if(!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]"Administrator")) { Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs; exit }'},
    {id:'w_winget',  name:'Winget Bootstrap', desc:'Ensure winget is installed (App Installer MSIX)', tier:'sys',
     cmd:'# Auto-handled in bootstrap script header'},
    {id:'w_choco',   name:'Chocolatey Package Manager', desc:'Fallback package manager for tools not in winget', tier:'sys',
     cmd:'Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol=[System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString(\'https://community.chocolatey.org/install.ps1\'))'},
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
    {id:'w_alfred',  name:'Alfred → mistral:latest', desc:'Primary companion — always warm', tier:'ai',
     cmd:'ollama pull mistral:latest'},
    {id:'w_steward', name:'Steward → phi3:latest', desc:'Safety watchdog — always warm', tier:'ai',
     cmd:'ollama pull phi3:latest'},
    {id:'w_scout',   name:'Scout → phi3:mini', desc:'Field recon — always warm', tier:'ai',
     cmd:'ollama pull phi3:mini'},
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
    {id:'c_yazi',    name:'Yazi File Manager', desc:'Iron Works themed terminal file manager (install via snap)', tier:'dev',
     cmd:'snap install yazi'},
    {id:'c_alfred',  name:'Alfred → mistral:latest', desc:'Primary companion — always warm', tier:'ai',
     cmd:'ollama pull mistral:latest'},
    {id:'c_steward', name:'Steward → phi3:latest', desc:'Safety watchdog — always warm', tier:'ai',
     cmd:'ollama pull phi3:latest'},
    {id:'c_scout',   name:'Scout → phi3:mini', desc:'Field recon — always warm', tier:'ai',
     cmd:'ollama pull phi3:mini'},
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
    {id:'b_alfred',  name:'Alfred → mistral:latest', desc:'Primary companion — always warm', tier:'ai',
     cmd:'ollama pull mistral:latest'},
    {id:'b_steward', name:'Steward → phi3:latest', desc:'Safety watchdog', tier:'ai',
     cmd:'ollama pull phi3:latest'},
    {id:'b_scout',   name:'Scout → phi3:mini', desc:'Field recon — always warm', tier:'ai',
     cmd:'ollama pull phi3:mini'},
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
    {id:'f_update',   name:'DNF System Update', desc:'Full system update before anything else. Essential on fresh Fedora.', tier:'sys',
     cmd:'sudo dnf upgrade -y --refresh'},
    {id:'f_rpmfusion',name:'RPM Fusion (free + nonfree)', desc:'Essential third-party repos — codecs, drivers, extras.', tier:'sys',
     cmd:'sudo dnf install -y https://download1.rpmfusion.org/free/fedora/rpmfusion-free-release-$(rpm -E %fedora).noarch.rpm https://download1.rpmfusion.org/nonfree/fedora/rpmfusion-nonfree-release-$(rpm -E %fedora).noarch.rpm'},
    {id:'f_flatpak',  name:'Flatpak + Flathub', desc:'Flatpak is built-in on Fedora — just enable Flathub remote.', tier:'sys',
     cmd:'flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo'},
    {id:'f_dev',      name:'Development tools', desc:'gcc, make, git — base-devel equivalent for Fedora', tier:'sys',
     cmd:'sudo dnf groupinstall -y "Development Tools" && sudo dnf install -y git curl wget'},
    {id:'f_nvm',      name:'Node.js via nvm', desc:'nvm → Node LTS. Required for Claude Code, Gemini CLI.', tier:'dev',
     cmd:'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash && source ~/.bashrc && nvm install --lts'},
    {id:'f_rust',     name:'Rust + Cargo', desc:'Required for RTK, Yazi, Bevy', tier:'dev',
     cmd:'curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y && source $HOME/.cargo/env'},
    {id:'f_pipx',     name:'pipx', desc:'Isolated Python tool installs', tier:'dev',
     cmd:'sudo dnf install -y pipx && pipx ensurepath'},
    {id:'f_ollama',   name:'Ollama 0.17.1+', desc:'Local LLM runner — CVE-2026-7482 patched', tier:'core',
     cmd:'curl -fsSL https://ollama.com/install.sh | sh && sudo systemctl enable --now ollama'},
    {id:'f_docker',   name:'Docker CE', desc:'Container engine', tier:'core',
     cmd:'sudo dnf install -y dnf-plugins-core && sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo && sudo dnf install -y docker-ce docker-ce-cli containerd.io && sudo systemctl enable --now docker && sudo usermod -aG docker $USER'},
    {id:'f_claude',   name:'Claude Code (Hermes)', desc:'Agentic coding CLI', tier:'ai',
     cmd:'npm install -g @anthropic-ai/claude-code'},
    {id:'f_gemini',   name:'Gemini CLI', desc:'Google Gemini CLI — codegen layer', tier:'ai',
     cmd:'npm install -g @google/gemini-cli'},
    {id:'f_rtk',      name:'RTK', desc:'Token compression for Claude Code', tier:'dev',
     cmd:'cargo install rtk && rtk init -g'},
    {id:'f_alfred',   name:'Alfred → mistral:latest', desc:'Primary companion — always warm', tier:'ai',
     cmd:'ollama pull mistral:latest'},
    {id:'f_steward',  name:'Steward → phi3:latest', desc:'Safety watchdog — always warm', tier:'ai',
     cmd:'ollama pull phi3:latest'},
    {id:'f_scout',    name:'Scout → phi3:mini', desc:'Field recon — always warm', tier:'ai',
     cmd:'ollama pull phi3:mini'},
    {id:'f_embed',    name:'nomic-embed-text', desc:'RAG embeddings', tier:'ai',
     cmd:'ollama pull nomic-embed-text'},
    {id:'f_rocm',     name:'ROCm (RX 6600)', desc:'AMD GPU compute — RDNA2 — Fedora path', tier:'sys',
     cmd:'sudo dnf install -y rocm-opencl rocm-hip && echo "export HSA_OVERRIDE_GFX_VERSION=10.3.0" >> ~/.bashrc'},
    {id:'f_pw',       name:'PipeWire Full Stack', desc:'Audio engine — pre-installed on Fedora, ensure extras', tier:'sys',
     cmd:'sudo dnf install -y pipewire pipewire-jack-audio-connection-kit pipewire-alsa wireplumber realtime-setup && sudo usermod -aG realtime $USER'},
  ],
  ubuntu: [
    {id:'u_update',  name:'apt update + upgrade', desc:'Full system update before anything else.', tier:'sys',
     cmd:'sudo apt update -y && sudo apt upgrade -y'},
    {id:'u_build',   name:'build-essential + git + curl + wget', desc:'Base dev tools — needed for everything.', tier:'sys',
     cmd:'sudo apt install -y build-essential git curl wget'},
    {id:'u_flatpak', name:'Flatpak + Flathub', desc:'Flatpak runtime + Flathub remote.', tier:'sys',
     cmd:'sudo apt install -y flatpak && flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo'},
    {id:'u_nvm',     name:'Node.js via nvm', desc:'nvm → Node LTS. Required for Claude Code, Gemini CLI.', tier:'dev',
     cmd:'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash && source ~/.bashrc && nvm install --lts'},
    {id:'u_rust',    name:'Rust + Cargo', desc:'Systems lang — RTK, Yazi, Bevy', tier:'dev',
     cmd:'curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y && source $HOME/.cargo/env'},
    {id:'u_pipx',    name:'pipx', desc:'Isolated Python tool installs', tier:'dev',
     cmd:'sudo apt install -y pipx && pipx ensurepath'},
    {id:'u_ollama',  name:'Ollama 0.17.1+', desc:'Local LLM runner — CVE-2026-7482 patched', tier:'core',
     cmd:'curl -fsSL https://ollama.com/install.sh | sh && sudo systemctl enable --now ollama'},
    {id:'u_docker',  name:'Docker CE', desc:'Container engine', tier:'core',
     cmd:'curl -fsSL https://get.docker.com | sh && sudo usermod -aG docker $USER && sudo systemctl enable --now docker'},
    {id:'u_claude',  name:'Claude Code (Hermes)', desc:'Agentic coding CLI', tier:'ai',
     cmd:'npm install -g @anthropic-ai/claude-code'},
    {id:'u_gemini',  name:'Gemini CLI', desc:'Google Gemini CLI — codegen layer', tier:'ai',
     cmd:'npm install -g @google/gemini-cli'},
    {id:'u_alfred',  name:'Alfred → mistral:latest', desc:'Primary companion — always warm', tier:'ai',
     cmd:'ollama pull mistral:latest'},
    {id:'u_steward', name:'Steward → phi3:latest', desc:'Safety watchdog — always warm', tier:'ai',
     cmd:'ollama pull phi3:latest'},
    {id:'u_scout',   name:'Scout → phi3:mini', desc:'Field recon — always warm', tier:'ai',
     cmd:'ollama pull phi3:mini'},
    {id:'u_embed',   name:'nomic-embed-text', desc:'RAG embeddings', tier:'ai',
     cmd:'ollama pull nomic-embed-text'},
  ],
  arch: [
    {id:'a_base',    name:'base-devel + git', desc:'Must be first. Needed to build yay and AUR packages.', tier:'sys',
     cmd:'sudo pacman -S --needed --noconfirm base-devel git'},
    {id:'a_yay',     name:'yay (AUR helper)', desc:'Bootstrap yay if no AUR helper present. Auto-detected.', tier:'sys',
     cmd:'# Auto-bootstrapped in script'},
    {id:'a_flatpak', name:'Flatpak + Flathub', desc:'App runtime — many GUI tools come via Flatpak', tier:'sys',
     cmd:'sudo pacman -S --needed --noconfirm flatpak && flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo'},
    {id:'a_nvm',     name:'Node.js via nvm', desc:'nvm → Node LTS. Required for Claude Code, Gemini CLI.', tier:'dev',
     cmd:'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash && source ~/.bashrc && nvm install --lts'},
    {id:'a_rust',    name:'Rust + Cargo', desc:'Required for RTK, Yazi, Bevy', tier:'dev',
     cmd:'curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y && source $HOME/.cargo/env'},
    {id:'a_pipx',    name:'pipx', desc:'Isolated Python tool installs — avoids system pip conflicts', tier:'dev',
     cmd:'sudo pacman -S --needed --noconfirm python-pipx && pipx ensurepath'},
    {id:'a_ollama',  name:'Ollama 0.17.1+', desc:'Local LLM runner — CVE-2026-7482 patched', tier:'core',
     cmd:'sudo pacman -S --needed --noconfirm ollama && sudo systemctl enable --now ollama'},
    {id:'a_docker',  name:'Docker CE', desc:'Container engine', tier:'core',
     cmd:'sudo pacman -S --needed --noconfirm docker docker-compose && sudo systemctl enable --now docker && sudo usermod -aG docker $USER'},
    {id:'a_claude',  name:'Claude Code (Hermes)', desc:'Agentic coding CLI', tier:'ai',
     cmd:'npm install -g @anthropic-ai/claude-code'},
    {id:'a_gemini',  name:'Gemini CLI', desc:'Google Gemini CLI — codegen layer', tier:'ai',
     cmd:'npm install -g @google/gemini-cli'},
    {id:'a_alfred',  name:'Alfred → mistral:latest', desc:'Primary companion — always warm', tier:'ai',
     cmd:'ollama pull mistral:latest'},
    {id:'a_steward', name:'Steward → phi3:latest', desc:'Safety watchdog — always warm', tier:'ai',
     cmd:'ollama pull phi3:latest'},
    {id:'a_scout',   name:'Scout → phi3:mini', desc:'Field recon — always warm', tier:'ai',
     cmd:'ollama pull phi3:mini'},
    {id:'a_embed',   name:'nomic-embed-text', desc:'RAG embeddings', tier:'ai',
     cmd:'ollama pull nomic-embed-text'},
  ],
  macos: [
    {id:'m_brew',    name:'Homebrew', desc:'The missing package manager for macOS', tier:'sys',
     cmd:'/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'},
    {id:'m_nvm',     name:'Node.js via nvm', desc:'nvm → Node LTS. Required for Claude Code, Gemini CLI.', tier:'dev',
     cmd:'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash && source ~/.zshrc && nvm install --lts'},
    {id:'m_rust',    name:'Rust + Cargo', desc:'Required for RTK, Yazi, Bevy', tier:'dev',
     cmd:'curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y && source $HOME/.cargo/env'},
    {id:'m_pipx',    name:'pipx', desc:'Isolated Python tool installs', tier:'dev',
     cmd:'brew install pipx && pipx ensurepath'},
    {id:'m_ollama',  name:'Ollama 0.17.1+', desc:'Local LLM runner — Apple Silicon optimized', tier:'core',
     cmd:'brew install ollama && brew services start ollama'},
    {id:'m_docker',  name:'Docker Desktop', desc:'Container engine', tier:'core',
     cmd:'brew install --cask docker'},
    {id:'m_claude',  name:'Claude Code (Hermes)', desc:'Agentic coding CLI', tier:'ai',
     cmd:'npm install -g @anthropic-ai/claude-code'},
    {id:'m_gemini',  name:'Gemini CLI', desc:'Google Gemini CLI — codegen layer', tier:'ai',
     cmd:'npm install -g @google/gemini-cli'},
    {id:'m_alfred',  name:'Alfred → mistral:latest', desc:'Primary companion — always warm', tier:'ai',
     cmd:'ollama pull mistral:latest'},
    {id:'m_steward', name:'Steward → phi3:latest', desc:'Safety watchdog — always warm', tier:'ai',
     cmd:'ollama pull phi3:latest'},
    {id:'m_scout',   name:'Scout → phi3:mini', desc:'Field recon — always warm', tier:'ai',
     cmd:'ollama pull phi3:mini'},
    {id:'m_embed',   name:'nomic-embed-text', desc:'RAG embeddings', tier:'ai',
     cmd:'ollama pull nomic-embed-text'},
  ],
  ipados: [
    {id:'i_ashell',  name:'a-Shell (App Store)', desc:'Full Unix shell with Python, Lua, C, Vim', tier:'sys',
     cmd:'# Install from App Store: a-Shell by Nicolas Holzschuch'},
    {id:'i_ish',     name:'iSH (App Store)', desc:'Alpine Linux shell on iPad', tier:'sys',
     cmd:'# Install from App Store: iSH'},
    {id:'i_workingcopy', name:'Working Copy', desc:'Git client for iOS', tier:'dev',
     cmd:'# Install from App Store: Working Copy'},
    {id:'i_textastic', name:'Textastic', desc:'Code editor for iOS', tier:'dev',
     cmd:'# Install from App Store: Textastic'},
    {id:'i_ollama',  name:'Ollama (remote)', desc:'Connect to Ollama on LAN', tier:'core',
     cmd:'# In a-Shell: curl http://<ollama-host>:11434/api/tags'},
    {id:'i_shortcuts', name:'Siri Shortcuts', desc:'Automation + Alfred voice trigger', tier:'sys',
     cmd:'# Build Shortcuts to call a-Shell commands'},
  ],
  android: [
    {id:'d_termux',  name:'Termux (F-Droid)', desc:'Linux environment for Android — do NOT use Play Store', tier:'sys',
     cmd:'# Install from F-Droid: com.termux'},
    {id:'d_fdroid',  name:'F-Droid', desc:'FOSS app repository', tier:'sys',
     cmd:'# Install from f-droid.org'},
    {id:'d_pkg',     name:'Termux pkg update', desc:'Update Termux packages', tier:'sys',
     cmd:'pkg update -y && pkg upgrade -y'},
    {id:'d_git',     name:'Git', desc:'Version control in Termux', tier:'dev',
     cmd:'pkg install -y git'},
    {id:'d_node',    name:'Node.js', desc:'Required for CLI AI tools', tier:'dev',
     cmd:'pkg install -y nodejs-lts'},
    {id:'d_python',  name:'Python', desc:'Python runtime in Termux', tier:'dev',
     cmd:'pkg install -y python'},
    {id:'d_rust',    name:'Rust', desc:'Systems lang in Termux', tier:'dev',
     cmd:'pkg install -y rust'},
    {id:'d_ollama',  name:'Ollama (Termux)', desc:'Local LLM — aarch64 only, experimental', tier:'core',
     cmd:'# Experimental: pkg install ollama or build from source'},
    {id:'d_claude',  name:'Claude Code (Hermes)', desc:'Agentic coding CLI — may need proot', tier:'ai',
     cmd:'npm install -g @anthropic-ai/claude-code'},
    {id:'d_alfred',  name:'Alfred → mistral:latest', desc:'Primary companion', tier:'ai',
     cmd:'ollama pull mistral:latest'},
    {id:'d_steward', name:'Steward → phi3:latest', desc:'Safety watchdog', tier:'ai',
     cmd:'ollama pull phi3:latest'},
    {id:'d_scout',   name:'Scout → phi3:mini', desc:'Field recon', tier:'ai',
     cmd:'ollama pull phi3:mini'},
  ],
};

// ═══════════════════════════════════════════════════════════════
// DATA — CATEGORIES PER OS
// ═══════════════════════════════════════════════════════════════
// Each item has: name, desc, cmd, type, avail ('all'|'win'|'linux'), fallback (optional)
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
        {name:'Alfred — mistral:latest', desc:'Primary orchestrator — always warm', cmd:'ollama pull mistral:latest', type:'winget'},
        {name:'Steward — phi3:latest', desc:'Safety watchdog — always warm', cmd:'ollama pull phi3:latest', type:'winget'},
        {name:'Scout — phi3:mini', desc:'Field recon — always warm', cmd:'ollama pull phi3:mini', type:'winget'},
        {name:'Daisy — llama3.2:1b', desc:'Safe Space support', cmd:'ollama pull llama3.2:1b', type:'winget'},
        {name:'Coach — llama3.2:3b', desc:'Motivation', cmd:'ollama pull llama3.2:3b', type:'winget'},
        {name:'Spark — qwen2.5:3b', desc:'Inspiration engine', cmd:'ollama pull qwen2.5:3b', type:'winget'},
        {name:'Solace — llama3.2', desc:'Deep creative voice', cmd:'ollama pull llama3.2:latest', type:'winget'},
        {name:'Sage — mistral:latest', desc:'Knowledge layer', cmd:'ollama pull mistral:latest', type:'winget'},
        {name:'Luna — llama3.2', desc:'P.A.W.S. / living systems', cmd:'ollama pull llama3.2:latest', type:'winget'},
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
        {name:'Alfred — mistral:latest', desc:'Always warm', cmd:'ollama pull mistral:latest', type:'ollama'},
        {name:'Steward — phi3:latest', desc:'Always warm', cmd:'ollama pull phi3:latest', type:'ollama'},
        {name:'Scout — phi3:mini', desc:'Always warm', cmd:'ollama pull phi3:mini', type:'ollama'},
        {name:'Daisy — llama3.2:1b', desc:'Safe Space support', cmd:'ollama pull llama3.2:1b', type:'ollama'},
        {name:'Coach — llama3.2:3b', desc:'Motivation', cmd:'ollama pull llama3.2:3b', type:'ollama'},
        {name:'Spark — qwen2.5:3b', desc:'Inspiration engine', cmd:'ollama pull qwen2.5:3b', type:'ollama'},
        {name:'Solace — llama3.2', desc:'Deep creative voice', cmd:'ollama pull llama3.2:latest', type:'ollama'},
        {name:'Sage — mistral', desc:'Knowledge layer', cmd:'ollama pull mistral:latest', type:'ollama'},
        {name:'Luna — llama3.2', desc:'P.A.W.S. / living systems', cmd:'ollama pull llama3.2:latest', type:'ollama'},
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
        {name:'Alfred — mistral:latest', desc:'Always warm', cmd:'ollama pull mistral:latest', type:'ollama'},
        {name:'Steward — phi3:latest', desc:'Always warm', cmd:'ollama pull phi3:latest', type:'ollama'},
        {name:'Scout — phi3:mini', desc:'Always warm', cmd:'ollama pull phi3:mini', type:'ollama'},
        {name:'Daisy — llama3.2:1b', desc:'Safe Space support', cmd:'ollama pull llama3.2:1b', type:'ollama'},
        {name:'Coach — llama3.2:3b', desc:'Motivation', cmd:'ollama pull llama3.2:3b', type:'ollama'},
        {name:'Spark — qwen2.5:3b', desc:'Inspiration engine', cmd:'ollama pull qwen2.5:3b', type:'ollama'},
        {name:'Solace — llama3.2', desc:'Deep creative voice', cmd:'ollama pull llama3.2:latest', type:'ollama'},
        {name:'Sage — mistral', desc:'Knowledge layer', cmd:'ollama pull mistral:latest', type:'ollama'},
        {name:'Luna — llama3.2', desc:'P.A.W.S. / living systems', cmd:'ollama pull llama3.2:latest', type:'ollama'},
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
    { id:'f-dev', icon:'💻', title:'DEVELOPMENT',
      items:[
        {name:'Git + curl + wget', desc:'Version control + download tools', cmd:'sudo dnf install -y git curl wget', type:'dnf'},
        {name:'GitHub CLI', desc:'GitHub from terminal — kalifurd', cmd:'sudo dnf install -y gh', type:'dnf'},
        {name:'VS Code', desc:'Primary editor (via Flatpak)', cmd:'flatpak install -y flathub com.visualstudio.code', type:'flatpak'},
        {name:'Node.js LTS via nvm', desc:'Required for Claude Code, Gemini CLI', cmd:'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash && source ~/.bashrc && nvm install --lts', type:'manual'},
        {name:'Python 3 + pip', desc:'Python runtime (pre-installed on Fedora)', cmd:'sudo dnf install -y python3 python3-pip python3-pipx && pipx ensurepath', type:'dnf'},
        {name:'Rust + Cargo', desc:'Systems lang — RTK, Yazi, Bevy', cmd:'curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y && source $HOME/.cargo/env', type:'manual'},
        {name:'Go', desc:'Google systems language', cmd:'sudo dnf install -y golang', type:'dnf'},
        {name:'Neovim', desc:'Hyperextensible Vim fork', cmd:'sudo dnf install -y neovim', type:'dnf'},
        {name:'tmux', desc:'Terminal multiplexer', cmd:'sudo dnf install -y tmux', type:'dnf'},
        {name:'bat / fd / ripgrep / fzf', desc:'Modern CLI replacements', cmd:'sudo dnf install -y bat fd-find ripgrep fzf', type:'dnf'},
        {name:'Kitty Terminal', desc:'GPU-accelerated terminal', cmd:'sudo dnf install -y kitty', type:'dnf'},
        {name:'Timeshift', desc:'System snapshots', cmd:'sudo dnf install -y timeshift', type:'dnf'},
        {name:'Wireshark', desc:'Network analyzer', cmd:'sudo dnf install -y wireshark', type:'dnf'},
      ]},
    { id:'f-cliai', icon:'🖥️', title:'CLI AI TOOLS',
      items:[
        {name:'Claude Code (Hermes)', desc:'Primary agentic coding CLI', cmd:'npm install -g @anthropic-ai/claude-code', type:'npm'},
        {name:'Gemini CLI', desc:'Google Gemini CLI — codegen layer', cmd:'npm install -g @google/gemini-cli', type:'npm'},
        {name:'OpenAI Codex CLI', desc:'OpenAI Codex via OpenRouter', cmd:'npm install -g @openai/codex', type:'npm'},
        {name:'OpenCode', desc:'Open-source multi-provider AI CLI', cmd:'npm install -g opencode-ai', type:'npm'},
        {name:'Aider', desc:'AI pair programmer — git-aware', cmd:'pipx install aider-chat', type:'pip'},
        {name:'Shell-GPT', desc:'LLM in terminal', cmd:'pipx install shell-gpt', type:'pip'},
        {name:'LLM (Simon Willison)', desc:'Universal LLM CLI', cmd:'pipx install llm', type:'pip'},
        {name:'RTK', desc:'Token compression for Claude Code', cmd:'cargo install rtk && rtk init -g', type:'cargo'},
        {name:'Yazi File Manager', desc:'Terminal file manager', cmd:'cargo install yazi-fm', type:'cargo'},
      ]},
    { id:'f-sovereign', icon:'🛡️', title:'SOVEREIGN STACK',
      items:[
        {name:'Ollama 0.17.1+', desc:'Local LLM runner — CVE patched', cmd:'curl -fsSL https://ollama.com/install.sh | sh && sudo systemctl enable --now ollama', type:'manual'},
        {name:'Docker CE', desc:'Container engine', cmd:'sudo dnf install -y dnf-plugins-core && sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo && sudo dnf install -y docker-ce docker-ce-cli containerd.io && sudo systemctl enable --now docker && sudo usermod -aG docker $USER', type:'manual'},
        {name:'Open WebUI', desc:'Browser UI for Ollama — after Docker', cmd:'docker run -d -p 3000:8080 --add-host=host.docker.internal:host-gateway -v open-webui:/app/backend/data --name open-webui --restart always ghcr.io/open-webui/open-webui:main', type:'manual'},
        {name:'LocalSend', desc:'Sovereign LAN file transfer', cmd:'flatpak install -y flathub org.localsend.localsend_app', type:'flatpak'},
        {name:'KeePassXC', desc:'Offline password manager', cmd:'sudo dnf install -y keepassxc', type:'dnf'},
        {name:'Tailscale', desc:'Mesh VPN', cmd:'sudo dnf install -y tailscale && sudo systemctl enable --now tailscaled', type:'dnf'},
      ]},
    { id:'f-companions', icon:'🤝', title:'COMPANION MODELS',
      items:[
        {name:'Alfred — mistral:latest', desc:'Always warm', cmd:'ollama pull mistral:latest', type:'ollama'},
        {name:'Steward — phi3:latest', desc:'Always warm', cmd:'ollama pull phi3:latest', type:'ollama'},
        {name:'Scout — phi3:mini', desc:'Always warm', cmd:'ollama pull phi3:mini', type:'ollama'},
        {name:'Daisy — llama3.2:1b', desc:'Safe Space support', cmd:'ollama pull llama3.2:1b', type:'ollama'},
        {name:'Coach — llama3.2:3b', desc:'Motivation', cmd:'ollama pull llama3.2:3b', type:'ollama'},
        {name:'Spark — qwen2.5:3b', desc:'Inspiration engine', cmd:'ollama pull qwen2.5:3b', type:'ollama'},
        {name:'Solace — llama3.2', desc:'Deep creative voice', cmd:'ollama pull llama3.2:latest', type:'ollama'},
        {name:'Sage — mistral', desc:'Knowledge layer', cmd:'ollama pull mistral:latest', type:'ollama'},
        {name:'Luna — llama3.2', desc:'P.A.W.S. / living systems', cmd:'ollama pull llama3.2:latest', type:'ollama'},
        {name:'nomic-embed-text', desc:'RAG embeddings', cmd:'ollama pull nomic-embed-text', type:'ollama'},
      ]},
    { id:'f-audio', icon:'🔊', title:'AUDIO CORE / PIPEWIRE',
      items:[
        {name:'PipeWire extras', desc:'PipeWire is pre-installed on Fedora — install JACK + ALSA compat', cmd:'sudo dnf install -y pipewire-jack-audio-connection-kit pipewire-alsa wireplumber', type:'dnf'},
        {name:'qpwgraph', desc:'PipeWire visual patchbay', cmd:'sudo dnf install -y qpwgraph', type:'dnf'},
        {name:'Carla Plugin Host', desc:'VST/LV2 host', cmd:'sudo dnf install -y carla', type:'dnf'},
        {name:'EasyEffects', desc:'System audio effects — EQ/compression', cmd:'flatpak install -y flathub com.github.wwmm.easyeffects', type:'flatpak'},
        {name:'realtime-setup', desc:'Low-latency audio scheduling', cmd:'sudo dnf install -y realtime-setup && sudo usermod -aG realtime $USER', type:'dnf'},
        {name:'ALSA Utils', desc:'alsamixer, aplay, arecord', cmd:'sudo dnf install -y alsa-utils', type:'dnf'},
        {name:'Sonobus', desc:'P2P audio streaming', cmd:'flatpak install -y flathub net.sonobus.SonoBus', type:'flatpak'},
      ]},
    { id:'f-daw', icon:'🎚️', title:'DAWs',
      items:[
        {name:'Ardour 8', desc:'Pro Linux DAW', cmd:'sudo dnf install -y ardour8', type:'dnf'},
        {name:'LMMS', desc:'Beat/melody production', cmd:'flatpak install -y flathub io.lmms.LMMS', type:'flatpak'},
        {name:'Zrythm', desc:'Modern FOSS DAW', cmd:'flatpak install -y flathub org.zrythm.Zrythm', type:'flatpak'},
        {name:'Mixxx', desc:'DJ software — T1NK3R.FM', cmd:'sudo dnf install -y mixxx', type:'dnf'},
        {name:'Audacity', desc:'Audio editor', cmd:'flatpak install -y flathub org.audacityteam.Audacity', type:'flatpak'},
        {name:'Reaper', desc:'Lightweight pro DAW — WINE or native', cmd:'# Download installer: reaper.fm/download.php', type:'manual'},
      ]},
    { id:'f-gaming', icon:'🎮', title:'GAMING',
      items:[
        {name:'Steam', desc:'PC gaming — Proton built-in', cmd:'sudo dnf install -y steam', type:'dnf'},
        {name:'Heroic Launcher', desc:'Epic / GOG / Amazon', cmd:'flatpak install -y flathub com.heroicgameslauncher.hgl', type:'flatpak'},
        {name:'Lutris', desc:'Unified game manager', cmd:'sudo dnf install -y lutris', type:'dnf'},
        {name:'Bottles', desc:'Wine bottle manager', cmd:'flatpak install -y flathub com.usebottles.bottles', type:'flatpak'},
        {name:'Wine', desc:'Windows compat layer', cmd:'sudo dnf install -y wine winetricks', type:'dnf'},
        {name:'MangoHud', desc:'In-game performance overlay', cmd:'sudo dnf install -y mangohud', type:'dnf'},
        {name:'GameMode', desc:'CPU/GPU governor daemon', cmd:'sudo dnf install -y gamemode', type:'dnf'},
        {name:'ProtonUp-Qt', desc:'Manage Proton-GE builds', cmd:'flatpak install -y flathub net.davidotek.pupgui2', type:'flatpak'},
        {name:'RetroArch', desc:'Multi-system emulator frontend', cmd:'flatpak install -y flathub org.libretro.RetroArch', type:'flatpak'},
        {name:'RPCS3 (PS3)', desc:'PlayStation 3 emulator', cmd:'flatpak install -y flathub net.rpcs3.RPCS3', type:'flatpak'},
        {name:'PCSX2 (PS2)', desc:'PlayStation 2 emulator', cmd:'flatpak install -y flathub net.pcsx2.PCSX2', type:'flatpak'},
        {name:'Dolphin (GC/Wii)', desc:'Nintendo GameCube/Wii emulator', cmd:'flatpak install -y flathub org.DolphinEmu.dolphin-emu', type:'flatpak'},
        {name:'DuckStation (PS1)', desc:'Best PS1 emulator', cmd:'flatpak install -y flathub org.duckstation.DuckStation', type:'flatpak'},
      ]},
    { id:'f-rocm', icon:'🔴', title:'ROCm / AMD GPU (RX 6600)',
      items:[
        {name:'ROCm Core', desc:'AMD GPU compute stack via RPM Fusion / copr', cmd:'sudo dnf install -y rocm-opencl rocm-hip rocminfo', type:'dnf'},
        {name:'HSA Override (RX 6600)', desc:'RDNA2 GFX version fix', cmd:'echo "export HSA_OVERRIDE_GFX_VERSION=10.3.0" >> ~/.bashrc && source ~/.bashrc', type:'manual'},
        {name:'clinfo', desc:'OpenCL info', cmd:'sudo dnf install -y clinfo', type:'dnf'},
      ]},
    { id:'f-art', icon:'🎨', title:'ART / VIDEO',
      items:[
        {name:'Blender', desc:'3D modeling — VIGA/Modly', cmd:'flatpak install -y flathub org.blender.Blender', type:'flatpak'},
        {name:'Krita', desc:'Digital painting', cmd:'sudo dnf install -y krita', type:'dnf'},
        {name:'GIMP', desc:'Image editor', cmd:'sudo dnf install -y gimp', type:'dnf'},
        {name:'Inkscape', desc:'Vector graphics', cmd:'sudo dnf install -y inkscape', type:'dnf'},
        {name:'OBS Studio', desc:'Streaming & recording', cmd:'sudo dnf install -y obs-studio', type:'dnf'},
        {name:'Kdenlive', desc:'NLE video editor', cmd:'flatpak install -y flathub org.kde.kdenlive', type:'flatpak'},
        {name:'FFmpeg', desc:'CLI multimedia toolkit (via RPM Fusion)', cmd:'sudo dnf install -y ffmpeg', type:'dnf'},
        {name:'OrcaSlicer', desc:'Bambu P1S slicer', cmd:'flatpak install -y flathub com.softfever.OrcaSlicer', type:'flatpak'},
      ]},
    { id:'f-homelab', icon:'🏠', title:'HOMELAB / SELF-HOSTED',
      items:[
        {name:'Portainer', desc:'Docker web UI', cmd:'docker run -d -p 9000:9000 --name portainer --restart always -v /var/run/docker.sock:/var/run/docker.sock portainer/portainer-ce', type:'manual'},
        {name:'Jellyfin', desc:'Local media server — T1NK3R.TV', cmd:'flatpak install -y flathub com.github.iwalton3.jellyfin-media-player', type:'flatpak'},
        {name:'Kiwix Desktop', desc:'Offline Wikipedia/ZIM', cmd:'flatpak install -y flathub org.kiwix.desktop', type:'flatpak'},
        {name:'Cockpit', desc:'Web-based server management', cmd:'sudo dnf install -y cockpit && sudo systemctl enable --now cockpit.socket', type:'dnf'},
      ]},
    { id:'f-engines', icon:'🕹️', title:'GAME ENGINES / 3D',
      items:[
        {name:'Godot 4 (Flatpak)', desc:'T1NK3R Games — TinkerP4int, all 12 titles', cmd:'flatpak install -y flathub org.godotengine.Godot', type:'flatpak'},
        {name:'Bevy Engine (Rust)', desc:'ECS game engine — T1NK3R Rust games', cmd:'cargo install bevy', type:'cargo'},
        {name:'KiCad', desc:'PCB & schematic EDA', cmd:'sudo dnf install -y kicad', type:'dnf'},
        {name:'FreeCAD', desc:'Parametric 3D CAD', cmd:'sudo dnf install -y freecad', type:'dnf'},
        {name:'OpenSCAD', desc:'Script-based 3D modeling', cmd:'sudo dnf install -y openscad', type:'dnf'},
      ]},
    { id:'f-ai', icon:'🤖', title:'CREATIVE AI / ACE STACK',
      items:[
        {name:'ComfyUI (ROCm)', desc:'Node-based SD — AMD RX 6600', cmd:'git clone https://github.com/comfyanonymous/ComfyUI.git ~/tinker-verse/comfyui && cd ~/tinker-verse/comfyui && python3 -m venv venv && source venv/bin/activate && pip install torch torchvision --index-url https://download.pytorch.org/whl/rocm6.1 && pip install -r requirements.txt', type:'manual'},
        {name:'InvokeAI', desc:'Clean professional SD interface', cmd:'pipx install invokeai', type:'pip'},
        {name:'Diffusers (HuggingFace)', desc:'Core AI image library', cmd:'pipx install diffusers transformers accelerate safetensors', type:'pip'},
        {name:'Whisper STT', desc:'Local speech recognition — Alfred daemon', cmd:'pipx install openai-whisper', type:'pip'},
        {name:'Piper TTS', desc:'Local neural TTS — Alfred voice output', cmd:'pipx install piper-tts', type:'pip'},
      ]},
    { id:'f-upgrades', icon:'⬆️', title:'UPGRADES / SYSTEM UPDATES',
      items:[
        {name:'DNF System Upgrade', desc:'Full system upgrade', cmd:'sudo dnf upgrade -y --refresh', type:'dnf'},
        {name:'Flatpak Update All', desc:'Update all Flatpak apps', cmd:'flatpak update -y', type:'manual'},
        {name:'Claude Code Upgrade', desc:'Upgrade Hermes CLI', cmd:'npm update -g @anthropic-ai/claude-code', type:'npm'},
        {name:'Gemini CLI Upgrade', desc:'Upgrade Gemini CLI', cmd:'npm update -g @google/gemini-cli', type:'npm'},
        {name:'Ollama Upgrade', desc:'Reinstall latest Ollama', cmd:'curl -fsSL https://ollama.com/install.sh | sh', type:'manual'},
      ]},
    { id:'f-crosstech', icon:'🔗', title:'CROSS-TECH EXTENSIONS',
      items:[
        {name:'OpenRouter env load', desc:'Source OR key from config file', cmd:'echo "source ~/.config/tinker-verse/openrouter.env" >> ~/.bashrc && source ~/.bashrc', type:'manual'},
        {name:'HSA ROCm env permanent', desc:'AMD RX 6600 GFX version fix in bashrc', cmd:'echo "export HSA_OVERRIDE_GFX_VERSION=10.3.0" >> ~/.bashrc && source ~/.bashrc', type:'manual'},
        {name:'Tailscale mesh join', desc:'Join T1NK3R cluster mesh', cmd:'sudo tailscale up', type:'manual'},
        {name:'CachyOS SSH alias', desc:'Quick SSH to CachyOS main rig', cmd:'echo "alias cachy=\'ssh tinkerv@192.168.1.138\'" >> ~/.bashrc && source ~/.bashrc', type:'manual'},
        {name:'Pi5 SSH alias', desc:'Quick SSH to Pi5 anchor node', cmd:'echo "alias pi5=\'ssh tinkerv@192.168.1.110\'" >> ~/.bashrc && source ~/.bashrc', type:'manual'},
        {name:'CLAUDE.md sync from Ventoy', desc:'Copy context files to project dir', cmd:'mkdir -p ~/tinker-verse && cp /run/media/$USER/Ventoy/float/New\\ Folder/tinker-verse/CLAUDE.md ~/tinker-verse/', type:'manual'},
      ]},
  ],
  ubuntu: [
    { id:'u-bootstrap', icon:'🔧', title:'BOOTSTRAP (AUTO-RUNS FIRST)',
      items:[
        {name:'apt update + upgrade', desc:'Full system update before anything else', cmd:'sudo apt update -y && sudo apt upgrade -y', type:'apt'},
        {name:'build-essential + git + curl + wget', desc:'Base dev tools — needed for everything', cmd:'sudo apt install -y build-essential git curl wget', type:'apt'},
        {name:'Flatpak + Flathub', desc:'Flatpak runtime + Flathub remote', cmd:'sudo apt install -y flatpak && flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo', type:'apt'},
        {name:'pipx', desc:'Isolated Python tool runner', cmd:'sudo apt install -y pipx && pipx ensurepath', type:'apt'},
        {name:'nvm → Node LTS', desc:'Node via nvm — CLI AI tools need this', cmd:'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash && source ~/.bashrc && nvm install --lts', type:'manual'},
        {name:'Rust + Cargo', desc:'Systems lang — RTK, Yazi, Bevy', cmd:'curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y && source $HOME/.cargo/env', type:'manual'},
        {name:'zsh + Oh My Zsh', desc:'Better shell', cmd:'sudo apt install -y zsh && sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"', type:'manual'},
      ]},
    { id:'u-cliai', icon:'🖥️', title:'CLI AI TOOLS',
      items:[
        {name:'Claude Code (Hermes)', desc:'Primary agentic coding CLI v2.1.138+', cmd:'npm install -g @anthropic-ai/claude-code', type:'npm'},
        {name:'Gemini CLI', desc:'Google Gemini CLI — codegen layer', cmd:'npm install -g @google/gemini-cli', type:'npm'},
        {name:'OpenAI Codex CLI', desc:'OpenAI Codex via OpenRouter Tier 1', cmd:'npm install -g @openai/codex', type:'npm'},
        {name:'OpenCode', desc:'Open-source multi-provider AI CLI', cmd:'npm install -g opencode-ai', type:'npm'},
        {name:'Aider', desc:'AI pair programmer — git-aware', cmd:'pipx install aider-chat', type:'pip'},
        {name:'Shell-GPT', desc:'LLM queries in terminal', cmd:'pipx install shell-gpt', type:'pip'},
        {name:'LLM (Willison)', desc:'Universal LLM CLI', cmd:'pipx install llm', type:'pip'},
        {name:'RTK', desc:'Token compression for Claude Code', cmd:'cargo install rtk && rtk init -g', type:'cargo'},
        {name:'Yazi File Manager', desc:'Iron Works themed Rust terminal FM', cmd:'cargo install yazi-fm', type:'cargo'},
      ]},
    { id:'u-sovereign', icon:'🛡️', title:'SOVEREIGN STACK',
      items:[
        {name:'Ollama 0.17.1+', desc:'Local LLM — CVE-2026-7482 patched', cmd:'curl -fsSL https://ollama.com/install.sh | sh && sudo systemctl enable --now ollama', type:'manual'},
        {name:'Docker CE', desc:'Container engine', cmd:'curl -fsSL https://get.docker.com | sh && sudo usermod -aG docker $USER && sudo systemctl enable --now docker', type:'manual'},
        {name:'Open WebUI', desc:'Browser UI for Ollama — port 3000', cmd:'docker run -d -p 3000:8080 --add-host=host.docker.internal:host-gateway -v open-webui:/app/backend/data --name open-webui --restart always ghcr.io/open-webui/open-webui:main', type:'manual'},
        {name:'LocalSend', desc:'Sovereign LAN file transfer', cmd:'flatpak install -y flathub org.localsend.localsend_app', type:'flatpak'},
        {name:'Tailscale', desc:'Mesh VPN — cluster access', cmd:'curl -fsSL https://tailscale.com/install.sh | sh && sudo tailscale up', type:'manual'},
        {name:'Whisper STT', desc:'Local speech recognition', cmd:'pipx install openai-whisper', type:'pip'},
        {name:'Piper TTS', desc:'Local neural TTS', cmd:'pipx install piper-tts', type:'pip'},
      ]},
    { id:'u-companions', icon:'🤝', title:'COMPANION MODELS',
      items:[
        {name:'Alfred — mistral:latest', desc:'Always warm', cmd:'ollama pull mistral:latest', type:'ollama'},
        {name:'Steward — phi3:latest', desc:'Always warm', cmd:'ollama pull phi3:latest', type:'ollama'},
        {name:'Scout — phi3:mini', desc:'Always warm', cmd:'ollama pull phi3:mini', type:'ollama'},
        {name:'Daisy — llama3.2:1b', desc:'Safe Space support', cmd:'ollama pull llama3.2:1b', type:'ollama'},
        {name:'Coach — llama3.2:3b', desc:'Motivation', cmd:'ollama pull llama3.2:3b', type:'ollama'},
        {name:'Spark — qwen2.5:3b', desc:'Inspiration engine', cmd:'ollama pull qwen2.5:3b', type:'ollama'},
        {name:'Solace — llama3.2', desc:'Deep creative voice', cmd:'ollama pull llama3.2:latest', type:'ollama'},
        {name:'Sage — mistral', desc:'Knowledge layer', cmd:'ollama pull mistral:latest', type:'ollama'},
        {name:'Luna — llama3.2', desc:'P.A.W.S. / living systems', cmd:'ollama pull llama3.2:latest', type:'ollama'},
        {name:'nomic-embed-text', desc:'RAG embeddings', cmd:'ollama pull nomic-embed-text', type:'ollama'},
      ]},
    { id:'u-audio', icon:'🔊', title:'AUDIO CORE / PIPEWIRE',
      items:[
        {name:'PipeWire Full Stack', desc:'Main audio engine — JACK bridge + ALSA compat', cmd:'sudo apt install -y pipewire pipewire-jack pipewire-alsa pipewire-pulse wireplumber', type:'apt'},
        {name:'qpwgraph', desc:'PipeWire visual patchbay', cmd:'sudo apt install -y qpwgraph', type:'apt'},
        {name:'Carla Plugin Host', desc:'VST/LV2 host — run any plugin standalone', cmd:'sudo apt install -y carla', type:'apt'},
        {name:'EasyEffects', desc:'System audio effects — EQ/compression', cmd:'flatpak install -y flathub com.github.wwmm.easyeffects', type:'flatpak'},
        {name:'ALSA Utils', desc:'alsamixer, aplay, arecord', cmd:'sudo apt install -y alsa-utils', type:'apt'},
        {name:'Sonobus', desc:'P2P audio streaming — live sessions', cmd:'flatpak install -y flathub net.sonobus.SonoBus', type:'flatpak'},
      ]},
    { id:'u-daw', icon:'🎚️', title:'DAWs',
      items:[
        {name:'Ardour 8', desc:'Pro Linux DAW', cmd:'sudo apt install -y ardour', type:'apt'},
        {name:'LMMS', desc:'Beat/melody production', cmd:'sudo apt install -y lmms', type:'apt'},
        {name:'Zrythm', desc:'Modern FOSS DAW', cmd:'flatpak install -y flathub org.zrythm.Zrythm', type:'flatpak'},
        {name:'Mixxx', desc:'DJ software — T1NK3R.FM', cmd:'sudo apt install -y mixxx', type:'apt'},
        {name:'Audacity', desc:'Audio editor', cmd:'flatpak install -y flathub org.audacityteam.Audacity', type:'flatpak'},
        {name:'Reaper', desc:'Lightweight pro DAW — WINE or native', cmd:'# Download installer: reaper.fm/download.php', type:'manual'},
      ]},
    { id:'u-synths', icon:'🎹', title:'SYNTHS / INSTRUMENTS',
      items:[
        {name:'Surge XT', desc:'Hybrid wavetable synth', cmd:'flatpak install -y flathub org.surge_synth_team.surge-xt', type:'flatpak'},
        {name:'Helm Synth', desc:'Polyphonic VST synth', cmd:'sudo apt install -y helm', type:'apt'},
        {name:'ZynAddSubFX', desc:'Powerful additive/subtractive synth', cmd:'sudo apt install -y zynaddsubfx', type:'apt'},
        {name:'Sfizz (SFZ player)', desc:'SFZ/SF2 sample player', cmd:'sudo apt install -y sfizz', type:'apt'},
        {name:'FluidSynth + GM font', desc:'General MIDI engine + soundfont', cmd:'sudo apt install -y fluidsynth fluid-soundfont-gm', type:'apt'},
        {name:'Geonkick', desc:'Kick drum synthesizer', cmd:'sudo apt install -y geonkick', type:'apt'},
        {name:'Yoshimi', desc:'ZynAddSubFX fork — advanced MIDI', cmd:'sudo apt install -y yoshimi', type:'apt'},
      ]},
    { id:'u-gaming', icon:'🎮', title:'GAMING',
      items:[
        {name:'Steam', desc:'PC gaming — Proton built-in', cmd:'sudo apt install -y steam-installer', type:'apt'},
        {name:'Heroic Launcher', desc:'Epic / GOG / Amazon', cmd:'flatpak install -y flathub com.heroicgameslauncher.hgl', type:'flatpak'},
        {name:'Lutris', desc:'Unified game manager', cmd:'sudo apt install -y lutris', type:'apt'},
        {name:'Bottles', desc:'Wine bottle manager', cmd:'flatpak install -y flathub com.usebottles.bottles', type:'flatpak'},
        {name:'Wine', desc:'Windows compat layer', cmd:'sudo apt install -y wine winetricks', type:'apt'},
        {name:'MangoHud', desc:'In-game performance overlay', cmd:'sudo apt install -y mangohud', type:'apt'},
        {name:'GameMode', desc:'CPU/GPU governor daemon', cmd:'sudo apt install -y gamemode', type:'apt'},
        {name:'Gamescope', desc:'Micro-compositor', cmd:'sudo apt install -y gamescope', type:'apt'},
        {name:'ProtonUp-Qt', desc:'Manage Proton-GE builds', cmd:'flatpak install -y flathub net.davidotek.pupgui2', type:'flatpak'},
        {name:'RetroArch', desc:'Multi-system emulator', cmd:'flatpak install -y flathub org.libretro.RetroArch', type:'flatpak'},
        {name:'RPCS3 (PS3)', desc:'PlayStation 3 emulator', cmd:'flatpak install -y flathub net.rpcs3.RPCS3', type:'flatpak'},
        {name:'PCSX2 (PS2)', desc:'PlayStation 2 emulator', cmd:'flatpak install -y flathub net.pcsx2.PCSX2', type:'flatpak'},
        {name:'Dolphin (GC/Wii)', desc:'Nintendo GameCube/Wii emulator', cmd:'flatpak install -y flathub org.DolphinEmu.dolphin-emu', type:'flatpak'},
        {name:'DuckStation (PS1)', desc:'Best PS1 emulator', cmd:'flatpak install -y flathub org.duckstation.DuckStation', type:'flatpak'},
        {name:'PPSSPP (PSP)', desc:'PSP emulator', cmd:'flatpak install -y flathub org.ppsspp.PPSSPP', type:'flatpak'},
      ]},
    { id:'u-dev', icon:'💻', title:'DEVELOPMENT',
      items:[
        {name:'VS Code', desc:'Primary editor', cmd:'flatpak install -y flathub com.visualstudio.code', type:'flatpak'},
        {name:'Neovim', desc:'Hyperextensible Vim fork', cmd:'sudo apt install -y neovim', type:'apt'},
        {name:'GitHub CLI', desc:'GitHub from terminal', cmd:'sudo apt install -y gh', type:'apt'},
        {name:'tmux', desc:'Terminal multiplexer', cmd:'sudo apt install -y tmux', type:'apt'},
        {name:'bat / fd / ripgrep / fzf', desc:'Modern CLI replacements', cmd:'sudo apt install -y bat fd-find ripgrep fzf', type:'apt'},
        {name:'Kitty Terminal', desc:'GPU-accelerated terminal', cmd:'sudo apt install -y kitty', type:'apt'},
        {name:'Wireshark', desc:'Network analyzer', cmd:'sudo apt install -y wireshark', type:'apt'},
        {name:'Timeshift', desc:'System snapshots', cmd:'sudo apt install -y timeshift', type:'apt'},
      ]},
    { id:'u-art', icon:'🎨', title:'ART / VIDEO',
      items:[
        {name:'Blender', desc:'3D modeling — VIGA/Modly', cmd:'flatpak install -y flathub org.blender.Blender', type:'flatpak'},
        {name:'Krita', desc:'Digital painting', cmd:'sudo apt install -y krita', type:'apt'},
        {name:'GIMP', desc:'Image editor', cmd:'sudo apt install -y gimp', type:'apt'},
        {name:'Inkscape', desc:'Vector graphics', cmd:'sudo apt install -y inkscape', type:'apt'},
        {name:'OBS Studio', desc:'Streaming & recording', cmd:'sudo apt install -y obs-studio', type:'apt'},
        {name:'Kdenlive', desc:'NLE video editor', cmd:'flatpak install -y flathub org.kde.kdenlive', type:'flatpak'},
        {name:'FFmpeg', desc:'CLI multimedia toolkit', cmd:'sudo apt install -y ffmpeg', type:'apt'},
        {name:'OrcaSlicer', desc:'Bambu P1S slicer', cmd:'flatpak install -y flathub com.softfever.OrcaSlicer', type:'flatpak'},
      ]},
    { id:'u-engines', icon:'🕹️', title:'GAME ENGINES / 3D',
      items:[
        {name:'Godot 4 (Flatpak)', desc:'T1NK3R Games', cmd:'flatpak install -y flathub org.godotengine.Godot', type:'flatpak'},
        {name:'Unity Hub', desc:'Unity engine manager', cmd:'flatpak install -y flathub com.unity.UnityHub', type:'flatpak'},
        {name:'KiCad', desc:'PCB & schematic EDA', cmd:'sudo apt install -y kicad kicad-library', type:'apt'},
        {name:'FreeCAD', desc:'Parametric 3D CAD', cmd:'sudo apt install -y freecad', type:'apt'},
        {name:'OpenSCAD', desc:'Script-based 3D modeling', cmd:'sudo apt install -y openscad', type:'apt'},
      ]},
    { id:'u-homelab', icon:'🏠', title:'HOMELAB / SELF-HOSTED',
      items:[
        {name:'Portainer', desc:'Docker web UI', cmd:'docker run -d -p 9000:9000 --name portainer --restart always -v /var/run/docker.sock:/var/run/docker.sock portainer/portainer-ce', type:'manual'},
        {name:'Jellyfin', desc:'Local media server', cmd:'flatpak install -y flathub com.github.iwalton3.jellyfin-media-player', type:'flatpak'},
        {name:'Nextcloud AIO', desc:'Full private cloud', cmd:'docker run -d -p 8080:8080 --name nextcloud-aio-mastercontainer --restart always -v nextcloud_aio_mastercontainer:/mnt/docker-aio-config -v /var/run/docker.sock:/var/run/docker.sock nextcloud/all-in-one:latest', type:'manual'},
        {name:'Uptime Kuma', desc:'Monitoring dashboard', cmd:'docker run -d -p 3002:3001 --name uptime-kuma --restart unless-stopped -v uptime-kuma:/app/data louislam/uptime-kuma:1', type:'manual'},
        {name:'Vaultwarden', desc:'Self-hosted Bitwarden', cmd:'docker run -d -p 8222:80 --name vaultwarden --restart unless-stopped -v ~/vaultwarden:/data vaultwarden/server:latest', type:'manual'},
        {name:'Kiwix Desktop', desc:'Offline Wikipedia', cmd:'flatpak install -y flathub org.kiwix.desktop', type:'flatpak'},
      ]},
    { id:'u-writing', icon:'✍️', title:'WRITING / KNOWLEDGE',
      items:[
        {name:'Obsidian', desc:'Markdown PKM', cmd:'flatpak install -y flathub md.obsidian.Obsidian', type:'flatpak'},
        {name:'LibreOffice', desc:'Full office suite', cmd:'sudo apt install -y libreoffice', type:'apt'},
        {name:'Joplin', desc:'Encrypted note sync', cmd:'flatpak install -y flathub net.cozic.joplin_desktop', type:'flatpak'},
      ]},
    { id:'u-upgrades', icon:'⬆️', title:'UPGRADES / SYSTEM UPDATES',
      items:[
        {name:'Full System Upgrade', desc:'apt update + upgrade', cmd:'sudo apt update -y && sudo apt upgrade -y && sudo apt autoremove -y', type:'apt'},
        {name:'Flatpak Update All', desc:'Update all Flatpak apps', cmd:'flatpak update -y', type:'manual'},
        {name:'Ollama Upgrade', desc:'Reinstall latest Ollama', cmd:'curl -fsSL https://ollama.com/install.sh | sh', type:'manual'},
        {name:'Claude Code Upgrade', desc:'Upgrade Hermes CLI', cmd:'npm update -g @anthropic-ai/claude-code', type:'npm'},
        {name:'Gemini CLI Upgrade', desc:'Upgrade Gemini CLI', cmd:'npm update -g @google/gemini-cli', type:'npm'},
        {name:'pipx Upgrade All', desc:'Upgrade all pipx-installed tools', cmd:'pipx upgrade-all', type:'manual'},
        {name:'Rust Toolchain Update', desc:'rustup update stable', cmd:'rustup update stable', type:'manual'},
      ]},
    { id:'u-crosstech', icon:'🔗', title:'CROSS-TECH EXTENSIONS',
      items:[
        {name:'OpenRouter env load', desc:'Source OR key from config file', cmd:'echo "source ~/.config/tinker-verse/openrouter.env" >> ~/.bashrc && source ~/.bashrc', type:'manual'},
        {name:'Tailscale mesh join', desc:'Join T1NK3R cluster mesh', cmd:'sudo tailscale up', type:'manual'},
        {name:'Pi5 SSH alias', desc:'Quick SSH to Pi5 anchor node', cmd:'echo "alias pi5=\x27ssh tinkerv@192.168.1.110\x27" >> ~/.bashrc && source ~/.bashrc', type:'manual'},
      ]},
  ],
  arch: [
    { id:'a-bootstrap', icon:'🔧', title:'BOOTSTRAP (AUTO-RUNS FIRST)',
      items:[
        {name:'base-devel + git', desc:'Prerequisite for yay / AUR builds', cmd:'sudo pacman -S --needed --noconfirm base-devel git', type:'pacman'},
        {name:'yay AUR helper', desc:'Auto-installed if missing', cmd:'# Auto-detected in script', type:'aur'},
        {name:'Flatpak + Flathub', desc:'App runtime', cmd:'sudo pacman -S --needed --noconfirm flatpak && flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo', type:'pacman'},
        {name:'pipx', desc:'Isolated Python tool runner', cmd:'sudo pacman -S --needed --noconfirm python-pipx && pipx ensurepath', type:'pacman'},
        {name:'nvm → Node LTS', desc:'Required for CLI AI tools', cmd:'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash && source ~/.bashrc && nvm install --lts', type:'manual'},
        {name:'Rust + Cargo', desc:'Required for RTK, Yazi, Bevy', cmd:'curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y && source $HOME/.cargo/env', type:'manual'},
      ]},
    { id:'a-cliai', icon:'🖥️', title:'CLI AI TOOLS',
      items:[
        {name:'Claude Code (Hermes)', desc:'Primary agentic coding CLI', cmd:'npm install -g @anthropic-ai/claude-code', type:'npm'},
        {name:'Gemini CLI', desc:'Google Gemini — codegen layer', cmd:'npm install -g @google/gemini-cli', type:'npm'},
        {name:'OpenAI Codex CLI', desc:'OpenAI Codex via OpenRouter', cmd:'npm install -g @openai/codex', type:'npm'},
        {name:'OpenCode', desc:'Open-source multi-provider AI CLI', cmd:'npm install -g opencode-ai', type:'npm'},
        {name:'Aider', desc:'AI pair programmer', cmd:'pipx install aider-chat', type:'pip'},
        {name:'Shell-GPT', desc:'LLM in terminal', cmd:'pipx install shell-gpt', type:'pip'},
        {name:'LLM (Willison)', desc:'Universal LLM CLI', cmd:'pipx install llm', type:'pip'},
        {name:'RTK', desc:'Token compression for Claude Code', cmd:'cargo install rtk && rtk init -g', type:'cargo'},
        {name:'Yazi File Manager', desc:'Rust terminal file manager', cmd:'cargo install yazi-fm', type:'cargo'},
      ]},
    { id:'a-sovereign', icon:'🛡️', title:'SOVEREIGN STACK',
      items:[
        {name:'Ollama 0.17.1+', desc:'Local LLM — CVE patched', cmd:'sudo pacman -S --needed --noconfirm ollama && sudo systemctl enable --now ollama', type:'pacman'},
        {name:'Docker CE', desc:'Container engine', cmd:'sudo pacman -S --needed --noconfirm docker docker-compose && sudo systemctl enable --now docker && sudo usermod -aG docker $USER', type:'pacman'},
        {name:'LocalSend', desc:'Sovereign LAN file transfer', cmd:'flatpak install -y flathub org.localsend.localsend_app', type:'flatpak'},
        {name:'Tailscale', desc:'Mesh VPN', cmd:'yay -S --needed --noconfirm tailscale && sudo systemctl enable --now tailscaled', type:'aur'},
        {name:'Whisper STT', desc:'Local speech recognition', cmd:'pipx install openai-whisper', type:'pip'},
        {name:'Piper TTS', desc:'Local neural TTS', cmd:'pipx install piper-tts', type:'pip'},
      ]},
    { id:'a-companions', icon:'🤝', title:'COMPANION MODELS',
      items:[
        {name:'Alfred — mistral:latest', desc:'Always warm', cmd:'ollama pull mistral:latest', type:'ollama'},
        {name:'Steward — phi3:latest', desc:'Always warm', cmd:'ollama pull phi3:latest', type:'ollama'},
        {name:'Scout — phi3:mini', desc:'Always warm', cmd:'ollama pull phi3:mini', type:'ollama'},
        {name:'Daisy — llama3.2:1b', desc:'Safe Space support', cmd:'ollama pull llama3.2:1b', type:'ollama'},
        {name:'Coach — llama3.2:3b', desc:'Motivation', cmd:'ollama pull llama3.2:3b', type:'ollama'},
        {name:'Spark — qwen2.5:3b', desc:'Inspiration engine', cmd:'ollama pull qwen2.5:3b', type:'ollama'},
        {name:'Solace — llama3.2', desc:'Deep creative voice', cmd:'ollama pull llama3.2:latest', type:'ollama'},
        {name:'Sage — mistral', desc:'Knowledge layer', cmd:'ollama pull mistral:latest', type:'ollama'},
        {name:'Luna — llama3.2', desc:'P.A.W.S. / living systems', cmd:'ollama pull llama3.2:latest', type:'ollama'},
        {name:'nomic-embed-text', desc:'RAG embeddings', cmd:'ollama pull nomic-embed-text', type:'ollama'},
      ]},
    { id:'a-gaming', icon:'🎮', title:'GAMING',
      items:[
        {name:'Steam', desc:'PC gaming — Proton built-in', cmd:'sudo pacman -S --needed --noconfirm steam', type:'pacman'},
        {name:'Heroic Launcher', desc:'Epic / GOG / Amazon', cmd:'flatpak install -y flathub com.heroicgameslauncher.hgl', type:'flatpak'},
        {name:'Lutris', desc:'Unified game manager', cmd:'sudo pacman -S --needed --noconfirm lutris', type:'pacman'},
        {name:'Bottles', desc:'Wine bottle manager', cmd:'flatpak install -y flathub com.usebottles.bottles', type:'flatpak'},
        {name:'Wine Staging', desc:'Windows compat layer', cmd:'sudo pacman -S --needed --noconfirm wine-staging winetricks', type:'pacman'},
        {name:'MangoHud', desc:'In-game overlay', cmd:'sudo pacman -S --needed --noconfirm mangohud lib32-mangohud', type:'pacman'},
        {name:'GameMode', desc:'CPU/GPU governor', cmd:'sudo pacman -S --needed --noconfirm gamemode lib32-gamemode', type:'pacman'},
        {name:'Gamescope', desc:'Micro-compositor', cmd:'sudo pacman -S --needed --noconfirm gamescope', type:'pacman'},
        {name:'RetroArch', desc:'Multi-system emulator', cmd:'flatpak install -y flathub org.libretro.RetroArch', type:'flatpak'},
        {name:'RPCS3 (PS3)', desc:'PS3 emulator', cmd:'flatpak install -y flathub net.rpcs3.RPCS3', type:'flatpak'},
        {name:'PCSX2 (PS2)', desc:'PS2 emulator', cmd:'flatpak install -y flathub net.pcsx2.PCSX2', type:'flatpak'},
        {name:'Dolphin (GC/Wii)', desc:'Nintendo emulator', cmd:'flatpak install -y flathub org.DolphinEmu.dolphin-emu', type:'flatpak'},
        {name:'DuckStation (PS1)', desc:'Best PS1 emulator', cmd:'flatpak install -y flathub org.duckstation.DuckStation', type:'flatpak'},
        {name:'PPSSPP (PSP)', desc:'PSP emulator', cmd:'flatpak install -y flathub org.ppsspp.PPSSPP', type:'flatpak'},
      ]},
    { id:'a-dev', icon:'💻', title:'DEVELOPMENT',
      items:[
        {name:'VS Code', desc:'Primary editor', cmd:'flatpak install -y flathub com.visualstudio.code', type:'flatpak'},
        {name:'Neovim', desc:'Hyperextensible Vim', cmd:'sudo pacman -S --needed --noconfirm neovim', type:'pacman'},
        {name:'GitHub CLI', desc:'GitHub from terminal', cmd:'sudo pacman -S --needed --noconfirm github-cli', type:'pacman'},
        {name:'tmux', desc:'Terminal multiplexer', cmd:'sudo pacman -S --needed --noconfirm tmux', type:'pacman'},
        {name:'bat / fd / ripgrep / fzf', desc:'Modern CLI replacements', cmd:'sudo pacman -S --needed --noconfirm bat fd ripgrep fzf eza lazygit', type:'pacman'},
        {name:'Kitty Terminal', desc:'GPU-accelerated terminal', cmd:'sudo pacman -S --needed --noconfirm kitty', type:'pacman'},
        {name:'KiCad', desc:'PCB EDA', cmd:'sudo pacman -S --needed --noconfirm kicad kicad-library', type:'pacman'},
        {name:'FreeCAD', desc:'Parametric 3D CAD', cmd:'sudo pacman -S --needed --noconfirm freecad', type:'pacman'},
        {name:'Wireshark', desc:'Network analyzer', cmd:'sudo pacman -S --needed --noconfirm wireshark-qt', type:'pacman'},
      ]},
    { id:'a-art', icon:'🎨', title:'ART / VIDEO',
      items:[
        {name:'Blender', desc:'3D modeling', cmd:'flatpak install -y flathub org.blender.Blender', type:'flatpak'},
        {name:'Krita', desc:'Digital painting', cmd:'sudo pacman -S --needed --noconfirm krita', type:'pacman'},
        {name:'GIMP', desc:'Image editor', cmd:'sudo pacman -S --needed --noconfirm gimp', type:'pacman'},
        {name:'Inkscape', desc:'Vector graphics', cmd:'sudo pacman -S --needed --noconfirm inkscape', type:'pacman'},
        {name:'OBS Studio', desc:'Streaming & recording', cmd:'sudo pacman -S --needed --noconfirm obs-studio', type:'pacman'},
        {name:'Kdenlive', desc:'NLE video editor', cmd:'flatpak install -y flathub org.kde.kdenlive', type:'flatpak'},
        {name:'FFmpeg', desc:'CLI multimedia toolkit', cmd:'sudo pacman -S --needed --noconfirm ffmpeg', type:'pacman'},
        {name:'OrcaSlicer', desc:'Bambu P1S slicer', cmd:'flatpak install -y flathub com.softfever.OrcaSlicer', type:'flatpak'},
      ]},
    { id:'a-engines', icon:'🕹️', title:'GAME ENGINES / 3D',
      items:[
        {name:'Godot 4', desc:'T1NK3R Games', cmd:'sudo pacman -S --needed --noconfirm godot', type:'pacman'},
        {name:'Unity Hub', desc:'Unity engine manager', cmd:'yay -S --needed --noconfirm unityhub', type:'aur'},
        {name:'Bevy Engine (Rust)', desc:'ECS game engine', cmd:'cargo install bevy', type:'cargo'},
        {name:'LÖVE 2D', desc:'Lua game framework', cmd:'sudo pacman -S --needed --noconfirm love', type:'pacman'},
        {name:'KiCad', desc:'PCB/schematic EDA', cmd:'sudo pacman -S --needed --noconfirm kicad kicad-library kicad-footprints', type:'pacman'},
      ]},
    { id:'a-homelab', icon:'🏠', title:'HOMELAB / SELF-HOSTED',
      items:[
        {name:'Portainer', desc:'Docker web UI', cmd:'docker run -d -p 9000:9000 --name portainer --restart always -v /var/run/docker.sock:/var/run/docker.sock portainer/portainer-ce', type:'manual'},
        {name:'Jellyfin', desc:'Local media server', cmd:'flatpak install -y flathub com.github.iwalton3.jellyfin-media-player', type:'flatpak'},
        {name:'Nextcloud AIO', desc:'Full private cloud', cmd:'docker run -d -p 8080:8080 --name nextcloud-aio-mastercontainer --restart always -v nextcloud_aio_mastercontainer:/mnt/docker-aio-config -v /var/run/docker.sock:/var/run/docker.sock nextcloud/all-in-one:latest', type:'manual'},
        {name:'Uptime Kuma', desc:'Monitoring dashboard', cmd:'docker run -d -p 3002:3001 --name uptime-kuma --restart unless-stopped -v uptime-kuma:/app/data louislam/uptime-kuma:1', type:'manual'},
        {name:'Vaultwarden', desc:'Self-hosted Bitwarden', cmd:'docker run -d -p 8222:80 --name vaultwarden --restart unless-stopped -v ~/vaultwarden:/data vaultwarden/server:latest', type:'manual'},
        {name:'Kiwix Desktop', desc:'Offline Wikipedia', cmd:'flatpak install -y flathub org.kiwix.desktop', type:'flatpak'},
      ]},
    { id:'a-upgrades', icon:'⬆️', title:'UPGRADES / SYSTEM UPDATES',
      items:[
        {name:'Full System Upgrade', desc:'pacman + AUR full upgrade', cmd:'sudo pacman -Syu --noconfirm && yay -Syu --noconfirm', type:'pacman'},
        {name:'Flatpak Update All', desc:'Update all Flatpak apps', cmd:'flatpak update -y', type:'manual'},
        {name:'Ollama Upgrade', desc:'Reinstall latest Ollama', cmd:'curl -fsSL https://ollama.com/install.sh | sh', type:'manual'},
        {name:'Claude Code Upgrade', desc:'Upgrade Hermes CLI', cmd:'npm update -g @anthropic-ai/claude-code', type:'npm'},
        {name:'Gemini CLI Upgrade', desc:'Upgrade Gemini CLI', cmd:'npm update -g @google/gemini-cli', type:'npm'},
        {name:'pipx Upgrade All', desc:'Upgrade all pipx tools', cmd:'pipx upgrade-all', type:'manual'},
        {name:'Rust Toolchain Update', desc:'rustup update stable', cmd:'rustup update stable', type:'manual'},
      ]},
    { id:'a-crosstech', icon:'🔗', title:'CROSS-TECH EXTENSIONS',
      items:[
        {name:'OpenRouter env load', desc:'Source OR key from config file', cmd:'echo "source ~/.config/tinker-verse/openrouter.env" >> ~/.bashrc && source ~/.bashrc', type:'manual'},
        {name:'Tailscale mesh join', desc:'Join T1NK3R cluster mesh', cmd:'sudo tailscale up', type:'manual'},
        {name:'Pi5 SSH alias', desc:'Quick SSH to Pi5 anchor node', cmd:'echo "alias pi5=\x27ssh tinkerv@192.168.1.110\x27" >> ~/.bashrc && source ~/.bashrc', type:'manual'},
      ]},
  ],
  macos: [
    { id:'m-bootstrap', icon:'🔧', title:'BOOTSTRAP (AUTO-RUNS FIRST)',
      items:[
        {name:'Homebrew', desc:'The missing package manager for macOS', cmd:'/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"', type:'brew'},
        {name:'nvm → Node LTS', desc:'Node via nvm — CLI AI tools need this', cmd:'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash && source ~/.zshrc && nvm install --lts', type:'manual'},
        {name:'Rust + Cargo', desc:'Systems lang — RTK, Yazi, Bevy', cmd:'curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y && source $HOME/.cargo/env', type:'manual'},
        {name:'pipx', desc:'Isolated Python tool runner', cmd:'brew install pipx && pipx ensurepath', type:'brew'},
      ]},
    { id:'m-cliai', icon:'🖥️', title:'CLI AI TOOLS',
      items:[
        {name:'Claude Code (Hermes)', desc:'Primary agentic coding CLI', cmd:'npm install -g @anthropic-ai/claude-code', type:'npm'},
        {name:'Gemini CLI', desc:'Google Gemini — codegen layer', cmd:'npm install -g @google/gemini-cli', type:'npm'},
        {name:'OpenAI Codex CLI', desc:'OpenAI Codex via OpenRouter', cmd:'npm install -g @openai/codex', type:'npm'},
        {name:'OpenCode', desc:'Open-source multi-provider AI CLI', cmd:'npm install -g opencode-ai', type:'npm'},
        {name:'Aider', desc:'AI pair programmer', cmd:'pipx install aider-chat', type:'pip'},
        {name:'Shell-GPT', desc:'LLM in terminal', cmd:'pipx install shell-gpt', type:'pip'},
        {name:'LLM (Willison)', desc:'Universal LLM CLI', cmd:'pipx install llm', type:'pip'},
        {name:'RTK', desc:'Token compression for Claude Code', cmd:'cargo install rtk && rtk init -g', type:'cargo'},
        {name:'Yazi File Manager', desc:'Rust terminal file manager', cmd:'cargo install yazi-fm', type:'cargo'},
      ]},
    { id:'m-sovereign', icon:'🛡️', title:'SOVEREIGN STACK',
      items:[
        {name:'Ollama 0.17.1+', desc:'Local LLM — CVE patched', cmd:'brew install ollama && brew services start ollama', type:'brew'},
        {name:'Docker Desktop', desc:'Container engine', cmd:'brew install --cask docker', type:'brew'},
        {name:'LocalSend', desc:'Sovereign LAN file transfer', cmd:'brew install --cask localsend', type:'brew'},
        {name:'Tailscale', desc:'Mesh VPN', cmd:'brew install tailscale && sudo tailscale up', type:'brew'},
        {name:'Whisper STT', desc:'Local speech recognition', cmd:'pipx install openai-whisper', type:'pip'},
        {name:'Piper TTS', desc:'Local neural TTS', cmd:'pipx install piper-tts', type:'pip'},
      ]},
    { id:'m-companions', icon:'🤝', title:'COMPANION MODELS',
      items:[
        {name:'Alfred — mistral:latest', desc:'Always warm', cmd:'ollama pull mistral:latest', type:'ollama'},
        {name:'Steward — phi3:latest', desc:'Always warm', cmd:'ollama pull phi3:latest', type:'ollama'},
        {name:'Scout — phi3:mini', desc:'Always warm', cmd:'ollama pull phi3:mini', type:'ollama'},
        {name:'Daisy — llama3.2:1b', desc:'Safe Space support', cmd:'ollama pull llama3.2:1b', type:'ollama'},
        {name:'Coach — llama3.2:3b', desc:'Motivation', cmd:'ollama pull llama3.2:3b', type:'ollama'},
        {name:'Spark — qwen2.5:3b', desc:'Inspiration engine', cmd:'ollama pull qwen2.5:3b', type:'ollama'},
        {name:'Solace — llama3.2', desc:'Deep creative voice', cmd:'ollama pull llama3.2:latest', type:'ollama'},
        {name:'Sage — mistral', desc:'Knowledge layer', cmd:'ollama pull mistral:latest', type:'ollama'},
        {name:'Luna — llama3.2', desc:'P.A.W.S. / living systems', cmd:'ollama pull llama3.2:latest', type:'ollama'},
        {name:'nomic-embed-text', desc:'RAG embeddings', cmd:'ollama pull nomic-embed-text', type:'ollama'},
      ]},
    { id:'m-gaming', icon:'🎮', title:'GAMING',
      items:[
        {name:'Steam', desc:'PC gaming', cmd:'brew install --cask steam', type:'brew'},
        {name:'Heroic Launcher', desc:'Epic / GOG / Amazon', cmd:'brew install --cask heroic', type:'brew'},
        {name:'Whisky', desc:'Wine for macOS (Modern)', cmd:'brew install --cask whisky', type:'brew'},
        {name:'CrossOver', desc:'Commercial Wine for macOS', cmd:'# Purchase from codeweavers.com', type:'manual'},
        {name:'RetroArch', desc:'Multi-system emulator', cmd:'brew install --cask retroarch', type:'brew'},
        {name:'Dolphin', desc:'GameCube/Wii emulator', cmd:'brew install --cask dolphin', type:'brew'},
        {name:'PPSSPP', desc:'PSP emulator', cmd:'brew install --cask ppsspp', type:'brew'},
      ]},
    { id:'m-dev', icon:'💻', title:'DEVELOPMENT',
      items:[
        {name:'VS Code', desc:'Primary editor', cmd:'brew install --cask visual-studio-code', type:'brew'},
        {name:'Neovim', desc:'Hyperextensible Vim', cmd:'brew install neovim', type:'brew'},
        {name:'GitHub CLI', desc:'GitHub from terminal', cmd:'brew install gh', type:'brew'},
        {name:'iTerm2', desc:'Advanced terminal', cmd:'brew install --cask iterm2', type:'brew'},
        {name:'tmux', desc:'Terminal multiplexer', cmd:'brew install tmux', type:'brew'},
        {name:'bat / fd / ripgrep / fzf', desc:'Modern CLI replacements', cmd:'brew install bat fd ripgrep fzf eza lazygit', type:'brew'},
        {name:'OrbStack', desc:'Docker alternative — faster on Apple Silicon', cmd:'brew install --cask orbstack', type:'brew'},
      ]},
    { id:'m-art', icon:'🎨', title:'ART / VIDEO',
      items:[
        {name:'Blender', desc:'3D modeling', cmd:'brew install --cask blender', type:'brew'},
        {name:'Krita', desc:'Digital painting', cmd:'brew install --cask krita', type:'brew'},
        {name:'GIMP', desc:'Image editor', cmd:'brew install --cask gimp', type:'brew'},
        {name:'Inkscape', desc:'Vector graphics', cmd:'brew install --cask inkscape', type:'brew'},
        {name:'OBS Studio', desc:'Streaming & recording', cmd:'brew install --cask obs', type:'brew'},
        {name:'DaVinci Resolve', desc:'Pro video editor', cmd:'brew install --cask davinci-resolve', type:'brew'},
        {name:'Final Cut Pro', desc:'Apple pro video editor', cmd:'mas install 424389933', type:'manual'},
        {name:'Logic Pro', desc:'Apple pro DAW — Mac only', cmd:'mas install 634148309', type:'manual'},
      ]},
    { id:'m-audio', icon:'🔊', title:'AUDIO / DAW',
      items:[
        {name:'Logic Pro', desc:'Apple pro DAW', cmd:'mas install 634148309', type:'manual'},
        {name:'GarageBand', desc:'Free Apple DAW', cmd:'mas install 682658836', type:'manual'},
        {name:'Reaper', desc:'Lightweight pro DAW', cmd:'brew install --cask reaper', type:'brew'},
        {name:'Audacity', desc:'Audio editor', cmd:'brew install --cask audacity', type:'brew'},
        {name:'Ableton Live Lite', desc:'Electronic music DAW', cmd:'# Download from ableton.com', type:'manual'},
        {name:'Surge XT', desc:'Hybrid wavetable synth', cmd:'brew install --cask surge-xt', type:'brew'},
        {name:'Vital', desc:'Spectral wavetable synth', cmd:'brew install --cask vital', type:'brew'},
      ]},
    { id:'m-engines', icon:'🕹️', title:'GAME ENGINES / 3D',
      items:[
        {name:'Godot 4', desc:'T1NK3R Games', cmd:'brew install --cask godot', type:'brew'},
        {name:'Unity Hub', desc:'Unity engine manager', cmd:'brew install --cask unity-hub', type:'brew'},
        {name:'Unreal Engine 5', desc:'UE5 via Epic Launcher', cmd:'brew install --cask epic-games', type:'brew'},
      ]},
    { id:'m-homelab', icon:'🏠', title:'HOMELAB / SELF-HOSTED',
      items:[
        {name:'Portainer', desc:'Docker web UI', cmd:'docker run -d -p 9000:9000 --name portainer --restart always -v /var/run/docker.sock:/var/run/docker.sock portainer/portainer-ce', type:'manual'},
        {name:'Jellyfin', desc:'Local media server', cmd:'brew install --cask jellyfin-media-player', type:'brew'},
        {name:'Nextcloud', desc:'Private cloud sync', cmd:'brew install --cask nextcloud', type:'brew'},
        {name:'Tailscale', desc:'Mesh VPN', cmd:'brew install tailscale && sudo tailscale up', type:'brew'},
      ]},
    { id:'m-upgrades', icon:'⬆️', title:'UPGRADES / SYSTEM UPDATES',
      items:[
        {name:'brew upgrade', desc:'Upgrade all Homebrew packages', cmd:'brew upgrade', type:'brew'},
        {name:'brew cleanup', desc:'Clean old versions', cmd:'brew cleanup', type:'brew'},
        {name:'Ollama Upgrade', desc:'Reinstall latest Ollama', cmd:'brew upgrade ollama && brew services restart ollama', type:'brew'},
        {name:'Claude Code Upgrade', desc:'Upgrade Hermes CLI', cmd:'npm update -g @anthropic-ai/claude-code', type:'npm'},
        {name:'Gemini CLI Upgrade', desc:'Upgrade Gemini CLI', cmd:'npm update -g @google/gemini-cli', type:'npm'},
      ]},
    { id:'m-crosstech', icon:'🔗', title:'CROSS-TECH EXTENSIONS',
      items:[
        {name:'OpenRouter env load', desc:'Source OR key from config file', cmd:'echo "source ~/.config/tinker-verse/openrouter.env" >> ~/.zshrc && source ~/.zshrc', type:'manual'},
        {name:'Tailscale mesh join', desc:'Join T1NK3R cluster mesh', cmd:'sudo tailscale up', type:'manual'},
        {name:'Pi5 SSH alias', desc:'Quick SSH to Pi5 anchor node', cmd:'echo "alias pi5=\x27ssh tinkerv@192.168.1.110\x27" >> ~/.zshrc && source ~/.zshrc', type:'manual'},
      ]},
  ],
  ipados: [
    { id:'i-bootstrap', icon:'🔧', title:'BOOTSTRAP',
      items:[
        {name:'a-Shell (App Store)', desc:'Full Unix shell on iPad — no jailbreak', cmd:'# Install from App Store: search "a-Shell"', type:'manual'},
        {name:'iSH (App Store)', desc:'Alpine Linux shell on iPad', cmd:'# Install from App Store: search "iSH"', type:'manual'},
        {name:'TestFlight: a-Shell Mini', desc:'Lightweight shell with fewer permissions', cmd:'# Join TestFlight for a-Shell Mini', type:'manual'},
      ]},
    { id:'i-cliai', icon:'🖥️', title:'CLI AI TOOLS (a-Shell / iSH)',
      items:[
        {name:'Python 3 + pip', desc:'Python is pre-installed in a-Shell', cmd:'pip install --upgrade pip', type:'manual'},
        {name:'Shell-GPT', desc:'LLM in terminal', cmd:'pip install shell-gpt', type:'manual'},
        {name:'LLM (Willison)', desc:'Universal LLM CLI', cmd:'pip install llm', type:'manual'},
        {name:'a-Shell: clang + C', desc:'Native C compiler in a-Shell', cmd:'# Already available: clang, make, vim', type:'manual'},
      ]},
    { id:'i-sovereign', icon:'🛡️', title:'SOVEREIGN STACK',
      items:[
        {name:'Ollama (iSH experimental)', desc:'Local LLM — slow but possible', cmd:'# In iSH: curl -fsSL https://ollama.com/install.sh | sh', type:'manual'},
        {name:'LocalSend (App Store)', desc:'Sovereign LAN file transfer', cmd:'# Install "LocalSend" from App Store', type:'manual'},
        {name:'Tailscale (App Store)', desc:'Mesh VPN', cmd:'# Install "Tailscale" from App Store', type:'manual'},
        {name:'Nextcloud (App Store)', desc:'Private cloud sync', cmd:'# Install "Nextcloud" from App Store', type:'manual'},
      ]},
    { id:'i-native', icon:'📱', title:'NATIVE APPS',
      items:[
        {name:'Obsidian', desc:'Markdown PKM vault', cmd:'# Install "Obsidian" from App Store', type:'manual'},
        {name:'Kodi', desc:'Media center — T1NK3R.TV frontend', cmd:'# Install "Kodi" from App Store', type:'manual'},
        {name:'VLC', desc:'Universal media player', cmd:'# Install "VLC for Mobile" from App Store', type:'manual'},
        {name:'GarageBand', desc:'Apple DAW — free', cmd:'# Pre-installed or App Store', type:'manual'},
        {name:'Logic Pro for iPad', desc:'Pro DAW — subscription', cmd:'# App Store — subscription required', type:'manual'},
        {name:'Procreate', desc:'Digital painting — best on iPad', cmd:'# Purchase "Procreate" from App Store', type:'manual'},
        {name:'Affinity Designer', desc:'Vector graphics', cmd:'# Purchase from App Store', type:'manual'},
        {name:'LumaFusion', desc:'Pro video editor for iPad', cmd:'# Purchase from App Store', type:'manual'},
        {name:'Pythonista 3', desc:'Python IDE for iOS', cmd:'# Purchase "Pythonista 3" from App Store', mode:'manual'},
        {name:'Blink Shell', desc:'Pro SSH/Mosh terminal', cmd:'# Purchase "Blink Shell" from App Store', type:'manual'},
        {name:'Working Copy', desc:'Git client for iOS', cmd:'# Install "Working Copy" from App Store', type:'manual'},
        {name:'a-Shell + widgets', desc:'Run scripts from home screen', cmd:'# Add a-Shell widgets in iPadOS', type:'manual'},
      ]},
    { id:'i-crosstech', icon:'🔗', title:'CROSS-TECH EXTENSIONS',
      items:[
        {name:'OpenRouter env (a-Shell)', desc:'Set API key in a-Shell', cmd:'echo "export OPENROUTER_API_KEY=your-key" >> ~/.profile', type:'manual'},
        {name:'SSH to Pi5', desc:'Quick SSH from a-Shell / Blink', cmd:'ssh tinkerv@192.168.1.110', type:'manual'},
        {name:'SFTP file transfer', desc:'Transfer files to/from iPad', cmd:'# Use a-Shell sftp or Files app + Tailscale', type:'manual'},
      ]},
  ],
  android: [
    { id:'d-bootstrap', icon:'🔧', title:'BOOTSTRAP (TERMUX)',
      items:[
        {name:'Termux (F-Droid)', desc:'Terminal emulator — do NOT use Play Store version', cmd:'# Install Termux from F-Droid, not Google Play', type:'manual'},
        {name:'Termux:API', desc:'Access Android APIs from Termux', cmd:'pkg install termux-api', type:'manual'},
        {name:'Termux:Widget', desc:'Run scripts from home screen', cmd:'# Install from F-Droid', type:'manual'},
        {name:'pkg update + upgrade', desc:'Update Termux packages', cmd:'pkg update -y && pkg upgrade -y', type:'manual'},
        {name:'build tools', desc:'git, curl, wget, clang', cmd:'pkg install -y git curl wget clang make', type:'manual'},
        {name:'Python + pip', desc:'Python in Termux', cmd:'pkg install -y python && pip install --upgrade pip', type:'manual'},
        {name:'Node.js', desc:'Node LTS in Termux', cmd:'pkg install -y nodejs-lts', type:'manual'},
        {name:'Rust', desc:'Rust in Termux', cmd:'pkg install -y rust', type:'manual'},
        {name:'proot-distro', desc:'Run full Linux distros in Termux', cmd:'pkg install -y proot-distro', type:'manual'},
      ]},
    { id:'d-cliai', icon:'🖥️', title:'CLI AI TOOLS (TERMUX)',
      items:[
        {name:'Claude Code (Hermes) — limited', desc:'May need proot Ubuntu', cmd:'npm install -g @anthropic-ai/claude-code', type:'manual'},
        {name:'Shell-GPT', desc:'LLM in terminal', cmd:'pip install shell-gpt', type:'manual'},
        {name:'LLM (Willison)', desc:'Universal LLM CLI', cmd:'pip install llm', type:'manual'},
      ]},
    { id:'d-sovereign', icon:'🛡️', title:'SOVEREIGN STACK',
      items:[
        {name:'Ollama (Termux)', desc:'Local LLM — compile or use prebuilt', cmd:'# pkg install ollama  or  proot-distro install ubuntu && run Ollama there', type:'manual'},
        {name:'Ollama in proot Ubuntu', desc:'Full Ollama in proot environment', cmd:'proot-distro install ubuntu && proot-distro login ubuntu -- curl -fsSL https://ollama.com/install.sh | sh', type:'manual'},
        {name:'LocalSend (F-Droid)', desc:'Sovereign LAN file transfer', cmd:'# Install "LocalSend" from F-Droid', type:'manual'},
        {name:'Syncthing (F-Droid)', desc:'P2P file sync', cmd:'pkg install -y syncthing', type:'manual'},
        {name:'Tailscale (F-Droid)', desc:'Mesh VPN', cmd:'# Install "Tailscale" from F-Droid', type:'manual'},
      ]},
    { id:'d-companions', icon:'🤝', title:'COMPANION MODELS',
      items:[
        {name:'Alfred — mistral:latest', desc:'Always warm', cmd:'ollama pull mistral:latest', type:'manual'},
        {name:'Steward — phi3:latest', desc:'Always warm', cmd:'ollama pull phi3:latest', type:'manual'},
        {name:'Scout — phi3:mini', desc:'Always warm', cmd:'ollama pull phi3:mini', type:'manual'},
        {name:'nomic-embed-text', desc:'RAG embeddings', cmd:'ollama pull nomic-embed-text', type:'manual'},
      ]},
    { id:'d-native', icon:'📱', title:'NATIVE APPS (F-Droid / APK)',
      items:[
        {name:'F-Droid', desc:'Open-source app store', cmd:'# Install from f-droid.org', type:'manual'},
        {name:'NewPipe', desc:'Privacy YouTube client', cmd:'# Install from F-Droid', type:'manual'},
        {name:'VLC', desc:'Universal media player', cmd:'# Install from F-Droid or Play Store', type:'manual'},
        {name:'Kodi', desc:'Media center — T1NK3R.TV frontend', cmd:'# Install from F-Droid or official site', type:'manual'},
        {name:'MPV', desc:'CLI/GPU media player', cmd:'# Install from F-Droid', type:'manual'},
        {name:'Obsidian', desc:'Markdown PKM vault', cmd:'# Install from Play Store or APK', type:'manual'},
        {name:'Termux + widgets', desc:'Run scripts from home screen', cmd:'# Install Termux:Widget from F-Droid', type:'manual'},
        {name:'Aurora Store', desc:'Google Play alternative', cmd:'# Install from F-Droid', type:'manual'},
        {name:'Shelter', desc:'App isolation / work profile', cmd:'# Install from F-Droid', type:'manual'},
      ]},
    { id:'d-proot', icon:'🐧', title:'PROOT DISTROS',
      items:[
        {name:'Ubuntu in proot', desc:'Full Ubuntu userspace', cmd:'proot-distro install ubuntu && proot-distro login ubuntu', type:'manual'},
        {name:'Debian in proot', desc:'Full Debian userspace', cmd:'proot-distro install debian && proot-distro login debian', type:'manual'},
        {name:'Alpine in proot', desc:'Lightweight Alpine', cmd:'proot-distro install alpine && proot-distro login alpine', type:'manual'},
        {name:'Arch in proot', desc:'Arch Linux in Termux', cmd:'proot-distro install archlinux && proot-distro login archlinux', type:'manual'},
        {name:'Fedora in proot', desc:'Fedora in Termux', cmd:'proot-distro install fedora && proot-distro login fedora', type:'manual'},
      ]},
    { id:'d-crosstech', icon:'🔗', title:'CROSS-TECH EXTENSIONS',
      items:[
        {name:'OpenRouter env', desc:'Set API key in Termux', cmd:'echo "export OPENROUTER_API_KEY=***" >> ~/.bashrc && source ~/.bashrc', type:'manual'},
        {name:'SSH to Pi5', desc:'Quick SSH from Termux', cmd:'ssh tinkerv@192.168.1.110', type:'manual'},
        {name:'SFTP file transfer', desc:'Transfer files to/from Android', cmd:'# Use sftp, rsync, or Syncthing', type:'manual'},
      ]},
  ],
};

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════
const allTabs = ['win','cachy','bazzite','fedora','ubuntu','arch','macos','ipados','android'];

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════
const jsState = {win:{}, cachy:{}, bazzite:{}, fedora:{}, ubuntu:{}, arch:{}, macos:{}, ipados:{}, android:{}};
const catState = {win:{}, cachy:{}, bazzite:{}, fedora:{}, ubuntu:{}, arch:{}, macos:{}, ipados:{}, android:{}};
const catFilter = {win:'all', cachy:'all', bazzite:'all', fedora:'all', ubuntu:'all', arch:'all', macos:'all', ipados:'all', android:'all'};
const catSearch = {win:'', cachy:'', bazzite:'', fedora:'', ubuntu:'', arch:'', macos:'', ipados:'', android:''};
let activeTab = 'win';
let orVisible = false;

// Init state
allTabs.forEach(os => {
  JUMPSTART[os].forEach(it => { jsState[os][it.id] = false; });
  CATS[os].forEach(cat => { cat.items.forEach((_,i) => { catState[os][`${cat.id}_${i}`] = false; }); });
});

// ═══════════════════════════════════════════════════════════════
// TAB
// ═══════════════════════════════════════════════════════════════
function switchTab(os) {
  activeTab = os;
  allTabs.forEach(t => {
    const tabEl = document.getElementById(`tab-${t}`);
    const contentEl = document.getElementById(`content-${t}`);
    if (tabEl) tabEl.classList.toggle('active', t===os);
    if (contentEl) contentEl.classList.toggle('active', t===os);
  });
  updateCount();
}

// ═══════════════════════════════════════════════════════════════
// JUMPSTART
// ═══════════════════════════════════════════════════════════════
function renderJS(os) {
  const el = document.getElementById(`js-items-${os}`);
  el.innerHTML = JUMPSTART[os].map(it => `
    <div class="js-item ${jsState[os][it.id]?'checked':''}" onclick="toggleJS('${os}','${it.id}')">
      <div class="js-check">${jsState[os][it.id]?'✓':''}</div>
      <div class="js-info">
        <div class="js-name">${it.name}<span class="js-tier js-tier-${it.tier}">${it.tier}</span></div>
        <div class="js-desc">${it.desc}</div>
        <div class="js-cmd-preview">${it.cmd.substring(0,80)}${it.cmd.length>80?'...':''}</div>
      </div>
    </div>`).join('');
}
function toggleJS(os,id){ jsState[os][id]=!jsState[os][id]; renderJS(os); updateCount(); }
function armJS(os){ JUMPSTART[os].forEach(it=>{ jsState[os][it.id]=true; }); renderJS(os); updateCount(); }
function disarmJS(os){ JUMPSTART[os].forEach(it=>{ jsState[os][it.id]=false; }); renderJS(os); updateCount(); }
function armAllJS(){ allTabs.forEach(os=>armJS(os)); }
function disarmAllJS(){ allTabs.forEach(os=>disarmJS(os)); }

// ═══════════════════════════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════════════════════════
function buildGrid(os) {
  const grid = document.getElementById(`grid-${os}`);
  grid.innerHTML = '';
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
              <div class="item-name">${it.name}<span class="tag tag-${it.type}">${it.type}</span></div>
              <div class="item-desc">${it.desc}</div>
              <div class="item-cmd">${it.cmd}</div>
            </div>
          </label>`;
        }).join('')}
      </div>`;
    grid.appendChild(el);
  });
}

function toggleCat(os, catId) { document.getElementById(`cat-${os}-${catId}`).classList.toggle('collapsed'); }

function toggleCat_item(os, key, catId) {
  catState[os][key] = !catState[os][key];
  const el = document.getElementById(`item-${os}-${key}`);
  el.classList.toggle('checked', catState[os][key]);
  el.querySelector('.check-box').textContent = catState[os][key] ? '✓' : '';
  updateBadge(os, catId);
  updateCount();
}

function updateBadge(os, catId) {
  const cat = CATS[os].find(c=>c.id===catId);
  const total=cat.items.length, done=cat.items.filter((_,i)=>catState[os][`${catId}_${i}`]).length;
  const pct=total?(done/total*100):0;
  document.getElementById(`badge-${os}-${catId}`).textContent=`${done}/${total}`;
  document.getElementById(`badge-${os}-${catId}`).className=`cat-badge ${done===total?'done':''}`;
  document.getElementById(`prog-${os}-${catId}`).style.width=pct+'%';
}

function filterCat(os, mode) { catFilter[os]=mode; applyFilter(os); }
function searchCat(os, val) { catSearch[os]=val; applyFilter(os); }

function applyFilter(os) {
  const q=catSearch[os].toLowerCase(), mode=catFilter[os];
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

function clearOS(os) {
  Object.keys(catState[os]).forEach(k=>catState[os][k]=false);
  disarmJS(os); buildGrid(os); updateCount();
}

function updateCount() {
  const os=activeTab;
  const jsC=Object.values(jsState[os]).filter(Boolean).length;
  const catC=Object.values(catState[os]).filter(Boolean).length;
  document.getElementById('totalCount').textContent=jsC+catC;
}

function armCATS(os) {
  CATS[os].forEach(cat => cat.items.forEach((_,i) => { catState[os][`${cat.id}_${i}`] = true; }));
  buildGrid(os); updateCount();
}
function disarmCATS(os) {
  CATS[os].forEach(cat => cat.items.forEach((_,i) => { catState[os][`${cat.id}_${i}`] = false; }));
  buildGrid(os); updateCount();
}
function armAllCATS(){ allTabs.forEach(os=>armCATS(os)); }
function disarmAllCATS(){ allTabs.forEach(os=>disarmCATS(os)); }

function addAll() {
  allTabs.forEach(os => { armJS(os); armCATS(os); });
  updateCount();
}

// ═══════════════════════════════════════════════════════════════
// OPENROUTER API KEY VERIFICATION — real check against OpenRouter's
// own API, not just a format check.
// ═══════════════════════════════════════════════════════════════
async function verifyOpenRouterKey(key) {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      }
    });
    const statusCode = response.status;
    let data = {};
    try { data = await response.json(); } catch (e) {}
    return {
      valid: statusCode === 200,
      statusCode,
      data,
      error: statusCode !== 200 ? (data.error?.message || `HTTP ${statusCode}`) : null
    };
  } catch (err) {
    return { valid: false, statusCode: 0, data: {}, error: `Network error: ${err.message}` };
  }
}

// ═══════════════════════════════════════════════════════════════
// OPENROUTER
// ═══════════════════════════════════════════════════════════════
function toggleOR() {
  const p=document.getElementById('orPanel');
  p.classList.toggle('open');
  document.getElementById('orChevron').textContent=p.classList.contains('open')?'▲':'▼';
}
function toggleORvis() {
  orVisible=!orVisible;
  document.getElementById('orKey').type=orVisible?'text':'password';
  document.querySelector('.or-show').textContent=orVisible?'🙈 HIDE':'👁 SHOW';
}
function clearOR() {
  document.getElementById('orKey').value='';
  document.getElementById('orStatus').className='or-status info';
  document.getElementById('orStatus').textContent='Paste your OpenRouter key and click IMPORT.';
  document.getElementById('orOut').classList.remove('show');
}
function copyOR() {
  navigator.clipboard.writeText(document.getElementById('orCode').textContent).then(()=>{
    const b=document.querySelector('#orOut .or-show'); b.textContent='[ COPIED! ]';
    setTimeout(()=>b.textContent='[ COPY ]',2000);
  });
}
async function applyOR() {
  const key=document.getElementById('orKey').value.trim();
  const st=document.getElementById('orStatus');
  if(!key){st.className='or-status err';st.textContent='✕ No key entered.';return;}
  if(!key.startsWith('sk-or')){st.className='or-status err';st.textContent='✕ Invalid format — should start with sk-or-...';return;}

  const masked=key.slice(0,12)+'••••••••••••'+key.slice(-4);
  st.className='or-status info';
  st.textContent='🔄 Verifying key with OpenRouter API...';

  const verification = await verifyOpenRouterKey(key);
  if (!verification.valid) {
    st.className='or-status err';
    st.textContent=`✕ Key verification failed: ${verification.error || `HTTP ${verification.statusCode}`}`;
    document.getElementById('orOut').classList.remove('show');
    return;
  }

  st.className='or-status ok';st.textContent=`✓ Key verified: ${masked}`;
  document.getElementById('orCode').textContent=buildORScript(key);
  document.getElementById('orOut').classList.add('show');
  const isLinux = detectedOS !== 'win';
  document.getElementById('orLabel').textContent = isLinux ? '// LINUX BASH — paste into konsole and hit Enter' : '// POWERSHELL — save as setup_openrouter.ps1 and run as Admin';
  document.getElementById('orHint').textContent = isLinux ? '⚠ Do NOT run as ./script.sh in fish — paste directly or: bash setup_openrouter.sh' : '⚠ Right-click PowerShell → Run as Administrator before pasting';
}

function buildORScript(key) {
  const masked=key.slice(0,12)+'...'+key.slice(-4);
  const os = detectedOS === 'win' ? 'win' : 'linux';

  if (os === 'win') {
    return `# T1NK3R-VER53 // OpenRouter Key Setup — WINDOWS / TINY11
# Save as setup_openrouter.ps1 — Run in PowerShell as Admin
# ══════════════════════════════════════════════════════════════
$keyValue = "${key}"
$envDir = "$env:APPDATA\\tinker-verse"
$envFile = "$envDir\\openrouter.env"
if (!(Test-Path $envDir)) { New-Item -ItemType Directory -Force -Path $envDir | Out-Null }
@"
OPENROUTER_API_KEY=$keyValue
OR_BASE_URL=https://openrouter.ai/api/v1
"@ | Set-Content $envFile -Encoding UTF8
[System.Environment]::SetEnvironmentVariable("OPENROUTER_API_KEY", $keyValue, "User")
[System.Environment]::SetEnvironmentVariable("OR_BASE_URL", "https://openrouter.ai/api/v1", "User")
Write-Host "OK Key set: ${masked}" -ForegroundColor Green
Write-Host "OK Env file: $envFile" -ForegroundColor Green`;
  } else {
    // Linux/macOS/etc — writes the env file only, never touches ~/.bashrc,
    // ~/.zshrc, or any other shell startup file. You decide if/how to load it.
    return `mkdir -p ~/.config/tinker-verse
printf 'export OPENROUTER_API_KEY="${key}"\\nexport OR_BASE_URL="https://openrouter.ai/api/v1"\\n' > ~/.config/tinker-verse/openrouter.env
chmod 600 ~/.config/tinker-verse/openrouter.env
source ~/.config/tinker-verse/openrouter.env
echo "OK key set: ${masked}"
echo "OK file: ~/.config/tinker-verse/openrouter.env"
echo ""
echo "NOTE: this only exported the key into the CURRENT shell session."
echo "Nothing was added to ~/.bashrc, ~/.zshrc, or any startup file — by design."
echo "To use it again later, run:"
echo "  source ~/.config/tinker-verse/openrouter.env"
echo "(or add that line to your own shell config yourself, if you want it automatic)"`;
  }
}

// ═══════════════════════════════════════════════════════════════
// SCRIPT GENERATORS
// ═══════════════════════════════════════════════════════════════
function generateScript(os) {
  let script='';
  if(os==='win') script=genWin();
  else if(os==='cachy') script=genCachy();
  else if(os==='bazzite') script=genBazzite();
  else if(os==='fedora') script=genFedora();
  else if(os==='ubuntu') script=genUbuntu();
  else if(os==='arch') script=genArch();
  else if(os==='macos') script=genMacos();
  else if(os==='ipados') script=genIpados();
  else if(os==='android') script=genAndroid();
  document.getElementById(`code-${os}`).textContent=script;
  const p=document.getElementById(`out-${os}`);
  p.classList.add('visible'); if (typeof p.scrollIntoView === 'function') p.scrollIntoView({behavior:'smooth'});
}

function collectJSItems(os) { return JUMPSTART[os].filter(it=>jsState[os][it.id]); }
function collectCatItems(os) {
  const items=[];
  CATS[os].forEach(cat=>cat.items.forEach((it,i)=>{ if(catState[os][`${cat.id}_${i}`]) items.push(it); }));
  return items;
}

function genWin() {
  const js=collectJSItems('win'), cat=collectCatItems('win');
  const all=[...js,...cat];
  const winget=all.filter(i=>i.type==='winget').map(i=>i.cmd);
  const npm=all.filter(i=>i.type==='npm').map(i=>i.cmd);
  const choco=all.filter(i=>i.type==='choco').map(i=>i.cmd);
  const ps=all.filter(i=>i.type==='ps').map(i=>i.cmd)
    .filter(c=>!/IsInRole|chocolatey\.org\/install\.ps1/.test(c)); // already hardcoded as Step 0/2
  const ollama=all.filter(i=>i.type==='ollama').map(i=>i.cmd);
  const esc=s=>s.replace(/'/g,"''"); // single-quote escape for PS literals
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

# ── T1NK3R INSTALL HELPERS ────────────────────────────────────
# winget does NOT throw on failure — it only sets \$LASTEXITCODE, so a
# try/catch never catches "already installed" / "no applicable upgrade".
# We inspect the code, treat benign ones as success, then RESET it so a
# nonzero winget result can't poison a later if(\$LASTEXITCODE) check.
\$ErrorActionPreference = "Continue"
# benign: 0 success | already-installed | no-applicable-upgrade | reboot-required
\$WingetBenign = @(0, -1978335189, -1978335212, -1978335135, -1978334967, -1978335216)
function Inst-Winget([string]\$Cmd) {
  Write-Host "  > \$Cmd" -ForegroundColor DarkGray
  Invoke-Expression \$Cmd
  \$code = \$LASTEXITCODE
  if (\$null -eq \$code -or \$WingetBenign -contains \$code) {
    Write-Host "    ok" -ForegroundColor Green
  } else {
    Write-Host "    exit \$code - review (continuing)" -ForegroundColor Yellow
  }
  \$global:LASTEXITCODE = 0
}
function Inst-Run([string]\$Cmd) {
  Write-Host "  > \$Cmd" -ForegroundColor DarkGray
  try { Invoke-Expression \$Cmd } catch { Write-Host "    warn: \$(\$_.Exception.Message)" -ForegroundColor Yellow }
  \$global:LASTEXITCODE = 0
}

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
${uniq(winget).map(c=>`Inst-Winget '${esc(c)}'`).join('\n')}
`:'# ── STEP 3: No winget packages selected\n'}
${choco.length?`# ── STEP 4: CHOCOLATEY PACKAGES ──────────────────────────────
Write-Host "[4/6] Installing Chocolatey packages..." -ForegroundColor Yellow
${uniq(choco).map(c=>`Inst-Run '${esc(c)}'`).join('\n')}
`:''}
# ── STEP 5: NPM + AI CLI TOOLS ────────────────────────────────
Write-Host "[5/6] Installing npm + CLI AI tools..." -ForegroundColor Yellow
# Requires Node.js to be installed (Step 3)
$env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
${uniq(npm).map(c=>`Inst-Run '${esc(c)}'`).join('\n')}

# ── STEP 6: OLLAMA MODELS ─────────────────────────────────────
Write-Host "[6/6] Pulling Ollama companion models..." -ForegroundColor Yellow
# Requires Ollama to be installed and running
Start-Sleep -Seconds 5
${uniq(ollama).map(c=>`Inst-Run '${esc(c)}'`).join('\n')}

${manual.length?`# ── MANUAL STEPS (do these yourself) ─────────────────────────
${uniq(manual).join('\n')}
`:''}
${ps.length?`# ── ADDITIONAL POWERSHELL STEPS ──────────────────────────────
${uniq(ps).map(c=>`Inst-Run '${esc(c)}'`).join('\n')}
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
  const sh=[...new Set(all.filter(i=>i.type==='sh').map(i=>i.cmd))];
  const note=all.filter(i=>i.type==='note').map(i=>`# NOTE: ${i.name} — ${i.cmd}`);

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

${sh.length?`# ── EXTRA SETUP (compound / raw commands) ─────────────────────
step "extra — raw setup commands"
${sh.map(c=>`( ${c} ) || warn "raw step failed"`).join('\n')}
ok "Extra setup done"
`:''}${note.length?`# ── NOTES (auto-handled / pre-installed) ─────────────────────
${note.join('\n')}
`:''}# ── STEP 8: GROUPS + SERVICES ─────────────────────────────────
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
  const sh=[...new Set(all.filter(i=>i.type==='sh').map(i=>i.cmd))];
  const note=all.filter(i=>i.type==='note').map(i=>`# NOTE: ${i.name} — ${i.cmd}`);

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
${toolbox.map(c=>`${c} || warn "toolbox step failed"`).join('\n')}
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

${sh.length?`# ── EXTRA SETUP (compound / raw commands) ─────────────────────
step "extra — raw setup commands (run inside toolbox where needed)"
${sh.map(c=>`( ${c} ) || warn "raw step failed"`).join('\n')}
ok "Extra setup done"
`:''}${note.length?`# ── NOTES (auto-handled / pre-installed) ─────────────────────
${note.join('\n')}
`:''}
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

function genFedora() {
  const js=collectJSItems('fedora'), cat=collectCatItems('fedora');
  const all=[...js,...cat];
  const dnf=[...new Set(all.filter(i=>i.type==='dnf').map(i=>{
    const m=i.cmd.match(/sudo dnf install -y (.+)/);
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
  const sh=[...new Set(all.filter(i=>i.type==='sh').map(i=>i.cmd))];
  const note=all.filter(i=>i.type==='note').map(i=>`# NOTE: ${i.name} — ${i.cmd}`);

  return `#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════
# T1NK3R-VER53 // FEDORA BOOTSTRAP — FRESH INSTALL
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
command -v dnf >/dev/null 2>&1 || { err "dnf not found — are you on Fedora?"; exit 1; }

echo -e "⚡ \${GREEN}T1NK3R-VER53 // FEDORA DEPLOYMENT INITIATED\${RESET}"

# ── STEP 1: SYSTEM UPDATE ─────────────────────────────────────
step "1/8 — Full system update"
sudo dnf upgrade -y --refresh || warn "Update had issues — continuing"
ok "System up to date"

# ── STEP 2: RPM FUSION REPOS ──────────────────────────────────
step "2/8 — RPM Fusion (free + nonfree)"
if ! rpm -q rpmfusion-free-release >/dev/null 2>&1; then
  sudo dnf install -y \\
    https://download1.rpmfusion.org/free/fedora/rpmfusion-free-release-$(rpm -E %fedora).noarch.rpm \\
    https://download1.rpmfusion.org/nonfree/fedora/rpmfusion-nonfree-release-$(rpm -E %fedora).noarch.rpm || warn "RPM Fusion install issue"
  ok "RPM Fusion enabled"
else
  ok "RPM Fusion already present"
fi

# ── STEP 3: FLATPAK + FLATHUB ─────────────────────────────────
step "3/8 — Flatpak + Flathub"
flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo || true
ok "Flathub ready"

# ── STEP 4: LANG RUNTIMES (nvm, Rust, pipx) ──────────────────
step "4/8 — Language runtimes (nvm → Node, Rust, pipx)"
# Install build tools first
sudo dnf groupinstall -y "Development Tools" 2>/dev/null || sudo dnf install -y gcc make git || true
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
sudo dnf install -y pipx 2>/dev/null || pip install --user pipx || true
pipx ensurepath || true
ok "pipx ready"

${dnf.length?`# ── STEP 5: DNF PACKAGES ──────────────────────────────────────
step "5/8 — dnf packages"
sudo dnf install -y \\
  ${dnf.join(' \\\n  ')} || warn "Some dnf packages may have failed"
ok "dnf done"
`:'# ── STEP 5: No dnf packages selected\n'}
${flatpak.length?`# ── STEP 5b: FLATPAK PACKAGES ───────────────────────────────
step "5b — Flatpak packages"
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

${sh.length?`# ── EXTRA SETUP (compound / raw commands) ─────────────────────
step "extra — raw setup commands"
${sh.map(c=>`( ${c} ) || warn "raw step failed"`).join('\n')}
ok "Extra setup done"
`:''}${note.length?`# ── NOTES (auto-handled / pre-installed) ─────────────────────
${note.join('\n')}
`:''}# ── STEP 8: GROUPS + SERVICES ─────────────────────────────────
step "8/8 — User groups + services"
sudo usermod -aG docker,audio,video,input,storage "$USER" 2>/dev/null || true
# realtime group if realtime-setup installed
getent group realtime >/dev/null 2>&1 && sudo usermod -aG realtime "$USER" || true
sudo systemctl enable --now docker 2>/dev/null || true
ok "Groups + services configured"

${manual.length?`# ── MANUAL STEPS ──────────────────────────────────────────────
${manual.join('\n')}
`:''}
echo ""
echo "══════════════════════════════════════════════════════"
echo -e "⚡ \${GREEN}T1NK3R-VER53 // FEDORA DEPLOYMENT COMPLETE\${RESET}"
echo -e "  \${AMBER}→ Reboot recommended\${RESET}"
echo -e "  \${AMBER}→ Then: ollama serve &\${RESET}"
echo -e "  \${AMBER}→ Open WebUI: http://localhost:3000\${RESET}"
echo "══════════════════════════════════════════════════════"`;
}


function genUbuntu() {
  const js=collectJSItems('ubuntu'), cat=collectCatItems('ubuntu');
  const all=[...js,...cat];
  const apt=[...new Set(all.filter(i=>i.type==='apt').map(i=>{
    const m=i.cmd.match(/sudo\\s+apt\\s+(?:install|update|upgrade)\s+-y\s+(.+)/);
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
  const sh=[...new Set(all.filter(i=>i.type==='sh').map(i=>i.cmd))];
  const note=all.filter(i=>i.type==='note').map(i=>`# NOTE: ${i.name} — ${i.cmd}`);

  return `#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════
# T1NK3R-VER53 // UBUNTU/DEBIAN BOOTSTRAP — FRESH INSTALL
# Generated by T1NK3R.TRIBOOT // NANITE GOD MODE
# bash install.sh        ← run with bash explicitly
# ══════════════════════════════════════════════════════════════
set -euo pipefail

RED="\\033[0;31m"; GREEN="\\033[0;32m"; AMBER="\\033[0;33m"; BLUE="\\033[0;34m"; RESET="\\033[0m"
ok()   { echo -e "\${GREEN}[OK]\${RESET} $*"; }
warn() { echo -e "\${AMBER}[WARN]\${RESET} $*"; }
err()  { echo -e "\${RED}[ERR]\${RESET} $*" >&2; }
step() { echo -e "\${BLUE}══ $* \${RESET}"; }

[[ $(id -u) -eq 0 ]] && { err "Do not run as root."; exit 1; }
command -v apt >/dev/null 2>&1 || { err "apt not found — are you on Ubuntu/Debian?"; exit 1; }

echo -e "⚡ \${GREEN}T1NK3R-VER53 // UBUNTU DEPLOYMENT INITIATED\${RESET}"

# ── STEP 1: SYSTEM UPDATE ─────────────────────────────────────
step "1/8 — Full system update"
sudo apt update -y && sudo apt upgrade -y || warn "Update had issues — continuing"
ok "System up to date"

# ── STEP 2: BUILD ESSENTIALS ──────────────────────────────────
step "2/8 — Build tools"
sudo apt install -y build-essential git curl wget software-properties-common || warn "Build tools issue"
ok "Build tools ready"

# ── STEP 3: FLATPAK + FLATHUB ─────────────────────────────────
step "3/8 — Flatpak + Flathub"
sudo apt install -y flatpak || true
flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo || true
ok "Flathub ready"

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
pip install --user pipx && python3 -m pipx ensurepath 2>/dev/null || true
ok "pipx ready"

${apt.length?`# ── STEP 5: APT PACKAGES ──────────────────────────────────────
step "5/8 — apt packages"
sudo apt install -y \\
  ${apt.join(' \\\n  ')} || warn "Some apt packages may have failed"
ok "apt done"
`:'# ── STEP 5: No apt packages selected\n'}${flatpak.length?`# ── STEP 5b: FLATPAK PACKAGES ───────────────────────────────
step "5b — Flatpak packages"
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

${sh.length?`# ── EXTRA SETUP (compound / raw commands) ─────────────────────
step "extra — raw setup commands"
${sh.map(c=>`( ${c} ) || warn "raw step failed"`).join('\n')}
ok "Extra setup done"
`:''}${note.length?`# ── NOTES (auto-handled / pre-installed) ─────────────────────
${note.join('\n')}
`:''}# ── STEP 8: GROUPS + SERVICES ─────────────────────────────────
step "8/8 — User groups + services"
sudo usermod -aG docker,audio,video,input,storage "$USER" 2>/dev/null || true
sudo systemctl enable --now docker 2>/dev/null || true
ok "Groups + services configured"

${manual.length?`# ── MANUAL STEPS ──────────────────────────────────────────────
${manual.join('\n')}
`:''}
echo ""
echo "══════════════════════════════════════════════════════"
echo -e "⚡ \${GREEN}T1NK3R-VER53 // UBUNTU DEPLOYMENT COMPLETE\${RESET}"
echo -e "  \${AMBER}→ Reboot recommended\${RESET}"
echo -e "  \${AMBER}→ Then: ollama serve &\${RESET}"
echo -e "  \${AMBER}→ Open WebUI: http://localhost:3000\${RESET}"
echo "══════════════════════════════════════════════════════"`;
}

function genArch() {
  const js=collectJSItems('arch'), cat=collectCatItems('arch');
  const all=[...js,...cat];
  const pacman=[...new Set(all.filter(i=>i.type==='pacman').map(i=>{
    const m=i.cmd.match(/sudo\\s+pacman\\s+-S\\s+--needed\\s+--noconfirm\\s+(.+)/);
    return m?m[1].trim():null;
  }).filter(Boolean))];
  const aur=[...new Set(all.filter(i=>i.type==='aur').map(i=>{
    const m=i.cmd.match(/(?:yay|paru)\\s+-S\\s+--needed\\s+--noconfirm\\s+(.+)/);
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
  const sh=[...new Set(all.filter(i=>i.type==='sh').map(i=>i.cmd))];
  const note=all.filter(i=>i.type==='note').map(i=>`# NOTE: ${i.name} — ${i.cmd}`);

  return `#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════
# T1NK3R-VER53 // ARCH BOOTSTRAP — FRESH INSTALL
# Generated by T1NK3R.TRIBOOT // NANITE GOD MODE
# bash install.sh        ← run with bash explicitly
# ══════════════════════════════════════════════════════════════
set -euo pipefail

RED="\\033[0;31m"; GREEN="\\033[0;32m"; AMBER="\\033[0;33m"; BLUE="\\033[0;34m"; RESET="\\033[0m"
ok()   { echo -e "\${GREEN}[OK]\${RESET} $*"; }
warn() { echo -e "\${AMBER}[WARN]\${RESET} $*"; }
err()  { echo -e "\${RED}[ERR]\${RESET} $*" >&2; }
step() { echo -e "\${BLUE}══ $* \${RESET}"; }

[[ $(id -u) -eq 0 ]] && { err "Do not run as root."; exit 1; }
command -v pacman >/dev/null 2>&1 || { err "pacman not found — are you on Arch?"; exit 1; }

echo -e "⚡ \${GREEN}T1NK3R-VER53 // ARCH DEPLOYMENT INITIATED\${RESET}"

# ── STEP 1: SYSTEM UPDATE ─────────────────────────────────────
step "1/9 — Full system update"
sudo pacman -Syu --noconfirm || warn "Update had issues — continuing"
ok "System up to date"

# ── STEP 2: BASE DEVEL + GIT ──────────────────────────────────
step "2/9 — base-devel + git"
sudo pacman -S --needed --noconfirm base-devel git curl wget || warn "base-devel issue"
ok "base-devel ready"

# ── STEP 3: YAY AUR HELPER ────────────────────────────────────
step "3/9 — yay (AUR helper)"
if ! command -v yay >/dev/null 2>&1; then
  cd /tmp
  git clone https://aur.archlinux.org/yay.git
  cd yay && makepkg -si --noconfirm
  cd ~ && rm -rf /tmp/yay
  ok "yay installed"
else ok "yay already present"; fi

# ── STEP 4: FLATPAK + FLATHUB ─────────────────────────────────
step "4/9 — Flatpak + Flathub"
sudo pacman -S --needed --noconfirm flatpak || true
flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo || true
ok "Flathub ready"

# ── STEP 5: LANG RUNTIMES (nvm, Rust, pipx) ──────────────────
step "5/9 — Language runtimes (nvm → Node, Rust, pipx)"
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
python3 -m pip install --user pipx && python3 -m pipx ensurepath 2>/dev/null || true
ok "pipx ready"

${pacman.length?`# ── STEP 6: PACMAN PACKAGES ───────────────────────────────────
step "6/9 — pacman packages"
sudo pacman -S --needed --noconfirm \\
  ${pacman.join(' \\\n  ')} || warn "Some pacman packages may have failed"
ok "pacman done"
`:'# ── STEP 6: No pacman packages selected\n'}${aur.length?`# ── STEP 7: AUR PACKAGES ──────────────────────────────────────
step "7/9 — AUR packages via yay"
${aur.map(p=>`yay -S --needed --noconfirm ${p} || warn "AUR: ${p}"`).join('\n')}
ok "AUR done"
`:''}${flatpak.length?`# ── STEP 8: FLATPAK PACKAGES ──────────────────────────────────
step "8/9 — Flatpak packages"
${flatpak.map(p=>`flatpak install -y flathub ${p} || warn "flatpak: ${p}"`).join('\n')}
ok "Flatpak done"
`:''}
# ── STEP 9: CLI AI TOOLS + OLLAMA ─────────────────────────────
step "9/9 — CLI AI tools + Ollama"
export NVM_DIR="$HOME/.nvm"; [[ -s "$NVM_DIR/nvm.sh" ]] && source "$NVM_DIR/nvm.sh"
${npm.map(c=>`${c} || warn "npm failed: ${c}"`).join('\n')}
${pip.map(c=>`${c} || warn "pip failed: ${c}"`).join('\n')}
${cargo.map(c=>`${c} || warn "cargo failed: ${c}"`).join('\n')}
if ! command -v ollama >/dev/null 2>&1; then
  curl -fsSL https://ollama.com/install.sh | sh
fi
sudo systemctl enable --now ollama 2>/dev/null || true
sleep 4
${ollama.map(m=>`ollama pull ${m} || warn "ollama pull failed: ${m}"`).join('\n')}
ok "CLI tools + companions done"

${sh.length?`# ── EXTRA SETUP (compound / raw commands) ─────────────────────
step "extra — raw setup commands"
${sh.map(c=>`( ${c} ) || warn "raw step failed"`).join('\n')}
ok "Extra setup done"
`:''}${note.length?`# ── NOTES (auto-handled / pre-installed) ─────────────────────
${note.join('\n')}
`:''}${manual.length?`# ── MANUAL STEPS ──────────────────────────────────────────────
${manual.join('\n')}
`:''}
echo ""
echo "══════════════════════════════════════════════════════"
echo -e "⚡ \${GREEN}T1NK3R-VER53 // ARCH DEPLOYMENT COMPLETE\${RESET}"
echo -e "  \${AMBER}→ Reboot recommended\${RESET}"
echo -e "  \${AMBER}→ Then: ollama serve &\${RESET}"
echo -e "  \${AMBER}→ Open WebUI: http://localhost:3000\${RESET}"
echo "══════════════════════════════════════════════════════"`;
}

function genMacos() {
  const js=collectJSItems('macos'), cat=collectCatItems('macos');
  const all=[...js,...cat];
  const brew=[...new Set(all.filter(i=>i.type==='brew').map(i=>{
    const m=i.cmd.match(/brew\s+(?:install|upgrade|tap)\s+(.+)/);
    return m?m[1].trim():null;
  }).filter(Boolean))];
  const npm=[...new Set(all.filter(i=>i.type==='npm').map(i=>i.cmd))];
  const pip=[...new Set(all.filter(i=>i.type==='pip').map(i=>i.cmd))];
  const cargo=[...new Set(all.filter(i=>i.type==='cargo').map(i=>i.cmd))];
  const ollama=[...new Set(all.filter(i=>i.type==='ollama').map(i=>i.cmd.replace('ollama pull','').trim()))];
  const manual=all.filter(i=>i.type==='manual').map(i=>`# MANUAL: ${i.name}\n# ${i.cmd}`);
  const sh=[...new Set(all.filter(i=>i.type==='sh').map(i=>i.cmd))];
  const note=all.filter(i=>i.type==='note').map(i=>`# NOTE: ${i.name} — ${i.cmd}`);

  return `#!/usr/bin/env zsh
# ══════════════════════════════════════════════════════════════
# T1NK3R-VER53 // MACOS BOOTSTRAP — FRESH INSTALL
# Generated by T1NK3R.TRIBOOT // NANITE GOD MODE
# zsh install.sh        ← run with zsh explicitly
# ══════════════════════════════════════════════════════════════
set -euo pipefail

RED="\\033[0;31m"; GREEN="\\033[0;32m"; AMBER="\\033[0;33m"; BLUE="\\033[0;34m"; RESET="\\033[0m"
ok()   { echo -e "\${GREEN}[OK]\${RESET} $*"; }
warn() { echo -e "\${AMBER}[WARN]\${RESET} $*"; }
err()  { echo -e "\${RED}[ERR]\${RESET} $*" >&2; }
step() { echo -e "\${BLUE}══ $* \${RESET}"; }

echo -e "⚡ \${GREEN}T1NK3R-VER53 // MACOS DEPLOYMENT INITIATED\${RESET}"

# ── STEP 1: HOMEBREW ──────────────────────────────────────────
step "1/7 — Homebrew"
if ! command -v brew >/dev/null 2>&1; then
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  eval "$(/opt/homebrew/bin/brew shellenv)" 2>/dev/null || eval "$(/usr/local/bin/brew shellenv)" 2>/dev/null || true
  ok "Homebrew installed"
else ok "Homebrew found"; fi
brew update || true

# ── STEP 2: XCODE COMMAND LINE TOOLS ──────────────────────────
step "2/7 — Xcode CLI tools"
xcode-select --install 2>/dev/null || ok "Xcode CLI tools already present"

# ── STEP 3: LANG RUNTIMES (nvm, Rust, pipx) ──────────────────
step "3/7 — Language runtimes (nvm → Node, Rust, pipx)"
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
python3 -m pip install --user pipx && python3 -m pipx ensurepath 2>/dev/null || true
ok "pipx ready"

${brew.length?`# ── STEP 4: BREW PACKAGES ─────────────────────────────────────
step "4/7 — Homebrew packages"
brew install \\
  ${brew.join(' \\\n  ')} || warn "Some brew packages may have failed"
ok "brew done"
`:'# ── STEP 4: No brew packages selected\n'}
# ── STEP 5: CLI AI TOOLS ──────────────────────────────────────
step "5/7 — CLI AI tools"
export NVM_DIR="$HOME/.nvm"; [[ -s "$NVM_DIR/nvm.sh" ]] && source "$NVM_DIR/nvm.sh"
${npm.map(c=>`${c} || warn "npm failed: ${c}"`).join('\n')}
${pip.map(c=>`${c} || warn "pip failed: ${c}"`).join('\n')}
${cargo.map(c=>`${c} || warn "cargo failed: ${c}"`).join('\n')}
ok "CLI AI tools done"

# ── STEP 6: OLLAMA + COMPANIONS ───────────────────────────────
step "6/7 — Ollama + companion models"
if ! command -v ollama >/dev/null 2>&1; then
  brew install ollama || curl -fsSL https://ollama.com/install.sh | sh
fi
${ollama.map(m=>`ollama pull ${m} || warn "ollama pull failed: ${m}"`).join('\n')}
ok "Companions pulled"

${sh.length?`# ── EXTRA SETUP (compound / raw commands) ─────────────────────
step "extra — raw setup commands"
${sh.map(c=>`( ${c} ) || warn "raw step failed"`).join('\n')}
ok "Extra setup done"
`:''}${note.length?`# ── NOTES (auto-handled / pre-installed) ─────────────────────
${note.join('\n')}
`:''}${manual.length?`# ── MANUAL STEPS ──────────────────────────────────────────────
${manual.join('\n')}
`:''}
echo ""
echo "══════════════════════════════════════════════════════"
echo -e "⚡ \${GREEN}T1NK3R-VER53 // MACOS DEPLOYMENT COMPLETE\${RESET}"
echo -e "  \${AMBER}→ Then: ollama serve &\${RESET}"
echo -e "  \${AMBER}→ Open WebUI: http://localhost:3000\${RESET}"
echo "══════════════════════════════════════════════════════"`;
}

function genIpados() {
  const js=collectJSItems('ipados'), cat=collectCatItems('ipados');
  const all=[...js,...cat];
  const pip=[...new Set(all.filter(i=>i.type==='pip').map(i=>i.cmd))];
  const npm=[...new Set(all.filter(i=>i.type==='npm').map(i=>i.cmd))];
  const manual=all.filter(i=>i.type==='manual').map(i=>`# MANUAL: ${i.name}\n# ${i.cmd}`);
  const note=all.filter(i=>i.type==='note').map(i=>`# NOTE: ${i.name} — ${i.cmd}`);
  const sh=[...new Set(all.filter(i=>i.type==='sh').map(i=>i.cmd))];

  return `# ══════════════════════════════════════════════════════════════
# T1NK3R-VER53 // IPADOS SETUP GUIDE
# Generated by T1NK3R.TRIBOOT // NANITE GOD MODE
# Run these commands in a-Shell or iSH on iPadOS.
# ══════════════════════════════════════════════════════════════

WARNING: iPadOS is sandboxed — many desktop tools are unavailable.
Recommended: use a-Shell (App Store) or iSH (TestFlight).

# ── STEP 1: PYTHON + PIP ──────────────────────────────────────
python3 -m ensurepip --upgrade 2>/dev/null || true

# ── STEP 2: PIP TOOLS ─────────────────────────────────────────
${pip.length?pip.map(c=>`${c} || echo "warn: ${c}"`).join('\n'):'# No pip tools selected'}

# ── STEP 3: NODE/NPM TOOLS ────────────────────────────────────
${npm.length?npm.map(c=>`${c} || echo "warn: ${c}"`).join('\n'):'# No npm tools selected'}

${sh.length?`# ── EXTRA COMMANDS ────────────────────────────────────────────
${sh.map(c=>`${c} || echo "warn: failed"`).join('\n')}
`:''}${note.length?`# ── NOTES ─────────────────────────────────────────────────────
${note.join('\n')}
`:''}${manual.length?`# ── MANUAL STEPS ──────────────────────────────────────────────
${manual.join('\n')}
`:''}
echo "══════════════════════════════════════════════════════"
echo "⚡ T1NK3R-VER53 // IPADOS SETUP GUIDE COMPLETE"
echo "   Ollama on iPadOS is experimental (limited to a-Shell/iSH)."
echo "══════════════════════════════════════════════════════"`;
}

function genAndroid() {
  const js=collectJSItems('android'), cat=collectCatItems('android');
  const all=[...js,...cat];
  const pkg=[...new Set(all.filter(i=>i.type==='pkg').map(i=>{
    const m=i.cmd.match(/pkg\s+(?:install|update|upgrade)\s+-y\s+(.+)/);
    return m?m[1].trim():null;
  }).filter(Boolean))];
  const pip=[...new Set(all.filter(i=>i.type==='pip').map(i=>i.cmd))];
  const npm=[...new Set(all.filter(i=>i.type==='npm').map(i=>i.cmd))];
  const cargo=[...new Set(all.filter(i=>i.type==='cargo').map(i=>i.cmd))];
  const ollama=[...new Set(all.filter(i=>i.type==='ollama').map(i=>i.cmd.replace('ollama pull','').trim()))];
  const manual=all.filter(i=>i.type==='manual').map(i=>`# MANUAL: ${i.name}\n# ${i.cmd}`);
  const sh=[...new Set(all.filter(i=>i.type==='sh').map(i=>i.cmd))];
  const note=all.filter(i=>i.type==='note').map(i=>`# NOTE: ${i.name} — ${i.cmd}`);

  return `#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════
# T1NK3R-VER53 // ANDROID/TERMUX BOOTSTRAP
# Generated by T1NK3R.TRIBOOT // NANITE GOD MODE
# Run inside Termux on Android.
# ══════════════════════════════════════════════════════════════
set -euo pipefail

RED="\\033[0;31m"; GREEN="\\033[0;32m"; AMBER="\\033[0;33m"; BLUE="\\033[0;34m"; RESET="\\033[0m"
ok()   { echo -e "\${GREEN}[OK]\${RESET} $*"; }
warn() { echo -e "\${AMBER}[WARN]\${RESET} $*"; }
err()  { echo -e "\${RED}[ERR]\${RESET} $*" >&2; }
step() { echo -e "\${BLUE}══ $* \${RESET}"; }

echo -e "⚡ \${GREEN}T1NK3R-VER53 // ANDROID/TERMUX DEPLOYMENT INITIATED\${RESET}"

# ── STEP 1: TERMUX UPDATE ─────────────────────────────────────
step "1/5 — Termux package update"
pkg update -y && pkg upgrade -y || warn "Update had issues — continuing"
ok "Termux up to date"

# ── STEP 2: ESSENTIALS ────────────────────────────────────────
step "2/5 — Essential packages"
pkg install -y git curl wget python nodejs-lts rust || warn "Some essentials failed"
ok "Essentials ready"

${pkg.length?`# ── STEP 3: PKG PACKAGES ──────────────────────────────────────
step "3/5 — pkg packages"
${pkg.map(p=>`pkg install -y ${p} || warn "pkg: ${p}"`).join('\n')}
ok "pkg done"
`:'# ── STEP 3: No pkg packages selected\n'}
# ── STEP 4: PIP + NPM + CARGO ─────────────────────────────────
step "4/5 — pip + npm + cargo tools"
${pip.map(c=>`${c} || warn "pip failed: ${c}"`).join('\n')}
${npm.map(c=>`${c} || warn "npm failed: ${c}"`).join('\n')}
${cargo.map(c=>`${c} || warn "cargo failed: ${c}"`).join('\n')}
ok "Tools installed"

# ── STEP 5: OLLAMA + COMPANIONS ───────────────────────────────
step "5/5 — Ollama + companions"
if command -v ollama >/dev/null 2>&1; then
  ${ollama.map(m=>`ollama pull ${m} || warn "ollama pull failed: ${m}"`).join('\n')}
  ok "Companions pulled"
else
  warn "Ollama not found in Termux — may need prooted Linux or manual build"
fi

${sh.length?`# ── EXTRA SETUP ───────────────────────────────────────────────
step "extra — raw setup commands"
${sh.map(c=>`${c} || warn "raw step failed"`).join('\n')}
ok "Extra setup done"
`:''}${note.length?`# ── NOTES ─────────────────────────────────────────────────────
${note.join('\n')}
`:''}${manual.length?`# ── MANUAL STEPS ──────────────────────────────────────────────
${manual.join('\n')}
`:''}
echo ""
echo "══════════════════════════════════════════════════════"
echo -e "⚡ \${GREEN}T1NK3R-VER53 // ANDROID/TERMUX DEPLOYMENT COMPLETE\${RESET}"
echo -e "  \${AMBER}→ Ollama may require prooted environment on older devices\${RESET}"
echo "══════════════════════════════════════════════════════"`;
}

// downloadScript(os) is provided by tauri-bridge.js — it saves via the
// native Tauri dialog when running as a desktop app, falling back to a
// browser blob-download automatically outside Tauri. Not redefined here
// so that Tauri-aware version isn't silently overwritten.

function copyScript(os) {
  const isLinux = os === 'cachy' || os === 'bazzite' || os === 'fedora' || os === 'ubuntu' || os === 'arch';
  const text = isLinux
    ? 'bash ~/Downloads/tinker_install.sh'
    : document.getElementById(`code-${os}`).textContent;
  navigator.clipboard.writeText(text).then(()=>{
    const b=document.querySelector(`#out-${os} .copy-btn`);
    const orig = isLinux ? '[ COPY RUN COMMAND ]' : '[ COPY TO CLIPBOARD ]';
    b.textContent='[ COPIED! ]'; setTimeout(()=>b.textContent=orig,2000);
  });
}

// ═══════════════════════════════════════════════════════════════
// TYPE NORMALIZER
// Guarantees every item (JUMPSTART + CATS) carries a `type` the
// generators understand. Retrofits the type-less JUMPSTART items,
// repairs `ollama pull` rows that were mislabeled, and reroutes
// compound/raw commands to an executable bucket so nothing silently
// drops out of the generated script. Idempotent — safe to re-run.
// ═══════════════════════════════════════════════════════════════
function inferType(cmd, os){
  const c=(cmd||'').trim();
  if(!c || c.startsWith('#')) return 'note';            // pure comment / pre-installed note
  if(/\bollama\s+pull\b/.test(c)) return 'ollama';       // model pull — always its own step
  const compound=/&&|\|\||;|\||\$\(|`|>>|\bsource\b/.test(c);
  if(os==='win'){
    if(/^winget\s+(install|upgrade|uninstall)\b/.test(c) && !compound) return 'winget';
    if(/^choco\s+\w/.test(c)                          && !compound) return 'choco';
    if(/^npm\s+(install|update|i)\b/.test(c)          && !compound) return 'npm';
    return 'ps';                                         // raw PowerShell — runs verbatim
  }
  // linux: cachy / bazzite / fedora / ubuntu / arch
  if(/^sudo\s+pacman\s+-S\s+--needed\s+--noconfirm\s+/.test(c) && !compound) return 'pacman';
  if(/^(?:yay|paru)\s+-S\s+--needed\s+--noconfirm\s+/.test(c)  && !compound) return 'aur';
  if(/^flatpak\s+install\s+-y\s+flathub\s+/.test(c)            && !compound) return 'flatpak';
  if(/^sudo\s+apt\s+(install|update|upgrade)/.test(c)            && !compound) return 'apt';
  if(/^sudo\s+dnf\s+install\s+-y\s+/.test(c)                   && !compound) return 'dnf';
  if(/^rpm-ostree\s+install\s+/.test(c)                        && !compound) return 'ostree';
  if(/^brew\s+(install|upgrade|tap)\b/.test(c)                  && !compound) return 'brew';
  if(/^toolbox\s+/.test(c))               return 'toolbox';   // runs verbatim (compound ok inside bash -c)
  if(/^pkg\s+(install|update|upgrade)\b/.test(c)                && !compound) return 'pkg';
  if(/^npm\s+(install|update|i)\b/.test(c)) return 'npm';     // runs verbatim
  if(/^pip(x)?\s+install\b/.test(c) && !compound) return 'pip';
  if(/^cargo\s+install\b/.test(c))         return 'cargo';    // runs verbatim
  return 'sh';                                                // raw bash — runs verbatim
}
function normalizeTypes(){
  const fix=(it,os)=>{
    if(it.type==='manual') return;          // preserve authored manual notes (git-clone/venv, key placeholders)
    const t=inferType(it.cmd, os);
    if(it.type!==t) it.type=t;
  };
  allTabs.forEach(os=>{
    (JUMPSTART[os]||[]).forEach(it=>fix(it,os));
    (CATS[os]||[]).forEach(cat=>cat.items.forEach(it=>fix(it,os)));
  });
}

// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════
normalizeTypes();

async function initApp() {
  // If Tauri bridge loaded first and set window.detectOS, use it
  if (typeof window !== 'undefined' && window.__TAURI__ && window.detectOS && window.detectOS !== detectOS) {
    await window.detectOS();
  } else {
    detectOS();
  }
  allTabs.forEach(os => {
    renderJS(os);
    buildGrid(os);
  });
  updateCount();
  // Show default tab
  if (allTabs.includes(detectedOS)) switchTab(detectedOS);
  else switchTab('win');
}

// ═══════════════════════════════════════════════════════════════
// EXPOSE TO WINDOW (for inline onclick handlers when loaded as module)
// ═══════════════════════════════════════════════════════════════
Object.assign(window, {
  switchTab, toggleJS, armJS, disarmJS, armAllJS, disarmAllJS,
  toggleCat, toggleCat_item, armCATS, disarmCATS, armAllCATS, disarmAllCATS,
  applyFilter, filterCat, searchCat,
  toggleOR, toggleORvis, applyOR, clearOR, copyOR,
  copyScript, generateScript,
  addAll,
  updateBadge, updateCount,
  setCrossWarnings, renderDetect, renderArchBadge,
  clearOS,
  buildGrid, renderJS,
  initApp, detectOS, detectArch,
  saveScriptToDisk, browserDownload, runNativeInstall, copyToClipboard
});

initApp();