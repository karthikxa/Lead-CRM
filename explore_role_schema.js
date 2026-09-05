const { Daytona } = require('@daytona/sdk');

async function exploreRoleSchema() {
  const d = new Daytona({ apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef', serverUrl: 'https://app.daytona.io/api' });
  const sb = await d.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  // Find the correct role schema
  const coreTables = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'core' AND table_name ILIKE '%role%' OR table_name ILIKE '%perm%' OR table_name ILIKE '%user%'
      ORDER BY table_name;
    "
  `);
  console.log('Core tables with role/perm/user:\n', coreTables.result);

  // Correct query for role columns
  const roleColumns = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_schema = 'core' AND table_name = 'role' ORDER BY ordinal_position;
    "
  `);
  console.log('Role table columns:\n', roleColumns.result);

  // List of all core tables
  const allCoreTables = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'core' ORDER BY table_name;
    "
  `);
  console.log('All core tables:\n', allCoreTables.result);
}

exploreRoleSchema().catch(console.error);
