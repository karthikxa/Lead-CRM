const https = require('https');
const RENDER_API_KEY = 'rnd_l7j8gWyp3mHPGc2lMcHeig3d0MOB';
const SERVICE_ID = 'srv-da9trb942hec738ud22g';

// Get recent logs
async function getLogs() {
  const options = {
    hostname: 'api.render.com',
    path: `/v1/services/${SERVICE_ID}/logs?limit=50`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${RENDER_API_KEY}`,
      'Accept': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    https.get(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve(data); }
      });
    }).on('error', reject);
  });
}

// Also check deploy list to see status
async function getDeploys() {
  const options = {
    hostname: 'api.render.com',
    path: `/v1/services/${SERVICE_ID}/deploys?limit=3`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${RENDER_API_KEY}`,
      'Accept': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    https.get(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve(data); }
      });
    }).on('error', reject);
  });
}

async function main() {
  const deploys = await getDeploys();
  console.log('Recent deploys:');
  deploys.forEach(d => {
    console.log(` - ${d.deploy?.id} | status: ${d.deploy?.status} | commit: ${d.deploy?.commit?.message?.substring(0, 60)}`);
  });
  
  const logs = await getLogs();
  if (Array.isArray(logs)) {
    console.log('\nRecent logs:');
    logs.slice(-20).forEach(l => console.log(l.text || l.message || JSON.stringify(l)));
  } else {
    console.log('\nLogs response:', JSON.stringify(logs, null, 2).substring(0, 1000));
  }
}

main().catch(console.error);
