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
const zlib = require('zlib');

const FRONT_DIR = '/app/packages/twenty-server/dist/front';

// 1. Sleek Zed SVG Logo (Black rounded square with clean white 'Z')
const ZED_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="100%" height="100%"><rect width="32" height="32" rx="7" fill="#111827"/><path d="M9 9h14v3.5L13.5 20H23v3.5H9v-3.5L18.5 12.5H9V9z" fill="#ffffff"/></svg>`;

const ZED_DATA_URI = "data:image/svg+xml," + encodeURIComponent(ZED_SVG);

// 2. Generate a valid 32x32 PNG of the black Zed logo
function createZedPNG() {
    const width = 32, height = 32;
    const rawData = Buffer.alloc(height * (width * 4 + 1));
    
    for (let y = 0; y < height; y++) {
        const rowOffset = y * (width * 4 + 1);
        rawData[rowOffset] = 0; // Filter: None
        for (let x = 0; x < width; x++) {
            const pxOffset = rowOffset + 1 + x * 4;
            // Draw a rounded black box (rgb 18, 18, 18)
            const inRoundedBox = (x >= 2 && x <= 29 && y >= 2 && y <= 29);
            // Draw simple Z
            const inZ = (y >= 8 && y <= 11 && x >= 8 && x <= 23) || // top bar
                        (y >= 21 && y <= 24 && x >= 8 && x <= 23) || // bottom bar
                        (x + y >= 27 && x + y <= 31 && y >= 11 && y <= 21); // diagonal

            if (inZ) {
                rawData[pxOffset] = 255; // R
                rawData[pxOffset + 1] = 255; // G
                rawData[pxOffset + 2] = 255; // B
                rawData[pxOffset + 3] = 255; // A
            } else if (inRoundedBox) {
                rawData[pxOffset] = 18;  // R
                rawData[pxOffset + 1] = 18;  // G
                rawData[pxOffset + 2] = 18;  // B
                rawData[pxOffset + 3] = 255; // A
            } else {
                rawData[pxOffset + 3] = 0;   // Transparent
            }
        }
    }

    const compressed = zlib.deflateSync(rawData);
    
    function makeChunk(type, data) {
        const len = Buffer.alloc(4);
        len.writeUInt32BE(data.length, 0);
        const typeBuf = Buffer.from(type, 'ascii');
        const toCrc = Buffer.concat([typeBuf, data]);
        // simple CRC table
        let c;
        const crcTable = [];
        for (let n = 0; n < 256; n++) {
            c = n;
            for (let k = 0; k < 8; k++) c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
            crcTable[n] = c;
        }
        let crc = 0 ^ (-1);
        for (let i = 0; i < toCrc.length; i++) {
            crc = (crc >>> 8) ^ crcTable[(crc ^ toCrc[i]) & 0xFF];
        }
        crc = (crc ^ (-1)) >>> 0;
        const crcBuf = Buffer.alloc(4);
        crcBuf.writeUInt32BE(crc, 0);
        return Buffer.concat([len, typeBuf, data, crcBuf]);
    }

    const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    const ihdrData = Buffer.alloc(13);
    ihdrData.writeUInt32BE(width, 0);
    ihdrData.writeUInt32BE(height, 4);
    ihdrData[8] = 8; // bit depth
    ihdrData[9] = 6; // color type RGBA
    ihdrData[10] = 0; ihdrData[11] = 0; ihdrData[12] = 0;
    
    const ihdr = makeChunk('IHDR', ihdrData);
    const idat = makeChunk('IDAT', compressed);
    const iend = makeChunk('IEND', Buffer.alloc(0));
    
    return Buffer.concat([sig, ihdr, idat, iend]);
}

const zedPngBuffer = createZedPNG();

// 3. Overwrite all image and icon files across directories
function replaceIconFiles(dir) {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const full = path.join(dir, item);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
            replaceIconFiles(full);
        } else {
            const ext = path.extname(item).toLowerCase();
            if (ext === '.svg') {
                fs.writeFileSync(full, ZED_SVG, 'utf8');
            } else if (['.png', '.ico', '.webp'].includes(ext) && (full.includes('icon') || full.includes('logo') || full.includes('favicon'))) {
                fs.writeFileSync(full, zedPngBuffer);
            }
        }
    }
}

replaceIconFiles(path.join(FRONT_DIR, 'images/icons'));
replaceIconFiles(path.join(FRONT_DIR, 'images/integrations'));

// Write favicon at root
fs.writeFileSync(path.join(FRONT_DIR, 'favicon.ico'), zedPngBuffer);
fs.writeFileSync(path.join(FRONT_DIR, 'favicon.svg'), ZED_SVG, 'utf8');

// 4. Overhaul index.html favicon tags
const indexHtmlPath = path.join(FRONT_DIR, 'index.html');
if (fs.existsSync(indexHtmlPath)) {
    let html = fs.readFileSync(indexHtmlPath, 'utf8');
    // Remove old icon tags (including multiline)
    html = html.replace(/<link[^>]*rel=["'](?:shortcut\s+)?icon["'][^>]*\/?>/gis, '');
    html = html.replace(/<link[^>]*rel=["']apple-touch-icon["'][^>]*\/?>/gis, '');
    // Inject clean SVG + PNG favicon tags right after <head>
    const newTags = `<link rel="icon" type="image/svg+xml" href="${ZED_DATA_URI}">\n<link rel="icon" type="image/png" href="/favicon.ico">\n<link rel="apple-touch-icon" href="${ZED_DATA_URI}">`;
    html = html.replace(/<head>/i, `<head>\n    ${newTags}`);
    fs.writeFileSync(indexHtmlPath, html, 'utf8');
    console.log('[Zed] Injected inline SVG favicon into index.html');
}

// 5. Scan and patch all text/JS/HTML/JSON/CSS files
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
    content = content.replace(/<title>Twenty<\/title>/g, '<title>Zed</title>');
    content = content.replace(/<title>Twenty/g, '<title>Zed');
    content = content.replaceAll('content="Twenty"', 'content="Zed"');
    content = content.replaceAll('"Twenty"', '"Zed"');
    content = content.replaceAll("'Twenty'", "'Zed'");
    content = content.replaceAll('>Twenty<', '>Zed<');
    content = content.replaceAll('Twenty CRM', 'Zed');
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

console.log(`[Zed] Rebranded ${patchedCount} frontend files with tab favicon and Zed branding!`);
EOF
fi
