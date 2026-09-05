const { Daytona } = require('@daytona/sdk');

async function fixInviteAuthAndKarthik() {
  const d = new Daytona({ apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef', serverUrl: 'https://app.daytona.io/api' });
  const sb = await d.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  // 1. Read the section causing "User was not created with email/password"
  const authServiceGrep = await sb.process.executeCommand(`
    docker exec zed-server-1 grep -n "User was not created with email/password\\|passwordHash\\|AUTH_PASSWORD\\|google.*redirect\\|signInWithGoogle" \
      /app/packages/twenty-server/dist/engine/core-modules/auth/services/auth.service.js | head -30
  `);
  console.log('Auth service error lines:\n', authServiceGrep.result);

  // 2. Get line numbers to read context
  const lineNums = await sb.process.executeCommand(`
    docker exec zed-server-1 grep -n "User was not created" \
      /app/packages/twenty-server/dist/engine/core-modules/auth/services/auth.service.js
  `);
  console.log('Error line numbers:\n', lineNums.result);
}

fixInviteAuthAndKarthik().catch(console.error);
