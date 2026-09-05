const { Daytona } = require('@daytona/sdk');

async function fixInviteAndVerify() {
  const d = new Daytona({ apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef', serverUrl: 'https://app.daytona.io/api' });
  const sb = await d.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  // 1. Read the invite service to understand current structure
  const snippet = await sb.process.executeCommand(`
    docker exec zed-server-1 head -n 120 /app/packages/twenty-server/dist/engine/core-modules/workspace-invitation/services/workspace-invitation.service.js
  `);
  console.log('Invite service snippet:\n', snippet.result);
}
fixInviteAndVerify().catch(console.error);
