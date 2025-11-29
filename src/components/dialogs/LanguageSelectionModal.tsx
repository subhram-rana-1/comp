/**
 * LanguageSelectionModal Component
 * Language preference selection with searchable language list and tab switching
 */

import React, { useState, useMemo } from 'react';
import { DialogBase } from './DialogBase';
import { SearchInput } from '../inputs/SearchInput';
import { PrimaryButton } from '../buttons';
import { useLanguageStore } from '../../store';
import { TOP_LANGUAGES } from '../../utils/constants';
import styles from './LanguageSelectionModal.module.css';

export interface LanguageSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export const LanguageSelectionModal: React.FC<LanguageSelectionModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const { language, setLanguage } = useLanguageStore();
  const [activeTab, setActiveTab] = useState<'fixed' | 'website'>('fixed');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState(language);

  // Filter languages based on search query
  const filteredLanguages = useMemo(() => {
    if (!searchQuery.trim()) {
      return TOP_LANGUAGES;
    }
    const query = searchQuery.toLowerCase();
    return TOP_LANGUAGES.filter((lang) => lang.toLowerCase().includes(query));
  }, [searchQuery]);

  const handleLanguageSelect = (lang: string) => {
    const langValue = lang === 'Website Language' ? 'WEBSITE_LANGUAGE' : lang;
    setSelectedLanguage(langValue);
  };

  const handleSave = () => {
    setLanguage(selectedLanguage);
    onSave?.();
    onClose();
  };

  return (
    <DialogBase isOpen={isOpen} onClose={onClose} title="Select Language" className={styles.dialog}>
      <div className={styles.content}>
        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'fixed' ? styles.active : ''}`}
            onClick={() => setActiveTab('fixed')}
          >
            Fixed Language
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'website' ? styles.active : ''}`}
            onClick={() => setActiveTab('website')}
          >
            Website Language
          </button>
        </div>

        {/* Tab content */}
        <div className={styles.tabContent}>
          {activeTab === 'fixed' ? (
            <>
              {/* Search input */}
              <div className={styles.searchContainer}>
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search languages..."
              />
              </div>

              {/* Language list */}
              <div className={styles.languageList}>
                <button
                  className={`${styles.languageItem} ${selectedLanguage === 'WEBSITE_LANGUAGE' ? styles.selected : ''}`}
                  onClick={() => handleLanguageSelect('Website Language')}
                >
                  Website Language
                </button>
                {filteredLanguages.map((lang) => (
                  <button
                    key={lang}
                    className={`${styles.languageItem} ${selectedLanguage === lang ? styles.selected : ''}`}
                    onClick={() => handleLanguageSelect(lang)}
                  >
                    {lang}
                  </button>
                ))}
                {filteredLanguages.length === 0 && (
                  <div className={styles.noResults}>No languages found</div>
                )}
              </div>
            </>
          ) : (
            <div className={styles.websiteLanguageInfo}>
              <p>Use the website's default language for explanations.</p>
              <button
                className={`${styles.websiteLanguageButton} ${selectedLanguage === 'WEBSITE_LANGUAGE' ? styles.selected : ''}`}
                onClick={() => handleLanguageSelect('Website Language')}
              >
                Use Website Language
              </button>
            </div>
          )}
        </div>

        {/* Save button */}
        <div className={styles.actions}>
          <PrimaryButton onClick={handleSave}>Save</PrimaryButton>
        </div>
      </div>
    </DialogBase>
  );
};

export default LanguageSelectionModal;

