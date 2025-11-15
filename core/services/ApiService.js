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

