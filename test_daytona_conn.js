const { Daytona } = require('@daytona/sdk');

async function testDaytona() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  try {
    const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');
    console.log('Daytona sandbox state:', sb.state);
    const res = await sb.process.executeCommand('uptime');
    console.log('Uptime:', res.result);
  } catch (err) {
    console.error('Daytona error:', err.message);
  }
}

testDaytona();
