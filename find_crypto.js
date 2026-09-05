const { Daytona } = require('@daytona/sdk');

async function patchEmailServiceGmailApi() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  // First check the encryption approach used by Twenty
  const encCheck = await sb.process.executeCommand(`
    docker exec zed-server-1 find /app/packages/twenty-server/dist/engine/core-modules -name "encrypt*.js" | head -5
  `);
  console.log('Encryption files:\n', encCheck.result);

  const cryptoCheck = await sb.process.executeCommand(`
    docker exec zed-server-1 find /app/packages/twenty-server/dist -name "*crypt*.js" | grep -v spec | grep -v map | head -10
  `);
  console.log('Crypto files:\n', cryptoCheck.result);
}

patchEmailServiceGmailApi().catch(console.error);
