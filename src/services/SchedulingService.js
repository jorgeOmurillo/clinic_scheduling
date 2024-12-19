const Appointment = require("../models/Appointment");

class SchedulingService {
  constructor() {
    this.appointments = new Map();
    // EST offset during standard time
    this.clinicTimezoneOffset = -5;
  }

  convertToClinicTime(date) {
    const clientDate = new Date(date);
    // Create new date object for clinic time
    const clinicDate = new Date(clientDate.valueOf());
    // Get UTC hours and add clinic offset
    const utcHours = clientDate.getUTCHours();
    clinicDate.setUTCHours(utcHours + this.clinicTimezoneOffset);
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
    return (
      clinicTime.getUTCMinutes() === 0 || clinicTime.getUTCMinutes() === 30
    );
  }

  isTwoHoursBeforeNow(date) {
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    return date >= twoHoursFromNow;
  }

  validateAppointmentTime(appointment) {
    if (
      !this.isWithinClinicHours(appointment.startTime) ||
      !this.isWithinClinicHours(appointment.endTime)
    ) {
      throw new Error("Appointment must be within clinic hours (9:00-17:00)");
    }

    if (!this.isValidStartTime(appointment.startTime)) {
      throw new Error("Appointments must start on the hour or half-hour");
    }

    if (
      appointment.startTime.toDateString() === new Date().toDateString() &&
      !this.isTwoHoursBeforeNow(appointment.startTime)
    ) {
      throw new Error(
        "Appointments must be booked at least 2 hours in advance"
      );
    }
  }

  bookAppointment(type, startTime) {
    const appointment = new Appointment(type, startTime);
    this.validateAppointmentTime(appointment);

    const dateKey = this.convertToClinicTime(
      appointment.startTime
    ).toDateString();
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

    // Convert input date to clinic's timezone
    const requestedDate = new Date(date);
    // Set to midnight of the requested date
    requestedDate.setUTCHours(0, 0, 0, 0);

    const existingAppointments =
      this.appointments.get(requestedDate.toDateString()) || [];

    // Calculate clinic opening time in UTC
    const clinicOpenTime = new Date(requestedDate);
    clinicOpenTime.setUTCHours(14, 0, 0, 0); // 9 AM EST = 14:00 UTC

    // Calculate clinic closing time in UTC
    const clinicCloseTime = new Date(requestedDate);
    clinicCloseTime.setUTCHours(22, 0, 0, 0); // 5 PM EST = 22:00 UTC

    const slots = [];
    const currentSlot = new Date(clinicOpenTime);

    while (currentSlot < clinicCloseTime) {
      // Check if adding the appointment duration would exceed closing time
      const potentialEndTime = new Date(currentSlot);
      potentialEndTime.setMinutes(
        potentialEndTime.getMinutes() + appointmentDuration
      );

      if (potentialEndTime <= clinicCloseTime) {
        const potentialAppointment = new Appointment(
          type,
          new Date(currentSlot)
        );

        // Check for overlapping appointments
        const isOverlapping = existingAppointments.some((existing) =>
          existing.overlaps(potentialAppointment)
        );

        // For same-day appointments, check 2-hour advance booking rule
        const isTooSoon =
          currentSlot.toDateString() === new Date().toDateString() &&
          !this.isTwoHoursBeforeNow(currentSlot);

        if (!isOverlapping && !isTooSoon) {
          slots.push(new Date(currentSlot));
        }
      }

      // Move to next 30-minute slot
      currentSlot.setMinutes(currentSlot.getMinutes() + 30);
    }

    return slots;
  }
}

module.exports = SchedulingService;
