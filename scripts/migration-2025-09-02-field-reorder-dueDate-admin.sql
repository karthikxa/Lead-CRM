-- Field reorder + DueDate + Amount/Status renames + Admin lock
-- Generic for any workspace, idempotent
DO $$
DECLARE
  ws RECORD; person_obj uuid; company_obj uuid; opp_obj uuid; task_obj uuid;
  custom_app uuid; std_app uuid; ws_schema text; f_id uuid;
BEGIN
  SELECT id INTO custom_app FROM core."application" WHERE name='Custom' LIMIT 1;
  SELECT id INTO std_app FROM core."application" WHERE name='Standard' LIMIT 1;
  FOR ws IN SELECT id FROM core."workspace" LOOP
    SELECT s.schema_name INTO ws_schema FROM information_schema.schemata s JOIN information_schema.tables t ON t.table_schema=s.schema_name WHERE s.schema_name LIKE 'workspace_%' AND t.table_name='person' LIMIT 1;
    IF ws_schema IS NULL THEN CONTINUE; END IF;
    SELECT id INTO person_obj FROM core."objectMetadata" WHERE "workspaceId"=ws.id AND "nameSingular"='person' LIMIT 1;
    SELECT id INTO company_obj FROM core."objectMetadata" WHERE "workspaceId"=ws.id AND "nameSingular"='company' LIMIT 1;
    SELECT id INTO opp_obj FROM core."objectMetadata" WHERE "workspaceId"=ws.id AND "nameSingular"='opportunity' LIMIT 1;
    SELECT id INTO task_obj FROM core."objectMetadata" WHERE "workspaceId"=ws.id AND "nameSingular"='task' LIMIT 1;

    -- 1) Opportunity: Budget→Amount, Stage→Status
    UPDATE core."fieldMetadata" SET "label"='Amount' WHERE "workspaceId"=ws.id AND "objectMetadataId"=opp_obj AND "name"='amount' AND "label"='Budget (INR)';
    UPDATE core."fieldMetadata" SET "label"='Amount' WHERE "workspaceId"=ws.id AND "objectMetadataId"=opp_obj AND "name"='amount' AND "label"='Amount (INR)';
    -- Ensure amount label is Amount (handle both)
    UPDATE core."fieldMetadata" SET "label"='Amount' WHERE "workspaceId"=ws.id AND "objectMetadataId"=opp_obj AND "name"='amount';
    UPDATE core."fieldMetadata" SET "label"='Status' WHERE "workspaceId"=ws.id AND "objectMetadataId"=opp_obj AND "name"='stage';

    -- 2) Person: add dueDate DATE_TIME if missing (label Due Date)
    SELECT id INTO f_id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=person_obj AND "name"='dueDate' LIMIT 1;
    IF f_id IS NULL THEN
      f_id := gen_random_uuid();
      INSERT INTO core."fieldMetadata" (id,"objectMetadataId",type,name,label,"isActive","isSystem","isUIReadOnly","isNullable","workspaceId","universalIdentifier","applicationId", settings)
      VALUES (f_id, person_obj, 'DATE_TIME', 'dueDate', 'Due Date', true,false,false,true, ws.id, gen_random_uuid(), custom_app, '{"displayFormat":"RELATIVE"}');
      EXECUTE format('ALTER TABLE %I."person" ADD COLUMN IF NOT EXISTS "dueDate" timestamp with time zone', ws_schema);
      RAISE NOTICE 'Person dueDate added for %', ws.id;
    END IF;
    -- Company: add dueDate if missing
    SELECT id INTO f_id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=company_obj AND "name"='dueDate' LIMIT 1;
    IF f_id IS NULL THEN
      f_id := gen_random_uuid();
      INSERT INTO core."fieldMetadata" (id,"objectMetadataId",type,name,label,"isActive","isSystem","isUIReadOnly","isNullable","workspaceId","universalIdentifier","applicationId", settings)
      VALUES (f_id, company_obj, 'DATE_TIME', 'dueDate', 'Due Date', true,false,false,true, ws.id, gen_random_uuid(), custom_app, '{"displayFormat":"RELATIVE"}');
      EXECUTE format('ALTER TABLE %I."company" ADD COLUMN IF NOT EXISTS "dueDate" timestamp with time zone', ws_schema);
      RAISE NOTICE 'Company dueDate added for %', ws.id;
    END IF;
    -- Opportunity: add dueDate if missing (distinct from closeDate which is Meeting Scheduled)
    SELECT id INTO f_id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=opp_obj AND "name"='dueDate' LIMIT 1;
    IF f_id IS NULL THEN
      f_id := gen_random_uuid();
      INSERT INTO core."fieldMetadata" (id,"objectMetadataId",type,name,label,"isActive","isSystem","isUIReadOnly","isNullable","workspaceId","universalIdentifier","applicationId", settings)
      VALUES (f_id, opp_obj, 'DATE_TIME', 'dueDate', 'Due Date', true,false,false,true, ws.id, gen_random_uuid(), custom_app, '{"displayFormat":"RELATIVE"}');
      EXECUTE format('ALTER TABLE %I."opportunity" ADD COLUMN IF NOT EXISTS "dueDate" timestamp with time zone', ws_schema);
      RAISE NOTICE 'Opportunity dueDate added for %', ws.id;
    END IF;
    -- Task already has dueAt, keep as is ( Due Date label already)

    -- 3) Ensure creation date visible is already, no need to add

    -- 4) Admin lock: only balunithyapriya@gmail.com and zedagencyofficial@gmail.com can be Admin
    -- Demote any other Admin to Member via roleTarget
    UPDATE core."roleTarget" SET "roleId" = (SELECT id FROM core."role" WHERE "workspaceId"=ws.id AND label='Member' LIMIT 1)
    WHERE "workspaceId"=ws.id AND "roleId" = (SELECT id FROM core."role" WHERE "workspaceId"=ws.id AND label='Admin' LIMIT 1)
    AND "userWorkspaceId" IN (SELECT uw.id FROM core."userWorkspace" uw JOIN core."user" u ON u.id=uw."userId" WHERE u.email NOT IN ('balunithyapriya@gmail.com','zedagencyofficial@gmail.com'));

  END LOOP;
