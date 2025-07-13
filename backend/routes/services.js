const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { validateParams, validateQuery, schemas } = require('../middleware/validation');

// Get all available services with current slot availability
router.get('/', async (req, res) => {
  try {
    const { rows: services } = await pool.query(`
      SELECT 
        s.service_id,
        s.name as service_name,
        s.description,
        s.price,
        s.duration as duration_minutes,
        COALESCE(booked_today.booked_count, 0) as booked_slots,
        s.active as is_active
      FROM services s
      LEFT JOIN (
        SELECT 
          bs.service_id,
          COUNT(*) as booked_count
        FROM booking_services bs
        JOIN bookings b ON b.booking_id = bs.booking_id
        WHERE b.start_date <= CURRENT_DATE AND b.end_date >= CURRENT_DATE
        AND b.status IN ('pending', 'confirmed')
        GROUP BY bs.service_id
      ) booked_today ON s.service_id = booked_today.service_id
      WHERE s.active = TRUE
      ORDER BY s.name
    `);
    
    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching services',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get service availability for a specific date
router.get('/availability/:date', validateParams(schemas.dateParam), async (req, res) => {
  try {
    const { date } = req.params;
    
    // Validate date format
    if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return res.status(400).json({ message: 'Invalid date format. Please use YYYY-MM-DD' });
    }

    const { rows: services } = await pool.query(`
      SELECT 
        s.service_id,
        s.name as service_name,
        s.description,
        s.price,
        s.duration as duration_minutes,
        COALESCE(active_bookings.booked_count, 0) as booked_slots,
        s.active as is_active
      FROM services s
      LEFT JOIN (
        SELECT 
          bs.service_id,
          COUNT(*) as booked_count
        FROM booking_services bs
        JOIN bookings b ON b.booking_id = bs.booking_id
        WHERE $1 BETWEEN b.start_date AND b.end_date
        AND b.status IN ('pending', 'confirmed')
        GROUP BY bs.service_id
      ) active_bookings ON s.service_id = active_bookings.service_id
      WHERE s.active = TRUE
      ORDER BY s.name
    `, [date]);
    
    res.json(services);
  } catch (error) {
    console.error('Error fetching service availability:', error);
    res.status(500).json({
      message: 'Error fetching service availability',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Check calendar availability for a specific date
router.get('/calendar-availability/:date', validateParams(schemas.dateParam), async (req, res) => {
  try {
    const { date } = req.params;
    
    // Validate date format
    if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return res.status(400).json({ message: 'Invalid date format. Please use YYYY-MM-DD' });
    }
    
    const { rows: availability } = await pool.query(`
      SELECT 
        date,
        is_available,
        reason,
        notes
      FROM calendar_availability 
      WHERE date = $1
      UNION ALL
      SELECT 
        $2 as date,
        TRUE as is_available,
        NULL as reason,
        NULL as notes
      WHERE NOT EXISTS (
        SELECT 1 FROM calendar_availability WHERE date = $3
      )
    `, [date, date, date]);
    
    if (availability.length > 0) {
      res.json({
      success: true,
      data: availability[0]
    });
    } else {
      res.json({
      success: true,
      data: { date, is_available: true, reason: null, notes: null }
    });
    }
  } catch (error) {
    console.error('Error checking calendar availability:', error);
    res.status(500).json({
      message: 'Error checking calendar availability',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get calendar availability for a date range
router.get('/calendar-availability', validateQuery(schemas.dateRange), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Validate date format
    if (!startDate || !startDate.match(/^\d{4}-\d{2}-\d{2}$/) || 
        !endDate || !endDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return res.status(400).json({ message: 'Invalid date format. Please use YYYY-MM-DD' });
    }
    
    const { rows: availability } = await pool.query(`
      SELECT 
        date,
        is_available,
        reason,
        notes
      FROM calendar_availability
      WHERE date BETWEEN $1 AND $2
      ORDER BY date
    `, [startDate, endDate]);
    
    res.json({
      success: true,
      data: availability
    });
  } catch (error) {
    console.error('Error checking calendar availability range:', error);
    res.status(500).json({
      message: 'Error checking calendar availability range',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
