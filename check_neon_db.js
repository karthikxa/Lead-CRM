const { Client } = require('pg');

const neonUrl = 'postgresql://neondb_owner:npg_PXCV2dizfS1b@ep-plain-sea-ae01gxmg.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

async function checkNeon() {
  const client = new Client({ connectionString: neonUrl });
  try {
    await client.connect();
    console.log('Connected to Neon successfully!');
    
    // Check schemas
    const schemas = await client.query(`SELECT schema_name FROM information_schema.schemata;`);
    console.log('Schemas:', schemas.rows.map(r => r.schema_name));

    // Check tables in core or public
    const tables = await client.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema IN ('core', 'public', 'metadata')
      ORDER BY table_schema, table_name;
    `);
    console.log(`Tables count: ${tables.rows.length}`);
    tables.rows.slice(0, 20).forEach(t => console.log(` - ${t.table_schema}.${t.table_name}`));
    if (tables.rows.length > 20) {
      console.log(` ... and ${tables.rows.length - 20} more`);
    }

    // Check migrations table
    const migs = await client.query(`
      SELECT to_regclass('core.typeorm_metadata') as t_meta,
             to_regclass('core.migrations') as c_mig,
             to_regclass('public.migrations') as p_mig;
    `);
    console.log('Migrations tables:', migs.rows[0]);

  } catch (err) {
    console.error('Neon check error:', err.message);
  } finally {
    await client.end();
  }
}

checkNeon();
