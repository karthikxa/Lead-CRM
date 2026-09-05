const { Daytona } = require('@daytona/sdk');

async function deployMockupAndLlmFix() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  console.log('1. Pulling latest git main on Daytona host...');
  await sb.process.executeCommand(`
    cd /home/daytona/Lead-CRM
    git fetch origin main
    git reset --hard origin/main
  `);

  console.log('2. Deploying White Luxury email template with Z logo...');
  const patchRes = await sb.process.executeCommand(`
    cd /home/daytona/Lead-CRM
    docker cp email.service.patched.js zed-server-1:/app/packages/twenty-server/dist/engine/core-modules/email/email.service.js
    docker cp patch_white_luxury.js zed-server-1:/tmp/patch_white_luxury.js
    docker exec zed-server-1 node /tmp/patch_white_luxury.js
  `);
  console.log('Patch result:\n', patchRes.result);

  console.log('3. Updating ai-providers.json with auto routing...');
  const aiRes = await sb.process.executeCommand(`
    docker exec zed-server-1 node -e "
      const fs = require('fs');
      const p = '/app/packages/twenty-server/dist/engine/metadata-modules/ai/ai-models/ai-providers.json';
      if (fs.existsSync(p)) {
        let j = JSON.parse(fs.readFileSync(p, 'utf8'));
        if (j.openai) {
          j.openai.models.forEach(m => m.name = 'auto');
        }
        if (j.zed) {
          j.zed.models.forEach(m => m.name = 'auto');
        }
        fs.writeFileSync(p, JSON.stringify(j, null, 2), 'utf8');
        console.log('ai-providers.json mapped to auto model successfully!');
      }
    "
  `);
  console.log('AI fix result:\n', aiRes.result);

  console.log('4. Restarting zed-server-1...');
  await sb.process.executeCommand('docker restart zed-server-1');
  await new Promise(r => setTimeout(r, 18000));

  const health = await sb.process.executeCommand('curl -s -i http://localhost:3000/healthz');
  console.log('Healthz:\n', health.result);
}

deployMockupAndLlmFix().catch(console.error);
