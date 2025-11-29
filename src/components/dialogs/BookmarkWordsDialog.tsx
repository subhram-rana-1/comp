/**
 * BookmarkWordsDialog Component
 * Display and manage bookmarked words
 */

import React, { useState, useEffect, useMemo } from 'react';
import { DialogBase } from './DialogBase';
import { SearchInput } from '../inputs/SearchInput';
import { BookmarkWordsService } from '../../services';
import { BookmarkIcon } from '../icons';
import { IconButton } from '../buttons';
import type { BookmarkWords } from '../../types';
import styles from './BookmarkWordsDialog.module.css';

export interface BookmarkWordsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BookmarkWordsDialog: React.FC<BookmarkWordsDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const [bookmarks, setBookmarks] = useState<BookmarkWords>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  // Load bookmarks when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadBookmarks();
    }
  }, [isOpen]);

  const loadBookmarks = async () => {
    const allBookmarks = await BookmarkWordsService.getAllBookmarks();
    setBookmarks(allBookmarks);
  };

  // Filter bookmarks based on search query
  const filteredBookmarks = useMemo(() => {
    if (!searchQuery.trim()) {
      return bookmarks;
    }
    const query = searchQuery.toLowerCase();
    const filtered: BookmarkWords = {};
    Object.entries(bookmarks).forEach(([word, bookmark]) => {
      if (
        word.toLowerCase().includes(query) ||
        bookmark.meaning.toLowerCase().includes(query)
      ) {
        filtered[word] = bookmark;
      }
    });
    return filtered;
  }, [bookmarks, searchQuery]);

  // Handle remove bookmark
  const handleRemoveBookmark = async (word: string) => {
    await BookmarkWordsService.removeBookmark(word);
    await loadBookmarks();
    if (selectedWord === word) {
      setSelectedWord(null);
    }
  };

  const bookmarkEntries = Object.entries(filteredBookmarks);

  return (
    <DialogBase isOpen={isOpen} onClose={onClose} title="Bookmarked Words" className={styles.dialog}>
      <div className={styles.content}>
        {/* Search input */}
        <div className={styles.searchContainer}>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search bookmarks..."
          />
        </div>

        {/* Bookmarks list */}
        <div className={styles.bookmarksList}>
          {bookmarkEntries.length === 0 ? (
            <div className={styles.emptyState}>
              <BookmarkIcon filled={false} />
              <p>No bookmarks yet</p>
              <p className={styles.emptySubtext}>Bookmark words to save them for later</p>
            </div>
          ) : (
            bookmarkEntries.map(([word, bookmark]) => (
              <div
                key={word}
                className={`${styles.bookmarkItem} ${selectedWord === word ? styles.selected : ''}`}
                onClick={() => setSelectedWord(selectedWord === word ? null : word)}
              >
                <div className={styles.bookmarkContent}>
                  <h3 className={styles.bookmarkWord}>{word}</h3>
                  <p className={styles.bookmarkMeaning}>{bookmark.meaning}</p>
                  {selectedWord === word && (
                    <div className={styles.bookmarkMetadata}>
                      <p className={styles.bookmarkUrl}>
                        <strong>URL:</strong> {bookmark.url || 'N/A'}
                      </p>
                      <p className={styles.bookmarkDate}>
                        <strong>Saved:</strong> {new Date(bookmark.dateTime).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
                <IconButton
                  icon={<BookmarkIcon filled={true} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveBookmark(word);
                  }}
                  ariaLabel="Remove bookmark"
                />
              </div>
            ))
          )}
        </div>
      </div>
    </DialogBase>
  );
};

export default BookmarkWordsDialog;

