import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Nav } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaw, faCalendarAlt, faInfoCircle, faCheck, faQuestion, faImages, faBone, faHeart, faBed, faShower, faVideo, faClock } from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import DatePickerModal from './DatePickerModal';
import ImportantNoticeCard from './ImportantNoticeCard';
import PhotoGalleryModal from './PhotoGalleryModal';
import './Services.css';
import './GradientBackground.css';
import baguioLogo from '../assets/logo192.png';
import petDaycare from '../assets/pet-daycare.svg';
import deluxeRoom1 from '../assets/Delux2.jpg';
import deluxeRoom2 from '../assets/Delux1.jpg';
import premiumRoom1 from '../assets/premium.jpg';
import premiumRoom2 from '../assets/premium.jpg';
import executiveRoom1 from '../assets/exclusive.jpg';
import executiveRoom2 from '../assets/exclusive.jpg';
import { API_URL } from '../config';
import { useRoomAvailability } from '../context/RoomAvailabilityContext';

const Services = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    setIsLoaded(true);
  }, []);
  const navigate = useNavigate();
  const location = useLocation();
  
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [serviceType, setServiceType] = useState('overnight');
  const [selectedRoom, setSelectedRoom] = useState(null);
  // Add default values and null checks for roomAvailability
  const { 
    roomAvailability = {
      deluxe: { available: 10, total: 10 },
      premium: { available: 8, total: 8 },
      executive: { available: 5, total: 5 },
      daycare: { available: 10, total: 10 }
    }, 
    updateRoomAvailability = () => {} 
  } = useRoomAvailability() || {};
  const [selectedSize, setSelectedSize] = useState(null);
  const [availableSlots, setAvailableSlots] = useState({
    deluxe: 10,
    premium: 8,
    executive: 5
  });
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryTitle, setGalleryTitle] = useState('');
  const [backendRoomTypes, setBackendRoomTypes] = useState([]);
  
  useEffect(() => {
    async function fetchPricing() {
      try {
        const response = await fetch(`${API_URL}/api/services/pricing`);
        const data = await response.json();
        // Group and map backend data to roomTypes structure
        const grouped = {};
        data.forEach(row => {
          if (row.service_type === 'overnight') {
            const key = row.room_type;
            if (!grouped[key]) {
              grouped[key] = {
                id: key + '-rooms',
                name: `Overnight (${key.charAt(0).toUpperCase() + key.slice(1)})`,
                description: row.description || '',
                serviceType: 'overnight',
                roomTypeId: key,
                maxCapacity: key === 'executive' ? 5 : key === 'premium' ? 8 : 10,
                pricing: {},
                includedServices: []
              };
            }
            if (row.size) {
              grouped[key].pricing[row.size.toLowerCase()] = {
                weight: row.size === 'S' ? '1-9 KG' : row.size === 'M' ? '9-25 KG' : row.size === 'L' ? '25-40 KG' : '40+ KG',
                price: `P${row.base_price}${row.service_type === 'overnight' ? '/Night' : ''}`
              };
            }
          } else if (row.service_type === 'daycare') {
            // Add similar logic for daycare
          }
        });
        // Add Pet Day Care if present in DB
        const daycareRows = data.filter(row => row.service_type === 'daycare');
        if (daycareRows.length > 0) {
          const daycare = {
            id: 'pet-day-care',
            name: 'Pet Day Care',
            description: daycareRows[0].description || '',
            serviceType: 'daycare',
            roomTypeId: 'daycare',
            maxCapacity: 10,
            pricing: {},
            includedServices: [
              '24/7 Monitoring',
              'Pet sitting',
              'Pet feeding',
              'Comfortable bedding'
            ]
          };
          daycareRows.forEach(row => {
            if (row.size) {
              daycare.pricing[row.size.toLowerCase()] = {
                weight: row.size === 'S' ? '1-9 KG' : row.size === 'M' ? '9-25 KG' : row.size === 'L' ? '25-40 KG' : '40+ KG',
                price: `P${row.base_price}`
              };
            }
          });
          setBackendRoomTypes([daycare, ...Object.values(grouped)]);
        } else {
          setBackendRoomTypes(Object.values(grouped));
        }
      } catch (err) {
        setBackendRoomTypes([]);
      }
    }
    fetchPricing();
  }, []);
  
  // Function to handle room selection
  const handleRoomSelection = (roomType) => {
    if (selectedRoom === roomType) {
      // Deselect the room if it's already selected
      setSelectedRoom(null);
      updateRoomAvailability(roomType, -1, 'cancelled');
      return;
    }

    if (selectedRoom) {
      // Release the previously selected room
      updateRoomAvailability(selectedRoom, -1, 'cancelled');
    }

    // Check if there are available slots for the new room
    const availableCount = roomAvailability && roomAvailability[roomType] ? roomAvailability[roomType].available : 0;
    if (availableCount > 0) {
      setSelectedRoom(roomType);
      updateRoomAvailability(roomType, 1, 'pending');
    } else {
      alert(`Sorry, no available slots for ${roomType} room type.`);
    }
  };
  
  // Function to open photo gallery
  const openPhotoGallery = (roomType) => {
    let images = [];
    let title = '';
    
    switch(roomType) {
      case 'daycare':
        title = 'Pet Daycare Photo Album';
        images = [
          { src: petDaycare, alt: 'Pet Daycare Area', caption: 'Our spacious daycare area for pets to play and socialize' },
          { src: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80', alt: 'Dogs Playing', caption: 'Supervised playtime for dogs' },
          { src: 'https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80', alt: 'Pet Care', caption: 'Professional pet care during the day' }
        ];
        break;
      case 'deluxe':
        title = 'Deluxe Rooms Photo Album';
        images = [
          { src: deluxeRoom1, alt: 'Deluxe Room', caption: 'Our comfortable deluxe rooms for your pet' },
          { src: deluxeRoom2, alt: 'Deluxe Room', caption: 'Our comfortable deluxe rooms for your pet' },
          { src: 'https://images.unsplash.com/photo-1541599468348-e96984315921?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80', alt: 'Pet Bed', caption: 'Comfortable beds for a good night\'s sleep' },
          { src: 'https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80', alt: 'Room Interior', caption: 'Well-ventilated space with regular monitoring' }
        ];
        break;
      case 'premium':
        title = 'Premium Rooms Photo Album';
        images = [
          { src: premiumRoom1, alt: 'Premium Room', caption: 'Spacious comfort with premium amenities' },
          { src: premiumRoom2, alt: 'Premium Play Area', caption: 'Private play area with dedicated space' },
          { src: 'https://images.unsplash.com/photo-1560743641-3914f2c45636?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80', alt: 'Premium Bed', caption: 'Premium beds and comfort features' },
          { src: 'https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80', alt: 'Play Area', caption: 'Access to our play area for 2 hours daily' }
        ];
        break;
      case 'executive':
        title = 'Executive Rooms Photo Album';
        images = [
          { src: executiveRoom1, alt: 'Executive Suite', caption: 'Luxury living space with premium features' },
          { src: executiveRoom2, alt: 'Executive Amenities', caption: 'Premium amenities and dedicated areas' },
          { src: 'https://images.unsplash.com/photo-1581888227599-779811939961?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80', alt: 'Executive Suite', caption: 'Spacious executive suites for maximum comfort' },
          { src: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80', alt: 'Outdoor Area', caption: 'Regular outdoor breaks in our beautiful grounds' }
        ];
        break;
      default:
        break;
    }
    
    setGalleryImages(images);
    setGalleryTitle(title);
    setShowPhotoGallery(true);
  };
  
  return (
    <div className={`services-container ${isLoaded ? 'fade-in' : ''}`}>
      {/* Navigation Tabs */}
      <div className="booking-steps-nav gradient-background">
        <Container>
          <Nav className="justify-content-between">
            <Nav.Item>
              <Button 
                variant="link" 
                className="nav-link" 
                onClick={() => setShowDatePickerModal(true)}
                style={{ color: '#000' }}
              >
                <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                Select Date
              </Button>
            </Nav.Item>
            <Nav.Item>
              <Button 
                variant="link" 
                className="nav-link active" 
                style={{ color: '#000', fontWeight: 'bold' }}
              >
                <FontAwesomeIcon icon={faPaw} className="me-2" />
                Select Services
              </Button>
            </Nav.Item>
            <Nav.Item>
              <Button 
                variant="link" 
                className="nav-link" 
                style={{ color: '#000' }}
              >
                <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                Reservation Details
              </Button>
            </Nav.Item>
            <Nav.Item>
              <Button 
                variant="link" 
                className="nav-link" 
                style={{ color: '#000' }}
              >
                Confirmation
              </Button>
            </Nav.Item>
          </Nav>
        </Container>
      </div>
      
      {/* Header Section */}
      <div className="gradient-background" style={{ padding: '20px 0', textAlign: 'center' }}>
        <Container>
          <h2 style={{ color: '#fff' }}>Rates and Services</h2>
        </Container>
      </div>

      {/* Overnight Stays Section */}
      <div className="gradient-background" style={{ padding: '20px 0' }}>
        <Container>
          <h3 style={{ color: '#fff', textAlign: 'center', marginBottom: '20px' }}></h3>

          {/* Pet Daycare Section */}
          <Card 
            className="mb-4" 
            style={{ 
              backgroundColor: selectedRoom === 'daycare' ? '#e8f5e9' : '#fff', 
              borderRadius: '10px',
              cursor: 'pointer',
              border: selectedRoom === 'daycare' ? '2px solid #28a745' : '1px solid rgba(0,0,0,.125)',
              transition: 'all 0.3s ease'
            }}
            onClick={() => handleRoomSelection('daycare')}
          >
            <div className="room-availability">
              Available: {roomAvailability?.['daycare']?.available ?? 0} / {roomAvailability?.['daycare']?.total ?? 0}
            </div>
            <Card.Body>
              <h4 className="text-center mb-3">
                {selectedRoom === 'daycare' && (
                  <FontAwesomeIcon icon={faCheck} className="me-2" style={{ color: 'green' }} />
                )}
                PET DAYCARE
                <Button 
                  variant="link" 
                  className="ms-2" 
                  onClick={(e) => {
                    e.stopPropagation();
                    openPhotoGallery('daycare');
                  }}
                  style={{ fontSize: '0.8rem', padding: '2px 5px' }}
                >
                  <FontAwesomeIcon icon={faImages} className="me-1" /> View Photos
                </Button>
              </h4>
              <p className="text-center">
                Minimum of (6) Hours - Professional pet care during the day with supervised playtime, meals, and rest periods.
              </p>
              
              <Row className="mt-4 text-center">
                <Col md={12}>
                  <div className="price-info-box" style={{ 
                    backgroundColor: '#FFF8E1', 
                    padding: '20px', 
                    borderRadius: '10px',
                    border: '1px solid #FFD180'
                  }}>
                    <h5 style={{ color: '#FF8C00', marginBottom: '15px' }}>
                      <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                      Daycare Pricing Information
                    </h5>
                    <p style={{ fontSize: '1.1rem' }}>
                      Our daycare rates are based on your pet's size:
                    </p>
                    <Row className="justify-content-center">
                      <Col md={3} className="text-center mb-3">
                        <div style={{ 
                          padding: '10px', 
                          backgroundColor: 'rgba(255, 140, 0, 0.1)', 
                          borderRadius: '8px',
                          height: '100%'
                        }}>
                          <FontAwesomeIcon icon={faPaw} className="mb-2" style={{ fontSize: '1.5rem', color: '#FF8C00' }} />
                          <p style={{ fontWeight: 'bold', margin: '0' }}>Small <span style={{ fontWeight: 'bold' }}>1-9 KG</span></p>
                          <p>{backendRoomTypes.find(room => room.roomTypeId === 'daycare')?.pricing['s']?.price || 'P350'}</p>
                        </div>
                      </Col>
                      <Col md={3} className="text-center mb-3">
                        <div style={{ 
                          padding: '10px', 
                          backgroundColor: 'rgba(255, 140, 0, 0.1)', 
                          borderRadius: '8px',
                          height: '100%'
                        }}>
                          <FontAwesomeIcon icon={faPaw} className="mb-2" style={{ fontSize: '1.5rem', color: '#FF8C00' }} />
                          <p style={{ fontWeight: 'bold', margin: '0' }}>Medium <span style={{ fontWeight: 'bold' }}>9-25 KG</span></p>
                          <p>{backendRoomTypes.find(room => room.roomTypeId === 'daycare')?.pricing['m']?.price || 'P450'}</p>
                        </div>
                      </Col>
                      <Col md={3} className="text-center mb-3">
                        <div style={{ 
                          padding: '10px', 
                          backgroundColor: 'rgba(255, 140, 0, 0.1)', 
                          borderRadius: '8px',
                          height: '100%'
                        }}>
                          <FontAwesomeIcon icon={faPaw} className="mb-2" style={{ fontSize: '1.5rem', color: '#FF8C00' }} />
                          <p style={{ fontWeight: 'bold', margin: '0' }}>Large <span style={{ fontWeight: 'bold' }}>25-40 KG</span></p>
                          <p>{backendRoomTypes.find(room => room.roomTypeId === 'daycare')?.pricing['l']?.price || 'P500'}</p>
                        </div>
                      </Col>
                      <Col md={3} className="text-center mb-3">
                        <div style={{ 
                          padding: '10px', 
                          backgroundColor: 'rgba(255, 140, 0, 0.1)', 
                          borderRadius: '8px',
                          height: '100%'
                        }}>
                          <FontAwesomeIcon icon={faPaw} className="mb-2" style={{ fontSize: '1.5rem', color: '#FF8C00' }} />
                          <p style={{ fontWeight: 'bold', margin: '0' }}>Extra-Large <span style={{ fontWeight: 'bold' }}>40+ KG</span></p>
                          <p>{backendRoomTypes.find(room => room.roomTypeId === 'daycare')?.pricing['xl']?.price || 'P600'}</p>
                        </div>
                      </Col>
                    </Row>
                    <div className="mt-3 p-3" style={{ backgroundColor: 'rgba(40, 167, 69, 0.1)', borderRadius: '8px' }}>
                      <p style={{ margin: '0', color: '#28a745' }}>
                        <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                        <strong>Note:</strong> Additional P80 per hour exceeded beyond the minimum 6 hours.
                      </p>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Deluxe Rooms */}
          <Card 
            className="mb-4" 
            style={{ 
              backgroundColor: selectedRoom === 'deluxe' ? '#e8f5e9' : '#fff', 
              borderRadius: '10px',
              cursor: 'pointer',
               border: selectedRoom === 'daycare' ? '2px solid #28a745' : '1px solid rgba(0,0,0,.125)',
              transition: 'all 0.3s ease'
            }}
            onClick={() => handleRoomSelection('deluxe')}
          >
            <Card.Body>
              <h4 className="text-center mb-3">
                {selectedRoom === 'deluxe' && (
                  <FontAwesomeIcon icon={faCheck} className="me-2" style={{ color: 'green' }} />
                )}
                DELUXE ROOMS
                <Button 
                  variant="link" 
                  className="ms-2" 
                  onClick={(e) => {
                    e.stopPropagation();
                    openPhotoGallery('deluxe');
                  }}
                  style={{ fontSize: '0.8rem', padding: '2px 5px' }}
                >
                  <FontAwesomeIcon icon={faImages} className="me-1" /> View Photos
                </Button>
              </h4>
              <p className="text-center">
                (Regular Room Gated with 24/7 Pet sitter, Well Ventilated, (1) HOUR Access Play Area Daily, Morning and Evening Outdoor breaks Inclusive of Regular Bed and Food Bowls + Treats, Good for Small/Medium Sizes, Real-Time Updates)<br/>
                ***For CATS: Inclusive of Litter Boxes and Scratch Pads
              </p>
              
              <Row className="mt-4 text-center">
                <Col md={12}>
                  <div className="price-info-box" style={{ 
                    backgroundColor: '#FFF8E1', 
                    padding: '20px', 
                    borderRadius: '10px',
                    border: '1px solid #FFD180'
                  }}>
                    <h5 style={{ color: '#FF8C00', marginBottom: '15px' }}>
                      <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                      Room Pricing Information
                    </h5>
                    <p style={{ fontSize: '1.1rem' }}>
                      Our room rates are based on your pet's actual size as measured by our staff:
                    </p>
                    <Row className="justify-content-center">
                      <Col md={3} className="text-center mb-3">
                        <div style={{ 
                          padding: '10px', 
                          backgroundColor: 'rgba(255, 140, 0, 0.1)', 
                          borderRadius: '8px',
                          height: '100%'
                        }}>
                          <FontAwesomeIcon icon={faPaw} className="mb-2" style={{ fontSize: '1.5rem', color: '#FF8C00' }} />
                          <p style={{ fontWeight: 'bold', margin: '0' }}>Small <span style={{ fontWeight: 'bold' }}>1-9 KG</span></p>
                          <p>{backendRoomTypes.find(room => room.roomTypeId === 'deluxe')?.pricing['s']?.price || 'P500/Night'}</p>
                        </div>
                      </Col>
                      <Col md={3} className="text-center mb-3">
                        <div style={{ 
                          padding: '10px', 
                          backgroundColor: 'rgba(255, 140, 0, 0.1)', 
                          borderRadius: '8px',
                          height: '100%'
                        }}>
                          <FontAwesomeIcon icon={faPaw} className="mb-2" style={{ fontSize: '1.5rem', color: '#FF8C00' }} />
                          <p style={{ fontWeight: 'bold', margin: '0' }}>Medium <span style={{ fontWeight: 'bold' }}>9-25 KG</span></p>
                          <p>{backendRoomTypes.find(room => room.roomTypeId === 'deluxe')?.pricing['m']?.price || 'P650/Night'}</p>
                        </div>
                      </Col>
                      <Col md={3} className="text-center mb-3">
                        <div style={{ 
                          padding: '10px', 
                          backgroundColor: 'rgba(255, 140, 0, 0.1)', 
                          borderRadius: '8px',
                          height: '100%'
                        }}>
                          <FontAwesomeIcon icon={faPaw} className="mb-2" style={{ fontSize: '1.5rem', color: '#FF8C00' }} />
                          <p style={{ fontWeight: 'bold', margin: '0' }}>Large <span style={{ fontWeight: 'bold' }}>25-40 KG</span></p>
                          <p>{backendRoomTypes.find(room => room.roomTypeId === 'deluxe')?.pricing['l']?.price || 'P750/Night'}</p>
                        </div>
                      </Col>
                      <Col md={3} className="text-center mb-3">
                        <div style={{ 
                          padding: '10px', 
                          backgroundColor: 'rgba(255, 140, 0, 0.1)', 
                          borderRadius: '8px',
                          height: '100%'
                        }}>
                          <FontAwesomeIcon icon={faPaw} className="mb-2" style={{ fontSize: '1.5rem', color: '#FF8C00' }} />
                          <p style={{ fontWeight: 'bold', margin: '0' }}>Extra-Large <span style={{ fontWeight: 'bold' }}>40+ KG</span></p>
                          <p>{backendRoomTypes.find(room => room.roomTypeId === 'deluxe')?.pricing['xl']?.price || 'P1,000/Night'}</p>
                        </div>
                      </Col>
                    </Row>
                    <ImportantNoticeCard>
                      <strong>Important:</strong> Your pet's size will be measured at our facility to determine the appropriate room rate. You do not need to select a size now. This ensures your pet gets the right accommodation for their comfort and safety.
                    </ImportantNoticeCard>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
          
          {/* Premium Rooms */}
          <Card 
            className="mb-4" 
            style={{ 
              backgroundColor: selectedRoom === 'premium' ? '#e8f5e9' : '#fff', 
              borderRadius: '10px',
              cursor: 'pointer',
              border: selectedRoom === 'daycare' ? '2px solid #28a745' : '1px solid rgba(0,0,0,.125)',
              transition: 'all 0.3s ease'
            }}
            onClick={() => handleRoomSelection('premium')}
          >
            <Card.Body>
              <h4 className="text-center mb-3">
                {selectedRoom === 'premium' && (
                  <FontAwesomeIcon icon={faCheck} className="me-2" style={{ color: 'green' }} />
                )}
                PREMIUM ROOMS
                <Button 
                  variant="link" 
                  className="ms-2" 
                  onClick={(e) => {
                    e.stopPropagation();
                    openPhotoGallery('premium');
                  }}
                  style={{ fontSize: '0.8rem', padding: '2px 5px' }}
                >
                  <FontAwesomeIcon icon={faImages} className="me-1" /> View Photos
                </Button>
              </h4>
              <p className="text-center">
                (Premium Gated Room with 24/7 Pet Sitter, Well Ventilated, (2) HOURS Access in our Play Area Daily, Morning and Evening Outdoor Breaks, Inclusive of Premium Bed and Ceramic Bowls + Treats, Good for Small/Medium Sizes, Real-Time Updates)<br/>
                ***For CATS: Inclusive of Litter Boxes and Scratch Pads
              </p>
              
              <Row className="mt-4 text-center">
                <Col md={12}>
                  <div className="price-info-box" style={{ 
                    backgroundColor: '#FFF8E1', 
                    padding: '20px', 
                    borderRadius: '10px',
                    border: '1px solid #FFD180'
                  }}>
                    <h5 style={{ color: '#FF8C00', marginBottom: '15px' }}>
                      <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                      Room Pricing Information
                    </h5>
                    <p style={{ fontSize: '1.1rem' }}>
                      Our room rates are based on your pet's actual size as measured by our staff:
                    </p>
                    <Row className="justify-content-center">
                      <Col md={3} className="text-center mb-3">
                        <div style={{ 
                          padding: '10px', 
                          backgroundColor: 'rgba(255, 140, 0, 0.1)', 
                          borderRadius: '8px',
                          height: '100%'
                        }}>
                          <FontAwesomeIcon icon={faPaw} className="mb-2" style={{ fontSize: '1.5rem', color: '#FF8C00' }} />
                          <p style={{ fontWeight: 'bold', margin: '0' }}>Small <span style={{ fontWeight: 'bold' }}>1-9 KG</span></p>
                          <p>{backendRoomTypes.find(room => room.roomTypeId === 'premium')?.pricing['s']?.price || 'P650/Night'}</p>
                        </div>
                      </Col>
                      <Col md={3} className="text-center mb-3">
                        <div style={{ 
                          padding: '10px', 
                          backgroundColor: 'rgba(255, 140, 0, 0.1)', 
                          borderRadius: '8px',
                          height: '100%'
                        }}>
                          <FontAwesomeIcon icon={faPaw} className="mb-2" style={{ fontSize: '1.5rem', color: '#FF8C00' }} />
                          <p style={{ fontWeight: 'bold', margin: '0' }}>Medium <span style={{ fontWeight: 'bold' }}>9-25 KG</span></p>
                          <p>{backendRoomTypes.find(room => room.roomTypeId === 'premium')?.pricing['m']?.price || 'P800/Night'}</p>
                        </div>
                      </Col>
                      <Col md={3} className="text-center mb-3">
                        <div style={{ 
                          padding: '10px', 
                          backgroundColor: 'rgba(255, 140, 0, 0.1)', 
                          borderRadius: '8px',
                          height: '100%'
                        }}>
                          <FontAwesomeIcon icon={faPaw} className="mb-2" style={{ fontSize: '1.5rem', color: '#FF8C00' }} />
                          <p style={{ fontWeight: 'bold', margin: '0' }}>Large <span style={{ fontWeight: 'bold' }}>25-40 KG</span></p>
                          <p>{backendRoomTypes.find(room => room.roomTypeId === 'premium')?.pricing['l']?.price || 'P1,000/Night'}</p>
                        </div>
                      </Col>
                      <Col md={3} className="text-center mb-3">
                        <div style={{ 
                          padding: '10px', 
                          backgroundColor: 'rgba(255, 140, 0, 0.1)', 
                          borderRadius: '8px',
                          height: '100%'
                        }}>
                          <FontAwesomeIcon icon={faPaw} className="mb-2" style={{ fontSize: '1.5rem', color: '#FF8C00' }} />
                          <p style={{ fontWeight: 'bold', margin: '0' }}>Extra-Large <span style={{ fontWeight: 'bold' }}>40+ KG</span></p>
                          <p>{backendRoomTypes.find(room => room.roomTypeId === 'premium')?.pricing['xl']?.price || 'P1,500/Night'}</p>
                        </div>
                      </Col>
                    </Row>
                    <ImportantNoticeCard>
                      <strong>Important:</strong> Your pet's size will be measured at our facility to determine the appropriate room rate. You do not need to select a size now. This ensures your pet gets the right accommodation for their comfort and safety.
                    </ImportantNoticeCard>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
          
          
          
          {/* Executive Rooms */}
          <Card 
            className="mb-4" 
            style={{ 
              backgroundColor: selectedRoom === 'executive' ? '#e8f5e9' : '#fff', 
              borderRadius: '10px',
              cursor: 'pointer',
              border: selectedRoom === 'daycare' ? '2px solid #28a745' : '1px solid rgba(0,0,0,.125)',
              transition: 'all 0.3s ease'
            }}
            onClick={() => handleRoomSelection('executive')}
          >
            <Card.Body>
              <h4 className="text-center mb-3">
                {selectedRoom === 'executive' && (
                  <FontAwesomeIcon icon={faCheck} className="me-2" style={{ color: 'green' }} />
                )}
                EXECUTIVE ROOMS
                <Button 
                  variant="link" 
                  className="ms-2" 
                  onClick={(e) => {
                    e.stopPropagation();
                    openPhotoGallery('executive');
                  }}
                  style={{ fontSize: '0.8rem', padding: '2px 5px' }}
                >
                  <FontAwesomeIcon icon={faImages} className="me-1" /> View Photos
                </Button>
              </h4>
              <p className="text-center">
                (Executive Gated Room with 24/7 Pet Sitter, Well Ventilated, (3) HOURS Access in our Play Area Daily, Morning and Evening Outdoor Breaks, Inclusive of Executive Bed and Ceramic Bowls + Treats, Good for Small/Medium/Large Sizes, Real-Time Updates)<br/>
                ***For CATS: Inclusive of Litter Boxes and Scratch Pads
              </p>
              
              <Row className="mt-4 text-center">
                <Col md={12}>
                  <div className="price-info-box" style={{ 
                    backgroundColor: '#FFF8E1', 
                    padding: '20px', 
                    borderRadius: '10px',
                    border: '1px solid #FFD180'
                  }}>
                    <h5 style={{ color: '#FF8C00', marginBottom: '15px' }}>
                      <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                      Room Pricing Information
                    </h5>
                    <p style={{ fontSize: '1.1rem' }}>
                      Our room rates are based on your pet's actual size as measured by our staff:
                    </p>
                    <Row className="justify-content-center">
                      <Col md={3} className="text-center mb-3">
                        <div style={{ 
                          padding: '10px', 
                          backgroundColor: 'rgba(255, 140, 0, 0.1)', 
                          borderRadius: '8px',
                          height: '100%'
                        }}>
                          <FontAwesomeIcon icon={faPaw} className="mb-2" style={{ fontSize: '1.5rem', color: '#FF8C00' }} />
                          <p style={{ fontWeight: 'bold', margin: '0' }}>Small <span style={{ fontWeight: 'bold' }}>1-9 KG</span></p>
                          <p>{backendRoomTypes.find(room => room.roomTypeId === 'executive')?.pricing['s']?.price || 'P650/Night'}</p>
                        </div>
                      </Col>
                      <Col md={3} className="text-center mb-3">
                        <div style={{ 
                          padding: '10px', 
                          backgroundColor: 'rgba(255, 140, 0, 0.1)', 
                          borderRadius: '8px',
                          height: '100%'
                        }}>
                          <FontAwesomeIcon icon={faPaw} className="mb-2" style={{ fontSize: '1.5rem', color: '#FF8C00' }} />
                          <p style={{ fontWeight: 'bold', margin: '0' }}>Medium <span style={{ fontWeight: 'bold' }}>9-25 KG</span></p>
                          <p>{backendRoomTypes.find(room => room.roomTypeId === 'executive')?.pricing['m']?.price || 'P850/Night'}</p>
                        </div>
                      </Col>
                      <Col md={3} className="text-center mb-3">
                        <div style={{ 
                          padding: '10px', 
                          backgroundColor: 'rgba(255, 140, 0, 0.1)', 
                          borderRadius: '8px',
                          height: '100%'
                        }}>
                          <FontAwesomeIcon icon={faPaw} className="mb-2" style={{ fontSize: '1.5rem', color: '#FF8C00' }} />
                          <p style={{ fontWeight: 'bold', margin: '0' }}>Large <span style={{ fontWeight: 'bold' }}>25-40 KG</span></p>
                          <p>{backendRoomTypes.find(room => room.roomTypeId === 'executive')?.pricing['l']?.price || 'P1,000/Night'}</p>
                        </div>
                      </Col>
                      <Col md={3} className="text-center mb-3">
                        <div style={{ 
                          padding: '10px', 
                          backgroundColor: 'rgba(255, 140, 0, 0.1)', 
                          borderRadius: '8px',
                          height: '100%'
                        }}>
                          <FontAwesomeIcon icon={faPaw} className="mb-2" style={{ fontSize: '1.5rem', color: '#FF8C00' }} />
                          <p style={{ fontWeight: 'bold', margin: '0' }}>Extra-Large <span style={{ fontWeight: 'bold' }}>40+ KG</span></p>
                          <p>{backendRoomTypes.find(room => room.roomTypeId === 'executive')?.pricing['xl']?.price || 'P1,500/Night'}</p>
                        </div>
                      </Col>
                    </Row>
                    <ImportantNoticeCard>
                      <strong>Important:</strong> Your pet's size will be measured at our facility to determine the appropriate room rate. You do not need to select a size now. This ensures your pet gets the right accommodation for their comfort and safety.
                    </ImportantNoticeCard>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
          
          <p className="text-center" style={{ color: '#fff' }}>+P500/night room fee (for all sizes)</p>
          
          <div className="features-grid mb-4">
  <div className="feature-item">
    <FontAwesomeIcon icon={faVideo} className="feature-icon" />
    <span>24/7 CCTV</span>
  </div>
  <div className="feature-item">
    <FontAwesomeIcon icon={faClock} className="feature-icon" />
    <span>Round-the-clock Care</span>
  </div>
  <div className="feature-item">
    <FontAwesomeIcon icon={faHeart} className="feature-icon" />
    <span>Dedicated Staff</span>
  </div>
  <div className="feature-item">
    <FontAwesomeIcon icon={faBed} className="feature-icon" />
    <span>Comfy Bedding</span>
  </div>
  <div className="feature-item">
    <FontAwesomeIcon icon={faShower} className="feature-icon" />
    <span>Daily Cleaning</span>
  </div>
  <div className="feature-item">
    <FontAwesomeIcon icon={faBone} className="feature-icon" />
    <span>Quality Food</span>
  </div>
</div>

<div className="text-center mt-4">
            <Button 
              variant="danger" 
              className="rounded-pill"
              onClick={() => {
                // Create booking data object with selected room
                const bookingData = {
                  selectedRoom: selectedRoom || 'deluxe',
                  roomType: selectedRoom === 'premium' ? 'Premium Room' : 
                           selectedRoom === 'executive' ? 'Executive Room' : 
                           selectedRoom === 'daycare' ? 'Pet Daycare' : 'Deluxe Room',
                  serviceType: selectedRoom === 'daycare' ? 'daycare' : 'overnight'
                };
                
                // Navigate to reservation page with selected room data
                navigate('/overnight-reservation', { state: bookingData });
              }}
              style={{ 
                backgroundColor: '#FF4500', 
                borderColor: '#FF4500', 
                padding: '10px 30px' 
              }}
            >
              Book Now <FontAwesomeIcon icon={faCalendarAlt} className="ms-2" />
            </Button>
          </div>
          
          <div className="text-center mt-5">
            <img 
              src={baguioLogo}  
              alt="Cat" 
              className="img-fluid" 
              style={{ maxWidth: '200px' }}
            />
          </div>
        </Container>
      </div>

      {/* Help Button */}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px' }}>
        <Button 
          variant="light" 
          className="rounded-circle" 
          style={{ width: '50px', height: '50px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
        >
          <FontAwesomeIcon icon={faQuestion} />
        </Button>
      </div>
      

      
      {/* Date Picker Modal */}
      <DatePickerModal 
        show={showDatePickerModal} 
        onHide={() => setShowDatePickerModal(false)} 
        serviceType={serviceType}
        onDateSelect={(dateData) => {
          // Update location state with new date data
          navigate('/services', { state: dateData });
          setShowDatePickerModal(false);
        }}
      />
      
      {/* Photo Gallery Modal */}
      <PhotoGalleryModal
        show={showPhotoGallery}
        onHide={() => setShowPhotoGallery(false)}
        images={galleryImages}
        title={galleryTitle}
      />
    </div>
  );
};

export default Services;