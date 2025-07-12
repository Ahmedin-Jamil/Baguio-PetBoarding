import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Nav, Tabs, Tab, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaw, faCalendarAlt, faInfoCircle, faQuestion, faCheck, faUser, faNotesMedical, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useLocation } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './ReservationStyles.css';
import './GradientBackground.css';
import './ReservationForm.css';
import './PetTabs.css';
import './ReservationNew.css';
import './OvernightReservation.css';
import Agreement from './Agreement';
import TotalAmountCard from './TotalAmountCard';
import DatePickerModal from './DatePickerModal';
import { useRoomAvailability } from '../context/RoomAvailabilityContext';
import { useBookings } from '../context/BookingContext';
import { API_URL } from '../config';
import { formatDateForAPI, formatDateForDisplay, formatDateForConfirmation, createConsistentDate } from '../utils/dateUtils';
import { getBreedOptions } from '../utils/breedUtils';



const OvernightReservation = () => {

  const navigate = useNavigate();
  const location = useLocation();
  
  // Get room availability and booking context with proper error handling
  const { 
    fetchUnavailableDates,
    getAvailableSlots,
    isDateUnavailable,
    isServiceAtCapacity,
    addBooking,
    checkRoomAvailability
  } = useBookings();
  
  // Keep RoomAvailabilityContext for backward compatibility
  const { 
    getRoomAvailability = () => 0,
    updateRoomAvailability = () => {}
  } = useRoomAvailability() || {};
  
  // Fetch unavailable dates from backend API when component mounts
  useEffect(() => {
    // Fetch unavailable dates from the backend API using BookingContext
    fetchUnavailableDates()
      .then(() => {
        console.log('Successfully fetched unavailable dates from API');
      })
      .catch(error => {
        console.error('Error fetching unavailable dates:', error);
      });
  }, [fetchUnavailableDates]);

  // State variables for service configuration
  const [startDate, setStartDate] = useState(createConsistentDate(location.state?.startDate || new Date()));
  const [endDate, setEndDate] = useState(createConsistentDate(location.state?.endDate || new Date(new Date().setDate(new Date().getDate() + 1))));
  const [selectedTime, setSelectedTime] = useState(location.state?.selectedTime || '08:00');
  const [serviceType, setServiceType] = useState('overnight');
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  
  // State for room selection
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomType, setRoomType] = useState(''); // Set default room type
  
  // Price configuration based on weight categories
  // State to hold calculated total amount for display and confirmation
  const [totalAmount, setTotalAmount] = useState(0);

  // Price configuration based on weight categories
  const WEIGHT_PRICES = {
    'Executive Room': {
      'Small (1-9 KG)': 650,
      'Medium (9-25 KG)': 850,
      'Large (25-40 KG)': 1000,
      'Extra-Large (40+ KG)': 1500
    },
    'Premium Room': {
      'Small (1-9 KG)': 650,
      'Medium (9-25 KG)': 800,
      'Large (25-40 KG)': 1000,
      'Extra-Large (40+ KG)': 1500
    },
    'Deluxe Room': {
      'Small (1-9 KG)': 500,
      'Medium (9-25 KG)': 650,
      'Large (25-40 KG)': 750,
      'Extra-Large (40+ KG)': 1000
    }
  };
  
  // State for pet information
  const [pets, setPets] = useState([
    { petName: '', petType: '', breed: '', customBreed: '', sex: '', dateOfBirth: '', weightCategory: '' }
]);

  
  // Handle back navigation
  useEffect(() => {
    const handlePopState = () => {
      // Clean up component state and navigate home
      navigate('/', { replace: true });
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [navigate]);
  
  // Log dates received from homepage for debugging
  useEffect(() => {
    if (location.state?.startDate || location.state?.endDate) {
      console.log('Dates received from homepage:', { 
        startDate: formatDateForDisplay(location.state.startDate), 
        endDate: formatDateForDisplay(location.state.endDate),
        selectedTime: location.state.selectedTime
      });
    }
  }, [location.state]);
  
  // Room type limits configuration
  const ROOM_LIMITS = {
    'Executive Room': 2,
    'Deluxe Room': 10,
    'Premium Room': 10
  };

  // Function to count number of pets per room type
  const countPetsByRoomType = (roomType) => {
    return pets.filter(pet => pet.roomType === roomType).length;
  };

  // Function to check if adding another pet to a room type would exceed limits
  const wouldExceedRoomLimit = (roomType) => {
    const currentCount = countPetsByRoomType(roomType);
    return currentCount >= ROOM_LIMITS[roomType];
  };

  // Room selection configuration

// --- Real-time backend slot availability state ---
const [serviceAvailability, setServiceAvailability] = useState({});
const [availabilityError, setAvailabilityError] = useState(null);

// Fetch real-time slot availability from backend when date or roomType changes
useEffect(() => {
  if (!startDate) return;
  const fetchAvailability = async () => {
    try {
      setAvailabilityError(null);
      const formattedDate = formatDateForAPI(startDate);
      const response = await fetch(`${API_URL}/api/services/availability/${formattedDate}`);
      if (!response.ok) throw new Error('Failed to fetch availability');
      const data = await response.json();
      setServiceAvailability(Array.isArray(data) ? data : []);
    } catch (err) {
      setAvailabilityError('Could not fetch latest availability. Showing estimated slots.');
      setServiceAvailability([]);
    }
  };
  fetchAvailability();
}, [startDate]);

// Helper to get available slots for a room type from backend response
const getBackendAvailableSlots = (roomType) => {
  if (!serviceAvailability || !Array.isArray(serviceAvailability)) return null;
  // Find service with matching room type
  const match = serviceAvailability.find(s =>
    s.service_type === 'overnight' &&
    (s.service_name?.toLowerCase().includes(roomType?.toLowerCase()) ||
     s.category_name?.toLowerCase().includes(roomType?.toLowerCase()))
  );
  return match ? match.available_slots : null;
};

  // Get real-time room availability for the selected room type using backend if possible, fallback to BookingContext
const getAvailableSlotsForRoom = (roomType, date) => {
  // Prefer backend data if available
  const backendSlots = getBackendAvailableSlots(roomType);
  if (backendSlots !== null && backendSlots !== undefined) return backendSlots;
  // Fallback to context/local calculation
  try {
    const simpleRoomType = roomType && roomType.split(' ')[0].toLowerCase();
    return getAvailableSlots(date || new Date(), 'overnight', simpleRoomType) || 0;
  } catch (error) {
    console.error('Error getting room availability:', error);
    return 0;
  }
};

  // Function to check room availability - can be called for any room type change
  const checkRoomTypeAvailability = (roomTypeToCheck) => {
    if (!startDate || !endDate || !roomTypeToCheck) return true;
    
    try {
      // Prefer backend slot data for validation
      const backendSlots = getBackendAvailableSlots(roomTypeToCheck);
      if (backendSlots !== null && backendSlots !== undefined) {
        if (backendSlots <= 0) {
          alert(`Sorry, ${roomTypeToCheck} rooms are fully booked for the selected date.`);
          // Reset the selected room type for pets with this room type
          const updatedPets = [...pets];
          updatedPets.forEach(pet => {
            if (pet.roomType === roomTypeToCheck) {
              pet.roomType = '';
            }
          });
          setPets(updatedPets);
          
          // Also clear the global roomType if it matches
          if (roomType === roomTypeToCheck) {
            setRoomType('');
          }
          return false; // Room not available
        } else {
          console.log(`Available ${roomTypeToCheck} rooms (backend): ${backendSlots}`);
          return true; // Room available
        }
      } else {
        // Fallback to context/local logic
        // Get the simple room type (first word, lowercase)
        const simpleRoomType = roomTypeToCheck.split(' ')[0].toLowerCase();
        // Check if the service is at capacity
        const isAtCapacity = isServiceAtCapacity(startDate, 'overnight', roomTypeToCheck);
        
        if (isAtCapacity) {
          alert(`Sorry, ${roomTypeToCheck} rooms are fully booked for the selected dates.`);
          // Reset the selected room type for pets with this room type
          const updatedPets = [...pets];
          updatedPets.forEach(pet => {
            if (pet.roomType === roomTypeToCheck) {
              pet.roomType = '';
            }
          });
          setPets(updatedPets);
          
          // Also clear the global roomType if it matches
          if (roomType === roomTypeToCheck) {
            setRoomType('');
          }
          return false; // Room not available
        } else {
          console.log(`Available ${roomTypeToCheck} rooms (local): ${getAvailableSlotsForRoom(roomTypeToCheck, startDate)}`);
          return true; // Room available
        }
      }
    } catch (error) {
      console.error('Error checking room availability:', error);
      return false; // Consider not available on error
    }
  };

  // Check room availability when dates or the main room type changes
  useEffect(() => {
    if (startDate && endDate && roomType) {
      checkRoomTypeAvailability(roomType);
    }
  }, [startDate, endDate, roomType, isServiceAtCapacity, serviceAvailability]);

  // State for active pet tab
  const [activeTab, setActiveTab] = useState(0);
  
  // State for number of pets
  const [numberOfPets, setNumberOfPets] = useState(1);
  
  // State for owner information
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerAddress, setOwnerAddress] = useState('');
  
  // State for additional information
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [noAdditionalInfo, setNoAdditionalInfo] = useState(false);
  
  // State for agreement - set to true by default for simplified form
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);

  // Add loading state for booking submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Function to get available pets slots based on room availability
