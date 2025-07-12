import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faScissors, faDog, faUser, faNotesMedical, faCheck, faQuestion, faExclamationCircle, faPaw } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useLocation } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './GroomingReservation.css';
import Agreement from './GroomingAgreement';
import TotalAmountCard from './TotalAmountCard';
import { useBookings } from '../context/BookingContext';
import { API_URL } from '../config';
import { formatDateForAPI } from '../utils/dateUtils';
import { getBreedOptions } from '../utils/breedUtils';

// --- GROOMING SERVICES CONSTANTS ---
const GROOMING_SERVICES = [
  { name: 'Basic Bath & Dry', slots: 10, description: 'A thorough cleansing bath with organic shampoo and conditioner. Perfect for pets who need a quick refresh.' },
  { name: 'Premium Grooming', slots: 5, description: 'Complete grooming package including bath, haircut, styling, ear cleaning, teeth brushing. Considered as our most popular service.' },
  { name: 'Special Grooming Package', slots: 5, description: 'Luxury treatment for pets with special needs. Basic bath and dry, paw pad treatment.' }
];

// Weight-based pricing per grooming service (must match backend schema)
const GROOMING_PRICES = {
  'Premium Grooming': {
    'Small': 750,
    'Medium': 850,
    'Large': 1000,
    'X-Large': 1500,
    'Cat': 950
  },
  'Basic Bath & Dry': {
    'Small': 350,
    'Medium': 450,
    'Large': 550,
    'X-Large': 750,
    'Cat': 500
  },
  'Special Grooming Package': {
    'Small': 550,
    'Medium': 650,
    'Large': 800,
    'X-Large': 1000,
    'Cat': 700
  }
};

const getGroomingPrice = (serviceName, weightCategory) => {
  if (!serviceName || !weightCategory) return 0;
  const categoryMap = GROOMING_PRICES[serviceName] || {};
  return categoryMap[weightCategory] || 0;
};

const BREED_OPTIONS = getBreedOptions();

// Weight category display options used in the form
const WEIGHT_OPTIONS = [
  'Small (1-9 KG)',
  'Medium (9-25 KG)',
  'Large (25-40 KG)',
  'Extra-Large (40+ KG)',
  'Cat'
];

// Helper: Normalize/display string -> canonical weight category value expected by backend
const getWeightCategoryValue = (displayCategory, petType = '') => {
  if (!displayCategory || typeof displayCategory !== 'string') {
    return petType.toLowerCase() === 'cat' ? 'Cat' : 'Medium';
  }
  const dc = displayCategory.toLowerCase();
  if (dc.includes('small')) return 'Small';
  if (dc.includes('medium')) return 'Medium';
  if (/(x-?large|extra[-\s]?large|xlarge|xl)/.test(dc)) return 'X-Large';
  if (dc.includes('large')) return 'Large';
  if (dc.includes('cat')) return 'Cat';
  return petType.toLowerCase() === 'cat' ? 'Cat' : 'Medium';
};

