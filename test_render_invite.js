const https = require('https');

async function testSendInvite() {
  const payload = JSON.stringify({
    email: 'bkarthikeyan.cse2025@citchennai.net',
    workspaceName: 'Zed Agency CRM',
    inviteLink: 'https://3000-4d061288-0d39-4f80-a4ba-cd6c65d9598c.daytonaproxy01.net/invite/3bd50ffc17f0a5f80b957682f7c0ff312ba3d1bfd6f2c730e69d799015ba6a0b',
    inviterName: 'Zed Agency Admin',
    role: 'Admin'
  });

  const options = {
    hostname: 'zed-email-relay.onrender.com',
    path: '/invite',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, raw: d }); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

testSendInvite().then(r => console.log('Test send result:\n', JSON.stringify(r, null, 2))).catch(console.error);
