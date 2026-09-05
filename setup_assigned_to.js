const { Daytona } = require('@daytona/sdk');

async function setupAssignedToFieldAndCleanLeads() {
  const d = new Daytona({ apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef', serverUrl: 'https://app.daytona.io/api' });
  const sb = await d.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  console.log('=== STEP 1: DELETE TEST/DUMMY LEADS ===');
  await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      DELETE FROM workspace_b4ai6k0t73ulj4l40gxarowdm.\\"person\\"
      WHERE \\"emailsPrimaryEmail\\" ILIKE '%citchennai.net%' OR \\"nameFirstName\\" ILIKE '%Bkarthikeyan%' OR \\"nameFirstName\\" = '';
    "
  `);

  console.log('=== STEP 2: CREATE / LINK accountOwner (Assigned To) ON PERSON METADATA ===');
  // Check if relation or field exists for accountOwner on Person
  const fCheck = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT id, name, label, type FROM core.\\"fieldMetadata\\"
      WHERE \\"objectMetadataId\\" = '1e31ee5b-01c5-46e0-88f5-e8de11861be1' AND name IN ('accountOwner', 'assignedTo', 'leadStatus');
    "
  `);
  console.log('Existing person fields:\n', fCheck.result);

  // Check company accountOwner as reference
  const companyOwnerRef = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT * FROM core.\\"fieldMetadata\\"
      WHERE name = 'accountOwner' AND \\"objectMetadataId\\" = 'a46cb47f-6e54-4732-977f-e40bfe6f4910';
    "
  `);
  console.log('Company accountOwner ref:\n', companyOwnerRef.result);

  // Let's create accountOwner on Person object if missing
  await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      DO \\\$\\\$
      DECLARE
        app_id uuid;
        ws_id uuid;
        new_fid uuid := gen_random_uuid();
      BEGIN
        SELECT \\"applicationId\\", \\"workspaceId\\" INTO app_id, ws_id
        FROM core.\\"fieldMetadata\\" WHERE \\"objectMetadataId\\" = '1e31ee5b-01c5-46e0-88f5-e8de11861be1' LIMIT 1;

        IF NOT EXISTS (SELECT 1 FROM core.\\"fieldMetadata\\" WHERE name = 'accountOwner' AND \\"objectMetadataId\\" = '1e31ee5b-01c5-46e0-88f5-e8de11861be1') THEN
          INSERT INTO core.\\"fieldMetadata\\"
            (id, \\"objectMetadataId\\", type, name, label, \\"defaultValue\\", settings, \\"isActive\\\", \\"isSystem\\\", \\"isUIReadOnly\\\", \\"isUIEditable\\\", \\"isNullable\\\", \\"workspaceId\\\", \\"universalIdentifier\\\", \\"applicationId\\\", \\"createdAt\\\", \\"updatedAt\\", options)
          VALUES
            (new_fid, '1e31ee5b-01c5-46e0-88f5-e8de11861be1', 'RELATION', 'accountOwner', 'Assigned To', null, '{\\\"relationType\\\": \\\"MANY_TO_ONE\\\", \\\"targetObjectMetadataId\\\": \\\"05d3cb86-2187-43cf-9f17-d29b28b74737\\\"}', true, false, false, true, true, ws_id, gen_random_uuid(), app_id, NOW(), NOW(), null);
        END IF;
      END \\\$\\\$;
    "
  `);

  console.log('=== STEP 3: CONFIGURE PEOPLE VIEW COLUMNS WITH ASSIGNED TO ===');
  await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      DO \\\$\\\$
      DECLARE
        v_person uuid := '0df54d67-bd33-497d-a501-143fb04ec056';
        app_id uuid := '26ef5745-b806-4ac9-a365-a23bd0a62d65';
        ws_id uuid := 'bbd12261-90ea-42aa-8893-f15cf1352cea';
        f_owner uuid;
      BEGIN
        SELECT id INTO f_owner FROM core.\\"fieldMetadata\\" WHERE name = 'accountOwner' AND \\"objectMetadataId\\" = '1e31ee5b-01c5-46e0-88f5-e8de11861be1' LIMIT 1;

        -- Ensure viewField exists for accountOwner
        IF f_owner IS NOT NULL AND NOT EXISTS (SELECT 1 FROM core.\\"viewField\\" WHERE \\"viewId\\" = v_person AND \\"fieldMetadataId\\" = f_owner) THEN
          INSERT INTO core.\\"viewField\\" (id, \\"fieldMetadataId\\", \\"isVisible\\", size, position, \\"viewId\\", \\"workspaceId\\", \\"applicationId\\", \\"universalIdentifier\\", \\"createdAt\\", \\"updatedAt\\")
          VALUES (gen_random_uuid(), f_owner, true, 160, 6, v_person, ws_id, app_id, gen_random_uuid(), NOW(), NOW());
        ELSE
          UPDATE core.\\"viewField\\" SET \\"isVisible\\" = true, position = 6 WHERE \\"viewId\\" = v_person AND \\"fieldMetadataId\\" = f_owner;
        END IF;

        -- Set clean layout:
        -- 0: Name | 1: Emails | 2: Phones | 3: Company | 4: Job Title | 5: Status | 6: Assigned To | 7: Creation Date
        UPDATE core.\\"viewField\\" SET \\"isVisible\\" = true, position = 0 WHERE \\"viewId\\" = v_person AND \\"fieldMetadataId\\" IN (SELECT id FROM core.\\"fieldMetadata\\" WHERE name = 'name' AND \\"objectMetadataId\\" = '1e31ee5b-01c5-46e0-88f5-e8de11861be1');
        UPDATE core.\\"viewField\\" SET \\"isVisible\\" = true, position = 1 WHERE \\"viewId\\" = v_person AND \\"fieldMetadataId\\" IN (SELECT id FROM core.\\"fieldMetadata\\" WHERE name = 'emails' AND \\"objectMetadataId\\" = '1e31ee5b-01c5-46e0-88f5-e8de11861be1');
        UPDATE core.\\"viewField\\" SET \\"isVisible\\" = true, position = 2 WHERE \\"viewId\\" = v_person AND \\"fieldMetadataId\\" IN (SELECT id FROM core.\\"fieldMetadata\\" WHERE name = 'phones' AND \\"objectMetadataId\\" = '1e31ee5b-01c5-46e0-88f5-e8de11861be1');
        UPDATE core.\\"viewField\\" SET \\"isVisible\\" = true, position = 3 WHERE \\"viewId\\" = v_person AND \\"fieldMetadataId\\" IN (SELECT id FROM core.\\"fieldMetadata\\" WHERE name = 'company' AND \\"objectMetadataId\\" = '1e31ee5b-01c5-46e0-88f5-e8de11861be1');
        UPDATE core.\\"viewField\\" SET \\"isVisible\\" = true, position = 4 WHERE \\"viewId\\" = v_person AND \\"fieldMetadataId\\" IN (SELECT id FROM core.\\"fieldMetadata\\" WHERE name = 'jobTitle' AND \\"objectMetadataId\\" = '1e31ee5b-01c5-46e0-88f5-e8de11861be1');
        UPDATE core.\\"viewField\\" SET \\"isVisible\\" = true, position = 5 WHERE \\"viewId\\" = v_person AND \\"fieldMetadataId\\" IN (SELECT id FROM core.\\"fieldMetadata\\" WHERE name = 'leadStatus' AND \\"objectMetadataId\\" = '1e31ee5b-01c5-46e0-88f5-e8de11861be1');
        UPDATE core.\\"viewField\\" SET \\"isVisible\\" = true, position = 7 WHERE \\"viewId\\" = v_person AND \\"fieldMetadataId\\" IN (SELECT id FROM core.\\"fieldMetadata\\" WHERE name = 'createdAt' AND \\"objectMetadataId\\" = '1e31ee5b-01c5-46e0-88f5-e8de11861be1');
      END \\\$\\\$;
    "
  `);

  console.log('=== STEP 4: ASSIGN REAL LEADS TO TEAM MEMBERS ===');
  await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      DO \\\$\\\$
      DECLARE
        admin_id uuid;
        team_id uuid;
      BEGIN
        SELECT id INTO admin_id FROM workspace_b4ai6k0t73ulj4l40gxarowdm.\\\"workspaceMember\\\" 
        WHERE \\\"nameFirstName\\\" ILIKE '%Karthik%' OR \\\"nameLastName\\\" ILIKE '%Admin%' LIMIT 1;

        SELECT id INTO team_id FROM workspace_b4ai6k0t73ulj4l40gxarowdm.\\\"workspaceMember\\\" 
        WHERE id != admin_id LIMIT 1;

        IF team_id IS NULL THEN team_id := admin_id; END IF;

        -- Assign 4 leads to Karthik (Admin)
        UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm.\\\"person\\\"
        SET \\\"accountOwnerId\\\" = admin_id
        WHERE \\\"nameFirstName\\\" IN ('Rajesh', 'Suresh', 'Deepak', 'Anand');

        -- Assign 4 leads to Team Member
        UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm.\\\"person\\\"
        SET \\\"accountOwnerId\\\" = team_id
        WHERE \\\"nameFirstName\\\" IN ('Priya', 'Kavitha', 'Manojkumar', 'Venkatesh');

      END \\\$\\\$;
    "
  `);

  console.log('=== STEP 5: VERIFY FINAL PEOPLE TABLE ===');
  const vPeople = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT 
        p.\\\"nameFirstName\\\" || ' ' || p.\\"nameLastName\\" AS \\"Lead Name\\",
        c.name AS \\"Institute / Company\\",
        p.\\"phonesPrimaryPhoneNumber\\" AS \\"Phone\\",
        p.\\"jobTitle\\" AS \\"Job Title\\",
        p.\\"leadStatus\\" AS \\"Status (Stage)\\",
        m.\\"nameFirstName\\" || ' ' || m.\\"nameLastName\\" AS \\"Assigned To (Caller)\\"
      FROM workspace_b4ai6k0t73ulj4l40gxarowdm.\\"person\\" p
      LEFT JOIN workspace_b4ai6k0t73ulj4l40gxarowdm.\\"company\\" c ON p.\\"companyId\\" = c.id
      LEFT JOIN workspace_b4ai6k0t73ulj4l40gxarowdm.\\"workspaceMember\\" m ON p.\\"accountOwnerId\\" = m.id
      WHERE p.\\"deletedAt\\" IS NULL
      ORDER BY p.\\"createdAt\\" DESC;
    "
  `);
  console.log('✅ Final Clean Leads Table:\n', vPeople.result);

  console.log('Restarting server to clear metadata caches...');
  await sb.process.executeCommand('docker restart zed-server-1');
  await new Promise(r => setTimeout(r, 20000));
}

setupAssignedToFieldAndCleanLeads().catch(console.error);
