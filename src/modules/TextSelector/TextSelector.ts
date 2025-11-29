/**
 * TextSelector Module
 * Handles text selection (mouseup), highlighting, and simplification API calls
 */

import {
  isSelectionAllowed,
  getDocumentText,
} from '../../utils/dom';
import { getTextKey, getContextualTextKey, hasMinimumWords, calculateTextPosition } from '../../utils/text';
import { hasOverlap, highlightRange as highlightRangeUtil, removeHighlight } from '../../utils/highlight';
import { ApiService } from '../../services';
import type { SimplifyRequest, SimplifyResponse } from '../../types';

export interface SimplifiedTextData {
  textStartIndex: number;
  textLength: number;
  text: string;
  simplifiedText: string;
  previousSimplifiedTexts: string[];
  shouldAllowSimplifyMore?: boolean;
  highlight?: HTMLElement;
}

export class TextSelector {
  // Use Set for O(1) insertion, deletion, and lookup
  selectedTexts: Set<string> = new Set();

  // Map to store text -> highlight element
  textToHighlights: Map<string, HTMLElement> = new Map();

  // Map to store textKey -> {textStartIndex, textLength, text, range}
  textPositions: Map<string, any> = new Map();

  // Map to store ranges for textKeys that haven't been highlighted yet (button shown but no span)
  pendingRanges: Map<string, Range> = new Map();

  // Map to store button wrappers for pending selections (before span is created)
  buttonWrappers: Map<string, HTMLElement> = new Map();

  // Container for texts that have been asked (moved from selectedTexts)
  askedTexts: Map<string, { text: string; textKey: string; highlight: HTMLElement }> = new Map();

  // Container for simplified texts metadata
  simplifiedTexts: Map<string, SimplifiedTextData> = new Map();

  // Track if the feature is enabled
  isEnabled: boolean = false;

  // Counter for generating unique IDs
  highlightIdCounter: number = 0;

  // Store bound handler for proper cleanup
  boundMouseUpHandler: ((event: MouseEvent) => void) | null = null;

  // Callbacks
  onTextSelected?: (text: string, textKey: string) => void;
  onTextRemoved?: (textKey: string) => void;
  onTextSimplified?: (textKey: string, data: SimplifiedTextData) => void;

  /**
   * Initialize text selector
   */
  async init(): Promise<void> {
    console.log('[TextSelector] Initializing...');

    // Bind the handler once for proper cleanup
    this.boundMouseUpHandler = this.handleMouseUp.bind(this);

    // Inject styles for text highlights
    this.injectStyles();

    // Check if extension is enabled
    const isExtensionEnabled = await this.checkExtensionEnabled();

    if (isExtensionEnabled) {
      this.enable();
    }

    console.log('[TextSelector] Initialized. Enabled:', isExtensionEnabled);
  }

  /**
   * Check if extension is enabled from storage
   */
  async checkExtensionEnabled(): Promise<boolean> {
    try {
      const result = await chrome.storage.local.get(['is_extension_globally_enabled']);
      let isEnabled = result.is_extension_globally_enabled;

      if (isEnabled === undefined) {
        isEnabled = true;
        await chrome.storage.local.set({ is_extension_globally_enabled: isEnabled });
        console.log('[TextSelector] Global toggle state not found, created with default value: true');
      }

      return isEnabled;
    } catch (error) {
      console.error('[TextSelector] Error checking global extension state:', error);
      return true; // Default to true (enabled) on error
    }
  }

  /**
   * Enable text selector
   */
  enable(): void {
    if (this.isEnabled) return;

    this.isEnabled = true;
    if (this.boundMouseUpHandler) {
      document.addEventListener('mouseup', this.boundMouseUpHandler);
    }
    console.log('[TextSelector] Enabled');
  }

  /**
   * Disable text selector
   */
  disable(): void {
    if (!this.isEnabled) return;

    this.isEnabled = false;
    if (this.boundMouseUpHandler) {
      document.removeEventListener('mouseup', this.boundMouseUpHandler);
    }
    console.log('[TextSelector] Disabled');
  }

