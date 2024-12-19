const express = require("express");
const appointmentRoutes = require("./routes/appointment");

const app = express();
app.use(express.json());

// Register routes
app.use("/api/appointments", appointmentRoutes);

const PORT = process.env.PORT || 3000;

// Only start the server if this file is run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
