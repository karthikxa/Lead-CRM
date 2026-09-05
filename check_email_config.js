const { Daytona } = require('@daytona/sdk');

async function check() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');
  
  // Check current email env vars
  const envCheck = await sb.process.executeCommand(`docker exec zed-server-1 sh -c "env | grep -iE 'mail|smtp|email|sendgrid|resend|nodemailer' | sort"`);
  console.log('Email env vars:\n', envCheck.result || '(none found)');

  // Check logs for email errors
  const logs = await sb.process.executeCommand(`docker logs zed-server-1 2>&1 | grep -iE 'mail|smtp|email|nodemailer|transport' | tail -20`);
  console.log('\nEmail-related logs:\n', logs.result || '(none found)');

  // Check worker logs for email errors
  const workerLogs = await sb.process.executeCommand(`docker logs zed-worker-1 2>&1 | grep -iE 'mail|smtp|email|error' | tail -20`);
  console.log('\nWorker email logs:\n', workerLogs.result || '(none found)');
}

check().catch(console.error);
