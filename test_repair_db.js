const { Client } = require('pg');
const crypto = require('crypto');

const dbUrl = 'postgresql://neondb_owner:npg_PXCV2dizfS1b@ep-plain-sea-ae01gxmg.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

async function testRepair() {
  console.log('Testing repairDB logic...');
  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    console.log('Connected to DB');

    await client.query('UPDATE core."user" SET "isEmailVerified" = true');
    console.log('User email verified');

    const adminRoleRes = await client.query("SELECT id, \"workspaceId\" FROM core.role WHERE label = 'Admin' LIMIT 1");
    console.log('Admin role:', adminRoleRes.rows);

    const appRes = await client.query('SELECT "applicationId" FROM core."roleTarget" WHERE "applicationId" IS NOT NULL LIMIT 1');
    const appId = appRes.rows[0]?.applicationId || '41d1b956-28c2-4d14-9188-b7d401aacef5';
    console.log('AppId:', appId);

    if (adminRoleRes.rows.length > 0) {
      const adminRole = adminRoleRes.rows[0];
      const uws = await client.query('SELECT id, "workspaceId", "userId" FROM core."userWorkspace"');
      for (const uw of uws.rows) {
        const rt = await client.query('SELECT id FROM core."roleTarget" WHERE "userWorkspaceId" = $1', [uw.id]);
        if (rt.rows.length === 0) {
          await client.query('INSERT INTO core."roleTarget" (id, "workspaceId", "roleId", "userWorkspaceId", "createdAt", "updatedAt", "universalIdentifier", "applicationId") VALUES ($1, $2, $3, $4, NOW(), NOW(), $5, $6)', [crypto.randomUUID(), uw.workspaceId, adminRole.id, uw.id, crypto.randomUUID(), appId]);
          console.log('[Zed] Auto-assigned Admin role to userWorkspace:', uw.id);
        }
      }
    }
    await client.end();
    console.log('[Zed] Database self-healing complete!');
  } catch (err) {
    console.error('[Zed] DB self-healing note:', err);
  }
}

testRepair();
