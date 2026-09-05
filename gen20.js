const { Client } = require('pg');
try{require('dotenv').config();}catch{}
let assignLeadsToMember;
try{ assignLeadsToMember=require('/app/packages/twenty-server/dist/lead_scraper_service').assignLeadsToMember; }catch(e){ assignLeadsToMember=require('./lead_scraper_service').assignLeadsToMember; }

(async()=>{
  const c=new Client({connectionString:process.env.PG_DATABASE_URL});
  await c.connect();
  const schRes = await c.query(`SELECT table_schema FROM information_schema.tables WHERE table_schema LIKE 'workspace_%' AND table_name='company' LIMIT 1`);
  const sch = schRes.rows[0].table_schema;
  console.log('schema',sch);
  const mem=await c.query(`SELECT id, "nameFirstName","nameLastName","userEmail" FROM "${sch}"."workspaceMember" WHERE "deletedAt" IS NULL LIMIT 5`);
  console.log(JSON.stringify(mem.rows,null,2));
  const memberId = mem.rows[0]?.id;
  if(!memberId){ console.error('no member'); process.exit(1);}
  const cnt=await c.query(`SELECT count(*) FROM "${sch}"."person" WHERE "deletedAt" IS NULL`);
  console.log('person count before',cnt.rows[0].count);
  await c.end();
  // generate 20 leads WITHOUT website
  const leads=[];
  const industries=['Plumber','Dentist','Electrician','Cafe','Gym','Salon','Clinic','Restaurant','Bakery','Pharmacy'];
  for(let i=0;i<20;i++){
    const ind = industries[i%industries.length];
    const prefixes=['Apex','Premier','Elite','Prime','City','Metro','Royal','Nova','Beacon','Summit','Zenith','Vanguard','Global','Direct','Starlight'];
    const suffixes=['Services','Solutions','Group','Center','Hub','Care','Studio','Associates','Clinic','Point'];
    const name = `${prefixes[i%prefixes.length]} ${ind} ${suffixes[Math.floor(i/3)%suffixes.length]}`;
    leads.push({
      name,
      industry: ind,
      phone: `+91 ${9000000000 + Math.floor(Math.random()*99999999)}`,
      website: '', // NO website
      email: '',
      street: `${100+i} MG Road`,
      city: 'Chennai',
      state: 'Tamil Nadu',
      country: 'India',
      postcode: `${6000+ i}28`,
      lat: null,
      lng: null,
      rating: (4.2+Math.random()*0.6).toFixed(1),
      reviewsCount: Math.floor(10+Math.random()*80),
      source: 'Manual'
    });
  }
  console.log('generated',leads.length,'sample',leads[0]);
  const res = await assignLeadsToMember({ leads, memberId, campaignName: 'No-Website Batch 20' });
  console.log(JSON.stringify(res,null,2));

  const c2=new Client({connectionString:process.env.PG_DATABASE_URL});
  await c2.connect();
  const sch2 = sch;
  const cnt2=await c2.query(`SELECT count(*) FROM "${sch2}"."person" WHERE "deletedAt" IS NULL`);
  console.log('person count after',cnt2.rows[0].count);
  const noWeb = await c2.query(`SELECT c.name, c."domainNamePrimaryLinkUrl", p."nameFirstName", p."phonesPrimaryPhoneNumber", c."addressAddressCity" FROM "${sch2}"."company" c JOIN "${sch2}"."person" p ON p."companyId"=c.id WHERE c."deletedAt" IS NULL AND (c."domainNamePrimaryLinkUrl" IS NULL OR c."domainNamePrimaryLinkUrl"='') ORDER BY c."createdAt" DESC LIMIT 25`);
  console.log('last 20 no-website sample', JSON.stringify(noWeb.rows.slice(0,5),null,2));
  console.log('noWebsite in last 25:', noWeb.rows.filter(r=>!r.domainNamePrimaryLinkUrl).length);
  await c2.end();
})();
