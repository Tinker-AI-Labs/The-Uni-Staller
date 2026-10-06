// ═══════════════════════════════════════════════════════════════
// JUMPSTART ENGINE — data + script generators for the seven OS tabs
// (win / cachy / bazzite / fedora / ubuntu / arch / android).
// win / cachy / bazzite came from the recovered 2026-08-28 prototype;
// fedora / ubuntu / arch / android were built out afterwards against
// each platform's own package manager.
// This does NOT replace OS detection (tauri-bridge.js) or the
// OpenRouter panel (app.js).
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// DATA — JUMPSTART items and CATS categories per OS now live in
// src/data/*.json (base.json + one file per OS) and are merged and
// validated by data-loader.js at startup. See loadEngineData() below.
// ═══════════════════════════════════════════════════════════════
let JUMPSTART = {};
let CATS = {};
let dataErrors = [];

// ═══════════════════════════════════════════════════════════════
// STATE — every tab in allTabs gets a slot so nothing crashes before
// (or without) data; initEngineState() fills in the item flags once the
// data has loaded.
// ═══════════════════════════════════════════════════════════════
const jsState = {}, catState = {}, catFilter = {}, catSearch = {};
let activeTab = 'win';

(typeof allTabs !== 'undefined' ? allTabs : ['win','cachy','bazzite']).forEach(os => {
  jsState[os] = {}; catState[os] = {}; catFilter[os] = 'all'; catSearch[os] = '';
});
function initEngineState() {
  Object.keys(JUMPSTART).forEach(os => { JUMPSTART[os].forEach(it => { jsState[os][it.id] = false; }); });
  Object.keys(CATS).forEach(os => { CATS[os].forEach(cat => { cat.items.forEach((_,i) => { catState[os][`${cat.id}_${i}`] = false; }); }); });
}

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
  else if (os==='android') script=genAndroid();
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
${toolbox.map(c=>`${c} || warn "toolbox: ${c.substring(0,50).replace(/[\"$`\\]/g,'')}..."`).join('\n')}
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
// BUCKETS — shared by the fedora/ubuntu/arch/android
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
  const { ollamaInstall, services, servicesReportOwnStatus, closing } = opts;
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
${servicesReportOwnStatus ? '' : 'ok "Services configured"'}
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
  // Runtimes are only installed for the item types that need them.
  const needPipx = b.pip.length > 0, needRust = b.cargo.length > 0, needNode = b.npm.length > 0;
  // base-devel + git: makepkg needs both for AUR builds; cargo install compiles
  // crates and needs a C compiler/linker (gcc, make) from base-devel.
  const needBuild = aur.length > 0 || needRust;
  // realtime-privileges only when an audio or DAW category item is selected.
  const needRealtime = CATS.arch.some(c => (c.id === 'a-daw' || c.id === 'a-audio') &&
    c.items.some((_, i) => catState.arch && catState.arch[`${c.id}_${i}`]));
  const groups = ['realtime', 'audio', 'video', 'input', 'storage'].concat(hasDocker ? ['docker'] : []);
  return `${unixHeader('ARCH LINUX', 'pacman', 'pacman not found — is this Arch?')}

${needBuild ? `# ── STEP 1: BASE-DEVEL + GIT ──────────────────────────────────
step "1/6 — base-devel + git"
sudo pacman -S --needed --noconfirm base-devel git || warn "base-devel issue"
` : '# ── STEP 1: base-devel + git not needed (no AUR or cargo items selected)\n'}
${aur.length ? `# ── STEP 2: AUR HELPER ────────────────────────────────────────
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
` : '# ── STEP 2: No AUR packages selected — yay not installed\n'}
# ── STEP 3: FLATPAK + RUNTIMES ────────────────────────────────
step "3/6 — Flatpak + language runtimes"
sudo pacman -S --needed --noconfirm flatpak fuse2 || warn "flatpak/fuse2 install issue"
sudo flatpak remote-add --system --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo || warn "could not add the Flathub remote"
${needPipx || needRust || needNode ? `# pipx ensurepath and the nvm installer append to the shell rc files; record
# them first so the script can say exactly which ones changed.
RC_FILES=("$HOME/.bashrc" "$HOME/.bash_profile" "$HOME/.profile" "$HOME/.zshrc" "$HOME/.zprofile")
rc_hash() { if [[ -e "$1" ]]; then sha256sum "$1" | cut -d' ' -f1; else echo absent; fi; }
declare -A RC_BEFORE
for f in "\${RC_FILES[@]}"; do RC_BEFORE[$f]=$(rc_hash "$f"); done
` : ''}${needRust ? `sudo pacman -S --needed --noconfirm rustup || warn "rustup install issue"
rustup default stable || warn "rustup default stable failed"
` : ''}${needPipx ? `sudo pacman -S --needed --noconfirm python-pipx || warn "pipx install issue"
pipx ensurepath || warn "pipx ensurepath failed"
` : ''}${needNode ? `if [[ ! -d "$HOME/.nvm" ]]; then
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash || warn "nvm install failed"
  export NVM_DIR="$HOME/.nvm"; source "$NVM_DIR/nvm.sh" && nvm install --lts || warn "Node LTS install failed"
