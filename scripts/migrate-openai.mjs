/**
 * Replace Gemini generate/verify with OpenAI, keep call-site function names.
 * Run: node scripts/migrate-openai.mjs
 */
import fs from 'node:fs';

function rw(file, fn) {
  let t = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const next = fn(t);
  if (next == null) throw new Error(`no change: ${file}`);
  fs.writeFileSync(file, next.replace(/\n/g, '\r\n'), 'utf8');
  console.log('ok', file);
}

rw('analyzer/ai/config.js', () => `/** OpenAI / AI 설정 키 (로컬스토리지) — 확장 chrome.storage와 동기화 */
(() => {
  globalThis.UlsaAi = globalThis.UlsaAi || {};
  UlsaAi.STORAGE_KEY_API = 'ulsa_openai_api_key';
  UlsaAi.STORAGE_KEY_API_LEGACY = 'ulsa_gemini_api_key';
  UlsaAi.STORAGE_KEY_MODEL = 'ulsa_openai_model';
  UlsaAi.STORAGE_KEY_MODEL_LEGACY = 'ulsa_gemini_model';
  UlsaAi.STORAGE_KEY_VERIFIED_AT = 'ulsa_openai_verified_at';
  UlsaAi.STORAGE_KEY_VERIFIED_AT_LEGACY = 'ulsa_gemini_verified_at';
  /** 기본: 빠르면서 성능 균형 — GPT-5.6 Terra */
  UlsaAi.DEFAULT_MODEL = 'gpt-5.6-terra';
  /** 「이게 아니에요」 재식별 시 정확도 우선 */
  UlsaAi.RETRY_MODEL = 'gpt-5.6';
  /** 선택 목록 (표시용 라벨 + 값) — GPT-5.6 이상 포함 */
  UlsaAi.MODEL_OPTIONS = [
    { value: 'gpt-6-astra', label: 'GPT-6 Astra (최신·최고성능)' },
    { value: 'gpt-5.6', label: 'GPT-5.6 Sol (플래그십)' },
    { value: 'gpt-5.6-sol', label: 'GPT-5.6 Sol (별칭)' },
    { value: 'gpt-5.6-terra', label: 'GPT-5.6 Terra (추천·균형)' },
    { value: 'gpt-5.6-luna', label: 'GPT-5.6 Luna (빠름·저비용)' },
    { value: 'gpt-5.2', label: 'GPT-5.2' },
    { value: 'gpt-5.1', label: 'GPT-5.1' },
    { value: 'gpt-5', label: 'GPT-5' },
    { value: 'gpt-5-mini', label: 'GPT-5 Mini' },
    { value: 'gpt-5-nano', label: 'GPT-5 Nano' },
    { value: 'gpt-4.1', label: 'GPT-4.1' },
    { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini' },
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  ];

  UlsaAi.readStoredApiKey = () => {
    const cur = localStorage.getItem(UlsaAi.STORAGE_KEY_API);
    if (cur && cur.trim()) return cur.trim();
    const legacy = localStorage.getItem(UlsaAi.STORAGE_KEY_API_LEGACY);
    return legacy && legacy.trim() ? legacy.trim() : '';
  };

  UlsaAi.readStoredModel = () => {
    const cur = localStorage.getItem(UlsaAi.STORAGE_KEY_MODEL);
    if (cur && cur.trim()) return cur.trim();
    const legacy = localStorage.getItem(UlsaAi.STORAGE_KEY_MODEL_LEGACY);
    return legacy && legacy.trim() ? legacy.trim() : UlsaAi.DEFAULT_MODEL;
  };

  UlsaAi.readStoredVerifiedAt = () => {
    const cur = localStorage.getItem(UlsaAi.STORAGE_KEY_VERIFIED_AT);
    if (cur) return cur;
    return localStorage.getItem(UlsaAi.STORAGE_KEY_VERIFIED_AT_LEGACY) || '';
  };
})();
`);

