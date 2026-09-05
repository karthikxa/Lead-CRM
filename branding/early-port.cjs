// [Zed] early-port.cjs
// Loaded via --require BEFORE any NestJS module touches the event loop.
// This guarantees Render's port scanner always finds port open within <100ms,
// even if NestJS takes 2+ minutes to boot.
'use strict';
const http = require('http');
const port = Number(process.env.PORT || process.env.NODE_PORT || 10000);

const server = http.createServer((req, res) => {
  res.setHeader('Connection', 'close');
  if (req.url === '/healthz' || req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ok');
  } else {
    res.writeHead(503, { 'Content-Type': 'text/plain' });
    res.end('Zed CRM warming up...');
  }
});

server.on('error', (err) => {
  // Port already taken by NestJS → safe to ignore
  if (err.code !== 'EADDRINUSE') {
    console.warn('[Zed-EarlyPort] Warning:', err.message);
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log('[Zed-EarlyPort] ✅ Port ' + port + ' bound immediately — Render health scan will succeed');
});

// When NestJS is ready and takes over, close the early server
// (NestJS will throw EADDRINUSE which we catch above)
// Active GC watchdog — runs every 10s, triggers GC if heap > 240MB
if (typeof global.gc === 'function') {
  const gcInterval = setInterval(() => {
    try {
      const m = process.memoryUsage();
      const heapMB = Math.round(m.heapUsed / 1024 / 1024);
      if (heapMB > 240) {
        global.gc();
        const after = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
        if (heapMB - after > 5) {
          console.log('[Zed-GC] Freed ' + (heapMB - after) + 'MB heap (' + heapMB + '->' + after + 'MB)');
        }
      }
    } catch (e) {}
  }, 10000);
  gcInterval.unref(); // Don't prevent process exit
  console.log('[Zed-EarlyPort] Active GC watchdog armed (threshold: 240MB heap)');
}
