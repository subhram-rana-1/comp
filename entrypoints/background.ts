// ===================================
// Background Script - Handles Tab Events and Extension State Management
// ===================================

/**
 * Background script to handle tab loading, refresh, and switch events
 * Sends signals to content scripts to check and manage extension state
 */

import type { ExtensionMessage, TabStateChangeMessage, ToggleExtensionMessage } from '../src/types';

export default defineBackground(() => {
  // ===================================
  // Tab Event Handlers
  // ===================================

  /**
   * Handle tab updates (loading, refresh, navigation)
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
   */
  chrome.tabs.onCreated.addListener(async (tab) => {
    console.log('[Background] Tab created:', tab.id, tab.url);

    // Only process if tab has a URL (not chrome:// or about:)
    if (tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
      try {
        const domain = new URL(tab.url).hostname;
        console.log('[Background] New tab domain:', domain);

        // Send message to content script to check extension state
        if (tab.id) {
          await sendTabStateMessage(tab.id, domain, 'TAB_CREATED');
        }
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
  chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
    console.log('[Background] Message received:', message, 'from tab:', sender.tab?.id);

    switch (message.type) {
      case 'CHECK_EXTENSION_STATE':
        handleExtensionStateCheck(message.domain || '', sender.tab?.id, sendResponse);
        return true; // Keep message channel open for async response

      case 'EXTENSION_DISABLED':
        handleExtensionDisabled(message.domain || '', sendResponse);
        return true;

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
   */
  async function sendTabStateMessage(
    tabId: number,
    domain: string,
    eventType: 'TAB_LOADED' | 'TAB_SWITCHED' | 'TAB_CREATED'
  ) {
    try {
      const message: TabStateChangeMessage = {
        type: 'TAB_STATE_CHANGE',
        domain,
        eventType,
      };

      const response = await chrome.tabs.sendMessage(tabId, message);

      console.log(`[Background] Tab state message sent to tab ${tabId}:`, response);
    } catch (error) {
      // Content script might not be ready yet, this is normal
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`[Background] Could not send message to tab ${tabId}:`, errorMessage);
    }
  }

  /**
   * Handle extension state check request
   */
  async function handleExtensionStateCheck(
    domain: string,
    tabId: number | undefined,
    sendResponse: (response: any) => void
  ) {
    try {
      const storageKey = `isExtensionEnabledFor_${domain}`;
      const result = await chrome.storage.local.get([storageKey]);
      const isEnabled = result[storageKey] ?? false; // Default to false for new domains

      console.log(`[Background] Extension state for ${domain}:`, isEnabled);

      sendResponse({
        success: true,
        isEnabled: isEnabled,
        domain: domain,
      });
    } catch (error) {
      console.error('[Background] Error checking extension state:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        isEnabled: false,
      });
    }
  }

  /**
   * Handle extension disabled event
   */
  async function handleExtensionDisabled(domain: string, sendResponse: (response: any) => void) {
    try {
      const storageKey = `isExtensionEnabledFor_${domain}`;
      await chrome.storage.local.remove([storageKey]);

      console.log(`[Background] Extension disabled for ${domain}, storage cleared`);

      sendResponse({
        success: true,
        message: `Extension disabled for ${domain}`,
      });
    } catch (error) {
      console.error('[Background] Error handling extension disabled:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
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
});

