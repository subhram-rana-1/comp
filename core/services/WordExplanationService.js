/**
 * Word Explanation Service - Handles SSE API calls for word explanations
 * Modular service for the /api/v2/words-explanation endpoint
 */

class WordExplanationService {
  // Configurable base URL - uses same base as ApiService
  static BASE_URL = 'http://localhost:8000';
  
  // API endpoint
  static ENDPOINT = '/api/v2/words-explanation';
  
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
    const url = `${this.BASE_URL}${this.ENDPOINT}`;
    
    try {
      console.log('[WordExplanationService] Starting SSE request to:', url);
      console.log('[WordExplanationService] Text segments:', textSegments);
      
      // Create abort controller for cancellation
      const abortController = new AbortController();
      
      // Make the SSE request
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(textSegments),
        signal: abortController.signal
      });
      
      if (!response.ok) {
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
              console.log('[WordExplanationService] Stream complete');
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
                  console.log('[WordExplanationService] Received [DONE] signal');
                  if (onComplete) onComplete();
                  break;
                }
                
                // Parse JSON data
                try {
                  const eventData = JSON.parse(data);
                  console.log('[WordExplanationService] Received event:', eventData);
                  
                  if (onEvent) {
                    onEvent(eventData);
                  }
                } catch (parseError) {
                  console.error('[WordExplanationService] Error parsing event data:', parseError);
                }
              }
            }
          }
        } catch (streamError) {
          if (streamError.name === 'AbortError') {
            console.log('[WordExplanationService] Request aborted');
          } else {
            console.error('[WordExplanationService] Stream processing error:', streamError);
            if (onError) onError(streamError);
          }
        }
      };
      
      // Start processing the stream
      processStream();
      
      // Return abort function
      return () => {
        console.log('[WordExplanationService] Aborting request');
        abortController.abort();
      };
      
    } catch (error) {
      console.error('[WordExplanationService] Error initiating word explanation request:', error);
      
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
    this.BASE_URL = newBaseUrl;
    console.log('[WordExplanationService] Base URL updated to:', newBaseUrl);
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
export default WordExplanationService;

