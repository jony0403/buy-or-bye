/**
 * Generate realistic used-marketplace phone photos via OpenAI Images API.
 * Usage: OPENAI_API_KEY=... node scripts/generate-demo-images.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
      'Casual smartphone photo of used Apple AirPods Pro 2 USB-C case and earbuds on a slightly messy wooden desk in a Korean apartment, natural window light, realistic wear dust fingerprints, no text, no watermark, documentary used-marketplace style',
      'Close-up phone photo of open AirPods Pro charging case showing both earbuds, minor scuffs, handheld slightly shaky framing, realistic used item listing photo',
      'Phone photo of AirPods accessories: extra tips and short USB-C cable next to case on floor mat, everyday Korean home background, realistic used market photo',
    ],
  },
  {
    id: 'switch-oled-accessories',
    prompts: [
      'Smartphone photo of Nintendo Switch OLED handheld console on sofa, used condition, natural indoor light, Korean home, realistic secondhand listing photo, no text',
      'Phone photo of Switch OLED with Joy-Cons detached, dock half visible behind, ambiguous accessory set, messy coffee table, realistic used marketplace photo',
      'Close phone photo of Switch USB-C cable only, dock not clearly included, handheld listing style, realistic',
    ],
  },
  {
    id: 'galaxy-promo-photos',
    prompts: [
      'Clean studio-like product shot of Samsung Galaxy phone front screen, looks like shopping mall promo capture, bright white background, polished marketing style',
      'Casual smartphone photo of same Galaxy phone held in hand over kitchen table, reflections fingerprints, realistic Korean used listing photo',
      'Phone photo of Galaxy box and charger cable on floor, imperfect framing, realistic secondhand market photo',
    ],
  },
  {
    id: 'macbook-price-compare',
    prompts: [
      'Smartphone photo of used MacBook Air on desk with lid open, keyboard wear, natural light, Korean apartment, realistic used marketplace listing photo, no text',
      'Angled phone photo of closed MacBook Air silver lid with minor scuffs, bedside table clutter, realistic secondhand photo',
      'Close-up phone photo of MacBook ports and charger plug area, slight blur, realistic listing style',
    ],
  },
  {
    id: 'ipad-body-gaps',
    prompts: [
      'Smartphone photo of used iPad on couch cushion, minimal context, sparse framing, realistic Korean used listing photo, no text overlay',
      'Phone photo of iPad screen off reflecting ceiling light, incomplete accessory view, realistic secondhand listing',
      'Handheld photo of iPad edge and back camera, plain background, sparse product condition info vibe, realistic',
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
  if (!res.ok) {
    throw new Error(data?.error?.message || `HTTP ${res.status}`);
  }
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error('no image data');
  return Buffer.from(b64, 'base64');
}

for (const job of jobs) {
  const dir = path.join(root, 'demo', 'images', job.id);
  fs.mkdirSync(dir, { recursive: true });
  const urls = [];
  for (let i = 0; i < job.prompts.length; i++) {
    const out = path.join(dir, `${i + 1}.png`);
    console.log('gen', job.id, i + 1);
    try {
      const buf = await generateOne(job.prompts[i]);
      fs.writeFileSync(out, buf);
      urls.push(`/demo-images/${job.id}/${i + 1}.png`);
    } catch (e) {
      console.warn('fail', job.id, i + 1, e instanceof Error ? e.message : e);
    }
  }
  if (!urls.length) continue;
  const scenPath = path.join(root, 'demo', 'scenarios', `${job.id}.json`);
  const scen = JSON.parse(fs.readFileSync(scenPath, 'utf8'));
  scen.listing.imageUrls = urls;
  // clear fake product page to avoid broken sale links conceptually - keep for id but UI disables
  fs.writeFileSync(scenPath, JSON.stringify(scen, null, 2) + '\n');
  console.log('updated scenario', job.id, urls.length);
}

console.log('done');
