const { Client } = require('pg');
const crypto = require('crypto');

const NEON_URL = 'postgresql://neondb_owner:npg_PXCV2dizfS1b@ep-plain-sea-ae01gxmg.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

async function seedLeads() {
  const client = new Client({ connectionString: NEON_URL });
  await client.connect();

  const sch = 'workspace_65o9zffpf55hx6qsi6rnblk5p';

  // Find Balu workspace member
  const memRes = await client.query(`SELECT id, "nameFirstName", "nameLastName", "userEmail" FROM "${sch}"."workspaceMember" WHERE "deletedAt" IS NULL ORDER BY "createdAt"`);
  console.log('Members:', memRes.rows);
  const balu = memRes.rows.find(m => (m.userEmail || '').toLowerCase().includes('balu') || (m.nameFirstName || '').toLowerCase().includes('balu'));
  const memberId = balu ? balu.id : memRes.rows[0]?.id;
  console.log('Assigning to memberId:', memberId, balu ? '(Balu)' : '(first member)');

  // Soft-delete existing demo people & companies
  await client.query(`UPDATE "${sch}"."person" SET "deletedAt" = NOW() WHERE "deletedAt" IS NULL`);
  await client.query(`UPDATE "${sch}"."company" SET "deletedAt" = NOW() WHERE "deletedAt" IS NULL`);
  console.log('Cleaned old records.');

  const cityAreas = ['Anna Nagar', 'T Nagar', 'Velachery', 'Adyar', 'Mylapore', 'Nungambakkam', 'Porur', 'Tambaram', 'OMR', 'ECR'];
  const bestNiches = [
    { industry: 'Dental Clinic', titles: ['Chief Dentist', 'Founder', 'Clinic Head'], names: ['Bright Smile', 'Elite Dental', 'City Dental', 'Apex Dental', 'Prime Dental', 'Metro Dental', 'Royal Dental', 'Nexus Dental', 'Smile Studio', 'Pearl Dental'] },
    { industry: 'Salon', titles: ['Owner', 'Founder', 'Stylist Head'], names: ['Style Studio', 'Glamour Salon', 'Elite Cuts', 'Urban Barber', 'Bloom Beauty', 'Aura Salon', 'Mirror Lounge', 'Trendz Studio', 'Luxe Salon', 'Charm Cuts'] },
    { industry: 'Gym & Fitness', titles: ['Owner', 'Founder', 'Head Trainer'], names: ['Power House Gym', 'Elite Fitness', 'Metro Gym', 'Iron Studio', 'Flex Fitness', 'Titan Gym', 'Beast Mode', 'Core Fitness', 'Muscle Hub', 'Fit Zone'] },
    { industry: 'Restaurant', titles: ['Owner', 'Founder', 'Managing Partner'], names: ['Spice Route', 'Bayleaf', 'Coastal Feast', 'Curry House', 'Tandoor Flame', 'Madras Bites', 'Namma Kitchen', 'Chennai Chettinad', 'Sea Salt', 'Grill House'] },
  ];

  const dueDate = '2026-09-08';

  for (let i = 0; i < 20; i++) {
    const niche = bestNiches[i % bestNiches.length];
    const baseName = niche.names[Math.floor(i / bestNiches.length) % niche.names.length];
    const area = cityAreas[i % cityAreas.length];
    const companyName = `${baseName} - ${area}`;
    const jobTitle = niche.titles[i % niche.titles.length];
    const phone = `+91 ${9000000000 + Math.floor(Math.random() * 89999999)}`;
    const street = `${100 + i * 7} ${area} Main Road, ${area}`;
    const companyId = crypto.randomUUID();
    const personId = crypto.randomUUID();
    const position = i * 1000;

    // Insert Company (website NULL -> need website)
    await client.query(`
      INSERT INTO "${sch}"."company" (
        id, name, "domainNamePrimaryLinkLabel", "domainNamePrimaryLinkUrl",
        "addressAddressStreet1", "addressAddressCity", "addressAddressState", "addressAddressCountry",
        position, "accountOwnerId", "dueDate", "assignedById", "jobTitle", "createdAt", "updatedAt"
      ) VALUES ($1, $2, NULL, NULL, $3, 'Chennai', 'Tamil Nadu', 'India', $4, $5, $6, $7, $8, NOW(), NOW())
    `, [companyId, companyName, street, position, memberId, dueDate, memberId, jobTitle]);

    // Insert Person (firstName = Company name or Dr./Mr. base, emails NULL, website NULL, phone ok)
    await client.query(`
      INSERT INTO "${sch}"."person" (
        id, "nameFirstName", "nameLastName", "emailsPrimaryEmail", "phonesPrimaryPhoneNumber",
        "phonesPrimaryPhoneCountryCode", "phonesPrimaryPhoneCallingCode",
        "jobTitle", "companyId", "assignedToId", "assignedById", "leadStatus", "dueDate",
        position, "createdAt", "updatedAt"
      ) VALUES ($1, $2, '', NULL, $3, 'IN', '+91', $4, $5, $6, $7, 'New', $8, $9, NOW(), NOW())
    `, [personId, companyName, phone, jobTitle, companyId, memberId, memberId, dueDate, position]);
  }

  const pCount = await client.query(`SELECT count(*) FROM "${sch}"."person" WHERE "deletedAt" IS NULL`);
  const cCount = await client.query(`SELECT count(*) FROM "${sch}"."company" WHERE "deletedAt" IS NULL`);
  console.log(`Successfully seeded! Active People: ${pCount.rows[0].count}, Companies: ${cCount.rows[0].count}`);

  await client.end();
}

seedLeads().catch(console.error);
