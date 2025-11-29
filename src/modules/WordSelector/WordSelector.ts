/**
 * WordSelector Module
 * Handles double-click word selection, highlighting, and word meaning API calls
 */

import {
  isSelectionAllowed,
  getDocumentText,
  findWordPositionsInDocument,
  extractWordContext,
  getRangeCSSProperties,
  applyCSSProperties,
  preserveTextNodeStyles,
} from '../../utils/dom';
import { normalizeText, isSingleWord } from '../../utils/text';
import { highlightRange as highlightRangeUtil, removeHighlight } from '../../utils/highlight';
import { ApiService } from '../../services';
import type { WordsExplanationRequest, WordsExplanationResponse } from '../../types';

export interface WordData {
  word: string;
  meaning: string;
  examples: string[];
  highlights: Set<HTMLElement>;
  hasCalledGetMoreExamples?: boolean;
  shouldAllowFetchMoreExamples?: boolean;
  askAIChatHistory?: any[];
  askAIInitialContext?: string;
  position?: { x: number; y: number; width: number; height: number };
}

export class WordSelector {
  // Use Set for O(1) insertion, deletion, and lookup
  selectedWords: Set<string> = new Set();

  // Map to store word -> Set of highlight elements (for handling multiple instances)
  wordToHighlights: Map<string, Set<HTMLElement>> = new Map();

  // Map to store word -> Array of position objects {element, textStartIndex}
  wordPositions: Map<string, any[]> = new Map();

  // Container for explained words (moved from selectedWords after API call)
  explainedWords: Map<string, WordData> = new Map();

  // Track if popup is open for each word (boolean flag)
  wordPopupOpen: Map<string, boolean> = new Map();

  // Cache for pronunciation audio blobs
  pronunciationCache: Map<string, Blob> = new Map();

  // Cache for translated word explanations (EN translations)
  translationCache: Map<string, { meaning: string; examples: string[] }> = new Map();

  // Track if the feature is enabled
  isEnabled: boolean = false;

  // Counter for generating unique IDs
  highlightIdCounter: number = 0;

  // Store bound handler for proper cleanup
  boundDoubleClickHandler: ((event: MouseEvent) => void) | null = null;
  boundClickHandler: ((event: MouseEvent) => void) | null = null;

  // Callbacks
  onWordSelected?: (word: string) => void;
  onWordRemoved?: (word: string) => void;
  onWordExplained?: (word: string, data: WordData) => void;
  onWordClick?: (word: string, data: WordData) => void;

  /**
   * Initialize word selector
   */
  async init(): Promise<void> {
    console.log('[WordSelector] Initializing...');

    // Bind the handlers once for proper cleanup
    this.boundDoubleClickHandler = this.handleDoubleClick.bind(this);
    this.boundClickHandler = this.handleClick.bind(this);

    // Inject styles for word highlights
    this.injectStyles();

    // Setup global click handler to close popups (only sticky ones)
    document.addEventListener(
      'click',
      (e) => {
        const stickyPopups = document.querySelectorAll('.vocab-word-popup[data-sticky="true"]');
        if (stickyPopups.length === 0) return;

        const clickedInsidePopup = (e.target as Element).closest('.vocab-word-popup');
        const clickedOnWord = (e.target as Element).closest('.vocab-word-explained');
        const clickedOnPopupButton =
          (e.target as Element).closest('.vocab-word-popup-speaker') ||
          (e.target as Element).closest('.vocab-word-popup-close') ||
          (e.target as Element).closest('.vocab-word-popup-button') ||
          (e.target as Element).closest('.vocab-word-popup-bookmark');
        const clickedInsideAskAIModal = (e.target as Element).closest('.word-web-search-modal');

        const hasMouseInsidePopup = Array.from(stickyPopups).some(
          (popup) => popup.getAttribute('data-mouse-inside') === 'true'
        );

        if (
          !clickedInsidePopup &&
          !clickedOnWord &&
          !clickedOnPopupButton &&
          !clickedInsideAskAIModal &&
          !hasMouseInsidePopup
        ) {
          setTimeout(() => {
            const currentStickyPopups = document.querySelectorAll('.vocab-word-popup[data-sticky="true"]');
            if (currentStickyPopups.length > 0) {
              this.hideAllPopups();
            }
          }, 10);
        }
      },
      false
    );

    // Check if extension is enabled
    const isExtensionEnabled = await this.checkExtensionEnabled();

    if (isExtensionEnabled) {
      this.enable();
    }

    console.log('[WordSelector] Initialized. Enabled:', isExtensionEnabled);
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
        console.log('[WordSelector] Global toggle state not found, created with default value: true');
      }

