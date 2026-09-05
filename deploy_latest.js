const { Daytona } = require('@daytona/sdk');

async function deployLatest() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  const res = await sb.process.executeCommand(`
    cd /home/daytona/Lead-CRM
    git fetch origin main
    git reset --hard origin/main
    docker cp email.service.patched.js zed-server-1:/app/packages/twenty-server/dist/engine/core-modules/email/email.service.js
    docker restart zed-server-1
  `);
  console.log('Deploy result:\n', res.result);

  await new Promise(r => setTimeout(r, 15000));
  const health = await sb.process.executeCommand('curl -s -i http://localhost:3000/healthz');
  console.log('Healthz:\n', health.result);
}

deployLatest().catch(console.error);
