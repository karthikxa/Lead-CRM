const { Daytona } = require('@daytona/sdk');

async function testDeliverability() {
  const d = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });
  const sb = await d.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');
  const res = await sb.process.executeCommand(`
    docker exec zed-server-1 node -e "
      const { EmailService } = require('/app/packages/twenty-server/dist/engine/core-modules/email/email.service.js');
      const es = new EmailService({ add: () => {} });
      es.send({
        to: 'bkarthikeyan.cse2025@citchennai.net',
        subject: 'Invitation to join Karthik on Zed Agency CRM',
        html: '<h2>Welcome to Zed Agency CRM</h2><p>This is an official invitation with full RFC 5322 anti-spam deliverability.</p>',
        text: 'Welcome to Zed Agency CRM. This is an official invitation with full RFC 5322 anti-spam deliverability.'
      }).then(() => console.log('✅ Deliverability test complete!'))
        .catch(console.error);
    "
  `);
  console.log('Result:\n', res.result);
}

testDeliverability().catch(console.error);
