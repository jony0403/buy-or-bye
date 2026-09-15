import fs from 'node:fs';

let t = fs.readFileSync('analyzer-server.mjs', 'utf8').replace(/\r\n/g, '\n');

if (!t.includes('function resolveDemoImageLocalPath')) {
  t = t.replace(
    'function isAllowedListingImageUrl(u) {\n  if (resolveDemoImageLocalPath(u)) return true;',
    `function resolveDemoImageLocalPath(u) {
  try {
    const raw = String(u || '').trim();
    if (!raw) return '';
    let pathname = raw;
    if (/^https?:\\/\\//i.test(raw)) pathname = new URL(raw).pathname;
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

function isAllowedListingImageUrl(u) {
  if (resolveDemoImageLocalPath(u)) return true;`
  );
}

if (!t.includes('const local = resolveDemoImageLocalPath(url);')) {
  t = t.replace(
    'async function fetchImageUrlToInlinePart(url) {\n  const imageUrl = optimizeImageUrlForAi(url);',
    `async function fetchImageUrlToInlinePart(url) {
  const local = resolveDemoImageLocalPath(url);
  if (local) {
    const buf = await fs.readFile(local);
    if (buf.length > MAX_IMAGE_BYTES) throw new Error('이미지 용량 초과');
    const ext = path.extname(local).toLowerCase();
    const mime =
      ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.gif' ? 'image/gif' : 'image/jpeg';
    return {
      inline_data: {
        mime_type: mime,
        data: buf.toString('base64'),
      },
    };
  }
  const imageUrl = optimizeImageUrlForAi(url);`
  );
}

fs.writeFileSync('analyzer-server.mjs', t.replace(/\n/g, '\r\n'));
console.log('ok');
