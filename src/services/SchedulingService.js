const Appointment = require("../models/Appointment");

class SchedulingService {
  constructor() {
    this.appointments = new Map();
    this.clinicTimezoneOffset = -8; // PST offset
  }

  convertToClinicTime(date) {
    const utcDate = new Date(date);
    const clinicDate = new Date(utcDate);
    const offset = this.clinicTimezoneOffset * 60 * 60 * 1000;
    clinicDate.setTime(clinicDate.getTime() + offset);
    return clinicDate;
  }

  isWithinClinicHours(date) {
    const clinicTime = this.convertToClinicTime(date);
    const hours = clinicTime.getUTCHours();
    const minutes = clinicTime.getUTCMinutes();
    return hours >= 9 && (hours < 17 || (hours === 17 && minutes === 0));
  }

  isValidStartTime(date) {
    const clinicTime = this.convertToClinicTime(date);
    const minutes = clinicTime.getUTCMinutes();
    return minutes === 0 || minutes === 30;
  }

  isTwoHoursBeforeNow(date) {
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    return date >= twoHoursFromNow;
  }

  validateAppointmentTime(appointment) {
    // First check the 2-hour advance booking rule
    if (
      appointment.startTime.toDateString() === new Date().toDateString() &&
      !this.isTwoHoursBeforeNow(appointment.startTime)
    ) {
      throw new Error(
        "Appointments must be booked at least 2 hours in advance"
      );
    }

    // Then check valid start time (hour/half-hour)
    if (!this.isValidStartTime(appointment.startTime)) {
      throw new Error("Appointments must start on the hour or half-hour");
    }

    // Finally check clinic hours
    if (!this.isWithinClinicHours(appointment.startTime)) {
      throw new Error("Appointment must be within clinic hours");
    }

    if (!this.isWithinClinicHours(appointment.endTime)) {
      throw new Error("Appointment must be within clinic hours");
    }
  }

  bookAppointment(type, startTime) {
    const appointment = new Appointment(type, startTime);
    this.validateAppointmentTime(appointment);

    // Use the same date key format as getAvailableSlots
    const dateString = appointment.startTime.toISOString().split("T")[0];
    const dateKey = new Date(dateString + "T00:00:00Z").toDateString();

    const existingAppointments = this.appointments.get(dateKey) || [];

    if (
      existingAppointments.some((existing) => existing.overlaps(appointment))
    ) {
      throw new Error("Appointment overlaps with existing booking");
    }

    if (!this.appointments.has(dateKey)) {
      this.appointments.set(dateKey, []);
    }
    this.appointments.get(dateKey).push(appointment);
    return appointment;
  }

  getAvailableSlots(date, type) {
    const appointmentDuration = Object.values(Appointment.TYPES).find(
      (t) => t.name === type
    )?.duration;

    if (!appointmentDuration) {
      throw new Error("Invalid appointment type");
    }

    // Parse the input date and get appointments for both current and next day,
    // because UTC boundaries might span two PST days
    const requestedDate = new Date(date);
    const nextDate = new Date(requestedDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const dateKey = new Date(
      requestedDate.toISOString().split("T")[0] + "T00:00:00Z"
    ).toDateString();
    const nextDateKey = new Date(
      nextDate.toISOString().split("T")[0] + "T00:00:00Z"
    ).toDateString();

    // Get appointments from both days
    const todayAppointments = this.appointments.get(dateKey) || [];
    const nextDayAppointments = this.appointments.get(nextDateKey) || [];
    const existingAppointments = [...todayAppointments, ...nextDayAppointments];

    // Create clinic hours in UTC
    const clinicOpenTime = new Date(requestedDate);
    clinicOpenTime.setUTCHours(17, 0, 0, 0); // 9 AM PST = 17:00 UTC

    const clinicCloseTime = new Date(requestedDate);
    clinicCloseTime.setUTCHours(17 + 8, 0, 0, 0); // 5 PM PST = 1 AM UTC next day

    const slots = [];
    const currentSlot = new Date(clinicOpenTime);

    while (currentSlot < clinicCloseTime) {
      const potentialEndTime = new Date(currentSlot);
      potentialEndTime.setMinutes(
        potentialEndTime.getMinutes() + appointmentDuration
      );

      if (potentialEndTime <= clinicCloseTime) {
        const potentialAppointment = new Appointment(
          type,
          new Date(currentSlot)
        );

        const isOverlapping = existingAppointments.some((existing) =>
          existing.overlaps(potentialAppointment)
        );

        const isTooSoon =
          currentSlot.toDateString() === new Date().toDateString() &&
          !this.isTwoHoursBeforeNow(currentSlot);

        if (!isOverlapping && !isTooSoon) {
          slots.push(new Date(currentSlot));
        }
      }

      currentSlot.setMinutes(currentSlot.getMinutes() + 30);
    }

    return slots;
  }
}

module.exports = SchedulingService;
