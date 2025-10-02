import ApiService from '../core/services/ApiService.js';
import SimplifyService from '../core/services/SimplifyService.js';

export default defineContentScript({
  matches: ['<all_urls>'],
  
  async main() {
    // Get current domain
    const currentDomain = window.location.hostname;
    const storageKey = `isExtensionEnabledFor_${currentDomain}`;
    
    console.log('[Content Script] Current domain:', currentDomain);
    console.log('[Content Script] Storage key:', storageKey);
    
    // Initialize the button panel when content script loads
    await ButtonPanel.init();
    
    // Initialize the word selector functionality
    await WordSelector.init();
    
    // Initialize the text selector functionality
    await TextSelector.init();
    
    // Initialize the chat dialog
    ChatDialog.init();
    
    // Listen for storage changes to show/hide panel (per-domain)
    chrome.storage.onChanged.addListener((changes, namespace) => {
      console.log('[Content Script] Storage changed:', changes, 'Namespace:', namespace);
      
      if (namespace === 'local') {
        // Check if our domain's key changed
        if (changes[storageKey]) {
          const isEnabled = changes[storageKey].newValue;
          console.log(`[Content Script] Toggle state changed for ${currentDomain}:`, isEnabled);
          
          if (isEnabled) {
            ButtonPanel.show();
            WordSelector.enable();
            TextSelector.enable();
          } else {
            ButtonPanel.hide();
            WordSelector.disable();
            TextSelector.disable();
            // Clear all selections when toggling off
            WordSelector.clearAll();
            TextSelector.clearAll();
          }
        }
      }
    });
    
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('[Content Script] Message received:', message);
      
      if (message.type === 'TOGGLE_EXTENSION' && message.domain === currentDomain) {
        console.log(`[Content Script] Toggling extension for ${currentDomain}:`, message.isEnabled);
        
        if (message.isEnabled) {
          ButtonPanel.show();
          WordSelector.enable();
          TextSelector.enable();
        } else {
          ButtonPanel.hide();
          WordSelector.disable();
          TextSelector.disable();
          // Clear all selections when toggling off
          WordSelector.clearAll();
          TextSelector.clearAll();
        }
        
        sendResponse({ success: true });
      }
    });
  },
});

// ===================================
// Position Manager Module - Handles saving and loading panel position
// ===================================
const PositionManager = {
  STORAGE_KEY: 'vocab-helper-panel-position',
  
  /**
   * Save panel position to storage
   * @param {Object} position - Position object {top, left}
   */
  async savePosition(position) {
    try {
      await chrome.storage.local.set({ [this.STORAGE_KEY]: position });
    } catch (error) {
      console.error('Error saving panel position:', error);
    }
  },
  
  /**
   * Load panel position from storage
   * @returns {Promise<Object|null>} Position object or null if not found
   */
  async loadPosition() {
    try {
      const result = await chrome.storage.local.get([this.STORAGE_KEY]);
      return result[this.STORAGE_KEY] || null;
    } catch (error) {
      console.error('Error loading panel position:', error);
      return null;
    }
  },
  
  /**
   * Clear saved position
   */
  async clearPosition() {
    try {
      await chrome.storage.local.remove([this.STORAGE_KEY]);
    } catch (error) {
      console.error('Error clearing panel position:', error);
    }
  }
};

// ===================================
// Word Selector Module - Handles word selection and highlighting
// ===================================
const WordSelector = {
  // Use Set for O(1) insertion, deletion, and lookup
  selectedWords: new Set(),
  
  // Map to store word -> Set of highlight elements (for handling multiple instances)
  wordToHighlights: new Map(),
  
  // Track if the feature is enabled
  isEnabled: false,
  
  // Counter for generating unique IDs
  highlightIdCounter: 0,
  
  // Store bound handler for proper cleanup
  boundDoubleClickHandler: null,
  
  /**
   * Initialize word selector
   */
  async init() {
    console.log('[WordSelector] Initializing...');
    
    // Bind the handler once for proper cleanup
    this.boundDoubleClickHandler = this.handleDoubleClick.bind(this);
    
    // Inject styles for word highlights
    this.injectStyles();
    
    // Check if extension is enabled for current domain
    const isExtensionEnabled = await this.checkExtensionEnabled();
    
    if (isExtensionEnabled) {
      this.enable();
    }
    
    console.log('[WordSelector] Initialized. Enabled:', isExtensionEnabled);
  },
  
  /**
   * Check if extension is enabled from storage
   * @returns {Promise<boolean>}
   */
  async checkExtensionEnabled() {
    try {
      const currentDomain = window.location.hostname;
      const storageKey = `isExtensionEnabledFor_${currentDomain}`;
      const result = await chrome.storage.local.get([storageKey]);
      return result[storageKey] ?? true; // Default to true
    } catch (error) {
      console.error('[WordSelector] Error checking extension state:', error);
      return true;
    }
  },
  
  /**
   * Enable word selector
   */
  enable() {
    if (this.isEnabled) return;
    
    this.isEnabled = true;
    document.addEventListener('dblclick', this.boundDoubleClickHandler);
    console.log('[WordSelector] Enabled');
  },
  
  /**
   * Disable word selector
   */
  disable() {
    if (!this.isEnabled) return;
    
    this.isEnabled = false;
    document.removeEventListener('dblclick', this.boundDoubleClickHandler);
    console.log('[WordSelector] Disabled');
  },
  
  /**
   * Handle double-click event
   * @param {MouseEvent} event
   */
  handleDoubleClick(event) {
    // CRITICAL: Check if feature is enabled
    if (!this.isEnabled) {
      return;
    }
    
    // Don't process clicks on our own UI elements (except highlights)
    if (event.target.closest('.vocab-helper-panel')) {
      return;
    }
    
    // Check if clicking on an existing highlight to deselect it
    const clickedHighlight = event.target.closest('.vocab-word-highlight');
    if (clickedHighlight) {
      const word = clickedHighlight.getAttribute('data-word');
      if (word) {
        this.removeWord(word);
        console.log('[WordSelector] Word deselected via double-click:', word);
      }
      return;
    }
    
    // Get the selected text
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    // Check if a word was selected
    if (!selectedText || selectedText.length === 0) {
      return;
    }
    
    // Only process single words (no spaces)
    if (/\s/.test(selectedText)) {
      return;
    }
    
    // Get the range and validate
    if (selection.rangeCount === 0) {
      return;
    }
    
    const normalizedWord = selectedText.toLowerCase();
    
    // Check if word is already selected - if so, deselect it
    if (this.isWordSelected(normalizedWord)) {
      this.removeWord(selectedText);
      selection.removeAllRanges();
      console.log('[WordSelector] Word deselected:', selectedText);
      return;
    }
    
    const range = selection.getRangeAt(0);
    
    // Add word to selected set (O(1) operation)
    this.addWord(selectedText);
    
    // Highlight the word
    this.highlightRange(range, selectedText);
    
    // Clear the selection
    selection.removeAllRanges();
    
    console.log('[WordSelector] Word selected:', selectedText);
    console.log('[WordSelector] Total selected words:', this.selectedWords.size);
  },
  
  /**
   * Check if a word is already selected
   * @param {string} word - The word to check
   * @returns {boolean}
   */
  isWordSelected(word) {
    const normalizedWord = word.toLowerCase();
    return this.selectedWords.has(normalizedWord); // O(1) operation
  },
  
  /**
   * Add a word to the selected words set
   * @param {string} word - The word to add
   */
  addWord(word) {
    const normalizedWord = word.toLowerCase();
    this.selectedWords.add(normalizedWord); // O(1) operation
    // Update button states
    ButtonPanel.updateButtonStatesFromSelections();
  },
  
  /**
   * Remove a word from the selected words set
   * @param {string} word - The word to remove
   */
  removeWord(word) {
    const normalizedWord = word.toLowerCase();
    
    // Get all highlights for this word
    const highlights = this.wordToHighlights.get(normalizedWord);
    
    if (highlights) {
      // Remove all highlight elements for this word
      highlights.forEach(highlight => {
        this.removeHighlight(highlight);
      });
      
      // Clean up the mapping
      this.wordToHighlights.delete(normalizedWord); // O(1) operation
    }
    
    // Remove from selected words set
    this.selectedWords.delete(normalizedWord); // O(1) operation
    
    console.log('[WordSelector] Word removed:', word);
    console.log('[WordSelector] Remaining selected words:', this.selectedWords.size);
    
    // Update button states
    ButtonPanel.updateButtonStatesFromSelections();
  },
  
  /**
   * Highlight a range with a styled span
   * @param {Range} range - The range to highlight
   * @param {string} word - The word being highlighted
   */
  highlightRange(range, word) {
    const normalizedWord = word.toLowerCase();
    
    // Create highlight wrapper
    const highlight = document.createElement('span');
    highlight.className = 'vocab-word-highlight';
    highlight.setAttribute('data-word', normalizedWord);
    highlight.setAttribute('data-highlight-id', `highlight-${this.highlightIdCounter++}`);
    
    // Wrap the selected range FIRST
    try {
      range.surroundContents(highlight);
    } catch (error) {
      // If surroundContents fails (e.g., partial selection), use extractContents
      console.warn('[WordSelector] Could not highlight range:', error);
      const contents = range.extractContents();
      highlight.appendChild(contents);
      range.insertNode(highlight);
    }
    
    // Create and append remove button AFTER wrapping the content
    const removeBtn = this.createRemoveButton(word);
    highlight.appendChild(removeBtn);
    
    // Store the highlight in our map (O(1) operation)
    if (!this.wordToHighlights.has(normalizedWord)) {
      this.wordToHighlights.set(normalizedWord, new Set());
    }
    this.wordToHighlights.get(normalizedWord).add(highlight);
  },
  
  /**
   * Create a remove button for the highlight
   * @param {string} word - The word this button will remove
   * @returns {HTMLElement}
   */
  createRemoveButton(word) {
    const btn = document.createElement('button');
    btn.className = 'vocab-word-remove-btn';
    btn.setAttribute('aria-label', `Remove highlight for "${word}"`);
    btn.innerHTML = this.createCloseIcon();
    
    // Add click handler
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.removeWord(word);
    });
    
    return btn;
  },
  
  /**
   * Create close/cross icon SVG - Purple wireframe style
   * @returns {string} SVG markup
   */
  createCloseIcon() {
    return `
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 1L9 9M9 1L1 9" stroke="#9527F5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  },
  
  /**
   * Remove a highlight element and restore original text
   * @param {HTMLElement} highlight - The highlight element to remove
   */
  removeHighlight(highlight) {
    const parent = highlight.parentNode;
    if (!parent) return;
    
    // Remove the button first
    const btn = highlight.querySelector('.vocab-word-remove-btn');
    if (btn) {
      btn.remove();
    }
    
    // Move all child nodes back to parent
    while (highlight.firstChild) {
      parent.insertBefore(highlight.firstChild, highlight);
    }
    
    // Remove the empty highlight span
    highlight.remove();
    
    // Normalize the parent to merge adjacent text nodes
    parent.normalize();
  },
  
  /**
   * Get all selected words
   * @returns {Set<string>}
   */
  getSelectedWords() {
    return new Set(this.selectedWords); // Return a copy
  },
  
  /**
   * Clear all selections
   */
  clearAll() {
    // Remove all highlights
    this.wordToHighlights.forEach((highlights) => {
      highlights.forEach(highlight => {
        this.removeHighlight(highlight);
      });
    });
    
    // Clear data structures (O(1) for Set clear)
    this.selectedWords.clear();
    this.wordToHighlights.clear();
    
    console.log('[WordSelector] All selections cleared');
    
    // Update button states
    ButtonPanel.updateButtonStatesFromSelections();
  },
  
  /**
   * Inject CSS styles for word highlights
   */
  injectStyles() {
    const styleId = 'vocab-word-selector-styles';
    
    // Check if styles already injected
    if (document.getElementById(styleId)) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Word highlight wrapper */
      .vocab-word-highlight {
        position: relative;
        display: inline-block;
        background-color: rgba(149, 39, 245, 0.15);
        padding: 1px 4px;
        border-radius: 4px;
        transition: background-color 0.2s ease;
        cursor: pointer;
        margin: 0 1px;
      }
      
      .vocab-word-highlight:hover {
        background-color: rgba(149, 39, 245, 0.25);
      }
      
      /* Remove button - Clean cross icon without circle */
      .vocab-word-remove-btn {
        position: absolute;
        top: -6px;
        right: -6px;
        width: 12px;
        height: 12px;
        background: none;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 0.7;
        transition: opacity 0.2s ease, transform 0.1s ease;
        padding: 0;
        z-index: 999999;
      }
      
      .vocab-word-highlight:hover .vocab-word-remove-btn {
        opacity: 1;
      }
      
      .vocab-word-remove-btn:hover {
        transform: scale(1.2);
        opacity: 1;
      }
      
      .vocab-word-remove-btn:active {
        transform: scale(0.9);
      }
      
      .vocab-word-remove-btn svg {
        pointer-events: none;
        display: block;
        width: 10px;
        height: 10px;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
      }
      
      /* Make sure highlight doesn't interfere with text flow */
      .vocab-word-highlight * {
        box-sizing: border-box;
      }
    `;
    
    document.head.appendChild(style);
  }
};

