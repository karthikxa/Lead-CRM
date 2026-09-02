-- Mock data for testing: 8 People with all 6 statuses, assignedTo/assignedBy, dueDate, creationDate
DO $$
DECLARE ws_schema text; ws_id uuid; person_obj uuid; company_obj uuid; karthik_id uuid; testb_id uuid; comp1 uuid; comp2 uuid;
BEGIN
  SELECT s.schema_name INTO ws_schema FROM information_schema.schemata s JOIN information_schema.tables t ON t.table_schema=s.schema_name WHERE s.schema_name LIKE 'workspace_%' AND t.table_name='person' LIMIT 1;
  SELECT id INTO ws_id FROM core."workspace" LIMIT 1;
  SELECT id INTO person_obj FROM core."objectMetadata" WHERE "workspaceId"=ws_id AND "nameSingular"='person' LIMIT 1;
  SELECT id INTO company_obj FROM core."objectMetadata" WHERE "workspaceId"=ws_id AND "nameSingular"='company' LIMIT 1;
  EXECUTE format('SELECT id FROM %I."workspaceMember" WHERE "userEmail"=''balunithyapriya@gmail.com'' LIMIT 1', ws_schema) INTO karthik_id;
  IF karthik_id IS NULL THEN EXECUTE format('SELECT id FROM %I."workspaceMember" LIMIT 1', ws_schema) INTO karthik_id; END IF;
  EXECUTE format('SELECT id FROM %I."workspaceMember" WHERE "userEmail"=''tempkorean28@gmail.com'' LIMIT 1', ws_schema) INTO testb_id;
  IF testb_id IS NULL THEN EXECUTE format('SELECT id FROM %I."workspaceMember" ORDER BY "createdAt" LIMIT 1 OFFSET 1', ws_schema) INTO testb_id; END IF;
  IF testb_id IS NULL THEN testb_id := karthik_id; END IF;
  EXECUTE format('SELECT id FROM %I."company" LIMIT 1', ws_schema) INTO comp1;
  EXECUTE format('SELECT id FROM %I."company" LIMIT 1 OFFSET 1', ws_schema) INTO comp2;
  IF comp2 IS NULL THEN comp2 := comp1; END IF;

  -- Clean previous mock with test@example.com
  EXECUTE format('DELETE FROM %I."person" WHERE "emailsPrimaryEmail" LIKE ''%%@example.com''', ws_schema);

  -- Insert 8 mock persons covering all 6 statuses
  EXECUTE format('INSERT INTO %I."person" (id, "createdAt","updatedAt","nameFirstName","nameLastName","emailsPrimaryEmail","phonesPrimaryPhoneNumber","companyId","jobTitle","leadStatus","assignedToId","assignedById","dueDate","position") VALUES 
    (gen_random_uuid(), NOW()-interval ''2 days'', NOW(), ''Aarav'',''Sharma'',''aarav.sharma@example.com'',''+919876543210'', $1, ''Founder'',''New'',$2,$3, NOW()+interval ''3 days'', 0),
    (gen_random_uuid(), NOW()-interval ''1 day'', NOW(), ''Priya'',''Verma'',''priya.verma@example.com'',''+919876543211'', $1, ''Manager'',''Follow Up'',$2,$3, NOW()+interval ''2 hours'', 0),
    (gen_random_uuid(), NOW()-interval ''3 days'', NOW(), ''Rahul'',''Singh'',''rahul.singh@example.com'',''+919876543212'', $4, ''Director'',''Not Attended'',$5,$3, NOW()-interval ''1 hour'', 0),
    (gen_random_uuid(), NOW()-interval ''4 days'', NOW(), ''Sneha'',''Patel'',''sneha.patel@example.com'',''+919876543213'', $4, ''Head'',''Scheduled'',$2,$3, NOW()+interval ''1 day'', 0),
    (gen_random_uuid(), NOW()-interval ''5 days'', NOW(), ''Vikram'',''Reddy'',''vikram.reddy@example.com'',''+919876543214'', $1, ''CEO'',''Booked'',$5,$3, NOW()+interval ''7 days'', 0),
    (gen_random_uuid(), NOW()-interval ''1 day'', NOW(), ''Ananya'',''Gupta'',''ananya.gupta@example.com'',''+919876543215'', $4, ''Lead'',''Rejected'',$2,$3, NOW(), 0),
    (gen_random_uuid(), NOW(), NOW(), ''Karan'',''Mehta'',''karan.mehta@example.com'',''+919876543216'', $1, ''Ops'',''New'',$5,$3, NOW()+interval ''5 days'', 0),
    (gen_random_uuid(), NOW(), NOW(), ''Divya'',''Nair'',''divya.nair@example.com'',''+919876543217'', $4, ''Marketing'',''Follow Up'',$2,$3, NOW()+interval ''3 hours'', 0)
  ', ws_schema) USING comp1, karthik_id, karthik_id, comp2, testb_id;

  -- Create one Opportunity for Booked/Scheduled to test
  EXECUTE format('INSERT INTO %I."opportunity" (id, "createdAt","updatedAt", name, "amountAmountMicros","amountCurrencyCode","closeDate","pointOfContactId","companyId","ownerId","assignedById", stage, position, "emails","phones", "dueDate") SELECT gen_random_uuid(), NOW(), NOW(), ''Test Booked Opp - ''||"nameFirstName", 5000000000,''INR'', NOW()+interval ''7 days'', id, "companyId", "assignedToId", "assignedById", ''CUSTOMER'', 0, "emailsPrimaryEmail","phonesPrimaryPhoneNumber", "dueDate" FROM %I."person" WHERE "leadStatus"=''Booked'' LIMIT 1', ws_schema, ws_schema);
  EXECUTE format('INSERT INTO %I."opportunity" (id, "createdAt","updatedAt", name, "amountAmountMicros","amountCurrencyCode","closeDate","pointOfContactId","companyId","ownerId","assignedById", stage, position, "emails","phones", "dueDate") SELECT gen_random_uuid(), NOW(), NOW(), ''Test Scheduled Opp - ''||"nameFirstName", 3000000000,''INR'', NOW()+interval ''1 day'', id, "companyId", "assignedToId", "assignedById", ''MEETING'', 0, "emailsPrimaryEmail","phonesPrimaryPhoneNumber", "dueDate" FROM %I."person" WHERE "leadStatus"=''Scheduled'' LIMIT 1', ws_schema, ws_schema);

  -- Create one Task for Follow Up (use TODO for task status, as task_status_enum still has old values; People status is separate)
  EXECUTE format('INSERT INTO %I."task" (id, "createdAt","updatedAt", title, status, "dueAt","assigneeId","assignedById","emails","phones","companyId","jobTitle") SELECT gen_random_uuid(), NOW(), NOW(), ''Follow Up: ''||"nameFirstName", ''TODO'', "dueDate", "assignedToId","assignedById","emailsPrimaryEmail","phonesPrimaryPhoneNumber","companyId","jobTitle" FROM %I."person" WHERE "leadStatus"=''Follow Up'' LIMIT 1', ws_schema, ws_schema);

  RAISE NOTICE 'Mock data seeded for %', ws_schema;
END $$;
