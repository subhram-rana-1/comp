/**
 * Authentication Service
 * Handles authentication API calls to the backend server
 */

import ApiConfig from '../config/apiConfig.js';

class AuthService {
  /**
   * Login with Google OAuth id token
   * @param {string} idToken - Google OAuth id token
   * @returns {Promise<Object>} Response object with {success: boolean, data?: Object, error?: string}
   */
  static async login(idToken) {
    const url = `${ApiConfig.getCurrentBaseUrl()}${ApiConfig.ENDPOINTS.AUTH_LOGIN}`;
    
    try {
      console.log('[AuthService] Sending login request to:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify({
          authVendor: 'GOOGLE',
          idToken: idToken
        })
      });
      
      if (!response.ok) {
        let errorMessage = `Login failed: ${response.status} ${response.statusText}`;
        
        // Try to get more detailed error from response
        try {
          const errorData = await response.json();
          if (errorData.error || errorData.message) {
            errorMessage = errorData.error || errorData.message;
          }
        } catch (e) {
          // If we can't parse the error response, use the default message
          console.warn('[AuthService] Could not parse error response:', e);
        }
        
        console.error('[AuthService] Login failed:', errorMessage);
        return {
          success: false,
          error: errorMessage
        };
      }
      
      const data = await response.json();
      console.log('[AuthService] Login successful:', data);
      
      return {
        success: true,
        data: data
      };
      
    } catch (error) {
      console.error('[AuthService] Error during login:', error);
      
      let errorMessage = error.message;
      
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        errorMessage = 'Cannot connect to API server. Please check:\n' +
                      '1. Backend server is running at ' + ApiConfig.getCurrentBaseUrl() + '\n' +
                      '2. CORS is properly configured to allow requests from this origin';
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Logout with access token
   * @param {string} accessToken - User access token
   * @returns {Promise<Object>} Response object with {success: boolean, data?: Object, error?: string}
   */
  static async logout(accessToken) {
    const url = `${ApiConfig.getCurrentBaseUrl()}${ApiConfig.ENDPOINTS.AUTH_LOGOUT}`;
    
    try {
      console.log('[AuthService] Sending logout request to:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify({
          authVendor: 'GOOGLE',
          accessToken: accessToken
        })
      });
      
      if (!response.ok) {
        let errorMessage = `Logout failed: ${response.status} ${response.statusText}`;
        
        // Try to get more detailed error from response
        try {
          const errorData = await response.json();
          if (errorData.error || errorData.message) {
            errorMessage = errorData.error || errorData.message;
          }
        } catch (e) {
          // If we can't parse the error response, use the default message
          console.warn('[AuthService] Could not parse error response:', e);
        }
        
        console.error('[AuthService] Logout failed:', errorMessage);
        return {
          success: false,
          error: errorMessage
        };
      }
      
      const data = await response.json();
      console.log('[AuthService] Logout successful:', data);
      
      return {
        success: true,
        data: data
      };
      
    } catch (error) {
      console.error('[AuthService] Error during logout:', error);
      
      let errorMessage = error.message;
      
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        errorMessage = 'Cannot connect to API server. Please check:\n' +
                      '1. Backend server is running at ' + ApiConfig.getCurrentBaseUrl() + '\n' +
                      '2. CORS is properly configured to allow requests from this origin';
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }
}

// Export for use in other modules
export default AuthService;

