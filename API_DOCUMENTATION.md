# Appointment Booking System Backend

This backend provides a complete appointment booking system with MongoDB integration for managing doctor slots and patient appointments.

## Features

- ✅ Create time slots for doctors with flexible scheduling
- ✅ Get available slots for calendar display
- ✅ Book appointments with validation
- ✅ Update appointment status (confirm, cancel, complete)
- ✅ Prevent double booking and past date bookings
- ✅ Transaction support for data consistency

## Setup

### 1. Environment Variables

Create a `.env.local` file in the root directory:

```env
MONGODB_URI=mongodb://localhost:27017/aussiemale
NEXT_PUBLIC_DOCTOR_ID=doctor_001
NEXT_PUBLIC_DOCTOR_NAME=Dr. John Smith
```

For MongoDB Atlas (cloud), use:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aussiemale?retryWrites=true&w=majority
```

### 2. Install Dependencies

```bash
npm install mongoose
```

### 3. Start MongoDB

If using local MongoDB:
```bash
mongod
```

If using MongoDB Atlas, ensure your connection string is correct in `.env.local`.

## API Endpoints

### 1. Create Doctor Slots

**POST** `/api/slots`

Creates time slots for a doctor within a date range.

**Request Body:**
```json
{
  "doctorId": "doctor_001",
  "doctorName": "Dr. John Smith",
  "startDate": "2024-01-15",
  "endDate": "2024-02-15",
  "startTime": "09:00",
  "endTime": "17:00",
  "duration": 60,
  "excludeDays": [0, 6]
}
```

**Parameters:**
- `doctorId`: Unique identifier for the doctor
- `doctorName`: Display name of the doctor
- `startDate`: Start date for slot creation (YYYY-MM-DD)
- `endDate`: End date for slot creation (YYYY-MM-DD)
- `startTime`: Daily start time (HH:MM, 24-hour format)
- `endTime`: Daily end time (HH:MM, 24-hour format)
- `duration`: Slot duration in minutes (default: 60)
- `excludeDays`: Array of days to exclude (0=Sunday, 1=Monday, etc.)

**Response:**
```json
{
  "message": "Successfully created 240 slots",
  "slots": [...]
}
```

### 2. Get Available Slots

**GET** `/api/slots/available`

Retrieves available slots for calendar display.

**Query Parameters:**
- `doctorId`: Filter by doctor ID (optional)
- `month`: Get slots for specific month (YYYY-MM format, optional)
- `date`: Get slots for specific date (YYYY-MM-DD format, optional)

**Response:**
```json
{
  "slotsByDate": {
    "2024-01-15": [
      {
        "_id": "slot_id_1",
        "doctorId": "doctor_001",
        "doctorName": "Dr. John Smith",
        "startTime": "09:00 AM",
        "endTime": "10:00 AM",
        "duration": 60
      }
    ]
  },
  "availableDates": ["2024-01-15", "2024-01-16"],
  "totalSlots": 45
}
```

### 3. Get All Slots

**GET** `/api/slots`

Retrieves all slots with optional filters.

**Query Parameters:**
- `doctorId`: Filter by doctor ID
- `date`: Filter by specific date (YYYY-MM-DD)
- `startDate` & `endDate`: Filter by date range
- `isAvailable`: Filter by availability (true/false)

### 4. Book Appointment

**POST** `/api/appointments`

Books an appointment for a patient.

**Request Body:**
```json
{
  "slotId": "slot_id_1",
  "patientName": "John Doe",
  "patientEmail": "john@example.com",
  "patientMobile": "+1234567890",
  "service": "General Consultation",
  "notes": "First visit"
}
```

**Response:**
```json
{
  "message": "Appointment booked successfully",
  "appointment": {
    "_id": "appointment_id",
    "doctorName": "Dr. John Smith",
    "appointmentDate": "2024-01-15T00:00:00.000Z",
    "appointmentTime": "09:00 AM",
    "service": "General Consultation",
    "status": "confirmed"
  }
}
```

### 5. Get Appointments

**GET** `/api/appointments`

Retrieves appointments with optional filters.

**Query Parameters:**
- `doctorId`: Filter by doctor ID
- `patientEmail`: Filter by patient email
- `date`: Filter by appointment date (YYYY-MM-DD)
- `status`: Filter by status (confirmed/cancelled/completed)

### 6. Update Appointment

**PUT** `/api/appointments/[id]`

Updates appointment status or details.

**Request Body:**
```json
{
  "status": "cancelled",
  "notes": "Patient requested cancellation"
}
```

### 7. Get Specific Appointment

**GET** `/api/appointments/[id]`

Retrieves details of a specific appointment.

### 8. Delete Appointment

**DELETE** `/api/appointments/[id]`

Permanently deletes an appointment and makes the slot available again.

## Data Models

### Slot Schema
```javascript
{
  doctorId: String,
  doctorName: String,
  date: Date,
  startTime: String,
  endTime: String,
  duration: Number,
  isAvailable: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Appointment Schema
```javascript
{
  slotId: ObjectId,
  doctorId: String,
  doctorName: String,
  patientName: String,
  patientEmail: String,
  patientMobile: String,
  service: String,
  appointmentDate: Date,
  appointmentTime: String,
  status: String, // 'confirmed', 'cancelled', 'completed'
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

## Frontend Integration

### Using the API Service

```javascript
import { appointmentAPI, dateUtils } from '@/services/appointmentAPI';

// Get available slots for calendar
const slots = await appointmentAPI.getAvailableSlots({
  doctorId: 'doctor_001',
  month: '2024-01'
});

// Book an appointment
const appointment = await appointmentAPI.bookAppointment({
  slotId: 'slot_id_1',
  patientName: 'John Doe',
  patientEmail: 'john@example.com',
  patientMobile: '+1234567890',
  service: 'General Consultation'
});
```

## Admin Panel

Access the admin panel at `/admin` to create doctor slots:

1. Set doctor information
2. Select date range
3. Set working hours
4. Choose slot duration
5. Exclude non-working days
6. Click "Create Slots"

## Error Handling

The API returns appropriate HTTP status codes:

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `404`: Not Found
- `409`: Conflict (slot unavailable, duplicate booking)
- `500`: Internal Server Error

Error responses include descriptive messages:
```json
{
  "error": "Slot is no longer available"
}
```

## Database Indexes

The system includes optimized indexes for:
- Doctor and date queries
- Patient email lookups
- Slot availability searches

## Transaction Support

Critical operations like booking appointments use MongoDB transactions to ensure data consistency.

## Features

### Validation
- Email format validation
- Phone number validation
- Date/time validation (no past bookings)
- Duplicate booking prevention

### Flexibility
- Configurable slot durations
- Flexible working hours
- Exclude specific days
- Multiple doctors support

### Performance
- Efficient database queries
- Proper indexing
- Optimized calendar data structure
