# 데모 캐시 생성

`demo/cache/*.json`은 라이브 Gemini 호출이 실패(쿼터·타임아웃)할 때 쓰는 폴백 스냅샷입니다.

## 수동 갱신

1. 로컬에서 `GEMINI_API_KEY=... npm start`
2. 분석 웹에서 데모 매물 5개를 각각 실행해 Step 1~2가 끝날 때까지 대기
3. 브라우저 개발자도구 / 서버 로그로 나온 분석 JSON을 아래 키로 정리해 덮어씁니다.

```json
{
  "id": "<scenario-id>",
  "fallback": true,
  "summary": {},
  "riskAnalysis": {},
  "listingTextAnalysis": {},
  "listingImageAnalysis": {},
  "accessoryCheck": {}
}
```

## 주의

- 기본 UX는 **항상 라이브 AI**입니다. 캐시는 폴백 전용입니다.
- 캐시를 기본 재생 모드로 쓰지 마세요 (대회 “AI 활용” 스토리와 충돌).
