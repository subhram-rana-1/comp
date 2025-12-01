/**
 * Authentication Service
 * Handles Google Sign-In, token management, device ID, and user data
 */

import ApiConfig from '../config/apiConfig.js';
import { GOOGLE_CLIENT_ID, DEVICE_INFO } from '../config/authConfig.js';

class AuthService {
  // Storage keys
  static STORAGE_KEYS = {
    DEVICE_ID: 'device_id',
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    USER: 'user'
  };

  /**
   * Generate a UUID v4
   * @returns {string} UUID
   */
  static generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Get or generate device ID and persist it
   * @returns {Promise<string>} Device ID (UUID)
   */
  static async getDeviceId() {
    try {
      const result = await chrome.storage.local.get([this.STORAGE_KEYS.DEVICE_ID]);
      let deviceId = result[this.STORAGE_KEYS.DEVICE_ID];

      if (!deviceId) {
        deviceId = this.generateUUID();
        await chrome.storage.local.set({ [this.STORAGE_KEYS.DEVICE_ID]: deviceId });
        console.log('[AuthService] Generated new device ID:', deviceId);
      }

      return deviceId;
    } catch (error) {
      console.error('[AuthService] Error getting device ID:', error);
      // Fallback: generate a temporary ID
      return this.generateUUID();
    }
  }

  /**
   * Get access token from storage
   * @returns {Promise<string|null>} Access token or null
   */
  static async getAccessToken() {
    try {
      const result = await chrome.storage.local.get([this.STORAGE_KEYS.ACCESS_TOKEN]);
      return result[this.STORAGE_KEYS.ACCESS_TOKEN] || null;
    } catch (error) {
      console.error('[AuthService] Error getting access token:', error);
      return null;
    }
  }

  /**
   * Get refresh token from storage
   * @returns {Promise<string|null>} Refresh token or null
   */
  static async getRefreshToken() {
    try {
      const result = await chrome.storage.local.get([this.STORAGE_KEYS.REFRESH_TOKEN]);
      return result[this.STORAGE_KEYS.REFRESH_TOKEN] || null;
    } catch (error) {
      console.error('[AuthService] Error getting refresh token:', error);
      return null;
    }
  }

  /**
   * Get user data from storage
   * @returns {Promise<Object|null>} User object or null
   */
  static async getUser() {
    try {
      const result = await chrome.storage.local.get([this.STORAGE_KEYS.USER]);
      return result[this.STORAGE_KEYS.USER] || null;
    } catch (error) {
      console.error('[AuthService] Error getting user:', error);
      return null;
    }
  }

  /**
   * Save tokens and user data to storage
   * @param {string} accessToken - Access token
   * @param {string} refreshToken - Refresh token
   * @param {Object} user - User data (id, name, picture_url)
   */
  static async saveTokens(accessToken, refreshToken, user) {
    try {
      await chrome.storage.local.set({
        [this.STORAGE_KEYS.ACCESS_TOKEN]: accessToken,
        [this.STORAGE_KEYS.REFRESH_TOKEN]: refreshToken,
        [this.STORAGE_KEYS.USER]: user
      });
      console.log('[AuthService] Tokens and user data saved');
    } catch (error) {
      console.error('[AuthService] Error saving tokens:', error);
      throw error;
    }
  }

  /**
   * Clear all tokens and user data from storage
   */
  static async clearTokens() {
    try {
      await chrome.storage.local.remove([
        this.STORAGE_KEYS.ACCESS_TOKEN,
        this.STORAGE_KEYS.REFRESH_TOKEN,
        this.STORAGE_KEYS.USER
      ]);
      console.log('[AuthService] Tokens cleared');
    } catch (error) {
      console.error('[AuthService] Error clearing tokens:', error);
      throw error;
    }
  }

  /**
   * Check if user is logged in (has access token)
   * @returns {Promise<boolean>} True if logged in
   */
  static async isLoggedIn() {
    const token = await this.getAccessToken();
    return !!token;
  }

  /**
   * Initialize Google Identity Services
   * @returns {Promise<void>}
   */
  static async initializeGoogleSignIn() {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.accounts) {
        reject(new Error('Google Identity Services library not loaded'));
        return;
      }

