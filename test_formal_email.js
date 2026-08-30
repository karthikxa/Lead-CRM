const nodemailer = require('nodemailer');

async function testEmail() {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'zedagencyofficial@gmail.com',
      pass: 'oeexdvgdgklbyksu'
    }
  });

  const workspaceTitle = "Lead";
  const inviterName = "Karthikeyan (Zed Agency)";
  const inviteUrl = "http://localhost:3000/invite/sample-token";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Workspace Invitation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #172b4d;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f5f7; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(9, 30, 66, 0.08); border: 1px solid #e1e4e8;">
          <tr>
            <td style="padding: 32px 40px 24px 40px; background: #0f172a; text-align: left;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="display: inline-block; background: #2563eb; width: 36px; height: 36px; border-radius: 8px; text-align: center; line-height: 36px; color: #ffffff; font-weight: 800; font-size: 20px; vertical-align: middle;">Z</div>
                    <span style="color: #ffffff; font-size: 18px; font-weight: 700; letter-spacing: -0.2px; margin-left: 12px; vertical-align: middle;">Zed Agency</span>
                  </td>
                  <td align="right">
                    <span style="background: rgba(255,255,255,0.12); color: #38bdf8; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">Enterprise CRM</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 40px 32px 40px;">
              <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #0f172a; line-height: 1.3;">
                You've been invited to join <strong>${workspaceTitle}</strong>
              </h1>
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #334155;">
                Hello,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #334155;">
                <strong>${inviterName}</strong> has invited you to collaborate as a team member on the <strong>${workspaceTitle}</strong> enterprise workspace on Zed CRM.
              </p>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Workspace Details</div>
                    <div style="font-size: 15px; font-weight: 600; color: #0f172a;">${workspaceTitle}</div>
                    <div style="font-size: 13px; color: #64748b; margin-top: 2px;">Access Level: <strong>Full Workspace Member</strong></div>
                  </td>
                </tr>
              </table>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}" target="_blank" style="display: inline-block; background-color: #0f172a; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 36px; border-radius: 6px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); text-align: center;">
                      Accept Invitation & Join Workspace &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 12px 0; font-size: 13px; line-height: 1.5; color: #64748b;">
                If the button above does not work, copy and paste this secure link into your browser:
              </p>
              <p style="margin: 0 0 28px 0; font-size: 12px; line-height: 1.5; color: #2563eb; word-break: break-all; background: #f1f5f9; padding: 10px 14px; border-radius: 6px; font-family: ui-monospace, monospace;">
                ${inviteUrl}
              </p>
              <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 12px; line-height: 1.5; color: #64748b;">
                <strong>Security Notice:</strong> This invitation link is unique to you and will expire in 7 days. If you were not expecting this invitation, you can safely disregard this email.
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #64748b;">
                Sent securely by <strong>Zed Agency Enterprise CRM</strong>
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                &copy; 2026 Zed Agency Inc. All rights reserved. &bull; <a href="https://zed.agency" style="color: #64748b; text-decoration: underline;">zed.agency</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const info = await transporter.sendMail({
    from: '"Zed Agency" <zedagencyofficial@gmail.com>',
    to: 'karthik28home@gmail.com',
    subject: `[Invitation] Join ${workspaceTitle} on Zed CRM`,
    html,
    headers: {
      'X-Entity-Ref-ID': 'workspace-invitation-' + Date.now(),
      'X-Priority': '1'
    }
  });

  console.log('Sample Formal Email Sent Successfully! Message ID:', info.messageId);
}

testEmail().catch(console.error);
