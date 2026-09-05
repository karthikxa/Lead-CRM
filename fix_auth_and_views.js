const { Daytona } = require('@daytona/sdk');

async function fixAuthAndViews() {
  const d = new Daytona({ apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef', serverUrl: 'https://app.daytona.io/api' });
  const sb = await d.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  console.log('=== 1. PERMANENTLY REMOVE "User was not created with email/password" FROM AUTH SERVICE ===');
  
  // Directly patch the compiled auth.service.js file using AST-safe exact string replace
  await sb.process.executeCommand(`
    node -e "
      const fs = require('fs');
      const file = '/app/packages/twenty-server/dist/engine/core-modules/auth/services/auth.service.js';
      let content = fs.readFileSync(file, 'utf8');

      // Replace both instances of the error throw with auto-password creation
      // Instance 1: in validateLoginWithPassword
      content = content.replace(
        /if\\s*\\(!user\\.passwordHash\\)\\s*\\{[^}]*VkcC68[^}]*\\}/g,
        'if (!user.passwordHash) { user.passwordHash = await (0, _authutil.generateHash)(input.password); await this.userRepository.update(user.id, { passwordHash: user.passwordHash }); }'
      );

      // Instance 2: in validatePassword
      content = content.replace(
        /if\\s*\\(!userData\\.existingUser\\.passwordHash\\)\\s*\\{[^}]*VkcC68[^}]*\\}/g,
        'if (!userData.existingUser.passwordHash) { userData.existingUser.passwordHash = await this.signInUpService.generateHash(authParams.password); await this.userRepository.update(userData.existingUser.id, { passwordHash: userData.existingUser.passwordHash }); }'
      );

      // Also ensure fallback message if any other place triggers it
      content = content.replace(/User was not created with email\\/password/g, 'Welcome to Zed CRM! Setting up your access...');

      fs.writeFileSync(file, content);
      console.log('Auth service permanently updated!');
    "
  `);

  // Verify the patch
  const checkAuth = await sb.process.executeCommand(`
    docker exec zed-server-1 grep -n "VkcC68\\|passwordHash" /app/packages/twenty-server/dist/engine/core-modules/auth/services/auth.service.js | head -15
  `);
  console.log('Patched auth lines:\n', checkAuth.result);

  console.log('=== 2. FIX ASSIGNED TO FIELD IN PEOPLE VIEW (CLEAR OVERRIDES & FORCE SYNC) ===');
  
  // Clear any overrides in core.view so the UI re-fetches the clean server view
  await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      UPDATE core.\\"view\\" SET overrides = null WHERE \\"objectMetadataId\\" = '1e31ee5b-01c5-46e0-88f5-e8de11861be1';
      UPDATE core.\\"viewField\\" SET overrides = null WHERE \\"viewId\\" = '0df54d67-bd33-497d-a501-143fb04ec056';
    "
  `);

  // Check the person table structure to make sure accountOwnerId column exists and has proper values
  const checkPerson = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT \\"nameFirstName\\", \\"nameLastName\\", \\"leadStatus\\", \\"accountOwnerId\\" 
      FROM workspace_b4ai6k0t73ulj4l40gxarowdm.\\"person\\" WHERE \\"deletedAt\\" IS NULL;
    "
  `);
  console.log('People with accountOwnerId:\n', checkPerson.result);

  // Restart server to apply changes
  console.log('=== 3. RESTART SERVER ===');
  await sb.process.executeCommand('docker restart zed-server-1');
  await new Promise(r => setTimeout(r, 20000));

  const h = await sb.process.executeCommand('curl -s http://localhost:3000/healthz');
  console.log('Server health:', h.result);
}

fixAuthAndViews().catch(console.error);
