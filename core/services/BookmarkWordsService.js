/**
 * Bookmark Words Service - Manages bookmarked words in Chrome storage
 * Shared across all tabs using chrome.storage.local
 */

class BookmarkWordsService {
  static STORAGE_KEY = 'bookmarkWords';
  
  /**
   * Get all bookmarked words
   * @returns {Promise<Object>} Map of word -> {meaning, dateTime}
   */
  static async getAllBookmarks() {
    try {
      const result = await chrome.storage.local.get([this.STORAGE_KEY]);
      return result[this.STORAGE_KEY] || {};
    } catch (error) {
      console.error('[BookmarkWordsService] Error getting bookmarks:', error);
      return {};
    }
  }
  
  /**
   * Check if a word is bookmarked
   * @param {string} word - The word to check (will be normalized to lowercase)
   * @returns {Promise<boolean>} True if word is bookmarked
   */
  static async isBookmarked(word) {
    const normalizedWord = word.toLowerCase().trim();
    const bookmarks = await this.getAllBookmarks();
    return normalizedWord in bookmarks;
  }
  
  /**
   * Get bookmark data for a word
   * @param {string} word - The word to get
   * @returns {Promise<Object|null>} Bookmark data or null if not found
   */
  static async getBookmark(word) {
    const normalizedWord = word.toLowerCase().trim();
    const bookmarks = await this.getAllBookmarks();
    return bookmarks[normalizedWord] || null;
  }
  
  /**
   * Add a word to bookmarks
   * @param {string} word - The word to bookmark
   * @param {string} meaning - The meaning of the word
   * @returns {Promise<boolean>} True if successfully added
   */
  static async addBookmark(word, meaning) {
    try {
      const normalizedWord = word.toLowerCase().trim();
      const bookmarks = await this.getAllBookmarks();
      
      const bookmarkData = {
        meaning: meaning,
        dateTime: new Date().toISOString()
      };
      
      bookmarks[normalizedWord] = bookmarkData;
      
      await chrome.storage.local.set({ [this.STORAGE_KEY]: bookmarks });
      console.log('[BookmarkWordsService] Added bookmark for:', normalizedWord);
      return true;
    } catch (error) {
      console.error('[BookmarkWordsService] Error adding bookmark:', error);
      return false;
    }
  }
  
  /**
   * Remove a word from bookmarks
   * @param {string} word - The word to remove
   * @returns {Promise<boolean>} True if successfully removed
   */
  static async removeBookmark(word) {
    try {
      const normalizedWord = word.toLowerCase().trim();
      const bookmarks = await this.getAllBookmarks();
      
      if (normalizedWord in bookmarks) {
        delete bookmarks[normalizedWord];
        await chrome.storage.local.set({ [this.STORAGE_KEY]: bookmarks });
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
   * @param {string} word - The word to toggle
   * @param {string} meaning - The meaning (required if adding)
   * @returns {Promise<boolean>} True if bookmarked after toggle, false if removed
   */
  static async toggleBookmark(word, meaning) {
    const isBookmarked = await this.isBookmarked(word);
    
    if (isBookmarked) {
      await this.removeBookmark(word);
      return false;
    } else {
      await this.addBookmark(word, meaning);
      return true;
    }
  }
  
  /**
   * Clear all bookmarks
   * @returns {Promise<boolean>} True if successfully cleared
   */
  static async clearAllBookmarks() {
    try {
      await chrome.storage.local.set({ [this.STORAGE_KEY]: {} });
      console.log('[BookmarkWordsService] Cleared all bookmarks');
      return true;
    } catch (error) {
      console.error('[BookmarkWordsService] Error clearing bookmarks:', error);
      return false;
    }
  }
  
  /**
   * Get count of bookmarked words
   * @returns {Promise<number>} Number of bookmarked words
   */
  static async getBookmarkCount() {
    const bookmarks = await this.getAllBookmarks();
    return Object.keys(bookmarks).length;
  }
}

// Export for use in content script
export default BookmarkWordsService;


