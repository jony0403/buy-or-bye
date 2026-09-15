/**
 * Sample = listing input only (live AI), no cache toast;
 * extension detect disables URL/Step3 search; richer install guide; 샘플 badge.
 */
import fs from 'node:fs';

function rw(file, fn) {
  let t = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const next = fn(t);
  if (next === t) throw new Error(`no change: ${file}`);
  fs.writeFileSync(file, next.replace(/\n/g, '\r\n'), 'utf8');
  console.log('ok', file);
}

rw('analyzer/app.js', (t) => {
  // extension presence state near other lets
  if (!t.includes('let extensionPresent')) {
    t = t.replace(
      'let activeDemoScenarioId = \'\';',
      `let activeDemoScenarioId = '';
let extensionPresent = false;
let extensionProbeTimer = 0;
const EXT_REQUIRED_TITLE = 'Chrome 확장 프로그램을 설치해야 사용할 수 있습니다.';`
    );
  }

  // title with 샘플 badge
  t = t.replace(
    `<h3 class="item-title hover-full" title="\${escapeAttr(item.title || '(제목 없음)')}">\${escapeHtml(item.title || '(제목 없음)')}</h3>`,
    `<h3 class="item-title hover-full" title="\${escapeAttr(item.title || '(제목 없음)')}">\${
              isSampleListing(item) ? '<span class="sample-badge" title="샘플 판매글 입력값">샘플</span> ' : ''
            }\${escapeHtml(item.title || '(제목 없음)')}</h3>`
  );

  // empty state + detailed extension guide
  const emptyStart = t.indexOf('function renderChampionshipEmptyState()');
  const emptyEnd = t.indexOf('\nasync function fetchDemoCatalog', emptyStart);
  if (emptyStart < 0 || emptyEnd < 0) throw new Error('empty state block missing');
  t =
    t.slice(0, emptyStart) +
    `function renderChampionshipEmptyState() {
  return \`
    <article class="mini-card mini-card--empty sample-landing" data-sample-landing>
      <img class="empty-extension-icon" src="/icons/icon128.png" alt="" width="72" height="72" />
      <h2>매물 대기</h2>
      <p class="empty">왼쪽 URL로 중고나라·번개장터·당근 링크를 불러오거나, 아래 샘플 판매글로 바로 분석을 시작해 보세요.</p>
      <p class="empty empty-sub">샘플은 <strong>판매글(제목·본문·사진·가격)</strong>만 미리 넣어 둔 입력값입니다. Step 1부터는 전부 실시간 AI로 분석합니다.</p>
      <div class="sample-demo-block">
        <p class="sample-section-label">샘플 매물</p>
        <div class="sample-demo-grid" data-demo-grid>
          <p class="mini-muted">샘플을 불러오는 중…</p>
        </div>
      </div>
      <div class="sample-ext-block" data-ext-block>
        <p class="sample-section-label">Chrome 확장 프로그램</p>
        <p class="empty empty-sub">실제 매물 URL 불러오기·유사 매물(번개/당근/중고나라) 검색은 확장이 필요합니다. 샘플 분석만 할 때는 없어도 됩니다.</p>
        <div class="sample-ext-actions">
          <a class="btn btn-small" href="/downloads/buy-or-bye-extension.zip">확장 ZIP 받기</a>
          <button type="button" class="chip-btn chip-btn--ghost" data-ext-help>설치 방법 자세히</button>
        </div>
        <div class="sample-ext-steps" data-ext-steps hidden>
          <ol>
            <li><strong>ZIP 받기</strong>를 눌러 <code>buy-or-bye-extension.zip</code>을 다운로드합니다.</li>
            <li>다운로드한 ZIP을 마우스 오른쪽 클릭 → <strong>압축 풀기</strong>로 폴더를 만듭니다. (예: <code>buy-or-bye-extension</code>)</li>
            <li>Chrome(또는 Chromium 계열)을 연 뒤 주소창에 <code>chrome://extensions</code>를 입력하고 Enter를 누릅니다.</li>
            <li>오른쪽 위 <strong>개발자 모드</strong> 스위치를 켭니다.</li>
            <li><strong>압축해제된 확장 프로그램을 로드합니다</strong>(Load unpacked)를 클릭합니다.</li>
            <li>방금 압축을 푼 <strong>그 폴더</strong>를 선택합니다. (ZIP 파일이 아니라 풀린 폴더여야 합니다.)</li>
            <li>확장 목록에 「Buy or Bye」가 보이면 설치 완료입니다. 필요하면 핀(고정)해 두세요.</li>
            <li>이 분석 페이지를 <strong>새로고침</strong>하면 URL 불러오기·유사 매물 검색이 활성화됩니다.</li>
            <li>실제 당근·번개·중고나라 <strong>매물 상세 페이지</strong>에서 확장 아이콘을 누르면 이 화면으로 매물이 전송됩니다.</li>
          </ol>
          <p class="empty empty-sub">설치 후에도 비활성이면 이 탭을 새로고침하거나, 확장이 이 사이트 접근을 허용했는지 chrome://extensions에서 확인해 주세요.</p>
        </div>
      </div>
    </article>
  \`;
}

` +
    t.slice(emptyEnd + 1);

  // loadChampionshipDemo: live only, no cache
  t = t.replace(
    /async function loadChampionshipDemo\(id, opts = \{\}\) \{[\s\S]*?\n\}\n\n\nfunction applyPayload/,
    `async function loadChampionshipDemo(id) {
  const res = await fetch(\`/api/demo/scenarios/\${encodeURIComponent(id)}\`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    showToast?.(data.error || '샘플 매물을 불러오지 못했습니다.');
    return;
  }
  const listing = data.listing;
  if (!listing?.platform || !listing?.itemId) {
    showToast?.('샘플 매물 형식이 올바르지 않습니다.');
    return;
  }
  activeDemoScenarioId = id;
  demoFallbackUsed = false;
  hideDemoFallbackBanner();
  // 판매글 입력값만 넣고 Step 1~ 전부 라이브 AI
  applyPayload({ latest: listing, history: [listing], comps: null }, { forceRestart: true });
}

function applyPayload`
  );

  // neutralize cache hydrate / banner (keep stubs so old callers don't break)
  t = t.replace(
    /function showDemoFallbackBanner\(message\) \{[\s\S]*?\n\}\n\nfunction hideDemoFallbackBanner/,
    `function showDemoFallbackBanner() {
  /* removed: sample runs live AI only */
  hideDemoFallbackBanner();
}

function hideDemoFallbackBanner`
  );
  t = t.replace(
    /async function hydrateDemoCache\(id\) \{[\s\S]*?\n\}\n\nasync function maybeHydrateDemoFallback/,
    `async function hydrateDemoCache() {
  /* disabled: samples are listing inputs only */
}

async function maybeHydrateDemoFallback`
  );
  t = t.replace(
    /async function maybeHydrateDemoFallback\(errorLike\) \{[\s\S]*?\n\}/,
    `async function maybeHydrateDemoFallback() {
  return false;
}`
  );

  // requestListingUrlImport gate
  t = t.replace(
    `function requestListingUrlImport(rawUrl) {
  const url = supportedListingUrl(rawUrl);
  if (!url) {
    setUrlImportStatus('지원 URL 아님', 'error');
    return;
  }
  pendingImportUrl = url;
  setUrlImportStatus('페이지 여는 중...', 'loading');
  window.postMessage({ type: 'MARKET_SCRAPE_IMPORT_URL', url }, '*');
}`,
    `function requestListingUrlImport(rawUrl) {
  if (!extensionPresent) {
    setUrlImportStatus('확장 설치 필요', 'error');
    showAppToast?.(EXT_REQUIRED_TITLE);
    return;
  }
  const url = supportedListingUrl(rawUrl);
  if (!url) {
    setUrlImportStatus('지원 URL 아님', 'error');
    return;
  }
  pendingImportUrl = url;
  setUrlImportStatus('페이지 여는 중...', 'loading');
  window.postMessage({ type: 'MARKET_SCRAPE_IMPORT_URL', url }, '*');
}`
  );

  // block OPEN_SEARCH_TABS without extension
  t = t.replace(
    `  if (btn) btn.disabled = true;
  window.postMessage({ type: 'MARKET_SCRAPE_OPEN_SEARCH_TABS', query: queryList[0], queries: queryList }, '*');`,
    `  if (!extensionPresent) {
    showAppToast?.(EXT_REQUIRED_TITLE);
    if (btn) btn.disabled = false;
    if (selectedKey === key) refreshStageThreeSection(item);
    return;
  }
  if (btn) btn.disabled = true;
  window.postMessage({ type: 'MARKET_SCRAPE_OPEN_SEARCH_TABS', query: queryList[0], queries: queryList }, '*');`
  );

  // extension probe helpers before bootstrapApp
  if (!t.includes('function probeExtensionPresence')) {
    t = t.replace(
      'function bootstrapApp() {',
      `function applyExtensionUiState() {
  const tip = EXT_REQUIRED_TITLE;
  document.querySelectorAll('[data-needs-extension]').forEach((el) => {
    const on = extensionPresent;
    el.classList.toggle('is-ext-disabled', !on);
    el.toggleAttribute('disabled', !on);
    if (!on) {
      el.setAttribute('title', tip);
      el.setAttribute('aria-disabled', 'true');
    } else {
      el.removeAttribute('title');
      el.removeAttribute('aria-disabled');
    }
  });
  const urlForm = document.getElementById('urlImportForm');
  const railForm = document.getElementById('railImportForm');
  const urlInput = document.getElementById('urlImportInput');
  const railInput = document.getElementById('railUrlInput');
  const urlBtn = urlForm?.querySelector('button[type="submit"]');
  const railBtn = railForm?.querySelector('button[type="submit"]');
  for (const el of [urlInput, railInput, urlBtn, railBtn]) {
    if (!el) continue;
    el.classList.toggle('is-ext-disabled', !extensionPresent);
    if ('disabled' in el) el.disabled = !extensionPresent;
    if (!extensionPresent) el.setAttribute('title', tip);
    else el.removeAttribute('title');
  }
  document.body.classList.toggle('ext-missing', !extensionPresent);
  document.body.classList.toggle('ext-ready', extensionPresent);
}

function probeExtensionPresence() {
  return new Promise((resolve) => {
    let done = false;
    const finish = (ok) => {
      if (done) return;
      done = true;
      window.removeEventListener('message', onMsg);
      resolve(Boolean(ok));
    };
    const onMsg = (ev) => {
      if (ev.source !== window || ev.data?.type !== 'ULSA_EXT_PONG') return;
      finish(true);
    };
    window.addEventListener('message', onMsg);
    window.postMessage({ type: 'ULSA_EXT_PING' }, '*');
    window.setTimeout(() => finish(false), 450);
  });
}

async function refreshExtensionPresence() {
  extensionPresent = await probeExtensionPresence();
  applyExtensionUiState();
  return extensionPresent;
}

function bootstrapApp() {`
    );
  }

  // call refreshExtensionPresence in initMain and on mount
  if (!t.includes('void refreshExtensionPresence()')) {
    t = t.replace(
      'function initMain() {\n  if (__appStarted) return;\n  __appStarted = true;\n',
      `function initMain() {
  if (__appStarted) return;
  __appStarted = true;
  void refreshExtensionPresence();
  if (extensionProbeTimer) window.clearInterval(extensionProbeTimer);
  extensionProbeTimer = window.setInterval(() => void refreshExtensionPresence(), 4000);
`
    );
    t = t.replace(
      '  if (document.readyState === \'loading\') {\n    document.addEventListener(\'DOMContentLoaded\', mountSampleLanding, { once: true });\n  } else {\n    mountSampleLanding();\n  }\n}',
      `  const boot = () => {
    mountSampleLanding();
    void refreshExtensionPresence();
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
}`
    );
  }

  // mark stage three search / start buttons
  t = t.replace(
    /data-stage-three-start="\$\{escapeAttr\(key\)\}"/g,
    'data-stage-three-start="${escapeAttr(key)}" data-needs-extension'
  );
  t = t.replace(
    /data-stage-three-refresh="\$\{escapeAttr\(key\)\}"/g,
    'data-stage-three-refresh="${escapeAttr(key)}" data-needs-extension'
  );

  // after renderItem sets HTML, apply extension UI
  t = t.replace(
    '  bindSellerChatFlow($current, item);\n  lastStageThreeCompsRenderKey = stageThreeCompsRenderKey(item, comps);',
    `  bindSellerChatFlow($current, item);
  applyExtensionUiState();
  lastStageThreeCompsRenderKey = stageThreeCompsRenderKey(item, comps);`
  );

  return t;
});

