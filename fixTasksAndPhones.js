const { Client } = require('pg');
async function main(){
  const c=new Client({connectionString:process.env.PG_DATABASE_URL||'postgres://postgres:0d8ff9694687b3817867b2fc95511775@db:5432/default'});
  await c.connect();
  const sch=(await c.query(`SELECT table_schema FROM information_schema.tables WHERE table_schema LIKE 'workspace_%' AND table_name='task' LIMIT 1`)).rows[0].table_schema;
  console.log('schema',sch);
  // Fix task status TODO -> Not Attended / Follow Up
  const upd1=await c.query(`UPDATE "${sch}"."task" SET status='Not Attended' WHERE status='TODO' AND title LIKE 'Follow Up: Not Attended%' AND "deletedAt" IS NULL`);
  console.log('updated Not Attended tasks',upd1.rowCount);
  const upd2=await c.query(`UPDATE "${sch}"."task" SET status='Follow Up' WHERE status='TODO' AND "deletedAt" IS NULL`);
  console.log('updated Follow Up tasks (remaining TODO)',upd2.rowCount);
  const upd3=await c.query(`UPDATE "${sch}"."task" SET status='Follow Up' WHERE status IS NULL AND "deletedAt" IS NULL`);
  console.log('updated null status to Follow Up',upd3.rowCount);
  const cnt=await c.query(`SELECT status, count(*) FROM "${sch}"."task" WHERE "deletedAt" IS NULL GROUP BY status`);
  console.log('task status counts after',cnt.rows);

  // Filter out leads without number: soft delete persons where phone is null/empty
  const schP=sch;
  const before=await c.query(`SELECT count(*) FROM "${schP}"."person" WHERE "deletedAt" IS NULL`);
  console.log('person visible before phone filter',before.rows[0].count);
  const noPhone=await c.query(`SELECT id, "nameFirstName", "phonesPrimaryPhoneNumber" FROM "${schP}"."person" WHERE ("phonesPrimaryPhoneNumber" IS NULL OR "phonesPrimaryPhoneNumber"='') AND "deletedAt" IS NULL`);
  console.log('persons without phone',noPhone.rows.length, noPhone.rows.slice(0,3).map(r=>r.nameFirstName));
  const del=await c.query(`UPDATE "${schP}"."person" SET "deletedAt"=NOW() WHERE ("phonesPrimaryPhoneNumber" IS NULL OR "phonesPrimaryPhoneNumber"='') AND "deletedAt" IS NULL`);
  console.log('soft deleted without phone',del.rowCount);
  const after=await c.query(`SELECT count(*) FROM "${schP}"."person" WHERE "deletedAt" IS NULL`);
  console.log('person visible after phone filter',after.rows[0].count);
  // Also filter leads in scraper: we will update lead_scraper_service to not include, but for now just hide
  // Also hide tasks where assignee's person has no phone? Not needed
  await c.end();
}
main().catch(e=>{console.error(e); process.exit(1);});
