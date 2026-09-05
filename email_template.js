const fs = require('fs');
const path = require('path');

function generateLuxuryEmailHtml({ inviterName, inviterEmail, workspaceTitle, inviteUrl }) {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>You're invited to join ${workspaceTitle} on Zed Agency CRM</title>
  <!--[if mso]>
  <style>
    table {border-collapse:collapse;border-spacing:0;margin:0;}
    div, td {padding:0;}
    div {margin:0 !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #f1f5f9;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 48px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #111827; border-radius: 16px; overflow: hidden; border: 1px solid #1f2937; box-shadow: 0 20px 40px -15px rgba(0,0,0,0.6);">
          
          <!-- Top Accent Gradient Bar -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #8b5cf6 0%, #ec4899 50%, #3b82f6 100%); line-height: 4px; font-size: 4px;">&nbsp;</td>
          </tr>

          <!-- Header Section -->
          <tr>
            <td style="padding: 36px 40px 28px 40px; background: #111827; border-bottom: 1px solid #1f2937;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <!-- Brand Badge -->
                    <table border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="background: linear-gradient(135deg, #8b5cf6, #6d28d9); width: 38px; height: 38px; border-radius: 10px; text-align: center; vertical-align: middle;">
                          <span style="color: #ffffff; font-size: 18px; font-weight: 900; line-height: 38px;">⚡</span>
                        </td>
                        <td style="padding-left: 14px;">
                          <div style="color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: -0.4px; line-height: 1.2;">Zed Agency</div>
                          <div style="color: #94a3b8; font-size: 12px; font-weight: 500; letter-spacing: 0.2px;">Enterprise CRM & Growth Platform</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right">
                    <span style="background: rgba(139, 92, 246, 0.15); border: 1px solid rgba(139, 92, 246, 0.3); color: #c4b5fd; font-size: 11px; font-weight: 700; padding: 5px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.6px;">Official Invitation</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 40px 40px 32px 40px;">
              <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; line-height: 1.3;">
                You've been invited to join <span style="color: #c4b5fd;">${workspaceTitle}</span>
              </h1>
              
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
                Hello,
              </p>
              
              <p style="margin: 0 0 28px 0; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
                <strong style="color: #ffffff;">${inviterName}</strong> (<span style="color: #93c5fd;">${inviterEmail}</span>) has invited you to collaborate as an authorized member on the <strong style="color: #ffffff;">${workspaceTitle}</strong> workspace on Zed CRM.
              </p>

              <!-- Workspace Info Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #1a2234; border-radius: 12px; border: 1px solid #2d3748; margin-bottom: 32px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td>
                          <div style="font-size: 11px; font-weight: 700; color: #818cf8; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px;">Workspace Details</div>
                          <div style="font-size: 16px; font-weight: 700; color: #ffffff;">${workspaceTitle}</div>
                          <div style="font-size: 13px; color: #94a3b8; margin-top: 4px;">Assigned Role: <strong style="color: #38bdf8;">Full Workspace Member</strong></div>
                        </td>
                        <td align="right" style="vertical-align: middle;">
                          <div style="background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.3); color: #4ade80; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 8px;">● Active Workspace</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Primary CTA Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 32px;">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #4c1d95 100%); color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; padding: 16px 40px; border-radius: 10px; box-shadow: 0 10px 25px -5px rgba(124, 58, 237, 0.5); text-align: center; letter-spacing: -0.2px;">
                      Accept Invitation & Join Workspace &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Direct Link Fallback -->
              <div style="background-color: #0d131f; border-radius: 10px; border: 1px solid #1f2937; padding: 16px 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #94a3b8;">
                  If the button above does not work, copy and paste this link in your browser:
                </p>
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #60a5fa; word-break: break-all; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">
                  ${inviteUrl}
                </p>
              </div>

              <!-- Security Notice -->
              <div style="border-top: 1px solid #1f2937; padding-top: 20px; font-size: 12px; line-height: 1.6; color: #64748b;">
                🔒 <strong>Security & Expiry:</strong> This secure invitation was generated specifically for you and will expire in 7 days. Once enrolled, you can sign in directly using your Google account.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #0d131f; border-top: 1px solid #1f2937; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #94a3b8;">
                Dispatched securely by <strong style="color: #cbd5e1;">Zed Agency CRM Suite</strong>
              </p>
              <p style="margin: 0; font-size: 11px; color: #64748b;">
                &copy; 2026 Zed Agency Technologies. All rights reserved. &bull; <a href="https://zedagency.in" target="_blank" style="color: #a78bfa; text-decoration: none;">zedagency.in</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

module.exports = { generateLuxuryEmailHtml };
