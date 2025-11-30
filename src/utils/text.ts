/**
 * Text utility functions for normalization, key generation, and context extraction
 */

/**
 * Normalize text (lowercase, trim)
 */
export function normalizeText(text: string): string {
  return text.toLowerCase().trim();
}

/**
 * Get a unique key for the text (normalized)
 */
export function getTextKey(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Generate contextual textKey based on current content context
 */
export function getContextualTextKey(text: string, activeTabId?: string | null): string {
  const normalizedText = getTextKey(text);

  // Check if we're in custom content context
  if (activeTabId) {
    // Generate contextual textKey for custom content
    const contextualTextKey = `custom-${activeTabId}-${normalizedText}`;
    return contextualTextKey;
  }

  // Default to main page textKey
  return normalizedText;
}

/**
 * Calculate text position in document (approximate position in plain text)
 */
export function calculateTextPosition(range: Range): {
  textStartIndex: number;
  textLength: number;
  text: string;
} {
  const text = range.toString();
  const textLength = text.length;

  // Get the full text content of the body up to the start of the range
  const bodyText = document.body.innerText || document.body.textContent || '';

  // Find the approximate position by searching for the text in the body
  const textStartIndex = bodyText.indexOf(text);

  return {
    textStartIndex: textStartIndex >= 0 ? textStartIndex : 0,
    textLength: textLength,
    text: text,
  };
}

/**
 * Check if text contains at least minimum words
 */
export function hasMinimumWords(text: string, minWords: number = 3): boolean {
  const wordCount = text.split(/\s+/).filter((word) => word.length > 0).length;
  return wordCount >= minWords;
}

/**
 * Check if text is a single word (no spaces)
 */
export function isSingleWord(text: string): boolean {
  return !/\s/.test(text);
}

/**
 * Extract words from text
 */
export function extractWords(text: string): string[] {
  return text.match(/\b\w+\b/g) || [];
}

/**
 * Get word count
 */
export function getWordCount(text: string): number {
  return extractWords(text).length;
}

