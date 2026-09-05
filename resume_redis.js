const https = require('https');

const API_KEY = 'rnd_Hk82F4dHYUS66wzv3xyGSwXzwUQB';
const REDIS_ID = 'red-dad7bo0ae00c7395l5jg';

function resumeRedis() {
  const req = https.request({
    hostname: 'api.render.com',
    path: `/v1/redis/${REDIS_ID}/resume`,
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

resumeRedis();
