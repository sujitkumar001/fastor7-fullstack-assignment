import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || "fastor_crm",
  user: process.env.DB_USER || "fastor_app",
  password: process.env.DB_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL idle client error:", error);
});

export async function checkDatabaseConnection() {
  const result = await pool.query(
    "SELECT current_user AS username, current_database() AS database_name"
  );
  return result.rows[0];
}