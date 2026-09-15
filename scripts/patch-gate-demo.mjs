import fs from 'node:fs';

const p = 'analyzer/ai/gate.js';
let t = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

if (!t.includes('tryUnlockDemoMode')) {
  t = t.replace(
    `function initGate() {
    buildModelOptions();
    fillForm();
    bumpLegacyGeminiModel();

    document.getElementById('aiGateForm')?.addEventListener('submit', (ev) => void onSave(ev));

    document.getElementById('btnAiSettings')?.addEventListener('click', () => {
      openSettings();
    });

    const u = K();
    if (isConfigured()) {
      const apiKey = localStorage.getItem(u.STORAGE_KEY_API);
      const model = localStorage.getItem(u.STORAGE_KEY_MODEL) || u.DEFAULT_MODEL;
      const verifiedAt = Number(localStorage.getItem(u.STORAGE_KEY_VERIFIED_AT)) || Date.now();
      syncToExtension(apiKey, model, verifiedAt);
      applyUnlock();
    } else {
      applyLock();
    }
  }`,
    `async function tryUnlockDemoMode() {
    try {
      const res = await fetch('/api/demo/status');
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.serverKey) return false;
      const u = K();
      const token = String(data.serverKeyToken || '__SERVER_DEMO__');
      const model = localStorage.getItem(u.STORAGE_KEY_MODEL) || u.DEFAULT_MODEL;
      localStorage.setItem(u.STORAGE_KEY_API, token);
      localStorage.setItem(u.STORAGE_KEY_VERIFIED_AT, String(Date.now()));
      localStorage.setItem('ulsa_demo_mode', '1');
      syncToExtension(token, model, Date.now());
      applyUnlock();
      return true;
    } catch {
      return false;
    }
  }

  async function initGate() {
    buildModelOptions();
    fillForm();
    bumpLegacyGeminiModel();

    document.getElementById('aiGateForm')?.addEventListener('submit', (ev) => void onSave(ev));

    document.getElementById('btnAiSettings')?.addEventListener('click', () => {
      openSettings();
    });

    const u = K();
    if (isConfigured()) {
      const apiKey = localStorage.getItem(u.STORAGE_KEY_API);
      const model = localStorage.getItem(u.STORAGE_KEY_MODEL) || u.DEFAULT_MODEL;
      const verifiedAt = Number(localStorage.getItem(u.STORAGE_KEY_VERIFIED_AT)) || Date.now();
      syncToExtension(apiKey, model, verifiedAt);
      applyUnlock();
    } else if (await tryUnlockDemoMode()) {
      /* server-side demo key unlock */
    } else {
      applyLock();
    }
  }`
  );
}

t = t.replace(
  `    const port = location.port || '3920';
    const origin = \`http://\${location.hostname}:\${port}\`;

    if (err) err.textContent = 'API 키·모델 연결 테스트 중…';
    if (submitBtn) submitBtn.disabled = true;

    try {
      const vr = await fetch(\`\${origin}/api/verify-gemini\`, {`,
  `    if (err) err.textContent = 'API 키·모델 연결 테스트 중…';
    if (submitBtn) submitBtn.disabled = true;

    try {
      const vr = await fetch('/api/verify-gemini', {`
);

fs.writeFileSync(p, t.replace(/\n/g, '\r\n'), 'utf8');
console.log('gate.js patched', t.includes('tryUnlockDemoMode'));
