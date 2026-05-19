const ANALYZER_PORTS = [3920, 3921];

const SCRIPT_FILES = [
  'lib/shared.js',
  'lib/search-urls.js',
  'lib/images.js',
  'lib/storage.js',
  'lib/comps.js',
  'hosts/bunjang.js',
  'hosts/daangn.js',
  'content.js',
];

const $detailPanel = document.getElementById('detailPanel');
const $searchPanel = document.getElementById('searchPanel');
const $platform = document.getElementById('platform');
const $title = document.getElementById('title');
const $price = document.getElementById('price');
const $compsLine = document.getElementById('compsLine');
const $bodyText = document.getElementById('bodyText');
const $imgGrid = document.getElementById('imgGrid');
const $sendWeb = document.getElementById('sendWeb');
const $openSearch = document.getElementById('openSearch');
const $searchPlatform = document.getElementById('searchPlatform');
const $searchTitle = document.getElementById('searchTitle');
const $searchHint = document.getElementById('searchHint');
const $collectSearch = document.getElementById('collectSearch');
const $status = document.getElementById('status');

let pollTimer = null;

function setStatus(msg, kind = '') {
  if (!$status) return;
  $status.textContent = msg || '';
  $status.classList.remove('err', 'ok');
  if (kind === 'err') $status.classList.add('err');
  if (kind === 'ok') $status.classList.add('ok');
}

/**
 * 분석 웹(localStorage)에만 있는 Gemini 설정을 chrome.storage로 복사합니다.
 * postMessage/CustomEvent가 확장에 안 닿는 경우에도 유사 매물 검색이 동작하게 합니다.
 */
async function syncGeminiFromAnalyzerTabs() {
  const urlPatterns = ['http://127.0.0.1:3920/*', 'http://localhost:3920/*'];
  let tabs = await chrome.tabs.query({ url: urlPatterns });
  let openedTabId = null;
  if (!tabs.length) {
    const t = await chrome.tabs.create({ url: 'http://127.0.0.1:3920/', active: false });
    openedTabId = t.id ?? null;
    await new Promise((r) => setTimeout(r, 2200));
    tabs = openedTabId ? [{ id: openedTabId }] : await chrome.tabs.query({ url: urlPatterns });
  }

  for (const tab of tabs) {
    if (!tab.id) continue;
    try {
      const injected = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => ({
          api: localStorage.getItem('ulsa_gemini_api_key'),
          model: localStorage.getItem('ulsa_gemini_model'),
          v: localStorage.getItem('ulsa_gemini_verified_at'),
        }),
      });
      const d = injected[0]?.result;
      if (d?.api && String(d.api).trim()) {
        const verifiedAt = d.v ? Number(d.v) : Date.now();
        await chrome.storage.local.set({
          ulsaGeminiApiKey: String(d.api).trim(),
          ulsaGeminiModel: d.model || 'gemini-2.5-flash',
          ulsaGeminiVerifiedAt:
            Number.isFinite(verifiedAt) && verifiedAt > 0 ? verifiedAt : Date.now(),
        });
        return true;
      }
    } catch {
      /* 페이지 미로드·권한 등 */
    }
  }
  return false;
}

function isInjectable(url) {
  return typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'));
}

function isListingDetailUrl(url) {
  if (!url) return false;
  try {
    const u = new URL(url);
    if (u.hostname.includes('bunjang.co.kr')) {
      return /\/(?:products|posts)\/\d+(?:\/|$)/.test(u.pathname);
    }
    if (u.hostname.includes('daangn.com')) {
      return /\/buy-sell\/[^/]+-[a-z0-9]+\/?$/i.test(u.pathname);
    }
  } catch {
    /* ignore */
  }
  return false;
}

function isSearchPageUrl(url) {
  if (!url) return false;
  try {
    const u = new URL(url);
    if (u.hostname.includes('bunjang.co.kr')) {
      return u.pathname.includes('/search') && u.searchParams.has('q');
    }
    if (u.hostname.includes('daangn.com')) {
      return /\/kr\/buy-sell\/?$/.test(u.pathname) && u.searchParams.has('search');
    }
  } catch {
    /* ignore */
  }
  return false;
}

