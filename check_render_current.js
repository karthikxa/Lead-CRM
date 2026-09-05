const https = require('https');

const API_KEY = 'rnd_Hk82F4dHYUS66wzv3xyGSwXzwUQB';
const SERVICE_ID = 'srv-dad7c1afngtc73859pr0';

function renderReq(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'api.render.com',
      path: `/v1${path}`,
      method,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    }, res => {
      let chunks = '';
      res.on('data', c => chunks += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(chunks) });
        } catch {
          resolve({ status: res.statusCode, data: chunks });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  console.log('--- Fetching Service Details ---');
  const srv = await renderReq(`/services/${SERVICE_ID}`);
  console.log('Service:', srv.status, srv.data?.service?.name, srv.data?.service?.serviceDetails?.plan);

  console.log('--- Fetching Env Vars ---');
  const envs = await renderReq(`/services/${SERVICE_ID}/env-vars`);
  console.log('Env vars count:', envs.data?.length);
  if (Array.isArray(envs.data)) {
    envs.data.forEach(e => {
      const key = e.envVar?.key;
      let val = e.envVar?.value;
      if (key && (key.includes('PASS') || key.includes('KEY') || key.includes('SECRET') || key.includes('URL'))) {
        val = val ? val.substring(0, 20) + '...' : '(empty)';
      }
      console.log(` - ${key} = ${val}`);
    });
  }

  console.log('--- Fetching Recent Deploys ---');
  const deploys = await renderReq(`/services/${SERVICE_ID}/deploys?limit=5`);
  if (Array.isArray(deploys.data)) {
    deploys.data.forEach(d => {
      console.log(` - ${d.deploy?.id} | status: ${d.deploy?.status} | createdAt: ${d.deploy?.createdAt}`);
    });
  } else {
    console.log('Deploys:', deploys.data);
  }
}

main().catch(console.error);
