const { Client } = require('pg');
async function main(){
  const url = process.env.PG_DATABASE_URL || 'postgres://postgres:0d8ff9694687b3817867b2fc95511775@db:5432/default';
  const c = new Client({ connectionString: url });
  await c.connect();
  const sch = (await c.query(`SELECT table_schema FROM information_schema.tables WHERE table_schema LIKE 'workspace_%' AND table_name='person' LIMIT 1`)).rows[0].table_schema;
  console.log('schema', sch);
  const before = await c.query(`SELECT count(*) as total, count(*) FILTER (WHERE "deletedAt" IS NOT NULL) as archived FROM "${sch}"."person"`);
  console.log('before', before.rows[0]);
  const rejArch = await c.query(`SELECT count(*) FROM "${sch}"."person" WHERE "leadStatus"='Rejected' AND "deletedAt" IS NOT NULL`);
  console.log('rejected archived', rejArch.rows[0].count);
  const rejVis = await c.query(`SELECT count(*) FROM "${sch}"."person" WHERE "leadStatus"='Rejected' AND "deletedAt" IS NULL`);
  console.log('rejected visible', rejVis.rows[0].count);
  if (parseInt(rejArch.rows[0].count,10) > 0) {
    const upd = await c.query(`UPDATE "${sch}"."person" SET "deletedAt"=NULL WHERE "leadStatus"='Rejected' AND "deletedAt" IS NOT NULL`);
    console.log('restored', upd.rowCount);
  }
  const after = await c.query(`SELECT count(*) FROM "${sch}"."person" WHERE "deletedAt" IS NULL`);
  console.log('after visible total', after.rows[0].count);
  await c.end();
}
main().catch(e=>{console.error(e); process.exit(1);});
