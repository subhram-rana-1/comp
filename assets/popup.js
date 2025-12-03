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
// User Account Manager Module - Handles user account data
// ===================================
const UserAccountManager = {
  STORAGE_KEY: 'xplaino_userAccountData',
  userAccountData: null, // In-memory variable

  /**
   * Load user account data from chrome.storage.local
   * Sets in-memory userAccountData variable (null if not found)
   * @returns {Promise<void>}
   */
  async loadUserAccountData() {
    try {
      console.log('[UserAccountManager] Loading user account data from storage key:', this.STORAGE_KEY);
      const result = await chrome.storage.local.get([this.STORAGE_KEY]);
      console.log('[UserAccountManager] Storage result:', result);
      this.userAccountData = result[this.STORAGE_KEY] || null;
      console.log('[UserAccountManager] User account data loaded:', this.userAccountData ? 'found' : 'not found');
      if (this.userAccountData) {
        console.log('[UserAccountManager] User data:', JSON.stringify(this.userAccountData, null, 2));
      }
    } catch (error) {
      console.error('[UserAccountManager] Error loading user account data:', error);
      this.userAccountData = null;
    }
  },

  /**
   * Save user account data to chrome.storage.local
   * @param {Object} data - User account data to save
   * @returns {Promise<void>}
   */
  async saveUserAccountData(data) {
    try {
      await chrome.storage.local.set({ [this.STORAGE_KEY]: data });
      this.userAccountData = data;
      console.log('[UserAccountManager] User account data saved');
    } catch (error) {
      console.error('[UserAccountManager] Error saving user account data:', error);
      throw error;
    }
  },

  /**
   * Get in-memory user account data
   * @returns {Object|null} User account data or null
   */
  getUserAccountData() {
    return this.userAccountData;
  },

  /**
   * Clear user account data from storage and memory
   * @returns {Promise<void>}
   */
  async clearUserAccountData() {
    try {
      await chrome.storage.local.remove([this.STORAGE_KEY]);
      this.userAccountData = null;
      console.log('[UserAccountManager] User account data cleared');
    } catch (error) {
      console.error('[UserAccountManager] Error clearing user account data:', error);
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

  /**
   * Check if the current tab is loading
   */
  static async checkTabLoading() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      // Tab is loading if status is 'loading'
      return tab?.status === 'loading';
    } catch (error) {
      console.error('Error checking tab status:', error);
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
        // Hide toggle button
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
    }
  }

  /**
   * Initialize the popup application
   */
  static async init() {
    console.log('[PopupApp] Initializing popup...');
    
    // Get DOM elements
    this.loadingState = document.getElementById('loadingState');
    this.normalContent = document.getElementById('normalContent');
    
    console.log('[PopupApp] DOM elements:', {
      loadingState: !!this.loadingState,
      normalContent: !!this.normalContent
    });

    // Always show normal content (user profile should always be visible)
    if (this.normalContent) {
      this.normalContent.classList.add('visible');
      console.log('[PopupApp] Normal content made visible');
    }
    
    // Hide loading state initially (we'll show it only if needed)
    if (this.loadingState) {
      this.loadingState.style.display = 'none';
      console.log('[PopupApp] Loading state hidden');
    }

    // Initialize error banner
    ErrorBannerManager.init();
    console.log('[PopupApp] Error banner initialized');

    // Load user account data
    console.log('[PopupApp] Loading user account data...');
    await UserAccountManager.loadUserAccountData();
    const userData = UserAccountManager.getUserAccountData();
    console.log('[PopupApp] User account data loaded:', userData ? 'found' : 'not found', userData);
    
    // Update user profile UI based on authentication state
    console.log('[PopupApp] Updating user profile UI...');
    await this.updateUserProfileUI();

    // Initialize sign-in button
    console.log('[PopupApp] Initializing sign-in button...');
    UserProfileUIManager.initSignInButton();

    // Check initial tab loading state (for informational purposes, but don't hide content)
    const isLoading = await this.checkTabLoading();
    console.log('[PopupApp] Tab loading state:', isLoading);
    
    // Show loading message only if tab is loading, but keep normal content visible
    if (isLoading && this.loadingState) {
      this.loadingState.style.display = 'flex';
    }

    // Poll tab status every 200ms while loading
    const checkInterval = setInterval(async () => {
      const isLoading = await this.checkTabLoading();
      
      // Update loading state visibility, but keep normal content visible
      if (this.loadingState) {
        this.loadingState.style.display = isLoading ? 'flex' : 'none';
      }
      
      // Stop polling once page is loaded
      if (!isLoading) {
        clearInterval(checkInterval);
        console.log('[PopupApp] Tab finished loading, stopped polling');
      }
    }, 200);

    // Also listen for tab updates
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' || changeInfo.status === 'loading') {
        const isLoading = changeInfo.status === 'loading';
        if (this.loadingState) {
          this.loadingState.style.display = isLoading ? 'flex' : 'none';
        }
      }
    });

    // Always initialize toggle state immediately, regardless of content visibility
    // This ensures the toggle always reflects the saved state when popup opens
    console.log('[PopupApp] Initializing toggle...');
    await this.initializeToggle();
    
    console.log('[PopupApp] Initialization complete');
  }

  /**
   * Update user profile UI based on authentication state
   */
  static async updateUserProfileUI() {
    try {
      const userAccountData = UserAccountManager.getUserAccountData();
      console.log('[PopupApp] updateUserProfileUI - userAccountData:', userAccountData);
      
      // Ensure normal content is visible
      if (this.normalContent && !this.normalContent.classList.contains('visible')) {
        this.normalContent.classList.add('visible');
        console.log('[PopupApp] Normal content made visible in updateUserProfileUI');
      }
      
      if (!userAccountData || userAccountData.isLoggedIn !== true) {
        console.log('[PopupApp] User not logged in, showing sign-in button');
        // Show sign-in button
        UserProfileUIManager.showSignIn();
      } else {
        console.log('[PopupApp] User logged in, showing user profile');
        // Show user profile
        UserProfileUIManager.showUserProfile(userAccountData);
      }
    } catch (error) {
      console.error('[PopupApp] Error in updateUserProfileUI:', error);
      // Fallback: show sign-in button on error
      UserProfileUIManager.showSignIn();
    }
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
}

