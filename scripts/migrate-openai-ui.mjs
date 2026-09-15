import fs from 'node:fs';

function rw(file, fn) {
  let t = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const next = fn(t);
  fs.writeFileSync(file, next.replace(/\n/g, '\r\n'), 'utf8');
  console.log('ok', file);
}

rw('analyzer/ai/client.js', (t) => {
  t = t.replace(
    /return 'Gemini API 사용량 한도를 초과했습니다\.[\s\S]*?재시도하세요\.';/,
    `return 'OpenAI API 사용량 한도를 초과했습니다. platform.openai.com 결제/쿼터를 확인하거나, 잠시 후 다시 시도하거나, 다른 API 키를 저장한 뒤 재시도하세요.';`
  );
  t = t.replace(
    `UlsaAi.getStoredModel = () =>
    localStorage.getItem(UlsaAi.STORAGE_KEY_MODEL) || UlsaAi.DEFAULT_MODEL;`,
    `UlsaAi.getStoredModel = () =>
    (typeof UlsaAi.readStoredModel === 'function' ? UlsaAi.readStoredModel() : null) ||
    localStorage.getItem(UlsaAi.STORAGE_KEY_MODEL) ||
    UlsaAi.DEFAULT_MODEL;`
  );
  // headers helper in postJson
  t = t.replace(
    `    if (p.apiKey) headers['X-Gemini-Key'] = p.apiKey;
    if (model) headers['X-Gemini-Model'] = model;`,
    `    if (p.apiKey) {
      headers['X-OpenAI-Key'] = p.apiKey;
      headers['X-Gemini-Key'] = p.apiKey;
    }
    if (model) {
      headers['X-OpenAI-Model'] = model;
      headers['X-Gemini-Model'] = model;
    }`
  );
  t = t.replace(/'X-Gemini-Key': p\.apiKey,\s*'X-Gemini-Model': model,/g, `'X-OpenAI-Key': p.apiKey,\n        'X-OpenAI-Model': model,\n        'X-Gemini-Key': p.apiKey,\n        'X-Gemini-Model': model,`);
  return t;
});

rw('analyzer/ai/gate.js', (t) => {
  t = t.replace(
    `function isConfigured() {
    const u = K();
    if (!u) return false;
    const key = localStorage.getItem(u.STORAGE_KEY_API);
    const verified = localStorage.getItem(u.STORAGE_KEY_VERIFIED_AT);
    if (typeof key !== 'string' || !key.trim() || verified == null || verified === '') return false;
    // server demo token must be re-validated via /api/demo/status
    if (key.trim() === '__SERVER_DEMO__' || localStorage.getItem('ulsa_demo_mode') === '1') return false;
    return true;
  }`,
    `function readApiKey() {
    const u = K();
    if (!u) return '';
    if (typeof u.readStoredApiKey === 'function') return u.readStoredApiKey();
    return localStorage.getItem(u.STORAGE_KEY_API)?.trim() || '';
  }

  function readModel() {
    const u = K();
    if (!u) return 'gpt-5.6-terra';
    if (typeof u.readStoredModel === 'function') return u.readStoredModel();
    return localStorage.getItem(u.STORAGE_KEY_MODEL) || u.DEFAULT_MODEL;
  }

  function readVerifiedAt() {
    const u = K();
    if (!u) return '';
    if (typeof u.readStoredVerifiedAt === 'function') return u.readStoredVerifiedAt();
    return localStorage.getItem(u.STORAGE_KEY_VERIFIED_AT) || '';
  }

  function isConfigured() {
    const u = K();
    if (!u) return false;
    const key = readApiKey();
    const verified = readVerifiedAt();
    if (!key || verified == null || verified === '') return false;
    if (key === '__SERVER_DEMO__' || localStorage.getItem('ulsa_demo_mode') === '1') return false;
    return true;
  }`
  );

  t = t.replace(
    `    if (api) api.value = localStorage.getItem(u.STORAGE_KEY_API) || '';
    if (model) {
      const saved = localStorage.getItem(u.STORAGE_KEY_MODEL) || u.DEFAULT_MODEL;
      model.value = [...model.options].some((o) => o.value === saved) ? saved : u.DEFAULT_MODEL;
    }`,
    `    if (api) api.value = readApiKey();
    if (model) {
      const saved = readModel();
      model.value = [...model.options].some((o) => o.value === saved) ? saved : u.DEFAULT_MODEL;
    }`
  );

  t = t.replace(
    `    if (err) err.textContent = 'Google AI Studio에서 발급한 Gemini API 키를 입력하세요.';`,
    `    if (err) err.textContent = 'platform.openai.com에서 발급한 OpenAI API 키를 입력하세요.';`
  );

  t = t.replace(
    `          'X-Gemini-Key': apiKey,
          'X-Gemini-Model': model,`,
    `          'X-OpenAI-Key': apiKey,
          'X-OpenAI-Model': model,
          'X-Gemini-Key': apiKey,
          'X-Gemini-Model': model,`
  );

  t = t.replace(
    `      localStorage.setItem(u.STORAGE_KEY_API, apiKey);
      localStorage.setItem(u.STORAGE_KEY_MODEL, model);
      localStorage.setItem(u.STORAGE_KEY_VERIFIED_AT, String(verifiedAt));`,
    `      localStorage.setItem(u.STORAGE_KEY_API, apiKey);
      localStorage.setItem(u.STORAGE_KEY_MODEL, model);
      localStorage.setItem(u.STORAGE_KEY_VERIFIED_AT, String(verifiedAt));
      if (u.STORAGE_KEY_API_LEGACY) localStorage.setItem(u.STORAGE_KEY_API_LEGACY, apiKey);
      if (u.STORAGE_KEY_MODEL_LEGACY) localStorage.setItem(u.STORAGE_KEY_MODEL_LEGACY, model);
      if (u.STORAGE_KEY_VERIFIED_AT_LEGACY) localStorage.setItem(u.STORAGE_KEY_VERIFIED_AT_LEGACY, String(verifiedAt));`
  );

  t = t.replace(
    `  function bumpLegacyGeminiModel() {
    const u = K();
    if (!u) return;
    const raw = localStorage.getItem(u.STORAGE_KEY_MODEL);
    if (raw === 'gemini-2.0-flash') {
      localStorage.setItem(u.STORAGE_KEY_MODEL, u.DEFAULT_MODEL);
      const sel = document.getElementById('aiModel');
      if (sel) sel.value = u.DEFAULT_MODEL;
    }
  }`,
    `  function bumpLegacyGeminiModel() {
    const u = K();
    if (!u) return;
    const raw = readModel();
    if (/^gemini-/i.test(raw)) {
      localStorage.setItem(u.STORAGE_KEY_MODEL, u.DEFAULT_MODEL);
      if (u.STORAGE_KEY_MODEL_LEGACY) localStorage.setItem(u.STORAGE_KEY_MODEL_LEGACY, u.DEFAULT_MODEL);
      const sel = document.getElementById('aiModel');
      if (sel) sel.value = u.DEFAULT_MODEL;
    }
  }`
  );

  t = t.replace(
    `    if (isConfigured()) {
      const apiKey = localStorage.getItem(u.STORAGE_KEY_API);
      const model = localStorage.getItem(u.STORAGE_KEY_MODEL) || u.DEFAULT_MODEL;
      const verifiedAt = Number(localStorage.getItem(u.STORAGE_KEY_VERIFIED_AT)) || Date.now();
      syncToExtension(apiKey, model, verifiedAt);
      applyUnlock();`,
    `    if (isConfigured()) {
      const apiKey = readApiKey();
      const model = readModel() || u.DEFAULT_MODEL;
      const verifiedAt = Number(readVerifiedAt()) || Date.now();
      syncToExtension(apiKey, model, verifiedAt);
      applyUnlock();`
  );

  t = t.replace(
    `model: model || u?.DEFAULT_MODEL || 'gemini-2.5-flash'`,
    `model: model || u?.DEFAULT_MODEL || 'gpt-5.6-terra'`
  );
  t = t.replace(
    /gemini-2\.5-flash/g,
    'gpt-5.6-terra'
  );

  return t;
});

