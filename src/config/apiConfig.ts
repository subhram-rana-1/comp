/**
 * Centralized API Configuration
 * Single source of truth for all API endpoints and base URLs
 */

export class ApiConfig {
  private static _customBaseUrl: string | null = null;

  static get BASE_URL(): string {
    // Check for development environment variables or flags
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
      return 'http://localhost:8000';
    }

    // Default to production URL
    return 'https://caten-production.up.railway.app';
  }

  // API Endpoints
  static readonly ENDPOINTS = {
    ASK: '/api/v2/ask',
    PDF_TO_TEXT: '/api/v1/pdf-to-text',
    IMAGE_TO_TEXT: '/api/v1/image-to-text',
    GET_RANDOM_PARAGRAPH: '/api/v1/get-random-paragraph',
    SIMPLIFY: '/api/v2/simplify',
    SUMMARISE: '/api/v2/summarise',
    WORDS_EXPLANATION: '/api/v2/words-explanation',
    TRANSLATE: '/api/v2/translate',
    WEB_SEARCH_STREAM: '/api/v2/web-search-stream',
  } as const;

  // Helper method to get full URL for an endpoint
  static getUrl(endpoint: string): string {
    return `${this.getCurrentBaseUrl()}${endpoint}`;
  }

  // Method to override base URL at runtime (useful for testing)
  static setBaseUrl(newBaseUrl: string): void {
    this._customBaseUrl = newBaseUrl;
  }

  // Get current base URL (respects custom override)
  static getCurrentBaseUrl(): string {
    return this._customBaseUrl || this.BASE_URL;
  }
}

export default ApiConfig;

