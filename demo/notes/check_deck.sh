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
const body = scenes.slice(1);
const bad = [];
for (const sc of body) {
  if (!sc.act || !sc.kicker || sc.act === sc.kicker) bad.push(sc.id + ': needs act and a distinct kicker');
  const html = (sc.html || '') + (sc.after || '');
  if (/<b>/.test(html)) bad.push(sc.id + ': mid-sentence <b>');
  if ((html.match(/<li>/g) || []).length > 3) bad.push(sc.id + ': more than 3 bullets');
  if ((html.match(/assumed/gi) || []).length > 1) bad.push(sc.id + ': "assumed" more than once');
  if (/class="p"|class="w-/.test(html)) bad.push(sc.id + ': non-original markup');
  if (sc.chart && /class="stats"/.test(html)) bad.push(sc.id + ': stats on a chart slide');
  const words = html.replace(/<[^>]+>/g, ' ').replace(/\{\{[^}]+\}\}/g, 'N').split(/\s+/).filter(Boolean).length;
  if (words > 120) bad.push(sc.id + ': ' + words + ' words');
}
if (body.filter(sc => /class="stats"/.test(sc.html || '')).length > 3) bad.push('stats on more than 3 slides');
const acts = [...new Set(body.map(sc => sc.act))];
if (acts.length < 4 || acts.length > 5) bad.push('want 4 to 5 grouped acts, got ' + acts.length);
if (bad.length) { console.error('FAIL:\n' + bad.join('\n')); process.exit(1); }
console.log('scenes: 9 (welcome + 8), acts: ' + acts.length);
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
grep -qiE 'sim(ulation)? ?4' demo/sources.js || { echo "FAIL: no Sim 4 content"; exit 1; }
if grep -nE 'Siloko|Wimukthiikawa|225 ?mm|trunk_min_mm|R1 and R2|Two of the eight|float_25' demo/scenes.js; then
  echo "FAIL: stale Sim 3.5 or wrong-name content"; exit 1; fi
grep -q 'Wimukthi Rajapaksha' demo/scenes.js && grep -q 'Balanagu' demo/scenes.js || { echo "FAIL: team names"; exit 1; }
grep -qiE 'limitation|what limits|what we assumed|what to check' demo/scenes.js || { echo "FAIL: no limitations scene"; exit 1; }
if grep -nE 'class="chip[^"]*"[^>]*>(Sim 4|triage|plan|future work|holdout|limits|method|wet cases)<' demo/scenes.js; then echo "FAIL: topic chips"; exit 1; fi
if grep -nE 'calls this|deck.s five|Sim 3\.5 five|Begin the walk-through|pts\b' demo/scenes.js; then echo "FAIL: meta copy"; exit 1; fi
[ -n "$SCENES_ONLY" ] && { echo "OK (scenes only)"; exit 0; }
if grep -nE 'Open Simulation 4|Circle = |Square = ' demo/engine.js demo.html; then echo "FAIL: meta or drifted labels"; exit 1; fi
if grep -nE 'min-width: ?400px' demo/demo.css; then echo "FAIL: chart min-width"; exit 1; fi
echo OK
