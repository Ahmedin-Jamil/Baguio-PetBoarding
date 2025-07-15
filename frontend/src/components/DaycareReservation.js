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
import './DaycareReservation.css';
import Agreement from './Agreement';
import TotalAmountCard from './TotalAmountCard';
import DatePickerModal from './DatePickerModal';
import { useRoomAvailability } from '../context/RoomAvailabilityContext';
import { useBookings } from '../context/BookingContext';
import { API_URL } from '../config';
import { formatDateForAPI, formatDateForDisplay, formatDateForConfirmation, createConsistentDate } from '../utils/dateUtils';
import { getBreedOptions } from '../utils/breedUtils';

// Maximum number of daycare slots available

const MAX_DAYCARE_SLOTS = 10;

// Price configuration based on weight categories for daycare

// Helper: Extract just the weight category value from display string
const getWeightCategoryValue = (displayCategory, petType = '') => {
  if (!displayCategory || typeof displayCategory !== 'string') {
    // If no category provided, default to 'Cat' for cats, otherwise 'Medium'
    return petType.toLowerCase() === 'cat' ? 'Cat' : 'Medium';
  }

  const dc = displayCategory.toLowerCase();
  if (dc.includes('small')) return 'Small';
  if (dc.includes('medium')) return 'Medium';
  // Extra-large may appear as "Extra-Large", "Extra Large", "xlarge", "x-large", "xl"
  if (/(x-?large|extra[-\s]?large|xlarge|xl)/.test(dc)) return 'X-Large';
  if (dc.includes('large')) return 'Large';
  if (dc.includes('cat')) return 'Cat';

  // Fallback: If pet is a cat, return 'Cat'; else default to 'Medium'
  return petType.toLowerCase() === 'cat' ? 'Cat' : 'Medium';
};
const WEIGHT_PRICES = {
  'Small (1-9 KG)': 350,
  'Medium (9-25 KG)': 450,
  'Large (25-40 KG)': 550,
  'Extra-Large (40+ KG)': 650,
  'Cat': 450
};

