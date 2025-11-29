/**
 * Hook for text simplification API integration
 */

import { useState, useCallback } from 'react';
import { ApiService } from '../services';
import type { SimplifyRequest, SimplifyResponse } from '../types';

export interface SimplifiedTextResult {
  textStartIndex: number;
  textLength: number;
  text: string;
  simplifiedText: string;
  previousSimplifiedTexts: string[];
  shouldAllowSimplifyMore?: boolean;
  possibleQuestions?: string[];
}

export interface UseTextSimplificationReturn {
  isLoading: boolean;
  error: Error | null;
  simplifyText: (
    request: SimplifyRequest,
    onProgress?: (accumulated: string) => void
  ) => Promise<SimplifiedTextResult | null>;
  simplifyTexts: (
    requests: SimplifyRequest[],
    onProgress?: (index: number, accumulated: string) => void
  ) => Promise<SimplifiedTextResult[]>;
}

/**
 * Hook for text simplification with streaming support
 */
export function useTextSimplification(): UseTextSimplificationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const simplifyText = useCallback(
    async (
      request: SimplifyRequest,
      onProgress?: (accumulated: string) => void
    ): Promise<SimplifiedTextResult | null> => {
      setIsLoading(true);
      setError(null);

      let result: SimplifiedTextResult | null = null;
      let accumulatedText = '';

      try {
        await ApiService.simplify({
          textSegments: [request],
          onEvent: (event: SimplifyResponse) => {
            if (event.type === 'chunk' && event.accumulatedSimplifiedText) {
              accumulatedText = event.accumulatedSimplifiedText;
              onProgress?.(accumulatedText);
            } else if (event.type === 'complete' && event.simplifiedText) {
              result = {
                textStartIndex: event.textStartIndex,
                textLength: event.textLength,
                text: event.text,
                simplifiedText: event.simplifiedText,
                previousSimplifiedTexts: event.previousSimplifiedTexts || [],
                shouldAllowSimplifyMore: event.shouldAllowSimplifyMore ?? true,
                possibleQuestions: event.possibleQuestions || [],
              };
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

      return result;
    },
    []
  );

  const simplifyTexts = useCallback(
    async (
      requests: SimplifyRequest[],
      onProgress?: (index: number, accumulated: string) => void
    ): Promise<SimplifiedTextResult[]> => {
      setIsLoading(true);
      setError(null);

      const results: SimplifiedTextResult[] = [];
      const accumulatedTexts: string[] = new Array(requests.length).fill('');

      try {
        await ApiService.simplify({
          textSegments: requests,
          onEvent: (event: SimplifyResponse) => {
            // Find which segment this event belongs to
            const segmentIndex = requests.findIndex(
              (req) =>
                req.textStartIndex === event.textStartIndex &&
                req.textLength === event.textLength
            );

            if (segmentIndex === -1) return;

            if (event.type === 'chunk' && event.accumulatedSimplifiedText) {
              accumulatedTexts[segmentIndex] = event.accumulatedSimplifiedText;
              onProgress?.(segmentIndex, event.accumulatedSimplifiedText);
            } else if (event.type === 'complete' && event.simplifiedText) {
              results[segmentIndex] = {
                textStartIndex: event.textStartIndex,
                textLength: event.textLength,
                text: event.text,
                simplifiedText: event.simplifiedText,
                previousSimplifiedTexts: event.previousSimplifiedTexts || [],
                shouldAllowSimplifyMore: event.shouldAllowSimplifyMore ?? true,
                possibleQuestions: event.possibleQuestions || [],
              };
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

  return {
    isLoading,
    error,
    simplifyText,
    simplifyTexts,
  };
}

