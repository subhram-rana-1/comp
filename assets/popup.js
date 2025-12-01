// ===================================
// Payment Module - Handles payment status and UI
// ===================================
import PaymentService from '../core/services/PaymentService.js';
import ExtPayConfig from '../core/config/extpayConfig.js';

const PaymentManager = {
  /**
   * Update payment status UI
   * @param {Object} user - User object from ExtPay
   */
  async updatePaymentStatusUI(user) {
    const statusContainer = document.getElementById('paymentStatusContainer');
    const statusBadge = document.getElementById('paymentStatusBadge');
    const statusButton = document.getElementById('paymentStatusButton');
    
    if (!statusContainer || !statusBadge || !statusButton) {
      return;
    }

    const isPaid = PaymentService.isSubscriptionActive(user);
    const statusText = PaymentService.getSubscriptionStatusText(user);

    // Update badge
    statusBadge.textContent = statusText;
    statusBadge.className = 'payment-status-badge';
    
    if (isPaid) {
      statusBadge.classList.add('active');
      statusButton.textContent = ExtPayConfig.UI_SETTINGS.messages.manageSubscription;
      statusButton.onclick = async () => {
        try {
          await PaymentService.openSubscriptionManagement();
        } catch (error) {
          console.error('[Popup] Error opening subscription management:', error);
        }
      };
    } else {
      statusBadge.classList.add('expired');
      statusButton.textContent = ExtPayConfig.UI_SETTINGS.messages.upgradeButton;
      statusButton.onclick = async () => {
        try {
          await PaymentService.openPaymentPage();
        } catch (error) {
          console.error('[Popup] Error opening payment page:', error);
        }
      };
    }

    statusButton.style.display = 'block';
    statusContainer.style.display = 'flex';
  },

  /**
   * Show payment modal
   */
  showPaymentModal() {
    const overlay = document.getElementById('paymentModalOverlay');
    const modal = document.getElementById('paymentModal');
    const closeButton = document.getElementById('paymentModalClose');
    const upgradeButton = document.getElementById('paymentUpgradeButton');
    const manageButton = document.getElementById('paymentManageButton');

    if (!overlay || !modal) return;

    overlay.style.display = 'flex';

    closeButton?.addEventListener('click', () => {
      overlay.style.display = 'none';
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.style.display = 'none';
      }
    });

    upgradeButton?.addEventListener('click', async () => {
      try {
        await PaymentService.openPaymentPage();
        overlay.style.display = 'none';
      } catch (error) {
        console.error('[Popup] Error opening payment page:', error);
      }
    });
  },

  /**
   * Check payment status and update UI
   */
  async checkAndUpdatePaymentStatus() {
    try {
      const user = await PaymentService.getUser();
      await this.updatePaymentStatusUI(user);
      return PaymentService.isSubscriptionActive(user);
    } catch (error) {
      console.error('[Popup] Error checking payment status:', error);
      return false;
    }
  }
};

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

    // Always initialize toggle state immediately, regardless of content visibility
    // This ensures the toggle always reflects the saved state when popup opens
    await this.initializeToggle();
    
    // Check and update payment status
    await PaymentManager.checkAndUpdatePaymentStatus();
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
    
    // If trying to enable, check payment status first
    if (isEnabled) {
      const isPaid = await PaymentManager.checkAndUpdatePaymentStatus();
      if (!isPaid) {
        // Reset toggle to off and show payment modal
        UIManager.setToggleState(false);
        PaymentManager.showPaymentModal();
        console.log('[Popup] Payment required - toggle reset to off');
        return;
      }
    }
    
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

// Initialize the app when DOM is ready
PopupApp.init();

// ===================================
// Settings Button Handler
// ===================================
// Settings button has been moved to the close button in content script
// No longer needed in popup

