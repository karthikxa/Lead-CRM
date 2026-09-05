const { Daytona } = require('@daytona/sdk');

async function fixEmailConfig() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  // Step 1: Test if port 587 is reachable (STARTTLS - more commonly open)
  console.log('Testing outbound SMTP ports...');
  const port465 = await sb.process.executeCommand('timeout 5 bash -c "cat < /dev/null > /dev/tcp/smtp.gmail.com/465" && echo "465 OPEN" || echo "465 BLOCKED"');
  const port587 = await sb.process.executeCommand('timeout 5 bash -c "cat < /dev/null > /dev/tcp/smtp.gmail.com/587" && echo "587 OPEN" || echo "587 BLOCKED"');
  const port2525 = await sb.process.executeCommand('timeout 5 bash -c "cat < /dev/null > /dev/tcp/smtp.mailgun.org/587" && echo "Mailgun 587 OPEN" || echo "Mailgun 587 BLOCKED"');
  
  console.log('Port 465:', port465.result.trim());
  console.log('Port 587:', port587.result.trim());
  console.log('Mailgun test:', port2525.result.trim());

  // Step 2: Test sending with port 587
  const testEmail = await sb.process.executeCommand(`docker exec zed-server-1 node -e "
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'zedagencyofficial@gmail.com',
        pass: 'oeexdvgdgklbyksu'
      }
    });
    transporter.verify().then(ok => {
      console.log('SMTP 587 verify OK:', ok);
    }).catch(err => {
      console.log('SMTP 587 error:', err.message);
    });
  " 2>&1`);
  console.log('\nSMTP 587 test result:', testEmail.result);
}

fixEmailConfig().catch(console.error);
