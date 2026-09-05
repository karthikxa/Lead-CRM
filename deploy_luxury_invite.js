const { Daytona } = require('@daytona/sdk');
const { generateLuxuryEmailHtml } = require('./email_template');

async function patchInvitationService() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  console.log('1. Patching workspace-invitation.service.js on Daytona...');
  const patchRes = await sb.process.executeCommand(`
    docker exec zed-server-1 node -e "
const fs = require('fs');
const p = '/app/packages/twenty-server/dist/engine/core-modules/workspace-invitation/services/workspace-invitation.service.js';
let c = fs.readFileSync(p, 'utf8');

// Replace any Twenty references in message objects
c = c.replace(/message:\\s*\\\"Join your team on Twenty\\\"/g, 'message: \\\"You\\'ve been invited to join Zed Agency CRM\\\"');
c = c.replace(/message:\\s*\\\"Join your team on Zed\\\"/g, 'message: \\\"You\\'ve been invited to join Zed Agency CRM\\\"');
c = c.replace(/\\(via Twenty\\)/g, '(via Zed Agency)');
c = c.replace(/Twenty CRM/gi, 'Zed Agency CRM');

// Replace the subject and email dispatch inside the loop
c = c.replace(/const subject = i18n\\._\\(joinTeamMsg\\);/g, 'const subject = \\\\\`⚡ You\\'ve been invited to join \\\\\${workspaceTitle || \\'Zed Agency CRM\\'}\\\\\`;');

// Inject the luxury HTML template
const luxuryTemplateStr = \`
const inviterName = [sender.name?.firstName, sender.name?.lastName].filter(Boolean).join(' ') || sender.userEmail || 'Zed Agency Admin';
const workspaceTitle = workspace.displayName || 'Zed Agency Workspace';
const inviteUrl = link.toString();

const html = \\\`<!DOCTYPE html>
<html lang=\\\"en\\\">
<head>
  <meta charset=\\\"utf-8\\\">
  <meta name=\\\"viewport\\\" content=\\\"width=device-width, initial-scale=1.0\\\">
  <title>You're invited to join \\\${workspaceTitle} on Zed Agency CRM</title>
</head>
<body style=\\\"margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;\\\">
  <table width=\\\"100%\\\" border=\\\"0\\\" cellspacing=\\\"0\\\" cellpadding=\\\"0\\\" style=\\\"background-color: #0b0f19; padding: 40px 16px;\\\">
    <tr>
      <td align=\\\"center\\\">
        <table width=\\\"100%\\\" border=\\\"0\\\" cellspacing=\\\"0\\\" cellpadding=\\\"0\\\" style=\\\"max-width: 580px; background-color: #111827; border-radius: 16px; overflow: hidden; border: 1px solid #1f2937; box-shadow: 0 20px 40px -15px rgba(0,0,0,0.6);\\\">
          <tr>
            <td style=\\\"height: 4px; background: linear-gradient(90deg, #8b5cf6 0%, #ec4899 50%, #3b82f6 100%); font-size: 4px; line-height: 4px;\\\"></td>
          </tr>
          <tr>
            <td style=\\\"padding: 32px 36px 24px; background: #111827; border-bottom: 1px solid #1f2937;\\\">
              <table width=\\\"100%\\\" border=\\\"0\\\" cellspacing=\\\"0\\\" cellpadding=\\\"0\\\">
                <tr>
                  <td>
                    <table border=\\\"0\\\" cellspacing=\\\"0\\\" cellpadding=\\\"0\\\">
                      <tr>
                        <td style=\\\"background: linear-gradient(135deg, #8b5cf6, #6d28d9); width: 36px; height: 36px; border-radius: 10px; text-align: center; vertical-align: middle;\\\">
                          <span style=\\\"color: #ffffff; font-size: 18px; font-weight: 900;\\\">⚡</span>
                        </td>
                        <td style=\\\"padding-left: 12px;\\\">
                          <div style=\\\"color: #ffffff; font-size: 19px; font-weight: 800; letter-spacing: -0.3px;\\\">Zed Agency</div>
                          <div style=\\\"color: #94a3b8; font-size: 11px; font-weight: 500;\\\">Enterprise CRM Platform</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align=\\\"right\\\">
                    <span style=\\\"background: rgba(139, 92, 246, 0.15); border: 1px solid rgba(139, 92, 246, 0.3); color: #c4b5fd; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;\\\">Official Invitation</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style=\\\"padding: 36px 36px 28px;\\\">
              <h1 style=\\\"margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.4px; line-height: 1.3;\\\">
                You've been invited to join <span style=\\\"color: #c4b5fd;\\\">\\\${workspaceTitle}</span>
              </h1>
              <p style=\\\"margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #cbd5e1;\\\">
                Hello,
              </p>
              <p style=\\\"margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #cbd5e1;\\\">
                <strong style=\\\"color: #ffffff;\\\">\\\${inviterName}</strong> (<span style=\\\"color: #93c5fd;\\\">\\\${sender.userEmail}</span>) has invited you to collaborate as an authorized member on the <strong style=\\\"color: #ffffff;\\\">\\\${workspaceTitle}</strong> workspace on Zed CRM.
              </p>
              <table width=\\\"100%\\\" border=\\\"0\\\" cellspacing=\\\"0\\\" cellpadding=\\\"0\\\" style=\\\"background-color: #1a2234; border-radius: 10px; border: 1px solid #2d3748; margin-bottom: 28px;\\\">
                <tr>
                  <td style=\\\"padding: 16px 20px;\\\">
                    <table width=\\\"100%\\\" border=\\\"0\\\" cellspacing=\\\"0\\\" cellpadding=\\\"0\\\">
                      <tr>
                        <td>
                          <div style=\\\"font-size: 11px; font-weight: 700; color: #818cf8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;\\\">Workspace Details</div>
                          <div style=\\\"font-size: 15px; font-weight: 700; color: #ffffff;\\\">\\\${workspaceTitle}</div>
                          <div style=\\\"font-size: 12px; color: #94a3b8; margin-top: 2px;\\\">Role: <strong style=\\\"color: #38bdf8;\\\">Full Workspace Member</strong></div>
                        </td>
                        <td align=\\\"right\\\" style=\\\"vertical-align: middle;\\\">
                          <span style=\\\"background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.3); color: #4ade80; font-size: 11px; font-weight: 600; padding: 4px 8px; border-radius: 6px;\\\">● Active</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table width=\\\"100%\\\" border=\\\"0\\\" cellspacing=\\\"0\\\" cellpadding=\\\"0\\\" style=\\\"margin-bottom: 28px;\\\">
                <tr>
                  <td align=\\\"center\\\">
                    <a href=\\\"\\\${inviteUrl}\\\" target=\\\"_blank\\\" style=\\\"display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #4c1d95 100%); color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; padding: 15px 36px; border-radius: 8px; box-shadow: 0 8px 20px -4px rgba(124, 58, 237, 0.5); text-align: center;\\\">
                      Accept Invitation & Join Workspace &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <div style=\\\"background-color: #0d131f; border-radius: 8px; border: 1px solid #1f2937; padding: 14px 16px; margin-bottom: 20px;\\\">
                <p style=\\\"margin: 0 0 6px 0; font-size: 11px; font-weight: 600; color: #94a3b8;\\\">
                  Direct Link:
                </p>
                <p style=\\\"margin: 0; font-size: 11px; line-height: 1.4; color: #60a5fa; word-break: break-all; font-family: monospace;\\\">
                  \\\${inviteUrl}
                </p>
              </div>
              <div style=\\\"border-top: 1px solid #1f2937; padding-top: 16px; font-size: 11px; line-height: 1.5; color: #64748b;\\\">
                🔒 <strong>Security Notice:</strong> This invitation is unique to you and will expire in 7 days. Once accepted, you can sign in directly using your Google account.
              </div>
            </td>
          </tr>
          <tr>
            <td style=\\\"padding: 20px 36px; background-color: #0d131f; border-top: 1px solid #1f2937; text-align: center;\\\">
              <p style=\\\"margin: 0 0 4px 0; font-size: 11px; font-weight: 600; color: #94a3b8;\\\">
                Dispatched securely by <strong style=\\\"color: #cbd5e1;\\\">Zed Agency CRM</strong>
              </p>
              <p style=\\\"margin: 0; font-size: 11px; color: #64748b;\\\">
                &copy; 2026 Zed Agency Technologies &bull; <a href=\\\"https://zedagency.in\\\" target=\\\"_blank\\\" style=\\\"color: #a78bfa; text-decoration: none;\\\">zedagency.in</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>\\\`;
\`;

c = c.replace(/const inviterName = \[sender\\.name\\?\\.firstName.*?const html = \\\`<!DOCTYPE html>.*?<\\/html>\\\`;/s, luxuryTemplateStr);

fs.writeFileSync(p, c, 'utf8');
console.log('workspace-invitation.service.js updated with luxury Zed template!');
"
  `);
  console.log('Patch result:\n', patchRes.result);

  console.log('2. Copying updated email.service.patched.js...');
  const fileContent = fs.readFileSync('c:\\Users\\balur\\Downloads\\CRM Agency\\zed\\email.service.patched.js', 'utf8');
  await sb.process.executeCommand(`
    docker exec zed-server-1 node -e "
      const fs = require('fs');
      fs.writeFileSync('/app/packages/twenty-server/dist/engine/core-modules/email/email.service.js', ${JSON.stringify(fileContent)}, 'utf8');
      console.log('email.service.js updated with clean base64 MIME formatting!');
    "
    docker restart zed-server-1
  `);

  console.log('3. Waiting for server restart...');
  await new Promise(r => setTimeout(r, 18000));

  const health = await sb.process.executeCommand('curl -s -i http://localhost:3000/healthz');
  console.log('Healthz:\n', health.result);
}

patchInvitationService().catch(console.error);
