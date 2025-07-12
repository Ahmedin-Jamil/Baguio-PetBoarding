/**
 * Utility functions for consistent date handling across the application
 *
 * Updated: Adds robust UTC and ISO 8601 handling utilities for booking.
 * Fixed timezone handling to prevent date shifting between frontend and backend.
 */

/**
 * Parse a date string into a local Date object at noon to avoid timezone shifts
 * @param {string|Date} dateInput - Date string (YYYY-MM-DD) or Date object
 * @returns {Date} Date object set to noon local time
 */
export function parseLocalDate(dateInput) {
    if (!dateInput) return new Date();

    let year, month, day;

    // Handle YYYY-MM-DD format first
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        [year, month, day] = dateInput.split('-').map(Number);
        // Create date at noon local time to avoid timezone shifts
        const localDate = new Date(year, month - 1, day, 12, 0, 0, 0);
        // Add timezone offset to ensure it stays at the correct date
        const offset = localDate.getTimezoneOffset() * 60000; // Convert to milliseconds
        return new Date(localDate.getTime() + offset);
    }

    // If already a Date object
    if (dateInput instanceof Date) {
        year = dateInput.getFullYear();
        month = dateInput.getMonth();
        day = dateInput.getDate();
    } else {
        // Try standard parsing for other formats
        const parsed = new Date(dateInput);
        if (isNaN(parsed)) return new Date(); // Return current date if parsing fails
        year = parsed.getFullYear();
        month = parsed.getMonth();
        day = parsed.getDate();
    }

    // Create date at noon local time
    const localDate = new Date(year, month, day, 12, 0, 0, 0);
    // Add timezone offset to ensure it stays at the correct date
    const offset = localDate.getTimezoneOffset() * 60000; // Convert to milliseconds
    return new Date(localDate.getTime() + offset);
}

/**
 * Converts a local date string (YYYY-MM-DD), a time string (HH:MM), and AM/PM to a UTC ISO 8601 string.
 * @param {string} dateStr - Local date string (YYYY-MM-DD)
 * @param {string} timeStr - Time string (HH:MM)
 * @param {string} ampm - 'AM' or 'PM'
 * @returns {string} UTC ISO 8601 string
 */
export function toUTCISOStringFromLocal(dateStr, timeStr, ampm) {
  let [year, month, day] = dateStr.split('-').map(Number);
  let [hour, minute] = timeStr.split(':').map(Number);
  if (ampm === 'PM' && hour < 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0;
  // Create local Date object
  const localDate = new Date(year, month - 1, day, hour, minute, 0, 0);
  return localDate.toISOString(); // always ends with 'Z' (UTC)
}

/**
 * Formats a UTC ISO string for display in a local timezone using Intl API
 * @param {string} utcISOString - UTC ISO 8601 string
 * @param {string} timeZone - Timezone string (e.g., 'Asia/Manila')
 * @returns {string} Formatted date/time string
 */
export function formatDateForDisplayIntl(utcISOString, timeZone = 'Asia/Manila') {
  if (!utcISOString) return '-';
  const date = new Date(utcISOString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
    hour12: true, timeZone,
  }).format(date);
}

/**
 * Validates if a string is a UTC ISO 8601 string (YYYY-MM-DDTHH:MM:SS.sssZ)
 * @param {string} dateStr
 * @returns {boolean}
 */
export function isValidUTCDateString(dateStr) {
  return typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(dateStr);
}

/**
 * Converts a UTC ISO string to a local Date object (for validation/testing)
 * @param {string} utcISOString
 * @returns {Date}
 */
export function utcISOStringToLocalDate(utcISOString) {
  return new Date(utcISOString);
}

/**
 * Formats a date to YYYY-MM-DD format for API communication
 * @param {Date|string} date - Date object or string to format
 * @returns {string|null} Formatted date string or null if invalid
 */
export const formatDateForAPI = (date) => {
  if (!date) return null;
  
  // If already in YYYY-MM-DD format, return as is
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }
  
  // Convert string to Date if needed
  let dateObj = date;
  if (typeof date === 'string') {
    dateObj = new Date(date);
  }
  
  // Ensure valid Date object
  if (dateObj instanceof Date && !isNaN(dateObj)) {
    // Format as YYYY-MM-DD in LOCAL timezone (not UTC)
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  return null;
};

