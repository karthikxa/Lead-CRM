const https = require('https');

const API_KEY = 'rnd_Hk82F4dHYUS66wzv3xyGSwXzwUQB';
const REDIS_ID = 'red-dad7bo0ae00c7395l5jg';

function updateAllowList() {
  const data = JSON.stringify({
    ipAllowList: [
      { cidrBlock: '0.0.0.0/0', description: 'Allow all' }
    ]
  });

  const req = https.request({
    hostname: 'api.render.com',
    path: `/v1/redis/${REDIS_ID}`,
    method: 'PATCH',
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

updateAllowList();
