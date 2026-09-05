const fs = require('fs');

function checkFile(name) {
  const buf = fs.readFileSync(name);
  let isUtf16 = (buf[0] === 0xff && buf[1] === 0xfe) || (buf[0] === 0xfe && buf[1] === 0xff);
  let text = '';
  if (isUtf16) {
    text = buf.toString('utf16le');
  } else {
    text = buf.toString('utf8');
  }
  console.log(`--- ${name} (size: ${buf.length}, utf16: ${isUtf16}) ---`);
  console.log(text.substring(0, 500));
}

checkFile('backups/backup-latest.sql');
checkFile('backups/backup-2026-09-03-assignedBy-mock.sql');
