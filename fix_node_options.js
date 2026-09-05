const https = require('https');

const API_KEY = 'rnd_Hk82F4dHYUS66wzv3xyGSwXzwUQB';
const SERVICE_ID = 'srv-dad7c1afngtc73859pr0';

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
  console.log('Updating NODE_OPTIONS to remove buggy --max-semi-space-size=8 and set safe 384MB heap...');
  const res = await updateEnv('NODE_OPTIONS', '--max-old-space-size=384');
  console.log('Result:', res.status, res.body);
}

main().catch(console.error);
