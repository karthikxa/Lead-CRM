const https = require('https');

const API_KEY = 'rnd_Hk82F4dHYUS66wzv3xyGSwXzwUQB';
const REDIS_ID = 'red-dad7bo0ae00c7395l5jg';

function getRedis() {
  return new Promise((resolve, reject) => {
    https.get({
      hostname: 'api.render.com',
      path: `/v1/redis/${REDIS_ID}`,
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
  const r = await getRedis();
  console.log('Redis info:', JSON.stringify(r, null, 2));
}

main().catch(console.error);
