/**
 * SettingsModal Component
 * Language selection with tabs (Fixed/Website) and dropdown
 */

import React, { useState, useMemo } from 'react';
import { DialogBase } from './DialogBase';
import { SearchInput } from '../inputs/SearchInput';
import { PrimaryButton } from '../buttons';
import { useLanguageStore } from '../../store';
import { TOP_LANGUAGES } from '../../utils/constants';
import styles from './SettingsModal.module.css';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const { language, setLanguage } = useLanguageStore();
  const [activeTab, setActiveTab] = useState<'fixed' | 'website'>('fixed');
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter languages based on search query
  const filteredLanguages = useMemo(() => {
    if (!searchQuery.trim()) {
      return TOP_LANGUAGES;
    }
    const query = searchQuery.toLowerCase();
    return TOP_LANGUAGES.filter((lang) => lang.toLowerCase().includes(query));
  }, [searchQuery]);

  const handleSave = async () => {
    await setLanguage(selectedLanguage);
    onSave?.();
    onClose();
  };

  return (
    <DialogBase isOpen={isOpen} onClose={onClose} title="Settings" className={styles.dialog}>
      <div className={styles.content}>
        {/* Language selection tabs */}
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

        {/* Language selection content */}
        <div className={styles.tabContent}>
          {activeTab === 'fixed' ? (
            <div className={styles.languageSelection}>
              <label className={styles.label}>Select Language:</label>
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search languages..."
                className={styles.searchInput}
              />
              <div className={styles.languageList}>
                <button
                  className={`${styles.languageItem} ${selectedLanguage === 'WEBSITE_LANGUAGE' ? styles.selected : ''}`}
                  onClick={() => setSelectedLanguage('WEBSITE_LANGUAGE')}
                >
                  Website Language
                </button>
                {filteredLanguages.map((lang) => (
                  <button
                    key={lang}
                    className={`${styles.languageItem} ${selectedLanguage === lang ? styles.selected : ''}`}
                    onClick={() => setSelectedLanguage(lang)}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.websiteLanguageInfo}>
              <p>Use the website's default language for explanations.</p>
              <button
                className={`${styles.websiteLanguageButton} ${selectedLanguage === 'WEBSITE_LANGUAGE' ? styles.selected : ''}`}
                onClick={() => setSelectedLanguage('WEBSITE_LANGUAGE')}
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

export default SettingsModal;

