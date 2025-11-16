/**
 * Web Search Service Class
 * Handles web search API calls with SSE streaming
 */

import ApiConfig from '../config/apiConfig.js';

class WebSearchService {
  // Use centralized config for base URL
  static get BASE_URL() {
    return ApiConfig.getCurrentBaseUrl();
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
    const url = `${this.BASE_URL}${ApiConfig.ENDPOINTS.WEB_SEARCH_STREAM}`;
    
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
        console.warn('[WebSearchService] Error getting language from storage:', error);
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
      console.log('[WebSearchService] Sending SSE request to:', url);
      console.log('[WebSearchService] Request body:', requestBody);
      
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
            console.log('[WebSearchService] Received [DONE] signal');
            if (onComplete) onComplete();
            return true; // Stop processing
          }
          
          // Parse JSON data
          try {
            if (!dataStr) {
              console.warn('[WebSearchService] Empty data string, skipping');
              return false;
            }
            
            const data = JSON.parse(dataStr);
            console.log('[WebSearchService] Received event:', data);
            
            // Validate that data has a type property
            if (!data || typeof data !== 'object' || !data.type) {
              console.warn('[WebSearchService] Event missing type property:', data);
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
              console.log('[WebSearchService] Received complete event');
              if (onComplete) onComplete();
              return true; // Stop processing
            }
            
            // Handle error event
            else if (data.type === 'error') {
              const error = new Error(data.error?.message || 'Web search error occurred');
              console.error('[WebSearchService] Error event:', error);
              if (onError) {
                onError(error);
              }
            } else {
              console.warn('[WebSearchService] Unknown event type:', data.type, data);
            }
          } catch (parseError) {
            console.error('[WebSearchService] Error parsing event data:', parseError);
            console.error('[WebSearchService] Raw data that failed to parse:', dataStr);
            console.error('[WebSearchService] Data string length:', dataStr.length);
            // Continue processing other lines even if one fails
          }
        } else {
          // Log non-data lines for debugging (but don't process them)
          if (trimmedLine && !trimmedLine.startsWith(':')) {
            console.warn('[WebSearchService] Received non-data line:', trimmedLine.substring(0, 100));
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
              console.log('[WebSearchService] Stream complete');
              
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
            console.log('[WebSearchService] Request aborted');
          } else {
            console.error('[WebSearchService] Stream processing error:', streamError);
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
        console.log('[WebSearchService] Aborting request');
        abortController.abort();
      };
      
    } catch (error) {
      console.error('[WebSearchService] Error initiating web search request:', error);
      
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
}

// Export for use in content script
export default WebSearchService;

