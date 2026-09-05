const fs = require('fs');

const buf = fs.readFileSync('backups/backup-2026-09-03-assignedBy-mock.sql');
let content = buf.toString('utf16le').replace(/\r\n/g, '\n');
content = content.replace(/^\\restrict.*$/gm, '');
content = content.replace(/^\\connect.*$/gm, '');

const lines = content.split('\n');
console.log('Total lines:', lines.length);

const nonComments = lines.filter(l => l.trim() && !l.trim().startsWith('--')).slice(0, 30);
console.log('First 30 non-comment lines:');
console.log(nonComments.join('\n'));
