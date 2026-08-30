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
    
    // Inject corporate responsive HTML template
    if (!wiContent.includes('Zed Agency Enterprise CRM')) {
        wiContent = wiContent.replace(
            /const html = await \(0, _twentyemails\.renderEmail\)\(emailTemplate\);/,
            `const inviterName = [sender.name?.firstName, sender.name?.lastName].filter(Boolean).join(' ') || sender.userEmail || 'Team Admin';
            const workspaceTitle = workspace.displayName || 'Zed Agency Workspace';
            const inviteUrl = link.toString();
            const html = \`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Workspace Invitation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #172b4d;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f5f7; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(9, 30, 66, 0.08); border: 1px solid #e1e4e8;">
          <tr>
            <td style="padding: 32px 40px 24px 40px; background: #0f172a; text-align: left;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="display: inline-block; background: #2563eb; width: 36px; height: 36px; border-radius: 8px; text-align: center; line-height: 36px; color: #ffffff; font-weight: 800; font-size: 20px; vertical-align: middle;">Z</div>
                    <span style="color: #ffffff; font-size: 18px; font-weight: 700; letter-spacing: -0.2px; margin-left: 12px; vertical-align: middle;">Zed Agency</span>
                  </td>
                  <td align="right">
                    <span style="background: rgba(255,255,255,0.12); color: #38bdf8; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">Enterprise CRM</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 40px 32px 40px;">
              <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #0f172a; line-height: 1.3;">
                You've been invited to join <strong>\${workspaceTitle}</strong>
              </h1>
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #334155;">
                Hello,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #334155;">
                <strong>\${inviterName}</strong> (\${sender.userEmail}) has invited you to collaborate as a team member on the <strong>\${workspaceTitle}</strong> enterprise workspace on Zed CRM.
              </p>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Workspace Details</div>
                    <div style="font-size: 15px; font-weight: 600; color: #0f172a;">\${workspaceTitle}</div>
                    <div style="font-size: 13px; color: #64748b; margin-top: 2px;">Access Level: <strong>Full Workspace Member</strong></div>
                  </td>
                </tr>
              </table>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <a href="\${inviteUrl}" target="_blank" style="display: inline-block; background-color: #0f172a; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 36px; border-radius: 6px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); text-align: center;">
                      Accept Invitation & Join Workspace &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 12px 0; font-size: 13px; line-height: 1.5; color: #64748b;">
                If the button above does not work, copy and paste this secure link into your browser:
              </p>
              <p style="margin: 0 0 28px 0; font-size: 12px; line-height: 1.5; color: #2563eb; word-break: break-all; background: #f1f5f9; padding: 10px 14px; border-radius: 6px; font-family: ui-monospace, monospace;">
                \${inviteUrl}
              </p>
              <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 12px; line-height: 1.5; color: #64748b;">
                <strong>Security Notice:</strong> This invitation link is unique to you and will expire in 7 days. If you were not expecting this invitation, you can safely disregard this email.
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #64748b;">
                Sent securely by <strong>Zed Agency Enterprise CRM</strong>
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                &copy; 2026 Zed Agency Inc. All rights reserved. &bull; <a href="https://zed.agency" style="color: #64748b; text-decoration: underline;">zed.agency</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>\`;`
        );
    }
    fs.writeFileSync(wsInviteFile, wiContent, 'utf8');
    console.log('[Zed] Patched WorkspaceInvitationService with enterprise template!');
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
        const primaryDomain = this.twentyConfigService.get('SERVER_URL') || 'http://localhost:3000';
        return primaryDomain.replace(/\\/$/, '');
    }`);
    wsContent = wsContent.replace(/buildWorkspaceURL\(\{\s*workspace,\s*pathname = '',\s*searchParams,\s*subdomain,\s*\}\)\s*\{[\s\S]*?return url;\s*\}/, `buildWorkspaceURL({ workspace, pathname = '', searchParams }) {
        const serverUrl = this.twentyConfigService.get('SERVER_URL') || 'http://localhost:3000';
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
    
    authContent = authContent.replace(/async signInUpWithSocialSSO\([\s\S]*?async createSSOConnectedAccountIfFeatureFlagIsOn/, `async signInUpWithSocialSSO({ firstName, lastName, email: userEmail, picture, billingCheckoutSessionState, authProvider }) {
        const adminEmails = ${JSON.stringify(ADMIN_EMAILS)};
        let existingUser = await this.userRepository.findOne({
            where: { email: userEmail.toLowerCase() },
            relations: { userWorkspaces: { workspace: true } }
        });

        if (!existingUser) {
            existingUser = await this.userRepository.save({
                email: userEmail.toLowerCase(),
                firstName: firstName || 'Zed',
                lastName: lastName || 'User',
                isEmailVerified: true,
                colorScheme: 'Dark'
            });
        } else if (!existingUser.isEmailVerified) {
            existingUser.isEmailVerified = true;
            await this.userRepository.save(existingUser);
        }

        let defaultWorkspace = await this.workspaceRepository.findOne({
            where: { activationStatus: _workspacestatusenum.WorkspaceActivationStatus.ACTIVE },
            order: { createdAt: 'ASC' }
        });

        if (defaultWorkspace) {
            let userWorkspace = await this.userWorkspaceRepository.findOne({
                where: { userId: existingUser.id, workspaceId: defaultWorkspace.id }
            });

            if (!userWorkspace) {
                userWorkspace = await this.userWorkspaceRepository.save({
                    userId: existingUser.id,
                    workspaceId: defaultWorkspace.id,
                    workspaceMemberId: require('crypto').randomUUID()
                });
            }

            try {
                let member = await this.workspaceMemberRepository?.findOne?.({
                    where: { userId: existingUser.id, workspaceId: defaultWorkspace.id }
                });
                if (!member && this.workspaceMemberRepository) {
                    await this.workspaceMemberRepository.save({
                        id: userWorkspace.workspaceMemberId,
                        userId: existingUser.id,
                        workspaceId: defaultWorkspace.id,
                        name: { firstName: firstName || 'Zed', lastName: lastName || 'User' },
                        userEmail: existingUser.email,
                        colorScheme: 'Dark',
                        locale: 'en'
                    });
                }

                if (this.roleTargetRepository && this.roleRepository) {
                    const isAdmin = adminEmails.includes(existingUser.email.toLowerCase()) || existingUser.email.toLowerCase().endsWith('@zed.agency');
                    const targetRoleName = isAdmin ? 'Admin' : 'Member';
                    const role = await this.roleRepository.findOne({
                        where: { workspaceId: defaultWorkspace.id, label: targetRoleName }
                    }) || await this.roleRepository.findOne({
                        where: { workspaceId: defaultWorkspace.id }
                    });

                    if (role) {
                        const existingRoleTarget = await this.roleTargetRepository.findOne({
                            where: { userWorkspaceId: userWorkspace.id, workspaceId: defaultWorkspace.id }
                        });
                        if (!existingRoleTarget) {
                            const app = await this.applicationRepository?.findOneBy?.({}) || null;
                            await this.roleTargetRepository.save({
                                workspaceId: defaultWorkspace.id,
                                roleId: role.id,
                                userWorkspaceId: userWorkspace.id,
                                applicationId: app ? app.id : '41d1b956-28c2-4d14-9188-b7d401aacef5',
                                universalIdentifier: require('crypto').randomUUID()
                            });
                        }
                    }
                }
            } catch (roleErr) {
                console.log('[Zed] Role target auto-assignment notice:', roleErr.message);
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
    console.log('[Zed] Direct 1-Click Google OAuth & Workspace Auto-Enrollment active in signInUpWithSocialSSO!');
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

// 7. Remove "Continue with Google" on Welcome & SignInUp Screens, hide documentation menu, ensure active Enterprise UI, replace 20 logo with Z logo, and ensure high-res Logo
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

            if (f.startsWith('SignInUp')) {
                content = content.replace(/c\.google&&\([0-9a-zA-Z_.]+\)\([0-9a-zA-Z_.]+,{action:"join-workspace"}\)/g, 'null');
                content = content.replace(/\([0-9a-zA-Z_.]+\)\([0-9a-zA-Z_.]+,{action:"join-workspace"}\)/g, 'null');
                content = content.replace(/t\.google&&\([0-9a-zA-Z_.]+\)\([0-9a-zA-Z_.]+,{action:"list-available-workspaces"/g, 'null&&false');
                content = content.replace(/\([0-9a-zA-Z_.]+\)\([0-9a-zA-Z_.]+,{action:"list-available-workspaces"[^}]*\}\)/g, 'null');
                content = content.replace(/\(c\.google\|\|c\.microsoft\|\|c\.sso\.length>0\)&&c\.password\?\([0-9a-zA-Z_.]+\)\([0-9a-zA-Z_.]+,{}\):null/g, 'null');
                modified = true;
                console.log('[Zed] Removed Google button from SignInUp asset:', f);
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
  /* Hide Google SSO button completely */
  button:has(svg path[fill="#4285F4"]),
  button:has(svg path[fill="#34A853"]),
  button:has(svg path[fill="#FBBC05"]),
  button:has(svg path[fill="#EA4335"]),
  [data-testid*="google"],
  a[href*="/auth/google"],
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

// 13. Admin Lead Finder & Deduplication API Integration
const mainFile = path.join(SERVER_DIR, 'main.js');
if (fs.existsSync(mainFile)) {
    let mainContent = fs.readFileSync(mainFile, 'utf8');
    if (!mainContent.includes('[Zed] Admin Lead Scraper API')) {
        mainContent = mainContent.replace(
            /await app\.listen\(twentyConfigService\.get\('NODE_PORT'\)\);/,
            `// [Zed] Admin Lead Scraper API
    try {
        const leadScraperService = require('./lead_scraper_service.js');
        app.use('/api/admin/leads/members', async (req, res) => {
            try {
                const client = await leadScraperService.getDbClient();
                const schema = await leadScraperService.getWorkspaceSchema(client);
                const membersRes = await client.query(\`SELECT id, "nameFirstName", "nameLastName", "userEmail", "avatarUrl" FROM "\${schema}"."workspaceMember" WHERE "deletedAt" IS NULL;\`);
                await client.end();
                res.json({ success: true, members: membersRes.rows });
            } catch (e) {
                res.status(500).json({ success: false, error: e.message });
            }
        });
        app.use('/api/admin/leads/scrape', async (req, res) => {
            if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
            try {
                const { industry, location, maxResults } = req.body || {};
                const leads = await leadScraperService.scrapeBusinessLeads({ industry, location, maxResults: Number(maxResults) || 25 });
                const client = await leadScraperService.getDbClient();
                const schema = await leadScraperService.getWorkspaceSchema(client);
                const existingRes = await client.query(\`
                    SELECT c.name, c."domainNamePrimaryLinkUrl", m."nameFirstName", m."nameLastName", m."userEmail"
                    FROM "\${schema}"."company" c
                    LEFT JOIN "\${schema}"."workspaceMember" m ON c."accountOwnerId" = m.id
                    WHERE c."deletedAt" IS NULL;
                \`);
                await client.end();
                const existingMap = new Map();
                for (const row of existingRes.rows) {
                    if (row.name) existingMap.set(row.name.toLowerCase().trim(), row);
                    if (row.domainNamePrimaryLinkUrl) {
                        const cleanDomain = row.domainNamePrimaryLinkUrl.replace(/https?:\\/\\//, '').replace(/\\/.*$/, '').toLowerCase().trim();
                        if (cleanDomain) existingMap.set(cleanDomain, row);
                    }
                }
                for (const lead of leads) {
                    const cleanName = lead.name.toLowerCase().trim();
                    const cleanDomain = (lead.website || '').replace(/https?:\\/\\//, '').replace(/\\/.*$/, '').toLowerCase().trim();
                    const existing = existingMap.get(cleanName) || (cleanDomain ? existingMap.get(cleanDomain) : null);
                    if (existing) {
                        lead.isDuplicate = true;
                        lead.existingOwnerName = [existing.nameFirstName, existing.nameLastName].filter(Boolean).join(' ') || existing.userEmail || 'Assigned';
                    } else {
                        lead.isDuplicate = false;
                    }
                }
                res.json({ success: true, leads });
            } catch (e) {
                res.status(500).json({ success: false, error: e.message });
            }
        });
        app.use('/api/admin/leads/assign', async (req, res) => {
            if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
            try {
                const { leads, memberId, campaignName } = req.body || {};
                const result = await leadScraperService.assignLeadsToMember({ leads, memberId, campaignName });
                res.json(result);
            } catch (e) {
                res.status(500).json({ success: false, error: e.message });
            }
        });
        console.log('[Zed] Mounted Admin Lead Scraper & Deduplication API endpoints!');
    } catch (e) {
        console.error('[Zed] Error mounting Lead Scraper API:', e.message);
    }
    
    await app.listen(twentyConfigService.get('NODE_PORT'));`
        );
        fs.writeFileSync(mainFile, mainContent, 'utf8');
    }
}

// 14. Inject Lead Finder UI into index.html
const indexHtmlFile = path.join(FRONT_DIR, 'index.html');
if (fs.existsSync(indexHtmlFile)) {
    let htmlContent = fs.readFileSync(indexHtmlFile, 'utf8');
    if (!htmlContent.includes('/lead_finder_ui.js')) {
        htmlContent = htmlContent.replace('</head>', '<script src="/lead_finder_ui.js"></script>\n</head>');
        fs.writeFileSync(indexHtmlFile, htmlContent, 'utf8');
        console.log('[Zed] Injected Lead Finder UI script into index.html!');
    }
}

console.log('[Zed] All patches applied cleanly with Single-Domain Redirects, Direct Google OAuth, Admin Lead Scraper & Complete Rebrand!');

EOF

# Run database self-healing for user verification and admin role allocation
cat << 'DBEOF' > /tmp/repair-db.js
const { Client } = require('pg');
const crypto = require('crypto');

async function repairDB() {
  const dbUrl = process.env.PG_DATABASE_URL || 'postgresql://' + (process.env.PG_DATABASE_USER || 'postgres') + ':' + (process.env.PG_DATABASE_PASSWORD || '0d8ff9694687b3817867b2fc95511775') + '@' + (process.env.PG_DATABASE_HOST || 'db') + ':' + (process.env.PG_DATABASE_PORT || '5432') + '/' + (process.env.PG_DATABASE_NAME || 'default');
  const client = new Client({ connectionString: dbUrl });
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
NODE_PATH=/app/node_modules node /tmp/repair-db.js
rm -f /tmp/repair-db.js
