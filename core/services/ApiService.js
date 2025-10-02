/**
 * API Service Class
 * Handles all API calls to the backend server
 */

class ApiService {
  // Configurable base URL - change this single place to update for all API calls
  static BASE_URL = 'http://localhost:8000';
  
  // API endpoints
  static ENDPOINTS = {
    ASK: '/api/v2/ask'
  };
  
  /**
   * Ask a question with context and chat history
   * @param {Object} params - Request parameters
   * @param {string} params.initial_context - The original selected text
   * @param {Array} params.chat_history - Previous chat messages [{role, content}]
   * @param {string} params.question - The user's question
   * @returns {Promise<Object>} - API response
   */
  static async ask({ initial_context, chat_history = [], question }) {
    const url = `${this.BASE_URL}${this.ENDPOINTS.ASK}`;
    
    const requestBody = {
      initial_context,
      chat_history,
      question
    };
    
    try {
      console.log('[ApiService] Sending request to:', url);
      console.log('[ApiService] Request body:', requestBody);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        // No credentials needed since we're not using cookies/sessions
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('[ApiService] Response received:', data);
      
      return {
        success: true,
        data: data
      };
      
    } catch (error) {
      console.error('[ApiService] Error calling ask API:', error);
      
      // Provide more helpful error messages
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
    this.BASE_URL = newBaseUrl;
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

