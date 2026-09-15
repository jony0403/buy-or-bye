/**
 * Finish OpenAI migration: remove stale Gemini generate, dual-write extension storage, env/docs.
 * Run: node scripts/migrate-openai-finish.mjs
 */
import fs from 'node:fs';

function rw(file, fn) {
  let t = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const next = fn(t);
  if (next == null) throw new Error(`no change: ${file}`);
  fs.writeFileSync(file, next.replace(/\n/g, '\r\n'), 'utf8');
  console.log('ok', file);
}

// 1) Remove duplicate Gemini generate that overwrites OpenAI wrapper
rw('analyzer-server.mjs', (t) => {
  const start = t.indexOf(
    '/** @param {object[]} parts Gemini user message parts: { text } 또는 { inline_data } */\nasync function geminiGenerateFromParts'
  );
  // encoding may have corrupted Korean — try alternate markers
  let marker = start;
  if (marker < 0) {
    marker = t.indexOf('async function geminiGenerateFromParts(apiKey, model, parts, opts = {}) {\n  const m = String(model || DEFAULT_GEMINI_MODEL)');
  }
  if (marker < 0) {
    // find SECOND occurrence of geminiGenerateFromParts that hits Google API
    const first = t.indexOf('async function geminiGenerateFromParts');
    const second = t.indexOf('async function geminiGenerateFromParts', first + 1);
    if (second < 0) throw new Error('duplicate geminiGenerateFromParts not found');
    marker = second;
    // include preceding doc comment if present
    const doc = t.lastIndexOf('/**', marker);
    if (doc > 0 && marker - doc < 200) marker = doc;
  } else {
    // back up to doc comment
    const doc = t.lastIndexOf('/**', marker);
    if (doc > 0 && marker - doc < 250) marker = doc;
  }

  const fnStart = t.indexOf('{', marker);
  let depth = 0;
  let i = fnStart;
  for (; i < t.length; i++) {
    const c = t[i];
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) {
        i++;
        break;
      }
    }
  }
  // also remove trailing newline
  while (t[i] === '\n') i++;
  t = t.slice(0, marker) + t.slice(i);

  // ensure first wrapper still exists
  if (!t.includes('return openaiGenerateFromParts(apiKey, model, parts, opts);')) {
    throw new Error('OpenAI wrapper missing after duplicate removal');
  }
  if (t.includes('generativelanguage.googleapis.com')) {
    throw new Error('Google Gemini endpoint still present');
  }

  // verify route alias + friendlier header error
  if (!t.includes("/api/verify-openai")) {
    t = t.replace(
      `if (req.method === 'POST' && url.pathname === '/api/verify-gemini') {`,
      `if (req.method === 'POST' && (url.pathname === '/api/verify-gemini' || url.pathname === '/api/verify-openai')) {`
    );
  }
  t = t.replace(
    `json(res, 400, { ok: false, error: 'X-Gemini-Key 헤더가 필요합니다.' });`,
    `json(res, 400, { ok: false, error: 'X-OpenAI-Key 또는 X-Gemini-Key 헤더가 필요합니다.' });`
  );
  // corrupted encoding variants
  t = t.replace(
    /json\(res, 400, \{ ok: false, error: 'X-Gemini-Key[^']*' \}\);/,
    `json(res, 400, { ok: false, error: 'X-OpenAI-Key 또는 X-Gemini-Key 헤더가 필요합니다.' });`
  );

  // exclude verify-openai from rate limit block like verify-gemini
  t = t.replace(
    `url.pathname !== '/api/verify-gemini' &&`,
    `url.pathname !== '/api/verify-gemini' &&\n    url.pathname !== '/api/verify-openai' &&`
  );

  return t;
});

rw('extension/bridge-analyzer.js', (t) => {
  const block = (src) => `{
        ulsaOpenAiApiKey: ${src}.apiKey,
        ulsaOpenAiModel: ${src}.model || 'gpt-5.6-terra',
        ulsaOpenAiVerifiedAt: ${src}.verifiedAt || Date.now(),
        ulsaGeminiApiKey: ${src}.apiKey,
        ulsaGeminiModel: ${src}.model || 'gpt-5.6-terra',
        ulsaGeminiVerifiedAt: ${src}.verifiedAt || Date.now(),
      }`;
  t = t.replace(
    /chrome\.storage\.local\.set\(\{\s*ulsaGeminiApiKey: d\.apiKey,\s*ulsaGeminiModel: d\.model \|\| 'gemini-2\.5-flash',\s*ulsaGeminiVerifiedAt: d\.verifiedAt \|\| Date\.now\(\),\s*\}\);/,
    `chrome.storage.local.set(${block('d')});`
  );
  t = t.replace(
    /chrome\.storage\.local\.set\(\{\s*ulsaGeminiApiKey: ev\.data\.apiKey,\s*ulsaGeminiModel: ev\.data\.model \|\| 'gemini-2\.5-flash',\s*ulsaGeminiVerifiedAt: ev\.data\.verifiedAt \|\| Date\.now\(\),\s*\}\);/,
    `chrome.storage.local.set(${block('ev.data')});`
  );
  return t;
});

