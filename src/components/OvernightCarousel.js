import React, { useState, useEffect } from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaw, faInfoCircle, faCheck, faCalendarAlt, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import RoomCarousel from './RoomCarousel';
import './RoomCards.css';

// Ensure all required dependencies are imported

const OvernightCarousel = ({ onBookNow, availabilityInfo, roomTypes }) => {
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0);
  const overnightRooms = roomTypes.filter(room => room.serviceType === 'overnight');

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentRoomIndex((prevIndex) =>
        prevIndex === overnightRooms.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000); // Change room every 5 seconds

    return () => clearInterval(interval);
  }, [overnightRooms.length]);

  const currentRoom = overnightRooms[currentRoomIndex];
  const roomAvailability = availabilityInfo(currentRoom);

  return (
    <Card className="room-card h-100 overnight-carousel" style={{ position: 'relative' }}>
      <div className="room-type-indicators">
        {overnightRooms.map((room, idx) => (
          <div
            key={idx}
            className={`room-indicator ${idx === currentRoomIndex ? 'active' : ''}`}
            onClick={() => setCurrentRoomIndex(idx)}
          />
        ))}
      </div>
      <div className="row no-gutters">
        <div className="col-md-5 room-card-image-col">
          <RoomCarousel roomType={currentRoom.roomTypeId} />
        </div>
        <div className="col-md-7">
          <div className="room-card-header">
            <h4>
              {currentRoom.name}
              <Badge
                bg={roomAvailability.color}
                className="ms-2 availability-badge"
                style={{ color: '#fff', fontSize: '0.8rem' }}
              >
                {roomAvailability.text}
              </Badge>
            </h4>
          </div>
          <div className="room-card-body">
            <p className="room-description">{currentRoom.description}</p>
            
            <div className="pricing-section">
              <h5 className="pricing-header">
                <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                {currentRoom.name} Pricing Information
              </h5>
              <div className="price-table">
                {Object.entries(currentRoom.pricing).map(([size, details]) => (
                  <div key={size} className="price-item">
                    <div className="price-item-header">
                      <FontAwesomeIcon icon={faPaw} className="mb-2" />
                      <div>{size.charAt(0).toUpperCase() + size.slice(1)}</div>
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
                All Services Include:
              </h5>
              <div className="services-list">
                {currentRoom.includedServices.map((service, index) => (
                  <div key={index} className="service-item">
                    <FontAwesomeIcon icon={faPaw} className="me-2" />
                    {service}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="text-center mt-4">
              <div className="room-availability">
                <span className="slots-info">{roomAvailability.slots} slots available</span>
                <Button
                  variant="primary"
                  className={`book-now-btn ${roomAvailability.slots === 0 ? 'disabled' : ''}`}
                  onClick={() => onBookNow(currentRoom.id)}
                  disabled={roomAvailability.slots === 0}
                >
                  {roomAvailability.slots === 0 ? 'Fully Booked' : 'Book Now'} <FontAwesomeIcon icon={faCalendarAlt} className="ms-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
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
        onClick={() => setCurrentRoomIndex(prevIndex => prevIndex === 0 ? overnightRooms.length - 1 : prevIndex - 1)}
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
        onClick={() => setCurrentRoomIndex(prevIndex => prevIndex === overnightRooms.length - 1 ? 0 : prevIndex + 1)}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 152, 0, 0.2)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 152, 0, 0.1)'}
      >
        <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: '1.5rem', color: '#F97A00' }} />
      </div>
    </Card>
  );
};

export default OvernightCarousel;