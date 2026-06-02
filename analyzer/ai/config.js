/** Gemini / AI 설정 키 (로컬스토리지) — 확장 chrome.storage 키와 동일 값 사용 */
(() => {
  globalThis.UlsaAi = globalThis.UlsaAi || {};
  UlsaAi.STORAGE_KEY_API = 'ulsa_gemini_api_key';
  UlsaAi.STORAGE_KEY_MODEL = 'ulsa_gemini_model';
  UlsaAi.STORAGE_KEY_VERIFIED_AT = 'ulsa_gemini_verified_at';
  /** 기본 모델 (가성비 최강 1.5 Flash) */
  UlsaAi.DEFAULT_MODEL = 'gemini-1.5-flash';
  /** 「이게 아니에요」 재식별 시에만 사용 (정확도 우선) */
  UlsaAi.RETRY_MODEL = 'gemini-1.5-pro';
  /** 선택 목록 (가성비 모델 우선 배치) */
  UlsaAi.MODEL_OPTIONS = [
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (가성비·권장)' },
    { value: 'gemini-1.5-flash-8b', label: 'Gemini 1.5 Flash-8B (가장 저렴)' },
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (빠르고 정확)' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (고정밀·비쌈)' },
  ];
})();
