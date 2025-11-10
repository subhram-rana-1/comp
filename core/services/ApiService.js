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
  static async ask({ initial_context, chat_history = [], question, onChunk, onComplete, onError }) {
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
    
    // Get language code from localStorage
    const getLanguageCode = () => {
      try {
        const language = localStorage.getItem('language') || 'none';
        // If language is "none" or "Page Language", return "none"
        if (language === 'none' || language === 'Page Language') {
          return 'none';
        }
        // Otherwise, convert to uppercase (e.g., "Spanish" -> "SPANISH")
        return language.toUpperCase();
      } catch (error) {
        console.warn('[ApiService] Error getting language from localStorage:', error);
        return 'none';
      }
    };
    
    const requestBody = {
      initial_context,
      chat_history,
      question,
      languageCode: getLanguageCode()
    };
    
    try {
      console.log('[ApiService] Sending SSE request to:', url);
      console.log('[ApiService] Request body size:', {
        initial_context_length: initial_context.length,
        chat_history_length: chat_history.length,
        question_length: question.length
      });
      
      // Create abort controller for cancellation
      const abortController = new AbortController();
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        mode: 'cors',
        body: JSON.stringify(requestBody),
        signal: abortController.signal
      });
      
      if (!response.ok) {
        // Check for 429 rate limit error
        if (response.status === 429) {
          const error = new Error('Rate limit exceeded');
          error.status = 429;
          if (onError) onError(error);
          return () => {};
        }
        
        let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
        
        // Provide more specific error messages for common status codes
        if (response.status === 422) {
          errorMessage = `API request failed: 422 Unprocessable Entity. This usually means the request data is too large or contains invalid characters. Try asking a shorter question or the content might be too long.`;
        } else if (response.status === 413) {
          errorMessage = `API request failed: 413 Payload Too Large. The content or question is too large for the API to process.`;
        } else if (response.status === 400) {
          errorMessage = `API request failed: 400 Bad Request. The request format might be invalid.`;
        }
        
        const error = new Error(errorMessage);
        if (onError) onError(error);
        return () => {};
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
                  if (onComplete) onComplete(null);
                  break;
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
                  if (data.type === 'complete' && data.chat_history) {
                    console.log('[ApiService] Complete event - chat_history:', data.chat_history);
                    if (onComplete) {
                      onComplete(data.chat_history);
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

