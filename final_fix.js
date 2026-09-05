const { Daytona } = require('@daytona/sdk');

async function finalFix() {
  const d = new Daytona({ apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef', serverUrl: 'https://app.daytona.io/api' });
  const sb = await d.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  // 1. Fix the workspaceMember names for zedidstoreofficial - it's not in any workspace member row
  //    because they haven't completed onboarding - update all users' workspace member records
  await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      UPDATE core.\\"user\\" SET \\"firstName\\" = 'Balanithyapriya', \\"lastName\\" = 'Bala' WHERE email = 'balunithyapriya@gmail.com';
    "
  `);

  // 2. Fix the invite subject - remove the ⚡ emoji from the subject line (spam trigger)
  //    and ensure inviterName shows the actual admin name
  await sb.process.executeCommand(`
    docker exec zed-server-1 sed -i \
      's/const subject = "⚡ Invitation: Join "/const subject = "Invitation: Join "/g' \
      /app/packages/twenty-server/dist/engine/core-modules/workspace-invitation/services/workspace-invitation.service.js
  `);

  // 3. Fix the inviterName fallback to show admin full name
  await sb.process.executeCommand(`
    docker exec zed-server-1 sed -i \
      "s/const inviterName = \\[sender.name?.firstName, sender.name?.lastName\\].filter(Boolean).join(' ') || sender.userEmail || 'Zed Admin';/const inviterName = [sender.name?.firstName, sender.name?.lastName].filter(Boolean).join(' ') || sender.userEmail || 'Zed Agency Admin';/" \
      /app/packages/twenty-server/dist/engine/core-modules/workspace-invitation/services/workspace-invitation.service.js
  `);

  // 4. Verify the user name fix worked
  const userCheck = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "SELECT email, \\"firstName\\", \\"lastName\\" FROM core.\\"user\\" WHERE email = 'balunithyapriya@gmail.com';"
  `);
  console.log('Admin user check:\n', userCheck.result);

  // 5. Verify the leadStatus column is visible in People view - check the current columns
  const personVF = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT vf.position, vf.\\"isVisible\\", f.name, f.label
      FROM core.\\"viewField\\" vf
      JOIN core.\\"fieldMetadata\\" f ON vf.\\"fieldMetadataId\\" = f.id
      WHERE vf.\\"viewId\\" = '0df54d67-bd33-497d-a501-143fb04ec056'
      ORDER BY vf.position;
    "
  `);
  console.log('People viewFields:\n', personVF.result);

  // 6. Verify the leadStatus column exists in the person table  
  const colCheck = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT column_name, data_type, column_default FROM information_schema.columns 
      WHERE table_name = 'person' 
      AND table_schema = 'workspace_b4ai6k0t73ulj4l40gxarowdm'
      AND column_name IN ('leadStatus', 'status', 'accountOwnerId');
    "
  `);
  console.log('Person columns:\n', colCheck.result);

  // 7. Quick sample of final data
  const finalData = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT \\"nameFirstName\\", \\"nameLastName\\", \\"leadStatus\\", \\"emailsPrimaryEmail\\" 
      FROM workspace_b4ai6k0t73ulj4l40gxarowdm.\\"person\\"
      WHERE \\"deletedAt\\" IS NULL LIMIT 5;
    "
  `);
  console.log('People with leadStatus:\n', finalData.result);

  console.log('Restarting to clear metadata cache...');
  await sb.process.executeCommand('docker restart zed-server-1');
  await new Promise(r => setTimeout(r, 20000));
  const health = await sb.process.executeCommand('curl -s -w "\\nTime: %{time_total}s" http://localhost:3000/healthz');
  console.log('Healthz:\n', health.result);
}

finalFix().catch(console.error);
