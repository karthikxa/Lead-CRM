#!/bin/sh
# Zed branding patch - runs inside server container at startup
# Replaces Twenty with Zed in served frontend without rebuilding image
set -e

FRONT_DIR="/app/packages/twenty-server/dist/front"

if [ -d "$FRONT_DIR" ]; then
  echo "[Zed] Applying full Zed CRM rebrand in $FRONT_DIR..."
  node - << 'EOF'
const fs = require('fs');
const path = require('path');

const FRONT_DIR = '/app/packages/twenty-server/dist/front';

// 1. Sleek Zed SVG Logo (Black rounded square with clean white 'Z')
const ZED_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%"><rect width="24" height="24" rx="5" fill="#121212"/><path d="M6 7h12v2.5L9.8 15H18v2.5H6v-2.5L14.2 9.5H6V7z" fill="#ffffff"/></svg>`;

const logoSvgPaths = [
    path.join(FRONT_DIR, 'images/integrations/twenty-logo.svg'),
    path.join(FRONT_DIR, 'images/icons/twenty.svg'),
    path.join(FRONT_DIR, 'favicon.svg')
];

for (const p of logoSvgPaths) {
    try {
        fs.mkdirSync(path.dirname(p), { recursive: true });
        fs.writeFileSync(p, ZED_SVG, 'utf8');
    } catch(e) {}
}

// 2. Scan and patch all text/JS/HTML/JSON/CSS files
function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(fullPath));
        } else {
            results.push(fullPath);
        }
    });
    return results;
}

const allFiles = walk(FRONT_DIR);
let patchedCount = 0;

for (const filePath of allFiles) {
    const ext = path.extname(filePath);
    if (!['.html', '.js', '.json', '.svg', '.css'].includes(ext)) continue;

    let content = fs.readFileSync(filePath, 'utf8');
    let orig = content;

    // String replacements
    content = content.replace(/<title>Twenty<\/title>/g, '<title>Zed CRM</title>');
    content = content.replace(/<title>Twenty/g, '<title>Zed');
    content = content.replaceAll('content="Twenty"', 'content="Zed CRM"');
    content = content.replaceAll('"Twenty"', '"Zed"');
    content = content.replaceAll("'Twenty'", "'Zed'");
    content = content.replaceAll('>Twenty<', '>Zed<');
    content = content.replaceAll('Twenty CRM', 'Zed CRM');
    content = content.replaceAll('twenty.com', 'zed.agency');
    content = content.replaceAll('https://twenty.com', 'https://zed.agency');
    content = content.replaceAll('Twenty community', 'Zed community');
    content = content.replaceAll('Twenty workspace', 'Zed workspace');
    content = content.replaceAll('Twenty app', 'Zed app');
    content = content.replaceAll('Twenty team', 'Zed team');
    content = content.replaceAll('Twenty is an open-source', 'Zed is a modern');

    // Protect crucial internal asset preload filenames
    content = content.replaceAll('isZedStandardApplication', 'isTwentyStandardApplication');
    content = content.replaceAll('allowRequestsToZedIcons', 'allowRequestsToTwentyIcons');
    content = content.replaceAll('zedcrm/twenty', 'twentycrm/twenty');

    if (content !== orig) {
        fs.writeFileSync(filePath, content, 'utf8');
        patchedCount++;
    }
}

console.log(`[Zed] Rebranded ${patchedCount} frontend files to Zed CRM successfully!`);
EOF
fi
