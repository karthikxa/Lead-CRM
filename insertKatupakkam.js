const { Client } = require('pg');
let assignLeadsToMember;
try { assignLeadsToMember = require('/app/packages/twenty-server/dist/lead_scraper_service').assignLeadsToMember; } catch(e){ assignLeadsToMember = require('./lead_scraper_service').assignLeadsToMember; }

async function main(){
  const dbUrl = process.env.PG_DATABASE_URL || 'postgres://postgres:0d8ff9694687b3817867b2fc95511775@db:5432/default';
  const client = new Client({connectionString: dbUrl});
  await client.connect();
  const sch = (await client.query(`SELECT table_schema FROM information_schema.tables WHERE table_schema LIKE 'workspace_%' AND table_name='company' LIMIT 1`)).rows[0].table_schema;
  console.log('schema', sch);
  const mem = await client.query(`SELECT id, "nameFirstName","nameLastName" FROM "${sch}"."workspaceMember" WHERE "deletedAt" IS NULL`);
  console.log('members', mem.rows);
  const balu = mem.rows.find(m=> (m.nameFirstName||'').toLowerCase().includes('balu'));
  const memberId = balu ? balu.id : mem.rows[0].id;
  console.log('using member', memberId, balu ? 'Balu' : 'fallback');

  const before = await client.query(`SELECT count(*) FROM "${sch}"."person" WHERE "deletedAt" IS NULL`);
  console.log('before person', before.rows[0].count);
  await client.end();

  const raw = [
    {name:"KK DENTAL CLINIC", cat:"Dental clinic", phone:"", street:"No:2/385, KGT Complex, Bajanai Koil St, Kattupakkam, Ayyappanthangal 600056", lat:"13.039756", lon:"80.128594", plus:"24QH+WC", rating:"4.2", count:"30"},
    {name:"JK DENTAL CARE", cat:"Dental clinic", phone:"099402 55668", street:"121, 1st St, Jayalakshmi Nagar, Kattupakkam 600056", lat:"13.043211", lon:"80.124281", plus:"24VF+7P", rating:"4.9", count:"221"},
    {name:"Global Dental Care by Dr. R&A", cat:"Dental clinic", phone:"095000 72695", street:"1st Floor, 6, Kamachi Nagar, Poonamallee, Mangadu 600122", lat:"13.037617", lon:"80.112878", plus:"24Q7+25", rating:"5.0", count:"93"},
    {name:"Dr.Revathi's Dental Clinic", cat:"Dental clinic", phone:"097890 17514", street:"Plot No.1, Addison Nagar Main Rd, Ambal Nagar, Mangadu 600122", lat:"13.033782", lon:"80.119924", plus:"24M9+GX", rating:"4.9", count:"53"},
    {name:"Diya's Dental Care", cat:"Dental clinic", phone:"089252 06957", street:"Plot No. 77, 1st Main Rd, Royal Garden, Kattupakkam, Goparasanallur 600056", lat:"13.047815", lon:"80.124985", plus:"24XF+4X", rating:"4.9", count:"65"},
    {name:"SK Dental Care", cat:"Dental clinic", phone:"", street:"Kattupakkam 600056", lat:"13.043157", lon:"80.123125", plus:"24VF+77", rating:"5.0", count:"30"},
    {name:"DentArt Dental", cat:"Dental clinic", phone:"095971 23782", street:"3, PG Ave First St, Senthurpuram, Kattupakkam 600056", lat:"13.038155", lon:"80.12457", plus:"24QF+7R", rating:"5.0", count:"25"},
    {name:"Dr. Nadeem's Dental Care- Multi-speciality Dental Clinic", cat:"Dental clinic", phone:"096772 12050", street:"1/3, Ali Sahib St, Poonamallee 600122", lat:"13.042473", lon:"80.11109", plus:"24R6+XC", rating:"4.9", count:"133"},
    {name:"Arjun Dental Care (Dr. Kanagajothi K)", cat:"Dental clinic", phone:"099404 65244", street:"29, 2nd Cross Rd, Audica Nagar, Kattupakkam 600056", lat:"13.043797", lon:"80.119377", plus:"24V9+GQ", rating:"5.0", count:"36"},
    {name:"Dr. Vel's Multispeciality Dental Care", cat:"Dental clinic", phone:"063740 52710", street:"2, MSS Nagar, Kumananchavadi, Kattuppakkam 600056", lat:"13.044116", lon:"80.115661", plus:"24V8+J7", rating:"5.0", count:"49"},
    {name:"Sri Venkateswara Dental clinic", cat:"Dental clinic", phone:"098406 33183", street:"plot no 37, 3/6, Govindaraj Nagar, Kattupakkam, Ayyappanthangal 600056", lat:"13.040671", lon:"80.12949", plus:"24RH+7Q", rating:"5.0", count:"1"},
    {name:"Santhosh dental clinic Kattuppakkam", cat:"Dental clinic", phone:"098943 10794", street:"Main Rd, Kattupakkam 600056", lat:"13.040586", lon:"80.12821", plus:"24RH+67", rating:"4.9", count:"15"},
    {name:"SMILE GATE DENTAL ALIGNER CENTRE |Best dental clinic | Invisalign | Root canal | Braces | Implant", cat:"Dental clinic", phone:"099402 22781", street:"first floor, 2, Mangadu Rd, Kamachi Nagar, Mangadu 600122", lat:"13.034717", lon:"80.11183", plus:"24M6+VP", rating:"5.0", count:"53"},
    {name:"Zion Dental Clinic", cat:"Dental clinic", phone:"099520 12361", street:"First Floor, No.10, Kamatchi Nagar, Mangadu 600122", lat:"13.036883", lon:"80.113857", plus:"24P7+QG", rating:"4.8", count:"35"},
    {name:"Smile Lounge. Dental Clinic", cat:"Dental clinic", phone:"098842 73430", street:"28, Trunk Rd, MSS Nagar, Kumananchavadi, Kattuppakkam 600056", lat:"13.045231", lon:"80.115195", plus:"24W8+33", rating:"4.9", count:"139"},
  ];

  const leads = raw.map(r=> ({
    name: r.name,
    industry: r.cat,
    phone: r.phone && r.phone !== '—' ? r.phone : '',
    website: '',
    email: '',
    street: r.street,
    city: r.street.includes('Mangadu') ? 'Mangadu' : r.street.includes('Kattupakkam') ? 'Kattupakkam' : 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    postcode: (r.street.match(/600\d{3}/)||[''])[0],
    lat: r.lat ? parseFloat(r.lat) : null,
    lng: r.lon ? parseFloat(r.lon) : null,
    rating: r.rating,
    reviewsCount: parseInt(r.count,10)||0,
    source: 'Gosom Katupakkam',
    jobTitle: 'Chief Dentist'
  }));

  console.log('leads to insert', leads.length, leads[0]);
  const res = await assignLeadsToMember({ leads, memberId, campaignName: 'Katupakkam Dentists Gosom Real - No Website' });
  console.log('assign result', JSON.stringify({assignedCount: res.assignedCount, duplicateCount: res.duplicateCount}, null,2));
  if(res.duplicates && res.duplicates.length) console.log('dups', res.duplicates.slice(0,3));

  const client2 = new Client({connectionString: dbUrl});
  await client2.connect();
  const sch2 = sch;
  const after = await client2.query(`SELECT count(*) FROM "${sch2}"."person" WHERE "deletedAt" IS NULL`);
  console.log('after person', after.rows[0].count);
  const verify = await client2.query(`SELECT p."nameFirstName"||' '||p."nameLastName" as name, c.name as company, p."jobTitle", p."phonesPrimaryPhoneNumber", p."leadStatus", c."addressAddressStreet1" FROM "${sch2}"."person" p JOIN "${sch2}"."company" c ON p."companyId"=c.id WHERE p."deletedAt" IS NULL ORDER BY p."createdAt" DESC LIMIT 5`);
  console.log('last 5 inserted', JSON.stringify(verify.rows, null,2));
  await client2.end();
}
main().catch(e=>{ console.error(e); process.exit(1); });
