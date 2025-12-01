/**
 * Authenticated API Service
 * Wrapper for API calls with automatic authentication, device ID, and token refresh
 */

import ApiConfig from '../config/apiConfig.js';
import AuthService from './AuthService.js';

class AuthApiService {
  /**
   * Make an authenticated API request with automatic token refresh
   * @param {string} method - HTTP method (GET, POST, etc.)
   * @param {string} path - API path (e.g., '/api/v1/profile')
   * @param {Object|null} body - Request body (null for GET requests)
   * @param {Object} options - Additional options (headers, etc.)
   * @returns {Promise<Object>} Response data
   */
  static async apiRequest(method, path, body = null, options = {}) {
    const backendUrl = ApiConfig.getCurrentBaseUrl();
    const deviceId = await AuthService.getDeviceId();
    const accessToken = await AuthService.getAccessToken();

    // Build headers
    const headers = {
      'Content-Type': 'application/json',
      'X-DEVICE-ID': deviceId,
      ...options.headers
    };

    // Add Authorization header if access token exists
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    // Make the request
    const makeRequest = async (retryCount = 0) => {
      const url = path.startsWith('http') ? path : `${backendUrl}${path}`;
      
      const fetchOptions = {
        method,
        headers,
        credentials: 'omit',
        ...options
      };

      if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        fetchOptions.body = JSON.stringify(body);
      }

      try {
        const response = await fetch(url, fetchOptions);

        // Handle 401 Unauthorized
        if (response.status === 401) {
          // Parse error response
          let errorData = {};
          try {
            errorData = await response.json();
          } catch (e) {
            console.warn('[AuthApiService] Could not parse 401 error response');
          }

          const errorCode = errorData.error_code;

          // Only retry once
          if (retryCount >= 1) {
            throw new Error(errorData.error || 'Authentication failed after retry');
          }

          // Handle ACCESS_TOKEN_EXPIRED - try to refresh
          if (errorCode === 'ACCESS_TOKEN_EXPIRED') {
            console.log('[AuthApiService] Access token expired, attempting refresh...');
            try {
              await AuthService.refreshAccessToken();
              // Retry the original request with new token
              const newAccessToken = await AuthService.getAccessToken();
              if (newAccessToken) {
                headers['Authorization'] = `Bearer ${newAccessToken}`;
                return makeRequest(retryCount + 1);
              }
            } catch (refreshError) {
              console.error('[AuthApiService] Token refresh failed:', refreshError);
              // Refresh failed, trigger sign-in flow
              throw new Error('TOKEN_REFRESH_FAILED');
            }
          }

          // Handle TOKEN_NOT_PROVIDED_LIMIT_EXCEEDED or INVALID_ACCESS_TOKEN - trigger sign-in
          if (errorCode === 'TOKEN_NOT_PROVIDED_LIMIT_EXCEEDED' || 
              errorCode === 'INVALID_ACCESS_TOKEN') {
            console.log('[AuthApiService] Invalid or missing token, sign-in required');
            throw new Error('SIGN_IN_REQUIRED');
          }

          // Other 401 errors - show user-friendly message
          throw new Error(errorData.error || 'Authentication required');
        }

        // Handle other error status codes
        if (!response.ok) {
          let errorData = {};
          try {
            errorData = await response.json();
          } catch (e) {
            // Not JSON, use status text
          }
          const error = new Error(errorData.error || `Request failed: ${response.status} ${response.statusText}`);
          error.status = response.status;
          error.data = errorData;
          throw error;
        }

        // Success - parse and return JSON
        const data = await response.json();
        return data;
      } catch (error) {
        // Re-throw authentication errors
        if (error.message === 'TOKEN_REFRESH_FAILED' || error.message === 'SIGN_IN_REQUIRED') {
          throw error;
        }
        // Re-throw other errors
        throw error;
      }
    };

    return makeRequest();
  }

  /**
   * GET request helper
   * @param {string} path - API path
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Response data
   */
  static async get(path, options = {}) {
    return this.apiRequest('GET', path, null, options);
  }

  /**
   * POST request helper
   * @param {string} path - API path
   * @param {Object|null} body - Request body
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Response data
   */
  static async post(path, body = null, options = {}) {
    return this.apiRequest('POST', path, body, options);
  }

  /**
   * PUT request helper
   * @param {string} path - API path
   * @param {Object|null} body - Request body
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Response data
   */
  static async put(path, body = null, options = {}) {
    return this.apiRequest('PUT', path, body, options);
  }

  /**
   * DELETE request helper
   * @param {string} path - API path
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Response data
   */
  static async delete(path, options = {}) {
    return this.apiRequest('DELETE', path, null, options);
  }
}

export default AuthApiService;

