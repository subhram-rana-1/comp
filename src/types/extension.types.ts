/**
 * Extension state and configuration type definitions
 */

export interface ExtensionState {
  isEnabled: boolean;
  currentDomain: string | null;
}

export interface LanguagePreference {
  language: string;
  isWebsiteLanguage: boolean;
}

export interface BookmarkData {
  meaning: string;
  dateTime: string;
  url: string;
}

export interface BookmarkWords {
  [word: string]: BookmarkData;
}

export interface PageSummary {
  summary: string;
  possibleQuestions: string[];
}

export interface TextHighlight {
  text: string;
  startIndex: number;
  endIndex: number;
  key: string;
}

export interface WordMeaning {
  word: string;
  meaning: string;
  examples: string[];
  isBookmarked: boolean;
}

export interface SimplifiedText {
  originalText: string;
  simplifiedText: string;
  startIndex: number;
  endIndex: number;
  key: string;
}

export type MessageType =
  | 'TOGGLE_EXTENSION_GLOBAL'
  | 'TAB_STATE_CHANGE'
  | 'CHECK_EXTENSION_STATE'
  | 'EXTENSION_DISABLED'
  | 'LANGUAGE_MODAL_CLOSED';

export interface ExtensionMessage {
  type: MessageType;
  isEnabled?: boolean;
  domain?: string;
  eventType?: 'TAB_LOADED' | 'TAB_SWITCHED' | 'TAB_CREATED';
}

export interface TabStateChangeMessage extends ExtensionMessage {
  type: 'TAB_STATE_CHANGE';
  domain: string;
  eventType: 'TAB_LOADED' | 'TAB_SWITCHED' | 'TAB_CREATED';
}

export interface ToggleExtensionMessage extends ExtensionMessage {
  type: 'TOGGLE_EXTENSION_GLOBAL';
  isEnabled: boolean;
}

