import fs from 'node:fs';
import { execSync } from 'node:child_process';

const zip = 'public/downloads/buy-or-bye-extension.zip';
const out = 'public/downloads/_ext-check';
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
execSync(`tar -xf "${zip}" -C "${out}"`, { stdio: 'inherit' });

const bad = [];
function walk(d) {
  for (const n of fs.readdirSync(d)) {
    const p = `${d}/${n}`;
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (/\.js$/i.test(n)) {
      try {
        new TextDecoder('utf-8', { fatal: true }).decode(fs.readFileSync(p));
      } catch {
        bad.push(p);
      }
    }
  }
}
walk(out);
console.log(bad.length ? `BAD ${bad.join(', ')}` : 'ZIP UTF-8 OK');
const bridge = fs.readFileSync(`${out}/bridge-analyzer.js`, 'utf8');
console.log('seed listing', bridge.includes('marketScrapeLatest: listing'));
console.log('forItemKey msg', bridge.includes('forItemKey'));
