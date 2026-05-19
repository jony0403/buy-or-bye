# 중고 매물 스크랩 · 가격 분석 (인수인계)

> 다른 PC / 새 Cursor 채팅에서 `@PROJECT.md` 를 먼저 읽고 작업을 이어가세요.

## 1. 프로젝트 한 줄

**번개장터·당근마켓** 매물 상세에서 데이터를 모으고, 로컬 분석 웹으로 보낸 뒤, (향후) **AI가 사진·본문을 검증하고 시세·네고·질문·채팅 대사**를 제안하는 **구매자용** 서비스.

- **타깃 사용자:** 중고 구매자 (판매자보다 정보가 부족한 쪽)
- **문제:** 정보 비대칭, 기존 시세 앱은 평균가·일반 질문 수준, 사진 vs 글 불일치·제품별 고질병·희귀품 미지원
- **교수 컨펌 기획:** AI 중고 매물 검증 (기획 1) — Vision+LLM, 네고가, 판매자 질문 생성

---

## 2. 현재까지 구현된 것 (v2.3.0)

### 확장 프로그램 (`extension/`)

| 기능 | 설명 |
|------|------|
| 상세 스크랩 | 번개 `/products/{id}`, 당근 `/kr/buy-sell/{slug}-{id}/` **에서만** 동작 |
| 수집 항목 | 제목, 가격, 본문, 사진(갤러리만), 판매자 메타 |
| 팝업 UI | 본문·사진 미리보기 + **분석 웹으로 보내기** |
| 비교 매물 | **유사 매물 검색 · 자동 수집** → 번개/당근 검색 탭 열림 → 목록 자동 스크랩 |
| 검색 탭 | 수동 **이 페이지 수집하기** (자동 실패 시) |
| 저장 | `chrome.storage.local` → 분석 웹 브릿지 |

**의도적으로 막은 것**

- 카테고리·검색 목록에서 **상세가 아닌 페이지**에서 상세 스크랩 ❌
- 페이지 전체 이미지 수집 ❌ → **매물 갤러리 사진만**
- 당근 본문: `article` 전체 텍스트 ❌ → 설명 영역만 + 잡텍스트 제거

### 분석 웹 (`analyzer/` + `analyzer-server.mjs`)

- 주소: `http://127.0.0.1:3920/`
- 실행: `node analyzer-server.mjs`
- 확장에서 전송한 **최신 매물 + 비교 매물 링크·시세 요약**(중앙값·범위)
- 사진 클릭 → 라이트박스 (화면보다 크지 않게)

### 레거시 (별도)

- `server.mjs` + 루트 `index.html`: 번개 이미지 URL만 (Playwright 폴백). 확장과 별개.

---

## 3. 사용 흐름 (사용자)

1. 번개/당근 **매물 상세**에서 확장 열기
2. **유사 매물 검색 · 자동 수집** (검색 탭 2개, 잠시 후 번개/당근 건수 표시)
3. **분석 웹으로 보내기** → `전송 완료` (분석 탭은 백그라운드, 포커스 유지)
4. 분석 웹에서 본 매물 + **비교 매물(시세 근거)** 확인

검색 탭에서 자동 수집이 안 되면 → 확장 → **이 페이지 수집하기**

---

## 4. 검색 URL 형식 (비교 매물)

### 번개장터

```
https://m.bunjang.co.kr/search/products?q={검색어}&order=score
```

- `order`: `score` | `popular` | `date` | `price_asc` | `price_desc`
- `page`: 2페이지부터

### 당근마켓

```
https://www.daangn.com/kr/buy-sell/?search={검색어}
```

- **동네(지역) 설정**에 따라 결과 다름 → UI/리포트에 “지역 기준” 명시 필요
- `판매완료` 카드는 수집 시 제외

검색어: 상세 **제목**에서 대괄호 제거 후 앞 40자 정도 (`lib/search-urls.js`).

---

## 5. 저장소 구조 (chrome.storage)

| 키 | 내용 |
|----|------|
| `marketScrapeLatest` | 마지막 본 매물 |
| `marketScrapeHistory` | 최근 30건 |
| `marketScrapeComps` | `{ forItemKey, bunjang: { items, count, ... }, daangn: {...} }` |
| `marketScrapeAutoCollect` | 검색 탭 자동 수집 플래그 |

비교 매물 1건: `{ platform, title, price, priceLabel, url, itemId }`

---

## 6. 파일 구조

