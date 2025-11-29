/**
 * DOM utility functions for safe queries and selection validation
 */

/**
 * Safely query element by data attribute
 * Avoids CSS selector syntax errors when attribute value contains quotes or special characters
 */
export function safeQueryByDataAttribute(
  selector: string,
  attributeName: string,
  attributeValue: string,
  root: Document | Element = document
): Element | null {
  if (!attributeValue) return null;

  // Query all matching elements and filter by exact attribute value
  const allElements = root.querySelectorAll(selector);
  for (const element of allElements) {
    if (element.getAttribute(attributeName) === attributeValue) {
      return element;
    }
  }
  return null;
}

/**
 * Safely query element by data-text-key attribute (convenience wrapper)
 */
export function safeQueryByDataTextKey(
  selector: string,
  textKey: string,
  root: Document | Element = document
): Element | null {
  return safeQueryByDataAttribute(selector, 'data-text-key', textKey, root);
}

/**
 * Check if an element or range is within allowed selection areas
 * Allowed: Main website content and .vocab-custom-content-editor-content
 * Disallowed: All other extension UI components
 */
export function isSelectionAllowed(elementOrRange: Element | Range | Node): boolean {
  // Get the container element from element or range
  let containerElement: Element | null = null;

  if (elementOrRange instanceof Range) {
    // For range, check the common ancestor container
    containerElement = elementOrRange.commonAncestorContainer as Element;
    // If it's a text node, get its parent
    if (containerElement && containerElement.nodeType === Node.TEXT_NODE) {
      containerElement = containerElement.parentElement;
    }
  } else if (elementOrRange instanceof Element) {
    containerElement = elementOrRange;
  } else if (elementOrRange instanceof Node) {
    // For other node types (like text nodes), get parent element
    if (elementOrRange.nodeType === Node.TEXT_NODE) {
      containerElement = elementOrRange.parentElement;
    } else if (elementOrRange.nodeType === Node.ELEMENT_NODE) {
      containerElement = elementOrRange as Element;
    }
  }

  // Ensure we have an Element (not a Text node or null)
  if (!containerElement || !(containerElement instanceof Element)) {
    return false;
  }

  // First check: If inside .vocab-custom-content-editor-content, allow it
  const editorContent = containerElement.closest('.vocab-custom-content-editor-content');
  if (editorContent) {
    return true;
  }

  // Second check: If inside any extension UI component, disallow it
  const extensionUISelectors = [
    '.vocab-helper-panel',
    '.vocab-topics-modal',
    '.vocab-topics-modal-overlay',
    '.vocab-chat-dialog',
    '.vocab-custom-content-modal',
    '.vocab-custom-content-info-banner',
    '.vocab-word-popup',
    '.vocab-notification',
  ];

  // Check if the container is inside any extension UI component
  for (const selector of extensionUISelectors) {
    if (containerElement.closest(selector)) {
      return false;
    }
  }

  // If not in extension UI and not in editor content, it's main website content - allow it
  return true;
}

/**
 * Get full document text for position calculation
 */
export function getDocumentText(): string {
  return document.body.innerText || document.body.textContent || '';
}

/**
 * Find all positions of a word in the document
 */
export function findWordPositionsInDocument(word: string): number[] {
  const docText = getDocumentText();
  const positions: number[] = [];
  const wordLower = word.toLowerCase();
  const docTextLower = docText.toLowerCase();

  // Find all occurrences
  let index = 0;
  while ((index = docTextLower.indexOf(wordLower, index)) !== -1) {
    // Check if it's a whole word (not part of another word)
    const before = index > 0 ? docText[index - 1] : ' ';
    const after = index + wordLower.length < docText.length ? docText[index + wordLower.length] : ' ';

    // Check if surrounded by non-word characters
    if (!/\w/.test(before) && !/\w/.test(after)) {
      positions.push(index);
    }
    index += wordLower.length;
  }

  return positions;
}

/**
 * Extract context around a word (15 words before and after)
 */
export function extractWordContext(
  docText: string,
  wordIndex: number,
  wordLength: number
): { text: string; textStartIndex: number; wordIndexInText: number } {
  // Split document into words (including whitespace for position tracking)
  const beforeText = docText.substring(0, wordIndex);
  const afterText = docText.substring(wordIndex + wordLength);

  // Get words before (up to 15)
  const wordsBeforeMatch = beforeText.match(/\S+/g) || [];
  const wordsBefore = wordsBeforeMatch.slice(-15);

  // Get words after (up to 15)
  const wordsAfterMatch = afterText.match(/\S+/g) || [];
  const wordsAfter = wordsAfterMatch.slice(0, 15);

  // Calculate the actual start index in document
  let textStartIndex = wordIndex;
  if (wordsBefore.length > 0) {
    // Find where the first of our 15 words before starts in the document
    const firstWord = wordsBefore[0];
    const lastOccurrence = beforeText.lastIndexOf(firstWord);

    if (lastOccurrence !== -1) {
      textStartIndex = lastOccurrence;
    } else {
      // Fallback: use wordIndex as start
      textStartIndex = wordIndex;
    }
  }

  // Build the context text
  const contextParts: string[] = [];
  if (wordsBefore.length > 0) {
    contextParts.push(wordsBefore.join(' '));
  }
  contextParts.push(docText.substring(wordIndex, wordIndex + wordLength));
  if (wordsAfter.length > 0) {
    contextParts.push(wordsAfter.join(' '));
  }

  const text = contextParts.join(' ');
  const wordIndexInText = wordsBefore.length > 0 ? wordsBefore.join(' ').length + 1 : 0;

  return {
    text,
    textStartIndex,
    wordIndexInText,
  };
}

