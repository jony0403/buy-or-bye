/** @file 번개장터 + 당근 통합 확장 — 진입점 */
(() => {
  if (globalThis.__MARKET_SCRAPE_BOOT__) return;
  globalThis.__MARKET_SCRAPE_BOOT__ = true;
  globalThis.MarketScrape?.boot?.();
})();