rw('analyzer/index.html', (t) => {
  t = t.replace('Gemini API 설정', 'OpenAI API 설정');
  t = t.replace(
    /대회 데모 서버에 API 키가 설정돼 있으면 이 화면 없이 바로 시작할 수 있습니다\.\s*개인 키로 쓰려면[\s\S]*?<strong>저장할 때마다 서버가 Google API로 연결을 테스트합니다\.<\/strong>/,
    `대회 데모 서버에 API 키가 설정돼 있으면 이 화면 없이 바로 시작할 수 있습니다.
          개인 키로 쓰려면
          <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">OpenAI Platform</a>
          에서 발급한 API 키를 입력하세요. 키는 이 브라우저에만 저장됩니다.
          <strong>저장할 때마다 서버가 OpenAI API로 연결을 테스트합니다.</strong>`
  );
  t = t.replace('>Gemini 모델<', '>OpenAI 모델<');
  t = t.replace(/config\.js\?v=[^\"]+/, 'config.js?v=20260916-openai');
  t = t.replace(/client\.js\?v=[^\"]+/, 'client.js?v=20260916-openai');
  t = t.replace(/gate\.js\?v=[^\"]+/, 'gate.js?v=20260916-openai');
  t = t.replace(/app\.js\?v=[^\"]+/, 'app.js?v=20260916-openai');
  return t;
});

rw('analyzer/app.js', (t) => {
  t = t.replace(
    `function getAiApiKey() {
  const keyName = globalThis.UlsaAi?.STORAGE_KEY_API;
  return keyName ? localStorage.getItem(keyName)?.trim() || '' : '';
}`,
    `function getAiApiKey() {
  if (typeof globalThis.UlsaAi?.readStoredApiKey === 'function') {
    return globalThis.UlsaAi.readStoredApiKey();
  }
  const keyName = globalThis.UlsaAi?.STORAGE_KEY_API;
  return keyName ? localStorage.getItem(keyName)?.trim() || '' : '';
}`
  );
  t = t.replace(
    '스택: Chrome MV3 확장 · Node 분석 서버 · Gemini(검색·멀티모달·JSON 파이프라인)',
    '스택: Chrome MV3 확장 · Node 분석 서버 · OpenAI GPT(검색·멀티모달·JSON 파이프라인)'
  );
  t = t.replace(
    /\/429\|quota\|rate limit\|한도\|timeout\|Failed to fetch\|네트워크\|GEMINI\|사용량\/i/,
    '/429|quota|rate limit|한도|timeout|Failed to fetch|네트워크|GEMINI|OPENAI|사용량/i'
  );
  t = t.replace(
    'AI 설정이 필요합니다. AI 설정에서 Gemini API 키를 저장한 뒤 다시 시도하세요.',
    'AI 설정이 필요합니다. AI 설정에서 OpenAI API 키를 저장한 뒤 다시 시도하세요.'
  );
  return t;
});

console.log('client/gate/ui patched');
