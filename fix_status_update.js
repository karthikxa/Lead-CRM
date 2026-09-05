const { Daytona } = require('@daytona/sdk');

async function fixStatusUpdate() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  // The status column is text type - update statuses and assigned owners
  const sql = `
DO $$
DECLARE
  ws_member_id uuid;
BEGIN
  SELECT id INTO ws_member_id FROM workspace_b4ai6k0t73ulj4l40gxarowdm."workspaceMember" LIMIT 1;

  -- Assign all leads to workspace member first
  UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm."person" SET "accountOwnerId" = ws_member_id WHERE "deletedAt" IS NULL;

  -- Set lead statuses for real meaningful data
  UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm."person" SET status = 'Booked' 
    WHERE "nameFirstName" = 'Rajesh' AND "nameLastName" = 'Kannan';
  UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm."person" SET status = 'Scheduled' 
    WHERE "nameFirstName" = 'Suresh' AND "nameLastName" = 'Ranganathan';
  UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm."person" SET status = 'Follow Up' 
    WHERE "nameFirstName" = 'Priya' AND "nameLastName" = 'Sundaram';
  UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm."person" SET status = 'Not Attended' 
    WHERE "nameFirstName" = 'Venkatesh' AND "nameLastName" = 'Babu';
  UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm."person" SET status = 'Booked' 
    WHERE "nameFirstName" = 'Kavitha' AND "nameLastName" = 'Ramanathan';
  UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm."person" SET status = 'Follow Up' 
    WHERE "nameFirstName" = 'Manojkumar' AND "nameLastName" = 'Selvam';
  UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm."person" SET status = 'New' 
    WHERE "nameFirstName" = 'Deepak' AND "nameLastName" = 'Chandran';
  UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm."person" SET status = 'Not Attended' 
    WHERE "nameFirstName" = 'Anand' AND "nameLastName" = 'Krishnan';
  UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm."person" SET status = 'New' 
    WHERE "emailsPrimaryEmail" = 'bkarthikeyan.cse2025@citchennai.net';

END $$;
`;

  await sb.process.executeCommand(`
    cat << 'EOF' > /tmp/fix_status.sql
${sql}
EOF
    docker exec -i zed-db-1 psql -U postgres -d default < /tmp/fix_status.sql
  `);

  console.log('Verifying final People table...');
  const verify = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT 
        p.\\"nameFirstName\\" || ' ' || p.\\"nameLastName\\" AS \\"Name\\",
        p.\\"emailsPrimaryEmail\\" AS \\"Email\\",
        p.\\"phonesPrimaryPhoneNumber\\" AS \\"Phone\\",
        p.\\"jobTitle\\" AS \\"Job Title\\",
        p.status AS \\"Status\\",
        c.name AS \\"Company\\",
        m.\\"nameFirstName\\" AS \\"Assigned To\\"
      FROM workspace_b4ai6k0t73ulj4l40gxarowdm.\\"person\\" p
      LEFT JOIN workspace_b4ai6k0t73ulj4l40gxarowdm.\\"company\\" c ON p.\\"companyId\\" = c.id
      LEFT JOIN workspace_b4ai6k0t73ulj4l40gxarowdm.\\"workspaceMember\\" m ON p.\\"accountOwnerId\\" = m.id
      WHERE p.\\"deletedAt\\" IS NULL
      ORDER BY p.\\"createdAt\\" DESC LIMIT 10;
    "
  `);
  console.log('✅ FINAL People Table:\n', verify.result);
}

fixStatusUpdate().catch(console.error);
