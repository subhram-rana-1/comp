/**
 * Centralized API Configuration
 * Single source of truth for all API endpoints and base URLs
 */

class ApiConfig {
  // Environment-based configuration
  static get BASE_URL() {
    // Check for development environment variables or flags
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
      return 'http://localhost:8000';
    }

    // Default to production URL
    // TODO: Change to production URL
    return 'http://localhost:8000';
    // return 'https://caten-production.up.railway.app';
  }
  
  
  // Google OAuth Client ID
  // ----------- IMPORTANT ----------- //
    // Local testing :
    //  1. Set GOOGLE_CLIENT_ID here = 355884005048-4bn6e6rbq9mfdrb2q43sthsejc88sbcc.apps.googleusercontent.com
    //  2. Set "Item Id" in the cloude console project = whatever the extension id is after doing "Load unpacked" activity
    // TO be able to publishm in chrome web store :
    //  1. Set GOOGLE_CLIENT_ID here = 355884005048-76olfh4sp2o2uitojjeslpsaonvc7d2s.apps.googleusercontent.com
    //  2. Set "Item Id" in the cloude console project = nmphalmbdmddagbllhjnfnmodfmbnlkp (get it from https://chromewebstore.google.com/ for your extension)
  // ----------- IMPORTANT ----------- //
  static GOOGLE_CLIENT_ID = '355884005048-4bn6e6rbq9mfdrb2q43sthsejc88sbcc.apps.googleusercontent.com';
  
  // API Endpoints
  static ENDPOINTS = {
    ASK: '/api/v2/ask',
    PDF_TO_TEXT: '/api/v1/pdf-to-text',
    IMAGE_TO_TEXT: '/api/v1/image-to-text',
    GET_RANDOM_PARAGRAPH: '/api/v1/get-random-paragraph',
    SIMPLIFY: '/api/v2/simplify',
    SUMMARISE: '/api/v2/summarise',
    WORDS_EXPLANATION: '/api/v2/words-explanation',
    TRANSLATE: '/api/v2/translate',
    WEB_SEARCH_STREAM: '/api/v2/web-search-stream',
    AUTH_LOGIN: '/api/auth/login',
    AUTH_LOGOUT: '/api/auth/logout'
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
