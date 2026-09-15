import fs from 'node:fs';

const p = 'analyzer/app.js';
let t = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

if (!t.includes('activeDemoScenarioId')) {
  t = t.replace(
    'const listingTextAnalyses = new Map();',
    `const listingTextAnalyses = new Map();
/** @type {string} */
let activeDemoScenarioId = '';
let demoFallbackUsed = false;
let demoCatalogCache = null;`
  );
}

const emptyOld = `    $current.innerHTML = \`
      <article class="mini-card mini-card--empty">
        <img class="empty-extension-icon" src="/icons/icon128.png" alt="" width="72" height="72" />
        <h2>매물 대기</h2>
        <p class="empty">분석할 중고 매물을 아직 받지 못했습니다. 왼쪽 URL 버튼을 눌러 중고나라·번개장터·당근 링크를 붙여넣거나, 매물 페이지 우측 하단의 확장 아이콘을 눌러 이 분석 웹으로 전송하세요.</p>
        <p class="empty empty-sub">매물이 들어오면 제품 식별, 하자·고질병 체크, 가격 참고자료, 최종 구매 판단, 판매자에게 보낼 문구 추천까지 순서대로 정리됩니다.</p>
      </article>
    \`;
    return;`;

const emptyNew = `    $current.innerHTML = renderChampionshipEmptyState();
    bindChampionshipEmptyState($current);
    return;`;

if (!t.includes('renderChampionshipEmptyState')) {
  if (!t.includes(emptyOld)) throw new Error('empty state block not found');
  t = t.replace(emptyOld, emptyNew);
}

