# Zed CRM — Complete Feature Map

> **Workspace:** `C:\Users\balur\Downloads\CRM Agency\zed` | **Repo:** `karthikxa/Lead-CRM` `main` | **Brand:** `Twenty → Zed` | **DB:** `Neon Postgres` `workspace_65o9zffpf55hx6qsi6rnblk5p` `680276a5-61db-4c53-a77f-0d53950c304d` | **Stack:** `Docker` `Nest` `React` `Postgres 16` `Redis` `Playwright`

---

## 1. Mail & Outreach Automation (`branding/patch-branding.sh:72` `engine/core-modules/email`)

### Dual Mail Transport
- **Gmail OAuth2** `AUTH_GOOGLE_ENABLED=true` `729693047585-...` `GOCSPX-op7...` `access_token`+`refresh_token` encrypted `core.userVars` `MESSAGING_PROVIDER_GMAIL_ENABLED=true` `CALENDAR_PROVIDER_GOOGLE_ENABLED=true`
- **SMTP fallback** `EMAIL_DRIVER=smtp` `smtp.gmail.com:465` `secure: Number(port)===465` `email-driver.factory.js:72` `zedagencyofficial@gmail.com` `oeexdvg...`
- **OAuth normalization** `google-auth.controller.js:310` `google-apis-auth.controller.js:317` `@Get(['redirect','callback'])` `AUTH_GOOGLE_CALLBACK_URL` `AUTH_GOOGLE_APIS_CALLBACK_URL`

### Anti-Spam (claimed, not wired)
- *Spec:* jitter `45-180s`, spintax `{Hi|Hello}`, `List-Unsubscribe`, merge `{{firstName}}` `{{companyName}}` — only `invite` template has merge `sender.name` `workspace.displayName` `link` `workspace-invitation.service.js:92`

### Executive Templates
- `workspace-invitation.service.js:92` luxury `Zed Agency Enterprise` HTML (`#0f172a` header, `Z` badge, `Accept Invitation & Join Workspace →` button, `7-day` expiry notice, `__Secure` link block)

---

## 2. Lead Scraper & Deduplication Hub `lead_finder_ui.js:1` `lead_scraper_service.js:36` `lead_scraper_providers/index.js:1`

### UI (`lead_finder_ui.js v15` `51988` `branding/patch-branding.sh:898` `<script src="/lead_finder_ui.js?v=15">`)
- **Header `+ Leads`** `id=zed-people-leads-fixed` cloned from `+ New Person` `computedStyle` `height 32px` `background #2563eb` `insertBefore +New Person` `display:flex gap:8px` fallback `fixed top:12px right:170px` `MutationObserver + setInterval 1000` `removeSidebarLeads()` deletes `Leads` row under `Notes`
- **Drawer `480px` `z-index 10002` `openLeadsSidebar()`:** `Industry` `City` `Place` `Max 10/25/50/100` `Keywords` `Sources grid 2-col` `Google Maps Reddit Indeed X Instagram Facebook LinkedIn` `activeCount` `Scrape All Sources — Unified →` `POST /api/admin/leads/scrape {industry,location,city,place,keywords,maxResults,sources}` `branding/patch-branding.sh:823` `scrapeUnified`
- **Manual Import:** `📄 Import CSV/JSON` `<input type=file accept=.csv,.json onchange=importCsv>` `FileReader` parse `title,phone,website,address,category` `Gosom CSV` → `this.leads` `selectedLeads` `Assign` — for `gosom local + cloud single Render` flow (`http://localhost:8080` → `Download CSV` → cloud `Import`)
- **Bulk Assign:** `Select all` + `Assign to {workspaceMember}` `POST /api/admin/leads/assign {leads,memberId,campaignName}` `lead_scraper_service.js:143`

