const express = require('express');
const nodemailer = require('nodemailer');
const https = require('https');
const http = require('http');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enable CORS for CRM frontend & all origins
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Gmail SMTP transporter - try 587 STARTTLS
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: process.env.SMTP_USER || 'zedagencyofficial@gmail.com',
    pass: process.env.SMTP_PASS || 'oeexdvgdgklbyksu'
  },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 20000
});

// Also create SSL fallback on port 465
const transporter465 = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // SSL
  auth: {
    user: process.env.SMTP_USER || 'zedagencyofficial@gmail.com',
    pass: process.env.SMTP_PASS || 'oeexdvgdgklbyksu'
  },
  connectionTimeout: 15000,
  socketTimeout: 20000
});

// Helper: try both ports
async function sendMailWithFallback(mailOptions) {
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[SMTP 587] Sent:', info.messageId);
    return info;
  } catch (err587) {
    console.warn('[SMTP 587] Failed:', err587.message, '— trying port 465...');
    try {
      const info = await transporter465.sendMail(mailOptions);
      console.log('[SMTP 465] Sent:', info.messageId);
      return info;
    } catch (err465) {
      throw new Error(`Both ports failed. 587: ${err587.message} | 465: ${err465.message}`);
    }
  }
}

// SMTP diagnostic endpoint
app.get('/debug/smtp', async (req, res) => {
  const results = {};
  try {
    await transporter.verify();
    results.port587 = 'OK';
  } catch (e) {
    results.port587 = 'FAIL: ' + e.message;
  }
  try {
    await transporter465.verify();
    results.port465 = 'OK';
  } catch (e) {
    results.port465 = 'FAIL: ' + e.message;
  }
  results.smtpUser = process.env.SMTP_USER || 'zedagencyofficial@gmail.com';
  res.json(results);
});


// LLM Gateway Target (FreeLLMAPI backend)
const LLM_TARGET_HOST = 'server-llm-1-0r64.onrender.com';
const DEFAULT_LLM_KEY = process.env.OPENAI_API_KEY || 'freellmapi-b8b35f76a87a2e3db4985258c26197a2f22ceabe528eb6ac';

// ==========================================
// 1. KEEPALIVE & STATUS (FOR CRONJOB.ORG)
// ==========================================
app.get('/ping', (req, res) => {
  res.json({
    status: 'alive',
    time: new Date().toISOString(),
    service: 'Zed All-in-One Cloud Bridge (Email + LLM AI Gateway)',
    features: ['smtp_relay', 'invitations', 'llm_openai_gateway', 'cron_keepalive']
  });
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/', (req, res) => {
  res.json({
    service: 'Zed All-in-One Cloud Bridge',
    version: '2.0.0',
    endpoints: {
      cron_keepalive: 'GET /ping',
      health: 'GET /health',
      send_email: 'POST /send',
      send_invite: 'POST /invite',
      llm_models: 'GET /v1/models',
      llm_chat: 'POST /v1/chat/completions',
      quick_ai: 'POST /api/chat'
    }
  });
});

// ==========================================
// 2. EMAIL RELAY ENDPOINTS (GMAIL SMTP)
// ==========================================

