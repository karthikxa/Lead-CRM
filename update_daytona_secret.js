const { Daytona } = require('@daytona/sdk');

async function updateSecret() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');
  
  console.log('Updating Google Client Secret in Daytona .env...');
  await sb.process.executeCommand(`sed -i 's/AUTH_GOOGLE_CLIENT_SECRET=.*/AUTH_GOOGLE_CLIENT_SECRET=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/g' /app/.env 2>/dev/null || true`);
  await sb.process.executeCommand(`sed -i 's/AUTH_GOOGLE_CLIENT_SECRET=.*/AUTH_GOOGLE_CLIENT_SECRET=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/g' .env 2>/dev/null || true`);
  
  // Re-run docker compose up with the updated secret
  console.log('Restarting docker containers with new secret...');
  const restartRes = await sb.process.executeCommand(`
    export AUTH_GOOGLE_CLIENT_SECRET=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
    docker compose up -d --no-recreate --remove-orphans server worker 2>&1 || docker restart zed-server-1 zed-worker-1
  `);
  console.log('Restart output:', restartRes.result);
}

updateSecret().catch(console.error);