const demoFns = `
function renderChampionshipEmptyState() {
  return \`
    <article class="mini-card mini-card--empty championship-landing" data-championship-landing>
      <img class="empty-extension-icon" src="/icons/icon128.png" alt="" width="72" height="72" />
      <p class="championship-kicker">Wanted AI Championship 2026 Demo</p>
      <h2>Buy or Bye</h2>
      <p class="empty">중고 매물의 정보 비대칭을 AI 다단계 분석으로 줄입니다. 확장 없이 아래 데모 5개로 바로 체험할 수 있습니다.</p>
      <div class="championship-demo-grid" data-demo-grid>
        <p class="mini-muted">데모 목록을 불러오는 중…</p>
      </div>
      <div class="championship-ext">
        <h3>실제 매물도 분석하려면</h3>
        <p class="empty empty-sub">Chrome 확장으로 당근·번개·중고나라 매물을 보낼 수 있습니다.</p>
        <div class="championship-ext-actions">
          <a class="btn" href="/downloads/buy-or-bye-extension.zip">확장 프로그램 ZIP 받기</a>
          <button type="button" class="btn btn--ghost" data-ext-help>설치 방법</button>
        </div>
        <ol class="championship-ext-steps" data-ext-steps hidden>
          <li>ZIP을 풀어 폴더를 준비합니다.</li>
          <li>Chrome에서 <code>chrome://extensions</code>를 엽니다.</li>
          <li>개발자 모드를 켠 뒤 「압축해제된 확장 프로그램을 로드합니다」에서 폴더를 선택합니다.</li>
          <li>매물 상세 페이지에서 확장 아이콘을 누르면 이 분석 웹으로 전송됩니다.</li>
        </ol>
      </div>
      <p class="empty empty-sub championship-stack">스택: Chrome MV3 확장 · Node 분석 서버 · Gemini(검색·멀티모달·JSON 파이프라인)</p>
    </article>
  \`;
}

async function fetchDemoCatalog() {
  if (demoCatalogCache) return demoCatalogCache;
  const res = await fetch('/api/demo/scenarios');
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || '데모 목록을 불러오지 못했습니다.');
  demoCatalogCache = data;
  return data;
}

async function bindChampionshipEmptyState(root) {
  const grid = root.querySelector('[data-demo-grid]');
  const helpBtn = root.querySelector('[data-ext-help]');
  const steps = root.querySelector('[data-ext-steps]');
  helpBtn?.addEventListener('click', () => {
    if (steps) steps.hidden = !steps.hidden;
  });
  if (!grid) return;
  try {
    const catalog = await fetchDemoCatalog();
    const list = Array.isArray(catalog.scenarios) ? catalog.scenarios : [];
    grid.innerHTML = list
      .map(
        (s) => \`
        <button type="button" class="championship-demo-card" data-demo-id="\${escapeAttr(s.id)}">
          <strong>\${escapeHtml(s.label || s.id)}</strong>
          <span>\${escapeHtml(s.blurb || '')}</span>
        </button>
      \`
      )
      .join('');
    grid.querySelectorAll('[data-demo-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-demo-id');
        void loadChampionshipDemo(id);
      });
    });
  } catch (e) {
    grid.innerHTML = \`<p class="mini-muted">\${escapeHtml(e instanceof Error ? e.message : String(e))}</p>\`;
  }
}

function showDemoFallbackBanner(message) {
  let bar = document.querySelector('[data-demo-fallback-banner]');
  if (!bar) {
    bar = document.createElement('div');
    bar.className = 'championship-fallback-banner';
    bar.setAttribute('data-demo-fallback-banner', '');
    document.body.appendChild(bar);
  }
  bar.hidden = false;
  bar.textContent = message || '라이브 AI 호출에 실패해 데모 캐시 결과로 표시합니다.';
}

function hideDemoFallbackBanner() {
  const bar = document.querySelector('[data-demo-fallback-banner]');
  if (bar) bar.hidden = true;
}

async function hydrateDemoCache(id) {
  const res = await fetch(\`/api/demo/cache/\${encodeURIComponent(id)}\`);
  const cache = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(cache.error || '데모 캐시를 불러오지 못했습니다.');
  const item = latest;
  const key = summaryKey(item);
  if (!key) return;
  if (cache.summary) {
    productSummaries.set(key, { status: 'done', summary: cache.summary, source: 'demo-cache' });
  }
  if (cache.riskAnalysis) {
    productRiskAnalyses.set(key, { status: 'done', analysis: cache.riskAnalysis, source: 'demo-cache' });
  }
  if (cache.listingTextAnalysis) {
    listingTextAnalyses.set(key, { status: 'done', analysis: cache.listingTextAnalysis, source: 'ai' });
  }
  if (cache.listingImageAnalysis) {
    listingImageAnalyses.set(key, {
      status: 'done',
      analysis: cache.listingImageAnalysis,
      source: 'ai',
      overlayVersion: LISTING_IMAGE_OVERLAY_VERSION,
    });
  }
  if (cache.accessoryCheck) {
    accessoryChecks.set(key, { status: 'done', analysis: cache.accessoryCheck });
  }
  demoFallbackUsed = true;
  showDemoFallbackBanner();
  persistAiCaches();
  stageTwoActiveKeys.add(key);
  stageTwoCompletedKeys.add(key);
  renderItem(item, comps);
}

async function maybeHydrateDemoFallback(errorLike) {
  if (!activeDemoScenarioId || demoFallbackUsed) return false;
  const msg = String(errorLike?.message || errorLike || '');
  const should =
    /429|quota|rate limit|한도|timeout|Failed to fetch|네트워크|GEMINI|사용량/i.test(msg) ||
    Boolean(errorLike?.demoFallbackSuggested);
  if (!should && msg) {
    // still fallback for demo scenario hard failures
  }
  try {
    await hydrateDemoCache(activeDemoScenarioId);
    return true;
  } catch {
    return false;
  }
}

async function loadChampionshipDemo(id, opts = {}) {
  const res = await fetch(\`/api/demo/scenarios/\${encodeURIComponent(id)}\`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    showToast?.(data.error || '데모 매물을 불러오지 못했습니다.');
    return;
  }
  const listing = data.listing;
  if (!listing?.platform || !listing?.itemId) {
    showToast?.('데모 매물 형식이 올바르지 않습니다.');
    return;
  }
  activeDemoScenarioId = id;
  demoFallbackUsed = false;
  hideDemoFallbackBanner();
  applyPayload({ latest: listing, history: [listing], comps: null }, { forceRestart: true });
  if (opts.forceCache) {
    await hydrateDemoCache(id);
    return;
  }
  // live pipeline starts via activateListingItem -> ensureProductSummary
  // watch summary/risk error shortly after
  window.setTimeout(() => {
    const key = summaryKey(latest);
    const summaryState = key ? productSummaries.get(key) : null;
    const riskState = key ? productRiskAnalyses.get(key) : null;
    if (summaryState?.status === 'error' || riskState?.status === 'error') {
      void maybeHydrateDemoFallback(summaryState?.error || riskState?.error || 'demo-error');
    }
  }, 12000);
}

`;

if (!t.includes('function loadChampionshipDemo')) {
  if (!t.includes('async function applyPayload') && !t.includes('function applyPayload')) {
    throw new Error('applyPayload not found');
  }
  t = t.replace('function applyPayload(payload, opts = {}) {', `${demoFns}\nfunction applyPayload(payload, opts = {}) {`);
}

// Patch ensureProductSummary catch
const summaryCatchOld = `  } catch (e) {
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

async function ensureProductRisk(item) {`;

const summaryCatchNew = `  } catch (e) {
    if (shouldIgnoreAiScope(aiScope, e)) return;
    productSummaries.set(key, {
      status: 'error',
      error: e instanceof Error ? e.message : String(e),
    });
    persistAiCaches();
    await maybeHydrateDemoFallback(e);
  } finally {
    aiScope.release();
  }

  if (selectedKey === key) refreshProductSummaryBlock(item);
}

async function ensureProductRisk(item) {`;

if (t.includes(summaryCatchOld)) {
  t = t.replace(summaryCatchOld, summaryCatchNew);
} else {
  console.warn('summary catch not patched');
}

fs.writeFileSync(p, t.replace(/\n/g, '\r\n'), 'utf8');
console.log('app.js demo patched', {
  landing: t.includes('renderChampionshipEmptyState'),
  load: t.includes('loadChampionshipDemo'),
  hydrate: t.includes('hydrateDemoCache'),
});
