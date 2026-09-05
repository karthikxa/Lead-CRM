const tls = require('tls');

const REDIS_HOST = 'singapore-keyvalue.render.com';
const REDIS_PORT = 6379;

const user = 'red-dad7bo0ae00c7395l5jg';
const pass = 'AKlxPdeZRmwyZ1sfCK4TZLSXHKqsqj2Z';

const socket = tls.connect(REDIS_PORT, REDIS_HOST, { rejectUnauthorized: false }, () => {
  console.log('Connected!');
  const authCmd = `*3\r\n$4\r\nAUTH\r\n$${user.length}\r\n${user}\r\n$${pass.length}\r\n${pass}\r\n`;
  socket.write(authCmd);
});

socket.on('data', data => {
  console.log('Redis response:', data.toString().trim());
  socket.write('*1\r\n$4\r\nPING\r\n');
});

socket.on('error', err => {
  console.error('Redis error:', err.message);
});

setTimeout(() => {
  socket.end();
  process.exit(0);
}, 3000);
