const nodemailer = require('nodemailer');
async function test() {
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
    from: 'Zed <zedagencyofficial@gmail.com>',
    to: 'karthik28home@gmail.com',
    subject: 'Join your team on Zed',
    text: 'You have been invited to join the Zed Agency CRM workspace: http://localhost:3000',
    html: '<p>You have been invited to join the <strong>Zed Agency CRM</strong> workspace.</p><p><a href="http://localhost:3000">Click here to join</a></p>'
  });
  console.log('Email sent successfully! MessageId:', info.messageId);
}
test().catch(console.error);
