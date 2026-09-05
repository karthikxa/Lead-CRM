const { Client } = require('pg');

async function inspect() {
  const client = new Client({
    connectionString: 'postgresql://postgres:0d8ff9694687b3817867b2fc95511775@db:5432/default'
  });
  
  await client.connect();
  
  console.log('--- UPDATING USERS isEmailVerified = true ---');
  await client.query('UPDATE core."user" SET "isEmailVerified" = true');
  
  console.log('--- USERS ---');
  let res = await client.query('SELECT id, email, "isEmailVerified" FROM core."user"');
  console.table(res.rows);

  console.log('--- WORKSPACES ---');
  res = await client.query('SELECT id, "displayName", "activationStatus" FROM core."workspace"');
  console.table(res.rows);

  console.log('--- USER WORKSPACES ---');
  res = await client.query('SELECT * FROM core."userWorkspace"');
  console.table(res.rows);

  // Check workspace member table
  const schemas = await client.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'workspace_%'");
  console.log('--- WORKSPACE SCHEMAS ---', schemas.rows);

  console.log('--- CORE ROLES & ROLE TARGETS ---');
  try {
    const roles = await client.query('SELECT * FROM core.role');
    console.table(roles.rows);
    const roleTargets = await client.query('SELECT * FROM core."roleTarget"');
    console.table(roleTargets.rows);
  } catch (e) {
    console.log('Error querying core roles:', e.message);
  }

  for (const s of schemas.rows) {
    const wsMembers = await client.query(`SELECT id, "userId", "nameFirstName", "nameLastName", "userEmail" FROM "${s.schema_name}"."workspaceMember"`);
    console.log(`--- Workspace Members in ${s.schema_name} ---`);
    console.table(wsMembers.rows);
  }

  await client.end();
}

inspect().catch(console.error);