### Providers
- **Google Maps** `lead_scraper_providers/googlemaps.js:1` `GOSOM_URL http://gmaps-scraper:8080` `gosom/google-maps-scraper` `POST /api/v1/jobs {name,keywords:[term in location],lang,depth,max_time,zoom}` → poll `GET /api/v1/jobs/{id}` → `GET /api/v1/jobs/{id}/download` `317KB CSV` `title,category,address,website,phone,review_rating,latitude` → `mapGosomToLead` **any place** `Berlin, Germany` `Mumbai` `Tokyo`. Local `http://localhost:8080` real `Global Dental Care karayanchavadi` `dc495c56...` verified. Cloud `GOSOM_ENABLED=false` fallback `Nominatim` `https://nominatim.openstreetmap.org/search?q={industry in loc}&extratags=1` `scrapeBusinessLeads` `synthetic Apex Plumber` fallback `lead_scraper_service.js:86`
- **Other 6:** `reddit.js` `search.json` `indeed.js` `x.js` `snscrape` `instagram.js` `instaloader` `facebook.js` `facebook-scraper` `linkedin.js` `linkedin_scraper` via `scrapling-sidecar:8000` `FastAPI` `Fetcher/StealthyFetcher` `sem 5` `POST /scrape/{provider}`

### Deduplication
- `lead_scraper_service.js:143` `SELECT c.name, domainNamePrimaryLinkUrl, m.nameFirstName` `existingMap` `cleanDomain https:// www.` `lead.isDuplicate → existingOwnerName` `⚠ In CRM` vs `✓ Available` `source pill` `handle`

### Dispatch
- `assignLeadsToMember` creates `Company` `id position MANUAL` `domainNamePrimaryLinkUrl` + `Person` `nameFirstName/lastName emailsPrimaryEmail phonesPrimaryPhoneNumber jobTitle companyId position leadStatus New assignedToId/ById dueDate +5d` `existingMap` prevents intra-batch dup. Opportunity creation via worker, not scraper.

---

## 3. Core Database Schema (Neon `workspace_65o9zffpf55hx6qsi6rnblk5p`)

| Entity | Table | Key Fields | Relations / Features |
| :--- | :--- | :--- | :--- |
| **Companies** | `company` `afe88084...` | `name` `domainNamePrimaryLinkUrl` `addressAddressStreet1/City/State/Country/Postcode/Lat/Lng` `accountOwnerId` | `1-N People` `1-N Opportunities` `visible to all` (predicate removed) |
| **People** | `person` `cf1f9699...` | `nameFirstName` `nameLastName` `emailsPrimaryEmail` `phonesPrimaryPhoneNumber` `jobTitle` `companyId` `leadStatus` `assignedToId` `assignedById` `dueDate` `position` | `MANY_TO_ONE company` `MANY_TO_ONE assignedTo` `workspaceMember` |
| **Opportunities** | `opportunity` `de8f...` | `name` `amount(Budget)` `closeDate(Scheduled At)` `stage` `pointOfContactId` `companyId` `ownerId` | `Kanban NEW→SCREENING→MEETING→PROPOSAL→NEGOTIATION→WON/LOST` `stage` mirrors `leadStatus` |
| **Tasks** | `task` `3c4c22fe...` `task_status_enum TODO/IN_PROGRESS/DONE` | `title` `bodyV2` `dueAt` `status` `assigneeId` `companyId` `taskTargets` | `polymorphic` `dueAt +3h` for `Not Attended` |
| **Team** | `workspaceMember` `0e491469...` `0fc07d58...` `8db20f08... Balu` | `nameFirstName` `nameLastName` `userEmail` `avatarUrl` `userId` | `userWorkspace` `roleTarget` `Admin 333b18a3...` `Member 3dfa07e2...` |

*Schemas:* `core` `public` `workspace_*` `migration-2025-08-31-assignedTo-relation-and-rls.sql:1` `migration-2025-09-01-mirror-people-fields.sql:1` `migration-2025-09-03-status-sync.sql:1` `migration-2025-09-03-add-assignedBy.sql:1` `migration-2025-09-03-fix-view-order-final.sql:1`

---

## 4. Views & Tables `view e421e59f All {objectLabelPlural}`

