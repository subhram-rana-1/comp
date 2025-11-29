/**
 * React hook for WordSelector
 */

import { useEffect, useRef } from 'react';
import { wordSelector, WordSelector } from './WordSelector';

export function useWordSelector() {
  const selectorRef = useRef<WordSelector>(wordSelector);

  useEffect(() => {
    const selector = selectorRef.current;

    // Initialize on mount
    selector.init();

    // Cleanup on unmount
    return () => {
      selector.disable();
      selector.clearAll();
    };
  }, []);

  return selectorRef.current;
}

