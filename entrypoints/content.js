import ApiService from '../core/services/ApiService.js';
import SimplifyService from '../core/services/SimplifyService.js';
import WordExplanationService from '../core/services/WordExplanationService.js';

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
    
    // Listen for messages from popup and background script
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
      } else if (message.type === 'TAB_STATE_CHANGE' && message.domain === currentDomain) {
        console.log(`[Content Script] Tab state change for ${currentDomain}:`, message.eventType);
        handleTabStateChange(message.domain, message.eventType, sendResponse);
      } else if (message.type === 'CHECK_EXTENSION_STATE') {
        handleExtensionStateCheck(message.domain, sendResponse);
      }
    });
  },
});

// ===================================
// Tab State Management Functions
// ===================================

/**
 * Handle tab state change events from background script
 * @param {string} domain - The domain name
 * @param {string} eventType - Type of event (TAB_LOADED, TAB_SWITCHED, TAB_CREATED)
 * @param {Function} sendResponse - Response callback
 */
async function handleTabStateChange(domain, eventType, sendResponse) {
  try {
    console.log(`[Content Script] Handling tab state change: ${eventType} for ${domain}`);
    
    // Check if extension state exists in storage
    const storageKey = `isExtensionEnabledFor_${domain}`;
    const result = await chrome.storage.local.get([storageKey]);
    const isEnabled = result[storageKey];
    
    if (isEnabled === undefined) {
      // No storage data found - this is a new domain, set to disabled
      console.log(`[Content Script] New domain detected: ${domain}, setting to disabled`);
      
      // Ensure all components are disabled
      ButtonPanel.hide();
      WordSelector.disable();
      TextSelector.disable();
      WordSelector.clearAll();
      TextSelector.clearAll();
      
      sendResponse({ success: true, isEnabled: false, isNewDomain: true });
    } else {
      // Storage data exists, use the stored value
      console.log(`[Content Script] Existing domain: ${domain}, enabled: ${isEnabled}`);
      
      if (isEnabled) {
        ButtonPanel.show();
        WordSelector.enable();
        TextSelector.enable();
      } else {
        ButtonPanel.hide();
        WordSelector.disable();
        TextSelector.disable();
        WordSelector.clearAll();
        TextSelector.clearAll();
      }
      
      sendResponse({ success: true, isEnabled: isEnabled, isNewDomain: false });
    }
  } catch (error) {
    console.error('[Content Script] Error handling tab state change:', error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Handle extension state check request
 * @param {string} domain - The domain to check
 * @param {Function} sendResponse - Response callback
 */
async function handleExtensionStateCheck(domain, sendResponse) {
  try {
    const storageKey = `isExtensionEnabledFor_${domain}`;
    const result = await chrome.storage.local.get([storageKey]);
    const isEnabled = result[storageKey] ?? false; // Default to false for new domains
    
    console.log(`[Content Script] Extension state check for ${domain}:`, isEnabled);
    
    sendResponse({
      success: true,
      isEnabled: isEnabled,
      domain: domain
    });
  } catch (error) {
    console.error('[Content Script] Error checking extension state:', error);
    sendResponse({
      success: false,
      error: error.message,
      isEnabled: false
    });
  }
}

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
  
  // Map to store word -> Array of position objects {element, textStartIndex}
  wordPositions: new Map(),
  
  // Container for explained words (moved from selectedWords after API call)
  explainedWords: new Map(), // Map of word -> {word, meaning, examples, highlights, hasCalledGetMoreExamples}
  
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
    
    // Setup global click handler to close popups (only sticky ones)
    document.addEventListener('click', (e) => {
      // Get all sticky popups
      const stickyPopups = document.querySelectorAll('.vocab-word-popup[data-sticky="true"]');
      
      if (stickyPopups.length === 0) return;
      
      // Check if click is outside popup and not on an explained word
      const clickedInsidePopup = e.target.closest('.vocab-word-popup');
      const clickedOnWord = e.target.closest('.vocab-word-explained');
      
      // Close popup if clicking outside both popup and word
      if (!clickedInsidePopup && !clickedOnWord) {
        // Use a longer delay to ensure the click event has fully processed
        setTimeout(() => {
          // Double-check that we still have sticky popups (in case they were closed by other means)
          const currentStickyPopups = document.querySelectorAll('.vocab-word-popup[data-sticky="true"]');
          if (currentStickyPopups.length > 0) {
            this.hideAllPopups();
          }
        }, 10);
      }
    }, false); // Use bubble phase instead of capture phase
    
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
      return result[storageKey] ?? false; // Default to false for new domains
    } catch (error) {
      console.error('[WordSelector] Error checking extension state:', error);
      return false; // Default to false on error
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
    
    console.log('[WordSelector] ===== DOUBLE CLICK EVENT =====');
    console.log('[WordSelector] Selected text:', selectedText);
    
    // Check if a word was selected
    if (!selectedText || selectedText.length === 0) {
      console.log('[WordSelector] No text selected');
      return;
    }
    
    // Only process single words (no spaces)
    if (/\s/.test(selectedText)) {
      console.log('[WordSelector] Multiple words selected, skipping');
      return;
    }
    
    // Get the range and validate
    if (selection.rangeCount === 0) {
      console.log('[WordSelector] No valid range');
      return;
    }
    
    const normalizedWord = selectedText.toLowerCase();
    console.log('[WordSelector] Original word:', selectedText);
    console.log('[WordSelector] Normalized word:', normalizedWord);
    
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
    
    console.log('[WordSelector] ✓ Word selected:', selectedText);
    console.log('[WordSelector] ✓ Normalized word stored:', normalizedWord);
    console.log('[WordSelector] ✓ Total selected words:', this.selectedWords.size);
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
    const normalizedWord = word.toLowerCase().trim();
    console.log(`[WordSelector] Adding word: "${word}" (normalized: "${normalizedWord}")`);
    this.selectedWords.add(normalizedWord); // O(1) operation
    console.log(`[WordSelector] Selected words now:`, Array.from(this.selectedWords));
    // Update button states
    ButtonPanel.updateButtonStatesFromSelections();
  },
  
  /**
   * Remove a word from the selected words set
   * @param {string} word - The word to remove
   */
  removeWord(word) {
    const normalizedWord = word.toLowerCase().trim();
    
    console.log(`[WordSelector] Removing word: "${word}" (normalized: "${normalizedWord}")`);
    
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
    console.log('[WordSelector] Selected words now:', Array.from(this.selectedWords));
    
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
    
    console.log('[WordSelector] ===== CREATING HIGHLIGHT =====');
    console.log('[WordSelector] Original word:', word);
    console.log('[WordSelector] Normalized word for data-word:', normalizedWord);
    
    // Create highlight wrapper
    const highlight = document.createElement('span');
    highlight.className = 'vocab-word-highlight';
    highlight.setAttribute('data-word', normalizedWord);
    highlight.setAttribute('data-highlight-id', `highlight-${this.highlightIdCounter++}`);
    
    console.log('[WordSelector] Highlight element created with data-word:', normalizedWord);
    
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
    
    console.log('[WordSelector] ✓ Highlight stored for normalized word:', normalizedWord);
    console.log('[WordSelector] ✓ Total highlights for this word:', this.wordToHighlights.get(normalizedWord).size);
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
    this.wordPositions.clear();
    this.explainedWords.clear();
    
    console.log('[WordSelector] All selections cleared');
    
    // Update button states
    ButtonPanel.updateButtonStatesFromSelections();
  },
  
  /**
   * Get full document text for position calculation
   * @returns {string} Full document text
   */
  getDocumentText() {
    return document.body.innerText || '';
  },
  
  /**
   * Find all positions of a word in the document
   * @param {string} word - The word to find
   * @returns {Array<number>} Array of character indices where word appears
   */
  findWordPositionsInDocument(word) {
    const docText = this.getDocumentText();
    const positions = [];
    const wordLower = word.toLowerCase();
    const docTextLower = docText.toLowerCase();
    
    // Find all occurrences
    let index = 0;
    while ((index = docTextLower.indexOf(wordLower, index)) !== -1) {
      // Check if it's a whole word (not part of another word)
      const before = index > 0 ? docText[index - 1] : ' ';
      const after = index + wordLower.length < docText.length ? docText[index + wordLower.length] : ' ';
      
      // Check if surrounded by non-word characters
      if (!/\w/.test(before) && !/\w/.test(after)) {
        positions.push(index);
      }
      index += wordLower.length;
    }
    
    return positions;
  },
  
  /**
   * Extract context around a word (10 words before and after)
   * @param {string} docText - Full document text
   * @param {number} wordIndex - Starting index of the word in document
   * @param {number} wordLength - Length of the word
   * @returns {Object} {text, textStartIndex, wordIndexInText}
   */
  extractWordContext(docText, wordIndex, wordLength) {
    console.log(`[WordSelector] extractWordContext: wordIndex=${wordIndex}, wordLength=${wordLength}`);
    
    // Split document into words (including whitespace for position tracking)
    const beforeText = docText.substring(0, wordIndex);
    const afterText = docText.substring(wordIndex + wordLength);
    
    // Get words before (up to 10)
    const wordsBeforeMatch = beforeText.match(/\S+/g) || [];
    const wordsBefore = wordsBeforeMatch.slice(-10);
    
    // Get words after (up to 10)
    const wordsAfterMatch = afterText.match(/\S+/g) || [];
    const wordsAfter = wordsAfterMatch.slice(0, 10);
    
    // Calculate the actual start index in document
    let textStartIndex = wordIndex;
    if (wordsBefore.length > 0) {
      // Find where the first of our 10 words before starts in the document
      // We need to find the actual position of the first word in our context
      const firstWord = wordsBefore[0];
      const lastOccurrence = beforeText.lastIndexOf(firstWord);
      
      if (lastOccurrence !== -1) {
        textStartIndex = lastOccurrence;
      } else {
        // Fallback: use wordIndex as start
        textStartIndex = wordIndex;
      }
    }
    
    // Build the context text
    const contextParts = [];
    if (wordsBefore.length > 0) {
      contextParts.push(wordsBefore.join(' '));
    }
    contextParts.push(docText.substring(wordIndex, wordIndex + wordLength));
    if (wordsAfter.length > 0) {
      contextParts.push(wordsAfter.join(' '));
    }
    
    const text = contextParts.join(' ');
    const wordIndexInText = wordsBefore.length > 0 ? wordsBefore.join(' ').length + 1 : 0;
    
    console.log(`[WordSelector] Context result: textStartIndex=${textStartIndex}, wordIndexInText=${wordIndexInText}`);
    console.log(`[WordSelector] Context text: "${text.substring(0, 100)}..."`);
    
    return {
      text,
      textStartIndex,
      wordIndexInText
    };
  },
  
  /**
   * Build API payload for word explanation
   * Algorithm: For each word, extract 10 words before and after. Merge overlapping contexts.
   * @returns {Array<Object>} Array of payload segments
   */
  buildWordsExplanationPayload() {
    console.log('[WordSelector] ===== Building Words Explanation Payload =====');
    const docText = this.getDocumentText();
    const selectedWordsArray = Array.from(this.selectedWords);
    
    console.log('[WordSelector] Selected words:', selectedWordsArray);
    console.log('[WordSelector] Document text length:', docText.length);
    
    // Build position data for each word
    const wordDataList = [];
    
    for (const word of selectedWordsArray) {
      console.log(`[WordSelector] Processing word: "${word}"`);
      const highlights = this.wordToHighlights.get(word);
      
      if (!highlights || highlights.size === 0) {
        console.warn(`[WordSelector] No highlights found for word: "${word}"`);
        continue;
      }
      
      console.log(`[WordSelector] Found ${highlights.size} highlight(s) for word: "${word}"`);
      
      // Find all positions of this word in document
      const positions = this.findWordPositionsInDocument(word);
      console.log(`[WordSelector] Found ${positions.length} position(s) in document for word: "${word}"`, positions);
      
      // For each highlight, find its position
      let highlightIndex = 0;
      highlights.forEach(highlight => {
        highlightIndex++;
        const highlightText = highlight.textContent.replace(/\s+/g, ' ').trim();
        console.log(`[WordSelector] Processing highlight #${highlightIndex} for "${word}": text="${highlightText}"`);
        
        // Try to match this highlight to a position
        // We'll use the first available position for simplicity
        if (positions.length > 0) {
          const position = positions.shift(); // Take first position
          const context = this.extractWordContext(docText, position, word.length);
          
          console.log(`[WordSelector] Assigned position ${position} to highlight #${highlightIndex}`);
          console.log(`[WordSelector] Context: textStartIndex=${context.textStartIndex}, text="${context.text.substring(0, 50)}..."`);
          
          wordDataList.push({
            word: word,
            textStartIndex: context.textStartIndex,
            text: context.text,
            wordIndexInContext: context.wordIndexInText,
            wordLength: word.length,
            highlight: highlight
          });
        } else {
          console.warn(`[WordSelector] No more positions available for highlight #${highlightIndex} of word "${word}"`);
        }
      });
    }
    
    console.log('[WordSelector] Total word data entries created:', wordDataList.length);
    
    // Sort by textStartIndex (document order)
    wordDataList.sort((a, b) => a.textStartIndex - b.textStartIndex);
    console.log('[WordSelector] Sorted word data by position');
    
    // Merge overlapping contexts
    const mergedSegments = [];
    let currentSegment = null;
    
    for (const wordData of wordDataList) {
      if (!currentSegment) {
        // Start new segment
        console.log(`[WordSelector] Starting new segment with word "${wordData.word}" at position ${wordData.textStartIndex}`);
        currentSegment = {
          textStartIndex: wordData.textStartIndex,
          text: wordData.text,
          important_words_location: [{
            word: wordData.word,
            index: wordData.wordIndexInContext,
            length: wordData.wordLength
          }],
          wordHighlights: [wordData.highlight]
        };
      } else {
        const currentEnd = currentSegment.textStartIndex + currentSegment.text.length;
        const newStart = wordData.textStartIndex;
        const newEnd = newStart + wordData.text.length;
        
        // Check if overlapping or adjacent
        if (newStart <= currentEnd + 20) { // Allow 20 char gap for merging
          console.log(`[WordSelector] Merging word "${wordData.word}" into current segment (overlap detected)`);
          // Merge: extend current segment
          const mergedStart = Math.min(currentSegment.textStartIndex, newStart);
          const mergedEnd = Math.max(currentEnd, newEnd);
          
          // Recalculate text from document
          currentSegment.text = docText.substring(mergedStart, mergedEnd);
          currentSegment.textStartIndex = mergedStart;
          
          // Add word location (recalculate index in merged text)
          const wordIndexInMerged = wordData.textStartIndex + wordData.wordIndexInContext - mergedStart;
          currentSegment.important_words_location.push({
            word: wordData.word,
            index: wordIndexInMerged,
            length: wordData.wordLength
          });
          currentSegment.wordHighlights.push(wordData.highlight);
        } else {
          // No overlap, save current and start new
          console.log(`[WordSelector] No overlap - saving current segment and starting new one for word "${wordData.word}"`);
          mergedSegments.push(currentSegment);
          currentSegment = {
            textStartIndex: wordData.textStartIndex,
            text: wordData.text,
            important_words_location: [{
              word: wordData.word,
              index: wordData.wordIndexInContext,
              length: wordData.wordLength
            }],
            wordHighlights: [wordData.highlight]
          };
        }
      }
    }
    
    // Add last segment
    if (currentSegment) {
      console.log('[WordSelector] Adding final segment');
      mergedSegments.push(currentSegment);
    }
    
    console.log(`[WordSelector] Created ${mergedSegments.length} merged segment(s)`);
    mergedSegments.forEach((segment, idx) => {
      console.log(`[WordSelector] Segment ${idx + 1}: textStartIndex=${segment.textStartIndex}, words=${segment.important_words_location.length}, highlights=${segment.wordHighlights.length}`);
      console.log(`[WordSelector] Segment ${idx + 1} words:`, segment.important_words_location.map(w => w.word));
    });
    
    // Return payload (remove wordHighlights from API payload, keep for internal use)
    const payload = mergedSegments.map(segment => ({
      textStartIndex: segment.textStartIndex,
      text: segment.text,
      important_words_location: segment.important_words_location,
      _wordHighlights: segment.wordHighlights // Keep for internal tracking
    }));
    
    console.log('[WordSelector] ===== Payload Build Complete =====');
    return payload;
  },
  
  /**
   * Create popup for word meaning
   * @param {string} word - The word
   * @param {string} meaning - The meaning
   * @param {Array<string>} examples - Example sentences
   * @param {boolean} shouldAllowFetchMoreExamples - Whether to show the "View more examples" button
   * @returns {HTMLElement} Popup element
   */
  createWordPopup(word, meaning, examples, shouldAllowFetchMoreExamples = true) {
    const popup = document.createElement('div');
    popup.className = 'vocab-word-popup';
    popup.setAttribute('data-word', word.toLowerCase());
    
    // Header
    const header = document.createElement('div');
    header.className = 'vocab-word-popup-header';
    header.textContent = 'Contextual Meaning';
    popup.appendChild(header);
    
    // Meaning
    const meaningDiv = document.createElement('div');
    meaningDiv.className = 'vocab-word-popup-meaning';
    meaningDiv.innerHTML = `<span class="word-bold">${word}</span> means ${meaning}`;
    popup.appendChild(meaningDiv);
    
    // Examples container
    const examplesContainer = document.createElement('div');
    examplesContainer.className = 'vocab-word-popup-examples-container';
    
    if (examples && examples.length > 0) {
      const examplesList = document.createElement('ul');
      examplesList.className = 'vocab-word-popup-examples';
      examplesList.id = `vocab-word-examples-${word.toLowerCase()}`;
      
      examples.forEach(example => {
        const li = document.createElement('li');
        // Bold the word in examples
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const highlightedExample = example.replace(regex, `<span class="word-bold">${word}</span>`);
        li.innerHTML = highlightedExample;
        examplesList.appendChild(li);
      });
      
      examplesContainer.appendChild(examplesList);
    }
    
    popup.appendChild(examplesContainer);
    
    // View more button - smaller, bottom-left positioned
    const button = document.createElement('button');
    button.className = 'vocab-word-popup-button';
    button.textContent = 'View more examples';
    button.setAttribute('data-word', word.toLowerCase());
    button.setAttribute('data-meaning', meaning);
    
    // Set initial button visibility based on shouldAllowFetchMoreExamples
    if (!shouldAllowFetchMoreExamples) {
      button.style.display = 'none';
    }
    
    button.addEventListener('click', async (e) => {
      e.stopPropagation();
      console.log('[WordSelector] View more examples clicked for:', word);
      await this.handleViewMoreExamples(word, meaning, examples, button);
    });
    popup.appendChild(button);
    
    return popup;
  },
  
  /**
   * Handle "View more examples" button click
   * @param {string} word - The word
   * @param {string} meaning - The meaning
   * @param {Array<string>} currentExamples - Current examples
   * @param {HTMLElement} button - The button element
   */
  async handleViewMoreExamples(word, meaning, currentExamples, button) {
    // Show loading state
    button.disabled = true;
    button.classList.add('loading');
    const originalText = button.textContent;
    button.textContent = 'Loading...';
    
    try {
      // Extract all currently displayed examples from the popup
      const examplesList = document.getElementById(`vocab-word-examples-${word.toLowerCase()}`);
      let allCurrentExamples = [];
      
      if (examplesList) {
        // Get all example text from the list items
        const listItems = examplesList.querySelectorAll('li');
        allCurrentExamples = Array.from(listItems).map(li => {
          // Remove the highlighting spans to get clean text
          const text = li.textContent || li.innerText;
          return text.trim();
        });
      }
      
      console.log('[WordSelector] Current examples in popup:', allCurrentExamples);
      console.log('[WordSelector] Original examples passed:', currentExamples);
      
      // Use all currently displayed examples for the API call
      const response = await WordExplanationService.getMoreExplanations(word, meaning, allCurrentExamples);
      
      if (response.success && response.data) {
        const newExamples = response.data.examples || [];
        const shouldAllowFetchMoreExamples = response.data.shouldAllowFetchMoreExamples || false;
        
        // Update the examples list in the popup
        const examplesList = document.getElementById(`vocab-word-examples-${word.toLowerCase()}`);
        if (examplesList) {
          // Clear existing examples
          examplesList.innerHTML = '';
          
          // Add all examples (old + new)
          newExamples.forEach(example => {
            const li = document.createElement('li');
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            const highlightedExample = example.replace(regex, `<span class="word-bold">${word}</span>`);
            li.innerHTML = highlightedExample;
            examplesList.appendChild(li);
          });
          
          console.log('[WordSelector] Updated examples for word:', word);
        }
        
        // Update button visibility based on shouldAllowFetchMoreExamples
        if (shouldAllowFetchMoreExamples) {
          button.style.display = 'block';
          button.disabled = false;
          button.classList.remove('disabled');
        } else {
          button.style.display = 'none';
        }
        
        // Update stored word data with new examples and shouldAllowFetchMoreExamples value
        const normalizedWord = word.toLowerCase();
        if (this.explainedWords.has(normalizedWord)) {
          const wordData = this.explainedWords.get(normalizedWord);
          wordData.examples = newExamples; // Update with all examples from API response
          wordData.shouldAllowFetchMoreExamples = shouldAllowFetchMoreExamples;
          wordData.hasCalledGetMoreExamples = true; // Mark that API has been called
          console.log('[WordSelector] Updated examples and shouldAllowFetchMoreExamples for word:', word);
          console.log('[WordSelector] New examples count:', newExamples.length);
          console.log('[WordSelector] shouldAllowFetchMoreExamples:', shouldAllowFetchMoreExamples);
          console.log('[WordSelector] hasCalledGetMoreExamples set to true');
        }
      } else {
        console.error('[WordSelector] Failed to get more examples:', response.error);
        TextSelector.showNotification('Failed to load more examples');
      }
    } catch (error) {
      console.error('[WordSelector] Error fetching more examples:', error);
      TextSelector.showNotification('Error loading more examples');
    } finally {
      // Reset button state
      button.classList.remove('loading');
      button.textContent = originalText;
    }
  },
  
  /**
   * Position popup relative to word highlight
   * @param {HTMLElement} popup - The popup element
   * @param {HTMLElement} wordElement - The word highlight element
   */
  positionPopup(popup, wordElement) {
    const rect = wordElement.getBoundingClientRect();
    const popupHeight = popup.offsetHeight || 250; // Estimated height
    const popupWidth = popup.offsetWidth || 340;
    
    // Calculate position (bottom-right of word, not overlapping)
    let top = rect.bottom + window.scrollY + 8; // 8px gap below word
    let left = rect.right + window.scrollX - popupWidth / 2; // Center horizontally with word
    
    // Adjust if popup goes off-screen
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Horizontal adjustment
    if (left + popupWidth > viewportWidth + window.scrollX) {
      left = viewportWidth + window.scrollX - popupWidth - 10;
    }
    if (left < window.scrollX + 10) {
      left = window.scrollX + 10;
    }
    
    // Vertical adjustment (if not enough space below, show above)
    if (rect.bottom + popupHeight > viewportHeight + window.scrollY) {
      top = rect.top + window.scrollY - popupHeight - 8; // Show above
    }
    
    popup.style.top = `${top}px`;
    popup.style.left = `${left}px`;
  },
  
  /**
   * Show popup for word (hover or click)
   * @param {HTMLElement} wordElement - The word highlight element
   * @param {boolean} sticky - Whether popup should stay (click) or disappear on mouseleave (hover)
   */
  showWordPopup(wordElement, sticky = false) {
    // Remove any existing popups
    this.hideAllPopups();
    
    const word = wordElement.textContent.trim();
    const normalizedWord = word.toLowerCase();
    
    // Get word data from explainedWords map (this contains the most up-to-date data)
    let wordData = null;
    let meaning = '';
    let examples = [];
    let shouldAllowFetchMoreExamples = true; // Default to true
    
    if (this.explainedWords.has(normalizedWord)) {
      wordData = this.explainedWords.get(normalizedWord);
      meaning = wordData.meaning;
      examples = wordData.examples || [];
      
      // If get-more-explanations API has been called, use the field from response
      // Otherwise, show button by default
      if (wordData.hasCalledGetMoreExamples) {
        shouldAllowFetchMoreExamples = wordData.shouldAllowFetchMoreExamples || false;
      } else {
        shouldAllowFetchMoreExamples = true; // Show by default before first API call
      }
      
      console.log(`[WordSelector] Using updated data from explainedWords for "${word}":`, {
        meaning: meaning,
        examplesCount: examples.length,
        shouldAllowFetchMoreExamples: shouldAllowFetchMoreExamples,
        hasCalledGetMoreExamples: wordData.hasCalledGetMoreExamples
      });
    } else {
      // Fallback to DOM attributes if not found in explainedWords (shouldn't happen normally)
      console.warn(`[WordSelector] Word "${word}" not found in explainedWords, using DOM attributes as fallback`);
      meaning = wordElement.getAttribute('data-meaning');
      const examplesJson = wordElement.getAttribute('data-examples');
      
      if (!meaning) return;
      
      try {
        examples = JSON.parse(examplesJson) || [];
      } catch (e) {
        console.error('[WordSelector] Error parsing examples:', e);
      }
    }
    
    if (!meaning) return;
    
    // Create popup
    const popup = this.createWordPopup(word, meaning, examples, shouldAllowFetchMoreExamples);
    
    // Mark as sticky or not
    if (sticky) {
      popup.classList.add('sticky');
      popup.setAttribute('data-sticky', 'true');
    } else {
      popup.setAttribute('data-sticky', 'false');
    }
    
    // Append to body
    document.body.appendChild(popup);
    
    // Position it
    setTimeout(() => {
      this.positionPopup(popup, wordElement);
      popup.classList.add('visible');
    }, 10);
    
    // Store reference
    wordElement.setAttribute('data-popup-id', 'active');
    
    // Add mouse event handlers to prevent popup from closing when moving cursor into it
    if (sticky) {
      popup.addEventListener('mouseenter', (e) => {
        e.stopPropagation();
        console.log('[WordSelector] Mouse entered sticky popup');
      });
      
      popup.addEventListener('mouseleave', (e) => {
        e.stopPropagation();
        console.log('[WordSelector] Mouse left sticky popup');
      });
      
      popup.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('[WordSelector] Clicked inside sticky popup');
      });
    }
    
    // If not sticky (hover mode), hide on mouseleave with delay
    if (!sticky) {
      let hideTimeout = null;
      
      const scheduleHide = () => {
        hideTimeout = setTimeout(() => {
          // Double-check it's still not sticky
          if (popup.getAttribute('data-sticky') !== 'true') {
            this.hideAllPopups();
          }
        }, 200); // 200ms delay to allow moving mouse to popup
      };
      
      const cancelHide = () => {
        if (hideTimeout) {
          clearTimeout(hideTimeout);
          hideTimeout = null;
        }
      };
      
      // Hide when leaving word element
      wordElement.addEventListener('mouseleave', scheduleHide, { once: true });
      
      // Cancel hide when entering popup
      popup.addEventListener('mouseenter', () => {
        cancelHide();
      });
      
      // Schedule hide when leaving popup (only if not sticky)
      popup.addEventListener('mouseleave', () => {
        if (popup.getAttribute('data-sticky') !== 'true') {
          scheduleHide();
        }
      });
    }
    // If sticky, popup will only close on outside click (handled by global click listener)
  },
  
  /**
   * Hide all popups
   */
  hideAllPopups() {
    const popups = document.querySelectorAll('.vocab-word-popup');
    popups.forEach(popup => {
      popup.classList.remove('visible');
      setTimeout(() => popup.remove(), 200);
    });
    
    // Clear popup references
    document.querySelectorAll('[data-popup-id="active"]').forEach(el => {
      el.removeAttribute('data-popup-id');
    });
  },
  
  /**
   * Setup interaction handlers for explained words
   * This should be called after a word is explained
   * @param {HTMLElement} wordElement - The word highlight element
   */
  setupWordInteractions(wordElement) {
    // Hover: show popup (non-sticky) only if no popup is currently active
    wordElement.addEventListener('mouseenter', () => {
      if (!wordElement.classList.contains('vocab-word-explained')) return;
      
      // Don't show hover popup if a sticky popup is already visible
      const activeStickyPopup = document.querySelector('.vocab-word-popup[data-sticky="true"]');
      if (activeStickyPopup) return;
      
      if (wordElement.getAttribute('data-popup-id') === 'active') return; // Already showing
      
      this.showWordPopup(wordElement, false);
    });
    
    // Click event handler removed - green background words no longer respond to clicks
  },
  
  /**
   * Create a green wireframe cross button for removing explained words
   * @param {string} word - The word this button will remove
   * @returns {HTMLElement}
   */
  createRemoveExplainedButton(word) {
    const normalizedWord = word.toLowerCase().trim();
    const btn = document.createElement('button');
    btn.className = 'vocab-word-remove-explained-btn';
    btn.setAttribute('aria-label', `Remove explanation for "${word}"`);
    btn.innerHTML = this.createGreenCrossIcon();
    
    // Add click handler - use normalized word for consistent lookup
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log(`[WordSelector] Green cross button clicked for word: "${word}" (normalized: "${normalizedWord}")`);
      this.removeExplainedWord(normalizedWord);
    });
    
    return btn;
  },
  
  /**
   * Create green wireframe cross icon SVG
   * @returns {string} SVG markup
   */
  createGreenCrossIcon() {
    return `
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 2L12 12M12 2L2 12" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  },
  
  /**
   * Remove an explained word (remove green background and from explainedWords container)
   * @param {string} word - The word to remove
   */
  removeExplainedWord(word) {
    const normalizedWord = word.toLowerCase().trim();
    
    console.log('[WordSelector] ===== REMOVING EXPLAINED WORD =====');
    console.log('[WordSelector] Original word:', word);
    console.log('[WordSelector] Normalized word:', normalizedWord);
    console.log('[WordSelector] Available explained words:', Array.from(this.explainedWords.keys()));
    
    // Get the word data from explainedWords
    const wordData = this.explainedWords.get(normalizedWord);
    
    if (!wordData) {
      console.warn('[WordSelector] ✗ Word not found in explainedWords:', normalizedWord);
      console.warn('[WordSelector] Available keys:', Array.from(this.explainedWords.keys()));
      return;
    }
    
    console.log('[WordSelector] ✓ Found word data in explainedWords:', wordData);
    
    // Remove green background and buttons from all highlights
    if (wordData.highlights) {
      wordData.highlights.forEach(highlight => {
        // Remove the green explained class
        highlight.classList.remove('vocab-word-explained');
        
        // Remove the green cross button
        const greenBtn = highlight.querySelector('.vocab-word-remove-explained-btn');
        if (greenBtn) {
          greenBtn.remove();
        }
        
        // Remove data attributes
        highlight.removeAttribute('data-meaning');
        highlight.removeAttribute('data-examples');
        highlight.removeAttribute('data-popup-id');
        
        // Remove the highlight wrapper completely
        const parent = highlight.parentNode;
        if (parent) {
          // Move all child nodes out of the highlight wrapper
          while (highlight.firstChild) {
            parent.insertBefore(highlight.firstChild, highlight);
          }
          // Remove the empty highlight wrapper
          highlight.remove();
          // Normalize parent to merge text nodes
          parent.normalize();
        }
      });
    }
    
    // Remove from explainedWords Map
    this.explainedWords.delete(normalizedWord);
    
    // Remove from wordToHighlights Map
    this.wordToHighlights.delete(normalizedWord);
    
    // Hide any open popups for this word
    this.hideAllPopups();
    
    console.log('[WordSelector] Explained word removed:', word);
    console.log('[WordSelector] Remaining explained words:', this.explainedWords.size);
    
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
        display: inline;
        background-color: rgba(149, 39, 245, 0.15);
        padding: 0 4px;
        border-radius: 4px;
        transition: background-color 0.2s ease;
        cursor: pointer;
        line-height: inherit;
        box-decoration-break: clone;
        -webkit-box-decoration-break: clone;
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
      
      /* Pulsating purple animation for words being processed */
      @keyframes vocab-word-loading-breathe {
        0%, 100% {
          background-color: rgba(149, 39, 245, 0.15);
        }
        50% {
          background-color: rgba(149, 39, 245, 0.35);
        }
      }
      
      .vocab-word-loading {
        animation: vocab-word-loading-breathe 1.5s ease-in-out infinite;
      }
      
      /* Green background for explained words */
      .vocab-word-explained {
        background-color: rgba(34, 197, 94, 0.20) !important;
        cursor: pointer;
      }
      
      .vocab-word-explained:hover {
        background-color: rgba(34, 197, 94, 0.30) !important;
      }
      
      /* Green cross button for explained words - no circle, just cross */
      .vocab-word-remove-explained-btn {
        position: absolute;
        top: -8px;
        right: -8px;
        width: 16px;
        height: 16px;
        background: transparent;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 0.8;
        transition: opacity 0.2s ease, transform 0.1s ease;
        padding: 0;
        z-index: 999999;
        filter: drop-shadow(0 1px 2px rgba(34, 197, 94, 0.4));
      }
      
      .vocab-word-explained:hover .vocab-word-remove-explained-btn {
        opacity: 1;
      }
      
      .vocab-word-remove-explained-btn:hover {
        transform: scale(1.2);
        opacity: 1;
      }
      
      .vocab-word-remove-explained-btn:active {
        transform: scale(0.9);
      }
      
      .vocab-word-remove-explained-btn svg {
        pointer-events: none;
        display: block;
        width: 14px;
        height: 14px;
      }
      
      /* Contextual Meaning Popup Card */
      .vocab-word-popup {
        position: absolute;
        background: white;
        border-radius: 14px;
        padding: 18px 20px;
        box-shadow: 0 8px 24px rgba(149, 39, 245, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1);
        z-index: 9999999;
        max-width: 380px;
        min-width: 300px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        opacity: 0;
        transform: translateY(-5px);
        transition: opacity 0.2s ease, transform 0.2s ease;
        pointer-events: none;
      }
      
      .vocab-word-popup.visible {
        opacity: 1;
        transform: translateY(0);
        pointer-events: all;
      }
      
      .vocab-word-popup.sticky {
        pointer-events: all;
      }
      
      .vocab-word-popup-header {
        text-align: center;
        color: #A020F0;
        font-weight: 600;
        font-size: 16px;
        margin-bottom: 14px;
      }
      
      .vocab-word-popup-meaning {
        color: #333;
        font-size: 15px;
        line-height: 1.5;
        margin-bottom: 14px;
      }
      
      .vocab-word-popup-meaning .word-bold {
        font-weight: 600;
        color: #A020F0;
      }
      
      /* Examples container with scrolling */
      .vocab-word-popup-examples-container {
        max-height: 200px;
        overflow-y: auto;
        margin-bottom: 12px;
      }
      
      .vocab-word-popup-examples-container::-webkit-scrollbar {
        width: 4px;
      }
      
      .vocab-word-popup-examples-container::-webkit-scrollbar-track {
        background: #f3f4f6;
        border-radius: 2px;
      }
      
      .vocab-word-popup-examples-container::-webkit-scrollbar-thumb {
        background: #D097FF;
        border-radius: 2px;
      }
      
      .vocab-word-popup-examples {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      
      .vocab-word-popup-examples li {
        position: relative;
        padding-left: 18px;
        margin-bottom: 10px;
        color: #333;
        font-size: 14px;
        line-height: 1.4;
      }
      
      .vocab-word-popup-examples li:last-child {
        margin-bottom: 0;
      }
      
      .vocab-word-popup-examples li:before {
        content: '';
        position: absolute;
        left: 0;
        top: 7px;
        width: 6px;
        height: 6px;
        background: #A020F0;
        border-radius: 50%;
      }
      
      .vocab-word-popup-examples li .word-bold {
        font-weight: 600;
        color: #A020F0;
      }
      
      /* View more button - smaller, bottom-left positioned */
      .vocab-word-popup-button {
        padding: 6px 14px;
        border: 1.5px solid #A020F0;
        border-radius: 10px;
        background: white;
        color: #A020F0;
        font-weight: 500;
        font-size: 12px;
        cursor: pointer;
        transition: background-color 0.2s ease, color 0.2s ease, opacity 0.2s ease;
        text-align: center;
        align-self: flex-start;
        position: relative;
      }
      
      .vocab-word-popup-button:hover:not(.loading) {
        background: rgba(160, 32, 240, 0.1);
      }
      
      .vocab-word-popup-button:active:not(.loading) {
        background: rgba(160, 32, 240, 0.2);
      }
      
      .vocab-word-popup-button.loading {
        opacity: 0.6;
        cursor: not-allowed;
      }
      
      .vocab-word-popup-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      
      /* Close button for sticky popup */
      .vocab-word-popup-close {
        position: absolute;
        top: 12px;
        right: 12px;
        width: 24px;
        height: 24px;
        border: none;
        background: rgba(160, 32, 240, 0.1);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 0.7;
        transition: opacity 0.2s ease, background-color 0.2s ease;
      }
      
      .vocab-word-popup-close:hover {
        opacity: 1;
        background: rgba(160, 32, 240, 0.2);
      }
      
      .vocab-word-popup-close svg {
        width: 12px;
        height: 12px;
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
  simplifiedTexts: new Map(), // Map of textKey -> {textStartIndex, textLength, text, simplifiedText, previousSimplifiedTexts, shouldAllowSimplifyMore}
  
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
      return result[storageKey] ?? false; // Default to false for new domains
    } catch (error) {
      console.error('[TextSelector] Error checking extension state:', error);
      return false; // Default to false on error
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
    
    // Add click handler
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      console.log('[TextSelector] Book icon clicked for:', textKey);
      
      // Get simplified text data
      const simplifiedData = this.simplifiedTexts.get(textKey);
      if (simplifiedData) {
        // Pulsate the text
        const highlight = this.textToHighlights.get(textKey);
        if (highlight) {
          this.pulsateText(highlight, true);
        }
        
        // Open ChatDialog in simplified mode
        ChatDialog.open(simplifiedData.text, textKey, 'simplified', simplifiedData);
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
      /* Smooth icon appearance animation - slide from left */
      @keyframes vocab-icon-appear {
        0% {
          opacity: 0;
          transform: translateX(-15px) scale(0.8);
        }
        60% {
          transform: translateX(0) scale(1.05);
        }
        100% {
          opacity: 0.95;
          transform: translateX(0) scale(1);
        }
      }
      
      .vocab-text-chat-btn {
        position: absolute;
        top: -12px;
        left: -32px;
        width: 24px;
        height: 24px;
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
        animation: vocab-icon-appear 0.4s ease-out;
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
        width: 24px;
        height: 24px;
      }
      
      /* Book button - Wireframe open book icon on top-left */
      .vocab-text-book-btn {
        position: absolute;
        top: -12px;
        left: -32px;
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
        animation: vocab-icon-appear 0.4s ease-out;
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
      
      /* Loading animation - pulsating light purple background */
      @keyframes vocab-text-loading-breathe {
        0%, 100% {
          background-color: transparent;
        }
        50% {
          background-color: rgba(149, 39, 245, 0.15);
        }
      }
      
      .vocab-text-loading {
        animation: vocab-text-loading-breathe 2s ease-in-out infinite;
        text-decoration: none !important;
        border-radius: 3px;
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
  chatHistories: new Map(), // Store chat history for each textKey
  mode: 'ask', // 'ask' or 'simplified'
  simplifiedData: null, // For simplified mode
  isSimplifying: false, // Track if currently simplifying more
  
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
   * @param {string} mode - The dialog mode: 'ask' or 'simplified'
   * @param {Object} simplifiedData - Simplified text data (for simplified mode)
   */
  open(text, textKey, mode = 'ask', simplifiedData = null) {
    // If dialog is already open for the same text
    if (this.isOpen && this.currentTextKey === textKey) {
      // If opening in simplified mode and already open for same text
      if (mode === 'simplified') {
        // Do nothing - popup is already open for this text
        console.log('[ChatDialog] Already open for this text, doing nothing');
        return;
      }
      // If opening in 'ask' mode, just switch to ask tab
      else {
        this.switchTab('ask');
      }
      return; // Don't re-create the dialog
    }
    
    // If dialog is open for different text, close it first
    if (this.isOpen) {
      this.close();
      // Wait for close animation to complete
      setTimeout(() => {
        this.openDialog(text, textKey, mode, simplifiedData);
      }, 350);
    } else {
      // Dialog is not open, open it
      this.openDialog(text, textKey, mode, simplifiedData);
    }
  },
  
  /**
   * Internal method to open dialog
   * @param {string} text - The selected text
   * @param {string} textKey - The text key for identification
   * @param {string} mode - The dialog mode: 'ask' or 'simplified'
   * @param {Object} simplifiedData - Simplified text data (for simplified mode)
   */
  openDialog(text, textKey, mode = 'ask', simplifiedData = null) {
    this.currentText = text;
    this.currentTextKey = textKey;
    
    // Load existing chat history for this text, or create new empty array
    this.chatHistory = this.chatHistories.get(textKey) || [];
    
    this.mode = mode;
    this.simplifiedData = simplifiedData;
    
    this.createDialog();
    this.show();
    
    console.log('[ChatDialog] Opened in', mode, 'mode for text:', text.substring(0, 50) + '...');
    console.log('[ChatDialog] Loaded', this.chatHistory.length, 'chat messages');
  },
  
  /**
   * Close chat dialog
   */
  close() {
    if (!this.isOpen) return;
    
    // Save chat history before closing
    if (this.currentTextKey && this.chatHistory.length > 0) {
      this.chatHistories.set(this.currentTextKey, [...this.chatHistory]);
      console.log('[ChatDialog] Saved', this.chatHistory.length, 'chat messages for', this.currentTextKey);
    }
    
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
    
    // Create left side button container (collapse and delete buttons stacked vertically)
    const leftButtonContainer = document.createElement('div');
    leftButtonContainer.className = 'vocab-chat-left-buttons';
    
    // Create collapse button (smaller size)
    const collapseBtn = document.createElement('button');
    collapseBtn.className = 'vocab-chat-collapse-btn-small';
    collapseBtn.setAttribute('aria-label', 'Close chat');
    collapseBtn.innerHTML = this.createCollapseIcon();
    collapseBtn.addEventListener('click', () => this.close());
    
    leftButtonContainer.appendChild(collapseBtn);
    
    // Create focus button for top right corner
    const focusButton = document.createElement('button');
    focusButton.className = 'vocab-chat-focus-btn-top-right';
    focusButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
        <path d="M3 10l7-7v4c7 0 7 6 7 6s-3-3-7-3v4l-7-7z" fill="#9527F5"/>
      </svg>
      <span>Focus</span>
    `;
    
    // Add click handler for focus button
    focusButton.addEventListener('click', () => {
      if (this.currentTextKey) {
        const highlight = TextSelector.textToHighlights.get(this.currentTextKey);
        if (highlight) {
          // First scroll to the element
          highlight.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
          // Then move to asked texts and pulsate
          setTimeout(() => {
            TextSelector.moveToAskedTexts(this.currentTextKey);
          }, 300); // Small delay to let scroll complete
        }
      }
    });
    
    // Create content area
    const contentArea = document.createElement('div');
    contentArea.className = 'vocab-chat-content-area';
    
    // Create ask/chat content
    const askContent = this.createAskContent();
    contentArea.appendChild(askContent);
    
    // Create input area
    const inputArea = this.createInputArea();
    
    // Create resize handles
    const resizeHandles = this.createResizeHandles();
    
    // Assemble dialog
    dialogContent.appendChild(leftButtonContainer);
    dialogContent.appendChild(focusButton);
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
    
    // First tab: "Original text" for ask mode, "Simplified" for simplified mode
    const firstTab = document.createElement('button');
    
    if (this.mode === 'simplified') {
      // In simplified mode, first tab is "Simplified" and is active
      firstTab.className = 'vocab-chat-tab active';
      firstTab.setAttribute('data-tab', 'simplified');
      firstTab.textContent = 'SIMPLIFIED';
      firstTab.addEventListener('click', () => this.switchTab('simplified'));
    } else {
      // In ask mode, first tab is "Original text" and is not active
      firstTab.className = 'vocab-chat-tab';
      firstTab.setAttribute('data-tab', 'original-text');
      firstTab.textContent = 'ORIGINAL TEXT';
      firstTab.addEventListener('click', () => this.switchTab('original-text'));
    }
    
    // Second tab: Always "Chat"
    const chatTab = document.createElement('button');
    // Chat tab is active in ask mode, not active in simplified mode
    chatTab.className = this.mode === 'simplified' ? 'vocab-chat-tab' : 'vocab-chat-tab active';
    chatTab.setAttribute('data-tab', 'ask');
    chatTab.textContent = 'CHAT';
    chatTab.addEventListener('click', () => this.switchTab('ask'));
    
    // Create sliding indicator
    const indicator = document.createElement('div');
    indicator.className = 'vocab-chat-tab-indicator';
    indicator.id = 'vocab-chat-tab-indicator';
    
    tabsContainer.appendChild(firstTab);
    tabsContainer.appendChild(chatTab);
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
   * Create simplified text content
   */
  createSimplifiedContent() {
    const content = document.createElement('div');
    // In simplified mode, this content is active/visible; in ask mode, it's hidden
    content.className = this.mode === 'simplified' ? 'vocab-chat-tab-content active' : 'vocab-chat-tab-content';
    content.setAttribute('data-content', 'simplified');
    if (this.mode !== 'simplified') {
      content.style.display = 'none';
    }
    
    // Create focus button container
    const focusButtonContainer = document.createElement('div');
    focusButtonContainer.className = 'vocab-chat-focus-btn-container';
    
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
    
    focusButtonContainer.appendChild(focusButton);
    
    // Container for all simplified explanations
    const explanationsContainer = document.createElement('div');
    explanationsContainer.id = 'vocab-chat-simplified-container';
    
    // Build all simplified explanations (current + previous)
    this.renderSimplifiedExplanations(explanationsContainer);
    
    // Create "Simplify more" button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'vocab-chat-simplify-more-container';
    
    const simplifyMoreBtn = document.createElement('button');
    simplifyMoreBtn.className = 'vocab-chat-simplify-more-btn';
    simplifyMoreBtn.textContent = 'Simplify more';
    simplifyMoreBtn.id = 'vocab-chat-simplify-more-btn';
    
    // Set initial disabled state based on shouldAllowSimplifyMore
    if (this.simplifiedData && this.simplifiedData.shouldAllowSimplifyMore) {
      simplifyMoreBtn.disabled = false;
    } else {
      simplifyMoreBtn.disabled = true;
      simplifyMoreBtn.classList.add('disabled');
    }
    
    // Add click handler
    simplifyMoreBtn.addEventListener('click', () => this.handleSimplifyMore());
    
    buttonContainer.appendChild(simplifyMoreBtn);
    
    content.appendChild(focusButtonContainer);
    content.appendChild(explanationsContainer);
    content.appendChild(buttonContainer);
    
    return content;
  },
  
  /**
   * Render all simplified explanations with headers
   * @param {HTMLElement} container - Container element to render into
   */
  renderSimplifiedExplanations(container) {
    if (!this.simplifiedData) return;
    
    container.innerHTML = '';
    
    // Get all explanations (previous + current)
    const allExplanations = [
      ...(this.simplifiedData.previousSimplifiedTexts || []),
      this.simplifiedData.simplifiedText
    ];
    
    // Render each explanation with header
    allExplanations.forEach((explanation, index) => {
      const item = document.createElement('div');
      item.className = 'vocab-chat-simplified-item';
      
      // Create header
      const header = document.createElement('div');
      header.className = 'vocab-chat-simplified-header';
      header.textContent = `Simplified explanation ${index + 1}`;
      
      // Create text display
      const textDisplay = document.createElement('div');
      textDisplay.className = 'vocab-chat-simplified-text';
      textDisplay.textContent = explanation;
      
      item.appendChild(header);
      item.appendChild(textDisplay);
      container.appendChild(item);
    });
  },
  
  /**
   * Handle "Simplify more" button click
   */
  async handleSimplifyMore() {
    if (!this.simplifiedData || !this.currentTextKey) return;
    if (this.isSimplifying) return;
    
    console.log('[ChatDialog] Simplify more clicked');
    
    this.isSimplifying = true;
    
    // Disable button and show loading state
    const simplifyMoreBtn = document.getElementById('vocab-chat-simplify-more-btn');
    if (simplifyMoreBtn) {
      simplifyMoreBtn.disabled = true;
      simplifyMoreBtn.classList.add('disabled', 'loading');
      simplifyMoreBtn.textContent = 'Simplifying...';
    }
    
    // Build API request with previous simplified text
    const previousSimplifiedTexts = [
      ...this.simplifiedData.previousSimplifiedTexts,
      this.simplifiedData.simplifiedText
    ];
    
    const textSegments = [{
      textStartIndex: this.simplifiedData.textStartIndex,
      textLength: this.simplifiedData.textLength,
      text: this.simplifiedData.text,
      previousSimplifiedTexts: previousSimplifiedTexts
    }];
    
    // Call SimplifyService
    SimplifyService.simplify(
      textSegments,
      // onEvent callback
      (eventData) => {
        console.log('[ChatDialog] Received new simplified text:', eventData);
        
        // Update simplified data
        this.simplifiedData = {
          textStartIndex: eventData.textStartIndex,
          textLength: eventData.textLength,
          text: eventData.text,
          simplifiedText: eventData.simplifiedText,
          previousSimplifiedTexts: eventData.previousSimplifiedTexts || previousSimplifiedTexts,
          shouldAllowSimplifyMore: eventData.shouldAllowSimplifyMore || false
        };
        
        // Update stored data
        TextSelector.simplifiedTexts.set(this.currentTextKey, this.simplifiedData);
        
        // Update UI - re-render all explanations
        const container = this.dialogContainer.querySelector('#vocab-chat-simplified-container');
        if (container) {
          this.renderSimplifiedExplanations(container);
        }
        
        // Reset button
        if (simplifyMoreBtn) {
          simplifyMoreBtn.classList.remove('loading');
          simplifyMoreBtn.textContent = 'Simplify more';
          
          if (this.simplifiedData.shouldAllowSimplifyMore) {
            simplifyMoreBtn.disabled = false;
            simplifyMoreBtn.classList.remove('disabled');
          } else {
            simplifyMoreBtn.disabled = true;
            simplifyMoreBtn.classList.add('disabled');
          }
        }
        
        this.isSimplifying = false;
      },
      // onComplete callback
      () => {
        console.log('[ChatDialog] Simplification complete');
        this.isSimplifying = false;
      },
      // onError callback
      (error) => {
        console.error('[ChatDialog] Error during simplification:', error);
        
        // Reset button
        if (simplifyMoreBtn) {
          simplifyMoreBtn.classList.remove('loading');
          simplifyMoreBtn.textContent = 'Simplify more';
        }
        
        this.isSimplifying = false;
        
        // Show error
        TextSelector.showNotification('Error simplifying text. Please try again.');
      }
    );
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
    
    // If we have existing chat history, render it
    if (this.chatHistory && this.chatHistory.length > 0) {
      this.chatHistory.forEach(item => {
        this.renderChatMessage(chatContainer, item.type, item.message);
      });
      
      // Update delete button visibility and scroll to bottom after rendering
      setTimeout(() => {
        this.updateGlobalClearButton();
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }, 10);
    } else {
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
    }
    
    content.appendChild(chatContainer);
    
    return content;
  },
  
  /**
   * Render a chat message in the container
   * @param {HTMLElement} container - Container element
   * @param {string} type - Message type ('user' or 'assistant')
   * @param {string} message - Message content
   */
  renderChatMessage(container, type, message) {
    // Create message bubble with correct class names
    const messageBubble = document.createElement('div');
    messageBubble.className = `vocab-chat-message vocab-chat-message-${type}`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'vocab-chat-message-content';
    
    // For AI messages, render markdown; for user messages, use textContent
    if (type === 'ai') {
      messageContent.innerHTML = this.renderMarkdown(message);
    } else {
      messageContent.textContent = message;
    }
    
    messageBubble.appendChild(messageContent);
    container.appendChild(messageBubble);
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
    
    // Auto-resize textarea with scroll when max height reached
    inputField.addEventListener('input', (e) => {
      e.target.style.height = 'auto';
      const maxHeight = 120; // Maximum height in pixels
      const newHeight = Math.min(e.target.scrollHeight, maxHeight);
      e.target.style.height = newHeight + 'px';
      
      // Add scroll when max height is reached
      if (e.target.scrollHeight > maxHeight) {
        e.target.style.overflowY = 'auto';
      } else {
        e.target.style.overflowY = 'hidden';
      }
    });
    
    // Handle Enter key (Shift+Enter for new line)
    inputField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
    
    // Create send button (restore original styling but same size as delete)
    const sendBtn = document.createElement('button');
    sendBtn.className = 'vocab-chat-send-btn';
    sendBtn.setAttribute('aria-label', 'Send message');
    sendBtn.innerHTML = this.createSendIcon();
    sendBtn.addEventListener('click', () => this.sendMessage());
    
    // Create delete button (same size as send button)
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'vocab-chat-delete-conversation-btn';
    deleteBtn.id = 'vocab-chat-delete-conversation-btn';
    deleteBtn.setAttribute('aria-label', 'Delete conversation');
    deleteBtn.title = 'Delete conversation';
    deleteBtn.innerHTML = this.createTrashIcon();
    deleteBtn.style.display = 'none'; // Hidden by default
    deleteBtn.addEventListener('click', () => this.deleteConversation());
    
    inputArea.appendChild(inputField);
    inputArea.appendChild(sendBtn);
    inputArea.appendChild(deleteBtn);
    
    return inputArea;
  },
  
  /**
   * Switch between tabs (no-op since tabs are removed)
   * @param {string} tabName - Tab name (ignored)
   */
  switchTab(tabName) {
    // No-op since we removed the tab system
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
    
    // Capture the current textKey and text at the time of making the request
    // This ensures the response goes to the correct chat even if user switches tabs
    const requestTextKey = this.currentTextKey;
    const requestText = this.currentText;
    
    // Prepare chat history from chatHistory
    const chat_history = this.chatHistory.map(item => ({
      role: item.type === 'user' ? 'user' : 'assistant',
      content: item.message
    }));
    
    try {
      // Call API
      const response = await ApiService.ask({
        initial_context: requestText,
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
        
        // Check if we're still in the same chat tab that initiated the request
        if (this.currentTextKey === requestTextKey) {
          // We're still in the same chat, add the response normally
          this.addMessageToChat('ai', aiResponse);
        } else {
          // User switched to a different chat tab, add response to the correct chat history
          console.log('[ChatDialog] User switched tabs, adding response to correct chat history for textKey:', requestTextKey);
          
          // Get the chat history for the original textKey
          const originalChatHistory = this.chatHistories.get(requestTextKey) || [];
          
          // Add the user message and AI response to the original chat history
          originalChatHistory.push({
            type: 'user',
            message: message,
            timestamp: new Date().toISOString()
          });
          originalChatHistory.push({
            type: 'ai',
            message: aiResponse,
            timestamp: new Date().toISOString()
          });
          
          // Update the stored chat history
          this.chatHistories.set(requestTextKey, originalChatHistory);
          
          // If the original chat is currently open, update its display
          if (this.isOpen && this.currentTextKey === requestTextKey) {
            this.addMessageToChat('ai', aiResponse);
          }
        }
      } else {
        // Handle error case - check if we're still in the same chat
        if (this.currentTextKey === requestTextKey) {
          this.addMessageToChat('ai', `⚠️ **Error:**\n\n${response.error}`);
        } else {
          // Add error to the original chat history
          const originalChatHistory = this.chatHistories.get(requestTextKey) || [];
          originalChatHistory.push({
            type: 'user',
            message: message,
            timestamp: new Date().toISOString()
          });
          originalChatHistory.push({
            type: 'ai',
            message: `⚠️ **Error:**\n\n${response.error}`,
            timestamp: new Date().toISOString()
          });
          this.chatHistories.set(requestTextKey, originalChatHistory);
        }
      }
    } catch (error) {
      console.error('[ChatDialog] Error sending message:', error);
      this.removeLoadingAnimation();
      
      // Handle error case - check if we're still in the same chat
      if (this.currentTextKey === requestTextKey) {
        this.addMessageToChat('ai', `Error: Failed to get response from server`);
      } else {
        // Add error to the original chat history
        const originalChatHistory = this.chatHistories.get(requestTextKey) || [];
        originalChatHistory.push({
          type: 'user',
          message: message,
          timestamp: new Date().toISOString()
        });
        originalChatHistory.push({
          type: 'ai',
          message: `Error: Failed to get response from server`,
          timestamp: new Date().toISOString()
        });
        this.chatHistories.set(requestTextKey, originalChatHistory);
      }
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
    const messageData = { type, message, timestamp: new Date().toISOString() };
    this.chatHistory.push(messageData);
    
    // Also update the stored chat history for this textKey
    if (this.currentTextKey) {
      this.chatHistories.set(this.currentTextKey, [...this.chatHistory]);
    }
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
   * Delete the conversation history (clear chat messages)
   */
  deleteConversation() {
    if (!this.currentTextKey) return;
    
    // Clear the current chat history
    this.chatHistory = [];
    
    // Clear the stored chat history for this textKey
    this.chatHistories.set(this.currentTextKey, []);
    
    // Clear the chat display
    this.clearChat();
    
    console.log('[ChatDialog] Conversation history cleared for textKey:', this.currentTextKey);
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
      /* Global button underline prevention */
      button, .vocab-btn, .vocab-chat-tab, .vocab-chat-focus-btn, .vocab-chat-send-btn, .vocab-chat-delete-conversation-btn, .vocab-chat-collapse-btn, .vocab-chat-simplify-more-btn, .vocab-chat-collapse-btn-small, .vocab-chat-delete-conversation-btn-small, .vocab-chat-focus-btn-top-right {
        text-decoration: none !important;
      }
      
      button:hover, .vocab-btn:hover, .vocab-chat-tab:hover, .vocab-chat-focus-btn:hover, .vocab-chat-send-btn:hover, .vocab-chat-delete-conversation-btn:hover, .vocab-chat-collapse-btn:hover, .vocab-chat-simplify-more-btn:hover, .vocab-chat-collapse-btn-small:hover, .vocab-chat-delete-conversation-btn-small:hover, .vocab-chat-focus-btn-top-right:hover {
        text-decoration: none !important;
      }
      
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
        text-decoration: none;
      }
      
      .vocab-chat-collapse-btn:hover {
        background: #f9fafb;
        border-color: #9527F5;
        text-decoration: none;
      }
      
      /* Horizontally flip collapse icon to left-pointing arrow */
      .vocab-chat-collapse-btn-small svg {
        transform: scaleX(-1);
      }
      
      /* Left Button Container */
      .vocab-chat-left-buttons {
        position: absolute;
        top: 16px;
        left: 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        z-index: 10;
      }
      
      /* Small Collapse Button */
      .vocab-chat-collapse-btn-small {
        width: 24px;
        height: 24px;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        text-decoration: none;
      }
      
      .vocab-chat-collapse-btn-small:hover {
        background: #f9fafb;
        border-color: #9527F5;
        text-decoration: none;
      }
      
      .vocab-chat-collapse-btn-small svg {
        width: 14px;
        height: 14px;
      }
      
      /* Small Delete Button */
      .vocab-chat-delete-conversation-btn-small {
        width: 24px;
        height: 24px;
        background: white;
        border: 1px solid #ef4444;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        text-decoration: none;
      }
      
      .vocab-chat-delete-conversation-btn-small:hover {
        background: #fef2f2;
        border-color: #dc2626;
        text-decoration: none;
      }
      
      .vocab-chat-delete-conversation-btn-small svg {
        width: 12px;
        height: 12px;
      }
      
      /* Circular Delete Button - Bottom Right */
      .vocab-chat-delete-conversation-btn-circular {
        width: 32px;
        height: 32px;
        background: white;
        border: 2px solid #ef4444;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        text-decoration: none;
        flex-shrink: 0;
        margin-left: 8px;
      }
      
      .vocab-chat-delete-conversation-btn-circular:hover {
        background: #fef2f2;
        border-color: #dc2626;
        transform: translateY(-1px);
        text-decoration: none;
      }
      
      .vocab-chat-delete-conversation-btn-circular:active {
        transform: translateY(0) scale(0.95);
      }
      
      .vocab-chat-delete-conversation-btn-circular svg {
        width: 14px;
        height: 14px;
      }
      
      
      /* Focus Button - Top Right */
      .vocab-chat-focus-btn-top-right {
        position: absolute;
        top: 16px;
        right: 16px;
        padding: 6px 12px;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        display: flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        z-index: 10;
        transition: all 0.2s ease;
        font-size: 12px;
        font-weight: 500;
        color: #9527F5;
        text-decoration: none;
      }
      
      .vocab-chat-focus-btn-top-right:hover {
        background: #f9fafb;
        border-color: #9527F5;
        text-decoration: none;
      }
      
      .vocab-chat-focus-btn-top-right span {
        font-size: 12px;
        font-weight: 500;
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
        text-decoration: none;
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
        text-decoration: none;
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
        padding-top: 50px; /* Add padding to account for focus button */
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
      
      /* Simplified Text */
      .vocab-chat-simplified-text {
        padding: 16px;
        background: #faf5ff;
        border-radius: 12px;
        font-size: 14px;
        line-height: 1.6;
        color: #374151;
        white-space: pre-wrap;
        word-wrap: break-word;
        margin-bottom: 12px;
      }
      
      .vocab-chat-simplified-header {
        font-size: 13px;
        font-weight: 600;
        color: #9527F5;
        margin-bottom: 8px;
      }
      
      .vocab-chat-simplified-item {
        margin-bottom: 16px;
      }
      
      .vocab-chat-simplified-item:last-child {
        margin-bottom: 0;
      }
      
      .vocab-chat-simplify-more-container {
        display: flex;
        justify-content: flex-end;
        margin-top: 12px;
      }
      
      .vocab-chat-simplify-more-btn {
        background: #9527F5;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 10px 20px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: inherit;
        text-decoration: none;
      }
      
      .vocab-chat-simplify-more-btn:hover:not(.disabled) {
        background: #7a1fd9;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(149, 39, 245, 0.3);
        text-decoration: none;
      }
      
      .vocab-chat-simplify-more-btn:active:not(.disabled) {
        transform: translateY(0);
      }
      
      .vocab-chat-simplify-more-btn.disabled {
        background: #d1d5db;
        cursor: not-allowed;
        opacity: 0.6;
      }
      
      .vocab-chat-simplify-more-btn.loading {
        position: relative;
        color: transparent;
      }
      
      .vocab-chat-simplify-more-btn.loading::after {
        content: '';
        position: absolute;
        width: 16px;
        height: 16px;
        top: 50%;
        left: 50%;
        margin-left: -8px;
        margin-top: -8px;
        border: 2px solid white;
        border-radius: 50%;
        border-top-color: transparent;
        animation: vocab-chat-spin 0.6s linear infinite;
      }
      
      @keyframes vocab-chat-spin {
        to {
          transform: rotate(360deg);
        }
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
        text-decoration: none;
      }
      
      .vocab-chat-send-btn:hover {
        background: #f0e6ff;
        border-color: #7a1fd9;
        transform: translateY(-1px);
        text-decoration: none;
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
        text-decoration: none;
      }
      
      .vocab-chat-delete-conversation-btn:hover {
        background: #fef2f2;
        border-color: #dc2626;
        transform: translateY(-1px);
        text-decoration: none;
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
        text-decoration: none;
      }
      
      .vocab-chat-focus-btn:hover {
        background: #f9f5ff;
        border-color: #7a1fd9;
        box-shadow: 0 2px 4px rgba(149, 39, 245, 0.1);
        text-decoration: none;
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

      /* Processing Overlay Styles */
      .vocab-processing-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
        border-radius: 20px;
      }

      .vocab-processing-overlay.visible {
        opacity: 1;
        visibility: visible;
      }

      .vocab-processing-content {
        background: transparent;
        border-radius: 20px;
        padding: 40px;
        box-shadow: none;
        text-align: center;
        max-width: 400px;
        width: 90%;
      }

      .vocab-processing-text {
        font-size: 18px;
        font-weight: 500;
        color: #A24EFF;
        margin-bottom: 20px;
        font-family: 'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }

      .vocab-processing-icon {
        width: 40px;
        height: 40px;
        margin: 0 auto;
        position: relative;
      }

      .vocab-processing-icon::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(45deg, #A24EFF, #8B3AE8);
        border-radius: 50%;
        animation: vocab-processing-pulse 1.5s ease-in-out infinite;
      }

      .vocab-processing-icon::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 20px;
        height: 20px;
        background: white;
        border-radius: 50%;
        transform: translate(-50%, -50%);
        animation: vocab-processing-bounce 1.5s ease-in-out infinite;
      }

      @keyframes vocab-processing-pulse {
        0%, 100% {
          transform: scale(1);
          opacity: 1;
        }
        50% {
          transform: scale(1.2);
          opacity: 0.7;
        }
      }

      @keyframes vocab-processing-bounce {
        0%, 100% {
          transform: translate(-50%, -50%) scale(1);
        }
        50% {
          transform: translate(-50%, -50%) scale(1.3);
        }
      }

      /* Custom Content Modal Styles */
      .vocab-custom-content-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
      }

      .vocab-custom-content-overlay.visible {
        opacity: 1;
        visibility: visible;
      }

      .vocab-custom-content-modal {
        background: white;
        border-radius: 40px;
        box-shadow: 0 25px 50px rgba(162, 78, 255, 0.25), 0 0 0 1px rgba(162, 78, 255, 0.1);
        width: 90%;
        max-width: 800px;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        font-family: 'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }

      .vocab-custom-content-header {
        padding: 20px 30px;
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
        cursor: grab;
        user-select: none;
      }

      .vocab-custom-content-header:active {
        cursor: grabbing;
      }

      .vocab-custom-content-title {
        font-size: 24px;
        font-weight: 500;
        color: #A24EFF;
        margin: 0;
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
      }

      /* Tabs Styles */
      .vocab-custom-content-tabs {
        display: flex;
        align-items: center;
        padding: 0 30px;
        background: #F8F9FA;
        border-bottom: 1px solid #E6D6FF;
        min-height: 50px;
      }

      .vocab-custom-content-tabs-container {
        display: flex;
        flex: 1;
        overflow-x: auto;
        scrollbar-width: none;
        -ms-overflow-style: none;
      }

      .vocab-custom-content-tabs-container::-webkit-scrollbar {
        display: none;
      }

      .vocab-custom-content-tab-arrow {
        background: none;
        border: none;
        color: #A24EFF;
        cursor: pointer;
        padding: 8px;
        border-radius: 4px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.6;
      }

      .vocab-custom-content-tab-arrow:hover {
        background: rgba(162, 78, 255, 0.1);
        opacity: 1;
      }

      .vocab-custom-content-tab-arrow:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }

      .vocab-custom-content-tab-arrow:disabled:hover {
        background: none;
      }

      .vocab-custom-content-tab {
        display: flex;
        align-items: center;
        padding: 8px 16px;
        background: white;
        border: 1px solid #E6D6FF;
        border-bottom: none;
        border-radius: 8px 8px 0 0;
        margin-right: 2px;
        cursor: pointer;
        transition: all 0.2s ease;
        min-width: 120px;
        max-width: 200px;
        position: relative;
      }

      .vocab-custom-content-tab:hover {
        background: #F8F9FA;
      }

      .vocab-custom-content-tab.active {
        background: white;
        border-color: #A24EFF;
        color: #A24EFF;
        z-index: 1;
      }

      .vocab-custom-content-tab-title {
        flex: 1;
        font-size: 14px;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-right: 8px;
      }

      .vocab-custom-content-tab-close {
        background: none;
        border: none;
        color: #999;
        cursor: pointer;
        padding: 2px;
        border-radius: 3px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
      }

      .vocab-custom-content-tab-close:hover {
        background: rgba(255, 0, 0, 0.1);
        color: #FF4D4D;
      }

      .vocab-custom-content-add-tab {
        background: #A24EFF;
        border: none;
        color: white;
        cursor: pointer;
        padding: 8px 12px;
        border-radius: 6px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-left: 8px;
      }

      .vocab-custom-content-add-tab:hover {
        background: #8B3FE8;
        transform: scale(1.05);
      }

      .vocab-custom-content-close {
        position: absolute;
        right: 20px;
        top: 20px;
        background: none;
        border: none;
        color: #A24EFF;
        cursor: pointer;
        padding: 8px;
        border-radius: 8px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .vocab-custom-content-close:hover {
        background-color: rgba(162, 78, 255, 0.1);
        transform: scale(1.1);
      }

      .vocab-custom-content-search {
        padding: 20px 30px;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .vocab-custom-content-search-input {
        width: 60%;
        padding: 12px 16px;
        border: 1px solid #E6D6FF;
        border-radius: 25px;
        font-size: 16px;
        font-family: inherit;
        outline: none;
        transition: border-color 0.2s ease;
      }

      .vocab-custom-content-settings {
        position: absolute;
        bottom: 30px;
        right: 30px;
        width: 40px;
        height: 40px;
        background: #A24EFF;
        border: none;
        border-radius: 50%;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        z-index: 10;
      }
      
      .vocab-custom-content-settings:hover {
        background: #8B3FE8;
        transform: scale(1.1);
      }
      
      .vocab-custom-content-settings svg {
        width: 20px;
        height: 20px;
      }

      /* Resize Handles */
      .vocab-custom-content-resize-handles {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        z-index: 20;
      }

      .vocab-custom-content-resize-handle {
        position: absolute;
        width: 20px;
        height: 20px;
        background: transparent;
        border: none;
        pointer-events: all;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.2s ease;
      }

      .vocab-custom-content-resize-handle-top-left {
        top: -10px;
        left: -10px;
        cursor: nw-resize;
      }

      .vocab-custom-content-resize-handle-top-left::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 20px;
        height: 20px;
        border: 3px solid #A24EFF;
        border-radius: 50%;
        border-right: none;
        border-bottom: none;
        transform: rotate(-45deg);
      }

      .vocab-custom-content-resize-handle-top-right {
        top: -10px;
        right: -10px;
        cursor: ne-resize;
      }

      .vocab-custom-content-resize-handle-top-right::before {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        width: 20px;
        height: 20px;
        border: 3px solid #A24EFF;
        border-radius: 50%;
        border-left: none;
        border-bottom: none;
        transform: rotate(45deg);
      }

      .vocab-custom-content-resize-handle-bottom-left {
        bottom: -10px;
        left: -10px;
        cursor: sw-resize;
      }

      .vocab-custom-content-resize-handle-bottom-left::before {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 20px;
        height: 20px;
        border: 3px solid #A24EFF;
        border-radius: 50%;
        border-right: none;
        border-top: none;
        transform: rotate(45deg);
      }

      .vocab-custom-content-resize-handle-bottom-right {
        bottom: -10px;
        right: -10px;
        cursor: se-resize;
      }

      .vocab-custom-content-resize-handle-bottom-right::before {
        content: '';
        position: absolute;
        bottom: 0;
        right: 0;
        width: 20px;
        height: 20px;
        border: 3px solid #A24EFF;
        border-radius: 50%;
        border-left: none;
        border-top: none;
        transform: rotate(-45deg);
      }

      .vocab-custom-content-modal:hover .vocab-custom-content-resize-handle {
        opacity: 1;
      }

      .vocab-custom-content-resize-handle:hover::before {
        border-color: #8B3FE8;
        transform: scale(1.2);
      }

      .vocab-custom-content-search-input::placeholder {
        color: #999;
        font-style: italic;
      }

      .vocab-custom-content-search-input:focus {
        border-color: #A24EFF;
        box-shadow: 0 0 0 3px rgba(162, 78, 255, 0.1);
      }

      .vocab-custom-content-editor {
        flex: 1;
        padding: 30px;
        overflow-y: auto;
        min-height: 400px;
        max-height: 60vh;
        border: 1px solid rgba(162, 78, 255, 0.3);
        margin: 20px 15px 30px 15px;
        position: relative;
      }

      .vocab-custom-content-editor-content {
        line-height: 1.6;
        color: #333;
        font-size: 16px;
        border-radius: 20px;
        overflow: auto;
        scrollbar-width: thin;
        scrollbar-color: #E2B1FF #F9EFFF;
      }

      .vocab-custom-content-editor-content::-webkit-scrollbar {
        width: 8px;
      }

      .vocab-custom-content-editor-content::-webkit-scrollbar-track {
        background: #F9EFFF;
        border-radius: 20px;
      }

      .vocab-custom-content-editor-content::-webkit-scrollbar-thumb {
        background: #E2B1FF;
        border-radius: 20px;
        border: none;
      }

      .vocab-custom-content-editor-content::-webkit-scrollbar-thumb:hover {
        background: rgba(226, 177, 255, 0.8);
      }

      .vocab-custom-content-editor-content h1,
      .vocab-custom-content-editor-content h2,
      .vocab-custom-content-editor-content h3,
      .vocab-custom-content-editor-content h4,
      .vocab-custom-content-editor-content h5,
      .vocab-custom-content-editor-content h6 {
        color: #A24EFF;
        margin-top: 24px;
        margin-bottom: 12px;
      }

      .vocab-custom-content-editor-content h1 {
        font-size: 28px;
        font-weight: 600;
      }

      .vocab-custom-content-editor-content h2 {
        font-size: 24px;
        font-weight: 600;
      }

      .vocab-custom-content-editor-content h3 {
        font-size: 20px;
        font-weight: 500;
      }

      .vocab-custom-content-editor-content p {
        margin-bottom: 16px;
      }

      .vocab-custom-content-editor-content ul,
      .vocab-custom-content-editor-content ol {
        margin-bottom: 16px;
        padding-left: 24px;
      }

      .vocab-custom-content-editor-content li {
        margin-bottom: 8px;
      }

      .vocab-custom-content-editor-content blockquote {
        border-left: 4px solid #A24EFF;
        padding-left: 16px;
        margin: 16px 0;
        color: #666;
        font-style: italic;
      }

      .vocab-custom-content-editor-content code {
        background: #F5F5F5;
        padding: 2px 6px;
        border-radius: 4px;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 14px;
      }

      .vocab-custom-content-editor-content pre {
        background: #F5F5F5;
        padding: 16px;
        border-radius: 8px;
        overflow-x: auto;
        margin: 16px 0;
      }

      .vocab-custom-content-editor-content pre code {
        background: none;
        padding: 0;
      }

      /* Search highlighting */
      .vocab-search-highlight {
        background-color: #FFE066;
        padding: 2px 4px;
        border-radius: 3px;
        font-weight: 500;
      }

      /* Responsive Design for Custom Content Modal */
      @media (max-width: 768px) {
        .vocab-custom-content-modal {
          width: 95%;
          margin: 20px;
        }

        .vocab-custom-content-header {
          padding: 15px 20px;
        }

        .vocab-custom-content-title {
          font-size: 20px;
        }

        .vocab-custom-content-search {
          padding: 15px 20px;
        }

        .vocab-custom-content-editor {
          padding: 20px;
          min-height: 300px;
        }
      }

      @media (max-width: 480px) {
        .vocab-custom-content-modal {
          width: 98%;
          margin: 10px;
        }

        .vocab-custom-content-header {
          padding: 12px 15px;
        }

        .vocab-custom-content-title {
          font-size: 18px;
        }

        .vocab-custom-content-search {
          padding: 12px 15px;
        }

        .vocab-custom-content-editor {
          padding: 15px;
          min-height: 250px;
        }
      }
    `;
    
    document.head.appendChild(style);
  }
};
// Button Panel Module - Manages the floating button UI
// ===================================
const ButtonPanel = {
  panelContainer: null,
  upperButtonGroup: null,
  verticalButtonGroup: null,
  
  // State variables for button visibility and enabled states
  state: {
    showRemoveMeanings: false,    // Controls visibility of "Remove meanings" button
    showDeselectAll: false,        // Controls visibility of "Deselect all" button
    isMagicMeaningEnabled: false,  // Controls enabled/disabled state of "Magic meaning" button
    showAsk: false,                // Controls visibility of "Ask" button
    showVerticalGroup: false       // Controls visibility of vertical button group
  },

  /**
   * Initialize the button panel
   */
  async init() {
    this.createPanel();
    
    // Load and apply saved position
    await this.loadAndApplyPosition();
    
    // Initialize drag functionality - drag the entire panel container
    const dragHandle = document.getElementById('vocab-drag-handle');
    if (dragHandle && this.panelContainer) {
      DragHandle.init(dragHandle, this.panelContainer);
    }
    
    // Apply initial state
    this.updateButtonStates();
    
    // Attach event listeners after panel is created and added to DOM
    this.attachEventListeners();
    
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
   * Load and apply saved position to the panel
   */
  async loadAndApplyPosition() {
    try {
      const savedPosition = await PositionManager.loadPosition();
      if (savedPosition && this.panelContainer) {
        // Apply constraints to ensure panel stays within viewport
        const constraints = this.calculateConstraints();
        const constrainedLeft = Math.max(constraints.minX, Math.min(constraints.maxX, savedPosition.left));
        const constrainedTop = Math.max(constraints.minY, Math.min(constraints.maxY, savedPosition.top));
        
        // Apply the position
        this.panelContainer.style.left = `${constrainedLeft}px`;
        this.panelContainer.style.top = `${constrainedTop}px`;
        this.panelContainer.style.right = 'auto';
        this.panelContainer.style.transform = 'none';
        
        console.log('[ButtonPanel] Applied saved position:', { left: constrainedLeft, top: constrainedTop });
      }
    } catch (error) {
      console.error('[ButtonPanel] Error loading position:', error);
    }
  },

  /**
   * Calculate viewport constraints to keep panel fully visible
   * @returns {Object} Constraint boundaries
   */
  calculateConstraints() {
    if (!this.panelContainer) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }
    
    const panelRect = this.panelContainer.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    return {
      minX: 0,
      maxX: viewportWidth - panelRect.width,
      minY: 0,
      maxY: viewportHeight - panelRect.height
    };
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
      return result[storageKey] ?? false; // Default to false for new domains
    } catch (error) {
      console.error('Error checking extension state:', error);
      return false; // Default to false on error
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

    // Create lower button group (Magic meaning, Ask, Custom content)
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
        text: 'Ask anything',
        type: 'solid-purple'
      },
      {
        id: 'custom-content',
        className: 'vocab-btn vocab-btn-solid-purple',
        icon: this.createContentIcon(),
        text: 'Custom content',
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

    // Create vertical button group
    this.verticalButtonGroup = this.createVerticalButtonGroup();

    // Create drag handle (separate from button group)
    const dragHandle = this.createDragHandle();

    // Append button group and drag handle to wrapper
    wrapperContainer.appendChild(mainButtonGroup);
    wrapperContainer.appendChild(dragHandle);

    // Append vertical button group to wrapper (positioned absolutely)
    wrapperContainer.appendChild(this.verticalButtonGroup);

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
   * Create vertical button group
   * @returns {HTMLElement} Vertical button group element
   */
  createVerticalButtonGroup() {
    const group = document.createElement('div');
    group.className = 'vocab-vertical-button-group';
    group.id = 'vocab-vertical-button-group';

    // Create PDF button
    const pdfButton = document.createElement('button');
    pdfButton.className = 'vocab-vertical-btn';
    pdfButton.id = 'vocab-pdf-btn';
    pdfButton.innerHTML = `
      <div class="vocab-vertical-btn-icon">${this.createPDFIcon()}</div>
      <div class="vocab-vertical-btn-text">PDF</div>
    `;

    // Create Image button
    const imageButton = document.createElement('button');
    imageButton.className = 'vocab-vertical-btn';
    imageButton.id = 'vocab-image-btn';
    imageButton.innerHTML = `
      <div class="vocab-vertical-btn-icon">${this.createImageIcon()}</div>
      <div class="vocab-vertical-btn-text">Image</div>
    `;

    // Create Topics button
    const topicsButton = document.createElement('button');
    topicsButton.className = 'vocab-vertical-btn';
    topicsButton.id = 'vocab-topics-btn';
    topicsButton.innerHTML = `
      <div class="vocab-vertical-btn-icon">${this.createTopicsIcon()}</div>
      <div class="vocab-vertical-btn-text">Topics</div>
    `;

    // Append buttons to group
    group.appendChild(pdfButton);
    group.appendChild(imageButton);
    group.appendChild(topicsButton);

    return group;
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
   * Create content icon SVG (solid white)
   * @returns {string} SVG markup
   */
  createContentIcon() {
    return `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 2C3 1.448 3.448 1 4 1H12C12.552 1 13 1.448 13 2V14C13 14.552 12.552 15 12 15H4C3.448 15 3 14.552 3 14V2Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M5 5H11M5 7H11M5 9H9" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M6 12H10" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  },

  /**
   * Create PDF icon SVG (white)
   * @returns {string} SVG markup
   */
  createPDFIcon() {
    return `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 2C4 1.448 4.448 1 5 1H12L16 5V18C16 18.552 15.552 19 15 19H5C4.448 19 4 18.552 4 18V2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 1V5H16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M6 8H14M6 10H12M6 12H10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M10 15L10 13M10 13L8 15M10 13L12 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M10 13L10 11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  },

  /**
   * Create Image icon SVG (white)
   * @returns {string} SVG markup
   */
  createImageIcon() {
    return `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 4C3 3.448 3.448 3 4 3H16C16.552 3 17 3.448 17 4V16C17 16.552 16.552 17 16 17H4C3.448 17 3 16.552 3 16V4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M7 8L10 11L13 8L17 12V16H3V12L7 8Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="7" cy="8" r="1.5" fill="currentColor"/>
        <path d="M10 15L10 13M10 13L8 15M10 13L12 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M10 13L10 11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  },

  /**
   * Create Topics icon SVG (white)
   * @returns {string} SVG markup
   */
  createTopicsIcon() {
    return `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 3H7V7H3V3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M10 3H14V7H10V3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M17 3H21V7H17V3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M3 10H7V14H3V10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M10 10H14V14H10V10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M17 10H21V14H17V10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M3 17H7V21H3V17Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M10 17H14V21H10V17Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M17 17H21V21H17V17Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
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
        overflow: visible !important;
      }

      /* Main Button Group with Purple Shadow */
      .vocab-button-group-main {
        display: flex;
        flex-direction: column;
        gap: 0;
        background: white;
        padding: 6px 6px 6px 6px;
        border-radius: 16px;
        box-shadow: 0 4px 20px rgba(149, 39, 245, 0.3), 0 2px 8px rgba(149, 39, 245, 0.2);
        border: 1px solid rgba(149, 39, 245, 0.1);
        overflow: visible !important;
      }

      /* Upper Button Group with smooth transitions */
      .vocab-button-group-upper {
        display: flex;
        flex-direction: column;
        gap: 6px;
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
        margin-bottom: 6px;
        padding-top: 0;
      }

      /* Lower Button Group (no additional styling) */
      .vocab-button-group-lower {
        display: flex;
        flex-direction: column;
        gap: 6px;
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
        gap: 6px;
        padding: 8px 10px;
        border-radius: 10px;
        font-size: 11.5px;
        font-weight: 500;
        border: 2px solid;
        cursor: pointer;
        transition: all 0.2s ease, opacity 0.3s ease, transform 0.3s ease, max-height 0.3s ease;
        outline: none;
        width: 100px;
        max-height: 100px;
        overflow: hidden;
        opacity: 1;
        transform: scaleY(1);
        transform-origin: top;
        min-height: 32px;
        text-decoration: none;
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
        text-decoration: none;
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
        text-decoration: none;
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
        text-decoration: none;
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
      .vocab-btn.disabled {
        pointer-events: auto; /* Allow hover events on the button itself */
      }
      
      .vocab-btn.disabled * {
        pointer-events: none; /* But disable pointer events on child elements */
      }
      
      /* Allow tooltips to be visible on disabled buttons */
      .vocab-btn.disabled .vocab-btn-tooltip {
        pointer-events: auto;
      }

      /* Tooltip Styles */
      .vocab-btn-tooltip {
        position: fixed !important;
        background: white !important;
        color: #b29cfb !important;
        padding: 10px 20px !important;
        border-radius: 20px !important;
        font-size: 13px !important;
        font-weight: 500 !important;
        white-space: nowrap !important;
        text-align: center !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif !important;
        box-shadow: 0 0 20px rgba(178, 156, 251, 0.3), 0 4px 12px rgba(178, 156, 251, 0.2) !important;
        z-index: 9999999 !important;
        pointer-events: none !important;
        opacity: 0 !important;
        transform: translateY(5px) scale(0.95) !important;
        transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), 
                   transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        visibility: visible !important;
        width: auto !important;
        height: auto !important;
        min-height: 40px !important;
      }

      .vocab-btn-tooltip.visible {
        opacity: 1 !important;
        transform: translateY(0) scale(1) !important;
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
          padding: 4px;
        }

        .vocab-btn {
          width: 90px;
          padding: 6px 8px;
          font-size: 11px;
          grid-template-columns: 16px 1fr;
          gap: 4px;
        }

        .vocab-btn-icon {
          width: 16px;
          height: 16px;
        }
      }

      /* Vertical Button Group Styles */
      .vocab-vertical-button-group {
        position: absolute;
        right: 100%;
        top: 50%;
        transform: translateY(-50%) translateX(12px) translateY(23px);
        display: flex;
        flex-direction: column;
        gap: 6px;
        background: transparent;
        padding: 0;
        border-radius: 0;
        box-shadow: none;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 1000000;
        min-width: 120px;
      }

      .vocab-vertical-button-group.visible {
        opacity: 1;
        visibility: visible;
        transform: translateY(-50%) translateX(16px) translateY(23px);
      }


      .vocab-vertical-btn {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
        padding: 8px 12px;
        background: white;
        border: 2px solid #A24EFF;
        border-radius: 16px;
        color: #A24EFF;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s ease;
        min-height: 40px;
        width: 90px;
        gap: 8px;
      }

      .vocab-vertical-btn:hover {
        background: white;
        transform: scale(1.05);
        box-shadow: 0 2px 8px rgba(162, 78, 255, 0.2);
      }

      .vocab-vertical-btn:active {
        transform: scale(1.02);
        box-shadow: 0 1px 4px rgba(162, 78, 255, 0.3);
      }

      .vocab-vertical-btn-icon {
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .vocab-vertical-btn-text {
        font-size: 12px;
        font-weight: 700;
        text-align: left;
        line-height: 1.2;
        flex: 1;
      }


      /* Responsive adjustments for vertical button group */
      @media (max-width: 768px) {
        .vocab-vertical-button-group {
          right: 100%;
          transform: translateY(-50%) translateX(-15px);
          padding: 0;
          min-width: 100px;
        }

        .vocab-vertical-btn {
          padding: 6px 8px;
          min-height: 36px;
          font-size: 11px;
        }

        .vocab-vertical-btn-icon {
          width: 14px;
          height: 14px;
        }

        .vocab-vertical-btn-text {
          font-size: 10px;
        }
      }

      /* Topics Modal Styles */
      .vocab-topics-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1000000;
        display: flex;
        justify-content: center;
        align-items: center;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
        font-family: 'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }

      .vocab-topics-modal-overlay.visible {
        opacity: 1;
        visibility: visible;
      }

      .vocab-topics-modal {
        background: white;
        border-radius: 20px;
        box-shadow: 0 25px 50px rgba(162, 78, 255, 0.25), 0 0 0 1px rgba(162, 78, 255, 0.1);
        padding: 20px;
        max-width: 700px;
        width: 90%;
        max-height: 80vh;
        overflow: hidden;
        transform: scale(0.9) translateY(20px);
        opacity: 0;
        visibility: hidden;
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        position: relative;
      }

      .vocab-topics-content-container {
        background: #F8F4FF;
        border-radius: 16px;
        padding: 20px;
        margin-top: 20px;
        max-height: calc(80vh - 120px);
        overflow-y: auto;
      }

      .vocab-topics-modal.visible {
        transform: scale(1) translateY(0);
        opacity: 1;
        visibility: visible;
      }

      .vocab-topics-modal-header {
        position: relative;
        margin: 20px 0 30px 0;
        text-align: center;
      }

      .vocab-topics-modal-title {
        font-size: 28px;
        font-weight: 400;
        color: #9B6EDA;
        margin: 0;
        text-align: center;
      }

      .vocab-topics-modal-close {
        position: absolute;
        top: 4px;
        right: 4px;
        background: none;
        border: none;
        color: #9B6EDA;
        font-size: 32px;
        font-weight: 200;
        cursor: pointer;
        width: 56px;
        height: 56px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.2s ease, transform 0.2s ease;
        border-radius: 50%;
        padding: 0;
        z-index: 10;
      }

      .vocab-topics-modal-close:hover {
        color: #7A5BC7;
        transform: scale(1.2);
      }

      .vocab-topics-modal-close svg {
        width: 24px;
        height: 24px;
        stroke-width: 1.5;
      }


      /* First Container - Input */
      .vocab-topics-first-container {
        margin-bottom: 25px;
      }

      .vocab-topics-input-section {
        width: 70%;
        margin: 0 auto;
      }

      .vocab-topics-input-container {
        position: relative;
      }

      .vocab-topics-generate-btn {
        background: #A24EFF;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 15px;
        font-size: 20px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s ease, transform 0.2s ease;
        font-family: inherit;
        white-space: nowrap;
        min-width: 150px;
        margin: 15px auto 0;
        display: block;
      }

      .vocab-topics-generate-btn:hover {
        background: #7A5BC7;
        transform: scale(1.05);
      }

      .vocab-topics-generate-btn:active {
        background: #7A5BC7;
      }

      /* Second Container - Topic Tags + Controls */
      .vocab-topics-second-container {
        display: flex;
        gap: 20px;
        align-items: stretch;
      }

      .vocab-topics-tags-section {
        flex: 2;
      }

      .vocab-topics-controls-section {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 35px;
        justify-content: center;
      }

      .vocab-topics-input {
        width: 100%;
        padding: 8px 45px 8px 16px;
        border: 2px solid #E6D6FF;
        border-radius: 25px;
        font-size: 16px;
        background: white;
        color: #333;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
        box-sizing: border-box;
        font-family: inherit;
        text-align: center;
      }

      .vocab-topics-input:focus {
        outline: none;
        border-color: #A24EFF;
        box-shadow: 0 0 0 3px rgba(162, 78, 255, 0.1);
      }

      .vocab-topics-input::placeholder {
        color: #B19CD9;
        font-style: italic;
        font-weight: 300;
      }

      .vocab-topics-search-icon {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: #A24EFF;
        cursor: pointer;
        transition: background-color 0.2s ease, opacity 0.2s ease;
        background: #A24EFF;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .vocab-topics-search-icon:hover:not(.disabled) {
        background: #8B3AE8;
      }

      .vocab-topics-search-icon.disabled {
        background: #c5aee3;
        cursor: pointer;
        opacity: 0.6;
      }

      .vocab-topics-tags-container {
        margin-bottom: 15px;
        height: 200px;
        border: 2px solid #E6D6FF;
        border-radius: 16px;
        padding: 12px;
        background: white;
        flex: 2;
        overflow-y: auto;
      }


      .vocab-topics-second-container {
        transition: opacity 0.3s ease, transform 0.3s ease;
        opacity: 1;
        transform: translateY(0);
      }

      .vocab-topics-second-container.hidden {
        display: none;
        opacity: 0;
        transform: translateY(-10px);
        pointer-events: none;
      }

      .vocab-topics-generate-btn.hidden {
        display: none;
        opacity: 0;
        transform: translateY(-10px);
        pointer-events: none;
      }

      .vocab-topics-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        min-height: 36px;
      }

      .vocab-topics-tag {
        background: #E6D6FF;
        color: #A24EFF;
        padding: 2px 6px 2px 12px;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 3px;
        animation: slideIn 0.3s ease;
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .vocab-topics-tag-remove {
        background: none;
        border: none;
        color: #A24EFF;
        cursor: pointer;
        font-size: 18px;
        font-weight: 400;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s ease;
      }

      .vocab-topics-tag-remove:hover {
        background-color: rgba(162, 78, 255, 0.1);
      }

      .vocab-topics-control-group {
        display: flex;
        flex-direction: column;
        gap: 12px;
        justify-content: center;
      }

      .vocab-topics-word-count-group {
        display: flex;
        flex-direction: column;
        gap: 12px;
        justify-content: center;
        align-items: center;
      }

      .vocab-topics-difficulty-group {
        display: flex;
        flex-direction: column;
        gap: 12px;
        justify-content: center;
        align-items: center;
      }

      .vocab-topics-control-label {
        font-size: 20px;
        font-weight: 500;
        color: #9B6EDA;
        margin: 0;
        font-family: inherit;
      }

      .vocab-topics-word-count-buttons {
        display: flex;
        background: white;
        border: 1px solid #E6D6FF;
        border-radius: 12px;
        padding: 2px;
        position: relative;
        width: fit-content;
        align-items: center;
      }

      .vocab-topics-word-count-slider {
        position: absolute;
        top: 2px;
        left: 2px;
        height: calc(100% - 4px);
        background: #9B6EDA;
        border-radius: 10px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 1;
      }

      .vocab-topics-word-count-btn {
        padding: 8px 20px;
        border: none;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 500;
        color: #9B6EDA;
        cursor: pointer;
        background: white;
        font-family: inherit;
        position: relative;
        z-index: 2;
        min-width: 70px;
        text-align: center;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s ease;
      }

      .vocab-topics-word-count-btn:hover {
        background-color: rgba(155, 110, 218, 0.1);
      }

      .vocab-topics-word-count-btn.selected {
        color: white;
        background: transparent;
      }

      .vocab-topics-difficulty-buttons {
        display: flex;
        background: white;
        border: 1px solid #E6D6FF;
        border-radius: 12px;
        padding: 2px;
        position: relative;
        width: fit-content;
        align-items: center;
      }

      .vocab-topics-difficulty-slider {
        position: absolute;
        top: 2px;
        left: 2px;
        height: calc(100% - 4px);
        background: #9B6EDA;
        border-radius: 10px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 1;
      }

      .vocab-topics-difficulty-btn {
        padding: 8px 20px;
        border: none;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        background: white;
        font-family: inherit;
        position: relative;
        z-index: 2;
        min-width: 70px;
        text-align: center;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s ease;
      }

      .vocab-topics-difficulty-btn:hover {
        background-color: rgba(155, 110, 218, 0.1);
      }

      .vocab-topics-difficulty-btn.easy {
        color: #36D86B;
      }

      .vocab-topics-difficulty-btn.medium {
        color: #F9D43F;
      }

      .vocab-topics-difficulty-btn.hard {
        color: #FF4D4D;
      }

      .vocab-topics-difficulty-btn.selected {
        color: white;
        background: transparent;
      }

      .vocab-topics-difficulty-btn.easy.selected ~ .vocab-topics-difficulty-slider {
        background: #36D86B;
      }

      .vocab-topics-difficulty-btn.medium.selected ~ .vocab-topics-difficulty-slider {
        background: #F9D43F;
      }

      .vocab-topics-difficulty-btn.hard.selected ~ .vocab-topics-difficulty-slider {
        background: #FF4D4D;
      }

      /* Responsive Design */
      @media (max-width: 768px) {
        .vocab-topics-modal {
          padding: 30px;
          margin: 20px;
          width: calc(100% - 40px);
          max-width: 650px;
        }

        .vocab-topics-modal-title {
          font-size: 24px;
        }

        .vocab-topics-first-container {
          margin-bottom: 20px;
        }

        .vocab-topics-input-section {
          width: 80%;
        }

        .vocab-topics-second-container {
          flex-direction: column;
          gap: 20px;
        }

        .vocab-topics-tags-container {
          height: 150px;
          margin-bottom: 15px;
        }

        .vocab-topics-input {
          font-size: 16px;
          padding: 14px 45px 14px 14px;
        }

        .vocab-topics-difficulty-buttons {
          flex-direction: column;
        }

        .vocab-topics-difficulty-btn {
          flex: none;
        }

        .vocab-topics-word-count-buttons {
          width: 100%;
        }

        .vocab-topics-difficulty-buttons {
          width: 100%;
        }
      }

      @media (max-width: 480px) {
        .vocab-topics-modal {
          padding: 25px;
          margin: 15px;
          width: calc(100% - 30px);
          max-width: 600px;
        }

        .vocab-topics-modal-title {
          font-size: 22px;
        }

        .vocab-topics-generate-btn {
          padding: 14px 24px;
          font-size: 16px;
          min-width: auto;
          width: 100%;
          margin: 10px auto 0;
        }

        .vocab-topics-input-section {
          width: 85%;
        }

        .vocab-topics-tags-container {
          height: 120px;
          margin-bottom: 10px;
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
      ask: document.getElementById('ask'),
      customContent: document.getElementById('custom-content')
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

    // Custom content button
    buttons.customContent?.addEventListener('click', (e) => {
      console.log('Custom content clicked');
      this.toggleVerticalButtonGroup();
    });

    // Add hover events for custom content button
    buttons.customContent?.addEventListener('mouseenter', () => {
      this.showVerticalButtonGroup();
    });

    buttons.customContent?.addEventListener('mouseleave', () => {
      // Only hide if not clicking on the vertical group
      setTimeout(() => {
        if (!this.verticalButtonGroup?.matches(':hover')) {
          this.hideVerticalButtonGroup();
        }
      }, 100);
    });

    // Add hover events for vertical button group
    this.verticalButtonGroup?.addEventListener('mouseenter', () => {
      this.showVerticalButtonGroup();
    });

    this.verticalButtonGroup?.addEventListener('mouseleave', () => {
      this.hideVerticalButtonGroup();
    });

    // Add event listeners for vertical button group buttons
    const pdfBtn = document.getElementById('vocab-pdf-btn');
    const imageBtn = document.getElementById('vocab-image-btn');
    const topicsBtn = document.getElementById('vocab-topics-btn');
    
    console.log('Button elements found:');
    console.log('PDF button:', pdfBtn);
    console.log('Image button:', imageBtn);
    console.log('Topics button:', topicsBtn);

    pdfBtn?.addEventListener('click', () => {
      console.log('PDF button clicked');
      this.handlePDFButton();
    });

    imageBtn?.addEventListener('click', () => {
      console.log('Image button clicked');
      this.handleImageButton();
    });

    topicsBtn?.addEventListener('click', (e) => {
      console.log('Topics button clicked');
      this.handleTopicsButton();
    });

    // Add tooltip event listeners
    if (buttons.magicMeaning) {
      console.log('[ButtonPanel] Attaching tooltip to Magic meaning button');
      this.attachTooltipListeners(buttons.magicMeaning, 'magic-meaning');
    } else {
      console.warn('[ButtonPanel] Magic meaning button not found');
    }
    
    if (buttons.ask) {
      console.log('[ButtonPanel] Attaching tooltip to Ask button');
      this.attachTooltipListeners(buttons.ask, 'ask');
    } else {
      console.warn('[ButtonPanel] Ask button not found');
    }
  },

  /**
   * Attach tooltip event listeners to a button
   * @param {HTMLElement} button - Button element
   * @param {string} buttonType - Type of button ('magic-meaning' or 'ask')
   */
  attachTooltipListeners(button, buttonType) {
    if (!button) {
      console.log(`[ButtonPanel] attachTooltipListeners: No button provided for ${buttonType}`);
      return;
    }

    console.log(`[ButtonPanel] attachTooltipListeners: Setting up tooltip for ${buttonType} button`, button);

    let tooltip = null;

    button.addEventListener('mouseenter', () => {
      console.log(`[ButtonPanel] Mouse enter on ${buttonType} button`);
      console.log(`[ButtonPanel] Button element:`, button);
      console.log(`[ButtonPanel] Button classes:`, button.className);
      
      const isDisabled = button.classList.contains('disabled');
      console.log(`[ButtonPanel] Is disabled: ${isDisabled}`);
      
      let message = '';

      // Determine tooltip message based on button type and state
      if (buttonType === 'magic-meaning') {
        message = isDisabled 
          ? 'Select words or passages first' 
          : 'Get meanings and explanations';
        console.log(`[ButtonPanel] Magic-meaning button message: "${message}"`);
      } else if (buttonType === 'ask') {
        if (isDisabled) {
          // Check specific conditions for Ask button
          const textCount = TextSelector.selectedTexts.size;
          if (textCount === 0) {
            message = 'Select a text first';
          } else if (textCount > 1) {
            message = 'Select only one text';
          } else {
            message = 'Select a text first'; // Fallback
          }
        } else {
          message = 'Ask anything about the selected content';
        }
        console.log(`[ButtonPanel] Ask button message: "${message}" (textCount: ${TextSelector.selectedTexts.size})`);
      }

      console.log(`[ButtonPanel] Final tooltip message: "${message}" (disabled: ${isDisabled})`);

      // Create and show tooltip
      console.log(`[ButtonPanel] Creating tooltip element...`);
      tooltip = this.createTooltip(message);
      console.log(`[ButtonPanel] Tooltip created:`, tooltip);
      
      console.log(`[ButtonPanel] Appending tooltip to document.body...`);
      document.body.appendChild(tooltip);
      console.log(`[ButtonPanel] Tooltip appended to body`);
      
      // Position tooltip relative to button (top-left)
      const buttonRect = button.getBoundingClientRect();
      tooltip.style.position = 'fixed';
      tooltip.style.top = (buttonRect.top - 50) + 'px';
      // Position tooltip to the left of the button, accounting for tooltip width
      const tooltipWidth = 200; // Approximate tooltip width
      tooltip.style.left = (buttonRect.left - tooltipWidth - 10) + 'px';
      tooltip.style.zIndex = '9999999';
      console.log(`[ButtonPanel] Tooltip positioned at:`, tooltip.style.top, tooltip.style.left);
      console.log(`[ButtonPanel] Button rect:`, buttonRect);
      
      // Trigger animation
      console.log(`[ButtonPanel] Setting timeout to show tooltip...`);
      setTimeout(() => {
        console.log(`[ButtonPanel] Adding 'visible' class to tooltip...`);
        tooltip.classList.add('visible');
        console.log(`[ButtonPanel] Tooltip classes after adding visible:`, tooltip.className);
        const computedStyle = window.getComputedStyle(tooltip);
        console.log(`[ButtonPanel] Tooltip computed style - display:`, computedStyle.display);
        console.log(`[ButtonPanel] Tooltip computed style - visibility:`, computedStyle.visibility);
        console.log(`[ButtonPanel] Tooltip computed style - opacity:`, computedStyle.opacity);
        console.log(`[ButtonPanel] Tooltip computed style - position:`, computedStyle.position);
        console.log(`[ButtonPanel] Tooltip computed style - z-index:`, computedStyle.zIndex);
        console.log(`[ButtonPanel] Tooltip computed style - top:`, computedStyle.top);
        console.log(`[ButtonPanel] Tooltip computed style - right:`, computedStyle.right);
        console.log(`[ButtonPanel] Tooltip computed style - bottom:`, computedStyle.bottom);
        console.log(`[ButtonPanel] Tooltip computed style - pointer-events:`, computedStyle.pointerEvents);
        console.log(`[ButtonPanel] Tooltip getBoundingClientRect:`, tooltip.getBoundingClientRect());
        console.log(`[ButtonPanel] Button getBoundingClientRect:`, button.getBoundingClientRect());
      }, 10);
    });

    button.addEventListener('mouseleave', () => {
      console.log(`[ButtonPanel] Mouse leave on ${buttonType} button`);
      if (tooltip) {
        console.log(`[ButtonPanel] Hiding tooltip...`);
        tooltip.classList.remove('visible');
        setTimeout(() => {
          console.log(`[ButtonPanel] Tooltip removed from DOM`);
          tooltip.remove();
          tooltip = null;
        }, 200);
      } else {
        console.log(`[ButtonPanel] No tooltip to remove`);
      }
    });
  },

  /**
   * Create a tooltip element
   * @param {string} message - Tooltip message
   * @returns {HTMLElement} Tooltip element
   */
  createTooltip(message) {
    console.log(`[ButtonPanel] createTooltip: Creating tooltip with message: "${message}"`);
    const tooltip = document.createElement('div');
    tooltip.className = 'vocab-btn-tooltip';
    tooltip.textContent = message;
    console.log(`[ButtonPanel] createTooltip: Tooltip element created:`, tooltip);
    console.log(`[ButtonPanel] createTooltip: Tooltip classes:`, tooltip.className);
    console.log(`[ButtonPanel] createTooltip: Tooltip text content:`, tooltip.textContent);
    return tooltip;
  },

  /**
   * Handler for Remove all meanings button
   */
  handleRemoveAllMeanings() {
    console.log('[ButtonPanel] Remove all meanings clicked');
    
    // Get all asked texts, simplified texts, and explained words
    const askedTextsMap = TextSelector.askedTexts;
    const simplifiedTextsMap = TextSelector.simplifiedTexts;
    const explainedWordsMap = WordSelector.explainedWords;
    
    if (askedTextsMap.size === 0 && simplifiedTextsMap.size === 0 && explainedWordsMap.size === 0) {
      console.warn('[ButtonPanel] No meanings to remove');
      return;
    }
    
    // Process asked texts
    if (askedTextsMap.size > 0) {
      const askedTextKeys = Array.from(askedTextsMap.keys());
      console.log(`[ButtonPanel] Removing ${askedTextKeys.length} asked texts`);
      
      askedTextKeys.forEach(textKey => {
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
    }
    
    // Process simplified texts
    if (simplifiedTextsMap.size > 0) {
      const simplifiedTextKeys = Array.from(simplifiedTextsMap.keys());
      console.log(`[ButtonPanel] Removing ${simplifiedTextKeys.length} simplified texts`);
      
      simplifiedTextKeys.forEach(textKey => {
        const highlight = TextSelector.textToHighlights.get(textKey);
        
        if (highlight) {
          // Remove the book icon button
          const bookBtn = highlight.querySelector('.vocab-text-book-btn');
          if (bookBtn) {
            bookBtn.remove();
          }
          
          // Remove the simplified class (green underline)
          highlight.classList.remove('vocab-text-simplified');
          
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
        
        // Remove from simplifiedTexts Map
        simplifiedTextsMap.delete(textKey);
        
        // Also remove from textToHighlights Map
        TextSelector.textToHighlights.delete(textKey);
        
        // Also remove from textPositions Map
        TextSelector.textPositions.delete(textKey);
      });
    }
    
    // Process explained words
    if (explainedWordsMap.size > 0) {
      const explainedWordKeys = Array.from(explainedWordsMap.keys());
      console.log(`[ButtonPanel] Removing ${explainedWordKeys.length} explained words`);
      
      explainedWordKeys.forEach(word => {
        const normalizedWord = word.toLowerCase().trim();
        const wordData = explainedWordsMap.get(word);
        
        console.log(`[ButtonPanel] Removing explained word: "${word}" (normalized: "${normalizedWord}")`);
        
        if (wordData && wordData.highlights) {
          // Remove all highlights for this word
          wordData.highlights.forEach(highlight => {
            // Remove the green explained class
            highlight.classList.remove('vocab-word-explained');
            
            // Remove data attributes
            highlight.removeAttribute('data-meaning');
            highlight.removeAttribute('data-examples');
            highlight.removeAttribute('data-popup-id');
            
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
          });
        }
        
        // Remove from explainedWords Map
        explainedWordsMap.delete(word);
        
        // Also remove from wordToHighlights Map using normalized word
        WordSelector.wordToHighlights.delete(normalizedWord);
      });
      
      // Hide any open popups
      WordSelector.hideAllPopups();
    }
    
    console.log('[ButtonPanel] All meanings removed');
    
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
    
    // Get all selected texts and words
    const selectedTexts = TextSelector.getSelectedTexts();
    const selectedWords = WordSelector.getSelectedWords();
    
    if (selectedTexts.size === 0 && selectedWords.size === 0) {
      console.warn('[ButtonPanel] No text or words selected');
      return;
    }
    
    // ========== Process Text Segments (existing functionality) ==========
    if (selectedTexts.size > 0) {
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
      
      if (textSegments.length > 0) {
        console.log('[ButtonPanel] Processing', textSegments.length, 'text segments');
        
        // Remove texts from selectedTexts container as API call starts
        for (const textKey of textKeysToProcess) {
          TextSelector.selectedTexts.delete(textKey);
        }
        
        // Update button states after removing from selectedTexts
        this.updateButtonStatesFromSelections();
        
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
                  previousSimplifiedTexts: eventData.previousSimplifiedTexts || [],
                  shouldAllowSimplifyMore: eventData.shouldAllowSimplifyMore || false
                });
                
                // Update button states after adding to simplifiedTexts
                ButtonPanel.updateButtonStatesFromSelections();
                
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
      }
    }
    
    // ========== Process Word Selections (new functionality) ==========
    if (selectedWords.size > 0) {
      console.log('[ButtonPanel] ===== MAGIC MEANING: Processing Words =====');
      console.log('[ButtonPanel] Processing', selectedWords.size, 'selected words');
      console.log('[ButtonPanel] Selected words list:', Array.from(selectedWords));
      
      // Build API payload for words with 10-word context
      const wordPayload = WordSelector.buildWordsExplanationPayload();
      
      if (wordPayload.length === 0) {
        console.warn('[ButtonPanel] No word segments with position data');
        return;
      }
      
      console.log('[ButtonPanel] Word payload segments:', wordPayload.length);
      console.log('[ButtonPanel] Full word payload:', JSON.stringify(wordPayload.map(s => ({
        textStartIndex: s.textStartIndex,
        text: s.text.substring(0, 100) + '...',
        words: s.important_words_location.map(w => w.word),
        highlightCount: s._wordHighlights ? s._wordHighlights.length : 0
      })), null, 2));
      
      // Track all word highlights for this request
      const allWordHighlights = [];
      wordPayload.forEach(segment => {
        if (segment._wordHighlights) {
          allWordHighlights.push(...segment._wordHighlights);
        }
      });
      
      console.log('[ButtonPanel] Total word highlights to process:', allWordHighlights.length);
      
      // Remove words from selectedWords container as API call starts
      selectedWords.forEach(word => {
        WordSelector.selectedWords.delete(word);
      });
      
      // Update button states
      this.updateButtonStatesFromSelections();
      
      // Visual feedback: Remove cross icons and start pulsating animation
      allWordHighlights.forEach((highlight, idx) => {
        const word = highlight.getAttribute('data-word');
        console.log(`[ButtonPanel] Setting up highlight #${idx + 1} for word "${word}"`);
        
        // Remove cross button
        const existingBtn = highlight.querySelector('.vocab-word-remove-btn');
        if (existingBtn) {
          existingBtn.remove();
        }
        
        // Add pulsating purple animation
        highlight.classList.add('vocab-word-loading');
      });
      
      // Prepare API payload (remove internal tracking property)
      const apiPayload = wordPayload.map(segment => ({
        textStartIndex: segment.textStartIndex,
        text: segment.text,
        important_words_location: segment.important_words_location
      }));
      
      console.log('[ButtonPanel] Sending API request with payload:', JSON.stringify(apiPayload, null, 2));
      
      // Call WordExplanationService with SSE
      WordExplanationService.explainWords(
        apiPayload,
        // onEvent callback - called for each word explanation
        (eventData) => {
          console.log('[ButtonPanel] ===== SSE EVENT RECEIVED =====');
          console.log('[ButtonPanel] Full event data:', JSON.stringify(eventData, null, 2));
          
          const wordInfo = eventData.word_info;
          if (!wordInfo) {
            console.warn('[ButtonPanel] No word_info in event data');
            return;
          }
          
          // Use word_info.location.word for matching instead of word_info.word
          // This fixes issues with incorrect word extraction and case sensitivity
          const targetWord = wordInfo.location?.word || wordInfo.word;
          const normalizedTargetWord = targetWord.toLowerCase().trim();
          
          console.log(`[ButtonPanel] ===== PROCESSING WORD: "${targetWord}" =====`);
          console.log(`[ButtonPanel] Word info - word: "${wordInfo.word}" (original)`);
          console.log(`[ButtonPanel] Word info - location.word: "${wordInfo.location?.word}" (using for matching)`);
          console.log(`[ButtonPanel] Target word for matching: "${targetWord}"`);
          console.log(`[ButtonPanel] Normalized target word: "${normalizedTargetWord}"`);
          console.log(`[ButtonPanel] Word info - textStartIndex: ${wordInfo.textStartIndex}`);
          console.log(`[ButtonPanel] Word location:`, wordInfo.location);
          console.log(`[ButtonPanel] Word meaning:`, wordInfo.meaning);
          console.log(`[ButtonPanel] Word examples:`, wordInfo.examples);
          
          // Special debugging for "government" word
          if (normalizedTargetWord === 'government' || wordInfo.word?.toLowerCase().includes('government')) {
            console.log(`[ButtonPanel] ===== SPECIAL DEBUG FOR GOVERNMENT WORD =====`);
            console.log(`[ButtonPanel] This is the government word!`);
            console.log(`[ButtonPanel] Full event data for government:`, JSON.stringify(eventData, null, 2));
          }
          
          // Log all available segments for debugging
          console.log('[ButtonPanel] Available segments for matching:');
          wordPayload.forEach((segment, idx) => {
            console.log(`[ButtonPanel] Segment #${idx + 1}:`, {
              textStartIndex: segment.textStartIndex,
              textEnd: segment.textStartIndex + segment.text.length,
              textPreview: segment.text.substring(0, 50) + '...',
              words: segment.important_words_location.map(w => w.word),
              highlightCount: segment._wordHighlights ? segment._wordHighlights.length : 0
            });
            
            // Special debugging for government word segments
            if (normalizedTargetWord === 'government' || wordInfo.word?.toLowerCase().includes('government')) {
              console.log(`[ButtonPanel] ===== GOVERNMENT SEGMENT DEBUG #${idx + 1} =====`);
              console.log(`[ButtonPanel] Segment textStartIndex: ${segment.textStartIndex}`);
              console.log(`[ButtonPanel] Segment text: "${segment.text}"`);
              console.log(`[ButtonPanel] Important words in segment:`, segment.important_words_location);
              console.log(`[ButtonPanel] Highlights in segment:`, segment._wordHighlights?.map(hl => ({
                dataWord: hl.getAttribute('data-word'),
                textContent: hl.textContent.trim(),
                classes: hl.className
              })));
            }
          });
          
          // Find the corresponding segment and highlight
          // First try exact match
          let matchingSegment = wordPayload.find(segment => 
            segment.textStartIndex === wordInfo.textStartIndex
          );
          
          console.log(`[ButtonPanel] Exact match result:`, matchingSegment ? 'FOUND' : 'NOT FOUND');
          
          // Special debugging for government word matching
          if (normalizedTargetWord === 'government' || wordInfo.word?.toLowerCase().includes('government')) {
            console.log(`[ButtonPanel] ===== GOVERNMENT EXACT MATCH DEBUG =====`);
            console.log(`[ButtonPanel] Looking for textStartIndex: ${wordInfo.textStartIndex}`);
            wordPayload.forEach((segment, idx) => {
              const isMatch = segment.textStartIndex === wordInfo.textStartIndex;
              console.log(`[ButtonPanel] Segment #${idx + 1} textStartIndex: ${segment.textStartIndex}, matches: ${isMatch}`);
            });
            console.log(`[ButtonPanel] Matching segment found:`, matchingSegment ? 'YES' : 'NO');
          }
          
          // If no exact match, try to find by word name and location within merged segments
          if (!matchingSegment) {
            console.log(`[ButtonPanel] No exact match for textStartIndex ${wordInfo.textStartIndex}, trying word-based matching`);
            
            matchingSegment = wordPayload.find(segment => {
              // Check if this segment contains the word using normalized target word
              const wordLocation = segment.important_words_location.find(w => 
                w.word.toLowerCase() === normalizedTargetWord
              );
              
              if (!wordLocation) return false;
              
              // Check if the textStartIndex falls within this segment's range
              const segmentEnd = segment.textStartIndex + segment.text.length;
              const isInRange = wordInfo.textStartIndex >= segment.textStartIndex && wordInfo.textStartIndex < segmentEnd;
              
              console.log(`[ButtonPanel] Checking segment (${segment.textStartIndex}-${segmentEnd}): word "${normalizedTargetWord}" found: ${!!wordLocation}, inRange: ${isInRange}`);
              
              // Special debugging for government word
              if (normalizedTargetWord === 'government' || wordInfo.word?.toLowerCase().includes('government')) {
                console.log(`[ButtonPanel] ===== GOVERNMENT WORD-BASED MATCH DEBUG =====`);
                console.log(`[ButtonPanel] Segment textStartIndex: ${segment.textStartIndex}`);
                console.log(`[ButtonPanel] Segment textEnd: ${segmentEnd}`);
                console.log(`[ButtonPanel] Word textStartIndex: ${wordInfo.textStartIndex}`);
                console.log(`[ButtonPanel] Word location found:`, wordLocation);
                console.log(`[ButtonPanel] Is in range: ${isInRange}`);
                console.log(`[ButtonPanel] All words in segment:`, segment.important_words_location.map(w => w.word));
              }
              
              return isInRange;
            });
            
            console.log(`[ButtonPanel] Word-based match result:`, matchingSegment ? 'FOUND' : 'NOT FOUND');
          }
          
          if (!matchingSegment) {
            console.error(`[ButtonPanel] ✗ NO MATCHING SEGMENT FOUND for textStartIndex ${wordInfo.textStartIndex}, word: "${targetWord}"`);
            console.log('[ButtonPanel] Available segments:', wordPayload.map(s => ({ 
              textStartIndex: s.textStartIndex, 
              textEnd: s.textStartIndex + s.text.length,
              words: s.important_words_location.map(w => w.word) 
            })));
            console.log(`[ButtonPanel] ✗ SKIPPING WORD "${targetWord}" - NO SEGMENT MATCH`);
            return;
          }
          
          console.log(`[ButtonPanel] ✓ Found matching segment with ${matchingSegment._wordHighlights ? matchingSegment._wordHighlights.length : 0} highlights`);
          
          if (matchingSegment && matchingSegment._wordHighlights) {
            // Find the specific word highlight within this segment
            const wordLocation = wordInfo.location;
            console.log(`[ButtonPanel] ===== LOOKING FOR HIGHLIGHT ELEMENT =====`);
            console.log(`[ButtonPanel] Looking for word "${targetWord}" (normalized: "${normalizedTargetWord}") in ${matchingSegment._wordHighlights.length} highlights`);
            
            // Log all highlights in detail
            matchingSegment._wordHighlights.forEach((hl, idx) => {
              const dataWord = hl.getAttribute('data-word');
              const textContent = hl.textContent.trim();
              const classes = hl.className;
              const isCurrentlyLoading = hl.classList.contains('vocab-word-loading');
              const isAlreadyExplained = hl.classList.contains('vocab-word-explained');
              
              console.log(`[ButtonPanel] Highlight #${idx + 1}:`, {
                dataWord: dataWord,
                textContent: textContent,
                classes: classes,
                isCurrentlyLoading: isCurrentlyLoading,
                isAlreadyExplained: isAlreadyExplained,
                matchesTargetWord: dataWord && dataWord.toLowerCase() === normalizedTargetWord
              });
              
              // Special debugging for government word highlights
              if (normalizedTargetWord === 'government' || wordInfo.word?.toLowerCase().includes('government')) {
                console.log(`[ButtonPanel] ===== GOVERNMENT HIGHLIGHT DEBUG #${idx + 1} =====`);
                console.log(`[ButtonPanel] Highlight data-word: "${dataWord}"`);
                console.log(`[ButtonPanel] Highlight textContent: "${textContent}"`);
                console.log(`[ButtonPanel] Highlight classes: "${classes}"`);
                console.log(`[ButtonPanel] Target word: "${normalizedTargetWord}"`);
                console.log(`[ButtonPanel] Does data-word match target: ${dataWord && dataWord.toLowerCase() === normalizedTargetWord}`);
                console.log(`[ButtonPanel] Does textContent match target: ${textContent.toLowerCase() === normalizedTargetWord}`);
                console.log(`[ButtonPanel] Is currently loading: ${isCurrentlyLoading}`);
                console.log(`[ButtonPanel] Is already explained: ${isAlreadyExplained}`);
              }
            });
            
            // Try multiple matching strategies for robustness
            console.log(`[ButtonPanel] ===== ATTEMPTING HIGHLIGHT MATCHING =====`);
            
            let wordHighlight = matchingSegment._wordHighlights.find(hl => {
              const dataWord = hl.getAttribute('data-word');
              const matches = dataWord && dataWord.toLowerCase() === normalizedTargetWord;
              console.log(`[ButtonPanel] Strategy 1 (data-word): "${dataWord}" === "${normalizedTargetWord}" = ${matches}`);
              
              // Special debugging for government word
              if (normalizedTargetWord === 'government' || wordInfo.word?.toLowerCase().includes('government')) {
                console.log(`[ButtonPanel] ===== GOVERNMENT STRATEGY 1 DEBUG =====`);
                console.log(`[ButtonPanel] Checking highlight with data-word: "${dataWord}"`);
                console.log(`[ButtonPanel] Target normalized word: "${normalizedTargetWord}"`);
                console.log(`[ButtonPanel] Match result: ${matches}`);
              }
              
              return matches;
            });
            
            // If not found by data-word attribute, try by text content
            if (!wordHighlight) {
              console.log(`[ButtonPanel] Strategy 1 failed, trying Strategy 2 (text content) for word "${normalizedTargetWord}"`);
              wordHighlight = matchingSegment._wordHighlights.find(hl => {
                const highlightText = hl.textContent.trim().toLowerCase();
                const matches = highlightText === normalizedTargetWord;
                console.log(`[ButtonPanel] Strategy 2 (text content): "${highlightText}" === "${normalizedTargetWord}" = ${matches}`);
                
                // Special debugging for government word
                if (normalizedTargetWord === 'government' || wordInfo.word?.toLowerCase().includes('government')) {
                  console.log(`[ButtonPanel] ===== GOVERNMENT STRATEGY 2 DEBUG =====`);
                  console.log(`[ButtonPanel] Checking highlight with textContent: "${highlightText}"`);
                  console.log(`[ButtonPanel] Target normalized word: "${normalizedTargetWord}"`);
                  console.log(`[ButtonPanel] Match result: ${matches}`);
                }
                
                return matches;
              });
            }
            
            // If still not found, try partial matching
            if (!wordHighlight) {
              console.log(`[ButtonPanel] Strategy 2 failed, trying Strategy 3 (partial matching) for word "${normalizedTargetWord}"`);
              wordHighlight = matchingSegment._wordHighlights.find(hl => {
                const highlightText = hl.textContent.trim().toLowerCase();
                const matches = highlightText.includes(normalizedTargetWord) || 
                       normalizedTargetWord.includes(highlightText);
                console.log(`[ButtonPanel] Strategy 3 (partial): "${highlightText}" includes "${normalizedTargetWord}" = ${matches}`);
                
                // Special debugging for government word
                if (normalizedTargetWord === 'government' || wordInfo.word?.toLowerCase().includes('government')) {
                  console.log(`[ButtonPanel] ===== GOVERNMENT STRATEGY 3 DEBUG =====`);
                  console.log(`[ButtonPanel] Checking highlight with textContent: "${highlightText}"`);
                  console.log(`[ButtonPanel] Target normalized word: "${normalizedTargetWord}"`);
                  console.log(`[ButtonPanel] Partial match result: ${matches}`);
                }
                
                return matches;
              });
            }
            
            if (wordHighlight) {
              console.log(`[ButtonPanel] ===== APPLYING GREEN BACKGROUND =====`);
              console.log(`[ButtonPanel] ✓ Found matching highlight for word "${targetWord}"`);
              console.log(`[ButtonPanel] Highlight element before changes:`, {
                classes: wordHighlight.className,
                dataWord: wordHighlight.getAttribute('data-word'),
                textContent: wordHighlight.textContent.trim(),
                hasLoadingClass: wordHighlight.classList.contains('vocab-word-loading'),
                hasExplainedClass: wordHighlight.classList.contains('vocab-word-explained')
              });
              
              // Remove pulsating animation
              console.log(`[ButtonPanel] Removing loading class from highlight`);
              wordHighlight.classList.remove('vocab-word-loading');
              
              // Remove old purple cross button if exists
              const oldBtn = wordHighlight.querySelector('.vocab-word-remove-btn');
              if (oldBtn) {
                console.log(`[ButtonPanel] Removing old purple cross button`);
                oldBtn.remove();
              }
              
              // Change background to green
              console.log(`[ButtonPanel] Adding vocab-word-explained class for green background`);
              wordHighlight.classList.add('vocab-word-explained');
              
              // Store explanation data on the element
              console.log(`[ButtonPanel] Storing explanation data on element`);
              wordHighlight.setAttribute('data-meaning', wordInfo.meaning);
              wordHighlight.setAttribute('data-examples', JSON.stringify(wordInfo.examples));
              
              // Add green wireframe cross button
              console.log(`[ButtonPanel] Adding green cross button`);
              const greenCrossBtn = WordSelector.createRemoveExplainedButton(targetWord);
              wordHighlight.appendChild(greenCrossBtn);
              
              // Store in explainedWords map
              const normalizedWord = normalizedTargetWord;
              if (!WordSelector.explainedWords.has(normalizedWord)) {
                console.log(`[ButtonPanel] Creating new entry in explainedWords map for "${normalizedWord}"`);
                WordSelector.explainedWords.set(normalizedWord, {
                  word: targetWord,
                  meaning: wordInfo.meaning,
                  examples: wordInfo.examples,
                  shouldAllowFetchMoreExamples: wordInfo.shouldAllowFetchMoreExamples || false,
                  hasCalledGetMoreExamples: false, // Track if get-more-explanations API has been called
                  highlights: new Set()
                });
              }
              WordSelector.explainedWords.get(normalizedWord).highlights.add(wordHighlight);
              
              // Setup hover and click interactions for this word
              console.log(`[ButtonPanel] Setting up word interactions`);
              WordSelector.setupWordInteractions(wordHighlight);
              
              // Update button states to show "Remove meanings" button
              console.log(`[ButtonPanel] Updating button states`);
              ButtonPanel.updateButtonStatesFromSelections();
              
              console.log(`[ButtonPanel] ===== GREEN BACKGROUND APPLIED SUCCESSFULLY =====`);
              console.log('[ButtonPanel] ✓ Updated UI for word:', targetWord);
              console.log('[ButtonPanel] Highlight element after changes:', {
                classes: wordHighlight.className,
                hasLoadingClass: wordHighlight.classList.contains('vocab-word-loading'),
                hasExplainedClass: wordHighlight.classList.contains('vocab-word-explained')
              });
              console.log('[ButtonPanel] explainedWords container size:', WordSelector.explainedWords.size);
            } else {
              console.error(`[ButtonPanel] ===== HIGHLIGHT MATCHING FAILED =====`);
              console.error(`[ButtonPanel] ✗ No matching highlight found for word "${targetWord}"`);
              console.error(`[ButtonPanel] All matching strategies failed for word "${targetWord}"`);
              console.error(`[ButtonPanel] Available highlights:`, matchingSegment._wordHighlights.map(hl => ({
                word: hl.getAttribute('data-word'),
                text: hl.textContent.trim(),
                classes: hl.className
              })));
              console.error(`[ButtonPanel] ✗ WORD "${targetWord}" WILL NOT GET GREEN BACKGROUND`);
            }
          }
        },
        // onComplete callback
        () => {
          console.log('[ButtonPanel] ===== SSE STREAM COMPLETE =====');
          console.log('[ButtonPanel] All word explanations complete');
          
          // Count how many words are still loading
          let stillLoading = 0;
          const stillLoadingWords = [];
          
          console.log('[ButtonPanel] ===== CHECKING FINAL STATUS OF ALL HIGHLIGHTS =====');
          allWordHighlights.forEach((highlight, idx) => {
            const word = highlight.getAttribute('data-word');
            const isStillLoading = highlight.classList.contains('vocab-word-loading');
            const isExplained = highlight.classList.contains('vocab-word-explained');
            
            console.log(`[ButtonPanel] Highlight #${idx + 1} for word "${word}":`, {
              isStillLoading: isStillLoading,
              isExplained: isExplained,
              classes: highlight.className,
              textContent: highlight.textContent.trim()
            });
            
            if (isStillLoading) {
              stillLoading++;
              stillLoadingWords.push(word);
              console.warn(`[ButtonPanel] ⚠️ Highlight #${idx + 1} for word "${word}" still in loading state - NO API RESPONSE RECEIVED`);
              console.warn(`[ButtonPanel] ⚠️ This word will NOT get green background because no API response was received`);
              highlight.classList.remove('vocab-word-loading');
            } else if (isExplained) {
              console.log(`[ButtonPanel] ✅ Highlight #${idx + 1} for word "${word}" successfully explained with green background`);
            } else {
              console.warn(`[ButtonPanel] ❓ Highlight #${idx + 1} for word "${word}" is neither loading nor explained - UNKNOWN STATE`);
            }
          });
          
          console.log(`[ButtonPanel] ===== FINAL SUMMARY =====`);
          console.log(`[ButtonPanel] Total highlights: ${allWordHighlights.length}`);
          console.log(`[ButtonPanel] Successfully explained: ${allWordHighlights.length - stillLoading}`);
          console.log(`[ButtonPanel] Still loading (no response): ${stillLoading}`);
          console.log(`[ButtonPanel] Success rate: ${Math.round((allWordHighlights.length - stillLoading) / allWordHighlights.length * 100)}%`);
          
          if (stillLoadingWords.length > 0) {
            console.warn(`[ButtonPanel] ⚠️ Words that did NOT receive API responses:`, stillLoadingWords);
            console.warn(`[ButtonPanel] ⚠️ These words will remain purple (not green) because no backend response was received`);
          }
          
          console.log('[ButtonPanel] ===== MAGIC MEANING: Complete =====');
        },
        // onError callback
        (error) => {
          console.error('[ButtonPanel] ===== SSE ERROR =====');
          console.error('[ButtonPanel] Error during word explanation:', error);
          
          // Remove pulsating animation from all highlights
          allWordHighlights.forEach((highlight, idx) => {
            const word = highlight.getAttribute('data-word');
            console.log(`[ButtonPanel] Removing loading state from highlight #${idx + 1} for word "${word}"`);
            highlight.classList.remove('vocab-word-loading');
          });
          
          // Show error notification
          TextSelector.showNotification('Error getting word meanings. Please try again.');
        }
      );
    }
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
   * Handler for Custom content button
   */
  handleCustomContent() {
    console.log('[ButtonPanel] Custom content button clicked');
    
    // For now, just show an alert - this can be expanded later
    alert('Custom content feature coming soon!');
  },

  /**
   * Show the vertical button group
   */
  showVerticalButtonGroup() {
    if (this.verticalButtonGroup) {
      this.verticalButtonGroup.classList.add('visible');
      this.updateState({ showVerticalGroup: true });
    }
  },

  /**
   * Hide the vertical button group
   */
  hideVerticalButtonGroup() {
    if (this.verticalButtonGroup) {
      this.verticalButtonGroup.classList.remove('visible');
      this.updateState({ showVerticalGroup: false });
    }
  },

  /**
   * Hide the custom content button
   */
  hideCustomContentButton() {
    const customContentBtn = document.getElementById('custom-content');
    console.log('[ButtonPanel] Attempting to hide custom content button:', customContentBtn);
    
    if (customContentBtn) {
      // Store the button's parent and next sibling for reinsertion
      this.customContentButtonParent = customContentBtn.parentNode;
      this.customContentButtonNextSibling = customContentBtn.nextSibling;
      
      console.log('[ButtonPanel] Stored parent:', this.customContentButtonParent);
      console.log('[ButtonPanel] Stored next sibling:', this.customContentButtonNextSibling);
      
      // Simply remove from DOM - this will immediately fix the layout
      customContentBtn.remove();
      console.log('[ButtonPanel] Custom content button removed from DOM');
    } else {
      console.log('[ButtonPanel] Custom content button not found!');
    }
  },

  /**
   * Show the custom content button
   */
  showCustomContentButton() {
    // Only recreate if we have the stored references
    if (this.customContentButtonParent) {
      // Recreate the button
      const customContentBtn = this.createButton({
        id: 'custom-content',
        className: 'vocab-btn vocab-btn-solid-purple',
        icon: this.createContentIcon(),
        text: 'Custom content',
        type: 'solid-purple'
      });
      
      // Reattach event listeners
      customContentBtn.addEventListener('click', (e) => {
        console.log('Custom content clicked');
        this.toggleVerticalButtonGroup();
      });
      
      customContentBtn.addEventListener('mouseenter', () => {
        this.showVerticalButtonGroup();
      });
      
      customContentBtn.addEventListener('mouseleave', () => {
        setTimeout(() => {
          if (!this.verticalButtonGroup?.matches(':hover')) {
            this.hideVerticalButtonGroup();
          }
        }, 100);
      });
      
      // Insert back into the DOM
      if (this.customContentButtonNextSibling) {
        this.customContentButtonParent.insertBefore(customContentBtn, this.customContentButtonNextSibling);
      } else {
        this.customContentButtonParent.appendChild(customContentBtn);
      }
      
      // Store reference for future removal
      this.customContentButton = customContentBtn;
    }
  },

  /**
   * Toggle the vertical button group
   */
  toggleVerticalButtonGroup() {
    if (this.verticalButtonGroup) {
      if (this.verticalButtonGroup.classList.contains('visible')) {
        this.hideVerticalButtonGroup();
      } else {
        this.showVerticalButtonGroup();
      }
    }
  },

  /**
   * Handler for PDF button
   */
  handlePDFButton() {
    console.log('[ButtonPanel] PDF button clicked');
    // Hide the vertical group after selection
    this.hideVerticalButtonGroup();
    // Hide the custom content button
    this.hideCustomContentButton();
    // TODO: Implement PDF functionality
    alert('PDF upload feature coming soon!');
    // Show the custom content button again after alert
    setTimeout(() => {
      this.showCustomContentButton();
    }, 100);
  },

  /**
   * Handler for Image button
   */
  handleImageButton() {
    console.log('[ButtonPanel] Image button clicked');
    // Hide the vertical group after selection
    this.hideVerticalButtonGroup();
    // Hide the custom content button
    this.hideCustomContentButton();
    // TODO: Implement Image functionality
    alert('Image upload feature coming soon!');
    // Show the custom content button again after alert
    setTimeout(() => {
      this.showCustomContentButton();
    }, 100);
  },

  /**
   * Handler for Topics button
   */
  handleTopicsButton() {
    console.log('[ButtonPanel] Topics button clicked');
    // Hide the vertical group after selection
    this.hideVerticalButtonGroup();
    // Hide the custom content button
    this.hideCustomContentButton();
    
    // Check if there's already content in memory
    if (this.topicsModal.customContentModal.tabs && this.topicsModal.customContentModal.tabs.length > 0) {
      // Show custom content modal with existing tabs
      this.showCustomContentModalWithTabs();
    } else {
      // Show the topics modal for new content
      this.showTopicsModal();
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

    // Update enabled/disabled state of magic meaning button
    const magicMeaningBtn = document.getElementById('magic-meaning');
    if (magicMeaningBtn) {
      if (this.state.isMagicMeaningEnabled) {
        magicMeaningBtn.classList.remove('disabled');
      } else {
        magicMeaningBtn.classList.add('disabled');
      }
    }

    // Update visibility of Ask button
    const askBtn = document.getElementById('ask');
    if (askBtn) {
      if (this.state.showAsk) {
        askBtn.classList.remove('hidden');
      } else {
        askBtn.classList.add('hidden');
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
    const hasSimplifiedTexts = TextSelector.simplifiedTexts.size > 0;
    const hasExplainedWords = WordSelector.explainedWords.size > 0;
    
    console.log('[ButtonPanel] Updating button states:', {
      hasWords,
      hasTexts,
      hasAskedTexts,
      hasSimplifiedTexts,
      hasExplainedWords,
      showRemoveMeanings: hasAskedTexts || hasSimplifiedTexts || hasExplainedWords
    });
    
    // Show "Remove all meanings" if there are any asked texts, simplified texts, OR explained words
    this.setShowRemoveMeanings(hasAskedTexts || hasSimplifiedTexts || hasExplainedWords);
    
    // Show "Deselect all" if there are any words or texts selected
    this.setShowDeselectAll(hasWords || hasTexts);
    
    // Enable "Magic meaning" if there are any words or texts selected
    this.setMagicMeaningEnabled(hasWords || hasTexts);
    
    // Show "Ask" only if exactly one text is selected
    this.setAskVisible(hasExactlyOneText);
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
   * Set visibility of Ask button
   * @param {boolean} show - Whether to show the button
   */
  setAskVisible(show) {
    this.updateState({ showAsk: show });
  },

  // ===================================
  // Topics Modal Functionality
  // ===================================
  
  /**
   * Topics modal state
   */
  topicsModal: {
    overlay: null,
    modal: null,
    topics: [],
    wordCount: 100,
    difficulty: 'hard',
    processingOverlay: null,
    customContentModal: {
      overlay: null,
      modal: null,
      content: '',
      searchTerm: '',
      tabs: [],
      activeTabId: null,
      tabCounter: 0
    }
  },

  /**
   * Create and show the topics modal
   */
  showTopicsModal() {
    console.log('[ButtonPanel] Showing topics modal');
    
  
    // Create modal if it doesn't exist
    if (!this.topicsModal.overlay) {
      this.createTopicsModal();
      
      // Wait for DOM to be ready before showing modal using a single requestAnimationFrame
      requestAnimationFrame(() => {
        this.showModalWithAnimation();
      });
    
      // Hide the vertical button group
      this.hideVerticalButtonGroup();
    } else {
      // Modal already exists; show without clearing previous inputs
      this.showModalWithAnimation();
    }
  },

  /**
   * Show modal with animation and initialize everything
   */
  showModalWithAnimation() {
    // Show modal with animation
    this.topicsModal.overlay.classList.add('visible');
    this.topicsModal.modal.classList.add('visible');
    
    // Focus on input field
    const input = this.topicsModal.modal.querySelector('.vocab-topics-input');
    if (input) {
      setTimeout(() => input.focus(), 300);
    }
    
    // Initialize plus icon state
    setTimeout(() => {
      if (this.updatePlusIconState) {
        this.updatePlusIconState();
      }
    }, 300);
    
    // Initialize topics UI state
    setTimeout(() => {
      this.updateTopicsUIState();
    }, 300);
    
    // Initialize slider positions
    setTimeout(() => {
      this.initializeSliders();
    }, 200);
  },

  /**
   * Hide the topics modal
   */
  hideTopicsModal() {
    console.log('[ButtonPanel] Hiding topics modal');
    
    if (this.topicsModal.overlay) {
      this.topicsModal.overlay.classList.remove('visible');
      this.topicsModal.modal.classList.remove('visible');
    }
    
    // Remove blur from custom content modal if it was blurred
    if (this.topicsModal.customContentModal.overlay) {
      this.topicsModal.customContentModal.overlay.style.filter = 'none';
    }
    
    // Only show the custom content button if the CustomContent modal is not open
    // AND if we're not in the process of showing it (check if overlay exists)
    if ((!this.topicsModal.customContentModal.overlay || 
         !this.topicsModal.customContentModal.overlay.classList.contains('visible'))) {
      this.showCustomContentButton();
    }

    // Clear inputs on close so next open starts clean
    this.clearTopicsModalInputs();
  },

  /**
   * Create the topics modal HTML structure
   */
  createTopicsModal() {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'vocab-topics-modal-overlay';
    overlay.id = 'vocab-topics-modal-overlay';
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'vocab-topics-modal';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'vocab-topics-modal-header';
    
    const title = document.createElement('h2');
    title.className = 'vocab-topics-modal-title';
    title.textContent = 'Generate content on topics';
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'vocab-topics-modal-close';
    closeBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 4L4 12M4 4L12 12" stroke="#A24EFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    closeBtn.setAttribute('aria-label', 'Close modal');
    
    header.appendChild(title);
    
    // Create first container (input + generate button)
    const firstContainer = document.createElement('div');
    firstContainer.className = 'vocab-topics-first-container';
    
    // Input section (left side of first container)
    const inputSection = document.createElement('div');
    inputSection.className = 'vocab-topics-input-section';
    
    const inputContainer = document.createElement('div');
    inputContainer.className = 'vocab-topics-input-container';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'vocab-topics-input';
    input.placeholder = 'Enter topic name ...';
    
    const searchIcon = document.createElement('div');
    searchIcon.className = 'vocab-topics-search-icon disabled';
    searchIcon.innerHTML = this.createPlusIcon();
    
    inputContainer.appendChild(input);
    inputContainer.appendChild(searchIcon);
    inputSection.appendChild(inputContainer);
    
    // Generate button (right side of first container)
    const generateBtn = document.createElement('button');
    generateBtn.className = 'vocab-topics-generate-btn hidden';
    generateBtn.textContent = 'Generate content';
    
    firstContainer.appendChild(inputSection);
    
    // Create second container (topic tags + controls)
    const secondContainer = document.createElement('div');
    secondContainer.className = 'vocab-topics-second-container hidden';
    
    // Topic tags section (left side of second container)
    const tagsSection = document.createElement('div');
    tagsSection.className = 'vocab-topics-tags-section';
    
    const tagsContainer = document.createElement('div');
    tagsContainer.className = 'vocab-topics-tags-container';
    
    const tags = document.createElement('div');
    tags.className = 'vocab-topics-tags';
    tags.id = 'vocab-topics-tags';
    
    // Tags container starts empty
    tagsContainer.appendChild(tags);
    tagsSection.appendChild(tagsContainer);
    
    // Controls section (right side of second container)
    const controlsSection = document.createElement('div');
    controlsSection.className = 'vocab-topics-controls-section';
    
    // Word count control (top of controls section)
    const wordCountGroup = document.createElement('div');
    wordCountGroup.className = 'vocab-topics-word-count-group';
    
    const wordCountLabel = document.createElement('h3');
    wordCountLabel.className = 'vocab-topics-control-label';
    wordCountLabel.textContent = 'Total Word Count';
    
    const wordCountButtons = document.createElement('div');
    wordCountButtons.className = 'vocab-topics-word-count-buttons';
    
    // Create sliding background
    const wordCountSlider = document.createElement('div');
    wordCountSlider.className = 'vocab-topics-word-count-slider';
    wordCountSlider.id = 'word-count-slider';
    
    const btn100 = document.createElement('button');
    btn100.className = 'vocab-topics-word-count-btn selected';
    btn100.textContent = '100';
    btn100.setAttribute('data-count', '100');
    
    const btn250 = document.createElement('button');
    btn250.className = 'vocab-topics-word-count-btn';
    btn250.textContent = '250';
    btn250.setAttribute('data-count', '250');
    
    const btn500 = document.createElement('button');
    btn500.className = 'vocab-topics-word-count-btn';
    btn500.textContent = '500';
    btn500.setAttribute('data-count', '500');
    
    wordCountButtons.appendChild(wordCountSlider);
    wordCountButtons.appendChild(btn100);
    wordCountButtons.appendChild(btn250);
    wordCountButtons.appendChild(btn500);
    
    wordCountGroup.appendChild(wordCountLabel);
    wordCountGroup.appendChild(wordCountButtons);
    
    // Difficulty control (bottom of controls section)
    const difficultyGroup = document.createElement('div');
    difficultyGroup.className = 'vocab-topics-difficulty-group';
    
    const difficultyLabel = document.createElement('h3');
    difficultyLabel.className = 'vocab-topics-control-label';
    difficultyLabel.textContent = 'Difficulty Level';
    
    const difficultyButtons = document.createElement('div');
    difficultyButtons.className = 'vocab-topics-difficulty-buttons';
    
    // Create sliding background
    const difficultySlider = document.createElement('div');
    difficultySlider.className = 'vocab-topics-difficulty-slider';
    difficultySlider.id = 'difficulty-slider';
    
    const easyBtn = document.createElement('button');
    easyBtn.className = 'vocab-topics-difficulty-btn easy';
    easyBtn.textContent = 'Easy';
    easyBtn.setAttribute('data-difficulty', 'easy');
    
    const mediumBtn = document.createElement('button');
    mediumBtn.className = 'vocab-topics-difficulty-btn medium';
    mediumBtn.textContent = 'Medium';
    mediumBtn.setAttribute('data-difficulty', 'medium');
    
    const hardBtn = document.createElement('button');
    hardBtn.className = 'vocab-topics-difficulty-btn hard selected';
    hardBtn.textContent = 'Hard';
    hardBtn.setAttribute('data-difficulty', 'hard');
    
    difficultyButtons.appendChild(difficultySlider);
    difficultyButtons.appendChild(easyBtn);
    difficultyButtons.appendChild(mediumBtn);
    difficultyButtons.appendChild(hardBtn);
    
    difficultyGroup.appendChild(difficultyLabel);
    difficultyGroup.appendChild(difficultyButtons);
    
    // Assemble controls section
    controlsSection.appendChild(wordCountGroup);
    controlsSection.appendChild(difficultyGroup);
    
    // Assemble second container
    secondContainer.appendChild(tagsSection);
    secondContainer.appendChild(controlsSection);
    
    // Create content container for everything except header and generate button
    const contentContainer = document.createElement('div');
    contentContainer.className = 'vocab-topics-content-container';
    
    // Add content to the container (excluding generate button)
    contentContainer.appendChild(firstContainer);
    contentContainer.appendChild(secondContainer);
    
    // Assemble modal
    modal.appendChild(header);
    modal.appendChild(contentContainer);
    modal.appendChild(generateBtn);
    modal.appendChild(closeBtn);
    
    overlay.appendChild(modal);
    
    // Add to document
    document.body.appendChild(overlay);
    
    // Store references
    this.topicsModal.overlay = overlay;
    this.topicsModal.modal = modal;
    
    // Attach event listeners
    this.attachTopicsModalListeners();
  },

  /**
   * Attach event listeners to topics modal
   */
  attachTopicsModalListeners() {
    const overlay = this.topicsModal.overlay;
    const modal = this.topicsModal.modal;
    
    const input = modal.querySelector('.vocab-topics-input');
    const closeBtn = modal.querySelector('.vocab-topics-modal-close');
    const generateBtn = modal.querySelector('.vocab-topics-generate-btn');
    const wordCountButtons = modal.querySelectorAll('.vocab-topics-word-count-btn');
    const difficultyButtons = modal.querySelectorAll('.vocab-topics-difficulty-btn');
    const plusIcon = modal.querySelector('.vocab-topics-search-icon');
    
    // Check for null elements before adding listeners
    if (!overlay || !modal || !closeBtn || !input || !generateBtn || !plusIcon) {
      console.error('Topics modal: Missing required elements for event listeners');
      return;
    }
    
    // Close modal events
    closeBtn.addEventListener('click', () => this.hideTopicsModal());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.hideTopicsModal();
      }
    });
    
    // Function to add topic
    const addTopicFromInput = () => {
      const topic = input.value.trim();
      if (topic) {
        this.addTopic(topic);
        input.value = '';
        updatePlusIconState();
      }
    };
    
    // Function to update plus icon state
    const updatePlusIconState = () => {
      if (plusIcon) {
        if (input.value.trim()) {
          plusIcon.classList.remove('disabled');
        } else {
          plusIcon.classList.add('disabled');
        }
      }
    };
    
    // Store reference for external access
    this.updatePlusIconState = updatePlusIconState;
    
    // Initialize plus icon state immediately
    updatePlusIconState();
    
    // Input events - add topic on Enter
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault(); // Prevent form submission if this is in a form
        addTopicFromInput();
      }
    });
    
    // Input change events - update plus icon state
    input.addEventListener('input', () => {
      updatePlusIconState();
    });
    
    // Plus icon click event
    plusIcon.addEventListener('click', () => {
      if (!plusIcon.classList.contains('disabled')) {
        addTopicFromInput();
      }
    });
    
    // Generate button
    generateBtn.addEventListener('click', () => this.handleGenerateStory());
    
    // Word count buttons
    wordCountButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        // Don't remove selected class yet - animate first
        // Animate slider to new position
        this.animateSlider('word-count-slider', e.target);
        
        // Update word count
        this.topicsModal.wordCount = parseInt(e.target.getAttribute('data-count'));
        
        // Remove selected class from all buttons after animation starts
        wordCountButtons.forEach(b => b.classList.remove('selected'));
        
        // Add selected class to clicked button
        e.target.classList.add('selected');
      });
    });
    
    // Difficulty buttons
    difficultyButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        // Don't remove selected class yet - animate first
        // Animate slider to new position and update color
        this.animateSlider('difficulty-slider', e.target);
        this.updateDifficultySliderColor(e.target);
        
        // Update difficulty
        this.topicsModal.difficulty = e.target.getAttribute('data-difficulty');
        
        // Remove selected class from all buttons after animation starts
        difficultyButtons.forEach(b => b.classList.remove('selected'));
        
        // Add selected class to clicked button
        e.target.classList.add('selected');
      });
    });
  },

  /**
   * Add a topic to the list
   * @param {string} topic - The topic to add
   */
  addTopic(topic) {
    if (!topic || this.topicsModal.topics.includes(topic)) {
      return;
    }
    
    console.log('[ButtonPanel] Adding topic:', topic);
    
    // Add to topics array
    this.topicsModal.topics.push(topic);
    
    // Create and add tag element
    const tag = this.createTopicTag(topic);
    const tagsContainer = this.topicsModal.modal.querySelector('#vocab-topics-tags');
    tagsContainer.appendChild(tag);
    
    // Update UI state
    this.updateTopicsUIState();
  },

  /**
   * Create a topic tag element
   * @param {string} topic - The topic text
   * @returns {HTMLElement} Topic tag element
   */
  createTopicTag(topic) {
    const tag = document.createElement('div');
    tag.className = 'vocab-topics-tag';
    tag.setAttribute('data-topic', topic);
    
    const tagText = document.createElement('span');
    tagText.textContent = topic;
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'vocab-topics-tag-remove';
    removeBtn.innerHTML = '×';
    removeBtn.setAttribute('aria-label', `Remove ${topic}`);
    
    tag.appendChild(tagText);
    tag.appendChild(removeBtn);
    
    // Add remove event listener
    removeBtn.addEventListener('click', () => this.removeTopic(topic));
    
    return tag;
  },

  /**
   * Remove a topic from the list
   * @param {string} topic - The topic to remove
   */
  removeTopic(topic) {
    console.log('[ButtonPanel] Removing topic:', topic);
    
    // Remove from topics array
    const index = this.topicsModal.topics.indexOf(topic);
    if (index > -1) {
      this.topicsModal.topics.splice(index, 1);
    }
    
    // Remove tag element
    const tag = this.topicsModal.modal.querySelector(`[data-topic="${topic}"]`);
    if (tag) {
      tag.remove();
    }
    
    // Update UI state
    this.updateTopicsUIState();
  },

  /**
   * Update UI state based on whether there are topics
   */
  updateTopicsUIState() {
    const hasTopics = this.topicsModal.topics.length > 0;
    const secondContainer = this.topicsModal.modal.querySelector('.vocab-topics-second-container');
    const generateBtn = this.topicsModal.modal.querySelector('.vocab-topics-generate-btn');
    const contentContainer = this.topicsModal.modal.querySelector('.vocab-topics-content-container');
    
    if (secondContainer) {
      if (hasTopics) {
        secondContainer.classList.remove('hidden');
        // Ensure it's visible and interactive
        secondContainer.style.display = 'flex';
      } else {
        secondContainer.classList.add('hidden');
        // Hide after animation completes
        setTimeout(() => {
          if (secondContainer.classList.contains('hidden')) {
            secondContainer.style.display = 'none';
          }
        }, 300);
      }
    }
    
    if (generateBtn) {
      if (hasTopics) {
        generateBtn.classList.remove('hidden');
        // Ensure it's visible and interactive
        generateBtn.style.display = 'block';
      } else {
        generateBtn.classList.add('hidden');
        // Hide after animation completes
        setTimeout(() => {
          if (generateBtn.classList.contains('hidden')) {
            generateBtn.style.display = 'none';
          }
        }, 300);
      }
    }
  },

  /**
   * Handle generate story button click
   */
  async handleGenerateStory() {
    console.log('[ButtonPanel] ===== GENERATE STORY STARTED =====');
    console.log('[ButtonPanel] Generating story with topics:', this.topicsModal.topics);
    console.log('[ButtonPanel] Word count:', this.topicsModal.wordCount);
    console.log('[ButtonPanel] Difficulty:', this.topicsModal.difficulty);
    console.log('[ButtonPanel] customContentModal state:', this.topicsModal.customContentModal);
    
    if (this.topicsModal.topics.length === 0) {
      alert('Please add at least one topic before generating a story.');
      return;
    }
    
    // Check if this is a regeneration
    const generateBtn = this.topicsModal.modal.querySelector('.vocab-topics-generate-btn');
    const isRegenerate = generateBtn && generateBtn.getAttribute('data-regenerate') === 'true';
    const tabId = generateBtn ? generateBtn.getAttribute('data-tab-id') : null;
    
    // Show processing overlay
    this.showProcessingOverlay();
    
    try {
      // Call the get-random-paragraph API
      const response = await ApiService.getRandomParagraph({
        topics: this.topicsModal.topics,
        difficulty_level: this.topicsModal.difficulty,
        word_count: this.topicsModal.wordCount
      });
      
      if (response.success) {
        console.log('[ButtonPanel] API response successful');
        // Hide processing overlay
        this.hideProcessingOverlay();
        
        if (isRegenerate && tabId) {
          console.log('[ButtonPanel] Regenerating content for tab:', tabId);
          // Update existing tab content
          const tab = this.topicsModal.customContentModal.tabs.find(t => t.id === tabId);
          if (tab) {
            tab.content = response.data.text;
            // Update the editor content
            this.updateCustomContentEditor(response.data.text);
          }
        } else {
          console.log('[ButtonPanel] Creating new tab with content');
          // Show custom content modal with the response (new tab)
          this.showCustomContentModal(response.data.text, true);
        }
        
        // Reset generate button if it was regenerating
        if (isRegenerate && generateBtn) {
          generateBtn.textContent = 'Generate content';
          generateBtn.removeAttribute('data-regenerate');
          generateBtn.removeAttribute('data-tab-id');
        }
        
        // Auto-close topics modal after successful generation
        this.hideTopicsModal();
      } else {
        // Hide processing overlay
        this.hideProcessingOverlay();
        
        // Show error message
        alert(`Error generating story: ${response.error}`);
      }
    } catch (error) {
      console.error('[ButtonPanel] Error generating story:', error);
      
      // Hide processing overlay
      this.hideProcessingOverlay();
      
      // Show error message
      alert(`Error generating story: ${error.message}`);
    }
  },

  /**
   * Show processing overlay
   */
  showProcessingOverlay() {
    console.log('[ButtonPanel] Showing processing overlay');
    
    // Create processing overlay if it doesn't exist
    if (!this.topicsModal.processingOverlay) {
      this.createProcessingOverlay();
    }
    
    // Show the overlay
    this.topicsModal.processingOverlay.classList.add('visible');
  },

  /**
   * Hide processing overlay
   */
  hideProcessingOverlay() {
    console.log('[ButtonPanel] Hiding processing overlay');
    
    if (this.topicsModal.processingOverlay) {
      this.topicsModal.processingOverlay.classList.remove('visible');
    }
  },

  /**
   * Create processing overlay HTML structure
   */
  createProcessingOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'vocab-processing-overlay';
    overlay.id = 'vocab-processing-overlay';
    
    const content = document.createElement('div');
    content.className = 'vocab-processing-content';
    
    const text = document.createElement('div');
    text.className = 'vocab-processing-text';
    text.textContent = 'Generating content from topics ...';
    
    const icon = document.createElement('div');
    icon.className = 'vocab-processing-icon';
    
    content.appendChild(text);
    content.appendChild(icon);
    overlay.appendChild(content);
    
    // Add to topics modal instead of document body
    this.topicsModal.modal.appendChild(overlay);
    
    // Store reference
    this.topicsModal.processingOverlay = overlay;
  },

  /**
   * Show custom content modal
   * @param {string} content - The markdown content to display
   * @param {boolean} isFromTopics - Whether the content was generated from topics
   */
  showCustomContentModal(content, isFromTopics = false) {
    console.log('[ButtonPanel] Showing custom content modal');
    console.log('[ButtonPanel] Content:', content ? 'Present' : 'Missing');
    console.log('[ButtonPanel] isFromTopics:', isFromTopics);
    console.log('[ButtonPanel] About to hide custom content button...');
    
    // Hide the custom content button when modal opens
    this.hideCustomContentButton();
    
    // Hide topics modal first
    this.hideTopicsModal();
    
    // Remove blur from custom content modal if it was blurred
    if (this.topicsModal.customContentModal.overlay) {
      this.topicsModal.customContentModal.overlay.style.filter = 'none';
    }
    
    // Create modal if it doesn't exist
    if (!this.topicsModal.customContentModal.overlay) {
      this.createCustomContentModal();
    }
    
    // Create a new tab with the content
    const tabTitle = isFromTopics ? 'Content from topics' : 'Generated Content';
    const tabId = this.createTab(tabTitle, content, isFromTopics);
    
    // Show the modal with a slight delay for smooth transition
    setTimeout(() => {
      this.topicsModal.customContentModal.overlay.classList.add('visible');
    }, 100);
  },

  /**
   * Hide custom content modal
   */
  hideCustomContentModal() {
    console.log('[ButtonPanel] Hiding custom content modal');
    
    if (this.topicsModal.customContentModal.overlay) {
      this.topicsModal.customContentModal.overlay.classList.remove('visible');
    }
    
    // Show the custom content button again
    this.showCustomContentButton();
  },

  /**
   * Create custom content modal HTML structure
   */
  createCustomContentModal() {
    console.log('[ButtonPanel] Creating custom content modal...');
    const overlay = document.createElement('div');
    overlay.className = 'vocab-custom-content-overlay';
    overlay.id = 'vocab-custom-content-overlay';
    
    const modal = document.createElement('div');
    modal.className = 'vocab-custom-content-modal';
    
    // Header
    const header = document.createElement('div');
    header.className = 'vocab-custom-content-header';
    header.setAttribute('title', 'Drag to move modal');
    
    const title = document.createElement('h2');
    title.className = 'vocab-custom-content-title';
    title.textContent = 'Generated Content';
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'vocab-custom-content-close';
    closeBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 10H16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    closeBtn.setAttribute('aria-label', 'Close modal');
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    
    // Tabs section
    const tabsSection = document.createElement('div');
    tabsSection.className = 'vocab-custom-content-tabs';
    
    // Left arrow for tab navigation
    const leftArrow = document.createElement('button');
    leftArrow.className = 'vocab-custom-content-tab-arrow vocab-custom-content-tab-arrow-left';
    leftArrow.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    leftArrow.setAttribute('title', 'Scroll tabs left');
    
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'vocab-custom-content-tabs-container';
    console.log('[ButtonPanel] Created tabsContainer:', tabsContainer);
    
    // Right arrow for tab navigation
    const rightArrow = document.createElement('button');
    rightArrow.className = 'vocab-custom-content-tab-arrow vocab-custom-content-tab-arrow-right';
    rightArrow.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    rightArrow.setAttribute('title', 'Scroll tabs right');
    
    const addTabBtn = document.createElement('button');
    addTabBtn.className = 'vocab-custom-content-add-tab';
    addTabBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    addTabBtn.setAttribute('title', 'New tab');
    
    tabsSection.appendChild(leftArrow);
    tabsSection.appendChild(tabsContainer);
    tabsSection.appendChild(rightArrow);
    tabsSection.appendChild(addTabBtn);
    
    // Search section
    const searchSection = document.createElement('div');
    searchSection.className = 'vocab-custom-content-search';
    
    const searchInput = document.createElement('input');
    searchInput.className = 'vocab-custom-content-search-input';
    searchInput.type = 'text';
    searchInput.placeholder = 'Search in content...';
    
    searchSection.appendChild(searchInput);
    
    // Editor section
    const editorSection = document.createElement('div');
    editorSection.className = 'vocab-custom-content-editor';
    
    const editorContent = document.createElement('div');
    editorContent.className = 'vocab-custom-content-editor-content';
    
    editorSection.appendChild(editorContent);
    
    // Settings button (positioned outside editor to avoid scrolling)
    const settingsBtn = document.createElement('button');
    settingsBtn.className = 'vocab-custom-content-settings';
    settingsBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="10" r="3" stroke="currentColor" stroke-width="1.5"/>
        <path d="M10 1.5V3M10 17V18.5M18.5 10H17M3 10H1.5M15.364 4.636L14.243 5.757M5.757 14.243L4.636 15.364M15.364 15.364L14.243 14.243M5.757 5.757L4.636 4.636" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    `;
    settingsBtn.setAttribute('title', 'Regenerate content');
    
    // Assemble modal
    modal.appendChild(header);
    modal.appendChild(tabsSection);
    modal.appendChild(searchSection);
    modal.appendChild(editorSection);
    modal.appendChild(settingsBtn);
    
    // Add resize handles
    const resizeHandles = this.createResizeHandles();
    modal.appendChild(resizeHandles);
    
    overlay.appendChild(modal);
    
    // Add to document
    document.body.appendChild(overlay);
    
    // Store references
    console.log('[ButtonPanel] Storing modal references...');
    this.topicsModal.customContentModal.overlay = overlay;
    this.topicsModal.customContentModal.modal = modal;
    this.topicsModal.customContentModal.editorContent = editorContent;
    this.topicsModal.customContentModal.searchInput = searchInput;
    this.topicsModal.customContentModal.tabsContainer = tabsContainer;
    this.topicsModal.customContentModal.addTabBtn = addTabBtn;
    this.topicsModal.customContentModal.leftArrow = leftArrow;
    this.topicsModal.customContentModal.rightArrow = rightArrow;
    this.topicsModal.customContentModal.settingsBtn = settingsBtn;
    console.log('[ButtonPanel] Stored tabsContainer:', this.topicsModal.customContentModal.tabsContainer);
    
    // Attach event listeners
    this.attachCustomContentModalListeners();
  },

  /**
   * Attach event listeners to custom content modal
   */
  attachCustomContentModalListeners() {
    console.log('[ButtonPanel] Attaching custom content modal listeners...');
    const overlay = this.topicsModal.customContentModal.overlay;
    const modal = this.topicsModal.customContentModal.modal;
    const closeBtn = modal.querySelector('.vocab-custom-content-close');
    const searchInput = this.topicsModal.customContentModal.searchInput;
    const panIcon = modal.querySelector('.vocab-custom-content-pan-icon');
    const addTabBtn = this.topicsModal.customContentModal.addTabBtn;
    const tabsContainer = this.topicsModal.customContentModal.tabsContainer;
    console.log('[ButtonPanel] tabsContainer in attachCustomContentModalListeners:', tabsContainer);
    
    // Close modal events
    closeBtn.addEventListener('click', () => this.hideCustomContentModal());
    
    // Search functionality
    searchInput.addEventListener('input', (e) => {
      console.log('[ButtonPanel] Search input changed:', e.target.value);
      const activeTab = this.topicsModal.customContentModal.tabs.find(tab => tab.id === this.topicsModal.customContentModal.activeTabId);
      if (activeTab) {
        activeTab.searchTerm = e.target.value;
        console.log('[ButtonPanel] Updated active tab search term:', activeTab.searchTerm);
      this.performSearch();
      } else {
        console.log('[ButtonPanel] No active tab found for search');
      }
    });
    
    // Add tab functionality
    addTabBtn.addEventListener('click', () => {
      this.showTopicsModalForNewTab();
    });
    
    // Settings button functionality
    const settingsBtn = this.topicsModal.customContentModal.settingsBtn;
    settingsBtn.addEventListener('click', () => {
      this.showTopicsModalForRegenerate();
    });
    
    // Tab navigation arrows
    const leftArrow = this.topicsModal.customContentModal.leftArrow;
    const rightArrow = this.topicsModal.customContentModal.rightArrow;
    
    leftArrow.addEventListener('click', () => {
      this.scrollTabs('left');
    });
    
    rightArrow.addEventListener('click', () => {
      this.scrollTabs('right');
    });
    
    // Mouse wheel scrolling on tabs container
    tabsContainer.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        this.scrollTabs('left');
      } else {
        this.scrollTabs('right');
      }
    });
    
    // Update arrow states initially (with delay to ensure DOM is ready)
    setTimeout(() => {
      try {
        this.updateTabArrowStates();
      } catch (error) {
        console.error('[ButtonPanel] Error in updateTabArrowStates:', error);
        console.error('[ButtonPanel] Error stack:', error.stack);
      }
    }, 100);
    
    // Drag functionality for modal
    const header = modal.querySelector('.vocab-custom-content-header');
    if (header) {
      this.initModalDrag(header, modal);
    }
    
    // Resize functionality for modal
    this.initModalResize(modal);
  },

  /**
   * Show topics modal for creating a new tab
   */
  showTopicsModalForNewTab() {
    console.log('[ButtonPanel] Showing topics modal for new tab');
    
    // Blur the custom content modal background
    if (this.topicsModal.customContentModal.overlay) {
      this.topicsModal.customContentModal.overlay.style.filter = 'blur(2px)';
    }
    
    // Clear existing topics and inputs
    this.topicsModal.topics = [];
    this.topicsModal.wordCount = 100;
    this.topicsModal.difficulty = 'hard';
    
    // Clear topics tags if modal exists
    if (this.topicsModal.modal) {
      const tagsContainer = this.topicsModal.modal.querySelector('#vocab-topics-tags');
      if (tagsContainer) {
        tagsContainer.innerHTML = '';
      }
      
      // Clear input field
      const input = this.topicsModal.modal.querySelector('.vocab-topics-input');
      if (input) {
        input.value = '';
      }
      
      // Reset word count and difficulty selections
      const wordCountButtons = this.topicsModal.modal.querySelectorAll('.vocab-topics-word-count-btn');
      wordCountButtons.forEach(btn => btn.classList.remove('selected'));
      const wordCountBtn100 = this.topicsModal.modal.querySelector('[data-count="100"]');
      if (wordCountBtn100) {
        wordCountBtn100.classList.add('selected');
      }
      
      const difficultyButtons = this.topicsModal.modal.querySelectorAll('.vocab-topics-difficulty-btn');
      difficultyButtons.forEach(btn => btn.classList.remove('selected'));
      const hardBtn = this.topicsModal.modal.querySelector('[data-difficulty="hard"]');
      if (hardBtn) {
        hardBtn.classList.add('selected');
      }
      
      // Update UI state
      this.updateTopicsUIState();
    }
    
    // Show the topics modal
    this.showTopicsModal();
  },

  /**
   * Show topics modal for regenerating content
   */
  showTopicsModalForRegenerate() {
    console.log('[ButtonPanel] Showing topics modal for regenerate');
    
    // Blur the custom content modal background
    if (this.topicsModal.customContentModal.overlay) {
      this.topicsModal.customContentModal.overlay.style.filter = 'blur(2px)';
    }
    
    // Get current active tab data
    const activeTab = this.topicsModal.customContentModal.tabs.find(tab => tab.id === this.topicsModal.customContentModal.activeTabId);
    if (!activeTab || !activeTab.isFromTopics) {
      console.log('[ButtonPanel] No active tab or tab is not from topics, cannot regenerate');
      return;
    }
    
    // Load the topics data from the active tab (we'll need to store this)
    // For now, we'll show the modal with current settings
    // TODO: Store topics data in tab object for regeneration
    
    // Show the topics modal
    this.showTopicsModal();
    
    // Change the generate button text to "Re-generate content"
    setTimeout(() => {
      const generateBtn = this.topicsModal.modal.querySelector('.vocab-topics-generate-btn');
      if (generateBtn) {
        generateBtn.textContent = 'Re-generate content';
        generateBtn.setAttribute('data-regenerate', 'true');
        generateBtn.setAttribute('data-tab-id', activeTab.id);
      }
    }, 100);
  },

  /**
   * Show custom content modal with existing tabs
   */
  showCustomContentModalWithTabs() {
    console.log('[ButtonPanel] Showing custom content modal with existing tabs');
    
    // Create modal if it doesn't exist
    if (!this.topicsModal.customContentModal.overlay) {
      this.createCustomContentModal();
    }
    
    // Only render tabs if they don't already exist in DOM
    const existingTabs = this.topicsModal.customContentModal.modal.querySelectorAll('.vocab-custom-content-tab');
    if (existingTabs.length === 0) {
      // Render all existing tabs
      this.topicsModal.customContentModal.tabs.forEach(tab => {
        this.renderTab(tab);
      });
    }
    
    // Switch to the active tab or first tab
    if (this.topicsModal.customContentModal.activeTabId) {
      this.switchToTab(this.topicsModal.customContentModal.activeTabId);
    } else if (this.topicsModal.customContentModal.tabs.length > 0) {
      this.switchToTab(this.topicsModal.customContentModal.tabs[0].id);
    }
    
    // Show the modal
    setTimeout(() => {
      this.topicsModal.customContentModal.overlay.classList.add('visible');
    }, 100);
  },

  /**
   * Create a new tab
   * @param {string} title - The tab title
   * @param {string} content - The tab content
   * @param {boolean} isFromTopics - Whether content is from topics
   * @returns {string} Tab ID
   */
  createTab(title, content, isFromTopics = false) {
    console.log('[ButtonPanel] Creating new tab:', title);
    console.log('[ButtonPanel] tabsContainer before renderTab:', this.topicsModal.customContentModal.tabsContainer);
    
    const tabId = `tab-${++this.topicsModal.customContentModal.tabCounter}`;
    const tab = {
      id: tabId,
      title: title,
      content: content,
      isFromTopics: isFromTopics,
      searchTerm: ''
    };
    
    this.topicsModal.customContentModal.tabs.push(tab);
    try {
      this.renderTab(tab);
    } catch (error) {
      console.error('[ButtonPanel] Error in renderTab:', error);
      console.error('[ButtonPanel] Error stack:', error.stack);
    }
    
    // Set as active tab if it's the first one
    if (this.topicsModal.customContentModal.tabs.length === 1) {
      this.switchToTab(tabId);
    }
    
    return tabId;
  },

  /**
   * Render a tab element
   * @param {Object} tab - Tab object
   */
  renderTab(tab) {
    const tabsContainer = this.topicsModal.customContentModal.tabsContainer;
    if (!tabsContainer) {
      console.warn('[ButtonPanel] tabsContainer not found, cannot render tab');
      return;
    }
    
    const tabElement = document.createElement('div');
    tabElement.className = 'vocab-custom-content-tab';
    tabElement.setAttribute('data-tab-id', tab.id);
    
    const titleElement = document.createElement('div');
    titleElement.className = 'vocab-custom-content-tab-title';
    titleElement.textContent = tab.title;
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'vocab-custom-content-tab-close';
    closeBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    closeBtn.setAttribute('aria-label', 'Close tab');
    
    tabElement.appendChild(titleElement);
    tabElement.appendChild(closeBtn);
    tabsContainer.appendChild(tabElement);
    
    // Add event listeners
    tabElement.addEventListener('click', (e) => {
      if (e.target !== closeBtn && !closeBtn.contains(e.target)) {
        this.switchToTab(tab.id);
      }
    });
    
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeTab(tab.id);
    });
    
    // Update arrow states after adding tab
    setTimeout(() => {
      this.updateTabArrowStates();
    }, 100);
  },

  /**
   * Switch to a specific tab
   * @param {string} tabId - The tab ID to switch to
   */
  switchToTab(tabId) {
    // Update active tab
    this.topicsModal.customContentModal.activeTabId = tabId;
    
    // Update tab visual states
    const tabs = this.topicsModal.customContentModal.modal.querySelectorAll('.vocab-custom-content-tab');
    tabs.forEach(tab => {
      tab.classList.remove('active');
      if (tab.getAttribute('data-tab-id') === tabId) {
        tab.classList.add('active');
      }
    });
    
    // Update content
    const activeTab = this.topicsModal.customContentModal.tabs.find(tab => tab.id === tabId);
    if (activeTab) {
      this.updateCustomContentEditor(activeTab.content);
      this.updateCustomContentHeading(activeTab.isFromTopics);
      
      // Update search input
      const searchInput = this.topicsModal.customContentModal.searchInput;
      searchInput.value = activeTab.searchTerm || '';
      
      // Perform search to highlight search term
      this.performSearch();
    }
  },

  /**
   * Close a tab
   * @param {string} tabId - The tab ID to close
   */
  closeTab(tabId) {
    const tabIndex = this.topicsModal.customContentModal.tabs.findIndex(tab => tab.id === tabId);
    if (tabIndex === -1) return;
    
    // Remove tab from array
    this.topicsModal.customContentModal.tabs.splice(tabIndex, 1);
    
    // Remove tab element
    const tabElement = this.topicsModal.customContentModal.modal.querySelector(`[data-tab-id="${tabId}"]`);
    if (tabElement) {
      tabElement.remove();
    }
    
    // If this was the active tab, switch to another tab
    if (this.topicsModal.customContentModal.activeTabId === tabId) {
      if (this.topicsModal.customContentModal.tabs.length > 0) {
        // Switch to the next tab or the previous one
        const newActiveIndex = Math.min(tabIndex, this.topicsModal.customContentModal.tabs.length - 1);
        this.switchToTab(this.topicsModal.customContentModal.tabs[newActiveIndex].id);
      } else {
        // No tabs left, clear topics and close the modal
        this.clearTopicsModalInputs();
        this.hideCustomContentModal();
      }
    }
  },

  /**
   * Create resize handles for the modal
   * @returns {HTMLElement} Container with resize handles
   */
  createResizeHandles() {
    const container = document.createElement('div');
    container.className = 'vocab-custom-content-resize-handles';
    
    // Create handles for all four corners
    const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
    
    positions.forEach(position => {
      const handle = document.createElement('div');
      handle.className = `vocab-custom-content-resize-handle vocab-custom-content-resize-handle-${position}`;
      handle.setAttribute('data-position', position);
      container.appendChild(handle);
    });
    
    return container;
  },

  /**
   * Initialize resize functionality for modal
   * @param {HTMLElement} modal - The modal element to resize
   */
  initModalResize(modal) {
    const handles = modal.querySelectorAll('.vocab-custom-content-resize-handle');
    
    handles.forEach(handle => {
      let isResizing = false;
      let startX = 0;
      let startY = 0;
      let startWidth = 0;
      let startHeight = 0;
      let startLeft = 0;
      let startTop = 0;
      
      const handleMouseDown = (e) => {
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        
        const rect = modal.getBoundingClientRect();
        startWidth = rect.width;
        startHeight = rect.height;
        startLeft = rect.left;
        startTop = rect.top;
        
        e.preventDefault();
        e.stopPropagation();
      };
      
      const handleMouseMove = (e) => {
        if (!isResizing) return;
        
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        const position = handle.getAttribute('data-position');
        
        let newWidth = startWidth;
        let newHeight = startHeight;
        let newLeft = startLeft;
        let newTop = startTop;
        
        // Calculate new dimensions based on handle position
        switch (position) {
          case 'top-left':
            newWidth = startWidth - deltaX;
            newHeight = startHeight - deltaY;
            newLeft = startLeft + deltaX;
            newTop = startTop + deltaY;
            break;
          case 'top-right':
            newWidth = startWidth + deltaX;
            newHeight = startHeight - deltaY;
            newTop = startTop + deltaY;
            break;
          case 'bottom-left':
            newWidth = startWidth - deltaX;
            newHeight = startHeight + deltaY;
            newLeft = startLeft + deltaX;
            break;
          case 'bottom-right':
            newWidth = startWidth + deltaX;
            newHeight = startHeight + deltaY;
            break;
        }
        
        // Apply constraints
        const minWidth = 400;
        const minHeight = 300;
        const maxWidth = window.innerWidth - 100;
        const maxHeight = window.innerHeight - 100;
        
        newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
        newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
        
        // Update modal dimensions
        modal.style.width = `${newWidth}px`;
        modal.style.height = `${newHeight}px`;
        modal.style.left = `${newLeft}px`;
        modal.style.top = `${newTop}px`;
        
        // Update editor height to fit within modal
        const editor = modal.querySelector('.vocab-custom-content-editor');
        if (editor) {
          const headerHeight = modal.querySelector('.vocab-custom-content-header')?.offsetHeight || 0;
          const tabsHeight = modal.querySelector('.vocab-custom-content-tabs')?.offsetHeight || 0;
          const searchHeight = modal.querySelector('.vocab-custom-content-search')?.offsetHeight || 0;
          const padding = 60; // Account for margins and padding
          
          const availableHeight = newHeight - headerHeight - tabsHeight - searchHeight - padding;
          editor.style.maxHeight = `${Math.max(200, availableHeight)}px`;
        }
      };
      
      const handleMouseUp = () => {
        isResizing = false;
      };
      
      handle.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    });
  },

  /**
   * Clear topics modal inputs
   */
  clearTopicsModalInputs() {
    console.log('[ButtonPanel] Clearing topics modal inputs');
    
    // Clear topics array
    this.topicsModal.topics = [];
    this.topicsModal.wordCount = 100;
    this.topicsModal.difficulty = 'hard';
    
    // Clear UI elements
    const topicsContainer = this.topicsModal.modal?.querySelector('.vocab-topics-tags');
    const inputField = this.topicsModal.modal?.querySelector('.vocab-topics-input');
    const wordCountButtons = this.topicsModal.modal?.querySelectorAll('.vocab-topics-word-count-btn');
    const difficultyButtons = this.topicsModal.modal?.querySelectorAll('.vocab-topics-difficulty-btn');
    
    if (topicsContainer) {
      topicsContainer.innerHTML = '';
    }
    
    if (inputField) {
      inputField.value = '';
    }
    
    // Reset word count buttons
    if (wordCountButtons) {
      wordCountButtons.forEach(btn => {
        btn.classList.remove('selected');
        if (btn.getAttribute('data-count') === '100') {
          btn.classList.add('selected');
        }
      });
    }
    
    // Reset difficulty buttons
    if (difficultyButtons) {
      difficultyButtons.forEach(btn => {
        btn.classList.remove('selected');
        if (btn.getAttribute('data-difficulty') === 'hard') {
          btn.classList.add('selected');
        }
      });
    }
    
    this.updateTopicsUIState();
  },

  /**
   * Scroll tabs left or right
   * @param {string} direction - 'left' or 'right'
   */
  scrollTabs(direction) {
    const tabsContainer = this.topicsModal.customContentModal.tabsContainer;
    if (!tabsContainer) {
      console.warn('[ButtonPanel] tabsContainer not found, skipping scroll');
      return;
    }
    
    const scrollAmount = 200; // pixels to scroll
    
    if (direction === 'left') {
      tabsContainer.scrollLeft -= scrollAmount;
    } else {
      tabsContainer.scrollLeft += scrollAmount;
    }
    
    // Update arrow states after scrolling
    setTimeout(() => {
      this.updateTabArrowStates();
    }, 100);
  },

  /**
   * Update tab arrow states based on scroll position
   */
  updateTabArrowStates() {
    console.log('[ButtonPanel] updateTabArrowStates called');
    const tabsContainer = this.topicsModal.customContentModal.tabsContainer;
    const leftArrow = this.topicsModal.customContentModal.leftArrow;
    const rightArrow = this.topicsModal.customContentModal.rightArrow;
    
    console.log('[ButtonPanel] tabsContainer in updateTabArrowStates:', tabsContainer);
    console.log('[ButtonPanel] leftArrow:', leftArrow);
    console.log('[ButtonPanel] rightArrow:', rightArrow);
    
    if (!tabsContainer || !leftArrow || !rightArrow) {
      console.log('[ButtonPanel] Missing elements in updateTabArrowStates, returning early');
      return;
    }
    
    const isAtStart = tabsContainer.scrollLeft <= 0;
    const isAtEnd = tabsContainer.scrollLeft >= (tabsContainer.scrollWidth - tabsContainer.clientWidth);
    
    leftArrow.disabled = isAtStart;
    rightArrow.disabled = isAtEnd;
  },

  /**
   * Initialize drag functionality for modal
   * @param {HTMLElement} dragHandle - The drag handle element
   * @param {HTMLElement} modal - The modal element to drag
   */
  initModalDrag(dragHandle, modal) {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialLeft = 0;
    let initialTop = 0;

    const handleMouseDown = (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      
      // Get current position
      const rect = modal.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;
      
      // Change cursor
      dragHandle.style.cursor = 'grabbing';
      modal.style.cursor = 'grabbing';
      
      e.preventDefault();
    };

    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      const newLeft = initialLeft + deltaX;
      const newTop = initialTop + deltaY;
      
      // Apply constraints to keep modal within viewport
      const maxLeft = window.innerWidth - modal.offsetWidth;
      const maxTop = window.innerHeight - modal.offsetHeight;
      
      const constrainedLeft = Math.max(0, Math.min(maxLeft, newLeft));
      const constrainedTop = Math.max(0, Math.min(maxTop, newTop));
      
      modal.style.left = `${constrainedLeft}px`;
      modal.style.top = `${constrainedTop}px`;
      modal.style.right = 'auto';
      modal.style.transform = 'none';
    };

    const handleMouseUp = () => {
      if (isDragging) {
        isDragging = false;
        dragHandle.style.cursor = 'grab';
        modal.style.cursor = 'default';
      }
    };

    // Add event listeners
    dragHandle.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Touch events for mobile
    dragHandle.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      handleMouseDown({
        clientX: touch.clientX,
        clientY: touch.clientY,
        preventDefault: () => e.preventDefault()
      });
    });
    
    document.addEventListener('touchmove', (e) => {
      const touch = e.touches[0];
      handleMouseMove({
        clientX: touch.clientX,
        clientY: touch.clientY
      });
    });
    
    document.addEventListener('touchend', handleMouseUp);
  },

  /**
   * Update custom content heading based on content source
   * @param {boolean} isFromTopics - Whether the content was generated from topics
   */
  updateCustomContentHeading(isFromTopics) {
    const title = this.topicsModal.customContentModal.modal?.querySelector('.vocab-custom-content-title');
    if (title) {
      title.textContent = isFromTopics ? 'Content from topics' : 'Generated Content';
    }
  },

  /**
   * Update custom content editor with markdown content
   * @param {string} content - The markdown content
   */
  updateCustomContentEditor(content) {
    const editorContent = this.topicsModal.customContentModal.editorContent;
    
    // Simple markdown to HTML conversion (for basic formatting)
    let htmlContent = content
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
      .replace(/^##### (.*$)/gim, '<h5>$1</h5>')
      .replace(/^###### (.*$)/gim, '<h6>$1</h6>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/`(.*?)`/gim, '<code>$1</code>')
      .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
      .replace(/^\* (.*$)/gim, '<li>$1</li>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
      .replace(/\n\n/gim, '</p><p>')
      .replace(/\n/gim, '<br>');
    
    // Wrap in paragraphs
    htmlContent = '<p>' + htmlContent + '</p>';
    
    // Clean up empty paragraphs
    htmlContent = htmlContent.replace(/<p><\/p>/gim, '');
    htmlContent = htmlContent.replace(/<p><br><\/p>/gim, '');
    
    editorContent.innerHTML = htmlContent;
  },

  /**
   * Perform search in the content
   */
  performSearch() {
    console.log('[ButtonPanel] performSearch called');
    const activeTab = this.topicsModal.customContentModal.tabs.find(tab => tab.id === this.topicsModal.customContentModal.activeTabId);
    if (!activeTab) {
      console.log('[ButtonPanel] No active tab found in performSearch');
      return;
    }
    
    const searchTerm = activeTab.searchTerm;
    const editorContent = this.topicsModal.customContentModal.editorContent;
    
    console.log('[ButtonPanel] Search term:', searchTerm);
    console.log('[ButtonPanel] Editor content:', editorContent);
    
    if (!searchTerm || !searchTerm.trim()) {
      console.log('[ButtonPanel] No search term, removing highlights');
      // Remove all highlights
      const highlights = editorContent.querySelectorAll('.vocab-search-highlight');
      highlights.forEach(highlight => {
        const parent = highlight.parentNode;
        parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
        parent.normalize();
      });
      return;
    }
    
    // Get the original content without highlights
    let content = editorContent.innerHTML;
    
    // Remove existing highlights
    content = content.replace(/<span class="vocab-search-highlight">(.*?)<\/span>/gim, '$1');
    
    // Add new highlights
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gim');
    content = content.replace(regex, '<span class="vocab-search-highlight">$1</span>');
    
    console.log('[ButtonPanel] Updated content with highlights');
    editorContent.innerHTML = content;
  },

  /**
   * Initialize slider positions
   */
  initializeSliders() {
    // Initialize word count slider
    const wordCountSelected = this.topicsModal.modal.querySelector('.vocab-topics-word-count-btn.selected');
    if (wordCountSelected) {
      this.animateSlider('word-count-slider', wordCountSelected);
    }
    
    // Initialize difficulty slider
    const difficultySelected = this.topicsModal.modal.querySelector('.vocab-topics-difficulty-btn.selected');
    if (difficultySelected) {
      this.animateSlider('difficulty-slider', difficultySelected);
      this.updateDifficultySliderColor(difficultySelected);
    }
  },

  /**
   * Animate slider to selected tab
   * @param {string} sliderId - ID of the slider element
   * @param {HTMLElement} selectedButton - The selected button element
   */
  animateSlider(sliderId, selectedButton) {
    const slider = document.getElementById(sliderId);
    if (!slider || !selectedButton) return;
    
    // Use requestAnimationFrame to ensure smooth animation
    requestAnimationFrame(() => {
      const buttonRect = selectedButton.getBoundingClientRect();
      const containerRect = selectedButton.parentElement.getBoundingClientRect();
      
      const left = buttonRect.left - containerRect.left;
      const width = buttonRect.width;
      
      slider.style.left = `${left}px`;
      slider.style.width = `${width}px`;
    });
  },

  /**
   * Update difficulty slider color based on selected difficulty
   * @param {HTMLElement} selectedButton - The selected difficulty button
   */
  updateDifficultySliderColor(selectedButton) {
    const slider = document.getElementById('difficulty-slider');
    if (!slider) return;
    
    const difficulty = selectedButton.getAttribute('data-difficulty');
    switch (difficulty) {
      case 'easy':
        slider.style.background = '#36D86B';
        break;
      case 'medium':
        slider.style.background = '#F9D43F';
        break;
      case 'hard':
        slider.style.background = '#FF4D4D';
        break;
    }
  },

  /**
   * Create plus icon SVG
   * @returns {string} SVG markup
   */
  createPlusIcon() {
    return `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 3V13M3 8H13" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  },

};

