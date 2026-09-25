import mysql, { type Pool, type PoolConnection, type ResultSetHeader, type RowDataPacket } from 'mysql2/promise';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';

type Parameters = any[];
type QueryResult<T> = { results: T[] };
type RunResult = { meta: { changes: number } };

function loadEnvironment() {
  if (process.env.DB_HOST) return;
  try { process.loadEnvFile('.env'); } catch { /* Lerd may supply variables directly. */ }
}

function pool(): Pool {
  loadEnvironment();
  if (!process.env.DB_HOST || !process.env.DB_DATABASE || !process.env.DB_USERNAME) {
    throw new Error('Konfigurasi MySQL belum lengkap. Isi DB_HOST, DB_DATABASE, DB_USERNAME, dan DB_PASSWORD di .env.');
  }
  return mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_DATABASE,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD || '',
    waitForConnections: true,
    connectionLimit: 10,
    charset: 'utf8mb4',
  });
}

const globalPool = globalThis as typeof globalThis & { siratsiMySqlPool?: Pool };
const getPool = () => globalPool.siratsiMySqlPool ??= pool();

class Statement {
  constructor(readonly sql: string, readonly parameters: Parameters = []) {}

  bind(...parameters: Parameters) { return new Statement(this.sql, parameters); }

  async first<T = any>(): Promise<T | null> {
    const [rows] = await getPool().execute<RowDataPacket[]>(this.sql, this.parameters);
    return (rows[0] as T | undefined) ?? null;
  }

  async all<T = any>(): Promise<QueryResult<T>> {
    const [rows] = await getPool().execute<RowDataPacket[]>(this.sql, this.parameters);
    return { results: rows as T[] };
  }

  async run(): Promise<RunResult> {
    const [result] = await getPool().execute<ResultSetHeader>(this.sql, this.parameters);
    return { meta: { changes: result.affectedRows } };
  }

  async execute(connection: PoolConnection) {
    return connection.execute<ResultSetHeader>(this.sql, this.parameters);
  }
}

export const database = {
  prepare(sql: string) { return new Statement(sql); },
  async batch(statements: Statement[]) {
    const connection = await getPool().getConnection();
    try {
      await connection.beginTransaction();
      for (const statement of statements) await statement.execute(connection);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally { connection.release(); }
  },
};

const uploadRoot = resolve(process.env.SIRATSI_UPLOAD_DIR || 'storage/siratsi');
function uploadPath(key: string) {
  const path = resolve(uploadRoot, key);
  if (!path.startsWith(`${uploadRoot}${sep}`)) throw new Error('Kunci lampiran tidak valid.');
  return path;
}

const bucket = {
  async put(key: string, value: Uint8Array, _options?: unknown) {
    const path = uploadPath(key);
    await mkdir(resolve(path, '..'), { recursive: true });
    await writeFile(path, value);
  },
  async get(key: string) {
    try { return { body: new Uint8Array(await readFile(uploadPath(key))) }; }
    catch { return null; }
  },
  async delete(key: string) { await rm(uploadPath(key), { force: true }); },
};

// Keeps existing route code concise while replacing the Cloudflare D1/R2 bindings.
export const env = { DB: database, BUCKET: bucket, SIRATSI_ADMIN_EMAIL: process.env.SIRATSI_ADMIN_EMAIL };

export type DatabaseStatement = Statement;
