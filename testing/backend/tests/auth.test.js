const { api, authHeader, expectEnvelope, loginAdmin } = require("./helpers/api");

describe("Authentication, JWT, and route protection", () => {
  test("GET /api/health returns 200", async () => {
    const response = await api.get("/api/health");
    expect(response.status).toBe(200);
    expectEnvelope(response);
    expect(response.body.success).toBe(true);
  });

  test("unknown route returns 404", async () => {
    const response = await api.get("/api/unknown-route-for-testing");
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  test("login with empty body returns validation error", async () => {
    const response = await api.post("/api/auth/login").send({});
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed.");
  });

  test("login with wrong credentials returns 401", async () => {
    const response = await api.post("/api/auth/login").send({
      email: "wrong-user@example.com",
      password: "Wrong@1234",
    });
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test("admin login returns JWT and /me verifies token", async () => {
    const { token } = await loginAdmin();
    const me = await api.get("/api/auth/me").set(authHeader(token));
    expect(me.status).toBe(200);
    expect(me.body.data).toHaveProperty("role");
    expect(me.body.data).not.toHaveProperty("passwordHash");
  });

  test("protected route without token returns 401", async () => {
    const response = await api.get("/api/patients");
    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Authentication token is required.");
  });
});
