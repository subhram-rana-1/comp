/**
 * ChatDialog Component
 * Full-featured chat dialog with tabs, streaming, history, and minimize animations
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useChatStore } from '../../store/chatStore';
import { useChat } from '../../hooks/useChat';
import { ChatTabs } from '../chat/ChatTabs';
import { ChatHistory } from '../chat/ChatHistory';
import type { ChatHistory as ChatHistoryType } from '../../types';
import { ChatInput } from '../inputs/ChatInput';
import { CollapseIcon } from '../icons';
import { IconButton } from '../buttons';
import { LoadingState } from '../loading';
import styles from './ChatDialog.module.css';
import type { ChatMessage } from '../../types';

export interface ChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialContext?: string;
  contextType?: 'page_summary' | 'selection';
  textKey?: string;
  simplifiedData?: any;
  mode?: 'ask' | 'simplified';
  chatContext?: 'general' | 'selected';
}

export const ChatDialog: React.FC<ChatDialogProps> = ({
  isOpen,
  onClose,
  initialContext,
  contextType = 'selection',
  textKey,
  simplifiedData,
  mode = 'ask',
  chatContext = 'selected',
}) => {
  const { activeTab, history, isLoading, setActiveTab, setHistory, setLoading, setPossibleQuestions } = useChatStore();
  const { chatHistory, possibleQuestions, sendMessage, setHistory: setChatHistory } = useChat();
  const [currentMessage, setCurrentMessage] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Sync chat hook history with store
  useEffect(() => {
    if (chatHistory.length > 0) {
      const storeHistory = {
        messages: chatHistory,
        possibleQuestions: possibleQuestions,
        initialContext: initialContext,
        contextType: contextType,
      };
      setHistory(storeHistory);
      setPossibleQuestions(possibleQuestions);
    }
  }, [chatHistory, possibleQuestions, initialContext, contextType, setHistory, setPossibleQuestions]);

  // Load existing history when dialog opens
  useEffect(() => {
    if (isOpen && history) {
      setChatHistory(history.messages);
      setPossibleQuestions(history.possibleQuestions || []);
    }
  }, [isOpen, history, setChatHistory, setPossibleQuestions]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, streamingText]);

  // Handle tab switch
  const handleTabChange = (tab: 'original' | 'ask') => {
    setActiveTab(tab);
  };

  // Handle send message
  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return;

    const message = currentMessage.trim();
    setCurrentMessage('');

    if (!initialContext) {
      console.warn('[ChatDialog] No initial context provided');
      return;
    }

    setLoading(true);

    try {
      await sendMessage(
        initialContext,
        message,
        contextType,
        (chunk: string, accumulated: string) => {
          setStreamingText(accumulated);
        }
      );
    } catch (error) {
      console.error('[ChatDialog] Error sending message:', error);
    } finally {
      setLoading(false);
      setStreamingText('');
    }
  };

  // Handle possible question click
  const handleQuestionClick = (question: string) => {
    setCurrentMessage(question);
    // Auto-send the question
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  if (!isOpen) return null;

  const displayMessages: ChatMessage[] = [...chatHistory];
  if (streamingText) {
    // Add or update streaming message
    const lastMessage = displayMessages[displayMessages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant') {
      displayMessages[displayMessages.length - 1] = { role: 'assistant', content: streamingText };
    } else {
      displayMessages.push({ role: 'assistant', content: streamingText });
    }
  }

  const dialogContent = (
    <div className={styles.dialogContainer} ref={dialogRef}>
      <div className={styles.dialogContent}>
        {/* Collapse button */}
        <button className={styles.collapseButton} onClick={onClose} aria-label="Close dialog">
          <CollapseIcon />
        </button>

        {/* Tabs */}
        <ChatTabs activeTab={activeTab} onTabChange={handleTabChange} className={styles.tabs} />

        {/* Tab content */}
        <div className={styles.tabContent}>
          {activeTab === 'original' ? (
            <div className={styles.originalTextContent}>
              {simplifiedData?.simplifiedText ? (
                <div className={styles.simplifiedText}>{simplifiedData.simplifiedText}</div>
              ) : initialContext ? (
                <div className={styles.originalText}>{initialContext}</div>
              ) : (
                <div className={styles.emptyText}>No text available</div>
              )}
            </div>
          ) : (
            <div className={styles.chatContent}>
              {/* Chat history */}
              <div className={styles.chatHistoryContainer}>
                {displayMessages.length === 0 && !isLoading ? (
                  <div className={styles.emptyChat}>
                    <p>Start a conversation! Ask questions about the selected text.</p>
                    {possibleQuestions.length > 0 && (
                      <div className={styles.possibleQuestions}>
                        <p className={styles.questionsLabel}>Suggested questions:</p>
                        {possibleQuestions.map((question, index) => (
                          <button
                            key={index}
                            className={styles.questionButton}
                            onClick={() => handleQuestionClick(question)}
                          >
                            {question}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {displayMessages.length > 0 && (
                      <ChatHistory
                        history={{
                          messages: displayMessages,
                          possibleQuestions: possibleQuestions,
                          initialContext: initialContext,
                          contextType: contextType,
                        }}
                      />
                    )}
                    {isLoading && streamingText === '' && (
                      <div className={styles.loadingMessage}>
                        <LoadingState message="Thinking..." />
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Chat input */}
              <div className={styles.chatInputContainer}>
                <ChatInput
                  value={currentMessage}
                  onChange={setCurrentMessage}
                  onSend={handleSendMessage}
                  placeholder="Ask a question..."
                  disabled={isLoading}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
};

export default ChatDialog;

