// Test --jitless flag impact on instrument.js
const before = process.memoryUsage();
console.log('Before instrument (jitless):', Math.round(before.rss/1024/1024)+'MB');
require('/app/packages/twenty-server/dist/instrument');
const after = process.memoryUsage();
console.log('After instrument (jitless):', Math.round(after.rss/1024/1024)+'MB');
console.log('Delta (jitless):', Math.round((after.rss - before.rss)/1024/1024)+'MB');
