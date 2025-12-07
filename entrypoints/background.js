// ===================================
// Background Script - Handles Tab Events and Extension State Management
// ===================================

/**
 * Background script to handle tab loading, refresh, and switch events
 * Sends signals to content scripts to check and manage extension state
 */

export default defineBackground(() => {

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
      
    case 'OAUTH_GET_REDIRECT_URI':
      handleOAuthGetRedirectUri(sendResponse);
      return true; // Keep message channel open for async response
      
    case 'OAUTH_LAUNCH_FLOW':
      handleOAuthLaunchFlow(message.authUrl, sendResponse);
      return true; // Keep message channel open for async response
      
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
 * Handle OAuth get redirect URI request
 * @param {Function} sendResponse - Response callback
 */
function handleOAuthGetRedirectUri(sendResponse) {
  try {
    if (!chrome.identity || !chrome.identity.getRedirectURL) {
      throw new Error('chrome.identity API is not available');
    }
    
    const redirectUri = chrome.identity.getRedirectURL();
    console.log('[Background] OAuth redirect URI:', redirectUri);
    
    sendResponse({
      success: true,
      redirectUri: redirectUri
    });
  } catch (error) {
    console.error('[Background] Error getting OAuth redirect URI:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Handle OAuth launch flow request
 * @param {string} authUrl - The OAuth authorization URL
 * @param {Function} sendResponse - Response callback
 */
function handleOAuthLaunchFlow(authUrl, sendResponse) {
  try {
    if (!chrome.identity || !chrome.identity.launchWebAuthFlow) {
      throw new Error('chrome.identity API is not available');
    }
    
    console.log('[Background] Launching OAuth flow with URL:', authUrl);
    
    chrome.identity.launchWebAuthFlow({
      url: authUrl,
      interactive: true
    }, (callbackUrl) => {
      if (chrome.runtime.lastError) {
        const error = chrome.runtime.lastError.message;
        console.error('[Background] Error in OAuth flow:', error);
        
        // Handle user cancellation
        if (error.includes('OAuth2') || error.includes('canceled') || error.includes('cancelled')) {
          sendResponse({
            success: false,
            error: 'Sign-in was cancelled',
            cancelled: true
          });
        } else {
          sendResponse({
            success: false,
            error: `OAuth flow failed: ${error}`
          });
        }
        return;
      }
      
      if (!callbackUrl) {
        sendResponse({
          success: false,
          error: 'OAuth flow returned no callback URL'
        });
        return;
      }
      
      console.log('[Background] OAuth callback URL received:', callbackUrl);
      sendResponse({
        success: true,
        callbackUrl: callbackUrl
      });
    });
  } catch (error) {
    console.error('[Background] Error launching OAuth flow:', error);
    sendResponse({
      success: false,
      error: error.message
    });
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
