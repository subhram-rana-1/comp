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
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors',
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
   * Convert PDF to text
   * @param {File} file - PDF file to convert
   * @returns {Promise<Object>} - API response with markdown text
   */
  static async pdfToText(file) {
    const url = `${this.BASE_URL}${this.ENDPOINTS.PDF_TO_TEXT}`;
    
    try {
      console.log('[ApiService] Converting PDF to text:', file.name);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json'
          // Don't set Content-Type header - let browser set it with boundary for multipart/form-data
        },
        mode: 'cors',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`PDF conversion failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('[ApiService] PDF conversion response received:', data);
      
      return {
        success: true,
        data: data
      };
      
    } catch (error) {
      console.error('[ApiService] Error converting PDF to text:', error);
      
      let errorMessage = error.message;
      
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        errorMessage = 'Cannot connect to PDF conversion service. Please check:\n' +
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
   * Get random paragraph based on topics, difficulty, and word count
   * @param {Object} params - Request parameters
   * @param {Array<string>} params.topics - Array of topics
   * @param {string} params.difficulty_level - Difficulty level (easy, medium, hard)
   * @param {number} params.word_count - Target word count
   * @returns {Promise<Object>} - API response with generated text
   */
  static async getRandomParagraph({ topics, difficulty_level, word_count }) {
    const url = `${this.BASE_URL}${this.ENDPOINTS.GET_RANDOM_PARAGRAPH}`;
    
    try {
      console.log('[ApiService] Getting random paragraph with params:', { topics, difficulty_level, word_count });
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('topics', topics.join(','));
      queryParams.append('difficulty_level', difficulty_level);
      queryParams.append('word_count', word_count.toString());
      
      const fullUrl = `${url}?${queryParams.toString()}`;
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'vocab-extension/1.0.0',
          'Accept': 'application/json'
        },
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`Random paragraph request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('[ApiService] Random paragraph response received:', data);
      
      return {
        success: true,
        data: data
      };
      
    } catch (error) {
      console.error('[ApiService] Error getting random paragraph:', error);
      
      let errorMessage = error.message;
      
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        errorMessage = 'Cannot connect to story generation service. Please check:\n' +
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

