const { Daytona } = require('@daytona/sdk');

async function check() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');
  const envCheck = await sb.process.executeCommand(`docker exec zed-server-1 env | grep AUTH_GOOGLE_CLIENT_SECRET`);
  console.log('Container Client Secret:\n', envCheck.result);

  const composePath = await sb.process.executeCommand(`find / -name "docker-compose.yml" 2>/dev/null`);
  console.log('Compose files found:\n', composePath.result);
}

check().catch(console.error);
