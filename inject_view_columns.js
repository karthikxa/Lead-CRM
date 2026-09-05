const { Daytona } = require('@daytona/sdk');

async function injectViewColumns() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });
  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  // All known IDs from inspection:
  const APP_ID        = '26ef5745-b806-4ac9-a365-a23bd0a62d65';
  const WORKSPACE_ID  = 'bbd12261-90ea-42aa-8893-f15cf1352cea';

  // Views
  const PERSON_VIEW   = '0df54d67-bd33-497d-a501-143fb04ec056';
  const COMPANY_VIEW  = '744108f7-b586-4f9e-b921-3dfcd65d37ff';
  const TASK_VIEW     = '889bb141-d341-4848-8bb6-fb6fce64fe9c';
  const OPP_VIEW      = '44afa993-4577-43fe-810c-cbffdb913ef4';

  // Field metadata IDs
  const PERSON_STATUS_FIELD    = '508bba83-8fa0-457b-9c12-5c68f84d1259'; // leadStatus on person
  const COMPANY_OWNER_FIELD    = '2d1e02ca-cd45-48c4-9735-96c2984e5e8e'; // accountOwner on company
  const OPP_STAGE_FIELD        = '2e8c08a2-c371-4c68-a02e-3ee556b22eaa'; // stage on opportunity
  const OPP_OWNER_FIELD        = '54c56313-21c3-4a94-8db0-33d33e4df141'; // owner on opportunity

  const sql = `
-- ─── PEOPLE: Add "Status" (leadStatus) at position 7, "Assigned To" note: accountOwner not on person yet
-- Update existing positions to make room at end
UPDATE core."viewField" SET position = position + 2 WHERE "viewId" = '${PERSON_VIEW}' AND position >= 7;

-- Insert Status column for Person view
INSERT INTO core."viewField" (id, "fieldMetadataId", "isVisible", size, position, "viewId", "workspaceId", "applicationId", "universalIdentifier", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), '${PERSON_STATUS_FIELD}', true, 150, 7, '${PERSON_VIEW}', '${WORKSPACE_ID}', '${APP_ID}', gen_random_uuid(), NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ─── OPPORTUNITY: Add "Stage" if not there, and "Owner" column
-- Shift existing
UPDATE core."viewField" SET position = position + 2 WHERE "viewId" = '${OPP_VIEW}' AND position >= 5;

INSERT INTO core."viewField" (id, "fieldMetadataId", "isVisible", size, position, "viewId", "workspaceId", "applicationId", "universalIdentifier", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), '${OPP_STAGE_FIELD}', true, 130, 5, '${OPP_VIEW}', '${WORKSPACE_ID}', '${APP_ID}', gen_random_uuid(), NOW(), NOW()),
  (gen_random_uuid(), '${OPP_OWNER_FIELD}', true, 150, 6, '${OPP_VIEW}', '${WORKSPACE_ID}', '${APP_ID}', gen_random_uuid(), NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ─── COMPANY: accountOwner is already visible (position 3) — make sure it is visible
UPDATE core."viewField" SET "isVisible" = true WHERE "viewId" = '${COMPANY_VIEW}' AND "fieldMetadataId" = '${COMPANY_OWNER_FIELD}';

-- ─── TASK: assignee and status already visible — make sure both are on
UPDATE core."viewField" SET "isVisible" = true WHERE "viewId" = '${TASK_VIEW}';
`;

  await sb.process.executeCommand(`
    cat << 'EOF' > /tmp/inject_view_cols.sql
${sql}
EOF
    docker exec -i zed-db-1 psql -U postgres -d default < /tmp/inject_view_cols.sql
  `);

  console.log('Verifying People viewFields after injection...');
  const personVF = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT vf.position, vf.\\"isVisible\\", f.name, f.label
      FROM core.\\"viewField\\" vf
      JOIN core.\\"fieldMetadata\\" f ON vf.\\"fieldMetadataId\\" = f.id
      WHERE vf.\\"viewId\\" = '${PERSON_VIEW}'
      ORDER BY vf.position;
    "
  `);
  console.log('✅ People columns:\n', personVF.result);

  const oppVF = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT vf.position, vf.\\"isVisible\\", f.name, f.label
      FROM core.\\"viewField\\" vf
      JOIN core.\\"fieldMetadata\\" f ON vf.\\"fieldMetadataId\\" = f.id
      WHERE vf.\\"viewId\\" = '${OPP_VIEW}'
      ORDER BY vf.position;
    "
  `);
  console.log('✅ Opportunity columns:\n', oppVF.result);

  const companyVF = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT vf.position, vf.\\"isVisible\\", f.name, f.label
      FROM core.\\"viewField\\" vf
      JOIN core.\\"fieldMetadata\\" f ON vf.\\"fieldMetadataId\\" = f.id
      WHERE vf.\\"viewId\\" = '${COMPANY_VIEW}'
      ORDER BY vf.position;
    "
  `);
  console.log('✅ Company columns:\n', companyVF.result);

  const taskVF = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT vf.position, vf.\\"isVisible\\", f.name, f.label
      FROM core.\\"viewField\\" vf
      JOIN core.\\"fieldMetadata\\" f ON vf.\\"fieldMetadataId\\" = f.id
      WHERE vf.\\"viewId\\" = '${TASK_VIEW}'
      ORDER BY vf.position;
    "
  `);
  console.log('✅ Task columns:\n', taskVF.result);
}

injectViewColumns().catch(console.error);