const DaycareReservation = () => {
  // Total amount state
  const [totalAmount, setTotalAmount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    addBooking,
    countBookingsByServiceAndRoom,
    fetchUnavailableDates,
    isDateUnavailable
  } = useBookings();

  // Get room availability context
  const { 
    getRoomAvailability = () => 0,
    updateRoomAvailability = () => {}
  } = useRoomAvailability() || {};

  
  // Fetch unavailable dates when component mounts
  useEffect(() => {
    fetchUnavailableDates()
      .then(() => {
        console.log('Successfully fetched unavailable dates from API');
      })
      .catch(error => {
        console.error('Error fetching unavailable dates:', error);
      });
  }, [fetchUnavailableDates]);

  // State for date and time
  // Helper function to convert 12-hour time to 24-hour format
  const convertTo24Hour = (time12h) => {
    if (!time12h) return '08:00';
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');

    // Convert hours to number for arithmetic, then back to string for padding
    let hrs = parseInt(hours, 10);

    if (hrs === 12) hrs = 0;
    if (modifier === 'PM') hrs += 12;

    const hoursStr = hrs.toString().padStart(2, '0');
    return `${hoursStr}:${minutes}`;
  };

  // Helper function to convert 24-hour time to 12-hour format
  const convertTo12Hour = (time24h) => {
    const [hours, minutes] = time24h.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const [date, setDate] = useState(createConsistentDate(location.state?.date || location.state?.selectedDate || new Date()));
  const [startTime, setStartTime] = useState(convertTo24Hour(location.state?.checkInTime || location.state?.selectedTime || (location.state?.bookingData?.startTime) ) || '08:00');
  const [endTime, setEndTime] = useState(convertTo24Hour(location.state?.checkOutTime || location.state?.endTime || (location.state?.bookingData?.endTime)) || '17:00');
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [serviceType] = useState('daycare');

  // State for slots and availability
  const [slotCount, setSlotCount] = useState(0);
  const [availabilityError, setAvailabilityError] = useState(null);

  // State for multi-pet handling with tabs
  const [activeTab, setActiveTab] = useState(0);
  const [numberOfPets, setNumberOfPets] = useState(1);
  const [pets, setPets] = useState([
    { 
      petName: '', 
      petType: '', 
      breed: '', 
      customBreed: '', 
      sex: '', 
      dateOfBirth: '',
      weightCategory: ''
    }
  ]);

  // Owner information state
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');

  // Re-compute total whenever pets array changes
  useEffect(() => {
    let sum = 0;
    pets.forEach(p => {
      if (p.weightCategory) {
        sum += WEIGHT_PRICES[p.weightCategory] || 0;
      }
    });
    setTotalAmount(sum);
  }, [pets]);
  const [ownerAddress, setOwnerAddress] = useState('');
  
  // Re-compute total amount whenever pets array changes
  useEffect(() => {
    const sum = pets.reduce((subtotal, pet) => subtotal + getDaycareTotal(pet.weightCategory), 0);
    setTotalAmount(sum);
  }, [pets]);

  // Additional state
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle back navigation
  useEffect(() => {
    const handlePopState = () => {
      navigate('/', { replace: true });
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [navigate]);
  
  useEffect(() => {
    // Show alert if no date was selected and there's no data in URL
    if (!date && !location.state) {
      // Create alert dialog instead of redirecting
      const alertDialog = document.createElement('div');
      alertDialog.className = 'alert-dialog';
      alertDialog.innerHTML = `
        <div class="alert-content">
          <p>No date was selected. Please start your booking from the homepage.</p>
          <button class="btn btn-primary">OK</button>
        </div>
      `;
      document.body.appendChild(alertDialog);
      
      // Add event listener to OK button
      const okButton = alertDialog.querySelector('button');
      okButton.addEventListener('click', () => {
        navigate('/', { replace: true });
      });
      
      // Style for the alert dialog
      const style = document.createElement('style');
      style.textContent = `
        .alert-dialog {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 1000;
        }
        .alert-content {
          background-color: white;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          max-width: 400px;
          width: 90%;
        }
      `;
      document.head.appendChild(style);
    }
  }, [date, location.state, navigate]);
  
  // Update pet information with validation
  const updatePetInfo = (index, updates) => {
    const updatedPets = [...pets];
    updatedPets[index] = {
      ...updatedPets[index],
      ...updates
    };
    setPets(updatedPets);
  };

  // Handle pet info change with additional logic for breed / customBreed
  const handlePetChange = (index, field, value) => {
    // Changing pet type should reset breed & custom breed
    if (field === 'petType') {
      updatePetInfo(index, {
        [field]: value,
        breed: '',
        customBreed: ''
      });
      return;
    }

    // If user selects a breed option
    if (field === 'breed') {
      // When "Other" is picked, clear any previous custom breed so the input shows blank
      if (value === 'Other') {
        updatePetInfo(index, { breed: value, customBreed: '' });
      } else {
        // For any regular breed selection, clear customBreed in case it was previously set
        updatePetInfo(index, { breed: value, customBreed: '' });
      }
      return;
    }

    // Default handler for all other fields
    updatePetInfo(index, { [field]: value });
  };

  // Handle number of pets change with validation
  const handleNumberOfPetsChange = (e) => {
    let value = parseInt(e.target.value, 10);
    
    // Validate input
    if (isNaN(value) || value < 1) value = 1;
    if (value > MAX_DAYCARE_SLOTS) {
      alert(`Maximum ${MAX_DAYCARE_SLOTS} pets allowed for daycare service.`);
      value = MAX_DAYCARE_SLOTS;
    }

    setNumberOfPets(value);
    
    // Update pets array
    setPets(prev => {
      if (value > prev.length) {
        // Add more pets
        return [
          ...prev,
          ...Array(value - prev.length).fill({
            petName: '',
            petType: '',
            breed: '',
            customBreed: '',
            sex: '',
            dateOfBirth: '',
            weightCategory: ''
          })
        ];
      } else {
        // Remove excess pets
        return prev.slice(0, value);
      }
    });
  };

  // Helper function to calculate total based on weight category
  const getDaycareTotal = (weightCategory) => {
    return WEIGHT_PRICES[weightCategory] || 0;
  };

  // Function to check if a specific date is unavailable
  const checkDateAvailability = async (date) => {
    if (!date) return false;
    try {
      const count = await countBookingsByServiceAndRoom(date, 'daycare');
      setSlotCount(count);
      return count >= MAX_DAYCARE_SLOTS;
    } catch (error) {
      console.error('Error checking date availability:', error);
      setAvailabilityError('Unable to check availability. Please try again.');
      return false;
    }
  };

  // Function to create or fetch user
  const createOrFetchUser = async (ownerName, ownerPhone, ownerEmail, ownerAddress) => {
    try {
      // First try to find the user by email or phone
      const findResponse = await fetch(`${API_URL}/api/users/find`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: ownerEmail,
          phone: ownerPhone
        })
      });

      // If user found, return their ID
      if (findResponse.ok) {
        const user = await findResponse.json();
        return user.id || user.user_id;
      }

      // If user not found (404) or other error, create new user
      const createResponse = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: ownerName,
          phone: ownerPhone,
          email: ownerEmail,
          address: ownerAddress
        })
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.message || 'Failed to create user');
      }

      const newUser = await createResponse.json();
      return newUser.id || newUser.user_id;
    } catch (error) {
      console.error('Error creating/fetching user:', error);
      throw error;
    }
  };

  // Function to create or fetch pet
  const createOrFetchPet = async (pet) => {
    try {
      // First try to find the pet
      console.log('[DEBUG] Attempting to find/create pet', pet);
    let petRes = await fetch(`${API_URL}/api/pets/find`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          name: pet.petName, 
          type: pet.petType,
          user_id: pet.user_id
        })
      });

      if (petRes.ok) {
        const petObj = await petRes.json();
        if (petObj && (petObj.id || petObj.pet_id)) return petObj;
      } else if (petRes.status !== 404) {
        const errorData = await petRes.json();
        console.error('Error finding pet:', errorData);
        throw new Error(`API error finding pet: ${errorData.message || petRes.statusText}`);
      }

      // If pet not found, create a new one
      petRes = await fetch(`${API_URL}/api/pets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: pet.petName,
          type: pet.petType,
          user_id: pet.user_id,
          breed: pet.customBreed ? `${pet.breed} - ${pet.customBreed}` : (pet.breed || ''),
          gender: pet.sex || '',
          
          // Send just the weight category value to match database ENUM
          weight_category: getWeightCategoryValue(pet.weightCategory, pet.petType)
        })
      });

      if (!petRes.ok) {
        const raw = await petRes.text();
        console.error('[DEBUG] Pet create response text:', raw);
        let errorData;
        try { errorData = JSON.parse(raw); } catch { errorData = { message: raw }; }
        throw new Error(`API error creating pet: ${errorData.message || petRes.statusText}`);
      }
      const newPet = await petRes.json();
      return newPet;
    } catch (err) {
      console.error('Error creating/fetching pet:', err);
      throw new Error(`Could not create or find pet: ${err.message}`);
    }
  };

  // Fetch current slot count for selected date
  useEffect(() => {
    const fetchSlots = async () => {
      if (date) {
        try {
          const count = await countBookingsByServiceAndRoom(date, 'daycare');
          setSlotCount(count);
          setAvailabilityError(null);
        } catch (error) {
          console.error('Error fetching slot count:', error);
          setAvailabilityError('Unable to check availability. Please try again.');
        }
      }
    };
    fetchSlots();
  }, [date, countBookingsByServiceAndRoom]);

  // Helper to format date as YYYY-MM-DD
  const formatDateString = (d) => {
    if (!d) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!date) {
        alert('Please select a date');
        setIsSubmitting(false);
        return;
      }

      const isUnavailable = await checkDateAvailability(date);
      if (isUnavailable) {
        alert('No slots available for the selected date');
        setIsSubmitting(false);
        return;
      }

      // Validate owner fields
      if (!ownerName || !ownerPhone || !ownerEmail) {
        alert('Please fill in all owner information fields');
        setIsSubmitting(false);
        return;
      }

      // Validate pet fields
      for (let i = 0; i < pets.length; i++) {
        if (!pets[i].petName || !pets[i].petType || !pets[i].weightCategory) {
          alert('Please fill in all required pet information');
          setIsSubmitting(false);
          return;
        }
      }

      // Create or fetch user first
      const userId = await createOrFetchUser(ownerName, ownerPhone, ownerEmail, ownerAddress);
      console.log('Created/fetched user with ID:', userId);

      // Create bookings for each pet
      const bookingResults = [];
      for (const pet of pets) {
        // Pass user_id when creating/fetching pet
        const createdPet = await createOrFetchPet({ ...pet, user_id: userId });
        console.log('Created/fetched pet:', createdPet);

        const bookingDetailsForContext = {
          serviceType: 'daycare',
          bookingDate: formatDateForAPI(date),
          startDate: formatDateForAPI(date),
          endDate: formatDateForAPI(date),
          startTime,
          endTime,
          specialRequests: additionalInfo || '',
          // Top-level weightCategory field ensures BookingContext can normalize correctly
          weightCategory: getWeightCategoryValue(pet.weightCategory, pet.petType),
          weight_category: getWeightCategoryValue(pet.weightCategory, pet.petType),
          pet: {
            id: createdPet.id || createdPet.pet_id,
            name: pet.petName,
            petName: pet.petName,
            type: pet.petType,
            breed: pet.breed === 'Other' ? (pet.customBreed || 'Other') : (pet.breed || 'Not specified'),
            gender: pet.sex || 'Not specified',
            dateOfBirth: pet.dateOfBirth || null,
            weightCategory: pet.weightCategory
          },
          owner: {
            id: userId,
            name: ownerName,
            phone: ownerPhone,
            email: ownerEmail,
            address: ownerAddress
          },
          totalAmount: getDaycareTotal(pet.weightCategory)
        };

        bookingResults.push({ bookingDetails: bookingDetailsForContext, pet: createdPet });
      }

      // Calculate total price
      const totalPrice = pets.reduce((sum, pet) => sum + getDaycareTotal(pet.weightCategory), 0);

      // Prepare bookingData for confirmation page
      const bookingDataForConfirmation = {
        ...bookingResults[0].bookingDetails,
        pets: pets.map((pet, index) => ({
          ...bookingResults[index].pet,
          totalAmount: getDaycareTotal(pet.weightCategory),
          weightCategory: getWeightCategoryValue(pet.weightCategory, pet.petType)
        })),
        totalAmount: totalAmount,
        startDate: formatDateForAPI(date),
        endDate: formatDateForAPI(date),
        startTime,
        endTime,
        scheduledDateTime: `${formatDateString(date)} | ${location.state?.checkInTime || convertTo12Hour(startTime)} - ${location.state?.checkOutTime || convertTo12Hour(endTime)}`,
        specialRequests: additionalInfo,
        confirmationNumbers: [],
        rawBookingResponses: [],
        pendingBookings: bookingResults.map(r => r.bookingDetails),
        petDetails: pets.map(pet => ({
          name: pet.petName,
          type: pet.petType,
          breed: pet.breed === 'Other' ? (pet.customBreed || 'Other') : (pet.breed || 'Not specified'),
          sex: pet.sex || 'Not specified',
          dateOfBirth: pet.dateOfBirth || null,
          weightCategory: pet.weightCategory
        })),
        ownerDetails: {
          name: ownerName,
          phone: ownerPhone,
          email: ownerEmail,
          address: ownerAddress
        },
        numberOfPets: pets.length,
        services: 'Daycare',
        userId: userId
      };

      // Add each booking to context
      for (const result of bookingResults) {
        await addBooking(result.bookingDetails);
      }

      // Ensure state totalAmount is up-to-date
      setTotalAmount(totalPrice);

      // Navigate to confirmation page with complete booking data
      navigate('/confirmation', { 
        state: { 
          bookingData: bookingDataForConfirmation,
          totalAmount: totalAmount,
          serviceType: 'daycare'
        },
        replace: true
      });
    } catch (error) {
      console.error('Error submitting booking:', error);
      alert(`Booking failed: ${error.message || 'Please try again or contact support'}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="reservation-root">
      <div className="header-section">
        <Container>
          <h2>Daycare Reservation</h2>
          <p>Reserve a slot for your pet's daycare. Only 10 slots available per day.</p>
        </Container>
      </div>
      <Container className="mb-3">
        <div className="availability-info">
          <h5>Daycare Slot Availability</h5>
          <div>
            {availabilityError && (
              <div className="text-danger text-center mb-2">
                <small>{availabilityError}</small>
              </div>
            )}
            {date && (
              <p className="text-center mt-1">
                <small>
                  {slotCount >= MAX_DAYCARE_SLOTS
                    ? 'Fully booked for selected date'
                    : `${MAX_DAYCARE_SLOTS - slotCount} slots available for selected date`}
                </small>
              </p>
            )}
          </div>
        </div>
      </Container>
      <Container>
        <Form onSubmit={handleSubmit}>
          {/* Number of Pets Card */}
          <div className="info-card mb-4">
            <Row>
              <Col md={3}>
                <Form.Group controlId="numberOfPets">
                  <Form.Label>Number of Pets</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max="10"
                    value={numberOfPets}
                    onChange={handleNumberOfPetsChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
          </div>

          {/* Total Amount Card */}
          <div className="mb-4">
            <TotalAmountCard amount={totalAmount} />
          </div>

          {/* Pet Information Card */}
          <div className="info-card">
            <h5 className="pet-info-title">
              <FontAwesomeIcon icon={faPaw} className="me-2" />Pet Information
            </h5>
            
            {/* Pet Information Section */}
            <Row>
              <Col md={4}>
                <div className="field-label">Pet Name</div>
                {pets.map((pet, index) => (
                  <div key={`petName-${index}`} className="position-relative mb-3">
                    <Form.Control
                      type="text"
                      value={pet.petName || ''}
                      onChange={(e) => handlePetChange(index, 'petName', e.target.value)}
                      required
                      placeholder={`e.g., Max (Pet #${index + 1})`}
                    />
                    <div className="ms-2">
                      {pet.petName ? 
                        <Badge bg="success" className="ms-2">✓</Badge> : 
                        <Badge bg="warning" className="ms-2">!</Badge>
                      }
                    </div>
                  </div>
                ))}
              </Col>

              <Col md={4}>
                <div className="field-label">Pet Type</div>
                {pets.map((pet, index) => (
                  <div key={`petType-${index}`} className="position-relative mb-3">
                    <Form.Select
                      value={pet.petType || ''}
                      onChange={(e) => handlePetChange(index, 'petType', e.target.value)}
                      required
                    >
                      <option value="">Select Pet Type</option>
                      <option value="Dog">Dog</option>
                      <option value="Cat">Cat</option>
                    </Form.Select>
                    <div className="ms-2">
                      {pet.petType ? 
                        <Badge bg="success" className="ms-2">✓</Badge> : 
                        <Badge bg="warning" className="ms-2">!</Badge>
                      }
                    </div>
                  </div>
                ))}
              </Col>

              <Col md={4}>
                <div className="field-label">Weight Category</div>
                {pets.map((pet, index) => (
                  <div key={`weight-${index}`} className="position-relative mb-3">
                    <Form.Select
                      value={pet.weightCategory || ''}
                      onChange={(e) => handlePetChange(index, 'weightCategory', e.target.value)}
                      required
                    >
                      <option value="">Select Weight Category</option>
                      <option value="Small (1-9 KG)">Small (1-9 KG) - ₱350/day</option>
                      <option value="Medium (9-25 KG)">Medium (9-25 KG) - ₱450/day</option>
                      <option value="Large (25-40 KG)">Large (25-40 KG) - ₱550/day</option>
                      <option value="Extra-Large (40+ KG)">Extra-Large (40+ KG) - ₱650/day</option>
                    </Form.Select>
                    <div className="ms-2">
                      {pet.weightCategory ? 
                        <Badge bg="success" className="ms-2">✓</Badge> : 
                        <Badge bg="warning" className="ms-2">!</Badge>
                      }
                    </div>
                  </div>
                ))}
              </Col>
            </Row>

            <Row className="mt-3">
              <Col md={4}>
                <div className="field-label">Breed</div>
                {pets.map((pet, index) => (
                  <div key={`breed-${index}`} className="position-relative mb-3">
                    {pet.petType === 'Dog' ? (
                      <Form.Select
                        value={pet.breed || ''}
                        onChange={(e) => handlePetChange(index, 'breed', e.target.value)}
                      >
                        <option value="">Select Breed</option>
                        {getBreedOptions('Dog').map((breed) => (
                          <option key={breed} value={breed}>{breed}</option>
                        ))}
                      </Form.Select>
                    ) : pet.petType === 'Cat' ? (
                      <Form.Select
                        value={pet.breed || ''}
                        onChange={(e) => handlePetChange(index, 'breed', e.target.value)}
                      >
                        <option value="">Select Breed</option>
                        {getBreedOptions('Cat').map((breed) => (
                          <option key={breed} value={breed}>{breed}</option>
                        ))}
                      </Form.Select>
                    ) : (
                      // Disabled dropdown shown until pet type is selected
                      <Form.Select disabled>
                        <option value="">Select pet type first</option>
                      </Form.Select>
                    )}
                    {pet.breed === 'Other' && (
                      <Form.Control
                        type="text"
                        value={pet.customBreed || ''}
                        onChange={(e) => handlePetChange(index, 'customBreed', e.target.value)}
                        placeholder="Enter custom breed"
                        className="mt-2"
                      />
                    )}
                  </div>
                ))}
              </Col>

              <Col md={4}>
                <div className="field-label">Sex</div>
                {pets.map((pet, index) => (
                  <div key={`sex-${index}`} className="position-relative mb-3">
                    <Form.Select
                      value={pet.sex || ''}
                      onChange={(e) => handlePetChange(index, 'sex', e.target.value)}
                      required
                    >
                      <option value="">Select Sex</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </Form.Select>
                  </div>
                ))}
              </Col>

              <Col md={4}>
                <div className="field-label">Date of Birth</div>
                {pets.map((pet, index) => (
                  <div key={`dob-${index}`} className="position-relative mb-3">
                    <Form.Control
                      type="date"
                      value={pet.dateOfBirth || ''}
                      onChange={(e) => handlePetChange(index, 'dateOfBirth', e.target.value)}
                      max={formatDateString(new Date())}
                    />
                  </div>
                ))}
              </Col>
            </Row>
          </div>

          {/* Owner Information */}
          <div className="info-card">
            <h5 className="owner-info-title">
              <FontAwesomeIcon icon={faUser} className="me-2" />Owner Information
            </h5>
            <Row>
              <Col md={6}>
                <Form.Group controlId="ownerName" className="mb-3">
                  <Form.Label>Full Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={ownerName}
                    onChange={e => setOwnerName(e.target.value)}
                    placeholder="e.g., John Smith"
                    required
                  />
                  <div className="ms-2">
                    {ownerName ? (
                      <Badge bg="success" className="ms-2">✓</Badge>
                    ) : (
                      <Badge bg="warning" className="ms-2">!</Badge>
                    )}
                  </div>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="ownerPhone" className="mb-3">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control
                    type="tel"
                    value={ownerPhone}
                    onChange={e => setOwnerPhone(e.target.value)}
                    placeholder="e.g., 09123456789"
                    required
                  />
                  <div className="ms-2">
                    {ownerPhone ? (
                      <Badge bg="success" className="ms-2">✓</Badge>
                    ) : (
                      <Badge bg="warning" className="ms-2">!</Badge>
                    )}
                  </div>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group controlId="ownerEmail" className="mb-3">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    value={ownerEmail}
                    onChange={e => setOwnerEmail(e.target.value)}
                    placeholder="e.g., john.smith@email.com"
                    required
                  />
                  <div className="ms-2">
                    {ownerEmail ? (
                      <Badge bg="success" className="ms-2">✓</Badge>
                    ) : (
                      <Badge bg="warning" className="ms-2">!</Badge>
                    )}
                  </div>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="ownerAddress">
                  <Form.Label>Complete Address</Form.Label>
                  <Form.Control
                    type="text"
                    value={ownerAddress}
                    onChange={e => setOwnerAddress(e.target.value)}
                    placeholder="e.g., 123 Main St, City, State"
                  />
                  <div className="ms-2">
                    {ownerAddress ? (
                      <Badge bg="success" className="ms-2">✓</Badge>
                    ) : (
                      <Badge bg="warning" className="ms-2">!</Badge>
                    )}
                  </div>
                </Form.Group>
              </Col>
            </Row>
          </div>
          
          {/* Additional Information */}
          <div className="info-card additional-info-section">
            <h3><FontAwesomeIcon icon={faNotesMedical} className="me-2" />Additional Information (optional)</h3>
            <p>(Feeding habits, medical conditions, allergies, tick and flea needs, vaccine info, etc.)</p>
            <Form.Group controlId="additionalInfo" className="mb-3">
              <Form.Control
                as="textarea"
                rows={4}
                value={additionalInfo}
                onChange={e => setAdditionalInfo(e.target.value)}
              />
            </Form.Group>
          </div>
          
          {/* Terms and Conditions */}
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
                  onClick={e => {
                    e.preventDefault();
                    setShowAgreement(true);
                  }}
                >
                  Terms and Conditions
                </span>
              </>}
              checked={agreeTerms}
              onChange={e => setAgreeTerms(e.target.checked)}
              required
            />
          </Form.Group>
          
          {/* Agreement Modal */}
          <Agreement
            show={showAgreement}
            onHide={() => setShowAgreement(false)}
          />
          
          {/* Submit Button */}
          <div className="text-center">
            <Button
              type="submit"
              variant="success"
              className="rounded-pill px-4 py-2"
              disabled={!agreeTerms || isSubmitting}
            >
              Check Confirmation
            </Button>
          </div>
          <br /><br /><br />
        </Form>
      </Container>
      
      {/* Loading Overlay */}
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

export default DaycareReservation;