const { Daytona } = require('@daytona/sdk');

async function setupOpportunitiesTable() {
  const d = new Daytona({ apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef', serverUrl: 'https://app.daytona.io/api' });
  const sb = await d.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  console.log('=== 1. INSPECT OPPORTUNITY FIELD METADATA ===');
  const oppFields = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT id, name, label, type, \\"isActive\\", \\"isUIEditable\\"
      FROM core.\\"fieldMetadata\\"
      WHERE \\"objectMetadataId\\" = '1f6dd180-96d7-4e84-9804-1a342cb20273'
      ORDER BY name;
    "
  `);
  console.log('All Opportunity fields:\n', oppFields.result);

  console.log('=== 2. CONFIGURE CLEAN OPPORTUNITY VIEW COLUMNS ===');
  // Opportunity INDEX view: 44afa993-4577-43fe-810c-cbffdb913ef4
  // Desired Order:
  // 0: Name (Meeting / Deal Name)
  // 1: Stage (Status: Meeting, Proposal, etc.)
  // 2: Amount (Deal Value in ₹)
  // 3: Close Date (Target Date)
  // 4: Point of Contact (Lead Person)
  // 5: Company (Institute)
  // 6: Owner (Assigned To)
  // 7: Creation Date

  await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      DO \\\$\\\$
      DECLARE
        v_opp uuid := '44afa993-4577-43fe-810c-cbffdb913ef4';
        app_id uuid := '26ef5745-b806-4ac9-a365-a23bd0a62d65';
        ws_id uuid := 'bbd12261-90ea-42aa-8893-f15cf1352cea';
      BEGIN
        -- Reset overrides
        UPDATE core.\\"view\\" SET overrides = null WHERE id = v_opp;
        UPDATE core.\\"viewField\\" SET overrides = null WHERE \\"viewId\\" = v_opp;

        -- Hide all first
        UPDATE core.\\"viewField\\" SET \\"isVisible\\" = false WHERE \\"viewId\\" = v_opp;

        -- Show only essential clean fields in order
        UPDATE core.\\"viewField\\" SET \\"isVisible\\" = true, position = 0 
        WHERE \\"viewId\\" = v_opp AND \\"fieldMetadataId\\" IN (SELECT id FROM core.\\"fieldMetadata\\" WHERE name = 'name' AND \\"objectMetadataId\\" = '1f6dd180-96d7-4e84-9804-1a342cb20273');

        UPDATE core.\\"viewField\\" SET \\"isVisible\\" = true, position = 1 
        WHERE \\"viewId\\" = v_opp AND \\"fieldMetadataId\\" IN (SELECT id FROM core.\\"fieldMetadata\\" WHERE name = 'stage' AND \\"objectMetadataId\\" = '1f6dd180-96d7-4e84-9804-1a342cb20273');

        UPDATE core.\\"viewField\\" SET \\"isVisible\\" = true, position = 2 
        WHERE \\"viewId\\" = v_opp AND \\"fieldMetadataId\\" IN (SELECT id FROM core.\\"fieldMetadata\\" WHERE name = 'amount' AND \\"objectMetadataId\\" = '1f6dd180-96d7-4e84-9804-1a342cb20273');

        UPDATE core.\\"viewField\\" SET \\"isVisible\\" = true, position = 3 
        WHERE \\"viewId\\" = v_opp AND \\"fieldMetadataId\\" IN (SELECT id FROM core.\\"fieldMetadata\\" WHERE name = 'closeDate' AND \\"objectMetadataId\\" = '1f6dd180-96d7-4e84-9804-1a342cb20273');

        UPDATE core.\\"viewField\\" SET \\"isVisible\\" = true, position = 4 
        WHERE \\"viewId\\" = v_opp AND \\"fieldMetadataId\\" IN (SELECT id FROM core.\\"fieldMetadata\\" WHERE name = 'pointOfContact' AND \\"objectMetadataId\\" = '1f6dd180-96d7-4e84-9804-1a342cb20273');

        UPDATE core.\\"viewField\\" SET \\"isVisible\\" = true, position = 5 
        WHERE \\"viewId\\" = v_opp AND \\"fieldMetadataId\\" IN (SELECT id FROM core.\\"fieldMetadata\\" WHERE name = 'company' AND \\"objectMetadataId\\" = '1f6dd180-96d7-4e84-9804-1a342cb20273');

        UPDATE core.\\"viewField\\" SET \\"isVisible\\" = true, position = 6 
        WHERE \\"viewId\\" = v_opp AND \\"fieldMetadataId\\" IN (SELECT id FROM core.\\"fieldMetadata\\" WHERE name = 'owner' AND \\"objectMetadataId\\" = '1f6dd180-96d7-4e84-9804-1a342cb20273');

        UPDATE core.\\"viewField\\" SET \\"isVisible\\" = true, position = 7 
        WHERE \\"viewId\\" = v_opp AND \\"fieldMetadataId\\" IN (SELECT id FROM core.\\"fieldMetadata\\" WHERE name = 'createdAt' AND \\"objectMetadataId\\" = '1f6dd180-96d7-4e84-9804-1a342cb20273');

      END \\\$\\\$;
    "
  `);

  console.log('=== 3. UPDATE REAL DISCOVERY MEETINGS & TIMINGS ===');
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

        -- 1. Rajesh Kannan - Aakash
        UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm.\\\"opportunity\\"
        SET 
          name = '🤝 Discovery Meeting: Aakash Institute (Sep 02, 11:00 AM)',
          stage = 'MEETING',
          \\"amountAmountMicros\\" = 35000000000,
          \\"amountCurrencyCode\\" = 'INR',
          \\"closeDate\\" = '2026-09-02 11:00:00+05:30',
          \\"ownerId\\" = admin_id
        WHERE name ILIKE '%Aakash%';

        -- 2. Suresh Ranganathan - FIITJEE
        UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm.\\\"opportunity\\"
        SET 
          name = '🤝 Strategy Call: FIITJEE Chetpet (Sep 03, 03:00 PM)',
          stage = 'MEETING',
          \\"amountAmountMicros\\" = 45000000000,
          \\"amountCurrencyCode\\" = 'INR',
          \\"closeDate\\" = '2026-09-03 15:00:00+05:30',
          \\"ownerId\\" = admin_id
        WHERE name ILIKE '%FIITJEE%';

        -- 3. Kavitha Ramanathan - Shankar IAS
        UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm.\\\"opportunity\\"
        SET 
          name = '🤝 Partnership Demo: Shankar IAS (Sep 04, 02:00 PM)',
          stage = 'MEETING',
          \\"amountAmountMicros\\" = 50000000000,
          \\"amountCurrencyCode\\" = 'INR',
          \\"closeDate\\" = '2026-09-04 14:00:00+05:30',
          \\"ownerId\\" = team_id
        WHERE name ILIKE '%Shankar IAS%';

      END \\\$\\\$;
    "
  `);

  console.log('=== 4. VERIFY FINAL OPPORTUNITIES TABLE ===');
  const vOpps = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT 
        o.name AS \\"Meeting / Deal Name\\",
        o.stage AS \\"Stage\\",
        '₹' || (o.\\"amountAmountMicros\\"/1000000)::text AS \\"Amount (INR)\\",
        to_char(o.\\"closeDate\\", 'Mon DD, YYYY HH12:MI AM') AS \\"Meeting Scheduled Date & Time\\",
        c.name AS \\"Institute / Company\\",
        p.\\"nameFirstName\\" || ' ' || p.\\"nameLastName\\" AS \\"Point of Contact\\",
        m.\\"nameFirstName\\" || ' ' || m.\\"nameLastName\\" AS \\"Assigned Owner\\"
      FROM workspace_b4ai6k0t73ulj4l40gxarowdm.\\"opportunity\\" o
      LEFT JOIN workspace_b4ai6k0t73ulj4l40gxarowdm.\\"company\\" c ON o.\\"companyId\\" = c.id
      LEFT JOIN workspace_b4ai6k0t73ulj4l40gxarowdm.\\"person\\" p ON o.\\"pointOfContactId\\" = p.id
      LEFT JOIN workspace_b4ai6k0t73ulj4l40gxarowdm.\\"workspaceMember\\" m ON o.\\"ownerId\\" = m.id
      ORDER BY o.\\"closeDate\\" ASC;
    "
  `);
  console.log('✅ Final Opportunities View:\n', vOpps.result);

  console.log('Restarting server to ensure view caches are fresh...');
  await sb.process.executeCommand('docker restart zed-server-1');
  await new Promise(r => setTimeout(r, 20000));
}

setupOpportunitiesTable().catch(console.error);
