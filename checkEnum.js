const { Client } = require('pg');
async function main(){
  const c=new Client({connectionString:process.env.PG_DATABASE_URL||'postgres://postgres:0d8ff9694687b3817867b2fc95511775@db:5432/default'});
  await c.connect();
  const r=await c.query(`SELECT t.typname, e.enumlabel FROM pg_type t JOIN pg_enum e ON t.oid=e.enumtypid WHERE t.typname LIKE '%task_status%' ORDER BY e.enumsortorder`);
  console.log('enums',r.rows);
  // Also check column type
  const col=await c.query(`SELECT column_name, udt_name FROM information_schema.columns WHERE table_schema=(SELECT table_schema FROM information_schema.tables WHERE table_name='task' AND table_schema LIKE 'workspace_%' LIMIT 1) AND table_name='task' AND column_name='status'`);
  console.log('col type',col.rows);
  await c.end();
}
main().catch(e=>console.error(e));
