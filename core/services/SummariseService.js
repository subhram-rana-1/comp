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
   * Summarise text content using SSE
   * @param {string} text - The text content to summarise
   * @param {Function} onEvent - Callback for each SSE event (data)
   * @param {Function} onComplete - Callback when stream completes
   * @param {Function} onError - Callback for errors
   * @returns {Function} Abort function to cancel the request
   */
  static async summarise(text, onEvent, onComplete, onError) {
    const url = `${this.BASE_URL}${this.ENDPOINT}`;
    
    try {
      console.log('[SummariseService] Starting SSE request to:', url);
      console.log('[SummariseService] Text length:', text.length);
      
      // Create abort controller for cancellation
      const abortController = new AbortController();
      
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
          console.warn('[SummariseService] Error getting language from localStorage:', error);
          return 'none';
        }
      };
      
      // Prepare request payload
      const requestBody = {
        text: text,
        languageCode: getLanguageCode()
      };
      
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
          console.warn('[SummariseService] Could not parse error response:', e);
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
              console.log('[SummariseService] Stream complete');
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
                  console.log('[SummariseService] Received [DONE] signal');
                  if (onComplete) onComplete();
                  break;
                }
                
                // Parse JSON data
                try {
                  const data = JSON.parse(dataStr);
                  console.log('[SummariseService] Received event:', data);
                  
                  // Handle chunk events (word-by-word streaming)
                  if (data.chunk !== undefined) {
                    console.log('[SummariseService] Chunk event - chunk:', data.chunk, 'accumulated length:', data.accumulated?.length || 0);
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
                    console.log('[SummariseService] Complete event - summary length:', data.summary?.length || 0);
                    if (onEvent) {
                      // Pass complete event with final data
                      onEvent({
                        type: 'complete',
                        summary: data.summary
                      });
                    }
                  }
                  
                  // Handle error events
                  else if (data.type === 'error') {
                    const error = new Error(data.error_message || data.error || 'Stream error occurred');
                    error.error_code = data.error_code;
                    console.error('[SummariseService] Error event:', error);
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
                  console.error('[SummariseService] Error parsing event data:', parseError);
                  console.error('[SummariseService] Raw data that failed to parse:', dataStr);
                }
              }
            }
          }
        } catch (streamError) {
          if (streamError.name === 'AbortError') {
            console.log('[SummariseService] Request aborted');
          } else {
            console.error('[SummariseService] Stream processing error:', streamError);
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
        console.log('[SummariseService] Aborting request');
        abortController.abort();
      };
      
    } catch (error) {
      console.error('[SummariseService] Error initiating summarise request:', error);
      
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

