#!/usr/bin/env node
// Proves the JSON data in src/data/ merges into exactly the JUMPSTART/CATS
// data that lived in src/jumpstart-engine.js before the split.
//
//   node scripts/verify-data.js                 compare + negative tests
//   node scripts/verify-data.js --write-baseline  (re)write scripts/baseline-hashes.json
//                                                from the pre-split engine in git
//
// Two independent checks per OS:
//   1. deep-equal against the pre-split engine, read from git (BASELINE_REF)
//      — skipped with a notice if that commit is not in this clone;
//   2. sha256 of the canonical merged data against scripts/baseline-hashes.json
//      (recorded from that same pre-split engine), which needs no git history.
// Then it feeds deliberately broken data to the validator and checks that it
// is rejected with a readable message.
'use strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const BASELINE_REF = '21e85df';              // last commit before the data/code split
const HASH_FILE = path.join(__dirname, 'baseline-hashes.json');
// data-loader.js is a plain browser script; run it exactly as shipped.
const loaderCtx = {}; vm.createContext(loaderCtx);
vm.runInContext(fs.readFileSync(path.join(SRC, 'data-loader.js'), 'utf8'), loaderCtx);
const UniData = loaderCtx.UniData;
const OS_LIST = ['win', 'cachy', 'bazzite', 'fedora', 'ubuntu', 'arch', 'android'];

const canon = v => Array.isArray(v) ? v.map(canon)
  : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canon(v[k])])) : v;
const sha = v => crypto.createHash('sha256').update(JSON.stringify(canon(v))).digest('hex');
const readJSON = async p => JSON.parse(fs.readFileSync(path.join(SRC, p), 'utf8'));

function legacyFromGit() {
  let text;
  try { text = execFileSync('git', ['show', `${BASELINE_REF}:src/jumpstart-engine.js`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26, stdio: ['ignore', 'pipe', 'ignore'] }); }
  catch (e) { return null; }
  const cut = text.indexOf('const jsState');
  const ctx = {}; vm.createContext(ctx);
  vm.runInContext(text.slice(0, cut) + ';this.JUMPSTART=JUMPSTART;this.CATS=CATS;', ctx);
  return { JUMPSTART: ctx.JUMPSTART, CATS: ctx.CATS };
}

const summary = (js, cats) => ({
  jumpstart: js.length,
  categories: cats.length,
  items: cats.reduce((n, c) => n + c.items.length, 0),
  commands: js.length + cats.reduce((n, c) => n + c.items.length, 0),
  sha256: sha({ jumpstart: js, cats }),
});

