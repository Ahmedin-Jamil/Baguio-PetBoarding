import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaw, faInfoCircle, faCheck, faCalendarAlt, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import './RoomCards.css';

// Grooming services data
const groomingServices = [
  {
    id: 'special-grooming',
    name: 'SPECIAL GROOMING PACKAGE',
    description: 'Basic Bath and Dry, Nail Trim, Face Trim, Sanitary, Paw Pad Trim',
    image: require('../assets/premium.jpg'),
    available: true,
    slots: 10,
    pricing: {
      small: { weight: '1-9 KG', price: '₱550' },
      medium: { weight: '9-25 KG', price: '₱650' },
      large: { weight: '25-40 KG', price: '₱800' },
      extraLarge: { weight: '40+ KG', price: '₱1000' },
      cat: { weight: '', price: '₱700' }
    },
    includedServices: [
      'Basic Bath and Dry',
      'Nail Trim',
      'Face Trim',
      'Sanitary',
      'Paw Pad Trim'
    ]
  },
  {
    id: 'basic-grooming',
    name: 'BASIC GROOMING PACKAGE',
    description: 'Basic Bath and Dry, Nail Trim, Ear Cleaning',
    image: require('../assets/premium.jpg'),
    available: true,
    slots: 8,
    pricing: {
      small: { weight: '1-9 KG', price: '₱450' },
      medium: { weight: '9-25 KG', price: '₱550' },
      large: { weight: '25-40 KG', price: '₱650' },
      extraLarge: { weight: '40+ KG', price: '₱800' },
      cat: { weight: '', price: '₱550' }
    },
    includedServices: [
      'Basic Bath and Dry',
      'Nail Trim',
      'Ear Cleaning'
    ]
  },
  {
    id: 'premium-grooming',
    name: 'PREMIUM GROOMING PACKAGE',
    description: 'Full Service Grooming with Styling and Premium Shampoo',
    image: require('../assets/premium.jpg'),
    available: true,
    slots: 5,
    pricing: {
      small: { weight: '1-9 KG', price: '₱750' },
      medium: { weight: '9-25 KG', price: '₱850' },
      large: { weight: '25-40 KG', price: '₱1000' },
      extraLarge: { weight: '40+ KG', price: '₱1200' },
      cat: { weight: '', price: '₱850' }
    },
    includedServices: [
      'Premium Shampoo',
      'Full Body Styling',
      'Nail Trim',
      'Ear Cleaning',
      'Face Trim',
      'Sanitary',
      'Paw Pad Trim'
    ]
  }
];

