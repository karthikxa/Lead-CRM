const { Client } = require('pg');
const poolerUrl = 'postgresql://neondb_owner:npg_PXCV2dizfS1b@ep-plain-sea-ae01gxmg-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

async function main() {
  const c = new Client({ connectionString: poolerUrl });
  await c.connect();
  const ws = await c.query('SELECT * FROM core.workspace');
  console.log('Workspaces in Neon:', ws.rows);
  const users = await c.query('SELECT id, email, "isEmailVerified" FROM core.user');
  console.log('Users in Neon:', users.rows);
  const uws = await c.query('SELECT id, "workspaceId", "userId" FROM core."userWorkspace"');
  console.log('UserWorkspaces in Neon:', uws.rows);
  const wm = await c.query('SELECT table_schema FROM information_schema.tables WHERE table_name = \'person\'');
  console.log('Schemas with person table:', wm.rows);
  for (const row of wm.rows) {
    const pCount = await c.query(`SELECT count(*) FROM ${row.table_schema}."person"`);
    console.log(`Person count in ${row.table_schema}:`, pCount.rows[0].count);
  }
  await c.end();
}
main();
