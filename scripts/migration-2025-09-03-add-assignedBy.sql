-- Add assignedBy (who assigned) to Person, Opportunity, Task, Company + ensure createdBy/assignedTo visible
DO $$
DECLARE ws RECORD; person_obj uuid; company_obj uuid; opp_obj uuid; task_obj uuid; wm_obj uuid; custom_app uuid; ws_schema text; fid uuid;
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

    -- Person assignedBy
    SELECT id INTO fid FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=person_obj AND "name"='assignedBy' LIMIT 1;
    IF fid IS NULL THEN
      fid := gen_random_uuid();
      INSERT INTO core."fieldMetadata" (id,"objectMetadataId",type,name,label,"isActive","isSystem","isUIReadOnly","isNullable","workspaceId","universalIdentifier","applicationId",settings,"relationTargetObjectMetadataId")
      VALUES (fid, person_obj, 'RELATION','assignedBy','Assigned By',true,false,false,true,ws.id,gen_random_uuid(),custom_app,'{"onDelete":"SET_NULL","relationType":"MANY_TO_ONE","joinColumnName":"assignedById"}',wm_obj);
      EXECUTE format('ALTER TABLE %I."person" ADD COLUMN IF NOT EXISTS "assignedById" uuid', ws_schema);
      EXECUTE format('CREATE INDEX IF NOT EXISTS "IDX_person_assignedById" ON %I."person"("assignedById")', ws_schema);
      BEGIN EXECUTE format('ALTER TABLE %I."person" ADD CONSTRAINT "FK_person_assignedById" FOREIGN KEY ("assignedById") REFERENCES %I."workspaceMember"(id) ON DELETE SET NULL', ws_schema, ws_schema); EXCEPTION WHEN duplicate_object THEN NULL; END;
    END IF;
    -- Opportunity assignedBy
    SELECT id INTO fid FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=opp_obj AND "name"='assignedBy' LIMIT 1;
    IF fid IS NULL THEN
      fid := gen_random_uuid();
      INSERT INTO core."fieldMetadata" (id,"objectMetadataId",type,name,label,"isActive","isSystem","isUIReadOnly","isNullable","workspaceId","universalIdentifier","applicationId",settings,"relationTargetObjectMetadataId")
      VALUES (fid, opp_obj, 'RELATION','assignedBy','Assigned By',true,false,false,true,ws.id,gen_random_uuid(),custom_app,'{"onDelete":"SET_NULL","relationType":"MANY_TO_ONE","joinColumnName":"assignedById"}',wm_obj);
      EXECUTE format('ALTER TABLE %I."opportunity" ADD COLUMN IF NOT EXISTS "assignedById" uuid', ws_schema);
      EXECUTE format('CREATE INDEX IF NOT EXISTS "IDX_opportunity_assignedById" ON %I."opportunity"("assignedById")', ws_schema);
      BEGIN EXECUTE format('ALTER TABLE %I."opportunity" ADD CONSTRAINT "FK_opportunity_assignedById" FOREIGN KEY ("assignedById") REFERENCES %I."workspaceMember"(id) ON DELETE SET NULL', ws_schema, ws_schema); EXCEPTION WHEN duplicate_object THEN NULL; END;
    END IF;
    -- Task assignedBy
    SELECT id INTO fid FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=task_obj AND "name"='assignedBy' LIMIT 1;
    IF fid IS NULL THEN
      fid := gen_random_uuid();
      INSERT INTO core."fieldMetadata" (id,"objectMetadataId",type,name,label,"isActive","isSystem","isUIReadOnly","isNullable","workspaceId","universalIdentifier","applicationId",settings,"relationTargetObjectMetadataId")
      VALUES (fid, task_obj, 'RELATION','assignedBy','Assigned By',true,false,false,true,ws.id,gen_random_uuid(),custom_app,'{"onDelete":"SET_NULL","relationType":"MANY_TO_ONE","joinColumnName":"assignedById"}',wm_obj);
      EXECUTE format('ALTER TABLE %I."task" ADD COLUMN IF NOT EXISTS "assignedById" uuid', ws_schema);
      EXECUTE format('CREATE INDEX IF NOT EXISTS "IDX_task_assignedById" ON %I."task"("assignedById")', ws_schema);
      BEGIN EXECUTE format('ALTER TABLE %I."task" ADD CONSTRAINT "FK_task_assignedById" FOREIGN KEY ("assignedById") REFERENCES %I."workspaceMember"(id) ON DELETE SET NULL', ws_schema, ws_schema); EXCEPTION WHEN duplicate_object THEN NULL; END;
    END IF;
    -- Company assignedBy
    SELECT id INTO fid FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=company_obj AND "name"='assignedBy' LIMIT 1;
    IF fid IS NULL THEN
      fid := gen_random_uuid();
      INSERT INTO core."fieldMetadata" (id,"objectMetadataId",type,name,label,"isActive","isSystem","isUIReadOnly","isNullable","workspaceId","universalIdentifier","applicationId",settings,"relationTargetObjectMetadataId")
      VALUES (fid, company_obj, 'RELATION','assignedBy','Assigned By',true,false,false,true,ws.id,gen_random_uuid(),custom_app,'{"onDelete":"SET_NULL","relationType":"MANY_TO_ONE","joinColumnName":"assignedById"}',wm_obj);
      EXECUTE format('ALTER TABLE %I."company" ADD COLUMN IF NOT EXISTS "assignedById" uuid', ws_schema);
      EXECUTE format('CREATE INDEX IF NOT EXISTS "IDX_company_assignedById" ON %I."company"("assignedById")', ws_schema);
      BEGIN EXECUTE format('ALTER TABLE %I."company" ADD CONSTRAINT "FK_company_assignedById" FOREIGN KEY ("assignedById") REFERENCES %I."workspaceMember"(id) ON DELETE SET NULL', ws_schema, ws_schema); EXCEPTION WHEN duplicate_object THEN NULL; END;
    END IF;
  END LOOP;
