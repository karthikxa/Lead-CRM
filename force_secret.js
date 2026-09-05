const { Daytona } = require('@daytona/sdk');

async function forceSecret() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');
  
  console.log('1. Hardcoding new secret in docker-compose.yml...');
  await sb.process.executeCommand(`
    cd /home/daytona/Lead-CRM
    sed -i 's/AUTH_GOOGLE_CLIENT_SECRET:.*/AUTH_GOOGLE_CLIENT_SECRET: "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"/g' docker-compose.yml
    docker compose down server worker 2>&1
    docker compose up -d server worker 2>&1
  `);

  console.log('2. Applying patch...');
  await sb.process.executeCommand(`
    cd /home/daytona/Lead-CRM
    docker exec -u 0 zed-server-1 chmod -R 777 /app/packages/twenty-server/dist
    docker cp lead_scraper_service.js zed-server-1:/app/packages/twenty-server/dist/lead_scraper_service.js
    docker cp lead_finder_ui.js zed-server-1:/app/packages/twenty-server/dist/front/lead_finder_ui.js
    docker cp branding/patch-branding.sh zed-server-1:/tmp/patch-branding.sh
    docker exec -u 0 zed-server-1 sh /tmp/patch-branding.sh
    docker exec -u 0 zed-server-1 chmod -R 777 /app/packages/twenty-server/dist
    docker restart zed-server-1
  `);

  await new Promise(r => setTimeout(r, 10000));
  const envCheck = await sb.process.executeCommand('docker exec zed-server-1 env | grep AUTH_GOOGLE_CLIENT_SECRET');
  console.log('Container secret verified:\n', envCheck.result);

  const health = await sb.process.executeCommand('curl -s -i http://localhost:3000/healthz');
  console.log('Health check:\n', health.result);
}

forceSecret().catch(console.error);
