const { Daytona } = require('@daytona/sdk');

async function testDispatchWhiteLuxury() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  console.log('Sending real White Luxury test invitation email via Gmail API...');
  const sendRes = await sb.process.executeCommand(`
    docker exec zed-server-1 node -e "
      const { EmailService } = require('/app/packages/twenty-server/dist/engine/core-modules/email/email.service.js');
      const { generateWhiteLuxuryEmailHtml } = require('/tmp/patch_white_luxury.js');
      
      const inviterName = 'Karthik B';
      const inviterEmail = 'balunithyapriya@gmail.com';
      const workspaceTitle = 'Karthik';
      const inviteUrl = 'https://3000-4d061288-0d39-4f80-a4ba-cd6c65d9598c.daytonaproxy01.net/invite/3bd5034a-236d-4f39-a56a-7e55fb171667?inviteToken=72d1d17686b84a5e651592547e8b90f68d379881cc6f5cc8d16ef2dbe06912&email=bkarthikeyan.cse2025%40citchennai.net';
      const roleName = 'Admin';
      
      const isRoleAdmin = true;
      const roleTitle = 'Administrator';
      const roleBadge = '<span style=\"background-color: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; font-size: 11px; font-weight: 700; padding: 5px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block;\">🛡️ Administrator</span>';
      const roleDesc = 'You will have full administrative authority over workspace settings, security, integrations, client databases, and team management.';
      const rolePerks = '<span style=\"display:inline-block; margin-right:12px; color:#1e293b; font-size:13px; font-weight:600;\">✓ Full Workspace Control</span><span style=\"display:inline-block; margin-right:12px; color:#1e293b; font-size:13px; font-weight:600;\">✓ Lead Discovery &amp; DB</span><span style=\"display:inline-block; color:#1e293b; font-size:13px; font-weight:600;\">✓ Team Management</span>';
      
      const html = \`<!DOCTYPE html>
<html lang=\"en\">
<head>
  <meta charset=\"utf-8\">
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
  <title>Invitation to join \${workspaceTitle} on Zed Agency CRM</title>
</head>
<body style=\"margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #0f172a;\">
  <table width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"background-color: #f1f5f9; padding: 48px 16px;\">
    <tr>
      <td align=\"center\">
        <table width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width: 590px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 20px 40px -15px rgba(15, 23, 42, 0.08);\">
          <tr>
            <td style=\"height: 5px; background: linear-gradient(90deg, #7c3aed 0%, #a855f7 50%, #4f46e5 100%); line-height: 5px; font-size: 5px;\">&nbsp;</td>
          </tr>
          <tr>
            <td style=\"padding: 36px 40px 28px 40px; background-color: #ffffff; border-bottom: 1px solid #f1f5f9;\">
              <table width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">
                <tr>
                  <td>
                    <table border=\"0\" cellspacing=\"0\" cellpadding=\"0\">
                      <tr>
                        <td style=\"background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); width: 44px; height: 44px; border-radius: 12px; text-align: center; vertical-align: middle; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25);\">
                          <span style=\"color: #ffffff; font-size: 22px; font-weight: 900; line-height: 44px;\">⚡</span>
                        </td>
                        <td style=\"padding-left: 14px;\">
                          <div style=\"color: #0f172a; font-size: 21px; font-weight: 800; letter-spacing: -0.4px; line-height: 1.2;\">Zed Agency</div>
                          <div style=\"color: #64748b; font-size: 12px; font-weight: 500; letter-spacing: 0.2px;\">Enterprise Growth &amp; CRM Platform</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align=\"right\">
                    <span style=\"background-color: #f8fafc; border: 1px solid #e2e8f0; color: #475569; font-size: 11px; font-weight: 700; padding: 5px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;\">Official Invitation</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style=\"padding: 40px 40px 32px 40px;\">
              <h1 style=\"margin: 0 0 16px 0; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; line-height: 1.3;\">
                You've been invited to join <span style=\"color: #6d28d9;\">\${workspaceTitle}</span>
              </h1>
              <p style=\"margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #475569;\">
                Hello,
              </p>
              <p style=\"margin: 0 0 28px 0; font-size: 15px; line-height: 1.6; color: #334155;\">
                <strong style=\"color: #0f172a;\">\${inviterName}</strong> (<span style=\"color: #4f46e5;\">\${inviterEmail}</span>) has invited you to collaborate as an authorized <strong style=\"color: #0f172a;\">\${roleTitle}</strong> on the <strong style=\"color: #0f172a;\">\${workspaceTitle}</strong> workspace on Zed CRM.
              </p>
              <table width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"background-color: #f8fafc; border-radius: 14px; border: 1px solid #e2e8f0; margin-bottom: 32px;\">
                <tr>
                  <td style=\"padding: 24px 28px;\">
                    <table width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">
                      <tr>
                        <td>
                          <div style=\"font-size: 11px; font-weight: 700; color: #6d28d9; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px;\">Your Assigned Position</div>
                          <div style=\"font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 6px;\">\${roleTitle}</div>
                          <div style=\"font-size: 13px; color: #475569; line-height: 1.5; margin-bottom: 14px;\">\${roleDesc}</div>
                          <div style=\"padding-top: 10px; border-top: 1px solid #e2e8f0;\">
                            \${rolePerks}
                          </div>
                        </td>
                        <td align=\"right\" style=\"vertical-align: top; width: 140px;\">
                          \${roleBadge}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"margin-bottom: 32px;\">
                <tr>
                  <td align=\"center\">
                    <a href=\"\${inviteUrl}\" target=\"_blank\" style=\"display: inline-block; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #4338ca 100%); color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; padding: 16px 40px; border-radius: 10px; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.25); text-align: center; letter-spacing: -0.2px;\">
                      Accept Invitation &amp; Join as \${roleTitle} &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <div style=\"background-color: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; padding: 16px 20px; margin-bottom: 24px;\">
                <p style=\"margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #64748b;\">
                  If the button above does not open, copy and paste this link in your browser:
                </p>
                <p style=\"margin: 0; font-size: 12px; line-height: 1.5; color: #4f46e5; word-break: break-all; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;\">
                  \${inviteUrl}
                </p>
              </div>
              <div style=\"border-top: 1px solid #f1f5f9; padding-top: 20px; font-size: 12px; line-height: 1.6; color: #64748b;\">
                🔒 <strong>Security &amp; Expiry:</strong> This official invitation link was generated specifically for you and will expire in 7 days. After accepting, you can sign in directly using your Google account.
              </div>
            </td>
          </tr>
          <tr>
            <td style=\"padding: 24px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;\">
              <p style=\"margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #475569;\">
                Dispatched securely by <strong style=\"color: #0f172a;\">Zed Agency Enterprise CRM</strong>
              </p>
              <p style=\"margin: 0; font-size: 11px; color: #64748b;\">
                &copy; 2026 Zed Agency Technologies. All rights reserved. &bull; <a href=\"https://zedagency.in\" target=\"_blank\" style=\"color: #6d28d9; text-decoration: none; font-weight: 600;\">zedagency.in</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>\`;

      const es = new EmailService({ add: () => {} });
      es.send({
        to: 'bkarthikeyan.cse2025@citchennai.net',
        subject: '⚡ Invitation: Join ' + workspaceTitle + ' as ' + roleTitle + ' · Zed Agency CRM',
        html,
        text: 'You have been invited to join ' + workspaceTitle + ' as ' + roleTitle + ' on Zed Agency CRM: ' + inviteUrl
      }).then(() => console.log('✅ White Luxury Invitation Delivered!'))
        .catch(console.error);
    "
  `);
  console.log('Dispatch result:\n', sendRes.result);

  const health = await sb.process.executeCommand('curl -s -i http://localhost:3000/healthz');
  console.log('Healthz:\n', health.result);
}

testDispatchWhiteLuxury().catch(console.error);
