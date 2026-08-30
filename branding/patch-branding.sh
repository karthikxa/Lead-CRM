#!/bin/sh
# Zed complete rebrand, Enterprise activation, Direct Google Auth & Seamless Workspace Access
set -e

FRONT_DIR="/app/packages/twenty-server/dist/front"
SERVER_DIR="/app/packages/twenty-server/dist"

echo "[Zed] Applying Single-Domain Redirects, Direct Google Auth & Branding patch..."

node - << 'EOF'
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const FRONT_DIR = '/app/packages/twenty-server/dist/front';
const SERVER_DIR = '/app/packages/twenty-server/dist';

// 1. Backend Enterprise Plan Service & Resolver
const enterpriseFile = path.join(SERVER_DIR, 'engine/core-modules/enterprise/services/enterprise-plan.service.js');
if (fs.existsSync(enterpriseFile)) {
    let entContent = fs.readFileSync(enterpriseFile, 'utf8');
    
    entContent = entContent.replace(/async getLicenseInfo\(\)\s*\{[\s\S]*?async setEnterpriseKey/, `async getLicenseInfo() {
        return {
            isValid: true,
            licensee: "Zed Agency",
            expiresAt: new Date(Date.now() + 365*24*60*60*1000*10),
            subscriptionId: "sub_zed_enterprise"
        };
    }
    async setEnterpriseKey`);

    entContent = entContent.replace(/async getSubscriptionStatus\(\)\s*\{[\s\S]*?async getPortalUrl/, `async getSubscriptionStatus() {
        return {
            status: "active",
            licensee: "Zed Agency",
            expiresAt: new Date(Date.now() + 365*24*60*60*1000*10),
            cancelAt: null,
            currentPeriodEnd: new Date(Date.now() + 365*24*60*60*1000*10),
            isCancellationScheduled: false
        };
    }
    async getPortalUrl`);

    fs.writeFileSync(enterpriseFile, entContent, 'utf8');
    console.log('[Zed] Backend Enterprise license active!');
}

// 2. 2FA Bypass & Google Provider Guard
const twoFactorFile = path.join(SERVER_DIR, 'engine/core-modules/two-factor-authentication/two-factor-authentication.service.js');
if (fs.existsSync(twoFactorFile)) {
    let twoFactorContent = fs.readFileSync(twoFactorFile, 'utf8');
    twoFactorContent = twoFactorContent.replace(/async validateTwoFactorAuthenticationRequirement\([\s\S]*?async initiateStrategyConfiguration/, `async validateTwoFactorAuthenticationRequirement(targetWorkspace, userTwoFactorAuthenticationMethods) {
        return;
    }
    async initiateStrategyConfiguration`);
    fs.writeFileSync(twoFactorFile, twoFactorContent, 'utf8');
    console.log('[Zed] 2FA enforcement bypassed permanently!');
}

const googleGuardFile = path.join(SERVER_DIR, 'engine/core-modules/auth/guards/google-provider-enabled.guard.js');
if (fs.existsSync(googleGuardFile)) {
    let guardContent = fs.readFileSync(googleGuardFile, 'utf8');
    guardContent = guardContent.replace(/canActivate\(context\)\s*\{[\s\S]*?constructor/, `canActivate(context) {
        try {
            new _googleauthstrategy.GoogleStrategy(this.twentyConfigService);
            return true;
        } catch (err) {
            return true;
        }
    }
    constructor`);
    fs.writeFileSync(googleGuardFile, guardContent, 'utf8');
    console.log('[Zed] Google Provider Guard unlocked permanently!');
}

// 3. Support BOTH /redirect AND /callback in GoogleAuthController & GoogleAPIsAuthController
const googleCtrlFile = path.join(SERVER_DIR, 'engine/core-modules/auth/controllers/google-auth.controller.js');
if (fs.existsSync(googleCtrlFile)) {
    let ctrlContent = fs.readFileSync(googleCtrlFile, 'utf8');
    if (!ctrlContent.includes("(0, _common.Get)('callback')")) {
        ctrlContent = ctrlContent.replace(
            /\(0, _common\.Get\)\('redirect'\),/g,
            "(0, _common.Get)('redirect'),\n    (0, _common.Get)('callback'),"
        );
        fs.writeFileSync(googleCtrlFile, ctrlContent, 'utf8');
        console.log('[Zed] GoogleAuthController patched to accept both /redirect and /callback!');
    }
}

const googleApisCtrlFile = path.join(SERVER_DIR, 'engine/core-modules/auth/controllers/google-apis-auth.controller.js');
if (fs.existsSync(googleApisCtrlFile)) {
    let apisCtrlContent = fs.readFileSync(googleApisCtrlFile, 'utf8');
    if (!apisCtrlContent.includes("(0, _common.Get)('callback')")) {
        apisCtrlContent = apisCtrlContent.replace(
            /\(0, _common\.Get\)\('get-access-token'\),/g,
            "(0, _common.Get)('get-access-token'),\n    (0, _common.Get)('callback'),"
        );
        fs.writeFileSync(googleApisCtrlFile, apisCtrlContent, 'utf8');
        console.log('[Zed] GoogleAPIsAuthController patched to accept both /get-access-token and /callback!');
    }
}

// 4. Single-Domain URL builder in WorkspaceDomainsService (Fix subdomain redirect loop)
const domainsServiceFile = path.join(SERVER_DIR, 'engine/core-modules/domain/workspace-domains/services/workspace-domains.service.js');
if (fs.existsSync(domainsServiceFile)) {
    let domContent = fs.readFileSync(domainsServiceFile, 'utf8');
    domContent = domContent.replace(/buildWorkspaceURL\(\{ workspace, pathname, searchParams, hash \}\)\s*\{[\s\S]*?computeWorkspaceRedirectErrorUrl/, `buildWorkspaceURL({ workspace, pathname, searchParams, hash }) {
        const baseUrl = this.twentyConfigService.get('SERVER_URL') || 'http://localhost:3000';
        return (0, _buildurlwithpathnameandsearchparamsutil.buildUrlWithPathnameAndSearchParams)({
            baseUrl: new URL(baseUrl),
            pathname,
            searchParams,
            hash
        });
    }
    computeWorkspaceRedirectErrorUrl`);
    fs.writeFileSync(domainsServiceFile, domContent, 'utf8');
    console.log('[Zed] WorkspaceDomainsService patched to prevent subdomain redirect loops!');
}

// 5. Bypass Onboarding Service so all users immediately land in CRM
const onboardingFile = path.join(SERVER_DIR, 'engine/core-modules/onboarding/onboarding.service.js');
if (fs.existsSync(onboardingFile)) {
    let onbContent = fs.readFileSync(onboardingFile, 'utf8');
    onbContent = onbContent.replace(
        /async getOnboardingStatus\(\{ userId, workspaceId \}\)\s*\{[\s\S]*?return _onboardingstatusenum\.OnboardingStatus\.COMPLETED;\s*\}/,
        `async getOnboardingStatus({ userId, workspaceId }) {
        return _onboardingstatusenum.OnboardingStatus.COMPLETED;
    }`
    );
    fs.writeFileSync(onboardingFile, onbContent, 'utf8');
    console.log('[Zed] Onboarding service patched to always return COMPLETED!');
}

// 6. Direct Google OAuth & Seamless Workspace Membership in AuthService
const authServiceFile = path.join(SERVER_DIR, 'engine/core-modules/auth/services/auth.service.js');
if (fs.existsSync(authServiceFile)) {
    let authContent = fs.readFileSync(authServiceFile, 'utf8');
    
    authContent = authContent.replace(/computeRedirectURI\(\{[\s\S]*?async findInvitationForSignInUp/, `computeRedirectURI({ loginToken, workspace, billingCheckoutSessionState, returnToPath }) {
        const baseUrl = this.twentyConfigService.get('SERVER_URL') || 'http://localhost:3000';
        const params = new URLSearchParams();
        if (loginToken) params.set('loginToken', loginToken);
        if (billingCheckoutSessionState) params.set('billingCheckoutSessionState', billingCheckoutSessionState);
        params.set('returnToPath', returnToPath || '/objects/people');
        return \`\${baseUrl}/verify?\${params.toString()}\`;
    }
    async findInvitationForSignInUp`);

    authContent = authContent.replace(/async signInUpWithSocialSSO\(\{[\s\S]*?async createSSOConnectedAccountIfFeatureFlagIsOn/, `async signInUpWithSocialSSO({ firstName, lastName, email: rawEmail, picture, workspaceInviteHash, workspaceId, billingCheckoutSessionState, locale, returnToPath }, authProvider) {
        const email = rawEmail.toLowerCase();
        let defaultWorkspace = await this.workspaceRepository.findOneBy({});
        if (!defaultWorkspace) {
            defaultWorkspace = await this.workspaceRepository.findOne({});
        }

        let existingUser = await this.userService.findUserByEmailWithWorkspaces(email);
        if (!existingUser) {
            existingUser = await this.signInUpService.signUpWithoutWorkspace({
                firstName: firstName || 'User',
                lastName: lastName || '',
                email,
                picture: picture || null,
                locale,
                isEmailAlreadyVerified: true
            }, {
                provider: authProvider
            });
        }

        // Grant full permissions & email verification
        await this.userRepository.update({ id: existingUser.id }, { 
            canAccessFullAdminPanel: true, 
            canImpersonate: true, 
            disabled: false,
            isEmailVerified: true
        });

        // Ensure user is enrolled in default workspace
        if (defaultWorkspace) {
            const hasAccess = await this.userService.hasUserAccessToWorkspace(existingUser.id, defaultWorkspace.id);
            if (!hasAccess) {
                await this.userWorkspaceService.addUserToWorkspaceIfUserNotInWorkspace(existingUser, defaultWorkspace);
            }
        }

        const loginToken = await this.loginTokenService.generateLoginToken(existingUser.email, defaultWorkspace ? defaultWorkspace.id : undefined, authProvider);
        return this.computeRedirectURI({
            loginToken: loginToken.token,
            workspace: defaultWorkspace,
            billingCheckoutSessionState,
            returnToPath: '/objects/people'
        });
    }
    async createSSOConnectedAccountIfFeatureFlagIsOn`);

    fs.writeFileSync(authServiceFile, authContent, 'utf8');
    console.log('[Zed] Direct 1-Click Google OAuth & Workspace Auto-Enrollment active!');
}

// 7. Force "Continue with Google" on Welcome & SignInUp Screens
function patchFrontAssets(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const fullPath = path.join(dir, f);
        if (f.startsWith('SignInUp') && f.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            content = content.replace('c.google&&(0,e.jsx)(os,{action:"join-workspace"})', '(0,e.jsx)(os,{action:"join-workspace"})');
            content = content.replace('t.google&&(0,e.jsx)(os,{action:"list-available-workspaces"', '(0,e.jsx)(os,{action:"list-available-workspaces"');
            content = content.replace('(c.google||c.microsoft||c.sso.length>0)&&c.password?(0,e.jsx)(K,{}):null', 'c.password?(0,e.jsx)(K,{}):null');
            fs.writeFileSync(fullPath, content, 'utf8');
            console.log('[Zed] Patched SignInUp asset:', f);
        }
        if (f.startsWith('Logo') && f.endsWith('.js')) {
            let logoContent = fs.readFileSync(fullPath, 'utf8');
            logoContent = logoContent.replace(/a\(n\)\?\(0,r\.jsx\)\(d,\{children:\(0,r\.jsx\)\(C,\{src:n\}\)\}\):a\(s\)&&\(0,r\.jsx\)\(d,\{children:\(0,r\.jsx\)\(_,\{size:"lg",placeholder:s,type:"squared",placeholderColorSeed:s\}\)\}\)/, 'null');
            fs.writeFileSync(fullPath, logoContent, 'utf8');
            console.log('[Zed] Removed sub-badge on logo component:', f);
        }
    }
}
patchFrontAssets(path.join(FRONT_DIR, 'assets'));

// 8. Vector Favicon Data URI
const ZED_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
    <linearGradient id="zGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#cbd5e1"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="16" fill="url(#bgGrad)"/>
  <rect width="62" height="62" x="1" y="1" rx="15" fill="none" stroke="#334155" stroke-width="1.5" opacity="0.6"/>
  <path d="M16 16 h32 v7 L26.5 41 H48 v7 H16 v-7 L37.5 23 H16 Z" fill="url(#zGrad)"/>
</svg>`;

const ZED_DATA_URI = "data:image/svg+xml," + encodeURIComponent(ZED_SVG);

// 9. Generate 64x64 RGBA PNG
function createZedPNG64() {
    const width = 64, height = 64;
    const rawData = Buffer.alloc(height * (width * 4 + 1));
    for (let y = 0; y < height; y++) {
        const rowOffset = y * (width * 4 + 1);
        rawData[rowOffset] = 0;
        for (let x = 0; x < width; x++) {
            const pxOffset = rowOffset + 1 + x * 4;
            const inBox = (x >= 2 && x <= 61 && y >= 2 && y <= 61);
            const cornerDist = Math.max(0, 14 - x) ** 2 + Math.max(0, 14 - y) ** 2;
            const cornerDistTR = Math.max(0, x - 49) ** 2 + Math.max(0, 14 - y) ** 2;
            const cornerDistBL = Math.max(0, 14 - x) ** 2 + Math.max(0, y - 49) ** 2;
            const cornerDistBR = Math.max(0, x - 49) ** 2 + Math.max(0, y - 49) ** 2;
            const isCornerCut = (x < 14 && y < 14 && cornerDist > 196) ||
                               (x > 49 && y < 14 && cornerDistTR > 196) ||
                               (x < 14 && y > 49 && cornerDistBL > 196) ||
                               (x > 49 && y > 49 && cornerDistBR > 196);
            if (!inBox || isCornerCut) {
                rawData[pxOffset + 3] = 0;
                continue;
            }
            const inTopBar = (y >= 16 && y <= 22 && x >= 16 && x <= 48);
            const inBottomBar = (y >= 41 && y <= 47 && x >= 16 && x <= 48);
            const diagPos = (x * 1.1 + y);
            const inDiag = (diagPos >= 54 && diagPos <= 63 && y >= 22 && y <= 41 && x >= 16 && x <= 48);
            if (inTopBar || inBottomBar || inDiag) {
                rawData[pxOffset] = 255;
                rawData[pxOffset + 1] = 255;
                rawData[pxOffset + 2] = 255;
                rawData[pxOffset + 3] = 255;
            } else {
                rawData[pxOffset] = 15;
                rawData[pxOffset + 1] = 23;
                rawData[pxOffset + 2] = 42;
                rawData[pxOffset + 3] = 255;
            }
        }
    }
    const compressed = zlib.deflateSync(rawData);
    function makeChunk(type, data) {
        const len = Buffer.alloc(4);
        len.writeUInt32BE(data.length, 0);
        const typeBuf = Buffer.from(type, 'ascii');
        const toCrc = Buffer.concat([typeBuf, data]);
        let crc = 0 ^ (-1);
        const crcTable = [];
        for (let n = 0; n < 256; n++) {
            let c = n;
            for (let k = 0; k < 8; k++) c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
            crcTable[n] = c;
        }
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
    ihdrData[8] = 8;
    ihdrData[9] = 6;
    ihdrData[10] = 0; ihdrData[11] = 0; ihdrData[12] = 0;
    return Buffer.concat([sig, makeChunk('IHDR', ihdrData), makeChunk('IDAT', compressed), makeChunk('IEND', Buffer.alloc(0))]);
}

const zedPngBuffer = createZedPNG64();

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
            } else if (['.png', '.ico', '.webp'].includes(ext) && (full.includes('icon') || full.includes('logo') || full.includes('favicon') || full.includes('android') || full.includes('ios'))) {
                fs.writeFileSync(full, zedPngBuffer);
            }
        }
    }
}

replaceIconFiles(path.join(FRONT_DIR, 'images/icons'));
replaceIconFiles(path.join(FRONT_DIR, 'images/integrations'));
fs.writeFileSync(path.join(FRONT_DIR, 'favicon.ico'), zedPngBuffer);
fs.writeFileSync(path.join(FRONT_DIR, 'favicon.svg'), ZED_SVG, 'utf8');

// 10. Inject CSS
const CUSTOM_HIDE_CSS = `
<style id="zed-custom-clean">
  /* Hide external documentation, community, discord, videos & promo sections */
  a[href*="discord"],
  a[href*="discord.gg"],
  a[href*="docs.twenty"],
  a[href*="github.com/twentyhq"],
  a[href*="youtube.com"],
  a[href*="loom.com"],
  a[href*="vimeo.com"],
  a[href*="/settings/community"],
  a[href*="/community"],
  a[href*="documentation"],
  img[src*="/images/ai/"],
  img[src*="cover-light"],
  img[src*="cover-dark"],
  [data-testid*="video-player"],
  [data-testid*="community-link"],
  [data-testid*="documentation-link"],
  div:has(> img[src*="cover-light"]),
  div:has(> img[src*="cover-dark"]),
  /* Hide secondary user profile circle/badge overlaid on workspace logo */
  img[src*="googleusercontent"],
  div:has(> img[src*="googleusercontent"]),
  .sztoge,
  .s1fiw0wm {
    display: none !important;
  }
</style>
`;

// 11. Update index.html
const indexHtmlPath = path.join(FRONT_DIR, 'index.html');
if (fs.existsSync(indexHtmlPath)) {
    let html = fs.readFileSync(indexHtmlPath, 'utf8');
    html = html.replace(/<link[^>]*rel=["'](?:shortcut\s+)?icon["'][^>]*\/?>/gis, '');
    html = html.replace(/<link[^>]*rel=["']apple-touch-icon["'][^>]*\/?>/gis, '');
    html = html.replace(/<style id="zed-custom-clean">[\s\S]*?<\/style>/gis, '');
    html = html.replace(/<title>.*?<\/title>/gis, '<title>Zed</title>');
    const newTags = `<title>Zed</title>\n<link rel="icon" type="image/svg+xml" href="${ZED_DATA_URI}">\n<link rel="alternate icon" type="image/png" href="/favicon.ico">\n<link rel="apple-touch-icon" href="${ZED_DATA_URI}">\n${CUSTOM_HIDE_CSS}`;
    html = html.replace(/<head>/i, `<head>\n    ${newTags}`);
    fs.writeFileSync(indexHtmlPath, html, 'utf8');
}

// 12. Rename tab title string & Twenty mentions in all dist files
function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
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

const allFiles = walk(SERVER_DIR);
for (const filePath of allFiles) {
    const ext = path.extname(filePath);
    if (!['.html', '.js', '.json'].includes(ext)) continue;
    let content = fs.readFileSync(filePath, 'utf8');
    let orig = content;
    content = content.replace(/document\.title\s*=\s*["']Twenty["']/g, 'document.title="Zed"');
    content = content.replace(/document\.title\s*=\s*`Twenty`/g, 'document.title="Zed"');
    content = content.replace(/document\.title\s*=\s*`\${(.*)} - Twenty`/g, 'document.title=`$$1 - Zed`');
    content = content.replace(/document\.title\s*=\s*["']Twenty - /g, 'document.title="Zed - ');
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

    // Protect crucial internal identifiers
    content = content.replaceAll('isZedStandardApplication', 'isTwentyStandardApplication');
    content = content.replaceAll('allowRequestsToZedIcons', 'allowRequestsToTwentyIcons');
    content = content.replaceAll('zedcrm/twenty', 'twentycrm/twenty');

    if (content !== orig) {
        fs.writeFileSync(filePath, content, 'utf8');
    }
}

console.log('[Zed] All patches applied cleanly with Single-Domain Redirects, Direct Google OAuth & Complete Rebrand!');
EOF
