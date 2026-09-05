const { Daytona } = require('@daytona/sdk');

async function test() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');

  // Test LLM server reachability from inside Daytona container
  const llmTest = await sb.process.executeCommand(
    `docker exec zed-server-1 sh -c "curl -s -o /dev/null -w '%{http_code}' https://server-llm-1-0r64.onrender.com/api/ping --max-time 8"`
  );
  console.log('LLM from Daytona:', llmTest.result);

  // Also test google.com
  const googleTest = await sb.process.executeCommand(
    `docker exec zed-server-1 sh -c "curl -s -o /dev/null -w '%{http_code}' https://google.com --max-time 5"`
  );
  console.log('Google from Daytona:', googleTest.result);
}

test().catch(console.error);
