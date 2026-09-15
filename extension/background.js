importScripts('analyzer-origins.js');

/** ???????????? ?? ?? ?? ?? ??? ???? */
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
const SEARCH_TAB_TIMEOUT_MS = 28_000;
const SEARCH_CLOSE_ALARM_NAME = 'buy-or-bye-close-search-tabs';
const searchCollectionTabIds = new Set();
let searchCollectionGeneration = 0;
let importListingInFlight = null;
const recentImportKeys = new Map();
const pendingImportByUrl = new Map();
let searchTabsInFlight = null;

function createSearchCollectionAutoCollect(generation = searchCollectionGeneration) {
  return {
    bunjang: true,
    daangn: true,
    joongna: true,
    at: Date.now(),
    generation,
    sessionActive: true,
  };
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

  // ?????? ?????/?? ?? ?? ?? ?? ?? ??? ?? ?? ?????.
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
        /* ?? ???? ?? ?? ? ?? ??? ?? ??? */
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

function scheduleCloseSearchCollectionTabs(generation) {
  chrome.alarms?.create?.(SEARCH_CLOSE_ALARM_NAME, { when: Date.now() + SEARCH_TAB_TIMEOUT_MS + 800 });
  setTimeout(() => {
    void (async () => {
      // ?? ??? ???? ? ?? ??? ??? ???? ??? ??? ????.
      if (generation !== searchCollectionGeneration) return;
      const { marketScrapeComps } = await chrome.storage.local.get('marketScrapeComps');
      if (
        marketScrapeComps &&
        marketScrapeComps.generation === generation &&
        marketScrapeComps.status !== 'collected'
      ) {
        await chrome.storage.local.set({
          marketScrapeAutoCollect: clearedSearchCollectionAutoCollect(
            createSearchCollectionAutoCollect(generation)
          ),
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
    if (
      host.endsWith('daangn.com') &&
      (/buy-sell/i.test(path) || /\/search\//i.test(path))
    ) {
      const q = (url.searchParams.get('q') || url.searchParams.get('search') || url.searchParams.get('keyword') || '').trim();
      return !normalizedQuery || q === normalizedQuery;
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
  if (platform === 'daangn') return `https://www.daangn.com/kr/search/buy-sell/?q=${encodeURIComponent(query)}`;
  if (platform === 'joongna') return `https://web.joongna.com/search/${encodeURIComponent(query)}`;
  return '';
}

async function createSearchTabsForQuery(query) {
  // ???? ?? ? 3? ??? ?? ??? ??. ??? ???? ???? ?? ??.
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
      console.warn(`[OPEN_SEARCH_TABS] ${platform} tab create failed:`, e instanceof Error ? e.message : e);
    }
  }
  const closeIds = Object.values(tabsByPlatform).filter((id) => typeof id === 'number');
  return { tabsByPlatform, tabMetaByPlatform, closeIds, query };
}

async function persistSearchCollectionSession({
  forItemKey,
  queries,
  closeIds,
  tabMetaByPlatform = {},
  resetComps = false,
  generation,
}) {
  const primaryQuery = queries[0] || '';
  const { marketScrapeComps } = await chrome.storage.local.get('marketScrapeComps');
  const nextComps = resetComps
    ? {
        forItemKey,
        generation,
        status: 'collecting',
        startedAt: Date.now(),
        expectedQueries: queries,
        ...Object.fromEntries(SEARCH_PLATFORMS.map((id) => [id, null])),
      }
    : {
        ...(marketScrapeComps || {}),
        forItemKey: forItemKey || marketScrapeComps?.forItemKey || null,
        generation,
        status: 'collecting',
        startedAt: marketScrapeComps?.startedAt || Date.now(),
        expectedQueries: queries,
      };
  await chrome.storage.local.set({
    marketScrapeAutoCollect: createSearchCollectionAutoCollect(generation),
    marketScrapeComps: nextComps,
    marketScrapeCloseTabs: closeIds,
    marketScrapeCloseTabsMeta: {
      query: primaryQuery,
      queries,
      tabsByPlatform: tabMetaByPlatform,
      urls: Object.values(tabMetaByPlatform).map((entry) => entry?.url).filter(Boolean),
      startedAt: Date.now(),
      generation,
      timeoutAt: Date.now() + SEARCH_TAB_TIMEOUT_MS,
    },
  });
  scheduleCloseSearchCollectionTabs(generation);
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

// ?? ????? ??? ??? ??. ??? ????? ?? ???
// finally + ?? ?????? storage? 'collected'? ???? ?? ???.
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

const SHORT_SHARE_HOST_PATTERNS = [
  { hostRe: /(^|\.)bgzt\.link$/i },
  { hostRe: /(^|\.)karrot\.link$/i },
  { hostRe: /(^|\.)abr\.ge$/i },
  { hostRe: /(^|\.)airbridge\.io$/i },
];

function classifyListingUrl(rawUrl) {
  let url;
  try {
    url = new URL(String(rawUrl || '').trim());
  } catch {
    throw new Error('URL ??? ???? ????.');
  }
  if (url.protocol !== 'https:') throw new Error('https ??? ?????.');
  const found = LISTING_HOST_PATTERNS.find((x) => x.hostRe.test(url.hostname));
  if (found) return { url: url.href, platform: found.id, shortShare: false };
  const shortShare = SHORT_SHARE_HOST_PATTERNS.some((x) => x.hostRe.test(url.hostname));
  if (shortShare) return { url: url.href, platform: null, shortShare: true };
  throw new Error('???????????? ?? ??? ?????.');
}

function platformFromResolvedUrl(href) {
  try {
    const url = new URL(href);
    return LISTING_HOST_PATTERNS.find((x) => x.hostRe.test(url.hostname))?.id || '';
  } catch {
    return '';
  }
}

function waitForListingRedirect(tabId, timeoutMs = 16_000) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (ok, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      chrome.tabs.onUpdated.removeListener(onUpdated);
      if (ok) resolve(value);
      else reject(value instanceof Error ? value : new Error(String(value)));
    };
    const timer = setTimeout(
      () => finish(false, new Error('?? ?? ?? ??? ???????.')),
      timeoutMs
    );
    const check = (nextUrl) => {
      const platform = platformFromResolvedUrl(nextUrl);
      if (platform) finish(true, { url: nextUrl, platform });
    };
    function onUpdated(updatedTabId, info, tab) {
      if (updatedTabId !== tabId) return;
      const nextUrl = info.url || tab?.url;
      if (nextUrl) check(nextUrl);
    }
    chrome.tabs.onUpdated.addListener(onUpdated);
    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError) return;
      if (tab?.url) check(tab.url);
    });
  });
}

function waitForTabComplete(tabId, timeoutMs = 18_000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(onUpdated);
      reject(new Error('?? ??? ?? ??? ???????.'));
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
          resolve({ ok: false, error: res?.error || err?.message || '?? ??? ?? ?????.' });
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
  return { ok: false, error: lastError || '?? ??? ?? ?????.' };
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
  // ?? ???? load ?? ? React/Remix ??? ?? ???. 0? ??? ????
  // ???? ?? ?? ??? ?? ???? ???? ?? ?? ? ??? ??.
  await waitForTabComplete(tabId, platform === 'daangn' ? 8_000 : 6_000).catch(() => {});
  const timeoutMs = platform === 'daangn' ? 22_000 : 16_000;
  const startedAt = Date.now();
  let lastResult = null;
  while (Date.now() - startedAt < timeoutMs) {
    await injectSearchScripts(tabId);
    const remaining = Math.max(1_000, timeoutMs - (Date.now() - startedAt));
    const res = await sendMessageToTab(
      tabId,
      { type: 'COLLECT_SEARCH' },
      Math.min(remaining, platform === 'daangn' ? 18_000 : 12_000)
    );
    lastResult = res;
    if (res?.ok && Number(res.count) > 0) return res;
    await waitMs(platform === 'daangn' ? 900 : 700);
  }
  return lastResult?.ok
    ? lastResult
    : { ok: false, platform, error: lastResult?.error || '?? ??? ???? ?????.' };
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
  const key = String(rawUrl || '').trim();
  if (!key) throw new Error('URL is empty');
  if (pendingImportByUrl.has(key)) return pendingImportByUrl.get(key);

  const run = (async () => {
    let target = classifyListingUrl(rawUrl);
    if (target.shortShare) {
      // open one tab and wait for redirect (share short links)
      const tab = await chrome.tabs.create({ url: target.url, active: false });
      if (tab.id == null) throw new Error('?? ?? ?? ?????.');
      let listingTabClosed = false;
      try {
        const resolved = await waitForListingRedirect(tab.id, 16_000);
        target = { url: resolved.url, platform: resolved.platform, shortShare: false };
        await chrome.tabs.update(tab.id, { url: resolved.url }).catch(() => {});
        await waitForTabComplete(tab.id, 10_000).catch(() => {});
        let res = await collectListingFromTabFast(tab.id, target.platform, target.platform === 'joongna' ? 12_000 : 10_000);
        if (!res?.ok) {
          await injectSearchScripts(tab.id);
          res = await sendMessageToTab(tab.id, { type: 'REFRESH_AND_SAVE' }, 5_000);
        }
        if (!res?.ok) throw new Error(res?.error || '?? ??? ?? ?????.');
        try {
          await chrome.tabs.remove(tab.id);
          listingTabClosed = true;
        } catch {
          /* ignore */
        }
        await openAnalyzerTab();
        await pushAnalyzerTabs();
        return { ok: true, platform: res.platform || target.platform, listing: res.listing || null };
      } finally {
        if (!listingTabClosed) {
          try {
            await chrome.tabs.remove(tab.id);
          } catch {
            /* ignore */
          }
        }
      }
    }

    const tab = await chrome.tabs.create({ url: target.url, active: false });
    if (tab.id == null) throw new Error('?? ?? ?? ?????.');
    let listingTabClosed = false;
    try {
      await waitForTabComplete(tab.id, 10_000).catch(() => {});
      let res = await collectListingFromTabFast(tab.id, target.platform, target.platform === 'joongna' ? 12_000 : 10_000);
      if (!res?.ok) {
        await waitForTabComplete(tab.id, 8_000).catch(() => {});
        await injectSearchScripts(tab.id);
        res = await sendMessageToTab(tab.id, { type: 'REFRESH_AND_SAVE' }, 5_000);
      }
      if (!res?.ok) throw new Error(res?.error || '?? ??? ?? ?????.');
      try {
        await chrome.tabs.remove(tab.id);
        listingTabClosed = true;
      } catch {
        /* ignore */
      }
      await openAnalyzerTab();
      await pushAnalyzerTabs();
      return { ok: true, platform: res.platform || target.platform, listing: res.listing || null };
    } finally {
      if (!listingTabClosed) {
        try {
          await chrome.tabs.remove(tab.id);
        } catch {
          /* ignore */
        }
      }
    }
  })();

  pendingImportByUrl.set(key, run);
  importListingInFlight = run;
  const clear = () => {
    if (pendingImportByUrl.get(key) === run) pendingImportByUrl.delete(key);
    if (importListingInFlight === run) importListingInFlight = null;
  };
  run.then(clear, clear);
  return run;
}

async function pushAnalyzerTabs() {
  const patterns = BUY_OR_BYE_ANALYZER_ORIGINS.map((o) => `${o}/*`);
  const tabs = await chrome.tabs.query({ url: patterns });
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
  const url = `${BUY_OR_BYE_ANALYZER_ORIGINS[0]}/`;
  const patterns = BUY_OR_BYE_ANALYZER_ORIGINS.map((o) => `${o}/*`);
  const tabs = await chrome.tabs.query({ url: patterns });
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
          sendResponse({ ok: false, error: '???? ?????.' });
          return;
        }
        searchCollectionGeneration += 1;
        const generation = searchCollectionGeneration;
        const runSearch = (async () => {
            await closeSearchCollectionTabsIfAny();
            await closeAllMatchingSearchTabs(queries, []);
            if (generation !== searchCollectionGeneration) {
              return { ok: false, error: '??? ???????.' };
            }
            const { marketScrapeLatest } = await chrome.storage.local.get('marketScrapeLatest');
            const forItemKey =
              String(msg.forItemKey || '').trim() ||
              (marketScrapeLatest ? `${marketScrapeLatest.platform}:${marketScrapeLatest.itemId}` : null);
            const { tabsByPlatform, tabMetaByPlatform, closeIds } = await createSearchTabsForQuery(queries[0]);
            if (generation !== searchCollectionGeneration) {
              if (closeIds.length) {
                await closeTabIds(closeIds);
                for (const id of closeIds) searchCollectionTabIds.delete(id);
              }
              return { ok: false, error: '??? ???????.' };
            }
            if (!closeIds.length) {
              return { ok: false, error: '?? ?? ?? ?????.' };
            }
            await persistSearchCollectionSession({
              forItemKey,
              queries,
              closeIds,
              tabMetaByPlatform,
              resetComps: true,
              generation,
            });
            void runSearchCollectionInBackground(forItemKey, queries, tabsByPlatform, closeIds, generation);
            return { ok: true, query: queries[0], queries, tabIds: closeIds, forItemKey };
        })();
        searchTabsInFlight = runSearch;
        try {
          sendResponse(await runSearch);
        } catch (e) {
          sendResponse({ ok: false, error: e instanceof Error ? e.message : String(e) });
        } finally {
          if (searchTabsInFlight === runSearch) searchTabsInFlight = null;
        }
        return;
      }

      if (msg.type === 'OPEN_ANALYZER_TAB') {
        await openAnalyzerTab();
        sendResponse({ ok: true });
        return;
      }

      if (typeof chrome.action?.openPopup !== 'function') {
        sendResponse({ ok: false, error: 'openPopup ???' });
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
