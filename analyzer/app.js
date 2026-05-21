const $current = document.getElementById('current');
const $appShell = document.getElementById('appShell');
const $history = document.getElementById('history');
const $btnRefresh = document.getElementById('btnRefresh');
const $btnLayoutMode = document.getElementById('btnLayoutMode');
const $btnDirectAi = document.getElementById('btnDirectAi');
const $btnHistory = document.getElementById('btnHistory');
const $btnHistoryClose = document.getElementById('btnHistoryClose');
const $btnHistoryClear = document.getElementById('btnHistoryClear');
const $recentDrawer = document.getElementById('recentDrawer');
const $drawerBackdrop = document.getElementById('drawerBackdrop');
const $directAiPanel = document.getElementById('directAiPanel');
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
const stageTwoCompletedKeys = new Set();
const stageThreeIsolatedRefreshKeys = new Set();
const productRiskAnalyses = new Map();
const listingTextAnalyses = new Map();
const listingImageAnalyses = new Map();
const comparisonFilters = new Map();
const comparisonFilterTimers = new Set();
const usedPriceGuides = new Map();
const purchaseReceipts = new Map();
const imageAnalysisPreviewedKeys = new Set();
const searchQueryRegenerations = new Map();
const stageThreeAutoQueryRetryCounts = new Map();
const directAiChat = { open: false, status: 'idle', messages: [] };
let lightboxAutoPlayTimer = 0;
let lightboxCloseTimer = 0;
let photoSliderAutoTimer = 0;
let imageAnalysisAutoTimer = 0;
let stageSlideIndex = 0;
let stageSlideAnimationTimer = 0;
let stageStartMotionTimer = 0;
let lastStageThreeCompsRenderKey = '';
const RECEIPT_PRINT_SCROLL_MS = 7800;
const MIN_PRICE_REFERENCE_MATCHES = 5;
const MAX_STAGE_THREE_AUTO_QUERY_RETRIES = 2;
const AI_CACHE_STORAGE_KEY = 'ulsa_ai_analysis_cache_v15';
const LAYOUT_MODE_STORAGE_KEY = 'ulsa_layout_mode';
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

