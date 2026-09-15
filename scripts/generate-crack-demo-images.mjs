/**
 * Generate cracked iPhone listing photos for the damage-circle demo sample.
 * Usage: OPENAI_API_KEY=... node scripts/generate-crack-demo-images.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const key = String(process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || '').trim();
if (!key) {
  console.error('OPENAI_API_KEY required');
  process.exit(1);
}

const id = 'phone-screen-crack';
const prompts = [
  'Realistic smartphone photo of a used purple iPhone 14 face-up on a wooden table in a Korean apartment, large spiderweb screen crack clearly visible on the lower-right of the display, natural window light, fingerprints dust, documentary used-marketplace listing style, no text, no watermark',
  'Close-up handheld phone photo focusing on cracked iPhone glass, deep cracks and shattered pixels on lower right, purple frame edge visible, slightly shaky framing, realistic secondhand listing photo, no text',
  'Casual phone photo of the same purple iPhone back and side on a desk, minor scuffs, screen not fully visible, Korean home background clutter, realistic used marketplace photo, no text',
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

const dir = path.join(root, 'demo', 'images', id);
fs.mkdirSync(dir, { recursive: true });
const urls = [];
for (let i = 0; i < prompts.length; i += 1) {
  const out = path.join(dir, `${i + 1}.png`);
  console.log('gen', id, i + 1);
  const buf = await generateOne(prompts[i]);
  fs.writeFileSync(out, buf);
  urls.push(`/demo-images/${id}/${i + 1}.png`);
  console.log('wrote', out, buf.length);
}

const scenPath = path.join(root, 'demo', 'scenarios', `${id}.json`);
const scen = JSON.parse(fs.readFileSync(scenPath, 'utf8'));
scen.listing.imageUrls = urls;
fs.writeFileSync(scenPath, `${JSON.stringify(scen, null, 2)}\n`);
console.log('updated scenario', scenPath);
