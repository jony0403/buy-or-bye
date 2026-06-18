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
const SEARCH_TAB_TIMEOUT_MS = 10_000;
const SEARCH_CLOSE_ALARM_NAME = 'buy-or-bye-close-search-tabs';
const searchCollectionTabIds = new Set();
let searchCollectionGeneration = 0;

function createSearchCollectionAutoCollect() {
  return { bunjang: true, daangn: true, joongna: true, at: Date.now(), sessionActive: true };
}

function clearedSearchCollectionAutoCollect(flags = {}) {
  return {
    ...flags,
    ...Object.fromEntries(SEARCH_PLATFORMS.map((id) => [id, false])),
    at: Date.now(),
    sessionActive: true,
  };
}

function allSearchPlatformsDone(flags) {
  if (!flags?.at || flags.sessionActive !== true) return false;
  return SEARCH_PLATFORMS.every((id) => flags[id] === false);
}

function dedupeSearchQueries(rawQueries, limit = 3) {
  const queries = [];
  const seen = new Set();
  for (const rawQuery of rawQueries) {
    const query = String(rawQuery || '').trim();
    const key = query.replace(/\s+/g, '').toLowerCase();
    if (!query || seen.has(key)) continue;
    seen.add(key);
    queries.push(query);
    if (queries.length >= limit) break;
  }
  return queries;
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  const f = changes.marketScrapeAutoCollect?.newValue;
  const comps = changes.marketScrapeComps?.newValue;
  if (f && allSearchPlatformsDone(f)) void closeSearchCollectionTabsIfAny();
  if (comps?.status === 'collected') void closeSearchCollectionTabsIfAny();
});

if (chrome.alarms?.onAlarm) {
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === SEARCH_CLOSE_ALARM_NAME) void closeSearchCollectionTabsIfAny();
  });
}

async function isSearchCollectionFinished() {
  const { marketScrapeAutoCollect, marketScrapeComps } = await chrome.storage.local.get([
    'marketScrapeAutoCollect',
    'marketScrapeComps',
  ]);
  return Boolean(marketScrapeAutoCollect && allSearchPlatformsDone(marketScrapeAutoCollect)) || marketScrapeComps?.status === 'collected';
}

async function closeAllMatchingSearchTabs(queries = [], urls = []) {
  const closeIds = new Set([...searchCollectionTabIds].filter((id) => typeof id === 'number'));
  addMatchingSearchCollectionTabs(await chrome.tabs.query({}), closeIds, queries, urls);
  if (!closeIds.size) return;
  await closeTabIds([...closeIds]);
  for (const id of closeIds) searchCollectionTabIds.delete(id);
}

async function closeSearchCollectionTabsIfAny() {
  const { marketScrapeCloseTabs, marketScrapeCloseTabsMeta } = await chrome.storage.local.get([
    'marketScrapeCloseTabs',
    'marketScrapeCloseTabsMeta',
  ]);
  const closeIds = new Set([
    ...(Array.isArray(marketScrapeCloseTabs) ? marketScrapeCloseTabs : []),
    ...searchCollectionTabIds,
  ].filter((id) => typeof id === 'number'));
  const meta = marketScrapeCloseTabsMeta && typeof marketScrapeCloseTabsMeta === 'object' ? marketScrapeCloseTabsMeta : null;
  const metaQueries = Array.isArray(meta?.queries) ? meta.queries : meta?.query ? [meta.query] : [];
  const metaUrls = [
    ...(Array.isArray(meta?.urls) ? meta.urls : []),
    ...Object.values(meta?.tabsByPlatform || {}).map((entry) => entry?.url),
  ].filter(Boolean);
  if (metaQueries.length || metaUrls.length) {
    addMatchingSearchCollectionTabs(await chrome.tabs.query({}), closeIds, metaQueries, metaUrls);
  }
  if (!closeIds.size) {
    await chrome.storage.local.remove(['marketScrapeCloseTabs', 'marketScrapeCloseTabsMeta']);
    await chrome.alarms?.clear?.(SEARCH_CLOSE_ALARM_NAME);
    return;
  }
  await closeTabIds(closeIds);
  for (const id of closeIds) searchCollectionTabIds.delete(id);

  // 번개장터처럼 리다이렉트/지연 로딩 중인 검색 탭이 남는 경우가 있어 짧게 재확인한다.
  const leftovers = new Set();
  if (metaQueries.length || metaUrls.length) {
    await waitMs(220);
    addMatchingSearchCollectionTabs(await chrome.tabs.query({}), leftovers, metaQueries, metaUrls);
  }
  if (leftovers.size) {
    for (const id of leftovers) {
      await closeTabIds([id]);
      searchCollectionTabIds.delete(id);
    }
    await waitMs(500);
    const finalLeftovers = new Set();
    addMatchingSearchCollectionTabs(await chrome.tabs.query({}), finalLeftovers, metaQueries, metaUrls);
    for (const id of finalLeftovers) {
      await closeTabIds([id]);
      searchCollectionTabIds.delete(id);
    }
  }

  await chrome.storage.local.remove(['marketScrapeCloseTabs', 'marketScrapeCloseTabsMeta']);
  await chrome.alarms?.clear?.(SEARCH_CLOSE_ALARM_NAME);
}

function waitMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function closeTabIds(ids) {
  const uniqueIds = [...new Set([...(ids || [])].filter((id) => typeof id === 'number'))];
  for (const id of uniqueIds) {
    for (const delay of [0, 180, 520]) {
      if (delay) await waitMs(delay);
      try {
        await chrome.tabs.remove(id);
        break;
      } catch {
        /* 이미 닫혔거나 아직 닫을 수 없는 탭이면 짧게 재시도 */
      }
    }
  }
}

function addMatchingSearchCollectionTabs(tabs, closeIds, queries = [], urls = []) {
  const exactUrls = new Set(urls.map((url) => normalizeComparableUrl(url)).filter(Boolean));
  for (const tab of tabs || []) {
    if (tab.id == null) continue;
    const tabUrl = String(tab.url || tab.pendingUrl || '');
    const normalizedTabUrl = normalizeComparableUrl(tabUrl);
    if (normalizedTabUrl && exactUrls.has(normalizedTabUrl)) {
      closeIds.add(tab.id);
      continue;
    }
    if (queries.some((query) => isSearchCollectionTab(tabUrl, query))) closeIds.add(tab.id);
  }
}

function normalizeComparableUrl(rawUrl) {
  try {
    const url = new URL(String(rawUrl || ''));
    url.hash = '';
    return url.href;
  } catch {
    return '';
  }
}

async function closeSearchCollectionTabsIfFinished() {
  if (await isSearchCollectionFinished()) await closeSearchCollectionTabsIfAny();
}