  /**
   * Handle mouse up event (after text selection)
   */
  handleMouseUp(event: MouseEvent): void {
    if (!this.isEnabled) {
      return;
    }

    // Allow button clicks to proceed
    if ((event.target as Element).closest('button') || (event.target as HTMLElement).tagName === 'BUTTON') {
      return;
    }

    // Check if clicking on existing highlights
    if (
      (event.target as Element).closest('.vocab-text-highlight') ||
      (event.target as Element).closest('.vocab-word-highlight')
    ) {
      return;
    }

    // Check if selection is allowed
    if (!isSelectionAllowed(event.target as Element)) {
      console.log('[TextSelector] Selection not allowed - clicked in extension UI');
      return;
    }

    // Small delay to ensure selection is complete
    setTimeout(() => {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim() || '';

      if (!selectedText || selectedText.length === 0) {
        return;
      }

      // Must have at least one space (to differentiate from single words)
      if (!/\s/.test(selectedText) && selectedText.length < 15) {
        return; // Let WordSelector handle single words
      }

      // Check if text has at least 3 words
      if (!hasMinimumWords(selectedText, 3)) {
        this.showNotification('Select at least 3 words');
        selection?.removeAllRanges();
        return;
      }

      // Get the range and validate
      if (!selection || selection.rangeCount === 0) {
        return;
      }

      const range = selection.getRangeAt(0);

      // Validate the selection range itself
      if (!isSelectionAllowed(range)) {
        console.log('[TextSelector] Selection not allowed - range is in extension UI');
        selection.removeAllRanges();
        return;
      }

      // Check if this exact text is already selected
      const textKey = getContextualTextKey(selectedText);
      if (this.selectedTexts.has(textKey)) {
        console.log('[TextSelector] Text already selected');
        selection.removeAllRanges();
        return;
      }

      // Check if the range overlaps with any existing highlight
      if (hasOverlap(range)) {
        console.log('[TextSelector] Selection overlaps with existing highlight');
        this.showNotification("Can't select an already selected text");
        selection.removeAllRanges();
        return;
      }

      // Add text to selected set with range for position tracking
      this.addText(selectedText, range);

      // Capture mouse release coordinates for button positioning
      const mouseReleaseX = event.clientX;
      const mouseReleaseY = event.clientY;

      // Store the range for later use (when button is clicked)
      this.pendingRanges.set(textKey, range.cloneRange());

      // Show magic meaning button
      this.showMagicMeaningButton(range, selectedText, textKey, { x: mouseReleaseX, y: mouseReleaseY });

      // Preserve Chrome's default selection (yellow background)
      // Don't clear the selection - let users copy the text
    }, 10);
  }

  /**
   * Show magic-meaning button without wrapping text in a span
   */
  showMagicMeaningButton(
    range: Range,
    text: string,
    textKey: string,
    mouseReleaseCoords: { x: number; y: number }
  ): void {
    // Create icons wrapper for the magic meaning button
    const iconsWrapper = document.createElement('div');
    iconsWrapper.className = 'vocab-text-icons-wrapper vocab-text-icons-wrapper-magic';
    iconsWrapper.setAttribute('data-text-key', textKey);
    iconsWrapper.id = `vocab-button-wrapper-${textKey.replace(/\s+/g, '-').substring(0, 20)}`;

    // Create and add magic meaning button
    const magicBtn = this.createMagicMeaningButton(textKey);
    iconsWrapper.appendChild(magicBtn);

    // Position button absolutely relative to document
    iconsWrapper.style.setProperty('position', 'absolute', 'important');
    iconsWrapper.style.setProperty('display', 'flex', 'important');
    iconsWrapper.style.setProperty('z-index', '10000000', 'important');
    iconsWrapper.style.setProperty('pointer-events', 'auto', 'important');

    // Calculate position
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    const buttonWidth = 32;
    const buttonHeight = 32;

    let left = mouseReleaseCoords.x + scrollX - 50;
    let top = mouseReleaseCoords.y + scrollY;

    // Adjust if button goes out of viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left + buttonWidth > scrollX + viewportWidth - 10) {
      const rect = range.getBoundingClientRect();
      left = rect.left + scrollX - buttonWidth - 8;
    }
    if (left < scrollX + 10) {
      left = scrollX + 10;
    }
    if (top + buttonHeight > scrollY + viewportHeight - 10) {
      top = scrollY + viewportHeight - buttonHeight - 10;
    }
    if (top < scrollY + 10) {
      top = scrollY + 10;
    }

