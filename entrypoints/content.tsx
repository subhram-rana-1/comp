import { defineContentScript } from 'wxt/sandbox';
import { initContentScriptApp } from '../src/components/ContentScriptApp';
import { useExtensionStore, useLanguageStore } from '../src/store';
import type { ExtensionMessage } from '../src/types';

export default defineContentScript({
  matches: ['<all_urls>'],

  async main() {
    console.log('[Content Script] Content script loaded');

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      await new Promise((resolve) => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
    }

    // Initialize stores
    const extensionStore = useExtensionStore.getState();
    const languageStore = useLanguageStore.getState();

    await extensionStore.loadState();
    await languageStore.loadLanguage();

    // Initialize React app
    initContentScriptApp();

    // Listen for messages from background and popup
    chrome.runtime.onMessage.addListener((message: ExtensionMessage) => {
      console.log('[Content Script] Message received:', message);

      switch (message.type) {
        case 'TOGGLE_EXTENSION_GLOBAL':
          // Handle toggle state change
          if (message.isEnabled !== undefined) {
            extensionStore.setExtensionEnabled(message.isEnabled);
            console.log('[Content Script] Extension toggled:', message.isEnabled);
          }
          break;

        case 'TAB_STATE_CHANGE':
          // Handle tab state changes
          console.log('[Content Script] Tab state changed:', message.eventType);
          break;

        default:
          console.log('[Content Script] Unknown message type:', message.type);
      }
    });

    console.log('[Content Script] Initialization complete');
  },
});

