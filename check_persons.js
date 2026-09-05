const { Daytona } = require('@daytona/sdk');

async function checkPersons() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');
  const persons = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c 'SELECT id, "nameFirstName", "nameLastName", "emailsPrimaryEmail" FROM workspace_b4ai6k0t73ulj4l40gxarowdm."person" LIMIT 15;'
  `);
  console.log('People rows:\n', persons.result);
}

checkPersons().catch(console.error);
