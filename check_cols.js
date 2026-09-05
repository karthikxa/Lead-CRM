const { Daytona } = require('@daytona/sdk');

async function checkCols() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');
  const cols = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'company' AND table_schema = 'workspace_b4ai6k0t73ulj4l40gxarowdm';"
  `);
  console.log('Company columns:\n', cols.result);

  const companies = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c 'SELECT id, name, "createdAt" FROM workspace_b4ai6k0t73ulj4l40gxarowdm."company" LIMIT 10;'
  `);
  console.log('Company rows:\n', companies.result);
}

checkCols().catch(console.error);
