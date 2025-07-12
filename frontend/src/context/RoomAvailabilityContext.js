import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useBookings } from './BookingContext';
import { API_URL } from '../config';
import { formatDateForAPI, createConsistentDate, parseLocalDate } from '../utils/dateUtils';

// Create context
export const RoomAvailabilityContext = createContext();

// Create provider component that accepts selectedDate
export const RoomAvailabilityProvider = ({ children, selectedDate = null }) => {
  const { MAX_SLOTS } = useBookings();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Always start with hardcoded defaults
  const [roomAvailability, setRoomAvailability] = useState({
    deluxe: { total: 10, available: 10 },
    premium: { total: 10, available: 10 },
    executive: { total: 2, available: 2 }
  });

  // Update room availability when MAX_SLOTS changes
  useEffect(() => {
    const overnight = MAX_SLOTS?.overnight ?? {};
    setRoomAvailability({
      deluxe: { total: overnight.deluxe ?? 10, available: overnight.deluxe ?? 10 },
      premium: { total: overnight.premium ?? 10, available: overnight.premium ?? 10 },
      executive: { total: overnight.executive ?? 2, available: overnight.executive ?? 2 }
    });
  }, [MAX_SLOTS]);

  // Safely format a date to YYYY-MM-DD for API calls
  const safeFormatDateForAPI = (dateInput) => {
    try {
      // If dateInput is already a string in YYYY-MM-DD format, return it
      if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        return dateInput;
      }
      
      // If dateInput is a string in MM/DD/YYYY format, convert it
      if (typeof dateInput === 'string' && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateInput)) {
        const parts = dateInput.split('/');
        return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
      }
      
      // Parse date consistently at noon local time
      const parsedDate = parseLocalDate(dateInput);
      if (parsedDate) {
        return formatDateForAPI(parsedDate);
      }
      
      // Fallback to today at noon if parsing fails
      console.error('Invalid date input:', dateInput);
      return formatDateForAPI(parseLocalDate(new Date()));
    } catch (err) {
      console.error('Error formatting date for API:', err);
      return formatDateForAPI(parseLocalDate(new Date())); // Fallback to today at noon
    }
  };

  // Calculate availability based on bookings - wrapped in useCallback to avoid dependency warnings
  const recalculateAvailability = useCallback(() => {
    // Use MAX_SLOTS for total capacity
    const roomCapacity = {
      deluxe: (MAX_SLOTS?.overnight?.deluxe ?? 10),
      premium: (MAX_SLOTS?.overnight?.premium ?? 10),
      executive: (MAX_SLOTS?.overnight?.executive ?? 2)
    };
    
    // Default to full availability
    setRoomAvailability({
      deluxe: { total: roomCapacity.deluxe, available: roomCapacity.deluxe },
      premium: { total: roomCapacity.premium, available: roomCapacity.premium },
      executive: { total: roomCapacity.executive, available: roomCapacity.executive }
    });
    
    console.log('Room availability recalculated from capacity settings');
  }, [MAX_SLOTS, setRoomAvailability]);

  // Fetch room availability from the API when component mounts or when selectedDate changes
  useEffect(() => {
    const fetchRoomAvailability = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use safe date formatting to prevent "Invalid time value" errors
        const date = selectedDate ? safeFormatDateForAPI(selectedDate) : safeFormatDateForAPI(new Date());
        
        try {
          // Try to fetch from API
          const response = await axios.get(`${API_URL}/api/room-availability?date=${date}`);
          
          // Update the room availability state with data from API
          setRoomAvailability(prev => {
            const overnight = response.data?.overnight ?? {};
            return {
              ...prev,
              deluxe: overnight.deluxe ?? { total: 10, available: 10 },
              premium: overnight.premium ?? { total: 10, available: 10 },
              executive: overnight.executive ?? { total: 2, available: 2 }
            };
          });
          
          console.log('Room availability fetched from API:', response.data);
        } catch (apiError) {
          console.warn('API fetch failed, using capacity calculation instead:', apiError);
          
          // Get bookings for this date from context
          // We will calculate availability based on total capacity minus booked rooms
          recalculateAvailability();
        }
      } catch (err) {
        console.error('Error handling room availability:', err);
        setError('Failed to handle room availability. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchRoomAvailability();
    
    // Listen for booking changes to update availability
    const handleBookingUpdate = () => {
      console.log('RoomAvailabilityContext: Detected booking update');
      fetchRoomAvailability();
    };
    
    // Subscribe to booking update events
    window.addEventListener('bookingUpdated', handleBookingUpdate);
    
    return () => {
      window.removeEventListener('bookingUpdated', handleBookingUpdate);
    };
  }, [selectedDate, recalculateAvailability]);
  

  // No need for manual recalculation - the API handles this for us

  // Function to get room availability
  const getRoomAvailability = (roomType) => {
    if (!roomType || !roomAvailability[roomType]) return 0;
    return roomAvailability[roomType].available;
  };

  // Function to update room availability when booking is made or status changes
  // Parameter change: positive value means booking slots (reducing availability), 
  // negative value means releasing slots (increasing availability)
  const updateRoomAvailability = async (roomType, change, status = 'pending') => {
    if (!roomType || typeof change !== 'number') {
      console.warn('Invalid parameters for updateRoomAvailability');
      return;
    }
    
    // Make sure roomType is lowercase for consistency
    roomType = roomType.toLowerCase();
    console.log(`Updating room availability for ${roomType} by ${change} slots`);

    // First update local state for immediate UI feedback
    setRoomAvailability(prev => {
      const currentRoom = prev[roomType];
      if (!currentRoom) {
        console.warn(`Invalid room type: ${roomType}`);
        return prev;
      }

      const currentAvailable = currentRoom.available;
      
      // IMPORTANT: A positive change value means we're booking rooms (reducing availability)
      // A negative change value means we're releasing rooms (increasing availability)
      const newAvailable = Math.max(0, Math.min(currentRoom.total, currentAvailable - change));
      
      // Prevent overbooking (only when booking rooms)
      if (change > 0 && currentAvailable < change) {
        console.warn(`Cannot book ${roomType} room - only ${currentAvailable} slots available but trying to book ${change}`);
        return prev;
      }
      
      console.log(`Room ${roomType} availability changing from ${currentAvailable} to ${newAvailable}`);
      
      return {
        ...prev,
        [roomType]: {
          ...currentRoom,
          available: newAvailable
        }
      };
    });
    
    // No need to manually update the database - the booking API call will handle this
    // The next time availability is fetched, it will reflect the new booking state
  };

  // Function to refresh room availability from the server
  const refreshRoomAvailability = async () => {
    setLoading(true);
    try {
      // Use safe date formatting to prevent "Invalid time value" errors
      const date = selectedDate ? safeFormatDateForAPI(selectedDate) : safeFormatDateForAPI(new Date());
      
      try {
        const response = await axios.get(`${API_URL}/api/room-availability?date=${date}`);
        
        setRoomAvailability(prev => ({
          ...prev,
          deluxe: response.data.overnight.deluxe,
          premium: response.data.overnight.premium,
          executive: response.data.overnight.executive
        }));
        
        console.log('Room availability refreshed from API:', response.data);
        return true;
      } catch (apiError) {
        console.warn('API fetch failed during refresh, using capacity calculation instead:', apiError);
        recalculateAvailability();
        return true; // Consider it a success since we fell back to calculations
      }
    } catch (err) {
      console.error('Error refreshing room availability:', err);
      setError('Failed to refresh room availability. Please try again later.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <RoomAvailabilityContext.Provider
      value={{
        roomAvailability,
        getRoomAvailability,
        updateRoomAvailability,
        refreshRoomAvailability,
        loading,
        error
      }}
    >
      {children}
    </RoomAvailabilityContext.Provider>
  );
};

// Custom hook for using room availability context
export const useRoomAvailability = () => {
  const context = useContext(RoomAvailabilityContext);
  if (!context) {
    throw new Error('useRoomAvailability must be used within a RoomAvailabilityProvider');
  }
  return context;
};
