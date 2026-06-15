const $current = document.getElementById('current');
const $appShell = document.getElementById('appShell');
const $history = document.getElementById('history');
const $btnRefresh = document.getElementById('btnRefresh');
const $btnLayoutMode = document.getElementById('btnLayoutMode');
const $btnDirectAi = document.getElementById('btnDirectAi');
const $btnHistory = document.getElementById('btnHistory');
const $btnHistoryClose = document.getElementById('btnHistoryClose');
const $btnHistoryClear = document.getElementById('btnHistoryClear');
const $btnFavoriteCompare = document.getElementById('btnFavoriteCompare');
const $recentDrawer = document.getElementById('recentDrawer');
const $favoriteCompareModal = document.getElementById('favoriteCompareModal');
const $drawerBackdrop = document.getElementById('drawerBackdrop');
const $directAiPanel = document.getElementById('directAiPanel');
const $urlImportForm = document.getElementById('urlImportForm');
const $urlImportInput = document.getElementById('urlImportInput');
const $urlImportStatus = document.getElementById('urlImportStatus');
const $btnUrlImport = document.getElementById('btnUrlImport');
const $autoRunToggle = document.getElementById('autoRunToggle');
const $dashboardRail = document.querySelector('.dashboard-rail');
const $railPanel = document.querySelector('[data-rail-panel]');
const $shortcutPanel = document.querySelector('[data-shortcut-panel]');
const $railImportForm = document.querySelector('[data-rail-import-form]');
const $railUrlInput = document.querySelector('[data-rail-url-input]');
const $railImportSubmit = document.querySelector('[data-rail-import-submit]');
const $railStatus = document.querySelector('[data-rail-status]');
const $lightbox = document.getElementById('lightbox');
const $lightboxImg = document.getElementById('lightboxImg');
const $lightboxOverlay = document.getElementById('lightboxOverlay');
const $lightboxBadge = document.getElementById('lightboxBadge');
const $lightboxCount = document.getElementById('lightboxCount');
const $lightboxCaption = document.getElementById('lightboxCaption');
const $lightboxClose = document.getElementById('lightboxClose');
const $lightboxPrev = document.getElementById('lightboxPrev');
const $lightboxNext = document.getElementById('lightboxNext');
const $lightboxProgress = document.getElementById('lightboxProgress');

let latest = null;
let history = [];
let comps = null;
let selectedKey = null;
const lightboxState = { items: [], index: 0 };
const productSummaries = new Map();
const photoIndexes = new Map();
const photoDirections = new Map();
const relatedRequestedKeys = new Set();
const productImageSearches = new Set();
const imageAnalysisIndexes = new Map();
const imageAnalysisDirections = new Map();
const stageTwoActiveKeys = new Set();
const stageThreeActiveKeys = new Set();
const stageFiveActiveKeys = new Set();
const stageFiveEnteringKeys = new Set();
const stageTwoCompletedKeys = new Set();
const stageThreeIsolatedRefreshKeys = new Set();
const productRiskAnalyses = new Map();
const productRiskYoutubeAnalyses = new Map();
const listingTextAnalyses = new Map();
const listingImageAnalyses = new Map();
const accessoryChecks = new Map();
const comparisonFilters = new Map();
const comparisonFilterTimers = new Set();
const stageThreeComparisonSkippedKeys = new Set();
const stageThreeComparisonRunIds = new Map();
const usedPriceGuides = new Map();
const purchaseReceipts = new Map();
const purchaseReceiptPrintedKeys = new Set();
const imageAnalysisPreviewedKeys = new Set();
const searchQueryRegenerations = new Map();
const stageThreeAutoQueryRetryCounts = new Map();
const stageThreeCollectionFinalizingKeys = new Map();
const stageThreeSearchProgresses = new Map();
const stageThreeCollectionTimeoutTimers = new Map();
const usedPriceGuideProgresses = new Map();
const directAiChat = {
  open: false,
  status: 'idle',
  commandStatus: 'idle',
  messages: [],
  keywordStatus: 'idle',
  keywordItems: [],
  keywordGroups: [],
  keywordSignature: '',
};
const directAiChatStates = new Map();
const sellerChatStates = new Map();
const favoriteListingKeys = new Set();
const sellerChatToneOptions = [
  { value: 'polite', label: '공손하게' },
  { value: 'friendly', label: '밝게' },
  { value: 'firm', label: '단호하게' },
];
const APP_SHORTCUT_GROUPS = [
  {
    title: '기본',
    items: [
      ['Esc', '열린 팝업·AI 비서 닫기'],
      ['/', '매물 URL 입력 열기'],
      ['?', '단축키 패널 열기/닫기'],
      ['R', '전체 재분석'],
      ['N', '새 분석 시작'],
    ],
  },
  {
    title: '보기',
    items: [
      ['L', '스크롤식/슬라이드식 전환'],
      ['D', '다크모드 전환'],
      ['H', '최근 매물 열기/닫기'],
      ['S', 'AI 설정 열기'],
    ],
  },
  {
    title: '단계 이동',
    items: [
      ['← / →', '슬라이드식 이전/다음 단계'],
      ['1~5', '해당 단계로 바로 이동'],
      ['Home / End', '첫 단계/마지막 가능 단계'],
      ['Enter', '보이는 다음 단계 카드 시작'],
    ],
  },
  {
    title: '사진·AI',
    items: [
      ['↑ / ↓', '화면 위/아래 스크롤'],
      ['I, P, F', '매물 사진 전체보기'],
      ['Shift+I / X', '하자/이미지 분석 사진 전체보기'],
      ['A', 'AI 비서 열기/닫기'],
    ],
  },
];
let lightboxAutoPlayTimer = 0;
let lightboxCloseTimer = 0;
let photoSliderAutoTimer = 0;
let imageAnalysisAutoTimer = 0;
let aiLoadingProgressTimer = 0;
let stageSlideIndex = 0;
let stageSlideAnimationTimer = 0;
let stageStartMotionTimer = 0;
let aiResultMotionTimer = 0;
let sellerChatToastTimer = 0;
let autoRunTimer = 0;
let favoriteCompareOpen = false;
let lastStageThreeCompsRenderKey = '';
let activeAiRunId = 0;
const activeAiAbortControllers = new Set();
let pendingImportUrl = '';
const RECEIPT_PRINT_SCROLL_MS = 6600;
const MIN_PRICE_REFERENCE_MATCHES = 5;
const MAX_STAGE_THREE_AUTO_QUERY_RETRIES = 0;
const STAGE_THREE_COLLECTION_TIMEOUT_MS = 10_000;
const STAGE_THREE_COMPARISON_FILTER_TIMEOUT_MS = 8_000;
const AI_CACHE_STORAGE_KEY = 'ulsa_ai_analysis_cache_v15';
const LISTING_IMAGE_OVERLAY_VERSION = 25;
const IMAGE_DEFECT_MARKER_MIN_PERCENT = 6;
const LAYOUT_MODE_STORAGE_KEY = 'ulsa_layout_mode';
const THEME_MODE_STORAGE_KEY = 'ulsa_theme_mode';
const AUTO_RUN_STORAGE_KEY = 'ulsa_auto_run_next_steps';
const FAVORITE_LISTINGS_STORAGE_KEY = 'ulsa_favorite_listing_keys_v1';
const AI_CACHE_LEGACY_STORAGE_KEYS = [
  'ulsa_ai_analysis_cache_v3',
  'ulsa_ai_analysis_cache_v4',
  'ulsa_ai_analysis_cache_v5',
  'ulsa_ai_analysis_cache_v6',
  'ulsa_ai_analysis_cache_v7',
  'ulsa_ai_analysis_cache_v8',
  'ulsa_ai_analysis_cache_v10',
  'ulsa_ai_analysis_cache_v11',
  'ulsa_ai_analysis_cache_v13',
];

function mapToPersistableObject(map) {
  return Object.fromEntries(
    [...map.entries()].filter(([, state]) => state?.status === 'done' || state?.status === 'error')
  );
}

function restorePersistedMap(map, raw, acceptState = null) {
  if (!raw || typeof raw !== 'object') return;
  for (const [key, state] of Object.entries(raw)) {
    if ((state?.status === 'done' || state?.status === 'error') && (!acceptState || acceptState(state, key))) map.set(key, state);
  }
}

function directAiChatStateToPersistable(state) {
  if (!state || typeof state !== 'object') return null;
  const messages = Array.isArray(state.messages)
    ? state.messages
        .map((msg) => ({
          role: msg?.role === 'user' ? 'user' : 'ai',
          text: String(msg?.text || '').slice(0, 6000),
        }))
        .filter((msg) => msg.text)
        .slice(-40)
    : [];
  const keywordGroups = sanitizeDirectAiKeywordGroups(state);
  const keywordItems = flattenDirectAiKeywordGroups(keywordGroups, state.keywordItems).slice(-15);
  if (!messages.length && !keywordItems.length && !keywordGroups.length && !state.keywordSignature) return null;
  return {
    status: state.status === 'loading' ? 'idle' : state.status || 'idle',
    messages,
    keywordStatus: state.keywordStatus === 'loading' ? 'idle' : state.keywordStatus || 'idle',
    keywordItems,
    keywordGroups,
    keywordSignature: String(state.keywordSignature || ''),
  };
}

function directAiChatStatesToPersistableObject() {
  return Object.fromEntries(
    [...directAiChatStates.entries()]
      .map(([key, state]) => [key, directAiChatStateToPersistable(state)])
      .filter(([, state]) => state)
  );
}

function restoreDirectAiChatStates(raw) {
  if (!raw || typeof raw !== 'object') return;
  for (const [key, state] of Object.entries(raw)) {
    const cleaned = directAiChatStateToPersistable(state);
    if (key && cleaned) directAiChatStates.set(key, cleaned);
  }
}

function setToPersistableArray(set) {
  return [...set].filter(Boolean);
}

function restorePersistedSet(set, raw) {
  if (!Array.isArray(raw)) return;
  for (const value of raw) {
    if (value) set.add(String(value));
  }
}

function listingKeyFromStageCacheKey(key) {
  return String(key || '').split('::')[0] || '';
}

function isStageThreeCacheSettled(status) {
  return status === 'done' || status === 'error';
}

function hasSettledStageThreeCache(listingKey) {
  if (!listingKey) return false;
  const comparisonKey = findListingStageCacheKey(comparisonFilters, listingKey);
  const guideKey = findListingStageCacheKey(usedPriceGuides, listingKey);
  return Boolean(
    comparisonKey &&
      guideKey &&
      isStageThreeCacheSettled(comparisonFilters.get(comparisonKey)?.status) &&
      isStageThreeCacheSettled(usedPriceGuides.get(guideKey)?.status)
  );
}

function restoredStageThreeComps(item, rawComps) {
  const key = summaryKey(item);
  if (!key) return null;
  const active = activeCompsForItem(item, rawComps);
  if (active) return active;
  if (stageThreeComparisonSkippedKeys.has(key)) return emptyComparisonComps(item);
  if (hasSettledStageThreeCache(key)) {
    stageThreeSearchProgresses.delete(key);
    clearStageThreeCollectionTimeout(key);
    return emptyComparisonComps(item);
  }
  if (relatedRequestedKeys.has(key) || stageThreeActiveKeys.has(key)) {
    if (rawComps?.status === 'collecting' && rawComps.forItemKey === itemKey(item)) return rawComps;
    return null;
  }
  return null;
}

function findListingStageCacheKey(map, listingKey, preferKey = '') {
  if (!listingKey) return '';
  if (preferKey && isStageThreeCacheSettled(map.get(preferKey)?.status)) return preferKey;
  let fallback = '';
  for (const cacheKey of map.keys()) {
    if (listingKeyFromStageCacheKey(cacheKey) !== listingKey) continue;
    const status = map.get(cacheKey)?.status;
    if (!isStageThreeCacheSettled(status)) continue;
    if (status === 'done') return cacheKey;
    fallback = fallback || cacheKey;
  }
  return fallback;
}

function ensureListingStageCacheAlias(map, listingKey, targetKey) {
  if (!listingKey || !targetKey || isStageThreeCacheSettled(map.get(targetKey)?.status)) return false;
  const sourceKey = findListingStageCacheKey(map, listingKey);
  if (!sourceKey || sourceKey === targetKey) return false;
  const source = map.get(sourceKey);
  if (!isStageThreeCacheSettled(source?.status)) return false;
  map.set(targetKey, { ...source });
  persistAiCaches();
  return true;
}

function resolvedComparisonFilterState(item, comps) {
  const filterKey = comparisonFilterKey(item, comps);
  const listingKey = summaryKey(item);
  const settledKey = findListingStageCacheKey(comparisonFilters, listingKey, filterKey);
  if (settledKey) return { filterKey: settledKey, state: comparisonFilters.get(settledKey) };
  return { filterKey, state: filterKey ? comparisonFilters.get(filterKey) : null };
}

function resolvedUsedPriceGuideState(item, comps) {
  const key = usedPriceGuideKey(item, comps);
  const listingKey = summaryKey(item);
  const settledKey = findListingStageCacheKey(usedPriceGuides, listingKey, key);
  if (settledKey) return { key: settledKey, state: usedPriceGuides.get(settledKey) };
  return { key, state: key ? usedPriceGuides.get(key) : null };
}

function resolvedPurchaseReceiptState(item, comps) {
  const key = purchaseReceiptKey(item, comps);
  const listingKey = summaryKey(item);
  const settledKey = findListingStageCacheKey(purchaseReceipts, listingKey, key);
  if (settledKey) return { key: settledKey, state: purchaseReceipts.get(settledKey) };
  return { key, state: key ? purchaseReceipts.get(key) : null };
}

function persistAiCaches() {
  try {
    localStorage.setItem(
      AI_CACHE_STORAGE_KEY,
      JSON.stringify({
        relatedRequestedKeys: setToPersistableArray(relatedRequestedKeys),
        stageThreeActiveKeys: setToPersistableArray(stageThreeActiveKeys),
        productSummaries: mapToPersistableObject(productSummaries),
        productRiskAnalyses: mapToPersistableObject(productRiskAnalyses),
        productRiskYoutubeAnalyses: mapToPersistableObject(productRiskYoutubeAnalyses),
        listingTextAnalyses: mapToPersistableObject(listingTextAnalyses),
        listingImageAnalyses: mapToPersistableObject(listingImageAnalyses),
        accessoryChecks: mapToPersistableObject(accessoryChecks),
        comparisonFilters: mapToPersistableObject(comparisonFilters),
        stageThreeComparisonSkippedKeys: setToPersistableArray(stageThreeComparisonSkippedKeys),
        usedPriceGuides: mapToPersistableObject(usedPriceGuides),
        purchaseReceipts: mapToPersistableObject(purchaseReceipts),
        directAiChatStates: directAiChatStatesToPersistableObject(),
      })
    );
  } catch {
    /* localStorage may be unavailable */
  }
}

function loadAiCaches() {
  for (const storageKey of [...AI_CACHE_LEGACY_STORAGE_KEYS, AI_CACHE_STORAGE_KEY]) {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      restorePersistedSet(relatedRequestedKeys, parsed.relatedRequestedKeys);
      restorePersistedSet(stageThreeActiveKeys, parsed.stageThreeActiveKeys);
      restorePersistedMap(productSummaries, parsed.productSummaries);
      restorePersistedMap(productRiskAnalyses, parsed.productRiskAnalyses);
      restorePersistedMap(productRiskYoutubeAnalyses, parsed.productRiskYoutubeAnalyses);
      restorePersistedMap(listingTextAnalyses, parsed.listingTextAnalyses);
      restorePersistedMap(
        listingImageAnalyses,
        parsed.listingImageAnalyses,
        (state) => state?.status !== 'done' || Number(state.overlayVersion) >= LISTING_IMAGE_OVERLAY_VERSION
      );
      restorePersistedMap(accessoryChecks, parsed.accessoryChecks);
      restorePersistedMap(comparisonFilters, parsed.comparisonFilters);
      restorePersistedSet(stageThreeComparisonSkippedKeys, parsed.stageThreeComparisonSkippedKeys);
      restorePersistedMap(usedPriceGuides, parsed.usedPriceGuides);
      restorePersistedMap(purchaseReceipts, parsed.purchaseReceipts);
      restoreDirectAiChatStates(parsed.directAiChatStates);
    } catch {
      /* ignore stale cache */
    }
  }
  for (const key of [...comparisonFilters.keys(), ...usedPriceGuides.keys(), ...purchaseReceipts.keys()]) {
    const listingKey = listingKeyFromStageCacheKey(key);
    if (!listingKey) continue;
    relatedRequestedKeys.add(listingKey);
    stageThreeActiveKeys.add(listingKey);
  }
  for (const key of [...usedPriceGuides.keys(), ...purchaseReceipts.keys()]) {
    if (key && !comparisonFilters.has(key)) comparisonFilters.set(key, { status: 'done', matches: [] });
  }
  for (const [key, state] of purchaseReceipts.entries()) {
    if (state?.status === 'done') purchaseReceiptPrintedKeys.add(key);
  }
  persistAiCaches();
}

loadAiCaches();
function loadFavoriteListings() {
  try {
    const raw = localStorage.getItem(FAVORITE_LISTINGS_STORAGE_KEY);
    const parsed = JSON.parse(raw || '[]');
    if (Array.isArray(parsed)) {
      favoriteListingKeys.clear();
      parsed.filter(Boolean).forEach((key) => favoriteListingKeys.add(String(key)));
    }
  } catch {
    /* ignore */
  }
}

function persistFavoriteListings() {
  try {
    localStorage.setItem(FAVORITE_LISTINGS_STORAGE_KEY, JSON.stringify([...favoriteListingKeys]));
  } catch {
    /* ignore */
  }
}

loadFavoriteListings();
setLayoutMode(readLayoutMode(), { persist: false });
setAutoRunMode(readAutoRunMode(), { persist: false });

function readLayoutMode() {
  try {
    const stored = localStorage.getItem(LAYOUT_MODE_STORAGE_KEY);
    return stored === 'scroll' ? 'scroll' : 'slide';
  } catch {
    return 'slide';
  }
}

function setLayoutMode(mode, opts = {}) {
  const normalized = mode === 'scroll' ? 'scroll' : 'slide';
  const isSlide = normalized === 'slide';
  $appShell?.classList.toggle('app-shell--slide', isSlide);
  if ($btnLayoutMode) {
    $btnLayoutMode.textContent = isSlide ? '스크롤식' : '슬라이드식';
    $btnLayoutMode.setAttribute('aria-pressed', isSlide ? 'true' : 'false');
    $btnLayoutMode.title = isSlide
      ? '스크롤식으로 전환합니다.'
      : '슬라이드식으로 전환합니다.';
  }
  if (opts.persist !== false) {
    try {
      localStorage.setItem(LAYOUT_MODE_STORAGE_KEY, normalized);
    } catch {
      /* localStorage may be unavailable */
    }
  }
  updateRailLayoutToggle();
  updateStageSlide();
  requestAnimationFrame(() => bindScrollText($current));
}

function readAutoRunMode() {
  try {
    return localStorage.getItem(AUTO_RUN_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function isAutoRunEnabled() {
  return Boolean($autoRunToggle?.checked);
}

function setAutoRunMode(enabled, opts = {}) {
  const on = enabled === true;
  if ($autoRunToggle) {
    $autoRunToggle.checked = on;
    $autoRunToggle.setAttribute('aria-checked', on ? 'true' : 'false');
  }
  $appShell?.classList.toggle('is-auto-run-enabled', on);
  if (opts.persist !== false) {
    try {
      localStorage.setItem(AUTO_RUN_STORAGE_KEY, on ? '1' : '0');
    } catch {
      /* localStorage may be unavailable */
    }
  }
  if (on) scheduleAutoRunNextStep();
}

function storedThemeMode() {
  try {
    return localStorage.getItem(THEME_MODE_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function isDarkModeEnabled() {
  return document.documentElement.classList.contains('theme-dark') || document.body.classList.contains('theme-dark');
}

function setThemeMode(mode, opts = {}) {
  const normalized = mode === 'dark' ? 'dark' : 'light';
  const isDark = normalized === 'dark';
  document.documentElement.classList.toggle('theme-dark', isDark);
  document.body.classList.toggle('theme-dark', isDark);
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  if (opts.persist !== false) {
    try {
      localStorage.setItem(THEME_MODE_STORAGE_KEY, normalized);
    } catch {
      /* localStorage may be unavailable */
    }
  }
  updateRailThemeToggle();
}

function updateRailLayoutToggle() {
  const btn = globalThis.document?.querySelector?.('[data-rail-action="layout"]');
  if (!btn) return;
  const isSlide = $appShell?.classList.contains('app-shell--slide');
  const icon = btn.querySelector('.material-symbols-rounded');
  const label = btn.querySelector('small');
  if (icon) icon.textContent = isSlide ? 'view_carousel' : 'view_agenda';
  if (label) label.textContent = isSlide ? '슬라이드' : '스크롤';
  btn.setAttribute('aria-label', isSlide ? '현재 슬라이드식 보기, 누르면 스크롤식 전환' : '현재 스크롤식 보기, 누르면 슬라이드식 전환');
}

function updateRailThemeToggle() {
  const btn = globalThis.document?.querySelector?.('[data-rail-action="theme"]');
  if (!btn) return;
  const isDark = isDarkModeEnabled();
  const icon = btn.querySelector('.material-symbols-rounded');
  const label = btn.querySelector('small');
  btn.classList.toggle('is-on', isDark);
  btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
  btn.setAttribute('aria-label', isDark ? '다크모드 켜짐, 누르면 라이트모드 전환' : '다크모드 꺼짐, 누르면 다크모드 전환');
  if (icon) icon.textContent = isDark ? 'light_mode' : 'dark_mode';
  if (label) label.textContent = isDark ? '라이트' : '다크';
}

function stageSlideCount() {
  return Math.max(1, $current?.querySelectorAll('[data-stage-panel]')?.length || 1);
}

function currentRenderedItem() {
  return (selectedKey && history.find((item) => itemKey(item) === selectedKey)) || latest || null;
}

const AI_LOADING_DURATIONS = {
  productSummary: 9000,
  productRisk: 18000,
  productRiskYoutube: 30000,
  listingText: 7000,
  listingImage: 18000,
  accessoryCheck: 24000,
  searchQuery: 8000,
  comparisonFilter: 11000,
  usedPriceGuide: 9000,
  purchaseReceipt: 8500,
  sellerChat: 7000,
};
const AI_LOADING_FINISH_RAMP_MS = 520;
const AI_LOADING_FINISH_MS = 850;

function aiLoadingPercent(state, kind) {
  if (!state || state.status !== 'loading') return null;
  if (Number.isFinite(Number(state.forcePercent))) {
    const forcePercent = Math.max(0, Math.min(100, Number(state.forcePercent)));
    const finishStartedAt = Number(state.finishStartedAt || 0);
    const finishFromPercent = Number(state.finishFromPercent);
    if (finishStartedAt && Number.isFinite(finishFromPercent)) {
      const progress = Math.max(0, Math.min(1, (Date.now() - finishStartedAt) / AI_LOADING_FINISH_RAMP_MS));
      return finishFromPercent + (forcePercent - finishFromPercent) * progress;
    }
    return forcePercent;
  }
  const startedAt = Number(state.startedAt || state.loadingStartedAt || 0);
  if (!startedAt) return 0;
  const duration = Number(state.durationMs || state.duration) || AI_LOADING_DURATIONS[kind] || 8000;
  const elapsed = Math.max(0, Date.now() - startedAt);
  const startPercent = Number.isFinite(Number(state.startPercent)) ? Number(state.startPercent) : 0;
  const endPercent = Number.isFinite(Number(state.endPercent)) ? Number(state.endPercent) : 99;
  const progress = Math.max(0, Math.min(1, elapsed / duration));
  return Math.max(0, Math.min(99, startPercent + (endPercent - startPercent) * progress));
}

function renderAiLoadingProgress(state, kind) {
  const percent = aiLoadingPercent(state, kind);
  if (percent == null) return '';
  const displayPercent = Math.floor(percent);
  const detailText =
    kind === 'listingImage' && displayPercent >= 86
      ? '사진 분석 마무리 중'
      : kind === 'listingImage'
        ? '사진 상태 확인 중'
        : '';
  const startedAt = Number(state.startedAt || state.loadingStartedAt || 0) || Date.now();
  const duration = Number(state.durationMs || state.duration) || AI_LOADING_DURATIONS[kind] || 8000;
  const forcePercent = Number.isFinite(Number(state.forcePercent)) ? Number(state.forcePercent) : '';
  const finishStartedAt = Number(state.finishStartedAt || 0) || '';
  const finishFromPercent = Number.isFinite(Number(state.finishFromPercent)) ? Number(state.finishFromPercent) : '';
  const startPercent = Number.isFinite(Number(state.startPercent)) ? Number(state.startPercent) : '';
  const endPercent = Number.isFinite(Number(state.endPercent)) ? Number(state.endPercent) : '';
  ensureAiLoadingProgressTicker();
  return `
    <div class="ai-loading-progress" aria-hidden="true" data-ai-progress data-started-at="${startedAt}" data-duration="${duration}" data-force-percent="${forcePercent}" data-finish-started-at="${finishStartedAt}" data-finish-from-percent="${finishFromPercent}" data-start-percent="${startPercent}" data-end-percent="${endPercent}" data-kind="${escapeAttr(kind || '')}">
      <div class="ai-loading-progress__bar"><i style="width:${percent}%"></i></div>
      <span class="ai-loading-progress__text">${displayPercent}%</span>
      ${detailText ? `<span class="ai-loading-progress__detail">${escapeHtml(detailText)}</span>` : ''}
    </div>
  `;
}

function htmlHasAiProgress(html) {
  return /\bdata-ai-progress\b/.test(String(html || ''));
}

function elementHasAiProgress(el) {
  return Boolean(el?.querySelector?.('[data-ai-progress]'));
}

function aiProgressKind(source) {
  if (!source) return '';
  if (typeof source === 'string') {
    const match = source.match(/data-ai-progress[^>]*\bdata-kind="([^"]*)"/);
    return match ? match[1] : '';
  }
  const node = source.querySelector?.('[data-ai-progress]');
  return node?.getAttribute('data-kind') || '';
}

function shouldKeepExistingLoadingBlock(existing, nextHtml) {
  if (!existing || !elementHasAiProgress(existing) || !htmlHasAiProgress(nextHtml)) return false;
  // 로딩 "종류"가 같을 때만 기존 블록을 유지한다(재등장 애니메이션 방지).
  // 종류가 다르면(예: 수집 → AI 판별 전환) 반드시 새로 렌더해 다음 단계 파이프라인이 이어지게 한다.
  return aiProgressKind(existing) === aiProgressKind(nextHtml);
}

function updateAiLoadingProgressNodes(kind = '', state = null, root = document) {
  const nodes = root?.querySelectorAll?.('[data-ai-progress]') || [];
  nodes.forEach((node) => {
    if (kind && node.getAttribute('data-kind') !== kind) return;
    if (!state) return;
    const attrs = {
      'data-started-at': Number(state.startedAt || state.loadingStartedAt || 0) || Date.now(),
      'data-duration': Number(state.durationMs || state.duration) || AI_LOADING_DURATIONS[kind] || 8000,
      'data-force-percent': Number.isFinite(Number(state.forcePercent)) ? Number(state.forcePercent) : '',
      'data-finish-started-at': Number(state.finishStartedAt || 0) || '',
      'data-finish-from-percent': Number.isFinite(Number(state.finishFromPercent)) ? Number(state.finishFromPercent) : '',
      'data-start-percent': Number.isFinite(Number(state.startPercent)) ? Number(state.startPercent) : '',
      'data-end-percent': Number.isFinite(Number(state.endPercent)) ? Number(state.endPercent) : '',
    };
    for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, String(value));
    const percent = aiLoadingPercent(state || {}, kind);
    if (Number.isFinite(percent)) {
      const bar = node.querySelector('.ai-loading-progress__bar i');
      const text = node.querySelector('.ai-loading-progress__text');
      if (bar) bar.style.width = `${percent}%`;
      if (text) text.textContent = `${Math.floor(percent)}%`;
    }
  });
  ensureAiLoadingProgressTicker();
}

function optionalNumberAttr(node, name) {
  const raw = node.getAttribute(name);
  if (raw == null || raw === '') return NaN;
  return Number(raw);
}

function hasVisibleAiLoading(item = currentRenderedItem()) {
  if (!item) return false;
  const key = summaryKey(item);
  const stageKey = sellerChatKey(item);
  const stageComps = effectiveStageThreeComps(item, comps);
  const filterKey = comparisonFilterKey(item, stageComps);
  const receiptKey = purchaseReceiptKey(item, stageComps);
  return Boolean(
    productSummaries.get(key)?.status === 'loading' ||
      productRiskAnalyses.get(key)?.status === 'loading' ||
      productRiskYoutubeAnalyses.get(key)?.status === 'loading' ||
      listingTextAnalyses.get(key)?.status === 'loading' ||
      listingImageAnalyses.get(key)?.status === 'loading' ||
      accessoryChecks.get(key)?.status === 'loading' ||
      searchQueryRegenerations.get(key)?.status === 'loading' ||
      (filterKey && comparisonFilters.get(filterKey)?.status === 'loading') ||
      (filterKey && usedPriceGuides.get(filterKey)?.status === 'loading') ||
      (receiptKey && purchaseReceipts.get(receiptKey)?.status === 'loading') ||
      sellerChatStates.get(stageKey)?.status === 'loading'
  );
}

function isStageThreeCollectionFinalizing(key) {
  const until = stageThreeCollectionFinalizingKeys.get(key) || 0;
  if (until > Date.now()) return true;
  if (until) stageThreeCollectionFinalizingKeys.delete(key);
  return false;
}

function stageThreeSearchProgressPercent(progress = {}) {
  if (Number.isFinite(Number(progress.forcePercent))) {
    const forcePercent = Math.max(0, Math.min(100, Number(progress.forcePercent)));
    const finishStartedAt = Number(progress.finishStartedAt || 0);
    const finishFromPercent = Number(progress.finishFromPercent);
    if (finishStartedAt && Number.isFinite(finishFromPercent)) {
      const t = Math.max(0, Math.min(1, (Date.now() - finishStartedAt) / AI_LOADING_FINISH_RAMP_MS));
      return finishFromPercent + (forcePercent - finishFromPercent) * t;
    }
    return forcePercent;
  }
  const startedAt = Number(progress.startedAt || 0);
  const duration = Math.max(Number(progress.durationMs) || 1, 1);
  const startPercent = Number.isFinite(Number(progress.startPercent)) ? Number(progress.startPercent) : 0;
  const endPercent = Number.isFinite(Number(progress.endPercent)) ? Number(progress.endPercent) : 60;
  const t = startedAt ? Math.max(0, Math.min(1, (Date.now() - startedAt) / duration)) : 0;
  return Math.max(0, Math.min(99, startPercent + (endPercent - startPercent) * t));
}

function ensureStageThreeSearchProgress(item, seed = {}) {
  const key = summaryKey(item);
  if (!key) return null;
  const existing = stageThreeSearchProgresses.get(key);
  if (existing) return existing;
  const progress = {
    phase: 'collecting',
    startedAt: seed.startedAt || Date.now(),
    durationMs: 22000,
    startPercent: 0,
    endPercent: 62,
  };
  stageThreeSearchProgresses.set(key, progress);
  return progress;
}

function stageThreeSearchProgressState(item, phase, seed = {}) {
  const key = summaryKey(item);
  const progress = ensureStageThreeSearchProgress(item, seed);
  if (!key || !progress) return seed?.fallback || null;
  if (phase === 'identifying' && progress.phase !== 'identifying' && progress.phase !== 'complete') {
    const currentPercent = Math.max(stageThreeSearchProgressPercent(progress), 62);
    Object.assign(progress, {
      phase: 'identifying',
      startedAt: Date.now(),
      durationMs: 18000,
      startPercent: Math.min(currentPercent, 78),
      endPercent: 94,
    });
  }
  if (phase === 'complete' && progress.phase !== 'complete') {
    Object.assign(progress, {
      phase: 'complete',
      forcePercent: 100,
      finishStartedAt: Date.now(),
      finishFromPercent: Math.min(99, Math.max(0, stageThreeSearchProgressPercent(progress))),
    });
  }
  return {
    status: 'loading',
    startedAt: progress.startedAt,
    duration: progress.durationMs,
    startPercent: progress.startPercent,
    endPercent: progress.endPercent,
    forcePercent: progress.forcePercent,
    finishStartedAt: progress.finishStartedAt,
    finishFromPercent: progress.finishFromPercent,
  };
}

async function completeStageThreeSearchProgress(item, refresh) {
  const state = stageThreeSearchProgressState(item, 'complete');
  updateAiLoadingProgressNodes('searchQuery', state);
  updateAiLoadingProgressNodes('comparisonFilter', state);
  if (typeof refresh === 'function') refresh();
  await waitMs(AI_LOADING_FINISH_MS);
  const key = summaryKey(item);
  if (key) stageThreeSearchProgresses.delete(key);
}

function usedPriceGuideProgressKey(item) {
  return summaryKey(item);
}

function usedPriceGuideProgressPercent(progress = {}) {
  if (Number.isFinite(Number(progress.forcePercent))) {
    const forcePercent = Math.max(0, Math.min(100, Number(progress.forcePercent)));
    const finishStartedAt = Number(progress.finishStartedAt || 0);
    const finishFromPercent = Number(progress.finishFromPercent);
    if (finishStartedAt && Number.isFinite(finishFromPercent)) {
      const t = Math.max(0, Math.min(1, (Date.now() - finishStartedAt) / AI_LOADING_FINISH_RAMP_MS));
      return finishFromPercent + (forcePercent - finishFromPercent) * t;
    }
    return forcePercent;
  }
  const startedAt = Number(progress.startedAt || 0);
  const duration = Math.max(Number(progress.durationMs) || 1, 1);
  const startPercent = Number.isFinite(Number(progress.startPercent)) ? Number(progress.startPercent) : 0;
  const endPercent = Number.isFinite(Number(progress.endPercent)) ? Number(progress.endPercent) : 76;
  const t = startedAt ? Math.max(0, Math.min(1, (Date.now() - startedAt) / duration)) : 0;
  return Math.max(0, Math.min(99, startPercent + (endPercent - startPercent) * t));
}

function ensureUsedPriceGuideProgress(item, seed = {}) {
  const key = usedPriceGuideProgressKey(item);
  if (!key) return null;
  const existing = usedPriceGuideProgresses.get(key);
  if (existing) return existing;
  const progress = {
    phase: 'waiting',
    startedAt: seed.startedAt || Date.now(),
    durationMs: 42_000,
    startPercent: 0,
    endPercent: 76,
  };
  usedPriceGuideProgresses.set(key, progress);
  return progress;
}

function usedPriceGuideProgressState(item, phase, seed = {}) {
  const key = usedPriceGuideProgressKey(item);
  const progress = ensureUsedPriceGuideProgress(item, seed);
  if (!key || !progress) return null;
  if (phase === 'generating' && progress.phase !== 'generating' && progress.phase !== 'complete') {
    const currentPercent = Math.max(usedPriceGuideProgressPercent(progress), 76);
    Object.assign(progress, {
      phase: 'generating',
      startedAt: Date.now(),
      durationMs: 15000,
      startPercent: Math.min(currentPercent, 86),
      endPercent: 94,
    });
  }
  if (phase === 'complete' && progress.phase !== 'complete') {
    Object.assign(progress, {
      phase: 'complete',
      forcePercent: 100,
      finishStartedAt: Date.now(),
      finishFromPercent: Math.min(99, Math.max(0, usedPriceGuideProgressPercent(progress))),
    });
  }
  return {
    status: 'loading',
    startedAt: progress.startedAt,
    duration: progress.durationMs,
    startPercent: progress.startPercent,
    endPercent: progress.endPercent,
    forcePercent: progress.forcePercent,
    finishStartedAt: progress.finishStartedAt,
    finishFromPercent: progress.finishFromPercent,
  };
}

async function completeUsedPriceGuideProgress(item, refresh) {
  const state = usedPriceGuideProgressState(item, 'complete');
  updateAiLoadingProgressNodes('usedPriceGuide', state);
  if (typeof refresh === 'function') refresh();
  await waitMs(AI_LOADING_FINISH_MS);
  const key = usedPriceGuideProgressKey(item);
  if (key) usedPriceGuideProgresses.delete(key);
}

function refreshVisibleAiLoadingCards(item = currentRenderedItem()) {
  if (!item) {
    if (directAiChat?.status === 'loading') {
      renderDirectAiPanel();
      return true;
    }
    return false;
  }
  const key = summaryKey(item);
  let refreshed = false;
  if (
    productSummaries.get(key)?.status === 'loading' ||
    productRiskAnalyses.get(key)?.status === 'loading' ||
    listingTextAnalyses.get(key)?.status === 'loading' ||
    listingImageAnalyses.get(key)?.status === 'loading' ||
    accessoryChecks.get(key)?.status === 'loading'
  ) {
    updateAiLoadingProgressNodes();
    refreshed = true;
  }
  if (productRiskYoutubeAnalyses.get(key)?.status === 'loading') {
    updateAiLoadingProgressNodes('productRiskYoutube', productRiskYoutubeAnalyses.get(key));
    refreshed = true;
  }
  if (searchQueryRegenerations.get(key)?.status === 'loading') {
    if (!$current.querySelector('[data-stage-three-panel]')) refreshStageThreeSection(item);
    refreshed = true;
  }
  const stageComps = effectiveStageThreeComps(item, comps);
  const filterKey = comparisonFilterKey(item, stageComps);
  if (filterKey && (comparisonFilters.get(filterKey)?.status === 'loading' || usedPriceGuides.get(filterKey)?.status === 'loading')) {
    if (!$current.querySelector('[data-stage-three-panel]')) refreshStageThreeSection(item);
    refreshed = true;
  }
  const receiptKey = purchaseReceiptKey(item, stageComps);
  if (receiptKey && purchaseReceipts.get(receiptKey)?.status === 'loading') {
    updateAiLoadingProgressNodes('purchaseReceipt', purchaseReceipts.get(receiptKey));
    refreshed = true;
  }
  const sellerState = sellerChatStates.get(sellerChatKey(item));
  if (sellerState?.status === 'loading') {
    refreshSellerChatSection(item);
    refreshed = true;
  }
  return refreshed;
}

function ensureAiLoadingProgressTicker() {
  if (aiLoadingProgressTimer) return;
  const tick = () => {
    const nodes = document.querySelectorAll('[data-ai-progress]');
    let hasProgress = false;
    nodes.forEach((node) => {
      const startedAt = Number(node.getAttribute('data-started-at')) || Date.now();
      const duration = Math.max(Number(node.getAttribute('data-duration')) || 8000, 1);
      const forcePercent = optionalNumberAttr(node, 'data-force-percent');
      const finishStartedAt = optionalNumberAttr(node, 'data-finish-started-at') || 0;
      const finishFromPercent = optionalNumberAttr(node, 'data-finish-from-percent');
      const startPercent = Number.isFinite(optionalNumberAttr(node, 'data-start-percent'))
        ? optionalNumberAttr(node, 'data-start-percent')
        : 0;
      const endPercent = Number.isFinite(optionalNumberAttr(node, 'data-end-percent'))
        ? optionalNumberAttr(node, 'data-end-percent')
        : 99;
      const raw = Number.isFinite(forcePercent)
        ? finishStartedAt && Number.isFinite(finishFromPercent)
          ? finishFromPercent + (forcePercent - finishFromPercent) * Math.max(0, Math.min(1, (Date.now() - finishStartedAt) / AI_LOADING_FINISH_RAMP_MS))
          : forcePercent
        : Math.min(99, Math.max(0, startPercent + (endPercent - startPercent) * Math.max(0, Math.min(1, (Date.now() - startedAt) / duration))));
      const percent = Math.max(0, Math.min(100, raw));
      const bar = node.querySelector('.ai-loading-progress__bar i');
      const text = node.querySelector('.ai-loading-progress__text');
      const detail = node.querySelector('.ai-loading-progress__detail');
      if (bar) bar.style.width = `${percent}%`;
      if (text) text.textContent = `${Math.floor(percent)}%`;
      if (detail && node.getAttribute('data-kind') === 'listingImage') {
        detail.textContent = percent >= 86 ? '사진 분석 마무리 중' : '사진 상태 확인 중';
      }
      hasProgress = true;
    });
    if (!hasProgress && !hasVisibleAiLoading()) {
      aiLoadingProgressTimer = 0;
      return;
    }
    aiLoadingProgressTimer = window.requestAnimationFrame(tick);
  };
  aiLoadingProgressTimer = window.requestAnimationFrame(tick);
}

function waitMs(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function createAiRequestScope() {
  const controller = new AbortController();
  const runId = activeAiRunId;
  activeAiAbortControllers.add(controller);
  return {
    runId,
    signal: controller.signal,
    release() {
      activeAiAbortControllers.delete(controller);
    },
  };
}

function isAbortError(error) {
  return error?.name === 'AbortError' || /aborted/i.test(String(error?.message || error || ''));
}

function shouldIgnoreAiScope(scope, error = null) {
  return !scope || scope.signal.aborted || scope.runId !== activeAiRunId || (error && isAbortError(error));
}

function deleteLoadingEntries(store) {
  if (!store?.forEach) return;
  for (const [key, value] of [...store.entries()]) {
    if (value?.status === 'loading') store.delete(key);
  }
}

function cancelActiveAiWork() {
  activeAiRunId += 1;
  for (const controller of activeAiAbortControllers) {
    try {
      controller.abort();
    } catch {
      /* ignore */
    }
  }
  activeAiAbortControllers.clear();
  [
    productSummaries,
    productRiskAnalyses,
    productRiskYoutubeAnalyses,
    listingTextAnalyses,
    listingImageAnalyses,
    comparisonFilters,
    usedPriceGuides,
    purchaseReceipts,
    searchQueryRegenerations,
  ].forEach(deleteLoadingEntries);
  for (const [key, state] of [...sellerChatStates.entries()]) {
    if (state?.status === 'loading') {
      sellerChatStates.set(key, { ...state, status: 'idle', error: '' });
    }
  }
  stageThreeSearchProgresses.clear();
  usedPriceGuideProgresses.clear();
  productImageSearches.clear();
  persistAiCaches();
}

async function showAiLoadingComplete(store, key, refresh, kind = '') {
  const current = store?.get?.(key);
  if (current?.status === 'loading') {
    store.set(key, {
      ...current,
      forcePercent: 100,
      finishStartedAt: Date.now(),
      finishFromPercent: Math.min(99, Math.max(0, aiLoadingPercent(current, kind) || 0)),
    });
    updateAiLoadingProgressNodes(kind, store.get(key));
    await waitMs(AI_LOADING_FINISH_MS);
  }
}

async function finishAiLoadingState(store, key, nextState, refresh, kind = '') {
  await showAiLoadingComplete(store, key, refresh, kind);
  store.set(key, nextState);
}

function isStepOneDone(item) {
  const key = summaryKey(item);
  return Boolean(key && productSummaries.get(key)?.status === 'done');
}

function isStepTwoStarted(item) {
  const key = summaryKey(item);
  if (!key) return false;
  return Boolean(stageTwoActiveKeys.has(key) || productRiskAnalyses.get(key)?.status === 'done');
}

function isStepTwoFlowComplete(item) {
  const key = summaryKey(item);
  if (!key) return false;
  if (stageTwoCompletedKeys.has(key)) return true;
  if (!isStepTwoStarted(item)) return false;
  const riskDone = productRiskAnalyses.get(key)?.status === 'done';
  const textState = listingTextAnalyses.get(key);
  const imageState = listingImageAnalyses.get(key);
  const textSettled = !textState || textState.status === 'done' || textState.status === 'error';
  const imageSettled = imageState?.status === 'done' || imageState?.status === 'error';
  const accessoryState = accessoryChecks.get(key);
  const accessorySettled = !accessoryState || accessoryState.status === 'done' || accessoryState.status === 'error';
  return Boolean(riskDone && textSettled && imageSettled && accessorySettled);
}

function isStepTwoDone(item) {
  return isStepTwoFlowComplete(item);
}

function isStepThreeUnlocked(item) {
  const key = summaryKey(item);
  return Boolean(key && stageThreeActiveKeys.has(key));
}

function emptyComparisonComps(item) {
  return {
    status: 'collected',
    forItemKey: itemKey(item),
    bunjang: { items: [] },
    daangn: { items: [] },
    joongna: { items: [] },
  };
}

function collectingComparisonComps(item) {
  return {
    status: 'collecting',
    forItemKey: itemKey(item),
    startedAt: Date.now(),
    bunjang: null,
    daangn: null,
    joongna: null,
  };
}

function isCompsCollectionTimedOut(comps) {
  if (!comps || comps.status !== 'collecting') return false;
  const startedAt = Number(comps.startedAt || 0);
  return Boolean(startedAt && Date.now() - startedAt >= STAGE_THREE_COLLECTION_TIMEOUT_MS);
}

function scheduleStageThreeCollectionTimeoutRefresh(item, nextComps = comps) {
  const key = summaryKey(item);
  if (!key || !nextComps || nextComps.status !== 'collecting' || stageThreeCollectionTimeoutTimers.has(key)) return;
  const startedAt = Number(nextComps.startedAt || 0) || Date.now();
  const delay = Math.max(0, STAGE_THREE_COLLECTION_TIMEOUT_MS - (Date.now() - startedAt) + 80);
  const timer = window.setTimeout(() => {
    stageThreeCollectionTimeoutTimers.delete(key);
    if (selectedKey === key) refreshStageThreeSection(item);
  }, delay);
  stageThreeCollectionTimeoutTimers.set(key, timer);
}

function clearStageThreeCollectionTimeout(key) {
  const timer = stageThreeCollectionTimeoutTimers.get(key);
  if (timer) window.clearTimeout(timer);
  stageThreeCollectionTimeoutTimers.delete(key);
}

// 자동 매물검색은 무조건 10초 안에 끝난다. storage push가 늦거나 멈춰도
// 이 권위적 타이머가 수집을 강제 마감(collected 처리)하고 다음 단계로 넘긴다.
function armStageThreeHardDeadline(item) {
  const key = summaryKey(item);
  if (!key) return;
  clearStageThreeCollectionTimeout(key);
  const timer = window.setTimeout(() => {
    stageThreeCollectionTimeoutTimers.delete(key);
    forceFinalizeStageThreeCollection(item);
  }, STAGE_THREE_COLLECTION_TIMEOUT_MS + 200);
  stageThreeCollectionTimeoutTimers.set(key, timer);
}

function forceFinalizeStageThreeCollection(item) {
  const key = summaryKey(item);
  if (!key || selectedKey !== key) return;
  // 아직 수집 중이면(collected 신호 미수신) 메모리 comps를 강제로 collected로 전환한다.
  // 이때 그동안 쌓인 매물 항목은 그대로 보존되어 "그대로 출력"이 가능하다.
  if (comps && comps.forItemKey === itemKey(item)) {
    if (comps.status !== 'collected') {
      comps = { ...comps, status: 'collected', collectedAt: new Date().toISOString(), timedOut: true };
    }
  } else {
    comps = { ...emptyComparisonComps(item), timedOut: true };
  }
  lastStageThreeCompsRenderKey = stageThreeCompsRenderKey(item, comps);
  if (stageThreeIsolatedRefreshKeys.has(key)) refreshStageThreeCompsBlock(item, { schedule: true });
  else refreshStageThreeSection(item);
}

function effectiveStageThreeComps(item, nextComps = comps) {
  if (nextComps && isCompsCollected(nextComps)) return nextComps;
  const key = summaryKey(item);
  if (key && stageThreeComparisonSkippedKeys.has(key)) return emptyComparisonComps(item);
  if (key && hasSettledStageThreeCache(key)) return emptyComparisonComps(item);
  return nextComps;
}

function isStepThreeDone(item) {
  if (!isStepTwoDone(item) || !isStepThreeUnlocked(item)) return false;
  const listingKey = summaryKey(item);
  if (!listingKey) return false;
  const settledComps = effectiveStageThreeComps(item);
  const preferKey =
    settledComps && isCompsCollected(settledComps) ? comparisonFilterKey(item, settledComps) : '';
  const comparisonKey = findListingStageCacheKey(comparisonFilters, listingKey, preferKey);
  const guideKey = findListingStageCacheKey(usedPriceGuides, listingKey, preferKey);
  return Boolean(
    comparisonKey &&
      guideKey &&
      isStageThreeCacheSettled(comparisonFilters.get(comparisonKey)?.status) &&
      isStageThreeCacheSettled(usedPriceGuides.get(guideKey)?.status)
  );
}

function isStepFourDone(item) {
  const stageComps = item ? effectiveStageThreeComps(item) : null;
  const { state } = item && stageComps ? resolvedPurchaseReceiptState(item, stageComps) : { state: null };
  return state?.status === 'done';
}

function isPurchaseReceiptPrinted(item, nextComps = comps) {
  const stageComps = item ? effectiveStageThreeComps(item, nextComps) : null;
  const { key, state } = item && stageComps ? resolvedPurchaseReceiptState(item, stageComps) : { key: '', state: null };
  return Boolean(key && state?.status === 'done' && purchaseReceiptPrintedKeys.has(key));
}

function clearPurchaseReceiptPrintedForListing(key) {
  if (!key) return;
  for (const cacheKey of [...purchaseReceiptPrintedKeys]) {
    if (listingKeyFromStageCacheKey(cacheKey) === key || cacheKey.startsWith(`${key}::`)) {
      purchaseReceiptPrintedKeys.delete(cacheKey);
    }
  }
}

function purchaseReceiptsForListingClear(key) {
  if (!key) return;
  for (const cacheKey of [...purchaseReceipts.keys()]) {
    if (listingKeyFromStageCacheKey(cacheKey) === key || cacheKey.startsWith(`${key}::`)) {
      purchaseReceipts.delete(cacheKey);
    }
  }
  clearPurchaseReceiptPrintedForListing(key);
}

function maybeMarkStageTwoComplete(item) {
  const key = summaryKey(item);
  if (key && isStepTwoFlowComplete(item)) stageTwoCompletedKeys.add(key);
}

function ensureCachedStageTwoFollowups(item) {
  const key = summaryKey(item);
  if (!key || productRiskAnalyses.get(key)?.status !== 'done') return;
  void ensureProductRiskYoutube(item);
  void ensureListingTextAnalysis(item);
  void ensureListingImageAnalysis(item);
  void ensureAccessoryCheck(item);
}

function syncStagePanels(item) {
  if (!$current || !item) return;
  if (!isStepTwoDone(item)) {
    $current.querySelector('[data-stage-three-panel]')?.remove();
    $current.querySelector('[data-stage-four-panel]')?.remove();
    $current.querySelector('[data-stage-five-panel]')?.remove();
  } else if (!isStepThreeDone(item)) {
    $current.querySelector('[data-stage-four-panel]')?.remove();
    $current.querySelector('[data-stage-five-panel]')?.remove();
  } else if (!isStepFourDone(item)) {
    $current.querySelector('[data-stage-five-panel]')?.remove();
  }
  updateStageSlide();
}

function canOpenStage(index) {
  const item = currentRenderedItem();
  if (index <= 0) return true;
  if (index === 1) return isStepOneDone(item);
  if (index === 2) return isStepTwoDone(item);
  if (index === 3) return isStepThreeDone(item);
  if (index === 4) return isPurchaseReceiptPrinted(item);
  return false;
}

function updateStageSlide() {
  const count = stageSlideCount();
  stageSlideIndex = Math.max(0, Math.min(stageSlideIndex, count - 1));
  while (stageSlideIndex > 0 && !canOpenStage(stageSlideIndex)) {
    stageSlideIndex -= 1;
  }
  $appShell?.setAttribute('data-stage-slide-index', String(stageSlideIndex));
  scheduleAutoRunNextStep();
  const controls = $current?.querySelector('[data-stage-slide-controls]');
  if (!controls) return;
  const prev = controls.querySelector('[data-stage-slide-prev]');
  const next = controls.querySelector('[data-stage-slide-next]');
  const label = controls.querySelector('[data-stage-slide-label]');
  if (prev) prev.disabled = stageSlideIndex <= 0;
  if (next) next.disabled = stageSlideIndex >= count - 1 || !canOpenStage(stageSlideIndex + 1);
  if (prev) prev.textContent = '<< 이전 단계';
  if (next) next.textContent = stageSlideIndex === 3 ? '다음 단계(선택) >>' : '다음 단계 >>';
  if (label) label.textContent = stageSlideIndex === 4 ? `선택 단계/${count}` : `Step ${stageSlideIndex + 1}/${count}`;
}

function moveStageSlide(dir) {
  const count = stageSlideCount();
  const nextIndex = Math.max(0, Math.min(stageSlideIndex + dir, count - 1));
  if (nextIndex === stageSlideIndex) return;
  if (!canOpenStage(nextIndex)) return;
  if (stageSlideAnimationTimer) window.clearTimeout(stageSlideAnimationTimer);
  $appShell?.classList.remove('is-stage-sliding');
  $appShell?.setAttribute('data-stage-slide-dir', dir > 0 ? 'next' : 'prev');
  void $appShell?.offsetWidth;
  stageSlideIndex = nextIndex;
  $appShell?.classList.add('is-stage-sliding');
  updateStageSlide();
  if (stageSlideIndex === 1) {
    const item = currentRenderedItem();
    if (item) previewListingImageAnalysis(item);
  }
  stageSlideAnimationTimer = window.setTimeout(() => {
    $appShell?.classList.remove('is-stage-sliding');
    stageSlideAnimationTimer = 0;
  }, 540);
}

function playStageStartMotion() {
  if (stageStartMotionTimer) window.clearTimeout(stageStartMotionTimer);
  $appShell?.classList.add('is-stage-starting');
  stageStartMotionTimer = window.setTimeout(() => {
    $appShell?.classList.remove('is-stage-starting');
    stageStartMotionTimer = 0;
  }, 900);
}

function startStageTwo(item, key = summaryKey(item)) {
  if (!item || !key) return false;
  if (!isStepOneDone(item)) return false;
  if (productRiskAnalyses.get(key)?.status === 'loading') return false;
  const shouldRetry = productRiskAnalyses.get(key)?.status === 'error';
  stageTwoActiveKeys.add(key);
  if (shouldRetry) {
    productRiskAnalyses.delete(key);
    productRiskYoutubeAnalyses.delete(key);
    accessoryChecks.delete(key);
  }
  playStageStartMotion();
  if (selectedKey === key) refreshProductSummaryBlock(item, { refreshProductSummary: false });
  void ensureProductRisk(item);
  return true;
}

function startStageThree(item, btn = null, key = summaryKey(item)) {
  if (!item || !key || !isStepTwoDone(item)) return false;
  if (stageThreeActiveKeys.has(key) && relatedRequestedKeys.has(key)) return false;
  stageThreeActiveKeys.add(key);
  relatedRequestedKeys.add(key);
  persistAiCaches();
  playStageStartMotion();
  openRelatedSearchForItem(item, stageThreeSearchQueries(item), btn);
  return true;
}

function startStageFive(item, key = sellerChatKey(item)) {
  if (!item || !key || !isPurchaseReceiptPrinted(item)) return false;
  if (stageFiveActiveKeys.has(key)) return false;
  stageFiveActiveKeys.add(key);
  stageFiveEnteringKeys.add(key);
  playStageStartMotion();
  refreshSellerChatSection(item);
  window.setTimeout(() => {
    stageFiveEnteringKeys.delete(key);
    if (selectedKey === key) refreshSellerChatSection(item);
  }, 760);
  return true;
}

function scheduleAutoRunNextStep(item = currentRenderedItem()) {
  if (!isAutoRunEnabled() || autoRunTimer) return;
  autoRunTimer = window.setTimeout(() => {
    autoRunTimer = 0;
    runAutoNextStep(item || currentRenderedItem());
  }, 90);
}

function runAutoNextStep(item = currentRenderedItem()) {
  if (!isAutoRunEnabled() || !item) return false;
  const key = summaryKey(item);
  if (!key || selectedKey !== key) return false;
  if (!isStepOneDone(item)) return false;
  if (!isStepTwoStarted(item)) return startStageTwo(item, key);
  if (!isStepTwoDone(item)) return false;
  if (!isStepThreeUnlocked(item)) return startStageThree(item, null, key);
  if (!isStepThreeDone(item)) return false;
  const stageComps = effectiveStageThreeComps(item, comps);
  const { state: receiptState } = stageComps ? resolvedPurchaseReceiptState(item, stageComps) : { state: null };
  if (receiptState?.status !== 'done') {
    if (receiptState?.status !== 'loading') void ensurePurchaseReceipt(item);
    return true;
  }
  if (!isPurchaseReceiptPrinted(item, stageComps)) return false;
  return startStageFive(item, key);
}

function playAiResultMotion(duration = 560) {
  if (!$appShell) return;
  if (aiResultMotionTimer) window.clearTimeout(aiResultMotionTimer);
  $appShell.classList.add('is-ai-result-updating');
  aiResultMotionTimer = window.setTimeout(() => {
    $appShell.classList.remove('is-ai-result-updating');
    aiResultMotionTimer = 0;
  }, duration);
}

function renderStageSlideControls() {
  const count = stageSlideCount();
  const prevDisabled = stageSlideIndex <= 0;
  const nextDisabled = stageSlideIndex >= count - 1 || !canOpenStage(stageSlideIndex + 1);
  return `
    <nav class="stage-slide-controls" data-stage-slide-controls aria-label="단계 이동">
      <button type="button" class="btn btn-secondary btn-small" data-stage-slide-prev title="이전 단계 (←/↑)" ${prevDisabled ? 'disabled' : ''}>&lt;&lt; 이전 단계</button>
      <span class="stage-slide-label" data-stage-slide-label>Step 1/1</span>
      <button type="button" class="btn btn-secondary btn-small" data-stage-slide-next title="다음 단계 (→/↓)" ${nextDisabled ? 'disabled' : ''}>다음 단계 &gt;&gt;</button>
    </nav>
  `;
}

function bindStageSlideControls(root) {
  const controls = root?.querySelector('[data-stage-slide-controls]');
  if (!controls) return;
  controls.querySelector('[data-stage-slide-prev]')?.addEventListener('click', () => {
    moveStageSlide(-1);
  });
  controls.querySelector('[data-stage-slide-next]')?.addEventListener('click', () => {
    moveStageSlide(1);
  });
  updateStageSlide();
}

function itemKey(item) {
  return `${item.platform}:${item.itemId}`;
}

function formatTime(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function sellerLine(seller, platform) {
  if (!seller) return '—';
  const bits = [];
  const name = seller.nickname || seller.shopName || '';
  if (name) bits.push(name);
  if (platform === 'daangn' && seller.mannerScore != null) bits.push(`${seller.mannerScore}°C`);
  if (platform === 'joongna' && seller.trustScore != null) {
    bits.push(`신뢰지수 ${Number(seller.trustScore).toLocaleString('ko-KR')}${seller.trustMax != null ? `/${Number(seller.trustMax).toLocaleString('ko-KR')}` : ''}`);
  }
  if (platform === 'joongna' && seller.isSafePayment) bits.push('안심결제 가능');
  if (platform === 'joongna' && seller.safePaymentCount != null) bits.push(`안심결제 ${Number(seller.safePaymentCount).toLocaleString('ko-KR')}건`);
  if (platform !== 'daangn' && seller.reviewRating != null) bits.push(`평점 ${seller.reviewRating}`);
  if (seller.reviewCount != null) bits.push(`${platform === 'joongna' ? '거래후기' : '리뷰'} ${Number(seller.reviewCount).toLocaleString('ko-KR')}`);
  if (platform === 'joongna' && seller.followerCount != null) bits.push(`단골 ${Number(seller.followerCount).toLocaleString('ko-KR')}`);
  if (seller.salesCount != null) bits.push(`판매 ${seller.salesCount}`);
  if (seller.location) bits.push(seller.location);
  return bits.join(' · ') || '—';
}

function shippingLine(item) {
  const label = String(item?.shippingFeeLabel || '').trim();
  if (label) return label;
  if (Number.isFinite(item?.shippingFee)) {
    return item.shippingFee > 0 ? `배송비 ${formatWon(item.shippingFee)}` : '배송비 무료';
  }
  return '';
}

function compStats(items) {
  const prices = (items || []).map((i) => i.price).filter((p) => typeof p === 'number' && p > 0);
  prices.sort((a, b) => a - b);
  if (!prices.length) return null;
  const median = prices[Math.floor(prices.length / 2)];
  return {
    n: prices.length,
    min: prices[0],
    max: prices[prices.length - 1],
    median,
  };
}

function formatWon(n) {
  return `${Number(n).toLocaleString('ko-KR')}원`;
}

function getAiApiKey() {
  const keyName = globalThis.UlsaAi?.STORAGE_KEY_API;
  return keyName ? localStorage.getItem(keyName)?.trim() || '' : '';
}

function summaryKey(item) {
  return item ? itemKey(item) : '';
}

function fallbackSearchQuery(item) {
  return String(item?.title || '')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/[|｜]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeStageThreeSearchQuery(raw) {
  return String(raw || '')
    .replace(/\[[^\]]*\]|\([^)]*\)/g, ' ')
    .replace(/\b\d{1,3}(?:,\d{3})+\s*원?\b/g, ' ')
    .replace(/\b\d+\s*(?:원|만원|천원)\b/g, ' ')
    .replace(/[|｜/·•,+]/g, ' ')
    .replace(
      /\b(?:급처|네고|택포|직거래|무료배송|배송|판매|팝니다|삽니다|구매|교환|미개봉|새상품|단순개봉|풀박스|박스|정품|보증|상태좋음|깨끗|깨끗한|무결점|구성품|포함)\b/gi,
      ' '
    )
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 48);
}

function pushUniqueSearchQuery(out, seen, raw) {
  const query = normalizeStageThreeSearchQuery(raw);
  const key = query.replace(/\s+/g, '').toLowerCase();
  if (!query || seen.has(key)) return false;
  seen.add(key);
  out.push(query);
  return true;
}

function localStageThreeSearchQueries(item, summary = null) {
  const out = [];
  const seen = new Set();
  const sourceQueries = [
    summary?.productName,
    summary?.searchQuery,
    ...(Array.isArray(summary?.searchQueries) ? summary.searchQueries : []),
    fallbackSearchQuery(item),
  ];
  for (const raw of sourceQueries) {
    pushUniqueSearchQuery(out, seen, raw);
    const words = normalizeStageThreeSearchQuery(raw).split(/\s+/).filter(Boolean);
    if (words.length >= 4) pushUniqueSearchQuery(out, seen, words.slice(0, 3).join(' '));
    if (words.length >= 3) pushUniqueSearchQuery(out, seen, words.slice(0, 2).join(' '));
    if (out.length >= 4) break;
  }
  return out.slice(0, 4);
}

function getProductSummaryState(item) {
  const key = summaryKey(item);
  return key ? productSummaries.get(key) || null : null;
}

function riskAnalysisItems(riskAnalysis) {
  return [
    ...(Array.isArray(riskAnalysis?.relatedIssues) ? riskAnalysis.relatedIssues : []),
    ...(Array.isArray(riskAnalysis?.chronicDefects) ? riskAnalysis.chronicDefects : []),
  ].filter(Boolean);
}

function fallbackListingTextAnalysis(item, summary, riskAnalysis) {
  const body = String(item?.body || '').replace(/\s+/g, ' ').trim();
  const seller = sellerLine(item?.seller, item?.platform);
  const productName = summary?.productName || fallbackSearchQuery(item) || '제품';
  const risks = riskAnalysisItems(riskAnalysis);
  const riskTitles = risks.map((x) => String(x.title || '').trim()).filter(Boolean).slice(0, 3);
  const missingRiskMentions = riskTitles.filter((title) => title && !body.includes(title));
  const redFlags = [];
  if (!/구성|구성품|박스|케이블|충전|영수증|보증|AS|as/i.test(body)) {
    redFlags.push('구성품·보증/AS 언급이 부족합니다.');
  }
  if (missingRiskMentions.length) {
    redFlags.push(`앞 단계 리스크(${missingRiskMentions.join(', ')}) 관련 상태 언급이 없습니다.`);
  }
  if (!/하자|정상|작동|상태|스크래치|기스|찍힘|오염/i.test(body)) {
    redFlags.push('작동 상태나 외관 하자 설명이 부족합니다.');
  }
  return {
    sellerVerdict: seller && seller !== '—' ? `판매자 지표는 ${seller}로 확인됩니다.` : '판매자 세부 정보가 부족해 신뢰도 판단 근거가 약합니다.',
    bodyVerdict: `${productName} 판매글은 본문 기준으로 제품명과 기본 설명은 있으나, 구성품·상태·앞 단계 리스크에 대한 대응 설명이 충분한지 대조가 필요합니다.`,
    redFlags: redFlags.slice(0, 3),
    overall: redFlags.length ? '판매글에 확인해야 할 누락 정보가 있습니다.' : '본문상 큰 누락은 적지만 구성품과 상태 확인은 필요합니다.',
  };
}

function isTrivialSellerVerdict(text) {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  if (!s) return true;
  const repeatsMetrics = /평점|리뷰|판매\s*\d|판매\s*이력|거래\s*이력|신뢰할\s*수\s*있는|신뢰도/.test(s);
  const hasActualJudgment = /하지만|다만|한계|부족|누락|본문|언급|불일치|주의|위험|애매|근거/.test(s);
  return repeatsMetrics && !hasActualJudgment;
}

const LISTING_PURCHASE_JUDGMENT_RE =
  /구매\s*(?:권장|추천|비추천|권하지|권장하지|추천하지|해도\s*된|하지\s*않는|하지\s*않는\s*게|하지\s*마|보류)|구입\s*(?:권장|추천|비추천|권하지|권장하지|추천하지)|사(?:도|는)\s*(?:된|괜찮|좋|안\s*좋|말)|사지\s*마|안\s*사는\s*게|구매를\s*(?:말|피|보류)/i;

function stripListingPurchaseJudgment(text) {
  const source = String(text || '').replace(/\s+/g, ' ').trim();
  if (!source || !LISTING_PURCHASE_JUDGMENT_RE.test(source)) return source;
  const stripped = source
    .replace(
      /(?:따라서|결론적으로|종합하면|전체적으로)?\s*[^.。!?]*(?:구매|구입|사지|사는|사도)[^.。!?]*(?:권장|추천|비추천|권하지|권장하지|추천하지|해도\s*된|하지\s*않는|하지\s*마|보류|괜찮|좋겠다|말)[^.。!?]*(?:[.。!?]|$)/gi,
      ''
    )
    .replace(/\s+/g, ' ')
    .trim();
  return LISTING_PURCHASE_JUDGMENT_RE.test(stripped) ? '' : stripped;
}

function meaningfulListingTextAnalysis(analysis) {
  if (!analysis) return null;
  const redFlags = Array.isArray(analysis.redFlags)
    ? analysis.redFlags.map((x) => stripListingPurchaseJudgment(x)).filter(Boolean)
    : [];
  const bodyVerdict = stripListingPurchaseJudgment(analysis.bodyVerdict);
  const overall = stripListingPurchaseJudgment(analysis.overall);
  const sellerVerdict = isTrivialSellerVerdict(analysis.sellerVerdict)
    ? ''
    : stripListingPurchaseJudgment(analysis.sellerVerdict);
  const hasBodyJudgment =
    bodyVerdict.length >= 24 && /누락|부족|언급|대조|리스크|고질병|상태|구성|확인|애매|근거/.test(bodyVerdict);
  const hasFlagJudgment = redFlags.some((x) => x.length >= 8 && !/^판매자 지표/.test(x));
  if (!hasBodyJudgment && !hasFlagJudgment) return null;
  return {
    ...analysis,
    sellerVerdict,
    bodyVerdict,
    overall: overall || bodyVerdict || '판매글에서 확인해야 할 누락 정보가 있습니다.',
    redFlags,
  };
}

function productSummaryDescription(summary, item) {
  if (summary?.description) return summary.description;
  return '제품 상세 정보가 비어 있습니다. 제품 정리 다시 시도를 눌러 정보 조회를 다시 실행하세요.';
}

function productSummaryImage(summary, item) {
  return summary?.productImageUrl || '';
}

function displayImageUrl(src) {
  const raw = String(src || '').trim();
  if (!raw || raw.startsWith('/api/image-proxy')) return raw;
  if (/^https?:\/\//i.test(raw)) return `/api/image-proxy?url=${encodeURIComponent(raw)}`;
  return raw;
}

function imageUrlKey(src) {
  const raw = String(src || '').trim();
  if (!raw) return '';
  try {
    const u = new URL(raw, location.href);
    if (u.pathname === '/api/image-proxy') return u.searchParams.get('url') || u.href;
    return u.href;
  } catch {
    return raw;
  }
}

function uniqueImageList(urls) {
  const out = [];
  const seen = new Set();
  for (const raw of urls || []) {
    const url = displayImageUrl(raw);
    const key = imageUrlKey(url);
    if (!url || seen.has(key)) continue;
    seen.add(key);
    out.push(url);
  }
  return out;
}

function nextProductImageUrl(urls, current) {
  const list = uniqueImageList(urls);
  if (!list.length) return '';
  const currentKey = imageUrlKey(displayImageUrl(current));
  const idx = list.findIndex((url) => imageUrlKey(url) === currentKey);
  return list[idx >= 0 ? (idx + 1) % list.length : 0];
}

function splitSearchQueries(value) {
  if (Array.isArray(value)) {
    return splitSearchQueries(value.filter(Boolean).join('\n'));
  }
  const raw = String(value || '').trim();
  if (!raw) return [];
  const parts = raw
    .split(/\s*(?:[,，;；]|\s\/\s|\s\|\s|\n)\s*/g)
    .map((x) => x.replace(/^검색어\s*[:：]\s*/i, '').trim())
    .filter(Boolean);
  const out = [];
  const seen = new Set();
  for (const part of parts.length ? parts : [raw]) {
    const q = part.replace(/\s+/g, ' ').trim();
    const key = q.replace(/\s+/g, '').toLowerCase();
    if (!q || seen.has(key)) continue;
    seen.add(key);
    out.push(q);
    if (out.length >= 4) break;
  }
  return out;
}

function renderScrollableText(text, className, id, maxHeight) {
  const value = String(text || '').trim();
  if (!value) return '';
  return `<div class="scroll-text ${escapeAttr(className || '')}" id="${escapeAttr(id || '')}" data-scroll-max="${Number(maxHeight) || 0}" title="${escapeAttr(value)}">${escapeHtml(value)}</div>`;
}

function productSummaryQueries(summary, item) {
  const out = [];
  const seen = new Set();
  for (const query of [
    ...splitSearchQueries(summary?.searchQueries || summary?.searchQuery || ''),
    ...localStageThreeSearchQueries(item, summary),
  ]) {
    if (pushUniqueSearchQuery(out, seen, query) && out.length >= 4) break;
  }
  return out;
}

function danawaPriceUrl(summary) {
  const query = summary?.productName || summary?.searchQuery || '';
  if (!query) return '';
  return `https://search.danawa.com/dsearch.php?query=${encodeURIComponent(query)}`;
}

function productSummaryImages(summary, item) {
  return uniqueImageList([summary?.productImageUrl]).slice(0, 1);
}

function stepTwoProductName(item) {
  const state = getProductSummaryState(item);
  return state?.summary?.productName || fallbackSearchQuery(item) || '식별된 제품';
}

function renderStageTwoMini(title, desc, level = '') {
  const levelText = String(level || '').trim();
  const tone =
    title === '주의' ? 'alert' : title === '본문' ? 'body' : title === '판매자' ? 'seller' : 'neutral';
  const icons = {
    seller:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0H5Z"/></svg>',
    body:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l3 3v15H6V3Zm3 6h6V7H9v2Zm0 4h6v-2H9v2Zm0 4h4v-2H9v2Z"/></svg>',
    alert:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 22 20H2L12 3Zm-1 6v5h2V9h-2Zm0 7v2h2v-2h-2Z"/></svg>',
    neutral:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4V5Zm3 4h10V7H7v2Zm0 4h10v-2H7v2Zm0 4h6v-2H7v2Z"/></svg>',
  };
  return `
    <div class="stage-two-mini stage-two-mini--${escapeAttr(tone)}${levelText ? ` risk-${escapeAttr(levelText)}` : ''}">
      <div class="stage-two-mini-top">
        <b>${icons[tone] || icons.neutral}</b>
        <strong>${escapeHtml(title)}</strong>
      </div>
      <span>${escapeHtml(desc)}</span>
    </div>
  `;
}

function lightboxImageItems(urls) {
  return uniqueImageList(urls).map((src) => ({ src, kind: 'listing', comment: '', level: 'neutral' }));
}

function lightboxAnalysisItems(images) {
  return images
    .filter((image) => image.imageUrl)
    .map((image) => ({
      src: image.imageUrl,
      imageWidth: image.imageWidth,
      imageHeight: image.imageHeight,
      label: imageAnalysisLabel(image),
      kind: 'analysis',
      comment: image.comment || '',
      level: image.level || 'neutral',
      defects: Array.isArray(image.defects) ? image.defects : [],
    }));
}

function imageDebugDefectSummary(image) {
  const defects = Array.isArray(image?.defects) ? image.defects : [];
  if (!defects.length) return 'AI 선택 하자 칸: 없음';
  return defects
    .map((defect, idx) => {
      const center = String(
        defect?.gridCenter || defect?.centerCell || defect?.centerGrid || defect?.centerGridCell || defect?.gridCell || ''
      )
        .replace(/\s+/g, '')
        .trim()
        .toUpperCase();
      const size = defect?.gridSizeCells || defect?.gridSize || defect?.sizeCells || defect?.cellSize || {};
      const cols = Number(size.cols ?? size.columns ?? size.width ?? size.w);
      const rows = Number(size.rows ?? size.height ?? size.h);
      const sizeLabel =
        Number.isFinite(cols) || Number.isFinite(rows)
          ? `${Number.isFinite(cols) ? Math.round(cols) : '?'}×${Number.isFinite(rows) ? Math.round(rows) : '?'}칸`
          : '크기 미지정';
      const desc = String(defect?.description || defect?.detail || defect?.label || '하자 의심')
        .replace(/\s+/g, ' ')
        .trim();
      const reason = String(
        defect?.gridReason || defect?.coordinateReason || defect?.locationReason || defect?.reason || defect?.evidence || ''
      )
        .replace(/\s+/g, ' ')
        .trim();
      return `AI 선택 ${idx + 1}: ${center || '셀 미지정'} / ${sizeLabel} / ${desc}${reason ? ` / 근거: ${reason}` : ''}`;
    })
    .join('\n');
}

function gridDebugDefectToRect(defect, meta) {
  const gridCenter = defect?.gridCenter || defect?.centerCell || defect?.centerGrid || defect?.centerGridCell;
  const point = gridCellToPoint(gridCenter, meta?.gridCols, meta?.gridRows);
  if (!point) return null;
  const rawSize = defect?.gridSizeCells || defect?.gridSize || defect?.sizeCells || defect?.cellSize || {};
  const rawCols = Number(rawSize.cols ?? rawSize.columns ?? rawSize.width ?? rawSize.w);
  const rawRows = Number(rawSize.rows ?? rawSize.height ?? rawSize.h);
  const cellCols = Math.max(5, Math.min(point.cols, Math.round(Number.isFinite(rawCols) ? rawCols : Number.isFinite(rawRows) ? rawRows : 5)));
  const cellRows = Math.max(5, Math.min(point.rows, Math.round(Number.isFinite(rawRows) ? rawRows : rawCols || cellCols)));
  const boardWidth = Number(meta?.boardWidth) || 0;
  const boardHeight = Number(meta?.boardHeight) || 0;
  const imageX = Number(meta?.imageX) || 0;
  const imageY = Number(meta?.imageY) || 0;
  const imageWidth = Number(meta?.imageWidth) || 0;
  const imageHeight = Number(meta?.imageHeight) || 0;
  if (![boardWidth, boardHeight, imageWidth, imageHeight].every((n) => Number.isFinite(n) && n > 0)) return null;
  const blockW = (cellCols / point.cols) * imageWidth;
  const blockH = (cellRows / point.rows) * imageHeight;
  const centerXBoard = imageX + (point.centerX / 100) * imageWidth;
  const centerYBoard = imageY + (point.centerY / 100) * imageHeight;
  return {
    left: ((centerXBoard - blockW / 2) / boardWidth) * 100,
    top: ((centerYBoard - blockH / 2) / boardHeight) * 100,
    width: (blockW / boardWidth) * 100,
    height: (blockH / boardHeight) * 100,
  };
}

function gridDebugMarkerHtml(defect, meta, idx) {
  const rect = gridDebugDefectToRect(defect, meta);
  if (!rect) return '';
  const center = String(defect?.gridCenter || defect?.gridCell || '셀 미지정')
    .replace(/\s+/g, '')
    .trim()
    .toUpperCase();
  const size = defect?.gridSizeCells || defect?.gridSize || defect?.sizeCells || defect?.cellSize || {};
  const cols = Number(size.cols ?? size.columns ?? size.width ?? size.w);
  const rows = Number(size.rows ?? size.height ?? size.h);
  const sizeLabel = `${Number.isFinite(cols) ? Math.round(cols) : '?'}×${Number.isFinite(rows) ? Math.round(rows) : '?'}칸`;
  return `
    <span
      class="grid-debug-selection"
      style="left:${rect.left.toFixed(2)}%;top:${rect.top.toFixed(2)}%;width:${rect.width.toFixed(2)}%;height:${rect.height.toFixed(2)}%"
      aria-label="AI 선택 블럭 ${idx + 1}"
    >
      <b>${escapeHtml(center)}</b>
      <small>${escapeHtml(sizeLabel)}</small>
    </span>
  `;
}

function renderGridDebugSelectionMarkers(item) {
  const meta = item?.debugGridMeta || null;
  const defects = Array.isArray(item?.defects) ? item.defects : [];
  if (!meta || !defects.length) return '';
  const markers = defects
    .map((defect, idx) => gridDebugMarkerHtml(defect, meta, idx))
    .filter(Boolean)
    .join('');
  return markers ? `<div class="grid-debug-selections">${markers}</div>` : '';
}

function lightboxAnalysisGridItems(images) {
  return images
    .filter((image) => image.debugGridImageUrl)
    .map((image) => {
      const index = Number(image.index) || '?';
      return {
        src: image.debugGridImageUrl,
        imageWidth: image.imageWidth,
        imageHeight: image.imageHeight,
        label: `AI 전송 그리드 ${index}`.trim(),
        kind: 'gridDebug',
        comment: `${index}번 사진 · Gemini로 보낸 25×25 좌표 그리드 보드\n${imageDebugDefectSummary(image)}`,
        level: 'neutral',
        defects: Array.isArray(image.defects) ? image.defects : [],
        debugGridMeta: image.debugGridMeta || null,
      };
    });
}

function imageAnalysisLabel(image) {
  const explicit = String(image?.label || image?.role || image?.tag || '').replace(/\s+/g, ' ').trim();
  if (explicit) return explicit.slice(0, 14);
  const comment = String(image?.comment || '');
  const level = String(image?.level || 'neutral');
  if (level === 'risk') return '주의 사진';
  if (/구성품|박스|케이블|충전기|스트랩|부속|트레이|완충재|스티로폼|비닐|실물|직접 촬영|판매자.*사진/i.test(comment)) {
    return '구성품 확인';
  }
  if (
    /홍보|공식|쇼핑몰|스크랩|카탈로그|광고컷|렌더/i.test(comment) &&
    !/홍보용으로\s*보이지|홍보.*아니|스크랩.*아니|실물.*보이|직접.*찍|판매자.*촬영/i.test(comment)
  ) {
    return '홍보 이미지';
  }
  if (/실물.*확인|확인할 수 없|상태를 알 수 없/i.test(comment)) return '실물 확인 불가';
  if (/흠집|스크래치|찍힘|오염|마모|파손/i.test(comment)) return '흠집 확인';
  if (/작동|화면|전원|버튼|단자/i.test(comment)) return '작동 확인';
  if (/부족|안 보|확인 필요/i.test(comment)) return '부족한 사진';
  return level === 'safe' ? '상태 확인' : '사진 근거';
}

function renderStageTwoLoading(title, delay = 0, state = null) {
  return `
    <article class="mini-card stage-two-risk-card is-loading" style="--stage-delay:${delay}ms">
      <div class="summary-loading summary-loading--skeleton">
        <div class="ai-loading-copy">
          <p class="stage-two-card-label">AI 분석 중</p>
          <h3>${escapeHtml(title)}</h3>
          <p class="mini-muted">제품 정보를 기반으로 구매 전 확인할 리스크를 정리합니다.</p>
          ${renderAiLoadingProgress(state, 'productRisk')}
        </div>
        <div class="risk-loader">
          <span></span><span></span><span></span>
        </div>
      </div>
    </article>
  `;
}

function renderStageTwoLoadingCards(item) {
  const state = item ? productRiskAnalyses.get(summaryKey(item)) : null;
  return ['관련 이슈 검색 중', '고질병 검색 중']
    .map((title, idx) => renderStageTwoLoading(title, idx * 140, state))
    .join('');
}

function stageTwoIssueIcon(kind, item) {
  const text = `${kind || ''} ${item?.title || ''} ${item?.detail || item?.desc || ''}`.toLowerCase();
  const rules = [
    [/거래 전 확인|체크리스트|질문|요청|작동 확인|확대 사진|구성품 확인|보증 확인|락 해제|계정 해제/, 'checklist'],
    [/시장 변수|가격 상승|가격 하락|시세|중고가|램값|ram|메모리|ssd|부품가|단종|재고|후속작|환율|as 종료|소모품 가격/, 'query_stats'],
    [/배송 중 파손|택배 파손|운송.*파손|포장.*파손|파손.*배송|완충.*부족/, 'package_2'],
    [/결합부|결합 부위|체결|나사산|유격|헐거움|조립|마감|공차|틈새/, 'construction'],
    [/상태 주관|상태.*주관|상태 판단|판매자.*주관|표현.*주관|컨디션/, 'fact_check'],
    [/도색|이염|변색|물빠짐|색이.*묻|염색|코팅|칠 벗|페인트/, 'format_color_fill'],
    [/공정|제조 편차|품질 편차|마감 편차|qc|품질관리|검수/, 'precision_manufacturing'],
    [/파손|깨짐|금감|크랙|깨져|금이|균열|부러짐|찢어짐|찌그러짐/, 'broken_image'],
    [/찍힘|눌림|찌그러|덴트|찍힌|충격 흔적|낙하 흔적/, 'crisis_alert'],
    [/배송|택배|반값택배|편의점택배|퀵|거래장소|직거래/, 'local_shipping'],
    [/나의 찾기|find my|아이클라우드|icloud|계정.*잠금|활성화 잠금|액티베이션|락 걸|계정락/, 'lock'],
    [/계정|로그인|로그아웃|소유자|명의|본인 인증|인증 해제|초기화 불가/, 'account_circle'],
    [/도난|분실|습득|주운|블랙리스트|imei.*차단|통신사 차단/, 'gpp_bad'],
    [/정품|가품|짝퉁|레플리카|호환품|카피|시리얼|serial|일련번호/, 'verified_user'],
    [/보증|워런티|warranty|as\b|a\/s|리퍼|수리 이력|서비스센터/, 'workspace_premium'],
    [/영수증|구매내역|거래내역|증빙|구매 증명|인보이스/, 'receipt_long'],
    [/구성품|구성|박스|풀박|부속|부속품|누락|빠짐|미포함/, 'inventory_2'],
    [/케이블|충전선|라이트닝|usb|c타입|type-c|젠더|어댑터/, 'cable'],
    [/충전기|어댑터|전원 어댑터|고속충전기|맥세이프|magsafe/, 'power'],
    [/배터리.*효율|효율|성능 최대치|battery health|배터리 성능/, 'battery_5_bar'],
    [/배터리|battery|방전|광탈|발열.*배터리|배터리 팽창|스웰링/, 'battery_alert'],
    [/충전.*불량|충전 안|충전 느림|충전 단자|단자 접촉|포트 불량/, 'battery_charging_full'],
    [/전원.*불량|전원 안|부팅 안|꺼짐|재부팅|무한부팅|벽돌|먹통/, 'power_settings_new'],
    [/메인보드|보드|기판|로직보드|납땜|칩셋|cpu|gpu/, 'developer_board'],
    [/발열|과열|뜨거|열감|thermal|쿨링|팬소음|팬 소음/, 'device_thermostat'],
    [/침수|물먹|물에|방수|수분|습기|녹|부식|침수라벨/, 'water_drop'],
    [/액정|화면|디스플레이|display|스크린|패널|번인|잔상/, 'monitor'],
    [/스크래치|기스|흠집|까짐|도장|외관|생활기스|마모흔/, 'texture'],
    [/터치|터치불량|고스트터치|터치 씹|펜 터치|터치스크린/, 'touch_app'],
    [/밝기|밝음|어두움|백라이트|빛샘|멍|화이트스팟|불량화소/, 'brightness_medium'],
    [/색감|색상|누렇게|녹조|핑크|색 번짐|트루톤|true tone/, 'palette'],
    [/힌지|접힘|폴드|플립|경첩|접는|접힘 자국/, 'view_week'],
    [/카메라|렌즈|사진|초점|흔들림|손떨림|ois|플래시/, 'photo_camera'],
    [/전면카메라|셀카|페이스타임|facetime|셀피/, 'photo_camera_front'],
    [/후면카메라|메인카메라|망원|초광각|카툭튀/, 'photo_camera_back'],
    [/스피커|소리|음질|찢어짐|잡음|좌우 밸런스|스테레오/, 'speaker'],
    [/마이크|녹음|통화음|상대방.*안 들|음성 입력/, 'mic'],
    [/이어폰|헤드폰|헤드셋|이어팁|노캔|노이즈캔슬링|anc/, 'headphones'],
    [/블루투스|bluetooth|페어링|연결 끊|연결 불량|무선 연결/, 'bluetooth_disabled'],
    [/와이파이|wifi|wi-fi|무선랜|인터넷 연결|공유기/, 'wifi_off'],
    [/셀룰러|lte|5g|유심|sim|통신|안테나|수신/, 'signal_cellular_alt'],
    [/gps|위치|지도|네비|내비|위치 추적/, 'location_off'],
    [/nfc|교통카드|삼성페이|애플페이|결제|페이/, 'contactless'],
    [/버튼|전원버튼|볼륨버튼|홈버튼|스위치|버튼감/, 'radio_button_checked'],
    [/진동|햅틱|haptic|진동모터|탭틱|taptic/, 'vibration'],
    [/센서|감지|착용|근접센서|조도센서|자이로|가속도/, 'sensors'],
    [/지문|터치id|touch id|페이스id|face id|얼굴인식|생체인식/, 'fingerprint'],
    [/키보드|키감|키캡|키 씹|입력|자판|스위치/, 'keyboard'],
    [/트랙패드|터치패드|패드 클릭|커서|마우스패드/, 'touchpad_mouse'],
    [/마우스|휠|클릭|더블클릭|dpi|휠튐/, 'mouse'],
    [/펜슬|애플펜슬|s펜|스타일러스|펜촉|필압/, 'stylus_note'],
    [/저장공간|용량|스토리지|ssd|hdd|하드|메모리 부족/, 'storage'],
    [/램|ram|메모리|memory|16gb|32gb|8gb/, 'memory'],
    [/그래픽|그래픽카드|vga|gpu|화면 깨짐|드라이버/, 'memory_alt'],
    [/os|운영체제|업데이트|펌웨어|ios|android|윈도우|macos|버전/, 'system_update_alt'],
    [/앱|어플|프로그램|소프트웨어|오류|버그|튕김|크래시/, 'bug_report'],
    [/초기화|공장초기화|리셋|재설정|포맷|복원/, 'restart_alt'],
    [/데이터|백업|복구|삭제|개인정보|사진 남|계정 정보/, 'backup'],
    [/바이러스|악성코드|보안|해킹|탈옥|루팅|rooting|jailbreak/, 'security'],
    [/냄새|담배|향수|곰팡이|악취|연기/, 'air'],
    [/먼지|오염|때|찌든|청소|이물질|오염도/, 'cleaning_services'],
    [/생활방수|방진|방수등급|ip\d|방수 기능/, 'water_damage'],
    [/무게|크기|사이즈|휴대성|두께|무겁/, 'straighten'],
    [/호환|호환성|지원 안|미지원|규격|세대 차이/, 'extension_off'],
    [/모델명|세대|연식|출시일|구형|신형|버전 확인/, 'tag'],
    [/제조년|생산일|사용기간|사용감|연식|오래/, 'event'],
    [/수명|내구성|마모|노후|열화|소모품/, 'hourglass_bottom'],
    [/타이어|바퀴|휠|구동|모터|브레이크/, 'settings_input_component'],
    [/자동차|차량|엔진|미션|주행거리|사고이력/, 'directions_car'],
    [/자전거|전기자전거|브레이크|변속기|체인/, 'directions_bike'],
    [/킥보드|스쿠터|전동킥보드|전동/, 'electric_scooter'],
    [/게임|콘솔|패드|조이콘|스틱쏠림|쏠림/, 'sports_esports'],
    [/드리프트|스틱|조이스틱|아날로그|버튼 씹힘/, 'joystick'],
    [/프린터|잉크|토너|출력|스캔|복합기/, 'print'],
    [/모니터|주사율|hz|해상도|dp|hdmi/, 'desktop_windows'],
    [/tv|티비|텔레비전|리모컨|셋톱|화질/, 'live_tv'],
    [/냉장고|냉동|냉장|컴프레서|성에/, 'kitchen'],
    [/세탁기|건조기|탈수|배수|세제|드럼/, 'local_laundry_service'],
    [/청소기|흡입|필터|브러시|다이슨|먼지통/, 'vacuum'],
    [/에어컨|실외기|냉방|난방|히터|필터/, 'mode_fan'],
    [/가구|의자|책상|침대|소파|흔들림|찍힘/, 'chair'],
    [/의류|옷|사이즈|오염|보풀|늘어남/, 'checkroom'],
    [/신발|운동화|밑창|마모|사이즈|착화감/, 'footprint'],
    [/시계|워치|스트랩|밴드|시계줄|방수/, 'watch'],
    [/카드|결제|할부|계좌|입금|송금|환불/, 'payments'],
    [/사기|먹튀|입금유도|선입금|안전결제|피싱|가짜 안전결제/, 'report'],
    [/포장|완충|박스 포장|뽁뽁이|완충재/, 'package_2'],
    [/가격|시세|네고|협상|비싸|저렴|할인|가격대/, 'sell'],
    [/급처|급매|빨리|오늘만|예약금|찜|예약/, 'schedule'],
    [/판매자|상점|후기|평점|리뷰|매너|거래내역/, 'storefront'],
    [/사진|실사|실물|캡처|도용|이미지|인증샷|상세사진/, 'image_search'],
    [/본문|설명|정보 부족|상세 설명|기재|언급 없음/, 'article'],
    [/질문|확인|문의|물어|요청|추가 확인/, 'help'],
    [/위험|주의|리스크|문제|이슈|경고|의심/, 'error_outline'],
    [/고질|불량|결함|하자|공통 문제|종특|취약/, 'handyman'],
    [/상태 좋|양호|깨끗|정상|문제 없음|안전/, 'check_circle'],
    [/비교|대조|동일 모델|유사 매물|시세 비교/, 'compare_arrows'],
    [/검색|웹검색|커뮤니티|후기 검색|리서치/, 'manage_search'],
    [/설정|세팅|옵션|환경설정|초기 설정/, 'settings'],
    [/알림|소리 알림|진동 알림|푸시/, 'notifications'],
    [/잠금|비밀번호|암호|패스워드|pin|패턴/, 'password'],
    [/열쇠|키|리모컨키|스마트키|키 없음/, 'key'],
    [/케이스|커버|필름|보호필름|강화유리/, 'cases'],
    [/렌탈|약정|할부금|미납|소유권|대여/, 'contract'],
    [/교환|반품|환불|취소|거래 취소/, 'assignment_return'],
    [/충격|낙하|떨어뜨|충돌|찍힘|파손 이력/, 'crisis_alert'],
    [/소음|잡소리|소리남|삐걱|딸깍|웅웅/, 'hearing'],
    [/냉각|쿨러|팬|방열|써멀|서멀/, 'ac_unit'],
    [/조명|led|램프|불빛|백색|깜빡/, 'lightbulb'],
    [/리모컨|컨트롤러|조작|버튼 리모컨/, 'settings_remote'],
    [/배터리 교체|교체 이력|부품 교체|사설 수리/, 'build'],
    [/커넥터|단자|핀|접점|헐거움/, 'power_input'],
    [/프레임|테두리|모서리|바디|하우징/, 'crop_square'],
    [/냉납|단선|접촉불량|간헐적|끊김/, 'electrical_services'],
    [/업자|전문판매|되팔이|리셀러|대량판매/, 'badge'],
  ];
  const matched = rules.find(([pattern]) => pattern.test(text));
  if (matched) return matched[1];
  return kind === '고질병' ? 'handyman' : 'info';
}

function normalizeRiskSourceLinks(kind, item, productName = '') {
  const isYoutubeUrl = (url) => {
    try {
      const host = new URL(url).hostname.toLowerCase();
      return host.includes('youtube.com') || host.includes('youtu.be');
    } catch {
      return false;
    }
  };
  return (Array.isArray(item?.sources) ? item.sources : [])
    .map((source) => {
      const url = typeof source === 'string' ? source : source?.url;
      const label = typeof source === 'string' ? '' : source?.label || source?.title || '';
      const type = typeof source === 'string' ? '' : source?.type || '';
      if (!/^https?:\/\//i.test(String(url || ''))) return null;
      const youtube = isYoutubeUrl(String(url));
      const normalizedType = String(type || 'article').toLowerCase();
      if (youtube || normalizedType === 'video') return null;
      return {
        label: String(label || '근거 자료')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 46),
        url: String(url),
        type: normalizedType,
        generated: false,
      };
    })
    .filter(Boolean)
    .slice(0, 3);
}

function youtubeVideoMeta(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    let id = '';
    if (host.includes('youtu.be')) {
      id = u.pathname.split('/').filter(Boolean)[0] || '';
    } else if (host.includes('youtube.com') && u.pathname === '/watch') {
      id = u.searchParams.get('v') || '';
    } else if (host.includes('youtube.com')) {
      const parts = u.pathname.split('/').filter(Boolean);
      if ((parts[0] === 'shorts' || parts[0] === 'embed') && parts[1]) id = parts[1];
    }
    if (!id) return null;
    return {
      id,
      thumbnailUrl: `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`,
    };
  } catch {
    /* ignore invalid URLs */
  }
  return null;
}

const youtubePlayerRegistry = new Map();
let youtubeApiReadyPromise = null;

function ensureYoutubeIframeApi() {
  if (window.YT?.Player) return Promise.resolve();
  if (youtubeApiReadyPromise) return youtubeApiReadyPromise;
  youtubeApiReadyPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    document.head.appendChild(script);
  });
  return youtubeApiReadyPromise;
}

function youtubePlayerElementId(videoId, index) {
  return `yt-player-${String(videoId || 'video').replace(/[^a-zA-Z0-9_-]/g, '')}-${index}`;
}

function clearAllYoutubePlayers() {
  for (const [id, player] of youtubePlayerRegistry) {
    if (player?.destroy) {
      try {
        player.destroy();
      } catch {
        /* player may already be detached */
      }
    }
    youtubePlayerRegistry.delete(id);
  }
}

function destroyStageTwoYoutubePlayers(root) {
  const scope = root || document;
  scope.querySelectorAll('[data-youtube-player]').forEach((host, index) => {
    const id = host.id || youtubePlayerElementId(host.getAttribute('data-video-id'), index);
    const player = youtubePlayerRegistry.get(id);
    if (player?.destroy) {
      try {
        player.destroy();
      } catch {
        /* player may already be detached */
      }
    }
    youtubePlayerRegistry.delete(id);
    host.innerHTML = '';
  });
}

function syncStageTwoYoutubePlayers(root = $current) {
  if (!root) return;
  const card = root.querySelector('[data-stage-two-youtube]');
  if (!card?.querySelector('[data-youtube-player][data-video-id]')) return;
  void mountStageTwoYoutubePlayers(card);
}

async function mountStageTwoYoutubePlayers(root) {
  const scope = root || document;
  const hosts = [...scope.querySelectorAll('[data-youtube-player][data-video-id]')];
  if (!hosts.length) return;
  for (const [id, player] of youtubePlayerRegistry) {
    const host = document.getElementById(id);
    if (!host || !scope.contains(host)) {
      if (player?.destroy) {
        try {
          player.destroy();
        } catch {
          /* ignore stale player */
        }
      }
      youtubePlayerRegistry.delete(id);
    }
  }
  await ensureYoutubeIframeApi();
  hosts.forEach((host, index) => {
    if (!host.id) host.id = youtubePlayerElementId(host.getAttribute('data-video-id'), index);
    const existing = youtubePlayerRegistry.get(host.id);
    if (existing?.destroy) {
      try {
        existing.destroy();
      } catch {
        /* ignore stale player */
      }
      youtubePlayerRegistry.delete(host.id);
    }
    const videoId = String(host.getAttribute('data-video-id') || '').trim();
    const title = String(host.getAttribute('data-video-title') || 'YouTube 영상').trim();
    if (!videoId) return;
    const player = new YT.Player(host.id, {
      videoId,
      host: 'https://www.youtube-nocookie.com',
      playerVars: {
        rel: 0,
        playsinline: 1,
        enablejsapi: 1,
        origin: location.origin || 'http://127.0.0.1:3920',
        widget_referrer: location.href,
      },
      events: {
        onReady: (event) => {
          const iframe = event.target.getIframe?.();
          if (!iframe) return;
          iframe.setAttribute('title', title);
          iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
        },
      },
    });
    youtubePlayerRegistry.set(host.id, player);
  });
}

function renderStageTwoRiskSources(kind, item, productName = '') {
  return '';
}

function renderStageTwoRiskYoutube(item) {
  const video = item?.youtubeReference;
  const url = String(video?.url || '').trim();
  const meta = youtubeVideoMeta(url);
  if (!meta || !/^https?:\/\//i.test(url)) return '';
  const title = String(video?.label || video?.title || '관련 YouTube 영상').replace(/\s+/g, ' ').trim();
  return `
    <a class="stage-two-risk-youtube" href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">
      <span class="material-symbols-rounded" aria-hidden="true">play_circle</span>
      <span>${escapeHtml(title || '관련 YouTube 영상')}</span>
    </a>
  `;
}

function normalizeStageTwoYoutubeVideos(analysis) {
  const videos = (Array.isArray(analysis?.youtubeVideos) ? analysis.youtubeVideos : [])
    .map((video) => {
      const url = String(video?.url || '').trim();
      const meta = youtubeVideoMeta(url);
      if (!meta || !/^https?:\/\//i.test(url)) return null;
      return {
        id: meta.id,
        url,
        title: String(video?.title || '관련 YouTube 영상').replace(/\s+/g, ' ').trim().slice(0, 90),
        thumbnailUrl: String(video?.thumbnailUrl || meta.thumbnailUrl || '').trim(),
        summary: String(video?.summary || video?.buyerNote || video?.usedBuyerNote || '')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 180),
      };
    })
    .filter(Boolean)
    .slice(0, 3);
  const summaryCounts = videos.reduce((acc, video) => {
    const key = String(video.summary || '').replace(/\s+/g, ' ').trim().toLowerCase();
    if (key) acc.set(key, (acc.get(key) || 0) + 1);
    return acc;
  }, new Map());
  const forcedCommentRe =
    /확인해(?:야|보)|체크.*필요|상태를.*확인|구매.*전.*확인|관련.*살펴|참고.*하세요|도움이\s*될\s*수|신중히\s*확인/i;
  return videos.map((video) => {
    const summaryKey = String(video.summary || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const isDuplicate = summaryKey && summaryCounts.get(summaryKey) > 1;
    const isForced = forcedCommentRe.test(video.summary) && !/[0-9A-Za-z가-힣]{2,}.*(불량|결함|고장|배터리|발열|소음|번인|파손|수리|교체|단종|업데이트|호환|내구|충전|전원|화면)/i.test(video.summary);
    return {
      ...video,
      summary: isDuplicate || isForced ? '' : video.summary,
    };
  });
}

function renderStageTwoYoutubeCard(analysis) {
  const videos = normalizeStageTwoYoutubeVideos(analysis);
  if (!videos.length) return '';
  const items = videos
    .map(
      (video, index) => `
        <div class="stage-two-youtube-item">
          <div class="stage-two-youtube-embed">
            <div
              data-youtube-player
              data-video-id="${escapeAttr(video.id)}"
              data-video-title="${escapeAttr(video.title)}"
              id="${escapeAttr(youtubePlayerElementId(video.id, index))}"
              aria-label="${escapeAttr(video.title)}"
            ></div>
          </div>
          <span class="stage-two-youtube-title">${escapeHtml(video.title)}</span>
          ${
            video.summary
              ? `<div class="stage-two-youtube-insight">
                  <p>${escapeHtml(video.summary)}</p>
                </div>`
              : ''
          }
          <a class="stage-two-youtube-open" href="${escapeAttr(video.url)}" target="_blank" rel="noopener noreferrer">
            YouTube에서 열기
            <span class="material-symbols-rounded" aria-hidden="true">open_in_new</span>
          </a>
        </div>`
    )
    .join('');
  return `
    <article class="mini-card stage-two-card stage-two-youtube-card" data-stage-two-youtube style="--stage-delay:720ms">
      <div class="stage-two-card-head">
        <p class="stage-two-card-label">YouTube 참고 영상</p>
        <h3>관련 영상</h3>
      </div>
      <div class="stage-two-youtube-list">${items}</div>
    </article>
  `;
}

function renderStageTwoYoutubePanel(item, fallbackAnalysis = null) {
  const key = summaryKey(item);
  const state = key ? productRiskYoutubeAnalyses.get(key) : null;
  if (state?.status === 'loading') {
    return renderAnalysisLoadingCard(
      'YouTube 참고 영상',
      '구매 전에 참고할 만한 영상을 찾고 있습니다.',
      'stage-two-youtube-card',
      720,
      state,
      'productRiskYoutube'
    ).replace('<article ', '<article data-stage-two-youtube ');
  }
  if (state?.status === 'error') {
    return `
      <article class="mini-card stage-two-card stage-two-youtube-card stage-two-card--error" data-stage-two-youtube>
        <p class="stage-two-card-label">YouTube 참고 영상</p>
        <h3>영상 참고자료를 불러오지 못했습니다.</h3>
        <p>${escapeHtml(state.error || '나중에 다시 시도해 주세요.')}</p>
      </article>
    `;
  }
  if (state?.status === 'done') {
    return renderStageTwoYoutubeCard(state.analysis || {});
  }
  return fallbackAnalysis?.youtubeVideos?.length ? renderStageTwoYoutubeCard(fallbackAnalysis) : '';
}

function renderStageTwoRiskCard(kind, item, delay = 0, productName = '') {
  const level = String(item?.level || 'caution').trim();
  const icon = stageTwoIssueIcon(kind, item);
  return `
    <article class="mini-card stage-two-risk-card risk-${escapeAttr(level)}" style="--stage-delay:${delay}ms">
      <div class="stage-two-risk-card__body">
        <p class="stage-two-card-label">${escapeHtml(kind)}</p>
        <h3>${escapeHtml(item?.title || '확인 필요')}</h3>
        <p>${escapeHtml(item?.detail || item?.desc || '구매 전 추가 확인이 필요합니다.')}</p>
        ${renderStageTwoRiskSources(kind, item, productName)}
        ${renderStageTwoRiskYoutube(item)}
      </div>
      <span class="material-symbols-rounded stage-two-risk-card__icon" aria-hidden="true">${escapeHtml(icon)}</span>
    </article>
  `;
}

function renderStageTwoRiskCards(analysis, item) {
  const related = Array.isArray(analysis?.relatedIssues) ? analysis.relatedIssues : [];
  const defects = Array.isArray(analysis?.chronicDefects) ? analysis.chronicDefects : [];
  const marketFactors = Array.isArray(analysis?.marketFactors) ? analysis.marketFactors : [];
  const verdict = String(analysis?.verdict || '').trim();
  const productName = getProductSummaryState(item)?.summary?.productName || fallbackSearchQuery(item);
  const cards = [
    ...related.slice(0, 3).map((riskItem, idx) => renderStageTwoRiskCard('관련 이슈', riskItem, idx * 130, productName)),
    ...defects.slice(0, 3).map((item, idx) =>
      renderStageTwoRiskCard('고질병', item, (related.length + idx) * 130, productName)
    ),
    ...marketFactors.slice(0, 1).map((item, idx) =>
      renderStageTwoRiskCard('시장 변수', item, (related.length + defects.length + idx) * 130, productName)
    ),
  ];
  if (cards.length) return cards.join('');
  return `
    <article class="mini-card stage-two-card stage-two-card--empty">
      <p class="stage-two-card-label">검색 결과 부족</p>
      <h3>제품 이슈·고질병</h3>
      <p>웹 검색에서 뚜렷한 항목을 찾지 못했습니다. 다시 분석하거나 다른 검색·커뮤니티에서 직접 확인해 주세요.</p>
      ${verdict ? `<p class="stage-two-verdict">${escapeHtml(verdict)}</p>` : ''}
    </article>
  `;
}

function renderAnalysisLoadingCard(title, desc, className = '', delay = 0, state = null, kind = 'listingText') {
  return `
    <article class="mini-card stage-two-card is-loading ${escapeAttr(className)}" style="--stage-delay:${delay}ms">
      <div class="summary-loading summary-loading--skeleton">
        <div class="ai-loading-copy">
          <p class="stage-two-card-label">AI 분석 중</p>
          <h3>${escapeHtml(title)}</h3>
          <p class="mini-muted">${escapeHtml(desc)}</p>
          ${renderAiLoadingProgress(state, kind)}
        </div>
        <div class="risk-loader">
          <span></span><span></span><span></span>
        </div>
      </div>
    </article>
  `;
}

function renderListingTextAnalysisCard(item) {
  const key = summaryKey(item);
  const state = key ? listingTextAnalyses.get(key) : null;
  if (state?.status === 'loading') {
    return renderAnalysisLoadingCard(
      '판매자·본문 분석',
      '판매자 지표와 본문에서 상태·구성품·거래조건 누락을 확인합니다.',
      'stage-two-card--listing-text',
      520,
      state,
      'listingText'
    ).replace('<article ', '<article data-listing-text-analysis ');
  }
  if (state?.status !== 'done' || state.source !== 'ai') return '';
  const analysis = meaningfulListingTextAnalysis(state?.analysis);
  if (!analysis) return '';
  const redFlags = Array.isArray(analysis.redFlags) ? analysis.redFlags : [];
  const sellerVerdict = String(analysis.sellerVerdict || '').trim();
  const bodyVerdict =
    String(analysis.bodyVerdict || '').trim() ||
    '판매글 본문 기준으로 상태·구성품·거래조건을 추가 확인하세요.';
  const overall = String(analysis.overall || '').trim() || '판매글 확인 포인트';
  return `
    <article class="mini-card stage-two-card stage-two-card--listing-text" data-listing-text-analysis style="--stage-delay:520ms">
      <div class="stage-two-card-head">
        <p class="stage-two-card-label">판매자·본문 분석</p>
        <h3>${escapeHtml(overall)}</h3>
      </div>
      <div class="stage-two-mini-list">
        ${sellerVerdict ? renderStageTwoMini('판매자', sellerVerdict, 'neutral') : ''}
        ${renderStageTwoMini('본문', bodyVerdict, 'neutral')}
        ${redFlags.length ? renderStageTwoMini('주의', redFlags.join(' · '), 'caution') : ''}
      </div>
    </article>
  `;
}

function renderListingImageAnalysisCard(item) {
  const key = summaryKey(item);
  const state = key ? listingImageAnalyses.get(key) : null;
  if (state?.status === 'loading') {
    return renderAnalysisLoadingCard(
      '판매자 이미지 분석',
      '매물 사진별 하자·구성품·상태를 확인합니다.',
      'stage-two-card--image-analysis',
      250,
      state,
      'listingImage'
    ).replace('<article ', '<article data-listing-image-analysis ');
  }
  if (state?.status === 'error') {
    return `
      <article class="mini-card stage-two-card stage-two-card--error stage-two-card--image-analysis" data-listing-image-analysis>
        <p class="stage-two-card-label">AI 분석 실패</p>
        <h3>판매자 이미지 분석</h3>
        <p>${escapeHtml(state.error || '사진 분석을 불러오지 못했습니다.')}</p>
      </article>
    `;
  }
  const analysis = state?.analysis;
  if (!analysis) return '';
  return `
    <article class="mini-card stage-two-card stage-two-card--image-analysis" data-listing-image-analysis style="--stage-delay:680ms">
      <div class="stage-two-card-head">
        <p class="stage-two-card-label">판매자 이미지 분석</p>
        <h3>${escapeHtml(analysis.overall || '사진별 상태 코멘트')}</h3>
      </div>
      ${renderImageAnalysisSlider(item)}
    </article>
  `;
}

function renderListingImageGroupsCard(item) {
  const key = summaryKey(item);
  const state = key ? listingImageAnalyses.get(key) : null;
  if (state?.status !== 'done' || !state?.analysis) return '';
  const groupsHtml = renderImageAnalysisGroups(item);
  if (!groupsHtml) return '';
  return `
    <article class="mini-card stage-two-card stage-two-card--image-groups" data-listing-image-groups style="--stage-delay:760ms">
      <div class="stage-two-card-head">
        <p class="stage-two-card-label">판매자 이미지 분류</p>
        <h3>이미지 분류</h3>
      </div>
      ${groupsHtml}
    </article>
  `;
}

function accessoryStatusLabel(entry) {
  const kind = typeof entry === 'string' ? '' : accessoryStatusKind(entry);
  const evidence = typeof entry === 'string' ? '' : accessoryEvidenceText(entry);
  if (kind === 'missing') return '없음';
  if (kind === 'confirmed') {
    if (/(사진|이미지)\S{0,20}(?:보임|보입니다|확인|식별)/i.test(evidence)) return '사진 확인';
    if (/(본문|판매글|글|설명)\S{0,20}(?:포함|있음|있습니다|있다고|명시|언급|기재|구성)/i.test(evidence)) return '본문 확인';
    return '확인됨';
  }
  return '확인 필요';
}

function accessoryStatusLevel(entry) {
  const kind = typeof entry === 'string' ? '' : accessoryStatusKind(entry);
  if (kind === 'missing') return 'risk';
  if (kind === 'confirmed') return 'safe';
  return 'caution';
}

function accessoryEvidenceText(entry) {
  return `${entry?.name || ''} ${entry?.status || ''} ${entry?.evidence || ''} ${entry?.question || ''}`
    .replace(/\s+/g, ' ')
    .trim();
}

function accessoryEvidenceSaysMissing(entry) {
  const evidence = accessoryEvidenceText(entry);
  const onlyVisibilityMissing = /(언급|확인|보이|보임|식별|사진|이미지)\S{0,14}(?:없|않|어렵|불가|안\s*됨|되지)/i.test(evidence);
  const explicitMissing =
    /(?:미포함|불포함|제외|별도\s*구매|구성품\s*아님|포함\s*(?:안|되지\s*않)|없다고|없습니다|없음|없는\s*(?:상태|구성|것)|없다(?:고)?)/i.test(evidence) ||
    /(?:판매자|판매글|본문|글|설명|매물)\S{0,35}(?:없다고|없습니다|없음|없다|미포함|불포함|제외|별도\s*구매)/i.test(evidence);
  return explicitMissing && !onlyVisibilityMissing;
}

function accessoryEvidenceSaysIncluded(entry) {
  const status = String(entry?.status || '').trim();
  const evidence = accessoryEvidenceText(entry);
  if (status === 'confirmed' || status === 'body_only') return true;
  if (/본체|기기\s*본체|노트북\s*본체|제품\s*본체|device|unit/i.test(String(entry?.name || ''))) return true;
  return (
    /(사진|이미지)\S{0,25}(?:보임|보입니다|확인|식별|나옴|나옵니다)/i.test(evidence) ||
    /(본문|판매글|글|설명|매물)\S{0,35}(?:포함|있음|있습니다|있다고|동봉|구성|명시|언급|기재|풀박스)/i.test(evidence) ||
    /(?:포함|있음|있습니다|있다고|동봉|구성|명시|언급|기재|풀박스)\S{0,35}(?:본문|판매글|글|설명|매물|사진|이미지)/i.test(evidence)
  );
}

function accessoryStatusKind(entry) {
  if (accessoryEvidenceSaysMissing(entry)) return 'missing';
  if (accessoryEvidenceSaysIncluded(entry)) return 'confirmed';
  return 'unknown';
}

function accessoryStatusIcon(entry) {
  const kind = accessoryStatusKind(entry);
  const icon = kind === 'confirmed' ? 'check' : kind === 'missing' ? 'close' : 'warning';
  const label = kind === 'confirmed' ? '확인됨' : kind === 'missing' ? '없음/누락 의심' : '확인 필요';
  return `
    <span class="accessory-status accessory-status--${escapeAttr(kind)}" title="${escapeAttr(label)}" aria-label="${escapeAttr(label)}">
      <span class="material-symbols-rounded" aria-hidden="true">${icon}</span>
    </span>
  `;
}

function accessoryItemIconName(name) {
  const value = String(name || '').toLowerCase();
  if (/충전|어댑터|전원|파워|charger|adapter|power/.test(value)) return 'power';
  if (/케이블|선\b|usb|hdmi|젠더|동글|어댑터|cable|dongle/.test(value)) return 'cable';
  if (/박스|상자|패키지|케이스|파우치|box|case|pouch/.test(value)) return 'inventory_2';
  if (/보증|영수증|구매내역|구매\s*내역|증빙|receipt|warranty/.test(value)) return 'receipt_long';
  if (/설명서|매뉴얼|가이드|안내서|manual|guide/.test(value)) return 'menu_book';
  if (/펜|스타일러스|s펜|애플펜슬|pencil|stylus|pen/.test(value)) return 'stylus';
  if (/리모컨|컨트롤러|패드|조이콘|remote|controller|joy/.test(value)) return 'sports_esports';
  if (/배터리|건전지|battery/.test(value)) return 'battery_full';
  if (/스트랩|밴드|끈|strap|band/.test(value)) return 'watch';
  if (/스탠드|거치대|독\b|dock|stand/.test(value)) return 'view_in_ar';
  if (/본체|기기|제품|device|unit/.test(value)) return 'devices';
  return 'category';
}

function renderAccessoryMini(entry) {
  const statusText = accessoryStatusLabel(entry);
  const evidence = String(entry.evidence || '').trim();
  return `
    <div class="stage-two-mini accessory-mini risk-${escapeAttr(accessoryStatusLevel(entry))}">
      <div class="stage-two-mini-top accessory-mini__head">
        <b><span class="material-symbols-rounded" aria-hidden="true">${escapeHtml(accessoryItemIconName(entry.name))}</span></b>
        <strong>${escapeHtml(entry.name)}</strong>
      </div>
      <span>${escapeHtml([statusText, evidence].filter(Boolean).join(' · '))}</span>
      ${accessoryStatusIcon(entry)}
    </div>
  `;
}

function renderAccessoryCheckCard(item) {
  const key = summaryKey(item);
  const state = key ? accessoryChecks.get(key) : null;
  if (state?.status === 'loading') {
    return renderAnalysisLoadingCard(
      '구성품 체크',
      '제품 기본 구성품을 조사한 뒤 본문·사진과 대조합니다.',
      'stage-two-card--accessory-check',
      840,
      state,
      'accessoryCheck'
    ).replace('<article ', '<article data-accessory-check ');
  }
  if (state?.status === 'error') {
    return `
      <article class="mini-card stage-two-card stage-two-card--error stage-two-card--accessory-check" data-accessory-check>
        <p class="stage-two-card-label">AI 분석 실패</p>
        <h3>구성품 체크</h3>
        <p>${escapeHtml(state.error || '구성품 체크를 불러오지 못했습니다.')}</p>
      </article>
    `;
  }
  const analysis = state?.analysis;
  if (!analysis || state?.status !== 'done') return '';
  const items = (Array.isArray(analysis.items) ? analysis.items : [])
    .filter((entry) => entry?.name && entry.status !== 'not_applicable')
    .slice(0, 6);
  if (!items.length && !analysis.summary) return '';
  const summary =
    String(analysis.summary || '').trim() ||
    '기본 구성품 대비 본문·사진에서 확인되지 않은 항목이 있습니다.';
  const overallLevel = String(analysis.overallLevel || 'caution');
  return `
    <article class="mini-card stage-two-card stage-two-card--accessory-check" data-accessory-check style="--stage-delay:840ms">
      <div class="stage-two-card-head">
        <p class="stage-two-card-label">구성품 체크</p>
        <h3>${escapeHtml(summary)}</h3>
      </div>
      <div class="stage-two-mini-list">
        ${items
          .map((entry) => renderAccessoryMini(entry))
          .join('')}
        ${overallLevel === 'risk' ? renderStageTwoMini('주의', '거래 전 구성품 사진·포함 여부를 꼭 확인하세요.', 'risk') : ''}
      </div>
    </article>
  `;
}

function directAiStepLabel(item) {
  if (!item) return '매물 대기';
  if (isStepFourDone(item)) return 'Step 4 최종 판단까지 반영';
  if (isStepThreeDone(item)) return 'Step 3 가격 참고자료까지 반영';
  if (isStepTwoDone(item)) return 'Step 2 리스크 판별까지 반영';
  if (isStepOneDone(item)) return 'Step 1 매물 정리까지 반영';
  return 'Step 1 매물 기본 정보만 반영';
}

function directAiStatusText(item = currentRenderedItem()) {
  return `${directAiStepLabel(item)} 상태입니다. 생소한 키워드를 누르거나 직접 질문해보세요.`;
}

function invalidatePurchaseReceiptCaches(item) {
  const key = summaryKey(item);
  if (!key) return;
  for (const cacheKey of [...purchaseReceipts.keys()]) {
    if (listingKeyFromStageCacheKey(cacheKey) === key || cacheKey.startsWith(`${key}::`)) {
      purchaseReceipts.delete(cacheKey);
      purchaseReceiptPrintedKeys.delete(cacheKey);
    }
  }
  clearPurchaseReceiptPrintedForListing(key);
}

function invalidateStepThreeCaches(item, { guide = true, comparison = true, receipt = true } = {}) {
  const key = summaryKey(item);
  if (!key) return;
  for (const filterKey of [...comparisonFilters.keys()]) {
    if (!filterKey.startsWith(`${key}::`)) continue;
    if (comparison) comparisonFilters.delete(filterKey);
    if (guide) {
      usedPriceGuides.delete(filterKey);
      usedPriceGuideProgresses.delete(key);
    }
    if (receipt) {
      purchaseReceipts.delete(filterKey);
      purchaseReceiptPrintedKeys.delete(filterKey);
    }
  }
  if (receipt) clearPurchaseReceiptPrintedForListing(key);
  searchQueryRegenerations.delete(key);
  stageThreeComparisonSkippedKeys.delete(key);
}

function invalidateStepTwoCaches(key) {
  if (!key) return;
  productRiskAnalyses.delete(key);
  productRiskYoutubeAnalyses.delete(key);
  listingTextAnalyses.delete(key);
  listingImageAnalyses.delete(key);
  accessoryChecks.delete(key);
  stageTwoCompletedKeys.delete(key);
}

function resetDownstreamStageActivation(key, item) {
  if (!key) return;
  stageTwoActiveKeys.delete(key);
  stageThreeActiveKeys.delete(key);
  relatedRequestedKeys.delete(key);
  stageThreeIsolatedRefreshKeys.delete(key);
  if (item && selectedKey === key) {
    comps = null;
    lastStageThreeCompsRenderKey = '';
  }
}

function invalidateAnalysisPart(item, target) {
  const key = summaryKey(item);
  if (!key) return;
  switch (target) {
    case 'productSummary':
      productSummaries.delete(key);
      productImageSearches.delete(key);
      invalidateStepTwoCaches(key);
      invalidateStepThreeCaches(item);
      resetDownstreamStageActivation(key, item);
      break;
    case 'productRisk':
      productRiskAnalyses.delete(key);
      productRiskYoutubeAnalyses.delete(key);
      accessoryChecks.delete(key);
      invalidatePurchaseReceiptCaches(item);
      break;
    case 'productRiskYoutube':
      productRiskYoutubeAnalyses.delete(key);
      break;
    case 'listingText':
      listingTextAnalyses.delete(key);
      accessoryChecks.delete(key);
      invalidatePurchaseReceiptCaches(item);
      break;
    case 'listingImage':
      listingImageAnalyses.delete(key);
      accessoryChecks.delete(key);
      imageAnalysisPreviewedKeys.delete(key);
      invalidatePurchaseReceiptCaches(item);
      break;
    case 'accessoryCheck':
      accessoryChecks.delete(key);
      invalidatePurchaseReceiptCaches(item);
      break;
    case 'searchQuery':
      searchQueryRegenerations.delete(key);
      break;
    case 'usedPriceGuide':
      invalidateStepThreeCaches(item, { guide: true, comparison: false, receipt: true });
      break;
    case 'purchaseReceipt':
      invalidatePurchaseReceiptCaches(item);
      break;
    default:
      break;
  }
  persistAiCaches();
}

function isDirectAiPartLoading(item, target) {
  const key = summaryKey(item);
  if (!key) return false;
  switch (target) {
    case 'productSummary':
      return productSummaries.get(key)?.status === 'loading';
    case 'productRisk':
      return productRiskAnalyses.get(key)?.status === 'loading';
    case 'productRiskYoutube':
      return productRiskYoutubeAnalyses.get(key)?.status === 'loading';
    case 'listingText':
      return listingTextAnalyses.get(key)?.status === 'loading';
    case 'listingImage':
      return listingImageAnalyses.get(key)?.status === 'loading';
    case 'accessoryCheck':
      return accessoryChecks.get(key)?.status === 'loading';
    case 'searchQuery':
      return searchQueryRegenerations.get(key)?.status === 'loading';
    case 'usedPriceGuide': {
      const stageComps = effectiveStageThreeComps(item);
      const guideKey = stageComps ? usedPriceGuideKey(item, stageComps) : '';
      return guideKey ? usedPriceGuides.get(guideKey)?.status === 'loading' : false;
    }
    case 'purchaseReceipt': {
      const stageComps = effectiveStageThreeComps(item);
      const receiptKey = stageComps ? purchaseReceiptKey(item, stageComps) : '';
      return receiptKey ? purchaseReceipts.get(receiptKey)?.status === 'loading' : false;
    }
    case 'comparisonSearch':
      return comps?.status === 'collecting';
    default:
      return false;
  }
}

function directAiEarlierStageBlock(item, requiredStep) {
  const key = summaryKey(item);
  if (!key) return '먼저 분석할 매물을 불러와 주세요.';
  if (requiredStep >= 2 && !isStepOneDone(item)) {
    return productSummaries.get(key)?.status === 'loading'
      ? 'Step 1 매물 정리가 진행 중입니다. 이 단계가 마무리된 뒤 다시 실행할 수 있습니다.'
      : 'Step 1 매물 정리가 끝난 뒤 실행할 수 있습니다.';
  }
  if (requiredStep === 2 && isStepOneDone(item) && !isStepTwoStarted(item)) {
    return '지금은 Step 2 리스크 판별 시작 전입니다. 먼저 화면의 다음 단계 대기 카드에서 Step 2로 넘어가야 실행할 수 있습니다.';
  }
  if (requiredStep >= 3 && !isStepTwoDone(item)) {
    if (isStepOneDone(item) && !isStepTwoStarted(item)) {
      return '지금은 Step 2 리스크 판별 시작 전입니다. 먼저 화면의 다음 단계 대기 카드에서 Step 2로 넘어가야 실행할 수 있습니다.';
    }
    const loading =
      productRiskAnalyses.get(key)?.status === 'loading' ||
      productRiskYoutubeAnalyses.get(key)?.status === 'loading' ||
      listingTextAnalyses.get(key)?.status === 'loading' ||
      listingImageAnalyses.get(key)?.status === 'loading' ||
      accessoryChecks.get(key)?.status === 'loading';
    return loading
      ? 'Step 2 리스크 판별이 진행 중입니다. 이전 단계가 마무리된 뒤 다시 실행할 수 있습니다.'
      : 'Step 2 리스크 판별이 끝난 뒤 실행할 수 있습니다.';
  }
  if (requiredStep === 3 && isStepTwoDone(item) && !isStepThreeUnlocked(item)) {
    return '지금은 Step 3 가격 참고 시작 전입니다. 먼저 화면의 다음 단계 대기 카드에서 Step 3로 넘어가야 실행할 수 있습니다.';
  }
  if (requiredStep >= 4 && !isStepThreeDone(item)) {
    if (isStepTwoDone(item) && !isStepThreeUnlocked(item)) {
      return '지금은 Step 3 가격 참고 시작 전입니다. 먼저 화면의 다음 단계 대기 카드에서 Step 3로 넘어가야 실행할 수 있습니다.';
    }
    const stageComps = effectiveStageThreeComps(item);
    const guideKey = stageComps ? usedPriceGuideKey(item, stageComps) : '';
    const loading =
      comps?.status === 'collecting' ||
      searchQueryRegenerations.get(key)?.status === 'loading' ||
      comparisonFilters.get(guideKey)?.status === 'loading' ||
      usedPriceGuides.get(guideKey)?.status === 'loading';
    return loading
      ? 'Step 3 가격 참고자료가 진행 중입니다. 이전 단계가 마무리된 뒤 최종 판단을 다시 만들 수 있습니다.'
      : 'Step 3 가격 참고자료가 끝난 뒤 최종 판단을 다시 만들 수 있습니다.';
  }
  if (requiredStep === 4 && isStepThreeDone(item) && !isStepFourDone(item) && !isDirectAiPartLoading(item, 'purchaseReceipt')) {
    return '지금은 Step 4 최종 판단 영수증 시작 전입니다. 먼저 화면의 다음 단계 대기 카드에서 Step 4로 넘어가야 실행할 수 있습니다.';
  }
  return '';
}

function extractSupportedListingUrlFromText(text) {
  const matches = String(text || '').match(/https?:\/\/[^\s"'<>]+/gi) || [];
  for (const raw of matches) {
    const clean = raw.replace(/[)\].,，。]+$/g, '');
    const url = supportedListingUrl(clean);
    if (url) return url;
  }
  return '';
}

function listingPageUrl(item) {
  const candidates = [item?.pageUrl, item?.url, item?.listingUrl, item?.sourceUrl, item?.originalUrl];
  for (const value of candidates) {
    const url = supportedListingUrl(value);
    if (url) return url;
  }
  return '';
}

function openDirectAiMarket(url, label) {
  window.open(url, '_blank', 'noopener,noreferrer');
  return `${label} 열기를 요청했습니다. 새 탭이 보이지 않으면 브라우저 팝업 허용 상태를 확인해 주세요.`;
}

function directAiPdfCompletionWarning(item) {
  if (!item) return '';
  if (isStepFourDone(item)) return '';
  const key = summaryKey(item);
  const stageComps = effectiveStageThreeComps(item, comps);
  const stageThreeKey = stageComps ? comparisonFilterKey(item, stageComps) : '';
  const comparisonState = stageThreeKey ? comparisonFilters.get(stageThreeKey) : null;
  const guideState = stageThreeKey ? usedPriceGuides.get(stageThreeKey) : null;
  const stepThreeComplete =
    isStepThreeDone(item) &&
    stageThreeActiveKeys.has(key) &&
    isStageThreeCacheSettled(comparisonState?.status) &&
    isStageThreeCacheSettled(guideState?.status);
  const pending = [];
  if (!isStepTwoDone(item)) pending.push('Step 2 리스크 판별');
  if (!stepThreeComplete) pending.push('Step 3 가격 참고자료');
  if (!isStepFourDone(item)) pending.push('Step 4 최종 판단 영수증');
  if (!pending.length) return '';
  const detail = [
    !isStepTwoDone(item) ? '하자·본문·이미지 분석' : '',
    !stepThreeComplete ? '비교 매물·시세' : '',
    !isStepFourDone(item) ? '최종 구매 판단' : '',
  ].filter(Boolean);
  return `아직 ${pending.join(', ')}이 마무리되지 않았습니다. PDF 저장은 진행하지만, ${detail.join(', ')} 내용이 미완성으로 들어갈 수 있습니다.`;
}

function startStageTwoFromAssistant(item) {
  const key = summaryKey(item);
  if (!key) return '먼저 분석할 매물을 불러와 주세요.';
  startStageTwo(item, key);
  return 'Step 2 리스크 판별을 시작했습니다.';
}

function startStageThreeFromAssistant(item) {
  const key = summaryKey(item);
  if (!key) return '먼저 분석할 매물을 불러와 주세요.';
  startStageThree(item, null, key);
  return 'Step 3 가격 참고자료 수집을 시작했습니다.';
}

function startStageFourFromAssistant(item) {
  void ensurePurchaseReceipt(item);
  return 'Step 4 최종 판단 영수증 생성을 시작했습니다.';
}

async function startRequestedStageFromAssistant(item, stage) {
  if (!item) return { message: '먼저 분석할 매물을 불러와 주세요.' };
  const targetStage =
    stage ||
    (!isStepOneDone(item) ? 1 : !isStepTwoStarted(item) ? 2 : !isStepThreeUnlocked(item) ? 3 : !isStepFourDone(item) ? 4 : 0);
  if (targetStage === 1) return { message: 'Step 1 매물 정리는 이미 자동으로 진행됩니다. 잠시만 기다려 주세요.' };
  if (targetStage === 2) {
    const block = directAiEarlierStageBlock(item, 2);
    if (block && !block.includes('Step 2 리스크 판별 시작 전')) return { message: block };
    return { message: startStageTwoFromAssistant(item) };
  }
  if (targetStage === 3) {
    const block = directAiEarlierStageBlock(item, 3);
    if (block && !block.includes('Step 3 가격 참고 시작 전')) return { message: block };
    return { message: startStageThreeFromAssistant(item) };
  }
  if (targetStage === 4) {
    const block = directAiEarlierStageBlock(item, 4);
    if (block && !block.includes('Step 4 최종 판단 영수증 시작 전')) return { message: block };
    return { message: startStageFourFromAssistant(item) };
  }
  return { message: '이미 Step 4 최종 판단까지 완료된 상태입니다.' };
}

const DIRECT_AI_ACTIONS = [
  {
    id: 'regen.productSummary',
    label: '매물 정리 다시 생성',
    risk: 'safe',
    chipLabel: '매물 정리 다시',
    aliases: ['매물 정리', '제품 정리', 'step1', 'step 1'],
    preconditions(item) {
      if (!item) return { ok: false, message: '먼저 분석할 매물을 불러와 주세요.' };
      if (isDirectAiPartLoading(item, 'productSummary')) return { ok: false, message: '매물 정리가 이미 생성 중입니다.' };
      return { ok: true };
    },
    async run(item) {
      cancelActiveAiWork();
      invalidateAnalysisPart(item, 'productSummary');
      if (selectedKey === summaryKey(item)) refreshProductSummaryBlock(item);
      await ensureProductSummary(item);
      refreshDirectAiPanelIfOpen();
      return { message: 'Step 1 매물 정리를 다시 생성합니다.' };
    },
  },
  {
    id: 'stage.next',
    label: '다음 단계 실행',
    risk: 'safe',
    chipLabel: '다음 단계 실행',
    aliases: ['다음 단계', '다음단계', '다음 스텝', '다음step'],
    preconditions(item) {
      if (!item) return { ok: false, message: '먼저 분석할 매물을 불러와 주세요.' };
      return { ok: true };
    },
    async run(item) {
      return startRequestedStageFromAssistant(item, 0);
    },
  },
  {
    id: 'stage.step2',
    label: 'Step 2 실행',
    risk: 'safe',
    chipLabel: 'Step 2 실행',
    aliases: ['step2', 'step 2', '2단계', '스텝2', '리스크 판별 실행'],
    preconditions(item) {
      if (!item) return { ok: false, message: '먼저 분석할 매물을 불러와 주세요.' };
      return { ok: true };
    },
    async run(item) {
      return startRequestedStageFromAssistant(item, 2);
    },
  },
  {
    id: 'stage.step3',
    label: 'Step 3 실행',
    risk: 'safe',
    chipLabel: 'Step 3 실행',
    aliases: ['step3', 'step 3', '3단계', '스텝3', '가격 참고 실행'],
    preconditions(item) {
      if (!item) return { ok: false, message: '먼저 분석할 매물을 불러와 주세요.' };
      return { ok: true };
    },
    async run(item) {
      return startRequestedStageFromAssistant(item, 3);
    },
  },
  {
    id: 'stage.step4',
    label: 'Step 4 실행',
    risk: 'safe',
    chipLabel: 'Step 4 실행',
    aliases: ['step4', 'step 4', '4단계', '스텝4', '최종 판단 실행', '영수증 실행'],
    preconditions(item) {
      if (!item) return { ok: false, message: '먼저 분석할 매물을 불러와 주세요.' };
      return { ok: true };
    },
    async run(item) {
      return startRequestedStageFromAssistant(item, 4);
    },
  },
  {
    id: 'regen.productRisk',
    label: '리스크 판별 다시 생성',
    risk: 'safe',
    chipLabel: '리스크 다시',
    aliases: ['리스크', '고질병', '제품 리스크'],
    preconditions(item) {
      if (!item) return { ok: false, message: '먼저 분석할 매물을 불러와 주세요.' };
      const block = directAiEarlierStageBlock(item, 2);
      if (block) return { ok: false, message: block };
      if (isDirectAiPartLoading(item, 'productRisk')) return { ok: false, message: '리스크 판별이 이미 생성 중입니다.' };
      return { ok: true };
    },
    async run(item) {
      invalidateAnalysisPart(item, 'productRisk');
      if (selectedKey === summaryKey(item)) refreshProductSummaryBlock(item, { refreshProductSummary: false });
      await ensureProductRisk(item);
      refreshDirectAiPanelIfOpen();
      return { message: 'Step 2 리스크 판별을 다시 생성합니다.' };
    },
  },
  {
    id: 'regen.productRiskYoutube',
    label: '유튜브 참고 다시 생성',
    risk: 'safe',
    chipLabel: '유튜브 다시',
    aliases: ['유튜브', 'youtube'],
    preconditions(item) {
      if (!item) return { ok: false, message: '먼저 분석할 매물을 불러와 주세요.' };
      const block = directAiEarlierStageBlock(item, 2);
      if (block) return { ok: false, message: block };
      if (isDirectAiPartLoading(item, 'productRiskYoutube')) return { ok: false, message: '유튜브 참고가 이미 생성 중입니다.' };
      return { ok: true };
    },
    async run(item) {
      invalidateAnalysisPart(item, 'productRiskYoutube');
      if (selectedKey === summaryKey(item)) refreshProductRiskYoutubeCard(item);
      await ensureProductRiskYoutube(item);
      refreshDirectAiPanelIfOpen();
      return { message: '유튜브 참고 자료를 다시 생성합니다.' };
    },
  },
  {
    id: 'regen.listingText',
    label: '판매글 분석 다시 생성',
    risk: 'safe',
    chipLabel: '본문 분석 다시',
    aliases: ['본문', '판매글', '텍스트 분석', '글 분석'],
    preconditions(item) {
      if (!item) return { ok: false, message: '먼저 분석할 매물을 불러와 주세요.' };
      const block = directAiEarlierStageBlock(item, 2);
      if (block) return { ok: false, message: block };
      if (isDirectAiPartLoading(item, 'listingText')) return { ok: false, message: '판매글 분석이 이미 생성 중입니다.' };
      return { ok: true };
    },
    async run(item) {
      invalidateAnalysisPart(item, 'listingText');
      if (selectedKey === summaryKey(item)) refreshListingTextAnalysisCard(item);
      await ensureListingTextAnalysis(item);
      refreshDirectAiPanelIfOpen();
      return { message: '판매글 분석을 다시 생성합니다.' };
    },
  },
  {
    id: 'regen.listingImage',
    label: '이미지 분석 다시 생성',
    risk: 'safe',
    chipLabel: '이미지 분석 다시',
    aliases: ['이미지', '사진', '사진 분석', '이미지 분석'],
    preconditions(item) {
      if (!item) return { ok: false, message: '먼저 분석할 매물을 불러와 주세요.' };
      const block = directAiEarlierStageBlock(item, 2);
      if (block) return { ok: false, message: block };
      if (isDirectAiPartLoading(item, 'listingImage')) return { ok: false, message: '이미지 분석이 이미 생성 중입니다.' };
      return { ok: true };
    },
    async run(item) {
      invalidateAnalysisPart(item, 'listingImage');
      if (selectedKey === summaryKey(item)) refreshListingImageAnalysisCard(item);
      await ensureListingImageAnalysis(item);
      refreshDirectAiPanelIfOpen();
      return { message: '판매자 이미지 분석을 다시 생성합니다.' };
    },
  },
  {
    id: 'regen.accessoryCheck',
    label: '구성품 체크 다시 생성',
    risk: 'safe',
    chipLabel: '구성품 체크 다시',
    aliases: ['구성품', '구성품 체크', '구성 체크', '부속품', '악세사리', '액세서리'],
    preconditions(item) {
      if (!item) return { ok: false, message: '먼저 분석할 매물을 불러와 주세요.' };
      const block = directAiEarlierStageBlock(item, 2);
      if (block) return { ok: false, message: block };
      const key = summaryKey(item);
      if (productRiskAnalyses.get(key)?.status !== 'done') return { ok: false, message: 'Step 2 리스크 판별이 끝난 뒤 구성품 체크를 다시 실행할 수 있습니다.' };
      const imageState = listingImageAnalyses.get(key);
      if (imageState?.status === 'loading') return { ok: false, message: '이미지 분석이 끝난 뒤 구성품 체크를 다시 실행할 수 있습니다.' };
      if (imageState && imageState.status !== 'done' && imageState.status !== 'error') return { ok: false, message: '이미지 분석 결과가 준비된 뒤 구성품 체크를 다시 실행할 수 있습니다.' };
      if (isDirectAiPartLoading(item, 'accessoryCheck')) return { ok: false, message: '구성품 체크가 이미 생성 중입니다.' };
      return { ok: true };
    },
    async run(item) {
      invalidateAnalysisPart(item, 'accessoryCheck');
      if (selectedKey === summaryKey(item)) refreshAccessoryCheckCard(item);
      await ensureAccessoryCheck(item);
      refreshDirectAiPanelIfOpen();
      return { message: '구성품 체크를 다시 생성합니다.' };
    },
  },
  {
    id: 'regen.searchQuery',
    label: '검색어 다시 생성',
    risk: 'safe',
    chipLabel: '검색어 다시',
    aliases: ['검색어', '검색어 재생성'],
    preconditions(item) {
      if (!item) return { ok: false, message: '먼저 분석할 매물을 불러와 주세요.' };
      const block = directAiEarlierStageBlock(item, 3);
      if (block) return { ok: false, message: block };
      if (isDirectAiPartLoading(item, 'searchQuery')) return { ok: false, message: '검색어가 이미 생성 중입니다.' };
      return { ok: true };
    },
    async run(item) {
      await regenerateStageThreeSearchQueries(item);
      refreshDirectAiPanelIfOpen();
      return { message: '가격 참고용 검색어를 다시 생성합니다.' };
    },
  },
  {
    id: 'regen.comparisonSearch',
    label: '비교 매물 다시 검색',
    risk: 'safe',
    chipLabel: '매물 검색 다시',
    aliases: ['비교 매물', '매물 검색', '번장', '당근', '중고나라 검색'],
    preconditions(item) {
      if (!item) return { ok: false, message: '먼저 분석할 매물을 불러와 주세요.' };
      const block = directAiEarlierStageBlock(item, 3);
      if (block) return { ok: false, message: block };
      if (isDirectAiPartLoading(item, 'comparisonSearch')) return { ok: false, message: '비교 매물 검색이 이미 진행 중입니다.' };
      return { ok: true };
    },
    async run(item) {
      const key = summaryKey(item);
      stageThreeActiveKeys.add(key);
      relatedRequestedKeys.add(key);
      openRelatedSearchForItem(item, stageThreeSearchQueries(item), null, { isolated: true });
      refreshDirectAiPanelIfOpen();
      return { message: '번개·당근·중고나라 비교 매물 검색을 다시 시작합니다.' };
    },
  },
  {
    id: 'regen.usedPriceGuide',
    label: '가격 참고자료 다시 생성',
    risk: 'safe',
    chipLabel: '가격 참고 다시',
    aliases: ['가격 참고', '시세', '중고 시세', '가격 가이드'],
    preconditions(item) {
      if (!item) return { ok: false, message: '먼저 분석할 매물을 불러와 주세요.' };
      const block = directAiEarlierStageBlock(item, 3);
      if (block) return { ok: false, message: block };
      if (!isStepThreeUnlocked(item)) return { ok: false, message: 'Step 3 가격 참고를 시작한 뒤에 다시 생성할 수 있습니다.' };
      if (isDirectAiPartLoading(item, 'usedPriceGuide')) return { ok: false, message: '가격 참고자료가 이미 생성 중입니다.' };
      return { ok: true };
    },
    async run(item) {
      await ensureUsedPriceGuide(item, { regenerate: true });
      refreshDirectAiPanelIfOpen();
      return { message: '중고 시세 가이드를 다시 생성합니다.' };
    },
  },
  {
    id: 'regen.skipComparison',
    label: '비교 매물 스킵',
    risk: 'safe',
    chipLabel: '비교 매물 스킵',
    aliases: ['비교 스킵', '매물 스킵', '스킵'],
    preconditions(item) {
      if (!item) return { ok: false, message: '먼저 분석할 매물을 불러와 주세요.' };
      const block = directAiEarlierStageBlock(item, 3);
      if (block) return { ok: false, message: block };
      return { ok: true };
    },
    async run(item) {
      skipStageThreeComparison(item);
      refreshDirectAiPanelIfOpen();
      return { message: '비교 매물 수집을 건너뛰고 가격 참고 정리로 넘어갑니다.' };
    },
  },
  {
    id: 'regen.purchaseReceipt',
    label: '최종 판단 다시 생성',
    risk: 'safe',
    chipLabel: '최종 판단 다시',
    aliases: ['최종 판단', '영수증', '구매 판단', 'step4', 'step 4'],
    preconditions(item) {
      if (!item) return { ok: false, message: '먼저 분석할 매물을 불러와 주세요.' };
      const block = directAiEarlierStageBlock(item, 4);
      if (block) return { ok: false, message: block };
      if (!isStepThreeUnlocked(item)) return { ok: false, message: 'Step 3 가격 참고가 준비된 뒤에 다시 생성할 수 있습니다.' };
      if (isDirectAiPartLoading(item, 'purchaseReceipt')) return { ok: false, message: '최종 판단이 이미 생성 중입니다.' };
      return { ok: true };
    },
    async run(item) {
      await ensurePurchaseReceipt(item, { regenerate: true });
      refreshDirectAiPanelIfOpen();
      return { message: '최종 구매 판단을 다시 생성합니다.' };
    },
  },
  {
    id: 'ui.pdf',
    label: 'PDF 리포트 저장',
    risk: 'safe',
    chipLabel: 'PDF 저장',
    aliases: ['pdf', '리포트', '보고서', '출력'],
    preconditions(item) {
      if (!item) return { ok: false, message: '먼저 분석할 매물을 불러와 주세요.' };
      if (!isStepOneDone(item)) return { ok: false, message: '분석 결과가 조금이라도 준비된 뒤에 PDF를 저장할 수 있습니다.' };
      return { ok: true };
    },
    async run(item) {
      await openPurchaseReportPdf(item, comps);
      const warning = directAiPdfCompletionWarning(item);
      return {
        message: warning
          ? `PDF 리포트 창을 열었습니다. ${warning}`
          : 'PDF 리포트 창을 열었습니다. 인쇄 또는 PDF 저장을 진행해 주세요.',
      };
    },
  },
  {
    id: 'ui.openHistory',
    label: '최근 매물 열기',
    risk: 'safe',
    chipLabel: '최근 매물',
    aliases: ['최근', '히스토리', '기록'],
    preconditions() {
      return { ok: true };
    },
    async run() {
      $btnHistory?.click();
      return { message: '최근 매물 목록을 열었습니다.' };
    },
  },
  {
    id: 'ui.openSettings',
    label: 'AI 설정 열기',
    risk: 'safe',
    chipLabel: 'AI 설정',
    aliases: ['설정', 'ai 설정', 'ai설정', 'api 설정', 'api설정', '키 설정', '키설정', 'api 키', 'apikey', 'gemini'],
    preconditions() {
      return { ok: true };
    },
    async run() {
      document.getElementById('btnAiSettings')?.click();
      return { message: 'AI 설정 창을 열었습니다.' };
    },
  },
  {
    id: 'ui.shortcuts',
    label: '단축키 안내',
    risk: 'safe',
    chipLabel: '단축키',
    aliases: ['단축키', '키보드 단축키', 'shortcut', 'shortcuts', 'hotkey', 'hotkeys'],
    preconditions() {
      return { ok: true };
    },
    async run() {
      openShortcutPanel();
      return { message: directAiShortcutHelpText() };
    },
  },
  {
    id: 'ui.openListing',
    label: '판매글 열기',
    risk: 'safe',
    chipLabel: '판매글 열기',
    aliases: ['판매글', '원본 글', '원본 매물', '매물 페이지'],
    preconditions(item) {
      if (!item) return { ok: false, message: '먼저 분석할 매물을 불러와 주세요.' };
      if (!listingPageUrl(item)) return { ok: false, message: '이 매물의 원본 판매글 URL을 찾지 못했습니다.' };
      return { ok: true };
    },
    async run(item) {
      window.open(listingPageUrl(item), '_blank', 'noopener,noreferrer');
      return { message: '원본 판매글 열기를 요청했습니다. 새 탭이 보이지 않으면 브라우저 팝업 허용 상태를 확인해 주세요.' };
    },
  },
  {
    id: 'ui.openDanawa',
    label: '다나와 검색',
    risk: 'safe',
    chipLabel: '다나와 검색',
    aliases: ['다나와', '다나와 검색', '신품가 검색', '새상품 검색'],
    preconditions(item) {
      if (!item) return { ok: false, message: '먼저 분석할 매물을 불러와 주세요.' };
      const summary = getProductSummaryState(item)?.summary || null;
      if (!danawaPriceUrl(summary)) return { ok: false, message: 'Step 1 매물 정리 후 제품명이 잡히면 다나와 검색을 열 수 있습니다.' };
      return { ok: true };
    },
    async run(item) {
      const summary = getProductSummaryState(item)?.summary || null;
      window.open(danawaPriceUrl(summary), '_blank', 'noopener,noreferrer');
      return { message: '다나와 검색 열기를 요청했습니다. 새 탭이 보이지 않으면 브라우저 팝업 허용 상태를 확인해 주세요.' };
    },
  },
  {
    id: 'ui.openLayout',
    label: '보기 모드 전환',
    risk: 'safe',
    chipLabel: '보기 전환',
    aliases: ['보기', '레이아웃', '스크롤', '슬라이드'],
    preconditions() {
      return { ok: true };
    },
    async run() {
      $btnLayoutMode?.click();
      updateRailLayoutToggle();
      return { message: '레이아웃 보기 모드를 전환했습니다.' };
    },
  },
  {
    id: 'ui.darkModeOn',
    label: '다크모드 켜기',
    risk: 'safe',
    chipLabel: '다크모드 켜기',
    aliases: ['다크모드', '다크 모드', '다크모드 실행', '다크 모드 실행', '다크모드 켜기', '다크 모드 켜기', '어두운 모드', 'dark mode', 'dark mode on'],
    preconditions() {
      return { ok: true };
    },
    async run() {
      setThemeMode('dark');
      return { message: '다크모드를 켰습니다.' };
    },
  },
  {
    id: 'ui.darkModeOff',
    label: '다크모드 끄기',
    risk: 'safe',
    chipLabel: '다크모드 끄기',
    aliases: ['다크모드 끄기', '다크 모드 끄기', '라이트모드', '밝은 모드', 'dark mode off'],
    preconditions() {
      return { ok: true };
    },
    async run() {
      setThemeMode('light');
      return { message: '다크모드를 껐습니다.' };
    },
  },
  {
    id: 'ui.openDaangn',
    label: '당근마켓 열기',
    risk: 'safe',
    chipLabel: '당근마켓',
    aliases: ['당근', '당근마켓', 'daangn', 'karrot'],
    preconditions() {
      return { ok: true };
    },
    async run() {
      return { message: openDirectAiMarket('https://www.daangn.com/', '당근마켓') };
    },
  },
  {
    id: 'ui.openBunjang',
    label: '번개장터 열기',
    risk: 'safe',
    chipLabel: '번개장터',
    aliases: ['번개', '번장', '번개장터', 'bunjang'],
    preconditions() {
      return { ok: true };
    },
    async run() {
      return { message: openDirectAiMarket('https://m.bunjang.co.kr/', '번개장터') };
    },
  },
  {
    id: 'ui.openJoongna',
    label: '중고나라 열기',
    risk: 'safe',
    chipLabel: '중고나라',
    aliases: ['중나', '중고나라', 'joongna'],
    preconditions() {
      return { ok: true };
    },
    async run() {
      return { message: openDirectAiMarket('https://web.joongna.com/', '중고나라') };
    },
  },
  {
    id: 'ui.openImport',
    label: 'URL 불러오기 열기',
    risk: 'safe',
    chipLabel: 'URL 불러오기',
    aliases: ['url', '링크', '불러오기'],
    preconditions() {
      return { ok: true };
    },
    async run() {
      openRailPanel('import');
      return { message: '매물 URL 불러오기 패널을 열었습니다.' };
    },
  },
  {
    id: 'ui.importUrl',
    label: 'URL 바로 분석',
    risk: 'safe',
    chipLabel: 'URL 바로 분석',
    aliases: ['url 분석', '링크 분석', '바로 분석'],
    preconditions() {
      return { ok: true };
    },
    async run(item, ctx = {}) {
      const url = ctx.url || extractSupportedListingUrlFromText(ctx.prompt || '');
      if (!url) return { message: '분석할 중고나라·번개장터·당근마켓 URL을 같이 보내주세요.' };
      requestListingUrlImport(url);
      return { message: 'URL을 열어 분석을 시작합니다.' };
    },
  },
  {
    id: 'danger.refreshAll',
    label: '현재 매물 전체 다시 분석',
    risk: 'confirm',
    chipLabel: '전체 다시 분석',
    aliases: ['전체 다시', '처음부터', '전체 재생성', '다시 분석', '재실행', '다시 실행', '재분석'],
    preconditions(item) {
      if (!item) return { ok: false, message: '먼저 분석할 매물을 불러와 주세요.' };
      return { ok: true };
    },
    async run(item) {
      cancelActiveAiWork();
      clearCurrentAnalysisState();
      if (selectedKey === summaryKey(item)) {
        renderItem(item, null);
        void ensureProductSummary(item);
      }
      window.postMessage({ type: 'MARKET_SCRAPE_REQUEST' }, '*');
      refreshDirectAiPanelIfOpen();
      return { message: '현재 매물 분석을 처음부터 다시 시작합니다.' };
    },
  },
  {
    id: 'danger.newAnalysis',
    label: '새 분석 시작',
    risk: 'confirm',
    chipLabel: '새 분석',
    aliases: ['새 분석', '새로 시작', '초기화'],
    preconditions() {
      return { ok: true };
    },
    async run() {
      startNewAnalysis();
      return { message: '새 분석 화면으로 전환했습니다.' };
    },
  },
  {
    id: 'danger.clearHistory',
    label: '전체 기록 삭제',
    risk: 'confirm',
    chipLabel: '기록 전체 삭제',
    aliases: ['전체 기록 삭제', '기록 삭제', '히스토리 삭제', '최근 매물 삭제'],
    preconditions() {
      return { ok: true };
    },
    async run() {
      $btnHistoryClear?.click();
      return { message: '전체 기록과 분석 캐시를 삭제했습니다.' };
    },
  },
];

function getDirectAiAction(actionId) {
  return DIRECT_AI_ACTIONS.find((action) => action.id === actionId) || null;
}

function getDirectAiAvailableActions(item = currentRenderedItem()) {
  return DIRECT_AI_ACTIONS.filter((action) => {
    const pre = action.preconditions?.(item);
    return pre?.ok;
  });
}

function getDirectAiSuggestedCommands(item = currentRenderedItem()) {
  const preferred = [
    'stage.next',
    'regen.listingImage',
    'regen.accessoryCheck',
    'regen.usedPriceGuide',
    'regen.purchaseReceipt',
    'ui.pdf',
    'ui.openListing',
    'ui.openDanawa',
    'regen.comparisonSearch',
    'regen.productSummary',
    'ui.shortcuts',
    'ui.openHistory',
  ];
  const available = new Set(getDirectAiAvailableActions(item).map((action) => action.id));
  return preferred
    .map((id) => getDirectAiAction(id))
    .filter((action) => action && available.has(action.id))
    .slice(0, 5);
}

const DIRECT_AI_COMMAND_VERBS =
  /(?:다시\s*(?:만들|생성|해|분석|검색|정리|실행|돌려)?|재생성|refresh|regenerate|만들(?:어|기)?|생성|실행|시작|출력|저장|체크|확인|해\s*줘|실행해|저장해|열어|열어줘|켜줘|켜|보여줘|스킵|skip)/i;

function normalizeDirectAiCommandText(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function isLikelyDirectAiExplanationQuestion(message) {
  const text = String(message || '');
  if (isDirectAiShortcutHelpRequest(text)) return false;
  if (!/(?:뭐야|무엇|설명|알려|뜻|의미|궁금|어떤|왜|무슨)/i.test(text)) return false;
  return !/(?:다시\s*(?:생성|만들|분석|검색|실행|돌려)|재생성)/i.test(text);
}

function isDirectAiShortcutHelpRequest(message) {
  return /(?:단축키|키보드\s*단축키|shortcut|shortcuts|hotkey|hotkeys)/i.test(String(message || ''));
}

function directAiActionIdFromAlias(text) {
  const normalized = normalizeDirectAiCommandText(text);
  for (const action of DIRECT_AI_ACTIONS) {
    if (action.id.endsWith(normalized.replace(/\./g, ''))) return action.id;
    for (const alias of action.aliases || []) {
      const aliasNorm = normalizeDirectAiCommandText(alias);
      if (!aliasNorm) continue;
      if (normalized.includes(aliasNorm)) return action.id;
    }
  }
  return '';
}

function matchDirectAiCommandRules(message) {
  const raw = String(message || '').trim();
  const text = normalizeDirectAiCommandText(raw);
  if (!text) return null;
  if (isDirectAiShortcutHelpRequest(raw)) return { actionId: 'ui.shortcuts', confidence: 0.99, source: 'rule' };
  if (isLikelyDirectAiExplanationQuestion(raw)) return null;
  const url = extractSupportedListingUrlFromText(raw);
  if (url) return { actionId: 'ui.importUrl', confidence: 0.98, source: 'url', url };

  const ruleMatches = [
    { pattern: /^(?:재실행|재분석)$/, actionId: 'danger.refreshAll', confidence: 0.99 },
    { pattern: /^다시\s*(?:실행|분석)$/, actionId: 'danger.refreshAll', confidence: 0.99 },
    {
      pattern:
        /(?:재실행|다시\s*실행|처음부터\s*다시|새로\s*분석)(?!.*(?:이미지|사진|본문|판매글|텍스트|리스크|고질병|유튜브|검색어|비교|시세|가격|영수증|매물\s*정리|제품\s*정리|step\s*[234]))/,
      actionId: 'danger.refreshAll',
      confidence: 0.98,
    },
    { pattern: /다음\s*(단계|스텝|step).*(실행|시작|넘어|진행|해)|다음단계/, actionId: 'stage.next', confidence: 0.96 },
    { pattern: /(step\s*2|step2|2단계|스텝\s*2).*(실행|시작|넘어|진행|해)/, actionId: 'stage.step2', confidence: 0.95 },
    { pattern: /(step\s*3|step3|3단계|스텝\s*3).*(실행|시작|넘어|진행|해)/, actionId: 'stage.step3', confidence: 0.95 },
    { pattern: /(step\s*4|step4|4단계|스텝\s*4).*(실행|시작|넘어|진행|해)/, actionId: 'stage.step4', confidence: 0.95 },
    { pattern: /(전체|처음부터).*(다시|재|새로)|다시\s*분석|전체\s*재생성/, actionId: 'danger.refreshAll', confidence: 0.96 },
    { pattern: /새\s*분석\s*(시작|해)|새로\s*시작/, actionId: 'danger.newAnalysis', confidence: 0.95 },
    { pattern: /(전체\s*)?(기록|히스토리|최근\s*매물).*(삭제|지워|초기화)|전체\s*기록\s*삭제/, actionId: 'danger.clearHistory', confidence: 0.96 },
    { pattern: /(pdf|리포트|보고서).*(저장|출력|만들|열)|^pdf\s*저장/, actionId: 'ui.pdf', confidence: 0.94 },
    { pattern: /(?!(?:.*(?:분석|재분석|체크|검토)))(판매글|원본\s*(글|매물)|매물\s*페이지).*(열|켜|실행|보여|이동|가줘)/, actionId: 'ui.openListing', confidence: 0.95 },
    { pattern: /다나와|신품가\s*검색|새상품\s*검색/, actionId: 'ui.openDanawa', confidence: 0.94 },
    { pattern: /당근(?:마켓)?\s*(?:켜|열|보여|가줘|이동)/, actionId: 'ui.openDaangn', confidence: 0.96 },
    { pattern: /번개(?:장터)?|번장/, actionId: 'ui.openBunjang', confidence: 0.9 },
    { pattern: /중고나라|중나/, actionId: 'ui.openJoongna', confidence: 0.9 },
    { pattern: /최근\s*매물|히스토리/, actionId: 'ui.openHistory', confidence: 0.9 },
    { pattern: /ai\s*설정|api\s*설정|키\s*설정|api\s*키|gemini|제미나이/, actionId: 'ui.openSettings', confidence: 0.92 },
    { pattern: /단축키|키보드\s*단축키|shortcut|hotkey/, actionId: 'ui.shortcuts', confidence: 0.98 },
    { pattern: /보기\s*전환|레이아웃|스크롤(?:식)?|슬라이드(?:식)?/, actionId: 'ui.openLayout', confidence: 0.88 },
    { pattern: /(다크\s*모드|어두운\s*모드|dark\s*mode).*(꺼|꺼줘|off|해제|비활성)|라이트\s*모드|밝은\s*모드/, actionId: 'ui.darkModeOff', confidence: 0.96 },
    { pattern: /(다크\s*모드|어두운\s*모드|dark\s*mode)(?:\s*(?:실행|켜|켜줘|on|적용|활성|해줘|해|전환|바꿔)?)?$/, actionId: 'ui.darkModeOn', confidence: 0.96 },
    { pattern: /url\s*불러|링크\s*불러|매물\s*url/, actionId: 'ui.openImport', confidence: 0.88 },
    { pattern: /(구성품|구성\s*체크|부속품|악세사리|액세서리)\s*(다시\s*)?(체크|재분석|분석|생성|확인)/, actionId: 'regen.accessoryCheck', confidence: 0.95 },
    { pattern: /(이미지|사진)\s*분석/, actionId: 'regen.listingImage', confidence: 0.93 },
    { pattern: /(본문|판매글|텍스트|글)\s*(다시\s*)?(분석|재분석|체크|검토)/, actionId: 'regen.listingText', confidence: 0.95 },
    { pattern: /유튜브/, actionId: 'regen.productRiskYoutube', confidence: 0.9 },
    { pattern: /(리스크|고질병)/, actionId: 'regen.productRisk', confidence: 0.9 },
    { pattern: /검색어/, actionId: 'regen.searchQuery', confidence: 0.9 },
    { pattern: /(비교\s*매물|매물)\s*스킵|비교\s*스킵/, actionId: 'regen.skipComparison', confidence: 0.92 },
    { pattern: /(비교\s*매물|매물)\s*(다시\s*)?검색/, actionId: 'regen.comparisonSearch', confidence: 0.91 },
    { pattern: /(가격\s*참고|시세|중고\s*시세)/, actionId: 'regen.usedPriceGuide', confidence: 0.92 },
    { pattern: /(최종\s*판단|구매\s*판단|영수증)/, actionId: 'regen.purchaseReceipt', confidence: 0.92 },
    { pattern: /(매물\s*정리|제품\s*정리)/, actionId: 'regen.productSummary', confidence: 0.9 },
  ];

  const hasCommandVerb = DIRECT_AI_COMMAND_VERBS.test(raw);
  for (const rule of ruleMatches) {
    if (rule.pattern.test(text) && (hasCommandVerb || rule.actionId.startsWith('ui.') || rule.actionId.startsWith('danger.'))) {
      return { actionId: rule.actionId, confidence: rule.confidence, source: 'rule' };
    }
  }

  if (!hasCommandVerb) return null;

  const aliasId = directAiActionIdFromAlias(raw);
  if (aliasId) return { actionId: aliasId, confidence: 0.78, source: 'alias' };
  return null;
}

function parseDirectAiCommandClassification(answer) {
  const raw = String(answer || '').trim();
  if (!raw) return null;
  const parse = (text) => {
    try {
      const data = JSON.parse(text);
      const actionId = String(data?.actionId || data?.target || '').trim();
      const confidence = Number(data?.confidence);
      if (!actionId) return null;
      return {
        actionId,
        confidence: Number.isFinite(confidence) ? confidence : 0.75,
        source: 'llm',
      };
    } catch {
      return null;
    }
  };
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] || '';
  return parse(fenced) || parse(raw.match(/\{[\s\S]*\}/)?.[0] || '');
}

function directAiCommandClassificationPrompt(message, item = currentRenderedItem()) {
  const allowed = DIRECT_AI_ACTIONS.map((action) => `${action.id}: ${action.label}`).join('\n');
  return [
    '사용자 메시지가 중고 매물 분석 앱의 실행 명령인지 분류하세요.',
    '명령이 아니면 {"actionId":"","confidence":0} 만 출력하세요.',
    '명령이면 아래 actionId 중 하나만 고르세요.',
    allowed,
    '',
    `현재 단계: ${directAiStepLabel(item)}`,
    `사용자 메시지: ${message}`,
    '반드시 JSON만 출력: {"actionId":"regen.listingImage","confidence":0.92}',
  ].join('\n');
}

async function classifyDirectAiCommandWithLlm(message, item, apiKey) {
  if (!apiKey || typeof globalThis.UlsaAi?.askDirect !== 'function') return null;
  const data = await globalThis.UlsaAi.askDirect({
    prompt: directAiCommandClassificationPrompt(message, item),
    apiKey,
  });
  const parsed = parseDirectAiCommandClassification(data.answer || '');
  if (!parsed?.actionId) return null;
  if (!getDirectAiAction(parsed.actionId)) return null;
  return parsed;
}

async function resolveDirectAiCommand(message, item = currentRenderedItem(), apiKey = getAiApiKey()) {
  if (isLikelyDirectAiExplanationQuestion(message)) return null;
  const ruled = matchDirectAiCommandRules(message);
  if (ruled?.actionId && ruled.confidence >= 0.75) return ruled;

  const maybeCommand =
    DIRECT_AI_COMMAND_VERBS.test(String(message || '')) ||
    /^(pdf|저장|열어|켜|최근|설정|api|키|url|당근|번개|번장|중고나라|중나|슬라이드|스크롤|판매글|원본|다나와|기록|히스토리|새\s*분석|다음|step|스텝|\d단계)/i.test(String(message || '').trim()) ||
    Boolean(extractSupportedListingUrlFromText(message));
  if (!maybeCommand) return null;

  try {
    const llm = await classifyDirectAiCommandWithLlm(message, item, apiKey);
    if (llm?.actionId && llm.confidence >= 0.7) return llm;
  } catch {
    return ruled;
  }
  return ruled;
}

async function executeDirectAiAction(actionId, item = currentRenderedItem(), ctx = {}) {
  const action = getDirectAiAction(actionId);
  if (!action) return { ok: false, message: '알 수 없는 명령입니다.' };
  if (directAiChat.commandStatus === 'loading') {
    return { ok: false, message: '이미 다른 명령을 실행 중입니다. 잠시만 기다려 주세요.' };
  }
  const pre = action.preconditions?.(item);
  if (pre && !pre.ok) return { ok: false, message: pre.message || '지금은 실행할 수 없습니다.' };

  directAiChat.commandStatus = 'loading';
  try {
    const result = await action.run(item, ctx);
    return { ok: true, message: result?.message || `${action.label}을(를) 실행했습니다.` };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : String(err) };
  } finally {
    directAiChat.commandStatus = 'idle';
  }
}

function queueDirectAiCommandConfirm(actionId) {
  const action = getDirectAiAction(actionId);
  if (!action) return;
  directAiChat.messages.push({
    role: 'ai',
    text: `"${action.label}"을(를) 실행할까요? 되돌릴 수 없는 작업일 수 있습니다.`,
    meta: { confirmActionId: actionId },
  });
  directAiChat.status = 'done';
}

async function handleDirectAiUserMessage(prompt, item = currentRenderedItem()) {
  const apiKey = getAiApiKey();
  const resolved = await resolveDirectAiCommand(prompt, item, apiKey);
  if (!resolved?.actionId) return false;

  const action = getDirectAiAction(resolved.actionId);
  if (!action) return false;

  if (action.risk === 'confirm') {
    queueDirectAiCommandConfirm(action.id);
    return true;
  }

  const result = await executeDirectAiAction(action.id, item, {
    prompt,
    url: resolved.url || extractSupportedListingUrlFromText(prompt),
  });
  directAiChat.messages.push({
    role: 'ai',
    text: result.ok ? result.message : result.message,
  });
  directAiChat.status = result.ok ? 'done' : 'error';
  return true;
}

function renderDirectAiCommandChipsHtml(item = currentRenderedItem()) {
  const chips = getDirectAiSuggestedCommands(item);
  if (!chips.length) return '';
  return `
    <div class="direct-chat-commands" aria-label="명령 바로가기">
      <span>명령</span>
      <div>
        ${chips
          .map(
            (chip) =>
              `<button type="button" class="direct-chat-command-chip" data-direct-chat-command="${escapeAttr(chip.id)}">${escapeHtml(chip.chipLabel || chip.label)}</button>`
          )
          .join('')}
      </div>
    </div>
  `;
}

function bindDirectAiCommandButtons(root = $directAiPanel) {
  root?.querySelectorAll('[data-direct-chat-command]').forEach((btn) => {
    if (btn.dataset.directChatCommandBound === '1') return;
    btn.dataset.directChatCommandBound = '1';
    btn.addEventListener('click', async () => {
      const actionId = btn.getAttribute('data-direct-chat-command') || '';
      const action = getDirectAiAction(actionId);
      if (!action) return;
      const item = currentRenderedItem();
      directAiChat.messages.push({ role: 'user', text: action.chipLabel || action.label });
      saveDirectAiChatState();
      if (action.risk === 'confirm') {
        queueDirectAiCommandConfirm(actionId);
        saveDirectAiChatState();
        renderDirectAiPanel();
        return;
      }
      directAiChat.status = 'loading';
      renderDirectAiPanel();
      const result = await executeDirectAiAction(actionId, item);
      directAiChat.messages.push({ role: 'ai', text: result.message });
      directAiChat.status = result.ok ? 'done' : 'error';
      saveDirectAiChatState();
      renderDirectAiPanel();
    });
  });

  root?.querySelectorAll('[data-direct-chat-confirm]').forEach((btn) => {
    if (btn.dataset.directChatConfirmBound === '1') return;
    btn.dataset.directChatConfirmBound = '1';
    btn.addEventListener('click', async () => {
      const actionId = btn.getAttribute('data-direct-chat-confirm') || '';
      directAiChat.status = 'loading';
      renderDirectAiPanel();
      const result = await executeDirectAiAction(actionId, currentRenderedItem());
      directAiChat.messages.push({ role: 'ai', text: result.message });
      directAiChat.status = result.ok ? 'done' : 'error';
      saveDirectAiChatState();
      renderDirectAiPanel();
    });
  });

  root?.querySelectorAll('[data-direct-chat-confirm-cancel]').forEach((btn) => {
    if (btn.dataset.directChatConfirmCancelBound === '1') return;
    btn.dataset.directChatConfirmCancelBound = '1';
    btn.addEventListener('click', () => {
      directAiChat.messages.push({ role: 'ai', text: '명령 실행을 취소했습니다.' });
      directAiChat.status = 'done';
      saveDirectAiChatState();
      renderDirectAiPanel();
    });
  });
}

function directAiKeywordStages(item = currentRenderedItem()) {
  if (!item) return [];
  const stages = [];
  if (isStepOneDone(item)) stages.push({ id: 'step1', label: 'Step 1 매물 정리' });
  if (isStepTwoDone(item)) stages.push({ id: 'step2', label: 'Step 2 리스크 판별' });
  if (isStepThreeDone(item)) stages.push({ id: 'step3', label: 'Step 3 가격 참고자료' });
  if (isStepFourDone(item)) stages.push({ id: 'step4', label: 'Step 4 최종 판단' });
  return stages;
}

function currentDirectAiKeywordStage(item = currentRenderedItem()) {
  return directAiKeywordStages(item).at(-1) || { id: 'step1', label: 'Step 1 매물 기본 정보' };
}

function directAiKeywordGroupKey(item = currentRenderedItem(), stage = currentDirectAiKeywordStage(item)) {
  const key = item ? summaryKey(item) : selectedKey || 'unknown';
  return `${key || 'unknown'}::${stage.id || stage.label || 'step'}`;
}

function directAiKeywordGroupLabel(item = currentRenderedItem(), stage = currentDirectAiKeywordStage(item)) {
  return stage?.label || directAiStepLabel(item).replace(/\s*까지 반영$/, '').replace(/\s*만 반영$/, '');
}

function uniqueDirectAiKeywords(values = []) {
  const out = [];
  const seen = new Set();
  for (const value of values) {
    const keyword = String(value || '').trim();
    const key = directAiKeywordKey(keyword);
    if (!keyword || seen.has(key)) continue;
    seen.add(key);
    out.push(keyword);
  }
  return out;
}

function directAiKeywordKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .trim();
}

function dedupeDirectAiKeywordGroups(groups = []) {
  const seen = new Set();
  return (Array.isArray(groups) ? groups : [])
    .map((group) => {
      const items = [];
      for (const item of Array.isArray(group?.items) ? group.items : []) {
        const keyword = String(item || '').trim();
        const key = directAiKeywordKey(keyword);
        if (!keyword || seen.has(key)) continue;
        seen.add(key);
        items.push(keyword);
      }
      return { ...group, items };
    })
    .filter((group) => group.items.length);
}

function sanitizeDirectAiKeywordGroups(state = {}) {
  const groups = Array.isArray(state.keywordGroups)
    ? state.keywordGroups
        .map((group) => {
          const items = uniqueDirectAiKeywords(Array.isArray(group?.items) ? group.items : []).slice(0, 3);
          if (!items.length) return null;
          return {
            key: String(group?.key || group?.signature || '').trim() || `legacy-${items.join('|')}`,
            label: String(group?.label || '추천 키워드').trim(),
            signature: String(group?.signature || '').trim(),
            items,
          };
        })
        .filter(Boolean)
    : [];
  if (!groups.length && Array.isArray(state.keywordItems) && state.keywordItems.length) {
    const items = uniqueDirectAiKeywords(state.keywordItems).slice(0, 3);
    if (items.length) {
      groups.push({
        key: String(state.keywordSignature || 'legacy'),
        label: '이전 추천',
        signature: String(state.keywordSignature || ''),
        items,
      });
    }
  }
  return dedupeDirectAiKeywordGroups(groups).slice(-6);
}

function flattenDirectAiKeywordGroups(groups = [], fallbackItems = []) {
  const grouped = groups.flatMap((group) => (Array.isArray(group?.items) ? group.items : []));
  return uniqueDirectAiKeywords([...grouped, ...(Array.isArray(fallbackItems) ? fallbackItems : [])]);
}

function currentDirectAiKeywordItems() {
  return flattenDirectAiKeywordGroups(directAiChat.keywordGroups, directAiChat.keywordItems);
}

function upsertDirectAiKeywordGroup(item, stage, signature, keywords) {
  const groupKey = directAiKeywordGroupKey(item, stage);
  const groups = sanitizeDirectAiKeywordGroups(directAiChat);
  let group = groups.find((entry) => entry.key === groupKey);
  if (!group) {
    group = { key: groupKey, label: directAiKeywordGroupLabel(item, stage), signature: '', items: [] };
    groups.push(group);
  }
  group.signature = signature;
  group.label = directAiKeywordGroupLabel(item, stage);
  group.items = uniqueDirectAiKeywords([...(group.items || []), ...keywords]).slice(0, 3);
  directAiChat.keywordGroups = dedupeDirectAiKeywordGroups(groups).slice(-6);
  directAiChat.keywordItems = flattenDirectAiKeywordGroups(directAiChat.keywordGroups).slice(-15);
}

function directAiContext(item = currentRenderedItem(), opts = {}) {
  if (!item) return { stage: '매물 없음', listing: null };
  const key = summaryKey(item);
  const stageComps = effectiveStageThreeComps(item, comps);
  const { state: receiptState } = stageComps ? resolvedPurchaseReceiptState(item, stageComps) : { state: null };
  const usedGuideState = stageComps ? resolvedUsedPriceGuideState(item, stageComps).state : null;
  const targetStage = opts.keywordStage || '';
  const includeStep2 = !targetStage || ['step2', 'step3', 'step4'].includes(targetStage);
  const includeStep3 = !targetStage || ['step3', 'step4'].includes(targetStage);
  const includeStep4 = !targetStage || targetStage === 'step4';
  return {
    stage: opts.stageLabel || directAiStepLabel(item),
    listing: {
      platform: item.platformLabel || item.platform || '',
      title: item.title || '',
      priceLabel: item.priceLabel || '',
      shippingFeeLabel: item.shippingFeeLabel || '',
      body: String(item.body || '').slice(0, 1600),
      seller: item.seller || null,
      imageCount: Array.isArray(item.imageUrls) ? item.imageUrls.length : 0,
    },
    productSummary: productSummaries.get(key)?.status === 'done' ? productSummaries.get(key)?.summary || null : null,
    productRisk: includeStep2 && productRiskAnalyses.get(key)?.status === 'done' ? productRiskAnalyses.get(key)?.analysis || null : null,
    youtube: includeStep2 && productRiskYoutubeAnalyses.get(key)?.status === 'done' ? productRiskYoutubeAnalyses.get(key)?.analysis || null : null,
    listingTextAnalysis: includeStep2 && listingTextAnalyses.get(key)?.status === 'done' ? listingTextAnalyses.get(key)?.analysis || null : null,
    listingImageAnalysis: includeStep2 && listingImageAnalyses.get(key)?.status === 'done' ? listingImageAnalyses.get(key)?.analysis || null : null,
    accessoryCheck: includeStep2 && accessoryChecks.get(key)?.status === 'done' ? accessoryChecks.get(key)?.analysis || null : null,
    comparison:
      includeStep3 && stageComps && isCompsCollected(stageComps)
        ? {
            stats: compStats(filteredComparisonItems(item, stageComps) || comparisonFilterCandidates(item, stageComps, 12) || []),
            sampleCount: comparisonItems(stageComps).length,
            platforms: ['bunjang', 'daangn', 'joongna'].map((id) => ({
              id,
              count: Array.isArray(stageComps?.[id]?.items) ? stageComps[id].items.length : 0,
              query: stageComps?.[id]?.query || '',
            })),
          }
        : null,
    usedPriceGuide: includeStep3 && usedGuideState?.status === 'done' ? usedGuideState.guide || null : null,
    purchaseReceipt: includeStep4 && receiptState?.status === 'done' ? receiptState.receipt || null : null,
  };
}

function resetDirectAiChat({ close = false } = {}) {
  if (close) directAiChat.open = false;
  directAiChat.status = 'idle';
  directAiChat.commandStatus = 'idle';
  directAiChat.messages = [];
  directAiChat.keywordStatus = 'idle';
  directAiChat.keywordItems = [];
  directAiChat.keywordGroups = [];
  directAiChat.keywordSignature = '';
}

function saveDirectAiChatState(key = selectedKey || (latest ? itemKey(latest) : '')) {
  if (!key) return;
  const cleaned = directAiChatStateToPersistable(directAiChat);
  if (cleaned) directAiChatStates.set(key, cleaned);
  else directAiChatStates.delete(key);
  persistAiCaches();
}

function loadDirectAiChatState(key, { keepOpen = directAiChat.open } = {}) {
  const cached = key ? directAiChatStates.get(key) : null;
  const open = keepOpen;
  resetDirectAiChat();
  directAiChat.open = open;
  if (cached) {
    directAiChat.status = cached.status || 'idle';
    directAiChat.messages = Array.isArray(cached.messages) ? cached.messages.map((msg) => ({ ...msg })) : [];
    directAiChat.keywordStatus = cached.keywordStatus || 'idle';
    directAiChat.keywordGroups = sanitizeDirectAiKeywordGroups(cached);
    directAiChat.keywordItems = flattenDirectAiKeywordGroups(directAiChat.keywordGroups, cached.keywordItems).slice(-15);
    directAiChat.keywordSignature = cached.keywordSignature || '';
  }
}

function directAiKeywordDigest(value) {
  const text = String(value || '');
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0;
  }
  return String(hash);
}

function directAiKeywordStageSignature(item = currentRenderedItem(), stage = currentDirectAiKeywordStage(item)) {
  if (!item) return 'empty';
  const key = summaryKey(item);
  const stageComps = effectiveStageThreeComps(item, comps);
  const receiptKey = stageComps ? purchaseReceiptKey(item, stageComps) : '';
  const contextDigest = directAiKeywordDigest(
    JSON.stringify(directAiContext(item, { keywordStage: stage.id, stageLabel: stage.label })).slice(0, 12000)
  );
  return [
    key,
    stage.id || stage.label || 'step',
    productSummaries.get(key)?.status || 'none',
    productRiskAnalyses.get(key)?.status || 'none',
    productRiskYoutubeAnalyses.get(key)?.status || 'none',
    listingTextAnalyses.get(key)?.status || 'none',
    listingImageAnalyses.get(key)?.status || 'none',
    accessoryChecks.get(key)?.status || 'none',
    stageComps && isCompsCollected(stageComps) ? 'comps-done' : 'comps-none',
    stageComps ? resolvedUsedPriceGuideState(item, stageComps).state?.status || 'guide-none' : 'guide-none',
    receiptKey ? purchaseReceipts.get(receiptKey)?.status || 'receipt-none' : 'receipt-none',
    contextDigest,
  ].join('|');
}

function normalizeDirectAiKeyword(value) {
  const clean = String(value || '')
    .replace(/[()[\]{}"'“”‘’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 32);
  if (!clean || clean.length < 2) return '';
  if (/^(중고|거래|판매|구매|가격|시세|매물|확인|상태|사진|구성품|안심결제|직거래|택배|배송|네고|판매자|구매자|하자|사용감|거래완료|추정 신품가|신품가|고질병)$/i.test(clean)) return '';
  return clean;
}

function parseDirectAiKeywords(answer) {
  const raw = String(answer || '').trim();
  if (!raw) return [];
  const parse = (text) => {
    try {
      const data = JSON.parse(text);
      const list = Array.isArray(data) ? data : Array.isArray(data?.keywords) ? data.keywords : [];
      return list.map(normalizeDirectAiKeyword).filter(Boolean);
    } catch {
      return [];
    }
  };
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] || '';
  const bracket = raw.match(/\[[\s\S]*\]/)?.[0] || raw.match(/\{[\s\S]*\}/)?.[0] || '';
  const parsed = parse(fenced);
  if (parsed.length) return parsed.slice(0, 3);
  const parsedBracket = parse(bracket);
  if (parsedBracket.length) return parsedBracket.slice(0, 3);
  const parsedRaw = parse(raw);
  if (parsedRaw.length) return parsedRaw.slice(0, 3);
  return raw
    .split(/\n|,|ㆍ|·/)
    .map((line) => line.replace(/^\s*[-*\d.)]+\s*/, '').replace(/^"|"$/g, ''))
    .map(normalizeDirectAiKeyword)
    .filter(Boolean)
    .slice(0, 3);
}

function directAiKeywordPrompt(item = currentRenderedItem(), stage = currentDirectAiKeywordStage(item)) {
  const context = directAiContext(item, { keywordStage: stage.id, stageLabel: stage.label });
  return [
    `${stage.label} 분석 맥락을 보고, 사용자가 제품을 잘 모르면 생소할 수 있는 키워드만 1~3개 고르세요.`,
    '중고거래 일반 용어는 제외하세요. 예: 구성품, 직거래, 안심결제, 네고, 거래완료, 신품가, 하자, 시세는 제외.',
    '제품/브랜드/제조사/캐릭터/시리즈/기기 구조/부품/펌웨어/플랫폼/장르 고유 용어만 고르세요.',
    '이미 화면에 있는 기존 키워드는 되도록 다시 고르지 마세요.',
    `기존 키워드: ${JSON.stringify(currentDirectAiKeywordItems())}`,
    '반드시 JSON만 출력하세요. 형식: {"keywords":["키워드1","키워드2"]}',
    '',
    `현재 분석 맥락 JSON:\n${JSON.stringify(context, null, 2).slice(0, 10000)}`,
  ].join('\n');
}

async function ensureDirectAiKeywords(item = currentRenderedItem()) {
  if (!item || !directAiChat.open) return;
  const requestKey = summaryKey(item);
  if (directAiChat.keywordStatus === 'loading') return;
  const stages = directAiKeywordStages(item);
  const groups = sanitizeDirectAiKeywordGroups(directAiChat);
  const pendingStages = stages.filter((stage) => {
    const group = groups.find((entry) => entry.key === directAiKeywordGroupKey(item, stage));
    return (group?.items?.length || 0) < 3 && group?.signature !== directAiKeywordStageSignature(item, stage);
  });
  if (!pendingStages.length) return;
  const apiKey = getAiApiKey();
  if (!apiKey || typeof globalThis.UlsaAi?.askDirect !== 'function') return;
  directAiChat.keywordStatus = 'loading';
  updateDirectAiSuggestions();
  try {
    for (const stage of pendingStages) {
      const signature = directAiKeywordStageSignature(item, stage);
      directAiChat.keywordSignature = signature;
      const data = await globalThis.UlsaAi.askDirect({ prompt: directAiKeywordPrompt(item, stage), apiKey });
      if (selectedKey !== requestKey) return;
      const next = parseDirectAiKeywords(data.answer || '');
      upsertDirectAiKeywordGroup(item, stage, signature, next);
      updateDirectAiSuggestions();
    }
    directAiChat.keywordStatus = 'done';
  } catch {
    if (selectedKey !== requestKey) return;
    directAiChat.keywordStatus = 'error';
  }
  saveDirectAiChatState(requestKey);
  updateDirectAiSuggestions();
}

function directAiPrompt(question, item = currentRenderedItem()) {
  const context = directAiContext(item);
  return [
    '너는 중고 매물 분석 화면에서 제품 용어를 설명하고 사용자의 요청을 실행하는 AI 비서입니다.',
    '중고거래 일반 용어는 웬만하면 설명하지 말고, 제품/브랜드/장르/기기 구조/펌웨어/부품/캐릭터/제조사처럼 해당 제품을 모르면 생소할 수 있는 정보만 중심으로 설명하세요.',
    '현재 완료된 단계까지만 확정적으로 말하고, 아직 나오지 않은 분석은 추측하지 마세요.',
    '답변은 한국어 일반 텍스트로 짧고 친절하게 작성하세요. 용어가 무엇인지 먼저 설명하고, 중고로 살 때 확인할 점이 있으면 1~2문장으로만 덧붙이세요.',
    '',
    `현재 분석 맥락 JSON:\n${JSON.stringify(context, null, 2).slice(0, 12000)}`,
    '',
    `사용자 질문: ${question}`,
  ].join('\n');
}

function directAiShortcutHelpText() {
  const body = APP_SHORTCUT_GROUPS.map(
    (group) => `${group.title}\n${group.items.map(([key, desc]) => `${key}: ${desc}`).join('\n')}`
  ).join('\n\n');
  return `단축키 패널을 열었습니다.\n\n${body}\n\n입력창 안에서는 전역 단축키가 비활성화됩니다.`;
}

function renderDirectAiSuggestionsHtml() {
  const groups = sanitizeDirectAiKeywordGroups(directAiChat);
  if (groups.length) {
    return groups
      .map(
        (group) => `
          <div class="direct-chat-suggestion-group">
            <span>${escapeHtml(group.label || '추천 키워드')}</span>
            <div>
              ${group.items
                .map((chip) => `<button type="button" data-direct-chat-keyword="${escapeAttr(chip)}">${escapeHtml(chip)}</button>`)
                .join('')}
            </div>
          </div>
        `
      )
      .join('');
  }
  const chips = currentDirectAiKeywordItems();
  if (chips.length) {
    return chips.map((chip) => `<button type="button" data-direct-chat-keyword="${escapeAttr(chip)}">${escapeHtml(chip)}</button>`).join('');
  }
  return `<p>${directAiChat.keywordStatus === 'loading' ? 'AI가 제품 관련 키워드를 고르는 중...' : 'AI 비서가 제품 관련 질문과 분석 요청을 도와줍니다.'}</p>`;
}

function bindDirectAiKeywordButtons(root = $directAiPanel) {
  root?.querySelectorAll('[data-direct-chat-keyword]').forEach((btn) => {
    if (btn.dataset.directChatKeywordBound === '1') return;
    btn.dataset.directChatKeywordBound = '1';
    btn.addEventListener('click', () => {
      const keyword = btn.getAttribute('data-direct-chat-keyword') || '';
      const form = $directAiPanel.querySelector('.direct-chat-form');
      const textarea = form?.querySelector('textarea[name="prompt"]');
      if (textarea) textarea.value = directAiKeywordQuestion(keyword);
      form?.requestSubmit?.();
    });
  });
}

function updateDirectAiSuggestions() {
  const suggestions = $directAiPanel?.querySelector('.direct-chat-suggestions');
  if (!suggestions) return;
  suggestions.innerHTML = renderDirectAiSuggestionsHtml();
  bindDirectAiKeywordButtons(suggestions);
}

function renderDirectAiPanel() {
  if (!$directAiPanel) return;
  const messages = Array.isArray(directAiChat.messages) ? directAiChat.messages : [];
  const item = currentRenderedItem();
  const productName = item ? stepTwoProductName(item) : '이 매물';
  const defaultPrompt = `${productName}에 대해 물어보거나, 이미지 분석 다시·PDF 저장처럼 요청해보세요.`;
  const rows = messages.length
    ? messages
        .map(
          (msg) => `
            <div class="direct-chat-msg direct-chat-msg--${escapeAttr(msg.role || 'ai')}">
              <span>${msg.role === 'user' ? '나' : 'AI 비서'}</span>
              <p>${escapeHtml(msg.text || '')}</p>
              ${
                msg.meta?.confirmActionId
                  ? `<div class="direct-chat-confirm">
                      <button type="button" data-direct-chat-confirm="${escapeAttr(msg.meta.confirmActionId)}">실행</button>
                      <button type="button" data-direct-chat-confirm-cancel>취소</button>
                    </div>`
                  : ''
              }
            </div>
          `
        )
        .join('')
    : `<div class="direct-chat-empty">
        <strong>분석 내용을 보면서 바로 설명해드릴게요.</strong>
        <p data-direct-chat-empty-status>${escapeHtml(directAiStatusText(item))}</p>
      </div>`;
  const loadingRow =
    directAiChat.status === 'loading'
      ? `<div class="direct-chat-msg direct-chat-msg--ai direct-chat-msg--loading"><span>AI 비서</span><p>분석 맥락을 읽고 답변 중...</p></div>`
      : '';
  $directAiPanel.hidden = !directAiChat.open;
  $directAiPanel.setAttribute('aria-hidden', directAiChat.open ? 'false' : 'true');
  $btnDirectAi?.setAttribute('aria-expanded', directAiChat.open ? 'true' : 'false');
  $btnDirectAi?.classList.toggle('is-active', directAiChat.open);
  $directAiPanel.innerHTML = `
    <article class="direct-chat-card">
      <div class="direct-chat-head">
        <div>
          <p class="stage-two-card-label">AI 비서</p>
          <h3>모르는 용어 설명부터 분석 요청까지 도와드려요</h3>
          <span data-direct-chat-stage>${escapeHtml(directAiStepLabel(item))}</span>
        </div>
        <div class="direct-chat-actions">
          <button type="button" class="chip-btn direct-chat-clear">지우기</button>
          <button type="button" class="chip-btn direct-chat-close" aria-label="AI 비서 닫기">×</button>
        </div>
      </div>
      ${renderDirectAiCommandChipsHtml(item)}
      <div class="direct-chat-suggestions" aria-label="추천 질문">
        ${renderDirectAiSuggestionsHtml()}
      </div>
      <div class="direct-chat-log">${rows}${loadingRow}</div>
      <form class="direct-chat-form">
        <textarea name="prompt" rows="2" placeholder="${escapeAttr(defaultPrompt)}"${directAiChat.status === 'loading' ? ' disabled' : ''}></textarea>
        <button type="submit" class="btn btn-small direct-chat-submit" aria-label="AI 비서에게 보내기"${directAiChat.status === 'loading' ? ' disabled' : ''}>
          <span class="material-symbols-rounded" aria-hidden="true">${directAiChat.status === 'loading' ? 'more_horiz' : 'auto_awesome'}</span>
        </button>
      </form>
    </article>
  `;
  requestAnimationFrame(() => {
    positionDirectAiPanel();
    const log = $directAiPanel.querySelector('.direct-chat-log');
    if (log) log.scrollTop = log.scrollHeight;
  });
  bindDirectAiChat();
}

function positionDirectAiPanel() {
  if (!$directAiPanel || $directAiPanel.hidden) return;
  $directAiPanel.style.left = '';
  $directAiPanel.style.top = '';
}

function refreshDirectAiPanelIfOpen() {
  if (!directAiChat.open) return;
  const item = currentRenderedItem();
  const stage = $directAiPanel?.querySelector('[data-direct-chat-stage]');
  if (stage) stage.textContent = directAiStepLabel(item);
  const emptyStatus = $directAiPanel?.querySelector('[data-direct-chat-empty-status]');
  if (emptyStatus) emptyStatus.textContent = directAiStatusText(item);
  const commands = $directAiPanel?.querySelector('.direct-chat-commands');
  if (commands) commands.outerHTML = renderDirectAiCommandChipsHtml(item);
  bindDirectAiCommandButtons($directAiPanel);
  updateDirectAiSuggestions();
  void ensureDirectAiKeywords();
}

function refreshDirectAiPanelForListingChange() {
  if (!directAiChat.open) return;
  renderDirectAiPanel();
  void ensureDirectAiKeywords();
}

function stripChatMarkdown(text) {
  return String(text || '')
    .replace(/\*\*/g, '')
    .replace(/__/g, '')
    .replace(/`/g, '')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s*[-*]\s+/gm, '');
}

function sellerChatKey(item) {
  return summaryKey(item);
}

function normalizeSellerChatTone(value) {
  const raw = String(value || 'polite');
  return sellerChatToneOptions.some((opt) => opt.value === raw) ? raw : 'polite';
}

function defaultSellerChatState() {
  return {
    mode: 'first',
    tone: 'polite',
    toneNote: '',
    input: '',
    sellerReply: '',
    replyAnalysis: null,
    status: 'idle',
    messages: [],
    lastSuggestion: null,
    lastRequestMessage: '',
    lastRequestWasSellerReply: false,
    error: '',
  };
}

function getSellerChatState(item) {
  const key = sellerChatKey(item);
  if (!key) return null;
  if (!sellerChatStates.has(key)) sellerChatStates.set(key, defaultSellerChatState());
  const state = sellerChatStates.get(key);
  state.tone = normalizeSellerChatTone(state.tone);
  return state;
}

function updateSellerChatState(item, patch = {}) {
  const state = getSellerChatState(item);
  if (!state) return null;
  Object.assign(state, patch);
  return state;
}

function sellerChatToneLabel(value) {
  return sellerChatToneOptions.find((opt) => opt.value === normalizeSellerChatTone(value))?.label || '공손하게';
}

function sellerChatContext(item, comps) {
  const key = summaryKey(item);
  const stageComps = effectiveStageThreeComps(item, comps);
  const summary = key ? getProductSummaryState(item)?.summary || null : null;
  const riskAnalysis = key ? productRiskAnalyses.get(key)?.analysis || null : null;
  const listingTextAnalysis = key ? listingTextAnalyses.get(key)?.analysis || null : null;
  const listingImageAnalysis = key ? listingImageAnalyses.get(key)?.analysis || null : null;
  const accessoryCheck = key && accessoryChecks.get(key)?.status === 'done' ? accessoryChecks.get(key)?.analysis || null : null;
  const { state: receiptState } = key && stageComps ? resolvedPurchaseReceiptState(item, stageComps) : { state: null };
  const { state: usedGuideState } = key && stageComps ? resolvedUsedPriceGuideState(item, stageComps) : { state: null };
  const receipt = receiptState?.status === 'done' ? receiptState.receipt || null : null;
  const usedPriceGuide = usedGuideState?.status === 'done' ? usedGuideState.guide || null : null;
  const matched = key && stageComps ? (filteredComparisonItems(item, stageComps) || []) : [];
  const stats = matched.length ? compStats(matched) : null;
  return {
    item: {
      platform: item.platform || '',
      platformLabel: item.platformLabel || '',
      title: item.title || '',
      priceLabel: item.priceLabel || '',
      shippingFeeLabel: item.shippingFeeLabel || '',
      body: item.body || '',
      seller: item.seller || null,
      pageUrl: item.pageUrl || '',
    },
    summary,
    riskAnalysis,
    listingTextAnalysis,
    listingImageAnalysis,
    accessoryCheck,
    receipt,
    usedPriceGuide,
    comparison: {
      matchedCount: matched.length,
      stats: stats
        ? {
            count: stats.n,
            min: stats.min,
            max: stats.max,
            median: stats.median,
            minLabel: formatWon(stats.min),
            maxLabel: formatWon(stats.max),
            medianLabel: formatWon(stats.median),
          }
        : null,
      matchedListings: matched.slice(0, 8).map((x) => ({
        platform: x.platformLabel || x.platform || '',
        title: x.title || '',
        priceLabel: x.priceLabel || '',
        saleStatus: x.saleStatus || '',
      })),
    },
  };
}

function sellerChatQuickChips(mode, response = null, messages = []) {
  const responseChips = Array.isArray(response?.quickReplies)
    ? response.quickReplies.filter(Boolean).slice(0, 4)
    : [];
  if (responseChips.length) return responseChips;
  const defaults = mode === 'reply'
    ? ['구성품 한 번만 더 확인할게요', '하자 부분 사진 부탁드려요', '가격 조금 조정 가능할까요?', '직거래도 가능할까요?']
    : ['인사하고 상태부터 확인', '구성품 확인', '하자 여부 질문', '가격 조정 가능 여부'];
  const sentTexts = (Array.isArray(messages) ? messages : [])
    .filter((msg) => msg?.role === 'me')
    .map((msg) => msg.text || '');
  return defaults.filter((chip) => !sellerChatIsDuplicateText(chip, sentTexts)).slice(0, 4);
}

function sellerChatSuggestionTexts(response) {
  const texts = [
    response?.primary,
    ...(Array.isArray(response?.alternatives) ? response.alternatives : []),
    ...(Array.isArray(response?.followUps) ? response.followUps : []),
  ]
    .map((text) => String(text || '').trim())
    .filter(Boolean);
  return [...new Set(texts)].slice(0, 6);
}

function sellerChatNeedsNegotiation(context) {
  const receipt = context?.receipt || {};
  const guide = context?.usedPriceGuide || {};
  const text = [
    receipt.verdict,
    receipt.headline,
    receipt.summary,
    receipt.priceReason,
    receipt.negotiationPriceLabel,
    receipt.maxBuyPriceLabel,
    guide.recommendedAction,
    guide.currentAssessment,
  ]
    .filter(Boolean)
    .join(' ');
  return receipt.verdict === 'negotiate' || /네고|가격\s*조정|협상|비싸|비싼|높은|상한|초과/.test(text);
}

function sellerChatNegotiationSentence(context) {
  const receipt = context?.receipt || {};
  const target = String(receipt.negotiationPriceLabel || receipt.maxBuyPriceLabel || '').trim();
  const pricePart = target && !/어려움|보류|없음/.test(target) ? `${target} 정도로 ` : '';
  return `상태랑 구성품 확인되면 바로 거래하고 싶은데, 혹시 가격은 ${pricePart}조정 가능할까요?`;
}

function sellerChatHasNegotiation(text) {
  return /네고|가격\s*조정|조정\s*가능|협상|할인|깎|낮춰/.test(String(text || ''));
}

function normalizeSellerChatTextForCompare(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sellerChatKeywordSet(text) {
  const stop = new Set(['안녕하세요', '혹시', '문의', '드립니다', '가능할까요', '확인', '부탁드립니다', '구매', '하고', '싶습니다']);
  return new Set(
    normalizeSellerChatTextForCompare(text)
      .split(' ')
      .filter((word) => word.length >= 2 && !stop.has(word))
  );
}

function sellerChatIntentSet(text) {
  const raw = String(text || '');
  const intents = new Set();
  if (/안녕|연락|관심|구매하고|구매 의향/.test(raw)) intents.add('greeting');
  if (/구성품|동글|케이블|박스|충전기|부속|포함/.test(raw)) intents.add('components');
  if (/하자|흠집|스크래치|기스|찍힘|오염|파손|상태/.test(raw)) intents.add('condition');
  if (/가격|네고|조정|할인|깎|만원|원에|원으로/.test(raw)) intents.add('price');
  if (/영수증|구매\s*영수증|인증|거래내역|구매내역/.test(raw)) intents.add('receipt');
  if (/직거래|택배|배송|거래\s*장소|어디서/.test(raw)) intents.add('delivery');
  return intents;
}

function sellerChatIsDuplicateText(candidate, sentTexts) {
  const normalized = normalizeSellerChatTextForCompare(candidate);
  if (!normalized) return true;
  const candidateKeywords = sellerChatKeywordSet(candidate);
  const candidateIntents = sellerChatIntentSet(candidate);
  for (const sent of sentTexts) {
    const sentNormalized = normalizeSellerChatTextForCompare(sent);
    if (!sentNormalized) continue;
    if (normalized === sentNormalized) return true;
    if (normalized.includes(sentNormalized) || sentNormalized.includes(normalized)) return true;
    const sentIntents = sellerChatIntentSet(sent);
    const overlappingIntents = [...candidateIntents].filter((intent) => sentIntents.has(intent));
    if (overlappingIntents.length >= 2) return true;
    const sentKeywords = sellerChatKeywordSet(sent);
    const overlap = [...candidateKeywords].filter((word) => sentKeywords.has(word)).length;
    const denominator = Math.max(1, Math.min(candidateKeywords.size, sentKeywords.size));
    if (candidateKeywords.size >= 4 && sentKeywords.size >= 4 && overlap / denominator >= 0.62) return true;
  }
  return false;
}

function filterSellerChatDuplicateSuggestions(response, messages = []) {
  const sentTexts = (Array.isArray(messages) ? messages : [])
    .filter((msg) => msg?.role === 'me')
    .map((msg) => String(msg.text || '').trim())
    .filter(Boolean);
  if (!sentTexts.length) return response;
  const seen = new Set();
  const keepUnique = (items, limit) =>
    (Array.isArray(items) ? items : [])
      .map((item) => String(item || '').trim())
      .filter((item) => {
        const key = normalizeSellerChatTextForCompare(item);
        if (!key || seen.has(key)) return false;
        if (sellerChatIsDuplicateText(item, sentTexts)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, limit);
  const candidates = keepUnique([response.primary, ...(Array.isArray(response.alternatives) ? response.alternatives : [])], 6);
  return {
    ...response,
    primary: candidates[0] || '',
    alternatives: candidates.slice(1, 5),
    followUps: keepUnique(response.followUps, 3),
    quickReplies: keepUnique(response.quickReplies, 4),
  };
}

function enforceSellerChatNegotiation(response, context, messages = [], requestText = '') {
  if (!sellerChatNeedsNegotiation(context)) return response;
  if (String(requestText || '').trim()) return response;
  const sentTexts = (Array.isArray(messages) ? messages : [])
    .filter((msg) => msg?.role === 'me')
    .map((msg) => msg.text || '');
  if (sentTexts.some(sellerChatHasNegotiation)) return response;
  const negotiation = sellerChatNegotiationSentence(context);
  const primary = String(response.primary || '').trim();
  const alternatives = Array.isArray(response.alternatives) ? response.alternatives.filter(Boolean) : [];
  const followUps = Array.isArray(response.followUps) ? response.followUps.filter(Boolean) : [];
  const allTexts = [primary, ...alternatives, ...followUps];
  if (allTexts.some(sellerChatHasNegotiation)) return response;
  return {
    ...response,
    primary: primary ? `${primary} ${negotiation}` : negotiation,
    alternatives: [negotiation, ...alternatives].slice(0, 5),
    quickReplies: ['가격 조정 가능 여부', ...(Array.isArray(response.quickReplies) ? response.quickReplies : [])].slice(0, 4),
  };
}

function sellerChatHistoryPayload(messages = []) {
  return (Array.isArray(messages) ? messages : [])
    .map((msg) => ({
      role: msg?.role === 'seller' ? 'seller' : msg?.role === 'me' ? 'me' : 'assistant',
      text: String(msg?.text || '').trim(),
    }))
    .filter((msg) => msg.text);
}

function copyIconSvg() {
  return `
    <svg class="seller-chat__copy-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M8 7.5C8 6.67 8.67 6 9.5 6h8c.83 0 1.5.67 1.5 1.5v10c0 .83-.67 1.5-1.5 1.5h-8c-.83 0-1.5-.67-1.5-1.5v-10Z" />
      <path d="M5 15.5v-9C5 5.12 6.12 4 7.5 4h7" />
    </svg>`;
}

function renderSellerChatMessage(msg, index = -1) {
  const role = msg?.role || 'assistant';
  const side = role === 'seller' ? 'left' : 'right';
  const label = role === 'seller' ? '판매자' : role === 'me' ? '나' : 'AI';
  const rowClass = `seller-chat__row seller-chat__row--${side}${msg?.isNew ? ' is-new' : ''}`;
  const bubbleClass =
    role === 'seller'
      ? 'seller-chat__bubble seller-chat__bubble--seller'
      : role === 'me'
        ? 'seller-chat__bubble seller-chat__bubble--me'
        : 'seller-chat__bubble seller-chat__bubble--assistant';
  const altHtml = Array.isArray(msg?.alternatives) && msg.alternatives.length
    ? `<div class="seller-chat__alts">${msg.alternatives
        .slice(0, 3)
        .map((alt) => `<button type="button" class="seller-chat__chip" data-seller-chat-copy="${escapeAttr(alt)}">${escapeHtml(alt)}</button>`)
        .join('')}</div>`
    : '';
  const followUpsHtml = Array.isArray(msg?.followUps) && msg.followUps.length
    ? `<div class="seller-chat__followups">${msg.followUps.slice(0, 3).map((q) => `<span class="seller-chat__followup">${escapeHtml(q)}</span>`).join('')}</div>`
    : '';
  const copyButton =
    (role === 'assistant' || role === 'me') && msg?.text
      ? `<button type="button" class="seller-chat__copy seller-chat__copy--icon" data-seller-chat-copy="${escapeAttr(msg.text)}" aria-label="메시지 복사" title="복사">${copyIconSvg()}</button>`
      : '';
  const deleteButton =
    index >= 0 && (role === 'me' || role === 'seller')
      ? `<button type="button" class="seller-chat__delete" data-seller-chat-delete="${index}" aria-label="메시지 삭제">×</button>`
      : '';
  return `
    <div class="${rowClass}">
      <div class="${bubbleClass}">
        ${deleteButton}
        <span class="seller-chat__label">${label}</span>
        <p>${escapeHtml(msg?.text || '')}</p>
        ${copyButton}
        ${altHtml}
        ${followUpsHtml}
      </div>
    </div>
  `;
}

function renderSellerChatReplyForm(state) {
  return `
    <form class="seller-chat__empty-reply" data-seller-chat-reply-form>
      <span class="seller-chat__form-label seller-chat__form-label--reply">판매자 답변 입력</span>
      <textarea
        class="seller-chat__composer seller-chat__composer--reply"
        rows="2"
        placeholder="판매자 답변 붙여넣기: 예) 네 구성품은 박스랑 충전기 있고 하자는 없습니다."
        data-seller-chat-reply
        ${state.status === 'loading' ? 'disabled' : ''}
      >${escapeHtml(state.sellerReply || '')}</textarea>
      <button type="submit" class="seller-chat__send seller-chat__send--reply"${state.status === 'loading' ? ' disabled' : ''}>답장 만들기</button>
    </form>
  `;
}

function renderSellerChatThread(state) {
  const messages = Array.isArray(state?.messages) ? state.messages : [];
  if (!messages.length) {
    return `
      <div class="seller-chat__empty">
        <div class="seller-chat__bubble seller-chat__bubble--assistant">
          <span class="seller-chat__label">AI</span>
          <p>거래를 이어갈 때만 아래에서 첫 메시지를 만들거나, 판매자 답변을 붙여넣어 답장 후보를 받아보세요.</p>
        </div>
      </div>
    `;
  }
  return messages.map((msg, index) => renderSellerChatMessage(msg, index)).join('');
}

function renderSellerChatSuggestions(state) {
  if (state?.status === 'loading') {
    return `
      <div class="seller-chat__suggestions is-loading">
        <div class="seller-chat__suggestions-head">
          <strong>문구 생성 중...</strong>
          <span>가격·리스크 근거를 반영하고 있습니다.</span>
          ${renderAiLoadingProgress(state, 'sellerChat')}
        </div>
        <div class="seller-chat__suggestion-card seller-chat__suggestion-card--skeleton">
          <span class="seller-chat__skeleton-line seller-chat__skeleton-line--short"></span>
          <span class="seller-chat__skeleton-line"></span>
          <span class="seller-chat__skeleton-line seller-chat__skeleton-line--mid"></span>
        </div>
        <div class="seller-chat__suggestion-card seller-chat__suggestion-card--skeleton">
          <span class="seller-chat__skeleton-line seller-chat__skeleton-line--short"></span>
          <span class="seller-chat__skeleton-line"></span>
          <span class="seller-chat__skeleton-line seller-chat__skeleton-line--mid"></span>
        </div>
      </div>
    `;
  }
  const suggestions = sellerChatSuggestionTexts(state?.lastSuggestion);
  if (!suggestions.length) return '';
  return `
    <div class="seller-chat__suggestions">
      <div class="seller-chat__suggestions-head">
        <div>
          <strong>선택 가능한 메시지 후보</strong>
          <span>거래를 이어갈 때만 골라 보내세요.</span>
        </div>
        <button type="button" class="seller-chat__regen" data-seller-chat-regenerate ${state.status === 'loading' ? 'disabled' : ''}>다시 만들기</button>
      </div>
      ${suggestions
        .map(
          (text, index) => `
            <div class="seller-chat__suggestion-card" data-seller-chat-send-suggestion="${escapeAttr(text)}" role="button" tabindex="0" aria-label="제안 ${index + 1} 보낸 메시지로 추가">
              <span class="seller-chat__suggestion-label">제안 ${index + 1}</span>
              <strong>${escapeHtml(text)}</strong>
              <span class="seller-chat__suggestion-actions">
                <small>클릭하면 바로 보낸 메시지로 추가</small>
                <button type="button" class="seller-chat__copy seller-chat__copy--icon" data-seller-chat-copy="${escapeAttr(text)}" aria-label="추천 문구 복사" title="복사">${copyIconSvg()}</button>
              </span>
            </div>
          `
        )
        .join('')}
    </div>
  `;
}

function renderSellerReplyAnalysis(state) {
  const analysis = state?.replyAnalysis || null;
  if (!analysis?.text) return '';
  return `
    <div class="seller-chat__reply-insight" data-seller-reply-analysis>
      <span class="material-symbols-rounded" aria-hidden="true">quick_phrases</span>
      <div>
        <strong>판매자 답장 해석</strong>
        <p>${escapeHtml(analysis.text)}</p>
      </div>
    </div>
  `;
}

function renderSellerChatChips(state) {
  const quickChips = sellerChatQuickChips(state?.mode || 'first', state?.lastSuggestion || null, state?.messages || []);
  return quickChips
    .map((chip) => `<button type="button" class="seller-chat__chip" data-seller-chat-chip="${escapeAttr(chip)}">${escapeHtml(chip)}</button>`)
    .join('');
}

function sellerChatSellerName(item) {
  const seller = item?.seller || {};
  return seller.nickname || seller.shopName || seller.name || '판매자';
}

function renderSellerChatMeta(item) {
  const sellerText = sellerLine(item?.seller, item?.platform);
  const platform = item?.platformLabel || item?.platform || '플랫폼';
  return `
    <div class="seller-chat__context">
      <div class="seller-chat__seller">
        <span class="seller-chat__avatar">${escapeHtml(String(sellerChatSellerName(item)).slice(0, 1) || '판')}</span>
        <div>
          <strong>${escapeHtml(sellerChatSellerName(item))}</strong>
          <p>${escapeHtml([platform, sellerText].filter(Boolean).join(' · '))}</p>
        </div>
      </div>
      ${item?.pageUrl ? `<a class="seller-chat__listing-link" href="${escapeAttr(item.pageUrl)}" target="_blank" rel="noopener">판매글 열기</a>` : ''}
    </div>
  `;
}

function renderSellerChatChecklist(item) {
  const riskAnalysis = productRiskAnalyses.get(summaryKey(item))?.analysis || null;
  const checklist = Array.isArray(riskAnalysis?.purchaseChecklist) ? riskAnalysis.purchaseChecklist : [];
  const items = checklist
    .map((entry) => String(entry?.title || entry?.detail || entry?.desc || '').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .slice(0, 2);
  if (!items.length) return '';
  return `
    <div class="seller-chat__checklist" aria-label="거래 전 확인">
      <span class="material-symbols-rounded" aria-hidden="true">checklist</span>
      <strong>거래 전 확인</strong>
      <div>
        ${items.map((text) => `<span>${escapeHtml(text)}</span>`).join('')}
      </div>
    </div>
  `;
}

function appendSellerChatMessageToThread(item, msg, index) {
  const state = getSellerChatState(item);
  const panel = $current?.querySelector('[data-stage-five-panel]');
  const thread = panel?.querySelector('[data-seller-chat-thread]');
  if (!state || !thread) return false;
  const rowHtml = renderSellerChatMessage({ ...msg, isNew: true }, index);
  if (thread.querySelector('.seller-chat__empty')) {
    thread.innerHTML = rowHtml;
  } else {
    thread.insertAdjacentHTML('beforeend', rowHtml);
  }
  thread.scrollTo({ top: thread.scrollHeight, behavior: 'smooth' });
  return true;
}

function refreshSellerChatDynamic(item, opts = {}) {
  const state = getSellerChatState(item);
  const panel = $current?.querySelector('[data-stage-five-panel]');
  if (!state || !panel) return false;
  const thread = panel.querySelector('[data-seller-chat-thread]');
  const replyAnalysis = panel.querySelector('[data-seller-reply-analysis-slot]');
  const suggestions = panel.querySelector('[data-seller-chat-suggestions]');
  const chips = panel.querySelector('[data-seller-chat-chips]');
  const error = panel.querySelector('[data-seller-chat-error]');
  const modeTitle = panel.querySelector('[data-seller-chat-mode-title]');
  const input = panel.querySelector('[data-seller-chat-input]');
  const reply = panel.querySelector('[data-seller-chat-reply]');
  if (thread && !opts.skipThread) thread.innerHTML = renderSellerChatThread(state);
  if (replyAnalysis) replyAnalysis.innerHTML = renderSellerReplyAnalysis(state);
  if (suggestions) {
    const suggestionsHtml = renderSellerChatSuggestions(state);
    if (shouldKeepExistingLoadingBlock(suggestions, suggestionsHtml)) {
      updateAiLoadingProgressNodes('sellerChat', state, suggestions);
    } else {
      suggestions.innerHTML = suggestionsHtml;
    }
  }
  if (chips) chips.innerHTML = renderSellerChatChips(state);
  if (error) error.innerHTML = state.error ? `<p class="seller-chat__error">${escapeHtml(state.error)}</p>` : '';
  if (modeTitle) modeTitle.textContent = `거래 메시지 도우미 · ${sellerChatToneLabel(state.tone)}`;
  if (input) {
    input.value = state.input || '';
    input.disabled = state.status === 'loading';
  }
  if (reply) {
    panel.querySelectorAll('[data-seller-chat-reply]').forEach((replyInput) => {
      replyInput.value = state.sellerReply || '';
      replyInput.disabled = state.status === 'loading';
    });
  }
  panel.querySelectorAll('[data-seller-chat-mode]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.getAttribute('data-seller-chat-mode') === state.mode);
  });
  panel.querySelectorAll('[data-seller-chat-tone]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.getAttribute('data-seller-chat-tone') === state.tone);
  });
  panel.querySelectorAll('.seller-chat__send').forEach((btn) => {
    btn.disabled = state.status === 'loading';
  });
  return true;
}

function renderSellerChatPanel(item, comps) {
  if (!item || !isStepFourDone(item)) return '';
  const state = getSellerChatState(item);
  if (!state) return '';
  const key = sellerChatKey(item);
  if (!stageFiveActiveKeys.has(key)) {
    return `
      <section class="stage-five-panel stage-zone stage-five-zone is-active" data-stage-panel data-stage-five-panel>
        <aside class="stage-zone-label">
          <b>Step 5</b>
          <span>거래 메시지</span>
        </aside>
        <div class="stage-zone-grid stage-five-zone-grid">
          ${
            isAutoRunEnabled()
              ? renderAutoRunWaitCard(
                  '영수증 출력 후 판매자 대화 도우미를 자동으로 준비합니다.',
                  '확인할 구성품·하자·가격 질문을 이어서 추천합니다.',
                  'stage-five-start-card'
                )
              : `<button type="button" class="stage-five-start-card stage-start-card" data-stage-five-start="${escapeAttr(key)}">
            <div class="stage-two-ready">
              <div>
                <p class="stage-two-card-label">판매자 대화 준비</p>
                <h3>분석 결과를 바탕으로 거래 메시지를 만들어보세요.</h3>
                <p>가격 판단, 리스크, 확인할 점을 자연스럽게 반영해 첫 연락과 답장 문구를 추천합니다.</p>
                <span class="stage-start-card__cta">거래 메시지 만들기</span>
              </div>
            </div>
          </button>`
          }
        </div>
      </section>
    `;
  }
  const ctx = sellerChatContext(item, comps);
  const summaryName = ctx.summary?.productName || item.title || '판매자 대화 보조';
  const toneLabel = sellerChatToneLabel(state.tone);
  const placeholder = '보낼 메시지에 반영할 조건을 적어주세요. 예: 구성품과 하자 먼저 확인하고 싶어요.';
  const actionLabel = '추천 문구 만들기';
  const note = state.toneNote ? `<p class="seller-chat__note">커스텀 말투: ${escapeHtml(state.toneNote)}</p>` : '';
  const enteringClass = stageFiveEnteringKeys.has(key) ? ' is-stage-five-entering' : '';
  return `
    <section class="stage-five-panel stage-zone stage-five-zone is-active" data-stage-panel data-stage-five-panel>
      <aside class="stage-zone-label">
        <b>Step 5</b>
        <span>거래 메시지</span>
      </aside>
      <div class="stage-zone-grid stage-five-zone-grid">
        <article class="mini-card stage-five-card stage-five-card--split${enteringClass}">
          <div class="seller-chat__workspace">
            <section class="seller-chat__left-pane" aria-label="판매자 프로필과 대화창">
              <header class="seller-chat__phone-head">
                <button type="button" class="seller-chat__back" aria-label="뒤로">‹</button>
                <div class="seller-chat__title">
                  <strong>${escapeHtml(summaryName)}</strong>
                  <span data-seller-chat-mode-title>거래 메시지 도우미 · ${escapeHtml(toneLabel)}</span>
                </div>
                <button type="button" class="seller-chat__reset-icon" data-seller-chat-reset aria-label="대화 초기화">↺</button>
              </header>
              ${renderSellerChatMeta(item)}
              <div class="seller-chat__thread" data-seller-chat-thread>${renderSellerChatThread(state)}</div>
              <div class="seller-chat__reply-dock">${renderSellerChatReplyForm(state)}</div>
            </section>
            <aside class="seller-chat__right-pane" aria-label="거래 전 확인과 메시지 후보">
              <div class="seller-chat__side-section seller-chat__side-section--checklist">
                <div class="seller-chat__side-head">
                  <span class="material-symbols-rounded" aria-hidden="true">fact_check</span>
                  <div>
                    <strong>거래 전 확인</strong>
                    <p>답장에 반영할 핵심 체크포인트입니다.</p>
                  </div>
                </div>
                ${renderSellerChatChecklist(item) || '<p class="seller-chat__side-empty">확인 항목이 아직 없습니다.</p>'}
              </div>
              <div data-seller-reply-analysis-slot>${renderSellerReplyAnalysis(state)}</div>
              <div class="seller-chat__side-section">
                <div class="seller-chat__side-head">
                  <span class="material-symbols-rounded" aria-hidden="true">record_voice_over</span>
                  <div>
                    <strong>말투 변경</strong>
                    <p>후보 문장의 온도와 어휘를 조정합니다.</p>
                  </div>
                </div>
                <div class="seller-chat__tone-row">
                  ${sellerChatToneOptions
                    .map(
                      (tone) => `
                        <button type="button" class="seller-chat__tone${state.tone === tone.value ? ' is-active' : ''}" data-seller-chat-tone="${escapeAttr(tone.value)}">
                          ${escapeHtml(tone.label)}
                        </button>
                      `
                    )
                    .join('')}
                </div>
                <input class="seller-chat__note-input" type="text" value="${escapeAttr(state.toneNote || '')}" placeholder="말투 추가 요청: 예) 너무 딱딱하지 않게" data-seller-chat-tone-note />
                ${note}
              </div>
              <div data-seller-chat-suggestions>${renderSellerChatSuggestions(state)}</div>
              <div class="seller-chat__chips" data-seller-chat-chips>
                ${renderSellerChatChips(state)}
              </div>
              <form class="seller-chat__form" data-seller-chat-form>
                <span class="seller-chat__form-label">AI에게 요청할 조건</span>
                <textarea
                  class="seller-chat__composer"
                  rows="2"
                  placeholder="${escapeAttr(placeholder)}"
                  data-seller-chat-input
                  ${state.status === 'loading' ? 'disabled' : ''}
                >${escapeHtml(state.input || '')}</textarea>
                <button type="submit" class="seller-chat__send"${state.status === 'loading' ? ' disabled' : ''}>${escapeHtml(actionLabel)}${state.status === 'loading' ? ' 중...' : ''}</button>
              </form>
              <div data-seller-chat-error>${state.error ? `<p class="seller-chat__error">${escapeHtml(state.error)}</p>` : ''}</div>
            </aside>
          </div>
        </article>
      </div>
    </section>
  `;
}

function showSellerChatToast(message = '복사됐습니다') {
  let toast = document.querySelector('[data-seller-chat-toast]');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'seller-chat-toast';
    toast.setAttribute('data-seller-chat-toast', '');
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('is-visible');
  if (sellerChatToastTimer) window.clearTimeout(sellerChatToastTimer);
  sellerChatToastTimer = window.setTimeout(() => {
    toast.classList.remove('is-visible');
    sellerChatToastTimer = 0;
  }, 1500);
}

async function copySellerChatText(text) {
  const value = String(text || '').trim();
  if (!value) return;
  let copied = false;
  try {
    await navigator.clipboard.writeText(value);
    copied = true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = value;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand('copy');
      copied = true;
    } catch {
      /* ignore */
    }
    ta.remove();
  }
  if (copied) showSellerChatToast('복사됐습니다');
}

function renderStageTwoGroup(title, items, label = 'AI 분석 완료', delay = 0) {
  const safeItems = Array.isArray(items) && items.length ? items : [{ title: '확인 필요', detail: '검색 결과가 부족해 추가 확인이 필요합니다.' }];
  return `
    <article class="mini-card stage-two-card stage-two-card--stack" style="--stage-delay:${delay}ms">
      <div class="stage-two-card-head">
        <p class="stage-two-card-label">${escapeHtml(label)}</p>
        <h3>${escapeHtml(title)}</h3>
      </div>
      <div class="stage-two-mini-list">
        ${safeItems.map((item) => renderStageTwoMini(item.title, item.detail || item.desc || '', item.level)).join('')}
      </div>
    </article>
  `;
}

function renderStageTwoSimple(title, desc, delay = 0) {
  return `
    <article class="mini-card stage-two-card is-disabled" aria-disabled="true" style="--stage-delay:${delay}ms">
      <div>
        <p class="stage-two-card-label">AI 기능 추가 예정</p>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(desc)}</p>
      </div>
    </article>
  `;
}

function renderAutoRunWaitCard(title, desc, className = 'stage-two-card') {
  return `
    <article class="mini-card ${escapeAttr(className)} stage-start-card auto-run-wait-card" aria-live="polite">
      <div class="stage-two-ready">
        <div>
          <p class="stage-two-card-label">자동 진행</p>
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(desc)}</p>
          <span class="stage-start-card__cta">자동으로 시작합니다</span>
        </div>
      </div>
    </article>
  `;
}

function renderStageTwoSection(item) {
  if (!item) return '';
  const key = summaryKey(item);
  const state = getProductSummaryState(item);
  if (state?.status !== 'done') {
    return `
      <section class="stage-two-panel stage-zone stage-two-zone is-active is-locked" data-stage-panel data-stage-two-panel>
        <aside class="stage-zone-label">
          <b>Step 2</b>
          <span>리스크 판별</span>
        </aside>
        <div class="stage-zone-grid stage-two-zone-grid">
          <article class="mini-card stage-two-card stage-two-card--ready stage-lock-card">
            <div class="stage-two-ready">
              <div>
                <p class="stage-two-card-label">잠김</p>
                <h3>1단계 매물 정리가 끝나야 리스크 판별을 시작할 수 있습니다.</h3>
                <p>제품명·신품가·대표 이미지 정리가 완료될 때까지 기다려 주세요.</p>
              </div>
            </div>
          </article>
        </div>
      </section>
    `;
  }
  const isActive = isStepTwoStarted(item);
  const riskState = key ? productRiskAnalyses.get(key) : null;
  const analysis = riskState?.analysis || null;

  const followupHtml =
    isActive && riskState?.status === 'done'
      ? `${renderListingTextAnalysisCard(item)}${renderListingImageAnalysisCard(item)}${renderListingImageGroupsCard(item)}${renderAccessoryCheckCard(item)}`
      : '';
  const youtubeHtml = isActive && riskState?.status === 'done' ? renderStageTwoYoutubePanel(item, analysis) : '';
  return `
    <section class="stage-two-panel stage-zone stage-two-zone is-active" data-stage-panel data-stage-two-panel>
      <aside class="stage-zone-label">
        <b>Step 2</b>
        <span>리스크 판별</span>
      </aside>
      <div class="stage-zone-grid stage-two-zone-grid">
        ${
          !isActive
            ? isAutoRunEnabled()
              ? renderAutoRunWaitCard(
                  '매물 정리 완료 후 리스크 판별을 자동으로 시작합니다.',
                  '고질병·본문 누락·사진 상태 분석을 순서대로 실행합니다.',
                  'stage-two-card stage-two-card--ready'
                )
              : `<button type="button" class="mini-card stage-two-card stage-two-card--ready stage-start-card" data-stage-two-start="${escapeAttr(key)}">
                  <div class="stage-two-ready">
                    <div>
                      <p class="stage-two-card-label">다음 단계 대기</p>
                      <h3>매물 정리를 확인한 뒤 리스크 판별을 시작하세요.</h3>
                      <p>버튼을 눌러 고질병·본문 누락·사진 상태 분석을 실행합니다.</p>
                      <span class="stage-start-card__cta">버튼 클릭으로 시작</span>
                    </div>
                  </div>
                </button>`
            : riskState?.status === 'error'
            ? `<article class="mini-card stage-two-card stage-two-card--error">
                  <p class="stage-two-card-label">AI 분석 실패</p>
                  <h3>다음 단계 분석</h3>
                  <p>${escapeHtml(riskState.error || '분석을 불러오지 못했습니다.')}</p>
                  <button type="button" class="chip-btn stage-two-start-btn" data-stage-two-start="${escapeAttr(key)}">다시 분석</button>
                </article>`
            : riskState?.status === 'done'
              ? renderStageTwoRiskCards(analysis, item)
              : renderStageTwoLoadingCards(item)
        }
        ${followupHtml}
        ${youtubeHtml}
      </div>
    </section>
  `;
}

function renderStageThreeSection(item, comps) {
  if (!item) return '';
  if (!isStepTwoDone(item)) {
    return '';
  }
  const stageComps = effectiveStageThreeComps(item, comps);
  const key = summaryKey(item);
  const hasCachedStageThree = key
    ? [...comparisonFilters.keys(), ...usedPriceGuides.keys(), ...purchaseReceipts.keys()].some(
        (cacheKey) => listingKeyFromStageCacheKey(cacheKey) === key
      )
    : false;
  if (key && hasCachedStageThree) {
    stageThreeActiveKeys.add(key);
    relatedRequestedKeys.add(key);
  }
  const isActive = key ? stageThreeActiveKeys.has(key) : false;
  if (!isActive) {
    return `
      <section class="stage-three-panel stage-zone stage-three-zone is-active" data-stage-panel data-stage-three-panel>
        <aside class="stage-zone-label">
          <b>Step 3</b>
          <span>가격 참고</span>
        </aside>
        <div class="stage-zone-grid stage-three-zone-grid">
          ${
            isAutoRunEnabled()
              ? renderAutoRunWaitCard(
                  '리스크 판별이 끝나면 가격 참고자료 수집을 자동으로 시작합니다.',
                  '신품가·비교 매물·시세 참고표를 바로 모읍니다.',
                  'stage-three-card stage-three-card--ready'
                )
              : `<button type="button" class="mini-card stage-three-card stage-three-card--ready stage-start-card" data-stage-three-start="${escapeAttr(key)}">
            <div class="stage-two-ready">
              <div>
                <p class="stage-two-card-label">다음 단계 대기</p>
                <h3>리스크 판별을 확인한 뒤 가격 참고자료 수집을 시작하세요.</h3>
                <p>버튼을 눌러 신품가·번개·당근·중고나라 관련 매물을 모으고 구매 판단용 참고자료로 정리합니다.</p>
                <span class="stage-start-card__cta">버튼 클릭으로 시작</span>
              </div>
            </div>
          </button>`
          }
        </div>
      </section>
    `;
  }
  return `
    <section class="stage-three-panel stage-zone stage-three-zone is-active" data-stage-panel data-stage-three-panel>
      <aside class="stage-zone-label">
        <b>Step 3</b>
        <span>가격 참고</span>
      </aside>
      <div class="stage-zone-grid stage-three-zone-grid">
        ${renderStageThreeSearchCard(item, stageComps)}
        ${renderUsedPriceGuideBlock(item, stageComps)}
      </div>
    </section>
  `;
}

function renderStageThreeSearchCard(item, comps) {
  const key = summaryKey(item);
  const summary = getProductSummaryState(item)?.summary || {};
  const queries = productSummaryQueries(summary, item);
  const primaryQuery = queries[0] || fallbackSearchQuery(item);
  const danawaUrl = danawaPriceUrl(summary);
  const queryState = key ? searchQueryRegenerations.get(key) : null;
  const queryButtons = queries.length
    ? queries.map((query) => `<span class="search-query-chip">${escapeHtml(query)}</span>`).join('')
    : `<span class="search-query-chip">${escapeHtml(primaryQuery || '검색어 없음')}</span>`;
  return `
    <article class="mini-card stage-three-card" data-stage-three-search-card>
      <div class="stage-three-head">
        <div>
          <p class="stage-two-card-label">자동 매물 검색</p>
          <h3>${escapeHtml(summary.productName || primaryQuery || '관련 매물 검색')}</h3>
        </div>
        <div class="stage-three-actions">
          <button type="button" class="chip-btn" data-stage-three-refresh="${escapeAttr(key)}">다시 검색·정리</button>
          <button type="button" class="chip-btn chip-btn--ghost" data-stage-three-skip-comps="${escapeAttr(key)}">비교 매물 스킵</button>
          ${danawaUrl ? `<a class="price-source-link" href="${escapeAttr(danawaUrl)}" target="_blank" rel="noopener">다나와 검색 ↗</a>` : ''}
        </div>
      </div>
      <div class="search-query-list">${queryButtons}</div>
      ${
        queryState?.status === 'error'
          ? `<p class="meta empty">검색어 재생성 실패: ${escapeHtml(queryState.error || '다시 시도해 주세요.')}</p>`
          : ''
      }
      <div class="stage-three-comps">
        ${
          queryState?.status === 'loading'
            ? renderCompsLoading('AI가 검색어를 다시 만들고 있습니다...', queryState, 'searchQuery')
            : renderCompsBlock(item, comps)
        }
      </div>
    </article>
  `;
}

function stageThreeSearchQueries(item) {
  const key = summaryKey(item);
  const state = key ? productSummaries.get(key) : null;
  const queries = productSummaryQueries(state?.summary, item);
  return queries.length ? queries : [fallbackSearchQuery(item)].filter(Boolean);
}

function activeCompsForItem(item, rawComps) {
  if (!item || !rawComps?.forItemKey) return null;
  if (rawComps.forItemKey !== itemKey(item)) return null;
  if (rawComps.status === 'collected') return rawComps;
  if (rawComps.bunjang || rawComps.daangn || rawComps.joongna) return rawComps;
  if (rawComps.status === 'collecting') return rawComps;
  return null;
}

function renderProductSummaryBlock(item) {
  const state = getProductSummaryState(item);
  const summary = state?.summary;
  const images = productSummaryImages(summary, item);
  const danawaUrl = danawaPriceUrl(summary);
  const renderKey = productSummaryRenderKey(item);

  if (state?.status === 'loading') {
    const loadingHint = '현재 선택한 모델로 제품명·신품 가격 참고자료·대표 이미지를 준비합니다.';
    return `
      <article class="mini-card mini-card--product mini-card--compact mini-card--loading" data-product-summary data-product-summary-render-key="${escapeAttr(renderKey)}">
        <div class="summary-loading summary-loading--skeleton">
          <div class="ai-loading-copy">
            <p class="mini-value">AI가 제품 정보를 정리하는 중...</p>
            <p class="mini-muted">${escapeHtml(loadingHint)}</p>
            ${renderAiLoadingProgress(state, 'productSummary')}
          </div>
          <div class="risk-loader">
            <span></span><span></span><span></span>
          </div>
        </div>
      </article>
    `;
  }

  if (state?.status === 'error') {
    return `
      <article class="mini-card mini-card--product mini-card--compact" data-product-summary data-product-summary-render-key="${escapeAttr(renderKey)}">
        <p class="mini-value">제품 정리를 만들지 못했습니다.</p>
        <p class="mini-muted">${escapeHtml(state.error || 'API 설정 또는 서버 상태를 확인하세요.')}</p>
        <button type="button" class="btn btn-small retry-product-summary-btn">제품 정리 다시 시도</button>
      </article>
    `;
  }

  return `
    <article class="mini-card mini-card--product mini-card--compact" data-product-summary data-product-summary-render-key="${escapeAttr(renderKey)}">
      <div class="product-summary-layout">
        <div class="product-image-strip">
          ${
            images.length
              ? images
                  .map(
                    (src) =>
                      `<img class="zoomable product-summary-img" src="${escapeAttr(src)}" data-full="${escapeAttr(src)}" alt="" loading="lazy" />`
                  )
                  .join('')
              : '<div class="product-image-placeholder">이미지 없음</div>'
          }
          <button type="button" class="image-refresh-btn product-image-btn" title="제품 이미지 갱신" aria-label="제품 이미지 갱신">↻</button>
        </div>
        <div class="product-summary-text">
          <div class="product-summary-top">
            <h2 class="hover-full" title="${escapeAttr(summary?.productName || '제품 정리 대기')}">${escapeHtml(summary?.productName || '제품 정리 대기')}</h2>
            ${
              summary?.newPrice
                ? `<p class="mini-value">추정 신품가: ${escapeHtml(summary.newPrice)}${
                    danawaUrl ? ` <a class="price-source-link" href="${escapeAttr(danawaUrl)}" target="_blank" rel="noopener">다나와 검색 ↗</a>` : ''
                  }</p>`
                : ''
            }
            ${!summary?.newPrice && danawaUrl ? `<a class="price-source-link" href="${escapeAttr(danawaUrl)}" target="_blank" rel="noopener">다나와 검색 ↗</a>` : ''}
            ${summary?.makerOrSeller ? `<p class="mini-muted">제조사/판매처: ${escapeHtml(summary.makerOrSeller)}</p>` : ''}
          </div>
          ${renderScrollableText(productSummaryDescription(summary, item), 'product-desc', `summary-desc-${summaryKey(item)}`, 64)}
        </div>
      </div>
      <button type="button" class="wrong-product-btn retry-product-summary-btn" title="제품을 다시 식별합니다">이게 아니에요</button>
    </article>
  `;
}

function productSummaryRenderKey(item) {
  const state = getProductSummaryState(item);
  const summary = state?.summary || null;
  return [
    summaryKey(item),
    state?.status || 'idle',
    state?.error || '',
    summary?.productName || '',
    summary?.newPrice || '',
    summary?.makerOrSeller || '',
    productSummaryDescription(summary, item),
    productSummaryImages(summary, item).join('|'),
    danawaPriceUrl(summary),
  ].join('::');
}

function comparisonItems(comps) {
  return [...(comps?.bunjang?.items || []), ...(comps?.daangn?.items || []), ...(comps?.joongna?.items || [])].map((item) => ({
    ...item,
    key: comparisonItemKey(item),
  }));
}

function comparisonPlatformRank(item) {
  return { joongna: 0, bunjang: 1, daangn: 2 }[item?.platform] ?? 1;
}

function comparisonItemKey(item) {
  return String(item?.url || `${item?.platform || ''}:${item?.itemId || item?.title || ''}`).trim();
}

function scoreComparisonItems(item, comps) {
  const summary = getProductSummaryState(item)?.summary || null;
  const queryText = [summary?.productName, summary?.searchQuery, ...(summary?.searchQueries || []), item?.title]
    .filter(Boolean)
    .join(' ');
  const terms = String(queryText)
    .toLowerCase()
    .split(/[^0-9a-z가-힣]+/i)
    .map((term) => term.trim())
    .filter((term) => term.length >= 2);
  const coreTerms = [...new Set(terms)].slice(0, 12);
  return comparisonItems(comps)
    .map((candidate, index) => {
      const title = String(candidate.title || '').toLowerCase();
      const score = coreTerms.reduce((sum, term) => sum + (title.includes(term) ? 1 : 0), 0);
      return { candidate, index, score };
    })
    .sort((a, b) => b.score - a.score || comparisonPlatformRank(a.candidate) - comparisonPlatformRank(b.candidate) || a.index - b.index);
}

function balancedComparisonItems(scoredItems, limit = 16) {
  const platformOrder = ['joongna', 'bunjang', 'daangn'];
  const buckets = Object.fromEntries(platformOrder.map((id) => [id, []]));
  const fallback = [];
  for (const item of scoredItems) {
    const id = item.candidate?.platform;
    if (buckets[id]) buckets[id].push(item);
    else fallback.push(item);
  }
  const quotas = { joongna: 6, bunjang: 6, daangn: 3 };
  const selected = [];
  const seen = new Set();
  const take = (entry) => {
    const key = comparisonItemKey(entry?.candidate);
    if (!key || seen.has(key) || selected.length >= limit) return false;
    seen.add(key);
    selected.push(entry);
    return true;
  };
  for (const id of platformOrder) {
    for (const entry of buckets[id].slice(0, quotas[id])) take(entry);
  }
  let cursor = 0;
  while (selected.length < limit) {
    let progressed = false;
    for (const id of platformOrder) {
      const entry = buckets[id][quotas[id] + cursor];
      if (entry) progressed = take(entry) || progressed;
      if (selected.length >= limit) break;
    }
    if (!progressed) break;
    cursor += 1;
  }
  for (const entry of fallback) take(entry);
  return selected.map(({ candidate }) => candidate);
}

function comparisonFilterCandidates(item, comps, limit = 16) {
  return balancedComparisonItems(scoreComparisonItems(item, comps), limit);
}

function fallbackComparisonMatches(item, comps, limit = 8) {
  const scored = scoreComparisonItems(item, comps);
  const positive = scored.filter((entry) => entry.score > 0);
  const source = positive.length ? positive : scored;
  return balancedComparisonItems(source, limit).map((candidate) => ({
    key: comparisonItemKey(candidate),
    same: true,
    reason: positive.length
      ? 'AI 확정 매칭이 없어 제목 키워드가 겹치는 후보를 참고용으로 포함했습니다.'
      : 'AI 확정 매칭이 없어 수집된 검색 후보를 참고용으로 포함했습니다.',
    fallback: true,
  }));
}

// AI가 동일 제품 판별 결과를 내놓지 못했을 때, 수집된 비교 매물을 그대로(필터 없이) 노출한다.
function allComparisonMatches(item, comps) {
  const scored = scoreComparisonItems(item, comps);
  return scored.map((entry) => ({
    key: comparisonItemKey(entry.candidate),
    same: true,
    reason: 'AI 동일 제품 판별 결과가 없어 수집된 비교 매물을 그대로 표시합니다.',
    fallback: true,
  }));
}

function comparisonSignature(comps) {
  return comparisonItems(comps)
    .map((item) => comparisonItemKey(item))
    .sort()
    .join('|');
}

function comparisonThumbnailSignature(comps) {
  return comparisonItems(comps)
    .map((item) => `${comparisonItemKey(item)}:${comparisonImageUrl(item) ? '1' : '0'}`)
    .sort()
    .join('|');
}

function comparisonFilterKey(item, comps) {
  const key = summaryKey(item);
  if (!key || !comps) return '';
  if (!isCompsCollected(comps)) return `${key}::collecting`;
  const signature = comparisonSignature(comps);
  return signature ? `${key}::${signature}` : `${key}::collected::empty`;
}

function stageThreeCompsRenderKey(item, nextComps) {
  const key = summaryKey(item);
  if (!key) return '';
  if (!nextComps) return `${key}::empty`;
  if (!isCompsCollected(nextComps)) {
    return `${key}::collecting::${comparisonSignature(nextComps)}::thumbs::${comparisonThumbnailSignature(nextComps)}`;
  }
  return `${key}::collected::${comparisonSignature(nextComps)}::thumbs::${comparisonThumbnailSignature(nextComps)}`;
}

function stageThreeSectionRenderKey(item, nextComps) {
  const key = summaryKey(item);
  if (!key) return '';
  const stageComps = effectiveStageThreeComps(item, nextComps);
  const comparison = resolvedComparisonFilterState(item, stageComps);
  const guide = resolvedUsedPriceGuideState(item, stageComps);
  return [
    stageThreeCompsRenderKey(item, stageComps),
    stageThreeActiveKeys.has(key) ? 'active' : 'idle',
    stageThreeComparisonSkippedKeys.has(key) ? 'skipped' : 'normal',
    isStageThreeCollectionFinalizing(key) ? 'finalizing' : 'steady',
    searchQueryRegenerations.get(key)?.status || 'query-none',
    comparison.filterKey || 'filter-none',
    comparison.state?.status || 'filter-none',
    guide.key || 'guide-none',
    guide.state?.status || 'guide-none',
  ].join('|');
}

function isCompsCollected(comps) {
  return comps?.status === 'collected' || isCompsCollectionTimedOut(comps);
}

function renderCompsLoading(message, state = null, kind = 'comparisonFilter') {
  return `
    <div class="summary-loading summary-loading--skeleton comparison-loading">
      <div class="ai-loading-copy">
        <p class="mini-value">${escapeHtml(message)}</p>
        <p class="mini-muted">완료되면 일치하는 매물만 한 번에 표시합니다.</p>
        ${renderAiLoadingProgress(state, kind)}
      </div>
      <div class="risk-loader"><span></span><span></span><span></span></div>
    </div>
  `;
}

function filteredComparisonItems(item, comps) {
  const all = comparisonItems(comps);
  const { state } = resolvedComparisonFilterState(item, comps);
  if (state?.status !== 'done') return null;
  const accepted = new Set((state.matches || []).map((match) => String(match.key || '').trim()).filter(Boolean));
  const matched = all.filter((candidate) => accepted.has(comparisonItemKey(candidate)));
  const scoreMap = new Map(scoreComparisonItems(item, comps).map((entry) => [comparisonItemKey(entry.candidate), entry.score]));
  return balancedComparisonItems(
    matched.map((candidate, index) => ({
      candidate,
      index,
      score: scoreMap.get(comparisonItemKey(candidate)) ?? 0,
    })),
    matched.length
  );
}

function purchaseReceiptKey(item, comps) {
  return comparisonFilterKey(item, comps);
}

function usedPriceGuideKey(item) {
  const key = summaryKey(item);
  return key ? `${key}::guide` : '';
}

function comparisonImageUrl(item) {
  const url = String(item?.imageUrl || '').trim();
  if (!url) return '';
  let decoded = url.toLowerCase();
  for (let i = 0; i < 2; i += 1) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch {
      break;
    }
  }
  if (
    /app[\s._-]*store|google[\s._-]*play|play[\s._-]*store|store[\s._-]*badge|play[\s._-]*badge|apple[\s._-]*badge|download[\s._-]*app|app[\s._-]*download/i.test(
      decoded
    )
  )
    return '';
  if (/\.svg(?:$|[?#&])/i.test(decoded)) return '';
  if (/\/origin\/article\//i.test(decoded) && /karrotmarket|karroter|daangn|cloudfront/i.test(decoded)) return url;
  if (
    /\/_next\/static\/|\/static\/media\/|open[\s._-]*graph|opengraph|og[\s._-]*image|share[\s._-]*image|(?:^|[\/_.-])landing(?:[\/_.-]|$)|home[\s._-]*banner|(?:^|[\/_.-])intro(?:[\/_.-]|$)|(?:^|[\/_.-])brand(?:[\/_.-]|$)|(?:^|[\/_.-])marketing(?:[\/_.-]|$)|(?:^|[\/_.-])promotion(?:[\/_.-]|$)|(?:^|[\/_.-])promo(?:[\/_.-]|$)|(?:^|[\/_.-])download(?:[\/_.-]|$)|(?:^|[\/_.-])advert(?:[\/_.-]|$)|(?:^|[\/_.-])banner(?:[\/_.-]|$)/i.test(
      decoded
    )
  )
    return '';
  return url;
}

function renderComparisonList(items, limit = 8) {
  const rows = items
    .slice(0, limit)
    .map((c) => {
      const imageUrl = comparisonImageUrl(c);
      return `<li title="${escapeAttr(`[${c.platformLabel || c.platform}] ${c.title || ''} ${c.priceLabel || ''}`)}">
          ${
            imageUrl
              ? `<img class="comp-thumb" src="${escapeAttr(imageUrl)}" alt="" loading="lazy" />`
              : '<span class="comp-thumb comp-thumb--empty"></span>'
          }
          <span class="comp-copy">
            <a href="${escapeAttr(c.url)}" target="_blank" rel="noopener">[${escapeHtml(c.platformLabel || c.platform)}] ${escapeHtml(c.title || '')}</a>
            <span class="hist-meta">${escapeHtml(c.priceLabel || '')}${c.saleStatus ? ` · ${escapeHtml(c.saleStatus)}` : ''}</span>
          </span>
        </li>`;
    })
    .join('');
  const more = items.length > limit ? `<p class="meta">외 ${items.length - limit}건</p>` : '';
  return `<ul class="comp-list">${rows}</ul>${more}`;
}

function receiptVerdictLabel(verdict) {
  return {
    buy: '구매 가능',
    negotiate: '네고 추천',
    hold: '보류',
    pass: '패스 권장',
  }[verdict] || '판단 보류';
}

function compactReportList(values, limit = 5) {
  return (Array.isArray(values) ? values : [])
    .map((value) => {
      if (typeof value === 'string') return value;
      if (value && typeof value === 'object') {
        return (
          value.title ||
          value.label ||
          value.name ||
          value.summary ||
          value.text ||
          value.description ||
          value.detail ||
          value.issue ||
          value.reason ||
          value.checkPoint ||
          value.recommendation ||
          ''
        );
      }
      return '';
    })
    .map((value) => String(value || '').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .slice(0, limit);
}

function renderReportList(values, empty = '특이사항 없음') {
  const items = compactReportList(values);
  if (!items.length) return `<p class="muted">${escapeHtml(empty)}</p>`;
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function expandReportPhotoSlider(slider, item) {
  if (!slider) return;
  let urls = Array.isArray(item?.imageUrls) ? item.imageUrls.filter(Boolean) : [];
  if (!urls.length) {
    const main = slider.querySelector('img.photo-main');
    const raw = main?.getAttribute('data-lightbox-items');
    if (raw) {
      try {
        urls = JSON.parse(raw).map((entry) => entry?.url || entry?.src || '').filter(Boolean);
      } catch {
        urls = [];
      }
    }
    if (!urls.length && main?.src) urls = [main.src];
  }
  if (!urls.length) return;
  const grid = document.createElement('div');
  grid.className = 'report-photo-expand-grid';
  grid.innerHTML = urls
    .map(
      (url, idx) => `
        <figure class="report-expanded-photo">
          <img src="${escapeAttr(url)}" alt="매물 사진 ${idx + 1}" loading="eager" />
          <figcaption>${idx + 1}/${urls.length}</figcaption>
        </figure>
      `
    )
    .join('');
  slider.replaceWith(grid);
}

function expandReportImageAnalysis(wrap, item) {
  if (!wrap || !item) return;
  const images = imageAnalysisEntries(item);
  if (!images.length) return;
  const container = document.createElement('div');
  container.className = 'report-image-analysis-expand';
  container.innerHTML = images
    .map((image) => {
      const label = imageAnalysisLabel(image);
      return `
        <div class="image-analysis-slide-wrap report-image-analysis-item">
          <div class="annotated-photo-stage">
            <div class="annotated-photo-box">
              <img
                class="photo-main image-analysis-main"
                src="${escapeAttr(image.imageUrl)}"
                alt=""
                loading="eager"
              />
              <span class="image-analysis-badge risk-${escapeAttr(image.level || 'neutral')}">${escapeHtml(label)}</span>
              ${renderImageDefectMarkers(image)}
            </div>
          </div>
          <p class="image-analysis-comment risk-${escapeAttr(image.level || 'neutral')}">${escapeHtml(image.comment || '')}</p>
        </div>
      `;
    })
    .join('');
  wrap.replaceWith(container);
}

function expandReportComparisonList(clone, item, comps) {
  if (!clone || !item || !comps) return;
  const list = clone.querySelector('.comparison-price-list .comp-list');
  if (!list) return;
  const allMatched = filteredComparisonItems(item, comps) || [];
  if (!allMatched.length) return;
  const parent = list.parentElement;
  parent?.querySelectorAll('.meta').forEach((el) => {
    if (/외\s+\d+건/.test(el.textContent || '')) el.remove();
  });
  list.outerHTML = renderComparisonList(allMatched, allMatched.length);
}

function prepareReportStageClone(clone, item, comps) {
  if (!clone) return;
  clone.classList.add('report-static-stage');
  clone.querySelectorAll(
    [
      '.receipt-reprint-btn',
      '.purchase-report-pdf-btn',
      '[data-stage-three-refresh]',
      '[data-stage-three-skip-comps]',
      '[data-stage-two-youtube]',
      '[data-stage-three-start]',
      '.price-source-link',
      '.wrong-product-btn',
      '.retry-product-summary-btn',
      '.image-refresh-btn',
      '.product-image-btn',
      '.listing-head .link',
      '.seller-chat__listing-link',
      '.stage-three-restored-search',
      '.stage-three-status-pill',
      '.stage-start-card',
      '.photo-nav',
      '.photo-dots',
      '.photo-count',
      '.image-analysis-nav',
      '.stage-three-actions',
      '.stage-three-empty-search__btn',
      '.used-price-guide-btn',
      '.is-loading',
    ].join(', ')
  ).forEach((el) => el.remove());
  clone.querySelectorAll('button').forEach((btn) => {
    if (
      btn.classList.contains('photo-nav') ||
      btn.classList.contains('image-analysis-nav') ||
      btn.classList.contains('receipt-reprint-btn') ||
      btn.classList.contains('purchase-report-pdf-btn') ||
      btn.hasAttribute('data-stage-three-refresh') ||
      btn.hasAttribute('data-stage-three-skip-comps') ||
      btn.hasAttribute('data-used-price-guide') ||
      btn.hasAttribute('data-photo-dir') ||
      btn.hasAttribute('data-image-analysis-dir') ||
      btn.hasAttribute('data-stage-three-start') ||
      btn.hasAttribute('data-stage-two-start')
    ) {
      btn.remove();
    }
  });
  clone.querySelectorAll('a').forEach((link) => {
    const span = document.createElement('span');
    span.className = `${link.className || ''} report-static-link`.trim();
    span.textContent = link.textContent || link.getAttribute('href') || '';
    link.replaceWith(span);
  });
  clone.querySelectorAll('*').forEach((el) => {
    [...el.attributes].forEach((attr) => {
      if (/^on/i.test(attr.name)) el.removeAttribute(attr.name);
    });
    el.removeAttribute('tabindex');
    el.removeAttribute('role');
    el.removeAttribute('data-full');
    el.removeAttribute('data-lightbox-items');
    el.removeAttribute('data-lightbox-index');
    el.classList.remove('zoomable');
    if (el.style?.cursor) el.style.cursor = '';
  });
  clone.querySelectorAll('.image-defect-marker').forEach((marker) => {
    const div = document.createElement('div');
    div.className = marker.className;
    div.style.cssText = marker.style.cssText;
    div.innerHTML = marker.innerHTML;
    marker.replaceWith(div);
  });
  clone.querySelectorAll('.scroll-text').forEach((el) => {
    el.classList.remove('is-scrollable');
    el.style.maxHeight = 'none';
    el.style.overflow = 'visible';
  });
  clone.querySelectorAll('.receipt-paper-reveal').forEach((el) => {
    el.classList.remove('is-printing');
    el.style.height = 'auto';
    el.style.maxHeight = 'none';
    el.style.minHeight = '0';
  });
  clone.querySelectorAll('[hidden]').forEach((el) => {
    el.hidden = false;
  });
  expandReportPhotoSlider(clone.querySelector('[data-photo-slider]'), item);
  expandReportImageAnalysis(clone.querySelector('[data-image-analysis-slide-wrap]'), item);
  expandReportComparisonList(clone, item, comps);
}

function renderPurchaseReportDocument(item, comps) {
  const stylesheetUrl = new URL('style.css?v=20260611-defect-grid-cells', location.href).href;
  const logoUrl = new URL('/icons/icon128.png', location.href).href;
  const reportIssuedAt = new Date().toLocaleString('ko-KR');
  const reportTitle = item?.title || getProductSummaryState(item)?.summary?.productName || '중고 매물 구매 리포트';
  const cloneStage = (label, selector) => {
    const source = $current?.querySelector(selector);
    if (!source) return '';
    const clone = source.cloneNode(true);
    prepareReportStageClone(clone, item, comps);
    return `
      <section class="report-page">
        <header class="report-page-head">
          <span>BUY OR BYE · ${escapeHtml(reportIssuedAt)}</span>
          <h1>${escapeHtml(label)}</h1>
        </header>
        <div class="report-stage">${clone.outerHTML}</div>
      </section>
    `;
  };
  const pages = [
    cloneStage('Step 1 매물 정리', '[data-stage-one-zone]'),
    cloneStage('Step 2 리스크 판별', '[data-stage-two-panel]'),
    cloneStage('Step 3 가격 참고자료', '[data-stage-three-panel]'),
    cloneStage('Step 4 최종 판단', '[data-stage-four-panel]'),
  ]
    .filter(Boolean)
    .join('');
  return `<!doctype html>
    <html lang="ko">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeHtml(reportTitle)} - 구매 리포트</title>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,600,0,0"
        />
        <link rel="stylesheet" href="${escapeAttr(stylesheetUrl)}" />
        <style>
          @page { size: A4; margin: 0; }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body {
            margin: 0;
            background: #eef2f7;
            color: #111827;
            font-family: Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }
          .print-actions {
            position: sticky;
            top: 0;
            z-index: 10;
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            padding: 12px;
            background: rgba(255, 255, 255, 0.92);
            border-bottom: 1px solid #e5e7eb;
            backdrop-filter: blur(14px);
          }
          .print-actions button {
            border: 0;
            border-radius: 999px;
            padding: 10px 14px;
            background: #111827;
            color: #fff;
            font-weight: 900;
            cursor: pointer;
          }
          .report-doc {
            width: min(1120px, calc(100% - 32px));
            margin: 18px auto 40px;
          }
          .report-cover {
            display: grid;
            grid-template-columns: auto minmax(0, 1fr);
            gap: 18px;
            align-items: center;
            margin-bottom: 16px;
            padding: 22px 24px;
            border-radius: 24px;
            background:
              linear-gradient(135deg, rgba(255, 247, 237, 0.98), rgba(236, 253, 245, 0.92)),
              #fff;
            box-shadow: 0 16px 50px rgba(15, 23, 42, 0.12);
          }
          .report-logo {
            display: grid;
            place-items: center;
            width: 96px;
            height: 96px;
            border-radius: 24px;
            background: #fff;
            box-shadow: 0 14px 36px rgba(255, 111, 15, 0.16);
          }
          .report-logo img {
            display: block;
            width: 72px;
            height: 72px;
            object-fit: contain;
          }
          .report-cover-copy {
            display: grid;
            gap: 8px;
          }
          .report-cover span,
          .report-page-head span {
            color: #64748b;
            font-size: 12px;
            font-weight: 900;
          }
          .report-cover h1 {
            margin: 0;
            font-size: 24px;
            line-height: 1.25;
          }
          .report-page {
            display: flow-root;
            page-break-before: always;
            break-before: page;
            page-break-after: auto;
            break-after: auto;
            margin-bottom: 18px;
            padding: 18px;
            border-radius: 24px;
            background: #fff;
            box-shadow: 0 16px 50px rgba(15, 23, 42, 0.12);
          }
          .report-page-head {
            display: grid;
            gap: 4px;
            margin-bottom: 14px;
            padding-bottom: 10px;
            border-bottom: 2px solid #111827;
          }
          .report-page-head h1 {
            margin: 0;
            font-size: 20px;
          }
          .report-stage,
          .report-stage * {
            max-height: none !important;
            animation: none !important;
          }
          .report-stage {
            pointer-events: none !important;
          }
          .report-stage a,
          .report-stage button,
          .report-stage .zoomable {
            cursor: default !important;
            pointer-events: none !important;
          }
          .report-static-link {
            color: inherit !important;
            text-decoration: none !important;
          }
          .report-stage .photo-main.slide-next,
          .report-stage .photo-main.slide-prev {
            transform: none !important;
          }
          .report-stage .stage-one-zone {
            display: block !important;
            width: 100% !important;
            min-height: 0 !important;
            padding: 1rem !important;
            border-radius: 20px !important;
          }
          .report-stage .stage-two-panel.is-active,
          .report-stage .stage-three-panel,
          .report-stage .stage-four-panel,
          .report-stage .stage-zone.is-active {
            display: grid !important;
            width: 100% !important;
            min-height: 0 !important;
            padding: 1rem !important;
            border-radius: 20px !important;
          }
          .report-stage .stage-zone::before,
          .report-stage .stage-zone-label,
          .report-stage .stage-start-card__cta {
            display: none !important;
          }
          .report-stage .stage-zone-grid {
            display: grid !important;
            grid-template-columns: minmax(0, 1fr) !important;
            grid-auto-rows: auto !important;
            grid-auto-flow: row !important;
            gap: 0.8rem !important;
            padding: 0 !important;
          }
          .report-stage .stage-zone-grid > *,
          .report-stage .stage-two-zone-grid > *,
          .report-stage .stage-three-zone-grid > *,
          .report-stage .stage-four-zone-grid > *,
          .report-stage .stage-five-zone-grid > * {
            grid-column: 1 / -1 !important;
            grid-row: auto !important;
            min-width: 0 !important;
          }
          .report-stage .mini-card,
          .report-stage .stage-three-card,
          .report-stage .stage-two-card {
            position: relative !important;
            z-index: auto !important;
            width: 100% !important;
            min-height: 0 !important;
            height: auto !important;
            overflow: visible !important;
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .report-stage .purchase-receipt-stage,
          .report-stage .receipt-printer {
            width: 100% !important;
          }
          .report-stage .receipt-slot {
            display: none !important;
          }
          .report-stage .receipt-paper-reveal {
            height: auto !important;
            min-height: 0 !important;
          }
          .report-stage .stage-zone-grid:has(.stage-two-card--listing-text),
          .report-stage .stage-two-zone-grid:has(.stage-two-card--listing-text) {
            grid-template-columns: 1fr !important;
          }
          .report-stage .stage-two-card--image-analysis,
          .report-stage .mini-card--photos,
          .report-stage .mini-card--text,
          .report-stage .stage-three-card[data-stage-three-search-card],
          .report-stage .purchase-receipt-stage {
            grid-column: 1 / -1 !important;
          }
          .report-stage .scroll-text,
          .report-stage .body-text,
          .report-stage .product-desc {
            overflow: visible !important;
            -webkit-line-clamp: unset !important;
            display: block !important;
            white-space: pre-wrap !important;
          }
          .report-stage .comp-list,
          .report-stage .comp-list li {
            overflow: visible !important;
          }
          .report-stage .comp-list a {
            overflow: visible !important;
            -webkit-line-clamp: unset !important;
            display: block !important;
          }
          .report-stage .search-query-list,
          .report-stage .direct-chat-suggestions {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 6px !important;
            width: 100% !important;
            max-width: 100% !important;
            overflow: visible !important;
          }
          .report-stage .search-query-chip,
          .report-stage .direct-chat-suggestions button,
          .report-stage .seller-chat__chip,
          .report-stage .seller-chat__tone,
          .report-stage .seller-chat__mode {
            max-width: 100% !important;
            white-space: normal !important;
            overflow-wrap: anywhere !important;
            word-break: break-word !important;
            font-size: 0.72rem !important;
            line-height: 1.3 !important;
          }
          .report-stage .image-defect-marker__label {
            opacity: 1 !important;
          }
          .report-stage .material-symbols-rounded,
          .report-stage .stage-two-risk-card__icon {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-family: "Material Symbols Rounded" !important;
            font-weight: 600 !important;
            font-style: normal !important;
            font-size: 1.45rem !important;
            line-height: 1 !important;
            letter-spacing: normal !important;
            text-transform: none !important;
            white-space: nowrap !important;
            word-wrap: normal !important;
            direction: ltr !important;
            -webkit-font-feature-settings: "liga" !important;
            -webkit-font-smoothing: antialiased !important;
            font-variation-settings: "FILL" 0, "wght" 700, "GRAD" 0, "opsz" 24 !important;
          }
          .report-stage .stage-two-risk-card__icon {
            width: 2.45rem !important;
            height: 2.45rem !important;
            flex: 0 0 auto !important;
            border-radius: 999px !important;
          }
          .report-stage .stage-two-risk-card.risk-risk .stage-two-risk-card__icon {
            background: rgba(225, 29, 72, 0.1) !important;
            color: #e11d48 !important;
          }
          .report-stage .stage-two-risk-card.risk-caution .stage-two-risk-card__icon,
          .report-stage .stage-two-risk-card.risk-neutral .stage-two-risk-card__icon {
            background: rgba(217, 119, 6, 0.12) !important;
            color: #d97706 !important;
          }
          .report-stage .stage-two-risk-card.risk-safe .stage-two-risk-card__icon {
            background: rgba(5, 150, 105, 0.12) !important;
            color: #059669 !important;
          }
          .report-photo-expand-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 10px;
            width: 100%;
          }
          .report-expanded-photo {
            margin: 0;
            border: 1px solid #e5e7eb;
            border-radius: 14px;
            overflow: hidden !important;
            background: #f8fafc;
          }
          .report-expanded-photo img {
            display: block;
            width: 100%;
            height: min(24vw, 220px) !important;
            max-height: none !important;
            object-fit: contain !important;
            background: #fff;
          }
          .report-expanded-photo figcaption {
            padding: 6px 10px;
            color: #64748b;
            font-size: 12px;
            font-weight: 800;
          }
          .report-image-analysis-expand {
            display: grid;
            gap: 16px;
          }
          .report-image-analysis-item .annotated-photo-stage {
            position: relative !important;
            inset: auto !important;
            height: 280px !important;
          }
          .report-image-analysis-item .annotated-photo-box {
            height: 100% !important;
            min-height: 0 !important;
          }
          @media print {
            body { background: #fff; }
            .print-actions { display: none; }
            .report-doc { width: 100%; margin: 0; }
            .report-cover,
            .report-page {
              margin: 0;
              padding: 10mm 14mm;
              border-radius: 0;
              box-shadow: none;
            }
            .report-cover { min-height: auto; margin-bottom: 0; }
            .report-page {
              min-height: 0;
              padding-top: 10mm;
              page-break-before: always;
              break-before: page;
              page-break-after: auto;
              break-after: auto;
            }
            .report-stage .stage-zone-grid {
              grid-template-columns: minmax(0, 1fr) !important;
            }
            .report-photo-expand-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }
            .report-expanded-photo img {
              height: 58mm !important;
            }
            .report-image-analysis-item .annotated-photo-stage {
              height: 68mm !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-actions">
          <button type="button" onclick="window.print()">전체 분석 PDF로 저장 / 인쇄</button>
        </div>
        <main class="report-doc">
          <section class="report-cover">
            <div class="report-logo">
              <img src="${escapeAttr(logoUrl)}" alt="Buy or Bye" />
            </div>
            <div class="report-cover-copy">
              <span>BUY OR BYE 구매 판단 리포트 · ${escapeHtml(reportIssuedAt)}</span>
              <h1>${escapeHtml(reportTitle)}</h1>
              <p>현재 분석 화면의 Step 1부터 Step 4까지 전체 내용을 페이지별로 정리했습니다.</p>
            </div>
          </section>
          ${pages || '<section class="report-page"><p>출력할 분석 내용이 없습니다.</p></section>'}
        </main>
        <script>
          function containImageFrame(cw, ch, iw, ih) {
            if (!cw || !ch || !iw || !ih) return null;
            const ir = iw / ih;
            const wr = cw / ch;
            let width = cw;
            let height = ch;
            if (wr > ir) {
              height = ch;
              width = height * ir;
            } else {
              width = cw;
              height = width / ir;
            }
            return { width, height, left: (cw - width) / 2, top: (ch - height) / 2 };
          }
          function updateReportDefectMarkers(root) {
            root.querySelectorAll('.annotated-photo-box').forEach((box) => {
              const img = box.querySelector('img');
              const markers = box.querySelector('.image-defect-markers');
              if (!img || !markers || !img.complete || !img.naturalWidth || !img.naturalHeight) return;
              const boxRect = box.getBoundingClientRect();
              const frame = containImageFrame(boxRect.width, boxRect.height, img.naturalWidth, img.naturalHeight);
              if (!frame) return;
              markers.style.width = frame.width + 'px';
              markers.style.height = frame.height + 'px';
              markers.style.left = frame.left + 'px';
              markers.style.top = frame.top + 'px';
            });
          }
          function waitForReportImages() {
            const imgs = [...document.images];
            if (!imgs.length) return Promise.resolve();
            return Promise.all(
              imgs.map(
                (img) =>
                  img.complete
                    ? Promise.resolve()
                    : new Promise((resolve) => {
                        img.addEventListener('load', resolve, { once: true });
                        img.addEventListener('error', resolve, { once: true });
                      })
              )
            );
          }
          Promise.all([waitForReportImages(), document.fonts?.ready || Promise.resolve()]).then(() => {
            updateReportDefectMarkers(document);
            requestAnimationFrame(() => {
              updateReportDefectMarkers(document);
              setTimeout(() => window.print(), 450);
            });
          });
        </script>
      </body>
    </html>`;
}

function reportValue(value, fallback = '-') {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return text || fallback;
}

function renderStaticReportList(values, fallback = '정리된 내용이 없습니다.') {
  const items = compactReportList(values, 999);
  if (!items.length) return `<p class="report-muted">${escapeHtml(fallback)}</p>`;
  return `<ul class="report-list">${items.map((value) => `<li>${escapeHtml(value)}</li>`).join('')}</ul>`;
}

function renderStaticReportObjectList(
  values,
  keys = ['title', 'label', 'name', 'summary', 'description', 'detail', 'issue', 'risk', 'symptom', 'impact', 'reason', 'checkPoint', 'recommendation', 'evidence']
) {
  const items = (Array.isArray(values) ? values : [])
    .map((value) => {
      if (typeof value === 'string') return value;
      if (!value || typeof value !== 'object') return '';
      return keys.map((key) => value[key]).filter(Boolean).join(' - ');
    })
    .map((value) => reportValue(value, ''))
    .filter(Boolean);
  return renderStaticReportList(items);
}

function renderReportDefectMarkers(image) {
  const markers = (Array.isArray(image?.defects) ? image.defects : [])
    .map((defect) => {
      const rawGridCell =
        defect?.gridCell ||
        defect?.gridRange ||
        defect?.range ||
        defect?.cell ||
        (defect?.startCell && defect?.endCell ? `${defect.startCell}-${defect.endCell}` : '');
      const rect =
        defectBoxToRect(defect?.bbox || defect?.bboxPercent || defect?.box || defect?.rect || defect?.area) ||
        gridCellToRect(rawGridCell, defect?.gridCols, defect?.gridRows);
      const marker = defectToCenterMarker(defect) || defectRectToCenterMarker(rect) || defectGridToCenterMarker(defect);
      if (!marker) return '';
      const label = reportValue(defect?.description || defect?.detail || '하자 의심', '하자 의심').slice(0, 42);
      const severity = String(defect?.severity || 'caution').toLowerCase();
      return `
        <div
          class="report-defect-marker report-defect-marker--${escapeAttr(severity)}"
          style="left:${marker.centerX.toFixed(2)}%;top:${marker.centerY.toFixed(2)}%;width:${marker.width.toFixed(2)}%;height:${marker.height.toFixed(2)}%"
        >
          <b>${escapeHtml(label)}</b>
        </div>
      `;
    })
    .filter(Boolean)
    .join('');
  return markers ? `<div class="report-defect-layer">${markers}</div>` : '';
}

function chunkReportItems(items, size) {
  const list = Array.isArray(items) ? items : [];
  const chunkSize = Math.max(1, Number(size) || 1);
  const chunks = [];
  for (let i = 0; i < list.length; i += chunkSize) chunks.push(list.slice(i, i + chunkSize));
  return chunks;
}

function renderReportPhotoGrid(images, { annotate = false, compact = false } = {}) {
  const list = (Array.isArray(images) ? images : []).filter((image) => image?.imageUrl || image?.url);
  if (!list.length) return '<p class="report-muted">사진이 없습니다.</p>';
  return `
    <div class="report-photo-grid${compact ? ' report-photo-grid--compact' : ''}${annotate ? ' report-photo-grid--annotated' : ''}">
      ${list
        .map((image, idx) => {
          const src = image.imageUrl || image.url || '';
          const defects = Array.isArray(image.defects) ? image.defects : [];
          return `
            <figure class="report-photo-card">
              <div class="report-photo-frame">
                <img src="${escapeAttr(src)}" alt="매물 사진 ${idx + 1}" loading="eager" />
                ${annotate ? renderReportDefectMarkers(image) : ''}
              </div>
              <figcaption>
                <b>${escapeHtml(image.label || `사진 ${image.index || idx + 1}`)}</b>
                <span>${escapeHtml(image.comment || (annotate ? '사진 상태 코멘트 없음' : ''))}</span>
                ${
                  defects.length
                    ? `<ul>${defects
                        .map((defect) => `<li>${escapeHtml(reportValue(defect.description || defect.detail || '하자 의심'))}</li>`)
                        .join('')}</ul>`
                    : ''
                }
              </figcaption>
            </figure>
          `;
        })
        .join('')}
    </div>
  `;
}

function renderReportReceiptPaper(item, receipt) {
  const positives = Array.isArray(receipt?.positives) ? receipt.positives : [];
  const cautions = Array.isArray(receipt?.cautions) ? receipt.cautions : [];
  const issuedAt = new Date().toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  return `
    <div class="report-receipt receipt-${escapeAttr(receipt?.verdict || 'hold')}">
      <header>
        <h3>${escapeHtml(receipt?.headline || '최종 구매 판단')}</h3>
        <span>${escapeHtml(receiptVerdictLabel(receipt?.verdict))}</span>
      </header>
      <div class="report-receipt-row"><small>발행</small><b>${escapeHtml(issuedAt)}</b></div>
      <div class="report-receipt-row"><small>현재가</small><b>${escapeHtml(item?.priceLabel || '-')}</b></div>
      ${shippingLine(item) ? `<div class="report-receipt-row"><small>택배 거래</small><b>${escapeHtml(shippingLine(item))}</b></div>` : ''}
      <hr />
      <section>
        <b>최종 결론</b>
        <p>${escapeHtml(reportValue(receipt?.summary, '최종 판단 요약 없음'))}</p>
      </section>
      <div class="report-receipt-prices">
        <div><small>가격 참고 범위</small><b>${escapeHtml(reportValue(receipt?.fairPriceLabel, '판단 어려움'))}</b></div>
        <div><small>네고 제안</small><b>${escapeHtml(reportValue(receipt?.negotiationPriceLabel, '판단 어려움'))}</b></div>
        <div><small>구매 상한</small><b>${escapeHtml(reportValue(receipt?.maxBuyPriceLabel, '판단 어려움'))}</b></div>
      </div>
      <hr />
      <section>
        <b>가격 참고 의견</b>
        <p>${escapeHtml(reportValue(receipt?.priceReason, '가격 참고 의견 없음'))}</p>
      </section>
      <section>
        <b>리스크 반영</b>
        <p>${escapeHtml(reportValue(receipt?.riskBalance, '리스크 반영 내용 없음'))}</p>
      </section>
      ${
        positives.length || cautions.length
          ? `<div class="report-receipt-two-col">
              ${positives.length ? `<section><b>좋은 점</b>${renderStaticReportList(positives)}</section>` : ''}
              ${cautions.length ? `<section><b>확인할 점</b>${renderStaticReportList(cautions)}</section>` : ''}
            </div>`
          : ''
      }
      <p class="report-receipt-disclaimer">${escapeHtml(reportValue(receipt?.disclaimer, '이 리포트는 중고거래 의사결정을 돕는 참고자료입니다.'))}</p>
      <footer>THANK YOU / CHECK BEFORE BUY</footer>
    </div>
  `;
}

function renderPurchaseReportDocumentStatic(item, comps) {
  const key = summaryKey(item);
  const stageComps = effectiveStageThreeComps(item, comps);
  const summary = productSummaries.get(key)?.summary || {};
  const risk = productRiskAnalyses.get(key)?.analysis || {};
  const textAnalysis = listingTextAnalyses.get(key)?.analysis || {};
  const reportTextAnalysis =
    meaningfulListingTextAnalysis(textAnalysis) || fallbackListingTextAnalysis(item, summary, risk) || {};
  const imageAnalysis = listingImageAnalyses.get(key)?.analysis || {};
  const { state: guideState } = resolvedUsedPriceGuideState(item, stageComps);
  const guide = guideState?.guide || {};
  const { state: receiptState } = stageComps ? resolvedPurchaseReceiptState(item, stageComps) : { state: null };
  const receipt = receiptState?.status === 'done' ? receiptState.receipt || {} : {};
  const listingImages = (Array.isArray(item?.imageUrls) ? item.imageUrls : []).map((url, idx) => ({
    imageUrl: url,
    index: idx + 1,
    label: `매물 사진 ${idx + 1}`,
  }));
  const analyzedImages = imageAnalysisEntries(item);
  const allComps = comparisonItems(stageComps);
  const matchedComps = filteredComparisonItems(item, stageComps) || comparisonFilterCandidates(item, stageComps, allComps.length || 999) || [];
  const issuedAt = new Date().toLocaleString('ko-KR');
  const title = item?.title || summary.productName || '중고 매물 구매 리포트';
  const productNameText = reportValue(summary.productName || fallbackSearchQuery(item), '식별된 제품 정보 없음');
  const newPriceText = reportValue(summary.newPrice || summary.newPriceLabel || summary.estimatedNewPriceLabel, '신품가 확인 필요');
  const makerText = reportValue(summary.makerOrSeller || summary.maker || summary.brand, '제조사/판매처 확인 필요');
  const searchQueryText = reportValue(productSummaryQueries(summary, item).join(', '), '검색어 없음');
  const chronicDefects = [
    ...(Array.isArray(risk.chronicDefects) ? risk.chronicDefects : []),
    ...(Array.isArray(risk.commonDefects) ? risk.commonDefects : []),
  ];
  const relatedIssues = [
    ...(Array.isArray(risk.relatedIssues) ? risk.relatedIssues : []),
    ...(Array.isArray(risk.marketRisks) ? risk.marketRisks : []),
    ...(Array.isArray(risk.issueItems) ? risk.issueItems : []),
  ];
  const riskItems = [...chronicDefects, ...relatedIssues, ...(Array.isArray(risk.riskItems) ? risk.riskItems : []), ...(Array.isArray(risk.warnings) ? risk.warnings : [])];
  const checklist = [
    ...(Array.isArray(risk.purchaseChecklist) ? risk.purchaseChecklist : []),
    ...(Array.isArray(textAnalysis.checklist) ? textAnalysis.checklist : []),
    ...(Array.isArray(imageAnalysis.checklist) ? imageAnalysis.checklist : []),
    ...(Array.isArray(receipt.cautions) ? receipt.cautions : []),
  ];
  const comparisonRows = matchedComps.map(
    (candidate) => `
      <tr>
        <td>${escapeHtml(candidate.platformLabel || candidate.platform || '-')}</td>
        <td>${escapeHtml(candidate.title || '-')}</td>
        <td>${escapeHtml(candidate.priceLabel || '-')}</td>
        <td>${escapeHtml(candidate.saleStatus || '-')}</td>
      </tr>
    `
  );
  const listingPhotoPages = chunkReportItems(listingImages, 6)
    .map(
      (images, idx) => `
        <section class="report-page report-page--photos">
          <h2>Step 1 매물 사진 ${idx + 1}/${Math.ceil((listingImages.length || 1) / 6)}</h2>
          ${renderReportPhotoGrid(images, { compact: true })}
        </section>
      `
    )
    .join('');
  const analysisImages = analyzedImages.length ? analyzedImages : listingImages;
  const analysisPhotoPages = chunkReportItems(analysisImages, 4)
    .map(
      (images, idx) => `
        <section class="report-page report-page--analysis-photos">
          <h2>Step 2 사진별 상태 분석 ${idx + 1}/${Math.ceil((analysisImages.length || 1) / 4)}</h2>
          ${renderReportPhotoGrid(images, { annotate: true, compact: true })}
        </section>
      `
    )
    .join('');
  return `<!doctype html>
    <html lang="ko">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeHtml(title)} - 구매 리포트</title>
        <style>
          @page { size: A4; margin: 0; }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          :root { --bob-orange: #ff6f0f; --bob-orange-soft: #fff7ed; --bob-mint: #13b8a6; --bob-ink: #111827; --bob-line: #e8edf4; }
          body {
            margin: 0;
            background:
              radial-gradient(circle at 8% 0%, rgba(255, 111, 15, 0.12), transparent 34%),
              radial-gradient(circle at 100% 8%, rgba(19, 184, 166, 0.12), transparent 30%),
              #f6f8fb;
            color: var(--bob-ink);
            font-family: Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }
          .print-actions { position: sticky; top: 0; z-index: 20; display: flex; justify-content: flex-end; padding: 12px; background: rgba(255,255,255,.94); border-bottom: 1px solid #e5e7eb; }
          .print-actions button { border: 0; border-radius: 999px; padding: 11px 18px; background: #111827; color: #fff; font-weight: 950; cursor: pointer; }
          main { width: 210mm; margin: 18px auto 42px; }
          .report-cover,
          .report-page {
            width: 210mm;
            height: 297mm;
            min-height: 297mm;
            margin: 0 auto 18px;
            padding: 14mm;
            overflow: hidden;
            border: 1px solid rgba(226, 232, 240, 0.94);
            border-radius: 0;
            background: rgba(255,255,255,.94);
            box-shadow: 0 18px 55px rgba(15,23,42,.10);
            page-break-after: always;
            break-after: page;
          }
          .report-page:last-child { page-break-after: auto; break-after: auto; }
          .report-cover {
            display: grid;
            grid-template-columns: auto minmax(0, 1fr);
            gap: 18px;
            align-items: center;
            background:
              linear-gradient(135deg, rgba(255, 247, 237, 0.98), rgba(236, 253, 245, 0.92)),
              #fff;
            border-color: rgba(255, 111, 15, 0.18);
          }
          .report-logo {
            display: grid;
            place-items: center;
            width: 112px;
            height: 112px;
            border-radius: 30px;
            background: #fff;
            box-shadow: 0 18px 42px rgba(255, 111, 15, 0.18);
          }
          .report-logo img {
            display: block;
            width: 88px;
            height: 88px;
            object-fit: contain;
          }
          .report-cover-copy {
            display: grid;
            gap: 9px;
          }
          .report-kicker { color: #ea580c; font-size: 12px; font-weight: 950; letter-spacing: .02em; }
          h1, h2, h3 { margin: 0; }
          h1 { font-size: 28px; line-height: 1.25; }
          h2 { margin-bottom: 14px; padding-bottom: 10px; border-bottom: 2px solid rgba(255, 111, 15, 0.34); font-size: 21px; }
          h3 { margin-bottom: 8px; font-size: 15px; }
          p {
            margin: 0;
            line-height: 1.58;
            overflow-wrap: anywhere;
            word-break: keep-all;
          }
          .report-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
          .report-block { padding: 15px; border: 1px solid var(--bob-line); border-radius: 20px; background: linear-gradient(180deg, #fff, #fbfcff); break-inside: avoid; box-shadow: 0 8px 20px rgba(15,23,42,.04); }
          .report-block--wide { grid-column: 1 / -1; }
          .report-muted { color: #94a3b8; font-weight: 800; }
          dl { display: grid; grid-template-columns: 124px 1fr; gap: 8px 12px; margin: 0; }
          dt { color: #64748b; font-size: 12px; font-weight: 950; }
          dd { margin: 0; font-weight: 850; }
          .verdict { display: inline-flex; width: fit-content; padding: 9px 13px; border-radius: 999px; background: #111827; color: #fff; font-weight: 950; box-shadow: 0 10px 20px rgba(17,24,39,.18); }
          .report-list { margin: 0; padding-left: 18px; }
          .report-list li { margin: 5px 0; line-height: 1.48; }
          .report-photo-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
          .report-photo-grid--compact { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .report-photo-card { margin: 0; border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; background: #fff; break-inside: avoid; page-break-inside: avoid; }
          .report-photo-frame { position: relative; display: grid; place-items: center; background: #f3f4f6; }
          .report-photo-frame img { display: block; width: 100%; height: 78mm; object-fit: contain; }
          .report-photo-grid--compact .report-photo-frame img { height: 57mm; }
          .report-photo-grid--annotated .report-photo-frame img { height: 82mm; }
          .report-photo-grid--compact.report-photo-grid--annotated .report-photo-frame img { height: 48mm; }
          .report-photo-card figcaption { display: grid; gap: 5px; min-height: 12mm; padding: 6px 9px; font-size: 11px; line-height: 1.35; }
          .report-photo-card figcaption b { font-size: 12px; }
          .report-photo-card figcaption span { color: #475569; font-weight: 700; }
          .report-photo-card figcaption ul { margin: 0; padding-left: 16px; color: #b91c1c; font-weight: 800; }
          .report-defect-layer { position: absolute; inset: 0; pointer-events: none; }
          .report-defect-marker {
            position: absolute;
            border: 3px solid rgba(239, 68, 68, 0.88);
            border-radius: 52% 46% 49% 55% / 48% 56% 45% 52%;
            background: rgba(239, 68, 68, 0.04);
            box-shadow:
              inset 0 0 0 2px rgba(248, 113, 113, 0.2),
              0 0 0 2px rgba(239, 68, 68, 0.14),
              0 5px 12px rgba(127, 29, 29, 0.16);
            transform: translate(-50%, -50%) rotate(-2deg);
          }
          .report-defect-marker::after {
            content: "";
            position: absolute;
            inset: -5px;
            border: 2px solid rgba(244, 63, 94, 0.48);
            border-radius: 45% 55% 50% 48% / 54% 44% 56% 46%;
            transform: rotate(4deg);
          }
          .report-defect-marker b { position: absolute; left: 100%; top: 50%; min-width: 84px; max-width: 180px; margin-left: 8px; padding: 5px 7px; border-radius: 10px; background: rgba(127,29,29,.92); color: #fff; font-size: 10px; line-height: 1.25; transform: translateY(-50%) rotate(1deg); }
          .report-receipt {
            width: min(520px, 100%);
            margin: 0 auto;
            padding: 22px 20px 18px;
            color: #1f2937;
            background:
              linear-gradient(90deg, rgba(0,0,0,.03) 1px, transparent 1px) 0 0 / 9px 9px,
              linear-gradient(#fffdf7, #fffaf0);
            border: 1px solid rgba(251, 191, 36, 0.34);
            border-radius: 18px;
            box-shadow: 0 18px 36px rgba(120, 53, 15, 0.14);
            break-inside: avoid;
          }
          .report-receipt header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding-bottom: 12px; border-bottom: 1px dashed rgba(120, 53, 15, 0.22); }
          .report-receipt header h3 { margin: 0; font-size: 18px; line-height: 1.3; }
          .report-receipt header span { flex: 0 0 auto; padding: 7px 10px; border-radius: 999px; background: #111827; color: #fff; font-weight: 950; font-size: 12px; }
          .report-receipt-row,
          .report-receipt-prices div { display: flex; justify-content: space-between; gap: 12px; padding: 7px 0; border-bottom: 1px solid rgba(120, 53, 15, 0.08); }
          .report-receipt small { color: #8a5a1f; font-size: 11px; font-weight: 950; }
          .report-receipt b { font-weight: 950; }
          .report-receipt hr { height: 1px; margin: 13px 0; border: 0; border-top: 1px dashed rgba(120, 53, 15, 0.28); }
          .report-receipt section { margin: 12px 0; }
          .report-receipt section > b { display: block; margin-bottom: 5px; color: #9a3412; }
          .report-receipt-two-col { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 10px; }
          .report-receipt-disclaimer { margin-top: 12px; color: #8a5a1f; font-size: 12px; font-weight: 800; }
          .report-receipt footer { margin-top: 14px; padding-top: 10px; border-top: 1px dashed rgba(120, 53, 15, 0.22); text-align: center; color: #b45309; font-size: 11px; font-weight: 950; letter-spacing: .08em; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: left; vertical-align: top; }
          th { color: #64748b; font-weight: 950; }
          .report-text-analysis {
            display: grid;
            gap: 12px;
          }
          .report-text-analysis p,
          .report-text-analysis dd,
          .report-text-analysis li {
            color: #1f2937;
            font-size: 13px;
            font-weight: 520;
            line-height: 1.62;
            overflow-wrap: anywhere;
            word-break: keep-all;
          }
          .report-text-analysis dd {
            font-size: 12.5px;
          }
          .report-text-analysis .report-list li {
            margin: 4px 0;
          }
          @media print {
            body { background: #fff; }
            .print-actions { display: none; }
            main { width: 210mm; margin: 0; }
            .report-cover, .report-page {
              width: 210mm;
              height: 297mm;
              min-height: 297mm;
              margin: 0;
              padding: 14mm;
              border: 0;
              border-radius: 0;
              box-shadow: none;
              page-break-after: always;
              break-after: page;
            }
            .report-page:last-child { page-break-after: auto; break-after: auto; }
            .report-block, .report-photo-card { break-inside: avoid; page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="print-actions"><button type="button" onclick="window.print()">전체 분석 PDF로 저장 / 인쇄</button></div>
        <main>
          <section class="report-cover">
            <div class="report-logo">
              <img src="/icons/icon128.png" alt="Buy or Bye" />
            </div>
            <div class="report-cover-copy">
              <span class="report-kicker">BUY OR BYE 구매 판단 리포트 · ${escapeHtml(issuedAt)}</span>
              <h1>${escapeHtml(title)}</h1>
              <span class="verdict">${escapeHtml(receiptVerdictLabel(receipt.verdict))}</span>
              <p>${escapeHtml(receipt.summary || summary.summary || '최종 판단 요약이 없습니다.')}</p>
            </div>
          </section>

          <section class="report-page">
            <h2>Step 1 매물 정리</h2>
            <div class="report-grid">
              <section class="report-block">
                <h3>매물 정보</h3>
                <dl>
                  <dt>플랫폼</dt><dd>${escapeHtml(reportValue(item.platformLabel || item.platform))}</dd>
                  <dt>현재가</dt><dd>${escapeHtml(reportValue(item.priceLabel))}</dd>
                  <dt>택배</dt><dd>${escapeHtml(reportValue(shippingLine(item)))}</dd>
                  <dt>식별 제품</dt><dd>${escapeHtml(productNameText)}</dd>
                  <dt>추정 신품가</dt><dd>${escapeHtml(newPriceText)}</dd>
                </dl>
              </section>
              <section class="report-block">
                <h3>제품 식별 정보</h3>
                <dl>
                  <dt>제품명</dt><dd>${escapeHtml(productNameText)}</dd>
                  <dt>제조/판매처</dt><dd>${escapeHtml(makerText)}</dd>
                  <dt>검색어</dt><dd>${escapeHtml(searchQueryText)}</dd>
                  <dt>신품가</dt><dd>${escapeHtml(newPriceText)}</dd>
                </dl>
              </section>
              <section class="report-block report-block--wide">
                <h3>제품 설명</h3>
                <p>${escapeHtml(productSummaryDescription(summary, item))}</p>
              </section>
              <section class="report-block report-block--wide">
                <h3>판매글 본문</h3>
                <p>${escapeHtml(reportValue(item.body, '본문 없음'))}</p>
              </section>
            </div>
          </section>
          ${listingPhotoPages}

          <section class="report-page">
            <h2>Step 2 리스크 판별</h2>
            <div class="report-grid">
              <section class="report-block">
                <h3>고질병</h3>
                ${renderStaticReportObjectList(chronicDefects, undefined)}
              </section>
              <section class="report-block">
                <h3>관련 이슈</h3>
                ${renderStaticReportObjectList(relatedIssues, undefined)}
              </section>
              <section class="report-block report-block--wide">
                <h3>기타 리스크 / 경고</h3>
                ${renderStaticReportObjectList(riskItems, undefined)}
              </section>
              <section class="report-block">
                <h3>구매 전 체크리스트</h3>
                ${renderStaticReportList(checklist)}
              </section>
              <section class="report-block">
                <h3>판매자 이미지 분석</h3>
                <p>${escapeHtml(reportValue(imageAnalysis.overall || imageAnalysis.summary || imageAnalysis.comment, '이미지 분석 없음'))}</p>
              </section>
            </div>
          </section>

          <section class="report-page">
            <h2>Step 2 판매글 분석</h2>
            <div class="report-grid report-text-analysis">
              <section class="report-block report-block--wide">
                <h3>종합 분석</h3>
                <p>${escapeHtml(reportValue(reportTextAnalysis.overall || reportTextAnalysis.summary || reportTextAnalysis.comment, '판매글 분석 없음'))}</p>
              </section>
              <section class="report-block">
                <h3>판매자 판단</h3>
                <p>${escapeHtml(reportValue(reportTextAnalysis.sellerVerdict, '판매자 판단 정보 없음'))}</p>
              </section>
              <section class="report-block">
                <h3>본문 판단</h3>
                <p>${escapeHtml(reportValue(reportTextAnalysis.bodyVerdict, '본문 판단 정보 없음'))}</p>
              </section>
              <section class="report-block report-block--wide">
                <h3>주의 문구 / 누락 정보</h3>
                ${renderStaticReportObjectList([
                  ...(Array.isArray(reportTextAnalysis.redFlags) ? reportTextAnalysis.redFlags : []),
                  ...(Array.isArray(textAnalysis.issues) ? textAnalysis.issues : []),
                  ...(Array.isArray(textAnalysis.missingInfo) ? textAnalysis.missingInfo : []),
                  ...(Array.isArray(textAnalysis.warnings) ? textAnalysis.warnings : []),
                ])}
              </section>
            </div>
          </section>
          ${analysisPhotoPages}

          <section class="report-page">
            <h2>Step 3 가격 참고자료</h2>
            <div class="report-grid">
              <section class="report-block">
                <h3>가격 참고 의견</h3>
                <p>${escapeHtml(reportValue(guide.summary || guide.priceReason || receipt.priceReason, '가격 참고 의견 없음'))}</p>
              </section>
              <section class="report-block">
                <h3>가격 범위</h3>
                <dl>
                  <dt>참고 범위</dt><dd>${escapeHtml(reportValue(guide.fairPriceLabel || receipt.fairPriceLabel))}</dd>
                  <dt>네고 제안</dt><dd>${escapeHtml(reportValue(receipt.negotiationPriceLabel))}</dd>
                  <dt>구매 상한</dt><dd>${escapeHtml(reportValue(receipt.maxBuyPriceLabel))}</dd>
                  <dt>비교 매물</dt><dd>${escapeHtml(`${matchedComps.length || allComps.length}건`)}</dd>
                </dl>
              </section>
              <section class="report-block report-block--wide">
                <h3>비교 매물 목록</h3>
                ${
                  comparisonRows.length
                    ? `<table><thead><tr><th>플랫폼</th><th>제목</th><th>가격</th><th>상태</th></tr></thead><tbody>${comparisonRows.join('')}</tbody></table>`
                    : '<p class="report-muted">비교 매물이 없습니다.</p>'
                }
              </section>
            </div>
          </section>

          <section class="report-page">
            <h2>Step 4 최종 판단</h2>
            <div class="report-grid">
              <section class="report-block report-block--wide">
                <h3>최종 판단 영수증</h3>
                ${renderReportReceiptPaper(item, receipt)}
              </section>
            </div>
          </section>
        </main>
        <script>
          Promise.all(Array.from(document.images).map((img) => img.complete ? Promise.resolve() : new Promise((resolve) => {
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', resolve, { once: true });
          }))).then(() => setTimeout(() => window.print(), 350));
        </script>
      </body>
    </html>`;
}

let html2CanvasLoaderPromise = null;

function loadHtml2Canvas() {
  if (window.html2canvas) return Promise.resolve(window.html2canvas);
  if (html2CanvasLoaderPromise) return html2CanvasLoaderPromise;
  html2CanvasLoaderPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
    script.async = true;
    script.onload = () => (window.html2canvas ? resolve(window.html2canvas) : reject(new Error('html2canvas 로드 실패')));
    script.onerror = () => reject(new Error('html2canvas 로드 실패'));
    document.head.appendChild(script);
  });
  return html2CanvasLoaderPromise;
}

function waitForImagesIn(root) {
  const images = Array.from(root?.querySelectorAll?.('img') || []);
  if (!images.length) return Promise.resolve();
  return Promise.all(
    images.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise((resolve) => {
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', resolve, { once: true });
          })
    )
  );
}

function captureStageDescriptors() {
  return [
    { label: 'Step 1 매물 정리', selector: '[data-stage-one-zone]', index: 0 },
    { label: 'Step 2 리스크 판별', selector: '[data-stage-two-panel]', index: 1 },
    { label: 'Step 3 가격 참고자료', selector: '[data-stage-three-panel]', index: 2 },
    { label: 'Step 4 최종 판단', selector: '[data-stage-four-panel]', index: 3 },
  ];
}

function shouldIgnoreReportCaptureElement(el) {
  if (!el?.matches) return false;
  return el.matches(
    [
      '.price-source-link',
      '.wrong-product-btn',
      '.retry-product-summary-btn',
      '.listing-head .link',
      '.seller-chat__listing-link',
      '.receipt-reprint-btn',
      '.purchase-report-pdf-btn',
      '[data-stage-three-refresh]',
      '[data-stage-three-skip-comps]',
      '[data-stage-three-start]',
      '[data-stage-two-youtube]',
      '.stage-start-card',
      '.photo-nav',
      '.photo-dots',
      '.photo-count',
      '.image-analysis-nav',
      '.stage-three-actions',
      '.used-price-guide-btn',
    ].join(', ')
  );
}

async function capturePurchaseReportPages(item) {
  const html2canvas = await loadHtml2Canvas();
  const originalSlideIndex = stageSlideIndex;
  const originalScroll = window.scrollY;
  const wasDirectAiOpen = directAiChat.open;
  const pages = [];
  const wasSliding = $appShell?.classList.contains('is-stage-sliding');
  $appShell?.classList.remove('is-stage-sliding');
  if (wasDirectAiOpen) {
    directAiChat.open = false;
    renderDirectAiPanel();
  }
  $btnDirectAi?.classList.remove('is-active');
  for (const stage of captureStageDescriptors()) {
    const source = $current?.querySelector(stage.selector);
    if (!source) continue;
    if ($appShell?.classList.contains('app-shell--slide')) {
      stageSlideIndex = stage.index;
      updateStageSlide();
      await new Promise((resolve) => setTimeout(resolve, 280));
    } else {
      source.classList.remove('is-locked');
      source.hidden = false;
    }
    source.classList.add('report-capture-target');
    source.scrollIntoView({ block: 'start', behavior: 'auto' });
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await waitForImagesIn(source);
    updateDefectMarkerFrames(source);
    const rect = source.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      source.classList.remove('report-capture-target');
      continue;
    }
    const captureHeight = Math.ceil(Math.max(source.scrollHeight, rect.height, source.offsetHeight));
    const canvas = await html2canvas(source, {
      backgroundColor: '#f6f8fb',
      scale: Math.min(2, window.devicePixelRatio || 1.5),
      useCORS: true,
      allowTaint: false,
      logging: false,
      imageTimeout: 8000,
      width: Math.ceil(rect.width),
      height: captureHeight,
      windowWidth: Math.ceil(Math.max(document.documentElement.clientWidth, rect.width)),
      windowHeight: Math.ceil(Math.max(window.innerHeight, captureHeight)),
      ignoreElements: shouldIgnoreReportCaptureElement,
      onclone: (clonedDoc) => {
        const head = clonedDoc.head;
        if (head && !head.querySelector('link[data-report-material-icons]')) {
          const link = clonedDoc.createElement('link');
          link.rel = 'stylesheet';
          link.setAttribute('data-report-material-icons', '1');
          link.href =
            'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,600,0,0';
          head.appendChild(link);
        }
        clonedDoc.querySelectorAll('.material-symbols-rounded').forEach((icon) => {
          icon.style.fontFamily = 'Material Symbols Rounded';
          icon.style.fontWeight = '600';
          icon.style.fontStyle = 'normal';
          icon.style.lineHeight = '1';
          icon.style.fontVariationSettings = '"FILL" 0, "wght" 700, "GRAD" 0, "opsz" 24';
        });
      },
    });
    source.classList.remove('report-capture-target');
    pages.push({
      label: stage.label,
      image: canvas.toDataURL('image/png'),
      width: canvas.width,
      height: canvas.height,
    });
  }
  stageSlideIndex = originalSlideIndex;
  updateStageSlide();
  if (wasSliding) $appShell?.classList.add('is-stage-sliding');
  if (wasDirectAiOpen) {
    directAiChat.open = true;
    renderDirectAiPanel();
  }
  window.scrollTo({ top: originalScroll, behavior: 'auto' });
  return pages;
}

function renderCapturedPurchaseReportDocument(item, pages) {
  const reportIssuedAt = new Date().toLocaleString('ko-KR');
  const reportTitle = item?.title || getProductSummaryState(item)?.summary?.productName || '중고 매물 구매 리포트';
  const logoUrl = new URL('/icons/icon128.png', location.href).href;
  return `<!doctype html>
    <html lang="ko">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeHtml(reportTitle)} - 구매 리포트</title>
        <style>
          @page { size: A4; margin: 10mm; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            background: #eef2f7;
            color: #111827;
            font-family: Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }
          .print-actions {
            position: sticky;
            top: 0;
            z-index: 10;
            display: flex;
            justify-content: flex-end;
            padding: 12px;
            background: rgba(255, 255, 255, 0.94);
            border-bottom: 1px solid #e5e7eb;
          }
          .print-actions button {
            border: 0;
            border-radius: 999px;
            padding: 10px 14px;
            background: #111827;
            color: #fff;
            font-weight: 900;
            cursor: pointer;
          }
          main { width: min(1040px, calc(100% - 28px)); margin: 18px auto 44px; }
          .report-cover,
          .capture-page {
            margin-bottom: 18px;
            padding: 18px;
            border-radius: 24px;
            background: #fff;
            box-shadow: 0 16px 50px rgba(15, 23, 42, 0.12);
          }
          .report-cover {
            display: grid;
            grid-template-columns: auto minmax(0, 1fr);
            gap: 16px;
            align-items: center;
            background: linear-gradient(135deg, #fff7ed, #ecfdf5);
          }
          .report-logo {
            display: grid;
            place-items: center;
            width: 84px;
            height: 84px;
            border-radius: 22px;
            background: #fff;
          }
          .report-logo img { width: 64px; height: 64px; object-fit: contain; }
          .report-kicker { color: #ea580c; font-size: 12px; font-weight: 950; }
          h1, h2, p { margin: 0; }
          h1 { font-size: 24px; line-height: 1.25; }
          .report-cover p { margin-top: 8px; color: #4b5563; font-weight: 700; line-height: 1.45; }
          .capture-page {
            page-break-after: always;
            break-after: page;
          }
          .capture-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }
          .capture-page h2 {
            margin: 0 0 10px;
            padding-bottom: 8px;
            border-bottom: 2px solid #111827;
            font-size: 18px;
          }
          .capture-page img {
            display: block;
            width: 100%;
            height: auto;
            border-radius: 18px;
            background: #f8fafc;
          }
          @media print {
            body { background: #fff; }
            .print-actions { display: none; }
            main { width: 100%; margin: 0; }
            .report-cover,
            .capture-page {
              margin: 0;
              padding: 0;
              border-radius: 0;
              box-shadow: none;
            }
            .report-cover { margin-bottom: 8mm; }
            .capture-page h2 { margin-bottom: 4mm; }
            .capture-page img { border-radius: 0; }
          }
        </style>
      </head>
      <body>
        <div class="print-actions">
          <button type="button" onclick="window.print()">전체 분석 PDF로 저장 / 인쇄</button>
        </div>
        <main>
          <section class="report-cover">
            <div class="report-logo"><img src="${escapeAttr(logoUrl)}" alt="Buy or Bye" /></div>
            <div>
              <span class="report-kicker">BUY OR BYE 구매 판단 리포트 · ${escapeHtml(reportIssuedAt)}</span>
              <h1>${escapeHtml(reportTitle)}</h1>
              <p>Step 1부터 Step 4까지의 분석 화면을 캡처해 그대로 정리했습니다.</p>
            </div>
          </section>
          ${
            pages.length
              ? pages
                  .map(
                    (page) => `
                      <section class="capture-page">
                        <h2>${escapeHtml(page.label)}</h2>
                        <img src="${escapeAttr(page.image)}" alt="${escapeAttr(page.label)}" />
                      </section>
                    `
                  )
                  .join('')
              : '<section class="capture-page"><p>출력할 분석 화면이 없습니다.</p></section>'
          }
        </main>
        <script>
          Promise.all(Array.from(document.images).map((img) => img.complete ? Promise.resolve() : new Promise((resolve) => {
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', resolve, { once: true });
          }))).then(() => setTimeout(() => window.print(), 250));
        </script>
      </body>
    </html>`;
}

async function openPurchaseReportPdf(item, comps) {
  const hasLiveStages = Boolean($current?.querySelector('[data-stage-one-zone]'));
  if (hasLiveStages) updateDefectMarkerFrames($current);
  const html = renderPurchaseReportDocumentStatic(item, comps);
  const win = window.open('', '_blank', 'width=980,height=900');
  if (!win) {
    alert('팝업이 차단되어 리포트를 열지 못했습니다. 팝업 허용 후 다시 시도해 주세요.');
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

function renderPurchaseReceiptBlock(item, comps) {
  if (!item || !comps || !isCompsCollected(comps)) return '';
  const { state: filterState } = resolvedComparisonFilterState(item, comps);
  if (!isStageThreeCacheSettled(filterState?.status)) return '';
  const { state: guideState } = resolvedUsedPriceGuideState(item, comps);
  if (!isStageThreeCacheSettled(guideState?.status)) return '';
  const { key, state } = resolvedPurchaseReceiptState(item, comps);
  if (state?.status === 'loading') {
    return `
      <article class="mini-card stage-three-card purchase-receipt-card is-loading">
        <p class="stage-two-card-label">최종 판단 영수증</p>
        <h4>Step 1 · Step 2 · Step 3을 종합해 최종 결론을 만드는 중입니다...</h4>
        ${renderAiLoadingProgress(state, 'purchaseReceipt')}
        <div class="risk-loader"><span></span><span></span><span></span></div>
      </article>
    `;
  }
  if (state?.status === 'error') {
    return `
      <article class="mini-card stage-three-card purchase-receipt-card">
        <p class="stage-two-card-label">최종 판단 영수증</p>
        <h4>영수증 생성 실패</h4>
        <p>${escapeHtml(state.error || '다시 시도해 주세요.')}</p>
        <button type="button" class="chip-btn purchase-receipt-btn" data-purchase-receipt-regenerate="${escapeAttr(key)}">다시 만들기</button>
      </article>
    `;
  }
  if (state?.status === 'done') {
    const r = state.receipt || {};
    const positives = Array.isArray(r.positives) ? r.positives : [];
    const cautions = Array.isArray(r.cautions) ? r.cautions : [];
    const now = new Date().toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    const isPrinted = key ? purchaseReceiptPrintedKeys.has(key) : false;
    return `
      <article class="stage-three-card purchase-receipt-stage receipt-${escapeAttr(r.verdict || 'hold')}">
        <div class="receipt-printer">
          <div class="receipt-slot">
            <span>최종 판단 영수증 출력</span>
          </div>
          <div class="receipt-paper-reveal">
            <div class="purchase-receipt-paper">
              <header class="receipt-paper-head">
                <h4>${escapeHtml(r.headline || '최종 구매 판단')}</h4>
                <span class="purchase-receipt-verdict">${escapeHtml(receiptVerdictLabel(r.verdict))}</span>
              </header>
              <div class="receipt-row"><span>발행</span><b>${escapeHtml(now)}</b></div>
              <div class="receipt-row"><span>현재가</span><b>${escapeHtml(item.priceLabel || '—')}</b></div>
              ${shippingLine(item) ? `<div class="receipt-row"><span>택배 거래</span><b>${escapeHtml(shippingLine(item))}</b></div>` : ''}
              <div class="receipt-divider"></div>
              <section class="receipt-section receipt-final-section">
                <b>최종 결론</b>
                <p class="receipt-summary">${escapeHtml(r.summary || '')}</p>
              </section>
              <div class="receipt-price-lines">
                <div><span>가격 참고 범위</span><b>${escapeHtml(r.fairPriceLabel || '판단 어려움')}</b></div>
                <div><span>네고 제안</span><b>${escapeHtml(r.negotiationPriceLabel || '판단 어려움')}</b></div>
                <div><span>구매 상한</span><b>${escapeHtml(r.maxBuyPriceLabel || '판단 어려움')}</b></div>
              </div>
              <div class="receipt-divider"></div>
              <section class="receipt-section">
                <b>가격 참고 의견</b>
                <p>${escapeHtml(r.priceReason || '')}</p>
              </section>
              <section class="receipt-section">
                <b>리스크 반영</b>
                <p>${escapeHtml(r.riskBalance || '')}</p>
              </section>
              ${
                positives.length || cautions.length
                  ? `<div class="receipt-two-col">
                      ${positives.length ? `<section><b>좋은 점</b><ul>${positives.map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul></section>` : ''}
                      ${cautions.length ? `<section><b>확인할 점</b><ul>${cautions.map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul></section>` : ''}
                    </div>`
                  : ''
              }
              <p class="purchase-receipt-disclaimer">${escapeHtml(r.disclaimer || '')}</p>
              <footer class="receipt-paper-foot">THANK YOU / CHECK BEFORE BUY</footer>
            </div>
          </div>
          <button type="button" class="chip-btn purchase-receipt-btn receipt-reprint-btn" data-purchase-receipt-regenerate="${escapeAttr(key)}" aria-label="영수증 다시 출력">
            <span class="material-symbols-rounded" aria-hidden="true">sync</span>
          </button>
          <button type="button" class="chip-btn purchase-report-pdf-btn" data-purchase-report-pdf="${escapeAttr(key)}"${isPrinted ? '' : ' hidden'}>
            Step 1-4 전체 분석 PDF 저장
          </button>
        </div>
      </article>
    `;
  }
  if (isAutoRunEnabled()) {
    return renderAutoRunWaitCard(
      '가격 참고자료가 준비되면 최종 판단 영수증을 자동으로 만듭니다.',
      'Step 1~3 분석과 구성품 체크를 종합해 구매 판단을 생성합니다.',
      'stage-three-card purchase-receipt-card stage-four-start-card'
    );
  }
  return `
    <button type="button" class="mini-card stage-three-card purchase-receipt-card stage-start-card stage-four-start-card" data-purchase-receipt="${escapeAttr(key)}">
      <div class="stage-two-ready">
        <div>
          <p class="stage-two-card-label">최종 판단 영수증</p>
          <h3>Step 1 · Step 2 · Step 3을 종합해 최종 결론을 출력하세요.</h3>
          <p>제품 식별, 리스크 체크리스트, 판매글·사진 분석, 가격 참고자료를 모아 구매 여부와 확인할 점을 정리합니다.</p>
          <span class="stage-start-card__cta">영수증 만들기</span>
        </div>
      </div>
    </button>
  `;
}

function renderStageFourSection(item, comps) {
  if (!item || !isStepThreeDone(item)) return '';
  const stageComps = effectiveStageThreeComps(item, comps);
  const receiptHtml = renderPurchaseReceiptBlock(item, stageComps);
  if (!receiptHtml.trim()) return '';
  return `
    <section class="stage-four-panel stage-zone stage-four-zone is-active" data-stage-panel data-stage-four-panel>
      <aside class="stage-zone-label">
        <b>Step 4</b>
        <span>최종 결론</span>
      </aside>
      <div class="stage-zone-grid stage-four-zone-grid">
        ${receiptHtml}
      </div>
    </section>
  `;
}

function renderStageFiveSection(item, comps) {
  if (!item || !isPurchaseReceiptPrinted(item, comps)) return '';
  return renderSellerChatPanel(item, comps);
}

function renderCurrentListingCompareCard(item) {
  const img = Array.isArray(item?.imageUrls) && item.imageUrls.length ? item.imageUrls[0] : '';
  return `
    <aside class="current-price-card">
      <p class="block-label">현재 매물</p>
      ${
        img
          ? `<img class="current-price-card__img zoomable" src="${escapeAttr(img)}" data-full="${escapeAttr(img)}" alt="" loading="lazy" />`
          : '<div class="current-price-card__placeholder">이미지 없음</div>'
      }
      <strong class="current-price-card__price">${escapeHtml(item?.priceLabel || '가격 정보 없음')}</strong>
      ${shippingLine(item) ? `<p class="hist-meta">${escapeHtml(shippingLine(item))}</p>` : ''}
      <p class="current-price-card__title" title="${escapeAttr(item?.title || '')}">${escapeHtml(item?.title || '현재 보고 있는 매물')}</p>
    </aside>
  `;
}

function renderCompsBlock(item, comps) {
  const key = summaryKey(item);
  if (key && stageThreeComparisonSkippedKeys.has(key)) {
    return `<p class="stage-three-status-pill">비교 매물 스킵됨</p>`;
  }
  if (key && isStageThreeCollectionFinalizing(key)) {
    return renderCompsLoading(
      '자동 매물검색 결과를 정리하고 있습니다...',
      stageThreeSearchProgressState(item, 'complete'),
      'searchQuery'
    );
  }
  if (!comps || !isCompsCollected(comps)) {
    if (comps?.status === 'collecting') {
      scheduleStageThreeCollectionTimeoutRefresh(item, comps);
      return renderCompsLoading(
        '번개·당근·중고나라 검색 결과를 수집 중입니다...',
        stageThreeSearchProgressState(item, 'collecting', { startedAt: comps?.startedAt || Date.now() }),
        'searchQuery'
      );
    }
    if (key && hasSettledStageThreeCache(key)) return renderStageThreeRestoredSearchState(item);
    if (key && stageThreeActiveKeys.has(key)) return renderStageThreeInterruptedSearch(key);
    return renderStageThreeInterruptedSearch(key);
  }
  const all = comparisonItems(comps);
  if (!all.length) {
    if (key && hasSettledStageThreeCache(key)) return renderStageThreeRestoredSearchState(item);
    if ((stageThreeAutoQueryRetryCounts.get(key) || 0) < MAX_STAGE_THREE_AUTO_QUERY_RETRIES) {
      return renderCompsLoading('AI가 검색어를 다시 조정 중입니다...', searchQueryRegenerations.get(key), 'searchQuery');
    }
    return renderStageThreeEmptySearch(key);
  }
  const { filterKey, state: filterState } = resolvedComparisonFilterState(item, comps);
  const currentFilterKey = comparisonFilterKey(item, comps);
  const currentFilterState = currentFilterKey ? comparisonFilters.get(currentFilterKey) : null;
  const allMatched = filteredComparisonItems(item, comps) || [];
  if (
    (!filterState || filterState.status === 'loading') &&
    currentFilterState?.status === 'loading' &&
    currentFilterKey !== filterKey
  ) {
    return renderCompsLoading('수집한 매물을 AI가 같은 제품인지 판별 중입니다...', stageThreeSearchProgressState(item, 'identifying'), 'comparisonFilter');
  }
  if (!filterState || filterState.status === 'loading') {
    return renderCompsLoading('수집한 매물을 AI가 같은 제품인지 판별 중입니다...', stageThreeSearchProgressState(item, 'identifying'), 'comparisonFilter');
  }
  if (filterState.status === 'error') {
    return `<p class="meta empty">동일 제품 판별에 실패했습니다.</p>`;
  }
  if (!allMatched.length) {
    const key = summaryKey(item);
    if ((stageThreeAutoQueryRetryCounts.get(key) || 0) < MAX_STAGE_THREE_AUTO_QUERY_RETRIES) {
      return renderCompsLoading('AI가 더 맞는 검색어를 다시 생각하고 있습니다...', searchQueryRegenerations.get(key), 'searchQuery');
    }
    return renderStageThreeEmptySearch(key);
  }
  const st = compStats(allMatched);
  const statsTxt = st
    ? `${st.n}건 · 중앙 ${formatWon(st.median)} · ${formatWon(st.min)} ~ ${formatWon(st.max)}`
    : `${allMatched.length}건`;
  const matchNote = filterState?.fallback
    ? 'AI 동일 제품 판별 결과가 없어 수집된 비교 매물을 그대로 표시합니다.'
    : '같은 제품으로 판별된 매물';
  const listLimit = filterState?.fallback ? Math.max(allMatched.length, 8) : 8;
  const caution =
    '중고 매물 가격은 상태, 구성품, 보증, 판매완료 여부, 지역, 거래조건에 따라 크게 달라집니다. 가품일 가능성도 있으니 표시된 가격은 참고용 가격 자료로만 보고 그대로 믿고 구매 판단하면 안 됩니다.';
  return `
    <div class="comparison-filter-result">
      <div class="comparison-price-layout">
        <div class="comparison-price-list">
          <p class="meta"><strong>${escapeHtml(statsTxt)}</strong> · ${escapeHtml(matchNote)}</p>
          ${renderComparisonList(allMatched, listLimit)}
          <p class="comparison-caution">${escapeHtml(caution)}</p>
        </div>
        ${renderCurrentListingCompareCard(item)}
      </div>
    </div>
  `;
}

function renderStageThreeEmptySearch(key = '') {
  return `
    <div class="stage-three-empty-search">
      <p class="stage-three-empty-search__text">매물을 찾지 못했습니다.</p>
      <button type="button" class="chip-btn stage-three-empty-search__btn" data-stage-three-refresh="${escapeAttr(key)}">
        다시 검색
      </button>
    </div>
  `;
}

function renderStageThreeRestoredSearchState(item) {
  const key = summaryKey(item);
  const stageComps = emptyComparisonComps(item);
  const { state: filterState } = resolvedComparisonFilterState(item, stageComps);
  if (filterState?.skipped) {
    return `<p class="stage-three-status-pill">비교 매물 스킵됨</p>`;
  }
  const matchCount = Array.isArray(filterState?.matches) ? filterState.matches.length : 0;
  const summary =
    matchCount > 0
      ? `저장된 비교 결과 ${matchCount}건`
      : '저장된 Step 3 결과';
  return `
    <div class="stage-three-restored-search">
      <p class="stage-three-status-pill">${escapeHtml(summary)} · 새로고침·최근 매물에서 이어서 불러왔습니다.</p>
      <p class="meta stage-three-restored-search__hint">비교 매물 목록을 다시 보려면 상단 「다시 검색·정리」를 누르세요.</p>
    </div>
  `;
}

function renderStageThreeInterruptedSearch(key = '') {
  return `
    <div class="stage-three-empty-search">
      <p class="stage-three-empty-search__text">이전 검색이 완료되지 않았습니다.</p>
      <button type="button" class="chip-btn stage-three-empty-search__btn" data-stage-three-refresh="${escapeAttr(key)}">
        다시 검색
      </button>
    </div>
  `;
}

function renderUsedPriceGuideBlock(item, comps) {
  const stageComps = effectiveStageThreeComps(item, comps);
  if (!item || !stageComps) return '';
  const { key, state } = resolvedUsedPriceGuideState(item, stageComps);
  const currentKey = usedPriceGuideKey(item, stageComps);
  const currentState = currentKey ? usedPriceGuides.get(currentKey) : null;
  if (
    (!state || state.status === 'loading') &&
    currentState?.status === 'loading' &&
    currentKey !== key
  ) {
    const loadingState = usedPriceGuideProgressState(item, 'generating', currentState);
    return `
      <article class="mini-card stage-three-card used-price-guide-card is-loading">
        <p class="stage-two-card-label">중고 시세 참고표</p>
        <h4>번개·중고나라 기반 가격표를 정리하는 중입니다...</h4>
        <p class="mini-muted">자동 매물검색과는 별개로, 제품 정보를 바탕으로 상태별 참고가를 정리합니다.</p>
        ${renderAiLoadingProgress(loadingState, 'usedPriceGuide')}
        <div class="risk-loader"><span></span><span></span><span></span></div>
      </article>
    `;
  }
  if (!state || state.status === 'loading') {
    const listingKey = summaryKey(item);
    const loadingState = state
      ? usedPriceGuideProgressState(item, 'generating', state)
      : listingKey && isStageThreeCollectionFinalizing(listingKey)
        ? usedPriceGuideProgressState(item, 'waiting', { startedAt: stageComps.startedAt || Date.now() })
        : !isCompsCollected(stageComps)
          ? usedPriceGuideProgressState(item, 'waiting', { startedAt: stageComps.startedAt || Date.now() })
          : usedPriceGuideProgressState(item, 'waiting');
    if (stageComps && !isCompsCollected(stageComps)) scheduleStageThreeCollectionTimeoutRefresh(item, stageComps);
    return `
      <article class="mini-card stage-three-card used-price-guide-card is-loading">
        <p class="stage-two-card-label">중고 시세 참고표</p>
        <h4>번개·중고나라 기반 가격표를 정리하는 중입니다...</h4>
        <p class="mini-muted">자동 매물검색과는 별개로, 제품 정보를 바탕으로 상태별 참고가를 정리합니다.</p>
        ${renderAiLoadingProgress(loadingState, 'usedPriceGuide')}
        <div class="risk-loader"><span></span><span></span><span></span></div>
      </article>
    `;
  }
  if (state.status === 'error') {
    return `
      <article class="mini-card stage-three-card used-price-guide-card">
        <p class="stage-two-card-label">중고 시세 참고표</p>
        <h4>가격표 생성 실패</h4>
        <p>${escapeHtml(state.error || '다시 시도해 주세요.')}</p>
        <button type="button" class="chip-btn used-price-guide-btn" data-used-price-guide="${escapeAttr(key)}">가격 다시 만들기</button>
      </article>
    `;
  }
  const guide = state.guide || {};
  const rows = Array.isArray(guide.conditionPrices) ? guide.conditionPrices : [];
  const rowHtml = rows.length
    ? rows
        .slice(0, 6)
        .map(
          (row) => `
            <tr>
              <td>${escapeHtml(row.condition || '')}</td>
              <td>${escapeHtml(row.priceLabel || '')}</td>
              <td>${escapeHtml(row.comment || '')}</td>
            </tr>`
        )
        .join('')
    : `<tr><td colspan="3">상태별 가격표를 만들 근거가 부족합니다.</td></tr>`;
  return `
    <article class="mini-card stage-three-card used-price-guide-card">
      <div class="mini-card-head">
        <p class="stage-two-card-label">중고 시세 참고표</p>
        <button type="button" class="chip-btn used-price-guide-btn" data-used-price-guide="${escapeAttr(key)}">가격 다시 만들기</button>
      </div>
      <h4>${escapeHtml(guide.headline || '상태별 중고 가격 참고표')}</h4>
      <div class="comparison-price-table-wrap">
        <table class="comparison-price-table">
          <thead><tr><th>상태</th><th>가격 참고</th><th>코멘트</th></tr></thead>
          <tbody>${rowHtml}</tbody>
        </table>
      </div>
      ${guide.recommendedAction ? `<p class="comparison-caution">${escapeHtml(guide.recommendedAction)}</p>` : ''}
      ${guide.confidence ? `<p class="hist-meta">신뢰도: ${escapeHtml(guide.confidence)}${guide.sourceNote ? ` · ${escapeHtml(guide.sourceNote)}` : ''}</p>` : ''}
    </article>
  `;
}

function renderPhotoSlider(item) {
  const urls = item.imageUrls || [];
  if (!urls.length) return '<span class="empty">없음</span>';
  const key = itemKey(item);
  const idx = Math.min(Math.max(photoIndexes.get(key) || 0, 0), urls.length - 1);
  const dir = photoDirections.get(key) || 0;
  const animClass = dir > 0 ? ' slide-next' : dir < 0 ? ' slide-prev' : '';
  const src = urls[idx];
  const lightboxItems = JSON.stringify(lightboxImageItems(urls));
  const dots = urls
    .map((_, i) => `<span class="photo-dot${i === idx ? ' active' : ''}" aria-label="${i + 1}/${urls.length}"></span>`)
    .join('');
  return `
    <div class="photo-slider" data-photo-slider>
      <button type="button" class="photo-nav prev" data-photo-dir="-1" ${urls.length < 2 ? 'disabled' : ''}>‹</button>
      <img
        class="zoomable photo-main${animClass}"
        src="${escapeAttr(src)}"
        data-full="${escapeAttr(src)}"
        data-lightbox-items="${escapeAttr(lightboxItems)}"
        data-lightbox-index="${idx}"
        alt=""
        loading="lazy"
      />
      <button type="button" class="photo-nav next" data-photo-dir="1" ${urls.length < 2 ? 'disabled' : ''}>›</button>
      <div class="photo-count">${idx + 1}/${urls.length}</div>
      <div class="photo-dots">${dots}</div>
    </div>
  `;
}

function imageAnalysisEntries(item) {
  const key = summaryKey(item);
  const state = key ? listingImageAnalyses.get(key) : null;
  const analysis = state?.analysis || null;
  const urls = Array.isArray(item?.imageUrls) ? item.imageUrls : [];
  const byIndex = new Map();
  for (const img of Array.isArray(analysis?.images) ? analysis.images : []) {
    const index = Number(img?.index) || 0;
    if (!index || byIndex.has(index)) continue;
    byIndex.set(index, img);
  }
  if (!urls.length) {
    return [...byIndex.values()]
      .sort((a, b) => (Number(a.index) || 0) - (Number(b.index) || 0))
      .map((img, idx) => ({
        ...img,
        index: Number(img.index) || idx + 1,
        imageUrl: img.imageUrl || '',
        label: imageAnalysisLabel(img),
        comment: img.comment || '사진 상태 확인이 필요합니다.',
      }))
      .filter((img) => img.imageUrl || img.comment);
  }
  return urls.map((url, idx) => {
    const index = idx + 1;
    const img = byIndex.get(index) || {};
    return {
      ...img,
      index,
      imageUrl: url,
      label: imageAnalysisLabel(img),
      comment: img.comment || '사진 상태 확인이 필요합니다.',
    };
  });
}

function normalizeImageGroupLabel(label) {
  return String(label || '사진 묶음').replace(/\s+/g, ' ').trim().slice(0, 18) || '사진 묶음';
}

function imageLabelGroups(images) {
  if (!Array.isArray(images) || images.length < 2) return [];
  const grouped = new Map();
  for (const image of images) {
    const label = normalizeImageGroupLabel(image.label);
    if (!grouped.has(label)) grouped.set(label, []);
    grouped.get(label).push(image);
  }
  return [...grouped.entries()]
    .map(([label, list]) => ({
      label,
      summary: '유사한 이미지로 분류되었습니다.',
      imageIndexes: list.map((image) => image.index),
      level: list.some((image) => image.level === 'risk')
        ? 'risk'
        : list.some((image) => image.level === 'caution')
          ? 'caution'
          : list.every((image) => image.level === 'safe')
            ? 'safe'
            : 'neutral',
    }))
    .slice(0, 6);
}

function imageAnalysisGroups(item, images) {
  const key = summaryKey(item);
  const state = key ? listingImageAnalyses.get(key) : null;
  const analysis = state?.analysis || null;
  if (state?.status !== 'done' || !analysis) return [];
  if (!Array.isArray(images) || images.length < 2) return [];
  return imageLabelGroups(images);
}

function renderImageAnalysisGroups(item) {
  const images = imageAnalysisEntries(item);
  const groups = imageAnalysisGroups(item, images);
  if (!groups.length) return '';
  const imagesByIndex = new Map(images.map((image) => [Number(image.index), image]));
  return `
    <div class="image-analysis-groups" aria-label="이미지 카테고리 묶음">
      ${groups
        .map((group) => {
          const groupImages = group.imageIndexes
            .map((index) => imagesByIndex.get(Number(index)))
            .filter((image) => image?.imageUrl);
          if (!groupImages.length) return '';
          const lightboxItems = JSON.stringify(lightboxAnalysisItems(groupImages));
          return `
            <section class="image-analysis-group risk-${escapeAttr(group.level || 'neutral')}">
              <div class="image-analysis-group__head">
                <span class="image-analysis-group__label">${escapeHtml(group.label)}</span>
                <span class="image-analysis-group__count">${groupImages.length}장</span>
              </div>
              <div class="image-analysis-group__thumbs">
                ${groupImages
                  .map(
                    (image, idx) => `
                      <img
                        class="zoomable image-analysis-group__thumb"
                        src="${escapeAttr(image.imageUrl)}"
                        data-full="${escapeAttr(image.imageUrl)}"
                        data-image-width="${escapeAttr(image.imageWidth || '')}"
                        data-image-height="${escapeAttr(image.imageHeight || '')}"
                        data-label="${escapeAttr(image.label || group.label)}"
                        data-comment="${escapeAttr(image.comment || group.summary || '')}"
                        data-level="${escapeAttr(image.level || group.level || 'neutral')}"
                        data-lightbox-items="${escapeAttr(lightboxItems)}"
                        data-lightbox-index="${idx}"
                        alt=""
                        loading="lazy"
                      />
                    `
                  )
                  .join('')}
              </div>
            </section>
          `;
        })
        .join('')}
    </div>
  `;
}

function gridColumnIndex(label) {
  const value = String(label || '').trim().toUpperCase();
  if (!/^[A-Z]{1,2}$/.test(value)) return -1;
  let n = 0;
  for (const ch of value) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

function defectBoxToRect(raw) {
  const box = Array.isArray(raw)
    ? { x: raw[0], y: raw[1], width: raw[2], height: raw[3] }
    : typeof raw === 'string'
      ? (() => {
          const parts = raw
            .split(/[,\s]+/)
            .map((part) => Number(part.trim()))
            .filter(Number.isFinite);
          return parts.length >= 4 ? { x: parts[0], y: parts[1], width: parts[2], height: parts[3] } : null;
        })()
      : raw && typeof raw === 'object'
        ? raw
        : null;
  if (!box) return null;
  const normalizePercent = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return NaN;
    return n > 0 && n <= 1 ? n * 100 : n;
  };
  const left = normalizePercent(box.x ?? box.left ?? box.leftPercent);
  const top = normalizePercent(box.y ?? box.top ?? box.topPercent);
  let width = normalizePercent(box.width ?? box.w ?? box.widthPercent);
  let height = normalizePercent(box.height ?? box.h ?? box.heightPercent);
  const right = normalizePercent(box.x2 ?? box.right ?? box.rightPercent);
  const bottom = normalizePercent(box.y2 ?? box.bottom ?? box.bottomPercent);
  if (!Number.isFinite(width) && Number.isFinite(right) && Number.isFinite(left)) width = right - left;
  if (!Number.isFinite(height) && Number.isFinite(bottom) && Number.isFinite(top)) height = bottom - top;
  if (![left, top, width, height].every(Number.isFinite)) return null;
  return {
    left: Math.max(0, Math.min(99, left)),
    top: Math.max(0, Math.min(99, top)),
    width: Math.max(1, Math.min(100 - left, width)),
    height: Math.max(1, Math.min(100 - top, height)),
  };
}

function defectRectToCenterMarker(rect) {
  if (!rect) return null;
  const width = Math.max(1, Math.min(100, Number(rect.width) || 0));
  const height = Math.max(1, Math.min(100, Number(rect.height) || 0));
  const centerX = Number(rect.left) + width / 2;
  const centerY = Number(rect.top) + height / 2;
  if (![centerX, centerY, width, height].every(Number.isFinite)) return null;
  return {
    centerX: Math.max(0, Math.min(100, centerX)),
    centerY: Math.max(0, Math.min(100, centerY)),
    width,
    height,
  };
}

function gridCellToPoint(cell, gridCols = 25, gridRows = 25) {
  const cols = Math.max(1, Math.min(52, Number(gridCols) || 25));
  const rows = Math.max(1, Math.min(99, Number(gridRows) || 25));
  const match = String(cell || '').trim().toUpperCase().match(/^([A-Z]{1,2})\s*0?([1-9]|[1-9][0-9])$/);
  if (!match) return null;
  const col = gridColumnIndex(match[1]);
  const row = Number(match[2]) - 1;
  if (col < 0 || col >= cols || row < 0 || row >= rows) return null;
  return {
    col,
    row,
    centerX: ((col + 0.5) / cols) * 100,
    centerY: ((row + 0.5) / rows) * 100,
    cols,
    rows,
  };
}

function defectGridToCenterMarker(defect) {
  const gridCenter = defect?.gridCenter || defect?.centerCell || defect?.centerGrid || defect?.centerGridCell;
  const point = gridCellToPoint(gridCenter, defect?.gridCols, defect?.gridRows);
  if (!point) return null;
  const rawSize = defect?.gridSizeCells || defect?.gridSize || defect?.sizeCells || defect?.cellSize || {};
  const rawCols = Number(rawSize.cols ?? rawSize.columns ?? rawSize.width ?? rawSize.w);
  const rawRows = Number(rawSize.rows ?? rawSize.height ?? rawSize.h);
  const cellCols = Math.max(5, Math.min(point.cols, Math.round(Number.isFinite(rawCols) ? rawCols : Number.isFinite(rawRows) ? rawRows : 5)));
  const cellRows = Math.max(5, Math.min(point.rows, Math.round(Number.isFinite(rawRows) ? rawRows : rawCols || cellCols)));
  const width = Math.min(80, (cellCols / point.cols) * 100);
  const height = Math.min(80, (cellRows / point.rows) * 100);
  return {
    centerX: point.centerX,
    centerY: point.centerY,
    width,
    height,
  };
}

function defectToCenterMarker(defect) {
  const centerRaw = defect?.center || defect?.centerPercent || defect?.point || defect?.position;
  const sizeRaw = defect?.size || defect?.markerSize || defect?.extent;
  const normalizePercent = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return NaN;
    return n > 0 && n <= 1 ? n * 100 : n;
  };
  const centerX = normalizePercent(centerRaw?.x ?? centerRaw?.cx ?? centerRaw?.left ?? defect?.centerX ?? defect?.cx);
  const centerY = normalizePercent(centerRaw?.y ?? centerRaw?.cy ?? centerRaw?.top ?? defect?.centerY ?? defect?.cy);
  const radius = normalizePercent(sizeRaw?.radius ?? defect?.radius ?? defect?.r);
  const diameter = normalizePercent(sizeRaw?.diameter ?? defect?.diameter);
  const width = normalizePercent(sizeRaw?.width ?? sizeRaw?.w ?? defect?.markerWidth ?? defect?.width ?? (Number.isFinite(diameter) ? diameter : Number.isFinite(radius) ? radius * 2 : NaN));
  const height = normalizePercent(sizeRaw?.height ?? sizeRaw?.h ?? defect?.markerHeight ?? defect?.height ?? (Number.isFinite(diameter) ? diameter : Number.isFinite(radius) ? radius * 2 : NaN));
  if ([centerX, centerY].every(Number.isFinite)) {
    const markerWidth = Number.isFinite(width) ? width : 6;
    const markerHeight = Number.isFinite(height) ? height : markerWidth;
    return {
      centerX: Math.max(0, Math.min(100, centerX)),
      centerY: Math.max(0, Math.min(100, centerY)),
      width: Math.max(1.5, Math.min(80, markerWidth)),
      height: Math.max(1.5, Math.min(80, markerHeight)),
    };
  }
  return null;
}

function enforceDefectMarkerMinimum(marker) {
  if (!marker) return null;
  const centerX = Math.max(0, Math.min(100, Number(marker.centerX)));
  const centerY = Math.max(0, Math.min(100, Number(marker.centerY)));
  const rawWidth = Math.max(1, Math.min(80, Number(marker.width) || 0));
  const rawHeight = Math.max(1, Math.min(80, Number(marker.height) || rawWidth));
  const width = Math.max(rawWidth, IMAGE_DEFECT_MARKER_MIN_PERCENT);
  const height = Math.max(rawHeight, IMAGE_DEFECT_MARKER_MIN_PERCENT);
  if (![centerX, centerY, width, height].every(Number.isFinite)) return null;
  return { centerX, centerY, width, height };
}

function gridCellToRect(cell, gridCols = 25, gridRows = 25) {
  const cols = Math.max(1, Math.min(52, Number(gridCols) || 25));
  const rows = Math.max(1, Math.min(99, Number(gridRows) || 25));
  const parseCell = (value) => {
    const match = String(value || '').trim().toUpperCase().match(/^([A-Z]{1,2})\s*0?([1-9]|[1-9][0-9])$/);
    if (!match) return null;
    const col = gridColumnIndex(match[1]);
    const row = Number(match[2]) - 1;
    if (col < 0 || col >= cols || row < 0 || row >= rows) return null;
    return { col, row };
  };
  const value = String(cell || '').trim().toUpperCase();
  const rangeMatch = value.match(/^([A-Z]{1,2}\s*0?(?:[1-9]|[1-9][0-9]))\s*(?:-|~|–|—|TO|부터|에서)\s*([A-Z]{1,2}\s*0?(?:[1-9]|[1-9][0-9]))$/);
  const start = rangeMatch ? parseCell(rangeMatch[1]) : parseCell(value);
  const end = rangeMatch ? parseCell(rangeMatch[2]) : start;
  if (!start || !end) return null;

  let left = Math.min(start.col, end.col);
  let right = Math.max(start.col, end.col) + 1;
  let top = Math.min(start.row, end.row);
  let bottom = Math.max(start.row, end.row) + 1;
  if (!rangeMatch) {
    left = Math.max(0, left - 0.45);
    right = Math.min(cols, right + 0.45);
    top = Math.max(0, top - 0.45);
    bottom = Math.min(rows, bottom + 0.45);
  }
  return {
    left: (left / cols) * 100,
    top: (top / rows) * 100,
    width: ((right - left) / cols) * 100,
    height: ((bottom - top) / rows) * 100,
  };
}

function renderImageDefectMarkers(image) {
  const markers = (Array.isArray(image?.defects) ? image.defects : [])
    .map((defect) => {
      const rawGridCell =
        defect?.gridCell ||
        defect?.gridRange ||
        defect?.range ||
        defect?.cell ||
        (defect?.startCell && defect?.endCell ? `${defect.startCell}-${defect.endCell}` : '');
      const bboxRect = defectBoxToRect(defect?.bbox || defect?.bboxPercent || defect?.box || defect?.rect || defect?.area);
      const rect = bboxRect || gridCellToRect(rawGridCell, defect?.gridCols, defect?.gridRows);
      const marker = enforceDefectMarkerMinimum(
        defectToCenterMarker(defect) || defectRectToCenterMarker(rect) || defectGridToCenterMarker(defect)
      );
      if (!marker) return '';
      const description = String(defect?.description || defect?.detail || '하자 의심')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 44);
      const size = String(defect?.approximateSize || '').replace(/\s+/g, ' ').trim().slice(0, 24);
      const label = size ? `${description} · ${size}` : description;
      const severity = String(defect?.severity || 'caution').toLowerCase();
      const labelSide =
        marker.centerX + marker.width / 2 > 66
          ? 'left'
          : marker.centerX - marker.width / 2 < 12
            ? 'right'
            : marker.centerY - marker.height / 2 < 16
              ? 'bottom'
              : marker.centerY + marker.height / 2 > 82
                ? 'top'
                : 'right';
      const left = marker.centerX - marker.width / 2;
      const top = marker.centerY - marker.height / 2;
      const width = marker.width;
      const height = marker.height;
      return `
        <button
          type="button"
          class="image-defect-marker image-defect-marker--label-${labelSide} risk-${escapeAttr(severity)}"
          style="left:${left.toFixed(2)}%;top:${top.toFixed(2)}%;width:${width.toFixed(2)}%;height:${height.toFixed(2)}%"
          title="${escapeAttr(label)}"
          aria-label="${escapeAttr(label)}"
        >
          <span class="image-defect-marker__dot"></span>
          <span class="image-defect-marker__label">${escapeHtml(description)}</span>
        </button>
      `;
    })
    .filter(Boolean)
    .join('');
  return markers ? `<div class="image-defect-markers" aria-label="하자 의심 위치">${markers}</div>` : '';
}

function containImageFrame(containerWidth, containerHeight, imageWidth, imageHeight) {
  if (!containerWidth || !containerHeight || !imageWidth || !imageHeight) return null;
  const imageRatio = imageWidth / imageHeight;
  const wrapRatio = containerWidth / containerHeight;
  let width = containerWidth;
  let height = containerHeight;
  if (wrapRatio > imageRatio) {
    height = containerHeight;
    width = height * imageRatio;
  } else {
    width = containerWidth;
    height = width / imageRatio;
  }
  return {
    width,
    height,
    left: (containerWidth - width) / 2,
    top: (containerHeight - height) / 2,
  };
}

function markerImageDimensions(img) {
  const dataWidth = Number(img?.dataset?.imageWidth);
  const dataHeight = Number(img?.dataset?.imageHeight);
  const naturalWidth = Number(img?.naturalWidth);
  const naturalHeight = Number(img?.naturalHeight);
  return {
    width: naturalWidth > 0 ? naturalWidth : dataWidth,
    height: naturalHeight > 0 ? naturalHeight : dataHeight,
  };
}

function updateDefectMarkerFrames(root = document) {
  const boxes = root?.matches?.('.annotated-photo-box')
    ? [root]
    : Array.from(root?.querySelectorAll?.('.annotated-photo-box') || []);
  boxes.forEach((box) => {
    const img = box.querySelector('img');
    const markers = box.querySelector('.image-defect-markers');
    if (!img || !markers) return;
    if (!img.complete || !img.naturalWidth || !img.naturalHeight) {
      img.addEventListener('load', () => updateDefectMarkerFrames(box), { once: true });
      return;
    }
    const boxRect = box.getBoundingClientRect();
    const dims = markerImageDimensions(img);
    const frame = containImageFrame(boxRect.width, boxRect.height, dims.width, dims.height);
    if (!frame) return;
    markers.style.width = `${frame.width}px`;
    markers.style.height = `${frame.height}px`;
    markers.style.left = `${frame.left}px`;
    markers.style.top = `${frame.top}px`;
  });
}

function updateLightboxOverlayFrame() {
  if (!$lightboxOverlay || !$lightboxImg || !$lightboxImg.complete || !$lightboxImg.naturalWidth || !$lightboxImg.naturalHeight) {
    return;
  }
  const wrapRect = $lightboxImg.parentElement?.getBoundingClientRect();
  if (!wrapRect?.width || !wrapRect?.height) return;
  const dims = markerImageDimensions($lightboxImg);
  const frame = containImageFrame(wrapRect.width, wrapRect.height, dims.width, dims.height);
  if (!frame) return;
  $lightboxImg.style.width = `${frame.width}px`;
  $lightboxImg.style.height = `${frame.height}px`;
  $lightboxOverlay.style.width = `${frame.width}px`;
  $lightboxOverlay.style.height = `${frame.height}px`;
  $lightboxOverlay.style.left = `${frame.left}px`;
  $lightboxOverlay.style.top = `${frame.top}px`;
}

function renderImageAnalysisSlider(item) {
  const key = summaryKey(item);
  const state = key ? listingImageAnalyses.get(key) : null;
  const analysis = state?.analysis || null;
  const images = imageAnalysisEntries(item);
  if (!images.length) {
    return `<p class="mini-muted">${escapeHtml(analysis?.overall || '분석할 사진을 불러오지 못했습니다.')}</p>`;
  }
  const idx = Math.min(Math.max(imageAnalysisIndexes.get(key) || 0, 0), images.length - 1);
  const dir = imageAnalysisDirections.get(key) || 0;
  const animClass = dir > 0 ? ' slide-next' : dir < 0 ? ' slide-prev' : '';
  const current = images[idx];
  const label = imageAnalysisLabel(current);
  const lightboxItems = JSON.stringify(lightboxAnalysisItems(images));
  const dots = images
    .map((_, i) => `<span class="photo-dot${i === idx ? ' active' : ''}" aria-label="${i + 1}/${images.length}"></span>`)
    .join('');
  return `
    <div class="image-analysis-slide-wrap" data-image-analysis-slide-wrap>
      <div class="photo-slider image-analysis-slider" data-image-analysis-slider>
        <button type="button" class="photo-nav prev image-analysis-nav" data-image-analysis-dir="-1" ${images.length < 2 ? 'disabled' : ''}>‹</button>
        <div class="annotated-photo-stage">
          <div class="annotated-photo-box">
            <img
              class="zoomable photo-main${animClass} image-analysis-main"
              src="${escapeAttr(current.imageUrl)}"
              data-full="${escapeAttr(current.imageUrl)}"
              data-image-width="${escapeAttr(current.imageWidth || '')}"
              data-image-height="${escapeAttr(current.imageHeight || '')}"
              data-label="${escapeAttr(label)}"
              data-comment="${escapeAttr(current.comment || '')}"
              data-level="${escapeAttr(current.level || 'neutral')}"
              data-lightbox-items="${escapeAttr(lightboxItems)}"
              data-lightbox-index="${idx}"
              alt=""
              loading="lazy"
            />
            <span class="image-analysis-badge risk-${escapeAttr(current.level || 'neutral')}">${escapeHtml(label)}</span>
            ${renderImageDefectMarkers(current)}
          </div>
        </div>
        <button type="button" class="photo-nav next image-analysis-nav" data-image-analysis-dir="1" ${images.length < 2 ? 'disabled' : ''}>›</button>
        <div class="photo-count">${idx + 1}/${images.length}</div>
        <div class="photo-dots">${dots}</div>
      </div>
      <p class="image-analysis-comment risk-${escapeAttr(current.level || 'neutral')}">${escapeHtml(current.comment)}</p>
    </div>
  `;
}

function renderItem(item, comps) {
  $appShell?.classList.toggle('is-empty-state', !item);
  if (!item) {
    window.clearInterval(photoSliderAutoTimer);
    window.clearInterval(imageAnalysisAutoTimer);
    photoSliderAutoTimer = 0;
    imageAnalysisAutoTimer = 0;
    $current.innerHTML = `
      <article class="mini-card mini-card--empty">
        <img class="empty-extension-icon" src="/icons/icon128.png" alt="" width="72" height="72" />
        <h2>매물 대기</h2>
        <p class="empty">분석할 중고 매물을 아직 받지 못했습니다. 왼쪽 URL 버튼을 눌러 중고나라·번개장터·당근 링크를 붙여넣거나, 매물 페이지 우측 하단의 확장 아이콘을 눌러 이 분석 웹으로 전송하세요.</p>
        <p class="empty empty-sub">매물이 들어오면 제품 식별, 하자·고질병 체크, 가격 참고자료, 최종 구매 판단, 판매자에게 보낼 문구 추천까지 순서대로 정리됩니다.</p>
      </article>
    `;
    return;
  }
  clearAllYoutubePlayers();
  const plat = ['daangn', 'joongna'].includes(item.platform) ? item.platform : 'bunjang';
  const seller = sellerLine(item.seller, item.platform);
  const shipping = shippingLine(item);
  const hasStageTwo = Boolean(renderStageTwoSection(item));
  $current.innerHTML = `
    <section class="stage-zone stage-one-zone${hasStageTwo ? ' has-next-stage' : ''}" data-stage-panel data-stage-one-zone>
      <aside class="stage-zone-label">
        <b>Step 1</b>
        <span>매물 정리</span>
      </aside>
      <div class="stage-zone-grid">
        <article class="mini-card mini-card--hero">
          <div class="listing-head">
            <span class="badge ${plat}">${escapeHtml(item.platformLabel || item.platform)}</span>
            ${item.pageUrl ? `<a class="link" href="${escapeAttr(item.pageUrl)}" target="_blank" rel="noopener">판매글 열기</a>` : ''}
          </div>
          <div>
            <h3 class="item-title hover-full" title="${escapeAttr(item.title || '(제목 없음)')}">${escapeHtml(item.title || '(제목 없음)')}</h3>
            <p class="price listing-price-line">
              <span>${escapeHtml(item.priceLabel || '—')}</span>
              ${shipping ? `<small>${escapeHtml(shipping)}</small>` : ''}
            </p>
            <p class="listing-mini-meta">${escapeHtml([seller, formatTime(item.exportedAt)].filter(Boolean).join(' · '))}</p>
          </div>
        </article>

        <article class="mini-card mini-card--text">
          <p class="block-label">본문</p>
          ${renderScrollableText(item.body || '', 'body-text', `body-${itemKey(item)}`, 0)}
        </article>

        <article class="mini-card mini-card--photos">
          <div class="mini-card-head">
            <p class="block-label">매물 사진</p>
          </div>
          ${renderPhotoSlider(item)}
        </article>

        ${renderProductSummaryBlock(item)}
      </div>
    </section>
    ${renderStageTwoSection(item)}
    ${renderStageThreeSection(item, comps)}
    ${renderStageFourSection(item, comps)}
    ${renderStageFiveSection(item, comps)}
    ${renderStageSlideControls()}
  `;
  bindImageZoom($current);
  bindPhotoSlider($current, item);
  bindScrollText($current);
  bindStageSlideControls($current);
  bindStageTwoFlow($current, item);
  syncStageTwoYoutubePlayers($current);
  bindStageThreeFlow($current, item);
  bindUsedPriceGuide($current, item);
  bindPurchaseReceipt($current, item);
  const stageCompsForReceipt = item ? effectiveStageThreeComps(item, comps) : null;
  const { key: receiptKey, state: receiptState } =
    item && stageCompsForReceipt ? resolvedPurchaseReceiptState(item, stageCompsForReceipt) : { key: '', state: null };
  const receiptDone = receiptState?.status === 'done';
  const receiptPrinted = Boolean(receiptKey && purchaseReceiptPrintedKeys.has(receiptKey));
  window.requestAnimationFrame(() => {
    if (receiptDone && !receiptPrinted) {
      followPurchaseReceiptPrint($current);
    }
  });
  bindImageAnalysisSlider($current, item);
  bindProductSummaryRetry($current, item);
  bindProductImageSearch($current, item);
  bindSellerChatFlow($current, item);
  lastStageThreeCompsRenderKey = stageThreeCompsRenderKey(item, comps);
  syncStagePanels(item);
  ensureCachedStageTwoFollowups(item);
  if (isStepThreeUnlocked(item)) {
    scheduleComparisonFilter(item);
    void ensureUsedPriceGuide(item);
  }
  refreshDirectAiPanelIfOpen();
}

function setHistoryOpen(open) {
  $recentDrawer?.classList.toggle('open', open);
  $recentDrawer?.setAttribute('aria-hidden', open ? 'false' : 'true');
  if ($drawerBackdrop) $drawerBackdrop.hidden = !open;
}

function setLightboxImage(item, opts = {}) {
  const src = item?.src || '';
  if (!$lightboxImg || !src) return;
  const content = $lightbox?.querySelector('.lightbox-content');
  const motionClass =
    opts.dir > 0 ? 'is-slide-next' : opts.dir < 0 ? 'is-slide-prev' : opts.opening ? 'is-slide-open' : '';
  if (content && motionClass) {
    content.classList.remove('is-slide-open', 'is-slide-next', 'is-slide-prev');
    void content.offsetWidth;
  }
  $lightboxImg.src = src;
  $lightboxImg.setAttribute('data-image-width', item?.imageWidth || '');
  $lightboxImg.setAttribute('data-image-height', item?.imageHeight || '');
  if ($lightboxOverlay) {
    $lightboxOverlay.innerHTML =
      item?.kind === 'analysis'
        ? renderImageDefectMarkers(item)
        : item?.kind === 'gridDebug'
          ? renderGridDebugSelectionMarkers(item)
          : '';
    updateLightboxOverlayFrame();
  }
  if ($lightboxBadge) {
    const label = item?.kind === 'analysis' || item?.kind === 'gridDebug' ? String(item?.label || '').trim() : '';
    $lightboxBadge.textContent = label;
    $lightboxBadge.hidden = !label;
    $lightboxBadge.className = `image-analysis-badge image-analysis-badge--inline lightbox-badge risk-${String(item?.level || 'neutral').trim() || 'neutral'}`;
  }
  if ($lightboxCaption) {
    const caption = String(item?.comment || '').trim();
    $lightboxCaption.textContent = caption;
    $lightboxCaption.hidden = !caption;
    $lightboxCaption.className = `lightbox-caption risk-${String(item?.level || 'neutral').trim() || 'neutral'}`;
  }
  const canSlide = lightboxState.items.length > 1;
  if ($lightboxPrev) $lightboxPrev.hidden = !canSlide;
  if ($lightboxNext) $lightboxNext.hidden = !canSlide;
  if ($lightboxCount) {
    $lightboxCount.textContent = `${lightboxState.index + 1}/${lightboxState.items.length}`;
    $lightboxCount.hidden = !lightboxState.items.length;
  }
  $lightboxImg.onload = updateLightboxOverlayFrame;
  if (content && motionClass) content.classList.add(motionClass);
}

function openLightbox(src, opts = {}) {
  if (!$lightbox || !$lightboxImg || !src) return;
  if (lightboxCloseTimer) {
    window.clearTimeout(lightboxCloseTimer);
    lightboxCloseTimer = 0;
  }
  const items = Array.isArray(opts.items) && opts.items.length ? opts.items : [{ src, kind: opts.kind || '', label: opts.label || '', comment: opts.comment || '', level: opts.level || 'neutral' }];
  const startIndex = Math.max(0, Math.min(Number(opts.index) || 0, items.length - 1));
  lightboxState.items = items;
  lightboxState.index = startIndex;
  $lightbox.hidden = false;
  $lightbox.classList.remove('is-closing');
  $lightbox.classList.add('is-opening');
  $lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  setLightboxImage(lightboxState.items[lightboxState.index], { opening: true });
}

function closeLightbox() {
  if (!$lightbox || !$lightboxImg) return;
  clearLightboxAutoPlay();
  if ($lightbox.hidden) return;
  $lightbox.setAttribute('aria-hidden', 'true');
  $lightbox.classList.remove('is-opening');
  $lightbox.classList.add('is-closing');
  if (lightboxCloseTimer) window.clearTimeout(lightboxCloseTimer);
  lightboxCloseTimer = window.setTimeout(() => {
    $lightbox.hidden = true;
    $lightbox.classList.remove('is-closing');
    $lightboxImg.removeAttribute('src');
    $lightboxImg.style.width = '';
    $lightboxImg.style.height = '';
    if ($lightboxOverlay) $lightboxOverlay.innerHTML = '';
    if ($lightboxBadge) {
      $lightboxBadge.textContent = '';
      $lightboxBadge.hidden = true;
    }
    if ($lightboxCount) {
      $lightboxCount.textContent = '';
      $lightboxCount.hidden = true;
    }
    if ($lightboxCaption) {
      $lightboxCaption.textContent = '';
      $lightboxCaption.hidden = true;
    }
    lightboxState.items = [];
    lightboxState.index = 0;
    document.body.style.overflow = '';
    lightboxCloseTimer = 0;
  }, 260);
}

function setLightboxProgress(durationMs) {
  if (!$lightboxProgress) return;
  $lightboxProgress.hidden = false;
  $lightboxProgress.style.setProperty('--lightbox-progress-duration', `${Math.max(Number(durationMs) || 0, 400)}ms`);
  $lightboxProgress.classList.remove('is-running');
  void $lightboxProgress.offsetWidth;
  $lightboxProgress.classList.add('is-running');
}

function hideLightboxProgress() {
  if (!$lightboxProgress) return;
  $lightboxProgress.classList.remove('is-running');
  $lightboxProgress.hidden = true;
}

function clearLightboxAutoPlay() {
  if (!lightboxAutoPlayTimer) return;
  window.clearInterval(lightboxAutoPlayTimer);
  lightboxAutoPlayTimer = 0;
  hideLightboxProgress();
}

function startLightboxAutoPlay() {
  clearLightboxAutoPlay();
  const count = lightboxState.items.length;
  if (count < 2) {
    setLightboxProgress(3000);
    lightboxAutoPlayTimer = window.setTimeout(() => closeLightbox(), 3000);
    return;
  }
  let steps = 1;
  setLightboxProgress(2600);
  lightboxAutoPlayTimer = window.setInterval(() => {
    if (!$lightbox || $lightbox.hidden || steps >= count) {
      clearLightboxAutoPlay();
      closeLightbox();
      return;
    }
    moveLightbox(1, { keepAutoPlay: true });
    steps += 1;
    setLightboxProgress(2600);
  }, 2600);
}

function moveLightbox(dir, opts = {}) {
  const count = lightboxState.items.length;
  if (!$lightbox || $lightbox.hidden || count < 2) return;
  if (!opts.keepAutoPlay) clearLightboxAutoPlay();
  lightboxState.index = (lightboxState.index + dir + count) % count;
  setLightboxImage(lightboxState.items[lightboxState.index], { dir });
}

function bindImageZoom(root) {
  root?.querySelectorAll('img.zoomable').forEach((img) => {
    img.addEventListener('error', () => {
      img.closest('.product-image-strip')?.remove();
    });
    const renderedBounds = () => {
      const rect = img.getBoundingClientRect();
      const naturalWidth = img.naturalWidth || rect.width;
      const naturalHeight = img.naturalHeight || rect.height;
      const scale = Math.min(rect.width / naturalWidth, rect.height / naturalHeight);
      const width = naturalWidth * scale;
      const height = naturalHeight * scale;
      return {
        left: rect.left + (rect.width - width) / 2,
        right: rect.left + (rect.width + width) / 2,
        top: rect.top + (rect.height - height) / 2,
        bottom: rect.top + (rect.height + height) / 2,
      };
    };
    const isInsideRenderedImage = (event) => {
      if (!(event instanceof MouseEvent)) return true;
      const bounds = renderedBounds();
      return (
        event.clientX >= bounds.left &&
        event.clientX <= bounds.right &&
        event.clientY >= bounds.top &&
        event.clientY <= bounds.bottom
      );
    };
    const open = () => {
      let items = [];
      try {
        items = JSON.parse(img.getAttribute('data-lightbox-items') || '[]');
      } catch {
        items = [];
      }
      openLightbox(img.getAttribute('data-full') || img.src, {
        items,
        index: Number(img.getAttribute('data-lightbox-index')) || 0,
        label: img.getAttribute('data-label') || '',
        comment: img.getAttribute('data-comment') || '',
        level: img.getAttribute('data-level') || 'neutral',
      });
    };
    img.addEventListener('mousemove', (e) => {
      img.style.cursor = isInsideRenderedImage(e) ? 'zoom-in' : 'default';
    });
    img.addEventListener('mouseleave', () => {
      img.style.cursor = '';
    });
    img.addEventListener('click', (e) => {
      if (!isInsideRenderedImage(e)) return;
      open();
    });
    img.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    });
  });
}

function bindPhotoSlider(root, item) {
  window.clearInterval(photoSliderAutoTimer);
  root?.querySelectorAll('[data-photo-dir]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const urls = item.imageUrls || [];
      if (urls.length < 2) return;
      const key = itemKey(item);
      const dir = Number(btn.getAttribute('data-photo-dir')) || 0;
      const current = photoIndexes.get(key) || 0;
      photoIndexes.set(key, (current + dir + urls.length) % urls.length);
      photoDirections.set(key, dir);
      refreshPhotoSlider(item);
    });
  });
  const urls = item?.imageUrls || [];
  if (urls.length > 1) {
    const key = itemKey(item);
    photoSliderAutoTimer = window.setInterval(() => {
      if (selectedKey !== key || ($lightbox && !$lightbox.hidden)) return;
      const current = photoIndexes.get(key) || 0;
      photoDirections.set(key, 1);
      photoIndexes.set(key, (current + 1) % urls.length);
      refreshPhotoSlider(item);
      setTimeout(() => photoDirections.delete(key), 260);
    }, 6000);
  }
}

function bindScrollText(root) {
  root?.querySelectorAll('.scroll-text').forEach((el) => {
    el.classList.remove('is-scrollable');
    el.style.maxHeight = '';
    requestAnimationFrame(() => {
      let max = Number(el.getAttribute('data-scroll-max')) || 0;
      if (!max && el.classList.contains('body-text')) {
        const card = el.closest('.mini-card');
        if (card) {
          const cardRect = card.getBoundingClientRect();
          const elRect = el.getBoundingClientRect();
          max = Math.max(92, Math.floor(cardRect.bottom - elRect.top - 24));
        }
      }
      if (!max) return;
      if (el.scrollHeight > max + 2) {
        el.style.maxHeight = `${max}px`;
        el.classList.add('is-scrollable');
      }
    });
  });
}

function bindImageAnalysisSlider(root, item) {
  const key = summaryKey(item);
  if (!key) return;
  window.clearInterval(imageAnalysisAutoTimer);
  updateDefectMarkerFrames(root);
  root?.querySelectorAll('.image-analysis-nav').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const images = imageAnalysisEntries(item);
      if (images.length < 2) return;
      const dir = Number(btn.getAttribute('data-image-analysis-dir')) || 0;
      const current = imageAnalysisIndexes.get(key) || 0;
      imageAnalysisDirections.set(key, dir);
      imageAnalysisIndexes.set(key, (current + dir + images.length) % images.length);
      refreshImageAnalysisSlider(item);
      setTimeout(() => imageAnalysisDirections.delete(key), 260);
    });
  });
  const images = imageAnalysisEntries(item);
  if (images.length > 1) {
    imageAnalysisAutoTimer = window.setInterval(() => {
      if (selectedKey !== key || ($lightbox && !$lightbox.hidden)) return;
      const current = imageAnalysisIndexes.get(key) || 0;
      imageAnalysisDirections.set(key, 1);
      imageAnalysisIndexes.set(key, (current + 1) % images.length);
      refreshImageAnalysisSlider(item);
      setTimeout(() => imageAnalysisDirections.delete(key), 260);
    }, 6500);
  }
}

function refreshImageAnalysisSlider(item) {
  const current = $current.querySelector('[data-image-analysis-slide-wrap]');
  if (!current) return;
  current.outerHTML = renderImageAnalysisSlider(item);
  const updated = $current.querySelector('[data-image-analysis-slide-wrap]');
  bindImageAnalysisSlider(updated, item);
  bindImageZoom(updated);
  updateDefectMarkerFrames(updated);
}

function bindStageTwoFlow(root, item) {
  root?.querySelectorAll('[data-stage-two-start]').forEach((el) => {
    const start = () => {
      const key = el.getAttribute('data-stage-two-start') || summaryKey(item);
      startStageTwo(item, key);
    };
    el.addEventListener('click', start);
    if (el.tagName !== 'BUTTON') {
      el.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        start();
      });
    }
  });
}

function openRelatedSearchForItem(item, queries, btn = null, opts = {}) {
  const key = summaryKey(item);
  const queryList = splitSearchQueries(queries);
  if (!key || !queryList.length) return;
  const isolated = opts.isolated === true;
  resetStageThreeComparisonWork(item, { clearGuide: !isolated, clearReceipt: !isolated, clearSearchQuery: true });
  stageThreeComparisonSkippedKeys.delete(key);
  if (!opts.preserveAutoRetryCount) stageThreeAutoQueryRetryCounts.delete(key);
  relatedRequestedKeys.add(key);
  if (isolated) stageThreeIsolatedRefreshKeys.add(key);
  else stageThreeIsolatedRefreshKeys.delete(key);
  stageThreeSearchProgresses.set(key, {
    phase: 'collecting',
    startedAt: Date.now(),
    durationMs: STAGE_THREE_COLLECTION_TIMEOUT_MS,
    startPercent: 0,
    endPercent: 62,
  });
  comps = collectingComparisonComps(item);
  armStageThreeHardDeadline(item);
  lastStageThreeCompsRenderKey = stageThreeCompsRenderKey(item, comps);
  window.postMessage({ type: 'MARKET_SCRAPE_CLEAR_COMPS' }, '*');
  for (const filterKey of [...comparisonFilters.keys()]) {
    if (filterKey.startsWith(`${key}::`)) {
      comparisonFilters.delete(filterKey);
      if (!isolated) {
        usedPriceGuides.delete(filterKey);
        usedPriceGuideProgresses.delete(key);
        purchaseReceipts.delete(filterKey);
        purchaseReceiptPrintedKeys.delete(filterKey);
      }
    }
  }
  for (const filterKey of [...comparisonFilterTimers]) {
    if (filterKey.startsWith(`${key}::`)) comparisonFilterTimers.delete(filterKey);
  }
  persistAiCaches();
  if (selectedKey === key) {
    if (isolated) refreshStageThreeCompsBlock(item, { schedule: false });
    else refreshStageThreeSection(item);
  }
  // 중고 시세 참고표는 자동 매물검색과 완전히 독립된 병렬 작업으로, 검색 탭 결과를 기다리지 않고 바로 시작한다.
  if (selectedKey === key) void ensureUsedPriceGuide(item);
  if (btn) btn.disabled = true;
  window.postMessage({ type: 'MARKET_SCRAPE_OPEN_SEARCH_TABS', query: queryList[0], queries: queryList }, '*');
  if (btn) {
    setTimeout(() => {
      btn.disabled = false;
    }, 2500);
  }
}

function resetStageThreeComparisonWork(item, opts = {}) {
  const key = summaryKey(item);
  if (!key) return;
  stageThreeComparisonRunIds.set(key, (stageThreeComparisonRunIds.get(key) || 0) + 1);
  if (opts.clearSearchQuery !== false) searchQueryRegenerations.delete(key);
  stageThreeCollectionFinalizingKeys.delete(key);
  stageThreeSearchProgresses.delete(key);
  clearStageThreeCollectionTimeout(key);
  usedPriceGuideProgresses.delete(key);
  for (const filterKey of [...comparisonFilters.keys()]) {
    if (!filterKey.startsWith(`${key}::`)) continue;
    comparisonFilters.delete(filterKey);
    if (opts.clearGuide) {
      usedPriceGuides.delete(filterKey);
      usedPriceGuideProgresses.delete(key);
    }
    if (opts.clearReceipt !== false) {
      purchaseReceipts.delete(filterKey);
      purchaseReceiptPrintedKeys.delete(filterKey);
    }
  }
  for (const filterKey of [...comparisonFilterTimers]) {
    if (filterKey.startsWith(`${key}::`)) comparisonFilterTimers.delete(filterKey);
  }
  // 시세표는 매물 단위 안정 키(`${key}::guide`)로 따로 보관되므로 명시적으로 정리한다.
  if (opts.clearGuide) {
    usedPriceGuides.delete(usedPriceGuideKey(item));
    usedPriceGuideProgresses.delete(key);
  }
  if (opts.clearReceipt !== false) {
    purchaseReceiptsForListingClear(key);
  }
}

function skipStageThreeComparison(item) {
  const key = summaryKey(item);
  if (!key) return;
  resetStageThreeComparisonWork(item, { clearGuide: true, clearReceipt: true, clearSearchQuery: true });
  stageThreeAutoQueryRetryCounts.set(key, MAX_STAGE_THREE_AUTO_QUERY_RETRIES);
  stageThreeComparisonSkippedKeys.add(key);
  relatedRequestedKeys.add(key);
  stageThreeActiveKeys.add(key);
  comps = emptyComparisonComps(item);
  const filterKey = comparisonFilterKey(item, comps);
  if (filterKey) comparisonFilters.set(filterKey, { status: 'done', matches: [], skipped: true });
  persistAiCaches();
  refreshStageThreeSection(item);
  void ensureUsedPriceGuide(item);
}

function bindStageThreeFlow(root, item) {
  root?.querySelectorAll('[data-stage-three-start]').forEach((el) => {
    const start = () => {
      const key = el.getAttribute('data-stage-three-start') || summaryKey(item);
      startStageThree(item, el, key);
    };
    el.addEventListener('click', start);
    if (el.tagName !== 'BUTTON') {
      el.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        start();
      });
    }
  });
  root?.querySelectorAll('[data-stage-three-refresh]').forEach((btn) => {
    btn.addEventListener('click', () => {
      openRelatedSearchForItem(item, stageThreeSearchQueries(item), btn, { isolated: true });
    });
  });
  root?.querySelectorAll('[data-stage-three-skip-comps]').forEach((btn) => {
    btn.addEventListener('click', () => {
      skipStageThreeComparison(item);
    });
  });
}

function maybeAutoRegenerateStageThreeSearchQueries(item, reason = '') {
  const key = summaryKey(item);
  if (!key) return false;
  if (searchQueryRegenerations.get(key)?.status === 'loading') return true;
  const count = stageThreeAutoQueryRetryCounts.get(key) || 0;
  if (count >= MAX_STAGE_THREE_AUTO_QUERY_RETRIES) return false;
  stageThreeAutoQueryRetryCounts.set(key, count + 1);
  void regenerateStageThreeSearchQueries(item, null, { auto: true, reason });
  return true;
}

async function regenerateStageThreeSearchQueries(item, btn = null, opts = {}) {
  const key = summaryKey(item);
  if (!key) return;
  if (!opts.auto) stageThreeAutoQueryRetryCounts.delete(key);
  const apiKey = getAiApiKey();
  if (!apiKey || typeof globalThis.UlsaAi?.fetchSearchQuery !== 'function') {
    const fallbackQueries = localStageThreeSearchQueries(item, getProductSummaryState(item)?.summary || null);
    if (fallbackQueries.length) {
      openRelatedSearchForItem(item, fallbackQueries, btn, { isolated: true, preserveAutoRetryCount: opts.auto === true });
      return;
    }
    searchQueryRegenerations.set(key, { status: 'error', error: 'AI 설정이 필요합니다.' });
    refreshStageThreeSearchCard(item);
    return;
  }
  searchQueryRegenerations.set(key, { status: 'loading', startedAt: Date.now() });
  if (btn) btn.disabled = true;
  refreshStageThreeSearchCard(item);
  try {
    const data = await globalThis.UlsaAi.fetchSearchQuery({
      title: item.title || '',
      body: item.body || '',
      imageUrls: item.imageUrls || [],
      maxQueries: 3,
      apiKey,
    });
    const current = productSummaries.get(key) || { status: 'done', summary: {} };
    const summary = current.summary || {};
    const aiQueries = splitSearchQueries(data.queries?.length ? data.queries : data.query);
    const localQueries = localStageThreeSearchQueries(item, summary);
    const queries = productSummaryQueries(
      { ...summary, searchQueries: [...aiQueries.slice(0, 2), ...localQueries, ...aiQueries.slice(2)] },
      item
    );
    if (!queries.length) throw new Error('새 검색어를 만들지 못했습니다.');
    productSummaries.set(key, {
      ...current,
      status: 'done',
      summary: {
        ...summary,
        searchQuery: queries[0],
        searchQueries: queries,
      },
    });
    persistAiCaches();
    await showAiLoadingComplete(searchQueryRegenerations, key, () => {
      refreshStageThreeSearchCard(item);
    }, 'searchQuery');
    searchQueryRegenerations.delete(key);
    refreshStageThreeSearchCard(item);
    openRelatedSearchForItem(item, queries, btn, { isolated: true, preserveAutoRetryCount: opts.auto === true });
  } catch (e) {
    const fallbackQueries = localStageThreeSearchQueries(item, getProductSummaryState(item)?.summary || null);
    if (fallbackQueries.length) {
      searchQueryRegenerations.set(key, { status: 'done', completedAt: Date.now(), fallback: true });
      refreshStageThreeSearchCard(item);
      searchQueryRegenerations.delete(key);
      openRelatedSearchForItem(item, fallbackQueries, btn, { isolated: true, preserveAutoRetryCount: opts.auto === true });
      return;
    }
    searchQueryRegenerations.set(key, {
      status: 'error',
      error: e instanceof Error ? e.message : String(e),
    });
    refreshStageThreeSearchCard(item);
  }
}

function purchaseReceiptComparisonPayload(item, comps) {
  const matched = filteredComparisonItems(item, comps) || comparisonFilterCandidates(item, comps, 12) || [];
  const stats = compStats(matched);
  const pricedSampleCount = stats?.n || 0;
  const isPriceReliable = pricedSampleCount >= MIN_PRICE_REFERENCE_MATCHES;
  return {
    matchedCount: matched.length,
    pricedSampleCount,
    candidateCount: comparisonItems(comps).length,
    minReliableMatchedCount: MIN_PRICE_REFERENCE_MATCHES,
    isPriceReliable,
    reliabilityReason: isPriceReliable
      ? '같은 제품으로 판별된 비교 매물의 가격 표본이 가격 참고자료로 사용할 수 있는 내부 기준을 충족합니다.'
      : '같은 제품으로 판별된 비교 매물의 가격 표본이 부족해 가격은 제한적인 참고자료로만 볼 수 있습니다.',
    stats: stats && isPriceReliable
      ? {
          count: stats.n,
          min: stats.min,
          max: stats.max,
          median: stats.median,
          minLabel: formatWon(stats.min),
          maxLabel: formatWon(stats.max),
          medianLabel: formatWon(stats.median),
        }
      : null,
    matchedListings: matched.slice(0, 12).map((x) => ({
      platform: x.platformLabel || x.platform || '',
      title: x.title || '',
      price: x.price || null,
      priceLabel: x.priceLabel || '',
      saleStatus: x.saleStatus || '',
      url: x.url || '',
    })),
  };
}

function usedPriceGuidePayload(item, comps) {
  const matched = filteredComparisonItems(item, comps) || [];
  const candidates = matched.length ? matched : comparisonItems(comps) || [];
  const stats = compStats(candidates);
  return {
    current: {
      platform: item.platformLabel || item.platform || '',
      title: item.title || '',
      price: item.price || null,
      priceLabel: item.priceLabel || '',
      shippingFeeLabel: item.shippingFeeLabel || '',
      body: item.body || '',
    },
    summary: getProductSummaryState(item)?.summary || null,
    comparison: {
      matchedCount: candidates.length,
      pricedSampleCount: stats?.n || 0,
      stats: stats
        ? {
            count: stats.n,
            min: stats.min,
            max: stats.max,
            median: stats.median,
            minLabel: formatWon(stats.min),
            maxLabel: formatWon(stats.max),
            medianLabel: formatWon(stats.median),
          }
        : null,
      matchedListings: candidates.slice(0, 12).map((x) => ({
        platform: x.platformLabel || x.platform || '',
        title: x.title || '',
        price: x.price || null,
        priceLabel: x.priceLabel || '',
        saleStatus: x.saleStatus || '',
        url: x.url || '',
      })),
    },
  };
}

function bindUsedPriceGuide(root, item) {
  root?.querySelectorAll('[data-used-price-guide]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = usedPriceGuideKey(item);
      const listingKey = summaryKey(item);
      if (key) usedPriceGuides.delete(key);
      if (listingKey) {
        usedPriceGuideProgresses.delete(listingKey);
        purchaseReceiptsForListingClear(listingKey);
      }
      void ensureUsedPriceGuide(item, { regenerate: true });
    });
  });
}

function bindPurchaseReceipt(root, item) {
  root?.querySelectorAll('[data-purchase-receipt]').forEach((btn) => {
    btn.addEventListener('click', () => {
      void ensurePurchaseReceipt(item);
    });
  });
  root?.querySelectorAll('[data-purchase-receipt-regenerate]').forEach((btn) => {
    btn.addEventListener('click', () => {
      void ensurePurchaseReceipt(item, { regenerate: true });
    });
  });
  root?.querySelectorAll('[data-purchase-report-pdf]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const stageComps = effectiveStageThreeComps(item, comps);
      const label = btn.textContent || 'Step 1-4 전체 분석 PDF 저장';
      btn.disabled = true;
      btn.textContent = 'PDF 준비 중...';
      try {
        await openPurchaseReportPdf(item, stageComps);
      } finally {
        btn.disabled = false;
        btn.textContent = label;
      }
    });
  });
}

function revealPurchaseReportPdfButton(root = $current) {
  root?.querySelectorAll('[data-purchase-report-pdf]').forEach((btn) => {
    const wasHidden = btn.hidden;
    btn.hidden = false;
    if (wasHidden) {
      btn.classList.remove('is-revealing');
      void btn.offsetWidth;
      btn.classList.add('is-revealing');
    }
  });
}

function followPurchaseReceiptPrint(root = $current) {
  const stage = root?.querySelector('.purchase-receipt-stage');
  const reveal = stage?.querySelector('.receipt-paper-reveal');
  const paper = stage?.querySelector('.purchase-receipt-paper');
  if (!stage || !reveal || !paper || stage.dataset.receiptScrollStarted === '1') return;
  const item = currentRenderedItem();
  const stageComps = item ? effectiveStageThreeComps(item, comps) : null;
  const { key: receiptKey } = item && stageComps ? resolvedPurchaseReceiptState(item, stageComps) : { key: '' };
  stage.dataset.receiptScrollStarted = '1';
  const printHeight = Math.ceil(paper.scrollHeight + 12);
  reveal.style.setProperty('--receipt-print-height', `${printHeight}px`);
  reveal.style.height = '0px';
  reveal.style.maxHeight = '';
  reveal.style.minHeight = '0px';

  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  if (prefersReducedMotion) {
    reveal.style.height = 'auto';
    reveal.style.minHeight = `${printHeight}px`;
    if (receiptKey) purchaseReceiptPrintedKeys.add(receiptKey);
    revealPurchaseReportPdfButton(root);
    if (item) refreshStageFiveSection(item);
    if (!$appShell?.classList.contains('app-shell--slide')) {
      reveal.scrollIntoView({ block: 'end', behavior: 'auto' });
    }
    return;
  }

  reveal.addEventListener(
    'animationend',
    () => {
      reveal.style.height = 'auto';
      reveal.style.minHeight = `${printHeight}px`;
      reveal.classList.remove('is-printing');
      if (receiptKey) purchaseReceiptPrintedKeys.add(receiptKey);
      revealPurchaseReportPdfButton(root);
      if (item) refreshStageFiveSection(item);
    },
    { once: true }
  );
  const startTop = window.scrollY;
  const isScrollLayout = !$appShell?.classList.contains('app-shell--slide');
  const bottomPadding = Math.min(140, Math.max(72, window.innerHeight * 0.14));
  const maxScrollTop = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const targetTop = () => {
    const rect = reveal.getBoundingClientRect();
    const nextTop = window.scrollY + rect.bottom - window.innerHeight + bottomPadding;
    return Math.max(startTop, Math.min(maxScrollTop(), nextTop));
  };
  const startedAt = performance.now();

  const step = (now) => {
    const progress = Math.min(1, (now - startedAt) / RECEIPT_PRINT_SCROLL_MS);
    if (isScrollLayout) {
      const desired = targetTop();
      const nextTop = window.scrollY + (desired - window.scrollY) * 0.16;
      window.scrollTo(0, nextTop);
    }
    if (progress < 1) {
      window.requestAnimationFrame(step);
      return;
    }
    if (isScrollLayout) {
      window.setTimeout(() => {
        const finalTop = targetTop();
        if (Math.abs(finalTop - window.scrollY) > 2) {
          window.scrollTo({ top: finalTop, behavior: 'smooth' });
        }
      }, 120);
    }
  };

  window.requestAnimationFrame((now) => {
    reveal.classList.add('is-printing');
    step(now);
  });
}

function hasListingTextAnalysisContent(analysis) {
  if (!analysis) return false;
  return Boolean(
    String(analysis.sellerVerdict || '').trim() ||
      String(analysis.bodyVerdict || '').trim() ||
      String(analysis.overall || '').trim() ||
      (Array.isArray(analysis.questions) && analysis.questions.length) ||
      (Array.isArray(analysis.redFlags) && analysis.redFlags.length)
  );
}

function directAiKeywordQuestion(keyword) {
  const clean = String(keyword || '').trim();
  const last = clean.charCodeAt(clean.length - 1);
  const hasFinalConsonant = last >= 0xac00 && last <= 0xd7a3 && (last - 0xac00) % 28 > 0;
  return `${clean}${hasFinalConsonant ? '이' : '가'} 뭐야?`;
}

function submitTextareaOnEnter(e) {
  if (e.key !== 'Enter' || e.shiftKey || e.isComposing) return;
  const textarea = e.target;
  const form = textarea?.form;
  if (!form) return;
  e.preventDefault();
  form.requestSubmit?.();
}

function bindDirectAiChat() {
  $directAiPanel?.querySelector('.direct-chat-close')?.addEventListener('click', () => {
    directAiChat.open = false;
    saveDirectAiChatState();
    renderDirectAiPanel();
  });

  $directAiPanel?.querySelector('.direct-chat-clear')?.addEventListener('click', () => {
    directAiChat.status = 'idle';
    directAiChat.messages = [];
    saveDirectAiChatState();
    renderDirectAiPanel();
  });

  bindDirectAiKeywordButtons();

  const directForm = $directAiPanel?.querySelector('.direct-chat-form');
  directForm?.querySelector('textarea[name="prompt"]')?.addEventListener('keydown', submitTextareaOnEnter);
  directForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const textarea = e.currentTarget.querySelector('textarea[name="prompt"]');
    const prompt = String(textarea?.value || '').trim();
    if (!prompt) return;
    const item = currentRenderedItem();
    const apiKey = getAiApiKey();

    directAiChat.messages.push({ role: 'user', text: prompt });
    directAiChat.status = 'loading';
    saveDirectAiChatState();
    if (textarea) textarea.value = '';
    renderDirectAiPanel();

    const requestKey = selectedKey || (item ? summaryKey(item) : '');
    try {
      const handled = await handleDirectAiUserMessage(prompt, item);
      if (requestKey && selectedKey !== requestKey && requestKey) return;
      if (handled) {
        saveDirectAiChatState(requestKey);
        renderDirectAiPanel();
        return;
      }

      if (!apiKey || typeof globalThis.UlsaAi?.askDirect !== 'function') {
        directAiChat.messages.push({
          role: 'ai',
          text: 'AI 설정이 필요합니다. AI 설정에서 Gemini API 키를 저장한 뒤 다시 시도하세요.',
        });
        directAiChat.status = 'error';
        saveDirectAiChatState(requestKey);
        renderDirectAiPanel();
        return;
      }

      const data = await globalThis.UlsaAi.askDirect({ prompt: directAiPrompt(prompt, item), apiKey });
      if (requestKey && selectedKey !== requestKey) return;
      directAiChat.messages.push({ role: 'ai', text: stripChatMarkdown(data.answer || '(빈 응답)') });
      directAiChat.status = 'done';
    } catch (err) {
      if (requestKey && selectedKey !== requestKey) return;
      directAiChat.messages.push({ role: 'ai', text: err instanceof Error ? err.message : String(err) });
      directAiChat.status = 'error';
    }
    saveDirectAiChatState(requestKey);
    renderDirectAiPanel();
  });

  bindDirectAiCommandButtons();
}

function toggleDirectAiPanel(forceOpen = !directAiChat.open) {
  directAiChat.open = Boolean(forceOpen);
  renderDirectAiPanel();
  if (directAiChat.open) void ensureDirectAiKeywords();
}

function closeDirectAiPanel() {
  if (!directAiChat.open) return false;
  directAiChat.open = false;
  saveDirectAiChatState();
  renderDirectAiPanel();
  return true;
}

async function submitSellerChat(item, opts = {}) {
  const key = sellerChatKey(item);
  const state = key ? sellerChatStates.get(key) : null;
  if (!state) return;
  const apiKey = getAiApiKey();
  if (!apiKey || typeof globalThis.UlsaAi?.fetchSellerChatAssistant !== 'function') {
    state.status = 'error';
    state.error = 'AI 설정이 필요합니다.';
    refreshSellerChatSection(item);
    return;
  }

  const asSellerReply = opts.asSellerReply === true;
  const isRegenerate = opts.regenerate === true;
  const message = String(
    isRegenerate ? state.lastRequestMessage || state.input || '' : (asSellerReply ? state.sellerReply : state.input) || ''
  ).trim();
  const payloadMessage = message || '';
  const context = sellerChatContext(item, comps);
  let appendedSellerReply = false;

  if (asSellerReply && payloadMessage && !isRegenerate) {
    const sellerMessage = { role: 'seller', text: payloadMessage };
    state.messages.push(sellerMessage);
    appendedSellerReply = appendSellerChatMessageToThread(item, sellerMessage, state.messages.length - 1);
  }
  state.status = 'loading';
  state.startedAt = Date.now();
  state.error = '';
  state.lastRequestMessage = payloadMessage;
  state.lastRequestWasSellerReply = asSellerReply;
  if (!isRegenerate) {
    if (asSellerReply) state.sellerReply = '';
    else state.input = '';
  }
  state.lastSuggestion = null;
  if (!refreshSellerChatDynamic(item, { skipThread: appendedSellerReply || !asSellerReply })) refreshSellerChatSection(item);

  try {
    const chatHistory = sellerChatHistoryPayload(state.messages);
    let replyAnalysisForPrompt = state.replyAnalysis?.status === 'done' && state.replyAnalysis?.text
      ? {
          status: state.replyAnalysis.status || 'done',
          text: state.replyAnalysis.text,
          source: state.replyAnalysis.source || '',
        }
      : null;
    if (asSellerReply && typeof globalThis.UlsaAi?.fetchSellerReplyAnalysis === 'function') {
      try {
        const analysisData = await globalThis.UlsaAi.fetchSellerReplyAnalysis({
          apiKey,
          sellerReply: payloadMessage,
          chatHistory,
          listing: context.item,
          summary: context.summary,
          riskAnalysis: context.riskAnalysis,
          listingTextAnalysis: context.listingTextAnalysis,
          listingImageAnalysis: context.listingImageAnalysis,
          accessoryCheck: context.accessoryCheck,
          usedPriceGuide: context.usedPriceGuide,
          receipt: context.receipt,
          comparison: context.comparison,
        });
        const text = stripChatMarkdown(analysisData.analysis || analysisData.replyAnalysis?.analysis || '').trim();
        state.replyAnalysis = text ? { status: 'done', text, source: payloadMessage } : null;
        replyAnalysisForPrompt = state.replyAnalysis;
        refreshSellerChatDynamic(item, { skipThread: true });
      } catch {
        state.replyAnalysis = {
          status: 'error',
          text: '판매자 답장 해석을 불러오지 못했습니다. 분석 서버를 재시작한 뒤 다시 시도해 주세요.',
          source: payloadMessage,
        };
        replyAnalysisForPrompt = null;
        refreshSellerChatDynamic(item, { skipThread: true });
      }
    } else if (asSellerReply) {
      state.replyAnalysis = {
        status: 'error',
        text: '판매자 답장 해석 기능을 불러오지 못했습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요.',
        source: payloadMessage,
      };
      replyAnalysisForPrompt = null;
    }
    const data = await globalThis.UlsaAi.fetchSellerChatAssistant({
      apiKey,
      mode: state.mode,
      tone: state.tone,
      toneLabel: sellerChatToneLabel(state.tone),
      toneNote: state.toneNote,
      message: payloadMessage,
      chatHistory,
      replyAnalysis: replyAnalysisForPrompt,
      listing: context.item,
      summary: context.summary,
      riskAnalysis: context.riskAnalysis,
      listingTextAnalysis: context.listingTextAnalysis,
      listingImageAnalysis: context.listingImageAnalysis,
      accessoryCheck: context.accessoryCheck,
      usedPriceGuide: context.usedPriceGuide,
      receipt: context.receipt,
      comparison: context.comparison,
    });
    const primary = stripChatMarkdown(data.primary || data.message || data.answer || '').trim();
    const alternatives = Array.isArray(data.alternatives)
      ? data.alternatives.map((x) => stripChatMarkdown(x)).filter(Boolean).slice(0, 5)
      : [];
    const followUps = Array.isArray(data.followUps)
      ? data.followUps.map((x) => stripChatMarkdown(x)).filter(Boolean).slice(0, 3)
      : [];
    const quickReplies = Array.isArray(data.quickReplies)
      ? data.quickReplies.map((x) => stripChatMarkdown(x)).filter(Boolean).slice(0, 4)
      : [];
    const rawSuggestion = {
      primary,
      alternatives,
      followUps,
      quickReplies,
      summary: stripChatMarkdown(data.summary || '').trim(),
    };
    const dedupedSuggestion = filterSellerChatDuplicateSuggestions(rawSuggestion, state.messages);
    state.lastSuggestion = enforceSellerChatNegotiation(dedupedSuggestion, context, state.messages, payloadMessage);
    state.finishStartedAt = Date.now();
    state.finishFromPercent = Math.min(99, Math.max(0, aiLoadingPercent(state, 'sellerChat') || 0));
    state.forcePercent = 100;
    if (!refreshSellerChatDynamic(item, { skipThread: true })) refreshSellerChatSection(item);
    await waitMs(AI_LOADING_FINISH_MS);
    state.status = 'done';
    delete state.forcePercent;
    delete state.finishStartedAt;
    delete state.finishFromPercent;
  } catch (err) {
    state.status = 'error';
    delete state.forcePercent;
    delete state.finishStartedAt;
    delete state.finishFromPercent;
    state.error = err instanceof Error ? err.message : String(err);
  }
  if (!refreshSellerChatDynamic(item, { skipThread: true })) refreshSellerChatSection(item);
}

function bindSellerChatFlow(root, item) {
  const key = sellerChatKey(item);
  const state = key ? sellerChatStates.get(key) : null;
  if (!root || !state || !isStepFourDone(item)) return;
  const panel = root.querySelector('[data-stage-five-panel]');
  if (!panel || panel.dataset.sellerChatBound === '1') return;
  panel.dataset.sellerChatBound = '1';

  panel.addEventListener('click', (e) => {
    const target = e.target.closest('button, a, [data-seller-chat-send-suggestion]');
    if (!target || !panel.contains(target)) return;
    const currentState = getSellerChatState(item);
    if (!currentState) return;

    if (target.matches('[data-stage-five-start]')) {
      const startKey = target.getAttribute('data-stage-five-start') || key;
      startStageFive(item, startKey);
      return;
    }
    if (target.matches('[data-seller-chat-mode]')) {
      currentState.mode = target.getAttribute('data-seller-chat-mode') === 'reply' ? 'reply' : 'first';
      currentState.error = '';
      refreshSellerChatDynamic(item);
      return;
    }
    if (target.matches('[data-seller-chat-tone]')) {
      currentState.tone = normalizeSellerChatTone(target.getAttribute('data-seller-chat-tone') || 'polite');
      currentState.error = '';
      refreshSellerChatDynamic(item);
      return;
    }
    if (target.matches('[data-seller-chat-chip]')) {
      currentState.input = String(target.getAttribute('data-seller-chat-chip') || '');
      void submitSellerChat(item);
      return;
    }
    if (target.matches('[data-seller-chat-regenerate]')) {
      currentState.error = '';
      void submitSellerChat(item, { regenerate: true, asSellerReply: currentState.lastRequestWasSellerReply === true });
      return;
    }
    const copyTarget = target.closest?.('[data-seller-chat-copy]');
    if (copyTarget) {
      void copySellerChatText(copyTarget.getAttribute('data-seller-chat-copy') || '');
      return;
    }
    if (target.matches('[data-seller-chat-send-suggestion]')) {
      const text = String(target.getAttribute('data-seller-chat-send-suggestion') || '').trim();
      if (!text) return;
      const nextMessage = { role: 'me', text };
      currentState.messages.push(nextMessage);
      currentState.lastSuggestion = null;
      currentState.input = '';
      currentState.status = 'idle';
      currentState.error = '';
      appendSellerChatMessageToThread(item, nextMessage, currentState.messages.length - 1);
      refreshSellerChatDynamic(item, { skipThread: true });
      return;
    }
    if (target.matches('[data-seller-chat-delete]')) {
      const index = Number(target.getAttribute('data-seller-chat-delete'));
      if (!Number.isInteger(index) || index < 0 || index >= currentState.messages.length) return;
      currentState.messages.splice(index, 1);
      currentState.status = 'idle';
      currentState.error = '';
      refreshSellerChatDynamic(item);
      return;
    }
    if (target.matches('[data-seller-chat-reset]')) {
      currentState.mode = 'first';
      currentState.messages = [];
      currentState.lastSuggestion = null;
      currentState.replyAnalysis = null;
      currentState.input = '';
      currentState.sellerReply = '';
      currentState.status = 'idle';
      currentState.error = '';
      refreshSellerChatDynamic(item);
    }
  });

  panel.addEventListener('keydown', (e) => {
    if (e.target.matches('[data-seller-chat-input], [data-seller-chat-reply]')) {
      submitTextareaOnEnter(e);
      return;
    }
    const target = e.target.closest('[data-seller-chat-send-suggestion]');
    if (!target || !panel.contains(target)) return;
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    target.click();
  });

  panel.addEventListener('input', (e) => {
    const currentState = getSellerChatState(item);
    if (!currentState) return;
    if (e.target.matches('[data-seller-chat-tone-note]')) currentState.toneNote = String(e.target.value || '');
    if (e.target.matches('[data-seller-chat-input]')) currentState.input = String(e.target.value || '');
    if (e.target.matches('[data-seller-chat-reply]')) currentState.sellerReply = String(e.target.value || '');
  });

  panel.addEventListener('submit', (e) => {
    const currentState = getSellerChatState(item);
    if (!currentState) return;
    if (e.target.matches('[data-seller-chat-form]')) {
      e.preventDefault();
      currentState.input = String(e.target.querySelector('[data-seller-chat-input]')?.value || '');
      void submitSellerChat(item);
      return;
    }
    if (e.target.matches('[data-seller-chat-reply-form]')) {
      e.preventDefault();
      currentState.mode = 'reply';
      currentState.sellerReply = String(e.target.querySelector('[data-seller-chat-reply]')?.value || '');
      void submitSellerChat(item, { asSellerReply: true });
    }
  });
}

$btnDirectAi?.addEventListener('click', () => {
  toggleDirectAiPanel();
});
$btnLayoutMode?.addEventListener('click', () => {
  const nextMode = $appShell?.classList.contains('app-shell--slide') ? 'scroll' : 'slide';
  setLayoutMode(nextMode);
});

function setRailActive(action) {
  $dashboardRail?.querySelectorAll('[data-rail-action]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.getAttribute('data-rail-action') === action);
  });
}

function closeRailPanel() {
  if (!$railPanel) return;
  $railPanel.hidden = true;
  $railPanel.classList.remove('is-open');
  setRailActive('');
}

function closeShortcutPanel() {
  if (!$shortcutPanel) return false;
  if ($shortcutPanel.hidden) return false;
  $shortcutPanel.hidden = true;
  $shortcutPanel.classList.remove('is-open');
  setRailActive('');
  return true;
}

function openRailPanel(action = 'import') {
  if (!$railPanel) return;
  closeShortcutPanel();
  setRailActive(action);
  $railPanel.hidden = false;
  window.requestAnimationFrame(() => $railPanel.classList.add('is-open'));
  ($railUrlInput || $urlImportInput)?.focus();
}

function openShortcutPanel() {
  if (!$shortcutPanel) return;
  closeRailPanel();
  setRailActive('shortcuts');
  $shortcutPanel.hidden = false;
  window.requestAnimationFrame(() => $shortcutPanel.classList.add('is-open'));
}

function toggleShortcutPanel() {
  if (isShortcutPanelOpen()) closeShortcutPanel();
  else openShortcutPanel();
}

function bindDashboardRail() {
  if (!$dashboardRail || $dashboardRail.dataset.bound === '1') return;
  $dashboardRail.dataset.bound = '1';
  updateRailLayoutToggle();
  updateRailThemeToggle();
  $dashboardRail.addEventListener('click', (e) => {
    const home = e.target.closest('[data-home-action]');
    if (home && $dashboardRail.contains(home)) {
      startNewAnalysis();
      return;
    }
    const target = e.target.closest('[data-rail-action], [data-rail-close]');
    if (!target || !$dashboardRail.contains(target)) return;
    if (target.matches('[data-rail-close]')) {
      closeRailPanel();
      return;
    }
    const action = target.getAttribute('data-rail-action') || '';
    closeRailPanel();
    closeShortcutPanel();
    if (action === 'layout') $btnLayoutMode?.click();
    if (action === 'theme') setThemeMode(isDarkModeEnabled() ? 'light' : 'dark');
    if (action === 'import') openRailPanel('import');
    if (action === 'history') $btnHistory?.click();
    if (action === 'shortcuts') openShortcutPanel();
    if (action === 'settings') document.getElementById('btnAiSettings')?.click();
    if (action === 'reanalyze') $btnRefresh?.click();
    if (action === 'new') startNewAnalysis();
  });

  $shortcutPanel?.querySelector('[data-shortcut-close]')?.addEventListener('click', closeShortcutPanel);

  if ($urlImportStatus && $railStatus) {
    const mirrorStatus = () => {
      const text = String($urlImportStatus.textContent || '').trim();
      if (text) $railStatus.textContent = text;
    };
    new MutationObserver(mirrorStatus).observe($urlImportStatus, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  }
}

setThemeMode(storedThemeMode(), { persist: false });
bindDashboardRail();

document.querySelectorAll('[data-home-action]').forEach((el) => {
  if ($dashboardRail?.contains(el)) return;
  el.addEventListener('click', startNewAnalysis);
});

window.addEventListener('resize', () => {
  positionDirectAiPanel();
  updateDefectMarkerFrames(document);
  updateLightboxOverlayFrame();
});

function refreshPhotoSlider(item) {
  const current = $current.querySelector('[data-photo-slider]');
  if (!current) return;
  current.outerHTML = renderPhotoSlider(item);
  const updated = $current.querySelector('[data-photo-slider]');
  bindImageZoom(updated);
  bindPhotoSlider(updated, item);
  setTimeout(() => photoDirections.delete(itemKey(item)), 260);
}

function bindProductImageSearch(root, item) {
  root?.querySelectorAll('.product-image-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const key = summaryKey(item);
      const state = key ? productSummaries.get(key) : null;
      const summary = state?.summary || {};
      const productName = summary.productName || fallbackSearchQuery(item);
      const searchQuery = productSummaryQueries(summary, item)[0] || productName;
      if (!productName || typeof globalThis.UlsaAi?.fetchProductImage !== 'function') return;

      btn.disabled = true;
      btn.classList.add('is-loading');
      btn.setAttribute('aria-busy', 'true');
      try {
        const cachedUrls = uniqueImageList([...(summary.productImageUrls || []), summary.productImageUrl]);
        if (cachedUrls.length > 1) {
          const nextUrl = nextProductImageUrl(cachedUrls, summary.productImageUrl);
          productSummaries.set(key, {
            ...(state || {}),
            status: 'done',
            summary: {
              ...summary,
              productImageUrl: nextUrl,
              productImageUrls: cachedUrls,
            },
          });
          refreshProductSummaryBlock(item, { refreshStageTwo: false });
          return;
        }

        const data = await globalThis.UlsaAi.fetchProductImage({ productName, searchQuery });
        const imageUrls = uniqueImageList(data.imageUrls);
        if (!imageUrls.length) {
          return;
        }
        const nextUrl = nextProductImageUrl(imageUrls, summary.productImageUrl) || imageUrls[0];
        const nextSummary = {
          ...summary,
          productImageUrl: nextUrl,
          productImageUrls: imageUrls,
        };
        productSummaries.set(key, { ...(state || {}), status: 'done', summary: nextSummary });
        refreshProductSummaryBlock(item, { refreshStageTwo: false });
      } catch {
      } finally {
        btn.disabled = false;
        btn.classList.remove('is-loading');
        btn.removeAttribute('aria-busy');
      }
    });
  });
}

async function ensureProductImage(item) {
  const key = summaryKey(item);
  const state = key ? productSummaries.get(key) : null;
  const summary = state?.summary;
  if (!key || !summary || summary.productImageUrl || productImageSearches.has(key)) return;
  if (typeof globalThis.UlsaAi?.fetchProductImage !== 'function') return;
  const productName = summary.productName || fallbackSearchQuery(item);
  const searchQuery = productSummaryQueries(summary, item)[0] || productName;
  if (!productName) return;

  productImageSearches.add(key);
  try {
    const data = await globalThis.UlsaAi.fetchProductImage({ productName, searchQuery });
    const imageUrls = uniqueImageList(data.imageUrls);
    if (!imageUrls.length) return;
    productSummaries.set(key, {
      ...state,
      status: 'done',
      summary: {
        ...summary,
        productImageUrl: imageUrls[0],
        productImageUrls: imageUrls,
      },
    });
    if (selectedKey === key) refreshProductSummaryBlock(item, { refreshStageTwo: false });
  } catch (e) {
    console.warn('제품 이미지 자동 검색 실패:', e);
  }
}

async function enrichSummaryWithProductImage(summary, item) {
  if (!summary || typeof globalThis.UlsaAi?.fetchProductImage !== 'function') return summary;
  const productName = summary.productName || fallbackSearchQuery(item);
  const searchQuery = productSummaryQueries(summary, item)[0] || productName;
  if (!productName) return summary;
  try {
    const data = await globalThis.UlsaAi.fetchProductImage({ productName, searchQuery });
    const imageUrls = uniqueImageList(data.imageUrls);
    if (!imageUrls.length) return summary;
    return {
      ...summary,
      productImageUrl: summary.productImageUrl || imageUrls[0],
      productImageUrls: imageUrls,
    };
  } catch (e) {
    console.warn('제품 이미지 포함 요약 준비 실패:', e);
    return summary;
  }
}

function clearProductSummaryCaches(key) {
  if (!key) return;
  productSummaries.delete(key);
  productImageSearches.delete(key);
  imageAnalysisIndexes.delete(key);
  imageAnalysisDirections.delete(key);
  imageAnalysisPreviewedKeys.delete(key);
  searchQueryRegenerations.delete(key);
  stageThreeCollectionFinalizingKeys.delete(key);
  stageThreeSearchProgresses.delete(key);
  clearStageThreeCollectionTimeout(key);
  usedPriceGuideProgresses.delete(key);
  stageThreeAutoQueryRetryCounts.delete(key);
  stageThreeComparisonSkippedKeys.delete(key);
  stageThreeComparisonRunIds.delete(key);
  productRiskAnalyses.delete(key);
  productRiskYoutubeAnalyses.delete(key);
  listingTextAnalyses.delete(key);
  listingImageAnalyses.delete(key);
  accessoryChecks.delete(key);
  stageTwoActiveKeys.delete(key);
  stageThreeActiveKeys.delete(key);
  stageFiveActiveKeys.delete(key);
  stageThreeIsolatedRefreshKeys.delete(key);
  sellerChatStates.delete(key);
  for (const filterKey of [...comparisonFilters.keys()]) {
    if (filterKey.startsWith(`${key}::`)) {
      comparisonFilters.delete(filterKey);
      usedPriceGuides.delete(filterKey);
      purchaseReceipts.delete(filterKey);
      purchaseReceiptPrintedKeys.delete(filterKey);
    }
  }
  clearPurchaseReceiptPrintedForListing(key);
  for (const filterKey of [...comparisonFilterTimers]) {
    if (filterKey.startsWith(`${key}::`)) comparisonFilterTimers.delete(filterKey);
  }
  persistAiCaches();
}

function clearCurrentAiCaches() {
  const key = selectedKey || (latest ? itemKey(latest) : '');
  if (key) clearProductSummaryCaches(key);
}

function resetCurrentAnalysisRuntimeState() {
  const key = selectedKey || (latest ? itemKey(latest) : '');
  if (!key) return;
  imageAnalysisIndexes.delete(key);
  imageAnalysisDirections.delete(key);
  imageAnalysisPreviewedKeys.delete(key);
  searchQueryRegenerations.delete(key);
  stageThreeCollectionFinalizingKeys.delete(key);
  stageThreeSearchProgresses.delete(key);
  clearStageThreeCollectionTimeout(key);
  usedPriceGuideProgresses.delete(key);
  stageThreeAutoQueryRetryCounts.delete(key);
  stageThreeComparisonRunIds.delete(key);
  sellerChatStates.delete(key);
  for (const timerKey of [...comparisonFilterTimers]) {
    if (listingKeyFromStageCacheKey(timerKey) === key) comparisonFilterTimers.delete(timerKey);
  }
  comps = null;
  lastStageThreeCompsRenderKey = '';
  stageSlideIndex = 0;
}

function activateListingItem(item, opts = {}) {
  if (!item) return;
  const key = itemKey(item);
  const currentKey = selectedKey || (latest ? itemKey(latest) : '');
  if (
    opts.skipIfSameActive &&
    key &&
    key === currentKey &&
    latest?.exportedAt &&
    item.exportedAt &&
    latest.exportedAt === item.exportedAt &&
    $current.querySelector('[data-stage-one-zone]')
  ) {
    latest = { ...latest, ...item };
    history = [latest, ...history.filter((h) => itemKey(h) !== key)];
    renderHistoryList();
    return;
  }
  saveDirectAiChatState(currentKey);
  cancelActiveAiWork();
  latest = item;
  selectedKey = key;
  history = [item, ...history.filter((h) => itemKey(h) !== selectedKey)];
  loadDirectAiChatState(key);
  resetCurrentAnalysisRuntimeState();
  comps = restoredStageThreeComps(item, opts.comps ?? item.comps ?? null);
  lastStageThreeCompsRenderKey = '';
  stageSlideIndex = 0;
  renderItem(item, comps);
  refreshDirectAiPanelForListingChange();
  renderHistoryList();
  void ensureProductSummary(item);
}

function clearCurrentAnalysisState() {
  const key = selectedKey || (latest ? itemKey(latest) : '');
  if (!key) return;
  clearProductSummaryCaches(key);
  relatedRequestedKeys.delete(key);
  imageAnalysisIndexes.delete(key);
  imageAnalysisDirections.delete(key);
  stageTwoActiveKeys.delete(key);
  stageThreeActiveKeys.delete(key);
  stageFiveActiveKeys.delete(key);
  stageTwoCompletedKeys.delete(key);
  stageThreeIsolatedRefreshKeys.delete(key);
  sellerChatStates.delete(key);
  productRiskAnalyses.delete(key);
  productRiskYoutubeAnalyses.delete(key);
  listingTextAnalyses.delete(key);
  listingImageAnalyses.delete(key);
  imageAnalysisPreviewedKeys.delete(key);
  searchQueryRegenerations.delete(key);
  stageThreeCollectionFinalizingKeys.delete(key);
  stageThreeSearchProgresses.delete(key);
  clearStageThreeCollectionTimeout(key);
  usedPriceGuideProgresses.delete(key);
  stageThreeAutoQueryRetryCounts.delete(key);
  stageThreeComparisonSkippedKeys.delete(key);
  stageThreeComparisonRunIds.delete(key);
  for (const cacheKey of [...comparisonFilters.keys()]) {
    if (listingKeyFromStageCacheKey(cacheKey) === key) comparisonFilters.delete(cacheKey);
  }
  for (const cacheKey of [...usedPriceGuides.keys()]) {
    if (listingKeyFromStageCacheKey(cacheKey) === key) usedPriceGuides.delete(cacheKey);
  }
  for (const cacheKey of [...purchaseReceipts.keys()]) {
    if (listingKeyFromStageCacheKey(cacheKey) === key) {
      purchaseReceipts.delete(cacheKey);
      purchaseReceiptPrintedKeys.delete(cacheKey);
    }
  }
  clearPurchaseReceiptPrintedForListing(key);
  for (const timerKey of [...comparisonFilterTimers]) {
    if (listingKeyFromStageCacheKey(timerKey) === key) comparisonFilterTimers.delete(timerKey);
  }
  comps = null;
  lastStageThreeCompsRenderKey = '';
  stageSlideIndex = 0;
  persistAiCaches();
  window.postMessage({ type: 'MARKET_SCRAPE_CLEAR_COMPS' }, '*');
}

function startNewAnalysis() {
  closeRailPanel();
  favoriteCompareOpen = false;
  renderFavoriteComparePanel();
  saveDirectAiChatState();
  latest = null;
  selectedKey = null;
  comps = null;
  stageSlideIndex = 0;
  directAiChat.open = false;
  resetDirectAiChat({ close: true });
  if ($urlImportInput) $urlImportInput.value = '';
  if ($railUrlInput) $railUrlInput.value = '';
  if ($urlImportStatus) $urlImportStatus.textContent = '';
  if ($railStatus) $railStatus.textContent = '새 매물 링크를 붙여넣거나 확장 프로그램에서 전송해 주세요.';
  setHistoryOpen(false);
  renderDirectAiPanel();
  renderItem(null);
  updateStageSlide();
  closeRailPanel();
  $urlImportInput?.focus();
}

function bindProductSummaryRetry(root, item) {
  root?.querySelectorAll('.retry-product-summary-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = summaryKey(item);
      if (!key) return;
      clearProductSummaryCaches(key);
      void ensureProductSummary(item);
    });
  });
}

function advanceStageThreeAfterComparisonFilter(item, filterKey, matches, isolated = false) {
  comparisonFilters.set(filterKey, { status: 'done', matches: matches || [] });
  persistAiCaches();
  const currentKey = summaryKey(item);
  if (selectedKey === currentKey) {
    if (isolated) refreshStageThreeCompsBlock(item, { schedule: false });
    else refreshStageThreeSection(item);
  }
  if (!isolated) void ensureUsedPriceGuide(item);
}

async function ensureComparisonFilter(item) {
  if (!item || !isStepThreeUnlocked(item) || !comps || !isCompsCollected(comps)) return;
  const filterKey = comparisonFilterKey(item, comps);
  if (!filterKey) return;
  const currentKey = summaryKey(item);
  const runId = currentKey ? stageThreeComparisonRunIds.get(currentKey) || 0 : 0;
  const isolated = currentKey ? stageThreeIsolatedRefreshKeys.has(currentKey) : false;
  const existing = comparisonFilters.get(filterKey);
  if (existing?.status === 'loading') return;
  if (isStageThreeCacheSettled(existing?.status)) return;
  if (ensureListingStageCacheAlias(comparisonFilters, currentKey, filterKey)) {
    if (selectedKey === currentKey) {
      if (isolated) refreshStageThreeCompsBlock(item, { schedule: false });
      else refreshStageThreeSection(item);
      if (isStepThreeDone(item)) refreshStageFourSection(item);
    }
    void ensureUsedPriceGuide(item);
    return;
  }
  const candidates = comparisonFilterCandidates(item, comps);
  if (!candidates.length) {
    if (maybeAutoRegenerateStageThreeSearchQueries(item, 'empty-candidates')) return;
    await completeStageThreeSearchProgress(item, () => {
      if (selectedKey === currentKey) {
        if (isolated) refreshStageThreeCompsBlock(item, { schedule: false });
        else refreshStageThreeSection(item);
      }
    });
    advanceStageThreeAfterComparisonFilter(item, filterKey, [], isolated);
    return;
  }
  const apiKey = getAiApiKey();
  if (!apiKey || typeof globalThis.UlsaAi?.filterComparisonListings !== 'function') {
    comparisonFilters.set(filterKey, {
      status: 'done',
      matches: allComparisonMatches(item, comps),
      fallback: true,
      error: 'AI 설정이 없어 수집된 비교 매물을 그대로 표시합니다.',
    });
    persistAiCaches();
    if (isolated) refreshStageThreeCompsBlock(item, { schedule: false });
    else refreshStageThreeSection(item);
    if (!isolated) void ensureUsedPriceGuide(item);
    return;
  }

  comparisonFilters.set(filterKey, { status: 'loading', startedAt: Date.now() });
  stageThreeSearchProgressState(item, 'identifying');
  if (isolated) refreshStageThreeCompsBlock(item, { schedule: false });
  else refreshStageThreeSection(item);
  try {
    const summary = getProductSummaryState(item)?.summary || null;
    // AI 동일 제품 판별이 지연되어도 멈추지 않도록 타임아웃을 둔다. 시간 초과면 수집 매물을 그대로 출력.
    const filterPromise = globalThis.UlsaAi
      .filterComparisonListings({
        title: item.title || '',
        body: item.body || '',
        productName: summary?.productName || fallbackSearchQuery(item),
        summary,
        candidates,
        apiKey,
      })
      .catch((err) => ({ __error: err instanceof Error ? err.message : String(err) }));
    const data = await Promise.race([
      filterPromise,
      waitMs(STAGE_THREE_COMPARISON_FILTER_TIMEOUT_MS).then(() => ({ __timedOut: true })),
    ]);
    if (currentKey && runId !== (stageThreeComparisonRunIds.get(currentKey) || 0)) return;
    const matches = data?.__timedOut || !Array.isArray(data.analysis?.matches) ? [] : data.analysis.matches;
    if (matches.length && currentKey) stageThreeAutoQueryRetryCounts.delete(currentKey);
    await completeStageThreeSearchProgress(item, () => {
      if (selectedKey === currentKey) {
        if (isolated) refreshStageThreeCompsBlock(item, { schedule: false });
        else refreshStageThreeSection(item);
      }
    });
    // AI가 매칭을 비워서 돌려주면(=응답 없음), 수집된 비교 매물을 그대로 출력한다.
    const fallbackMatches = matches.length ? [] : allComparisonMatches(item, comps);
    comparisonFilters.set(filterKey, {
      status: 'done',
      matches: matches.length ? matches : fallbackMatches,
      fallback: !matches.length && fallbackMatches.length > 0,
    });
    persistAiCaches();
    if (selectedKey === currentKey) {
      if (isolated) refreshStageThreeCompsBlock(item, { schedule: false });
      else refreshStageThreeSection(item);
    }
    if (!isolated) void ensureUsedPriceGuide(item);
    return;
  } catch (e) {
    if (currentKey && runId !== (stageThreeComparisonRunIds.get(currentKey) || 0)) return;
    // AI 호출 실패 시에도 수집된 비교 매물을 그대로 출력한다.
    comparisonFilters.set(filterKey, {
      status: 'done',
      matches: allComparisonMatches(item, comps),
      fallback: true,
      error: e instanceof Error ? e.message : String(e),
    });
    persistAiCaches();
  }
  if (selectedKey === currentKey) {
    if (isolated) refreshStageThreeCompsBlock(item, { schedule: false });
    else refreshStageThreeSection(item);
  }
}

async function ensureUsedPriceGuide(item, opts = {}) {
  // 중고 시세 참고표는 자동 매물검색(comps 수집)과 완전히 독립적인 병렬 작업이다.
  // 검색이 멈추거나 늦어져도 영향을 받지 않도록 comps 수집 완료를 기다리지 않는다.
  if (!item || !isStepThreeUnlocked(item)) return;
  const key = usedPriceGuideKey(item);
  if (!key) return;
  const listingKey = summaryKey(item);
  const existing = usedPriceGuides.get(key);
  if (existing?.status === 'loading') return;
  if (opts.regenerate) {
    usedPriceGuides.delete(key);
    usedPriceGuideProgresses.delete(listingKey);
    purchaseReceiptsForListingClear(listingKey);
    persistAiCaches();
  } else if (isStageThreeCacheSettled(existing?.status)) return;
  if (!opts.regenerate && ensureListingStageCacheAlias(usedPriceGuides, listingKey, key)) {
    if (selectedKey === listingKey) {
      refreshStageThreeSection(item);
      if (isStepThreeDone(item)) refreshStageFourSection(item);
      else updateStageSlide();
    }
    return;
  }
  const apiKey = getAiApiKey();
  if (!apiKey || typeof globalThis.UlsaAi?.fetchUsedPriceGuide !== 'function') {
    usedPriceGuides.set(key, { status: 'error', error: 'AI 설정이 필요합니다.' });
    refreshStageThreeSection(item);
    if (isStepThreeDone(item)) refreshStageFourSection(item);
    return;
  }

  // 호출 시점에 이미 수집된 비교 매물이 있으면 참고용으로 활용하되, 없으면 그냥 진행한다.
  const collectedComps = effectiveStageThreeComps(item);
  const payloadComps = collectedComps && isCompsCollected(collectedComps) ? collectedComps : emptyComparisonComps(item);
  usedPriceGuideProgressState(item, 'generating');
  usedPriceGuides.set(key, { status: 'loading', startedAt: Date.now() });
  refreshStageThreeSection(item);
  try {
    const data = await globalThis.UlsaAi.fetchUsedPriceGuide({
      ...usedPriceGuidePayload(item, payloadComps),
      apiKey,
    });
    await completeUsedPriceGuideProgress(item, () => {
      if (selectedKey === summaryKey(item)) refreshStageThreeSection(item);
    });
    usedPriceGuides.set(key, { status: 'done', guide: data.guide || {} });
    persistAiCaches();
  } catch (e) {
    usedPriceGuides.set(key, {
      status: 'error',
      error: e instanceof Error ? e.message : String(e),
    });
    persistAiCaches();
  }
  if (selectedKey === summaryKey(item)) {
    refreshStageThreeSection(item);
    if (isStepThreeDone(item)) refreshStageFourSection(item);
    else syncStagePanels(item);
  }
}

async function ensurePurchaseReceipt(item, opts = {}) {
  const stageComps = effectiveStageThreeComps(item);
  if (!item || !stageComps || !isCompsCollected(stageComps)) return;
  const key = purchaseReceiptKey(item, stageComps);
  if (!key) return;
  const { key: existingKey, state: existing } = resolvedPurchaseReceiptState(item, stageComps);
  if (existing?.status === 'loading') return;
  if (opts.regenerate) {
    purchaseReceipts.delete(key);
    purchaseReceiptPrintedKeys.delete(key);
    persistAiCaches();
  } else if (existing?.status === 'done') {
    if (existingKey && existingKey !== key) {
      purchaseReceipts.set(key, { ...existing });
      if (purchaseReceiptPrintedKeys.has(existingKey)) purchaseReceiptPrintedKeys.add(key);
      persistAiCaches();
    }
    refreshStageFourSection(item);
    return;
  }
  const apiKey = getAiApiKey();
  if (!apiKey || typeof globalThis.UlsaAi?.fetchPurchaseReceipt !== 'function') {
    purchaseReceipts.set(key, { status: 'error', error: 'AI 설정이 필요합니다.' });
    refreshStageFourSection(item);
    return;
  }
  const summary = getProductSummaryState(item)?.summary || null;
  let guideState = resolvedUsedPriceGuideState(item, stageComps).state;
  if (!isStageThreeCacheSettled(guideState?.status)) {
    await ensureUsedPriceGuide(item);
    guideState = resolvedUsedPriceGuideState(item, stageComps).state;
    if (!isStageThreeCacheSettled(guideState?.status)) return;
  }
  purchaseReceipts.set(key, { status: 'loading', startedAt: Date.now() });
  refreshStageFourSection(item);
  try {
    const data = await globalThis.UlsaAi.fetchPurchaseReceipt({
      current: {
        platform: item.platformLabel || item.platform || '',
        title: item.title || '',
        price: item.price || null,
        priceLabel: item.priceLabel || '',
        shippingFee: Number.isFinite(item.shippingFee) ? item.shippingFee : null,
        shippingFeeLabel: item.shippingFeeLabel || '',
        body: item.body || '',
        seller: item.seller || null,
        imageCount: Array.isArray(item.imageUrls) ? item.imageUrls.length : 0,
      },
      summary,
      riskAnalysis: productRiskAnalyses.get(summaryKey(item))?.analysis || null,
      listingTextAnalysis: listingTextAnalyses.get(summaryKey(item))?.analysis || null,
      listingImageAnalysis: listingImageAnalyses.get(summaryKey(item))?.analysis || null,
      accessoryCheck: accessoryChecks.get(summaryKey(item))?.status === 'done' ? accessoryChecks.get(summaryKey(item))?.analysis || null : null,
      usedPriceGuide: resolvedUsedPriceGuideState(item, stageComps).state?.status === 'done' ? resolvedUsedPriceGuideState(item, stageComps).state?.guide || null : null,
      comparison: purchaseReceiptComparisonPayload(item, stageComps),
      apiKey,
    });
    await finishAiLoadingState(purchaseReceipts, key, { status: 'done', receipt: data.receipt || {} }, () => {
      if (selectedKey === summaryKey(item)) refreshStageFourSection(item);
    }, 'purchaseReceipt');
    persistAiCaches();
  } catch (e) {
    purchaseReceipts.set(key, {
      status: 'error',
      error: e instanceof Error ? e.message : String(e),
    });
    persistAiCaches();
  }
  if (selectedKey === summaryKey(item)) {
    refreshStageFourSection(item);
    if (purchaseReceipts.get(key)?.status === 'done') {
      window.requestAnimationFrame(() => followPurchaseReceiptPrint($current));
    }
  }
}

function scheduleComparisonFilter(item) {
  if (!item || !isStepThreeUnlocked(item) || !comps || !isCompsCollected(comps)) return;
  const filterKey = comparisonFilterKey(item, comps);
  const listingKey = summaryKey(item);
  if (!filterKey) return;
  const existing = comparisonFilters.get(filterKey);
  if (existing?.status === 'loading') return;
  if (isStageThreeCacheSettled(existing?.status)) return;
  if (ensureListingStageCacheAlias(comparisonFilters, listingKey, filterKey)) {
    updateStageSlide();
    if (isStepThreeDone(item)) refreshStageFourSection(item);
    return;
  }
  if (comparisonFilterTimers.has(filterKey)) return;
  comparisonFilterTimers.add(filterKey);
  window.setTimeout(() => {
    comparisonFilterTimers.delete(filterKey);
    if (selectedKey !== summaryKey(item)) return;
    void ensureComparisonFilter(item);
  }, 250);
}

function ensureStageTwoPanelElement(item) {
  let panel = $current.querySelector('[data-stage-two-panel]');
  if (panel) return panel;
  const html = renderStageTwoSection(item);
  if (!html) return null;
  const stageOne = $current.querySelector('[data-stage-one-zone]');
  const product = $current.querySelector('[data-product-summary]');
  if (stageOne) stageOne.insertAdjacentHTML('afterend', html);
  else if (product) product.insertAdjacentHTML('afterend', html);
  panel = $current.querySelector('[data-stage-two-panel]');
  bindStageTwoFlow($current, item);
  bindImageAnalysisSlider($current, item);
  bindImageZoom($current);
  syncStageTwoYoutubePlayers($current);
  updateStageSlide();
  return panel;
}

function upsertStageTwoCard(item, selector, html, beforeSelector = '') {
  const panel = ensureStageTwoPanelElement(item);
  if (!panel) return;
  const grid = panel.querySelector('.stage-zone-grid') || panel;
  const existing = grid.querySelector(selector);
  const isFollowupCard =
    selector === '[data-listing-text-analysis]' ||
    selector === '[data-listing-image-analysis]' ||
    selector === '[data-listing-image-groups]' ||
    selector === '[data-accessory-check]';
  if (isFollowupCard && (panel.querySelector('[data-stage-two-start]') || !canRenderStageTwoFollowups(item))) {
    existing?.remove();
    return;
  }
  if (!html) {
    existing?.remove();
    return;
  }
  if (existing) {
    if (shouldKeepExistingLoadingBlock(existing, html)) {
      updateAiLoadingProgressNodes('', null, existing);
      return;
    }
    if (selector === '[data-stage-two-youtube]') {
      destroyStageTwoYoutubePlayers(existing);
    }
    existing.outerHTML = html;
  } else {
    const before = beforeSelector ? grid.querySelector(beforeSelector) : null;
    if (before) before.insertAdjacentHTML('beforebegin', html);
    else grid.insertAdjacentHTML('beforeend', html);
  }
  if (selector === '[data-stage-two-youtube]' && html) {
    syncStageTwoYoutubePlayers(panel);
  }
  updateStageSlide();
}

function canRenderStageTwoFollowups(item) {
  const key = summaryKey(item);
  if (!key || !isStepTwoStarted(item)) return false;
  return productRiskAnalyses.get(key)?.status === 'done';
}

function removeStageTwoFollowupCards() {
  $current
    .querySelectorAll('[data-listing-text-analysis], [data-listing-image-analysis], [data-listing-image-groups], [data-accessory-check]')
    .forEach((el) => el.remove());
}

function refreshProductRiskYoutubeCard(item) {
  const key = summaryKey(item);
  if (!key || productRiskAnalyses.get(key)?.status !== 'done') return;
  upsertStageTwoCard(item, '[data-stage-two-youtube]', renderStageTwoYoutubePanel(item));
}

function refreshStageThreeSection(item) {
  const html = renderStageThreeSection(item, comps);
  const existing = $current.querySelector('[data-stage-three-panel]');
  const renderKey = stageThreeSectionRenderKey(item, comps);
  let didReplace = false;
  if (!html) {
    existing?.remove();
    refreshStageFourSection(item);
    updateStageSlide();
    return;
  }
  if (existing && existing.dataset.stageThreeRenderKey === renderKey) {
    updateStageSlide();
  } else if (existing) {
    if (shouldKeepExistingLoadingBlock(existing, html)) {
      // 같은 종류의 로딩 블록은 유지하되, 다음 단계(AI 판별/시세표) 스케줄은 계속 보장한다.
      updateAiLoadingProgressNodes('', null, existing);
      updateStageSlide();
      if (isStepThreeUnlocked(item)) {
        scheduleComparisonFilter(item);
        void ensureUsedPriceGuide(item);
        if (isStepThreeDone(item)) refreshStageFourSection(item);
      }
      refreshDirectAiPanelIfOpen();
      return;
    }
    existing.outerHTML = html;
    didReplace = true;
  } else {
    const stageTwo = $current.querySelector('[data-stage-two-panel]');
    const stageOne = $current.querySelector('[data-stage-one-zone]');
    if (stageTwo) stageTwo.insertAdjacentHTML('afterend', html);
    else if (stageOne) stageOne.insertAdjacentHTML('afterend', html);
    didReplace = true;
  }
  const panel = $current.querySelector('[data-stage-three-panel]');
  if (panel) panel.dataset.stageThreeRenderKey = renderKey;
  if (didReplace) {
    bindStageThreeFlow($current, item);
    bindUsedPriceGuide($current, item);
    bindPurchaseReceipt($current, item);
  }
  updateStageSlide();
  lastStageThreeCompsRenderKey = stageThreeCompsRenderKey(item, comps);
  if (isStepThreeUnlocked(item)) {
    scheduleComparisonFilter(item);
    void ensureUsedPriceGuide(item);
    if (isStepThreeDone(item)) refreshStageFourSection(item);
  } else {
    syncStagePanels(item);
  }
  refreshDirectAiPanelIfOpen();
}

function refreshStageFourSection(item) {
  const html = renderStageFourSection(item, comps);
  const existing = $current.querySelector('[data-stage-four-panel]');
  if (!html) {
    existing?.remove();
    refreshStageFiveSection(item);
    updateStageSlide();
    return;
  }
  if (existing) {
    if (shouldKeepExistingLoadingBlock(existing, html)) {
      updateAiLoadingProgressNodes('', null, existing);
      updateStageSlide();
      return;
    }
    existing.outerHTML = html;
  } else {
    const stageThree = $current.querySelector('[data-stage-three-panel]');
    const stageTwo = $current.querySelector('[data-stage-two-panel]');
    if (stageThree) stageThree.insertAdjacentHTML('afterend', html);
    else if (stageTwo) stageTwo.insertAdjacentHTML('afterend', html);
  }
  bindPurchaseReceipt($current, item);
  updateStageSlide();
  refreshStageFiveSection(item);
  refreshDirectAiPanelIfOpen();
}

function refreshStageFiveSection(item) {
  const html = renderStageFiveSection(item, comps);
  const existing = $current.querySelector('[data-stage-five-panel]');
  if (!html) {
    existing?.remove();
    updateStageSlide();
    return;
  }
  if (existing) {
    if (shouldKeepExistingLoadingBlock(existing, html)) {
      updateAiLoadingProgressNodes('', null, existing);
      updateStageSlide();
      return;
    }
    existing.outerHTML = html;
  } else {
    const stageFour = $current.querySelector('[data-stage-four-panel]');
    const stageThree = $current.querySelector('[data-stage-three-panel]');
    if (stageFour) stageFour.insertAdjacentHTML('afterend', html);
    else if (stageThree) stageThree.insertAdjacentHTML('afterend', html);
  }
  bindSellerChatFlow($current, item);
  updateStageSlide();
  refreshDirectAiPanelIfOpen();
}

function refreshSellerChatSection(item) {
  refreshStageFiveSection(item);
}

function refreshStageThreeSearchCard(item) {
  const current = $current.querySelector('[data-stage-three-search-card]');
  if (!current) {
    refreshStageThreeSection(item);
    return;
  }
  const html = renderStageThreeSearchCard(item, comps);
  if (shouldKeepExistingLoadingBlock(current, html)) {
    updateAiLoadingProgressNodes('', null, current);
    return;
  }
  current.outerHTML = html;
  const updated = $current.querySelector('[data-stage-three-search-card]');
  bindStageThreeFlow(updated, item);
  updateStageSlide();
}

function refreshStageThreeCompsBlock(item, opts = {}) {
  const target = $current.querySelector('.stage-three-comps');
  if (!target) {
    refreshStageThreeSection(item);
    return;
  }
  const html = renderCompsBlock(item, comps);
  if (shouldKeepExistingLoadingBlock(target, html)) {
    updateAiLoadingProgressNodes('', null, target);
    if (opts.schedule !== false) scheduleComparisonFilter(item);
    return;
  }
  target.innerHTML = html;
  updateStageSlide();
  lastStageThreeCompsRenderKey = stageThreeCompsRenderKey(item, comps);
  if (opts.schedule !== false) scheduleComparisonFilter(item);
}

function refreshListingTextAnalysisCard(item) {
  if (!canRenderStageTwoFollowups(item)) {
    removeStageTwoFollowupCards();
    return;
  }
  upsertStageTwoCard(
    item,
    '[data-listing-text-analysis]',
    renderListingTextAnalysisCard(item),
    '[data-listing-image-analysis], [data-accessory-check], [data-stage-two-youtube]'
  );
  maybeMarkStageTwoComplete(item);
  refreshStageThreeSection(item);
}

function refreshListingImageAnalysisCard(item) {
  if (!canRenderStageTwoFollowups(item)) {
    removeStageTwoFollowupCards();
    return;
  }
  upsertStageTwoCard(
    item,
    '[data-listing-image-analysis]',
    renderListingImageAnalysisCard(item),
    '[data-accessory-check], [data-stage-two-youtube]'
  );
  upsertStageTwoCard(
    item,
    '[data-listing-image-groups]',
    renderListingImageGroupsCard(item),
    '[data-accessory-check], [data-stage-two-youtube]'
  );
  const panel = $current.querySelector('[data-stage-two-panel]');
  bindImageAnalysisSlider(panel, item);
  bindImageZoom(panel);
  maybeMarkStageTwoComplete(item);
  refreshStageThreeSection(item);
}

function refreshAccessoryCheckCard(item) {
  if (!canRenderStageTwoFollowups(item)) {
    removeStageTwoFollowupCards();
    return;
  }
  upsertStageTwoCard(item, '[data-accessory-check]', renderAccessoryCheckCard(item), '[data-stage-two-youtube]');
  maybeMarkStageTwoComplete(item);
  refreshStageThreeSection(item);
}

function previewListingImageAnalysis(item, opts = {}) {
  const key = summaryKey(item);
  if (!key || imageAnalysisPreviewedKeys.has(key)) return;
  const isSlide = $appShell?.classList.contains('app-shell--slide');
  if (isSlide && stageSlideIndex !== 1) return;
  if (!isSlide && opts.allowScroll !== true) return;
  if (!isStepTwoStarted(item)) return;
  if (!$current.querySelector('[data-listing-image-analysis]')) return;
  const images = imageAnalysisEntries(item);
  const items = lightboxAnalysisItems(images);
  if (!items.length) return;
  imageAnalysisPreviewedKeys.add(key);
  openLightbox(items[0].src, { items, index: 0 });
  startLightboxAutoPlay();
}

function refreshProductSummaryBlock(item, opts = {}) {
  const refreshStageTwo = opts.refreshStageTwo !== false;
  const refreshProductSummary = opts.refreshProductSummary !== false;
  const current = $current.querySelector('[data-product-summary]');
  if (!current) {
    renderItem(item, comps);
    return;
  }
  if (refreshProductSummary) {
    const productHtml = renderProductSummaryBlock(item);
    const renderKey = productSummaryRenderKey(item);
    const shouldSkipProductReplace = current.dataset.productSummaryRenderKey === renderKey && !shouldKeepExistingLoadingBlock(current, productHtml);
    if (shouldSkipProductReplace) {
      updateAiLoadingProgressNodes('', null, current);
    } else if (!shouldKeepExistingLoadingBlock(current, productHtml)) {
      current.outerHTML = productHtml;
      const replaced = $current.querySelector('[data-product-summary]');
      if (replaced) replaced.dataset.productSummaryRenderKey = renderKey;
    } else {
      updateAiLoadingProgressNodes('', null, current);
    }
    const updated = $current.querySelector('[data-product-summary]');
    if (updated) updated.dataset.productSummaryRenderKey = renderKey;
    bindImageZoom(updated);
    bindScrollText(updated);
    bindProductSummaryRetry(updated, item);
    bindProductImageSearch(updated, item);
  }
  if (!refreshStageTwo) {
    refreshStageThreeSection(item);
    return;
  }
  const stageTwo = $current.querySelector('[data-stage-two-panel]');
  const stageTwoHtml = renderStageTwoSection(item);
  if (stageTwo) {
    if (shouldKeepExistingLoadingBlock(stageTwo, stageTwoHtml)) {
      updateAiLoadingProgressNodes('', null, stageTwo);
      return;
    }
    destroyStageTwoYoutubePlayers(stageTwo);
    stageTwo.outerHTML = stageTwoHtml;
    bindStageTwoFlow($current, item);
    bindImageAnalysisSlider($current, item);
    bindImageZoom($current);
    syncStageTwoYoutubePlayers($current);
    updateStageSlide();
  } else {
    const stageOne = $current.querySelector('[data-stage-one-zone]');
    const product = $current.querySelector('[data-product-summary]');
    if (stageTwoHtml && stageOne) stageOne.insertAdjacentHTML('afterend', stageTwoHtml);
    else if (stageTwoHtml && product) product.insertAdjacentHTML('afterend', stageTwoHtml);
    bindStageTwoFlow($current, item);
    bindImageAnalysisSlider($current, item);
    bindImageZoom($current);
    syncStageTwoYoutubePlayers($current);
    updateStageSlide();
  }
  maybeMarkStageTwoComplete(item);
  ensureCachedStageTwoFollowups(item);
  refreshStageThreeSection(item);
  refreshDirectAiPanelIfOpen();
}

$lightbox?.addEventListener('click', (e) => {
  if (e.target === $lightbox) closeLightbox();
});
$lightboxClose?.addEventListener('click', closeLightbox);
$lightboxPrev?.addEventListener('click', (e) => {
  e.stopPropagation();
  moveLightbox(-1);
});
$lightboxNext?.addEventListener('click', (e) => {
  e.stopPropagation();
  moveLightbox(1);
});
$btnHistory?.addEventListener('click', () => setHistoryOpen(true));
$btnHistoryClose?.addEventListener('click', () => setHistoryOpen(false));
$btnFavoriteCompare?.addEventListener('click', () => {
  favoriteCompareOpen = !favoriteCompareOpen;
  if (favoriteCompareOpen) setHistoryOpen(false);
  else setHistoryOpen(true);
  renderFavoriteComparePanel();
});
$favoriteCompareModal?.addEventListener('click', (e) => {
  const close = e.target.closest('[data-favorite-compare-close]');
  if (close) {
    favoriteCompareOpen = false;
    renderFavoriteComparePanel();
    return;
  }
  const open = e.target.closest('[data-favorite-open]');
  if (!open) return;
  const key = open.getAttribute('data-favorite-open') || '';
  const found = promoteHistoryItem(key);
  if (!found) return;
  if (selectedKey !== key) {
    saveDirectAiChatState(selectedKey);
    loadDirectAiChatState(key);
  }
  selectedKey = key;
  comps = restoredStageThreeComps(found, found.comps || comps);
  favoriteCompareOpen = false;
  renderFavoriteComparePanel();
  renderItem(found, comps);
  refreshDirectAiPanelForListingChange();
  void ensureProductSummary(found);
  renderHistoryList();
  window.postMessage({ type: 'MARKET_SCRAPE_PROMOTE_HISTORY', key }, '*');
});
$btnHistoryClear?.addEventListener('click', () => {
  history = [];
  favoriteListingKeys.clear();
  favoriteCompareOpen = false;
  persistFavoriteListings();
  renderFavoriteComparePanel();
  latest = null;
  selectedKey = null;
  comps = null;
  productSummaries.clear();
  directAiChatStates.clear();
  resetDirectAiChat();
  relatedRequestedKeys.clear();
  productImageSearches.clear();
  imageAnalysisIndexes.clear();
  imageAnalysisDirections.clear();
  stageTwoActiveKeys.clear();
  stageThreeActiveKeys.clear();
  stageThreeIsolatedRefreshKeys.clear();
  productRiskAnalyses.clear();
  productRiskYoutubeAnalyses.clear();
  listingTextAnalyses.clear();
  listingImageAnalyses.clear();
  accessoryChecks.clear();
  comparisonFilters.clear();
  usedPriceGuides.clear();
  purchaseReceipts.clear();
  purchaseReceiptPrintedKeys.clear();
  comparisonFilterTimers.clear();
  imageAnalysisPreviewedKeys.clear();
  searchQueryRegenerations.clear();
  stageThreeCollectionFinalizingKeys.clear();
  stageThreeSearchProgresses.clear();
  for (const key of [...stageThreeCollectionTimeoutTimers.keys()]) clearStageThreeCollectionTimeout(key);
  usedPriceGuideProgresses.clear();
  stageThreeAutoQueryRetryCounts.clear();
  stageThreeComparisonSkippedKeys.clear();
  stageThreeComparisonRunIds.clear();
  persistAiCaches();
  renderItem(null);
  renderHistoryList();
  setHistoryOpen(false);
  window.postMessage({ type: 'MARKET_SCRAPE_CLEAR_HISTORY' }, '*');
});
$drawerBackdrop?.addEventListener('click', () => setHistoryOpen(false));

function isEditableShortcutTarget(target) {
  const el = target instanceof Element ? target : null;
  if (!el) return false;
  return Boolean(el.closest('input, textarea, select, [contenteditable="true"], [contenteditable=""]'));
}

function isLightboxOpen() {
  return Boolean($lightbox && !$lightbox.hidden);
}

function isHistoryOpen() {
  return Boolean($recentDrawer?.classList.contains('open'));
}

function isRailPanelOpen() {
  return Boolean($railPanel && !$railPanel.hidden);
}

function isShortcutPanelOpen() {
  return Boolean($shortcutPanel && !$shortcutPanel.hidden);
}

function isFavoriteCompareOpen() {
  return Boolean($favoriteCompareModal && !$favoriteCompareModal.hidden);
}

function isSlideLayout() {
  return Boolean($appShell?.classList.contains('app-shell--slide'));
}

function shortcutCode(e) {
  return String(e.code || '').trim();
}

function isShortcutCode(e, code) {
  return shortcutCode(e) === code;
}

function isVisibleElement(el) {
  if (!(el instanceof Element)) return false;
  if (el.closest('[hidden]')) return false;
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden' || style.pointerEvents === 'none') return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function moveStageSlideTo(index) {
  if (!isSlideLayout()) return false;
  const count = stageSlideCount();
  const nextIndex = Math.max(0, Math.min(Number(index) || 0, count - 1));
  if (nextIndex === stageSlideIndex || !canOpenStage(nextIndex)) return false;
  moveStageSlide(nextIndex - stageSlideIndex);
  return true;
}

function moveStageSlideToLastAvailable() {
  if (!isSlideLayout()) return false;
  for (let i = stageSlideCount() - 1; i >= 0; i -= 1) {
    if (canOpenStage(i)) return moveStageSlideTo(i);
  }
  return false;
}

function scrollViewportByDirection(dir) {
  const amount = Math.max(220, Math.round(window.innerHeight * 0.72));
  window.scrollBy({ top: dir * amount, behavior: 'smooth' });
}

function openListingPhotoLightbox() {
  const item = currentRenderedItem();
  if (!item) return false;
  const listingItems = lightboxImageItems(item.imageUrls || []);
  if (!listingItems.length) return false;
  const preferredIndex = photoIndexes.get(itemKey(item)) || 0;
  const index = Math.max(0, Math.min(preferredIndex, listingItems.length - 1));
  openLightbox(listingItems[index].src, { items: listingItems, index });
  return true;
}

function openImageAnalysisLightbox() {
  const item = currentRenderedItem();
  if (!item) return false;
  const key = summaryKey(item);
  if (!key || listingImageAnalyses.get(key)?.status !== 'done') return false;
  const items = lightboxAnalysisItems(imageAnalysisEntries(item));
  if (!items.length) return false;
  const index = Math.max(0, Math.min(imageAnalysisIndexes.get(key) || 0, items.length - 1));
  openLightbox(items[index].src, { items, index });
  return true;
}

function openImageAnalysisGridDebugLightbox() {
  const item = currentRenderedItem();
  if (!item) return false;
  const key = summaryKey(item);
  if (!key || listingImageAnalyses.get(key)?.status !== 'done') return false;
  const items = lightboxAnalysisGridItems(imageAnalysisEntries(item));
  if (!items.length) return false;
  const index = Math.max(0, Math.min(imageAnalysisIndexes.get(key) || 0, items.length - 1));
  openLightbox(items[index].src, { items, index, kind: 'gridDebug' });
  return true;
}

function activateVisibleStageStartCard() {
  const candidates = [...($current?.querySelectorAll('.stage-start-card:not(:disabled)') || [])];
  const target = candidates.find(isVisibleElement);
  if (!target) return false;
  target.click();
  return true;
}

function handleAppShortcut(e) {
  if (e.defaultPrevented || e.isComposing) return;

  if (isFavoriteCompareOpen()) {
    if (e.key === 'Escape') {
      e.preventDefault();
      favoriteCompareOpen = false;
      renderFavoriteComparePanel();
    }
    return;
  }

  if (isLightboxOpen()) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeLightbox();
      return;
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      moveLightbox(-1);
      return;
    }
    if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault();
      moveLightbox(1);
      return;
    }
    if (e.key === 'Home') {
      e.preventDefault();
      lightboxState.index = 0;
      setLightboxImage(lightboxState.items[0], { dir: -1 });
      return;
    }
    if (e.key === 'End') {
      e.preventDefault();
      lightboxState.index = Math.max(0, lightboxState.items.length - 1);
      setLightboxImage(lightboxState.items[lightboxState.index], { dir: 1 });
      return;
    }
  }

  if (e.key === 'Escape') {
    if (closeDirectAiPanel() || closeShortcutPanel() || isRailPanelOpen() || isHistoryOpen()) {
      e.preventDefault();
      closeRailPanel();
      setHistoryOpen(false);
    }
    return;
  }

  if (isShortcutCode(e, 'KeyG') && e.ctrlKey && e.shiftKey && !e.altKey && !e.metaKey) {
    if (openImageAnalysisGridDebugLightbox()) e.preventDefault();
    return;
  }

  if (isEditableShortcutTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;

  if (e.key === 'Enter') {
    if (activateVisibleStageStartCard()) e.preventDefault();
    return;
  }

  if (isSlideLayout()) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      moveStageSlide(-1);
      return;
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      moveStageSlide(1);
      return;
    }
    if (e.key === 'Home') {
      e.preventDefault();
      moveStageSlideTo(0);
      return;
    }
    if (e.key === 'End') {
      e.preventDefault();
      moveStageSlideToLastAvailable();
      return;
    }
    if (/^Digit[1-5]$/.test(shortcutCode(e)) || /^[1-5]$/.test(e.key)) {
      e.preventDefault();
      const digit = shortcutCode(e).startsWith('Digit') ? Number(shortcutCode(e).replace('Digit', '')) : Number(e.key);
      moveStageSlideTo(digit - 1);
      return;
    }
  }

  if (e.key === 'ArrowUp') {
    e.preventDefault();
    scrollViewportByDirection(-1);
    return;
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    scrollViewportByDirection(1);
    return;
  }

  if (isShortcutCode(e, 'KeyR')) {
    e.preventDefault();
    $btnRefresh?.click();
    return;
  }
  if (isShortcutCode(e, 'KeyA')) {
    e.preventDefault();
    toggleDirectAiPanel();
    return;
  }
  if (isShortcutCode(e, 'KeyI') && e.shiftKey) {
    if (openImageAnalysisLightbox()) e.preventDefault();
    return;
  }
  if (isShortcutCode(e, 'KeyX')) {
    if (openImageAnalysisLightbox()) e.preventDefault();
    return;
  }
  if (isShortcutCode(e, 'KeyI') || isShortcutCode(e, 'KeyP') || isShortcutCode(e, 'KeyF')) {
    if (openListingPhotoLightbox()) e.preventDefault();
    return;
  }
  if (isShortcutCode(e, 'Slash')) {
    e.preventDefault();
    if (e.shiftKey) toggleShortcutPanel();
    else openRailPanel('import');
    return;
  }
  if (isShortcutCode(e, 'KeyH')) {
    e.preventDefault();
    setHistoryOpen(!isHistoryOpen());
    return;
  }
  if (isShortcutCode(e, 'KeyL')) {
    e.preventDefault();
    $btnLayoutMode?.click();
    return;
  }
  if (isShortcutCode(e, 'KeyS')) {
    e.preventDefault();
    document.getElementById('btnAiSettings')?.click();
    return;
  }
  if (isShortcutCode(e, 'KeyN')) {
    e.preventDefault();
    startNewAnalysis();
    return;
  }
  if (isShortcutCode(e, 'KeyD')) {
    e.preventDefault();
    setThemeMode(isDarkModeEnabled() ? 'light' : 'dark');
  }
}

document.addEventListener('keydown', handleAppShortcut);

function favoriteCompareItems() {
  const items = history.filter((item) => favoriteListingKeys.has(itemKey(item)));
  const seen = new Set();
  return items.filter((item) => {
    const key = itemKey(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function compareReceiptForListing(key) {
  const receiptKey = findListingStageCacheKey(purchaseReceipts, key);
  return receiptKey ? purchaseReceipts.get(receiptKey)?.receipt || null : null;
}

function compareGuideForListing(key) {
  const guideKey = findListingStageCacheKey(usedPriceGuides, key);
  return guideKey ? usedPriceGuides.get(guideKey)?.guide || null : null;
}

function compareRiskCount(analysis) {
  if (!analysis) return 0;
  const groups = [analysis.chronicDefects, analysis.relatedIssues, analysis.purchaseChecklist, analysis.redFlags];
  return groups.reduce((sum, group) => sum + (Array.isArray(group) ? group.length : 0), 0);
}

function compareImageIssueCount(analysis) {
  const images = Array.isArray(analysis?.images) ? analysis.images : [];
  return images.reduce((sum, image) => {
    const defects = Array.isArray(image?.defects) ? image.defects : [];
    return sum + defects.length;
  }, 0);
}

function favoriteCompareSnapshot(item) {
  const key = itemKey(item);
  const summary = productSummaries.get(key)?.summary || {};
  const receipt = compareReceiptForListing(key);
  const guide = compareGuideForListing(key);
  const risk = productRiskAnalyses.get(key)?.analysis || null;
  const image = listingImageAnalyses.get(key)?.analysis || null;
  const price = Number.isFinite(item?.price) ? item.price : null;
  const riskCount = compareRiskCount(risk);
  const imageIssueCount = compareImageIssueCount(image);
  const verdict = receipt?.verdict || (receipt ? 'done' : 'pending');
  const score =
    (price != null ? Math.min(50, Math.max(0, 50 - price / 20000)) : 18) +
    (verdict === 'buy' ? 30 : verdict === 'negotiate' ? 18 : verdict === 'hold' ? 4 : 10) -
    Math.min(18, riskCount * 2 + imageIssueCount * 3);
  return {
    key,
    item,
    summary,
    receipt,
    guide,
    price,
    riskCount,
    imageIssueCount,
    verdict,
    score,
    imageUrl: displayImageUrl(item?.imageUrls?.[0] || ''),
  };
}

function compareVerdictText(verdict) {
  if (verdict === 'buy') return '구매 후보';
  if (verdict === 'negotiate') return '네고 후보';
  if (verdict === 'hold') return '보류';
  return '분석 전';
}

function renderFavoriteComparePanel() {
  if (!$favoriteCompareModal) return;
  const snapshots = favoriteCompareItems()
    .map(favoriteCompareSnapshot)
    .sort((a, b) => b.score - a.score || (a.price ?? Infinity) - (b.price ?? Infinity));
  $favoriteCompareModal.hidden = !favoriteCompareOpen;
  $favoriteCompareModal.setAttribute('aria-hidden', favoriteCompareOpen ? 'false' : 'true');
  document.body.classList.toggle('modal-scroll-locked', favoriteCompareOpen);
  if (!favoriteCompareOpen) return;
  if (snapshots.length < 2) {
    $favoriteCompareModal.innerHTML = `
      <div class="favorite-compare-backdrop" data-favorite-compare-close></div>
      <div class="favorite-compare-dialog">
        <div class="favorite-compare-head">
          <div>
            <strong id="favoriteCompareTitle">즐겨찾기 매물 비교</strong>
            <p>최근 매물에서 별표를 눌러 2개 이상 담으면 가격·리스크·최종 판단을 한 번에 비교합니다.</p>
          </div>
          <button type="button" data-favorite-compare-close aria-label="비교 닫기">×</button>
        </div>
      </div>
    `;
    return;
  }
  $favoriteCompareModal.innerHTML = `
    <div class="favorite-compare-backdrop" data-favorite-compare-close></div>
    <div class="favorite-compare-dialog">
      <div class="favorite-compare-head">
        <div>
          <strong id="favoriteCompareTitle">즐겨찾기 매물 비교</strong>
          <p>${snapshots.length}개 매물을 현재 분석 캐시 기준으로 정렬했습니다. 대표 이미지와 판단 근거를 같이 봅니다.</p>
        </div>
        <button type="button" data-favorite-compare-close aria-label="비교 닫기">×</button>
      </div>
      <div class="favorite-compare-list">
        ${snapshots
          .map((entry, index) => {
            const { item, summary, receipt, guide } = entry;
            const title = summary.productName || item.title || '제목 없음';
            const reason = receipt?.summary || guide?.currentAssessment || '아직 최종 판단이 없으면 가격과 수집된 리스크만 참고하세요.';
            const priceReason = receipt?.priceReason || guide?.priceReason || '';
            return `
              <article class="favorite-compare-card verdict-${escapeAttr(entry.verdict)}">
                <div class="favorite-compare-rank">${index + 1}</div>
                <div class="favorite-compare-image">
                  ${
                    entry.imageUrl
                      ? `<img src="${escapeAttr(entry.imageUrl)}" alt="" loading="lazy" />`
                      : '<span>이미지 없음</span>'
                  }
                </div>
                <div class="favorite-compare-main">
                  <div class="favorite-compare-title">
                    <strong>${escapeHtml(title)}</strong>
                    <span>${escapeHtml([item.platformLabel || item.platform || '', item.title || ''].filter(Boolean).join(' · '))}</span>
                  </div>
                  <div class="favorite-compare-metrics">
                    <b>${escapeHtml(item.priceLabel || '-')}</b>
                    <span>${escapeHtml(compareVerdictText(entry.verdict))}</span>
                    <span>리스크 ${entry.riskCount}</span>
                    <span>사진 이슈 ${entry.imageIssueCount}</span>
                    ${receipt?.negotiationPriceLabel ? `<span>네고 ${escapeHtml(receipt.negotiationPriceLabel)}</span>` : ''}
                    ${receipt?.maxBuyPriceLabel ? `<span>상한 ${escapeHtml(receipt.maxBuyPriceLabel)}</span>` : ''}
                  </div>
                  <p>${escapeHtml(reason)}</p>
                  ${priceReason ? `<p class="favorite-compare-reason">${escapeHtml(priceReason)}</p>` : ''}
                </div>
                <button type="button" data-favorite-open="${escapeAttr(entry.key)}">열기</button>
              </article>
            `;
          })
          .join('')}
      </div>
    </div>
  `;
}

function renderHistoryList() {
  if (!history.length) {
    $history.innerHTML = '<li class="empty-item">비어 있음</li>';
    renderFavoriteComparePanel();
    return;
  }
  $history.innerHTML = history
    .map((item) => {
      const key = itemKey(item);
      const active = key === selectedKey ? ' active' : '';
      const favorite = favoriteListingKeys.has(key);
      return `<li class="history-row">
        <button type="button" class="history-favorite${favorite ? ' is-active' : ''}" data-favorite-key="${escapeAttr(key)}" aria-label="즐겨찾기 ${favorite ? '해제' : '추가'}" aria-pressed="${favorite ? 'true' : 'false'}">★</button>
        <button type="button" data-key="${escapeAttr(key)}" class="${active.trim()}">
          <span class="hist-title">[${escapeHtml(item.platformLabel || item.platform)}] ${escapeHtml(item.title || '')}</span>
          <span class="hist-meta">${escapeHtml([item.priceLabel || '', shippingLine(item), formatTime(item.exportedAt)].filter(Boolean).join(' · '))}</span>
        </button>
        <button type="button" class="history-delete" data-delete-key="${escapeAttr(key)}" aria-label="최근 매물 삭제">×</button>
      </li>`;
    })
    .join('');

  renderFavoriteComparePanel();

  $history.querySelectorAll('button[data-favorite-key]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const key = btn.getAttribute('data-favorite-key') || '';
      if (!key) return;
      if (favoriteListingKeys.has(key)) favoriteListingKeys.delete(key);
      else favoriteListingKeys.add(key);
      persistFavoriteListings();
      renderHistoryList();
    });
  });

  $history.querySelectorAll('button[data-key]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-key');
      const found = promoteHistoryItem(key);
      if (found) {
        if (selectedKey !== key) {
          saveDirectAiChatState(selectedKey);
          loadDirectAiChatState(key);
        }
        selectedKey = key;
        comps = restoredStageThreeComps(found, found.comps || comps);
        renderItem(found, comps);
        refreshDirectAiPanelForListingChange();
        void ensureProductSummary(found);
        renderHistoryList();
        window.postMessage({ type: 'MARKET_SCRAPE_PROMOTE_HISTORY', key }, '*');
      }
    });
  });

  $history.querySelectorAll('button[data-delete-key]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-delete-key');
      history = history.filter((h) => itemKey(h) !== key);
      favoriteListingKeys.delete(key);
      persistFavoriteListings();
      productSummaries.delete(key);
      directAiChatStates.delete(key);
      relatedRequestedKeys.delete(key);
      productImageSearches.delete(key);
      imageAnalysisIndexes.delete(key);
      imageAnalysisDirections.delete(key);
      stageTwoActiveKeys.delete(key);
      stageThreeActiveKeys.delete(key);
      stageFiveActiveKeys.delete(key);
      stageThreeIsolatedRefreshKeys.delete(key);
      sellerChatStates.delete(key);
      productRiskAnalyses.delete(key);
      productRiskYoutubeAnalyses.delete(key);
      listingTextAnalyses.delete(key);
      listingImageAnalyses.delete(key);
      imageAnalysisPreviewedKeys.delete(key);
      searchQueryRegenerations.delete(key);
      stageThreeCollectionFinalizingKeys.delete(key);
      stageThreeSearchProgresses.delete(key);
      clearStageThreeCollectionTimeout(key);
      usedPriceGuideProgresses.delete(key);
      stageThreeAutoQueryRetryCounts.delete(key);
      for (const filterKey of [...purchaseReceipts.keys()]) {
        if (filterKey.startsWith(`${key}::`)) {
          purchaseReceipts.delete(filterKey);
          purchaseReceiptPrintedKeys.delete(filterKey);
        }
      }
      clearPurchaseReceiptPrintedForListing(key);
      if (selectedKey === key) {
        latest = history[0] || null;
        selectedKey = latest ? itemKey(latest) : null;
        comps = null;
        loadDirectAiChatState(selectedKey);
        renderItem(latest, comps);
        refreshDirectAiPanelForListingChange();
      }
      persistAiCaches();
      renderHistoryList();
      window.postMessage({ type: 'MARKET_SCRAPE_DELETE_HISTORY', key }, '*');
    });
  });
}

function promoteHistoryItem(key) {
  if (!key) return null;
  const found = history.find((h) => itemKey(h) === key);
  if (!found) return null;
  history = [found, ...history.filter((h) => itemKey(h) !== key)];
  latest = found;
  return found;
}

async function ensureProductSummary(item, opts = {}) {
  const key = summaryKey(item);
  if (!key) return;
  const summaryModel = opts.model || undefined;
  if (productSummaries.has(key)) {
    void ensureProductImage(item);
    return;
  }
  const apiKey = getAiApiKey();
  if (!apiKey || typeof globalThis.UlsaAi?.fetchProductSummary !== 'function') {
    productSummaries.set(key, { status: 'error', error: 'AI 설정이 필요합니다.' });
    if (selectedKey === key) refreshProductSummaryBlock(item);
    return;
  }

  productSummaries.set(key, { status: 'loading', model: summaryModel || null, startedAt: Date.now() });
  if (selectedKey === key) refreshProductSummaryBlock(item);

  const aiScope = createAiRequestScope();
  try {
    const data = await globalThis.UlsaAi.fetchProductSummary({
      title: item.title || '',
      body: item.body || '',
      imageUrls: item.imageUrls || [],
      apiKey,
      model: summaryModel,
      signal: aiScope.signal,
    });
    if (shouldIgnoreAiScope(aiScope)) return;
    const summary = await enrichSummaryWithProductImage(data.summary || null, item);
    if (shouldIgnoreAiScope(aiScope)) return;
    await finishAiLoadingState(productSummaries, key, { status: 'done', summary }, () => {
      if (selectedKey === key) refreshProductSummaryBlock(item);
    }, 'productSummary');
    persistAiCaches();
  } catch (e) {
    if (shouldIgnoreAiScope(aiScope, e)) return;
    productSummaries.set(key, {
      status: 'error',
      error: e instanceof Error ? e.message : String(e),
    });
    persistAiCaches();
  } finally {
    aiScope.release();
  }

  if (selectedKey === key) refreshProductSummaryBlock(item);
}

async function ensureProductRisk(item) {
  const key = summaryKey(item);
  if (!key) return;
  const existing = productRiskAnalyses.get(key);
  if (existing?.status === 'loading') return;
  if (existing?.status === 'done') {
    void ensureProductRiskYoutube(item);
    void ensureListingTextAnalysis(item);
    void ensureListingImageAnalysis(item);
    return;
  }

  const apiKey = getAiApiKey();
  if (!apiKey || typeof globalThis.UlsaAi?.fetchProductRisk !== 'function') {
    productRiskAnalyses.set(key, { status: 'error', error: 'AI 설정이 필요합니다.' });
    if (selectedKey === key) refreshProductSummaryBlock(item);
    return;
  }

  const summary = getProductSummaryState(item)?.summary || null;
  productRiskAnalyses.set(key, {
    status: 'loading',
    startedAt: Date.now(),
    durationMs: 46000,
    startPercent: 4,
    endPercent: 96,
  });
  if (selectedKey === key) refreshProductSummaryBlock(item);

  const aiScope = createAiRequestScope();
  try {
    const data = await globalThis.UlsaAi.fetchProductRisk({
      title: item.title || '',
      body: item.body || '',
      imageUrls: item.imageUrls || [],
      productName: summary?.productName || fallbackSearchQuery(item),
      summary,
      apiKey,
      signal: aiScope.signal,
    });
    if (shouldIgnoreAiScope(aiScope)) return;
    await finishAiLoadingState(productRiskAnalyses, key, { status: 'done', analysis: data.analysis || {} }, () => {
      if (selectedKey === key) refreshProductSummaryBlock(item);
    }, 'productRisk');
    persistAiCaches();
  } catch (e) {
    if (shouldIgnoreAiScope(aiScope, e)) return;
    productRiskAnalyses.set(key, {
      status: 'error',
      error: e instanceof Error ? e.message : String(e),
    });
    persistAiCaches();
  } finally {
    aiScope.release();
  }

  if (selectedKey === key) {
    playAiResultMotion();
    refreshProductSummaryBlock(item);
  }
  if (productRiskAnalyses.get(key)?.status === 'done') {
    void ensureProductRiskYoutube(item);
    void ensureListingTextAnalysis(item);
    void ensureListingImageAnalysis(item);
  }
}

async function ensureProductRiskYoutube(item) {
  const key = summaryKey(item);
  if (!key) return;
  const riskState = productRiskAnalyses.get(key);
  if (riskState?.status !== 'done') return;
  const existing = productRiskYoutubeAnalyses.get(key);
  if (existing?.status === 'loading' || existing?.status === 'done') return;

  const apiKey = getAiApiKey();
  if (!apiKey || typeof globalThis.UlsaAi?.fetchProductRiskYoutube !== 'function') {
    return;
  }

  const summary = getProductSummaryState(item)?.summary || null;
  const analysis = riskState.analysis || {};
  productRiskYoutubeAnalyses.set(key, {
    status: 'loading',
    startedAt: Date.now(),
    durationMs: 30000,
    startPercent: 8,
    endPercent: 94,
  });
  if (selectedKey === key) refreshProductRiskYoutubeCard(item);

  const aiScope = createAiRequestScope();
  try {
    const data = await globalThis.UlsaAi.fetchProductRiskYoutube({
      title: item.title || '',
      body: item.body || '',
      productName: summary?.productName || fallbackSearchQuery(item),
      summary,
      analysis,
      apiKey,
      signal: aiScope.signal,
    });
    if (shouldIgnoreAiScope(aiScope)) return;
    await finishAiLoadingState(
      productRiskYoutubeAnalyses,
      key,
      {
        status: 'done',
        analysis: {
          youtubeVideos: data.youtubeVideos || [],
          youtubeSearch: data.youtubeSearch || null,
        },
      },
      () => {
        if (selectedKey === key) refreshProductRiskYoutubeCard(item);
      },
      'productRiskYoutube'
    );
    persistAiCaches();
  } catch (e) {
    if (shouldIgnoreAiScope(aiScope, e)) return;
    productRiskYoutubeAnalyses.set(key, {
      status: 'error',
      error: e instanceof Error ? e.message : String(e),
    });
    persistAiCaches();
  } finally {
    aiScope.release();
  }

  if (selectedKey === key) refreshProductRiskYoutubeCard(item);
}

async function ensureListingTextAnalysis(item) {
  const key = summaryKey(item);
  if (!key) return;
  const existing = listingTextAnalyses.get(key);
  if (existing?.status === 'loading') return;
  if (existing?.status === 'done' && existing.source === 'ai' && hasListingTextAnalysisContent(existing.analysis)) {
    void ensureAccessoryCheck(item);
    return;
  }
  if (existing?.status === 'done') listingTextAnalyses.delete(key);

  const apiKey = getAiApiKey();
  if (!apiKey || typeof globalThis.UlsaAi?.fetchListingTextAnalysis !== 'function') {
    void ensureAccessoryCheck(item);
    return;
  }

  const summary = getProductSummaryState(item)?.summary || null;
  const riskAnalysis = productRiskAnalyses.get(key)?.analysis || null;
  listingTextAnalyses.set(key, { status: 'loading', startedAt: Date.now() });
  if (selectedKey === key) refreshListingTextAnalysisCard(item);

  const aiScope = createAiRequestScope();
  try {
    const data = await globalThis.UlsaAi.fetchListingTextAnalysis({
      title: item.title || '',
      body: item.body || '',
      seller: item.seller || null,
      priceLabel: item.priceLabel || '',
      shippingFeeLabel: item.shippingFeeLabel || '',
      productName: summary?.productName || fallbackSearchQuery(item),
      summary,
      riskAnalysis,
      apiKey,
      signal: aiScope.signal,
    });
    if (shouldIgnoreAiScope(aiScope)) return;
    const analysis =
      data.analysis?.parseOk && hasListingTextAnalysisContent(data.analysis)
        ? meaningfulListingTextAnalysis(data.analysis)
        : null;
    if (!analysis) {
      await showAiLoadingComplete(listingTextAnalyses, key, () => {
        if (selectedKey === key) refreshListingTextAnalysisCard(item);
      }, 'listingText');
      listingTextAnalyses.delete(key);
      persistAiCaches();
      if (selectedKey === key) refreshListingTextAnalysisCard(item);
      return;
    }
    await finishAiLoadingState(listingTextAnalyses, key, { status: 'done', analysis, source: 'ai' }, () => {
      if (selectedKey === key) refreshListingTextAnalysisCard(item);
    }, 'listingText');
    persistAiCaches();
    if (selectedKey === key) {
      playAiResultMotion();
      refreshListingTextAnalysisCard(item);
    }
  } catch (e) {
    if (shouldIgnoreAiScope(aiScope, e)) return;
    listingTextAnalyses.delete(key);
    persistAiCaches();
    if (selectedKey === key) refreshListingTextAnalysisCard(item);
  } finally {
    aiScope.release();
  }
  void ensureAccessoryCheck(item);
}

async function ensureAccessoryCheck(item) {
  const key = summaryKey(item);
  if (!key) return;
  if (productRiskAnalyses.get(key)?.status !== 'done') return;
  const textState = listingTextAnalyses.get(key);
  const imageState = listingImageAnalyses.get(key);
  const textSettled = !textState || textState.status === 'done' || textState.status === 'error';
  const imageSettled = imageState?.status === 'done' || imageState?.status === 'error';
  if (!textSettled || !imageSettled) return;

  const existing = accessoryChecks.get(key);
  if (existing?.status === 'loading') return;
  if (existing?.status === 'done') return;

  const apiKey = getAiApiKey();
  if (!apiKey || typeof globalThis.UlsaAi?.fetchAccessoryCheck !== 'function') {
    accessoryChecks.set(key, { status: 'error', error: 'AI 설정이 필요합니다.' });
    if (selectedKey === key) refreshAccessoryCheckCard(item);
    return;
  }

  const summary = getProductSummaryState(item)?.summary || null;
  const riskAnalysis = productRiskAnalyses.get(key)?.analysis || null;
  const listingTextAnalysis = listingTextAnalyses.get(key)?.analysis || null;
  const listingImageAnalysis = listingImageAnalyses.get(key)?.analysis || null;
  accessoryChecks.set(key, {
    status: 'loading',
    startedAt: Date.now(),
    durationMs: AI_LOADING_DURATIONS.accessoryCheck,
    startPercent: 6,
    endPercent: 96,
  });
  if (selectedKey === key) refreshAccessoryCheckCard(item);

  const aiScope = createAiRequestScope();
  try {
    const data = await globalThis.UlsaAi.fetchAccessoryCheck({
      title: item.title || '',
      body: item.body || '',
      productName: summary?.productName || fallbackSearchQuery(item),
      summary,
      riskAnalysis,
      listingTextAnalysis,
      listingImageAnalysis,
      apiKey,
      signal: aiScope.signal,
    });
    if (shouldIgnoreAiScope(aiScope)) return;
    const analysis = data.analysis?.parseOk ? data.analysis : null;
    if (!analysis) {
      await showAiLoadingComplete(accessoryChecks, key, () => {
        if (selectedKey === key) refreshAccessoryCheckCard(item);
      }, 'accessoryCheck');
      accessoryChecks.set(key, { status: 'error', error: '구성품 체크 결과를 해석하지 못했습니다.' });
      persistAiCaches();
      if (selectedKey === key) refreshAccessoryCheckCard(item);
      return;
    }
    await finishAiLoadingState(accessoryChecks, key, { status: 'done', analysis }, () => {
      if (selectedKey === key) refreshAccessoryCheckCard(item);
    }, 'accessoryCheck');
    invalidatePurchaseReceiptCaches(item);
    persistAiCaches();
    if (selectedKey === key) {
      playAiResultMotion();
      refreshAccessoryCheckCard(item);
    }
  } catch (e) {
    if (shouldIgnoreAiScope(aiScope, e)) return;
    accessoryChecks.set(key, {
      status: 'error',
      error: e instanceof Error ? e.message : String(e),
    });
    persistAiCaches();
    if (selectedKey === key) refreshAccessoryCheckCard(item);
  } finally {
    aiScope.release();
  }
}

async function ensureListingImageAnalysis(item) {
  const key = summaryKey(item);
  if (!key) return;
  const existing = listingImageAnalyses.get(key);
  if (existing?.status === 'loading') return;
  if (existing?.status === 'done' && Number(existing.overlayVersion) >= LISTING_IMAGE_OVERLAY_VERSION) {
    if (selectedKey === key) {
      refreshListingImageAnalysisCard(item);
      previewListingImageAnalysis(item);
    }
    void ensureAccessoryCheck(item);
    return;
  }
  if (existing?.status === 'done') listingImageAnalyses.delete(key);

  const apiKey = getAiApiKey();
  if (!apiKey || typeof globalThis.UlsaAi?.fetchListingImageAnalysis !== 'function') {
    listingImageAnalyses.set(key, { status: 'error', error: 'AI 설정이 필요합니다.' });
    if (selectedKey === key) refreshProductSummaryBlock(item);
    void ensureAccessoryCheck(item);
    return;
  }

  const imageUrls = Array.isArray(item.imageUrls) ? item.imageUrls : [];
  if (!imageUrls.length) {
    listingImageAnalyses.set(key, {
      status: 'done',
      analysis: { images: [], overall: '분석할 매물 사진이 없습니다.' },
    });
    persistAiCaches();
    if (selectedKey === key) refreshListingImageAnalysisCard(item);
    void ensureAccessoryCheck(item);
    return;
  }

  const summary = getProductSummaryState(item)?.summary || null;
  listingImageAnalyses.set(key, {
    status: 'loading',
    startedAt: Date.now(),
    durationMs: AI_LOADING_DURATIONS.listingImage,
    endPercent: 96,
  });
  if (selectedKey === key) refreshListingImageAnalysisCard(item);

  const aiScope = createAiRequestScope();
  try {
    const data = await globalThis.UlsaAi.fetchListingImageAnalysis({
      title: item.title || '',
      body: item.body || '',
      imageUrls,
      productName: summary?.productName || fallbackSearchQuery(item),
      apiKey,
      signal: aiScope.signal,
    });
    if (shouldIgnoreAiScope(aiScope)) return;
    await finishAiLoadingState(listingImageAnalyses, key, { status: 'done', analysis: data.analysis || {}, overlayVersion: LISTING_IMAGE_OVERLAY_VERSION }, () => {
      if (selectedKey === key) refreshListingImageAnalysisCard(item);
    }, 'listingImage');
    persistAiCaches();
    if (selectedKey === key) {
      playAiResultMotion();
      refreshListingImageAnalysisCard(item);
      previewListingImageAnalysis(item, { allowScroll: true });
    }
  } catch (e) {
    if (shouldIgnoreAiScope(aiScope, e)) return;
    listingImageAnalyses.set(key, {
      status: 'error',
      error: e instanceof Error ? e.message : String(e),
    });
    persistAiCaches();
    if (selectedKey === key) refreshListingImageAnalysisCard(item);
  } finally {
    aiScope.release();
  }
  void ensureAccessoryCheck(item);
}

function applyPayload(payload, opts = {}) {
  const prevLatestKey = latest ? itemKey(latest) : '';
  const prevExportedAt = latest?.exportedAt || '';
  const previousSelectedKey = selectedKey;
  const hadRenderedItem = Boolean($current.querySelector('[data-stage-one-zone]'));

  latest = payload?.latest ?? latest;
  history = Array.isArray(payload?.history) ? payload.history : history;

  const latestKey = latest ? itemKey(latest) : '';
  const latestUpdated =
    opts.forceRestart ||
    (payload?.latest &&
      latest &&
      (latestKey !== prevLatestKey ||
        (latest.exportedAt && prevExportedAt && latest.exportedAt !== prevExportedAt)));

  if (latestUpdated && latest) {
    activateListingItem(latest);
    return;
  }

  const selectedItem =
    (selectedKey && history.find((item) => itemKey(item) === selectedKey)) ||
    latest ||
    null;
  const rawComps = payload?.comps ?? selectedItem?.comps ?? latest?.comps ?? null;
  const selectedItemKey = selectedItem ? itemKey(selectedItem) : '';
  comps = selectedItemKey ? restoredStageThreeComps(selectedItem, rawComps) : null;

  if (selectedItem) {
    if (previousSelectedKey !== selectedItemKey) {
      saveDirectAiChatState(previousSelectedKey);
      loadDirectAiChatState(selectedItemKey);
    }
    selectedKey = selectedItemKey;
    if (hadRenderedItem && previousSelectedKey === selectedItemKey && relatedRequestedKeys.has(selectedItemKey)) {
      const nextRenderKey = stageThreeCompsRenderKey(selectedItem, comps);
      if (nextRenderKey && nextRenderKey !== lastStageThreeCompsRenderKey) {
        if (stageThreeIsolatedRefreshKeys.has(selectedItemKey)) {
          refreshStageThreeCompsBlock(selectedItem);
        } else {
          refreshStageThreeSection(selectedItem);
        }
      }
    } else if (!hadRenderedItem) {
      renderItem(selectedItem, comps);
      refreshDirectAiPanelForListingChange();
      void ensureProductSummary(selectedItem);
    }
  } else if (!history.length) {
    loadDirectAiChatState('', { keepOpen: directAiChat.open });
    renderItem(null);
    refreshDirectAiPanelForListingChange();
  }

  renderHistoryList();
}

function setUrlImportStatus(message = '', tone = '') {
  if ($urlImportStatus) {
    $urlImportStatus.textContent = message;
    $urlImportStatus.dataset.tone = tone;
  }
  if ($railStatus) {
    $railStatus.textContent = message || 'URL을 붙여넣으면 탭을 열어 매물 정보를 가져옵니다.';
    $railStatus.dataset.tone = tone;
  }
}

function supportedListingUrl(rawUrl) {
  try {
    const url = new URL(String(rawUrl || '').trim());
    if (url.protocol !== 'https:') return null;
    if (/(^|\.)bunjang\.co\.kr$/i.test(url.hostname)) return url.href;
    if (/(^|\.)daangn\.com$/i.test(url.hostname)) return url.href;
    if (/(^|\.)joongna\.com$/i.test(url.hostname)) return url.href;
    return null;
  } catch {
    return null;
  }
}

function requestListingUrlImport(rawUrl) {
  const url = supportedListingUrl(rawUrl);
  if (!url) {
    setUrlImportStatus('지원 URL 아님', 'error');
    return;
  }
  pendingImportUrl = url;
  setUrlImportStatus('페이지 여는 중...', 'loading');
  window.postMessage({ type: 'MARKET_SCRAPE_IMPORT_URL', url }, '*');
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(s) {
  return escapeHtml(s);
}

let __appStarted = false;
function initMain() {
  if (__appStarted) return;
  __appStarted = true;

  window.addEventListener('message', (ev) => {
    if (ev.source !== window) return;
    const d = ev.data;
    if (!d) return;
    if (d.type === 'MARKET_SCRAPE_BRIDGE') {
      applyPayload({ latest: d.latest, history: d.history, comps: d.comps });
      return;
    }
    if (d.type === 'MARKET_SCRAPE_URL_IMPORT_RESULT') {
      const resultUrl = String(d.url || '').trim();
      if (pendingImportUrl && resultUrl && resultUrl !== pendingImportUrl) return;
      if (d.ok) {
        pendingImportUrl = '';
        setUrlImportStatus('불러옴', 'success');
        if ($urlImportInput) $urlImportInput.value = '';
        if ($railUrlInput) $railUrlInput.value = '';
        if (d.listing) {
          activateListingItem(d.listing, { skipIfSameActive: true });
          closeRailPanel();
        } else {
          window.postMessage({ type: 'MARKET_SCRAPE_REQUEST' }, '*');
        }
        window.setTimeout(() => {
          window.postMessage({ type: 'MARKET_SCRAPE_REQUEST' }, '*');
        }, 800);
      } else if (!pendingImportUrl || !resultUrl || resultUrl === pendingImportUrl) {
        pendingImportUrl = '';
        setUrlImportStatus(d.error || '불러오기 실패', 'error');
      }
    }
  });

  $urlImportForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    requestListingUrlImport($urlImportInput?.value || '');
  });

  $railImportForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    requestListingUrlImport($railUrlInput?.value || '');
  });

  $autoRunToggle?.addEventListener('change', () => {
    setAutoRunMode($autoRunToggle.checked);
  });

  $btnRefresh.addEventListener('click', () => {
    clearCurrentAnalysisState();
    renderItem(null);
    window.postMessage({ type: 'MARKET_SCRAPE_REQUEST' }, '*');
  });

  for (const delay of [0, 250, 800, 1600]) {
    window.setTimeout(() => {
      window.postMessage({ type: 'MARKET_SCRAPE_REQUEST' }, '*');
    }, delay);
  }
}

function bootstrapApp() {
  window.addEventListener('ulsa:ai-ready', () => initMain(), { once: true });
  if (globalThis.__ulsaAiReady) initMain();
}
bootstrapApp();
