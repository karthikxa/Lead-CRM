DO $$
DECLARE ws RECORD; opp_obj uuid; view_id uuid; fid uuid; std_app uuid;
BEGIN
  SELECT id INTO std_app FROM core."application" WHERE name='Standard' LIMIT 1;
  FOR ws IN SELECT id FROM core."workspace" LOOP
    SELECT id INTO opp_obj FROM core."objectMetadata" WHERE "workspaceId"=ws.id AND "nameSingular"='opportunity' LIMIT 1;
    SELECT id INTO view_id FROM core."view" WHERE "objectMetadataId"=opp_obj AND "name"='All {objectLabelPlural}' LIMIT 1;
    IF view_id IS NULL THEN CONTINUE; END IF;
    -- Ensure all required viewFields exist with correct positions
    -- name 0
    SELECT id INTO fid FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=opp_obj AND "name"='name' LIMIT 1;
    IF fid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM core."viewField" WHERE "viewId"=view_id AND "fieldMetadataId"=fid) THEN
        INSERT INTO core."viewField" (id,"viewId","fieldMetadataId","position","isVisible","size","workspaceId","universalIdentifier","applicationId") VALUES (gen_random_uuid(), view_id, fid, 0, true, 150, ws.id, gen_random_uuid(), std_app);
      ELSE UPDATE core."viewField" SET "position"=0 WHERE "viewId"=view_id AND "fieldMetadataId"=fid;
      END IF;
    END IF;
    -- emails 1
    SELECT id INTO fid FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=opp_obj AND "name"='emails' LIMIT 1;
    IF fid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM core."viewField" WHERE "viewId"=view_id AND "fieldMetadataId"=fid) THEN
        INSERT INTO core."viewField" (id,"viewId","fieldMetadataId","position","isVisible","size","workspaceId","universalIdentifier","applicationId") VALUES (gen_random_uuid(), view_id, fid, 1, true, 150, ws.id, gen_random_uuid(), std_app);
      ELSE UPDATE core."viewField" SET "position"=1 WHERE "viewId"=view_id AND "fieldMetadataId"=fid;
      END IF;
    END IF;
    -- phones 2
    SELECT id INTO fid FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=opp_obj AND "name"='phones' LIMIT 1;
    IF fid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM core."viewField" WHERE "viewId"=view_id AND "fieldMetadataId"=fid) THEN
        INSERT INTO core."viewField" (id,"viewId","fieldMetadataId","position","isVisible","size","workspaceId","universalIdentifier","applicationId") VALUES (gen_random_uuid(), view_id, fid, 2, true, 150, ws.id, gen_random_uuid(), std_app);
      ELSE UPDATE core."viewField" SET "position"=2 WHERE "viewId"=view_id AND "fieldMetadataId"=fid;
      END IF;
    END IF;
    -- company 3
    SELECT id INTO fid FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=opp_obj AND "name"='company' LIMIT 1;
    IF fid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM core."viewField" WHERE "viewId"=view_id AND "fieldMetadataId"=fid) THEN
        INSERT INTO core."viewField" (id,"viewId","fieldMetadataId","position","isVisible","size","workspaceId","universalIdentifier","applicationId") VALUES (gen_random_uuid(), view_id, fid, 3, true, 150, ws.id, gen_random_uuid(), std_app);
      ELSE UPDATE core."viewField" SET "position"=3 WHERE "viewId"=view_id AND "fieldMetadataId"=fid;
      END IF;
    END IF;
    -- jobTitle 4
    SELECT id INTO fid FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=opp_obj AND "name"='jobTitle' LIMIT 1;
    IF fid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM core."viewField" WHERE "viewId"=view_id AND "fieldMetadataId"=fid) THEN
        INSERT INTO core."viewField" (id,"viewId","fieldMetadataId","position","isVisible","size","workspaceId","universalIdentifier","applicationId") VALUES (gen_random_uuid(), view_id, fid, 4, true, 150, ws.id, gen_random_uuid(), std_app);
      ELSE UPDATE core."viewField" SET "position"=4 WHERE "viewId"=view_id AND "fieldMetadataId"=fid;
      END IF;
    END IF;
    -- stage/status 5
    SELECT id INTO fid FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=opp_obj AND "name"='stage' LIMIT 1;
    IF fid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM core."viewField" WHERE "viewId"=view_id AND "fieldMetadataId"=fid) THEN
        INSERT INTO core."viewField" (id,"viewId","fieldMetadataId","position","isVisible","size","workspaceId","universalIdentifier","applicationId") VALUES (gen_random_uuid(), view_id, fid, 5, true, 150, ws.id, gen_random_uuid(), std_app);
      ELSE UPDATE core."viewField" SET "position"=5 WHERE "viewId"=view_id AND "fieldMetadataId"=fid;
      END IF;
    END IF;
    -- owner 6
    SELECT id INTO fid FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=opp_obj AND "name"='owner' LIMIT 1;
    IF fid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM core."viewField" WHERE "viewId"=view_id AND "fieldMetadataId"=fid) THEN
        INSERT INTO core."viewField" (id,"viewId","fieldMetadataId","position","isVisible","size","workspaceId","universalIdentifier","applicationId") VALUES (gen_random_uuid(), view_id, fid, 6, true, 150, ws.id, gen_random_uuid(), std_app);
      ELSE UPDATE core."viewField" SET "position"=6 WHERE "viewId"=view_id AND "fieldMetadataId"=fid;
      END IF;
    END IF;
    -- createdAt 7
    SELECT id INTO fid FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=opp_obj AND "name"='createdAt' LIMIT 1;
    IF fid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM core."viewField" WHERE "viewId"=view_id AND "fieldMetadataId"=fid) THEN
        INSERT INTO core."viewField" (id,"viewId","fieldMetadataId","position","isVisible","size","workspaceId","universalIdentifier","applicationId") VALUES (gen_random_uuid(), view_id, fid, 7, true, 150, ws.id, gen_random_uuid(), std_app);
      ELSE UPDATE core."viewField" SET "position"=7 WHERE "viewId"=view_id AND "fieldMetadataId"=fid;
      END IF;
    END IF;
    -- dueDate 8
    SELECT id INTO fid FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=opp_obj AND "name"='dueDate' LIMIT 1;
    IF fid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM core."viewField" WHERE "viewId"=view_id AND "fieldMetadataId"=fid) THEN
        INSERT INTO core."viewField" (id,"viewId","fieldMetadataId","position","isVisible","size","workspaceId","universalIdentifier","applicationId") VALUES (gen_random_uuid(), view_id, fid, 8, true, 150, ws.id, gen_random_uuid(), std_app);
      ELSE UPDATE core."viewField" SET "position"=8 WHERE "viewId"=view_id AND "fieldMetadataId"=fid;
      END IF;
    END IF;
    -- closeDate 9
    SELECT id INTO fid FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=opp_obj AND "name"='closeDate' LIMIT 1;
    IF fid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM core."viewField" WHERE "viewId"=view_id AND "fieldMetadataId"=fid) THEN
        INSERT INTO core."viewField" (id,"viewId","fieldMetadataId","position","isVisible","size","workspaceId","universalIdentifier","applicationId") VALUES (gen_random_uuid(), view_id, fid, 9, true, 150, ws.id, gen_random_uuid(), std_app);
      ELSE UPDATE core."viewField" SET "position"=9 WHERE "viewId"=view_id AND "fieldMetadataId"=fid;
      END IF;
    END IF;
    -- pointOfContact 10
    SELECT id INTO fid FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=opp_obj AND "name"='pointOfContact' LIMIT 1;
    IF fid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM core."viewField" WHERE "viewId"=view_id AND "fieldMetadataId"=fid) THEN
        INSERT INTO core."viewField" (id,"viewId","fieldMetadataId","position","isVisible","size","workspaceId","universalIdentifier","applicationId") VALUES (gen_random_uuid(), view_id, fid, 10, true, 150, ws.id, gen_random_uuid(), std_app);
      ELSE UPDATE core."viewField" SET "position"=10 WHERE "viewId"=view_id AND "fieldMetadataId"=fid;
      END IF;
    END IF;
    -- amount 11
    SELECT id INTO fid FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=opp_obj AND "name"='amount' LIMIT 1;
    IF fid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM core."viewField" WHERE "viewId"=view_id AND "fieldMetadataId"=fid) THEN
        INSERT INTO core."viewField" (id,"viewId","fieldMetadataId","position","isVisible","size","workspaceId","universalIdentifier","applicationId") VALUES (gen_random_uuid(), view_id, fid, 11, true, 150, ws.id, gen_random_uuid(), std_app);
      ELSE UPDATE core."viewField" SET "position"=11 WHERE "viewId"=view_id AND "fieldMetadataId"=fid;
      END IF;
    END IF;
  END LOOP;
END $$;