// ===================================
// Text Selector Module - Handles text selection and highlighting
// ===================================
const TextSelector = {
  // Use Set for O(1) insertion, deletion, and lookup
  selectedTexts: new Set(),
  
  // Map to store text -> highlight element
  textToHighlights: new Map(),
  
  // Map to store textKey -> {textStartIndex, textLength, text, range}
  textPositions: new Map(),
  
  // Container for texts that have been asked (moved from selectedTexts)
  askedTexts: new Map(), // Map of textKey -> {text, textKey, highlight, simplifiedText}
  
  // Container for simplified texts metadata
  simplifiedTexts: new Map(), // Map of textKey -> {textStartIndex, textLength, text, simplifiedText, previousSimplifiedTexts}
  
  // Track if the feature is enabled
  isEnabled: false,
  
  // Counter for generating unique IDs
  highlightIdCounter: 0,
  
  // Store bound handler for proper cleanup
  boundMouseUpHandler: null,
  
  /**
   * Initialize text selector
   */
  async init() {
    console.log('[TextSelector] Initializing...');
    
    // Bind the handler once for proper cleanup
    this.boundMouseUpHandler = this.handleMouseUp.bind(this);
    
    // Inject styles for text highlights
    this.injectStyles();
    
    // Check if extension is enabled for current domain
    const isExtensionEnabled = await this.checkExtensionEnabled();
    
    if (isExtensionEnabled) {
      this.enable();
    }
    
    console.log('[TextSelector] Initialized. Enabled:', isExtensionEnabled);
  },
  
  /**
   * Check if extension is enabled from storage
   * @returns {Promise<boolean>}
   */
  async checkExtensionEnabled() {
    try {
      const currentDomain = window.location.hostname;
      const storageKey = `isExtensionEnabledFor_${currentDomain}`;
      const result = await chrome.storage.local.get([storageKey]);
      return result[storageKey] ?? true; // Default to true
    } catch (error) {
      console.error('[TextSelector] Error checking extension state:', error);
      return true;
    }
  },
  
  /**
   * Enable text selector
   */
  enable() {
    if (this.isEnabled) return;
    
    this.isEnabled = true;
    document.addEventListener('mouseup', this.boundMouseUpHandler);
    console.log('[TextSelector] Enabled');
  },
  
  /**
   * Disable text selector
   */
  disable() {
    if (!this.isEnabled) return;
    
    this.isEnabled = false;
    document.removeEventListener('mouseup', this.boundMouseUpHandler);
    console.log('[TextSelector] Disabled');
  },
  
  /**
   * Handle mouse up event (after text selection)
   * @param {MouseEvent} event
   */
  handleMouseUp(event) {
    // CRITICAL: Check if feature is enabled
    if (!this.isEnabled) {
      return;
    }
    
    // Don't process clicks on our own UI elements
    if (event.target.closest('.vocab-helper-panel') ||
        event.target.closest('.vocab-text-highlight') ||
        event.target.closest('.vocab-word-highlight')) {
      return;
    }
    
    // Small delay to ensure selection is complete
    setTimeout(() => {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();
      
      // Check if text was selected
      if (!selectedText || selectedText.length === 0) {
        return;
      }
      
      // Must have at least one space (to differentiate from single words)
      // Or be longer than typical word length
      if (!(/\s/.test(selectedText)) && selectedText.length < 15) {
        return; // Let WordSelector handle single words
      }
      
      // Check if text has at least 3 words
      const wordCount = selectedText.split(/\s+/).filter(word => word.length > 0).length;
      if (wordCount < 3) {
        console.log('[TextSelector] Not enough words selected:', wordCount);
        this.showNotification("Select atleast 3 words");
        selection.removeAllRanges();
        return;
      }
      
      // Get the range and validate
      if (selection.rangeCount === 0) {
        return;
      }
      
      const range = selection.getRangeAt(0);
      
      // Check if this exact text is already selected
      const textKey = this.getTextKey(selectedText);
      if (this.selectedTexts.has(textKey)) {
        console.log('[TextSelector] Text already selected');
        selection.removeAllRanges();
        return;
      }
      
      // Check if the range overlaps with any existing highlight (text or words)
      if (this.hasOverlap(range)) {
        console.log('[TextSelector] Selection overlaps with existing highlight');
        this.showNotification("Can't select an already selected text");
        selection.removeAllRanges();
        return;
      }
      
      // Add text to selected set with range for position tracking (O(1) operation)
      this.addText(selectedText, range);
      
      // Highlight the text
      this.highlightRange(range, selectedText);
      
      // Clear the selection
      selection.removeAllRanges();
      
      console.log('[TextSelector] Text selected:', selectedText.substring(0, 50) + '...');
      console.log('[TextSelector] Total selected texts:', this.selectedTexts.size);
    }, 10);
  },
  
  /**
   * Check if a range overlaps with any existing text highlights
   * (Word selections and text selections are independent)
   * @param {Range} range - The range to check
   * @returns {boolean} True if overlap detected
   */
  hasOverlap(range) {
    // Get all existing text highlight elements (only check text, not words)
    const existingTextHighlights = document.querySelectorAll('.vocab-text-highlight');
    
    for (const highlight of existingTextHighlights) {
      // Create a range for the existing highlight
      const highlightRange = document.createRange();
      try {
        highlightRange.selectNodeContents(highlight);
        
        // Check if ranges intersect
        // Ranges overlap if: (start1 < end2) AND (start2 < end1)
        const rangesIntersect = 
          range.compareBoundaryPoints(Range.START_TO_END, highlightRange) > 0 &&
          range.compareBoundaryPoints(Range.END_TO_START, highlightRange) < 0;
        
        if (rangesIntersect) {
          return true; // Overlap detected
        }
      } catch (error) {
        console.warn('[TextSelector] Error checking text highlight overlap:', error);
      }
    }
    
    return false; // No overlap
  },
  
  /**
   * Show notification banner at top right corner
   * @param {string} message - Message to display
   */
  showNotification(message) {
    // Check if notification already exists
    const existingNotification = document.getElementById('vocab-text-selector-notification');
    if (existingNotification) {
      existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.id = 'vocab-text-selector-notification';
    notification.className = 'vocab-notification';
    
    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'vocab-notification-close';
    closeBtn.setAttribute('aria-label', 'Close notification');
    closeBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 3L3 9M3 3l6 6" stroke="#9527F5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    
    // Close button click handler
    closeBtn.addEventListener('click', () => {
      notification.classList.remove('visible');
      setTimeout(() => {
        notification.remove();
      }, 300);
    });
    
    // Create message text
    const messageText = document.createElement('span');
    messageText.className = 'vocab-notification-message';
    messageText.textContent = message;
    
    // Append close button and message
    notification.appendChild(closeBtn);
    notification.appendChild(messageText);
    
    // Add to body
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => {
      notification.classList.add('visible');
    }, 10);
    
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      notification.classList.remove('visible');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  },
  
  /**
   * Get a unique key for the text (normalized)
   * @param {string} text - The text
   * @returns {string}
   */
  getTextKey(text) {
    return text.toLowerCase().replace(/\s+/g, ' ').trim();
  },
  
  /**
   * Calculate text position in document (approximate position in plain text)
   * @param {Range} range - The range to calculate position for
   * @returns {{textStartIndex: number, textLength: number, text: string}}
   */
  calculateTextPosition(range) {
    const text = range.toString();
    const textLength = text.length;
    
    // Get the full text content of the body up to the start of the range
    const bodyText = document.body.innerText || document.body.textContent || '';
    
    // Find the approximate position by searching for the text in the body
    // This is approximate as we're using innerText which may differ from actual positions
    const rangeText = range.toString();
    const textStartIndex = bodyText.indexOf(rangeText);
    
    return {
      textStartIndex: textStartIndex >= 0 ? textStartIndex : 0,
      textLength: textLength,
      text: text
    };
  },
  
  /**
   * Add a text to the selected texts set
   * @param {string} text - The text to add
   * @param {Range} range - The range object (optional, for position tracking)
   */
  addText(text, range = null) {
    const textKey = this.getTextKey(text);
    this.selectedTexts.add(textKey); // O(1) operation
    
    // Store position information if range is provided
    if (range) {
      const positionData = this.calculateTextPosition(range);
      this.textPositions.set(textKey, positionData);
    }
    
    // Update button states
    ButtonPanel.updateButtonStatesFromSelections();
  },
  
  /**
   * Remove a text from the selected texts set
   * @param {string} text - The text to remove
   */
  removeText(text) {
    const textKey = this.getTextKey(text);
    
    // Get the highlight for this text
    const highlight = this.textToHighlights.get(textKey);
    
    if (highlight) {
      // Remove highlight element
      this.removeHighlight(highlight);
      
      // Clean up the mapping
      this.textToHighlights.delete(textKey); // O(1) operation
    }
    
    // Remove from selected texts set
    this.selectedTexts.delete(textKey); // O(1) operation
    
    // Clean up position data
    this.textPositions.delete(textKey);
    
    console.log('[TextSelector] Text removed');
    console.log('[TextSelector] Remaining selected texts:', this.selectedTexts.size);
    
    // Update button states
    ButtonPanel.updateButtonStatesFromSelections();
  },
  
  /**
   * Highlight a range with a styled span
   * @param {Range} range - The range to highlight
   * @param {string} text - The text being highlighted
   */
  highlightRange(range, text) {
    const textKey = this.getTextKey(text);
    
    // Create highlight wrapper
    const highlight = document.createElement('span');
    highlight.className = 'vocab-text-highlight';
    highlight.setAttribute('data-text-key', textKey);
    highlight.setAttribute('data-highlight-id', `text-highlight-${this.highlightIdCounter++}`);
    
    // Wrap the selected range FIRST
    try {
      range.surroundContents(highlight);
    } catch (error) {
      // If surroundContents fails (e.g., partial selection), use extractContents
      console.warn('[TextSelector] Could not highlight range:', error);
      const contents = range.extractContents();
      highlight.appendChild(contents);
      range.insertNode(highlight);
    }
    
    // Create and append remove button AFTER wrapping the content
    const removeBtn = this.createRemoveButton(text);
    highlight.appendChild(removeBtn);
    
    // Store the highlight in our map (O(1) operation)
    this.textToHighlights.set(textKey, highlight);
  },
  
  /**
   * Create a remove button for the highlight
   * @param {string} text - The text this button will remove
   * @returns {HTMLElement}
   */
  createRemoveButton(text) {
    const btn = document.createElement('button');
    btn.className = 'vocab-text-remove-btn';
    btn.setAttribute('aria-label', `Remove highlight for selected text`);
    btn.innerHTML = this.createCloseIcon();
    
    // Add click handler
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.removeText(text);
    });
    
    return btn;
  },
  
  /**
   * Create close/cross icon SVG - White cross on purple background
   * @returns {string} SVG markup
   */
  createCloseIcon() {
    return `
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 2L8 8M8 2L2 8" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  },
  
  /**
   * Remove a highlight element and restore original text
   * @param {HTMLElement} highlight - The highlight element to remove
   */
  removeHighlight(highlight) {
    const parent = highlight.parentNode;
    if (!parent) return;
    
    // Remove the button first
    const btn = highlight.querySelector('.vocab-text-remove-btn');
    if (btn) {
      btn.remove();
    }
    
    // Move all child nodes back to parent
    while (highlight.firstChild) {
      parent.insertBefore(highlight.firstChild, highlight);
    }
    
    // Remove the empty highlight span
    highlight.remove();
    
    // Normalize the parent to merge adjacent text nodes
    parent.normalize();
  },
  
  /**
   * Get all selected texts
   * @returns {Set<string>}
   */
  getSelectedTexts() {
    return new Set(this.selectedTexts); // Return a copy
  },
  
  /**
   * Clear all selections
   */
  clearAll() {
    // Remove all highlights
    this.textToHighlights.forEach((highlight) => {
      this.removeHighlight(highlight);
    });
    
    // Clear data structures (O(1) for Set clear)
    this.selectedTexts.clear();
    this.textToHighlights.clear();
    
    console.log('[TextSelector] All selections cleared');
    
    // Update button states
    ButtonPanel.updateButtonStatesFromSelections();
  },
  
  /**
   * Move text from selectedTexts to askedTexts
   * @param {string} textKey - The text key
   * @returns {boolean} Success status
   */
  moveToAskedTexts(textKey) {
    const highlight = this.textToHighlights.get(textKey);
    
    if (!highlight) {
      console.warn('[TextSelector] No highlight found for textKey:', textKey);
      return false;
    }
    
    // Get the original text
    const originalText = highlight.textContent.replace(/\s+/g, ' ').trim();
    
    // Remove from selectedTexts
    this.selectedTexts.delete(textKey);
    
    // Move to askedTexts
    this.askedTexts.set(textKey, {
      text: originalText,
      textKey: textKey,
      highlight: highlight
    });
    
    // Remove existing button (purple cross)
    const existingBtn = highlight.querySelector('.vocab-text-remove-btn');
    if (existingBtn) {
      existingBtn.remove();
    }
    
    // Remove underline by changing text-decoration to none
    highlight.style.textDecoration = 'none';
    
    // Add chat icon button (green color)
    const chatBtn = this.createChatButton(textKey, true); // true = green color
    highlight.appendChild(chatBtn);
    
    // Pulsate the text once with green color
    this.pulsateText(highlight, true); // true = green pulsate
    
    // Update button states
    ButtonPanel.updateButtonStatesFromSelections();
    
    console.log('[TextSelector] Text moved to askedTexts:', textKey);
    return true;
  },
  
  /**
   * Remove text from askedTexts and restore to normal
   * @param {string} textKey - The text key
   */
  removeFromAskedTexts(textKey) {
    const askedData = this.askedTexts.get(textKey);
    
    if (!askedData) {
      console.warn('[TextSelector] No asked text found for textKey:', textKey);
      return;
    }
    
    const highlight = askedData.highlight;
    
    // Remove chat button
    const chatBtn = highlight.querySelector('.vocab-text-chat-btn');
    if (chatBtn) {
      chatBtn.remove();
    }
    
    // Remove highlight completely
    this.removeHighlight(highlight);
    
    // Remove from askedTexts
    this.askedTexts.delete(textKey);
    
    console.log('[TextSelector] Text removed from askedTexts:', textKey);
  },
  
  /**
   * Create a chat button for the highlight
   * @param {string} textKey - The text key
   * @param {boolean} isGreen - Whether to use green color (default: false for purple)
   * @returns {HTMLElement}
   */
  createChatButton(textKey, isGreen = false) {
    const btn = document.createElement('button');
    btn.className = isGreen ? 'vocab-text-chat-btn vocab-text-chat-btn-green' : 'vocab-text-chat-btn';
    btn.setAttribute('aria-label', 'Open chat');
    btn.innerHTML = this.createChatIcon(isGreen);
    
    // Add click handler
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Get text from askedTexts or textToHighlights
      const askedData = this.askedTexts.get(textKey);
      const highlight = askedData ? askedData.highlight : this.textToHighlights.get(textKey);
      
      if (highlight) {
        // Use green pulsate if it's a green icon (from askedTexts)
        this.pulsateText(highlight, isGreen);
        
        // Open chat dialog
        const originalText = highlight.textContent.replace(/\s+/g, ' ').trim();
        ChatDialog.open(originalText, textKey);
      }
    });
    
    return btn;
  },
  
  /**
   * Create chat icon SVG - Solid circle with white chat icon (bigger)
   * @param {boolean} isGreen - Whether to use green color (default: false for purple)
   * @returns {string} SVG markup
   */
  createChatIcon(isGreen = false) {
    const color = isGreen ? '#22c55e' : '#9527F5';
    return `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="10" r="9" fill="${color}"/>
        <path d="M10 5C7.239 5 5 6.959 5 9.375C5 10.681 5.494 11.9 6.348 12.856L5.244 14.746C5.164 14.89 5.164 15.069 5.244 15.214C5.325 15.358 5.499 15.451 5.681 15.451C5.741 15.451 5.801 15.439 5.858 15.415L8.071 14.464C8.904 14.656 9.818 14.75 10.75 14.75C13.511 14.75 15.75 12.791 15.75 10.375C15.75 7.959 13.511 5 10 5Z" fill="white"/>
        <circle cx="7.5" cy="9.75" r="1" fill="${color}"/>
        <circle cx="10" cy="9.75" r="1" fill="${color}"/>
        <circle cx="12.5" cy="9.75" r="1" fill="${color}"/>
      </svg>
    `;
  },
  
  /**
   * Create book icon button for simplified texts
   * @param {string} textKey - The text key
   * @returns {HTMLElement}
   */
  createBookButton(textKey) {
    const btn = document.createElement('button');
    btn.className = 'vocab-text-book-btn';
    btn.setAttribute('aria-label', 'View simplified text');
    btn.innerHTML = this.createBookIcon();
    
    // Add click handler (to be implemented later)
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // TODO: Implement book icon click handler
      console.log('[TextSelector] Book icon clicked for:', textKey);
      
      // Get simplified text data
      const simplifiedData = this.simplifiedTexts.get(textKey);
      if (simplifiedData) {
        console.log('[TextSelector] Simplified text:', simplifiedData.simplifiedText);
        // Pulsate the text
        const highlight = this.textToHighlights.get(textKey);
        if (highlight) {
          this.pulsateText(highlight, true);
        }
      }
    });
    
    return btn;
  },
  
  /**
   * Create book icon SVG - Wireframe open book icon with thick green lines
   * @returns {string} SVG markup
   */
  createBookIcon() {
    return `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 19.5C4 18.837 4.526 18 5.5 18H11M20 19.5C20 18.837 19.474 18 18.5 18H13" stroke="#22c55e" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 18V6M12 6C12 6 10 4 6.5 4C4.5 4 4 5 4 6V18C4 18 4.5 18 6.5 18C10 18 12 18 12 18M12 6C12 6 14 4 17.5 4C19.5 4 20 5 20 6V18C20 18 19.5 18 17.5 18C14 18 12 18 12 18" stroke="#22c55e" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  },
  
  /**
   * Pulsate text highlight with color (green for asked texts, purple for selected)
   * @param {HTMLElement} highlight - The highlight element
   * @param {boolean} isGreen - Whether to use green color (default: false for purple)
   */
  pulsateText(highlight, isGreen = false) {
    // Add appropriate pulsate class
    const className = isGreen ? 'vocab-text-pulsate-green' : 'vocab-text-pulsate';
    highlight.classList.add(className);
    
    // Remove class after animation completes (0.6s)
    setTimeout(() => {
      highlight.classList.remove(className);
    }, 600);
  },
  
  /**
   * Inject CSS styles for text highlights
   */
  injectStyles() {
    const styleId = 'vocab-text-selector-styles';
    
    // Check if styles already injected
    if (document.getElementById(styleId)) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Text highlight wrapper - Dashed underline that works across paragraphs */
      .vocab-text-highlight {
        position: relative;
        text-decoration-line: underline;
        text-decoration-style: dashed;
        text-decoration-color: #9527F5;
        text-decoration-thickness: 1px;
        text-underline-offset: 2px;
        cursor: text;
      }
      
      /* For block-level elements inside highlight, maintain underline */
      .vocab-text-highlight * {
        text-decoration: inherit;
        box-sizing: border-box;
      }
      
      /* Remove button - Solid purple circle with white cross on top-left */
      .vocab-text-remove-btn {
        position: absolute;
        top: -6px;
        left: -6px;
        width: 14px;
        height: 14px;
        background: #9527F5;
        border: none;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 0.9;
        transition: opacity 0.2s ease, transform 0.1s ease, background-color 0.2s ease;
        padding: 0;
        z-index: 999999;
        box-shadow: 0 2px 4px rgba(149, 39, 245, 0.4);
      }
      
      .vocab-text-highlight:hover .vocab-text-remove-btn {
        opacity: 1;
      }
      
      .vocab-text-remove-btn:hover {
        transform: scale(1.15);
        opacity: 1;
        background: #7a1fd9;
      }
      
      .vocab-text-remove-btn:active {
        transform: scale(0.95);
      }
      
      .vocab-text-remove-btn svg {
        pointer-events: none;
        display: block;
        width: 8px;
        height: 8px;
      }
      
      /* Chat button - Solid purple circle with white chat icon on top-left (bigger) */
      .vocab-text-chat-btn {
        position: absolute;
        top: -10px;
        left: -10px;
        width: 20px;
        height: 20px;
        background: transparent;
        border: none;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 0.95;
        transition: opacity 0.2s ease, transform 0.1s ease;
        padding: 0;
        z-index: 999999;
      }
      
      .vocab-text-highlight:hover .vocab-text-chat-btn {
        opacity: 1;
      }
      
      .vocab-text-chat-btn:hover {
        transform: scale(1.15);
        opacity: 1;
      }
      
      .vocab-text-chat-btn:active {
        transform: scale(0.95);
      }
      
      .vocab-text-chat-btn svg {
        pointer-events: none;
        display: block;
        width: 20px;
        height: 20px;
      }
      
      /* Book button - Wireframe open book icon on top-left */
      .vocab-text-book-btn {
        position: absolute;
        top: -12px;
        left: -12px;
        width: 24px;
        height: 24px;
        background: transparent;
        border: none;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 0.95;
        transition: opacity 0.2s ease, transform 0.15s ease;
        padding: 0;
        z-index: 999999;
      }
      
      .vocab-text-highlight:hover .vocab-text-book-btn {
        opacity: 1;
      }
      
      .vocab-text-book-btn:hover {
        transform: scale(1.1);
        opacity: 1;
      }
      
      .vocab-text-book-btn:active {
        transform: scale(0.9);
      }
      
      .vocab-text-book-btn svg {
        pointer-events: none;
        display: block;
        width: 24px;
        height: 24px;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
      }
      
      /* Light green dashed underline for simplified texts - same green as chat icon */
      .vocab-text-simplified {
        text-decoration-color: #22c55e !important;
        text-decoration-style: dashed !important;
        text-decoration-thickness: 1px !important;
      }
      
      /* Pulsate animation for text highlights - light purple */
      @keyframes vocab-text-pulsate {
        0% {
          background-color: transparent;
        }
        50% {
          background-color: rgba(149, 39, 245, 0.25);
        }
        100% {
          background-color: transparent;
        }
      }
      
      .vocab-text-pulsate {
        animation: vocab-text-pulsate 0.6s ease-in-out;
      }
      
      /* Loading animation - gentle breathing effect for readers (non-distracting) */
      @keyframes vocab-text-loading-breathe {
        0%, 100% {
          opacity: 0.5;
        }
        50% {
          opacity: 1;
        }
      }
      
      .vocab-text-loading {
        animation: vocab-text-loading-breathe 2.5s ease-in-out infinite;
      }
      
      /* Pulsate animation for text highlights - light green */
      @keyframes vocab-text-pulsate-green {
        0% {
          background-color: transparent;
        }
        50% {
          background-color: rgba(34, 197, 94, 0.25);
        }
        100% {
          background-color: transparent;
        }
      }
      
      .vocab-text-pulsate-green {
        animation: vocab-text-pulsate-green 0.6s ease-in-out;
      }
      
      /* Notification banner at top right */
      .vocab-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        color: #9527F5;
        padding: 12px 40px 12px 20px;
        border-radius: 12px;
        border: 1px solid #9527F5;
        font-size: 14px;
        font-weight: 500;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        box-shadow: 0 4px 12px rgba(149, 39, 245, 0.3);
        z-index: 9999999;
        opacity: 0;
        transform: translateX(400px);
        transition: opacity 0.3s ease, transform 0.3s ease;
        pointer-events: all;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .vocab-notification.visible {
        opacity: 1;
        transform: translateX(0);
      }
      
      /* Close button inside notification */
      .vocab-notification-close {
        position: absolute;
        left: 8px;
        top: 50%;
        transform: translateY(-50%);
        width: 20px;
        height: 20px;
        background: none;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 0.6;
        transition: opacity 0.2s ease, transform 0.1s ease;
        padding: 0;
      }
      
      .vocab-notification-close:hover {
        opacity: 1;
        transform: translateY(-50%) scale(1.1);
      }
      
      .vocab-notification-close:active {
        transform: translateY(-50%) scale(0.9);
      }
      
      .vocab-notification-close svg {
        pointer-events: none;
        display: block;
      }
      
      /* Notification message text */
      .vocab-notification-message {
        margin-left: 24px;
      }
    `;
    
    document.head.appendChild(style);
  }
};

// ===================================
// Drag Handle Module - Manages drag-and-drop functionality
// ===================================
const DragHandle = {
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,
  elementStartX: 0,
  elementStartY: 0,
  targetElement: null,
  handleElement: null,
  
  /**
   * Initialize drag handle
   * @param {HTMLElement} handle - The drag handle element
   * @param {HTMLElement} target - The element to be dragged
   */
  init(handle, target) {
    this.handleElement = handle;
    this.targetElement = target;
    
    // Attach event listeners
    this.handleElement.addEventListener('mousedown', this.onDragStart.bind(this));
    document.addEventListener('mousemove', this.onDragMove.bind(this));
    document.addEventListener('mouseup', this.onDragEnd.bind(this));
    
    // Touch events for mobile
    this.handleElement.addEventListener('touchstart', this.onTouchStart.bind(this));
    document.addEventListener('touchmove', this.onTouchMove.bind(this));
    document.addEventListener('touchend', this.onDragEnd.bind(this));
  },
  
  /**
   * Handle mouse drag start
   * @param {MouseEvent} e - Mouse event
   */
  onDragStart(e) {
    e.preventDefault();
    e.stopPropagation();
    
    this.isDragging = true;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    
    const rect = this.targetElement.getBoundingClientRect();
    this.elementStartX = rect.left;
    this.elementStartY = rect.top;
    
    // Add dragging visual feedback
    this.targetElement.style.transition = 'none';
    this.handleElement.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    
    // Disable pointer events on buttons to prevent hover tooltips during drag
    this.targetElement.style.pointerEvents = 'none';
    this.handleElement.style.pointerEvents = 'auto'; // Keep handle interactive
    
    // Remove any existing tooltips
    this.removeAllTooltips();
  },
  
  /**
   * Handle touch drag start
   * @param {TouchEvent} e - Touch event
   */
  onTouchStart(e) {
    const touch = e.touches[0];
    this.onDragStart({
      preventDefault: () => e.preventDefault(),
      stopPropagation: () => e.stopPropagation(),
      clientX: touch.clientX,
      clientY: touch.clientY
    });
  },
  
  /**
   * Handle drag move
   * @param {MouseEvent} e - Mouse event
   */
  onDragMove(e) {
    if (!this.isDragging) return;
    
    e.preventDefault();
    
    const deltaX = e.clientX - this.dragStartX;
    const deltaY = e.clientY - this.dragStartY;
    
    const newLeft = this.elementStartX + deltaX;
    const newTop = this.elementStartY + deltaY;
    
    // Apply constraints to keep panel within viewport
    const constraints = this.calculateConstraints();
    const constrainedLeft = Math.max(constraints.minX, Math.min(constraints.maxX, newLeft));
    const constrainedTop = Math.max(constraints.minY, Math.min(constraints.maxY, newTop));
    
    // Update position
    this.targetElement.style.left = `${constrainedLeft}px`;
    this.targetElement.style.top = `${constrainedTop}px`;
    this.targetElement.style.right = 'auto';
    this.targetElement.style.transform = 'none';
  },
  
  /**
   * Handle touch drag move
   * @param {TouchEvent} e - Touch event
   */
  onTouchMove(e) {
    if (!this.isDragging) return;
    const touch = e.touches[0];
    this.onDragMove({
      preventDefault: () => e.preventDefault(),
      clientX: touch.clientX,
      clientY: touch.clientY
    });
  },
  
  /**
   * Handle drag end
   */
  onDragEnd() {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    
    // Remove visual feedback
    this.handleElement.style.cursor = 'grab';
    document.body.style.userSelect = '';
    
    // Re-enable pointer events on buttons
    this.targetElement.style.pointerEvents = '';
    
    // Save position
    const rect = this.targetElement.getBoundingClientRect();
    PositionManager.savePosition({
      left: rect.left,
      top: rect.top
    });
  },
  
  /**
   * Calculate viewport constraints to keep panel fully visible
   * @returns {Object} Constraint boundaries
   */
  calculateConstraints() {
    const rect = this.targetElement.getBoundingClientRect();
    const minVisibleArea = rect.width * 0.8; // Keep 80% of the panel visible
    
    return {
      minX: -rect.width + minVisibleArea,
      maxX: window.innerWidth - minVisibleArea,
      minY: 0,
      maxY: window.innerHeight - rect.height
    };
  },
  
  /**
   * Apply saved position to target element
   * @param {Object} position - Position object {left, top}
   */
  applyPosition(position) {
    if (!position || !this.targetElement) return;
    
    this.targetElement.style.left = `${position.left}px`;
    this.targetElement.style.top = `${position.top}px`;
    this.targetElement.style.right = 'auto';
    this.targetElement.style.transform = 'none';
  },
  
  /**
   * Reset to default position
   */
  resetPosition() {
    this.targetElement.style.left = '';
    this.targetElement.style.top = '';
    this.targetElement.style.right = '0';
    this.targetElement.style.transform = '';
    PositionManager.clearPosition();
  },
  
  /**
   * Remove all visible tooltips
   */
  removeAllTooltips() {
    const tooltips = document.querySelectorAll('.vocab-btn-tooltip');
    tooltips.forEach(tooltip => tooltip.remove());
  }
};

// ===================================
// Chat Dialog Module - Manages the chat popup interface
// ===================================
const ChatDialog = {
  dialogContainer: null,
  isOpen: false,
  currentText: null,
  currentTextKey: null,
  chatHistory: [],
  
  /**
   * Initialize chat dialog
   */
  init() {
    console.log('[ChatDialog] Initializing...');
    this.injectStyles();
  },
  
  /**
   * Open chat dialog with selected text
   * @param {string} text - The selected text
   * @param {string} textKey - The text key for identification
   */
  open(text, textKey) {
    // If dialog is already open, close it first
    if (this.isOpen) {
      this.close();
      // Wait for close animation to complete
      setTimeout(() => {
        this.openDialog(text, textKey);
      }, 350);
    } else {
      this.openDialog(text, textKey);
    }
  },
  
  /**
   * Internal method to open dialog
   * @param {string} text - The selected text
   * @param {string} textKey - The text key for identification
   */
  openDialog(text, textKey) {
    this.currentText = text;
    this.currentTextKey = textKey;
    this.chatHistory = [];
    
    this.createDialog();
    this.show();
    
    console.log('[ChatDialog] Opened for text:', text.substring(0, 50) + '...');
  },
  
  /**
   * Close chat dialog
   */
  close() {
    if (!this.isOpen) return;
    
    this.hide();
    
    // Keep the chat icon on the text (don't remove it)
    // The text should remain in askedTexts container
    
    setTimeout(() => {
      if (this.dialogContainer) {
        this.dialogContainer.remove();
        this.dialogContainer = null;
      }
    }, 300); // Wait for slide-out animation
    
    this.isOpen = false;
    this.currentText = null;
    this.currentTextKey = null;
    this.chatHistory = [];
    
    console.log('[ChatDialog] Closed');
  },
  
  /**
   * Create dialog DOM structure
   */
  createDialog() {
    // Create main container
    this.dialogContainer = document.createElement('div');
    this.dialogContainer.id = 'vocab-chat-dialog';
    this.dialogContainer.className = 'vocab-chat-dialog';
    
    // Create dialog content
    const dialogContent = document.createElement('div');
    dialogContent.className = 'vocab-chat-content';
    
    // Create collapse button
    const collapseBtn = document.createElement('button');
    collapseBtn.className = 'vocab-chat-collapse-btn';
    collapseBtn.setAttribute('aria-label', 'Close chat');
    collapseBtn.innerHTML = this.createCollapseIcon();
    collapseBtn.addEventListener('click', () => this.close());
    
    // Create tabs
    const tabsContainer = this.createTabs();
    
    // Create content area
    const contentArea = document.createElement('div');
    contentArea.className = 'vocab-chat-content-area';
    
    // Create original text content (hidden by default)
    const originalTextContent = this.createOriginalTextContent();
    
    // Create ask/chat content (visible by default)
    const askContent = this.createAskContent();
    
    contentArea.appendChild(originalTextContent);
    contentArea.appendChild(askContent);
    
    // Create input area
    const inputArea = this.createInputArea();
    
    // Create resize handles
    const resizeHandles = this.createResizeHandles();
    
    // Assemble dialog
    dialogContent.appendChild(collapseBtn);
    dialogContent.appendChild(tabsContainer);
    dialogContent.appendChild(contentArea);
    dialogContent.appendChild(inputArea);
    
    this.dialogContainer.appendChild(dialogContent);
    this.dialogContainer.appendChild(resizeHandles.left);
    this.dialogContainer.appendChild(resizeHandles.bottom);
    this.dialogContainer.appendChild(resizeHandles.bottomLeft);
    
    document.body.appendChild(this.dialogContainer);
    
    // Initialize resize functionality
    this.initResize();
  },
  
  /**
   * Create resize handles
   */
  createResizeHandles() {
    const leftHandle = document.createElement('div');
    leftHandle.className = 'vocab-chat-resize-handle vocab-chat-resize-left';
    
    const bottomHandle = document.createElement('div');
    bottomHandle.className = 'vocab-chat-resize-handle vocab-chat-resize-bottom';
    
    const bottomLeftHandle = document.createElement('div');
    bottomLeftHandle.className = 'vocab-chat-resize-handle vocab-chat-resize-bottom-left';
    
    return {
      left: leftHandle,
      bottom: bottomHandle,
      bottomLeft: bottomLeftHandle
    };
  },
  
  /**
   * Initialize resize functionality
   */
  initResize() {
    let isResizing = false;
    let resizeType = null;
    let startX = 0;
    let startY = 0;
    let startWidth = 0;
    let startHeight = 0;
    
    const startResize = (e, type) => {
      isResizing = true;
      resizeType = type;
      startX = e.clientX;
      startY = e.clientY;
      
      const rect = this.dialogContainer.getBoundingClientRect();
      startWidth = rect.width;
      startHeight = rect.height;
      
      e.preventDefault();
      document.body.style.userSelect = 'none';
    };
    
    const resize = (e) => {
      if (!isResizing) return;
      
      const deltaX = startX - e.clientX; // Inverted for right-side panel
      const deltaY = e.clientY - startY;
      
      if (resizeType === 'left' || resizeType === 'bottom-left') {
        const newWidth = Math.max(300, Math.min(800, startWidth + deltaX));
        this.dialogContainer.style.width = `${newWidth}px`;
      }
      
      if (resizeType === 'bottom' || resizeType === 'bottom-left') {
        const newHeight = Math.max(400, Math.min(window.innerHeight * 0.9, startHeight + deltaY));
        this.dialogContainer.style.height = `${newHeight}px`;
      }
    };
    
    const stopResize = () => {
      if (!isResizing) return;
      
      isResizing = false;
      resizeType = null;
      document.body.style.userSelect = '';
    };
    
    // Attach event listeners to resize handles
    const leftHandle = this.dialogContainer.querySelector('.vocab-chat-resize-left');
    const bottomHandle = this.dialogContainer.querySelector('.vocab-chat-resize-bottom');
    const bottomLeftHandle = this.dialogContainer.querySelector('.vocab-chat-resize-bottom-left');
    
    leftHandle.addEventListener('mousedown', (e) => startResize(e, 'left'));
    bottomHandle.addEventListener('mousedown', (e) => startResize(e, 'bottom'));
    bottomLeftHandle.addEventListener('mousedown', (e) => startResize(e, 'bottom-left'));
    
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResize);
  },
  
  /**
   * Create tabs section
   */
  createTabs() {
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'vocab-chat-tabs';
    
    const originalTextTab = document.createElement('button');
    originalTextTab.className = 'vocab-chat-tab';
    originalTextTab.setAttribute('data-tab', 'original-text');
    originalTextTab.textContent = 'ORIGINAL TEXT';
    originalTextTab.addEventListener('click', () => this.switchTab('original-text'));
    
    const askTab = document.createElement('button');
    askTab.className = 'vocab-chat-tab active';
    askTab.setAttribute('data-tab', 'ask');
    askTab.textContent = 'CHAT';
    askTab.addEventListener('click', () => this.switchTab('ask'));
    
    // Create sliding indicator
    const indicator = document.createElement('div');
    indicator.className = 'vocab-chat-tab-indicator';
    indicator.id = 'vocab-chat-tab-indicator';
    
    tabsContainer.appendChild(originalTextTab);
    tabsContainer.appendChild(askTab);
    tabsContainer.appendChild(indicator);
    
    // Set initial indicator position after a brief delay to let tabs render
    setTimeout(() => {
      this.updateIndicatorPosition();
    }, 50);
    
    return tabsContainer;
  },
  
  /**
   * Create original text content
   */
  createOriginalTextContent() {
    const content = document.createElement('div');
    content.className = 'vocab-chat-tab-content';
    content.setAttribute('data-content', 'original-text');
    content.style.display = 'none';
    
    // Create focus button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'vocab-chat-focus-btn-container';
    
    // Create focus button
    const focusButton = document.createElement('button');
    focusButton.className = 'vocab-chat-focus-btn';
    focusButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 10l7-7v4c7 0 7 6 7 6s-3-3-7-3v4l-7-7z" fill="#9527F5"/>
      </svg>
      <span>Focus</span>
    `;
    
    // Add click handler
    focusButton.addEventListener('click', () => {
      const highlight = TextSelector.textToHighlights.get(this.currentTextKey);
      if (highlight) {
        highlight.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
        setTimeout(() => {
          TextSelector.pulsateText(highlight, true);
        }, 500);
      }
    });
    
    buttonContainer.appendChild(focusButton);
    
    // Create text display
    const textDisplay = document.createElement('div');
    textDisplay.className = 'vocab-chat-original-text';
    textDisplay.textContent = this.currentText || '';
    
    content.appendChild(buttonContainer);
    content.appendChild(textDisplay);
    
    return content;
  },
  
  /**
   * Create ask/chat content
   */
  createAskContent() {
    const content = document.createElement('div');
    content.className = 'vocab-chat-tab-content active';
    content.setAttribute('data-content', 'ask');
    
    // Create chat messages container
    const chatContainer = document.createElement('div');
    chatContainer.className = 'vocab-chat-messages';
    chatContainer.id = 'vocab-chat-messages';
    
    // Show "Ask your doubt" message
    const noChatsMsg = document.createElement('div');
    noChatsMsg.className = 'vocab-chat-no-messages';
    noChatsMsg.innerHTML = `
      <div class="vocab-chat-no-messages-content">
        ${this.createChatEmptyIcon()}
        <span>Ask your doubt</span>
      </div>
    `;
    chatContainer.appendChild(noChatsMsg);
    
    content.appendChild(chatContainer);
    
    return content;
  },
  
  /**
   * Create input area
   */
  createInputArea() {
    const inputArea = document.createElement('div');
    inputArea.className = 'vocab-chat-input-area';
    
    const inputField = document.createElement('textarea');
    inputField.className = 'vocab-chat-input';
    inputField.id = 'vocab-chat-input';
    inputField.placeholder = 'Type your question here ...';
    inputField.rows = 1;
    
    // Auto-resize textarea
    inputField.addEventListener('input', (e) => {
      e.target.style.height = 'auto';
      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
    });
    
    // Handle Enter key (Shift+Enter for new line)
    inputField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
    
    // Create delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'vocab-chat-delete-conversation-btn';
    deleteBtn.id = 'vocab-chat-delete-conversation-btn';
    deleteBtn.setAttribute('aria-label', 'Delete conversation');
    deleteBtn.title = 'Delete conversation';
    deleteBtn.innerHTML = this.createTrashIcon();
    deleteBtn.style.display = 'none'; // Hidden by default
    deleteBtn.addEventListener('click', () => this.deleteConversation());
    
    const sendBtn = document.createElement('button');
    sendBtn.className = 'vocab-chat-send-btn';
    sendBtn.setAttribute('aria-label', 'Send message');
    sendBtn.innerHTML = this.createSendIcon();
    sendBtn.addEventListener('click', () => this.sendMessage());
    
    inputArea.appendChild(inputField);
    inputArea.appendChild(sendBtn);
    inputArea.appendChild(deleteBtn);
    
    return inputArea;
  },
  
  /**
   * Switch between tabs
   * @param {string} tabName - Tab name ('original-text' or 'ask')
   */
  switchTab(tabName) {
    // Update tab buttons
    const tabs = this.dialogContainer.querySelectorAll('.vocab-chat-tab');
    tabs.forEach(tab => {
      if (tab.getAttribute('data-tab') === tabName) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
    
    // Update indicator position
    this.updateIndicatorPosition();
    
    // Update content areas with sliding animation
    const contents = this.dialogContainer.querySelectorAll('.vocab-chat-tab-content');
    contents.forEach(content => {
      if (content.getAttribute('data-content') === tabName) {
        // Slide in the new content
        content.style.display = 'flex';
        content.classList.remove('slide-out-left', 'slide-out-right');
        content.classList.add('active', 'slide-in');
        
        // Remove animation class after animation completes
        setTimeout(() => {
          content.classList.remove('slide-in');
        }, 300);
      } else {
        // Slide out the old content
        content.classList.remove('active', 'slide-in');
        content.classList.add('slide-out-right');
        
        // Hide after animation completes
        setTimeout(() => {
          content.style.display = 'none';
          content.classList.remove('slide-out-right');
        }, 300);
      }
    });
  },
  
  /**
   * Update indicator position to match active tab
   */
  updateIndicatorPosition() {
    const indicator = document.getElementById('vocab-chat-tab-indicator');
    if (!indicator) return;
    
    const activeTab = this.dialogContainer.querySelector('.vocab-chat-tab.active');
    if (!activeTab) return;
    
    const tabsContainer = activeTab.parentElement;
    const containerRect = tabsContainer.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();
    
    // Calculate position relative to container
    const left = tabRect.left - containerRect.left;
    const width = tabRect.width;
    
    // Update indicator position and width
    indicator.style.left = `${left}px`;
    indicator.style.width = `${width}px`;
  },
  
  /**
   * Send message in chat
   */
  async sendMessage() {
    const inputField = document.getElementById('vocab-chat-input');
    const message = inputField.value.trim();
    
    if (!message) return;
    
    // Auto-switch to chat tab if on original text tab
    this.switchTab('ask');
    
    // Add user message to chat
    this.addMessageToChat('user', message);
    
    // Clear input
    inputField.value = '';
    inputField.style.height = 'auto';
    
    // Show loading animation
    this.showLoadingAnimation();
    
    // Prepare chat history from chatHistory
    const chat_history = this.chatHistory.map(item => ({
      role: item.type === 'user' ? 'user' : 'assistant',
      content: item.message
    }));
    
    try {
      // Call API
      const response = await ApiService.ask({
        initial_context: this.currentText,
        chat_history: chat_history,
        question: message
      });
      
      // Remove loading animation
      this.removeLoadingAnimation();
      
      if (response.success) {
        console.log('[ChatDialog] API response data:', response.data);
        
        // Extract the latest assistant response from chat_history
        const chatHistory = response.data.chat_history || [];
        
        console.log('[ChatDialog] Chat history from API:', chatHistory);
        
        // Find the last assistant message (the latest AI response)
        let aiResponse = 'No response received';
        for (let i = chatHistory.length - 1; i >= 0; i--) {
          if (chatHistory[i].role === 'assistant') {
            aiResponse = chatHistory[i].content;
            break;
          }
        }
        
        console.log('[ChatDialog] Extracted AI response:', aiResponse);
        this.addMessageToChat('ai', aiResponse);
      } else {
        // Show error message with preserved formatting
        this.addMessageToChat('ai', `⚠️ **Error:**\n\n${response.error}`);
      }
    } catch (error) {
      console.error('[ChatDialog] Error sending message:', error);
      this.removeLoadingAnimation();
      this.addMessageToChat('ai', `Error: Failed to get response from server`);
    }
    
    console.log('[ChatDialog] Message sent:', message);
  },
  
  /**
   * Add message to chat
   * @param {string} type - 'user' or 'ai'
   * @param {string} message - Message content
   */
  addMessageToChat(type, message) {
    const chatContainer = document.getElementById('vocab-chat-messages');
    
    // Remove "Ask your doubt" message if exists
    const noChatsMsg = chatContainer.querySelector('.vocab-chat-no-messages');
    if (noChatsMsg) {
      noChatsMsg.remove();
    }
    
    // Create message bubble
    const messageBubble = document.createElement('div');
    messageBubble.className = `vocab-chat-message vocab-chat-message-${type}`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'vocab-chat-message-content';
    
    // For AI messages, render markdown
    if (type === 'ai') {
      messageContent.innerHTML = this.renderMarkdown(message);
    } else {
      messageContent.textContent = message;
    }
    
    messageBubble.appendChild(messageContent);
    chatContainer.appendChild(messageBubble);
    
    // Show global clear button
    this.updateGlobalClearButton();
    
    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    // Store in history
    this.chatHistory.push({ type, message, timestamp: Date.now() });
  },
  
  /**
   * Show loading animation (three dots waving)
   */
  showLoadingAnimation() {
    const chatContainer = document.getElementById('vocab-chat-messages');
    
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'vocab-chat-typing-indicator';
    loadingIndicator.id = 'vocab-chat-loading';
    loadingIndicator.innerHTML = `
      <span></span>
      <span></span>
      <span></span>
    `;
    
    chatContainer.appendChild(loadingIndicator);
    
    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
  },
  
  /**
   * Remove loading animation
   */
  removeLoadingAnimation() {
    const loadingBubble = document.getElementById('vocab-chat-loading');
    if (loadingBubble) {
      loadingBubble.remove();
    }
  },
  
  /**
   * Simple markdown renderer
   * @param {string} text - Markdown text
   * @returns {string} HTML string
   */
  renderMarkdown(text) {
    if (!text) return '';
    
    let html = text;
    
    // Escape HTML first
    html = html.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;');
    
    // Code blocks (```)
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
    
    // Inline code (`)
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Bold (**text** or __text__)
    html = html.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    
    // Italic (*text* or _text_)
    html = html.replace(/\*([^\*]+)\*/g, '<em>$1</em>');
    html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
    
    // Links [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    // Headings
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    
    // Line breaks
    html = html.replace(/\n\n/g, '<br><br>');
    html = html.replace(/\n/g, '<br>');
    
    // Lists
    html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    
    // Wrap consecutive <li> in <ul>
    html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
    
    return html;
  },
  
  /**
   * Clear chat history
   */
  clearChat() {
    const chatContainer = document.getElementById('vocab-chat-messages');
    chatContainer.innerHTML = '';
    
    // Show "No chats yet" message
    const noChatsMsg = document.createElement('div');
    noChatsMsg.className = 'vocab-chat-no-messages';
    noChatsMsg.innerHTML = `
      <div class="vocab-chat-no-messages-content">
        ${this.createChatEmptyIcon()}
        <span>Ask your doubt</span>
      </div>
    `;
    chatContainer.appendChild(noChatsMsg);
    
    this.chatHistory = [];
    
    // Hide global clear button
    this.updateGlobalClearButton();
    
    console.log('[ChatDialog] Chat cleared');
  },
  
  /**
   * Update visibility of delete conversation button
   */
  updateGlobalClearButton() {
    const deleteBtn = document.getElementById('vocab-chat-delete-conversation-btn');
    if (!deleteBtn) return;
    
    // Show button only if there are messages
    if (this.chatHistory.length > 0) {
      deleteBtn.style.display = 'flex';
    } else {
      deleteBtn.style.display = 'none';
    }
  },
  
  /**
   * Show dialog
   */
  show() {
    if (this.dialogContainer) {
      this.isOpen = true;
      setTimeout(() => {
        this.dialogContainer.classList.add('visible');
      }, 10);
    }
  },
  
  /**
   * Hide dialog
   */
  hide() {
    if (this.dialogContainer) {
      this.dialogContainer.classList.remove('visible');
    }
  },
  
  /**
   * Create collapse icon (left arrow)
   */
  createCollapseIcon() {
    return `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.5 15L7.5 10L12.5 5" stroke="#9527F5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  },
  
  /**
   * Create delete icon
   */
  createDeleteIcon() {
    return `
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2.25 4.5h13.5M6 4.5V3a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 12 3v1.5m2.25 0v10.5a1.5 1.5 0 0 1-1.5 1.5h-7.5a1.5 1.5 0 0 1-1.5-1.5V4.5h10.5Z" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M7.5 8.25v4.5M10.5 8.25v4.5" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  },
  
  /**
   * Delete the entire conversation and remove the asked text
   */
  deleteConversation() {
    if (!this.currentTextKey) return;
    
    // Close the dialog
    this.close();
    
    // Remove the text from askedTexts and clear the highlight
    setTimeout(() => {
      TextSelector.removeFromAskedTexts(this.currentTextKey);
    }, 300);
    
    console.log('[ChatDialog] Conversation deleted');
  },
  
  /**
   * Create send icon (up arrow) - purple color for wireframe button
   */
  createSendIcon() {
    return `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 15V5M10 5L5 10M10 5L15 10" stroke="#9527F5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  },
  
  /**
   * Create trash icon - red color for wireframe button
   */
  createTrashIcon() {
    return `
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2.25 4.5h13.5M6 4.5V3a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 12 3v1.5m2.25 0v10.5a1.5 1.5 0 0 1-1.5 1.5h-7.5a1.5 1.5 0 0 1-1.5-1.5V4.5h10.5Z" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M7.5 8.25v4.5M10.5 8.25v4.5" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  },
  
  /**
   * Create chat empty icon (professional purple)
   */
  createChatEmptyIcon() {
    return `
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Background Circle -->
        <circle cx="32" cy="32" r="30" fill="#f3e8ff" stroke="#9527F5" stroke-width="2"/>
        
        <!-- Chat Bubble -->
        <path d="M32 16C22.059 16 14 22.925 14 31.5C14 35.635 15.785 39.44 18.667 42.385L14.879 48.879C14.585 49.464 14.585 50.166 14.879 50.754C15.17 51.339 15.791 51.702 16.451 51.702C16.67 51.702 16.889 51.657 17.099 51.564L24.371 48.133C26.735 48.7 29.281 49 32 49C41.941 49 50 43.075 50 34.5C50 25.925 41.941 16 32 16Z" fill="#9527F5"/>
        
        <!-- Message Dots -->
        <circle cx="24" cy="34.5" r="2" fill="white"/>
        <circle cx="32" cy="34.5" r="2" fill="white"/>
        <circle cx="40" cy="34.5" r="2" fill="white"/>
        
        <!-- Decorative Elements -->
        <circle cx="46" cy="20" r="3" fill="#D097FF" opacity="0.6"/>
        <circle cx="18" cy="18" r="2" fill="#D097FF" opacity="0.4"/>
        <circle cx="48" cy="46" r="2.5" fill="#D097FF" opacity="0.5"/>
      </svg>
    `;
  },
  
  /**
   * Inject styles for chat dialog
   */
  injectStyles() {
    const styleId = 'vocab-chat-dialog-styles';
    
    if (document.getElementById(styleId)) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Chat Dialog Container */
      .vocab-chat-dialog {
        position: fixed;
        right: 0;
        top: 50%;
        transform: translateY(-50%) translateX(100%);
        width: 400px;
        max-width: 90vw;
        height: 600px;
        max-height: 80vh;
        z-index: 1000000;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        user-select: none;  /* Disable text selection in popup */
      }
      
      .vocab-chat-dialog.visible {
        transform: translateY(-50%) translateX(0);
      }
      
      /* Dialog Content */
      .vocab-chat-content {
        background: white;
        height: 100%;
        border-radius: 16px 0 0 16px;
        box-shadow: -4px 0 24px rgba(149, 39, 245, 0.2), -2px 0 12px rgba(149, 39, 245, 0.1);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        position: relative;
      }
      
      /* Collapse Button */
      .vocab-chat-collapse-btn {
        position: absolute;
        top: 16px;
        left: 16px;
        width: 32px;
        height: 32px;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 10;
        transition: all 0.2s ease;
        margin-bottom: 8px;
      }
      
      .vocab-chat-collapse-btn:hover {
        background: #f9fafb;
        border-color: #9527F5;
      }
      
      /* Flip collapse icon when dialog is visible */
      .vocab-chat-dialog.visible .vocab-chat-collapse-btn svg {
        transform: scaleX(-1);
      }
      
      
      /* Tabs */
      .vocab-chat-tabs {
        display: flex;
        gap: 0;
        padding: 12px 60px 0px 60px;
        border-bottom: 1px solid #e5e7eb;
        width: 100%;
        box-sizing: border-box;
        position: relative;
      }
      
      .vocab-chat-tab {
        flex: 1;
        padding: 10px 8px 12px 8px;
        border: none;
        background: transparent;
        border-radius: 0;
        font-size: 12px;
        font-weight: 600;
        color: #6b7280;
        cursor: pointer;
        transition: color 0.2s ease, background-color 0.2s ease;
        letter-spacing: 0.5px;
        text-align: center;
        margin: 0 4px;
        min-width: 0;
        position: relative;
      }
      
      .vocab-chat-tab:first-child {
        margin-left: 0;
      }
      
      .vocab-chat-tab:last-child {
        margin-right: 0;
      }
      
      .vocab-chat-tab.active {
        color: #9527F5;
      }
      
      .vocab-chat-tab:hover:not(.active) {
        color: #9ca3af;
      }
      
      /* Sliding tab indicator */
      .vocab-chat-tab-indicator {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        background: #9527F5;
        border-radius: 3px 3px 0 0;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 1;
      }
      
      /* Content Area */
      .vocab-chat-content-area {
        flex: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      
      .vocab-chat-tab-content {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: none;
        flex-direction: column;
      }
      
      .vocab-chat-tab-content.active {
        display: flex;
      }
      
      /* Tab content sliding animations */
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      @keyframes slideOutRight {
        from {
          opacity: 1;
          transform: translateX(0);
        }
        to {
          opacity: 0;
          transform: translateX(-20px);
        }
      }
      
      .vocab-chat-tab-content.slide-in {
        animation: slideIn 0.3s ease-out;
      }
      
      .vocab-chat-tab-content.slide-out-right {
        animation: slideOutRight 0.3s ease-out;
      }
      
      /* Original Text Content */
      .vocab-chat-original-text {
        padding: 16px;
        background: #f9fafb;
        border-radius: 12px;
        font-size: 14px;
        line-height: 1.6;
        color: #374151;
        white-space: pre-wrap;
        word-wrap: break-word;
      }
      
      /* Chat Messages */
      .vocab-chat-messages {
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 0;
      }
      
      .vocab-chat-messages::-webkit-scrollbar {
        width: 6px;
      }
      
      .vocab-chat-messages::-webkit-scrollbar-track {
        background: #f3f4f6;
        border-radius: 3px;
      }
      
      .vocab-chat-messages::-webkit-scrollbar-thumb {
        background: #D097FF;
        border-radius: 3px;
      }
      
      /* No Messages State */
      .vocab-chat-no-messages {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .vocab-chat-no-messages-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        opacity: 0.5;
      }
      
      .vocab-chat-no-messages-content span {
        font-size: 14px;
        font-weight: 500;
        color: #9527F5;
      }
      
      /* Message Bubbles */
      .vocab-chat-message {
        display: flex;
        flex-direction: column;
        position: relative;
      }
      
      .vocab-chat-message-user {
        align-items: flex-end;
        margin-right: 8px;
      }
      
      .vocab-chat-message-ai {
        align-items: flex-start;
        margin-left: 12px;
      }
      
      .vocab-chat-message-content {
        padding: 12px 16px;
        border-radius: 12px;
        font-size: 14px;
        line-height: 1.5;
        max-width: 85%;
        word-wrap: break-word;
        white-space: pre-wrap;
      }
      
      .vocab-chat-message-user .vocab-chat-message-content {
        background: #f3e8ff;
        color: #374151;
      }
      
      .vocab-chat-message-ai .vocab-chat-message-content {
        background: white;
        color: #374151;
        box-shadow: 0 2px 8px rgba(149, 39, 245, 0.15), 0 1px 4px rgba(149, 39, 245, 0.1);
      }
      
      /* Loading Animation - Three Dots Waving */
      .vocab-chat-typing-indicator {
        display: flex;
        gap: 3px;
        align-items: center;
        padding: 12px 0;
        justify-content: flex-start;
        margin-left: 16px;
      }
      
      .vocab-chat-typing-indicator span {
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: #9527F5;
        animation: typing-wave 1.4s ease-in-out infinite;
        opacity: 0.7;
      }
      
      .vocab-chat-typing-indicator span:nth-child(1) {
        animation-delay: 0s;
      }
      
      .vocab-chat-typing-indicator span:nth-child(2) {
        animation-delay: 0.2s;
      }
      
      .vocab-chat-typing-indicator span:nth-child(3) {
        animation-delay: 0.4s;
      }
      
      @keyframes typing-wave {
        0%, 60%, 100% {
          transform: translateY(0);
          opacity: 0.7;
        }
        30% {
          transform: translateY(-6px);
          opacity: 1;
        }
      }
      
      /* Markdown Styling in AI Messages */
      .vocab-chat-message-ai .vocab-chat-message-content code {
        background: #f3f4f6;
        color: #9527F5;
        padding: 2px 6px;
        border-radius: 4px;
        font-family: 'Courier New', Courier, monospace;
        font-size: 13px;
      }
      
      .vocab-chat-message-ai .vocab-chat-message-content pre {
        background: #f3f4f6;
        padding: 12px;
        border-radius: 8px;
        overflow-x: auto;
        margin: 8px 0;
      }
      
      .vocab-chat-message-ai .vocab-chat-message-content pre code {
        background: transparent;
        padding: 0;
        font-size: 12px;
        line-height: 1.5;
      }
      
      .vocab-chat-message-ai .vocab-chat-message-content strong {
        font-weight: 600;
        color: #1f2937;
      }
      
      .vocab-chat-message-ai .vocab-chat-message-content em {
        font-style: italic;
      }
      
      .vocab-chat-message-ai .vocab-chat-message-content a {
        color: #9527F5;
        text-decoration: underline;
      }
      
      .vocab-chat-message-ai .vocab-chat-message-content a:hover {
        color: #7a1fd9;
      }
      
      .vocab-chat-message-ai .vocab-chat-message-content h1,
      .vocab-chat-message-ai .vocab-chat-message-content h2,
      .vocab-chat-message-ai .vocab-chat-message-content h3 {
        font-weight: 600;
        margin: 8px 0;
        color: #1f2937;
      }
      
      .vocab-chat-message-ai .vocab-chat-message-content h1 {
        font-size: 18px;
      }
      
      .vocab-chat-message-ai .vocab-chat-message-content h2 {
        font-size: 16px;
      }
      
      .vocab-chat-message-ai .vocab-chat-message-content h3 {
        font-size: 15px;
      }
      
      .vocab-chat-message-ai .vocab-chat-message-content ul {
        margin: 8px 0;
        padding-left: 20px;
      }
      
      .vocab-chat-message-ai .vocab-chat-message-content li {
        margin: 4px 0;
      }
      
      /* Input Area */
      .vocab-chat-input-area {
        display: flex;
        gap: 8px;
        padding: 16px;
        border-top: 1px solid #e5e7eb;
        background: white;
        align-items: flex-end;
      }
      
      .vocab-chat-input {
        flex: 1;
        padding: 10px 12px;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        font-size: 14px;
        font-family: inherit;
        resize: none;
        outline: none;
        transition: border-color 0.2s ease;
        min-height: 40px;
        max-height: 120px;
      }
      
      .vocab-chat-input:focus {
        border-color: #9527F5;
      }
      
      .vocab-chat-input::placeholder {
        color: #9ca3af;
      }
      
      /* Send Button - Wireframe Purple Circular */
      .vocab-chat-send-btn {
        width: 44px;
        height: 44px;
        background: white;
        border: 2px solid #9527F5;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        flex-shrink: 0;
      }
      
      .vocab-chat-send-btn:hover {
        background: #f0e6ff;
        border-color: #7a1fd9;
        transform: translateY(-1px);
      }
      
      .vocab-chat-send-btn:active {
        transform: translateY(0) scale(0.95);
      }
      
      /* Delete Conversation Button - Wireframe Red Circular */
      .vocab-chat-delete-conversation-btn {
        width: 44px;
        height: 44px;
        background: white;
        border: 2px solid #ef4444;
        border-radius: 50%;
        display: none;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        flex-shrink: 0;
        margin-left: 4px;
      }
      
      .vocab-chat-delete-conversation-btn:hover {
        background: #fef2f2;
        border-color: #dc2626;
        transform: translateY(-1px);
      }
      
      .vocab-chat-delete-conversation-btn:active {
        transform: translateY(0) scale(0.95);
      }
      
      /* Resize Handles */
      .vocab-chat-resize-handle {
        position: absolute;
        z-index: 1000001;
      }
      
      .vocab-chat-resize-left {
        left: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        cursor: ew-resize;
        background: transparent;
        transition: background 0.2s ease;
      }
      
      .vocab-chat-resize-left:hover {
        background: rgba(149, 39, 245, 0.3);
      }
      
      .vocab-chat-resize-bottom {
        left: 0;
        right: 0;
        bottom: 0;
        height: 4px;
        cursor: ns-resize;
        background: transparent;
        transition: background 0.2s ease;
      }
      
      .vocab-chat-resize-bottom:hover {
        background: rgba(149, 39, 245, 0.3);
      }
      
      .vocab-chat-resize-bottom-left {
        left: 0;
        bottom: 0;
        width: 12px;
        height: 12px;
        cursor: nesw-resize;
        background: transparent;
        border-bottom-left-radius: 4px;
      }
      
      .vocab-chat-resize-bottom-left::after {
        content: '';
        position: absolute;
        left: 2px;
        bottom: 2px;
        width: 8px;
        height: 8px;
        border-left: 2px solid #9527F5;
        border-bottom: 2px solid #9527F5;
        opacity: 0.5;
        border-bottom-left-radius: 2px;
      }
      
      /* Focus Button Styles */
      .vocab-chat-focus-btn-container {
        padding: 16px 16px 12px 16px;
        border-bottom: 1px solid #e5e7eb;
        margin-bottom: 12px;
      }
      
      .vocab-chat-focus-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        width: auto;
        padding: 8px 14px;
        margin: 0;
        background: white;
        border: 2px solid #9527F5;
        border-radius: 6px;
        color: #9527F5;
        font-weight: 500;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 1px 2px rgba(149, 39, 245, 0.05);
      }
      
      .vocab-chat-focus-btn:hover {
        background: #f9f5ff;
        border-color: #7a1fd9;
        box-shadow: 0 2px 4px rgba(149, 39, 245, 0.1);
      }
      
      .vocab-chat-focus-btn:active {
        transform: scale(0.98);
      }
      
      .vocab-chat-focus-btn svg {
        flex-shrink: 0;
        width: 16px;
        height: 16px;
      }
      
      .vocab-chat-focus-btn span {
        color: #9527F5;
        font-weight: 500;
      }
      
      /* Responsive */
      @media (max-width: 768px) {
        .vocab-chat-dialog {
          width: 100vw;
          max-width: 100vw;
          height: 100vh;
          max-height: 100vh;
        }
        
        .vocab-chat-content {
          border-radius: 0;
        }
        
        .vocab-chat-resize-handle {
          display: none;
        }
      }
    `;
    
    document.head.appendChild(style);
  }
};

// ===================================
// Button Panel Module - Manages the floating button UI
// ===================================
const ButtonPanel = {
  panelContainer: null,
  upperButtonGroup: null,
  
  // State variables for button visibility and enabled states
  state: {
    showRemoveMeanings: false,    // Controls visibility of "Remove meanings" button
    showDeselectAll: false,        // Controls visibility of "Deselect all" button
    isMagicMeaningEnabled: false,  // Controls enabled/disabled state of "Magic meaning" button
    isAskEnabled: false            // Controls enabled/disabled state of "Ask" button
  },

  /**
   * Initialize the button panel
   */
  async init() {
    this.createPanel();
    this.attachEventListeners();
    
    // Clear any saved position on init (reset to default on tab refresh)
    await PositionManager.clearPosition();
    
    // Initialize drag functionality - drag the entire panel container
    const dragHandle = document.getElementById('vocab-drag-handle');
    if (dragHandle && this.panelContainer) {
      DragHandle.init(dragHandle, this.panelContainer);
      // Note: Not loading saved position - always start at default position
    }
    
    // Apply initial state
    this.updateButtonStates();
    
    // Check if extension is enabled and show/hide accordingly
    const isEnabled = await this.checkExtensionEnabled();
    if (isEnabled) {
      this.show();
    } else {
      this.hide();
    }
    
    console.log('Button panel initialized. Enabled:', isEnabled);
  },

  /**
   * Check if extension is enabled from storage for current domain
   * @returns {Promise<boolean>} Whether the extension is enabled
   */
  async checkExtensionEnabled() {
    try {
      const currentDomain = window.location.hostname;
      const storageKey = `isExtensionEnabledFor_${currentDomain}`;
      const result = await chrome.storage.local.get([storageKey]);
      return result[storageKey] ?? true; // Default to true
    } catch (error) {
      console.error('Error checking extension state:', error);
      return true; // Default to true on error
    }
  },

  /**
   * Create the button panel DOM structure
   */
  createPanel() {
    // Create main container
    this.panelContainer = document.createElement('div');
    this.panelContainer.id = 'vocab-helper-button-panel';
    this.panelContainer.className = 'vocab-helper-panel';

    // Create wrapper container (invisible, holds button group + pan button)
    const wrapperContainer = document.createElement('div');
    wrapperContainer.id = 'vocab-wrapper-container';
    wrapperContainer.className = 'vocab-wrapper-container';

    // Create main button group container with shadow
    const mainButtonGroup = document.createElement('div');
    mainButtonGroup.className = 'vocab-button-group-main';

    // Create upper button group (Remove all meanings, Deselect all)
    this.upperButtonGroup = document.createElement('div');
    this.upperButtonGroup.className = 'vocab-button-group-upper';

    const upperButtons = [
      {
        id: 'remove-all-meanings',
        className: 'vocab-btn vocab-btn-outline-green hidden',
        icon: this.createTrashIcon('green'),
        text: 'Remove meanings',
        type: 'outline-green'
      },
      {
        id: 'deselect-all',
        className: 'vocab-btn vocab-btn-outline-purple hidden',
        icon: this.createTrashIcon('purple'),
        text: 'Deselect all',
        type: 'outline-purple'
      }
    ];

    upperButtons.forEach(btnConfig => {
      const button = this.createButton(btnConfig);
      this.upperButtonGroup.appendChild(button);
    });

    // Create lower button group (Magic meaning, Ask)
    const lowerButtonGroup = document.createElement('div');
    lowerButtonGroup.className = 'vocab-button-group-lower';

    const lowerButtons = [
      {
        id: 'magic-meaning',
        className: 'vocab-btn vocab-btn-solid-purple',
        icon: this.createSparkleIcon(),
        text: 'Magic meaning',
        type: 'solid-purple'
      },
      {
        id: 'ask',
        className: 'vocab-btn vocab-btn-solid-purple',
        icon: this.createChatIcon(),
        text: 'Ask',
        type: 'solid-purple'
      }
    ];

    lowerButtons.forEach(btnConfig => {
      const button = this.createButton(btnConfig);
      lowerButtonGroup.appendChild(button);
    });

    // Append upper and lower groups to main group
    mainButtonGroup.appendChild(this.upperButtonGroup);
    mainButtonGroup.appendChild(lowerButtonGroup);

    // Create drag handle (separate from button group)
    const dragHandle = this.createDragHandle();

    // Append button group and drag handle to wrapper
    wrapperContainer.appendChild(mainButtonGroup);
    wrapperContainer.appendChild(dragHandle);

    // Append wrapper to panel
    this.panelContainer.appendChild(wrapperContainer);

    // Inject styles
    this.injectStyles();

    // Append to body
    document.body.appendChild(this.panelContainer);
  },
  
  /**
   * Create drag handle element
   * @returns {HTMLElement} Drag handle element
   */
  createDragHandle() {
    const dragHandle = document.createElement('div');
    dragHandle.id = 'vocab-drag-handle';
    dragHandle.className = 'vocab-drag-handle';
    dragHandle.title = 'Drag to reposition';
    
    // Add pan icon
    dragHandle.innerHTML = this.createPanIcon();
    
    return dragHandle;
  },
  
  /**
   * Create pan/move icon SVG - Simple grip dots icon
   * @returns {string} SVG markup
   */
  createPanIcon() {
    return `
      <svg width="20" height="16" viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="6" cy="4" r="1.5" fill="#9527F5"/>
        <circle cx="10" cy="4" r="1.5" fill="#9527F5"/>
        <circle cx="14" cy="4" r="1.5" fill="#9527F5"/>
        <circle cx="6" cy="8" r="1.5" fill="#9527F5"/>
        <circle cx="10" cy="8" r="1.5" fill="#9527F5"/>
        <circle cx="14" cy="8" r="1.5" fill="#9527F5"/>
        <circle cx="6" cy="12" r="1.5" fill="#9527F5"/>
        <circle cx="10" cy="12" r="1.5" fill="#9527F5"/>
        <circle cx="14" cy="12" r="1.5" fill="#9527F5"/>
      </svg>
    `;
  },

  /**
   * Create a button element
   * @param {Object} config - Button configuration
   * @returns {HTMLElement} Button element
   */
  createButton(config) {
    const button = document.createElement('button');
    button.id = config.id;
    button.className = config.className;
    button.setAttribute('data-type', config.type);

    // Create icon container
    const iconSpan = document.createElement('span');
    iconSpan.className = 'vocab-btn-icon';
    iconSpan.innerHTML = config.icon;

    // Create text span
    const textSpan = document.createElement('span');
    textSpan.className = 'vocab-btn-text';
    textSpan.textContent = config.text;

    button.appendChild(iconSpan);
    button.appendChild(textSpan);

    return button;
  },

  /**
   * Create trash icon SVG
   * @param {string} color - Icon color (green or purple)
   * @returns {string} SVG markup
   */
  createTrashIcon(color) {
    const strokeColor = color === 'green' ? '#22c55e' : '#9527F5';
    return `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 0 1 1.334-1.334h2.666a1.333 1.333 0 0 1 1.334 1.334V4m2 0v9.333a1.333 1.333 0 0 1-1.334 1.334H4.667a1.333 1.333 0 0 1-1.334-1.334V4h9.334Z" stroke="${strokeColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M6.667 7.333v4M9.333 7.333v4" stroke="${strokeColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="12" cy="4" r="2" fill="white"/>
        <path d="M10.5 3l1 1m0 0l1 1m-1-1l1-1m-1 1l-1 1" stroke="${strokeColor}" stroke-width="1.2" stroke-linecap="round"/>
      </svg>
    `;
  },

  /**
   * Create AI sparkle icon SVG (solid white, larger and prominent)
   * @returns {string} SVG markup
   */
  createSparkleIcon() {
    return `
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 0L17 8L25 11L17 14L14 22L11 14L3 11L11 8L14 0Z" fill="white"/>
        <path d="M22 16L23.5 20L27.5 21.5L23.5 23L22 27L20.5 23L16.5 21.5L20.5 20L22 16Z" fill="white"/>
        <path d="M8 21L9.5 24.5L13 26L9.5 27.5L8 31L6.5 27.5L3 26L6.5 24.5L8 21Z" fill="white"/>
      </svg>
    `;
  },

  /**
   * Create chat bubble icon SVG (solid white)
   * @returns {string} SVG markup
   */
  createChatIcon() {
    return `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 1C4.134 1 1 3.91 1 7.5C1 9.09 1.59 10.56 2.586 11.707L1.293 14.293C1.195 14.488 1.195 14.722 1.293 14.918C1.39 15.113 1.597 15.234 1.817 15.234C1.89 15.234 1.963 15.219 2.033 15.188L5.457 13.711C6.245 13.9 7.107 14 8 14C11.866 14 15 11.09 15 7.5C15 3.91 11.866 1 8 1Z" fill="white"/>
        <circle cx="5" cy="7.5" r="1" fill="#9527F5"/>
        <circle cx="8" cy="7.5" r="1" fill="#9527F5"/>
        <circle cx="11" cy="7.5" r="1" fill="#9527F5"/>
      </svg>
    `;
  },

  /**
   * Inject CSS styles for the button panel
   */
  injectStyles() {
    const styleId = 'vocab-helper-button-panel-styles';
    
    // Check if styles already injected
    if (document.getElementById(styleId)) {
      return;
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Main Panel Container */
      .vocab-helper-panel {
        position: fixed;
        right: 0;
        top: 50%;
        transform: translateY(-50%) translateX(100%);
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        opacity: 1;
      }

      /* Panel visible state */
      .vocab-helper-panel.visible {
        transform: translateY(-50%) translateX(0);
      }

      /* Wrapper Container - Invisible container for button group + pan button */
      .vocab-wrapper-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0;
      }

      /* Main Button Group with Purple Shadow */
      .vocab-button-group-main {
        display: flex;
        flex-direction: column;
        gap: 0;
        background: white;
        padding: 10px 10px 10px 10px;
        border-radius: 16px;
        box-shadow: 0 4px 20px rgba(149, 39, 245, 0.3), 0 2px 8px rgba(149, 39, 245, 0.2);
        border: 1px solid rgba(149, 39, 245, 0.1);
      }

      /* Upper Button Group with smooth transitions */
      .vocab-button-group-upper {
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-height: 0;
        overflow: hidden;
        opacity: 0;
        transform: scaleY(0);
        transform-origin: top;
        transition: max-height 0.3s ease, opacity 0.3s ease, transform 0.3s ease, margin 0.3s ease, padding 0.3s ease;
        margin-bottom: 0;
        padding-top: 0;
      }
      
      .vocab-button-group-upper.visible {
        max-height: 200px;
        opacity: 1;
        transform: scaleY(1);
        margin-bottom: 8px;
        padding-top: 0;
      }

      /* Lower Button Group (no additional styling) */
      .vocab-button-group-lower {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding-top: 0;
      }

      /* Drag Handle Styles - Semi-circular (bottom half rounded) */
      .vocab-drag-handle {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 6px 16px 8px 16px;
        cursor: grab;
        user-select: none;
        border-radius: 0 0 20px 20px;
        background: white;
        width: fit-content;
        margin-top: -1px;
        box-shadow: 
          2px 4px 4px rgba(149, 39, 245, 0.15),
          -2px 4px 4px rgba(149, 39, 245, 0.15),
          0 4px 3px rgba(149, 39, 245, 0.12);
        border: 1px solid rgba(149, 39, 245, 0.1);
        border-top: none;
        clip-path: inset(0px -10px -10px -10px);
      }

      .vocab-drag-handle:hover {
        background: white;
      }

      .vocab-drag-handle:active {
        cursor: grabbing;
        background: white;
      }

      .vocab-drag-handle svg {
        pointer-events: none;
        display: block;
      }

      /* Base Button Styles */
      .vocab-btn {
        display: grid;
        grid-template-columns: 20px 1fr;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        border-radius: 10px;
        font-size: 11.5px;
        font-weight: 500;
        border: 2px solid;
        cursor: pointer;
        transition: all 0.2s ease, opacity 0.3s ease, transform 0.3s ease, max-height 0.3s ease;
        outline: none;
        width: 120px;
        max-height: 100px;
        overflow: hidden;
        opacity: 1;
        transform: scaleY(1);
        transform-origin: top;
        min-height: 36px;
      }
      
      .vocab-btn.hidden {
        display: none !important;
        max-height: 0;
        opacity: 0;
        transform: scaleY(0);
        padding: 0;
        margin: 0;
        border: none;
        pointer-events: none;
      }

      .vocab-btn:active:not(.hidden) {
        transform: scale(0.98) !important;
      }

      /* Button Icon */
      .vocab-btn-icon {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        width: 20px;
        height: 20px;
      }

      .vocab-btn-text {
        text-align: left;
        line-height: 1.2;
        word-wrap: break-word;
        white-space: normal;
      }

      /* Green Outline Button */
      .vocab-btn-outline-green {
        background: white;
        border-color: #22c55e;
        color: #22c55e;
      }

      .vocab-btn-outline-green:hover {
        background: #f0fdf4;
        border-color: #16a34a;
        color: #16a34a;
      }

      /* Purple Outline Button */
      .vocab-btn-outline-purple {
        background: white;
        border-color: #9527F5;
        color: #9527F5;
      }

      .vocab-btn-outline-purple:hover {
        background: #f0e6ff;
        border-color: #7a1fd9;
        color: #7a1fd9;
      }

      /* Solid Purple Button */
      .vocab-btn-solid-purple {
        background: #9527F5;
        border-color: #9527F5;
        color: white;
      }

      .vocab-btn-solid-purple:hover {
        background: #7a1fd9;
        border-color: #7a1fd9;
      }

      /* Disabled Button State */
      .vocab-btn.disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .vocab-btn-solid-purple.disabled {
        background: #c5aee3;
        border-color: #c5aee3;
        opacity: 1;
      }

      .vocab-btn-solid-purple.disabled:hover {
        background: #c5aee3;
        border-color: #c5aee3;
      }

      .vocab-btn-solid-purple.disabled .vocab-btn-icon svg {
        opacity: 0.7;
      }

      .vocab-btn-solid-purple.disabled .vocab-btn-text {
        opacity: 0.85;
      }

      /* Allow hover events on disabled buttons for tooltips */
      .vocab-btn.disabled * {
        pointer-events: none;
      }

      /* Tooltip Styles */
      .vocab-btn-tooltip {
        position: absolute;
        bottom: calc(100% + 8px);
        right: 0;
        background: white;
        color: #a78bfa;
        padding: 10px 14px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 500;
        white-space: nowrap;
        box-shadow: 0 0 0 1px rgba(167, 139, 250, 0.1),
                    0 4px 12px rgba(167, 139, 250, 0.3),
                    0 0 20px rgba(167, 139, 250, 0.2);
        z-index: 10;
        pointer-events: none;
        opacity: 0;
        transform: translateY(5px);
        transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                    transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .vocab-btn-tooltip.visible {
        opacity: 1;
        transform: translateY(0);
      }

      /* Tooltip arrow */
      .vocab-btn-tooltip::after {
        content: '';
        position: absolute;
        top: 100%;
        right: 20px;
        border: 6px solid transparent;
        border-top-color: white;
        filter: drop-shadow(0 2px 3px rgba(167, 139, 250, 0.2));
      }

      /* Button container needs relative positioning for tooltip */
      .vocab-btn {
        position: relative;
      }

      /* Responsive adjustments */
      @media (max-width: 768px) {
        .vocab-helper-panel {
          right: 0;
        }

        .vocab-button-group-main {
          padding: 8px;
        }

        .vocab-btn {
          width: 110px;
          padding: 7px 10px;
          font-size: 11px;
          grid-template-columns: 16px 1fr;
          gap: 6px;
        }

        .vocab-btn-icon {
          width: 16px;
          height: 16px;
        }
      }
    `;

    document.head.appendChild(style);
  },

  /**
   * Attach event listeners to buttons
   */
  attachEventListeners() {
    const buttons = {
      removeAllMeanings: document.getElementById('remove-all-meanings'),
      deselectAll: document.getElementById('deselect-all'),
      magicMeaning: document.getElementById('magic-meaning'),
      ask: document.getElementById('ask')
    };

    // Remove all meanings button
    buttons.removeAllMeanings?.addEventListener('click', () => {
      console.log('Remove all meanings clicked');
      this.handleRemoveAllMeanings();
    });

    // Deselect all button
    buttons.deselectAll?.addEventListener('click', () => {
      console.log('Deselect all clicked');
      this.handleDeselectAll();
    });

    // Magic meaning button
    buttons.magicMeaning?.addEventListener('click', (e) => {
      if (buttons.magicMeaning.classList.contains('disabled')) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      console.log('Magic meaning clicked');
      this.handleMagicMeaning();
    });

    // Ask button
    buttons.ask?.addEventListener('click', (e) => {
      if (buttons.ask.classList.contains('disabled')) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      console.log('Ask clicked');
      this.handleAsk();
    });

    // Add tooltip event listeners
    this.attachTooltipListeners(buttons.magicMeaning, 'magic-meaning');
    this.attachTooltipListeners(buttons.ask, 'ask');
  },

  /**
   * Attach tooltip event listeners to a button
   * @param {HTMLElement} button - Button element
   * @param {string} buttonType - Type of button ('magic-meaning' or 'ask')
   */
  attachTooltipListeners(button, buttonType) {
    if (!button) return;

    let tooltip = null;

    button.addEventListener('mouseenter', () => {
      const isDisabled = button.classList.contains('disabled');
      let message = '';

      // Determine tooltip message based on button type and state
      if (buttonType === 'magic-meaning') {
        message = isDisabled 
          ? 'Select words or texts first' 
          : 'Get meanings and explanations';
      } else if (buttonType === 'ask') {
        message = isDisabled 
          ? 'Select exactly one text' 
          : 'Ask about the selected passage';
      }

      // Create and show tooltip
      tooltip = this.createTooltip(message);
      button.appendChild(tooltip);
      
      // Trigger animation
      setTimeout(() => {
        tooltip.classList.add('visible');
      }, 10);
    });

    button.addEventListener('mouseleave', () => {
      if (tooltip) {
        tooltip.classList.remove('visible');
        setTimeout(() => {
          tooltip.remove();
          tooltip = null;
        }, 200);
      }
    });
  },

  /**
   * Create a tooltip element
   * @param {string} message - Tooltip message
   * @returns {HTMLElement} Tooltip element
   */
  createTooltip(message) {
    const tooltip = document.createElement('div');
    tooltip.className = 'vocab-btn-tooltip';
    tooltip.textContent = message;
    return tooltip;
  },

  /**
   * Handler for Remove all meanings button
   */
  handleRemoveAllMeanings() {
    console.log('[ButtonPanel] Remove all meanings clicked');
    
    // Get all asked texts
    const askedTextsMap = TextSelector.askedTexts;
    
    if (askedTextsMap.size === 0) {
      console.warn('[ButtonPanel] No asked texts to remove');
      return;
    }
    
    // Create a copy of the keys to avoid iteration issues during deletion
    const textKeys = Array.from(askedTextsMap.keys());
    
    console.log(`[ButtonPanel] Removing ${textKeys.length} asked texts`);
    
    // Remove each asked text
    textKeys.forEach(textKey => {
      const askedData = askedTextsMap.get(textKey);
      
      if (askedData && askedData.highlight) {
        const highlight = askedData.highlight;
        
        // Remove the chat icon button (green)
        const chatBtn = highlight.querySelector('.vocab-text-chat-btn');
        if (chatBtn) {
          chatBtn.remove();
        }
        
        // Remove the highlight wrapper completely
        const parent = highlight.parentNode;
        if (parent) {
          // Move all child nodes out of the highlight wrapper
          while (highlight.firstChild) {
            parent.insertBefore(highlight.firstChild, highlight);
          }
          // Remove the empty highlight wrapper
          highlight.remove();
        }
      }
      
      // Remove from askedTexts Map
      askedTextsMap.delete(textKey);
      
      // Also remove from textToHighlights Map
      TextSelector.textToHighlights.delete(textKey);
    });
    
    console.log('[ButtonPanel] All asked texts removed');
    
    // Update button states
    this.updateButtonStatesFromSelections();
  },

  /**
   * Handler for Deselect all button
   */
  handleDeselectAll() {
    console.log('Deselect all clicked');
    // Clear all word selections
    WordSelector.clearAll();
    // Clear all text selections
    TextSelector.clearAll();
    // Update button states
    this.updateButtonStatesFromSelections();
  },

  /**
   * Handler for Magic meaning button
   */
  async handleMagicMeaning() {
    console.log('[ButtonPanel] Magic meaning clicked');
    
    // Get all selected texts
    const selectedTexts = TextSelector.getSelectedTexts();
    
    if (selectedTexts.size === 0) {
      console.warn('[ButtonPanel] No text selected');
      return;
    }
    
    // Build API request payload
    const textSegments = [];
    const textKeysToProcess = [];
    
    for (const textKey of selectedTexts) {
      const positionData = TextSelector.textPositions.get(textKey);
      
      if (positionData) {
        textSegments.push({
          textStartIndex: positionData.textStartIndex,
          textLength: positionData.textLength,
          text: positionData.text,
          previousSimplifiedTexts: []
        });
        textKeysToProcess.push(textKey);
      }
    }
    
    if (textSegments.length === 0) {
      console.warn('[ButtonPanel] No text segments with position data');
      return;
    }
    
    console.log('[ButtonPanel] Processing', textSegments.length, 'text segments');
    
    // Start loading animation on all selected highlights
    for (const textKey of textKeysToProcess) {
      const highlight = TextSelector.textToHighlights.get(textKey);
      if (highlight) {
        // Remove any existing buttons
        const existingBtn = highlight.querySelector('.vocab-text-remove-btn');
        if (existingBtn) {
          existingBtn.remove();
        }
        
        // Add loading animation class
        highlight.classList.add('vocab-text-loading');
      }
    }
    
    // Call SimplifyService with SSE
    SimplifyService.simplify(
      textSegments,
      // onEvent callback - called for each SSE event
      (eventData) => {
        console.log('[ButtonPanel] Received simplified text:', eventData);
        
        // Find the corresponding textKey for this event
        // Match by textStartIndex and textLength
        const matchingTextKey = textKeysToProcess.find(textKey => {
          const posData = TextSelector.textPositions.get(textKey);
          return posData && 
                 posData.textStartIndex === eventData.textStartIndex &&
                 posData.textLength === eventData.textLength;
        });
        
        if (matchingTextKey) {
          const highlight = TextSelector.textToHighlights.get(matchingTextKey);
          
          if (highlight) {
            // Remove loading animation
            highlight.classList.remove('vocab-text-loading');
            
            // Change underline to light green
            highlight.classList.add('vocab-text-simplified');
            
            // Replace cross button with book icon
            const existingBtn = highlight.querySelector('.vocab-text-remove-btn');
            if (existingBtn) {
              existingBtn.remove();
            }
            
            const bookBtn = TextSelector.createBookButton(matchingTextKey);
            highlight.appendChild(bookBtn);
            
            // Store simplified text data
            TextSelector.simplifiedTexts.set(matchingTextKey, {
              textStartIndex: eventData.textStartIndex,
              textLength: eventData.textLength,
              text: eventData.text,
              simplifiedText: eventData.simplifiedText,
              previousSimplifiedTexts: eventData.previousSimplifiedTexts || []
            });
            
            console.log('[ButtonPanel] Updated UI for text segment:', matchingTextKey);
          }
        }
      },
      // onComplete callback
      () => {
        console.log('[ButtonPanel] All text simplification complete');
        
        // Remove loading animation from any remaining highlights (in case some failed)
        for (const textKey of textKeysToProcess) {
          const highlight = TextSelector.textToHighlights.get(textKey);
          if (highlight && highlight.classList.contains('vocab-text-loading')) {
            highlight.classList.remove('vocab-text-loading');
          }
        }
      },
      // onError callback
      (error) => {
        console.error('[ButtonPanel] Error during text simplification:', error);
        
        // Remove loading animation from all highlights
        for (const textKey of textKeysToProcess) {
          const highlight = TextSelector.textToHighlights.get(textKey);
          if (highlight) {
            highlight.classList.remove('vocab-text-loading');
          }
        }
        
        // Show error notification
        TextSelector.showNotification('Error simplifying text. Please try again.');
      }
    );
  },

  /**
   * Handler for Ask button
   */
  handleAsk() {
    console.log('[ButtonPanel] Ask button clicked');
    
    // Get the first selected text
    const selectedTexts = TextSelector.getSelectedTexts();
    
    if (selectedTexts.size === 0) {
      console.warn('[ButtonPanel] No text selected');
      return;
    }
    
    if (selectedTexts.size > 1) {
      console.warn('[ButtonPanel] Multiple texts selected, button should be disabled');
      return;
    }
    
    // Get the first (and only) text
    const textKey = Array.from(selectedTexts)[0];
    const textHighlight = TextSelector.textToHighlights.get(textKey);
    
    if (textHighlight) {
      const originalText = textHighlight.textContent.replace(/\s+/g, ' ').trim();
      
      // Move text from selectedTexts to askedTexts
      TextSelector.moveToAskedTexts(textKey);
      
      // Open chat dialog
      ChatDialog.open(originalText, textKey);
    }
  },

  /**
   * Show the button panel
   */
  show() {
    if (this.panelContainer) {
      this.panelContainer.style.display = 'block';
      // Add visible class for initial slide-in animation if at default position
      this.panelContainer.classList.add('visible');
      console.log('[ButtonPanel] Panel shown');
    }
  },

  /**
   * Hide the button panel
   */
  hide() {
    if (this.panelContainer) {
      this.panelContainer.style.display = 'none';
      console.log('[ButtonPanel] Panel hidden');
    }
  },

  /**
   * Remove the button panel from DOM
   */
  destroy() {
    if (this.panelContainer) {
      this.panelContainer.remove();
      this.panelContainer = null;
    }
  },

  /**
   * Update button states based on state variables
   */
  updateButtonStates() {
    // Show/hide upper button group based on state with smooth animation
    const shouldShowUpperGroup = this.state.showRemoveMeanings || this.state.showDeselectAll;
    if (this.upperButtonGroup) {
      if (shouldShowUpperGroup) {
        this.upperButtonGroup.classList.add('visible');
      } else {
        this.upperButtonGroup.classList.remove('visible');
      }
    }

    // Update individual button visibility in upper group with smooth animation
    const removeMeaningsBtn = document.getElementById('remove-all-meanings');
    const deselectAllBtn = document.getElementById('deselect-all');
    
    if (removeMeaningsBtn) {
      if (this.state.showRemoveMeanings) {
        removeMeaningsBtn.classList.remove('hidden');
      } else {
        removeMeaningsBtn.classList.add('hidden');
      }
    }
    if (deselectAllBtn) {
      if (this.state.showDeselectAll) {
        deselectAllBtn.classList.remove('hidden');
      } else {
        deselectAllBtn.classList.add('hidden');
      }
    }

    // Update enabled/disabled state of lower buttons
    const magicMeaningBtn = document.getElementById('magic-meaning');
    const askBtn = document.getElementById('ask');

    if (magicMeaningBtn) {
      if (this.state.isMagicMeaningEnabled) {
        magicMeaningBtn.classList.remove('disabled');
      } else {
        magicMeaningBtn.classList.add('disabled');
      }
    }

    if (askBtn) {
      if (this.state.isAskEnabled) {
        askBtn.classList.remove('disabled');
      } else {
        askBtn.classList.add('disabled');
      }
    }
  },

  /**
   * Update state and refresh button states
   * @param {Object} newState - Partial state object to update
   */
  updateState(newState) {
    this.state = { ...this.state, ...newState };
    this.updateButtonStates();
    console.log('Button panel state updated:', this.state);
  },
  
  /**
   * Update button states based on selections
   */
  updateButtonStatesFromSelections() {
    const hasWords = WordSelector.selectedWords.size > 0;
    const hasTexts = TextSelector.selectedTexts.size > 0;
    const hasExactlyOneText = TextSelector.selectedTexts.size === 1;
    const hasAskedTexts = TextSelector.askedTexts.size > 0;
    
    // Show "Remove all meanings" if there are any asked texts
    this.setShowRemoveMeanings(hasAskedTexts);
    
    // Show "Deselect all" if there are any words or texts selected
    this.setShowDeselectAll(hasWords || hasTexts);
    
    // Enable "Magic meaning" if there are any words or texts selected
    this.setMagicMeaningEnabled(hasWords || hasTexts);
    
    // Enable "Ask" only if exactly one text is selected
    this.setAskEnabled(hasExactlyOneText);
  },

  /**
   * Set visibility of Remove meanings button
   * @param {boolean} show - Whether to show the button
   */
  setShowRemoveMeanings(show) {
    this.updateState({ showRemoveMeanings: show });
  },

  /**
   * Set visibility of Deselect all button
   * @param {boolean} show - Whether to show the button
   */
  setShowDeselectAll(show) {
    this.updateState({ showDeselectAll: show });
  },

  /**
   * Set enabled state of Magic meaning button
   * @param {boolean} enabled - Whether to enable the button
   */
  setMagicMeaningEnabled(enabled) {
    this.updateState({ isMagicMeaningEnabled: enabled });
  },

  /**
   * Set enabled state of Ask button
   * @param {boolean} enabled - Whether to enable the button
   */
  setAskEnabled(enabled) {
    this.updateState({ isAskEnabled: enabled });
  }
};

