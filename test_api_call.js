const http = require('http');

const payload = JSON.stringify({
  leads: [
    {
      name: "Apex Real Estate Agency Services",
      industry: "Real Estate Agency",
      website: "https://www.apexrealestateagencyservices.com",
      phone: "+1 623 764 4991",
      city: "Chennai"
    }
  ],
  memberId: "0fc07d58-8180-4512-96df-d7d652d77ffa", // Member 1 (different member!)
  campaignName: "Chennai Real Estate Duplicate Attempt"
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/leads/assign',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('Assign Duplicate Test Response:', res.statusCode, body));
});

req.on('error', console.error);
req.write(payload);
req.end();
