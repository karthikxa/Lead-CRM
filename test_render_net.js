const https = require('https');

async function testRenderOutboundHttps() {
  // Let's add a test endpoint on our Render service or test via script
  const payload = JSON.stringify({
    url: 'https://httpbin.org/get'
  });

  const options = {
    hostname: 'zed-email-relay.onrender.com',
    path: '/ping',
    method: 'GET'
  };

  const req = https.request(options, res => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => console.log('Render /ping status:', res.statusCode, d));
  });
  req.end();
}

testRenderOutboundHttps();
