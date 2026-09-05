const { Client } = require('pg');
async function main(){
  const c=new Client({connectionString:process.env.PG_DATABASE_URL||'postgres://postgres:0d8ff9694687b3817867b2fc95511775@db:5432/default'});
  await c.connect();
  const sch=(await c.query(`SELECT table_schema FROM information_schema.tables WHERE table_schema LIKE 'workspace_%' AND table_name='task' LIMIT 1`)).rows[0].table_schema;
  console.log('schema',sch);
  const r=await c.query(`SELECT status, count(*) FROM "${sch}"."task" WHERE "deletedAt" IS NULL GROUP BY status`);
  console.log('task status counts',r.rows);
  const r2=await c.query(`SELECT id, title, status, "dueAt", "assigneeId" FROM "${sch}"."task" WHERE "deletedAt" IS NULL LIMIT 5`);
  console.log('sample tasks', JSON.stringify(r2.rows,null,2));
  const view=await c.query(`SELECT id, name FROM "${sch}"."viewField" WHERE "viewId" IN (SELECT id FROM "${sch}"."view" WHERE "objectMetadataId"=(SELECT id FROM "${sch}"."objectMetadata" WHERE namePlural='tasks')) AND fieldMetadataId IN (SELECT id FROM "${sch}"."fieldMetadata" WHERE name='status')`);
  console.log('viewField status',view.rows);
  const fields=await c.query(`SELECT name, label, type FROM "${sch}"."fieldMetadata" WHERE "objectMetadataId"=(SELECT id FROM "${sch}"."objectMetadata" WHERE namePlural='tasks') AND name='status'`);
  console.log('fieldMetadata status',fields.rows);
  await c.end();
}
main().catch(e=>console.error(e));
