const https = require('https');

function testHealth() {
  const req = https.get('https://zed-0moa.onrender.com/healthz', { timeout: 5000 }, res => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      console.log(`HTTP ${res.statusCode}: ${data}`);
    });
  });
  req.on('timeout', () => {
    console.log('Timeout (service not listening yet)');
    req.abort();
  });
  req.on('error', err => {
    console.log('Error:', err.message);
  });
}

testHealth();
