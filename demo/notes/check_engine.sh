#!/bin/zsh
# Engine/CSS half of the design gate (scenes are checked by check_deck.sh).
set -e
cd "${0:A:h}/../.."
for f in demo/*.js; do node --check "$f"; done
if grep -nE 'Open Simulation 4|Circle = |Square = |Level sensors 1-5|Level list|Free mix' demo/engine.js demo.html; then echo "FAIL: drifted labels"; exit 1; fi
if grep -nE 'min-width: ?400px|\[aria-pressed|\.w-[a-z]|\.params > div\.p|\.p ?\{' demo/demo.css demo/welcome.css; then echo "FAIL: drifted CSS"; exit 1; fi
grep -q 'clamp(400px, 38vw, 580px)' demo/demo.css || { echo "FAIL: sheet width"; exit 1; }
grep -q 'Open the simulation tool' demo.html || { echo "FAIL: link label"; exit 1; }
grep -qE 'sc\.kicker' demo/engine.js || { echo "FAIL: kicker not rendered"; exit 1; }
grep -qE "padStart\(2" demo/engine.js || { echo "FAIL: counter not padded"; exit 1; }
echo OK
