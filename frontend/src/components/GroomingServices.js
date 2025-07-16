import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Nav, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaw, faCalendarAlt, faInfoCircle, faQuestion, faCheck, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import DatePickerModal from './DatePickerModal';
import ImportantNoticeCard from './ImportantNoticeCard';
import baguioLogo from '../assets/logo192.png';
import { useBookings } from '../context/BookingContext';
import { API_URL } from '../config';
import './Services.css';
import './ModernEffects.css';
import './GradientBackground.css';
import './ReservationStyles.css';
import './ReservationForm.css';
import './PetTabs.css';
import './ReservationNew.css';
import GroomingCarousel from './GroomingCarousel';

// Add custom styles for grooming service cards
const styles = `
.service-card {
  border: 2px solid transparent;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.service-card:hover:not(.selected) {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
}

.service-card.selected {
  border-color: #28a745;
  background-color: #e8f5e9;
}

.service-features {
  list-style: none;
  padding: 0;
  margin: 1rem 0;
}

.service-features li {
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
}

.service-features li:last-child {
  border-bottom: none;
}

.price-grid {
  display: grid;
  gap: 0.5rem;
  margin-top: 1rem;
}

.price-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.selected-indicator {
  position: absolute;
  top: 1rem;
  right: 1rem;
  color: #28a745;
  font-size: 1.2rem;
}

.availability-badge {
  font-size: 0.8rem;
  padding: 0.4rem 0.8rem;
}

.grooming-carousel {
  position: relative;
  transition: all 0.3s ease;
}

.service-type-indicators {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 8px;
  z-index: 10;
}

.service-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #FFA500;
}

.service-indicator.active {
  background-color: #FFA500;
  transform: scale(1.2);
}
`;

