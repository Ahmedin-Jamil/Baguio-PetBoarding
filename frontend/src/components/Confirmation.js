import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Spinner, ListGroup, Alert, Row, Col, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faCalendarAlt, faQuestion, faEdit, faClock, faInfoCircle, faFileAlt, faEnvelope, faBell, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_URL } from '../config';
import './ReservationStyles.css';
import './ReservationNew.css';
import DatePickerModal from './DatePickerModal';
import TotalAmountCard from './TotalAmountCard';
import { useBookings } from '../context/BookingContext';
import { formatDateForDisplay, formatDateForAPI, createConsistentDate } from '../utils/dateUtils';
// Price imports removed

// Grooming services constants (copied from GroomingReservation.js)
const GROOMING_SERVICES = [
  { name: 'Premium Grooming', slots: 5 },
  { name: 'Basic Bath & Dry', slots: 10 },
  { name: 'Special Grooming Package', slots: 5 }
];

const ROOM_DISPLAY_NAMES = {
  deluxe: "Deluxe Room",
  premium: "Premium Room",
  executive: "Executive Room",
  "Deluxe Room": "Deluxe Room",
  "Premium Room": "Premium Room",
  "Executive Room": "Executive Room"
};

const Confirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addBooking } = useBookings();
  
  // State for confirmation status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  
  // State for date picker modal
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  // Initialize service type, prioritizing value passed via navigation state (top-level),
// then nested inside bookingData, and finally falling back to URL path or default.
const [serviceType, setServiceType] = useState(() => {
  if (location.state?.serviceType) return location.state.serviceType;
  if (location.state?.bookingData?.serviceType) return location.state.bookingData.serviceType;
  if (location.pathname.includes('grooming')) return 'grooming';
  if (location.pathname.includes('daycare')) return 'daycare';
  return 'overnight';
});
  
  // Add a loading state for booking in process
  const [isProcessing, setIsProcessing] = useState(true);
  
  // Determine service type based on URL path and location state
  useEffect(() => {
    // First try to get service type from location state
    if (location.state?.serviceType) {
      setServiceType(location.state.serviceType);
    } else if (location.state?.bookingData?.serviceType) {
      setServiceType(location.state.bookingData.serviceType);
    } else if (location.pathname.includes('grooming')) {
      setServiceType('grooming');
    } else if (location.pathname.includes('daycare')) {
      setServiceType('daycare');
    } else {
      setServiceType('overnight');
    }
    console.log('Setting service type:',
      location.state?.serviceType ||
      location.state?.bookingData?.serviceType ||
      (location.pathname.includes('grooming') ? 'grooming' : location.pathname.includes('daycare') ? 'daycare' : 'overnight')
    );
  }, [location.pathname, location.state]);
  
  // Get booking data from location state or use default mock data if not available
  const [bookingData, setBookingData] = useState(() => {
    // Check if data was passed through navigation state
    if (location.state && location.state.bookingData) {
      // Ensure petDetails is always an array and not undefined/null
      const data = location.state.bookingData;
      let petDetails = [];
      if (Array.isArray(data.petDetails)) {
        petDetails = data.petDetails.filter(Boolean);
      } else if (data.petDetails) {
        petDetails = [data.petDetails];
      }
      return {
        ...data,
        petDetails
      };
    }
    // Fallback to mock data if no data was passed
    return {
      petDetails: [{
        name: 'Lilly',
        type: 'Dog',
        breed: 'Golden Retriever',
        sex: 'Female',
        age: '3'
      }],
      ownerDetails: {
        name: 'John James',
        email: 'johnjames@gm.com',
        phone: '092313412',
        address: 'Bakakeng Phase 3, Eagle Crest'
      },
      scheduledDateTime: '2025/03/22 | 8:00 am',
      services: 'Deluxe Room',
      selectedRoom: 'deluxe'
    };
  });
  
  // Update booking data if location state changes
  useEffect(() => {
    if (location.state && location.state.bookingData) {
      // Defensive: always ensure petDetails is an array
      const data = location.state.bookingData;
      let petDetails = [];
      if (Array.isArray(data.petDetails)) {
        petDetails = data.petDetails.filter(Boolean);
      } else if (data.petDetails) {
        petDetails = [data.petDetails];
      }
      setBookingData({
        ...data,
        petDetails
      });
    }
  }, [location.state]);
  
  const handleEdit = (section) => {
    // Prevent editing after submission
    return;
  };

  // Helper function to validate birthdates (ensures they're not in the future)
  const validateBirthDate = (dateStr) => {
    if (!dateStr) return { isValid: true, message: null }; // No date provided is considered valid
    
    try {
      // Parse the input date
      const inputDate = new Date(dateStr);
      
      // Check if date is valid
      if (isNaN(inputDate.getTime())) {
        return { isValid: false, message: 'Invalid date format' };
      }
      
      // Use the actual current date to validate the birth date
      const realWorldDate = new Date();
      const realWorldYear = realWorldDate.getFullYear();
      
      console.log('Validating birth date:', dateStr);
      console.log('Input date year:', inputDate.getFullYear());
      console.log('Real world year:', realWorldYear);
      
      // Check if year is in the future
      if (inputDate.getFullYear() > realWorldYear) {
        const errorMessage = `Pet birth date error: Birth year ${inputDate.getFullYear()} cannot be in the future. Current year is ${realWorldYear}`;
        console.error(errorMessage);
        setSubmitError(errorMessage);
        return { isValid: false, message: errorMessage };
      }
      
      // Only check month and day if it's the current year
      if (inputDate.getFullYear() === realWorldYear) {
        const currentMonth = realWorldDate.getMonth();
        const currentDay = realWorldDate.getDate();
        
        if (inputDate.getMonth() > currentMonth || 
            (inputDate.getMonth() === currentMonth && inputDate.getDate() > currentDay)) {
          const errorMessage = 'Pet birth date error: Birth date cannot be in the future';
          console.error(errorMessage);
          setSubmitError(errorMessage);
          return { isValid: false, message: errorMessage };
        }
      }
      
      return { isValid: true, message: null };
    } catch (e) {
      console.error('Date validation error:', e);
      const errorMessage = 'Error validating date: ' + e.message;
      setSubmitError(errorMessage);
      return { isValid: false, message: errorMessage };
    }
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      
      // Create bookings for all service types when confirmed
      if (bookingData.pendingBookings && bookingData.pendingBookings.length > 0) {
        console.log(`Confirmation: Creating ${serviceType} bookings...`);

        
        // Create all pending bookings
        for (const bookingDetails of bookingData.pendingBookings) {
          // Ensure owner fields are present for backend validation
          if (bookingData.ownerDetails) {
            bookingDetails.ownerDetails = bookingData.ownerDetails;
            bookingDetails.ownerName    = bookingData.ownerDetails.name;
            bookingDetails.ownerEmail   = bookingData.ownerDetails.email;
            bookingDetails.ownerPhone   = bookingData.ownerDetails.phone;
            bookingDetails.ownerAddress = bookingData.ownerDetails.address;
          }
          console.log('Creating booking with payload:', JSON.stringify(bookingDetails));
          const result = await addBooking(bookingDetails);
          if (!result || result.error) {
            throw new Error(`Failed to create booking: ${result?.error || 'Unknown error'}`);
          }
          
          // Store the complete raw response for debugging
          bookingData.rawBookingResponses = bookingData.rawBookingResponses || [];
          bookingData.rawBookingResponses.push(result);
          
          // Log the entire response for debugging
          console.log('FULL API RESPONSE:', JSON.stringify(result, null, 2));
          
          // Debug ALL possible reference fields in the response
          console.log('Raw booking response:', JSON.stringify(result));
          console.log('Raw booking fields:', Object.keys(result));
          let referenceNumber = null;
        
          // Check for reference_number in the data object (new API response format)
          if (result && result.data && result.data.reference_number) {
            referenceNumber = result.data.reference_number;
            console.log('Using data.reference_number from API:', referenceNumber);
          }
          // Check for reference_number directly in the result (fallback)
          else if (result && result.reference_number) {
            referenceNumber = result.reference_number;
            console.log('Using reference_number from API:', referenceNumber);
          } 
          // Check for camelCase version
          else if (result && result.referenceNumber) {
            referenceNumber = result.referenceNumber;
            console.log('Using referenceNumber from API:', referenceNumber);
          } 
          // Check for reference field (legacy)
          else if (result && result.reference) {
            referenceNumber = result.reference;
            console.log('Using reference from API:', referenceNumber);
          } 
          // Check in nested booking object
          else if (result && result.booking && result.booking.reference_number) {
            referenceNumber = result.booking.reference_number;
            console.log('Using booking.reference_number from API:', referenceNumber);
          } 
          // Check in nested data object - DO NOT ADD PREFIX
          else if (result && result.data && result.data.bookingId) {
            // We should not create our own reference number format
            console.warn('Using bookingId without proper reference number format');
            referenceNumber = `${result.data.bookingId}`;
            console.log('Using data.bookingId as reference:', referenceNumber);
          }
          // Use ID directly if available - DO NOT ADD PREFIX
          else if (result && result.id) {
            console.warn('Using id without proper reference number format');
            referenceNumber = `${result.id}`;
            console.log('Using id as reference:', referenceNumber);
          } 
          else if (result && result.booking && result.booking.id) {
            console.warn('Using booking.id without proper reference number format');
            referenceNumber = `${result.booking.id}`;
            console.log('Using booking.id as reference:', referenceNumber);
          } 
          else {
            console.warn('No reference or ID found in booking response:', result);
            referenceNumber = '';
          }  
          // Store the reference number in the booking data
          bookingData.confirmationNumbers = bookingData.confirmationNumbers || [];
          bookingData.confirmationNumbers.push(referenceNumber || '');
          
          // Set the first reference as the main booking reference
          if (!bookingData.bookingReference && referenceNumber) {
            bookingData.bookingReference = referenceNumber;
            console.log('Setting main booking reference to:', referenceNumber);
          }
          
          // If we have a reference number from data.reference_number, make sure it's used as the main reference
          if (result && result.data && result.data.reference_number) {
            bookingData.bookingReference = result.data.reference_number;
            console.log('Overriding with data.reference_number as main booking reference:', result.data.reference_number);
          }
        }
        
        console.log(`Confirmation: Successfully created ${bookingData.pendingBookings.length} bookings`);
        
        // Send email notification if we have an email
        if (bookingData.ownerDetails.email) {
          try {
            const emailResponse = await fetch(`${API_URL}/api/send-email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                to: bookingData.ownerDetails.email,
                subject: 'Baguio Pet Boarding - Grooming Appointment Confirmation',
                text: `Dear ${bookingData.ownerDetails.name},\n\nThank you for booking a grooming appointment with Baguio Pet Boarding!\n\nAppointment Details:\nPets: ${Array.isArray(bookingData.petDetails) ? bookingData.petDetails.map(pet => pet.petName || pet.name).join(', ') : (bookingData.petDetails.petName || bookingData.petDetails.name)}\nScheduled Date/Time: ${bookingData.scheduledDateTime}\nServices: ${bookingData.services || 'Grooming'}\n\nYour appointment is currently pending approval. We will notify you once it's confirmed by admin.\n\nIf you have any questions, please contact us.\n\nBest regards,\nBaguio Pet Boarding Team`
              }),
            });
            
            if (emailResponse.ok) {
              console.log('Grooming email notification sent successfully');
            }
          } catch (emailError) {
            console.warn('Grooming email notification error:', emailError);
          }
        }
        
        // Instead of navigating away, show confirmation UI
        await new Promise(resolve => setTimeout(resolve, 1500));
        setSubmitSuccess(true);
        return;
      }
      
      // For overnight/daycare services, proceed with booking creation
      console.log('Checking for pending bookings for', serviceType, bookingData.pendingBookings ? `(found ${bookingData.pendingBookings.length})` : '(none found)');
      
      // If pendingBookings exists, use that array (this will be the case for multiple pets in overnight)
      if (bookingData.pendingBookings && bookingData.pendingBookings.length > 0) {
        console.log(`Confirmation: Creating ${serviceType} bookings for ${bookingData.pendingBookings.length} pets...`);
        
        // Create all pending bookings
        for (const bookingDetails of bookingData.pendingBookings) {
          // Ensure owner fields are present for backend validation
          if (bookingData.ownerDetails) {
            bookingDetails.ownerDetails = bookingData.ownerDetails;
            bookingDetails.ownerName    = bookingData.ownerDetails.name;
            bookingDetails.ownerEmail   = bookingData.ownerDetails.email;
            bookingDetails.ownerPhone   = bookingData.ownerDetails.phone;
            bookingDetails.ownerAddress = bookingData.ownerDetails.address;
          }
          console.log('Creating booking with payload:', JSON.stringify(bookingDetails));
          const result = await addBooking(bookingDetails);
          if (!result || result.error) {
            throw new Error(`Failed to create booking: ${result?.error || 'Unknown error'}`);
          }
          
          // Store the complete raw response for debugging
          bookingData.rawBookingResponses = bookingData.rawBookingResponses || [];
          bookingData.rawBookingResponses.push(result.booking || result);
        }
        
        console.log(`Confirmation: Successfully created ${bookingData.pendingBookings.length} bookings`);
        
        // Email notification handled below
        await new Promise(resolve => setTimeout(resolve, 1500));
        setSubmitSuccess(true);
        return;
      }
      
      // Fallback for single booking approach (legacy path)
      // Validate pet birth dates if present
      const petDetailsArray = Array.isArray(bookingData.petDetails) ? bookingData.petDetails : [bookingData.petDetails];
      
      for (const pet of petDetailsArray) {
        if (pet.birthDate) {
          const validation = validateBirthDate(pet.birthDate);
          if (!validation.isValid) {
            setIsSubmitting(false);
            throw new Error(validation.message);
          }
        }
      }
      
      // Extract and properly format dates from scheduledDateTime string
      // Expected format: "2025/03/22 | 8:00 am" or "2025/03/22 to 2025/03/24 | 8:00 am"
      let startDate, endDate, startTime;
      
      // First check if we have pre-formatted dates from the booking form
      if (bookingData.bookingDate || bookingData.startDate) {
        console.log('Using pre-formatted dates from booking form');
        startDate = bookingData.bookingDate || bookingData.startDate;
        endDate = bookingData.endDate || startDate;
        console.log('Pre-formatted dates:', { startDate, endDate });
      }
      // If not, extract from scheduledDateTime
      else if (bookingData.scheduledDateTime) {
        console.log('Original scheduledDateTime:', bookingData.scheduledDateTime);
        const dateTimeParts = bookingData.scheduledDateTime.split('|');
        
        if (dateTimeParts.length >= 1) {
          const datePart = dateTimeParts[0].trim();
          
          // Check if there's a range with "to" or just a single date
          if (datePart.includes(' to ')) {
            const [start, end] = datePart.split(' to ').map(d => d.trim());
            startDate = start;
            endDate = end;
          } else {
            startDate = datePart;
            // Default end date to start date if not provided
            endDate = datePart;
          }
          
          // Format dates to YYYY-MM-DD
          try {
            console.log('Confirmation: Original date strings:', { startDate, endDate });
            const startDateObj = createConsistentDate(startDate);
            const endDateObj = createConsistentDate(endDate);
            console.log('Confirmation: Parsed date objects:', { startDateObj, endDateObj });
            
            startDate = formatDateForAPI(startDateObj);
            endDate = formatDateForAPI(endDateObj);
            console.log('Confirmation: Formatted dates for API:', { startDate, endDate });
          } catch (e) {
            console.warn('Date parsing error, using current date:', e);
            const today = formatDateForAPI(new Date());
            startDate = today;
            endDate = today;
          }
        }
        
        if (dateTimeParts.length >= 2) {
          startTime = dateTimeParts[1].trim();
        }
      }
      
      // Default to current date if dates are missing
      if (!startDate || !endDate) {
        const today = formatDateForAPI(new Date());
        startDate = today;
        endDate = today;
      }
      // Construct the payload to be sent to the booking context.
      // The context will handle the final transformation to the API format.
      const bookingPayload = {
        serviceType: serviceType,
        booking_date: startDate,
        end_date: endDate,
        start_time: startTime || '08:00',
        end_time: '17:00',
        room_type: bookingData.selectedRoom || bookingData.roomType || 'Deluxe Room',
        special_requests: bookingData.additionalInfo || '',
        // Critical fields for backend - these MUST be included for the booking API to work
        serviceId: serviceType === 'overnight' ? 1 : serviceType === 'daycare' ? 4 : 3, // 1=overnight, 4=daycare, 3=grooming
        service_id: serviceType === 'overnight' ? 1 : serviceType === 'daycare' ? 4 : 3, // Include both camelCase and snake_case
        
        // Guest user details structured for backend
        guest_booking_only: true,
        guest_user: {
          first_name: bookingData.ownerDetails.name,
          email: bookingData.ownerDetails.email,
          phone: bookingData.ownerDetails.phone,
          address: bookingData.ownerDetails.address || ''
        },
        
        // Pet details structured for backend
        guest_pet: {
          name: petDetailsArray[0]?.petName || petDetailsArray[0]?.name || '',
          pet_name: petDetailsArray[0]?.petName || petDetailsArray[0]?.name || '',
          pet_type: petDetailsArray[0]?.petType || petDetailsArray[0]?.type || 'Dog',
          type: petDetailsArray[0]?.petType || petDetailsArray[0]?.type || 'Dog',
          breed: petDetailsArray[0]?.breed || '',
          pet_breed: petDetailsArray[0]?.breed || '',
          gender: petDetailsArray[0]?.sex || petDetailsArray[0]?.gender || '',
          sex: petDetailsArray[0]?.sex || petDetailsArray[0]?.gender || '',
          date_of_birth: (() => {
            const explicitDob = petDetailsArray[0]?.dateOfBirth || petDetailsArray[0]?.date_of_birth;
            if (explicitDob) {
              return formatDateForAPI(explicitDob);
            }
            // Derive from age field if present
            const ageYears = petDetailsArray[0]?.age || petDetailsArray[0]?.pet_age;
            if (ageYears && !isNaN(ageYears)) {
              const today = new Date();
              const birthYear = today.getFullYear() - parseInt(ageYears, 10);
              return `${birthYear}-01-01`;
            }
            return null;
          })()
        },
        
       
        
        // Include the full pet details object for reference
        petDetails: JSON.stringify(petDetailsArray),
      };
      
      console.log('Confirmation: Submitting booking with payload:', bookingPayload);
      
      // Use the BookingContext to add the booking to the SQL database
      const result = await addBooking(bookingPayload);
      
      console.log('Booking submission result:', result);
      
      // Handle the result regardless of its format
      if (result && !result.error) {
        console.log('Confirmation: Booking successfully added');
        
        // Try to send email notification if we have an email
        if (bookingData.ownerDetails.email) {
          try {
            // Get all pet names - from pendingBookings if available, otherwise from petDetailsArray
            let petNames = '';
            if (bookingData.pendingBookings && bookingData.pendingBookings.length > 0) {
              petNames = bookingData.pendingBookings.map(booking => booking.petName).join(', ');
              console.log('Using pet names from pendingBookings:', petNames);
            } else {
              petNames = petDetailsArray.map(pet => pet.petName || pet.name).join(', ');
              console.log('Using pet names from petDetailsArray:', petNames);
            }
            
            // Get room type info - might be different for each pet in pendingBookings
            let roomTypeInfo = '';
            if (bookingData.pendingBookings && bookingData.pendingBookings.length > 0) {
              if (bookingData.pendingBookings.every(b => b.roomType === bookingData.pendingBookings[0].roomType)) {
                // All pets have the same room type
                roomTypeInfo = bookingData.pendingBookings[0].roomType;
              } else {
                // Different room types per pet
                roomTypeInfo = bookingData.pendingBookings
                  .map(b => `${b.petName}: ${b.roomType}`)
                  .join('\n');
              }
            } else {
              roomTypeInfo = bookingPayload.room_type;
            }
            
            const emailResponse = await fetch(`${API_URL}/api/send-email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                to: bookingData.ownerDetails.email,
                subject: 'Baguio Pet Boarding - Booking Confirmation',
                text: `Dear ${bookingData.ownerDetails.name},\n\nThank you for booking with Baguio Pet Boarding!\n\nBooking Details:\nPets: ${petNames}\nScheduled Date/Time: ${bookingData.scheduledDateTime}\nService: ${serviceType === 'overnight' ? 'Overnight Stay' : serviceType}\nRoom Type: ${roomTypeInfo}\n\nYour booking is currently pending approval. We will notify you once it's confirmed by admin.\n\nIf you have any questions, please contact us.\n\nBest regards,\nBaguio Pet Boarding Team`
              }),
            });
            
            if (emailResponse.ok) {
              console.log('Email notification sent successfully');
            }
          } catch (emailError) {
            console.warn('Email notification error:', emailError);
          }
        }
        
        // Also try to send admin notification
        try {
          // Get all pet names - from pendingBookings if available, otherwise from petDetailsArray
          let petNames = '';
          if (bookingData.pendingBookings && bookingData.pendingBookings.length > 0) {
            petNames = bookingData.pendingBookings.map(booking => booking.petName).join(', ');
            console.log('Admin notification using pet names from pendingBookings:', petNames);
          } else {
            petNames = petDetailsArray.map(pet => pet.petName || pet.name).join(', ');
            console.log('Admin notification using pet names from petDetailsArray:', petNames);
          }
          
          // Get room type info - might be different for each pet
          let roomTypeInfo = '';
          if (bookingData.pendingBookings && bookingData.pendingBookings.length > 0) {
            if (bookingData.pendingBookings.every(b => b.roomType === bookingData.pendingBookings[0].roomType)) {
              // All pets have the same room type
              roomTypeInfo = bookingData.pendingBookings[0].roomType;
            } else {
              // Different room types per pet
              roomTypeInfo = bookingData.pendingBookings
                .map(b => `${b.petName}: ${b.roomType}`)
                .join('\n');
            }
          } else {
            roomTypeInfo = bookingPayload.room_type;
          }
          
          // Get number of pets for subject line
          const petCount = (bookingData.pendingBookings && bookingData.pendingBookings.length) || 
                          (Array.isArray(petDetailsArray) ? petDetailsArray.length : 1);
          const multiplePetsText = petCount > 1 ? `(${petCount} pets)` : '';
          
          const adminNotification = await fetch(`${API_URL}/api/admin-notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              subject: `New ${serviceType} Booking Alert ${multiplePetsText}`,
              message: `A new booking has been received!\n\nOwner: ${bookingData.ownerDetails.name}\nPets: ${petNames}\nService: ${serviceType}\nDates: ${startDate} to ${endDate}\nRoom Type: ${roomTypeInfo}\n\nPlease log in to admin dashboard to review and approve.`
            }),
          });
          
          if (adminNotification.ok) {
            console.log('Admin notification sent successfully');
          }
        } catch (adminNotifyError) {
          console.warn('Admin notification error:', adminNotifyError);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        setSubmitSuccess(true);
      } else {
        throw new Error(result?.message || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Error submitting booking:', error);
      setSubmitError(error.message || 'There was an error processing your booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  useEffect(() => {
    // Simulate booking processing delay for better UX
    const timer = setTimeout(() => {
      setIsProcessing(false);
    }, 1800); // 1.8 seconds for animation
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="confirmation-root">
      {/* Header Section */}
      <div style={{ backgroundColor: '#ff9800', padding: '20px 0', textAlign: 'center', color: 'white' }}>
        <Container>
          <h2>Booking Confirmation</h2>
          <p>Please review your booking details</p>
        </Container>
      </div>

      {/* Confirmation Content */}
      <div style={{ padding: '20px 0 40px', backgroundColor: 'white' }}>
        <Container>
          {/* Total Amount Card */}
          {(location.state?.totalAmount || (bookingData && bookingData.totalAmount)) && (
            <div className="mb-4">
              <TotalAmountCard amount={location.state?.totalAmount || bookingData.totalAmount} />
            </div>
          )}
          {isProcessing ? (
            <div className="booking-processing text-center" style={{ minHeight: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div className="spinner-border text-warning mb-4" role="status" style={{ width: 60, height: 60 }}>
                <span className="visually-hidden">Processing...</span>
              </div>
              <h4>Booking in process...</h4>
              <p className="text-muted">Please wait while we confirm your reservation.</p>
            </div>
          ) : submitSuccess ? (
            <Card className="confirmation-card p-4 text-center animate__animated animate__fadeInUp">
              <div className="confirmation-icon mb-4 animate__animated animate__tada animate__delay-1s">
                <FontAwesomeIcon icon={faClock} size="3x" style={{ color: '#ff9800' }} />
              </div>
              <h3 className="mb-3">Your Booking is Pending</h3>
              <p className="mb-4">Thank you for your booking. Your request is now pending approval from our staff. A confirmation email has been sent to your email address with details.</p>
              <Alert variant="info" className="mb-4">
                <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                You can check your booking progress using the reference number below or through the email sent to your inbox.
              </Alert>
              <div className="booking-details mb-4">
                <div className="booking-reference p-3 mb-3" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px dashed #ccc' }}>
                  <h5 className="text-primary"><FontAwesomeIcon icon={faFileAlt} className="me-2" />Booking Reference</h5>
                  
                  {(() => {
  // Defensive reference extraction - prioritize fields that match what the backend expects
  // The My Bookings page looks for 'reference_number' in the search API
  let refFromRawResponses = '';
  if (bookingData && bookingData.rawBookingResponses && bookingData.rawBookingResponses.length > 0) {
    const raw = bookingData.rawBookingResponses[0];
    console.log('REFERENCE EXTRACTION - Raw response:', JSON.stringify(raw, null, 2));
    
    // First priority: data.reference_number (new API response format)
    if (raw && raw.data && raw.data.reference_number) {
      refFromRawResponses = raw.data.reference_number;
      console.log('SUCCESS: Found data.reference_number in API response:', refFromRawResponses);
    }
    // Second priority: reference_number directly in response (snake_case as returned by API)
    else if (raw && raw.reference_number) {
      refFromRawResponses = raw.reference_number;
      console.log('SUCCESS: Found reference_number in API response:', refFromRawResponses);
    }
    // Third priority: referenceNumber (camelCase alternative)
    else if (raw && raw.referenceNumber) {
      refFromRawResponses = raw.referenceNumber;
      console.log('SUCCESS: Using referenceNumber from API:', refFromRawResponses);
    }
    // Fourth priority: booking.reference_number (nested object)
    else if (raw && raw.booking && raw.booking.reference_number) {
      refFromRawResponses = raw.booking.reference_number;
      console.log('SUCCESS: Using booking.reference_number from API:', refFromRawResponses);
    }
    // Fifth priority: data.bookingId (use raw booking ID without prefix)
    else if (raw && raw.data && raw.data.bookingId) {
      console.warn('FALLBACK: No reference number found in API response, using bookingId');
      // Generate a deterministic reference number based on the booking ID
      // This will be the same across all browsers and devices
      const now = new Date();
      const dateStr = now.getFullYear().toString().slice(2) + 
                    (now.getMonth() + 1).toString().padStart(2, '0') + 
                    now.getDate().toString().padStart(2, '0');
      // Use a fixed timestamp based on booking ID to ensure consistency
      const bookingId = raw.data.bookingId;
      // Create a deterministic timestamp based on the booking ID
      // This ensures the same reference number is generated for the same booking ID
      const fixedTimestamp = String(10000 + Number(bookingId)).slice(-5);
      refFromRawResponses = `BPB${dateStr}${fixedTimestamp}${String(bookingId).padStart(4, '0')}`;
      console.log('Generated deterministic reference number from bookingId:', refFromRawResponses);
      
      // Also store this in the raw response for future reference
      raw.data.reference_number = refFromRawResponses;
    }
    // Sixth priority: id (fallback to raw ID without prefix)
    else if (raw && raw.id) {
      console.warn('FALLBACK: No reference number found in API response, using id');
      // Generate a deterministic reference number based on the ID
      const now = new Date();
      const dateStr = now.getFullYear().toString().slice(2) + 
                    (now.getMonth() + 1).toString().padStart(2, '0') + 
                    now.getDate().toString().padStart(2, '0');
      // Use a fixed timestamp based on ID to ensure consistency
      const id = raw.id;
      const fixedTimestamp = String(10000 + Number(id)).slice(-5);
      refFromRawResponses = `BPB${dateStr}${fixedTimestamp}${String(id).padStart(4, '0')}`;
      console.log('Generated deterministic reference number from id:', refFromRawResponses);
      
      // Also store this in the raw response for future reference
      if (!raw.data) raw.data = {};
      raw.data.reference_number = refFromRawResponses;
    }
    // Last priority: other possible reference fields
    else {
      console.warn('FALLBACK: No standard reference fields found, checking alternatives');
      const altId = raw && (raw.reference || 
                 (raw.booking && (raw.booking.reference || 
                                 raw.booking.referenceNumber || raw.booking.id)));
      if (altId) {
        // Generate a deterministic reference number based on the alternative ID
        const now = new Date();
        const dateStr = now.getFullYear().toString().slice(2) + 
                      (now.getMonth() + 1).toString().padStart(2, '0') + 
                      now.getDate().toString().padStart(2, '0');
        // Use a fixed timestamp based on altId to ensure consistency
        const fixedTimestamp = String(10000 + Number(altId)).slice(-5);
        refFromRawResponses = `BPB${dateStr}${fixedTimestamp}${String(altId).padStart(4, '0')}`;
        console.log('Generated deterministic reference number from alternative field:', refFromRawResponses);
        
        // Also store this in the raw response for future reference
        if (!raw.data) raw.data = {};
        raw.data.reference_number = refFromRawResponses;
      } else {
        console.error('CRITICAL ERROR: No reference information found at all');
        refFromRawResponses = '';
      }
    }
  }
  
  // Other possible sources
  let refFromBookingRef = bookingData && bookingData.bookingReference ? bookingData.bookingReference : '';
  let refFromConfirmNumbers = bookingData && bookingData.confirmationNumbers && 
                             bookingData.confirmationNumbers.length > 0 ? 
                             bookingData.confirmationNumbers[0] : '';
  
  // Fallback reference - only used if no reference was found
  const now = new Date();
  const fallbackRef = `BPB${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
  
  // Use only the backend-provided reference number (short format)
const displayRef = refFromRawResponses || refFromBookingRef || refFromConfirmNumbers || '';

return (
  <h4 className="text-center my-2 border border-warning p-2" style={{backgroundColor: '#fff9e6'}}>
    {displayRef || 'N/A'}
  </h4>
);
})()}
                  
                  <p className="small text-muted text-center mb-0">Please keep this reference number for your records</p>
                </div>

                <Row className="mb-3">
                  <Col md={6}>
                    <div className="p-2 h-100" style={{ backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
                      <p className="mb-1"><FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-primary" /><strong>Scheduled Date/Time:</strong></p>
                      <p className="mb-0">{bookingData.scheduledDateTime}</p>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="p-2 h-100" style={{ backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
                      <p className="mb-1"><FontAwesomeIcon icon={faEnvelope} className="me-2 text-primary" /><strong>Email Confirmation:</strong></p>
                      <p className="mb-0">Sent to {bookingData.ownerDetails.email}</p>
                    </div>
                  </Col>
                </Row>
                
                <Alert variant="light" className="border mb-3">
                  <p className="mb-0"><FontAwesomeIcon icon={faBell} className="me-2 text-warning" /><strong>Status:</strong> <Badge bg="warning">Pending Approval</Badge></p>
                </Alert>
                
                <div className="mt-3">
                  <h5>Pet Details:</h5>
                  {Array.isArray(bookingData.petDetails) ? (
                    <div className="pet-list">
                      {bookingData.petDetails.map((pet, index) => (
                        <div key={index} className="pet-item mb-2 p-2" style={{ backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
                          <p className="mb-1"><strong>Pet #{index + 1}: {pet.name}</strong></p>
                          <p className="mb-1">Type: {pet.type} | Breed: {pet.breed}</p>
                          <p className="mb-0">Sex: {pet.sex} | Date of Birth: {pet.dateOfBirth ? new Date(pet.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="pet-item mb-2 p-2" style={{ backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
                      <p className="mb-1"><strong>Pet: {bookingData.petDetails.name}</strong></p>
                      <p className="mb-1">Type: {bookingData.petDetails.type} | Breed: {bookingData.petDetails.breed}</p>
                      <p className="mb-0">Sex: {bookingData.petDetails.sex} | Date of Birth: {bookingData.petDetails.dateOfBirth ? new Date(bookingData.petDetails.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="d-flex justify-content-center gap-3">
                <Button 
                  variant="primary" 
                  className="book-again-btn"
                  onClick={() => navigate('/')}
                >
                  Return to Home
                </Button>
                <Button 
                  variant="outline-primary" 
                  className="view-bookings-btn"
                  onClick={() => navigate('/search-booking')}
                >
                  <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                  Search Bookings
                </Button>
              </div>
            </Card>
          ) : (
            <>
              {submitError && (
                <Alert variant="danger" className="mb-4">
                  {submitError}
                </Alert>
              )}
              
              {Array.isArray(bookingData.petDetails) ? (
                bookingData.petDetails.map((pet, index) => (
                <Card key={index} className="mb-4" style={{ borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', border: 'none' }}>
                  <div style={{ backgroundColor: '#ff9800', padding: '10px 20px', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h5 className="mb-0" style={{ color: 'white' }}>Pet's Details #{index + 1}</h5>
                    
                  </div>
                  
                  <div className="p-4">
                    <table style={{ width: '100%' }}>
                      <tbody>
                        <tr>
                          <td style={{ padding: '8px 0', width: '50%' }}>
                            <strong>Name:</strong>
                            <div>{pet.name}</div>
                          </td>
                          <td style={{ padding: '8px 0', width: '50%' }}>
                            <strong>Type:</strong>
                            <div>{pet.type}</div>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '8px 0'  }}>
                            <strong>Breed:</strong>
                            <div>{pet.breed}</div>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '8px 0' }}>
                            <strong>Sex:</strong>
                            <div>{pet.sex}</div>
                          </td>
                          <td style={{ padding: '8px 0' }}>
                            <strong>Date of Birth:</strong>
                            <div>{pet.dateOfBirth ? new Date(pet.dateOfBirth).toLocaleDateString() : 'N/A'}</div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Card>
              ))
              ) : (
                <Card className="mb-4" style={{ borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', border: 'none' }}>
                  <div style={{ backgroundColor: '#ff9800', padding: '10px 20px', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h5 className="mb-0" style={{ color: 'white' }}>Pet's Details</h5>
                    
                  </div>
                  
                  <div className="p-4">
                    <table style={{ width: '100%' }}>
                      <tbody>
                        <tr>
                          <td style={{ padding: '8px 0', width: '50%' }}>
                            <strong>Name:</strong>
                            <div>{bookingData.petDetails.name}</div>
                          </td>
                          <td style={{ padding: '8px 0', width: '50%' }}>
                            <strong>Type:</strong>
                            <div>{bookingData.petDetails.type}</div>
                          </td>
                        </tr>
                        <tr>
                          
                          <td style={{ padding: '8px 0' }}>
                            <strong>Breed:</strong>
                            <div>{bookingData.petDetails.breed}</div>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '8px 0' }}>
                            <strong>Weight Category:</strong>
                            <div>{bookingData.petDetails.weightCategory || 'N/A'}</div>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '8px 0' }}>
                            <strong>Sex:</strong>
                            <div>{bookingData.petDetails.sex}</div>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '8px 0' }}>
                            <strong>Date of Birth:</strong>
                            <div>{bookingData.petDetails.dateOfBirth ? new Date(bookingData.petDetails.dateOfBirth).toLocaleDateString() : 'N/A'}</div>
                          </td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
              <Card className="mb-4" style={{ borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', border: 'none' }}>
                <div style={{ backgroundColor: '#ff9800', padding: '10px 20px', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h5 className="mb-0" style={{ color: 'white' }}>Owner's Details</h5>
                  
                </div>
                
                <div className="p-4">
                  <table style={{ width: '100%' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '8px 0', width: '50%' }}>
                          <strong>Name:</strong>
                          <div>{bookingData.ownerDetails.name}</div>
                        </td>
                        <td style={{ padding: '8px 0', width: '50%' }}>
                          <strong>Email Address:</strong>
                          <div>{bookingData.ownerDetails.email}</div>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px 0' }}>
                          <strong>Mobile Number:</strong>
                          <div>{bookingData.ownerDetails.phone}</div>
                        </td>
                        <td style={{ padding: '8px 0' }}>
                          <strong>Complete Address:</strong>
                          <div>{bookingData.ownerDetails.address}</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
              
              <Card className="mb-4" style={{ borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', border: 'none' }}>
                <div style={{ backgroundColor: '#ff9800', padding: '10px 20px', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h5 className="mb-0" style={{ color: 'white' }}>Booking Details</h5>
                  
                </div>
                <div className="p-4">
                  <table style={{ width: '100%' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '8px 0', width: '50%' }}>
                          <strong>Scheduled Date:</strong>
                          <div>
                            {serviceType === 'overnight' ? (
                              <>
                                Check-in: {bookingData.startDate}<br/>
                                Check-out: {bookingData.endDate}
                              </>
                            ) : (
                              bookingData.scheduledDateTime
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '8px 0', width: '50%' }}>
                          <strong>Services:</strong>
                          <div>{bookingData.services}</div>
                        </td>
                      </tr>
                      {serviceType === 'overnight' && (
                        <tr>
                          <td style={{ padding: '8px 0' }} colSpan="2">
                            <strong>Check-in/Check-out Time:</strong>
                            <div>
                              Check-in: {bookingData.selectedTime || '08:00'} | 
                              Check-out: 12:00 PM
                            </div>
                          </td>
                        </tr>
                      )}
                      {/* Only show room type and size if NOT grooming */}
{/* Room type and weight category display */}
{serviceType === 'overnight' && (
  <tr>
    <td style={{ padding: '8px 0' }} colSpan={1}>
      <strong>Room Type(s) per Pet:</strong>
      <div>
        {Array.isArray(bookingData.petDetails) && bookingData.petDetails.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {bookingData.petDetails.map((pet, idx) => (
              <li key={idx} style={{ marginBottom: '2px' }}>
                <span style={{ fontWeight: 'bold' }}>{pet.name}:</span> {ROOM_DISPLAY_NAMES[pet.roomType] || pet.roomType || 'N/A'}
                {pet.weightCategory && (
                  <span> - {pet.weightCategory}</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <span>No pets or room types found.</span>
        )}
      </div>
    </td>
  </tr>
)}

{/* Weight category list for daycare bookings */}
{serviceType === 'daycare' && Array.isArray(bookingData.petDetails) && bookingData.petDetails.length > 0 && (
  <tr>
    <td style={{ padding: '8px 0' }} colSpan="2">
      <strong>Pet Weight Category:</strong>
      <div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {bookingData.petDetails.map((pet, idx) => (
            <li key={idx} style={{ marginBottom: '2px' }}>
              <span style={{ fontWeight: 'bold' }}>{pet.name}:</span> {pet.weightCategory || 'N/A'}
            </li>
          ))}
        </ul>
      </div>
    </td>
  </tr>
)}
  {/* Show special requests/notes for daycare bookings below size/services */}
  {serviceType === 'daycare' && (bookingData.specialRequests || bookingData.special_requests) && (
    <tr>
      <td style={{ padding: '8px 0' }} colSpan="2">
        <strong>Additional Information:</strong>
        <div>{bookingData.specialRequests || bookingData.special_requests}</div>
      </td>
    </tr>
  )}
{/* Weight category list for grooming bookings */}
{serviceType === 'grooming' && Array.isArray(bookingData.petDetails) && bookingData.petDetails.length > 0 && (
  <tr>
    <td style={{ padding: '8px 0' }} colSpan="2">
      <strong>Pet Weight Category:</strong>
      <div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {bookingData.petDetails.map((pet, idx) => (
            <li key={idx} style={{ marginBottom: '2px' }}>
              <span style={{ fontWeight: 'bold' }}>{pet.name}:</span> {pet.weightCategory || 'N/A'}
            </li>
          ))}
        </ul>
      </div>
    </td>
  </tr>
)}
{/* Show selected grooming service for grooming bookings */}
{serviceType === 'grooming' && bookingData.selectedServiceType && (
  <tr>
    <td style={{ padding: '8px 0' }} colSpan="2">
      <strong>Selected Grooming Service:</strong>
      <div>{bookingData.selectedServiceType}</div>
    </td>
  </tr>
)}
{serviceType === 'grooming' && (bookingData.specialRequests || bookingData.special_requests) && (
  <tr>
    <td style={{ padding: '8px 0' }} colSpan="2">
      <strong>Additional Information:</strong>
      <div>{bookingData.specialRequests || bookingData.special_requests}</div>
    </td>
  </tr>
) }
                      {bookingData.additionalInfo && (
                        <tr>
                          <td colSpan="2" style={{ padding: '8px 0' }}>
                            <strong>Additional Information:</strong>
                            <div>{bookingData.additionalInfo}</div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>

               <div className="text-center">
                <Button 
                  variant="success" 
                  className="px-5 py-2"
                  onClick={handleConfirm}
                  disabled={isSubmitting}
                  style={{ backgroundColor: '#4CAF50', borderColor: '#4CAF50', borderRadius: '4px', fontWeight: 'normal', marginTop: '10px' }}
                >
                  {isSubmitting ? 'Processing...' : 'Confirm Reservation'}
                </Button>
                <div style={{ marginBottom: '100px' }}></div>
              </div>
            </>
          )}
        </Container>
      </div>
      
      
     
      
      {/* Date Picker Modal */}
      <DatePickerModal 
        show={showDatePickerModal} 
        onHide={() => setShowDatePickerModal(false)} 
        serviceType={serviceType}
        onDateSelect={(dateData) => {
          // Update booking data with new date/time
          const updatedBookingData = {...bookingData};
          const formattedDate = new Date(dateData.startDate).toLocaleDateString();
          const formattedTime = dateData.selectedTime || '8:00 am';
          updatedBookingData.scheduledDateTime = `${formattedDate} | ${formattedTime}`;
          setBookingData(updatedBookingData);
          setShowDatePickerModal(false);
        }}
      />
    </div>
  );
};

export default Confirmation;