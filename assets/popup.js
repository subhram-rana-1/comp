// ===================================
// Import Auth Services
// ===================================
import AuthService from '../core/services/AuthService.js';
import AuthApiService from '../core/services/AuthApiService.js';

// ===================================
// Domain Manager Module - Handles domain extraction
// ===================================
const DomainManager = {
  /**
   * Get the current tab's domain
   * @returns {Promise<string>} The domain of the current tab
   */
  async getCurrentDomain() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.url) return 'unknown';
      
      const url = new URL(tab.url);
      return url.hostname;
    } catch (error) {
      console.error('Error getting current domain:', error);
      return 'unknown';
    }
  }
};

// ===================================
// Storage Module - Handles Chrome Storage API (Global)
// ===================================
const StorageManager = {
  GLOBAL_STORAGE_KEY: 'is_extension_globally_enabled',

  /**
   * Save global toggle state to Chrome local storage
   * @param {boolean} isEnabled - The toggle state to save
   */
  async saveToggleState(isEnabled) {
    try {
      await chrome.storage.local.set({ [this.GLOBAL_STORAGE_KEY]: isEnabled });
      console.log(`Global toggle state saved:`, isEnabled);
    } catch (error) {
      console.error('Error saving global toggle state:', error);
    }
  },

  /**
   * Load global toggle state from Chrome local storage
   * If not found, creates it and sets to true (enabled by default)
   * @returns {Promise<boolean>} The saved toggle state (defaults to true - enabled by default)
   */
  async loadToggleState() {
    try {
      const result = await chrome.storage.local.get([this.GLOBAL_STORAGE_KEY]);
      let state = result[this.GLOBAL_STORAGE_KEY];
      
      // If not found, create it and set to true (enabled by default)
      if (state === undefined) {
        state = true;
        await chrome.storage.local.set({ [this.GLOBAL_STORAGE_KEY]: state });
        console.log('Global toggle state not found, created with default value: true');
      }
      
      console.log(`Global toggle state loaded:`, state);
      return state;
    } catch (error) {
      console.error('Error loading global toggle state:', error);
      // On error, default to true (enabled) and try to save it
      try {
        await chrome.storage.local.set({ [this.GLOBAL_STORAGE_KEY]: true });
      } catch (saveError) {
        console.error('Error saving default state:', saveError);
      }
      return true; // Default to true (enabled) on error
    }
  }
};

// ===================================
// Toast Notification Manager
// ===================================
const ToastManager = {
  /**
   * Show a toast notification
   * @param {string} message - Message to display
   * @param {string} type - Type: 'success', 'error', 'info' (default: 'info')
   * @param {number} duration - Duration in milliseconds (default: 3000)
   */
  show(message, type = 'info', duration = 3000) {
    const toast = document.getElementById('toastNotification');
    if (!toast) return;

    toast.textContent = message;
    toast.className = `toast-notification ${type}`;
    toast.style.display = 'block';

    setTimeout(() => {
      toast.style.display = 'none';
    }, duration);
  }
};

