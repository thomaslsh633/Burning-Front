# Burning Front

턴제 헥스 전술 게임 (모바일 가로 화면, HTML 한 파일). 턴·전투 방식은 Burning Bridges, 유닛·무기 특성은 CoH3를 참고합니다.

## 지금 상태
- `legacy/` — 지금까지 플레이하던 v214 게임. 그대로 보존(동결)하고, 새 코드가 같은 수치를 내는지 비교하는 기준으로 씁니다.
  빌드: `node legacy/build.js` → `legacy/dist/burning_front_v214.html`
- `src/` — 처음부터 다시 쓰는 새 코드. 시스템마다 폴더 하나, 세 계층으로 나뉩니다.
- `data/` — 숫자·이름 데이터(JSON). 코드와 분리되어 있어 밸런스 조정은 데이터만 고치면 됩니다.

## 구조 (자세한 내용: `docs/ARCHITECTURE.md`)
| 계층 | 폴더 | 하는 일 |
| --- | --- | --- |
| 입력/표현 | `src/presentation/` | 입력(input), 입력 해석(controller), 그리기(render), 애니메이션, UI, 사운드 |
| 게임 로직 | `src/logic/` | 상태(state, store), 명령, 규칙 시스템(이동·시야·전투·점령·경제·건설·스킬·턴·승리), AI |
| 데이터/서비스 | `src/services/` | 데이터 로딩, 에셋 관리, 저장/불러오기, 저장소, 난수, 시간, 텍스트(i18n) |
| 연결 | `src/app/` | 부팅, 각 계층 연결, 화면 흐름 |

각 폴더의 `README.md`에 그 시스템이 맡는 일과 하면 안 되는 일이 적혀 있습니다.

## 확인 명령
- `npm run check` — 계층 규칙 검사 (로직이 화면·시간·무작위를 직접 쓰지 않는지 등)
- `npm test` — 테스트 실행
