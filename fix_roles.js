const { Client } = require('pg');

async function fixRoles() {
  const client = new Client({
    connectionString: 'postgresql://postgres:0d8ff9694687b3817867b2fc95511775@db:5432/default'
  });
  
  await client.connect();
  
  console.log('--- Ensuring all userWorkspaces have Admin role ---');
  
  // 1. Get the admin role ID for workspace
  const adminRoleRes = await client.query(`SELECT id, "workspaceId" FROM core.role WHERE label = 'Admin' LIMIT 1`);
  if (adminRoleRes.rows.length === 0) {
    console.error('No admin role found!');
    await client.end();
    return;
  }
  const adminRole = adminRoleRes.rows[0];
  console.log('Admin Role:', adminRole);

  // 2. Get all userWorkspaces
  const userWorkspacesRes = await client.query(`SELECT id, "workspaceId", "userId" FROM core."userWorkspace"`);
  
  for (const uw of userWorkspacesRes.rows) {
    // Check if roleTarget exists
    const targetRes = await client.query(`SELECT id FROM core."roleTarget" WHERE "userWorkspaceId" = $1`, [uw.id]);
    // Get existing applicationId
    const appRes = await client.query(`SELECT "applicationId" FROM core."roleTarget" WHERE "applicationId" IS NOT NULL LIMIT 1`);
    const appId = appRes.rows[0]?.applicationId || '41d1b956-28c2-4d14-9188-b7d401aacef5';

    if (targetRes.rows.length === 0) {
      const crypto = require('crypto');
      const newId = crypto.randomUUID();
      const universalId = crypto.randomUUID();
      await client.query(`
        INSERT INTO core."roleTarget" (id, "workspaceId", "roleId", "userWorkspaceId", "createdAt", "updatedAt", "universalIdentifier", "applicationId")
        VALUES ($1, $2, $3, $4, NOW(), NOW(), $5, $6)
      `, [newId, uw.workspaceId, adminRole.id, uw.id, universalId, appId]);
      console.log(`Assigned Admin role to userWorkspace ${uw.id}`);
    } else {
      console.log(`userWorkspace ${uw.id} already has roleTarget`);
    }
  }

  // 3. Verify
  const allTargets = await client.query(`SELECT * FROM core."roleTarget"`);
  console.table(allTargets.rows);

  await client.end();
}

fixRoles().catch(console.error);
