class Appointment {
  static TYPES = {
    INITIAL_CONSULTATION: { name: "initial", duration: 90 },
    STANDARD: { name: "standard", duration: 60 },
    CHECK_IN: { name: "checkin", duration: 30 },
  };

  constructor(type, startTime) {
    if (!Object.values(Appointment.TYPES).find((t) => t.name === type)) {
      throw new Error("Invalid appointment type");
    }
    this.type = type;
    // Store the original UTC time
    this.startTime = new Date(startTime);
    this.duration = this.getDuration();
    this.endTime = this.calculateEndTime();
  }

  getDuration() {
    return Object.values(Appointment.TYPES).find((t) => t.name === this.type)
      .duration;
  }

  calculateEndTime() {
    const endTime = new Date(this.startTime);
    endTime.setMinutes(endTime.getMinutes() + this.duration);
    return endTime;
  }

  overlaps(other) {
    return this.startTime < other.endTime && this.endTime > other.startTime;
  }
}

module.exports = Appointment;
