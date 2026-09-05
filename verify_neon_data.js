const { Client } = require('pg');

const NEON_URL = 'postgresql://neondb_owner:npg_PXCV2dizfS1b@ep-plain-sea-ae01gxmg.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

async function verify() {
  const client = new Client({ connectionString: NEON_URL });
  await client.connect();

  console.log('--- Workspace Data Verification ---');
  const people = await client.query('SELECT count(*) FROM workspace_65o9zffpf55hx6qsi6rnblk5p.person WHERE "deletedAt" IS NULL');
  console.log('Active People:', people.rows[0].count);

  const companies = await client.query('SELECT count(*) FROM workspace_65o9zffpf55hx6qsi6rnblk5p.company WHERE "deletedAt" IS NULL');
  console.log('Active Companies:', companies.rows[0].count);

  const roles = await client.query('SELECT id, label FROM core.role');
  console.log('Roles:', roles.rows);

  const users = await client.query('SELECT id, "firstName", "lastName", "isEmailVerified" FROM core."user"');
  console.log('Users:', users.rows);

  const views = await client.query('SELECT count(*) FROM core.view');
  console.log('Core views:', views.rows[0].count);

  const fields = await client.query('SELECT count(*) FROM core."fieldMetadata"');
  console.log('Field metadata count:', fields.rows[0].count);

  await client.end();
}

verify().catch(console.error);
