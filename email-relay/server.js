const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Gmail SMTP transporter (works on Render - open outbound)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: process.env.SMTP_USER || 'zedagencyofficial@gmail.com',
    pass: process.env.SMTP_PASS || 'oeexdvgdgklbyksu'
  }
});

// ✅ Health check / cron ping endpoint (use this URL in cronjob.org)
app.get('/ping', (req, res) => {
  res.json({ status: 'alive', time: new Date().toISOString(), service: 'Zed Email Relay' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/', (req, res) => {
  res.json({ service: 'Zed Email Relay', version: '1.0.0', endpoints: ['/ping', '/health', '/send'] });
});

// 📧 Send email endpoint
// POST /send
// Body: { to, subject, html, text, from (optional) }
app.post('/send', async (req, res) => {
  const { to, subject, html, text, from } = req.body;

  if (!to || !subject || (!html && !text)) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, html/text' });
  }

  const fromAddress = from || `"Zed Agency" <${process.env.SMTP_USER || 'zedagencyofficial@gmail.com'}>`;

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      html: html || `<p>${text}</p>`,
      text: text || ''
    });

    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
    res.json({ success: true, messageId: info.messageId, to });
  } catch (err) {
    console.error(`❌ Email error to ${to}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// 📧 Twenty CRM-compatible invite email endpoint
// POST /invite
// Body: { email, workspaceName, inviteLink, inviterName }
app.post('/invite', async (req, res) => {
  const { email, workspaceName, inviteLink, inviterName } = req.body;

  if (!email || !inviteLink) {
    return res.status(400).json({ error: 'Missing required fields: email, inviteLink' });
  }

  const ws = workspaceName || 'Zed Agency CRM';
  const inviter = inviterName || 'Zed Agency';

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're invited to ${ws}</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,0.08);overflow:hidden;">
        
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);padding:40px 48px 32px;text-align:center;">
            <div style="display:inline-flex;align-items:center;gap:12px;">
              <div style="width:44px;height:44px;background:#e879f9;border-radius:10px;display:inline-block;line-height:44px;text-align:center;font-size:22px;">⚡</div>
              <span style="color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">Zed Agency CRM</span>
            </div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:48px 48px 32px;">
            <h1 style="margin:0 0 16px;font-size:26px;font-weight:700;color:#111827;letter-spacing:-0.5px;">
              You've been invited 🎉
            </h1>
            <p style="margin:0 0 24px;font-size:16px;color:#374151;line-height:1.6;">
              <strong>${inviter}</strong> has invited you to join <strong>${ws}</strong> — a powerful CRM workspace to manage leads, clients, and campaigns together.
            </p>
            
            <!-- CTA Button -->
            <table cellpadding="0" cellspacing="0" style="margin:32px 0;">
              <tr>
                <td style="background:linear-gradient(135deg,#7c3aed,#a855f7);border-radius:8px;padding:0;">
                  <a href="${inviteLink}" style="display:inline-block;padding:16px 40px;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;letter-spacing:0.2px;">
                    Accept Invitation →
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 8px;font-size:14px;color:#6b7280;">
              Or copy and paste this link into your browser:
            </p>
            <p style="margin:0 0 32px;font-size:13px;color:#7c3aed;word-break:break-all;">
              ${inviteLink}
            </p>

            <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 24px;">

            <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">
              This invitation was sent by <strong>${inviter}</strong> via Zed Agency CRM.<br>
              If you didn't expect this, you can safely ignore this email.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:24px 48px;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
              © 2026 Zed Agency CRM · Powered by Twenty CRM<br>
              <a href="https://zedagency.in" style="color:#7c3aed;text-decoration:none;">zedagency.in</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const info = await transporter.sendMail({
      from: `"Zed Agency CRM" <${process.env.SMTP_USER || 'zedagencyofficial@gmail.com'}>`,
      to: email,
      subject: `You've been invited to join ${ws}`,
      html
    });

    console.log(`✅ Invite sent to ${email}: ${info.messageId}`);
    res.json({ success: true, messageId: info.messageId, to: email });
  } catch (err) {
    console.error(`❌ Invite error to ${email}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Zed Email Relay running on port ${PORT}`);
  console.log(`📧 SMTP: ${process.env.SMTP_USER || 'zedagencyofficial@gmail.com'}@smtp.gmail.com:587`);
  console.log(`🏥 Health: http://localhost:${PORT}/ping`);
});
