#!/usr/bin/env node
/** 로컬 가격 분석 페이지 + Gemini API 프록시 (API 키는 클라이언트가 헤더로 전달) */
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.ANALYZER_PORT) || 3920;
const ANALYZER_DIR = path.join(__dirname, 'analyzer');

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

  return `당신은 한국 중고 플랫폼(번개장터, 당근마켓)에서 **같은 물건**을 찾기 위한 검색어를 만듭니다.

${media}
**절차**
1. 필요하면 **Google 검색**으로 이 매물이 어떤 제품·모델인지 파악하세요.
2. 첨부 사진, 제목, 본문을 함께 보세요. 판매자 표기가 틀릴 수 있으니 **사진·웹에서 확인한 사실**을 우선하세요.

**출력:** 번개·당근 검색창에 넣을 **한국어 검색어 딱 한 줄**만.
- 그 제품을 검색했을 때 **동일·유사 매물**이 잘 걸리는, 실제로 쓰는 **완전한** 표기(브랜드·모델·세대·통칭 등).
- 단어 **가운데에서 끊긴** 짧은 조각 금지.
- 설명·따옴표·불릿 없음. "팔아요", "급처", "네고", "택포" 등 거래 문구 제외.
- 공백 포함 최대 ${MAX_SEARCH_QUERY_CHARS}자.

제목: ${t}
${b ? `본문: ${b}` : '본문: (없음)'}`;
}

/** AI 검색어가 제목 앞부분만 잘린 것 같으면 제목 기반으로 보정 */
function sanitizeQueryFromListing(query, title) {
  const q = String(query || '').trim();
  const t = String(title || '')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!q || !t || q.length >= t.length) return q;
  if (t.startsWith(q) && t.length > q.length + 2) {
    return clampQuery(t);
  }
  return q;
}

const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

function clampQuery(q) {
  const max = MAX_SEARCH_QUERY_CHARS;
  const OVER = 48; // max 경계가 한글 낱말·모델명 중간일 때 끝까지 보완(상한 초과 허용폭)
  const H = /[\uAC00-\uD7A3]/;

  let s = String(q || '')
    .split(/\r?\n/)[0]
    .replace(/^["'`「」]|["'`「」]$/g, '')
    .trim();
  if (!s) return '중고';
  if (s.length <= max) return s;

  /** slice(max) 직후 글자부터 공백 전까지 한 덩어리(한글 연속·숫자 등)면 끝까지 포함 */
  let end = max;
  while (end < s.length && end < max + OVER) {
    const prev = s[end - 1];
    const curr = s[end];
    if (!curr) break;
    if (/\s/.test(curr)) break;
    const pH = H.test(prev);
    const cH = H.test(curr);
    if (pH && cH) {
      end += 1;
      continue;
    }
    if (pH && /\d/.test(curr)) {
      end += 1;
      continue;
    }
    if (/\d/.test(prev) && /\d/.test(curr)) {
      end += 1;
      continue;
    }
    if (/[A-Za-z]/.test(prev) && /[A-Za-z]/.test(curr)) {
      end += 1;
      continue;
    }
    break;
  }

  let out = s.slice(0, end).trim();

  if (out.length > max + OVER) {
    let hard = s.slice(0, max);
    const sp = hard.lastIndexOf(' ');
    if (sp > max * 0.35) hard = hard.slice(0, sp);
    out = hard.replace(/\s+\S*$/, '').trim() || hard.trim();
  }

  return out || '중고';
}

const MAX_INLINE_IMAGES = 6;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

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
    return 'https://m.bunjang.co.kr/';
  } catch {
    return 'https://m.bunjang.co.kr/';
  }
}

/** Gemini REST: { inline_data: { mime_type, data: base64 } } */
async function fetchImageUrlToInlinePart(url) {
  const res = await fetch(String(url).trim(), {
    redirect: 'follow',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0 Safari/537.36',
      Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      Referer: refererForImageUrl(url),
    },
    signal: AbortSignal.timeout(18_000),
  });
  if (!res.ok) throw new Error(`이미지 HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_IMAGE_BYTES) throw new Error('이미지 용량 초과');
  let mime = res.headers.get('content-type')?.split(';')[0]?.trim() || '';
  if (!mime.startsWith('image/')) {
    const p = String(url).toLowerCase();
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

async function fetchListingImageInlineParts(urls) {
  const list = Array.isArray(urls) ? urls : [];
  const parts = [];
  for (const raw of list) {
    if (parts.length >= MAX_INLINE_IMAGES) break;
    const u = String(raw || '').trim();
    if (!u || !isAllowedListingImageUrl(u)) continue;
    try {
      parts.push(await fetchImageUrlToInlinePart(u));
    } catch (e) {
      console.warn('[search-query] 이미지 로드 생략:', u.slice(0, 80), e instanceof Error ? e.message : e);
    }
  }
  return parts;
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

/** @param {object[]} parts Gemini user message parts: { text } 또는 { inline_data } */
async function geminiGenerateFromParts(apiKey, model, parts, opts = {}) {
  const m = String(model || DEFAULT_GEMINI_MODEL).replace(/^\s+|\s+$/g, '');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    m
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const temperature = opts.temperature ?? 0.2;
  const maxOutputTokens = opts.maxOutputTokens ?? 256;
  const payload = {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature,
      maxOutputTokens,
    },
  };
  if (opts.useGoogleSearch) {
    payload.tools = [{ google_search: {} }];
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const raw = await res.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(raw.slice(0, 180) || `Gemini HTTP ${res.status}`);
  }
  if (!res.ok) {
    const msg = data?.error?.message || data?.message || JSON.stringify(data).slice(0, 200);
    throw new Error(msg);
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
    const text = await geminiGenerateFromParts(apiKey, model, parts, {
      useGoogleSearch: true,
      temperature: 0.2,
      maxOutputTokens: 512,
    });
    return { text, pipeline: 'google_search' };
  } catch (e) {
    console.warn(
      '[search-query] Google Search 연동 실패, 멀티모달만 사용:',
      e instanceof Error ? e.message : e
    );
    const text = await geminiGenerateFromParts(apiKey, model, parts, {
      temperature: 0.2,
      maxOutputTokens: 512,
    });
    return { text, pipeline: 'multimodal_fallback' };
  }
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

      const { text: rawOut, pipeline } = await runWebGroundedSearchQuery(
        apiKey,
        model,
        body.title,
        body.body || '',
        inlineParts
      );
      let query = clampQuery(rawOut);
      query = sanitizeQueryFromListing(query, body.title);
      query = clampQuery(query);

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
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(buf);
  } catch {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`가격 분석 페이지: http://127.0.0.1:${PORT}/`);
  console.log('종료: Ctrl+C');
});
