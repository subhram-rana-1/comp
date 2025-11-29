/**
 * React hook for TextSelector
 */

import { useEffect, useRef } from 'react';
import { textSelector, TextSelector } from './TextSelector';

export function useTextSelector() {
  const selectorRef = useRef<TextSelector>(textSelector);

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

