const { Daytona } = require('@daytona/sdk');

async function debugStatus() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  // Check the actual column type
  const typeCheck = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_name = 'person' AND table_schema = 'workspace_b4ai6k0t73ulj4l40gxarowdm' AND column_name = 'status';"
  `);
  console.log('Status column type:\n', typeCheck.result);

  // Try direct update on one lead
  const update = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm.\\"person\\" SET status = 'Booked' WHERE \\"nameFirstName\\" = 'Rajesh'; SELECT \\"nameFirstName\\", status FROM workspace_b4ai6k0t73ulj4l40gxarowdm.\\"person\\" WHERE \\"nameFirstName\\" = 'Rajesh';"
  `);
  console.log('Direct update result:\n', update.result);
}

debugStatus().catch(console.error);
