/**
 * Replace near-duplicate / mismatched demo sample photos with distinct Unsplash shots.
 * Usage: node scripts/refresh-demo-sample-images.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const jobs = [
  {
    id: 'airpods-pro2-chronic',
    // Open case vs earbuds out vs tips/cable — clearly different frames
    urls: [
      'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    id: 'sidiz-t50-chair',
    urls: [
      'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    id: 'nike-dunk-low',
    urls: [
      'https://images.unsplash.com/photo-1623684225794-a8f1f5037f5c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1612015670817-0127d21628d4?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    id: 'macbook-price-compare',
    urls: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1200&q=80',
    ],
  },
];
// phone-screen-crack / helinox-chair: already distinct (crack angles + rear / chair + bag) — leave alone


async function fetchBuf(url) {
  const res = await fetch(url, {
    redirect: 'follow',
    headers: {
      'User-Agent': 'buy-or-bye-demo-refresh/1.0',
      Accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function avgHash(buf) {
  const { data } = await sharp(buf)
    .greyscale()
    .resize(16, 16, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true });
  let sum = 0;
  for (const v of data) sum += v;
  const mean = sum / data.length;
  let bits = '';
  for (const v of data) bits += v >= mean ? '1' : '0';
  return bits;
}

function hamming(a, b) {
  let d = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) d++;
  return d;
}

for (const job of jobs) {
  const dir = path.join(root, 'demo', 'images', job.id);
  fs.mkdirSync(dir, { recursive: true });
  // clear old numbered pngs so stale 3.png etc don't linger when count shrinks
  for (const name of fs.readdirSync(dir)) {
    if (/^\d+\.png$/i.test(name)) fs.unlinkSync(path.join(dir, name));
  }
  const hashes = [];
  const imageUrls = [];
  for (let i = 0; i < job.urls.length; i++) {
    const url = job.urls[i];
    process.stdout.write(`fetch ${job.id}/${i + 1} ... `);
    const raw = await fetchBuf(url);
    const out = await sharp(raw)
      .rotate()
      .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
      .png({ compressionLevel: 8 })
      .toBuffer();
    const hash = await avgHash(out);
    for (let j = 0; j < hashes.length; j++) {
      const dist = hamming(hash, hashes[j]);
      if (dist < 12) {
        throw new Error(`${job.id}: image ${i + 1} too similar to ${j + 1} (hamming ${dist})`);
      }
    }
    hashes.push(hash);
    const file = path.join(dir, `${i + 1}.png`);
    fs.writeFileSync(file, out);
    imageUrls.push(`/demo-images/${job.id}/${i + 1}.png`);
    console.log(`${out.length} bytes`);
  }

  const scenPath = path.join(root, 'demo', 'scenarios', `${job.id}.json`);
  if (fs.existsSync(scenPath)) {
    const scen = JSON.parse(fs.readFileSync(scenPath, 'utf8'));
    scen.listing.imageUrls = imageUrls;
    fs.writeFileSync(scenPath, JSON.stringify(scen, null, 2) + '\n');
    console.log('scenario', job.id, imageUrls.length);
  }
}

// Nike listing copy: dunk panda/red is fine; keep size note
{
  const p = path.join(root, 'demo', 'scenarios', 'nike-dunk-low.json');
  const scen = JSON.parse(fs.readFileSync(p, 'utf8'));
  scen.listing.title = '나이키 덩크 로우 275 중고';
  scen.listing.body =
    '사이즈 275입니다.\n실착용 흔적·굽 마모 있습니다.\n박스 있어요. 직거래 우선입니다.\n가품 아닙니다.';
  fs.writeFileSync(p, JSON.stringify(scen, null, 2) + '\n');
}

console.log('done');
