# Buy or Bye — Championship 배포 가이드

원티드 AI Championship 2026용 공개 데모 배포 방법입니다.  
기존 로컬 전용 흐름은 `main` 브랜치에 그대로 두고, 이 문서는 `championship-demo` 브랜치 기준입니다.

## 핵심 동작

- 공개 URL 접속 → **데모 매물 5개** 선택 → **라이브 Gemini** 분석
- 쿼터/타임아웃/429 시 → `demo/cache/*.json` **폴백**
- 확장 ZIP은 `/downloads/buy-or-bye-extension.zip`에서 다운로드

## 환경 변수

| 변수 | 설명 |
|------|------|
| `GEMINI_API_KEY` | 서버 사이드 데모 키 (필수, 심사자 키 입력 불필요) |
| `PORT` | 포트 (플랫폼이 주입, 기본 3920) |
| `HOST` | 기본 `0.0.0.0` |
| `PUBLIC_ANALYZER_ORIGIN` | 예: `https://your-app.up.railway.app` (확장 패키징에 사용) |
| `DEMO_DAILY_LIMIT` | IP당 일일 호출 한도 (기본 40) |
| `DEMO_MODE` | `true` 강제 (키가 있으면 자동 on) |

## 로컬 데모 실행

```bash
set GEMINI_API_KEY=your_key
set PUBLIC_ANALYZER_ORIGIN=http://127.0.0.1:3920
npm run pack:extension
npm start
```

브라우저에서 `http://127.0.0.1:3920/` → 데모 카드 클릭.

## Railway 배포 (권장)

1. GitHub `championship-demo` 브랜치를 Railway에 연결
2. Variables에 `GEMINI_API_KEY`, `PUBLIC_ANALYZER_ORIGIN`(배포 URL) 설정
3. Build: `npm install` / Start: `npm run pack:extension && npm start`
4. 배포 URL로 접속해 데모 2번(구성품) 60초 플로우 확인

`railway.toml` 참고.

## Render 배포

`render.yaml` 참고. Start Command:

```bash
npm run pack:extension && npm start
```

## 60초 검증 체크리스트

1. 게이트 없이 랜딩이 열리는지 (`GEMINI_API_KEY` 있을 때)
2. 데모 카드 5개가 보이는지
3. 「구성품 체크」 시나리오 클릭 → Step 1~2 카드 생성
4. ZIP 다운로드 링크 200
5. (선택) API 키 제거/쿼터 시뮬레이션 후 캐시 폴백 배너

## 제출 문구

`SUBMISSION.md` 참고.
