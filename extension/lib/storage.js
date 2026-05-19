/** @file chrome.storage 에 매물 저장 */
(() => {
  const Root = globalThis.MarketScrape;
  const MAX_HISTORY = 30;

  Root.toExportRecord = (data) => {
    const seller = data.seller
      ? Object.fromEntries(Object.entries(data.seller).filter(([k]) => !k.startsWith('_')))
      : null;
    return {
      platform: data.platform,
      platformLabel: data.platformLabel,
      itemId: data.itemId,
      title: data.title,
      price: data.price,
      priceLabel: data.priceLabel,
      body: data.body,
      imageUrls: data.imageUrls || [],
      seller,
      source: data.source,
      sourceLabel: data.sourceLabel || data.source,
      pageUrl: location.href,
      exportedAt: new Date().toISOString(),
    };
  };

  Root.saveListing = (data) => {
    const record = Root.toExportRecord(data);
    const listingKey = `${record.platform}:${record.itemId}`;
    return new Promise((resolve) => {
      chrome.storage.local.get(['marketScrapeHistory', 'marketScrapeComps'], (res) => {
        let history = Array.isArray(res.marketScrapeHistory) ? res.marketScrapeHistory : [];
        history = history.filter((h) => `${h.platform}:${h.itemId}` !== listingKey);
        history.unshift(record);
        history = history.slice(0, MAX_HISTORY);

        const prevComps = res.marketScrapeComps;
        const comps =
          prevComps?.forItemKey === listingKey
            ? prevComps
            : { forItemKey: listingKey, bunjang: null, daangn: null };

        chrome.storage.local.set(
          {
            marketScrapeLatest: record,
            marketScrapeHistory: history,
            marketScrapeComps: comps,
          },
          () => resolve(record)
        );
      });
    });
  };
})();
