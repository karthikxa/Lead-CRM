const https = require('https');

const API_KEY = 'rnd_Hk82F4dHYUS66wzv3xyGSwXzwUQB';
const SERVICE_ID = 'srv-dad7c1afngtc73859pr0';
const OWNER_ID = 'tea-dacp2tn10e5c73bgbkjg';

function renderReq(path) {
  return new Promise((resolve, reject) => {
    https.get({
      hostname: 'api.render.com',
      path: `/v1${path}`,
      headers: { 'Authorization': `Bearer ${API_KEY}`, 'Accept': 'application/json' }
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(d); } });
    }).on('error', reject);
  });
}

let seenLogs = new Set();

async function checkLogs() {
  const data = await renderReq(`/logs?ownerId=${OWNER_ID}&resource=${SERVICE_ID}&limit=30`);
  if (data && Array.isArray(data.logs)) {
    data.logs.forEach(l => {
      const key = `${l.timestamp}-${l.message}`;
      if (!seenLogs.has(key)) {
        seenLogs.add(key);
        console.log(`[LOG ${l.timestamp?.substring(11, 19)}] ${l.message}`);
      }
    });
  }
}

async function testEndpoints() {
  return new Promise(resolve => {
    https.get('https://zed-0moa.onrender.com/healthz', res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => {
        console.log(`[HTTP] /healthz: ${res.statusCode} | ${d.substring(0, 100)}`);
        https.get('https://zed-0moa.onrender.com/client-config', res2 => {
          let d2 = ''; res2.on('data', c => d2 += c);
          res2.on('end', () => {
            console.log(`[HTTP] /client-config: ${res2.statusCode} | ${d2.substring(0, 100)}`);
            resolve(res.statusCode === 200);
          });
        }).on('error', () => resolve(false));
      });
    }).on('error', () => resolve(false));
  });
}

async function main() {
  console.log('Monitoring Render deploy dep-daefl1qd0e5s738apndg...');
  for (let i = 0; i < 40; i++) {
    const deploys = await renderReq(`/services/${SERVICE_ID}/deploys?limit=2`);
    const ts = new Date().toLocaleTimeString('en-IN');
    if (Array.isArray(deploys) && deploys[0]) {
      const d = deploys[0].deploy;
      console.log(`[${ts}] ${d.id} | ${d.status}`);
      await checkLogs();
      if (d.status === 'live') {
        const ok = await testEndpoints();
        if (ok) {
          console.log('\n🎉 SUCCESS! Service is responding 200 on /healthz and /client-config!');
          break;
        }
      } else if (d.status === 'update_failed' || d.status === 'build_failed') {
        console.log(`\n❌ Deploy failed with status: ${d.status}`);
        break;
      }
    }
    await new Promise(r => setTimeout(r, 15000));
  }
}

main().catch(console.error);

