const { Daytona } = require('@daytona/sdk');

async function inspectRecordPageFields() {
  const d = new Daytona({ apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef', serverUrl: 'https://app.daytona.io/api' });
  const sb = await d.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  // Check all views for Opportunity and Person (both TABLE and FIELDS_WIDGET / RECORD_PAGE)
  const views = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT v.id, v.name, v.type, o.\\"nameSingular\\"
      FROM core.\\"view\\" v
      JOIN core.\\"objectMetadata\\" o ON v.\\"objectMetadataId\\" = o.id
      WHERE o.\\"nameSingular\\" IN ('opportunity', 'person');
    "
  `);
  console.log('Opportunity & Person views:\n', views.result);

  // Check viewFields for Person Record Page widget
  const personWidgetVFs = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT vf.position, vf.\\"isVisible\\", f.name, f.label
      FROM core.\\"viewField\\" vf
      JOIN core.\\"fieldMetadata\\" f ON vf.\\"fieldMetadataId\\" = f.id
      JOIN core.\\"view\\" v ON vf.\\"viewId\\" = v.id
      WHERE v.type = 'FIELDS_WIDGET' AND v.\\"objectMetadataId\\" = '1e31ee5b-01c5-46e0-88f5-e8de11861be1'
      ORDER BY vf.position;
    "
  `);
  console.log('Person Widget Fields:\n', personWidgetVFs.result);

  // Check viewFields for Opportunity Record Page widget
  const oppWidgetVFs = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT vf.position, vf.\\"isVisible\\", f.name, f.label
      FROM core.\\"viewField\\" vf
      JOIN core.\\"fieldMetadata\\" f ON vf.\\"fieldMetadataId\\" = f.id
      JOIN core.\\"view\\" v ON vf.\\"viewId\\" = v.id
      WHERE v.type = 'FIELDS_WIDGET' AND v.\\"objectMetadataId\\" = '1f6dd180-96d7-4e84-9804-1a342cb20273'
      ORDER BY vf.position;
    "
  `);
  console.log('Opportunity Widget Fields:\n', oppWidgetVFs.result);
}

inspectRecordPageFields().catch(console.error);
