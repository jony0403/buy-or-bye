import fs from 'node:fs';

let html = fs.readFileSync('analyzer/index.html', 'utf8').replace(/\r\n/g, '\n');
html = html.replace(/landing4/g, 'landing5');
fs.writeFileSync('analyzer/index.html', html.replace(/\n/g, '\r\n'));
console.log('index ok');

let s = fs.readFileSync('analyzer-server.mjs', 'utf8').replace(/\r\n/g, '\n');
if (!s.includes('/demo-images/')) {
  const needle = `if (
    (req.method === 'GET' || req.method === 'HEAD') &&
    url.pathname === '/downloads/buy-or-bye-extension.zip'
  ) {`;
  const insert = `if (req.method === 'GET' && url.pathname.startsWith('/demo-images/')) {
    try {
      const rel = decodeURIComponent(url.pathname.slice('/demo-images/'.length));
      if (!/^[a-z0-9][a-z0-9/_./-]{0,180}$/i.test(rel) || rel.includes('..')) {
        res.writeHead(400);
        res.end('bad path');
        return;
      }
      const filePath = path.join(DEMO_DIR, 'images', rel);
      const abs = path.resolve(filePath);
      if (!abs.startsWith(path.resolve(DEMO_DIR))) {
        res.writeHead(400);
        res.end('bad path');
        return;
      }
      const buf = await fs.readFile(abs);
      const ext = path.extname(abs).toLowerCase();
      const type = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'public, max-age=86400' });
      res.end(buf);
    } catch {
      res.writeHead(404);
      res.end('not found');
    }
    return;
  }

`;
  if (!s.includes(needle)) throw new Error('needle missing');
  s = s.replace(needle, insert + needle);
  fs.writeFileSync('analyzer-server.mjs', s.replace(/\n/g, '\r\n'));
  console.log('server ok');
} else {
  console.log('server already');
}
