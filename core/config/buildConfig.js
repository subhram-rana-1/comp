/**
 * Build-time configuration for WXT
 * This file is used by the build system to configure permissions and other settings
 */

export const API_CONFIG = {
  // Production URL  
  PROD_BASE_URL: 'https://caten-production.up.railway.app'
};

export const getHostPermissions = () => {
  return [
    `${API_CONFIG.PROD_BASE_URL}/*`
  ];
};
