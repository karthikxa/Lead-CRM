const { Daytona } = require('@daytona/sdk');

async function inspectLines() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');
  const res = await sb.process.executeCommand(`
    docker exec zed-server-1 node -e "
      const fs = require('fs');
      const lines = fs.readFileSync('/app/packages/twenty-server/dist/engine/core-modules/workspace-invitation/services/workspace-invitation.service.js', 'utf8').split('\\n');
      console.log(lines.slice(70, 200).join('\\n'));
    "
  `);
  console.log('Lines 70-200:\n', res.result);
}

inspectLines().catch(console.error);
