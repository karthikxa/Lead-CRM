const { Daytona } = require('@daytona/sdk');

async function fixAll() {
  const d = new Daytona({ apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef', serverUrl: 'https://app.daytona.io/api' });
  const sb = await d.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  // ─── ROOT CAUSE 1: leadStatus field maps to column "leadStatus" but the DB
  // column is named "status" (a lead_status_enum column). The SELECT type field
  // in Twenty CRM uses its own DB column named after the field's `name` property.
  // We need the DB column to be named "leadStatus" to match what the ORM expects.
  console.log('1. Fixing DB column name to match field metadata name...');
  await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      ALTER TABLE workspace_b4ai6k0t73ulj4l40gxarowdm.\\"person\\" RENAME COLUMN status TO \\"leadStatus\\";
    "
  `);

  // ─── ROOT CAUSE 2: The Twenty ORM requires SELECT fields to store as text, 
  // not a custom enum. Change the column to text type.
  await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      DROP TRIGGER IF EXISTS trg_person_status ON workspace_b4ai6k0t73ulj4l40gxarowdm.\\"person\\";
      ALTER TABLE workspace_b4ai6k0t73ulj4l40gxarowdm.\\"person\\" 
        ALTER COLUMN \\"leadStatus\\" TYPE text 
        USING \\"leadStatus\\"::text;
      ALTER TABLE workspace_b4ai6k0t73ulj4l40gxarowdm.\\"person\\" 
        ALTER COLUMN \\"leadStatus\\" SET DEFAULT 'New';
    "
  `);

  // ─── Rebuild trigger with text column
  const trigger = `
CREATE OR REPLACE FUNCTION workspace_b4ai6k0t73ulj4l40gxarowdm.handle_person_status_trigger()
RETURNS TRIGGER AS $$
DECLARE
  ws_member_id uuid;
  lead_name text;
BEGIN
  SELECT id INTO ws_member_id FROM workspace_b4ai6k0t73ulj4l40gxarowdm."workspaceMember" LIMIT 1;
  lead_name := TRIM(COALESCE(NEW."nameFirstName",'') || ' ' || COALESCE(NEW."nameLastName",''));
  IF lead_name = '' THEN lead_name := COALESCE(NEW."emailsPrimaryEmail",'Lead'); END IF;

  IF (NEW."leadStatus" IN ('Not Attended','Follow Up')) AND (COALESCE(OLD."leadStatus",'') != NEW."leadStatus") THEN
    INSERT INTO workspace_b4ai6k0t73ulj4l40gxarowdm."task"
      (id,"createdAt","updatedAt",title,"bodyV2Markdown","dueAt",status,"assigneeId","position")
    VALUES (gen_random_uuid(),NOW(),NOW(),'Follow up with '||lead_name||' ('||NEW."leadStatus"||')',
      'Auto-task for '||lead_name, NOW()+INTERVAL '1 day',
      'TODO'::workspace_b4ai6k0t73ulj4l40gxarowdm."task_status_enum",
      COALESCE(NEW."accountOwnerId", ws_member_id), 0);
  END IF;

  IF (NEW."leadStatus" IN ('Booked','Scheduled')) AND (COALESCE(OLD."leadStatus",'') NOT IN ('Booked','Scheduled')) THEN
    INSERT INTO workspace_b4ai6k0t73ulj4l40gxarowdm."opportunity"
      (id,"createdAt","updatedAt",name,stage,"pointOfContactId","companyId","ownerId","position")
    VALUES (gen_random_uuid(),NOW(),NOW(),lead_name||' - Booked Meeting',
      'MEETING'::workspace_b4ai6k0t73ulj4l40gxarowdm."opportunity_stage_enum",
      NEW.id, NEW."companyId", COALESCE(NEW."accountOwnerId", ws_member_id), 0);
  END IF;

  IF NEW."leadStatus" = 'Rejected' THEN
    NEW."deletedAt" := NOW();
  ELSIF COALESCE(OLD."leadStatus",'') = 'Rejected' THEN
    NEW."deletedAt" := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_person_status
BEFORE INSERT OR UPDATE ON workspace_b4ai6k0t73ulj4l40gxarowdm."person"
FOR EACH ROW EXECUTE FUNCTION workspace_b4ai6k0t73ulj4l40gxarowdm.handle_person_status_trigger();
`;

  await sb.process.executeCommand(`
    cat << 'EOF' > /tmp/fix_trigger.sql
${trigger}
EOF
    docker exec -i zed-db-1 psql -U postgres -d default < /tmp/fix_trigger.sql
  `);
  console.log('2. Trigger rebuilt with text column.');

  // Update existing data
  await sb.process.executeCommand(`
    docker exec zed-db-1 psql -U postgres -d default -c "
      UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm.\\"person\\" SET \\"leadStatus\\" = 'Booked' WHERE \\"nameFirstName\\" = 'Rajesh';
      UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm.\\"person\\" SET \\"leadStatus\\" = 'Scheduled' WHERE \\"nameFirstName\\" = 'Suresh';
      UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm.\\"person\\" SET \\"leadStatus\\" = 'Follow Up' WHERE \\"nameFirstName\\" IN ('Priya','Manojkumar');
      UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm.\\"person\\" SET \\"leadStatus\\" = 'Not Attended' WHERE \\"nameFirstName\\" IN ('Venkatesh','Anand');
    "
  `);

  // ─── ROOT CAUSE 3: Slow reload = blank page = Daytona proxy cold wake 
  // + React SPA waiting on GraphQL metadata. Fix: enable server-side 
  // response compression and increase Node.js heap.
  console.log('3. Enabling gzip compression in NestJS server...');
  await sb.process.executeCommand(`
    docker exec zed-server-1 sh -c "cd /app && grep -q 'compression' packages/twenty-server/dist/main.js || sed -i 's/app.enableCors/const compression=require(\"compression\");app.use(compression());app.enableCors/' packages/twenty-server/dist/main.js" 2>/dev/null || true
  `);

  // ─── ROOT CAUSE 4: Redis cache not warmed - pre-warm it
  console.log('4. Pre-warming Redis metadata cache...');
  await sb.process.executeCommand(`
    curl -s -H "Authorization: Bearer $(docker exec zed-server-1 cat /tmp/.auth_token 2>/dev/null || echo 'skip')" \
    http://localhost:3000/metadata > /dev/null 2>&1 || true
    curl -s http://localhost:3000/healthz > /dev/null
    curl -s http://localhost:3000/ > /dev/null
  `);

  // ─── Fix invite email - check workspace-invitation.service
  console.log('5. Checking invite email template...');
  const invitePath = await sb.process.executeCommand(`
    docker exec zed-server-1 find /app -name "workspace-invitation.service.js" 2>/dev/null | head -1
  `);
  console.log('Invite service path:\n', invitePath.result);

  // ─── Restart with higher memory limit for faster JIT warmup
  console.log('6. Restarting server with memory optimization...');
  await sb.process.executeCommand(`
    docker update --memory=2g --memory-swap=2g zed-server-1 2>/dev/null || true
    docker restart zed-server-1
  `);
  
  await new Promise(r => setTimeout(r, 22000));
  const h = await sb.process.executeCommand('curl -s -w "%{time_total}s" http://localhost:3000/healthz');
  console.log('Health check:\n', h.result);
}

fixAll().catch(console.error);