      try {
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            // This callback is handled by signInWithGoogle
            console.log('[AuthService] Google Sign-In callback received');
          }
        });
        console.log('[AuthService] Google Identity Services initialized');
        resolve();
      } catch (error) {
        console.error('[AuthService] Error initializing Google Sign-In:', error);
        reject(error);
      }
    });
  }

  /**
   * Sign in with Google and exchange id_token for backend tokens
   * @returns {Promise<Object>} User data and tokens
   */
  static async signInWithGoogle() {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.accounts) {
        reject(new Error('Google Identity Services library not loaded'));
        return;
      }

      // Use One Tap or button flow to get id_token
      google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Fallback to button flow
          console.log('[AuthService] One Tap not available, using button flow');
          reject(new Error('One Tap not available - button flow required'));
          return;
        }
      });

      // Set up callback for when user signs in
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          try {
            const idToken = response.credential;
            console.log('[AuthService] Received id_token from Google');

            // Exchange id_token for backend tokens
            const deviceId = await this.getDeviceId();
            const backendUrl = ApiConfig.getCurrentBaseUrl();

            const authResponse = await fetch(`${backendUrl}/auth/google`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                id_token: idToken,
                device_id: deviceId,
                device_info: DEVICE_INFO
              }),
              credentials: 'omit'
            });

            if (!authResponse.ok) {
              const errorData = await authResponse.json().catch(() => ({}));
              throw new Error(errorData.error || `Auth failed: ${authResponse.status}`);
            }

            const authData = await authResponse.json();
            const { access_token, refresh_token, user } = authData;

            // Save tokens and user data
            await this.saveTokens(access_token, refresh_token, user);

            console.log('[AuthService] Sign-in successful');
            resolve({ access_token, refresh_token, user });
          } catch (error) {
            console.error('[AuthService] Sign-in error:', error);
            reject(error);
          }
        }
      });
    });
  }

  /**
   * Sign in using button (interactive flow)
   * @param {HTMLElement} buttonElement - Button element to render Google sign-in
   * @returns {Promise<Object>} User data and tokens
   */
  static async signInWithGoogleButton(buttonElement) {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.accounts) {
        reject(new Error('Google Identity Services library not loaded'));
        return;
      }

      // Initialize with callback
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          try {
            const idToken = response.credential;
            console.log('[AuthService] Received id_token from Google button');

            // Exchange id_token for backend tokens
            const deviceId = await this.getDeviceId();
            const backendUrl = ApiConfig.getCurrentBaseUrl();

            const authResponse = await fetch(`${backendUrl}/auth/google`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                id_token: idToken,
                device_id: deviceId,
                device_info: DEVICE_INFO
              }),
              credentials: 'omit'
            });

            if (!authResponse.ok) {
              const errorData = await authResponse.json().catch(() => ({}));
              throw new Error(errorData.error || `Auth failed: ${authResponse.status}`);
            }

            const authData = await authResponse.json();
            const { access_token, refresh_token, user } = authData;

            // Save tokens and user data
            await this.saveTokens(access_token, refresh_token, user);

            console.log('[AuthService] Sign-in successful');
            resolve({ access_token, refresh_token, user });
          } catch (error) {
            console.error('[AuthService] Sign-in error:', error);
            reject(error);
          }
        }
      });

      // Render button
      try {
        google.accounts.id.renderButton(buttonElement, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          width: buttonElement.offsetWidth || 300
        });
      } catch (error) {
        console.error('[AuthService] Error rendering button:', error);
        reject(error);
      }
    });
  }

  /**
   * Refresh access token using refresh token
   * @returns {Promise<Object>} New access token and possibly new refresh token
   */
  static async refreshAccessToken() {
    try {
      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const deviceId = await this.getDeviceId();
      const backendUrl = ApiConfig.getCurrentBaseUrl();

      const response = await fetch(`${backendUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
          device_id: deviceId
        }),
        credentials: 'omit'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Refresh failed: ${response.status}`);
      }

      const data = await response.json();
      const { access_token, refresh_token: newRefreshToken } = data;

      // Update tokens in storage
      const user = await this.getUser();
      await this.saveTokens(
        access_token,
        newRefreshToken || refreshToken, // Use new refresh token if provided, else keep old one
        user
      );

      console.log('[AuthService] Token refreshed successfully');
      return { access_token, refresh_token: newRefreshToken || refreshToken };
    } catch (error) {
      console.error('[AuthService] Token refresh error:', error);
      throw error;
    }
  }

  /**
   * Logout user - call backend and clear tokens
   * @returns {Promise<void>}
   */
  static async logout() {
    try {
      const accessToken = await this.getAccessToken();
      const backendUrl = ApiConfig.getCurrentBaseUrl();

      // Call logout endpoint if we have a token
      if (accessToken) {
        try {
          await fetch(`${backendUrl}/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            credentials: 'omit'
          });
        } catch (error) {
          console.warn('[AuthService] Logout API call failed, clearing tokens anyway:', error);
        }
      }

      // Clear tokens from storage
      await this.clearTokens();
      console.log('[AuthService] Logout successful');
    } catch (error) {
      console.error('[AuthService] Logout error:', error);
      // Clear tokens even if API call fails
      try {
        await this.clearTokens();
      } catch (clearError) {
        console.error('[AuthService] Error clearing tokens during logout:', clearError);
      }
      throw error;
    }
  }
}

export default AuthService;