rw('analyzer-server.mjs', (t) => {
  // env + headers
  t = t.replace(
    /const SERVER_GEMINI_KEY = String\(process\.env\.GEMINI_API_KEY \|\| ''\)\.trim\(\);/,
    `const SERVER_OPENAI_KEY = String(process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || '').trim();
const SERVER_GEMINI_KEY = SERVER_OPENAI_KEY; // legacy alias`
  );
  t = t.replace(
    `'Content-Type, X-Gemini-Key, X-Gemini-Model, Authorization'`,
    `'Content-Type, X-Gemini-Key, X-Gemini-Model, X-OpenAI-Key, X-OpenAI-Model, X-AI-Key, X-AI-Model, Authorization'`
  );
  t = t.replace(
    `function resolveRequestApiKey(req) {
  const header =
    String(req.headers['x-gemini-key'] || '').trim() ||
    String(req.headers.authorization || '')
      .replace(/^Bearer\\s+/i, '')
      .trim();
  if (header && header !== DEMO_SERVER_KEY_TOKEN) return header;
  return SERVER_GEMINI_KEY;
}`,
    `function resolveRequestApiKey(req) {
  const header =
    String(req.headers['x-openai-key'] || req.headers['x-ai-key'] || req.headers['x-gemini-key'] || '').trim() ||
    String(req.headers.authorization || '')
      .replace(/^Bearer\\s+/i, '')
      .trim();
  if (header && header !== DEMO_SERVER_KEY_TOKEN) return header;
  return SERVER_OPENAI_KEY;
}

function resolveRequestModel(req) {
  return (
    String(req.headers['x-openai-model'] || req.headers['x-ai-model'] || req.headers['x-gemini-model'] || '').trim() ||
    DEFAULT_OPENAI_MODEL
  );
}`
  );

  t = t.replace(
    `const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

const MAX_INLINE_IMAGES = 3;
const LISTING_IMAGE_ANALYSIS_BATCH_SIZE = 10;
const MAX_IMAGE_BYTES = 1.2 * 1024 * 1024;
const IMAGE_FETCH_TIMEOUT_MS = 6_000;
const IMAGE_SEARCH_TIMEOUT_MS = 8_000;
const PRODUCT_IMAGE_VALIDATE_TIMEOUT_MS = 5_000;
const GEMINI_FAST_TIMEOUT_MS = 30_000;
const GEMINI_GROUNDED_TIMEOUT_MS = 75_000;
const GEMINI_PRODUCT_TIMEOUT_MS = 90_000;`,
    `const DEFAULT_OPENAI_MODEL = 'gpt-5.6-terra';
const DEFAULT_GEMINI_MODEL = DEFAULT_OPENAI_MODEL; // legacy alias

const MAX_INLINE_IMAGES = 3;
const LISTING_IMAGE_ANALYSIS_BATCH_SIZE = 10;
const MAX_IMAGE_BYTES = 1.2 * 1024 * 1024;
const IMAGE_FETCH_TIMEOUT_MS = 6_000;
const IMAGE_SEARCH_TIMEOUT_MS = 8_000;
const PRODUCT_IMAGE_VALIDATE_TIMEOUT_MS = 5_000;
const GEMINI_FAST_TIMEOUT_MS = 30_000;
const GEMINI_GROUNDED_TIMEOUT_MS = 75_000;
const GEMINI_PRODUCT_TIMEOUT_MS = 90_000;
const OPENAI_FAST_TIMEOUT_MS = GEMINI_FAST_TIMEOUT_MS;
const OPENAI_GROUNDED_TIMEOUT_MS = GEMINI_GROUNDED_TIMEOUT_MS;
const OPENAI_PRODUCT_TIMEOUT_MS = GEMINI_PRODUCT_TIMEOUT_MS;`
  );

  // Replace extractGeminiText + geminiGenerateFromParts + verifyGeminiApiKey
  const genStart = t.indexOf('function extractGeminiText(data) {');
  const genEnd = t.indexOf('function normalizeProductImageUrl(raw) {');
  if (genStart < 0 || genEnd < 0) throw new Error('extractGeminiText block missing');

  const openaiCore = `function extractGeminiText(data) {
  // OpenAI Responses / Chat Completions 겸용
  if (typeof data?.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
  if (Array.isArray(data?.output)) {
    const chunks = [];
    for (const item of data.output) {
      const content = item?.content;
      if (!Array.isArray(content)) continue;
      for (const part of content) {
        if (typeof part?.text === 'string') chunks.push(part.text);
        else if (typeof part?.output_text === 'string') chunks.push(part.output_text);
      }
    }
    if (chunks.length) return chunks.join('').trim();
  }
  const choice = data?.choices?.[0];
  const msg = choice?.message?.content;
  if (typeof msg === 'string') return msg.trim();
  if (Array.isArray(msg)) {
    return msg
      .map((p) => (typeof p?.text === 'string' ? p.text : ''))
      .filter(Boolean)
      .join('')
      .trim();
  }
  const cand = data?.candidates?.[0];
  if (cand) {
    const parts = cand.content?.parts;
    return (
      parts?.map((p) => p.text).filter(Boolean).join('') ||
      parts?.[0]?.text ||
      ''
    );
  }
  return '';
}

function geminiPartsToOpenAIContent(parts) {
  const content = [];
  for (const part of Array.isArray(parts) ? parts : []) {
    if (!part || typeof part !== 'object') continue;
    if (typeof part.text === 'string' && part.text) {
      content.push({ type: 'text', text: part.text });
      continue;
    }
    const inline = part.inline_data || part.inlineData;
    if (inline?.data) {
      const mime = String(inline.mime_type || inline.mimeType || 'image/jpeg').trim() || 'image/jpeg';
      content.push({
        type: 'image_url',
        image_url: { url: \`data:\${mime};base64,\${inline.data}\` },
      });
    }
  }
  return content.length ? content : [{ type: 'text', text: '(empty)' }];
}

function geminiPartsToResponsesInput(parts) {
  const content = [];
  for (const part of Array.isArray(parts) ? parts : []) {
    if (!part || typeof part !== 'object') continue;
    if (typeof part.text === 'string' && part.text) {
      content.push({ type: 'input_text', text: part.text });
      continue;
    }
    const inline = part.inline_data || part.inlineData;
    if (inline?.data) {
      const mime = String(inline.mime_type || inline.mimeType || 'image/jpeg').trim() || 'image/jpeg';
      content.push({
        type: 'input_image',
        image_url: \`data:\${mime};base64,\${inline.data}\`,
      });
    }
  }
  return content.length ? content : [{ type: 'input_text', text: '(empty)' }];
}

/** @param {object[]} parts Gemini-style parts: { text } or { inline_data } */
async function geminiGenerateFromParts(apiKey, model, parts, opts = {}) {
  return openaiGenerateFromParts(apiKey, model, parts, opts);
}

async function openaiGenerateFromParts(apiKey, model, parts, opts = {}) {
  const m = String(model || DEFAULT_OPENAI_MODEL).replace(/^\\s+|\\s+$/g, '');
  const temperature = opts.temperature ?? 0.2;
  const timeoutMs = opts.timeoutMs || OPENAI_FAST_TIMEOUT_MS;
  const wantJson = opts.responseMimeType === 'application/json';
  const useSearch = Boolean(opts.useGoogleSearch);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: \`Bearer \${apiKey}\`,
  };

  // 1) Responses API (web_search 지원)
  if (useSearch) {
    const payload = {
      model: m,
      input: [
        {
          role: 'user',
          content: geminiPartsToResponsesInput(parts),
        },
      ],
      tools: [{ type: 'web_search' }],
      temperature,
    };
    if (opts.maxOutputTokens != null) payload.max_output_tokens = opts.maxOutputTokens;
    if (wantJson) {
      payload.text = { format: { type: 'json_object' } };
    }
    try {
      const res = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(timeoutMs),
      });
      const raw = await res.text();
      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(cleanUpstreamErrorText(raw, \`OpenAI HTTP \${res.status}\`));
      }
      if (!res.ok) {
        const msg = data?.error?.message || data?.message || JSON.stringify(data).slice(0, 200);
        throw new Error(cleanUpstreamErrorText(msg, \`OpenAI HTTP \${res.status}\`));
      }
      const text = extractGeminiText(data);
      if (text) return text;
    } catch (e) {
      console.warn('[openai] Responses+web_search 실패, Chat Completions로 재시도:', e instanceof Error ? e.message : e);
    }
  }

  // 2) Chat Completions (멀티모달·JSON)
  const chatPayload = {
    model: m,
    messages: [
      {
        role: 'user',
        content: geminiPartsToOpenAIContent(parts),
      },
    ],
    temperature,
  };
  if (opts.maxOutputTokens != null) chatPayload.max_tokens = opts.maxOutputTokens;
  if (wantJson) chatPayload.response_format = { type: 'json_object' };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers,
    body: JSON.stringify(chatPayload),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const raw = await res.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(cleanUpstreamErrorText(raw, \`OpenAI HTTP \${res.status}\`));
  }
  if (!res.ok) {
    const msg = data?.error?.message || data?.message || JSON.stringify(data).slice(0, 200);
    throw new Error(cleanUpstreamErrorText(msg, \`OpenAI HTTP \${res.status}\`));
  }
  const text = extractGeminiText(data);
  if (!text) throw new Error('OpenAI 응답에 텍스트가 없습니다.');
  return text;
}

`;

  t = t.slice(0, genStart) + openaiCore + t.slice(genEnd);

  // verify function
  const verStart = t.indexOf('/** API ');
  // find verifyGeminiApiKey more reliably
  const vStart = t.indexOf('async function verifyGeminiApiKey(apiKey, modelId) {');
  const vEnd = t.indexOf('const server = http.createServer(async (req, res) => {');
  if (vStart < 0 || vEnd < 0) throw new Error('verifyGeminiApiKey missing');

  const verifyFn = `async function verifyGeminiApiKey(apiKey, modelId) {
  return verifyOpenAIApiKey(apiKey, modelId);
}

async function verifyOpenAIApiKey(apiKey, modelId) {
  const key = String(apiKey || '').trim();
  if (!key) throw new Error('API 키가 비었습니다.');
  const mid = String(modelId || DEFAULT_OPENAI_MODEL).trim();
  const res = await fetch('https://api.openai.com/v1/models', {
    headers: { Authorization: \`Bearer \${key}\` },
    signal: AbortSignal.timeout(20_000),
  });
  const raw = await res.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(raw.slice(0, 200) || \`HTTP \${res.status}\`);
  }
  if (!res.ok) {
    const msg = data?.error?.message || data?.message || JSON.stringify(data).slice(0, 200);
    throw new Error(cleanUpstreamErrorText(msg, \`OpenAI HTTP \${res.status}\`));
  }
  const models = Array.isArray(data?.data) ? data.data : [];
  if (!models.length) throw new Error('모델 목록을 가져오지 못했습니다. API 키를 확인하세요.');
  const okModel = models.some((m) => {
    const id = String(m?.id || '');
    return id === mid || id.startsWith(\`\${mid}-\`) || mid.startsWith(id);
  });
  // 일부 최신 모델은 /v1/models 목록에 늦게 뜨므로, 키가 유효하면 통과시키고 실제 호출에서 검증
  if (!okModel) {
    const sample = models
      .slice(0, 8)
      .map((m) => m.id)
      .filter(Boolean)
      .join(', ');
    console.warn(\`[openai] 목록에 없는 모델 선택: \${mid} (예: \${sample || '—'})\`);
  }
  return { ok: true, model: mid };
}

`;

  t = t.slice(0, vStart) + verifyFn + t.slice(vEnd);

  // model header resolution on endpoints
  t = t.replace(
    /const model = req\.headers\['x-gemini-model'\] \|\| DEFAULT_GEMINI_MODEL;/g,
    'const model = resolveRequestModel(req);'
  );

  // error message tweak
  t = t.replace(
    /Gemini API 사용량 한도를 초과했습니다\. Google AI Studio의 결제\/쿼터 상태를 확인하거나, 잠시 후 다시 시도하거나, 다른 API 키를 저장한 뒤 재시도하세요\./g,
    'OpenAI API 사용량 한도를 초과했습니다. platform.openai.com 결제/쿼터를 확인하거나, 잠시 후 다시 시도하거나, 다른 API 키를 저장한 뒤 재시도하세요.'
  );

  t = t.replace(
    `/** 분석 페이지 + Gemini API 프록시 (클라이언트 헤더 또는 GEMINI_API_KEY) */`,
    `/** 분석 페이지 + OpenAI API 프록시 (클라이언트 헤더 또는 OPENAI_API_KEY) */`
  );

  return t;
});

console.log('server+config migrated');
