import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { app } from "../src/app.js";
import { pool } from "../src/config/db.js";

const email = `fastor-test-${randomUUID()}@example.com`;
const password = "SecureTestPassword123!";
let employeeId;
let token;

describe("Employee authentication API", () => {
  afterAll(async () => {
    if (employeeId) {
      await pool.query("DELETE FROM employees WHERE id = $1", [employeeId]);
    }
    await pool.end();
  });

  it("rejects invalid registration input", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({ name: "A", email: "invalid", password: "123" });

    expect(response.status).toBe(400);
  });

  it("registers an employee and hashes the password", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Fastor Test Counselor",
        email,
        password,
      });

    expect(response.status).toBe(201);
    expect(response.body.employee.email).toBe(email);
    expect(response.body.employee.password_hash).toBeUndefined();
    expect(typeof response.body.token).toBe("string");

    employeeId = response.body.employee.id;
    token = response.body.token;

    const result = await pool.query(
      "SELECT password_hash FROM employees WHERE id = $1",
      [employeeId]
    );

    expect(result.rows[0].password_hash).not.toBe(password);
    expect(await bcrypt.compare(password, result.rows[0].password_hash)).toBe(true);
  });

  it("rejects duplicate email registration", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({ name: "Duplicate Counselor", email, password });

    expect(response.status).toBe(409);
  });

  it("rejects an incorrect password", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "WrongPassword123!" });

    expect(response.status).toBe(401);
  });

  it("logs in with valid credentials", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email, password });

    expect(response.status).toBe(200);
    expect(typeof response.body.token).toBe("string");
    expect(response.body.employee.email).toBe(email);
  });

  it("blocks unauthenticated access to /me", async () => {
    const response = await request(app).get("/api/auth/me");
    expect(response.status).toBe(401);
  });

  it("blocks invalid JWT tokens", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalid.token.value");

    expect(response.status).toBe(401);
  });

  it("returns the authenticated employee", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.employee.id).toBe(employeeId);
    expect(response.body.employee.email).toBe(email);
  });
});