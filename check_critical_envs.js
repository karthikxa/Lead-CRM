const https = require('https');

const API_KEY = 'rnd_Hk82F4dHYUS66wzv3xyGSwXzwUQB';
const SERVICE_ID = 'srv-dad7c1afngtc73859pr0';

function getEnvs() {
  return new Promise((resolve, reject) => {
    https.get({
      hostname: 'api.render.com',
      path: `/v1/services/${SERVICE_ID}/env-vars`,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
      }
    }, res => {
      let chunks = '';
      res.on('data', c => chunks += c);
      res.on('end', () => {
        try {
          resolve(JSON.parse(chunks));
        } catch {
          resolve(chunks);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  const envs = await getEnvs();
  const pgVar = envs.find(e => e.envVar?.key === 'PG_DATABASE_URL');
  const redisVar = envs.find(e => e.envVar?.key === 'REDIS_URL');
  const storageVar = envs.find(e => e.envVar?.key === 'STORAGE_TYPE');
  const portVar = envs.find(e => e.envVar?.key === 'PORT');
  const nodePortVar = envs.find(e => e.envVar?.key === 'NODE_PORT');
  const nodeOptVar = envs.find(e => e.envVar?.key === 'NODE_OPTIONS');

  console.log('PG_DATABASE_URL:', pgVar?.envVar?.value);
  console.log('REDIS_URL:', redisVar?.envVar?.value?.substring(0, 30) + '...');
  console.log('STORAGE_TYPE:', storageVar?.envVar?.value);
  console.log('PORT:', portVar?.envVar?.value);
  console.log('NODE_PORT:', nodePortVar?.envVar?.value);
  console.log('NODE_OPTIONS:', nodeOptVar?.envVar?.value);
}

main().catch(console.error);
