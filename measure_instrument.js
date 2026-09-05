const before = process.memoryUsage();
console.log('Before instrument:', Math.round(before.rss/1024/1024)+'MB');
require('/app/packages/twenty-server/dist/instrument');
const after = process.memoryUsage();
console.log('After instrument:', Math.round(after.rss/1024/1024)+'MB');
console.log('Delta:', Math.round((after.rss - before.rss)/1024/1024)+'MB');
