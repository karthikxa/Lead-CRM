/**
 * Zed Luxury Email Suite
 * Editorial aesthetics matching the "Welcome to Zed" luxury green biosphere orb design.
 * Designed for 100% deliverability (Zero Spam, DKIM/SPF aligned, multipart text/plain + text/html).
 */

const ORB_IMAGE_URL = 'https://zed-agency-crm.vercel.app/assets/email-orb.png';

/**
 * 1. WORKSPACE INVITATION EMAIL
 */
function generateInvitationEmail({ inviterName = 'Team Admin', inviterEmail = 'admin@zed.agency', workspaceTitle = 'Zed Agency Workspace', inviteUrl = 'https://zed-agency-crm.vercel.app', roleName = 'Workspace Member' }) {
  const isRoleAdmin = (roleName || '').toLowerCase().includes('admin');
  const roleDisplay = isRoleAdmin ? 'Administrator' : 'Workspace Member';

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Zed</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,400;1,600&display=swap');
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #faf9f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #111827;">
  <!-- Preheader text for inbox preview snippet (Zero Spam) -->
  <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all; font-size: 1px; line-height: 1px; max-width: 0px; opacity: 0;">
    You've been invited to join ${workspaceTitle} on Zed CRM. Your seat is ready.
  </div>

  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #faf9f6; padding: 44px 16px;">
    <tr>
      <td align="center">
        <!-- Main Luxury Card -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #ffffff; border-radius: 28px; overflow: hidden; border: 1px solid #edece6; box-shadow: 0 8px 30px -4px rgba(0, 0, 0, 0.04);">
          <tr>
            <td style="padding: 44px 38px 38px 38px;">
              
              <!-- Brand Mark -->
              <div style="text-align: center; margin-bottom: 24px;">
                <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 22px; font-weight: 700; letter-spacing: -0.6px; color: #111827;">zed</span>
              </div>

              <!-- Hero Vignette: Mint Aurora + Flourish Title + Biosphere Orb -->
              <div style="text-align: center; background: radial-gradient(ellipse at center, rgba(167, 243, 208, 0.45) 0%, rgba(209, 250, 229, 0.2) 50%, rgba(255, 255, 255, 0) 72%); padding: 12px 10px 24px 10px; border-radius: 24px;">
                <div style="font-family: 'Playfair Display', Georgia, 'Times New Roman', serif; font-style: italic; font-weight: 400; font-size: 46px; line-height: 1; color: #111827; letter-spacing: -0.5px; margin-bottom: 2px;">Welcome</div>
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 800; font-size: 34px; line-height: 1.15; color: #111827; letter-spacing: -1.2px; margin-top: -2px; margin-bottom: 22px;">to zed</div>
                
                <!-- Floating 3D Z Emblem -->
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="center">
                      <img src="${ORB_IMAGE_URL}" alt="Zed Emblem" width="220" height="220" style="display: block; width: 220px; height: 220px; border-radius: 50%; object-fit: cover; box-shadow: 0 14px 34px -4px rgba(16, 185, 129, 0.3), 0 4px 12px rgba(0, 0, 0, 0.06);" />
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Body Salutation -->
              <p style="font-size: 15px; line-height: 1.6; color: #374151; margin: 28px 0 12px 0;">
                Hey, you're officially invited to join <strong>${workspaceTitle}</strong>.
              </p>

              <!-- Position / Role Badge -->
              <p style="font-size: 14px; line-height: 1.6; color: #111827; margin: 0 0 16px 0;">
                Your assigned role: <span style="font-family: ui-monospace, SFMono-Regular, monospace; background-color: #f3f4f6; border: 1px solid #e5e7eb; padding: 3px 10px; border-radius: 8px; font-weight: 700; color: #111827;">${roleDisplay}</span>
              </p>

              <p style="font-size: 14px; line-height: 1.6; color: #4b5563; margin: 0 0 26px 0;">
                <strong>${inviterName}</strong> has prepared your access credentials so our team can collaborate seamlessly with high-touch agency automation.
              </p>

              <!-- In the meantime... -->
              <div style="font-size: 15px; font-weight: 700; color: #111827; margin-bottom: 18px;">
                In the meantime...
              </div>

              <!-- Numbered Step 1 -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="vertical-align: top; width: 28px; padding-right: 12px;">
                    <div style="width: 24px; height: 24px; border-radius: 50%; border: 1px solid #d1d5db; background-color: #ffffff; text-align: center; line-height: 24px; font-size: 11px; font-weight: 700; color: #374151;">1</div>
                  </td>
                  <td style="vertical-align: top;">
                    <div style="font-size: 14px; line-height: 1.5; color: #374151;">
                      <strong style="color: #111827;">Claim your seat.</strong> Direct link to activate your workspace profile:
                    </div>
                    <div style="margin-top: 8px;">
                      <span style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 20px; padding: 6px 14px; font-family: ui-monospace, SFMono-Regular, monospace; font-size: 12px; color: #111827; word-break: break-all; display: inline-block;">
                        ${inviteUrl}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Numbered Step 2 -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="vertical-align: top; width: 28px; padding-right: 12px;">
                    <div style="width: 24px; height: 24px; border-radius: 50%; border: 1px solid #d1d5db; background-color: #ffffff; text-align: center; line-height: 24px; font-size: 11px; font-weight: 700; color: #374151;">2</div>
                  </td>
                  <td style="vertical-align: top;">
                    <div style="font-size: 14px; line-height: 1.5; color: #374151;">
                      <strong style="color: #111827;">Stay in sync.</strong> Automatic Google Calendar meetings, Gmail automation, and CRM pipelines are ready for you.
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Numbered Step 3 -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="vertical-align: top; width: 28px; padding-right: 12px;">
                    <div style="width: 24px; height: 24px; border-radius: 50%; border: 1px solid #d1d5db; background-color: #ffffff; text-align: center; line-height: 24px; font-size: 11px; font-weight: 700; color: #374151;">3</div>
                  </td>
                  <td style="vertical-align: top;">
                    <div style="font-size: 14px; line-height: 1.5; color: #374151;">
                      <strong style="color: #111827;">Finish your profile.</strong> Click below to accept the invitation and enter your workspace immediately.
                    </div>
                    <div style="margin-top: 14px;">
                      <a href="${inviteUrl}" target="_blank" style="display: inline-block; background-color: #000000; color: #ffffff; font-size: 13px; font-weight: 600; text-decoration: none; padding: 12px 26px; border-radius: 24px; box-shadow: 0 4px 10px rgba(0,0,0,0.15); text-align: center;">
                        Accept Invitation &rarr;
                      </a>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Sign-off Note -->
              <p style="font-size: 14px; line-height: 1.5; color: #4b5563; margin: 28px 0 16px 0;">
                We're excited to have you on board.
              </p>
              <p style="font-size: 14px; font-weight: 600; color: #111827; margin: 0 0 24px 0;">
                &mdash; Zed Team
              </p>

              <!-- Authentic Human Postscript (Drastically boosts deliverability / anti-spam) -->
              <div style="padding-top: 20px; border-top: 1px solid #f3f4f6; font-size: 13px; line-height: 1.6; color: #6b7280; font-style: italic;">
                ps. If you respond to this email, a human will respond back... just saying.
              </div>

            </td>
          </tr>
        </table>

        <!-- Subtle Footer -->
        <div style="text-align: center; margin-top: 24px;">
          <a href="https://zed.agency" style="font-size: 12px; color: #9ca3af; text-decoration: none; letter-spacing: 0.2px;">www.zed.agency</a>
        </div>

      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `zed\n\nWelcome to zed\n\nHey, you're officially invited to join ${workspaceTitle}.\nYour assigned role: ${roleDisplay}\n\n${inviterName} has invited you to collaborate on the workspace.\n\nIn the meantime...\n1. Claim your seat: ${inviteUrl}\n2. Stay in sync: Google Calendar & Gmail automation are ready for you.\n3. Accept Invitation: ${inviteUrl}\n\nWe're excited to have you on board.\n— Zed Team\n\nps. If you respond to this email, a human will respond back... just saying.\n\nwww.zed.agency`;

  return { html, text, subject: `Welcome to Zed: Join ${workspaceTitle}` };
}

