/**
 * ExtPay Configuration
 * Centralized configuration for ExtPay payment integration
 */

class ExtPayConfig {
  /**
   * ExtPay Extension ID
   * Reads from EXTPAY_EXTENSION_ID environment variable
   * Set this environment variable to your ExtPay extension ID from extensionpay.com
   * Example: export EXTPAY_EXTENSION_ID=xplaino
   */
  static get EXTENSION_ID() {
    // Try to read from environment variable
    // WXT uses import.meta.env for environment variables
    let envId = null;
    
    try {
      // Check import.meta.env (Vite/WXT)
      // Access import.meta directly (it's available in ES modules)
      if (typeof import.meta !== 'undefined' && import.meta.env) {
        const env = import.meta.env;
        if (env && env.EXTPAY_EXTENSION_ID) {
          envId = env.EXTPAY_EXTENSION_ID;
        }
      }
    } catch (e) {
      // Ignore errors
    }
    
    // Fallback to process.env if import.meta.env not available
    if (!envId) {
      try {
        if (typeof process !== 'undefined' && process && process.env) {
          const env = process.env;
          if (env && env.EXTPAY_EXTENSION_ID) {
            envId = env.EXTPAY_EXTENSION_ID;
          }
        }
      } catch (e) {
        // Ignore errors
      }
    }
    
    if (envId) {
      return envId;
    }
    
    // Fallback to default if env var not set
    console.warn('[ExtPayConfig] EXTPAY_EXTENSION_ID environment variable not set. Using default.');
    return 'xplaino'; // Default fallback
  }

  /**
   * Payment page settings
   */
  static PAYMENT_SETTINGS = {
    // Whether to open payment page in a new tab
    openInNewTab: true,
    // Default plan nickname to open (null = show all plans)
    defaultPlanNickname: null
  };

  /**
   * Subscription management settings
   */
  static SUBSCRIPTION_SETTINGS = {
    // Cache payment status for this many milliseconds
    statusCacheDuration: 60000, // 1 minute
    // How often to check payment status (milliseconds)
    statusCheckInterval: 300000 // 5 minutes
  };

  /**
   * UI Settings
   */
  static UI_SETTINGS = {
    // Payment prompt messages
    messages: {
      upgradePrompt: 'Upgrade to unlock all features',
      subscriptionRequired: 'A subscription is required to use this extension',
      manageSubscription: 'Manage Subscription',
      upgradeButton: 'Upgrade Now',
      checkingStatus: 'Checking subscription status...',
      subscriptionActive: 'Subscription Active',
      subscriptionExpired: 'Subscription Expired',
      subscriptionCanceled: 'Subscription Canceled'
    }
  };
}

export default ExtPayConfig;

