import React, { useState, useEffect } from 'react';
import { formatDateForDisplay, formatDateForAPI } from '../utils/dateUtils';
import { Container, Row, Col, Card, Badge, Button, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaw, faCalendarAlt, faInfoCircle, faCheck, faExclamationTriangle, faClock, faSearch } from '@fortawesome/free-solid-svg-icons';
import { API_URL } from '../config';
import './BookingDetailsModal.css';
import './ReservationStyles.css';

const BookingSearch = () => {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchSubmitted, setSearchSubmitted] = useState(false);

  // Using shared date utilities from dateUtils.js


  // Handle form submission
  const handleSearch = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setBookings([]);
    setSearchSubmitted(true);

    // Validate that at least one field is provided
    if (!referenceNumber && !email) {
      setError('Please enter a booking reference number or email to search.');
      setIsLoading(false);
      return;
    }

    try {
      const searchParams = new URLSearchParams();
      if (referenceNumber) {
        const normalizedRef = referenceNumber.trim().replace(/^#/, '');
        searchParams.append('referenceNumber', normalizedRef);
      }
      if (email) {
        searchParams.append('email', email.trim());
      }

      // Make API request
      const response = await fetch(`${API_URL}/api/bookings/search?${searchParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      // Handle response
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch bookings');
      }

      if (!data.success || !data.data || data.data.length === 0) {
        setError('No bookings found. Please check your search details and try again.');
        setBookings([]);
        setIsLoading(false);
        return;
      }
      
      const bookings = data.data;
      
      // Filter and sort bookings
      let filteredBookings = bookings.filter(booking => {
        if (filterStatus === 'all') return true;
        return booking.status === filterStatus;
      });

      // Sort bookings by date (newest first)
      filteredBookings.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
      
      setBookings(filteredBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError(error.message || 'Unable to fetch bookings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to filter bookings by status
  const getFilteredBookings = () => {
    if (filterStatus === 'all') return bookings;
    return bookings.filter(booking => booking.status === filterStatus);
  };

  // Map backend booking object to modal/card structure
  const mapBookingForModal = (booking) => ({
    status: booking.status,
    referenceNumber: booking.reference_number || booking.referenceNumber,
    petName: booking.pet_name,
    petType: booking.pet_type,
    breed: booking.breed,
    petAge: booking.age, // legacy, remove soon
    dateOfBirth: booking.dateOfBirth || booking.date_of_birth || booking.pet_dob || '',
    petSex: booking.sex,
    weight_category: booking.weight_category || booking.weightCategory || booking.selectedSize,
    weightCategory: booking.weight_category || booking.weightCategory || booking.selectedSize,
    ownerName: booking.ownerName || `${booking.owner_first_name || booking.first_name || ''} ${booking.owner_last_name || booking.last_name || ''}`.trim(),
    ownerEmail: booking.ownerEmail || booking.owner_email || booking.email,
    ownerAddress: booking.ownerAddress || booking.address || booking.complete_address,
    ownerPhone: booking.ownerPhone || booking.phone || booking.mobile_number,
    checkIn: booking.start_date,
    checkOut: booking.end_date,
    serviceType: booking.service_type,
    selectedSize: booking.selected_size,
    selectedRoom: booking.room_type,
    additionalInfo: booking.special_requests,
    reference_number: booking.reference_number || booking.referenceNumber,
    // Add other fields as needed
  });

  // Handle booking selection
  const handleSelectBooking = (booking) => {
    setSelectedBooking(mapBookingForModal(booking));
    setShowDetails(true);
  };

  // Close booking details
  const handleCloseDetails = () => {
    setShowDetails(false);
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'danger';
      case 'completed': return 'info';
      default: return 'secondary';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return faCheck;
      case 'pending': return faClock;
      case 'cancelled': return faExclamationTriangle;
      case 'completed': return faCheck;
      default: return faInfoCircle;
    }
  };

  return (
    <div className="booking-search-container">
      <Container>
        <div className="text-center mb-4">
          <h1 className="display-4 mb-2" style={{ color: '#ff8c00' }}>
            <FontAwesomeIcon icon={faPaw} className="me-3" />
            Find Your Booking
          </h1>
          <p className="text-muted">Enter your booking reference number or email to view your reservation details</p>
        </div>
        <h2 className="text-center my-4">Find Your Booking</h2>
        
        {/* Search Form */}
        <Card className="mb-4 search-card">
          <Card.Body>
            <h5 className="mb-3">Search Bookings</h5>
            <form onSubmit={handleSearch} className="search-form">
              <div className="search-input-group mb-4">
                <label className="d-block mb-2">Search by:</label>
                <div className="search-input">
                  <Row>
                    <Col md={6}>
                      <div className="mb-3">
                        <label htmlFor="referenceNumber" className="form-label">Reference Number</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          id="referenceNumber" 
                          value={referenceNumber}
                          onChange={(e) => setReferenceNumber(e.target.value)}
                          placeholder="Enter booking reference number (e.g. #BPB6778)"
                        />
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="mb-3">
                        <label htmlFor="email" className="form-label">Email</label>
                        <input
                          type="email"
                          className="form-control"
                          id="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter the email used for booking"
                        />
                      </div>
                    </Col>
                    <Col xs={12} className="d-flex justify-content-center">
                      <Button 
                        type="submit" 
                        style={{
                          backgroundColor: '#ff8c00',
                          border: 'none',
                          padding: '0.75rem 2.5rem',
                          borderRadius: '8px',
                          fontWeight: '600',
                          boxShadow: '0 4px 8px rgba(255, 140, 0, 0.2)',
                          transition: 'all 0.3s ease'
                        }}
                        className="px-5 search-button"
                        disabled={isLoading || (!referenceNumber && !email)}
                      >
                        {isLoading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Searching...
                          </>
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faSearch} className="me-2" />
                            Search Booking
                          </>
                        )}
                      </Button>
                    </Col>
                  </Row>
                </div>
              </div>
            </form>
            {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
          </Card.Body>
        </Card>

        {/* Filter buttons - only show if there are bookings */}
        {bookings.length > 0 && (
          <div className="filter-buttons mb-4">
            <Button 
              variant={filterStatus === 'all' ? 'primary' : 'outline-primary'} 
              className="me-2 mb-2"
              onClick={() => setFilterStatus('all')}
            >
              All
            </Button>
            <Button 
              variant={filterStatus === 'pending' ? 'warning' : 'outline-warning'} 
              className="me-2 mb-2"
              onClick={() => setFilterStatus('pending')}
            >
              Pending
            </Button>
            <Button 
              variant={filterStatus === 'confirmed' ? 'success' : 'outline-success'} 
              className="me-2 mb-2"
              onClick={() => setFilterStatus('confirmed')}
            >
              Confirmed
            </Button>
            <Button 
              variant={filterStatus === 'completed' ? 'info' : 'outline-info'} 
              className="me-2 mb-2"
              onClick={() => setFilterStatus('completed')}
            >
              Completed
            </Button>
            <Button 
              variant={filterStatus === 'cancelled' ? 'danger' : 'outline-danger'} 
              className="mb-2"
              onClick={() => setFilterStatus('cancelled')}
            >
              Cancelled
            </Button>
          </div>
        )}

        {/* Search Results */}
        {searchSubmitted && (
          <>
            {/* Loading state */}
            {isLoading && (
              <div className="text-center my-5">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            )}

            {/* Bookings list */}
            {!isLoading && getFilteredBookings().length > 0 ? (
              <div className="bookings-list">
                {getFilteredBookings().map((booking, idx) => {
  const mapped = mapBookingForModal(booking);
  return (
    <Card 
      key={booking.booking_id || booking.id || idx} 
      className={`booking-card mb-3 status-${booking.status}`} 
      
    >
      <Card.Body className="p-4">
        <Row className="align-items-center g-3">
          <Col xs="auto">
            <div className="pet-avatar">
              <FontAwesomeIcon icon={faPaw} size="2x" />
            </div>
          </Col>
          <Col md={7}>
            <h5 className="booking-pet-name">{mapped.petName || 'Pet'}</h5>
            <div className="booking-details">
              <p className="mb-1">
                <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                {formatDateForDisplay(mapped.checkIn)} - {formatDateForDisplay(mapped.checkOut)}
              </p>
              <p className="mb-1">
                <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                {mapped.serviceType === 'grooming' ? 'Grooming Service' : `${mapped.selectedRoom || 'Room'}`}
              </p>
              <p className="mb-0">
                <strong>Reference:</strong> {mapped.referenceNumber || mapped.reference_number}
              </p>
            </div>
          </Col>
          <Col md={3} className="d-flex flex-column align-items-end justify-content-between">
            <Badge 
              bg={getStatusBadgeColor(mapped.status)} 
              className="status-badge mb-2"
            >
              <FontAwesomeIcon icon={getStatusIcon(mapped.status)} className="me-1" />
              {mapped.status && mapped.status.charAt(0).toUpperCase() + mapped.status.slice(1)}
            </Badge>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
})}
              </div>
            ) : (
              !isLoading && (
                <Alert variant="info">
                  {bookings.length === 0 ? 
                    'No bookings found. Please check your search details and try again.' : 
                    `No ${filterStatus} bookings found.`}
                </Alert>
              )
            )}
          </>
        )}

        {/* Booking Details Modal */}
        {false && selectedBooking && (
  <div className="modal-overlay" onClick={handleCloseDetails}>
    <div className="modal-content" onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <h2>Booking Details</h2>
        <button className="close-button" onClick={handleCloseDetails}>&times;</button>
      </div>

      <div className="modal-body">
        <div className="status-section">
          <span className={`status-badge status-${selectedBooking.status}`}>
            <FontAwesomeIcon icon={getStatusIcon(selectedBooking.status)} className="me-1" />
            {selectedBooking.status && selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
          </span>
        </div>

        <div className="details-section">
          <div className="detail-group">
            <h3>Reference Number</h3>
            <div className="reference-number">
              {selectedBooking.referenceNumber || selectedBooking.reference_number}
            </div>
          </div>

          <div className="detail-group">
            <h3>Pet Information</h3>
            <div className="detail-row">
              <span className="label">Name:</span>
              <span className="value">{selectedBooking.petName || '-'}</span>
            </div>
            <div className="detail-row">
              <span className="label">Type:</span>
              <span className="value">{selectedBooking.petType || '-'}</span>
            </div>
            <div className="detail-row">
              <span className="label">Breed:</span>
              <span className="value">{selectedBooking.breed || '-'}</span>
            </div>
            <div className="detail-row">
              <span className="label">Date of Birth:</span>
              <span className="value">{selectedBooking.dateOfBirth ? formatDateForDisplay(selectedBooking.dateOfBirth) : 'Not specified'}</span>
            </div>
            <div className="detail-row">
              <span className="label">Sex:</span>
              <span className="value">{selectedBooking.petSex || selectedBooking.sex || 'Not specified'}</span>
            </div>
          </div>

          <div className="detail-group">
            <h3>Owner Information</h3>
            <div className="detail-row">
              <span className="label">Name:</span>
              <span className="value">{selectedBooking.ownerName || 'Not provided'}</span>
            </div>
            <div className="detail-row">
              <span className="label">Phone:</span>
              <span className="value">{selectedBooking.ownerPhone || 'Not provided'}</span>
            </div>
            <div className="detail-row">
              <span className="label">Email:</span>
              <span className="value">{selectedBooking.ownerEmail || 'Not provided'}</span>
            </div>
            <div className="detail-row">
              <span className="label">Address:</span>
              <span className="value">{selectedBooking.ownerAddress || 'Not provided'}</span>
            </div>
          </div>

          <div className="detail-group">
            <h3>Booking Information</h3>
            <div className="detail-row">
              <span className="label">Check-in:</span>
              <span className="value">{formatDateForDisplay(selectedBooking.checkIn)}</span>
            </div>
            <div className="detail-row">
              <span className="label">Check-out:</span>
              <span className="value">{formatDateForDisplay(selectedBooking.checkOut)}</span>
            </div>
            <div className="detail-row">
              <span className="label">Service Type:</span>
              <span className="value">
                {selectedBooking.serviceType === 'grooming' ? 'Grooming' :
                  selectedBooking.serviceType === 'daycare' ? 'Pet Day Care' :
                  'Overnight Stay'}
              </span>
            </div>
            {(selectedBooking.selectedSize || selectedBooking.weight_category || selectedBooking.weightCategory) && (
              <div className="detail-row">
                <span className="label">Weight Category:</span>
                <span className="value">{(() => {
                  const category = selectedBooking.weight_category || selectedBooking.weightCategory || selectedBooking.selectedSize;
                  return category.charAt(0).toUpperCase() + category.slice(1);
                })()}</span>
              </div>
            )}
            {selectedBooking.selectedRoom && (
              <div className="detail-row">
                <span className="label">Room Type:</span>
                <span className="value">{selectedBooking.selectedRoom.charAt(0).toUpperCase() + selectedBooking.selectedRoom.slice(1)}</span>
              </div>
            )}
          </div>

          {selectedBooking.additionalInfo && (
            <div className="detail-group">
              <h3>Additional Information</h3>
              <p className="notes">{selectedBooking.additionalInfo}</p>
            </div>
          )}

          {/* Placeholder for confirm booking button */}
          {selectedBooking.status === 'pending' && (
            <div className="detail-group pending-notice">
              <h3><FontAwesomeIcon icon={faClock} className="me-2" />Pending Confirmation</h3>
              <p>Our staff will contact you via phone to confirm your booking details. Please ensure your contact information is correct. Once confirmed, we will update your booking status.</p>
              <p className="text-muted">Note: Bookings can only be modified by our staff. Please contact us for any changes.</p>
              {/* <Button variant="success">Confirm Booking</Button> */}
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
)}
      </Container>
    </div>
  );
};

export default BookingSearch;