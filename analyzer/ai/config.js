/** Gemini / AI 설정 키 (로컬스토리지) — 확장 chrome.storage 키와 동일 값 사용 */
(() => {
  globalThis.UlsaAi = globalThis.UlsaAi || {};
  UlsaAi.STORAGE_KEY_API = 'ulsa_gemini_api_key';
  UlsaAi.STORAGE_KEY_MODEL = 'ulsa_gemini_model';
  UlsaAi.STORAGE_KEY_VERIFIED_AT = 'ulsa_gemini_verified_at';
  /** 기본 모델 (Google Generative Language API model id) — 2.0 Flash는 신규 키에서 차단되는 경우가 있음 */
  UlsaAi.DEFAULT_MODEL = 'gemini-2.5-flash';
  /** 선택 목록 (표시용 라벨 + 값) */
  UlsaAi.MODEL_OPTIONS = [
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (권장)' },
    { value: 'gemini-2.5-flash-preview-05-20', label: 'Gemini 2.5 Flash (미리보기)' },
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (신규 키 미지원 가능)' },
    { value: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash-Lite' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    { value: 'gemini-1.5-flash-8b', label: 'Gemini 1.5 Flash-8B' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
  ];
})();
