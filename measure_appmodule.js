const before = process.memoryUsage();
console.log('Before app.module:', Math.round(before.rss/1024/1024)+'MB heapUsed:'+Math.round(before.heapUsed/1024/1024)+'MB');
try {
  require('./dist/app.module');
} catch(e) {
  console.log('App module load error (expected, no env):', e.message.substring(0, 100));
}
const after = process.memoryUsage();
console.log('After app.module:', Math.round(after.rss/1024/1024)+'MB heapUsed:'+Math.round(after.heapUsed/1024/1024)+'MB');
console.log('Delta:', Math.round((after.rss - before.rss)/1024/1024)+'MB');
