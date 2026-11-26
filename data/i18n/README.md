# data/i18n/

Every player-visible string: unit, weapon and terrain names, UI labels, log templates. One file per language,
`{ "strings": { key: text } }`; keys are `<kind>.<id>.<field>` for data records (the fx entries name them) and `ui.*` /
`log.*` for the interface.

- `ko.json` — Korean, the game's main language. Written by hand.
- `en.json` — English. Unit, weapon and upgrade names start from CoH3's English names: `node tools/i18n/seed.js` adds the
  keys in use that `en.json` lacks (from coh3stats) and never overwrites. CoH3 leaves crew members and many vehicle
  weapons unnamed; those are written by hand.
- `npm run build:data` merges these files with each enabled mod's `i18n/<lang>.json` into `data/generated/i18n.json`
  and lists, per language, the keys in use that have no text (`reports/data-links.md`). The game falls back to English,
  then to the key itself.
- Edited by: You. Data files hold numbers, ids and keys only — never display text (that goes here).

## Korean translation rules

1. Use the natural Korean word where one exists (suppression → 제압, smoke → 연막, retreat → 후퇴).
2. A term with no natural Korean equivalent is **transliterated**, not explained (hulldown → 헐다운).
3. Weapon and vehicle designations stay as written (MG 42, Pak 40, KwK 40, M1 Garand → M1 개런드 for spoken names).
4. German and other proper nouns are transliterated (Panzerfaust → 판처파우스트).

| English | Korean | Rule |
| --- | --- | --- |
| hulldown | 헐다운 | 2 |
| blitzkrieg | 블리츠크리크 | 2 |
| Panzerfaust | 판처파우스트 | 4 |
| Panzerschreck | 판처슈렉 | 4 |
| bazooka | 바주카 | 2 |
| Nebelwerfer | 네벨베르퍼 | 4 |
| Stummel | 슈툼멜 | 4 |
| Kübelwagen | 퀴벨바겐 | 4 |
| Chatellerault | 샤텔로 | 4 |
| suppression / suppressed | 제압 / 제압됨 | 1 |
| pinned | 고착 | 1 |
| retreat | 후퇴 | 1 |
| overwatch | 경계 사격 | 1 |
| barrage | 탄막 사격 | 1 |
| counter-battery fire | 대포병 사격 | 1 |
| merge (reinforce another squad) | 합류 | 1 |
| garrison | 주둔 | 1 |
| set up / tear down (team weapon) | 거치 / 해체 | 1 |
| sandbag wall | 모래주머니 벽 | 1 |
| barbed wire | 철조망 | 1 |
| tank trap (AT obstacle) | 대전차 장애물 | 1 |
| wreck | 잔해 | 1 |
| collapse (building) | 붕괴 | 1 |

Add a row when a new term first appears in `ko.json`, so the same word is always used.
