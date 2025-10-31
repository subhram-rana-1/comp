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
// Storage Module - Handles Chrome Storage API (Per-Domain)
// ===================================
const StorageManager = {
  STORAGE_PREFIX: 'isExtensionEnabledFor_',

  /**
   * Get storage key for a specific domain
   * @param {string} domain - The domain name
   * @returns {string} Storage key for the domain
   */
  getStorageKey(domain) {
    return `${this.STORAGE_PREFIX}${domain}`;
  },

  /**
   * Save toggle state to Chrome local storage for a specific domain
   * @param {string} domain - The domain name
   * @param {boolean} isEnabled - The toggle state to save
   */
  async saveToggleState(domain, isEnabled) {
    try {
      const key = this.getStorageKey(domain);
      if (isEnabled) {
        // Save the enabled state
        await chrome.storage.local.set({ [key]: isEnabled });
        console.log(`Toggle state saved for ${domain}:`, isEnabled);
      } else {
        // Remove the key from storage when disabled
        await chrome.storage.local.remove([key]);
        console.log(`Toggle state removed for ${domain} (disabled)`);
      }
    } catch (error) {
      console.error('Error saving toggle state:', error);
    }
  },

  /**
   * Load toggle state from Chrome local storage for a specific domain
   * @param {string} domain - The domain name
   * @returns {Promise<boolean>} The saved toggle state (defaults to true - enabled by default)
   */
  async loadToggleState(domain) {
    try {
      const key = this.getStorageKey(domain);
      const result = await chrome.storage.local.get([key]);
      const state = result[key] ?? true; // Default to true (enabled) if not set
      console.log(`Toggle state loaded for ${domain}:`, state);
      return state;
    } catch (error) {
      console.error('Error loading toggle state:', error);
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

    // Get current domain
    this.currentDomain = await DomainManager.getCurrentDomain();
    console.log('Current domain:', this.currentDomain);
    
    // Load saved state from storage for this domain (only if content is visible)
    if (this.normalContent && this.normalContent.classList.contains('visible')) {
      const savedState = await StorageManager.loadToggleState(this.currentDomain);
      
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
          const savedState = await StorageManager.loadToggleState(this.currentDomain);
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
    
    console.log('[Popup] Toggle changed:', isEnabled, 'for domain:', this.currentDomain);
    
    // Update UI
    UIManager.updateUI(isEnabled);
    
    // Save state to storage for this domain
    await StorageManager.saveToggleState(this.currentDomain, isEnabled);
    console.log('[Popup] State saved to storage');
    
    // Notify content script of the change
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      console.log('[Popup] Active tab:', tab);
      
      if (tab?.id) {
        console.log('[Popup] Sending message to tab:', tab.id);
        const response = await chrome.tabs.sendMessage(tab.id, {
          type: 'TOGGLE_EXTENSION',
          domain: this.currentDomain,
          isEnabled: isEnabled
        });
        console.log('[Popup] Message sent, response:', response);
      } else {
        console.error('[Popup] No active tab found');
      }
    } catch (error) {
      console.error('[Popup] Error sending message to content script:', error);
      // Storage change listener should still work even if message fails
    }
  }
}

// Initialize the app when DOM is ready
PopupApp.init();

