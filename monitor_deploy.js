const https = require('https');
const API_KEY = 'rnd_Hk82F4dHYUS66wzv3xyGSwXzwUQB';
const SERVICE_ID = 'srv-dad7c1afngtc73859pr0';
const DEPLOY_ID = 'dep-dafbjrdg1s2s73ds3ui0';

function check() {
  https.get({
    hostname: 'api.render.com',
    path: `/v1/services/${SERVICE_ID}/deploys/${DEPLOY_ID}`,
    headers: {
      'Authorization': 'Bearer ' + API_KEY,
      'Accept': 'application/json'
    }
  }, res => {
    let chunks = '';
    res.on('data', c => chunks += c);
    res.on('end', () => {
      try {
        const d = JSON.parse(chunks);
        console.log(`[${new Date().toLocaleTimeString()}] Status: ${d.status}`);
        if (d.status === 'live') {
          console.log('✅ Deploy is LIVE!');
          process.exit(0);
        } else if (d.status === 'build_failed' || d.status === 'update_failed' || d.status === 'deactivated') {
          console.error(`❌ Deploy ended with status: ${d.status}`);
          process.exit(1);
        } else {
          setTimeout(check, 12000);
        }
      } catch (e) {
        console.error('Parse error:', e.message);
        setTimeout(check, 12000);
      }
    });
  }).on('error', err => {
    console.error('Req error:', err.message);
    setTimeout(check, 12000);
  });
}

check();
