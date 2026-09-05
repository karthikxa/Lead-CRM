const { Daytona } = require('@daytona/sdk');

async function decryptTokenAndPatch() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  // Find and inspect all crypto files to understand decryption
  const files = await sb.process.executeCommand(`
    docker exec zed-server-1 find /app/packages/twenty-server/dist/engine/core-modules/secret-encryption -name "*.js" | grep -v spec | grep -v map
  `);
  console.log('Secret encryption files:\n', files.result);

  // Inspect the decrypt utility
  const decryptUtil = await sb.process.executeCommand(`
    docker exec zed-server-1 cat /app/packages/twenty-server/dist/engine/core-modules/secret-encryption/utils/encrypt-aes-ctr.util.js
  `);
  console.log('AES-CTR util:\n', decryptUtil.result);
}

decryptTokenAndPatch().catch(console.error);
