/** @file 중고나라 (web.joongna.com) 어댑터 */
(() => {
  const MS = globalThis.MarketScrape;
  const { register, formatWon } = MS;

  const DETAIL_PATH_RE = /\/product\/(\d+)(?:\/|$)/;

  function textFromJsonString(raw) {
    const s = String(raw || '');
    if (!s) return '';
    try {
      return JSON.parse(`"${s.replace(/"/g, '\\"')}"`).replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    } catch {
      return s.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    }
  }

  function extractItemIdFromUrl(url = location.href) {
    try {
      const m = new URL(url, location.origin).pathname.match(DETAIL_PATH_RE);
      return m?.[1] || null;
    } catch {
      return null;
    }
  }

  function isDetailPage(url = location.href) {
    if (extractItemIdFromUrl(url)) return true;
    const canonical = document.querySelector('link[rel="canonical"]')?.href || '';
    const ogUrl = document.querySelector('meta[property="og:url"]')?.getAttribute('content') || '';
    return Boolean(extractItemIdFromUrl(canonical) || extractItemIdFromUrl(ogUrl));
  }

  function isSearchPage(url = location.href) {
    return MS.isJoongnaSearchUrl?.(url);
  }

  function isListingImageUrl(url) {
    const u = String(url || '').split(/[?#]/)[0];
    if (!/^https?:\/\//i.test(u)) return false;
    if (/logo|icon|sprite|app|google|apple|og_joongna|profile|avatar/i.test(u)) return false;
    return /joongna|jn|jng|cloudfront|cloudinary|s3|image|img|cdn/i.test(u) && /\.(webp|jpg|jpeg|png)$/i.test(u);
  }

  function firstSrcsetUrl(srcset) {
    return (
      String(srcset || '')
        .split(',')
        .map((part) => part.trim().split(/\s+/)[0])
        .filter(Boolean)
        .at(-1) || ''
    );
  }

  function usableImageUrl(raw) {
    const value = String(raw || '').trim();
    if (!value || /^data:|^blob:/i.test(value)) return '';
    try {
      const parsed = new URL(value, location.href);
      const nested = parsed.searchParams.get('url') || parsed.searchParams.get('src');
      if (nested) return new URL(nested, location.href).href.split(/[?#]/)[0];
      return parsed.href.split(/[?#]/)[0];
    } catch {
      return value.split(/[?#]/)[0];
    }
  }

  function normalizeEmbeddedUrl(raw) {
    return usableImageUrl(
      String(raw || '')
        .replace(/\\u0026/g, '&')
        .replace(/\\\//g, '/')
        .replace(/\\"/g, '"')
    );
  }

  function mediaDedupeKey(url) {
    try {
      const u = new URL(String(url || ''), location.href);
      return `${u.hostname}${u.pathname}`.toLowerCase();
    } catch {
      return String(url || '').split(/[?#]/)[0].toLowerCase();
    }
  }

  function uniqueMediaUrls(urls) {
    const out = [];
    const seen = new Set();
    for (const raw of urls || []) {
      const url = normalizeEmbeddedUrl(raw);
      if (!isListingImageUrl(url)) continue;
      const key = mediaDedupeKey(url);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(url);
    }
    return out;
  }

  function extractAllOriginalImageUrls(text) {
    const urls = [];
    const re = /https?:[\\/]+img2\.joongna\.com\/media\/original\/[^"'\\\s<>)]+?\.(?:jpg|jpeg|png|webp)(?:\?[^"'\\\s<>)]+)?/gi;
    for (const match of String(text || '').matchAll(re)) {
      urls.push(match[0]);
    }
    return uniqueMediaUrls(urls);
  }

  function imageFromImg(img) {
    const url = usableImageUrl(
      img?.currentSrc ||
        firstSrcsetUrl(img?.srcset) ||
        img?.src ||
        img?.getAttribute?.('data-src') ||
        img?.getAttribute?.('data-lazy') ||
        ''
    );
    return isListingImageUrl(url) ? url : '';
  }

  function harvestImagesFromDom() {
    const root = MS.findDetailRootNearTitle?.() || document.querySelector('main') || document.body;
    const urls = [];
    for (const img of root.querySelectorAll?.('img') || []) {
      if (MS.isInsideNoiseSection?.(img)) continue;
      const url = imageFromImg(img);
      if (url) urls.push(url);
    }
    for (const link of document.querySelectorAll('link[rel="preload"][as="image"]')) {
      const url = usableImageUrl(link.getAttribute('href') || '');
      if (isListingImageUrl(url)) urls.push(url);
    }
    const og = document.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';
    if (isListingImageUrl(og)) urls.push(usableImageUrl(og));
    return [...new Set(urls)].slice(0, 16);
  }

  function extractMediaUrlsFromFlightText(text) {
    const urls = [];
    const originalUrls = extractAllOriginalImageUrls(text);
    const originRe = /\\?"originUrl\\?"\s*:\s*\\?"(https?:[\\/\w%?&=.:_-]+?)\\?"/g;
    for (const match of text.matchAll(originRe)) urls.push(match[1]);
    if (urls.length || originalUrls.length) return uniqueMediaUrls([...urls, ...originalUrls]).slice(0, 16);

    const urlRe = /\\?"(?:mediaUrl|thumbnailUrl|waterMarkUrl)\\?"\s*:\s*\\?"(https?:[\\/\w%?&=.:_-]+?)\\?"/g;
    for (const match of text.matchAll(urlRe)) {
      urls.push(match[1]);
    }
    const preloadRe = /:HL\[\\"(https?:[\\/\w%?&=.:_-]+?)\\",\\"image\\"\]/g;
    for (const match of text.matchAll(preloadRe)) {
      urls.push(match[1]);
    }
    return uniqueMediaUrls([...urls, ...originalUrls]).slice(0, 16);
  }

  function productFromNextFlight() {
    const text = [...document.querySelectorAll('script')]
      .map((script) => script.textContent || '')
      .filter((scriptText) => scriptText.includes('productSeq') || scriptText.includes('productTitle'))
      .join('\n');
    if (!text) return null;
    const pickString = (key) => {
      const m = text.match(new RegExp(`\\\\?"${key}\\\\?"\\s*:\\s*\\\\?"([\\s\\S]*?)\\\\?"(?=,\\\\?"|})`));
      return textFromJsonString(m?.[1] || '');
    };
    const pickNumber = (key) => {
      const m = text.match(new RegExp(`\\\\?"${key}\\\\?"\\s*:\\s*(-?\\d+)`));
      return m ? Number(m[1]) : null;
    };
    const pickBoolean = (key) => {
      const m = text.match(new RegExp(`\\\\?"${key}\\\\?"\\s*:\\s*(true|false)`));
      return m ? m[1] === 'true' : null;
    };
    const productSeq = pickNumber('productSeq');
    const productTitle = pickString('productTitle');
    const productDescription = pickString('productDescription');
    const productPrice = pickNumber('productPrice');
    if (!productSeq && !productTitle && !productDescription) return null;
    return {
      productSeq,
      productTitle,
      productDescription,
      productPrice,
      parcelFeeYn: pickNumber('parcelFeeYn'),
      productStatus: pickNumber('productStatus'),
      categoryName: pickString('categoryName'),
      nickName: pickString('nickName'),
      storeSeq: pickNumber('storeSeq'),
      isSafePayment: pickBoolean('isSafePayment'),
      labels: [...text.matchAll(/\\?"labels\\?"\s*:\s*\[([\s\S]*?)\]/g)]
        .flatMap((match) => [...match[1].matchAll(/\\?"([^"\\]+)\\?"/g)].map((m) => textFromJsonString(m[1])))
        .filter(Boolean),
      mediaUrls: extractMediaUrlsFromFlightText(text || document.documentElement.innerHTML),
    };
  }

  function parseSellerMetrics(text) {
    const raw = String(text || '');
    const numberAfter = (label) => {
      const m = raw.match(new RegExp(`${label}\\s*([\\d,]+)`));
      if (!m) return null;
      const n = Number(m[1].replace(/,/g, ''));
      return Number.isFinite(n) ? n : null;
    };
    const trustM = raw.match(/신뢰지수\s*([\d,]+)(?:\s*\/?\s*([\d,]+))?/);
    const trustScore = trustM ? Number(trustM[1].replace(/,/g, '')) : null;
    const trustMax = trustM?.[2] ? Number(trustM[2].replace(/,/g, '')) : null;
    return {
      trustScore: Number.isFinite(trustScore) ? trustScore : null,
      trustMax: Number.isFinite(trustMax) ? trustMax : null,
      safePaymentCount: numberAfter('안심결제'),
      reviewCount: numberAfter('거래후기'),
      followerCount: numberAfter('단골'),
    };
  }

  function hasSellerMetricsText(text) {
    return /신뢰지수|거래후기|단골|안심결제\s*[\d,]+/.test(String(text || ''));
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function waitForSellerMetrics() {
    for (let i = 0; i < 8; i += 1) {
      if (hasSellerMetricsText(document.body?.innerText || '')) return true;
      await sleep(i < 3 ? 250 : 500);
    }
    return false;
  }

  function scrapeProductFromDom() {
    const product = productFromNextFlight() || {};
    const itemId =
      product.productSeq ||
      extractItemIdFromUrl() ||
      extractItemIdFromUrl(document.querySelector('link[rel="canonical"]')?.href || '') ||
      extractItemIdFromUrl(document.querySelector('meta[property="og:url"]')?.getAttribute('content') || '');
    const title =
      product.productTitle ||
      document.querySelector('h1')?.textContent?.trim() ||
      document.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim() ||
      document.title?.split('|')[0]?.trim() ||
      '';
    const body =
      product.productDescription ||
      document.querySelector('meta[property="og:description"]')?.getAttribute('content')?.trim() ||
      document.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() ||
      '';
    const text = document.body?.innerText || '';
    const priceText = product.productPrice != null ? String(product.productPrice) : text.match(/([\d,]+)\s*원/)?.[1] || '';
    const price = MS.parsePriceNumber(priceText);
    const isFree = /(^|\s)(무료나눔|나눔)(\s|$)/.test(`${title}\n${body}\n${text}`);
    const shipping =
      product.parcelFeeYn === 1 || product.labels?.some?.((label) => /배송비\s*포함|무료배송/.test(label))
        ? { shippingFee: 0, shippingFeeLabel: '배송비 무료/포함' }
        : MS.parseShippingInfo?.(body, text);
    const sellerName =
      product.nickName ||
      document.querySelector('[class*="store" i] [class*="name" i]')?.textContent?.trim() ||
      document.querySelector('[class*="seller" i]')?.textContent?.trim() ||
      '';
    const imageUrls = product.mediaUrls?.length ? product.mediaUrls : uniqueMediaUrls(harvestImagesFromDom());
    const sellerMetrics = parseSellerMetrics(text);

    if (!title && !body && !imageUrls.length) return null;
    return {
      platform: 'joongna',
      platformLabel: '중고나라',
      itemId: String(itemId || extractItemIdFromUrl() || title),
      title,
      price: isFree ? 0 : price,
      priceLabel: isFree ? '나눔' : price != null ? formatWon(price) : priceText ? `${priceText}원` : '—',
      ...(shipping || {}),
      body,
      imageUrls,
      seller: {
        shopName: sellerName,
        storeSeq: product.storeSeq || null,
        trustScore: sellerMetrics.trustScore,
        trustMax: sellerMetrics.trustMax,
        safePaymentCount: sellerMetrics.safePaymentCount,
        reviewCount: sellerMetrics.reviewCount,
        followerCount: sellerMetrics.followerCount,
        isSafePayment: product.isSafePayment,
      },
      source: product.productSeq ? 'next-flight' : 'dom',
      sourceLabel: product.productSeq ? 'Next' : 'DOM',
    };
  }

  function harvestSearchListings() {
    const items = [];
    const seen = new Set();
    const query = MS.getSearchQueryFromUrl?.(location.href) || '';
    for (const a of document.querySelectorAll('a[href*="/product/"]')) {
      if (MS.isInsideNoiseSection?.(a)) continue;
      let url;
      try {
        url = new URL(a.href, location.origin);
      } catch {
        continue;
      }
      const m = url.pathname.match(DETAIL_PATH_RE);
      if (!m || seen.has(m[1])) continue;
      const card = a.closest('article, li, div[class*="product" i], div[class*="card" i]') || a;
      const text = (card.innerText || a.textContent || '').trim();
      if (/최근\s*본\s*상품|앱\s*다운로드|카테고리/.test(text.slice(0, 80))) continue;
      const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
      const title =
        a.getAttribute('title') ||
        a.getAttribute('aria-label') ||
        lines.find((line) => !/^[\d,]+\s*원/.test(line) && !/^\d+\s*일\s*전/.test(line) && !/무료배송|판매완료/.test(line)) ||
        '';
      if (!MS.listingTitleMatchesSearchQuery?.(title, query)) continue;
      const priceM = text.match(/([\d,]+)\s*원/);
      const isFree = /무료나눔|(^|\s)나눔(\s|$)/.test(text);
      const price = MS.parsePriceNumber(priceM?.[1]);
      const imageUrl = imageFromImg(card.querySelector?.('img')) || '';
      const saleStatus = /판매완료|예약중|거래완료/.exec(text)?.[0] || '';
      seen.add(m[1]);
      items.push({
        platform: 'joongna',
        platformLabel: '중고나라',
        itemId: m[1],
        title: title.trim().slice(0, 140) || `매물 ${m[1]}`,
        price: isFree ? 0 : price,
        priceLabel: isFree ? '나눔' : price != null ? formatWon(price) : priceM?.[0] || '—',
        url: `https://web.joongna.com/product/${m[1]}`,
        ...(imageUrl ? { imageUrl } : {}),
        ...(saleStatus ? { saleStatus } : {}),
      });
      if (items.length >= 60) break;
    }
    return items;
  }

  register({
    id: 'joongna',
    label: '중고나라',
    matches: (host) => host === 'web.joongna.com' || host.endsWith('.joongna.com'),
    isDetailPage,
    isSearchPage,
    harvestSearchListings,
    guessItemId: () => extractItemIdFromUrl(),
    async fetchListing() {
      await waitForSellerMetrics();
      const data = scrapeProductFromDom();
      if (!data?.title && !data?.imageUrls?.length) {
        throw new Error('중고나라 매물 데이터를 찾지 못했습니다. 페이지를 새로고침한 뒤 다시 시도하세요.');
      }
      return data;
    },
  });
})();