(async () => {
  let failed = 0;
  const fail = m => { failed++; console.log('  FAIL ' + m); };

  const legacy = legacyFromGit();
  if (process.argv.includes('--write-baseline')) {
    if (!legacy) { console.error(`Cannot read ${BASELINE_REF} from git.`); process.exit(2); }
    const out = {};
    OS_LIST.forEach(os => { out[os] = summary(legacy.JUMPSTART[os], legacy.CATS[os]); });
    fs.writeFileSync(HASH_FILE, JSON.stringify({ source: `src/jumpstart-engine.js @ ${BASELINE_REF}`, os: out }, null, 2) + '\n');
    console.log('wrote', path.relative(ROOT, HASH_FILE)); return;
  }

  console.log(`Loading src/data/*.json with the app's own loader (src/data-loader.js)…`);
  const res = await UniData.loadAll(readJSON, OS_LIST);
  if (res.errors.length) { res.errors.forEach(e => fail('load/validate: ' + e)); }
  console.log(legacy ? `Baseline: pre-split engine from git ${BASELINE_REF}` : `Baseline: git ${BASELINE_REF} not available here — using stored hashes only`);
  const stored = JSON.parse(fs.readFileSync(HASH_FILE, 'utf8'));

  console.log('\nOS        JUMPSTART  cats  items  commands  vs git     vs stored hash   sha256');
  for (const os of OS_LIST) {
    const js = res.jumpstart[os], cats = res.cats[os];
    if (!js) { fail(`${os}: no merged data`); continue; }
    const s = summary(js, cats);
    let gitCol = 'skipped';
    if (legacy) {
      const same = sha({ jumpstart: legacy.JUMPSTART[os], cats: legacy.CATS[os] }) === s.sha256 &&
        JSON.stringify(canon(legacy.JUMPSTART[os])) === JSON.stringify(canon(js)) &&
        JSON.stringify(canon(legacy.CATS[os])) === JSON.stringify(canon(cats));
      gitCol = same ? 'IDENTICAL' : 'DIFFERS';
      if (!same) fail(`${os}: merged data differs from pre-split engine`);
    }
    // Same commands in the same order, independent of the hash.
    const flat = (j, c) => [...j.map(i => i.cmd), ...c.flatMap(x => x.items.map(i => i.cmd))];
    if (legacy && JSON.stringify(flat(legacy.JUMPSTART[os], legacy.CATS[os])) !== JSON.stringify(flat(js, cats))) fail(`${os}: command list/order differs`);
    const st = stored.os[os];
    const hashOK = st && st.sha256 === s.sha256 && st.commands === s.commands && st.items === s.items && st.jumpstart === s.jumpstart && st.categories === s.categories;
    if (!hashOK) fail(`${os}: does not match stored baseline hash`);
    console.log(`${os.padEnd(9)} ${String(s.jumpstart).padStart(9)} ${String(s.categories).padStart(5)} ${String(s.items).padStart(6)} ${String(s.commands).padStart(9)}  ${gitCol.padEnd(10)} ${(hashOK ? 'MATCH' : 'MISMATCH').padEnd(15)}  ${s.sha256.slice(0, 12)}`);
  }

  // Negative tests: broken data must be rejected with a readable message.
  console.log('\nValidator rejects bad data:');
  const base = JSON.parse(fs.readFileSync(path.join(SRC, 'data/base.json'), 'utf8'));
  const good = JSON.parse(fs.readFileSync(path.join(SRC, 'data/cachy.json'), 'utf8'));
  const mutate = f => { const o = JSON.parse(JSON.stringify(good)); f(o); return UniData.mergeOS(base, o, 'cachy').errors; };
  const firstItem = o => o.cats.find(c => c.items).items;
  const firstJS = o => o.jumpstart.find(i => !i.use);
  const cases = [
    ['bad tier',            o => { firstJS(o).tier = 'banana'; },             /tier/],
    ['missing cmd',         o => { delete firstItem(o)[0].cmd; },             /cmd/],
    ['item type not string',o => { firstItem(o)[0].type = 5; },               /type/],
    ['unknown base key',    o => { o.cats.push({ use: 'nope', id: 'x' }); },  /nope/],
    ['unknown item field',  o => { firstItem(o)[0].colour = 'red'; },         /colour/],
    ['duplicate category id', o => { o.cats.push(JSON.parse(JSON.stringify(o.cats.find(c => c.items)))); }, /duplicate/],
    ['items not an array',  o => { o.cats.find(c => c.items).items = 'x'; },  /items/],
    ['wrong os in file',    o => { o.os = 'win'; },                           /"os"/],
  ];
  for (const [name, f, re] of cases) {
    const errs = mutate(f);
    const ok = errs.length > 0 && re.test(errs.join('\n'));
    console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${name.padEnd(22)} → ${errs[0] || '(accepted!)'}`);
    if (!ok) failed++;
  }
  const bad = await UniData.loadAll(async p => { if (p === 'data/base.json') throw new Error('HTTP 404'); return {}; }, ['win']);
  const okMissing = bad.errors.length === 1 && /base\.json/.test(bad.errors[0]);
  console.log(`  ${okMissing ? 'ok  ' : 'FAIL'} ${'missing base.json'.padEnd(22)} → ${bad.errors[0]}`);
  if (!okMissing) failed++;

  console.log(failed ? `\n${failed} FAILURE(S)` : '\nALL CHECKS PASSED — merged data is identical to the pre-split data for every OS');
  process.exit(failed ? 1 : 0);
})();
