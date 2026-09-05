const https = require('https');
const API_KEY = 'rnd_Hk82F4dHYUS66wzv3xyGSwXzwUQB';
const serviceId = 'srv-dad7c1afngtc73859pr0';
const newRedisUrl = 'redis://red-dadabdojo6nc73dntnmg:6379';

https.get({
  hostname: 'api.render.com',
  path: '/v1/services/' + serviceId + '/env-vars?limit=100',
  headers: { 'Authorization': 'Bearer ' + API_KEY }
}, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const list = JSON.parse(d);
    const updated = list.map(item => {
      if (item.envVar.key === 'REDIS_URL') {
        return { key: 'REDIS_URL', value: newRedisUrl };
      }
      return { key: item.envVar.key, value: item.envVar.value };
    });
    
    if (!updated.some(x => x.key === 'REDIS_URL')) {
      updated.push({ key: 'REDIS_URL', value: newRedisUrl });
    }

    const putBody = JSON.stringify(updated);
    const req = https.request({
      hostname: 'api.render.com',
      path: '/v1/services/' + serviceId + '/env-vars',
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer ' + API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(putBody)
      }
    }, putRes => {
      let putData = '';
      putRes.on('data', c => putData += c);
      putRes.on('end', () => {
        console.log('Update Env Vars Status:', putRes.statusCode);
        console.log('Updated REDIS_URL to:', newRedisUrl);
      });
    });
    req.write(putBody);
    req.end();
  });
});
