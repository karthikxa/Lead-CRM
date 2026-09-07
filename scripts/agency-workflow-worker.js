#!/usr/bin/env node
// Agency Workflow Worker — handles status automations, emails, calendar, archive
// Polls workspace DB every 60s, runs inside zed network (uses PG via Docker DNS)
// Email via SMTP (zedagencyofficial@gmail.com), Calendar via DB insert + optional Google API
// Moves: Not Attended→Task(3h), FollowUp→Task(1d), Schedule→Opportunity, Booked→Email+Calendar, Rejected→Keep in People (per user request, not archived)

const dns = require('dns');
if (dns.setDefaultResultOrder) dns.setDefaultResultOrder('ipv4first');
const { Client } = require('pg');
const nodemailer = require('nodemailer');

// Env
const PG_URL = process.env.PG_DATABASE_URL || `postgres://${process.env.PG_DATABASE_USER||'postgres'}:${process.env.PG_DATABASE_PASSWORD||'postgres'}@${process.env.PG_DATABASE_HOST||'db'}:${process.env.PG_DATABASE_PORT||5432}/${process.env.PG_DATABASE_NAME||'default'}`;
const SMTP_HOST = process.env.EMAIL_SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.EMAIL_SMTP_PORT||'465',10);
const SMTP_USER = process.env.EMAIL_SMTP_USER || 'zedagencyofficial@gmail.com';
const SMTP_PASS = process.env.EMAIL_SMTP_PASSWORD || '';
const EMAIL_TO = 'zedagencyofficial@gmail.com';
const POLL_MS = parseInt(process.env.AGENCY_POLL_MS || '15000', 10);

const https = require('https');
const crypto = require('crypto');
let generateLeadNotificationEmail, generateDueDateNotificationEmail;
try {
  const luxuryEmail = require('./zed-luxury-email.js');
  generateLeadNotificationEmail = luxuryEmail.generateLeadNotificationEmail;
  generateDueDateNotificationEmail = luxuryEmail.generateDueDateNotificationEmail;
} catch (e) {
  console.error('[agency] WARNING: zed-luxury-email.js not found, using plain-text fallback:', e.message);
  generateLeadNotificationEmail = (d) => `<p>New Lead: ${d.name || 'Unknown'} from ${d.company || 'Unknown'}</p>`;
  generateDueDateNotificationEmail = (d) => `<p>Due Date Alert: ${d.title || 'Task'} is due ${d.dueDate || 'soon'}</p>`;
}

const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID || process.env.AUTH_GOOGLE_CLIENT_ID || '';
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || process.env.AUTH_GOOGLE_CLIENT_SECRET || '';
const GMAIL_REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN || '';

