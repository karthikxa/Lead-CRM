const { Daytona } = require('@daytona/sdk');

async function testHost() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  // Test from Daytona sandbox host (outside container)
  const hostCurl = await sb.process.executeCommand('curl -s -o /dev/null -w "%{http_code}" https://google.com --max-time 5');
  console.log('Host curl google:', hostCurl.result);

  const hostLLM = await sb.process.executeCommand('curl -s -o /dev/null -w "%{http_code}" https://server-llm-1-0r64.onrender.com/api/ping --max-time 5');
  console.log('Host curl LLM:', hostLLM.result);

  // Test docker bridge iptables / DNS
  const dockerDns = await sb.process.executeCommand('docker exec zed-server-1 cat /etc/resolv.conf');
  console.log('Container resolv.conf:\n', dockerDns.result);
}

testHost().catch(console.error);
