const { Daytona } = require('@daytona/sdk');

async function testHttpEmail() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  // Check if axios or node-fetch is available in server
  const check = await sb.process.executeCommand(`docker exec zed-server-1 node -e "
    const https = require('https');
    // Test HTTPS outbound to api.brevo.com (port 443)
    const req = https.get('https://api.brevo.com', (res) => {
      console.log('Brevo API reachable:', res.statusCode);
    });
    req.on('error', e => console.log('Brevo error:', e.message));
    req.setTimeout(5000, () => { console.log('Brevo timeout'); req.destroy(); });
  " 2>&1`);
  console.log('Brevo HTTPS test:', check.result);

  // Also test Resend API reachability
  const resendCheck = await sb.process.executeCommand(`docker exec zed-server-1 node -e "
    const https = require('https');
    const req = https.get('https://api.resend.com', (res) => {
      console.log('Resend API reachable:', res.statusCode);
    });
    req.on('error', e => console.log('Resend error:', e.message));
    req.setTimeout(5000, () => { console.log('Resend timeout'); req.destroy(); });
  " 2>&1`);
  console.log('Resend HTTPS test:', resendCheck.result);
}

testHttpEmail().catch(console.error);
