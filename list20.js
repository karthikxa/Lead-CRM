const {Client}=require('pg');
(async()=>{
  const c=new Client({connectionString:process.env.PG_DATABASE_URL});
  await c.connect();
  const sch=(await c.query(`SELECT table_schema FROM information_schema.tables WHERE table_schema LIKE 'workspace_%' AND table_name='company' LIMIT 1`)).rows[0].table_schema;
  const q=await c.query(`SELECT p."createdAt", p."nameFirstName", p."nameLastName", p."phonesPrimaryPhoneNumber", p."emailsPrimaryEmail", p."jobTitle", p."leadStatus", c.name as company, c."domainNamePrimaryLinkUrl" as website, c."addressAddressStreet1" as street, c."addressAddressCity" as city, c."addressAddressState" as state, m."nameFirstName"||' '||m."nameLastName" as assignedTo, p."dueDate" FROM "${sch}"."person" p JOIN "${sch}"."company" c ON p."companyId"=c.id LEFT JOIN "${sch}"."workspaceMember" m ON p."assignedToId"=m.id WHERE p."deletedAt" IS NULL ORDER BY p."createdAt" ASC`);
  q.rows.forEach((r,i)=>{
    const name = `${r.nameFirstName} ${r.nameLastName}`.trim();
    console.log(`${i+1}. ${name} | Company: ${r.company} | Job Title: ${r.jobTitle} | Phone: ${r.phonesPrimaryPhoneNumber} | Email: ${r.emailsPrimaryEmail||"— (empty as requested)"} | Website: ${r.website||"— (needs website)"} | Address: ${r.street}, ${r.city}, ${r.state} | Status: ${r.leadStatus} | Assigned To: ${(r.assignedTo||"").trim()||"Balu Nithyapriya"} | Due: ${new Date(r.dueDate).toISOString().split('T')[0]}`);
  });
  await c.end();
})();
