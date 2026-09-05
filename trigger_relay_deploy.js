const https = require('https');

const RENDER_API_KEY = 'rnd_l7j8gWyp3mHPGc2lMcHeig3d0MOB';
const SERVICE_ID = 'srv-da9trb942hec738ud22g';

async function triggerDeploy() {
  const payload = JSON.stringify({ clearCache: 'clear' });
  const options = {
    hostname: 'api.render.com',
    path: `/v1/services/${SERVICE_ID}/deploys`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RENDER_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        try { resolve(JSON.parse(data)); } catch { resolve(data); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

triggerDeploy().then(r => console.log('Deploy triggered:', JSON.stringify(r, null, 2))).catch(console.error);
