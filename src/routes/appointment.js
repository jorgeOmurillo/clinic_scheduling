const express = require("express");
const router = express.Router();
const SchedulingService = require("../services/SchedulingService");

const schedulingService = new SchedulingService();

// GET /api/appointments/available
// Get available appointment slots for a specific date and type
router.get("/available", (req, res) => {
  try {
    const { date, type } = req.query;

    if (!date || !type) {
      return res.status(400).json({
        error: "Date and appointment type are required",
      });
    }

    const requestedDate = new Date(date);

    if (isNaN(requestedDate.getTime())) {
      return res.status(400).json({
        error: "Invalid date format",
      });
    }

    const availableSlots = schedulingService.getAvailableSlots(
      requestedDate,
      type
    );

    const formattedSlots = availableSlots.map((slot) => slot.toISOString());

    res.json({ availableSlots: formattedSlots });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/appointments
// Book a new appointment
router.post("/", (req, res) => {
  try {
    const { type, startTime } = req.body;

    if (!type || !startTime) {
      return res.status(400).json({
        error: "Appointment type and start time are required",
      });
    }

    const appointment = schedulingService.bookAppointment(
      type,
      new Date(startTime)
    );
    res.status(201).json(appointment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/appointments/today
// Get all appointments for today (for practitioner)
router.get("/today", (req, res) => {
  try {
    const today = new Date();
    const appointments =
      schedulingService.appointments.get(today.toDateString()) || [];

    // Sort appointments by start time
    appointments.sort((a, b) => a.startTime - b.startTime);

    res.json({ appointments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
