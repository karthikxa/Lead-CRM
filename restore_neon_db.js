const fs = require('fs');
const { Client } = require('pg');

const NEON_URL = 'postgresql://neondb_owner:npg_PXCV2dizfS1b@ep-plain-sea-ae01gxmg.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

function parseDump(filePath) {
  const buf = fs.readFileSync(filePath);
  let content = buf.toString('utf16le').replace(/\r\n/g, '\n');

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

async function run() {
  console.log('Connecting to Neon DB...');
  const client = new Client({ connectionString: NEON_URL });
  await client.connect();
  console.log('Connected!');

  console.log('Parsing backup...');
  const stmts = parseDump('backups/backup-2026-09-03-assignedBy-mock.sql');
  console.log(`Parsed ${stmts.length} statements.`);

  // Disable FK triggers
  try {
    await client.query("SET session_replication_role = 'replica';");
  } catch (e) {
    console.warn('Could not set replica role:', e.message);
  }

  let success = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < stmts.length; i++) {
    const stmt = stmts[i];
    // Skip transaction control statements or role statements if any
    if (stmt.toLowerCase().startsWith('select pg_catalog.set_config')) continue;

    try {
      await client.query(stmt);
      success++;
    } catch (err) {
      // Ignore "already exists" errors (e.g. extension or schema)
      if (err.message.includes('already exists') || err.message.includes('does not exist, skipping')) {
        skipped++;
      } else {
        errors++;
        if (errors <= 10) {
          console.error(`[Error on stmt ${i}] ${err.message.substring(0, 100)} | ${stmt.substring(0, 80)}`);
        }
      }
    }

    if ((i + 1) % 500 === 0 || i === stmts.length - 1) {
      console.log(`Progress: ${i + 1}/${stmts.length} (Success: ${success}, Skipped: ${skipped}, Errors: ${errors})`);
    }
  }

  try {
    await client.query("SET session_replication_role = 'origin';");
  } catch {}

  console.log('\n--- Verification ---');
  const tblRes = await client.query(`
    SELECT table_schema, count(*) as count 
    FROM information_schema.tables 
    WHERE table_schema IN ('core', 'public', 'metadata') OR table_schema LIKE 'workspace_%'
    GROUP BY table_schema;
  `);
  console.log('Tables per schema:', tblRes.rows);

  const users = await client.query('SELECT count(*) FROM core."user"');
  console.log('Users in DB:', users.rows[0].count);

  const members = await client.query('SELECT count(*) FROM core."workspaceMember"');
  console.log('Workspace members:', members.rows[0].count);

  await client.end();
  console.log('Restore finished successfully!');
}

run().catch(console.error);
