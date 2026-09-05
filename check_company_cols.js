const { Daytona } = require('@daytona/sdk');

async function checkCompanyCols() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  console.log('1. Checking Companies in DB...');
  const companies = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c 'SELECT id, name, "domainName", "accountOwnerId" FROM workspace_b4ai6k0t73ulj4l40gxarowdm."company" LIMIT 15;'
  `);
  console.log('Companies:\n', companies.result);

  console.log('2. Checking Pending Invites in DB...');
  const invites = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c 'SELECT id, type, "expiresAt", context FROM core."appToken" WHERE type ILIKE '\''%invit%'\'' OR type ILIKE '\''%invite%'\'';'
  `);
  console.log('Invites:\n', invites.result);
}

checkCompanyCols().catch(console.error);
