import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the authentication context
const AuthContext = createContext();

// Create a provider component
export const AuthProvider = ({ children }) => {
  // Initialize auth state from localStorage if available
  const [currentAdmin, setCurrentAdmin] = useState(() => {
    const savedAdmin = localStorage.getItem('currentAdmin');
    return savedAdmin ? JSON.parse(savedAdmin) : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Initialize admin user with secure credentials
  const [adminUsers] = useState([
    {
      id: 1,
      username: 'baguiopethotel_admin',
      password: 'BPH@dm1n2025!',
      name: 'Admin User',
      email: 'admin@baguiopethotel.com',
      role: 'administrator'
    }
  ]);



  // Save auth state to localStorage whenever it changes
  useEffect(() => {
    if (currentAdmin) {
      localStorage.setItem('currentAdmin', JSON.stringify(currentAdmin));
      localStorage.setItem('isAuthenticated', 'true');
    } else {
      localStorage.removeItem('currentAdmin');
      localStorage.setItem('isAuthenticated', 'false');
    }
  }, [currentAdmin, isAuthenticated]);

  // Login function
  const login = async (username, password) => {
    setAuthLoading(true);
    setAuthError(null);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Find user with matching credentials
      const admin = adminUsers.find(
        user => user.username === username && user.password === password
      );
      
      if (admin) {
        // Remove password from user object before storing
        const { password, ...adminWithoutPassword } = admin;
        setCurrentAdmin(adminWithoutPassword);
        setIsAuthenticated(true);
        return { success: true, admin: adminWithoutPassword };
      } else {
        setAuthError('Invalid username or password');
        return { success: false, error: 'Invalid username or password' };
      }
    } catch (error) {
      setAuthError('An error occurred during login');
      return { success: false, error: 'An error occurred during login' };
    } finally {
      setAuthLoading(false);
    }
  };



  // Logout function
  const logout = () => {
    setCurrentAdmin(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentAdmin');
    localStorage.setItem('isAuthenticated', 'false');
  };

  // Context value
  const value = {
    currentAdmin,
    isAuthenticated,
    authLoading,
    authError,
    login,

    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook for using the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};