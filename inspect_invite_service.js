const { Daytona } = require('@daytona/sdk');

async function inspectInvite() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');
  const res1 = await sb.process.executeCommand(`
    docker exec zed-server-1 find /app/packages/twenty-server/dist -name "*invitation*.js"
  `);
  console.log('Invitation files:\n', res1.result);

  const res2 = await sb.process.executeCommand(`
    docker exec zed-server-1 cat /app/packages/twenty-server/dist/engine/core-modules/workspace-invitation/services/workspace-invitation.service.js
  `);
  console.log('workspace-invitation.service.js:\n', res2.result);
}

inspectInvite().catch(console.error);