    iconsWrapper.style.setProperty('left', `${left}px`, 'important');
    iconsWrapper.style.setProperty('top', `${top}px`, 'important');

    // Add to body
    document.body.appendChild(iconsWrapper);
    this.buttonWrappers.set(textKey, iconsWrapper);

    // Click handler: remove button when clicking anywhere except on the button itself
    const handleGlobalClick = (event: MouseEvent) => {
      if (
        !iconsWrapper ||
        !iconsWrapper.parentNode ||
        (event.target as Element).closest('.vocab-text-magic-meaning-btn') ||
        (event.target as Element).closest('.vocab-text-icons-wrapper')
      ) {
        return;
      }

      const magicBtn = iconsWrapper.querySelector('.vocab-text-magic-meaning-btn');
      if (magicBtn && magicBtn.classList.contains('magic-meaning-loading')) {
        return; // Don't remove if loading
      }

      setTimeout(() => {
        if (!iconsWrapper || !iconsWrapper.parentNode) {
          return;
        }
        const checkMagicBtn = iconsWrapper.querySelector('.vocab-text-magic-meaning-btn');
        if (checkMagicBtn && checkMagicBtn.classList.contains('magic-meaning-loading')) {
          return;
        }
        this.removeButtonWrapper(textKey);
      }, 10);
    };

    document.addEventListener('click', handleGlobalClick, { once: false });

