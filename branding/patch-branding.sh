#!/bin/sh
# Zed branding patch - runs inside server container at startup
# Replaces Twenty with Zed in served frontend without rebuilding image
set -e
FRONT="/app/packages/twenty-server/dist/front/index.html"
MANIFEST="/app/packages/twenty-server/dist/front/manifest.json"
if [ -f "$FRONT" ]; then
  echo "[Zed] Patching $FRONT -> Zed"
  node -e "
const fs=require('fs');
let p='$FRONT';
let t=fs.readFileSync(p,'utf8');
let orig=t;
t=t.replace('<title>Twenty</title>','<title>Zed</title>');
t=t.replaceAll('content=\"Twenty\"','content=\"Zed\"');
t=t.replaceAll('\"Twenty\"','\"Zed\"');
 // avoid breaking asset preload filenames - revert those
t=t.replaceAll('isZedStandardApplication','isTwentyStandardApplication');
t=t.replaceAll('allowRequestsToZedIcons','allowRequestsToTwentyIcons');
if(t!==orig){fs.writeFileSync(p,t); console.log('Zed branding patched');}else{console.log('already patched');}
"
fi
if [ -f "$MANIFEST" ]; then
  node -e "
const fs=require('fs');
let p='$MANIFEST';
let j=JSON.parse(fs.readFileSync(p,'utf8'));
j.name='Zed'; j.short_name='Zed'; fs.writeFileSync(p, JSON.stringify(j,null,2));
console.log('manifest patched to Zed');
"
fi
