import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Smoke-test demo image resolution used by listing analysis
const DEMO_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'demo');

function resolveDemoImageLocalPath(u) {
  try {
    const raw = String(u || '').trim();
    if (!raw) return '';
    let pathname = raw;
    if (/^https?:\/\//i.test(raw)) pathname = new URL(raw).pathname;
    if (!pathname.startsWith('/demo-images/')) return '';
    const rel = decodeURIComponent(pathname.slice('/demo-images/'.length));
    if (!/^[a-z0-9][a-z0-9/_./-]{0,180}$/i.test(rel) || rel.includes('..')) return '';
    const abs = path.resolve(path.join(DEMO_DIR, 'images', rel));
    if (!abs.startsWith(path.resolve(DEMO_DIR))) return '';
    return abs;
  } catch {
    return '';
  }
}

function unwrapImageProxyUrl(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  try {
    const u = new URL(s, 'http://127.0.0.1');
    if (u.pathname === '/api/image-proxy') {
      const inner = u.searchParams.get('url');
      if (inner) return String(inner).trim();
    }
  } catch {
    /* ignore */
  }
  return s;
}

const samples = [
  '/demo-images/helinox/01.jpg',
  '/api/image-proxy?url=' + encodeURIComponent('/demo-images/helinox/01.jpg'),
];

// find a real demo image
const imagesRoot = path.join(DEMO_DIR, 'images');
function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/\.(jpe?g|png|webp)$/i.test(ent.name)) out.push(p);
  }
  return out;
}
const files = walk(imagesRoot).slice(0, 3);
console.log('demo files', files.map((f) => path.relative(imagesRoot, f)));
for (const f of files) {
  const rel = path.relative(imagesRoot, f).replace(/\\/g, '/');
  const url = `/demo-images/${rel}`;
  const local = resolveDemoImageLocalPath(url);
  const buf = local ? fs.readFileSync(local) : null;
  console.log(url, !!local, buf?.length);
  const proxied = `/api/image-proxy?url=${encodeURIComponent(url)}`;
  console.log('unwrap', unwrapImageProxyUrl(proxied), resolveDemoImageLocalPath(unwrapImageProxyUrl(proxied)) ? 'local-ok' : 'local-fail');
}

// live marketplace image via proxy
const bunjangTest =
  'https://media.bunjang.co.kr/product/123456789_1_1700000000_w{res}.jpg';
console.log('referer-style origin check skipped; hitting product-image again done separately');
