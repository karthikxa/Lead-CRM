const https = require('https');

const API_KEY = 'rnd_Hk82F4dHYUS66wzv3xyGSwXzwUQB';
const SERVICE_ID = 'srv-dad7c1afngtc73859pr0';

function renderReq(path) {
  return new Promise((resolve, reject) => {
    https.get({
      hostname: 'api.render.com',
      path: `/v1${path}`,
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
  const events = await renderReq(`/services/${SERVICE_ID}/events?limit=10`);
  console.log('--- Recent Events ---');
  if (Array.isArray(events)) {
    events.forEach(e => {
      console.log(`[${e.event?.timestamp}] ${e.event?.type}: ${JSON.stringify(e.event?.details || {})}`);
    });
  } else {
    console.log(events);
  }

  const deploys = await renderReq(`/services/${SERVICE_ID}/deploys?limit=3`);
  console.log('\n--- Deploys ---');
  if (Array.isArray(deploys)) {
    deploys.forEach(d => {
      console.log(`ID: ${d.deploy?.id} | Status: ${d.deploy?.status} | Finished: ${d.deploy?.finishedAt}`);
    });
  }
}

main().catch(console.error);
