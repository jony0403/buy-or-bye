/** 분석 페이지(localhost) ↔ 확장 storage 브릿지 */
(() => {
  const PORTS = [3920, 3921];

  function isAnalyzerPage() {
    if (location.hostname !== '127.0.0.1' && location.hostname !== 'localhost') return false;
    const p = Number(location.port);
    return PORTS.includes(p);
  }

  if (!isAnalyzerPage()) return;

  function attachComps(latest, comps) {
    if (!latest || !comps?.forItemKey) return latest;
    const key = `${latest.platform}:${latest.itemId}`;
    if (comps.forItemKey !== key) return latest;
    return { ...latest, comps };
  }

  function pushToPage() {
    chrome.storage.local.get(['marketScrapeLatest', 'marketScrapeHistory', 'marketScrapeComps'], (res) => {
      const latest = attachComps(res.marketScrapeLatest, res.marketScrapeComps);
      window.postMessage(
        {
          type: 'MARKET_SCRAPE_BRIDGE',
          latest,
          history: res.marketScrapeHistory || [],
          comps: res.marketScrapeComps || null,
        },
        '*'
      );
    });
  }

  window.addEventListener('message', (ev) => {
    if (ev.source !== window || ev.data?.type !== 'MARKET_SCRAPE_REQUEST') return;
    pushToPage();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.marketScrapeLatest || changes.marketScrapeHistory || changes.marketScrapeComps) pushToPage();
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === 'PUSH_ANALYZER') {
      pushToPage();
      return true;
    }
    return undefined;
  });

  pushToPage();
})();
