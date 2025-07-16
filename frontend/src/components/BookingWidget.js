import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { BookingContext } from '../context/BookingContext';
import { formatDateForAPI, createConsistentDate } from '../utils/dateUtils';
import './BookingWidget.css';

const BookingWidget = ({ onServiceSelect }) => {
  const navigate = useNavigate();
  const { isDateUnavailable, unavailableDates } = useContext(BookingContext);
  const dateInputRef = useRef(null);
  const [serviceType, setServiceType] = useState('Overnight Stay');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [calculatedCheckOutTime, setCalculatedCheckOutTime] = useState('');
  const [minCheckoutDate, setMinCheckoutDate] = useState('');
  
  // Calculate checkout time based on service type
  useEffect(() => {
    if (!checkInTime) {
      setCalculatedCheckOutTime('');
      return;
    }
    
    if (serviceType === 'Overnight Stay') {
      // For overnight stays, check-out time is always 12:00 PM regardless of check-in
      const overnightCheckout = '12:00 PM';
      setCalculatedCheckOutTime(overnightCheckout);
      setCheckOutTime(overnightCheckout);
      return;
    }
    
    if (serviceType === 'Day Care') {
      // Parse check-in time
      const timeRegex = /^(\d+):(\d+) (AM|PM)$/;
      const match = checkInTime.match(timeRegex);
      
      if (match) {
        let hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const period = match[3];
        
        // Convert to 24-hour format for calculation
        if (period === 'PM' && hours !== 12) {
          hours += 12;
        } else if (period === 'AM' && hours === 12) {
          hours = 0;
        }
        
        // Add 6 hours for daycare
        hours += 6;
        
        // Convert back to 12-hour format
        let newPeriod = 'AM';
        if (hours >= 12) {
          newPeriod = 'PM';
          if (hours > 12) {
            hours -= 12;
          }
        }
        
        // Format the calculated check-out time
        const calculatedTime = `${hours}:${minutes.toString().padStart(2, '0')} ${newPeriod}`;
        setCalculatedCheckOutTime(calculatedTime);
        setCheckOutTime(calculatedTime);
      }
    }
  }, [serviceType, checkInTime]);
  
  // Check if a date should be disabled
  const isDateDisabled = (date) => {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const targetDate = createConsistentDate(date);
    return targetDate < currentDate || isDateUnavailable(targetDate);
  };
  
  // Apply custom styling to the date input to highlight unavailable dates
  useEffect(() => {
    // Add custom styles to highlight unavailable dates in the date picker
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      /* Style for unavailable dates in date picker */
      input[type="date"]::-webkit-calendar-picker-indicator {
        background-color: transparent;
        cursor: pointer;
      }
      
      /* This class will be added to the date input container when showing the calendar */
      .date-input-container.showing-calendar {
        position: relative;
      }
      
      /* Custom calendar overlay with highlighted unavailable dates */
      .custom-calendar-overlay {
        position: absolute;
        top: 100%;
        left: 0;
        z-index: 1000;
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        padding: 10px;
        display: none;
      }
      
      .custom-calendar-overlay.visible {
        display: block;
      }
      
      .custom-calendar-day {
        display: inline-block;
        width: 30px;
        height: 30px;
        line-height: 30px;
        text-align: center;
        margin: 2px;
        cursor: pointer;
        border-radius: 50%;
      }
      
      .custom-calendar-day.unavailable {
        background-color: #ffcccc;
        color: #ff0000;
        text-decoration: line-through;
        cursor: not-allowed;
      }
    `;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  
  // Update the calendar overlay when unavailable dates change
  useEffect(() => {
    const updateDateInputStyle = () => {
      if (dateInputRef.current) {
        // Add a data attribute to the input element that can be used by CSS
        if (checkInDate) {
          const selectedDate = new Date(checkInDate);
          if (isDateUnavailable(selectedDate)) {
            dateInputRef.current.classList.add('unavailable-date');
          } else {
            dateInputRef.current.classList.remove('unavailable-date');
          }
        }
      }
    };
    
    updateDateInputStyle();
  }, [checkInDate, isDateUnavailable]);

  // Handle check-in date change
  const handleCheckInDateChange = (e) => {
    const newCheckInDate = e.target.value;
    const dateObj = new Date(newCheckInDate);
    
    // Check if the date is unavailable
    if (isDateDisabled(dateObj)) {
      // Still set the date but mark it as unavailable visually
      setCheckInDate(newCheckInDate);
      
      // Show a warning message or tooltip if needed
      setTimeout(() => {
        alert('This date is unavailable for booking. Please select another date.');
        setCheckInDate(''); // Clear the invalid date
      }, 100);
      return;
    }
    
    setCheckInDate(newCheckInDate);
    
    // Calculate minimum checkout date (day after check-in)
    if (newCheckInDate) {
      const nextDay = new Date(newCheckInDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      // Format as YYYY-MM-DD for the min attribute
      const minDate = formatDateForAPI(nextDay);
      
      setMinCheckoutDate(minDate);
      
      // If current checkout date is before the new minimum, reset it
      if (checkOutDate && checkOutDate < minDate) {
        setCheckOutDate('');
      }
    } else {
      setMinCheckoutDate('');
    }
  };
  
  const handleServiceChange = (e) => {
    setServiceType(e.target.value);
    // Reset time selections when changing service type
    setCheckInTime('');
    setCheckOutTime('');
    setCalculatedCheckOutTime('');
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // For daycare, use the selected check-out time
    const finalCheckOutTime = checkOutTime;
    
    // Get service ID based on service type
    let serviceId;
    switch(serviceType) {
      case 'Overnight Stay':
        serviceId = 1;
        break;
      case 'Day Care':
        serviceId = 2;
        break;
      case 'Grooming':
        serviceId = 3;
        break;
      default:
        serviceId = 1;
    }
    
    // Call the parent component's function to update selected service
    onServiceSelect({
      serviceId,
      serviceType,
      checkInDate,
      checkOutDate,
      checkInTime,
      checkOutTime: finalCheckOutTime
    });
    
    // First scroll to the services section
    const servicesSection = document.getElementById('services');
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: 'smooth' });
      
      // After a small delay to allow the scroll to complete, find and highlight the specific service card
      setTimeout(() => {
        // Get all service cards
        const serviceCards = document.querySelectorAll('.service-card');
        let targetCard = null;
        
        // Find the card that matches the selected service
        serviceCards.forEach(card => {
          const cardTitle = card.querySelector('.main-title')?.textContent?.trim().toLowerCase();
          
          if (serviceType === 'Overnight Stay' && cardTitle?.includes('overnight')) {
            targetCard = card;
          } else if (serviceType === 'Day Care' && (cardTitle?.includes('day care') || cardTitle?.includes('daycare'))) {
            targetCard = card;
          } else if (serviceType === 'Grooming' && cardTitle?.includes('grooming')) {
            targetCard = card;
          }
        });
        
        // If we found the matching card, scroll to it and add a temporary highlight
        if (targetCard) {
          targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetCard.classList.add('highlight-card');
          
          // Remove the highlight after a few seconds
          setTimeout(() => {
            targetCard.classList.remove('highlight-card');
          }, 3000);
        }
      }, 300); // Short delay to allow the initial scroll to complete
    }
  };

  return (
    <div className="booking-widget">
      <Form onSubmit={handleSubmit}>
        <Row>
          <Col md={6} lg={4} className="mb-3">
            <Form.Group>
              <Form.Label className="d-flex align-items-center">
                <span className="me-2">🐾</span> Service Type
              </Form.Label>
              <Form.Select 
                value={serviceType}
                onChange={handleServiceChange}
                className="booking-input"
              >
                <option>Overnight Stay</option>
                <option>Day Care</option>
                <option>Grooming</option>
              </Form.Select>
            </Form.Group>
          </Col>
          
          <Col md={6} lg={4} className="mb-3">
            <Form.Group>
              <Form.Label className="d-flex align-items-center">
                <Calendar size={16} className="me-2" /> Check-in Date
              </Form.Label>
              <div className="date-input-container">
                <Form.Control
                  type="date"
                  value={checkInDate}
                  onChange={handleCheckInDateChange}
                  className="booking-input"
                  required
                  min={formatDateForAPI(new Date())}
                  ref={dateInputRef}
                  onKeyDown={(e) => e.preventDefault()}
                  style={{
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                />
                {checkInDate && isDateUnavailable(new Date(checkInDate)) && (
                  <div className="unavailable-date-tooltip">
                    This date is unavailable for booking
                  </div>
                )}
              </div>
              <datalist id="available-dates">
                {[...Array(60)].map((_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() + i);
                  const dateStr = formatDateForAPI(date);
                  if (!isDateDisabled(dateStr)) {
                    return <option key={dateStr} value={dateStr} />;
                  }
                  return null;
                })}
              </datalist>
            </Form.Group>
          </Col>
          
          {serviceType === 'Overnight Stay' && (
            <Col md={6} lg={4} className="mb-3">
              <Form.Group>
                <Form.Label className="d-flex align-items-center">
                  <Calendar size={16} className="me-2" /> Check-out
                </Form.Label>
                <Form.Control
                  type="date"
                  value={checkOutDate}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    if (isDateDisabled(newDate)) {
                      return; // Don't allow selection of disabled dates
                    }
                    setCheckOutDate(newDate);
                  }}
                  className="booking-input"
                  min={minCheckoutDate || (checkInDate ? (() => {
                    const nextDay = createConsistentDate(checkInDate);
                    nextDay.setDate(nextDay.getDate() + 1);
                    return formatDateForAPI(nextDay);
                  })() : formatDateForAPI(new Date()))}
                  disabled={!checkInDate}
                  required
                  onKeyDown={(e) => e.preventDefault()}
                  style={{
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                />
                {!checkInDate && serviceType === 'Overnight Stay' && (
                  <div className="text-muted small mt-1">Select check-in date first</div>
                )}
              </Form.Group>
            </Col>
          )}
          
          <Col md={6} lg={serviceType === 'Overnight Stay' ? 6 : 4} className="mb-3">
            <Form.Group>
              <Form.Label className="d-flex align-items-center">
                <Clock size={16} className="me-2" /> Check-in Time
              </Form.Label>
              <Form.Select
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
                className="booking-input"
                required
              >
                <option value="">Choose a time...</option>
                {serviceType === 'Day Care' ? (
                  // Limited hours for Day Care (8 AM to 12 PM)
                  <>
                    <option value="8:00 AM">8:00 AM</option>
                    <option value="9:00 AM">9:00 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="12:00 PM">12:00 PM</option>
                  </>
                ) : serviceType === 'Overnight Stay' ? (
                  // Hours for Overnight Stay (8 AM to 6 PM)
                  <>
                    <option value="8:00 AM">8:00 AM</option>
                    <option value="9:00 AM">9:00 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="12:00 PM">12:00 PM</option>
                    <option value="1:00 PM">1:00 PM</option>
                    <option value="2:00 PM">2:00 PM</option>
                    <option value="3:00 PM">3:00 PM</option>
                    <option value="4:00 PM">4:00 PM</option>
                    <option value="5:00 PM">5:00 PM</option>
                    <option value="6:00 PM">6:00 PM</option>
                  </>
                ) : (
                  // Hours for Grooming (8 AM to 2 PM)
                  <>
                    <option value="8:00 AM">8:00 AM</option>
                    <option value="9:00 AM">9:00 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="12:00 PM">12:00 PM</option>
                    <option value="1:00 PM">1:00 PM</option>
                    <option value="2:00 PM">2:00 PM</option>
                  </>
                )}
              </Form.Select>
            </Form.Group>
          </Col>
          
          {(serviceType === 'Day Care' || serviceType === 'Overnight Stay') && (
            <Col md={6} lg={4} className="mb-3">
              <Form.Group>
                <Form.Label className="d-flex align-items-center">
                  <Clock size={16} className="me-2" /> Check-out Time
                </Form.Label>
                <div className="calculated-checkout">
                  {calculatedCheckOutTime ? (
                    <div className="auto-checkout-time">{calculatedCheckOutTime}</div>
                  ) : (
                    <div className="placeholder-time">Select check-in time first</div>
                  )}
                </div>
              </Form.Group>
            </Col>
          )}
          

          {serviceType === 'Overnight Stay' && (
            <Col md={12} className="mb-3">
              <div className="emergency-extension-note text-center">
                <span>For Emergency: If you need an emergency extension for overnight  <br></br> stay you can contact us through this number: <a href="tel:+639452763087" className="phone-link"><strong className="highlight-text">+63 945 276 3087</strong></a> </span>
              </div>
            </Col>
          )}
          
          <Col md={serviceType === 'Overnight Stay' ? 12 : 12} lg={serviceType === 'Overnight Stay' ? 12 : 12} className="mb-3">
            <Button 
              variant="primary" 
              type="submit" 
              className="check-availability-btn w-100"
            >
              CHECK AVAILABILITY
            </Button>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default BookingWidget;
