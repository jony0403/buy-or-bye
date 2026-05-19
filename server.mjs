#!/usr/bin/env node
/**
 * 번개장터 매물 링크 → 상품 이미지 URL (로컬 전용)
 * 1) API 직접 호출 (빠름)
 * 2) 실패 시 Playwright 헤드리스 브라우저로 페이지 접속해 응답/ DOM에서 수집 (우회)
 */

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3847;

/** 시스템 Chrome 사용 (이미 깔려 있으면 Chromium 추가 다운로드 없음): CHROME_CHANNEL=chrome */
const CHROME_CHANNEL = process.env.CHROME_CHANNEL || '';

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

function extractPid(raw) {
  const s = String(raw || '').trim();
  const m = s.match(/\/products\/(\d+)/);
  if (m) return m[1];
  if (/^\d+$/.test(s)) return s;
  return null;
}

function expandImageUrls(template, count, res = '800') {
  const urls = [];
  const n = Math.min(Number(count) || 0, 50);
  for (let i = 1; i <= n; i += 1) {
    urls.push(template.replace('{cnt}', String(i)).replace('{res}', res));
  }
  return urls;
}

function productFromDetailPayload(data, pidFallback) {
  const p = data?.data?.product;
  if (!p?.imageUrl || !Number(p.imageCount)) return null;
  return {
    pid: String(p.pid ?? pidFallback),
    name: p.name ?? '',
    imageUrls: expandImageUrls(String(p.imageUrl), p.imageCount, '800'),
  };
}

async function bunjangImagesForPidViaApi(pid) {
  const url = `https://api.bunjang.co.kr/api/pms/v1/products/${pid}/detail/web`;
  const pageOrigin = `https://m.bunjang.co.kr`;
  const referer = `${pageOrigin}/products/${pid}`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      Origin: pageOrigin,
      Referer: referer,
    },
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('상품 정보를 JSON으로 파싱할 수 없습니다.');
  }
  const product = productFromDetailPayload(data, pid);
  if (!res.ok || !product) {
    throw new Error(data?.error?.message || data?.message || `API HTTP ${res.status}`);
  }
  return { ...product, source: 'api' };
}

