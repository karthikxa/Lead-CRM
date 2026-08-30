const { Client } = require('pg');
const nodemailer = require('nodemailer');

async function main() {
  const client = new Client({
    connectionString: process.env.PG_DATABASE_URL || 'postgres://twenty:twenty@db:5432/default'
  });
  await client.connect();

  const res = await client.query(`
    SELECT id, type, value, context, "expiresAt", "workspaceId" 
    FROM core."appToken" 
    WHERE context->>'email' ILIKE '%karthik28%'
    ORDER BY "createdAt" DESC LIMIT 1
  `);

  const wsRes = await client.query(`
    SELECT id, "displayName", "inviteHash" FROM core."workspace" LIMIT 1
  `);

  const invite = res.rows[0];
  const ws = wsRes.rows[0];
  const inviteLink = `http://localhost:3000/invite/${ws.inviteHash}?inviteToken=${invite ? invite.value : 'direct'}&email=karthik28home@gmail.com`;

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'zedagencyofficial@gmail.com',
      pass: 'oeexdvgdgklbyksu'
    }
  });

  const info = await transporter.sendMail({
    from: '"Zed Agency" <zedagencyofficial@gmail.com>',
    to: 'karthik28home@gmail.com',
    replyTo: 'zedagencyofficial@gmail.com',
    subject: 'Welcome to Zed Agency CRM — Your Workspace Invitation',
    text: `Hello,\n\nYou have been invited to join the ${ws.displayName || 'Zed Agency'} workspace on Zed CRM.\n\nClick the link below to accept your invitation:\n${inviteLink}\n\n© ${new Date().getFullYear()} Zed Agency Inc. All rights reserved.`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Join Zed Agency CRM</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 48px 16px;">
          <tr>
            <td align="center">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                <!-- Header with Clean Zed Logo -->
                <tr>
                  <td style="padding: 36px 36px 20px 36px;">
                    <table border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="background-color: #0f172a; width: 44px; height: 44px; border-radius: 10px; text-align: center; vertical-align: middle;">
                          <span style="color: #ffffff; font-size: 24px; font-weight: 800; line-height: 44px; font-family: system-ui, -apple-system, sans-serif;">Z</span>
                        </td>
                        <td style="padding-left: 14px;">
                          <span style="color: #0f172a; font-size: 21px; font-weight: 700; letter-spacing: -0.5px;">Zed Agency</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Body Content -->
                <tr>
                  <td style="padding: 10px 36px 32px 36px; color: #334155; font-size: 15px; line-height: 24px;">
                    <h1 style="color: #0f172a; font-size: 22px; font-weight: 700; margin: 0 0 16px 0; letter-spacing: -0.4px;">You're invited to join the workspace</h1>
                    <p style="margin: 0 0 16px 0; color: #475569;">Hello,</p>
                    <p style="margin: 0 0 24px 0; color: #475569;">You have been invited to collaborate with your team in the <strong>Zed Agency CRM</strong> workspace. Click the button below to accept your invitation and activate your account.</p>
                    <!-- CTA Button -->
                    <table border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                      <tr>
                        <td align="center" style="border-radius: 8px; background-color: #0f172a;">
                          <a href="${inviteLink}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; background-color: #0f172a;">Accept Invitation &rarr;</a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 24px 0 8px 0; font-size: 13px; color: #64748b; line-height: 20px;">Button not working? Copy and paste this link into your browser:<br/>
                      <a href="${inviteLink}" style="color: #2563eb; word-break: break-all; text-decoration: underline;">${inviteLink}</a>
                    </p>
                  </td>
                </tr>
                <!-- Divider -->
                <tr>
                  <td style="border-top: 1px solid #f1f5f9; padding: 0 36px;"></td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="padding: 24px 36px; background-color: #fafafa; color: #94a3b8; font-size: 12px; line-height: 18px;">
                    <p style="margin: 0 0 6px 0;">This invitation was sent to <strong style="color: #64748b;">karthik28home@gmail.com</strong> by Zed Agency.</p>
                    <p style="margin: 0;">&copy; ${new Date().getFullYear()} Zed Agency Inc. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    headers: {
      'X-Mailer': 'Zed Agency CRM Mailer',
      'X-Priority': '3',
      'List-Unsubscribe': '<mailto:zedagencyofficial@gmail.com?subject=unsubscribe>'
    }
  });

  console.log('Company-grade invitation dispatched! MessageId:', info.messageId);
  await client.end();
}

main().catch(console.error);
