const { Daytona } = require('@daytona/sdk');

async function addColumnsToAllViews() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });
  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  // Get existing fieldMetadata IDs for the leadStatus we inserted, and accountOwner for company
  const fieldIds = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT id, name, label, \\"objectMetadataId\\" FROM core.\\"fieldMetadata\\"
      WHERE name IN ('leadStatus', 'accountOwner')
      ORDER BY name;
    "
  `);
  console.log('Field IDs:\n', fieldIds.result);

  // Also get company viewFields and task/opportunity viewFields
  const companyVF = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT vf.position, f.name, f.label
      FROM core.\\"viewField\\" vf
      JOIN core.\\"fieldMetadata\\" f ON vf.\\"fieldMetadataId\\" = f.id
      WHERE vf.\\"viewId\\" = '744108f7-b586-4f9e-b921-3dfcd65d37ff'
      ORDER BY vf.position;
    "
  `);
  console.log('Company viewFields:\n', companyVF.result);

  const taskVF = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT vf.position, f.name, f.label
      FROM core.\\"viewField\\" vf
      JOIN core.\\"fieldMetadata\\" f ON vf.\\"fieldMetadataId\\" = f.id
      WHERE vf.\\"viewId\\" = '889bb141-d341-4848-8bb6-fb6fce64fe9c'
      ORDER BY vf.position;
    "
  `);
  console.log('Task viewFields:\n', taskVF.result);

  const oppVF = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT vf.position, f.name, f.label
      FROM core.\\"viewField\\" vf
      JOIN core.\\"fieldMetadata\\" f ON vf.\\"fieldMetadataId\\" = f.id
      WHERE vf.\\"viewId\\" = '44afa993-4577-43fe-810c-cbffdb913ef4'
      ORDER BY vf.position;
    "
  `);
  console.log('Opportunity viewFields:\n', oppVF.result);
}

addColumnsToAllViews().catch(console.error);