const getAvailablePetSlots = () => {
  // Get available slots for each room type
  const deluxeSlots = getAvailableSlotsForRoom('Deluxe Room', startDate);
  const premiumSlots = getAvailableSlotsForRoom('Premium Room', startDate);
  const executiveSlots = getAvailableSlotsForRoom('Executive Room', startDate);
  
  // Return total available slots across all room types
  return deluxeSlots + premiumSlots + executiveSlots || 10;
};  

  // Update pet information function
  const handlePetChange = (index, field, value) => {
    const updatedPets = [...pets];
    updatedPets[index][field] = value;

    // Special handling for petType field
    if (field === 'petType') {
      // Reset breed when pet type changes
      updatedPets[index].breed = '';
      updatedPets[index].customBreed = '';
      // Reset weight category when pet type changes
      updatedPets[index].weightCategory = '';
    }

    // Special handling for breed field
    if (field === 'breed' && value === 'Other') {
      updatedPets[index].customBreed = '';
    }

    // Update room type if not set
    if (!updatedPets[index].roomType) {
      updatedPets[index].roomType = roomType;
    }

    setPets(updatedPets);

    // Validate room availability after pet changes
    if (field === 'roomType') {
      checkRoomTypeAvailability(value);
    }
  };

  // Handle number of pets change with better error handling
