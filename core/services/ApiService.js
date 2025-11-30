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
      console.log('[ApiService] Request payload structure:', {
        context_type: context_type || 'not provided',
        initial_context: initial_context.substring(0, 100) + (initial_context.length > 100 ? '...' : ''),
        chat_history: chat_history,
        question: question.substring(0, 100) + (question.length > 100 ? '...' : ''),
        languageCode: languageCode || 'not provided'
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
      
      // Make the SSE request
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify(textSegmentsWithLanguage),
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
          console.warn('[ApiService] Could not parse error response:', e);
        }
        throw new Error(errorMessage);
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
      console.error('[ApiService] Error initiating simplify request:', error);
      
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
      
      // Make the SSE request
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
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
          console.warn('[ApiService] Could not parse error response:', e);
        }
        throw new Error(errorMessage);
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
        const error = new Error(`Web search request failed: ${response.status} ${response.statusText}`);
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
      
      // Make the SSE request
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(textSegmentsWithLanguage),
        signal: abortController.signal
      });
      
      if (!response.ok) {
        // Check for 429 rate limit error
        if (response.status === 429) {
          const error = new Error('Rate limit exceeded');
          error.status = 429;
          throw error;
        }
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
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
            console.error('[ApiService] Stream processing error:', streamError);
            if (onError) onError(streamError);
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
      console.error('[ApiService] Error initiating word explanation request:', error);
      
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
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          word: word,
          meaning: meaning,
          examples: examples
        })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
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