rw('extension/lib/shared.js', (t) => {
  t = t.replace(
    `    const st = await chrome.storage.local.get(['ulsaGeminiApiKey', 'ulsaGeminiModel']);
    const apiKey = typeof st.ulsaGeminiApiKey === 'string' ? st.ulsaGeminiApiKey.trim() : '';
    if (!apiKey) {
      throw new Error('분석 웹에서 Gemini API 키를 먼저 저장하세요.');
    }

    const model = st.ulsaGeminiModel || 'gemini-2.5-flash';
    const res = await fetch('http://127.0.0.1:3920/api/search-query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gemini-Key': apiKey,
        'X-Gemini-Model': model,
      },`,
    `    const st = await chrome.storage.local.get([
      'ulsaOpenAiApiKey',
      'ulsaOpenAiModel',
      'ulsaGeminiApiKey',
      'ulsaGeminiModel',
    ]);
    const apiKey =
      (typeof st.ulsaOpenAiApiKey === 'string' && st.ulsaOpenAiApiKey.trim()) ||
      (typeof st.ulsaGeminiApiKey === 'string' && st.ulsaGeminiApiKey.trim()) ||
      '';
    if (!apiKey) {
      throw new Error('분석 웹에서 OpenAI API 키를 먼저 저장하세요.');
    }

    const model = st.ulsaOpenAiModel || st.ulsaGeminiModel || 'gpt-5.6-terra';
    const res = await fetch('http://127.0.0.1:3920/api/search-query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-OpenAI-Key': apiKey,
        'X-OpenAI-Model': model,
        'X-Gemini-Key': apiKey,
        'X-Gemini-Model': model,
      },`
  );
  return t;
});

