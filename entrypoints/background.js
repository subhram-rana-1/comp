// ===================================
// Background Script - Handles Tab Events and Extension State Management
// ===================================

/**
 * Background script to handle tab loading, refresh, and switch events
 * Sends signals to content scripts to check and manage extension state
 */

import PaymentService from '../core/services/PaymentService.js';
import ExtPayConfig from '../core/config/extpayConfig.js';
import ExtPay from 'extpay';

export default defineBackground(async () => {
  // ===================================
  // ExtPay Initialization
  // ===================================
  
  // Initialize ExtPay with extension ID from environment variable
  let extpay = null;
  try {
    const extensionId = ExtPayConfig.EXTENSION_ID;
    extpay = ExtPay(extensionId);
    console.log('[Background] ExtPay initialized with extension ID:', extensionId);
  } catch (error) {
    console.error('[Background] Error initializing ExtPay:', error);
  }
  
  // Initialize PaymentService with extpay instance
  if (extpay) {
    PaymentService.setExtPayInstance(extpay);
    
    // Set up onPaid listener
    if (extpay.onPaid) {
      extpay.onPaid.addListener((user) => {
        console.log('[Background] User paid!', user);
        // Clear payment cache
        PaymentService.clearCache();
        // Notify all tabs about payment status change
        handlePaymentStatusChanged(user);
      });
      console.log('[Background] onPaid listener set up');
    }
  }

// ===================================
// Tab Event Handlers
// ===================================

/**
 * Handle tab updates (loading, refresh, navigation)
 * @param {number} tabId - The ID of the tab that was updated
 * @param {Object} changeInfo - Information about what changed
 * @param {Object} tab - The updated tab object
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only process when page is completely loaded
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('[Background] Tab updated:', tabId, tab.url);
    
    try {
      // Extract domain from URL
      const domain = new URL(tab.url).hostname;
      console.log('[Background] Domain:', domain);
      
      // Send message to content script to check extension state
      await sendTabStateMessage(tabId, domain, 'TAB_LOADED');
    } catch (error) {
      console.error('[Background] Error handling tab update:', error);
    }
  }
});

/**
 * Handle tab activation (switching between tabs)
 * @param {Object} activeInfo - Information about the activated tab
 */
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tabId = activeInfo.tabId;
  console.log('[Background] Tab activated:', tabId);
  
  try {
    // Get the active tab details
    const tab = await chrome.tabs.get(tabId);
    
    if (tab.url) {
      const domain = new URL(tab.url).hostname;
      console.log('[Background] Activated domain:', domain);
      
      // Send message to content script to check extension state
      await sendTabStateMessage(tabId, domain, 'TAB_SWITCHED');
    }
  } catch (error) {
    console.error('[Background] Error handling tab activation:', error);
  }
});

/**
 * Handle tab creation (new tab opened)
 * @param {Object} tab - The newly created tab
 */
chrome.tabs.onCreated.addListener(async (tab) => {
  console.log('[Background] Tab created:', tab.id, tab.url);
  
  // Only process if tab has a URL (not chrome:// or about:)
  if (tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
    try {
      const domain = new URL(tab.url).hostname;
      console.log('[Background] New tab domain:', domain);
      
      // Send message to content script to check extension state
      await sendTabStateMessage(tab.id, domain, 'TAB_CREATED');
    } catch (error) {
      console.error('[Background] Error handling tab creation:', error);
    }
  }
});

// ===================================
// Message Handlers
// ===================================

