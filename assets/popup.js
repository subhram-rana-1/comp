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
// UI Module - Handles UI Updates
// ===================================
const UIManager = {
  // DOM elements
  toggleSwitch: document.getElementById('extensionToggle'),
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
      this.catIcon.classList.add('active');
      document.body.classList.add('extension-on');
      this.instructions.classList.add('show');
      this.fingerPoint.style.display = 'none';
      console.log('Extension Enabled');
    } else {
      // OFF state
      this.catIcon.classList.remove('active');
      document.body.classList.remove('extension-on');
      this.instructions.classList.remove('show');
      this.fingerPoint.style.display = 'block';
      console.log('Extension Disabled');
    }
  },

  /**
   * Set toggle switch state without triggering change event
   * @param {boolean} isEnabled - The state to set
   */
  setToggleState(isEnabled) {
    this.toggleSwitch.checked = isEnabled;
  }
};

// ===================================
// App Initialization and Event Handlers
// ===================================
class PopupApp {
  static currentDomain = null;
  static loadingState = null;
  static normalContent = null;

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
    // Get DOM elements
    this.loadingState = document.getElementById('loadingState');
    this.normalContent = document.getElementById('normalContent');

    // Check initial tab loading state
    await this.updateContentVisibility();

    // Poll tab status every 200ms while loading
    const checkInterval = setInterval(async () => {
      const isLoading = await this.checkTabLoading();
      await this.updateContentVisibility();
      
      // Stop polling once page is loaded
      if (!isLoading) {
        clearInterval(checkInterval);
      }
    }, 200);

    // Also listen for tab updates
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' || changeInfo.status === 'loading') {
        this.updateContentVisibility();
      }
    });

    // Load global saved state from storage (only if content is visible)
    if (this.normalContent && this.normalContent.classList.contains('visible')) {
      const savedState = await StorageManager.loadToggleState();
      
      // Update UI and toggle switch with saved state
      UIManager.setToggleState(savedState);
      UIManager.updateUI(savedState);

      // Listen for toggle changes
      UIManager.toggleSwitch.addEventListener('change', this.handleToggleChange.bind(this));
    } else {
      // If still loading, wait for content to be visible before initializing toggle
      const initInterval = setInterval(async () => {
        if (this.normalContent && this.normalContent.classList.contains('visible')) {
          clearInterval(initInterval);
          const savedState = await StorageManager.loadToggleState();
          UIManager.setToggleState(savedState);
          UIManager.updateUI(savedState);
          UIManager.toggleSwitch.addEventListener('change', this.handleToggleChange.bind(this));
        }
      }, 200);
    }
  }

  /**
   * Handle toggle switch change event
   * @param {Event} event - The change event
   */
  static async handleToggleChange(event) {
    const isEnabled = event.target.checked;
    
    console.log('[Popup] Global toggle changed:', isEnabled);
    
    // Update UI
    UIManager.updateUI(isEnabled);
    
    // Save global state to storage
    await StorageManager.saveToggleState(isEnabled);
    console.log('[Popup] Global state saved to storage');
    
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
  }
}

// Initialize the app when DOM is ready
PopupApp.init();

