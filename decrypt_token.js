const { Daytona } = require('@daytona/sdk');

async function decryptAndGetRefreshToken() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  // Use the decrypt-aes-ctr util and the secret service to decrypt within the container
  const res = await sb.process.executeCommand(`
    docker exec zed-server-1 node -e "
const crypto = require('crypto');
const { Client } = require('pg');

// AES-CTR decryption (v1 format: enc:v1:xxx or old format)
// AES-GCM v2 decryption (v2 format: enc:v2:keyId:base64)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

function deriveCtrKey(rawKey) {
  return crypto.createHash('sha512').update(rawKey).digest('hex').substring(0, 32);
}

function decryptAesCtr(encryptedBase64, rawKey) {
  const buf = Buffer.from(encryptedBase64, 'base64');
  const iv = buf.subarray(0, 16);
  const ciphertext = buf.subarray(16);
  const keyHash = deriveCtrKey(rawKey);
  const decipher = crypto.createDecipheriv('aes-256-ctr', keyHash, iv);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

function parseEnvelope(encStr) {
  // Format: enc:v2:keyId:base64data
  const parts = encStr.split(':');
  if (parts[0] === 'enc' && parts[1] === 'v2') {
    return { version: 'v2', keyId: parts[2], data: parts[3] };
  } else if (parts[0] === 'enc' && parts[1] === 'v1') {
    return { version: 'v1', data: parts[2] };
  }
  return { version: 'raw', data: encStr };
}

const encryptedToken = 'enc:v2:13389bae:+8dM6L1r4GL+CDQiLCtItCVEW+ZCmbC6qJK2/8U2EK4oRAVqZqtmvWpXDHZE5Bpv6w2CLbOCDthEB3ibfgKdKarLed/1+n+C+wxfwcSFcg1iG4h/IbYx8mZRAz9QAZs8uaXp9zMEAXtlKtOBssFyLlJuHrQYEhKU5rFTxyjZC0EvePA=';
const parsed = parseEnvelope(encryptedToken);
console.log('Envelope parsed:', parsed.version, parsed.keyId);

try {
  const decrypted = decryptAesCtr(parsed.data, ENCRYPTION_KEY);
  console.log('REFRESH_TOKEN:', decrypted);
} catch(e) {
  console.log('CTR decryption failed:', e.message);
}
"
  `);
  console.log('Decryption result:\n', res.result);
}

decryptAndGetRefreshToken().catch(console.error);
