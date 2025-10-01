// ===================================
// Storage Module - Handles Chrome Storage API
// ===================================
const StorageManager = {
  STORAGE_KEY: 'isExtensionEnabledForDomain',

  /**
   * Save toggle state to Chrome local storage
   * @param {boolean} isEnabled - The toggle state to save
   */
  async saveToggleState(isEnabled) {
    try {
      await chrome.storage.local.set({ [this.STORAGE_KEY]: isEnabled });
      console.log('Toggle state saved:', isEnabled);
    } catch (error) {
      console.error('Error saving toggle state:', error);
    }
  },

  /**
   * Load toggle state from Chrome local storage
   * @returns {Promise<boolean>} The saved toggle state (defaults to true - enabled by default)
   */
  async loadToggleState() {
    try {
      const result = await chrome.storage.local.get([this.STORAGE_KEY]);
      const state = result[this.STORAGE_KEY] ?? true; // Default to true (enabled) if not set
      console.log('Toggle state loaded:', state);
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
  catIcon: document.querySelector('.cat-icon'),
  title: document.querySelector('.title'),
  instructions: document.querySelector('.instructions'),
  fingerPoint: document.querySelector('.finger-point'),

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
  /**
   * Initialize the popup application
   */
  static async init() {
    // Load saved state from storage
    const savedState = await StorageManager.loadToggleState();
    
    // Update UI and toggle switch with saved state
    UIManager.setToggleState(savedState);
    UIManager.updateUI(savedState);

    // Listen for toggle changes
    UIManager.toggleSwitch.addEventListener('change', this.handleToggleChange.bind(this));
  }

  /**
   * Handle toggle switch change event
   * @param {Event} event - The change event
   */
  static async handleToggleChange(event) {
    const isEnabled = event.target.checked;
    
    // Update UI
    UIManager.updateUI(isEnabled);
    
    // Save state to storage
    await StorageManager.saveToggleState(isEnabled);
  }
}

// Initialize the app when DOM is ready
PopupApp.init();

