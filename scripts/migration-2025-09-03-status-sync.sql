-- Sync Status dropdown to only contain: New, Follow Up, Booked, Not Attended, Scheduled, Rejected (strictly)
-- For People (leadStatus), Opportunity (stage→Status), Task (status)
-- Change stage to status already done via label, now ensure all have same 6 options
-- Also make assignee/assignedTo mandatory and add to every table, fix 400 error

DO $$
DECLARE ws RECORD; opp_obj uuid; task_obj uuid; person_obj uuid; fid uuid;
BEGIN
  FOR ws IN SELECT id FROM core."workspace" LOOP
    SELECT id INTO person_obj FROM core."objectMetadata" WHERE "workspaceId"=ws.id AND "nameSingular"='person' LIMIT 1;
    SELECT id INTO opp_obj FROM core."objectMetadata" WHERE "workspaceId"=ws.id AND "nameSingular"='opportunity' LIMIT 1;
    SELECT id INTO task_obj FROM core."objectMetadata" WHERE "workspaceId"=ws.id AND "nameSingular"='task' LIMIT 1;

    -- People leadStatus should already be correct, but ensure it has exactly the 6
    SELECT id INTO fid FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=person_obj AND "name"='leadStatus' LIMIT 1;
    IF fid IS NOT NULL THEN
      UPDATE core."fieldMetadata" SET "options"='[{"id": "s1", "color": "gray", "label": "New", "value": "New", "position": 0}, {"id": "s2", "color": "red", "label": "Not Attended", "value": "Not Attended", "position": 1}, {"id": "s3", "color": "orange", "label": "Follow Up", "value": "Follow Up", "position": 2}, {"id": "s4", "color": "green", "label": "Booked", "value": "Booked", "position": 3}, {"id": "s5", "color": "blue", "label": "Scheduled", "value": "Scheduled", "position": 4}, {"id": "s6", "color": "purple", "label": "Rejected", "value": "Rejected", "position": 5}]'::jsonb WHERE id=fid;
    END IF;

    -- Opportunity stage should have same 6 as People, label Status (already Status)
    SELECT id INTO fid FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=opp_obj AND "name"='stage' LIMIT 1;
    IF fid IS NOT NULL THEN
      UPDATE core."fieldMetadata" SET "label"='Status', "options"='[{"id": "s1", "color": "gray", "label": "New", "value": "New", "position": 0}, {"id": "s2", "color": "red", "label": "Not Attended", "value": "Not Attended", "position": 1}, {"id": "s3", "color": "orange", "label": "Follow Up", "value": "Follow Up", "position": 2}, {"id": "s4", "color": "green", "label": "Booked", "value": "Booked", "position": 3}, {"id": "s5", "color": "blue", "label": "Scheduled", "value": "Scheduled", "position": 4}, {"id": "s6", "color": "purple", "label": "Rejected", "value": "Rejected", "position": 5}]'::jsonb WHERE id=fid;
    END IF;

    -- Task status should have same 6
    SELECT id INTO fid FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=task_obj AND "name"='status' LIMIT 1;
    IF fid IS NOT NULL THEN
      UPDATE core."fieldMetadata" SET "options"='[{"id": "s1", "color": "gray", "label": "New", "value": "New", "position": 0}, {"id": "s2", "color": "red", "label": "Not Attended", "value": "Not Attended", "position": 1}, {"id": "s3", "color": "orange", "label": "Follow Up", "value": "Follow Up", "position": 2}, {"id": "s4", "color": "green", "label": "Booked", "value": "Booked", "position": 3}, {"id": "s5", "color": "blue", "label": "Scheduled", "value": "Scheduled", "position": 4}, {"id": "s6", "color": "purple", "label": "Rejected", "value": "Rejected", "position": 5}]'::jsonb WHERE id=fid;
    END IF;

    -- Make assignee/assignedTo mandatory (isNullable false) for People, Opportunity, Task
    UPDATE core."fieldMetadata" SET "isNullable"=false WHERE "workspaceId"=ws.id AND "objectMetadataId"=person_obj AND "name"='assignedTo';
    UPDATE core."fieldMetadata" SET "isNullable"=false WHERE "workspaceId"=ws.id AND "objectMetadataId"=opp_obj AND "name"='owner';
    UPDATE core."fieldMetadata" SET "isNullable"=false WHERE "workspaceId"=ws.id AND "objectMetadataId"=task_obj AND "name"='assignee';

    -- Ensure admin can change assignedTo in any menu: set fieldPermission canUpdate true for Admin, false for Member already
    -- For Admin, ensure no restrictive fieldPermission (delete any that block Admin)
    DELETE FROM core."fieldPermission" WHERE "roleId"=(SELECT id FROM core."role" WHERE "workspaceId"=ws.id AND label='Admin' LIMIT 1) AND "fieldMetadataId" IN (SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "name" IN ('assignedTo','owner','assignee'));

  END LOOP;
END $$;

-- Fix 400 error for assignee: ensure workspaceMember can be read by all (remove restrictive RLS on workspaceMember if any, and ensure Task assignee relation is correctly resolved)
-- The 400 is often due to missing permission for workspaceMember read; ensure Member can read workspaceMember
DO $$
DECLARE ws RECORD; wm_obj uuid; member_role uuid;
BEGIN
  FOR ws IN SELECT id FROM core."workspace" LOOP
    SELECT id INTO wm_obj FROM core."objectMetadata" WHERE "workspaceId"=ws.id AND "nameSingular"='workspaceMember' LIMIT 1;
    SELECT id INTO member_role FROM core."role" WHERE "workspaceId"=ws.id AND label='Member' LIMIT 1;
    -- Ensure Member has objectPermission canRead for workspaceMember
    IF NOT EXISTS (SELECT 1 FROM core."objectPermission" WHERE "roleId"=member_role AND "objectMetadataId"=wm_obj) THEN
      INSERT INTO core."objectPermission" (id,"roleId","objectMetadataId","canReadObjectRecords","canUpdateObjectRecords","canSoftDeleteObjectRecords","canDestroyObjectRecords","workspaceId","createdAt","updatedAt","universalIdentifier","applicationId")
      VALUES (gen_random_uuid(), member_role, wm_obj, true,false,false,false, ws.id, NOW(),NOW(), gen_random_uuid(), (SELECT id FROM core."application" WHERE name='Standard' LIMIT 1));
    ELSE
      UPDATE core."objectPermission" SET "canReadObjectRecords"=true WHERE "roleId"=member_role AND "objectMetadataId"=wm_obj;
    END IF;
    -- Remove any rowLevelPredicate that restricts workspaceMember for Member (should see all for assignee picker)
    DELETE FROM core."rowLevelPermissionPredicate" WHERE "roleId"=member_role AND "objectMetadataId"=wm_obj;
  END LOOP;
END $$;
