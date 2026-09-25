import mysql from 'mysql2/promise';
import { readFile, readdir } from 'node:fs/promises';

try { process.loadEnvFile('.env'); } catch { /* Variables may be supplied by Lerd. */ }

const required = ['DB_HOST', 'DB_DATABASE', 'DB_USERNAME'];
if (required.some((name) => !process.env[name])) {
  throw new Error(`Konfigurasi MySQL belum lengkap: ${required.join(', ')}.`);
}

const schema = await readFile(new URL('../database/mysql-schema.sql', import.meta.url), 'utf8');
const migrationsDirectory = new URL('../database/migrations/', import.meta.url);
const database = process.env.DB_DATABASE;
if (!/^[A-Za-z0-9_]+$/.test(database)) throw new Error('DB_DATABASE hanya boleh berisi huruf, angka, dan garis bawah.');
const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true,
  charset: 'utf8mb4',
});

try {
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await connection.query(`USE \`${database}\``);
  await connection.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    id VARCHAR(100) PRIMARY KEY, filename VARCHAR(255) NOT NULL, applied_at VARCHAR(32) NOT NULL
  ) ENGINE=InnoDB`);
  const migrationFiles = (await readdir(migrationsDirectory)).filter((file) => /^\d+_.+\.mjs$/.test(file)).sort();
  for (const filename of migrationFiles) {
    const id = filename.replace(/\.mjs$/, '');
    const applied = await connection.query('SELECT id FROM schema_migrations WHERE id = ?', [id]);
    if (applied[0].length) continue;
    const migration = await import(new URL(`../database/migrations/${filename}`, import.meta.url));
    if (typeof migration.up !== 'function') throw new Error(`Migrasi ${filename} tidak memiliki fungsi up().`);
    await connection.beginTransaction();
    try {
      await migration.up(connection, { schema, database });
      await connection.query('INSERT INTO schema_migrations (id,filename,applied_at) VALUES (?,?,?)', [id, filename, new Date().toISOString()]);
      await connection.commit();
      console.log(`Migrasi ${id} diterapkan.`);
    } catch (error) { await connection.rollback(); throw error; }
  }
  await connection.query('DROP TRIGGER IF EXISTS sync_historical_incidents_insert');
  await connection.query('DROP TRIGGER IF EXISTS sync_historical_incidents_update');
  const historicalUpsert = `INSERT INTO historical_incidents (incident_id,first_recorded_at,updated_at,current_stage,reporter,contact,description,location,category,priority,case_status,verification_status,source,incident_data)
    VALUES (NEW.id,NEW.created_at,NEW.updated_at,NEW.stage,NEW.reporter,NEW.contact,NEW.description,NEW.location,NEW.category,NEW.priority,
      COALESCE(JSON_UNQUOTE(JSON_EXTRACT(NEW.data, '$.caseStatus')),''),COALESCE(JSON_UNQUOTE(JSON_EXTRACT(NEW.data, '$.verificationStatus')),''),'SIRATSI',NEW.data)
    ON DUPLICATE KEY UPDATE updated_at=VALUES(updated_at),current_stage=VALUES(current_stage),reporter=VALUES(reporter),contact=VALUES(contact),description=VALUES(description),location=VALUES(location),category=VALUES(category),priority=VALUES(priority),case_status=VALUES(case_status),verification_status=VALUES(verification_status),incident_data=VALUES(incident_data)`;
  await connection.query(`CREATE TRIGGER sync_historical_incidents_insert AFTER INSERT ON incidents FOR EACH ROW ${historicalUpsert}`);
  await connection.query(`CREATE TRIGGER sync_historical_incidents_update AFTER UPDATE ON incidents FOR EACH ROW ${historicalUpsert}`);
  await connection.query(`INSERT INTO historical_incidents (incident_id,first_recorded_at,updated_at,current_stage,reporter,contact,description,location,category,priority,case_status,verification_status,source,incident_data)
    SELECT id,created_at,updated_at,stage,reporter,contact,description,location,category,priority,
      COALESCE(JSON_UNQUOTE(JSON_EXTRACT(data, '$.caseStatus')),''),COALESCE(JSON_UNQUOTE(JSON_EXTRACT(data, '$.verificationStatus')),''),'SIRATSI',data FROM incidents
    ON DUPLICATE KEY UPDATE updated_at=VALUES(updated_at),current_stage=VALUES(current_stage),reporter=VALUES(reporter),contact=VALUES(contact),description=VALUES(description),location=VALUES(location),category=VALUES(category),priority=VALUES(priority),case_status=VALUES(case_status),verification_status=VALUES(verification_status),incident_data=VALUES(incident_data)`);
  for (const statement of [
    "ALTER TABLE incident_escalations ADD COLUMN automatic INT NOT NULL DEFAULT 0",
    "ALTER TABLE incident_escalations ADD COLUMN resolved_by VARCHAR(36) NULL",
    "ALTER TABLE incident_escalations ADD COLUMN resolution_note VARCHAR(2000) NOT NULL DEFAULT ''",
  ]) {
    try { await connection.query(statement); } catch (error) { if (error?.code !== 'ER_DUP_FIELDNAME') throw error; }
  }
  console.log(`Skema MySQL '${database}' siap digunakan.`);
} finally {
  await connection.end();
}
