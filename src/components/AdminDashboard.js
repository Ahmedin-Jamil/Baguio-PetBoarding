import React, { useState, useEffect, useRef, useCallback, createContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBookings } from '../context/BookingContext';
import { useRoomAvailability } from '../context/RoomAvailabilityContext';
import { parseLocalDate, formatDateForDisplay, formatDateForMySQL } from '../utils/dateUtils';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import BookingDetailsModal from './BookingDetailsModal';

import 'react-datepicker/dist/react-datepicker.css';
import DatePicker from 'react-datepicker';
import { Modal, Button, Form, Tabs, Tab, Dropdown, Alert, Row, Col, Container, Table, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faCheck, faCircleCheck, faTimes, faTrash, faEye, faFilter, faInfo, faCheckCircle, faPaw, faUser, faClipboard } from '@fortawesome/free-solid-svg-icons';
import ReactCalendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './AdminDashboard.css';
import { API_URL } from '../config.js';
import axios from 'axios';


// ConfirmationDialog Component
const ConfirmationDialog = ({ show, onHide, onConfirm, title, message }) => {
    return (
        <Modal show={show} onHide={onHide} centered className="confirmation-dialog">
            <Modal.Header closeButton>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>{message}</p>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>Cancel</Button>
                <Button variant="primary" onClick={onConfirm}>Confirm</Button>
            </Modal.Footer>
        </Modal>
    );
};

// Initial data for fallback
const initialBookingsData = [
    {
        id: 1,
        petName: "Max",
        petType: "Dog",
        breed: "Golden Retriever",
        owner: "John Smith",
        contactNumber: "555-1234",
        checkIn: new Date(2025, 3, 29),
        checkOut: new Date(2025, 4, 3),
        status: "confirmed",
        notes: "Allergic to chicken. Needs medication twice daily."
    },
    {
        id: 2,
        petName: "Bella",
        petType: "Cat",
        breed: "Siamese",
        owner: "Emily Johnson",
        contactNumber: "555-5678",
        checkIn: new Date(2025, 3, 27),
        checkOut: new Date(2025, 3, 30),
        status: "completed",
        notes: "Prefers wet food. Very shy around other animals."
    },
    {
        id: 3,
        petName: "Charlie",
        petType: "Dog",
        breed: "Beagle",
        owner: "Michael Williams",
        contactNumber: "555-9012",
        checkIn: new Date(2025, 4, 5),
        checkOut: new Date(2025, 4, 10),
        status: "pending",
        notes: "Energetic. Needs regular walks."
    },
    {
        id: 4,
        petName: "Luna",
        petType: "Cat",        breed: "Maine Coon",
        owner: "Sophia Brown",
        contactNumber: "555-3456",
        checkIn: new Date(2025, 4, 1),
        checkOut: new Date(2025, 4, 7),
        status: "confirmed",
        notes: "Requires special diet food. Bring own litter."
    },
    {
        id: 5,
        petName: "Cooper",
        petType: "Dog",
        breed: "Labrador",
        owner: "David Jones",
        contactNumber: "555-7890",
        checkIn: new Date(2025, 4, 2),
        checkOut: new Date(2025, 4, 8),
        status: "cancelled",
        notes: "Friendly with other dogs. Afraid of thunderstorms."
    },
    {
        id: 6,
        petName: "Coco",
        petType: "Rabbit",
        breed: "Netherland Dwarf",
        owner: "Emma Wilson",
        contactNumber: "555-2345",
        checkIn: new Date(2025, 3, 30),
        checkOut: new Date(2025, 4, 5),
        status: "confirmed",
        notes: "Needs fresh vegetables daily."
    },
    {
        id: 7,
        petName: "Rocky",
        petType: "Dog",
        breed: "German Shepherd",
        owner: "James Miller",
        contactNumber: "555-6789",
        checkIn: new Date(2025, 4, 4),
        checkOut: new Date(2025, 4, 9),
        status: "pending",
        notes: "Training in progress. Follows specific commands."
    },
    {
        id: 8,
        petName: "Milo",
        petType: "Cat",
        breed: "Persian",
        owner: "Olivia Davis",
        contactNumber: "555-0123",
        checkIn: new Date(2025, 3, 28),
        checkOut: new Date(2025, 4, 2),
        status: "completed",
        notes: "Requires daily grooming. Medication for skin condition."
    }
];

