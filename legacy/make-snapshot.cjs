// Erzeugt test/fixtures/legacy-snapshot.json aus dem Legacy-getZWert().
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, 'zcalc.js'), 'utf8');
const ctx = { console: { log() {} }, $: { inArray: (v, a) => a.indexOf(v) } };
vm.createContext(ctx);
vm.runInContext(src, ctx);
const out = [];
for (const g of [5, 9, 10, 12, 13, 14, 17, 21, 22, 25, 30, 35, 41, 48, 57, 66, 78, 94, 95, 120])
for (const h of [100, 130, 148, 149, 157, 158, 166, 167, 178, 179, 194, 195, 210])
for (const s of [200, 250, 251, 270, 271, 290, 291, 310, 311, 330, 331, 360])
for (const t of [1, 2, 3])
for (const a of [5, 9, 10, 30, 49, 50, 70]) {
  let r;
  try { r = ctx.getZWert(g, h, s, t, a); } catch (e) { r = 'THROW'; }
  if (Array.isArray(r) && r.some(v => v === undefined)) r = r.map(v => v === undefined ? null : v);
  out.push([g, h, s, t, a, r]);
}
fs.writeFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'legacy-snapshot.json'), JSON.stringify(out));
const c = { ok: 0, neg1: 0, thrown: 0, undef: 0 };
for (const [, , , , , r] of out) { if (r === 'THROW') c.thrown++; else if (r === -1) c.neg1++; else { c.ok++; if (r.includes(null)) c.undef++; } }
console.log(out.length, c);