rw('analyzer/style.css', (t) => {
  if (!t.includes('.sample-badge')) {
    t += `
.sample-badge {
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
  margin-right: 0.28rem;
  padding: 0.12rem 0.42rem;
  border-radius: 999px;
  background: #fff3ea;
  color: #d85700;
  border: 1px solid rgba(255, 111, 15, 0.28);
  font-size: 0.68rem;
  font-weight: 850;
  letter-spacing: 0.02em;
}
.link--disabled,
.seller-chat__listing-link--disabled,
.is-ext-disabled,
button.is-ext-disabled,
input.is-ext-disabled {
  opacity: 0.55 !important;
  cursor: not-allowed !important;
  filter: grayscale(0.15);
}
body.ext-missing .sample-ext-block {
  border-color: rgba(255, 111, 15, 0.35);
  box-shadow: 0 0 0 1px rgba(255, 111, 15, 0.08);
}
.sample-ext-steps {
  display: block;
}
.sample-ext-steps[hidden] {
  display: none !important;
}
.sample-ext-steps ol {
  margin: 0.2rem 0 0.55rem;
  padding-left: 1.2rem;
}
.sample-ext-steps li {
  margin: 0.35rem 0;
}
.sample-fallback-banner,
.championship-fallback-banner {
  display: none !important;
}
`;
  }
  return t;
});

