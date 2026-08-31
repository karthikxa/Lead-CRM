-- Migration: Person.assignedTo TEXT -> RELATION + Row-Level RLS + Field Locks
-- Workspace: bbd12261-90ea-42aa-8893-f15cf1352cea
-- Idempotent: safe to re-run on Daytona or local
-- Run: docker exec -i zed-db-1 psql -U postgres -d default < scripts/migration-2025-08-31-assignedTo-relation-and-rls.sql && docker restart zed-server-1 zed-worker-1

-- 1) WorkspaceMember back-reference for Person.assignedTo (ONE_TO_MANY)
INSERT INTO core."fieldMetadata" (
  "id", "objectMetadataId", "type", "name", "label", "description", "icon",
  "isActive", "isSystem", "isUIReadOnly", "isNullable", "workspaceId",
  "universalIdentifier", "applicationId", "settings",
  "relationTargetObjectMetadataId", "relationTargetFieldMetadataId",
  "createdAt", "updatedAt"
) VALUES (
  'b6531763-83ea-4d7f-9f8d-6be7eaa3aa07',
  'bb9cb6e5-a96b-4e71-bfc8-b7a71d7131a2',
  'RELATION',
  'assignedPeople',
  'Assigned People',
  'People assigned to this member',
  'IconUser',
  true, false, false, true,
  'bbd12261-90ea-42aa-8893-f15cf1352cea',
  'ae8b3929-6dcb-4bc3-bb7f-9370caa4382c',
  '43c6392e-0120-43f3-870b-c49392ebd19b',
  '{"relationType": "ONE_TO_MANY"}',
  '1e31ee5b-01c5-46e0-88f5-e8de11861be1',
  '8b19c2f3-036a-43b0-9d73-52d243c48218',
  NOW(), NOW()
) ON CONFLICT ("id") DO NOTHING;

-- 2) Convert Person.assignedTo TEXT -> RELATION (MANY_TO_ONE to workspaceMember)
UPDATE core."fieldMetadata" SET
  "type" = 'RELATION',
  "settings" = '{"onDelete": "SET_NULL", "relationType": "MANY_TO_ONE", "joinColumnName": "assignedToId"}',
  "relationTargetObjectMetadataId" = 'bb9cb6e5-a96b-4e71-bfc8-b7a71d7131a2',
  "relationTargetFieldMetadataId" = 'b6531763-83ea-4d7f-9f8d-6be7eaa3aa07',
  "updatedAt" = NOW()
WHERE "id" = '8b19c2f3-036a-43b0-9d73-52d243c48218' AND "type" = 'TEXT';

-- 3) Workspace table: add assignedToId column + index + FK
ALTER TABLE workspace_b4ai6k0t73ulj4l40gxarowdm."person" ADD COLUMN IF NOT EXISTS "assignedToId" uuid;
CREATE INDEX IF NOT EXISTS "IDX_person_assignedToId" ON workspace_b4ai6k0t73ulj4l40gxarowdm."person" ("assignedToId");
DO $$ BEGIN
  ALTER TABLE workspace_b4ai6k0t73ulj4l40gxarowdm."person"
    ADD CONSTRAINT "FK_person_assignedToId_workspaceMember"
    FOREIGN KEY ("assignedToId") REFERENCES workspace_b4ai6k0t73ulj4l40gxarowdm."workspaceMember"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4) Migrate data: TEXT name -> UUID (Karthik (Admin) etc via name match + fallback to first member)
UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm."person" p
SET "assignedToId" = wm."id"
FROM workspace_b4ai6k0t73ulj4l40gxarowdm."workspaceMember" wm
WHERE p."assignedTo" = (wm."nameFirstName" || ' ' || wm."nameLastName")
  AND p."assignedToId" IS NULL;

-- Remaining "Zed Team Member" placeholder -> assign to secondary tester if exists, else first member
UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm."person"
SET "assignedToId" = (SELECT "id" FROM workspace_b4ai6k0t73ulj4l40gxarowdm."workspaceMember" ORDER BY "createdAt" LIMIT 1 OFFSET 1)
WHERE "assignedTo" = 'Zed Team Member' AND "assignedToId" IS NULL;

-- Fallback: any still-null -> assign to first member (Admin)
UPDATE workspace_b4ai6k0t73ulj4l40gxarowdm."person"
SET "assignedToId" = (SELECT "id" FROM workspace_b4ai6k0t73ulj4l40gxarowdm."workspaceMember" ORDER BY "createdAt" LIMIT 1)
WHERE "assignedToId" IS NULL;

-- 5) Member canReadAll = false (ensures RLS enforced)
UPDATE core."role" SET "canReadAllObjectRecords" = false WHERE "id" = '3dfa07e2-7784-460d-af1b-4d9ebea72d4d' AND "canReadAllObjectRecords" = true;

