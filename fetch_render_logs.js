const https = require('https');
const API_KEY = 'rnd_Hk82F4dHYUS66wzv3xyGSwXzwUQB';
const SERVICE_ID = 'srv-dad7c1afngtc73859pr0';

https.get({
  hostname: 'api.render.com',
  path: `/v1/services/${SERVICE_ID}/logs?limit=100`,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Accept': 'application/json'
  }
}, res => {
  let chunks = '';
  res.on('data', c => chunks += c);
  res.on('end', () => {
    try {
      const data = JSON.parse(chunks);
      console.log('Logs response count:', Array.isArray(data) ? data.length : typeof data);
      if (Array.isArray(data)) {
        data.forEach(l => console.log(`[${l.timestamp}] ${l.message}`));
      } else {
        console.log(JSON.stringify(data, null, 2));
      }
    } catch (e) {
      console.log('Raw:', chunks.substring(0, 1000));
    }
  });
}).on('error', console.error);
