/**
 * Finish OpenAI migration (server already cleaned). Extension + env + docs + verify alias.
 */
import fs from 'node:fs';

function rw(file, fn) {
  let t = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const next = fn(t);
  if (next == null) throw new Error(`no change: ${file}`);
  fs.writeFileSync(file, next.replace(/\n/g, '\r\n'), 'utf8');
  console.log('ok', file);
}

rw('analyzer-server.mjs', (t) => {
  if (!t.includes("/api/verify-openai")) {
    t = t.replace(
      `if (req.method === 'POST' && url.pathname === '/api/verify-gemini') {`,
      `if (req.method === 'POST' && (url.pathname === '/api/verify-gemini' || url.pathname === '/api/verify-openai')) {`
    );
  }
  if (!t.includes("url.pathname !== '/api/verify-openai'")) {
    t = t.replace(
      `url.pathname !== '/api/verify-gemini' &&`,
      `url.pathname !== '/api/verify-gemini' &&\n    url.pathname !== '/api/verify-openai' &&`
    );
  }
  t = t.replace(
    /json\(res, 400, \{ ok: false, error: 'X-Gemini-Key[^']*' \}\);/,
    `json(res, 400, { ok: false, error: 'X-OpenAI-Key 또는 X-Gemini-Key 헤더가 필요합니다.' });`
  );
  return t;
});

rw('extension/bridge-analyzer.js', (t) => {
  t = t.replace(
    /ulsaGeminiApiKey: d\.apiKey,\s*ulsaGeminiModel: d\.model \|\| 'gemini-2\.5-flash',\s*ulsaGeminiVerifiedAt: d\.verifiedAt \|\| Date\.now\(\),/g,
    `ulsaOpenAiApiKey: d.apiKey,
        ulsaOpenAiModel: d.model || 'gpt-5.6-terra',
        ulsaOpenAiVerifiedAt: d.verifiedAt || Date.now(),
        ulsaGeminiApiKey: d.apiKey,
        ulsaGeminiModel: d.model || 'gpt-5.6-terra',
        ulsaGeminiVerifiedAt: d.verifiedAt || Date.now(),`
  );
  t = t.replace(
    /ulsaGeminiApiKey: ev\.data\.apiKey,\s*ulsaGeminiModel: ev\.data\.model \|\| 'gemini-2\.5-flash',\s*ulsaGeminiVerifiedAt: ev\.data\.verifiedAt \|\| Date\.now\(\),/g,
    `ulsaOpenAiApiKey: ev.data.apiKey,
        ulsaOpenAiModel: ev.data.model || 'gpt-5.6-terra',
        ulsaOpenAiVerifiedAt: ev.data.verifiedAt || Date.now(),
        ulsaGeminiApiKey: ev.data.apiKey,
        ulsaGeminiModel: ev.data.model || 'gpt-5.6-terra',
        ulsaGeminiVerifiedAt: ev.data.verifiedAt || Date.now(),`
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

  // storage reads
  t = t.replace(
    /chrome\.storage\.local\.get\(\['ulsaGeminiApiKey', 'ulsaGeminiModel', 'ulsaGeminiVerifiedAt'\]\)/g,
    `chrome.storage.local.get([
    'ulsaOpenAiApiKey',
    'ulsaOpenAiModel',
    'ulsaOpenAiVerifiedAt',
    'ulsaGeminiApiKey',
    'ulsaGeminiModel',
    'ulsaGeminiVerifiedAt',
  ])`
  );
  t = t.replace(
    /let apiKey = typeof st\.ulsaGeminiApiKey === 'string' \? st\.ulsaGeminiApiKey\.trim\(\) : '';/g,
    `let apiKey =
    (typeof st.ulsaOpenAiApiKey === 'string' && st.ulsaOpenAiApiKey.trim()) ||
    (typeof st.ulsaGeminiApiKey === 'string' && st.ulsaGeminiApiKey.trim()) ||
    '';`
  );
  t = t.replace(
    /apiKey = typeof st\.ulsaGeminiApiKey === 'string' \? st\.ulsaGeminiApiKey\.trim\(\) : '';/g,
    `apiKey =
      (typeof st.ulsaOpenAiApiKey === 'string' && st.ulsaOpenAiApiKey.trim()) ||
      (typeof st.ulsaGeminiApiKey === 'string' && st.ulsaGeminiApiKey.trim()) ||
      '';`
  );
  t = t.replace(/st\.ulsaGeminiModel \|\| 'gemini-2\.5-flash'/g, "st.ulsaOpenAiModel || st.ulsaGeminiModel || 'gpt-5.6-terra'");
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
  t = t.replace(/Variables에 `GEMINI_API_KEY`/, 'Variables에 `OPENAI_API_KEY`');
  t = t.replace(/\(`GEMINI_API_KEY` 있을 때\)/, '(`OPENAI_API_KEY` 있을 때)');
  return t;
});

rw('analyzer/ai/gate.js', (t) => {
  t = t.replace(`fetch('/api/verify-gemini',`, `fetch('/api/verify-openai',`);
  return t;
});

// Ensure MODEL_OPTIONS keeps gpt-5.6+ (already in config) — add a couple aliases if missing
rw('analyzer/ai/config.js', (t) => {
  if (!t.includes("'gpt-5.6-pro'")) {
    t = t.replace(
      `{ value: 'gpt-5.6-luna', label: 'GPT-5.6 Luna (빠름·저비용)' },`,
      `{ value: 'gpt-5.6-luna', label: 'GPT-5.6 Luna (빠름·저비용)' },
    { value: 'gpt-5.6-pro', label: 'GPT-5.6 Pro' },`
    );
  }
  return t;
});

console.log('done');
