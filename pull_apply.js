const { Daytona } = require('@daytona/sdk');

async function pullAndApply() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  console.log('1. Git pull in /home/daytona/Lead-CRM...');
  const pullRes = await sb.process.executeCommand(`
    cd /home/daytona/Lead-CRM
    git pull origin main
    ls -la email.service.patched.js
    docker cp email.service.patched.js zed-server-1:/app/packages/twenty-server/dist/engine/core-modules/email/email.service.js
    docker exec zed-server-1 chmod 777 /app/packages/twenty-server/dist/engine/core-modules/email/email.service.js
    docker restart zed-server-1
  `);
  console.log('Pull and copy result:\n', pullRes.result);

  console.log('2. Waiting 15s for server...');
  await new Promise(r => setTimeout(r, 15000));

  const check = await sb.process.executeCommand('docker exec zed-server-1 head -20 /app/packages/twenty-server/dist/engine/core-modules/email/email.service.js');
  console.log('EmailService header:\n', check.result);

  const health = await sb.process.executeCommand('curl -s -i http://localhost:3000/healthz');
  console.log('Healthz:\n', health.result);
}

pullAndApply().catch(console.error);
