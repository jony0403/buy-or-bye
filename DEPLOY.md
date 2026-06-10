# Buy or Bye 로컬 개인용 배포 가이드

**Buy or Bye · 중고매물 살까말까**를 Chrome 확장 + 로컬 분석 서버로 내 PC에서 실행하는 방법입니다.

## 사전 요구사항

- Node.js LTS
- Google Chrome
- Gemini API 키

## 실행

Windows에서는 루트 폴더의 `start-analyzer.bat`를 더블클릭하면 됩니다.

- 서버 창을 닫거나 `Ctrl+C`를 누르면 서버가 종료됩니다.
- 이미 서버가 켜져 있으면 중복 실행하지 않고 `http://127.0.0.1:3920/`만 엽니다.

터미널로 실행하려면:

```bash
npm install
npm start
```

콘솔에 아래 메시지가 나오면 성공입니다.

```text
Buy or Bye · 중고매물 살까말까: http://127.0.0.1:3920/
종료: Ctrl+C
```

## 다른 PC에 설치

```bash
git clone https://github.com/jony0403/buy-or-bye.git
cd buy-or-bye
npm install
npm start
```

또는 ZIP으로 옮긴 뒤 폴더명을 `buy-or-bye`로 바꾸고 `start-analyzer.bat`를 실행하세요.

## Chrome 확장 설치

1. `chrome://extensions` 열기
2. 개발자 모드 켜기
3. “압축해제된 확장 프로그램을 로드합니다” 클릭
4. 프로젝트 안의 `extension/` 폴더 선택

분석 웹에서 Gemini API 키를 저장한 뒤, 번개장터·당근마켓·중고나라 매물 상세 페이지에서 확장 아이콘을 누르면 됩니다.

## 폴더명 변경

현재 Cursor에서 프로젝트를 열고 있다면 바로 폴더명을 바꾸지 말고 Cursor와 서버 창을 먼저 닫으세요.

그 다음 `rename-folder-to-buy-or-bye.bat`를 실행하면 현재 폴더를 `buy-or-bye`로 바꿉니다.
