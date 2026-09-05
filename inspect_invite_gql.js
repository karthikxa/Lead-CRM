const { Daytona } = require('@daytona/sdk');

async function inspectInviteGql() {
  const daytona = new Daytona({
    apiKey: 'dtn_6bb8efee5b7e6bbde0f74474317b91d49a5d6bf9da9b636028677a9609f192ef',
    serverUrl: 'https://app.daytona.io/api'
  });

  const sb = await daytona.get('4d061288-0d39-4f80-a4ba-cd6c65d9598c');
  const res = await sb.process.executeCommand(`
    docker exec zed-server-1 grep -o "SendInvitations\|SendWorkspaceInvitations\|createWorkspaceInvitation\|sendWorkspaceInvitation" /app/packages/twenty-server/dist/front/assets/SettingsWorkspaceMembers-CYNps3bH.js /app/packages/twenty-server/dist/front/assets/InviteTeam-DUAzgAwn.js
  `);
  console.log('Matches:\n', res.result);
}

inspectInviteGql().catch(console.error);