// Generic email send
app.post('/send', async (req, res) => {
  const { to, subject, html, text, from } = req.body;
  if (!to || !subject || (!html && !text)) {
    return res.status(400).json({ error: 'Missing required: to, subject, and html/text' });
  }
  try {
    const info = await sendMailWithFallback({
      from: from || `"Zed Agency" <${process.env.SMTP_USER || 'zedagencyofficial@gmail.com'}>`,
      to,
      subject,
      html: html || `<p>${text}</p>`,
      text: text || ''
    });
    console.log(`[Email] Sent to ${to}: ${info.messageId}`);
    res.json({ success: true, messageId: info.messageId, to });
  } catch (err) {
    console.error(`[Email Error] ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// Styled corporate invite email
app.post('/invite', async (req, res) => {
  const { email, workspaceName, inviteLink, inviterName, role } = req.body;
  if (!email || !inviteLink) {
    return res.status(400).json({ error: 'Missing required: email and inviteLink' });
  }
  const ws = workspaceName || 'Zed Agency CRM';
  const inviter = inviterName || 'Zed Agency';
  const userRole = role || 'Member';

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>You're invited to join ${ws}</title>
</head>
<body style="margin:0;padding:0;background:#0d1117;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif;color:#c9d1d9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1117;padding:40px 16px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#161b22;border:1px solid #30363d;border-radius:14px;overflow:hidden;box-shadow:0 12px 32px rgba(0,0,0,0.45);">
        <!-- Header Brand -->
        <tr>
          <td style="background:linear-gradient(135deg,#1f242c 0%,#0d1117 100%);padding:36px 40px 28px;border-bottom:1px solid #30363d;text-align:center;">
            <div style="display:inline-flex;align-items:center;gap:12px;">
              <span style="background:linear-gradient(135deg,#e879f9,#c084fc);color:#0d1117;font-weight:900;font-size:20px;padding:8px 14px;border-radius:10px;display:inline-block;">⚡</span>
              <span style="color:#f0f6fc;font-size:22px;font-weight:700;letter-spacing:-0.4px;">Zed Agency CRM</span>
            </div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 44px 32px;">
            <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.4px;">
              Workspace Invitation 🎉
            </h1>
            <p style="margin:0 0 20px;font-size:15px;color:#8b949e;line-height:1.6;">
              <strong style="color:#f0f6fc;">${inviter}</strong> has invited you to collaborate on <strong style="color:#e879f9;">${ws}</strong> as an <span style="background:#21262d;color:#79c0ff;padding:2px 8px;border-radius:6px;font-size:13px;border:1px solid #388bfd40;">${userRole}</span>.
            </p>
            
            <p style="margin:0 0 32px;font-size:14px;color:#8b949e;line-height:1.6;">
              Access customer pipelines, verified leads, Google Maps scraping campaigns, and AI intelligence in one real-time workspace.
            </p>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" style="margin:24px 0 32px;">
              <tr>
                <td style="background:linear-gradient(135deg,#a855f7,#7c3aed);border-radius:8px;box-shadow:0 4px 14px rgba(168,85,247,0.35);">
                  <a href="${inviteLink}" style="display:inline-block;padding:15px 36px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.2px;">
                    Accept Invitation & Join →
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 8px;font-size:13px;color:#6e7681;">Or copy this direct link:</p>
            <p style="margin:0 0 32px;font-size:12px;color:#a855f7;word-break:break-all;background:#0d1117;padding:12px;border-radius:8px;border:1px solid #21262d;">
              ${inviteLink}
            </p>

            <hr style="border:none;border-top:1px solid #21262d;margin:0 0 20px;">
            <p style="margin:0;font-size:12px;color:#6e7681;line-height:1.5;">
              Sent by ${inviter} via Zed Agency CRM · Single workspace security enabled.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0d1117;padding:20px 44px;border-top:1px solid #21262d;text-align:center;">
            <p style="margin:0;font-size:12px;color:#484f58;">
              © 2026 Zed Agency · <a href="https://zedagency.in" style="color:#a855f7;text-decoration:none;">zedagency.in</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const info = await sendMailWithFallback({
      from: `"Zed Agency CRM" <${process.env.SMTP_USER || 'zedagencyofficial@gmail.com'}>`,
      to: email,
      subject: `You've been invited to join ${ws}`,
      html
    });
    console.log(`[Invite] Sent to ${email}: ${info.messageId}`);
    res.json({ success: true, messageId: info.messageId, to: email });
  } catch (err) {
    console.error(`[Invite Error] ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. LLM AI GATEWAY (OPENAI-COMPATIBLE PROXY)
// ==========================================

// Forward OpenAI /v1/models
app.get('/v1/models', (req, res) => {
  const authHeader = req.headers['authorization'] || `Bearer ${DEFAULT_LLM_KEY}`;
  
  const options = {
    hostname: LLM_TARGET_HOST,
    path: '/v1/models',
    method: 'GET',
    headers: {
      'Authorization': authHeader,
      'Accept': 'application/json',
      'User-Agent': 'Zed-Cloud-Bridge/2.0'
    }
  };

  const proxyReq = https.request(options, (proxyRes) => {
    res.status(proxyRes.statusCode);
    for (const [key, val] of Object.entries(proxyRes.headers)) {
      res.setHeader(key, val);
    }
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('[LLM Proxy Models Error]', err.message);
    res.status(502).json({ error: 'LLM Gateway error: ' + err.message });
  });

  proxyReq.end();
});

// Forward OpenAI /v1/chat/completions (Full Streaming + Non-Streaming)
app.post('/v1/chat/completions', (req, res) => {
  const authHeader = req.headers['authorization'] || `Bearer ${DEFAULT_LLM_KEY}`;
  const bodyPayload = JSON.stringify(req.body);

  const options = {
    hostname: LLM_TARGET_HOST,
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(bodyPayload),
      'User-Agent': 'Zed-Cloud-Bridge/2.0'
    }
  };

  const proxyReq = https.request(options, (proxyRes) => {
    res.status(proxyRes.statusCode);
    for (const [key, val] of Object.entries(proxyRes.headers)) {
      res.setHeader(key, val);
    }
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('[LLM Proxy Chat Error]', err.message);
    res.status(502).json({ error: 'LLM Gateway error: ' + err.message });
  });

  proxyReq.write(bodyPayload);
  proxyReq.end();
});

// Quick AI Chat helper for CRM frontend widgets
app.post('/api/chat', (req, res) => {
  const { message, history, model } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message required' });
  }

  const messages = [
    { role: 'system', content: 'You are Zed AI, an ultra-fast CRM assistant helping the team manage leads, client communication, and deal pipelines.' },
    ...(history || []),
    { role: 'user', content: message }
  ];

  const payload = JSON.stringify({
    model: model || 'auto',
    messages,
    temperature: 0.7
  });

  const options = {
    hostname: LLM_TARGET_HOST,
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DEFAULT_LLM_KEY}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  const proxyReq = https.request(options, (proxyRes) => {
    let data = '';
    proxyRes.on('data', chunk => data += chunk);
    proxyRes.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        const reply = parsed.choices?.[0]?.message?.content || 'No response generated.';
        res.json({ reply, raw: parsed });
      } catch (e) {
        res.status(500).json({ error: 'Failed parsing LLM response', raw: data });
      }
    });
  });

  proxyReq.on('error', (err) => {
    res.status(502).json({ error: err.message });
  });

  proxyReq.write(payload);
  proxyReq.end();
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Zed All-in-One Cloud Bridge running on port ${PORT}`);
  console.log(`📧 SMTP: ${process.env.SMTP_USER || 'zedagencyofficial@gmail.com'}@smtp.gmail.com:587`);
  console.log(`🤖 LLM Proxy -> https://${LLM_TARGET_HOST}/v1`);
  console.log(`🏥 Cron Health Keepalive: http://localhost:${PORT}/ping`);
});