fi
` : ''}${needPipx || needRust || needNode ? `RC_EDITED=()
for f in "\${RC_FILES[@]}"; do [[ "\${RC_BEFORE[$f]}" == "$(rc_hash "$f")" ]] || RC_EDITED+=("$f"); done
if (( \${#RC_EDITED[@]} )); then ok "Shell rc files edited: \${RC_EDITED[*]}"; else ok "No shell rc files were edited"; fi
` : '# No pipx/rustup/nvm items selected — runtimes and shell rc files left alone\n'}ok "Flatpak and runtimes step done"

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
if sudo flatpak remotes --system --columns=name 2>/dev/null | grep -qx flathub; then
${b.flatpak.map(p => `  sudo flatpak install -y --system flathub ${p} || warn "flatpak: ${p}"`).join('\n')}
  ok "Flatpak done"
else
  warn "Flathub remote is missing — skipping Flatpak packages"
fi
` : '# ── STEP 5: No flatpak packages selected\n'}
${unixTail(b, {
  ollamaInstall: `if ! command -v ollama >/dev/null 2>&1; then
  sudo pacman -S --needed --noconfirm ollama || curl -fsSL https://ollama.com/install.sh | sh
fi
sudo systemctl enable --now ollama 2>/dev/null || true`,
  servicesReportOwnStatus: true,
  services: `${needRealtime ? `sudo pacman -S --needed --noconfirm realtime-privileges || warn "realtime-privileges install failed"
` : ''}GROUPS_ADDED=(); GROUPS_SKIPPED=(); GROUPS_FAILED=()
for g in ${groups.join(' ')}; do
  if ! getent group "$g" >/dev/null; then GROUPS_SKIPPED+=("$g")
  elif sudo usermod -aG "$g" "$USER"; then GROUPS_ADDED+=("$g")
  else GROUPS_FAILED+=("$g"); fi
done
echo "  groups added:   \${GROUPS_ADDED[*]:-none}"
echo "  groups skipped (do not exist on this system): \${GROUPS_SKIPPED[*]:-none}"
SERVICE_FAIL=0
${hasDocker ? `sudo systemctl enable --now docker || { warn "could not enable docker.service"; SERVICE_FAIL=1; }
` : ''}if (( \${#GROUPS_FAILED[@]} )); then warn "usermod failed for: \${GROUPS_FAILED[*]}"; SERVICE_FAIL=1; fi
if (( SERVICE_FAIL )); then warn "Services/groups step finished with failures"; else ok "Services configured"; fi`,
  closing: [
    '⚡ ${GREEN}T1NK3R-VER53 // ARCH DEPLOYMENT COMPLETE${RESET}',
    '  ${AMBER}→ Never partial-upgrade: use pacman -Syu, not -Sy pkg${RESET}',
    '  ${AMBER}→ Then: ollama serve &${RESET}',
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


// ═══════════════════════════════════════════════════════════════
// COPY SCRIPT — uses the Tauri-aware clipboard helper already
// defined in tauri-bridge.js (falls back to navigator.clipboard
// automatically outside Tauri).
// ═══════════════════════════════════════════════════════════════
function copyScript(os) {
  // Tabs that produce a downloadable .sh copy the run command instead of the
  // whole script; win (.ps1) copies its text.
  const isShellScript = ['cachy','bazzite','fedora','ubuntu','arch','android'].includes(os);
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
// DATA LOADING + INIT — fetch base.json and every OS file, merge and
// validate them (data-loader.js), then render each tab. Anything wrong
// is shown in a readable banner; the page never goes blank.
// ═══════════════════════════════════════════════════════════════
function fetchDataJSON(path) {
  return fetch(path).then(r => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.text();
  }).then(t => {
    try { return JSON.parse(t); }
    catch (e) { throw new Error(`invalid JSON (${e.message})`); }
  });
}

function showDataError(errors) {
  let box = document.getElementById('dataError');
  if (!box) {
    box = document.createElement('div');
    box.id = 'dataError';
    box.setAttribute('role', 'alert');
    box.style.cssText = 'margin:12px;padding:12px 16px;border:1px solid var(--red,#ff4444);border-radius:6px;background:rgba(255,68,68,0.08);color:var(--text,#ddd);font-size:12px;line-height:1.6;';
    document.body.insertBefore(box, document.body.firstChild);
  }
  const shown = errors.slice(0, 12);
  box.innerHTML = `<strong style="color:var(--red,#ff4444)">⚠ Some app data could not be loaded.</strong>
    The tabs affected will be empty; everything else still works.
    <ul style="margin:6px 0 0 18px;padding:0;">${shown.map(e => `<li>${esc(e)}</li>`).join('')}</ul>
    ${errors.length > shown.length ? `<div>…and ${errors.length - shown.length} more (see the console).</div>` : ''}
    <div style="margin-top:6px;opacity:.8">If you opened index.html straight from disk, serve the folder instead (for example <code>python3 -m http.server</code> in <code>src/</code>) — browsers block loading data files from file://.</div>`;
}

async function loadEngineData() {
  const tabs = (typeof allTabs !== 'undefined') ? allTabs : [];
  let res;
  try { res = await UniData.loadAll(fetchDataJSON, tabs); }
  catch (e) { res = { jumpstart: {}, cats: {}, errors: [`Unexpected error while loading data: ${e.message}`] }; }
  JUMPSTART = res.jumpstart; CATS = res.cats; dataErrors = res.errors;
  initEngineState();
  (typeof allTabs !== 'undefined' ? allTabs : []).forEach(os => { renderJS(os); buildGrid(os); });
  updateCount();
  if (dataErrors.length) { console.error('[Uni-Staller] data problems:\n' + dataErrors.join('\n')); showDataError(dataErrors); }
}

// Resolves once the data is loaded and every tab is rendered.
const dataReady = loadEngineData().catch(e => {
  console.error('[Uni-Staller] startup failed:', e);
  showDataError([`Startup failed: ${e.message}`]);
});