      return isEnabled;
    } catch (error) {
      console.error('[WordSelector] Error checking global extension state:', error);
      return true; // Default to true (enabled) on error
    }
  }

  /**
   * Enable word selector
   */
  enable(): void {
    if (this.isEnabled) return;

    this.isEnabled = true;
    if (this.boundDoubleClickHandler) {
      document.addEventListener('dblclick', this.boundDoubleClickHandler);
    }
    if (this.boundClickHandler) {
      document.addEventListener('click', this.boundClickHandler, true); // Use capture phase
    }
    console.log('[WordSelector] Enabled');
  }

  /**
   * Disable word selector
   */
  disable(): void {
    if (!this.isEnabled) return;

    this.isEnabled = false;
    if (this.boundDoubleClickHandler) {
      document.removeEventListener('dblclick', this.boundDoubleClickHandler);
    }
    if (this.boundClickHandler) {
      document.removeEventListener('click', this.boundClickHandler, true);
    }
    console.log('[WordSelector] Disabled');
  }

  /**
   * Handle click event (for green words to toggle modal)
   */
  handleClick(event: MouseEvent): void {
    if (!this.isEnabled) {
      return;
    }

    // Only handle clicks on green explained words
    const clickedHighlight = (event.target as Element).closest('.vocab-word-explained');
    if (clickedHighlight) {
      const word = clickedHighlight.getAttribute('data-word');
      if (word) {
        // Check if clicking on the remove button - if so, let it handle removal
        const clickedOnRemoveBtn = (event.target as Element).closest('.vocab-word-remove-explained-btn');
        if (clickedOnRemoveBtn) {
          return; // Let the remove button handle it
        }

        // Otherwise, trigger word click callback to toggle modal
        const normalizedWord = normalizeText(word);
        const wordData = this.explainedWords.get(normalizedWord);
        if (wordData) {
          event.preventDefault();
          event.stopPropagation();
          this.onWordClick?.(word, wordData);
        }
      }
    }
  }

  /**
   * Handle double-click event
   */
  handleDoubleClick(event: MouseEvent): void {
    if (!this.isEnabled) {
      return;
    }

    // Check if clicking on an existing highlight to deselect it
    const clickedHighlight = (event.target as Element).closest('.vocab-word-highlight');
    if (clickedHighlight) {
      const word = clickedHighlight.getAttribute('data-word');
      if (word) {
        // Don't handle green words here - they're handled by single click
        if (!clickedHighlight.classList.contains('vocab-word-explained')) {
          // Purple highlighted word - remove it
          this.removeWord(word);
        }
      }
      return;
    }

    // Check if selection is allowed in the clicked area
    if (!isSelectionAllowed(event.target as Element)) {
      console.log('[WordSelector] Selection not allowed - clicked in extension UI');
      return;
    }

    // Get the selected text
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim() || '';

    if (!selectedText || selectedText.length === 0) {
      return;
    }

    // Only process single words (no spaces)
    if (!isSingleWord(selectedText)) {
      return;
    }

    // Get the range and validate
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);

    // Validate the selection range itself
    if (!isSelectionAllowed(range)) {
      console.log('[WordSelector] Selection not allowed - range is in extension UI');
      selection.removeAllRanges();
      return;
    }

    const normalizedWord = normalizeText(selectedText);

    // Check if word is already explained (green) - if so, deselect it
    if (this.explainedWords.has(normalizedWord)) {
      const clickedHighlight = (event.target as Element).closest('.vocab-word-explained');
      if (clickedHighlight) {
        this.removeExplainedWord(selectedText);
        selection.removeAllRanges();
        return;
      }
    }

    // Check if word is already selected (purple) - if so, deselect it
    if (this.isWordSelected(normalizedWord)) {
      this.removeWord(selectedText);
      selection.removeAllRanges();
      return;
    }

    // Add word to selected set
    this.addWord(selectedText);

    // Highlight the word
    this.highlightRange(range, selectedText);

    // Clear the selection
    selection.removeAllRanges();

    // Get the highlight element that was just created
    const highlights = this.wordToHighlights.get(normalizedWord);
    const highlight = highlights ? Array.from(highlights)[highlights.size - 1] : null;

    // Immediately trigger API call for this word
    if (highlight) {
      this.processWordExplanation(selectedText, normalizedWord, highlight);
    }
  }

  /**
   * Highlight a range with a styled span
   */
  highlightRange(range: Range, word: string): void {
    const normalizedWord = normalizeText(word);
    const highlightId = `highlight-${this.highlightIdCounter++}`;

    // Create highlight using utility function
    const highlight = highlightRangeUtil(range, word, 'vocab-word-highlight', highlightId);

    // Store the highlight in our map
    if (!this.wordToHighlights.has(normalizedWord)) {
      this.wordToHighlights.set(normalizedWord, new Set());
    }
    this.wordToHighlights.get(normalizedWord)!.add(highlight);

    // Don't create purple remove button here - it will only appear after API call completes
    // If word is already explained, add green button instead
    if (this.explainedWords.has(normalizedWord)) {
      const greenBtn = this.createRemoveExplainedButton(word);
      highlight.appendChild(greenBtn);
    }
    // Otherwise, no button until API call completes and handleWordExplanation adds the green button
  }

  /**
   * Create a remove button for the highlight
   */
  createRemoveButton(word: string): HTMLElement {
    const btn = document.createElement('button');
    btn.className = 'vocab-word-remove-btn';
    btn.setAttribute('aria-label', `Remove highlight for "${word}"`);
    btn.innerHTML = this.createCloseIcon();

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.removeWord(word);
    });

    return btn;
  }

  /**
   * Create close/cross icon SVG
   */
  createCloseIcon(): string {
    return `
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 2L10 10M10 2L2 10" stroke="#9527F5" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }

  /**
   * Check if a word is already selected
   */
  isWordSelected(word: string): boolean {
    const normalizedWord = normalizeText(word);
    return this.selectedWords.has(normalizedWord);
  }

  /**
   * Add a word to the selected words set
   */
  addWord(word: string): void {
    const normalizedWord = normalizeText(word);
    this.selectedWords.add(normalizedWord);
    this.onWordSelected?.(word);
  }

  /**
   * Remove a word from the selected words set
   */
  removeWord(word: string): void {
    const normalizedWord = normalizeText(word);

    // Check if word is in explainedWords - if so, use removeExplainedWord instead
    if (this.explainedWords.has(normalizedWord)) {
      this.removeExplainedWord(word);
      return;
    }

    // Get all highlights for this word
    const highlights = this.wordToHighlights.get(normalizedWord);

    if (highlights) {
      highlights.forEach((highlight) => {
        removeHighlight(highlight);
      });
      this.wordToHighlights.delete(normalizedWord);
    }

    this.selectedWords.delete(normalizedWord);
    this.onWordRemoved?.(word);
  }

  /**
   * Remove an explained word
   */
  removeExplainedWord(word: string): void {
    const normalizedWord = normalizeText(word);

    const wordData = this.explainedWords.get(normalizedWord);
    if (!wordData) return;

    // Remove all highlights
    wordData.highlights.forEach((highlight) => {
      removeHighlight(highlight);
    });

    // Clean up
    this.explainedWords.delete(normalizedWord);
    this.wordToHighlights.delete(normalizedWord);
    this.selectedWords.delete(normalizedWord);
    this.wordPopupOpen.delete(normalizedWord);

    this.onWordRemoved?.(word);
  }

  /**
   * Process word explanation API call for a single word
   */
  async processWordExplanation(word: string, normalizedWord: string, highlight: HTMLElement): Promise<void> {
    if (this.explainedWords.has(normalizedWord)) {
      return;
    }

    // Show loading spinner
    this.showLoadingSpinner(highlight);

    // Build payload
    const docText = getDocumentText();
    const positions = findWordPositionsInDocument(normalizedWord);

    if (positions.length === 0) {
      this.hideLoadingSpinner(highlight);
      return;
    }

    const position = positions[0];
    const context = extractWordContext(docText, position, word.length);

    const payload: WordsExplanationRequest[] = [
      {
        textStartIndex: context.textStartIndex,
        text: context.text,
        important_words_location: [
          {
            word: normalizedWord,
            index: context.wordIndexInText,
            length: word.length,
          },
        ],
      },
    ];

    // Call API
    try {
      await ApiService.explainWords({
        textSegments: payload,
        onEvent: (event: WordsExplanationResponse) => {
          if (event.word_info) {
            const wordInfo = event.word_info;
            this.handleWordExplanation(word, normalizedWord, wordInfo, highlight);
          } else if (event.type === 'error') {
            this.hideLoadingSpinner(highlight);
            console.error('[WordSelector] Error in word explanation:', event.error_message);
          }
        },
        onComplete: () => {
          this.hideLoadingSpinner(highlight);
        },
        onError: (error) => {
          this.hideLoadingSpinner(highlight);
          console.error('[WordSelector] Error processing word explanation:', error);
        },
      });
    } catch (error) {
      this.hideLoadingSpinner(highlight);
      console.error('[WordSelector] Error calling word explanation API:', error);
    }
  }

  /**
   * Handle word explanation response
   */
  handleWordExplanation(
    word: string,
    normalizedWord: string,
    wordInfo: { word: string; meaning: string; examples: string[]; textStartIndex: number },
    highlight: HTMLElement
  ): void {
    // Update highlight to green (explained state)
    highlight.classList.remove('vocab-word-highlight');
    highlight.classList.add('vocab-word-explained', 'word-breathing');

    // Remove purple remove button
    const purpleBtn = highlight.querySelector('.vocab-word-remove-btn');
    if (purpleBtn) {
      purpleBtn.remove();
    }

    // Add green remove button
    const greenBtn = this.createRemoveExplainedButton(word);
    highlight.appendChild(greenBtn);

    // Get highlight position for modal positioning
    let wordPosition: { x: number; y: number; width: number; height: number } | undefined;
    try {
      const rect = highlight.getBoundingClientRect();
      // Check if rect is valid (not all zeros and has dimensions)
      if (rect && (rect.width > 0 || rect.height > 0 || rect.left !== 0 || rect.top !== 0)) {
        const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        wordPosition = {
          x: rect.left + scrollX,
          y: rect.bottom + scrollY + 8, // 8px gap below word
          width: rect.width,
          height: rect.height,
        };
        console.log('[WordSelector] Calculated word position:', wordPosition);
      } else {
        console.warn('[WordSelector] Invalid rect from getBoundingClientRect:', rect);
      }
    } catch (error) {
      console.error('[WordSelector] Error getting highlight position:', error);
    }
    
    // Fallback position if calculation failed
    if (!wordPosition) {
      const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      wordPosition = {
        x: scrollX + window.innerWidth / 2 - 200,
        y: scrollY + 100,
        width: 0,
        height: 0,
      };
      console.warn('[WordSelector] Using fallback position:', wordPosition);
    }

    // Store word data
    const wordData: WordData = {
      word: wordInfo.word,
      meaning: wordInfo.meaning,
      examples: wordInfo.examples || [],
      highlights: new Set([highlight]),
      shouldAllowFetchMoreExamples: true,
      position: wordPosition,
    };

    this.explainedWords.set(normalizedWord, wordData);

    // Remove from selected words
    this.selectedWords.delete(normalizedWord);

    // Remove breathing animation after it completes
    setTimeout(() => {
      highlight.classList.remove('word-breathing');
      highlight.classList.add('word-popup');
      setTimeout(() => {
        highlight.classList.remove('word-popup');
      }, 600);
    }, 800);

    console.log('[WordSelector] Calling onWordExplained callback for word:', word);
    console.log('[WordSelector] WordData:', wordData);
    console.log('[WordSelector] onWordExplained callback exists:', !!this.onWordExplained);
    if (this.onWordExplained) {
      this.onWordExplained(word, wordData);
      console.log('[WordSelector] onWordExplained callback completed');
    } else {
      console.warn('[WordSelector] onWordExplained callback is not set!');
    }
  }

  /**
   * Create remove button for explained words
   */
  createRemoveExplainedButton(word: string): HTMLElement {
    const btn = document.createElement('button');
    btn.className = 'vocab-word-remove-explained-btn';
    btn.setAttribute('aria-label', `Remove explanation for "${word}"`);
    btn.innerHTML = `
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 2L10 10M10 2L2 10" stroke="#22c55e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.removeExplainedWord(word);
    });

    return btn;
  }

  /**
   * Show loading spinner above a word highlight
   */
  showLoadingSpinner(highlight: HTMLElement): void {
    this.hideLoadingSpinner(highlight);

    const spinnerContainer = document.createElement('div');
    spinnerContainer.className = 'vocab-word-loading-spinner-container';

    const spinner = document.createElement('div');
    spinner.className = 'vocab-word-loading-spinner';

    spinnerContainer.appendChild(spinner);
    highlight.appendChild(spinnerContainer);
    highlight.classList.add('vocab-word-loading');
  }

  /**
   * Hide and remove loading spinner
   */
  hideLoadingSpinner(highlight: HTMLElement): void {
    const existingSpinner = highlight.querySelector('.vocab-word-loading-spinner-container');
    if (existingSpinner) {
      existingSpinner.remove();
    }
    highlight.classList.remove('vocab-word-loading');
  }

  /**
   * Hide all popups
   */
  hideAllPopups(): void {
    const popups = document.querySelectorAll('.vocab-word-popup');
    popups.forEach((popup) => {
      popup.remove();
    });
    this.wordPopupOpen.clear();
  }

  /**
   * Clear all selections
   */
  clearAll(): void {
    // Remove all highlights
    this.wordToHighlights.forEach((highlights) => {
      highlights.forEach((highlight) => {
        removeHighlight(highlight);
      });
    });

    // Clear data structures
    this.selectedWords.clear();
    this.wordToHighlights.clear();
    this.wordPositions.clear();
    this.explainedWords.clear();
    this.wordPopupOpen.clear();

    console.log('[WordSelector] All selections cleared');
  }

  /**
   * Inject CSS styles for word highlights
   */
  injectStyles(): void {
    const styleId = 'vocab-word-selector-styles';

    if (document.getElementById(styleId)) {
      return;
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .vocab-word-highlight {
        position: relative;
        display: inline;
        background-color: rgba(149, 39, 245, 0.15);
        padding: 0 4px;
        border-radius: 8px;
        transition: background-color 0.2s ease;
        cursor: pointer;
        line-height: inherit;
        box-decoration-break: clone;
        -webkit-box-decoration-break: clone;
      }
      
      .vocab-word-highlight:hover {
        background-color: rgba(149, 39, 245, 0.25);
      }
      
      .vocab-word-remove-btn {
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
        box-sizing: border-box;
      }
      
      .vocab-word-highlight:hover .vocab-word-remove-btn {
        opacity: 1 !important;
      }
      
      .vocab-word-remove-btn:hover {
        transform: scale(1.15);
      }
      
      .vocab-word-remove-btn:active {
        transform: scale(0.95);
      }
      
      .vocab-word-loading {
        animation: vocab-word-loading-breathe 0.75s ease-in-out infinite;
      }
      
      @keyframes vocab-word-loading-breathe {
        0%, 100% {
          background-color: rgba(196, 181, 253, 0.7);
        }
        50% {
          background-color: rgba(167, 139, 250, 0.8);
        }
      }
      
      .vocab-word-loading-spinner-container {
        position: absolute;
        top: -28px;
        left: 50%;
        transform: translateX(-50%);
        width: 24px;
        height: 24px;
        background-color: #FFFFFF;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000000;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .vocab-word-loading-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(149, 39, 245, 0.2);
        border-top-color: #9527F5;
        border-radius: 50%;
        animation: vocab-spinner-rotate 0.8s linear infinite;
      }
      
      @keyframes vocab-spinner-rotate {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .vocab-word-explained {
        background-color: rgba(240, 253, 244, 0.5) !important;
        cursor: pointer;
        border-radius: 8px;
        border: 0.5px solid #22c55e !important;
        padding: 0 2px;
        display: inline-block !important;
        user-select: none;
        transition: background-color 0.3s ease-in-out;
        box-decoration-break: clone;
        -webkit-box-decoration-break: clone;
      }
      
      .vocab-word-explained.word-breathing {
        animation: wordGreenBreathing 0.8s ease-in-out;
      }
      
      @keyframes wordGreenBreathing {
        0% { transform: scale(1); }
        25% { transform: scale(1.15); }
        50% { transform: scale(1); }
        75% { transform: scale(1.15); }
        100% { transform: scale(1); }
      }
      
      .vocab-word-explained.word-popup {
        animation: wordPopup 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) !important;
      }
      
      @keyframes wordPopup {
        0% { transform: scale(1); }
        20% { transform: scale(1.3); }
        40% { transform: scale(1); }
        60% { transform: scale(1.3); }
        80% { transform: scale(1); }
        100% { transform: scale(1); }
      }
      
      .vocab-word-explained:hover {
        background-color: rgba(187, 247, 208, 0.75) !important;
      }
      
      .vocab-word-remove-explained-btn {
        position: absolute !important;
        top: -10px !important;
        right: -10px !important;
        width: 18px !important;
        height: 18px !important;
        background: white !important;
        border: 1px solid #4ade80 !important;
        border-radius: 50% !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        cursor: pointer !important;
        opacity: 0.9 !important;
        transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out !important;
        padding: 0 !important;
        z-index: 999999 !important;
        box-shadow: 0 1px 3px rgba(34, 197, 94, 0.2) !important;
      }
      
      .vocab-word-remove-explained-btn:hover {
        transform: scale(1.15);
        opacity: 1;
        background-color: #f0fdf4 !important;
        border-color: #22c55e !important;
      }
      
      .vocab-word-remove-explained-btn:active {
        transform: scale(0.95);
      }
    `;

    document.head.appendChild(style);
  }
}

// Export singleton instance
export const wordSelector = new WordSelector();