function scheduleCloseSearchCollectionTabs() {
  chrome.alarms?.create?.(SEARCH_CLOSE_ALARM_NAME, { when: Date.now() + SEARCH_TAB_TIMEOUT_MS + 800 });
  setTimeout(() => {
    void (async () => {
      const { marketScrapeComps } = await chrome.storage.local.get('marketScrapeComps');
      if (marketScrapeComps && marketScrapeComps.status !== 'collected') {
        await chrome.storage.local.set({
          marketScrapeAutoCollect: clearedSearchCollectionAutoCollect(),
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
  }, SEARCH_TAB_TIMEOUT_MS);
}

function isSearchCollectionTab(rawUrl, query) {
  const normalizedQuery = String(query || '').replace(/\s+/g, ' ').trim();
  if (!normalizedQuery) return false;
  try {
    const url = new URL(String(rawUrl || ''));
    const host = url.hostname.toLowerCase();
    const path = url.pathname;
    if (host.endsWith('bunjang.co.kr') && /\/search(?:\/products)?\/?$/i.test(path)) {
      const q = (url.searchParams.get('q') || url.searchParams.get('keyword') || '').replace(/\s+/g, ' ').trim();
      return q === normalizedQuery;
    }
    if (host.endsWith('daangn.com') && /\/kr\/buy-sell\/?$/i.test(path)) {
      return (url.searchParams.get('search') || '').trim() === normalizedQuery;
    }
    if (host.endsWith('joongna.com') && /^\/search(?:\/|$)/i.test(path)) {
      const encoded = path.replace(/^\/search\/?/i, '').split('/')[0] || '';
      return decodeURIComponent(encoded).trim() === normalizedQuery;
    }
  } catch {
    return false;
  }
  return false;
}

function searchUrlForPlatform(platform, query) {
  if (platform === 'bunjang') return `https://m.bunjang.co.kr/search/products?q=${encodeURIComponent(query)}&order=score`;
  if (platform === 'daangn') return `https://www.daangn.com/kr/buy-sell/?search=${encodeURIComponent(query)}`;
  if (platform === 'joongna') return `https://web.joongna.com/search/${encodeURIComponent(query)}`;
  return '';
}

async function createSearchTabsForQuery(query) {
  // 매물검색 시작 시 3개 플랫폼 탭은 무조건 연다. 하나가 실패해도 나머지는 계속 연다.
  const tabsByPlatform = { bunjang: undefined, daangn: undefined, joongna: undefined };
  const tabMetaByPlatform = {};
  for (const platform of SEARCH_PLATFORMS) {
    try {
      const url = searchUrlForPlatform(platform, query);
      const tab = await chrome.tabs.create({ url, active: false });
      tabsByPlatform[platform] = tab?.id;
      if (typeof tab?.id === 'number') searchCollectionTabIds.add(tab.id);
      tabMetaByPlatform[platform] = { id: tab?.id, url };
    } catch (e) {
      console.warn(`[OPEN_SEARCH_TABS] ${platform} 탭 열기 실패:`, e instanceof Error ? e.message : e);
    }
  }
  const closeIds = Object.values(tabsByPlatform).filter((id) => typeof id === 'number');
  return { tabsByPlatform, tabMetaByPlatform, closeIds, query };
}

async function persistSearchCollectionSession({ forItemKey, queries, closeIds, tabMetaByPlatform = {}, resetComps = false }) {
  const primaryQuery = queries[0] || '';
  const { marketScrapeComps } = await chrome.storage.local.get('marketScrapeComps');
  const nextComps = resetComps
    ? {
        forItemKey,
        status: 'collecting',
        startedAt: Date.now(),
        expectedQueries: queries,
        ...Object.fromEntries(SEARCH_PLATFORMS.map((id) => [id, null])),
      }
    : {
        ...(marketScrapeComps || {}),
        forItemKey: forItemKey || marketScrapeComps?.forItemKey || null,
        status: 'collecting',
        startedAt: marketScrapeComps?.startedAt || Date.now(),
        expectedQueries: queries,
      };
  await chrome.storage.local.set({
    marketScrapeAutoCollect: createSearchCollectionAutoCollect(),
    marketScrapeComps: nextComps,
    marketScrapeCloseTabs: closeIds,
    marketScrapeCloseTabsMeta: {
      query: primaryQuery,
      queries,
      tabsByPlatform: tabMetaByPlatform,
      urls: Object.values(tabMetaByPlatform).map((entry) => entry?.url).filter(Boolean),
      startedAt: Date.now(),
      timeoutAt: Date.now() + SEARCH_TAB_TIMEOUT_MS,
    },
  });
  scheduleCloseSearchCollectionTabs();
}

async function finalizeSearchCollection() {
  const { marketScrapeComps, marketScrapeAutoCollect } = await chrome.storage.local.get([
    'marketScrapeComps',
    'marketScrapeAutoCollect',
  ]);
  if (marketScrapeComps && marketScrapeComps.status !== 'collected') {
    await chrome.storage.local.set({
      marketScrapeAutoCollect: clearedSearchCollectionAutoCollect(marketScrapeAutoCollect || {}),
      marketScrapeComps: {
        ...marketScrapeComps,
        status: 'collected',
        collectedAt: new Date().toISOString(),
      },
    });
  }
  await closeSearchCollectionTabsIfAny();
}

// 자동 매물검색은 무조건 끝나야 한다. 수집이 실패하거나 탭이 멈춰도
// finally + 하드 타임아웃으로 storage를 'collected'로 정리하고 탭을 닫는다.
async function runSearchCollectionInBackground(forItemKey, queries, tabsByPlatform, closeIds, generation) {
  let finalized = false;
  const finalizeOnce = async () => {
    if (finalized) return;
    finalized = true;
    try {
      if (generation !== searchCollectionGeneration) return;
      await finalizeSearchCollection();
      await pushAnalyzerTabs();
    } catch (e) {
      console.warn('[OPEN_SEARCH_TABS] finalize failed:', e instanceof Error ? e.message : e);
    }
  };
  const hardStop = setTimeout(() => {
    void finalizeOnce();
  }, SEARCH_TAB_TIMEOUT_MS);
  try {
    if (generation !== searchCollectionGeneration) return;
    await collectSearchTabsAndClose(tabsByPlatform);
  } catch (e) {
    console.warn('[OPEN_SEARCH_TABS] background collection failed:', e instanceof Error ? e.message : e);
  } finally {
    clearTimeout(hardStop);
    if (generation === searchCollectionGeneration) {
      await finalizeOnce();
      return;
    }
    const orphanIds = [...new Set((closeIds || []).filter((id) => typeof id === 'number'))];
    if (orphanIds.length) {
      await closeTabIds(orphanIds);
      for (const id of orphanIds) searchCollectionTabIds.delete(id);
    }
  }
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

async function injectAnalyzerBridge(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId, allFrames: false },
      files: ['bridge-analyzer.js'],
    });
  } catch {
    /* bridge may already be present or the analyzer tab may still be loading */
  }
}

async function collectSearchTab(tabId, platform) {
  // 전체 수집을 10초 안에 끝내기 위해 탭당 대기/수집 시간을 빠듯하게 잡는다.
  await waitForTabComplete(tabId, platform === 'daangn' ? 4_000 : 3_500).catch(() => {});
  await injectSearchScripts(tabId);
  const res = await sendMessageToTab(tabId, { type: 'COLLECT_SEARCH' }, platform === 'daangn' ? 5_000 : 4_000);
  return res?.ok ? res : { ok: false, platform, error: res?.error || '검색 탭 수집 실패' };
}

async function collectSearchTabsAndClose(tabsByPlatform) {
  const entries = Array.isArray(tabsByPlatform)
    ? tabsByPlatform
        .map((entry) => [entry?.platform, entry?.tabId])
        .filter(([platform, tabId]) => SEARCH_PLATFORMS.includes(platform) && typeof tabId === 'number')
    : Object.entries(tabsByPlatform || {}).filter(([, tabId]) => typeof tabId === 'number');
  if (!entries.length) return;
  const grouped = Object.fromEntries(SEARCH_PLATFORMS.map((platform) => [platform, []]));
  for (const [platform, tabId] of entries) grouped[platform]?.push(tabId);
  await Promise.allSettled(
    SEARCH_PLATFORMS.map(async (platform) => {
      for (const tabId of grouped[platform]) {
        try {
          await collectSearchTab(tabId, platform);
        } finally {
          await closeTabIds([tabId]);
          searchCollectionTabIds.delete(tabId);
        }
      }
    })
  );
  const { marketScrapeAutoCollect, marketScrapeComps } = await chrome.storage.local.get([
    'marketScrapeAutoCollect',
    'marketScrapeComps',
  ]);
  if (marketScrapeAutoCollect && !allSearchPlatformsDone(marketScrapeAutoCollect)) {
    await chrome.storage.local.set({
      marketScrapeAutoCollect: clearedSearchCollectionAutoCollect(marketScrapeAutoCollect),
      marketScrapeComps: {
        ...(marketScrapeComps || {}),
        status: 'collected',
        collectedAt: new Date().toISOString(),
        timedOut: true,
      },
    });
  }
  await closeSearchCollectionTabsIfFinished();
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
      await injectAnalyzerBridge(tab.id);
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
        await injectAnalyzerBridge(tabId);
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
        const queries = dedupeSearchQueries(Array.isArray(msg.queries) ? msg.queries : [msg.query]);
        if (!queries.length) {
          sendResponse({ ok: false, error: '검색어가 비었습니다.' });
          return;
        }
        searchCollectionGeneration += 1;
        const generation = searchCollectionGeneration;
        await closeSearchCollectionTabsIfAny();
        await closeAllMatchingSearchTabs(queries, []);
        if (generation !== searchCollectionGeneration) {
          sendResponse({ ok: false, error: '검색이 취소되었습니다.' });
          return;
        }
        const { marketScrapeLatest } = await chrome.storage.local.get('marketScrapeLatest');
        const forItemKey = marketScrapeLatest ? `${marketScrapeLatest.platform}:${marketScrapeLatest.itemId}` : null;
        const { tabsByPlatform, tabMetaByPlatform, closeIds } = await createSearchTabsForQuery(queries[0]);
        if (generation !== searchCollectionGeneration) {
          if (closeIds.length) {
            await closeTabIds(closeIds);
            for (const id of closeIds) searchCollectionTabIds.delete(id);
          }
          sendResponse({ ok: false, error: '검색이 취소되었습니다.' });
          return;
        }
        if (!closeIds.length) {
          sendResponse({ ok: false, error: '검색 탭을 열지 못했습니다.' });
          return;
        }
        await persistSearchCollectionSession({ forItemKey, queries, closeIds, tabMetaByPlatform, resetComps: true });
        sendResponse({ ok: true, query: queries[0], queries, tabIds: closeIds });
        void runSearchCollectionInBackground(forItemKey, queries, tabsByPlatform, closeIds, generation);
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
