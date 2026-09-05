const { Daytona } = require('@daytona/sdk');

async function checkServerError() {
  const d = new Daytona({ apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef', serverUrl: 'https://app.daytona.io/api' });
  const sb = await d.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  const logs = await sb.process.executeCommand('docker logs --tail 60 zed-server-1 2>&1');
  console.log('Server logs:\n', logs.result);
}

checkServerError().catch(console.error);
