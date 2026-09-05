const { Daytona } = require('@daytona/sdk');
async function diagnoseAndFix() {
  const d = new Daytona({ apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef', serverUrl: 'https://app.daytona.io/api' });
  const sb = await d.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  const ps = await sb.process.executeCommand('docker ps --format "table {{.Names}}\\t{{.Status}}"');
  console.log('Containers:\n', ps.result);

  const logs = await sb.process.executeCommand('docker logs --tail 30 zed-server-1 2>&1');
  console.log('Server logs:\n', logs.result);

  // Check the target table name for the person object (DEPRECATED means it uses workspace schema)
  const target = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "SELECT \\"nameSingular\\", \\"targetTableName\\" FROM core.\\"objectMetadata\\" WHERE \\"nameSingular\\" = 'person';"
  `);
  console.log('Person targetTableName:\n', target.result);

  // Check if leadStatus field has correct settings
  const field = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "SELECT id, name, type, label, \\"defaultValue\\", options FROM core.\\"fieldMetadata\\" WHERE name = 'leadStatus';"
  `);
  console.log('leadStatus field:\n', field.result);
}
diagnoseAndFix().catch(console.error);
