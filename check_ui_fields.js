const { Daytona } = require('@daytona/sdk');

async function checkUIFields() {
  const d = new Daytona({ apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef', serverUrl: 'https://app.daytona.io/api' });
  const sb = await d.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  // Let's check how the UI renders columns on the table:
  // Look at the fieldMetadata for person:
  const fields = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT id, name, label, type, \\"isActive\\", \\"isUIEditable\\"
      FROM core.\\"fieldMetadata\\"
      WHERE \\"objectMetadataId\\" = '1e31ee5b-01c5-46e0-88f5-e8de11861be1'
      ORDER BY name;
    "
  `);
  console.log('All Person fieldMetadata in DB:\n', fields.result);
}

checkUIFields().catch(console.error);
