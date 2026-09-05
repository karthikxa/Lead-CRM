const { Daytona } = require('@daytona/sdk');

async function fixEverything() {
  const d = new Daytona({ apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef', serverUrl: 'https://app.daytona.io/api' });
  const sb = await d.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  console.log('=== 1. FIX AUTH & INVITE REGISTRATION ===');
  // Look at auth.service.js where validatePassword / checkCredentials / signup happens
  // We will patch auth.service.js so if an invited user doesn't have a passwordHash yet, or signs in via password on an invite, it sets/generates their password hash or authenticates them smoothly instead of throwing "User was not created with email/password"
  
  const authServicePath = '/app/packages/twenty-server/dist/engine/core-modules/auth/services/auth.service.js';
  
  // Inspect lines 150 to 220 of auth.service.js
  const authLines = await sb.process.executeCommand(`
    docker exec zed-server-1 sed -n '150,220p' ${authServicePath}
  `);
  console.log('Auth service snippet:\n', authLines.result);

  // Also check signInUpService
  const signInUpPath = '/app/packages/twenty-server/dist/engine/core-modules/auth/services/sign-in-up.service.js';
  const signInUpLines = await sb.process.executeCommand(`
    docker exec zed-server-1 grep -n "passwordHash\\|invite\\|newUser\\|existingUser" ${signInUpPath} | head -30
  `);
  console.log('SignInUp grep:\n', signInUpLines.result);
}

fixEverything().catch(console.error);
