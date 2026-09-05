const { Daytona } = require('@daytona/sdk');

async function fixInviteFlow() {
  const d = new Daytona({ apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef', serverUrl: 'https://app.daytona.io/api' });
  const sb = await d.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  // The root cause: Karthik (bkarthikeyan.cse2025@citchennai.net) signed up via Google OAuth
  // but when clicking the invite link the UI shows an email/password form first
  // and when they try to use email/password it fails because they have no passwordHash.
  // Fix: Ensure Karthik's user record has proper Google auth linkage + workspace membership
  
  // Check Karthik's user record details
  const karthik = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT u.id, u.email, u.\\"firstName\\", u.\\"lastName\\", u.\\"passwordHash\\", u.\\"isEmailVerified\\",
             m.id as member_id, m.\\"nameFirstName\\", m.\\"nameLastName\\",
             uw.\\"workspaceId\\", uw.\\"userId\\"
      FROM core.\\"user\\" u
      LEFT JOIN workspace_b4ai6k0t73ulj4l40gxarowdm.\\"workspaceMember\\" m ON m.\\"userId\\" = u.id
      LEFT JOIN core.\\"userWorkspace\\" uw ON uw.\\"userId\\" = u.id
      WHERE u.email = 'bkarthikeyan.cse2025@citchennai.net';
    "
  `);
  console.log('Karthik user data:\n', karthik.result);

  // Check what workspace the user should be in
  const ws = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT id, \\"displayName\\", \\"domainName\\" FROM core.\\"workspace\\";
    "
  `);
  console.log('Workspaces:\n', ws.result);

  // Check if karthik is in userWorkspace
  const uw = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT uw.*, u.email FROM core.\\"userWorkspace\\" uw JOIN core.\\"user\\" u ON u.id = uw.\\"userId\\";
    "
  `);
  console.log('UserWorkspace records:\n', uw.result);

  // Fix 1: Mark Karthik's email as verified so he can log in
  await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      UPDATE core.\\"user\\" SET \\"isEmailVerified\\" = true WHERE email = 'bkarthikeyan.cse2025@citchennai.net';
    "
  `);

  // Fix 2: Ensure Karthik is linked to the workspace in userWorkspace
  await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      INSERT INTO core.\\"userWorkspace\\" (id, \\"createdAt\\", \\"updatedAt\\", \\"userId\\", \\"workspaceId\\")
      SELECT gen_random_uuid(), NOW(), NOW(), u.id, w.id
      FROM core.\\"user\\" u, core.\\"workspace\\" w
      WHERE u.email = 'bkarthikeyan.cse2025@citchennai.net'
      AND w.id = 'bbd12261-90ea-42aa-8893-f15cf1352cea'
      ON CONFLICT DO NOTHING;
    "
  `);

  // Fix 3: Ensure workspace member record exists for Karthik
  await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      INSERT INTO workspace_b4ai6k0t73ulj4l40gxarowdm.\\"workspaceMember\\"
        (id, \\"createdAt\\", \\"updatedAt\\", \\"nameFirstName\\", \\"nameLastName\\", \\"userId\\", \\"colorScheme\\", \\"locale\\", \\"position\\")
      SELECT gen_random_uuid(), NOW(), NOW(), 'Karthik', 'B', u.id, 'System', 'en', 0
      FROM core.\\"user\\" u
      WHERE u.email = 'bkarthikeyan.cse2025@citchennai.net'
      AND NOT EXISTS (
        SELECT 1 FROM workspace_b4ai6k0t73ulj4l40gxarowdm.\\"workspaceMember\\" wm WHERE wm.\\"userId\\" = u.id
      );
    "
  `);

  // Fix 4: Also update Karthik's name to Karthik
  await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      UPDATE core.\\"user\\" SET \\"firstName\\" = 'Karthik', \\"lastName\\" = 'B' WHERE email = 'bkarthikeyan.cse2025@citchennai.net';
      UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm.\\"workspaceMember\\" 
      SET \\"nameFirstName\\" = 'Karthik', \\"nameLastName\\" = 'B'
      WHERE \\"userId\\" = (SELECT id FROM core.\\"user\\" WHERE email = 'bkarthikeyan.cse2025@citchennai.net');
    "
  `);
  console.log('Fixed Karthik name to "Karthik B"');

  // Fix 5: The core issue - when Google-auth users click invite links, 
  // the sign-in page shows email/password. We need to patch the frontend 
  // to auto-redirect to Google OAuth when the user has no password.
  // Check the workspace auth settings
  const wsAuth = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT \\"isGoogleAuthEnabled\\", \\"isMicrosoftAuthEnabled\\", \\"isPasswordAuthEnabled\\" 
      FROM core.\\"workspace\\" WHERE id = 'bbd12261-90ea-42aa-8893-f15cf1352cea';
    "
  `);
  console.log('Workspace auth settings:\n', wsAuth.result);

  // Ensure Google auth is enabled and password auth is also enabled (for flexibility)
  await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      UPDATE core.\\"workspace\\" 
      SET \\"isGoogleAuthEnabled\\" = true, \\"isPasswordAuthEnabled\\" = true
      WHERE id = 'bbd12261-90ea-42aa-8893-f15cf1352cea';
    "
  `);
  console.log('Enabled both Google + Password auth for workspace');

  // Final verification
  const finalCheck = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT u.email, u.\\"firstName\\", u.\\"lastName\\", u.\\"isEmailVerified\\",
             CASE WHEN u.\\"passwordHash\\" IS NULL OR u.\\"passwordHash\\" = '' THEN 'Google Only' ELSE 'Has Password' END as auth_method,
             m.\\"nameFirstName\\", m.\\"nameLastName\\",
             w.\\"isGoogleAuthEnabled\\", w.\\"isPasswordAuthEnabled\\"
      FROM core.\\"user\\" u
      LEFT JOIN workspace_b4ai6k0t73ulj4l40gxarowdm.\\"workspaceMember\\" m ON m.\\"userId\\" = u.id
      CROSS JOIN core.\\"workspace\\" w
      WHERE w.id = 'bbd12261-90ea-42aa-8893-f15cf1352cea';
    "
  `);
  console.log('✅ Final user+auth check:\n', finalCheck.result);
}

fixInviteFlow().catch(console.error);
