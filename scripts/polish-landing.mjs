/**
 * Productize empty landing: remove championship meta, keep sample demos + optional extension guide.
 */
import fs from 'node:fs';

function rw(file, fn) {
  let t = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const next = fn(t);
  if (next === t) throw new Error(`no change: ${file}`);
  fs.writeFileSync(file, next.replace(/\n/g, '\r\n'), 'utf8');
  console.log('ok', file);
}

rw('analyzer/index.html', (t) => {
  t = t.replace(
    /<p class="ai-gate__desc">[\s\S]*?<\/p>/,
    `<p class="ai-gate__desc">
          <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">OpenAI Platform</a>
          에서 발급한 API 키를 입력하면 분석을 시작할 수 있습니다. 키는 이 브라우저에만 저장됩니다.
        </p>`
  );

  t = t.replace(
    /<article class="mini-card mini-card--empty">[\s\S]*?<\/article>/,
    `<article class="mini-card mini-card--empty">
          <img class="empty-extension-icon" src="/icons/icon128.png" alt="" width="72" height="72" />
          <h2>매물 대기</h2>
          <p class="empty">왼쪽 URL로 매물 링크를 불러오거나, 샘플 매물로 바로 분석을 시작해 보세요.</p>
          <p class="empty empty-sub">매물이 들어오면 제품 식별, 하자·고질병 체크, 가격 참고, 구매 판단까지 순서대로 정리됩니다.</p>
        </article>`
  );

  t = t.replace(/style\.css\?v=[^\"]+/, 'style.css?v=20260916-landing');
  t = t.replace(/app\.js\?v=[^\"]+/, 'app.js?v=20260916-landing');
  t = t.replace(/gate\.js\?v=[^\"]+/, 'gate.js?v=20260916-landing');
  return t;
});

rw('analyzer/ai/gate.js', (t) => {
  // keep OpenAI messaging minimal if any leftover championship text
  t = t.replace(
    /platform\.openai\.com에서 발급한 OpenAI API 키를 입력하세요\./,
    'OpenAI API 키를 입력하세요.'
  );
  return t;
});

const emptyFn = `function renderChampionshipEmptyState() {
  return \`
    <article class="mini-card mini-card--empty sample-landing" data-sample-landing>
      <img class="empty-extension-icon" src="/icons/icon128.png" alt="" width="72" height="72" />
      <h2>매물 대기</h2>
      <p class="empty">왼쪽 URL로 번개장터·당근 링크를 불러오거나, 아래 샘플로 바로 분석을 시작해 보세요.</p>
      <div class="sample-demo-block">
        <p class="sample-section-label">샘플 매물</p>
        <div class="sample-demo-grid" data-demo-grid>
          <p class="mini-muted">샘플을 불러오는 중…</p>
        </div>
      </div>
      <div class="sample-ext-block">
        <p class="sample-section-label">확장 프로그램 <span class="mini-muted">(선택)</span></p>
        <p class="empty empty-sub">실제 매물 페이지에서 한 번에 보내려면 Chrome 확장을 설치하세요.</p>
        <div class="sample-ext-actions">
          <a class="btn btn-small" href="/downloads/buy-or-bye-extension.zip">ZIP 받기</a>
          <button type="button" class="chip-btn chip-btn--ghost" data-ext-help>설치 방법 보기</button>
        </div>
        <ol class="sample-ext-steps" data-ext-steps hidden>
          <li>받은 ZIP을 풀어 폴더로 둡니다.</li>
          <li>Chrome 주소창에 <code>chrome://extensions</code>를 입력합니다.</li>
          <li>오른쪽 위 <strong>개발자 모드</strong>를 켭니다.</li>
          <li><strong>압축해제된 확장 프로그램을 로드합니다</strong>에서 방금 푼 폴더를 선택합니다.</li>
          <li>당근·번개 매물 상세에서 확장 아이콘을 누르면 이 분석 화면으로 전송됩니다.</li>
        </ol>
      </div>
    </article>
  \`;
}`;

rw('analyzer/app.js', (t) => {
  const start = t.indexOf('function renderChampionshipEmptyState()');
  if (start < 0) throw new Error('renderChampionshipEmptyState missing');
  const end = t.indexOf('\nasync function fetchDemoCatalog', start);
  if (end < 0) throw new Error('fetchDemoCatalog marker missing');
  t = t.slice(0, start) + emptyFn + '\n\n' + t.slice(end + 1);

  t = t.replace(
    `bar.textContent = message || '라이브 AI 호출에 실패해 데모 캐시 결과로 표시합니다.';`,
    `bar.textContent = message || '일시적으로 준비된 분석 결과로 표시합니다.';`
  );

  // bindChampionshipEmptyState already works with data-demo-grid / data-ext-help
  t = t.replace(
    /class="championship-demo-card"/g,
    'class="sample-demo-card"'
  );
  t = t.replace(
    /championship-demo-card/g,
    'sample-demo-card'
  );

  return t;
});

rw('analyzer/style.css', (t) => {
  const block = `
/* Sample landing (empty state) — matches mini-card / chip-btn language */
.sample-landing {
  max-width: 720px;
  margin: 0 auto;
  text-align: left;
  justify-content: flex-start;
  gap: 0.85rem;
}
.sample-section-label {
  margin: 0 0 0.45rem;
  color: var(--ui-text-strong, #2f343b);
  font-size: 0.78rem;
  font-weight: 800;
}
.sample-demo-block,
.sample-ext-block {
  width: 100%;
  margin-top: 0.15rem;
}
.sample-demo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(148px, 1fr));
  gap: 0.55rem;
}
.sample-demo-card {
  display: grid;
  gap: 0.28rem;
  padding: 0.75rem 0.7rem;
  border: 1px solid #e7e2dc;
  border-radius: 14px;
  background: var(--modern-surface, #fff);
  box-shadow: var(--modern-shadow, 0 8px 22px rgba(20, 20, 24, 0.06));
  text-align: left;
  cursor: pointer;
  font: inherit;
  color: inherit;
  transition: border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
}
.sample-demo-card:hover {
  border-color: rgba(255, 111, 15, 0.35);
  transform: translateY(-1px);
  box-shadow: var(--modern-shadow-hover, 0 14px 28px rgba(17, 24, 39, 0.1));
}
.sample-demo-card strong {
  font-size: 0.82rem;
  color: var(--ui-text-strong, #2f343b);
}
.sample-demo-card span {
  color: var(--ui-text-muted, #727984);
  font-size: 0.68rem;
  line-height: 1.4;
}
.sample-ext-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem;
  margin: 0.45rem 0 0.2rem;
}
.sample-ext-steps {
  margin: 0.55rem 0 0;
  padding: 0.7rem 0.7rem 0.7rem 1.35rem;
  border: 1px solid #e7e2dc;
  border-radius: 14px;
  background: #fafaf8;
  color: var(--ui-text-muted, #727984);
  font-size: 0.76rem;
  line-height: 1.55;
}
.sample-ext-steps code {
  font-size: 0.72rem;
  padding: 0.05rem 0.28rem;
  border-radius: 6px;
  background: #f1f3f6;
}
.championship-fallback-banner,
.sample-fallback-banner {
  position: fixed;
  left: 50%;
  bottom: 1rem;
  z-index: 120;
  transform: translateX(-50%);
  max-width: min(560px, 92vw);
  padding: 0.7rem 1rem;
  border-radius: 999px;
  background: var(--step-1-solid, #f97316);
  color: #fff;
  font-size: 0.82rem;
  box-shadow: 0 10px 30px rgba(249, 115, 22, 0.28);
}
.championship-fallback-banner[hidden],
.sample-fallback-banner[hidden] {
  display: none !important;
}
body.theme-dark .sample-demo-card {
  background: rgba(20, 24, 32, 0.92);
  border-color: rgba(255, 255, 255, 0.08);
  color: #e8eaed;
}
body.theme-dark .sample-demo-card span {
  color: #9aa3b2;
}
body.theme-dark .sample-ext-steps {
  background: rgba(20, 24, 32, 0.75);
  border-color: rgba(255, 255, 255, 0.08);
  color: #9aa3b2;
}
body.theme-dark .sample-ext-steps code {
  background: rgba(255, 255, 255, 0.06);
}
`;

  // Replace old championship block if present
  const marker = '/* Championship demo landing */';
  const idx = t.indexOf(marker);
  if (idx >= 0) {
    // cut until end of file championship rules or next major section - find last championship rule area
    const endMarker = 'body.theme-dark .championship-ext {';
    const endIdx = t.indexOf(endMarker);
    if (endIdx > idx) {
      let i = endIdx;
      // skip to closing brace of that rule
      const close = t.indexOf('}', i);
      t = t.slice(0, idx) + block + t.slice(close + 1);
    } else {
      t = t.slice(0, idx) + block + t.slice(idx);
    }
  } else if (!t.includes('.sample-demo-card')) {
    t += '\n' + block;
  }
  return t;
});

rw('demo/index.json', (t) => {
  const j = JSON.parse(t);
  j.title = '샘플 매물';
  j.description = '확장 없이도 바로 분석 흐름을 볼 수 있는 선별 매물 5개입니다.';
  return JSON.stringify(j, null, 2) + '\n';
});

console.log('landing UI updated');
