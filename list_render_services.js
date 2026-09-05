const https = require('https');
const API_KEY = 'rnd_Hk82F4dHYUS66wzv3xyGSwXzwUQB';

https.get({
  hostname: 'api.render.com',
  path: `/v1/services?limit=20`,
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
      console.log('Services count:', data.length);
      data.forEach(s => {
        console.log(`- ${s.service?.id} | name: ${s.service?.name} | type: ${s.service?.type} | plan: ${s.service?.serviceDetails?.plan} | repo: ${s.service?.repo} | url: ${s.service?.serviceDetails?.url}`);
      });
    } catch {
      console.log(chunks);
    }
  });
}).on('error', console.error);
