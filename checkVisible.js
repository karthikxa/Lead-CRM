const { Client } = require('pg');
async function main(){
  const url = process.env.PG_DATABASE_URL || 'postgres://postgres:0d8ff9694687b3817867b2fc95511775@db:5432/default';
  const c = new Client({ connectionString: url });
  await c.connect();
  const sch = (await c.query(`SELECT table_schema FROM information_schema.tables WHERE table_schema LIKE 'workspace_%' AND table_name='person' LIMIT 1`)).rows[0].table_schema;
  const vis = await c.query(`SELECT "leadStatus", count(*) FROM "${sch}"."person" WHERE "deletedAt" IS NULL GROUP BY "leadStatus"`);
  console.log('visible by status', vis.rows);
  const arch = await c.query(`SELECT "leadStatus", count(*) FROM "${sch}"."person" WHERE "deletedAt" IS NOT NULL GROUP BY "leadStatus"`);
  console.log('archived by status', arch.rows);
  const recent = await c.query(`SELECT "nameFirstName"||' '||"nameLastName" as name, "leadStatus", "deletedAt", "createdAt" FROM "${sch}"."person" ORDER BY "createdAt" DESC LIMIT 10`);
  console.log('recent 10', recent.rows);
  await c.end();
}
main();