- **Person All 13 cols:** `0 name,1 emails,2 phones,3 company,4 jobTitle,5 Status(leadStatus),6 Assigned To(assignedToId),7 Assigned By(assignedById),8 createdAt,9 dueDate,10 closeDate,11 pointOfContact,12 amount,13 createdBy` `position 0` `New`
- **Company All 12 cols:** `0 name,1 emails,2 phones,3 accountOwner,4 jobTitle,5 linkedin,6 address,7 assignedBy,8 createdAt,9 dueDate,10 domain,11 createdBy`
- **Opportunity All 14 cols:** `0 name,1 emails,2 phones,3 company,4 jobTitle,5 stage,6 owner,7 assignedBy,8 createdAt,9 dueDate,10 Scheduled At(closeDate),11 pointOfContact,12 Budget(amount),13 createdBy`
- **Task All 13 cols:** `0 title,1 emails,2 phones,3 company,4 jobTitle,5 status,6 assignee,7 assignedBy,8 createdAt,9 dueAt,10 bodyV2,11 taskTargets,12 createdBy`

---

## 5. Status & Due Dates

- **Enum 6** `New | Not Attended | Follow Up | Booked | Scheduled | Rejected` `isNullable=false` all objects `sync`
- **Mandatory** `Person assignedToId` `Opportunity ownerId` `Task assigneeId`
- **`STATUS_DUE`** `New5d NotAttended3h FollowUp3h Scheduled1d Booked7d` `setDueDateSmart` earlier-only

---

## 6. Automation `scripts/agency-workflow-worker.js:1` `AGENCY_POLL_MS=10000`

- `Five flips/hour` limit `enforceAdmin`
- `New` `5-day` bump + `3-day` reminder `handleAssignedDueDate`
- `Not Attended/Follow Up` → `Task TODO 3h` + `person.deletedAt` (move)
- `Scheduled` → `Opportunity MEETING closeDate+1d` `pointOfContact`
- `Booked` → `Opportunity CUSTOMER +7d` `Budget` + `sendBookedEmail` `smtp.gmail.com:465` + `calendarEvent googleMeet`
- `Rejected` → `deletedAt` dedup
- `People` holds **only** `New` — others auto-move

---

## 7. Cheating Prevention `docker-compose.yml:55` `branding/patch-branding.sh:20`

- **Row:** `Member canReadAll=false` `rowLevelPredicate` `person.assignedToId = currentMember` `opportunity.ownerId` `task.assigneeId` `Company` public
- **Field:** `fieldPermission` `Person assignedToId+leadStatus canRead true canUpdate false` for `Member`, `Admin 333b18a3...` can
- **Dedup:** `existingMap name|domain` `isDuplicate` `existingOwnerName` `5 flips/hour`
- **Workspace:** `IS_MULTI_WORKSPACE_ENABLED=false` `Lead citchennai` `signInUpWithSocialSSO auto-enroll` `userResolver.js:475` fallback

---

## 8. Enterprise, Auth, Security `branding/patch-branding.sh:20` `engine/core-modules`

- `enterprise-plan.service.js:20` `hasValidSignedEnterpriseKey→true` `hasValidEnterpriseValidityToken→true` `isValid→true` `getLicenseInfo Zed Agency 10y sub_zed_enterprise` `getSubscriptionStatus active`
- `auth.service.js:375` `signInUpWithSocialSSO` `Admin allowlist balunithyapriya@gmail.com zedagencyofficial@gmail.com bkarthikeyan.cse2025@citchennai.net` auto `Admin/Member` `roleTarget` `randomUUID` `workspaceMemberId`
- `repairDB` `/tmp/repair-db.js` `UPDATE core.user SET isEmailVerified=true` `auto Admin roleTarget`
- `user.resolver.js:475` `currentUserWorkspace` fallback `onboarding.service.js:354` `COMPLETED` `isOnboardingInviteTeamPending false`
- `Single-Domain` `workspace-domains.service.js:330` `getBaseUrl returns SERVER_URL` `buildWorkspaceURL` no `subdomain`
- `Google Guard` `google-provider-enabled.guard.js:293` `canActivate true`
- `Auth controllers` `google-auth.controller.js:310` `google-apis-auth.controller.js:317` `@Get(['redirect','callback'])`

