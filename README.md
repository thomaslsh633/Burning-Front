# Burning Front — 소스 폴더

(구 이름: CoH 1944 아르덴 공방전. 저장 데이터 키 `coh1944.*`는 기존 저장을 지키려고 그대로 둡니다.)

게임을 새 구조로 다시 만드는 중입니다. 계획은 "Burning Front — Architecture Reset Plan" 문서
(Architecture plan, Rewrite roadmap 탭)에 있습니다.

## 폴더 구성
- `src/` 새 게임 코드. 역할별 계층으로 나뉩니다.
  - `core/` 게임 규칙(공식). 화면·시간·난수에 직접 손대지 않는 순수 함수
  - `app/` 게임 상태(로비·설정·교전·일시정지·결과 …) 전환과 조작 모드
  - `input/` 터치·제스처 인식, `view/` 그리기·이펙트·UI 화면, `services/` 난수·저장·문구
- `data/` 숫자와 문구만 담은 JSON (유닛·무기·지형·맵·밸런스·한국어 문구)
- `tests/` 자동 테스트 (빌드할 때마다 먼저 실행)
- `legacy/` 동결된 v214 게임. 수정하지 않고, 새 코드의 결과를 비교하는 기준으로만 씁니다.
- `SPEC.md` 현재 게임 규칙서, `CODEMAP.md` 코드 지도, `CLAUDE.md` 작업 규칙, `CHANGELOG.md` 버전 기록

## 빌드
Node.js(20 이상)가 있는 PC에서 이 폴더로 이동한 뒤:
- `node build.js` → 테스트 실행 후 `dist/burning_front_R0.html` 생성 (새 게임)
- `node legacy/build.js` → `legacy/dist/burning_front_v214.html` 생성 (기존 게임)

(Windows에서는 Windows용 Node.js가 필요합니다. linux-x64용은 Windows에서 실행되지 않습니다.)
