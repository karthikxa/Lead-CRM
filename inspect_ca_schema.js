const { Daytona } = require('@daytona/sdk');

async function inspectConnectedAccountSchema() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');
  const res = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'core' AND table_name = 'connectedAccount';"
  `);
  console.log('ConnectedAccount columns:\n', res.result);

  const rowsRes = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "SELECT id, handle, provider, \\"authFailedAt\\", \\"createdAt\\" FROM core.\\"connectedAccount\\";"
  `);
  console.log('ConnectedAccount rows:\n', rowsRes.result);
}

inspectConnectedAccountSchema().catch(console.error);
