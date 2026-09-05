const { Daytona } = require('@daytona/sdk');

async function inspectGuards() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');
  const res1 = await sb.process.executeCommand(`
    docker exec zed-server-1 cat /app/packages/twenty-server/dist/engine/core-modules/auth/guards/google-apis-oauth-request-code.guard.js
  `);
  console.log('Request code guard:\n', res1.result);

  const res2 = await sb.process.executeCommand(`
    docker exec zed-server-1 cat /app/packages/twenty-server/dist/engine/core-modules/auth/guards/google-apis-oauth-exchange-code-for-token.guard.js
  `);
  console.log('Exchange token guard:\n', res2.result);
}

inspectGuards().catch(console.error);
