#!/bin/zsh
# Acceptance check for the short Sim 3.5 deck. Run from the repo root.
set -e
cd "${0:A:h}/../.."
for f in demo/*.js; do node --check "$f"; done
n=$(grep -cE '^\s*title:' demo/scenes.js)
echo "scenes: $n"
[ "$n" -ge 10 ] && [ "$n" -le 16 ] || { echo "FAIL: want 10-16 scenes"; exit 1; }
if grep -nE '5.?6 ?(x|×|times)|five.to.six|SA Water (said|says|hasn|has not|asked|wants)|University of Adelaide' demo/*.js demo.html; then
  echo "FAIL: banned phrase"; exit 1; fi
grep -qiE 'sim(ulation)? ?4' demo/scenes.js || { echo "FAIL: no Sim 4 content"; exit 1; }
if grep -nE 'Siloko|Wimukthiikawa|225 ?mm|trunk_min_mm|R1 and R2|Two of the eight|float_25' demo/scenes.js; then
  echo "FAIL: stale Sim 3.5 or wrong-name content"; exit 1; fi
grep -q 'Wimukthi Rajapaksha' demo/scenes.js && grep -q 'Balanagu' demo/scenes.js || { echo "FAIL: team names"; exit 1; }
grep -qiE 'limitation|what limits' demo/scenes.js || { echo "FAIL: no limitations scene"; exit 1; }
echo OK
