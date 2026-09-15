import fs from 'node:fs';

const p = 'analyzer/ai/gate.js';
let t = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

if (!t.includes("key !== '__SERVER_DEMO__'")) {
  t = t.replace(
    `function isConfigured() {
    const u = K();
    if (!u) return false;
    const key = localStorage.getItem(u.STORAGE_KEY_API);
    const verified = localStorage.getItem(u.STORAGE_KEY_VERIFIED_AT);
    return typeof key === 'string' && key.trim().length > 0 && verified != null && verified !== '';
  }`,
    `function isConfigured() {
    const u = K();
    if (!u) return false;
    const key = localStorage.getItem(u.STORAGE_KEY_API);
    const verified = localStorage.getItem(u.STORAGE_KEY_VERIFIED_AT);
    if (typeof key !== 'string' || !key.trim() || verified == null || verified === '') return false;
    // server demo token must be re-validated via /api/demo/status
    if (key.trim() === '__SERVER_DEMO__' || localStorage.getItem('ulsa_demo_mode') === '1') return false;
    return true;
  }`
  );
}

fs.writeFileSync(p, t.replace(/\n/g, '\r\n'));
console.log('gate isConfigured patched');
