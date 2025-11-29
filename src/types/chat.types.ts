/**
 * Chat-related type definitions
 */

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatHistory {
  messages: ChatMessage[];
  possibleQuestions: string[];
  initialContext?: string;
  contextType?: string;
}

export interface ChatState {
  isOpen: boolean;
  activeTab: 'original' | 'ask';
  history: ChatHistory | null;
  isLoading: boolean;
  error: string | null;
}

