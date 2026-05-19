/** 로컬 분석 서버로 검색어 정규화 요청 (확장/서버 공통 프롬프트) */
(() => {
  globalThis.UlsaAi = globalThis.UlsaAi || {};

  UlsaAi.getStoredModel = () =>
    localStorage.getItem(UlsaAi.STORAGE_KEY_MODEL) || UlsaAi.DEFAULT_MODEL;

  /**
   * @param {{ title: string, body?: string, imageUrls?: string[], apiKey: string, model?: string }} p
   * @returns {Promise<{ query: string }>}
   */
  UlsaAi.fetchSearchQuery = async (p) => {
    const port = location.port || '3920';
    const model = p.model || UlsaAi.getStoredModel();
    const res = await fetch(`http://${location.hostname}:${port}/api/search-query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gemini-Key': p.apiKey,
        'X-Gemini-Model': model,
      },
      body: JSON.stringify({
        title: p.title || '',
        body: p.body || '',
        imageUrls: Array.isArray(p.imageUrls) ? p.imageUrls : [],
      }),
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(text.slice(0, 200) || `HTTP ${res.status}`);
    }
    if (!res.ok) {
      throw new Error(data.error || data.message || `HTTP ${res.status}`);
    }
    return data;
  };
})();