/**
 * Get CSS properties from a range's start container to preserve them
 */
export function getRangeCSSProperties(range: Range): Record<string, string> {
  const startContainer = range.startContainer;
  let element: Element | null = null;

  // If startContainer is a text node, get its parent element
  if (startContainer.nodeType === Node.TEXT_NODE) {
    element = startContainer.parentElement;
  } else if (startContainer.nodeType === Node.ELEMENT_NODE) {
    element = startContainer as Element;
  }

  if (!element) {
    console.warn('[DOM Utils] Could not find element for CSS properties');
    return {};
  }

  // Get computed styles
  const computedStyles = window.getComputedStyle(element);

  // Extract all font and text-related properties
  const cssProperties: Record<string, string> = {
    // Font properties
    fontSize: computedStyles.fontSize,
    fontFamily: computedStyles.fontFamily,
    fontStyle: computedStyles.fontStyle,
    fontWeight: computedStyles.fontWeight,
    fontVariant: computedStyles.fontVariant,
    fontStretch: computedStyles.fontStretch,
    lineHeight: computedStyles.lineHeight,
    letterSpacing: computedStyles.letterSpacing,
    wordSpacing: computedStyles.wordSpacing,

    // Text properties
    color: computedStyles.color,
    textDecoration: computedStyles.textDecoration,
    textDecorationLine: computedStyles.textDecorationLine,
    textDecorationColor: computedStyles.textDecorationColor,
    textDecorationStyle: computedStyles.textDecorationStyle,
    textTransform: computedStyles.textTransform,
    textShadow: computedStyles.textShadow,

    // Other important properties
    verticalAlign: computedStyles.verticalAlign,
    textAlign: computedStyles.textAlign,
    direction: computedStyles.direction,
    unicodeBidi: computedStyles.unicodeBidi,

    // Theme-related properties (if any)
    backgroundColor: computedStyles.backgroundColor,
  };

  return cssProperties;
}

/**
 * Apply CSS properties to preserve them in the highlight
 */
export function applyCSSProperties(element: HTMLElement, cssProperties: Record<string, string>): void {
  // List of critical properties that must be preserved
  const criticalProperties = [
    'fontSize',
    'fontFamily',
    'fontStyle',
    'fontWeight',
    'fontVariant',
    'fontStretch',
    'lineHeight',
    'letterSpacing',
    'wordSpacing',
    'color',
    'textDecoration',
    'textDecorationLine',
    'textDecorationColor',
    'textDecorationStyle',
    'textTransform',
    'textShadow',
    'verticalAlign',
    'direction',
  ];

  // Apply critical properties with !important
  criticalProperties.forEach((property) => {
    const value = cssProperties[property];
    if (value && value.trim() !== '' && value !== 'auto') {
      // Convert camelCase to kebab-case for CSS properties
      const cssProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
      // Apply with !important to override website CSS
      element.style.setProperty(cssProperty, value, 'important');
    }
  });
}

/**
 * Preserve CSS properties for all text nodes within an element
 */
export function preserveTextNodeStyles(
  container: HTMLElement,
  cssProperties: Record<string, string>
): void {
  // Only process direct children to avoid interfering with nested formatting elements
  const children = Array.from(container.childNodes);

  children.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      // For direct text nodes, wrap them in a span to preserve styles
      const span = document.createElement('span');
      span.style.setProperty('display', 'inline', 'important');
      // Apply all captured CSS properties to preserve the original appearance
      applyCSSProperties(span, cssProperties);
      container.insertBefore(span, child);
      span.appendChild(child);
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const element = child as Element;
      // For element nodes that are not the remove button
      if (
        !element.classList.contains('vocab-word-remove-btn') &&
        !element.classList.contains('vocab-word-remove-explained-btn')
      ) {
        // Only preserve fontSize to prevent size changes
        if (cssProperties.fontSize) {
          element.setAttribute('style', `font-size: ${cssProperties.fontSize} !important;`);
        }
        // Also preserve color if it's a text-level element
        if (
          cssProperties.color &&
          ['SPAN', 'B', 'STRONG', 'EM', 'I', 'U', 'CODE', 'MARK'].includes(element.tagName)
        ) {
          const existingStyle = element.getAttribute('style') || '';
          element.setAttribute('style', `${existingStyle} color: ${cssProperties.color} !important;`);
        }
      }
    }
  });
}

