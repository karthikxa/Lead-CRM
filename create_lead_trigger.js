const { Daytona } = require('@daytona/sdk');

async function createAutomatedLeadTrigger() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  console.log('1. Adding status column to person table...');
  const addCol = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c '
      ALTER TABLE workspace_b4ai6k0t73ulj4l40gxarowdm."person" ADD COLUMN IF NOT EXISTS status text DEFAULT \x27New\x27;
    '
  `);
  console.log('Add status col:\n', addCol.result);

  console.log('2. Creating intelligent Lead Workflow Trigger function in PostgreSQL...');
  const triggerSql = `
CREATE OR REPLACE FUNCTION workspace_b4ai6k0t73ulj4l40gxarowdm.handle_person_status_trigger()
RETURNS TRIGGER AS $$
DECLARE
  default_member_id uuid;
  assigned_member_id uuid;
  lead_name text;
BEGIN
  -- Get default workspace member
  SELECT id INTO default_member_id FROM workspace_b4ai6k0t73ulj4l40gxarowdm."workspaceMember" LIMIT 1;
  assigned_member_id := COALESCE(NEW."accountOwnerId", default_member_id);
  lead_name := TRIM(COALESCE(NEW."nameFirstName", '') || ' ' || COALESCE(NEW."nameLastName", ''));
  IF lead_name = '' THEN
    lead_name := COALESCE(NEW."emailsPrimaryEmail", 'Lead');
  END IF;

  -- 1. NOT ATTENDED or FOLLOW UP -> Auto-create Task for assigned member
  IF (NEW.status ILIKE '%Not Attended%' OR NEW.status ILIKE '%Follow Up%') AND (OLD.status IS NULL OR OLD.status != NEW.status) THEN
    INSERT INTO workspace_b4ai6k0t73ulj4l40gxarowdm."task"
      (id, "createdAt", "updatedAt", title, "bodyV2Markdown", "dueAt", status, "assigneeId", "position")
    VALUES
      (gen_random_uuid(), NOW(), NOW(), 'Follow up with ' || lead_name || ' (' || NEW.status || ')', 'Automated follow-up task generated for ' || lead_name || ' with status: ' || NEW.status, NOW() + INTERVAL '1 day', 'TODO'::workspace_b4ai6k0t73ulj4l40gxarowdm."task_status_enum", assigned_member_id, 0);
  END IF;

  -- 2. BOOKED or SCHEDULED -> Auto-create Opportunity & Meeting Deal
  IF (NEW.status ILIKE '%Booked%' OR NEW.status ILIKE '%Scheduled%') AND (OLD.status IS NULL OR (OLD.status NOT ILIKE '%Booked%' AND OLD.status NOT ILIKE '%Scheduled%')) THEN
    INSERT INTO workspace_b4ai6k0t73ulj4l40gxarowdm."opportunity"
      (id, "createdAt", "updatedAt", name, stage, "pointOfContactId", "companyId", "ownerId", "position")
    VALUES
      (gen_random_uuid(), NOW(), NOW(), lead_name || ' - Booked Meeting', 'MEETING'::workspace_b4ai6k0t73ulj4l40gxarowdm."opportunity_stage_enum", NEW.id, NEW."companyId", assigned_member_id, 0);
  END IF;

  -- 3. REJECTED -> Automatically soft-delete / hide from active views while preserving in DB to prevent duplicates
  IF NEW.status ILIKE '%Rejected%' THEN
    NEW."deletedAt" := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_person_status ON workspace_b4ai6k0t73ulj4l40gxarowdm."person";
CREATE TRIGGER trg_person_status
BEFORE INSERT OR UPDATE ON workspace_b4ai6k0t73ulj4l40gxarowdm."person"
FOR EACH ROW
EXECUTE FUNCTION workspace_b4ai6k0t73ulj4l40gxarowdm.handle_person_status_trigger();
`;

  await sb.process.executeCommand(`
    cat << 'EOF' > /tmp/create_trigger.sql
${triggerSql}
EOF
    docker exec -i zed-db-1 psql -U postgres -d default < /tmp/create_trigger.sql
  `);

  console.log('✅ Trigger successfully created in PostgreSQL!');
}

createAutomatedLeadTrigger().catch(console.error);
