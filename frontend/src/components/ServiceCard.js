import React, { useState, useEffect, useRef } from 'react';
import { Button, Row, Col } from 'react-bootstrap';
import { CheckCircle, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FaPaw } from 'react-icons/fa';
import './ServiceCard.css';

const ServiceCard = (props) => {
  const { 
    title, 
    id, 
    cardType, 
    options, 
    image, 
    pricing, 
    features, 
    description, 
    note, 
    availableSlots, 
    selectedService,
    bookingData
  } = props;
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideInterval = useRef(null);
  const navigate = useNavigate();

  // For sliding cards, set up automatic rotation
  useEffect(() => {
    if (cardType === 'sliding' && options && options.length > 1) {
      slideInterval.current = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % options.length);
      }, 5000); // Change slide every 5 seconds
    }
    
    return () => {
      if (slideInterval.current) {
        clearInterval(slideInterval.current);
      }
    };
  }, [cardType, options]);

  const handlePrevSlide = () => {
    if (slideInterval.current) {
      clearInterval(slideInterval.current);
    }
    setCurrentSlide(prev => (prev === 0 ? (options.length - 1) : prev - 1));
  };

  const handleNextSlide = () => {
    if (slideInterval.current) {
      clearInterval(slideInterval.current);
    }
    setCurrentSlide(prev => (prev + 1) % options.length);
  };

  const handleBookNow = (event) => {
    // Prevent the default behavior of the event
    if (event && event.preventDefault) {
      event.preventDefault();
    }
    
    // If this is a sliding card, use the current option
    let serviceOption;
    if (cardType === 'sliding' && options && options.length > 0) {
      // Safely extract only serializable properties
      const currentOption = options[currentSlide];
      serviceOption = {
        name: currentOption.name,
        description: currentOption.description || '',
        price: currentOption.price || ''
      };
    } else {
      // For standard cards
      serviceOption = {
        name: title,
        price: pricing && pricing.length > 0 ? pricing[0].price : ''
      };
    }
    
    // Determine which reservation route to use based on the service title
    let reservationRoute;
    let serviceRoomTypes;
    
    if (title.toLowerCase().includes('overnight')) {
      reservationRoute = '/overnight-reservation';
      // For overnight stays, we use actual room types
      serviceRoomTypes = [
        { type: 'Deluxe', slots: 10 },
        { type: 'Premium', slots: 10 },
        { type: 'Executive', slots: 2 }
      ];
    } else if (title.toLowerCase().includes('daycare') || title.toLowerCase().includes('day care')) {
      reservationRoute = '/daycare-reservation';
      // For daycare, it's just one service type with 10 slots
      serviceRoomTypes = [
        { type: 'Pet Daycare', slots: 10 }
      ];
    } else if (title.toLowerCase().includes('grooming')) {
      reservationRoute = '/grooming-reservation';
      // For grooming, we now have multiple grooming types with different slots
      serviceRoomTypes = [
        { type: 'Premium Grooming', slots: 5 },
        { type: 'Basic Bath & Dry', slots: 10 },
        { type: 'Special Grooming Package', slots: 5 }
      ];
    } else {
      // Fallback to the generic booking route if we can't determine the service type
      reservationRoute = '/book';
      serviceRoomTypes = [];
    }
    
    // Prepare safe booking data that contains only serializable properties
    let safeBookingData = null;
    if (bookingData) {
      // Always send bookingDate and startTime for grooming
      safeBookingData = {
        serviceType: bookingData.serviceType || '',
        bookingDate: bookingData.bookingDate || bookingData.checkInDate || '',
        startTime: bookingData.startTime || bookingData.checkInTime || '',
        // Optionally include these for compatibility
        checkInDate: bookingData.checkInDate || '',
        checkInTime: bookingData.checkInTime || '',
        checkOutDate: bookingData.checkOutDate || '',
        endTime: bookingData.checkOutTime || bookingData.endTime || ''
      };
    }
    
    // Navigate to the appropriate reservation page with sanitized data
    navigate(reservationRoute, {
      state: {
        selectedDate: safeBookingData?.bookingDate || '',
        selectedTime: safeBookingData?.startTime || '',
        service: {
          id: id,
          title: title,
          option: serviceOption
        },
        // Include safe booking data if available
        ...(safeBookingData && { bookingData: safeBookingData }),
        // Pass the appropriate room/service types for this service
        roomTypes: serviceRoomTypes
      }
    });
  };

  // For sliding card type
  if (cardType === 'sliding' && options) {
    const option = options[currentSlide];
    const slotCount = availableSlots[currentSlide];
    
    // Check if this service type matches the selected service type from booking widget
    const isSelectedServiceType = selectedService && (
      (selectedService.serviceType === 'Overnight Stay' && title.toLowerCase().includes('overnight')) ||
      ((selectedService.serviceType === 'Day Care' || selectedService.serviceType === 'Daycare') && 
       (title.toLowerCase().includes('daycare') || title.toLowerCase().includes('day care'))) ||
      (selectedService.serviceType === 'Grooming' && title.toLowerCase().includes('grooming'))
    ); // Only show buttons for selected service
    
    return (
      <div className={`service-card sliding-card ${isSelectedServiceType ? 'selected' : ''}`}>
        <div className="card-header-section">
          <h3 className="main-title">{title}</h3>
        
        <div className="payment-notice left-positioned">
          <div className="payment-notice-content">
            <Info size={14} className="notice-icon" />
            <span>Payment is face-to-face after pet measurement and document verification</span>
          </div>
        </div>
          {/* Pagination indicators */}
          <div className="pagination-dots">
            {options.map((_, index) => (
              <span 
                key={index} 
                className={`dot ${index === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(index)}
              ></span>
            ))}
          </div>
        </div>
        
        <div className="slide-content">
          <div className="slide-navigation">
            <button className="nav-button prev" onClick={handlePrevSlide}>
              <ChevronLeft size={20} />
            </button>
            <button className="nav-button next" onClick={handleNextSlide}>
              <ChevronRight size={20} />
            </button>
          </div>
          
          <div className="option-title">
            <h4>{option.name}</h4>
          </div>
          <Row className="g-0">
            {/* Left side - Image */}
            <Col md={4} className="service-image-col">
              <div className="service-card-image-container">
                <img src={option.image} alt={option.name} className="service-card-image" />
              </div>
              {option.description && (
                <div className="image-description">
                  {option.description}
                </div>
              )}
            </Col>
            
            {/* Right side - Content */}
            <Col md={8} className="service-content-col">
              <div className="option-title">
                <h4>{option.name}</h4>
              </div>
              
              <div className="pricing-info-container">
                <div className="pricing-header">
                  <Info size={16} className="info-icon" />
                  <span>Pricing Information</span>
                </div>
                
                <div className="pet-size-grid">
                  {option.pricing.map((price, index) => (
                    <div key={index} className={`pet-size-item ${price.size && price.size.toLowerCase().includes('cat') ? 'cat-price' : ''}`}>
                      <div className="pet-icon">
                        <FaPaw />
                      </div>
                      <div className="size-name">{price.size}</div>
                      {price.weight && <div className="weight-range">{price.weight}</div>}
                      <div className="price">₱{price.price}</div>
                    </div>
                  ))}
                </div>
                
                {option.additionalFee && (
                  <div className="additional-fee">
                    {option.additionalFee}
                  </div>
                )}
              </div>
              
              <div className="card-footer">
                <div className="slots-info">
                  {slotCount} slots available
                </div>
                {isSelectedServiceType && (
                  <Button 
                    className="book-now-btn"
                    variant="success"
                    onClick={handleBookNow}
                  >
                    {bookingData ? 'Continue Booking' : 'Book Now'}
                  </Button>
                )}
              </div>
            </Col>
          </Row>
        </div>
      </div>
    );
  }
  
  // For single card type
  // Check if this service type matches the selected service type from booking widget
  const isSelectedServiceType = selectedService && (
    (selectedService.serviceType === 'Overnight Stay' && title.toLowerCase().includes('overnight')) ||
    ((selectedService.serviceType === 'Day Care' || selectedService.serviceType === 'Daycare') && 
     (title.toLowerCase().includes('daycare') || title.toLowerCase().includes('day care'))) ||
    (selectedService.serviceType === 'Grooming' && title.toLowerCase().includes('grooming'))
  ); // Only show buttons for selected service
  
  return (
    <div className={`service-card ${isSelectedServiceType ? 'selected' : ''}`}>
      <div className="card-header-section">
        <h3 className="main-title">{title}</h3>
        {note && (
          <div className="header-note">
            <Info size={14} className="info-icon" />
            <span className="note-text">{note}</span>
          </div>
        )}
      </div>
      
      
      <Row className="g-0">
        {/* Left side - Image and Description */}
        <Col md={4} className="service-image-col">
          <div className="service-card-image-container">
            <img src={image} alt={title} className="service-card-image" />
          </div>
          {description && (
            <div className="image-description">
              {description}
            </div>
          )}
        </Col>
        
        {/* Right side - Content */}
        <Col md={8} className="service-content-col">

          
          <div className="pricing-info-container">
            <div className="pricing-header">
              <Info size={16} className="info-icon" />
              <span>{title} Pricing Information</span>
            </div>
            
            <div className="pet-size-grid">
              {pricing.map((price, index) => (
                <div key={index} className={`pet-size-item ${price.size && price.size.toLowerCase().includes('cat') ? 'cat-price' : ''}`}>
                  <div className="pet-icon">
                    <FaPaw />
                  </div>
                  <div className="size-name">{price.size}</div>
                  {price.weight && <div className="weight-range">{price.weight}</div>}
                  <div className="price">₱{price.price}</div>
                </div>
              ))}
            </div>
            

          </div>
          
          {features && features.length > 0 && (
            <div className="services-include-section">
              <div className="services-header">
                <CheckCircle size={16} />
                <span>All Services Include:</span>
              </div>
              
              <Row>
                {features.map((feature, index) => (
                  <Col md={6} key={index} className="service-feature-item">
                    <FaPaw className="feature-icon" />
                    <span>{feature}</span>
                  </Col>
                ))}
              </Row>
            </div>
          )}
          
          <div className="card-footer">
            <div className="slots-info">
              {availableSlots} slots available
            </div>
            {isSelectedServiceType && (
              <Button 
                className="book-now-btn"
                variant="success"
                onClick={handleBookNow}
              >
                {bookingData ? 'Continue Booking' : 'Book Now'}
              </Button>
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default ServiceCard;
