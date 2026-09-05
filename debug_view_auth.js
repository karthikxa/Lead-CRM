const { Daytona } = require('@daytona/sdk');

async function debugViewAndAuth() {
  const d = new Daytona({ apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef', serverUrl: 'https://app.daytona.io/api' });
  const sb = await d.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  console.log('=== 1. CHECK ALL VIEWS & VIEWFIELDS FOR PERSON ===');
  const allPersonViews = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT v.id, v.name, v.key, v.type, v.\\"objectMetadataId\\", v.\\"overrides\\"
      FROM core.\\"view\\" v
      JOIN core.\\"objectMetadata\\" o ON v.\\"objectMetadataId\\" = o.id
      WHERE o.\\"nameSingular\\" = 'person';
    "
  `);
  console.log('All person views:\n', allPersonViews.result);

  // Check all viewFields for all person views
  const allVFs = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT vf.id, vf.\\"viewId\\", vf.position, vf.\\"isVisible\\", f.name, f.label, f.type
      FROM core.\\"viewField\\" vf
      JOIN core.\\"fieldMetadata\\" f ON vf.\\"fieldMetadataId\\" = f.id
      JOIN core.\\"view\\" v ON vf.\\"viewId\\" = v.id
      JOIN core.\\"objectMetadata\\" o ON v.\\"objectMetadataId\\" = o.id
      WHERE o.\\"nameSingular\\" = 'person'
      ORDER BY vf.\\"viewId\\", vf.position;
    "
  `);
  console.log('Person viewFields in DB:\n', allVFs.result);

  console.log('=== 2. CHECK WHY "User was not created with email/password" OCCURS ===');
  const grepAllErrors = await sb.process.executeCommand(`
    docker exec zed-server-1 grep -rn "User was not created\\|VkcC68" /app/packages/ 2>/dev/null | head -20
  `);
  console.log('Grep all occurrences of the error:\n', grepAllErrors.result);
}

debugViewAndAuth().catch(console.error);
