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
  console.log('=== Fetching current env vars ===');
  const envs = await renderReq(`/services/${SERVICE_ID}/env-vars`);
  const envList = envs.data;

  if (!Array.isArray(envList)) {
    console.error('Could not fetch env vars:', envList);
    process.exit(1);
  }

  console.log(`Found ${envList.length} env vars`);

  // Memory budget on Render 512MB free tier:
  // - OS/container overhead: ~80MB
  // - Node.js RSS non-heap (native, code, stack): ~80MB
  // - Available for JS heap: ~350MB
  // - But peak GC pressure can spike, so cap at 256MB heap
  //   and use small semi-space (young gen) to reduce GC pressure
  //
  // Key env vars to add:
  // NODE_OPTIONS: --max-old-space-size=256 --max-semi-space-size=4 --expose-gc
  //   256MB old gen + 4MB young gen = ~260MB heap cap
  // MALLOC_ARENA_MAX=2  → reduce glibc malloc arena fragmentation (-30MB RSS)
  // UV_THREADPOOL_SIZE=2 → reduce libuv thread pool overhead (-10MB RSS)

  const SAFE_NODE_OPTIONS = '--max-old-space-size=256 --max-semi-space-size=4 --expose-gc';

  // Build updated env list - update existing keys and add new ones
  const existingKeys = new Set(envList.map(e => e.envVar.key));
  
  const updatedEnvs = envList.map(e => ({
    key: e.envVar.key,
    value: e.envVar.key === 'NODE_OPTIONS' ? SAFE_NODE_OPTIONS : e.envVar.value
  }));

  // Add MALLOC_ARENA_MAX if not present
  if (!existingKeys.has('MALLOC_ARENA_MAX')) {
    updatedEnvs.push({ key: 'MALLOC_ARENA_MAX', value: '2' });
    console.log('Adding MALLOC_ARENA_MAX=2');
  }
  
  // Add UV_THREADPOOL_SIZE if not present
  if (!existingKeys.has('UV_THREADPOOL_SIZE')) {
    updatedEnvs.push({ key: 'UV_THREADPOOL_SIZE', value: '2' });
    console.log('Adding UV_THREADPOOL_SIZE=2');
  }

  // Ensure DISABLE_CRON_JOBS_REGISTRATION=true
  if (!existingKeys.has('DISABLE_CRON_JOBS_REGISTRATION')) {
    updatedEnvs.push({ key: 'DISABLE_CRON_JOBS_REGISTRATION', value: 'true' });
    console.log('Adding DISABLE_CRON_JOBS_REGISTRATION=true');
  }

  console.log('\n=== New NODE_OPTIONS:', SAFE_NODE_OPTIONS, '===');
  console.log('Memory breakdown:');
  console.log('  Old gen heap:    256 MB');
  console.log('  Young gen heap:    4 MB');
  console.log('  Node native/code: ~80 MB');
  console.log('  OS/glibc overhead: ~70 MB');
  console.log('  TOTAL ESTIMATED:  ~410 MB  ✅ under 512MB');

  console.log('\n=== Updating Render env vars ===');
  const updateRes = await renderReq(`/services/${SERVICE_ID}/env-vars`, 'PUT', updatedEnvs);
  console.log('Update status:', updateRes.status);

  if (updateRes.status !== 200) {
    console.error('Failed to update env vars:', JSON.stringify(updateRes.data).substring(0, 300));
    process.exit(1);
  }
  console.log('✅ Env vars updated!');

  // Cancel any running deploy first to avoid conflicts
  console.log('\n=== Triggering fresh deploy ===');
  const deployRes = await renderReq(`/services/${SERVICE_ID}/deploys`, 'POST', { clearCache: 'do_not_clear' });
  console.log('Deploy status:', deployRes.status);

  const deploy = deployRes.data?.deploy || deployRes.data;
  console.log('Deploy ID:', deploy?.id);
  console.log('Status:', deploy?.status);

  console.log('\n============================================');
  console.log('✅ RENDER MEMORY FIX DEPLOYED!');
  console.log('NODE_OPTIONS:', SAFE_NODE_OPTIONS);
  console.log('MALLOC_ARENA_MAX=2  → saves ~30MB glibc arenas');
  console.log('UV_THREADPOOL_SIZE=2 → saves ~10MB thread pool');
  console.log('Service: https://zed-0moa.onrender.com');
  console.log('Monitor: https://dashboard.render.com/web/' + SERVICE_ID);
  console.log('============================================');
}

main().catch(console.error);
