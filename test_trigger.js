const { Daytona } = require('@daytona/sdk');

async function testTrigger() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  console.log('1. Adding column status to person...');
  await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "ALTER TABLE workspace_b4ai6k0t73ulj4l40gxarowdm.\\"person\\" ADD COLUMN IF NOT EXISTS \\"status\\" text DEFAULT 'New';"
  `);

  console.log('2. Testing "Not Attended" status update on a lead...');
  await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm.\\"person\\" SET status = 'Not Attended' WHERE \\"nameFirstName\\" = 'Rajesh' AND \\"nameLastName\\" = 'Kannan';"
  `);

  const tasks = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "SELECT title, \\"dueAt\\", status FROM workspace_b4ai6k0t73ulj4l40gxarowdm.\\"task\\" ORDER BY \\"createdAt\\" DESC LIMIT 3;"
  `);
  console.log('Automated Tasks in DB:\n', tasks.result);

  console.log('3. Testing "Booked" status update on a lead...');
  await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm.\\"person\\" SET status = 'Booked' WHERE \\"nameFirstName\\" = 'Priya' AND \\"nameLastName\\" = 'Sundaram';"
  `);

  const opps = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "SELECT name, stage FROM workspace_b4ai6k0t73ulj4l40gxarowdm.\\"opportunity\\" ORDER BY \\"createdAt\\" DESC LIMIT 3;"
  `);
  console.log('Automated Opportunities in DB:\n', opps.result);
}

testTrigger().catch(console.error);
