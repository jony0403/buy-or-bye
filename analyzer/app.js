const $current = document.getElementById('current');
const $history = document.getElementById('history');
const $status = document.getElementById('status');
const $btnRefresh = document.getElementById('btnRefresh');
const $lightbox = document.getElementById('lightbox');
const $lightboxImg = document.getElementById('lightboxImg');
const $lightboxClose = document.getElementById('lightboxClose');

let latest = null;
let history = [];
let comps = null;
let selectedKey = null;

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
  if (platform !== 'daangn' && seller.reviewRating != null) bits.push(`평점 ${seller.reviewRating}`);
  if (seller.reviewCount != null) bits.push(`리뷰 ${seller.reviewCount}`);
  if (seller.salesCount != null) bits.push(`판매 ${seller.salesCount}`);
  if (seller.location) bits.push(seller.location);
  return bits.join(' · ') || '—';
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

function renderCompsBlock(comps) {
  if (!comps) return '';
  const all = [...(comps.bunjang?.items || []), ...(comps.daangn?.items || [])];
  if (!all.length) {
    return '<p class="block-label">비교 매물 (시세 근거)</p><p class="meta empty">아직 없음 — 확장에서 «유사 매물 검색» 후 전송하세요.</p>';
  }
  const st = compStats(all);
  const statsTxt = st
    ? `${st.n}건 · 중앙 ${formatWon(st.median)} · ${formatWon(st.min)} ~ ${formatWon(st.max)}`
    : `${all.length}건`;
  const rows = all
    .slice(0, 15)
    .map(
      (c) =>
        `<li><a href="${escapeAttr(c.url)}" target="_blank" rel="noopener">[${escapeHtml(c.platformLabel || c.platform)}] ${escapeHtml(c.title || '')}</a> <span class="hist-meta">${escapeHtml(c.priceLabel || '')}</span></li>`
    )
    .join('');
  const more = all.length > 15 ? `<p class="meta">외 ${all.length - 15}건</p>` : '';
  return `
    <p class="block-label">비교 매물 (시세 근거)</p>
    <p class="meta"><strong>${escapeHtml(statsTxt)}</strong> · 설정 지역·검색 결과 기준</p>
    <ul class="comp-list">${rows}</ul>
    ${more}
  `;
}

function renderItem(item, comps) {
  if (!item) {
    $current.innerHTML = '<p class="empty">아직 데이터가 없습니다.</p>';
    return;
  }
  const plat = item.platform === 'daangn' ? 'daangn' : 'bunjang';
  const imgs = (item.imageUrls || [])
    .slice(0, 12)
    .map(
      (src) =>
        `<img class="zoomable" src="${escapeAttr(src)}" data-full="${escapeAttr(src)}" alt="" loading="lazy" role="button" tabindex="0" />`
    )
    .join('');
  $current.innerHTML = `
    <span class="badge ${plat}">${escapeHtml(item.platformLabel || item.platform)}</span>
    <h3 class="item-title">${escapeHtml(item.title || '(제목 없음)')}</h3>
    <p class="price">${escapeHtml(item.priceLabel || '—')}</p>
    <p class="meta">${escapeHtml(sellerLine(item.seller, item.platform))}</p>
    <p class="block-label">본문</p>
    <div class="body-text">${escapeHtml(item.body || '')}</div>
    <p class="block-label">사진 ${(item.imageUrls || []).length}장</p>
    <div class="imgs">${imgs || '<span class="empty">없음</span>'}</div>
    ${renderCompsBlock(comps || item.comps)}
    ${item.pageUrl ? `<a class="link" href="${escapeAttr(item.pageUrl)}" target="_blank" rel="noopener">원본 페이지</a>` : ''}
    <p class="meta" style="margin-top:0.75rem">${formatTime(item.exportedAt)} · ${escapeHtml(item.itemId || '')}</p>
  `;
  bindImageZoom($current);
}

function openLightbox(src) {
  if (!$lightbox || !$lightboxImg || !src) return;
  $lightboxImg.src = src;
  $lightbox.hidden = false;
  $lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  if (!$lightbox || !$lightboxImg) return;
  $lightbox.hidden = true;
  $lightbox.setAttribute('aria-hidden', 'true');
  $lightboxImg.removeAttribute('src');
  document.body.style.overflow = '';
}

function bindImageZoom(root) {
  root?.querySelectorAll('.imgs img.zoomable').forEach((img) => {
    const open = () => openLightbox(img.getAttribute('data-full') || img.src);
    img.addEventListener('click', open);
    img.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    });
  });
}

$lightbox?.addEventListener('click', (e) => {
  if (e.target === $lightbox) closeLightbox();
});
$lightboxClose?.addEventListener('click', closeLightbox);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && $lightbox && !$lightbox.hidden) closeLightbox();
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
      return `<li><button type="button" data-key="${escapeAttr(key)}" class="${active.trim()}">
        <span class="hist-title">[${escapeHtml(item.platformLabel || item.platform)}] ${escapeHtml(item.title || '')}</span>
        <span class="hist-meta">${escapeHtml(item.priceLabel || '')} · ${formatTime(item.exportedAt)}</span>
      </button></li>`;
    })
    .join('');

  $history.querySelectorAll('button[data-key]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-key');
      const found = history.find((h) => itemKey(h) === key);
      if (found) {
        selectedKey = key;
        renderItem(found, comps);
        renderHistoryList();
      }
    });
  });
}

function applyPayload(payload) {
  latest = payload?.latest ?? latest;
  history = Array.isArray(payload?.history) ? payload.history : history;
  comps = payload?.comps ?? latest?.comps ?? comps;

  if (latest) {
    selectedKey = itemKey(latest);
    renderItem(latest, comps);
    const bn = comps?.bunjang?.count ?? 0;
    const dn = comps?.daangn?.count ?? 0;
    const compTxt = bn + dn > 0 ? ` · 비교 ${bn + dn}건` : '';
    $status.textContent = `최신: ${latest.platformLabel}${compTxt} · ${formatTime(latest.exportedAt)}`;
  } else if (!history.length) {
    $status.textContent = '데이터 없음 — 확장에서 매물을 «분석 웹으로 보내기» 하세요.';
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

window.addEventListener('message', (ev) => {
  if (ev.source !== window) return;
  const d = ev.data;
  if (!d || d.type !== 'MARKET_SCRAPE_BRIDGE') return;
  applyPayload({ latest: d.latest, history: d.history });
});

$btnRefresh.addEventListener('click', () => {
  window.postMessage({ type: 'MARKET_SCRAPE_REQUEST' }, '*');
  $status.textContent = '불러오는 중…';
});

window.postMessage({ type: 'MARKET_SCRAPE_REQUEST' }, '*');
