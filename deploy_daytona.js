const { Daytona } = require('@daytona/sdk');

async function deploy() {
  console.log('[Daytona] Initializing deployment...');
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');
  console.log('[Daytona] Sandbox status:', sb.state);

  console.log('[Daytona] Setting permissions and patching container as root...');
  const cpRes = await sb.process.executeCommand(`
    cd /home/daytona/Lead-CRM &&
    docker exec -u 0 zed-server-1 chmod -R 777 /app/packages/twenty-server/dist &&
    docker cp lead_scraper_service.js zed-server-1:/app/packages/twenty-server/dist/lead_scraper_service.js &&
    docker cp lead_finder_ui.js zed-server-1:/app/packages/twenty-server/dist/front/lead_finder_ui.js &&
    docker cp branding/patch-branding.sh zed-server-1:/tmp/patch-branding.sh &&
    docker exec -u 0 zed-server-1 sh /tmp/patch-branding.sh &&
    docker exec -u 0 zed-server-1 chmod -R 777 /app/packages/twenty-server/dist &&
    docker restart zed-server-1
  `);
  console.log('[Daytona] Container update result:', cpRes.result);

  console.log('[Daytona] Waiting for server to start up...');
  await new Promise(r => setTimeout(r, 20000));

  const healthCheck = await sb.process.executeCommand('curl -s -i http://localhost:3000/healthz');
  console.log('[Daytona] Health check:', healthCheck.result);

  const preview = await sb.getPreviewLink(3000);
  console.log('====================================================');
  console.log('🚀 LIVE DAYTONA PRODUCTION URL:');
  console.log(preview.url);
  console.log('====================================================');
}

deploy().catch(console.error);
