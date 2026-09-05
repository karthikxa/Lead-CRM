const https = require('https');
const http = require('http');

// Create GitHub repo via API, then push
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const RENDER_API_KEY = 'rnd_l7j8gWyp3mHPGc2lMcHeig3d0MOB';

async function createRepo() {
  // First check if we can create via Render API with inline code
  // Since we can't push to GitHub without token, let's deploy directly via Render API
  // using a static file server approach or create from existing GitHub

  console.log('Creating Render service from scratch using Render API...');

  // Use Render API to create a new web service from GitHub repo
  const payload = JSON.stringify({
    type: 'web_service',
    name: 'zed-email-relay',
    ownerId: 'tea-d04sht1r0fns73cq21h0',
    repo: 'https://github.com/karthikxa/Lead-CRM',
    branch: 'main',
    rootDir: 'email-relay',
    autoDeploy: 'yes',
    serviceDetails: {
      env: 'node',
      envSpecificDetails: {
        buildCommand: 'npm install',
        startCommand: 'node server.js'
      },
      plan: 'free',
      region: 'oregon',
      numInstances: 1,
      healthCheckPath: '/ping',
      envVars: [
        { key: 'SMTP_USER', value: 'zedagencyofficial@gmail.com' },
        { key: 'SMTP_PASS', value: 'oeexdvgdgklbyksu' },
        { key: 'NODE_ENV', value: 'production' }
      ]
    }
  });

  const options = {
    hostname: 'api.render.com',
    path: '/v1/services',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RENDER_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

createRepo().then(r => console.log('Result:', JSON.stringify(r, null, 2))).catch(console.error);
