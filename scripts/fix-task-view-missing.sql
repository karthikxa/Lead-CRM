DO $$
DECLARE ws RECORD; task_obj uuid; view_id uuid; fid uuid; std_app uuid;
BEGIN
  SELECT id INTO std_app FROM core."application" WHERE name='Standard' LIMIT 1;
  FOR ws IN SELECT id FROM core."workspace" LOOP
    SELECT id INTO task_obj FROM core."objectMetadata" WHERE "workspaceId"=ws.id AND "nameSingular"='task' LIMIT 1;
    SELECT id INTO view_id FROM core."view" WHERE "objectMetadataId"=task_obj AND "name"='All {objectLabelPlural}' LIMIT 1;
    IF view_id IS NULL THEN CONTINUE; END IF;
    -- emails
    SELECT id INTO fid FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=task_obj AND "name"='emails' LIMIT 1;
    IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM core."viewField" WHERE "viewId"=view_id AND "fieldMetadataId"=fid) THEN
      INSERT INTO core."viewField" (id,"viewId","fieldMetadataId","position","isVisible","size","workspaceId","universalIdentifier","applicationId") VALUES (gen_random_uuid(), view_id, fid, 1, true, 150, ws.id, gen_random_uuid(), std_app);
    ELSE UPDATE core."viewField" SET "position"=1 WHERE "viewId"=view_id AND "fieldMetadataId"=fid; END IF;
    -- phones
    SELECT id INTO fid FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=task_obj AND "name"='phones' LIMIT 1;
    IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM core."viewField" WHERE "viewId"=view_id AND "fieldMetadataId"=fid) THEN
      INSERT INTO core."viewField" (id,"viewId","fieldMetadataId","position","isVisible","size","workspaceId","universalIdentifier","applicationId") VALUES (gen_random_uuid(), view_id, fid, 2, true, 150, ws.id, gen_random_uuid(), std_app);
    ELSE UPDATE core."viewField" SET "position"=2 WHERE "viewId"=view_id AND "fieldMetadataId"=fid; END IF;
    -- company
    SELECT id INTO fid FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=task_obj AND "name"='company' LIMIT 1;
    IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM core."viewField" WHERE "viewId"=view_id AND "fieldMetadataId"=fid) THEN
      INSERT INTO core."viewField" (id,"viewId","fieldMetadataId","position","isVisible","size","workspaceId","universalIdentifier","applicationId") VALUES (gen_random_uuid(), view_id, fid, 3, true, 150, ws.id, gen_random_uuid(), std_app);
    ELSE UPDATE core."viewField" SET "position"=3 WHERE "viewId"=view_id AND "fieldMetadataId"=fid; END IF;
    -- jobTitle
    SELECT id INTO fid FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=task_obj AND "name"='jobTitle' LIMIT 1;
    IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM core."viewField" WHERE "viewId"=view_id AND "fieldMetadataId"=fid) THEN
      INSERT INTO core."viewField" (id,"viewId","fieldMetadataId","position","isVisible","size","workspaceId","universalIdentifier","applicationId") VALUES (gen_random_uuid(), view_id, fid, 4, true, 150, ws.id, gen_random_uuid(), std_app);
    ELSE UPDATE core."viewField" SET "position"=4 WHERE "viewId"=view_id AND "fieldMetadataId"=fid; END IF;
    -- Ensure status at 5, assignee at 6, createdAt at 7, dueAt at 8
    SELECT id INTO fid FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=task_obj AND "name"='status' LIMIT 1;
    UPDATE core."viewField" SET "position"=5 WHERE "viewId"=view_id AND "fieldMetadataId"=fid;
    SELECT id INTO fid FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=task_obj AND "name"='assignee' LIMIT 1;
    UPDATE core."viewField" SET "position"=6 WHERE "viewId"=view_id AND "fieldMetadataId"=fid;
    SELECT id INTO fid FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=task_obj AND "name"='createdAt' LIMIT 1;
    UPDATE core."viewField" SET "position"=7 WHERE "viewId"=view_id AND "fieldMetadataId"=fid;
    SELECT id INTO fid FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=task_obj AND "name"='dueAt' LIMIT 1;
    UPDATE core."viewField" SET "position"=8 WHERE "viewId"=view_id AND "fieldMetadataId"=fid;
  END LOOP;
END $$;
