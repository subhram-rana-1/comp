/**
 * WordMeaningDialog Component
 * Displays word meaning, examples, bookmark functionality, Ask AI, and pronunciation
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DialogBase } from './DialogBase';
import { BookmarkIcon, SpeakerIcon, ChatIcon, SparkleIcon } from '../icons';
import { IconButton, PrimaryButton } from '../buttons';
import { BookmarkWordsService } from '../../services';
import styles from './WordMeaningDialog.module.css';

export interface WordMeaningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  word: string;
  meaning: string;
  examples: string[];
  onAskAI?: () => void;
  onGetMoreExamples?: () => void;
  shouldAllowFetchMoreExamples?: boolean;
  languageCode?: string | null;
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
}) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoadingBookmark, setIsLoadingBookmark] = useState(false);

  // Check if word is bookmarked
  useEffect(() => {
    if (isOpen && word) {
      BookmarkWordsService.isBookmarked(word).then(setIsBookmarked);
    }
  }, [isOpen, word]);

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

  if (!isOpen) return null;

  return (
    <DialogBase isOpen={isOpen} onClose={onClose} className={styles.dialog}>
      <div className={styles.content}>
        {/* Word and meaning */}
        <div className={styles.header}>
          <h2 className={styles.word}>{word}</h2>
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
          {/* Bookmark button */}
          <IconButton
            icon={<BookmarkIcon filled={isBookmarked} />}
            onClick={handleBookmarkToggle}
            ariaLabel={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
            className={isBookmarked ? styles.bookmarked : ''}
          />

          {/* Pronunciation button (only for English) */}
          {languageCode === 'ENGLISH' && (
            <IconButton
              icon={<SpeakerIcon fill="white" />}
              onClick={handlePronunciation}
              ariaLabel={`Pronounce "${word}"`}
            />
          )}

          {/* Get more examples button */}
          {shouldAllowFetchMoreExamples && onGetMoreExamples && (
            <IconButton
              icon={<SparkleIcon stroke="#9527F5" />}
              onClick={onGetMoreExamples}
              ariaLabel="Generate more examples"
            />
          )}

          {/* Ask AI button */}
          {onAskAI && (
            <IconButton
              icon={<ChatIcon color="#9527F5" />}
              onClick={onAskAI}
              ariaLabel="Ask AI about this word"
            />
          )}
        </div>
      </div>
    </DialogBase>
  );
};

export default WordMeaningDialog;

