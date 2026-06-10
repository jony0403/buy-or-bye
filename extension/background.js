/** 유사 매물 검색 탭(bunjang/daangn/joongna) 수집 완료 후 자동 닫기 */
const SEARCH_PLATFORMS = ['bunjang', 'daangn', 'joongna'];
const SCRIPT_FILES = [
  'lib/shared.js',
  'lib/search-urls.js',
  'lib/images.js',
  'lib/storage.js',
  'lib/comps.js',
  'hosts/bunjang.js',
  'hosts/daangn.js',
  'hosts/joongna.js',
  'content.js',
];
const LISTING_HOST_PATTERNS = [
  { id: 'bunjang', hostRe: /(^|\.)bunjang\.co\.kr$/i },
  { id: 'daangn', hostRe: /(^|\.)daangn\.com$/i },
  { id: 'joongna', hostRe: /(^|\.)joongna\.com$/i },
];

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

function classifyListingUrl(rawUrl) {
  let url;
  try {
    url = new URL(String(rawUrl || '').trim());
  } catch {
    throw new Error('URL 형식이 올바르지 않습니다.');
  }
  if (url.protocol !== 'https:') throw new Error('https 링크만 지원합니다.');
  const found = LISTING_HOST_PATTERNS.find((x) => x.hostRe.test(url.hostname));
  if (!found) throw new Error('중고나라·번개장터·당근 매물 링크만 지원합니다.');
  return { url: url.href, platform: found.id };
}

function waitForTabComplete(tabId, timeoutMs = 18_000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(onUpdated);
      reject(new Error('매물 페이지 로딩 시간이 초과되었습니다.'));
    }, timeoutMs);
    function done() {
      clearTimeout(timer);
      chrome.tabs.onUpdated.removeListener(onUpdated);
      resolve();
    }
    function onUpdated(updatedTabId, info) {
      if (updatedTabId === tabId && info.status === 'complete') done();
    }
    chrome.tabs.onUpdated.addListener(onUpdated);
    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError) return;
      if (tab?.status === 'complete') done();
    });
  });
}

function sendMessageToTab(tabId, message, timeoutMs = 22_000) {
  const startedAt = Date.now();
  return new Promise((resolve) => {
    const attempt = () => {
      chrome.tabs.sendMessage(tabId, message, (res) => {
        const err = chrome.runtime.lastError;
        if (!err && res?.ok) {
          resolve(res);
          return;
        }
        if (Date.now() - startedAt > timeoutMs) {
          resolve({ ok: false, error: res?.error || err?.message || '매물 정보를 읽지 못했습니다.' });
          return;
        }
        setTimeout(attempt, 700);
      });
    };
    attempt();
  });
}

async function collectListingFromTabFast(tabId, platform, timeoutMs = 12_000) {
  const startedAt = Date.now();
  let injected = false;
  let lastError = '';
  while (Date.now() - startedAt < timeoutMs) {
    if (!injected || Date.now() - startedAt > 900) {
      await injectSearchScripts(tabId);
      injected = true;
    }
    const res = await sendMessageToTab(tabId, { type: 'REFRESH_AND_SAVE' }, 900);
    if (res?.ok) return res;
    lastError = res?.error || lastError;
    await new Promise((r) => setTimeout(r, platform === 'joongna' ? 250 : 350));
  }
  return { ok: false, error: lastError || '매물 정보를 읽지 못했습니다.' };
}

async function injectSearchScripts(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId, allFrames: false },
      files: SCRIPT_FILES,
    });
  } catch {
    /* content_scripts may already be present or the tab may still be loading */
  }
}

async function importListingUrl(rawUrl) {
  const target = classifyListingUrl(rawUrl);
  const tab = await chrome.tabs.create({ url: target.url, active: false });
  if (tab.id == null) throw new Error('매물 탭을 열지 못했습니다.');
  let listingTabClosed = false;
  try {
    let res = await collectListingFromTabFast(tab.id, target.platform, target.platform === 'joongna' ? 12_000 : 10_000);
    if (!res?.ok) {
      await waitForTabComplete(tab.id, 8_000).catch(() => {});
      await injectSearchScripts(tab.id);
      res = await sendMessageToTab(tab.id, { type: 'REFRESH_AND_SAVE' }, 5_000);
    }
    if (!res?.ok) throw new Error(res?.error || '매물 정보를 읽지 못했습니다.');

    const result = {
      ok: true,
      platform: res.platform || target.platform,
      listing: res.listing || null,
    };

    try {
      await chrome.tabs.remove(tab.id);
      listingTabClosed = true;
    } catch {
      /* already closed */
    }

    await openAnalyzerTab();
    await pushAnalyzerTabs();

    return result;
  } finally {
    if (!listingTabClosed) {
      try {
        await chrome.tabs.remove(tab.id);
      } catch {
        /* already closed */
      }
    }
  }
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

async function openAnalyzerTab() {
  const url = 'http://127.0.0.1:3920/';
  const tabs = await chrome.tabs.query({ url: ['http://127.0.0.1:3920/*', 'http://localhost:3920/*'] });
  const existing = tabs.find((t) => t.id != null);
  let tabId = null;
  if (existing?.id != null) {
    tabId = existing.id;
    await chrome.tabs.update(existing.id, { active: true });
    if (existing.windowId != null) await chrome.windows.update(existing.windowId, { focused: true });
  } else {
    const created = await chrome.tabs.create({ url, active: true });
    tabId = created.id ?? null;
  }
  if (tabId != null) {
    for (const delay of [250, 700, 1200, 2000]) {
      await new Promise((r) => setTimeout(r, delay));
      try {
        await chrome.tabs.sendMessage(tabId, { type: 'PUSH_ANALYZER' });
      } catch {
        /* analyzer bridge may still be loading */
      }
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
  const allowedTypes = new Set([
    'OPEN_EXTENSION_POPUP',
    'OPEN_ANALYZER_TAB',
    'OPEN_SEARCH_TABS',
    'SEARCH_COLLECT_DONE',
    'OPEN_LISTING_URL',
  ]);
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

      if (msg.type === 'OPEN_LISTING_URL') {
        const result = await importListingUrl(msg.url);
        sendResponse(result);
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
            startedAt: Date.now(),
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
        await openAnalyzerTab();
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
