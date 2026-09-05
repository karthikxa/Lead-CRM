const { Daytona } = require('@daytona/sdk');

async function fixRelationMetadata() {
  const d = new Daytona({ apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef', serverUrl: 'https://app.daytona.io/api' });
  const sb = await d.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  // Let's check relationMetadata table
  const rels = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT * FROM core.\\"relationMetadata\\" LIMIT 5;
    "
  `);
  console.log('relationMetadata sample:\n', rels.result);

  // In Twenty CRM, creating a RELATION requires entries in core.relationMetadata or proper metadata schema
  // Instead of an incomplete RELATION field that breaks GraphQL metadata validation:
  // We should either:
  // 1. Delete the raw RELATION field from core.fieldMetadata if incomplete
  // 2. OR create a clean TEXT/SELECT field OR complete relationMetadata entry!
  // Let's see what happened with accountOwner on Person:
  
  await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      -- Remove the incomplete accountOwner field from core.fieldMetadata that broke relation validation
      DELETE FROM core.\\"viewField\\" WHERE \\"fieldMetadataId\\" IN (
        SELECT id FROM core.\\"fieldMetadata\\" WHERE name = 'accountOwner' AND \\"objectMetadataId\\" = '1e31ee5b-01c5-46e0-88f5-e8de11861be1'
      );
      DELETE FROM core.\\"fieldMetadata\\" 
      WHERE name = 'accountOwner' AND \\"objectMetadataId\\" = '1e31ee5b-01c5-46e0-88f5-e8de11861be1';
    "
  `);
  console.log('Removed incomplete RELATION field from person metadata.');

  // Now create a SELECT or TEXT type "assignedTo" field on Person that doesn't require foreign relationMetadata table joins
  await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      DO \\\$\\\$
      DECLARE
        f_id uuid := gen_random_uuid();
        v_person uuid := '0df54d67-bd33-497d-a501-143fb04ec056';
        app_id uuid := '26ef5745-b806-4ac9-a365-a23bd0a62d65';
        ws_id uuid := 'bbd12261-90ea-42aa-8893-f15cf1352cea';
      BEGIN
        -- Add column assignedTo in workspace table
        ALTER TABLE workspace_b4ai6k0t73ulj4l40gxarowdm.\\"person\\" 
          ADD COLUMN IF NOT EXISTS \\"assignedTo\\" text DEFAULT 'Karthik (Admin)';

        -- Sync existing accountOwnerId data into assignedTo
        UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm.\\"person\\" p
        SET \\"assignedTo\\" = COALESCE(m.\\"nameFirstName\\" || ' ' || m.\\"nameLastName\\", 'Karthik (Admin)')
        FROM workspace_b4ai6k0t73ulj4l40gxarowdm.\\"workspaceMember\\" m
        WHERE p.\\"accountOwnerId\\" = m.id;

        -- Insert clean SELECT/TEXT fieldMetadata for assignedTo
        INSERT INTO core.\\"fieldMetadata\\"
          (id, \\"objectMetadataId\\", type, name, label, \\"defaultValue\\", settings, \\"isActive\\", \\"isSystem\\", \\"isUIReadOnly\\\", \\"isUIEditable\\\", \\"isNullable\\\", \\"workspaceId\\\", \\"universalIdentifier\\\", \\"applicationId\\\", \\"createdAt\\\", \\"updatedAt\\", options)
        VALUES
          (f_id, '1e31ee5b-01c5-46e0-88f5-e8de11861be1', 'TEXT', 'assignedTo', 'Assigned To', '\\\"Karthik (Admin)\\\"', null, true, false, false, true, true, ws_id, gen_random_uuid(), app_id, NOW(), NOW(), null);

        -- Add viewField to People Table View
        INSERT INTO core.\\"viewField\\"
          (id, \\"fieldMetadataId\\", \\"isVisible\\", size, position, \\"viewId\\", \\"workspaceId\\", \\"applicationId\\", \\"universalIdentifier\\", \\"createdAt\\", \\"updatedAt\\")
        VALUES
          (gen_random_uuid(), f_id, true, 160, 6, v_person, ws_id, app_id, gen_random_uuid(), NOW(), NOW());

      END \\\$\\\$;
    "
  `);

  console.log('Restarting server to regenerate GraphQL schema cleanly...');
  await sb.process.executeCommand('docker restart zed-server-1');
  await new Promise(r => setTimeout(r, 22000));

  const verify = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT p.\\"nameFirstName\\" || ' ' || p.\\"nameLastName\\" as name, p.\\"leadStatus\\", p.\\"assignedTo\\", c.name as company
      FROM workspace_b4ai6k0t73ulj4l40gxarowdm.\\"person\\" p
      LEFT JOIN workspace_b4ai6k0t73ulj4l40gxarowdm.\\"company\\" c ON p.\\"companyId\\" = c.id
      WHERE p.\\"deletedAt\\" IS NULL;
    "
  `);
  console.log('✅ Final People with clean Assigned To:\n', verify.result);
}

fixRelationMetadata().catch(console.error);
