const request = require("supertest");
const app = require("../app");

describe("Appointment API", () => {
  describe("GET /api/appointments/available", () => {
    it("should return available slots for valid date and type", async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const response = await request(app)
        .get("/api/appointments/available")
        .query({
          date: tomorrow.toISOString(),
          type: "standard",
        });

      expect(response.status).toBe(200);
      expect(response.body.availableSlots).toBeDefined();
      expect(Array.isArray(response.body.availableSlots)).toBe(true);
    });

    it("should return 400 for missing parameters", async () => {
      const response = await request(app)
        .get("/api/appointments/available")
        .query({ date: new Date().toISOString() });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe("POST /api/appointments", () => {
    it("should create a new appointment", async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);

      const response = await request(app).post("/api/appointments").send({
        type: "standard",
        startTime: tomorrow.toISOString(),
      });

      expect(response.status).toBe(201);
      expect(response.body.type).toBe("standard");
      expect(new Date(response.body.startTime)).toEqual(tomorrow);
    });

    it("should return 400 for invalid appointment time", async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0); // Before clinic hours

      const response = await request(app).post("/api/appointments").send({
        type: "standard",
        startTime: tomorrow.toISOString(),
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });
});
