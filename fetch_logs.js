const https = require('https');

const API_KEY = 'rnd_Hk82F4dHYUS66wzv3xyGSwXzwUQB';
const SERVICE_ID = 'srv-dad7c1afngtc73859pr0';

function getLogs() {
  return new Promise((resolve, reject) => {
    https.get({
      hostname: 'api.render.com',
      path: `/v1/services/${SERVICE_ID}/logs?limit=40`,
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
  const logs = await getLogs();
  if (Array.isArray(logs)) {
    logs.forEach(l => {
      console.log(`[${l.timestamp}] ${l.message || l.text}`);
    });
  } else {
    console.log(logs);
  }
}

main().catch(console.error);
