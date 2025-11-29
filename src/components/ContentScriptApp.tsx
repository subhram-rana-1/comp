/**
 * ContentScriptApp Component
 * Main app component that integrates all modules and components
 */

import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useWordSelector, wordSelector } from '../modules/WordSelector';
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
import type { WordData } from '../modules/WordSelector';

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
    position?: { x: number; y: number; width: number; height: number };
    shouldAllowFetchMoreExamples?: boolean;
  } | null>(null);

  // Initialize selectors
  useWordSelector();
  useTextSelector();

  // Initialize extension state and set up word selector callbacks
  useEffect(() => {
    const initialize = async () => {
      // Inject global color variables
      const styleId = 'xplaino-global-colors';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          :root {
            --very-light-purple: #E9D5FF;
            --medium-purple: #BF7EFA;
            --purple: #9527F5;
            --darker-purple: #8607f5;
            --light-green: #D1FAE5;
            --medium-green: #34D399;
            --green: #10B981;
            --light-red: #FEE2E2;
            --medium-red: #F87171;
            --red: #EF4444;
          }
        `;
        document.head.appendChild(style);
      }

      const extensionStore = useExtensionStore.getState();
      const languageStore = useLanguageStore.getState();

      await extensionStore.loadState();
      await languageStore.loadLanguage();

      // Set up onWordExplained callback to auto-open word meaning modal
      wordSelector.onWordExplained = (word: string, data: WordData) => {
        console.log('[ContentScriptApp] onWordExplained callback triggered for word:', word);
        console.log('[ContentScriptApp] WordData received:', data);
        
        const languageStore = useLanguageStore.getState();
        let languageCode: string | null = null;
        
        // Convert language to API format (uppercase or null)
        if (languageStore.language && 
            languageStore.language !== 'WEBSITE_LANGUAGE' && 
            languageStore.language !== 'none' && 
            languageStore.language !== 'dynamic') {
          languageCode = languageStore.language.toUpperCase();
        }

        // Ensure position is valid - try to recalculate from highlight element if missing
        let position = data.position;
        if (!position) {
          console.warn('[ContentScriptApp] Position missing, attempting to recalculate from highlight element');
          // Try to get position from the actual highlight element
          const normalizedWord = word.toLowerCase().trim();
          const wordData = wordSelector.explainedWords.get(normalizedWord);
          if (wordData?.highlights) {
            const highlight = Array.from(wordData.highlights)[0];
            if (highlight) {
              try {
                const rect = highlight.getBoundingClientRect();
                if (rect && (rect.width > 0 || rect.height > 0 || rect.left !== 0 || rect.top !== 0)) {
                  const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
                  const scrollY = window.pageYOffset || document.documentElement.scrollTop;
                  position = {
                    x: rect.left + scrollX,
                    y: rect.bottom + scrollY + 8, // 8px gap below word
                    width: rect.width,
                    height: rect.height,
                  };
                  console.log('[ContentScriptApp] Recalculated position from highlight:', position);
                }
              } catch (error) {
                console.error('[ContentScriptApp] Error getting highlight position:', error);
              }
            }
          }
          
          // Fallback if still no position
          if (!position) {
            console.warn('[ContentScriptApp] Position still missing, using fallback');
            const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
            const scrollY = window.pageYOffset || document.documentElement.scrollTop;
            position = {
              x: scrollX + window.innerWidth / 2 - 200,
              y: scrollY + 100,
              width: 0,
              height: 0,
            };
          }
        }

        console.log('[ContentScriptApp] Setting word meaning data and opening modal');
        console.log('[ContentScriptApp] Position:', position);
        console.log('[ContentScriptApp] Word:', data.word);
        console.log('[ContentScriptApp] Meaning:', data.meaning);
        console.log('[ContentScriptApp] Examples:', data.examples);
        
        // Use React's startTransition or batch updates to ensure state updates are processed
        // Set word meaning data and open modal
        const wordDataToSet = {
          word: data.word,
          meaning: data.meaning,
          examples: data.examples || [],
          languageCode,
          position,
          shouldAllowFetchMoreExamples: data.shouldAllowFetchMoreExamples ?? true,
        };
        
        console.log('[ContentScriptApp] Word data to set:', wordDataToSet);
        setWordMeaningData(wordDataToSet);
        
        // Use setTimeout to ensure state update is processed
        setTimeout(() => {
          setIsWordMeaningOpen(true);
          console.log('[ContentScriptApp] Modal state set to open after timeout');
        }, 0);
      };
      
      console.log('[ContentScriptApp] onWordExplained callback set:', !!wordSelector.onWordExplained);

      // Set up onWordClick callback to toggle modal when clicking green words
      wordSelector.onWordClick = (word: string, data: WordData) => {
        // Check current state to determine if we should toggle
        setWordMeaningData((currentData) => {
          // Toggle modal: if same word and modal is open, close it
          if (currentData?.word === data.word) {
            setIsWordMeaningOpen(false);
            return null; // Close modal
          }

          // Otherwise, open/update modal with current word
          const languageStore = useLanguageStore.getState();
          let languageCode: string | null = null;
          
          // Convert language to API format (uppercase or null)
          if (languageStore.language && 
              languageStore.language !== 'WEBSITE_LANGUAGE' && 
              languageStore.language !== 'none' && 
              languageStore.language !== 'dynamic') {
            languageCode = languageStore.language.toUpperCase();
          }

          // Update position from current highlight
          const normalizedWord = word.toLowerCase().trim();
          const wordData = wordSelector.explainedWords.get(normalizedWord);
          let position = data.position;
          
          // If position not in data, get it from the highlight element
          if (!position && wordData?.highlights) {
            const highlight = Array.from(wordData.highlights)[0];
            if (highlight) {
              const rect = highlight.getBoundingClientRect();
              const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
              const scrollY = window.pageYOffset || document.documentElement.scrollTop;
              position = {
                x: rect.left + scrollX,
                y: rect.bottom + scrollY + 8,
                width: rect.width,
                height: rect.height,
              };
            }
          }

          // Fallback position if still missing
          if (!position) {
            const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
            const scrollY = window.pageYOffset || document.documentElement.scrollTop;
            position = {
              x: scrollX + window.innerWidth / 2 - 200, // Center horizontally
              y: scrollY + 100, // 100px from top
              width: 0,
              height: 0,
            };
          }

          setIsWordMeaningOpen(true);
          return {
            word: data.word,
            meaning: data.meaning,
            examples: data.examples || [],
            languageCode,
            position,
            shouldAllowFetchMoreExamples: data.shouldAllowFetchMoreExamples ?? true,
          };
        });
      };

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

  // Handle Ask AI for word meaning
  const handleWordAskAI = () => {
    if (!wordMeaningData) return;

    // Construct word context string for chat
    const contextParts: string[] = [];
    contextParts.push(`Word: ${wordMeaningData.word}`);
    contextParts.push(`Meaning: ${wordMeaningData.meaning}`);
    if (wordMeaningData.examples && wordMeaningData.examples.length > 0) {
      contextParts.push(`Examples:`);
      wordMeaningData.examples.forEach((example) => {
        contextParts.push(`- ${example}`);
      });
    }

    const wordContext = contextParts.join('\n');
    openChat(wordContext, 'selection');
  };

  // Handle get more examples
  const handleGetMoreExamples = async (): Promise<{ shouldAllowFetchMoreExamples?: boolean }> => {
    if (!wordMeaningData) {
      return { shouldAllowFetchMoreExamples: false };
    }

    try {
      const { ApiService } = await import('../services');
      const result = await ApiService.getMoreExplanations(
        wordMeaningData.word,
        wordMeaningData.meaning,
        wordMeaningData.examples
      );

      if (result.success && result.data) {
        const newExamples = result.data.examples || wordMeaningData.examples;
        const newMeaning = result.data.meaning || wordMeaningData.meaning;
        const shouldAllowMore = result.data.shouldAllowFetchMoreExamples ?? true;

        // Update word meaning data with new examples
        setWordMeaningData({
          ...wordMeaningData,
          examples: newExamples,
          meaning: newMeaning,
          shouldAllowFetchMoreExamples: shouldAllowMore,
        });

        // Update the stored WordData in WordSelector to persist the changes
        const normalizedWord = wordMeaningData.word.toLowerCase().trim();
        const wordData = wordSelector.explainedWords.get(normalizedWord);
        if (wordData) {
          wordData.examples = newExamples;
          wordData.meaning = newMeaning;
          wordData.shouldAllowFetchMoreExamples = shouldAllowMore;
          wordSelector.explainedWords.set(normalizedWord, wordData);
          console.log('[ContentScriptApp] Updated WordData in store for word:', normalizedWord);
        }

        // Return the shouldAllowFetchMoreExamples flag from API response
        return {
          shouldAllowFetchMoreExamples: shouldAllowMore,
        };
      } else {
        console.error('[ContentScriptApp] Error getting more examples:', result.error);
        return { shouldAllowFetchMoreExamples: false };
      }
    } catch (error) {
      console.error('[ContentScriptApp] Error getting more examples:', error);
      return { shouldAllowFetchMoreExamples: false };
    }
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
          position={wordMeaningData.position}
          shouldAllowFetchMoreExamples={wordMeaningData.shouldAllowFetchMoreExamples}
          wordSelector={wordSelector}
          onAskAI={handleWordAskAI}
          onGetMoreExamples={handleGetMoreExamples}
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

