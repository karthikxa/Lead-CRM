const { Daytona } = require('@daytona/sdk');

async function decryptV2Token() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  // Look at the actual decrypt-aes-gcm-v2 util
  const res1 = await sb.process.executeCommand(`
    docker exec zed-server-1 cat /app/packages/twenty-server/dist/engine/core-modules/secret-encryption/utils/decrypt-aes-gcm-v2-or-throw.util.js
  `);
  console.log('decrypt-aes-gcm-v2:\n', res1.result);

  const res2 = await sb.process.executeCommand(`
    docker exec zed-server-1 cat /app/packages/twenty-server/dist/engine/core-modules/secret-encryption/utils/derive-gcm-key.util.js
  `);
  console.log('derive-gcm-key:\n', res2.result);

  const res3 = await sb.process.executeCommand(`
    docker exec zed-server-1 cat /app/packages/twenty-server/dist/engine/core-modules/secret-encryption/constants/secret-encryption.constant.js
  `);
  console.log('secret-encryption.constant:\n', res3.result);
}

decryptV2Token().catch(console.error);
