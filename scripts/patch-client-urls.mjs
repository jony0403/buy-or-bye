import fs from 'node:fs';

const p = 'analyzer/ai/client.js';
let t = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

if (!t.includes('function apiUrl')) {
  t = t.replace(
    'globalThis.UlsaAi = globalThis.UlsaAi || {};\n\n  UlsaAi.getStoredModel',
    `globalThis.UlsaAi = globalThis.UlsaAi || {};

  function apiUrl(path) {
    const value = String(path || '');
    return value.startsWith('/') ? value : '/' + value;
  }

  UlsaAi.apiUrl = apiUrl;

  UlsaAi.getStoredModel`
  );
}

t = t.split("const port = location.port || '3920';\n").join('');
t = t.split('http://${location.hostname}:${port}').join('__ORIGIN__');
t = t.split('return fetch(`__ORIGIN__${path}`, fetchOpts);').join('return fetch(apiUrl(path), fetchOpts);');
t = t.replace(/fetch\(`__ORIGIN__(\/api\/[^`]+)`/g, 'fetch(apiUrl(`$1`)');

const bad = [];
t.split('\n').forEach((l, i) => {
  if (/hostname|__ORIGIN__|const port =/.test(l)) bad.push({ i: i + 1, l });
});
if (bad.length) {
  console.error(bad);
  throw new Error('cleanup incomplete');
}

fs.writeFileSync(p, t.replace(/\n/g, '\r\n'), 'utf8');
console.log('ok apiUrl=', (t.match(/apiUrl\(/g) || []).length);
