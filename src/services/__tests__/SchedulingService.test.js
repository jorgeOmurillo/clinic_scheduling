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
    tomorrow.setHours(9, 0, 0, 0); // 9 AM PST

    const appointment = schedulingService.bookAppointment("standard", tomorrow);
    expect(appointment.type).toBe("standard");
    expect(appointment.startTime.getHours()).toBe(9);
    expect(appointment.duration).toBe(60);
  });

  it("should reject appointment outside clinic hours", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0); // 8 AM PST (before opening)

    expect(() => {
      schedulingService.bookAppointment("standard", tomorrow);
    }).toThrow("Appointment must be within clinic hours");
  });

  it("should reject overlapping appointments", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0); // 9 AM PST

    schedulingService.bookAppointment("standard", tomorrow);

    expect(() => {
      schedulingService.bookAppointment("checkin", tomorrow);
    }).toThrow("Appointment overlaps with existing booking");
  });

  it("should reject appointments starting on invalid times", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 15, 0, 0); // 9:15 AM PST (not on hour/half-hour)

    expect(() => {
      schedulingService.bookAppointment("standard", tomorrow);
    }).toThrow("Appointments must start on the hour or half-hour");
  });

  it("should reject same-day appointments less than 2 hours in advance", () => {
    const today = new Date();
    today.setHours(today.getHours() + 1); // Current time + 1 hour
    today.setMinutes(0, 0, 0);

    if (today.getHours() < 9) today.setHours(9, 0, 0, 0); // Ensure within clinic hours

    expect(() => {
      schedulingService.bookAppointment("standard", today);
    }).toThrow("Appointments must be booked at least 2 hours in advance");
  });

  it("should accept appointments at the end of clinic hours if they finish before closing", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(16, 30, 0, 0); // 4:30 PM PST

    const appointment = schedulingService.bookAppointment("checkin", tomorrow);
    expect(appointment).toBeDefined();
  });

  it("should reject appointments that would end after clinic hours", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(16, 0, 0, 0); // 4 PM PST

    expect(() => {
      schedulingService.bookAppointment("initial", tomorrow); // 90-minute appointment
    }).toThrow("Appointment must be within clinic hours");
  });

  it("should return all available slots for a future date in PST", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const slots = schedulingService.getAvailableSlots(tomorrow, "standard");

    // Verify first slot is at 9 AM PST
    expect(slots[0].getHours()).toBe(9);
    expect(slots[0].getMinutes()).toBe(0);

    // Verify last slot
    const lastSlot = slots[slots.length - 1];
    expect(lastSlot.getHours()).toBe(16); // 4 PM
    expect(lastSlot.getMinutes()).toBe(0);
  });
});
