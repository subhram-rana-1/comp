/**
 * Bookmark Words Service - Manages bookmarked words in Chrome storage
 * Shared across all tabs using chrome.storage.local
 */

import StorageService from './StorageService';
import type { BookmarkWords, BookmarkData } from '../types';

export class BookmarkWordsService {
  static readonly STORAGE_KEY = 'bookmarkWords';

  /**
   * Get all bookmarked words
   */
  static async getAllBookmarks(): Promise<BookmarkWords> {
    try {
      const result = await StorageService.get<BookmarkWords>(this.STORAGE_KEY);
      return result || {};
    } catch (error) {
      console.error('[BookmarkWordsService] Error getting bookmarks:', error);
      return {};
    }
  }

  /**
   * Check if a word is bookmarked
   */
  static async isBookmarked(word: string): Promise<boolean> {
    const normalizedWord = word.toLowerCase().trim();
    const bookmarks = await this.getAllBookmarks();
    return normalizedWord in bookmarks;
  }

  /**
   * Get bookmark data for a word
   */
  static async getBookmark(word: string): Promise<BookmarkData | null> {
    const normalizedWord = word.toLowerCase().trim();
    const bookmarks = await this.getAllBookmarks();
    return bookmarks[normalizedWord] || null;
  }

  /**
   * Add a word to bookmarks
   */
  static async addBookmark(word: string, meaning: string, url: string = ''): Promise<boolean> {
    try {
      const normalizedWord = word.toLowerCase().trim();
      const bookmarks = await this.getAllBookmarks();

      const bookmarkData: BookmarkData = {
        meaning,
        dateTime: new Date().toISOString(),
        url: url || (typeof window !== 'undefined' ? window.location.href : ''),
      };

      bookmarks[normalizedWord] = bookmarkData;

      await StorageService.set(this.STORAGE_KEY, bookmarks);
      console.log('[BookmarkWordsService] Added bookmark for:', normalizedWord, 'URL:', bookmarkData.url);
      return true;
    } catch (error) {
      console.error('[BookmarkWordsService] Error adding bookmark:', error);
      return false;
    }
  }

  /**
   * Remove a word from bookmarks
   */
  static async removeBookmark(word: string): Promise<boolean> {
    try {
      const normalizedWord = word.toLowerCase().trim();
      const bookmarks = await this.getAllBookmarks();

      if (normalizedWord in bookmarks) {
        delete bookmarks[normalizedWord];
        await StorageService.set(this.STORAGE_KEY, bookmarks);
        console.log('[BookmarkWordsService] Removed bookmark for:', normalizedWord);
        return true;
      }

      return false;
    } catch (error) {
      console.error('[BookmarkWordsService] Error removing bookmark:', error);
      return false;
    }
  }

  /**
   * Toggle bookmark status for a word
   */
  static async toggleBookmark(word: string, meaning: string, url: string = ''): Promise<boolean> {
    const isBookmarked = await this.isBookmarked(word);

    if (isBookmarked) {
      await this.removeBookmark(word);
      return false;
    } else {
      await this.addBookmark(word, meaning, url);
      return true;
    }
  }

  /**
   * Clear all bookmarks
   */
  static async clearAllBookmarks(): Promise<boolean> {
    try {
      await StorageService.set(this.STORAGE_KEY, {});
      console.log('[BookmarkWordsService] Cleared all bookmarks');
      return true;
    } catch (error) {
      console.error('[BookmarkWordsService] Error clearing bookmarks:', error);
      return false;
    }
  }

  /**
   * Get count of bookmarked words
   */
  static async getBookmarkCount(): Promise<number> {
    const bookmarks = await this.getAllBookmarks();
    return Object.keys(bookmarks).length;
  }
}

export default BookmarkWordsService;

