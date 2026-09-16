/**
 * Smoke: Playwright로 중고 매물 URL을 열어 제목·가격·본문·사진을 읽을 수 있는지 확인.
 * Usage: node scripts/smoke-playwright-url.mjs [url...]
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', '_pw-smoke');
fs.mkdirSync(outDir, { recursive: true });

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

function platformOf(url) {
  const host = new URL(url).hostname.toLowerCase();
  if (host.includes('bunjang') || host.includes('bgzt')) return 'bunjang';
  if (host.includes('daangn') || host.includes('karrot')) return 'daangn';
  if (host.includes('joongna')) return 'joongna';
  return 'unknown';
}

async function discoverListingUrls(page) {
  const found = {};
  const tries = [
    {
      id: 'bunjang',
      search: 'https://m.bunjang.co.kr/search/products?q=%EC%95%84%EC%9D%B4%ED%8F%B0&order=score',
      pick: async () => {
        await page.goto(
          'https://m.bunjang.co.kr/search/products?q=%EC%95%84%EC%9D%B4%ED%8F%B0&order=score',
          { waitUntil: 'domcontentloaded', timeout: 45_000 }
        );
        await page.waitForTimeout(2500);
        return page.evaluate(() => {
          const a = [...document.querySelectorAll('a[href*="/products/"], a[href*="/product/"]')].find((el) =>
            /\/products?\/\d+/.test(el.href)
          );
          return a?.href || '';
        });
      },
    },
    {
      id: 'daangn',
      search: 'https://www.daangn.com/kr/search/buy-sell/?q=%EC%95%84%EC%9D%B4%ED%8F%B0',
      pick: async () => {
        await page.goto('https://www.daangn.com/kr/search/buy-sell/?q=%EC%95%84%EC%9D%B4%ED%8F%B0', {
          waitUntil: 'domcontentloaded',
          timeout: 45_000,
        });
        await page.waitForTimeout(3000);
        return page.evaluate(() => {
          const a = [...document.querySelectorAll('a[href*="/buy-sell/"]')].find((el) => {
            try {
              const p = new URL(el.href).pathname;
              return /\/buy-sell\/\d+/.test(p) || /\/articles\/\d+/.test(p);
            } catch {
              return false;
            }
          });
          return a?.href?.split('?')[0] || '';
        });
      },
    },
    {
      id: 'joongna',
      search: 'https://web.joongna.com/search/%EC%95%84%EC%9D%B4%ED%8F%B0',
      pick: async () => {
        await page.goto('https://web.joongna.com/search/%EC%95%84%EC%9D%B4%ED%8F%B0', {
          waitUntil: 'domcontentloaded',
          timeout: 45_000,
        });
        await page.waitForTimeout(3000);
        return page.evaluate(() => {
          const a = [...document.querySelectorAll('a[href*="/product/"]')].find((el) =>
            /\/product\/\d+/.test(el.href)
          );
          return a?.href?.split('?')[0] || '';
        });
      },
    },
  ];

  for (const t of tries) {
    try {
      const href = await t.pick();
      found[t.id] = href || null;
      console.log(`[discover] ${t.id}: ${href || '(none)'}`);
    } catch (e) {
      found[t.id] = null;
      console.log(`[discover] ${t.id}: FAIL ${e instanceof Error ? e.message : e}`);
    }
  }
  return found;
}

async function extractListing(page, url) {
  const platform = platformOf(url);
  const started = Date.now();
  const result = {
    url,
    platform,
    ok: false,
    title: '',
    priceText: '',
    bodyLen: 0,
    imageCount: 0,
    imageSample: [],
    finalUrl: '',
    status: 0,
    ms: 0,
    error: '',
    notes: [],
  };

  try {
    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    result.status = res?.status?.() || 0;
    result.finalUrl = page.url();
    await page.waitForTimeout(platform === 'daangn' ? 3500 : 2500);

    // soft wait for common title selectors
    await Promise.race([
      page.waitForSelector('h1, h2, [class*="title" i], [class*="Title"]', { timeout: 5_000 }).catch(() => null),
      page.waitForTimeout(5_000),
    ]);

    const shot = path.join(outDir, `${platform}-${Date.now()}.png`);
    await page.screenshot({ path: shot, fullPage: false });
    result.notes.push(`screenshot=${path.basename(shot)}`);

    const data = await page.evaluate((plat) => {
      const text = (document.body?.innerText || '').replace(/\s+/g, ' ').trim();
      const title =
        document.querySelector('h1')?.textContent?.trim() ||
        document.querySelector('meta[property="og:title"]')?.content?.trim() ||
        document.title ||
        '';
      const priceMeta = document.querySelector('meta[property="product:price:amount"]')?.content || '';
      const priceMatch = text.match(/([\d,]+)\s*원/);
      const priceText = priceMeta ? `${priceMeta}원` : priceMatch?.[0] || '';

      const imgs = [...document.querySelectorAll('img')]
        .map((img) => img.currentSrc || img.src || '')
        .filter(Boolean)
        .filter((u) => !/^data:/.test(u))
        .filter((u) => {
          if (plat === 'bunjang') return /bunjang|bgzt|media\.bunjang/i.test(u);
          if (plat === 'daangn') return /karrot|daangn|gcp-karroter|cloudfront/i.test(u);
          if (plat === 'joongna') return /joongna|cloudinary|kakaocdn/i.test(u);
          return true;
        });

      // body heuristic: longest paragraph-ish block excluding nav noise
      const blocks = [...document.querySelectorAll('p, article, [class*="content" i], [class*="description" i]')]
        .map((el) => (el.innerText || '').trim())
        .filter((t) => t.length >= 40)
        .sort((a, b) => b.length - a.length);

      return {
        title: title.slice(0, 160),
        priceText,
        body: (blocks[0] || text.slice(0, 500)).slice(0, 800),
        images: [...new Set(imgs)].slice(0, 12),
        hasChallenge: /captcha|cloudflare|access denied|비정상적인|로봇|인증/i.test(text.slice(0, 2000)),
        titleTag: document.title,
      };
    }, platform);

    result.title = data.title;
    result.priceText = data.priceText;
    result.bodyLen = (data.body || '').length;
    result.imageCount = data.images.length;
    result.imageSample = data.images.slice(0, 3);
    if (data.hasChallenge) result.notes.push('possible-bot-challenge');
    result.ok = Boolean(result.title && (result.priceText || result.bodyLen > 40 || result.imageCount > 0));
    if (!result.ok) result.error = 'insufficient fields';
  } catch (e) {
    result.error = e instanceof Error ? e.message : String(e);
  }
  result.ms = Date.now() - started;
  return result;
}

async function main() {
  const cliUrls = process.argv.slice(2).filter((u) => /^https?:\/\//i.test(u));
  console.log('launching chromium...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled'],
  });
  const context = await browser.newContext({
    userAgent: UA,
    locale: 'ko-KR',
    viewport: { width: 1280, height: 900 },
  });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });
  const page = await context.newPage();

  let urls = cliUrls;
  if (!urls.length) {
    console.log('no URL args → discover from search pages');
    const found = await discoverListingUrls(page);
    urls = Object.values(found).filter(Boolean);
  }

  if (!urls.length) {
    console.log('RESULT: no listing URLs discovered');
    await browser.close();
    process.exit(2);
  }

  const results = [];
  for (const url of urls) {
    console.log(`\n=== open ${url}`);
    const r = await extractListing(page, url);
    results.push(r);
    console.log(JSON.stringify(r, null, 2));
  }

  await browser.close();
  const summaryPath = path.join(outDir, 'summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2), 'utf8');
  const okCount = results.filter((r) => r.ok).length;
  console.log(`\nDONE ${okCount}/${results.length} ok → ${summaryPath}`);
  process.exit(okCount ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
