/** @file 매물 본문(갤러리) 사진만 수집 — 추천·프로필·광고 제외 */
(() => {
  const Root = globalThis.MarketScrape;

  const NOISE_SECTION_RE =
    /비슷한|추천|함께\s*본|인기\s*매물|다른\s*상품|related|recommend|similar|other.?item|seller|판매자|리뷰\s*더|후기\s*더|광고|advert|footer|gnb|header-nav|bottom-tab/i;

  Root.isInsideNoiseSection = (el) => {
    let n = el;
    for (let i = 0; i < 14 && n; i++) {
      const bits =
        (n.getAttribute?.('aria-label') || '') +
        (typeof n.className === 'string' ? n.className : '') +
        (n.getAttribute?.('data-testid') || '') +
        (n.id || '');
      if (NOISE_SECTION_RE.test(bits)) return true;
      n = n.parentElement;
    }
    return false;
  };

  Root.findDetailRootNearTitle = () => {
    const h1 = document.querySelector('h1');
    if (!h1) return document.querySelector('main') || document.body;
    let node = h1.parentElement;
    for (let depth = 0; depth < 10 && node; depth++) {
      const imgs = node.querySelectorAll('img');
      if (imgs.length >= 1 && imgs.length <= 24) return node;
      node = node.parentElement;
    }
    return h1.parentElement || document.querySelector('main') || document.body;
  };

  Root.collectImgUrlsFromElements = (images, testUrl) => {
    const urls = new Set();
    const take = (raw) => {
      if (!raw) return;
      const u = String(raw).trim().split(/\s+/)[0].split(/[?#]/)[0];
      if (testUrl(u)) urls.add(u);
    };
    for (const img of images || []) {
      if (Root.isInsideNoiseSection(img)) continue;
      const nw = img.naturalWidth || img.width || 0;
      const nh = img.naturalHeight || img.height || 0;
      if (nw > 0 && nh > 0 && (nw < 56 || nh < 56)) continue;
      take(img.currentSrc || img.src);
      const ss = img.getAttribute('srcset');
      if (ss) for (const part of ss.split(',')) take(part.trim().split(/\s+/)[0]);
    }
    return [...urls];
  };

  Root.collectImgUrlsInRoot = (root, testUrl) => {
    if (!root) return [];
    return Root.collectImgUrlsFromElements(root.querySelectorAll('img'), testUrl);
  };
})();
