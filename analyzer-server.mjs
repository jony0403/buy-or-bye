#!/usr/bin/env node
/** 로컬 가격 분석 페이지 + Gemini API 프록시 (API 키는 클라이언트가 헤더로 전달) */
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.ANALYZER_PORT) || 3920;
const ANALYZER_DIR = path.join(__dirname, 'analyzer');
const EXTENSION_ICONS_DIR = path.join(__dirname, 'extension', 'icons');
const PROMPTS_DIR = path.join(__dirname, 'prompts');

/** 번개·당근 검색창 쿼리 상한(한글 제품명+세대); clamp 시 한 어절·한 낱말 중간 절단 방지 로직과 함께 사용 */
const MAX_SEARCH_QUERY_CHARS = 96;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
};

async function loadPrompt(name) {
  return fs.readFile(path.join(PROMPTS_DIR, name), 'utf8');
}

const PROMPTS = {
  searchQuerySingle: await loadPrompt('search-query-single.txt'),
  searchQueryCandidates: await loadPrompt('search-query-candidates.txt'),
  productIdentify: await loadPrompt('product-identify.txt'),
  productSummary: await loadPrompt('product-summary.txt'),
  productRisk: await loadPrompt('product-risk.txt'),
  productRiskJson: await loadPrompt('product-risk-json.txt'),
  productRiskYoutubeComment: await loadPrompt('product-risk-youtube-comment.txt'),
  productInfoLookup: await loadPrompt('product-info-lookup.txt'),
  listingTextAnalysis: await loadPrompt('listing-text-analysis.txt'),
  comparisonFilter: await loadPrompt('comparison-filter.txt'),
  usedPriceGuide: await loadPrompt('used-price-guide.txt'),
  purchaseReceipt: await loadPrompt('purchase-receipt.txt'),
  listingImageAnalysis: await loadPrompt('listing-image-analysis.txt'),
  directAiChat: await loadPrompt('direct-ai-chat.txt'),
  sellerChatAssistant: await loadPrompt('seller-chat-assistant.txt'),
};

function renderPrompt(template, vars) {
  return String(template).replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? ''));
}

function corsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, X-Gemini-Key, X-Gemini-Model, Authorization'
  );
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function json(res, status, obj) {
  corsHeaders(res);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

/** Google Search 연동 + 사진·글 — 제품 파악 후 번개·당근용 검색어 한 줄 (브랜드/제품 예시 없음) */
function buildWebGroundedSearchQueryPrompt(title, body, imageCount) {
  const t = String(title || '').slice(0, 500);
  const b = String(body || '').replace(/\s+/g, ' ').trim().slice(0, 1200);
  const n = Number(imageCount) || 0;
  const media =
    n > 0
      ? `상품 사진 ${n}장이 이 메시지에 첨부되어 있습니다.\n`
      : '사진이 없습니다. 제목·본문과 웹 검색으로 판단하세요.\n';
  return renderPrompt(PROMPTS.searchQuerySingle, {
    media,
    title: t,
    body: b || '(없음)',
    MAX_SEARCH_QUERY_CHARS,
  });
}

/** Google Search 연동 + 사진·글 — 품질 확인/자동 선택용 검색 후보 최대 3개 */
function buildWebGroundedSearchCandidatesPrompt(title, body, imageCount, maxQueries = 3) {
  const t = String(title || '').slice(0, 500);
  const b = String(body || '').replace(/\s+/g, ' ').trim().slice(0, 1200);
  const n = Number(imageCount) || 0;
  const max = Math.min(Math.max(Number(maxQueries) || 3, 1), 3);
  const media =
    n > 0
      ? `상품 사진 ${n}장이 이 메시지에 첨부되어 있습니다.\n`
      : '사진이 없습니다. 제목·본문과 웹 검색으로 판단하세요.\n';
  return renderPrompt(PROMPTS.searchQueryCandidates, {
    media,
    max,
    title: t,
    body: b || '(없음)',
    MAX_SEARCH_QUERY_CHARS,
  });
}

function buildProductSummaryPrompt(title, body, imageCount) {
  const t = String(title || '').slice(0, 500);
  const b = String(body || '').replace(/\s+/g, ' ').trim().slice(0, 1600);
  const n = Number(imageCount) || 0;
  const media =
    n > 0
      ? `상품 사진 ${n}장이 이 메시지에 첨부되어 있습니다.\n`
      : '사진이 없습니다. 제목·본문과 웹 검색으로 판단하세요.\n';
  return renderPrompt(PROMPTS.productSummary, {
    media,
    title: t,
    body: b || '(없음)',
  });
}

function buildProductIdentifyPrompt(title, body, imageCount) {
  const t = String(title || '').slice(0, 500);
  const b = String(body || '').replace(/\s+/g, ' ').trim().slice(0, 1200);
  const n = Number(imageCount) || 0;
  const media =
    n > 0
      ? `상품 사진 ${n}장이 이 메시지에 첨부되어 있습니다.\n`
      : '사진이 없습니다. 제목·본문으로 판단하세요.\n';
  return renderPrompt(PROMPTS.productIdentify, {
    media,
    title: t,
    body: b || '(없음)',
  });
}

function buildProductRiskPrompt({ productName, summary, title, body }) {
  const name = String(productName || summary?.productName || '')
    .replace(/\s+/g, ' ')
    .trim();
  return renderPrompt(PROMPTS.productRisk, {
    productName: name || '(불명)',
    description: String(summary?.description || '').replace(/\s+/g, ' ').trim() || '(없음)',
    makerOrSeller: String(summary?.makerOrSeller || '').replace(/\s+/g, ' ').trim() || '(없음)',
    newPrice: String(summary?.newPrice || '').replace(/\s+/g, ' ').trim() || '(없음)',
    title: String(title || '').replace(/\s+/g, ' ').trim().slice(0, 500) || '(없음)',
    body: String(body || '').replace(/\s+/g, ' ').trim().slice(0, 1800) || '(없음)',
  });
}

function buildProductRiskJsonPrompt({ productName, researchText }) {
  const name = String(productName || '').replace(/\s+/g, ' ').trim();
  return renderPrompt(PROMPTS.productRiskJson, {
    productName: name || '(불명)',
    researchText: String(researchText || '').trim() || '(조사 메모 없음)',
  });
}

function buildProductRiskYoutubeCommentPrompt(payload, videos) {
  const issues = [
    ...(Array.isArray(payload.analysis?.chronicDefects) ? payload.analysis.chronicDefects : []),
    ...(Array.isArray(payload.analysis?.relatedIssues) ? payload.analysis.relatedIssues : []),
  ]
    .map((item) => `${item?.title || ''}: ${item?.detail || ''}`.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .slice(0, 6);
  return renderPrompt(PROMPTS.productRiskYoutubeComment, {
    productName:
      String(payload.productName || payload.summary?.productName || '').replace(/\s+/g, ' ').trim() || '(불명)',
    description: String(payload.summary?.description || '').replace(/\s+/g, ' ').trim() || '(없음)',
    issues: issues.length ? issues.join('\n') : '(없음)',
    videosJson: JSON.stringify(
      videos.map((video) => ({
        videoId: video.videoId,
        title: video.title,
        url: video.url,
      })),
      null,
      2
    ),
  });
}

function normalizeQueryCandidate(raw) {
  const s = String(raw || '')
    .replace(/```(?:json)?/gi, ' ')
    .replace(/```/g, ' ')
    .replace(/^[-*•\d.]+\s*/, '')
    .replace(/^["'`「」]|["'`「」]$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!s || /^json$/i.test(s) || /^[{\[]/.test(s) || /["']?queries["']?\s*:/.test(s)) return '';
  if (/^\]?\}?$/.test(s) || /^[}\]],?$/.test(s)) return '';
  return s;
}

