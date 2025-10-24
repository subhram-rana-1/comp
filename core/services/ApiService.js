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
    
    // Validate input parameters
    if (!initial_context || typeof initial_context !== 'string') {
      throw new Error('initial_context is required and must be a string');
    }
    if (!question || typeof question !== 'string') {
      throw new Error('question is required and must be a string');
    }
    if (!Array.isArray(chat_history)) {
      throw new Error('chat_history must be an array');
    }
    
    // Check for reasonable size limits
    if (initial_context.length > 100000) {
      console.warn('[ApiService] initial_context is very large (' + initial_context.length + ' chars), this might cause API errors');
    }
    if (question.length > 10000) {
      console.warn('[ApiService] question is very large (' + question.length + ' chars), this might cause API errors');
    }
    
    const requestBody = {
      initial_context,
      chat_history,
      question
    };
    
    try {
      console.log('[ApiService] Sending request to:', url);
      console.log('[ApiService] Request body size:', {
        initial_context_length: initial_context.length,
        chat_history_length: chat_history.length,
        question_length: question.length
      });
      
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
        let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
        
        // Provide more specific error messages for common status codes
        if (response.status === 422) {
          errorMessage = `API request failed: 422 Unprocessable Entity. This usually means the request data is too large or contains invalid characters. Try asking a shorter question or the content might be too long.`;
        } else if (response.status === 413) {
          errorMessage = `API request failed: 413 Payload Too Large. The content or question is too large for the API to process.`;
        } else if (response.status === 400) {
          errorMessage = `API request failed: 400 Bad Request. The request format might be invalid.`;
        }
        
        throw new Error(errorMessage);
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
   * Convert voice audio to text
   * @param {FormData} formData - FormData containing audio file
   * @returns {Promise<Object>} - API response with transcribed text
   */
  static async voiceToText(formData) {
    const url = `${this.BASE_URL}${this.ENDPOINTS.VOICE_TO_TEXT}?translate=true`;
    
    try {
      console.log('[ApiService] Converting voice to text...');
      
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
        throw new Error(`Voice to text conversion failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('[ApiService] Voice to text response received:', data);
      
      return {
        success: true,
        data: data
      };
      
    } catch (error) {
      console.error('[ApiService] Error converting voice to text:', error);
      
      let errorMessage = error.message;
      
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        errorMessage = 'Cannot connect to voice transcription service. Please check:\n' +
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

