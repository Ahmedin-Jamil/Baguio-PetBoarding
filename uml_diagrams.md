# Baguio Pet Boarding System - UML Diagrams

## Table of Contents
1. [System Architecture Diagram](#system-architecture-diagram)
2. [Component Diagram](#component-diagram)
3. [Class Diagram](#class-diagram)
4. [Sequence Diagrams](#sequence-diagrams)
5. [State Diagrams](#state-diagrams)

## System Architecture Diagram

```mermaid
graph TB
    subgraph "Frontend (React)"
        UI[User Interface]
        Components[React Components]
        Context[Context API]
        Utils[Utility Functions]
    end
    
    subgraph "Backend (Node.js/Express)"
        API[API Endpoints]
        Controllers[Controllers]
        Services[Services]
        Models[Models]
        KB[Knowledge Base]
    end
    
    subgraph "Database"
        MySQL[MySQL Database]
    end
    
    UI --> Components
    Components --> Context
    Context --> Utils
    Context --> API
    API --> Controllers
    Controllers --> Services
    Services --> Models
    Services --> KB
    Models --> MySQL
```

## Component Diagram

```mermaid
graph TB
    subgraph "Frontend Components"
        Home[HomeNew.js]
        BookingWidget[BookingWidget.js]
        ServiceCard[ServiceCard.js]
        OvernightRes[OvernightReservation.js]
        DaycareRes[DaycareReservation.js]
        GroomingRes[GroomingReservation.js]
        Confirmation[Confirmation.js]
        AdminDash[AdminDashboard.js]
        Chatbot[ChatbotNew.js]
    end
    
    subgraph "Context Providers"
        BookingCtx[BookingContext.js]
        ServiceAvailCtx[ServiceAvailabilityContext.js]
        RoomAvailCtx[RoomAvailabilityContext.js]
        AuthCtx[AuthContext.js]
        AppCtx[AppContext.js]
    end
    
    subgraph "Utility Functions"
        DateUtils[dateUtils.js]
        APIUtils[apiUtils.js]
    end
    
    Home --> BookingWidget
    Home --> ServiceCard
    ServiceCard --> OvernightRes
    ServiceCard --> DaycareRes
    ServiceCard --> GroomingRes
    OvernightRes --> Confirmation
    DaycareRes --> Confirmation
    GroomingRes --> Confirmation
    
    BookingWidget --> BookingCtx
    ServiceCard --> BookingCtx
    OvernightRes --> BookingCtx
    DaycareRes --> BookingCtx
    GroomingRes --> BookingCtx
    Confirmation --> BookingCtx
    AdminDash --> BookingCtx
    
    BookingCtx --> ServiceAvailCtx
    BookingCtx --> RoomAvailCtx
    BookingCtx --> DateUtils
    BookingCtx --> APIUtils
```

## Class Diagram

```mermaid
classDiagram
    class BookingContext {
        -bookings: Array
        -userBookings: Array
        -unavailableDates: Array
        -isLoading: boolean
        -error: string
        -currentUser: Object
        -userRole: string
        -MAX_SLOTS: Object
        +initializeUser(userData, role)
        +fetchBookings(userId)
        +addBooking(bookingData)
        +updateBookingStatus(bookingId, newStatus)
        +addUnavailableDate(date)
        +removeUnavailableDate(date)
        +fetchUnavailableDates()
        +countBookingsByServiceAndRoom(date, serviceType, roomType)
        +isServiceAtCapacity(date, serviceType, roomType)
        +getAvailableSlots(date, serviceType, specificService)
    }
    
    class ServiceAvailabilityContext {
        -serviceAvailability: Object
        +getServiceAvailability(serviceType, groomingType)
        +updateServiceAvailability(serviceType, groomingType, change)
    }
    
    class RoomAvailabilityContext {
        -roomAvailability: Object
        +getRoomAvailability(roomType, date)
        +updateRoomAvailability(roomType, date, change)
    }
    
    class AuthContext {
        -user: Object
        -isAuthenticated: boolean
        -role: string
        +login(credentials)
        +logout()
        +register(userData)
    }
    
    class OvernightReservation {
        -startDate: Date
        -endDate: Date
        -selectedTime: string
        -roomType: string
        -pets: Array
        -ownerName: string
        -ownerEmail: string
        -ownerPhone: string
        +handleCheckConfirmation()
        +handleSubmit()
        +checkRoomTypeAvailability(roomType)
        +handlePetChange(index, field, value)
    }
    
    class GroomingReservation {
        -selectedDate: Date
        -selectedTime: string
        -groomingService: string
        -petName: string
        -petType: string
        -ownerName: string
        -ownerEmail: string
        +handleCheckConfirmation()
        +handleSubmit()
    }
    
    class ChatbotNew {
        -messages: Array
        -sessionId: string
        -isLoading: boolean
        -viewState: string
        +handleSendMessage(message)
        +handleQuestionSelect(question)
        +isMessageRelatedToTopic(message, topic)
    }
    
    BookingContext --> ServiceAvailabilityContext
    BookingContext --> RoomAvailabilityContext
    OvernightReservation --> BookingContext
    GroomingReservation --> BookingContext
    ChatbotNew --> "API"
```

## Sequence Diagrams

### Booking Flow Sequence

```mermaid
sequenceDiagram
    actor User
    participant HomeUI as HomeNew.js
    participant BookingWidget as BookingWidget.js
    participant ServiceCard as ServiceCard.js
    participant ReservationForm as Reservation Form
    participant BookingCtx as BookingContext.js
    participant API as Backend API
    participant DB as Database
    
    User->>HomeUI: Access website
    HomeUI->>BookingWidget: Select service & dates
    User->>BookingWidget: Click "Check Availability"
    BookingWidget->>ServiceCard: Scroll to relevant service card
    ServiceCard->>User: Show "Continue Booking" button
    User->>ServiceCard: Click "Continue Booking"
    ServiceCard->>ReservationForm: Navigate with booking data
    ReservationForm->>User: Display reservation form
    User->>ReservationForm: Fill pet & owner details
    User->>ReservationForm: Click "Check Confirmation"
    ReservationForm->>BookingCtx: Validate and format data
    BookingCtx->>API: POST /api/bookings
    API->>DB: Create booking record
    DB->>API: Confirm creation
    API->>BookingCtx: Return success response
    BookingCtx->>ReservationForm: Update UI with confirmation
    ReservationForm->>User: Show booking confirmation
```

### Chatbot Interaction Sequence

```mermaid
sequenceDiagram
    actor User
    participant ChatUI as ChatbotNew.js
    participant API as Backend API
    participant KB as Knowledge Base
    
    User->>ChatUI: Send message
    ChatUI->>API: POST /api/chat
    API->>KB: Search for relevant answer
    KB->>API: Return matching content
    API->>ChatUI: Return response
    ChatUI->>User: Display response
    ChatUI->>User: Show follow-up options
    User->>ChatUI: Select follow-up or send new message
```

## State Diagrams

### Booking State Diagram

```mermaid
stateDiagram-v2
    [*] --> Initial
    Initial --> ServiceSelection: User visits homepage
    ServiceSelection --> DateSelection: User selects service type
    DateSelection --> AvailabilityCheck: User selects dates
    AvailabilityCheck --> ReservationForm: Availability confirmed
    AvailabilityCheck --> DateSelection: No availability
    ReservationForm --> PetDetails: User enters owner info
    PetDetails --> ConfirmationReview: User enters pet details
    ConfirmationReview --> BookingSubmission: User confirms details
    BookingSubmission --> BookingConfirmed: API success
    BookingSubmission --> BookingError: API error
    BookingError --> ReservationForm: User retries
    BookingConfirmed --> [*]
```

### Admin Dashboard State Diagram

```mermaid
stateDiagram-v2
    [*] --> Login
    Login --> Dashboard: Admin credentials
    Dashboard --> CalendarView: Default view
    Dashboard --> BookingsList: Click "List View"
    CalendarView --> BookingDetails: Select date/booking
    BookingsList --> BookingDetails: Click booking
    BookingDetails --> UpdateStatus: Click status action
    UpdateStatus --> BookingDetails: Status updated
    BookingDetails --> Dashboard: Close details
    Dashboard --> [*]: Logout
```