// Fallback function to ensure sign-in button is visible
function ensureSignInVisible() {
  const normalContent = document.getElementById('normalContent');
  const signinContainer = document.getElementById('signinContainer');
  const userInfoContainer = document.getElementById('userInfoContainer');
  
  if (normalContent && !normalContent.classList.contains('visible')) {
    normalContent.classList.add('visible');
  }
  
  // If user info is not showing, show sign-in by default
  if (userInfoContainer && userInfoContainer.style.display !== 'flex') {
    if (signinContainer) {
      signinContainer.style.display = 'flex';
    }
  }
}

// Initialize the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[PopupApp] DOMContentLoaded event fired');
    // Immediate fallback
    ensureSignInVisible();
    
    PopupApp.init().catch(error => {
      console.error('[PopupApp] Error during initialization:', error);
      // Fallback: show sign-in button if initialization fails
      ensureSignInVisible();
    });
  });
} else {
  // DOM is already ready
  console.log('[PopupApp] DOM already ready');
  // Immediate fallback
  ensureSignInVisible();
  
  PopupApp.init().catch(error => {
    console.error('[PopupApp] Error during initialization:', error);
    // Fallback: show sign-in button if initialization fails
    ensureSignInVisible();
  });
}

// Additional safety check after a short delay
setTimeout(() => {
  const signinContainer = document.getElementById('signinContainer');
  const userInfoContainer = document.getElementById('userInfoContainer');
  const normalContent = document.getElementById('normalContent');
  
  // If normal content is visible but neither sign-in nor user info is showing, show sign-in
  if (normalContent && normalContent.classList.contains('visible')) {
    if (signinContainer && signinContainer.style.display === 'none' && 
        userInfoContainer && userInfoContainer.style.display === 'none') {
      console.log('[PopupApp] Safety check: showing sign-in button');
      signinContainer.style.display = 'flex';
    }
  }
}, 500);

// ===================================
// Authentication Module - Handles Google OAuth
// ===================================
// Configuration constants (inlined to avoid import issues)
const AUTH_CONFIG = {
  GOOGLE_CLIENT_ID: '355884005048-76olfh4sp2o2uitojjeslpsaonvc7d2s.apps.googleusercontent.com',
  BASE_URL: (() => {
    // Check for development environment
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
      return 'http://localhost:8000';
    }
    // Default to production URL
    return 'https://caten-production.up.railway.app';
  })(),
  AUTH_LOGIN_ENDPOINT: '/api/auth/login'
};

// Import AuthService dynamically when needed
let AuthService = null;

