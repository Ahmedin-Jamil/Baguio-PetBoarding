/**
 * Bookings Routes
 * Handles all routes related to bookings
 */
const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

const emailService = require('../services/emailService');
const bookingController = require('../controllers/bookingController'); // Flattened schema controller

// Flattened schema booking creation route (declared early to override legacy implementation)
// Flattened schema booking creation route
router.post('/', (req, res, next) => {
  console.log('ROUTE: Received POST /api/bookings request');
  console.log('ROUTE: Request body:', req.body);
  return bookingController.createBooking(req, res, next);
});

// Add middleware to ensure consistent service type handling for all routes
// This will be applied to all bookings routes
router.use((req, res, next) => {
  // Store the original json method to enhance it
  const originalJson = res.json;
  
  // Override the json method to enhance booking data
  res.json = function(data) {
    // Check if this is a booking response with data
    // If response is wrapped like { data: ... }
    if (data && data.data !== undefined) {
      enhanceBookingData(data.data);
    } else {
      // data itself may be a booking object, an array of bookings, or something else
      enhanceBookingData(data);
    }
    // Helper to enhance booking(s)
    function enhanceBookingData(payload) {
      if (!payload) return;

      // If array
      if (Array.isArray(payload)) {
        payload.forEach(enhanceSingleBooking);
      } else if (typeof payload === 'object') {
        enhanceSingleBooking(payload);
      }
    }

    function enhanceSingleBooking(booking) {
      if (!booking || typeof booking !== 'object') return;
      // Map serviceId
      if (booking.service_id && !booking.serviceId) {
        booking.serviceId = booking.service_id;
      }
      // Derive is_daycare using service_id, serviceId, or service_type
      if ((booking.service_id === 4 || booking.serviceId === 4 || booking.service_type === 'daycare') && booking.is_daycare !== 1) {
        booking.is_daycare = 1;
      }
      // Derive serviceType
      if (booking.is_daycare === 1 || booking.is_daycare === true || booking.service_id === 4 || booking.serviceId === 4 || booking.service_type === 'daycare') {
        booking.serviceType = 'daycare';
      } else if (booking.service_type && !booking.serviceType) {
        booking.serviceType = booking.service_type;
      } else if (!booking.serviceType) {
        booking.serviceType = 'overnight';
      }
    }

    // Call the original json method
    return originalJson.call(this, data);
  };
  
  next();
});

// Validation and normalization functions
const validateBookingData = (booking) => {
    const errors = [];

    // Validate pet information
    if (booking.guest_pet) {
        if (!booking.guest_pet.pet_type) {
            errors.push('Pet type is required');
        }
    }

    // Validate guest information for guest bookings
    if (booking.guest_booking_only && booking.guest_user) {
        if (!booking.guest_user.email) {
            errors.push('Guest email is required');
        }
        if (!booking.guest_user.phone) {
            errors.push('Guest phone is required');
        }
    }

    // Validate dates and times
    if (!booking.booking_date || !booking.end_date) {
        errors.push('Both start and end dates are required');
    }

    // Validate time format
    const timeRegex = /^(?:\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?|\d{2}:\d{2})$/;
    if (!booking.start_time || !timeRegex.test(booking.start_time)) {
        errors.push('Invalid start time format. Use either 24-hour (HH:mm) or 12-hour (HH:mm AM/PM) format');
    }
    if (!booking.end_time || !timeRegex.test(booking.end_time)) {
        errors.push('Invalid end time format. Use either 24-hour (HH:mm) or 12-hour (HH:mm AM/PM) format');
    }

    return errors;
};

// Function to convert various time formats to 24-hour format
const to24HourFormat = (timeStr) => {
    if (!timeStr) return null;
    
    // If it's already in 24-hour format (HH:mm or HH:mm:ss)
    if (/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/.test(timeStr)) {
        // Ensure it has seconds
        if (timeStr.split(':').length === 2) {
            return `${timeStr}:00`;
        }
        return timeStr;
    }
    
    // Handle 12-hour format with AM/PM
    const match = timeStr.match(/^(\d{1,2})(?::(\d{2}))?(\s*[AP]M)$/i);
    if (match) {
        let hours = parseInt(match[1], 10);
        const minutes = match[2] ? match[2] : '00';
        const isPM = match[3].trim().toUpperCase() === 'PM';
        
        if (isPM && hours < 12) {
            hours += 12;
        } else if (!isPM && hours === 12) {
            hours = 0;
        }
        
        return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
    }
    
    // If format is not recognized, return a default time
    console.log(`Warning: Unrecognized time format '${timeStr}', using default time`);
    return '12:00:00';
};


