const {Client}=require('pg');
(async()=>{
  const c=new Client({connectionString:process.env.PG_DATABASE_URL});
  await c.connect();
  const sch=(await c.query(`SELECT table_schema FROM information_schema.tables WHERE table_schema LIKE 'workspace_%' AND table_name='company' LIMIT 1`)).rows[0].table_schema;
  console.log('schema',sch);
  const r=await c.query(`SELECT name, "domainNamePrimaryLinkUrl", "addressAddressStreet1", "addressAddressCity" FROM "${sch}"."company" WHERE "deletedAt" IS NULL ORDER BY "createdAt" LIMIT 5`);
  console.log(JSON.stringify(r.rows,null,2));
  const p=await c.query(`SELECT "nameFirstName", "nameLastName", "phonesPrimaryPhoneNumber", "emailsPrimaryEmail", "jobTitle", "companyId" , "leadStatus", "assignedToId", "assignedById", "dueDate" FROM "${sch}"."person" WHERE "deletedAt" IS NULL LIMIT 5`);
  console.log(JSON.stringify(p.rows,null,2));
  await c.end();
})();
