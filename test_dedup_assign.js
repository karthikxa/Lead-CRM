const { scrapeBusinessLeads, assignLeadsToMember, getDbClient, getWorkspaceSchema } = require('./lead_scraper_service');

async function test() {
  const client = await getDbClient();
  const schema = await getWorkspaceSchema(client);
  const members = await client.query(`SELECT id, "nameFirstName", "nameLastName", "userEmail" FROM "${schema}"."workspaceMember" LIMIT 2;`);
  await client.end();

  console.log('Testing with members:', members.rows);
  const member1 = members.rows[0];
  const member2 = members.rows[1] || members.rows[0];

  const testLeads = [
    {
      name: 'Chennai Apex Dental Studio',
      industry: 'Dentist',
      phone: '+91 44 2838 1234',
      website: 'https://apexdentalchennai.com',
      email: 'contact@apexdentalchennai.com',
      street: '120 Anna Salai',
      city: 'Chennai',
      state: 'Tamil Nadu',
      country: 'India',
      postcode: '600002'
    },
    {
      name: 'Marina Dental Health Clinic',
      industry: 'Dentist',
      phone: '+91 44 2838 5678',
      website: 'https://marinadentalhealth.com',
      email: 'info@marinadentalhealth.com',
      street: '45 Beach Road',
      city: 'Chennai',
      state: 'Tamil Nadu',
      country: 'India',
      postcode: '600004'
    }
  ];

  console.log('\n--- 1. Assigning to Member 1 (' + member1.userEmail + ') ---');
  const res1 = await assignLeadsToMember({ leads: testLeads, memberId: member1.id, campaignName: 'Chennai Test Campaign' });
  console.log('Result 1:', res1);

  console.log('\n--- 2. Attempting to assign same leads to Member 2 (' + member2.userEmail + ') ---');
  const res2 = await assignLeadsToMember({ leads: testLeads, memberId: member2.id, campaignName: 'Chennai Duplicate Test' });
  console.log('Result 2 (Should detect duplicates):', res2);
}

test().catch(console.error);
