#!/bin/zsh
# Acceptance check for the Sim 4 deck. Run from the repo root.
set -e
cd "${0:A:h}/../.."
for f in demo/*.js; do node --check "$f"; done
echo "Sim 4 check"
python3 demo/tools/check_facts.py
node - <<'JS'
const fs = require('fs'), vm = require('vm');
const context = {window: {}};
vm.runInNewContext(fs.readFileSync('demo/scenes.js', 'utf8'), context, {timeout: 1000});
const scenes = context.window.OSP_SCENES;
if (!Array.isArray(scenes) || scenes.length !== 9 ||
    scenes.some(scene => !scene || typeof scene !== 'object' || Array.isArray(scene)) ||
    scenes[0].id !== 'welcome' || scenes.filter(scene => scene.id === 'welcome').length !== 1) {
  console.error('FAIL: want exactly 9 scene objects (welcome + 8)');
  process.exit(1);
}
console.log('scenes: 9 (welcome + 8)');
JS
if grep -nE '—|What we did:|The result:' demo/scenes.js; then
  echo "FAIL: scene writing rule"; exit 1; fi
# Search deck copy, not coordinate arrays where these digits occur by chance.
if grep -niE '2669|Project #|save up to|[0-9]+ ?(x|×|times) (the )?(cost|price)|5-6' demo/scenes.js demo/sim4-facts.js demo/engine.js demo/sources.js demo.html README.md; then
  echo "FAIL: stale claim or cost ratio"; exit 1; fi
if grep -niE 'phase2|\+150 homes' demo/engine.js; then
  echo "FAIL: stale engine readout"; exit 1; fi
if grep -nE '5.?6 ?(x|×|times)|five.to.six|SA Water (said|says|hasn|has not|asked|wants)|University of Adelaide' demo/*.js demo.html; then
  echo "FAIL: banned phrase"; exit 1; fi
grep -qiE 'sim(ulation)? ?4' demo/scenes.js || { echo "FAIL: no Sim 4 content"; exit 1; }
if grep -nE 'Siloko|Wimukthiikawa|225 ?mm|trunk_min_mm|R1 and R2|Two of the eight|float_25' demo/scenes.js; then
  echo "FAIL: stale Sim 3.5 or wrong-name content"; exit 1; fi
grep -q 'Wimukthi Rajapaksha' demo/scenes.js && grep -q 'Balanagu' demo/scenes.js || { echo "FAIL: team names"; exit 1; }
grep -qiE 'limitation|what limits|what we assumed' demo/scenes.js || { echo "FAIL: no limitations scene"; exit 1; }
echo OK
