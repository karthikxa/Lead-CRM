const https = require('https');

const RENDER_API_KEY = 'rnd_l7j8gWyp3mHPGc2lMcHeig3d0MOB';
const SERVICE_ID = 'srv-dad7c1afngtc73859pr0';

function api(method, path, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : undefined;
    const req = https.request({
      hostname: 'api.render.com',
      path: `/v1${path}`,
      method,
      headers: {
        'Authorization': `Bearer ${RENDER_API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {})
      }
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(d); } });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function main() {
  console.log('=== Checking current env vars ===');
  const envs = await api('GET', `/services/${SERVICE_ID}/env-vars`);
  const nodeOpts = envs.find ? envs.find(e => e.envVar?.key === 'NODE_OPTIONS') : null;
  console.log('Current NODE_OPTIONS:', nodeOpts?.envVar?.value || 'not set in env vars');

  // The correct NODE_OPTIONS: 384MB heap + expose-gc for manual GC
  // Remove the bad env var so Dockerfile ENV takes effect
  // OR update it to the correct value
  console.log('\n=== Updating NODE_OPTIONS to safe 384MB heap ===');
  
  // Find all env vars and build updated list
  const allEnvs = Array.isArray(envs) ? envs.map(e => ({
    key: e.envVar?.key,
    value: e.envVar?.key === 'NODE_OPTIONS' 
      ? '--max-old-space-size=384 --expose-gc'
      : e.envVar?.value
  })) : [];

  if (allEnvs.length > 0) {
    const result = await api('PUT', `/services/${SERVICE_ID}/env-vars`, allEnvs);
    console.log('Env update result:', JSON.stringify(result).substring(0, 300));
  }

  // Now trigger a new deploy
  console.log('\n=== Triggering fresh deploy ===');
  const deploy = await api('POST', `/services/${SERVICE_ID}/deploys`, { clearCache: 'do_not_clear' });
  console.log('Deploy triggered:', deploy?.id || deploy?.deploy?.id || JSON.stringify(deploy).substring(0, 200));
  console.log('Status:', deploy?.status || deploy?.deploy?.status);
  console.log('\nMonitor at: https://dashboard.render.com/web/' + SERVICE_ID);
  console.log('Service URL: https://zed-0moa.onrender.com');
}

main().catch(console.error);
