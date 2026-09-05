const { Daytona } = require('@daytona/sdk');

async function runSeed() {
  const d = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });
  const sb = await d.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  const execRes = await sb.process.executeCommand(`
    cd /home/daytona/Lead-CRM
    docker cp seed_leads_remote.js zed-server-1:/tmp/seed_leads_remote.js
    docker exec zed-server-1 node /tmp/seed_leads_remote.js
  `);
  console.log('Seed output:\n', execRes.result);

  const res = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "SELECT p.\\"nameFirstName\\", p.\\"nameLastName\\", p.\\"emailsPrimaryEmail\\", p.\\"phonesPrimaryPhoneNumber\\", c.name AS \\"Institute\\" FROM workspace_b4ai6k0t73ulj4l40gxarowdm.\\"person\\" p LEFT JOIN workspace_b4ai6k0t73ulj4l40gxarowdm.\\"company\\" c ON p.\\"companyId\\" = c.id ORDER BY p.\\"createdAt\\" DESC LIMIT 12;"
  `);
  console.log('Seeded Leads in CRM:\n', res.result);
}

runSeed().catch(console.error);