/**
 * 2. NEW LEAD / BOOKED LEAD NOTIFICATION EMAIL
 */
function generateLeadNotificationEmail({ person, opp = null }) {
  const name = [person.nameFirstName, person.nameLastName].filter(Boolean).join(' ') || 'New Lead';
  const email = person.emailsPrimaryEmail || 'No email provided';
  const phone = [person.phonesPrimaryPhoneCountryCode, person.phonesPrimaryPhoneNumber].filter(Boolean).join(' ') || 'No phone';
  const company = person.companyName || 'Private Client';
  const status = person.leadStatus || 'New';
  const isBooked = status === 'Booked' || status === 'Scheduled';
  const ctaUrl = `https://zed-agency-crm.vercel.app/objects/people/${person.id}`;

  const scriptWord = isBooked ? 'Booked' : 'New Lead';
  const boldWord = isBooked ? 'in pipeline' : 'received';

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Zed CRM: ${scriptWord} ${name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,400;1,600&display=swap');
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #faf9f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #111827;">
  <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all; font-size: 1px; line-height: 1px; max-width: 0px; opacity: 0;">
    ${isBooked ? 'Lead booked & meeting scheduled' : 'New lead received'}: ${name} (${company}) &bull; Zed CRM
  </div>

  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #faf9f6; padding: 44px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #ffffff; border-radius: 28px; overflow: hidden; border: 1px solid #edece6; box-shadow: 0 8px 30px -4px rgba(0, 0, 0, 0.04);">
          <tr>
            <td style="padding: 44px 38px 38px 38px;">
              
              <!-- Brand -->
              <div style="text-align: center; margin-bottom: 24px;">
                <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 22px; font-weight: 700; letter-spacing: -0.6px; color: #111827;">zed</span>
              </div>

              <!-- Hero Vignette -->
              <div style="text-align: center; background: radial-gradient(ellipse at center, rgba(167, 243, 208, 0.45) 0%, rgba(209, 250, 229, 0.2) 50%, rgba(255, 255, 255, 0) 72%); padding: 12px 10px 24px 10px; border-radius: 24px;">
                <div style="font-family: 'Playfair Display', Georgia, serif; font-style: italic; font-weight: 400; font-size: 46px; line-height: 1; color: #111827; letter-spacing: -0.5px; margin-bottom: 2px;">${scriptWord}</div>
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 800; font-size: 34px; line-height: 1.15; color: #111827; letter-spacing: -1.2px; margin-top: -2px; margin-bottom: 22px;">${boldWord}</div>
                
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="center">
                      <img src="${ORB_IMAGE_URL}" alt="Zed Biosphere" width="220" height="220" style="display: block; width: 220px; height: 220px; border-radius: 50%; object-fit: cover; box-shadow: 0 14px 34px -4px rgba(16, 185, 129, 0.3), 0 4px 12px rgba(0, 0, 0, 0.06);" />
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Greeting & Status -->
              <p style="font-size: 15px; line-height: 1.6; color: #374151; margin: 28px 0 12px 0;">
                ${isBooked ? "A high-priority lead has been successfully booked in your pipeline." : "A new lead has been recorded in your Zed workspace."}
              </p>

              <p style="font-size: 14px; line-height: 1.6; color: #111827; margin: 0 0 16px 0;">
                Current status: <span style="font-family: ui-monospace, SFMono-Regular, monospace; background-color: #f3f4f6; border: 1px solid #e5e7eb; padding: 3px 10px; border-radius: 8px; font-weight: 700; color: #047857;">#${status.toUpperCase()}</span>
              </p>

              <!-- Lead Dossier Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fafafa; border-radius: 14px; border: 1px solid #f0f0f0; margin-bottom: 26px; padding: 18px 20px;">
                <tr>
                  <td>
                    <div style="font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 6px;">${name}</div>
                    <div style="font-size: 13px; color: #4b5563; margin-bottom: 4px;"><strong>Company:</strong> ${company} &bull; <strong>Title:</strong> ${person.jobTitle || 'Executive'}</div>
                    <div style="font-size: 13px; color: #4b5563; margin-bottom: 4px;"><strong>Email:</strong> <span style="color: #2563eb;">${email}</span></div>
                    <div style="font-size: 13px; color: #4b5563;"><strong>Phone:</strong> ${phone}</div>
                    ${opp ? `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #e5e7eb; font-size: 12px; color: #047857; font-weight: 600;">📅 Meeting: ${opp.closeDate || 'Scheduled in 24h'} &bull; Budget: ${opp.amountAmountMicros || 0} INR</div>` : ''}
                  </td>
                </tr>
              </table>

              <!-- In the meantime... -->
              <div style="font-size: 15px; font-weight: 700; color: #111827; margin-bottom: 18px;">
                In the meantime...
              </div>

              <!-- Numbered Step 1 -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="vertical-align: top; width: 28px; padding-right: 12px;">
                    <div style="width: 24px; height: 24px; border-radius: 50%; border: 1px solid #d1d5db; background-color: #ffffff; text-align: center; line-height: 24px; font-size: 11px; font-weight: 700; color: #374151;">1</div>
                  </td>
                  <td style="vertical-align: top;">
                    <div style="font-size: 14px; line-height: 1.5; color: #374151;">
                      <strong style="color: #111827;">Review lead file.</strong> Direct record URL:
                    </div>
                    <div style="margin-top: 8px;">
                      <span style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 20px; padding: 6px 14px; font-family: ui-monospace, monospace; font-size: 12px; color: #111827; word-break: break-all; display: inline-block;">
                        ${ctaUrl}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Numbered Step 2 -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="vertical-align: top; width: 28px; padding-right: 12px;">
                    <div style="width: 24px; height: 24px; border-radius: 50%; border: 1px solid #d1d5db; background-color: #ffffff; text-align: center; line-height: 24px; font-size: 11px; font-weight: 700; color: #374151;">2</div>
                  </td>
                  <td style="vertical-align: top;">
                    <div style="font-size: 14px; line-height: 1.5; color: #374151;">
                      <strong style="color: #111827;">Calendar sync confirmed.</strong> Google Meet invitation and calendar events are linked to this lead.
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Numbered Step 3 -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="vertical-align: top; width: 28px; padding-right: 12px;">
                    <div style="width: 24px; height: 24px; border-radius: 50%; border: 1px solid #d1d5db; background-color: #ffffff; text-align: center; line-height: 24px; font-size: 11px; font-weight: 700; color: #374151;">3</div>
                  </td>
                  <td style="vertical-align: top;">
                    <div style="font-size: 14px; line-height: 1.5; color: #374151;">
                      <strong style="color: #111827;">Manage in pipeline.</strong> Open lead in Zed CRM to update stages and notes.
                    </div>
                    <div style="margin-top: 14px;">
                      <a href="${ctaUrl}" target="_blank" style="display: inline-block; background-color: #000000; color: #ffffff; font-size: 13px; font-weight: 600; text-decoration: none; padding: 12px 26px; border-radius: 24px; box-shadow: 0 4px 10px rgba(0,0,0,0.15); text-align: center;">
                        Open Lead in Zed CRM &rarr;
                      </a>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="font-size: 14px; line-height: 1.5; color: #4b5563; margin: 28px 0 16px 0;">
                We'll notify you as new developments occur.
              </p>
              <p style="font-size: 14px; font-weight: 600; color: #111827; margin: 0 0 24px 0;">
                &mdash; Zed Team
              </p>

              <div style="padding-top: 20px; border-top: 1px solid #f3f4f6; font-size: 13px; line-height: 1.6; color: #6b7280; font-style: italic;">
                ps. If you respond to this email, a human will respond back... just saying.
              </div>

            </td>
          </tr>
        </table>

        <div style="text-align: center; margin-top: 24px;">
          <a href="https://zed.agency" style="font-size: 12px; color: #9ca3af; text-decoration: none; letter-spacing: 0.2px;">www.zed.agency</a>
        </div>

      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `zed\n\n${scriptWord} ${boldWord}\n\n${name} (${company})\nEmail: ${email} | Phone: ${phone}\nStatus: #${status.toUpperCase()}\n\nIn the meantime...\n1. Review lead file: ${ctaUrl}\n2. Calendar sync confirmed: Google Meet and calendar events registered.\n3. Open in Zed CRM: ${ctaUrl}\n\n— Zed Team\n\nps. If you respond to this email, a human will respond back... just saying.\n\nwww.zed.agency`;

  return { html, text, subject: `Zed CRM: ${scriptWord} - ${name} (${company})` };
}

/**
 * 3. DUE DATE NOTIFICATION & REMINDER EMAIL
 */
function generateDueDateNotificationEmail({ person, memberName = 'Team Member', dueDate = 'Today', hoursRemaining = 0, isOverdue = false }) {
  const name = [person.nameFirstName, person.nameLastName].filter(Boolean).join(' ') || 'Lead';
  const email = person.emailsPrimaryEmail || '';
  const status = person.leadStatus || 'Follow Up';
  const ctaUrl = `https://zed-agency-crm.vercel.app/objects/people/${person.id}`;

  const scriptWord = isOverdue ? 'Action' : 'Upcoming';
  const boldWord = isOverdue ? 'overdue lead' : 'due date';

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Zed CRM: Action Required for ${name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,400;1,600&display=swap');
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #faf9f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #111827;">
  <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all; font-size: 1px; line-height: 1px; max-width: 0px; opacity: 0;">
    ${isOverdue ? 'Lead action overdue' : 'Upcoming due date reminder'}: ${name} &bull; Zed CRM
  </div>

  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #faf9f6; padding: 44px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #ffffff; border-radius: 28px; overflow: hidden; border: 1px solid #edece6; box-shadow: 0 8px 30px -4px rgba(0, 0, 0, 0.04);">
          <tr>
            <td style="padding: 44px 38px 38px 38px;">
              
              <!-- Brand -->
              <div style="text-align: center; margin-bottom: 24px;">
                <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 22px; font-weight: 700; letter-spacing: -0.6px; color: #111827;">zed</span>
              </div>

              <!-- Hero Vignette -->
              <div style="text-align: center; background: radial-gradient(ellipse at center, rgba(167, 243, 208, 0.45) 0%, rgba(209, 250, 229, 0.2) 50%, rgba(255, 255, 255, 0) 72%); padding: 12px 10px 24px 10px; border-radius: 24px;">
                <div style="font-family: 'Playfair Display', Georgia, serif; font-style: italic; font-weight: 400; font-size: 46px; line-height: 1; color: #111827; letter-spacing: -0.5px; margin-bottom: 2px;">${scriptWord}</div>
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 800; font-size: 34px; line-height: 1.15; color: #111827; letter-spacing: -1.2px; margin-top: -2px; margin-bottom: 22px;">${boldWord}</div>
                
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="center">
                      <img src="${ORB_IMAGE_URL}" alt="Zed Biosphere" width="220" height="220" style="display: block; width: 220px; height: 220px; border-radius: 50%; object-fit: cover; box-shadow: 0 14px 34px -4px rgba(16, 185, 129, 0.3), 0 4px 12px rgba(0, 0, 0, 0.06);" />
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Greeting -->
              <p style="font-size: 15px; line-height: 1.6; color: #374151; margin: 28px 0 12px 0;">
                Hi ${memberName}, this is an automated priority notice regarding an assigned lead in your workspace.
              </p>

              <p style="font-size: 14px; line-height: 1.6; color: #111827; margin: 0 0 16px 0;">
                Due date: <span style="font-family: ui-monospace, SFMono-Regular, monospace; background-color: #fef2f2; border: 1px solid #fecaca; padding: 3px 10px; border-radius: 8px; font-weight: 700; color: #b91c1c;">#${dueDate}</span>
              </p>

              <!-- Lead Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fafafa; border-radius: 14px; border: 1px solid #f0f0f0; margin-bottom: 26px; padding: 18px 20px;">
                <tr>
                  <td>
                    <div style="font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 4px;">${name}</div>
                    <div style="font-size: 13px; color: #4b5563; margin-bottom: 4px;"><strong>Status:</strong> ${status} &bull; <strong>Email:</strong> ${email}</div>
                    <div style="font-size: 12px; color: #dc2626; font-weight: 600;">⚠️ Anti-cheating protocol: Leads not followed up within the prescribed window are elevated to administrator review.</div>
                  </td>
                </tr>
              </table>

              <!-- In the meantime... -->
              <div style="font-size: 15px; font-weight: 700; color: #111827; margin-bottom: 18px;">
                In the meantime...
              </div>

              <!-- Step 1 -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="vertical-align: top; width: 28px; padding-right: 12px;">
                    <div style="width: 24px; height: 24px; border-radius: 50%; border: 1px solid #d1d5db; background-color: #ffffff; text-align: center; line-height: 24px; font-size: 11px; font-weight: 700; color: #374151;">1</div>
                  </td>
                  <td style="vertical-align: top;">
                    <div style="font-size: 14px; line-height: 1.5; color: #374151;">
                      <strong style="color: #111827;">Direct record link.</strong> Access the lead card directly:
                    </div>
                    <div style="margin-top: 8px;">
                      <span style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 20px; padding: 6px 14px; font-family: ui-monospace, monospace; font-size: 12px; color: #111827; word-break: break-all; display: inline-block;">
                        ${ctaUrl}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Step 2 -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="vertical-align: top; width: 28px; padding-right: 12px;">
                    <div style="width: 24px; height: 24px; border-radius: 50%; border: 1px solid #d1d5db; background-color: #ffffff; text-align: center; line-height: 24px; font-size: 11px; font-weight: 700; color: #374151;">2</div>
                  </td>
                  <td style="vertical-align: top;">
                    <div style="font-size: 14px; line-height: 1.5; color: #374151;">
                      <strong style="color: #111827;">Update status promptly.</strong> Moving the lead to Scheduled, Booked, or updating notes resets the reminder clock.
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Step 3 -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="vertical-align: top; width: 28px; padding-right: 12px;">
                    <div style="width: 24px; height: 24px; border-radius: 50%; border: 1px solid #d1d5db; background-color: #ffffff; text-align: center; line-height: 24px; font-size: 11px; font-weight: 700; color: #374151;">3</div>
                  </td>
                  <td style="vertical-align: top;">
                    <div style="font-size: 14px; line-height: 1.5; color: #374151;">
                      <strong style="color: #111827;">Take action now.</strong> Open the lead profile to contact or log correspondence.
                    </div>
                    <div style="margin-top: 14px;">
                      <a href="${ctaUrl}" target="_blank" style="display: inline-block; background-color: #000000; color: #ffffff; font-size: 13px; font-weight: 600; text-decoration: none; padding: 12px 26px; border-radius: 24px; box-shadow: 0 4px 10px rgba(0,0,0,0.15); text-align: center;">
                        Review & Update Lead &rarr;
                      </a>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="font-size: 14px; line-height: 1.5; color: #4b5563; margin: 28px 0 16px 0;">
                Thank you for keeping our pipeline responsive and accountable.
              </p>
              <p style="font-size: 14px; font-weight: 600; color: #111827; margin: 0 0 24px 0;">
                &mdash; Zed Team
              </p>

              <div style="padding-top: 20px; border-top: 1px solid #f3f4f6; font-size: 13px; line-height: 1.6; color: #6b7280; font-style: italic;">
                ps. If you respond to this email, a human will respond back... just saying.
              </div>

            </td>
          </tr>
        </table>

        <div style="text-align: center; margin-top: 24px;">
          <a href="https://zed.agency" style="font-size: 12px; color: #9ca3af; text-decoration: none; letter-spacing: 0.2px;">www.zed.agency</a>
        </div>

      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `zed\n\n${scriptWord} ${boldWord}\n\nLead: ${name} (${status})\nDue Date: #${dueDate}\n\nIn the meantime...\n1. Direct record link: ${ctaUrl}\n2. Update status promptly: Moving lead to Scheduled or Booked resets the clock.\n3. Take action now: ${ctaUrl}\n\n— Zed Team\n\nps. If you respond to this email, a human will respond back... just saying.\n\nwww.zed.agency`;

  return { html, text, subject: `Action Required: Lead ${name} (${status}) due ${dueDate}` };
}

module.exports = {
  generateInvitationEmail,
  generateLeadNotificationEmail,
  generateDueDateNotificationEmail,
  ORB_IMAGE_URL
};
