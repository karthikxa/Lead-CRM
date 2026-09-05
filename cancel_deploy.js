const https = require('https');

const API_KEY = 'rnd_Hk82F4dHYUS66wzv3xyGSwXzwUQB';
const SERVICE_ID = 'srv-dad7c1afngtc73859pr0';
const DEPLOY_ID = 'dep-dad83g710e5c73dok340';

function cancelDeploy() {
  const req = https.request({
    hostname: 'api.render.com',
    path: `/v1/services/${SERVICE_ID}/deploys/${DEPLOY_ID}/cancel`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Accept': 'application/json'
    }
  }, res => {
    let chunks = '';
    res.on('data', c => chunks += c);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Response:', chunks);
    });
  });
  req.on('error', console.error);
  req.end();
}

cancelDeploy();
