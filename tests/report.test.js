const request = require("supertest");
const app = require("../app");

describe("GET /reports/summary", () => {
  it("returns aggregated sales data", async () => {
    const res = await request(app).get("/reports/summary");
    expect(res.statusCode).toBe(200);
    expect(res.body.data.totals.totalOrders).toBeGreaterThan(0);
    expect(res.body.data.byCategory.length).toBeGreaterThan(0);
    expect(res.body.data.topProducts.length).toBeLessThanOrEqual(5);
  });
});

describe("Report job lifecycle", () => {
  let jobId;

  it("creates a report job and returns 202 with links", async () => {
    const res = await request(app).post("/reports");
    expect(res.statusCode).toBe(202);
    expect(res.body.data).toHaveProperty("jobId");
    expect(res.body.data).toHaveProperty("statusUrl");
    expect(res.body.data).toHaveProperty("downloadUrl");
    jobId = res.body.data.jobId;
  });

  it("eventually reports completed status", async () => {
    // Poll briefly — job processing is async but fast (in-process, no network).
    let status;
    for (let i = 0; i < 20; i += 1) {
      const res = await request(app).get(`/reports/${jobId}/status`);
      status = res.body.data.status;
      if (status === "completed") break;
      await new Promise((r) => setTimeout(r, 100));
    }
    expect(status).toBe("completed");
  });

  it("downloads a valid PDF for a completed job", async () => {
    const res = await request(app).get(`/reports/${jobId}/download`);
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toBe("application/pdf");
    expect(res.body.slice(0, 4).toString()).toBe("%PDF");
  });

  it("returns 404 for an unknown job id", async () => {
    const res = await request(app).get("/reports/does-not-exist/status");
    expect(res.statusCode).toBe(404);
  });
});
