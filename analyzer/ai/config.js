/** OpenAI / AI 설정 키 (로컬스토리지) — 확장 chrome.storage와 동기화 */
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
    { value: 'gpt-5.6-pro', label: 'GPT-5.6 Pro' },
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
