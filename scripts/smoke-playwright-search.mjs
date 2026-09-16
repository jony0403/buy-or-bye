/**
 * Smoke: Playwright로 검색 결과 목록 수집 가능한지 확인
 */
import { chromium } from 'playwright';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
const q = '아이폰 16 256GB';

const browser = await chromium.launch({
  headless: true,
  args: ['--disable-blink-features=AutomationControlled'],
});
const ctx = await browser.newContext({
  userAgent: UA,
  locale: 'ko-KR',
  viewport: { width: 1280, height: 900 },
});
await ctx.addInitScript(() => {
  Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
});
const page = await ctx.newPage();

async function scrape(name, url, fn) {
  const t = Date.now();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForTimeout(3500);
    const items = await page.evaluate(fn);
    console.log(JSON.stringify({ name, ok: true, count: items.length, sample: items.slice(0, 3), ms: Date.now() - t }, null, 2));
  } catch (e) {
    console.log(JSON.stringify({ name, ok: false, error: String(e.message || e), ms: Date.now() - t }));
  }
}

await scrape(
  'bunjang',
  `https://m.bunjang.co.kr/search/products?q=${encodeURIComponent(q)}&order=score`,
  () => {
    const out = [];
    const seen = new Set();
    for (const a of document.querySelectorAll('a[href*="/products/"],a[href*="/product/"]')) {
      const m = a.href.match(/\/products?\/(\d+)/);
      if (!m || seen.has(m[1])) continue;
      const card = a.closest('article,li,div') || a.parentElement;
      const text = (card?.innerText || '').trim();
      const title = (
        a.getAttribute('title') ||
        text.split('\n').find((l) => l.length > 2 && !/[\d,]+\s*원/.test(l)) ||
        ''
      ).slice(0, 100);
      const price = (text.match(/([\d,]+)\s*원/) || [])[0] || '';
      const img = [...(card?.querySelectorAll?.('img') || [])]
        .map((i) => i.src)
        .find((u) => /media\.bunjang|product/i.test(u));
      seen.add(m[1]);
      out.push({ title, price, url: a.href.split('?')[0], img: Boolean(img) });
      if (out.length >= 8) break;
    }
    return out;
  }
);

await scrape(
  'daangn',
  `https://www.daangn.com/kr/search/buy-sell/?q=${encodeURIComponent(q)}`,
  () => {
    const out = [];
    const seen = new Set();
    for (const a of document.querySelectorAll('a[href*="/buy-sell/"]')) {
      const href = a.href.split('?')[0];
      let path = '';
      try {
        path = new URL(href).pathname;
      } catch {
        continue;
      }
      if (!/\/kr\/buy-sell\/[^/]+\/?$/.test(path)) continue;
      if (seen.has(href)) continue;
      const card = a.closest('article,li,div') || a;
      const text = (card.innerText || a.textContent || '').trim();
      const title = (
        text
          .split('\n')
          .find(
            (l) =>
              l.length > 3 &&
              !/[\d,]+\s*원/.test(l) &&
              !/광고|끌올|분 전|시간 전|일 전/.test(l)
          ) ||
        a.getAttribute('aria-label') ||
        ''
      ).slice(0, 100);
      const price = (text.match(/([\d,]+)\s*원/) || [])[0] || '';
      const img = [...card.querySelectorAll('img')]
        .map((i) => i.currentSrc || i.src)
        .find((u) => /karrot|gcp-karroter|origin\/article/i.test(u));
      if (!title && !price) continue;
      seen.add(href);
      out.push({ title, price, url: href, img: Boolean(img) });
      if (out.length >= 8) break;
    }
    return out;
  }
);

await scrape('joongna', `https://web.joongna.com/search/${encodeURIComponent(q)}`, () => {
  const out = [];
  const seen = new Set();
  for (const a of document.querySelectorAll('a[href*="/product/"]')) {
    const m = a.href.match(/\/product\/(\d+)/);
    if (!m || seen.has(m[1])) continue;
    const card = a.closest('article,li,div') || a;
    const text = (card.innerText || '').trim();
    const title = (
      text.split('\n').find((l) => l.length > 2 && !/[\d,]+\s*원/.test(l)) || ''
    ).slice(0, 100);
    const price = (text.match(/([\d,]+)\s*원/) || [])[0] || '';
    seen.add(m[1]);
    out.push({ title, price, url: a.href.split('?')[0], img: false });
    if (out.length >= 8) break;
  }
  return out;
});

await browser.close();
