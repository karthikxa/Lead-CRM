const { Daytona } = require('@daytona/sdk');

async function fixSenderName() {
  const d = new Daytona({ apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef', serverUrl: 'https://app.daytona.io/api' });
  const sb = await d.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  // 1. Check what user data we have in the DB for the admin
  const users = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "SELECT id, email, \\"firstName\\", \\"lastName\\" FROM core.\\"user\\";"
  `);
  console.log('Users:\n', users.result);

  // 2. Fix the admin user name so sender.name shows properly in invite email
  await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      UPDATE core.\\"user\\" SET \\"firstName\\" = 'Balanithyapriya', \\"lastName\\" = 'Admin' WHERE email = 'balunithyapriya@gmail.com';
      UPDATE core.\\"user\\" SET \\"firstName\\" = 'Zed', \\"lastName\\" = 'Coordinator' WHERE email = 'zedidstoreofficial@gmail.com';
    "
  `);

  // 3. Also fix workspace member names
  await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm.\\"workspaceMember\\" 
      SET \\"nameFirstName\\" = 'Balanithyapriya', \\"nameLastName\\" = 'Admin'
      WHERE \\"userId\\" = (SELECT id FROM core.\\"user\\" WHERE email = 'balunithyapriya@gmail.com');
      
      UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm.\\"workspaceMember\\" 
      SET \\"nameFirstName\\" = 'Zed', \\"nameLastName\\" = 'Coordinator'
      WHERE \\"userId\\" = (SELECT id FROM core.\\"user\\" WHERE email = 'zedidstoreofficial@gmail.com');
    "
  `);

  const verify = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT u.email, u.\\"firstName\\", u.\\"lastName\\", m.\\"nameFirstName\\", m.\\"nameLastName\\"
      FROM core.\\"user\\" u
      LEFT JOIN workspace_b4ai6k0t73ulj4l40gxarowdm.\\"workspaceMember\\" m ON m.\\"userId\\" = u.id;
    "
  `);
  console.log('User + Member verification:\n', verify.result);

  // 4. Check subject line in invite service - find the line with subject/inviterName
  const subjectLine = await sb.process.executeCommand(`
    docker exec zed-server-1 sed -n '455,475p' /app/packages/twenty-server/dist/engine/core-modules/workspace-invitation/services/workspace-invitation.service.js
  `);
  console.log('Subject line area:\n', subjectLine.result);
}

fixSenderName().catch(console.error);
