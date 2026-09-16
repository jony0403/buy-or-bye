/**
 * Regenerate mismatched/near-duplicate sample listing photos with distinct prompts.
 * Usage: node scripts/regen-sample-photos.mjs
 * Reads OPENAI_API_KEY from env (or RAILWAY via caller).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const key = String(process.env.OPENAI_API_KEY || '').trim();
if (!key) {
  console.error('OPENAI_API_KEY required');
  process.exit(1);
}

const jobs = [
  {
    id: 'airpods-pro2-chronic',
    prompts: [
      'Realistic Korean used-marketplace smartphone photo: white Apple AirPods Pro 2 USB-C charging case OPEN on a wooden desk, both earbuds inside, green LED on, slight dust fingerprints, yellow microfiber cloth nearby, natural window light, imperfect framing, no text no watermark',
      'Realistic used listing phone photo: white AirPods Pro earbuds REMOVED from case, laid on desk next to CLOSED white charging case, ear tips visible, mild scuffs, Korean apartment desk clutter keyboard edge, natural light, no text',
      'Realistic secondhand listing photo: AirPods Pro extra silicone tips and short white USB-C cable next to charging case on fabric floor mat, slightly messy Korean home, handheld phone camera, no text no watermark',
    ],
  },
  {
    id: 'sidiz-t50-chair',
    prompts: [
      'Realistic Korean used-marketplace photo of a black mesh office chair similar to Sidiz T50 in a bedroom, full chair visible, worn armrest scuffs, tangled cables on floor, natural indoor light, documentary phone photo, no text',
      'Close-up realistic phone photo of the SAME style black mesh office chair SEAT cushion showing fabric wear holes and lint, armrest scuffing visible at edge, Korean bedroom background partially out of focus, used listing style, no text',
    ],
  },
  {
    id: 'nike-dunk-low',
    prompts: [
      'Realistic Korean used-marketplace phone photo of a pair of Nike Dunk Low sneakers (panda black white) standing on wooden floor, visible creasing and light dirt, slightly messy room corner, natural light, no text no watermark',
      'Realistic used listing phone photo of Nike Dunk Low sneakers lying on side showing dirty outsoles and midsole scuffs on wooden floor, different angle from product shot, Korean home, handheld camera, no text',
    ],
  },
  {
    id: 'macbook-price-compare',
    prompts: [
      'Realistic Korean used-marketplace phone photo of a closed midnight or space gray MacBook Air on cluttered desk, fingerprints and light scuffs on lid, cables in background, natural indoor light, no Touch Bar visible, no text',
      'Realistic used listing phone photo of open MacBook Air on wooden desk showing keyboard and trackpad, screen on with simple wallpaper, thin bezel no Touch Bar, mild wear, Korean apartment, no text no watermark',
    ],
  },
];

async function generateOne(prompt) {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt,
      size: '1024x1024',
      quality: 'medium',
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error('no image data');
  return Buffer.from(b64, 'base64');
}

async function avgHash(buf) {
  const { data } = await sharp(buf).greyscale().resize(16, 16, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });
  let sum = 0;
  for (const v of data) sum += v;
  const mean = sum / data.length;
  return [...data].map((v) => (v >= mean ? '1' : '0')).join('');
}

function hamming(a, b) {
  let d = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
  return d;
}

for (const job of jobs) {
  const dir = path.join(root, 'demo', 'images', job.id);
  fs.mkdirSync(dir, { recursive: true });
  for (const name of fs.readdirSync(dir)) {
    if (/^\d+\.png$/i.test(name)) fs.unlinkSync(path.join(dir, name));
  }
  const hashes = [];
  const imageUrls = [];
  for (let i = 0; i < job.prompts.length; i++) {
    console.log('gen', job.id, i + 1);
    let buf = await generateOne(job.prompts[i]);
    buf = await sharp(buf).rotate().png({ compressionLevel: 8 }).toBuffer();
    const hash = await avgHash(buf);
    for (let j = 0; j < hashes.length; j++) {
      const dist = hamming(hash, hashes[j]);
      if (dist < 18) console.warn('warn similar', job.id, i + 1, 'vs', j + 1, 'hamming', dist);
    }
    hashes.push(hash);
    fs.writeFileSync(path.join(dir, `${i + 1}.png`), buf);
    imageUrls.push(`/demo-images/${job.id}/${i + 1}.png`);
  }
  const scenPath = path.join(root, 'demo', 'scenarios', `${job.id}.json`);
  const scen = JSON.parse(fs.readFileSync(scenPath, 'utf8'));
  scen.listing.imageUrls = imageUrls;
  fs.writeFileSync(scenPath, JSON.stringify(scen, null, 2) + '\n');
  console.log('ok', job.id, imageUrls.length);
}

console.log('done');
