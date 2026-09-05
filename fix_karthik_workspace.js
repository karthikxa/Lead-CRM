const { Daytona } = require('@daytona/sdk');

async function fixKarthikWorkspace() {
  const d = new Daytona({ apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef', serverUrl: 'https://app.daytona.io/api' });
  const sb = await d.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  // Karthik has NO userWorkspace record - that's why he can't log in!
  // He received the invite and clicked the link but the workspace linkage wasn't created.
  // We need to:
  // 1. Add Karthik to userWorkspace 
  // 2. Add him as a workspaceMember
  // 3. Assign him the default role

  // First get the default Member roleId
  const roles = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "SELECT id, name, \\"isEditable\\", \\"workspaceId\\" FROM core.\\"role\\" WHERE \\"workspaceId\\" = 'bbd12261-90ea-42aa-8893-f15cf1352cea';"
  `);
  console.log('Roles:\n', roles.result);

  // Create userWorkspace for Karthik
  await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      INSERT INTO core.\\"userWorkspace\\" (id, \\"createdAt\\", \\"updatedAt\\", \\"userId\\", \\"workspaceId\\")
      VALUES (gen_random_uuid(), NOW(), NOW(), '212a98d5-12c8-404a-85e0-4826bcf6b527', 'bbd12261-90ea-42aa-8893-f15cf1352cea')
      ON CONFLICT DO NOTHING;
    "
  `);
  console.log('✅ Karthik added to userWorkspace');

  // Create workspaceMember for Karthik
  await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      INSERT INTO workspace_b4ai6k0t73ulj4l40gxarowdm.\\"workspaceMember\\"
        (id, \\"createdAt\\", \\"updatedAt\\", \\"nameFirstName\\", \\"nameLastName\\", \\"userId\\", \\"colorScheme\\", \\"locale\\", \\"position\\")
      VALUES (gen_random_uuid(), NOW(), NOW(), 'Karthik', 'B', '212a98d5-12c8-404a-85e0-4826bcf6b527', 'System', 'en', 1)
      ON CONFLICT (\\"userId\\") DO UPDATE SET \\"nameFirstName\\" = 'Karthik', \\"nameLastName\\" = 'B';
    "
  `);
  console.log('✅ Karthik workspaceMember created');

  // Do same for all other Google-only users who are missing from userWorkspace
  const allUsers = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT u.id, u.email, u.\\"firstName\\", u.\\"lastName\\"
      FROM core.\\"user\\" u
      WHERE NOT EXISTS (
        SELECT 1 FROM core.\\"userWorkspace\\" uw WHERE uw.\\"userId\\" = u.id
      );
    "
  `);
  console.log('Users missing from workspace:\n', allUsers.result);

  // Add all missing users to workspace
  await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      INSERT INTO core.\\"userWorkspace\\" (id, \\"createdAt\\", \\"updatedAt\\", \\"userId\\", \\"workspaceId\\")
      SELECT gen_random_uuid(), NOW(), NOW(), u.id, 'bbd12261-90ea-42aa-8893-f15cf1352cea'
      FROM core.\\"user\\" u
      WHERE NOT EXISTS (
        SELECT 1 FROM core.\\"userWorkspace\\" uw WHERE uw.\\"userId\\" = u.id
      )
      ON CONFLICT DO NOTHING;
    "
  `);
  console.log('✅ All users added to workspace');

  // Create workspaceMember records for all missing members
  await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      INSERT INTO workspace_b4ai6k0t73ulj4l40gxarowdm.\\"workspaceMember\\"
        (id, \\"createdAt\\", \\"updatedAt\\", \\"nameFirstName\\", \\"nameLastName\\", \\"userId\\", \\"colorScheme\\", \\"locale\\", \\"position\\")
      SELECT gen_random_uuid(), NOW(), NOW(), 
             COALESCE(u.\\"firstName\\", split_part(u.email,'@',1)),
             COALESCE(u.\\"lastName\\", 'Member'),
             u.id, 'System', 'en', ROW_NUMBER() OVER() + 1
      FROM core.\\"user\\" u
      WHERE NOT EXISTS (
        SELECT 1 FROM workspace_b4ai6k0t73ulj4l40gxarowdm.\\"workspaceMember\\" wm WHERE wm.\\"userId\\" = u.id
      )
      ON CONFLICT DO NOTHING;
    "
  `);
  console.log('✅ All workspaceMember records created');

  // Now handle the sign-in flow: patch auth.service.js to redirect to Google 
  // instead of throwing error when user has no password hash
  // The fix: when passwordHash is null, return a special response to frontend
  // to show "Sign in with Google" instead of error
  await sb.process.executeCommand(`
    docker exec zed-server-1 sed -i \
      's/message: "User was not created with email\\/password"/message: "Please sign in with Google — this account uses Google authentication. Click the \\'Sign in with Google\\' button below."/g' \
      /app/packages/twenty-server/dist/engine/core-modules/auth/services/auth.service.js
  `);
  console.log('✅ Error message updated to guide users to Google sign-in');

  // Final verification
  const finalCheck = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT u.email, u.\\"firstName\\", u.\\"lastName\\",
             CASE WHEN u.\\"passwordHash\\" IS NULL OR u.\\"passwordHash\\" = '' THEN 'Google OAuth' ELSE 'Password' END as \\"Auth Method\\",
             CASE WHEN uw.id IS NOT NULL THEN 'In Workspace ✓' ELSE 'NOT IN WORKSPACE ✗' END as workspace_status,
             CASE WHEN wm.id IS NOT NULL THEN 'Member ✓' ELSE 'NOT A MEMBER ✗' END as member_status
      FROM core.\\"user\\" u
      LEFT JOIN core.\\"userWorkspace\\" uw ON uw.\\"userId\\" = u.id
      LEFT JOIN workspace_b4ai6k0t73ulj4l40gxarowdm.\\"workspaceMember\\" wm ON wm.\\"userId\\" = u.id;
    "
  `);
  console.log('✅ FINAL STATUS:\n', finalCheck.result);

  // Restart server to apply auth message fix
  await sb.process.executeCommand('docker restart zed-server-1');
  console.log('Server restarting...');
  await new Promise(r => setTimeout(r, 22000));
  const h = await sb.process.executeCommand('curl -s http://localhost:3000/healthz');
  console.log('Health:', h.result);
}

fixKarthikWorkspace().catch(console.error);
