/**
 * Fix sample landing clip, toast overlap, product image fallback, disable sample sale link.
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
  if (!t.includes('function isSampleListing(')) {
    t = t.replace(
      'function productSummaryImages(summary, item) {\n  return uniqueImageList([summary?.productImageUrl]).slice(0, 1);\n}',
      `function isSampleListing(item) {
  if (activeDemoScenarioId) return true;
  const id = String(item?.itemId || '');
  if (/^demo-/i.test(id)) return true;
  const url = String(item?.pageUrl || '');
  return /\\/products\\/demo-/i.test(url) || /\\/demo\\//i.test(url);
}

function productSummaryImages(summary, item) {
  const listingFirst = Array.isArray(item?.imageUrls) ? item.imageUrls[0] : '';
  return uniqueImageList([
    summary?.productImageUrl,
    ...(Array.isArray(summary?.productImageUrls) ? summary.productImageUrls : []),
    listingFirst,
  ]).slice(0, 1);
}`
    );
  }

  t = t.replace(
    `\${item.pageUrl ? \`<a class="link" href="\${escapeAttr(item.pageUrl)}" target="_blank" rel="noopener">판매글 열기</a>\` : ''}`,
    `\${
            isSampleListing(item)
              ? '<span class="link link--disabled" title="샘플 매물이라 원본 판매글이 없습니다.">판매글 없음</span>'
              : item.pageUrl
                ? \`<a class="link" href="\${escapeAttr(item.pageUrl)}" target="_blank" rel="noopener">판매글 열기</a>\`
                : ''
          }`
  );

  // seller chat link
  t = t.replace(
    `\${item?.pageUrl ? \`<a class="seller-chat__listing-link" href="\${escapeAttr(item.pageUrl)}" target="_blank" rel="noopener">판매글 열기</a>\` : ''}`,
    `\${
        isSampleListing(item)
          ? '<span class="seller-chat__listing-link seller-chat__listing-link--disabled">판매글 없음</span>'
          : item?.pageUrl
            ? \`<a class="seller-chat__listing-link" href="\${escapeAttr(item.pageUrl)}" target="_blank" rel="noopener">판매글 열기</a>\`
            : ''
      }`
  );

  // hydrate demo cache: fill product image from listing
  t = t.replace(
    `  if (cache.summary) {
    productSummaries.set(key, { status: 'done', summary: cache.summary, source: 'demo-cache' });
  }`,
    `  if (cache.summary) {
    const summary = { ...cache.summary };
    if (!summary.productImageUrl && Array.isArray(item?.imageUrls) && item.imageUrls[0]) {
      summary.productImageUrl = item.imageUrls[0];
      summary.productImageUrls = uniqueImageList([
        ...(Array.isArray(summary.productImageUrls) ? summary.productImageUrls : []),
        ...item.imageUrls,
      ]);
    }
    productSummaries.set(key, { status: 'done', summary, source: 'demo-cache' });
  }`
  );

  // toast class rename for clarity
  t = t.replace(
    `bar.className = 'championship-fallback-banner';`,
    `bar.className = 'sample-fallback-banner';`
  );

  return t;
});

rw('analyzer/style.css', (t) => {
  // strengthen empty-state layout so sample + extension fit and scroll
  const old = `/* Sample landing (empty state) — matches mini-card / chip-btn language */
.sample-landing {
  max-width: 720px;
  margin: 0 auto;
  text-align: left;
  justify-content: flex-start;
  gap: 0.85rem;
  min-height: auto;
  align-self: stretch;
  grid-column: 1 / -1;
  grid-row: auto;
  overflow: visible;
}
.app-shell.is-empty-state .analysis-board,
.app-shell.is-empty-state .listing-cluster {
  overflow: visible;
  align-content: start;
}
.app-shell.is-empty-state .listing-cluster {
  display: block;
  max-width: 760px;
  margin: 0 auto;
  padding: 0.5rem 0 2rem;
}`;

  const neu = `/* Sample landing (empty state) — matches mini-card / chip-btn language */
