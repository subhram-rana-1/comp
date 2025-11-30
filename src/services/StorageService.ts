/**
 * Storage Service - Handles Chrome Storage API operations
 * Provides typed wrappers for chrome.storage.local
 */

export class StorageService {
  /**
   * Get value from Chrome storage
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const result = await chrome.storage.local.get([key]);
      return (result[key] as T) || null;
    } catch (error) {
      console.error('[StorageService] Error getting value:', error);
      return null;
    }
  }

  /**
   * Set value in Chrome storage
   */
  static async set<T>(key: string, value: T): Promise<boolean> {
    try {
      await chrome.storage.local.set({ [key]: value });
      return true;
    } catch (error) {
      console.error('[StorageService] Error setting value:', error);
      return false;
    }
  }

  /**
   * Remove value from Chrome storage
   */
  static async remove(key: string): Promise<boolean> {
    try {
      await chrome.storage.local.remove([key]);
      return true;
    } catch (error) {
      console.error('[StorageService] Error removing value:', error);
      return false;
    }
  }

  /**
   * Get multiple values from Chrome storage
   */
  static async getMultiple<T extends Record<string, any>>(keys: string[]): Promise<Partial<T>> {
    try {
      const result = await chrome.storage.local.get(keys);
      return result as Partial<T>;
    } catch (error) {
      console.error('[StorageService] Error getting multiple values:', error);
      return {} as Partial<T>;
    }
  }

  /**
   * Set multiple values in Chrome storage
   */
  static async setMultiple(values: Record<string, any>): Promise<boolean> {
    try {
      await chrome.storage.local.set(values);
      return true;
    } catch (error) {
      console.error('[StorageService] Error setting multiple values:', error);
      return false;
    }
  }

  /**
   * Clear all storage
   */
  static async clear(): Promise<boolean> {
    try {
      await chrome.storage.local.clear();
      return true;
    } catch (error) {
      console.error('[StorageService] Error clearing storage:', error);
      return false;
    }
  }
}

export default StorageService;

