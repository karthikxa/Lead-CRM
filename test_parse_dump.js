const fs = require('fs');

function parseDump(filePath) {
  const buf = fs.readFileSync(filePath);
  let content = buf.toString('utf16le').replace(/\r\n/g, '\n');

  // Strip pg_dump commands like \restrict or \connect
  content = content.replace(/^\\restrict.*$/gm, '');
  content = content.replace(/^\\connect.*$/gm, '');

  const statements = [];
  const lines = content.split('\n');

  let inCopy = false;
  let copyTable = '';
  let copyCols = '';
  let currentStmt = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (inCopy) {
      if (trimmed === '\\.') {
        inCopy = false;
        continue;
      }
      if (!trimmed || trimmed.startsWith('--')) continue;

      // Parse TSV row to INSERT
      const cols = line.split('\t');
      const vals = cols.map(c => {
        if (c === '\\N') return 'NULL';
        let s = c.replace(/\\\\/g, '\\')
                 .replace(/\\n/g, '\n')
                 .replace(/\\r/g, '\r')
                 .replace(/\\t/g, '\t');
        return "'" + s.replace(/'/g, "''") + "'";
      });

      statements.push(`INSERT INTO ${copyTable} ${copyCols} VALUES (${vals.join(', ')});`);
      continue;
    }

    const copyMatch = line.match(/^COPY\s+([^\s]+)\s+(\([^)]+\))\s+FROM\s+stdin;/i);
    if (copyMatch) {
      inCopy = true;
      copyTable = copyMatch[1];
      copyCols = copyMatch[2];
      continue;
    }

    // Skip comments
    if (trimmed.startsWith('--')) continue;
    if (!trimmed) continue;

    currentStmt += (currentStmt ? ' ' : '') + trimmed;
    if (trimmed.endsWith(';')) {
      statements.push(currentStmt);
      currentStmt = '';
    }
  }

  return statements;
}

console.log('Parsing backup-2026-09-03-assignedBy-mock.sql...');
const stmts = parseDump('backups/backup-2026-09-03-assignedBy-mock.sql');
console.log(`Successfully parsed ${stmts.length} statements!`);
const ddl = stmts.filter(s => !s.startsWith('INSERT INTO'));
const inserts = stmts.filter(s => s.startsWith('INSERT INTO'));
console.log(`DDL statements: ${ddl.length}, INSERT statements: ${inserts.length}`);
console.log('\nSample INSERT:');
console.log(inserts.slice(0, 3).join('\n\n'));