.app-shell.is-empty-state .analysis-board {
  align-content: start !important;
  justify-content: start;
  min-height: auto;
  height: auto;
  overflow: visible;
  padding-top: 0.75rem;
  padding-bottom: 6rem;
}
.app-shell.is-empty-state .listing-cluster {
  display: block !important;
  grid-template-columns: none !important;
  grid-auto-rows: auto !important;
  max-width: 760px;
  margin: 0 auto;
  padding: 0.5rem 0 2rem;
  overflow: visible !important;
}
.mini-card.mini-card--empty,
.mini-card.sample-landing {
  overflow: visible !important;
  grid-column: 1 / -1 !important;
  grid-row: auto !important;
  height: auto !important;
  max-height: none !important;
  min-height: 0 !important;
}
.sample-landing {
  max-width: 720px;
  margin: 0 auto;
  text-align: left;
  justify-content: flex-start;
  gap: 0.85rem;
  align-self: stretch;
}`;

  if (!t.includes(old)) {
    // fallback append overrides
    if (!t.includes('app-shell.is-empty-state .analysis-board {\n  align-content: start !important')) {
      t += '\n' + neu + '\n';
    }
  } else {
    t = t.replace(old, neu);
  }

  // toast above slide controls
  t = t.replace(
    `.championship-fallback-banner,
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
}`,
    `.championship-fallback-banner,
.sample-fallback-banner {
  position: fixed;
  left: 50%;
  /* sit above fixed stage-slide-controls (bottom: 1rem) */
  bottom: calc(1rem + 3.6rem + env(safe-area-inset-bottom, 0px));
  z-index: 80;
  transform: translateX(-50%);
  max-width: min(560px, 92vw);
  padding: 0.7rem 1rem;
  border-radius: 999px;
  background: var(--step-1-solid, #f97316);
  color: #fff;
  font-size: 0.82rem;
  box-shadow: 0 10px 30px rgba(249, 115, 22, 0.28);
  pointer-events: none;
}`
  );

  if (!t.includes('.link--disabled')) {
    t += `
.link--disabled,
.seller-chat__listing-link--disabled {
  color: #9aa3b2 !important;
  cursor: default;
  text-decoration: none !important;
  pointer-events: none;
  opacity: 0.72;
}
`;
  }

  return t;
});

rw('analyzer/index.html', (t) => {
  t = t.replace(/style\.css\?v=[^\"]+/, 'style.css?v=20260916-landing3');
  t = t.replace(/app\.js\?v=[^\"]+/, 'app.js?v=20260916-landing3');
  t = t.replace(/gate\.js\?v=[^\"]+/, 'gate.js?v=20260916-landing3');
  t = t.replace(/config\.js\?v=[^\"]+/, 'config.js?v=20260916-landing3');
  t = t.replace(/client\.js\?v=[^\"]+/, 'client.js?v=20260916-landing3');
  return t;
});

// Enrich demo caches with productImageUrl from scenario listing
for (const id of [
  'airpods-pro2-chronic',
  'switch-oled-accessories',
  'galaxy-promo-photos',
  'macbook-price-compare',
  'ipad-body-gaps',
]) {
  const scenPath = `demo/scenarios/${id}.json`;
  const cachePath = `demo/cache/${id}.json`;
  const scen = JSON.parse(fs.readFileSync(scenPath, 'utf8'));
  const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  const img = scen?.listing?.imageUrls?.[0];
  if (img && cache.summary) {
    cache.summary.productImageUrl = cache.summary.productImageUrl || img;
    cache.summary.productImageUrls = cache.summary.productImageUrls || scen.listing.imageUrls.slice(0, 3);
    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2) + '\n', 'utf8');
    console.log('cache image', id);
  }
}

console.log('done');
