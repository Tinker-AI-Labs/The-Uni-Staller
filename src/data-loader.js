// ═══════════════════════════════════════════════════════════════
// DATA LOADER — merges src/data/base.json with src/data/<os>.json,
// validates the result, and reports problems as readable text.
//
// Works in the app (fetch) and in Node (scripts/verify-data.js), so it
// takes a `readJSON(path)` function instead of calling fetch itself.
//
// File shapes:
//   base.json  { version, jumpstart:{<key>:{name,desc,tier,cmd}},
//                         cats:{<key>:{icon,title,items[]}} }
//   <os>.json  { os, jumpstart:[ {use,id} | {id,name,desc,tier,cmd} ],
//                    cats:[ {use,id} | {id,icon,title,items[]} ] }
// An entry with "use" is the base block with the entry's own fields
// (normally just "id") laid over it.
// ═══════════════════════════════════════════════════════════════
(function (root) {
  'use strict';

  const TIERS = ['sys', 'dev', 'ai', 'core'];
  const ITEM_REQUIRED = ['name', 'desc', 'cmd', 'type'];
  // avail / fallback are part of the item shape but no shipped item uses
  // them yet, so they are optional. license/help/helpType are the existing
  // optional "project page" fields (see helpLink() in the engine).
  const ITEM_OPTIONAL = ['avail', 'fallback', 'license', 'help', 'helpType'];
  const JS_KEYS = ['id', 'name', 'desc', 'tier', 'cmd', 'license', 'help', 'helpType'];
  const JS_REQUIRED = ['id', 'name', 'desc', 'tier', 'cmd'];
  const CAT_KEYS = ['id', 'icon', 'title', 'items'];

  const isStr = v => typeof v === 'string';
  const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const clone = v => JSON.parse(JSON.stringify(v));

  function checkKeys(obj, allowed, where, errs) {
    Object.keys(obj).forEach(k => {
      if (!allowed.includes(k)) errs.push(`${where}: unknown field "${k}"`);
    });
  }

  function checkItem(it, where, errs) {
    if (!isObj(it)) { errs.push(`${where}: item must be an object`); return; }
    ITEM_REQUIRED.forEach(k => {
      if (!isStr(it[k]) || !it[k].trim()) errs.push(`${where}: "${k}" must be a non-empty string`);
    });
    // type becomes the CSS class tag-<type>, so keep it class-safe.
    if (isStr(it.type) && !/^[a-z0-9_-]+$/.test(it.type)) errs.push(`${where}: "type" must be lowercase letters/digits/-/_ (got "${it.type}")`);
    if ('avail' in it && !(isStr(it.avail) || Array.isArray(it.avail) || typeof it.avail === 'boolean')) errs.push(`${where}: "avail" must be a string, array or boolean`);
    if ('fallback' in it && !isStr(it.fallback)) errs.push(`${where}: "fallback" must be a string`);
    ['license', 'help'].forEach(k => { if (k in it && !isStr(it[k])) errs.push(`${where}: "${k}" must be a string`); });
    if ('helpType' in it && !['help', 'site'].includes(it.helpType)) errs.push(`${where}: "helpType" must be "help" or "site"`);
    checkKeys(it, ITEM_REQUIRED.concat(ITEM_OPTIONAL), where, errs);
  }

  function checkJumpstartItem(it, where, errs) {
    if (!isObj(it)) { errs.push(`${where}: JUMPSTART entry must be an object`); return; }
    JS_REQUIRED.forEach(k => {
      if (!isStr(it[k]) || !it[k].trim()) errs.push(`${where}: "${k}" must be a non-empty string`);
    });
    if (isStr(it.tier) && !TIERS.includes(it.tier)) errs.push(`${where}: "tier" must be one of ${TIERS.join('/')} (got "${it.tier}")`);
    checkKeys(it, JS_KEYS, where, errs);
  }

  function checkCat(c, where, errs) {
    if (!isObj(c)) { errs.push(`${where}: category must be an object`); return; }
    ['id', 'icon', 'title'].forEach(k => {
      if (!isStr(c[k]) || !c[k].trim()) errs.push(`${where}: "${k}" must be a non-empty string`);
    });
    if (!Array.isArray(c.items)) errs.push(`${where}: "items" must be an array`);
    else c.items.forEach((it, i) => checkItem(it, `${where} › items[${i}]${isObj(it) && isStr(it.name) ? ` "${it.name}"` : ''}`, errs));
    checkKeys(c, CAT_KEYS, where, errs);
  }

  // Merge one OS file with the base. Returns {jumpstart, cats, errors}.
  function mergeOS(base, osFile, osId) {
    const errs = [];
    const file = `${osId}.json`;
    if (!isObj(osFile)) return { jumpstart: [], cats: [], errors: [`${file}: top level must be an object`] };
    if (osFile.os !== osId) errs.push(`${file}: "os" is "${osFile.os}" but the file is for "${osId}"`);

    const expand = (list, kind, baseMap) => {
      if (!Array.isArray(list)) { errs.push(`${file}: "${kind}" must be an array`); return []; }
      return list.map((e, i) => {
        const where = `${file} › ${kind}[${i}]`;
        if (!isObj(e)) { errs.push(`${where}: entry must be an object`); return e; }
        if ('use' in e) {
          const b = baseMap && baseMap[e.use];
          if (!b) { errs.push(`${where}: "use":"${e.use}" is not in base.json ${kind}`); return null; }
          const o = Object.assign({}, e); delete o.use;
          return Object.assign(clone(b), o);
        }
        return clone(e);
      }).filter(x => x !== null);
    };
    const jumpstart = expand(osFile.jumpstart, 'jumpstart', base.jumpstart);
    const cats = expand(osFile.cats, 'cats', base.cats);

    const seen = new Set();
    jumpstart.forEach((it, i) => {
      checkJumpstartItem(it, `${file} › jumpstart[${i}]${isObj(it) && isStr(it.id) ? ` "${it.id}"` : ''}`, errs);
      if (isObj(it) && isStr(it.id)) { if (seen.has(it.id)) errs.push(`${file}: duplicate JUMPSTART id "${it.id}"`); seen.add(it.id); }
    });
    const seenC = new Set();
    cats.forEach((c, i) => {
      checkCat(c, `${file} › cats[${i}]${isObj(c) && isStr(c.id) ? ` "${c.id}"` : ''}`, errs);
      if (isObj(c) && isStr(c.id)) { if (seenC.has(c.id)) errs.push(`${file}: duplicate category id "${c.id}"`); seenC.add(c.id); }
    });
    return { jumpstart, cats, errors: errs };
  }

  function checkBase(base) {
    const errs = [];
    if (!isObj(base)) return ['base.json: top level must be an object'];
    if (!isObj(base.jumpstart)) errs.push('base.json: "jumpstart" must be an object');
    if (!isObj(base.cats)) errs.push('base.json: "cats" must be an object');
    return errs;
  }

  // readJSON(relativePath) -> Promise<parsed>. It should throw a readable
  // Error on a missing file or bad JSON. A broken OS file only disables
  // that OS; a broken base.json disables everything.
  async function loadAll(readJSON, osList) {
    const result = { jumpstart: {}, cats: {}, errors: [] };
    let base;
    try { base = await readJSON('data/base.json'); }
    catch (e) { result.errors.push(`Could not load data/base.json — ${e.message}`); return result; }
    const baseErrs = checkBase(base);
    if (baseErrs.length) { result.errors.push(...baseErrs); return result; }

    for (const os of osList) {
      let osFile;
      try { osFile = await readJSON(`data/${os}.json`); }
      catch (e) { result.errors.push(`Could not load data/${os}.json — ${e.message}`); continue; }
      const m = mergeOS(base, osFile, os);
      if (m.errors.length) { result.errors.push(...m.errors); continue; }
      result.jumpstart[os] = m.jumpstart;
      result.cats[os] = m.cats;
    }
    return result;
  }

  root.UniData = { loadAll, mergeOS, checkBase, TIERS };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.UniData;
})(typeof window !== 'undefined' ? window : globalThis);
