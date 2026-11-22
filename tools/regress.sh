#!/bin/sh
# Compare a candidate build against a baseline trace (records the baseline first if missing).
# usage: tools/regress.sh <baseline.html> <candidate.html> [workdir] [jobs]
BASE="$1"; CAND="$2"; W="${3:-/tmp/regress}"; J="${4:-3}"; H="$(dirname "$0")/harness.py"
mkdir -p "$W"
SUITE="skirmish:1:200 skirmish:2:200 skirmish:3:200 faymonville:1:120"
rm -f "$W"/cand_*.json
for t in $SUITE; do
  m=${t%%:*}; r=${t#*:}; s=${r%%:*}; n=${r#*:}
  [ -f "$W/base_${m}_${s}.json" ] || echo "$BASE base $m $s $n"
  echo "$CAND cand $m $s $n"
done | xargs -P "$J" -L 1 sh -c 'python3 -I "'"$H"'" record "$0" "'"$W"'/$1_$2_$3.json" --maps "$2" --seeds "$3" --steps "$4" > "'"$W"'/$1_$2_$3.log" 2>&1 || echo "run failed: $1 $2 $3"'
fail=0
for t in $SUITE; do
  m=${t%%:*}; r=${t#*:}; s=${r%%:*}
  python3 -I "$H" compare "$W/base_${m}_${s}.json" "$W/cand_${m}_${s}.json" || fail=1
done
[ $fail = 0 ] && echo "ALL MATCH" || { echo "REGRESSION"; exit 1; }
