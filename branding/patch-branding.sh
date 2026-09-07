#!/bin/sh
# Zed complete rebrand, Enterprise activation, Direct Google Auth & Seamless Workspace Access
set -e

FRONT_DIR="/app/packages/twenty-server/dist/front"
SERVER_DIR="/app/packages/twenty-server/dist"

# 0. Start in-container ultra-lightweight Redis daemon (capped at 32MB max, consumes ~4MB RAM)
if command -v redis-server >/dev/null 2>&1; then
    mkdir -p /var/log/redis /var/lib/redis
    redis-server --daemonize yes \
                 --port 6379 \
                 --bind 127.0.0.1 \
                 --save "" \
                 --appendonly no \
                 --maxmemory 12mb \
                 --maxmemory-policy noeviction \
                 --loglevel warning
    echo "[Zed] In-container Redis daemon started on 127.0.0.1:6379 (maxmemory: 12mb)"
else
    echo "[Zed] Installing redis via apk..."
    apk add --no-cache redis || true
    if command -v redis-server >/dev/null 2>&1; then
        mkdir -p /var/log/redis /var/lib/redis
        redis-server --daemonize yes \
                     --port 6379 \
                     --bind 127.0.0.1 \
                     --save "" \
                     --appendonly no \
                     --maxmemory 12mb \
                     --maxmemory-policy noeviction \
                     --loglevel warning
        echo "[Zed] In-container Redis daemon started on 127.0.0.1:6379 after apk add"
    fi
fi

# Remove dist/front only when explicitly disabled (cloud Vercel mode) — keep for local dev where frontend is served by same server
if [ "$DISABLE_FRONTEND" = "true" ] && [ -d "/app/packages/twenty-server/dist/front" ]; then
    rm -rf /app/packages/twenty-server/dist/front
    echo "[Zed] Removed dist/front to disable ServeStaticModule and save RAM (Frontend is served by Vercel Edge CDN)"
fi

echo "[Zed] Applying Single-Domain Redirects, Direct Google Auth & Branding patch..."

node --max-old-space-size=128 - << 'EOF'
const dns = require('dns');
if (dns.setDefaultResultOrder) dns.setDefaultResultOrder('ipv4first');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const FRONT_DIR = '/app/packages/twenty-server/dist/front';
const SERVER_DIR = '/app/packages/twenty-server/dist';

// 0a. Neutralize heavy telemetry/profiling in instrument.js (saves ~40MB RAM)
const instrumentFile = path.join(SERVER_DIR, 'instrument.js');
if (fs.existsSync(instrumentFile)) {
    fs.writeFileSync(instrumentFile, '"use strict";\nObject.defineProperty(exports, "__esModule", { value: true });\n// Telemetry & profiling neutralized for 512MB RAM constraint\n', 'utf8');
    console.log('[Zed] Neutralized heavy telemetry & profiling in instrument.js (saves ~40MB RAM)!');
}

// 0b. Neutralize SentryModule in app.module.js
const appModuleFile = path.join(SERVER_DIR, 'app.module.js');
if (fs.existsSync(appModuleFile)) {
    let appContent = fs.readFileSync(appModuleFile, 'utf8');
    appContent = appContent.replace(/(?:[a-zA-Z0-9_]+\.)?SentryModule\.forRoot\([^)]*\)/g, '{ module: class DummySentryModule {} }');
    fs.writeFileSync(appModuleFile, appContent, 'utf8');
    console.log('[Zed] Patched app.module.js: neutralized SentryModule!');
}

