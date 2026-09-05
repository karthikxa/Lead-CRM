const { Daytona } = require('@daytona/sdk');

async function fixInviteAuth() {
  const d = new Daytona({ apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef', serverUrl: 'https://app.daytona.io/api' });
  const sb = await d.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  // Read lines 155-210 to understand the full context
  const ctx = await sb.process.executeCommand(`
    docker exec zed-server-1 sed -n '155,215p' \
      /app/packages/twenty-server/dist/engine/core-modules/auth/services/auth.service.js
  `);
  console.log('Auth context (155-215):\n', ctx.result);

  // Also check the sign-in-up controller to understand invite flow
  const signInUp = await sb.process.executeCommand(`
    docker exec zed-server-1 grep -n "inviteToken\\|google.*callback\\|AUTH_GOOGLE_ENABLED\\|isGoogleAuthEnabled" \
      /app/packages/twenty-server/dist/engine/core-modules/auth/services/auth.service.js | head -20
  `);
  console.log('Google auth in auth.service:\n', signInUp.result);

  // Check if the invite token is being processed with Google OAuth
  const inviteGoogleFlow = await sb.process.executeCommand(`
    docker exec zed-server-1 grep -rn "inviteToken\\|workspacePersonalInviteToken" \
      /app/packages/twenty-server/dist/engine/core-modules/auth/controllers/ 2>/dev/null | head -20
  `);
  console.log('Invite token in controllers:\n', inviteGoogleFlow.result);

  // Read the google.auth.controller.js to see how invite token is handled
  const googleCtrl = await sb.process.executeCommand(`
    docker exec zed-server-1 grep -n "inviteToken\\|personalInviteToken\\|signInUp\\|redirect" \
      /app/packages/twenty-server/dist/engine/core-modules/auth/controllers/google.auth.controller.js 2>/dev/null | head -30
  `);
  console.log('Google auth controller:\n', googleCtrl.result);
}

fixInviteAuth().catch(console.error);
