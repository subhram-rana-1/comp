/**
 * Hook for chat API integration
 */

import { useState, useCallback, useRef } from 'react';
import { ApiService } from '../services';
import type { ChatMessage } from '../types';

export interface UseChatReturn {
  isLoading: boolean;
  error: Error | null;
  chatHistory: ChatMessage[];
  possibleQuestions: string[];
  sendMessage: (
    initialContext: string,
    question: string,
    contextType?: 'page_summary' | 'selection',
    onChunk?: (chunk: string, accumulated: string) => void
  ) => Promise<void>;
  clearHistory: () => void;
  setHistory: (history: ChatMessage[]) => void;
}

/**
 * Hook for chat API integration with streaming and history management
 */
export function useChat(): UseChatReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [possibleQuestions, setPossibleQuestions] = useState<string[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (
      initialContext: string,
      question: string,
      contextType: 'page_summary' | 'selection' = 'selection',
      onChunk?: (chunk: string, accumulated: string) => void
    ): Promise<void> => {
      // Abort any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      setIsLoading(true);
      setError(null);

      // Add user message to history
      const userMessage: ChatMessage = { role: 'user', content: question };
      setChatHistory((prev) => [...prev, userMessage]);

      let accumulatedResponse = '';

      try {
        const abortFn = await ApiService.ask({
          initial_context: initialContext,
          chat_history: chatHistory,
          question: question,
          context_type: contextType,
          onChunk: (chunk: string, accumulated: string) => {
            accumulatedResponse = accumulated;
            onChunk?.(chunk, accumulated);
            // Update assistant message in history as it streams
            setChatHistory((prev) => {
              const newHistory = [...prev];
              const lastMessage = newHistory[newHistory.length - 1];
              if (lastMessage && lastMessage.role === 'assistant') {
                lastMessage.content = accumulated;
              } else {
                newHistory.push({ role: 'assistant', content: accumulated });
              }
              return newHistory;
            });
          },
          onComplete: (history: ChatMessage[] | null, questions: string[]) => {
            setIsLoading(false);
            if (history) {
              setChatHistory(history);
            } else {
              // Ensure assistant message is in history
              setChatHistory((prev) => {
                const newHistory = [...prev];
                const lastMessage = newHistory[newHistory.length - 1];
                if (lastMessage && lastMessage.role === 'assistant') {
                  lastMessage.content = accumulatedResponse;
                } else {
                  newHistory.push({ role: 'assistant', content: accumulatedResponse });
                }
                return newHistory;
              });
            }
            if (questions && questions.length > 0) {
              setPossibleQuestions(questions);
            }
          },
          onError: (err) => {
            setError(err instanceof Error ? err : new Error('Unknown error'));
            setIsLoading(false);
            // Remove the assistant message if it was added
            setChatHistory((prev) => {
              const newHistory = [...prev];
              if (newHistory[newHistory.length - 1]?.role === 'assistant') {
                newHistory.pop();
              }
              return newHistory;
            });
          },
        });

        abortControllerRef.current = new AbortController();
        (abortControllerRef.current as any).abortFn = abortFn;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setIsLoading(false);
        // Remove the assistant message if it was added
        setChatHistory((prev) => {
          const newHistory = [...prev];
          if (newHistory[newHistory.length - 1]?.role === 'assistant') {
            newHistory.pop();
          }
          return newHistory;
        });
      }
    },
    [chatHistory]
  );

  const clearHistory = useCallback(() => {
    if (abortControllerRef.current) {
      const abortFn = (abortControllerRef.current as any).abortFn;
      if (abortFn) {
        abortFn();
      }
      abortControllerRef.current.abort();
    }
    setChatHistory([]);
    setPossibleQuestions([]);
    setError(null);
    setIsLoading(false);
  }, []);

  const setHistory = useCallback((history: ChatMessage[]) => {
    setChatHistory(history);
  }, []);

  return {
    isLoading,
    error,
    chatHistory,
    possibleQuestions,
    sendMessage,
    clearHistory,
    setHistory,
  };
}

