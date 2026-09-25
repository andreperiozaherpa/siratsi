import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle/mysql",
  schema: "./db/schema.ts",
  dialect: "mysql",
  dbCredentials: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_DATABASE || "siratsi",
  },
});