const handleNumberOfPetsChange = (e) => {
  const newValue = parseInt(e.target.value, 10);
  
  if (isNaN(newValue)) {
    console.error('Invalid number of pets');
    return;
  }
  
  // Enforce minimum of 1 pet
  const safeValue = Math.max(1, newValue);
  
  // Get available slots for each room type
  const deluxeSlots = getAvailableSlotsForRoom('Deluxe Room', startDate);
  const premiumSlots = getAvailableSlotsForRoom('Premium Room', startDate);
  const executiveSlots = getAvailableSlotsForRoom('Executive Room', startDate);
  
  // Total available slots
  const maxPets = deluxeSlots + premiumSlots + executiveSlots || 10;
  const boundedValue = Math.min(safeValue, maxPets);
  
  if (boundedValue !== newValue) {
    console.warn(`Adjusted number of pets from ${newValue} to ${boundedValue} due to availability limits`);
  }
  
  setNumberOfPets(boundedValue);
  
  // Update pets array based on new count
  if (boundedValue > pets.length) {
    // Add more pet forms
    const newPets = [...pets];
    for (let i = pets.length; i < boundedValue; i++) {
      // Try to assign room type based on availability
      let assignedRoomType = '';
      if (deluxeSlots > 0) {
        assignedRoomType = 'Deluxe Room';
      } else if (premiumSlots > 0) {
        assignedRoomType = 'Premium Room';
      } else if (executiveSlots > 0) {
        assignedRoomType = 'Executive Room';
      }
      
      newPets.push({
        petName: '',
        petType: '',
        breed: '',
        customBreed: '',
        sex: '',
        dateOfBirth: '',
        age: '',
        roomType: assignedRoomType
      });
    }
    setPets(newPets);
  } else if (boundedValue < pets.length) {
    // Remove extra pet forms - only remove from the end
    setPets(pets.slice(0, boundedValue));
    
    // Make sure activeTab doesn't exceed the new number of pets
    if (activeTab >= boundedValue) {
      setActiveTab(boundedValue - 1);
    }
  }
};

  const createOrFetchUser = async (ownerName, ownerPhone, ownerEmail, ownerAddress) => {
    try {
      let userRes = await fetch(`${API_URL}/api/users/find`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: ownerEmail, phone: ownerPhone })
      });
      
      if (userRes.ok) {
        const user = await userRes.json();
        if (user && (user.id || user.user_id)) return user.id || user.user_id;
      } else if (userRes.status !== 404) {
        const errorData = await userRes.json();
        console.error('Error finding user:', errorData);
        throw new Error(`API error finding user: ${errorData.message || userRes.statusText}`);
      }
      
      // If not found (404) or no ID in OK response, create new user
      userRes = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          name: ownerName,
          phone: ownerPhone,
          email: ownerEmail || '',
          address: ownerAddress || ''
        })
      });

      if (!userRes.ok) {
        const errorData = await userRes.json();
        throw new Error(`Failed to create user: ${errorData.message || userRes.statusText}`);
      }
      const newUser = await userRes.json();
      return newUser.id || newUser.user_id;
    } catch (error) {
      console.error('Error in createOrFetchUser:', error);
      throw error;
    }
  };

  const createOrFetchPet = async (pet) => {
    try {
      let petRes = await fetch(`${API_URL}/api/pets/find`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          name: pet.petName, 
          type: pet.petType, 

        })
      });

      if (petRes.ok) {
        const petObj = await petRes.json();
        if (petObj && (petObj.id || petObj.pet_id)) return petObj.id || petObj.pet_id;
      } else if (petRes.status !== 404) {
        const errorData = await petRes.json();
        console.error('Error finding pet:', errorData);
        throw new Error(`API error finding pet: ${errorData.message || petRes.statusText}`);
      }
    
      // If not found (404) or no ID in OK response, create new pet
      petRes = await fetch(`${API_URL}/api/pets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({

          name: pet.petName,
          type: pet.petType,
          breed: pet.breed === 'Other' ? pet.customBreed : pet.breed || '',
          gender: pet.sex || '',
          date_of_birth: pet.dateOfBirth || null,
          age: pet.age || '',
          weight_category: pet.weightCategory || ''
        })
      });

      if (!petRes.ok) {
        const errorData = await petRes.json();
        console.error('Error creating pet:', errorData);
        throw new Error(`API error creating pet: ${errorData.message || petRes.statusText}`);
      }
      const newPet = await petRes.json();
      return newPet.id || newPet.pet_id;
    } catch (err) {
      console.error('Error creating/fetching pet:', err);
      throw new Error(`Could not create or find pet: ${err.message}`);
    }
  };

// Using the shared date utility functions from dateUtils.js

// Handler for 'Check Confirmation' button: validate, then navigate to confirmation page
const handleCheckConfirmation = (e) => {
  e.preventDefault();

  // Validate room type limits
  const executiveRoomCount = countPetsByRoomType('Executive Room');
  if (executiveRoomCount > ROOM_LIMITS['Executive Room']) {
    alert('Error: Maximum capacity exceeded for Executive Rooms (2 rooms). Please adjust your selection.');
    return;
  }

  let isValid = true;
  // Basic form validation
  if (!ownerName || !ownerPhone || !ownerEmail) {
    alert('Please provide your contact information');
    isValid = false;
  }

  // Validate pets information
  for (let i = 0; i < pets.length; i++) {
    const pet = pets[i];
    if (!pet.petName || !pet.petType || !pet.roomType || !pet.sex || !pet.weightCategory || 
        (pet.breed === 'Other' && !pet.customBreed)) {
      alert(`Please complete all required information for Pet #${i + 1}. If you selected 'Other' for breed, please enter a custom breed name.`);
      isValid = false;
      break;
    }
  }

  if (!isValid) return;

  // Format dates for display
  const formattedStartDate = formatDateForDisplay(startDate);
  const formattedEndDate = formatDateForDisplay(endDate);

  // Create individual booking payloads for each pet
  const pendingBookings = pets.map(pet => ({
    // IDs - these will be set by the API or in BookingContext

    petId: null,  // Will be set by addBooking if pet exists

    // Service Information
    serviceType: 'overnight',
    roomType: pet.roomType,
    room_type: pet.roomType,
    weightCategory: pet.weightCategory,
    weight_category: pet.weightCategory,

    // Dates and Times
    bookingDate: formatDateForAPI(startDate),
    booking_date: formatDateForAPI(startDate),
    startDate: formatDateForAPI(startDate),
    endDate: formatDateForAPI(endDate),
    end_date: formatDateForAPI(endDate),
    startTime: selectedTime || '08:00',
    start_time: selectedTime || '08:00',
    endTime: '17:00',
    end_time: '17:00',

    // Pet Information
    petName: pet.petName,
    pet_name: pet.petName,
    petType: pet.petType,
    pet_type: pet.petType,
    breed: pet.breed === 'Other' ? pet.customBreed : pet.breed,
    petGender: pet.sex,
    pet_gender: pet.sex,
    petAge: pet.age || '0',
    pet_age: pet.age || '0',

    // Owner Information
    ownerName: ownerName,
    owner_name: ownerName,
    ownerPhone: ownerPhone,
    owner_phone: ownerPhone,
    ownerEmail: ownerEmail,
    owner_email: ownerEmail,
    ownerAddress: ownerAddress,
    owner_address: ownerAddress,

    // Additional Details
    specialRequests: additionalInfo,
    special_requests: additionalInfo
  }));

  // Create booking data with properly formatted dates and all required information
  const bookingDataForConfirmation = {
    // Schedule Information
    startDate: formattedStartDate,
    endDate: formattedEndDate,
    selectedTime: selectedTime || '08:00',
    scheduledDateTime: `${formattedStartDate} - ${formattedEndDate}`,

    // Service Information
    serviceType: 'overnight',
    services: `Overnight Boarding (${numberOfPets} pet${numberOfPets > 1 ? 's' : ''})`,

    // Pet Information
    petDetails: pets.map(pet => ({
      ...pet,
      name: pet.petName,
      type: pet.petType,
      breed: pet.breed,
      gender: pet.sex,
      age: pet.age || '0',
      roomType: pet.roomType
    })),

    // Owner Information
    ownerDetails: {
      name: ownerName,
      phone: ownerPhone,
      email: ownerEmail,
      address: ownerAddress
    },

    // Additional Details
    additionalInfo,
    numberOfPets,
    roomType,
    selectedRoom,

    // Raw dates for processing
    rawStartDate: startDate,
    rawEndDate: endDate,

    // Add the array of pending bookings (one per pet)
    pendingBookings: pendingBookings,

        // Pricing
        totalAmount: totalAmount
  };

  console.log('[CheckConfirmation] Booking Data:', JSON.parse(JSON.stringify(bookingDataForConfirmation)));
  console.log('[CheckConfirmation] Created pending bookings for each pet:', pendingBookings.length);

  // Navigate to confirmation page with complete booking data
  navigate('/confirmation', { 
    state: { 
      bookingData: bookingDataForConfirmation,
      totalAmount: totalAmount,
      serviceType: 'overnight'
    }
  });
};

