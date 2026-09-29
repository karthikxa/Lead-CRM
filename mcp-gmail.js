const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Load nodemailer
let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  try {
    nodemailer = require('c:/Users/balur/node_modules/nodemailer');
  } catch (err) {}
}

// Load env credentials from zed/.env
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const idx = trimmed.indexOf('=');
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}
loadEnv();

function getTransporter() {
  const host = process.env.EMAIL_SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.EMAIL_SMTP_PORT, 10) || 465;
  const user = process.env.EMAIL_SMTP_USER || process.env.EMAIL_FROM_ADDRESS;
  const pass = process.env.EMAIL_SMTP_PASSWORD;

  if (!pass) {
    throw new Error('EMAIL_SMTP_PASSWORD not configured. Please set your Gmail App Password.');
  }

  return nodemailer.createTransport({
    host: host,
    port: port,
    secure: port === 465,
    auth: { user, pass }
  });
}

const TOOLS = [
  {
    name: 'gmail_send_email',
    description: 'Send an email through Gmail / SMTP to one or multiple recipients.',
    inputSchema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Recipient email address' },
        subject: { type: 'string', description: 'Subject of the email' },
        body: { type: 'string', description: 'Plain text body of the email' },
        html: { type: 'string', description: 'Optional HTML body of the email' }
      },
      required: ['to', 'subject', 'body']
    }
  },
  {
    name: 'gmail_verify_connection',
    description: 'Verify the SMTP connection to Gmail.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'gmail_create_draft',
    description: 'Preview or prepare an email draft before sending.',
    inputSchema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Recipient email address' },
        subject: { type: 'string', description: 'Subject line' },
        body: { type: 'string', description: 'Email body text' }
      },
      required: ['to', 'subject', 'body']
    }
  }
];

async function handleToolCall(name, args) {
  if (name === 'gmail_verify_connection') {
    const transporter = getTransporter();
    await transporter.verify();
    return {
      content: [{
        type: 'text',
        text: `✓ Gmail SMTP connection verified successfully for ${process.env.EMAIL_SMTP_USER || process.env.EMAIL_FROM_ADDRESS}`
      }]
    };
  }

  if (name === 'gmail_send_email') {
    const transporter = getTransporter();
    const fromName = process.env.EMAIL_FROM_NAME || 'Zed';
    const fromUser = process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_SMTP_USER;

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromUser}>`,
      to: args.to,
      subject: args.subject,
      text: args.body,
      html: args.html || undefined
    });

    return {
      content: [{
        type: 'text',
        text: `✓ Email sent successfully to ${args.to}!\nMessage ID: ${info.messageId}\nResponse: ${info.response}`
      }]
    };
  }

  if (name === 'gmail_create_draft') {
    return {
      content: [{
        type: 'text',
        text: `✓ Draft ready to send:\nTo: ${args.to}\nSubject: ${args.subject}\nBody: ${args.body}`
      }]
    };
  }

  throw new Error(`Unknown tool: ${name}`);
}

// JSON-RPC stdio loop
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + '\n');
}

rl.on('line', async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  try {
    const req = JSON.parse(trimmed);

    if (req.method === 'initialize') {
      send({
        jsonrpc: '2.0',
        id: req.id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'gmail',
            version: '1.0.0'
          }
        }
      });
      return;
    }

    if (req.method === 'notifications/initialized') {
      return;
    }

    if (req.method === 'tools/list') {
      send({
        jsonrpc: '2.0',
        id: req.id,
        result: {
          tools: TOOLS
        }
      });
      return;
    }

    if (req.method === 'tools/call') {
      const { name, arguments: toolArgs } = req.params || {};
      try {
        const res = await handleToolCall(name, toolArgs || {});
        send({
          jsonrpc: '2.0',
          id: req.id,
          result: res
        });
      } catch (err) {
        send({
          jsonrpc: '2.0',
          id: req.id,
          result: {
            isError: true,
            content: [{
              type: 'text',
              text: `Error executing ${name}: ${err.message}`
            }]
          }
        });
      }
      return;
    }

    if (req.id !== undefined) {
      send({
        jsonrpc: '2.0',
        id: req.id,
        result: {}
      });
    }
  } catch (err) {}
});