// Add styles to document
if (!document.getElementById('grooming-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'grooming-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}


const GroomingServices = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef(null);
  const { countBookingsByServiceAndRoom, isServiceAtCapacity } = useBookings();
  
  // State for reservation details
  const [numberOfPets, setNumberOfPets] = useState(1);
  const [pets, setPets] = useState([{
    petName: '',
    petType: '',
    otherPetType: '',
    breed: '',
    sex: '',
    dateOfBirth: null,
    image: null,
    serviceType: ''
  }]);
  
  // State for owner details
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerAddress, setOwnerAddress] = useState('');
  
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [noAdditionalInfo, setNoAdditionalInfo] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);
  
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [serviceType, setServiceType] = useState('grooming');
  const [selectedService, setSelectedService] = useState(null);
  const [selectedServiceType, setSelectedServiceType] = useState(null);
  const [currentServiceIndex, setCurrentServiceIndex] = useState(0);
  
  // State for service availability
  const [serviceAvailability, setServiceAvailability] = useState({
    premium: { available: 5, isFull: false },
    basic: { available: 10, isFull: false },
    special: { available: 5, isFull: false }
  });
  
  const [groomingPricing, setGroomingPricing] = useState({});
  
  // Define grooming service types
  const groomingServices = [
    {
      id: 'premium',
      name: 'PREMIUM GROOMING',
      description: 'L\'beau Premium Products, Bath & Dry, Ear Cleaning, Sanitary, Paw Cleaning, Trimmer Cut, Puppy Cut or Full Shave',
      includedServices: [
        'L\'beau Premium Products',
        'Bath & Dry',
        'Ear Cleaning',
        'Sanitary',
        'Paw Cleaning',
        'Trimmer Cut',
        'Puppy Cut or Full Shave'
      ]
    },
    {
      id: 'basic',
      name: 'BASIC BATH & DRY',
      description: 'Organic Shampoo and Conditioner, Sanitary, Perfume & Powder (optional)',
      includedServices: [
        'Organic Shampoo and Conditioner',
        'Sanitary',
        'Perfume & Powder (optional)'
      ]
    },
    {
      id: 'special',
      name: 'SPECIAL GROOMING PACKAGE',
      description: 'Basic Bath and Dry, Nail Trim, Face Trim, Sanitary, Paw Pad Trim',
      includedServices: [
        'Basic Bath and Dry',
        'Nail Trim',
        'Face Trim',
        'Sanitary',
        'Paw Pad Trim'
      ]
    }
  ];
  
  // Update service availability based on current bookings
  useEffect(() => {
    const selectedDate = location.state?.startDate ? new Date(location.state.startDate) : new Date();
    
    const premiumCount = countBookingsByServiceAndRoom(selectedDate, 'grooming', 'Premium Grooming');
    const basicCount = countBookingsByServiceAndRoom(selectedDate, 'grooming', 'Basic Bath & Dry');
    const specialCount = countBookingsByServiceAndRoom(selectedDate, 'grooming', 'Special Grooming Package');
    
    setServiceAvailability({
      premium: { 
        available: Math.max(0, 5 - premiumCount), 
        isFull: premiumCount >= 5
      },
      basic: { 
        available: Math.max(0, 10 - basicCount), 
        isFull: basicCount >= 10
      },
      special: { 
        available: Math.max(0, 5 - specialCount), 
        isFull: specialCount >= 5
      }
    });
  }, [location.state, countBookingsByServiceAndRoom]);
  
  useEffect(() => {
    async function fetchGroomingPricing() {
      try {
        const response = await fetch(`${API_URL}/api/services/pricing`);
        const data = await response.json();
        const grouped = {};
        data.forEach(row => {
          if (row.service_type === 'grooming') {
            const key = row.service_name;
            if (!grouped[key]) grouped[key] = {};
            let sizeKey = row.size ? row.size.toLowerCase() : 'other';
            // Map potential cat size codes returned by backend
            if (row.size === 'CS' || row.size === 'CAT_SMALL') sizeKey = 'cat_small';
            if (row.size === 'CM' || row.size === 'CAT_MEDIUM') sizeKey = 'cat_medium';
            grouped[key][sizeKey] = {
              weight:
                row.size === 'S' ? '1-9 KG' :
                row.size === 'M' ? '9-25 KG' :
                row.size === 'L' ? '25-40 KG' :
                row.size === 'XL' ? '40+ KG' :
                row.size === 'CS' || row.size === 'CAT_SMALL' ? '1-9 KG' :
                row.size === 'CM' || row.size === 'CAT_MEDIUM' ? '9-25 KG' :
                'Cat',
              price: `Php ${row.base_price}`
            };
          }
        });
        setGroomingPricing(grouped);
      } catch (err) {
        setGroomingPricing({});
      }
    }
    fetchGroomingPricing();
  }, []);
  
  // Auto-rotate through services
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentServiceIndex((prevIndex) =>
        prevIndex === groomingServices.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000); // Change service every 5 seconds

    return () => clearInterval(interval);
  }, []);
  
  const handleBookNow = (serviceId) => {
    setSelectedServiceType(serviceId);
    setShowDatePickerModal(true);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here
  };
  
  const getServiceAvailability = (serviceId) => {
    const availability = serviceAvailability[serviceId];
    let color = 'success';
    let text = 'Available';
    
    if (availability.isFull) {
      color = 'danger';
      text = 'Fully Booked';
    } else if (availability.available <= 2) {
      color = 'warning';
      text = 'Limited Slots';
    }
    
    return {
      color,
      text,
      slots: availability.available
    };
  };

  const currentService = groomingServices[currentServiceIndex];
  const serviceAvailabilityInfo = getServiceAvailability(currentService.id);
  
  // Get pricing for current service
  const currentPricing = groomingPricing[currentService.name] || {
    s: { weight: '1-9 KG', price: 'Php 750' },
    m: { weight: '9-25 KG', price: 'Php 850' },
    l: { weight: '25-40 KG', price: 'Php 1000' },
    xl: { weight: '40+ KG', price: 'Php 1500' },
    cat: { weight: 'Cat', price: 'Php 550' }
  };

  // Inside the return statement, modify the layout (around line 300)
  return (
    <Container ref={containerRef} className="services-container py-4">
      <h2 className="text-center mb-4">Pet Grooming Services</h2>
      
      <Card className="room-card h-100 grooming-carousel mb-4">
        <div className="service-type-indicators">
          {groomingServices.map((service, idx) => (
            <div
              key={idx}
              className={`service-indicator ${idx === currentServiceIndex ? 'active' : ''}`}
              onClick={() => setCurrentServiceIndex(idx)}
            />
          ))}
        </div>
        <div className="row no-gutters">
          <div className="col-md-6"> {/* Changed from col-md-12 to col-md-6 */}
            {/* Add image carousel on the left */}
            <GroomingCarousel />
          </div>
          <div className="col-md-6"> {/* Added col-md-6 for the right side */}
            <div className="room-card-header">
              <h4>
                {currentService.name}
                <Badge
                  bg={serviceAvailabilityInfo.color}
                  className="ms-2 availability-badge"
                  style={{ color: '#fff', fontSize: '0.8rem' }}
                >
                  {serviceAvailabilityInfo.text}
                </Badge>
              </h4>
            </div>
            <div className="room-card-body">
              <p className="room-description">{currentService.description}</p>
              
              <div className="pricing-section">
                <h5 className="pricing-header">
                  <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                  {currentService.name} Pricing Information
                </h5>
                <div className="price-table">
                  {Object.entries(currentPricing).map(([size, details]) => (
                    <div key={size} className="price-item">
                      <div className="price-item-header">
                        <FontAwesomeIcon icon={faPaw} className="mb-2" />
                        <div>{size === 's' ? 'Toy/Small' : size === 'm' ? 'Medium' : size === 'l' ? 'Large' : size === 'xl' ? 'Extra Large' : 'Cat'}</div>
                        <div>{details.weight}</div>
                      </div>
                      <div className="price-item-value">{details.price}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="included-services">
                <h5 className="included-services-header">
                  <FontAwesomeIcon icon={faCheck} className="me-2" />
                  Included Services:
                </h5>
                <div className="services-list">
                  {currentService.includedServices.map((service, index) => (
                    <div key={index} className="service-item">
                      <FontAwesomeIcon icon={faPaw} className="me-2" />
                      {service}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="text-center mt-4">
                <div className="room-availability">
                  <span className="slots-info">{serviceAvailabilityInfo.slots} slots available</span>
                  <Button
                    variant="primary"
                    className={`book-now-btn ${serviceAvailabilityInfo.slots === 0 ? 'disabled' : ''}`}
                    onClick={() => handleBookNow(currentService.id)}
                    disabled={serviceAvailabilityInfo.slots === 0}
                  >
                    {serviceAvailabilityInfo.slots === 0 ? 'Fully Booked' : 'Book Now'} <FontAwesomeIcon icon={faCalendarAlt} className="ms-2" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      {showDatePickerModal && (
        <DatePickerModal
          show={showDatePickerModal}
          onHide={() => setShowDatePickerModal(false)}
          onDateSelect={(date) => {
            navigate('/grooming-reservation', { state: { startDate: date, serviceType: selectedServiceType } });
          }}
          serviceType="grooming"
        />
      )}
    </Container>
  );
};

export default GroomingServices;