// Handler for final booking confirmation (should be in Confirmation.js)
const handleSubmit = async (e) => {
  // ... rest of the code remains the same ...
  e.preventDefault();
  setIsSubmitting(true);

  // Validate Executive Room limit
  const executiveRoomCount = countPetsByRoomType('Executive Room');
  if (executiveRoomCount > ROOM_LIMITS['Executive Room']) {
    alert('Error: Maximum capacity exceeded for Executive Rooms (2 rooms). Please adjust your selection.');
    setIsSubmitting(false);
    return;
  }
  // Validate owner fields
  if (!ownerName || !ownerPhone || !ownerEmail) {
    alert('Please fill in all required owner fields.');
    setIsSubmitting(false);
    return;
  }
  // Validate each pet
  for (let i = 0; i < pets.length; i++) {
    const pet = pets[i];
    if (!pet.petName || !pet.petType || !pet.breed || !pet.sex || !pet.roomType) {
      alert(`Please fill in all required fields for Pet #${i + 1}.`);
      setIsSubmitting(false);
      return;
    }
  }

  try {
    // Prepare booking details for each pet
    const bookingResults = [];
    for (let i = 0; i < pets.length; i++) {
      const pet = pets[i];
      const bookingDetailsForContext = {
        serviceType: 'overnight',
        roomType: pet.roomType,
        bookingDate: formatDateForAPI(startDate),
        startDate: formatDateForAPI(startDate),
        endDate: formatDateForAPI(endDate),
        startTime: selectedTime || '08:00',
        endTime: '17:00',
        specialRequests: additionalInfo || '',
        pet: {
          name: pet.petName,
          petName: pet.petName,
          type: pet.petType,
          breed: pet.breed,
          gender: pet.sex,
          age: pet.age,
          dateOfBirth: pet.dateOfBirth
        },
        petName: pet.petName,
        petType: pet.petType,
        breed: pet.breed,
        petGender: pet.sex,
        petAge: pet.age,
        ownerName,
        ownerEmail,
        ownerPhone,
        ownerAddress
      };
      bookingResults.push({ bookingDetails: bookingDetailsForContext, pet });
    }
    // Prepare bookingData for confirmation page
    const bookingDataForConfirmation = {
      serviceType: 'overnight',
      bookingDate: formatDateForAPI(startDate),
      startDate: formatDateForAPI(startDate),
      endDate: formatDateForAPI(endDate),
      startTime: selectedTime || '08:00',
      endTime: '17:00',
      scheduledDateTime: `${formatDateForDisplay(startDate)} - ${formatDateForDisplay(endDate)} | ${selectedTime || '08:00'} - 17:00`,
      specialRequests: additionalInfo,
      confirmationNumbers: [],
      rawBookingResponses: [],
      pendingBookings: bookingResults.map(r => r.bookingDetails),
      petDetails: pets,
      ownerDetails: {
        name: ownerName,
        phone: ownerPhone,
        email: ownerEmail,
        address: ownerAddress
      },
      roomType: roomType,
      numberOfPets: pets.length,
      services: 'Overnight',
      rawBookingResponses: []
    };
    navigate('/confirmation', { state: { bookingData: bookingDataForConfirmation, serviceType: 'overnight' } });
  } catch (error) {
    alert(`Booking failed: ${error.message || 'Please try again or contact support'}`);
  } finally {
    setIsSubmitting(false);
  }
};

