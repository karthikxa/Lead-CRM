const { Daytona } = require('@daytona/sdk');

async function executeSeed() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  console.log('1. Pulling latest git on Daytona host...');
  await sb.process.executeCommand(`
    cd /home/daytona/Lead-CRM
    git fetch origin main
    git reset --hard origin/main
    docker cp seed_leads_remote.js zed-server-1:/tmp/seed_leads_remote.js
    docker exec zed-server-1 node /tmp/seed_leads_remote.js
  `);

  console.log('2. Verifying Leads in DB...');
  const res = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c 'SELECT p."nameFirstName" || \x27 \x27 || p."nameLastName" AS "Contact", p."jobTitle", p."emailsPrimaryEmail", p."phonesPrimaryPhoneNumber", c.name AS "Institute" FROM workspace_b4ai6k0t73ulj4l40gxarowdm."person" p JOIN workspace_b4ai6k0t73ulj4l40gxarowdm."company" c ON p."companyId" = c.id;'
  `);
  console.log('Leads in CRM:\n', res.result);
}

executeSeed().catch(console.error);
