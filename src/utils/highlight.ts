/**
 * Highlight utility functions for range highlighting, CSS preservation, and overlap detection
 */

import { getRangeCSSProperties, applyCSSProperties, preserveTextNodeStyles } from './dom';

/**
 * Check if a range overlaps with any existing text highlights
 */
export function hasOverlap(range: Range, excludeClass?: string): boolean {
  // Get all existing text highlight elements
  const existingTextHighlights = document.querySelectorAll('.vocab-text-highlight');

  for (const highlight of existingTextHighlights) {
    if (excludeClass && highlight.classList.contains(excludeClass)) {
      continue;
    }

    // Create a range for the existing highlight
    const highlightRange = document.createRange();
    try {
      highlightRange.selectNodeContents(highlight);

      // Check if ranges intersect
      // Ranges overlap if: (start1 < end2) AND (start2 < end1)
      const rangesIntersect =
        range.compareBoundaryPoints(Range.START_TO_END, highlightRange) > 0 &&
        range.compareBoundaryPoints(Range.END_TO_START, highlightRange) < 0;

      if (rangesIntersect) {
        return true; // Overlap detected
      }
    } catch (error) {
      console.warn('[Highlight Utils] Error checking text highlight overlap:', error);
    }
  }

  return false; // No overlap
}

/**
 * Highlight a range with a styled span
 */
export function highlightRange(
  range: Range,
  word: string,
  className: string = 'vocab-word-highlight',
  highlightId?: string
): HTMLElement {
  const normalizedWord = word.toLowerCase();

  // CRITICAL: Capture CSS properties BEFORE wrapping to preserve them
  const cssProperties = getRangeCSSProperties(range);

  // Create highlight wrapper
  const highlight = document.createElement('span');
  highlight.className = className;
  highlight.setAttribute('data-word', normalizedWord);
  if (highlightId) {
    highlight.setAttribute('data-highlight-id', highlightId);
  }

  // Ensure the highlight span doesn't interfere with child formatting
  highlight.style.setProperty('display', 'inline', 'important');
  highlight.style.setProperty('position', 'relative', 'important');

  // Try surroundContents first - this works when the range doesn't cross element boundaries
  // If it fails or might break formatting, use extractContents which preserves DOM structure
  try {
    // Check if range might contain formatting elements by checking the HTML
    const rangeClone = range.cloneContents();
    const hasFormattingElements = rangeClone.querySelector('b, strong, em, i, u, span, font, h1, h2, h3, h4, h5, h6');

    if (hasFormattingElements) {
      // Range contains formatting elements - use extractContents to preserve structure
      const extractedContents = range.extractContents();
      highlight.appendChild(extractedContents);
      range.insertNode(highlight);
    } else {
      // No formatting elements - try surroundContents
      range.surroundContents(highlight);
    }
  } catch (error) {
    // surroundContents failed - use extractContents which preserves DOM structure
    console.warn('[Highlight Utils] surroundContents failed, using extractContents:', error);
    const extractedContents = range.extractContents();
    highlight.appendChild(extractedContents);
    range.insertNode(highlight);
  }

  // CRITICAL: After wrapping, preserve CSS properties to prevent font size/style changes
  preserveTextNodeStyles(highlight, cssProperties);

  return highlight;
}

/**
 * Remove a highlight element and restore original text
 */
export function removeHighlight(highlight: HTMLElement): void {
  const parent = highlight.parentNode;
  if (!parent) return;

  // Remove any buttons first
  const buttons = highlight.querySelectorAll('.vocab-word-remove-btn, .vocab-word-remove-explained-btn');
  buttons.forEach((btn) => btn.remove());

  // Move all child nodes back to parent
  while (highlight.firstChild) {
    parent.insertBefore(highlight.firstChild, highlight);
  }

  // Remove the empty highlight span
  highlight.remove();

  // Normalize the parent to merge adjacent text nodes
  parent.normalize();
}

/**
 * Get all highlights for a word
 */
export function getHighlightsForWord(word: string, className: string = 'vocab-word-highlight'): HTMLElement[] {
  const normalizedWord = word.toLowerCase();
  const highlights = document.querySelectorAll<HTMLElement>(`.${className}[data-word="${normalizedWord}"]`);
  return Array.from(highlights);
}

/**
 * Check if element is a highlight
 */
export function isHighlight(element: Element | null): boolean {
  if (!element) return false;
  return (
    element.classList.contains('vocab-word-highlight') ||
    element.classList.contains('vocab-text-highlight') ||
    element.classList.contains('vocab-word-explained')
  );
}

