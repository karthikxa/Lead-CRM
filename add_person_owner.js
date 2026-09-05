const { Daytona } = require('@daytona/sdk');

async function addAccountOwnerToPerson() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  console.log('Adding accountOwner to Person metadata and table...');
  const res = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      ALTER TABLE workspace_b4ai6k0t73ulj4l40gxarowdm.\\"person\\" ADD COLUMN IF NOT EXISTS \\"accountOwnerId\\" uuid;
      
      INSERT INTO core.\\"fieldMetadata\\"
        (id, \\"objectMetadataId\\", type, name, label, settings, \\"isActive\\", \\"isSystem\\", \\"isUIReadOnly\\", \\"isUIEditable\\", \\"isNullable\\", \\"workspaceId\\", \\"relationTargetObjectMetadataId\\", \\"relationTargetFieldMetadataId\\", \\"createdAt\\", \\"updatedAt\\")
      VALUES
        (gen_random_uuid(), '1e31ee5b-01c5-46e0-88f5-e8de11861be1', 'RELATION', 'accountOwner', 'Account Owner', '{\\"onDelete\\": \\"SET_NULL\\", \\"relationType\\": \\"MANY_TO_ONE\\", \\"joinColumnName\\": \\"accountOwnerId\\"}', true, false, false, true, true, 'bbd12261-90ea-42aa-8893-f15cf1352cea', 'bb9cb6e5-a96b-4e71-bfc8-b7a71d7131a2', 'ff7f5839-049c-42e3-beae-c3981330e330', NOW(), NOW())
      ON CONFLICT DO NOTHING;
    "
  `);
  console.log('Result:\n', res.result);

  console.log('Restarting server to reload metadata cache...');
  await sb.process.executeCommand('docker restart zed-server-1');
  await new Promise(r => setTimeout(r, 18000));

  const health = await sb.process.executeCommand('curl -s -i http://localhost:3000/healthz');
  console.log('Healthz:\n', health.result);
}

addAccountOwnerToPerson().catch(console.error);