const normalizeBookingData = (booking) => {
    // Normalize pet data
    const pet = {
        name: booking.guest_pet?.pet_name || '',
        type: booking.guest_pet?.pet_type || booking.pet_type || '',
        breed: booking.guest_pet?.breed || '',
        gender: booking.guest_pet?.gender || ''
    };

    // Normalize guest data
    const guest = booking.guest_booking_only ? {
        first_name: booking.guest_user?.first_name || '',
        last_name: booking.guest_user?.last_name || '',
        email: booking.guest_user?.email || '',
        phone: booking.guest_user?.phone || '',
        address: booking.guest_user?.address || ''
    } : null;

    // Normalize room type
    const roomType = normalizeRoomType(booking.room_type);

    return {
        guest_booking_only: booking.guest_booking_only,
        pet_type: pet.type,
        booking_date: booking.booking_date,
        end_date: booking.end_date,
        start_time: to24HourFormat(booking.start_time),
        end_time: to24HourFormat(booking.end_time),
        special_requests: booking.special_requests || '',
        room_type: roomType,
        guest_user: guest,
        guest_pet: {
            ...pet,
            pet_name: pet.name,
            pet_type: pet.type,
            pet_breed: pet.breed
        }
    };
};

// Utility functions for data validation and normalization
function normalizeRoomType(roomType) {
  if (!roomType) return null;
  const val = roomType.toString().trim().toLowerCase().replace(/_/g, ' ');
  if (val === 'deluxe' || val === 'deluxe room') return 'Deluxe Room';
  if (val === 'premium' || val === 'premium room') return 'Premium Room';
  if (val === 'executive' || val === 'executive room') return 'Executive Room';
  // Accept partials for robustness
  if (val.includes('deluxe')) return 'Deluxe Room';
  if (val.includes('premium')) return 'Premium Room';
  if (val.includes('executive')) return 'Executive Room';
  return null;
}

// --- UTC ISO 8601 Date Utilities ---
/**
 * Extracts 'YYYY-MM-DD' from an ISO 8601 string or returns the input if already in that format
 * @param {string} isoString
 * @returns {string|null}
 */
function isoToMySQLDate(isoString) {
  if (!isoString) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoString)) return isoString;
  if (/^\d{4}-\d{2}-\d{2}T/.test(isoString)) return isoString.slice(0, 10);
  return null;
}

/**
 * Validates if a string is a UTC ISO 8601 string (YYYY-MM-DDTHH:MM:SS.sssZ)
 * @param {string} dateStr
 * @returns {boolean}
 */
function isValidUTCDateString(dateStr) {

  return typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(dateStr);
}
function toUTCISOString(date, time = '12:00') {
  // Accepts date as YYYY-MM-DD and time as HH:MM (24h)
  // Always use noon (12:00) as default time to avoid timezone shifts
  if (!date) return null;
  let d;
  
  try {
    if (typeof date === 'string') {
      if (date.includes('T')) {
        // Parse ISO string and adjust to local noon
        d = new Date(date);
      } else {
        // Parse YYYY-MM-DD format
        const [year, month, day] = date.split('-').map(Number);
        // Create date at local noon
        d = new Date(year, month - 1, day);
      }
    } else if (date instanceof Date) {
      d = new Date(date);
    } else {
      return null;
    }

    // Set to local noon (12:00)
    const localNoon = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0);
    
    // Add timezone offset to ensure it stays at noon UTC
    const timezoneOffset = localNoon.getTimezoneOffset() * 60000; // Convert to milliseconds
    const noonUTC = new Date(localNoon.getTime() + timezoneOffset);
    
    return noonUTC.toISOString();
  } catch (err) {
    console.error('Error converting date to UTC ISO:', err);
    return null;
  }
}

