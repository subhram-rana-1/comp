/**
 * Summarise Service - Handles API calls for page summarisation
 * Modular service for the /api/v2/summarise endpoint
 */

import ApiConfig from '../config/apiConfig.js';

class SummariseService {
  // Use centralized config for base URL
  static get BASE_URL() {
    return ApiConfig.getCurrentBaseUrl();
  }
  
  // API endpoint - use centralized config
  static ENDPOINT = ApiConfig.ENDPOINTS.SUMMARISE;
  
  /**
   * Summarise text content
   * @param {string} text - The text content to summarise
   * @returns {Promise<Object>} Promise that resolves to { summary: string }
   */
  static async summarise(text) {
    const url = `${this.BASE_URL}${this.ENDPOINT}`;
    
    try {
      console.log('[SummariseService] Starting summarise request to:', url);
      console.log('[SummariseService] Text length:', text.length);
      
      // Create abort controller for cancellation
      const abortController = new AbortController();
      
      // Prepare request payload
      const requestBody = {
        text: text
      };
      
      // Make the API request
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: abortController.signal
      });
      
      if (!response.ok) {
        // Check for 429 rate limit error
        if (response.status === 429) {
          const error = new Error('Rate limit exceeded');
          error.status = 429;
          throw error;
        }
        
        // Try to read error response body for more details
        let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.error || errorData.message) {
            errorMessage = `API request failed: ${response.status} ${response.statusText}. ${errorData.error || errorData.message}`;
          }
        } catch (e) {
          // If we can't parse the error response, use the default message
          console.warn('[SummariseService] Could not parse error response:', e);
        }
        throw new Error(errorMessage);
      }
      
      // Parse JSON response
      const data = await response.json();
      console.log('[SummariseService] Response received:', data);
      
      return data;
      
    } catch (error) {
      console.error('[SummariseService] Error initiating summarise request:', error);
      
      // Provide helpful error messages
      let errorMessage = error.message;
      
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        errorMessage = 'Cannot connect to API server. Please check:\n' +
                      '1. Backend server is running at ' + this.BASE_URL + '\n' +
                      '2. CORS is properly configured to allow requests from this origin';
      }
      
      throw new Error(errorMessage);
    }
  }
  
  /**
   * Update base URL configuration
   * @param {string} newBaseUrl - New base URL
   */
  static setBaseUrl(newBaseUrl) {
    ApiConfig.setBaseUrl(newBaseUrl);
    console.log('[SummariseService] Base URL updated to:', newBaseUrl);
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
export default SummariseService;

