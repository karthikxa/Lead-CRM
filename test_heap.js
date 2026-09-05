// Test --jitless memory at startup
const h = require('v8').getHeapStatistics();
const m = process.memoryUsage();
console.log('heap_limit:', Math.round(h.heap_size_limit/1024/1024)+'MB');
console.log('rss:', Math.round(m.rss/1024/1024)+'MB');
console.log('heapTotal:', Math.round(m.heapTotal/1024/1024)+'MB');
console.log('heapUsed:', Math.round(m.heapUsed/1024/1024)+'MB');