// Get public booking availability
router.get('/', async (req, res) => {
  try {
    const { date } = req.query;
    
    let query = `
      SELECT 
        b.booking_id,
        COALESCE(b.reference_number, CONCAT('BPB', DATE_FORMAT(b.created_at, '%y%m%d'), LPAD(b.booking_id, 4, '0'))) as reference_number,
        DATE_FORMAT(b.start_date, '%Y-%m-%d') as start_date,
        DATE_FORMAT(b.end_date, '%Y-%m-%d') as end_date,
        b.start_time,
        b.end_time,
        b.status,
        b.special_requests,
        b.admin_notes,
        b.room_type,
        DATE_FORMAT(b.created_at, '%Y-%m-%d %H:%i:%s') as created_at,
        b.owner_first_name as customer_first_name,
        b.owner_last_name as customer_last_name,
        b.owner_email as customer_email,
        b.owner_phone as customer_phone,
        b.owner_address as customer_address,
        b.pet_name,
        b.pet_type,
        b.weight_category,
        b.breed,
        b.gender AS sex,

        s.service_name,
        s.service_type,
        sc.category_name
      FROM bookings b
      
      
      JOIN services s ON b.service_id = s.service_id
      JOIN service_categories sc ON s.category_id = sc.category_id
    `;
    
    const queryParams = [];
    
    if (date) {
      query += ' WHERE b.start_date = ?';
      queryParams.push(date);
    }
    
    query += ' ORDER BY b.created_at DESC';
    
    const [bookings] = await pool.query(query, queryParams);
    
    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get all pending bookings (admin)
router.get('/pending', async (req, res) => {
  try {
    const [bookings] = await pool.query(`
      SELECT 
        b.booking_id,
        COALESCE(b.reference_number, CONCAT('BPB', DATE_FORMAT(b.created_at, '%y%m%d'), LPAD(b.booking_id, 4, '0'))) as reference_number,
        DATE_FORMAT(b.start_date, '%Y-%m-%d') as start_date,
        DATE_FORMAT(b.end_date, '%Y-%m-%d') as end_date,
        b.start_time,
        b.end_time,
        b.status,

        b.special_requests,
        b.room_type,

        DATE_FORMAT(b.created_at, '%Y-%m-%d %H:%i:%s') as created_at,
        b.owner_first_name as first_name,
        b.owner_last_name as last_name,
        b.owner_email as email,
        b.owner_phone as phone,
        b.owner_address as address,
        b.pet_name,
        b.pet_type,
        b.weight_category,
        b.breed,
        b.gender AS sex,

        s.service_name,
        s.service_type,
        sc.category_name
      FROM bookings b
      
      
      JOIN services s ON b.service_id = s.service_id
      JOIN service_categories sc ON s.category_id = sc.category_id
      WHERE b.status = 'pending'
      ORDER BY b.created_at ASC
    `);
    
    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching pending bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get bookings by email or booking_id
router.get('/search', async (req, res) => {
  try {
    // Accept both camelCase and snake_case for reference number
    const email = req.query.email;
    let reference_number = req.query.reference_number || req.query.referenceNumber;

    if (!email && !reference_number) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either email or reference number'
      });
    }
    
    let query = `
      SELECT 
        b.booking_id,
        COALESCE(b.reference_number, CONCAT('BPB', DATE_FORMAT(b.created_at, '%y%m%d'), LPAD(b.booking_id, 4, '0'))) as reference_number,
        DATE_FORMAT(b.start_date, '%Y-%m-%d') as start_date,
        DATE_FORMAT(b.end_date, '%Y-%m-%d') as end_date,
        b.start_time,
        b.end_time,
        b.status,

        b.special_requests,
        b.room_type,

        DATE_FORMAT(b.created_at, '%Y-%m-%d %H:%i:%s') as created_at,
        b.owner_first_name as first_name,
        b.owner_last_name as last_name,
        b.owner_email as email,
        b.owner_phone as phone,
        b.owner_address as address,
        b.pet_name,
        b.pet_type,
        b.weight_category,
        b.breed,
        b.gender AS sex,

        s.service_name,
        s.service_type,
        sc.category_name
      FROM bookings b
      
      
      JOIN services s ON b.service_id = s.service_id
      JOIN service_categories sc ON s.category_id = sc.category_id
      WHERE 
    `;
    
    const params = [];
    
    if (email) {
      query += 'b.owner_email = ?';
      params.push(email);
    } else {
      // Remove # prefix if present and convert to uppercase
      const cleanRef = reference_number.replace(/^#/, '').toUpperCase();
      // Allow matching multiple related bookings created in the same transaction (same prefix, last 4 digits differ)
      const refPrefix = cleanRef.length > 4 ? cleanRef.slice(0, -4) : cleanRef;
      query += '((b.reference_number = ?) OR (b.reference_number LIKE ?) OR (CONCAT(\'BPB\', DATE_FORMAT(b.created_at, \'%y%m%d\'), LPAD(b.booking_id, 4, \'0\')) = ?) )';
      params.push(cleanRef, `${refPrefix}%`, cleanRef);
    }
    
    query += ' ORDER BY b.created_at DESC';
    
    const [bookings] = await pool.query(query, params);
    
    if (bookings.length === 0) {
      return res.status(404).json({
        success: false, 
        message: email 
          ? `No bookings found for email ${email}` 
          : reference_number
          ? `No booking found with reference number ${reference_number}`
          : `No booking found with ID ${booking_id}`
      });
    }
    
    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('Error searching bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Create a new booking (public endpoint)
// Legacy route retained for reference but now mounted under /legacy to avoid duplication
router.post('/legacy', async (req, res) => {
  const connection = await pool.getConnection();
  console.log('Incoming booking payload:', JSON.stringify(req.body, null, 2));

  // Validate booking data
  const validationErrors = validateBookingData(req.body);
  if (validationErrors.length > 0) {
      return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validationErrors
      });
  }

  // Normalize booking data
  const normalizedBooking = normalizeBookingData(req.body);
  console.log('Normalized booking data:', JSON.stringify(normalizedBooking, null, 2));
  
  // Use the normalized data for further processing
  req.body = { ...req.body, ...normalizedBooking };
  
  // Set default service_id for cats if not provided
  if ((req.body.pet_type?.toLowerCase() === 'cat' || req.body.guest_pet?.pet_type?.toLowerCase() === 'cat') && !req.body.service_id) {
    req.body.service_id = 1; // Assuming 1 is the boarding service ID
    console.log('Setting default service_id=1 for cat booking');
  }
  

  try {
    // Skip the UTC ISO conversion - we'll use simple YYYY-MM-DD format
    console.log('Using normalized dates and times:', {
      booking_date: req.body.booking_date,
      end_date: req.body.end_date,
      start_time: req.body.start_time,
      end_time: req.body.end_time
    });
  } catch (dateErr) {
    connection.release();
    return res.status(400).json({ success: false, message: 'Date processing error', error: dateErr.message });
  }

  try {
    await connection.beginTransaction();

    const {
      ownerName,
      ownerEmail,
      ownerPhone,
      petName,
      petType,
      petBreed,
      service_id,
      booking_date,
      end_date,
      start_time,
      end_time,
      special_requests,
      status,
      room_type,
      user_id,
      pet_id,
      // Support for camelCase from frontend
      serviceId,
      bookingDate,
      endDate,
      startTime,
      endTime,
      specialRequests,
      roomType,
      userId: userIdCamel,
      petId: petIdCamel
    } = req.body;

    const finalServiceId = service_id || serviceId;
    const finalBookingDate = booking_date || bookingDate;
    const finalEndDate = end_date || endDate;
    const finalStartTime = start_time || startTime;
    const finalEndTime = end_time || endTime;

    const finalSpecialRequests = special_requests || specialRequests;
    
    // Check if this is a daycare booking
    const isDaycareBooking = finalServiceId === 4;
    console.log('Is daycare booking:', isDaycareBooking);
    
    // Add a daycare flag to the booking data
    const is_daycare = isDaycareBooking ? 1 : 0;
    
    // Get and normalize the room type
    let finalRoomTypeRaw = room_type || roomType;
    console.log('Raw room type value:', finalRoomTypeRaw);
    
    // For daycare service, use a default room type since column can't be NULL
    if (isDaycareBooking) {
      finalRoomTypeRaw = 'Deluxe Room'; // Default to Deluxe Room for daycare
      console.log('Setting default room type for daycare booking (DB requires non-NULL value)');
    }
    
    // For non-daycare services, validate room type
    if (!isDaycareBooking && (!finalRoomTypeRaw || 
        !['deluxe room', 'premium room', 'executive room'].includes(finalRoomTypeRaw.toLowerCase()))) {
      await connection.rollback();
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or missing room type. Must be one of: Deluxe Room, Premium Room, Executive Room.' 
      });
    }
    
    // Final normalized room type
    const finalRoomType = finalRoomTypeRaw;
    console.log('Final room type:', finalRoomType);
    let finalUserId = user_id || userIdCamel;
    let finalPetId = pet_id || petIdCamel;

    if (!finalServiceId || !finalBookingDate) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Missing required booking information: serviceId and bookingDate are required.'
      });
    }

    // Variables for guest information - will be used for both user creation and booking record
    let ownerNameFinal = ownerName || req.body.owner_name || '';
    let ownerEmailFinal = ownerEmail || req.body.owner_email || '';
    let ownerPhoneFinal = ownerPhone || req.body.owner_phone || '';
    let ownerAddressFinal = req.body.owner_address || null;
    let guestFirstName = '';
    let guestLastName = '';
    
    // If still missing, check for guest_user object (from frontend)
    if ((!ownerNameFinal || !ownerEmailFinal) && req.body.guest_user) {
      ownerNameFinal = req.body.guest_user.name || req.body.guest_user.first_name || '';
      ownerEmailFinal = req.body.guest_user.email || '';
      ownerPhoneFinal = req.body.guest_user.phone || '';
      ownerAddressFinal = req.body.guest_user.address || ownerAddressFinal;
    }
    
    // Split the owner name into first and last name
    if (ownerNameFinal) {
      const nameParts = ownerNameFinal.split(' ');
      guestFirstName = nameParts[0] || 'Guest';
      guestLastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    } else {
      // Ensure we have a non-null first name
      guestFirstName = 'Guest';
    }
    
    // Handle guest user creation if no user_id is provided
    if (!finalUserId) {
      const [existingUser] = await connection.query('SELECT user_id FROM users WHERE email = ?', [ownerEmailFinal]);
      if (existingUser.length > 0) {
        finalUserId = existingUser[0].user_id;
      } else if (ownerEmailFinal) {
        // Only create a user if we have an email
        const [newUser] = await connection.query(
          'INSERT INTO users (first_name, last_name, email, phone, address) VALUES (?, ?, ?, ?, ?)',
          [guestFirstName, guestLastName, ownerEmailFinal, ownerPhoneFinal || null, ownerAddressFinal]
        );
        finalUserId = newUser.insertId;
      }
    }

    // Handle guest pet creation if no pet_id is provided
    if (!finalPetId) {
      // Check for guest_pet object from frontend
      let petNameFinal = petName || '';
      let petTypeFinal = petType || 'Dog';
      let petBreedFinal = petBreed || null;
      let petGender = null;
      
      // Extract pet data from guest_pet if available
      if (req.body.guest_pet) {
        petNameFinal = req.body.guest_pet.pet_name || req.body.guest_pet.petName || petNameFinal;
        petTypeFinal = req.body.guest_pet.pet_type || req.body.guest_pet.petType || petTypeFinal;
        petBreedFinal = req.body.guest_pet.breed || petBreedFinal;
        petGender = req.body.guest_pet.gender || req.body.guest_pet.sex || null;
      } else {
        // Extract from direct fields if guest_pet is not available
        petNameFinal = petName || req.body.pet_name || '';
        petTypeFinal = petType || req.body.pet_type || 'Dog';
        petBreedFinal = petBreed || req.body.breed || null;
        petGender = req.body.pet_gender || req.body.petGender || req.body.gender || req.body.sex || null;
      }
      
      // Use a default pet name if none is provided
      if (!petNameFinal) {
        petNameFinal = `${petTypeFinal} of ${ownerNameFinal || 'Guest'}`;
      }
      
      // Normalize pet type to ensure we handle both dogs and cats
      let normalizedPetType = 'Dog'; // Default
      if (petTypeFinal) {
        const petTypeLower = petTypeFinal.toLowerCase();
        if (petTypeLower.includes('cat')) {
          normalizedPetType = 'Cat';
        } else if (petTypeLower.includes('dog')) {
          normalizedPetType = 'Dog';
        } else {
          // Keep whatever was provided if not clearly a dog or cat
          normalizedPetType = petTypeFinal;
        }
      }
      
      console.log('Creating new pet with data:', {
        user_id: finalUserId,
        pet_name: petNameFinal,
        pet_type: normalizedPetType,
        breed: petBreedFinal,
        gender: petGender,
      });
      
      try {
        // Normalize gender to match database ENUM
        let normalizedGender = null;
        if (petGender) {
          const g = petGender.toString().trim().toLowerCase();
          if (/^(m|male)$/.test(g)) {
            normalizedGender = 'Male';
          } else if (/^(f|female)$/.test(g)) {
            normalizedGender = 'Female';
          }
        }

        console.log('Using normalized gender:', normalizedGender);

        const [newPet] = await connection.query(
          'INSERT INTO pets (user_id, pet_name, pet_type, breed, gender) VALUES (?, ?, ?, ?, ?)',
          [finalUserId, petNameFinal, normalizedPetType, petBreedFinal, normalizedGender]
        );
        finalPetId = newPet.insertId;
        console.log(`Created new pet with ID: ${finalPetId}`);
      } catch (petError) {
        console.error('Error creating pet:', petError);
        await connection.rollback();
        return res.status(500).json({
          success: false,
          message: 'Failed to create pet record',
          error: process.env.NODE_ENV === 'development' ? petError.message : 'Database Error'
        });
      }
    }

    // Parse dates and ensure they're in local noon time
    let mysqlStartDate, mysqlEndDate;
    
    try {
      // If dates are already in YYYY-MM-DD format, use them directly
      if (/^\d{4}-\d{2}-\d{2}$/.test(finalBookingDate)) {
        mysqlStartDate = finalBookingDate;
      } else {
        // Create date at local noon to avoid timezone issues
        const startDate = new Date(finalBookingDate);
        mysqlStartDate = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
      }

      // Handle end date similarly
      const endDateToUse = finalEndDate || finalBookingDate;
      if (/^\d{4}-\d{2}-\d{2}$/.test(endDateToUse)) {
        mysqlEndDate = endDateToUse;
      } else {
        const endDate = new Date(endDateToUse);
        mysqlEndDate = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
      }

      if (!mysqlStartDate || !mysqlEndDate) {
        throw new Error('Failed to parse dates');
      }
    } catch (err) {
      console.error('Error parsing dates:', err);
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Please provide dates in YYYY-MM-DD format.'
      });
    }

    // Log all values before insert to verify
    console.log('About to insert booking with values:', {
      userId: finalUserId,
      petId: finalPetId,
      serviceId: finalServiceId,
      isDaycare: is_daycare,
      startDate: mysqlStartDate,
      endDate: mysqlEndDate,
      startTime: finalStartTime || '09:00',
      endTime: finalEndTime || '17:00',

      specialRequests: finalSpecialRequests || '',
      status: status || 'pending',
      roomType: finalRoomType
    });
    
    // Set guest information for the booking record if this was a guest booking
    let guestEmail = null;
    let guestPhone = null;
    let guestAddress = null;
    
    // Check if this was a guest booking (we have the original guest info)
    if (!user_id && !userIdCamel) {
      guestEmail = ownerEmailFinal;
      guestPhone = ownerPhoneFinal;
      guestAddress = ownerAddressFinal;
    }
    

    const [newBooking] = await connection.query(
      `INSERT INTO bookings (
        user_id, pet_id, service_id, start_date, end_date, 
        start_time, end_time, special_requests, status, room_type,
        guest_first_name, guest_last_name, guest_email, guest_phone, guest_address,
        is_daycare
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        finalUserId,
        finalPetId,
        finalServiceId,
        mysqlStartDate,
        mysqlEndDate,
        to24HourFormat(finalStartTime) || '09:00:00',
        to24HourFormat(finalEndTime) || '17:00:00',
        finalSpecialRequests || '',
        status || 'pending',
        finalRoomType, // This must be the normalized value
        guestFirstName,
        guestLastName,
        guestEmail,
        guestPhone,
        guestAddress,
        is_daycare // Add daycare flag to clearly distinguish service type
      ]
    );

    // Generate a unique reference number using timestamp and booking ID
    const now = new Date();
    // Use compact date format YYMMDD
    const dateStr = now.getFullYear().toString().slice(2) + 
                  (now.getMonth() + 1).toString().padStart(2, '0') + 
                  now.getDate().toString().padStart(2, '0');
    
    // Use timestamp (last 5 digits) and booking ID for guaranteed uniqueness
    const timestamp = Date.now().toString().slice(-5);
    const referenceNumber = `BPB${dateStr}${timestamp}${String(newBooking.insertId).padStart(4, '0')}`;
    
    // Define a variable to hold the reference number (whether it's stored in DB or not)
    let finalReferenceNumber = referenceNumber;
    
    // Check if reference_number column exists in the database
    try {
      // Try to update with reference number if the column exists
      await connection.query(
        'UPDATE bookings SET reference_number = ? WHERE booking_id = ?',
        [referenceNumber, newBooking.insertId]
      );
      
      console.log(`Generated reference number: ${referenceNumber} for booking ID: ${newBooking.insertId}`);
    } catch (refError) {
      // If column doesn't exist, just log and continue
      if (refError.code === 'ER_BAD_FIELD_ERROR') {
        console.log('Reference number column does not exist. Skipping reference number generation.');
      } else {
        // If it's another error, log it but don't fail the booking
        console.error('Error setting reference number:', refError.message);
      }
    }

    await connection.commit();

    // Fetch details for email confirmation
    const [userData] = await connection.query('SELECT * FROM users WHERE user_id = ?', [finalUserId]);
    const [petData] = await connection.query('SELECT * FROM pets WHERE pet_id = ?', [finalPetId]);
    const [serviceData] = await connection.query('SELECT service_name FROM services WHERE service_id = ?', [finalServiceId]);

    try {
      await emailService.sendBookingConfirmation({
        user: userData[0],
        pet: petData[0],
        bookingDate: finalBookingDate,
        startTime: finalStartTime,
        endTime: finalEndTime,

        specialRequests: finalSpecialRequests,
        serviceName: serviceData[0]?.service_name || 'Pet Service',
        bookingId: newBooking.insertId,
        room_type: finalRoomType
      });
      console.log('Booking confirmation email sent successfully.');
    } catch (emailError) {
      console.error('Failed to send booking confirmation email:', emailError);
    }

    // Fetch the complete booking data to return to the client
    const [bookingData] = await connection.query(
      `SELECT b.*, 
        b.owner_first_name, b.owner_last_name, b.owner_email, b.owner_phone, b.owner_address,
        b.pet_name, b.pet_type, b.breed, b.gender AS sex
      FROM bookings b
      
      
      WHERE b.booking_id = ?`,
      [newBooking.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Booking created successfully!',
      data: {
        ...bookingData[0],
        bookingId: newBooking.insertId,
        reference_number: finalReferenceNumber,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while creating the booking.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error'
    });
  }
});

// Generic booking update (e.g., extend booking end date, update times, room type)
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      end_date,
      start_date,
      start_time,
      end_time,
      room_type,
      special_requests
    } = req.body;

    // Build dynamic SET clause safely
    const fields = [];
    const params = [];

    if (end_date) {
      // Expecting YYYY-MM-DD format (validated on frontend)
      fields.push('end_date = ?');
      params.push(end_date);
    }
    if (start_date) {
      fields.push('start_date = ?');
      params.push(start_date);
    }
    if (start_time) {
      fields.push('start_time = ?');
      params.push(start_time);
    }
    if (end_time) {
      fields.push('end_time = ?');
      params.push(end_time);
    }
    if (room_type) {
      fields.push('room_type = ?');
      params.push(room_type);
    }
    if (special_requests !== undefined) {
      fields.push('special_requests = ?');
      params.push(special_requests);
    }

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided for update.'
      });
    }

    // Add booking_id param for WHERE clause
    params.push(id);

    const updateQuery = `UPDATE bookings SET ${fields.join(', ')} WHERE booking_id = ?`;
    const [result] = await pool.query(updateQuery, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Return the updated booking record
    const [updatedRows] = await pool.query(
      'SELECT * FROM bookings WHERE booking_id = ?',
      [id]
    );

    return res.json({
      success: true,
      message: 'Booking updated successfully',
      data: updatedRows[0]
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating booking',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update booking status (confirm, cancel, complete)
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, adminId, reason } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid status value',
        validValues: validStatuses
      });
    }
    
    let query;
    let params;
    
    switch (status) {
      case 'confirmed':
        query = `
          UPDATE bookings 
          SET 
            status = 'confirmed',
            confirmed_by = ?,
            confirmed_at = CURRENT_TIMESTAMP,
            admin_notes = ?
          WHERE booking_id = ?
        `;
        params = [adminId || null, notes || null, id];
        break;
        
      case 'cancelled':
        query = `
          UPDATE bookings 
          SET 
            status = 'cancelled',
            cancelled_by = ?,
            cancelled_at = CURRENT_TIMESTAMP,
            cancellation_reason = ?,
            admin_notes = ?
          WHERE booking_id = ?
        `;
        params = [adminId || null, reason || null, notes || null, id];
        break;
        
      case 'completed':
        query = `
          UPDATE bookings 
          SET 
            status = 'completed',
            completed_at = CURRENT_TIMESTAMP,
            admin_notes = ?
          WHERE booking_id = ?
        `;
        params = [notes || null, id];
        break;
        
      default:
        query = `
          UPDATE bookings 
          SET 
            status = ?,
            admin_notes = ?
          WHERE booking_id = ?
        `;
        params = [status, notes || null, id];
    }
    
    const [result] = await pool.query(query, params);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false, 
        message: 'Booking not found'
      });
    }
    
    // Send status update email (non-blocking)
    (async () => {
      try {
        const [bookingRows] = await pool.query(`
          SELECT b.*, s.service_name
          FROM bookings b
          LEFT JOIN services s ON b.service_id = s.service_id
          WHERE b.booking_id = ?`, [id]);
        if (bookingRows.length) {
          await emailService.sendBookingStatusUpdate({ ...bookingRows[0], status });
        }
      } catch (emailErr) {
        console.error('Failed to send booking status update email:', emailErr.message);
      }
    })();

    // Notify frontend client that status was updated successfully
    return res.json({
      success: true,
      message: `Booking status updated to ${status} successfully`,
      data: { status }
    });

    /* Legacy block commented out during flattened-schema migration
    const [bookingDetails] = await pool.query(`
      SELECT 
        b.*, 
        b.room_type,
        u.first_name, u.last_name, u.email, u.phone,

// Get booking details for the email
const [bookingDetails] = await pool.query(`
  SELECT 
    b.booking_id,
    b.start_date,
    b.end_date,
    b.start_time,
    b.end_time,
    b.special_requests,
    b.status,
    b.room_type,
    b.pet_name,
    s.service_name
  FROM bookings b
  
  
  LEFT JOIN services s ON b.service_id = s.service_id
  WHERE b.booking_id = ?
`, [id]);

// ...

// Get updated booking details for response
const [updatedBooking] = await pool.query(
  `SELECT 
    b.booking_id,
    DATE_FORMAT(b.start_date, '%Y-%m-%d') as start_date,
    DATE_FORMAT(b.end_date, '%Y-%m-%d') as end_date,
    b.status,
    b.room_type,
    b.pet_name,
    s.service_name
  FROM bookings b
  
  
  LEFT JOIN services s ON b.service_id = s.service_id
  WHERE b.booking_id = ?`,
  [id]
);

// ...
      message: 'Booking extended successfully',
      data: updatedBooking[0]
     });
*/
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating booking status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});


module.exports = router;