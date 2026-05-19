/** @file 번개·당근 검색 URL 생성 */
(() => {
  const Root = globalThis.MarketScrape;

  Root.buildBunjangSearchUrl = (query, order = 'score', page = 1) => {
    const u = new URL('https://m.bunjang.co.kr/search/products');
    u.searchParams.set('q', String(query || '').trim());
    if (order) u.searchParams.set('order', order);
    if (page > 1) u.searchParams.set('page', String(page));
    return u.href;
  };

  Root.buildDaangnSearchUrl = (query) => {
    const u = new URL('https://www.daangn.com/kr/buy-sell/');
    u.searchParams.set('search', String(query || '').trim());
    return u.href;
  };

  Root.guessSearchQuery = (title) => {
    let q = String(title || '')
      .replace(/\[[^\]]*\]/g, ' ')
      .replace(/[|｜]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (q.length > 40) q = q.slice(0, 40).replace(/\s+\S*$/, '').trim();
    return q || '중고';
  };

  Root.isBunjangSearchUrl = (url) => {
    try {
      const u = new URL(url);
      if (!u.hostname.includes('bunjang.co.kr')) return false;
      return u.pathname.includes('/search') && u.searchParams.has('q');
    } catch {
      return false;
    }
  };

  Root.isDaangnSearchUrl = (url) => {
    try {
      const u = new URL(url);
      if (!u.hostname.includes('daangn.com')) return false;
      return /\/kr\/buy-sell\/?$/.test(u.pathname) && u.searchParams.has('search');
    } catch {
      return false;
    }
  };

  Root.isMarketSearchUrl = (url) => Root.isBunjangSearchUrl(url) || Root.isDaangnSearchUrl(url);
})();
