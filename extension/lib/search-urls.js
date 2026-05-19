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

  /** 제목만으로 만드는 폴백 검색어 — `analyzer-server.mjs` MAX_SEARCH_QUERY_CHARS(96) 와 동일 상한 */
  Root.guessSearchQuery = (title) => {
    const maxLen = 96;
    let q = String(title || '')
      .replace(/\[[^\]]*\]/g, ' ')
      .replace(/[|｜]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (q.length > maxLen) q = q.slice(0, maxLen).replace(/\s+\S*$/, '').trim() || q.slice(0, maxLen);
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

  /**
   * 검색 URL에서 q / search 파라미터.
   * @param {string} [url]
   */
  Root.getSearchQueryFromUrl = (url) => {
    try {
      const u = new URL(url || (typeof location !== 'undefined' ? location.href : ''), 'https://example.com');
      return (u.searchParams.get('q') || u.searchParams.get('search') || '').trim();
    } catch {
      return '';
    }
  };

  /**
   * 검색 결과 카드가 현재 검색과 관련 있어 보이는지(느슨한 필터).
   * - 검색어에 한글이 없으면 필터 안 함(영문 전용 검색 오탐 방지).
   * - 한글 검색이면 2자 이상 토큰 중 하나라도 제목에 부분 문자열로 나오면 통과.
   */
  Root.listingTitleMatchesSearchQuery = (title, query) => {
    const q = String(query || '').trim();
    if (!q) return true;
    if (!/[\uAC00-\uD7A3]/.test(q)) return true;

    const t = String(title || '').toLowerCase();
    const tokens = q
      .toLowerCase()
      .split(/\s+/)
      .map((x) => x.replace(/[^\p{L}\p{N}]+/gu, ''))
      .filter((x) => x.length >= 2);
    if (!tokens.length) return true;
    return tokens.some((tok) => t.includes(tok));
  };
})();
