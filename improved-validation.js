// Debug file to identify issues with date validation
console.log('Debugging date validation');

// Get today's date for reference
const today = new Date();
console.log('Today is:', today.toString());
console.log('Today (ISO):', today.toISOString());

// Test date from screenshot
const testDate = new Date('June 9, 2025');
console.log('Test date is:', testDate.toString());
console.log('Test date (ISO):', testDate.toISOString());

// Compare years directly
console.log('\nDirect year comparison:');
console.log('Today year:', today.getFullYear());
console.log('Test date year:', testDate.getFullYear());
console.log('Is future year?', testDate.getFullYear() > today.getFullYear());

// Compare full dates directly
console.log('\nDirect date comparison:');
console.log('Is future date (using > operator)?', testDate > today);

// Normalized comparison (reset time components)
const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
const normalizedTest = new Date(testDate.getFullYear(), testDate.getMonth(), testDate.getDate());

console.log('\nNormalized comparison:');
console.log('Normalized today:', normalizedToday.toString());
console.log('Normalized test date:', normalizedTest.toString());
console.log('Is future date (normalized)?', normalizedTest > normalizedToday);

// Use timestamp comparison
console.log('\nTimestamp comparison:');
console.log('Today timestamp:', normalizedToday.getTime());
console.log('Test date timestamp:', normalizedTest.getTime());
console.log('Is future date (timestamp)?', normalizedTest.getTime() > normalizedToday.getTime());

// Rewrite the validation function to be more explicit
console.log('\nImproved validation function:');
function validateBirthDate(dateStr) {
  if (!dateStr) return { isValid: true, message: null };
  
  try {
    const inputDate = new Date(dateStr);
    const today = new Date();
    
    // Check if date is valid
    if (isNaN(inputDate.getTime())) {
      return { isValid: false, message: 'Invalid date format' };
    }
    
    // Explicit year check first
    if (inputDate.getFullYear() > today.getFullYear()) {
      console.log(`Year check failed: ${inputDate.getFullYear()} > ${today.getFullYear()}`);
      return { isValid: false, message: 'Birth date cannot be in a future year' };
    }
    
    // If same year, check month
    if (inputDate.getFullYear() === today.getFullYear() && 
        inputDate.getMonth() > today.getMonth()) {
      console.log(`Month check failed: ${inputDate.getMonth()} > ${today.getMonth()}`);
      return { isValid: false, message: 'Birth date cannot be in a future month' };
    }
    
    // If same year and month, check day
    if (inputDate.getFullYear() === today.getFullYear() && 
        inputDate.getMonth() === today.getMonth() && 
        inputDate.getDate() > today.getDate()) {
      console.log(`Day check failed: ${inputDate.getDate()} > ${today.getDate()}`);
      return { isValid: false, message: 'Birth date cannot be in the future' };
    }
    
    return { isValid: true, message: null };
  } catch (e) {
    return { isValid: false, message: `Error: ${e.message}` };
  }
}

// Test the improved function
const futureDate = 'June 9, 2025';
const pastDate = 'June 9, 2020';
const currentYear = 'June 9, ' + today.getFullYear();

console.log(`Testing '${futureDate}':`, validateBirthDate(futureDate));
console.log(`Testing '${pastDate}':`, validateBirthDate(pastDate));
console.log(`Testing '${currentYear}':`, validateBirthDate(currentYear));
