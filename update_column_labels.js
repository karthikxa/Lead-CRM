const { Daytona } = require('@daytona/sdk');

async function updateColumnLabels() {
  const d = new Daytona({ apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef', serverUrl: 'https://app.daytona.io/api' });
  const sb = await d.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  console.log('=== UPDATING OPPORTUNITY COLUMN LABELS AS REQUESTED ===');

  await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      -- 1. Rename 'Amount' to 'Amount (INR)'
      UPDATE core.\\"fieldMetadata\\"
      SET label = 'Amount (INR)'
      WHERE name = 'amount' AND \\"objectMetadataId\\" = '1f6dd180-96d7-4e84-9804-1a342cb20273';

      -- 2. Rename 'Close date' to 'Meeting Scheduled Date & Time'
      UPDATE core.\\"fieldMetadata\\"
      SET label = 'Meeting Scheduled Date & Time'
      WHERE name = 'closeDate' AND \\"objectMetadataId\\" = '1f6dd180-96d7-4e84-9804-1a342cb20273';

      -- 3. Rename 'Owner' to 'Assigned Owner'
      UPDATE core.\\"fieldMetadata\\"
      SET label = 'Assigned Owner'
      WHERE name = 'owner' AND \\"objectMetadataId\\" = '1f6dd180-96d7-4e84-9804-1a342cb20273';

      -- 4. Ensure Point of Contact is 'Point of Contact'
      UPDATE core.\\"fieldMetadata\\"
      SET label = 'Point of Contact'
      WHERE name = 'pointOfContact' AND \\"objectMetadataId\\" = '1f6dd180-96d7-4e84-9804-1a342cb20273';
    "
  `);

  console.log('Labels updated in core.fieldMetadata!');

  // Verify labels
  const vLabels = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT name, label FROM core.\\"fieldMetadata\\"
      WHERE \\"objectMetadataId\\" = '1f6dd180-96d7-4e84-9804-1a342cb20273'
      AND name IN ('amount', 'closeDate', 'pointOfContact', 'owner', 'stage', 'company', 'name')
      ORDER BY name;
    "
  `);
  console.log('Verified Labels:\n', vLabels.result);

  console.log('Restarting server to clear metadata caches...');
  await sb.process.executeCommand('docker restart zed-server-1');
  await new Promise(r => setTimeout(r, 20000));
  
  const h = await sb.process.executeCommand('curl -s http://localhost:3000/healthz');
  console.log('Server health:', h.result);
}

updateColumnLabels().catch(console.error);
