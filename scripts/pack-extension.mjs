import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const extensionDir = path.join(root, 'extension');
const outDir = path.join(root, 'public', 'downloads');
const outZip = path.join(outDir, 'buy-or-bye-extension.zip');
const publicOrigin = String(process.env.PUBLIC_ANALYZER_ORIGIN || '').trim().replace(/\/$/, '');

fs.mkdirSync(outDir, { recursive: true });

const manifestPath = path.join(extensionDir, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

function ensureMatch(list, value) {
  if (!list.includes(value)) list.push(value);
}

if (publicOrigin) {
  const originPattern = `${publicOrigin}/*`;
  ensureMatch(manifest.host_permissions, originPattern);
  const bridge = (manifest.content_scripts || []).find((c) =>
    (c.js || []).includes('bridge-analyzer.js')
  );
  if (bridge) {
    bridge.matches = bridge.matches || [];
    ensureMatch(bridge.matches, originPattern);
  }
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const originsPath = path.join(extensionDir, 'analyzer-origins.js');
  const originsJs = `/** Updated by npm run pack:extension when PUBLIC_ANALYZER_ORIGIN is set. */
const BUY_OR_BYE_ANALYZER_ORIGINS = [
  '${publicOrigin}',
  'http://127.0.0.1:3920',
  'http://localhost:3920',
];
`;
  fs.writeFileSync(originsPath, originsJs);
  console.log('manifest + analyzer-origins updated with', publicOrigin);
}

if (fs.existsSync(outZip)) fs.unlinkSync(outZip);

// Prefer tar (Windows 10+ / macOS / Linux) — Compress-Archive often drops nested files.
const tar = spawnSync(
  'tar',
  ['-a', '-cf', outZip, '-C', extensionDir, '.'],
  { encoding: 'utf8' }
);
if (tar.status !== 0) {
  console.error(tar.stdout, tar.stderr);
  process.exit(tar.status ?? 1);
}

const st = fs.statSync(outZip);
console.log(`wrote ${outZip} (${Math.round(st.size / 1024)} KB)`);
