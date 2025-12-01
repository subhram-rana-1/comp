/**
 * Payment UI Component
 * Creates and manages payment modals and prompts in content script
 */

import PaymentService from './PaymentService.js';
import ExtPayConfig from '../config/extpayConfig.js';

class PaymentUI {
  /**
   * Show payment modal overlay
   * @param {Object} options - Modal options
   * @param {string} options.title - Modal title
   * @param {string} options.message - Modal message
   * @param {boolean} options.showManageButton - Show manage subscription button
   * @returns {HTMLElement} The modal element
   */
  static showPaymentModal(options = {}) {
    // Remove existing modal if present
    const existingModal = document.getElementById('xplaino-payment-modal');
    if (existingModal) {
      existingModal.remove();
    }

    const overlay = document.createElement('div');
    overlay.className = 'payment-overlay';
    overlay.id = 'xplaino-payment-overlay';

    const modal = document.createElement('div');
    modal.className = 'payment-modal';
    modal.id = 'xplaino-payment-modal';

    // Close button
    const closeButton = document.createElement('button');
    closeButton.className = 'payment-close-button';
    closeButton.innerHTML = '×';
    closeButton.setAttribute('aria-label', 'Close');
    closeButton.onclick = () => this.hidePaymentModal();

    // Header
    const header = document.createElement('div');
    header.className = 'payment-modal-header';

    const title = document.createElement('h2');
    title.className = 'payment-modal-title';
    title.textContent = options.title || ExtPayConfig.UI_SETTINGS.messages.subscriptionRequired;

    const subtitle = document.createElement('p');
    subtitle.className = 'payment-modal-subtitle';
    subtitle.textContent = options.message || ExtPayConfig.UI_SETTINGS.messages.upgradePrompt;

    header.appendChild(title);
    header.appendChild(subtitle);

    // Body
    const body = document.createElement('div');
    body.className = 'payment-modal-body';

    const featuresList = document.createElement('ul');
    featuresList.className = 'payment-features';
    
    const features = [
      'AI-powered word explanations',
      'Text simplification',
      'Page summarization',
      'Interactive chat with context',
      'Multi-language support'
    ];

    features.forEach(feature => {
      const li = document.createElement('li');
      li.textContent = feature;
      featuresList.appendChild(li);
    });

    body.appendChild(featuresList);

    // Buttons
    const buttons = document.createElement('div');
    buttons.className = 'payment-buttons';

    const upgradeButton = document.createElement('button');
    upgradeButton.className = 'payment-button payment-button-primary';
    upgradeButton.textContent = ExtPayConfig.UI_SETTINGS.messages.upgradeButton;
    upgradeButton.onclick = async () => {
      try {
        await PaymentService.openPaymentPage();
        this.hidePaymentModal();
      } catch (error) {
        console.error('[PaymentUI] Error opening payment page:', error);
      }
    };

    buttons.appendChild(upgradeButton);

    if (options.showManageButton) {
      const manageButton = document.createElement('button');
      manageButton.className = 'payment-button payment-button-secondary';
      manageButton.textContent = ExtPayConfig.UI_SETTINGS.messages.manageSubscription;
      manageButton.onclick = async () => {
        try {
          await PaymentService.openSubscriptionManagement();
          this.hidePaymentModal();
        } catch (error) {
          console.error('[PaymentUI] Error opening subscription management:', error);
        }
      };
      buttons.appendChild(manageButton);
    }

    // Assemble modal
    modal.appendChild(closeButton);
    modal.appendChild(header);
    modal.appendChild(body);
    modal.appendChild(buttons);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Close on overlay click
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        this.hidePaymentModal();
      }
    };

    // Close on Escape key
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        this.hidePaymentModal();
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);

    return modal;
  }

  /**
   * Hide payment modal
   */
  static hidePaymentModal() {
    const overlay = document.getElementById('xplaino-payment-overlay');
    if (overlay) {
      overlay.style.animation = 'fadeOut 0.2s ease';
      setTimeout(() => {
        overlay.remove();
      }, 200);
    }
  }

  /**
   * Show inline payment prompt
   * @param {HTMLElement} container - Container element to append prompt to
   * @returns {HTMLElement} The prompt element
   */
  static showPaymentPrompt(container) {
    const prompt = document.createElement('div');
    prompt.className = 'payment-prompt';

    const title = document.createElement('div');
    title.className = 'payment-prompt-title';
    title.textContent = ExtPayConfig.UI_SETTINGS.messages.subscriptionRequired;

    const text = document.createElement('div');
    text.className = 'payment-prompt-text';
    text.textContent = ExtPayConfig.UI_SETTINGS.messages.upgradePrompt;

    const button = document.createElement('button');
    button.className = 'payment-prompt-button';
    button.textContent = ExtPayConfig.UI_SETTINGS.messages.upgradeButton;
    button.onclick = async () => {
      try {
        await PaymentService.openPaymentPage();
      } catch (error) {
        console.error('[PaymentUI] Error opening payment page:', error);
      }
    };

    prompt.appendChild(title);
    prompt.appendChild(text);
    prompt.appendChild(button);

    if (container) {
      container.appendChild(prompt);
    }

    return prompt;
  }

  /**
   * Inject payment UI CSS into the page
   */
  static injectStyles() {
    // Check if styles are already injected
    if (document.getElementById('xplaino-payment-ui-styles')) {
      return;
    }

    // For content scripts, we need to inject the CSS directly
    // since we can't use chrome.runtime.getURL in content script context easily
    // The CSS should be bundled with the content script or loaded via import
    // For now, we'll create a style element and inject the CSS
    // In production, the CSS file should be included in the build
    
    // Try to load via link tag first (if available in web_accessible_resources)
    try {
      const link = document.createElement('link');
      link.id = 'xplaino-payment-ui-styles';
      link.rel = 'stylesheet';
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
        link.href = chrome.runtime.getURL('payment-ui.css');
      } else {
        // Fallback: use relative path
        link.href = '/payment-ui.css';
      }
      document.head.appendChild(link);
    } catch (error) {
      console.warn('[PaymentUI] Could not inject CSS via link tag:', error);
      // CSS will need to be included via other means (e.g., bundled)
    }
  }
}

export default PaymentUI;

