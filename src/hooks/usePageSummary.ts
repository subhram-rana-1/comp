/**
 * Hook for page summarization API integration
 */

import { useState, useCallback, useRef } from 'react';
import { ApiService } from '../services';
import type { SummariseResponse } from '../types';

export interface PageSummaryResult {
  summary: string;
  possibleQuestions: string[];
}

export interface UsePageSummaryReturn {
  isLoading: boolean;
  error: Error | null;
  summary: PageSummaryResult | null;
  summarizePage: (text: string) => Promise<PageSummaryResult | null>;
  clearSummary: () => void;
}

/**
 * Hook for page summarization with background processing and caching
 */
export function usePageSummary(): UsePageSummaryReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [summary, setSummary] = useState<PageSummaryResult | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const summarizePage = useCallback(
    async (text: string): Promise<PageSummaryResult | null> => {
      // Abort any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      setIsLoading(true);
      setError(null);

      let result: PageSummaryResult | null = null;
      let accumulatedSummary = '';
      const possibleQuestions: string[] = [];

      try {
        const abortFn = await ApiService.summarise({
          text: text,
          onEvent: (event: SummariseResponse) => {
            if (event.type === 'chunk' && event.accumulated) {
              accumulatedSummary = event.accumulated;
            } else if (event.type === 'complete' && event.summary) {
              result = {
                summary: event.summary,
                possibleQuestions: event.possibleQuestions || [],
              };
              setSummary(result);
            } else if (event.possibleQuestions) {
              possibleQuestions.push(...event.possibleQuestions);
            } else if (event.type === 'error') {
              setError(new Error(event.error_message || 'Unknown error'));
            }
          },
          onComplete: () => {
            setIsLoading(false);
            if (result) {
              setSummary(result);
            }
          },
          onError: (err) => {
            setError(err instanceof Error ? err : new Error('Unknown error'));
            setIsLoading(false);
          },
        });

        abortControllerRef.current = new AbortController();
        // Store abort function for cleanup
        (abortControllerRef.current as any).abortFn = abortFn;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setIsLoading(false);
      }

      return result;
    },
    []
  );

  const clearSummary = useCallback(() => {
    if (abortControllerRef.current) {
      const abortFn = (abortControllerRef.current as any).abortFn;
      if (abortFn) {
        abortFn();
      }
      abortControllerRef.current.abort();
    }
    setSummary(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    isLoading,
    error,
    summary,
    summarizePage,
    clearSummary,
  };
}

