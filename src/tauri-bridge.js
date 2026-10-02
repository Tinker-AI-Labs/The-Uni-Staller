// ═══════════════════════════════════════════════════════════════
// TAURI v2 BRIDGE — wraps Rust commands for frontend use
// ═══════════════════════════════════════════════════════════════
const IS_TAURI = typeof window !== 'undefined' && !!window.__TAURI__;
const CORE = IS_TAURI ? window.__TAURI__.core : null;
const EVENT = IS_TAURI ? window.__TAURI__.event : null;

let tauriPlatform = null;
let tauriPkgManagers = [];

// Shared state read by app.js (e.g. applyOR()) — must exist before any
// script tries to read them, and before detection has actually run.
let detectedOS = 'win';
let detectedArch = 'unknown';

// The 9 OS tabs that actually exist in index.html (content-<id> / tab-<id>).
const allTabs = ['win','cachy','bazzite','fedora','ubuntu','arch','macos','ipados','android'];

// ═══════════════════════════════════════════════════════════════
// TAB SWITCHING — pure UI, matches styles.css's .tab.active /
// .tab-content.active convention exactly (verified against styles.css).
// ═══════════════════════════════════════════════════════════════
function switchTab(os) {
  if (!allTabs.includes(os)) os = 'win';
  if (typeof activeTab !== 'undefined') activeTab = os;

  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

  const tabEl = document.getElementById('tab-' + os);
  const contentEl = document.getElementById('content-' + os);
  if (tabEl) tabEl.classList.add('active');
  if (contentEl) contentEl.classList.add('active');

  // Cross-OS banner: only show on the tab you're viewing, only when it
  // isn't the detected OS. (xbanner-<os> elements already exist in HTML.)
  allTabs.forEach(t => {
    const banner = document.getElementById('xbanner-' + t);
    if (banner) banner.style.display = (t === os && os !== detectedOS) ? '' : 'none';
  });

  if (typeof updateCount === 'function') updateCount();
}
window.switchTab = switchTab;

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
      if (!allTabs.includes(newOS)) newOS = 'win';
      detectedOS = newOS;
    } catch(e) {
      console.error('[Uni-Staller] detect_platform failed, defaulting to win:', e);
      detectedOS = 'win';
      detectedArch = 'unknown';
    }

    const osBadge = document.getElementById('osBadge');
    const archBadge = document.getElementById('archBadge');
    const banner = document.getElementById('detectBanner');

    if (osBadge) {
      osBadge.className = 'os-badge ' + detectedOS;
      osBadge.textContent = detectedOS.toUpperCase();
    }
    if (archBadge) {
      const archClass = detectedArch === 'aarch64' ? 'aarch64' : detectedOS;
      archBadge.className = 'os-badge ' + archClass;
      archBadge.textContent = String(detectedArch).toUpperCase();
    }
    if (banner) {
      banner.className = 'detect-banner ' + detectedOS;
      const available = (tauriPkgManagers || []).filter(p => p.available).map(p => p.name);
      banner.textContent = 'Detected: ' + detectedOS.toUpperCase() +
        (available.length ? ' — package managers: ' + available.join(', ') : '');
    }

    switchTab(detectedOS);
  }

  window.detectOS = detectOS_tauri;

  // Install progress listener
  EVENT.listen('install-progress', (event) => {
    const { step, status, output } = event.payload;
    appendToTerminal(step, status, output);
  });
}

// Plain-browser fallback: no Rust backend, so read the user agent.
// Linux can't be narrowed past "some Linux" here — cachy is the tab
// that opens, and every other tab still works in cross-OS mode.
if (!IS_TAURI) {
  window.detectOS = function detectOS_browser() {
    const ua = navigator.userAgent || '';
    const uaData = navigator.userAgentData || null;
    const plat = (uaData && uaData.platform) || ua;

    if (/Android/i.test(ua)) detectedOS = 'android';
    else if (/iPad|iPhone|iPod/i.test(ua) || (/Mac/i.test(plat) && navigator.maxTouchPoints > 1)) detectedOS = 'ipados';
    else if (/Win/i.test(plat)) detectedOS = 'win';
    else if (/Mac/i.test(plat)) detectedOS = 'macos';
    else if (/Ubuntu/i.test(ua)) detectedOS = 'ubuntu';
    else if (/Fedora/i.test(ua)) detectedOS = 'fedora';
    else if (/Linux|X11/i.test(plat)) detectedOS = 'cachy';
    else detectedOS = 'win';

    detectedArch = /aarch64|arm64/i.test(ua) ? 'aarch64'
                 : /x86_64|Win64|x64/i.test(ua) ? 'x86_64'
                 : 'unknown';

    const osBadge = document.getElementById('osBadge');
    const archBadge = document.getElementById('archBadge');
    const banner = document.getElementById('detectBanner');
    if (osBadge) { osBadge.className = 'os-badge ' + detectedOS; osBadge.textContent = detectedOS.toUpperCase(); }
    if (archBadge) {
      archBadge.className = 'os-badge ' + (detectedArch === 'aarch64' ? 'aarch64' : detectedOS);
      archBadge.textContent = detectedArch.toUpperCase();
    }
    if (banner) {
      banner.className = 'detect-banner ' + detectedOS;
      banner.textContent = 'Detected from browser: ' + detectedOS.toUpperCase() +
        ' — package managers are not probed outside the Tauri app. Switch tabs freely.';
    }
    switchTab(detectedOS);
  };
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
// EXTERNAL LINKS — http(s) only. Tauri: opener plugin (the "opener:default"
// capability is granted); plain browser: window.open.
// ═══════════════════════════════════════════════════════════════
async function openExternal(url) {
  if (!/^https?:\/\//i.test(url || '')) return false;
  if (IS_TAURI) {
    try { await CORE.invoke('plugin:opener|open_url', { url }); return true; }
    catch (e) { console.warn('[Uni-Staller] could not open link:', e); return false; }
  }
  window.open(url, '_blank', 'noopener');
  return true;
}

// ═══════════════════════════════════════════════════════════════
// PATCH: replace downloadScript() with Tauri-aware version
// ═══════════════════════════════════════════════════════════════
window.downloadScript = async function(os) {
  const code = document.getElementById(`code-${os}`)?.textContent;
  if (!code) return;
  await saveScriptToDisk(os, code);
};
