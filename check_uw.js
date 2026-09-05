const { Client } = require('pg');

const NEON_URL = 'postgresql://neondb_owner:npg_PXCV2dizfS1b@ep-plain-sea-ae01gxmg.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

async function checkUW() {
  const client = new Client({ connectionString: NEON_URL });
  await client.connect();

  const uws = await client.query('SELECT * FROM core."userWorkspace"');
  console.log('UserWorkspaces:', uws.rows);

  const rts = await client.query('SELECT * FROM core."roleTarget"');
  console.log('RoleTargets:', rts.rows.length);

  await client.end();
}

checkUW().catch(console.error);
