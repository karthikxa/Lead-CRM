const { Daytona } = require('@daytona/sdk');
const fs = require('fs');

async function deployPatchedEmailService() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');
  
  const fileContent = fs.readFileSync('c:\\Users\\balur\\Downloads\\CRM Agency\\zed\\email.service.patched.js', 'utf8');
  
  console.log('1. Uploading email.service.patched.js to Daytona host...');
  await sb.fs.uploadFile('/home/daytona/Lead-CRM/email.service.js', Buffer.from(fileContent));
  
  console.log('2. Copying into zed-server-1 container...');
  const cpRes = await sb.process.executeCommand(`
    docker cp /home/daytona/Lead-CRM/email.service.js zed-server-1:/app/packages/twenty-server/dist/engine/core-modules/email/email.service.js
    docker exec zed-server-1 chmod 777 /app/packages/twenty-server/dist/engine/core-modules/email/email.service.js
  `);
  console.log('Copy result:\n', cpRes.result);

  console.log('3. Restarting zed-server-1...');
  await sb.process.executeCommand('docker restart zed-server-1');
  await new Promise(r => setTimeout(r, 20000));

  const health = await sb.process.executeCommand('curl -s -i http://localhost:3000/healthz');
  console.log('Healthz:\n', health.result);
}

deployPatchedEmailService().catch(console.error);
