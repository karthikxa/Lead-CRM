const { Client } = require('pg');

const directUrl = 'postgresql://neondb_owner:npg_PXCV2dizfS1b@ep-plain-sea-ae01gxmg.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

async function testDirect() {
  console.log('Connecting to DIRECT URL...');
  const client = new Client({ connectionString: directUrl });
  try {
    await client.connect();
    console.log('Connected to direct!');
    const res = await client.query('SELECT 1 as num');
    console.log('Query result:', res.rows);
    await client.end();
    console.log('Direct test success!');
  } catch (err) {
    console.error('Direct test failed:', err);
  }
}

testDirect();
