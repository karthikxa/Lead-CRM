const { Daytona } = require('@daytona/sdk');

async function checkObjCols() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');
  const cols = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'objectMetadata' AND table_schema = 'core';"
  `);
  console.log('ObjectMetadata columns:\n', cols.result);

  const objs = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c 'SELECT id, "nameSingular", "namePlural", "labelSingular", "labelPlural" FROM core."objectMetadata" WHERE "nameSingular" IN (\x27person\x27, \x27company\x27, \x27opportunity\x27, \x27task\x27);'
  `);
  console.log('Objects:\n', objs.result);
}

checkObjCols().catch(console.error);
