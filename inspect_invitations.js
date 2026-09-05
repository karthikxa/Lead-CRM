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
  `);
  console.log('Invitations in DB for karthik28:', res.rows);

  const wsRes = await client.query(`
    SELECT id, "displayName", "inviteHash" FROM core."workspace" LIMIT 5
  `);
  console.log('Workspaces:', wsRes.rows);

  if (res.rows.length > 0) {
    const invite = res.rows[0];
    const ws = wsRes.rows[0];
    const inviteLink = `http://localhost:3000/invite/${ws.inviteHash}?inviteToken=${invite.value}&email=karthik28home@gmail.com`;
    console.log('Real Invitation Link:', inviteLink);

    // Send this real invitation link via Gmail SMTP!
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
      from: 'Zed Agency <zedagencyofficial@gmail.com>',
      to: 'karthik28home@gmail.com',
      subject: 'Join your team on Zed',
      text: `You have been invited to join the Zed Agency workspace on Zed CRM.\n\nClick the link below to accept the invitation and activate your account:\n\n${inviteLink}\n\nThis invitation link expires in 30 days.`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb;">
          <div style="margin-bottom: 24px;">
            <h2 style="color: #111827; margin: 0 0 8px 0; font-size: 22px; font-weight: 700;">Join your team on Zed</h2>
            <p style="color: #4b5563; font-size: 15px; margin: 0; line-height: 1.5;">You've been invited to join the <strong>${ws.displayName || 'Zed Agency'}</strong> workspace.</p>
          </div>
          <div style="margin: 28px 0;">
            <a href="${inviteLink}" style="display: inline-block; background: #111827; color: #ffffff; padding: 12px 28px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 15px;">Accept Invitation &rarr;</a>
          </div>
          <p style="color: #6b7280; font-size: 13px; margin: 24px 0 0 0; line-height: 1.4;">Or copy and paste this link into your browser:<br/><a href="${inviteLink}" style="color: #2563eb; word-break: break-all;">${inviteLink}</a></p>
        </div>
      `
    });

    console.log('Real Invitation Email Dispatched Successfully! Message ID:', info.messageId);
  }

  await client.end();
}

main().catch(console.error);
