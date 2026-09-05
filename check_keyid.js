const { Daytona } = require('@daytona/sdk');

async function tryAllDecrypt() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  // Let's use the actual SecretEncryptionService from inside the NestJS app
  const decryptRes = await sb.process.executeCommand(`
    docker exec zed-server-1 node -e "
const crypto = require('crypto');
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

// Try parsing resolve-encryption-keys to see the actual keyId and key derivation
const keyIdHex = '13389bae';
const computedKeyId = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest('hex').substring(0, 8);
console.log('Expected keyId from env ENCRYPTION_KEY:', computedKeyId);
console.log('Stored keyId in DB:', keyIdHex);
console.log('Match:', computedKeyId === keyIdHex);

// Check if ENCRYPTION_KEY is different from what we think
const encKeyLen = (ENCRYPTION_KEY || '').length;
console.log('ENCRYPTION_KEY length:', encKeyLen);
console.log('ENCRYPTION_KEY first 8 chars:', (ENCRYPTION_KEY || '').substring(0, 8));
"
  `);
  console.log('Key ID check:\n', decryptRes.result);
}

tryAllDecrypt().catch(console.error);
