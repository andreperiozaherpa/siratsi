import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "./schema";

export function getDb() {
  return drizzle(mysql.createPool({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306), database: process.env.DB_DATABASE,
    user: process.env.DB_USERNAME, password: process.env.DB_PASSWORD || '', charset: 'utf8mb4',
  }), { schema, mode: 'default' });
}
