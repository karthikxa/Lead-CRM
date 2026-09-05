const tls = require('tls');

const REDIS_HOST = 'singapore-keyvalue.render.com';
const REDIS_PORT = 6379;

console.log(`Testing TLS connection to ${REDIS_HOST}:${REDIS_PORT}...`);
const socket = tls.connect(REDIS_PORT, REDIS_HOST, { rejectUnauthorized: false }, () => {
  console.log('Connected to Redis TLS successfully!');
  socket.write('AUTH red-dad7bo0ae00c7395l5jg AKlxPdeZRmwyZ1sfCK4TZLSXHKqsqj2Z\r\n');
});

socket.on('data', data => {
  console.log('Redis response:', data.toString().trim());
  socket.write('PING\r\n');
});

socket.on('error', err => {
  console.error('Redis error:', err.message);
});

setTimeout(() => {
  socket.end();
  process.exit(0);
}, 3000);
