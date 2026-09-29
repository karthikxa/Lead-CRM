const https = require('https');

const API_KEY = 'rnd_Hk82F4dHYUS66wzv3xyGSwXzwUQB';
const OWNER_ID = 'tea-dacp2tn10e5c73bgbkjg';

https.get({
  hostname: 'api.render.com',
  path: `/v1/services?ownerId=${OWNER_ID}&limit=20`,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Accept': 'application/json'
  }
}, res => {
  let chunks = '';
  res.on('data', c => chunks += c);
  res.on('end', () => {
    try {
      const list = JSON.parse(chunks);
      console.log(`Found ${list.length} services:`);
      list.forEach(item => {
        const s = item.service || item;
        console.log(`- [${s.type}] ${s.name} (${s.id}) -> Suspended: ${s.suspended}`);
      });
    } catch(e) {
      console.log('Error:', e.message);
    }
  });
}).on('error', console.error);

// Also list Redis instances
https.get({
  hostname: 'api.render.com',
  path: `/v1/redis?ownerId=${OWNER_ID}&limit=20`,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Accept': 'application/json'
  }
}, res => {
  let chunks = '';
  res.on('data', c => chunks += c);
  res.on('end', () => {
    try {
      const list = JSON.parse(chunks);
      console.log(`\nFound ${list.length} Redis instances:`);
      list.forEach(item => {
        const r = item.redis || item;
        console.log(`- Redis: ${r.name} (${r.id}) -> Plan: ${r.plan}, Status: ${r.status}`);
      });
    } catch(e) {
      console.log('Redis list error:', e.message);
    }
  });
}).on('error', console.error);
