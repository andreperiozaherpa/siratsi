import mysql from 'mysql2/promise';
import { readFile } from 'node:fs/promises';

try { process.loadEnvFile('.env'); } catch { /* Variables may be supplied by Lerd. */ }

const filename = process.argv[2];
if (!filename) throw new Error('Masukkan lokasi dump SQLite: npm run db:import -- /lokasi/dump.sql');

const permittedTables = ['users', 'incidents', 'incident_stakeholders', 'notification_reads'];
const rows = new Map(permittedTables.map((table) => [table, []]));
const dump = await readFile(filename, 'utf8');

for (const line of dump.split(/\r?\n/)) {
  const match = line.match(/^INSERT INTO ["`]([a-z_]+)["`] VALUES\(.+\);$/);
  if (!match || !rows.has(match[1])) continue;
  rows.get(match[1]).push(line.replace(/^INSERT INTO ["`]([a-z_]+)["`] VALUES/, 'INSERT IGNORE INTO `$1` VALUES'));
}

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE,
  charset: 'utf8mb4',
});

try {
  await connection.beginTransaction();
  for (const table of permittedTables) {
    for (const statement of rows.get(table)) await connection.query(statement);
  }
  await connection.commit();
  const [counts] = await connection.query(`SELECT
    (SELECT COUNT(*) FROM users) AS users,
    (SELECT COUNT(*) FROM incidents) AS incidents,
    (SELECT COUNT(*) FROM incident_stakeholders) AS assignments,
    (SELECT COUNT(*) FROM notification_reads) AS notifications`);
  console.log('Impor selesai:', counts[0]);
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