-- 6) Object permissions for Member (read) on 5 objects
INSERT INTO core."objectPermission" ("id","roleId","objectMetadataId","canReadObjectRecords","canUpdateObjectRecords","canSoftDeleteObjectRecords","canDestroyObjectRecords","workspaceId","createdAt","updatedAt","universalIdentifier","applicationId")
VALUES
  (gen_random_uuid(),'3dfa07e2-7784-460d-af1b-4d9ebea72d4d','1e31ee5b-01c5-46e0-88f5-e8de11861be1',true,true,false,false,'bbd12261-90ea-42aa-8893-f15cf1352cea',NOW(),NOW(),gen_random_uuid(),'43c6392e-0120-43f3-870b-c49392ebd19b'),
  (gen_random_uuid(),'3dfa07e2-7784-460d-af1b-4d9ebea72d4d','a46cb47f-6e54-4732-977f-e40bfe6f4910',true,true,false,false,'bbd12261-90ea-42aa-8893-f15cf1352cea',NOW(),NOW(),gen_random_uuid(),'43c6392e-0120-43f3-870b-c49392ebd19b'),
  (gen_random_uuid(),'3dfa07e2-7784-460d-af1b-4d9ebea72d4d','1f6dd180-96d7-4e84-9804-1a342cb20273',true,true,false,false,'bbd12261-90ea-42aa-8893-f15cf1352cea',NOW(),NOW(),gen_random_uuid(),'43c6392e-0120-43f3-870b-c49392ebd19b'),
  (gen_random_uuid(),'3dfa07e2-7784-460d-af1b-4d9ebea72d4d','302bd190-ef1b-4e4f-af69-0ad301f3f002',true,true,false,false,'bbd12261-90ea-42aa-8893-f15cf1352cea',NOW(),NOW(),gen_random_uuid(),'43c6392e-0120-43f3-870b-c49392ebd19b'),
  (gen_random_uuid(),'3dfa07e2-7784-460d-af1b-4d9ebea72d4d','3349ded8-51b8-4202-ae67-09a05e7422c2',true,true,false,false,'bbd12261-90ea-42aa-8893-f15cf1352cea',NOW(),NOW(),gen_random_uuid(),'43c6392e-0120-43f3-870b-c49392ebd19b')
ON CONFLICT DO NOTHING;

-- 7) Field locks: Member can read but NOT update assignedTo + leadStatus
INSERT INTO core."fieldPermission" ("id","roleId","objectMetadataId","fieldMetadataId","canReadFieldValue","canUpdateFieldValue","workspaceId","createdAt","updatedAt","universalIdentifier","applicationId")
SELECT gen_random_uuid(),'3dfa07e2-7784-460d-af1b-4d9ebea72d4d','1e31ee5b-01c5-46e0-88f5-e8de11861be1','8b19c2f3-036a-43b0-9d73-52d243c48218',true,false,'bbd12261-90ea-42aa-8893-f15cf1352cea',NOW(),NOW(),gen_random_uuid(),'43c6392e-0120-43f3-870b-c49392ebd19b'
WHERE NOT EXISTS (SELECT 1 FROM core."fieldPermission" WHERE "roleId"='3dfa07e2-7784-460d-af1b-4d9ebea72d4d' AND "fieldMetadataId"='8b19c2f3-036a-43b0-9d73-52d243c48218');

INSERT INTO core."fieldPermission" ("id","roleId","objectMetadataId","fieldMetadataId","canReadFieldValue","canUpdateFieldValue","workspaceId","createdAt","updatedAt","universalIdentifier","applicationId")
SELECT gen_random_uuid(),'3dfa07e2-7784-460d-af1b-4d9ebea72d4d','1e31ee5b-01c5-46e0-88f5-e8de11861be1','508bba83-8fa0-457b-9c12-5c68f84d1259',true,false,'bbd12261-90ea-42aa-8893-f15cf1352cea',NOW(),NOW(),gen_random_uuid(),'43c6392e-0120-43f3-870b-c49392ebd19b'
WHERE NOT EXISTS (SELECT 1 FROM core."fieldPermission" WHERE "roleId"='3dfa07e2-7784-460d-af1b-4d9ebea72d4d' AND "fieldMetadataId"='508bba83-8fa0-457b-9c12-5c68f84d1259');

