/** 첫 방문 시 API 미입력이면 본문 전체 비활성(게이트) — 저장 전 서버에서 키·모델 검증 */
(() => {
  const K = () => globalThis.UlsaAi;

  function readApiKey() {
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
  }

  function fillForm() {
    const u = K();
    if (!u) return;
    const api = document.getElementById('aiApiKey');
    const model = document.getElementById('aiModel');
    if (api) api.value = readApiKey();
    if (model) {
      const saved = readModel();
      model.value = [...model.options].some((o) => o.value === saved) ? saved : u.DEFAULT_MODEL;
    }
  }

  function buildModelOptions() {
    const u = K();
    const sel = document.getElementById('aiModel');
    if (!sel || !u?.MODEL_OPTIONS) return;
    sel.innerHTML = u.MODEL_OPTIONS.map(
      (o) => `<option value="${escapeAttr(o.value)}">${escapeHtml(o.label)}</option>`
    ).join('');
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

  /** 확장 프로그램 storage와 동기화 — CustomEvent(페이지↔콘텐츠 스크립트에서 window.postMessage보다 안정적) */
  function syncToExtension(apiKey, model, verifiedAt) {
    const u = K();
    document.dispatchEvent(
      new CustomEvent('ulsa-ai-settings', {
        bubbles: true,
        composed: true,
        detail: {
          apiKey,
          model: model || u?.DEFAULT_MODEL || 'gpt-5.6-terra',
          verifiedAt: verifiedAt || Date.now(),
        },
      })
    );
    window.postMessage(
      {
        type: 'ULSA_AI_SETTINGS',
        apiKey,
        model: model || u?.DEFAULT_MODEL || 'gpt-5.6-terra',
        verifiedAt: verifiedAt || Date.now(),
      },
      '*'
    );
  }

  function applyUnlock() {
    const gate = document.getElementById('aiGate');
    const shell = document.getElementById('appShell');
    const err = document.getElementById('aiGateError');
    if (err) err.textContent = '';
    if (gate) {
      gate.hidden = true;
      gate.setAttribute('aria-hidden', 'true');
    }
    if (shell) {
      shell.classList.remove('app-shell--locked');
      shell.removeAttribute('inert');
    }
    globalThis.__ulsaAiReady = true;
    window.dispatchEvent(new CustomEvent('ulsa:ai-ready'));
  }

  function applyLock() {
    const gate = document.getElementById('aiGate');
    const shell = document.getElementById('appShell');
    if (gate) {
      gate.hidden = false;
      gate.setAttribute('aria-hidden', 'false');
    }
    if (shell) {
      shell.classList.add('app-shell--locked');
      shell.setAttribute('inert', '');
    }
    globalThis.__ulsaAiReady = false;
  }

  async function onSave(e) {
    e.preventDefault();
    const u = K();
    const apiKey = document.getElementById('aiApiKey')?.value?.trim() || '';
    const model = document.getElementById('aiModel')?.value || u?.DEFAULT_MODEL || 'gpt-5.6-terra';
    const err = document.getElementById('aiGateError');
    const form = document.getElementById('aiGateForm');
    const submitBtn = form?.querySelector('button[type="submit"]');

    if (!apiKey) {
      if (err) err.textContent = 'platform.openai.com에서 발급한 OpenAI API 키를 입력하세요.';
      return;
    }

    if (err) err.textContent = 'API 키·모델 연결 테스트 중…';
    if (submitBtn) submitBtn.disabled = true;

    try {
      const vr = await fetch('/api/verify-openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-OpenAI-Key': apiKey,
          'X-OpenAI-Model': model,
          'X-Gemini-Key': apiKey,
          'X-Gemini-Model': model,
        },
        body: JSON.stringify({}),
      });
      const data = await vr.json().catch(() => ({}));
      if (!vr.ok) {
        throw new Error(data.error || data.message || `HTTP ${vr.status}`);
      }
      const verifiedAt = Date.now();
      localStorage.setItem(u.STORAGE_KEY_API, apiKey);
      localStorage.setItem(u.STORAGE_KEY_MODEL, model);
      localStorage.setItem(u.STORAGE_KEY_VERIFIED_AT, String(verifiedAt));
      if (u.STORAGE_KEY_API_LEGACY) localStorage.setItem(u.STORAGE_KEY_API_LEGACY, apiKey);
      if (u.STORAGE_KEY_MODEL_LEGACY) localStorage.setItem(u.STORAGE_KEY_MODEL_LEGACY, model);
      if (u.STORAGE_KEY_VERIFIED_AT_LEGACY) localStorage.setItem(u.STORAGE_KEY_VERIFIED_AT_LEGACY, String(verifiedAt));
      syncToExtension(apiKey, model, verifiedAt);
      applyUnlock();
    } catch (ex) {
      const msg = ex instanceof Error ? ex.message : String(ex);
      if (err)
        err.textContent =
          msg.length > 220
            ? `${msg.slice(0, 220)}…`
            : msg || '연결 테스트에 실패했습니다. 키·모델·서버(node analyzer-server.mjs)를 확인하세요.';
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  function openSettings() {
    applyLock();
    fillForm();
    document.getElementById('aiApiKey')?.focus();
  }

  /** Google이 신규 키에서 2.0 Flash 사용 중단 시 레거시 저장값 보정 */
  function bumpLegacyGeminiModel() {
    const u = K();
    if (!u) return;
    const raw = readModel();
    if (/^gemini-/i.test(raw)) {
      localStorage.setItem(u.STORAGE_KEY_MODEL, u.DEFAULT_MODEL);
      if (u.STORAGE_KEY_MODEL_LEGACY) localStorage.setItem(u.STORAGE_KEY_MODEL_LEGACY, u.DEFAULT_MODEL);
      const sel = document.getElementById('aiModel');
      if (sel) sel.value = u.DEFAULT_MODEL;
    }
  }

  async function tryUnlockDemoMode() {
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
      const apiKey = readApiKey();
      const model = readModel() || u.DEFAULT_MODEL;
      const verifiedAt = Number(readVerifiedAt()) || Date.now();
      syncToExtension(apiKey, model, verifiedAt);
      applyUnlock();
    } else if (await tryUnlockDemoMode()) {
      /* server-side demo key unlock */
    } else {
      applyLock();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGate);
  } else {
    initGate();
  }
})();
