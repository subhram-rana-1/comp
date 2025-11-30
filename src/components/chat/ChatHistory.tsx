import React from 'react';
import { ChatMessage } from './ChatMessage';
import styles from './ChatHistory.module.css';
import type { ChatHistory as ChatHistoryType } from '../../types';

export interface ChatHistoryProps {
  history: ChatHistoryType | null;
  onDeleteMessage?: (index: number) => void;
  className?: string;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({
  history,
  onDeleteMessage,
  className,
}) => {
  if (!history || history.messages.length === 0) {
    return (
      <div className={`${styles.empty} ${className || ''}`}>
        <p>No messages yet. Start a conversation!</p>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className || ''}`}>
      {history.messages.map((message, index) => (
        <ChatMessage
          key={index}
          message={message}
          onDelete={onDeleteMessage ? () => onDeleteMessage(index) : undefined}
        />
      ))}
    </div>
  );
};

export default ChatHistory;

