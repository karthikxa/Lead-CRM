const { Daytona } = require('@daytona/sdk');

async function inspectViews() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });
  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  // Get view schema
  const viewCols = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'view' AND table_schema = 'core';"
  `);
  console.log('View columns:\n', viewCols.result);

  // Get viewField schema
  const vfCols = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'viewField' AND table_schema = 'core';"
  `);
  console.log('ViewField columns:\n', vfCols.result);

  // Get person/company/task/opportunity INDEX views
  const views = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT v.id, v.name, v.type, v.\\"key\\", o.\\"nameSingular\\"
      FROM core.\\"view\\" v
      JOIN core.\\"objectMetadata\\" o ON v.\\"objectMetadataId\\" = o.id
      WHERE o.\\"nameSingular\\" IN ('person','company','task','opportunity')
      AND v.type = 'TABLE';
    "
  `);
  console.log('Object views:\n', views.result);

  // Get existing viewFields for person INDEX view
  const personView = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT vf.id, vf.\\"fieldMetadataId\\", vf.position, vf.\\"isVisible\\", f.name, f.label
      FROM core.\\"viewField\\" vf
      JOIN core.\\"fieldMetadata\\" f ON vf.\\"fieldMetadataId\\" = f.id
      WHERE vf.\\"viewId\\" = (
        SELECT v.id FROM core.\\"view\\" v
        JOIN core.\\"objectMetadata\\" o ON v.\\"objectMetadataId\\" = o.id
        WHERE o.\\"nameSingular\\" = 'person' AND v.type = 'TABLE' AND v.\\"key\\" = 'INDEX'
        LIMIT 1
      )
      ORDER BY vf.position;
    "
  `);
  console.log('Person viewFields:\n', personView.result);
}

inspectViews().catch(console.error);
