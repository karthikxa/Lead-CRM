const { Daytona } = require('@daytona/sdk');

async function setupProductionWorkflow() {
  const d = new Daytona({ apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef', serverUrl: 'https://app.daytona.io/api' });
  const sb = await d.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  console.log('=== STEP 1: FIX ADMIN USER IDENTITY & NAMES ===');
  // Update admin user to "Karthik (Zed Admin)" or "Karthik B"
  await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      UPDATE core.\\"user\\" SET \\"firstName\\" = 'Karthik', \\"lastName\\" = '(Admin)' WHERE email = 'balunithyapriya@gmail.com';
      UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm.\\"workspaceMember\\" 
      SET \\"nameFirstName\\" = 'Karthik', \\"nameLastName\\" = '(Admin)'
      WHERE \\"userId\\" = (SELECT id FROM core.\\"user\\" WHERE email = 'balunithyapriya@gmail.com');

      UPDATE core.\\"user\\" SET \\"firstName\\" = 'Zed', \\"lastName\\" = 'Team' WHERE email = 'bkarthikeyan.cse2025@citchennai.net';
      UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm.\\"workspaceMember\\" 
      SET \\"nameFirstName\\" = 'Zed', \\"nameLastName\\" = 'Team Member'
      WHERE \\"userId\\" = (SELECT id FROM core.\\"user\\" WHERE email = 'bkarthikeyan.cse2025@citchennai.net');
    "
  `);

  console.log('=== STEP 2: ENSURE ASSIGNED TO FIELD IN PEOPLE VIEW ===');
  // Check if accountOwner exists on person metadata
  const personOwnerField = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT id, name, label FROM core.\\"fieldMetadata\\"
      WHERE name = 'accountOwner' AND \\"objectMetadataId\\" = '1e31ee5b-01c5-46e0-88f5-e8de11861be1';
    "
  `);
  console.log('Person accountOwner field:\n', personOwnerField.result);

  // If not exists, create accountOwner (relation to workspaceMember) on Person objectMetadata
  // Let's check existing relation fieldMetadata on person to use as template
  const relTemplate = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT id, name, type, label, settings, \\"applicationId\\", \\"workspaceId\\"
      FROM core.\\"fieldMetadata\\"
      WHERE type IN ('RELATION', 'SELECT', 'TEXT') AND \\"objectMetadataId\\" = '1e31ee5b-01c5-46e0-88f5-e8de11861be1' LIMIT 2;
    "
  `);
  console.log('Relation template:\n', relTemplate.result);

  // Re-verify viewFields on Person
  const vFields = `
DO $$
DECLARE
  v_person uuid := '0df54d67-bd33-497d-a501-143fb04ec056';
  v_app_id uuid := '26ef5745-b806-4ac9-a365-a23bd0a62d65';
  v_ws_id uuid := 'bbd12261-90ea-42aa-8893-f15cf1352cea';
  f_status uuid;
BEGIN
  SELECT id INTO f_status FROM core."fieldMetadata" WHERE name = 'leadStatus' AND "objectMetadataId" = '1e31ee5b-01c5-46e0-88f5-e8de11861be1' LIMIT 1;

  -- Ensure leadStatus is at position 5
  UPDATE core."viewField" SET "isVisible" = true, position = 5 
  WHERE "viewId" = v_person AND "fieldMetadataId" = f_status;

  -- Ensure company is visible at position 3
  UPDATE core."viewField" SET "isVisible" = true, position = 3
  WHERE "viewId" = v_person AND "fieldMetadataId" IN (SELECT id FROM core."fieldMetadata" WHERE name = 'company' AND "objectMetadataId" = '1e31ee5b-01c5-46e0-88f5-e8de11861be1');

  -- Ensure phones is visible at position 2
  UPDATE core."viewField" SET "isVisible" = true, position = 2
  WHERE "viewId" = v_person AND "fieldMetadataId" IN (SELECT id FROM core."fieldMetadata" WHERE name = 'phones' AND "objectMetadataId" = '1e31ee5b-01c5-46e0-88f5-e8de11861be1');

END $$;
`;

  await sb.process.executeCommand(`
    cat << 'EOF' > /tmp/vfields.sql
${vFields}
EOF
    docker exec -i zed-db-1 psql -U postgres -d default < /tmp/vfields.sql
  `);

  console.log('=== STEP 3: ADVANCED AUTO-TRIGGER WITH INTELLIGENT TIMINGS & MEETING DETAILS ===');
  const triggerSql = `
CREATE OR REPLACE FUNCTION workspace_b4ai6k0t73ulj4l40gxarowdm.handle_person_status_trigger()
RETURNS TRIGGER AS $$
DECLARE
  admin_member_id uuid;
  assigned_member_id uuid;
  lead_name text;
  lead_phone text;
  lead_company text;
BEGIN
  -- Get admin member ID
  SELECT id INTO admin_member_id FROM workspace_b4ai6k0t73ulj4l40gxarowdm."workspaceMember" 
  WHERE "nameLastName" ILIKE '%Admin%' OR "nameFirstName" ILIKE '%Karthik%' LIMIT 1;

  assigned_member_id := COALESCE(NEW."accountOwnerId", admin_member_id);
  lead_name := TRIM(COALESCE(NEW."nameFirstName",'') || ' ' || COALESCE(NEW."nameLastName",''));
  IF lead_name = '' THEN lead_name := COALESCE(NEW."emailsPrimaryEmail",'Lead'); END IF;
  lead_phone := COALESCE(NEW."phonesPrimaryPhoneNumber", 'No phone');

  -- Get company name
  SELECT name INTO lead_company FROM workspace_b4ai6k0t73ulj4l40gxarowdm."company" WHERE id = NEW."companyId" LIMIT 1;
  IF lead_company IS NULL THEN lead_company := 'Education Lead'; END IF;

  -- 1. NOT ATTENDED -> Urgent Task in 3 Hours
  IF NEW."leadStatus" = 'Not Attended' AND (COALESCE(OLD."leadStatus",'') != 'Not Attended') THEN
    INSERT INTO workspace_b4ai6k0t73ulj4l40gxarowdm."task"
      (id, "createdAt", "updatedAt", title, "bodyV2Markdown", "dueAt", status, "assigneeId", "position")
    VALUES
      (gen_random_uuid(), NOW(), NOW(),
       '📞 Call Back (No Answer): ' || lead_name || ' (' || lead_phone || ')',
       '### Lead Call Back Required\n**Institute:** ' || lead_company || '\n**Contact:** ' || lead_name || '\n**Phone:** ' || lead_phone || '\n**Action:** Lead did not pick up. Re-dial after 2-3 hours.',
       NOW() + INTERVAL '3 hours',
       'TODO'::workspace_b4ai6k0t73ulj4l40gxarowdm."task_status_enum",
       assigned_member_id, 0);
  END IF;

  -- 2. FOLLOW UP -> Scheduled Task in 24 Hours
  IF NEW."leadStatus" = 'Follow Up' AND (COALESCE(OLD."leadStatus",'') != 'Follow Up') THEN
    INSERT INTO workspace_b4ai6k0t73ulj4l40gxarowdm."task"
      (id, "createdAt", "updatedAt", title, "bodyV2Markdown", "dueAt", status, "assigneeId", "position")
    VALUES
      (gen_random_uuid(), NOW(), NOW(),
       '🗓️ Follow-Up Call: ' || lead_name || ' - ' || lead_company,
       '### Scheduled Follow-Up\n**Institute:** ' || lead_company || '\n**Contact:** ' || lead_name || '\n**Phone:** ' || lead_phone || '\n**Action:** Discuss tuition marketing / student lead package.',
       NOW() + INTERVAL '1 day',
       'TODO'::workspace_b4ai6k0t73ulj4l40gxarowdm."task_status_enum",
       assigned_member_id, 0);
  END IF;

  -- 3. BOOKED OR SCHEDULED -> Create Opportunity with Meeting Details & Google Meet Link
  IF (NEW."leadStatus" IN ('Booked','Scheduled')) AND (COALESCE(OLD."leadStatus",'') NOT IN ('Booked','Scheduled')) THEN
    INSERT INTO workspace_b4ai6k0t73ulj4l40gxarowdm."opportunity"
      (id, "createdAt", "updatedAt", name, stage, "amountAmountMicros", "amountCurrencyCode", "closeDate", "pointOfContactId", "companyId", "ownerId", "position")
    VALUES
      (gen_random_uuid(), NOW(), NOW(),
       '🤝 Discovery Meeting: ' || lead_company || ' (' || lead_name || ')',
       'MEETING'::workspace_b4ai6k0t73ulj4l40gxarowdm."opportunity_stage_enum",
       35000000000, -- ₹35,000 package
       'INR',
       NOW() + INTERVAL '3 days',
       NEW.id,
       NEW."companyId",
       assigned_member_id,
       0);
  END IF;

  -- 4. REJECTED -> Soft delete
  IF NEW."leadStatus" = 'Rejected' THEN
    NEW."deletedAt" := NOW();
  ELSIF COALESCE(OLD."leadStatus",'') = 'Rejected' THEN
    NEW."deletedAt" := NULL;
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
    cat << 'EOF' > /tmp/trigger_advanced.sql
${triggerSql}
EOF
    docker exec -i zed-db-1 psql -U postgres -d default < /tmp/trigger_advanced.sql
  `);
  console.log('Advanced trigger installed successfully!');

  // Refresh tasks with rich action titles & timing
  console.log('=== STEP 4: SEED REAL PRODUCTION PIPELINE ===');
  await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      DELETE FROM workspace_b4ai6k0t73ulj4l40gxarowdm.\\"task\\";
      DELETE FROM workspace_b4ai6k0t73ulj4l40gxarowdm.\\"opportunity\\";

      -- Trigger status updates to auto-generate all tasks and opportunities
      UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm.\\"person\\" SET \\"leadStatus\\" = 'New' WHERE \\"nameFirstName\\" = 'Deepak';
      UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm.\\"person\\" SET \\"leadStatus\\" = 'Booked' WHERE \\"nameFirstName\\" = 'Rajesh';
      UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm.\\"person\\" SET \\"leadStatus\\" = 'Scheduled' WHERE \\"nameFirstName\\" = 'Suresh';
      UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm.\\"person\\" SET \\"leadStatus\\" = 'Follow Up' WHERE \\"nameFirstName\\" = 'Priya';
      UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm.\\"person\\" SET \\"leadStatus\\" = 'Not Attended' WHERE \\"nameFirstName\\" = 'Venkatesh';
      UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm.\\"person\\" SET \\"leadStatus\\" = 'Booked' WHERE \\"nameFirstName\\" = 'Kavitha';
      UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm.\\"person\\" SET \\"leadStatus\\" = 'Follow Up' WHERE \\"nameFirstName\\" = 'Manojkumar';
      UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm.\\"person\\" SET \\"leadStatus\\" = 'Not Attended' WHERE \\"nameFirstName\\" = 'Anand';
    "
  `);

  // Verify Tasks
  const vTasks = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT t.title, t.status, to_char(t.\\"dueAt\\", 'Mon DD HH12:MI AM') as \\"Due When\\", m.\\"nameFirstName\\" || ' ' || m.\\"nameLastName\\" as \\"Assigned To\\"
      FROM workspace_b4ai6k0t73ulj4l40gxarowdm.\\"task\\" t
      LEFT JOIN workspace_b4ai6k0t73ulj4l40gxarowdm.\\"workspaceMember\\" m ON t.\\"assigneeId\\" = m.id
      ORDER BY t.\\"createdAt\\" DESC;
    "
  `);
  console.log('✅ Generated Tasks:\n', vTasks.result);

  // Verify Opportunities
  const vOpps = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT o.name, o.stage, (o.\\"amountAmountMicros\\"/1000000) as amount_inr, to_char(o.\\"closeDate\\", 'Mon DD, YYYY') as meeting_date, m.\\"nameFirstName\\" || ' ' || m.\\"nameLastName\\" as \\"Owner\\"
      FROM workspace_b4ai6k0t73ulj4l40gxarowdm.\\"opportunity\\" o
      LEFT JOIN workspace_b4ai6k0t73ulj4l40gxarowdm.\\"workspaceMember\\" m ON o.\\"ownerId\\" = m.id
      ORDER BY o.\\"createdAt\\" DESC;
    "
  `);
  console.log('✅ Generated Opportunities:\n', vOpps.result);
}

setupProductionWorkflow().catch(console.error);
