/**
 * Step3 자동매물수집 — 확장 대신 Playwright로 기존 comps 스키마에 맞게 수집되는지 검증
 * Usage: node scripts/smoke-playwright-comps.mjs [query]
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
const query = String(process.argv[2] || '아이폰 16 256GB').trim();

function parsePrice(raw) {
  const n = Number(String(raw ?? '').replace(/[^\d]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function searchUrls(q) {
  return {
    bunjang: `https://m.bunjang.co.kr/search/products?q=${encodeURIComponent(q)}&order=score`,
    daangn: `https://www.daangn.com/kr/search/buy-sell/?q=${encodeURIComponent(q)}`,
  };
}

async function scrapeBunjang(page, q) {
  const url = searchUrls(q).bunjang;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.waitForTimeout(3200);
  return page.evaluate(() => {
    const out = [];
    const seen = new Set();
    const parsePrice = (raw) => {
      const n = Number(String(raw ?? '').replace(/[^\d]/g, ''));
      return Number.isFinite(n) && n > 0 ? n : null;
    };
    for (const a of document.querySelectorAll('a[href*="/products/"], a[href*="/product/"]')) {
      const m = a.href.match(/\/products?\/(\d+)/);
      if (!m || seen.has(m[1])) continue;
      const card = a.closest('article,li,div') || a.parentElement;
      const text = (card?.innerText || '').trim();
      if (/\uAD11\uACE0|AD\b/i.test(text.slice(0, 40))) continue;
      const title = (
        a.getAttribute('title') ||
        a.getAttribute('aria-label') ||
        text.split('\n').find((l) => l.length > 2 && !/^[\d,]+\s*원$/.test(l.trim())) ||
        `매물 ${m[1]}`
      )
        .trim()
        .slice(0, 120);
      const priceM = text.match(/([\d,]+)\s*원/);
      const price = parsePrice(priceM?.[1]);
      let imageUrl = '';
      for (const img of card?.querySelectorAll?.('img') || []) {
        const src = img.currentSrc || img.src || '';
        if (/media\.bunjang\.co\.kr\/product/i.test(src)) {
          imageUrl = src.split('?')[0];
          break;
        }
      }
      seen.add(m[1]);
      out.push({
        platform: 'bunjang',
        platformLabel: '번개장터',
        itemId: m[1],
        title,
        price,
        priceLabel: price != null ? `${price.toLocaleString('ko-KR')}원` : priceM?.[0] || '—',
        url: `https://m.bunjang.co.kr/products/${m[1]}`,
        ...(imageUrl ? { imageUrl } : {}),
      });
      if (out.length >= 12) break;
    }
    return out;
  });
}

async function scrapeDaangn(page, q) {
  const url = searchUrls(q).daangn;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.waitForTimeout(3800);
  return page.evaluate(() => {
    const out = [];
    const seen = new Set();
    const parsePrice = (raw) => {
      const n = Number(String(raw ?? '').replace(/[^\d]/g, ''));
      return Number.isFinite(n) && n > 0 ? n : null;
    };
    for (const a of document.querySelectorAll('a[href*="/buy-sell/"]')) {
      let path = '';
      try {
        path = new URL(a.href).pathname;
      } catch {
        continue;
      }
      if (!/\/kr\/buy-sell\/[^/]+\/?$/.test(path)) continue;
      const href = a.href.split('?')[0];
      if (seen.has(href)) continue;
      const card = a.closest('[data-gtm="search_article"], article, li, div') || a;
      const text = (card.innerText || a.textContent || '').trim();
      if (/광고/.test(text.slice(0, 30))) continue;
      const title = (
        a.getAttribute('aria-label') ||
        text
          .split('\n')
          .find(
            (l) =>
              l.length >= 3 &&
              !/^[\d,]+\s*원$/.test(l.trim()) &&
              !/^(끌올|광고|나눔)$/.test(l.trim()) &&
              !/분 전|시간 전|일 전|방금/.test(l)
          ) ||
        `당근 매물`
      )
        .trim()
        .slice(0, 120);
      const priceM = text.match(/([\d,]+)\s*원/);
      const isFree = !priceM && text.split('\n').some((l) => l.trim() === '나눔');
      const price = isFree ? 0 : parsePrice(priceM?.[1]);
      let imageUrl = '';
      for (const img of card.querySelectorAll('img')) {
        const src = img.currentSrc || img.src || img.getAttribute('data-src') || '';
        if (/origin\/article|gcp-karroter|karrotmarket|daangncdn/i.test(src)) {
          imageUrl = src;
          break;
        }
      }
      const statusM = text.match(/판매완료|예약중|거래완료/);
      seen.add(href);
      out.push({
        platform: 'daangn',
        platformLabel: '당근마켓',
        itemId: path.replace(/\/$/, '').split('/').pop() || String(out.length + 1),
        title,
        price,
        priceLabel: isFree ? '나눔' : price != null ? `${price.toLocaleString('ko-KR')}원` : priceM?.[0] || '—',
        url: href,
        ...(imageUrl ? { imageUrl } : {}),
        ...(statusM ? { saleStatus: statusM[0] } : {}),
      });
      if (out.length >= 12) break;
    }
    return out;
  });
}

function validateItem(item) {
  const missing = [];
  if (!item.platform) missing.push('platform');
  if (!item.itemId) missing.push('itemId');
  if (!item.title || item.title.length < 2) missing.push('title');
  if (!item.url || !/^https?:\/\//i.test(item.url)) missing.push('url');
  if (item.price == null && item.price !== 0 && !item.priceLabel) missing.push('price');
  return missing;
}

async function main() {
  console.log(`query=${query}`);
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

  const started = Date.now();
  const bunjang = await scrapeBunjang(page, query);
  const daangn = await scrapeDaangn(page, query);
  await browser.close();

  const comps = {
    forItemKey: 'smoke:playwright',
    status: 'collected',
    collectedAt: new Date().toISOString(),
    expectedQueries: [query],
    bunjang: { items: bunjang, count: bunjang.length, query, searchUrl: searchUrls(query).bunjang },
    daangn: { items: daangn, count: daangn.length, query, searchUrl: searchUrls(query).daangn },
  };

  const all = [...bunjang, ...daangn];
  const invalid = all
    .map((it) => ({ it, missing: validateItem(it) }))
    .filter((x) => x.missing.length);
  const withImage = all.filter((it) => it.imageUrl).length;

  const report = {
    query,
    ms: Date.now() - started,
    counts: {
      bunjang: bunjang.length,
      daangn: daangn.length,
      total: all.length,
      withImage,
      invalid: invalid.length,
    },
    schemaCompatible: all.length > 0 && invalid.length === 0,
    canFeedExistingStep3:
      bunjang.length + daangn.length >= 2 &&
      invalid.length === 0 &&
      (bunjang.length > 0 || daangn.length > 0),
    samples: {
      bunjang: bunjang.slice(0, 2),
      daangn: daangn.slice(0, 2),
    },
    invalid: invalid.slice(0, 5).map((x) => ({
      platform: x.it.platform,
      title: x.it.title,
      missing: x.missing,
    })),
  };

  const compsPath = path.join(outDir, 'comps-playwright.json');
  const reportPath = path.join(outDir, 'comps-report.json');
  fs.writeFileSync(compsPath, JSON.stringify(comps, null, 2), 'utf8');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(JSON.stringify(report, null, 2));
  console.log(`wrote ${compsPath}`);
  process.exit(report.canFeedExistingStep3 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
