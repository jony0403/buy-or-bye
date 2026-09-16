/**
 * Playwright marketplace scrapers — listing detail import + Step3 comps collection.
 * Same comps item schema as the old Chrome extension.
 */
import { chromium } from 'playwright';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const DEFAULT_TIMEOUT_MS = 45_000;

let sharedBrowser = null;
let sharedBrowserLaunching = null;

function parsePriceNumber(raw) {
  const n = Number(String(raw ?? '').replace(/[^\d]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function formatWon(n) {
  if (n == null || !Number.isFinite(n)) return '—';
  return `${Math.round(n).toLocaleString('ko-KR')}원`;
}

export function buildBunjangSearchUrl(query, order = 'score') {
  const u = new URL('https://m.bunjang.co.kr/search/products');
  u.searchParams.set('q', String(query || '').trim());
  if (order) u.searchParams.set('order', order);
  return u.href;
}

export function buildDaangnSearchUrl(query) {
  const u = new URL('https://www.daangn.com/kr/search/buy-sell/');
  u.searchParams.set('q', String(query || '').trim());
  return u.href;
}

export function buildJoongnaSearchUrl(query) {
  return `https://web.joongna.com/search/${encodeURIComponent(String(query || '').trim())}`;
}

export function classifyListingUrl(rawUrl) {
  const raw = String(rawUrl || '').trim();
  if (!raw) return null;
  let url;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  const host = url.hostname.toLowerCase();
  if (/(^|\.)bunjang\.co\.kr$/i.test(host) || /(^|\.)bgzt\.link$/i.test(host)) {
    return { platform: 'bunjang', url: url.href, shortShare: /(^|\.)bgzt\.link$/i.test(host) };
  }
  if (/(^|\.)daangn\.com$/i.test(host) || /(^|\.)karrot\.link$/i.test(host)) {
    return { platform: 'daangn', url: url.href, shortShare: /(^|\.)karrot\.link$/i.test(host) };
  }
  if (/(^|\.)joongna\.com$/i.test(host)) {
    return { platform: 'joongna', url: url.href, shortShare: false };
  }
  if (host === 'abr.ge' || /(^|\.)airbridge\.io$/i.test(host)) {
    return { platform: 'unknown', url: url.href, shortShare: true };
  }
  return null;
}

async function getBrowser() {
  if (sharedBrowser) return sharedBrowser;
  if (sharedBrowserLaunching) return sharedBrowserLaunching;
  sharedBrowserLaunching = chromium
    .launch({
      headless: true,
      args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'],
    })
    .then((browser) => {
      sharedBrowser = browser;
      sharedBrowserLaunching = null;
      browser.on('disconnected', () => {
        sharedBrowser = null;
      });
      return browser;
    })
    .catch((err) => {
      sharedBrowserLaunching = null;
      throw err;
    });
  return sharedBrowserLaunching;
}

async function withPage(fn) {
  const browser = await getBrowser();
  const context = await browser.newContext({
    userAgent: UA,
    locale: 'ko-KR',
    viewport: { width: 1280, height: 900 },
  });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });
  const page = await context.newPage();
  try {
    return await fn(page);
  } finally {
    await context.close().catch(() => {});
  }
}

async function bunjangDetailViaApi(pid) {
  const res = await fetch(`https://api.bunjang.co.kr/api/pms/v1/products/${pid}/detail/web`, {
    headers: {
      'User-Agent': UA,
      Accept: 'application/json',
      Referer: 'https://m.bunjang.co.kr/',
    },
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) return null;
  const json = await res.json();
  const data = json?.data || json;
  const title = String(data?.name || data?.product?.name || data?.title || '').trim();
  const price = parsePriceNumber(data?.price ?? data?.product?.price);
  const images = [];
  const pushImg = (raw) => {
    const u = String(raw || '').trim();
    if (/media\.bunjang\.co\.kr\/product/i.test(u)) images.push(u.split('?')[0]);
  };
  for (const img of data?.product_image || data?.images || data?.productImages || []) {
    if (typeof img === 'string') pushImg(img);
    else pushImg(img?.url || img?.src || img?.imageUrl);
  }
  if (data?.imageUrl) pushImg(data.imageUrl);
  if (data?.image_url) pushImg(data.image_url);
  const body = String(data?.description || data?.content || data?.product?.description || '').trim();
  if (!title && !images.length) return null;
  return {
    platform: 'bunjang',
    platformLabel: '번개장터',
    itemId: String(pid),
    title: title || `매물 ${pid}`,
    price,
    priceLabel: price != null ? formatWon(price) : '—',
    body,
    imageUrls: [...new Set(images)].slice(0, 20),
    pageUrl: `https://m.bunjang.co.kr/products/${pid}`,
    seller: data?.shop
      ? {
          nickname: data.shop.name || data.shop.shop_name || '',
          reviewCount: data.shop.review_count ?? data.shop.reviewCount,
          salesCount: data.shop.sale_count ?? data.shop.salesCount,
        }
      : null,
    source: 'bunjang-api',
  };
}

async function extractDetailFromDom(page, platform, finalUrl) {
  return page.evaluate(
    ({ plat, href }) => {
      const text = (document.body?.innerText || '').replace(/\s+/g, ' ').trim();
      const ogTitle = document.querySelector('meta[property="og:title"]')?.content?.trim() || '';
      const h1 = document.querySelector('h1')?.textContent?.trim() || '';
      let title = h1 || ogTitle || document.title || '';
      if (plat === 'bunjang' && (!title || title === '번개장터' || title === 'Bunjang')) {
        title =
          document.querySelector('[class*="ProductSummary"] h1, [class*="product-title"], [class*="ProductTitle"]')
            ?.textContent?.trim() ||
          ogTitle ||
          title;
      }
      const priceMeta = document.querySelector('meta[property="product:price:amount"]')?.content || '';
      const priceMatch = text.match(/([\d,]+)\s*원/);
      const priceRaw = priceMeta || priceMatch?.[1] || '';
      const price = (() => {
        const n = Number(String(priceRaw).replace(/[^\d]/g, ''));
        return Number.isFinite(n) && n > 0 ? n : null;
      })();

      const imageUrls = [];
      const push = (raw) => {
        const u = String(raw || '').trim();
        if (!u || /^data:|^blob:/i.test(u)) return;
        if (plat === 'bunjang' && !/media\.bunjang\.co\.kr\/product/i.test(u)) return;
        if (plat === 'daangn' && !/(karrot|daangn|gcp-karroter|origin\/article)/i.test(u)) return;
        if (plat === 'joongna' && (/icon|logo|\.svg/i.test(u) || !/(joongna|cloudinary|kakaocdn|media)/i.test(u)))
          return;
        imageUrls.push(u.split('?')[0] === u ? u : u);
      };
      for (const img of document.querySelectorAll('img')) {
        push(img.currentSrc || img.src || img.getAttribute('data-src'));
      }
      const ogImage = document.querySelector('meta[property="og:image"]')?.content;
      if (ogImage) push(ogImage);

      const blocks = [...document.querySelectorAll('p, article, [class*="content" i], [class*="description" i], [class*="Body"]')]
        .map((el) => (el.innerText || '').trim())
        .filter((t) => t.length >= 40)
        .sort((a, b) => b.length - a.length);
      const body = (blocks[0] || '').slice(0, 4000);

      let itemId = '';
      try {
        const u = new URL(href);
        if (plat === 'bunjang') itemId = (u.pathname.match(/\/products?\/(\d+)/) || [])[1] || '';
        if (plat === 'joongna') itemId = (u.pathname.match(/\/product\/(\d+)/) || [])[1] || '';
        if (plat === 'daangn') {
          itemId =
            (u.pathname.match(/\/articles\/(\d+)/) || [])[1] ||
            u.pathname.replace(/\/$/, '').split('/').filter(Boolean).pop() ||
            '';
        }
      } catch {
        /* ignore */
      }

      return {
        title: String(title || '').trim().slice(0, 160),
        price,
        priceLabel: price != null ? `${price.toLocaleString('ko-KR')}원` : priceMatch?.[0] || '—',
        body,
        imageUrls: [...new Set(imageUrls)].slice(0, 20),
        itemId,
        pageUrl: href,
      };
    },
    { plat: platform, href: finalUrl }
  );
}

export async function importListingByUrl(rawUrl) {
  const classified = classifyListingUrl(rawUrl);
  if (!classified) {
    const err = new Error('지원하는 중고 매물 URL이 아닙니다. (당근·번개장터·중고나라)');
    err.status = 400;
    throw err;
  }

  // Bunjang: prefer API when we already have a product id
  if (classified.platform === 'bunjang' && !classified.shortShare) {
    const pid = (classified.url.match(/\/products?\/(\d+)/) || [])[1];
    if (pid) {
      const viaApi = await bunjangDetailViaApi(pid);
      if (viaApi?.title && (viaApi.imageUrls?.length || viaApi.body)) {
        return {
          ...viaApi,
          exportedAt: new Date().toISOString(),
        };
      }
    }
  }

  return withPage(async (page) => {
    const res = await page.goto(classified.url, {
      waitUntil: 'domcontentloaded',
      timeout: DEFAULT_TIMEOUT_MS,
    });
    await page.waitForTimeout(classified.platform === 'daangn' ? 3200 : 2200);
    const finalUrl = page.url();
    let platform = classified.platform;
    if (platform === 'unknown' || classified.shortShare) {
      const reclass = classifyListingUrl(finalUrl);
      platform = reclass?.platform || platform;
      if (platform === 'unknown' || platform === 'bunjang') {
        const pid = (finalUrl.match(/\/products?\/(\d+)/) || [])[1];
        if (pid) {
          const viaApi = await bunjangDetailViaApi(pid);
          if (viaApi) {
            return { ...viaApi, pageUrl: finalUrl, exportedAt: new Date().toISOString() };
          }
          platform = 'bunjang';
        }
      }
      if (platform === 'unknown') {
        const err = new Error(`리다이렉트 후 플랫폼을 알 수 없습니다: ${finalUrl}`);
        err.status = 422;
        throw err;
      }
    }

    if (platform === 'bunjang') {
      const pid = (finalUrl.match(/\/products?\/(\d+)/) || [])[1];
      if (pid) {
        const viaApi = await bunjangDetailViaApi(pid);
        if (viaApi?.title) {
          return { ...viaApi, pageUrl: finalUrl.split('?')[0], exportedAt: new Date().toISOString() };
        }
      }
    }

    const dom = await extractDetailFromDom(page, platform, finalUrl.split('?')[0]);
    if (!dom.title || (dom.title === '번개장터' && !dom.imageUrls.length)) {
      const err = new Error('매물 정보를 읽지 못했습니다. URL을 확인하거나 잠시 후 다시 시도해 주세요.');
      err.status = 422;
      throw err;
    }
    const labels = { bunjang: '번개장터', daangn: '당근마켓', joongna: '중고나라' };
    return {
      platform,
      platformLabel: labels[platform] || platform,
      itemId: dom.itemId || `${platform}-${Date.now()}`,
      title: dom.title,
      price: dom.price,
      priceLabel: dom.priceLabel,
      body: dom.body || '',
      imageUrls: dom.imageUrls || [],
      pageUrl: dom.pageUrl || finalUrl.split('?')[0],
      seller: null,
      source: 'playwright',
      exportedAt: new Date().toISOString(),
      httpStatus: res?.status?.() || 0,
    };
  });
}

async function scrapeBunjangSearch(page, query) {
  const searchUrl = buildBunjangSearchUrl(query);
  await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: DEFAULT_TIMEOUT_MS });
  await page.waitForTimeout(3000);
  const items = await page.evaluate(() => {
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
      if (out.length >= 16) break;
    }
    return out;
  });
  return { items, searchUrl };
}

