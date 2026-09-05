const { Client } = require('pg');
async function test() {
  const { NestFactory } = require('@nestjs/core');
  const { AppModule } = require('/app/packages/twenty-server/dist/app.module.js');
  const app = await NestFactory.createApplicationContext(AppModule);
  const authService = app.get('AuthService');
  console.log('Testing signInUpWithSocialSSO with hasInvite check...');
  console.log('authService has userRepository:', !!authService.userRepository);
  console.log('authService has workspaceRepository:', !!authService.workspaceRepository);
  console.log('authService has workspaceInvitationService:', !!authService.workspaceInvitationService);
  console.log('authService has userWorkspaceService:', !!authService.userWorkspaceService);
  console.log('authService has appTokenRepository:', !!authService.appTokenRepository);
  try {
    const result = await authService.signInUpWithSocialSSO({
      firstName: 'Test',
      lastName: 'User',
      email: 'not-invited-test@example.com',
      picture: null,
      billingCheckoutSessionState: undefined,
      authProvider: 'Google',
    }, 'Google');
    console.log('Result:', result);
  } catch (e) {
    console.error('Error:', e.message);
    console.error(e.stack);
  }
  await app.close();
}
test();