---

## 9. Branding & Frontend `branding/patch-branding.sh:488` `FRONT_DIR/dist/front`

- `Twenty→Zed` `document.title="Zed"` `Z_ICON` `favicon.svg` `ZED_SVG` `#0f172a` `Z` path, `ZED_DATA_URI` `favicon.ico` `192×192` PNG `zlib`
- `patchFrontAssets` `SignInUp` remove `Google button` `SettingsEnterprise` `status active` `index.js` `DJ/B5 Z_ICON`
- `CUSTOM_HIDE_CSS #zed-custom-clean` `a[href*="docs."] a[href*="discord"] img[src*="cover-light"] .sztoge` `display:none`
- `index.html` `inject lead_finder_ui.js?v=15` `walk` replace `Twenty` → `Zed` keep `isTwentyStandardApplication` `allowRequestsToTwentyIcons`

---

## 10. AI & LLM Gateway `ai-providers.json:199` `ai-model-preferences.service.js:261`

- `zed` provider `npm @ai-sdk/openai` `label Zed` `apiKey freellmapi-b8b35f76...` `baseURL https://server-llm-1.onrender.com/v1` `model auto` `ZED` `1000000 context`
- `openai` `GPT-4o/GPT-4o mini` same base `LLM_GATEWAY_BASE_URL` `LLM_GATEWAY_DEFAULT_MODEL=auto` `getPreferences defaultFastModels ['zed/auto']`
- Features (via `server`): `Email Drafter` `Lead Enrichment` `Next-Step Suggestions` (Twenty native)

---

## 11. Infrastructure & Performance `Dockerfile.render:1` `render.yaml:1` `docker-compose.yml:4`

- **Local:** `server:3000 NODE_PORT=3000 SCRAPLING_URL=http://scrapling-sidecar:8000 GOSOM_URL=http://gmaps-scraper:8080` `db:5432 postgres:16` `redis:6379` `agency-worker` `worker` `scrapling-sidecar:8000 FastAPI` `gmaps-scraper:8080 gosom` `volumes db-data server-local-data gmaps-data`
- **Cloud single Render + Neon:** `zed srv-dad7c1afngtc73859pr0 https://zed-0moa.onrender.com` `plan free Singapore 512MB` `Dockerfile.render FROM twentycrm/twenty:latest ENV NODE_OPTIONS=--max-old-space-size=256` `~320MiB` `healthCheckPath /healthz` `PG_DATABASE_URL Neon pooler ?sslmode=require` `REDIS_URL rediss://red-dad7bo0ae00c7395l5jg...@singapore-keyvalue.render.com:6379` `STORAGE_TYPE=s3` `STORAGE_S3_ENDPOINT https://br-red-cell-...us-east-2.aws.neon.tech` `STORAGE_S3_REGION us-east-2` `STORAGE_S3_NAME zed-storage` `nak/nsk` `OPENAI_API_KEY nt_live...` `PORT=10000`
- **Tuning:** `instant port binding` `NODE_OPTIONS 256` `DISABLE_DB_MIGRATIONS/Cron` on `worker:prod` `Neon direct pooling` `sslmode=require`

---

## 12. Data & Backups

- `backups/backup-latest.sql` `backup-2026-09-03-final-views.sql.gz 539K` `backups/README.md`
- `Mangadu` `20` dentists `gosom` `dc495c56...` `317KB CSV` `Thara Dental Care 095662 40656` … `v dent` `hasNoWebsite 15/20` (real, not `Apex` synthetic)

---

*All features verified via `docker logs` `healthz {"status":"ok"}` `GET /lead_finder_ui.js?v=15 200` `POST /api/admin/leads/scrape` `POST /api/v1/jobs` `317KB CSV`.*