async function scrapeDaangnSearch(page, query) {
  const searchUrl = buildDaangnSearchUrl(query);
  await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: DEFAULT_TIMEOUT_MS });
  await page.waitForTimeout(3500);
  const items = await page.evaluate(() => {
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
        '당근 매물'
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
      if (out.length >= 16) break;
    }
    return out;
  });
  return { items, searchUrl };
}

async function scrapeJoongnaSearch(page, query) {
  const searchUrl = buildJoongnaSearchUrl(query);
  await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: DEFAULT_TIMEOUT_MS });
  await page.waitForTimeout(3200);
  const items = await page.evaluate(() => {
    const out = [];
    const seen = new Set();
    const parsePrice = (raw) => {
      const n = Number(String(raw ?? '').replace(/[^\d]/g, ''));
      return Number.isFinite(n) && n > 0 ? n : null;
    };
    for (const a of document.querySelectorAll('a[href*="/product/"]')) {
      const m = a.href.match(/\/product\/(\d+)/);
      if (!m || seen.has(m[1])) continue;
      const card = a.closest('article,li,div') || a;
      const text = (card.innerText || '').trim();
      const title = (
        text.split('\n').find((l) => l.length > 2 && !/[\d,]+\s*원/.test(l)) || `매물 ${m[1]}`
      )
        .trim()
        .slice(0, 120);
      const priceM = text.replace(/\s+/g, ' ').match(/([\d,]+)\s*원/);
      const price = parsePrice(priceM?.[1]);
      let imageUrl = '';
      for (const img of card.querySelectorAll('img')) {
        const src = img.currentSrc || img.src || '';
        if (/joongna|cloudinary|kakaocdn|media/i.test(src) && !/\.svg/i.test(src) && !/icon|logo/i.test(src)) {
          imageUrl = src;
          break;
        }
      }
      seen.add(m[1]);
      out.push({
        platform: 'joongna',
        platformLabel: '중고나라',
        itemId: m[1],
        title,
        price,
        priceLabel: price != null ? `${price.toLocaleString('ko-KR')}원` : priceM?.[0] || '—',
        url: `https://web.joongna.com/product/${m[1]}`,
        ...(imageUrl ? { imageUrl } : {}),
      });
      if (out.length >= 16) break;
    }
    return out;
  });
  return { items, searchUrl };
}