```
extension/
  manifest.json          # MV3, storage, localhost 3920
  popup.html / popup.js  # 상세 UI vs 검색 UI
  bridge-analyzer.js     # 분석 페이지 ↔ storage
  lib/
    shared.js            # 패널, refresh, 메시지
    search-urls.js       # 검색 URL 생성
    comps.js             # 비교 매물 저장
    storage.js           # listing 저장
    images.js            # 갤러리만 이미지
  hosts/
    bunjang.js           # API + DOM, 검색 수집
    daangn.js            # Remix + DOM, 검색 수집
  icons/                 # extension_icon.png 기반
  build-icons.sh

analyzer/
  index.html, app.js, style.css

analyzer-server.mjs      # 정적 서버 3920
extension_icon.png       # 아이콘 원본
```

---

## 7. 설치 · 실행

### Mac / Windows 공통

```bash
cd "프로젝트 폴더"
npm install          # Playwright는 server.mjs용, 확장만 쓰면 필수 아님
node analyzer-server.mjs
```

### Chrome 확장

1. `chrome://extensions` → 개발자 모드
2. **압축해제된 확장 프로그램 로드** → `extension` 폴더
3. 코드 수정 후 **새로고침**

---

## 8. 아직 안 한 것 (로드맵)

### AI 파이프라인 (기획 + 대화에서 합의)

```
[0] 수집 ✅ (확장 + 분석 웹)
[1] 매물 이해 (LLM) — 모델명, 요약
[2] 고질병·이슈 — 웹 검색 → 요약 → RAG로 2차 프롬프트 주입 ✅ 채택
[3] Vision + 좌표 마킹 — 하자 bbox, 본문과 모순
[4] 종합 리스크
[5] 네고 가격 — 비교 매물 N건 통계 + LLM 해석 (가짜 시세 금지)
[6] 네고 채팅 대사 — 판매자용 질문·멘트 (기획서엔 없었으나 추가 예정)
```

### 시세 원칙 (중요)

- **한국 실매물만:** 번개 + 당근 comparables
- **서버 전체 크롤링 ❌** — 사용자 요청 시 검색 결과 수집 (지금 방식)
- 표본 적으면 (희귀 피규어 등): **시세 미제시**, 링크·건수만 솔직히 표시

### 발표 (다음 주, ~5분, 5슬라이드)

- 완성도보다 **프롬프트 설계 과정**
- 슬라이드: 문제 → 파이프라인 → 프롬프트 3종 → 실험 1건 → 한계
- ChatGPT 등에 샘플 매물 넣은 **출력 JSON 스크린샷**만 있어도 됨

---

## 9. 기술 메모 · 이슈

| 이슈 | 처리 |
|------|------|
| 당근 `__remixContext` | 페이지 컨텍스트 인라인 script로 읽기 |
| 당근 본문 잡텍스트 | 설명 selector만, sanitize, 조회수 이후·판매완료 제외 |
| 전송 완료 안 보임 | 분석 탭 포커스 시 팝업 닫힘 → 완료 먼저 표시, 탭은 background |
| 아이콘 잘림 시도 | crop/zoom 롤백 → 비율 유지 리사이즈만 |
| 강의실 PC | 개발자 모드 확장 로드 또는 웹 스토어 비공개; `node` 필요 |

---

## 10. 다른 PC에서 이어가기

1. 이 폴더를 **GitHub** 또는 USB로 옮김 (`node_modules` 제외)
2. Windows: `npm install`, `node analyzer-server.mjs`, 확장 로드
3. Cursor **새 채팅**에서:

   ```
   @PROJECT.md 이 프로젝트 이어서. (원하는 작업)
   ```

4. Cursor **대화 기록**은 Mac `~/.cursor/projects/.../agent-transcripts/` 에 있음. 옮기려면 Windows에서 프로젝트 연 뒤 해당 폴더에 복사 (안 되면 PROJECT.md로 충분).

---

## 11. 다음 구현 후보 (우선순위 제안)

1. 비교 매물 수집 안정화 (번개/당근 DOM 변경 대비)
2. 분석 웹에 comps 통계·필터 (판매완료 제외 표시)
3. `PROJECT.md` + 샘플 JSON으로 **프롬프트 1단계** 프로토타입 (API 연동)
4. OpenAI/Claude API + analyzer에서 결과 표시

---

## 12. 관련 경로

- 워크스페이스: `링크에서 이미지 가져오기`
- 분석 웹: http://127.0.0.1:3920/
- 확장 버전: `extension/manifest.json` 의 `version` 참고

*마지막 업데이트: 2026-05-19 — Cursor 대화 기반 인수인계*
