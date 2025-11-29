/**
 * Chat Store - Manages chat state and history
 */

import { create } from 'zustand';
import type { ChatState, ChatHistory, ChatMessage } from '../types';

interface ChatStore extends ChatState {
  openChat: (initialContext?: string, contextType?: string) => void;
  closeChat: () => void;
  setActiveTab: (tab: 'original' | 'ask') => void;
  addMessage: (message: ChatMessage) => void;
  setHistory: (history: ChatHistory | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPossibleQuestions: (questions: string[]) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  isOpen: false,
  activeTab: 'ask',
  history: null,
  isLoading: false,
  error: null,

  openChat: (initialContext?: string, contextType?: string) => {
    set({
      isOpen: true,
      activeTab: 'ask',
      history: initialContext
        ? {
            messages: [],
            possibleQuestions: [],
            initialContext,
            contextType,
          }
        : null,
      error: null,
    });
  },

  closeChat: () => {
    set({
      isOpen: false,
      error: null,
    });
  },

  setActiveTab: (tab: 'original' | 'ask') => {
    set({ activeTab: tab });
  },

  addMessage: (message: ChatMessage) => {
    set((state) => {
      if (!state.history) {
        return {
          history: {
            messages: [message],
            possibleQuestions: [],
          },
        };
      }
      return {
        history: {
          ...state.history,
          messages: [...state.history.messages, message],
        },
      };
    });
  },

  setHistory: (history: ChatHistory | null) => {
    set({ history });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  setPossibleQuestions: (questions: string[]) => {
    set((state) => {
      if (!state.history) {
        return {
          history: {
            messages: [],
            possibleQuestions: questions,
          },
        };
      }
      return {
        history: {
          ...state.history,
          possibleQuestions: questions,
        },
      };
    });
  },

  clearChat: () => {
    set({
      history: null,
      messages: [],
      possibleQuestions: [],
      error: null,
    });
  },
}));

