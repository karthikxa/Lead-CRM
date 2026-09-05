const https = require('https');
const API_KEY = 'rnd_Hk82F4dHYUS66wzv3xyGSwXzwUQB';
const SERVICE_ID = 'srv-dad7c1afngtc73859pr0';
const DEPLOY_ID = 'dep-dad8v0n10e5c73ds5n2g';

https.get({
  hostname: 'api.render.com',
  path: `/v1/services/${SERVICE_ID}/deploys/${DEPLOY_ID}`,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Accept': 'application/json'
  }
}, res => {
  let chunks = '';
  res.on('data', c => chunks += c);
  res.on('end', () => {
    try {
      console.log(JSON.stringify(JSON.parse(chunks), null, 2));
    } catch {
      console.log(chunks);
    }
  });
}).on('error', console.error);
