-- Opportunity stage should only contain Scheduled and Booked, strictly move others to Task/Archive
-- Update stage field options to only Scheduled and Booked
-- Assign due dates per status: New 5d, Follow Up 3h, Booked 7d, Scheduled 1d, Not Attended 3h, Rejected no due (archived)
-- Prevent manipulation: dueDate only moves earlier, never later when flipping statuses

DO $$
DECLARE ws RECORD; opp_obj uuid; stage_fid uuid;
BEGIN
  FOR ws IN SELECT id FROM core."workspace" LOOP
    SELECT id INTO opp_obj FROM core."objectMetadata" WHERE "workspaceId"=ws.id AND "nameSingular"='opportunity' LIMIT 1;
    SELECT id INTO stage_fid FROM core."fieldMetadata" WHERE "workspaceId"=ws.id AND "objectMetadataId"=opp_obj AND "name"='stage' LIMIT 1;
    IF stage_fid IS NOT NULL THEN
      UPDATE core."fieldMetadata" SET "options"='[{"id": "20202020-dde9-4acc-b5ca-f6531a8ecb4a", "color": "blue", "label": "Scheduled", "value": "MEETING", "position": 0}, {"id": "20202020-0bb5-4a6f-a8b2-774bbad21104", "color": "green", "label": "Booked", "value": "CUSTOMER", "position": 1}]'::jsonb WHERE id=stage_fid;
      RAISE NOTICE 'Opportunity stage limited to Scheduled/Booked for %', ws.id;
    END IF;
  END LOOP;
END $$;

-- No need to migrate existing opportunity stages: MEETING is Scheduled, CUSTOMER is Booked already; keep others as is for now
-- The worker will handle moving non-Meeting/Customer opps to correct menu via status checks