const GroomingReservation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addBooking, getAvailableSlots } = useBookings();

  // Form state
  const [selectedDate, setSelectedDate] = useState(location.state?.selectedDate ? new Date(location.state.selectedDate) : null);
  const [selectedTime, setSelectedTime] = useState(location.state?.selectedTime || '09:00');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  // Total amount for all pets
  const [totalAmount, setTotalAmount] = useState(0);
  const [ownerAddress, setOwnerAddress] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  
  // Multiple pets support
  const [numberOfPets, setNumberOfPets] = useState(1);
  const [pets, setPets] = useState([
    { id: 1, name: '', type: '', breed: '', customBreed: '', sex: '', dateOfBirth: null, service: '', weightCategory: '' }
  ]);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Recalculate total when pets array changes
  useEffect(() => {
    let sum = 0;
    pets.forEach(p => {
      const wc = getWeightCategoryValue(p.weightCategory, p.type);
      sum += getGroomingPrice(p.service, wc);
    });
    setTotalAmount(sum);
  }, [pets]);
  const [showAgreement, setShowAgreement] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validFields, setValidFields] = useState({
    ownerName: false,
    ownerPhone: false,
    ownerEmail: false,
    ownerAddress: false
  });
  const [availability, setAvailability] = useState({});
  const [availabilityError, setAvailabilityError] = useState(null);

  // Handle change in number of pets
  const handleNumberOfPetsChange = (e) => {
    let num = parseInt(e.target.value, 10);
    if (isNaN(num) || num < 1) {
      num = 1;
    } else if (num > 10) { // Set a reasonable max limit
      num = 10;
    }

    setNumberOfPets(num);
    const newPets = [...pets];
    const currentNum = newPets.length;

    if (num > currentNum) {
      // Add new pets
      for (let i = currentNum; i < num; i++) {
        newPets.push({
          id: Date.now() + i,
          name: '',
          type: '',
          breed: '',
          customBreed: '',
          sex: '',
          dateOfBirth: null,
          service: '',
          weightCategory: ''
        });
      }
    } else if (num < currentNum) {
      // Remove pets
      newPets.splice(num);
    }
    setPets(newPets);
  };

  // Update a specific pet's data
  const validateField = (value, type = 'string') => {
    if (!value) return false;
    if (type === 'string') return typeof value === 'string' && value.trim() !== '';
    if (type === 'date') return value instanceof Date && !isNaN(value);
    return true;
  };

  const updatePetField = (index, field, value) => {
    const updatedPets = [...pets];

    // If changing pet type, adjust weight category automatically
    if (field === 'type') {
      let newWeight = updatedPets[index].weightCategory;

      // For cats: force weight category to 'Cat'
      if (value === 'Cat') {
        updatedPets[index] = {
          ...updatedPets[index],
          type: value,
          weightCategory: 'Cat'
        };
        newWeight = 'Cat';
      } else {
        // For dogs: clear cat-only weight if previously set
        updatedPets[index] = {
          ...updatedPets[index],
          type: value,
          weightCategory: updatedPets[index].weightCategory === 'Cat' ? '' : updatedPets[index].weightCategory
        };
        if (updatedPets[index].weightCategory === 'Cat') newWeight = '';
      }

      // Update validation for weight category after automatic change
      setValidFields(prev => ({
        ...prev,
        [`pet${index}_weightCategory`]: validateField(newWeight)
      }));
    } else {
      // Standard update for other fields
      updatedPets[index] = {
        ...updatedPets[index],
        [field]: value
      };
    }

    setPets(updatedPets);

    // Validate the field (skip validation for auto-set cat weight)
    const fieldKey = `pet${index}_${field}`;
    setValidFields(prev => ({
      ...prev,
      [fieldKey]: validateField(value, field === 'dateOfBirth' ? 'date' : 'string')
    }));
  };

  // Fetch availability for selected service and date
  useEffect(() => {
    if (!selectedDate) return;
    // If you want to fetch availability, keep this logic. Otherwise, you can remove this effect.
    const fetchAvailability = async () => {
      try {
        setAvailabilityError(null);
        const formattedDate = selectedDate instanceof Date ? selectedDate.toISOString().split('T')[0] : selectedDate;
        const response = await fetch(`${API_URL}/api/services/availability/${formattedDate}`);
        if (!response.ok) throw new Error('Failed to fetch availability');
        const data = await response.json();
        setAvailability(Array.isArray(data) ? data : []);
      } catch (err) {
        setAvailabilityError('Could not fetch latest availability. Showing estimated slots.');
        setAvailability([]);
      }
    };
    fetchAvailability();
  }, [selectedDate]);

  // Helper to get available slots for a grooming service
  const getBackendAvailableSlots = (serviceName) => {
    if (!availability || !Array.isArray(availability)) return null;
    const match = availability.find(s =>
      s.service_type === 'grooming' &&
      (s.service_name?.toLowerCase() === serviceName.toLowerCase() || s.category_name?.toLowerCase() === serviceName.toLowerCase())
    );
    return match ? match.available_slots : null;
  };

  const getAvailableSlotsForService = (serviceName, date) => {
    const backendSlots = getBackendAvailableSlots(serviceName);
    if (backendSlots !== null && backendSlots !== undefined) return backendSlots;
    // Fallback to static slots if backend not available
    const service = GROOMING_SERVICES.find(s => s.name === serviceName);
    return service ? service.slots : 0;
  };

  // --- Main booking submission logic ---
  const formatDateString = (date) => {
    if (!date) return null;
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    let dateObj = date;
    if (typeof date === 'string') {
      dateObj = new Date(date);
    }
    if (dateObj instanceof Date && !isNaN(dateObj)) {
      return dateObj.toISOString().split('T')[0];
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate pet information
      for (const pet of pets) {
        if (!pet.name || !pet.type || !pet.breed || !pet.sex || !pet.weightCategory ||
            (pet.breed === 'Other' && !pet.customBreed)) {
          alert('Please complete all pet information including custom breed if "Other" is selected');
          setIsSubmitting(false);
          return;
        }
      }
      if (!ownerName || !ownerPhone || !ownerEmail) {
        alert('Please fill in all required owner information.');
        setIsSubmitting(false);
        return;
      }

      // Create a booking object for each pet
      // Calculate total price for all pets
      const totalPrice = pets.reduce((sum, pet) => {
        const wc = getWeightCategoryValue(pet.weightCategory, pet.type);
        return sum + getGroomingPrice(pet.service, wc);
      }, 0);

      const pendingBookings = pets.map(pet => ({
        bookingDate: formatDateString(selectedDate),
        startTime: selectedTime,
        groomingService: pet.service,
        selectedServiceType: pet.service,
        serviceType: 'grooming',
        petName: pet.name,
        petType: pet.type,
        breed: pet.breed === 'Other' ? pet.customBreed : pet.breed || '',
        petGender: pet.sex,
        weightCategory: getWeightCategoryValue(pet.weightCategory, pet.type),
        dateOfBirth: pet.dateOfBirth,
        specialRequests: additionalInfo || '',
        ownerName,
        ownerPhone,
        ownerEmail,
        ownerAddress,
      }));
 
      // Prepare bookingData for confirmation page
      const bookingDataForConfirmation = {
        bookingDate: formatDateString(selectedDate),
        startTime: selectedTime,
        groomingService: pets.map(p => p.service).join(', '),
        serviceType: 'grooming',
        specialRequests: additionalInfo || '',
        petCount: pets.length,
        petDetails: pets.map(pet => ({
          name: pet.name,
          petName: pet.name,
          type: pet.type,
          breed: pet.breed === 'Other' ? pet.customBreed : pet.breed || '',
          sex: pet.sex,
          gender: pet.sex,
          weightCategory: getWeightCategoryValue(pet.weightCategory, pet.type),
          dateOfBirth: pet.dateOfBirth,
          service: pet.service
        })),
        ownerDetails: {
          name: ownerName,
          phone: ownerPhone,
          email: ownerEmail,
          address: ownerAddress,
        },
        scheduledDateTime: `${formatDateString(selectedDate).replace(/-/g, '/')} | ${selectedTime}`,
        services: pets.map(p => p.service).join(', '),
        pendingBookings: pendingBookings,
        totalAmount: totalPrice
      };
      
      navigate('/confirmation', { state: { bookingData: bookingDataForConfirmation, totalAmount: totalPrice, serviceType: 'grooming' } });
    } catch (error) {
      alert(`Booking failed: ${error.message || 'Please try again or contact support'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grooming-reservation-root">
      <div className="header-section">
        <Container>
          <h2>Guest Information (Grooming)</h2>
          <p>Please provide details for your pet(s)</p>
        </Container>
      </div>
      <Container className="mb-3">
        <div 
          style={{ 
            backgroundColor: '#E87A00',
            color: 'white', 
            padding: '1rem', 
            borderRadius: '0.5rem', 
            textAlign: 'center'
          }}
        >
          <h5 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Service Availability</h5>
          {availabilityError ? (
            <p className="mb-0" style={{fontSize: '0.9rem'}}><small>{availabilityError}</small></p>
          ) : (
            <p className="mb-0" style={{fontSize: '0.9rem'}}>
              {GROOMING_SERVICES.map((service, index) => (
                <span key={service.name}>
                  {service.name}: <strong>{getAvailableSlotsForService(service.name, selectedDate) ?? 'N/A'}</strong> available
                  {index < GROOMING_SERVICES.length - 1 && ' | '}
                </span>
              ))}
            </p>
          )}
        </div>
      </Container>
      <Container>
        <Form onSubmit={handleSubmit}>
          <div className="info-card">
            <Row>
              <Col md={4}>
                <Form.Group controlId="numberOfPets">
                  <Form.Label>Number of Pets</Form.Label>
                  <Form.Select
                    value={numberOfPets}
                    onChange={(e) => handleNumberOfPetsChange({ target: { value: parseInt(e.target.value, 10) } })}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </div>

          {/* Total Amount Card */}
          <div className="mb-4">
            <TotalAmountCard amount={totalAmount} />
          </div>

          <div className="info-card pet-info-section">
            <div className="text-center mb-4">
              <h5 className="pet-info-title">
                <FontAwesomeIcon icon={faPaw} className="me-2" />Pet Information
              </h5>
            </div>

            <div className="pet-info-container">
              <div className="text-center mb-4">
                <h6>Pet Information</h6>
              </div>
              
              <div className="pet-form-wrapper p-3" style={{ background: '#fafbfc', borderRadius: 8 }}>
                <Row className="mb-4">
                  <Col md={4}>
                    <div className="field-label">Pet's Name</div>
                    {pets.map((pet, index) => (
                      <div key={`petName-${index}`} className="position-relative mb-3">
                        <Form.Control 
                          type="text" 
                          value={pet.name || ''} 
                          onChange={e => updatePetField(index, 'name', e.target.value)} 
                          placeholder={`e.g., Max, Bella, Luna... (${index + 1})`} 
                          required 
                        />
                        <div className="ms-2">
                          {validFields[`pet${index}_name`] ? (
                            <FontAwesomeIcon icon={faCheck} className="text-success ms-2" />
                          ) : (
                            <Badge bg="warning" className="ms-2">!</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </Col>
                  
                  <Col md={4}>
                    <div className="field-label">Grooming Service</div>
                    {pets.map((pet, index) => (
                      <div key={`service-${index}`} className="position-relative mb-3">
                        <Form.Select 
                          value={pet.service || ''} 
                          onChange={e => updatePetField(index, 'service', e.target.value)} 
                          required
                          className="form-select"
                        >
                          <option value="">Select Service</option>
                          {GROOMING_SERVICES.map(s => (
                            <option key={s.name} value={s.name}>{s.name}</option>
                          ))}
                        </Form.Select>
                        <div className="ms-2">
                          {validFields[`pet${index}_service`] ? (
                            <FontAwesomeIcon icon={faCheck} className="text-success ms-2" />
                          ) : (
                            <Badge bg="warning" className="ms-2">!</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </Col>
                  
                  <Col md={4}>
                    <div className="field-label">Pet Type</div>
                    {pets.map((pet, index) => (
                      <div key={`petType-${index}`} className="position-relative mb-3">
                        <Form.Select 
                          value={pet.type || ''} 
                          onChange={e => updatePetField(index, 'type', e.target.value)} 
                          required
                          className="form-select"
                        >
                          <option value="">Select Pet Type</option>
                          <option value="Dog">Dog</option>
                          <option value="Cat">Cat</option>
                        </Form.Select>
                        <div className="ms-2">
                          {validFields[`pet${index}_type`] ? (
                            <FontAwesomeIcon icon={faCheck} className="text-success ms-2" />
                          ) : (
                            <Badge bg="warning" className="ms-2">!</Badge>
                          )}
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
                          onChange={e => updatePetField(index, 'weightCategory', e.target.value)}
                          required
                          className="form-select"
                          disabled={!pet.service || pet.type === 'Cat'}
                        >
                          <option value="">Select Weight</option>
                          {WEIGHT_OPTIONS.filter(opt => (pet.type === 'Cat' ? opt === 'Cat' : opt !== 'Cat')).map(opt => {
                            const priceVal = pet.service ? getGroomingPrice(pet.service, getWeightCategoryValue(opt, pet.type)) : null;
                            const displayLabel = priceVal ? `${opt} - ₱${priceVal}` : opt;
                            return (
                              <option key={opt} value={opt}>{displayLabel}</option>
                            );
                          })}
                        </Form.Select>
                        <div className="ms-2">
                          {validFields[`pet${index}_weightCategory`] ? (
                            <FontAwesomeIcon icon={faCheck} className="text-success ms-2" />
                          ) : (
                            <Badge bg="warning" className="ms-2">!</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </Col>
                  
                  <Col md={4}>
                    <div className="field-label">Breed</div>
                    {pets.map((pet, index) => (
                      <div key={`breed-${index}`} className="position-relative mb-3">
                        {pet.type ? (
                          <>
                            <Form.Select
                              value={pet.breed || ''}
                              onChange={e => updatePetField(index, 'breed', e.target.value)}
                              required
                              className="form-select"
                            >
                              <option value="">Select Breed</option>
                              {getBreedOptions(pet.type).map(breed => (
                                <option key={breed} value={breed}>{breed}</option>
                              ))}
                            </Form.Select>
                            {pet.breed === 'Other' && (
                              <Form.Control 
                                type="text"
                                value={pet.customBreed || ''}
                                onChange={e => updatePetField(index, 'customBreed', e.target.value)}
                                placeholder="Enter breed name"
                                className="mt-2"
                                required
                              />
                            )}
                          </>
                        ) : (
                          <Form.Select
                            value=""
                            disabled
                            className="form-select"
                          >
                            <option value="">Select Pet Type First</option>
                          </Form.Select>
                        )}
                        <div className="ms-2">
                          {validFields[`pet${index}_breed`] ? (
                            <FontAwesomeIcon icon={faCheck} className="text-success ms-2" />
                          ) : (
                            <Badge bg="warning" className="ms-2">!</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </Col>
                  
                  <Col md={4}>
                    <div className="field-label">Sex</div>
                    {pets.map((pet, index) => (
                      <div key={`sex-${index}`} className="position-relative mb-3">
                        <Form.Select
                          value={pet.sex || ''}
                          onChange={e => updatePetField(index, 'sex', e.target.value)}
                          required
                          className="form-select"
                        >
                          <option value="">Select Sex</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </Form.Select>
                        <div className="ms-2">
                          {validFields[`pet${index}_sex`] ? (
                            <FontAwesomeIcon icon={faCheck} className="text-success ms-2" />
                          ) : (
                            <Badge bg="warning" className="ms-2">!</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </Col>
                </Row>
                
                <Row className="mb-4">
                  <Col md={12}>
                    <div className="field-label">Date of Birth</div>
                    {pets.map((pet, index) => (
                      <div key={`dob-${index}`} className="position-relative mb-3">
                        <Form.Control
                          type="date"
                          value={pet.dateOfBirth || ''}
                          onChange={e => updatePetField(index, 'dateOfBirth', e.target.value)}
                          max={formatDateForAPI(new Date())}
                          className="form-control"
                          required
                        />
                        <div className="ms-2">
                          {pet.dateOfBirth ? 
                            <FontAwesomeIcon icon={faCheck} className="text-success ms-2" /> : 
                            <Badge bg="warning" className="ms-2">!</Badge>
                          }
                        </div>
                      </div>
                    ))}
                  </Col>
                </Row>
              </div>
            </div>
          </div>
          
          <div className="info-card">
            <h5><FontAwesomeIcon icon={faUser} className="me-2" />Owner Information</h5>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="ownerName">
                  <Form.Label>Owner's Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={ownerName}
                    onChange={e => {
                      setOwnerName(e.target.value);
                      setValidFields(prev => ({ ...prev, ownerName: validateField(e.target.value) }));
                    }}
                    placeholder="e.g., John Smith"
                    required
                  />
                  {validFields.ownerName ? (
                    <div className="text-success mt-1" style={{ fontSize: '0.875rem' }}>
                      <FontAwesomeIcon icon={faCheck} />
                    </div>
                  ) : (
                    <div className="text-warning mt-1" style={{ fontSize: '0.875rem' }}>
                      <FontAwesomeIcon icon={faExclamationCircle} />
                    </div>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="ownerPhone">
                  <Form.Label>Mobile Number</Form.Label>
                  <Form.Control
                    type="tel"
                    value={ownerPhone}
                    onChange={e => {
                      setOwnerPhone(e.target.value);
                      setValidFields(prev => ({ ...prev, ownerPhone: validateField(e.target.value) }));
                    }}
                    placeholder="e.g., 09123456789"
                    required
                  />
                  {validFields.ownerPhone ? (
                    <div className="text-success mt-1" style={{ fontSize: '0.875rem' }}>
                      <FontAwesomeIcon icon={faCheck} />
                    </div>
                  ) : (
                    <div className="text-warning mt-1" style={{ fontSize: '0.875rem' }}>
                      <FontAwesomeIcon icon={faExclamationCircle} />
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="ownerEmail">
                  <Form.Label>Owner's Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    value={ownerEmail}
                    onChange={e => {
                      setOwnerEmail(e.target.value);
                      setValidFields(prev => ({ ...prev, ownerEmail: validateField(e.target.value) }));
                    }}
                    placeholder="e.g., john.smith@email.com"
                    required
                  />
                  {validFields.ownerEmail ? (
                    <div className="text-success mt-1" style={{ fontSize: '0.875rem' }}>
                      <FontAwesomeIcon icon={faCheck} />
                    </div>
                  ) : (
                    <div className="text-warning mt-1" style={{ fontSize: '0.875rem' }}>
                      <FontAwesomeIcon icon={faExclamationCircle} />
                    </div>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="ownerAddress">
                  <Form.Label>Complete Address</Form.Label>
                  <Form.Control
                    type="text"
                    value={ownerAddress}
                    onChange={e => {
                      setOwnerAddress(e.target.value);
                      setValidFields(prev => ({ ...prev, ownerAddress: validateField(e.target.value) }));
                    }}
                    placeholder="e.g., 123 Main St, City, State"
                  />
                  {validFields.ownerAddress ? (
                    <div className="text-success mt-1" style={{ fontSize: '0.875rem' }}>
                      <FontAwesomeIcon icon={faCheck} />
                    </div>
                  ) : (
                    <div className="text-warning mt-1" style={{ fontSize: '0.875rem' }}>
                      <FontAwesomeIcon icon={faExclamationCircle} />
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>
          </div>

          <div className="info-card additional-info-section">
            <h5><FontAwesomeIcon icon={faNotesMedical} className="me-2" />Additional Information (optional)</h5>
            <Form.Group controlId="additionalInfo" className="mb-3">
              <Form.Control
                as="textarea"
                rows={4}
                value={additionalInfo}
                onChange={e => setAdditionalInfo(e.target.value)}
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
          <Agreement
            show={showAgreement}
            onHide={() => setShowAgreement(false)}
          />
          <div className="text-center">
            <Button
              type="submit"
              variant="success"
              className="rounded-pill px-4 py-2"
              disabled={!agreeTerms || isSubmitting}
            >
              Reserve Now
            </Button>
          </div>
          {isSubmitting && (
            <div className="booking-processing text-center" style={{ minHeight: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.8)', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
              <div className="spinner-border text-warning mb-3" role="status" style={{ width: 50, height: 50 }}>
                <span className="visually-hidden">Processing...</span>
              </div>
              <h5>Submitting your booking...</h5>
            </div>
          )}
        </Form>
      </Container>

    </div>
  );
};

export default GroomingReservation;
