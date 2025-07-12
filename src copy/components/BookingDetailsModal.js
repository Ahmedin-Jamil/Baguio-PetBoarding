import React from 'react';
import { Modal, Button, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCalendarAlt, faClock, faPaw, faUser, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { parseLocalDate } from '../utils/dateUtils';
import './BookingDetailsModal.css';

function BookingDetailsModal({ booking, onClose, onHide }) {
    // Prefer onClose if provided, else fall back to onHide (for compatibility with react-bootstrap's Modal)
    const handleClose = onClose || onHide || (() => {});
    if (!booking) return null;
    
    // Helper functions for data formatting and normalization
    const formatDate = (date) => {
        if (!date) return 'Not specified';
        try {
            return parseLocalDate(date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch (error) {
            console.error('Date parsing error:', error);
            return 'Invalid date';
        }
    };
    
    const formatTime = (time) => {
        if (!time) return 'Not specified';

        // If already in 12-hour format with AM/PM, just return
        if (/\b(AM|PM)$/i.test(time)) {
            return time;
        }

        // If in HH:MM:SS or HH:MM (24-hour) format, convert to 12-hour
        const match = time.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
        if (match) {
            let [, hrs, mins] = match;
            let hours = parseInt(hrs, 10);
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12 || 12; // Convert 0 -> 12
            return `${hours}:${mins} ${ampm}`;
        }

        // Otherwise return as-is
        return time;
    };
    
    const getStatusBadgeClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'confirmed': return 'success';
            case 'pending': return 'warning';
            case 'cancelled': return 'danger';
            case 'completed': return 'info';
            case 'no-show': return 'dark';
            default: return 'secondary';
        }
    };
    
    
    
    // Get normalized values with fallbacks
    const bookingStatus = booking.status || 'pending';
    const referenceNumber = booking.referenceNumber || booking.reference_number || `BPB${booking.id || ''}`;
    
    // Determine service type from is_daycare flag or service_id
    const isDaycare = (booking.is_daycare === 1 || booking.is_daycare === true || booking.is_daycare === '1' || booking.is_daycare === 'true');
    const serviceType = isDaycare ? 'daycare' : (booking.serviceType || 'overnight');
    
    console.log('Service type detection:', { isDaycare, serviceType, is_daycare: booking.is_daycare });
   
    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h2>Booking Details</h2>
                    </div>
                    <button className="close-button" onClick={handleClose}>&times;</button>
                </div>

                <div className="modal-body">
                    <div className="status-section">
                        <Badge bg={getStatusBadgeClass(bookingStatus)} className="status-badge">
                            {bookingStatus.charAt(0).toUpperCase() + bookingStatus.slice(1)}
                        </Badge>

                    </div>

                    <div className="details-section">
                        <div className="detail-group">
                            <h3><FontAwesomeIcon icon={faPaw} className="section-icon" /> Pet Information</h3>
                            {booking.petDetails && booking.petDetails.length > 0 ? booking.petDetails.map((pet, index) => (
                                <div key={index} className="pet-details-section">
                                    <h4>Pet {index + 1}</h4>
                                    <div className="detail-row">
                                        <span className="label">Name:</span>
                                        <span className="value">{pet.name}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">Type:</span>
                                        <span className="value">{(() => {
                                            // Normalize pet type to ensure cats are displayed correctly
                                            const petType = pet.type || pet.pet_type || 'Dog';
                                            if (petType.toLowerCase().includes('cat')) return 'Cat';
                                            if (petType.toLowerCase().includes('dog')) return 'Dog';
                                            return petType; // Return as-is if not clearly cat or dog
                                        })()}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">Breed:</span>
                                        <span className="value">{pet.breed || 'Not specified'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">Gender:</span>
                                        <span className="value">{(() => {
                                            const genderVal = pet.gender || pet.sex;
                                            return genderVal ? genderVal : 'Not specified';
                                        })()}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">Weight Category:</span>
                                        <span className="value">{(() => {
                                            const weightVal = pet.weightCategory || pet.weight_category;
                                            return weightVal ? weightVal : 'Not specified';
                                        })()}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">Date of Birth / Age:</span>
                                        <span className="value">{(() => {
                                            const dobRaw = pet.dateOfBirth || pet.date_of_birth || booking.dateOfBirth || booking.date_of_birth;
                                            const ageVal = pet.age || pet.pet_age;
                                            if (!dobRaw) {
                                                return ageVal ? `${ageVal} yrs` : 'Not specified';
                                            }
                                            try {
                                                return parseLocalDate(dobRaw).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                                            } catch (err) {
                                                // Fallback: show raw value if parsing fails
                                                return dobRaw;
                                            }
                                        })()}</span>
                                    </div>
                                </div>
                            )) : (
                                <div className="pet-details-section">
                                    <div className="detail-row">
                                        <span className="label">Name:</span>
                                        <span className="value">{booking.petName || 'Not provided'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">Type:</span>
                                        <span className="value">{(() => {
                                            // Normalize pet type to ensure cats are displayed correctly
                                            const petType = booking.petType || booking.pet_type || booking.pet?.pet_type || 'Not provided';
                                            if (petType.toLowerCase().includes('cat')) return 'Cat';
                                            if (petType.toLowerCase().includes('dog')) return 'Dog';
                                            return petType; // Return as-is if not clearly cat or dog
                                        })()}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">Breed:</span>
                                        <span className="value">{booking.petBreed || booking.breed || 'Not specified'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">Gender:</span>
                                        <span className="value">{booking.gender || booking.petGender || booking.sex || 'Not specified'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">Date of Birth / Age:</span>
                                        <span className="value">{(() => {
                                             const dob = booking.dateOfBirth || booking.date_of_birth || booking.petDateOfBirth || booking.pet_date_of_birth;
                                             const ageVal = booking.age || booking.petAge || booking.pet_age;
                                             if (!dob) {
                                                 return ageVal ? `${ageVal} yrs` : 'Not specified';
                                             }
                                             try {
                                                 return parseLocalDate(dob).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                                             } catch (error) {
                                                 // Fallback: show raw value if parsing fails
                                                 return dob;
                                             }
                                         })()}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="detail-group">
                            <h3><FontAwesomeIcon icon={faUser} className="section-icon" /> Owner Information</h3>
                            <div className="detail-row">
                                <span className="label">Name:</span>
                                <span className="value">{(() => {
                                        // Direct full name fields from backend
                                        if (booking.owner || booking.ownerName || booking.owner_name) {
                                            return booking.owner || booking.ownerName || booking.owner_name;
                                        }
                                        // Construct from first / last name variants
                                        const first = booking.customer_first_name || booking.customerFirstName || booking.first_name || booking.firstName || booking.owner_first_name || '';
                                        const last  = booking.customer_last_name  || booking.customerLastName  || booking.last_name  || booking.lastName  || booking.owner_last_name  || '';
                                        const full = `${first} ${last}`.trim();
                                        return full || 'Not provided';
                                    })()}</span>
                            </div>
                            <div className="detail-row">
                                <span className="label">Phone:</span>
                                <span className="value">{booking.contactNumber || booking.ownerPhone || booking.owner_phone || booking.customerPhone || booking.customer_phone || booking.phone || 'Not provided'}</span>
                            </div>
                            <div className="detail-row">
                                <span className="label">Email:</span>
                                <span className="value">{booking.ownerEmail || booking.owner_email || booking.customerEmail || booking.customer_email || booking.email || 'Not provided'}</span>
                            </div>
                            <div className="detail-row">
                                <span className="label">Address:</span>
                                <span className="value">{booking.ownerAddress || booking.owner_address || booking.customerAddress || booking.customer_address || booking.address || 'Not provided'}</span>
                            </div>
                        </div>

                        <div className="detail-group">
                            <h3><FontAwesomeIcon icon={faCalendarAlt} className="section-icon" /> Booking Information</h3>
                            
                            <div className="detail-row">
                                <span className="label">Reference Number:</span>
                                <span className="value">{referenceNumber || 'Not assigned yet'}</span>
                            </div>

                            <div className="detail-row">
                                <span className="label">Check-in:</span>
                                <span className="value">{formatDate(booking.checkIn || booking.startDate || booking.start_date)}</span>
                            </div>
                            {(booking.startTime || booking.start_time) && (
                                <div className="detail-row">
                                    <span className="label">Check-in Time:</span>
                                    <span className="value">{formatTime(booking.startTime || booking.start_time)}</span>
                                </div>
                            )}
                            <div className="detail-row">
                                <span className="label">Check-out:</span>
                                <span className="value">{formatDate(booking.checkOut || booking.endDate || booking.end_date)}</span>
                            </div>
                            {(booking.endTime || booking.end_time) && (
                                <div className="detail-row">
                                    <span className="label">Check-out Time:</span>
                                    <span className="value">{formatTime(booking.endTime || booking.end_time)}</span>
                                </div>
                            )}
                            {booking.createdAt && (
                                <div className="detail-row">
                                    <span className="label">Booking Date:</span>
                                    <span className="value">{formatDate(booking.createdAt || booking.created_at)}</span>
                                </div>
                            )}
                            <div className="detail-row">
                                <span className="label">Service Type:</span>
                                <span className="value">
                                    {(() => {
                                        // Use the isDaycare flag we calculated earlier instead of checking serviceType directly
                                        if (isDaycare) {
                                            return 'Pet Daycare';
                                         } else if (booking.serviceType === 'grooming') {
                                             // For grooming, prefer explicit package/service name fields returned from backend/context
                                             const groomingName = booking.selectedServiceType || booking.service_name || booking.serviceName || (booking.petDetails && booking.petDetails[0] && booking.petDetails[0].serviceType);
                                             return groomingName ? groomingName : 'Grooming';
                                        } else {
                                            return 'Overnight Stay';
                                        }
                                    })()}
                                </span>
                            </div>
                            {/* Room Type - Show only for overnight stays */}
                            {serviceType === 'overnight' && (
                                <div className="detail-row">
                                    <span className="label">Room Type:</span>
                                    <span className="value">
                                        {(() => {
    // Prefer backend value if present (snake_case, camelCase, fallback)
    const roomTypeRaw = booking.roomType || booking.room_type || booking.selectedRoom || (booking.petDetails && booking.petDetails[0] && (booking.petDetails[0].roomType || booking.petDetails[0].room_type));
    
    // Debug logging for room type values
    console.log('Room type detection:', {
        roomType: booking.roomType,
        room_type: booking.room_type,
        selectedRoom: booking.selectedRoom,
        petDetailsRoomType: booking.petDetails && booking.petDetails[0] ? booking.petDetails[0].roomType : null,
        petDetailsRoom_type: booking.petDetails && booking.petDetails[0] ? booking.petDetails[0].room_type : null,
        finalRoomTypeRaw: roomTypeRaw
    });
    
    if (!roomTypeRaw) return 'Not specified';
    
    const normalized = roomTypeRaw.toString().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).trim();
    console.log('Normalized room type:', normalized);
    
    if (/deluxe/i.test(normalized)) return 'Deluxe Room';
    if (/premium/i.test(normalized)) return 'Premium Room';
    if (/executive/i.test(normalized)) return 'Executive Room';
    return normalized;
})()}
                                    </span>
                                </div>
                            )}
                        </div>

                        {(booking.notes || booking.specialRequests || booking.special_requests || booking.adminNotes || booking.admin_notes) && (
                            <div className="detail-group">
                                <h3><FontAwesomeIcon icon={faInfoCircle} className="section-icon" /> Special Instructions</h3>
                                {booking.notes && <p className="notes">{booking.notes}</p>}
                                {(booking.specialRequests || booking.special_requests) && 
                                    <div>
                                        <h5>Special Requests:</h5>
                                        <p className="notes">{booking.specialRequests || booking.special_requests}</p>
                                    </div>
                                }
                                {(booking.adminNotes || booking.admin_notes) && 
                                    <div>
                                        <h5>Admin Notes:</h5>
                                        <p className="notes admin-notes">{booking.adminNotes || booking.admin_notes}</p>
                                    </div>
                                }
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default BookingDetailsModal;