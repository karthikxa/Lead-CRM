const https = require('https');
const API_KEY = 'rnd_Hk82F4dHYUS66wzv3xyGSwXzwUQB';
const SERVICE_ID = 'srv-dad7c1afngtc73859pr0';
const OWNER_ID = 'usr-dacp2tn10e5c73bgbkog';

const start = encodeURIComponent('2026-09-04T08:47:08Z');

https.get({
  hostname: 'api.render.com',
  path: `/v1/logs?ownerId=${OWNER_ID}&resource=${SERVICE_ID}&startTime=${start}&direction=forward&limit=100`,
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
      if (Array.isArray(data)) {
        data.forEach(l => console.log(`[${l.timestamp}] ${l.message}`));
      } else if (data.logs) {
        data.logs.forEach(l => console.log(`[${l.timestamp}] ${l.message}`));
      } else {
        console.log(JSON.stringify(data, null, 2));
      }
    } catch {
      console.log(chunks);
    }
  });
}).on('error', console.error);
