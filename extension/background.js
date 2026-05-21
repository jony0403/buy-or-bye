/** 유사 매물 검색 탭(bunjang/daangn/joongna) 수집 완료 후 자동 닫기 */
const SEARCH_PLATFORMS = ['bunjang', 'daangn', 'joongna'];

function allSearchPlatformsDone(flags) {
  return SEARCH_PLATFORMS.every((id) => !flags?.[id]);
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  const f = changes.marketScrapeAutoCollect?.newValue;
  const comps = changes.marketScrapeComps?.newValue;
  if (f && allSearchPlatformsDone(f)) void closeSearchCollectionTabsIfAny();
  if (comps?.status === 'collected') void closeSearchCollectionTabsIfAny();
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

function scheduleCloseSearchCollectionTabs() {
  setTimeout(() => {
    void (async () => {
      const { marketScrapeComps } = await chrome.storage.local.get('marketScrapeComps');
      if (marketScrapeComps && marketScrapeComps.status !== 'collected') {
        await chrome.storage.local.set({
          marketScrapeAutoCollect: { ...Object.fromEntries(SEARCH_PLATFORMS.map((id) => [id, false])), at: Date.now() },
          marketScrapeComps: {
            ...(marketScrapeComps || {}),
            status: 'collected',
            collectedAt: new Date().toISOString(),
            timedOut: true,
          },
        });
      }
      await closeSearchCollectionTabsIfAny();
    })();
  }, 45_000);
}

async function pushAnalyzerTabs() {
  const tabs = await chrome.tabs.query({ url: ['http://127.0.0.1:3920/*', 'http://localhost:3920/*'] });
  for (const tab of tabs) {
    if (tab.id == null) continue;
    try {
      await chrome.tabs.sendMessage(tab.id, { type: 'PUSH_ANALYZER' });
    } catch {
      /* analyzer tab not ready */
    }
  }
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type !== 'COMPS_IMAGES_PATCHED') return undefined;
  void pushAnalyzerTabs();
  return undefined;
});

chrome.action.onClicked.addListener((tab) => {
  if (!tab?.id) return;
  chrome.tabs.sendMessage(tab.id, { type: 'SEND_TO_ANALYZER' }, (res) => {
    if (chrome.runtime.lastError || !res?.ok) {
      void chrome.runtime.sendMessage({ type: 'OPEN_ANALYZER_TAB' });
    }
  });
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  const allowedTypes = new Set(['OPEN_EXTENSION_POPUP', 'OPEN_ANALYZER_TAB', 'OPEN_SEARCH_TABS', 'SEARCH_COLLECT_DONE']);
  if (!allowedTypes.has(msg?.type)) return undefined;

  (async () => {
    try {
      if (msg.type === 'SEARCH_COLLECT_DONE') {
        if (msg.forceClose) {
          await closeSearchCollectionTabsIfAny();
          sendResponse({ ok: true, completed: true, hasSession: true });
          return;
        }
        sendResponse({ ok: true, completed: false, hasSession: false });
        return;
      }

      if (msg.type === 'OPEN_SEARCH_TABS') {
        const rawQueries = Array.isArray(msg.queries) ? msg.queries : [msg.query];
        const queries = [];
        const seen = new Set();
        for (const rawQuery of rawQueries) {
          const query = String(rawQuery || '').trim();
          const key = query.replace(/\s+/g, '').toLowerCase();
          if (!query || seen.has(key)) continue;
          seen.add(key);
          queries.push(query);
          break;
        }
        if (!queries.length) {
          sendResponse({ ok: false, error: '검색어가 비었습니다.' });
          return;
        }
        const { marketScrapeLatest } = await chrome.storage.local.get('marketScrapeLatest');
        const forItemKey = marketScrapeLatest ? `${marketScrapeLatest.platform}:${marketScrapeLatest.itemId}` : null;
        const query = queries[0];
        const bunjangUrl = `https://m.bunjang.co.kr/search/products?q=${encodeURIComponent(query)}&order=score`;
        const daangnUrl = `https://www.daangn.com/kr/buy-sell/?search=${encodeURIComponent(query)}`;
        const joongnaUrl = `https://web.joongna.com/search/${encodeURIComponent(query)}`;
        await chrome.storage.local.set({
          marketScrapeAutoCollect: { bunjang: true, daangn: true, joongna: true, at: Date.now() },
          marketScrapeComps: {
            forItemKey,
            status: 'collecting',
            ...Object.fromEntries(SEARCH_PLATFORMS.map((id) => [id, null])),
          },
        });
        const bunTab = await chrome.tabs.create({ url: bunjangUrl, active: false });
        const dangTab = await chrome.tabs.create({ url: daangnUrl, active: false });
        const joongTab = await chrome.tabs.create({ url: joongnaUrl, active: false });
        const closeIds = [bunTab?.id, dangTab?.id, joongTab?.id].filter((id) => typeof id === 'number');
        if (closeIds.length) await chrome.storage.local.set({ marketScrapeCloseTabs: closeIds });
        scheduleCloseSearchCollectionTabs();
        sendResponse({ ok: true, query, queries: [query], tabIds: closeIds });
        return;
      }

      if (msg.type === 'OPEN_ANALYZER_TAB') {
        const url = 'http://127.0.0.1:3920/';
        const tabs = await chrome.tabs.query({ url: ['http://127.0.0.1:3920/*', 'http://localhost:3920/*'] });
        const existing = tabs.find((t) => t.id != null);
        if (existing?.id != null) {
          await chrome.tabs.update(existing.id, { active: true, url });
          if (existing.windowId != null) await chrome.windows.update(existing.windowId, { focused: true });
        } else {
          await chrome.tabs.create({ url, active: true });
        }
        sendResponse({ ok: true });
        return;
      }

      if (typeof chrome.action?.openPopup !== 'function') {
        sendResponse({ ok: false, error: 'openPopup 미지원' });
        return;
      }
      await chrome.action.openPopup();
      sendResponse({ ok: true });
    } catch (e) {
      sendResponse({ ok: false, error: e instanceof Error ? e.message : String(e) });
    }
  })();

  return true;
});
