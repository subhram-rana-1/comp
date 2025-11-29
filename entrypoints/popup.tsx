import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ToggleSwitch } from '../src/components/buttons';
import { LoadingState } from '../src/components/loading';
import { ArrowRightIcon } from '../src/components/icons';
import { useExtensionStore } from '../src/store';
import styles from '../src/components/popup.module.css';

const PopupApp: React.FC = () => {
  const { isEnabled, setEnabled, loadState } = useExtensionStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isTabLoading, setIsTabLoading] = useState(false);

  useEffect(() => {
    // Load initial state
    loadState();

    // Check tab loading state
    const checkTabLoading = async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        setIsTabLoading(tab?.status === 'loading');
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking tab status:', error);
        setIsLoading(false);
      }
    };

    checkTabLoading();

    // Poll tab status while loading
    const interval = setInterval(async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const loading = tab?.status === 'loading';
      setIsTabLoading(loading);

      if (!loading) {
        clearInterval(interval);
      }
    }, 200);

    // Listen for tab updates
    const listener = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
      if (changeInfo.status === 'complete' || changeInfo.status === 'loading') {
        setIsTabLoading(changeInfo.status === 'loading');
      }
    };

    chrome.tabs.onUpdated.addListener(listener);

    return () => {
      clearInterval(interval);
      chrome.tabs.onUpdated.removeListener(listener);
    };
  }, [loadState]);

  const handleToggleChange = async (checked: boolean) => {
    await setEnabled(checked);

    // Notify all tabs
    try {
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (tab?.id) {
          try {
            await chrome.tabs.sendMessage(tab.id, {
              type: 'TOGGLE_EXTENSION_GLOBAL',
              isEnabled: checked,
            });
          } catch (error) {
            // Tab might not have content script loaded, ignore
            console.log('Could not send message to tab:', tab.id);
          }
        }
      }
    } catch (error) {
      console.error('Error sending message to content scripts:', error);
    }
  };

  if (isLoading || isTabLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.toggleContainer}>
          <ArrowRightIcon className={styles.fingerPoint} />
          <ToggleSwitch checked={isEnabled} onChange={handleToggleChange} />
        </div>
        <LoadingState message="Page is loading" />
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${isEnabled ? styles.extensionOn : ''}`}>
      <div className={styles.toggleContainer}>
        <ArrowRightIcon className={styles.fingerPoint} style={{ display: isEnabled ? 'none' : 'block' }} />
        <ToggleSwitch checked={isEnabled} onChange={handleToggleChange} />
      </div>

      <div className={styles.normalContent}>
        <div className={styles.titleContainer}>
          <img src="/branding-removebg.png" alt="XplainO" className={styles.brandingImg} />
          <p className={styles.subtitle}>
            AI-powered insights, summaries, and interactive explanations for any page, in any language
          </p>
        </div>

        <div className={`${styles.instructions} ${isEnabled ? styles.show : ''}`}>
          <p className={styles.instructionItem}>
            Double click a <span className={styles.highlight}>word</span> to select
          </p>
          <p className={styles.instructionItem}>Select one or more sentences</p>
        </div>
      </div>
    </div>
  );
};

// Initialize the app
const container = document.getElementById('root') || document.body;
const root = createRoot(container);
root.render(<PopupApp />);

