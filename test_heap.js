const { execSync } = require('child_process');
try {
  const out = execSync('node -e "console.log(typeof gc)"', {
    env: { ...process.env, NODE_OPTIONS: '--expose-gc' },
    encoding: 'utf8'
  });
  console.log('Result:', out);
} catch (e) {
  console.log('Failed:', e.stderr?.toString() || e.message);
}