// Calendar Component
function CalendarView({ 
    currentDate, 
    selectedDate, 
    onDateSelect, 
    onChangeMonth, 
    hasBookings, 
    countBookings,
    formatDate,
    onToggleUnavailableDate,
    isDateUnavailable
}) {
    // Generate days for the calendar
    const generateCalendarDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        // First day of the month - create at noon to avoid timezone issues
        const firstDay = new Date(year, month, 1, 12, 0, 0, 0);
        // Last day of the month
        const lastDay = new Date(year, month + 1, 0, 12, 0, 0, 0);
        
        // Day of the week for the first day (0 = Sunday, 6 = Saturday)
        const firstDayOfWeek = firstDay.getDay();
        
        // Array to hold all calendar days
        const calendarDays = [];
        
        // Add days from previous month
        const daysFromPrevMonth = firstDayOfWeek;
        for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
            const prevMonthDay = new Date(year, month, -i, 12, 0, 0, 0);
            calendarDays.push({
                date: prevMonthDay,
                isCurrentMonth: false
            });
        }
        
        // Add days from current month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const currentDay = new Date(year, month, day, 12, 0, 0, 0);
            calendarDays.push({
                date: currentDay,
                isCurrentMonth: true
            });
        }
        
        // Add days from next month to complete the grid
        const totalDaysToShow = 42; // 6 rows x 7 days
        const daysFromNextMonth = totalDaysToShow - calendarDays.length;
        for (let day = 1; day <= daysFromNextMonth; day++) {
            const nextMonthDay = new Date(year, month + 1, day, 12, 0, 0, 0);
            calendarDays.push({
                date: nextMonthDay,
                isCurrentMonth: false
            });
        }
        
        return calendarDays;
    };
    
    const calendarDays = generateCalendarDays();
    // Create today's date at noon to avoid timezone issues
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    
    const isToday = (date) => {
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    };
    
    const isSelected = (date) => {
        return date.getDate() === selectedDate.getDate() &&
               date.getMonth() === selectedDate.getMonth() &&
               date.getFullYear() === selectedDate.getFullYear();
    };
    
    // Check if a date is unavailable
    const isUnavailable = (date) => {
        return isDateUnavailable(date);
    };
    
    return (
        <div className="calendar">
            <div className="calendar-header">
                <h2>{formatDate(currentDate)}</h2>
                <div className="calendar-nav">
                    <button onClick={() => onChangeMonth(-1)}>←</button>
                    <button onClick={() => onChangeMonth(1)}>→</button>
                </div>
            </div>
            
            <div className="calendar-day-names">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName, index) => (
                    <div key={index} className="day-name">{dayName}</div>
                ))}
            </div>
            
            <div className="calendar-grid">
                {calendarDays.map((day, index) => {
                    const dayClasses = [
                        'calendar-day',
                        day.isCurrentMonth ? '' : 'other-month',
                        isToday(day.date) ? 'today' : '',
                        isSelected(day.date) ? 'selected' : '',
                        hasBookings(day.date) ? 'has-bookings' : '',
                        isUnavailable(day.date) ? 'unavailable' : ''
                    ].filter(Boolean).join(' ');
                    
                    // Inside the Calendar component's return statement, update the day rendering
                    return (
                      <div 
                        key={index} 
                        className={dayClasses}
                        onClick={() => onDateSelect(day.date)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          onToggleUnavailableDate(day.date);
                        }}
                      >
                        <div>
                          {day.date.getDate()}
                          {hasBookings(day.date) && (
                            <div className="booking-indicator">
                              <span className="booking-count">{countBookings(day.date)}</span>
                              {countBookings(day.date) >= 50 && (
                                <span className="capacity-warning" title="At maximum capacity">Full</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                })}
            </div>
        </div>
    );
}

// Create a context to share the selected booking between components
const BookingContext = createContext({
    selectedBooking: null,
    setSelectedBooking: () => {}
});

// BookingsList Component
function BookingsList({ bookings, formatDateRange, selectedDate, onStatusChange, showHistoryFilter, fetchBookings }) {
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedBooking, setSelectedBookingLocal] = useState(null);
    const { setSelectedBooking } = React.useContext(BookingContext);
    
    const handleViewDetails = (booking) => {
        setSelectedBookingLocal(booking);
        setSelectedBooking(booking); // Update the context
        setShowDetailModal(true);
    };
    
    const handleCloseModal = () => {
        setShowDetailModal(false);
    };
    return (
        <div className="bookings-list-container">
            {bookings.length === 0 ? (
                <div className="no-bookings-message">
                    <p>No bookings found{selectedDate ? ` for ${selectedDate.toDateString()}` : ''}.</p>
                </div>
            ) : (
                <div className="bookings-list">
                    {bookings.map(booking => (
                        <BookingItem
                            key={booking.id || booking.booking_id}
                            booking={booking}
                            formatDateRange={formatDateRange}
                            onStatusChange={onStatusChange}
                            onViewDetails={handleViewDetails}
                            fetchBookings={fetchBookings}
                        />
                    ))}
                </div>
            )}
            
            {/* Detail Modal */}
            {showDetailModal && (
                <BookingDetailsModal 
                    show={showDetailModal}
                    onHide={handleCloseModal}
                    booking={selectedBooking}
                />
            )}
        </div>
    );
}



// BookingItem Component for displaying booking information in the list
const BookingItem = React.memo(({ booking, formatDateRange, onStatusChange, onViewDetails, fetchBookings }) => {
    const { updateRoomAvailability } = useRoomAvailability();
    const [showExtensionModal, setShowExtensionModal] = useState(false);
    const [extensionDate, setExtensionDate] = useState(null);
    const [extensionError, setExtensionError] = useState('');
    
    const statusClass = `booking-status status-${booking.status || 'unknown'}`;
    const statusText = booking.status && typeof booking.status === 'string' ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1) : 'Unknown';
    
    const petInitial = booking.petName && typeof booking.petName === 'string' ? booking.petName.charAt(0).toUpperCase() : '?';

        
    
    
    // Format service type for display
    const getServiceTypeDisplay = () => {
        // Check for daycare using multiple indicators (is_daycare flag, service_id=2, or serviceType=daycare)
        if (booking.is_daycare === 1 || booking.is_daycare === true || booking.service_id === 4 || booking.serviceId === 4 || booking.serviceType === 'daycare') {
            console.log('Detected daycare booking:', booking.id, { is_daycare: booking.is_daycare, serviceId: booking.serviceId, service_id: booking.service_id });
            return 'Pet Day Care';
        } else if (booking.serviceType === 'grooming') {
            return 'Grooming';
        } else {
            return 'Overnight Stay';
        }
    };
    
    // Get service type badge class
    const isDaycareBooking = booking.is_daycare === 1 || booking.is_daycare === true || booking.service_id === 4 || booking.serviceId === 4 || booking.serviceType === 'daycare';
    const serviceTypeBadgeClass = booking.serviceType === 'grooming' ? 'service-grooming' : 
                                 isDaycareBooking ? 'service-daycare' : 'service-overnight';
    
    // Handle status change with confirmation
    const handleStatusChange = (newStatus, event) => {
        // Prevent the click from toggling the expanded state
        event.stopPropagation();
        
        // Update room availability based on status change
        if (booking.serviceType === 'overnight' && booking.selectedRoom) {
            if (newStatus === 'cancelled' || newStatus === 'completed') {
                updateRoomAvailability(booking.selectedRoom, 1, newStatus);
            }
        }
        
        onStatusChange(booking.id, newStatus);
    };
    
    // Handle view details button click
    const handleViewDetails = (e) => {
        e.stopPropagation();
        onViewDetails(booking);
    };
    
    // Handle saving the booking extension
    const handleExtensionSave = async () => {
        if (!extensionDate) {
            setExtensionError('Please select a new end date');
            return;
        }
        
        // Ensure we're using the exact date selected (without timezone issues)
        // Create a new date with year, month, day components to avoid timezone shifts
        const year = extensionDate.getFullYear();
        const month = extensionDate.getMonth();
        const day = extensionDate.getDate();
        const exactDate = new Date(year, month, day);
        
        // Format date as YYYY-MM-DD for the API
        const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        try {
            const response = await fetch(`${API_URL}/api/bookings/${booking.id || booking.booking_id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ end_date: formattedDate }),
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to extend booking');
            }
            
            // Update the booking end date locally for immediate UI update
            if (booking.checkOut) booking.checkOut = exactDate;
            if (booking.endDate) booking.endDate = formattedDate;
            if (booking.end_date) booking.end_date = formattedDate;
            
            // Log the successful extension for debugging
            console.log(`Booking extended to: ${formattedDate} (${exactDate.toDateString()})`);
            console.log(`Original date selected: ${extensionDate.toDateString()}`);
            
            // Close modal and reset state
            setShowExtensionModal(false);
            setExtensionDate(null);
            setExtensionError('');
            
            // Show success message
            alert('Booking end date changed successfully!');
            
            // Refresh bookings list to update all data
            if (fetchBookings) {
                fetchBookings();
            }
        } catch (error) {
            console.error('Error changing booking end date:', error);
            setExtensionError(error.message || 'Failed to change booking end date');
        }
    };
    
    return (
        <div className="booking-item">
            <div className="booking-card">
                <div className="booking-item-header">
                    <div className="booking-item-title">
                        <div className="pet-avatar">{petInitial}</div>
                        <div className="booking-name">
                            <h5>{booking.petName}</h5>
                            <span className="booking-date">{formatDateRange(booking)}</span>
                        </div>
                    </div>
                    <div className="booking-status">
                        <Badge bg={isDaycareBooking ? 'info' : 'primary'} className="service-badge">
                            {getServiceTypeDisplay()}
                        </Badge>
                        <span className={statusClass}>{statusText}</span>
                    </div>
                </div>
                
                <div className="booking-dates">
                    {formatDateRange(booking.checkIn || booking.startDate, booking.checkOut || booking.endDate || booking.startDate)}
                </div>
                
                <div className="booking-summary">
                    <div className="summary-item">
                        <span className="summary-label">Pet:</span>
                        <span className="summary-value">
                            {booking.petType} - {booking.breed} 
                            
                        </span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Contact:</span>
                        <span className="summary-value">{booking.contactNumber || booking.ownerPhone}</span>
                    </div>
                    
                </div>
                
                <div className="booking-actions">
                    <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="action-btn"
                        onClick={handleViewDetails}
                    >
                        <FontAwesomeIcon icon={faEye} className="me-1" /> View
                    </Button>
                    {/* Extension Button - Only shown for overnight service type */}
                    {booking.serviceType === 'overnight' && (
                        <Button
                            variant="outline-warning"
                            size="sm"
                            className="action-btn ms-1"
                            onClick={() => setShowExtensionModal(true)}
                        >
                            <FontAwesomeIcon icon={faCalendarAlt} className="me-1" /> Extension
                        </Button>
                    )}
                    {/* Extension Modal */}
                    <Modal 
                        show={showExtensionModal} 
                        onHide={() => setShowExtensionModal(false)} 
                        centered
                        size="lg" // Increase modal size
                        dialogClassName="extension-modal"
                    >
                        <Modal.Header closeButton>
                            <Modal.Title>Extend Booking</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <div className="mb-4">
                                <h5 className="text-secondary mb-3">Current Booking Period:</h5>
                                <p className="fs-5">
                                    <strong>From:</strong> {formatDateForDisplay(new Date(booking.checkIn || booking.startDate))}<br/>
                                    <strong>To:</strong> {formatDateForDisplay(new Date(booking.checkOut || booking.endDate))}
                                </p>
                            </div>
                            <Form>
                                <Form.Group controlId="formNewEndDate">
                                    <Form.Label className="fw-bold fs-5 mb-3">
                                        Select New End Date
                                        <span className="text-secondary ms-2">(Last day of stay)</span>
                                    </Form.Label>
                                    <div className="date-picker-container">
                                        <DatePicker
                                            selected={extensionDate}
                                            onChange={date => setExtensionDate(date)}
                                            dateFormat="MM/dd/yyyy"
                                            minDate={new Date(booking.checkOut || booking.endDate || booking.startDate)}
                                            className="form-control form-control-lg"
                                            wrapperClassName="w-100"
                                            placeholderText="mm/dd/yyyy"
                                            showMonthDropdown
                                            showYearDropdown
                                            dropdownMode="select"
                                            todayButton="Today"
                                            isClearable
                                        />
                                    </div>
                                    <div className="text-info mt-3">
                                        <FontAwesomeIcon icon={faInfo} className="me-2" />
                                        Select the exact date you want as the new last day of the pet's stay.
                                    </div>
                                </Form.Group>
                            </Form>
                            {extensionError && <Alert variant="danger" className="mt-3 p-3 fs-5">{extensionError}</Alert>}
                        </Modal.Body>
                        <Modal.Footer>
                            <Button 
                                variant="secondary" 
                                onClick={() => setShowExtensionModal(false)}
                                size="lg"
                                className="px-4"
                            >
                                Cancel
                            </Button>
                            <Button 
                                variant="primary" 
                                onClick={handleExtensionSave} 
                                disabled={!extensionDate}
                                size="lg"
                                className="px-4"
                            >
                                Save
                            </Button>
                        </Modal.Footer>
                    </Modal>
                    
                    {booking.status === 'pending' && (
                        <Button 
                            variant="outline-success" 
                            size="sm" 
                            className="action-btn"
                            onClick={(e) => handleStatusChange('confirmed', e)}
                        >
                            <FontAwesomeIcon icon={faCheck} className="me-1" /> Confirm
                        </Button>
                    )}
                    
                    {booking.status === 'confirmed' && (
                        <Button 
                            variant="outline-info" 
                            size="sm" 
                            className="action-btn"
                            onClick={(e) => handleStatusChange('completed', e)}
                        >
                            <FontAwesomeIcon icon={faCheckCircle} className="me-1" /> Complete
                        </Button>
                    )}
                    
                    {(booking.status === 'pending' || booking.status === 'confirmed') && (
                        <Button 
                            variant="outline-danger" 
                            size="sm" 
                            className="action-btn"
                            onClick={(e) => handleStatusChange('cancelled', e)}
                        >
                            <FontAwesomeIcon icon={faTimes} className="me-1" /> Cancel
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
});

// Main AdminDashboard Component
const AdminDashboard = () => {
    const [selectedBooking, setSelectedBooking] = useState(null);
    
    // Create context value for sharing selected booking
    const bookingContextValue = {
        selectedBooking,
        setSelectedBooking
    };
    const navigate = useNavigate();
    const { isAuthenticated, logout } = useAuth();
    const { 
        bookings, 
        fetchBookings, 
        updateBookingStatus, 
        addUnavailableDate, 
        removeUnavailableDate, 
        isDateUnavailable, 
        countBookingsForDate,
        isLoading
    } = useBookings();

    // Fetch bookings when component mounts
    useEffect(() => {
        if (isAuthenticated) {
            console.log('AdminDashboard: Fetching bookings...');
            fetchBookings().catch(error => {
                console.error('Error fetching bookings:', error);
            });
        } else {
            console.log('AdminDashboard: Not authenticated, skipping booking fetch');
        }
    }, [isAuthenticated, fetchBookings]);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [statusFilter, setStatusFilter] = useState('all');
    const [serviceTypeFilter, setServiceTypeFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showHistoryFilter, setShowHistoryFilter] = useState(false);
    const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
    const [confirmationAction, setConfirmationAction] = useState({ bookingId: null, newStatus: null });
    const [showUnavailableDateDialog, setShowUnavailableDateDialog] = useState(false);
    const [dateToToggle, setDateToToggle] = useState(null);
    const [isAddingUnavailableDate, setIsAddingUnavailableDate] = useState(false);
    const [services, setServices] = useState([]);
    const [pricing, setPricing] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editRows, setEditRows] = useState({});
    const [newRow, setNewRow] = useState({});
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Fetch bookings when component mounts
    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    async function fetchPricing() {
        setLoading(true);
        try {
            const { data } = await axios.get(`${API_URL}/api/services/pricing`);
            setPricing(data);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch pricing');
            setLoading(false);
        }
    }

    function handleEditChange(id, field, value) {
        setEditRows(prev => ({
            ...prev,
            [id]: { ...prev[id], [field]: value }
        }));
    }

    async function handleSave(id) {
        const row = editRows[id];
        if (!row) return;
        try {
            await axios.patch(`${API_URL}/api/services/pricing/${id}`, row);
            setSuccess('Saved!');
            setEditRows(prev => { const copy = { ...prev }; delete copy[id]; return copy; });
            fetchPricing();
        } catch (err) {
            setError('Failed to save');
        }
    }

    async function handleDelete(id) {
        if (!window.confirm('Are you sure you want to delete this service/size?')) return;
        try {
            await axios.delete(`${API_URL}/api/services/pricing/${id}`);
            setSuccess('Deleted!');
            fetchPricing();
        } catch (err) {
            setError('Failed to delete');
        }
    }

    async function handleAdd() {
        // Frontend validation for required fields
        if (!newRow.service_type || !newRow.base_price) {
            setError('Service Type and Base Price are required.');
            return;
        }
        try {
            await axios.post(`${API_URL}/api/services/pricing`, newRow);
            setSuccess('Added!');
            setError('');
            setNewRow({});
            fetchPricing();
        } catch (err) {
            if (err.response && err.response.data && err.response.data.error) {
                setError('Failed to add: ' + err.response.data.error);
            } else {
                setError('Failed to add');
            }
        }
    }

    function groupBy(arr, key) {
        return arr.reduce((acc, item) => {
            const group = item[key] || 'Other';
            acc[group] = acc[group] || [];
            acc[group].push(item);
            return acc;
        }, {});
    }
    
    // Add debugging for bookings
    console.log('AdminDashboard: Current bookings:', bookings);
    console.log('AdminDashboard: Selected date:', selectedDate);
    console.log('AdminDashboard: Status filter:', statusFilter);
    console.log('AdminDashboard: Service type filter:', serviceTypeFilter);
    
    // Filter bookings based on selected date, status, service type, search query, and history filter
    const filteredBookings = bookings.filter(booking => {
        // Add debug logging for each booking
        console.log('Processing booking:', booking);
        
        // Normalize dates by setting time to midnight
        const bookingStart = new Date(booking.checkIn || booking.startDate);
        const bookingEnd = new Date(booking.checkOut || booking.endDate || bookingStart);
        bookingStart.setHours(0, 0, 0, 0);
        bookingEnd.setHours(0, 0, 0, 0);
        
        const normalizedSelectedDate = new Date(selectedDate);
        normalizedSelectedDate.setHours(0, 0, 0, 0);
        
        console.log('Dates:', {
            bookingStart,
            bookingEnd,
            normalizedSelectedDate
        });
        
        // Date matching logic - if history filter is on, show all past bookings
        const isDateMatch = showHistoryFilter ? 
            (bookingEnd < new Date()) : // For history, show bookings that have ended
            (normalizedSelectedDate >= bookingStart && normalizedSelectedDate <= bookingEnd); // Normal date filtering
        
        console.log('Date match:', isDateMatch);
        
        // Status matching
        const isStatusMatch = statusFilter === 'all' || booking.status === statusFilter;
        console.log('Status match:', isStatusMatch, { status: booking.status, filter: statusFilter });
        
        // Service type matching - normalize service type values
        const bookingServiceType = (booking.serviceType || booking.service_type || '').toLowerCase();
        const isServiceTypeMatch = serviceTypeFilter === 'all' || bookingServiceType === serviceTypeFilter.toLowerCase();
        console.log('Service match:', isServiceTypeMatch, { 
            bookingType: bookingServiceType, 
            filter: serviceTypeFilter 
        });
        
        // Search query matching - check if owner name contains the search query (case insensitive)
        const ownerName = booking.ownerName || booking.owner_name || booking.owner || '';
        const isSearchMatch = searchQuery === '' || 
            ownerName.toLowerCase().includes(searchQuery.toLowerCase());
        console.log('Search match:', isSearchMatch, { ownerName, searchQuery });
        
        const matches = isDateMatch && isStatusMatch && isServiceTypeMatch && isSearchMatch;
        console.log('Final match result:', matches);
        
        return matches;
    });
    
    console.log('AdminDashboard: Filtered bookings:', filteredBookings);
    
    // Function to handle month navigation
    const changeMonth = (amount) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + amount);
        setCurrentDate(newDate);
    };
    
    // Check if a date has bookings
    const hasBookings = useCallback((date) => {
        if (!date || !bookings || !Array.isArray(bookings)) return false;
        return bookings.some(booking => {
            const bookingStart = new Date(booking.checkIn);
            const bookingEnd = new Date(booking.checkOut);
            
            // Normalize dates for comparison by setting time to midnight
            const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const normalizedStart = new Date(bookingStart.getFullYear(), bookingStart.getMonth(), bookingStart.getDate());
            const normalizedEnd = new Date(bookingEnd.getFullYear(), bookingEnd.getMonth(), bookingEnd.getDate());
            
            return normalizedDate >= normalizedStart && normalizedDate <= normalizedEnd;
        });
    }, [bookings]);
    
    // Count bookings for a specific date
    const countBookings = (date) => {
        // Use the countBookingsForDate from context which includes pending bookings
        return countBookingsForDate(date);
    };

    // Count only pending bookings for a specific date
    const countPendingBookings = (date) => {
        if (!date || !bookings || !Array.isArray(bookings)) return 0;
        
        // Normalize the date to ignore time
        const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        
        // Count only pending bookings that overlap with this date
        return bookings.filter(booking => {
            // Only include pending bookings
            if (booking.status !== 'pending') return false;
            
            const bookingStart = new Date(booking.checkIn);
            const bookingEnd = new Date(booking.checkOut);
            
            // Normalize booking dates for comparison
            const normalizedStart = new Date(bookingStart.getFullYear(), bookingStart.getMonth(), bookingStart.getDate());
            const normalizedEnd = new Date(bookingEnd.getFullYear(), bookingEnd.getMonth(), bookingEnd.getDate());
            
            // Check if the normalized date falls within the booking range
            return normalizedDate >= normalizedStart && normalizedDate <= normalizedEnd;
        }).length;
    };
    
    // Format date for display, preserving exact day without timezone shifts
    const formatDate = (date) => {
        if (!date) return '';
        
        // If date is already in YYYY-MM-DD format, parse it directly
        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
            // Use noon time to ensure it doesn't shift due to timezone offsets
            const [year, month, day] = date.split('-').map(Number);
            return new Date(year, month - 1, day, 12, 0, 0).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
            });
        }
        
        // If it's a Date object, ensure we're displaying the correct local date
        // This prevents any timezone-related day shifting
        if (date instanceof Date) {
            const year = date.getFullYear();
            const month = date.getMonth();
            const day = date.getDate();
            // Create a new date at noon local time to avoid date shifting
            return new Date(year, month, day, 12, 0, 0).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
            });
        }
        
        // Use the formatDateForDisplay utility which handles timezone safely
        return formatDateForDisplay(date);
    };
    
    // Format date range for bookings, preserving exact days without timezone shifts
    const formatDateRange = (start, end) => {
        if (!start) return '';
        
        // Helper function to parse date safely without timezone shifts
        const parseDate = (dateInput) => {
            if (!dateInput) return null;
            return parseLocalDate(dateInput);
        };
        
        const startDate = parseDate(start);
        if (!startDate) return '';
        
        // If there's no end date or start and end are the same date
        if (!end || start === end || 
            (startDate && parseDate(end) && 
             startDate.getDate() === parseDate(end).getDate() && 
             startDate.getMonth() === parseDate(end).getMonth() && 
             startDate.getFullYear() === parseDate(end).getFullYear())) {
            return startDate.toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
            });
        }
        
        // Format both dates
        const formattedStart = startDate.toLocaleDateString('en-US', {
            month: 'short', day: 'numeric'
        });
        
        const endDate = parseDate(end);
        const formattedEnd = endDate.toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
        
        return `${formattedStart} - ${formattedEnd}`;
    };
    
    // Show confirmation dialog before changing status
    const promptStatusChange = (bookingId, newStatus) => {
        setConfirmationAction({ bookingId, newStatus });
        setShowConfirmationDialog(true);
    };
    
    // Handle booking status changes after confirmation
    const handleStatusChange = async () => {
        try {
            const { bookingId, newStatus } = confirmationAction;
            const result = await updateBookingStatus(bookingId, newStatus);
            if (result.success) {
                // Refresh bookings after status update
                fetchBookings();
            } else {
                alert(result.message || 'Failed to update booking status');
            }
        } catch (error) {
            console.error('Error updating booking status:', error);
            alert('An error occurred while updating the booking status');
        } finally {
            setShowConfirmationDialog(false);
        }
    };
    
    // Cancel the status change
    const cancelStatusChange = () => {
        setShowConfirmationDialog(false);
        setConfirmationAction({ bookingId: null, newStatus: null });
    };
    
    // Handle toggling a date's availability
    const handleToggleUnavailableDate = (date) => {
        console.log('AdminDashboard: handleToggleUnavailableDate called with:', {
            originalDate: date,
            dateType: typeof date,
            dateString: date?.toString(),
            dateISO: date?.toISOString(),
            localDateString: date?.toLocaleDateString(),
            year: date?.getFullYear(),
            month: date?.getMonth(),
            day: date?.getDate()
        });
        
        if (!isAuthenticated) {
            alert('Only administrators can manage unavailable dates. Please log in as an administrator.');
            return;
        }
        setDateToToggle(date);
        setIsAddingUnavailableDate(!isDateUnavailable(date));
        setShowUnavailableDateDialog(true);
    };

    // Confirm toggling a date's availability
    const confirmToggleUnavailableDate = async () => {
        try {
            let result;
            if (isAddingUnavailableDate) {
                result = await addUnavailableDate(dateToToggle);
            } else {
                result = await removeUnavailableDate(dateToToggle);
            }

            if (result.success) {
                setShowUnavailableDateDialog(false);
                setDateToToggle(null);
                // Refresh bookings to update the calendar
                await fetchBookings();
            } else {
                alert(result.message || 'Failed to update date availability');
            }
        } catch (error) {
            console.error('Error toggling date availability:', error);
            alert('An error occurred while updating date availability');
        }
    };

    // Cancel toggling a date's availability
    const cancelToggleUnavailableDate = () => {
        setShowUnavailableDateDialog(false);
        setDateToToggle(null);
    };

    return (
        <BookingContext.Provider value={bookingContextValue}>
            <div className="admin-dashboard">
                <div className="app-container">
                <header>
                    <h1>Pet Hotel Admin Dashboard</h1>
                    <div className="user-info">
                        <span>Admin</span>
                        <div className="user-avatar">A</div>
                        <button 
                             className="logout-btn"
                             onClick={() => {
                                 logout();
                                 navigate('/admin/login');
                             }}
                         >
                             Logout
                         </button>
                     </div>
                 </header>

                 {/* Booking Status Confirmation Dialog */}
                 {showConfirmationDialog && (
                     <ConfirmationDialog
                         show={showConfirmationDialog}
                         onHide={cancelStatusChange}
                         onConfirm={handleStatusChange}
                         title="Confirmation"
                         message="Are you sure you want to change this booking's status?"
                     />
                 )}

                 {/* Unavailable Date Confirmation Dialog */}
                 {showUnavailableDateDialog && (
                     <ConfirmationDialog
                         show={showUnavailableDateDialog}
                         onHide={cancelToggleUnavailableDate}
                         onConfirm={confirmToggleUnavailableDate}
                         title="Date Availability"
                         message={isAddingUnavailableDate ? 
                             "Do you want to mark this date as unavailable? Users will not be able to book on this date." : 
                             "Do you want to make this date available again? Users will be able to book on this date."}
                     />
                 )}
                
                <div className="dashboard">
                    {/* Calendar section */}
                    <div className="calendar-container">
                        <CalendarView 
                            currentDate={currentDate}
                            selectedDate={selectedDate}
                            onDateSelect={setSelectedDate}
                            onChangeMonth={changeMonth}
                            hasBookings={hasBookings}
                            countBookings={countBookings}
                            formatDate={formatDate}
                            onToggleUnavailableDate={handleToggleUnavailableDate}
                            isDateUnavailable={isDateUnavailable}
                        />
                        
                        <div className="calendar-instructions mt-3">
                            <p><small>Right-click on a date to mark it as unavailable/available.</small></p>
                            <div className="calendar-legend">
                                <span className="legend-item"><span className="legend-color has-bookings-legend"></span> Has Bookings</span>
                                <span className="legend-item"><span className="legend-color unavailable-legend"></span> Unavailable</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Bookings section */}
                    <div className="bookings-container">
                        <div className="bookings-header">
                            <h2>Bookings
                                {selectedDate && (
                                    <span className="pending-bookings-badge">
                                        {countPendingBookings(selectedDate) > 0 && (
                                            `${countPendingBookings(selectedDate)} pending`
                                        )}
                                    </span>
                                )}
                            </h2>
                        </div>
                        
                        <div className="filter-container">
                            <div className="search-bar-container mb-3">
                                <input
                                    type="text"
                                    className="search-bar"
                                    placeholder="Search by pet owner name..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            
                            <div className="filters-row">
                                <select 
                                    className="filter-dropdown"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    style={{ marginRight: '10px' }}
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                                
                                <select
                                    className="filter-dropdown"
                                    value={serviceTypeFilter}
                                    onChange={(e) => setServiceTypeFilter(e.target.value)}
                                    style={{ marginRight: '10px' }}
                                >
                                    <option value="all">All Services</option>
                                    <option value="overnight">Overnight Stay</option>
                                    <option value="daycare">Pet Day Care</option>
                                    <option value="grooming">Grooming</option>
                                </select>
                            </div>
                            
                           
                        </div>
                        
                        <BookingsList 
                            bookings={filteredBookings} 
                            formatDateRange={formatDateRange}
                            selectedDate={selectedDate}
                            onStatusChange={promptStatusChange}
                            showHistoryFilter={showHistoryFilter}
                            fetchBookings={fetchBookings}
                        />
                    </div>
                </div>
            </div>
            </div>
        </BookingContext.Provider>
    );
}

export default AdminDashboard;
export { BookingContext };
