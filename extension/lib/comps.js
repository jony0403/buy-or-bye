/** @file 비교 매물(검색 결과) 저장 */
(() => {
  const Root = globalThis.MarketScrape;
  const MAX_COMPS_PER_PLATFORM = 40;

  Root.parsePriceNumber = (raw) => {
    const n = Number(String(raw ?? '').replace(/[^\d]/g, ''));
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  Root.saveComps = (platform, items, meta = {}) => {
    return new Promise((resolve) => {
      chrome.storage.local.get(['marketScrapeLatest', 'marketScrapeComps'], (res) => {
        const latest = res.marketScrapeLatest;
        const forItemKey = latest ? `${latest.platform}:${latest.itemId}` : null;
        const prev = res.marketScrapeComps || {};
        const list = (items || []).slice(0, MAX_COMPS_PER_PLATFORM);
        const next = {
          forItemKey: forItemKey || prev.forItemKey || null,
          bunjang: prev.bunjang || null,
          daangn: prev.daangn || null,
        };
        next[platform] = {
          items: list,
          count: list.length,
          collectedAt: new Date().toISOString(),
          searchUrl: meta.searchUrl || '',
          query: meta.query || '',
        };
        chrome.storage.local.set({ marketScrapeComps: next }, () => resolve(next));
      });
    });
  };

  Root.clearComps = () =>
    new Promise((resolve) => {
      chrome.storage.local.set({ marketScrapeComps: null }, resolve);
    });

  Root.resetCompsForNewListing = (listingKey) =>
    new Promise((resolve) => {
      chrome.storage.local.get(['marketScrapeComps'], (res) => {
        const prev = res.marketScrapeComps;
        if (prev?.forItemKey === listingKey) {
          resolve(prev);
          return;
        }
        chrome.storage.local.set(
          {
            marketScrapeComps: {
              forItemKey: listingKey,
              bunjang: null,
              daangn: null,
            },
          },
          resolve
        );
      });
    });
})();
