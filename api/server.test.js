// Write your tests here
const request = require("supertest");
const server = require("./server");
const db = require("../data/dbConfig");

beforeAll(async () => {
  await db.migrate.rollback();
  await db.migrate.latest();
});

afterAll(async () => {
  await db.destroy();
});

describe("server.js", () => {
  describe("auth endpoints", () => {
    it("POST /api/auth/register - success", async () => {
      const res = await request(server)
        .post("/api/auth/register")
        .send({ username: "testuser", password: "testpass" });
      expect(res.status).toBe(201);
      expect(res.body.username).toBe("testuser");
      expect(res.body.password).not.toBe("testpass");
    });

    it("POST /api/auth/register - failure (missing data)", async () => {
      const res = await request(server)
        .post("/api/auth/register")
        .send({ username: "testuser2" });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("username and password required");
    });

    it("POST /api/auth/login - success", async () => {
      const res = await request(server)
        .post("/api/auth/login")
        .send({ username: "testuser", password: "testpass" });
      expect(res.status).toBe(200);
      expect(res.body.message).toContain("welcome, testuser");
      expect(res.body.token).toBeDefined();
    });

    it("POST /api/auth/login - failure (invalid credentials)", async () => {
      const res = await request(server)
        .post("/api/auth/login")
        .send({ username: "testuser", password: "wrongpass" });
      expect(res.status).toBe(401);
      expect(res.body.message).toBe("invalid credentials");
    });
  });

  describe("jokes endpoint", () => {
    it("GET /api/jokes - success (with token)", async () => {
      // First, login to get a token
      const loginRes = await request(server)
        .post("/api/auth/login")
        .send({ username: "testuser", password: "testpass" });
      const token = loginRes.body.token;

      // Then, use the token to access jokes
      const jokesRes = await request(server)
        .get("/api/jokes")
        .set("Authorization", token);
      expect(jokesRes.status).toBe(200);
      expect(Array.isArray(jokesRes.body)).toBe(true);
    });

    it("GET /api/jokes - failure (no token)", async () => {
      const res = await request(server).get("/api/jokes");
      expect(res.status).toBe(401);
      expect(res.body.message).toBe("token required");
    });
  });
});
