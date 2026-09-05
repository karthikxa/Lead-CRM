const https = require('https');
const API_KEY = 'rnd_Hk82F4dHYUS66wzv3xyGSwXzwUQB';
const SERVICE_ID = 'srv-dad7c1afngtc73859pr0';

https.get({
  hostname: 'api.render.com',
  path: `/v1/services/${SERVICE_ID}/events?limit=30`,
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
      data.forEach(e => {
        if (e.event?.type === 'deploy_ended') {
          console.log(`[${e.event.timestamp}] deploy_ended: ${JSON.stringify(e.event.details)}`);
        }
      });
    } catch (err) {
      console.error(err);
    }
  });
});
