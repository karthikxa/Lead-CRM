const { Daytona } = require('@daytona/sdk');

async function cleanAndProfessionalize() {
  const d = new Daytona({ apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef', serverUrl: 'https://app.daytona.io/api' });
  const sb = await d.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  console.log('=== 1. UPDATE TRIGGER FOR PROFESSIONAL CLEAN NAMES (NO EMOJIS) ===');

  const cleanTriggerSql = `
CREATE OR REPLACE FUNCTION workspace_b4ai6k0t73ulj4l40gxarowdm.handle_person_status_trigger()
RETURNS TRIGGER AS $$
DECLARE
  admin_member_id uuid;
  assigned_member_id uuid;
  lead_name text;
  lead_phone text;
  lead_email text;
  lead_job text;
  lead_company text;
BEGIN
  SELECT id INTO admin_member_id FROM workspace_b4ai6k0t73ulj4l40gxarowdm."workspaceMember" 
  WHERE "nameLastName" ILIKE '%Admin%' OR "nameFirstName" ILIKE '%Karthik%' LIMIT 1;

  assigned_member_id := COALESCE(NEW."accountOwnerId", admin_member_id);
  lead_name := TRIM(COALESCE(NEW."nameFirstName",'') || ' ' || COALESCE(NEW."nameLastName",''));
  IF lead_name = '' THEN lead_name := COALESCE(NEW."emailsPrimaryEmail",'Lead'); END IF;
  lead_phone := COALESCE(NEW."phonesPrimaryPhoneNumber", '');
  lead_email := COALESCE(NEW."emailsPrimaryEmail", '');
  lead_job := COALESCE(NEW."jobTitle", 'Director');

  SELECT name INTO lead_company FROM workspace_b4ai6k0t73ulj4l40gxarowdm."company" WHERE id = NEW."companyId" LIMIT 1;
  IF lead_company IS NULL THEN lead_company := 'Educational Institution'; END IF;

  -- 1. NOT ATTENDED -> Professional Call Back Task (3 Hours)
  IF NEW."leadStatus" = 'Not Attended' AND (COALESCE(OLD."leadStatus",'') != 'Not Attended') THEN
    INSERT INTO workspace_b4ai6k0t73ulj4l40gxarowdm."task"
      (id, "createdAt", "updatedAt", title, "bodyV2Markdown", "dueAt", status, "assigneeId", "position")
    VALUES
      (gen_random_uuid(), NOW(), NOW(),
       'Call Back: ' || lead_name || ' (' || lead_company || ')',
       '### Lead Call Back Required\n**Institute:** ' || lead_company || '\n**Contact:** ' || lead_name || '\n**Phone:** ' || lead_phone || '\n**Status:** Lead did not attend initial call. Re-attempt contact.',
       NOW() + INTERVAL '3 hours',
       'TODO'::workspace_b4ai6k0t73ulj4l40gxarowdm."task_status_enum",
       assigned_member_id, 0);
  END IF;

  -- 2. FOLLOW UP -> Professional Follow Up Task (24 Hours)
  IF NEW."leadStatus" = 'Follow Up' AND (COALESCE(OLD."leadStatus",'') != 'Follow Up') THEN
    INSERT INTO workspace_b4ai6k0t73ulj4l40gxarowdm."task"
      (id, "createdAt", "updatedAt", title, "bodyV2Markdown", "dueAt", status, "assigneeId", "position")
    VALUES
      (gen_random_uuid(), NOW(), NOW(),
       'Follow Up: ' || lead_name || ' (' || lead_company || ')',
       '### Scheduled Follow-Up\n**Institute:** ' || lead_company || '\n**Contact:** ' || lead_name || '\n**Phone:** ' || lead_phone || '\n**Action:** Discuss tuition marketing proposal and student acquisition program.',
       NOW() + INTERVAL '1 day',
       'TODO'::workspace_b4ai6k0t73ulj4l40gxarowdm."task_status_enum",
       assigned_member_id, 0);
  END IF;

  -- 3. BOOKED OR SCHEDULED -> Professional Opportunity (Clean Title, Amount, Timings)
  IF (NEW."leadStatus" IN ('Booked','Scheduled')) AND (COALESCE(OLD."leadStatus",'') NOT IN ('Booked','Scheduled')) THEN
    INSERT INTO workspace_b4ai6k0t73ulj4l40gxarowdm."opportunity"
      (id, "createdAt", "updatedAt", name, stage, "amountAmountMicros", "amountCurrencyCode", "closeDate", "pointOfContactId", "companyId", "ownerId", "position", "phones", "emails", "jobTitle")
    VALUES
      (gen_random_uuid(), NOW(), NOW(),
       lead_company || ' - Discovery Meeting',
       'MEETING'::workspace_b4ai6k0t73ulj4l40gxarowdm."opportunity_stage_enum",
       35000000000,
       'INR',
       NOW() + INTERVAL '3 days',
       NEW.id,
       NEW."companyId",
       assigned_member_id,
       0,
       lead_phone,
       lead_email,
       lead_job);
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
`;

  await sb.process.executeCommand(`
    cat << 'EOF' > /tmp/clean_trigger.sql
${cleanTriggerSql}
EOF
    docker exec -i zed-db-1 psql -U postgres -d default < /tmp/clean_trigger.sql
  `);

  console.log('=== 2. CLEAN EXISTING OPPORTUNITY & TASK NAMES (REMOVE EMOJIS) ===');

  await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      -- Clean Opportunities
      UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm.\\"opportunity\\"
      SET name = 'Aakash Educational Services - Discovery Meeting'
      WHERE name ILIKE '%Aakash%';

      UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm.\\"opportunity\\"
      SET name = 'FIITJEE Chennai - Strategy Call'
      WHERE name ILIKE '%FIITJEE%';

      UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm.\\"opportunity\\"
      SET name = 'Shankar IAS Academy - Partnership Meeting'
      WHERE name ILIKE '%Shankar IAS%';

      -- Clean Tasks
      UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm.\\"task\\"
      SET title = regexp_replace(title, '^[📞🗓️\\s]+', '');
    "
  `);

  console.log('=== 3. VERIFY CLEANED DATA ===');

  const vOpps = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT 
        o.name AS \\"Meeting / Deal Name\\",
        o.stage AS \\"Stage\\",
        p.\\"nameFirstName\\" || ' ' || p.\\"nameLastName\\" AS \\"Point of Contact\\",
        o.phones AS \\"Phone\\",
        o.emails AS \\"Email\\",
        c.name AS \\"Company\\",
        '₹' || (o.\\"amountAmountMicros\\"/1000000)::text AS \\"Amount (INR)\\",
        to_char(o.\\"closeDate\\", 'Mon DD, YYYY HH12:MI AM') AS \\"Meeting Scheduled Date & Time\\",
        m.\\"nameFirstName\\" || ' ' || m.\\"nameLastName\\" AS \\"Assigned Owner\\"
      FROM workspace_b4ai6k0t73ulj4l40gxarowdm.\\"opportunity\\" o
      LEFT JOIN workspace_b4ai6k0t73ulj4l40gxarowdm.\\"company\\" c ON o.\\"companyId\\" = c.id
      LEFT JOIN workspace_b4ai6k0t73ulj4l40gxarowdm.\\"person\\" p ON o.\\"pointOfContactId\\" = p.id
      LEFT JOIN workspace_b4ai6k0t73ulj4l40gxarowdm.\\"workspaceMember\\" m ON o.\\"ownerId\\" = m.id
      ORDER BY o.\\"closeDate\\" ASC;
    "
  `);
  console.log('✅ Clean Opportunities:\n', vOpps.result);

  const vTasks = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT t.title, t.status, to_char(t.\\"dueAt\\", 'Mon DD HH12:MI AM') as \\"Due When\\", m.\\"nameFirstName\\" || ' ' || m.\\"nameLastName\\" as \\"Assigned To\\"
      FROM workspace_b4ai6k0t73ulj4l40gxarowdm.\\"task\\" t
      LEFT JOIN workspace_b4ai6k0t73ulj4l40gxarowdm.\\"workspaceMember\\" m ON t.\\"assigneeId\\" = m.id
      ORDER BY t.\\"createdAt\\" DESC;
    "
  `);
  console.log('✅ Clean Tasks:\n', vTasks.result);
}

cleanAndProfessionalize().catch(console.error);
