/**
 * Hook for word explanation API integration
 */

import { useState, useCallback, useRef } from 'react';
import { ApiService } from '../services';
import type { WordsExplanationRequest, WordsExplanationResponse } from '../types';

export interface WordExplanationResult {
  word: string;
  meaning: string;
  examples: string[];
  textStartIndex: number;
}

export interface UseWordExplanationReturn {
  isLoading: boolean;
  error: Error | null;
  explainWord: (request: WordsExplanationRequest) => Promise<WordExplanationResult | null>;
  explainWords: (requests: WordsExplanationRequest[]) => Promise<WordExplanationResult[]>;
  cache: Map<string, WordExplanationResult>;
  clearCache: () => void;
}

/**
 * Hook for word explanation with caching and loading states
 */
export function useWordExplanation(): UseWordExplanationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const cacheRef = useRef<Map<string, WordExplanationResult>>(new Map());

  const explainWord = useCallback(
    async (request: WordsExplanationRequest): Promise<WordExplanationResult | null> => {
      // Check cache first
      const cacheKey = `${request.textStartIndex}-${request.important_words_location[0]?.word || ''}`;
      if (cacheRef.current.has(cacheKey)) {
        return cacheRef.current.get(cacheKey)!;
      }

      setIsLoading(true);
      setError(null);

      let result: WordExplanationResult | null = null;

      try {
        await ApiService.explainWords({
          textSegments: [request],
          onEvent: (event: WordsExplanationResponse) => {
            if (event.word_info) {
              result = {
                word: event.word_info.word,
                meaning: event.word_info.meaning,
                examples: event.word_info.examples || [],
                textStartIndex: event.word_info.textStartIndex,
              };
              // Cache the result
              cacheRef.current.set(cacheKey, result);
            } else if (event.type === 'error') {
              setError(new Error(event.error_message || 'Unknown error'));
            }
          },
          onComplete: () => {
            setIsLoading(false);
          },
          onError: (err) => {
            setError(err);
            setIsLoading(false);
          },
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setIsLoading(false);
      }

      return result;
    },
    []
  );

  const explainWords = useCallback(
    async (requests: WordsExplanationRequest[]): Promise<WordExplanationResult[]> => {
      setIsLoading(true);
      setError(null);

      const results: WordExplanationResult[] = [];

      try {
        await ApiService.explainWords({
          textSegments: requests,
          onEvent: (event: WordsExplanationResponse) => {
            if (event.word_info) {
              const result: WordExplanationResult = {
                word: event.word_info.word,
                meaning: event.word_info.meaning,
                examples: event.word_info.examples || [],
                textStartIndex: event.word_info.textStartIndex,
              };
              results.push(result);
              // Cache each result
              const cacheKey = `${result.textStartIndex}-${result.word}`;
              cacheRef.current.set(cacheKey, result);
            } else if (event.type === 'error') {
              setError(new Error(event.error_message || 'Unknown error'));
            }
          },
          onComplete: () => {
            setIsLoading(false);
          },
          onError: (err) => {
            setError(err instanceof Error ? err : new Error('Unknown error'));
            setIsLoading(false);
          },
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setIsLoading(false);
      }

      return results;
    },
    []
  );

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  return {
    isLoading,
    error,
    explainWord,
    explainWords,
    cache: cacheRef.current,
    clearCache,
  };
}

