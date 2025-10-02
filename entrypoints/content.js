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
      
      // Add text to selected set (O(1) operation)
      this.addText(selectedText);
      
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
   * Add a text to the selected texts set
   * @param {string} text - The text to add
   */
  addText(text) {
    const textKey = this.getTextKey(text);
    this.selectedTexts.add(textKey); // O(1) operation
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
          ? 'Select a text first' 
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
    // TODO: Implement remove all meanings functionality
    console.log('Remove all meanings - to be implemented');
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
  handleMagicMeaning() {
    // TODO: Implement magic meaning functionality
    console.log('Magic meaning - to be implemented');
  },

  /**
   * Handler for Ask button
   */
  handleAsk() {
    // TODO: Implement ask functionality
    console.log('Ask - to be implemented');
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
    
    // Show "Deselect all" if there are any words or texts selected
    this.setShowDeselectAll(hasWords || hasTexts);
    
    // Enable "Magic meaning" if there are any words or texts selected
    this.setMagicMeaningEnabled(hasWords || hasTexts);
    
    // Enable "Ask" if there are any texts selected
    this.setAskEnabled(hasTexts);
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

