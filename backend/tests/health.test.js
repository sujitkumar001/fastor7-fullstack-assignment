import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";

describe("Express server foundation", () => {
  it("returns a healthy status", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ok",
      service: "fastor-crm-backend"
    });
  });

  it("returns 404 for unknown routes", async () => {
    const response = await request(app).get("/api/unknown");

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Route not found");
  });

  it("rejects malformed JSON", async () => {
    const response = await request(app)
      .post("/api/unknown")
      .set("Content-Type", "application/json")
      .send('{"broken":');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid JSON request body");
  });

  it("sets security headers", async () => {
    const response = await request(app).get("/api/health");

    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-powered-by"]).toBeUndefined();
  });
});
