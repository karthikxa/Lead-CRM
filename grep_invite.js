const { Daytona } = require('@daytona/sdk');

async function fixInviteEmail() {
  const d = new Daytona({ apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef', serverUrl: 'https://app.daytona.io/api' });
  const sb = await d.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  // Find the sendInvitation method in the service
  const grep = await sb.process.executeCommand(`
    docker exec zed-server-1 grep -n "sendInvitation\\|emailData\\|inviterName\\|workspaceName\\|roleId\\|roleName\\|ADMIN\\|joinTeam\\|subject" \
      /app/packages/twenty-server/dist/engine/core-modules/workspace-invitation/services/workspace-invitation.service.js | head -60
  `);
  console.log('Invite email grep:\n', grep.result);
}
fixInviteEmail().catch(console.error);
