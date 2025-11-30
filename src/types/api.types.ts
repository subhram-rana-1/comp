/**
 * API-related type definitions
 */

export interface ApiError {
  message: string;
  status?: number;
  error_code?: string;
}

export interface AskRequest {
  initial_context: string;
  chat_history: ChatMessage[];
  question: string;
  context_type?: string;
  languageCode?: string;
}

export interface AskResponse {
  chunk?: string;
  accumulated?: string;
  type?: 'complete' | 'error';
  chat_history?: ChatMessage[];
  possibleQuestions?: string[];
  error?: string;
}

export interface SimplifyRequest {
  textStartIndex: number;
  textLength: number;
  text: string;
  previousSimplifiedTexts?: string[];
  languageCode?: string;
}

export interface SimplifyResponse {
  textStartIndex: number;
  textLength: number;
  text: string;
  previousSimplifiedTexts?: string[];
  chunk?: string;
  accumulatedSimplifiedText?: string;
  type?: 'complete';
  simplifiedText?: string;
  shouldAllowSimplifyMore?: boolean;
  possibleQuestions?: string[];
}

export interface SummariseRequest {
  text: string;
  languageCode?: string;
}

export interface SummariseResponse {
  chunk?: string;
  accumulated?: string;
  type?: 'complete' | 'error';
  summary?: string;
  possibleQuestions?: string[];
  error?: string;
}

export interface WordsExplanationRequest {
  textStartIndex: number;
  text: string;
  important_words_location: WordLocation[];
  languageCode?: string;
}

export interface WordLocation {
  word: string;
  index: number;
  length: number;
}

export interface WordInfo {
  word: string;
  meaning: string;
  examples?: string[];
  textStartIndex: number;
}

export interface WordsExplanationResponse {
  word_info?: WordInfo;
  type?: 'complete' | 'error';
  error?: string;
}

export interface WebSearchRequest {
  query: string;
  max_results?: number;
  region?: string;
  languageCode?: string;
}

export interface WebSearchMetadata {
  type: 'metadata';
  total_results?: number;
  query?: string;
}

export interface WebSearchResult {
  type: 'result';
  title?: string;
  url?: string;
  snippet?: string;
  position?: number;
}

export interface WebSearchComplete {
  type: 'complete';
}

export interface WebSearchError {
  type: 'error';
  error: {
    message: string;
    code?: string;
  };
}

export type WebSearchResponse = WebSearchMetadata | WebSearchResult | WebSearchComplete | WebSearchError;

export interface MoreExplanationsRequest {
  word: string;
  meaning: string;
  examples: string[];
}

export interface MoreExplanationsResponse {
  meaning?: string;
  examples?: string[];
  synonyms?: string[];
  antonyms?: string[];
  shouldAllowFetchMoreExamples?: boolean;
}

