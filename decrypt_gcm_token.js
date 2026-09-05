const { Daytona } = require('@daytona/sdk');

async function patchEmailWithGmailApi() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  console.log('1. Decrypting stored refresh token using AES-GCM v2...');
  const decryptRes = await sb.process.executeCommand(`
    docker exec zed-server-1 node -e "
const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const WORKSPACE_ID = 'b4ai6k0t73ulj4l40gxarowdm';

// AES-GCM v2 decrypt (same as derive-gcm-key.util.js)
const GCM_IV_LENGTH = 12;
const GCM_TAG_LENGTH = 16;
const HKDF_INFO_PREFIX = 'twenty:enc:v2:';
const INSTANCE_CONTEXT = 'instance';
const DERIVED_KEY_LENGTH = 32;
const ZERO_SALT = Buffer.alloc(32);

function deriveGcmKey(rawKey, workspaceId) {
  return Buffer.from(crypto.hkdfSync('sha256', Buffer.from(rawKey), ZERO_SALT, Buffer.from(HKDF_INFO_PREFIX + (workspaceId || INSTANCE_CONTEXT)), DERIVED_KEY_LENGTH));
}

function decryptAesGcmV2(payloadBase64, rawKey, workspaceId) {
  const buf = Buffer.from(payloadBase64, 'base64');
  const iv = buf.subarray(0, GCM_IV_LENGTH);
  const authTag = buf.subarray(buf.length - GCM_TAG_LENGTH);
  const ciphertext = buf.subarray(GCM_IV_LENGTH, buf.length - GCM_TAG_LENGTH);
  const key = deriveGcmKey(rawKey, workspaceId);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

// The encrypted refresh token from DB
const encRefreshToken = '+8dM6L1r4GL+CDQiLCtItCVEW+ZCmbC6qJK2/8U2EK4oRAVqZqtmvWpXDHZE5Bpv6w2CLbOCDthEB3ibfgKdKarLed/1+n+C+wxfwcSFcg1iG4h/IbYx8mZRAz9QAZs8uaXp9zMEAXtlKtOBssFyLlJuHrQYEhKU5rFTxyjZC0EvePA=';

try {
  // Try instance context first
  const decrypted = decryptAesGcmV2(encRefreshToken, ENCRYPTION_KEY, null);
  console.log('REFRESH_TOKEN_INSTANCE:', decrypted);
} catch(e) {
  console.log('Instance decrypt failed:', e.message);
  try {
    // Try with workspace ID  
    const decrypted2 = decryptAesGcmV2(encRefreshToken, ENCRYPTION_KEY, WORKSPACE_ID);
    console.log('REFRESH_TOKEN_WORKSPACE:', decrypted2);
  } catch(e2) {
    console.log('Workspace decrypt failed:', e2.message);
  }
}
"
  `);
  console.log('Decryption:\n', decryptRes.result);
}

patchEmailWithGmailApi().catch(console.error);
