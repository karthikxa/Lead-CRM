const { Daytona } = require('@daytona/sdk');

async function fixPermissionsAndRoles() {
  const d = new Daytona({ apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef', serverUrl: 'https://app.daytona.io/api' });
  const sb = await d.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  console.log('=== 1. CHECK EXISTING ROLES ===');
  const roles = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT id, label, \\"isEditable\\", \\"canReadAllObjectRecords\\", \\"canUpdateAllObjectRecords\\", 
             \\"canUpdateAllSettings\\", \\"workspaceId\\"
      FROM core.\\"role\\" WHERE \\"workspaceId\\" = 'bbd12261-90ea-42aa-8893-f15cf1352cea';
    "
  `);
  console.log('Roles:\n', roles.result);

  // Check roleTarget (who has which role)
  const roleTargets = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT rt.id, rt.\\"roleId\\", rt.\\"userWorkspaceId\\", r.label as role_label,
             uw.\\"userId\\", u.email
      FROM core.\\"roleTarget\\" rt
      JOIN core.\\"role\\" r ON r.id = rt.\\"roleId\\"
      JOIN core.\\"userWorkspace\\" uw ON uw.id = rt.\\"userWorkspaceId\\"
      JOIN core.\\"user\\" u ON u.id = uw.\\"userId\\"
      WHERE r.\\"workspaceId\\" = 'bbd12261-90ea-42aa-8893-f15cf1352cea';
    "
  `);
  console.log('Role Targets (who has which role):\n', roleTargets.result);

  // Check objectPermission
  const objPerms = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT r.label as role_label, op.\\"objectAction\\", om.\\"nameSingular\\"
      FROM core.\\"objectPermission\\" op
      JOIN core.\\"role\\" r ON r.id = op.\\"roleId\\"
      JOIN core.\\"objectMetadata\\" om ON om.id = op.\\"objectMetadataId\\"
      WHERE r.\\"workspaceId\\" = 'bbd12261-90ea-42aa-8893-f15cf1352cea'
      AND om.\\"nameSingular\\" IN ('person', 'company', 'opportunity', 'task', 'note')
      ORDER BY r.label, om.\\"nameSingular\\";
    "
  `);
  console.log('Object Permissions:\n', objPerms.result);

  // Check rowLevelPermissionPredicate
  const rowPerms = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT r.label as role_label, rlp.\\"objectAction\\", rlp.rawFilterValue, om.\\"nameSingular\\"
      FROM core.\\"rowLevelPermissionPredicate\\" rlp
      JOIN core.\\"role\\" r ON r.id = rlp.\\"roleId\\"
      JOIN core.\\"objectMetadata\\" om ON om.id = rlp.\\"objectMetadataId\\"
      WHERE r.\\"workspaceId\\" = 'bbd12261-90ea-42aa-8893-f15cf1352cea'
      LIMIT 20;
    "
  `);
  console.log('Row Level Permissions:\n', rowPerms.result);

  // Check fieldPermission
  const fieldPerms = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT r.label as role_label, fp.\\"fieldAction\\", fm.name, fm.label
      FROM core.\\"fieldPermission\\" fp
      JOIN core.\\"role\\" r ON r.id = fp.\\"roleId\\"
      JOIN core.\\"fieldMetadata\\" fm ON fm.id = fp.\\"fieldMetadataId\\"
      WHERE r.\\"workspaceId\\" = 'bbd12261-90ea-42aa-8893-f15cf1352cea'
      LIMIT 30;
    "
  `);
  console.log('Field Permissions:\n', fieldPerms.result);

  // Check rowLevelPermissionPredicate columns
  const rlpCols = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_schema = 'core' AND table_name = 'rowLevelPermissionPredicate' ORDER BY ordinal_position;
    "
  `);
  console.log('rowLevelPermissionPredicate columns:\n', rlpCols.result);
}

fixPermissionsAndRoles().catch(console.error);
