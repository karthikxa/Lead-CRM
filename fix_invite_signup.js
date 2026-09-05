const { Daytona } = require('@daytona/sdk');

async function fixInviteSignup() {
  const d = new Daytona({ apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef', serverUrl: 'https://app.daytona.io/api' });
  const sb = await d.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  // 1. Check what auth modes are enabled
  const authConfig = await sb.process.executeCommand(`
    docker exec zed-server-1 grep -r "AUTH_GOOGLE\\|AUTH_PASSWORD\\|IS_SIGN_UP_DISABLED\\|PASSWORD_AUTH" \
      /app/packages/twenty-server/dist/engine/core-modules/auth/ 2>/dev/null | grep -v ".map:" | head -20
  `);
  console.log('Auth config references:\n', authConfig.result);

  // 2. Find sign-in-up related frontend asset to see how invite flow works
  const signInUpGrep = await sb.process.executeCommand(`
    docker exec zed-server-1 grep -l "join-workspace\\|inviteToken\\|SignInUp" /app/packages/twenty-front/dist/assets/*.js 2>/dev/null | head -3
  `);
  console.log('SignInUp assets:\n', signInUpGrep.result);

  // 3. Check the specific "user not created with email/password" error
  const errorGrep = await sb.process.executeCommand(`
    docker exec zed-server-1 grep -r "not.*created.*email\\|email.*password\\|USER_NOT_FOUND\\|sign.*up.*disabled" \
      /app/packages/twenty-server/dist/engine/core-modules/auth/ 2>/dev/null | grep -v ".map:" | head -20
  `);
  console.log('Error references:\n', errorGrep.result);

  // 4. Check the current admin name for "Karthik"
  const userCheck = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "SELECT id, email, \\"firstName\\", \\"lastName\\" FROM core.\\"user\\";"
  `);
  console.log('Current users:\n', userCheck.result);
}

fixInviteSignup().catch(console.error);
