const { Daytona } = require('@daytona/sdk');

async function decryptProperly() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  // Use Twenty's own secretEncryptionService directly through require inside the container
  const res = await sb.process.executeCommand(`
    docker exec zed-server-1 node -e "
const crypto = require('crypto');
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ZERO_SALT = Buffer.alloc(32);
const GCM_IV = 12;
const GCM_TAG = 16;
const DERIVED_KEY_LEN = 32;

// Context strings to try
const contexts = [
  'instance',
  '',
  'b4ai6k0t73ulj4l40gxarowdm',  // workspace subdomain
];

const INFO_PREFIX = 'twenty:enc:v2:';

const encBase64 = '+8dM6L1r4GL+CDQiLCtItCVEW+ZCmbC6qJK2/8U2EK4oRAVqZqtmvWpXDHZE5Bpv6w2CLbOCDthEB3ibfgKdKarLed/1+n+C+wxfwcSFcg1iG4h/IbYx8mZRAz9QAZs8uaXp9zMEAXtlKtOBssFyLlJuHrQYEhKU5rFTxyjZC0EvePA=';
const buf = Buffer.from(encBase64, 'base64');
const iv = buf.subarray(0, GCM_IV);
const authTag = buf.subarray(buf.length - GCM_TAG);
const ciphertext = buf.subarray(GCM_IV, buf.length - GCM_TAG);

for (const ctx of contexts) {
  try {
    const info = Buffer.from(INFO_PREFIX + ctx);
    const key = Buffer.from(crypto.hkdfSync('sha256', Buffer.from(ENCRYPTION_KEY), ZERO_SALT, info, DERIVED_KEY_LEN));
    const d = crypto.createDecipheriv('aes-256-gcm', key, iv);
    d.setAuthTag(authTag);
    const result = Buffer.concat([d.update(ciphertext), d.final()]).toString('utf8');
    console.log('SUCCESS with context:', JSON.stringify(ctx));
    console.log('DECRYPTED REFRESH_TOKEN:', result);
    break;
  } catch(e) {
    console.log('FAIL context', JSON.stringify(ctx), ':', e.message);
  }
}
"
  `);
  console.log('Result:\n', res.result);
}

decryptProperly().catch(console.error);
