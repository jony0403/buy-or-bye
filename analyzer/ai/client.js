/** 로컬 분석 서버로 검색어 정규화 요청 (확장/서버 공통 프롬프트) */
(() => {
  globalThis.UlsaAi = globalThis.UlsaAi || {};

  UlsaAi.getStoredModel = () =>
    localStorage.getItem(UlsaAi.STORAGE_KEY_MODEL) || UlsaAi.DEFAULT_MODEL;

  function cleanApiError(text, fallback = 'AI 분석 요청에 실패했습니다.') {
    const raw = String(text || '').trim();
    if (!raw) return fallback;
    if (/(quota|rate limit|rate-limits|resource_exhausted|too many requests|429|exceeded your current quota)/i.test(raw)) {
      return 'Gemini API 사용량 한도를 초과했습니다. Google AI Studio의 결제/쿼터 상태를 확인하거나, 잠시 후 다시 시도하거나, 다른 API 키를 저장한 뒤 재시도하세요.';
    }
    if (/<!doctype|<html|<title>/i.test(raw)) {
      const title = raw.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim();
      return title ? `서버 오류: ${title}` : fallback;
    }
    return raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 220) || fallback;
  }

  async function postJson(path, p, body, extraHeaders = {}) {
    const port = location.port || '3920';
    const model = p.model || UlsaAi.getStoredModel();
    const headers = {
      'Content-Type': 'application/json',
      ...extraHeaders,
    };
    if (p.apiKey) headers['X-Gemini-Key'] = p.apiKey;
    if (model) headers['X-Gemini-Model'] = model;
    const fetchOpts = {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    };
    if (p.signal) fetchOpts.signal = p.signal;
    return fetch(`http://${location.hostname}:${port}${path}`, fetchOpts);
  }

  async function parseJsonResponse(res, text, fallbackMessage) {
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(cleanApiError(text, `HTTP ${res.status}`));
    }
    if (!res.ok) {
      throw new Error(cleanApiError(data.error || data.message, fallbackMessage || `HTTP ${res.status}`));
    }
    return data;
  }

  /**
   * @param {{ title: string, body?: string, imageUrls?: string[], maxQueries?: number, apiKey: string, model?: string }} p
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
        maxQueries: p.maxQueries || 1,
      }),
    });
    const text = await res.text();
    if (res.status === 404) {
      const fallback = await UlsaAi.fetchSearchQuery(p);
      const query = String(fallback.query || '').trim();
      if (!query) {
        throw new Error('제품 정리 API를 찾지 못했습니다. 분석 서버를 재시작한 뒤 다시 시도하세요.');
      }
      return {
        summary: {
          productName: query,
          newPrice: '',
          newPriceSourceUrl: '',
          description: '제품 정리 API가 아직 반영되지 않아 AI 검색어 식별 결과만 먼저 표시합니다.',
          makerOrSeller: '',
          searchQuery: query,
          searchQueries: [query],
          productImageUrl: '',
        },
        fallback: 'search-query',
      };
    }
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(cleanApiError(text, `HTTP ${res.status}`));
    }
    if (!res.ok) {
      throw new Error(cleanApiError(data.error || data.message, `HTTP ${res.status}`));
    }
    return data;
  };

  /**
   * @param {{ title: string, body?: string, imageUrls?: string[], apiKey: string, model?: string }} p
   * @returns {Promise<{ summary: { productName: string, newPrice: string, newPriceSourceUrl?: string, description: string, makerOrSeller: string, searchQuery: string, searchQueries?: string[], productImageUrl: string } }>}
   */
  UlsaAi.fetchProductSummary = async (p) => {
    const res = await postJson(
      '/api/product-summary',
      p,
      {
        title: p.title || '',
        body: p.body || '',
        imageUrls: Array.isArray(p.imageUrls) ? p.imageUrls : [],
      }
    );
    const text = await res.text();
    if (res.status === 404) {
      throw new Error('최종 판단 영수증 API를 찾지 못했습니다. 분석 서버를 재시작한 뒤 다시 시도하세요.');
    }
    return parseJsonResponse(res, text);
  };

  /**
   * @param {{ productName?: string, searchQuery?: string }} p
   * @returns {Promise<{ imageUrls: string[], source: string }>}
   */
  UlsaAi.fetchProductImage = async (p) => {
    const port = location.port || '3920';
    const res = await fetch(`http://${location.hostname}:${port}/api/product-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productName: p.productName || '',
        searchQuery: p.searchQuery || '',
      }),
    });
    const text = await res.text();
    if (res.status === 404) {
      throw new Error('판매자 대화 API를 찾지 못했습니다. 분석 서버를 재시작한 뒤 다시 시도하세요.');
    }
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(cleanApiError(text, `HTTP ${res.status}`));
    }
    if (!res.ok) {
      throw new Error(cleanApiError(data.error || data.message, `HTTP ${res.status}`));
    }
    return data;
  };

  /**
   * @param {{ title: string, body?: string, imageUrls?: string[], productName?: string, summary?: object, apiKey: string, model?: string }} p
   * @returns {Promise<{ analysis: { relatedIssues: Array<{ title: string, detail: string, level?: string, sources?: Array<{ label?: string, url: string, type?: string }> }>, chronicDefects: Array<{ title: string, detail: string, level?: string, sources?: Array<{ label?: string, url: string, type?: string }> }>, verdict?: string } }>}
   */
  UlsaAi.fetchProductRisk = async (p) => {
    const res = await postJson(
      '/api/product-risk',
      p,
      {
        title: p.title || '',
        body: p.body || '',
        imageUrls: Array.isArray(p.imageUrls) ? p.imageUrls : [],
        productName: p.productName || '',
        summary: p.summary || null,
      }
    );
    const text = await res.text();
    return parseJsonResponse(res, text);
  };

  /**
   * @param {{ title: string, body?: string, productName?: string, summary?: object, analysis?: object, apiKey: string, model?: string }} p
   * @returns {Promise<{ youtubeVideos: Array<object>, youtubeSearch?: object }>}
   */
  UlsaAi.fetchProductRiskYoutube = async (p) => {
    const res = await postJson(
      '/api/product-risk-youtube',
      p,
      {
        title: p.title || '',
        body: p.body || '',
        productName: p.productName || '',
        summary: p.summary || null,
        analysis: p.analysis || null,
      }
    );
    const text = await res.text();
    return parseJsonResponse(res, text);
  };

  /**
   * @param {{ title: string, body?: string, seller?: object, priceLabel?: string, shippingFeeLabel?: string, productName?: string, summary?: object, riskAnalysis?: object, apiKey: string, model?: string }} p
   * @returns {Promise<{ analysis: { sellerVerdict: string, bodyVerdict: string, questions: string[], redFlags: string[], overall: string } }>}
   */
  UlsaAi.fetchListingTextAnalysis = async (p) => {
    const res = await postJson(
      '/api/listing-text-analysis',
      p,
      {
        title: p.title || '',
        body: p.body || '',
        seller: p.seller || null,
        priceLabel: p.priceLabel || '',
        shippingFeeLabel: p.shippingFeeLabel || '',
        productName: p.productName || '',
        summary: p.summary || null,
        riskAnalysis: p.riskAnalysis || null,
      }
    );
    const text = await res.text();
    return parseJsonResponse(res, text);
  };

  /**
   * @param {{ title: string, body?: string, imageUrls?: string[], productName?: string, apiKey: string, model?: string }} p
   * @returns {Promise<{ analysis: { images: Array<{ index: number, label?: string, comment: string, level?: string, imageWidth?: number, imageHeight?: number }>, overall: string } }>}
   */
  UlsaAi.fetchListingImageAnalysis = async (p) => {
    const res = await postJson(
      '/api/listing-image-analysis',
      p,
      {
        title: p.title || '',
        body: p.body || '',
        imageUrls: Array.isArray(p.imageUrls) ? p.imageUrls : [],
        productName: p.productName || '',
      }
    );
    const text = await res.text();
    return parseJsonResponse(res, text);
  };

  /**
   * @param {{ title: string, body?: string, productName?: string, summary?: object, riskAnalysis?: object, listingTextAnalysis?: object, listingImageAnalysis?: object, apiKey: string, model?: string }} p
   * @returns {Promise<{ analysis: { summary: string, overallLevel?: string, items: Array<object>, parseOk?: boolean } }>}
   */
  UlsaAi.fetchAccessoryCheck = async (p) => {
    const res = await postJson(
      '/api/accessory-check',
      p,
      {
        title: p.title || '',
        body: p.body || '',
        productName: p.productName || '',
        summary: p.summary || null,
        riskAnalysis: p.riskAnalysis || null,
        listingTextAnalysis: p.listingTextAnalysis || null,
        listingImageAnalysis: p.listingImageAnalysis || null,
      }
    );
    const text = await res.text();
    return parseJsonResponse(res, text);
  };

  /**
   * @param {{ title: string, body?: string, productName?: string, summary?: object, candidates: object[], apiKey: string, model?: string }} p
   * @returns {Promise<{ analysis: { matches: Array<{ key: string, reason?: string }>, rejected?: Array<object> } }>}
   */
  UlsaAi.filterComparisonListings = async (p) => {
    const port = location.port || '3920';
    const model = p.model || UlsaAi.getStoredModel();
    const res = await fetch(`http://${location.hostname}:${port}/api/comparison-filter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gemini-Key': p.apiKey,
        'X-Gemini-Model': model,
      },
      body: JSON.stringify({
        title: p.title || '',
        body: p.body || '',
        productName: p.productName || '',
        summary: p.summary || null,
        candidates: Array.isArray(p.candidates) ? p.candidates : [],
      }),
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(cleanApiError(text, `HTTP ${res.status}`));
    }
    if (!res.ok) {
      throw new Error(cleanApiError(data.error || data.message, `HTTP ${res.status}`));
    }
    return data;
  };

  /**
   * @param {{ current: object, summary?: object, comparison?: object, apiKey: string, model?: string }} p
   * @returns {Promise<{ guide: object }>}
   */
  UlsaAi.fetchUsedPriceGuide = async (p) => {
    const port = location.port || '3920';
    const model = p.model || UlsaAi.getStoredModel();
    const res = await fetch(`http://${location.hostname}:${port}/api/used-price-guide`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gemini-Key': p.apiKey,
        'X-Gemini-Model': model,
      },
      body: JSON.stringify({
        current: p.current || {},
        summary: p.summary || null,
        comparison: p.comparison || null,
      }),
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(cleanApiError(text, `HTTP ${res.status}`));
    }
    if (!res.ok) {
      throw new Error(cleanApiError(data.error || data.message, `HTTP ${res.status}`));
    }
    return data;
  };

  /**
   * @param {{ current: object, summary?: object, riskAnalysis?: object, listingTextAnalysis?: object, listingImageAnalysis?: object, accessoryCheck?: object, usedPriceGuide?: object, comparison?: object, apiKey: string, model?: string }} p
   * @returns {Promise<{ receipt: object }>}
   */
  UlsaAi.fetchPurchaseReceipt = async (p) => {
    const port = location.port || '3920';
    const model = p.model || UlsaAi.getStoredModel();
    const res = await fetch(`http://${location.hostname}:${port}/api/purchase-receipt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gemini-Key': p.apiKey,
        'X-Gemini-Model': model,
      },
      body: JSON.stringify({
        current: p.current || {},
        summary: p.summary || null,
        riskAnalysis: p.riskAnalysis || null,
        listingTextAnalysis: p.listingTextAnalysis || null,
        listingImageAnalysis: p.listingImageAnalysis || null,
        accessoryCheck: p.accessoryCheck || null,
        usedPriceGuide: p.usedPriceGuide || null,
        comparison: p.comparison || null,
      }),
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(cleanApiError(text, `HTTP ${res.status}`));
    }
    if (!res.ok) {
      throw new Error(cleanApiError(data.error || data.message, `HTTP ${res.status}`));
    }
    return data;
  };

  /**
   * @param {{ prompt: string, apiKey: string, model?: string }} p
   * @returns {Promise<{ answer: string, model: string, pipeline: string }>}
   */
  UlsaAi.askDirect = async (p) => {
    const port = location.port || '3920';
    const model = p.model || UlsaAi.getStoredModel();
    const res = await fetch(`http://${location.hostname}:${port}/api/ai-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gemini-Key': p.apiKey,
        'X-Gemini-Model': model,
      },
      body: JSON.stringify({
        prompt: p.prompt || '',
      }),
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(cleanApiError(text, `HTTP ${res.status}`));
    }
    if (!res.ok) {
      throw new Error(cleanApiError(data.error || data.message, `HTTP ${res.status}`));
    }
    return data;
  };

  UlsaAi.fetchSellerChatKeywords = async (p) => {
    const port = location.port || '3920';
    const model = p.model || UlsaAi.getStoredModel();
    const res = await fetch(`http://${location.hostname}:${port}/api/seller-chat-keywords`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gemini-Key': p.apiKey,
        'X-Gemini-Model': model,
      },
      body: JSON.stringify({
        mode: p.mode || 'first',
        tone: p.tone || 'polite',
        toneLabel: p.toneLabel || '',
        toneNote: p.toneNote || '',
        chatHistory: Array.isArray(p.chatHistory) ? p.chatHistory : [],
        conversationState: p.conversationState || null,
        replyAnalysis: p.replyAnalysis || null,
        listing: p.listing || null,
        summary: p.summary || null,
        riskAnalysis: p.riskAnalysis || null,
        listingTextAnalysis: p.listingTextAnalysis || null,
        listingImageAnalysis: p.listingImageAnalysis || null,
        accessoryCheck: p.accessoryCheck || null,
        usedPriceGuide: p.usedPriceGuide || null,
        receipt: p.receipt || null,
        comparison: p.comparison || null,
      }),
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(cleanApiError(text, `HTTP ${res.status}`));
    }
    if (!res.ok) {
      throw new Error(cleanApiError(data.error || data.message, `HTTP ${res.status}`));
    }
    return data;
  };

  /**
   * @param {{ mode: string, tone: string, toneLabel?: string, toneNote?: string, message?: string, keywordText?: string, requestKind?: string, chatHistory?: object[], conversationState?: object, replyAnalysis?: object, listing?: object, summary?: object, riskAnalysis?: object, listingTextAnalysis?: object, listingImageAnalysis?: object, accessoryCheck?: object, usedPriceGuide?: object, receipt?: object, comparison?: object, apiKey: string, model?: string }} p
   * @returns {Promise<{ messages: object, model: string, pipeline: string }>}
   */
  UlsaAi.fetchSellerChatMessages = async (p) => {
    const port = location.port || '3920';
    const model = p.model || UlsaAi.getStoredModel();
    const res = await fetch(`http://${location.hostname}:${port}/api/seller-chat-messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gemini-Key': p.apiKey,
        'X-Gemini-Model': model,
      },
      body: JSON.stringify({
        mode: p.mode || 'first',
        tone: p.tone || 'polite',
        toneLabel: p.toneLabel || '',
        toneNote: p.toneNote || '',
        message: p.message || p.keywordText || '',
        keywordText: p.keywordText || p.message || '',
        requestKind: p.requestKind || 'freeform',
        chatHistory: Array.isArray(p.chatHistory) ? p.chatHistory : [],
        conversationState: p.conversationState || null,
        replyAnalysis: p.replyAnalysis || null,
        listing: p.listing || null,
        summary: p.summary || null,
        riskAnalysis: p.riskAnalysis || null,
        listingTextAnalysis: p.listingTextAnalysis || null,
        listingImageAnalysis: p.listingImageAnalysis || null,
        accessoryCheck: p.accessoryCheck || null,
        usedPriceGuide: p.usedPriceGuide || null,
        receipt: p.receipt || null,
        comparison: p.comparison || null,
      }),
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(cleanApiError(text, `HTTP ${res.status}`));
    }
    if (!res.ok) {
      throw new Error(cleanApiError(data.error || data.message, `HTTP ${res.status}`));
    }
    return data;
  };

  /**
   * @param {{ sellerReply: string, chatHistory?: object[], listing?: object, summary?: object, riskAnalysis?: object, listingTextAnalysis?: object, listingImageAnalysis?: object, accessoryCheck?: object, usedPriceGuide?: object, receipt?: object, comparison?: object, apiKey: string, model?: string }} p
   * @returns {Promise<{ analysis: string, replyAnalysis: object, model: string, pipeline: string }>}
   */
  UlsaAi.fetchSellerReplyAnalysis = async (p) => {
    const port = location.port || '3920';
    const model = p.model || UlsaAi.getStoredModel();
    const res = await fetch(`http://${location.hostname}:${port}/api/seller-reply-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gemini-Key': p.apiKey,
        'X-Gemini-Model': model,
      },
      body: JSON.stringify({
        sellerReply: p.sellerReply || '',
        chatHistory: Array.isArray(p.chatHistory) ? p.chatHistory : [],
        listing: p.listing || null,
        summary: p.summary || null,
        riskAnalysis: p.riskAnalysis || null,
        listingTextAnalysis: p.listingTextAnalysis || null,
        listingImageAnalysis: p.listingImageAnalysis || null,
        accessoryCheck: p.accessoryCheck || null,
        usedPriceGuide: p.usedPriceGuide || null,
        receipt: p.receipt || null,
        comparison: p.comparison || null,
      }),
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(cleanApiError(text, `HTTP ${res.status}`));
    }
    if (!res.ok) {
      throw new Error(cleanApiError(data.error || data.message, `HTTP ${res.status}`));
    }
    return data;
  };

})();
