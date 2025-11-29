/**
 * ButtonPanel Component
 * Home options button with menu containing Summarise, Settings, Bookmarks, and Power toggle
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { GearIcon, SparkleIcon, BookmarkIcon } from '../icons';
import { IconButton } from '../buttons';
import { useExtensionStore } from '../../store';
import { StorageService } from '../../services';
import styles from './ButtonPanel.module.css';

export interface ButtonPanelProps {
  onSummarise?: () => void;
  onSettings?: () => void;
  onBookmarks?: () => void;
  onTogglePower?: (enabled: boolean) => void;
}

export const ButtonPanel: React.FC<ButtonPanelProps> = ({
  onSummarise,
  onSettings,
  onBookmarks,
  onTogglePower,
}) => {
  const { isEnabled: isExtensionEnabled } = useExtensionStore();
  const extensionStore = useExtensionStore.getState();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [position, setPosition] = useState({ top: 20, right: 20 });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Load saved position
  useEffect(() => {
    const loadPosition = async () => {
      try {
        const saved = await chrome.storage.local.get(['buttonPanelPosition']);
        if (saved.buttonPanelPosition) {
          setPosition(saved.buttonPanelPosition);
        }
      } catch (error) {
        console.error('[ButtonPanel] Error loading position:', error);
      }
    };
    loadPosition();
  }, []);

  // Save position when it changes
  const savePosition = async (newPosition: { top: number; right: number }) => {
    try {
      await chrome.storage.local.set({ buttonPanelPosition: newPosition });
    } catch (error) {
      console.error('[ButtonPanel] Error saving position:', error);
    }
  };

  // Handle power toggle
  const handlePowerToggle = async () => {
    const newState = !isExtensionEnabled;
    await extensionStore.setEnabled(newState);
    onTogglePower?.(newState);

    // Send message to all tabs
    chrome.tabs.query({}).then((tabs) => {
      tabs.forEach((tab) => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'TOGGLE_EXTENSION_GLOBAL',
            isEnabled: newState,
          }).catch(() => {
            // Ignore errors for tabs without content script
          });
        }
      });
    });
  };

  // Handle menu toggle
  const handleMenuToggle = () => {
    setIsMenuOpen((prev) => !prev);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isMenuOpen]);

  if (!isExtensionEnabled) {
    return null;
  }

  const panelContent = (
    <div
      ref={containerRef}
      className={`${styles.container} ${isMenuOpen ? styles.active : ''}`}
      style={{ top: `${position.top}px`, right: `${position.right}px` }}
    >
      <button
        ref={buttonRef}
        className={styles.button}
        onClick={handleMenuToggle}
        aria-label="Home Options"
      >
        <GearIcon color="white" />
      </button>

      {isMenuOpen && (
        <div className={styles.menu}>
          {/* Summarise button */}
          <button
            className={styles.menuItem}
            onClick={() => {
              setIsMenuOpen(false);
              onSummarise?.();
            }}
            title="Summarise page"
          >
            <SparkleIcon strokeColor="white" />
            <span className={styles.menuItemLabel}>Summarise</span>
          </button>

          {/* Settings button */}
          <button
            className={styles.menuItem}
            onClick={() => {
              setIsMenuOpen(false);
              onSettings?.();
            }}
            title="Settings"
          >
            <GearIcon color="white" />
            <span className={styles.menuItemLabel}>Settings</span>
          </button>

          {/* Bookmarks button */}
          <button
            className={styles.menuItem}
            onClick={() => {
              setIsMenuOpen(false);
              onBookmarks?.();
            }}
            title="Bookmarks"
          >
            <BookmarkIcon filled={true} color="white" strokeColor="white" />
            <span className={styles.menuItemLabel}>Bookmarks</span>
          </button>

          {/* Power toggle button */}
          <button
            className={styles.menuItem}
            onClick={() => {
              setIsMenuOpen(false);
              handlePowerToggle();
            }}
            title={isExtensionEnabled ? 'Disable Extension' : 'Enable Extension'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.59-5.41L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z" />
            </svg>
            <span className={styles.menuItemLabel}>{isExtensionEnabled ? 'Disable' : 'Enable'}</span>
          </button>
        </div>
      )}
    </div>
  );

  return createPortal(panelContent, document.body);
};

export default ButtonPanel;