function mergeCompItems(prevItems, nextItems, max = 40) {
  const out = [];
  const seen = new Map();
  const keyOf = (item) =>
    String(item?.url || item?.href || `${item?.title || ''}|${item?.priceLabel || item?.price || ''}`)
      .trim()
      .toLowerCase();
  for (const item of [...(prevItems || []), ...(nextItems || [])]) {
    const key = keyOf(item);
    if (!key) continue;
    const idx = seen.get(key);
    if (idx != null) {
      const prev = out[idx];
      const merged = { ...prev, ...item };
      if (!item.imageUrl && prev.imageUrl) merged.imageUrl = prev.imageUrl;
      if (!merged.imageUrl) delete merged.imageUrl;
      out[idx] = merged;
      continue;
    }
    seen.set(key, out.length);
    out.push(item);
    if (out.length >= max) break;
  }
  return out;
}

/**
 * Collect comparison listings for one or more search queries across 3 platforms.
 */
export async function collectCompsForQueries({ queries, forItemKey = null, maxQueries = 3 } = {}) {
  const list = [...new Set((Array.isArray(queries) ? queries : [queries]).map((q) => String(q || '').trim()).filter(Boolean))].slice(
    0,
    maxQueries
  );
  if (!list.length) {
    const err = new Error('검색어가 비어 있습니다.');
    err.status = 400;
    throw err;
  }

  const buckets = {
    bunjang: { items: [], count: 0, query: list.join(', '), searchUrl: '' },
    daangn: { items: [], count: 0, query: list.join(', '), searchUrl: '' },
    joongna: { items: [], count: 0, query: list.join(', '), searchUrl: '' },
  };

  await withPage(async (page) => {
    for (const q of list) {
      try {
        const b = await scrapeBunjangSearch(page, q);
        buckets.bunjang.items = mergeCompItems(buckets.bunjang.items, b.items);
        buckets.bunjang.searchUrl = buckets.bunjang.searchUrl || b.searchUrl;
      } catch {
        /* keep going */
      }
      try {
        const d = await scrapeDaangnSearch(page, q);
        buckets.daangn.items = mergeCompItems(buckets.daangn.items, d.items);
        buckets.daangn.searchUrl = buckets.daangn.searchUrl || d.searchUrl;
      } catch {
        /* keep going */
      }
      try {
        const j = await scrapeJoongnaSearch(page, q);
        buckets.joongna.items = mergeCompItems(buckets.joongna.items, j.items);
        buckets.joongna.searchUrl = buckets.joongna.searchUrl || j.searchUrl;
      } catch {
        /* keep going */
      }
    }
  });

  for (const id of Object.keys(buckets)) {
    buckets[id].count = buckets[id].items.length;
    buckets[id].collectedAt = new Date().toISOString();
  }

  return {
    forItemKey: forItemKey || null,
    status: 'collected',
    collectedAt: new Date().toISOString(),
    expectedQueries: list,
    source: 'playwright',
    bunjang: buckets.bunjang,
    daangn: buckets.daangn,
    joongna: buckets.joongna,
  };
}

export async function closeSharedBrowser() {
  if (sharedBrowser) {
    await sharedBrowser.close().catch(() => {});
    sharedBrowser = null;
  }
}
