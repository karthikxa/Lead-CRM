const { Daytona } = require('@daytona/sdk');

async function fixAll() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  // Fix the trigger to cast text comparisons properly, and update statuses
  const fixSql = `
-- 1. Fix the trigger to use ::text cast for ILIKE comparisons
CREATE OR REPLACE FUNCTION workspace_b4ai6k0t73ulj4l40gxarowdm.handle_person_status_trigger()
RETURNS TRIGGER AS $$
DECLARE
  default_member_id uuid;
  assigned_member_id uuid;
  lead_name text;
  new_status_text text;
  old_status_text text;
BEGIN
  new_status_text := NEW.status::text;
  old_status_text := COALESCE(OLD.status::text, '');
  
  SELECT id INTO default_member_id FROM workspace_b4ai6k0t73ulj4l40gxarowdm."workspaceMember" LIMIT 1;
  assigned_member_id := COALESCE(NEW."accountOwnerId", default_member_id);
  lead_name := TRIM(COALESCE(NEW."nameFirstName", '') || ' ' || COALESCE(NEW."nameLastName", ''));
  IF lead_name = '' THEN
    lead_name := COALESCE(NEW."emailsPrimaryEmail", 'Lead');
  END IF;

  -- Not Attended or Follow Up -> auto task
  IF (new_status_text = 'Not Attended' OR new_status_text = 'Follow Up') AND old_status_text != new_status_text THEN
    INSERT INTO workspace_b4ai6k0t73ulj4l40gxarowdm."task"
      (id, "createdAt", "updatedAt", title, "bodyV2Markdown", "dueAt", status, "assigneeId", "position")
    VALUES
      (gen_random_uuid(), NOW(), NOW(), 'Follow up with ' || lead_name || ' (' || new_status_text || ')',
       'Auto-task: Re-reach out to ' || lead_name, NOW() + INTERVAL '1 day',
       'TODO'::workspace_b4ai6k0t73ulj4l40gxarowdm."task_status_enum", assigned_member_id, 0);
  END IF;

  -- Booked or Scheduled -> auto opportunity
  IF (new_status_text = 'Booked' OR new_status_text = 'Scheduled') AND (old_status_text != 'Booked' AND old_status_text != 'Scheduled') THEN
    INSERT INTO workspace_b4ai6k0t73ulj4l40gxarowdm."opportunity"
      (id, "createdAt", "updatedAt", name, stage, "pointOfContactId", "companyId", "ownerId", "position")
    VALUES
      (gen_random_uuid(), NOW(), NOW(), lead_name || ' - Booked Meeting',
       'MEETING'::workspace_b4ai6k0t73ulj4l40gxarowdm."opportunity_stage_enum",
       NEW.id, NEW."companyId", assigned_member_id, 0);
  END IF;

  -- Rejected -> soft delete
  IF new_status_text = 'Rejected' THEN
    NEW."deletedAt" := NOW();
  ELSE
    IF old_status_text = 'Rejected' THEN
      NEW."deletedAt" := NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_person_status ON workspace_b4ai6k0t73ulj4l40gxarowdm."person";
CREATE TRIGGER trg_person_status
BEFORE INSERT OR UPDATE ON workspace_b4ai6k0t73ulj4l40gxarowdm."person"
FOR EACH ROW
EXECUTE FUNCTION workspace_b4ai6k0t73ulj4l40gxarowdm.handle_person_status_trigger();

-- 2. Update statuses directly (trigger will fire and create tasks/opps automatically)
UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm."person" SET status = 'Booked' WHERE "nameFirstName" = 'Rajesh' AND "nameLastName" = 'Kannan';
UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm."person" SET status = 'Scheduled' WHERE "nameFirstName" = 'Suresh' AND "nameLastName" = 'Ranganathan';
UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm."person" SET status = 'Follow Up' WHERE "nameFirstName" = 'Priya' AND "nameLastName" = 'Sundaram';
UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm."person" SET status = 'Not Attended' WHERE "nameFirstName" = 'Venkatesh' AND "nameLastName" = 'Babu';
UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm."person" SET status = 'Booked' WHERE "nameFirstName" = 'Kavitha' AND "nameLastName" = 'Ramanathan';
UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm."person" SET status = 'Follow Up' WHERE "nameFirstName" = 'Manojkumar' AND "nameLastName" = 'Selvam';
UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm."person" SET status = 'Not Attended' WHERE "nameFirstName" = 'Anand' AND "nameLastName" = 'Krishnan';
`;

  await sb.process.executeCommand(`
    cat << 'EOF' > /tmp/fix_all.sql
${fixSql}
EOF
    docker exec -i zed-db-1 psql -U postgres -d default < /tmp/fix_all.sql
  `);
  console.log('Fixed trigger and updated statuses.');

  const verify = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT 
        p.\\"nameFirstName\\" || ' ' || p.\\"nameLastName\\" AS \\"Name\\",
        p.status::text AS \\"Status\\",
        c.name AS \\"Company\\",
        p.\\"jobTitle\\" AS \\"Job Title\\",
        p.\\"emailsPrimaryEmail\\" AS \\"Email\\",
        p.\\"phonesPrimaryPhoneNumber\\" AS \\"Phone\\"
      FROM workspace_b4ai6k0t73ulj4l40gxarowdm.\\"person\\" p
      LEFT JOIN workspace_b4ai6k0t73ulj4l40gxarowdm.\\"company\\" c ON p.\\"companyId\\" = c.id
      WHERE p.\\"deletedAt\\" IS NULL
      ORDER BY p.\\"createdAt\\" DESC LIMIT 10;
    "
  `);
  console.log('✅ FINAL People Table:\n', verify.result);

  const taskVerify = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT t.title, t.status::text, t.\\"dueAt\\"::date AS due
      FROM workspace_b4ai6k0t73ulj4l40gxarowdm.\\"task\\" t
      WHERE t.\\"deletedAt\\" IS NULL
      ORDER BY t.\\"createdAt\\" DESC LIMIT 5;
    "
  `);
  console.log('✅ Tasks auto-created by trigger:\n', taskVerify.result);

  const oppVerify = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT name, stage::text FROM workspace_b4ai6k0t73ulj4l40gxarowdm.\\"opportunity\\"
      WHERE \\"deletedAt\\" IS NULL
      ORDER BY \\"createdAt\\" DESC LIMIT 5;
    "
  `);
  console.log('✅ Opportunities auto-created by trigger:\n', oppVerify.result);
}

fixAll().catch(console.error);
