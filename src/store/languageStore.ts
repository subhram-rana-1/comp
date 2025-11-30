/**
 * Language Store - Manages language preference
 */

import { create } from 'zustand';
import StorageService from '../services/StorageService';
import type { LanguagePreference } from '../types';

interface LanguageStore extends LanguagePreference {
  setLanguage: (language: string) => Promise<void>;
  loadLanguage: () => Promise<void>;
}

const LANGUAGE_STORAGE_KEY = 'language';

export const useLanguageStore = create<LanguageStore>((set, get) => ({
  language: 'WEBSITE_LANGUAGE',
  isWebsiteLanguage: true,

  setLanguage: async (language: string) => {
    const isWebsiteLanguage = language === 'WEBSITE_LANGUAGE' || language === 'none' || language === 'dynamic';
    set({ language, isWebsiteLanguage });
    await StorageService.set(LANGUAGE_STORAGE_KEY, language);
  },

  loadLanguage: async () => {
    const savedLanguage = await StorageService.get<string>(LANGUAGE_STORAGE_KEY);
    const language = savedLanguage || 'WEBSITE_LANGUAGE';
    const isWebsiteLanguage = language === 'WEBSITE_LANGUAGE' || language === 'none' || language === 'dynamic';
    set({ language, isWebsiteLanguage });
  },
}));

