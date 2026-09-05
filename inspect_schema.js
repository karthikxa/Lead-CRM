const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: process.env.PG_DATABASE_URL || 'postgres://twenty:twenty@db:5432/default'
  });
  await client.connect();

  const cols = await client.query(`
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'workspace_65o9zffpf55hx6qsi6rnblk5p' AND table_name IN ('workspaceMember', 'person', 'company')
    ORDER BY table_name, ordinal_position;
  `);
  
  const byTable = {};
  for (const r of cols.rows) {
    if (!byTable[r.table_name]) byTable[r.table_name] = [];
    byTable[r.table_name].push(`${r.column_name} (${r.data_type})`);
  }
  console.log('Columns by Table:', JSON.stringify(byTable, null, 2));

  const members = await client.query(`SELECT * FROM "workspace_65o9zffpf55hx6qsi6rnblk5p"."workspaceMember";`);
  console.log('Members:', members.rows);

  await client.end();
}

main().catch(console.error);
