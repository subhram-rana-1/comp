/**
 * Extension Store - Manages global extension state (enabled/disabled)
 */

import { create } from 'zustand';
import StorageService from '../services/StorageService';
import type { ExtensionState } from '../types';

interface ExtensionStore extends ExtensionState {
  setEnabled: (enabled: boolean) => void;
  setCurrentDomain: (domain: string | null) => void;
  loadState: () => Promise<void>;
}

const GLOBAL_STORAGE_KEY = 'is_extension_globally_enabled';

export const useExtensionStore = create<ExtensionStore>((set) => ({
  isEnabled: true, // Default to enabled
  currentDomain: null,

  setEnabled: async (enabled: boolean) => {
    set({ isEnabled: enabled });
    await StorageService.set(GLOBAL_STORAGE_KEY, enabled);
  },

  setCurrentDomain: (domain: string | null) => {
    set({ currentDomain: domain });
  },

  loadState: async () => {
    const savedState = await StorageService.get<boolean>(GLOBAL_STORAGE_KEY);
    if (savedState !== null) {
      set({ isEnabled: savedState });
    } else {
      // Default to true if not found
      await StorageService.set(GLOBAL_STORAGE_KEY, true);
      set({ isEnabled: true });
    }
  },
}));

