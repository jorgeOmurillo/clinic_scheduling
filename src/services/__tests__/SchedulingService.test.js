const SchedulingService = require("../SchedulingService");
const Appointment = require("../../models/Appointment");

describe("SchedulingService", () => {
  let schedulingService;

  beforeEach(() => {
    schedulingService = new SchedulingService();
  });

  it("should book a valid appointment", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    const appointment = schedulingService.bookAppointment("standard", tomorrow);

    expect(appointment.type).toBe("standard");
    expect(appointment.startTime).toEqual(tomorrow);
    expect(appointment.duration).toBe(60);
  });

  it("should reject appointment outside clinic hours", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0); // Before opening time

    expect(() => {
      schedulingService.bookAppointment("standard", tomorrow);
    }).toThrow("Appointment must be within clinic hours");
  });

  it("should reject overlapping appointments", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    schedulingService.bookAppointment("standard", tomorrow);

    expect(() => {
      schedulingService.bookAppointment("checkin", tomorrow);
    }).toThrow("Appointment overlaps with existing booking");
  });
});
