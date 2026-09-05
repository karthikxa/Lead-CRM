const { Daytona } = require('@daytona/sdk');

async function checkPersonFields() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');
  const res = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "SELECT id, \\"nameSingular\\", \\"targetTableName\\" FROM core.\\"objectMetadata\\" WHERE \\"nameSingular\\" IN ('person', 'company', 'opportunity', 'task');"
  `);
  console.log('Objects:\n', res.result);

  const fields = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "SELECT id, name, type, label FROM core.\\"fieldMetadata\\" WHERE \\"objectMetadataId\\" = (SELECT id FROM core.\\"objectMetadata\\" WHERE \\"nameSingular\\" = 'person' LIMIT 1);"
  `);
  console.log('Person fields:\n', fields.result);
}

checkPersonFields().catch(console.error);
