# Wanted AI Championship 2026 — 제출 초안

## 서비스 링크

- `https://buy-or-bye-championship-production.up.railway.app/`

## 해결하려는 문제

중고 거래는 판매글·사진·구성품·고질병·시세 정보가 흩어져 있어, 익숙하지 않은 제품일수록 구매 전 확인에 시간과 시행착오가 큽니다.

## AI 활용 방식

1. **매물 URL 불러오기** — Playwright로 당근/번개/중고나라 상세 페이지에서 제목·가격·본문·사진 수집
2. **제품 식별·요약** — Gemini + Google Search
3. **리스크·고질병 / 본문·사진·구성품** — 검색 + 멀티모달
4. **Step 3 비교매물** — AI 검색어로 3사 검색 결과를 Playwright 수집 → 동일제품 판별 + 시세 가이드
5. **구매 영수증·판매자 대화** — 근거를 카드/영수증 UI로 정리

데모는 **라이브 AI 호출이 기본**이며, **Chrome 확장프로그램 없이** URL만으로 동작합니다.

## 기술 스택

- Node.js 분석 서버 (Railway)
- Playwright — 매물/비교매물 수집
- Gemini — 웹 검색, 멀티모달, JSON 구조화
- Sharp — 이미지 정규화·그리드 보드
- Cursor — 개발
