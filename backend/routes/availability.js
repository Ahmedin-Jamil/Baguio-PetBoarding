/**
 * Availability Routes
 * Handles all routes related to room and service availability
 */

const express = require('express');
const router = express.Router();
const availabilityController = require('../controllers/availabilityController');
const pool = require('../db');
const bookingController = require('../controllers/bookingController');

// Get room availability for a specific date
router.get('/room-availability', availabilityController.getRoomAvailability);

// Check if a specific service is available on a date
router.get('/service-availability', availabilityController.checkServiceAvailability);

// Get unavailable dates for a service
router.get('/unavailable-dates', availabilityController.getUnavailableDates);

// Get calculated unavailable dates (for compatibility with frontend)
router.get('/calculated-unavailable-dates', availabilityController.getUnavailableDates);

// Count bookings by service and room type for a specific date
// This endpoint is needed by the frontend's ServiceAvailabilityContext
router.get('/count-bookings', bookingController.countBookingsByServiceAndRoom);

// GET /api/availability?date=YYYY-MM-DD
router.get('/', async (req, res) => {
  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ success: false, message: 'Date query parameter is required.' });
  }
  try {
    const [results] = await pool.query(
      `SELECT s.service_id, s.service_name, s.slots AS total_slots,
       (s.slots - COALESCE(b.booked_count, 0)) AS available_slots
       FROM services s
       LEFT JOIN (
         SELECT service_id, COUNT(*) AS booked_count
         FROM bookings
         WHERE booking_date = ? AND status IN ('pending', 'confirmed')
         GROUP BY service_id
       ) b ON s.service_id = b.service_id`,
      [date]
    );
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching availability', error: error.message });
  }
});

module.exports = router;
