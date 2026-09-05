const { Client } = require('pg');

const poolerUrl = 'postgresql://neondb_owner:npg_PXCV2dizfS1b@ep-plain-sea-ae01gxmg-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

async function testPooler() {
  console.log('Connecting to pooler URL...');
  const client = new Client({ connectionString: poolerUrl });
  try {
    await client.connect();
    console.log('Connected to pooler!');
    const res = await client.query('SELECT 1 as num');
    console.log('Query result:', res.rows);
    await client.end();
    console.log('Pooler test success!');
  } catch (err) {
    console.error('Pooler test failed:', err);
  }
}

testPooler();
