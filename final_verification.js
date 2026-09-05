const { Daytona } = require('@daytona/sdk');

async function finalVerification() {
  const d = new Daytona({ apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef', serverUrl: 'https://app.daytona.io/api' });
  const sb = await d.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  // Verify Tasks
  const tasks = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT t.title, t.status, t.\\"dueAt\\"::date as due_date, m.\\"nameFirstName\\" as assignee
      FROM workspace_b4ai6k0t73ulj4l40gxarowdm.\\"task\\" t
      LEFT JOIN workspace_b4ai6k0t73ulj4l40gxarowdm.\\"workspaceMember\\" m ON t.\\"assigneeId\\" = m.id
      ORDER BY t.\\"createdAt\\" DESC LIMIT 5;
    "
  `);
  console.log('Final Tasks:\n', tasks.result);

  // Verify People
  const people = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT p.\\"nameFirstName\\" || ' ' || p.\\"nameLastName\\" as name, p.\\"leadStatus\\", c.name as company, p.\\"jobTitle\\", p.\\"phonesPrimaryPhoneNumber\\"
      FROM workspace_b4ai6k0t73ulj4l40gxarowdm.\\"person\\" p
      LEFT JOIN workspace_b4ai6k0t73ulj4l40gxarowdm.\\"company\\" c ON p.\\"companyId\\" = c.id
      WHERE p.\\"deletedAt\\" IS NULL
      ORDER BY p.\\"createdAt\\" DESC LIMIT 6;
    "
  `);
  console.log('Final People:\n', people.result);
}

finalVerification().catch(console.error);