// ===================================
// UI Module - Handles UI Updates
// ===================================
const UIManager = {
  // DOM elements - get dynamically to ensure DOM is ready
  get toggleSwitch() { 
    return document.getElementById('extensionToggle'); 
  },
  get catIcon() { return document.querySelector('.cat-icon'); },
  get title() { return document.querySelector('.title'); },
  get instructions() { return document.querySelector('.instructions'); },
  get fingerPoint() { return document.querySelector('.finger-point'); },
  
  // Auth UI elements
  get authSection() { return document.getElementById('authSection'); },
  get authLoggedIn() { return document.getElementById('authLoggedIn'); },
  get authLoggedOut() { return document.getElementById('authLoggedOut'); },
  get profilePicture() { return document.getElementById('profilePicture'); },
  get authGreeting() { return document.getElementById('authGreeting'); },
  get logoutButton() { return document.getElementById('logoutButton'); },
  get googleSignInButton() { return document.getElementById('googleSignInButton'); },
  get authSpinner() { return document.getElementById('authSpinner'); },

  /**
   * Update UI based on toggle state
   * @param {boolean} isEnabled - Whether the extension is enabled
   */
  updateUI(isEnabled) {
    if (isEnabled) {
      // ON state
      if (this.catIcon) this.catIcon.classList.add('active');
      document.body.classList.add('extension-on');
      if (this.instructions) this.instructions.classList.add('show');
      if (this.fingerPoint) this.fingerPoint.style.display = 'none';
      console.log('Extension Enabled');
    } else {
      // OFF state
      if (this.catIcon) this.catIcon.classList.remove('active');
      document.body.classList.remove('extension-on');
      if (this.instructions) this.instructions.classList.remove('show');
      if (this.fingerPoint) this.fingerPoint.style.display = 'block';
      console.log('Extension Disabled');
    }
  },

  /**
   * Set toggle switch state without triggering change event
   * @param {boolean} isEnabled - The state to set
   */
  setToggleState(isEnabled) {
    const toggle = this.toggleSwitch;
    if (toggle) {
      // Store the current state to prevent infinite loops
      const previousState = toggle.checked;
      toggle.checked = isEnabled;
      console.log('[UIManager] Toggle state set to:', isEnabled, '(was:', previousState, ')');
      
      // Force a visual update by triggering a small reflow
      toggle.style.display = 'none';
      toggle.offsetHeight; // Trigger reflow
      toggle.style.display = '';
    } else {
      console.error('[UIManager] Toggle switch not found!');
    }
  },

  /**
   * Update auth UI based on login state
   * @param {boolean} isLoggedIn - Whether user is logged in
   * @param {Object|null} user - User data (name, picture_url)
   */
  updateAuthUI(isLoggedIn, user = null) {
    const loggedInView = this.authLoggedIn;
    const loggedOutView = this.authLoggedOut;
    const spinner = this.authSpinner;

    if (isLoggedIn && user) {
      // Show logged-in view
      if (loggedInView) loggedInView.style.display = 'flex';
      if (loggedOutView) loggedOutView.style.display = 'none';
      if (spinner) spinner.style.display = 'none';

      // Update profile picture
      if (this.profilePicture && user.picture_url) {
        this.profilePicture.src = user.picture_url;
        this.profilePicture.alt = user.name || 'Profile';
      }

      // Update greeting
      if (this.authGreeting) {
        const name = user.name || 'User';
        this.authGreeting.textContent = `Hi ${name} 🔆`;
      }
    } else {
      // Show logged-out view
      if (loggedInView) loggedInView.style.display = 'none';
      if (loggedOutView) loggedOutView.style.display = 'flex';
      if (spinner) spinner.style.display = 'none';
    }
  },

  /**
   * Show auth spinner
   */
  showAuthSpinner() {
    const spinner = this.authSpinner;
    const loggedInView = this.authLoggedIn;
    const loggedOutView = this.authLoggedOut;

    if (spinner) spinner.style.display = 'flex';
    if (loggedInView) loggedInView.style.display = 'none';
    if (loggedOutView) loggedOutView.style.display = 'none';
  },

  /**
   * Hide auth spinner
   */
  hideAuthSpinner() {
    const spinner = this.authSpinner;
    if (spinner) spinner.style.display = 'none';
  }
};

// ===================================
// App Initialization and Event Handlers
// ===================================
class PopupApp {
  static currentDomain = null;
  static loadingState = null;
  static normalContent = null;
  static toggleInitialized = false;
  static authInitialized = false;
  static googleSignInButtonRendered = false;

  /**
   * Check if the current tab is loading
   */
  static async checkTabLoading() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // If no tab or no URL, assume not loading
      if (!tab || !tab.url) {
        return false;
      }

      // Special pages (chrome://, about:, etc.) are considered loaded
      if (tab.url.startsWith('chrome://') || 
          tab.url.startsWith('chrome-extension://') ||
          tab.url.startsWith('about:') ||
          tab.url.startsWith('edge://')) {
        return false;
      }