function searchPlatformLabel(url) {
  if (url?.includes('bunjang')) return '번개장터 검색';
  if (url?.includes('daangn')) return '당근마켓 검색';
  return '검색';
}

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab ?? null;
}

function sendMessage(tabId, message, timeoutMs = 25000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('응답 시간 초과')), timeoutMs);
    chrome.tabs.sendMessage(tabId, message, (response) => {
      clearTimeout(timer);
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });
}

async function sendToTab(tabId, message) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId, allFrames: false },
      files: SCRIPT_FILES,
    });
  } catch {
    /* ignore */
  }
  await new Promise((r) => setTimeout(r, 80));
  return sendMessage(tabId, message);
}

function formatCompsLine(comps) {
  const b = comps?.bunjang?.count;
  const d = comps?.daangn?.count;
  const bTxt = b != null && b > 0 ? `번개 ${b}건` : '번개 —';
  const dTxt = d != null && d > 0 ? `당근 ${d}건` : '당근 —';
  return `비교 매물 · ${bTxt} · ${dTxt}`;
}

async function refreshCompsLine() {
  const res = await chrome.storage.local.get(['marketScrapeComps']);
  if ($compsLine) $compsLine.innerHTML = formatCompsLine(res.marketScrapeComps);
}

function renderImages(urls) {
  if (!$imgGrid) return;
  const list = Array.isArray(urls) ? urls.slice(0, 8) : [];
  if (!list.length) {
    $imgGrid.className = 'empty';
    $imgGrid.textContent = '없음';
    return;
  }
  $imgGrid.className = '';
  $imgGrid.innerHTML = list
    .map((src) => `<img src="${src.replace(/"/g, '&quot;')}" alt="" loading="lazy" />`)
    .join('');
}

function showDetailPanel() {
  $detailPanel?.classList.remove('hidden');
  $searchPanel?.classList.add('hidden');
}

function showSearchPanel(url) {
  $detailPanel?.classList.add('hidden');
  $searchPanel?.classList.remove('hidden');
  if ($searchPlatform) $searchPlatform.textContent = searchPlatformLabel(url);
  if ($searchTitle) {
    try {
      const q =
        new URL(url).searchParams.get('q') || new URL(url).searchParams.get('search') || '';
      $searchTitle.textContent = q ? `「${q}」` : '검색 결과';
    } catch {
      $searchTitle.textContent = '검색 결과';
    }
  }
}

function showErrorPanel(msg) {
  $detailPanel?.classList.remove('hidden');
  $searchPanel?.classList.add('hidden');
  if ($title) $title.textContent = '사용 안내';
  if ($price) $price.textContent = '';
  if ($bodyText) {
    $bodyText.textContent = msg;
    $bodyText.classList.add('empty');
  }
  if ($sendWeb) $sendWeb.disabled = true;
  if ($openSearch) $openSearch.disabled = true;
}

async function loadDetailMode(tab) {
  showDetailPanel();
  setStatus('');
  try {
    const res = await sendToTab(tab.id, { type: 'GET_LISTING' });
    if (!res?.ok || !res.listing) {
      showErrorPanel(res?.error || '매물을 불러오지 못했습니다.');
      return;
    }
    const L = res.listing;
    if ($platform) $platform.textContent = L.platformLabel || L.platform;
    if ($title) $title.textContent = L.title || '(제목 없음)';
    if ($price) $price.textContent = L.priceLabel || '—';
    renderImages(L.imageUrls);
    if ($bodyText) {
      const body = (L.body || '').trim();
      $bodyText.textContent = body || '(본문 없음)';
      $bodyText.classList.toggle('empty', !body);
    }
    if ($sendWeb) {
      $sendWeb.disabled = false;
      $sendWeb.textContent = '분석 웹으로 보내기';
    }
    if ($openSearch) $openSearch.disabled = false;
    await refreshCompsLine();
  } catch {
    showErrorPanel('페이지를 새로고침한 뒤 다시 열어 주세요.');
  }
}