-- 8) Row-level predicates: Member sees only rows where relation IS current member (IS + workspaceMemberFieldMetadataId)
INSERT INTO core."rowLevelPermissionPredicate" ("id","fieldMetadataId","objectMetadataId","operand","value","workspaceMemberFieldMetadataId","workspaceId","roleId","universalIdentifier","applicationId","createdAt","updatedAt")
SELECT gen_random_uuid(),'8b19c2f3-036a-43b0-9d73-52d243c48218','1e31ee5b-01c5-46e0-88f5-e8de11861be1','IS',null,'e4e82155-5185-4ab9-9f33-411650b575f6','bbd12261-90ea-42aa-8893-f15cf1352cea','3dfa07e2-7784-460d-af1b-4d9ebea72d4d',gen_random_uuid(),'43c6392e-0120-43f3-870b-c49392ebd19b',NOW(),NOW()
WHERE NOT EXISTS (SELECT 1 FROM core."rowLevelPermissionPredicate" WHERE "roleId"='3dfa07e2-7784-460d-af1b-4d9ebea72d4d' AND "fieldMetadataId"='8b19c2f3-036a-43b0-9d73-52d243c48218');

INSERT INTO core."rowLevelPermissionPredicate" ("id","fieldMetadataId","objectMetadataId","operand","value","workspaceMemberFieldMetadataId","workspaceId","roleId","universalIdentifier","applicationId","createdAt","updatedAt")
SELECT gen_random_uuid(),'2d1e02ca-cd45-48c4-9735-96c2984e5e8e','a46cb47f-6e54-4732-977f-e40bfe6f4910','IS',null,'e4e82155-5185-4ab9-9f33-411650b575f6','bbd12261-90ea-42aa-8893-f15cf1352cea','3dfa07e2-7784-460d-af1b-4d9ebea72d4d',gen_random_uuid(),'43c6392e-0120-43f3-870b-c49392ebd19b',NOW(),NOW()
WHERE NOT EXISTS (SELECT 1 FROM core."rowLevelPermissionPredicate" WHERE "roleId"='3dfa07e2-7784-460d-af1b-4d9ebea72d4d' AND "fieldMetadataId"='2d1e02ca-cd45-48c4-9735-96c2984e5e8e');

INSERT INTO core."rowLevelPermissionPredicate" ("id","fieldMetadataId","objectMetadataId","operand","value","workspaceMemberFieldMetadataId","workspaceId","roleId","universalIdentifier","applicationId","createdAt","updatedAt")
SELECT gen_random_uuid(),'54c56313-21c3-4a94-8db0-33d33e4df141','1f6dd180-96d7-4e84-9804-1a342cb20273','IS',null,'e4e82155-5185-4ab9-9f33-411650b575f6','bbd12261-90ea-42aa-8893-f15cf1352cea','3dfa07e2-7784-460d-af1b-4d9ebea72d4d',gen_random_uuid(),'43c6392e-0120-43f3-870b-c49392ebd19b',NOW(),NOW()
WHERE NOT EXISTS (SELECT 1 FROM core."rowLevelPermissionPredicate" WHERE "roleId"='3dfa07e2-7784-460d-af1b-4d9ebea72d4d' AND "fieldMetadataId"='54c56313-21c3-4a94-8db0-33d33e4df141');

INSERT INTO core."rowLevelPermissionPredicate" ("id","fieldMetadataId","objectMetadataId","operand","value","workspaceMemberFieldMetadataId","workspaceId","roleId","universalIdentifier","applicationId","createdAt","updatedAt")
SELECT gen_random_uuid(),'49f405fa-2a28-45ed-9aed-8d5bdec80ccd','302bd190-ef1b-4e4f-af69-0ad301f3f002','IS',null,'e4e82155-5185-4ab9-9f33-411650b575f6','bbd12261-90ea-42aa-8893-f15cf1352cea','3dfa07e2-7784-460d-af1b-4d9ebea72d4d',gen_random_uuid(),'43c6392e-0120-43f3-870b-c49392ebd19b',NOW(),NOW()
WHERE NOT EXISTS (SELECT 1 FROM core."rowLevelPermissionPredicate" WHERE "roleId"='3dfa07e2-7784-460d-af1b-4d9ebea72d4d' AND "fieldMetadataId"='49f405fa-2a28-45ed-9aed-8d5bdec80ccd');

-- Verification queries (run manually)
-- SELECT "name","type", "relationTargetObjectMetadataId" FROM core."fieldMetadata" WHERE "id"='8b19c2f3-036a-43b0-9d73-52d243c48218';
-- SELECT count(*) FROM workspace_b4ai6k0t73ulj4l40gxarowdm."person" WHERE "assignedToId" IS NOT NULL;
-- SELECT * FROM core."fieldPermission" WHERE "roleId"='3dfa07e2-7784-460d-af1b-4d9ebea72d4d';
-- SELECT * FROM core."rowLevelPermissionPredicate" WHERE "roleId"='3dfa07e2-7784-460d-af1b-4d9ebea72d4d';