async function loadAuthService() {
  if (!AuthService) {
    try {
      // Try different import paths for Chrome extension
      const paths = [
        chrome.runtime.getURL('core/services/AuthService.js'),
        '/core/services/AuthService.js',
        '../core/services/AuthService.js',
        './core/services/AuthService.js'
      ];
      
      let lastError = null;
      for (const path of paths) {
        try {
          console.log('[Auth] Trying to load AuthService from:', path);
          const module = await import(path);
          AuthService = module.default;
          console.log('[Auth] AuthService loaded successfully');
          break;
        } catch (error) {
          console.warn('[Auth] Failed to load from', path, ':', error.message);
          lastError = error;
        }
      }
      
      if (!AuthService) {
        throw lastError || new Error('Failed to load AuthService from any path');
      }
    } catch (error) {
      console.error('[Auth] Error loading AuthService:', error);
      // Create a fallback AuthService
      AuthService = {
        login: async (idToken) => {
          const url = `${AUTH_CONFIG.BASE_URL}${AUTH_CONFIG.AUTH_LOGIN_ENDPOINT}`;
          console.log('[AuthService] Sending login request to:', url);
          
          try {
            const response = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              mode: 'cors',
              body: JSON.stringify({
                authVendor: 'GOOGLE',
                idToken: idToken
              })
            });
            
            if (!response.ok) {
              let errorMessage = `Login failed: ${response.status} ${response.statusText}`;
              try {
                const errorData = await response.json();
                if (errorData.error || errorData.message) {
                  errorMessage = errorData.error || errorData.message;
                }
              } catch (e) {
                console.warn('[AuthService] Could not parse error response:', e);
              }
              return { success: false, error: errorMessage };
            }
            
            const data = await response.json();
            return { success: true, data: data };
          } catch (error) {
            console.error('[AuthService] Error during login:', error);
            let errorMessage = error.message;
            if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
              errorMessage = 'Cannot connect to API server. Please check the backend server is running.';
            }
            return { success: false, error: errorMessage };
          }
        }
      };
    }
  }
  return AuthService;
}

// ===================================
// Error Banner Manager
// ===================================
const ErrorBannerManager = {
  /**
   * Show error banner with message
   * @param {string} message - Error message to display
   */
  showError(message) {
    const errorBanner = document.getElementById('errorBanner');
    const errorMessage = document.getElementById('errorMessage');
    
    if (errorBanner && errorMessage) {
      errorMessage.textContent = message;
      errorBanner.style.display = 'flex';
    }
  },

  /**
   * Hide error banner
   */
  hideError() {
    const errorBanner = document.getElementById('errorBanner');
    if (errorBanner) {
      errorBanner.style.display = 'none';
    }
  },

  /**
   * Initialize error banner close button
   */
  init() {
    const errorClose = document.getElementById('errorClose');
    if (errorClose) {
      errorClose.addEventListener('click', () => {
        this.hideError();
      });
    }
  }
};

// ===================================
// User Profile UI Manager
// ===================================
const UserProfileUIManager = {
  /**
   * Show sign-in UI
   */
  showSignIn() {
    console.log('[UserProfileUIManager] Showing sign-in UI');
    const signinContainer = document.getElementById('signinContainer');
    const userInfoContainer = document.getElementById('userInfoContainer');
    const normalContent = document.getElementById('normalContent');
    
    console.log('[UserProfileUIManager] Containers found:', {
      signinContainer: !!signinContainer,
      userInfoContainer: !!userInfoContainer,
      normalContent: !!normalContent
    });
    
    // Ensure normal content is visible
    if (normalContent && !normalContent.classList.contains('visible')) {
      normalContent.classList.add('visible');
      console.log('[UserProfileUIManager] Normal content made visible');
    }
    
    if (signinContainer) {
      signinContainer.style.display = 'flex';
      console.log('[UserProfileUIManager] Sign-in container displayed');
    } else {
      console.error('[UserProfileUIManager] Sign-in container not found!');
    }
    
    if (userInfoContainer) {
      userInfoContainer.style.display = 'none';
    }
  },

  /**
   * Show user profile UI
   * @param {Object} userData - User account data
   */
  showUserProfile(userData) {
    console.log('[UserProfileUIManager] Showing user profile UI', userData);
    const signinContainer = document.getElementById('signinContainer');
    const userInfoContainer = document.getElementById('userInfoContainer');
    const userPicture = document.getElementById('userPicture');
    const greetingText = document.getElementById('greetingText');
    
    console.log('[UserProfileUIManager] Elements found:', {
      signinContainer: !!signinContainer,
      userInfoContainer: !!userInfoContainer,
      userPicture: !!userPicture,
      greetingText: !!greetingText
    });
    
    if (signinContainer) signinContainer.style.display = 'none';
    if (userInfoContainer) {
      userInfoContainer.style.display = 'flex';
      console.log('[UserProfileUIManager] User info container displayed');
    } else {
      console.error('[UserProfileUIManager] User info container not found!');
    }
    
    if (userData && userData.user) {
      if (userPicture && userData.user.picture) {
        userPicture.src = userData.user.picture;
        userPicture.alt = userData.user.name || 'User profile';
        console.log('[UserProfileUIManager] User picture set:', userData.user.picture);
      }
      
      if (greetingText && userData.user.name) {
        greetingText.textContent = `Hello, ${userData.user.name}!`;
        console.log('[UserProfileUIManager] Greeting set:', userData.user.name);
      }
    }
  },

  /**
   * Initialize sign-in button click handler
   */
  initSignInButton() {
    const signinButton = document.getElementById('signinWithGoogle');
    if (signinButton) {
      console.log('[UserProfileUIManager] Sign-in button found, attaching click handler');
      signinButton.addEventListener('click', async (event) => {
        event.preventDefault();
        console.log('[UserProfileUIManager] Sign-in button clicked');
        
        try {
          // Disable button during sign-in
          signinButton.disabled = true;
          signinButton.style.opacity = '0.6';
          signinButton.style.cursor = 'not-allowed';
          
          await AuthenticationManager.initiateGoogleSignIn();
        } catch (error) {
          console.error('[UserProfileUIManager] Error in sign-in button handler:', error);
          // Error is already shown by AuthenticationManager
        } finally {
          // Re-enable button
          signinButton.disabled = false;
          signinButton.style.opacity = '1';
          signinButton.style.cursor = 'pointer';
        }
      });
      console.log('[UserProfileUIManager] Sign-in button click handler attached');
    } else {
      console.error('[UserProfileUIManager] Sign-in button not found!');
    }
  }
};

