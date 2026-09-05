const { Daytona } = require('@daytona/sdk');

async function check() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');
  
  // Test 1: Check auth service for the fixed method
  const authCheck = await sb.process.executeCommand(`docker exec zed-server-1 node -e "
    const fs = require('fs');
    const c = fs.readFileSync('/app/packages/twenty-server/dist/engine/core-modules/auth/services/auth.service.js', 'utf8');
    const idx = c.indexOf('signInUpWithSocialSSO');
    const snippet = c.substring(idx, idx + 200);
    console.log('signInUpWithSocialSSO snippet:', snippet);
    console.log('hasUserAccessToWorkspace present:', c.includes('hasUserAccessToWorkspace('));
    console.log('findUserByEmailWithWorkspaces present:', c.includes('findUserByEmailWithWorkspaces'));
  "`);
  console.log('Auth service check:\n', authCheck.result);

  // Test 2: Check Google OAuth endpoint
  const oauthCheck = await sb.process.executeCommand('curl -s -I http://localhost:3000/auth/google && echo "OAuth OK"');
  console.log('OAuth endpoint check:', oauthCheck.result);
  
  // Test 3: Check server logs for any recent errors
  const logs = await sb.process.executeCommand('docker logs --tail 30 zed-server-1 2>&1 | tail -30');
  console.log('Recent server logs:\n', logs.result);
}

check().catch(console.error);
