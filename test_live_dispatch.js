const { Daytona } = require('@daytona/sdk');

async function testLiveEmailDispatch() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  console.log('Sending real test email via EmailService Gmail API...');
  const sendRes = await sb.process.executeCommand(`
    docker exec zed-server-1 node -e "
      const { EmailService } = require('/app/packages/twenty-server/dist/engine/core-modules/email/email.service.js');
      const es = new EmailService({ add: () => {} });
      es.send({
        to: 'bkarthikeyan.cse2025@citchennai.net',
        subject: '⚡ Zed Agency CRM - Gmail API Test',
        html: '<h2>Welcome to Zed Agency CRM!</h2><p>This email was dispatched via Google\\'s official Gmail API over HTTPS (Port 443).</p>',
        text: 'Welcome to Zed Agency CRM! This email was dispatched via Google\\'s official Gmail API over HTTPS (Port 443).'
      }).then(() => console.log('✅ Dispatch execution complete!'))
        .catch(console.error);
    "
  `);
  console.log('Send result:\n', sendRes.result);

  const health = await sb.process.executeCommand('curl -s -i http://localhost:3000/healthz');
  console.log('Health:\n', health.result);
}

testLiveEmailDispatch().catch(console.error);
