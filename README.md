# Clinic Scheduling API

A Node.js REST API for managing appointments at a clinic.

## Business Rules

- Clinic operating hours: 9:00 AM - 5:00 PM PST
- Three types of appointments:
  - Initial consultation (90 minutes)
  - Standard appointment (60 minutes)
  - Check-in appointment (30 minutes)
- Only one appointment can be booked at any given time
- Appointments must start on the hour or half-hour
- Appointments must start and end within clinic hours
- Appointments cannot be booked within 2 hours of the start time

## Technical Stack

- Node.js
- Express.js
- Jest (testing)

## Project Structure

```
clinic-scheduler/
├── src/
│   ├── models/
│   │   └── Appointment.js    # Appointment model
│   ├── services/
│   │   └── SchedulingService.js    # Business logic
│   ├── routes/
│   │   └── appointments.js   # API routes
│   └── app.js               # Express application setup
├── tests/
│   └── scheduling.test.js   # Test suite
├── package.json
└── README.md
```

## Installation

1. Clone the repository:

```bash
git clone https://github.com/jorgeOmurillo/clinic_scheduling
cd clinic-scheduler
```

2. Install dependencies:

```bash
yarn install
```

3. Run the tests:

```bash
./node_modules/.bin/jest --watch
```

4. Start the development server:

```bash
yarn dev
```

## API Endpoints

### Get Available Appointment Slots

Returns a list of available appointment times for a specific date and appointment type.

```http
GET /api/appointments/available?date=YYYY-MM-DD&type=<appointment-type>
```

Curl command example:

```
curl "http://localhost:3000/api/appointments/available?date=2024-12-20&type=standard"
```

Parameters:

- `date`: The date to check for availability (YYYY-MM-DD format)
- `type`: Type of appointment (`initial`, `standard`, or `checkin`)

Example response:

```json
{
  "availableSlots": ["2024-12-20T17:00:00.000Z", "2024-12-20T17:30:00.000Z"]
}
```

### Book an Appointment

Creates a new appointment.

```http
POST /api/appointments
```

Curl command example:

```
curl -X POST http://localhost:3000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{"type":"standard","startTime":"2024-12-20T19:00:00.000Z"}'
```

Request body:

```json
{
  "type": "standard",
  "startTime": "2024-12-20T17:00:00.000Z"
}
```

Parameters:

- `type`: Type of appointment (`initial`, `standard`, or `checkin`)
- `startTime`: Start time of the appointment (ISO 8601 format)

Example response:

```json
{
  "type": "standard",
  "startTime": "2024-12-20T17:00:00.000Z",
  "endTime": "2024-12-20T18:00:00.000Z",
  "duration": 60
}
```

### Get Today's Appointments

Returns all appointments scheduled for the current day.

```http
GET /api/appointments/today
```

Curl command example:

```
curl "http://localhost:3000/api/appointments/today"
```

Example response:

```json
{
  "appointments": [
    {
      "type": "standard",
      "startTime": "2024-12-20T17:00:00.000Z",
      "endTime": "2024-12-20T18:00:00.000Z",
      "duration": 60
    }
  ]
}
```

## Testing

Run the test suite:

```bash
./node_modules/.bin/jest --watch
```

## Assumptions

1. All times are handled in PST (UTC-8)
2. Appointments start exactly on the hour or half-hour
3. Data is stored in memory (no persistence)