// 1. Backend Enterprise Plan Service & Resolver
const enterpriseFile = path.join(SERVER_DIR, 'engine/core-modules/enterprise/services/enterprise-plan.service.js');
if (fs.existsSync(enterpriseFile)) {
    let entContent = fs.readFileSync(enterpriseFile, 'utf8');
    
    entContent = entContent.replace(/hasValidSignedEnterpriseKey\(\)\s*\{[\s\S]*?hasValidEnterpriseValidityToken\(\)\s*\{[\s\S]*?isValid\(\)\s*\{[\s\S]*?isValidEnterpriseKeyFormat\(key\)\s*\{[\s\S]*?async getLicenseInfo/, `hasValidSignedEnterpriseKey() {
        return true;
    }
    hasValidEnterpriseValidityToken() {
        return true;
    }
    isValid() {
        return true;
    }
    isValidEnterpriseKeyFormat(key) {
        return true;
    }
    async getLicenseInfo`);

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

const wsResolverFile = path.join(SERVER_DIR, 'engine/core-modules/workspace/workspace.resolver.js');
if (fs.existsSync(wsResolverFile)) {
    let wsContent = fs.readFileSync(wsResolverFile, 'utf8');
    wsContent = wsContent.replace(/hasValidSignedEnterpriseKey\(\)\s*\{\s*return this\.enterprisePlanService\.hasValidSignedEnterpriseKey\(\);\s*\}/, 'hasValidSignedEnterpriseKey() {\n        return true;\n    }');
    wsContent = wsContent.replace(/hasValidEnterpriseValidityToken\(\)\s*\{\s*return this\.enterprisePlanService\.hasValidEnterpriseValidityToken\(\);\s*\}/, 'hasValidEnterpriseValidityToken() {\n        return true;\n    }');
    fs.writeFileSync(wsResolverFile, wsContent, 'utf8');
    console.log('[Zed] Patched WorkspaceResolver for active enterprise!');
}

// 1b. Fix SMTP Driver for Gmail Port 465 (SSL)
const emailFactoryFile = path.join(SERVER_DIR, 'engine/core-modules/email/email-driver.factory.js');
if (fs.existsSync(emailFactoryFile)) {
    let efContent = fs.readFileSync(emailFactoryFile, 'utf8');
    efContent = efContent.replace(
        /const options = \{\s*host,\s*port\s*\};/,
        `const options = { host, port: Number(port), secure: Number(port) === 465 };`
    );
    fs.writeFileSync(emailFactoryFile, efContent, 'utf8');
    console.log('[Zed] Patched EmailDriverFactory for Gmail SSL on port 465!');
}

// 1c. Deploy Gmail API Email Service (HTTPS 443)
if (fs.existsSync('/home/daytona/Lead-CRM/email.service.patched.js')) {
    fs.copyFileSync('/home/daytona/Lead-CRM/email.service.patched.js', path.join(SERVER_DIR, 'engine/core-modules/email/email.service.js'));
    console.log('[Zed] Deployed Gmail API HTTPS EmailService into server dist!');
}

// 1d. Rebrand Invitation emails to Zed with Corporate-Level HTML Template
const wsInviteFile = path.join(SERVER_DIR, 'engine/core-modules/workspace-invitation/services/workspace-invitation.service.js');
if (fs.existsSync(wsInviteFile)) {
    let wiContent = fs.readFileSync(wsInviteFile, 'utf8');
    wiContent = wiContent.replace(
        /message:\s*"Join your team on Twenty"/g,
        'message: "Join your team on Zed"'
    );
    wiContent = wiContent.replace(
        /`\${sender\.name\.firstName} \${sender\.name\.lastName} \(via Twenty\) <\${this\.twentyConfigService\.get\('EMAIL_FROM_ADDRESS'\)}>`/g,
        `'"Zed Agency" <zedagencyofficial@gmail.com>'`
    );
    
    // Inject Luxury Editorial "Welcome to Zed" HTML template (Z logo orb, zero spam)
    if (!wiContent.includes('Welcome to zed')) {
        wiContent = wiContent.replace(
            /const html = await \(0, _twentyemails\.renderEmail\)\(emailTemplate\);/,
            `const inviterName = [sender.name?.firstName, sender.name?.lastName].filter(Boolean).join(' ') || sender.userEmail?.split('@')[0] || 'Karthik';
            const workspaceTitle = workspace.displayName || 'Zed Agency Workspace';
            const inviteUrl = link.toString();
            const roleDisplay = 'Administrator';
            const html = \`<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Zed</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,400;1,600&display=swap');
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #faf9f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #111827;">
  <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all; font-size: 1px; line-height: 1px; max-width: 0px; opacity: 0;">
    You've been invited to join \${workspaceTitle} on Zed CRM. Your seat is ready.
  </div>

  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #faf9f6; padding: 44px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #ffffff; border-radius: 28px; overflow: hidden; border: 1px solid #edece6; box-shadow: 0 8px 30px -4px rgba(0, 0, 0, 0.04);">
          <tr>
            <td style="padding: 44px 38px 38px 38px;">
              
              <div style="text-align: center; margin-bottom: 24px;">
                <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 22px; font-weight: 700; letter-spacing: -0.6px; color: #111827;">zed</span>
              </div>

              <div style="text-align: center; background: radial-gradient(ellipse at center, rgba(167, 243, 208, 0.45) 0%, rgba(209, 250, 229, 0.2) 50%, rgba(255, 255, 255, 0) 72%); padding: 12px 10px 24px 10px; border-radius: 24px;">
                <div style="font-family: 'Playfair Display', Georgia, 'Times New Roman', serif; font-style: italic; font-weight: 400; font-size: 46px; line-height: 1; color: #111827; letter-spacing: -0.5px; margin-bottom: 2px;">Welcome</div>
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 800; font-size: 34px; line-height: 1.15; color: #111827; letter-spacing: -1.2px; margin-top: -2px; margin-bottom: 22px;">to zed</div>
                
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="center">
                      <img src="https://zed-agency-crm.vercel.app/assets/email-orb.png" alt="Zed Emblem" width="220" height="220" style="display: block; width: 220px; height: 220px; border-radius: 50%; object-fit: cover; box-shadow: 0 14px 34px -4px rgba(16, 185, 129, 0.3), 0 4px 12px rgba(0, 0, 0, 0.06);" />
                    </td>
                  </tr>
                </table>
              </div>

              <p style="font-size: 15px; line-height: 1.6; color: #374151; margin: 28px 0 12px 0;">
                Hey, you're officially invited to join <strong>\${workspaceTitle}</strong>.
              </p>

              <p style="font-size: 14px; line-height: 1.6; color: #111827; margin: 0 0 16px 0;">
                Your assigned role: <span style="font-family: ui-monospace, SFMono-Regular, monospace; background-color: #f3f4f6; border: 1px solid #e5e7eb; padding: 3px 10px; border-radius: 8px; font-weight: 700; color: #111827;">\${roleDisplay}</span>
              </p>

              <p style="font-size: 14px; line-height: 1.6; color: #4b5563; margin: 0 0 26px 0;">
                <strong>\${inviterName}</strong> has prepared your access credentials so our team can collaborate seamlessly with high-touch agency automation.
              </p>

              <div style="font-size: 15px; font-weight: 700; color: #111827; margin-bottom: 18px;">
                In the meantime...
              </div>

              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="vertical-align: top; width: 28px; padding-right: 12px;">
                    <div style="width: 24px; height: 24px; border-radius: 50%; border: 1px solid #d1d5db; background-color: #ffffff; text-align: center; line-height: 24px; font-size: 11px; font-weight: 700; color: #374151;">1</div>
                  </td>
                  <td style="vertical-align: top;">
                    <div style="font-size: 14px; line-height: 1.5; color: #374151;">
                      <strong style="color: #111827;">Claim your seat.</strong> Direct link to activate your workspace profile:
                    </div>
                    <div style="margin-top: 8px;">
                      <span style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 20px; padding: 6px 14px; font-family: ui-monospace, SFMono-Regular, monospace; font-size: 12px; color: #111827; word-break: break-all; display: inline-block;">
                        \${inviteUrl}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>

              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="vertical-align: top; width: 28px; padding-right: 12px;">
                    <div style="width: 24px; height: 24px; border-radius: 50%; border: 1px solid #d1d5db; background-color: #ffffff; text-align: center; line-height: 24px; font-size: 11px; font-weight: 700; color: #374151;">2</div>
                  </td>
                  <td style="vertical-align: top;">
                    <div style="font-size: 14px; line-height: 1.5; color: #374151;">
                      <strong style="color: #111827;">Stay in sync.</strong> Automatic Google Calendar meetings, Gmail automation, and CRM pipelines are ready for you.
                    </div>
                  </td>
                </tr>
              </table>

              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="vertical-align: top; width: 28px; padding-right: 12px;">
                    <div style="width: 24px; height: 24px; border-radius: 50%; border: 1px solid #d1d5db; background-color: #ffffff; text-align: center; line-height: 24px; font-size: 11px; font-weight: 700; color: #374151;">3</div>
                  </td>
                  <td style="vertical-align: top;">
                    <div style="font-size: 14px; line-height: 1.5; color: #374151;">
                      <strong style="color: #111827;">Finish your profile.</strong> Click below to accept the invitation and enter your workspace immediately.
                    </div>
                    <div style="margin-top: 14px;">
                      <a href="\${inviteUrl}" target="_blank" style="display: inline-block; background-color: #000000; color: #ffffff; font-size: 13px; font-weight: 600; text-decoration: none; padding: 12px 26px; border-radius: 24px; box-shadow: 0 4px 10px rgba(0,0,0,0.15); text-align: center;">
                        Accept Invitation &rarr;
                      </a>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="font-size: 14px; line-height: 1.5; color: #4b5563; margin: 28px 0 16px 0;">
                We're excited to have you on board.
              </p>
              <p style="font-size: 14px; font-weight: 600; color: #111827; margin: 0 0 24px 0;">
                &mdash; Zed Team
              </p>

              <div style="padding-top: 20px; border-top: 1px solid #f3f4f6; font-size: 13px; line-height: 1.6; color: #6b7280; font-style: italic;">
                ps. If you respond to this email, a human will respond back... just saying.
              </div>

            </td>
          </tr>
        </table>

        <div style="text-align: center; margin-top: 24px;">
          <a href="https://zed.agency" style="font-size: 12px; color: #9ca3af; text-decoration: none; letter-spacing: 0.2px;">www.zed.agency</a>
        </div>

      </td>
    </tr>
  </table>
</body>
</html>\`;`
        );
    }
    fs.writeFileSync(wsInviteFile, wiContent, 'utf8');
    console.log('[Zed] Patched WorkspaceInvitationService with luxury editorial Welcome to Zed template!');
}

// 1e. Configure Clean Zed & OpenAI AI Providers in ai-providers.json
const aiProvidersFile = path.join(SERVER_DIR, 'engine/metadata-modules/ai/ai-models/ai-providers.json');
if (fs.existsSync(aiProvidersFile)) {
    try {
        let aiJson = JSON.parse(fs.readFileSync(aiProvidersFile, 'utf8'));
        delete aiJson.deepseek;
        delete aiJson['deepseek-ai'];
        
        aiJson.zed = {
            npm: "@ai-sdk/openai",
            label: "Zed",
            apiKey: "freellmapi-b8b35f76a87a2e3db4985258c26197a2f22ceabe528eb6ac",
            baseURL: "https://server-llm-1.onrender.com/v1",
            baseUrl: "https://server-llm-1.onrender.com/v1",
            models: [
                {
                    name: "auto",
                    label: "Zed",
                    modelFamily: "ZED",
                    inputCostPerMillionTokens: 0,
                    outputCostPerMillionTokens: 0,
                    contextWindowTokens: 1000000,
                    maxOutputTokens: 32768,
                    supportsReasoning: true
                }
            ]
        };
        if (aiJson.openai) {
            aiJson.openai.label = "OpenAI";
            aiJson.openai.apiKey = "freellmapi-b8b35f76a87a2e3db4985258c26197a2f22ceabe528eb6ac";
            aiJson.openai.baseURL = "https://server-llm-1.onrender.com/v1";
            aiJson.openai.baseUrl = "https://server-llm-1.onrender.com/v1";
            aiJson.openai.models = [
                {
                    name: "auto",
                    label: "GPT-4o",
                    modelFamily: "GPT",
                    inputCostPerMillionTokens: 0,
                    outputCostPerMillionTokens: 0,
                    contextWindowTokens: 1000000,
                    maxOutputTokens: 32768,
                    modalities: ["image", "pdf"]
                },
                {
                    name: "auto",
                    label: "GPT-4o mini",
                    modelFamily: "GPT",
                    inputCostPerMillionTokens: 0,
                    outputCostPerMillionTokens: 0,
                    contextWindowTokens: 1000000,
                    maxOutputTokens: 32768,
                    modalities: ["image", "pdf"]
                }
            ];
        }
        fs.writeFileSync(aiProvidersFile, JSON.stringify(aiJson, null, 2), 'utf8');
        console.log('[Zed] Configured clean Zed & OpenAI AI providers in ai-providers.json!');
    } catch (e) {
        console.error('[Zed] Error updating ai-providers.json:', e.message);
    }
}

// 1f. Set Zed (zed/auto) as default and recommended AI model
const aiPrefsFile = path.join(SERVER_DIR, 'engine/metadata-modules/ai/ai-models/services/ai-model-preferences.service.js');
if (fs.existsSync(aiPrefsFile)) {
    let prefsContent = fs.readFileSync(aiPrefsFile, 'utf8');
    prefsContent = prefsContent.replace(
        /getPreferences\(\)\s*\{[\s\S]*?getRecommendedModelIds/,
        `getPreferences() {
        return {
            defaultFastModels: ['zed/auto'],
            defaultSmartModels: ['zed/auto'],
            recommendedModels: ['zed/auto'],
            disabledModels: []
        };
    }
    getRecommendedModelIds`
    );
    fs.writeFileSync(aiPrefsFile, prefsContent, 'utf8');
    console.log('[Zed] Patched AiModelPreferencesService to default to Zed (zed/auto)!');
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
    ctrlContent = ctrlContent.replace(/\(0, _common\.Get\)\('redirect'\)/g, "(0, _common.Get)(['redirect', 'callback'])");
    fs.writeFileSync(googleCtrlFile, ctrlContent, 'utf8');
    console.log('[Zed] Supported both /redirect and /callback on GoogleAuthController!');
}

const googleApisCtrlFile = path.join(SERVER_DIR, 'engine/core-modules/auth/controllers/google-apis-auth.controller.js');
if (fs.existsSync(googleApisCtrlFile)) {
    let apisContent = fs.readFileSync(googleApisCtrlFile, 'utf8');
    apisContent = apisContent.replace(/\(0, _common\.Get\)\('get-access-token'\)/g, "(0, _common.Get)(['get-access-token', 'callback', 'redirect'])");
    fs.writeFileSync(googleApisCtrlFile, apisContent, 'utf8');
    console.log('[Zed] Supported both /redirect and /callback on GoogleAPIsAuthController!');
}

// 4. Force Single-Domain (No Subdomain Redirects)
const workspaceDomainsFile = path.join(SERVER_DIR, 'engine/core-modules/domain/workspace-domains/services/workspace-domains.service.js');
if (fs.existsSync(workspaceDomainsFile)) {
    let wsContent = fs.readFileSync(workspaceDomainsFile, 'utf8');
    wsContent = wsContent.replace(/getBaseUrl\(workspace\)\s*\{[\s\S]*?const customDomain = workspace\?\.customDomain;[\s\S]*?return `https:\/\/\${workspace\.subdomain}\.\${primaryDomain}`;\s*\}/, `getBaseUrl(workspace) {
        const primaryDomain = process.env.FRONTEND_URL || process.env.FRONT_BASE_URL || this.twentyConfigService.get('FRONTEND_URL') || this.twentyConfigService.get('SERVER_URL') || 'http://localhost:3000';
        return primaryDomain.replace(/\\/$/, '');
    }`);
    wsContent = wsContent.replace(/buildWorkspaceURL\(\{\s*workspace,\s*pathname = '',\s*searchParams,\s*subdomain,\s*\}\)\s*\{[\s\S]*?return url;\s*\}/, `buildWorkspaceURL({ workspace, pathname = '', searchParams }) {
        const serverUrl = process.env.FRONTEND_URL || process.env.FRONT_BASE_URL || this.twentyConfigService.get('FRONTEND_URL') || this.twentyConfigService.get('SERVER_URL') || 'http://localhost:3000';
        const url = new URL(pathname.startsWith('/') ? pathname : '/' + pathname, serverUrl);
        if (searchParams) {
            for (const [key, value] of Object.entries(searchParams)) {
                if (value !== undefined) {
                    url.searchParams.append(key, String(value));
                }
            }
        }
        return url;
    }`);
    fs.writeFileSync(workspaceDomainsFile, wsContent, 'utf8');
    console.log('[Zed] WorkspaceDomainsService patched to prevent subdomain redirect loops!');
}

// 5. Onboarding Service - Always Return COMPLETED
const onboardingFile = path.join(SERVER_DIR, 'engine/core-modules/onboarding/onboarding.service.js');
if (fs.existsSync(onboardingFile)) {
    let obContent = fs.readFileSync(onboardingFile, 'utf8');
    obContent = obContent.replace(/async getOnboardingStatus\(workspaceId\)\s*\{[\s\S]*?return onboardingStatus;\s*\}/, `async getOnboardingStatus(workspaceId) {
        return _onboardingstatusenum.OnboardingStatus.COMPLETED;
    }`);
    obContent = obContent.replace(/async isOnboardingInviteTeamPending\([\s\S]*?return pending;\s*\}/, `async isOnboardingInviteTeamPending() {
        return false;
    }`);
    fs.writeFileSync(onboardingFile, obContent, 'utf8');
    console.log('[Zed] Onboarding service patched to always return COMPLETED!');
}

// 6. Direct Google Auth / Auto-Enrollment & Social SSO Fix
const ADMIN_EMAILS = [
    'balunithyapriya@gmail.com',
    'bkarthikeyan.cse2025@citchennai.net',
    'zedagencyofficial@gmail.com'
];

const authServiceFile = path.join(SERVER_DIR, 'engine/core-modules/auth/services/auth.service.js');
if (fs.existsSync(authServiceFile)) {
    let authContent = fs.readFileSync(authServiceFile, 'utf8');
    
    const ssoRegex = /(?:async\s+)?signInUpWithSocialSso\s*\([\s\S]*?(?:async\s+)?createSsoConnectedAccountIfFeatureFlagIsOn\s*\(/i;
    if (authContent.match(ssoRegex)) {
        authContent = authContent.replace(ssoRegex, `async signInUpWithSocialSso({ firstName, lastName, email: rawEmail, picture, workspaceInviteHash, workspaceId, billingCheckoutSessionState, locale, returnToPath }, authProvider) {
        const adminEmails = ${JSON.stringify(ADMIN_EMAILS)};
        const userEmail = (rawEmail || '').toLowerCase().trim();
        console.log('[Zed-Auth] Social SSO login initiated for:', userEmail, 'provider:', authProvider);

        let existingUser = await this.userRepository.findOne({
            where: { email: userEmail }
        });

        if (!existingUser) {
            existingUser = await this.userRepository.save({
                email: userEmail,
                firstName: firstName || 'Zed',
                lastName: lastName || 'User',
                isEmailVerified: true
            });
            console.log('[Zed-Auth] Auto-created new user:', existingUser.id, userEmail);
        } else if (!existingUser.isEmailVerified) {
            existingUser.isEmailVerified = true;
            await this.userRepository.save(existingUser);
        }

        let defaultWorkspace = await this.workspaceRepository.findOne({
            order: { createdAt: 'ASC' }
        });

        if (defaultWorkspace) {
            try {
                if (this.userWorkspaceService && typeof this.userWorkspaceService.addUserToWorkspaceIfUserNotInWorkspace === 'function') {
                    await this.userWorkspaceService.addUserToWorkspaceIfUserNotInWorkspace(existingUser, defaultWorkspace);
                    console.log('[Zed-Auth] Workspace membership ensured for:', userEmail);
                }
            } catch (err) {
                console.log('[Zed-Auth] addUserToWorkspace notice:', err.message);
            }
        }

        const loginToken = await this.loginTokenService.generateLoginToken(
            existingUser.email,
            defaultWorkspace ? defaultWorkspace.id : undefined,
            authProvider
        );
        console.log('[Zed-Auth] Generated loginToken for:', userEmail);

        let redirectUrl;
        try {
            redirectUrl = this.computeRedirectURI({
                loginToken: loginToken.token,
                workspace: defaultWorkspace,
                billingCheckoutSessionState,
                returnToPath: returnToPath || '/objects/people'
            });
        } catch (redirErr) {
            console.log('[Zed-Auth] computeRedirectURI fallback:', redirErr.message);
            const frontUrl = process.env.FRONT_BASE_URL || process.env.FRONTEND_URL || 'https://zed-agency-crm.vercel.app';
            redirectUrl = frontUrl.replace(/\\/$/, '') + '/auth/verify?loginToken=' + encodeURIComponent(loginToken.token) + '&returnToPath=' + encodeURIComponent(returnToPath || '/objects/people');
        }

        return redirectUrl;
    }
    async createSsoConnectedAccountIfFeatureFlagIsOn(`);

        fs.writeFileSync(authServiceFile, authContent, 'utf8');
        console.log('[Zed] Direct 1-Click Google OAuth & Workspace Auto-Enrollment active in signInUpWithSocialSso!');
    } else {
        console.warn('[Zed WARN] Could not find signInUpWithSocialSso in auth.service.js to patch!');
    }
}

// 6b. Ensure currentUser resolver never throws on workspace lookup
const userResolverFile = path.join(SERVER_DIR, 'engine/core-modules/user/user.resolver.js');
if (fs.existsSync(userResolverFile)) {
    let uContent = fs.readFileSync(userResolverFile, 'utf8');
    uContent = uContent.replace(/if \(!\(0, _twentysharedutils\.isDefined\)\(currentUserWorkspace\)\)\s*\{\s*throw new Error\('Current user workspace not found'\);\s*\}/, `if (!(0, _twentysharedutils.isDefined)(currentUserWorkspace)) {
        currentUserWorkspace = user.userWorkspaces?.[0] || { id: refreshedWorkspace.id, workspaceId: refreshedWorkspace.id, twoFactorAuthenticationMethods: [] };
    }`);
    uContent = uContent.replace(/if \(!isDefined\(currentUserWorkspace\)\)\s*\{\s*throw new Error\('Current user workspace not found'\);\s*\}/, `if (!isDefined(currentUserWorkspace)) {
        currentUserWorkspace = user.userWorkspaces?.[0] || { id: refreshedWorkspace.id, workspaceId: refreshedWorkspace.id, twoFactorAuthenticationMethods: [] };
    }`);
    fs.writeFileSync(userResolverFile, uContent, 'utf8');
    console.log('[Zed] Patched currentUser resolver in user.resolver.js!');
}

// 7. Frontend assets patching (Only if PATCH_FRONT_ASSETS is true; skipped on Render to prevent OOM since frontend is hosted on Vercel Edge CDN)
if (process.env.PATCH_FRONT_ASSETS === 'true') {
    function patchFrontAssets(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const fullPath = path.join(dir, f);
        if (f.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // Replace Twenty logo placeholder with Zed Z logo everywhere
            if (content.includes('twentyhq.github.io/placeholder-images/workspaces/twenty-logo.png')) {
                content = content.replace(/https:\/\/twentyhq\.github\.io\/placeholder-images\/workspaces\/twenty-logo\.png/g, '/favicon.svg');
                modified = true;
            }


            if (f.startsWith('SettingsEnterprise')) {
                content = content.replace(/\[v,ie\]=\(0,n\.useState\)\(null\),\[qe,Ee\]=\(0,n\.useState\)\(!1\)/g, '[v,ie]=(0,n.useState)({status:"active",licensee:"Zed Agency",expiresAt:new Date(Date.now()+315360000000),cancelAt:null,currentPeriodEnd:new Date(Date.now()+315360000000),isCancellationScheduled:!1}),[qe,Ee]=(0,n.useState)(!0)');
                content = content.replace(/const [A-Za-z0-9_]+=h\?\..*?,[A-Za-z0-9_]+=h\?\..*?,[A-Za-z0-9_]+=[A-Za-z0-9_]+&&![A-Za-z0-9_]+/g, 'const A=!0,te=!0,Le=!1');
                content = content.replace(/const A=.*?,te=.*?,Le=.*?;/g, 'const A=!0,te=!0,Le=!1;');
                content = content.replace(/ie\(_\?\.enterpriseSubscriptionStatus\?\?null\)/g, 'ie({status:"active",licensee:"Zed Agency",expiresAt:new Date(Date.now()+315360000000),cancelAt:null,currentPeriodEnd:new Date(Date.now()+315360000000),isCancellationScheduled:!1})');
                content = content.replace(/const S=v\?\.status\?\?null,Ie=S==="active"\|\|S==="trialing"/g, 'const S="active",Ie=!0');
                content = content.replace(/Q=v\?\.licensee\?\?null/g, 'Q="Zed Agency"');
                content = content.replace(/W=v\?\.expiresAt\?new Date\(v\.expiresAt\):null/g, 'W=new Date(Date.now()+315360000000)');
                modified = true;
                console.log('[Zed] Patched SettingsEnterprise front asset for immediate active display:', f);
            }

            if (f.startsWith('index') && f.endsWith('.js')) {
                content = content.replace(
                    /Z_ICON=\([^)]*\)=>[^,]*,DJ=\{zed:\{Icon:Z_ICON\},openai:/g,
                    'DJ={openai:'
                );
                content = content.replace(/B5=\{ZED:Z_ICON,/g, 'B5={');
                content = content.replace(/,Z_ICON=\([^)]*\)=>[^,]*,B5=\{/g, ',B5={');

                content = content.replace(
                    /,B5=\{/,
                    ',Z_ICON=({size:sz=16,className:cl,style:st})=>(0,s.jsx)("img",{src:"/favicon.svg",width:sz,height:sz,className:cl,style:{...st,borderRadius:2,display:"inline-block",verticalAlign:"middle",objectFit:"contain"}}),B5={ZED:Z_ICON,'
                );
                content = content.replace(
                    /DJ=\{openai:\{Icon:wR\}/,
                    'DJ={zed:{Icon:Z_ICON},openai:{Icon:wR}'
                );
                content = content.replace(
                    /UV=\(e,t\)=>e&&IHe\(e\)\?B5\[e\]:t\?bHe\(t\):B5\.FALLBACK/g,
                    'UV=(e,t)=>t==="zed"||e==="ZED"||t==="auto"||t==="Zed"?Z_ICON:e&&IHe(e)?B5[e]:t?bHe(t):Z_ICON'
                );
                modified = true;
                console.log('[Zed] Patched AI model icons and UV in index asset:', f);
            }

            if (f.startsWith('Logo') && f.endsWith('.js')) {
                content = content.replace(/android-launchericon-192-192\.png/g, 'favicon.svg');
                content = content.replace(/a\(n\)\?\(0,r\.jsx\)\(d,\{children:\(0,r\.jsx\)\(C,\{src:n\}\)\}\):a\(s\)&&\(0,r\.jsx\)\(d,\{children:\(0,r\.jsx\)\(_,\{size:"lg",placeholder:s,type:"squared",placeholderColorSeed:s\}\)\}\)/, 'null');
                modified = true;
                console.log('[Zed] Patched Logo component to use vector SVG:', f);
            }

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
            }
        }
    }
}
    patchFrontAssets(path.join(FRONT_DIR, 'assets'));

    // 8. Vector Favicon Data URI & SVG
    const ZED_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B0F19"/>
      <stop offset="100%" stop-color="#111827"/>
    </linearGradient>
    <linearGradient id="zGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#E2E8F0"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="28" fill="url(#bgGrad)"/>
  <rect width="126" height="126" x="1" y="1" rx="27" fill="none" stroke="#1F2937" stroke-width="1.5"/>
  <path d="M34 36 H94 V48 L53 82 H94 V94 H34 V82 L75 48 H34 Z" fill="url(#zGrad)"/>
</svg>`;

const ZED_DATA_URI = "data:image/svg+xml," + encodeURIComponent(ZED_SVG);

// 9. Generate 192x192 RGBA PNG for icons
function createZedPNG192() {
    const width = 192, height = 192;
    const rawData = Buffer.alloc(height * (width * 4 + 1));
    for (let y = 0; y < height; y++) {
        const rowOffset = y * (width * 4 + 1);
        rawData[rowOffset] = 0;
        for (let x = 0; x < width; x++) {
            const pxOffset = rowOffset + 1 + x * 4;
            const inBox = (x >= 4 && x <= 187 && y >= 4 && y <= 187);
            const cornerDistTL = Math.max(0, 42 - x) ** 2 + Math.max(0, 42 - y) ** 2;
            const cornerDistTR = Math.max(0, x - 149) ** 2 + Math.max(0, 42 - y) ** 2;
            const cornerDistBL = Math.max(0, 42 - x) ** 2 + Math.max(0, y - 149) ** 2;
            const cornerDistBR = Math.max(0, x - 149) ** 2 + Math.max(0, y - 149) ** 2;
            const isCornerCut = (x < 42 && y < 42 && cornerDistTL > 1764) ||
                               (x > 149 && y < 42 && cornerDistTR > 1764) ||
                               (x < 42 && y > 149 && cornerDistBL > 1764) ||
                               (x > 149 && y > 149 && cornerDistBR > 1764);
            if (!inBox || isCornerCut) {
                rawData[pxOffset + 3] = 0;
                continue;
            }
            const inTopBar = (y >= 54 && y <= 72 && x >= 51 && x <= 141);
            const inBottomBar = (y >= 123 && y <= 141 && x >= 51 && x <= 141);
            const diagPos = (x * 0.95 + y);
            const inDiag = (diagPos >= 165 && diagPos <= 195 && y >= 70 && y <= 125 && x >= 51 && x <= 141);
            if (inTopBar || inBottomBar || inDiag) {
                rawData[pxOffset] = 255;
                rawData[pxOffset + 1] = 255;
                rawData[pxOffset + 2] = 255;
                rawData[pxOffset + 3] = 255;
            } else {
                rawData[pxOffset] = 11;
                rawData[pxOffset + 1] = 15;
                rawData[pxOffset + 2] = 25;
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

const zedPngBuffer = createZedPNG192();

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
  .last-badge,
  div:has(> .last-badge),
  /* Completely hide Documentation menu & links in sidebar and settings */
  a[href*="docs."],
  a[href*="getting-started"],
  a[href*="documentation"],
  [href*="docs.zed.agency"],
  [href*="docs.twenty"],
  [data-testid*="documentation-link"],
  [data-testid*="documentation"],
  [data-testid*="help-link"],
  div:has(> a[href*="docs."]),
  div:has(> [href*="docs."]),
  div:has(> a[href*="getting-started"]),
  div:has(> a[href*="documentation"]),
  div:has(> div > a[href*="docs."]),
  div:has(> svg[data-testid*="IconHelpCircle"]),
  div:has(> span > svg[data-testid*="IconHelpCircle"]),
  li:has(a[href*="docs."]),
  /* Hide external documentation, community, discord, videos & promo sections */
  a[href*="discord"],
  a[href*="discord.gg"],
  a[href*="github.com/twentyhq"],
  a[href*="youtube.com"],
  a[href*="loom.com"],
  a[href*="vimeo.com"],
  a[href*="/settings/community"],
  a[href*="/community"],
  img[src*="/images/ai/"],
  img[src*="cover-light"],
  img[src*="cover-dark"],
  [data-testid*="video-player"],
  [data-testid*="community-link"],
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
    html = html.replace(/<title>.*?<\/title>/gis, '');
    html = html.replace(/<link[^>]*rel=["'](?:shortcut\s+|alternate\s+)?icon["'][^>]*\/?>/gis, '');
    html = html.replace(/<link[^>]*rel=["']apple-touch-icon["'][^>]*\/?>/gis, '');
    html = html.replace(/<style id="zed-custom-clean">[\s\S]*?<\/style>/gis, '');
    const newTags = `<title>Zed</title>\n    <link rel="icon" type="image/svg+xml" href="${ZED_DATA_URI}">\n    <link rel="alternate icon" type="image/png" href="/favicon.ico">\n    <link rel="apple-touch-icon" href="${ZED_DATA_URI}">\n    ${CUSTOM_HIDE_CSS}`;
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

const allFiles = walk(FRONT_DIR);
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
} else {
    console.log('[Zed] Skipping heavy frontend asset walk (Frontend is served by Vercel Edge CDN)');
}

// 13. Immediate Early Port Binding + Clean Handover to NestJS
const mainFile = path.join(SERVER_DIR, 'main.js');
if (fs.existsSync(mainFile)) {
    let mainContent = fs.readFileSync(mainFile, 'utf8');
    // Strip any previously injected early port bind or lead scraper blocks
    mainContent = mainContent.replace(/\/\/ \[Zed\] EARLY_PORT_BIND[\s\S]*?\/\/ \[Zed\] END_EARLY_PORT_BIND\n?/g, '');
    mainContent = mainContent.replace(/\/\/ \[Zed\] Admin Lead Scraper API[\s\S]*?await app\.listen\(twentyConfigService\.get\('NODE_PORT'\)[^;]*\);\n?(\s*console\.log\('\[Zed\] NestJS fully listening[^']*'\);\n?)?/g, 'await app.listen(twentyConfigService.get(\'NODE_PORT\'));');
    mainContent = mainContent.replace(/await app\.listen\(_earlyPort, '0\.0\.0\.0'\);/g, 'await app.listen(twentyConfigService.get(\'NODE_PORT\'));');

    // 1) Inject clean boot logging and global error traps at the very top of main.js
    const earlyBindHeader = `// [Zed] ACTIVE_BOOT
const dns = require('dns');
if (dns.setDefaultResultOrder) dns.setDefaultResultOrder('ipv4first');
process.on('unhandledRejection', (reason, promise) => {
    console.error('[Zed ERROR] Unhandled Rejection:', reason && (reason.stack || reason.message || reason));
});
process.on('uncaughtException', (err) => {
    console.error('[Zed ERROR] Uncaught Exception:', err && (err.stack || err.message || err));
});
console.log('[Zed] NestJS runtime bootstrap starting...');
// [Zed] END_ACTIVE_BOOT
`;
    mainContent = earlyBindHeader + mainContent;

    // 2) Listen on internal port — only for cloud 512MB mode (DISABLE_FRONTEND=true), otherwise keep original NODE_PORT for local
    if (process.env.DISABLE_FRONTEND === 'true') {
        const newListen = `const _nestPort = Number(process.env.ZED_INTERNAL_PORT || 3001);
        await app.listen(_nestPort, '0.0.0.0');
        console.log('[Zed] NestJS fully listening on internal port ' + _nestPort);
        if (typeof global.gc === 'function') {
            try { global.gc(); } catch(e) {}
            const _m = process.memoryUsage();
            console.log('[Zed Ready] Post-boot Heap: ' + (_m.heapUsed/1024/1024).toFixed(1) + 'MB / ' + (_m.heapTotal/1024/1024).toFixed(1) + 'MB, RSS: ' + (_m.rss/1024/1024).toFixed(1) + 'MB');
        }`;
        if (/await app\.listen\([\s\S]*?\);\n?/.test(mainContent)) {
            mainContent = mainContent.replace(/await app\.listen\([\s\S]*?\);\n?/, newListen + '\n');
            console.log('[Zed] Successfully patched app.listen to internal port 3001!');
        } else {
            console.warn('[Zed WARNING] Could not find await app.listen in main.js!');
        }
    } else {
        console.log('[Zed] Keeping original app.listen on NODE_PORT for local dev');
    }
    mainContent = mainContent.replace(/(?:void\s+)?bootstrap\(\);?/, 'bootstrap().then(() => console.log("[Zed] Bootstrap completed successfully.")).catch(err => { console.error("[Zed FATAL] Bootstrap error:", err); process.exit(1); });');
    fs.writeFileSync(mainFile, mainContent, 'utf8');
}

// 14. Clean index.html (ensure any old lead finder scripts are removed)
const indexHtmlFile = path.join(FRONT_DIR, 'index.html');
if (fs.existsSync(indexHtmlFile)) {
    let htmlContent = fs.readFileSync(indexHtmlFile, 'utf8');
    htmlContent = htmlContent.replace(/<script src="\/lead_finder_ui\.js[^"]*"><\/script>\n?/g, '');
    fs.writeFileSync(indexHtmlFile, htmlContent, 'utf8');
}

// 15. Fallback patches for cacheStorage, sessionStorage, and redisClient
const cacheFactoryFile = path.join(SERVER_DIR, 'engine/core-modules/cache-storage/cache-storage.module-factory.js');
if (fs.existsSync(cacheFactoryFile)) {
    let cfContent = fs.readFileSync(cacheFactoryFile, 'utf8');
    cfContent = cfContent.replace(
        /const redisUrl = (?:this\.)?twentyConfigService\.get\('REDIS_URL'\);/g,
        "const redisUrl = twentyConfigService.get('REDIS_URL') || 'redis://127.0.0.1:6379';"
    );
    cfContent = cfContent.replace(
        /const redisUrl = (?:_)?twentyConfigService\.get\('REDIS_URL'\);/g,
        "const redisUrl = twentyConfigService.get('REDIS_URL') || 'redis://127.0.0.1:6379';"
    );
    fs.writeFileSync(cacheFactoryFile, cfContent, 'utf8');
    console.log('[Zed] Patched cacheStorageModuleFactory fallback to local Redis!');
}

const sessionFactoryFile = path.join(SERVER_DIR, 'engine/core-modules/session-storage/session-storage.module-factory.js');
if (fs.existsSync(sessionFactoryFile)) {
    let sfContent = fs.readFileSync(sessionFactoryFile, 'utf8');
    sfContent = sfContent.replace(
        /const connectionString = (?:_)?twentyConfigService\.get\('REDIS_URL'\);/g,
        "const connectionString = twentyConfigService.get('REDIS_URL') || 'redis://127.0.0.1:6379';"
    );
    fs.writeFileSync(sessionFactoryFile, sfContent, 'utf8');
    console.log('[Zed] Patched sessionStorageModuleFactory fallback to local Redis!');
}

const redisClientFile = path.join(SERVER_DIR, 'engine/core-modules/redis-client/redis-client.service.js');
if (fs.existsSync(redisClientFile)) {
    let rcContent = fs.readFileSync(redisClientFile, 'utf8');
    rcContent = rcContent.replace(
        /const redisUrl = this\.twentyConfigService\.get\('REDIS_URL'\);/g,
        "const redisUrl = this.twentyConfigService.get('REDIS_URL') || 'redis://127.0.0.1:6379';"
    );
    rcContent = rcContent.replace(
        /const redisQueueUrl = [\s\S]*?this\.twentyConfigService\.get\('REDIS_URL'\);/g,
        "const redisQueueUrl = this.twentyConfigService.get('REDIS_QUEUE_URL') || this.twentyConfigService.get('REDIS_URL') || 'redis://127.0.0.1:6379';"
    );
    fs.writeFileSync(redisClientFile, rcContent, 'utf8');
    console.log('[Zed] Patched RedisClientService fallback to local Redis!');
}

// 16. Disable memory-heavy background worker queues (messaging sync, calendar sync)
// These consume ~40-80MB additional RAM and are not needed for basic CRM usage
const messageQueueFile = path.join(SERVER_DIR, 'engine/core-modules/message-queue/drivers/bullmq/bullmq-message-queue.driver.js');
if (fs.existsSync(messageQueueFile)) {
    let mqContent = fs.readFileSync(messageQueueFile, 'utf8');
    // Reduce BullMQ Worker concurrency from default (often 10-50) to 1 to save RAM
    mqContent = mqContent.replace(/concurrency:\s*(?:options\.concurrency\s*\?\?\s*)?\d+/g, 'concurrency: 1');
    mqContent = mqContent.replace(/concurrency:\s*this\.options\?\.concurrency\s*\?\?\s*\d+/g, 'concurrency: 1');
    fs.writeFileSync(messageQueueFile, mqContent, 'utf8');
    console.log('[Zed] Patched BullMQ driver to concurrency:1 (memory saving)!');
}

// 17. Reduce TypeORM connection pool to 2 connections (saves ~20MB RAM vs default 10)
const dataSourceFiles = [
    path.join(SERVER_DIR, 'database/typeorm/typeorm.service.js'),
    path.join(SERVER_DIR, 'database/typeorm-seeds/typeorm-seeds.service.js'),
    path.join(SERVER_DIR, 'engine/metadata-modules/typeorm/typeorm.service.js'),
];
for (const dsFile of dataSourceFiles) {
    if (fs.existsSync(dsFile)) {
        let dsContent = fs.readFileSync(dsFile, 'utf8');
        // Reduce pool size
        dsContent = dsContent.replace(/poolSize:\s*\d+/g, 'poolSize: 2');
        dsContent = dsContent.replace(/max:\s*\d+,\s*\/\/\s*connection pool/g, 'max: 2, // connection pool');
        dsContent = dsContent.replace(/"poolSize":\s*\d+/g, '"poolSize": 2');
        fs.writeFileSync(dsFile, dsContent, 'utf8');
    }
}
console.log('[Zed] TypeORM pool size reduced to 2!');

// 18. CRITICAL MEMORY OPTIMIZATION: Strip heavy background crawling modules from modules.module.js
// ModulesModule has providers:[], exports:[] — removing MessagingModule, CalendarModule,
// and OnboardingInviteSuggestionsModule eliminates Gmail/GCal crawler SDKs, saving ~80-120MB heap!
const modulesModuleFile = path.join(SERVER_DIR, 'modules/modules.module.js');
if (fs.existsSync(modulesModuleFile)) {
    let mmContent = fs.readFileSync(modulesModuleFile, 'utf8');
    // 1) Neutralize requires so the massive module files are never evaluated
    mmContent = mmContent.replace(/require\(['"]\.\/messaging\/messaging\.module['"]\)/g, '{}');
    mmContent = mmContent.replace(/require\(['"]\.\/calendar\/calendar\.module['"]\)/g, '{}');
    mmContent = mmContent.replace(/require\(['"]\.\/onboarding-invite-suggestions\/onboarding-invite-suggestions\.module['"]\)/g, '{}');
    // 2) Remove from imports array
    mmContent = mmContent.replace(/(?:[a-zA-Z0-9_$]+\.)?MessagingModule\s*,?/g, '');
    mmContent = mmContent.replace(/(?:[a-zA-Z0-9_$]+\.)?CalendarModule\s*,?/g, '');
    mmContent = mmContent.replace(/(?:[a-zA-Z0-9_$]+\.)?OnboardingInviteSuggestionsModule\s*,?/g, '');
    fs.writeFileSync(modulesModuleFile, mmContent, 'utf8');
    console.log('[Zed] Patched modules.module.js: stripped Messaging & Calendar modules completely (saves ~100MB heap)!');
}

console.log('[Zed] All patches applied cleanly with Single-Domain Redirects, Direct Google OAuth & Complete Rebrand!');
EOF

# Run database self-healing for user verification and admin role allocation
cat << 'DBEOF' > /tmp/repair-db.js
const dns = require('dns');
if (dns.setDefaultResultOrder) dns.setDefaultResultOrder('ipv4first');
const { Client } = require('pg');
const crypto = require('crypto');

async function repairDB() {
  const dbUrl = process.env.PG_DATABASE_URL || 'postgresql://' + (process.env.PG_DATABASE_USER || 'postgres') + ':' + (process.env.PG_DATABASE_PASSWORD || '0d8ff9694687b3817867b2fc95511775') + '@' + (process.env.PG_DATABASE_HOST || 'db') + ':' + (process.env.PG_DATABASE_PORT || '5432') + '/' + (process.env.PG_DATABASE_NAME || 'default');
  const client = new Client({
    connectionString: dbUrl,
    ssl: (dbUrl.includes('sslmode=require') || dbUrl.includes('neon.tech')) ? { rejectUnauthorized: false } : undefined
  });
  try {
    await client.connect();
    await client.query('UPDATE core."user" SET "isEmailVerified" = true');
    const adminRoleRes = await client.query("SELECT id, \"workspaceId\" FROM core.role WHERE label = 'Admin' LIMIT 1");
    const appRes = await client.query('SELECT "applicationId" FROM core."roleTarget" WHERE "applicationId" IS NOT NULL LIMIT 1');
    const appId = appRes.rows[0]?.applicationId || '41d1b956-28c2-4d14-9188-b7d401aacef5';
    if (adminRoleRes.rows.length > 0) {
      const adminRole = adminRoleRes.rows[0];
      const uws = await client.query('SELECT id, "workspaceId", "userId" FROM core."userWorkspace"');
      for (const uw of uws.rows) {
        const rt = await client.query('SELECT id FROM core."roleTarget" WHERE "userWorkspaceId" = $1', [uw.id]);
        if (rt.rows.length === 0) {
          await client.query('INSERT INTO core."roleTarget" (id, "workspaceId", "roleId", "userWorkspaceId", "createdAt", "updatedAt", "universalIdentifier", "applicationId") VALUES ($1, $2, $3, $4, NOW(), NOW(), $5, $6)', [crypto.randomUUID(), uw.workspaceId, adminRole.id, uw.id, crypto.randomUUID(), appId]);
          console.log('[Zed] Auto-assigned Admin role to userWorkspace:', uw.id);
        }
      }
    }
    await client.end();
    console.log('[Zed] Database self-healing complete!');
  } catch (err) {
    console.log('[Zed] DB self-healing note:', err.message);
  }
}
repairDB();
DBEOF
NODE_PATH=/app/node_modules node --max-old-space-size=64 /tmp/repair-db.js
rm -f /tmp/repair-db.js

# ============================================================
# Write the Zed reverse proxy — binds on PUBLIC port immediately
# so Render detects the service, then proxies to NestJS on 3001
# ============================================================
cat > /tmp/zed-proxy.js << 'PROXYEOF'
const http = require('http');
const net = require('net');
const fs = require('fs');

process.on('uncaughtException', (err) => {
  console.error('[Zed-Proxy UNCAUGHT]', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Zed-Proxy REJECTION]', reason);
});

const PUBLIC_PORT = Number(process.env.ZED_PUBLIC_PORT || process.env.PORT || 10000);
const PRIMARY_NEST_PORT = Number(process.env.ZED_INTERNAL_PORT || 3001);
const FALLBACK_NEST_PORT = 3000;
let activeNestPort = null;
let nestReady = false;
const startTime = Date.now();

function elapsed() { return Math.round((Date.now() - startTime) / 1000) + 's'; }

// HTTP reverse proxy
const proxy = http.createServer((clientReq, clientRes) => {
  // CRITICAL: Always respond 200 immediately to /healthz so Render health checker & keepalive cron NEVER time out!
  if (clientReq.url === '/healthz' || clientReq.url === '/healthz/' || clientReq.url.startsWith('/healthz?')) {
    clientRes.writeHead(200, {
      'Content-Type': 'text/plain',
      'X-Zed-Status': nestReady ? 'ready' : 'starting'
    });
    clientRes.end(nestReady ? 'Zed CRM is ready' : 'Zed CRM is starting...');
    return;
  }

  if (clientReq.url === '/_zed_diag') {
    const { execSync } = require('child_process');
    const fs = require('fs');
    let diag = {
      nestReady,
      activeNestPort,
      uptime: elapsed(),
      nodeMemory: process.memoryUsage(),
      env: {
        PORT: process.env.PORT,
        NODE_PORT: process.env.NODE_PORT,
        NODE_OPTIONS: process.env.NODE_OPTIONS,
        ZED_PUBLIC_PORT: process.env.ZED_PUBLIC_PORT,
        ZED_INTERNAL_PORT: process.env.ZED_INTERNAL_PORT
      }
    };
    try { diag.ps = execSync('ps aux || ps -ef || ps', { encoding: 'utf8' }).trim().split('\n'); } catch (e) { diag.psErr = e.message; }
    try { diag.netstat = execSync('netstat -tlpn 2>/dev/null || ss -tlpn 2>/dev/null || true', { encoding: 'utf8' }).trim().split('\n'); } catch (e) {}
    try {
      const mainPath = '/app/packages/twenty-server/dist/main.js';
      if (fs.existsSync(mainPath)) {
        const mc = fs.readFileSync(mainPath, 'utf8');
        diag.mainLength = mc.length;
        diag.hasInternalPort = mc.includes('ZED_INTERNAL_PORT');
        diag.mainTail = mc.slice(-600);
      }
    } catch(e) { diag.mainErr = e.message; }
    clientRes.writeHead(200, { 'Content-Type': 'application/json' });
    clientRes.end(JSON.stringify(diag, null, 2));
    return;
  }

  if (!nestReady || !activeNestPort) {
    clientRes.writeHead(200, { 'Content-Type': 'text/plain', 'X-Zed-Status': 'starting' });
    clientRes.end('Zed CRM is starting, please refresh in a moment...');
    return;
  }

  const options = {
    hostname: '127.0.0.1',
    port: activeNestPort,
    path: clientReq.url,
    method: clientReq.method,
    headers: { ...clientReq.headers, host: clientReq.headers.host || ('127.0.0.1:' + activeNestPort) }
  };

  const proxyReq = http.request(options, proxyRes => {
    clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(clientRes, { end: true });
  });

  proxyReq.on('error', err => {
    if (!clientRes.headersSent) {
      clientRes.writeHead(502, { 'Content-Type': 'text/plain' });
    }
    clientRes.end('Gateway error: ' + err.message);
  });

  clientReq.pipe(proxyReq, { end: true });
});

// Handle WebSocket upgrades (Twenty CRM uses WS for real-time)
proxy.on('upgrade', (req, socket, head) => {
  if (!nestReady || !activeNestPort) { socket.destroy(); return; }
  const conn = net.createConnection(activeNestPort, '127.0.0.1', () => {
    conn.write('GET ' + req.url + ' HTTP/1.1\r\nHost: 127.0.0.1:' + activeNestPort + '\r\n' +
      Object.entries(req.headers).map(([k,v]) => k + ': ' + v).join('\r\n') +
      '\r\n\r\n');
    conn.write(head);
    socket.pipe(conn);
    conn.pipe(socket);
  });
  conn.on('error', () => socket.destroy());
});

proxy.listen(PUBLIC_PORT, '0.0.0.0', () => {
  console.log('[Zed-Proxy] Bound on PUBLIC port ' + PUBLIC_PORT + ' — Render health check will pass immediately');
});

proxy.on('error', err => {
  console.error('[Zed-Proxy] Error:', err.message);
});

// Poll for NestJS readiness on both port 3001 and port 3000 every 2 seconds
function checkPort(port) {
  return new Promise(resolve => {
    const t = net.createConnection(port, '127.0.0.1');
    t.setTimeout(1000);
    t.on('connect', () => { t.destroy(); resolve(true); });
    t.on('error', () => resolve(false));
    t.on('timeout', () => { t.destroy(); resolve(false); });
  });
}

function startWorkflowWorker() {
  const workerPath = '/app/scripts/agency-workflow-worker.js';
  if (fs.existsSync(workerPath)) {
    console.log('[Zed-Proxy] Running Agency Workflow Worker in-process (zero child-process overhead)...');
    try {
      const worker = require(workerPath);
      if (typeof worker.main === 'function') {
        worker.main().catch(err => console.error('[Zed-Proxy Worker ERR]', err.message));
      }
    } catch (e) {
      console.error('[Zed-Proxy] Failed to run worker in-process:', e.message);
    }
  }
}

const readyCheck = setInterval(async () => {
  if (nestReady) return;
  const on3001 = await checkPort(PRIMARY_NEST_PORT);
  if (on3001) {
    activeNestPort = PRIMARY_NEST_PORT;
    nestReady = true;
    clearInterval(readyCheck);
    console.log('[Zed-Proxy] NestJS detected on port ' + PRIMARY_NEST_PORT + ' after ' + elapsed() + ' — now proxying all traffic!');
    setTimeout(startWorkflowWorker, 15000);
    return;
  }
  const on3000 = await checkPort(FALLBACK_NEST_PORT);
  if (on3000) {
    activeNestPort = FALLBACK_NEST_PORT;
    nestReady = true;
    clearInterval(readyCheck);
    console.log('[Zed-Proxy] NestJS detected on fallback port ' + FALLBACK_NEST_PORT + ' after ' + elapsed() + ' — now proxying all traffic!');
    setTimeout(startWorkflowWorker, 15000);
    return;
  }
}, 2000);

process.on('SIGTERM', () => { proxy.close(); process.exit(0); });
process.on('SIGINT',  () => { proxy.close(); process.exit(0); });
PROXYEOF

echo "[Zed] Reverse proxy written to /tmp/zed-proxy.js (PUBLIC:${PORT:-10000} → INTERNAL:3001)"
NODE_PATH=/app/packages/twenty-server/node_modules:/app/node_modules ZED_PUBLIC_PORT=${PORT:-10000} ZED_INTERNAL_PORT=3001 node --max-old-space-size=48 /tmp/zed-proxy.js &
sleep 0.5
echo "[Zed] Reverse proxy listening on port ${PORT:-10000}."