function restorePersistedMap(map, raw) {
  if (!raw || typeof raw !== 'object') return;
  for (const [key, state] of Object.entries(raw)) {
    if (state?.status === 'done' || state?.status === 'error') map.set(key, state);
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

function persistAiCaches() {
  try {
    localStorage.setItem(
      AI_CACHE_STORAGE_KEY,
      JSON.stringify({
        relatedRequestedKeys: setToPersistableArray(relatedRequestedKeys),
        stageThreeActiveKeys: setToPersistableArray(stageThreeActiveKeys),
        productSummaries: mapToPersistableObject(productSummaries),
        productRiskAnalyses: mapToPersistableObject(productRiskAnalyses),
        listingTextAnalyses: mapToPersistableObject(listingTextAnalyses),
        listingImageAnalyses: mapToPersistableObject(listingImageAnalyses),
        comparisonFilters: mapToPersistableObject(comparisonFilters),
        usedPriceGuides: mapToPersistableObject(usedPriceGuides),
        purchaseReceipts: mapToPersistableObject(purchaseReceipts),
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
      restorePersistedMap(listingTextAnalyses, parsed.listingTextAnalyses);
      restorePersistedMap(listingImageAnalyses, parsed.listingImageAnalyses);
      restorePersistedMap(comparisonFilters, parsed.comparisonFilters);
      restorePersistedMap(usedPriceGuides, parsed.usedPriceGuides);
      restorePersistedMap(purchaseReceipts, parsed.purchaseReceipts);
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
  persistAiCaches();
}

loadAiCaches();
setLayoutMode(readLayoutMode(), { persist: false });

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
  updateStageSlide();
  requestAnimationFrame(() => bindScrollText($current));
}

function stageSlideCount() {
  return Math.max(1, $current?.querySelectorAll('[data-stage-panel]')?.length || 1);
}

function currentRenderedItem() {
  return (selectedKey && history.find((item) => itemKey(item) === selectedKey)) || latest || null;
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
  return Boolean(riskDone && textSettled && imageSettled);
}

function isStepTwoDone(item) {
  return isStepTwoFlowComplete(item);
}

function isStepThreeUnlocked(item) {
  const key = summaryKey(item);
  return Boolean(key && stageThreeActiveKeys.has(key));
}

function isStepThreeDone(item) {
  if (!isStepTwoDone(item) || !isStepThreeUnlocked(item)) return false;
  if (!comps || !isCompsCollected(comps)) return false;
  const key = comparisonFilterKey(item, comps);
  if (!key) return false;
  return comparisonFilters.get(key)?.status === 'done' && usedPriceGuides.get(key)?.status === 'done';
}

function maybeMarkStageTwoComplete(item) {
  const key = summaryKey(item);
  if (key && isStepTwoFlowComplete(item)) stageTwoCompletedKeys.add(key);
}

function ensureCachedStageTwoFollowups(item) {
  const key = summaryKey(item);
  if (!key || productRiskAnalyses.get(key)?.status !== 'done') return;
  void ensureListingTextAnalysis(item);
  void ensureListingImageAnalysis(item);
}

function syncStagePanels(item) {
  if (!$current || !item) return;
  if (!isStepTwoDone(item)) {
    $current.querySelector('[data-stage-three-panel]')?.remove();
    $current.querySelector('[data-stage-four-panel]')?.remove();
  } else if (!isStepThreeDone(item)) {
    $current.querySelector('[data-stage-four-panel]')?.remove();
  }
  updateStageSlide();
}

function canOpenStage(index) {
  const item = currentRenderedItem();
  if (index <= 0) return true;
  if (index === 1) return isStepOneDone(item);
  if (index === 2) return isStepTwoDone(item);
  if (index === 3) return isStepThreeDone(item);
  return false;
}

function updateStageSlide() {
  const count = stageSlideCount();
  stageSlideIndex = Math.max(0, Math.min(stageSlideIndex, count - 1));
  while (stageSlideIndex > 0 && !canOpenStage(stageSlideIndex)) {
    stageSlideIndex -= 1;
  }
  $appShell?.setAttribute('data-stage-slide-index', String(stageSlideIndex));
  const controls = $current?.querySelector('[data-stage-slide-controls]');
  if (!controls) return;
  const prev = controls.querySelector('[data-stage-slide-prev]');
  const next = controls.querySelector('[data-stage-slide-next]');
  const label = controls.querySelector('[data-stage-slide-label]');
  if (prev) prev.disabled = stageSlideIndex <= 0;
  if (next) next.disabled = stageSlideIndex >= count - 1 || !canOpenStage(stageSlideIndex + 1);
  if (label) label.textContent = `Step ${stageSlideIndex + 1}/${count}`;
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

function renderStageSlideControls() {
  return `
    <nav class="stage-slide-controls" data-stage-slide-controls aria-label="단계 이동">
      <button type="button" class="btn btn-secondary btn-small" data-stage-slide-prev>이전 단계</button>
      <span class="stage-slide-label" data-stage-slide-label>Step 1/1</span>
      <button type="button" class="btn btn-secondary btn-small" data-stage-slide-next>다음 단계</button>
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
    ? '판매자 지표는 참고할 만하지만, 본문에 빠진 상태 설명을 대신해주지는 못합니다.'
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
  return splitSearchQueries(summary?.searchQueries || summary?.searchQuery || fallbackSearchQuery(item));
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
    }));
}

function imageAnalysisLabel(image) {
  const explicit = String(image?.label || image?.role || image?.tag || '').replace(/\s+/g, ' ').trim();
  if (explicit) return explicit.slice(0, 14);
  const comment = String(image?.comment || '');
  const level = String(image?.level || 'neutral');
  if (level === 'risk') return '주의 사진';
  if (/홍보|공식|쇼핑몰|스크랩|카탈로그|광고컷|렌더/i.test(comment)) return '홍보 이미지';
  if (/실물.*확인|확인할 수 없|상태를 알 수 없/i.test(comment)) return '실물 확인 불가';
  if (/구성품|박스|케이블|충전기|스트랩|부속/i.test(comment)) return '구성품 확인';
  if (/흠집|스크래치|찍힘|오염|마모|파손/i.test(comment)) return '흠집 확인';
  if (/작동|화면|전원|버튼|단자/i.test(comment)) return '작동 확인';
  if (/부족|안 보|확인 필요/i.test(comment)) return '부족한 사진';
  return level === 'safe' ? '상태 확인' : '사진 근거';
}

function renderStageTwoLoading(title, delay = 0) {
  return `
    <article class="mini-card stage-two-risk-card is-loading" style="--stage-delay:${delay}ms">
      <div class="summary-loading summary-loading--skeleton">
        <div class="ai-loading-copy">
          <p class="stage-two-card-label">AI 분석 중</p>
          <h3>${escapeHtml(title)}</h3>
          <p class="mini-muted">제품 정보를 기반으로 구매 전 확인할 리스크를 정리합니다.</p>
        </div>
        <div class="risk-loader">
          <span></span><span></span><span></span>
        </div>
      </div>
    </article>
  `;
}

function renderStageTwoLoadingCards() {
  return ['관련 이슈 검색 중', '고질병 검색 중']
    .map((title, idx) => renderStageTwoLoading(title, idx * 140))
    .join('');
}

function renderStageTwoRiskCard(kind, item, delay = 0) {
  const level = String(item?.level || 'caution').trim();
  return `
    <article class="mini-card stage-two-risk-card risk-${escapeAttr(level)}" style="--stage-delay:${delay}ms">
      <p class="stage-two-card-label">${escapeHtml(kind)}</p>
      <h3>${escapeHtml(item?.title || '확인 필요')}</h3>
      <p>${escapeHtml(item?.detail || item?.desc || '구매 전 추가 확인이 필요합니다.')}</p>
    </article>
  `;
}

function renderStageTwoRiskCards(analysis) {
  const related = Array.isArray(analysis?.relatedIssues) ? analysis.relatedIssues : [];
  const defects = Array.isArray(analysis?.chronicDefects) ? analysis.chronicDefects : [];
  const verdict = String(analysis?.verdict || '').trim();
  const cards = [
    ...related.slice(0, 3).map((item, idx) => renderStageTwoRiskCard('관련 이슈', item, idx * 130)),
    ...defects.slice(0, 3).map((item, idx) =>
      renderStageTwoRiskCard('고질병', item, (related.length + idx) * 130)
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

function renderAnalysisLoadingCard(title, desc, className = '', delay = 0) {
  return `
    <article class="mini-card stage-two-card is-loading ${escapeAttr(className)}" style="--stage-delay:${delay}ms">
      <div class="summary-loading summary-loading--skeleton">
        <div class="ai-loading-copy">
          <p class="stage-two-card-label">AI 분석 중</p>
          <h3>${escapeHtml(title)}</h3>
          <p class="mini-muted">${escapeHtml(desc)}</p>
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
      520
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
    return renderAnalysisLoadingCard('판매자 이미지 분석', '매물 사진별 하자·구성품·상태를 확인합니다.', 'stage-two-card--image-analysis', 250).replace('<article ', '<article data-listing-image-analysis ');
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

function renderDirectAiPanel() {
  if (!$directAiPanel) return;
  const messages = Array.isArray(directAiChat.messages) ? directAiChat.messages : [];
  const productName = latest ? stepTwoProductName(latest) : '스팀덱 OLED 512GB';
  const defaultPrompt = `${productName} 중고매물을 사려는데 고질병이나 관련 이슈를 알려줘.`;
  const rows = messages.length
    ? messages
        .map(
          (msg) => `
            <div class="direct-chat-msg direct-chat-msg--${escapeAttr(msg.role || 'ai')}">
              <span>${msg.role === 'user' ? '나' : 'AI'}</span>
              <p>${escapeHtml(msg.text || '')}</p>
            </div>
          `
        )
        .join('')
    : `<p class="direct-chat-empty">여기에 직접 물어보면 입력한 문장 그대로 Gemini에 보냅니다.</p>`;
  $directAiPanel.hidden = !directAiChat.open;
  $directAiPanel.setAttribute('aria-hidden', directAiChat.open ? 'false' : 'true');
  $directAiPanel.innerHTML = `
    <article class="direct-chat-card">
      <div class="direct-chat-head">
        <div>
          <p class="stage-two-card-label">직접 대화</p>
          <h3>AI 모델에게 그대로 물어보기</h3>
        </div>
        <div class="direct-chat-actions">
          <button type="button" class="chip-btn direct-chat-clear">지우기</button>
          <button type="button" class="chip-btn direct-chat-close">닫기</button>
        </div>
      </div>
      <div class="direct-chat-log">${rows}</div>
      <form class="direct-chat-form">
        <textarea name="prompt" rows="3" placeholder="${escapeAttr(defaultPrompt)}"${directAiChat.status === 'loading' ? ' disabled' : ''}></textarea>
        <button type="submit" class="btn btn-small"${directAiChat.status === 'loading' ? ' disabled' : ''}>${directAiChat.status === 'loading' ? '질문 중...' : '보내기'}</button>
      </form>
    </article>
  `;
  bindDirectAiChat();
}

function stripChatMarkdown(text) {
  return String(text || '')
    .replace(/\*\*/g, '')
    .replace(/__/g, '')
    .replace(/`/g, '')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s*[-*]\s+/gm, '');
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
      ? `${renderListingTextAnalysisCard(item)}${renderListingImageAnalysisCard(item)}`
      : '';
  return `
    <section class="stage-two-panel stage-zone stage-two-zone is-active" data-stage-panel data-stage-two-panel>
      <aside class="stage-zone-label">
        <b>Step 2</b>
        <span>리스크 판별</span>
      </aside>
      <div class="stage-zone-grid stage-two-zone-grid">
        ${
          !isActive
            ? `<button type="button" class="mini-card stage-two-card stage-two-card--ready stage-start-card" data-stage-two-start="${escapeAttr(key)}">
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
              ? renderStageTwoRiskCards(analysis)
              : renderStageTwoLoadingCards()
        }
        ${followupHtml}
      </div>
    </section>
  `;
}

function renderStageThreeSection(item, comps) {
  if (!item) return '';
  if (!isStepTwoDone(item)) {
    return '';
  }
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
          <button type="button" class="mini-card stage-three-card stage-three-card--ready stage-start-card" data-stage-three-start="${escapeAttr(key)}">
            <div class="stage-two-ready">
              <div>
                <p class="stage-two-card-label">다음 단계 대기</p>
                <h3>리스크 판별을 확인한 뒤 가격 참고자료 수집을 시작하세요.</h3>
                <p>버튼을 눌러 신품가·번개·당근·중고나라 관련 매물을 모으고 구매 판단용 참고자료로 정리합니다.</p>
                <span class="stage-start-card__cta">버튼 클릭으로 시작</span>
              </div>
            </div>
          </button>
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
        ${renderStageThreeSearchCard(item, comps)}
        ${renderUsedPriceGuideBlock(item, comps)}
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
          <p>AI가 정리한 키워드로 번개·당근·중고나라 관련 매물을 자동 수집해 가격 참고자료로 정리합니다.</p>
        </div>
        <div class="stage-three-actions">
          <button type="button" class="chip-btn" data-stage-three-refresh="${escapeAttr(key)}">다시 검색·정리</button>
          ${danawaUrl ? `<a class="price-source-link" href="${escapeAttr(danawaUrl)}" target="_blank" rel="noopener">다나와 검색 ↗</a>` : ''}
        </div>
      </div>
      <div class="search-query-list">${queryButtons}</div>
      ${
        queryState?.status === 'error'
          ? `<p class="meta empty">검색어 재생성 실패: ${escapeHtml(queryState.error || '다시 시도해 주세요.')}</p>`
          : ''
      }
      <div class="stage-three-comps">${queryState?.status === 'loading' ? renderCompsLoading('AI가 검색어를 다시 만들고 있습니다...') : renderCompsBlock(item, comps)}</div>
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
  return rawComps.bunjang || rawComps.daangn || rawComps.joongna ? rawComps : null;
}

function renderProductSummaryBlock(item) {
  const state = getProductSummaryState(item);
  const summary = state?.summary;
  const images = productSummaryImages(summary, item);
  const danawaUrl = danawaPriceUrl(summary);

  if (state?.status === 'loading') {
    const loadingHint = '현재 선택한 모델로 제품명·신품 가격 참고자료·대표 이미지를 준비합니다.';
    return `
      <article class="mini-card mini-card--product mini-card--compact mini-card--loading" data-product-summary>
        <div class="summary-loading summary-loading--skeleton">
          <div class="ai-loading-copy">
            <p class="mini-value">AI가 제품 정보를 정리하는 중...</p>
            <p class="mini-muted">${escapeHtml(loadingHint)}</p>
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
      <article class="mini-card mini-card--product mini-card--compact" data-product-summary>
        <p class="mini-value">제품 정리를 만들지 못했습니다.</p>
        <p class="mini-muted">${escapeHtml(state.error || 'API 설정 또는 서버 상태를 확인하세요.')}</p>
        <button type="button" class="btn btn-small retry-product-summary-btn">제품 정리 다시 시도</button>
      </article>
    `;
  }

  return `
    <article class="mini-card mini-card--product mini-card--compact" data-product-summary>
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
                ? `<p class="mini-value">AI 추정 신품가 참고: ${escapeHtml(summary.newPrice)}${
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
  if (!key || !comps || !isCompsCollected(comps)) return '';
  const signature = comparisonSignature(comps);
  return signature ? `${key}::${signature}` : `${key}::collected::empty`;
}

function stageThreeCompsRenderKey(item, nextComps) {
  const key = summaryKey(item);
  if (!key) return '';
  if (!nextComps) return `${key}::empty`;
  if (!isCompsCollected(nextComps)) return `${key}::collecting`;
  return `${key}::collected::${comparisonSignature(nextComps)}::thumbs::${comparisonThumbnailSignature(nextComps)}`;
}

function isCompsCollected(comps) {
  return comps?.status === 'collected';
}

function renderCompsLoading(message) {
  return `
    <div class="summary-loading summary-loading--skeleton comparison-loading">
      <div class="ai-loading-copy">
        <p class="mini-value">${escapeHtml(message)}</p>
        <p class="mini-muted">완료되면 일치하는 매물만 한 번에 표시합니다.</p>
      </div>
      <div class="risk-loader"><span></span><span></span><span></span></div>
    </div>
  `;
}

function filteredComparisonItems(item, comps) {
  const all = comparisonItems(comps);
  const filterKey = comparisonFilterKey(item, comps);
  const state = filterKey ? comparisonFilters.get(filterKey) : null;
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

function usedPriceGuideKey(item, comps) {
  return comparisonFilterKey(item, comps);
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

function renderPurchaseReceiptBlock(item, comps) {
  if (!item || !comps || !isCompsCollected(comps)) return '';
  const filterKey = comparisonFilterKey(item, comps);
  const filterState = filterKey ? comparisonFilters.get(filterKey) : null;
  if (filterState?.status !== 'done') return '';
  const guideState = filterKey ? usedPriceGuides.get(filterKey) : null;
  if (guideState?.status !== 'done') return '';
  const key = purchaseReceiptKey(item, comps);
  const state = key ? purchaseReceipts.get(key) : null;
  if (state?.status === 'loading') {
    return `
      <article class="mini-card stage-three-card purchase-receipt-card is-loading">
        <p class="stage-two-card-label">최종 판단 영수증</p>
        <h4>Step 1 · Step 2 · Step 3을 종합해 최종 결론을 만드는 중입니다...</h4>
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
          <button type="button" class="chip-btn purchase-receipt-btn receipt-reprint-btn" data-purchase-receipt-regenerate="${escapeAttr(key)}">다시 출력</button>
        </div>
      </article>
    `;
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
  return `
    <section class="stage-four-panel stage-zone stage-four-zone is-active" data-stage-panel data-stage-four-panel>
      <aside class="stage-zone-label">
        <b>Step 4</b>
        <span>최종 결론</span>
      </aside>
      <div class="stage-zone-grid stage-four-zone-grid">
        ${renderPurchaseReceiptBlock(item, comps)}
      </div>
    </section>
  `;
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
  if (!comps || !isCompsCollected(comps)) {
    return renderCompsLoading('번개·당근·중고나라 검색 결과를 수집 중입니다...');
  }
  const all = comparisonItems(comps);
  if (!all.length) {
    const key = summaryKey(item);
    if ((stageThreeAutoQueryRetryCounts.get(key) || 0) < MAX_STAGE_THREE_AUTO_QUERY_RETRIES) {
      return renderCompsLoading('AI가 검색어를 다시 조정 중입니다...');
    }
    return `<p class="meta empty">자동 검색어 조정 후에도 관련 매물을 충분히 찾지 못했습니다.</p>`;
  }
  const filterKey = comparisonFilterKey(item, comps);
  const filterState = filterKey ? comparisonFilters.get(filterKey) : null;
  const allMatched = filteredComparisonItems(item, comps) || [];
  if (!filterState || filterState.status === 'loading') {
    return renderCompsLoading('AI가 같은 제품인지 판별 중입니다...');
  }
  if (filterState.status === 'error') {
    return `<p class="meta empty">동일 제품 판별에 실패했습니다.</p>`;
  }
  if (!allMatched.length) {
    const key = summaryKey(item);
    if ((stageThreeAutoQueryRetryCounts.get(key) || 0) < MAX_STAGE_THREE_AUTO_QUERY_RETRIES) {
      return renderCompsLoading('AI가 더 맞는 검색어를 다시 생각하고 있습니다...');
    }
    return `<p class="meta empty">자동 검색어 조정 후에도 같은 제품으로 볼 만한 매물을 찾지 못했습니다.</p>`;
  }
  const st = compStats(allMatched);
  const statsTxt = st
    ? `${st.n}건 · 중앙 ${formatWon(st.median)} · ${formatWon(st.min)} ~ ${formatWon(st.max)}`
    : `${allMatched.length}건`;
  const caution =
    '중고 매물 가격은 상태, 구성품, 보증, 판매완료 여부, 지역, 거래조건에 따라 크게 달라집니다. 가품일 가능성도 있으니 표시된 가격은 참고용 가격 자료로만 보고 그대로 믿고 구매 판단하면 안 됩니다.';
  return `
    <div class="comparison-filter-result">
      <div class="comparison-price-layout">
        <div class="comparison-price-list">
          <p class="meta"><strong>${escapeHtml(statsTxt)}</strong> · 같은 제품으로 판별된 매물</p>
          ${renderComparisonList(allMatched, 8)}
          <p class="comparison-caution">${escapeHtml(caution)}</p>
        </div>
        ${renderCurrentListingCompareCard(item)}
      </div>
    </div>
  `;
}

function renderUsedPriceGuideBlock(item, comps) {
  if (!item || !comps || !isCompsCollected(comps)) return '';
  const filterKey = comparisonFilterKey(item, comps);
  const filterState = filterKey ? comparisonFilters.get(filterKey) : null;
  if (filterState?.status !== 'done') return '';
  const key = usedPriceGuideKey(item, comps);
  const state = key ? usedPriceGuides.get(key) : null;
  if (!state || state.status === 'loading') {
    return `
      <article class="mini-card stage-three-card used-price-guide-card is-loading">
        <p class="stage-two-card-label">AI 중고가이드</p>
        <h4>번개·중고나라 기반 가격표를 정리하는 중입니다...</h4>
        <p class="mini-muted">검색 결과와 수집 매물을 함께 보고 상태별 참고가를 만듭니다.</p>
        <div class="risk-loader"><span></span><span></span><span></span></div>
      </article>
    `;
  }
  if (state.status === 'error') {
    return `
      <article class="mini-card stage-three-card used-price-guide-card">
        <p class="stage-two-card-label">AI 중고가이드</p>
        <h4>가격표 생성 실패</h4>
        <p>${escapeHtml(state.error || '다시 시도해 주세요.')}</p>
        <button type="button" class="chip-btn used-price-guide-btn" data-used-price-guide="${escapeAttr(key)}">다시 만들기</button>
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
        <p class="stage-two-card-label">AI 중고가이드</p>
        <button type="button" class="chip-btn used-price-guide-btn" data-used-price-guide="${escapeAttr(key)}">다시 만들기</button>
      </div>
      <h4>${escapeHtml(guide.headline || '상태별 중고 가격 참고표')}</h4>
      <p class="mini-muted">${escapeHtml(guide.summary || '번개·중고나라 등 중고 거래 데이터를 참고한 AI 가격 가이드입니다.')}</p>
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
  if (!item) {
    window.clearInterval(photoSliderAutoTimer);
    window.clearInterval(imageAnalysisAutoTimer);
    photoSliderAutoTimer = 0;
    imageAnalysisAutoTimer = 0;
    $current.innerHTML = `
      <article class="mini-card mini-card--empty">
        <img class="empty-extension-icon" src="/icons/icon128.png" alt="" width="72" height="72" />
        <h2>매물 대기</h2>
        <p class="empty">매물 페이지 우측 하단에 뜨는 이 확장 아이콘을 눌러 분석 웹으로 보내세요.</p>
      </article>
    `;
    return;
  }
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
    ${renderStageSlideControls()}
  `;
  bindImageZoom($current);
  bindPhotoSlider($current, item);
  bindScrollText($current);
  bindStageSlideControls($current);
  bindStageTwoFlow($current, item);
  bindStageThreeFlow($current, item);
  bindUsedPriceGuide($current, item);
  bindPurchaseReceipt($current, item);
  updatePurchaseReceiptLayout($current);
  window.requestAnimationFrame(() => updatePurchaseReceiptLayout($current));
  bindImageAnalysisSlider($current, item);
  bindProductSummaryRetry($current, item);
  bindProductImageSearch($current, item);
  lastStageThreeCompsRenderKey = stageThreeCompsRenderKey(item, comps);
  syncStagePanels(item);
  ensureCachedStageTwoFollowups(item);
  if (isStepThreeUnlocked(item)) {
    scheduleComparisonFilter(item);
    if (comparisonFilters.get(comparisonFilterKey(item, comps))?.status === 'done') void ensureUsedPriceGuide(item);
  }
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
  if ($lightboxOverlay) $lightboxOverlay.innerHTML = '';
  if ($lightboxBadge) {
    const label = item?.kind === 'analysis' ? String(item?.label || '').trim() : '';
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
}

function bindStageTwoFlow(root, item) {
  root?.querySelectorAll('[data-stage-two-start]').forEach((el) => {
    const start = () => {
      const key = el.getAttribute('data-stage-two-start') || summaryKey(item);
      if (!key) return;
      const shouldRetry = productRiskAnalyses.get(key)?.status === 'error';
      stageTwoActiveKeys.add(key);
      if (shouldRetry) productRiskAnalyses.delete(key);
      playStageStartMotion();
      if (selectedKey === key) refreshProductSummaryBlock(item, { refreshProductSummary: false });
      void ensureProductRisk(item);
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
  if (!opts.preserveAutoRetryCount) stageThreeAutoQueryRetryCounts.delete(key);
  relatedRequestedKeys.add(key);
  if (isolated) stageThreeIsolatedRefreshKeys.add(key);
  else stageThreeIsolatedRefreshKeys.delete(key);
  comps = null;
  lastStageThreeCompsRenderKey = `${key}::empty`;
  window.postMessage({ type: 'MARKET_SCRAPE_CLEAR_COMPS' }, '*');
  for (const filterKey of [...comparisonFilters.keys()]) {
    if (filterKey.startsWith(`${key}::`)) {
      comparisonFilters.delete(filterKey);
      if (!isolated) {
        usedPriceGuides.delete(filterKey);
        purchaseReceipts.delete(filterKey);
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
  if (btn) btn.disabled = true;
  window.postMessage({ type: 'MARKET_SCRAPE_OPEN_SEARCH_TABS', query: queryList[0], queries: queryList }, '*');
  if (btn) {
    setTimeout(() => {
      btn.disabled = false;
    }, 2500);
  }
}

function bindStageThreeFlow(root, item) {
  root?.querySelectorAll('[data-stage-three-start]').forEach((el) => {
    const start = () => {
      const key = el.getAttribute('data-stage-three-start') || summaryKey(item);
      if (!key) return;
      stageThreeActiveKeys.add(key);
      relatedRequestedKeys.add(key);
      persistAiCaches();
      playStageStartMotion();
      openRelatedSearchForItem(item, stageThreeSearchQueries(item), el);
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
}

function maybeAutoRegenerateStageThreeSearchQueries(item) {
  const key = summaryKey(item);
  if (!key) return false;
  if (searchQueryRegenerations.get(key)?.status === 'loading') return true;
  const count = stageThreeAutoQueryRetryCounts.get(key) || 0;
  if (count >= MAX_STAGE_THREE_AUTO_QUERY_RETRIES) return false;
  stageThreeAutoQueryRetryCounts.set(key, count + 1);
  void regenerateStageThreeSearchQueries(item, null, { auto: true });
  return true;
}

async function regenerateStageThreeSearchQueries(item, btn = null, opts = {}) {
  const key = summaryKey(item);
  if (!key) return;
  if (!opts.auto) stageThreeAutoQueryRetryCounts.delete(key);
  const apiKey = getAiApiKey();
  if (!apiKey || typeof globalThis.UlsaAi?.fetchSearchQuery !== 'function') {
    searchQueryRegenerations.set(key, { status: 'error', error: 'AI 설정이 필요합니다.' });
    refreshStageThreeSearchCard(item);
    return;
  }
  searchQueryRegenerations.set(key, { status: 'loading' });
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
    const queries = splitSearchQueries(data.queries?.length ? data.queries : data.query);
    if (!queries.length) throw new Error('새 검색어를 만들지 못했습니다.');
    const current = productSummaries.get(key) || { status: 'done', summary: {} };
    const summary = current.summary || {};
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
    searchQueryRegenerations.delete(key);
    refreshStageThreeSearchCard(item);
    openRelatedSearchForItem(item, queries, btn, { isolated: true, preserveAutoRetryCount: opts.auto === true });
  } catch (e) {
    searchQueryRegenerations.set(key, {
      status: 'error',
      error: e instanceof Error ? e.message : String(e),
    });
    refreshStageThreeSearchCard(item);
  }
}

function purchaseReceiptComparisonPayload(item, comps) {
  const matched = filteredComparisonItems(item, comps) || [];
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
  const stats = compStats(matched);
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
      matchedCount: matched.length,
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
      matchedListings: matched.slice(0, 12).map((x) => ({
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
      const key = usedPriceGuideKey(item, comps);
      if (key) {
        usedPriceGuides.delete(key);
        purchaseReceipts.delete(key);
      }
      void ensureUsedPriceGuide(item);
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
}

function updatePurchaseReceiptLayout(root = $current, opts = {}) {
  const stage = root?.querySelector('.purchase-receipt-stage');
  const reveal = stage?.querySelector('.receipt-paper-reveal');
  const paper = stage?.querySelector('.purchase-receipt-paper');
  const zone = stage?.closest?.('[data-stage-four-panel]');
  if (!stage || !reveal || !paper || !zone) return 0;
  const printHeight = Math.ceil(paper.scrollHeight + 12);
  const zoneTarget = printHeight + 348;
  reveal.style.setProperty('--receipt-print-height', `${printHeight}px`);
  if (!reveal.classList.contains('is-printing')) {
    reveal.style.height = 'auto';
    reveal.style.minHeight = `${printHeight}px`;
  }
  if (opts.animate) {
    zone.classList.add('is-receipt-layout-animating');
    zone.style.setProperty('--stage-four-receipt-height', `${zoneTarget}px`);
  } else {
    zone.classList.remove('is-receipt-layout-animating');
    zone.style.setProperty('--stage-four-receipt-height', `${zoneTarget}px`);
  }
  return printHeight;
}

function followPurchaseReceiptPrint(root = $current) {
  const stage = root?.querySelector('.purchase-receipt-stage');
  const reveal = stage?.querySelector('.receipt-paper-reveal');
  const paper = stage?.querySelector('.purchase-receipt-paper');
  if (!stage || !reveal || !paper || stage.dataset.receiptScrollStarted === '1') return;
  stage.dataset.receiptScrollStarted = '1';
  const printHeight = updatePurchaseReceiptLayout(root, { animate: true }) || Math.ceil(paper.scrollHeight + 12);
  reveal.style.height = '';
  reveal.style.minHeight = '0px';

  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  if (prefersReducedMotion) {
    reveal.style.height = 'auto';
    reveal.style.minHeight = `${printHeight}px`;
    reveal.scrollIntoView({ block: 'end', behavior: 'auto' });
    return;
  }

  reveal.classList.add('is-printing');
  reveal.addEventListener(
    'animationend',
    () => {
      reveal.style.height = 'auto';
      reveal.style.minHeight = `${printHeight}px`;
      reveal.classList.remove('is-printing');
      updatePurchaseReceiptLayout(root);
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
    const desired = targetTop();
    const catchUp = isScrollLayout ? 0.16 : 0.045 + progress * 0.09;
    const nextTop = window.scrollY + (desired - window.scrollY) * catchUp;
    window.scrollTo(0, nextTop);
    if (progress < 1) {
      window.requestAnimationFrame(step);
      return;
    }
    window.setTimeout(() => {
      const finalTop = targetTop();
      if (Math.abs(finalTop - window.scrollY) > 2) {
        window.scrollTo({ top: finalTop, behavior: 'smooth' });
      }
    }, 120);
  };

  window.requestAnimationFrame(step);
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

function bindDirectAiChat() {
  $directAiPanel?.querySelector('.direct-chat-close')?.addEventListener('click', () => {
    directAiChat.open = false;
    renderDirectAiPanel();
  });

  $directAiPanel?.querySelector('.direct-chat-clear')?.addEventListener('click', () => {
    directAiChat.status = 'idle';
    directAiChat.messages = [];
    renderDirectAiPanel();
  });

  $directAiPanel?.querySelector('.direct-chat-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const textarea = e.currentTarget.querySelector('textarea[name="prompt"]');
    const prompt = String(textarea?.value || textarea?.getAttribute('placeholder') || '').trim();
    if (!prompt) return;
    const apiKey = getAiApiKey();
    if (!apiKey || typeof globalThis.UlsaAi?.askDirect !== 'function') {
      return;
    }

    directAiChat.messages.push({ role: 'user', text: prompt });
    directAiChat.status = 'loading';
    renderDirectAiPanel();

    try {
      const data = await globalThis.UlsaAi.askDirect({ prompt, apiKey });
      directAiChat.messages.push({ role: 'ai', text: stripChatMarkdown(data.answer || '(빈 응답)') });
      directAiChat.status = 'done';
    } catch (err) {
      directAiChat.messages.push({ role: 'ai', text: err instanceof Error ? err.message : String(err) });
      directAiChat.status = 'error';
    }
    renderDirectAiPanel();
  });
}

$btnDirectAi?.addEventListener('click', () => {
  directAiChat.open = !directAiChat.open;
  renderDirectAiPanel();
});
$btnLayoutMode?.addEventListener('click', () => {
  const nextMode = $appShell?.classList.contains('app-shell--slide') ? 'scroll' : 'slide';
  setLayoutMode(nextMode);
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
  stageThreeAutoQueryRetryCounts.delete(key);
  productRiskAnalyses.delete(key);
  listingTextAnalyses.delete(key);
  listingImageAnalyses.delete(key);
  stageTwoActiveKeys.delete(key);
  stageThreeActiveKeys.delete(key);
  stageThreeIsolatedRefreshKeys.delete(key);
  for (const filterKey of [...comparisonFilters.keys()]) {
    if (filterKey.startsWith(`${key}::`)) {
      comparisonFilters.delete(filterKey);
      usedPriceGuides.delete(filterKey);
      purchaseReceipts.delete(filterKey);
    }
  }
  for (const filterKey of [...comparisonFilterTimers]) {
    if (filterKey.startsWith(`${key}::`)) comparisonFilterTimers.delete(filterKey);
  }
  persistAiCaches();
}

function clearCurrentAiCaches() {
  const key = selectedKey || (latest ? itemKey(latest) : '');
  if (key) clearProductSummaryCaches(key);
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
  stageTwoCompletedKeys.delete(key);
  stageThreeIsolatedRefreshKeys.delete(key);
  productRiskAnalyses.delete(key);
  listingTextAnalyses.delete(key);
  listingImageAnalyses.delete(key);
  imageAnalysisPreviewedKeys.delete(key);
  searchQueryRegenerations.delete(key);
  stageThreeAutoQueryRetryCounts.delete(key);
  for (const cacheKey of [...comparisonFilters.keys()]) {
    if (listingKeyFromStageCacheKey(cacheKey) === key) comparisonFilters.delete(cacheKey);
  }
  for (const cacheKey of [...usedPriceGuides.keys()]) {
    if (listingKeyFromStageCacheKey(cacheKey) === key) usedPriceGuides.delete(cacheKey);
  }
  for (const cacheKey of [...purchaseReceipts.keys()]) {
    if (listingKeyFromStageCacheKey(cacheKey) === key) purchaseReceipts.delete(cacheKey);
  }
  for (const timerKey of [...comparisonFilterTimers]) {
    if (listingKeyFromStageCacheKey(timerKey) === key) comparisonFilterTimers.delete(timerKey);
  }
  comps = null;
  lastStageThreeCompsRenderKey = '';
  stageSlideIndex = 0;
  persistAiCaches();
  window.postMessage({ type: 'MARKET_SCRAPE_CLEAR_COMPS' }, '*');
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
  const isolated = currentKey ? stageThreeIsolatedRefreshKeys.has(currentKey) : false;
  const existing = comparisonFilters.get(filterKey);
  if (existing?.status === 'loading' || existing?.status === 'done') return;
  const candidates = comparisonFilterCandidates(item, comps);
  if (!candidates.length) {
    if (maybeAutoRegenerateStageThreeSearchQueries(item)) return;
    if (!isolated) {
      usedPriceGuides.delete(filterKey);
      purchaseReceipts.delete(filterKey);
    }
    advanceStageThreeAfterComparisonFilter(item, filterKey, [], isolated);
    return;
  }
  const apiKey = getAiApiKey();
  if (!apiKey || typeof globalThis.UlsaAi?.filterComparisonListings !== 'function') {
    comparisonFilters.set(filterKey, { status: 'error', error: 'AI 설정이 필요합니다.' });
    persistAiCaches();
    if (isolated) refreshStageThreeCompsBlock(item, { schedule: false });
    else refreshStageThreeSection(item);
    return;
  }

  if (!isolated) {
    usedPriceGuides.delete(filterKey);
    purchaseReceipts.delete(filterKey);
  }
  comparisonFilters.set(filterKey, { status: 'loading' });
  if (isolated) refreshStageThreeCompsBlock(item, { schedule: false });
  else refreshStageThreeSection(item);
  try {
    const summary = getProductSummaryState(item)?.summary || null;
    const data = await globalThis.UlsaAi.filterComparisonListings({
      title: item.title || '',
      body: item.body || '',
      productName: summary?.productName || fallbackSearchQuery(item),
      summary,
      candidates,
      apiKey,
    });
    const matches = Array.isArray(data.analysis?.matches) ? data.analysis.matches : [];
    if (!matches.length && maybeAutoRegenerateStageThreeSearchQueries(item)) {
      comparisonFilters.set(filterKey, { status: 'done', matches: [] });
      persistAiCaches();
      if (selectedKey === currentKey) {
        if (isolated) refreshStageThreeCompsBlock(item, { schedule: false });
        else refreshStageThreeSection(item);
      }
      return;
    }
    if (matches.length && currentKey) stageThreeAutoQueryRetryCounts.delete(currentKey);
    advanceStageThreeAfterComparisonFilter(item, filterKey, matches, isolated);
    return;
  } catch (e) {
    comparisonFilters.set(filterKey, {
      status: 'error',
      error: e instanceof Error ? e.message : String(e),
    });
    persistAiCaches();
  }
  if (selectedKey === currentKey) {
    if (isolated) refreshStageThreeCompsBlock(item, { schedule: false });
    else refreshStageThreeSection(item);
  }
}

async function ensureUsedPriceGuide(item) {
  if (!item || !isStepThreeUnlocked(item) || !comps || !isCompsCollected(comps)) return;
  const key = usedPriceGuideKey(item, comps);
  if (!key) return;
  const filterState = comparisonFilters.get(key);
  if (filterState?.status !== 'done') return;
  const existing = usedPriceGuides.get(key);
  if (existing?.status === 'loading' || existing?.status === 'done') return;
  const apiKey = getAiApiKey();
  if (!apiKey || typeof globalThis.UlsaAi?.fetchUsedPriceGuide !== 'function') {
    usedPriceGuides.set(key, { status: 'error', error: 'AI 설정이 필요합니다.' });
    refreshStageThreeSection(item);
    if (isStepThreeDone(item)) refreshStageFourSection(item);
    return;
  }

  purchaseReceipts.delete(key);
  usedPriceGuides.set(key, { status: 'loading' });
  refreshStageThreeSection(item);
  try {
    const data = await globalThis.UlsaAi.fetchUsedPriceGuide({
      ...usedPriceGuidePayload(item, comps),
      apiKey,
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
  if (!item || !comps || !isCompsCollected(comps)) return;
  const key = purchaseReceiptKey(item, comps);
  if (!key) return;
  const existing = purchaseReceipts.get(key);
  if (existing?.status === 'loading') return;
  if (opts.regenerate) {
    purchaseReceipts.delete(key);
    persistAiCaches();
  } else if (existing?.status === 'done') {
    refreshStageFourSection(item);
    if (selectedKey === summaryKey(item)) {
      window.requestAnimationFrame(() => updatePurchaseReceiptLayout($current));
    }
    return;
  }
  const apiKey = getAiApiKey();
  if (!apiKey || typeof globalThis.UlsaAi?.fetchPurchaseReceipt !== 'function') {
    purchaseReceipts.set(key, { status: 'error', error: 'AI 설정이 필요합니다.' });
    refreshStageFourSection(item);
    return;
  }
  const summary = getProductSummaryState(item)?.summary || null;
  const guideState = usedPriceGuides.get(key);
  if (guideState?.status !== 'done') {
    await ensureUsedPriceGuide(item);
    if (usedPriceGuides.get(key)?.status !== 'done') return;
  }
  purchaseReceipts.set(key, { status: 'loading' });
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
      usedPriceGuide: usedPriceGuides.get(key)?.guide || null,
      comparison: purchaseReceiptComparisonPayload(item, comps),
      apiKey,
    });
    purchaseReceipts.set(key, { status: 'done', receipt: data.receipt || {} });
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
  if (!filterKey || comparisonFilterTimers.has(filterKey) || comparisonFilters.has(filterKey)) return;
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
  updateStageSlide();
  return panel;
}

function upsertStageTwoCard(item, selector, html, beforeSelector = '') {
  const panel = ensureStageTwoPanelElement(item);
  if (!panel) return;
  const grid = panel.querySelector('.stage-zone-grid') || panel;
  const existing = grid.querySelector(selector);
  const isFollowupCard = selector === '[data-listing-text-analysis]' || selector === '[data-listing-image-analysis]';
  if (isFollowupCard && (panel.querySelector('[data-stage-two-start]') || !canRenderStageTwoFollowups(item))) {
    existing?.remove();
    return;
  }
  if (!html) {
    existing?.remove();
    return;
  }
  if (existing) {
    existing.outerHTML = html;
  } else {
    const before = beforeSelector ? grid.querySelector(beforeSelector) : null;
    if (before) before.insertAdjacentHTML('beforebegin', html);
    else grid.insertAdjacentHTML('beforeend', html);
  }
  updateStageSlide();
}

function canRenderStageTwoFollowups(item) {
  const key = summaryKey(item);
  if (!key || !isStepTwoStarted(item)) return false;
  return productRiskAnalyses.get(key)?.status === 'done';
}

function removeStageTwoFollowupCards() {
  $current.querySelectorAll('[data-listing-text-analysis], [data-listing-image-analysis]').forEach((el) => el.remove());
}

function refreshStageThreeSection(item) {
  const html = renderStageThreeSection(item, comps);
  const existing = $current.querySelector('[data-stage-three-panel]');
  if (!html) {
    existing?.remove();
    refreshStageFourSection(item);
    updateStageSlide();
    return;
  }
  if (existing) {
    existing.outerHTML = html;
  } else {
    const stageTwo = $current.querySelector('[data-stage-two-panel]');
    const stageOne = $current.querySelector('[data-stage-one-zone]');
    if (stageTwo) stageTwo.insertAdjacentHTML('afterend', html);
    else if (stageOne) stageOne.insertAdjacentHTML('afterend', html);
  }
  bindStageThreeFlow($current, item);
  bindUsedPriceGuide($current, item);
  bindPurchaseReceipt($current, item);
  updateStageSlide();
  lastStageThreeCompsRenderKey = stageThreeCompsRenderKey(item, comps);
  if (isStepThreeUnlocked(item)) {
    scheduleComparisonFilter(item);
    if (comparisonFilters.get(comparisonFilterKey(item, comps))?.status === 'done') void ensureUsedPriceGuide(item);
    if (isStepThreeDone(item)) refreshStageFourSection(item);
  } else {
    syncStagePanels(item);
  }
}

function refreshStageFourSection(item) {
  const html = renderStageFourSection(item, comps);
  const existing = $current.querySelector('[data-stage-four-panel]');
  if (!html) {
    existing?.remove();
    updateStageSlide();
    return;
  }
  if (existing) {
    existing.outerHTML = html;
  } else {
    const stageThree = $current.querySelector('[data-stage-three-panel]');
    const stageTwo = $current.querySelector('[data-stage-two-panel]');
    if (stageThree) stageThree.insertAdjacentHTML('afterend', html);
    else if (stageTwo) stageTwo.insertAdjacentHTML('afterend', html);
  }
  bindPurchaseReceipt($current, item);
  updateStageSlide();
  updatePurchaseReceiptLayout($current);
  window.requestAnimationFrame(() => updatePurchaseReceiptLayout($current));
}

function refreshStageThreeSearchCard(item) {
  const current = $current.querySelector('[data-stage-three-search-card]');
  if (!current) {
    refreshStageThreeSection(item);
    return;
  }
  current.outerHTML = renderStageThreeSearchCard(item, comps);
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
  target.innerHTML = renderCompsBlock(item, comps);
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
    '[data-listing-image-analysis]'
  );
  maybeMarkStageTwoComplete(item);
  refreshStageThreeSection(item);
}

function refreshListingImageAnalysisCard(item) {
  if (!canRenderStageTwoFollowups(item)) {
    removeStageTwoFollowupCards();
    return;
  }
  upsertStageTwoCard(item, '[data-listing-image-analysis]', renderListingImageAnalysisCard(item));
  const panel = $current.querySelector('[data-stage-two-panel]');
  bindImageAnalysisSlider(panel, item);
  bindImageZoom(panel);
  maybeMarkStageTwoComplete(item);
  refreshStageThreeSection(item);
}

function previewListingImageAnalysis(item) {
  const key = summaryKey(item);
  if (!key || imageAnalysisPreviewedKeys.has(key)) return;
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
    current.outerHTML = renderProductSummaryBlock(item);
    const updated = $current.querySelector('[data-product-summary]');
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
  if (stageTwo) {
    stageTwo.outerHTML = renderStageTwoSection(item);
    bindStageTwoFlow($current, item);
    bindImageAnalysisSlider($current, item);
    bindImageZoom($current);
    updateStageSlide();
  } else {
    const stageOne = $current.querySelector('[data-stage-one-zone]');
    const product = $current.querySelector('[data-product-summary]');
    const html = renderStageTwoSection(item);
    if (html && stageOne) stageOne.insertAdjacentHTML('afterend', html);
    else if (html && product) product.insertAdjacentHTML('afterend', html);
    bindStageTwoFlow($current, item);
    bindImageAnalysisSlider($current, item);
    bindImageZoom($current);
    updateStageSlide();
  }
  maybeMarkStageTwoComplete(item);
  ensureCachedStageTwoFollowups(item);
  refreshStageThreeSection(item);
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
$btnHistoryClear?.addEventListener('click', () => {
  history = [];
  latest = null;
  selectedKey = null;
  comps = null;
  productSummaries.clear();
  directAiChat.status = 'idle';
  directAiChat.messages = [];
  relatedRequestedKeys.clear();
  productImageSearches.clear();
  imageAnalysisIndexes.clear();
  imageAnalysisDirections.clear();
  stageTwoActiveKeys.clear();
  stageThreeActiveKeys.clear();
  stageThreeIsolatedRefreshKeys.clear();
  productRiskAnalyses.clear();
  listingTextAnalyses.clear();
  listingImageAnalyses.clear();
  comparisonFilters.clear();
  usedPriceGuides.clear();
  purchaseReceipts.clear();
  comparisonFilterTimers.clear();
  imageAnalysisPreviewedKeys.clear();
  searchQueryRegenerations.clear();
  stageThreeAutoQueryRetryCounts.clear();
  renderItem(null);
  renderHistoryList();
  setHistoryOpen(false);
  window.postMessage({ type: 'MARKET_SCRAPE_CLEAR_HISTORY' }, '*');
});
$drawerBackdrop?.addEventListener('click', () => setHistoryOpen(false));
document.addEventListener('keydown', (e) => {
  if ($lightbox && !$lightbox.hidden) {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') moveLightbox(-1);
    if (e.key === 'ArrowRight') moveLightbox(1);
  }
  if (e.key === 'Escape') setHistoryOpen(false);
});

function renderHistoryList() {
  if (!history.length) {
    $history.innerHTML = '<li class="empty-item">비어 있음</li>';
    return;
  }
  $history.innerHTML = history
    .map((item) => {
      const key = itemKey(item);
      const active = key === selectedKey ? ' active' : '';
      return `<li class="history-row">
        <button type="button" data-key="${escapeAttr(key)}" class="${active.trim()}">
          <span class="hist-title">[${escapeHtml(item.platformLabel || item.platform)}] ${escapeHtml(item.title || '')}</span>
          <span class="hist-meta">${escapeHtml([item.priceLabel || '', shippingLine(item), formatTime(item.exportedAt)].filter(Boolean).join(' · '))}</span>
        </button>
        <button type="button" class="history-delete" data-delete-key="${escapeAttr(key)}" aria-label="최근 매물 삭제">×</button>
      </li>`;
    })
    .join('');

  $history.querySelectorAll('button[data-key]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-key');
      const found = promoteHistoryItem(key);
      if (found) {
        selectedKey = key;
        comps = activeCompsForItem(found, found.comps) || activeCompsForItem(found, comps);
        renderItem(found, comps);
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
      productSummaries.delete(key);
      relatedRequestedKeys.delete(key);
      productImageSearches.delete(key);
      imageAnalysisIndexes.delete(key);
      imageAnalysisDirections.delete(key);
      stageTwoActiveKeys.delete(key);
      stageThreeActiveKeys.delete(key);
      stageThreeIsolatedRefreshKeys.delete(key);
      productRiskAnalyses.delete(key);
      listingTextAnalyses.delete(key);
      listingImageAnalyses.delete(key);
      imageAnalysisPreviewedKeys.delete(key);
      searchQueryRegenerations.delete(key);
      stageThreeAutoQueryRetryCounts.delete(key);
      for (const filterKey of [...purchaseReceipts.keys()]) {
        if (filterKey.startsWith(`${key}::`)) purchaseReceipts.delete(filterKey);
      }
      if (selectedKey === key) {
        latest = history[0] || null;
        selectedKey = latest ? itemKey(latest) : null;
        comps = null;
        renderItem(latest, comps);
      }
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

  productSummaries.set(key, { status: 'loading', model: summaryModel || null });
  if (selectedKey === key) refreshProductSummaryBlock(item);

  try {
    const data = await globalThis.UlsaAi.fetchProductSummary({
      title: item.title || '',
      body: item.body || '',
      imageUrls: item.imageUrls || [],
      apiKey,
      model: summaryModel,
    });
    const summary = await enrichSummaryWithProductImage(data.summary || null, item);
    productSummaries.set(key, { status: 'done', summary });
    persistAiCaches();
  } catch (e) {
    productSummaries.set(key, {
      status: 'error',
      error: e instanceof Error ? e.message : String(e),
    });
    persistAiCaches();
  }

  if (selectedKey === key) refreshProductSummaryBlock(item);
}

async function ensureProductRisk(item) {
  const key = summaryKey(item);
  if (!key) return;
  const existing = productRiskAnalyses.get(key);
  if (existing?.status === 'loading') return;
  if (existing?.status === 'done') {
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
  productRiskAnalyses.set(key, { status: 'loading' });
  if (selectedKey === key) refreshProductSummaryBlock(item);

  try {
    const data = await globalThis.UlsaAi.fetchProductRisk({
      title: item.title || '',
      body: item.body || '',
      imageUrls: item.imageUrls || [],
      productName: summary?.productName || fallbackSearchQuery(item),
      summary,
      apiKey,
    });
    productRiskAnalyses.set(key, { status: 'done', analysis: data.analysis || {} });
    persistAiCaches();
  } catch (e) {
    productRiskAnalyses.set(key, {
      status: 'error',
      error: e instanceof Error ? e.message : String(e),
    });
    persistAiCaches();
  }

  if (selectedKey === key) refreshProductSummaryBlock(item);
  if (productRiskAnalyses.get(key)?.status === 'done') {
    void ensureListingTextAnalysis(item);
    void ensureListingImageAnalysis(item);
  }
}

async function ensureListingTextAnalysis(item) {
  const key = summaryKey(item);
  if (!key) return;
  const existing = listingTextAnalyses.get(key);
  if (existing?.status === 'loading') return;
  if (existing?.status === 'done' && existing.source === 'ai' && hasListingTextAnalysisContent(existing.analysis)) return;
  if (existing?.status === 'done') listingTextAnalyses.delete(key);

  const apiKey = getAiApiKey();
  if (!apiKey || typeof globalThis.UlsaAi?.fetchListingTextAnalysis !== 'function') {
    return;
  }

  const summary = getProductSummaryState(item)?.summary || null;
  const riskAnalysis = productRiskAnalyses.get(key)?.analysis || null;
  listingTextAnalyses.set(key, { status: 'loading' });
  if (selectedKey === key) refreshListingTextAnalysisCard(item);

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
    });
    const analysis =
      data.analysis?.parseOk && hasListingTextAnalysisContent(data.analysis)
        ? meaningfulListingTextAnalysis(data.analysis)
        : null;
    if (!analysis) {
      listingTextAnalyses.delete(key);
      persistAiCaches();
      if (selectedKey === key) refreshListingTextAnalysisCard(item);
      return;
    }
    listingTextAnalyses.set(key, { status: 'done', analysis, source: 'ai' });
    persistAiCaches();
    if (selectedKey === key) refreshListingTextAnalysisCard(item);
  } catch (e) {
    listingTextAnalyses.delete(key);
    persistAiCaches();
    if (selectedKey === key) refreshListingTextAnalysisCard(item);
  }
}

async function ensureListingImageAnalysis(item) {
  const key = summaryKey(item);
  if (!key) return;
  const existing = listingImageAnalyses.get(key);
  if (existing?.status === 'loading') return;
  if (existing?.status === 'done' && existing.overlayVersion === 11) {
    if (selectedKey === key) {
      refreshListingImageAnalysisCard(item);
      previewListingImageAnalysis(item);
    }
    return;
  }
  if (existing?.status === 'done') listingImageAnalyses.delete(key);

  const apiKey = getAiApiKey();
  if (!apiKey || typeof globalThis.UlsaAi?.fetchListingImageAnalysis !== 'function') {
    listingImageAnalyses.set(key, { status: 'error', error: 'AI 설정이 필요합니다.' });
    if (selectedKey === key) refreshProductSummaryBlock(item);
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
    return;
  }

  const summary = getProductSummaryState(item)?.summary || null;
  listingImageAnalyses.set(key, { status: 'loading' });
  if (selectedKey === key) refreshListingImageAnalysisCard(item);

  try {
    const data = await globalThis.UlsaAi.fetchListingImageAnalysis({
      title: item.title || '',
      body: item.body || '',
      imageUrls,
      productName: summary?.productName || fallbackSearchQuery(item),
      apiKey,
    });
    listingImageAnalyses.set(key, { status: 'done', analysis: data.analysis || {}, overlayVersion: 11 });
    persistAiCaches();
    if (selectedKey === key) {
      refreshListingImageAnalysisCard(item);
      previewListingImageAnalysis(item);
    }
  } catch (e) {
    listingImageAnalyses.set(key, {
      status: 'error',
      error: e instanceof Error ? e.message : String(e),
    });
    persistAiCaches();
    if (selectedKey === key) refreshListingImageAnalysisCard(item);
  }
}

function applyPayload(payload) {
  const previousSelectedKey = selectedKey;
  const hadRenderedItem = Boolean($current.querySelector('[data-stage-one-zone]'));
  latest = payload?.latest ?? latest;
  history = Array.isArray(payload?.history) ? payload.history : history;
  const selectedItem =
    (selectedKey && history.find((item) => itemKey(item) === selectedKey)) ||
    latest ||
    null;
  const rawComps = payload?.comps ?? selectedItem?.comps ?? latest?.comps ?? null;
  const selectedItemKey = selectedItem ? itemKey(selectedItem) : '';
  comps =
    selectedItemKey && relatedRequestedKeys.has(selectedItemKey)
      ? activeCompsForItem(selectedItem, rawComps)
      : null;

  if (selectedItem) {
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
    } else {
      renderItem(selectedItem, comps);
      void ensureProductSummary(selectedItem);
    }
  } else if (!history.length) {
    renderItem(null);
  }

  renderHistoryList();
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
    if (!d || d.type !== 'MARKET_SCRAPE_BRIDGE') return;
    applyPayload({ latest: d.latest, history: d.history, comps: d.comps });
  });

  $btnRefresh.addEventListener('click', () => {
    clearCurrentAnalysisState();
    renderItem(null);
    window.postMessage({ type: 'MARKET_SCRAPE_REQUEST' }, '*');
  });

  window.postMessage({ type: 'MARKET_SCRAPE_REQUEST' }, '*');
}

function bootstrapApp() {
  window.addEventListener('ulsa:ai-ready', () => initMain(), { once: true });
  if (globalThis.__ulsaAiReady) initMain();
}
bootstrapApp();