      // Tab is loading only if status is explicitly 'loading'
      // If status is 'complete' or undefined, consider it loaded
      return tab.status === 'loading';
    } catch (error) {
      console.error('Error checking tab status:', error);
      // On error, assume page is loaded to avoid blocking UI
      return false;
    }
  }

  /**
   * Show loading state or normal content based on tab status
   */
  static async updateContentVisibility() {
    const isLoading = await this.checkTabLoading();
    const toggleContainer = document.querySelector('.toggle-container');
    
    if (this.loadingState && this.normalContent) {
      if (isLoading) {
        // Show loading state
        this.loadingState.style.display = 'flex';
        this.normalContent.classList.remove('visible');
        // Hide toggle button only if we're sure it's loading
        // But keep it visible for special pages or if status is unclear
        if (toggleContainer) {
          toggleContainer.style.display = 'none';
        }
      } else {
        // Show normal content
        this.loadingState.style.display = 'none';
        this.normalContent.classList.add('visible');
        // Show toggle button
        if (toggleContainer) {
          toggleContainer.style.display = 'flex';
        }
      }
    } else {
      // If elements don't exist, ensure toggle is visible
      if (toggleContainer) {
        toggleContainer.style.display = 'flex';
      }
    }
  }

  /**
   * Initialize the popup application
   */
  static async init() {
    // Get DOM elements
    this.loadingState = document.getElementById('loadingState');
    this.normalContent = document.getElementById('normalContent');

    // Check initial tab loading state
    await this.updateContentVisibility();

    // Set a timeout fallback: after 2 seconds, always show content
    // This ensures the toggle is always accessible even if status check fails
    const fallbackTimeout = setTimeout(() => {
      console.log('[Popup] Fallback timeout: showing content regardless of status');
      if (this.loadingState) this.loadingState.style.display = 'none';
      if (this.normalContent) this.normalContent.classList.add('visible');
      const toggleContainer = document.querySelector('.toggle-container');
      if (toggleContainer) toggleContainer.style.display = 'flex';
    }, 2000);

    // Poll tab status every 200ms while loading (max 10 seconds)
    let pollCount = 0;
    const maxPolls = 50; // 50 * 200ms = 10 seconds max
    const checkInterval = setInterval(async () => {
      pollCount++;
      const isLoading = await this.checkTabLoading();
      await this.updateContentVisibility();
      
      // Stop polling once page is loaded or max polls reached
      if (!isLoading || pollCount >= maxPolls) {
        clearInterval(checkInterval);
        clearTimeout(fallbackTimeout);
        // Ensure content is shown if we stopped due to max polls
        if (pollCount >= maxPolls) {
          console.log('[Popup] Max polls reached: showing content');
          if (this.loadingState) this.loadingState.style.display = 'none';
          if (this.normalContent) this.normalContent.classList.add('visible');
          const toggleContainer = document.querySelector('.toggle-container');
          if (toggleContainer) toggleContainer.style.display = 'flex';
        }
      }
    }, 200);

    // Also listen for tab updates
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' || changeInfo.status === 'loading') {
        this.updateContentVisibility();
        // Clear fallback timeout if status is complete
        if (changeInfo.status === 'complete') {
          clearTimeout(fallbackTimeout);
        }
      }
    });

    // Always initialize toggle state immediately, regardless of content visibility
    // This ensures the toggle always reflects the saved state when popup opens
    await this.initializeToggle();

    // Initialize auth
    await this.initializeAuth();
  }

  /**
   * Initialize the toggle switch with saved state
   * This is called immediately on popup open to ensure toggle reflects saved state
   */
  static async initializeToggle() {
    try {
      // Wait for toggle switch to be available in DOM
      const toggleSwitch = UIManager.toggleSwitch;
      if (!toggleSwitch) {
        console.log('[Popup] Toggle switch not found, retrying...');
        // Retry after a short delay if toggle isn't ready
        setTimeout(() => this.initializeToggle(), 50);
        return;
      }

      // Load saved state from storage
      const savedState = await StorageManager.loadToggleState();
      console.log('[Popup] Initializing toggle with saved state:', savedState);
      
      // Update toggle switch state (without triggering change event)
      UIManager.setToggleState(savedState);
      
      // Update UI to reflect the state
      UIManager.updateUI(savedState);

      // Attach event listener for toggle changes
      // Check if already initialized to avoid duplicate listeners
      if (!this.toggleInitialized) {
        const toggleHandler = async (event) => {
          console.log('[Popup] ===== TOGGLE EVENT FIRED =====');
          console.log('[Popup] Event type:', event.type);
          console.log('[Popup] Toggle checked state:', toggleSwitch.checked);
          await this.handleToggleChange(event);
        };
        
        // Add change event listener (primary)
        toggleSwitch.addEventListener('change', toggleHandler);
        
        // Also listen to click on the label/toggle-slider in case the input change doesn't fire
        const toggleLabel = toggleSwitch.closest('.toggle-switch');
        if (toggleLabel) {
          toggleLabel.addEventListener('click', (e) => {
            // Only handle if the click wasn't directly on the input
            if (e.target !== toggleSwitch) {
              setTimeout(async () => {
                console.log('[Popup] Toggle label clicked, state:', toggleSwitch.checked);
                const fakeEvent = { target: toggleSwitch, type: 'change' };
                await this.handleToggleChange(fakeEvent);
              }, 0);
            }
          });
        }
        
        this.toggleInitialized = true;
        this.toggleHandler = toggleHandler; // Store reference
        console.log('[Popup] Toggle event listeners attached');
        console.log('[Popup] Toggle element:', {
          id: toggleSwitch.id,
          type: toggleSwitch.type,
          checked: toggleSwitch.checked,
          disabled: toggleSwitch.disabled,
          parent: toggleSwitch.parentElement?.className
        });
      }
      
      console.log('[Popup] Toggle initialized successfully. Final state:', toggleSwitch.checked);
    } catch (error) {
      console.error('[Popup] Error initializing toggle:', error);
      // Retry after a short delay
      setTimeout(() => this.initializeToggle(), 100);
    }
  }

  /**
   * Handle toggle switch change event
   * @param {Event} event - The change event
   */
  static async handleToggleChange(event) {
    const toggleSwitch = event.target;
    const isEnabled = toggleSwitch.checked;
    
    console.log('[Popup] ===== TOGGLE CHANGED =====');
    console.log('[Popup] New toggle state:', isEnabled);
    console.log('[Popup] Toggle element:', toggleSwitch);
    
    // Update UI
    UIManager.updateUI(isEnabled);
    
    // Save global state to storage
    await StorageManager.saveToggleState(isEnabled);
    console.log('[Popup] Global state saved to storage:', isEnabled);
    
    // Notify content script of the change (broadcast to all tabs)
    try {
      const tabs = await chrome.tabs.query({});
      console.log('[Popup] Sending message to all tabs:', tabs.length);
      
      for (const tab of tabs) {
        if (tab?.id) {
          try {
            await chrome.tabs.sendMessage(tab.id, {
              type: 'TOGGLE_EXTENSION_GLOBAL',
              isEnabled: isEnabled
            });
            console.log('[Popup] Message sent to tab:', tab.id);
          } catch (error) {
            // Tab might not have content script loaded, ignore
            console.log('[Popup] Could not send message to tab:', tab.id, error.message);
          }
        }
      }
    } catch (error) {
      console.error('[Popup] Error sending message to content scripts:', error);
      // Storage change listener should still work even if message fails
    }
    
    console.log('[Popup] ===== TOGGLE CHANGE HANDLED =====');
  }

  /**
   * Initialize authentication
   */
  static async initializeAuth() {
    try {
      // Wait for Google Identity Services to load
      await this.waitForGoogleIdentityServices();

      // Check if user is logged in
      const isLoggedIn = await AuthService.isLoggedIn();
      let user = null;

      if (isLoggedIn) {
        user = await AuthService.getUser();
        // Optionally verify token by calling profile endpoint
        try {
          const profileData = await AuthApiService.get('/profile');
          if (profileData && profileData.user) {
            user = profileData.user;
            // Update stored user data
            const accessToken = await AuthService.getAccessToken();
            const refreshToken = await AuthService.getRefreshToken();
            await AuthService.saveTokens(accessToken, refreshToken, user);
          }
        } catch (error) {
          console.warn('[Popup] Could not fetch profile, using stored user data:', error);
          // If profile fetch fails with auth error, user might not be logged in
          if (error.message === 'SIGN_IN_REQUIRED' || error.message === 'TOKEN_REFRESH_FAILED') {
            await AuthService.clearTokens();
            user = null;
          }
        }
      }

      // Update UI
      UIManager.updateAuthUI(isLoggedIn && user, user);

      // Set up event handlers
      if (!this.authInitialized) {
        this.setupAuthEventHandlers();
        this.authInitialized = true;
      }

      // Initialize Google Sign-In and render button if not logged in
      if (!isLoggedIn || !user) {
        await this.initializeAndRenderGoogleSignIn();
      }

      console.log('[Popup] Auth initialized, logged in:', isLoggedIn && !!user);
    } catch (error) {
      console.error('[Popup] Error initializing auth:', error);
      // Show logged-out state on error
      UIManager.updateAuthUI(false);
      // Try to render sign-in button anyway
      try {
        await this.initializeAndRenderGoogleSignIn();
      } catch (renderError) {
        console.error('[Popup] Error rendering sign-in button:', renderError);
      }
    }
  }

  /**
   * Wait for Google Identity Services to load
   * @returns {Promise<void>}
   */
  static async waitForGoogleIdentityServices() {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (typeof google !== 'undefined' && google.accounts) {
        resolve();
        return;
      }

      // Wait for script to load (max 10 seconds)
      let attempts = 0;
      const maxAttempts = 100; // 10 seconds with 100ms intervals

      const checkInterval = setInterval(() => {
        attempts++;
        if (typeof google !== 'undefined' && google.accounts) {
          clearInterval(checkInterval);
          resolve();
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          reject(new Error('Google Identity Services failed to load'));
        }
      }, 100);
    });
  }

  /**
   * Initialize Google Sign-In and render button
   */
  static async initializeAndRenderGoogleSignIn() {
    try {
      const buttonElement = UIManager.googleSignInButton;
      if (!buttonElement || this.googleSignInButtonRendered) return;

      if (typeof google === 'undefined' || !google.accounts) {
        console.warn('[Popup] Google Identity Services not loaded, cannot render button');
        return;
      }

      // Import GOOGLE_CLIENT_ID
      const { GOOGLE_CLIENT_ID } = await import('../core/config/authConfig.js');

      // Initialize Google Sign-In with callback
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          await this.handleGoogleSignIn(response.credential);
        }
      });

      // Render the button
      google.accounts.id.renderButton(buttonElement, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        width: 300
      });

      this.googleSignInButtonRendered = true;
      console.log('[Popup] Google Sign-In button rendered');
    } catch (error) {
      console.error('[Popup] Error initializing/rendering Google Sign-In button:', error);
    }
  }

  /**
   * Handle Google Sign-In callback
   * @param {string} idToken - Google ID token
   */
  static async handleGoogleSignIn(idToken) {
    try {
      UIManager.showAuthSpinner();

      const deviceId = await AuthService.getDeviceId();
      const { DEVICE_INFO } = await import('../core/config/authConfig.js');
      const ApiConfig = (await import('../core/config/apiConfig.js')).default;
      const backendUrl = ApiConfig.getCurrentBaseUrl();

      // Exchange id_token for backend tokens
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
      await AuthService.saveTokens(access_token, refresh_token, user);

      // Update UI
      UIManager.updateAuthUI(true, user);
      UIManager.hideAuthSpinner();

      ToastManager.show('Signed in successfully!', 'success');

      console.log('[Popup] Sign-in successful');
    } catch (error) {
      console.error('[Popup] Sign-in error:', error);
      UIManager.updateAuthUI(false);
      UIManager.hideAuthSpinner();
      ToastManager.show('Sign-in failed. Please try again.', 'error', 5000);
    }
  }

  /**
   * Handle logout
   */
  static async handleLogout() {
    try {
      UIManager.showAuthSpinner();

      await AuthService.logout();

      // Update UI
      UIManager.updateAuthUI(false);
      UIManager.hideAuthSpinner();

      // Re-render sign-in button
      this.googleSignInButtonRendered = false;
      await this.initializeAndRenderGoogleSignIn();

      ToastManager.show('Logged out successfully', 'success');

      console.log('[Popup] Logout successful');
    } catch (error) {
      console.error('[Popup] Logout error:', error);
      // Clear UI anyway
      UIManager.updateAuthUI(false);
      UIManager.hideAuthSpinner();
      ToastManager.show('Logout completed', 'info');
    }
  }

  /**
   * Set up auth event handlers
   */
  static setupAuthEventHandlers() {
    // Logout button
    const logoutButton = UIManager.logoutButton;
    if (logoutButton) {
      logoutButton.addEventListener('click', () => {
        this.handleLogout();
      });
    }
  }
}

// Initialize the app when DOM is ready
PopupApp.init();

// ===================================
// Settings Button Handler
// ===================================
// Settings button has been moved to the close button in content script
// No longer needed in popup