// Calculate total based on room type and weight category
const getRoomTotal = (roomType, weightCategory) => {
  if (!roomType || !weightCategory) return 0;
  return WEIGHT_PRICES[roomType]?.[weightCategory] || 0;
};

// ---------------- TOTAL AMOUNT CALCULATION ----------------
useEffect(() => {
  try {
    if (!startDate || !endDate) {
      setTotalAmount(0);
      return;
    }
    // Calculate number of nights (minimum 1)
    const nights = Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)));

    let sum = 0;
    pets.forEach(p => {
      if (p.roomType && p.weightCategory) {
        const perNight = getRoomTotal(p.roomType, p.weightCategory);
        sum += perNight * nights;
      }
    });
    setTotalAmount(sum);
  } catch (err) {
    console.error('Error computing total amount:', err);
  }
}, [pets, startDate, endDate]);

// Function to check if a specific date is unavailable for a room type
const checkDateAvailability = (date, roomType) => {
  if (!date || !roomType) return false;
  
  try {
    // First check if the date is generally unavailable
    if (isDateUnavailable(date)) {
      return false;
    }
    
    // Then check if the specific room type is at capacity
    return !isServiceAtCapacity(date, 'overnight', roomType);
  } catch (error) {
    console.error('Error checking date availability:', error);
    return true; // Assume available on error to avoid blocking reservations
  }
};
  // Initialize data from location state if available
  useEffect(() => {
    if (location.state) {
      if (location.state.startDate) {
        setStartDate(createConsistentDate(location.state.startDate));
      }
      if (location.state.endDate) {
        setEndDate(createConsistentDate(location.state.endDate));
      }
      if (location.state.selectedTime) {
        setSelectedTime(location.state.selectedTime);
      }
    }
  }, [location.state]);

  // Pre-fill form with bookingData from navigation state
  useEffect(() => {
    if (location.state && location.state.bookingData) {
      const data = location.state.bookingData;
      if (data.checkInDate) setStartDate(new Date(data.checkInDate));
      if (data.checkOutDate) setEndDate(new Date(data.checkOutDate));
      if (data.checkInTime) setSelectedTime(data.checkInTime);
      if (data.serviceType) setServiceType(data.serviceType.toLowerCase());
      // Optionally set roomType, etc. if included
    }
  }, [location.state]);

  return (
    <div className="reservation-root">
      <div className="header-section">
        <Container>
          <h2>Guest Information (Overnight)</h2>
          <p>Please provide details for your pet(s)</p>
        </Container>
      </div>
      
      {/* Room Availability Display for all room types */}
      <Container className="mb-3">
        <div className="availability-info text-center">
          <h5 className="text-center mb-3">Room Availability</h5>
          {availabilityError && (
            <div className="text-danger text-center mb-2">
              <small>{availabilityError}</small>
            </div>
          )}
          {startDate ? (
            <div className="service-availability-container">
              {/* Show availability for all room types regardless of selection */}
              <div className="d-flex justify-content-center">
                <div className="availability-row">
                  <small>
                    Deluxe Room: {(() => {
                      const slots = getAvailableSlotsForRoom('Deluxe Room', startDate);
                      return slots === null ? 'Loading...' : `${slots} rooms available`;
                    })()} | 
                    Premium Room: {(() => {
                      const slots = getAvailableSlotsForRoom('Premium Room', startDate);
                      return slots === null ? 'Loading...' : `${slots} rooms available`;
                    })()} | 
                    Executive Room: {(() => {
                      const slots = getAvailableSlotsForRoom('Executive Room', startDate);
                      return slots === null ? 'Loading...' : `${slots} rooms available`;
                    })()}
                  </small>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <small>Please select check-in and check-out dates to see availability</small>
            </div>
          )}
        </div>
      </Container>

      {/* Form Section */}
      <Container>
        <Form onSubmit={handleCheckConfirmation}>
          {/* Number of Pets Selection */}
          <div className="info-card">
            <Row className="mb-3">
              <Col md={2}>
                <Form.Group controlId="numberOfPets">
                  <Form.Label>Number of Pets</Form.Label>
                  <Form.Control 
                    as="select"
                    value={numberOfPets}
                    onChange={handleNumberOfPetsChange}
                  >
                    {[...Array(10)].map((_, i) => (
                      <option key={i+1} value={i+1}>{i+1}</option>
                    ))}
                  </Form.Control>
                </Form.Group>
              </Col>
            </Row>
          </div>

          {/* Total Amount Card */}
          <div className="mb-4">
            <TotalAmountCard amount={totalAmount} />
          </div>
          
          {/* Pet Information Section */}
          <div className="info-card">
            <div className="text-center mb-4">
              <h5 className="pet-info-title">
                <FontAwesomeIcon icon={faPaw} className="me-2" />Pet Information
              </h5>
            </div>

            <div className="pet-info-container">
              <div className="text-center mb-4">
                <h6>Pet Information</h6>
              </div>
              
              <Row className="mb-4">
                <Col md={4}>
                  <div className="field-label">Pet's Name (1)</div>
                  <div className="position-relative">
                    <Form.Control 
                      type="text"
                      value={pets[0]?.petName || ''}
                      onChange={(e) => handlePetChange(0, 'petName', e.target.value)}
                      placeholder="e.g., Max, Bella, Luna..."
                      required
                    />
                    <div className="ms-2">
                      {(pets[0].petName) ? 
                      <FontAwesomeIcon icon={faCheck} className="text-success ms-2" /> : 
                      <Badge bg="warning" className="ms-2">!</Badge>
                      }
                    </div>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="field-label">Room Type (1)</div>
                  <div className="position-relative">
                    <Form.Control 
                      as="select"
                      value={pets[0]?.roomType || ''}
                      onChange={(e) => handlePetChange(0, 'roomType', e.target.value)}
                      required
                      className="form-select"
                    >
                      <option value="">Select Room Type</option>
                      <option value="Deluxe Room">Deluxe Room</option>
                      <option value="Premium Room">Premium Room</option>
                      <option value="Executive Room">Executive Room</option>
                    </Form.Control>
                    <div className="ms-2">
                      {(pets[0].roomType) ? 
                      <FontAwesomeIcon icon={faCheck} className="text-success ms-2" /> : 
                      <Badge bg="warning" className="ms-2">!</Badge>
                      }
                    </div>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="field-label">Pet's Type (1)</div>
                  <div className="position-relative">
                    <Form.Control 
                      as="select"
                      value={pets[0]?.petType || ''}
                      onChange={(e) => handlePetChange(0, 'petType', e.target.value)}
                      required
                      className="form-select"
                    >
                      <option value="">Select Pet Type</option>
                      <option value="Dog">Dog</option>
                      <option value="Cat">Cat</option>
                    </Form.Control>
                    <div className="ms-2">
                      {(pets[0].petType) ? 
                      <FontAwesomeIcon icon={faCheck} className="text-success ms-2" /> : 
                      <Badge bg="warning" className="ms-2">!</Badge>
                      }
                    </div>
                  </div>
                </Col>

              </Row>

              {numberOfPets > 1 && [...Array(numberOfPets - 1)].map((_, i) => {
                const petIndex = i + 1;
                return (
                  <Row className="mb-4" key={petIndex}>
                    <Col md={4}>
                      <div className="field-label">Pet's Name ({petIndex + 1})</div>
                      <div className="position-relative">
                        <Form.Control 
                          type="text"
                          value={pets[petIndex]?.petName || ''}
                          onChange={(e) => handlePetChange(petIndex, 'petName', e.target.value)}
                          placeholder="e.g., Max, Bella, Luna..."
                          required
                        />
                        <div className="ms-2">
                          {(pets[petIndex]?.petName) ? 
                          <FontAwesomeIcon icon={faCheck} className="text-success ms-2" /> : 
                          <Badge bg="warning" className="ms-2">!</Badge>
                          }
                        </div>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="field-label">Room Type ({petIndex + 1})</div>
                      <div className="position-relative">
                        <Form.Control 
                          as="select"
                          value={pets[petIndex]?.roomType || ''}
                          onChange={(e) => handlePetChange(petIndex, 'roomType', e.target.value)}
                          required
                          className="form-select"
                        >
                          <option value="">Select Room Type</option>
                          <option value="Deluxe Room">Deluxe Room</option>
                          <option value="Premium Room">Premium Room</option>
                          <option value="Executive Room">Executive Room</option>
                        </Form.Control>
                        <div className="ms-2">
                          {(pets[petIndex]?.roomType) ? 
                          <FontAwesomeIcon icon={faCheck} className="text-success ms-2" /> : 
                          <Badge bg="warning" className="ms-2">!</Badge>
                          }
                        </div>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="field-label">Pet's Type ({petIndex + 1})</div>
                      <div className="position-relative">
                        <Form.Control 
                          as="select"
                          value={pets[petIndex]?.petType || ''}
                          onChange={(e) => handlePetChange(petIndex, 'petType', e.target.value)}
                          required
                          className="form-select"
                        >
                          <option value="">Select Pet Type</option>
                          <option value="Dog">Dog</option>
                          <option value="Cat">Cat</option>
                        </Form.Control>
                        <div className="ms-2">
                          {(pets[petIndex]?.petType) ? 
                          <FontAwesomeIcon icon={faCheck} className="text-success ms-2" /> : 
                          <Badge bg="warning" className="ms-2">!</Badge>
                          }
                        </div>
                      </div>
                    </Col>


                  </Row>
                );
              })}
            </div>

            <div className="pet-details-container mt-4">
              <div className="text-center mb-4">
                <h6>Pet Details</h6>
              </div>
              
              <Row className="mb-4">
                <Col md={4}>
                  <div className="field-label">Weight Category (1)</div>
                  <div className="position-relative">
                    <Form.Control 
                      as="select"
                      value={pets[0]?.weightCategory || ''}
                      onChange={(e) => handlePetChange(0, 'weightCategory', e.target.value)}
                      required
                      className="form-select"
                      disabled={!pets[0]?.petType}
                    >
                      <option value="">Select Weight</option>
                      {pets[0]?.petType && (
                        <>
                          <option value="Small (1-9 KG)">Small (1-9 KG) - ₱{WEIGHT_PRICES[pets[0].roomType]?.['Small (1-9 KG)'] || 500}/night</option>
                          <option value="Medium (9-25 KG)">Medium (9-25 KG) - ₱{WEIGHT_PRICES[pets[0].roomType]?.['Medium (9-25 KG)'] || 650}/night</option>
                          <option value="Large (25-40 KG)">Large (25-40 KG) - ₱{WEIGHT_PRICES[pets[0].roomType]?.['Large (25-40 KG)'] || 750}/night</option>
                          <option value="Extra-Large (40+ KG)">Extra-Large (40+ KG) - ₱{WEIGHT_PRICES[pets[0].roomType]?.['Extra-Large (40+ KG)'] || 1000}/night</option>
                        </>
                      )}
                    </Form.Control>
                    <div className="ms-2">
                      {(pets[0].weightCategory) ? 
                      <FontAwesomeIcon icon={faCheck} className="text-success ms-2" /> : 
                      <Badge bg="warning" className="ms-2">!</Badge>
                      }
                    </div>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="field-label">Breed (1)</div>
                  <div className="position-relative">
                    {pets[0]?.petType ? (
                      <>
                        <Form.Control 
                          as="select"
                          value={pets[0]?.breed || ''}
                          onChange={(e) => handlePetChange(0, 'breed', e.target.value)}
                          className="form-select"
                        >
                          <option value="">Select Breed</option>
                          {getBreedOptions(pets[0].petType).map(breed => (
                            <option key={breed} value={breed}>{breed}</option>
                          ))}
                        </Form.Control>
                        {pets[0]?.breed === 'Other' && (
                          <Form.Control 
                            type="text"
                            value={pets[0]?.customBreed || ''}
                            onChange={(e) => handlePetChange(0, 'customBreed', e.target.value)}
                            placeholder="Enter breed name"
                            className="mt-2"
                          />
                        )}
                      </>
                    ) : (
                      <Form.Control 
                        as="select"
                        value=""
                        disabled
                        className="form-select"
                      >
                        <option value="">Select Pet Type First</option>
                      </Form.Control>
                    )}
                    <div className="ms-2">
                      {(pets[0].breed && (pets[0].breed !== 'Other' || pets[0].customBreed)) ? 
                      <FontAwesomeIcon icon={faCheck} className="text-success ms-2" /> : 
                      <Badge bg="warning" className="ms-2">!</Badge>
                      }
                    </div>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="field-label">Sex (1)</div>
                  <div className="position-relative">
                    <Form.Control 
                      as="select"
                      value={pets[0]?.sex || ''}
                      onChange={(e) => handlePetChange(0, 'sex', e.target.value)}
                      required
                      className="form-select"
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </Form.Control>
                    <div className="ms-2">
                      {(pets[0].sex) ? 
                      <FontAwesomeIcon icon={faCheck} className="text-success ms-2" /> : 
                      <Badge bg="warning" className="ms-2">!</Badge>
                      }
                    </div>
                  </div>
                </Col>
              </Row>

              {numberOfPets > 1 && [...Array(numberOfPets - 1)].map((_, i) => {
                const petIndex = i + 1;
                // Use pet name (if available) for extra uniqueness
                const uniqueKey = `pet-details-row-${petIndex}-${pets[petIndex]?.petName || petIndex}`;
                return (
                  <Row className="mb-4" key={uniqueKey}>
                    <Col md={4}>
                      <div className="field-label">Weight Category ({petIndex + 1})</div>
                      <div className="position-relative">
                        <Form.Control 
                          as="select"
                          value={pets[petIndex]?.weightCategory || ''}
                          onChange={(e) => handlePetChange(petIndex, 'weightCategory', e.target.value)}
                          required
                          className="form-select"
                          disabled={!pets[petIndex]?.petType}
                        >
                          <option value="">Select Weight</option>
                          {pets[petIndex]?.petType && (
                            <>
                              <option value="Small (1-9 KG)">Small (1-9 KG) - ₱{WEIGHT_PRICES[pets[petIndex].roomType]?.['Small (1-9 KG)'] || 500}/night</option>
                              <option value="Medium (9-25 KG)">Medium (9-25 KG) - ₱{WEIGHT_PRICES[pets[petIndex].roomType]?.['Medium (9-25 KG)'] || 650}/night</option>
                              <option value="Large (25-40 KG)">Large (25-40 KG) - ₱{WEIGHT_PRICES[pets[petIndex].roomType]?.['Large (25-40 KG)'] || 750}/night</option>
                              <option value="Extra-Large (40+ KG)">Extra-Large (40+ KG) - ₱{WEIGHT_PRICES[pets[petIndex].roomType]?.['Extra-Large (40+ KG)'] || 1000}/night</option>
                            </>
                          )}
                        </Form.Control>
                        <div className="ms-2">
                          {(pets[petIndex].weightCategory) ? 
                          <FontAwesomeIcon icon={faCheck} className="text-success ms-2" /> : 
                          <Badge bg="warning" className="ms-2">!</Badge>
                          }
                        </div>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="field-label">Breed ({petIndex + 1})</div>
                      <div className="position-relative">
                        {pets[petIndex]?.petType ? (
                          <>
                            <Form.Control 
                              as="select"
                              value={pets[petIndex]?.breed || ''}
                              onChange={(e) => handlePetChange(petIndex, 'breed', e.target.value)}
                              className="form-select"
                            >
                              <option value="">Select Breed</option>
                              {getBreedOptions(pets[petIndex].petType).map(breed => (
                                <option key={breed} value={breed}>{breed}</option>
                              ))}
                            </Form.Control>
                            {pets[petIndex]?.breed === 'Other' && (
                              <Form.Control 
                                type="text"
                                value={pets[petIndex]?.customBreed || ''}
                                onChange={(e) => handlePetChange(petIndex, 'customBreed', e.target.value)}
                                placeholder="Enter breed name"
                                className="mt-2"
                              />
                            )}
                          </>
                        ) : (
                          <Form.Control 
                            as="select"
                            value=""
                            disabled
                            className="form-select"
                          >
                            <option value="">Select Pet Type First</option>
                          </Form.Control>
                        )}
                        <div className="ms-2">
                          {(pets[petIndex].breed && (pets[petIndex].breed !== 'Other' || pets[petIndex].customBreed)) ? 
                          <FontAwesomeIcon icon={faCheck} className="text-success ms-2" /> : 
                          <Badge bg="warning" className="ms-2">!</Badge>
                          }
                        </div>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="field-label">Sex ({petIndex + 1})</div>
                      <div className="position-relative">
                        <Form.Control 
                          as="select"
                          value={pets[petIndex]?.sex || ''}
                          onChange={(e) => handlePetChange(petIndex, 'sex', e.target.value)}
                          required
                          className="form-select"
                        >
                          <option value="">Select</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </Form.Control>
                        <div className="ms-2">
                          {(pets[petIndex].sex) ? 
                          <FontAwesomeIcon icon={faCheck} className="text-success ms-2" /> : 
                          <Badge bg="warning" className="ms-2">!</Badge>
                          }
                        </div>
                      </div>
                    </Col>
                  </Row>
                );
              })}
            </div>

            <div className="date-of-birth-container mt-4">
              <div className="text-center mb-4">
                <h6>Date of Birth</h6>
              </div>
              
              <div className="field-label">Date of Birth (1)</div>
              <div className="position-relative mb-4">
                <Form.Control
                  type="date"
                  value={pets[0]?.dateOfBirth || ''}
                  onChange={e => handlePetChange(0, 'dateOfBirth', e.target.value)}
                  max={formatDateForAPI(new Date())}
                  className="form-control"
                  required
                />
                <div className="ms-2">
                  {(pets[0].dateOfBirth) ? 
                  <Badge bg="success" className="ms-2">✓</Badge> : 
                  <Badge bg="warning" className="ms-2">!</Badge>
                  }
                </div>
              </div>

              {numberOfPets > 1 && [...Array(numberOfPets - 1)].map((_, i) => {
                const petIndex = i + 1;
                // Use pet name (if available) for extra uniqueness
                const uniqueKey = `pet-dob-${petIndex}-${pets[petIndex]?.petName || petIndex}`;
                return (
                  <div key={uniqueKey}>
                    <div className="field-label">Date of Birth ({petIndex + 1})</div>
                    <div className="position-relative mb-4">
                      <Form.Control
                        type="date"
                        value={pets[petIndex]?.dateOfBirth || ''}
                        onChange={e => handlePetChange(petIndex, 'dateOfBirth', e.target.value)}
                        max={formatDateForAPI(new Date())}
                        className="form-control"
                        required
                      />
                      <div className="ms-2">
                        {(pets[petIndex].dateOfBirth) ? 
                        <Badge bg="success" className="ms-2">✓</Badge> : 
                        <Badge bg="warning" className="ms-2">!</Badge>
                        }
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Owner Information */}
          <div className="info-card">
            <h3><FontAwesomeIcon icon={faUser} className="me-2" />Owner Information</h3>
            <Row>
              <Col md={6}>
                <Form.Group controlId="ownerName">
                  <Form.Label>Owner's Name</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g., John Smith"
                    required
                  />
                  <div className="ms-2">
                      {(ownerName) ? 
                      <FontAwesomeIcon icon={faCheck} className="text-success ms-2" /> : 
                      <Badge bg="warning" className="ms-2">!</Badge>
                      }
                    </div>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="ownerPhone">
                  <Form.Label>Mobile Number</Form.Label>
                  <Form.Control 
                    type="tel" 
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    placeholder="e.g., 09123456789"
                    required
                  />
                  <div className="ms-2">
                      {(ownerPhone) ? 
                      <FontAwesomeIcon icon={faCheck} className="text-success ms-2" /> : 
                      <Badge bg="warning" className="ms-2">!</Badge>
                      }
                    </div>
                </Form.Group>
              </Col>
            </Row>
            
            <Row className="mt-3">
              <Col md={6}>
                <Form.Group controlId="ownerEmail">
                  <Form.Label>Owner's Email Address</Form.Label>
                  <Form.Control 
                    type="email" 
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="e.g., john.smith@email.com"
                    required
                  />
                  <div className="ms-2">
                      {(ownerEmail) ? 
                      <FontAwesomeIcon icon={faCheck} className="text-success ms-2" /> : 
                      <Badge bg="warning" className="ms-2">!</Badge>
                      }
                    </div>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="ownerAddress">
                  <Form.Label>Complete Address</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={ownerAddress}
                    onChange={(e) => setOwnerAddress(e.target.value)}
                    placeholder="e.g., 123 Main St, City, State"
                  />
                  <div className="ms-2">
                      {(ownerAddress) ? 
                      <FontAwesomeIcon icon={faCheck} className="text-success ms-2" /> : 
                      <Badge bg="warning" className="ms-2">!</Badge>
                      }
                    </div>
                </Form.Group>
              </Col>
            </Row>
          </div>
          
          <div className="info-card additional-info-section">
            <h3><FontAwesomeIcon icon={faNotesMedical} className="me-2" />Additional Information (optional)</h3>
            <p>(Feeding habits, medical conditions, allergies, tick and flea needs, vaccine info, etc.)</p>
            
            <Form.Group controlId="additionalInfo" className="mb-3">
              <Form.Control 
                as="textarea" 
                rows={4} 
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                disabled={noAdditionalInfo}
              />
            </Form.Group>
          </div>
          
          <Form.Group controlId="agreeTerms" className="mb-4 text-center">
            <Form.Check 
              type="checkbox" 
              label={<>
                I agree to all <span 
                  style={{ 
                    color: '#0d6efd', 
                    textDecoration: 'underline', 
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    setShowAgreement(true);
                  }}
                >
                  Terms and Conditions
                </span>
              </>} 
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              required
            />
          </Form.Group>
          
          {/* Agreement Modal */}
          <Agreement 
            show={showAgreement} 
            onHide={() => setShowAgreement(false)} 
          />
          
          <div className="text-center">
            <Button 
              type="submit" 
              variant="success" 
              className="rounded-pill px-4 py-2"
              disabled={!agreeTerms}
            >
              Check Confirmation
            </Button>
          </div>
          <br></br><br></br><br></br>
        </Form>
      </Container>
      
      {/* Help Button */}
      
      
      {/* Date Picker Modal */}
      <DatePickerModal 
        show={showDatePickerModal} 
        onHide={() => setShowDatePickerModal(false)} 
        serviceType={serviceType}
        onDateSelect={(dateData) => {
          // Update state with string date values directly (no Date object creation)
          setStartDate(dateData.startDate);
          setEndDate(dateData.endDate);
          setSelectedTime(dateData.selectedTime);
          setShowDatePickerModal(false);
        }}
      />

      {isSubmitting && (
        <div className="booking-processing text-center" style={{ minHeight: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.8)', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
          <div className="spinner-border text-warning mb-3" role="status" style={{ width: 50, height: 50 }}>
            <span className="visually-hidden">Processing...</span>
          </div>
          <h5>Submitting your booking...</h5>
        </div>
      )}
    </div>
  );
};

export default OvernightReservation;

