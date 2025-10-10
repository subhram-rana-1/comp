/**
 * Build-time configuration for WXT
 * This file is used by the build system to configure permissions and other settings
 */

export const API_CONFIG = {
  // Development URL
  DEV_BASE_URL: 'http://localhost:8000',
  
  // Production URL  
  PROD_BASE_URL: 'https://caten-production.up.railway.app',
  
  // Additional URLs that might be needed
  ADDITIONAL_URLS: [
    'https://caten-blush.vercel.app/*' // Keep for backward compatibility
  ]
};

export const getHostPermissions = () => {
  return [
    `${API_CONFIG.DEV_BASE_URL}/*`,
    `${API_CONFIG.PROD_BASE_URL}/*`,
    ...API_CONFIG.ADDITIONAL_URLS
  ];
};
