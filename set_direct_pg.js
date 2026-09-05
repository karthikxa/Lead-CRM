const https = require('https');

const API_KEY = 'rnd_Hk82F4dHYUS66wzv3xyGSwXzwUQB';
const SERVICE_ID = 'srv-dad7c1afngtc73859pr0';
const DIRECT_PG_URL = 'postgresql://neondb_owner:npg_PXCV2dizfS1b@ep-plain-sea-ae01gxmg.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

function updateEnv(key, value) {
  const data = JSON.stringify({ value });
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.render.com',
      path: `/v1/services/${SERVICE_ID}/env-vars/${key}`,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let chunks = '';
      res.on('data', c => chunks += c);
      res.on('end', () => {
        resolve({ status: res.statusCode, body: chunks });
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('Updating PG_DATABASE_URL to stable direct URL...');
  const res = await updateEnv('PG_DATABASE_URL', DIRECT_PG_URL);
  console.log('PG_DATABASE_URL result:', res.status, res.body);
}

main().catch(console.error);
