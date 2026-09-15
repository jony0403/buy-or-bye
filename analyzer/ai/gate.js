/** 데모/서버 키로 바로 시작. AI 설정 UI는 개발자만 시크릿으로 연다. */
(() => {
  const K = () => globalThis.UlsaAi;
  const DEV_FLAG = 'ulsa_dev_settings';

  function readApiKey() {
    const u = K();
    if (!u) return '';
    if (typeof u.readStoredApiKey === 'function') return u.readStoredApiKey();
    return localStorage.getItem(u.STORAGE_KEY_API)?.trim() || '';
  }

  function readModel() {
    const u = K();
    if (!u) return 'gemini-3.5-flash-lite';
    if (typeof u.readStoredModel === 'function') return u.readStoredModel();
    return localStorage.getItem(u.STORAGE_KEY_MODEL) || u.DEFAULT_MODEL;
  }

  function readVerifiedAt() {
    const u = K();
    if (!u) return '';
    if (typeof u.readStoredVerifiedAt === 'function') return u.readStoredVerifiedAt();
    return localStorage.getItem(u.STORAGE_KEY_VERIFIED_AT) || '';
  }

  function isDevSettingsEnabled() {
    const q = new URLSearchParams(location.search);
    if (q.get('devSettings') === '1') return true;
    if (location.hash === '#dev-settings') return true;
    return false;
  }

  function syncDevBodyClass() {
    document.body?.classList.toggle('ulsa-dev-settings', isDevSettingsEnabled());
  }

  function hidePublicSettingsUi() {
    document.body?.classList.remove('ulsa-dev-settings');
    try {
      localStorage.removeItem(DEV_FLAG);
    } catch {
      /* ignore */
    }
    document.querySelectorAll('[data-rail-action="settings"], #btnAiSettings, [data-help-settings]').forEach((el) => {
      el.remove();
    });
    document.querySelectorAll('.help-shortcuts div').forEach((row) => {
      if (/AI 설정|설정\s*\(S\)|^설정$/i.test(row.textContent || '')) row.remove();
    });
    const gate = document.getElementById('aiGate');
    if (gate) {
      gate.hidden = true;
      gate.setAttribute('aria-hidden', 'true');
    }
  }

  function ensureDevSettingsButtons() {
    if (!isDevSettingsEnabled()) return;
    const shortcutsBtn = document.querySelector('[data-rail-action="shortcuts"]');
    if (shortcutsBtn && !document.querySelector('[data-rail-action="settings"]')) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dashboard-rail__btn';
      btn.setAttribute('data-rail-action', 'settings');
      btn.setAttribute('aria-label', 'AI 설정');
      btn.title = 'AI 설정 (S)';
      btn.innerHTML =
        '<span class="material-symbols-rounded" aria-hidden="true">settings</span><small>설정</small>';
      shortcutsBtn.insertAdjacentElement('afterend', btn);
    }
    if (!document.getElementById('btnAiSettings')) {
      const actions = document.querySelector('.top-actions');
      if (actions) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'btnAiSettings';
        btn.className = 'btn btn-secondary btn-small';
        btn.title = 'AI 설정 (S)';
        btn.textContent = 'AI 설정';
        const refresh = document.getElementById('btnRefresh');
        if (refresh) actions.insertBefore(btn, refresh);
        else actions.appendChild(btn);
      }
    }
  }

  function showDevSettingsUi() {
    document.body?.classList.add('ulsa-dev-settings');
    ensureDevSettingsButtons();
    document.querySelectorAll('[data-rail-action="settings"], #btnAiSettings').forEach((el) => {
      el.hidden = false;
      el.removeAttribute('aria-hidden');
      el.style.display = '';
      el.addEventListener('click', () => openSettings());
    });
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
    if (api) api.value = readApiKey() === '__SERVER_DEMO__' ? '' : readApiKey();
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

  function syncToExtension(apiKey, model, verifiedAt) {
    const u = K();
    const m = model || u?.DEFAULT_MODEL || 'gemini-3.5-flash-lite';
    document.dispatchEvent(
      new CustomEvent('ulsa-ai-settings', {
        bubbles: true,
        composed: true,
        detail: { apiKey, model: m, verifiedAt: verifiedAt || Date.now() },
      })
    );
    window.postMessage({ type: 'ULSA_AI_SETTINGS', apiKey, model: m, verifiedAt: verifiedAt || Date.now() }, '*');
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
    if (!isDevSettingsEnabled()) {
      applyUnlock();
      return;
    }
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

  function hideApiFatalError() {
    const modal = document.getElementById('apiFatalModal');
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    const retry = modal.querySelector('[data-api-fatal-retry]');
    if (retry) {
      retry.hidden = true;
      retry.onclick = null;
    }
  }

  function showApiFatalError(opts = {}) {
    const modal = document.getElementById('apiFatalModal');
    if (!modal) {
      window.alert(String(opts.body || opts.message || opts.title || 'API 오류가 발생했습니다.'));
      return;
    }
    const titleEl = document.getElementById('apiFatalTitle');
    const bodyEl = document.getElementById('apiFatalBody');
    const retry = modal.querySelector('[data-api-fatal-retry]');
    if (titleEl) titleEl.textContent = opts.title || '분석을 진행할 수 없습니다';
    if (bodyEl) {
      bodyEl.textContent = String(opts.body || opts.message || '알 수 없는 API 오류가 발생했습니다.');
    }
    if (retry) {
      if (typeof opts.onRetry === 'function') {
        retry.hidden = false;
        retry.onclick = () => {
          hideApiFatalError();
          try {
            opts.onRetry();
          } catch {
            /* ignore */
          }
        };
      } else {
        retry.hidden = true;
        retry.onclick = null;
      }
    }
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
  }

  function classifyApiFatal(raw) {
    const msg = String(raw || '');
    if (!msg.trim()) return null;
    if (/(api\s*key|api키|invalid.?api|unauthorized|401|403|permission.?denied|missing.+key|서버에.+키|gemini.+key)/i.test(msg)) {
      return {
        title: 'API 키 오류',
        body:
          msg +
          '\n\n배포 환경이라면 Railway(또는 호스팅)의 GEMINI_API_KEY 환경변수를 확인하세요. 개인 키 테스트는 주소에 ?devSettings=1 을 붙여 개발자 설정에서만 가능합니다.',
      };
    }
    if (/(quota|rate limit|resource_exhausted|429|사용량 한도)/i.test(msg)) {
      return {
        title: 'API 사용량 한도 초과',
        body: msg + '\n\n잠시 후 다시 시도하거나, Google AI Studio 쿼터·결제 상태를 확인하세요.',
      };
    }
    if (/(model.+not found|is not found|unsupported|404.*model)/i.test(msg)) {
      return {
        title: 'Gemini 모델 오류',
        body: msg + '\n\n서버 기본 모델 설정을 확인하거나 개발자 모드에서 다른 모델을 선택하세요.',
      };
    }
    if (/(failed to fetch|networkerror|econnrefused|502|503|504|서버 오류)/i.test(msg)) {
      return {
        title: '서버 연결 오류',
        body: msg + '\n\n분석 서버가 켜져 있는지, 배포 상태가 정상인지 확인하세요.',
      };
    }
    return { title: 'AI 분석 오류', body: msg };
  }

  async function onSave(e) {
    e.preventDefault();
    const u = K();
    const apiKey = document.getElementById('aiApiKey')?.value?.trim() || '';
    const model = document.getElementById('aiModel')?.value || u?.DEFAULT_MODEL || 'gemini-3.5-flash-lite';
    const err = document.getElementById('aiGateError');
    const form = document.getElementById('aiGateForm');
    const submitBtn = form?.querySelector('button[type="submit"]');

    if (!apiKey) {
      if (err) err.textContent = 'Gemini API 키를 입력하세요.';
      return;
    }

    if (err) err.textContent = 'API 키·모델 연결 테스트 중…';
    if (submitBtn) submitBtn.disabled = true;

    try {
      const vr = await fetch('/api/verify-gemini', {
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
      if (!vr.ok) throw new Error(data.error || data.message || `HTTP ${vr.status}`);
      const verifiedAt = Date.now();
      localStorage.setItem(u.STORAGE_KEY_API, apiKey);
      localStorage.setItem(u.STORAGE_KEY_MODEL, model);
      localStorage.setItem(u.STORAGE_KEY_VERIFIED_AT, String(verifiedAt));
      if (u.STORAGE_KEY_API_LEGACY) localStorage.setItem(u.STORAGE_KEY_API_LEGACY, apiKey);
      if (u.STORAGE_KEY_MODEL_LEGACY) localStorage.setItem(u.STORAGE_KEY_MODEL_LEGACY, model);
      if (u.STORAGE_KEY_VERIFIED_AT_LEGACY) localStorage.setItem(u.STORAGE_KEY_VERIFIED_AT_LEGACY, String(verifiedAt));
      localStorage.removeItem('ulsa_demo_mode');
      syncToExtension(apiKey, model, verifiedAt);
      applyUnlock();
    } catch (ex) {
      const msg = ex instanceof Error ? ex.message : String(ex);
      if (err) err.textContent = msg.length > 220 ? `${msg.slice(0, 220)}…` : msg || '연결 테스트 실패';
      showApiFatalError(classifyApiFatal(msg) || { title: 'API 키 검증 실패', body: msg });
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  function openSettings() {
    if (!isDevSettingsEnabled()) return;
    applyLock();
    fillForm();
    document.getElementById('aiApiKey')?.focus();
  }

  /** 폐기/차단·느린 모델을 기본값으로 교체 */
  function bumpLegacyGeminiModel() {
    const u = K();
    if (!u) return;
    const raw = String(readModel() || '');
    const needsBump =
      !raw ||
      /^gpt-/i.test(raw) ||
      /^o[0-9]/i.test(raw) ||
      /^gemini-2\.5-flash/i.test(raw) ||
      /^gemini-2\.0/i.test(raw) ||
      /^gemini-1\./i.test(raw) ||
      /^gemini-3\.6-flash$/i.test(raw);
    if (!needsBump) return;
    localStorage.setItem(u.STORAGE_KEY_MODEL, u.DEFAULT_MODEL);
    if (u.STORAGE_KEY_MODEL_LEGACY) localStorage.setItem(u.STORAGE_KEY_MODEL_LEGACY, u.DEFAULT_MODEL);
    const sel = document.getElementById('aiModel');
    if (sel) sel.value = u.DEFAULT_MODEL;
  }

  async function tryUnlockDemoMode() {
    try {
      const res = await fetch('/api/demo/status', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.serverKey) return false;
      const u = K();
      const token = String(data.serverKeyToken || '__SERVER_DEMO__');
      const model = u.DEFAULT_MODEL || 'gemini-3.5-flash-lite';
      localStorage.setItem(u.STORAGE_KEY_API, token);
      localStorage.setItem(u.STORAGE_KEY_MODEL, model);
      localStorage.setItem(u.STORAGE_KEY_VERIFIED_AT, String(Date.now()));
      if (u.STORAGE_KEY_API_LEGACY) localStorage.setItem(u.STORAGE_KEY_API_LEGACY, token);
      if (u.STORAGE_KEY_MODEL_LEGACY) localStorage.setItem(u.STORAGE_KEY_MODEL_LEGACY, model);
      if (u.STORAGE_KEY_VERIFIED_AT_LEGACY) {
        localStorage.setItem(u.STORAGE_KEY_VERIFIED_AT_LEGACY, String(Date.now()));
      }
      localStorage.setItem('ulsa_demo_mode', '1');
      syncToExtension(token, model, Date.now());
      applyUnlock();
      return true;
    } catch {
      return false;
    }
  }

  function bindFatalModal() {
    const modal = document.getElementById('apiFatalModal');
    modal?.querySelector('[data-api-fatal-close]')?.addEventListener('click', () => hideApiFatalError());
    modal?.addEventListener('click', (ev) => {
      if (ev.target === modal) hideApiFatalError();
    });
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && modal && !modal.hidden) hideApiFatalError();
    });
  }

  async function initGate() {
    // 개발자 모드: 현재 URL에 ?devSettings=1 또는 #dev-settings 가 있을 때만
    // (localStorage 플래그는 공개 배포에서 설정 버튼이 남는 원인이라 쓰지 않음)
    syncDevBodyClass();
    buildModelOptions();
    fillForm();
    bumpLegacyGeminiModel();
    bindFatalModal();

    document.getElementById('aiGateForm')?.addEventListener('submit', (ev) => void onSave(ev));

    if (isDevSettingsEnabled()) showDevSettingsUi();
    else hidePublicSettingsUi();

    // 일반 방문자는 게이트 없이 서버 키로 바로 시작
    if (await tryUnlockDemoMode()) return;

    const u = K();
    if (isConfigured()) {
      const apiKey = readApiKey();
      const model = readModel() || u.DEFAULT_MODEL;
      const verifiedAt = Number(readVerifiedAt()) || Date.now();
      syncToExtension(apiKey, model, verifiedAt);
      applyUnlock();
      return;
    }

    // 서버 키도 개인 설정도 없으면: 게이트는 개발자만, 그 외는 안내 팝업
    if (isDevSettingsEnabled()) {
      applyLock();
    } else {
      applyUnlock();
      showApiFatalError({
        title: '서버 API 키가 없습니다',
        body:
          '공개 배포용으로는 Railway(호스팅) 환경변수 GEMINI_API_KEY 를 설정해야 합니다.\n일반 사용자는 브라우저에 키를 넣지 않습니다.\n\n개발자만 ?devSettings=1 로 개인 키를 테스트할 수 있습니다.',
      });
    }
  }

  globalThis.UlsaAi = globalThis.UlsaAi || {};
  globalThis.UlsaAi.showApiFatalError = showApiFatalError;
  globalThis.UlsaAi.hideApiFatalError = hideApiFatalError;
  globalThis.UlsaAi.classifyApiFatal = classifyApiFatal;
  globalThis.UlsaAi.isDevSettingsEnabled = isDevSettingsEnabled;

  globalThis.__ulsaOpenDevSettings = () => {
    const u = new URL(location.href);
    u.searchParams.set('devSettings', '1');
    location.assign(u.toString());
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => void initGate());
  } else {
    void initGate();
  }
})();
