/** Gemini / AI 설정 키 (로컬스토리지) — 확장 chrome.storage와 동일 키 사용 */
(() => {
  globalThis.UlsaAi = globalThis.UlsaAi || {};
  UlsaAi.STORAGE_KEY_API = 'ulsa_gemini_api_key';
  UlsaAi.STORAGE_KEY_API_LEGACY = 'ulsa_openai_api_key';
  UlsaAi.STORAGE_KEY_MODEL = 'ulsa_gemini_model';
  UlsaAi.STORAGE_KEY_MODEL_LEGACY = 'ulsa_openai_model';
  UlsaAi.STORAGE_KEY_VERIFIED_AT = 'ulsa_gemini_verified_at';
  UlsaAi.STORAGE_KEY_VERIFIED_AT_LEGACY = 'ulsa_openai_verified_at';
  /** 기본 모델 — 2.5 Flash는 신규 키 차단, 3.6은 느려서 lite를 기본으로 */
  UlsaAi.DEFAULT_MODEL = 'gemini-3.5-flash-lite';
  UlsaAi.RETRY_MODEL = 'gemini-3.5-flash';
  UlsaAi.MODEL_OPTIONS = [
    { value: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash-Lite (기본·빠름)' },
    { value: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash' },
    { value: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash (고품질·느림)' },
    { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash Preview' },
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (레거시·신규키 불가)' },
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
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
