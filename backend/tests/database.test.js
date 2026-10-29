import { describe, expect, it, afterAll } from "vitest";
import { pool, checkDatabaseConnection } from "../src/config/db.js";

describe("PostgreSQL database connection", () => {
  afterAll(async () => {
    await pool.end();
  });

  it("connects using the application database user", async () => {
    const result = await checkDatabaseConnection();

    expect(result.username).toBe("fastor_app");
    expect(result.database_name).toBe("fastor_crm");
  });

  it("contains the employees and enquiries tables", async () => {
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('employees', 'enquiries')
      ORDER BY table_name
    `);

    expect(result.rows.map((row) => row.table_name)).toEqual([
      "employees",
      "enquiries",
    ]);
  });
});