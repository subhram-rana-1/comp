/**
 * API Service Class
 * Handles all API calls to the backend server
 */

import ApiConfig from '../config/apiConfig.js';

class ApiService {
  // Use centralized config for base URL
  static get BASE_URL() {
    return ApiConfig.getCurrentBaseUrl();
  }
  
  // API endpoints - use centralized config
  static ENDPOINTS = ApiConfig.ENDPOINTS;
  
  // Access token storage (in-memory)
  static _accessToken = null;
  
  /**
   * Set access token for authenticated API calls
   * @param {string} token - The access token
   */
  static setAccessToken(token) {
    this._accessToken = token;
    console.log('[ApiService] Access token set in memory');
  }
  
  /**
   * Get access token for authenticated API calls
   * If not in memory, tries to load from storage
   * @returns {Promise<string|null>} The access token or null
   */
  static async getAccessToken() {
    // If token is in memory, return it
    if (this._accessToken) {
      return this._accessToken;
    }
    
    // Try to load from storage
    try {
      const result = await chrome.storage.local.get(['xplaino_userAccountData']);
      console.log('[ApiService] Storage get result keys:', Object.keys(result));
      const userData = result['xplaino_userAccountData'];
      console.log('[ApiService] UserData type:', typeof userData);
      console.log('[ApiService] UserData is null/undefined:', userData === null || userData === undefined);
      
      if (userData) {
        console.log('[ApiService] UserData keys:', Object.keys(userData));
        console.log('[ApiService] UserData structure (first level):', JSON.stringify(Object.keys(userData).reduce((acc, key) => {
          if (key === 'accessToken' || key === 'access_token') {
            acc[key] = userData[key] ? userData[key].substring(0, 20) + '...' : null;
          } else {
            acc[key] = typeof userData[key];
          }
          return acc;
        }, {}), null, 2));
        
        // Check for accessToken at top level
        if (userData.accessToken || userData.access_token) {
          const token = userData.accessToken || userData.access_token;
          this._accessToken = token;
          console.log('[ApiService] ✓ Access token loaded from storage (top level)');
          return token;
        } else {
          console.warn('[ApiService] ⚠ Access token not found at top level of userData');
          console.warn('[ApiService] Available keys:', Object.keys(userData));
        }
      } else {
        console.warn('[ApiService] ⚠ userData is null or undefined');
      }
    } catch (error) {
      console.warn('[ApiService] Error loading access token from storage:', error);
      console.warn('[ApiService] Error details:', error.message, error.stack);
    }
    
    return null;
  }
  
  /**
   * Load access token from chrome.storage.local
   * @returns {Promise<void>}
   */
  static async loadAccessTokenFromStorage() {
    try {
      const result = await chrome.storage.local.get(['xplaino_userAccountData']);
      console.log('[ApiService] Initialization - Storage get result keys:', Object.keys(result));
      const userData = result['xplaino_userAccountData'];
      console.log('[ApiService] Initialization - UserData type:', typeof userData);
      console.log('[ApiService] Initialization - UserData is null/undefined:', userData === null || userData === undefined);
      
      if (userData) {
        console.log('[ApiService] Initialization - UserData keys:', Object.keys(userData));
        console.log('[ApiService] Initialization - UserData structure (first level):', JSON.stringify(Object.keys(userData).reduce((acc, key) => {
          if (key === 'accessToken' || key === 'access_token') {
            acc[key] = userData[key] ? userData[key].substring(0, 20) + '...' : null;
          } else {
            acc[key] = typeof userData[key];
          }
          return acc;
        }, {}), null, 2));
        
        // Check for accessToken at top level
        if (userData.accessToken || userData.access_token) {
          const token = userData.accessToken || userData.access_token;
          this._accessToken = token;
          console.log('[ApiService] ✓ Access token loaded from storage on initialization (top level)');
        } else {
          console.warn('[ApiService] ⚠ No access token found at top level of userData on initialization');
          console.warn('[ApiService] Available keys:', Object.keys(userData));
        }
      } else {
        console.log('[ApiService] No user account data found in storage');
      }
    } catch (error) {
      console.warn('[ApiService] Error loading access token from storage:', error);
      console.warn('[ApiService] Error details:', error.message, error.stack);
    }
  }
  
  /**
   * Clear access token
   */
  static clearAccessToken() {
    this._accessToken = null;
    console.log('[ApiService] Access token cleared from memory');
  }
  
