// ═══════════════════════════════════════════════════════════════
// GUIDE — the front screen: "What do you want to do?"
//
// Wings (campus areas) hold needs; each need shows a couple of real options
// from the existing per-OS data (src/data/needs.json points at them by name).
// Nothing is preselected. Picks tick the same JUMPSTART/CATS flags the full
// catalog uses, so the two views always agree. Raw commands stay behind a
// "View script" toggle; installs go preview (dry run) → install, with
// per-item progress, readable errors and retry.
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  const SYS_NAMES = {
    win: 'Windows (Tiny11)', cachy: 'CachyOS', bazzite: 'Bazzite', fedora: 'Fedora',
    ubuntu: 'Ubuntu / Debian', arch: 'Arch Linux', android: 'Android (Termux)',
  };
  const HOW = {
    pacman: 'Installs from the Arch repositories', aur: 'Builds from the AUR (community recipes)',
    flatpak: 'Installs from Flathub', apt: 'Installs with apt', dnf: 'Installs with dnf',
    winget: 'Installs with winget', choco: 'Installs with Chocolatey', npm: 'Installs with npm',
    pip: 'Installs with pip', cargo: 'Builds with cargo', snap: 'Installs with snap',
    ollama: 'Downloads the model with Ollama', termux: 'Installs with pkg (Termux)', pkg: 'Installs with pkg (Termux)',
    toolbox: 'Runs inside the toolbox container', ostree: 'Layers onto the system (needs a reboot)',
    ps: 'Runs a PowerShell step', sh: 'Runs a setup script',
  };

  let NEEDS = null;
  let loadError = null;
  let sysKnown = false;
  const picks = new Set();            // "needId/optionId"
  let view = 'home';                  // home | room | review
  let currentNeed = null;
  let showScript = false;
  let allowAur = false;
  let plan = [];                      // review rows
  let previewed = false;
  let queue = [], qi = 0, running = false, mode = 'idle'; // mode: idle | preview | install

  const $ = id => document.getElementById(id);
  const os = () => (typeof activeTab !== 'undefined' && activeTab) || 'win';
  const announce = msg => { const l = $('guideLive'); if (l) l.textContent = msg; };

  // ── helpers ────────────────────────────────────────────────
  function inferType(item, system) {
    if (item.type) return item.type === 'na' ? 'manual' : item.type;
    const c = item.cmd.trim();
    if (c.startsWith('#')) return 'manual';
    if (/^(sudo\s+)?pacman\b/.test(c)) return 'pacman';
    if (/^(yay|paru)\b/.test(c)) return 'aur';
    if (/^(sudo\s+)?apt(-get)?\b/.test(c)) return 'apt';
    if (/^(sudo\s+)?dnf\b/.test(c)) return 'dnf';
    if (/^winget\b/.test(c)) return 'winget';
    if (/^choco\b/.test(c)) return 'choco';
    if (/^flatpak\b/.test(c)) return 'flatpak';
    if (/^ollama\s+pull\b/.test(c)) return 'ollama';
    if (/^pkg\s+install\b/.test(c)) return 'termux';
    if (/^npm\b/.test(c)) return 'npm';
    if (/^pip3?\b/.test(c)) return 'pip';
    if (/^cargo\b/.test(c)) return 'cargo';
    if (/^toolbox\b/.test(c)) return 'toolbox';
    if (/^rpm-ostree\b/.test(c)) return 'ostree';
    return system === 'win' ? 'ps' : 'sh';
  }

  // A reference like "OrcaSlicer" (CATS) or "js:Ollama 0.17.1+" (JUMPSTART).
  function findRef(system, ref) {
    const wantJS = ref.startsWith('js:');
    const name = wantJS ? ref.slice(3) : ref;
    const js = (JUMPSTART[system] || []).find(i => i.name === name);
    if (wantJS && js) return { item: js, source: 'js', set: v => { jsState[system][js.id] = v; } };
    if (!wantJS) {
      for (const cat of (CATS[system] || [])) {
        const idx = cat.items.findIndex(i => i.name === name);
        if (idx >= 0) return { item: cat.items[idx], source: 'cat', set: v => { catState[system][`${cat.id}_${idx}`] = v; } };
      }
      if (js) return { item: js, source: 'js', set: v => { jsState[system][js.id] = v; } };
    }
    return null;
  }

  function optionRefs(system, opt) {
    const refs = opt.items[system] !== undefined ? opt.items[system] : opt.items['*'];
    if (!refs || !refs.length) return null;
    const found = refs.map(r => findRef(system, r));
    return found.every(Boolean) ? found : null;
  }
  const optionsFor = (system, need) => need.options.map(o => ({ o, refs: optionRefs(system, o) })).filter(x => x.refs);
  const needsFor = system => NEEDS.needs.filter(n => optionsFor(system, n).length);

  // Ticks exactly the items belonging to picked options (union), clears the rest of the guide's items.
  function applyFlags() {
    const system = os();
    NEEDS.needs.forEach(n => n.options.forEach(o => (optionRefs(system, o) || []).forEach(r => r.set(false))));
    NEEDS.needs.forEach(n => n.options.forEach(o => {
      if (picks.has(`${n.id}/${o.id}`)) (optionRefs(system, o) || []).forEach(r => r.set(true));
    }));
    renderJS(system); buildGrid(system); updateCount();
  }

  const tierChip = r => r.source === 'js' && r.item.tier ? `<span class="js-tier js-tier-${esc(r.item.tier)}">${esc(r.item.tier)}</span>` : '';

  // ── system line + picker ───────────────────────────────────
  function fillPickers() {
    ['sysPicker', 'sysPickerTab'].forEach(id => {
      const sel = $(id); if (!sel) return;
      if (!sel.options.length) sel.innerHTML = Object.keys(SYS_NAMES).map(k => `<option value="${k}">${esc(SYS_NAMES[k])}</option>`).join('');
      sel.value = os();
    });
    const nm = $('sysName'), note = $('sysNote');
    if (nm) nm.textContent = SYS_NAMES[os()] || os();
    if (note) note.textContent = os() === detectedOS ? '(detected)' : '(you chose this; detected: ' + (SYS_NAMES[detectedOS] || detectedOS) + ')';
  }
  window.chooseSystem = function (val) { if (val && val !== os()) { resetPicks(); switchTab(val); } };

  // ── views ──────────────────────────────────────────────────
  function show(v) {
    view = v;
    $('guideHome').hidden = v !== 'home';
    $('guideRoom').hidden = v !== 'room';
    $('guideReview').hidden = v !== 'review';
    updateTray();
  }

  function renderHome() {
    const host = $('wings');
    if (loadError) { host.innerHTML = `<div class="guide-error" role="alert">${esc(loadError)}</div>`; return; }
    if (!NEEDS || !sysKnown) { host.innerHTML = '<p class="guide-sub">Getting things ready…</p>'; return; }
    const system = os();
    const needs = needsFor(system);
    if (!needs.length) {
      host.innerHTML = `<p class="guide-sub">There aren't guided picks for ${esc(SYS_NAMES[system] || system)} yet. Use “Browse full catalog” above.</p>`;
      return;
    }
    host.innerHTML = NEEDS.wings.map(w => {
      const ns = needs.filter(n => n.wing === w.id);
      if (!ns.length) return '';
      return `<section class="wing" aria-labelledby="wing-${w.id}">
        <h2 class="wing-name" id="wing-${w.id}"><span aria-hidden="true">${w.icon}</span> ${esc(w.name)}</h2>
        <p class="wing-blurb">${esc(w.blurb)}</p>
        <div class="need-grid">${ns.map(n => {
          const c = n.options.filter(o => picks.has(`${n.id}/${o.id}`)).length;
          return `<button type="button" class="need-tile" data-need="${n.id}">
            <span class="need-icon" aria-hidden="true">${n.icon}</span>
            <span class="need-title">${esc(n.title)}</span>
            <span class="need-blurb">${esc(n.blurb)}</span>
            ${c ? `<span class="need-picked">${c} picked</span>` : ''}
          </button>`;
        }).join('')}</div></section>`;
    }).join('');
    host.querySelectorAll('.need-tile').forEach(b => b.addEventListener('click', () => openNeed(b.dataset.need)));
  }

  function optionScript(refs) {
    return refs.map(r => r.item.cmd).join('\n');
  }

  function renderRoom() {
    const need = NEEDS.needs.find(n => n.id === currentNeed); if (!need) return;
    const wing = NEEDS.wings.find(w => w.id === need.wing);
    const opts = optionsFor(os(), need);
    $('guideRoom').innerHTML = `
      <button type="button" class="link-btn" id="roomBack">← Back to all wings</button>
      <p class="room-wing">${wing ? `<span aria-hidden="true">${wing.icon}</span> ${esc(wing.name)}` : ''}</p>
      <h2 class="room-title" id="roomTitle" tabindex="-1">${esc(need.title)}</h2>
      <p class="guide-sub">Pick the ones you want. You can choose one, both, or neither.</p>
      <div class="opt-grid" role="group" aria-labelledby="roomTitle">${opts.map(({ o, refs }) => {
        const on = picks.has(`${need.id}/${o.id}`);
        const notes = [];
        refs.forEach(r => {
          const t = inferType(r.item, os());
          if (t === 'aur') notes.push('Comes from the AUR (community recipes). Off by default; you can allow it when you review.');
          if (t === 'manual') notes.push('You’ll finish this one by hand. The review step lists exactly what to do.');
        });
        return `<div class="opt-card ${on ? 'on' : ''}">
          <button type="button" class="opt-pick" role="checkbox" aria-checked="${on}" data-opt="${o.id}">
            <span class="opt-check" aria-hidden="true">${on ? '✓' : ''}</span>
            <span class="opt-label">${esc(o.label)} ${refs.map(tierChip).join('')}</span>
            <span class="opt-plain">${esc(o.plain)}</span>
          </button>
          ${notes.length ? `<ul class="opt-notes">${[...new Set(notes)].map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}
          <details class="opt-script"><summary>View script</summary><pre>${esc(optionScript(refs))}</pre></details>
        </div>`;
      }).join('')}</div>`;
    $('roomBack').addEventListener('click', goHome);
    $('guideRoom').querySelectorAll('.opt-pick').forEach(b => b.addEventListener('click', () => {
      const key = `${need.id}/${b.dataset.opt}`;
      picks.has(key) ? picks.delete(key) : picks.add(key);
      applyFlags();
      const f = b.dataset.opt; renderRoom();
      const nb = $('guideRoom').querySelector(`.opt-pick[data-opt="${f}"]`); if (nb) nb.focus();
      announce(`${picks.has(key) ? 'Picked' : 'Removed'} ${need.options.find(o => o.id === f).label}`);
    }));
  }

  function openNeed(id) {
    currentNeed = id; renderRoom(); show('room');
    const h = $('roomTitle'); if (h) h.focus();
  }
  function goHome() {
    const last = currentNeed; renderHome(); show('home');
    const t = last && document.querySelector(`.need-tile[data-need="${last}"]`);
    (t || $('guideTitle')).focus();
  }

  // ── tray ───────────────────────────────────────────────────
  function selectedItems(system) {
    const seen = new Set(), out = [];
    const add = (it, source) => {
      const key = it.cmd + '\u0000' + it.name; if (seen.has(key)) return; seen.add(key);
      out.push({ name: it.name, desc: it.desc, cmd: it.cmd, type: inferType(it, system), tier: source === 'js' ? it.tier : null, source });
    };
    collectJSItems(system).forEach(it => add(it, 'js'));
    collectCatItems(system).forEach(it => add(it, 'cat'));
    return out;
  }
  function updateTray() {
    const tray = $('pickTray'); if (!tray) return;
    if (!NEEDS || !sysKnown) { tray.hidden = true; return; }
    const n = selectedItems(os()).length;
    tray.hidden = !(document.body.classList.contains('mode-guide') && n > 0 && view !== 'review');
    $('trayCount').textContent = `${n} item${n === 1 ? '' : 's'} picked`;
  }
  function resetPicks() {
    picks.clear(); plan = []; previewed = false; allowAur = false; showScript = false;
    if (typeof clearOS === 'function' && sysKnown) clearOS(os());
  }

  // ── review / preview / install ─────────────────────────────
  const runnable = r => r.type !== 'manual';
  function buildPlan() {
    const before = new Map(plan.map(r => [r.name + '\u0000' + r.cmd, r]));
    plan = selectedItems(os()).map(it => Object.assign({ status: 'waiting', output: '' }, it, before.get(it.name + '\u0000' + it.cmd) ? { status: before.get(it.name + '\u0000' + it.cmd).status, output: before.get(it.name + '\u0000' + it.cmd).output } : {}));
  }
  function openReview() {
    buildPlan(); previewed = false; mode = 'idle';
    renderReview(); show('review');
    const h = $('reviewTitle'); if (h) h.focus();
  }

  const STATUS_TEXT = { waiting: 'Waiting', ready: 'Ready', running: 'Working…', ok: 'Done', error: 'Didn’t finish', skipped: 'Skipped' };
  function friendly(r) {
    if (r.status !== 'error') return '';
    const first = (r.output || '').split('\n')[0].trim();
    if (first && !/^\(exit/.test(first)) return first;
    return `Something went wrong while installing ${r.name}.`;
  }
  function rowHTML(r, i) {
    const auto = runnable(r);
    const skipAur = r.type === 'aur' && !allowAur;
    const how = skipAur ? 'Will be skipped: AUR installs are off' : (auto ? (HOW[r.type] || 'Runs a step') : 'You do this one by hand');
    const st = !auto ? 'manual' : r.status;
    const label = !auto ? 'Your turn' : (r.status === 'waiting' && previewed ? (skipAur ? 'Will skip' : 'Ready') : STATUS_TEXT[r.status] || r.status);
    return `<li class="row row-${st}" data-i="${i}">
      <span class="row-icon" aria-hidden="true">${st === 'ok' ? '✓' : st === 'error' ? '✕' : st === 'running' ? '…' : st === 'skipped' ? '–' : st === 'manual' ? '☞' : '•'}</span>
      <div class="row-main">
        <div class="row-name">${esc(r.name)} ${r.tier ? `<span class="js-tier js-tier-${esc(r.tier)}">${esc(r.tier)}</span>` : ''}<span class="tag tag-${esc(r.type)}">${esc(r.type)}</span></div>
        <div class="row-desc">${esc(r.desc)}</div>
        <div class="row-how">${esc(how)}</div>
        ${r.status === 'error' ? `<div class="row-err" role="alert">${esc(friendly(r))}</div>
          <details><summary>Technical details</summary><pre>${esc(r.output)}</pre></details>` : ''}
        ${r.status === 'skipped' && r.output ? `<div class="row-how">${esc(r.output.replace(/^Skipped:\s*/, ''))}</div>` : ''}
        ${showScript ? `<pre class="row-cmd">${esc(r.cmd)}</pre>` : ''}
      </div>
      <div class="row-side"><span class="row-status">${esc(label)}</span>
        ${auto && r.status === 'error' && !running ? `<button type="button" class="btn-small" data-retry="${i}">Retry</button>` : ''}
        ${!running ? `<button type="button" class="btn-small quiet" data-remove="${i}" aria-label="Remove ${esc(r.name)} from the list">Remove</button>` : ''}
      </div></li>`;
  }

  function renderReview() {
    const system = os();
    const auto = plan.filter(runnable), manual = plan.filter(r => !runnable(r));
    const hasAur = plan.some(r => r.type === 'aur');
    const done = auto.filter(r => r.status === 'ok').length, failed = auto.filter(r => r.status === 'error').length,
      skipped = auto.filter(r => r.status === 'skipped').length;
    const finished = mode === 'install' && !running;
    const script = showScript ? scriptFor(system) : '';
    $('guideReview').innerHTML = `
      <button type="button" class="link-btn" id="revBack" ${running ? 'disabled' : ''}>← Keep browsing</button>
      <h2 class="room-title" id="reviewTitle" tabindex="-1">Review your list</h2>
      <p class="guide-sub">${plan.length ? `Setting up <strong>${esc(SYS_NAMES[system] || system)}</strong>. Nothing runs until you preview it and press Install.` : 'Your list is empty. Go back and pick something.'}</p>
      ${plan.length ? `
      <div class="review-controls">
        <button type="button" class="btn" id="btnScript" aria-pressed="${showScript}">${showScript ? 'Hide script' : 'View script'}</button>
        ${hasAur ? `<label class="check-line"><input type="checkbox" id="chkAur" ${allowAur ? 'checked' : ''} ${running ? 'disabled' : ''}> Also allow AUR packages (built from community recipes, not reviewed by Arch)</label>` : ''}
      </div>
      <ol class="rows" id="rows">${plan.map(rowHTML).join('')}</ol>
      ${showScript ? `<div class="script-box"><div class="script-head"><strong>Full script for this list</strong>
          <span><button type="button" class="btn-small" id="btnCopy">Copy</button> <button type="button" class="btn-small" id="btnSave">Save…</button></span></div>
          <pre class="script-pre" tabindex="0">${esc(script)}</pre></div>` : ''}
      <div class="action-bar">
        <button type="button" class="btn" id="btnPreview" ${running || !auto.length ? 'disabled' : ''}>1 · Preview (dry run)</button>
        ${IS_TAURI
          ? `<button type="button" class="btn primary" id="btnInstall" ${(!previewed || running || !auto.length) ? 'disabled' : ''}>2 · Install</button>`
          : `<span class="guide-sub">Installing from inside the app isn’t available in a browser. Use <strong>View script</strong>, then copy or save it and run it in a terminal.</span>`}
        <button type="button" class="btn quiet" id="btnClear" ${running ? 'disabled' : ''}>Start over</button>
      </div>
      ${IS_TAURI && !previewed && auto.length ? '<p class="guide-sub">Run the preview first. It shows exactly what will be installed, without changing anything.</p>' : ''}
      ${finished ? `<p class="summary" role="status">${done} installed${failed ? `, ${failed} didn’t finish` : ''}${skipped ? `, ${skipped} skipped` : ''}${manual.length ? `, ${manual.length} for you to do by hand` : ''}.
        ${failed ? '<button type="button" class="btn-small" id="btnRetryAll">Retry the ones that failed</button>' : ''}</p>` : ''}
      ` : ''}`;
    $('revBack').addEventListener('click', () => { renderHome(); show('home'); $('guideTitle').focus(); });
    if (!plan.length) return;
    $('btnScript').addEventListener('click', () => { showScript = !showScript; renderReview(); $('btnScript').focus(); });
    $('btnClear').addEventListener('click', () => { resetPicks(); renderHome(); show('home'); announce('List cleared'); $('guideTitle').focus(); updateCount(); });
    $('btnPreview').addEventListener('click', doPreview);
    const bi = $('btnInstall'); if (bi) bi.addEventListener('click', doInstall);
    const ca = $('chkAur'); if (ca) ca.addEventListener('change', () => { allowAur = ca.checked; previewed = false; renderReview(); $('chkAur').focus(); });
    const cp = $('btnCopy'); if (cp) cp.addEventListener('click', async () => { try { await copyToClipboard(script); announce('Script copied'); cp.textContent = 'Copied'; } catch (e) { announce('Could not copy'); } });
    const sv = $('btnSave'); if (sv) sv.addEventListener('click', () => saveScriptToDisk(system, script));
    const rb = $('btnRetryAll'); if (rb) rb.addEventListener('click', () => runBatch(plan.map((r, i) => i).filter(i => plan[i].status === 'error'), false));
    $('rows').querySelectorAll('[data-retry]').forEach(b => b.addEventListener('click', () => runBatch([+b.dataset.retry], false)));
    $('rows').querySelectorAll('[data-remove]').forEach(b => b.addEventListener('click', () => removeRow(+b.dataset.remove)));
  }

  function removeRow(i) {
    const r = plan[i]; if (!r) return;
    // Un-tick whatever produced this row, in both the guide and the full catalog.
    NEEDS.needs.forEach(n => n.options.forEach(o => {
      const refs = optionRefs(os(), o); if (!refs) return;
      if (refs.some(x => x.item.cmd === r.cmd && x.item.name === r.name)) picks.delete(`${n.id}/${o.id}`);
    }));
    const all = findLoose(os(), r); all.forEach(x => x.set(false));
    applyFlags(); buildPlan(); previewed = false; renderReview(); announce(`Removed ${r.name}`);
  }
  function findLoose(system, r) {
    const out = [];
    (JUMPSTART[system] || []).forEach(it => { if (it.name === r.name && it.cmd === r.cmd) out.push({ set: v => { jsState[system][it.id] = v; } }); });
    (CATS[system] || []).forEach(cat => cat.items.forEach((it, idx) => { if (it.name === r.name && it.cmd === r.cmd) out.push({ set: v => { catState[system][`${cat.id}_${idx}`] = v; } }); }));
    return out;
  }

  // Preview: dry run. In the app the backend answers (exact commands it would run); in a
  // browser the same rules are applied locally.
  async function doPreview() {
    const idx = plan.map((r, i) => i).filter(i => runnable(plan[i]));
    plan.forEach(r => { if (runnable(r)) { r.status = 'waiting'; r.output = ''; } });
    mode = 'preview';
    if (IS_TAURI) { await runBatch(idx, true); }
    else { idx.forEach(i => { const r = plan[i]; if (r.type === 'aur' && !allowAur) { r.status = 'skipped'; r.output = 'AUR installs are off.'; } }); finishPreview(); }
  }
  function finishPreview() {
    // Dry-run results are not install results: show them as plan state.
    plan.forEach(r => { if (runnable(r) && r.status === 'dry_run') r.status = 'waiting'; });
    previewed = true; mode = 'idle'; running = false;
    renderReview();
    const n = plan.filter(r => runnable(r) && !(r.type === 'aur' && !allowAur)).length;
    announce(`Preview ready: ${n} step${n === 1 ? '' : 's'} would run.`);
    const b = $('btnInstall') || $('btnPreview'); if (b) b.focus();
  }
  async function doInstall() { mode = 'install'; await runBatch(plan.map((r, i) => i).filter(i => runnable(plan[i])), false); }

  async function runBatch(indices, dry) {
    if (!IS_TAURI || !indices.length) { if (dry) finishPreview(); return; }
    running = true; if (!dry) mode = 'install';
    queue = indices; qi = 0;
    indices.forEach(i => { plan[i].status = 'waiting'; plan[i].output = ''; });
    if (!dry && indices.length) plan[indices[0]].status = 'running';
    renderReview();
    announce(dry ? 'Previewing…' : 'Installing…');
    try {
      await CORE.invoke('run_install', {
        os: os(), dryRun: dry, allowAur,
        items: indices.map(i => ({ name: plan[i].name, cmd: plan[i].cmd, cmd_type: plan[i].type })),
      });
    } catch (e) {
      running = false;
      indices.forEach(i => { plan[i].status = 'error'; plan[i].output = String(e); });
      renderReview();
    }
  }

  // Events from the Rust side (tauri-bridge.js forwards them here).
  window.onInstallProgress = function (p) {
    if (!p) return;
    if (p.step === '__COMPLETE__') {
      if (mode === 'preview') { finishPreview(); return; }
      running = false; renderReview();
      const f = plan.filter(r => r.status === 'error').length;
      announce(f ? `Finished with ${f} that didn’t install.` : 'All done.');
      return;
    }
    const i = queue[qi++]; const r = plan[i]; if (!r) return;
    r.status = p.status; r.output = p.output || '';
    if (p.status !== 'dry_run' && qi < queue.length) plan[queue[qi]].status = 'running';
    renderReview();
    if (p.status === 'ok') announce(`${r.name}: done`);
    if (p.status === 'error') announce(`${r.name}: didn’t finish. ${friendly(r)}`);
  };

  window.openReviewFromTray = openReview;

  // ── modes ──────────────────────────────────────────────────
  window.setMode = function (m) {
    document.body.classList.toggle('mode-guide', m === 'guide');
    document.body.classList.toggle('mode-full', m === 'full');
    const b = $('modeToggle');
    if (b) { b.textContent = m === 'guide' ? 'Browse full catalog' : '← Back to the guide'; b.setAttribute('aria-pressed', m === 'full'); }
    updateTray();
  };
  window.toggleMode = function () { setMode(document.body.classList.contains('mode-guide') ? 'full' : 'guide'); };

  // Called by switchTab() whenever the system changes (detection, picker, hash).
  window.onSystemChanged = function () {
    sysKnown = true; fillPickers();
    if (NEEDS) { currentNeed = null; renderHome(); if (view !== 'home') show('home'); updateTray(); }
  };

  // ── boot ───────────────────────────────────────────────────
  function validateNeeds(n) {
    if (!n || !Array.isArray(n.wings) || !Array.isArray(n.needs)) throw new Error('needs.json: expected "wings" and "needs" lists');
    n.needs.forEach(x => { if (!x.id || !x.title || !Array.isArray(x.options)) throw new Error(`needs.json: need "${x.id || '?'}" is missing id/title/options`); });
  }
  const _uc = updateCount;
  updateCount = function () { _uc(); updateTray(); };

  setMode('guide');
  dataReady.then(() => fetchDataJSON('data/needs.json')).then(n => { validateNeeds(n); NEEDS = n; })
    .catch(e => { loadError = `The guided picks could not be loaded (${e.message}). You can still use “Browse full catalog”.`; })
    .then(() => { renderHome(); show('home'); updateTray(); });
})();
