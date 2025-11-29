import React from 'react';
import { CloseIcon } from '../icons';
import styles from './ChatDeleteButton.module.css';

export interface ChatDeleteButtonProps {
  onClick: () => void;
  ariaLabel?: string;
  className?: string;
}

export const ChatDeleteButton: React.FC<ChatDeleteButtonProps> = ({
  onClick,
  ariaLabel = 'Delete message',
  className,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`${styles.button} ${className || ''}`}
    >
      <CloseIcon width={12} height={12} variant="purple" />
    </button>
  );
};

export default ChatDeleteButton;

