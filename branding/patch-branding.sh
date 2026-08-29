#!/bin/sh
# Zed branding patch - runs inside server container at startup
# Replaces Twenty with Zed in served frontend without rebuilding image
set -e

FRONT_DIR="/app/packages/twenty-server/dist/front"

if [ -d "$FRONT_DIR" ]; then
  echo "[Zed] Applying comprehensive Zed CRM rebrand in $FRONT_DIR..."
  node - << 'EOF'
const fs = require('fs');
const path = require('path');

const FRONT_DIR = '/app/packages/twenty-server/dist/front';

// Sleek Zed SVG Logo (Black rounded square with clean white 'Z')
const ZED_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%"><rect width="24" height="24" rx="5" fill="#121212"/><path d="M6 7h12v2.5L9.8 15H18v2.5H6v-2.5L14.2 9.5H6V7z" fill="#ffffff"/></svg>`;

const ZED_DATA_URI = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='5' fill='%23121212'/%3E%3Cpath d='M6 7h12v2.5L9.8 15H18v2.5H6v-2.5L14.2 9.5H6V7z' fill='%23ffffff'/%3E%3C/svg%3E";

// 1. Overwrite all image & favicon files
const iconFiles = [
    path.join(FRONT_DIR, 'images/integrations/twenty-logo.svg'),
    path.join(FRONT_DIR, 'images/icons/twenty.svg'),
    path.join(FRONT_DIR, 'favicon.svg'),
    path.join(FRONT_DIR, 'favicon.ico'),
    path.join(FRONT_DIR, 'images/icons/android/android-launchericon-48-48.png'),
    path.join(FRONT_DIR, 'images/icons/android/android-launchericon-72-72.png'),
    path.join(FRONT_DIR, 'images/icons/android/android-launchericon-96-96.png'),
    path.join(FRONT_DIR, 'images/icons/android/android-launchericon-144-144.png'),
    path.join(FRONT_DIR, 'images/icons/android/android-launchericon-192-192.png'),
    path.join(FRONT_DIR, 'images/icons/android/android-launchericon-512-512.png'),
    path.join(FRONT_DIR, 'images/icons/ios/192.png')
];

for (const p of iconFiles) {
    try {
        fs.mkdirSync(path.dirname(p), { recursive: true });
        fs.writeFileSync(p, ZED_SVG, 'utf8');
    } catch(e) {}
}

// 2. Patch index.html specifically for tab favicon and title
const indexHtmlPath = path.join(FRONT_DIR, 'index.html');
if (fs.existsSync(indexHtmlPath)) {
    let html = fs.readFileSync(indexHtmlPath, 'utf8');
    html = html.replace(/<link rel="icon"[^>]*>/gi, `<link rel="icon" type="image/svg+xml" href="${ZED_DATA_URI}">`);
    html = html.replace(/<link rel="apple-touch-icon"[^>]*>/gi, `<link rel="apple-touch-icon" href="${ZED_DATA_URI}">`);
    fs.writeFileSync(indexHtmlPath, html, 'utf8');
}

// 3. Scan and patch all text/JS/HTML/JSON/CSS files
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
    content = content.replaceAll('Welcome to Twenty', 'Welcome to Zed');
    content = content.replaceAll('Powered by Twenty', 'Powered by Zed');
    content = content.replaceAll('Twenty Inc.', 'Zed Agency');

    // Protect crucial internal asset preload filenames
    content = content.replaceAll('isZedStandardApplication', 'isTwentyStandardApplication');
    content = content.replaceAll('allowRequestsToZedIcons', 'allowRequestsToTwentyIcons');
    content = content.replaceAll('zedcrm/twenty', 'twentycrm/twenty');

    if (content !== orig) {
        fs.writeFileSync(filePath, content, 'utf8');
        patchedCount++;
    }
}

console.log(`[Zed] Rebranded ${patchedCount} frontend files with tab favicon and Zed CRM branding!`);
EOF
fi
