#!/usr/bin/env node
// Fails if the app version differs between tauri.conf.json (the source of
// truth), package.json, package-lock.json, Cargo.toml and Cargo.lock.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const json = f => JSON.parse(read(f));
const lock = json('package-lock.json');
const found = {
  'src-tauri/tauri.conf.json': json('src-tauri/tauri.conf.json').version,
  'package.json': json('package.json').version,
  'package-lock.json': lock.version,
  'package-lock.json packages[""]': lock.packages[''].version,
  'src-tauri/Cargo.toml': (read('src-tauri/Cargo.toml').match(/^version\s*=\s*"([^"]+)"/m) || [])[1],
  'src-tauri/Cargo.lock': (read('src-tauri/Cargo.lock').match(/name = "uni-staller"\nversion = "([^"]+)"/) || [])[1],
};
const want = found['src-tauri/tauri.conf.json'];
let bad = 0;
for (const [f, v] of Object.entries(found)) {
  const ok = v === want; if (!ok) bad++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${f.padEnd(36)} ${v}`);
}
console.log(bad ? `\n${bad} file(s) differ from tauri.conf.json (${want})` : `\nAll versions match: ${want}`);
process.exit(bad ? 1 : 0);
