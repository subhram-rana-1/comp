/**
 * Payment Service
 * Handles ExtPay integration for subscription payments
 */

import ExtPayConfig from '../config/extpayConfig.js';

// ExtPay is now initialized in background.js and passed via setExtPayInstance()
// No need to import it here

class PaymentService {
  static extpay = null;
  static statusCache = null;
  static cacheTimestamp = null;

  /**
   * Set ExtPay instance (called from background.js)
   * @param {Object} extpayInstance - The ExtPay instance from background.js
   */
  static setExtPayInstance(extpayInstance) {
    this.extpay = extpayInstance;
    console.log('[PaymentService] ExtPay instance set from background.js');
  }

  /**
   * Get ExtPay instance
   * @returns {Object} ExtPay instance
   */
  static getExtPayInstance() {
    if (!this.extpay) {
      console.warn('[PaymentService] ExtPay instance not set. Make sure background.js initializes ExtPay.');
      return this.createMockExtPay();
    }
    return this.extpay;
  }

  /**
   * Create a mock ExtPay object for development/testing
   * @returns {Object} Mock ExtPay object
   */
  static createMockExtPay() {
    return {
      getUser: async () => ({
        paid: false,
        installedAt: new Date(),
        paidAt: null
      }),
      openPaymentPage: async () => {
        console.log('[PaymentService] Mock: Opening payment page');
      },
      onPaid: {
        addListener: (callback) => {
          console.log('[PaymentService] Mock: onPaid listener added');
        }
      }
    };
  }

  /**
   * Set up ExtPay event listeners (called from background.js)
   * Note: onPaid listeners are now set up in background.js
   */
  static setupListeners() {
    // Listeners are set up in background.js
    console.log('[PaymentService] Note: onPaid listeners are set up in background.js');
  }

  /**
   * Notify all parts of the extension about payment status change
   * @param {Object} user - User object from ExtPay
   */
  static notifyPaymentStatusChange(user) {
    // Send message to all tabs
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          try {
            chrome.tabs.sendMessage(tab.id, {
              type: 'PAYMENT_STATUS_CHANGED',
              user: user
            }).catch(() => {
              // Ignore errors for tabs without content script
            });
          } catch (error) {
            // Ignore errors
          }
        });
      });
    }

    // Send message to popup if open
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        type: 'PAYMENT_STATUS_CHANGED',
        user: user
      }).catch(() => {
        // Ignore errors if popup is not open
      });
    }
  }

  /**
   * Get user payment status
   * @returns {Promise<Object>} User object with payment status
   */
  static async getUser() {
    try {
      const extpay = this.getExtPayInstance();
      const user = await extpay.getUser();
      return user;
    } catch (error) {
      console.error('[PaymentService] Error getting user:', error);
      return {
        paid: false,
        installedAt: new Date(),
        paidAt: null
      };
    }
  }

  /**
   * Check if user has active subscription
   * @returns {Promise<boolean>} True if user has active subscription
   */
  static async checkPaymentStatus() {
    try {
      // Check cache first
      const now = Date.now();
      if (this.statusCache !== null && this.cacheTimestamp !== null) {
        const cacheAge = now - this.cacheTimestamp;
        if (cacheAge < ExtPayConfig.SUBSCRIPTION_SETTINGS.statusCacheDuration) {
          return this.statusCache;
        }
      }

      const user = await this.getUser();
      const isPaid = this.isSubscriptionActive(user);

      // Update cache
      this.statusCache = isPaid;
      this.cacheTimestamp = now;

      return isPaid;
    } catch (error) {
      console.error('[PaymentService] Error checking payment status:', error);
      return false;
    }
  }

  /**
   * Check if subscription is active based on user object
   * @param {Object} user - User object from ExtPay
   * @returns {boolean} True if subscription is active
   */
  static isSubscriptionActive(user) {
    if (!user) {
      return false;
    }

    // Check if user has paid
    if (!user.paid) {
      return false;
    }

    // For subscriptions, check if subscription is active
    if (user.subscriptionActive !== undefined) {
      return user.subscriptionActive === true;
    }

    // For one-time payments, check if paidAt exists
    if (user.paidAt) {
      return true;
    }

    // Default: if paid is true, consider it active
    return user.paid === true;
  }

  /**
   * Open payment page
   * @param {string|null} planNickname - Optional plan nickname to open specific plan
   * @returns {Promise<void>}
   */
  static async openPaymentPage(planNickname = null) {
    try {
      const extpay = this.getExtPayInstance();
      const nickname = planNickname || ExtPayConfig.PAYMENT_SETTINGS.defaultPlanNickname;
      
      if (nickname) {
        await extpay.openPaymentPage(nickname);
      } else {
        await extpay.openPaymentPage();
      }
      
      console.log('[PaymentService] Payment page opened');
    } catch (error) {
      console.error('[PaymentService] Error opening payment page:', error);
      throw error;
    }
  }

  /**
   * Open subscription management page
   * @returns {Promise<void>}
   */
  static async openSubscriptionManagement() {
    try {
      const extpay = this.getExtPayInstance();
      await extpay.openPaymentPage();
      console.log('[PaymentService] Subscription management page opened');
    } catch (error) {
      console.error('[PaymentService] Error opening subscription management:', error);
      throw error;
    }
  }

  /**
   * Get available payment plans
   * @returns {Promise<Array>} Array of payment plans
   */
  static async getPlans() {
    try {
      const extpay = this.getExtPayInstance();
      if (extpay.getPlans) {
        const plans = await extpay.getPlans();
        return plans;
      }
      return [];
    } catch (error) {
      console.error('[PaymentService] Error getting plans:', error);
      return [];
    }
  }

  /**
   * Clear payment status cache
   */
  static clearCache() {
    this.statusCache = null;
    this.cacheTimestamp = null;
    console.log('[PaymentService] Payment status cache cleared');
  }

  /**
   * Get subscription status text
   * @param {Object} user - User object from ExtPay
   * @returns {string} Status text
   */
  static getSubscriptionStatusText(user) {
    if (!user) {
      return ExtPayConfig.UI_SETTINGS.messages.subscriptionExpired;
    }

    if (this.isSubscriptionActive(user)) {
      return ExtPayConfig.UI_SETTINGS.messages.subscriptionActive;
    }

    if (user.subscriptionCancelAt) {
      return ExtPayConfig.UI_SETTINGS.messages.subscriptionCanceled;
    }

    return ExtPayConfig.UI_SETTINGS.messages.subscriptionExpired;
  }
}

// ExtPay will be initialized in background.js and set via setExtPayInstance()
// No initialization needed here

export default PaymentService;