function normalizeImgUrl(raw) {
  if (!raw) return null;
  try {
    const u = String(raw).trim().split(/[?#]/)[0];
    if (!u.includes(`media.bunjang.co.kr/product/`)) return null;
    return u.replace(/_w\d+\.(webp|jpg|jpeg|png)$/i, '_w800.$1').replace(/_w\{res\}/gi, '_w800');
  } catch {
    return null;
  }
}

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

/** API 가 막혔을 때: 실제 페이지에 들어가서 상세 JSON 또는 img 태그에서 URL 수집 */
async function bunjangImagesForPidViaBrowser(pid) {
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    throw new Error(
      'API가 거부되었고, 브라우저 폴백에는 Playwright 가 필요합니다. 폴더에서 npm install 후 npm run install-browser 를 한 번 실행하세요.'
    );
  }

  const launchOpts = { headless: true };
  if (CHROME_CHANNEL) launchOpts.channel = CHROME_CHANNEL;

  let browser;
  try {
    browser = await chromium.launch(launchOpts);
  } catch (e) {
    const hint =
      CHROME_CHANNEL === ''
        ? 'Chromium 미설치일 수 있습니다. npm run install-browser 또는 CHROME_CHANNEL=chrome 로 재시도하세요.'
        : String(e);
    throw new Error(`브라우저 실행 실패: ${hint}`);
  }

  const context = await browser.newContext({
    userAgent: UA,
    locale: 'ko-KR',
    viewport: { width: 412, height: 915 },
  });

  const page = await context.newPage();

  let capturedPayload = null;
  page.on('response', async (resp) => {
    const url = resp.url();
    if (!url.includes('api.bunjang.co.kr')) return;
    if (!url.includes(`/products/${pid}/`) || !url.includes('detail')) return;
    const ct = (resp.headers()['content-type'] || '').toLowerCase();
    if (!ct.includes('json')) return;
    if (resp.status() !== 200) return;
    try {
      const j = await resp.json();
      if (productFromDetailPayload(j, pid)) capturedPayload = j;
    } catch {
      /* ignore */
    }
  });

  await page.goto(`https://m.bunjang.co.kr/products/${pid}`, {
    waitUntil: 'networkidle',
    timeout: 60000,
  });

  /** response 핸들러의 json() 이 늦게 끝날 수 있어 잠시 대기 */
  for (let i = 0; i < 40 && !capturedPayload; i += 1) await sleep(100);

  let out = capturedPayload ? productFromDetailPayload(capturedPayload, pid) : null;

  if (!out) {
    const fromDom = await page.evaluate(() => {
      const set = new Set();
      for (const el of document.querySelectorAll('img[src]')) {
        set.add(el.getAttribute('src'));
      }
      for (const el of document.querySelectorAll('[style*="media.bunjang.co.kr"]')) {
        const m = String(el.getAttribute('style')).match(/https:\/\/media\.bunjang\.co\.kr\/product\/[^"'\\s)]+/);
        if (m) set.add(m[0]);
      }
      return [...set];
    });

    const norm = [...new Set(fromDom.map(normalizeImgUrl).filter(Boolean))];

    norm.sort((a, b) => {
      const na = Number((a.match(/product\/(\d+)_(\d+)_/) || [])[2] || 0);
      const nb = Number((b.match(/product\/(\d+)_(\d+)_/) || [])[2] || 0);
      return na - nb;
    });

    if (norm.length === 0) {
      await context.close();
      await browser.close();
      throw new Error('브라우저로도 이미지 URL을 찾지 못했습니다. 매물 번호와 네트워크를 확인해 주세요.');
    }

    out = {
      pid: String(pid),
      name:
        (await page.title()).replace(/\s*[|│].*$/, '').trim() ||
        (await page.locator('[class*="product"], h1').first().innerText().catch(() => '')) ||
        '',
      imageUrls: norm,
      source: 'browser-dom',
    };
  } else {
    out.source = 'browser-network';
    out.imageUrls = [...new Set(out.imageUrls)];
  }

  await context.close();
  await browser.close();
  return out;
}

async function bunjangImagesForPid(pid, { forceBrowser } = {}) {
  if (forceBrowser) {
    try {
      return await bunjangImagesForPidViaBrowser(pid);
    } catch (browserErr) {
      try {
        return await bunjangImagesForPidViaApi(pid);
      } catch {
        throw browserErr;
      }
    }
  }

  try {
    return await bunjangImagesForPidViaApi(pid);
  } catch (apiErr) {
    try {
      const via = await bunjangImagesForPidViaBrowser(pid);
      return { ...via, apiError: apiErr instanceof Error ? apiErr.message : String(apiErr) };
    } catch (browserErr) {
      const a = apiErr instanceof Error ? apiErr.message : String(apiErr);
      const b = browserErr instanceof Error ? browserErr.message : String(browserErr);
      throw new Error(`${a}\n→ 브라우저 폴백: ${b}`);
    }
  }
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url || '/', `http://127.0.0.1:${PORT}`);

  if (req.method === 'GET' && urlObj.pathname === '/') {
    const htmlPath = path.join(__dirname, 'index.html');
    const buf = await fs.readFile(htmlPath);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(buf);
    return;
  }

  if (req.method === 'GET' && urlObj.pathname === '/api/bunjang-images') {
    const link = urlObj.searchParams.get('url') || '';
    const pid = extractPid(link);
    const browserOnly =
      urlObj.searchParams.get('browser') === '1' ||
      urlObj.searchParams.get('mode') === 'browser';

    if (!pid) {
      sendJson(res, 400, { error: '번개장터 매물 링크(…/products/숫자) 또는 상품 번호만 입력해 주세요.' });
      return;
    }

    try {
      const data = await bunjangImagesForPid(pid, { forceBrowser: browserOnly });
      sendJson(res, 200, data);
    } catch (e) {
      sendJson(res, 502, { error: e instanceof Error ? e.message : String(e) });
    }
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`로컬 전용 페이지: http://127.0.0.1:${PORT}/`);
  console.log('API 실패 시 자동으로 헤드리스 브라우저(Playwright)로 재시도합니다.');
  console.log('Chromium 설치: npm run install-browser   또는   시스템 Chrome 사용: CHROME_CHANNEL=chrome');
  console.log('종료: Ctrl+C');
});
