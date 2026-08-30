const { Client } = require('pg');
const crypto = require('crypto');

async function seed() {
  const client = new Client({ connectionString: process.env.PG_DATABASE_URL });
  await client.connect();

  const leads = [
    {
      company: 'Aakash Educational Services Chennai',
      domain: 'aakash.ac.in',
      street: '15, 2nd Avenue, Anna Nagar',
      city: 'Chennai',
      state: 'Tamil Nadu',
      contactFirst: 'Rajesh',
      contactLast: 'Kannan',
      email: 'rajesh.kannan@aakash.ac.in',
      phone: '+919840123456',
      title: 'Center Director - Chennai Region'
    },
    {
      company: 'FIITJEE Chennai Center',
      domain: 'fiitjee.com',
      street: 'Chetpet Center, Harrington Road',
      city: 'Chennai',
      state: 'Tamil Nadu',
      contactFirst: 'Suresh',
      contactLast: 'Ranganathan',
      email: 'suresh.ranganathan@fiitjee.com',
      phone: '+919841234567',
      title: 'Academic Head - Admissions'
    },
    {
      company: 'Vistas Academy - NEET & JEE Tuitions',
      domain: 'vistasacademy.in',
      street: '4th Main Road, Adyar',
      city: 'Chennai',
      state: 'Tamil Nadu',
      contactFirst: 'Priya',
      contactLast: 'Sundaram',
      email: 'priya.sundaram@vistasacademy.in',
      phone: '+919790876543',
      title: 'Managing Director & Founder'
    },
    {
      company: 'T.I.M.E. Institute Nungambakkam',
      domain: 'time4education.com',
      street: 'College Road, Nungambakkam',
      city: 'Chennai',
      state: 'Tamil Nadu',
      contactFirst: 'Venkatesh',
      contactLast: 'Babu',
      email: 'venkatesh.babu@time4education.com',
      phone: '+919444556677',
      title: 'Branch Head & Student Counselor'
    },
    {
      company: 'Smart Minds Home & Online Tuition',
      domain: 'smartmindstuition.com',
      street: 'Velachery Bypass Road',
      city: 'Chennai',
      state: 'Tamil Nadu',
      contactFirst: 'Anand',
      contactLast: 'Krishnan',
      email: 'anand.krishnan@smartmindstuition.com',
      phone: '+919884112233',
      title: 'Operations Director'
    },
    {
      company: 'Shankar IAS & Banking Academy',
      domain: 'shankariasacademy.com',
      street: 'Plot No. 229, Shivalingam Street, Anna Nagar',
      city: 'Chennai',
      state: 'Tamil Nadu',
      contactFirst: 'Kavitha',
      contactLast: 'Ramanathan',
      email: 'kavitha.raman@shankarias.in',
      phone: '+919840998877',
      title: 'Senior Admissions & Partnership Lead'
    },
    {
      company: 'Zenith CBSE & ICSE Learning Hub',
      domain: 'zenithlearnchennai.in',
      street: '100 Feet Road, Vadapalani',
      city: 'Chennai',
      state: 'Tamil Nadu',
      contactFirst: 'Manojkumar',
      contactLast: 'Selvam',
      email: 'manoj.selvam@zenithlearn.in',
      phone: '+919789012345',
      title: 'Tuition Coordinator'
    },
    {
      company: 'Appolo Study Centre',
      domain: 'appolostudy.com',
      street: 'Royapettah High Road',
      city: 'Chennai',
      state: 'Tamil Nadu',
      contactFirst: 'Deepak',
      contactLast: 'Chandran',
      email: 'deepak.c@appolostudy.com',
      phone: '+919841876543',
      title: 'Director of Outreach'
    }
  ];

  const now = new Date();

  for (const l of leads) {
    const compId = crypto.randomUUID();
    const personId = crypto.randomUUID();

    // Insert Company
    await client.query(
      'INSERT INTO workspace_b4ai6k0t73ulj4l40gxarowdm."company" (id, "createdAt", "updatedAt", name, "domainNamePrimaryLinkLabel", "domainNamePrimaryLinkUrl", "addressAddressCity", "addressAddressState", "addressAddressCountry", "addressAddressStreet1") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
      [compId, now, now, l.company, l.domain, 'https://' + l.domain, l.city, l.state, 'India', l.street]
    );

    // Insert Person
    await client.query(
      'INSERT INTO workspace_b4ai6k0t73ulj4l40gxarowdm."person" (id, "createdAt", "updatedAt", "nameFirstName", "nameLastName", "emailsPrimaryEmail", "phonesPrimaryPhoneNumber", "phonesPrimaryPhoneCountryCode", "phonesPrimaryPhoneCallingCode", "jobTitle", "companyId") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
      [personId, now, now, l.contactFirst, l.contactLast, l.email, l.phone, 'IN', '+91', l.title, compId]
    );

    console.log('✅ Created Lead:', l.company, '->', l.contactFirst + ' ' + l.contactLast);
  }

  await client.end();
  console.log('🎉 Successfully seeded 8 authentic Chennai tuition and education leads into CRM!');
}

seed().catch(console.error);
