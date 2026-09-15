import fs from 'node:fs';

let t = fs.readFileSync('analyzer-server.mjs', 'utf8').replace(/\r\n/g, '\n');
const startMarker = "if (req.method === 'GET' && url.pathname === '/downloads/buy-or-bye-extension.zip')";
const start = t.indexOf(startMarker);
if (start < 0) throw new Error('download block not found');
const endMarker = "if (req.method === 'POST' && url.pathname === '/api/verify-gemini')";
const end = t.indexOf(endMarker, start);
if (end < 0) throw new Error('verify marker not found');

const block = `if (
    (req.method === 'GET' || req.method === 'HEAD') &&
    url.pathname === '/downloads/buy-or-bye-extension.zip'
  ) {
    try {
      const zipPath = path.join(DOWNLOADS_DIR, 'buy-or-bye-extension.zip');
      const buf = await fs.readFile(zipPath);
      res.writeHead(200, {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="buy-or-bye-extension.zip"',
        'Content-Length': String(buf.length),
        'Cache-Control': 'no-store',
      });
      if (req.method === 'HEAD') res.end();
      else res.end(buf);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Extension ZIP missing. Run npm run pack:extension');
    }
    return;
  }

  `;

t = t.slice(0, start) + block + t.slice(end);
fs.writeFileSync('analyzer-server.mjs', t.replace(/\n/g, '\r\n'));
console.log('download route patched, zip=', fs.existsSync('public/downloads/buy-or-bye-extension.zip'));
