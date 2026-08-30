const fs = require('fs');

function generateWhiteLuxuryEmailHtml({ inviterName, inviterEmail, workspaceTitle, inviteUrl, roleName }) {
  const isRoleAdmin = (roleName || '').toLowerCase().includes('admin');
  
  const roleBadge = isRoleAdmin
    ? '<span style="background-color: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; font-size: 12px; font-weight: 700; padding: 5px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block;">🛡️ Administrator</span>'
    : '<span style="background-color: #f5f3ff; border: 1px solid #ddd6fe; color: #6d28d9; font-size: 12px; font-weight: 700; padding: 5px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block;">⚡ Team Member</span>';

  const roleTitle = isRoleAdmin ? 'Workspace Administrator' : 'Workspace Team Member';
  
  const roleDescription = isRoleAdmin
    ? 'You will have full administrative authority over workspace settings, security, integrations, client databases, and team management.'
    : 'You will have access to lead discovery, client communication channels, AI assistant, and shared sales pipelines.';

  const rolePerks = isRoleAdmin
    ? '<span style="display:inline-block; margin-right:12px; color:#1e293b; font-size:13px; font-weight:600;">✓ Full Workspace Control</span><span style="display:inline-block; margin-right:12px; color:#1e293b; font-size:13px; font-weight:600;">✓ Lead Discovery &amp; DB</span><span style="display:inline-block; color:#1e293b; font-size:13px; font-weight:600;">✓ Team Management</span>'
    : '<span style="display:inline-block; margin-right:12px; color:#1e293b; font-size:13px; font-weight:600;">✓ Lead Scraper &amp; Finder</span><span style="display:inline-block; margin-right:12px; color:#1e293b; font-size:13px; font-weight:600;">✓ Client Pipelines</span><span style="display:inline-block; color:#1e293b; font-size:13px; font-weight:600;">✓ AI Assistant</span>';

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Invitation to join ${workspaceTitle} on Zed Agency CRM</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #0f172a;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 48px 16px;">
    <tr>
      <td align="center">
        <!-- Main Luxury Card -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 590px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 20px 40px -15px rgba(15, 23, 42, 0.08);">
          
          <!-- Top Gradient Accent Bar -->
          <tr>
            <td style="height: 5px; background: linear-gradient(90deg, #7c3aed 0%, #a855f7 50%, #4f46e5 100%); line-height: 5px; font-size: 5px;">&nbsp;</td>
          </tr>

          <!-- Header Section -->
          <tr>
            <td style="padding: 36px 40px 28px 40px; background-color: #ffffff; border-bottom: 1px solid #f1f5f9;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <table border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); width: 44px; height: 44px; border-radius: 12px; text-align: center; vertical-align: middle; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25);">
                          <span style="color: #ffffff; font-size: 22px; font-weight: 900; line-height: 44px;">⚡</span>
                        </td>
                        <td style="padding-left: 14px;">
                          <div style="color: #0f172a; font-size: 21px; font-weight: 800; letter-spacing: -0.4px; line-height: 1.2;">Zed Agency</div>
                          <div style="color: #64748b; font-size: 12px; font-weight: 500; letter-spacing: 0.2px;">Enterprise Growth &amp; CRM Platform</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right">
                    <span style="background-color: #f8fafc; border: 1px solid #e2e8f0; color: #475569; font-size: 11px; font-weight: 700; padding: 5px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">Official Invitation</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 40px 40px 32px 40px;">
              <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; line-height: 1.3;">
                You've been invited to join <span style="color: #6d28d9;">${workspaceTitle}</span>
              </h1>
              
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                Hello,
              </p>
              
              <p style="margin: 0 0 28px 0; font-size: 15px; line-height: 1.6; color: #334155;">
                <strong style="color: #0f172a;">${inviterName}</strong> (<span style="color: #4f46e5; text-decoration: none;">${inviterEmail}</span>) has invited you to collaborate as an authorized <strong style="color: #0f172a;">${roleTitle}</strong> on the <strong style="color: #0f172a;">${workspaceTitle}</strong> workspace on Zed CRM.
              </p>

              <!-- Position & Workspace Card (White Luxury Box) -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 14px; border: 1px solid #e2e8f0; margin-bottom: 32px;">
                <tr>
                  <td style="padding: 24px 28px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td>
                          <div style="font-size: 11px; font-weight: 700; color: #6d28d9; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px;">Your Assigned Position</div>
                          <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">${roleTitle}</div>
                          <div style="font-size: 13px; color: #475569; line-height: 1.5; margin-bottom: 14px;">${roleDescription}</div>
                          <div style="padding-top: 10px; border-top: 1px solid #e2e8f0;">
                            ${rolePerks}
                          </div>
                        </td>
                        <td align="right" style="vertical-align: top; width: 140px;">
                          ${roleBadge}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Primary Luxury CTA Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 32px;">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #4338ca 100%); color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; padding: 16px 40px; border-radius: 10px; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.25); text-align: center; letter-spacing: -0.2px;">
                      Accept Invitation &amp; Join as ${isRoleAdmin ? 'Admin' : 'Member'} &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Direct Link Fallback Box -->
              <div style="background-color: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; padding: 16px 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #64748b;">
                  If the button above does not open, copy and paste this link in your browser:
                </p>
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #4f46e5; word-break: break-all; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">
                  ${inviteUrl}
                </p>
              </div>

              <!-- Security Notice -->
              <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; font-size: 12px; line-height: 1.6; color: #64748b;">
                🔒 <strong>Security &amp; Expiry:</strong> This official invitation link was generated specifically for you and will expire in 7 days. After accepting, you can sign in directly using your Google account.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #475569;">
                Dispatched securely by <strong style="color: #0f172a;">Zed Agency Enterprise CRM</strong>
              </p>
              <p style="margin: 0; font-size: 11px; color: #64748b;">
                &copy; 2026 Zed Agency Technologies. All rights reserved. &bull; <a href="https://zedagency.in" target="_blank" style="color: #6d28d9; text-decoration: none; font-weight: 600;">zedagency.in</a>
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

module.exports = { generateWhiteLuxuryEmailHtml };
