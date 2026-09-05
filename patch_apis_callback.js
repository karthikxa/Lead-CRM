const { Daytona } = require('@daytona/sdk');

async function patchGoogleApisCallback() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');
  
  console.log('1. Patching google-apis-auth.controller.js to accept /callback, /redirect, and /get-access-token...');
  await sb.process.executeCommand(`
    docker exec zed-server-1 node -e "
      const fs = require('fs');
      const p = '/app/packages/twenty-server/dist/engine/core-modules/auth/controllers/google-apis-auth.controller.js';
      let c = fs.readFileSync(p, 'utf8');
      c = c.replace(/\\(0, _common\\.Get\\)\\('get-access-token'\\)/g, \\"(0, _common.Get)(['get-access-token', 'callback', 'redirect'])\\");
      fs.writeFileSync(p, c, 'utf8');
      console.log('google-apis-auth.controller.js patched successfully!');
    "
  `);

  console.log('2. Updating branding/patch-branding.sh in repository...');
  await sb.process.executeCommand(`
    cd /home/daytona/Lead-CRM
    sed -i "s#'modules/connected-account/oauth2-client/controllers/google-apis.controller.js'#'engine/core-modules/auth/controllers/google-apis-auth.controller.js'#g" branding/patch-branding.sh
    sed -i "s#'redirect'#'get-access-token'#g" branding/patch-branding.sh
    docker cp branding/patch-branding.sh zed-server-1:/tmp/patch-branding.sh
    docker exec -u 0 zed-server-1 sh /tmp/patch-branding.sh 2>&1
    docker restart zed-server-1
  `);

  await new Promise(r => setTimeout(r, 15000));
  const health = await sb.process.executeCommand('curl -s -i http://localhost:3000/healthz');
  console.log('Health:\n', health.result);
}

patchGoogleApisCallback().catch(console.error);
