const { Daytona } = require('@daytona/sdk');

async function diagnosPermissions() {
  const d = new Daytona({ apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef', serverUrl: 'https://app.daytona.io/api' });
  const sb = await d.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  console.log('=== SERVER STATUS ===');
  const h = await sb.process.executeCommand('docker ps --format "{{.Names}}: {{.Status}}"');
  console.log(h.result);

  console.log('=== ROLES & PERMISSIONS ===');
  const roles = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT r.id, r.name, r.\\"label\\", r.\\"isEditable\\", r.\\"workspaceId\\"
      FROM core.\\"role\\" r
      WHERE r.\\"workspaceId\\" = 'bbd12261-90ea-42aa-8893-f15cf1352cea';
    "
  `);
  console.log('Roles:\n', roles.result);

  console.log('=== WORKSPACE MEMBER ROLES ===');
  const memberRoles = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT u.email, u.\\"firstName\\", u.\\"lastName\\", 
             uw.id as user_workspace_id,
             r.name as role_name, r.\\"label\\" as role_label,
             r.id as role_id
      FROM core.\\"user\\" u
      JOIN core.\\"userWorkspace\\" uw ON uw.\\"userId\\" = u.id
      LEFT JOIN core.\\"userWorkspaceRole\\" uwr ON uwr.\\"userWorkspaceId\\" = uw.id
      LEFT JOIN core.\\"role\\" r ON r.id = uwr.\\"roleId\\"
      WHERE uw.\\"workspaceId\\" = 'bbd12261-90ea-42aa-8893-f15cf1352cea';
    "
  `);
  console.log('Member Roles:\n', memberRoles.result);

  console.log('=== OBJECT PERMISSIONS ===');
  const objPerms = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT r.name as role_name, op.\\"objectAction\\", om.\\"nameSingular\\"
      FROM core.\\"objectPermission\\" op
      JOIN core.\\"role\\" r ON r.id = op.\\"roleId\\"
      JOIN core.\\"objectMetadata\\" om ON om.id = op.\\"objectMetadataId\\"
      WHERE r.\\"workspaceId\\" = 'bbd12261-90ea-42aa-8893-f15cf1352cea'
      AND om.\\"nameSingular\\" IN ('person', 'company', 'opportunity', 'task', 'note')
      ORDER BY r.name, om.\\"nameSingular\\";
    "
  `);
  console.log('Object Permissions:\n', objPerms.result);

  console.log('=== FIELD PERMISSIONS ===');
  const fieldPerms = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT r.name as role_name, fp.\\"fieldAction\\", fm.name as field_name, om.\\"nameSingular\\"
      FROM core.\\"fieldPermission\\" fp
      JOIN core.\\"role\\" r ON r.id = fp.\\"roleId\\"
      JOIN core.\\"fieldMetadata\\" fm ON fm.id = fp.\\"fieldMetadataId\\"
      JOIN core.\\"objectMetadata\\" om ON om.id = fm.\\"objectMetadataId\\"
      WHERE r.\\"workspaceId\\" = 'bbd12261-90ea-42aa-8893-f15cf1352cea'
      AND om.\\"nameSingular\\" IN ('person', 'opportunity')
      ORDER BY r.name, om.\\"nameSingular\\", fm.name;
    "
  `);
  console.log('Field Permissions:\n', fieldPerms.result);

  console.log('=== WORKSPACE MEMBERS ===');
  const members = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT wm.id, wm.\\"nameFirstName\\", wm.\\"nameLastName\\", u.email,
             uw.id as user_workspace_id
      FROM workspace_b4ai6k0t73ulj4l40gxarowdm.\\"workspaceMember\\" wm
      JOIN core.\\"user\\" u ON u.id = wm.\\"userId\\"
      JOIN core.\\"userWorkspace\\" uw ON uw.\\"userId\\" = u.id AND uw.\\"workspaceId\\" = 'bbd12261-90ea-42aa-8893-f15cf1352cea';
    "
  `);
  console.log('Workspace Members:\n', members.result);
}

diagnosPermissions().catch(console.error);
