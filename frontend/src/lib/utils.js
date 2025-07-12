/**
 * Utility functions for the application
 */

// Classnames utility function for conditional class application
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// Email validation
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Password strength validation
export function getPasswordStrength(password) {
  if (!password) return { score: 0, feedback: 'Password is required' };
  
  let score = 0;
  let feedback = [];
  
  // Length check
  if (password.length < 8) {
    feedback.push('Password should be at least 8 characters');
  } else {
    score += 1;
  }
  
  // Complexity checks
  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Add uppercase letters');
  
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Add lowercase letters');
  
  if (/[0-9]/.test(password)) score += 1;
  else feedback.push('Add numbers');
  
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  else feedback.push('Add special characters');
  
  // Final score and feedback
  const strengthMap = {
    0: 'Very Weak',
    1: 'Weak',
    2: 'Fair',
    3: 'Good',
    4: 'Strong',
    5: 'Very Strong'
  };
  
  return {
    score,
    strength: strengthMap[score],
    feedback: feedback.join(', ')
  };
}

// Format error messages
export function formatErrorMessage(error) {
  if (!error) return '';
  
  if (typeof error === 'string') return error;
  
  if (error.message) return error.message;
  
  return 'An unknown error occurred';
}

// Generate random avatar color
export function getAvatarColor(name) {
  const colors = [
    '#3949ab', // Indigo
    '#43a047', // Green
    '#e53935', // Red
    '#fb8c00', // Orange
    '#8e24aa', // Purple
    '#0288d1', // Light Blue
    '#00897b', // Teal
    '#c0ca33', // Lime
    '#6d4c41', // Brown
    '#546e7a'  // Blue Grey
  ];
  
  // Simple hash function to get consistent color for a name
  let hash = 0;
  if (name && name.length > 0) {
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
  }
  
  hash = Math.abs(hash) % colors.length;
  return colors[hash];
}

// Get initials from name
export function getInitials(name) {
  if (!name) return 'A';
  
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}