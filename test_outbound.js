const { Daytona } = require('@daytona/sdk');

async function testOutbound() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  // Test basic HTTPS outbound from container
  const curlTest = await sb.process.executeCommand(`docker exec zed-server-1 sh -c "curl -s -o /dev/null -w '%{http_code}' https://google.com --max-time 8" 2>&1`);
  console.log('Google HTTPS:', curlTest.result);

  const curlBrevo = await sb.process.executeCommand(`docker exec zed-server-1 sh -c "curl -s -o /dev/null -w '%{http_code}' https://api.brevo.com/v3 --max-time 8" 2>&1`);
  console.log('Brevo API curl:', curlBrevo.result);

  const curlResend = await sb.process.executeCommand(`docker exec zed-server-1 sh -c "curl -s -o /dev/null -w '%{http_code}' https://api.resend.com/emails --max-time 8 -H 'Authorization: Bearer test'" 2>&1`);
  console.log('Resend API curl:', curlResend.result);

  // Check if sendgrid endpoint is reachable
  const curlSendgrid = await sb.process.executeCommand(`docker exec zed-server-1 sh -c "curl -s -o /dev/null -w '%{http_code}' https://api.sendgrid.com/v3/mail/send --max-time 8 -H 'Authorization: Bearer test' -d '{}' -H 'Content-Type: application/json'" 2>&1`);
  console.log('Sendgrid API curl:', curlSendgrid.result);
}

testOutbound().catch(console.error);
