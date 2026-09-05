const { Daytona } = require('@daytona/sdk');

async function checkEnums() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  const taskEnum = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT atttypid FROM pg_attribute WHERE attrelid = 'workspace_b4ai6k0t73ulj4l40gxarowdm.task'::regclass AND attname = 'status');"
  `);
  console.log('Task status enum:\n', taskEnum.result);

  const oppEnum = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT atttypid FROM pg_attribute WHERE attrelid = 'workspace_b4ai6k0t73ulj4l40gxarowdm.opportunity'::regclass AND attname = 'stage');"
  `);
  console.log('Opportunity stage enum:\n', oppEnum.result);
}

checkEnums().catch(console.error);
