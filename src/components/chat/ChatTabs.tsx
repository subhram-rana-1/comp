import React from 'react';
import styles from './ChatTabs.module.css';

export interface ChatTabsProps {
  activeTab: 'original' | 'ask';
  onTabChange: (tab: 'original' | 'ask') => void;
  className?: string;
}

export const ChatTabs: React.FC<ChatTabsProps> = ({
  activeTab,
  onTabChange,
  className,
}) => {
  return (
    <div className={`${styles.container} ${className || ''}`}>
      <button
        className={`${styles.tab} ${activeTab === 'original' ? styles.active : ''}`}
        onClick={() => onTabChange('original')}
      >
        ORIGINAL TEXT
      </button>
      <button
        className={`${styles.tab} ${activeTab === 'ask' ? styles.active : ''}`}
        onClick={() => onTabChange('ask')}
      >
        CHAT
      </button>
      <div className={`${styles.indicator} ${styles[activeTab]}`} />
    </div>
  );
};

export default ChatTabs;

