const { Daytona } = require('@daytona/sdk');

async function seedPipeline() {
  const d = new Daytona({ apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef', serverUrl: 'https://app.daytona.io/api' });
  const sb = await d.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  // Reset all to 'New' first, then transition to trigger tasks/opportunities
  await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm.\\"person\\" SET \\"leadStatus\\" = 'New';
      
      -- Now trigger each status change
      UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm.\\"person\\" SET \\"leadStatus\\" = 'Booked' WHERE \\"nameFirstName\\" = 'Rajesh';
      UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm.\\"person\\" SET \\"leadStatus\\" = 'Scheduled' WHERE \\"nameFirstName\\" = 'Suresh';
      UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm.\\"person\\" SET \\"leadStatus\\" = 'Follow Up' WHERE \\"nameFirstName\\" = 'Priya';
      UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm.\\"person\\" SET \\"leadStatus\\" = 'Not Attended' WHERE \\"nameFirstName\\" = 'Venkatesh';
      UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm.\\"person\\" SET \\"leadStatus\\" = 'Booked' WHERE \\"nameFirstName\\" = 'Kavitha';
      UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm.\\"person\\" SET \\"leadStatus\\" = 'Follow Up' WHERE \\"nameFirstName\\" = 'Manojkumar';
      UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm.\\"person\\" SET \\"leadStatus\\" = 'Not Attended' WHERE \\"nameFirstName\\" = 'Anand';
    "
  `);

  console.log('--- VERIFY GENERATED PIPELINE ---');

  const vTasks = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT t.title, t.status, to_char(t.\\"dueAt\\", 'Mon DD HH12:MI AM') as \\"Due When\\", m.\\"nameFirstName\\" || ' ' || m.\\"nameLastName\\" as \\"Assigned To\\"
      FROM workspace_b4ai6k0t73ulj4l40gxarowdm.\\"task\\" t
      LEFT JOIN workspace_b4ai6k0t73ulj4l40gxarowdm.\\"workspaceMember\\" m ON t.\\"assigneeId\\" = m.id
      ORDER BY t.\\"createdAt\\" DESC;
    "
  `);
  console.log('✅ Generated Tasks:\n', vTasks.result);

  const vOpps = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT o.name, o.stage, (o.\\"amountAmountMicros\\"/1000000) as amount_inr, to_char(o.\\"closeDate\\", 'Mon DD, YYYY') as meeting_date, m.\\"nameFirstName\\" || ' ' || m.\\"nameLastName\\" as \\"Owner\\"
      FROM workspace_b4ai6k0t73ulj4l40gxarowdm.\\"opportunity\\" o
      LEFT JOIN workspace_b4ai6k0t73ulj4l40gxarowdm.\\"workspaceMember\\" m ON o.\\"ownerId\\" = m.id
      ORDER BY o.\\"createdAt\\" DESC;
    "
  `);
  console.log('✅ Generated Opportunities:\n', vOpps.result);

  const vPeople = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT p.\\"nameFirstName\\" || ' ' || p.\\"nameLastName\\" as lead_name, p.\\"leadStatus\\", c.name as company, p.\\"phonesPrimaryPhoneNumber\\" as phone
      FROM workspace_b4ai6k0t73ulj4l40gxarowdm.\\"person\\" p
      LEFT JOIN workspace_b4ai6k0t73ulj4l40gxarowdm.\\"company\\" c ON p.\\"companyId\\" = c.id
      WHERE p.\\"deletedAt\\" IS NULL
      ORDER BY p.\\"createdAt\\" DESC;
    "
  `);
  console.log('✅ Current Leads:\n', vPeople.result);
}

seedPipeline().catch(console.error);
