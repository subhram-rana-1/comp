import React, { useState, useEffect } from 'react';
import { CloseIcon } from '../icons';
import { IconButton } from '../buttons';
import { StorageService } from '../../services';
import styles from './Banner.module.css';

export interface BannerProps {
  title: string;
  message?: string;
  onClose?: () => void;
  className?: string;
  variant?: 'info' | 'success' | 'warning' | 'error';
  storageKey?: string; // Key for storing dismiss state
  autoDismiss?: boolean; // Auto-dismiss after a period
  dismissDelay?: number; // Delay in milliseconds for auto-dismiss
}

export const Banner: React.FC<BannerProps> = ({
  title,
  message,
  onClose,
  className,
  variant = 'info',
  storageKey,
  autoDismiss = false,
  dismissDelay = 5000,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  // Check if banner was previously dismissed
  useEffect(() => {
    if (storageKey) {
      chrome.storage.local.get([storageKey]).then((result) => {
        if (result[storageKey]) {
          setIsVisible(false);
        }
      });
    }
  }, [storageKey]);

  // Auto-dismiss if enabled
  useEffect(() => {
    if (autoDismiss && isVisible) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, dismissDelay);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, dismissDelay, isVisible]);

  const handleDismiss = async () => {
    setIsVisible(false);
    if (storageKey) {
      await chrome.storage.local.set({ [storageKey]: true });
    }
    onClose?.();
  };

  if (!isVisible) return null;

  return (
    <div className={`${styles.banner} ${styles[variant]} ${className || ''}`}>
      <div className={styles.header}>
        <div className={styles.content}>
          <h3 className={styles.title}>{title}</h3>
          {message && <p className={styles.message}>{message}</p>}
        </div>
        <IconButton
          icon={<CloseIcon width={16} height={16} color="#9527F5" />}
          onClick={handleDismiss}
          ariaLabel="Close banner"
        />
      </div>
    </div>
  );
};

export default Banner;

