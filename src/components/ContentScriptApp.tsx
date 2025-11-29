/**
 * ContentScriptApp Component
 * Main app component that integrates all modules and components
 */

import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useWordSelector } from '../modules/WordSelector';
import { useTextSelector } from '../modules/TextSelector';
import { useExtensionStore, useLanguageStore, useChatStore } from '../store';
import { ButtonPanel } from './shared/ButtonPanel';
import { Banner } from './shared/Banner';
import { ChatDialog } from './dialogs/ChatDialog';
import { WordMeaningDialog } from './dialogs/WordMeaningDialog';
import { SettingsModal } from './dialogs/SettingsModal';
import { LanguageSelectionModal } from './dialogs/LanguageSelectionModal';
import { BookmarkWordsDialog } from './dialogs/BookmarkWordsDialog';
import { usePageSummary } from '../hooks/usePageSummary';
import { getDocumentText } from '../utils/dom';

export const ContentScriptApp: React.FC = () => {
  const { isEnabled: isExtensionEnabled } = useExtensionStore();
  const { language } = useLanguageStore();
  const { isOpen: isChatOpen, openChat, closeChat, history } = useChatStore();
  const extensionStore = useExtensionStore.getState();
  const { summarizePage } = usePageSummary();

  // Dialog states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [isWordMeaningOpen, setIsWordMeaningOpen] = useState(false);
  const [wordMeaningData, setWordMeaningData] = useState<{
    word: string;
    meaning: string;
    examples: string[];
    languageCode?: string | null;
  } | null>(null);

  // Initialize selectors
  useWordSelector();
  useTextSelector();

  // Initialize extension state
  useEffect(() => {
    const initialize = async () => {
      const extensionStore = useExtensionStore.getState();
      const languageStore = useLanguageStore.getState();

      await extensionStore.loadState();
      await languageStore.loadLanguage();

      // Listen for storage changes
      chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local') {
          if (changes.is_extension_globally_enabled) {
            const newState = changes.is_extension_globally_enabled.newValue;
            extensionStore.setEnabled(newState ?? true);
          }
          if (changes.language) {
            const newLang = changes.language.newValue;
            languageStore.setLanguage(newLang || 'WEBSITE_LANGUAGE');
          }
        }
      });
    };

    initialize();
  }, []);

  // Handle page summarization
  const handleSummarise = async () => {
    const pageText = getDocumentText();
    if (pageText) {
      const result = await summarizePage(pageText.substring(0, 10000)); // Limit to 10k chars
      if (result) {
        openChat(result.summary, 'page_summary');
      }
    }
  };

  // Handle settings
  const handleSettings = () => {
    setIsSettingsOpen(true);
  };

  // Handle bookmarks
  const handleBookmarks = () => {
    setIsBookmarksOpen(true);
  };

  // Handle power toggle
  const handlePowerToggle = async (enabled: boolean) => {
    const extensionStore = useExtensionStore.getState();
    await extensionStore.setEnabled(enabled);
  };

  // Show welcome banner (only once)
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);
  useEffect(() => {
    const checkBanner = async () => {
      const result = await chrome.storage.local.get(['welcomeBannerDismissed']);
      if (!result.welcomeBannerDismissed) {
        setShowWelcomeBanner(true);
      }
    };
    checkBanner();
  }, []);

  const handleBannerDismiss = async () => {
    await chrome.storage.local.set({ welcomeBannerDismissed: true });
    setShowWelcomeBanner(false);
  };

  if (!isExtensionEnabled) {
    return null;
  }

  return (
    <>
      {/* Welcome Banner */}
      {showWelcomeBanner && (
        <Banner
          title="Welcome to XplainO!"
          message="Double-click words or select text to get AI-powered explanations."
          onClose={handleBannerDismiss}
          storageKey="welcomeBannerDismissed"
          variant="info"
        />
      )}

      {/* Button Panel */}
      <ButtonPanel
        onSummarise={handleSummarise}
        onSettings={handleSettings}
        onBookmarks={handleBookmarks}
        onTogglePower={handlePowerToggle}
      />

      {/* Chat Dialog */}
      <ChatDialog
        isOpen={isChatOpen}
        onClose={closeChat}
        initialContext={history?.initialContext}
        contextType={history?.contextType as 'page_summary' | 'selection'}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={() => {
          console.log('[ContentScriptApp] Settings saved');
        }}
      />

      {/* Language Selection Modal */}
      <LanguageSelectionModal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
        onSave={() => {
          console.log('[ContentScriptApp] Language saved');
        }}
      />

      {/* Bookmark Words Dialog */}
      <BookmarkWordsDialog
        isOpen={isBookmarksOpen}
        onClose={() => setIsBookmarksOpen(false)}
      />

      {/* Word Meaning Dialog */}
      {wordMeaningData && (
        <WordMeaningDialog
          isOpen={isWordMeaningOpen}
          onClose={() => {
            setIsWordMeaningOpen(false);
            setWordMeaningData(null);
          }}
          word={wordMeaningData.word}
          meaning={wordMeaningData.meaning}
          examples={wordMeaningData.examples}
          languageCode={wordMeaningData.languageCode}
        />
      )}
    </>
  );
};

/**
 * Initialize the content script app
 */
export function initContentScriptApp() {
  // Create root container
  const rootContainer = document.createElement('div');
  rootContainer.id = 'xplaino-content-script-root';
  rootContainer.style.display = 'none'; // Hidden, components use portals
  document.body.appendChild(rootContainer);

  // Create React root and render
  const root = createRoot(rootContainer);
  root.render(<ContentScriptApp />);

  console.log('[ContentScriptApp] Initialized');
}

