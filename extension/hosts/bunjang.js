/** @file 번개장터 어댑터 */
(() => {
  const MS = globalThis.MarketScrape;
  const { register, formatWon, textFromHtml } = MS;

  const UA =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36';

  const DETAIL_PATH_RE = /\/(?:product|products|posts)\/(\d+)(?:\/|$)/;

  function extractItemIdFromDetailUrl(u) {
    try {
      const parsed = new URL(String(u || '').trim(), 'https://bunjang.co.kr');
      const m = parsed.pathname.match(DETAIL_PATH_RE);
      return m?.[1] || null;
    } catch {
      return null;
    }
  }

  function isDetailPage(url = location.href) {
    return Boolean(extractItemIdFromDetailUrl(url));
  }

  function guessItemId() {
    if (!isDetailPage()) return null;
    const fromHref = extractItemIdFromDetailUrl(location.href);
    if (fromHref) return fromHref;
    try {
      const can = document.querySelector('link[rel="canonical"]')?.href;
      if (can && isDetailPage(can)) return extractItemIdFromDetailUrl(can);
    } catch {
      /* ignore */
    }
    return null;
  }

  function expandImageUrls(template, count, res = '800') {
    const urls = [];
    const n = Math.min(Math.max(Number(count) || 0, 0), 50);
    for (let i = 1; i <= n; i += 1) {
      urls.push(String(template).replace('{cnt}', String(i)).replace('{res}', res));
    }
    return urls;
  }

  function normalizeMediaUrl(src) {
    if (!src) return null;
    let u = String(src).trim().split(/\s+/)[0].split(/[?#]/)[0];
    if (!u.includes('media.bunjang.co.kr/product/')) return null;
    let out = u
      .replace(/_w\d+\.(webp|jpg|jpeg|png)$/i, '_w800.$1')
      .replace(/_w\{res\}/gi, '_w800')
      .replace(/\{res\}/gi, '800');
    if (out.includes('{cnt}')) return null;
    if (out.startsWith('//')) out = `https:${out}`;
    else if (!/^https?:\/\//i.test(out)) out = `https://${out.replace(/^\/+/, '')}`;
    return out;
  }

  function collectImageUrlsFromPayload(p) {
    const tpl = String(p.imageUrl || p.firstImageUrl || '').trim();
    const cnt = Math.min(Math.max(Number(p.imageCount) || 0, 0), 50);
    if (!tpl) return [];
    if (tpl.includes('{cnt}')) {
      if (cnt <= 0) return [];
      return expandImageUrls(tpl, cnt, '800')
        .map((u) => normalizeMediaUrl(u) || u)
        .filter(Boolean);
    }
    if (/media\.bunjang\.co\.kr\/product\//.test(tpl)) {
      const one = normalizeMediaUrl(tpl);
      return one ? [one] : [];
    }
    return [];
  }

  function sanitizeBunjangBody(raw) {
    let t = textFromHtml(raw)
      .replace(/\u00a0/g, ' ')
      .replace(/\r\n/g, '\n')
      .trim();
    if (!t) return '';
    if (/직거래부터\s*택배거래까지\s*쉽고\s*안전하게|취향\s*기반\s*중고거래\s*플랫폼/.test(t)) return '';
    if (/번개장터|중고거래\s*플랫폼/.test(t) && t.length < 120) return '';

    const stop = t.search(/(?:상품정보|거래정보|판매자정보|상점정보|연관상품|추천상품|비슷한\s*상품)/);
    if (stop > 8) t = t.slice(0, stop).trim();

    return t
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => {
        if (!line) return false;
        if (/^(브랜드|상품상태|수량|배송비|카테고리)\b/.test(line)) return false;
        if (/^(찜|댓글|조회|신고|공유)\b/.test(line)) return false;
        return true;
      })
      .join('\n')
      .trim();
  }

  function pickBody(p) {
    for (const k of ['description', 'detailHtml', 'descriptionHtml', 'memo']) {
      const t = sanitizeBunjangBody(p?.[k]);
      if (t.length >= 8) return t;
    }
    return '';
  }

  function extractSeller(payload) {
    const s = payload?.data?.shop;
    if (!s) return null;
    return {
      shopName: String(s.name || '').trim(),
      reviewRating: s.reviewRating != null ? Number(s.reviewRating) : null,
      reviewCount: s.reviewCount != null ? Number(s.reviewCount) : null,
      salesCount: s.salesCount != null ? Number(s.salesCount) : null,
      isProshop: Boolean(s.proshop?.isProshop),
    };
  }

  function extractShippingInfo(p, body = '') {
    const trade = p?.trade || {};
    const shippingSpecFees = Object.values(trade.shippingSpecs || {})
      .map((spec) => spec?.fee)
      .filter((fee) => fee != null && fee !== '');
    const tradeTexts = Array.isArray(p?.trades)
      ? p.trades.map((item) => {
          const contents = Array.isArray(item?.contents) ? item.contents.join(' ') : item?.contents || '';
          return [item?.title, contents].filter(Boolean).join(' ');
        })
      : [];
    return MS.parseShippingInfo?.(
      trade.freeShipping === true ? 0 : null,
      ...shippingSpecFees,
      p?.shippingFee,
      p?.shipping_fee,
      p?.deliveryFee,
      p?.delivery_fee,
      p?.deliveryCharge,
      p?.delivery_charge,
      p?.shippingPrice,
      p?.shipping_price,
      p?.deliveryPrice,
      p?.deliveryPriceText,
      p?.shippingFeeText,
      p?.deliveryFeeText,
      ...tradeTexts,
      body
    );
  }

  function isListingImageUrl(url, pid) {
    const n = normalizeMediaUrl(url);
    return Boolean(n && n.includes(`/product/${pid}_`));
  }

  function findBunjangGalleryRoot() {
    const detail = MS.findDetailRootNearTitle();
    const scoped =
      detail.querySelector(
        '[class*="ProductImage" i], [class*="product-image" i], [class*="ProductDetail" i] [class*="swiper" i], [class*="image-viewer" i], [data-testid*="product-image" i]'
      ) || detail.querySelector('[class*="swiper" i]');
    return scoped || detail;
  }

  function harvestImagesFromDom(pid) {
    const root = findBunjangGalleryRoot();
    const urls = MS.collectImgUrlsInRoot(root, (u) => isListingImageUrl(u, pid));
    return urls.sort((a, b) => {
      const na = Number((a.match(/_(\d+)_/) || [])[1] || 0);
      const nb = Number((b.match(/_(\d+)_/) || [])[1] || 0);
      return na - nb;
    });
  }

  function harvestBodyFromDom() {
    const meta = sanitizeBunjangBody(document.querySelector('meta[property="og:description"]')?.content || '');
    let best = '';
    const selectors = [
      '[data-testid*="description" i]',
      '[class*="description" i]',
      '[class*="ProductDescription" i]',
      '[class*="product-description" i]',
      'article',
    ];
    for (const sel of selectors) {
      document.getElementById('root')?.querySelectorAll(sel)?.forEach((el) => {
        if (MS.isInsideNoiseSection?.(el)) return;
        const t = sanitizeBunjangBody(el.innerText || '');
        if (t.length > best.length && t.length >= 4) best = t;
      });
    }
    return best || meta || '';
  }

  function toListing(pid, p, payload, source, sourceLabel, warn) {
    const body = pickBody(p);
    const shipping = extractShippingInfo(p, body);
    return {
      platform: 'bunjang',
      platformLabel: '번개장터',
      itemId: String(p.pid ?? pid),
      title: String(p.name || '').trim(),
      price: p.price,
      priceLabel: formatWon(p.price),
      ...(shipping || {}),
      body,
      imageUrls: collectImageUrlsFromPayload(p),
      seller: extractSeller(payload),
      source,
      sourceLabel,
      _warn: warn,
    };
  }

  function enrichDom(data, pid) {
    let body = data.body || '';
    let imgs = [...(data.imageUrls || [])];
    const domBody = harvestBodyFromDom();
    if (!body || (domBody && domBody.length >= 4 && domBody.length < Math.max(body.length, 120))) body = domBody;
    if (!imgs.length) imgs = harvestImagesFromDom(pid);
    const domShipping = data.shippingFeeLabel ? null : MS.parseShippingInfo?.(document.body?.innerText || '', domBody, body);
    return { ...data, ...(domShipping || {}), body: body.trim(), imageUrls: imgs };
  }

  async function fetchViaApi(pid) {
    const origin = 'https://m.bunjang.co.kr';
    const res = await fetch(`https://api.bunjang.co.kr/api/pms/v1/products/${pid}/detail/web`, {
      headers: {
        Accept: 'application/json',
        Origin: origin,
        Referer: `${origin}/products/${pid}`,
        'User-Agent': UA,
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || `API ${res.status}`);
    const p = data?.data?.product;
    if (!p?.name) throw new Error('상품 없음');
    return enrichDom(toListing(pid, p, data, 'api', 'API'), pid);
  }

  function fetchViaDom(pid) {
    const title = document.querySelector('h1')?.textContent?.trim() || document.title.split('|')[0].trim();
    const priceText = document.body.innerText.match(/[\d,]+\s*원/)?.[0] || '';
    const imgs = harvestImagesFromDom(pid);
    const body = harvestBodyFromDom();
    const shipping = MS.parseShippingInfo?.(document.body?.innerText || '', body);
    if (!title && !imgs.length && !body) return null;
    return enrichDom(
      {
        platform: 'bunjang',
        platformLabel: '번개장터',
        itemId: String(pid),
        title: title || '(제목 없음)',
        price: null,
        priceLabel: priceText || '—',
        ...(shipping || {}),
        body: body || '',
        imageUrls: imgs,
        seller: null,
        source: 'dom',
        sourceLabel: 'DOM',
      },
      pid
    );
  }

  function isSearchPage(url = location.href) {
    return MS.isBunjangSearchUrl(url);
  }

  function harvestSearchListings() {
    const items = [];
    const seen = new Set();
    const query = MS.getSearchQueryFromUrl?.(location.href) || '';
    const cardImageUrl = (card) => {
      const img = card?.querySelector?.('img');
      return String(img?.currentSrc || img?.src || img?.getAttribute?.('data-src') || '').trim();
    };
    const cardTitle = (a, card) => {
      const candidates = [
        a.getAttribute('title'),
        a.getAttribute('aria-label'),
        ...String(card?.innerText || '')
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean),
        a.textContent?.trim(),
      ];
      return (
        candidates.find(
          (line) =>
            line &&
            line.length >= 2 &&
            !/^[\d,]+\s*원$/.test(line) &&
            !/^상품\s*\d+$/i.test(line) &&
            !/^(찜|좋아요|조회|광고|AD)$/i.test(line)
        ) || ''
      );
    };
    const add = (href, titleHint, priceHint, imageUrl = '') => {
      const m = String(href || '').match(/\/(?:products|posts)\/(\d+)/);
      if (!m || seen.has(m[1])) return;
      const title = String(titleHint || '').trim().slice(0, 120) || `매물 ${m[1]}`;
      if (!MS.listingTitleMatchesSearchQuery?.(title, query)) return;
      seen.add(m[1]);
      const price = MS.parsePriceNumber(priceHint);
      const url = href.split('?')[0];
      items.push({
        platform: 'bunjang',
        platformLabel: '번개장터',
        itemId: m[1],
        title,
        price,
        priceLabel: price != null ? formatWon(price) : priceHint || '—',
        url: url.startsWith('http') ? url : `https://m.bunjang.co.kr/products/${m[1]}`,
        ...(imageUrl ? { imageUrl } : {}),
      });
    };

    for (const a of document.querySelectorAll('a[href*="/product/"], a[href*="/products/"], a[href*="/posts/"]')) {
      if (MS.isInsideNoiseSection(a)) continue;
      const card = a.closest('article, li, div[class*="Product"], div[class*="product"], div[class*="item"]') || a.parentElement;
      const text = card?.innerText || '';
      if (/광고|AD\b/i.test(text.slice(0, 30))) continue;
      const priceM = text.match(/([\d,]+)\s*원/);
      add(a.href, cardTitle(a, card), priceM?.[0], cardImageUrl(card));
    }
    return items;
  }

  register({
    id: 'bunjang',
    label: '번개장터',
    matches: (host) => host.includes('bunjang.co.kr'),
    isDetailPage,
    isSearchPage,
    harvestSearchListings,
    guessItemId,
    async fetchListing(itemId) {
      try {
        return await fetchViaApi(itemId);
      } catch (e) {
        const dom = fetchViaDom(itemId);
        if (dom) {
          dom._warn = `API 실패 → DOM: ${e instanceof Error ? e.message : e}`;
          return dom;
        }
        throw e;
      }
    },
  });
})();
