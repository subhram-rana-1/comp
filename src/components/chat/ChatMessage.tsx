import React from 'react';
import { ChatDeleteButton } from '../buttons';
import styles from './ChatMessage.module.css';
import type { ChatMessage as ChatMessageType } from '../../types';

export interface ChatMessageProps {
  message: ChatMessageType;
  onDelete?: () => void;
  className?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onDelete,
  className,
}) => {
  const isUser = message.role === 'user';

  return (
    <div className={`${styles.message} ${styles[message.role]} ${className || ''}`}>
      <div className={styles.content}>
        <div className={styles.text}>{message.content}</div>
      </div>
      {onDelete && isUser && (
        <div className={styles.actions}>
          <ChatDeleteButton onClick={onDelete} />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;

