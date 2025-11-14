/**
 * Environment configuration
 * Centralized access to environment variables with type safety
 */

export const env = {
  // API Configuration
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  
  // Application Environment
  ENV: (import.meta.env.VITE_ENV || 'development') as 'development' | 'staging' | 'production',
  APP_TITLE: import.meta.env.VITE_APP_TITLE || 'Barber Booking System',
  
  // Feature Flags
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  ENABLE_STORYBOOK: import.meta.env.VITE_ENABLE_STORYBOOK !== 'false',
  
  // Derived values
  isDevelopment: (import.meta.env.VITE_ENV || 'development') === 'development',
  isProduction: import.meta.env.VITE_ENV === 'production',
  isStaging: import.meta.env.VITE_ENV === 'staging',
};