rw('extension/popup.js', (t) => {
  t = t.replace(
    ` * 분석 웹(localStorage)에만 있는 Gemini 설정을 chrome.storage로 복사합니다.`,
    ` * 분석 웹(localStorage)에만 있는 OpenAI 설정을 chrome.storage로 복사합니다.`
  );
  t = t.replace(
    `        func: () => ({
          api: localStorage.getItem('ulsa_gemini_api_key'),
          model: localStorage.getItem('ulsa_gemini_model'),
          v: localStorage.getItem('ulsa_gemini_verified_at'),
        }),`,
    `        func: () => ({
          api:
            localStorage.getItem('ulsa_openai_api_key') ||
            localStorage.getItem('ulsa_gemini_api_key'),
          model:
            localStorage.getItem('ulsa_openai_model') ||
            localStorage.getItem('ulsa_gemini_model'),
          v:
            localStorage.getItem('ulsa_openai_verified_at') ||
            localStorage.getItem('ulsa_gemini_verified_at'),
        }),`
  );
  t = t.replace(
    `        await chrome.storage.local.set({
          ulsaGeminiApiKey: String(d.api).trim(),
          ulsaGeminiModel: d.model || 'gemini-2.5-flash',
          ulsaGeminiVerifiedAt:
            Number.isFinite(verifiedAt) && verifiedAt > 0 ? verifiedAt : Date.now(),
        });`,
    `        await chrome.storage.local.set({
          ulsaOpenAiApiKey: String(d.api).trim(),
          ulsaOpenAiModel: d.model || 'gpt-5.6-terra',
          ulsaOpenAiVerifiedAt:
            Number.isFinite(verifiedAt) && verifiedAt > 0 ? verifiedAt : Date.now(),
          ulsaGeminiApiKey: String(d.api).trim(),
          ulsaGeminiModel: d.model || 'gpt-5.6-terra',
          ulsaGeminiVerifiedAt:
            Number.isFinite(verifiedAt) && verifiedAt > 0 ? verifiedAt : Date.now(),
        });`
  );
  t = t.replace(
    `  let st = await chrome.storage.local.get(['ulsaGeminiApiKey', 'ulsaGeminiModel', 'ulsaGeminiVerifiedAt']);
  let apiKey = typeof st.ulsaGeminiApiKey === 'string' ? st.ulsaGeminiApiKey.trim() : '';
  if (!apiKey) {
    await syncGeminiFromAnalyzerTabs();
    st = await chrome.storage.local.get(['ulsaGeminiApiKey', 'ulsaGeminiModel', 'ulsaGeminiVerifiedAt']);
    apiKey = typeof st.ulsaGeminiApiKey === 'string' ? st.ulsaGeminiApiKey.trim() : '';
  }`,
    `  let st = await chrome.storage.local.get([
    'ulsaOpenAiApiKey',
    'ulsaOpenAiModel',
    'ulsaOpenAiVerifiedAt',
    'ulsaGeminiApiKey',
    'ulsaGeminiModel',
    'ulsaGeminiVerifiedAt',
  ]);
  let apiKey =
    (typeof st.ulsaOpenAiApiKey === 'string' && st.ulsaOpenAiApiKey.trim()) ||
    (typeof st.ulsaGeminiApiKey === 'string' && st.ulsaGeminiApiKey.trim()) ||
    '';
  if (!apiKey) {
    await syncGeminiFromAnalyzerTabs();
    st = await chrome.storage.local.get([
      'ulsaOpenAiApiKey',
      'ulsaOpenAiModel',
      'ulsaOpenAiVerifiedAt',
      'ulsaGeminiApiKey',
      'ulsaGeminiModel',
      'ulsaGeminiVerifiedAt',
    ]);
    apiKey =
      (typeof st.ulsaOpenAiApiKey === 'string' && st.ulsaOpenAiApiKey.trim()) ||
      (typeof st.ulsaGeminiApiKey === 'string' && st.ulsaGeminiApiKey.trim()) ||
      '';
  }`
  );
  // softer replace if formatting differs
  t = t.replace(/ulsaGeminiModel \|\| 'gemini-2\.5-flash'/g, "ulsaOpenAiModel || st.ulsaGeminiModel || 'gpt-5.6-terra'");
  // fix if we broke `st.ulsaOpenAiModel || st.ulsaGeminiModel` wrongly when already prefixed
  t = t.replace(
    /st\.ulsaOpenAiModel \|\| st\.ulsaGeminiModel \|\| 'gpt-5\.6-terra'/,
    `st.ulsaOpenAiModel || st.ulsaGeminiModel || 'gpt-5.6-terra'`
  );
  // headers in popup verify/fetch
  t = t.replace(
    /'X-Gemini-Key': apiKey,\s*'X-Gemini-Model': model,/g,
    `'X-OpenAI-Key': apiKey,\n        'X-OpenAI-Model': model,\n        'X-Gemini-Key': apiKey,\n        'X-Gemini-Model': model,`
  );
  t = t.replace(
    `await chrome.storage.local.set({ ulsaGeminiVerifiedAt: Date.now() });`,
    `await chrome.storage.local.set({
      ulsaOpenAiVerifiedAt: Date.now(),
      ulsaGeminiVerifiedAt: Date.now(),
    });`
  );
  return t;
});

rw('.env.example', () => `# Championship / local demo
# OpenAI (preferred). GEMINI_API_KEY is accepted as a legacy alias for the same server key.
OPENAI_API_KEY=
GEMINI_API_KEY=
PUBLIC_ANALYZER_ORIGIN=http://127.0.0.1:3920
HOST=0.0.0.0
PORT=3920
DEMO_MODE=true
DEMO_DAILY_LIMIT=40
`);

rw('DEPLOY_CHAMPIONSHIP.md', (t) => {
  t = t.replace(/라이브 Gemini/g, '라이브 OpenAI GPT');
  t = t.replace(
    /\| `GEMINI_API_KEY` \| 서버 사이드 데모 키 \(필수, 심사자 키 입력 불필요\) \|/,
    `| \`OPENAI_API_KEY\` | 서버 사이드 데모 키 (필수, 심사자 키 입력 불필요). \`GEMINI_API_KEY\`도 동일 용도 alias |`
  );
  t = t.replace(/set GEMINI_API_KEY=your_key/g, 'set OPENAI_API_KEY=your_key');
  t = t.replace(
    /Variables에 `GEMINI_API_KEY`/,
    'Variables에 `OPENAI_API_KEY`'
  );
  t = t.replace(
    /\(`GEMINI_API_KEY` 있을 때\)/,
    '(`OPENAI_API_KEY` 있을 때)'
  );
  return t;
});

rw('analyzer/ai/gate.js', (t) => {
  // also hit /api/verify-openai first with fallback
  t = t.replace(
    `const vr = await fetch('/api/verify-gemini', {`,
    `const vr = await fetch('/api/verify-openai', {`
  );
  return t;
});

console.log('done');
