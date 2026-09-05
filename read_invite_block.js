const { Daytona } = require('@daytona/sdk');

async function fixInviteEmailAndFields() {
  const d = new Daytona({ apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef', serverUrl: 'https://app.daytona.io/api' });
  const sb = await d.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  // Read more context around line 263-280 (emailData block)
  const emailBlock = await sb.process.executeCommand(`
    docker exec zed-server-1 sed -n '255,310p' /app/packages/twenty-server/dist/engine/core-modules/workspace-invitation/services/workspace-invitation.service.js
  `);
  console.log('Email block (255-310):\n', emailBlock.result);

  // Read the sender block to understand what sender contains
  const senderBlock = await sb.process.executeCommand(`
    docker exec zed-server-1 sed -n '205,270p' /app/packages/twenty-server/dist/engine/core-modules/workspace-invitation/services/workspace-invitation.service.js
  `);
  console.log('Sender block (205-270):\n', senderBlock.result);
}
fixInviteEmailAndFields().catch(console.error);
