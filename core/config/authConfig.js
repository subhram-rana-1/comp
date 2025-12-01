/**
 * Authentication Configuration
 * Configuration for Google Sign-In and authentication settings
 */

// Google OAuth Client ID - Replace with your actual client ID
export const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID_HERE';

// Device information for backend requests
export const DEVICE_INFO = navigator.userAgent || 'Chrome Extension';

// Maximum request count for unauthenticated devices (for debugging/reference)
// Note: This is enforced by the backend, not the frontend
export const UNAUTHENTICATED_DEVICE_MAX_REQUEST_COUNT = 10;

// Note: BACKEND_BASE_URL is imported from ApiConfig to avoid duplication

