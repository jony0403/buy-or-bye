/** 첫 방문 시 API 미입력이면 본문 전체 비활성(게이트) — 저장 전 서버에서 키·모델 검증 */
(() => {
  const K = () => globalThis.UlsaAi;

  function isConfigured() {
    const u = K();
    if (!u) return false;
    const key = localStorage.getItem(u.STORAGE_KEY_API);
    const verified = localStorage.getItem(u.STORAGE_KEY_VERIFIED_AT);
    return typeof key === 'string' && key.trim().length > 0 && verified != null && verified !== '';
  }

  function fillForm() {
    const u = K();
    if (!u) return;
    const api = document.getElementById('aiApiKey');
    const model = document.getElementById('aiModel');
    if (api) api.value = localStorage.getItem(u.STORAGE_KEY_API) || '';
    if (model) {
      const saved = localStorage.getItem(u.STORAGE_KEY_MODEL) || u.DEFAULT_MODEL;
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
          model: model || u?.DEFAULT_MODEL || 'gemini-2.5-flash',
          verifiedAt: verifiedAt || Date.now(),
        },
      })
    );
    window.postMessage(
      {
        type: 'ULSA_AI_SETTINGS',
        apiKey,
        model: model || u?.DEFAULT_MODEL || 'gemini-2.5-flash',
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
    const model = document.getElementById('aiModel')?.value || u?.DEFAULT_MODEL || 'gemini-2.5-flash';
    const err = document.getElementById('aiGateError');
    const form = document.getElementById('aiGateForm');
    const submitBtn = form?.querySelector('button[type="submit"]');

    if (!apiKey) {
      if (err) err.textContent = 'Google AI Studio에서 발급한 Gemini API 키를 입력하세요.';
      return;
    }

    const port = location.port || '3920';
    const origin = `http://${location.hostname}:${port}`;

    if (err) err.textContent = 'API 키·모델 연결 테스트 중…';
    if (submitBtn) submitBtn.disabled = true;

    try {
      const vr = await fetch(`${origin}/api/verify-gemini`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
    const raw = localStorage.getItem(u.STORAGE_KEY_MODEL);
    if (raw === 'gemini-2.0-flash') {
      localStorage.setItem(u.STORAGE_KEY_MODEL, u.DEFAULT_MODEL);
      const sel = document.getElementById('aiModel');
      if (sel) sel.value = u.DEFAULT_MODEL;
    }
  }

  function initGate() {
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGate);
  } else {
    initGate();
  }
})();