END $$;

-- Add viewFields for assignedBy and ensure createdBy is visible at correct position (after assignedTo)
DO $$
DECLARE ws RECORD; person_obj uuid; company_obj uuid; opp_obj uuid; task_obj uuid; view_id uuid; fid uuid; std_app uuid;
BEGIN
  SELECT id INTO std_app FROM core."application" WHERE name='Standard' LIMIT 1;
  FOR ws IN SELECT id FROM core."workspace" LOOP
    SELECT id INTO person_obj FROM core."objectMetadata" WHERE "workspaceId"=ws.id AND "nameSingular"='person' LIMIT 1;
    SELECT id INTO company_obj FROM core."objectMetadata" WHERE "workspaceId"=ws.id AND "nameSingular"='company' LIMIT 1;
    SELECT id INTO opp_obj FROM core."objectMetadata" WHERE "workspaceId"=ws.id AND "nameSingular"='opportunity' LIMIT 1;
    SELECT id INTO task_obj FROM core."objectMetadata" WHERE "workspaceId"=ws.id AND "nameSingular"='task' LIMIT 1;

    -- Person: ensure assignedBy at 7, createdBy at 10, updatedBy at 11
    SELECT id INTO view_id FROM core."view" WHERE "objectMetadataId"=person_obj AND "name"='All {objectLabelPlural}' LIMIT 1;
    SELECT id INTO fid FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=person_obj AND "name"='assignedBy' LIMIT 1;
    IF fid IS NOT NULL AND view_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM core."viewField" WHERE "viewId"=view_id AND "fieldMetadataId"=fid) THEN
      INSERT INTO core."viewField" (id,"viewId","fieldMetadataId","position","isVisible","size","workspaceId","universalIdentifier","applicationId") VALUES (gen_random_uuid(), view_id, fid, 7, true, 150, ws.id, gen_random_uuid(), std_app);
    ELSIF fid IS NOT NULL THEN UPDATE core."viewField" SET "position"=7 WHERE "viewId"=view_id AND "fieldMetadataId"=fid;
    END IF;
    SELECT id INTO fid FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=person_obj AND "name"='createdBy' LIMIT 1;
    IF fid IS NOT NULL THEN UPDATE core."viewField" SET "position"=11 WHERE "viewId"=view_id AND "fieldMetadataId"=fid; END IF;
    SELECT id INTO fid FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=person_obj AND "name"='updatedBy' LIMIT 1;
    IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM core."viewField" WHERE "viewId"=view_id AND "fieldMetadataId"=fid) THEN
      INSERT INTO core."viewField" (id,"viewId","fieldMetadataId","position","isVisible","size","workspaceId","universalIdentifier","applicationId") VALUES (gen_random_uuid(), view_id, fid, 12, true, 150, ws.id, gen_random_uuid(), std_app);
    END IF;

    -- Opportunity: assignedBy at 7, createdBy at 12
    SELECT id INTO view_id FROM core."view" WHERE "objectMetadataId"=opp_obj AND "name"='All {objectLabelPlural}' LIMIT 1;
    SELECT id INTO fid FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=opp_obj AND "name"='assignedBy' LIMIT 1;
    IF fid IS NOT NULL AND view_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM core."viewField" WHERE "viewId"=view_id AND "fieldMetadataId"=fid) THEN
      INSERT INTO core."viewField" (id,"viewId","fieldMetadataId","position","isVisible","size","workspaceId","universalIdentifier","applicationId") VALUES (gen_random_uuid(), view_id, fid, 7, true, 150, ws.id, gen_random_uuid(), std_app);
    END IF;
    SELECT id INTO fid FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=opp_obj AND "name"='createdBy' LIMIT 1;
    IF fid IS NOT NULL THEN UPDATE core."viewField" SET "position"=13 WHERE "viewId"=view_id AND "fieldMetadataId"=fid; END IF;

    -- Task: assignedBy at 7, createdBy at 11
    SELECT id INTO view_id FROM core."view" WHERE "objectMetadataId"=task_obj AND "name"='All {objectLabelPlural}' LIMIT 1;
    SELECT id INTO fid FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=task_obj AND "name"='assignedBy' LIMIT 1;
    IF fid IS NOT NULL AND view_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM core."viewField" WHERE "viewId"=view_id AND "fieldMetadataId"=fid) THEN
      INSERT INTO core."viewField" (id,"viewId","fieldMetadataId","position","isVisible","size","workspaceId","universalIdentifier","applicationId") VALUES (gen_random_uuid(), view_id, fid, 7, true, 150, ws.id, gen_random_uuid(), std_app);
    END IF;

    -- Company: assignedBy at 7, createdBy at 11
    SELECT id INTO view_id FROM core."view" WHERE "objectMetadataId"=company_obj AND "name"='All {objectLabelPlural}' LIMIT 1;
    SELECT id INTO fid FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=company_obj AND "name"='assignedBy' LIMIT 1;
    IF fid IS NOT NULL AND view_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM core."viewField" WHERE "viewId"=view_id AND "fieldMetadataId"=fid) THEN
      INSERT INTO core."viewField" (id,"viewId","fieldMetadataId","position","isVisible","size","workspaceId","universalIdentifier","applicationId") VALUES (gen_random_uuid(), view_id, fid, 7, true, 150, ws.id, gen_random_uuid(), std_app);
    END IF;
  END LOOP;
END $$;