/**
 * Handle messages from content scripts and popup
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Background] Message received:', message, 'from tab:', sender.tab?.id);
  
  switch (message.type) {
    case 'CHECK_EXTENSION_STATE':
      handleExtensionStateCheck(message.domain, sender.tab?.id, sendResponse);
      return true; // Keep message channel open for async response
      
    case 'EXTENSION_DISABLED':
      handleExtensionDisabled(message.domain, sendResponse);
      return true;
      
    case 'CHECK_PAYMENT_STATUS':
      handlePaymentStatusCheck(sendResponse);
      return true; // Keep message channel open for async response
      
    case 'PAYMENT_STATUS_CHANGED':
      handlePaymentStatusChanged(message.user);
      sendResponse({ success: true });
      return false;
      
    default:
      console.log('[Background] Unknown message type:', message.type);
      sendResponse({ success: false, error: 'Unknown message type' });
  }
});

// ===================================
// Helper Functions
// ===================================

/**
 * Send message to content script about tab state
 * @param {number} tabId - The tab ID
 * @param {string} domain - The domain name
 * @param {string} eventType - Type of event (TAB_LOADED, TAB_SWITCHED, TAB_CREATED)
 */
async function sendTabStateMessage(tabId, domain, eventType) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, {
      type: 'TAB_STATE_CHANGE',
      domain: domain,
      eventType: eventType
    });
    
    console.log(`[Background] Tab state message sent to tab ${tabId}:`, response);
  } catch (error) {
    // Content script might not be ready yet, this is normal
    console.log(`[Background] Could not send message to tab ${tabId}:`, error.message);
  }
}

/**
 * Handle extension state check request
 * @param {string} domain - The domain to check
 * @param {number} tabId - The tab ID
 * @param {Function} sendResponse - Response callback
 */
async function handleExtensionStateCheck(domain, tabId, sendResponse) {
  try {
    const storageKey = `isExtensionEnabledFor_${domain}`;
    const result = await chrome.storage.local.get([storageKey]);
    const isEnabled = result[storageKey] ?? false; // Default to false for new domains
    
    console.log(`[Background] Extension state for ${domain}:`, isEnabled);
    
    sendResponse({
      success: true,
      isEnabled: isEnabled,
      domain: domain
    });
  } catch (error) {
    console.error('[Background] Error checking extension state:', error);
    sendResponse({
      success: false,
      error: error.message,
      isEnabled: false
    });
  }
}

/**
 * Handle extension disabled event
 * @param {string} domain - The domain where extension was disabled
 * @param {Function} sendResponse - Response callback
 */
async function handleExtensionDisabled(domain, sendResponse) {
  try {
    const storageKey = `isExtensionEnabledFor_${domain}`;
    await chrome.storage.local.remove([storageKey]);
    
    console.log(`[Background] Extension disabled for ${domain}, storage cleared`);
    
    sendResponse({
      success: true,
      message: `Extension disabled for ${domain}`
    });
  } catch (error) {
    console.error('[Background] Error handling extension disabled:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Handle payment status check request
 * @param {Function} sendResponse - Response callback
 */
async function handlePaymentStatusCheck(sendResponse) {
  try {
    const isPaid = await PaymentService.checkPaymentStatus();
    const user = await PaymentService.getUser();
    
    console.log('[Background] Payment status checked:', isPaid);
    
    sendResponse({
      success: true,
      isPaid: isPaid,
      user: user
    });
  } catch (error) {
    console.error('[Background] Error checking payment status:', error);
    sendResponse({
      success: false,
      error: error.message,
      isPaid: false
    });
  }
}

/**
 * Handle payment status changed event
 * @param {Object} user - User object from ExtPay
 */
async function handlePaymentStatusChanged(user) {
  try {
    console.log('[Background] Payment status changed:', user);
    
    // Clear payment cache
    PaymentService.clearCache();
    
    // Notify all tabs about payment status change
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab?.id) {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            type: 'PAYMENT_STATUS_CHANGED',
            user: user
          });
        } catch (error) {
          // Tab might not have content script loaded, ignore
          console.log(`[Background] Could not send payment status to tab ${tab.id}:`, error.message);
        }
      }
    }
  } catch (error) {
    console.error('[Background] Error handling payment status change:', error);
  }
}

// ===================================
// Extension Lifecycle Events
// ===================================

/**
 * Handle extension installation/update
 */
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Background] Extension installed/updated:', details.reason);
  
  // Set default settings if needed
  if (details.reason === 'install') {
    console.log('[Background] First time installation');
    // Could set default settings here if needed
  }
});

console.log('[Background] Background script loaded and ready');

}); // End of defineBackground