  /**
   * Refresh access token using refresh token cookie
   * @returns {Promise<Object>} Result object with {success: boolean, accessToken?: string, error?: string}
   */
  static async refreshToken() {
    const url = `${this.BASE_URL}${this.ENDPOINTS.AUTH_REFRESH_TOKEN}`;
    
    try {
      console.log('[ApiService] ===== REFRESH TOKEN REQUEST =====');
      console.log('[ApiService] Refreshing token at:', url);
      
      // Get current access token for Authorization header
      const currentAccessToken = await this.getAccessToken();
      if (!currentAccessToken) {
        console.warn('[ApiService] No current access token available for refresh request');
        return {
          success: false,
          error: 'No access token available'
        };
      }
      
      // Prepare request headers
      const requestHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentAccessToken}`
      };
      
      console.log('[ApiService] Making refresh token request with Authorization header');
      
      // Make the refresh token request
      // credentials: 'include' ensures cookies (including refreshToken) are sent
      // NOTE: Browser will automatically send an OPTIONS preflight request before this POST
      // because we're using credentials: 'include' and custom headers (Authorization, Content-Type)
      // The backend MUST handle OPTIONS requests and return proper CORS headers
      const response = await fetch(url, {
        method: 'POST',
        headers: requestHeaders,
        mode: 'cors',
        credentials: 'include' // This sends the refreshToken cookie (httpOnly)
      });
      
      if (!response.ok) {
        console.log('[ApiService] Refresh token request failed, status:', response.status);
        
        // Clone response for error handling
        const responseClone = response.clone();
        let errorData = null;
        let errorCode = null;
        
        try {
          const text = await response.text();
          if (text) {
            try {
              errorData = JSON.parse(text);
              // Check for errorCode in nested detail structure
              if (errorData.detail && typeof errorData.detail === 'object' && typeof errorData.detail.errorCode === 'string') {
                errorCode = errorData.detail.errorCode;
              } else if (typeof errorData.errorCode === 'string') {
                errorCode = errorData.errorCode;
              }
            } catch (parseError) {
              console.warn('[ApiService] Could not parse refresh token error response:', parseError);
            }
          }
        } catch (readError) {
          console.warn('[ApiService] Could not read refresh token error response:', readError);
        }
        
        // If errorCode is LOGIN_REQUIRED, dispatch event and return error
        if (errorCode === 'LOGIN_REQUIRED') {
          console.log('[ApiService] ===== LOGIN_REQUIRED IN REFRESH TOKEN =====');
          const reason = errorData?.detail?.message || errorData?.detail?.reason || errorData?.message || 'Please sign in to continue';
          
          // Dispatch custom event for content script to show login modal
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('api-login-required', {
              detail: { reason, status: response.status, apiEndpoint: 'AUTH_REFRESH_TOKEN' }
            }));
            console.log('[ApiService] ✓ api-login-required event dispatched from refresh token');
          } else {
            console.warn('[ApiService] ⚠ window is undefined, cannot dispatch event');
          }
          
          return {
            success: false,
            error: 'LOGIN_REQUIRED',
            errorCode: 'LOGIN_REQUIRED',
            message: reason
          };
        }
        
        // Other errors
        const errorMessage = errorData?.detail?.message || errorData?.message || `Refresh token failed: ${response.status} ${response.statusText}`;
        console.error('[ApiService] Refresh token error:', errorMessage);
        return {
          success: false,
          error: errorMessage,
          status: response.status
        };
      }
      
      // Success - parse response
      const data = await response.json();
      console.log('[ApiService] Refresh token response received');
      console.log('[ApiService] Response data keys:', Object.keys(data));
      
      // Extract access_token from response
      const newAccessToken = data.access_token;
      if (!newAccessToken) {
        console.error('[ApiService] No access_token in refresh token response');
        return {
          success: false,
          error: 'No access_token in refresh token response'
        };
      }
      
      console.log('[ApiService] New access token received (length:', newAccessToken.length, ')');
      
      // Update in-memory access token
      this.setAccessToken(newAccessToken);
      console.log('[ApiService] ✓ Access token updated in memory');
      
      // Update access token in chrome.storage.local
      try {
        const result = await chrome.storage.local.get(['xplaino_userAccountData']);
        const userData = result['xplaino_userAccountData'];
        
        if (userData) {
          // Update both accessToken and access_token for compatibility
          userData.accessToken = newAccessToken;
          userData.access_token = newAccessToken;
          
          // Save updated user data
          await chrome.storage.local.set({ 'xplaino_userAccountData': userData });
          console.log('[ApiService] ✓ Access token updated in chrome.storage.local');
        } else {
          console.warn('[ApiService] ⚠ No user account data found in storage, cannot update access token');
        }
      } catch (storageError) {
        console.error('[ApiService] Error updating access token in storage:', storageError);
        // Continue even if storage update fails - in-memory token is updated
      }
      
      // Note: refreshToken cookie is automatically saved by the browser when credentials: 'include' is used
      // No manual cookie handling needed
      
      console.log('[ApiService] ===== REFRESH TOKEN SUCCESS =====');
      
      return {
        success: true,
        accessToken: newAccessToken
      };
      
    } catch (error) {
      console.error('[ApiService] Error during token refresh:', error);
      
      let errorMessage = error.message;
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        errorMessage = 'Unable to connect to the API server for token refresh. This could be due to:\n' +
                      '1. Backend server is not running at ' + this.BASE_URL + '\n' +
                      '2. Network connectivity issues - check your internet connection\n' +
                      '3. CORS configuration - ensure the backend allows requests from this origin\n' +
                      '4. Firewall or security settings blocking the connection\n\n' +
                      'Please verify the backend server is running and accessible.';
      } else if (error.status) {
        errorMessage = `Token refresh failed (${error.status}): ${error.message}`;
      } else {
        errorMessage = `Token refresh failed: ${error.message}`;
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }
  
  /**
   * Store X-Unauthenticated-User-Id header from response in chrome.storage.local
   * @param {Response} response - Fetch response object
   */
  static async storeUnauthenticatedUserId(response) {
    try {
      // Try to get header with different case variations (HTTP headers are case-insensitive but Headers API might be case-sensitive)
      let headerValue = response.headers.get('X-Unauthenticated-User-Id');
      if (!headerValue) {
        headerValue = response.headers.get('x-unauthenticated-user-id');
      }
      if (!headerValue) {
        // Try to find it case-insensitively by iterating
        for (const [key, value] of response.headers.entries()) {
          if (key.toLowerCase() === 'x-unauthenticated-user-id') {
            headerValue = value;
            break;
          }
        }
      }
      
      if (headerValue) {
        console.log('[X-UNAUTH-RECEIVED] Received X-Unauthenticated-User-Id from API response:', headerValue);
        console.log('[X-UNAUTH-RECEIVED] Storing in chrome.storage.local with key: x-unauthenticated-user-id');
        await chrome.storage.local.set({ 'x-unauthenticated-user-id': headerValue });
        console.log('[ApiService] ✓ Stored X-Unauthenticated-User-Id in chrome.storage.local:', headerValue);
        
        // Verify storage by reading it back immediately
        const verifyResult = await chrome.storage.local.get(['x-unauthenticated-user-id']);
        console.log('[X-UNAUTH-RECEIVED] Verification - Storage get result:', JSON.stringify(verifyResult));
        if (verifyResult['x-unauthenticated-user-id'] === headerValue) {
          console.log('[ApiService] ✓ Verified: X-Unauthenticated-User-Id successfully stored and retrievable');
          console.log('[X-UNAUTH-RECEIVED] Stored value:', verifyResult['x-unauthenticated-user-id']);
        } else {
          console.warn('[ApiService] ⚠ Warning: Stored value does not match retrieved value. Stored:', headerValue, 'Retrieved:', verifyResult['x-unauthenticated-user-id']);
        }
      } else {
        console.log('[ApiService] X-Unauthenticated-User-Id header not found in response');
        console.log('[X-UNAUTH-RECEIVED] No X-Unauthenticated-User-Id header in response - checking all response headers:');
        const allHeaders = {};
        response.headers.forEach((value, key) => {
          allHeaders[key] = value;
        });
        console.log('[X-UNAUTH-RECEIVED] All response headers:', JSON.stringify(allHeaders, null, 2));
      }
    } catch (error) {
      console.warn('[ApiService] Error storing X-Unauthenticated-User-Id:', error);
    }
  }
  
  /**
   * Add Authorization header to request headers if access token is available
   * @param {Object} headers - Request headers object
   */
  static async addAuthorizationHeader(headers) {
    const accessToken = await this.getAccessToken();
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      console.log('[ApiService] Authorization header added with access token');
    } else {
      console.log('[ApiService] No access token available, skipping Authorization header');
    }
  }
  
  /**
   * Get X-Unauthenticated-User-Id header value from chrome.storage.local for request headers
   * @returns {Promise<Object>} Object with header key-value pair or empty object
   */
  static async getUnauthenticatedUserIdHeader() {
    try {
      console.log('[X-UNAUTH-SENDING] Attempting to retrieve X-Unauthenticated-User-Id from chrome.storage.local...');
      const result = await chrome.storage.local.get(['x-unauthenticated-user-id']);
      console.log('[X-UNAUTH-SENDING] Storage get result:', JSON.stringify(result));
      const userId = result['x-unauthenticated-user-id'];
      if (userId) {
        console.log('[ApiService] ✓ Retrieved X-Unauthenticated-User-Id from chrome.storage.local:', userId);
        console.log('[X-UNAUTH-SENDING] Sending X-Unauthenticated-User-Id in request header:', userId);
        const headerObj = { 'X-Unauthenticated-User-Id': userId };
        console.log('[X-UNAUTH-SENDING] Returning header object:', JSON.stringify(headerObj));
        return headerObj;
      } else {
        console.log('[X-UNAUTH-SENDING] X-Unauthenticated-User-Id not found in chrome.storage.local - will not send header');
        console.log('[X-UNAUTH-SENDING] Storage result was:', result);
      }
      return {};
    } catch (error) {
      console.warn('[ApiService] Error getting X-Unauthenticated-User-Id from storage:', error);
      console.warn('[X-UNAUTH-SENDING] Error details:', error.message, error.stack);
      return {};
    }
  }
  
  /**
   * Centralized API error handler
   * Validates error response payload structure and dispatches appropriate UI events
   * @param {Response} response - Fetch response object
   * @param {string} apiEndpoint - Optional API endpoint name (e.g., 'WORDS_EXPLANATION', 'SIMPLIFY')
   * @returns {Promise<Object>} Error object with {errorCode?, reason?, message, status}
   */
  static async handleApiError(response, apiEndpoint = null) {
    const status = response.status;
    let errorData = null;
    let errorMessage = `API request failed: ${status} ${response.statusText}`;
    
    // PRIORITY: Always parse response body FIRST, before any UI decisions
    // This ensures we check errorCode regardless of HTTP status (401, 429, etc.)
    let rawResponseText = null;
    try {
      const text = await response.text();
      rawResponseText = text;
      console.log('[ApiService] ===== ERROR RESPONSE DEBUG =====');
      console.log('[ApiService] HTTP Status:', status);
      console.log('[ApiService] Raw response text:', rawResponseText);
      
      if (text) {
        try {
          errorData = JSON.parse(text);
          console.log('[ApiService] Parsed errorData:', JSON.stringify(errorData, null, 2));
          console.log('[ApiService] errorData type:', typeof errorData);
          console.log('[ApiService] errorData.errorCode (direct):', errorData?.errorCode);
          console.log('[ApiService] errorData.detail:', errorData?.detail);
          console.log('[ApiService] errorData.detail?.errorCode (nested):', errorData?.detail?.errorCode);
        } catch (parseError) {
          console.warn('[ApiService] Error response is not valid JSON:', parseError);
          console.warn('[ApiService] Failed to parse text:', text);
        }
      } else {
        console.log('[ApiService] Response text is empty');
      }
    } catch (readError) {
      console.warn('[ApiService] Could not read error response body:', readError);
    }
    
    // Check for errorCode in multiple possible locations:
    // 1. Direct: errorData.errorCode
    // 2. Nested: errorData.detail.errorCode (common in FastAPI/Pydantic responses)
    let errorCode = null;
    let reason = null;
    let errorCodePath = null;
    
    if (errorData && typeof errorData === 'object') {
      // Check direct path first
      if (typeof errorData.errorCode === 'string') {
        errorCode = errorData.errorCode;
        reason = errorData.reason || errorData.message || errorMessage;
        errorCodePath = 'direct';
        console.log('[ApiService] Found errorCode via direct path:', errorCode);
      }
      // Check nested detail path
      else if (errorData.detail && typeof errorData.detail === 'object' && typeof errorData.detail.errorCode === 'string') {
        errorCode = errorData.detail.errorCode;
        reason = errorData.detail.reason || errorData.detail.message || errorData.message || errorMessage;
        errorCodePath = 'nested (detail)';
        console.log('[ApiService] Found errorCode via nested detail path:', errorCode);
      }
    }
    
    // If we found an errorCode, handle it
    if (errorCode) {
      console.log('[ApiService] Processing errorCode:', errorCode, '(found via', errorCodePath, 'path)');
      console.log('[ApiService] Reason/message:', reason);
      
      // LOGIN_REQUIRED takes priority - show login modal, NO error banner
      if (errorCode === 'LOGIN_REQUIRED') {
        console.log('[ApiService] ===== LOGIN_REQUIRED DETECTED =====');
        console.log('[ApiService] Status:', status);
        console.log('[ApiService] Reason:', reason);
        console.log('[ApiService] Dispatching api-login-required event...');
        
        // Dispatch custom event for content script to show login modal
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('api-login-required', {
            detail: { reason, status, apiEndpoint }
          }));
          console.log('[ApiService] ✓ api-login-required event dispatched with apiEndpoint:', apiEndpoint);
        } else {
          console.warn('[ApiService] ⚠ window is undefined, cannot dispatch event');
        }
        
        console.log('[ApiService] ===== LOGIN_REQUIRED HANDLED =====');
        
        return {
          errorCode: 'LOGIN_REQUIRED',
          reason,
          message: reason || 'Please sign in to continue',
          status
        };
      }
      
      // TOKEN_EXPIRED - automatically refresh token
      if (errorCode === 'TOKEN_EXPIRED') {
        console.log('[ApiService] ===== TOKEN_EXPIRED DETECTED =====');
        console.log('[ApiService] Status:', status);
        console.log('[ApiService] Attempting to refresh token...');
        
        // Attempt to refresh the token
        const refreshResult = await this.refreshToken();
        
        if (refreshResult.success) {
          console.log('[ApiService] ✓ Token refreshed successfully');
          console.log('[ApiService] ===== TOKEN_REFRESHED =====');
          
          // Return special indicator that token was refreshed and request should be retried
          return {
            errorCode: 'TOKEN_REFRESHED',
            shouldRetry: true,
            message: 'Token refreshed successfully',
            status
          };
        } else {
          // Refresh failed - check if it's LOGIN_REQUIRED
          if (refreshResult.errorCode === 'LOGIN_REQUIRED') {
            console.log('[ApiService] Refresh token failed with LOGIN_REQUIRED');
            // Login modal already dispatched in refreshToken()
            return {
              errorCode: 'LOGIN_REQUIRED',
              reason: refreshResult.message || reason,
              message: refreshResult.message || 'Please sign in to continue',
              status: refreshResult.status || status
            };
          }
          
          // Other refresh errors
          console.error('[ApiService] Token refresh failed:', refreshResult.error);
          return {
            errorCode: 'TOKEN_REFRESH_FAILED',
            reason: refreshResult.error || reason,
            message: refreshResult.error || 'Token refresh failed',
            status: refreshResult.status || status
          };
        }
      }
      
      // REFRESH_TOKEN - TODO, but don't show error banner
      if (errorCode === 'REFRESH_TOKEN') {
        console.log('[ApiService] REFRESH_TOKEN error detected (status:', status, ')');
        // TODO: Implement refresh token handling
        
        return {
          errorCode: 'REFRESH_TOKEN',
          reason,
          message: reason || 'Token refresh required',
          status
        };
      }
      
      // Other error codes with valid structure - show error banner with reason
      console.log('[ApiService] Error with code:', errorCode, '(status:', status, '), showing error banner');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('api-error-banner', {
          detail: { message: reason || errorMessage, status, errorCode }
        }));
      }
      
      return {
        errorCode,
        reason,
        message: reason || errorMessage,
        status
      };
    }
    
    // No errorCode found or invalid structure - show error banner
    // Only reach here if errorCode is not present in response body
    console.log('[ApiService] ===== NO ERROR CODE FOUND =====');
    console.log('[ApiService] Error response has no errorCode or invalid structure (status:', status, ')');
    console.log('[ApiService] errorData structure:', JSON.stringify(errorData, null, 2));
    const message = errorData?.error || errorData?.message || errorData?.detail?.message || errorMessage;
    console.log('[ApiService] Extracted message:', message);
    
    // Dispatch custom event for content script to handle
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('api-error-banner', {
        detail: { message, status }
      }));
    }
    
    return {
      message,
      status,
      errorData: errorData || {}
    };
  }
  
  /**
   * Ask a question with context and chat history (SSE streaming)
   * @param {Object} params - Request parameters
   * @param {string} params.initial_context - The original selected text
   * @param {Array} params.chat_history - Previous chat messages [{role, content}]
   * @param {string} params.question - The user's question
   * @param {Function} params.onChunk - Callback for each chunk event: (chunk, accumulated) => void
   * @param {Function} params.onComplete - Callback when stream completes: (chat_history) => void
   * @param {Function} params.onError - Callback for errors: (error) => void
   * @returns {Function} Abort function to cancel the request
   */
  static async ask({ initial_context, chat_history = [], question, context_type, onChunk, onComplete, onError }) {
    const url = `${this.BASE_URL}${this.ENDPOINTS.ASK}`;
    
    // Validate input parameters
    if (!initial_context || typeof initial_context !== 'string') {
      const error = new Error('initial_context is required and must be a string');
      if (onError) onError(error);
      return () => {};
    }
    if (!question || typeof question !== 'string') {
      const error = new Error('question is required and must be a string');
      if (onError) onError(error);
      return () => {};
    }
    if (!Array.isArray(chat_history)) {
      const error = new Error('chat_history must be an array');
      if (onError) onError(error);
      return () => {};
    }
    
    // Check for reasonable size limits
    if (initial_context.length > 100000) {
      console.warn('[ApiService] initial_context is very large (' + initial_context.length + ' chars), this might cause API errors');
    }
    if (question.length > 10000) {
      console.warn('[ApiService] question is very large (' + question.length + ' chars), this might cause API errors');
    }
    
    // Get language code from global storage (shared across all tabs and domains)
    const getLanguageCode = async () => {
      try {
        // Get language from chrome.storage.local (global)
        const storageKey = 'language';
        const result = await chrome.storage.local.get([storageKey]);
        const language = result[storageKey] || 'WEBSITE_LANGUAGE';
        
        // If language is "WEBSITE_LANGUAGE", "none", or "dynamic", return null (use page language)
        if (language === 'WEBSITE_LANGUAGE' || language === 'none' || language === 'dynamic') {
          return null;
        }
        // Otherwise, convert to uppercase (e.g., "Spanish" -> "SPANISH")
        return language.toUpperCase();
      } catch (error) {
        console.warn('[ApiService] Error getting language from storage:', error);
        return null;
      }
    };
    
    // Get language code asynchronously
    const languageCode = await getLanguageCode();
    
    const requestBody = {
      initial_context,
      chat_history,
      question
    };
    
    // Only include languageCode if it's not null
    if (languageCode !== null) {
      requestBody.languageCode = languageCode;
    }
    
    // Include context_type if provided
    if (context_type) {
      requestBody.context_type = context_type;
    }
    
    try {
      console.log('[ApiService] Sending SSE request to:', url);
      console.log('[ApiService] Request body size:', {
        initial_context_length: initial_context.length,
        chat_history_length: chat_history.length,
        question_length: question.length
      });
      console.log('[ApiService] Request payload structure:', {
        context_type: context_type || 'not provided',
        initial_context: initial_context.substring(0, 100) + (initial_context.length > 100 ? '...' : ''),
        chat_history: chat_history,
        question: question.substring(0, 100) + (question.length > 100 ? '...' : ''),
        languageCode: languageCode || 'not provided'
      });
      
      // Create abort controller for cancellation
      const abortController = new AbortController();
      
      // Get X-Unauthenticated-User-Id header for request
      const unauthenticatedUserIdHeader = await this.getUnauthenticatedUserIdHeader();
      console.log('[X-UNAUTH-SENDING] Header object from getUnauthenticatedUserIdHeader():', JSON.stringify(unauthenticatedUserIdHeader));
      
      // Prepare request headers
      const requestHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        ...unauthenticatedUserIdHeader
      };
      
      // Add Authorization header if access token is available
      await this.addAuthorizationHeader(requestHeaders);
      
      // Log request headers for debugging
      console.log('[ApiService] Request headers being sent:', Object.keys(requestHeaders));
      if (requestHeaders['X-Unauthenticated-User-Id']) {
        console.log('[X-UNAUTH-SENDING] ✓ X-Unauthenticated-User-Id header included in request:', requestHeaders['X-Unauthenticated-User-Id']);
        console.log('[X-UNAUTH-SENDING] Full request headers object:', JSON.stringify(requestHeaders, null, 2));
      } else {
        console.log('[X-UNAUTH-SENDING] ⚠ X-Unauthenticated-User-Id header NOT included in request');
        console.log('[X-UNAUTH-SENDING] Full request headers object:', JSON.stringify(requestHeaders, null, 2));
      }
      
      let response = await fetch(url, {
        method: 'POST',
        headers: requestHeaders,
        mode: 'cors',
        body: JSON.stringify(requestBody),
        signal: abortController.signal
      });
      
      // Store X-Unauthenticated-User-Id from response header
      await this.storeUnauthenticatedUserId(response);
      
      if (!response.ok) {
        // Clone response for error handling (response body can only be read once)
        const responseClone = response.clone();
        const errorInfo = await this.handleApiError(responseClone, 'ASK');
        
        // If it's LOGIN_REQUIRED, the modal will be shown via event, but we still need to call onError
        if (errorInfo.errorCode === 'LOGIN_REQUIRED') {
          const error = new Error(errorInfo.message);
          error.status = errorInfo.status;
          error.errorCode = errorInfo.errorCode;
          if (onError) onError(error);
          return () => {};
        }
        
        // For other errors, create error object and call onError
        const error = new Error(errorInfo.message);
        error.status = errorInfo.status;
        if (errorInfo.errorCode) {
          error.errorCode = errorInfo.errorCode;
        }
        if (onError) onError(error);
        return () => {};
      }
      
      // Process the SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let completeEventData = null; // Store complete event data to prevent [DONE] from overwriting it
      let onCompleteCalled = false; // Track if onComplete was already called with complete event data
      
      // Read the stream
      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              console.log('[ApiService] Stream complete');
              // If we have complete event data and haven't called onComplete yet, use it
              // Otherwise, if we already called onComplete with complete event, don't call it again
              if (completeEventData && !onCompleteCalled) {
                console.log('[ApiService] Stream ended, using stored complete event data');
                if (onComplete) {
                  onComplete(completeEventData.chat_history || null, completeEventData.possibleQuestions || []);
                  onCompleteCalled = true;
                }
              } else if (!onCompleteCalled && onComplete) {
                console.log('[ApiService] Stream ended without complete event, calling onComplete(null)');
                onComplete(null);
                onCompleteCalled = true;
              } else {
                console.log('[ApiService] Stream ended, onComplete already called with complete event data');
              }
              break;
            }
            
            // Decode the chunk
            buffer += decoder.decode(value, { stream: true });
            
            // Process complete lines
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer
            
            for (const line of lines) {
              if (line.trim() === '') continue;
              
              // SSE format: "data: {json}" or "data: [DONE]"
              if (line.startsWith('data: ')) {
                const dataStr = line.slice(6).trim();
                
                // Check for completion signal
                if (dataStr === '[DONE]') {
                  console.log('[ApiService] Received [DONE] signal');
                  // Don't call onComplete here - let the stream end naturally
                  // This prevents [DONE] from overwriting complete event data
                  continue; // Continue processing instead of breaking
                }
                
                // Parse JSON data
                try {
                  const data = JSON.parse(dataStr);
                  console.log('[ApiService] Received event:', data);
                  
                  // Handle chunk events
                  if (data.chunk !== undefined) {
                    console.log('[ApiService] Chunk event - chunk:', data.chunk, 'accumulated:', data.accumulated);
                    if (onChunk) {
                      onChunk(data.chunk, data.accumulated);
                    }
                  }
                  
                  // Handle complete event
                  if (data.type === 'complete') {
                    console.log('[ApiService] ===== COMPLETE EVENT RECEIVED =====');
                    console.log('[ApiService] Complete event data:', JSON.stringify(data, null, 2));
                    console.log('[ApiService] chat_history present:', !!data.chat_history);
                    console.log('[ApiService] chat_history type:', typeof data.chat_history);
                    console.log('[ApiService] chat_history is array:', Array.isArray(data.chat_history));
                    console.log('[ApiService] possibleQuestions present:', !!data.possibleQuestions);
                    console.log('[ApiService] possibleQuestions type:', typeof data.possibleQuestions);
                    console.log('[ApiService] possibleQuestions is array:', Array.isArray(data.possibleQuestions));
                    console.log('[ApiService] possibleQuestions value:', data.possibleQuestions);
                    console.log('[ApiService] possibleQuestions length:', data.possibleQuestions?.length || 0);
                    console.log('[ApiService] All data keys:', Object.keys(data));
                    
                    // Extract possibleQuestions - check multiple possible field names
                    let questions = data.possibleQuestions;
                    if (!questions && data.possible_questions) {
                      console.log('[ApiService] Found possible_questions (snake_case) instead of possibleQuestions');
                      questions = data.possible_questions;
                    }
                    if (!questions && data['possible-questions']) {
                      console.log('[ApiService] Found possible-questions (kebab-case) instead of possibleQuestions');
                      questions = data['possible-questions'];
                    }
                    
                    console.log('[ApiService] Final extracted questions:', questions);
                    console.log('[ApiService] Final extracted questions length:', questions?.length || 0);
                    
                    // Store complete event data instead of calling onComplete immediately
                    // This prevents [DONE] signal from overwriting it
                    completeEventData = {
                      chat_history: data.chat_history || null,
                      possibleQuestions: questions || []
                    };
                    
                    console.log('[ApiService] Stored complete event data:', completeEventData);
                    console.log('[ApiService] Stored possibleQuestions:', completeEventData.possibleQuestions);
                    console.log('[ApiService] ===== COMPLETE EVENT HANDLED =====');
                    
                    // Call onComplete immediately with the data
                    if (onComplete && !onCompleteCalled) {
                      console.log('[ApiService] Calling onComplete with stored data');
                      onComplete(completeEventData.chat_history, completeEventData.possibleQuestions);
                      onCompleteCalled = true;
                    } else if (onCompleteCalled) {
                      console.log('[ApiService] onComplete already called, skipping duplicate call');
                    }
                  }
                  
                  // Handle error events
                  if (data.type === 'error' || data.error) {
                    const error = new Error(data.error || data.message || 'Stream error occurred');
                    console.error('[ApiService] Error event:', error);
                    if (onError) {
                      onError(error);
                    }
                  }
                } catch (parseError) {
                  console.error('[ApiService] Error parsing event data:', parseError);
                  console.error('[ApiService] Raw data that failed to parse:', dataStr);
                }
              }
            }
          }
        } catch (streamError) {
          if (streamError.name === 'AbortError') {
            console.log('[ApiService] Request aborted');
          } else {
            console.error('[ApiService] Stream processing error:', streamError);
            if (onError) {
              // Provide more helpful error messages
              let errorMessage = streamError.message;
              
              if (streamError.message.includes('Failed to fetch') || streamError.name === 'TypeError') {
                errorMessage = 'Cannot connect to API server. Please check:\n' +
                              '1. Backend server is running at ' + this.BASE_URL + '\n' +
                              '2. CORS is properly configured to allow requests from this origin';
              }
              
              onError(new Error(errorMessage));
            }
          }
        }
      };
      
      // Start processing the stream
      processStream();
      
      // Return abort function
      return () => {
        console.log('[ApiService] Aborting request');
        abortController.abort();
      };
      
    } catch (error) {
      console.error('[ApiService] Error initiating ask API request:', error);
      
      // Provide more helpful error messages
      let errorMessage = error.message;
      
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        errorMessage = 'Cannot connect to API server. Please check:\n' +
                      '1. Backend server is running at ' + this.BASE_URL + '\n' +
                      '2. CORS is properly configured to allow requests from this origin';
      }
      
      if (onError) {
        onError(new Error(errorMessage));
      }
      
      // Return a no-op abort function
      return () => {};
    }
  }
  
  /**
   * Simplify multiple text segments using SSE
   * @param {Array<Object>} textSegments - Array of text segments to simplify
   *   Each segment: {textStartIndex, textLength, text, previousSimplifiedTexts}
   * @param {Function} onEvent - Callback for each SSE event (data)
   * @param {Function} onComplete - Callback when stream completes
   * @param {Function} onError - Callback for errors
   * @returns {Function} Abort function to cancel the request
   */
  static async simplify(textSegments, onEvent, onComplete, onError) {
    const url = `${this.BASE_URL}${this.ENDPOINTS.SIMPLIFY}`;
    
    try {
      console.log('[ApiService] Starting SSE request to:', url);
      console.log('[ApiService] Text segments:', textSegments);
      
      // Get language code from global storage (shared across all tabs and domains)
      const getLanguageCode = async () => {
        try {
          // Get language from chrome.storage.local (global)
          const storageKey = 'language';
          const result = await chrome.storage.local.get([storageKey]);
          const language = result[storageKey] || 'WEBSITE_LANGUAGE';
          
          // If language is "WEBSITE_LANGUAGE", "none", or "dynamic", return null (use page language)
          if (language === 'WEBSITE_LANGUAGE' || language === 'none' || language === 'dynamic') {
            return null;
          }
          // Otherwise, convert to uppercase (e.g., "Spanish" -> "SPANISH")
          return language.toUpperCase();
        } catch (error) {
          console.warn('[ApiService] Error getting language from storage:', error);
          return null;
        }
      };
      
      // Add languageCode to each text segment (only if not null)
      const languageCode = await getLanguageCode();
      const textSegmentsWithLanguage = textSegments.map(segment => {
        const segmentWithLang = { ...segment };
        // Only include languageCode if it's not null
        if (languageCode !== null) {
          segmentWithLang.languageCode = languageCode;
        }
        return segmentWithLang;
      });
      
      // Create abort controller for cancellation
      const abortController = new AbortController();
      
      // Get X-Unauthenticated-User-Id header for request
      const unauthenticatedUserIdHeader = await this.getUnauthenticatedUserIdHeader();
      
      // Prepare request headers
      const requestHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        ...unauthenticatedUserIdHeader
      };
      
      // Add Authorization header if access token is available
      await this.addAuthorizationHeader(requestHeaders);
      
      // Make the SSE request
      let response = await fetch(url, {
        method: 'POST',
        headers: requestHeaders,
        mode: 'cors',
        credentials: 'include',
        body: JSON.stringify(textSegmentsWithLanguage),
        signal: abortController.signal
      });
      
      // Store X-Unauthenticated-User-Id from response header
      await this.storeUnauthenticatedUserId(response);
      
      if (!response.ok) {
        // Clone response for error handling (response body can only be read once)
        const responseClone = response.clone();
        const errorInfo = await this.handleApiError(responseClone, 'SIMPLIFY');
        
        // Create error object with error info
        const error = new Error(errorInfo.message);
        error.status = errorInfo.status;
        if (errorInfo.errorCode) {
          error.errorCode = errorInfo.errorCode;
        }
        throw error;
      }
      
      // Process the SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      // Read the stream
      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              console.log('[ApiService] Stream complete');
              if (onComplete) onComplete();
              break;
            }
            
            // Decode the chunk
            buffer += decoder.decode(value, { stream: true });
            
            // Process complete lines
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer
            
            for (const line of lines) {
              if (line.trim() === '') continue;
              
              // SSE format: "data: {json}" or "data: [DONE]"
              if (line.startsWith('data: ')) {
                const dataStr = line.slice(6).trim();
                
                // Check for completion signal
                if (dataStr === '[DONE]') {
                  console.log('[ApiService] Received [DONE] signal');
                  if (onComplete) onComplete();
                  break;
                }
                
                // Parse JSON data
                try {
                  const data = JSON.parse(dataStr);
                  console.log('[ApiService] Received event:', data);
                  
                  // Handle chunk events (word-by-word streaming)
                  if (data.chunk !== undefined) {
                    console.log('[ApiService] Chunk event - textStartIndex:', data.textStartIndex, 'chunk:', data.chunk, 'accumulatedSimplifiedText:', data.accumulatedSimplifiedText);
                    if (onEvent) {
                      // Pass chunk event with accumulated text for real-time display
                      onEvent({
                        textStartIndex: data.textStartIndex,
                        textLength: data.textLength,
                        text: data.text,
                        previousSimplifiedTexts: data.previousSimplifiedTexts || [],
                        chunk: data.chunk,
                        accumulatedSimplifiedText: data.accumulatedSimplifiedText
                      });
                    }
                  }
                  
                  // Handle complete event (final simplified text for a text object)
                  else if (data.type === 'complete') {
                    console.log('[ApiService] Complete event - textStartIndex:', data.textStartIndex, 'simplifiedText:', data.simplifiedText, 'shouldAllowSimplifyMore:', data.shouldAllowSimplifyMore, 'possibleQuestions:', data.possibleQuestions);
                    if (onEvent) {
                      // Pass complete event with final data
                      onEvent({
                        type: 'complete',
                        textStartIndex: data.textStartIndex,
                        textLength: data.textLength,
                        text: data.text,
                        previousSimplifiedTexts: data.previousSimplifiedTexts || [],
                        simplifiedText: data.simplifiedText,
                        shouldAllowSimplifyMore: data.shouldAllowSimplifyMore,
                        possibleQuestions: data.possibleQuestions || []
                      });
                    }
                  }
                  
                  // Handle error events
                  else if (data.type === 'error') {
                    const error = new Error(data.error_message || data.error || 'Stream error occurred');
                    error.error_code = data.error_code;
                    console.error('[ApiService] Error event:', error);
                    if (onError) {
                      onError(error);
                    }
                  }
                  
                  // Handle regular events (backward compatibility)
                  else {
                    if (onEvent) {
                      onEvent(data);
                    }
                  }
                } catch (parseError) {
                  console.error('[ApiService] Error parsing event data:', parseError);
                  console.error('[ApiService] Raw data that failed to parse:', dataStr);
                }
              }
            }
          }
        } catch (streamError) {
          if (streamError.name === 'AbortError') {
            console.log('[ApiService] Request aborted');
          } else {
            console.error('[ApiService] Stream processing error:', streamError);
            if (onError) {
              // Provide more helpful error messages
              let errorMessage = streamError.message;
              
              if (streamError.message.includes('Failed to fetch') || streamError.name === 'TypeError') {
                errorMessage = 'Connection lost during simplification. This could be due to:\n' +
                              '1. Backend server stopped responding at ' + this.BASE_URL + '\n' +
                              '2. Network connectivity issues - check your internet connection\n' +
                              '3. Request timeout - the server may be overloaded\n\n' +
                              'Please try again or verify the backend server is running.';
              } else if (streamError.status) {
                errorMessage = `Simplify stream error (${streamError.status}): ${streamError.message}`;
              } else {
                errorMessage = `Simplify stream error: ${streamError.message}`;
              }
              
              onError(new Error(errorMessage));
            }
          }
        }
      };
      
      // Start processing the stream
      processStream();
      
      // Return abort function
      return () => {
        console.log('[ApiService] Aborting request');
        abortController.abort();
      };
      
    } catch (error) {
      console.error('[ApiService] Error initiating simplify request:', error);
      
      // Provide helpful error messages with more context
      let errorMessage = error.message;
      
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        errorMessage = 'Unable to connect to the simplification service. This could be due to:\n' +
                      '1. Backend server is not running at ' + this.BASE_URL + '\n' +
                      '2. Network connectivity issues - check your internet connection\n' +
                      '3. CORS configuration - ensure the backend allows requests from this origin\n' +
                      '4. Firewall or security settings blocking the connection\n\n' +
                      'Please verify the backend server is running and accessible.';
      } else if (error.status) {
        // API error with status code
        errorMessage = `Simplify request failed (${error.status}): ${error.message}`;
      } else {
        // Other errors
        errorMessage = `Simplify request failed: ${error.message}`;
      }
      
      if (onError) {
        onError(new Error(errorMessage));
      }
      
      // Return a no-op abort function
      return () => {};
    }
  }
  
  /**
   * Summarise text content using SSE
   * @param {string} text - The text content to summarise
   * @param {Function} onEvent - Callback for each SSE event (data)
   * @param {Function} onComplete - Callback when stream completes
   * @param {Function} onError - Callback for errors
   * @returns {Function} Abort function to cancel the request
   */
  static async summarise(text, onEvent, onComplete, onError) {
    const url = `${this.BASE_URL}${this.ENDPOINTS.SUMMARISE}`;
    
    try {
      console.log('[ApiService] Starting SSE request to:', url);
      console.log('[ApiService] Text length:', text.length);
      
      // Create abort controller for cancellation
      const abortController = new AbortController();
      
      // Get language code from global storage (shared across all tabs and domains)
      const getLanguageCode = async () => {
        try {
          // Get language from chrome.storage.local (global)
          const storageKey = 'language';
          const result = await chrome.storage.local.get([storageKey]);
          const language = result[storageKey] || 'WEBSITE_LANGUAGE';
          
          // If language is "WEBSITE_LANGUAGE", "none", or "dynamic", return null (use page language)
          if (language === 'WEBSITE_LANGUAGE' || language === 'none' || language === 'dynamic') {
            return null;
          }
          // Otherwise, convert to uppercase (e.g., "Spanish" -> "SPANISH")
          return language.toUpperCase();
        } catch (error) {
          console.warn('[ApiService] Error getting language from storage:', error);
          return null;
        }
      };
      
      // Prepare request payload
      const languageCode = await getLanguageCode();
      const requestBody = {
        text: text
      };
      
      // Only include languageCode if it's not null
      if (languageCode !== null) {
        requestBody.languageCode = languageCode;
      }
      
      // Get X-Unauthenticated-User-Id header for request
      const unauthenticatedUserIdHeader = await this.getUnauthenticatedUserIdHeader();
      
      // Prepare request headers
      const requestHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        ...unauthenticatedUserIdHeader
      };
      
      // Make the SSE request
      let response = await fetch(url, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(requestBody),
        signal: abortController.signal
      });
      
      // Store X-Unauthenticated-User-Id from response header
      await this.storeUnauthenticatedUserId(response);
      
      if (!response.ok) {
        // Clone response for error handling (response body can only be read once)
        const responseClone = response.clone();
        const errorInfo = await this.handleApiError(responseClone, 'SUMMARISE');
        
        // Create error object with error info
        const error = new Error(errorInfo.message);
        error.status = errorInfo.status;
        if (errorInfo.errorCode) {
          error.errorCode = errorInfo.errorCode;
        }
        throw error;
      }
      
      // Process the SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      // Read the stream
      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              console.log('[ApiService] Stream complete');
              if (onComplete) onComplete();
              break;
            }
            
            // Decode the chunk
            buffer += decoder.decode(value, { stream: true });
            
            // Process complete lines
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer
            
            for (const line of lines) {
              if (line.trim() === '') continue;
              
              // SSE format: "data: {json}" or "data: [DONE]"
              if (line.startsWith('data: ')) {
                const dataStr = line.slice(6).trim();
                
                // Check for completion signal
                if (dataStr === '[DONE]') {
                  console.log('[ApiService] Received [DONE] signal');
                  if (onComplete) onComplete();
                  break;
                }
                
                // Parse JSON data
                try {
                  const data = JSON.parse(dataStr);
                  console.log('[ApiService] Received event:', data);
                  
                  // Handle chunk events (word-by-word streaming)
                  if (data.chunk !== undefined) {
                    console.log('[ApiService] Chunk event - chunk:', data.chunk, 'accumulated length:', data.accumulated?.length || 0);
                    if (onEvent) {
                      // Pass chunk event with accumulated text for real-time display
                      onEvent({
                        chunk: data.chunk,
                        accumulated: data.accumulated
                      });
                    }
                  }
                  
                  // Handle complete event (final summary)
                  else if (data.type === 'complete') {
                    console.log('[ApiService] Complete event - summary length:', data.summary?.length || 0);
                    console.log('[ApiService] Possible questions:', data.possibleQuestions?.length || 0);
                    if (onEvent) {
                      // Pass complete event with final data including possibleQuestions
                      onEvent({
                        type: 'complete',
                        summary: data.summary,
                        possibleQuestions: data.possibleQuestions || []
                      });
                    }
                  }
                  
                  // Handle error events
                  else if (data.type === 'error') {
                    const error = new Error(data.error_message || data.error || 'Stream error occurred');
                    error.error_code = data.error_code;
                    console.error('[ApiService] Error event:', error);
                    if (onError) {
                      onError(error);
                    }
                  }
                  
                  // Handle regular events (backward compatibility)
                  else {
                    if (onEvent) {
                      onEvent(data);
                    }
                  }
                } catch (parseError) {
                  console.error('[ApiService] Error parsing event data:', parseError);
                  console.error('[ApiService] Raw data that failed to parse:', dataStr);
                }
              }
            }
          }
        } catch (streamError) {
          if (streamError.name === 'AbortError') {
            console.log('[ApiService] Request aborted');
          } else {
            console.error('[ApiService] Stream processing error:', streamError);
            if (onError) {
              // Provide more helpful error messages
              let errorMessage = streamError.message;
              
              if (streamError.message.includes('Failed to fetch') || streamError.name === 'TypeError') {
                errorMessage = 'Cannot connect to API server. Please check:\n' +
                              '1. Backend server is running at ' + this.BASE_URL + '\n' +
                              '2. CORS is properly configured to allow requests from this origin';
              }
              
              onError(new Error(errorMessage));
            }
          }
        }
      };
      
      // Start processing the stream
      processStream();
      
      // Return abort function
      return () => {
        console.log('[ApiService] Aborting request');
        abortController.abort();
      };
      
    } catch (error) {
      console.error('[ApiService] Error initiating summarise request:', error);
      
      // Provide helpful error messages
      let errorMessage = error.message;
      
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        errorMessage = 'Cannot connect to API server. Please check:\n' +
                      '1. Backend server is running at ' + this.BASE_URL + '\n' +
                      '2. CORS is properly configured to allow requests from this origin';
      }
      
      if (onError) {
        onError(new Error(errorMessage));
      }
      
      // Return a no-op abort function
      return () => {};
    }
  }
  
  /**
   * Perform web search with SSE streaming
   * @param {Object} params - Request parameters
   * @param {string} params.query - Search query string
   * @param {number} params.max_results - Maximum number of results (optional, default: 10, range: 1-50)
   * @param {string} params.region - Search region (optional, default: "wt-wt")
   * @param {Function} params.onMetadata - Callback for metadata event: (metadata) => void
   * @param {Function} params.onResult - Callback for each result event: (result) => void
   * @param {Function} params.onComplete - Callback when stream completes: () => void
   * @param {Function} params.onError - Callback for errors: (error) => void
   * @returns {Function} Abort function to cancel the request
   */
  static async search({ query, max_results = 10, region = 'wt-wt', onMetadata, onResult, onComplete, onError }) {
    const url = `${this.BASE_URL}${this.ENDPOINTS.WEB_SEARCH_STREAM}`;
    
    // Validate input parameters
    if (!query || typeof query !== 'string') {
      const error = new Error('query is required and must be a string');
      if (onError) onError(error);
      return () => {};
    }
    
    if (max_results < 1 || max_results > 50) {
      const error = new Error('max_results must be between 1 and 50');
      if (onError) onError(error);
      return () => {};
    }
    
    // Get language code from global storage (shared across all tabs and domains)
    const getLanguageCode = async () => {
      try {
        // Get language from chrome.storage.local (global)
        const storageKey = 'language';
        const result = await chrome.storage.local.get([storageKey]);
        const language = result[storageKey] || 'WEBSITE_LANGUAGE';
        
        // If language is "WEBSITE_LANGUAGE", "none", or "dynamic", return null (use page language)
        if (language === 'WEBSITE_LANGUAGE' || language === 'none' || language === 'dynamic') {
          return null;
        }
        // Otherwise, convert to uppercase (e.g., "Spanish" -> "SPANISH")
        return language.toUpperCase();
      } catch (error) {
        console.warn('[ApiService] Error getting language from storage:', error);
        return null;
      }
    };
    
    // Get language code asynchronously
    const languageCode = await getLanguageCode();
    
    const requestBody = {
      query,
      max_results,
      region
    };
    
    // Only include languageCode if it's not null
    if (languageCode !== null) {
      requestBody.languageCode = languageCode;
    }
    
    try {
      console.log('[ApiService] Sending SSE request to:', url);
      console.log('[ApiService] Request body:', requestBody);
      
      // Create abort controller for cancellation
      const abortController = new AbortController();
      
      // Get X-Unauthenticated-User-Id header for request
      const unauthenticatedUserIdHeader = await this.getUnauthenticatedUserIdHeader();
      
      // Prepare request headers
      const requestHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        ...unauthenticatedUserIdHeader
      };
      
      // Add Authorization header if access token is available
      await this.addAuthorizationHeader(requestHeaders);
      
      let response = await fetch(url, {
        method: 'POST',
        headers: requestHeaders,
        mode: 'cors',
        body: JSON.stringify(requestBody),
        signal: abortController.signal
      });
      
      // Store X-Unauthenticated-User-Id from response header
      await this.storeUnauthenticatedUserId(response);
      
      if (!response.ok) {
        // Clone response for error handling (response body can only be read once)
        const responseClone = response.clone();
        const errorInfo = await this.handleApiError(responseClone, 'WEB_SEARCH_STREAM');
        
        // If it's LOGIN_REQUIRED, the modal will be shown via event, but we still need to call onError
        if (errorInfo.errorCode === 'LOGIN_REQUIRED') {
          const error = new Error(errorInfo.message);
          error.status = errorInfo.status;
          error.errorCode = errorInfo.errorCode;
          if (onError) onError(error);
          return () => {};
        }
        
        // For other errors, create error object and call onError
        const error = new Error(errorInfo.message);
        error.status = errorInfo.status;
        if (errorInfo.errorCode) {
          error.errorCode = errorInfo.errorCode;
        }
        if (onError) onError(error);
        return () => {};
      }
      
      // Process the SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      // Helper function to process a line
      const processLine = (line) => {
        const trimmedLine = line.trim();
        if (trimmedLine === '') return false; // Continue processing
        
        // SSE format: "data: {json}" or "data: [DONE]"
        if (trimmedLine.startsWith('data: ')) {
          const dataStr = trimmedLine.slice(6).trim();
          
          // Check for completion signal
          if (dataStr === '[DONE]') {
            console.log('[ApiService] Received [DONE] signal');
            if (onComplete) onComplete();
            return true; // Stop processing
          }
          
          // Parse JSON data
          try {
            if (!dataStr) {
              console.warn('[ApiService] Empty data string, skipping');
              return false;
            }
            
            const data = JSON.parse(dataStr);
            console.log('[ApiService] Received event:', data);
            
            // Validate that data has a type property
            if (!data || typeof data !== 'object' || !data.type) {
              console.warn('[ApiService] Event missing type property:', data);
              return false;
            }
            
            // Handle metadata event
            if (data.type === 'metadata') {
              if (onMetadata) {
                onMetadata(data);
              }
            }
            
            // Handle result event
            else if (data.type === 'result') {
              if (onResult) {
                onResult(data);
              }
            }
            
            // Handle complete event
            else if (data.type === 'complete') {
              console.log('[ApiService] Received complete event');
              if (onComplete) onComplete();
              return true; // Stop processing
            }
            
            // Handle error event
            else if (data.type === 'error') {
              const error = new Error(data.error?.message || 'Web search error occurred');
              console.error('[ApiService] Error event:', error);
              if (onError) {
                onError(error);
              }
            } else {
              console.warn('[ApiService] Unknown event type:', data.type, data);
            }
          } catch (parseError) {
            console.error('[ApiService] Error parsing event data:', parseError);
            console.error('[ApiService] Raw data that failed to parse:', dataStr);
            console.error('[ApiService] Data string length:', dataStr.length);
            // Continue processing other lines even if one fails
          }
        } else {
          // Log non-data lines for debugging (but don't process them)
          if (trimmedLine && !trimmedLine.startsWith(':')) {
            console.warn('[ApiService] Received non-data line:', trimmedLine.substring(0, 100));
          }
        }
        return false; // Continue processing
      };
      
      // Read the stream
      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            // Decode the chunk (flush on last chunk)
            if (value) {
              buffer += decoder.decode(value, { stream: !done });
            }
            
            // If done, process any remaining buffer data
            if (done) {
              console.log('[ApiService] Stream complete');
              
              // Process any remaining buffer data
              if (buffer.trim()) {
                const lines = buffer.split('\n');
                for (const line of lines) {
                  if (processLine(line)) {
                    return; // Stop if [DONE] or complete event received
                  }
                }
              }
              
              if (onComplete) onComplete();
              break;
            }
            
            // Process complete lines
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer
            
            for (const line of lines) {
              if (processLine(line)) {
                return; // Stop if [DONE] or complete event received
              }
            }
          }
        } catch (streamError) {
          if (streamError.name === 'AbortError') {
            console.log('[ApiService] Request aborted');
          } else {
            console.error('[ApiService] Stream processing error:', streamError);
            if (onError) {
              let errorMessage = streamError.message;
              
              if (streamError.message.includes('Failed to fetch') || streamError.name === 'TypeError') {
                errorMessage = 'Cannot connect to API server. Please check:\n' +
                              '1. Backend server is running at ' + this.BASE_URL + '\n' +
                              '2. CORS is properly configured to allow requests from this origin';
              }
              
              onError(new Error(errorMessage));
            }
          }
        }
      };
      
      // Start processing the stream
      processStream();
      
      // Return abort function
      return () => {
        console.log('[ApiService] Aborting request');
        abortController.abort();
      };
      
    } catch (error) {
      console.error('[ApiService] Error initiating web search request:', error);
      
      let errorMessage = error.message;
      
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        errorMessage = 'Cannot connect to API server. Please check:\n' +
                      '1. Backend server is running at ' + this.BASE_URL + '\n' +
                      '2. CORS is properly configured to allow requests from this origin';
      }
      
      if (onError) {
        onError(new Error(errorMessage));
      }
      
      // Return a no-op abort function
      return () => {};
    }
  }
  
  /**
   * Get word explanations for multiple text segments using SSE
   * @param {Array<Object>} textSegments - Array of text segments with important words
   *   Each segment: {textStartIndex, text, important_words_location}
   *   Each word location: {word, index, length}
   * @param {Function} onEvent - Callback for each SSE event (data)
   * @param {Function} onComplete - Callback when stream completes
   * @param {Function} onError - Callback for errors
   * @returns {Function} Abort function to cancel the request
   */
  static async explainWords(textSegments, onEvent, onComplete, onError) {
    const url = `${this.BASE_URL}${this.ENDPOINTS.WORDS_EXPLANATION}`;
    
    try {
      console.log('[ApiService] Starting SSE request to:', url);
      console.log('[ApiService] Text segments:', textSegments);
      
      // Get language code from global storage (shared across all tabs and domains)
      const getLanguageCode = async () => {
        try {
          // Get language from chrome.storage.local (global)
          const storageKey = 'language';
          const result = await chrome.storage.local.get([storageKey]);
          const language = result[storageKey] || 'WEBSITE_LANGUAGE';
          
          // If language is "WEBSITE_LANGUAGE", "none", or "dynamic", return null (use page language)
          if (language === 'WEBSITE_LANGUAGE' || language === 'none' || language === 'dynamic') {
            return null;
          }
          // Otherwise, convert to uppercase (e.g., "Spanish" -> "SPANISH")
          return language.toUpperCase();
        } catch (error) {
          console.warn('[ApiService] Error getting language from storage:', error);
          return null;
        }
      };
      
      // Add languageCode to each text segment (only if not null)
      const languageCode = await getLanguageCode();
      const textSegmentsWithLanguage = textSegments.map(segment => {
        const segmentWithLang = { ...segment };
        // Only include languageCode if it's not null
        if (languageCode !== null) {
          segmentWithLang.languageCode = languageCode;
        }
        return segmentWithLang;
      });
      
      // Create abort controller for cancellation
      const abortController = new AbortController();
      
      // Get X-Unauthenticated-User-Id header for request
      const unauthenticatedUserIdHeader = await this.getUnauthenticatedUserIdHeader();
      
      // Prepare request headers
      const requestHeaders = {
        'Content-Type': 'application/json',
        ...unauthenticatedUserIdHeader
      };
      
      // Add Authorization header if access token is available
      await this.addAuthorizationHeader(requestHeaders);
      
      // Log Authorization header for words-explanation API
      if (requestHeaders['Authorization']) {
        console.log('[SUBHRAM-LOGIN] Authorization header being sent in words-explanation API:', requestHeaders['Authorization']);
        // Also log just the token part (without "Bearer ") for verification
        const tokenPart = requestHeaders['Authorization'].replace('Bearer ', '');
        console.log('[SUBHRAM-LOGIN] Access token value (first 30 chars):', tokenPart.substring(0, 30) + '...');
        console.log('[SUBHRAM-LOGIN] Access token length:', tokenPart.length);
      } else {
        console.log('[SUBHRAM-LOGIN] ⚠ No Authorization header in words-explanation API request');
      }
      
      // Make the SSE request
      let response = await fetch(url, {
        method: 'POST',
        headers: requestHeaders,
        mode: 'cors',
        credentials: 'include',
        body: JSON.stringify(textSegmentsWithLanguage),
        signal: abortController.signal
      });
      
      // Store X-Unauthenticated-User-Id from response header
      await this.storeUnauthenticatedUserId(response);
      
      if (!response.ok) {
        console.log('[ApiService] ===== WORDS-EXPLANATION API ERROR =====');
        console.log('[ApiService] Response not OK, status:', response.status);
        console.log('[ApiService] Response statusText:', response.statusText);
        console.log('[ApiService] Calling handleApiError...');
        
        // Clone response for error handling (response body can only be read once)
        const responseClone = response.clone();
        const errorInfo = await this.handleApiError(responseClone, 'WORDS_EXPLANATION');
        
        console.log('[ApiService] handleApiError returned:', JSON.stringify(errorInfo, null, 2));
        console.log('[ApiService] errorInfo.errorCode:', errorInfo.errorCode);
        console.log('[ApiService] errorInfo.message:', errorInfo.message);
        console.log('[ApiService] errorInfo.status:', errorInfo.status);
        
        // Create error object with error info
        const error = new Error(errorInfo.message);
        error.status = errorInfo.status;
        if (errorInfo.errorCode) {
          error.errorCode = errorInfo.errorCode;
          console.log('[ApiService] Setting error.errorCode to:', errorInfo.errorCode);
        } else {
          console.log('[ApiService] No errorCode in errorInfo');
        }
        
        console.log('[ApiService] Throwing error with:', {
          message: error.message,
          status: error.status,
          errorCode: error.errorCode
        });
        console.log('[ApiService] ===== WORDS-EXPLANATION ERROR HANDLED =====');
        
        throw error;
      }
      
      // Process the SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      // Read the stream
      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              console.log('[ApiService] Stream complete');
              if (onComplete) onComplete();
              break;
            }
            
            // Decode the chunk
            buffer += decoder.decode(value, { stream: true });
            
            // Process complete lines
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer
            
            for (const line of lines) {
              if (line.trim() === '') continue;
              
              // SSE format: "data: {json}" or "data: [DONE]"
              if (line.startsWith('data: ')) {
                const data = line.substring(6).trim();
                
                // Check for completion signal
                if (data === '[DONE]') {
                  console.log('[ApiService] Received [DONE] signal');
                  if (onComplete) onComplete();
                  break;
                }
                
                // Parse JSON data
                try {
                  const eventData = JSON.parse(data);
                  console.log('[ApiService] ===== RAW EVENT RECEIVED =====');
                  console.log('[ApiService] Raw event data:', data);
                  console.log('[ApiService] Parsed event data:', eventData);
                  
                  if (eventData.word_info) {
                    console.log(`[ApiService] Event contains word_info for word: "${eventData.word_info.word}"`);
                    console.log(`[ApiService] Word textStartIndex: ${eventData.word_info.textStartIndex}`);
                    console.log(`[ApiService] Word meaning: ${eventData.word_info.meaning}`);
                  } else {
                    console.warn('[ApiService] Event does not contain word_info');
                  }
                  
                  if (onEvent) {
                    console.log('[ApiService] Calling onEvent callback');
                    onEvent(eventData);
                    console.log('[ApiService] onEvent callback completed');
                  } else {
                    console.warn('[ApiService] No onEvent callback provided');
                  }
                } catch (parseError) {
                  console.error('[ApiService] Error parsing event data:', parseError);
                  console.error('[ApiService] Raw data that failed to parse:', data);
                }
              }
            }
          }
        } catch (streamError) {
          if (streamError.name === 'AbortError') {
            console.log('[ApiService] Request aborted');
          } else {
            console.error('[ApiService] ===== STREAM PROCESSING ERROR =====');
            console.error('[ApiService] Stream error during words-explanation:', streamError);
            console.error('[ApiService] Stream error name:', streamError.name);
            console.error('[ApiService] Stream error message:', streamError.message);
            console.error('[ApiService] Stream error status:', streamError.status);
            console.error('[ApiService] Stream error errorCode:', streamError.errorCode);
            console.error('[ApiService] ===== STREAM ERROR DETAILS =====');
            if (onError) {
              console.log('[ApiService] Calling onError callback with streamError');
              // Provide more helpful error messages
              let errorMessage = streamError.message;
              
              if (streamError.message.includes('Failed to fetch') || streamError.name === 'TypeError') {
                errorMessage = 'Connection lost during word explanation. This could be due to:\n' +
                              '1. Backend server stopped responding at ' + this.BASE_URL + '\n' +
                              '2. Network connectivity issues - check your internet connection\n' +
                              '3. Request timeout - the server may be overloaded\n\n' +
                              'Please try again or verify the backend server is running.';
              } else if (streamError.status) {
                errorMessage = `Word explanation stream error (${streamError.status}): ${streamError.message}`;
              } else {
                errorMessage = `Word explanation stream error: ${streamError.message}`;
              }
              
              // Preserve errorCode if it exists
              const errorToPass = new Error(errorMessage);
              if (streamError.errorCode) {
                errorToPass.errorCode = streamError.errorCode;
                errorToPass.status = streamError.status;
              }
              onError(errorToPass);
            } else {
              console.warn('[ApiService] No onError callback provided for stream error');
            }
          }
        }
      };
      
      // Start processing the stream
      processStream();
      
      // Return abort function
      return () => {
        console.log('[ApiService] Aborting request');
        abortController.abort();
      };
      
    } catch (error) {
      console.error('[ApiService] ===== EXPLAIN WORDS CATCH BLOCK =====');
      console.error('[ApiService] Error initiating word explanation request:', error);
      console.error('[ApiService] Error name:', error.name);
      console.error('[ApiService] Error message:', error.message);
      console.error('[ApiService] Error status:', error.status);
      console.error('[ApiService] Error errorCode:', error.errorCode);
      console.error('[ApiService] Error stack:', error.stack);
      console.error('[ApiService] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      
      // Provide helpful error messages with more context
      let errorMessage = error.message;
      
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        errorMessage = 'Unable to connect to the word explanation service. This could be due to:\n' +
                      '1. Backend server is not running at ' + this.BASE_URL + '\n' +
                      '2. Network connectivity issues - check your internet connection\n' +
                      '3. CORS configuration - ensure the backend allows requests from this origin\n' +
                      '4. Firewall or security settings blocking the connection\n\n' +
                      'Please verify the backend server is running and accessible.';
      } else if (error.status) {
        // API error with status code
        errorMessage = `Word explanation request failed (${error.status}): ${error.message}`;
      } else if (error.errorCode) {
        // Error with error code (preserve it)
        errorMessage = `Word explanation request failed: ${error.message}`;
      } else {
        // Other errors
        errorMessage = `Word explanation request failed: ${error.message}`;
      }
      
      console.log('[ApiService] Final errorMessage to pass to onError:', errorMessage);
      console.log('[ApiService] Error has errorCode?', !!error.errorCode);
      if (error.errorCode) {
        console.log('[ApiService] Error errorCode value:', error.errorCode);
      }
      
      if (onError) {
        console.log('[ApiService] Calling onError callback');
        // Preserve errorCode if it exists
        const errorToPass = new Error(errorMessage);
        if (error.errorCode) {
          errorToPass.errorCode = error.errorCode;
          errorToPass.status = error.status;
          console.log('[ApiService] Preserving errorCode in error passed to onError:', error.errorCode);
        }
        onError(errorToPass);
        console.log('[ApiService] onError callback completed');
      } else {
        console.warn('[ApiService] No onError callback provided');
      }
      
      console.error('[ApiService] ===== EXPLAIN WORDS ERROR HANDLED =====');
      
      // Return a no-op abort function
      return () => {};
    }
  }
  
  /**
   * Get more explanations/examples for a word
   * @param {string} word - The word
   * @param {string} meaning - Current meaning
   * @param {Array<string>} examples - Current examples
   * @returns {Promise<Object>} Response with {success, data, error}
   */
  static async getMoreExplanations(word, meaning, examples) {
    const url = `${this.BASE_URL}/api/v1/get-more-explanations`;
    
    try {
      console.log('[ApiService] Fetching more explanations for:', word);
      
      // Get X-Unauthenticated-User-Id header for request
      const unauthenticatedUserIdHeader = await this.getUnauthenticatedUserIdHeader();
      
      // Prepare request headers
      const requestHeaders = {
        'Content-Type': 'application/json',
        ...unauthenticatedUserIdHeader
      };
      
      // Add Authorization header if access token is available
      await this.addAuthorizationHeader(requestHeaders);
      
      let response = await fetch(url, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify({
          word: word,
          meaning: meaning,
          examples: examples
        })
      });
      
      // Store X-Unauthenticated-User-Id from response header
      await this.storeUnauthenticatedUserId(response);
      
      if (!response.ok) {
        // Clone response for error handling (response body can only be read once)
        const responseClone = response.clone();
        const errorInfo = await this.handleApiError(responseClone, 'WORDS_EXPLANATION');
        
        // Return error in the expected format
        return {
          success: false,
          error: errorInfo.message
        };
      }
      
      const data = await response.json();
      console.log('[ApiService] Received more explanations:', data);
      
      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('[ApiService] Error fetching more explanations:', error);
      
      let errorMessage = error.message;
      
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        errorMessage = 'Cannot connect to API server. Please check:\n' +
                      '1. Backend server is running at ' + this.BASE_URL + '\n' +
                      '2. CORS is properly configured to allow requests from this origin';
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }
  
  /**
   * Update base URL configuration
   * @param {string} newBaseUrl - New base URL
   */
  static setBaseUrl(newBaseUrl) {
    ApiConfig.setBaseUrl(newBaseUrl);
    console.log('[ApiService] Base URL updated to:', newBaseUrl);
  }
  
  /**
   * Get current base URL
   * @returns {string} Current base URL
   */
  static getBaseUrl() {
    return this.BASE_URL;
  }
}

// Export for use in content script
export default ApiService;

