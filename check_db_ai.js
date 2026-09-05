const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: process.env.PG_DATABASE_URL || 'postgres://twenty:twenty@db:5432/default'
  });
  await client.connect();

  console.log('Connected to DB...');
  const tablesRes = await client.query(`
    SELECT table_schema, table_name 
    FROM information_schema.tables 
    WHERE table_name ILIKE '%ai%' OR table_name ILIKE '%model%' OR table_name ILIKE '%config%'
  `);
  console.log('Relevant tables:', tablesRes.rows);

  const configRes = await client.query(`
    SELECT * FROM core."configVariable" LIMIT 20
  `).catch(e => ({ rows: [] }));
  console.log('Config variables in DB:', configRes.rows);

  await client.end();
}

main().catch(console.error);
