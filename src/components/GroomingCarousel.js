import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Carousel } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaw, faCalendarAlt, faCheck } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useLocation } from 'react-router-dom';
import './GroomingCarousel.css';
import ImportantNoticeCard from './ImportantNoticeCard';
import baguioLogo from '../assets/logo192.png';
import { useBookings } from '../context/BookingContext';

// Import your grooming images
import grooming1 from '../assets/grooming1.jpg';
import rabbitImg from '../assets/Rabbit.jpg';
import petPlaying from '../assets/Pet Playing2.jpg';

const GroomingCarousel = () => {
  const [selectedService, setSelectedService] = useState(null);
  const [selectedServiceType, setSelectedServiceType] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { getAvailableSlots, MAX_SLOTS } = useBookings();
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((current) => 
        current === services.length - 1 ? 0 : current + 1
      );
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, []);
  
  // Define service images
  const serviceImages = {
    basic: rabbitImg,
    special: petPlaying,
    premium: grooming1
  };
  
  // Define services data
  const services = [
    {
      id: 'premium',
      name: 'PREMIUM GROOMING',
      description: '+L\'beau Premium Products, Bath & Dry, Ear Cleaning, Sanitary, Paw Cleaning, Trimmer Cut, Puppy Cut or Full Shave',
      image: grooming1,
      prices: [
        { size: 'Toy/Small', weight: '1-9 KG', price: 750 },
        { size: 'Medium', weight: '9-25 KG', price: 850 },
        { size: 'Large', weight: '25-40 KG', price: 1000 },
        { size: 'Extra Large', weight: '40+ KG', price: 1500 },
        { size: 'Cat', weight: '', price: 950 }
      ]
    },
    {
      id: 'basic',
      name: 'BASIC BATH & DRY',
      description: 'Organic Shampoo and Conditioner, Sanitary, Perfume & Powder (optional)',
      image: rabbitImg,
      prices: [
        { size: 'Toy/Small', weight: '1-9 KG', price: 350 },
        { size: 'Medium', weight: '9-25 KG', price: 450 },
        { size: 'Large', weight: '25-40 KG', price: 550 },
        { size: 'Extra Large', weight: '40+ KG', price: 750 },
        { size: 'Cat', weight: '', price: 500 }
      ]
    },
    {
      id: 'special',
      name: 'SPECIAL GROOMING PACKAGE',
      description: 'Basic Bath and Dry, Nail Trim, Face Trim, Sanitary, Paw Pad Trim',
      image: petPlaying,
      prices: [
        { size: 'Toy/Small', weight: '1-9 KG', price: 550 },
        { size: 'Medium', weight: '9-25 KG', price: 650 },
        { size: 'Large', weight: '25-40 KG', price: 800 },
        { size: 'Extra Large', weight: '40+ KG', price: 1000 },
        { size: 'Cat', weight: '', price: 700 }
      ]
    }
  ];

  // Get current date for availability check
  const today = new Date();
  
  // Function to get available slots for a service
  const getServiceAvailability = (serviceType) => {
    return getAvailableSlots(today, 'grooming', serviceType);
  };

  const handleSelect = (selectedIndex) => {
    setActiveIndex(selectedIndex);
    setSelectedService(services[selectedIndex].id);
    setSelectedServiceType(services[selectedIndex].name);
  };

  return (
    <div className="grooming-section">
      <Container>
        <h2 className="text-center mb-4"></h2>
        
        <Carousel 
          activeIndex={activeIndex} 
          onSelect={handleSelect}
          interval={5000}
          className="grooming-carousel mb-4"
        >
          {services.map((service, index) => {
            const availableSlots = getServiceAvailability(service.name);
            const maxSlots = MAX_SLOTS?.grooming?.[service.name] ?? 5;
            
            return (
              <Carousel.Item key={service.id}>
                <Card 
                  className="mb-4" 
                  style={{ 
                    backgroundColor: selectedService === service.id ? '#e8f5e9' : '#fff', 
                    borderRadius: '10px',
                    cursor: 'pointer',
                    border: selectedService === service.id ? '2px solid #28a745' : '1px solid rgba(0,0,0,.125)',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => {
                    setSelectedService(selectedService === service.id ? null : service.id);
                    setSelectedServiceType(service.name);
                  }}
                >
                  <Card.Body>
                    <Row>
                      {/* Left side - Image */}
                      <Col md={4}>
                        <img 
                          src={service.image} 
                          alt={service.name} 
                          className="img-fluid rounded" 
                          style={{ height: '100%', objectFit: 'cover' }}
                        />
                      </Col>
                      
                      {/* Right side - Service details */}
                      <Col md={8}>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h4>
                            {selectedService === service.id && (
                              <FontAwesomeIcon icon={faCheck} className="me-2" style={{ color: '#28a745' }} />
                            )}
                            {service.name}
                          </h4>
                          <span className="badge bg-info">
                            {availableSlots}/{maxSlots} slots available
                          </span>
                        </div>
                        <p>{service.description}</p>
                        
                        <div className="price-info-box" style={{ 
                          backgroundColor: '#FFF8E1', 
                          padding: '20px', 
                          borderRadius: '10px',
                          border: '1px solid #FFD180'
                        }}>
                          <Row className="justify-content-center">
                            {service.prices.map((price, i) => (
                              <Col xs={4} md={2} className="text-center mb-3" key={i}>
                                <div style={{ 
                                  padding: '10px', 
                                  backgroundColor: 'rgba(255, 140, 0, 0.1)', 
                                  borderRadius: '8px'
                                }}>
                                  <FontAwesomeIcon icon={faPaw} className="mb-2" style={{ fontSize: '1.2rem', color: '#FF8C00' }} />
                                  <p style={{ fontWeight: 'bold', margin: '0', fontSize: '0.8rem' }}>{price.size} {price.weight && <br/>}<span>{price.weight}</span></p>
                                  <p style={{ fontSize: '0.9rem' }}>Php {price.price}</p>
                                </div>
                              </Col>
                            ))}
                          </Row>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Carousel.Item>
            );
          })}
        </Carousel>
        
        <ImportantNoticeCard>
          <strong>Important:</strong> Your pet's size will be measured at our facility to determine the appropriate service rate. This ensures your pet gets the right care for their comfort and safety.
        </ImportantNoticeCard>
        
        <div className="text-center mt-4">
          <Button 
            variant="danger" 
            className="rounded-pill"
            style={{ backgroundColor: '#FF4500', borderColor: '#FF4500', padding: '10px 30px' }}
            onClick={() => {
              if (selectedService) {
                // Get date and time data from location state
                const dateTimeData = location.state || {};
                
                // Add selected service to the data (size will be determined at facility)
                const bookingData = {
                  ...dateTimeData,
                  selectedService: selectedService,
                  selectedServiceType: selectedServiceType,
                  // We're not setting selectedSize as it will be determined at the facility
                  serviceType: 'grooming'
                };
                
                // Navigate to reservation page with the data
                navigate('/grooming-reservation', { state: bookingData });
              } else {
                alert('Please select a service before proceeding.');
              }
            }}
            disabled={!selectedService}
          >
            Book now <FontAwesomeIcon icon={faCalendarAlt} className="ms-2" />
          </Button>
        </div>
        
        <div className="text-center mt-5">
          <img 
            src={baguioLogo}  
            alt="Baguio Pet Boarding Logo" 
            className="img-fluid" 
            style={{ maxWidth: '200px' }}
          />
        </div>
      </Container>
    </div>
  );
};

export default GroomingCarousel;