/**
 * Formats a date for display in the UI (MMM D, YYYY format)
 * @param {Date|string} date - Date object or string to format
 * @returns {string} Formatted date string or '-' if invalid
 */
export const formatDateForDisplay = (date) => {
  if (!date) return '-';
  
  let dateObj;
  
  // Handle string dates
  if (typeof date === 'string') {
    // Parse YYYY-MM-DD as local date
    const parts = date.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // JS months are 0-based
      const day = parseInt(parts[2], 10);
      dateObj = new Date(year, month, day);
    } else {
      // Try standard parsing for other formats
      dateObj = new Date(date);
    }
  } else if (date instanceof Date) {
    dateObj = date;
  } else {
    return '-';
  }
  
  // Ensure valid Date object
  if (isNaN(dateObj)) return '-';
  
  // Format consistently for display
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

/**
 * Formats a date range for display (e.g., "Jun 19, 2025 to Jun 20, 2025")
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {string} Formatted date range
 */
export const formatDateRangeForDisplay = (startDate, endDate) => {
  const start = formatDateForDisplay(startDate);
  const end = formatDateForDisplay(endDate);
  
  if (start === end || !endDate) {
    return start;
  }
  
  return `${start} to ${end}`;
};

/**
 * Formats a date for the booking confirmation page (YYYY/MM/DD format)
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDateForConfirmation = (date) => {
  const apiFormat = formatDateForAPI(date);
  return apiFormat ? apiFormat.replace(/-/g, '/') : '-';
};

/**
 * Creates a consistent Date object from various input formats
 * @param {Date|string|null} date - Input date
 * @returns {Date|null} Standardized Date object or null if invalid
 */
export const createConsistentDate = (date) => {
  if (!date) return null;
  
  // If it's already a Date object, create a new Date with just the date part (no time)
  if (date instanceof Date) {
    // Create a new date with no time component in local timezone
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
  }
  
  if (typeof date === 'string') {
    // Handle YYYY-MM-DD format (used by API)
    let parts = date.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // JS months are 0-based
      const day = parseInt(parts[2], 10);
      // Create date in local timezone
      return new Date(year, month, day, 0, 0, 0);
    }
    
    // Handle YYYY/MM/DD format (used in confirmation)
    parts = date.split('/');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // JS months are 0-based
      const day = parseInt(parts[2], 10);
      // Create date in local timezone
      return new Date(year, month, day, 0, 0, 0);
    }
    
    // Try standard parsing for other formats
    const parsed = new Date(date);
    if (!isNaN(parsed)) {
      // Create a new date with just the date part in local timezone
      return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 0, 0, 0);
    }
  }
  
  // If we can't parse it, return null
  console.warn('Could not parse date:', date);
  return null;
};

/**
 * Preserves the date exactly as entered without timezone adjustments
 * @param {Date|string} date - The date to preserve
 * @returns {Date} Date with the exact day preserved
 */
export const adjustDateForTimezone = (date) => {
  if (!date) return null;
  
  // If it's already a string in YYYY-MM-DD format, parse it directly without timezone conversion
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day); // month is 0-based in JS
  }
  
  // If it's a Date object or other string format, ensure we preserve the local date
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
};

/**
 * Convert a local date string (YYYY-MM-DD) to MySQL-compatible format
 * WITHOUT timezone conversion (prevents date shifting)
 * @param {Date|string} dateStr - Date object or string to convert
 * @returns {string|null} Date in YYYY-MM-DD format for MySQL DATE columns
 */
export const formatDateForMySQL = (dateStr) => {
  if (!dateStr) return null;
  
  // If already in YYYY-MM-DD format, return as is
  if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // If it's an ISO string with timezone (YYYY-MM-DDTHH:MM:SS.sssZ), extract date part
  if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(dateStr)) {
    return dateStr.slice(0, 10);
  }
  
  // If it's a Date object or other string format, extract date components in LOCAL timezone
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};
