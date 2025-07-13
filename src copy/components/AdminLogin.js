import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isValidEmail, getPasswordStrength, formatErrorMessage } from '../lib/utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faLock, faUser, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import './AdminLogin.css';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, authLoading, authError } = useAuth();
  
  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin');
    }
  }, [isAuthenticated, navigate]);
  
  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!username.trim()) {
      errors.username = 'Username is required';
    }
    
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      try {
        const result = await login(username, password);
        
        if (result.success) {
          // Reset form and navigate to admin dashboard
          setUsername('');
          setPassword('');
          setFormErrors({});
          navigate('/admin');
        } else {
          // Increment login attempts on failure
          setLoginAttempts(prev => prev + 1);
          setFormErrors({ general: result.error });
        }
      } catch (error) {
        setFormErrors({ general: formatErrorMessage(error) });
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  

  
  return (
    <div className="admin-auth-container">
      <div className="admin-auth-card">
        <div className="admin-auth-header">
          <h2>Admin Login</h2>
          <p>Sign in to access the admin dashboard</p>
        </div>
        
        <form className="admin-auth-form" onSubmit={handleSubmit}>
          {/* General error message */}
          {(formErrors.general || authError) && (
            <div className="auth-error-message">
              <FontAwesomeIcon icon={faExclamationCircle} />
              <span>{formErrors.general || authError}</span>
            </div>
          )}
          
          {/* Username field */}
          <div className={`form-group ${formErrors.username ? 'has-error' : ''}`}>
            <label htmlFor="username">Username</label>
            <div className="input-with-icon">
              <FontAwesomeIcon icon={faUser} className="input-icon" />
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                disabled={isSubmitting || authLoading}
              />
            </div>
            {formErrors.username && <div className="error-text">{formErrors.username}</div>}
          </div>
          
          {/* Password field */}
          <div className={`form-group ${formErrors.password ? 'has-error' : ''}`}>
            <label htmlFor="password">Password</label>
            <div className="input-with-icon">
              <FontAwesomeIcon icon={faLock} className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isSubmitting || authLoading}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={togglePasswordVisibility}
                tabIndex="-1"
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>
            {formErrors.password && <div className="error-text">{formErrors.password}</div>}
          </div>
          
          {/* Submit button */}
          <button 
            type="submit" 
            className="auth-submit-btn"
            disabled={isSubmitting || authLoading}
          >
            {isSubmitting || authLoading ? 'Signing in...' : 'Sign In'}
          </button>
          

        </form>
      </div>
    </div>
  );
};

export default AdminLogin;