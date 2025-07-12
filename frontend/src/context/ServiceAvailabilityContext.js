
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useBookings } from './BookingContext';

// Create context
export const ServiceAvailabilityContext = createContext();

// Create provider component that accepts selectedDate
export const ServiceAvailabilityProvider = ({ children, selectedDate }) => {
  // Initialize service capacity and availability state with default values
  const [serviceAvailability, setServiceAvailability] = useState({
    daycare: { total: 10, available: 10 },
    grooming: {
      'Premium Grooming': { total: 5, available: 5 },
      'Basic Bath & Dry': { total: 10, available: 10 },
      'Special Grooming Package': { total: 5, available: 5 }
    }
  });

  const { bookings, MAX_SLOTS, countBookingsByServiceAndRoom } = useBookings();

  // Update service availability state when MAX_SLOTS is available
  useEffect(() => {
    if (MAX_SLOTS) {
      setServiceAvailability(prev => ({
        ...prev,
        daycare: { total: MAX_SLOTS?.daycare ?? 10, available: MAX_SLOTS?.daycare ?? 10 },
        grooming: {
          'Premium Grooming': { total: MAX_SLOTS?.grooming?.['Premium Grooming'] ?? 5, available: MAX_SLOTS?.grooming?.['Premium Grooming'] ?? 5 },
          'Basic Bath & Dry': { total: MAX_SLOTS?.grooming?.['Basic Bath & Dry'] ?? 10, available: MAX_SLOTS?.grooming?.['Basic Bath & Dry'] ?? 10 },
          'Special Grooming Package': { total: MAX_SLOTS?.grooming?.['Special Grooming Package'] ?? 5, available: MAX_SLOTS?.grooming?.['Special Grooming Package'] ?? 5 }
        }
      }));
    }
  }, [MAX_SLOTS]);

  // Effect to update service availability when bookings or selectedDate change
  useEffect(() => {
    // Use a function to update state based on current dependencies
    // This avoids needing to include serviceAvailability in the dependency array
    const updateAvailability = () => {
      // Create a deep copy of default service availability structure
      const updatedAvailability = {
    // Defensive fallback for missing MAX_SLOTS or sub-objects
    ...(MAX_SLOTS ? {} : { daycare: { available: 0, total: 10 }, grooming: {}, overnight: {} }),
        daycare: { available: 0, total: MAX_SLOTS?.daycare ?? 10 },
        grooming: {
          'Premium Grooming': { available: 0, total: MAX_SLOTS?.grooming?.['Premium Grooming'] ?? 5 },
          'Basic Bath & Dry': { available: 0, total: MAX_SLOTS?.grooming?.['Basic Bath & Dry'] ?? 10 },
          'Special Grooming Package': { available: 0, total: MAX_SLOTS?.grooming?.['Special Grooming Package'] ?? 5 }
        },
        overnight: {
          deluxe: { available: 0, total: MAX_SLOTS?.overnight?.deluxe ?? 10 },
          premium: { available: 0, total: MAX_SLOTS?.overnight?.premium ?? 5 },
          executive: { available: 0, total: MAX_SLOTS?.overnight?.executive ?? 3 }
        }
      };

      // Use the selectedDate passed as a prop
      const dateForCalculation = selectedDate ? new Date(selectedDate) : new Date();
      dateForCalculation.setHours(0, 0, 0, 0);

      // Update daycare availability
      const daycareOccupied = countBookingsByServiceAndRoom(dateForCalculation, 'daycare', null);
      updatedAvailability.daycare.available = Math.max(0, (MAX_SLOTS.daycare || 10) - daycareOccupied);

      // Update grooming service availability
      if (MAX_SLOTS.grooming) {
        Object.entries(MAX_SLOTS.grooming).forEach(([serviceType, total]) => {
          const occupied = countBookingsByServiceAndRoom(dateForCalculation, 'grooming', serviceType);
          if (updatedAvailability.grooming[serviceType]) {
             updatedAvailability.grooming[serviceType].available = Math.max(0, total - occupied);
          }
        });
      }
      
      return updatedAvailability;
    };

    // Update the state with the calculated availability
    setServiceAvailability(updateAvailability());
  }, [bookings, MAX_SLOTS, countBookingsByServiceAndRoom, selectedDate]);

  // Function to get service availability
  const getServiceAvailability = (serviceType, groomingType = null) => {
    if (serviceType === 'daycare') {
      return serviceAvailability.daycare?.available || 0;
    } else if (serviceType === 'grooming' && groomingType) {
      return serviceAvailability.grooming[groomingType]?.available || 0;
    }
    return 0;
  };

  // Function to update service availability when booking is made or status changes
  const updateServiceAvailability = (serviceType, groomingType = null, change) => {
    if (!serviceType || typeof change !== 'number') {
      console.warn('Invalid parameters for updateServiceAvailability');
      return;
    }

    setServiceAvailability(prev => {
      if (serviceType === 'daycare') {
        const currentAvailable = prev.daycare.available;
        const newAvailable = Math.max(0, Math.min(prev.daycare.total, currentAvailable - change));
        
        if (change > 0 && currentAvailable < change) {
          console.warn('Cannot book daycare - no slots available');
          return prev;
        }
        
        return {
          ...prev,
          daycare: {
            ...prev.daycare,
            available: newAvailable
          }
        };
      } else if (serviceType === 'grooming' && groomingType) {
        const currentService = prev.grooming[groomingType];
        if (!currentService) {
           console.warn(`Invalid grooming type: ${groomingType}`);
           return prev;
        }
        const currentAvailable = currentService.available;
        const newAvailable = Math.max(0, Math.min(currentService.total, currentAvailable - change));
        
        if (change > 0 && currentAvailable < change) {
          console.warn(`Cannot book ${groomingType} - no slots available`);
          return prev;
        }
        
        return {
          ...prev,
          grooming: {
            ...prev.grooming,
            [groomingType]: {
              ...currentService,
              available: newAvailable
            }
          }
        };
      }
      return prev;
    });
  };

  return (
    <ServiceAvailabilityContext.Provider
      value={{
        serviceAvailability,
        getServiceAvailability,
        updateServiceAvailability
      }}
    >
      {children}
    </ServiceAvailabilityContext.Provider>
  );
};

// Custom hook for using service availability context
export const useServiceAvailability = () => {
  const context = useContext(ServiceAvailabilityContext);
  if (!context) {
    throw new Error('useServiceAvailability must be used within a ServiceAvailabilityProvider');
  }
  return context;
};