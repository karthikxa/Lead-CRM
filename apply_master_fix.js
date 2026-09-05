const { Daytona } = require('@daytona/sdk');

async function applyMasterFix() {
  const d = new Daytona({ apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef', serverUrl: 'https://app.daytona.io/api' });
  const sb = await d.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  console.log('--- 1. PATCHING AUTH SERVICE FOR SEAMLESS INVITE & PASSWORD SIGNUP ---');
  
  // Patch auth.service.js to automatically accept & set password when passwordHash is missing instead of throwing "User was not created with email/password"
  await sb.process.executeCommand(`
    node -e "
      const fs = require('fs');
      const p = '/app/packages/twenty-server/dist/engine/core-modules/auth/services/auth.service.js';
      let c = fs.readFileSync(p, 'utf8');

      // 1. Patch validatePassword in auth.service.js
      const oldValidate = 'if (!userData.existingUser.passwordHash) {\\n                throw new _authexception.AuthException(\\'Incorrect login method\\', _authexception.AuthExceptionCode.INVALID_INPUT, {\\n                    userFriendlyMessage: /*i18n*/ {\\n                        id: \\\"VkcC68\\\",\\n                        message: \\\"User was not created with email/password\\\"\\n                    }\\n                });\\n            }';
      
      const newValidate = 'if (!userData.existingUser.passwordHash) {\\n                userData.existingUser.passwordHash = await this.signInUpService.generateHash(authParams.password);\\n                await this.userRepository.update(userData.existingUser.id, { passwordHash: userData.existingUser.passwordHash });\\n            }';

      if (c.includes('User was not created with email/password')) {
        c = c.replace(/if \\(!user\\.passwordHash\\) \\{[\\s\\S]*?throw new _authexception\\.AuthException\\('Incorrect login method'[\\s\\S]*?\\}\\);[\\s\\S]*?\\}/, 
          'if (!user.passwordHash) { user.passwordHash = await (0, _authutil.generateHash)(input.password); await this.userRepository.update(user.id, { passwordHash: user.passwordHash }); }');
        
        c = c.replace(/if \\(!userData\\.existingUser\\.passwordHash\\) \\{[\\s\\S]*?throw new _authexception\\.AuthException\\('Incorrect login method'[\\s\\S]*?\\}\\);[\\s\\S]*?\\}/,
          'if (!userData.existingUser.passwordHash) { userData.existingUser.passwordHash = await this.signInUpService.generateHash(authParams.password); await this.userRepository.update(userData.existingUser.id, { passwordHash: userData.existingUser.passwordHash }); }');

        fs.writeFileSync(p, c);
        console.log('Successfully patched auth.service.js!');
      } else {
        console.log('auth.service.js already patched or pattern matched.');
      }
    "
  `);

  console.log('--- 2. CLEAN & STANDARDIZE ALL VIEW COLUMNS ---');
  
  // Set clean, visible columns for People, Companies, Opportunities, Tasks
  const cleanViewsSql = `
-- Get Views
DO $$
DECLARE
  v_person uuid := '0df54d67-bd33-497d-a501-143fb04ec056';
  v_company uuid := '744108f7-b586-4f9e-b921-3dfcd65d37ff';
  v_task uuid := '889bb141-d341-4848-8bb6-fb6fce64fe9c';
  v_opp uuid := '44afa993-4577-43fe-810c-cbffdb913ef4';
BEGIN

  -- ─── 1. PEOPLE VIEW ──────────────────────────────────────
  -- Hide clutter: linkedin, noteTargets, taskTargets, createdBy, updatedAt
  UPDATE core."viewField" SET "isVisible" = false WHERE "viewId" = v_person;
  
  -- Show only clean essential columns in order:
  -- 0: Name, 1: Emails, 2: Phones, 3: Company, 4: Job Title, 5: Status (leadStatus), 6: Creation Date
  UPDATE core."viewField" SET "isVisible" = true, position = 0 WHERE "viewId" = v_person AND "fieldMetadataId" IN (SELECT id FROM core."fieldMetadata" WHERE name = 'name' AND "objectMetadataId" = '1e31ee5b-01c5-46e0-88f5-e8de11861be1');
  UPDATE core."viewField" SET "isVisible" = true, position = 1 WHERE "viewId" = v_person AND "fieldMetadataId" IN (SELECT id FROM core."fieldMetadata" WHERE name = 'emails' AND "objectMetadataId" = '1e31ee5b-01c5-46e0-88f5-e8de11861be1');
  UPDATE core."viewField" SET "isVisible" = true, position = 2 WHERE "viewId" = v_person AND "fieldMetadataId" IN (SELECT id FROM core."fieldMetadata" WHERE name = 'phones' AND "objectMetadataId" = '1e31ee5b-01c5-46e0-88f5-e8de11861be1');
  UPDATE core."viewField" SET "isVisible" = true, position = 3 WHERE "viewId" = v_person AND "fieldMetadataId" IN (SELECT id FROM core."fieldMetadata" WHERE name = 'company' AND "objectMetadataId" = '1e31ee5b-01c5-46e0-88f5-e8de11861be1');
  UPDATE core."viewField" SET "isVisible" = true, position = 4 WHERE "viewId" = v_person AND "fieldMetadataId" IN (SELECT id FROM core."fieldMetadata" WHERE name = 'jobTitle' AND "objectMetadataId" = '1e31ee5b-01c5-46e0-88f5-e8de11861be1');
  UPDATE core."viewField" SET "isVisible" = true, position = 5 WHERE "viewId" = v_person AND "fieldMetadataId" IN (SELECT id FROM core."fieldMetadata" WHERE name = 'leadStatus' AND "objectMetadataId" = '1e31ee5b-01c5-46e0-88f5-e8de11861be1');
  UPDATE core."viewField" SET "isVisible" = true, position = 6 WHERE "viewId" = v_person AND "fieldMetadataId" IN (SELECT id FROM core."fieldMetadata" WHERE name = 'createdAt' AND "objectMetadataId" = '1e31ee5b-01c5-46e0-88f5-e8de11861be1');

  -- ─── 2. TASKS VIEW ───────────────────────────────────────
  -- Hide clutter: taskTargets (Relations), createdBy, bodyV2
  UPDATE core."viewField" SET "isVisible" = false WHERE "viewId" = v_task;

  -- Show in clean order: 0: Title, 1: Status, 2: Due Date, 3: Assignee, 4: Creation Date
  UPDATE core."viewField" SET "isVisible" = true, position = 0 WHERE "viewId" = v_task AND "fieldMetadataId" IN (SELECT id FROM core."fieldMetadata" WHERE name = 'title' AND "objectMetadataId" = '302bd190-ef1b-4e4f-af69-0ad301f3f002');
  UPDATE core."viewField" SET "isVisible" = true, position = 1 WHERE "viewId" = v_task AND "fieldMetadataId" IN (SELECT id FROM core."fieldMetadata" WHERE name = 'status' AND "objectMetadataId" = '302bd190-ef1b-4e4f-af69-0ad301f3f002');
  UPDATE core."viewField" SET "isVisible" = true, position = 2 WHERE "viewId" = v_task AND "fieldMetadataId" IN (SELECT id FROM core."fieldMetadata" WHERE name = 'dueAt' AND "objectMetadataId" = '302bd190-ef1b-4e4f-af69-0ad301f3f002');
  UPDATE core."viewField" SET "isVisible" = true, position = 3 WHERE "viewId" = v_task AND "fieldMetadataId" IN (SELECT id FROM core."fieldMetadata" WHERE name = 'assignee' AND "objectMetadataId" = '302bd190-ef1b-4e4f-af69-0ad301f3f002');
  UPDATE core."viewField" SET "isVisible" = true, position = 4 WHERE "viewId" = v_task AND "fieldMetadataId" IN (SELECT id FROM core."fieldMetadata" WHERE name = 'createdAt' AND "objectMetadataId" = '302bd190-ef1b-4e4f-af69-0ad301f3f002');

  -- ─── 3. OPPORTUNITIES VIEW ───────────────────────────────
  UPDATE core."viewField" SET "isVisible" = false WHERE "viewId" = v_opp;

  -- Show in clean order: 0: Name, 1: Stage (Status), 2: Amount, 3: Close Date, 4: Point of Contact, 5: Company, 6: Owner (Assigned To)
  UPDATE core."viewField" SET "isVisible" = true, position = 0 WHERE "viewId" = v_opp AND "fieldMetadataId" IN (SELECT id FROM core."fieldMetadata" WHERE name = 'name' AND "objectMetadataId" = '1f6dd180-96d7-4e84-9804-1a342cb20273');
  UPDATE core."viewField" SET "isVisible" = true, position = 1 WHERE "viewId" = v_opp AND "fieldMetadataId" IN (SELECT id FROM core."fieldMetadata" WHERE name = 'stage' AND "objectMetadataId" = '1f6dd180-96d7-4e84-9804-1a342cb20273');
  UPDATE core."viewField" SET "isVisible" = true, position = 2 WHERE "viewId" = v_opp AND "fieldMetadataId" IN (SELECT id FROM core."fieldMetadata" WHERE name = 'amount' AND "objectMetadataId" = '1f6dd180-96d7-4e84-9804-1a342cb20273');
  UPDATE core."viewField" SET "isVisible" = true, position = 3 WHERE "viewId" = v_opp AND "fieldMetadataId" IN (SELECT id FROM core."fieldMetadata" WHERE name = 'closeDate' AND "objectMetadataId" = '1f6dd180-96d7-4e84-9804-1a342cb20273');
  UPDATE core."viewField" SET "isVisible" = true, position = 4 WHERE "viewId" = v_opp AND "fieldMetadataId" IN (SELECT id FROM core."fieldMetadata" WHERE name = 'pointOfContact' AND "objectMetadataId" = '1f6dd180-96d7-4e84-9804-1a342cb20273');
  UPDATE core."viewField" SET "isVisible" = true, position = 5 WHERE "viewId" = v_opp AND "fieldMetadataId" IN (SELECT id FROM core."fieldMetadata" WHERE name = 'company' AND "objectMetadataId" = '1f6dd180-96d7-4e84-9804-1a342cb20273');
  UPDATE core."viewField" SET "isVisible" = true, position = 6 WHERE "viewId" = v_opp AND "fieldMetadataId" IN (SELECT id FROM core."fieldMetadata" WHERE name = 'owner' AND "objectMetadataId" = '1f6dd180-96d7-4e84-9804-1a342cb20273');

  -- ─── 4. COMPANIES VIEW ───────────────────────────────────
  UPDATE core."viewField" SET "isVisible" = false WHERE "viewId" = v_company;

  -- Show in clean order: 0: Name, 1: Domain Name, 2: Account Owner, 3: Address, 4: Creation Date
  UPDATE core."viewField" SET "isVisible" = true, position = 0 WHERE "viewId" = v_company AND "fieldMetadataId" IN (SELECT id FROM core."fieldMetadata" WHERE name = 'name' AND "objectMetadataId" = 'a46cb47f-6e54-4732-977f-e40bfe6f4910');
  UPDATE core."viewField" SET "isVisible" = true, position = 1 WHERE "viewId" = v_company AND "fieldMetadataId" IN (SELECT id FROM core."fieldMetadata" WHERE name = 'domainName' AND "objectMetadataId" = 'a46cb47f-6e54-4732-977f-e40bfe6f4910');
  UPDATE core."viewField" SET "isVisible" = true, position = 2 WHERE "viewId" = v_company AND "fieldMetadataId" IN (SELECT id FROM core."fieldMetadata" WHERE name = 'accountOwner' AND "objectMetadataId" = 'a46cb47f-6e54-4732-977f-e40bfe6f4910');
  UPDATE core."viewField" SET "isVisible" = true, position = 3 WHERE "viewId" = v_company AND "fieldMetadataId" IN (SELECT id FROM core."fieldMetadata" WHERE name = 'address' AND "objectMetadataId" = 'a46cb47f-6e54-4732-977f-e40bfe6f4910');
  UPDATE core."viewField" SET "isVisible" = true, position = 4 WHERE "viewId" = v_company AND "fieldMetadataId" IN (SELECT id FROM core."fieldMetadata" WHERE name = 'createdAt' AND "objectMetadataId" = 'a46cb47f-6e54-4732-977f-e40bfe6f4910');

END $$;
`;

  await sb.process.executeCommand(`
    cat << 'EOF' > /tmp/clean_views.sql
${cleanViewsSql}
EOF
    docker exec -i zed-db-1 psql -U postgres -d default < /tmp/clean_views.sql
  `);

  console.log('--- 3. POPULATE REAL OPPORTUNITY & TASK DATA WITH PROPER AMOUNTS & DATES ---');
  
  const populateDataSql = `
DO $$
DECLARE
  ws_member_id uuid;
  karthik_member_id uuid;
BEGIN
  SELECT id INTO ws_member_id FROM workspace_b4ai6k0t73ulj4l40gxarowdm."workspaceMember" WHERE "nameFirstName" ILIKE '%Bala%' LIMIT 1;
  SELECT id INTO karthik_member_id FROM workspace_b4ai6k0t73ulj4l40gxarowdm."workspaceMember" WHERE "nameFirstName" ILIKE '%Karthik%' LIMIT 1;
  IF karthik_member_id IS NULL THEN karthik_member_id := ws_member_id; END IF;

  -- Update Opportunities with Realistic Amount & Close Date & Owner
  UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm."opportunity"
  SET 
    "amountAmountMicros" = 25000000000, -- ₹25,000.00
    "amountCurrencyCode" = 'INR',
    "closeDate" = NOW() + INTERVAL '7 days',
    "ownerId" = ws_member_id
  WHERE name ILIKE '%Rajesh Kannan%';

  UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm."opportunity"
  SET 
    "amountAmountMicros" = 50000000000, -- ₹50,000.00
    "amountCurrencyCode" = 'INR',
    "closeDate" = NOW() + INTERVAL '5 days',
    "ownerId" = karthik_member_id
  WHERE name ILIKE '%Kavitha Ramanathan%';

  UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm."opportunity"
  SET 
    "amountAmountMicros" = 35000000000, -- ₹35,000.00
    "amountCurrencyCode" = 'INR',
    "closeDate" = NOW() + INTERVAL '10 days',
    "ownerId" = ws_member_id
  WHERE name ILIKE '%Suresh Ranganathan%';

  UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm."opportunity"
  SET 
    "amountAmountMicros" = 18000000000, -- ₹18,000.00
    "amountCurrencyCode" = 'INR',
    "closeDate" = NOW() + INTERVAL '3 days',
    "ownerId" = karthik_member_id
  WHERE name ILIKE '%Priya Sundaram%';

  -- Update Tasks with Assignee
  UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm."task"
  SET "assigneeId" = ws_member_id
  WHERE title ILIKE '%Anand Krishnan%' OR title ILIKE '%Venkatesh Babu%';

  UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm."task"
  SET "assigneeId" = karthik_member_id
  WHERE title ILIKE '%Manojkumar Selvam%' OR title ILIKE '%Priya Sundaram%';

  -- Update Companies with Account Owner
  UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm."company"
  SET "accountOwnerId" = ws_member_id
  WHERE name ILIKE '%Aakash%' OR name ILIKE '%FIITJEE%' OR name ILIKE '%Shankar IAS%';

  UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm."company"
  SET "accountOwnerId" = karthik_member_id
  WHERE name ILIKE '%Vistas%' OR name ILIKE '%Zenith%' OR name ILIKE '%Smart Minds%';

END $$;
`;

  await sb.process.executeCommand(`
    cat << 'EOF' > /tmp/populate_data.sql
${populateDataSql}
EOF
    docker exec -i zed-db-1 psql -U postgres -d default < /tmp/populate_data.sql
  `);

  console.log('--- 4. RESTART SERVER TO REFRESH CACHES ---');
  await sb.process.executeCommand('docker restart zed-server-1');
  await new Promise(r => setTimeout(r, 20000));

  console.log('=== VERIFICATION ===');
  
  const vTasks = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT vf.position, vf.\\"isVisible\\", f.name, f.label
      FROM core.\\"viewField\\" vf JOIN core.\\"fieldMetadata\\" f ON vf.\\"fieldMetadataId\\" = f.id
      WHERE vf.\\"viewId\\" = '889bb141-d341-4848-8bb6-fb6fce64fe9c' AND vf.\\"isVisible\\" = true
      ORDER BY vf.position;
    "
  `);
  console.log('Tasks Columns:\n', vTasks.result);

  const vOpps = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT vf.position, vf.\\"isVisible\\", f.name, f.label
      FROM core.\\"viewField\\" vf JOIN core.\\"fieldMetadata\\" f ON vf.\\"fieldMetadataId\\" = f.id
      WHERE vf.\\"viewId\\" = '44afa993-4577-43fe-810c-cbffdb913ef4' AND vf.\\"isVisible\\" = true
      ORDER BY vf.position;
    "
  `);
  console.log('Opportunities Columns:\n', vOpps.result);

  const oppData = await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      SELECT o.name, o.stage, (o.\\"amountAmountMicros\\"/1000000) as amount, o.\\"closeDate\\"::date as close_date, m.\\"nameFirstName\\" as owner
      FROM workspace_b4ai6k0t73ulj4l40gxarowdm.\\"opportunity\\" o
      LEFT JOIN workspace_b4ai6k0t73ulj4l40gxarowdm.\\"workspaceMember\\" m ON o.\\"ownerId\\" = m.id
      ORDER BY o.\\"createdAt\\" DESC LIMIT 4;
    "
  `);
  console.log('Opportunity Data:\n', oppData.result);
}

applyMasterFix().catch(console.error);
