const fs = require('fs');

const buf = fs.readFileSync('backups/backup-2026-09-03-assignedBy-mock.sql');
let sql = buf.toString('utf16le').replace(/\r\n/g, '\n');

const copyRegex = /COPY ([^\n]+) FROM stdin;\n([\s\S]*?)\n\\\./g;
let match;
let count = 0;
let totalRows = 0;
while ((match = copyRegex.exec(sql)) !== null) {
  count++;
  const target = match[1];
  const body = match[2].trim();
  const rows = body ? body.split('\n').length : 0;
  totalRows += rows;
  if (rows > 0) {
    console.log(`${target}: ${rows} rows`);
  }
}
console.log(`\nTotal tables with COPY: ${count}, Total data rows: ${totalRows}`);
