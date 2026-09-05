const { Client } = require('pg');
async function main(){
  const c = new Client({ connectionString: process.env.PG_DATABASE_URL || 'postgres://postgres:0d8ff9694687b3817867b2fc95511775@db:5432/default' });
  await c.connect();
  const sch = (await c.query(`SELECT table_schema FROM information_schema.tables WHERE table_schema LIKE 'workspace_%' AND table_name='person' LIMIT 1`)).rows[0].table_schema;
  const res = await c.query(`SELECT id, "nameFirstName"||' '||"nameLastName" as name, "leadStatus", "deletedAt", "createdAt" FROM "${sch}"."person" WHERE "deletedAt" IS NOT NULL AND "createdAt" > '2026-09-03 16:00:00' ORDER BY "createdAt" DESC LIMIT 20`);
  console.log('recent archived', res.rows.map(r=> `${r.name} ${r.leadStatus} ${r.deletedAt} ${r.createdAt}`).join('\n'));
  const cnt = await c.query(`SELECT count(*) FROM "${sch}"."person" WHERE "deletedAt" IS NOT NULL AND "createdAt" > '2026-09-03 16:00:00'`);
  console.log('recent archived count', cnt.rows[0].count);
  const upd = await c.query(`UPDATE "${sch}"."person" SET "deletedAt"=NULL WHERE "deletedAt" IS NOT NULL AND "createdAt" > '2026-09-03 16:00:00'`);
  console.log('restored recent', upd.rowCount);
  const vis = await c.query(`SELECT count(*) FROM "${sch}"."person" WHERE "deletedAt" IS NULL`);
  console.log('visible after', vis.rows[0].count);
  await c.end();
}
main();
