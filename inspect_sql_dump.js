const fs = require('fs');

const buf = fs.readFileSync('backups/backup-2026-09-03-assignedBy-mock.sql');
const sql = buf.toString('utf16le');

console.log('Total characters:', sql.length);

// Count schemas, tables, copy statements
const schemas = sql.match(/CREATE SCHEMA [^;]+;/gi) || [];
console.log('CREATE SCHEMA count:', schemas.length);
schemas.forEach(s => console.log('  ', s));

const tables = sql.match(/CREATE TABLE [^;]+;/gi) || [];
console.log('CREATE TABLE count:', tables.length);

const copies = sql.match(/COPY [^\n]+ FROM stdin;/gi) || [];
console.log('COPY statements count:', copies.length);
copies.slice(0, 10).forEach(c => console.log('  ', c));
