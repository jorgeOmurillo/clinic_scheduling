const Appointment = require("../models/Appointment");

class SchedulingService {
  constructor() {
    this.appointments = new Map();
  }

  isWithinClinicHours(date) {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return hours >= 9 && (hours < 17 || (hours === 17 && minutes === 0));
  }

  isValidStartTime(date) {
    return date.getMinutes() === 0 || date.getMinutes() === 30;
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

    // Check for overlapping appointments
    const dateKey = appointment.startTime.toDateString();
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
    const appointmentDuration =
      Appointment.TYPES[type]?.duration ||
      Object.values(Appointment.TYPES).find((t) => t.name === type)?.duration;

    if (!appointmentDuration) {
      throw new Error("Invalid appointment type");
    }

    const slots = [];
    const requestedDate = new Date(date);
    const existingAppointments =
      this.appointments.get(requestedDate.toDateString()) || [];

    // Start from 9 AM
    const startTime = new Date(requestedDate.setHours(9, 0, 0, 0));
    // End at 5 PM
    const endTime = new Date(requestedDate.setHours(17, 0, 0, 0));

    // Check every 30-minute slot
    const currentSlot = new Date(startTime);
    while (currentSlot < endTime) {
      const potentialAppointment = new Appointment(type, currentSlot);

      // Skip if the appointment would end after clinic hours
      if (potentialAppointment.endTime > endTime) {
        break;
      }

      // Check if the slot is available
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

      // Move to next slot
      currentSlot.setMinutes(currentSlot.getMinutes() + 30);
    }

    return slots;
  }
}

module.exports = SchedulingService;
