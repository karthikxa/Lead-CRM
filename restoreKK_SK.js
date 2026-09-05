const { Client } = require('pg');
async function main(){
  const c=new Client({connectionString:process.env.PG_DATABASE_URL||'postgres://postgres:0d8ff9694687b3817867b2fc95511775@db:5432/default'});
  await c.connect();
  const sch=(await c.query(`SELECT table_schema FROM information_schema.tables WHERE table_schema LIKE 'workspace_%' AND table_name='person' LIMIT 1`)).rows[0].table_schema;
  console.log('schema',sch);
  const toRestore = ['KK DENTAL CLINIC', 'SK Dental Care'];
  for(let name of toRestore){
    // Find person by company name or person name containing?
    // Person name is split, but company name is exact
    const res = await c.query(`SELECT p.id, p."nameFirstName"||' '||p."nameLastName" as pname, c.name as cname, p."deletedAt" FROM "${sch}"."person" p JOIN "${sch}"."company" c ON p."companyId"=c.id WHERE c.name ILIKE $1 AND p."deletedAt" IS NOT NULL`, [`%${name}%`]);
    console.log(`found for ${name}`, res.rows);
    for(let r of res.rows){
      await c.query(`UPDATE "${sch}"."person" SET "deletedAt"=NULL WHERE id=$1`, [r.id]);
      await c.query(`UPDATE "${sch}"."company" SET "deletedAt"=NULL WHERE id=(SELECT "companyId" FROM "${sch}"."person" WHERE id=$1)`, [r.id]);
      console.log(`restored ${r.id} ${name}`);
    }
  }
  const vis = await c.query(`SELECT count(*) FROM "${sch}"."person" WHERE "deletedAt" IS NULL`);
  console.log('visible after', vis.rows[0].count);
  const kk = await c.query(`SELECT p."nameFirstName"||' '||p."nameLastName" as name, c.name as company, p."phonesPrimaryPhoneNumber" FROM "${sch}"."person" p JOIN "${sch}"."company" c ON p."companyId"=c.id WHERE c.name ILIKE '%KK DENTAL%' AND p."deletedAt" IS NULL`);
  console.log('KK visible', kk.rows);
  const sk = await c.query(`SELECT p."nameFirstName"||' '||p."nameLastName" as name, c.name as company FROM "${sch}"."person" p JOIN "${sch}"."company" c ON p."companyId"=c.id WHERE c.name ILIKE '%SK Dental%' AND p."deletedAt" IS NULL`);
  console.log('SK visible', sk.rows);
  await c.end();
}
main().catch(e=>console.error(e));