async function loadSearchMode(tab) {
  showSearchPanel(tab.url);
  setStatus('');
  await refreshSearchCollectState(tab.url);

  if ($collectSearch) {
    $collectSearch.onclick = async () => {
      setStatus('수집 중…');
      $collectSearch.disabled = true;
      try {
        const res = await sendToTab(tab.id, { type: 'COLLECT_SEARCH' });
        if (res?.ok) {
          setStatus(`${res.count ?? 0}건 저장됨`, 'ok');
          if ($collectSearch) $collectSearch.textContent = `✓ ${res.count}건 저장됨`;
        } else setStatus(res?.error || '수집 실패', 'err');
      } catch {
        setStatus('수집 실패 — 새로고침 후 다시 시도', 'err');
      }
      $collectSearch.disabled = false;
    };
  }
}

async function refreshSearchCollectState(url) {
  const res = await chrome.storage.local.get(['marketScrapeComps']);
  const comps = res.marketScrapeComps;
  const isBun = url.includes('bunjang');
  const bucket = isBun ? comps?.bunjang : comps?.daangn;
  const n = bucket?.count ?? 0;
  if ($collectSearch) {
    $collectSearch.textContent = n > 0 ? `✓ ${n}건 저장됨 · 다시 수집` : '이 페이지 수집하기';
  }
  if ($searchHint) {
    $searchHint.textContent =
      n > 0
        ? '수집 완료. 매물 상세 탭에서 «분석 웹으로 보내기»를 누르세요.'
        : '자동 수집이 안 됐다면 아래 버튼을 눌러 주세요.';
  }
}

async function findAnalyzerTab() {
  const tabs = await chrome.tabs.query({});
  return tabs.find((t) => {
    try {
      const u = new URL(t.url || '');
      return (
        (u.hostname === '127.0.0.1' || u.hostname === 'localhost') &&
        ANALYZER_PORTS.includes(Number(u.port))
      );
    } catch {
      return false;
    }
  });
}

async function notifyAnalyzerTab(tabId) {
  try {
    await chrome.tabs.sendMessage(tabId, { type: 'PUSH_ANALYZER' });
  } catch {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['bridge-analyzer.js'],
      });
      await new Promise((r) => setTimeout(r, 120));
      await chrome.tabs.sendMessage(tabId, { type: 'PUSH_ANALYZER' });
    } catch {
      /* ignore */
    }
  }
}

async function pushToAnalyzerTab() {
  const existing = await findAnalyzerTab();
  if (existing?.id) {
    await notifyAnalyzerTab(existing.id);
    return;
  }
  const created = await chrome.tabs.create({ url: 'http://127.0.0.1:3920/', active: false });
  await new Promise((r) => setTimeout(r, 400));
  if (created.id) await notifyAnalyzerTab(created.id);
}

function startCompsPoll() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(() => void refreshCompsLine(), 800);
}

