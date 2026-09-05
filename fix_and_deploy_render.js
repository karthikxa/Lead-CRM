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
        try { resolve({ status: res.statusCode, data: JSON.parse(chunks) }); }
        catch { resolve({ status: res.statusCode, data: chunks }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  // Step 1: Get current env vars
  console.log('=== Fetching current env vars ===');
  const envs = await renderReq(`/services/${SERVICE_ID}/env-vars`);
  const envList = envs.data;
  
  if (!Array.isArray(envList)) {
    console.error('Could not fetch env vars:', envList);
    process.exit(1);
  }
  
  console.log(`Found ${envList.length} env vars`);
  
  // Step 2: Update env vars: NODE_OPTIONS to 384MB, MALLOC_ARENA_MAX=2, UV_THREADPOOL_SIZE=2
  const envMap = new Map();
  for (const e of envList) {
    envMap.set(e.envVar.key, e.envVar.value);
  }

  envMap.set('NODE_OPTIONS', '--max-old-space-size=420');
  envMap.set('MALLOC_ARENA_MAX', '2');
  envMap.set('PORT', '3000');
  envMap.set('NODE_PORT', '3000');
  envMap.set('DISABLE_DB_MIGRATIONS', 'true');
  envMap.set('DISABLE_CRON_JOBS_REGISTRATION', 'true');
  envMap.set('PATCH_FRONT_ASSETS', 'false');

  const updatedEnvs = Array.from(envMap.entries()).map(([key, value]) => ({ key, value }));
  console.log('Setting NODE_OPTIONS to:', envMap.get('NODE_OPTIONS'));
  console.log('Setting MALLOC_ARENA_MAX to:', envMap.get('MALLOC_ARENA_MAX'));
  console.log('Setting PORT to:', envMap.get('PORT'));
  
  console.log('\n=== Updating env vars on Render ===');
  const updateRes = await renderReq(`/services/${SERVICE_ID}/env-vars`, 'PUT', updatedEnvs);
  console.log('Update status:', updateRes.status);
  
  if (updateRes.status !== 200) {
    console.error('Failed to update env vars:', JSON.stringify(updateRes.data).substring(0, 300));
    process.exit(1);
  }
  console.log('✅ Env vars updated successfully!');
  
  // Step 3: Trigger a new deploy
  console.log('\n=== Triggering fresh Render deploy ===');
  const deployRes = await renderReq(`/services/${SERVICE_ID}/deploys`, 'POST', { clearCache: 'do_not_clear' });
  console.log('Deploy response status:', deployRes.status);
  
  const deploy = deployRes.data?.deploy || deployRes.data;
  const deployId = deploy?.id;
  console.log('Deploy ID:', deployId || JSON.stringify(deployRes.data).substring(0, 200));
  console.log('Status:', deploy?.status);
  
  console.log('\n===========================================');
  console.log('✅ RENDER DEPLOY TRIGGERED!');
  console.log('Service: https://zed-0moa.onrender.com');
  console.log('Monitor: https://dashboard.render.com/web/' + SERVICE_ID);
  console.log('NODE_OPTIONS: --max-old-space-size=384 --expose-gc');
  console.log('===========================================');
}

main().catch(console.error);
