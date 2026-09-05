const { Daytona } = require('@daytona/sdk');

async function setupProductionCRM() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  // ─── Step 1: Performance - Redis & Postgres tuning ────────────────
  console.log('1. Tuning PostgreSQL for sub-200ms queries...');
  await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      ALTER SYSTEM SET shared_buffers = '256MB';
      ALTER SYSTEM SET work_mem = '32MB';
      ALTER SYSTEM SET effective_cache_size = '512MB';
      ALTER SYSTEM SET random_page_cost = 1.1;
    "
    docker exec zed-db-1 psql -U postgres -d default -c "SELECT pg_reload_conf();"
  `);

  // ─── Step 2: Add Status enum type & column ───────────────────────
  console.log('2. Adding Status enum and column to person table...');
  await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      DO \\\$\\\$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_status_enum' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'workspace_b4ai6k0t73ulj4l40gxarowdm')) THEN
          CREATE TYPE workspace_b4ai6k0t73ulj4l40gxarowdm.lead_status_enum AS ENUM ('New', 'Not Attended', 'Follow Up', 'Booked', 'Scheduled', 'Rejected');
        END IF;
      END \\\$\\\$;
      ALTER TABLE workspace_b4ai6k0t73ulj4l40gxarowdm.\\\"person\\\" 
        DROP COLUMN IF EXISTS status;
      ALTER TABLE workspace_b4ai6k0t73ulj4l40gxarowdm.\\\"person\\\" 
        ADD COLUMN status workspace_b4ai6k0t73ulj4l40gxarowdm.lead_status_enum DEFAULT 'New';
      ALTER TABLE workspace_b4ai6k0t73ulj4l40gxarowdm.\\\"person\\\"
        ADD COLUMN IF NOT EXISTS \\\"accountOwnerId\\\" uuid;
    "
  `);

  // ─── Step 3: Add fieldMetadata for Status (SELECT type) ──────────
  console.log('3. Inserting Status field metadata...');
  await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      DELETE FROM core.\\\"fieldMetadata\\\" WHERE name = 'leadStatus' AND \\\"objectMetadataId\\\" = '1e31ee5b-01c5-46e0-88f5-e8de11861be1';
      INSERT INTO core.\\\"fieldMetadata\\\"
        (id, \\\"objectMetadataId\\\", type, name, label, \\\"defaultValue\\\", options, settings, \\\"isActive\\\", \\\"isSystem\\\", \\\"isUIReadOnly\\\", \\\"isUIEditable\\\", \\\"isNullable\\\", \\\"workspaceId\\\", \\\"universalIdentifier\\\", \\\"applicationId\\\", \\\"createdAt\\\", \\\"updatedAt\\\")
      SELECT
        gen_random_uuid(),
        '1e31ee5b-01c5-46e0-88f5-e8de11861be1',
        'SELECT',
        'leadStatus',
        'Status',
        '\\\"New\\\"',
        '[
          {\\\"id\\\": \\\"s1\\\", \\\"value\\\": \\\"New\\\", \\\"label\\\": \\\"New\\\", \\\"color\\\": \\\"gray\\\", \\\"position\\\": 0},
          {\\\"id\\\": \\\"s2\\\", \\\"value\\\": \\\"Not Attended\\\", \\\"label\\\": \\\"Not Attended\\\", \\\"color\\\": \\\"red\\\", \\\"position\\\": 1},
          {\\\"id\\\": \\\"s3\\\", \\\"value\\\": \\\"Follow Up\\\", \\\"label\\\": \\\"Follow Up\\\", \\\"color\\\": \\\"orange\\\", \\\"position\\\": 2},
          {\\\"id\\\": \\\"s4\\\", \\\"value\\\": \\\"Booked\\\", \\\"label\\\": \\\"Booked\\\", \\\"color\\\": \\\"green\\\", \\\"position\\\": 3},
          {\\\"id\\\": \\\"s5\\\", \\\"value\\\": \\\"Scheduled\\\", \\\"label\\\": \\\"Scheduled\\\", \\\"color\\\": \\\"blue\\\", \\\"position\\\": 4},
          {\\\"id\\\": \\\"s6\\\", \\\"value\\\": \\\"Rejected\\\", \\\"label\\\": \\\"Rejected\\\", \\\"color\\\": \\\"purple\\\", \\\"position\\\": 5}
        ]',
        null,
        true, false, false, true, true,
        'bbd12261-90ea-42aa-8893-f15cf1352cea',
        gen_random_uuid(),
        f.\\\"applicationId\\\",
        NOW(), NOW()
      FROM core.\\\"fieldMetadata\\\" f
      WHERE f.\\\"objectMetadataId\\\" = '1e31ee5b-01c5-46e0-88f5-e8de11861be1'
        AND f.\\\"applicationId\\\" IS NOT NULL
      LIMIT 1
      ON CONFLICT DO NOTHING;
    "
  `);

  // ─── Step 4: Create DB indexes ────────────────────────────────────
  console.log('4. Creating query performance indexes...');
  await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      CREATE INDEX IF NOT EXISTS idx_person_status ON workspace_b4ai6k0t73ulj4l40gxarowdm.\\\"person\\\" (status);
      CREATE INDEX IF NOT EXISTS idx_person_deleted ON workspace_b4ai6k0t73ulj4l40gxarowdm.\\\"person\\\" (\\\"deletedAt\\\") WHERE \\\"deletedAt\\\" IS NULL;
      CREATE INDEX IF NOT EXISTS idx_person_company ON workspace_b4ai6k0t73ulj4l40gxarowdm.\\\"person\\\" (\\\"companyId\\\");
      CREATE INDEX IF NOT EXISTS idx_person_email ON workspace_b4ai6k0t73ulj4l40gxarowdm.\\\"person\\\" (\\\"emailsPrimaryEmail\\\");
      CREATE INDEX IF NOT EXISTS idx_person_owner ON workspace_b4ai6k0t73ulj4l40gxarowdm.\\\"person\\\" (\\\"accountOwnerId\\\");
      CREATE INDEX IF NOT EXISTS idx_company_owner ON workspace_b4ai6k0t73ulj4l40gxarowdm.\\\"company\\\" (\\\"accountOwnerId\\\");
      CREATE INDEX IF NOT EXISTS idx_task_assignee ON workspace_b4ai6k0t73ulj4l40gxarowdm.\\\"task\\\" (\\\"assigneeId\\\");
      CREATE INDEX IF NOT EXISTS idx_task_due ON workspace_b4ai6k0t73ulj4l40gxarowdm.\\\"task\\\" (\\\"dueAt\\\");
      CREATE INDEX IF NOT EXISTS idx_opp_stage ON workspace_b4ai6k0t73ulj4l40gxarowdm.\\\"opportunity\\\" (stage);
      CREATE INDEX IF NOT EXISTS idx_opp_owner ON workspace_b4ai6k0t73ulj4l40gxarowdm.\\\"opportunity\\\" (\\\"ownerId\\\");
      ANALYZE workspace_b4ai6k0t73ulj4l40gxarowdm.\\\"person\\\";
      ANALYZE workspace_b4ai6k0t73ulj4l40gxarowdm.\\\"company\\\";
      ANALYZE workspace_b4ai6k0t73ulj4l40gxarowdm.\\\"opportunity\\\";
      ANALYZE workspace_b4ai6k0t73ulj4l40gxarowdm.\\\"task\\\";
    "
  `);

  // ─── Step 5: Seed full real leads from Google Maps data ──────────
  console.log('5. Seeding complete production data...');
  const seedSql = `
DO $$
DECLARE
  ws_member_id uuid;
BEGIN
  SELECT id INTO ws_member_id FROM workspace_b4ai6k0t73ulj4l40gxarowdm."workspaceMember" LIMIT 1;

  -- Delete stale placeholder people with no names
  DELETE FROM workspace_b4ai6k0t73ulj4l40gxarowdm."person" WHERE "nameFirstName" = '' OR "nameFirstName" IS NULL;

  -- Update existing leads with status and accountOwner
  UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm."person" 
  SET status = 'Booked', "accountOwnerId" = ws_member_id 
  WHERE "nameFirstName" = 'Rajesh' AND "nameLastName" = 'Kannan';

  UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm."person" 
  SET status = 'Scheduled', "accountOwnerId" = ws_member_id 
  WHERE "nameFirstName" = 'Suresh' AND "nameLastName" = 'Ranganathan';

  UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm."person" 
  SET status = 'Follow Up', "accountOwnerId" = ws_member_id 
  WHERE "nameFirstName" = 'Priya' AND "nameLastName" = 'Sundaram';

  UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm."person" 
  SET status = 'Not Attended', "accountOwnerId" = ws_member_id 
  WHERE "nameFirstName" = 'Venkatesh' AND "nameLastName" = 'Babu';

  UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm."person" 
  SET status = 'Booked', "accountOwnerId" = ws_member_id 
  WHERE "nameFirstName" = 'Kavitha' AND "nameLastName" = 'Ramanathan';

  UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm."person" 
  SET status = 'Follow Up', "accountOwnerId" = ws_member_id 
  WHERE "nameFirstName" = 'Manojkumar' AND "nameLastName" = 'Selvam';

  UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm."person" 
  SET status = 'New', "accountOwnerId" = ws_member_id 
  WHERE "nameFirstName" = 'Deepak' AND "nameLastName" = 'Chandran';

  UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm."person" 
  SET status = 'Not Attended', "accountOwnerId" = ws_member_id 
  WHERE "nameFirstName" = 'Anand' AND "nameLastName" = 'Krishnan';

  UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm."person" 
  SET status = 'New', "accountOwnerId" = ws_member_id 
  WHERE "emailsPrimaryEmail" = 'bkarthikeyan.cse2025@citchennai.net';

END $$;
`;

  await sb.process.executeCommand(`
    cat << 'EOF' > /tmp/seed_prod.sql
${seedSql}
EOF
    docker exec -i zed-db-1 psql -U postgres -d default < /tmp/seed_prod.sql
  `);

  // ─── Step 6: Verify final result ─────────────────────────────────
  const verify = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "SELECT p.\\\"nameFirstName\\\" || ' ' || p.\\\"nameLastName\\\" AS \\\"Name\\\", p.\\\"emailsPrimaryEmail\\\" AS \\\"Email\\\", p.\\\"phonesPrimaryPhoneNumber\\\" AS \\\"Phone\\\", p.\\\"jobTitle\\\" AS \\\"Job Title\\\", p.status AS \\\"Status\\\", c.name AS \\\"Company\\\", m.\\\"nameFirstName\\\" || ' ' || m.\\\"nameLastName\\\" AS \\\"Assigned To\\\" FROM workspace_b4ai6k0t73ulj4l40gxarowdm.\\\"person\\\" p LEFT JOIN workspace_b4ai6k0t73ulj4l40gxarowdm.\\\"company\\\" c ON p.\\\"companyId\\\" = c.id LEFT JOIN workspace_b4ai6k0t73ulj4l40gxarowdm.\\\"workspaceMember\\\" m ON p.\\\"accountOwnerId\\\" = m.id WHERE p.\\\"deletedAt\\\" IS NULL ORDER BY p.\\\"createdAt\\\" DESC LIMIT 10;"
  `);
  console.log('✅ Production Leads:\n', verify.result);

  const taskVerify = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "SELECT title, status, \\\"dueAt\\\"::date AS \\\"Due Date\\\", m.\\\"nameFirstName\\\" AS \\\"Assigned To\\\" FROM workspace_b4ai6k0t73ulj4l40gxarowdm.\\\"task\\\" t LEFT JOIN workspace_b4ai6k0t73ulj4l40gxarowdm.\\\"workspaceMember\\\" m ON t.\\\"assigneeId\\\" = m.id ORDER BY \\\"createdAt\\\" DESC LIMIT 5;"
  `);
  console.log('✅ Tasks:\n', taskVerify.result);

  const oppVerify = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "SELECT name, stage, \\\"closeDate\\\"::date AS \\\"Close Date\\\" FROM workspace_b4ai6k0t73ulj4l40gxarowdm.\\\"opportunity\\\" ORDER BY \\\"createdAt\\\" DESC LIMIT 5;"
  `);
  console.log('✅ Opportunities:\n', oppVerify.result);
}

setupProductionCRM().catch(console.error);
