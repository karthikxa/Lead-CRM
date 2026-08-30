const fs = require('fs');
const path = require('path');

const SERVER_DIR = '/app/packages/twenty-server/dist';

// Patch onboarding service to always return COMPLETED 
const onboardingFile = path.join(SERVER_DIR, 'engine/core-modules/onboarding/onboarding.service.js');
if (fs.existsSync(onboardingFile)) {
    let content = fs.readFileSync(onboardingFile, 'utf8');
    // Replace getOnboardingStatus to always return COMPLETED for active workspaces
    content = content.replace(
        /async getOnboardingStatus\(\{ userId, workspaceId \}\) \{[\s\S]*?return _onboardingstatusenum\.OnboardingStatus\.COMPLETED;\n    \}/,
        `async getOnboardingStatus({ userId, workspaceId }) {
        const workspace = await this.workspaceRepository.findOne({ where: { id: workspaceId } });
        if (!(0, _utils.isDefined)(workspace)) return null;
        if (this.isWorkspaceActivationPending(workspace)) {
            return _onboardingstatusenum.OnboardingStatus.WORKSPACE_ACTIVATION;
        }
        return _onboardingstatusenum.OnboardingStatus.COMPLETED;
    }`
    );
    fs.writeFileSync(onboardingFile, content, 'utf8');
    console.log('[Zed] Onboarding service patched - always returns COMPLETED!');
}

// Also patch setOnboardingStepStatus to be a no-op (prevent setting pending flags)
const signInUpFile = path.join(SERVER_DIR, 'engine/core-modules/auth/services/sign-in-up/sign-in-up.service.js');
if (fs.existsSync(signInUpFile)) {
    let content = fs.readFileSync(signInUpFile, 'utf8');
    // Don't set any onboarding pending flags on sign up
    content = content.replace(/await this\.onboardingService\.setOnboardingConnectAccountPending[\s\S]*?;/g, '');
    content = content.replace(/await this\.onboardingService\.setOnboardingProfileCreationPending[\s\S]*?;/g, '');
    content = content.replace(/await this\.onboardingService\.setOnboardingInstallAppsPending[\s\S]*?;/g, '');
    content = content.replace(/await this\.onboardingService\.setOnboardingInviteTeamPending[\s\S]*?;/g, '');
    fs.writeFileSync(signInUpFile, content, 'utf8');
    console.log('[Zed] SignInUp service patched - no onboarding pending flags set!');
} else {
    console.log('[Zed] SignInUp service not found at expected path');
}

// Check alternate sign-in-up paths
const possiblePaths = [
    path.join(SERVER_DIR, 'engine/core-modules/auth/services/sign-in-up.service.js'),
    path.join(SERVER_DIR, 'engine/core-modules/auth/services/auth-sign-in-up.service.js'),
];
for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
        let content = fs.readFileSync(p, 'utf8');
        const orig = content;
        content = content.replace(/await this\.onboardingService\.setOnboardingConnectAccountPending[\s\S]*?;/g, '');
        content = content.replace(/await this\.onboardingService\.setOnboardingProfileCreationPending[\s\S]*?;/g, '');
        content = content.replace(/await this\.onboardingService\.setOnboardingInstallAppsPending[\s\S]*?;/g, '');
        content = content.replace(/await this\.onboardingService\.setOnboardingInviteTeamPending[\s\S]*?;/g, '');
        if (content !== orig) {
            fs.writeFileSync(p, content, 'utf8');
            console.log('[Zed] Patched:', p);
        }
    }
}
