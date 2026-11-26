# Burning Front — 소스 폴더

(구 이름: CoH 1944 아르덴 공방전. 저장 데이터 키 `coh1944.*`는 기존 저장을 지키려고 그대로 둡니다.)

v209부터 게임은 이 폴더가 원본입니다. 실제로 플레이하는 한 장짜리 HTML은 여기서 빌드해서 만듭니다.

## 폴더 구성
- `js/` 게임 코드 (기능별 230개 파일, `manifest.txt` 순서대로 하나로 합쳐짐)
- `js/chains/` 여러 버전에 걸쳐 덧씌워진 함수들을 한 파일에 모아 둔 곳
- `css/`, `html/`, `assets/` 스타일·화면 구조·내장 글꼴
- `CODEMAP.md` 코드 지도 (Claude가 작업 시작 때 읽는 문서), `FILES.md` 전체 파일 목록
- `SPEC.md` 현재 적용 중인 게임 규칙서 (규칙이 바뀌면 함께 갱신)
- `CLAUDE.md` 작업 규칙, `CHANGELOG.md` 버전 기록, `VERSION` 현재 버전 번호
- `tools/` 검색·검증 도구, `dist/` 빌드 결과물

## 작업 요청할 때
1. 이 폴더를 zip으로 올리거나, GitHub 저장소에 두었다면 저장소 이름을 알려 주세요.
2. 고칠 내용을 말씀해 주세요. 영역(예: "선회 트레이", "전차 대인 피해")을 같이 적어 주시면 더 빠릅니다.
3. 결과로 수정된 소스 zip과 `burning_front_vNNN.html`을 받습니다.

## 직접 빌드하려면
Node.js가 있는 PC에서 이 폴더로 이동한 뒤 `node build.js`를 실행하면 `dist/`에 HTML이 생깁니다.
(Windows에서는 Windows용 Node.js가 필요합니다. linux-x64용은 Windows에서 실행되지 않습니다.)
