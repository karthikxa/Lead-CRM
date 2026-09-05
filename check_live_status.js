const https = require('https');
const RENDER_API_KEY = 'rnd_l7j8gWyp3mHPGc2lMcHeig3d0MOB';
const SERVICE_ID = 'srv-da9trb942hec738ud22g';

function api(path) {
  return new Promise((resolve, reject) => {
    https.get({
      hostname: 'api.render.com',
      path: `/v1${path}`,
      headers: { 'Authorization': `Bearer ${RENDER_API_KEY}`, 'Accept': 'application/json' }
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(d); } });
    }).on('error', reject);
  });
}

async function main() {
  // Check service
  const svc = await api(`/services/${SERVICE_ID}`);
  console.log('=== SERVICE STATUS ===');
  console.log('Name:', svc.name);
  console.log('Status:', svc.suspended || 'active');
  console.log('URL:', svc.serviceDetails?.url || 'N/A');
  console.log('');

  // Check latest deploy
  const deploys = await api(`/services/${SERVICE_ID}/deploys?limit=10`);
  console.log('=== RECENT DEPLOYS ===');
  deploys.forEach(d => {
    console.log(` - ${d.deploy?.id} | ${d.deploy?.status} | ${new Date(d.deploy?.createdAt).toISOString()}`);
    if (d.deploy?.status === 'update_failed') {
      console.log(`   Error: ${JSON.stringify(d.deploy?.finishedAt)}`);
    }
  });

  // Check health endpoint
  const serviceUrl = svc.serviceDetails?.url;
  if (serviceUrl) {
    console.log('\n=== HEALTH CHECK ===');
    console.log(`Testing: ${serviceUrl}/healthz`);
    await new Promise((resolve) => {
      https.get(`${serviceUrl}/healthz`, res => {
        let d = ''; res.on('data', c => d += c);
        res.on('end', () => {
          console.log(`Status: ${res.statusCode}`);
          console.log(`Body: ${d.substring(0, 200)}`);
          resolve();
        });
      }).on('error', e => { console.log(`Health check error: ${e.message}`); resolve(); });
    });
  }
}

main().catch(console.error);
