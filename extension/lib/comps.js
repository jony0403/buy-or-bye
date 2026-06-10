/** @file 비교 매물(검색 결과) 저장 */
(() => {
  const Root = globalThis.MarketScrape;
  const PLATFORM_IDS = ['bunjang', 'daangn', 'joongna'];
  const MAX_COMPS_PER_PLATFORM = 40;

  function compKey(item) {
    return String(item?.url || item?.href || `${item?.title || ''}|${item?.priceLabel || item?.price || ''}`)
      .trim()
      .toLowerCase();
  }

  function mergeCompItems(prevItems, nextItems) {
    const out = [];
    const seen = new Map();
    for (const item of [...(prevItems || []), ...(nextItems || [])]) {
      const key = compKey(item);
      if (!key) continue;
      const existingIndex = seen.get(key);
      if (existingIndex != null) {
        if (Object.prototype.hasOwnProperty.call(item, 'imageUrl')) {
          if (item.imageUrl) {
            out[existingIndex] = { ...out[existingIndex], imageUrl: item.imageUrl };
          } else if (out[existingIndex].imageUrl) {
            out[existingIndex] = { ...out[existingIndex] };
            delete out[existingIndex].imageUrl;
          }
        }
        continue;
      }
      seen.set(key, out.length);
      out.push(item);
      if (out.length >= MAX_COMPS_PER_PLATFORM) break;
    }
    return out;
  }

  function mergeQueryLabel(prevQuery, nextQuery) {
    const parts = String(prevQuery || '')
      .split(/\s*[,\n]\s*/g)
      .concat(String(nextQuery || '').split(/\s*[,\n]\s*/g))
      .map((q) => q.trim())
      .filter(Boolean);
    return [...new Set(parts)].join(', ');
  }

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
        const prevPlatform = prev[platform] || null;
        const list = mergeCompItems(prevPlatform?.items, items);
        const next = {
          forItemKey: forItemKey || prev.forItemKey || null,
          status: prev.status || 'collecting',
          startedAt: prev.startedAt || Date.now(),
          expected: prev.expected || null,
        };
        for (const id of PLATFORM_IDS) next[id] = prev[id] || null;
        next[platform] = {
          items: list,
          count: list.length,
          collectedAt: new Date().toISOString(),
          searchUrl: meta.searchUrl || '',
          query: mergeQueryLabel(prevPlatform?.query, meta.query),
        };
        chrome.storage.local.set({ marketScrapeComps: next }, () => resolve(next));
      });
    });
  };

  Root.markCompsCollected = () =>
    new Promise((resolve) => {
      chrome.storage.local.get(['marketScrapeComps'], (res) => {
        const prev = res.marketScrapeComps || {};
        chrome.storage.local.set(
          {
            marketScrapeComps: {
              ...prev,
              status: 'collected',
              collectedAt: new Date().toISOString(),
            },
          },
          resolve
        );
      });
    });

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
              status: 'collecting',
              startedAt: Date.now(),
              ...Object.fromEntries(PLATFORM_IDS.map((id) => [id, null])),
            },
          },
          resolve
        );
      });
    });
})();
