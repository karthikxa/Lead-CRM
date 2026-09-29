const { Daytona } = require('@daytona/sdk');

async function test() {
  try {
    const daytona = new Daytona({
      apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
      serverUrl: 'https://app.daytona.io/api'
    });
    const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');
    console.log('Sandbox status:', sb.state);
    const ps = await sb.process.executeCommand('docker ps --format "{{.Names}} - {{.Status}}"');
    console.log('Docker ps:\n', ps.result);
  } catch (err) {
    console.error('Daytona error:', err.message);
  }
}
test();
