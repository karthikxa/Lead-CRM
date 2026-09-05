const { Daytona } = require('@daytona/sdk');

async function verify() {
  const d = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });
  const sb = await d.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');
  const res = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "SELECT p.\\"nameFirstName\\", p.\\"nameLastName\\", p.\\"emailsPrimaryEmail\\", p.\\"phonesPrimaryPhoneNumber\\", c.name AS \\"Institute\\" FROM workspace_b4ai6k0t73ulj4l40gxarowdm.\\"person\\" p LEFT JOIN workspace_b4ai6k0t73ulj4l40gxarowdm.\\"company\\" c ON p.\\"companyId\\" = c.id ORDER BY p.\\"createdAt\\" DESC LIMIT 10;"
  `);
  console.log('Seeded Leads in CRM:\n', res.result);
}

verify().catch(console.error);
