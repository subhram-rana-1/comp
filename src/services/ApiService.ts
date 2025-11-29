/**
 * API Service Class
 * Handles all API calls to the backend server
 */

import ApiConfig from '../config/apiConfig';
import StorageService from './StorageService';
import type {
  AskRequest,
  AskResponse,
  SimplifyRequest,
  SimplifyResponse,
  SummariseRequest,
  SummariseResponse,
  WordsExplanationRequest,
  WordsExplanationResponse,
  WebSearchRequest,
  WebSearchResponse,
  MoreExplanationsRequest,
  MoreExplanationsResponse,
  ChatMessage,
} from '../types';

export interface AskParams {
  initial_context: string;
  chat_history?: ChatMessage[];
  question: string;
  context_type?: string;
  onChunk?: (chunk: string, accumulated: string) => void;
  onComplete?: (chat_history: ChatMessage[] | null, possibleQuestions?: string[]) => void;
  onError?: (error: Error) => void;
}

export interface SimplifyParams {
  textSegments: SimplifyRequest[];
  onEvent?: (event: SimplifyResponse) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export interface SummariseParams {
  text: string;
  onEvent?: (event: SummariseResponse) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export interface WordsExplanationParams {
  textSegments: WordsExplanationRequest[];
  onEvent?: (event: WordsExplanationResponse) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export interface WebSearchParams {
  query: string;
  max_results?: number;
  region?: string;
  onMetadata?: (metadata: Extract<WebSearchResponse, { type: 'metadata' }>) => void;
  onResult?: (result: Extract<WebSearchResponse, { type: 'result' }>) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

class ApiService {
  static get BASE_URL(): string {
    return ApiConfig.getCurrentBaseUrl();
  }

  static get ENDPOINTS() {
    return ApiConfig.ENDPOINTS;
  }

  /**
   * Get language code from storage
   */
  private static async getLanguageCode(): Promise<string | null> {
    try {
      const language = await StorageService.get<string>('language') || 'WEBSITE_LANGUAGE';
      if (language === 'WEBSITE_LANGUAGE' || language === 'none' || language === 'dynamic') {
        return null;
      }
      return language.toUpperCase();
    } catch (error) {
      console.warn('[ApiService] Error getting language from storage:', error);
      return null;
    }
  }

  /**
   * Ask a question with context and chat history (SSE streaming)
   */
  static async ask(params: AskParams): Promise<() => void> {
    const { initial_context, chat_history = [], question, context_type, onChunk, onComplete, onError } = params;
    const url = `${this.BASE_URL}${this.ENDPOINTS.ASK}`;

    // Validate input parameters
    if (!initial_context || typeof initial_context !== 'string') {
      const error = new Error('initial_context is required and must be a string');
      if (onError) onError(error);
      return () => {};
    }
    if (!question || typeof question !== 'string') {
      const error = new Error('question is required and must be a string');
      if (onError) onError(error);
      return () => {};
    }
    if (!Array.isArray(chat_history)) {
      const error = new Error('chat_history must be an array');
      if (onError) onError(error);
      return () => {};
    }

    // Check for reasonable size limits
    if (initial_context.length > 100000) {
      console.warn(`[ApiService] initial_context is very large (${initial_context.length} chars), this might cause API errors`);
    }
    if (question.length > 10000) {
      console.warn(`[ApiService] question is very large (${question.length} chars), this might cause API errors`);
    }

    const languageCode = await this.getLanguageCode();
    const requestBody: AskRequest = {
      initial_context,
      chat_history,
      question,
    };

    if (languageCode !== null) {
      requestBody.languageCode = languageCode;
    }
    if (context_type) {
      requestBody.context_type = context_type;
    }

    try {
      console.log('[ApiService] Sending SSE request to:', url);
      const abortController = new AbortController();

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        mode: 'cors',
        body: JSON.stringify(requestBody),
        signal: abortController.signal,
      });

      if (!response.ok) {
        if (response.status === 429) {
          const error = new Error('Rate limit exceeded') as Error & { status?: number };
          error.status = 429;
          if (onError) onError(error);
          return () => {};
        }

        let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
        if (response.status === 422) {
          errorMessage = 'API request failed: 422 Unprocessable Entity. This usually means the request data is too large or contains invalid characters. Try asking a shorter question or the content might be too long.';
        } else if (response.status === 413) {
          errorMessage = 'API request failed: 413 Payload Too Large. The content or question is too large for the API to process.';
        } else if (response.status === 400) {
          errorMessage = 'API request failed: 400 Bad Request. The request format might be invalid.';
        }

        const error = new Error(errorMessage);
        if (onError) onError(error);
        return () => {};
      }

      // Process the SSE stream
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let completeEventData: { chat_history?: ChatMessage[]; possibleQuestions?: string[] } | null = null;
      let onCompleteCalled = false;

      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              console.log('[ApiService] Stream complete');
              if (completeEventData && !onCompleteCalled && onComplete) {
                onComplete(completeEventData.chat_history || null, completeEventData.possibleQuestions || []);
                onCompleteCalled = true;
              } else if (!onCompleteCalled && onComplete) {
                onComplete(null);
                onCompleteCalled = true;
              }
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.trim() === '') continue;

              if (line.startsWith('data: ')) {
                const dataStr = line.slice(6).trim();

                if (dataStr === '[DONE]') {
                  console.log('[ApiService] Received [DONE] signal');
                  continue;
                }

                try {
                  const data = JSON.parse(dataStr) as AskResponse;
                  console.log('[ApiService] Received event:', data);

                  if (data.chunk !== undefined) {
                    if (onChunk) {
                      onChunk(data.chunk, data.accumulated || '');
                    }
                  }

                  if (data.type === 'complete') {
                    console.log('[ApiService] ===== COMPLETE EVENT RECEIVED =====');
                    completeEventData = {
                      chat_history: data.chat_history || null,
                      possibleQuestions: data.possibleQuestions || [],
                    };

                    if (onComplete && !onCompleteCalled) {
                      onComplete(completeEventData.chat_history, completeEventData.possibleQuestions);
                      onCompleteCalled = true;
                    }
                  }

                  if (data.type === 'error' || data.error) {
                    const error = new Error(data.error || 'Stream error occurred');
                    console.error('[ApiService] Error event:', error);
                    if (onError) onError(error);
                  }
                } catch (parseError) {
                  console.error('[ApiService] Error parsing event data:', parseError);
                }
              }
            }
          }
        } catch (streamError) {
          if ((streamError as Error).name === 'AbortError') {
            console.log('[ApiService] Request aborted');
          } else {
            console.error('[ApiService] Stream processing error:', streamError);
            if (onError) {
              let errorMessage = (streamError as Error).message;
              if (errorMessage.includes('Failed to fetch') || (streamError as Error).name === 'TypeError') {
                errorMessage = `Cannot connect to API server. Please check:\n1. Backend server is running at ${this.BASE_URL}\n2. CORS is properly configured to allow requests from this origin`;
              }
              onError(new Error(errorMessage));
            }
          }
        }
      };

      processStream();

      return () => {
        console.log('[ApiService] Aborting request');
        abortController.abort();
      };
    } catch (error) {
      console.error('[ApiService] Error initiating ask API request:', error);
      let errorMessage = (error as Error).message;
      if (errorMessage.includes('Failed to fetch') || (error as Error).name === 'TypeError') {
        errorMessage = `Cannot connect to API server. Please check:\n1. Backend server is running at ${this.BASE_URL}\n2. CORS is properly configured to allow requests from this origin`;
      }
      if (onError) onError(new Error(errorMessage));
      return () => {};
    }
  }

  /**
   * Simplify multiple text segments using SSE
   */
  static async simplify(params: SimplifyParams): Promise<() => void> {
    const { textSegments, onEvent, onComplete, onError } = params;
    const url = `${this.BASE_URL}${this.ENDPOINTS.SIMPLIFY}`;

    try {
      console.log('[ApiService] Starting SSE request to:', url);
      const languageCode = await this.getLanguageCode();
      const textSegmentsWithLanguage = textSegments.map((segment) => {
        const segmentWithLang = { ...segment };
        if (languageCode !== null) {
          segmentWithLang.languageCode = languageCode;
        }
        return segmentWithLang;
      });

      const abortController = new AbortController();

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(textSegmentsWithLanguage),
        signal: abortController.signal,
      });

      if (!response.ok) {
        if (response.status === 429) {
          const error = new Error('Rate limit exceeded') as Error & { status?: number };
          error.status = 429;
          throw error;
        }

        let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.error || errorData.message) {
            errorMessage = `API request failed: ${response.status} ${response.statusText}. ${errorData.error || errorData.message}`;
          }
        } catch (e) {
          console.warn('[ApiService] Could not parse error response:', e);
        }
        throw new Error(errorMessage);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              console.log('[ApiService] Stream complete');
              if (onComplete) onComplete();
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.trim() === '') continue;

              if (line.startsWith('data: ')) {
                const dataStr = line.slice(6).trim();

                if (dataStr === '[DONE]') {
                  console.log('[ApiService] Received [DONE] signal');
                  if (onComplete) onComplete();
                  break;
                }

                try {
                  const data = JSON.parse(dataStr) as SimplifyResponse;
                  console.log('[ApiService] Received event:', data);

                  if (data.chunk !== undefined) {
                    if (onEvent) {
                      onEvent({
                        textStartIndex: data.textStartIndex,
                        textLength: data.textLength,
                        text: data.text,
                        previousSimplifiedTexts: data.previousSimplifiedTexts || [],
                        chunk: data.chunk,
                        accumulatedSimplifiedText: data.accumulatedSimplifiedText,
                      });
                    }
                  } else if (data.type === 'complete') {
                    if (onEvent) {
                      onEvent({
                        type: 'complete',
                        textStartIndex: data.textStartIndex,
                        textLength: data.textLength,
                        text: data.text,
                        previousSimplifiedTexts: data.previousSimplifiedTexts || [],
                        simplifiedText: data.simplifiedText,
                        shouldAllowSimplifyMore: data.shouldAllowSimplifyMore,
                        possibleQuestions: data.possibleQuestions || [],
                      });
                    }
                  } else if (data.type === 'error') {
                    const error = new Error(data.error || 'Stream error occurred') as Error & { error_code?: string };
                    error.error_code = (data as any).error_code;
                    console.error('[ApiService] Error event:', error);
                    if (onError) onError(error);
                  } else {
                    if (onEvent) {
                      onEvent(data);
                    }
                  }
                } catch (parseError) {
                  console.error('[ApiService] Error parsing event data:', parseError);
                }
              }
            }
          }
        } catch (streamError) {
          if ((streamError as Error).name === 'AbortError') {
            console.log('[ApiService] Request aborted');
          } else {
            console.error('[ApiService] Stream processing error:', streamError);
            if (onError) {
              let errorMessage = (streamError as Error).message;
              if (errorMessage.includes('Failed to fetch') || (streamError as Error).name === 'TypeError') {
                errorMessage = `Cannot connect to API server. Please check:\n1. Backend server is running at ${this.BASE_URL}\n2. CORS is properly configured to allow requests from this origin`;
              }
              onError(new Error(errorMessage));
            }
          }
        }
      };

      processStream();

      return () => {
        console.log('[ApiService] Aborting request');
        abortController.abort();
      };
    } catch (error) {
      console.error('[ApiService] Error initiating simplify request:', error);
      let errorMessage = (error as Error).message;
      if (errorMessage.includes('Failed to fetch') || (error as Error).name === 'TypeError') {
        errorMessage = `Cannot connect to API server. Please check:\n1. Backend server is running at ${this.BASE_URL}\n2. CORS is properly configured to allow requests from this origin`;
      }
      if (onError) onError(new Error(errorMessage));
      return () => {};
    }
  }

  /**
   * Summarise text content using SSE
   */
  static async summarise(params: SummariseParams): Promise<() => void> {
    const { text, onEvent, onComplete, onError } = params;
    const url = `${this.BASE_URL}${this.ENDPOINTS.SUMMARISE}`;

    try {
      console.log('[ApiService] Starting SSE request to:', url);
      const abortController = new AbortController();
      const languageCode = await this.getLanguageCode();

      const requestBody: SummariseRequest = { text };
      if (languageCode !== null) {
        requestBody.languageCode = languageCode;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(requestBody),
        signal: abortController.signal,
      });

      if (!response.ok) {
        if (response.status === 429) {
          const error = new Error('Rate limit exceeded') as Error & { status?: number };
          error.status = 429;
          throw error;
        }

        let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.error || errorData.message) {
            errorMessage = `API request failed: ${response.status} ${response.statusText}. ${errorData.error || errorData.message}`;
          }
        } catch (e) {
          console.warn('[ApiService] Could not parse error response:', e);
        }
        throw new Error(errorMessage);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              console.log('[ApiService] Stream complete');
              if (onComplete) onComplete();
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.trim() === '') continue;

              if (line.startsWith('data: ')) {
                const dataStr = line.slice(6).trim();

                if (dataStr === '[DONE]') {
                  console.log('[ApiService] Received [DONE] signal');
                  if (onComplete) onComplete();
                  break;
                }

                try {
                  const data = JSON.parse(dataStr) as SummariseResponse;
                  console.log('[ApiService] Received event:', data);

                  if (data.chunk !== undefined) {
                    if (onEvent) {
                      onEvent({
                        chunk: data.chunk,
                        accumulated: data.accumulated,
                      });
                    }
                  } else if (data.type === 'complete') {
                    if (onEvent) {
                      onEvent({
                        type: 'complete',
                        summary: data.summary,
                        possibleQuestions: data.possibleQuestions || [],
                      });
                    }
                  } else if (data.type === 'error') {
                    const error = new Error(data.error || 'Stream error occurred') as Error & { error_code?: string };
                    error.error_code = (data as any).error_code;
                    console.error('[ApiService] Error event:', error);
                    if (onError) onError(error);
                  } else {
                    if (onEvent) {
                      onEvent(data);
                    }
                  }
                } catch (parseError) {
                  console.error('[ApiService] Error parsing event data:', parseError);
                }
              }
            }
          }
        } catch (streamError) {
          if ((streamError as Error).name === 'AbortError') {
            console.log('[ApiService] Request aborted');
          } else {
            console.error('[ApiService] Stream processing error:', streamError);
            if (onError) {
              let errorMessage = (streamError as Error).message;
              if (errorMessage.includes('Failed to fetch') || (streamError as Error).name === 'TypeError') {
                errorMessage = `Cannot connect to API server. Please check:\n1. Backend server is running at ${this.BASE_URL}\n2. CORS is properly configured to allow requests from this origin`;
              }
              onError(new Error(errorMessage));
            }
          }
        }
      };

      processStream();

      return () => {
        console.log('[ApiService] Aborting request');
        abortController.abort();
      };
    } catch (error) {
      console.error('[ApiService] Error initiating summarise request:', error);
      let errorMessage = (error as Error).message;
      if (errorMessage.includes('Failed to fetch') || (error as Error).name === 'TypeError') {
        errorMessage = `Cannot connect to API server. Please check:\n1. Backend server is running at ${this.BASE_URL}\n2. CORS is properly configured to allow requests from this origin`;
      }
      if (onError) onError(new Error(errorMessage));
      return () => {};
    }
  }

  /**
   * Perform web search with SSE streaming
   */
  static async search(params: WebSearchParams): Promise<() => void> {
    const { query, max_results = 10, region = 'wt-wt', onMetadata, onResult, onComplete, onError } = params;
    const url = `${this.BASE_URL}${this.ENDPOINTS.WEB_SEARCH_STREAM}`;

    if (!query || typeof query !== 'string') {
      const error = new Error('query is required and must be a string');
      if (onError) onError(error);
      return () => {};
    }

    if (max_results < 1 || max_results > 50) {
      const error = new Error('max_results must be between 1 and 50');
      if (onError) onError(error);
      return () => {};
    }

    const languageCode = await this.getLanguageCode();
    const requestBody: WebSearchRequest = {
      query,
      max_results,
      region,
    };

    if (languageCode !== null) {
      requestBody.languageCode = languageCode;
    }

    try {
      console.log('[ApiService] Sending SSE request to:', url);
      const abortController = new AbortController();

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        mode: 'cors',
        body: JSON.stringify(requestBody),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const error = new Error(`Web search request failed: ${response.status} ${response.statusText}`);
        if (onError) onError(error);
        return () => {};
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const processLine = (line: string): boolean => {
        const trimmedLine = line.trim();
        if (trimmedLine === '') return false;

        if (trimmedLine.startsWith('data: ')) {
          const dataStr = trimmedLine.slice(6).trim();

          if (dataStr === '[DONE]') {
            console.log('[ApiService] Received [DONE] signal');
            if (onComplete) onComplete();
            return true;
          }

          try {
            if (!dataStr) {
              console.warn('[ApiService] Empty data string, skipping');
              return false;
            }

            const data = JSON.parse(dataStr) as WebSearchResponse;

            if (!data || typeof data !== 'object' || !('type' in data)) {
              console.warn('[ApiService] Event missing type property:', data);
              return false;
            }

            if (data.type === 'metadata' && onMetadata) {
              onMetadata(data);
            } else if (data.type === 'result' && onResult) {
              onResult(data);
            } else if (data.type === 'complete') {
              console.log('[ApiService] Received complete event');
              if (onComplete) onComplete();
              return true;
            } else if (data.type === 'error') {
              const error = new Error(data.error?.message || 'Web search error occurred');
              console.error('[ApiService] Error event:', error);
              if (onError) onError(error);
            } else {
              console.warn('[ApiService] Unknown event type:', (data as any).type, data);
            }
          } catch (parseError) {
            console.error('[ApiService] Error parsing event data:', parseError);
          }
        }
        return false;
      };

      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();

            if (value) {
              buffer += decoder.decode(value, { stream: !done });
            }

            if (done) {
              console.log('[ApiService] Stream complete');
              if (buffer.trim()) {
                const lines = buffer.split('\n');
                for (const line of lines) {
                  if (processLine(line)) {
                    return;
                  }
                }
              }
              if (onComplete) onComplete();
              break;
            }

            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (processLine(line)) {
                return;
              }
            }
          }
        } catch (streamError) {
          if ((streamError as Error).name === 'AbortError') {
            console.log('[ApiService] Request aborted');
          } else {
            console.error('[ApiService] Stream processing error:', streamError);
            if (onError) {
              let errorMessage = (streamError as Error).message;
              if (errorMessage.includes('Failed to fetch') || (streamError as Error).name === 'TypeError') {
                errorMessage = `Cannot connect to API server. Please check:\n1. Backend server is running at ${this.BASE_URL}\n2. CORS is properly configured to allow requests from this origin`;
              }
              onError(new Error(errorMessage));
            }
          }
        }
      };

      processStream();

      return () => {
        console.log('[ApiService] Aborting request');
        abortController.abort();
      };
    } catch (error) {
      console.error('[ApiService] Error initiating web search request:', error);
      let errorMessage = (error as Error).message;
      if (errorMessage.includes('Failed to fetch') || (error as Error).name === 'TypeError') {
        errorMessage = `Cannot connect to API server. Please check:\n1. Backend server is running at ${this.BASE_URL}\n2. CORS is properly configured to allow requests from this origin`;
      }
      if (onError) onError(new Error(errorMessage));
      return () => {};
    }
  }

  /**
   * Get word explanations for multiple text segments using SSE
   */
  static async explainWords(params: WordsExplanationParams): Promise<() => void> {
    const { textSegments, onEvent, onComplete, onError } = params;
    const url = `${this.BASE_URL}${this.ENDPOINTS.WORDS_EXPLANATION}`;

    try {
      console.log('[ApiService] Starting SSE request to:', url);
      const languageCode = await this.getLanguageCode();
      const textSegmentsWithLanguage = textSegments.map((segment) => {
        const segmentWithLang = { ...segment };
        if (languageCode !== null) {
          segmentWithLang.languageCode = languageCode;
        }
        return segmentWithLang;
      });

      const abortController = new AbortController();

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(textSegmentsWithLanguage),
        signal: abortController.signal,
      });

      if (!response.ok) {
        if (response.status === 429) {
          const error = new Error('Rate limit exceeded') as Error & { status?: number };
          error.status = 429;
          throw error;
        }
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              console.log('[ApiService] Stream complete');
              if (onComplete) onComplete();
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.trim() === '') continue;

              if (line.startsWith('data: ')) {
                const data = line.substring(6).trim();

                if (data === '[DONE]') {
                  console.log('[ApiService] Received [DONE] signal');
                  if (onComplete) onComplete();
                  break;
                }

                try {
                  const eventData = JSON.parse(data) as WordsExplanationResponse;
                  console.log('[ApiService] ===== RAW EVENT RECEIVED =====');
                  console.log('[ApiService] Raw event data:', data);
                  console.log('[ApiService] Parsed event data:', eventData);

                  if (eventData.word_info) {
                    console.log(`[ApiService] Event contains word_info for word: "${eventData.word_info.word}"`);
                  } else {
                    console.warn('[ApiService] Event does not contain word_info');
                  }

                  if (onEvent) {
                    onEvent(eventData);
                  }
                } catch (parseError) {
                  console.error('[ApiService] Error parsing event data:', parseError);
                }
              }
            }
          }
        } catch (streamError) {
          if ((streamError as Error).name === 'AbortError') {
            console.log('[ApiService] Request aborted');
          } else {
            console.error('[ApiService] Stream processing error:', streamError);
            if (onError) onError(streamError as Error);
          }
        }
      };

      processStream();

      return () => {
        console.log('[ApiService] Aborting request');
        abortController.abort();
      };
    } catch (error) {
      console.error('[ApiService] Error initiating word explanation request:', error);
      let errorMessage = (error as Error).message;
      if (errorMessage.includes('Failed to fetch') || (error as Error).name === 'TypeError') {
        errorMessage = `Cannot connect to API server. Please check:\n1. Backend server is running at ${this.BASE_URL}\n2. CORS is properly configured to allow requests from this origin`;
      }
      if (onError) onError(new Error(errorMessage));
      return () => {};
    }
  }

  /**
   * Get more explanations/examples for a word
   */
  static async getMoreExplanations(word: string, meaning: string, examples: string[]): Promise<{ success: boolean; data?: MoreExplanationsResponse; error?: string }> {
    const url = `${this.BASE_URL}/api/v1/get-more-explanations`;

    try {
      console.log('[ApiService] Fetching more explanations for:', word);

      const requestBody: MoreExplanationsRequest = {
        word,
        meaning,
        examples,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as MoreExplanationsResponse;
      console.log('[ApiService] Received more explanations:', data);

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('[ApiService] Error fetching more explanations:', error);
      let errorMessage = (error as Error).message;
      if (errorMessage.includes('Failed to fetch') || (error as Error).name === 'TypeError') {
        errorMessage = `Cannot connect to API server. Please check:\n1. Backend server is running at ${this.BASE_URL}\n2. CORS is properly configured to allow requests from this origin`;
      }
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Update base URL configuration
   */
  static setBaseUrl(newBaseUrl: string): void {
    ApiConfig.setBaseUrl(newBaseUrl);
    console.log('[ApiService] Base URL updated to:', newBaseUrl);
  }

  /**
   * Get current base URL
   */
  static getBaseUrl(): string {
    return this.BASE_URL;
  }
}

export default ApiService;

