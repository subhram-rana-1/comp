/**
 * WordMeaningDialog Component
 * Displays word meaning, examples, bookmark functionality, Ask AI, and pronunciation
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Bookmark, MessageCircle, Loader2, Check } from 'lucide-react';
import { SpeakerIcon } from '../icons';
import { IconButton } from '../buttons';
import { Tooltip } from '../shared';
import { BookmarkWordsService } from '../../services';
import styles from './WordMeaningDialog.module.css';

export interface WordMeaningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  word: string;
  meaning: string;
  examples: string[];
  onAskAI?: () => void;
  onGetMoreExamples?: () => Promise<{ shouldAllowFetchMoreExamples?: boolean }>;
  shouldAllowFetchMoreExamples?: boolean;
  languageCode?: string | null;
  position?: { x: number; y: number; width: number; height: number };
  wordSelector?: { explainedWords?: Map<string, { highlights?: Set<HTMLElement> }> }; // WordSelector instance to get current word position
}

export const WordMeaningDialog: React.FC<WordMeaningDialogProps> = ({
  isOpen,
  onClose,
  word,
  meaning,
  examples,
  onAskAI,
  onGetMoreExamples,
  shouldAllowFetchMoreExamples = true,
  languageCode = null,
  position,
  wordSelector,
}) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoadingBookmark, setIsLoadingBookmark] = useState(false);
  const [isLoadingMoreExamples, setIsLoadingMoreExamples] = useState(false);
  const [showSuccessTick, setShowSuccessTick] = useState(false);
  const [localShouldAllowFetchMoreExamples, setLocalShouldAllowFetchMoreExamples] = useState(shouldAllowFetchMoreExamples);
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const dialogElementRef = React.useRef<HTMLDivElement>(null);
  const positionRef = React.useRef<{ x: number; y: number; width: number; height: number } | undefined>(position);

  // Check if word is bookmarked
  useEffect(() => {
    if (isOpen && word) {
      BookmarkWordsService.isBookmarked(word).then(setIsBookmarked);
    }
  }, [isOpen, word]);

  // Reset loading and success states when dialog closes or word changes
  useEffect(() => {
    if (!isOpen) {
      setIsLoadingMoreExamples(false);
      setShowSuccessTick(false);
    }
  }, [isOpen]);

  // Update local shouldAllowFetchMoreExamples when prop changes
  useEffect(() => {
    setLocalShouldAllowFetchMoreExamples(shouldAllowFetchMoreExamples);
  }, [shouldAllowFetchMoreExamples]);

  // Handle get more examples
  const handleGetMoreExamples = async () => {
    if (!onGetMoreExamples || isLoadingMoreExamples) return;

    setIsLoadingMoreExamples(true);
    setShowSuccessTick(false);

    try {
      const result = await onGetMoreExamples();
      
      // Show success tick for 2 seconds
      setShowSuccessTick(true);
      setTimeout(() => {
        setShowSuccessTick(false);
      }, 2000);

      // Update shouldAllowFetchMoreExamples based on API response
      if (result.shouldAllowFetchMoreExamples !== undefined) {
        setLocalShouldAllowFetchMoreExamples(result.shouldAllowFetchMoreExamples);
      }
    } catch (error) {
      console.error('[WordMeaningDialog] Error getting more examples:', error);
    } finally {
      setIsLoadingMoreExamples(false);
    }
  };

  // Handle bookmark toggle
  const handleBookmarkToggle = async () => {
    setIsLoadingBookmark(true);
    try {
      if (isBookmarked) {
        await BookmarkWordsService.removeBookmark(word);
        setIsBookmarked(false);
      } else {
        await BookmarkWordsService.addBookmark(word, meaning);
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error('[WordMeaningDialog] Error toggling bookmark:', error);
    } finally {
      setIsLoadingBookmark(false);
    }
  };

  // Handle pronunciation
  const handlePronunciation = async () => {
    // Pronunciation functionality would be implemented here
    console.log('[WordMeaningDialog] Pronunciation clicked for:', word);
  };

  // Update position ref when position prop changes
  React.useEffect(() => {
    positionRef.current = position;
  }, [position]);

  // Function to calculate and update modal position
  const updateModalPosition = React.useCallback(() => {
    if (!isOpen || !dialogElementRef.current) {
      console.log('[WordMeaningDialog] updateModalPosition: isOpen=', isOpen, 'dialogElementRef.current=', !!dialogElementRef.current);
      return;
    }

    // Get current position from word highlight if available
    let currentPosition = positionRef.current;
    if (!currentPosition && wordSelector && word) {
      const normalizedWord = word.toLowerCase().trim();
      const wordData = wordSelector.explainedWords?.get(normalizedWord);
      if (wordData?.highlights) {
        const highlight = Array.from(wordData.highlights)[0];
        if (highlight) {
          const rect = highlight.getBoundingClientRect();
          const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
          const scrollY = window.pageYOffset || document.documentElement.scrollTop;
          currentPosition = {
            x: rect.left + scrollX,
            y: rect.bottom + scrollY + 8,
            width: rect.width,
            height: rect.height,
          };
          positionRef.current = currentPosition;
          console.log('[WordMeaningDialog] Got position from highlight:', currentPosition);
        }
      }
    }

    if (!currentPosition) {
      console.warn('[WordMeaningDialog] No position available for modal');
      return;
    }

    const dialog = dialogElementRef.current;
    requestAnimationFrame(() => {
      const dialogRect = dialog.getBoundingClientRect();
      console.log('[WordMeaningDialog] Dialog rect before positioning:', dialogRect);
      
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;

      // Calculate position: below the word with margin, centered horizontally relative to word
      const marginBelowWord = 12; // 12px margin below word
      let left = currentPosition.x + (currentPosition.width / 2) - (dialogRect.width / 2);
      let top = currentPosition.y + marginBelowWord;

      console.log('[WordMeaningDialog] Initial calculated position - left:', left, 'top:', top);

      // Adjust if modal goes out of viewport horizontally
      if (left < scrollX + 10) {
        left = scrollX + 10;
      }
      if (left + dialogRect.width > scrollX + viewportWidth - 10) {
        left = scrollX + viewportWidth - dialogRect.width - 10;
      }
      
      // Adjust if modal goes out of viewport vertically
      if (top + dialogRect.height > scrollY + viewportHeight - 10) {
        // If not enough space below, position above the word
        top = currentPosition.y - dialogRect.height - marginBelowWord;
      }
      if (top < scrollY + 10) {
        top = scrollY + 10;
      }

      console.log('[WordMeaningDialog] Final position - left:', left, 'top:', top);

      // Ensure dialog is visible and positioned correctly
      dialog.style.position = 'absolute';
      dialog.style.left = `${left}px`;
      dialog.style.top = `${top}px`;
      dialog.style.margin = '0';
      dialog.style.zIndex = '2147483647';
      dialog.style.visibility = 'visible';
      dialog.style.opacity = '1';
      dialog.style.display = 'block';
      
      // Verify positioning
      setTimeout(() => {
        const finalRect = dialog.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(dialog);
        console.log('[WordMeaningDialog] Final dialog rect after positioning:', finalRect);
        console.log('[WordMeaningDialog] Dialog computed style - display:', computedStyle.display, 'visibility:', computedStyle.visibility, 'opacity:', computedStyle.opacity);
        console.log('[WordMeaningDialog] Dialog is visible:', finalRect.width > 0 && finalRect.height > 0);
        console.log('[WordMeaningDialog] Dialog position - left:', computedStyle.left, 'top:', computedStyle.top);
      }, 100);
    });
  }, [isOpen, word, wordSelector]);

  // Position the modal below the word and update on scroll/resize
  React.useEffect(() => {
    if (!isOpen) return;

    console.log('[WordMeaningDialog] Setting up position update effect');
    
    // Initial position - use multiple attempts to ensure DOM is ready
    const attemptPosition = () => {
      if (dialogElementRef.current) {
        console.log('[WordMeaningDialog] Dialog element found, updating position');
        updateModalPosition();
      } else {
        console.warn('[WordMeaningDialog] Dialog element not found yet, retrying...');
        setTimeout(attemptPosition, 50);
      }
    };

    // Try immediately
    attemptPosition();
    
    // Also try after a short delay to ensure DOM is ready
    setTimeout(attemptPosition, 100);
    setTimeout(attemptPosition, 200);

    // Update position on scroll and resize
    const handleScroll = () => {
      console.log('[WordMeaningDialog] Scroll detected, updating position');
      updateModalPosition();
    };
    const handleResize = () => {
      console.log('[WordMeaningDialog] Resize detected, updating position');
      updateModalPosition();
    };

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, updateModalPosition]);

  // Handle click outside to close
  React.useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Small delay to prevent immediate close when opening
    const timeout = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle escape key
  React.useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Debug logging
  React.useEffect(() => {
    if (isOpen) {
      console.log('[WordMeaningDialog] Modal is open, word:', word);
      console.log('[WordMeaningDialog] Position:', position);
      console.log('[WordMeaningDialog] dialogElementRef.current:', dialogElementRef.current);
      if (dialogElementRef.current) {
        const rect = dialogElementRef.current.getBoundingClientRect();
        console.log('[WordMeaningDialog] Dialog element rect:', rect);
        console.log('[WordMeaningDialog] Dialog computed styles:', window.getComputedStyle(dialogElementRef.current));
      }
    }
  }, [isOpen, word, position]);

  if (!isOpen) {
    console.log('[WordMeaningDialog] Modal is not open, returning null');
    return null;
  }
  
  console.log('[WordMeaningDialog] Rendering modal with isOpen:', isOpen);

  return createPortal(
    <div className={styles.dialogContainer} ref={dialogRef}>
      <div className={styles.dialog} ref={dialogElementRef}>
        <div className={styles.content}>
          {/* Word and meaning */}
          <div className={styles.header}>
            <p className={styles.meaning}>{meaning}</p>
          </div>

          {/* Examples */}
          {examples && examples.length > 0 && (
            <div className={styles.examplesSection}>
              <h3 className={styles.examplesHeading}>Examples</h3>
              <ul className={styles.examplesList}>
                {examples.map((example, index) => (
                  <li key={index} className={styles.exampleItem}>
                    {example}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action buttons */}
          <div className={styles.actions}>
            {/* Get more examples button */}
            {localShouldAllowFetchMoreExamples && onGetMoreExamples && (
              <Tooltip text="View more examples" position="top">
                <IconButton
                  icon={
                    isLoadingMoreExamples ? (
                      <Loader2 size={20} strokeWidth={1.5} color="#9527F5" className={styles.spinner} />
                    ) : showSuccessTick ? (
                      <Check size={20} strokeWidth={1.5} color="#10B981" />
                    ) : (
                      <Sparkles size={20} strokeWidth={1.5} color="#9527F5" />
                    )
                  }
                  onClick={handleGetMoreExamples}
                  ariaLabel="Generate more examples"
                  disabled={isLoadingMoreExamples}
                />
              </Tooltip>
            )}

            {/* Bookmark button */}
            <Tooltip text={isBookmarked ? "Remove bookmark" : "Save to bookmark"} position="top">
              <IconButton
                icon={<Bookmark size={20} strokeWidth={1.5} fill={isBookmarked ? "#9527F5" : "none"} color="#9527F5" />}
                onClick={handleBookmarkToggle}
                ariaLabel={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                className={isBookmarked ? styles.bookmarked : ''}
              />
            </Tooltip>

            {/* Ask AI button */}
            {onAskAI && (
              <Tooltip text="Ask AI" position="top">
                <IconButton
                  icon={<MessageCircle size={20} strokeWidth={1.5} color="#9527F5" />}
                  onClick={onAskAI}
                  ariaLabel="Ask AI about this word"
                />
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default WordMeaningDialog;

