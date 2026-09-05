const { Daytona } = require('@daytona/sdk');

async function syncPeopleFieldsToOpportunities() {
  const d = new Daytona({ apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef', serverUrl: 'https://app.daytona.io/api' });
  const sb = await d.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  console.log('=== 1. ADD PHONES, EMAILS, JOB TITLE TO OPPORTUNITY SCHEMA & METADATA ===');
  
  await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      -- Add columns to opportunity table
      ALTER TABLE workspace_b4ai6k0t73ulj4l40gxarowdm.\\"opportunity\\" 
        ADD COLUMN IF NOT EXISTS \\"phones\\" text,
        ADD COLUMN IF NOT EXISTS \\"emails\\" text,
        ADD COLUMN IF NOT EXISTS \\"jobTitle\\" text;

      -- Sync values from linked point of contact (person)
      UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm.\\"opportunity\\" o
      SET 
        \\"phones\\" = p.\\"phonesPrimaryPhoneNumber\\",
        \\"emails\\" = p.\\"emailsPrimaryEmail\\",
        \\"jobTitle\\" = p.\\"jobTitle\\"
      FROM workspace_b4ai6k0t73ulj4l40gxarowdm.\\"person\\" p
      WHERE o.\\"pointOfContactId\\" = p.id;
    "
  `);

  console.log('=== 2. ADD FIELD METADATA FOR PHONES, EMAILS, JOB TITLE ON OPPORTUNITY ===');
  await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      DO \\\$\\\$
      DECLARE
        app_id uuid;
        ws_id uuid;
        f_phones uuid := gen_random_uuid();
        f_emails uuid := gen_random_uuid();
        f_job uuid := gen_random_uuid();
        v_opp uuid := '44afa993-4577-43fe-810c-cbffdb913ef4';
      BEGIN
        SELECT \\"applicationId\\", \\"workspaceId\\" INTO app_id, ws_id
        FROM core.\\"fieldMetadata\\" WHERE \\"objectMetadataId\\" = '1f6dd180-96d7-4e84-9804-1a342cb20273' LIMIT 1;

        -- 1. Phones
        IF NOT EXISTS (SELECT 1 FROM core.\\"fieldMetadata\\" WHERE name = 'phones' AND \\"objectMetadataId\\" = '1f6dd180-96d7-4e84-9804-1a342cb20273') THEN
          INSERT INTO core.\\"fieldMetadata\\"
            (id, \\"objectMetadataId\\", type, name, label, \\"defaultValue\\", settings, \\"isActive\\", \\"isSystem\\", \\"isUIReadOnly\\\", \\"isUIEditable\\\", \\"isNullable\\\", \\"workspaceId\\\", \\"universalIdentifier\\\", \\"applicationId\\\", \\"createdAt\\\", \\"updatedAt\\", options)
          VALUES
            (f_phones, '1f6dd180-96d7-4e84-9804-1a342cb20273', 'TEXT', 'phones', 'Phones', null, null, true, false, false, true, true, ws_id, gen_random_uuid(), app_id, NOW(), NOW(), null);
        ELSE
          SELECT id INTO f_phones FROM core.\\"fieldMetadata\\" WHERE name = 'phones' AND \\"objectMetadataId\\" = '1f6dd180-96d7-4e84-9804-1a342cb20273';
        END IF;

        -- 2. Emails
        IF NOT EXISTS (SELECT 1 FROM core.\\"fieldMetadata\\" WHERE name = 'emails' AND \\"objectMetadataId\\" = '1f6dd180-96d7-4e84-9804-1a342cb20273') THEN
          INSERT INTO core.\\"fieldMetadata\\"
            (id, \\"objectMetadataId\\", type, name, label, \\"defaultValue\\", settings, \\"isActive\\", \\"isSystem\\", \\"isUIReadOnly\\\", \\"isUIEditable\\\", \\"isNullable\\\", \\"workspaceId\\\", \\"universalIdentifier\\\", \\"applicationId\\\", \\"createdAt\\\", \\"updatedAt\\", options)
          VALUES
            (f_emails, '1f6dd180-96d7-4e84-9804-1a342cb20273', 'TEXT', 'emails', 'Emails', null, null, true, false, false, true, true, ws_id, gen_random_uuid(), app_id, NOW(), NOW(), null);
        ELSE
          SELECT id INTO f_emails FROM core.\\"fieldMetadata\\" WHERE name = 'emails' AND \\"objectMetadataId\\" = '1f6dd180-96d7-4e84-9804-1a342cb20273';
        END IF;

        -- 3. Job Title
        IF NOT EXISTS (SELECT 1 FROM core.\\"fieldMetadata\\" WHERE name = 'jobTitle' AND \\"objectMetadataId\\" = '1f6dd180-96d7-4e84-9804-1a342cb20273') THEN
          INSERT INTO core.\\"fieldMetadata\\"
            (id, \\"objectMetadataId\\", type, name, label, \\"defaultValue\\", settings, \\"isActive\\", \\"isSystem\\", \\"isUIReadOnly\\\", \\"isUIEditable\\\", \\"isNullable\\\", \\"workspaceId\\\", \\"universalIdentifier\\\", \\"applicationId\\\", \\"createdAt\\\", \\"updatedAt\\", options)
          VALUES
            (f_job, '1f6dd180-96d7-4e84-9804-1a342cb20273', 'TEXT', 'jobTitle', 'Job Title', null, null, true, false, false, true, true, ws_id, gen_random_uuid(), app_id, NOW(), NOW(), null);
        ELSE
          SELECT id INTO f_job FROM core.\\"fieldMetadata\\" WHERE name = 'jobTitle' AND \\"objectMetadataId\\" = '1f6dd180-96d7-4e84-9804-1a342cb20273';
        END IF;

        -- Clear view overrides
        UPDATE core.\\"view\\" SET overrides = null WHERE id = v_opp;
        UPDATE core.\\"viewField\\" SET overrides = null WHERE \\"viewId\\" = v_opp;

        -- Configure ordered viewFields:
        -- 0: Name (Deal / Meeting Title)
        -- 1: Stage
        -- 2: Point of Contact (Lead Director / Person)
        -- 3: Phones
        -- 4: Emails
        -- 5: Company (Coaching Center / Institute)
        -- 6: Job Title
        -- 7: Amount (INR)
        -- 8: Meeting Scheduled Date & Time
        -- 9: Assigned Owner

        UPDATE core.\\"viewField\\" SET \\"isVisible\\" = false WHERE \\"viewId\\" = v_opp;

        UPDATE core.\\"viewField\\" SET \\"isVisible\\" = true, position = 0 
        WHERE \\"viewId\\" = v_opp AND \\"fieldMetadataId\\" IN (SELECT id FROM core.\\"fieldMetadata\\" WHERE name = 'name' AND \\"objectMetadataId\\" = '1f6dd180-96d7-4e84-9804-1a342cb20273');

        UPDATE core.\\"viewField\\" SET \\"isVisible\\" = true, position = 1 
        WHERE \\"viewId\\" = v_opp AND \\"fieldMetadataId\\" IN (SELECT id FROM core.\\"fieldMetadata\\" WHERE name = 'stage' AND \\"objectMetadataId\\" = '1f6dd180-96d7-4e84-9804-1a342cb20273');

        UPDATE core.\\"viewField\\" SET \\"isVisible\\" = true, position = 2 
        WHERE \\"viewId\\" = v_opp AND \\"fieldMetadataId\\" IN (SELECT id FROM core.\\"fieldMetadata\\" WHERE name = 'pointOfContact' AND \\"objectMetadataId\\" = '1f6dd180-96d7-4e84-9804-1a342cb20273');

        -- Insert or update viewField for phones
        IF NOT EXISTS (SELECT 1 FROM core.\\"viewField\\" WHERE \\"viewId\\" = v_opp AND \\"fieldMetadataId\\" = f_phones) THEN
          INSERT INTO core.\\"viewField\\" (id, \\"fieldMetadataId\\", \\"isVisible\\", size, position, \\"viewId\\", \\"workspaceId\\", \\"applicationId\\", \\"universalIdentifier\\", \\"createdAt\\", \\"updatedAt\\")
          VALUES (gen_random_uuid(), f_phones, true, 140, 3, v_opp, ws_id, app_id, gen_random_uuid(), NOW(), NOW());
        ELSE
          UPDATE core.\\"viewField\\" SET \\"isVisible\\" = true, position = 3 WHERE \\"viewId\\" = v_opp AND \\"fieldMetadataId\\" = f_phones;
        END IF;

        -- Insert or update viewField for emails
        IF NOT EXISTS (SELECT 1 FROM core.\\"viewField\\" WHERE \\"viewId\\" = v_opp AND \\"fieldMetadataId\\" = f_emails) THEN
          INSERT INTO core.\\"viewField\\" (id, \\"fieldMetadataId\\", \\"isVisible\\", size, position, \\"viewId\\", \\"workspaceId\\", \\"applicationId\\", \\"universalIdentifier\\", \\"createdAt\\", \\"updatedAt\\")
          VALUES (gen_random_uuid(), f_emails, true, 180, 4, v_opp, ws_id, app_id, gen_random_uuid(), NOW(), NOW());
        ELSE
          UPDATE core.\\"viewField\\" SET \\"isVisible\\" = true, position = 4 WHERE \\"viewId\\" = v_opp AND \\"fieldMetadataId\\" = f_emails;
        END IF;

        UPDATE core.\\"viewField\\" SET \\"isVisible\\" = true, position = 5 
        WHERE \\"viewId\\" = v_opp AND \\"fieldMetadataId\\" IN (SELECT id FROM core.\\"fieldMetadata\\" WHERE name = 'company' AND \\"objectMetadataId\\" = '1f6dd180-96d7-4e84-9804-1a342cb20273');

        -- Insert or update viewField for jobTitle
        IF NOT EXISTS (SELECT 1 FROM core.\\"viewField\\" WHERE \\"viewId\\" = v_opp AND \\"fieldMetadataId\\" = f_job) THEN
          INSERT INTO core.\\"viewField\\" (id, \\"fieldMetadataId\\", \\"isVisible\\", size, position, \\"viewId\\", \\"workspaceId\\", \\"applicationId\\", \\"universalIdentifier\\", \\"createdAt\\", \\"updatedAt\\")
          VALUES (gen_random_uuid(), f_job, true, 160, 6, v_opp, ws_id, app_id, gen_random_uuid(), NOW(), NOW());
        ELSE
          UPDATE core.\\"viewField\\" SET \\"isVisible\\" = true, position = 6 WHERE \\"viewId\\" = v_opp AND \\"fieldMetadataId\\" = f_job;
        END IF;

        UPDATE core.\\"viewField\\" SET \\"isVisible\\" = true, position = 7 
        WHERE \\"viewId\\" = v_opp AND \\"fieldMetadataId\\" IN (SELECT id FROM core.\\"fieldMetadata\\" WHERE name = 'amount' AND \\"objectMetadataId\\" = '1f6dd180-96d7-4e84-9804-1a342cb20273');

        UPDATE core.\\"viewField\\" SET \\"isVisible\\" = true, position = 8 
        WHERE \\"viewId\\" = v_opp AND \\"fieldMetadataId\\" IN (SELECT id FROM core.\\"fieldMetadata\\" WHERE name = 'closeDate' AND \\"objectMetadataId\\" = '1f6dd180-96d7-4e84-9804-1a342cb20273');

        UPDATE core.\\"viewField\\" SET \\"isVisible\\" = true, position = 9 
        WHERE \\"viewId\\" = v_opp AND \\"fieldMetadataId\\" IN (SELECT id FROM core.\\"fieldMetadata\\" WHERE name = 'owner' AND \\"objectMetadataId\\" = '1f6dd180-96d7-4e84-9804-1a342cb20273');

      END \\\$\\\$;
    "
  `);

  console.log('=== 3. UPDATE AUTO-TRIGGER TO POPULATE PHONES, EMAILS, JOBTITLE ON NEW OPPORTUNITIES ===');
  const triggerSql = `
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
  IF lead_company IS NULL THEN lead_company := 'Education Lead'; END IF;

  -- 1. NOT ATTENDED -> 3 Hours
  IF NEW."leadStatus" = 'Not Attended' AND (COALESCE(OLD."leadStatus",'') != 'Not Attended') THEN
    INSERT INTO workspace_b4ai6k0t73ulj4l40gxarowdm."task"
      (id, "createdAt", "updatedAt", title, "bodyV2Markdown", "dueAt", status, "assigneeId", "position")
    VALUES
      (gen_random_uuid(), NOW(), NOW(),
       '📞 Call Back (No Answer): ' || lead_name || ' (' || lead_phone || ')',
       '### Lead Call Back Required\n**Institute:** ' || lead_company || '\n**Contact:** ' || lead_name || '\n**Phone:** ' || lead_phone,
       NOW() + INTERVAL '3 hours',
       'TODO'::workspace_b4ai6k0t73ulj4l40gxarowdm."task_status_enum",
       assigned_member_id, 0);
  END IF;

  -- 2. FOLLOW UP -> 24 Hours
  IF NEW."leadStatus" = 'Follow Up' AND (COALESCE(OLD."leadStatus",'') != 'Follow Up') THEN
    INSERT INTO workspace_b4ai6k0t73ulj4l40gxarowdm."task"
      (id, "createdAt", "updatedAt", title, "bodyV2Markdown", "dueAt", status, "assigneeId", "position")
    VALUES
      (gen_random_uuid(), NOW(), NOW(),
       '🗓️ Follow-Up Call: ' || lead_name || ' - ' || lead_company,
       '### Scheduled Follow-Up\n**Institute:** ' || lead_company || '\n**Contact:** ' || lead_name || '\n**Phone:** ' || lead_phone,
       NOW() + INTERVAL '1 day',
       'TODO'::workspace_b4ai6k0t73ulj4l40gxarowdm."task_status_enum",
       assigned_member_id, 0);
  END IF;

  -- 3. BOOKED OR SCHEDULED -> Opportunity with full Lead Details
  IF (NEW."leadStatus" IN ('Booked','Scheduled')) AND (COALESCE(OLD."leadStatus",'') NOT IN ('Booked','Scheduled')) THEN
    INSERT INTO workspace_b4ai6k0t73ulj4l40gxarowdm."opportunity"
      (id, "createdAt", "updatedAt", name, stage, "amountAmountMicros", "amountCurrencyCode", "closeDate", "pointOfContactId", "companyId", "ownerId", "position", "phones", "emails", "jobTitle")
    VALUES
      (gen_random_uuid(), NOW(), NOW(),
       '🤝 Discovery Meeting: ' || lead_company,
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
    cat << 'EOF' > /tmp/trigger_full_opp.sql
${triggerSql}
EOF
    docker exec -i zed-db-1 psql -U postgres -d default < /tmp/trigger_full_opp.sql
  `);

  console.log('=== 4. VERIFY FINAL SYNCHRONIZED OPPORTUNITIES ===');
  const vOpps = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT 
        o.name AS \\"Deal / Meeting\\",
        o.stage AS \\"Stage\\",
        p.\\"nameFirstName\\" || ' ' || p.\\"nameLastName\\" AS \\"Point of Contact\\",
        o.phones AS \\"Phones\\",
        o.emails AS \\"Emails\\",
        c.name AS \\"Company\\",
        o.\\"jobTitle\\" AS \\"Job Title\\",
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
  console.log('✅ Final Opportunities with People Fields:\n', vOpps.result);

  console.log('Restarting server to recompile GraphQL metadata...');
  await sb.process.executeCommand('docker restart zed-server-1');
  await new Promise(r => setTimeout(r, 22000));
}

syncPeopleFieldsToOpportunities().catch(console.error);