async function openSearchTabs(tab) {
  const res = await sendToTab(tab.id, { type: 'GET_LISTING' });
  if (!res?.ok || !res.listing?.title) {
    setStatus('먼저 매물 정보를 불러올 수 없습니다', 'err');
    return;
  }

  let st = await chrome.storage.local.get(['ulsaGeminiApiKey', 'ulsaGeminiModel', 'ulsaGeminiVerifiedAt']);
  let apiKey = typeof st.ulsaGeminiApiKey === 'string' ? st.ulsaGeminiApiKey.trim() : '';
  if (!apiKey) {
    setStatus('분석 웹에서 API 설정 가져오는 중…', '');
    await syncGeminiFromAnalyzerTabs();
    st = await chrome.storage.local.get(['ulsaGeminiApiKey', 'ulsaGeminiModel', 'ulsaGeminiVerifiedAt']);
    apiKey = typeof st.ulsaGeminiApiKey === 'string' ? st.ulsaGeminiApiKey.trim() : '';
  }
  if (!apiKey) {
    setStatus(
      '확장에 API 키가 없습니다. `127.0.0.1:3920` 분석 웹을 열고 「저장하고 시작」으로 연결 테스트까지 완료하세요. (로컬 서버 `node analyzer-server.mjs` 필요)',
      'err'
    );
    return;
  }

  const model = st.ulsaGeminiModel || 'gemini-2.5-flash';

  try {
    const ver = await fetch('http://127.0.0.1:3920/api/verify-gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gemini-Key': apiKey,
        'X-Gemini-Model': model,
      },
      body: JSON.stringify({}),
    });
    const verData = await ver.json().catch(() => ({}));
    if (!ver.ok) {
      throw new Error(verData.error || verData.message || `연결 테스트 실패 HTTP ${ver.status}`);
    }
    await chrome.storage.local.set({ ulsaGeminiVerifiedAt: Date.now() });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    setStatus(`API 연결 실패 — 분석 서버 실행 후 분석 웹에서 키·모델을 다시 저장하세요 (${msg})`, 'err');
    return;
  }

  let query;
  try {
    const r = await fetch('http://127.0.0.1:3920/api/search-query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gemini-Key': apiKey,
        'X-Gemini-Model': model,
      },
      body: JSON.stringify({
        title: res.listing.title,
        body: res.listing.body || '',
        imageUrls: Array.isArray(res.listing.imageUrls) ? res.listing.imageUrls : [],
      }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      throw new Error(data.error || `HTTP ${r.status}`);
    }
    query = typeof data.query === 'string' ? data.query.trim() : '';
    if (!query) throw new Error('검색어가 비었습니다.');
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    setStatus(`AI 검색어 생성 실패 — 분석 서버 실행 후 재시도 (${msg})`, 'err');
    return;
  }

  const bunjangUrl = `https://m.bunjang.co.kr/search/products?q=${encodeURIComponent(query)}&order=score`;
  const daangnUrl = `https://www.daangn.com/kr/buy-sell/?search=${encodeURIComponent(query)}`;

  const bunTab = await chrome.tabs.create({ url: bunjangUrl, active: false });
  const dangTab = await chrome.tabs.create({ url: daangnUrl, active: false });
  const closeIds = [bunTab?.id, dangTab?.id].filter((x) => typeof x === 'number');

  await chrome.storage.local.set({
    marketScrapeAutoCollect: { bunjang: true, daangn: true, at: Date.now() },
    ...(closeIds.length ? { marketScrapeCloseTabs: closeIds } : {}),
  });

  setStatus(`검색어 「${query}」로 탭 2개를 열었어요. 잠시 후 자동 수집됩니다…`);
  startCompsPoll();
  setTimeout(() => void refreshCompsLine(), 2500);
  setTimeout(() => void refreshCompsLine(), 5000);
}

async function sendToWeb() {
  if ($sendWeb?.disabled) return;
  setStatus('전송 중…');
  $sendWeb.disabled = true;

  const tab = await activeTab();
  if (!tab?.id || !isListingDetailUrl(tab.url)) {
    setStatus('매물 상세 페이지에서 실행해 주세요', 'err');
    $sendWeb.disabled = false;
    return;
  }

  try {
    const res = await sendToTab(tab.id, { type: 'REFRESH_AND_SAVE' });
    if (!res?.ok) {
      setStatus(res?.error || '전송 실패', 'err');
      $sendWeb.disabled = false;
      return;
    }
    setStatus('전송 완료', 'ok');
    $sendWeb.textContent = '전송 완료';
    await pushToAnalyzerTab();
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    setStatus(msg.includes('시간 초과') ? '시간 초과 — F5 후 재시도' : '전송 실패', 'err');
    $sendWeb.textContent = '분석 웹으로 보내기';
  }
  $sendWeb.disabled = false;
}

async function init() {
  const tab = await activeTab();
  if (!tab?.id || !isInjectable(tab.url)) {
    showErrorPanel('번개장터·당근 사이트에서 확장을 열어 주세요.');
    return;
  }
  if (isSearchPageUrl(tab.url)) {
    await loadSearchMode(tab);
    return;
  }
  if (isListingDetailUrl(tab.url)) {
    await loadDetailMode(tab);
    startCompsPoll();
    return;
  }
  showErrorPanel('매물 상세 또는 검색 결과 페이지에서 열어 주세요.');
}

$sendWeb?.addEventListener('click', () => void sendToWeb());
$openSearch?.addEventListener('click', async () => {
  const tab = await activeTab();
  if (tab?.id && isListingDetailUrl(tab.url)) void openSearchTabs(tab);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !changes.marketScrapeComps) return;
  void refreshCompsLine();
  void activeTab().then((tab) => {
    if (tab?.url && isSearchPageUrl(tab.url)) void refreshSearchCollectState(tab.url);
  });
});

void init();