rw('extension/bridge-analyzer.js', (t) => {
  t = t.replace(
    `function isAnalyzerPage() {
    if (location.hostname !== '127.0.0.1' && location.hostname !== 'localhost') return false;
    const p = Number(location.port);
    return PORTS.includes(p);
  }`,
    `function isAnalyzerPage() {
    const host = location.hostname;
    if (host === '127.0.0.1' || host === 'localhost') {
      return PORTS.includes(Number(location.port));
    }
    // championship / deployed analyzer
    if (host.includes('buy-or-bye') && host.includes('railway.app')) return true;
    if (typeof BUY_OR_BYE_ANALYZER_ORIGINS !== 'undefined') {
      return BUY_OR_BYE_ANALYZER_ORIGINS.includes(location.origin);
    }
    return false;
  }`
  );
  if (!t.includes('ULSA_EXT_PING')) {
    t = t.replace(
      `window.addEventListener('message', (ev) => {
    if (ev.source !== window || ev.data?.type !== 'MARKET_SCRAPE_REQUEST') return;
    pushToPage();
  });`,
      `window.addEventListener('message', (ev) => {
    if (ev.source !== window || ev.data?.type !== 'ULSA_EXT_PING') return;
    window.postMessage({ type: 'ULSA_EXT_PONG', at: Date.now() }, '*');
  });

  window.addEventListener('message', (ev) => {
    if (ev.source !== window || ev.data?.type !== 'MARKET_SCRAPE_REQUEST') return;
    pushToPage();
  });`
    );
  }
  return t;
});

