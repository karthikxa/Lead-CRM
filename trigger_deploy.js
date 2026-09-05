const https = require('https');

const API_KEY = 'rnd_Hk82F4dHYUS66wzv3xyGSwXzwUQB';
const SERVICE_ID = 'srv-dad7c1afngtc73859pr0';

function triggerDeploy() {
  const data = JSON.stringify({ clearCache: 'do_not_clear' });
  const req = https.request({
    hostname: 'api.render.com',
    path: `/v1/services/${SERVICE_ID}/deploys`,
    method: 'POST',
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
      console.log('Status:', res.statusCode);
      console.log('Response:', chunks);
    });
  });
  req.on('error', console.error);
  req.write(data);
  req.end();
}

triggerDeploy();
