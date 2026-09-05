const { Client } = require('pg');
async function main(){
  const c=new Client({connectionString:process.env.PG_DATABASE_URL||'postgres://postgres:0d8ff9694687b3817867b2fc95511775@db:5432/default'});
  await c.connect();
  const sch=(await c.query(`SELECT table_schema FROM information_schema.tables WHERE table_schema LIKE 'workspace_%' AND table_name='task' LIMIT 1`)).rows[0].table_schema;
  console.log('schema',sch);
  // Check enum schema
  const enumSch=await c.query(`SELECT n.nspname, t.typname FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE t.typname='task_status_enum'`);
  console.log('enum schema',enumSch.rows);
  // Add missing values
  const toAdd=['New','Not Attended','Follow Up','Booked','Scheduled','Rejected'];
  for(let v of toAdd){
    try {
      await c.query(`ALTER TYPE "${sch}".task_status_enum ADD VALUE '${v}'`);
      console.log('added',v);
    } catch(e){
      console.log('add failed for',v, e.message.substring(0,120));
      // If already exists, try without schema
      try {
        await c.query(`ALTER TYPE task_status_enum ADD VALUE '${v}'`);
        console.log('added without schema',v);
      } catch(e2){ console.log('also failed', e2.message.substring(0,120)); }
    }
  }
  const r=await c.query(`SELECT t.typname, e.enumlabel FROM pg_type t JOIN pg_enum e ON t.oid=e.enumtypid WHERE t.typname='task_status_enum' ORDER BY e.enumsortorder`);
  console.log('enums after',r.rows.map(x=>x.enumlabel));
  await c.end();
}
main().catch(e=>console.error(e));