function parseQueryCandidates(text, _title, maxQueries = 3) {
  const max = Math.min(Math.max(Number(maxQueries) || 3, 1), 3);
  const raw = String(text || '').trim();
  const candidates = [];

  let jsonText = raw
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
  const objMatch = jsonText.match(/\{[\s\S]*\}/);
  if (objMatch) jsonText = objMatch[0];
  try {
    const parsed = JSON.parse(jsonText);
    const arr = Array.isArray(parsed) ? parsed : parsed?.queries;
    if (Array.isArray(arr)) candidates.push(...arr);
  } catch {
    const queryArrayMatch = raw.match(/["']?queries["']?\s*:\s*\[([\s\S]*?)\]/i);
    if (queryArrayMatch) {
      const inner = queryArrayMatch[1];
      const quoted = [...inner.matchAll(/["']([^"']{2,120})["']/g)].map((m) => m[1]);
      candidates.push(...quoted);
    }
  }

  if (!candidates.length) {
    const lines = raw
      .replace(/```(?:json)?/gi, '\n')
      .replace(/[{}\[\]"]/g, ' ')
      .split(/\r?\n|[,，]/)
      .map((x) => x.trim())
      .filter(Boolean);
    candidates.push(...lines);
  }

  const out = [];
  const seen = new Set();
  for (const item of candidates) {
    const q = normalizeQueryCandidate(item);
    const key = q.replace(/\s+/g, '').toLowerCase();
    if (!q || seen.has(key)) continue;
    seen.add(key);
    out.push(q);
    if (out.length >= max) break;
  }

  return out;
}

const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

const MAX_INLINE_IMAGES = 3;
const LISTING_IMAGE_ANALYSIS_BATCH_SIZE = 10;
const MAX_IMAGE_BYTES = 1.2 * 1024 * 1024;
const IMAGE_FETCH_TIMEOUT_MS = 6_000;
const IMAGE_SEARCH_TIMEOUT_MS = 8_000;
const PRODUCT_IMAGE_VALIDATE_TIMEOUT_MS = 5_000;
const GEMINI_FAST_TIMEOUT_MS = 30_000;
const GEMINI_GROUNDED_TIMEOUT_MS = 75_000;
const GEMINI_PRODUCT_TIMEOUT_MS = 90_000;

function isAllowedListingImageUrl(u) {
  try {
    const x = new URL(String(u).trim());
    if (x.protocol !== 'https:' && x.protocol !== 'http:') return false;
    const host = x.hostname.toLowerCase();
    if (host === 'localhost' || host === '0.0.0.0') return false;
    if (/^(127\.|10\.|192\.168\.)/.test(host)) return false;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false;
    return true;
  } catch {
    return false;
  }
}

function refererForImageUrl(u) {
  try {
    const h = new URL(u).hostname.toLowerCase();
    if (h.includes('bunjang')) return 'https://m.bunjang.co.kr/';
    if (h.includes('daangn') || h.includes('karrot') || h.includes('gcp-karroter')) return 'https://www.daangn.com/';
    if (h.includes('joongna')) return 'https://web.joongna.com/';
    return 'https://m.bunjang.co.kr/';
  } catch {
    return 'https://m.bunjang.co.kr/';
  }
}

function optimizeImageUrlForAi(url) {
  let s = String(url || '').trim();
  try {
    const parsed = new URL(s);
    const host = parsed.hostname.toLowerCase();
    if (host.includes('joongna') && parsed.pathname.includes('/media/original/')) {
      if (!parsed.searchParams.has('w') && !parsed.searchParams.has('width') && !parsed.searchParams.has('size')) {
        parsed.searchParams.set('w', '800');
      }
      return parsed.href;
    }
  } catch {
    /* keep raw */
  }
  // 번개 이미지는 파일명에 폭이 들어오는 경우가 많아, 제품 식별에는 충분한 400px급으로 낮춘다.
  s = s.replace(/_w\d+\.(webp|jpg|jpeg|png)(?=$|[?#])/i, '_w400.$1');
  s = s.replace(/([?&](?:w|width|size)=)\d+/i, '$1400');
  return s;
}

/** Gemini REST: { inline_data: { mime_type, data: base64 } } */
async function fetchImageUrlToInlinePart(url) {
  const imageUrl = optimizeImageUrlForAi(url);
  const res = await fetch(imageUrl, {
    redirect: 'follow',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0 Safari/537.36',
      Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      Referer: refererForImageUrl(imageUrl),
    },
    signal: AbortSignal.timeout(IMAGE_FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`이미지 HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_IMAGE_BYTES) throw new Error('이미지 용량 초과');
  let mime = res.headers.get('content-type')?.split(';')[0]?.trim() || '';
  if (!mime.startsWith('image/')) {
    const p = String(imageUrl).toLowerCase();
    if (p.includes('.png')) mime = 'image/png';
    else if (p.includes('.webp')) mime = 'image/webp';
    else if (p.includes('.gif')) mime = 'image/gif';
    else mime = 'image/jpeg';
  }
  return {
    inline_data: {
      mime_type: mime,
      data: buf.toString('base64'),
    },
  };
}

function readImageDimensionsFromBuffer(buf) {
  if (!buf || buf.length < 24) return { width: 0, height: 0 };
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    if (width > 0 && height > 0 && width < 20000 && height < 20000) {
      return { width, height };
    }
  }
  for (let i = 2; i < buf.length - 9; i++) {
    if (buf[i] === 0xff && buf[i + 1] === 0xd8) return { width: 0, height: 0 };
    if (buf[i] === 0xff && (buf[i + 1] === 0xc0 || buf[i + 1] === 0xc2 || buf[i + 1] === 0xc1)) {
      const height = buf.readUInt16BE(i + 5);
      const width = buf.readUInt16BE(i + 7);
      if (width > 0 && height > 0 && width < 20000 && height < 20000) {
        return { width, height };
      }
    }
  }
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 && buf[12] === 0x56 && buf[13] === 0x50) {
    const width = buf.readUInt16LE(26) & 0x3fff;
    const height = buf.readUInt16LE(28) & 0x3fff;
    if (width > 0 && height > 0) return { width, height };
  }
  return { width: 0, height: 0 };
}

async function fetchImageUrlToInlineSource(url) {
  const imageUrl = optimizeImageUrlForAi(url);
  const res = await fetch(imageUrl, {
    redirect: 'follow',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0 Safari/537.36',
      Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      Referer: refererForImageUrl(imageUrl),
    },
    signal: AbortSignal.timeout(IMAGE_FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`이미지 HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_IMAGE_BYTES) throw new Error('이미지 용량 초과');
  let mime = res.headers.get('content-type')?.split(';')[0]?.trim() || '';
  if (!mime.startsWith('image/')) {
    const p = String(imageUrl).toLowerCase();
    if (p.includes('.png')) mime = 'image/png';
    else if (p.includes('.webp')) mime = 'image/webp';
    else if (p.includes('.gif')) mime = 'image/gif';
    else mime = 'image/jpeg';
  }
  const { width, height } = readImageDimensionsFromBuffer(buf);
  return {
    part: {
      inline_data: {
        mime_type: mime,
        data: buf.toString('base64'),
      },
    },
    width,
    height,
  };
}

function listingImageAnalysisBatches(sources) {
  const list = Array.isArray(sources) ? sources : [];
  const batches = [];
  for (let i = 0; i < list.length; i += LISTING_IMAGE_ANALYSIS_BATCH_SIZE) {
    batches.push(list.slice(i, i + LISTING_IMAGE_ANALYSIS_BATCH_SIZE));
  }
  return batches;
}

async function fetchListingImageInlineParts(urls) {
  const list = Array.isArray(urls) ? urls : [];
  const targets = [];
  for (const raw of list) {
    if (targets.length >= MAX_INLINE_IMAGES) break;
    const u = String(raw || '').trim();
    if (!u || !isAllowedListingImageUrl(u)) continue;
    targets.push(u);
  }
  const settled = await Promise.allSettled(targets.map((u) => fetchImageUrlToInlineSource(u)));
  const parts = [];
  for (let i = 0; i < settled.length; i += 1) {
    const r = settled[i];
    if (r.status === 'fulfilled') {
      parts.push(r.value.part);
      continue;
    }
    const u = targets[i] || '';
    console.warn('[search-query] 이미지 로드 생략:', u.slice(0, 80), r.reason instanceof Error ? r.reason.message : r.reason);
  }
  return parts;
}

async function fetchListingImageSources(urls, maxImages = Infinity) {
  const list = Array.isArray(urls) ? urls : [];
  const targets = [];
  const n = Number(maxImages);
  const limit = Number.isFinite(n) ? Math.max(1, n) : Infinity;
  for (let sourceIndex = 0; sourceIndex < list.length; sourceIndex += 1) {
    const raw = list[sourceIndex];
    if (targets.length >= limit) break;
    const u = String(raw || '').trim();
    if (!u || !isAllowedListingImageUrl(u)) continue;
    targets.push({ url: u, index: sourceIndex + 1 });
  }
  const settled = await Promise.allSettled(targets.map((t) => fetchImageUrlToInlineSource(t.url)));
  const sources = [];
  for (let i = 0; i < settled.length; i += 1) {
    const r = settled[i];
    const target = targets[i] || {};
    if (r.status === 'fulfilled') {
      sources.push({ ...r.value, index: target.index, url: target.url });
      continue;
    }
    const u = target.url || '';
    console.warn('[listing-image] 이미지 로드 생략:', u.slice(0, 80), r.reason instanceof Error ? r.reason.message : r.reason);
  }
  return sources;
}

function extractGeminiText(data) {
  const cand = data?.candidates?.[0];
  if (!cand) return '';
  const parts = cand.content?.parts;
  const text =
    parts?.map((p) => p.text).filter(Boolean).join('') ||
    parts?.[0]?.text ||
    '';
  if (text) return text;
  const reason = cand.finishReason || cand.finish_reason;
  if (reason && reason !== 'STOP') {
    throw new Error(`Gemini 응답 없음 (${reason})`);
  }
  return '';
}

function normalizeProductImageUrl(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  try {
    const u = new URL(s);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return '';
    return u.href;
  } catch {
    return '';
  }
}

function uniqueImageUrls(urls) {
  const out = [];
  const seen = new Set();
  for (const raw of urls || []) {
    const u = normalizeProductImageUrl(raw);
    if (!u || seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }
  return out;
}

function productImageProxyUrl(raw) {
  const u = normalizeProductImageUrl(raw);
  return u ? `/api/image-proxy?url=${encodeURIComponent(u)}` : '';
}

async function isReachableProductImage(raw) {
  const u = normalizeProductImageUrl(raw);
  if (!u) return false;
  try {
    const res = await fetch(u, {
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        Referer: new URL(u).origin,
      },
      signal: AbortSignal.timeout(PRODUCT_IMAGE_VALIDATE_TIMEOUT_MS),
    });
    if (!res.ok) return false;
    const type = res.headers.get('content-type') || '';
    if (!type.startsWith('image/')) return false;
    const len = Number(res.headers.get('content-length')) || 0;
    if (len && len < 1024) return false;
    return true;
  } catch {
    return false;
  }
}

async function fetchDuckDuckGoImageUrls(query) {
  const q = String(query || '').trim();
  if (!q) return [];
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0 Safari/537.36',
    Accept: 'text/html,application/json,*/*',
  };
  const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(q)}&iax=images&ia=images`;
  const htmlRes = await fetch(searchUrl, {
    headers,
    signal: AbortSignal.timeout(IMAGE_SEARCH_TIMEOUT_MS),
  });
  const html = await htmlRes.text();
  const vqd =
    html.match(/vqd=["']?([\d-]+)["']?/)?.[1] ||
    html.match(/'vqd'\s*:\s*'([\d-]+)'/)?.[1] ||
    '';
  if (!vqd) return [];
  const apiUrl = `https://duckduckgo.com/i.js?l=kr-kr&o=json&q=${encodeURIComponent(q)}&vqd=${encodeURIComponent(vqd)}&f=,,,&p=1`;
  const res = await fetch(apiUrl, {
    headers: { ...headers, Referer: searchUrl },
    signal: AbortSignal.timeout(IMAGE_SEARCH_TIMEOUT_MS),
  });
  if (!res.ok) return [];
  const data = await res.json().catch(() => ({}));
  const results = Array.isArray(data?.results) ? data.results : [];
  const ranked = results.map((x) => normalizeProductImageUrl(x.image || x.thumbnail)).filter(Boolean).slice(0, 12);
  const out = [];
  for (const imageUrl of ranked) {
    if (await isReachableProductImage(imageUrl)) out.push(imageUrl);
    if (out.length >= 4) break;
  }
  return uniqueImageUrls(out);
}

function cleanProductName(raw, fallback = '') {
  let s = String(raw || fallback || '')
    .replace(/```(?:json)?/gi, ' ')
    .replace(/["'`「」]/g, '')
    .replace(/\bproductName\b\s*[:：]\s*/i, '')
    .replace(/\bsearchQuery\b\s*[:：].*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  const openParen = Math.max(s.lastIndexOf('('), s.lastIndexOf('（'), s.lastIndexOf('['), s.lastIndexOf('［'));
  const closeParen = Math.max(s.lastIndexOf(')'), s.lastIndexOf('）'), s.lastIndexOf(']'), s.lastIndexOf('］'));
  if (openParen >= 0 && closeParen < openParen) s = s.slice(0, openParen).trim();
  s = s
    .replace(/[({（［\[]+\s*$/g, '')
    .replace(/\s*[,，:：]\s*$/g, '')
    .trim();
  return preserveVariantTokens(s || String(fallback || '').trim(), fallback);
}

function preserveVariantTokens(productName, fallback = '') {
  let out = String(productName || '').trim();
  const source = String(fallback || '').replace(/\s+/g, ' ').trim();
  if (!out || !source) return out;

  const protectedTokens = [
    { re: /\bOLED\b/i, token: 'OLED' },
    { re: /\bPRO\b/i, token: 'Pro' },
    { re: /\bPLUS\b/i, token: 'Plus' },
    { re: /\bMAX\b/i, token: 'Max' },
    { re: /\bLITE\b/i, token: 'Lite' },
  ];
  for (const { re, token } of protectedTokens) {
    if (re.test(source) && !re.test(out)) {
      out = `${out} ${token}`.replace(/\s+/g, ' ').trim();
    }
  }

  const sourceHasSwitch2 = /(?:스위치|switch)\s*2\b/i.test(source);
  const outputHasSwitch = /(?:스위치|switch)\b/i.test(out);
  const outputHasSwitch2 = /(?:스위치|switch)\s*2\b/i.test(out);
  if (sourceHasSwitch2 && outputHasSwitch && !outputHasSwitch2) {
    out = out
      .replace(/스위치(?!\s*2\b)/i, '스위치 2')
      .replace(/\bSwitch(?!\s*2\b)/i, 'Switch 2')
      .replace(/\s+/g, ' ')
      .trim();
  }

  return out;
}

function parseProductSummary(text, fallbackTitle) {
  const raw = String(text || '').trim();
  let jsonText = raw
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
  const objMatch = jsonText.match(/\{[\s\S]*\}/);
  if (objMatch) jsonText = objMatch[0];

  let parsed = {};
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    parsed = {};
  }

  if (!Object.keys(parsed).length && raw) {
    const keyMap = {
      productName: 'productName',
      newPrice: 'newPrice',
      description: 'description',
      makerOrSeller: 'makerOrSeller',
      searchQuery: 'searchQuery',
      searchQueries: 'searchQueries',
      newPriceSourceUrl: 'newPriceSourceUrl',
      productImageUrl: 'productImageUrl',
    };
    const keyPattern = Object.keys(keyMap).join('|');
    const re = new RegExp(`(?:^|[\\n,])\\s*["']?(${keyPattern})["']?\\s*[:：]\\s*([^\\n]+)`, 'gi');
    for (const match of raw.matchAll(re)) {
      const rawKey = Object.keys(keyMap).find((k) => k.toLowerCase() === String(match[1]).toLowerCase());
      const key = keyMap[rawKey];
      const value = String(match[2] || '')
        .replace(/^["'`「」]+|["'`「」]+$/g, '')
        .replace(/,\s*$/, '')
        .trim();
      if (key && value) parsed[key] = value;
    }
  }

  const productName = cleanProductName(parsed.productName, fallbackTitle);
  const parsedQueries = Array.isArray(parsed.searchQueries)
    ? parsed.searchQueries
    : typeof parsed.searchQueries === 'string'
      ? parsed.searchQueries.split(/\s*(?:[,，;；]|\n)\s*/g)
      : [];
  const rawAsDescription = raw
    .replace(/```(?:json)?/gi, ' ')
    .replace(
      new RegExp(
        `(?:productName|newPrice|description|makerOrSeller|searchQuery|searchQueries|newPriceSourceUrl|productImageUrl)\\s*[:：]`,
        'gi'
      ),
      ' '
    )
    .replace(/[{}[\]"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const searchQuery =
    (parsedQueries.length ? parseQueryCandidates(JSON.stringify({ queries: parsedQueries }), productName || fallbackTitle, 4)[0] : '') ||
    normalizeQueryCandidate(parsed.searchQuery) ||
    normalizeQueryCandidate(productName) ||
    normalizeQueryCandidate(fallbackTitle);
  const searchQueries = parseQueryCandidates(
    JSON.stringify({ queries: parsedQueries.length ? parsedQueries : [searchQuery] }),
    productName || fallbackTitle,
    4
  );

  return {
    productName,
    newPrice: String(parsed.newPrice || '').trim(),
    description: String(parsed.description || (!parsed.productName && rawAsDescription ? rawAsDescription.slice(0, 220) : '')).trim(),
    makerOrSeller: String(parsed.makerOrSeller || '').trim(),
    searchQuery,
    searchQueries,
    newPriceSourceUrl: normalizeProductImageUrl(parsed.newPriceSourceUrl),
    productImageUrl: normalizeProductImageUrl(parsed.productImageUrl),
  };
}

function normalizeRiskItems(items) {
  const source = Array.isArray(items) ? items : [];
  return source
    .map((item) => {
      if (typeof item === 'string') {
        return { title: item, detail: item, level: 'caution' };
      }
      const title = String(item?.title || '').replace(/\s+/g, ' ').trim();
      const detail = String(item?.detail || item?.desc || '').replace(/\s+/g, ' ').trim();
      const rawLevel = String(item?.level || 'caution').toLowerCase();
      const level = ['safe', 'caution', 'risk'].includes(rawLevel) ? rawLevel : 'caution';
      if (!title || !detail) return null;
      return { title, detail, level };
    })
    .filter(Boolean)
    .slice(0, 3);
}

function parseProductRisk(text, productName = '') {
  const raw = String(text || '').trim();
  const name = String(productName || '제품').replace(/\s+/g, ' ').trim();
  let jsonText = raw
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
  const objMatch = jsonText.match(/\{[\s\S]*\}/);
  if (objMatch) jsonText = objMatch[0];

  let parsed = {};
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    parsed = {};
  }

  const relatedIssues = normalizeRiskItems(parsed.relatedIssues);
  const chronicDefects = normalizeRiskItems(parsed.chronicDefects);
  const marketFactors = normalizeRiskItems(parsed.marketFactors).slice(0, 1);
  const purchaseChecklist = normalizeRiskItems(parsed.purchaseChecklist).slice(0, 2);
  return {
    relatedIssues,
    chronicDefects,
    marketFactors,
    purchaseChecklist,
    verdict: String(parsed.verdict || '').replace(/\s+/g, ' ').trim(),
    parseOk: Boolean(
      relatedIssues.length ||
        chronicDefects.length ||
        marketFactors.length ||
        purchaseChecklist.length ||
        parsed.verdict
    ),
  };
}

function parseYoutubeVideoId(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (host.includes('youtu.be')) return u.pathname.split('/').filter(Boolean)[0] || '';
    if (host.includes('youtube.com') && u.pathname === '/watch') return u.searchParams.get('v') || '';
    const parts = u.pathname.split('/').filter(Boolean);
    if ((parts[0] === 'shorts' || parts[0] === 'embed') && parts[1]) return parts[1];
    return '';
  } catch {
    return '';
  }
}

function isYoutubeUrl(url) {
  const id = parseYoutubeVideoId(url);
  return /^[a-zA-Z0-9_-]{11}$/.test(id);
}

function normalizeProductRiskYoutubeVideos(items) {
  const seen = new Set();
  return (Array.isArray(items) ? items : [])
    .map((video) => {
      const url = String(video?.url || '').trim();
      if (!/^https?:\/\//i.test(url) || !isYoutubeUrl(url)) return null;
      const id = parseYoutubeVideoId(url);
      if (!id || seen.has(id)) return null;
      seen.add(id);
      return {
        url: `https://www.youtube.com/watch?v=${id}`,
        title: String(video?.title || '관련 YouTube 영상').replace(/\s+/g, ' ').trim().slice(0, 90),
        thumbnailUrl: String(video?.thumbnailUrl || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`).trim(),
        summary: String(video?.summary || video?.buyerNote || video?.usedBuyerNote || '')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 180),
      };
    })
    .filter(Boolean)
    .slice(0, 3);
}

function youtubeSearchTerms(payload) {
  const productName = String(payload.productName || payload.summary?.productName || payload.title || '')
    .replace(/\s+/g, ' ')
    .trim();
  const issueTerms = [
    ...(Array.isArray(payload.analysis?.chronicDefects) ? payload.analysis.chronicDefects : []),
    ...(Array.isArray(payload.analysis?.relatedIssues) ? payload.analysis.relatedIssues : []),
  ]
    .map((item) => String(item?.title || '').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const suffixes = [
    ...issueTerms.slice(0, 2),
    '고질병',
    '결함',
    '리뷰',
    '언박싱',
  ];
  const queries = [];
  for (const suffix of suffixes) {
    const q = [productName, suffix].filter(Boolean).join(' ').trim();
    if (q) queries.push(q);
  }
  if (productName) queries.push(productName);
  const seen = new Set();
  return queries
    .map((q) => `${q} youtube`.replace(/\s+/g, ' ').trim())
    .filter((q) => {
      const key = q.toLowerCase();
      if (!q || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 7);
}

function parseYoutubeInitialVideoIds(html) {
  const ids = [];
  const seen = new Set();
  const text = String(html || '');
  for (const match of text.matchAll(/"videoId"\s*:\s*"([a-zA-Z0-9_-]{11})"/g)) {
    const id = match[1];
    if (seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
    if (ids.length >= 12) break;
  }
  return ids;
}

async function fetchYoutubeOEmbedVideo(videoId) {
  const id = parseYoutubeVideoId(`https://www.youtube.com/watch?v=${videoId}`);
  if (!id) return null;
  const url = `https://www.youtube.com/watch?v=${id}`;
  try {
    const params = new URLSearchParams({ url, format: 'json' });
    const res = await fetch(`https://www.youtube.com/oembed?${params.toString()}`, {
      signal: AbortSignal.timeout(6_000),
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0 Safari/537.36',
      },
    });
    if (res.status !== 200) return null;
    const data = await res.json();
    const title = String(data?.title || '').replace(/\s+/g, ' ').trim();
    return {
      videoId: id,
      url,
      title: title || '관련 YouTube 영상',
      thumbnailUrl: String(data?.thumbnail_url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`).trim(),
      summary: '',
    };
  } catch {
    return null;
  }
}

async function fetchYoutubeSearchVideos(query, seenIds) {
  const params = new URLSearchParams({ search_query: query });
  const res = await fetch(`https://www.youtube.com/results?${params.toString()}`, {
    redirect: 'follow',
    signal: AbortSignal.timeout(12_000),
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.7,en;q=0.6',
    },
  });
  if (!res.ok) throw new Error(`YouTube 검색 HTTP ${res.status}`);
  const html = await res.text();
  const ids = parseYoutubeInitialVideoIds(html);
  const videos = [];
  for (const id of ids) {
    if (seenIds.has(id)) continue;
    const video = await fetchYoutubeOEmbedVideo(id);
    if (!video) continue;
    seenIds.add(id);
    videos.push(video);
    if (videos.length >= 3) break;
  }
  return videos;
}

async function searchYoutubeVideosFromPage(payload) {
  const seenIds = new Set();
  const videos = [];
  const queries = youtubeSearchTerms(payload);
  const attempted = [];
  for (const query of queries) {
    attempted.push(query);
    try {
      const found = await fetchYoutubeSearchVideos(query, seenIds);
      videos.push(...found);
    } catch (e) {
      console.warn('[product-risk-youtube] YouTube 검색 실패:', query, e instanceof Error ? e.message : e);
    }
    if (videos.length >= 3) break;
  }
  return {
    videos: videos.slice(0, 3),
    search: {
      query: attempted[0] || '',
      queries: attempted,
      note: videos.length ? 'YouTube 검색 페이지에서 영상 ID를 확보하고 oEmbed로 재생 가능 여부를 확인했습니다.' : '',
    },
  };
}

async function isPlayableYoutubeUrl(url) {
  try {
    const params = new URLSearchParams({
      url: String(url || '').trim(),
      format: 'json',
    });
    const res = await fetch(`https://www.youtube.com/oembed?${params.toString()}`, {
      signal: AbortSignal.timeout(6_000),
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0 Safari/537.36',
      },
    });
    return res.status === 200;
  } catch {
    return false;
  }
}

async function filterPlayableYoutubeVideos(videos) {
  const valid = [];
  for (const video of videos) {
    if (!(await isPlayableYoutubeUrl(video.url))) continue;
    valid.push(video);
    if (valid.length >= 3) break;
  }
  return valid;
}

function parseProductRiskYoutube(text) {
  const parsed = parseJsonObject(text);
  const youtubeVideos = normalizeProductRiskYoutubeVideos(parsed.youtubeVideos);
  const youtubeSearch =
    parsed.youtubeSearch && typeof parsed.youtubeSearch === 'object'
      ? {
          query: String(parsed.youtubeSearch.query || '').replace(/\s+/g, ' ').trim(),
          note: String(parsed.youtubeSearch.note || parsed.youtubeSearch.notes || '')
            .replace(/\s+/g, ' ')
            .trim(),
        }
      : null;
  return { youtubeVideos, youtubeSearch };
}

function parseYoutubeCommentMap(text) {
  const parsed = parseJsonObject(text);
  const rows = Array.isArray(parsed.comments) ? parsed.comments : Array.isArray(parsed.youtubeVideos) ? parsed.youtubeVideos : [];
  const out = new Map();
  for (const row of rows) {
    const videoId = String(row?.videoId || row?.id || '').trim();
    const summary = String(row?.summary || row?.comment || row?.buyerNote || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 180);
    if (/^[a-zA-Z0-9_-]{11}$/.test(videoId) && summary) out.set(videoId, summary);
  }
  return out;
}

async function addYoutubeBuyerComments(apiKey, model, payload, videos) {
  if (!videos.length) return videos;
  try {
    const prompt = buildProductRiskYoutubeCommentPrompt(payload, videos);
    const rawText = await geminiGenerateFromParts(apiKey, model, [{ text: prompt }], {
      useGoogleSearch: true,
      responseMimeType: 'application/json',
      temperature: 0.25,
      maxOutputTokens: 900,
      timeoutMs: GEMINI_GROUNDED_TIMEOUT_MS,
    });
    const comments = parseYoutubeCommentMap(rawText);
    return videos.map((video) => ({
      ...video,
      summary: comments.get(video.videoId) || video.summary || '',
    }));
  } catch (e) {
    console.warn('[product-risk-youtube] 코멘트 생성 실패:', e instanceof Error ? e.message : e);
    return videos;
  }
}

function parseJsonObject(text) {
  const raw = String(text || '').trim();
  let jsonText = raw
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
  const objMatch = jsonText.match(/\{[\s\S]*\}/);
  if (objMatch) jsonText = objMatch[0];
  try {
    return JSON.parse(jsonText);
  } catch {
    return {};
  }
}

function normalizeShortList(items, limit = 3) {
  return (Array.isArray(items) ? items : [])
    .map((x) => String(x || '').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .slice(0, limit);
}

function recoverJsonStringField(text, key) {
  const match = String(text || '').match(
    new RegExp(`"${key}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`),
  );
  if (!match) return '';
  try {
    return JSON.parse(`"${match[1]}"`).replace(/\s+/g, ' ').trim();
  } catch {
    return match[1].replace(/\\"/g, '"').replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim();
  }
}

function parseListingTextAnalysis(text) {
  const parsed = parseJsonObject(text);
  const sellerVerdict = String(parsed.sellerVerdict || recoverJsonStringField(text, 'sellerVerdict'))
    .replace(/\s+/g, ' ')
    .trim();
  const bodyVerdict = String(
    parsed.bodyVerdict || parsed.body || recoverJsonStringField(text, 'bodyVerdict') || recoverJsonStringField(text, 'body'),
  )
    .replace(/\s+/g, ' ')
    .trim();
  const overall = String(parsed.overall || recoverJsonStringField(text, 'overall') || bodyVerdict)
    .replace(/\s+/g, ' ')
    .trim();
  return {
    sellerVerdict,
    bodyVerdict,
    redFlags: normalizeShortList(parsed.redFlags, 5),
    overall,
    parseOk: Boolean(sellerVerdict || bodyVerdict || overall || parsed.redFlags),
  };
}

function normalizeImageLevel(raw) {
  const level = String(raw || 'neutral').toLowerCase();
  return ['safe', 'caution', 'risk', 'neutral'].includes(level) ? level : 'neutral';
}

function cleanUpstreamErrorText(text, fallback = '외부 AI 서버 오류') {
  const raw = String(text || '').trim();
  if (!raw) return fallback;
  if (/<!doctype|<html|<title>/i.test(raw)) {
    const title = raw.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim();
    return title || fallback;
  }
  return raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 220) || fallback;
}

function normalizeImageLabel(raw, level = 'neutral') {
  const value = String(raw || '').replace(/\s+/g, ' ').trim();
  if (value) return value.slice(0, 14);
  if (level === 'risk') return '주의 사진';
  if (level === 'caution') return '확인 필요';
  if (level === 'safe') return '상태 확인';
  return '사진 근거';
}

function normalizeImageDefects(items) {
  return (Array.isArray(items) ? items : [])
    .map((defect) => {
      if (!defect || typeof defect !== 'object') return null;
      const bbox = defect.bbox || defect.bboxPercent || defect.box || defect.rect || defect.area || null;
      const gridCell = String(
        defect.gridCell ||
          defect.gridRange ||
          defect.range ||
          defect.cell ||
          (defect.startCell && defect.endCell ? `${defect.startCell}-${defect.endCell}` : '')
      )
        .replace(/\s+/g, '')
        .trim();
      const description = String(defect.description || defect.detail || defect.label || '하자 의심')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 80);
      if (!bbox && !gridCell) return null;
      const severity = normalizeImageLevel(defect.severity || defect.level || 'caution');
      return {
        gridCell,
        bbox,
        description,
        approximateSize: String(defect.approximateSize || defect.size || '')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 40),
        severity: severity === 'neutral' || severity === 'safe' ? 'caution' : severity,
        gridCols: Number(defect.gridCols) || 32,
        gridRows: Number(defect.gridRows) || 32,
      };
    })
    .filter(Boolean)
    .slice(0, 6);
}

function parseListingImageAnalysis(text, imageUrls = [], sourceMeta = []) {
  const parsed = parseJsonObject(text);
  const source = Array.isArray(parsed.images) ? parsed.images : [];
  const images = source
    .map((item, idx) => {
      const index = Math.max(1, Math.min(Number(item?.index) || idx + 1, imageUrls.length || idx + 1));
      const comment = String(item?.comment || item?.detail || '').replace(/\s+/g, ' ').trim();
      if (!comment) return null;
      const meta = sourceMeta[index - 1] || {};
      const imageWidth = Number(item?.width) || Number(meta?.width) || 0;
      const imageHeight = Number(item?.height) || Number(meta?.height) || 0;
      const level = normalizeImageLevel(item?.level);
      return {
        index,
        imageUrl: imageUrls[index - 1] || '',
        imageWidth,
        imageHeight,
        label: normalizeImageLabel(item?.label || item?.role || item?.tag, level),
        comment,
        level,
        defects: normalizeImageDefects(item?.defects),
      };
    })
    .filter(Boolean)
    .slice(0, imageUrls.length || source.length);
  return {
    images,
    overall: String(parsed.overall || '').replace(/\s+/g, ' ').trim(),
    parseOk: Boolean(images.length || parsed.overall),
  };
}

/** @param {object[]} parts Gemini user message parts: { text } 또는 { inline_data } */
async function geminiGenerateFromParts(apiKey, model, parts, opts = {}) {
  const m = String(model || DEFAULT_GEMINI_MODEL).replace(/^\s+|\s+$/g, '');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    m
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const temperature = opts.temperature ?? 0.2;
  const payload = {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature,
    },
  };
  if (opts.maxOutputTokens != null) {
    payload.generationConfig.maxOutputTokens = opts.maxOutputTokens;
  }
  if (opts.responseMimeType) {
    payload.generationConfig.responseMimeType = opts.responseMimeType;
  }
  if (opts.useGoogleSearch) {
    payload.tools = [{ google_search: {} }];
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(opts.timeoutMs || GEMINI_FAST_TIMEOUT_MS),
  });
  const raw = await res.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(cleanUpstreamErrorText(raw, `Gemini HTTP ${res.status}`));
  }
  if (!res.ok) {
    const msg = data?.error?.message || data?.message || JSON.stringify(data).slice(0, 200);
    throw new Error(cleanUpstreamErrorText(msg, `Gemini HTTP ${res.status}`));
  }
  const text = extractGeminiText(data);
  if (!text) throw new Error('Gemini 응답에 텍스트가 없습니다.');
  return text;
}

async function runWebGroundedSearchQuery(apiKey, model, title, body, inlineParts) {
  const prompt = buildWebGroundedSearchQueryPrompt(title, body, inlineParts.length);
  const parts =
    inlineParts.length > 0 ? [{ text: prompt }, ...inlineParts] : [{ text: prompt }];

  try {
    const fastText = await geminiGenerateFromParts(apiKey, model, parts, {
      temperature: 0.2,
      maxOutputTokens: 160,
      timeoutMs: GEMINI_FAST_TIMEOUT_MS,
    });
    if (normalizeQueryCandidate(fastText)) return { text: fastText, pipeline: 'multimodal_fast' };
  } catch (e) {
    console.warn('[search-query] 빠른 멀티모달 실패, Google Search 재시도:', e instanceof Error ? e.message : e);
  }

  const text = await geminiGenerateFromParts(apiKey, model, parts, {
    useGoogleSearch: true,
    temperature: 0.2,
    maxOutputTokens: 256,
    timeoutMs: GEMINI_GROUNDED_TIMEOUT_MS,
  });
  return { text, pipeline: 'google_search_fallback' };
}

async function runWebGroundedSearchCandidates(apiKey, model, title, body, inlineParts, maxQueries = 3) {
  const prompt = buildWebGroundedSearchCandidatesPrompt(title, body, inlineParts.length, maxQueries);
  const parts =
    inlineParts.length > 0 ? [{ text: prompt }, ...inlineParts] : [{ text: prompt }];

  try {
    const fastText = await geminiGenerateFromParts(apiKey, model, parts, {
      temperature: 0.25,
      maxOutputTokens: 220,
      timeoutMs: GEMINI_FAST_TIMEOUT_MS,
    });
    if (parseQueryCandidates(fastText, title, maxQueries).length) {
      return { text: fastText, pipeline: 'multimodal_candidates_fast' };
    }
  } catch (e) {
    console.warn(
      '[search-query] 빠른 후보 멀티모달 실패, Google Search 재시도:',
      e instanceof Error ? e.message : e
    );
  }

  const text = await geminiGenerateFromParts(apiKey, model, parts, {
    useGoogleSearch: true,
    temperature: 0.25,
    maxOutputTokens: 320,
    timeoutMs: GEMINI_GROUNDED_TIMEOUT_MS,
  });
  return { text, pipeline: 'google_search_candidates_fallback' };
}

async function runProductSummary(apiKey, model, title, body, inlineParts) {
  const prompt = buildProductSummaryPrompt(title, body, inlineParts.length);
  const parts =
    inlineParts.length > 0 ? [{ text: prompt }, ...inlineParts] : [{ text: prompt }];
  const text = await geminiGenerateFromParts(apiKey, model, parts, {
    useGoogleSearch: true,
    temperature: 0.2,
    maxOutputTokens: 520,
    timeoutMs: GEMINI_GROUNDED_TIMEOUT_MS,
  });
  return text;
}

async function runProductIdentify(apiKey, model, title, body, inlineParts) {
  const prompt = buildProductIdentifyPrompt(title, body, inlineParts.length);
  const parts =
    inlineParts.length > 0 ? [{ text: prompt }, ...inlineParts] : [{ text: prompt }];
  return geminiGenerateFromParts(apiKey, model, parts, {
    useGoogleSearch: true,
    temperature: 0.05,
    timeoutMs: GEMINI_PRODUCT_TIMEOUT_MS,
  });
}

async function runProductInfoLookup(apiKey, model, productName) {
  const name = String(productName || '').trim();
  if (!name) return '';
  const prompt = renderPrompt(PROMPTS.productInfoLookup, { productName: name });
  return geminiGenerateFromParts(apiKey, model, [{ text: prompt }], {
    useGoogleSearch: true,
    temperature: 0.15,
    timeoutMs: GEMINI_PRODUCT_TIMEOUT_MS,
  });
}

async function runProductRiskAnalysis(apiKey, model, payload) {
  const researchPrompt = buildProductRiskPrompt(payload);
  const researchText = await geminiGenerateFromParts(apiKey, model, [{ text: researchPrompt }], {
    useGoogleSearch: true,
    temperature: 0.35,
    maxOutputTokens: 2200,
    timeoutMs: GEMINI_GROUNDED_TIMEOUT_MS,
  });
  const jsonPrompt = buildProductRiskJsonPrompt({
    productName: payload.productName,
    researchText,
  });
  const jsonText = await geminiGenerateFromParts(apiKey, model, [{ text: jsonPrompt }], {
    responseMimeType: 'application/json',
    temperature: 0.05,
    maxOutputTokens: 1400,
    timeoutMs: GEMINI_FAST_TIMEOUT_MS,
  });
  return { researchText, jsonText };
}

async function runProductRiskYoutube(apiKey, model, payload) {
  const searched = await searchYoutubeVideosFromPage(payload);
  const youtubeVideos = await addYoutubeBuyerComments(apiKey, model, payload, searched.videos);
  return {
    youtubeVideos,
    youtubeSearch: {
      ...searched.search,
      source: 'youtube_search_page_oembed',
      fetchedCount: searched.videos.length,
      commentedCount: youtubeVideos.filter((video) => video.summary).length,
    },
    rawText: JSON.stringify({ youtubeVideos, youtubeSearch: searched.search }),
  };
}

async function runListingTextAnalysis(apiKey, model, payload) {
  const prompt = renderPrompt(PROMPTS.listingTextAnalysis, {
    productName: payload.productName || '',
    summaryJson: JSON.stringify(payload.summary || null),
    riskAnalysisJson: JSON.stringify(payload.riskAnalysis || null),
    title: payload.title || '',
    priceLabel: payload.priceLabel || '',
    shippingFeeLabel: payload.shippingFeeLabel || '',
    sellerJson: JSON.stringify(payload.seller || null),
    body: String(payload.body || '').slice(0, 6000),
  });
  return geminiGenerateFromParts(apiKey, model, [{ text: prompt }], {
    responseMimeType: 'application/json',
    temperature: 0.18,
    maxOutputTokens: 1600,
    timeoutMs: GEMINI_GROUNDED_TIMEOUT_MS,
  });
}

async function runComparisonFilter(apiKey, model, payload) {
  const candidates = (Array.isArray(payload.candidates) ? payload.candidates : [])
    .slice(0, 16)
    .map((item, index) => ({
      index,
      key: String(item.key || item.url || `${item.platform || ''}:${item.itemId || index}`),
      platform: item.platformLabel || item.platform || '',
      title: item.title || '',
      priceLabel: item.priceLabel || '',
      url: item.url || '',
      saleStatus: item.saleStatus || '',
      query: item.query || '',
    }));
  const prompt = renderPrompt(PROMPTS.comparisonFilter, {
    productName: payload.productName || '',
    title: payload.title || '',
    body: String(payload.body || '').replace(/\s+/g, ' ').slice(0, 800),
    summaryJson: JSON.stringify(payload.summary || null),
    candidatesJson: JSON.stringify(candidates),
  });
  return geminiGenerateFromParts(apiKey, model, [{ text: prompt }], {
    responseMimeType: 'application/json',
    temperature: 0.05,
    maxOutputTokens: 1200,
    timeoutMs: GEMINI_FAST_TIMEOUT_MS,
  });
}

function parseComparisonFilter(text) {
  const parsed = parseJsonObject(text);
  const matches = Array.isArray(parsed.matches)
    ? parsed.matches
        .map((item) => ({
          key: String(item?.key || '').trim(),
          reason: String(item?.reason || '').replace(/\s+/g, ' ').trim(),
        }))
        .filter((item) => item.key)
    : [];
  return {
    matches,
    rejected: Array.isArray(parsed.rejected) ? parsed.rejected : [],
    parseOk: Array.isArray(parsed.matches),
  };
}

function normalizeConditionPrices(items) {
  return (Array.isArray(items) ? items : [])
    .map((item) => ({
      condition: String(item?.condition || '').replace(/\s+/g, ' ').trim(),
      priceLabel: String(item?.priceLabel || '').replace(/\s+/g, ' ').trim(),
      comment: String(item?.comment || '').replace(/\s+/g, ' ').trim(),
    }))
    .filter((item) => item.condition || item.priceLabel || item.comment)
    .slice(0, 6);
}

function parseUsedPriceGuide(text) {
  const parsed = parseJsonObject(text);
  return {
    headline: String(parsed.headline || recoverJsonStringField(text, 'headline') || '상태별 중고 가격 참고표')
      .replace(/\s+/g, ' ')
      .trim(),
    summary: String(parsed.summary || recoverJsonStringField(text, 'summary') || '')
      .replace(/\s+/g, ' ')
      .trim(),
    conditionPrices: normalizeConditionPrices(parsed.conditionPrices),
    currentAssessment: String(parsed.currentAssessment || recoverJsonStringField(text, 'currentAssessment') || '')
      .replace(/\s+/g, ' ')
      .trim(),
    recommendedAction: String(parsed.recommendedAction || recoverJsonStringField(text, 'recommendedAction') || '')
      .replace(/\s+/g, ' ')
      .trim(),
    confidence: String(parsed.confidence || recoverJsonStringField(text, 'confidence') || '낮음')
      .replace(/\s+/g, ' ')
      .trim(),
    sourceNote: String(parsed.sourceNote || recoverJsonStringField(text, 'sourceNote') || '')
      .replace(/\s+/g, ' ')
      .trim(),
    parseOk: Boolean(Object.keys(parsed).length),
  };
}

async function runUsedPriceGuide(apiKey, model, payload) {
  const prompt = renderPrompt(PROMPTS.usedPriceGuide, {
    currentJson: JSON.stringify(payload.current || null),
    summaryJson: JSON.stringify(payload.summary || null),
    comparisonJson: JSON.stringify(payload.comparison || null),
  });
  return geminiGenerateFromParts(apiKey, model, [{ text: prompt }], {
    useGoogleSearch: true,
    temperature: 0.2,
    maxOutputTokens: 2200,
    timeoutMs: GEMINI_GROUNDED_TIMEOUT_MS,
  });
}

function normalizeReceiptList(items, limit = 4) {
  return (Array.isArray(items) ? items : [])
    .map((x) => String(x || '').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .slice(0, limit);
}

function parsePurchaseReceipt(text) {
  const parsed = parseJsonObject(text);
  const verdict = String(parsed.verdict || 'hold').toLowerCase();
  return {
    verdict: ['buy', 'negotiate', 'hold', 'pass'].includes(verdict) ? verdict : 'hold',
    headline: String(parsed.headline || recoverJsonStringField(text, 'headline') || '구매 판단 보류')
      .replace(/\s+/g, ' ')
      .trim(),
    summary: String(parsed.summary || recoverJsonStringField(text, 'summary') || '')
      .replace(/\s+/g, ' ')
      .trim(),
    fairPriceLabel: String(parsed.fairPriceLabel || recoverJsonStringField(text, 'fairPriceLabel') || '')
      .replace(/\s+/g, ' ')
      .trim(),
    negotiationPriceLabel: String(parsed.negotiationPriceLabel || recoverJsonStringField(text, 'negotiationPriceLabel') || '')
      .replace(/\s+/g, ' ')
      .trim(),
    maxBuyPriceLabel: String(parsed.maxBuyPriceLabel || recoverJsonStringField(text, 'maxBuyPriceLabel') || '')
      .replace(/\s+/g, ' ')
      .trim(),
    priceReason: String(parsed.priceReason || recoverJsonStringField(text, 'priceReason') || '')
      .replace(/\s+/g, ' ')
      .trim(),
    riskBalance: String(parsed.riskBalance || recoverJsonStringField(text, 'riskBalance') || '')
      .replace(/\s+/g, ' ')
      .trim(),
    positives: normalizeReceiptList(parsed.positives, 4),
    cautions: normalizeReceiptList(parsed.cautions, 4),
    disclaimer:
      String(parsed.disclaimer || recoverJsonStringField(text, 'disclaimer') || '').replace(/\s+/g, ' ').trim() ||
      '이 영수증은 AI가 제한된 화면 정보와 수집된 비교 매물을 바탕으로 만든 참고 의견입니다. 가격은 감정가나 확정 기준이 아니라 구매 판단용 참고자료이며, 실제 하자·구성품·거래 조건은 직접 확인해야 합니다.',
    parseOk: Boolean(Object.keys(parsed).length),
  };
}

function applyComparisonReliabilityToReceipt(receipt, comparison = {}, usedPriceGuide = null) {
  if (usedPriceGuide?.headline || usedPriceGuide?.summary || Array.isArray(usedPriceGuide?.conditionPrices)) return receipt;
  const matchedCount = Number(comparison?.matchedCount) || 0;
  const pricedSampleCount = Number(comparison?.pricedSampleCount) || 0;
  const minCount = Number(comparison?.minReliableMatchedCount) || 5;
  const reliable = comparison?.isPriceReliable !== false && pricedSampleCount >= minCount;
  if (reliable) return receipt;

  const reason = '같은 제품으로 판별된 비교 매물의 가격 표본이 부족해 가격은 제한적인 참고자료로만 볼 수 있습니다.';
  return {
    ...receipt,
    verdict: receipt.verdict === 'pass' ? 'pass' : 'hold',
    fairPriceLabel: '가격 참고 제한',
    negotiationPriceLabel: '표본 부족',
    maxBuyPriceLabel: '표본 부족',
    priceReason: receipt.priceReason ? `${reason} ${receipt.priceReason}` : reason,
    summary: receipt.summary ? `${receipt.summary} 다만 ${reason}` : reason,
    cautions: normalizeReceiptList([reason, ...(receipt.cautions || [])], 4),
    disclaimer:
      receipt.disclaimer ||
      '비교 표본이 부족해 가격과 네고가는 제한적인 참고자료로만 볼 수 있습니다. 이 영수증은 AI 참고 의견이며 실제 거래 조건은 직접 확인해야 합니다.',
  };
}

async function runPurchaseReceipt(apiKey, model, payload) {
  const current = payload.current || {};
  const summary = payload.summary || null;
  const riskAnalysis = payload.riskAnalysis || null;
  const listingTextAnalysis = payload.listingTextAnalysis || null;
  const listingImageAnalysis = payload.listingImageAnalysis || null;
  const usedPriceGuide = payload.usedPriceGuide || null;
  const comparison = payload.comparison || {};
  const prompt = renderPrompt(PROMPTS.purchaseReceipt, {
    currentJson: JSON.stringify(current),
    summaryJson: JSON.stringify(summary),
    riskAnalysisJson: JSON.stringify(riskAnalysis),
    listingTextAnalysisJson: JSON.stringify(listingTextAnalysis),
    listingImageAnalysisJson: JSON.stringify(listingImageAnalysis),
    usedPriceGuideJson: JSON.stringify(usedPriceGuide),
    comparisonJson: JSON.stringify(comparison),
  });
  return geminiGenerateFromParts(apiKey, model, [{ text: prompt }], {
    responseMimeType: 'application/json',
    temperature: 0.18,
    maxOutputTokens: 2200,
    timeoutMs: GEMINI_GROUNDED_TIMEOUT_MS,
  });
}

async function runListingImageAnalysis(apiKey, model, payload, sources) {
  const list = Array.isArray(sources) ? sources : [];
  const inlineParts = list.map((s) => s?.part).filter(Boolean);
  const imageCount = inlineParts.length;
  const sizeLines = list
    .map((s, i) => {
      const w = Number(s?.width) || 0;
      const h = Number(s?.height) || 0;
      const index = Number(s?.index) || i + 1;
      if (w > 0 && h > 0) return `${index}번 사진: ${w}×${h}px (첨부 순서 ${i + 1}번째 이미지)`;
      return `${index}번 사진: 해상도 미확인 (첨부 순서 ${i + 1}번째 이미지)`;
    })
    .join('\n');
  const prompt = renderPrompt(PROMPTS.listingImageAnalysis, {
    imageCount,
    productName: payload.productName || '',
    title: payload.title || '',
    body: String(payload.body || '').slice(0, 1800),
    sizeLines,
  });
  return geminiGenerateFromParts(apiKey, model, [{ text: prompt }, ...inlineParts], {
    responseMimeType: 'application/json',
    temperature: 0.15,
    maxOutputTokens: 4096,
    timeoutMs: GEMINI_GROUNDED_TIMEOUT_MS,
  });
}

async function runDirectAiChat(apiKey, model, prompt) {
  const plainTextPrompt = renderPrompt(PROMPTS.directAiChat, { prompt: prompt || '' });
  return geminiGenerateFromParts(apiKey, model, [{ text: plainTextPrompt }], {
    useGoogleSearch: true,
    temperature: 0.35,
    timeoutMs: GEMINI_GROUNDED_TIMEOUT_MS,
  });
}

function buildSellerChatAssistantPrompt(payload) {
  return renderPrompt(PROMPTS.sellerChatAssistant, {
    mode: String(payload.mode || 'first'),
    tone: String(payload.tone || 'polite'),
    toneLabel: String(payload.toneLabel || ''),
    toneNote: String(payload.toneNote || '').trim() || '(없음)',
    userText: String(payload.message || payload.userText || '').trim() || '(없음)',
    chatHistoryJson: JSON.stringify(Array.isArray(payload.chatHistory) ? payload.chatHistory : []),
    listingJson: JSON.stringify(payload.listing || null),
    summaryJson: JSON.stringify(payload.summary || null),
    riskAnalysisJson: JSON.stringify(payload.riskAnalysis || null),
    listingTextAnalysisJson: JSON.stringify(payload.listingTextAnalysis || null),
    listingImageAnalysisJson: JSON.stringify(payload.listingImageAnalysis || null),
    usedPriceGuideJson: JSON.stringify(payload.usedPriceGuide || null),
    receiptJson: JSON.stringify(payload.receipt || null),
    comparisonJson: JSON.stringify(payload.comparison || null),
  });
}

function parseSellerChatAssistant(text) {
  const parsed = parseJsonObject(text);
  return {
    primary: String(parsed.primary || parsed.message || parsed.answer || '').replace(/\s+/g, ' ').trim(),
    alternatives: normalizeShortList(parsed.alternatives, 5),
    followUps: normalizeShortList(parsed.followUps, 3),
    quickReplies: normalizeShortList(parsed.quickReplies, 4),
    summary: String(parsed.summary || '').replace(/\s+/g, ' ').trim(),
    parseOk: Boolean(parsed.primary || parsed.message || parsed.answer),
  };
}

/** API 키 유효성 + 선택 모델 사용 가능 여부 (REST models 목록) */
async function verifyGeminiApiKey(apiKey, modelId) {
  const key = String(apiKey || '').trim();
  if (!key) throw new Error('API 키가 비었습니다.');
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`;
  const res = await fetch(url);
  const raw = await res.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(raw.slice(0, 200) || `HTTP ${res.status}`);
  }
  if (!res.ok) {
    const msg = data?.error?.message || data?.message || JSON.stringify(data).slice(0, 200);
    throw new Error(msg);
  }
  const models = data?.models || [];
  if (!models.length) throw new Error('모델 목록을 가져오지 못했습니다. API 키를 확인하세요.');
  const mid = String(modelId || DEFAULT_GEMINI_MODEL).trim();
  const okModel = models.some((m) => {
    const name = m?.name || '';
    return name === `models/${mid}` || name.endsWith(`/${mid}`);
  });
  if (!okModel) {
    const sample = models
      .slice(0, 8)
      .map((m) => m.name?.replace(/^models\//, ''))
      .filter(Boolean)
      .join(', ');
    throw new Error(
      `선택한 모델「${mid}」을(를) 이 API 키로 사용할 수 없습니다. 목록에 있는지 확인하세요. (예: ${sample || '—'})`
    );
  }
  return { ok: true, model: mid };
}

const server = http.createServer(async (req, res) => {
  const host = req.headers.host || `127.0.0.1:${PORT}`;
  const url = new URL(req.url || '/', `http://${host}`);

  if (req.method === 'OPTIONS') {
    corsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/verify-gemini') {
    try {
      const apiKey =
        req.headers['x-gemini-key'] ||
        (req.headers.authorization && req.headers.authorization.replace(/^Bearer\s+/i, '')) ||
        '';
      const model = req.headers['x-gemini-model'] || DEFAULT_GEMINI_MODEL;
      if (!String(apiKey).trim()) {
        json(res, 400, { ok: false, error: 'X-Gemini-Key 헤더가 필요합니다.' });
        return;
      }
      const result = await verifyGeminiApiKey(apiKey, model);
      json(res, 200, { ok: true, model: result.model });
    } catch (e) {
      json(res, 401, { ok: false, error: e instanceof Error ? e.message : String(e) });
    }
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/search-query') {
    try {
      const apiKey =
        req.headers['x-gemini-key'] ||
        (req.headers.authorization && req.headers.authorization.replace(/^Bearer\s+/i, '')) ||
        '';
      const model = req.headers['x-gemini-model'] || DEFAULT_GEMINI_MODEL;
      if (!String(apiKey).trim()) {
        json(res, 400, { error: 'X-Gemini-Key 헤더 또는 Authorization: Bearer 가 필요합니다.' });
        return;
      }
      const bodyRaw = await readBody(req);
      let body;
      try {
        body = JSON.parse(bodyRaw || '{}');
      } catch {
        json(res, 400, { error: 'JSON 본문이 올바르지 않습니다.' });
        return;
      }
      const imageUrls = body.imageUrls;
      const inlineParts = await fetchListingImageInlineParts(imageUrls);

      const maxQueries = Math.min(Math.max(Number(body.maxQueries) || 1, 1), 3);
      if (maxQueries > 1) {
        const { text: rawCandidates, pipeline } = await runWebGroundedSearchCandidates(
          apiKey,
          model,
          body.title,
          body.body || '',
          inlineParts,
          maxQueries
        );
        const queries = parseQueryCandidates(rawCandidates, body.title, maxQueries);
        json(res, 200, {
          query: queries[0] || '',
          queries,
          model,
          usedImages: inlineParts.length,
          pipeline,
        });
        return;
      }

      const { text: rawOut, pipeline } = await runWebGroundedSearchQuery(
        apiKey,
        model,
        body.title,
        body.body || '',
        inlineParts
      );
      const query = normalizeQueryCandidate(rawOut);

      json(res, 200, {
        query,
        model,
        usedImages: inlineParts.length,
        pipeline,
      });
    } catch (e) {
      json(res, 502, { error: e instanceof Error ? e.message : String(e) });
    }
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/product-summary') {
    try {
      const apiKey =
        req.headers['x-gemini-key'] ||
        (req.headers.authorization && req.headers.authorization.replace(/^Bearer\s+/i, '')) ||
        '';
      const model = req.headers['x-gemini-model'] || DEFAULT_GEMINI_MODEL;
      if (!String(apiKey).trim()) {
        json(res, 400, { error: 'X-Gemini-Key 헤더 또는 Authorization: Bearer 가 필요합니다.' });
        return;
      }
      const bodyRaw = await readBody(req);
      let body;
      try {
        body = JSON.parse(bodyRaw || '{}');
      } catch {
        json(res, 400, { error: 'JSON 본문이 올바르지 않습니다.' });
        return;
      }
      const inlineParts = await fetchListingImageInlineParts(body.imageUrls);
      const rawIdentify = await runProductIdentify(
        apiKey,
        model,
        body.title,
        body.body || '',
        inlineParts
      );
      const identity = parseProductSummary(rawIdentify, body.title);
      let summary = {
        productName: cleanProductName(identity.productName, body.title),
        newPrice: '',
        newPriceSourceUrl: '',
        description: '',
        makerOrSeller: '',
        searchQuery: identity.searchQuery || normalizeQueryCandidate(identity.productName),
        searchQueries: parseQueryCandidates(
          JSON.stringify({ queries: [identity.searchQuery || identity.productName] }),
          body.title,
          4
        ),
        productImageUrl: '',
      };
      try {
        const detailOut = await runProductInfoLookup(apiKey, model, summary.productName);
        const detail = parseProductSummary(detailOut, summary.productName);
        summary = {
          productName: cleanProductName(detail.productName, summary.productName),
          newPrice: detail.newPrice || '',
          newPriceSourceUrl: detail.newPriceSourceUrl || summary.newPriceSourceUrl || '',
          description: detail.description || '',
          makerOrSeller: detail.makerOrSeller || '',
          searchQuery: detail.searchQuery || summary.searchQuery,
          searchQueries: detail.searchQueries?.length ? detail.searchQueries : summary.searchQueries,
          productImageUrl: '',
        };
      } catch (e) {
        throw new Error(`제품 식별은 됐지만 상세 정보 조회에 실패했습니다: ${e instanceof Error ? e.message : e}`);
      }
      json(res, 200, {
        summary,
        model,
        usedImages: inlineParts.length,
        pipeline: 'identify_then_google_search_lookup',
      });
    } catch (e) {
      json(res, 502, { error: e instanceof Error ? e.message : String(e) });
    }
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/product-risk') {
    try {
      const apiKey =
        req.headers['x-gemini-key'] ||
        (req.headers.authorization && req.headers.authorization.replace(/^Bearer\s+/i, '')) ||
        '';
      const model = req.headers['x-gemini-model'] || DEFAULT_GEMINI_MODEL;
      if (!String(apiKey).trim()) {
        json(res, 400, { error: 'X-Gemini-Key 헤더 또는 Authorization: Bearer 가 필요합니다.' });
        return;
      }
      const bodyRaw = await readBody(req);
      let body;
      try {
        body = JSON.parse(bodyRaw || '{}');
      } catch {
        json(res, 400, { error: 'JSON 본문이 올바르지 않습니다.' });
        return;
      }
      const productName = cleanProductName(body.productName || body.summary?.productName, body.title);
      const rawOut = await runProductRiskAnalysis(apiKey, model, {
        productName,
        summary: body.summary || null,
        title: body.title || '',
        body: body.body || '',
      });
      json(res, 200, {
        analysis: parseProductRisk(rawOut.jsonText, productName),
        researchText: rawOut.researchText,
        model,
        pipeline: 'gemini_google_search_product_risk_research_then_json',
      });
    } catch (e) {
      json(res, 502, { error: e instanceof Error ? e.message : String(e) });
    }
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/product-risk-youtube') {
    try {
      const apiKey =
        req.headers['x-gemini-key'] ||
        (req.headers.authorization && req.headers.authorization.replace(/^Bearer\s+/i, '')) ||
        '';
      const model = req.headers['x-gemini-model'] || DEFAULT_GEMINI_MODEL;
      if (!String(apiKey).trim()) {
        json(res, 400, { error: 'X-Gemini-Key 헤더 또는 Authorization: Bearer 가 필요합니다.' });
        return;
      }
      const bodyRaw = await readBody(req);
      let body;
      try {
        body = JSON.parse(bodyRaw || '{}');
      } catch {
        json(res, 400, { error: 'JSON 본문이 올바르지 않습니다.' });
        return;
      }
      const productName = cleanProductName(body.productName || body.summary?.productName, body.title);
      const result = await runProductRiskYoutube(apiKey, model, {
        productName,
        summary: body.summary || null,
        analysis: body.analysis || null,
        title: body.title || '',
        body: body.body || '',
      });
      json(res, 200, {
        youtubeVideos: result.youtubeVideos,
        youtubeSearch: result.youtubeSearch,
        rawText: result.rawText,
        model,
        pipeline: 'gemini_google_search_product_risk_youtube',
      });
    } catch (e) {
      json(res, 502, { error: e instanceof Error ? e.message : String(e) });
    }
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/listing-text-analysis') {
    try {
      const apiKey =
        req.headers['x-gemini-key'] ||
        (req.headers.authorization && req.headers.authorization.replace(/^Bearer\s+/i, '')) ||
        '';
      const model = req.headers['x-gemini-model'] || DEFAULT_GEMINI_MODEL;
      if (!String(apiKey).trim()) {
        json(res, 400, { error: 'X-Gemini-Key 헤더 또는 Authorization: Bearer 가 필요합니다.' });
        return;
      }
      const bodyRaw = await readBody(req);
      let body;
      try {
        body = JSON.parse(bodyRaw || '{}');
      } catch {
        json(res, 400, { error: 'JSON 본문이 올바르지 않습니다.' });
        return;
      }
      const productName = cleanProductName(body.productName || body.summary?.productName, body.title);
      const rawOut = await runListingTextAnalysis(apiKey, model, {
        productName,
        title: body.title || '',
        body: body.body || '',
        priceLabel: body.priceLabel || '',
        shippingFeeLabel: body.shippingFeeLabel || '',
        seller: body.seller || null,
        summary: body.summary || null,
        riskAnalysis: body.riskAnalysis || null,
      });
      json(res, 200, {
        analysis: parseListingTextAnalysis(rawOut),
        rawText: rawOut,
        model,
        pipeline: 'gemini_listing_text_analysis_json',
      });
    } catch (e) {
      json(res, 502, { error: e instanceof Error ? e.message : String(e) });
    }
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/listing-image-analysis') {
    try {
      const apiKey =
        req.headers['x-gemini-key'] ||
        (req.headers.authorization && req.headers.authorization.replace(/^Bearer\s+/i, '')) ||
        '';
      const model = req.headers['x-gemini-model'] || DEFAULT_GEMINI_MODEL;
      if (!String(apiKey).trim()) {
        json(res, 400, { error: 'X-Gemini-Key 헤더 또는 Authorization: Bearer 가 필요합니다.' });
        return;
      }
      const bodyRaw = await readBody(req);
      let body;
      try {
        body = JSON.parse(bodyRaw || '{}');
      } catch {
        json(res, 400, { error: 'JSON 본문이 올바르지 않습니다.' });
        return;
      }
      const imageUrls = Array.isArray(body.imageUrls) ? body.imageUrls : [];
      const imageSources = await fetchListingImageSources(imageUrls);
      const inlineParts = imageSources.map((s) => s.part);
      if (!inlineParts.length) {
        json(res, 200, {
          analysis: {
            images: [],
            overall: '분석할 수 있는 매물 사진을 불러오지 못했습니다.',
            parseOk: true,
          },
          model,
          usedImages: 0,
          pipeline: 'gemini_listing_image_analysis_json',
        });
        return;
      }
      const productName = cleanProductName(body.productName, body.title);
      const payloadForImageAnalysis = {
        productName,
        title: body.title || '',
        body: body.body || '',
      };
      const batches = listingImageAnalysisBatches(imageSources);
      const rawOutputs = await Promise.all(
        batches.map((batch) => runListingImageAnalysis(apiKey, model, payloadForImageAnalysis, batch))
      );
      const sourceMeta = [];
      for (const s of imageSources) {
        if (Number(s?.index) > 0) sourceMeta[Number(s.index) - 1] = { width: s.width, height: s.height };
      }
      const parsedBatches = rawOutputs.map((rawOut) => parseListingImageAnalysis(rawOut, imageUrls, sourceMeta));
      const imageByIndex = new Map();
      for (const img of parsedBatches.flatMap((p) => (Array.isArray(p.images) ? p.images : []))) {
        const idx = Number(img?.index) || 0;
        if (idx > 0 && !imageByIndex.has(idx)) imageByIndex.set(idx, img);
      }
      const loadedIndexSet = new Set(imageSources.map((s) => Number(s?.index) || 0).filter(Boolean));
      for (const s of imageSources) {
        const idx = Number(s?.index) || 0;
        if (!idx || imageByIndex.has(idx)) continue;
        imageByIndex.set(idx, {
          index: idx,
          imageUrl: imageUrls[idx - 1] || s.url || '',
          imageWidth: Number(s.width) || 0,
          imageHeight: Number(s.height) || 0,
          label: '추가 사진',
          comment: 'AI가 이 사진에 대한 개별 코멘트를 반환하지 않았습니다. 원본 매물 사진으로 함께 확인하세요.',
          level: 'neutral',
        });
      }
      for (let i = 0; i < imageUrls.length; i += 1) {
        const idx = i + 1;
        if (imageByIndex.has(idx)) continue;
        imageByIndex.set(idx, {
          index: idx,
          imageUrl: imageUrls[i] || '',
          imageWidth: 0,
          imageHeight: 0,
          label: loadedIndexSet.size ? '분석 생략' : '사진 확인',
          comment: loadedIndexSet.size
            ? '분석 서버가 이 사진을 불러오지 못했습니다. 위 매물 사진과 동일한 원본으로 직접 확인하세요.'
            : '분석할 수 있는 매물 사진을 불러오지 못했습니다.',
          level: 'neutral',
        });
      }
      const images = [...imageByIndex.values()].sort((a, b) => (Number(a.index) || 0) - (Number(b.index) || 0));
      const overall =
        parsedBatches
          .map((p) => String(p.overall || '').trim())
          .filter(Boolean)
          .join(' ') || '사진별 상태 코멘트';
      json(res, 200, {
        analysis: {
          images,
          overall,
          parseOk: Boolean(images.length || overall),
        },
        rawText: rawOutputs.join('\n\n--- batch ---\n\n'),
        model,
        usedImages: inlineParts.length,
        batches: batches.length,
        pipeline: 'gemini_listing_image_analysis_json_batches',
      });
    } catch (e) {
      json(res, 502, { error: e instanceof Error ? e.message : String(e) });
    }
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/comparison-filter') {
    try {
      const apiKey =
        req.headers['x-gemini-key'] ||
        (req.headers.authorization && req.headers.authorization.replace(/^Bearer\s+/i, '')) ||
        '';
      const model = req.headers['x-gemini-model'] || DEFAULT_GEMINI_MODEL;
      if (!String(apiKey).trim()) {
        json(res, 400, { error: 'X-Gemini-Key 헤더 또는 Authorization: Bearer 가 필요합니다.' });
        return;
      }
      const bodyRaw = await readBody(req);
      let body;
      try {
        body = JSON.parse(bodyRaw || '{}');
      } catch {
        json(res, 400, { error: 'JSON 본문이 올바르지 않습니다.' });
        return;
      }
      const rawOut = await runComparisonFilter(apiKey, model, body);
      json(res, 200, {
        analysis: parseComparisonFilter(rawOut),
        rawText: rawOut,
        model,
        pipeline: 'gemini_comparison_same_product_filter',
      });
    } catch (e) {
      json(res, 502, { error: e instanceof Error ? e.message : String(e) });
    }
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/used-price-guide') {
    try {
      const apiKey =
        req.headers['x-gemini-key'] ||
        (req.headers.authorization && req.headers.authorization.replace(/^Bearer\s+/i, '')) ||
        '';
      const model = req.headers['x-gemini-model'] || DEFAULT_GEMINI_MODEL;
      if (!String(apiKey).trim()) {
        json(res, 400, { error: 'X-Gemini-Key 헤더 또는 Authorization: Bearer 가 필요합니다.' });
        return;
      }
      const bodyRaw = await readBody(req);
      let body;
      try {
        body = JSON.parse(bodyRaw || '{}');
      } catch {
        json(res, 400, { error: 'JSON 본문이 올바르지 않습니다.' });
        return;
      }
      const rawOut = await runUsedPriceGuide(apiKey, model, body);
      json(res, 200, {
        guide: parseUsedPriceGuide(rawOut),
        rawText: rawOut,
        model,
        pipeline: 'gemini_used_price_guide_json',
      });
    } catch (e) {
      json(res, 502, { error: e instanceof Error ? e.message : String(e) });
    }
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/purchase-receipt') {
    try {
      const apiKey =
        req.headers['x-gemini-key'] ||
        (req.headers.authorization && req.headers.authorization.replace(/^Bearer\s+/i, '')) ||
        '';
      const model = req.headers['x-gemini-model'] || DEFAULT_GEMINI_MODEL;
      if (!String(apiKey).trim()) {
        json(res, 400, { error: 'X-Gemini-Key 헤더 또는 Authorization: Bearer 가 필요합니다.' });
        return;
      }
      const bodyRaw = await readBody(req);
      let body;
      try {
        body = JSON.parse(bodyRaw || '{}');
      } catch {
        json(res, 400, { error: 'JSON 본문이 올바르지 않습니다.' });
        return;
      }
      const rawOut = await runPurchaseReceipt(apiKey, model, body);
      json(res, 200, {
        receipt: applyComparisonReliabilityToReceipt(parsePurchaseReceipt(rawOut), body.comparison, body.usedPriceGuide),
        rawText: rawOut,
        model,
        pipeline: 'gemini_purchase_receipt_json',
      });
    } catch (e) {
      json(res, 502, { error: e instanceof Error ? e.message : String(e) });
    }
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/ai-chat') {
    try {
      const apiKey =
        req.headers['x-gemini-key'] ||
        (req.headers.authorization && req.headers.authorization.replace(/^Bearer\s+/i, '')) ||
        '';
      const model = req.headers['x-gemini-model'] || DEFAULT_GEMINI_MODEL;
      if (!String(apiKey).trim()) {
        json(res, 400, { error: 'X-Gemini-Key 헤더 또는 Authorization: Bearer 가 필요합니다.' });
        return;
      }
      const bodyRaw = await readBody(req);
      let body;
      try {
        body = JSON.parse(bodyRaw || '{}');
      } catch {
        json(res, 400, { error: 'JSON 본문이 올바르지 않습니다.' });
        return;
      }
      const prompt = String(body.prompt || '').trim();
      if (!prompt) {
        json(res, 400, { error: '프롬프트를 입력하세요.' });
        return;
      }
      const answer = await runDirectAiChat(apiKey, model, prompt);
      json(res, 200, {
        answer,
        model,
        pipeline: 'gemini_google_search_direct_chat',
      });
    } catch (e) {
      json(res, 502, { error: e instanceof Error ? e.message : String(e) });
    }
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/seller-chat-assistant') {
    try {
      const apiKey =
        req.headers['x-gemini-key'] ||
        (req.headers.authorization && req.headers.authorization.replace(/^Bearer\s+/i, '')) ||
        '';
      const model = req.headers['x-gemini-model'] || DEFAULT_GEMINI_MODEL;
      if (!String(apiKey).trim()) {
        json(res, 400, { error: 'X-Gemini-Key 헤더 또는 Authorization: Bearer 가 필요합니다.' });
        return;
      }
      const bodyRaw = await readBody(req);
      let body;
      try {
        body = JSON.parse(bodyRaw || '{}');
      } catch {
        json(res, 400, { error: 'JSON 본문이 올바르지 않습니다.' });
        return;
      }
      const prompt = buildSellerChatAssistantPrompt(body);
      const rawOut = await geminiGenerateFromParts(apiKey, model, [{ text: prompt }], {
        temperature: 0.35,
        maxOutputTokens: 1200,
        responseMimeType: 'application/json',
        timeoutMs: GEMINI_FAST_TIMEOUT_MS,
      });
      const assistant = parseSellerChatAssistant(rawOut);
      json(res, 200, {
        assistant,
        primary: assistant.primary,
        alternatives: assistant.alternatives,
        followUps: assistant.followUps,
        quickReplies: assistant.quickReplies,
        summary: assistant.summary,
        rawText: rawOut,
        model,
        pipeline: 'gemini_seller_chat_assistant_json',
      });
    } catch (e) {
      json(res, 502, { error: e instanceof Error ? e.message : String(e) });
    }
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/product-image') {
    try {
      const bodyRaw = await readBody(req);
      let body;
      try {
        body = JSON.parse(bodyRaw || '{}');
      } catch {
        json(res, 400, { error: 'JSON 본문이 올바르지 않습니다.' });
        return;
      }
      const productName = String(body.productName || '').trim();
      const searchQuery = String(body.searchQuery || '').trim();
      const query = productName || searchQuery;
      if (!query) {
        json(res, 400, { error: '제품명 또는 검색어가 필요합니다.' });
        return;
      }
      const searchText = `${query} 공식 제품 이미지`;
      const directUrls = await fetchDuckDuckGoImageUrls(searchText);
      const imageUrls = directUrls.map(productImageProxyUrl).filter(Boolean);
      json(res, 200, {
        imageUrls,
        source: imageUrls.length ? 'duckduckgo_images' : 'none',
      });
    } catch (e) {
      json(res, 502, { error: e instanceof Error ? e.message : String(e) });
    }
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/image-proxy') {
    const target = normalizeProductImageUrl(url.searchParams.get('url'));
    if (!target) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('이미지 URL이 올바르지 않습니다.');
      return;
    }
    try {
      const upstream = await fetch(target, {
        redirect: 'follow',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0 Safari/537.36',
          Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          Referer: new URL(target).origin,
        },
        signal: AbortSignal.timeout(IMAGE_FETCH_TIMEOUT_MS),
      });
      const type = upstream.headers.get('content-type')?.split(';')[0]?.trim() || 'image/jpeg';
      if (!upstream.ok || !type.startsWith('image/')) {
        res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('이미지를 가져오지 못했습니다.');
        return;
      }
      const buf = Buffer.from(await upstream.arrayBuffer());
      res.writeHead(200, {
        'Content-Type': type,
        'Cache-Control': 'public, max-age=86400',
      });
      res.end(buf);
    } catch (e) {
      res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(e instanceof Error ? e.message : String(e));
    }
    return;
  }

  if (req.method === 'GET' && /^\/icons\/icon(?:16|32|48|128)\.png$/.test(url.pathname)) {
    const iconName = path.basename(url.pathname);
    try {
      const buf = await fs.readFile(path.join(EXTENSION_ICONS_DIR, iconName));
      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      });
      res.end(buf);
    } catch {
      res.writeHead(404);
      res.end('Not Found');
    }
    return;
  }

  /* 정적 파일 */
  let filePath = url.pathname === '/' ? '/index.html' : url.pathname;
  filePath = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
  const abs = path.join(ANALYZER_DIR, filePath);
  if (!abs.startsWith(ANALYZER_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  try {
    const buf = await fs.readFile(abs);
    const ext = path.extname(abs);
    const cacheControl = /\.(?:html|js|css)$/i.test(abs)
      ? 'no-store, no-cache, must-revalidate, max-age=0'
      : 'public, max-age=3600';
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': cacheControl,
    });
    res.end(buf);
  } catch {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Buy or Bye · 중고매물 살까말까: http://127.0.0.1:${PORT}/`);
  console.log('종료: Ctrl+C');
});