// ===================================
// Authentication Manager
// ===================================
const AuthenticationManager = {
  /**
   * Initialize Google OAuth and handle sign-in flow
   */
  async initiateGoogleSignIn() {
    try {
      console.log('[Auth] Starting Google sign-in flow...');
      
      // Use inlined config instead of dynamic import
      const clientId = AUTH_CONFIG.GOOGLE_CLIENT_ID;
      
      if (!clientId) {
        throw new Error('Google Client ID not configured');
      }
      
      console.log('[Auth] Using Google Client ID:', clientId);
      
      // We don't need Google Identity Services library for tab-based OAuth flow
      // We'll construct the OAuth URL directly and open it in a new tab
      console.log('[Auth] Starting OAuth tab flow...');
      await this.handleGoogleSignInPopup(clientId);
    } catch (error) {
      console.error('[Auth] Error initiating Google sign-in:', error);
      const errorMessage = error.message || 'Failed to initiate sign-in';
      console.error('[Auth] Full error details:', {
        message: errorMessage,
        stack: error.stack,
        name: error.name
      });
      ErrorBannerManager.showError(errorMessage);
      throw error;
    }
  },

  /**
   * Handle Google sign-in using new tab with OAuth flow
   * @param {string} clientId - Google OAuth client ID
   */
  async handleGoogleSignInPopup(clientId) {
    return new Promise((resolve, reject) => {
      // Generate state and nonce for security
      const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // Store state in chrome.storage for verification
      chrome.storage.local.set({ 'oauth_state': state, 'oauth_nonce': nonce });
      
      // Create OAuth URL
      // Note: The redirect_uri must be registered in Google Cloud Console for your OAuth client
      // Update this to match your registered redirect URI
      // The code will monitor the tab for id_token in the URL, so any registered URI will work
      const redirectUri = encodeURIComponent('http://localhost:8080/oauth-callback');
      const scope = 'openid email profile';
      const responseType = 'id_token';
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(clientId)}&` +
        `redirect_uri=${redirectUri}&` +
        `response_type=${responseType}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `state=${state}&` +
        `nonce=${nonce}`;

      console.log('[Auth] Opening OAuth tab with URL:', authUrl);
      
      // Open OAuth flow in a new tab
      chrome.tabs.create({ url: authUrl }, (tab) => {
        if (chrome.runtime.lastError) {
          const error = chrome.runtime.lastError.message;
          console.error('[Auth] Error opening OAuth tab:', error);
          console.error('[Auth] Chrome runtime error:', chrome.runtime.lastError);
          chrome.storage.local.remove(['oauth_state', 'oauth_nonce']);
          reject(new Error(`Failed to open OAuth tab: ${error}. Make sure the extension has 'tabs' permission.`));
          return;
        }
        
        if (!tab || !tab.id) {
          console.error('[Auth] Tab creation failed - no tab returned');
          chrome.storage.local.remove(['oauth_state', 'oauth_nonce']);
          reject(new Error('Failed to create OAuth tab'));
          return;
        }
        
        console.log('[Auth] OAuth tab created successfully, tab ID:', tab.id);

        const tabId = tab.id;
        let tabClosed = false;
        let resolved = false;

        // Listen for tab updates to detect OAuth callback
        const tabUpdateListener = async (updatedTabId, changeInfo, updatedTab) => {
          if (updatedTabId !== tabId || !updatedTab.url || resolved) return;
          
          try {
            const url = new URL(updatedTab.url);
            
            // Check if URL contains id_token (OAuth callback)
            let idToken = null;
            let returnedState = null;
            
            // Check hash fragment (common in OAuth implicit flow)
            if (url.hash) {
              const hashParams = new URLSearchParams(url.hash.substring(1));
              idToken = hashParams.get('id_token');
              returnedState = hashParams.get('state');
            }
            
            // Check query params as fallback
            if (!idToken) {
              idToken = url.searchParams.get('id_token');
              returnedState = url.searchParams.get('state');
            }
            
            // Check for errors
            if (!idToken) {
              const error = url.searchParams.get('error') || (url.hash ? new URLSearchParams(url.hash.substring(1)).get('error') : null);
              if (error) {
                const errorDesc = url.searchParams.get('error_description') || (url.hash ? new URLSearchParams(url.hash.substring(1)).get('error_description') : null);
                throw new Error(`OAuth error: ${error}${errorDesc ? ' - ' + errorDesc : ''}`);
              }
              // Not a callback URL yet, continue waiting
              return;
            }
            
            // Verify state
            const stored = await chrome.storage.local.get(['oauth_state']);
            if (stored.oauth_state && stored.oauth_state !== returnedState) {
              throw new Error('OAuth state mismatch - possible security issue');
            }

            resolved = true;
            
            // Clean up
            chrome.tabs.onUpdated.removeListener(tabUpdateListener);
            chrome.tabs.onRemoved.removeListener(tabRemovedListener);
            chrome.storage.local.remove(['oauth_state', 'oauth_nonce']);
            
            // Close the OAuth tab
            chrome.tabs.remove(tabId);
            
            // Call backend API with id_token
            await this.completeSignIn(idToken);
            resolve();
          } catch (error) {
            if (resolved) return;
            resolved = true;
            
            console.error('[Auth] Error processing OAuth response:', error);
            
            // Clean up
            chrome.tabs.onUpdated.removeListener(tabUpdateListener);
            chrome.tabs.onRemoved.removeListener(tabRemovedListener);
            chrome.storage.local.remove(['oauth_state', 'oauth_nonce']);
            
            // Close the OAuth tab
            chrome.tabs.remove(tabId);
            
            reject(error);
          }
        };

        // Listen for tab removal (user closed it)
        const tabRemovedListener = (removedTabId) => {
          if (removedTabId === tabId && !tabClosed && !resolved) {
            tabClosed = true;
            resolved = true;
            chrome.tabs.onUpdated.removeListener(tabUpdateListener);
            chrome.tabs.onRemoved.removeListener(tabRemovedListener);
            chrome.storage.local.remove(['oauth_state', 'oauth_nonce']);
            reject(new Error('Sign-in was cancelled'));
          }
        };

        chrome.tabs.onUpdated.addListener(tabUpdateListener);
        chrome.tabs.onRemoved.addListener(tabRemovedListener);
      });
    });
  },

  /**
   * Complete sign-in by calling backend API
   * @param {string} idToken - Google OAuth id token
   */
  async completeSignIn(idToken) {
    try {
      const AuthServiceModule = await loadAuthService();
      if (!AuthServiceModule) {
        throw new Error('Failed to load AuthService');
      }

      const result = await AuthServiceModule.login(idToken);
      
      if (result.success && result.data) {
        // Store the full API response
        await UserAccountManager.saveUserAccountData(result.data);
        
        // Update UI to show user profile
        UserProfileUIManager.showUserProfile(result.data);
        
        // Hide any error banners
        ErrorBannerManager.hideError();
        
        console.log('[Auth] Sign-in successful');
      } else {
        throw new Error(result.error || 'Login failed');
      }
    } catch (error) {
      console.error('[Auth] Error completing sign-in:', error);
      ErrorBannerManager.showError(error.message || 'Sign-in failed');
      throw error;
    }
  }
};

// ===================================
// Settings Button Handler
// ===================================
// Settings button has been moved to the close button in content script
// No longer needed in popup

