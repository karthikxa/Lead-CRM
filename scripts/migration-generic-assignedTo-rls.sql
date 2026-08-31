-- Generic migration: assignedTo RELATION + RLS + field locks
-- Works for ANY workspace (looks up IDs dynamically). Safe to re-run.
-- Run: docker exec -i zed-db-1 psql -U postgres -d default < scripts/migration-generic-assignedTo-rls.sql

DO $$
DECLARE
  ws_id uuid;
  std_app uuid;
  custom_app uuid;
  person_obj uuid;
  company_obj uuid;
  opp_obj uuid;
  task_obj uuid;
  wm_obj uuid;
  member_role uuid;
  assignedTo_field uuid;
  assignedPeople_field uuid;
  accountOwner_field uuid;
  owner_field uuid;
  assignee_field uuid;
  wm_id_field uuid;
  schema_name text;
  col_exists boolean;
BEGIN
  SELECT id INTO ws_id FROM core."workspace" LIMIT 1;
  IF ws_id IS NULL THEN RAISE EXCEPTION 'No workspace found'; END IF;

  SELECT id INTO std_app FROM core."application" WHERE name='Standard' LIMIT 1;
  SELECT id INTO custom_app FROM core."application" WHERE name='Custom' LIMIT 1;

  SELECT id INTO person_obj FROM core."objectMetadata" WHERE "workspaceId"=ws_id AND "nameSingular"='person' LIMIT 1;
  SELECT id INTO company_obj FROM core."objectMetadata" WHERE "workspaceId"=ws_id AND "nameSingular"='company' LIMIT 1;
  SELECT id INTO opp_obj FROM core."objectMetadata" WHERE "workspaceId"=ws_id AND "nameSingular"='opportunity' LIMIT 1;
  SELECT id INTO task_obj FROM core."objectMetadata" WHERE "workspaceId"=ws_id AND "nameSingular"='task' LIMIT 1;
  SELECT id INTO wm_obj FROM core."objectMetadata" WHERE "workspaceId"=ws_id AND "nameSingular"='workspaceMember' LIMIT 1;
  SELECT id INTO member_role FROM core."role" WHERE "workspaceId"=ws_id AND label='Member' LIMIT 1;

  SELECT id INTO wm_id_field FROM core."fieldMetadata" WHERE "workspaceId"=ws_id AND "objectMetadataId"=wm_obj AND name='id' LIMIT 1;
  SELECT id INTO accountOwner_field FROM core."fieldMetadata" WHERE "workspaceId"=ws_id AND "objectMetadataId"=company_obj AND name='accountOwner' LIMIT 1;
  SELECT id INTO owner_field FROM core."fieldMetadata" WHERE "workspaceId"=ws_id AND "objectMetadataId"=opp_obj AND name='owner' LIMIT 1;
  SELECT id INTO assignee_field FROM core."fieldMetadata" WHERE "workspaceId"=ws_id AND "objectMetadataId"=task_obj AND name='assignee' LIMIT 1;

  SELECT id INTO assignedTo_field FROM core."fieldMetadata" WHERE "workspaceId"=ws_id AND "objectMetadataId"=person_obj AND name='assignedTo' LIMIT 1;

  -- Create assignedTo if missing
  IF assignedTo_field IS NULL THEN
    assignedTo_field := gen_random_uuid();
    INSERT INTO core."fieldMetadata" (id, "objectMetadataId", type, name, label, "isActive","isSystem","isUIReadOnly","isNullable", "workspaceId","universalIdentifier","applicationId", settings, "relationTargetObjectMetadataId")
    VALUES (assignedTo_field, person_obj, 'RELATION', 'assignedTo', 'Assigned To', true,false,false,true, ws_id, gen_random_uuid(), custom_app, '{"onDelete":"SET_NULL","relationType":"MANY_TO_ONE","joinColumnName":"assignedToId"}', wm_obj);
  ELSE
    UPDATE core."fieldMetadata" SET type='RELATION', settings='{"onDelete":"SET_NULL","relationType":"MANY_TO_ONE","joinColumnName":"assignedToId"}', "relationTargetObjectMetadataId"=wm_obj, "updatedAt"=NOW() WHERE id=assignedTo_field AND type='TEXT';
  END IF;

  -- Create assignedPeople back-ref if missing
  SELECT id INTO assignedPeople_field FROM core."fieldMetadata" WHERE "workspaceId"=ws_id AND "objectMetadataId"=wm_obj AND name='assignedPeople' LIMIT 1;
  IF assignedPeople_field IS NULL THEN
    assignedPeople_field := gen_random_uuid();
    INSERT INTO core."fieldMetadata" (id, "objectMetadataId", type, name, label, "isActive","isSystem","isUIReadOnly","isNullable", "workspaceId","universalIdentifier","applicationId", settings, "relationTargetObjectMetadataId","relationTargetFieldMetadataId")
    VALUES (assignedPeople_field, wm_obj, 'RELATION', 'assignedPeople', 'Assigned People', true,false,false,true, ws_id, gen_random_uuid(), custom_app, '{"relationType":"ONE_TO_MANY"}', person_obj, assignedTo_field);
    UPDATE core."fieldMetadata" SET "relationTargetFieldMetadataId"=assignedPeople_field WHERE id=assignedTo_field;
  END IF;

  -- Workspace table schema name lookup
  SELECT schema_name INTO schema_name FROM information_schema.schemata WHERE schema_name LIKE 'workspace_%' LIMIT 1;
  IF schema_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE %I."person" ADD COLUMN IF NOT EXISTS "assignedToId" uuid', schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS "IDX_person_assignedToId" ON %I."person" ("assignedToId")', schema_name);
    BEGIN
      EXECUTE format('ALTER TABLE %I."person" ADD CONSTRAINT "FK_person_assignedToId_workspaceMember" FOREIGN KEY ("assignedToId") REFERENCES %I."workspaceMember"("id") ON DELETE SET NULL', schema_name, schema_name);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    -- Migrate legacy TEXT -> UUID if legacy column exists
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=schema_name AND table_name='person' AND column_name='assignedTo') INTO col_exists;
    IF col_exists THEN
      EXECUTE format('UPDATE %I."person" p SET "assignedToId" = wm."id" FROM %I."workspaceMember" wm WHERE p."assignedTo" = (wm."nameFirstName" || '' '' || wm."nameLastName") AND p."assignedToId" IS NULL', schema_name, schema_name);
      EXECUTE format('UPDATE %I."person" SET "assignedToId" = (SELECT "id" FROM %I."workspaceMember" ORDER BY "createdAt" LIMIT 1) WHERE "assignedToId" IS NULL', schema_name, schema_name);
    END IF;
  END IF;

  -- Ensure Member canReadAll=false
  UPDATE core."role" SET "canReadAllObjectRecords"=false WHERE id=member_role;

  -- ObjectPermissions (insert if missing)
  INSERT INTO core."objectPermission" (id,"roleId","objectMetadataId","canReadObjectRecords","canUpdateObjectRecords","canSoftDeleteObjectRecords","canDestroyObjectRecords","workspaceId","createdAt","updatedAt","universalIdentifier","applicationId")
  SELECT gen_random_uuid(), member_role, person_obj, true,true,false,false, ws_id, NOW(),NOW(), gen_random_uuid(), custom_app WHERE NOT EXISTS (SELECT 1 FROM core."objectPermission" WHERE "roleId"=member_role AND "objectMetadataId"=person_obj);
  INSERT INTO core."objectPermission" (id,"roleId","objectMetadataId","canReadObjectRecords","canUpdateObjectRecords","canSoftDeleteObjectRecords","canDestroyObjectRecords","workspaceId","createdAt","updatedAt","universalIdentifier","applicationId")
  SELECT gen_random_uuid(), member_role, company_obj, true,true,false,false, ws_id, NOW(),NOW(), gen_random_uuid(), custom_app WHERE NOT EXISTS (SELECT 1 FROM core."objectPermission" WHERE "roleId"=member_role AND "objectMetadataId"=company_obj);
  INSERT INTO core."objectPermission" (id,"roleId","objectMetadataId","canReadObjectRecords","canUpdateObjectRecords","canSoftDeleteObjectRecords","canDestroyObjectRecords","workspaceId","createdAt","updatedAt","universalIdentifier","applicationId")
  SELECT gen_random_uuid(), member_role, opp_obj, true,true,false,false, ws_id, NOW(),NOW(), gen_random_uuid(), custom_app WHERE NOT EXISTS (SELECT 1 FROM core."objectPermission" WHERE "roleId"=member_role AND "objectMetadataId"=opp_obj);
  INSERT INTO core."objectPermission" (id,"roleId","objectMetadataId","canReadObjectRecords","canUpdateObjectRecords","canSoftDeleteObjectRecords","canDestroyObjectRecords","workspaceId","createdAt","updatedAt","universalIdentifier","applicationId")
  SELECT gen_random_uuid(), member_role, task_obj, true,true,false,false, ws_id, NOW(),NOW(), gen_random_uuid(), custom_app WHERE NOT EXISTS (SELECT 1 FROM core."objectPermission" WHERE "roleId"=member_role AND "objectMetadataId"=task_obj);

  -- FieldPermission lock assignedTo
  INSERT INTO core."fieldPermission" (id,"roleId","objectMetadataId","fieldMetadataId","canReadFieldValue","canUpdateFieldValue","workspaceId","createdAt","updatedAt","universalIdentifier","applicationId")
  SELECT gen_random_uuid(), member_role, person_obj, assignedTo_field, true,false, ws_id, NOW(),NOW(), gen_random_uuid(), custom_app WHERE NOT EXISTS (SELECT 1 FROM core."fieldPermission" WHERE "roleId"=member_role AND "fieldMetadataId"=assignedTo_field);

  -- Row-level predicates IS currentMember
  IF wm_id_field IS NOT NULL THEN
    INSERT INTO core."rowLevelPermissionPredicate" (id,"fieldMetadataId","objectMetadataId",operand,value,"workspaceMemberFieldMetadataId","workspaceId","roleId","universalIdentifier","applicationId","createdAt","updatedAt")
    SELECT gen_random_uuid(), assignedTo_field, person_obj, 'IS', null, wm_id_field, ws_id, member_role, gen_random_uuid(), custom_app, NOW(),NOW() WHERE NOT EXISTS (SELECT 1 FROM core."rowLevelPermissionPredicate" WHERE "roleId"=member_role AND "fieldMetadataId"=assignedTo_field);
    INSERT INTO core."rowLevelPermissionPredicate" (id,"fieldMetadataId","objectMetadataId",operand,value,"workspaceMemberFieldMetadataId","workspaceId","roleId","universalIdentifier","applicationId","createdAt","updatedAt")
    SELECT gen_random_uuid(), accountOwner_field, company_obj, 'IS', null, wm_id_field, ws_id, member_role, gen_random_uuid(), custom_app, NOW(),NOW() WHERE accountOwner_field IS NOT NULL AND NOT EXISTS (SELECT 1 FROM core."rowLevelPermissionPredicate" WHERE "roleId"=member_role AND "fieldMetadataId"=accountOwner_field);
    INSERT INTO core."rowLevelPermissionPredicate" (id,"fieldMetadataId","objectMetadataId",operand,value,"workspaceMemberFieldMetadataId","workspaceId","roleId","universalIdentifier","applicationId","createdAt","updatedAt")
    SELECT gen_random_uuid(), owner_field, opp_obj, 'IS', null, wm_id_field, ws_id, member_role, gen_random_uuid(), custom_app, NOW(),NOW() WHERE owner_field IS NOT NULL AND NOT EXISTS (SELECT 1 FROM core."rowLevelPermissionPredicate" WHERE "roleId"=member_role AND "fieldMetadataId"=owner_field);
    INSERT INTO core."rowLevelPermissionPredicate" (id,"fieldMetadataId","objectMetadataId",operand,value,"workspaceMemberFieldMetadataId","workspaceId","roleId","universalIdentifier","applicationId","createdAt","updatedAt")
    SELECT gen_random_uuid(), assignee_field, task_obj, 'IS', null, wm_id_field, ws_id, member_role, gen_random_uuid(), custom_app, NOW(),NOW() WHERE assignee_field IS NOT NULL AND NOT EXISTS (SELECT 1 FROM core."rowLevelPermissionPredicate" WHERE "roleId"=member_role AND "fieldMetadataId"=assignee_field);
  END IF;

  RAISE NOTICE 'Generic migration done for workspace %', ws_id;
END $$;
