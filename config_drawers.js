const { Daytona } = require('@daytona/sdk');

async function configureDrawerWidgets() {
  const d = new Daytona({ apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef', serverUrl: 'https://app.daytona.io/api' });
  const sb = await d.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  console.log('=== CONFIGURE PERSON RECORD DRAWER & OPPORTUNITY DRAWER WIDGETS ===');

  await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      DO \\\$\\\$
      DECLARE
        v_person_widget uuid := 'd6e2f67f-3b21-4115-8d4f-0bd5364bfd3e';
        v_opp_widget uuid := '98566099-987b-43c4-bd45-718e0e88b537';
        app_id uuid := '26ef5745-b806-4ac9-a365-a23bd0a62d65';
        ws_id uuid := 'bbd12261-90ea-42aa-8893-f15cf1352cea';
        f_status uuid;
        f_assigned uuid;
        f_opps_rel uuid;
      BEGIN
        -- Clear widget overrides
        UPDATE core.\\"view\\" SET overrides = null WHERE id IN (v_person_widget, v_opp_widget);
        UPDATE core.\\"viewField\\" SET overrides = null WHERE \\"viewId\\" IN (v_person_widget, v_opp_widget);

        -- 1. In Person Side Drawer:
        -- Enable Opportunities relationship so when clicking a lead, you see their linked Opportunity
        SELECT id INTO f_opps_rel FROM core.\\"fieldMetadata\\" WHERE name = 'pointOfContactForOpportunities' AND \\"objectMetadataId\\" = '1e31ee5b-01c5-46e0-88f5-e8de11861be1';
        UPDATE core.\\"viewField\\" SET \\"isVisible\\" = true, position = 0 WHERE \\"viewId\\" = v_person_widget AND \\"fieldMetadataId\\" = f_opps_rel;

        -- Add Status to Person Drawer
        SELECT id INTO f_status FROM core.\\"fieldMetadata\\" WHERE name = 'leadStatus' AND \\"objectMetadataId\\" = '1e31ee5b-01c5-46e0-88f5-e8de11861be1';
        IF f_status IS NOT NULL AND NOT EXISTS (SELECT 1 FROM core.\\"viewField\\" WHERE \\"viewId\\" = v_person_widget AND \\"fieldMetadataId\\" = f_status) THEN
          INSERT INTO core.\\"viewField\\" (id, \\"fieldMetadataId\\", \\"isVisible\\", size, position, \\"viewId\\", \\"workspaceId\\", \\"applicationId\\", \\"universalIdentifier\\", \\"createdAt\\", \\"updatedAt\\")
          VALUES (gen_random_uuid(), f_status, true, 160, 1, v_person_widget, ws_id, app_id, gen_random_uuid(), NOW(), NOW());
        ELSE
          UPDATE core.\\"viewField\\" SET \\"isVisible\\" = true, position = 1 WHERE \\"viewId\\" = v_person_widget AND \\"fieldMetadataId\\" = f_status;
        END IF;

        -- Add Assigned To to Person Drawer
        SELECT id INTO f_assigned FROM core.\\"fieldMetadata\\" WHERE name = 'assignedTo' AND \\"objectMetadataId\\" = '1e31ee5b-01c5-46e0-88f5-e8de11861be1';
        IF f_assigned IS NOT NULL AND NOT EXISTS (SELECT 1 FROM core.\\"viewField\\" WHERE \\"viewId\\" = v_person_widget AND \\"fieldMetadataId\\" = f_assigned) THEN
          INSERT INTO core.\\"viewField\\" (id, \\"fieldMetadataId\\", \\"isVisible\\", size, position, \\"viewId\\", \\"workspaceId\\", \\"applicationId\\", \\"universalIdentifier\\", \\"createdAt\\", \\"updatedAt\\")
          VALUES (gen_random_uuid(), f_assigned, true, 160, 2, v_person_widget, ws_id, app_id, gen_random_uuid(), NOW(), NOW());
        ELSE
          UPDATE core.\\"viewField\\" SET \\"isVisible\\" = true, position = 2 WHERE \\"viewId\\" = v_person_widget AND \\"fieldMetadataId\\" = f_assigned;
        END IF;

        -- 2. In Opportunity Side Drawer:
        -- Ensure all required fields are visible in clean order
        UPDATE core.\\"viewField\\" SET \\"isVisible\\" = true, position = 0 WHERE \\"viewId\\" = v_opp_widget AND \\"fieldMetadataId\\" IN (SELECT id FROM core.\\"fieldMetadata\\" WHERE name = 'amount' AND \\"objectMetadataId\\" = '1f6dd180-96d7-4e84-9804-1a342cb20273');
        UPDATE core.\\"viewField\\" SET \\"isVisible\\" = true, position = 1 WHERE \\"viewId\\" = v_opp_widget AND \\"fieldMetadataId\\" IN (SELECT id FROM core.\\"fieldMetadata\\" WHERE name = 'closeDate' AND \\"objectMetadataId\\" = '1f6dd180-96d7-4e84-9804-1a342cb20273');
        UPDATE core.\\"viewField\\" SET \\"isVisible\\" = true, position = 2 WHERE \\"viewId\\" = v_opp_widget AND \\"fieldMetadataId\\" IN (SELECT id FROM core.\\"fieldMetadata\\" WHERE name = 'stage' AND \\"objectMetadataId\\" = '1f6dd180-96d7-4e84-9804-1a342cb20273');
        UPDATE core.\\"viewField\\" SET \\"isVisible\\" = true, position = 3 WHERE \\"viewId\\" = v_opp_widget AND \\"fieldMetadataId\\" IN (SELECT id FROM core.\\"fieldMetadata\\" WHERE name = 'pointOfContact' AND \\"objectMetadataId\\" = '1f6dd180-96d7-4e84-9804-1a342cb20273');
        UPDATE core.\\"viewField\\" SET \\"isVisible\\" = true, position = 4 WHERE \\"viewId\\" = v_opp_widget AND \\"fieldMetadataId\\" IN (SELECT id FROM core.\\"fieldMetadata\\" WHERE name = 'company' AND \\"objectMetadataId\\" = '1f6dd180-96d7-4e84-9804-1a342cb20273');
        UPDATE core.\\"viewField\\" SET \\"isVisible\\" = true, position = 5 WHERE \\"viewId\\" = v_opp_widget AND \\"fieldMetadataId\\" IN (SELECT id FROM core.\\"fieldMetadata\\" WHERE name = 'owner' AND \\"objectMetadataId\\" = '1f6dd180-96d7-4e84-9804-1a342cb20273');

      END \\\$\\\$;
    "
  `);

  console.log('=== VERIFY UPDATED WIDGET FIELDS ===');

  const vPersonW = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT vf.position, vf.\\"isVisible\\", f.name, f.label
      FROM core.\\"viewField\\" vf
      JOIN core.\\"fieldMetadata\\" f ON vf.\\"fieldMetadataId\\" = f.id
      WHERE vf.\\"viewId\\" = 'd6e2f67f-3b21-4115-8d4f-0bd5364bfd3e' AND vf.\\"isVisible\\" = true
      ORDER BY vf.position;
    "
  `);
  console.log('Person Drawer Fields:\n', vPersonW.result);

  const vOppW = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT vf.position, vf.\\"isVisible\\", f.name, f.label
      FROM core.\\"viewField\\" vf
      JOIN core.\\"fieldMetadata\\" f ON vf.\\"fieldMetadataId\\" = f.id
      WHERE vf.\\"viewId\\" = '98566099-987b-43c4-bd45-718e0e88b537' AND vf.\\"isVisible\\" = true
      ORDER BY vf.position;
    "
  `);
  console.log('Opportunity Drawer Fields:\n', vOppW.result);

  console.log('Restarting server to apply drawer changes...');
  await sb.process.executeCommand('docker restart zed-server-1');
  await new Promise(r => setTimeout(r, 20000));
}

configureDrawerWidgets().catch(console.error);
