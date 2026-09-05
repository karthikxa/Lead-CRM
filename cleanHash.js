const { Client } = require('pg');
async function main(){
  const c = new Client({ connectionString: process.env.PG_DATABASE_URL || 'postgres://postgres:0d8ff9694687b3817867b2fc95511775@db:5432/default' });
  await c.connect();
  const sch = (await c.query(`SELECT table_schema FROM information_schema.tables WHERE table_schema LIKE 'workspace_%' AND table_name='person' LIMIT 1`)).rows[0].table_schema;
  console.log('schema', sch);
  // Count before
  const beforeP = await c.query(`SELECT count(*) FROM "${sch}"."person" WHERE "nameLastName" LIKE '%#mtlktb%' OR "nameFirstName" LIKE '%#mtlktb%'`);
  console.log('person with # before', beforeP.rows[0].count);
  const beforeC = await c.query(`SELECT count(*) FROM "${sch}"."company" WHERE name LIKE '%#mtlktb%'`);
  console.log('company with # before', beforeC.rows[0].count);
  // Update company names
  const updC = await c.query(`UPDATE "${sch}"."company" SET name = regexp_replace(name, ' #mtlktb[0-9a-z]+$', '') WHERE name LIKE '%#mtlktb%'`);
  console.log('company cleaned', updC.rowCount);
  // Update person lastName
  const updP = await c.query(`UPDATE "${sch}"."person" SET "nameLastName" = regexp_replace("nameLastName", ' #mtlktb[0-9a-z]+$', '') WHERE "nameLastName" LIKE '%#mtlktb%'`);
  console.log('person lastName cleaned', updP.rowCount);
  const updF = await c.query(`UPDATE "${sch}"."person" SET "nameFirstName" = regexp_replace("nameFirstName", ' #mtlktb[0-9a-z]+$', '') WHERE "nameFirstName" LIKE '%#mtlktb%'`);
  console.log('person firstName cleaned', updF.rowCount);
  // Verify
  const afterP = await c.query(`SELECT count(*) FROM "${sch}"."person" WHERE "nameLastName" LIKE '%#mtlktb%' OR "nameFirstName" LIKE '%#mtlktb%'`);
  console.log('person with # after', afterP.rows[0].count);
  const afterC = await c.query(`SELECT count(*) FROM "${sch}"."company" WHERE name LIKE '%#mtlktb%'`);
  console.log('company with # after', afterC.rows[0].count);
  const sample = await c.query(`SELECT "nameFirstName"||' '||"nameLastName" as name, c.name as company FROM "${sch}"."person" p JOIN "${sch}"."company" c ON p."companyId"=c.id WHERE p."deletedAt" IS NULL ORDER BY p."createdAt" DESC LIMIT 5`);
  console.log('sample after', JSON.stringify(sample.rows, null,2));
  await c.end();
}
main().catch(e=>console.error(e));
