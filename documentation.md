# Baguio Pet Boarding System Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Frontend Components](#frontend-components)
4. [Backend Services](#backend-services)
5. [Booking System](#booking-system)
6. [Chatbot System](#chatbot-system)
7. [Admin Dashboard](#admin-dashboard)
8. [Data Flow](#data-flow)
9. [Known Issues and Fixes](#known-issues-and-fixes)
10. [API Reference](#api-reference)

## System Overview

The Baguio Pet Boarding system is a comprehensive web application for managing pet boarding, daycare, and grooming services. It allows customers to book various services for their pets, check availability, and manage their bookings. The system includes a customer-facing frontend, an admin dashboard for staff, and a chatbot for customer support.

### Key Features
- Service booking (overnight boarding, daycare, grooming)
- Real-time availability checking
- Pet and owner information management
- Admin dashboard for booking management
- Integrated chatbot for customer support
- Calendar-based booking visualization

## Architecture

### Technology Stack
- **Frontend**: React.js with React Bootstrap for UI components
- **Backend**: Node.js with Express.js
- **Database**: MySQL (implied from code references)
- **State Management**: React Context API
- **Routing**: React Router
- **Styling**: CSS with custom components
- **API Communication**: Fetch API

### Directory Structure
```
BaguioPetBoarding/
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── data/
│   │   ├── lib/
│   │   ├── styles/
│   │   └── utils/
│   ├── public/
│   └── build/
└── backend/
    ├── config/
    ├── controllers/
    ├── db/
    ├── docs/
    ├── knowledge_base/
    ├── logs/
    ├── middleware/
    ├── migrations/
    ├── models/
    ├── routes/
    ├── services/
    └── tests/
```

## Frontend Components

### Core Components
1. **HomeNew.js**: Main landing page with booking widget and service cards
2. **BookingWidget.js**: Initial booking form for service selection and date/time
3. **ServiceCard.js**: Displays service options with "Continue Booking" functionality
4. **OvernightReservation.js**: Detailed form for overnight boarding bookings
5. **DaycareReservation.js**: Form for daycare service bookings
6. **GroomingReservation.js**: Form for grooming service bookings
7. **Confirmation.js**: Booking confirmation page with summary
8. **AdminDashboard.js**: Admin interface for managing bookings
9. **ChatbotNew.js**: Customer support chatbot interface

### Context Providers
1. **BookingContext.js**: Core booking functionality and state management
   - Manages bookings, availability, and user data
   - Handles API communication for booking operations
   - Provides booking validation and processing

2. **ServiceAvailabilityContext.js**: Service-specific availability management
   - Tracks available slots for each service type
   - Updates availability based on bookings
   - Provides real-time availability information

3. **RoomAvailabilityContext.js**: Room-specific availability tracking
   - Manages room capacity and availability
   - Tracks room bookings by date

4. **AuthContext.js**: User authentication and authorization
   - Manages user login/logout
   - Stores user session information

5. **AppContext.js**: Global application state
   - Manages application-wide settings and state

### Utility Functions
- **dateUtils.js**: Date formatting and manipulation functions
  - `formatDateForAPI`: Formats dates for API requests (YYYY-MM-DD)
  - `formatDateForDisplay`: Formats dates for UI display
  - `createConsistentDate`: Creates dates with proper timezone handling

## Backend Services

### API Endpoints
- **/api/bookings**: Booking management endpoints
  - GET: Retrieve bookings
  - POST: Create new bookings
  - PUT: Update booking status
  
- **/api/availability**: Availability checking endpoints
  - GET: Check service and room availability

- **/api/users**: User management endpoints
  - POST: Create/authenticate users
  - GET: Retrieve user information

- **/api/pets**: Pet information endpoints
  - POST: Create/update pet records
  - GET: Retrieve pet information

- **/api/chat**: Chatbot interaction endpoints
  - POST: Process chat messages
  - GET: Retrieve chat history

### Knowledge Base
- **pet_hotel.txt**: Contains Q&A pairs for the chatbot system
  - Used for retrieval-augmented generation
  - Structured as question-answer pairs

## Booking System

### Service Types
1. **Overnight Boarding**
   - Room types: Deluxe Room, Premium Room, Executive Room
   - Capacity limits per room type
   - Check-in/check-out date selection

2. **Daycare**
   - Single day service
   - Pet size categories
   - Limited daily capacity

3. **Grooming**
   - Service types: Premium Grooming, Basic Bath & Dry, Special Grooming Package
   - Capacity limits per service type
   - Appointment scheduling

### Booking Flow
1. User selects service type and dates in BookingWidget
2. User clicks "Check Availability" which scrolls to relevant ServiceCard
3. ServiceCard shows "Continue Booking" button for selected service
4. User is directed to specific reservation page (OvernightReservation, DaycareReservation, or GroomingReservation)
5. User completes detailed booking form with pet and owner information
6. User reviews and confirms booking on Confirmation page
7. System creates booking records and updates availability

### Availability Management
- Each service type has defined capacity limits
- BookingContext tracks bookings by date and service type
- System prevents overbooking by checking availability before confirming
- Admin can mark dates as unavailable for specific services

### Date Handling
- All dates are stored in YYYY-MM-DD format
- System uses Asia/Manila timezone (UTC+8)
- Date creation uses noon local time (12:00) to prevent day boundary shifts
- Consistent date handling patterns are used across the application

## Chatbot System

### Architecture
- Single-source knowledge base (pet_hotel.txt)
- Retrieval-augmented generation (RAG) system
- Exact and keyword-based matching
- Session-based conversation memory

### Features
- Responds exclusively from pet_hotel.txt knowledge base
- Maintains conversation context
- Handles out-of-scope questions with polite redirects
- Provides follow-up suggestions
- Supports clickable links and formatting

### API Endpoints
- **/chat**: Message processing
- **/history**: Conversation retrieval
- **/health**: System status checking

## Admin Dashboard

### Features
- Calendar view with booking indicators
- Booking details panel
- Filtering by date, status, and service type
- Booking management actions (confirm, cancel)
- Unavailable date management

### UI Components
- Dark blue sticky header with "Admin Dashboard" title and logout button
- Calendar panel on the left showing booking counts
- Bookings list with filters on the right
- Color-coded status badges
- Action buttons for each booking

## Data Flow

### Booking Creation
1. Frontend collects booking data through reservation forms
2. BookingContext.addBooking formats data for API
3. API request is sent to backend /api/bookings endpoint
4. Backend validates and processes booking
5. Response is returned to frontend
6. BookingContext updates local state
7. User is shown confirmation

### Availability Checking
1. User selects date and service
2. Frontend requests availability from backend
3. Backend checks database for existing bookings
4. Backend calculates available slots
5. Response is sent to frontend
6. ServiceAvailabilityContext updates availability state
7. UI is updated to show available/unavailable options

### Chatbot Interaction
1. User sends message through ChatbotNew interface
2. Message is sent to backend /chat endpoint
3. Backend searches knowledge base for relevant answer
4. Response is returned to frontend
5. ChatbotNew displays response and follow-up options

## Known Issues and Fixes

### Date Handling Issues
1. **Timezone Offset Bug**: Fixed issue where booking dates were shifted by 2 days
   - Root cause: Using toISOString().split('T')[0] caused UTC conversion issues
   - Solution: Implemented formatDateForAPI() utility for consistent date handling

2. **Calendar Date Selection Bug**: Fixed issue where clicking on a date would mark the wrong date
   - Root cause: Timezone offset issues in date handling
   - Solution: Used createConsistentDate() and formatDateForAPI() utilities

### Grooming Booking Issues
1. **Missing Grooming Service Field**: Fixed issue where grooming service type was missing from booking payload
   - Solution: Added conditional grooming service fields to finalPayload

2. **Availability Not Updating**: Fixed issue where grooming booking availability wasn't updating correctly
   - Root cause: Incomplete field mapping in fetchBookings
   - Solution: Enhanced fetchBookings to map grooming service fields

3. **Duplicate Booking Creation**: Fixed issue where grooming bookings were being created twice
   - Solution: Modified Confirmation component to skip booking creation for grooming services

### API Payload Format Issues
1. **Field Naming Convention**: Backend requires camelCase for field names
   - Solution: Converted all snake_case field names to camelCase in API requests

2. **Missing Fields**: Fixed issues with missing fields in booking payloads
   - Solution: Added comprehensive field mapping and validation

## API Reference

### Booking Endpoints

#### Create Booking
```
POST /api/bookings
```
Payload structure:
```javascript
{
  serviceId: number,
  bookingDate: string, // YYYY-MM-DD
  startTime: string, // HH:MM:SS
  endTime: string, // HH:MM:SS
  totalAmount: number,
  specialRequests: string,
  roomType: string,
  userId: number,
  petId: number,
  // For grooming services
  groomingService: string
}
```

#### Get Bookings
```
GET /api/bookings
GET /api/bookings/user/:userId
```

#### Update Booking Status
```
PUT /api/bookings/:bookingId/status
```
Payload:
```javascript
{
  status: string // "confirmed", "cancelled", "pending"
}
```

### Availability Endpoints

#### Get Unavailable Dates
```
GET /api/availability/unavailable-dates
```

#### Add Unavailable Date
```
POST /api/availability/unavailable-dates
```
Payload:
```javascript
{
  date: string // YYYY-MM-DD
}
```

#### Remove Unavailable Date
```
DELETE /api/availability/unavailable-dates/:date
```

### Chatbot Endpoints

#### Send Message
```
POST /api/chat
```
Payload:
```javascript
{
  message: string,
  sessionId: string
}
```

#### Get Chat History
```
GET /api/chat/history/:sessionId
```
