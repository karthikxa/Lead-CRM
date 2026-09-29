const { Client } = require('pg');
async function main(){
  const c=new Client({connectionString:process.env.PG_DATABASE_URL||'postgres://postgres:0d8ff9694687b3817867b2fc95511775@db:5432/default'});
  await c.connect();
  const r=await c.query(`SELECT email, "isEmailVerified" FROM "core"."user" LIMIT 3`);
  console.log(JSON.stringify(r.rows,null,2));
  try {
    const r2=await c.query(`SELECT tablename FROM pg_tables WHERE schemaname='core' AND tablename LIKE '%account%'`);
    console.log('account tables', r2.rows);
    const r2b=await c.query(`SELECT * FROM core."connectedAccount" LIMIT 2`);
    console.log('connectedAccount', JSON.stringify(r2b.rows,null,2).substring(0,800));
  } catch(e){ console.log('connectedAccount err', e.message); }
  try {
    const r3=await c.query(`SELECT column_name FROM information_schema.columns WHERE table_schema='core' AND table_name='user'`);
    console.log('user cols', r3.rows.map(x=>x.column_name).join(', '));
  } catch(e){}
  await c.end();
}
main();
