const { Daytona } = require('@daytona/sdk');

async function forceResetAndDeploy() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  console.log('1. Git fetch and reset --hard origin/main...');
  const res = await sb.process.executeCommand(`
    cd /home/daytona/Lead-CRM
    git fetch origin main
    git reset --hard origin/main
    ls -la email.service.patched.js
    docker cp email.service.patched.js zed-server-1:/app/packages/twenty-server/dist/engine/core-modules/email/email.service.js
    docker exec zed-server-1 chmod 777 /app/packages/twenty-server/dist/engine/core-modules/email/email.service.js
    docker restart zed-server-1
  `);
  console.log('Reset & copy result:\n', res.result);

  console.log('2. Waiting 18s for server startup...');
  await new Promise(r => setTimeout(r, 18000));

  const check = await sb.process.executeCommand('docker exec zed-server-1 head -25 /app/packages/twenty-server/dist/engine/core-modules/email/email.service.js');
  console.log('EmailService header:\n', check.result);

  const health = await sb.process.executeCommand('curl -s -i http://localhost:3000/healthz');
  console.log('Healthz:\n', health.result);
}

forceResetAndDeploy().catch(console.error);
