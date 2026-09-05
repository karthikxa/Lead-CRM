-- Final view order fix: ensures unique positions after 2025-09-02/03 field reorders
-- Opportunity: 0 name,1 emails,2 phones,3 company,4 jobTitle,5 stage,6 owner,7 assignedBy,8 createdAt,9 dueDate,10 closeDate,11 pointOfContact,12 amount,13 createdBy
-- Task: 0 title,1 emails,2 phones,3 company,4 jobTitle,5 status,6 assignee,7 assignedBy,8 createdAt,9 dueAt,10 bodyV2,11 taskTargets,12 createdBy
-- Company: 0 name,1 emails,2 phones,3 accountOwner,4 jobTitle,5 linkedinLink,6 address,7 assignedBy,8 createdAt,9 dueDate,10 domainName,11 createdBy
-- Also renames opportunity labels: amount->Budget, closeDate->Scheduled At, pointOfContact stays, and ensures dueDate fields visible
DO $$
DECLARE ws RECORD; obj uuid; view_id uuid; fid uuid; std_app uuid;
BEGIN
  SELECT id INTO std_app FROM core."application" WHERE name='Standard' LIMIT 1;
  FOR ws IN SELECT id FROM core."workspace" LOOP
    -- Labels: Opportunity amount / closeDate (idempotent)
    UPDATE core."fieldMetadata" SET "label"='Budget'       WHERE "workspaceId"=ws.id AND "name"='amount'    AND "label"='Amount';
    UPDATE core."fieldMetadata" SET "label"='Scheduled At' WHERE "workspaceId"=ws.id AND "name"='closeDate' AND "label"='Close Date';

    -- Person: 0..9 + createdBy at 12 (keep compatible if dueDate exists)
    SELECT id INTO obj FROM core."objectMetadata" WHERE "workspaceId"=ws.id AND "nameSingular"='person' LIMIT 1;
    SELECT id INTO view_id FROM core."view" WHERE "objectMetadataId"=obj AND "name"='All {objectLabelPlural}' LIMIT 1;
    IF view_id IS NOT NULL THEN
      FOR fid IN SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name" IN ('name','emails','phones','company','jobTitle','leadStatus','assignedTo','assignedBy','createdAt','dueDate','createdBy') LOOP NULL; END LOOP;
      UPDATE core."viewField" SET "position"=0  WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='name' LIMIT 1);
      UPDATE core."viewField" SET "position"=1  WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='emails' LIMIT 1);
      UPDATE core."viewField" SET "position"=2  WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='phones' LIMIT 1);
      UPDATE core."viewField" SET "position"=3  WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='company' LIMIT 1);
      UPDATE core."viewField" SET "position"=4  WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='jobTitle' LIMIT 1);
      UPDATE core."viewField" SET "position"=5  WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='leadStatus' LIMIT 1);
      UPDATE core."viewField" SET "position"=6  WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='assignedTo' LIMIT 1);
      UPDATE core."viewField" SET "position"=7  WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='assignedBy' LIMIT 1);
      UPDATE core."viewField" SET "position"=8  WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='createdAt' LIMIT 1);
      UPDATE core."viewField" SET "position"=9  WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='dueDate' LIMIT 1);
    END IF;

    -- Opportunity
    SELECT id INTO obj FROM core."objectMetadata" WHERE "workspaceId"=ws.id AND "nameSingular"='opportunity' LIMIT 1;
    SELECT id INTO view_id FROM core."view" WHERE "objectMetadataId"=obj AND "name"='All {objectLabelPlural}' LIMIT 1;
    IF view_id IS NOT NULL THEN
      UPDATE core."viewField" SET "position"=0  WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='name' LIMIT 1);
      UPDATE core."viewField" SET "position"=1  WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='emails' LIMIT 1);
      UPDATE core."viewField" SET "position"=2  WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='phones' LIMIT 1);
      UPDATE core."viewField" SET "position"=3  WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='company' LIMIT 1);
      UPDATE core."viewField" SET "position"=4  WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='jobTitle' LIMIT 1);
      UPDATE core."viewField" SET "position"=5  WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='stage' LIMIT 1);
      UPDATE core."viewField" SET "position"=6  WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='owner' LIMIT 1);
      UPDATE core."viewField" SET "position"=7  WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='assignedBy' LIMIT 1);
      UPDATE core."viewField" SET "position"=8  WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='createdAt' LIMIT 1);
      UPDATE core."viewField" SET "position"=9  WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='dueDate' LIMIT 1);
      UPDATE core."viewField" SET "position"=10 WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='closeDate' LIMIT 1);
      UPDATE core."viewField" SET "position"=11 WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='pointOfContact' LIMIT 1);
      UPDATE core."viewField" SET "position"=12 WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='amount' LIMIT 1);
      UPDATE core."viewField" SET "position"=13 WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='createdBy' LIMIT 1);
    END IF;

    -- Task
    SELECT id INTO obj FROM core."objectMetadata" WHERE "workspaceId"=ws.id AND "nameSingular"='task' LIMIT 1;
    SELECT id INTO view_id FROM core."view" WHERE "objectMetadataId"=obj AND "name"='All {objectLabelPlural}' LIMIT 1;
    IF view_id IS NOT NULL THEN
      UPDATE core."viewField" SET "position"=0  WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='title' LIMIT 1);
      UPDATE core."viewField" SET "position"=1  WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='emails' LIMIT 1);
      UPDATE core."viewField" SET "position"=2  WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='phones' LIMIT 1);
      UPDATE core."viewField" SET "position"=3  WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='company' LIMIT 1);
      UPDATE core."viewField" SET "position"=4  WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='jobTitle' LIMIT 1);
      UPDATE core."viewField" SET "position"=5  WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='status' LIMIT 1);
      UPDATE core."viewField" SET "position"=6  WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='assignee' LIMIT 1);
      UPDATE core."viewField" SET "position"=7  WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='assignedBy' LIMIT 1);
      UPDATE core."viewField" SET "position"=8  WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='createdAt' LIMIT 1);
      UPDATE core."viewField" SET "position"=9  WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='dueAt' LIMIT 1);
      UPDATE core."viewField" SET "position"=10 WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='bodyV2' LIMIT 1);
      UPDATE core."viewField" SET "position"=11 WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='taskTargets' LIMIT 1);
      UPDATE core."viewField" SET "position"=12 WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='createdBy' LIMIT 1);
    END IF;

    -- Company
    SELECT id INTO obj FROM core."objectMetadata" WHERE "workspaceId"=ws.id AND "nameSingular"='company' LIMIT 1;
    SELECT id INTO view_id FROM core."view" WHERE "objectMetadataId"=obj AND "name"='All {objectLabelPlural}' LIMIT 1;
    IF view_id IS NOT NULL THEN
      UPDATE core."viewField" SET "position"=0  WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='name' LIMIT 1);
      UPDATE core."viewField" SET "position"=1  WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='emails' LIMIT 1);
      UPDATE core."viewField" SET "position"=2  WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='phones' LIMIT 1);
      UPDATE core."viewField" SET "position"=3  WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='accountOwner' LIMIT 1);
      UPDATE core."viewField" SET "position"=4  WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='jobTitle' LIMIT 1);
      UPDATE core."viewField" SET "position"=5  WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='linkedinLink' LIMIT 1);
      UPDATE core."viewField" SET "position"=6  WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='address' LIMIT 1);
      UPDATE core."viewField" SET "position"=7  WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='assignedBy' LIMIT 1);
      UPDATE core."viewField" SET "position"=8  WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='createdAt' LIMIT 1);
      UPDATE core."viewField" SET "position"=9  WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='dueDate' LIMIT 1);
      UPDATE core."viewField" SET "position"=10 WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='domainName' LIMIT 1);
      UPDATE core."viewField" SET "position"=11 WHERE "viewId"=view_id AND "fieldMetadataId"=(SELECT id FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=obj AND "name"='createdBy' LIMIT 1);
    END IF;
  END LOOP;
END $$;
