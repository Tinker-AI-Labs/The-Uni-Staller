#!/usr/bin/env node
// Checks that every option in src/data/needs.json points at items that exist
// in the per-OS data, and prints what each OS will actually see.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');
const loaderCtx = {}; vm.createContext(loaderCtx);
vm.runInContext(fs.readFileSync(path.join(SRC, 'data-loader.js'), 'utf8'), loaderCtx);
const OS = ['win', 'cachy', 'bazzite', 'fedora', 'ubuntu', 'arch', 'android'];
const read = async p => JSON.parse(fs.readFileSync(path.join(SRC, p), 'utf8'));
const needs = JSON.parse(fs.readFileSync(path.join(SRC, 'data/needs.json'), 'utf8'));
const data = await loaderCtx.UniData.loadAll(read, OS);
let bad = data.errors.length; data.errors.forEach(e => console.log('FAIL ' + e));

const wings = new Set(needs.wings.map(w => w.id));
const seen = new Set();
function resolve(os, ref) {
  const js = ref.startsWith('js:'); const name = js ? ref.slice(3) : ref;
  if (js) return (data.jumpstart[os] || []).find(i => i.name === name);
  return (data.cats[os] || []).flatMap(c => c.items).find(i => i.name === name)
      || (data.jumpstart[os] || []).find(i => i.name === name);
}
console.log('need'.padEnd(10) + OS.map(o => o.padEnd(11)).join(''));
for (const n of needs.needs) {
  if (!wings.has(n.wing)) { bad++; console.log(`FAIL ${n.id}: unknown wing ${n.wing}`); }
  if (seen.has(n.id)) { bad++; console.log(`FAIL duplicate need ${n.id}`); } seen.add(n.id);
  if (!n.title || !n.blurb || !n.options.length) { bad++; console.log(`FAIL ${n.id}: missing text/options`); }
  const cols = OS.map(os => {
    const shown = [];
    for (const o of n.options) {
      if (!o.plain || o.plain.length > 110) { bad++; console.log(`FAIL ${n.id}/${o.id}: plain text missing or over 110 chars`); }
      const explicit = o.items[os] !== undefined;
      const refs = explicit ? o.items[os] : o.items['*'];
      if (!refs || !refs.length) continue;
      const miss = refs.filter(r => !resolve(os, r));
      // '*' is lenient (the option just isn't shown where the OS lacks it);
      // an explicit per-OS entry must resolve, so typos are caught.
      if (miss.length && explicit) { bad++; console.log(`FAIL ${n.id}/${o.id} on ${os}: no such item: ${miss.join(', ')}`); }
      else if (!miss.length) shown.push(o.id);
    }
    return (shown.length ? shown.map(x => x.slice(0, 4)).join('+') : '-').padEnd(11);
  });
  console.log(n.id.padEnd(10) + cols.join(''));
}
// Every option must show somewhere, so a typo can't hide it everywhere.
for (const n of needs.needs) for (const o of n.options) {
  if (!OS.some(os => { const r = o.items[os] !== undefined ? o.items[os] : o.items['*']; return r && r.length && r.every(x => resolve(os, x)); })) { bad++; console.log(`FAIL ${n.id}/${o.id} shows on no OS`); }
}
console.log(bad ? `\n${bad} PROBLEM(S)` : '\nEvery option resolves to real items on every OS that shows it');
process.exit(bad ? 1 : 0);
