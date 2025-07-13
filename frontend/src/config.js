// API configuration for different environments
const environments = {
  development: {
    API_URL: 'http://localhost:3001',
    GOOGLE_CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID,
    enableDebugMode: true,
    apiTimeout: 30000, // 30 seconds
  },
  staging: {
    API_URL: 'https://staging-api.baguiopetboarding.com',
    GOOGLE_CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID,
    enableDebugMode: true,
    apiTimeout: 30000,
  },
  production: {
    API_URL: 'https://baguio-petboarding.onrender.com',
    GOOGLE_CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID,
    enableDebugMode: false,
    apiTimeout: 60000, // 1 minute
  }
};

// Determine environment based on URL or environment variable
const getEnvironment = () => {
  if (process.env.REACT_APP_ENVIRONMENT) {
    return process.env.REACT_APP_ENVIRONMENT;
  }
  
  const hostname = window.location.hostname;
  if (hostname === 'localhost') return 'development';
  if (hostname.includes('staging')) return 'staging';
  return 'production';
};

const currentEnv = getEnvironment();
const config = environments[currentEnv];

// Log the API URL being used for debugging
console.log('Using API URL:', config.API_URL);

// Export configuration values
export const { API_URL, GOOGLE_CLIENT_ID, enableDebugMode, apiTimeout } = config;
export default config;