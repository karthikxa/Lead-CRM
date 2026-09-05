const { Daytona } = require('@daytona/sdk');

async function inspectCrmData() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  console.log('1. Checking Members & UserWorkspaces in DB...');
  const members = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c 'SELECT u.id, u.email, u."firstName", u."lastName", uw."createdAt", uw."updatedAt" FROM core."user" u JOIN core."userWorkspace" uw ON u.id = uw."userId";'
  `);
  console.log('Members:\n', members.result);

  console.log('2. Checking Pending Invitations in DB...');
  const invites = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c 'SELECT id, type, "expiresAt", context FROM core."appToken" WHERE type LIKE "%Invite%" OR type LIKE "%Invitation%";'
  `);
  console.log('Invites:\n', invites.result);

  console.log('3. Checking Companies in DB...');
  const companies = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c 'SELECT id, name, domain, "createdBySource" FROM workspace_b4ai6k0t73ulj4l40gxarowdm."company" LIMIT 15;'
  `);
  console.log('Companies:\n', companies.result);
}

inspectCrmData().catch(console.error);
