const { Daytona } = require('@daytona/sdk');

async function applySecret() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');
  
  console.log('1. Updating /home/daytona/Lead-CRM/.env...');
  await sb.process.executeCommand(`
    cd /home/daytona/Lead-CRM
    sed -i 's/AUTH_GOOGLE_CLIENT_SECRET=.*/AUTH_GOOGLE_CLIENT_SECRET=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/g' .env
    grep AUTH_GOOGLE_CLIENT_SECRET .env
  `);

  console.log('2. Recreating server and worker containers with updated .env...');
  const upRes = await sb.process.executeCommand(`
    cd /home/daytona/Lead-CRM
    docker compose up -d --force-recreate server worker
  `);
  console.log('Docker compose output:', upRes.result);

  console.log('3. Applying patch-branding.sh...');
  const patchRes = await sb.process.executeCommand(`
    cd /home/daytona/Lead-CRM
    docker exec -u 0 zed-server-1 chmod -R 777 /app/packages/twenty-server/dist
    docker exec -u 0 zed-server-1 sh /app/branding/patch-branding.sh 2>&1
  `);
  console.log('Patch result:', patchRes.result);

  console.log('4. Verifying container env:');
  const verifyRes = await sb.process.executeCommand(`docker exec zed-server-1 env | grep AUTH_GOOGLE_CLIENT_SECRET`);
  console.log(verifyRes.result);
}

applySecret().catch(console.error);
