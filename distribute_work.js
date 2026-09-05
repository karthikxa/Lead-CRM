const { Daytona } = require('@daytona/sdk');

async function distributeWorkToTeam() {
  const d = new Daytona({ apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef', serverUrl: 'https://app.daytona.io/api' });
  const sb = await d.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  // Distribute some tasks & opportunities to Karthik's teammate (Zed Team Member)
  // so the user can see how multi-member assignment works
  await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      DO \\\$\\\$
      DECLARE
        team_id uuid;
      BEGIN
        SELECT id INTO team_id FROM workspace_b4ai6k0t73ulj4l40gxarowdm.\\\"workspaceMember\\\" 
        WHERE \\\"nameLastName\\\" ILIKE '%Team%' OR \\\"nameFirstName\\\" ILIKE '%Zed%' LIMIT 1;

        IF team_id IS NOT NULL THEN
          UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm.\\\"task\\\"
          SET \\\"assigneeId\\\" = team_id
          WHERE title ILIKE '%Manojkumar%' OR title ILIKE '%Priya%';

          UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm.\\\"opportunity\\\"
          SET \\\"ownerId\\\" = team_id
          WHERE name ILIKE '%Shankar IAS%';
        END IF;
      END \\\$\\\$;
    "
  `);

  console.log('--- FINAL WORKSPACE TEAM ASSIGNMENT OVERVIEW ---');
  
  const tasks = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT t.title, t.status, to_char(t.\\"dueAt\\", 'Mon DD HH12:MI AM') as \\"Due When\\", m.\\"nameFirstName\\" || ' ' || m.\\"nameLastName\\" as \\"Assigned To\\"
      FROM workspace_b4ai6k0t73ulj4l40gxarowdm.\\"task\\" t
      LEFT JOIN workspace_b4ai6k0t73ulj4l40gxarowdm.\\"workspaceMember\\" m ON t.\\"assigneeId\\" = m.id
      ORDER BY t.\\"createdAt\\" DESC;
    "
  `);
  console.log('Tasks with Assignees:\n', tasks.result);

  const opps = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT o.name, o.stage, (o.\\"amountAmountMicros\\"/1000000) as inr_amount, to_char(o.\\"closeDate\\", 'Mon DD, YYYY') as meeting_date, m.\\"nameFirstName\\" || ' ' || m.\\"nameLastName\\" as \\"Meeting Owner\\"
      FROM workspace_b4ai6k0t73ulj4l40gxarowdm.\\"opportunity\\" o
      LEFT JOIN workspace_b4ai6k0t73ulj4l40gxarowdm.\\"workspaceMember\\" m ON o.\\"ownerId\\" = m.id
      ORDER BY o.\\"createdAt\\" DESC;
    "
  `);
  console.log('Opportunities with Owners:\n', opps.result);
}

distributeWorkToTeam().catch(console.error);
