import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";
import { app } from "../src/app.js";
import { pool } from "../src/config/db.js";

const runId = randomUUID();
const password = "SecureTestPassword123!";
const employees = [];
const enquiries = [];
let tokenA;
let tokenB;
let employeeA;
let employeeB;
let enquiryId;

async function registerCounselor(name, suffix) {
  const response = await request(app)
    .post("/api/auth/register")
    .send({
      name,
      email: `fastor-${suffix}-${runId}@example.com`,
      password,
    });

  expect(response.status).toBe(201);
  employees.push(response.body.employee.id);
  return response.body;
}

async function submitEnquiry(suffix) {
  const response = await request(app)
    .post("/api/enquiries")
    .send({
      studentName: "Fastor Test Student",
      email: `student-${suffix}-${runId}@example.com`,
      phone: "9876543210",
      course: "Full Stack Development",
      message: "Interested in admission details",
    });

  expect(response.status).toBe(201);
  enquiries.push(response.body.enquiry.id);
  return response.body.enquiry;
}

describe("CRM enquiry and lead claiming API", () => {
  afterAll(async () => {
    try {
      if (enquiries.length) {
        await pool.query(
          "DELETE FROM enquiries WHERE id = ANY($1::bigint[])",
          [enquiries]
        );
      }

      if (employees.length) {
        await pool.query(
          "DELETE FROM employees WHERE id = ANY($1::bigint[])",
          [employees]
        );
      }
    } finally {
      await pool.end();
    }
  });

  it("rejects invalid public enquiry input", async () => {
    const response = await request(app)
      .post("/api/enquiries")
      .send({
        studentName: "A",
        email: "not-an-email",
        phone: "1",
        course: "",
      });

    expect(response.status).toBe(400);
  });

  it("accepts a public student enquiry without login", async () => {
    const enquiry = await submitEnquiry("public");

    enquiryId = enquiry.id;
    expect(enquiry.claimedBy).toBeNull();
    expect(enquiry.studentName).toBe("Fastor Test Student");
  });

  it("blocks anonymous access to unclaimed leads", async () => {
    const response = await request(app)
      .get("/api/enquiries/unclaimed");

    expect(response.status).toBe(401);
  });

  it("blocks anonymous lead claiming", async () => {
    const response = await request(app)
      .patch(`/api/enquiries/${enquiryId}/claim`);

    expect(response.status).toBe(401);
  });

  it("registers two independent counselors", async () => {
    const first = await registerCounselor("Counselor Alpha", "alpha");
    const second = await registerCounselor("Counselor Beta", "beta");

    tokenA = first.token;
    tokenB = second.token;
    employeeA = first.employee.id;
    employeeB = second.employee.id;

    expect(employeeA).not.toBe(employeeB);
  });

  it("shows unclaimed leads to authenticated counselors", async () => {
    const response = await request(app)
      .get("/api/enquiries/unclaimed")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(response.status).toBe(200);
    expect(response.body.enquiries.some((e) => e.id === enquiryId)).toBe(true);
  });

  it("rejects an invalid enquiry ID", async () => {
    const response = await request(app)
      .patch("/api/enquiries/not-a-number/claim")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(response.status).toBe(400);
  });

  it("allows exactly one counselor to win a simultaneous claim", async () => {
    const [first, second] = await Promise.all([
      request(app)
        .patch(`/api/enquiries/${enquiryId}/claim`)
        .set("Authorization", `Bearer ${tokenA}`),
      request(app)
        .patch(`/api/enquiries/${enquiryId}/claim`)
        .set("Authorization", `Bearer ${tokenB}`),
    ]);

    expect([first.status, second.status].sort()).toEqual([200, 409]);

    const result = await pool.query(
      "SELECT claimed_by, claimed_at FROM enquiries WHERE id = $1",
      [enquiryId]
    );

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].claimed_at).not.toBeNull();
    expect([employeeA, employeeB]).toContain(
      String(result.rows[0].claimed_by)
    );
  });

  it("removes claimed leads from the unclaimed list", async () => {
    const response = await request(app)
      .get("/api/enquiries/unclaimed")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(response.status).toBe(200);
    expect(response.body.enquiries.some((e) => e.id === enquiryId)).toBe(false);
  });

  it("returns claimed leads only to their owner", async () => {
    const [first, second] = await Promise.all([
      request(app)
        .get("/api/enquiries/mine")
        .set("Authorization", `Bearer ${tokenA}`),
      request(app)
        .get("/api/enquiries/mine")
        .set("Authorization", `Bearer ${tokenB}`),
    ]);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);

    const ownerA = first.body.enquiries.some((e) => e.id === enquiryId);
    const ownerB = second.body.enquiries.some((e) => e.id === enquiryId);

    expect(Number(ownerA) + Number(ownerB)).toBe(1);
  });

  it("rejects another claim on an already claimed lead", async () => {
    const response = await request(app)
      .patch(`/api/enquiries/${enquiryId}/claim`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(response.status).toBe(409);
  });

  it("returns 404 for a nonexistent enquiry", async () => {
    const response = await request(app)
      .patch("/api/enquiries/9223372036854775807/claim")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(response.status).toBe(404);
  });

  it("blocks anonymous access to counselor-specific leads", async () => {
    const response = await request(app)
      .get("/api/enquiries/mine");

    expect(response.status).toBe(401);
  });
});