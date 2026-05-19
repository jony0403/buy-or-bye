/** 유사 매물 검색 탭(bunjang/daangn) 수집 완료 후 자동 닫기 */
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !changes.marketScrapeAutoCollect) return;
  const f = changes.marketScrapeAutoCollect.newValue;
  if (!f || f.bunjang || f.daangn) return;
  void closeSearchCollectionTabsIfAny();
});

async function closeSearchCollectionTabsIfAny() {
  const { marketScrapeCloseTabs } = await chrome.storage.local.get('marketScrapeCloseTabs');
  if (!Array.isArray(marketScrapeCloseTabs) || !marketScrapeCloseTabs.length) return;
  for (const id of marketScrapeCloseTabs) {
    try {
      await chrome.tabs.remove(id);
    } catch {
      /* 이미 닫힘 */
    }
  }
  await chrome.storage.local.remove(['marketScrapeCloseTabs']);
}
