const https = require('https');

async function pollDeploy() {
  const serviceId = 'srv-da9trb942hec738ud22g';
  const deployId = 'dep-da9trbp42hec738ud2p0';
  const RENDER_API_KEY = 'rnd_l7j8gWyp3mHPGc2lMcHeig3d0MOB';

  const options = {
    hostname: 'api.render.com',
    path: `/v1/services/${serviceId}/deploys/${deployId}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${RENDER_API_KEY}`,
      'Accept': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const parsed = JSON.parse(data);
        console.log('Deploy status:', parsed.status, '| Deploy ID:', parsed.id);
        resolve(parsed);
      });
    });
    req.on('error', reject);
    req.end();
  });
}

pollDeploy().catch(console.error);