END $$;

-- 5) Reorder viewFields to match People order for All views (best effort, will be done via separate view logic if needed)
-- People reference order: name(0), emails(1), phones(2), company(3), jobTitle(4), leadStatus(5), assignedTo(6), createdAt(7), dueDate(8)
-- For Opportunity and Task, we will update positions to match via a second DO block
DO $$
DECLARE
  ws RECORD; person_obj uuid; opp_obj uuid; task_obj uuid; company_obj uuid;
  view_id uuid; seq int; fid uuid;
BEGIN
  FOR ws IN SELECT id FROM core."workspace" LOOP
    SELECT id INTO person_obj FROM core."objectMetadata" WHERE "workspaceId"=ws.id AND "nameSingular"='person' LIMIT 1;
    SELECT id INTO opp_obj FROM core."objectMetadata" WHERE "workspaceId"=ws.id AND "nameSingular"='opportunity' LIMIT 1;
    SELECT id INTO task_obj FROM core."objectMetadata" WHERE "workspaceId"=ws.id AND "nameSingular"='task' LIMIT 1;
    SELECT id INTO company_obj FROM core."objectMetadata" WHERE "workspaceId"=ws.id AND "nameSingular"='company' LIMIT 1;

    -- Opportunity reorder: name0, emails1, phones2, company3, jobTitle4, stage/status5, owner6, createdAt7, dueDate8, closeDate9, pointOfContact10, amount11
    SELECT id INTO view_id FROM core."view" WHERE "objectMetadataId"=opp_obj AND "name"='All {objectLabelPlural}' LIMIT 1;
    IF view_id IS NOT NULL THEN
      -- This is a simple reorder: set positions based on People order + extras at end
      -- We will update position for each field if viewField exists
      UPDATE core."viewField" SET "position"=0 WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "objectMetadataId"=opp_obj AND "name"='name' LIMIT 1);
      UPDATE core."viewField" SET "position"=1 WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "objectMetadataId"=opp_obj AND "name"='emails' LIMIT 1);
      UPDATE core."viewField" SET "position"=2 WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "objectMetadataId"=opp_obj AND "name"='phones' LIMIT 1);
      UPDATE core."viewField" SET "position"=3 WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "objectMetadataId"=opp_obj AND "name"='company' LIMIT 1);
      UPDATE core."viewField" SET "position"=4 WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "objectMetadataId"=opp_obj AND "name"='jobTitle' LIMIT 1);
      UPDATE core."viewField" SET "position"=5 WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "objectMetadataId"=opp_obj AND "name"='stage' LIMIT 1);
      UPDATE core."viewField" SET "position"=6 WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "objectMetadataId"=opp_obj AND "name"='owner' LIMIT 1);
      UPDATE core."viewField" SET "position"=7 WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "objectMetadataId"=opp_obj AND "name"='createdAt' LIMIT 1);
      UPDATE core."viewField" SET "position"=8 WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "objectMetadataId"=opp_obj AND "name"='dueDate' LIMIT 1);
      UPDATE core."viewField" SET "position"=9 WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "objectMetadataId"=opp_obj AND "name"='closeDate' LIMIT 1);
      UPDATE core."viewField" SET "position"=10 WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "objectMetadataId"=opp_obj AND "name"='pointOfContact' LIMIT 1);
      UPDATE core."viewField" SET "position"=11 WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "objectMetadataId"=opp_obj AND "name"='amount' LIMIT 1);
    END IF;

    -- Task reorder: title0, emails1, phones2, company3, jobTitle4, status5, assignee6, createdAt7, dueAt8
    SELECT id INTO view_id FROM core."view" WHERE "objectMetadataId"=task_obj AND "name"='All {objectLabelPlural}' LIMIT 1;
    IF view_id IS NOT NULL THEN
      UPDATE core."viewField" SET "position"=0 WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "objectMetadataId"=task_obj AND "name"='title' LIMIT 1);
      UPDATE core."viewField" SET "position"=1 WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "objectMetadataId"=task_obj AND "name"='emails' LIMIT 1);
      UPDATE core."viewField" SET "position"=2 WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "objectMetadataId"=task_obj AND "name"='phones' LIMIT 1);
      UPDATE core."viewField" SET "position"=3 WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "objectMetadataId"=task_obj AND "name"='company' LIMIT 1);
      UPDATE core."viewField" SET "position"=4 WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "objectMetadataId"=task_obj AND "name"='jobTitle' LIMIT 1);
      UPDATE core."viewField" SET "position"=5 WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "objectMetadataId"=task_obj AND "name"='status' LIMIT 1);
      UPDATE core."viewField" SET "position"=6 WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "objectMetadataId"=task_obj AND "name"='assignee' LIMIT 1);
      UPDATE core."viewField" SET "position"=7 WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "objectMetadataId"=task_obj AND "name"='createdAt' LIMIT 1);
      UPDATE core."viewField" SET "position"=8 WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "objectMetadataId"=task_obj AND "name"='dueAt' LIMIT 1);
    END IF;

    -- Company reorder: name0, domainName1, emails2, phones3, address4, jobTitle5, accountOwner6, createdAt7, dueDate8
    SELECT id INTO view_id FROM core."view" WHERE "objectMetadataId"=company_obj AND "name"='All {objectLabelPlural}' LIMIT 1;
    IF view_id IS NOT NULL THEN
      UPDATE core."viewField" SET "position"=0 WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "objectMetadataId"=company_obj AND "name"='name' LIMIT 1);
      UPDATE core."viewField" SET "position"=1 WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "objectMetadataId"=company_obj AND "name"='domainName' LIMIT 1);
      -- Company doesn't have emails/phones by default, skip if missing
      UPDATE core."viewField" SET "position"=7 WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "objectMetadataId"=company_obj AND "name"='createdAt' LIMIT 1);
      UPDATE core."viewField" SET "position"=8 WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "objectMetadataId"=company_obj AND "name"='dueDate' LIMIT 1);
    END IF;

    -- Person reorder: ensure dueDate at 8
    SELECT id INTO view_id FROM core."view" WHERE "objectMetadataId"=person_obj AND "name"='All {objectLabelPlural}' LIMIT 1;
    IF view_id IS NOT NULL THEN
      UPDATE core."viewField" SET "position"=7 WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "objectMetadataId"=person_obj AND "name"='createdAt' LIMIT 1);
      UPDATE core."viewField" SET "position"=8 WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "objectMetadataId"=person_obj AND "name"='dueDate' LIMIT 1);
    END IF;
  END LOOP;
END $$;