rw('extension/manifest.json', (t) => {
  const j = JSON.parse(t);
  const origin = 'https://buy-or-bye-championship-production.up.railway.app/*';
  if (!j.host_permissions.includes(origin)) j.host_permissions.push(origin);
  const bridge = j.content_scripts.find((c) => (c.js || []).includes('bridge-analyzer.js'));
  if (bridge && !bridge.matches.includes(origin)) bridge.matches.push(origin);
  j.version = '2.7.8';
  return JSON.stringify(j, null, 2) + '\n';
});

rw('extension/analyzer-origins.js', () => `/** Updated for championship deploy + local. */
const BUY_OR_BYE_ANALYZER_ORIGINS = [
  'https://buy-or-bye-championship-production.up.railway.app',
  'http://127.0.0.1:3920',
  'http://localhost:3920',
];
`);

rw('analyzer/index.html', (t) => {
  t = t.replace(/\\?v=20260916-landing\\d+/g, '?v=20260916-landing5');
  t = t.replace(/style\\.css\\?v=[^\"]+/, 'style.css?v=20260916-landing5');
  t = t.replace(/app\\.js\\?v=[^\"]+/, 'app.js?v=20260916-landing5');
  t = t.replace(/gate\\.js\\?v=[^\"]+/, 'gate.js?v=20260916-landing5');
  t = t.replace(/config\\.js\\?v=[^\"]+/, 'config.js?v=20260916-landing5');
  t = t.replace(/client\\.js\\?v=[^\"]+/, 'client.js?v=20260916-landing5');
  return t;
});

// serve demo images
rw('analyzer-server.mjs', (t) => {
  if (t.includes('/demo-images/')) return t;
  t = t.replace(
    `if (
    (req.method === 'GET' || req.method === 'HEAD') &&
    url.pathname === '/downloads/buy-or-bye-extension.zip'
  ) {`,
    `if (req.method === 'GET' && url.pathname.startsWith('/demo-images/')) {
    try {
      const rel = decodeURIComponent(url.pathname.slice('/demo-images/'.length));
      if (!/^[a-z0-9][a-z0-9/_./-]{0,180}$/i.test(rel) || rel.includes('..')) {
        res.writeHead(400);
        res.end('bad path');
        return;
      }
      const filePath = path.join(ROOT, 'demo', 'images', rel);
      const buf = await fs.readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const type =
        ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'public, max-age=86400' });
      res.end(buf);
    } catch {
      res.writeHead(404);
      res.end('not found');
    }
    return;
  }

  if (
    (req.method === 'GET' || req.method === 'HEAD') &&
    url.pathname === '/downloads/buy-or-bye-extension.zip'
  ) {`
  );
  return t;
});

console.log('patched core');
