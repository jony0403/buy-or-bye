/** @file 공통 UI·유틸·어댑터 레지스트리 */
(() => {
  const Root = globalThis.MarketScrape || (globalThis.MarketScrape = {});
  const adapters = (Root.adapters = Root.adapters || []);

  Root.register = (adapter) => {
    if (adapter?.id) adapters.push(adapter);
  };

  Root.getAdapter = () => {
    const { hostname, href } = location;
    return adapters.find((a) => a.matches(hostname, href)) || null;
  };

  Root.formatWon = (n) => {
    const x = Number(String(n).replace(/,/g, ''));
    if (!Number.isFinite(x)) return String(n ?? '');
    if (x === 0) return '나눔';
    return `${x.toLocaleString('ko-KR')}원`;
  };

  Root.formatSellerLine = (seller, platform) => {
    if (!seller) return '';
    const bits = [];
    const name = seller.name || seller.shopName || seller.nickname || '';
    if (name) bits.push(name);
    if (seller.isProshop) bits.push('프로상점');
    if (platform === 'daangn' && Number.isFinite(seller.mannerScore))
      bits.push(`매너온도 ${seller.mannerScore}°C`);
    if (platform !== 'daangn' && Number.isFinite(seller.reviewRating))
      bits.push(`평점 ${seller.reviewRating}`);
    if (Number.isFinite(seller.reviewCount) && seller.reviewCount >= 0)
      bits.push(`리뷰 ${seller.reviewCount.toLocaleString('ko-KR')}개`);
    if (Number.isFinite(seller.salesCount) && seller.salesCount >= 0)
      bits.push(`판매·거래 ${seller.salesCount.toLocaleString('ko-KR')}건`);
    if (seller.location) bits.push(seller.location);
    return bits.join(' · ');
  };

  Root.mergeUnique = (a = [], b = []) => {
    const seen = new Set();
    const out = [];
    for (const xs of [a, b]) {
      for (const u of xs || []) {
        if (!u || seen.has(u)) continue;
        seen.add(u);
        out.push(u);
      }
    }
    return out;
  };

  Root.textFromHtml = (raw) => {
    const s = String(raw || '').trim();
    if (!s) return '';
    if (!/<[^>]{1,120}>/.test(s)) return s;
    try {
      const tpl = document.createElement('template');
      tpl.innerHTML = s;
      return (tpl.textContent || '')
        .replace(/\u00a0/g, ' ')
        .replace(/\s+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    } catch {
      return s.replace(/<[^>]{0,200}>/g, ' ').replace(/\s+/g, ' ').trim();
    }
  };

  let latest = null;
  let host = null;
  let shadow = null;
  let open = false;

  function ensureHost() {
    if (host && document.documentElement.contains(host)) return;
    host = document.createElement('div');
    host.id = 'market-scrape-root';
    Object.assign(host.style, {
      all: 'initial',
      position: 'fixed',
      right: '12px',
      bottom: '12px',
      zIndex: '2147483646',
      fontFamily: 'Pretendard, system-ui, -apple-system, sans-serif',
    });
    document.documentElement.appendChild(host);
    shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
<style>
*{box-sizing:border-box}
.fab{position:fixed;right:0;bottom:0;padding:10px 14px;border-radius:999px;background:#111;color:#fff;font-size:13px;font-weight:700;border:none;cursor:pointer;box-shadow:0 6px 24px rgba(0,0,0,.25)}
.fab.daangn{background:#FF6F0F}
.panel{display:none;width:min(420px,calc(100vw - 24px));max-height:min(78vh,640px);overflow:auto;background:#fff;color:#1a1a1a;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.18);border:1px solid #e5e8ed;padding:14px}
.panel.open{display:block;margin-bottom:48px}
.head{font-weight:800;font-size:14px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;gap:8px}
.badge{font-size:11px;font-weight:600;color:#5c6470;background:#f4f5f7;padding:3px 8px;border-radius:999px}
.price{font-size:18px;font-weight:800;margin:6px 0 8px}
.ttl{font-size:13px;line-height:1.45;font-weight:700;margin-bottom:8px;word-break:break-word}
.seller{font-size:12px;line-height:1.5;color:#2b3038;background:#f4f5f7;border-radius:10px;padding:10px;margin-bottom:4px;word-break:break-word}
.sec-title{font-size:11px;font-weight:700;color:#5c6470;margin:10px 0 6px}
.body{font-size:12px;line-height:1.55;white-space:pre-wrap;word-break:break-word;color:#2b3038;background:#f9fafb;border-radius:10px;padding:10px;max-height:200px;overflow:auto}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(72px,1fr));gap:6px}
.grid img{width:100%;height:76px;object-fit:cover;border-radius:8px;border:1px solid #eef1f6;cursor:zoom-in}
.actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
.btn{flex:1;min-width:120px;border:none;border-radius:10px;padding:8px 10px;font-weight:700;font-size:12px;cursor:pointer}
.btn-dark{background:#111;color:#fff}
.btn-light{background:#eef1f6;color:#111}
.hint{margin-top:8px;font-size:11px;color:#8f96a3;line-height:1.45}
.err{color:#b42318;font-size:12px;margin-top:6px}
</style>
<button class="fab" type="button" id="msFab">매물 정보</button>
<div class="panel" id="msPanel">
  <div class="head"><span id="msHead">중고 매물</span><span class="badge" id="msSrc">—</span></div>
  <div class="price" id="msPrice">—</div>
  <div class="ttl" id="msTitle"></div>
  <div class="sec-title">판매자</div>
  <div class="seller" id="msSeller">—</div>
  <div class="sec-title">사진</div>
  <div class="grid" id="msImgs"></div>
  <div class="sec-title">본문</div>
  <div class="body" id="msBody"></div>
  <div class="actions">
    <button class="btn btn-dark" type="button" id="msCopyMd">Markdown 복사</button>
    <button class="btn btn-light" type="button" id="msCopyPlain">본문만 복사</button>
  </div>
  <p class="hint">번개장터·당근 <strong>상세 페이지</strong>에서 동작합니다.</p>
  <div class="err" id="msErr"></div>
</div>`;

    shadow.getElementById('msFab')?.addEventListener('click', () => {
      open = !open;
      shadow.getElementById('msPanel')?.classList.toggle('open', open);
    });
    shadow.getElementById('msCopyMd')?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(toMarkdown(latest));
      } catch {
        /* ignore */
      }
    });
    shadow.getElementById('msCopyPlain')?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(latest?.body || '');
      } catch {
        /* ignore */
      }
    });
    shadow.getElementById('msImgs')?.addEventListener('click', (ev) => {
      const t = ev.target;
      if (t?.tagName === 'IMG' && t.src) window.open(t.src, '_blank', 'noopener,noreferrer');
    });
  }

  function toMarkdown(u) {
    if (!u) return '';
    const lines = [
      `# ${u.title}`,
      '',
      `**플랫폼:** ${u.platformLabel}`,
      `**가격:** ${u.priceLabel}`,
      '',
    ];
    const sline = Root.formatSellerLine(u.seller, u.platform);
    if (sline) lines.push('**판매자:**', sline, '');
    lines.push(
      '**본문:**',
      '',
      u.body,
      '',
      '**사진:**',
      ...(u.imageUrls || []).map((x) => `- ![img](${x})`),
      '',
      `_${u.platform} · ${u.itemId} · ${u.source}_`
    );
    return lines.join('\n');
  }

  function render(data, errMsg) {
    ensureHost();
    latest = data;
    const fab = shadow.getElementById('msFab');
    shadow.getElementById('msErr').textContent = errMsg || '';
    fab?.classList.toggle('daangn', data?.platform === 'daangn');

    if (!data) {
      shadow.getElementById('msPrice').textContent = '—';
      shadow.getElementById('msTitle').textContent = errMsg ? '데이터를 가져오지 못했습니다.' : '';
      shadow.getElementById('msSeller').textContent = '—';
      shadow.getElementById('msBody').textContent = '';
      shadow.getElementById('msImgs').innerHTML = '';
      shadow.getElementById('msSrc').textContent = '—';
      return;
    }

    shadow.getElementById('msPrice').textContent = data.priceLabel;
    shadow.getElementById('msTitle').textContent = data.title;
    shadow.getElementById('msSeller').textContent =
      Root.formatSellerLine(data.seller, data.platform) || '(판매자 정보 없음)';
    shadow.getElementById('msBody').textContent = data.body;
    shadow.getElementById('msSrc').textContent = data.sourceLabel || data.source;
    const imgsEl = shadow.getElementById('msImgs');
    imgsEl.innerHTML = '';
    for (const src of data.imageUrls || []) {
      const im = document.createElement('img');
      im.loading = 'lazy';
      im.decoding = 'async';
      im.src = src;
      im.alt = '상품';
      imgsEl.appendChild(im);
    }
  }

  async function refresh(opts = {}) {
    const { openOnSuccess = false } = opts;
    ensureHost();
    const adapter = Root.getAdapter();
    if (!adapter) {
      render(null, '번개장터·당근마켓 상세 페이지에서만 동작합니다.');
      latest = null;
      return { ok: false, error: '지원하지 않는 사이트' };
    }

    if (typeof adapter.isDetailPage === 'function' && !adapter.isDetailPage()) {
      render(null, `${adapter.label} 매물 상세 페이지에서만 동작합니다.`);
      latest = null;
      return { ok: false, error: '매물 상세 페이지가 아닙니다' };
    }

    const itemId = adapter.guessItemId();
    if (!itemId) {
      render(null, `${adapter.label} 매물 상세 페이지를 연 뒤 다시 시도하세요.`);
      latest = null;
      return { ok: false, error: '매물 상세 아님' };
    }

    shadow.getElementById('msHead').textContent = `${adapter.label} (${itemId})`;

    try {
      const data = await adapter.fetchListing(itemId);
      if (!data) throw new Error('매물 데이터가 비어 있습니다.');
      render(data, data._warn || '');
      if (typeof Root.saveListing === 'function') await Root.saveListing(data);
      if (openOnSuccess) {
        open = true;
        shadow.getElementById('msPanel')?.classList.add('open');
      }
      return { ok: true, imageCount: data.imageUrls?.length ?? 0, platform: adapter.id };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      render(null, msg);
      latest = null;
      return { ok: false, error: msg };
    }
  }

  Root.boot = () => {
    ensureHost();
    const ad = Root.getAdapter();
    const onDetail = ad && typeof ad.isDetailPage === 'function' ? ad.isDetailPage() : false;
    const fab = shadow.getElementById('msFab');
    if (fab) fab.style.display = onDetail ? '' : 'none';
    fab?.classList.toggle('daangn', ad?.id === 'daangn');

    chrome.runtime.onMessage.addListener((msg, _s, sendResponse) => {
      if (!msg?.type) return undefined;
      (async () => {
        switch (msg.type) {
          case 'TOGGLE_PANEL':
            open = !open;
            shadow.getElementById('msPanel')?.classList.toggle('open', open);
            sendResponse({ ok: true });
            break;
          case 'REFRESH':
            sendResponse(await refresh({ openOnSuccess: true }));
            break;
          case 'GET_LISTING': {
            const r = await refresh({ openOnSuccess: false });
            if (!r?.ok || !latest) {
              sendResponse({ ok: false, error: r?.error || '매물 데이터 없음' });
              break;
            }
            sendResponse({
              ok: true,
              listing: {
                platform: latest.platform,
                platformLabel: latest.platformLabel,
                title: latest.title,
                priceLabel: latest.priceLabel,
                body: latest.body,
                imageUrls: latest.imageUrls || [],
                imageCount: latest.imageUrls?.length ?? 0,
              },
            });
            break;
          }
          case 'REFRESH_AND_SAVE':
            sendResponse(await refresh({ openOnSuccess: false }));
            break;
          case 'COLLECT_SEARCH': {
            const ad = Root.getAdapter();
            if (!ad?.isSearchPage?.()) {
              sendResponse({ ok: false, error: '검색 결과 페이지가 아닙니다.' });
              break;
            }
            const items = ad.harvestSearchListings?.() || [];
            const q =
              new URL(location.href).searchParams.get('q') ||
              new URL(location.href).searchParams.get('search') ||
              '';
            await Root.saveComps(ad.id, items, { searchUrl: location.href, query: q });
            sendResponse({ ok: true, count: items.length, platform: ad.id });
            break;
          }
          case 'GET_JSON':
            if (!latest) {
              sendResponse({ ok: false, error: '먼저 «데이터 다시 불러오기»를 실행하세요.' });
              break;
            }
            const sellerClean = latest.seller
              ? Object.fromEntries(Object.entries(latest.seller).filter(([k]) => !k.startsWith('_')))
              : null;
            sendResponse({
              ok: true,
              json: JSON.stringify(
                {
                  platform: latest.platform,
                  platformLabel: latest.platformLabel,
                  itemId: latest.itemId,
                  title: latest.title,
                  price: latest.price,
                  priceLabel: latest.priceLabel,
                  body: latest.body,
                  imageUrls: latest.imageUrls,
                  seller: sellerClean,
                  source: latest.source,
                  pageUrl: location.href,
                  exportedAt: new Date().toISOString(),
                },
                null,
                2
              ),
            });
            break;
          default:
            sendResponse({ ok: false });
        }
      })();
      return true;
    });

    let lastHref = location.href;
    setInterval(() => {
      if (location.href === lastHref) return;
      lastHref = location.href;
      open = false;
      shadow?.getElementById('msPanel')?.classList.remove('open');
      const a = Root.getAdapter();
      if (a?.isDetailPage?.()) void refresh({ openOnSuccess: false });
    }, 1000);

    if (Root.getAdapter()?.isDetailPage?.()) void refresh({ openOnSuccess: false });

    void Root.tryAutoCollectSearch?.();
  };

  Root.tryAutoCollectSearch = async () => {
    const ad = Root.getAdapter();
    if (!ad?.isSearchPage?.() || typeof ad.harvestSearchListings !== 'function') return;

    const res = await chrome.storage.local.get(['marketScrapeAutoCollect']);
    const flags = res.marketScrapeAutoCollect;
    if (!flags?.[ad.id]) return;
    if (flags.at && Date.now() - flags.at > 3 * 60 * 1000) return;

    await new Promise((r) => setTimeout(r, 1200));
    const items = ad.harvestSearchListings();
    const q =
      new URL(location.href).searchParams.get('q') ||
      new URL(location.href).searchParams.get('search') ||
      '';
    await Root.saveComps(ad.id, items, { searchUrl: location.href, query: q });
    const next = { ...flags, [ad.id]: false };
    await chrome.storage.local.set({ marketScrapeAutoCollect: next });
  };
})();
