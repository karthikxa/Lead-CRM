const { Daytona } = require('@daytona/sdk');

async function inspectTaskAndOppTables() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  const taskCols = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'task' AND table_schema = 'workspace_b4ai6k0t73ulj4l40gxarowdm';"
  `);
  console.log('Task columns:\n', taskCols.result);

  const oppCols = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'opportunity' AND table_schema = 'workspace_b4ai6k0t73ulj4l40gxarowdm';"
  `);
  console.log('Opportunity columns:\n', oppCols.result);
}

inspectTaskAndOppTables().catch(console.error);