const GroomingCarouselNew = () => {
  const [currentServiceIndex, setCurrentServiceIndex] = useState(0);
  const navigate = useNavigate();
  
  // Automatically slide to next service every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentServiceIndex((prevIndex) =>
        prevIndex === groomingServices.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  const currentService = groomingServices[currentServiceIndex];
  
  // Get availability information
  const getAvailabilityInfo = (service) => {
    let color = 'success';
    let text = 'Available';
    
    if (service.slots === 0) {
      color = 'danger';
      text = 'Fully Booked';
    } else if (service.slots <= 3) {
      color = 'warning';
      text = 'Limited Slots';
    }
    
    return { slots: service.slots, color, text };
  };
  
  const availabilityInfo = getAvailabilityInfo(currentService);
  
  // Handle booking
  const handleBookNow = (serviceId) => {
    navigate('/grooming-reservation', {
      state: {
        startDate: new Date(),
        selectedTime: null,
        serviceType: 'grooming',
        selectedService: serviceId.split('-')[0],
        selectedServiceType: currentService.name
      }
    });
  };
  
  return (
    <Card className="shadow-sm" style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '20px', border: 'none', position: 'relative' }}>
      <Row>
        <Col md={5}>
          <div style={{ position: 'relative', height: '300px' }}>
            <img
              src={currentService.image}
              alt={currentService.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            <Button 
              variant="warning" 
              size="sm" 
              style={{
                position: 'absolute',
                bottom: '10px',
                left: '10px',
                borderRadius: '20px',
                padding: '5px 15px',
                fontSize: '0.75rem',
                backgroundColor: '#ff9800',
                borderColor: '#ff9800'
              }}
            >
              View Album
            </Button>
            {/* Service indicator dots */}
            <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '5px' }}>
              {groomingServices.map((service, idx) => (
                <div
                  key={idx}
                  style={{
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    backgroundColor: idx === currentServiceIndex ? '#FFA500' : '#FFFFFF',
                    cursor: 'pointer',
                    opacity: idx === currentServiceIndex ? 1 : 0.7,
                  }}
                  onClick={() => setCurrentServiceIndex(idx)}
                />
              ))}
            </div>
          </div>
        </Col>
        <Col md={7}>
          <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '10px' }}>
              <h5 style={{ margin: 0, fontWeight: '600', fontSize: '1.1rem' }}>
                {currentService.name}
              </h5>
            </div>
            
            <Badge 
              bg="success" 
              style={{ 
                fontSize: '0.75rem', 
                padding: '5px 10px', 
                backgroundColor: '#28a745',
                marginBottom: '15px',
                display: 'inline-block'
              }}
            >
              {availabilityInfo.slots} slots available
            </Badge>
            
            <div style={{ background: 'white', borderRadius: '8px', padding: '15px', border: '1px solid #FFD180', marginTop: '15px', marginBottom: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <FontAwesomeIcon icon={faInfoCircle} className="me-2" style={{ color: '#333', fontSize: '1rem' }} />
                <span style={{ fontWeight: '600', fontSize: '1rem' }}>{currentService.name} Pricing Information</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'stretch', justifyContent: 'space-between', marginBottom: '10px' }}>
                {/* Small */}
                <div style={{ flex: '1', backgroundColor: '#f8f9fa', borderRadius: '4px', padding: '10px', textAlign: 'center', marginRight: '5px' }}>
                  <div style={{ textAlign: 'center', marginBottom: '5px' }}>
                    <FontAwesomeIcon icon={faPaw} style={{ color: '#555', fontSize: '1rem' }} />
                  </div>
                  <div style={{ fontWeight: '500', fontSize: '1rem' }}>Small</div>
                  <div style={{ fontSize: '0.85rem', color: '#777' }}>{currentService.pricing.small.weight}</div>
                  <div style={{ fontWeight: '500', color: '#ff8c00', fontSize: '1.1rem', marginTop: '5px' }}>
                    {currentService.pricing.small.price}
                  </div>
                </div>

                {/* Medium */}
                <div style={{ flex: '1', backgroundColor: '#f8f9fa', borderRadius: '4px', padding: '10px', textAlign: 'center', marginRight: '5px' }}>
                  <div style={{ textAlign: 'center', marginBottom: '5px' }}>
                    <FontAwesomeIcon icon={faPaw} style={{ color: '#555', fontSize: '1rem' }} />
                  </div>
                  <div style={{ fontWeight: '500', fontSize: '1rem' }}>Medium</div>
                  <div style={{ fontSize: '0.85rem', color: '#777' }}>{currentService.pricing.medium.weight}</div>
                  <div style={{ fontWeight: '500', color: '#ff8c00', fontSize: '1.1rem', marginTop: '5px' }}>
                    {currentService.pricing.medium.price}
                  </div>
                </div>

                {/* Large */}
                <div style={{ flex: '1', backgroundColor: '#f8f9fa', borderRadius: '4px', padding: '10px', textAlign: 'center', marginRight: '5px' }}>
                  <div style={{ textAlign: 'center', marginBottom: '5px' }}>
                    <FontAwesomeIcon icon={faPaw} style={{ color: '#555', fontSize: '1rem' }} />
                  </div>
                  <div style={{ fontWeight: '500', fontSize: '1rem' }}>Large</div>
                  <div style={{ fontSize: '0.85rem', color: '#777' }}>{currentService.pricing.large.weight}</div>
                  <div style={{ fontWeight: '500', color: '#ff8c00', fontSize: '1.1rem', marginTop: '5px' }}>
                    {currentService.pricing.large.price}
                  </div>
                </div>

                {/* Extra Large */}
                <div style={{ flex: '1', backgroundColor: '#f8f9fa', borderRadius: '4px', padding: '10px', textAlign: 'center', marginRight: '5px' }}>
                  <div style={{ textAlign: 'center', marginBottom: '5px' }}>
                    <FontAwesomeIcon icon={faPaw} style={{ color: '#555', fontSize: '1rem' }} />
                  </div>
                  <div style={{ fontWeight: '500', fontSize: '1rem' }}>Extra-Large</div>
                  <div style={{ fontSize: '0.85rem', color: '#777' }}>{currentService.pricing.extraLarge.weight}</div>
                  <div style={{ fontWeight: '500', color: '#ff8c00', fontSize: '1.1rem', marginTop: '5px' }}>
                    {currentService.pricing.extraLarge.price}
                  </div>
                </div>

                {/* Cat */}
                <div style={{ flex: '1', backgroundColor: '#f8f9fa', borderRadius: '4px', padding: '10px', textAlign: 'center' }}>
                  <div style={{ textAlign: 'center', marginBottom: '5px' }}>
                    <FontAwesomeIcon icon={faPaw} style={{ color: '#555', fontSize: '1rem' }} />
                  </div>
                  <div style={{ fontWeight: '500', fontSize: '1rem' }}>Cat</div>
                  <div style={{ fontSize: '0.85rem', color: '#777' }}>&nbsp;</div>
                  <div style={{ fontWeight: '500', color: '#ff8c00', fontSize: '1.1rem', marginTop: '5px' }}>
                    {currentService.pricing.cat.price}
                  </div>
                </div>
              </div>
              
              <div style={{ backgroundColor: '#e8f5e9', padding: '10px 12px', borderRadius: '4px', color: '#2e7d32', fontSize: '0.85rem', display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                <FontAwesomeIcon icon={faInfoCircle} className="me-2" style={{ fontSize: '0.85rem' }} />
                <span><strong>Note:</strong> Additional fees may apply for extended stays.</span>
              </div>
            </div>
            
            <div style={{ marginTop: '20px', marginBottom: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <FontAwesomeIcon icon={faCheck} style={{ color: '#4caf50', fontSize: '0.9rem' }} />
                <span style={{ marginLeft: '8px', fontSize: '1rem', fontWeight: '500' }}>All Services Include:</span>
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: '8px' }}>
                {currentService.includedServices.map((service, idx) => (
                  <div key={idx} style={{ width: '50%', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <FontAwesomeIcon icon={faPaw} style={{ color: '#555', fontSize: '0.85rem', marginRight: '8px' }} />
                      <span style={{ fontSize: '0.95rem' }}>{service}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '0.95rem', color: '#555', marginRight: '12px', fontWeight: '500' }}>
                  {availabilityInfo.slots} slots available
                </span>
                <Button 
                  variant="success"
                  style={{ 
                    backgroundColor: '#4CAF50', 
                    border: 'none', 
                    borderRadius: '4px', 
                    padding: '0.5rem 1rem',
                    fontWeight: '500',
                    fontSize: '0.95rem'
                  }}
                  onClick={() => handleBookNow(currentService.id)}
                  disabled={availabilityInfo.slots === 0}
                >
                  {availabilityInfo.slots === 0 ? 'Fully Booked' : 'Book Now'} <FontAwesomeIcon icon={faCalendarAlt} style={{ fontSize: '0.85rem', marginLeft: '5px' }} />
                </Button>
              </div>
            </div>
          </div>
        </Col>
      </Row>
      {/* Left Navigation Arrow */}
      <div 
        style={{
          position: 'absolute',
          left: '0',
          top: '50%',
          transform: 'translateY(-50%)',
          backgroundColor: 'rgba(255, 152, 0, 0.1)',
          borderRadius: '0 4px 4px 0',
          width: '40px',
          height: '50px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 10,
          boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
          transition: 'all 0.2s ease'
        }}
        onClick={() => setCurrentServiceIndex(prevIndex => prevIndex === 0 ? groomingServices.length - 1 : prevIndex - 1)}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 152, 0, 0.2)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 152, 0, 0.1)'}
      >
        <FontAwesomeIcon icon={faChevronLeft} style={{ fontSize: '1.5rem', color: '#F97A00' }} />
      </div>
      
      {/* Right Navigation Arrow */}
      <div 
        style={{
          position: 'absolute',
          right: '0',
          top: '50%',
          transform: 'translateY(-50%)',
          backgroundColor: 'rgba(255, 152, 0, 0.1)',
          borderRadius: '4px 0 0 4px',
          width: '40px',
          height: '50px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 10,
          boxShadow: '-2px 0 5px rgba(0,0,0,0.1)',
          transition: 'all 0.2s ease'
        }}
        onClick={() => setCurrentServiceIndex(prevIndex => prevIndex === groomingServices.length - 1 ? 0 : prevIndex + 1)}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 152, 0, 0.2)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 152, 0, 0.1)'}
      >
        <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: '1.5rem', color: '#F97A00' }} />
      </div>
    </Card>
  );
};

export default GroomingCarouselNew;