function getGmailAccessToken() {
  return new Promise((resolve, reject) => {
    const payload = 'client_id=' + encodeURIComponent(GMAIL_CLIENT_ID)
      + '&client_secret=' + encodeURIComponent(GMAIL_CLIENT_SECRET)
      + '&refresh_token=' + encodeURIComponent(GMAIL_REFRESH_TOKEN)
      + '&grant_type=refresh_token';
    const req = https.request({
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(d);
          if (j.access_token) resolve(j.access_token);
          else reject(new Error('Token refresh error: ' + d));
        } catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function sendViaGmailApi({ to, subject, html, text }) {
  const token = await getGmailAccessToken();
  const boundary = '----=_Part_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
  const now = new Date().toUTCString();
  const msgId = '<zed-' + Date.now() + '-' + crypto.randomBytes(6).toString('hex') + '@gmail.com>';

  const rawMessage = [
    'From: "Zed" <zedagencyofficial@gmail.com>',
    'To: ' + to,
    'Reply-To: zedagencyofficial@gmail.com',
    'Subject: =?UTF-8?B?' + Buffer.from(subject, 'utf8').toString('base64') + '?=',
    'Date: ' + now,
    'Message-ID: ' + msgId,
    'MIME-Version: 1.0',
    'Content-Type: multipart/alternative; boundary="' + boundary + '"',
    'X-Mailer: Zed Agency CRM Suite',
    'X-Priority: 3',
    'Importance: Normal',
    'List-Unsubscribe: <mailto:zedagencyofficial@gmail.com?subject=unsubscribe>',
    '',
    '--' + boundary,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(text, 'utf8').toString('base64'),
    '',
    '--' + boundary,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(html, 'utf8').toString('base64'),
    '',
    '--' + boundary + '--'
  ].join('\r\n');

  const raw = Buffer.from(rawMessage)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ raw });
    const req = https.request({
      hostname: 'gmail.googleapis.com',
      path: '/gmail/v1/users/me/messages/send',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(d);
          if (j.id) resolve(j);
          else reject(new Error('Send error: ' + d));
        } catch(e) { reject(new Error(d)); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  if (!SMTP_PASS) return null;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_PORT===465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
  return transporter;
}

async function sendLuxuryMail({ to, subject, html, text }) {
  try {
    const res = await sendViaGmailApi({ to, subject, html, text });
    console.log(`[agency] Luxury email delivered via Gmail API to ${to} (id: ${res.id})`);
    return res;
  } catch (e) {
    console.warn('[agency] Gmail API failed, fallback to SMTP:', e.message);
    const tx = getTransporter();
    if (tx) {
      return await tx.sendMail({ from: `"Zed" <${SMTP_USER}>`, to, subject, html, text });
    }
  }
}

async function sendBookedEmail(pg, person, opp) {
  const mail = generateLeadNotificationEmail({ person, opp });
  try {
    await sendLuxuryMail({
      to: EMAIL_TO,
      subject: mail.subject,
      html: mail.html,
      text: mail.text
    });
    console.log(`[agency] Luxury lead notification sent for ${person.id} to ${EMAIL_TO}`);
  } catch (e) {
    console.error('[agency] lead email failed', e.message);
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
    await pg.query(`INSERT INTO ${schema}."calendarEvent" (id, "createdAt","updatedAt", "title", "startsAt","endsAt", "isFullDay", "location", "description", "conferenceSolution", "conferenceLinkPrimaryLinkLabel", "conferenceLinkPrimaryLinkUrl", "isCanceled") VALUES ($1,NOW(),NOW(),$2,$3,$4,false,$5,$6,'googleMeet','','',false)`, [evId, `Booked: ${person.nameFirstName||''} ${person.nameLastName||''} - ${person.companyName||''}`, meetingTime, new Date(new Date(meetingTime).getTime()+60*60*1000).toISOString(), opp?.name||'', `Booked lead ${person.emailsPrimaryEmail||''} ${person.phonesPrimaryPhoneNumber||''} Budget ${opp?.amountAmountMicros||''}`]);
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

const STATUS_DUE = { 'New': 5*24*3600*1000, 'Not Attended': 3*3600*1000, 'Follow Up': 3*3600*1000, 'Scheduled': 1*24*3600*1000, 'Booked': 7*24*3600*1000 };
async function setDueDateSmart(pg, schema, personId, newStatus, existingDue) {
  const interval = STATUS_DUE[newStatus];
  if (!interval) return;
  const newDue = new Date(Date.now() + interval);
  if (!existingDue) {
    await pg.query(`UPDATE ${schema}."person" SET "dueDate"=$1 WHERE id=$2`, [newDue.toISOString(), personId]);
    console.log(`[agency] dueDate set ${newStatus} ${interval/3600000}h for ${personId} -> ${newDue.toISOString()}`);
  } else {
    const existing = new Date(existingDue);
    if (newDue < existing) {
      await pg.query(`UPDATE ${schema}."person" SET "dueDate"=$1 WHERE id=$2`, [newDue.toISOString(), personId]);
      console.log(`[agency] dueDate shortened ${newStatus} for ${personId} ${existing.toISOString()} -> ${newDue.toISOString()}`);
    } else {
      console.log(`[agency] dueDate keep earlier ${existing.toISOString()} vs new ${newDue.toISOString()} for ${personId} (prevent manipulation)`);
    }
  }
}

async function handleNotAttended(pg, schema) {
  try {
    const colCheck = await pg.query(`SELECT 1 FROM information_schema.columns WHERE table_schema=$1 AND table_name='person' AND column_name='leadStatus'`, [schema]);
    if (!colCheck.rows.length) { console.log('[agency] skip Not Attended — leadStatus column missing in', schema); return; }
  } catch {}
  const res = await pg.query(`SELECT id, "nameFirstName","nameLastName","emailsPrimaryEmail","emailsAdditionalEmails","phonesPrimaryPhoneNumber","phonesPrimaryPhoneCountryCode","phonesPrimaryPhoneCallingCode","jobTitle","companyId","leadStatus","updatedAt","assignedToId","dueDate" FROM ${schema}."person" WHERE "leadStatus"='Not Attended' AND "deletedAt" IS NULL`);
  for (const p of res.rows) {
    await setDueDateSmart(pg, schema, p.id, 'Not Attended', p.dueDate);
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
        await pg.query(`INSERT INTO ${schema}."task" (id, "createdAt","updatedAt", title, status, "dueAt", "assigneeId", "emails", "phones", "companyId", "jobTitle") VALUES ($1,NOW(),NOW(),$2,'Not Attended',$3,$4,$5,$6,$7,$8)`, [taskId, title, due, p.assignedToId, p.emailsPrimaryEmail||'', p.phonesPrimaryPhoneNumber||'', p.companyId, p.jobTitle||'']);
      } else {
        await pg.query(`INSERT INTO ${schema}."task" (id, "createdAt","updatedAt", title, status, "dueAt", "assigneeId") VALUES ($1,NOW(),NOW(),$2,'Not Attended',$3,$4)`, [taskId, title, due, p.assignedToId]);
      }
      await pg.query(`INSERT INTO ${schema}."taskTarget" (id, "createdAt","updatedAt", "taskId", "targetPersonId") VALUES ($1,NOW(),NOW(),$2,$3)`, [require('crypto').randomUUID(), taskId, p.id]);
      console.log(`[agency] Not Attended task ${taskId} due ${due} for ${p.id} (mirrored fields)`);
    } else {
      const task = taskExists.rows[0];
      if (new Date(task.dueAt) < new Date() && task.status==='Not Attended') {
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
  const res = await pg.query(`SELECT id, "nameFirstName","emailsPrimaryEmail","phonesPrimaryPhoneNumber","jobTitle","companyId","leadStatus","updatedAt","assignedToId","dueDate" FROM ${schema}."person" WHERE "leadStatus"='Follow Up' AND "deletedAt" IS NULL`);
  for (const p of res.rows) {
    await setDueDateSmart(pg, schema, p.id, 'Follow Up', p.dueDate);
    const taskExists = await pg.query(`SELECT t.id, t."dueAt", t.status FROM ${schema}."task" t JOIN ${schema}."taskTarget" tt ON tt."taskId"=t.id WHERE tt."targetPersonId"=$1 AND t."title" LIKE 'Follow Up:%' AND t."deletedAt" IS NULL ORDER BY t."dueAt" DESC LIMIT 1`, [p.id]);
    if (taskExists.rows.length===0) {
      const taskId = require('crypto').randomUUID();
      const due = new Date(Date.now()+3*3600*1000).toISOString();
      const title = `Follow Up: ${p.nameFirstName||''} ${p.emailsPrimaryEmail||p.id.slice(0,8)}`;
      const hasCols = await pg.query(`SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name='task' AND column_name IN ('emails','phones','jobTitle','companyId')`, [schema]);
      const hasMirrors = hasCols.rows.length >= 4;
      if (hasMirrors) {
        await pg.query(`INSERT INTO ${schema}."task" (id, "createdAt","updatedAt", title, status, "dueAt", "assigneeId", "emails", "phones", "companyId", "jobTitle") VALUES ($1,NOW(),NOW(),$2,'Follow Up',$3,$4,$5,$6,$7,$8)`, [taskId, title, due, p.assignedToId, p.emailsPrimaryEmail||'', p.phonesPrimaryPhoneNumber||'', p.companyId, p.jobTitle||'']);
      } else {
        await pg.query(`INSERT INTO ${schema}."task" (id, "createdAt","updatedAt", title, status, "dueAt", "assigneeId") VALUES ($1,NOW(),NOW(),$2,'Follow Up',$3,$4)`, [taskId, title, due, p.assignedToId]);
      }
      await pg.query(`INSERT INTO ${schema}."taskTarget" (id, "createdAt","updatedAt", "taskId", "targetPersonId") VALUES ($1,NOW(),NOW(),$2,$3)`, [require('crypto').randomUUID(), taskId, p.id]);
      console.log(`[agency] Follow Up task ${taskId} due ${due} for ${p.id} (mirrored)`);
    } else {
      const task = taskExists.rows[0];
      if (new Date(task.dueAt) < new Date() && task.status==='Follow Up') {
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
  const res = await pg.query(`SELECT p.id, p."nameFirstName",p."nameLastName",p."emailsPrimaryEmail",p."emailsAdditionalEmails",p."phonesPrimaryPhoneNumber",p."phonesPrimaryPhoneCountryCode",p."phonesAdditionalPhones",p."jobTitle",p."companyId",p."assignedToId",p."leadStatus", p."updatedAt", p."dueDate" FROM ${schema}."person" p WHERE p."leadStatus"='Scheduled' AND p."deletedAt" IS NULL`);
  for (const p of res.rows) {
    await setDueDateSmart(pg, schema, p.id, 'Scheduled', p.dueDate);
    const oppExists = await pg.query(`SELECT id FROM ${schema}."opportunity" WHERE "pointOfContactId"=$1 AND "deletedAt" IS NULL LIMIT 1`, [p.id]);
    if (oppExists.rows.length===0) {
      const oppId = require('crypto').randomUUID();
      const name = `${p.nameFirstName||''} ${p.nameLastName||''} - Scheduled`.trim() || `Scheduled ${p.emailsPrimaryEmail||p.id.slice(0,8)}`;
      const closeDate = new Date(Date.now()+1*24*3600*1000).toISOString();
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
  const res = await pg.query(`SELECT p.id, p."nameFirstName",p."nameLastName",p."emailsPrimaryEmail",p."phonesPrimaryPhoneNumber",p."jobTitle",p."companyId",p."assignedToId",p."dueDate" FROM ${schema}."person" p WHERE p."leadStatus"='Booked' AND p."deletedAt" IS NULL`);
  for (const p of res.rows) {
    await setDueDateSmart(pg, schema, p.id, 'Booked', p.dueDate);
    const oppExists = await pg.query(`SELECT id, name, "amountAmountMicros","amountCurrencyCode","closeDate" FROM ${schema}."opportunity" WHERE "pointOfContactId"=$1 AND "deletedAt" IS NULL LIMIT 1`, [p.id]);
    let opp = oppExists.rows[0] || null;
    if (!opp) {
      const oppId = require('crypto').randomUUID();
      const name = `${p.nameFirstName||''} ${p.nameLastName||''} - Booked`.trim();
      const closeDate = new Date(Date.now()+7*24*3600*1000).toISOString();
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
  // Keep Rejected in People (per user request: do not remove from People)
  const res = await pg.query(`SELECT id FROM ${schema}."person" WHERE "leadStatus"='Rejected' AND "deletedAt" IS NULL`);
  if (res.rows.length) {
    console.log(`[agency] Rejected kept in People ${res.rows.length} leads (not archived per user request)`);
    // Optionally ensure dueDate not overdue? Keep as is — no deletion
  }
}

async function dedupCheck(pg, schema) {
  // Avoid new leads duplicate existing Rejected (kept in People, not archived): if New has same email as Rejected, mark duplicate
  const dupRes = await pg.query(`
    SELECT n.id as new_id, o.id as old_id, n."emailsPrimaryEmail"
    FROM ${schema}."person" n JOIN ${schema}."person" o ON o."emailsPrimaryEmail" = n."emailsPrimaryEmail" AND o."leadStatus"='Rejected' AND o."deletedAt" IS NULL
    WHERE n."deletedAt" IS NULL AND n."leadStatus"='New' AND n."emailsPrimaryEmail" IS NOT NULL AND n."emailsPrimaryEmail" != '' AND n.id != o.id LIMIT 5
  `);
  for (const d of dupRes.rows) {
    console.log(`[agency] dedup: new ${d.new_id} duplicate of existing Rejected ${d.old_id} email ${d.emailsPrimaryEmail} — marking new as Rejected (kept in People)`);
    await pg.query(`UPDATE ${schema}."person" SET "leadStatus"='Rejected' WHERE id=$1`, [d.new_id]);
  }
}

async function handleAssignedDueDate(pg, schema) {
  try {
    const hasDue = await pg.query(`SELECT 1 FROM information_schema.columns WHERE table_schema=$1 AND table_name='person' AND column_name='dueDate'`, [schema]);
    if (!hasDue.rows.length) return;
    // Set dueDate 5 days from createdAt for newly assigned New leads with no dueDate
    await pg.query(`UPDATE ${schema}."person" SET "dueDate" = "createdAt" + interval '5 days' WHERE "leadStatus"='New' AND "assignedToId" IS NOT NULL AND "dueDate" IS NULL AND "deletedAt" IS NULL`);
    // If 5 days crossed and still New, bump to top (update updatedAt and position to 0)
    const overdue = await pg.query(`SELECT id, "assignedToId", "dueDate", "updatedAt" FROM ${schema}."person" WHERE "leadStatus"='New' AND "assignedToId" IS NOT NULL AND "dueDate" IS NOT NULL AND "dueDate" < NOW() AND "deletedAt" IS NULL LIMIT 10`);
    for (const p of overdue.rows) {
      await pg.query(`UPDATE ${schema}."person" SET "position"=0, "updatedAt"=NOW() WHERE id=$1`, [p.id]);
      console.log(`[agency] overdue 5d bump top ${p.id} due ${p.dueDate}`);
    }
    // If not completed even after 3 days past due (total 8d) and still New, send reminder to member gmail
    const remind = await pg.query(`SELECT p.id, p."nameFirstName", p."nameLastName", p."emailsPrimaryEmail", p."phonesPrimaryPhoneNumber", p."phonesPrimaryPhoneCountryCode", p."companyId", p."leadStatus", p."dueDate", wm."userEmail", wm."nameFirstName" as mFirst FROM ${schema}."person" p JOIN ${schema}."workspaceMember" wm ON wm."id"=p."assignedToId" WHERE p."leadStatus"='New' AND p."dueDate" < NOW() - interval '3 days' AND p."deletedAt" IS NULL LIMIT 5`);
    for (const r of remind.rows) {
      if (!r.userEmail) continue;
      try {
        const dueMail = generateDueDateNotificationEmail({
          person: r,
          memberName: r.mFirst || 'Team Member',
          dueDate: new Date(r.dueDate).toLocaleDateString() + ' (Overdue)',
          isOverdue: true
        });
        await sendLuxuryMail({
          to: r.userEmail,
          subject: dueMail.subject,
          html: dueMail.html,
          text: dueMail.text
        });
        console.log(`[agency] luxury overdue reminder sent to ${r.userEmail} for ${r.id}`);
        await pg.query(`UPDATE ${schema}."person" SET "updatedAt"=NOW() WHERE id=$1`, [r.id]);
      } catch (e) { console.error('[agency] reminder failed', e.message); }
    }
  } catch (e) { console.error('[agency] assignedDueDate error', e.message); }
}

async function handleMeetingStatus(pg, schema) {
  try {
    // Only Meeting status should be in Opportunity; if Opportunity stage != MEETING, move back to appropriate menu based on stage
    // For now, if Opportunity stage is not MEETING and pointOfContact still Scheduled/Booked, keep; otherwise if stage changed to other, log
    // Also ensure every table has dueDate+creationDate visible (already via migration)
  } catch (e) {}
}

async function enforceAdmin(pg, schema) {
  try {
    const wsRes = await pg.query(`SELECT id FROM core."workspace" LIMIT 1`);
    const wsId = wsRes.rows[0]?.id;
    if (!wsId) return;
    // Demote any Admin not in allowlist
    await pg.query(`UPDATE core."roleTarget" SET "roleId" = (SELECT id FROM core."role" WHERE "workspaceId"=$1 AND label='Member' LIMIT 1) WHERE "workspaceId"=$1 AND "roleId" = (SELECT id FROM core."role" WHERE "workspaceId"=$1 AND label='Admin' LIMIT 1) AND "userWorkspaceId" IN (SELECT uw.id FROM core."userWorkspace" uw JOIN core."user" u ON u.id=uw."userId" WHERE u.email NOT IN ('balunithyapriya@gmail.com','zedagencyofficial@gmail.com','bkarthikeyan.cse2025@citchennai.net'))`, [wsId]);
  } catch (e) {}
}

async function pollOnce() {
  let pg;
  try {
    pg = new Client({
      connectionString: PG_URL,
      ssl: (PG_URL.includes('sslmode=require') || PG_URL.includes('neon.tech')) ? { rejectUnauthorized: false } : undefined
    });
    await pg.connect();
    const wsRes = await pg.query(`SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'workspace_%' LIMIT 1`);
    if (!wsRes.rows[0]) { console.log('[agency] no workspace schema'); return; }
    const schema = wsRes.rows[0].schema_name;
    for (const fn of [handleNotAttended, handleFollowUp, handleSchedule, handleBooked, handleRejected, dedupCheck, handleAssignedDueDate, handleMeetingStatus, enforceAdmin]) {
      try { await fn(pg, schema); } catch (e) { console.error('[agency] handler error', fn.name, e.message); }
    }
  } catch (e) {
    console.error('[agency] poll error:', e.message || e);
  } finally {
    if (pg) {
      try { await pg.end(); } catch {}
    }
  }
}

async function main() {
  console.log(`[agency] worker starting poll ${POLL_MS}ms SMTP ${SMTP_USER}->${EMAIL_TO} PG ${PG_URL.replace(/:.+@/,'://***@')}`);
  try { await pollOnce(); } catch (e) { console.error('[agency] initial poll error:', e.message); }
  setInterval(pollOnce, POLL_MS);
}

module.exports = { main, pollOnce };
if (require.main === module) main();

