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

    // TODO: Implement getAvailableSlots in SchedulingService
    const availableSlots = schedulingService.getAvailableSlots(
      requestedDate,
      type
    );

    res.json({ availableSlots });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


module.exports = router;
