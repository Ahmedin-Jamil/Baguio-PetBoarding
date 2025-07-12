import React, { createContext, useState, useEffect, useContext } from 'react';
import { formatDateForAPI, formatDateForDisplay, formatDateForMySQL, createConsistentDate } from '../utils/dateUtils';
import { API_URL } from '../config';

// Add this constant at the top of your file with other constants
// It's good practice for true constants to be outside the component if they don't depend on component state/props.
const MAX_GENERAL_CAPACITY = 50; // Renamed to be more specific, as you have other MAX_SLOTS

// Utility: Convert a time string (e.g., "10:00 AM", "17:00") to 24-hour "HH:MM:SS" format expected by MySQL
const to24Hour = (timeStr) => {
  if (!timeStr) return '09:00:00';
  // If already HH:MM:SS
  if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) return timeStr;
  // If HH:MM – add seconds
  if (/^\d{2}:\d{2}$/.test(timeStr)) return `${timeStr}:00`;

  // Parse 12-hour format with optional space before AM/PM
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*([APap][Mm])$/);
  if (match) {
    let [, hrs, mins, ampm] = match;
    let hours = parseInt(hrs, 10);
    ampm = ampm.toUpperCase();
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, '0')}:${mins}:00`;
  }
  // Fallback default
  return '09:00:00';
};

// Using shared date utilities from dateUtils.js instead of local formatDateString

// Helper function to format dates consistently
const formatDate = (date) => {
  if (!date) return null;
  return formatDateForAPI(date);
};



// Helper function to validate dates
const validateDate = (dateStr, allowFuture = true) => {
  if (!dateStr) return { isValid: true, message: null }; // No date provided is considered valid
  
  try {
    // Parse the date string and ensure we're comparing dates correctly
    const date = new Date(dateStr);
    const today = new Date();
    
    // Reset time components to compare just the date
    const dateObj = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayObj = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return { isValid: false, message: 'Invalid date format' };
    }
    
    // Check if date is in the future (for birth dates, this should be false)
    if (!allowFuture && dateObj > todayObj) {
      console.log('Future date detected:', dateStr);
      return { isValid: false, message: 'Date cannot be in the future' };
    }
    
    return { isValid: true, message: null };
  } catch (e) {
    console.error('Date validation error:', e);
    return { isValid: false, message: 'Error validating date: ' + e.message };
  }
};

// Create context
export const BookingContext = createContext();

// Create provider component
export const BookingProvider = ({ children }) => {
  const [bookings, setBookings] = useState([]);

  const [unavailableDates, setUnavailableDates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false); // Simple admin flag
  const [MAX_SLOTS] = useState({
    overnight: {
      deluxe: 10,
      premium: 10,
      executive: 2
    },
    daycare: 10,
    grooming: {
      'Premium Grooming': 5,
      'Basic Bath & Dry': 10,
      'Special Grooming Package': 5
    }
  });

  // Simple admin toggle
  const toggleAdmin = () => {
    setIsAdmin(prev => !prev);
  };

  // Utility: Convert snake_case keys to camelCase recursively
function toCamelCase(obj) {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  } else if (obj && typeof obj === 'object') {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      const camelKey = key.replace(/_([a-z])/g, g => g[1].toUpperCase());
      acc[camelKey] = toCamelCase(value);
      return acc;
    }, {});
  }
  return obj;
}

// Fetch all bookings (admin view) or user-specific bookings (user view)
  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('BookingContext: Fetching all bookings (admin view)');
      
      let bookingsData = [];
      const headers = {
        'Content-Type': 'application/json',
      };

      const response = await fetch(`${API_URL}/api/bookings`, { headers });

      if (!response.ok) {
        console.log(`error fetching from ${API_URL}`);
        throw new Error(`API request failed with status ${response.status}`);
      }

      bookingsData = await response.json();
      console.log('BookingContext: Retrieved bookings from API:', bookingsData);

      // Handle both array response and response with data property
      const bookingsArray = Array.isArray(bookingsData) ? bookingsData : 
                          (bookingsData.data && Array.isArray(bookingsData.data) ? bookingsData.data : []);
      
      // Log the extracted bookings array
      console.log('BookingContext: Extracted bookings array:', bookingsArray);
      
      // Debug log to check for breed and address fields in the raw data
      if (bookingsArray.length > 0) {
        console.log('BookingContext: Sample booking raw data:', {
          'booking_id': bookingsArray[0].booking_id,
          'breed': bookingsArray[0].breed,
          'address': bookingsArray[0].address,
          'customer_address': bookingsArray[0].customer_address
        });
      }
      
      const camelBookings = bookingsArray.map(toCamelCase);

      // Map bookings to our internal format - handling MySQL snake_case to camelCase conversion
      const formattedBookings = camelBookings.map(booking => {
  // Get the raw date strings first
  const rawStartDate = booking.start_date || booking.startDate || booking.check_in_date || booking.checkInDate;
  const rawEndDate = booking.end_date || booking.endDate || booking.check_out_date || booking.checkOutDate;
        
  // Create date objects preserving the exact date without timezone shifts
  let startDateObj, endDateObj;
        
  // For YYYY-MM-DD format (from MySQL DATE columns), parse without timezone conversion
  if (typeof rawStartDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawStartDate)) {
    // Create a date at noon in local timezone to avoid any date shifting due to timezone
    // This is critical - using noon ensures it won't shift days due to timezone offsets
    const [year, month, day] = rawStartDate.split('-').map(Number);
    startDateObj = new Date(year, month - 1, day, 12, 0, 0);
    console.log('BookingContext: Created date from YYYY-MM-DD without timezone shift:', 
      rawStartDate, '->', startDateObj, '(Y/M/D):', year, month - 1, day);
  } else {
    // Use our utility for other formats
    startDateObj = createConsistentDate(rawStartDate);
  }
        
  // Same for end date - using noon to avoid date shifting
  if (typeof rawEndDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawEndDate)) {
    const [year, month, day] = rawEndDate.split('-').map(Number);
    endDateObj = new Date(year, month - 1, day, 12, 0, 0);
    console.log('BookingContext: Created date from YYYY-MM-DD without timezone shift:',
      rawEndDate, '->', endDateObj);
  } else {
    endDateObj = createConsistentDate(rawEndDate);
  }
        
  // If this is a booking from the frontend (has adjustedStartDate), use that instead
  if (booking.adjustedStartDate) {
    startDateObj = createConsistentDate(booking.adjustedStartDate);
  }
  if (booking.adjustedEndDate) {
    endDateObj = createConsistentDate(booking.adjustedEndDate);
  }
        
  // Debug the date values
  console.log('BookingContext: Date values for booking', booking.id, ':', {
    'Original start date': rawStartDate,
    'Original end date': rawEndDate,
    'Parsed start date': startDateObj,
    'Parsed end date': endDateObj,
    'Formatted for display': startDateObj ? startDateObj.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    }) : null
  });
  // ------------ SERVICE TYPE & DAYCARE DETECTION FIX ------------
  // We need to detect daycare even if the backend only returns service_id / is_daycare
  // Accept both snake_case and camelCase from backend
  const isDaycareFlag = (booking.is_daycare === 1 || booking.is_daycare === true || booking.is_daycare === '1' || booking.is_daycare === 'true') ||
                        (booking.isDaycare === 1 || booking.isDaycare === true || booking.isDaycare === '1' || booking.isDaycare === 'true');
  const isDaycareById = booking.service_id === 4 || booking.serviceId === 4;

  // Map raw service_id so components can use it later
  const serviceIdRaw = booking.service_id || booking.serviceId;

  // Determine serviceType robustly
  let serviceType = booking.service_type || booking.serviceType;

  if (!serviceType) {
    // If backend sent selected_service_type then it's grooming
    if (booking.selected_service_type) {
      serviceType = 'grooming';
    } else if (isDaycareFlag || isDaycareById) {
      serviceType = 'daycare';
    }
  }
  // Default fallback
  if (!serviceType) serviceType = 'overnight';
  return {
    id: booking.id || booking.booking_id || booking.bookingId, // Always ensure 'id' is set
    petName: booking.pet_name || booking.petName || booking.pet?.name || '',
    petType: booking.pet_type || booking.petType || booking.pet?.type || 'Other',
    // Make sure we capture the raw breed field from the backend
    petBreed: booking.breed || booking.pet_breed || booking.petBreed || booking.pet?.breed || '', 
    // Map fields expected by DetailModal component - prioritize the raw breed field from backend
    breed: booking.breed || booking.pet_breed || booking.petBreed || booking.pet?.breed || '',
    sex: booking.sex || booking.gender || booking.pet_sex || booking.petSex || booking.pet?.sex || booking.pet?.gender || 'Not specified',
    gender: booking.sex || booking.gender || booking.pet_sex || booking.petSex || booking.pet?.sex || booking.pet?.gender || 'Not specified',
    dateOfBirth: (() => {
      const dob = booking.date_of_birth || booking.dateOfBirth || booking.pet?.date_of_birth || booking.pet?.dateOfBirth;
      if (dob && typeof dob === 'string' && dob !== 'null') {
        // Format the date as YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}.*$/.test(dob)) {
          return dob.substring(0, 10); // Extract just the date part
        }
        return dob;
      }
      return 'Not specified';
    })(),
    // Admin API compatibility: map customerFirstName/LastName to ownerName, customerEmail/Phone to ownerEmail/Phone
    ownerName: (booking.customerFirstName && booking.customerLastName)
      ? `${booking.customerFirstName} ${booking.customerLastName}`
      : booking.customerFirstName || booking.owner_name || booking.ownerName || '',
    ownerEmail: booking.customerEmail || booking.owner_email || booking.ownerEmail || '',
    ownerPhone: booking.customerPhone || booking.owner_phone || booking.ownerPhone || '',
    // Map fields expected by DetailModal component
    owner: (booking.customerFirstName && booking.customerLastName)
      ? `${booking.customerFirstName} ${booking.customerLastName}`
      : booking.customerFirstName || booking.owner_name || booking.ownerName || 'Not provided',
    contactNumber: booking.customerPhone || booking.owner_phone || booking.ownerPhone || 'Not provided',
    ownerAddress: booking.customerAddress || booking.customer_address || booking.owner_address || booking.ownerAddress || booking.address || 'Not provided',
    address: booking.customerAddress || booking.customer_address || booking.owner_address || booking.ownerAddress || booking.address || 'Not provided',
    // Include both naming conventions for date & time fields
    // ----- DATES -----
    startDate: startDateObj,
    endDate: endDateObj,

    // ----- TIMES -----
    startTime: booking.start_time || booking.startTime || booking.check_in_time || booking.checkInTime || '',
    endTime: booking.end_time || booking.endTime || booking.check_out_time || booking.checkOutTime || '',

    // Add checkIn and checkOut fields that various components expect
    checkIn: startDateObj,
    checkOut: endDateObj,
    checkInTime: booking.start_time || booking.startTime || booking.check_in_time || booking.checkInTime || '',
    checkOutTime: booking.end_time || booking.endTime || booking.check_out_time || booking.checkOutTime || '',

    // Add snake_case versions for API compatibility
    check_in_date: startDateObj,
    check_out_date: endDateObj,
    check_in_time: booking.start_time || booking.startTime || booking.check_in_time || booking.checkInTime || '',
    check_out_time: booking.end_time || booking.endTime || booking.check_out_time || booking.checkOutTime || '',

    // Add camelCase versions for frontend components
    checkInDate: startDateObj,
    checkOutDate: endDateObj,
    checkInTimeCamel: booking.start_time || booking.startTime || booking.check_in_time || booking.checkInTime || '', // alias for clarity
    checkOutTimeCamel: booking.end_time || booking.endTime || booking.check_out_time || booking.checkOutTime || '',
    // ----- BOOKING REFERENCE -----
    referenceNumber: booking.reference_number || booking.referenceNumber || null,
    reference_number: booking.reference_number || booking.referenceNumber || null,

    // Map room_type from backend to multiple properties for compatibility
    room_type: booking.room_type || booking.roomType || booking.selectedRoom,
    roomType: booking.room_type || booking.roomType || booking.selectedRoom,
    // Only map selectedRoom if not grooming
    selectedRoom: serviceType === 'grooming' ? undefined : (booking.room_type || booking.roomType || booking.selectedRoom),
    /*
      For grooming bookings, ensure we capture the grooming package name. The backend sends this
      as `service_name`, but we also support legacy fields (`selected_service_type`, `selectedServiceType`).
      To maximise compatibility across components (Admin dashboard, BookingDetailsModal, etc.) we
      map it to `selectedServiceType` in camelCase. We also expose both `service_name` and
      `serviceName` so any component that relies on those names continues to work.
    */
    selectedServiceType: serviceType === 'grooming'
      ? (booking.selected_service_type || booking.selectedServiceType || booking.service_name || booking.serviceName)
      : undefined,
    service_name: booking.service_name || booking.serviceName || (serviceType === 'grooming' ? (booking.selected_service_type || booking.selectedServiceType) : undefined),
    serviceName: booking.service_name || booking.serviceName || (serviceType === 'grooming' ? (booking.selected_service_type || booking.selectedServiceType) : undefined),
    timeSlot: booking.time_slot || booking.timeSlot,
    additionalServices: typeof booking.additional_services === 'string' ? 
       JSON.parse(booking.additional_services) : 
       (booking.additionalServices || []),
     // Additional information / special request fields (maintain multiple aliases for compatibility)
     additionalInformation: booking.additional_information || booking.additionalInformation || booking.special_requests || booking.specialRequests || '',
     specialRequests: booking.special_requests || booking.specialRequests || booking.additionalInformation || booking.additional_information || '',
     specialRequirements: booking.special_requirements || booking.specialRequirements || booking.special_requests || booking.specialRequests || '',
    status: booking.status || 'pending',
    // Expose daycare flag & service id for downstream components
    // Provide both naming conventions for ease of use in components
    is_daycare: isDaycareFlag || isDaycareById ? 1 : 0,
    isDaycare: isDaycareFlag || isDaycareById ? 1 : 0,
    serviceId: serviceIdRaw,
    service_id: serviceIdRaw,

    // ----- NEW STRUCTURED FIELDS FOR MODAL COMPATIBILITY -----
    petDetails: [{
      name: booking.pet_name || booking.petName || booking.pet?.name || '',
      type: booking.pet_type || booking.petType || booking.pet?.type || 'Other',
      breed: booking.breed || booking.pet_breed || booking.petBreed || booking.pet?.breed || '',
      sex: booking.sex || booking.gender || booking.pet_sex || booking.petSex || booking.pet?.sex || booking.pet?.gender || 'Not specified',
      gender: booking.sex || booking.gender || booking.pet_sex || booking.petSex || booking.pet?.sex || booking.pet?.gender || 'Not specified',
      weightCategory: (() => {
        const direct = booking.weight_category || booking.weightCategory || booking.pet_weight_category;
        if (direct) return direct;
        // Try to parse from room_type string e.g. "Premium Room - Medium (9-25 KG)"
        if (booking.room_type) {
          const roomStr = booking.room_type.toLowerCase();
          if (roomStr.includes('small')) return 'Small';
          if (roomStr.includes('medium')) return 'Medium';
          if (roomStr.includes('x-large') || roomStr.includes('xl') || roomStr.includes('extra large')) return 'X-Large';
          if (roomStr.includes('large')) return 'Large';
          if (roomStr.includes('cat')) return 'Cat';
        }
        return 'Not specified';
      })(),
      roomType: booking.room_type || booking.roomType || booking.selectedRoom,
      weight_category: (() => {
        const direct = booking.weight_category || booking.weightCategory || booking.pet_weight_category;
        if (direct) return direct;
        if (booking.room_type) {
          const roomStr = booking.room_type.toLowerCase();
          if (roomStr.includes('small')) return 'Small';
          if (roomStr.includes('medium')) return 'Medium';
          if (roomStr.includes('x-large') || roomStr.includes('xl') || roomStr.includes('extra large')) return 'X-Large';
          if (roomStr.includes('large')) return 'Large';
          if (roomStr.includes('cat')) return 'Cat';
        }
        return null;
      })()
    }],

    ownerDetails: {
      name: (booking.customerFirstName && booking.customerLastName)
              ? `${booking.customerFirstName} ${booking.customerLastName}`
              : (booking.customerFirstName || booking.owner_name || booking.ownerName || ''),
      email: booking.customerEmail || booking.owner_email || booking.ownerEmail || '',
      phone: booking.customerPhone || booking.owner_phone || booking.ownerPhone || '',
      address: booking.customerAddress || booking.customer_address || booking.owner_address || booking.ownerAddress || booking.address || ''
    },

    serviceType,
    };
});

      console.log('BookingContext: Formatted bookings:', formattedBookings);
      
      // Update bookings list
      setBookings(formattedBookings);
      console.log(`BookingContext: Loaded ${formattedBookings.length} bookings`);
      return formattedBookings;
    } catch (error) {
      console.error('BookingContext: Error fetching bookings:', error);
      setError(`Failed to fetch bookings: ${error.message}`);
      // Reset bookings state on error
      setIsLoading(false);
    } finally {

      return [];
    }
  };

  // Add a new booking with user context
  const normalizeBookingData = (bookingData) => {
    // Normalize guest pet data
    // Normalize gender to match database ENUM (Male/Female)
    const normalizeGender = (gender) => {
      if (!gender) return 'Male'; // Default to Male if not specified
      const g = gender.toString().trim().toLowerCase();
      if (/^(m|male)$/i.test(g)) return 'Male';
      if (/^(f|female)$/i.test(g)) return 'Female';
      return 'Male';
    };
    
    // Normalize pet type
    const normalizePetType = (type) => {
      if (!type) return 'Dog'; // Default to Dog
      const t = type.toString().trim().toLowerCase();
      if (/cat/i.test(t)) return 'Cat';
      return 'Dog';
    };

    // Attempt to extract pet name from various fields (include bookingData.pet)
    const petName = bookingData.petName || bookingData.pet_name ||
                    bookingData.name ||
                    bookingData.pet?.name || bookingData.pet?.petName ||
                    bookingData.petDetails?.name ||
                    (Array.isArray(bookingData.petDetails) && bookingData.petDetails[0]?.name) || 'Pet';

    // Attempt to extract pet type from various fields (include bookingData.pet)
    const petType = 
                    bookingData.petType || bookingData.pet_type ||
                    bookingData.pet?.type || bookingData.pet?.pet_type ||
                    (bookingData.petDetails && bookingData.petDetails.type) ||
                    (Array.isArray(bookingData.petDetails) && bookingData.petDetails[0]?.type) ||
                    'Dog';

    // Extract breed from various fields (include bookingData.pet)
    const petBreed = bookingData.breed || bookingData.petBreed || bookingData.pet_breed ||
                     bookingData.pet?.breed ||
                     (bookingData.petDetails && bookingData.petDetails.breed) ||
                     (Array.isArray(bookingData.petDetails) && bookingData.petDetails[0]?.breed) || bookingData.petBreed;

    // Extract pet gender/sex from various fields
    const petGender = 
       bookingData.gender || bookingData.petGender ||
       bookingData.sex || bookingData.petSex ||
       bookingData.pet_sex || bookingData.pet_gender ||
       bookingData.pet?.gender || bookingData.pet?.sex ||
       (bookingData.petDetails && bookingData.petDetails.sex) ||
       (Array.isArray(bookingData.petDetails) && bookingData.petDetails[0]?.sex) ||
       bookingData.petGender;

    // Helper: Normalize weight category to backend canonical values
    const normalizeWeightCategory = (category, petType) => {
      if (!category || typeof category !== 'string') {
        return petType === 'Cat' ? 'Cat' : 'Medium'; // Default assumptions
      }
      const c = category.toLowerCase();
      if (c.includes('small')) return 'Small';
      if (c.includes('medium')) return 'Medium';
      if (c.includes('x-large') || c.includes('x large') || c.includes('xlarge') || c.includes('xl') || c.includes('extra large') || c.includes('extra-large')) return 'X-Large';
      if (c.includes('large')) return 'Large';
      if (c.includes('cat')) return 'Cat';
      // Fallback: take first word and capitalize
      const firstWord = category.split(' ')[0];
      return firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
    };

    // Extract weight category and normalize it
    let rawWeightCategory = bookingData.weight_category || bookingData.weightCategory || bookingData.petWeightCategory || bookingData.pet_weight_category || '';

    // Fallback: try to parse weight category from a room type string like "Premium Room - Medium (9-25 KG)"
    if (!rawWeightCategory && (bookingData.room_type || bookingData.roomType)) {
      const roomStr = (bookingData.room_type || bookingData.roomType).toLowerCase();
      if (roomStr.includes('small'))   rawWeightCategory = 'Small';
      else if (roomStr.includes('medium')) rawWeightCategory = 'Medium';
      else if (roomStr.includes('x-large') || roomStr.includes('x large') || roomStr.includes('xlarge') || roomStr.includes('xl') || roomStr.includes('extra large') || roomStr.includes('extra-large')) rawWeightCategory = 'X-Large';
      else if (roomStr.includes('large'))  rawWeightCategory = 'Large';
      else if (roomStr.includes('cat'))    rawWeightCategory = 'Cat';
    }

    const weightCategory = normalizeWeightCategory(rawWeightCategory, petType);

    // Derive owner/guest fields – accept either flat fields or nested ownerDetails
    const derivedOwnerName  = bookingData.ownerName  || bookingData.ownerDetails?.name  || '';
    const derivedOwnerEmail = bookingData.ownerEmail || bookingData.ownerDetails?.email || '';
    const derivedOwnerPhone = bookingData.ownerPhone || bookingData.ownerDetails?.phone || '';
    const derivedOwnerAddr  = bookingData.ownerAddress || bookingData.ownerDetails?.address || '';

    // Extract guest user information
    const guestUser = {
      first_name: derivedOwnerName,
      last_name: '',
      email: derivedOwnerEmail,
      phone: derivedOwnerPhone,
      address: derivedOwnerAddr
    };

    // Also copy these to top-level so backend validation passes
    bookingData.ownerName   = derivedOwnerName;
    bookingData.ownerEmail  = derivedOwnerEmail;
    bookingData.ownerPhone  = derivedOwnerPhone;
    bookingData.ownerAddress = derivedOwnerAddr;

    // Construct the final payload with EXPLICIT values for each field
    const payload = {
      guest_user: bookingData.guest_booking_only ? guestUser : null,
      // CRITICAL: These two fields must be set correctly for the backend API
      // Map all possible service ID field names
      service_id: bookingData.service_id || bookingData.serviceId || (() => {
        // Extract service ID from service type if available
        if (bookingData.serviceType || bookingData.service_type) {
          const serviceType = (bookingData.serviceType || bookingData.service_type).toLowerCase();
          return serviceType === 'overnight' ? 1 : serviceType === 'daycare' ? 4 : 3;
        }
        return 1; // Default to overnight if no service type provided
      })(),
      
      // Explicitly include serviceId as well to ensure it's always available
      serviceId: bookingData.serviceId || bookingData.service_id || (() => {
        // Extract service ID from service type if available
        if (bookingData.serviceType || bookingData.service_type) {
          const serviceType = (bookingData.serviceType || bookingData.service_type).toLowerCase();
          return serviceType === 'overnight' ? 1 : serviceType === 'daycare' ? 4 : 3;
        }
        return 1; // Default to overnight if no service type provided
      })(),
      
      // Determine if this is a daycare booking (serviceId = 4)
      isDaycare: (() => {
        const sid = bookingData.serviceId || bookingData.service_id;
        if (sid === 4) return true;
        const serviceType = (bookingData.serviceType || bookingData.service_type || '').toLowerCase();
        return serviceType === 'daycare';
      })(),
      
      // Ensure both booking_date and bookingDate are set (critical fields)
      booking_date: bookingData.booking_date || bookingData.bookingDate || bookingData.startDate || bookingData.start_date || formatDateForMySQL(new Date()),
      bookingDate: bookingData.bookingDate || bookingData.booking_date || bookingData.startDate || bookingData.start_date || formatDateForMySQL(new Date()),
      
      // Always set end_date - for daycare, same as booking_date
      end_date: bookingData.end_date || bookingData.endDate || bookingData.booking_date || bookingData.bookingDate || bookingData.startDate || formatDateForMySQL(new Date()),
      endDate: bookingData.endDate || bookingData.end_date || bookingData.booking_date || bookingData.bookingDate || bookingData.startDate || formatDateForMySQL(new Date()),
      
      // Format times properly in 24-hour format
      start_time: to24Hour(bookingData.start_time || bookingData.startTime || '09:00'),
      end_time: to24Hour(bookingData.end_time || bookingData.endTime || '17:00'),
      startTime: to24Hour(bookingData.startTime || bookingData.start_time || '09:00'),
      endTime: to24Hour(bookingData.endTime || bookingData.end_time || '17:00'),
      
      guest_booking_only: true,
      pet_type: petType,
      weight_category: weightCategory,
      weightCategory: weightCategory,
      special_requests: bookingData.special_requests,
      // For daycare service, use a default room type (database requires non-NULL)
      room_type: (() => {
        // If it's daycare (service_id=4), use default room type
        const serviceId = bookingData.service_id || bookingData.serviceId;
        const serviceType = (bookingData.serviceType || bookingData.service_type || '').toLowerCase();
        
        if (serviceId === 4 || serviceType === 'daycare') {
          return 'Deluxe Room'; // Default room type - database requires non-NULL value
        } else {
          return bookingData.room_type || bookingData.roomType || 'Deluxe Room';
        }
      })(),
      guest_pet: {
        name: petName,
        pet_name: petName,
        pet_type: petType,
        type: petType,
        breed: petBreed,
        pet_breed: petBreed,
        gender: petGender,
        sex: petGender,
        date_of_birth: bookingData.dateOfBirth || bookingData.date_of_birth || '2020-01-01',
      }
    };
    
    // Log final payload and return it
    console.log('FINAL NORMALIZED PAYLOAD:', JSON.stringify(payload, null, 2));
    return payload;
  };

  const addBooking = async (bookingData) => {
    console.log('BookingContext: addBooking received bookingData:', bookingData); // Debugging: Log incoming data

    // Derive owner fields once for this booking (flat or nested)
    const derivedOwnerName  = bookingData.ownerName  || bookingData.ownerDetails?.name  || '';
    const derivedOwnerEmail = bookingData.ownerEmail || bookingData.ownerDetails?.email || '';
    const derivedOwnerPhone = bookingData.ownerPhone || bookingData.ownerDetails?.phone || '';
    const derivedOwnerAddr  = bookingData.ownerAddress || bookingData.ownerDetails?.address || '';

    // Ensure flat copies exist for backend validation
    bookingData.ownerName    = derivedOwnerName;
    bookingData.ownerEmail   = derivedOwnerEmail;
    bookingData.ownerPhone   = derivedOwnerPhone;
    bookingData.ownerAddress = derivedOwnerAddr;
    // Guest info validation for bookings without user_id
    const isGuest = !(
      null
    );
    if (isGuest) {
      const ownerName = derivedOwnerName;
      const ownerEmail = derivedOwnerEmail;
      const ownerPhone = derivedOwnerPhone;
      if (!ownerName.trim() || !ownerEmail.trim() || !ownerPhone.trim()) {
        setError('Please provide your full name, email, and phone number to complete the booking.');
        setIsLoading(false);
        return { success: false, message: 'Missing required guest info' };
      }
      // Mark this as a guest-only booking
      console.log('BookingContext: This is a guest booking');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Helper to format dates consistently for MySQL DATE columns
      const formatDate = (date) => {
        // Check if date is already a formatted string in YYYY-MM-DD format
        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
          console.log('BookingContext: Date is already formatted correctly:', date);
          return date;
        }

        // If it's an ISO string with timezone (YYYY-MM-DDTHH:MM:SS.sssZ)
        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}T.*Z$/.test(date)) {
          // Extract only the date part without timezone conversion
          console.log('BookingContext: Extracting date part from ISO string:', date);
          return date.slice(0, 10);
        }

        // Otherwise use the imported formatDateForMySQL utility to avoid timezone issues
        console.log('BookingContext: Formatting date with formatDateForMySQL:', date);
        // Access the imported function from the module scope
        return formatDateForMySQL(date) || formatDateForMySQL(new Date());
      };

      // Helper to map service type and room type to ID
      const getServiceId = (serviceType) => {
        // First, extract the room type from all possible field names
        const roomTypeRaw = (bookingData.roomType || bookingData.room_type || bookingData.selectedRoom || '');

        // Then normalize it by converting to lowercase and extracting just the first word
        // This handles both "premium" and "Premium Room" formats
        const roomTypeNormalized = roomTypeRaw.toLowerCase().split(' ')[0];

        console.log('BookingContext: Determined roomType for service ID:', {
          raw: roomTypeRaw,
          normalized: roomTypeNormalized
        });

        // For overnight stays, map to the correct service ID based on normalized room type
        if (serviceType?.toLowerCase() === 'overnight') {
          switch (roomTypeNormalized) {
            case 'premium': return 2; // Premium Room (ID 2)
            case 'executive': return 3; // Executive Room (ID 3)
            default: return 1; // Deluxe Room (ID 1)
          }
        }

        // For other service types
        switch (serviceType?.toLowerCase()) {
          case 'daycare': return 4; // Daycare (ID 4)
          case 'grooming': {
            // For grooming, check all possible naming conventions for the selected grooming service
            const groomingType = (
              bookingData.selectedServiceType ||
              bookingData.groomingService ||
              bookingData.groomingType ||
              bookingData.grooming_type ||
              ''
            ).toLowerCase();
            switch (groomingType) {
              case 'premium grooming': return 5; // Premium Grooming (ID 5)
              case 'basic bath & dry': return 6; // Basic Bath & Dry (ID 6)
              case 'special grooming package': return 7; // Special Grooming Package (ID 7)
              default: return 5; // Default to Premium Grooming
            }
          }
          default: return 1; // Default to overnight deluxe if unknown
        }
      };

      // This is the final payload to be sent to the backend
      // Build the payload for the booking API
      const isGrooming = (bookingData.serviceType?.toLowerCase() === 'grooming');
      const isDaycare = (bookingData.serviceType?.toLowerCase() === 'daycare');

      // Helper to convert time to 24-hour HH:MM:SS format
      const to24HourTime = (timeStr) => {
        if (!timeStr) return '09:00:00';
        if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) return timeStr; // Already in correct format
        if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr + ':00'; // Add seconds if missing
        // Parse 12-hour format with AM/PM
        const match = timeStr.match(/^(\d{1,2}):(\d{2}) ?([APap][Mm])$/);
        if (match) {
          let [_, hours, minutes, ampm] = match;
          hours = parseInt(hours, 10);
          if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
          if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
          return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
        }
        // Fallback: return as is, or default
        return '09:00:00';
      };

      // Check if we have adjusted dates (from timezone compensation)
      const hasAdjustedDates = bookingData.adjustedStartDate || bookingData.adjustedEndDate;

      // CRITICAL: Log the exact date values we're receiving
      console.log('BOOKING DATE DEBUG - Detailed date analysis:', {
        originalBookingDate: bookingData.bookingDate,
        originalStartDate: bookingData.startDate,
        originalEndDate: bookingData.endDate,
        adjustedStartDate: bookingData.adjustedStartDate,
        adjustedEndDate: bookingData.adjustedEndDate,
        hasAdjustedDates: hasAdjustedDates,
        willUseAdjustedDates: hasAdjustedDates,
        serviceType: bookingData.serviceType
      });

      

      let finalPayload = normalizeBookingData(bookingData);

      // Guarantee owner fields are included in payload
      // Include both camelCase and snake_case variants for maximum compatibility
      finalPayload.ownerName      = derivedOwnerName;
      finalPayload.ownerEmail     = derivedOwnerEmail;
      finalPayload.ownerPhone     = derivedOwnerPhone;
      finalPayload.ownerAddress   = derivedOwnerAddr;

      // Explicitly add snake_case fields expected by the backend
      const [firstNamePart, ...restName] = derivedOwnerName.split(' ');
      finalPayload.owner_first_name = firstNamePart || derivedOwnerName;
      finalPayload.owner_last_name  = restName.join(' ');
      finalPayload.owner_email      = derivedOwnerEmail;
      finalPayload.owner_phone      = derivedOwnerPhone;
      finalPayload.owner_address    = derivedOwnerAddr;

      // Guarantee weight category fields are included (camel & snake)
      const derivedWeightCat = finalPayload.weight_category || finalPayload.weightCategory || bookingData.weight_category || bookingData.weightCategory || '';
      finalPayload.weightCategory   = derivedWeightCat;
      finalPayload.weight_category  = derivedWeightCat;
      if (finalPayload.guest_pet) {
        finalPayload.guest_pet.weight_category = derivedWeightCat;
        finalPayload.guest_pet.weightCategory  = derivedWeightCat;
      }

      // Ensure guest_user object present for guest bookings
      if (!finalPayload.guest_user) {
        finalPayload.guest_user = {
          owner_first_name: firstNamePart || derivedOwnerName,
          owner_last_name:  restName.join(' '),
          owner_email: derivedOwnerEmail,
          owner_phone: derivedOwnerPhone,
          owner_address: derivedOwnerAddr,
        };
      }

      // Ensure service_id and serviceId are set using our mapping helper
      const computedServiceId = getServiceId(bookingData.serviceType);
      finalPayload.service_id = computedServiceId;
      finalPayload.serviceId  = computedServiceId;

      console.log('BOOKING DATE DEBUG - Final payload dates:', {
        booking_date: finalPayload.booking_date,
        end_date: finalPayload.end_date,
        start_time: finalPayload.start_time,
        end_time: finalPayload.end_time,
      });

      console.log('BookingContext: Submitting final payload:', JSON.stringify(finalPayload, null, 2));

      const response = await fetch(`${API_URL}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalPayload),
      });

      if (!response.ok) {
        let errorPayload;
        try {
          // Try to get the full response body
          const errorText = await response.text();
          console.error('BookingContext: API error raw text:', errorText);
          
          // Try to parse as JSON if possible
          try {
            errorPayload = JSON.parse(errorText);
            console.error('BookingContext: API error parsed:', errorPayload);
          } catch (parseError) {
            console.error('BookingContext: Error parsing response as JSON:', parseError);
            errorPayload = { message: errorText || `API request failed with status ${response.status}` };
          }
        } catch (e) {
          console.error('BookingContext: Could not read response text:', e);
          errorPayload = { message: `API request failed with status ${response.status}` };
        }
        throw new Error(errorPayload.message || 'Failed to create booking. Please try again.');
      }

      // Parse the successful response
      const result = await response.json().catch(() => ({}));
      console.log('BookingContext: API booking creation successful, response:', result);

      // After a successful booking, refetch all bookings to ensure the UI is up-to-date.
      // This is crucial for updating availability slots correctly for all users.
      await fetchBookings();

      return result;
    } catch (error) {
      console.error('BookingContext: Error adding booking:', error);
      setError(`Failed to add booking: ${error.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Update booking status with role-based permissions
  const updateBookingStatus = async (bookingId, newStatus) => {
    console.log(`BookingContext: Updating booking ${bookingId} to ${newStatus}`);

    try {
      setIsLoading(true);
      setError(null);

      // Validate status transitions
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) {
        throw new Error(`Booking with ID ${bookingId} not found`);
      }
      
      const currentStatus = booking.status;
      let isValidTransition = false;
      
      if (currentStatus === 'pending' && (newStatus === 'confirmed' || newStatus === 'cancelled')) {
        isValidTransition = true;
      } else if (currentStatus === 'confirmed' && (newStatus === 'completed' || newStatus === 'cancelled')) {
        isValidTransition = true;
      } else if (newStatus === currentStatus) {
        console.log('BookingContext: No status change needed');
        return { success: true, message: 'No status change needed' };
      }
      
      if (!isValidTransition) {
        throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
      }
      
      // Based on the backend code, the API expects a PATCH request to /api/bookings/:id/status
      // with a payload containing status and optional notes
      const requestBody = {
        status: newStatus,
        // Optional fields that the backend accepts
        notes: null,  // We could add notes functionality in the future
        adminId: null  // Could be added from user context if needed
      };
      
      console.log('BookingContext: Sending update request with payload:', requestBody);
      
      // Use the exact endpoint structure from the backend routes
      const response = await fetch(`${API_URL}/api/bookings/${bookingId}/status`, {
        method: 'PATCH',  // Backend expects PATCH method
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
      });

      // Log the response for debugging
      let responseData;
      
      try {
        const responseText = await response.text();
        console.log(`BookingContext: API response status: ${response.status}`);
        console.log('BookingContext: API response text:', responseText);
        
        // Try to parse as JSON if possible
        if (responseText) {
          try {
            responseData = JSON.parse(responseText);
            console.log('BookingContext: API response parsed:', responseData);
          } catch (e) {
            console.error('Error parsing response as JSON:', e);
          }
        }
      } catch (e) {
        console.error('Error reading response:', e);
      }
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      console.log('BookingContext: API booking update successful');
      
      // Update local state to match
      const updatedBookings = bookings.map(booking => 
        booking.id === bookingId ? { ...booking, status: newStatus } : booking
      );
      
      setBookings(updatedBookings);
      
      return { success: true, message: 'Booking status updated successfully' };
    } catch (error) {
      console.error('BookingContext: Error updating booking status:', error);
      setError(`Failed to update booking: ${error.message}`);
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }  
  };

  // Function to manage unavailable dates
  const addUnavailableDate = async (date) => {
    try {
      // Normalize date using the proper utility to avoid timezone issues
      const normalizedDate = createConsistentDate(date);
      if (!normalizedDate) {
        throw new Error('Invalid date format');
      }
      const dateString = formatDateForAPI(normalizedDate);

      console.log('Adding unavailable date:', { originalDate: date, normalizedDate, dateString });

      if (isDateUnavailable(normalizedDate)) {
        console.warn('BookingContext: Date is already unavailable', normalizedDate);
        return { success: true, message: 'Date already unavailable' };
      }

      // Prepare headers (add auth if available)
      const headers = {
        'Content-Type': 'application/json',
      };


      // Call backend API (POST)
      const response = await fetch(`${API_URL}/api/unavailable-dates`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ date: dateString, isUnavailable: true })
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Unauthorized: Please log in');
          return { success: false, message: 'Unauthorized: Please log in' };
        }
        if (response.status === 404) {
          setError('API endpoint not found');
          return { success: false, message: 'API endpoint not found' };
        }
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Failed to add unavailable date');
        return { success: false, message: errorData.message || 'Failed to add unavailable date' };
      }

      // Update state and localStorage on success
      const updatedDates = [...unavailableDates, normalizedDate];
      setUnavailableDates(updatedDates);
      const dateStrings = updatedDates.map(d => formatDateForAPI(d));
      localStorage.setItem('unavailableDates', JSON.stringify(dateStrings));
      console.log('Successfully added unavailable date:', dateString);
      return { success: true };
    } catch (error) {
      console.error('BookingContext: Error adding unavailable date:', error);
      setError(`Failed to add unavailable date: ${error.message}`);
      return { success: false, message: error.message };
    }
  };

  // Function to remove unavailable dates
  const removeUnavailableDate = async (date) => {
    try {
      // Normalize date using the proper utility to avoid timezone issues
      const normalizedDate = createConsistentDate(date);
      if (!normalizedDate) {
        throw new Error('Invalid date format');
      }
      const dateString = formatDateForAPI(normalizedDate);

      console.log('Removing unavailable date:', { originalDate: date, normalizedDate, dateString });

      // Prepare headers (add auth if available)
      const headers = {
        'Content-Type': 'application/json',
      };


      // Call backend API (DELETE)
      const response = await fetch(`${API_URL}/api/unavailable-dates/${dateString}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Unauthorized: Please log in');
          return { success: false, message: 'Unauthorized: Please log in' };
        }
        if (response.status === 404) {
          setError('API endpoint not found');
          return { success: false, message: 'API endpoint not found' };
        }
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Failed to remove unavailable date');
        return { success: false, message: errorData.message || 'Failed to remove unavailable date' };
      }

      // Update state and localStorage on success
      const updatedDates = unavailableDates.filter(d =>
        d.getFullYear() !== normalizedDate.getFullYear() ||
        d.getMonth() !== normalizedDate.getMonth() ||
        d.getDate() !== normalizedDate.getDate()
      );
      setUnavailableDates(updatedDates);
      const dateStrings = updatedDates.map(d => formatDateForAPI(d));
      localStorage.setItem('unavailableDates', JSON.stringify(dateStrings));
      console.log('Successfully removed unavailable date:', dateString);
      return { success: true };
    } catch (error) {
      console.error('BookingContext: Error removing unavailable date:', error);
      setError(`Failed to remove unavailable date: ${error.message}`);
      return { success: false, message: error.message };
    }
  };


  // Fetch unavailable dates from the API
  const fetchUnavailableDates = async () => {
    try {
      console.log('BookingContext: Fetching unavailable dates');
      setIsLoading(true);
      setError(null);
      
      const headers = {
        'Content-Type': 'application/json',
      };

      
      const response = await fetch(`${API_URL}/api/unavailable-dates`, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch unavailable dates: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('BookingContext: Successfully fetched unavailable dates from API', data);
      
      // Handle different response formats
      let dateArray = [];
      if (Array.isArray(data)) {
        dateArray = data;
      } else if (data && typeof data === 'object') {
        // If it's an object, look for dates array in common properties
        dateArray = data.dates || data.unavailableDates || data.data || [];
      }
      
      // Convert all dates to Date objects
      const parsedDates = dateArray.map(item => {
        const dateStr = typeof item === 'string' ? item : (item.date || '');
        // Parse date and set to start of day in local timezone
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          console.warn('BookingContext: Invalid date found:', dateStr);
          return null;
        }
        date.setHours(0, 0, 0, 0);
        return date;
      }).filter(date => date !== null); // Filter out invalid dates
      
      setUnavailableDates(parsedDates);
      
      // Update localStorage as backup
      const dateStrings = parsedDates.map(d => formatDateForAPI(d));
      localStorage.setItem('unavailableDates', JSON.stringify(dateStrings));
      
      return parsedDates;
    } catch (error) {
      console.error('BookingContext: Error fetching unavailable dates:', error);
      setError(`Failed to fetch unavailable dates: ${error.message}`);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Get user-specific bookings count for dashboard

  
  // Get user's upcoming bookings
  const getUserUpcomingBookings = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.startDate);
      return bookingDate >= today;
    });
  };

  // Get admin statistics
  const getAdminStats = () => {
    // Count total bookings
    const totalBookings = bookings.length;
    
    // Count pending bookings
    const pendingBookings = bookings.filter(booking => 
      booking.status === 'pending'
    ).length;
    
    // Count confirmed bookings
    const confirmedBookings = bookings.filter(booking => 
      booking.status === 'confirmed'
    ).length;
    
    // Count bookings for today
    const today = new Date();
    const todayBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.startDate);
      return bookingDate.toDateString() === today.toDateString();
    }).length;
    
    return {
      totalBookings,
      pendingBookings,
      confirmedBookings,
      todayBookings
    };
  };

  // Count all bookings for a specific date
  const countBookingsForDate = (date) => {
    if (!date) return 0;
    
    // Normalize the date to ignore time
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    // Count bookings that overlap with this date (excluding cancelled)
    return bookings.filter(booking => {
      // Skip cancelled bookings
      if (booking.status === 'cancelled') return false;
      
      const startDate = new Date(booking.startDate);
      const endDate = booking.endDate ? new Date(booking.endDate) : startDate;
      
      // Normalize booking dates
      const bookingStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const bookingEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      
      // Check if the normalized date falls within the booking range
      return normalizedDate >= bookingStart && normalizedDate <= bookingEnd;
    }).length;
  };
  
  // Count bookings by service type and room type for a specific date
  const countBookingsByServiceAndRoom = (date, serviceType, roomType) => {
    if (!date || !serviceType) return 0;
    
    // Normalize the date to ignore time
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    // Debug log for room type checking
    console.log(`[DEBUG] Checking room availability for date ${formatDateForDisplay(normalizedDate)}, service: ${serviceType}, room: ${roomType || 'any'}`);
    
    // Filter bookings by service type, room type, and date
    const filteredBookings = bookings.filter(booking => {
      // Skip cancelled bookings
      if (booking.status === 'cancelled') return false;
      
      // Convert booking dates to Date objects if they're not already
      const startDate = booking.startDate instanceof Date 
        ? booking.startDate 
        : new Date(booking.startDate);
      
      const endDate = booking.endDate 
        ? (booking.endDate instanceof Date ? booking.endDate : new Date(booking.endDate))
        : startDate; // If no end date, use start date
      
      // Normalize booking dates
      const bookingStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const bookingEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      
      // Check if the normalized date falls within the booking range
      const dateInRange = normalizedDate >= bookingStart && normalizedDate <= bookingEnd;
      
      // Check if service type matches (case insensitive)
      // Check all possible field names for service type
      const bookingServiceType = booking.serviceType || booking.service_type || '';
      const serviceMatches = bookingServiceType.toLowerCase() === serviceType.toLowerCase();

      // For room type, we need special handling based on service type
      let roomMatches = true;
      if (roomType && serviceType === 'overnight') {
        // CRITICAL FIX: Normalize both the room type we're looking for AND the room type in the booking
        // First, normalize the room type we're checking for (e.g., "Premium Room" -> "Premium")
        const normalizedRoomTypeToCheck = roomType.split(' ')[0].toLowerCase();
        
        // Then, get all possible room type fields from the booking and normalize them too
        const bookingRoomTypeRaw = booking.roomType || booking.room_type || booking.selectedRoom || '';
        const normalizedBookingRoomType = bookingRoomTypeRaw.split(' ')[0].toLowerCase();
        
        // Compare the normalized versions
        roomMatches = normalizedBookingRoomType === normalizedRoomTypeToCheck;
        
        // Extra logging for overnight rooms
        if (dateInRange && serviceMatches) {
          console.log(`[DEBUG] Overnight Room Check: Date: ${formatDateForDisplay(normalizedDate)}, Looking for ${roomType} (normalized: ${normalizedRoomTypeToCheck}), found ${bookingRoomTypeRaw} (normalized: ${normalizedBookingRoomType}), match: ${roomMatches}`);
        }
      } else if (roomType && serviceType === 'grooming') {
        // For grooming, check all possible field names for the grooming service type
        const groomingType = booking.selectedServiceType || booking.groomingService || 
                             booking.selected_service_type || booking.grooming_type || '';
        roomMatches = groomingType === roomType;
      }
      
      const result = dateInRange && serviceMatches && roomMatches;
      
      // Debug logging for service-specific bookings (only for matching dates)
      if (dateInRange && serviceMatches) {
        console.log(`[DEBUG] ${serviceType} Booking Filter:`, {
          bookingId: booking.id || 'New',
          service: bookingServiceType,
          room: booking.roomType || booking.room_type || booking.selectedRoom || 'none',
          dates: `${formatDateForDisplay(bookingStart)} - ${formatDateForDisplay(bookingEnd)}`,
          requestedDate: formatDateForDisplay(normalizedDate),
          requestedRoom: roomType || 'any',
          result: result ? 'MATCHED' : 'NOT MATCHED'
        });
      }

      return result;
    });
    
    console.log(`[DEBUG] Total ${serviceType} bookings for ${formatDateForDisplay(normalizedDate)} ${roomType ? 'in ' + roomType : ''}: ${filteredBookings.length}`);
    return filteredBookings.length;
  };
  
  // Check if a service is at capacity for a specific date and room type
  const isServiceAtCapacity = (date, serviceType, roomType) => {
    if (!date || !serviceType) return false;
    
    // CRITICAL FIX: Normalize room type to handle UI display vs backend storage differences
    // UI might display "Premium Room" but backend might store as "Premium"
    let normalizedRoomType = roomType;
    if (roomType && roomType.includes(' ')) {
      // Extract just the first word (e.g., "Premium Room" -> "Premium")
      normalizedRoomType = roomType.split(' ')[0];
      console.log(`[DEBUG] Normalized room type from UI: ${roomType} -> ${normalizedRoomType}`);
    }
    
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    // Use the normalized room type when counting bookings
    const currentCount = countBookingsByServiceAndRoom(normalizedDate, serviceType, normalizedRoomType);

    let maxCapacity;
    if (serviceType === 'daycare') {
      maxCapacity = MAX_SLOTS.daycare;
    } else if (serviceType === 'overnight') {
      // Extract just the first word and convert to lowercase (e.g., "Deluxe Room" -> "deluxe", "Premium" -> "premium")
      const simpleRoomType = normalizedRoomType ? normalizedRoomType.split(' ')[0].toLowerCase() : 'deluxe';
      maxCapacity = MAX_SLOTS.overnight[simpleRoomType] || 0;
      console.log(`[DEBUG] Room capacity check: ${normalizedRoomType} (from ${roomType}) -> ${simpleRoomType}, capacity: ${maxCapacity}, current: ${currentCount}`);
    } else if (serviceType === 'grooming') {
      maxCapacity = MAX_SLOTS.grooming[roomType] || 0;
    } else {
      maxCapacity = 0;
    }

    return currentCount >= maxCapacity;
  };

  const isDateAtCapacity = (date) => {
    return countBookingsForDate(date) >= MAX_GENERAL_CAPACITY; // Use the global constant
  };

  const isDateUnavailable = (date) => {
    if (!date) return false;
    // Create date at start of day in local timezone
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    normalizedDate.setHours(0, 0, 0, 0);

    return unavailableDates.some(unavailableDate => {
      // Normalize unavailable date to start of day in local timezone
      const unavailableStart = new Date(unavailableDate);
      unavailableStart.setHours(0, 0, 0, 0);
      return unavailableStart.getTime() === normalizedDate.getTime();
    }) || isDateAtCapacity(normalizedDate);
  };
  
  // Add this method to calculate available slots with proper room type normalization
  const getAvailableSlots = (date, serviceType, specificService = null) => {
    if (!date) return 0;

    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    let maxSlots;
    let usedSlots = 0;
    
    // CRITICAL FIX: Normalize room types for consistent matching
    if (serviceType === 'overnight' && specificService) {
      // Extract the first word (e.g. "Premium Room" -> "premium") for MAX_SLOTS lookup
      const roomTypeDisplay = specificService; // Keep original for display
      const simplifiedRoomType = specificService.split(' ')[0].toLowerCase();
      console.log(`[DEBUG] Available slots for ${serviceType}: Normalizing room type from ${roomTypeDisplay} to ${simplifiedRoomType}`);
      
      maxSlots = MAX_SLOTS.overnight[simplifiedRoomType] || 0;
      // Using the normalized room type name to count bookings more accurately
      const normalizedRoomName = specificService.split(' ')[0];
      usedSlots = countBookingsByServiceAndRoom(normalizedDate, 'overnight', normalizedRoomName);
      
      console.log(`[DEBUG] Available slots for ${serviceType}, room type ${roomTypeDisplay}: max=${maxSlots}, used=${usedSlots}, remaining=${Math.max(0, maxSlots - usedSlots)}`);
      return Math.max(0, maxSlots - usedSlots);
    }
    
    switch(serviceType) {
      case 'overnight':
        // Default to deluxe if no specific room type provided
        maxSlots = MAX_SLOTS.overnight['deluxe'] || 0;
        usedSlots = countBookingsByServiceAndRoom(normalizedDate, 'overnight', 'Deluxe');
        break;
      
      case 'daycare':
        maxSlots = MAX_SLOTS.daycare;
        usedSlots = countBookingsByServiceAndRoom(normalizedDate, 'daycare');
        break;
  
      case 'grooming':
        maxSlots = MAX_SLOTS.grooming[specificService] || 0;
        usedSlots = countBookingsByServiceAndRoom(normalizedDate, 'grooming', specificService);
        break;
  
      default:
        return 0;
    }
  
    return Math.max(0, maxSlots - usedSlots);
  };

  // Initialize data when component mounts
  useEffect(() => {
    // Fetch bookings and unavailable dates when context mounts
    const initializeData = async () => {
      try {
        setIsLoading(true);
        // Start with fetching unavailable dates (with localStorage fallback)
        await fetchUnavailableDates();
        // Then fetch bookings if a user is logged in
        await fetchBookings();
      } catch (err) {
        console.error('BookingContext: Error initializing data:', err);
        setError('Failed to initialize booking data');
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
    // We only want to run this once when the component mounts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch initial data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        await fetchUnavailableDates();
        await fetchBookings();
      } catch (err) {
        console.error('BookingContext: Error initializing data:', err);
        setError('Failed to initialize booking data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  const value = {
    // State
    bookings,

    unavailableDates,
    isAdmin,
    MAX_SLOTS,
    MAX_GENERAL_CAPACITY,
    isLoading,
    error,

    // Admin management
    toggleAdmin,

    // Core CRUD operations
    fetchBookings,
    addBooking,
    updateBookingStatus,
    
    // Calendar management
    fetchUnavailableDates,
    addUnavailableDate,
    removeUnavailableDate,

    // Utility functions
    isDateUnavailable,
    countBookingsForDate,
    isDateAtCapacity,
    countBookingsByServiceAndRoom,
    isServiceAtCapacity,
    getAvailableSlots,

    // Role-specific functions

    getAdminStats,
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
};

// Custom hook to use the booking context
export const useBookings = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBookings must be used within a BookingProvider');
  }
  return context;
};