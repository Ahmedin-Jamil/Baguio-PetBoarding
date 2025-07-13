import React, { createContext, useState, useContext } from 'react';

// Create the app context
const AppContext = createContext();

// Create a provider component
export const AppProvider = ({ children }) => {
  // Add any app-wide state here
  const [appState, setAppState] = useState({
    isLoading: false,
    error: null,
    // Add more app-wide state as needed
  });

  // Add any app-wide methods here
  const setLoading = (isLoading) => {
    setAppState(prev => ({ ...prev, isLoading }));
  };

  const setError = (error) => {
    setAppState(prev => ({ ...prev, error }));
  };

  // Context value
  const value = {
    ...appState,
    setLoading,
    setError,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Custom hook for using the app context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
