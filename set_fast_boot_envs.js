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
  console.log('Setting DISABLE_DB_MIGRATIONS=true...');
  const r1 = await updateEnv('DISABLE_DB_MIGRATIONS', 'true');
  console.log('DISABLE_DB_MIGRATIONS:', r1.status, r1.body);

  console.log('Setting DISABLE_CRON_JOBS_REGISTRATION=true...');
  const r2 = await updateEnv('DISABLE_CRON_JOBS_REGISTRATION', 'true');
  console.log('DISABLE_CRON_JOBS_REGISTRATION:', r2.status, r2.body);
}

main().catch(console.error);
