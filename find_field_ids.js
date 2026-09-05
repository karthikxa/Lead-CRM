const { Daytona } = require('@daytona/sdk');

async function addStatusAndAssignedColumns() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });
  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  // Known IDs:
  // Person INDEX view:        0df54d67-bd33-497d-a501-143fb04ec056
  // Company INDEX view:       744108f7-b586-4f9e-b921-3dfcd65d37ff
  // Task INDEX view:          889bb141-d341-4848-8bb6-fb6fce64fe9c
  // Opportunity INDEX view:   44afa993-4577-43fe-810c-cbffdb913ef4
  //
  // Fields:
  // leadStatus (person):      508bba83-8fa0-457b-9c12-5c68f84d1259
  // accountOwner (company):   2d1e02ca-cd45-48c4-9735-96c2984e5e8e
  // assignee (task):          already in view (field name = assignee)
  // status (task):            already in view
  // pointOfContact (opp):     already in view
  // owner on opp: need to find ownerId field
  // Need to find: person assignee/owner fieldMetadataId, opportunity owner field

  const extraFields = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT id, name, label, \\"objectMetadataId\\" FROM core.\\"fieldMetadata\\"
      WHERE name IN ('assignee', 'owner', 'stage')
      AND \\"objectMetadataId\\" IN (
        '302bd190-ef1b-4e4f-af69-0ad301f3f002', -- task
        '1f6dd180-96d7-4e84-9804-1a342cb20273'  -- opportunity
      );
    "
  `);
  console.log('Extra fields:\n', extraFields.result);

  const appId = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT \\"applicationId\\" FROM core.\\"viewField\\" LIMIT 1;
    "
  `);
  console.log('Sample applicationId:\n', appId.result);
}

addStatusAndAssignedColumns().catch(console.error);
