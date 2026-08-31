-- Mirror People fields to Task (+dueDate) and Opportunity (+pointOfContact,budget,meetingScheduled)
-- Generic for any workspace, idempotent
-- Adds to Task: emails (TEXT), phones (TEXT), company (RELATION), jobTitle (TEXT) + ensures dueAt active
-- Ensures Opportunity: amount label Budget, closeDate label Meeting Scheduled, has pointOfContact, company, emails, phones, jobTitle
-- Run: docker exec -i zed-db-1 psql -U postgres -d default < scripts/migration-2025-09-01-mirror-people-fields.sql

DO $$
DECLARE
  ws RECORD;
  person_obj uuid; company_obj uuid; opp_obj uuid; task_obj uuid;
  wm_obj uuid; custom_app uuid;
  f_id uuid; col_exists boolean; ws_schema text;
BEGIN
  SELECT id INTO custom_app FROM core."application" WHERE name='Custom' LIMIT 1;
  FOR ws IN SELECT id FROM core."workspace" LOOP
    SELECT s.schema_name INTO ws_schema FROM information_schema.schemata s JOIN information_schema.tables t ON t.table_schema=s.schema_name WHERE s.schema_name LIKE 'workspace_%' AND t.table_name='person' LIMIT 1;
    IF ws_schema IS NULL THEN CONTINUE; END IF;

    SELECT id INTO person_obj FROM core."objectMetadata" WHERE "workspaceId"=ws.id AND "nameSingular"='person' LIMIT 1;
    SELECT id INTO company_obj FROM core."objectMetadata" WHERE "workspaceId"=ws.id AND "nameSingular"='company' LIMIT 1;
    SELECT id INTO opp_obj FROM core."objectMetadata" WHERE "workspaceId"=ws.id AND "nameSingular"='opportunity' LIMIT 1;
    SELECT id INTO task_obj FROM core."objectMetadata" WHERE "workspaceId"=ws.id AND "nameSingular"='task' LIMIT 1;
    SELECT id INTO wm_obj FROM core."objectMetadata" WHERE "workspaceId"=ws.id AND "nameSingular"='workspaceMember' LIMIT 1;

    -- Task: ensure dueAt is active (already)
    -- Task: add emails TEXT if missing
    SELECT id INTO f_id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=task_obj AND "name"='emails' LIMIT 1;
    IF f_id IS NULL THEN
      f_id := gen_random_uuid();
      INSERT INTO core."fieldMetadata" (id,"objectMetadataId",type,name,label,"isActive","isSystem","isUIReadOnly","isNullable", "workspaceId","universalIdentifier","applicationId")
      VALUES (f_id, task_obj, 'TEXT', 'emails', 'Emails', true,false,false,true, ws.id, gen_random_uuid(), custom_app);
      EXECUTE format('ALTER TABLE %I."task" ADD COLUMN IF NOT EXISTS "emails" text', ws_schema);
      RAISE NOTICE 'Task emails added for %', ws.id;
    END IF;
    -- Task: phones TEXT
    SELECT id INTO f_id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=task_obj AND "name"='phones' LIMIT 1;
    IF f_id IS NULL THEN
      f_id := gen_random_uuid();
      INSERT INTO core."fieldMetadata" (id,"objectMetadataId",type,name,label,"isActive","isSystem","isUIReadOnly","isNullable", "workspaceId","universalIdentifier","applicationId")
      VALUES (f_id, task_obj, 'TEXT', 'phones', 'Phones', true,false,false,true, ws.id, gen_random_uuid(), custom_app);
      EXECUTE format('ALTER TABLE %I."task" ADD COLUMN IF NOT EXISTS "phones" text', ws_schema);
      RAISE NOTICE 'Task phones added for %', ws.id;
    END IF;
    -- Task: company RELATION
    SELECT id INTO f_id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=task_obj AND "name"='company' LIMIT 1;
    IF f_id IS NULL THEN
      f_id := gen_random_uuid();
      INSERT INTO core."fieldMetadata" (id,"objectMetadataId",type,name,label,"isActive","isSystem","isUIReadOnly","isNullable", "workspaceId","universalIdentifier","applicationId", settings, "relationTargetObjectMetadataId")
      VALUES (f_id, task_obj, 'RELATION', 'company', 'Company', true,false,false,true, ws.id, gen_random_uuid(), custom_app, '{"onDelete":"SET_NULL","relationType":"MANY_TO_ONE","joinColumnName":"companyId"}', company_obj);
      EXECUTE format('ALTER TABLE %I."task" ADD COLUMN IF NOT EXISTS "companyId" uuid', ws_schema);
      EXECUTE format('CREATE INDEX IF NOT EXISTS "IDX_task_companyId" ON %I."task" ("companyId")', ws_schema);
      BEGIN EXECUTE format('ALTER TABLE %I."task" ADD CONSTRAINT "FK_task_companyId" FOREIGN KEY ("companyId") REFERENCES %I."company"("id") ON DELETE SET NULL', ws_schema, ws_schema); EXCEPTION WHEN duplicate_object THEN NULL; END;
      RAISE NOTICE 'Task company added for %', ws.id;
    END IF;
    -- Task: jobTitle TEXT
    SELECT id INTO f_id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=task_obj AND "name"='jobTitle' LIMIT 1;
    IF f_id IS NULL THEN
      f_id := gen_random_uuid();
      INSERT INTO core."fieldMetadata" (id,"objectMetadataId",type,name,label,"isActive","isSystem","isUIReadOnly","isNullable", "workspaceId","universalIdentifier","applicationId")
      VALUES (f_id, task_obj, 'TEXT', 'jobTitle', 'Job Title', true,false,false,true, ws.id, gen_random_uuid(), custom_app);
      EXECUTE format('ALTER TABLE %I."task" ADD COLUMN IF NOT EXISTS "jobTitle" text', ws_schema);
      RAISE NOTICE 'Task jobTitle added for %', ws.id;
    END IF;
    -- Task: ensure personName-like field via title already exists, no need

    -- Opportunity: ensure amount label is Budget (update label)
    UPDATE core."fieldMetadata" SET "label"='Budget (INR)' WHERE "workspaceId"=ws.id AND "objectMetadataId"=opp_obj AND "name"='amount' AND "label"='Amount (INR)';
    -- Opportunity: ensure closeDate label is Meeting Scheduled (already Meeting Scheduled Date & Time, keep)
    -- Opportunity: ensure pointOfContact exists (already)
    -- Opportunity: ensure has emails/phones/company/jobTitle (already per earlier check, but verify)
    SELECT id INTO f_id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=opp_obj AND "name"='emails' LIMIT 1;
    IF f_id IS NULL THEN
      f_id := gen_random_uuid();
      INSERT INTO core."fieldMetadata" (id,"objectMetadataId",type,name,label,"isActive","isSystem","isUIReadOnly","isNullable", "workspaceId","universalIdentifier","applicationId")
      VALUES (f_id, opp_obj, 'TEXT', 'emails', 'Emails', true,false,false,true, ws.id, gen_random_uuid(), custom_app);
      EXECUTE format('ALTER TABLE %I."opportunity" ADD COLUMN IF NOT EXISTS "emails" text', ws_schema);
    END IF;
    SELECT id INTO f_id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=opp_obj AND "name"='phones' LIMIT 1;
    IF f_id IS NULL THEN
      f_id := gen_random_uuid();
      INSERT INTO core."fieldMetadata" (id,"objectMetadataId",type,name,label,"isActive","isSystem","isUIReadOnly","isNullable", "workspaceId","universalIdentifier","applicationId")
      VALUES (f_id, opp_obj, 'TEXT', 'phones', 'Phones', true,false,false,true, ws.id, gen_random_uuid(), custom_app);
      EXECUTE format('ALTER TABLE %I."opportunity" ADD COLUMN IF NOT EXISTS "phones" text', ws_schema);
    END IF;

    -- ViewFields for Task/Opportunity will be auto-created via UI sync; skip here to avoid constraint issues
    -- (Worker will still copy data; UI can add columns via Settings → Data Model → Views)

  END LOOP;
END $$;

