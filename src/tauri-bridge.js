// ═══════════════════════════════════════════════════════════════
// TAURI v2 BRIDGE — wraps Rust commands for frontend use
// ═══════════════════════════════════════════════════════════════
const IS_TAURI = typeof window !== 'undefined' && !!window.__TAURI__;
const CORE = IS_TAURI ? window.__TAURI__.core : null;
const EVENT = IS_TAURI ? window.__TAURI__.event : null;

let tauriPlatform = null;
let tauriPkgManagers = [];

// Override detectOS when inside Tauri — use Rust's native detection
if (IS_TAURI) {
  console.log('[Uni-Staller] Tauri v2 native bridge active');

  async function detectOS_tauri() {
    try {
      tauriPlatform = await CORE.invoke('detect_platform');
      tauriPkgManagers = await CORE.invoke('detect_pkg_managers');
      detectedArch = tauriPlatform.arch;

      let newOS = tauriPlatform.os_id;
      if (newOS === 'linux') newOS = 'cachy';
      detectedOS = newOS;
    } catch(e) {
      console.error('Tauri detect_platform failed:', e);
      detectOS(); // real browser-based fallback in app.js (was: nonexistent detectOS_legacy)
      return;
    }
    renderDetect();
    renderArchBadge();

    if (detectedOS === 'linux') switchTab('cachy');
    else if (allTabs.includes(detectedOS)) switchTab(detectedOS);
    else switchTab('win');

    const available = tauriPkgManagers.filter(p => p.available).map(p => p.name);
    if (available.length > 0) {
      const banner = document.getElementById('detectBanner');
      if (banner) {
        banner.innerHTML += `<br><span style="color:var(--green)">Available: ${available.join(', ')}</span>`;
      }
    }
  }

  window.detectOS = detectOS_tauri;

  // Install progress listener
  EVENT.listen('install-progress', (event) => {
    const { step, status, output } = event.payload;
    appendToTerminal(step, status, output);
  });
}

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════
function appendToTerminal(step, status, output) {
  const term = document.getElementById('installTerminal');
  if (!term) return;

  const line = document.createElement('div');
  line.className = 'term-line';
  line.innerHTML = `<span class="term-step">[${status.toUpperCase()}]</span> ${escapeHtml(step)}: <pre class="term-output">${escapeHtml(output)}</pre>`;
  term.appendChild(line);
  term.scrollTop = term.scrollHeight;
}

function escapeHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ═══════════════════════════════════════════════════════════════
// SAVE SCRIPT — via Tauri native save OR browser blob
// ═══════════════════════════════════════════════════════════════
async function saveScriptToDisk(os, content) {
  if (IS_TAURI) {
    const ext = os === 'win' ? 'ps1' : 'sh';
    const defaultName = os === 'win' ? 'tinker_install.ps1' : 'tinker_install.sh';
    try {
      const result = await CORE.invoke('save_script', { content, defaultName });
      if (result.success) {
        alert(`Script saved to: ${result.path}`);
      } else {
        alert(`Save failed: ${result.error || 'Unknown error'}`);
      }
    } catch(e) {
      console.error('save_script failed:', e);
      browserDownload(os, content);
    }
  } else {
    browserDownload(os, content);
  }
}

function browserDownload(os, content) {
  const ext = os === 'win' ? 'ps1' : 'sh';
  const fname = os === 'win' ? 'tinker_install.ps1' : 'tinker_install.sh';
  const blob = new Blob([content], {type: 'text/plain'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fname;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ═══════════════════════════════════════════════════════════════
// NATIVE INSTALL — execute directly via Tauri
// ═══════════════════════════════════════════════════════════════
async function runNativeInstall(os, items, dryRun = true) {
  if (!IS_TAURI) {
    alert('Native execution only available in the Tauri app.\nPlease copy the script and run it manually.');
    return;
  }

  const term = document.getElementById('installTerminal');
  if (term) term.innerHTML = '';

  try {
    await CORE.invoke('run_install', { os, items, dryRun });
  } catch(e) {
    console.error('run_install failed:', e);
    appendToTerminal('ERROR', 'error', e.toString());
  }
}

// ═══════════════════════════════════════════════════════════════
// COPY TO CLIPBOARD
// ═══════════════════════════════════════════════════════════════
async function copyToClipboard(text) {
  if (IS_TAURI && window.__TAURI__.clipboard) {
    await window.__TAURI__.clipboard.writeText(text);
    return true;
  }
  return navigator.clipboard.writeText(text);
}

// ═══════════════════════════════════════════════════════════════
// PATCH: replace downloadScript() with Tauri-aware version
// ═══════════════════════════════════════════════════════════════
window.downloadScript = async function(os) {
  const code = document.getElementById(`code-${os}`)?.textContent;
  if (!code) return;
  await saveScriptToDisk(os, code);
};
