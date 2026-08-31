#!/usr/bin/env node
// Agency Workflow Worker — handles status automations, emails, calendar, archive
// Polls workspace DB every 60s, runs inside zed network (uses PG via Docker DNS)
// Email via SMTP (zedagencyofficial@gmail.com), Calendar via DB insert + optional Google API
// Moves: Not Attended→Task(3h), FollowUp→Task(1d), Schedule→Opportunity, Booked→Email+Calendar, Rejected→Archive

const { Client } = require('pg');
const nodemailer = require('nodemailer');

// Env
const PG_URL = process.env.PG_DATABASE_URL || `postgres://${process.env.PG_DATABASE_USER||'postgres'}:${process.env.PG_DATABASE_PASSWORD||'postgres'}@${process.env.PG_DATABASE_HOST||'db'}:${process.env.PG_DATABASE_PORT||5432}/${process.env.PG_DATABASE_NAME||'default'}`;
const SMTP_HOST = process.env.EMAIL_SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.EMAIL_SMTP_PORT||'465',10);
const SMTP_USER = process.env.EMAIL_SMTP_USER || 'zedagencyofficial@gmail.com';
const SMTP_PASS = process.env.EMAIL_SMTP_PASSWORD || '';
const EMAIL_TO = 'zedagencyofficial@gmail.com';
const POLL_MS = parseInt(process.env.AGENCY_POLL_MS||'60000',10);

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  if (!SMTP_PASS) { console.warn('[agency] SMTP_PASS missing, emails disabled'); return null; }
  transporter = nodemailer.createTransport({
    host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_PORT===465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
  return transporter;
}

async function sendBookedEmail(pg, person, opp) {
  const tx = getTransporter();
  if (!tx) return;
  const subject = `Zed CRM: Lead Booked - ${person.nameFirstName||''} ${person.nameLastName||''} ${person.emailsPrimaryEmail||''}`;
  const html = `
    <h2>Lead Booked / Scheduled</h2>
    <p><b>Name:</b> ${person.nameFirstName||''} ${person.nameLastName||''}</p>
    <p><b>Email:</b> ${person.emailsPrimaryEmail||''}</p>
    <p><b>Phone:</b> ${person.phonesPrimaryPhoneNumber||''} ${person.phonesPrimaryPhoneCountryCode||''}</p>
    <p><b>Company:</b> ${person.companyName||'-'}</p>
    <p><b>Job Title:</b> ${person.jobTitle||'-'}</p>
    <p><b>Status:</b> ${person.leadStatus||''}</p>
    <p><b>Assigned To:</b> ${person.assignedToId||'None'}</p>
    ${opp ? `<p><b>Opportunity:</b> ${opp.name||''} | Amount: ${opp.amountAmountMicros||''} ${opp.amountCurrencyCode||''} | Meeting: ${opp.closeDate||''} | Stage: ${opp.stage||''}</p>` : ''}
    <p><b>Lead ID:</b> ${person.id}</p>
    <hr><p>This is automated from Zed CRM (single default mail ${SMTP_USER} for all members, no other connections needed).</p>
  `;
  try {
    await tx.sendMail({ from: `"Zed" <${SMTP_USER}>`, to: EMAIL_TO, subject, html, text: html.replace(/<[^>]+>/g,' ') });
    console.log(`[agency] email sent for ${person.id} to ${EMAIL_TO}`);
    // also create timeline activity? insert into timelineActivities via note? skip for now
  } catch (e) {
    console.error('[agency] email failed', e.message);
  }
}

async function createCalendarEvent(pg, person, opp) {
  // Create calendarEvent + participant + target for the booked meeting
  // Uses workspace schema dynamically
  const wsRes = await pg.query(`SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'workspace_%' LIMIT 1`);
  if (!wsRes.rows[0]) return;
  const schema = wsRes.rows[0].schema_name;
  const wsIdRes = await pg.query(`SELECT id FROM core."workspace" LIMIT 1`);
  const wsId = wsIdRes.rows[0]?.id;
  // Use closeDate as meeting time, fallback to now+1d
  const meetingTime = opp?.closeDate || new Date(Date.now()+24*3600*1000).toISOString();
  // Find workspaceMember for calendar owner (first admin)
  const wmRes = await pg.query(`SELECT id FROM ${schema}."workspaceMember" LIMIT 1`);
  const ownerWmId = wmRes.rows[0]?.id;
  try {
    const evId = require('crypto').randomUUID();
    await pg.query(`INSERT INTO ${schema}."calendarEvent" (id, "createdAt","updatedAt", "title", "startsAt","endsAt", "isFullDay", "location", "description", "conferenceLinkLabel", "conferenceLinkUrl", "isCanceled") VALUES ($1,NOW(),NOW(),$2,$3,$4,false,$5,$6,'','',false)`, [evId, `Booked: ${person.nameFirstName||''} ${person.nameLastName||''} - ${person.companyName||''}`, meetingTime, new Date(new Date(meetingTime).getTime()+60*60*1000).toISOString(), opp?.name||'', `Booked lead ${person.emailsPrimaryEmail||''} ${person.phonesPrimaryPhoneNumber||''} Budget ${opp?.amountAmountMicros||''}`]);
    if (ownerWmId) {
      const partId = require('crypto').randomUUID();
      await pg.query(`INSERT INTO ${schema}."calendarEventParticipant" (id, "createdAt","updatedAt", "calendarEventId", "workspaceMemberId", "personId", "handle", "displayName", "isOrganizer") VALUES ($1,NOW(),NOW(),$2,$3,$4,$5,$6,true)`, [partId, evId, ownerWmId, person.id, person.emailsPrimaryEmail||'', `${person.nameFirstName||''} ${person.nameLastName||''}`.trim()]);
    }
    // Link to person via calendarEventTargets junction if exists
    const hasTarget = await pg.query(`SELECT 1 FROM information_schema.tables WHERE table_schema=$1 AND table_name='calendarEventTarget'`, [schema]);
    if (hasTarget.rowCount) {
      try {
        await pg.query(`INSERT INTO ${schema}."calendarEventTarget" (id, "createdAt","updatedAt", "calendarEventId", "targetPersonId") VALUES ($1,NOW(),NOW(),$2,$3)`, [require('crypto').randomUUID(), evId, person.id]);
      } catch {}
    }
    console.log(`[agency] calendar event ${evId} created for ${person.id} at ${meetingTime}`);
  } catch (e) {
    console.error('[agency] calendar failed', e.message);
  }
}

async function handleNotAttended(pg, schema) {
  // Move Not Attended → Task with due 3h, if due passed and status unchanged → move back to People (delete task or just reset follow-up)
  try {
    const colCheck = await pg.query(`SELECT 1 FROM information_schema.columns WHERE table_schema=$1 AND table_name='person' AND column_name='leadStatus'`, [schema]);
    if (!colCheck.rows.length) { console.log('[agency] skip Not Attended — leadStatus column missing in', schema); return; }
  } catch {}
  const res = await pg.query(`SELECT id, "nameFirstName","nameLastName","emailsPrimaryEmail","emailsAdditionalEmails","phonesPrimaryPhoneNumber","phonesPrimaryPhoneCountryCode","phonesPrimaryPhoneCallingCode","jobTitle","companyId","leadStatus","updatedAt","assignedToId" FROM ${schema}."person" WHERE "leadStatus"='Not Attended' AND "deletedAt" IS NULL`);
  for (const p of res.rows) {
    // Check if task already exists for this person via taskTargets
    const taskExists = await pg.query(`SELECT t.id, t."dueAt", t.status FROM ${schema}."task" t JOIN ${schema}."taskTarget" tt ON tt."taskId"=t.id WHERE tt."targetPersonId"=$1 AND t."title" LIKE 'Follow Up: Not Attended%' AND t."deletedAt" IS NULL ORDER BY t."dueAt" DESC LIMIT 1`, [p.id]);
    if (taskExists.rows.length===0) {
      // Create task due in 3h, mirroring People fields (emails, phones, company, jobTitle) + dueDate
      const taskId = require('crypto').randomUUID();
      const due = new Date(Date.now()+3*3600*1000).toISOString();
      const title = `Follow Up: Not Attended - ${p.nameFirstName||''} ${p.emailsPrimaryEmail||p.id.slice(0,8)}`;
      // Check if Task has mirrored columns (emails, phones, companyId, jobTitle) — if not, fallback to basic insert
      const hasCols = await pg.query(`SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name='task' AND column_name IN ('emails','phones','jobTitle','companyId')`, [schema]);
      const hasMirrors = hasCols.rows.length >= 4;
      if (hasMirrors) {
        await pg.query(`INSERT INTO ${schema}."task" (id, "createdAt","updatedAt", title, status, "dueAt", "assigneeId", "emails", "phones", "companyId", "jobTitle") VALUES ($1,NOW(),NOW(),$2,'TODO',$3,$4,$5,$6,$7,$8)`, [taskId, title, due, p.assignedToId, p.emailsPrimaryEmail||'', p.phonesPrimaryPhoneNumber||'', p.companyId, p.jobTitle||'']);
      } else {
        await pg.query(`INSERT INTO ${schema}."task" (id, "createdAt","updatedAt", title, status, "dueAt", "assigneeId") VALUES ($1,NOW(),NOW(),$2,'TODO',$3,$4)`, [taskId, title, due, p.assignedToId]);
      }
      await pg.query(`INSERT INTO ${schema}."taskTarget" (id, "createdAt","updatedAt", "taskId", "targetPersonId") VALUES ($1,NOW(),NOW(),$2,$3)`, [require('crypto').randomUUID(), taskId, p.id]);
      console.log(`[agency] Not Attended task ${taskId} due ${due} for ${p.id} (mirrored fields)`);
    } else {
      const task = taskExists.rows[0];
      if (new Date(task.dueAt) < new Date() && task.status==='TODO') {
        // Check if person status still Not Attended and not changed in last 3h
        const ageHrs = (Date.now() - new Date(p.updatedAt).getTime())/3600000;
        if (ageHrs >= 3) {
          // Move back to People: just log and keep status, but ensure task is marked overdue? For now mark task as TODO overdue and keep person as is (user said move to people if not changed, meaning keep in people)
          console.log(`[agency] Not Attended overdue ${p.id} task ${task.id}, leaving in people (status unchanged)`);
          // Optionally reset task due or create new? Leave as is per spec: if status not changed then respective lead should automatically moved to the people (already there) - so no op
        }
      }
    }
  }
}

async function handleFollowUp(pg, schema) {
  try {
    const colCheck = await pg.query(`SELECT 1 FROM information_schema.columns WHERE table_schema=$1 AND table_name='person' AND column_name='leadStatus'`, [schema]);
    if (!colCheck.rows.length) return;
  } catch {}
  const res = await pg.query(`SELECT id, "nameFirstName","emailsPrimaryEmail","phonesPrimaryPhoneNumber","jobTitle","companyId","leadStatus","updatedAt","assignedToId" FROM ${schema}."person" WHERE "leadStatus"='Follow Up' AND "deletedAt" IS NULL`);
  for (const p of res.rows) {
    const taskExists = await pg.query(`SELECT t.id, t."dueAt", t.status FROM ${schema}."task" t JOIN ${schema}."taskTarget" tt ON tt."taskId"=t.id WHERE tt."targetPersonId"=$1 AND t."title" LIKE 'Follow Up:%' AND t."deletedAt" IS NULL ORDER BY t."dueAt" DESC LIMIT 1`, [p.id]);
    if (taskExists.rows.length===0) {
      const taskId = require('crypto').randomUUID();
      const due = new Date(Date.now()+24*3600*1000).toISOString();
      const title = `Follow Up: ${p.nameFirstName||''} ${p.emailsPrimaryEmail||p.id.slice(0,8)}`;
      const hasCols = await pg.query(`SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name='task' AND column_name IN ('emails','phones','jobTitle','companyId')`, [schema]);
      const hasMirrors = hasCols.rows.length >= 4;
      if (hasMirrors) {
        await pg.query(`INSERT INTO ${schema}."task" (id, "createdAt","updatedAt", title, status, "dueAt", "assigneeId", "emails", "phones", "companyId", "jobTitle") VALUES ($1,NOW(),NOW(),$2,'TODO',$3,$4,$5,$6,$7,$8)`, [taskId, title, due, p.assignedToId, p.emailsPrimaryEmail||'', p.phonesPrimaryPhoneNumber||'', p.companyId, p.jobTitle||'']);
      } else {
        await pg.query(`INSERT INTO ${schema}."task" (id, "createdAt","updatedAt", title, status, "dueAt", "assigneeId") VALUES ($1,NOW(),NOW(),$2,'TODO',$3,$4)`, [taskId, title, due, p.assignedToId]);
      }
      await pg.query(`INSERT INTO ${schema}."taskTarget" (id, "createdAt","updatedAt", "taskId", "targetPersonId") VALUES ($1,NOW(),NOW(),$2,$3)`, [require('crypto').randomUUID(), taskId, p.id]);
      console.log(`[agency] Follow Up task ${taskId} due ${due} for ${p.id} (mirrored)`);
    } else {
      const task = taskExists.rows[0];
      if (new Date(task.dueAt) < new Date() && task.status==='TODO') {
        const ageDays = (Date.now() - new Date(p.updatedAt).getTime())/86400000;
        if (ageDays >=1) {
          console.log(`[agency] Follow Up overdue ${p.id}, keeping in people (member not followed up)`);
        }
      }
    }
  }
}

async function handleSchedule(pg, schema) {
  // Schedule → move to Opportunity after filling sidebar, no longer in People until booked/scheduled changed
  try {
    const colCheck = await pg.query(`SELECT 1 FROM information_schema.columns WHERE table_schema=$1 AND table_name='person' AND column_name='leadStatus'`, [schema]);
    if (!colCheck.rows.length) return;
  } catch {}
  const res = await pg.query(`SELECT p.id, p."nameFirstName",p."nameLastName",p."emailsPrimaryEmail",p."emailsAdditionalEmails",p."phonesPrimaryPhoneNumber",p."phonesPrimaryPhoneCountryCode",p."phonesAdditionalPhones",p."jobTitle",p."companyId",p."assignedToId",p."leadStatus", p."updatedAt" FROM ${schema}."person" p WHERE p."leadStatus"='Scheduled' AND p."deletedAt" IS NULL`);
  for (const p of res.rows) {
    const oppExists = await pg.query(`SELECT id FROM ${schema}."opportunity" WHERE "pointOfContactId"=$1 AND "deletedAt" IS NULL LIMIT 1`, [p.id]);
    if (oppExists.rows.length===0) {
      const oppId = require('crypto').randomUUID();
      const name = `${p.nameFirstName||''} ${p.nameLastName||''} - Scheduled`.trim() || `Scheduled ${p.emailsPrimaryEmail||p.id.slice(0,8)}`;
      const closeDate = new Date(Date.now()+2*86400*1000).toISOString();
      // Mirror People fields to Opportunity + extra pointOfContact, budget (amount), meetingScheduled (closeDate)
      const hasCols = await pg.query(`SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name='opportunity' AND column_name IN ('emails','phones','jobTitle')`, [schema]);
      const hasMirrors = hasCols.rows.length >= 3;
      if (hasMirrors) {
        await pg.query(`INSERT INTO ${schema}."opportunity" (id, "createdAt","updatedAt", name, "amountAmountMicros", "amountCurrencyCode", "closeDate", "pointOfContactId", "companyId", "ownerId", stage, position, "emails", "phones", "jobTitle") VALUES ($1,NOW(),NOW(),$2,$3,'INR',$4,$5,$6,$7,'MEETING',0,$8,$9,$10)`, [oppId, name, 0, closeDate, p.id, p.companyId, p.assignedToId, p.emailsPrimaryEmail||'', p.phonesPrimaryPhoneNumber||'', p.jobTitle||'']);
      } else {
        await pg.query(`INSERT INTO ${schema}."opportunity" (id, "createdAt","updatedAt", name, "amountAmountMicros", "amountCurrencyCode", "closeDate", "pointOfContactId", "companyId", "ownerId", stage, position) VALUES ($1,NOW(),NOW(),$2,$3,'INR',$4,$5,$6,$7,'MEETING',0)`, [oppId, name, 0, closeDate, p.id, p.companyId, p.assignedToId]);
      }
      console.log(`[agency] Schedule opp ${oppId} for person ${p.id} (mirrored)`); 
      await sendBookedEmail(pg, p, { name, amountAmountMicros:0, amountCurrencyCode:'INR', closeDate, stage:'MEETING' });
    } else {
      // Ensure email sent at least once? Check if already sent via timeline? For now skip duplicate
    }
  }
}

async function handleBooked(pg, schema) {
  try {
    const colCheck = await pg.query(`SELECT 1 FROM information_schema.columns WHERE table_schema=$1 AND table_name='person' AND column_name='leadStatus'`, [schema]);
    if (!colCheck.rows.length) return;
  } catch {}
  const res = await pg.query(`SELECT p.id, p."nameFirstName",p."nameLastName",p."emailsPrimaryEmail",p."phonesPrimaryPhoneNumber",p."jobTitle",p."companyId",p."assignedToId" FROM ${schema}."person" p WHERE p."leadStatus"='Booked' AND p."deletedAt" IS NULL`);
  for (const p of res.rows) {
    const oppExists = await pg.query(`SELECT id, name, "amountAmountMicros","amountCurrencyCode","closeDate" FROM ${schema}."opportunity" WHERE "pointOfContactId"=$1 AND "deletedAt" IS NULL LIMIT 1`, [p.id]);
    let opp = oppExists.rows[0] || null;
    if (!opp) {
      const oppId = require('crypto').randomUUID();
      const name = `${p.nameFirstName||''} ${p.nameLastName||''} - Booked`.trim();
      const closeDate = new Date(Date.now()+3*86400*1000).toISOString();
      const hasCols = await pg.query(`SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name='opportunity' AND column_name IN ('emails','phones','jobTitle')`, [schema]);
      const hasMirrors = hasCols.rows.length >= 3;
      if (hasMirrors) {
        await pg.query(`INSERT INTO ${schema}."opportunity" (id, "createdAt","updatedAt", name, "amountAmountMicros","amountCurrencyCode","closeDate","pointOfContactId","companyId","ownerId", stage, position, "emails", "phones", "jobTitle") VALUES ($1,NOW(),NOW(),$2,$3,'INR',$4,$5,$6,$7,'CUSTOMER',0,$8,$9,$10)`, [oppId, name, 0, closeDate, p.id, p.companyId, p.assignedToId, p.emailsPrimaryEmail||'', p.phonesPrimaryPhoneNumber||'', p.jobTitle||'']);
      } else {
        await pg.query(`INSERT INTO ${schema}."opportunity" (id, "createdAt","updatedAt", name, "amountAmountMicros","amountCurrencyCode","closeDate","pointOfContactId","companyId","ownerId", stage, position) VALUES ($1,NOW(),NOW(),$2,$3,'INR',$4,$5,$6,$7,'CUSTOMER',0)`, [oppId, name, 0, closeDate, p.id, p.companyId, p.assignedToId]);
      }
      opp = { id: oppId, name, amountAmountMicros:0, amountCurrencyCode:'INR', closeDate, stage:'CUSTOMER' };
      console.log(`[agency] Booked opp ${oppId} for ${p.id} (mirrored)`);
    }
    // Ensure opportunity stage is CUSTOMER/BOOKED if needed
    await sendBookedEmail(pg, p, opp);
    await createCalendarEvent(pg, p, opp);
  }
}

async function handleRejected(pg, schema) {
  // Move to archive: soft delete person (set deletedAt) to avoid duplicate, keep for dedup check
  const res = await pg.query(`SELECT id, "emailsPrimaryEmail","phonesPrimaryPhoneNumber" FROM ${schema}."person" WHERE "leadStatus"='Rejected' AND "deletedAt" IS NULL`);
  for (const p of res.rows) {
    await pg.query(`UPDATE ${schema}."person" SET "deletedAt"=NOW() WHERE id=$1`, [p.id]);
    console.log(`[agency] Rejected archived ${p.id}`);
  }
  // Dedup: when new person inserted with same email/phone as archived, log warning (actual blocking could be via unique index partial, but we just log)
  // This is handled at import time via worker check: if new person email exists in archived, skip or merge
}

async function dedupCheck(pg, schema) {
  // Avoid new leads duplicate old archived: if a New person has same email/phone as a Rejected archived, mark or delete duplicate
  const dupRes = await pg.query(`
    SELECT n.id as new_id, o.id as old_id, n."emailsPrimaryEmail"
    FROM ${schema}."person" n JOIN ${schema}."person" o ON o."emailsPrimaryEmail" = n."emailsPrimaryEmail" AND o."deletedAt" IS NOT NULL
    WHERE n."deletedAt" IS NULL AND n."leadStatus"='New' AND o."leadStatus"='Rejected' AND n."emailsPrimaryEmail" IS NOT NULL AND n."emailsPrimaryEmail" != '' LIMIT 5
  `);
  for (const d of dupRes.rows) {
    console.log(`[agency] dedup: new ${d.new_id} duplicate of archived ${d.old_id} email ${d.emailsPrimaryEmail} — archiving new to avoid duplicate`);
    await pg.query(`UPDATE ${schema}."person" SET "deletedAt"=NOW(), "leadStatus"='Rejected' WHERE id=$1`, [d.new_id]);
  }
}

async function pollOnce() {
  const pg = new Client({ connectionString: PG_URL });
  await pg.connect();
  try {
    const wsRes = await pg.query(`SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'workspace_%' LIMIT 1`);
    if (!wsRes.rows[0]) { console.log('[agency] no workspace schema'); return; }
    const schema = wsRes.rows[0].schema_name;
    for (const fn of [handleNotAttended, handleFollowUp, handleSchedule, handleBooked, handleRejected, dedupCheck]) {
      try { await fn(pg, schema); } catch (e) { console.error('[agency] handler error', fn.name, e.message); }
    }
  } catch (e) {
    console.error('[agency] poll error', e);
  } finally {
    await pg.end();
  }
}

async function main() {
  console.log(`[agency] worker starting poll ${POLL_MS}ms SMTP ${SMTP_USER}->${EMAIL_TO} PG ${PG_URL.replace(/:.+@/,'://***@')}`);
  await pollOnce();
  setInterval(pollOnce, POLL_MS);
}

if (require.main === module) main();
