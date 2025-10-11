/**
 * Centralized API Configuration
 * Single source of truth for all API endpoints and base URLs
 */

class ApiConfig {
  // Environment-based configuration
  static get BASE_URL() {
    // Force localhost for development - remove the hostname check
    // since extensions run in a different context
    return 'http://localhost:8000';
    
    // Check if we're in development mode (localhost)
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return 'http://localhost:8000';
    }
    
    // Check for development environment variables or flags
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
      return 'http://localhost:8000';
    }
    
    // Default to production URL
    return 'https://caten-production.up.railway.app';
  }
  
  // API Endpoints
  static ENDPOINTS = {
    ASK: '/api/v2/ask',
    PDF_TO_TEXT: '/api/v1/pdf-to-text',
    IMAGE_TO_TEXT: '/api/v1/image-to-text',
    GET_RANDOM_PARAGRAPH: '/api/v1/get-random-paragraph',
    SIMPLIFY: '/api/v2/simplify',
    WORDS_EXPLANATION: '/api/v2/words-explanation'
  };
  
  // Helper method to get full URL for an endpoint
  static getUrl(endpoint) {
    return `${this.BASE_URL}${endpoint}`;
  }
  
  // Method to override base URL at runtime (useful for testing)
  static setBaseUrl(newBaseUrl) {
    this._customBaseUrl = newBaseUrl;
  }
  
  // Get current base URL (respects custom override)
  static getCurrentBaseUrl() {
    return this._customBaseUrl || this.BASE_URL;
  }
}

// Export for use in other modules
export default ApiConfig;