    // Store cleanup function
    (iconsWrapper as any)._cleanup = () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }

  /**
   * Create magic meaning button
   */
  createMagicMeaningButton(textKey: string): HTMLElement {
    const btn = document.createElement('button');
    btn.className = 'vocab-text-magic-meaning-btn';
    btn.setAttribute('aria-label', 'Simplify text');
    btn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L14.5 8.5L21 11L14.5 13.5L12 20L9.5 13.5L3 11L9.5 8.5L12 2Z" stroke="#9527F5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;

    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Get the stored range
      const range = this.pendingRanges.get(textKey);
      if (!range) {
        console.warn('[TextSelector] No range found for textKey:', textKey);
        return;
      }

      // Show loading state
      btn.classList.add('magic-meaning-loading');
      const originalHTML = btn.innerHTML;
      btn.innerHTML = `
        <div class="vocab-loading-spinner" style="width: 16px; height: 16px; border: 2px solid rgba(149, 39, 245, 0.2); border-top-color: #9527F5; border-radius: 50%; animation: vocab-spinner-rotate 0.8s linear infinite;"></div>
      `;

      try {
        // Create highlight
        const highlight = this.highlightText(range, textKey);

        // Get text position
        const positionData = calculateTextPosition(range);
        const selectedText = range.toString().trim();

        // Call simplification API
        await this.simplifyText(textKey, selectedText, positionData, highlight);
      } catch (error) {
        console.error('[TextSelector] Error processing magic meaning:', error);
        btn.classList.remove('magic-meaning-loading');
        btn.innerHTML = originalHTML;
      }
    });

    return btn;
  }

  /**
   * Highlight text with a styled span
   */
  highlightText(range: Range, textKey: string): HTMLElement {
    // Remove button wrapper
    this.removeButtonWrapper(textKey);

    // Create highlight
    const highlight = highlightRangeUtil(range, textKey, 'vocab-text-highlight', `text-highlight-${this.highlightIdCounter++}`);

    // Store highlight
    this.textToHighlights.set(textKey, highlight);

    // Add remove button
    const removeBtn = this.createRemoveButton(textKey);
    highlight.appendChild(removeBtn);

    return highlight;
  }

  /**
   * Create a remove button for the highlight
   */
  createRemoveButton(textKey: string): HTMLElement {
    const btn = document.createElement('button');
    btn.className = 'vocab-text-remove-btn';
    btn.setAttribute('aria-label', 'Remove highlight');
    btn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 2L10 10M10 2L2 10" stroke="#9527F5" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.removeText(textKey);
    });

    return btn;
  }

  /**
   * Simplify text using API
   */
  async simplifyText(
    textKey: string,
    text: string,
    positionData: { textStartIndex: number; textLength: number; text: string },
    highlight: HTMLElement
  ): Promise<void> {
    const payload: SimplifyRequest[] = [
      {
        textStartIndex: positionData.textStartIndex,
        textLength: positionData.textLength,
        text: text,
        previousSimplifiedTexts: [],
      },
    ];

    try {
      await ApiService.simplify({
        textSegments: payload,
        onEvent: (event: SimplifyResponse) => {
          if (event.type === 'chunk' && event.accumulatedSimplifiedText) {
            // Update highlight with simplified text as it streams
            // This is a simplified version - full implementation would update the DOM
          } else if (event.type === 'complete' && event.simplifiedText) {
            // Store simplified text data
            const simplifiedData: SimplifiedTextData = {
              textStartIndex: positionData.textStartIndex,
              textLength: positionData.textLength,
              text: text,
              simplifiedText: event.simplifiedText,
              previousSimplifiedTexts: [],
              shouldAllowSimplifyMore: event.shouldAllowSimplifyMore ?? true,
              highlight: highlight,
            };

            this.simplifiedTexts.set(textKey, simplifiedData);

            // Update highlight to show simplified state
            highlight.classList.add('vocab-text-simplified');

            // Remove from selected texts
            this.selectedTexts.delete(textKey);

            this.onTextSimplified?.(textKey, simplifiedData);
          } else if (event.type === 'error') {
            console.error('[TextSelector] Error in simplification:', event.error_message);
          }
        },
        onComplete: () => {
          // Remove loading state from button if it still exists
          const buttonWrapper = this.buttonWrappers.get(textKey);
          if (buttonWrapper) {
            const magicBtn = buttonWrapper.querySelector('.vocab-text-magic-meaning-btn');
            if (magicBtn) {
              magicBtn.classList.remove('magic-meaning-loading');
            }
          }
        },
        onError: (error) => {
          console.error('[TextSelector] Error simplifying text:', error);
          const buttonWrapper = this.buttonWrappers.get(textKey);
          if (buttonWrapper) {
            const magicBtn = buttonWrapper.querySelector('.vocab-text-magic-meaning-btn');
            if (magicBtn) {
              magicBtn.classList.remove('magic-meaning-loading');
            }
          }
        },
      });
    } catch (error) {
      console.error('[TextSelector] Error calling simplify API:', error);
    }
  }

  /**
   * Add a text to the selected texts set
   */
  addText(text: string, range: Range): void {
    const textKey = getContextualTextKey(text);
    this.selectedTexts.add(textKey);

    // Store position information
    const positionData = calculateTextPosition(range);
    this.textPositions.set(textKey, positionData);

    this.onTextSelected?.(text, textKey);
  }

  /**
   * Remove a text from the selected texts set
   */
  removeText(textKey: string): void {
    const highlight = this.textToHighlights.get(textKey);

    if (highlight) {
      removeHighlight(highlight);
      this.textToHighlights.delete(textKey);
    }

    this.selectedTexts.delete(textKey);
    this.textPositions.delete(textKey);
    this.pendingRanges.delete(textKey);
    this.removeButtonWrapper(textKey);

    this.onTextRemoved?.(textKey);
  }

  /**
   * Remove button wrapper
   */
  removeButtonWrapper(textKey: string): void {
    const wrapper = this.buttonWrappers.get(textKey);
    if (wrapper) {
      if ((wrapper as any)._cleanup) {
        (wrapper as any)._cleanup();
      }
      wrapper.remove();
      this.buttonWrappers.delete(textKey);
    }
  }

  /**
   * Show notification banner
   */
  showNotification(message: string): void {
    const existingNotification = document.getElementById('vocab-text-selector-notification');
    if (existingNotification) {
      existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.id = 'vocab-text-selector-notification';
    notification.className = 'vocab-notification';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'vocab-notification-close';
    closeBtn.setAttribute('aria-label', 'Close notification');
    closeBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 3L3 9M3 3l6 6" stroke="#9527F5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;

    closeBtn.addEventListener('click', () => {
      notification.classList.remove('visible');
      setTimeout(() => {
        notification.remove();
      }, 300);
    });

    const messageText = document.createElement('span');
    messageText.className = 'vocab-notification-message';
    messageText.textContent = message;

    notification.appendChild(closeBtn);
    notification.appendChild(messageText);
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('visible');
    }, 10);

    setTimeout(() => {
      notification.classList.remove('visible');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }

  /**
   * Clear all selections
   */
  clearAll(): void {
    this.textToHighlights.forEach((highlight) => {
      removeHighlight(highlight);
    });

    this.buttonWrappers.forEach((wrapper) => {
      if ((wrapper as any)._cleanup) {
        (wrapper as any)._cleanup();
      }
      wrapper.remove();
    });

    this.selectedTexts.clear();
    this.textToHighlights.clear();
    this.textPositions.clear();
    this.pendingRanges.clear();
    this.buttonWrappers.clear();
    this.askedTexts.clear();
    this.simplifiedTexts.clear();

    console.log('[TextSelector] All selections cleared');
  }

  /**
   * Inject CSS styles for text highlights
   */
  injectStyles(): void {
    const styleId = 'vocab-text-selector-styles';

    if (document.getElementById(styleId)) {
      return;
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .vocab-text-highlight {
        position: relative;
        display: inline;
        text-decoration: underline;
        text-decoration-color: rgba(149, 39, 245, 0.5);
        text-decoration-thickness: 2px;
        text-underline-offset: 2px;
        cursor: pointer;
      }
      
      .vocab-text-highlight:hover {
        text-decoration-color: rgba(149, 39, 245, 0.8);
      }
      
      .vocab-text-simplified {
        text-decoration-color: rgba(34, 197, 94, 0.5) !important;
      }
      
      .vocab-text-simplified:hover {
        text-decoration-color: rgba(34, 197, 94, 0.8) !important;
      }
      
      .vocab-text-remove-btn {
        position: absolute;
        top: -10px;
        right: -10px;
        width: 18px;
        height: 18px;
        background-color: #FFFFFF !important;
        border: 1px solid #9527F5 !important;
        border-radius: 50% !important;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 1 !important;
        transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
        padding: 0;
        z-index: 999999;
        box-shadow: 0 1px 3px rgba(149, 39, 245, 0.2);
      }
      
      .vocab-text-remove-btn:hover {
        transform: scale(1.15);
      }
      
      .vocab-text-remove-btn:active {
        transform: scale(0.95);
      }
      
      .vocab-text-icons-wrapper {
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-items: center;
      }
      
      .vocab-text-magic-meaning-btn {
        width: 32px;
        height: 32px;
        background-color: #9527F5;
        border: none;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: transform 0.2s ease, background-color 0.2s ease;
        box-shadow: 0 2px 8px rgba(149, 39, 245, 0.3);
      }
      
      .vocab-text-magic-meaning-btn:hover {
        transform: scale(1.1);
        background-color: #801ac8;
      }
      
      .vocab-text-magic-meaning-btn:active {
        transform: scale(0.95);
      }
      
      .vocab-text-magic-meaning-btn.magic-meaning-loading {
        background-color: rgba(149, 39, 245, 0.7);
      }
      
      .vocab-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #9527F5;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 2147483647;
        opacity: 0;
        transform: translateX(100%);
        transition: opacity 0.3s ease, transform 0.3s ease;
      }
      
      .vocab-notification.visible {
        opacity: 1;
        transform: translateX(0);
      }
      
      .vocab-notification-close {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      @keyframes vocab-spinner-rotate {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;

    document.head.appendChild(style);
  }
}

// Export singleton instance
export const textSelector = new TextSelector();

