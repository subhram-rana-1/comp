import ApiService from '../core/services/ApiService.js';
import SimplifyService from '../core/services/SimplifyService.js';
import SummariseService from '../core/services/SummariseService.js';
import WordExplanationService from '../core/services/WordExplanationService.js';
import ApiConfig from '../core/config/apiConfig.js';

export default defineContentScript({
  matches: ['<all_urls>'],
  
  async main() {
    // Add global debugging functions immediately
    window.debugExtension = {
      checkTopicsContent: () => {
        console.log('[DEBUG] Checking topics content...');
        // Try to find ButtonPanel in different ways
        if (window.ButtonPanel && window.ButtonPanel.topicsModal && window.ButtonPanel.topicsModal.customContentModal) {
          const topics = window.ButtonPanel.topicsModal.customContentModal.topicContents;
          console.log('[DEBUG] Topics content:', topics);
          console.log('[DEBUG] Topics count:', topics.length);
          return topics;
        } else {
          console.log('[DEBUG] ButtonPanel not found, trying alternative...');
          // Try to find the content directly in DOM or other ways
          return null;
        }
      },
      
      showAllIndicators: () => {
        console.log('[DEBUG] Forcing all indicators to be visible...');
        const indicators = ['pdf-content-indicator', 'image-content-indicator', 'topics-content-indicator', 'text-content-indicator', 'import-content-indicator'];
        indicators.forEach(id => {
          const element = document.getElementById(id);
          if (element) {
            element.style.display = 'block';
            element.style.visibility = 'visible';
            element.style.opacity = '1';
            element.style.backgroundColor = '#16a34a';
            element.style.border = '1px solid white';
            console.log(`[DEBUG] Made ${id} visible`);
          } else {
            console.log(`[DEBUG] ${id} not found`);
          }
        });
      },
      
      checkStorage: () => {
        console.log('[DEBUG] Checking all possible storage locations...');
        // Check if we can find any content in the page
        const allElements = document.querySelectorAll('*');
        console.log('[DEBUG] Total elements on page:', allElements.length);
        
        // Look for any elements that might contain content
        const contentElements = document.querySelectorAll('[class*="content"], [id*="content"], [class*="topic"], [id*="topic"]');
        console.log('[DEBUG] Content-related elements found:', contentElements.length);
        contentElements.forEach((el, i) => {
          if (i < 10) { // Only log first 10
            console.log(`[DEBUG] Element ${i}:`, el.className, el.id);
          }
        });
      }
    };
    
    console.log('[DEBUG] Global debug functions added to window.debugExtension');
    
    // Add immediate debugging functions that work right away
    window.debugTopics = () => {
      console.log('[DEBUG] === IMMEDIATE TOPICS DEBUG ===');
      
      // Check if we can find any topics-related elements
      const topicsElements = document.querySelectorAll('[class*="topic"], [id*="topic"], [class*="content"]');
      console.log('[DEBUG] Found topics-related elements:', topicsElements.length);
      
      // Check if vertical button group exists
      const buttonGroup = document.getElementById('vocab-vertical-button-group');
      console.log('[DEBUG] Button group exists:', !!buttonGroup);
      
      // Check if topics button exists
      const topicsButton = document.getElementById('vocab-topics-btn');
      console.log('[DEBUG] Topics button exists:', !!topicsButton);
      
      // Check if topics indicator exists
      const topicsIndicator = document.getElementById('topics-content-indicator');
      console.log('[DEBUG] Topics indicator exists:', !!topicsIndicator);
      
      if (topicsIndicator) {
        console.log('[DEBUG] Topics indicator current styles:', {
          display: topicsIndicator.style.display,
          visibility: topicsIndicator.style.visibility,
          opacity: topicsIndicator.style.opacity,
          backgroundColor: topicsIndicator.style.backgroundColor
        });
        
        // Force it to be visible
        topicsIndicator.style.display = 'block';
        topicsIndicator.style.visibility = 'visible';
        topicsIndicator.style.opacity = '1';
        topicsIndicator.style.backgroundColor = '#16a34a';
        topicsIndicator.style.border = '1px solid white';
        topicsIndicator.style.position = 'absolute';
        topicsIndicator.style.top = '4px';
        topicsIndicator.style.right = '4px';
        topicsIndicator.style.width = '8px';
        topicsIndicator.style.height = '8px';
        topicsIndicator.style.borderRadius = '50%';
        topicsIndicator.style.zIndex = '10';
        
        console.log('[DEBUG] Topics indicator forced to be visible');
      }
      
      console.log('[DEBUG] === END IMMEDIATE TOPICS DEBUG ===');
    };
    
    // Add a simple function to check and show indicators
    window.fixGreenDots = () => {
      console.log('[DEBUG] === FIXING GREEN DOTS ===');
      
      // First, check if the vertical button group exists
      const buttonGroup = document.getElementById('vocab-vertical-button-group');
      console.log('[DEBUG] Button group found:', !!buttonGroup);
      
      if (buttonGroup) {
        console.log('[DEBUG] Button group is visible:', buttonGroup.classList.contains('visible'));
      }
      
      // Check each indicator
      const indicators = [
        { id: 'pdf-content-indicator', name: 'PDF' },
        { id: 'image-content-indicator', name: 'Image' },
        { id: 'topics-content-indicator', name: 'Topics' },
        { id: 'text-content-indicator', name: 'Text' },
        { id: 'import-content-indicator', name: 'Import Content' }
      ];
      
      indicators.forEach(indicator => {
        const element = document.getElementById(indicator.id);
        console.log(`[DEBUG] ${indicator.name} indicator:`, !!element);
        
        if (element) {
          // Force it to be visible
          element.style.display = 'block';
          element.style.visibility = 'visible';
          element.style.opacity = '1';
          element.style.backgroundColor = '#16a34a';
          element.style.border = '1px solid white';
          element.style.position = 'absolute';
          element.style.top = '6px';
          element.style.right = '6px';
          element.style.width = '8px';
          element.style.height = '8px';
          element.style.borderRadius = '50%';
          element.style.zIndex = '10';
          
          console.log(`[DEBUG] ${indicator.name} indicator forced to be visible`);
        } else {
          console.log(`[DEBUG] ${indicator.name} indicator NOT FOUND in DOM`);
        }
      });
      
      console.log('[DEBUG] === END FIXING GREEN DOTS ===');
    };
    
    // Add function to check topics content specifically
    window.checkTopicsContent = () => {
      console.log('[DEBUG] === CHECKING TOPICS CONTENT ===');
      
      // Try to find ButtonPanel
      if (window.ButtonPanel && window.ButtonPanel.topicsModal && window.ButtonPanel.topicsModal.customContentModal) {
        const topics = window.ButtonPanel.topicsModal.customContentModal.topicContents;
        console.log('[DEBUG] Topics content found:', topics);
        console.log('[DEBUG] Topics count:', topics.length);
        
        if (topics.length > 0) {
          console.log('[DEBUG] Topics content details:', topics.map(t => ({
            tabId: t.tabId,
            tabName: t.tabName,
            contentType: t.contentType,
            contentLength: t.content ? t.content.length : 0
          })));
          
          // Force topics indicator to be visible
          const topicsIndicator = document.getElementById('topics-content-indicator');
          if (topicsIndicator) {
            topicsIndicator.style.display = 'block';
            topicsIndicator.style.visibility = 'visible';
            topicsIndicator.style.opacity = '1';
            topicsIndicator.style.backgroundColor = '#16a34a';
            console.log('[DEBUG] Topics indicator forced to be visible');
          } else {
            console.log('[DEBUG] Topics indicator element not found');
          }
        } else {
          console.log('[DEBUG] No topics content found');
        }
      } else {
        console.log('[DEBUG] ButtonPanel not accessible');
      }
      
      console.log('[DEBUG] === END CHECKING TOPICS CONTENT ===');
    };
    
    // Add function to debug import-content indicator issue
    window.debugImportContentIndicator = () => {
      console.log('[DEBUG] === DEBUGGING IMPORT-CONTENT INDICATOR ===');
      
      if (window.ButtonPanel && window.ButtonPanel.topicsModal && window.ButtonPanel.topicsModal.customContentModal) {
        const modal = window.ButtonPanel.topicsModal.customContentModal;
        
        console.log('[DEBUG] Content counts:');
        console.log('- Topics:', modal.topicContents.length);
        console.log('- Images:', modal.imageContents.length);
        console.log('- PDFs:', modal.pdfContents.length);
        console.log('- Texts:', modal.textContents.length);
        
        // Check if any content exists
        const hasAnyContent = modal.topicContents.length > 0 || 
                             modal.imageContents.length > 0 || 
                             modal.pdfContents.length > 0 || 
                             modal.textContents.length > 0;
        
        console.log('[DEBUG] hasAnyContent:', hasAnyContent);
        
        // Check import-content button and indicator
        const importButton = document.getElementById('import-content');
        const importIndicator = document.getElementById('import-content-indicator');
        
        console.log('[DEBUG] import-content button element:', importButton);
        console.log('[DEBUG] import-content indicator element:', importIndicator);
        
        // If button exists but no indicator, create one
        if (importButton && !importIndicator) {
          console.log('[DEBUG] Creating missing import-content indicator...');
          const indicator = document.createElement('div');
          indicator.className = 'vocab-content-indicator';
          indicator.id = 'import-content-indicator';
          importButton.appendChild(indicator);
          console.log('[DEBUG] Import-content indicator created!');
        }
        
        if (importIndicator) {
          console.log('[DEBUG] Current indicator styles:');
          console.log('- display:', importIndicator.style.display);
          console.log('- visibility:', importIndicator.style.visibility);
          console.log('- opacity:', importIndicator.style.opacity);
        }
        
        // Force update
        console.log('[DEBUG] Forcing updateContentIndicators...');
        window.ButtonPanel.updateContentIndicators();
        
      } else {
        console.log('[DEBUG] ButtonPanel or topicsModal not found');
      }
      
      console.log('[DEBUG] === END DEBUGGING ===');
    };
    
    // Add function to force fix import-content indicator
    window.fixImportContentIndicator = () => {
      console.log('[FIX] === FIXING IMPORT-CONTENT INDICATOR ===');
      
      const importButton = document.getElementById('import-content');
      let importIndicator = document.getElementById('import-content-indicator');
      
      if (!importButton) {
        console.log('[FIX] Import-content button not found!');
        return;
      }
      
      // Create indicator if it doesn't exist
      if (!importIndicator) {
        console.log('[FIX] Creating missing import-content indicator...');
        importIndicator = document.createElement('div');
        importIndicator.className = 'vocab-content-indicator';
        importIndicator.id = 'import-content-indicator';
        importButton.appendChild(importIndicator);
        console.log('[FIX] Import-content indicator created!');
      }
      
      // Force it to be visible
      importIndicator.style.cssText = `
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        background-color: #16a34a !important;
        border: 1px solid white !important;
        position: absolute !important;
        top: 6px !important;
        right: 6px !important;
        width: 8px !important;
        height: 8px !important;
        border-radius: 50% !important;
        z-index: 10 !important;
      `;
      
      console.log('[FIX] Import-content indicator should now be visible!');
      console.log('[FIX] === END FIXING ===');
    };
    
    // Global storage key for extension state
    const GLOBAL_STORAGE_KEY = 'is_extension_globally_enabled';
    
    // Page text content variable - initially null
    let pageTextContent = null;
    
    // Make pageTextContent accessible globally for ChatDialog
    window.pageTextContent = pageTextContent;
    
    /**
     * Fetch page text content in a separate thread
     */
    async function fetchPageTextContent() {
      try {
        console.log('[Content Script] Starting to fetch page text content...');
        
        // Use a web worker or setTimeout to run in a separate thread
        // For simplicity, we'll use setTimeout with 0 delay to run after current execution
        await new Promise(resolve => setTimeout(resolve, 0));
        
        // Get all text content from the page
        const pageText = document.body.innerText || document.body.textContent || '';
        
        // Store as JSON
        pageTextContent = JSON.stringify({
          text: pageText,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          title: document.title
        });
        
        // Update global reference
        window.pageTextContent = pageTextContent;
        
        console.log('[Content Script] Page text content fetched and stored. Length:', pageText.length);
        console.log('[Content Script] pageTextContent variable:', pageTextContent);
        
        // Check if extension is enabled before showing the button
        const GLOBAL_STORAGE_KEY = 'is_extension_globally_enabled';
        const result = await chrome.storage.local.get([GLOBAL_STORAGE_KEY]);
        const isEnabled = result[GLOBAL_STORAGE_KEY] ?? true; // Default to true if not set
        
        // Only show the button if extension is enabled
        if (isEnabled) {
          showAskAboutPageButton();
        } else {
          console.log('[Content Script] Extension is disabled, not showing ask-about-page button');
        }
      } catch (error) {
        console.error('[Content Script] Error fetching page text content:', error);
      }
    }
    
    /**
     * Show ask-about-page button with animation from the right
     */
    function showAskAboutPageButton() {
      const button = document.getElementById('vocab-ask-about-page-btn');
      if (!button) {
        console.warn('[Content Script] Ask-about-page button not found when trying to show it');
        return;
      }
      
      // Remove hidden class and add visible class for animation
      button.classList.remove('vocab-ask-about-page-btn-hidden');
      button.classList.add('vocab-ask-about-page-btn-visible');
      
      console.log('[Content Script] Ask-about-page button shown with animation');
    }
    
    /**
     * Hide ask-about-page button
     */
    function hideAskAboutPageButton() {
      const button = document.getElementById('vocab-ask-about-page-btn');
      if (!button) {
        return;
      }
      
      button.classList.remove('vocab-ask-about-page-btn-visible');
      button.classList.add('vocab-ask-about-page-btn-hidden');
    }
    
    /**
     * Create top-right ask-about-page button
     */
    function createAskAboutPageButton() {
      // Check if button already exists
      if (document.getElementById('vocab-ask-about-page-btn')) {
        return;
      }
      
      // Create button element
      const button = document.createElement('button');
      button.id = 'vocab-ask-about-page-btn';
      button.className = 'vocab-ask-about-page-btn vocab-ask-about-page-btn-hidden';
      button.setAttribute('aria-label', 'Ask anything about this page');
      
      // Use white wireframe book icon
      button.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 19.5C4 18.837 4.526 18 5.5 18H11M20 19.5C20 18.837 19.474 18 18.5 18H13" stroke="white" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12 18V6M12 6C12 6 10 4 6.5 4C4.5 4 4 5 4 6V18C4 18 4.5 18 6.5 18C10 18 12 18 12 18M12 6C12 6 14 4 17.5 4C19.5 4 20 5 20 6V18C20 18 19.5 18 17.5 18C14 18 12 18 12 18" stroke="white" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      
      // Append to body
      document.body.appendChild(button);
      
      // Attach tooltip listeners
      attachAskAboutPageTooltipListeners(button);
      
      // Attach click handler to open chat dialog
      attachAskAboutPageClickHandler(button);
      
      console.log('[Content Script] Ask-about-page button created (hidden initially)');
    }
    
    /**
     * Attach click handler to open chat dialog
     */
    function attachAskAboutPageClickHandler(button) {
      if (!button) {
        return;
      }
      
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Check if dialog is already open for page-general context
        // Check for both 'page-general' and 'page-general-generic' (the transformed key)
        const isPageGeneralOpen = ChatDialog.isOpen && ChatDialog.currentTextKey && 
          (ChatDialog.currentTextKey === 'page-general' || ChatDialog.currentTextKey.startsWith('page-general'));
        
        if (isPageGeneralOpen) {
          // Toggle off - close the dialog
          console.log('[AskAboutPage] Dialog already open for page-general, closing it. currentTextKey:', ChatDialog.currentTextKey);
          ChatDialog.close();
          return;
        }
        
        // Open chat dialog for general page chat
        // Use 'page-general' as textKey for general page chat
        // Use pageTextContent if available, otherwise fallback to current page text
        let pageText = '';
        if (pageTextContent) {
          try {
            const contentData = JSON.parse(pageTextContent);
            pageText = contentData.text || '';
          } catch (e) {
            console.warn('[AskAboutPage] Error parsing pageTextContent, using fallback');
            pageText = document.body.innerText || document.body.textContent || '';
          }
        } else {
          pageText = document.body.innerText || document.body.textContent || '';
        }
        ChatDialog.open(pageText.substring(0, 1000), 'page-general', 'ask', null, 'general');
      });
    }
    
    /**
     * Attach tooltip event listeners to ask-about-page button
     * Similar to ButtonPanel.attachTooltipListeners
     */
    function attachAskAboutPageTooltipListeners(button) {
      if (!button) {
        return;
      }
      
      let tooltip = null;
      
      button.addEventListener('mouseenter', () => {
        // Clean up any existing tooltips first
        removeAskAboutPageTooltip();
        
        // Create tooltip
        tooltip = createAskAboutPageTooltip('Ask anything about this page');
        document.body.appendChild(tooltip);
        
        // Position tooltip at the bottom left of the button (to the left of the button)
        const buttonRect = button.getBoundingClientRect();
        tooltip.style.position = 'fixed';
        // Position below the button, aligned to the left side (tooltip's right edge aligns with button's left edge)
        // Position it so the arrow tip touches the button's bottom edge (6px arrow height)
        tooltip.style.top = buttonRect.bottom + 'px'; // Arrow tip will be at buttonRect.bottom
        tooltip.style.right = (window.innerWidth - buttonRect.left) + 'px';
        tooltip.style.left = 'auto';
        tooltip.style.zIndex = '9999999';
        
        // Trigger animation
        setTimeout(() => {
          tooltip.classList.add('visible');
        }, 10);
      });
      
      button.addEventListener('mouseleave', () => {
        if (tooltip) {
          tooltip.classList.remove('visible');
          setTimeout(() => {
            if (tooltip && tooltip.parentNode) {
              tooltip.remove();
            }
            tooltip = null;
          }, 200);
        }
      });
      
      button.addEventListener('click', () => {
        if (tooltip) {
          tooltip.classList.remove('visible');
          setTimeout(() => {
            if (tooltip && tooltip.parentNode) {
              tooltip.remove();
            }
            tooltip = null;
          }, 200);
        }
      });
    }
    
    /**
     * Create tooltip element for ask-about-page button
     * Similar to ButtonPanel.createTooltip
     */
    function createAskAboutPageTooltip(message) {
      const tooltip = document.createElement('div');
      tooltip.className = 'vocab-ask-about-page-tooltip';
      tooltip.textContent = message;
      return tooltip;
    }
    
    /**
     * Remove ask-about-page tooltip
     */
    function removeAskAboutPageTooltip() {
      const tooltips = document.querySelectorAll('.vocab-ask-about-page-tooltip');
      tooltips.forEach(tooltip => {
        tooltip.classList.remove('visible');
        setTimeout(() => {
          if (tooltip.parentNode) {
            tooltip.remove();
          }
        }, 200);
      });
    }
    
    console.log('[Content Script] Initializing with global storage key:', GLOBAL_STORAGE_KEY);
    
    // Initialize the button panel when content script loads
    await ButtonPanel.init();
    
    // Initialize the word selector functionality (will check state internally)
    await WordSelector.init();
    
    // Initialize the text selector functionality (will check state internally)
    await TextSelector.init();
    
    // Initialize the chat dialog
    ChatDialog.init();
    
    // Create top-right ask-about-page button (initially hidden)
    createAskAboutPageButton();
    
    // Wait for page to load completely, then fetch page text content in a separate thread
    if (document.readyState === 'complete') {
      // Page already loaded, fetch content immediately
      fetchPageTextContent();
    } else {
      // Wait for page to load
      window.addEventListener('load', () => {
        // Use setTimeout to run in a separate thread after page load
        setTimeout(() => {
          fetchPageTextContent();
        }, 100); // Small delay to ensure page is fully rendered
      });
    }
    
    // ===================================
    // Banner Module - Shows welcome banner when extension is enabled
    // ===================================
    const BannerModule = {
      STORAGE_KEY: 'explain_ai_banner_dismissed',
      bannerContainer: null,
      
      /**
       * Check if banner should be shown
       * @returns {Promise<boolean>} Whether to show the banner
       */
      async shouldShowBanner() {
        try {
          // Check if extension is enabled
          const result = await chrome.storage.local.get([GLOBAL_STORAGE_KEY]);
          const isEnabled = result[GLOBAL_STORAGE_KEY] ?? true;
          
          if (!isEnabled) {
            return false;
          }
          
          // Check if user has dismissed the banner
          const dismissedResult = await chrome.storage.local.get([this.STORAGE_KEY]);
          const isDismissed = dismissedResult[this.STORAGE_KEY] ?? false;
          
          return !isDismissed;
        } catch (error) {
          console.error('[Banner] Error checking banner state:', error);
          return false;
        }
      },
      
      /**
       * Mark banner as dismissed
       */
      async dismissBanner() {
        try {
          await chrome.storage.local.set({ [this.STORAGE_KEY]: true });
          console.log('[Banner] Banner dismissed');
        } catch (error) {
          console.error('[Banner] Error dismissing banner:', error);
        }
      },
      
      /**
       * Create the banner HTML structure
       */
      createBanner() {
        if (this.bannerContainer) {
          return; // Already created
        }
        
        // Create main container
        this.bannerContainer = document.createElement('div');
        this.bannerContainer.id = 'explain-ai-banner';
        this.bannerContainer.className = 'explain-ai-banner';
        
        // Create header with close button (cross icon at top right)
        const header = document.createElement('div');
        header.className = 'banner-header';
        
        const closeButton = document.createElement('button');
        closeButton.className = 'banner-close';
        closeButton.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4L4 12M4 4L12 12" stroke="#9527F5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;
        closeButton.setAttribute('aria-label', 'Close banner');
        closeButton.addEventListener('click', () => this.hideBanner());
        
        header.appendChild(closeButton);
        
        // Create heading container (below cross icon, vertically centered)
        const headingContainer = document.createElement('div');
        headingContainer.className = 'banner-heading-container';
        
        const heading = document.createElement('h2');
        heading.className = 'banner-heading';
        heading.textContent = 'Explain AI';
        
        // Add magic-meaning icon SVG to the right of the heading
        const iconWrapper = document.createElement('span');
        iconWrapper.className = 'banner-heading-icon';
        iconWrapper.innerHTML = `
          <svg width="24" height="24" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 0L17 8L25 11L17 14L14 22L11 14L3 11L11 8L14 0Z" fill="#9527F5"/>
            <path d="M22 16L23.5 20L27.5 21.5L23.5 23L22 27L20.5 23L16.5 21.5L20.5 20L22 16Z" fill="#9527F5"/>
            <path d="M8 21L9.5 24.5L13 26L9.5 27.5L8 31L6.5 27.5L3 26L6.5 24.5L8 21Z" fill="#9527F5"/>
          </svg>
        `;
        
        heading.appendChild(iconWrapper);
        headingContainer.appendChild(heading);
        
        // Create instructions container
        const instructions = document.createElement('div');
        instructions.className = 'banner-instructions';
        
        const instruction1 = document.createElement('p');
        instruction1.className = 'banner-instruction-item';
        instruction1.innerHTML = 'Double click a <span class="banner-highlight">word</span> to select';
        
        const instruction2 = document.createElement('p');
        instruction2.className = 'banner-instruction-item';
        instruction2.innerHTML = 'Select a <span class="banner-highlight">passage containing multiple words</span> or sentences';
        
        instructions.appendChild(instruction1);
        instructions.appendChild(instruction2);
        
        // Create footer with "Don't show again" button
        const footer = document.createElement('div');
        footer.className = 'banner-footer';
        
        const dontShowButton = document.createElement('button');
        dontShowButton.className = 'banner-dont-show';
        dontShowButton.textContent = "Don't show again";
        dontShowButton.addEventListener('click', () => {
          this.dismissBanner();
          this.hideBanner();
        });
        
        footer.appendChild(dontShowButton);
        
        // Assemble banner
        this.bannerContainer.appendChild(header);
        this.bannerContainer.appendChild(headingContainer);
        this.bannerContainer.appendChild(instructions);
        this.bannerContainer.appendChild(footer);
        
        // Add styles
        this.addStyles();
        
        // Append to body
        document.body.appendChild(this.bannerContainer);
      },
      
      /**
       * Add CSS styles for the banner
       */
      addStyles() {
        if (document.getElementById('explain-ai-banner-styles')) {
          return; // Styles already added
        }
        
        const style = document.createElement('style');
        style.id = 'explain-ai-banner-styles';
        style.textContent = `
          .explain-ai-banner {
            position: fixed !important;
            top: 20px !important;
            right: 20px !important;
            width: 400px !important;
            max-width: calc(100vw - 40px) !important;
            background: white !important;
            border: none !important;
            border-radius: 30px !important;
            padding: 20px !important;
            box-shadow: 0 4px 20px rgba(149, 39, 245, 0.15) !important;
            z-index: 10000 !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif !important;
            transform: translateX(400px);
            opacity: 0;
            transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease;
            visibility: visible !important;
            display: block !important;
          }
          
          .explain-ai-banner.show {
            transform: translateX(0);
            opacity: 1;
          }
          
          .explain-ai-banner.hide {
            transform: translateX(400px);
            opacity: 0;
          }
          
          .banner-header {
            display: flex;
            justify-content: flex-start;
            align-items: flex-start;
            margin-bottom: 8px;
            position: relative;
          }
          
          .banner-heading-container {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 16px;
          }
          
          .banner-heading {
            margin: 0 !important;
            font-size: 28px !important;
            font-weight: 600 !important;
            color: #9527F5 !important;
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
          
          .banner-heading-icon {
            display: inline-flex !important;
            align-items: center !important;
            line-height: 1 !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
          
          .banner-heading-icon svg {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
          
          .banner-close {
            position: absolute;
            top: -4px;
            left: -4px;
            background: rgba(149, 39, 245, 0.3);
            border: none;
            cursor: pointer;
            padding: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: background-color 0.2s ease;
          }
          
          .banner-close:hover {
            background-color: rgba(149, 39, 245, 0.4);
          }
          
          .banner-close:active {
            background-color: rgba(149, 39, 245, 0.5);
          }
          
          .banner-instructions {
            margin-bottom: 16px;
          }
          
          .banner-instruction-item {
            font-size: 14px;
            color: #333;
            margin: 10px 0;
            line-height: 1.6;
            position: relative;
            padding-left: 0;
          }
          
          .banner-instruction-item::before {
            content: "ⓘ";
            color: #9527F5;
            font-size: 16px;
            font-weight: bold;
            margin-right: 8px;
            vertical-align: middle;
            line-height: 1;
          }
          
          .banner-highlight {
            background-color: #f5f0ff;
            color: #7a1fd9;
            padding: 2px 8px;
            border-radius: 12px;
            font-weight: 500;
          }
          
          .banner-footer {
            display: flex;
            justify-content: flex-end;
            padding-top: 8px;
          }
          
          .banner-dont-show {
            background: rgba(149, 39, 245, 0.45);
            border: none;
            color: #9527F5;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            padding: 6px 12px;
            border-radius: 10px;
            transition: background-color 0.2s ease;
          }
          
          .banner-dont-show:hover {
            background-color: rgba(149, 39, 245, 0.55);
          }
          
          .banner-dont-show:active {
            background-color: rgba(149, 39, 245, 0.6);
          }
        `;
        
        document.head.appendChild(style);
      },
      
      /**
       * Show the banner with sliding-in animation
       */
      async showBanner() {
        if (!this.bannerContainer) {
          this.createBanner();
        }
        
        const shouldShow = await this.shouldShowBanner();
        if (!shouldShow) {
          return;
        }
        
        // Remove hide class and add show class
        this.bannerContainer.classList.remove('hide');
        this.bannerContainer.classList.add('show');
      },
      
      /**
       * Hide the banner with sliding-out animation
       */
      hideBanner() {
        if (!this.bannerContainer) {
          return;
        }
        
        this.bannerContainer.classList.remove('show');
        this.bannerContainer.classList.add('hide');
        
        // Remove from DOM after animation
        setTimeout(() => {
          if (this.bannerContainer && this.bannerContainer.classList.contains('hide')) {
            this.bannerContainer.remove();
            this.bannerContainer = null;
          }
        }, 400);
      },
      
      /**
       * Initialize the banner - check if it should be shown
       */
      async init() {
        const shouldShow = await this.shouldShowBanner();
        if (shouldShow) {
          // Wait a bit for page to load, then show banner
          setTimeout(() => {
            this.showBanner();
          }, 500);
        }
      },
      
      /**
       * Update banner visibility based on extension state
       */
      async updateVisibility(isEnabled) {
        if (isEnabled) {
          const shouldShow = await this.shouldShowBanner();
          if (shouldShow) {
            this.showBanner();
          } else {
            this.hideBanner();
          }
        } else {
          this.hideBanner();
        }
      }
    };
    
    // Check global extension state on page load/reload AFTER initialization
    const checkGlobalExtensionState = async () => {
      try {
        const result = await chrome.storage.local.get([GLOBAL_STORAGE_KEY]);
        let isEnabled = result[GLOBAL_STORAGE_KEY];
        
        // If not found, create it and set to true (enabled by default)
        if (isEnabled === undefined) {
          isEnabled = true;
          await chrome.storage.local.set({ [GLOBAL_STORAGE_KEY]: isEnabled });
          console.log('[Content Script] Global toggle state not found, created with default value: true');
        }
        
        console.log('[Content Script] Global extension state:', isEnabled);
        
        if (isEnabled) {
          ButtonPanel.show();
          WordSelector.enable();
          TextSelector.enable();
        } else {
          ButtonPanel.hide();
          WordSelector.disable();
          TextSelector.disable();
          WordSelector.clearAll();
          TextSelector.clearAll();
        }
        
        // Update banner visibility after state check
        await BannerModule.updateVisibility(isEnabled);
      } catch (error) {
        console.error('[Content Script] Error checking global extension state:', error);
        // Default to enabled on error
        ButtonPanel.show();
        WordSelector.enable();
        TextSelector.enable();
        
        // Update banner visibility on error (default to enabled)
        await BannerModule.updateVisibility(true);
      }
    };
    
    // Check state after initialization
    await checkGlobalExtensionState();
    
    // PERMANENT FIX: Ensure import-content button always has indicator
    setTimeout(() => {
      const ensureImportContentIndicator = () => {
        const importButton = document.getElementById('import-content');
        const importIndicator = document.getElementById('import-content-indicator');
        
        if (importButton && !importIndicator) {
          console.log('[PERMANENT FIX] Creating missing import-content indicator...');
          const indicator = document.createElement('div');
          indicator.className = 'vocab-content-indicator';
          indicator.id = 'import-content-indicator';
          importButton.appendChild(indicator);
          
          // Update indicators to show/hide based on content
          if (window.ButtonPanel && window.ButtonPanel.updateContentIndicators) {
            window.ButtonPanel.updateContentIndicators();
          }
        }
      };
      
      // Run immediately
      ensureImportContentIndicator();
      
      // Also run periodically to catch any recreated buttons
      setInterval(ensureImportContentIndicator, 2000);
    }, 1000);
    
    // SIMPLE FIX - Force topics indicator to be visible
    window.fixTopicsDot = () => {
      console.log('[FIX] Forcing topics green dot to be visible...');
      const indicator = document.getElementById('topics-content-indicator');
      if (indicator) {
        indicator.style.cssText = `
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          background-color: #16a34a !important;
          border: 1px solid white !important;
          position: absolute !important;
          top: 4px !important;
          right: 4px !important;
          width: 8px !important;
          height: 8px !important;
          border-radius: 50% !important;
          z-index: 10 !important;
        `;
        console.log('[FIX] Topics green dot should now be visible!');
      } else {
        console.log('[FIX] Topics indicator element not found - creating one...');
        const topicsButton = document.getElementById('vocab-topics-btn');
        if (topicsButton) {
          const newIndicator = document.createElement('div');
          newIndicator.id = 'topics-content-indicator';
          newIndicator.style.cssText = `
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            background-color: #16a34a !important;
            border: 1px solid white !important;
            position: absolute !important;
            top: 4px !important;
            right: 4px !important;
            width: 8px !important;
            height: 8px !important;
            border-radius: 50% !important;
            z-index: 10 !important;
          `;
          topicsButton.appendChild(newIndicator);
          console.log('[FIX] Created and added topics green dot!');
        }
      }
    };
    
    // Listen for storage changes to show/hide panel (global)
    chrome.storage.onChanged.addListener((changes, namespace) => {
      console.log('[Content Script] Storage changed:', changes, 'Namespace:', namespace);
      
      if (namespace === 'local') {
        // Check if global key changed
        if (changes[GLOBAL_STORAGE_KEY]) {
          const isEnabled = changes[GLOBAL_STORAGE_KEY].newValue;
          console.log(`[Content Script] Global toggle state changed:`, isEnabled);
          
          if (isEnabled) {
            ButtonPanel.show();
            WordSelector.enable();
            TextSelector.enable();
          } else {
            ButtonPanel.hide();
            WordSelector.disable();
            TextSelector.disable();
            // Clear all selections when toggling off
            WordSelector.clearAll();
            TextSelector.clearAll();
          }
          
          // Update banner visibility
          BannerModule.updateVisibility(isEnabled);
        }
      }
    });
    
    // Listen for messages from popup and background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('[Content Script] Message received:', message);
      
      if (message.type === 'TOGGLE_EXTENSION_GLOBAL') {
        console.log(`[Content Script] Global toggle changed:`, message.isEnabled);
        
        if (message.isEnabled) {
          ButtonPanel.show();
          WordSelector.enable();
          TextSelector.enable();
          // Show ask-about-page button if pageTextContent is available
          if (window.pageTextContent) {
            showAskAboutPageButton();
          }
        } else {
          ButtonPanel.hide();
          WordSelector.disable();
          TextSelector.disable();
          // Clear all selections when toggling off
          WordSelector.clearAll();
          TextSelector.clearAll();
          // Hide ask-about-page button with slide-out animation when extension is disabled
          hideAskAboutPageButton();
          // Close chat dialog if it's open for ask-about-page context
          if (typeof ChatDialog !== 'undefined' && ChatDialog.isOpen && ChatDialog.currentTextKey) {
            const isPageGeneral = ChatDialog.currentTextKey === 'page-general' || ChatDialog.currentTextKey.startsWith('page-general');
            if (isPageGeneral) {
              console.log('[Content Script] Closing chat dialog for ask-about-page when extension is disabled');
              ChatDialog.close();
            }
          }
        }
        
        // Update banner visibility
        BannerModule.updateVisibility(message.isEnabled);
        
        sendResponse({ success: true });
      } else if (message.type === 'TAB_STATE_CHANGE') {
        console.log(`[Content Script] Tab state change:`, message.eventType);
        handleTabStateChange(message.domain, message.eventType, sendResponse);
      } else if (message.type === 'CHECK_EXTENSION_STATE') {
        handleExtensionStateCheck(message.domain, sendResponse);
      }
    });
    
    // Initialize banner after checking extension state
    await BannerModule.init();
  },
});

// ===================================
// Tab State Management Functions
// ===================================

/**
 * Handle tab state change events from background script
 * @param {string} domain - The domain name
 * @param {string} eventType - Type of event (TAB_LOADED, TAB_SWITCHED, TAB_CREATED)
 * @param {Function} sendResponse - Response callback
 */
async function handleTabStateChange(domain, eventType, sendResponse) {
  try {
    console.log(`[Content Script] Handling tab state change: ${eventType} for ${domain}`);
    
    // Check global extension state in storage
    const GLOBAL_STORAGE_KEY = 'is_extension_globally_enabled';
    const result = await chrome.storage.local.get([GLOBAL_STORAGE_KEY]);
    let isEnabled = result[GLOBAL_STORAGE_KEY];
    
    if (isEnabled === undefined) {
      // No storage data found - create it and set to enabled (ON by default)
      console.log(`[Content Script] Global toggle state not found, creating with default value: true`);
      isEnabled = true;
      await chrome.storage.local.set({ [GLOBAL_STORAGE_KEY]: isEnabled });
      
      // Ensure all components are enabled (default ON)
      ButtonPanel.show();
      WordSelector.enable();
      TextSelector.enable();
      
      sendResponse({ success: true, isEnabled: true, isNewDomain: true });
    } else {
      // Storage data exists, use the stored value
      console.log(`[Content Script] Global extension state: ${isEnabled}`);
      
      if (isEnabled) {
        ButtonPanel.show();
        WordSelector.enable();
        TextSelector.enable();
        // Show ask-about-page button if pageTextContent is available
        if (window.pageTextContent) {
          showAskAboutPageButton();
        }
      } else {
        ButtonPanel.hide();
        WordSelector.disable();
        TextSelector.disable();
        WordSelector.clearAll();
        TextSelector.clearAll();
        // Hide ask-about-page button with slide-out animation when extension is disabled
        hideAskAboutPageButton();
        // Close chat dialog if it's open for ask-about-page context
        if (typeof ChatDialog !== 'undefined' && ChatDialog.isOpen && ChatDialog.currentTextKey) {
          const isPageGeneral = ChatDialog.currentTextKey === 'page-general' || ChatDialog.currentTextKey.startsWith('page-general');
          if (isPageGeneral) {
            console.log('[Content Script] Closing chat dialog for ask-about-page when extension is disabled');
            ChatDialog.close();
          }
        }
      }
      
      sendResponse({ success: true, isEnabled: isEnabled, isNewDomain: false });
    }
  } catch (error) {
    console.error('[Content Script] Error handling tab state change:', error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Handle extension state check request
 * @param {string} domain - The domain to check
 * @param {Function} sendResponse - Response callback
 */
async function handleExtensionStateCheck(domain, sendResponse) {
  try {
    const GLOBAL_STORAGE_KEY = 'is_extension_globally_enabled';
    const result = await chrome.storage.local.get([GLOBAL_STORAGE_KEY]);
    let isEnabled = result[GLOBAL_STORAGE_KEY];
    
    // If not found, create it and set to true (enabled by default)
    if (isEnabled === undefined) {
      isEnabled = true;
      await chrome.storage.local.set({ [GLOBAL_STORAGE_KEY]: isEnabled });
      console.log('[Content Script] Global toggle state not found, created with default value: true');
    }
    
    console.log(`[Content Script] Global extension state:`, isEnabled);
    
    sendResponse({
      success: true,
      isEnabled: isEnabled,
      domain: domain
    });
  } catch (error) {
    console.error('[Content Script] Error checking global extension state:', error);
    sendResponse({
      success: false,
      error: error.message,
      isEnabled: true // Default to enabled on error
    });
  }
}

// ===================================
// Error Banner Module - Shows error messages for rate limiting
// ===================================
const ErrorBanner = {
  STORAGE_KEY: 'vocab_error_banner_dismissed',
  bannerContainer: null,
  isMinimized: false,
  
  /**
   * Check if banner should be shown
   * @returns {Promise<boolean>} Whether to show the banner
   */
  async shouldShowBanner() {
    try {
      const result = await chrome.storage.local.get([this.STORAGE_KEY]);
      const isDismissed = result[this.STORAGE_KEY] ?? false;
      return !isDismissed;
    } catch (error) {
      console.error('[ErrorBanner] Error checking banner state:', error);
      return true; // Default to showing on error
    }
  },
  
  /**
   * Mark banner as dismissed
   */
  async dismissBanner() {
    try {
      await chrome.storage.local.set({ [this.STORAGE_KEY]: true });
      console.log('[ErrorBanner] Banner dismissed');
    } catch (error) {
      console.error('[ErrorBanner] Error dismissing banner:', error);
    }
  },
  
  /**
   * Show error banner with message
   * @param {string} message - Error message to display
   */
  async show(message) {
    // Check if banner should be shown
    const shouldShow = await this.shouldShowBanner();
    if (!shouldShow) {
      console.log('[ErrorBanner] Banner dismissed by user, not showing');
      return;
    }
    
    // If banner already exists and is minimized, restore it
    if (this.bannerContainer && this.isMinimized) {
      this.restore();
      return;
    }
    
    // Remove existing banner if any
    this.hide();
    this.isMinimized = false;
    
    // Create banner container
    this.bannerContainer = document.createElement('div');
    this.bannerContainer.id = 'vocab-error-banner';
    this.bannerContainer.className = 'vocab-error-banner';
    this.bannerContainer.innerHTML = `
      <button class="vocab-error-banner-close" aria-label="Minimize">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div class="vocab-error-banner-content">
        <span class="vocab-error-banner-message">${message}</span>
      </div>
      <div class="vocab-error-banner-footer">
        <button class="vocab-error-banner-dismiss" aria-label="Don't show again">Don't show again</button>
      </div>
    `;
    
    // Add close button handler (top left) - minimize instead of hide
    const closeBtn = this.bannerContainer.querySelector('.vocab-error-banner-close');
    closeBtn.addEventListener('click', () => {
      this.minimize();
    });
    
    // Add "Don't show again" button handler (bottom left)
    const dismissBtn = this.bannerContainer.querySelector('.vocab-error-banner-dismiss');
    dismissBtn.addEventListener('click', async () => {
      await this.dismissBanner();
      this.hide();
    });
    
    // Append to body
    document.body.appendChild(this.bannerContainer);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (!this.isMinimized) {
        this.hide();
      }
    }, 5000);
    
    // Add styles if not already added
    this.injectStyles();
  },
  
  /**
   * Minimize error banner
   */
  minimize() {
    if (this.bannerContainer) {
      this.bannerContainer.classList.add('minimized');
      this.isMinimized = true;
    }
  },
  
  /**
   * Restore minimized banner
   */
  restore() {
    if (this.bannerContainer) {
      this.bannerContainer.classList.remove('minimized');
      this.isMinimized = false;
    }
  },
  
  /**
   * Hide error banner
   */
  hide() {
    if (this.bannerContainer && this.bannerContainer.parentNode) {
      this.bannerContainer.remove();
      this.bannerContainer = null;
      this.isMinimized = false;
    }
  },
  
  /**
   * Inject CSS styles for error banner
   */
  injectStyles() {
    const styleId = 'vocab-error-banner-styles';
    if (document.getElementById(styleId)) {
      return; // Styles already injected
    }
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .vocab-error-banner {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1000000;
        background: #ef4444;
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        animation: vocab-error-banner-slide-in 0.3s ease-out;
        max-width: 90%;
        width: auto;
        min-width: 300px;
        position: relative;
      }
      
      @keyframes vocab-error-banner-slide-in {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
      
      .vocab-error-banner-close {
        position: absolute;
        top: 8px;
        left: 8px !important;
        right: auto !important;
        background: rgba(255, 255, 255, 0.15);
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: white;
        font-size: 16px;
        line-height: 1;
        cursor: pointer;
        padding: 6px;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.9;
        transition: all 0.2s;
        border-radius: 4px;
        z-index: 10;
        margin: 0;
      }
      
      .vocab-error-banner-close svg {
        width: 16px;
        height: 16px;
      }
      
      .vocab-error-banner-close:hover {
        opacity: 1;
        background: rgba(255, 255, 255, 0.25);
        border-color: rgba(255, 255, 255, 0.5);
      }
      
      .vocab-error-banner.minimized {
        height: 44px;
        overflow: hidden;
      }
      
      .vocab-error-banner.minimized .vocab-error-banner-content,
      .vocab-error-banner.minimized .vocab-error-banner-footer {
        display: none;
      }
      
      .vocab-error-banner-content {
        display: flex;
        align-items: center;
        padding: 8px 40px 8px 40px;
        min-height: 40px;
      }
      
      .vocab-error-banner-message {
        font-size: 14px;
        font-weight: 500;
        line-height: 1.4;
        text-align: center;
        flex: 1;
      }
      
      .vocab-error-banner-footer {
        display: flex !important;
        justify-content: flex-start !important;
        align-items: center !important;
        padding-top: 8px;
        padding-left: 0 !important;
        padding-right: 0 !important;
        border-top: 1px solid rgba(255, 255, 255, 0.2);
        margin-top: 8px;
        margin-left: 0 !important;
        margin-right: 0 !important;
        text-align: left !important;
        width: 100%;
      }
      
      .vocab-error-banner-dismiss {
        background: none !important;
        border: 1px solid rgba(255, 255, 255, 0.5) !important;
        color: white !important;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        padding: 6px 12px;
        opacity: 0.9;
        transition: all 0.2s;
        text-decoration: none;
        border-radius: 4px;
        margin-left: 0 !important;
        margin-right: auto !important;
        float: left !important;
        position: relative !important;
        left: 0 !important;
        right: auto !important;
      }
      
      .vocab-error-banner-dismiss:hover {
        opacity: 1;
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.8);
      }
    `;
    
    document.head.appendChild(style);
  }
};

// ===================================
// Position Manager Module - Handles saving and loading panel position
// ===================================
const PositionManager = {
  STORAGE_KEY: 'vocab-helper-panel-position',
  
  /**
   * Save panel position to storage
   * @param {Object} position - Position object {top, left}
   */
  async savePosition(position) {
    try {
      await chrome.storage.local.set({ [this.STORAGE_KEY]: position });
    } catch (error) {
      console.error('Error saving panel position:', error);
    }
  },
  
  /**
   * Load panel position from storage
   * @returns {Promise<Object|null>} Position object or null if not found
   */
  async loadPosition() {
    try {
      const result = await chrome.storage.local.get([this.STORAGE_KEY]);
      return result[this.STORAGE_KEY] || null;
    } catch (error) {
      console.error('Error loading panel position:', error);
      return null;
    }
  },
  
  /**
   * Clear saved position
   */
  async clearPosition() {
    try {
      await chrome.storage.local.remove([this.STORAGE_KEY]);
    } catch (error) {
      console.error('Error clearing panel position:', error);
    }
  }
};

// ===================================
// Word Selector Module - Handles word selection and highlighting
// ===================================
const WordSelector = {
  // Use Set for O(1) insertion, deletion, and lookup
  selectedWords: new Set(),
  
  // Map to store word -> Set of highlight elements (for handling multiple instances)
  wordToHighlights: new Map(),
  
  // Map to store word -> Array of position objects {element, textStartIndex}
  wordPositions: new Map(),
  
  // Container for explained words (moved from selectedWords after API call)
  explainedWords: new Map(), // Map of word -> {word, meaning, examples, highlights, hasCalledGetMoreExamples}
  
  // Track if popup is open for each word (boolean flag)
  wordPopupOpen: new Map(), // Map of normalizedWord -> boolean
  
  // Cache for pronunciation audio blobs
  pronunciationCache: new Map(), // Map of word -> audio blob
  
  // Cache for translated word explanations (EN translations)
  translationCache: new Map(), // Map of normalizedWord -> {meaning, examples}
  
  // Track if the feature is enabled
  isEnabled: false,
  
  // Counter for generating unique IDs
  highlightIdCounter: 0,
  
  // Store bound handler for proper cleanup
  boundDoubleClickHandler: null,
  
  /**
   * Initialize word selector
   */
  async init() {
    console.log('[WordSelector] Initializing...');
    
    // Bind the handler once for proper cleanup
    this.boundDoubleClickHandler = this.handleDoubleClick.bind(this);
    
    // Inject styles for word highlights
    this.injectStyles();
    
    // Setup global click handler to close popups (only sticky ones)
    document.addEventListener('click', (e) => {
      // Get all sticky popups
      const stickyPopups = document.querySelectorAll('.vocab-word-popup[data-sticky="true"]');
      
      if (stickyPopups.length === 0) return;
      
      // Check if click is outside popup and not on an explained word
      const clickedInsidePopup = e.target.closest('.vocab-word-popup');
      const clickedOnWord = e.target.closest('.vocab-word-explained');
      
      // Also check if clicking on popup buttons (speaker, close, get more examples)
      const clickedOnPopupButton = e.target.closest('.vocab-word-popup-speaker') || 
                                   e.target.closest('.vocab-word-popup-close') || 
                                   e.target.closest('.vocab-word-popup-button');
      
      // Check if any sticky popup has mouse inside it
      const hasMouseInsidePopup = Array.from(stickyPopups).some(popup => 
        popup.getAttribute('data-mouse-inside') === 'true'
      );
      
      // Close popup if clicking outside popup, word, popup buttons, and no mouse is inside any popup
      if (!clickedInsidePopup && !clickedOnWord && !clickedOnPopupButton && !hasMouseInsidePopup) {
        // Use a longer delay to ensure the click event has fully processed
        setTimeout(() => {
          // Double-check that we still have sticky popups (in case they were closed by other means)
          const currentStickyPopups = document.querySelectorAll('.vocab-word-popup[data-sticky="true"]');
          if (currentStickyPopups.length > 0) {
            this.hideAllPopups();
          }
        }, 10);
      }
    }, false); // Use bubble phase instead of capture phase
    
    // Check if extension is enabled for current domain
    const isExtensionEnabled = await this.checkExtensionEnabled();
    
    if (isExtensionEnabled) {
      this.enable();
    }
    
    console.log('[WordSelector] Initialized. Enabled:', isExtensionEnabled);
  },
  
  /**
   * Check if extension is enabled from storage
   * @returns {Promise<boolean>}
   */
  async checkExtensionEnabled() {
    try {
      const GLOBAL_STORAGE_KEY = 'is_extension_globally_enabled';
      const result = await chrome.storage.local.get([GLOBAL_STORAGE_KEY]);
      let isEnabled = result[GLOBAL_STORAGE_KEY];
      
      // If not found, create it and set to true (enabled by default)
      if (isEnabled === undefined) {
        isEnabled = true;
        await chrome.storage.local.set({ [GLOBAL_STORAGE_KEY]: isEnabled });
        console.log('[WordSelector] Global toggle state not found, created with default value: true');
      }
      
      return isEnabled;
    } catch (error) {
      console.error('[WordSelector] Error checking global extension state:', error);
      return true; // Default to true (enabled) on error
    }
  },
  
  /**
   * Enable word selector
   */
  enable() {
    if (this.isEnabled) return;
    
    this.isEnabled = true;
    document.addEventListener('dblclick', this.boundDoubleClickHandler);
    console.log('[WordSelector] Enabled');
  },
  
  /**
   * Disable word selector
   */
  disable() {
    if (!this.isEnabled) return;
    
    this.isEnabled = false;
    document.removeEventListener('dblclick', this.boundDoubleClickHandler);
    console.log('[WordSelector] Disabled');
  },
  
  /**
   * Check if an element or range is within allowed selection areas
   * Allowed: Main website content and .vocab-custom-content-editor-content
   * Disallowed: All other extension UI components
   * @param {Element|Range} elementOrRange - The element or range to check
   * @returns {boolean} True if selection is allowed, false otherwise
   */
  isSelectionAllowed(elementOrRange) {
    // Get the container element from element or range
    let containerElement = null;
    
    if (elementOrRange instanceof Range) {
      // For range, check the common ancestor container
      containerElement = elementOrRange.commonAncestorContainer;
      // If it's a text node, get its parent
      if (containerElement && containerElement.nodeType === Node.TEXT_NODE) {
        containerElement = containerElement.parentElement;
      } else if (containerElement && containerElement.nodeType === Node.ELEMENT_NODE) {
        containerElement = containerElement;
      }
    } else if (elementOrRange instanceof Element) {
      containerElement = elementOrRange;
    } else if (elementOrRange instanceof Node) {
      // For other node types (like text nodes), get parent element
      if (elementOrRange.nodeType === Node.TEXT_NODE) {
        containerElement = elementOrRange.parentElement;
      } else if (elementOrRange.nodeType === Node.ELEMENT_NODE) {
        containerElement = elementOrRange;
      }
    }
    
    // Ensure we have an Element (not a Text node or null)
    if (!containerElement || !(containerElement instanceof Element)) {
      return false;
    }
    
    // First check: If inside .vocab-custom-content-editor-content, allow it
    // This is the exception - even though it's inside vocab-custom-content-modal,
    // we want to allow selection in the editor content
    const editorContent = containerElement.closest('.vocab-custom-content-editor-content');
    if (editorContent) {
      return true;
    }
    
    // Second check: If inside any extension UI component, disallow it
    // List of extension UI component selectors
    const extensionUISelectors = [
      '.vocab-helper-panel',
      '.vocab-topics-modal',
      '.vocab-topics-modal-overlay',
      '.vocab-chat-dialog',
      '.vocab-custom-content-modal',
      '.vocab-custom-content-info-banner',
      '.vocab-word-popup',
      '.vocab-notification'
    ];
    
    // Check if the container is inside any extension UI component
    for (const selector of extensionUISelectors) {
      if (containerElement.closest(selector)) {
        return false;
      }
    }
    
    // If not in extension UI and not in editor content, it's main website content - allow it
    return true;
  },
  
  /**
   * Handle double-click event
   * @param {MouseEvent} event
   */
  handleDoubleClick(event) {
    // CRITICAL: Check if feature is enabled
    if (!this.isEnabled) {
      return;
    }
    
    // Check if clicking on an existing highlight to deselect it
    const clickedHighlight = event.target.closest('.vocab-word-highlight');
    if (clickedHighlight) {
      // Allow deselection of highlights anywhere (they should be removable)
      const word = clickedHighlight.getAttribute('data-word');
      if (word) {
        // Check if it's a green explained word - if so, use removeExplainedWord
        if (clickedHighlight.classList.contains('vocab-word-explained')) {
          this.removeExplainedWord(word);
          console.log('[WordSelector] Explained word deselected via double-click:', word);
        } else {
          this.removeWord(word);
          console.log('[WordSelector] Word deselected via double-click:', word);
        }
      }
      return;
    }
    
    // Check if selection is allowed in the clicked area
    if (!this.isSelectionAllowed(event.target)) {
      console.log('[WordSelector] Selection not allowed - clicked in extension UI');
      return;
    }
    
    // Get the selected text
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    console.log('[WordSelector] ===== DOUBLE CLICK EVENT =====');
    console.log('[WordSelector] Selected text:', selectedText);
    
    // Check if a word was selected
    if (!selectedText || selectedText.length === 0) {
      console.log('[WordSelector] No text selected');
      return;
    }
    
    // Only process single words (no spaces)
    if (/\s/.test(selectedText)) {
      console.log('[WordSelector] Multiple words selected, skipping');
      return;
    }
    
    // Get the range and validate
    if (selection.rangeCount === 0) {
      console.log('[WordSelector] No valid range');
      return;
    }
    
    const range = selection.getRangeAt(0);
    
    // IMPORTANT: Also validate the selection range itself
    // This ensures the selected text is not from extension UI
    if (!this.isSelectionAllowed(range)) {
      console.log('[WordSelector] Selection not allowed - range is in extension UI');
      selection.removeAllRanges();
      return;
    }
    
    const normalizedWord = selectedText.toLowerCase();
    console.log('[WordSelector] Original word:', selectedText);
    console.log('[WordSelector] Normalized word:', normalizedWord);
    
    // Check if word is already explained (green) - if so, deselect it
    if (this.explainedWords.has(normalizedWord)) {
      // Check if clicking on the green highlight itself
      const clickedHighlight = event.target.closest('.vocab-word-explained');
      if (clickedHighlight) {
        // Allow deselection of green highlights
        this.removeExplainedWord(selectedText);
        selection.removeAllRanges();
        console.log('[WordSelector] Explained word deselected:', selectedText);
        return;
      }
    }
    
    // Check if word is already selected (purple) - if so, deselect it
    if (this.isWordSelected(normalizedWord)) {
      this.removeWord(selectedText);
      selection.removeAllRanges();
      console.log('[WordSelector] Word deselected:', selectedText);
      return;
    }
    
    // Add word to selected set (O(1) operation)
    this.addWord(selectedText);
    
    // Highlight the word
    this.highlightRange(range, selectedText);
    
    // Clear the selection
    selection.removeAllRanges();
    
    console.log('[WordSelector] ✓ Word selected:', selectedText);
    console.log('[WordSelector] ✓ Normalized word stored:', normalizedWord);
    console.log('[WordSelector] ✓ Total selected words:', this.selectedWords.size);
    
    // Get the highlight element that was just created
    const highlights = this.wordToHighlights.get(normalizedWord);
    const highlight = highlights ? Array.from(highlights)[highlights.size - 1] : null;
    
    // Immediately trigger API call for this word
    // Pass the highlight element directly to avoid timing issues
    this.processWordExplanation(selectedText, normalizedWord, highlight);
  },
  
  /**
   * Process word explanation API call for a single word
   * This is called automatically when a word is double-clicked
   * @param {string} word - The original word (with case)
   * @param {string} normalizedWord - The normalized word (lowercase)
   * @param {HTMLElement} highlight - The highlight element (optional, will be looked up if not provided)
   */
  async processWordExplanation(word, normalizedWord, highlight = null) {
    console.log('[WordSelector] ===== PROCESSING WORD EXPLANATION =====');
    console.log('[WordSelector] Word:', word);
    console.log('[WordSelector] Normalized word:', normalizedWord);
    console.log('[WordSelector] Highlight provided:', highlight !== null);
    
    // Check if word is already explained (green)
    if (this.explainedWords.has(normalizedWord)) {
      console.log('[WordSelector] Word already explained, skipping API call:', normalizedWord);
      return;
    }
    
    // Get the highlight element for this word if not provided
    if (!highlight) {
      const highlights = this.wordToHighlights.get(normalizedWord);
      if (!highlights || highlights.size === 0) {
        console.warn('[WordSelector] No highlights found for word:', normalizedWord);
        return;
      }
      // Use the most recently added highlight (last in the Set)
      highlight = Array.from(highlights)[highlights.size - 1];
    }
    
    // Check if highlight is already explained (has green class)
    if (highlight.classList.contains('vocab-word-explained')) {
      console.log('[WordSelector] Highlight already has green background, skipping API call');
      return;
    }
    
    // Build payload for this single word
    const docText = this.getDocumentText();
    const positions = this.findWordPositionsInDocument(normalizedWord);
    
    if (positions.length === 0) {
      console.warn('[WordSelector] No positions found for word:', normalizedWord);
      return;
    }
    
    // Use the first position
    const position = positions[0];
    const context = this.extractWordContext(docText, position, word.length);
    
    console.log('[WordSelector] Context extracted:', {
      textStartIndex: context.textStartIndex,
      textPreview: context.text.substring(0, 50) + '...',
      wordIndexInContext: context.wordIndexInText
    });
    
    // Build payload segment
    const payloadSegment = {
      textStartIndex: context.textStartIndex,
      text: context.text,
      important_words_location: [{
        word: word,
        index: context.wordIndexInText,
        length: word.length
      }],
      _wordHighlights: [highlight] // Keep for internal tracking
    };
    
    // Remove purple cross button and add pulsating animation
    const existingBtn = highlight.querySelector('.vocab-word-remove-btn');
    if (existingBtn) {
      existingBtn.remove();
    }
    
    // Add pulsating purple animation
    highlight.classList.add('vocab-word-loading');
    console.log('[WordSelector] Added loading animation to highlight');
    
    // Prepare API payload (remove internal tracking property)
    const apiPayload = [{
      textStartIndex: payloadSegment.textStartIndex,
      text: payloadSegment.text,
      important_words_location: payloadSegment.important_words_location
    }];
    
    console.log('[WordSelector] Sending API request for word:', word);
    
    // Call WordExplanationService with SSE
    WordExplanationService.explainWords(
      apiPayload,
      // onEvent callback - called for each word explanation
      (eventData) => {
        console.log('[WordSelector] ===== SSE EVENT RECEIVED FOR DOUBLE-CLICKED WORD =====');
        console.log('[WordSelector] Full event data:', JSON.stringify(eventData, null, 2));
        
        const wordInfo = eventData.word_info;
        if (!wordInfo) {
          console.warn('[WordSelector] No word_info in event data');
          return;
        }
        
        // Use word_info.location.word for matching
        const targetWord = wordInfo.location?.word || wordInfo.word;
        const normalizedTargetWord = targetWord.toLowerCase().trim();
        
        console.log('[WordSelector] Processing word explanation:', {
          targetWord: targetWord,
          normalizedTargetWord: normalizedTargetWord,
          originalWord: word,
          originalNormalized: normalizedWord
        });
        
        // Find the matching highlight
        const wordHighlight = highlight;
        const highlightDataWord = wordHighlight.getAttribute('data-word');
        
        // Check if this is the correct highlight
        if (highlightDataWord && highlightDataWord.toLowerCase() === normalizedTargetWord) {
          console.log('[WordSelector] ===== APPLYING GREEN BACKGROUND =====');
          console.log('[WordSelector] ✓ Found matching highlight for word:', targetWord);
          
          // Remove pulsating animation
          wordHighlight.classList.remove('vocab-word-loading');
          
          // Remove old purple cross button if exists
          const oldBtn = wordHighlight.querySelector('.vocab-word-remove-btn');
          if (oldBtn) {
            oldBtn.remove();
          }
          
          // Change background to green with breathing animation
          wordHighlight.classList.add('vocab-word-explained', 'word-breathing');
          
          // Remove breathing animation after it completes (0.8s)
          setTimeout(() => {
            wordHighlight.classList.remove('word-breathing');
          }, 800);
          
          // Store explanation data on the element
          wordHighlight.setAttribute('data-meaning', wordInfo.meaning);
          wordHighlight.setAttribute('data-examples', JSON.stringify(wordInfo.examples));
          
          // Store word explanation in analysis data for persistence
          if (ButtonPanel.topicsModal && ButtonPanel.topicsModal.customContentModal && ButtonPanel.topicsModal.customContentModal.activeTabId) {
            const activeContent = ButtonPanel.topicsModal.customContentModal.getContentByTabId(parseInt(ButtonPanel.topicsModal.customContentModal.activeTabId));
            if (activeContent && activeContent.analysis) {
              // Check if this word already exists in wordMeanings
              const existingWordIndex = activeContent.analysis.wordMeanings.findIndex(w => 
                w.word.toLowerCase() === normalizedTargetWord
              );
              
              const wordExplanationData = {
                word: targetWord,
                normalizedWord: normalizedTargetWord,
                meaning: wordInfo.meaning,
                examples: wordInfo.examples,
                shouldAllowFetchMoreExamples: wordInfo.shouldAllowFetchMoreExamples || false,
                textStartIndex: wordInfo.textStartIndex,
                location: wordInfo.location,
                timestamp: new Date().toISOString()
              };
              
              if (existingWordIndex !== -1) {
                // Update existing word explanation
                activeContent.analysis.wordMeanings[existingWordIndex] = wordExplanationData;
                console.log('[WordSelector] Updated existing word explanation in analysis data');
              } else {
                // Add new word explanation
                activeContent.analysis.wordMeanings.push(wordExplanationData);
                console.log('[WordSelector] Added new word explanation to analysis data');
              }
            }
          }
          
          // Add green wireframe cross button
          const greenCrossBtn = this.createRemoveExplainedButton(targetWord);
          wordHighlight.appendChild(greenCrossBtn);
          
          // Store in explainedWords map
          // Extract languageCode from eventData (could be at top level or in word_info)
          const languageCode = eventData.languageCode || wordInfo.languageCode || null;
          
          if (!this.explainedWords.has(normalizedTargetWord)) {
            this.explainedWords.set(normalizedTargetWord, {
              word: targetWord,
              meaning: wordInfo.meaning,
              examples: wordInfo.examples,
              shouldAllowFetchMoreExamples: wordInfo.shouldAllowFetchMoreExamples || false,
              hasCalledGetMoreExamples: false,
              languageCode: languageCode,
              highlights: new Set()
            });
          } else {
            // Update existing entry with languageCode if not already set
            const existingEntry = this.explainedWords.get(normalizedTargetWord);
            if (!existingEntry.languageCode && languageCode) {
              existingEntry.languageCode = languageCode;
            }
          }
          this.explainedWords.get(normalizedTargetWord).highlights.add(wordHighlight);
          
          // Setup hover and click interactions for this word
          this.setupWordInteractions(wordHighlight);
          
          // Update button states
          ButtonPanel.updateButtonStatesFromSelections();
          
          // Remove from selectedWords (since it's now explained)
          this.selectedWords.delete(normalizedWord);
          
          console.log('[WordSelector] ===== GREEN BACKGROUND APPLIED SUCCESSFULLY =====');
          console.log('[WordSelector] ✓ Word explanation complete:', targetWord);
          
          // Automatically show word meaning popup after green background is applied
          // Use a small delay to ensure DOM is updated and breathing animation starts
          setTimeout(() => {
            console.log('[WordSelector] ===== AUTO-SHOWING WORD MEANING POPUP =====');
            console.log('[WordSelector] Word highlight element:', {
              element: wordHighlight,
              isInDOM: document.body.contains(wordHighlight),
              classes: wordHighlight.className,
              hasExplainedClass: wordHighlight.classList.contains('vocab-word-explained'),
              textContent: wordHighlight.textContent.trim(),
              dataWord: wordHighlight.getAttribute('data-word'),
              normalizedWord: normalizedWord,
              isInExplainedWords: this.explainedWords.has(normalizedWord)
            });
            
            // Validate element before showing popup
            if (!wordHighlight || !document.body.contains(wordHighlight)) {
              console.error('[WordSelector] ✗ Word highlight element is not in DOM, cannot show popup');
              return;
            }
            
            if (!wordHighlight.classList.contains('vocab-word-explained')) {
              console.error('[WordSelector] ✗ Word highlight does not have vocab-word-explained class, cannot show popup');
              console.error('[WordSelector] Current classes:', wordHighlight.className);
              return;
            }
            
            if (!this.explainedWords.has(normalizedWord)) {
              console.error('[WordSelector] ✗ Word not found in explainedWords map, cannot show popup');
              console.error('[WordSelector] Available words in map:', Array.from(this.explainedWords.keys()));
              return;
            }
            
            console.log('[WordSelector] ✓ All validations passed, showing popup');
            this.showWordPopup(wordHighlight, true); // Show as sticky popup
          }, 100);
        } else {
          console.warn('[WordSelector] Highlight data-word mismatch:', {
            highlightDataWord: highlightDataWord,
            normalizedTargetWord: normalizedTargetWord
          });
        }
      },
      // onComplete callback
      () => {
        console.log('[WordSelector] Word explanation API call completed');
      },
      // onError callback
      async (error) => {
        console.error('[WordSelector] Error during word explanation:', error);
        
        // Remove pulsating animation on error
        highlight.classList.remove('vocab-word-loading');
        
        // Check if it's a 429 rate limit error
        if (error.status === 429 || error.message.includes('429') || error.message.includes('Rate limit')) {
          // Show error banner
          if (typeof ErrorBanner !== 'undefined') {
            await ErrorBanner.show('You are requesting too fast, please retry after few seconds');
          }
          
          // Remove purple BZG (background/cross button) - restore to normal selected state
          // Remove any purple cross button that might have been added
          const purpleBtn = highlight.querySelector('.vocab-word-remove-btn');
          if (purpleBtn) {
            purpleBtn.remove();
          }
          
          // Remove any purple background classes
          highlight.classList.remove('vocab-word-loading', 'vocab-word-explained');
          
          // Restore the purple cross button (normal selected state)
          // Check if word is still in selectedWords
          const normalizedWord = highlight.getAttribute('data-word')?.toLowerCase();
          if (normalizedWord && this.selectedWords.has(normalizedWord)) {
            // Re-add the purple cross button for normal selected state
            const removeBtn = this.createRemoveButton(normalizedWord);
            highlight.appendChild(removeBtn);
          }
        } else {
          // Show error notification for other errors
          TextSelector.showNotification('Error getting word meaning. Please try again.');
        }
      }
    );
  },
  
  /**
   * Check if a word is already selected
   * @param {string} word - The word to check
   * @returns {boolean}
   */
  isWordSelected(word) {
    const normalizedWord = word.toLowerCase();
    return this.selectedWords.has(normalizedWord); // O(1) operation
  },
  
  /**
   * Add a word to the selected words set
   * @param {string} word - The word to add
   */
  addWord(word) {
    const normalizedWord = word.toLowerCase().trim();
    console.log(`[WordSelector] Adding word: "${word}" (normalized: "${normalizedWord}")`);
    this.selectedWords.add(normalizedWord); // O(1) operation
    console.log(`[WordSelector] Selected words now:`, Array.from(this.selectedWords));
    // Update button states
    ButtonPanel.updateButtonStatesFromSelections();
  },
  
  /**
   * Remove a word from the selected words set
   * @param {string} word - The word to remove
   */
  removeWord(word) {
    const normalizedWord = word.toLowerCase().trim();
    
    console.log(`[WordSelector] Removing word: "${word}" (normalized: "${normalizedWord}")`);
    
    // Check if word is in explainedWords - if so, use removeExplainedWord instead
    if (this.explainedWords.has(normalizedWord)) {
      console.log('[WordSelector] Word is in explainedWords, using removeExplainedWord instead');
      this.removeExplainedWord(word);
      return;
    }
    
    // Get all highlights for this word
    const highlights = this.wordToHighlights.get(normalizedWord);
    
    if (highlights) {
      // Remove all highlight elements for this word
      highlights.forEach(highlight => {
        this.removeHighlight(highlight);
      });
      
      // Clean up the mapping
      this.wordToHighlights.delete(normalizedWord); // O(1) operation
    }
    
    // Remove from selected words set
    this.selectedWords.delete(normalizedWord); // O(1) operation
    
    console.log('[WordSelector] Word removed:', word);
    console.log('[WordSelector] Remaining selected words:', this.selectedWords.size);
    console.log('[WordSelector] Selected words now:', Array.from(this.selectedWords));
    
    // Update button states
    ButtonPanel.updateButtonStatesFromSelections();
  },
  
  /**
   * Highlight a range with a styled span
   * @param {Range} range - The range to highlight
   * @param {string} word - The word being highlighted
   */
  highlightRange(range, word) {
    const normalizedWord = word.toLowerCase();
    
    console.log('[WordSelector] ===== CREATING HIGHLIGHT =====');
    console.log('[WordSelector] Original word:', word);
    console.log('[WordSelector] Normalized word for data-word:', normalizedWord);
    
    // Create highlight wrapper
    // DO NOT apply font properties to the highlight span - let child elements preserve their formatting
    // The highlight span should only provide the background color, not override text formatting
    const highlight = document.createElement('span');
    highlight.className = 'vocab-word-highlight';
    highlight.setAttribute('data-word', normalizedWord);
    highlight.setAttribute('data-highlight-id', `highlight-${this.highlightIdCounter++}`);
    
    // Ensure the highlight span doesn't interfere with child formatting
    // Set display to inline to preserve text flow
    highlight.style.setProperty('display', 'inline', 'important');
    highlight.style.setProperty('position', 'relative', 'important');
    // DO NOT set font properties - let children inherit or use their own styles
    
    console.log('[WordSelector] Highlight element created with data-word:', normalizedWord);
    console.log('[WordSelector] Preserving all formatting from selected range - no font overrides applied');
    
    // Wrap the selected range FIRST
    // This preserves all formatting (bold, italic, font sizes, etc.) from the original content
    
    // Try surroundContents first - this works when the range doesn't cross element boundaries
    // If it fails or might break formatting, use extractContents which preserves DOM structure
    try {
      // Check if range might contain formatting elements by checking the HTML
      const rangeClone = range.cloneContents();
      const hasFormattingElements = rangeClone.querySelector('b, strong, em, i, u, span, font, h1, h2, h3, h4, h5, h6');
      
      if (hasFormattingElements) {
        // Range contains formatting elements - use extractContents to preserve structure
        console.log('[WordSelector] Range contains formatting elements - using extractContents to preserve formatting');
        const extractedContents = range.extractContents();
        highlight.appendChild(extractedContents);
        range.insertNode(highlight);
        console.log('[WordSelector] Used extractContents - formatting preserved');
      } else {
        // No formatting elements - try surroundContents
        range.surroundContents(highlight);
        console.log('[WordSelector] Used surroundContents - formatting preserved');
      }
    } catch (error) {
      // surroundContents failed - use extractContents which preserves DOM structure
      console.warn('[WordSelector] surroundContents failed, using extractContents:', error);
      const extractedContents = range.extractContents();
      highlight.appendChild(extractedContents);
      range.insertNode(highlight);
      console.log('[WordSelector] Used extractContents (fallback) - formatting preserved');
    }
    
    // Create and append remove button AFTER wrapping the content
    const removeBtn = this.createRemoveButton(word);
    highlight.appendChild(removeBtn);
    
    // Store the highlight in our map (O(1) operation)
    if (!this.wordToHighlights.has(normalizedWord)) {
      this.wordToHighlights.set(normalizedWord, new Set());
    }
    this.wordToHighlights.get(normalizedWord).add(highlight);
    
    console.log('[WordSelector] ✓ Highlight stored for normalized word:', normalizedWord);
    console.log('[WordSelector] ✓ Total highlights for this word:', this.wordToHighlights.get(normalizedWord).size);
  },
  
  /**
   * Create a remove button for the highlight
   * @param {string} word - The word this button will remove
   * @returns {HTMLElement}
   */
  createRemoveButton(word) {
    const btn = document.createElement('button');
    btn.className = 'vocab-word-remove-btn';
    btn.setAttribute('aria-label', `Remove highlight for "${word}"`);
    btn.innerHTML = this.createCloseIcon();
    
    // Add click handler
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.removeWord(word);
    });
    
    return btn;
  },
  
  /**
   * Create close/cross icon SVG - Purple cross icon
   * @returns {string} SVG markup
   */
  createCloseIcon() {
    return `
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 2L10 10M10 2L2 10" stroke="#9527F5" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  },
  
  /**
   * Remove a highlight element and restore original text
   * @param {HTMLElement} highlight - The highlight element to remove
   */
  removeHighlight(highlight) {
    const parent = highlight.parentNode;
    if (!parent) return;
    
    // Remove the button first
    const btn = highlight.querySelector('.vocab-word-remove-btn');
    if (btn) {
      btn.remove();
    }
    
    // Move all child nodes back to parent
    while (highlight.firstChild) {
      parent.insertBefore(highlight.firstChild, highlight);
    }
    
    // Remove the empty highlight span
    highlight.remove();
    
    // Normalize the parent to merge adjacent text nodes
    parent.normalize();
  },
  
  /**
   * Get all selected words
   * @returns {Set<string>}
   */
  getSelectedWords() {
    return new Set(this.selectedWords); // Return a copy
  },
  
  /**
   * Clear all selections
   */
  clearAll() {
    // Remove all highlights
    this.wordToHighlights.forEach((highlights) => {
      highlights.forEach(highlight => {
        this.removeHighlight(highlight);
      });
    });
    
    // Clear data structures (O(1) for Set clear)
    this.selectedWords.clear();
    this.wordToHighlights.clear();
    this.wordPositions.clear();
    this.explainedWords.clear();
    
    console.log('[WordSelector] All selections cleared');
    
    // Update button states
    ButtonPanel.updateButtonStatesFromSelections();
  },

  /**
   * Clear only selections (purple highlights) but preserve meanings (green highlights)
   */
  clearSelectionsOnly() {
    console.log('[WordSelector] Clearing only selections, preserving meanings');
    
    // Only clear selected words (purple highlights)
    this.selectedWords.forEach(word => {
      const highlights = this.wordToHighlights.get(word);
      if (highlights) {
        highlights.forEach(highlight => {
          // Only remove if it's a selection highlight (purple), not explained (green)
          if (highlight.classList.contains('vocab-word-selected') && 
              !highlight.classList.contains('vocab-word-explained')) {
            this.removeHighlight(highlight);
          }
        });
      }
    });
    
    // Clear only selection data structures
    this.selectedWords.clear();
    this.wordPositions.clear();
    
    // Keep explainedWords and wordToHighlights intact
    
    console.log('[WordSelector] Selections cleared, meanings preserved');
    
    // Update button states
    ButtonPanel.updateButtonStatesFromSelections();
  },
  
  /**
   * Get full document text for position calculation
   * @returns {string} Full document text
   */
  getDocumentText() {
    return document.body.innerText || '';
  },
  
  /**
   * Find all positions of a word in the document
   * @param {string} word - The word to find
   * @returns {Array<number>} Array of character indices where word appears
   */
  findWordPositionsInDocument(word) {
    const docText = this.getDocumentText();
    const positions = [];
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
  },
  
  /**
   * Extract context around a word (10 words before and after)
   * @param {string} docText - Full document text
   * @param {number} wordIndex - Starting index of the word in document
   * @param {number} wordLength - Length of the word
   * @returns {Object} {text, textStartIndex, wordIndexInText}
   */
  extractWordContext(docText, wordIndex, wordLength) {
    console.log(`[WordSelector] extractWordContext: wordIndex=${wordIndex}, wordLength=${wordLength}`);
    
    // Split document into words (including whitespace for position tracking)
    const beforeText = docText.substring(0, wordIndex);
    const afterText = docText.substring(wordIndex + wordLength);
    
    // Get words before (up to 10)
    const wordsBeforeMatch = beforeText.match(/\S+/g) || [];
    const wordsBefore = wordsBeforeMatch.slice(-10);
    
    // Get words after (up to 10)
    const wordsAfterMatch = afterText.match(/\S+/g) || [];
    const wordsAfter = wordsAfterMatch.slice(0, 10);
    
    // Calculate the actual start index in document
    let textStartIndex = wordIndex;
    if (wordsBefore.length > 0) {
      // Find where the first of our 10 words before starts in the document
      // We need to find the actual position of the first word in our context
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
    const contextParts = [];
    if (wordsBefore.length > 0) {
      contextParts.push(wordsBefore.join(' '));
    }
    contextParts.push(docText.substring(wordIndex, wordIndex + wordLength));
    if (wordsAfter.length > 0) {
      contextParts.push(wordsAfter.join(' '));
    }
    
    const text = contextParts.join(' ');
    const wordIndexInText = wordsBefore.length > 0 ? wordsBefore.join(' ').length + 1 : 0;
    
    console.log(`[WordSelector] Context result: textStartIndex=${textStartIndex}, wordIndexInText=${wordIndexInText}`);
    console.log(`[WordSelector] Context text: "${text.substring(0, 100)}..."`);
    
    return {
      text,
      textStartIndex,
      wordIndexInText
    };
  },
  
  /**
   * Build API payload for word explanation
   * Algorithm: For each word, extract 10 words before and after. Merge overlapping contexts.
   * @returns {Array<Object>} Array of payload segments
   */
  buildWordsExplanationPayload() {
    console.log('[WordSelector] ===== Building Words Explanation Payload =====');
    const docText = this.getDocumentText();
    const selectedWordsArray = Array.from(this.selectedWords);
    
    console.log('[WordSelector] Selected words:', selectedWordsArray);
    console.log('[WordSelector] Document text length:', docText.length);
    
    // Build position data for each word
    const wordDataList = [];
    
    for (const word of selectedWordsArray) {
      console.log(`[WordSelector] Processing word: "${word}"`);
      const highlights = this.wordToHighlights.get(word);
      
      if (!highlights || highlights.size === 0) {
        console.warn(`[WordSelector] No highlights found for word: "${word}"`);
        continue;
      }
      
      console.log(`[WordSelector] Found ${highlights.size} highlight(s) for word: "${word}"`);
      
      // Find all positions of this word in document
      const positions = this.findWordPositionsInDocument(word);
      console.log(`[WordSelector] Found ${positions.length} position(s) in document for word: "${word}"`, positions);
      
      // For each highlight, find its position
      let highlightIndex = 0;
      highlights.forEach(highlight => {
        highlightIndex++;
        const highlightText = highlight.textContent.replace(/\s+/g, ' ').trim();
        console.log(`[WordSelector] Processing highlight #${highlightIndex} for "${word}": text="${highlightText}"`);
        
        // Try to match this highlight to a position
        // We'll use the first available position for simplicity
        if (positions.length > 0) {
          const position = positions.shift(); // Take first position
          const context = this.extractWordContext(docText, position, word.length);
          
          console.log(`[WordSelector] Assigned position ${position} to highlight #${highlightIndex}`);
          console.log(`[WordSelector] Context: textStartIndex=${context.textStartIndex}, text="${context.text.substring(0, 50)}..."`);
          
          wordDataList.push({
            word: word,
            textStartIndex: context.textStartIndex,
            text: context.text,
            wordIndexInContext: context.wordIndexInText,
            wordLength: word.length,
            highlight: highlight
          });
        } else {
          console.warn(`[WordSelector] No more positions available for highlight #${highlightIndex} of word "${word}"`);
        }
      });
    }
    
    console.log('[WordSelector] Total word data entries created:', wordDataList.length);
    
    // Sort by textStartIndex (document order)
    wordDataList.sort((a, b) => a.textStartIndex - b.textStartIndex);
    console.log('[WordSelector] Sorted word data by position');
    
    // Merge overlapping contexts
    const mergedSegments = [];
    let currentSegment = null;
    
    for (const wordData of wordDataList) {
      if (!currentSegment) {
        // Start new segment
        console.log(`[WordSelector] Starting new segment with word "${wordData.word}" at position ${wordData.textStartIndex}`);
        currentSegment = {
          textStartIndex: wordData.textStartIndex,
          text: wordData.text,
          important_words_location: [{
            word: wordData.word,
            index: wordData.wordIndexInContext,
            length: wordData.wordLength
          }],
          wordHighlights: [wordData.highlight]
        };
      } else {
        const currentEnd = currentSegment.textStartIndex + currentSegment.text.length;
        const newStart = wordData.textStartIndex;
        const newEnd = newStart + wordData.text.length;
        
        // Check if overlapping or adjacent
        if (newStart <= currentEnd + 20) { // Allow 20 char gap for merging
          console.log(`[WordSelector] Merging word "${wordData.word}" into current segment (overlap detected)`);
          // Merge: extend current segment
          const mergedStart = Math.min(currentSegment.textStartIndex, newStart);
          const mergedEnd = Math.max(currentEnd, newEnd);
          
          // Recalculate text from document
          currentSegment.text = docText.substring(mergedStart, mergedEnd);
          currentSegment.textStartIndex = mergedStart;
          
          // Add word location (recalculate index in merged text)
          const wordIndexInMerged = wordData.textStartIndex + wordData.wordIndexInContext - mergedStart;
          currentSegment.important_words_location.push({
            word: wordData.word,
            index: wordIndexInMerged,
            length: wordData.wordLength
          });
          currentSegment.wordHighlights.push(wordData.highlight);
        } else {
          // No overlap, save current and start new
          console.log(`[WordSelector] No overlap - saving current segment and starting new one for word "${wordData.word}"`);
          mergedSegments.push(currentSegment);
          currentSegment = {
            textStartIndex: wordData.textStartIndex,
            text: wordData.text,
            important_words_location: [{
              word: wordData.word,
              index: wordData.wordIndexInContext,
              length: wordData.wordLength
            }],
            wordHighlights: [wordData.highlight]
          };
        }
      }
    }
    
    // Add last segment
    if (currentSegment) {
      console.log('[WordSelector] Adding final segment');
      mergedSegments.push(currentSegment);
    }
    
    console.log(`[WordSelector] Created ${mergedSegments.length} merged segment(s)`);
    mergedSegments.forEach((segment, idx) => {
      console.log(`[WordSelector] Segment ${idx + 1}: textStartIndex=${segment.textStartIndex}, words=${segment.important_words_location.length}, highlights=${segment.wordHighlights.length}`);
      console.log(`[WordSelector] Segment ${idx + 1} words:`, segment.important_words_location.map(w => w.word));
    });
    
    // Return payload (remove wordHighlights from API payload, keep for internal use)
    const payload = mergedSegments.map(segment => ({
      textStartIndex: segment.textStartIndex,
      text: segment.text,
      important_words_location: segment.important_words_location,
      _wordHighlights: segment.wordHighlights // Keep for internal tracking
    }));
    
    console.log('[WordSelector] ===== Payload Build Complete =====');
    return payload;
  },
  
  /**
   * Create popup for word meaning
   * @param {string} word - The word
   * @param {string} meaning - The meaning
   * @param {Array<string>} examples - Example sentences
   * @param {boolean} shouldAllowFetchMoreExamples - Whether to show the "View more examples" button
   * @param {string|null} languageCode - Language code from API response (e.g., "EN"). If "EN", shows speaker icon for pronunciation
   * @returns {HTMLElement} Popup element
   */
  createWordPopup(word, meaning, examples, shouldAllowFetchMoreExamples = true, languageCode = null) {
    const popup = document.createElement('div');
    popup.className = 'vocab-word-popup';
    popup.setAttribute('data-word', word.toLowerCase());
    
    // Add inline styles to ensure popup is visible and not overridden by website CSS
    popup.style.setProperty('position', 'absolute', 'important');
    popup.style.setProperty('z-index', '10000010', 'important');
    popup.style.setProperty('display', 'block', 'important');
    popup.style.setProperty('visibility', 'visible', 'important');
    popup.style.setProperty('opacity', '0', 'important'); // Will be set to 1 when visible class is added
    popup.style.setProperty('pointer-events', 'none', 'important'); // Will be set to 'all' when visible
    
    // Meaning
    const meaningDiv = document.createElement('div');
    meaningDiv.className = 'vocab-word-popup-meaning';
    meaningDiv.innerHTML = `<span class="word-bold">${word}</span> means ${meaning}`;
    popup.appendChild(meaningDiv);
    
    // Examples container
    const examplesContainer = document.createElement('div');
    examplesContainer.className = 'vocab-word-popup-examples-container';
    
    if (examples && examples.length > 0) {
      const examplesList = document.createElement('ul');
      examplesList.className = 'vocab-word-popup-examples';
      examplesList.id = `vocab-word-examples-${word.toLowerCase()}`;
      
      examples.forEach(example => {
        const li = document.createElement('li');
        // Bold the word in examples
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const highlightedExample = example.replace(regex, `<span class="word-bold">${word}</span>`);
        li.innerHTML = highlightedExample;
        examplesList.appendChild(li);
      });
      
      examplesContainer.appendChild(examplesList);
    }
    
    popup.appendChild(examplesContainer);
    
    // Store original meaning and examples for translation
    popup.setAttribute('data-original-meaning', meaning);
    popup.setAttribute('data-original-examples', JSON.stringify(examples));
    popup.setAttribute('data-language-code', languageCode || '');
    popup.setAttribute('data-current-tab', languageCode || 'EN'); // Track current active tab
    
    // Create bottom container for speaker icon, tab group, and button
    const bottomContainer = document.createElement('div');
    bottomContainer.className = 'vocab-word-popup-bottom-container';
    
    // Speaker icon for pronunciation - only show if languageCode is "EN"
    // Add it to bottom container at the leftmost position
    if (languageCode === 'EN') {
      const speakerBtn = document.createElement('button');
      speakerBtn.className = 'vocab-word-popup-speaker';
      speakerBtn.setAttribute('aria-label', `Pronounce "${word}"`);
      speakerBtn.innerHTML = this.createSpeakerIcon();
      speakerBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await this.handlePronunciation(word, speakerBtn);
      });
      bottomContainer.appendChild(speakerBtn);
      // Add class to popup to indicate speaker icon exists
      popup.classList.add('has-speaker-icon');
    }
    
    // Language tab group - show if languageCode is not "EN"
    if (languageCode && languageCode !== 'EN') {
      const tabGroup = document.createElement('div');
      tabGroup.className = 'vocab-word-popup-tab-group';
      
      // Local language tab (initially active)
      const localTab = document.createElement('button');
      localTab.className = 'vocab-word-popup-tab vocab-word-popup-tab-active';
      localTab.textContent = languageCode;
      localTab.setAttribute('data-tab', languageCode);
      localTab.setAttribute('aria-label', `Show ${languageCode} content`);
      localTab.addEventListener('click', async (e) => {
        e.stopPropagation();
        // Only switch if not already active
        if (!localTab.classList.contains('vocab-word-popup-tab-active')) {
          await this.switchLanguageTab(popup, word, languageCode, localTab, enTab, languageCode);
        }
      });
      
      // EN tab
      const enTab = document.createElement('button');
      enTab.className = 'vocab-word-popup-tab';
      enTab.textContent = 'EN';
      enTab.setAttribute('data-tab', 'EN');
      enTab.setAttribute('aria-label', 'Show English content');
      enTab.addEventListener('click', async (e) => {
        e.stopPropagation();
        // Only switch if not already active
        if (!enTab.classList.contains('vocab-word-popup-tab-active')) {
          await this.switchLanguageTab(popup, word, languageCode, localTab, enTab, 'EN');
        }
      });
      
      tabGroup.appendChild(localTab);
      tabGroup.appendChild(enTab);
      bottomContainer.appendChild(tabGroup);
      
      // Set initial active tab for CSS sliding animation
      tabGroup.setAttribute('data-active-tab', languageCode);
      
      // Store tab references for later use
      popup.setAttribute('data-local-tab', '');
      popup.setAttribute('data-en-tab', '');
    }
    
    // View more button - bigger, bottom-right positioned
    const button = document.createElement('button');
    button.className = 'vocab-word-popup-button';
    button.textContent = 'Get more examples';
    button.setAttribute('data-word', word.toLowerCase());
    button.setAttribute('data-meaning', meaning);
    
    // Check if tabs exist (languageCode is not "EN" and not null)
    const hasTabs = languageCode && languageCode !== 'EN';
    const currentTab = popup.getAttribute('data-current-tab');
    const isEnTabActive = currentTab === 'EN';
    
    // Set initial button visibility:
    // - If tabs exist and EN tab is active: always hide
    // - If tabs exist and local language tab is active: show based on shouldAllowFetchMoreExamples
    // - If no tabs exist: show based on shouldAllowFetchMoreExamples
    if (hasTabs && isEnTabActive) {
      // EN tab is active, always hide button
      button.style.display = 'none';
      popup.classList.add('no-more-examples-button');
    } else if (!shouldAllowFetchMoreExamples) {
      // Local language tab active or no tabs, but shouldAllowFetchMoreExamples is false
      button.style.display = 'none';
      popup.classList.add('no-more-examples-button');
    } else {
      // Local language tab active or no tabs, and shouldAllowFetchMoreExamples is true
      button.style.display = 'block';
    }
    
    button.addEventListener('click', async (e) => {
      e.stopPropagation();
      console.log('[WordSelector] View more examples clicked for:', word);
      await this.handleViewMoreExamples(word, meaning, examples, button, popup);
    });
    bottomContainer.appendChild(button);
    
    // Append bottom container to popup
    popup.appendChild(bottomContainer);
    
    return popup;
  },
  
  /**
   * Handle "View more examples" button click
   * @param {string} word - The word
   * @param {string} meaning - The meaning
   * @param {Array<string>} currentExamples - Current examples
   * @param {HTMLElement} button - The button element
   * @param {HTMLElement} popup - The popup element
   */
  async handleViewMoreExamples(word, meaning, currentExamples, button, popup) {
    // Show loading state
    button.disabled = true;
    button.classList.add('loading');
    const originalText = button.textContent;
    button.textContent = 'Loading...';
    
    try {
      // Extract all currently displayed examples from the popup
      const examplesList = document.getElementById(`vocab-word-examples-${word.toLowerCase()}`);
      let allCurrentExamples = [];
      
      if (examplesList) {
        // Get all example text from the list items
        const listItems = examplesList.querySelectorAll('li');
        allCurrentExamples = Array.from(listItems).map(li => {
          // Remove the highlighting spans to get clean text
          const text = li.textContent || li.innerText;
          return text.trim();
        });
      }
      
      console.log('[WordSelector] Current examples in popup:', allCurrentExamples);
      console.log('[WordSelector] Original examples passed:', currentExamples);
      
      // Check current active tab to determine which language to use for API call
      const currentTab = popup ? popup.getAttribute('data-current-tab') : 'EN';
      const languageCode = popup ? popup.getAttribute('data-language-code') : '';
      const hasTabs = languageCode && languageCode !== 'EN';
      const isEnTabActive = currentTab === 'EN';
      
      // Use meaning and examples in the current tab's language for API call
      let meaningForApi = meaning;
      let examplesForApi = allCurrentExamples;
      
      if (hasTabs && popup) {
        if (isEnTabActive) {
          // If EN tab is active, get the English meaning and examples from cache
          const normalizedWord = word.toLowerCase();
          if (this.translationCache.has(normalizedWord)) {
            const cached = this.translationCache.get(normalizedWord);
            meaningForApi = cached.meaning;
            examplesForApi = cached.examples || [];
          }
        } else {
          // If local language tab is active, use original meaning and examples
          const originalMeaning = popup.getAttribute('data-original-meaning');
          const originalExamplesJson = popup.getAttribute('data-original-examples');
          if (originalMeaning) {
            meaningForApi = originalMeaning;
          }
          if (originalExamplesJson) {
            try {
              const originalExamples = JSON.parse(originalExamplesJson) || [];
              examplesForApi = originalExamples;
            } catch (e) {
              console.error('[WordSelector] Error parsing original examples for API:', e);
            }
          }
        }
      }
      
      console.log('[WordSelector] Using for API - tab:', currentTab, 'meaning:', meaningForApi, 'examples count:', examplesForApi.length);
      
      // Use meaning and examples in the current tab's language for the API call
      const response = await WordExplanationService.getMoreExplanations(word, meaningForApi, examplesForApi);
      
      if (response.success && response.data) {
        const newExamples = response.data.examples || [];
        const shouldAllowFetchMoreExamples = response.data.shouldAllowFetchMoreExamples || false;
        
        // Get original examples count to identify new examples
        const originalExamplesJson = popup ? popup.getAttribute('data-original-examples') : '[]';
        let originalExamples = [];
        try {
          originalExamples = JSON.parse(originalExamplesJson) || [];
        } catch (e) {
          console.error('[WordSelector] Error parsing original examples:', e);
        }
        
        // Determine which examples are new (added after initial load)
        const originalCount = originalExamples.length;
        const newExamplesOnly = newExamples.slice(originalCount);
        
        // If EN tab is active, new examples will be in English - store them separately
        if (isEnTabActive && newExamplesOnly.length > 0) {
          // Store English-only examples
          const existingEnExamplesJson = popup.getAttribute('data-en-examples-only') || '[]';
          let existingEnExamples = [];
          try {
            existingEnExamples = JSON.parse(existingEnExamplesJson) || [];
          } catch (e) {
            console.error('[WordSelector] Error parsing existing EN-only examples:', e);
          }
          
          // Combine with new English examples
          const allEnExamplesOnly = [...existingEnExamples, ...newExamplesOnly];
          popup.setAttribute('data-en-examples-only', JSON.stringify(allEnExamplesOnly));
          console.log('[WordSelector] Stored English-only examples:', allEnExamplesOnly);
        }
        
        // Update the examples list in the popup
        const examplesList = document.getElementById(`vocab-word-examples-${word.toLowerCase()}`);
        if (examplesList) {
          // Clear existing examples
          examplesList.innerHTML = '';
          
          // Add all examples (old + new)
          newExamples.forEach(example => {
            const li = document.createElement('li');
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            const highlightedExample = example.replace(regex, `<span class="word-bold">${word}</span>`);
            li.innerHTML = highlightedExample;
            examplesList.appendChild(li);
          });
          
          console.log('[WordSelector] Updated examples for word:', word);
        }
        
        // Update button visibility based on shouldAllowFetchMoreExamples
        if (shouldAllowFetchMoreExamples) {
          button.style.display = 'block';
          button.disabled = false;
          button.classList.remove('disabled');
        } else {
          button.style.display = 'none';
        }
        
        // Update stored word data with new examples and shouldAllowFetchMoreExamples value
        const normalizedWord = word.toLowerCase();
        if (this.explainedWords.has(normalizedWord)) {
          const wordData = this.explainedWords.get(normalizedWord);
          // If local language tab is active, update original examples
          if (!isEnTabActive && popup) {
            wordData.examples = newExamples; // Update with all examples from API response
            // Also update the data-original-examples attribute
            popup.setAttribute('data-original-examples', JSON.stringify(newExamples));
          }
          wordData.shouldAllowFetchMoreExamples = shouldAllowFetchMoreExamples;
          wordData.hasCalledGetMoreExamples = true; // Mark that API has been called
          console.log('[WordSelector] Updated examples and shouldAllowFetchMoreExamples for word:', word);
          console.log('[WordSelector] New examples count:', newExamples.length);
          console.log('[WordSelector] shouldAllowFetchMoreExamples:', shouldAllowFetchMoreExamples);
          console.log('[WordSelector] hasCalledGetMoreExamples set to true');
        }
      } else {
        console.error('[WordSelector] Failed to get more examples:', response.error);
        TextSelector.showNotification('Failed to load more examples');
      }
    } catch (error) {
      console.error('[WordSelector] Error fetching more examples:', error);
      TextSelector.showNotification('Error loading more examples');
    } finally {
      // Reset button state
      button.classList.remove('loading');
      button.textContent = originalText;
    }
  },
  
  /**
   * Switch language tab (local language <-> EN)
   * @param {HTMLElement} popup - The popup element
   * @param {string} word - The word
   * @param {string} localLanguageCode - The local language code
   * @param {HTMLElement} localTab - The local language tab element
   * @param {HTMLElement} enTab - The EN tab element
   * @param {string} targetTab - The target tab to switch to ('EN' or localLanguageCode)
   */
  async switchLanguageTab(popup, word, localLanguageCode, localTab, enTab, targetTab) {
    const normalizedWord = word.toLowerCase();
    const currentTab = popup.getAttribute('data-current-tab');
    
    // If already on the target tab, do nothing
    if (currentTab === targetTab) {
      console.log('[WordSelector] Already on target tab, no action needed');
      return;
    }
    
    console.log('[WordSelector] Switching language tab:', {
      word: word,
      currentTab: currentTab,
      targetTab: targetTab,
      localLanguageCode: localLanguageCode
    });
    
    // Update tab group data attribute for sliding animation
    const tabGroup = popup.querySelector('.vocab-word-popup-tab-group');
    if (tabGroup) {
      tabGroup.setAttribute('data-active-tab', targetTab);
    }
    
    // Update tab active classes immediately for visual feedback
    if (targetTab === localLanguageCode) {
      localTab.classList.add('vocab-word-popup-tab-active');
      enTab.classList.remove('vocab-word-popup-tab-active');
    } else {
      enTab.classList.add('vocab-word-popup-tab-active');
      localTab.classList.remove('vocab-word-popup-tab-active');
    }
    
    // Wait for slide animation to complete before showing spinner
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // If switching to local language, show original content
    if (targetTab === localLanguageCode) {
      const originalMeaning = popup.getAttribute('data-original-meaning');
      const originalExamplesJson = popup.getAttribute('data-original-examples');
      let originalExamples = [];
      
      try {
        originalExamples = JSON.parse(originalExamplesJson) || [];
      } catch (e) {
        console.error('[WordSelector] Error parsing original examples:', e);
      }
      
      // Get current English examples from cache to compare counts
      let cachedEnExamples = [];
      if (this.translationCache.has(normalizedWord)) {
        const cached = this.translationCache.get(normalizedWord);
        cachedEnExamples = cached.examples || [];
      }
      
      // Check if there are English-only examples that need translation
      const enExamplesJson = popup.getAttribute('data-en-examples-only') || '[]';
      let enExamplesOnly = [];
      try {
        enExamplesOnly = JSON.parse(enExamplesJson) || [];
      } catch (e) {
        console.error('[WordSelector] Error parsing EN-only examples:', e);
      }
      
      // Compare example counts: if English has more examples than original, translate the new ones
      const totalEnExamples = cachedEnExamples.length + enExamplesOnly.length;
      const needsTranslation = totalEnExamples > originalExamples.length;
      
      if (needsTranslation) {
        console.log('[WordSelector] Example count mismatch - original:', originalExamples.length, 'total EN:', totalEnExamples);
        console.log('[WordSelector] Translating new English examples to local language');
        
        // Get the examples that need translation (the ones beyond original count)
        const examplesToTranslate = totalEnExamples > originalExamples.length 
          ? cachedEnExamples.slice(originalExamples.length) 
          : [];
        
        // Also include any English-only examples
        const allExamplesToTranslate = [...examplesToTranslate, ...enExamplesOnly];
        
        if (allExamplesToTranslate.length > 0) {
          console.log('[WordSelector] Translating new English examples to local language:', allExamplesToTranslate);
          
          // Show loading on local tab after slide animation
          localTab.disabled = true;
          localTab.classList.add('loading');
          const originalTabText = localTab.textContent;
          localTab.innerHTML = '<div class="vocab-loading-spinner" style="width: 10px; height: 10px; border: 2px solid white; border-top-color: transparent; border-radius: 50%; animation: vocab-spin 0.8s linear infinite;"></div>';
          
          try {
            // Translate new English examples to local language
            const payload = {
              targetLangugeCode: localLanguageCode,
              texts: allExamplesToTranslate
            };
            
            const url = `${ApiConfig.getCurrentBaseUrl()}${ApiConfig.ENDPOINTS.TRANSLATE}`;
            const response = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(payload)
            });
            
            if (response.ok) {
              const data = await response.json();
              const translatedNewExamples = data.translatedTexts || [];
              
              // Combine original examples with translated new examples
              const allExamples = [...originalExamples, ...translatedNewExamples];
              
              // Update popup with local language content
              this.updatePopupContent(popup, word, originalMeaning, allExamples);
              
              // Update original examples to include translated new examples
              popup.setAttribute('data-original-examples', JSON.stringify(allExamples));
              
              // Update stored word data
              const normalizedWord = word.toLowerCase();
              if (this.explainedWords.has(normalizedWord)) {
                const wordData = this.explainedWords.get(normalizedWord);
                wordData.examples = allExamples;
              }
              
              // Clear English-only examples since they're now translated
              popup.removeAttribute('data-en-examples-only');
              
              // Update cache to reflect the new count
              if (this.translationCache.has(normalizedWord)) {
                const cached = this.translationCache.get(normalizedWord);
                // Keep the same meaning, but update examples count awareness
                // The cache will be updated when switching back to EN
              }
            } else {
              // If translation fails, just show original examples
              this.updatePopupContent(popup, word, originalMeaning, originalExamples);
            }
          } catch (error) {
            console.error('[WordSelector] Error translating new English examples:', error);
            // Fallback to original examples
            this.updatePopupContent(popup, word, originalMeaning, originalExamples);
          } finally {
            localTab.disabled = false;
            localTab.classList.remove('loading');
            localTab.textContent = originalTabText;
          }
        } else {
          // No examples to translate, just show original content
          this.updatePopupContent(popup, word, originalMeaning, originalExamples);
        }
      } else {
        // No translation needed, just show original content
        this.updatePopupContent(popup, word, originalMeaning, originalExamples);
      }
      
      // Update current tab attribute
      popup.setAttribute('data-current-tab', localLanguageCode);
      
      // Update button visibility: show button when local language tab is active
      const button = popup.querySelector('.vocab-word-popup-button');
      if (button) {
        // Get shouldAllowFetchMoreExamples from wordData
        const normalizedWord = word.toLowerCase();
        let shouldAllowFetchMoreExamples = true;
        if (this.explainedWords.has(normalizedWord)) {
          const wordData = this.explainedWords.get(normalizedWord);
          if (wordData.hasCalledGetMoreExamples) {
            shouldAllowFetchMoreExamples = wordData.shouldAllowFetchMoreExamples || false;
          }
        }
        
        if (shouldAllowFetchMoreExamples) {
          button.style.display = 'block';
          popup.classList.remove('no-more-examples-button');
        } else {
          button.style.display = 'none';
          popup.classList.add('no-more-examples-button');
        }
      }
      
    } else {
      // Switching to EN - translate to English
      const originalMeaning = popup.getAttribute('data-original-meaning');
      const originalExamplesJson = popup.getAttribute('data-original-examples');
      let originalExamples = [];
      
      try {
        originalExamples = JSON.parse(originalExamplesJson) || [];
      } catch (e) {
        console.error('[WordSelector] Error parsing original examples:', e);
      }
      
      // Show loading on EN tab after slide animation
      enTab.disabled = true;
      enTab.classList.add('loading');
      const originalTabText = enTab.textContent;
      enTab.innerHTML = '<div class="vocab-loading-spinner" style="width: 10px; height: 10px; border: 2px solid white; border-top-color: transparent; border-radius: 50%; animation: vocab-spin 0.8s linear infinite;"></div>';
      
      try {
        // Check cache first
        let translatedMeaning, translatedExamples;
        
        if (this.translationCache.has(normalizedWord)) {
          console.log('[WordSelector] Using cached translation for:', word);
          const cached = this.translationCache.get(normalizedWord);
          translatedMeaning = cached.meaning;
          translatedExamples = cached.examples;
          
          // Compare number of examples: if original has more examples than cached, re-translate
          if (originalExamples.length !== translatedExamples.length) {
            console.log('[WordSelector] Example count mismatch - original:', originalExamples.length, 'cached EN:', translatedExamples.length);
            console.log('[WordSelector] Re-translating all examples to English');
            
            // Clear cache and re-translate
            this.translationCache.delete(normalizedWord);
            translatedMeaning = null;
            translatedExamples = null;
          }
        }
        
        // If no cache or cache was invalid, translate
        if (!translatedMeaning || !translatedExamples) {
          // Prepare API payload - combine explanation_text and examples into texts array
          const texts = [originalMeaning, ...originalExamples];
          const payload = {
            targetLangugeCode: "EN",
            texts: texts
          };
          
          console.log('[WordSelector] Calling translate API with payload:', payload);
          
          // Call translate API
          const url = `${ApiConfig.getCurrentBaseUrl()}${ApiConfig.ENDPOINTS.TRANSLATE}`;
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          });
          
          if (!response.ok) {
            throw new Error(`Translation API failed: ${response.status} ${response.statusText}`);
          }
          
          const data = await response.json();
          console.log('[WordSelector] Translation API response:', data);
          
          // Extract translated meaning and examples from translatedTexts array
          const translatedTexts = data.translatedTexts || [];
          translatedMeaning = translatedTexts[0] || originalMeaning;
          translatedExamples = translatedTexts.slice(1) || [];
          
          // Cache the translation
          this.translationCache.set(normalizedWord, {
            meaning: translatedMeaning,
            examples: translatedExamples
          });
          
          console.log('[WordSelector] Translation cached for:', word);
        }
        
        // Update popup with English content
        this.updatePopupContent(popup, word, translatedMeaning, translatedExamples);
        
        // Update current tab attribute
        popup.setAttribute('data-current-tab', 'EN');
        
        // Update button visibility: always hide button when EN tab is active
        const button = popup.querySelector('.vocab-word-popup-button');
        if (button) {
          button.style.display = 'none';
          popup.classList.add('no-more-examples-button');
        }
        
      } catch (error) {
        console.error('[WordSelector] Error translating to English:', error);
        alert('Failed to translate to English. Please try again.');
      } finally {
        enTab.disabled = false;
        enTab.classList.remove('loading');
        enTab.textContent = originalTabText;
      }
    }
  },
  
  /**
   * Update popup content with text (meaning and examples)
   * @param {HTMLElement} popup - The popup element
   * @param {string} word - The word
   * @param {string} meaning - The meaning to display
   * @param {Array<string>} examples - The examples to display
   */
  updatePopupContent(popup, word, meaning, examples) {
    // Update meaning
    const meaningDiv = popup.querySelector('.vocab-word-popup-meaning');
    if (meaningDiv) {
      meaningDiv.innerHTML = `<span class="word-bold">${word}</span> means ${meaning}`;
    }
    
    // Update examples
    const examplesList = popup.querySelector('.vocab-word-popup-examples');
    if (examplesList) {
      examplesList.innerHTML = '';
      if (examples && examples.length > 0) {
        examples.forEach(example => {
          const li = document.createElement('li');
          const regex = new RegExp(`\\b${word}\\b`, 'gi');
          const highlightedExample = example.replace(regex, `<span class="word-bold">${word}</span>`);
          li.innerHTML = highlightedExample;
          examplesList.appendChild(li);
        });
      }
    }
    
    console.log('[WordSelector] Popup content updated');
  },
  
  /**
   * Position popup relative to word highlight
   * @param {HTMLElement} popup - The popup element
   * @param {HTMLElement} wordElement - The word highlight element
   */
  positionPopup(popup, wordElement) {
    console.log('[WordSelector] ===== POSITIONING POPUP =====');
    
    // Validate inputs
    if (!popup || !wordElement) {
      console.error('[WordSelector] ✗ Invalid inputs for positionPopup:', { popup, wordElement });
      return;
    }
    
    if (!document.body.contains(wordElement)) {
      console.error('[WordSelector] ✗ wordElement is not in DOM');
      return;
    }
    
    if (!document.body.contains(popup)) {
      console.error('[WordSelector] ✗ popup is not in DOM');
      return;
    }
    
    const rect = wordElement.getBoundingClientRect();
    console.log('[WordSelector] Word element bounding rect:', {
      top: rect.top,
      left: rect.left,
      bottom: rect.bottom,
      right: rect.right,
      width: rect.width,
      height: rect.height,
      scrollY: window.scrollY,
      scrollX: window.scrollX
    });
    
    // Check if element is visible
    if (rect.width === 0 || rect.height === 0) {
      console.warn('[WordSelector] ⚠ Word element has zero dimensions, may not be visible');
    }
    
    const popupHeight = popup.offsetHeight || 250; // Estimated height
    const popupWidth = popup.offsetWidth || 340;
    
    console.log('[WordSelector] Popup dimensions:', {
      width: popupWidth,
      height: popupHeight,
      offsetWidth: popup.offsetWidth,
      offsetHeight: popup.offsetHeight
    });
    
    // Calculate position (bottom-right of word, not overlapping)
    let top = rect.bottom + window.scrollY + 8; // 8px gap below word
    let left = rect.right + window.scrollX - popupWidth / 2; // Center horizontally with word
    
    console.log('[WordSelector] Initial calculated position:', { top, left });
    
    // Adjust if popup goes off-screen
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    console.log('[WordSelector] Viewport dimensions:', {
      width: viewportWidth,
      height: viewportHeight
    });
    
    // Horizontal adjustment
    if (left + popupWidth > viewportWidth + window.scrollX) {
      const oldLeft = left;
      left = viewportWidth + window.scrollX - popupWidth - 10;
      console.log('[WordSelector] Adjusted left (right edge):', { oldLeft, newLeft: left });
    }
    if (left < window.scrollX + 10) {
      const oldLeft = left;
      left = window.scrollX + 10;
      console.log('[WordSelector] Adjusted left (left edge):', { oldLeft, newLeft: left });
    }
    
    // Vertical adjustment (if not enough space below, show above)
    if (rect.bottom + popupHeight > viewportHeight + window.scrollY) {
      const oldTop = top;
      top = rect.top + window.scrollY - popupHeight - 8; // Show above
      console.log('[WordSelector] Adjusted top (showing above):', { oldTop, newTop: top });
    }
    
    popup.style.top = `${top}px`;
    popup.style.left = `${left}px`;
    
    console.log('[WordSelector] ✓ Final popup position set:', {
      top: `${top}px`,
      left: `${left}px`,
      styleTop: popup.style.top,
      styleLeft: popup.style.left
    });
  },
  
  /**
   * Show popup for word (hover or click)
   * @param {HTMLElement} wordElement - The word highlight element
   * @param {boolean} sticky - Whether popup should stay (click) or disappear on mouseleave (hover)
   */
  showWordPopup(wordElement, sticky = false) {
    console.log('[WordSelector] ===== SHOW WORD POPUP CALLED =====');
    console.log('[WordSelector] Parameters:', {
      wordElement: wordElement,
      sticky: sticky,
      isInDOM: wordElement ? document.body.contains(wordElement) : false,
      elementClasses: wordElement ? wordElement.className : 'N/A',
      elementText: wordElement ? wordElement.textContent.trim() : 'N/A'
    });
    
    // Validate wordElement
    if (!wordElement) {
      console.error('[WordSelector] ✗ showWordPopup called with null/undefined wordElement');
      return;
    }
    
    if (!document.body.contains(wordElement)) {
      console.error('[WordSelector] ✗ wordElement is not in DOM');
      console.error('[WordSelector] Element:', wordElement);
      return;
    }
    
    // Remove any existing popups
    this.hideAllPopups();
    
    const word = wordElement.textContent.trim();
    const normalizedWord = word.toLowerCase();
    
    console.log('[WordSelector] Extracted word data:', {
      word: word,
      normalizedWord: normalizedWord,
      elementHasExplainedClass: wordElement.classList.contains('vocab-word-explained')
    });
    
    // Get word data from explainedWords map (this contains the most up-to-date data)
    let wordData = null;
    let meaning = '';
    let examples = [];
    let shouldAllowFetchMoreExamples = true; // Default to true
    let languageCode = null;
    
    if (this.explainedWords.has(normalizedWord)) {
      wordData = this.explainedWords.get(normalizedWord);
      meaning = wordData.meaning;
      examples = wordData.examples || [];
      languageCode = wordData.languageCode || null;
      
      // IMPORTANT: Always use original content from explainedWords, never use cached translations
      // The translation cache is only used when switching tabs, not for initial display
      
      // If get-more-explanations API has been called, use the field from response
      // Otherwise, show button by default
      if (wordData.hasCalledGetMoreExamples) {
        shouldAllowFetchMoreExamples = wordData.shouldAllowFetchMoreExamples || false;
      } else {
        shouldAllowFetchMoreExamples = true; // Show by default before first API call
      }
      
      console.log(`[WordSelector] ✓ Using updated data from explainedWords for "${word}":`, {
        meaning: meaning,
        examplesCount: examples.length,
        shouldAllowFetchMoreExamples: shouldAllowFetchMoreExamples,
        hasCalledGetMoreExamples: wordData.hasCalledGetMoreExamples,
        languageCode: languageCode
      });
    } else {
      // Fallback to DOM attributes if not found in explainedWords (shouldn't happen normally)
      console.warn(`[WordSelector] ⚠ Word "${word}" not found in explainedWords, using DOM attributes as fallback`);
      console.warn(`[WordSelector] Available words in explainedWords:`, Array.from(this.explainedWords.keys()));
      meaning = wordElement.getAttribute('data-meaning');
      const examplesJson = wordElement.getAttribute('data-examples');
      
      if (!meaning) {
        console.error('[WordSelector] ✗ No meaning found in DOM attributes either, cannot show popup');
        console.error('[WordSelector] Element attributes:', {
          dataWord: wordElement.getAttribute('data-word'),
          dataMeaning: wordElement.getAttribute('data-meaning'),
          dataExamples: wordElement.getAttribute('data-examples')
        });
        return;
      }
      
      try {
        examples = JSON.parse(examplesJson) || [];
      } catch (e) {
        console.error('[WordSelector] Error parsing examples:', e);
      }
    }
    
    if (!meaning) {
      console.error('[WordSelector] ✗ No meaning available, cannot show popup');
      return;
    }
    
    console.log('[WordSelector] ✓ Meaning found, proceeding to create popup');
    
    // Create popup
    console.log('[WordSelector] Creating popup element...');
    // Use languageCode from wordData (already extracted above)
    console.log('[WordSelector] Language code for popup:', languageCode);
    // IMPORTANT: Always pass original meaning and examples, never cached translations
    const popup = this.createWordPopup(word, meaning, examples, shouldAllowFetchMoreExamples, languageCode);
    
    if (!popup) {
      console.error('[WordSelector] ✗ Failed to create popup element');
      return;
    }
    
    console.log('[WordSelector] ✓ Popup element created');
    
    // Mark as sticky or not
    if (sticky) {
      popup.classList.add('sticky');
      popup.setAttribute('data-sticky', 'true');
      console.log('[WordSelector] Popup marked as sticky');
    } else {
      popup.setAttribute('data-sticky', 'false');
      console.log('[WordSelector] Popup marked as non-sticky (hover mode)');
    }
    
    // Append to body
    console.log('[WordSelector] Appending popup to document.body...');
    try {
      document.body.appendChild(popup);
      console.log('[WordSelector] ✓ Popup appended to body');
    } catch (error) {
      console.error('[WordSelector] ✗ Failed to append popup to body:', error);
      return;
    }
    
    // Verify popup is in DOM
    if (!document.body.contains(popup)) {
      console.error('[WordSelector] ✗ Popup was not successfully added to DOM');
      return;
    }
    
    // Position it and animate from word element
    setTimeout(() => {
      console.log('[WordSelector] Positioning popup...');
      try {
        const wordRect = wordElement.getBoundingClientRect();
        console.log('[WordSelector] Word element position:', {
          top: wordRect.top,
          left: wordRect.left,
          bottom: wordRect.bottom,
          right: wordRect.right,
          width: wordRect.width,
          height: wordRect.height,
          isVisible: wordRect.width > 0 && wordRect.height > 0
        });
        
        // Calculate final position first
        this.positionPopup(popup, wordElement);
        
        // Get final position after positioning (in viewport coordinates)
        const popupRect = popup.getBoundingClientRect();
        const popupCenterX = popupRect.left + popupRect.width / 2;
        const popupCenterY = popupRect.top + popupRect.height / 2;
        
        // Calculate word element center (in viewport coordinates)
        const wordCenterX = wordRect.left + wordRect.width / 2;
        const wordCenterY = wordRect.top + wordRect.height / 2;
        
        // Calculate offset from popup's center to word center (in viewport coordinates)
        // Since transform translate() is relative to the element's position,
        // we need the offset from the popup's current center to the word center
        const startX = wordCenterX - popupCenterX;
        const startY = wordCenterY - popupCenterY;
        
        console.log('[WordSelector] Animation positions:', {
          wordRect: {
            left: wordRect.left,
            top: wordRect.top,
            width: wordRect.width,
            height: wordRect.height
          },
          wordCenter: {
            x: wordCenterX,
            y: wordCenterY
          },
          popupRect: {
            left: popupRect.left,
            top: popupRect.top,
            width: popupRect.width,
            height: popupRect.height
          },
          popupCenter: {
            x: popupCenterX,
            y: popupCenterY
          },
          startOffset: {
            x: startX,
            y: startY
          }
        });
        
        // Set CSS variables for animation
        popup.style.setProperty('--expand-start-transform', `translate(${startX}px, ${startY}px) scale(0)`);
        popup.style.setProperty('--expand-end-transform', `translate(0, 0) scale(1)`);
        
        // Force a reflow to ensure initial position is set
        popup.offsetHeight;
        
        // Add expanding class to trigger animation
        popup.classList.add('expanding');
        
        // Add visible class immediately (but animation will override transform)
        popup.classList.add('visible');
        
        // Ensure inline styles are set correctly for visibility
        popup.style.setProperty('opacity', '1', 'important');
        
        console.log('[WordSelector] ✓ Popup animation started');
        
        // Remove expanding class after animation completes and restore normal state
        setTimeout(() => {
          // Set final transform explicitly to ensure popup stays in position
          popup.style.setProperty('transform', 'translate(0, 0) scale(1)');
          // Remove expanding class after transform is set
          popup.classList.remove('expanding');
          // Restore transition for normal interactions
          popup.style.setProperty('transition', '');
          // Clean up CSS variables
          popup.style.removeProperty('--expand-start-transform');
          popup.style.removeProperty('--expand-end-transform');
          // Re-enable pointer events
          popup.style.setProperty('pointer-events', 'all', 'important');
          popup.style.setProperty('will-change', '');
          
          console.log('[WordSelector] ✓ Popup animation completed');
        }, 400); // Match animation duration (0.4s)
        
        // Verify popup is actually visible
        setTimeout(() => {
          const finalRect = popup.getBoundingClientRect();
          const finalStyle = window.getComputedStyle(popup);
          console.log('[WordSelector] Final popup state:', {
            isInDOM: document.body.contains(popup),
            hasVisibleClass: popup.classList.contains('visible'),
            display: finalStyle.display,
            visibility: finalStyle.visibility,
            opacity: finalStyle.opacity,
            zIndex: finalStyle.zIndex,
            position: finalStyle.position,
            top: finalStyle.top,
            left: finalStyle.left,
            width: finalRect.width,
            height: finalRect.height,
            isVisible: finalRect.width > 0 && finalRect.height > 0 && finalStyle.display !== 'none' && finalStyle.visibility !== 'hidden' && parseFloat(finalStyle.opacity) > 0
          });
          
          if (finalRect.width === 0 || finalRect.height === 0 || finalStyle.display === 'none' || finalStyle.visibility === 'hidden' || parseFloat(finalStyle.opacity) === 0) {
            console.error('[WordSelector] ✗ Popup is not visible! This might be due to website CSS interference.');
            console.error('[WordSelector] Check if website has CSS that hides elements or overrides z-index');
            console.error('[WordSelector] Attempting to force visibility with inline styles...');
            
            // Force visibility with inline styles
            popup.style.setProperty('display', 'block', 'important');
            popup.style.setProperty('visibility', 'visible', 'important');
            popup.style.setProperty('opacity', '1', 'important');
            popup.style.setProperty('z-index', '10000010', 'important');
            popup.style.setProperty('position', 'absolute', 'important');
          }
        }, 50);
      } catch (error) {
        console.error('[WordSelector] ✗ Error during popup positioning:', error);
      }
    }, 10);
    
    // Store reference
    wordElement.setAttribute('data-popup-id', 'active');
    
    // Set boolean flag to true (popup is now open)
    // normalizedWord is already declared above at line 2345
    this.wordPopupOpen.set(normalizedWord, true);
    
    console.log('[WordSelector] ✓ Popup reference stored on word element');
    console.log('[WordSelector] ✓ Popup open flag set to true for:', normalizedWord);
    
    // Add mouse event handlers to prevent popup from closing when moving cursor into it
    if (sticky) {
      popup.addEventListener('mouseenter', (e) => {
        e.stopPropagation();
        console.log('[WordSelector] Mouse entered sticky popup');
        // Mark popup as having mouse inside to prevent global click handler from closing it
        popup.setAttribute('data-mouse-inside', 'true');
      });
      
      popup.addEventListener('mouseleave', (e) => {
        e.stopPropagation();
        console.log('[WordSelector] Mouse left sticky popup');
        // Mark popup as not having mouse inside
        popup.setAttribute('data-mouse-inside', 'false');
        // For sticky popups, don't hide on mouseleave - only hide on outside click
      });
      
      popup.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('[WordSelector] Clicked inside sticky popup');
      });
      
      // Prevent any mouse events from bubbling up that might trigger hide
      popup.addEventListener('mousemove', (e) => {
        e.stopPropagation();
        // Ensure mouse inside flag is set when moving inside popup
        popup.setAttribute('data-mouse-inside', 'true');
      });
    }
    
    // If not sticky (hover mode), hide on mouseleave with delay
    if (!sticky) {
      let hideTimeout = null;
      
      const scheduleHide = () => {
        hideTimeout = setTimeout(() => {
          // Double-check it's still not sticky
          if (popup.getAttribute('data-sticky') !== 'true') {
            this.hideAllPopups();
          }
        }, 200); // 200ms delay to allow moving mouse to popup
      };
      
      const cancelHide = () => {
        if (hideTimeout) {
          clearTimeout(hideTimeout);
          hideTimeout = null;
        }
      };
      
      // Hide when leaving word element
      wordElement.addEventListener('mouseleave', scheduleHide, { once: true });
      
      // Cancel hide when entering popup
      popup.addEventListener('mouseenter', () => {
        cancelHide();
      });
      
      // Schedule hide when leaving popup (only if not sticky)
      popup.addEventListener('mouseleave', () => {
        if (popup.getAttribute('data-sticky') !== 'true') {
          scheduleHide();
        }
      });
    }
    // If sticky, popup will only close on outside click (handled by global click listener)
  },
  
  /**
   * Hide all popups with animation (move to word position while scaling down)
   */
  hideAllPopups() {
    const popups = document.querySelectorAll('.vocab-word-popup');
    popups.forEach(popup => {
      // Find the associated word element
      const wordData = popup.getAttribute('data-word');
      let wordElement = null;
      
      if (wordData) {
        // Find word element with data-popup-id="active" and matching data-word
        // First try to find by data-popup-id="active"
        const activeWordElements = document.querySelectorAll('[data-popup-id="active"]');
        for (const element of activeWordElements) {
          const elementWord = element.getAttribute('data-word') || element.textContent.trim().toLowerCase();
          if (elementWord === wordData.toLowerCase()) {
            wordElement = element;
            break;
          }
        }
        
        // If not found, try to find any vocab-word-explained element with matching data-word
        if (!wordElement) {
          const allExplainedWords = document.querySelectorAll('.vocab-word-explained[data-word]');
          for (const element of allExplainedWords) {
            const elementWord = element.getAttribute('data-word');
            if (elementWord && elementWord.toLowerCase() === wordData.toLowerCase()) {
              wordElement = element;
              break;
            }
          }
        }
      }
      
      if (wordElement && document.body.contains(wordElement)) {
        // Animate popup closing: move to word position while scaling down
        this.animatePopupClose(popup, wordElement);
      } else {
        // Fallback: simple fade out if word element not found
        // Still need to clear the flag
        if (wordData) {
          const normalizedWord = wordData.toLowerCase();
          this.wordPopupOpen.set(normalizedWord, false);
          console.log('[WordSelector] ✓ Popup open flag set to false (fallback) for:', normalizedWord);
        }
        popup.classList.remove('visible');
        setTimeout(() => popup.remove(), 200);
      }
    });
    
    // Clear popup references after animation (already cleared in animatePopupClose, but keep this as fallback)
    setTimeout(() => {
      document.querySelectorAll('[data-popup-id="active"]').forEach(el => {
        el.removeAttribute('data-popup-id');
      });
      // Also remove any closing markers
      document.querySelectorAll('[data-closing="true"]').forEach(el => {
        el.removeAttribute('data-closing');
      });
    }, 400); // Match animation duration
  },
  
  /**
   * Animate popup closing: move to word position while scaling down
   * @param {HTMLElement} popup - The popup element
   * @param {HTMLElement} wordElement - The associated word element
   */
  animatePopupClose(popup, wordElement) {
    // Immediately remove the data-popup-id attribute to prevent reopening during animation
    wordElement.removeAttribute('data-popup-id');
    
    // Set boolean flag to false (popup is now closing/closed)
    const normalizedWord = wordElement.getAttribute('data-word') || wordElement.textContent.trim().toLowerCase();
    this.wordPopupOpen.set(normalizedWord, false);
    
    console.log('[WordSelector] ✓ Popup open flag set to false for:', normalizedWord);
    
    // Mark popup as closing to prevent reopening
    popup.setAttribute('data-closing', 'true');
    
    // Get current popup position
    const popupRect = popup.getBoundingClientRect();
    const popupCenterX = popupRect.left + popupRect.width / 2;
    const popupCenterY = popupRect.top + popupRect.height / 2;
    
    // Get word element position
    const wordRect = wordElement.getBoundingClientRect();
    const wordCenterX = wordRect.left + wordRect.width / 2;
    const wordCenterY = wordRect.top + wordRect.height / 2;
    
    // Calculate offset from popup center to word center
    const endX = wordCenterX - popupCenterX;
    const endY = wordCenterY - popupCenterY;
    
    console.log('[WordSelector] Closing animation positions:', {
      popupCenter: { x: popupCenterX, y: popupCenterY },
      wordCenter: { x: wordCenterX, y: wordCenterY },
      endOffset: { x: endX, y: endY }
    });
    
    // Set CSS variables for closing animation
    popup.style.setProperty('--close-start-transform', `translate(0, 0) scale(1)`);
    popup.style.setProperty('--close-end-transform', `translate(${endX}px, ${endY}px) scale(0)`);
    
    // Force a reflow
    popup.offsetHeight;
    
    // Add closing class to trigger animation
    popup.classList.add('closing');
    popup.classList.remove('visible');
    
    // Remove popup after animation completes
    setTimeout(() => {
      popup.remove();
      console.log('[WordSelector] ✓ Popup closing animation completed');
    }, 400); // Match animation duration
  },
  
  /**
   * Setup interaction handlers for explained words
   * This should be called after a word is explained
   * @param {HTMLElement} wordElement - The word highlight element
   */
  setupWordInteractions(wordElement) {
    console.log('[WordSelector] ===== SETUP WORD INTERACTIONS =====');
    console.log('[WordSelector] Setting up interactions for element:', {
      element: wordElement,
      isInDOM: document.body.contains(wordElement),
      classes: wordElement.className,
      hasExplainedClass: wordElement.classList.contains('vocab-word-explained'),
      textContent: wordElement.textContent.trim()
    });
    
    // Add mousedown handler to ensure click animation works
    wordElement.addEventListener('mousedown', (e) => {
      if (wordElement.classList.contains('vocab-word-explained')) {
        // Add a class to ensure the active state is visible
        wordElement.classList.add('vocab-word-clicking');
        setTimeout(() => {
          wordElement.classList.remove('vocab-word-clicking');
        }, 150);
      }
    });
    
    // Click: show popup (sticky) - stays visible until closed by close button or outside click
    // If popup is already open for this word, close it instead
    wordElement.addEventListener('click', (e) => {
      console.log('[WordSelector] ===== CLICK EVENT =====');
      console.log('[WordSelector] Element state:', {
        hasExplainedClass: wordElement.classList.contains('vocab-word-explained'),
        isInDOM: document.body.contains(wordElement),
        textContent: wordElement.textContent.trim(),
        eventTarget: e.target,
        eventCurrentTarget: e.currentTarget
      });
      
      if (!wordElement.classList.contains('vocab-word-explained')) {
        console.log('[WordSelector] Element does not have vocab-word-explained class, ignoring click');
        return;
      }
      
      e.stopPropagation();
      
      // Get normalized word to check popup state
      const normalizedWord = wordElement.getAttribute('data-word') || wordElement.textContent.trim().toLowerCase();
      const isPopupOpen = this.wordPopupOpen.get(normalizedWord) === true;
      
      console.log('[WordSelector] Popup state check:', {
        normalizedWord: normalizedWord,
        isPopupOpen: isPopupOpen
      });
      
      // If popup is already open for this word, close it (show closing animation)
      if (isPopupOpen) {
        console.log('[WordSelector] Popup is open for this word, closing it');
        this.hideAllPopups();
        return;
      }
      
      // If a popup is currently closing, don't open a new one
      const closingPopup = document.querySelector('.vocab-word-popup[data-closing="true"]');
      if (closingPopup) {
        console.log('[WordSelector] Popup is currently closing, ignoring click');
        return;
      }
      
      // If a sticky popup is already visible for a different word, close it first
      const activeStickyPopup = document.querySelector('.vocab-word-popup[data-sticky="true"]:not([data-closing="true"])');
      if (activeStickyPopup) {
        console.log('[WordSelector] Sticky popup already visible for different word, closing it first');
        this.hideAllPopups();
        // Small delay to ensure the previous popup is closed before showing the new one
        setTimeout(() => {
          console.log('[WordSelector] ✓ Showing sticky popup on click for new word');
          this.showWordPopup(wordElement, true);
        }, 50);
        return;
      }
      
      console.log('[WordSelector] ✓ Showing sticky popup on click (opening animation)');
      // Show sticky popup (opening animation)
      this.showWordPopup(wordElement, true);
    });
    
    console.log('[WordSelector] ✓ Word interactions setup complete');
  },
  
  /**
   * Create a green wireframe cross button for removing explained words
   * @param {string} word - The word this button will remove
   * @returns {HTMLElement}
   */
  createRemoveExplainedButton(word) {
    const normalizedWord = word.toLowerCase().trim();
    const btn = document.createElement('button');
    btn.className = 'vocab-word-remove-explained-btn';
    btn.setAttribute('aria-label', `Remove explanation for "${word}"`);
    btn.innerHTML = this.createGreenCrossIcon();
    
    // Add click handler - use normalized word for consistent lookup
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log(`[WordSelector] Green cross button clicked for word: "${word}" (normalized: "${normalizedWord}")`);
      this.removeExplainedWord(normalizedWord);
    });
    
    return btn;
  },
  
  /**
   * Create speaker icon SVG
   * @returns {string} SVG markup
   */
  createSpeakerIcon() {
    return `
      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 8v4h3l4 4V4L5 8H2z" fill="white"/>
        <path d="M13 7c.6.6 1 1.4 1 2.3s-.4 1.7-1 2.3" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M15.5 4.5c1.2 1.2 2 2.8 2 4.6s-.8 3.4-2 4.6" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    `;
  },

  /**
   * Create close icon SVG (X icon)
   * @returns {string} SVG markup
   */
  createCloseIcon() {
    return `
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 6L6 18M6 6l12 12" stroke="#A020F0" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  },

  /**
   * Create loading spinner icon SVG
   * @returns {string} SVG markup
   */
  createLoadingSpinnerIcon() {
    return `
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="vocab-loading-spinner">
        <circle cx="12" cy="12" r="10" stroke="#9F7BDB" stroke-width="2" fill="none" opacity="0.3"/>
        <path d="M12 2a10 10 0 0 1 10 10" stroke="#9F7BDB" stroke-width="2" fill="none" stroke-linecap="round">
          <animateTransform attributeName="transform" type="rotate" dur="1s" repeatCount="indefinite" values="0 12 12;360 12 12"/>
        </path>
      </svg>
    `;
  },

  /**
   * Handle pronunciation button click
   * @param {string} word - The word to pronounce
   * @param {HTMLElement} button - The speaker button element
   */
  async handlePronunciation(word, button) {
    // Check if we already have cached audio for this word
    const cacheKey = `pronunciation_${word.toLowerCase()}`;
    const cachedAudio = this.pronunciationCache?.get(cacheKey);
    
    if (cachedAudio) {
      console.log('[WordSelector] Playing cached pronunciation for:', word);
      await this.playAudio(cachedAudio);
      return;
    }
    
    // Show loading state
    button.disabled = true;
    button.classList.add('loading');
    const originalIcon = button.innerHTML;
    button.innerHTML = this.createLoadingSpinnerIcon();
    
    try {
      console.log('[WordSelector] Fetching pronunciation for:', word);
      
      const response = await fetch(`${ApiConfig.BASE_URL}/api/v2/pronunciation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          word: word,
          voice: 'alloy' // Default voice
        })
      });
      
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Too many requests. Please wait a moment and try again.');
        } else if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(`Invalid request: ${errorData.detail}`);
        } else if (response.status === 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }
      
      const audioBlob = await response.blob();
      
      // Cache the audio
      if (!this.pronunciationCache) {
        this.pronunciationCache = new Map();
      }
      this.pronunciationCache.set(cacheKey, audioBlob);
      
      // Play the audio
      await this.playAudio(audioBlob);
      
      console.log('[WordSelector] Pronunciation played successfully for:', word);
      
    } catch (error) {
      console.error('[WordSelector] Pronunciation error:', error);
      this.showErrorBanner(error.message || 'Failed to play pronunciation');
    } finally {
      // Restore button state
      button.disabled = false;
      button.classList.remove('loading');
      button.innerHTML = originalIcon;
    }
  },

  /**
   * Play audio from blob
   * @param {Blob} audioBlob - The audio blob to play
   */
  async playAudio(audioBlob) {
    // Convert blob to base64 data URL to avoid CSP violations with blob URLs
    // This works around websites that block blob: URLs in their Content Security Policy
    const base64Url = await this.blobToDataURL(audioBlob);
    const audio = new Audio(base64Url);
    audio.volume = 1.0; // Maximum volume
    
    return new Promise((resolve, reject) => {
      audio.onended = () => {
        resolve();
      };
      
      audio.onerror = (error) => {
        console.error('[WordSelector] Audio playback error:', error);
        reject(new Error('Failed to play audio. This may be due to website Content Security Policy restrictions.'));
      };
      
      audio.play().catch((error) => {
        console.error('[WordSelector] Audio play() error:', error);
        reject(error);
      });
    });
  },
  
  /**
   * Convert blob to base64 data URL
   * @param {Blob} blob - The blob to convert
   * @returns {Promise<string>} Base64 data URL
   */
  async blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result);
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsDataURL(blob);
    });
  },

  /**
   * Show error banner
   * @param {string} message - Error message to display
   */
  showErrorBanner(message) {
    // Remove existing error banner if any
    const existingBanner = document.querySelector('.vocab-error-banner');
    if (existingBanner) {
      existingBanner.remove();
    }
    
    // Create error banner
    const banner = document.createElement('div');
    banner.className = 'vocab-error-banner';
    banner.innerHTML = `
      <div class="vocab-error-content">
        <span class="vocab-error-icon">⚠️</span>
        <span class="vocab-error-message">${message}</span>
        <button class="vocab-error-close" aria-label="Close error">×</button>
      </div>
    `;
    
    // Add close functionality
    const closeBtn = banner.querySelector('.vocab-error-close');
    closeBtn.addEventListener('click', () => {
      banner.remove();
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (banner.parentNode) {
        banner.remove();
      }
    }, 5000);
    
    // Add to page
    document.body.appendChild(banner);
    
    // Animate in
    setTimeout(() => {
      banner.classList.add('visible');
    }, 10);
  },

  /**
   * Create green wireframe cross icon SVG
   * @returns {string} SVG markup
   */
  createGreenCrossIcon() {
    return `
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 2L10 10M10 2L2 10" stroke="#15803d" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  },
  
  /**
   * Remove an explained word (remove green background and from explainedWords container)
   * @param {string} word - The word to remove
   */
  removeExplainedWord(word) {
    const normalizedWord = word.toLowerCase().trim();
    
    console.log('[WordSelector] ===== REMOVING EXPLAINED WORD =====');
    console.log('[WordSelector] Original word:', word);
    console.log('[WordSelector] Normalized word:', normalizedWord);
    console.log('[WordSelector] Available explained words:', Array.from(this.explainedWords.keys()));
    
    // Get the word data from explainedWords
    const wordData = this.explainedWords.get(normalizedWord);
    
    if (!wordData) {
      console.warn('[WordSelector] ✗ Word not found in explainedWords:', normalizedWord);
      console.warn('[WordSelector] Available keys:', Array.from(this.explainedWords.keys()));
      return;
    }
    
    console.log('[WordSelector] ✓ Found word data in explainedWords:', wordData);
    
    // Remove green background and buttons from all highlights with smooth animations
    if (wordData.highlights) {
      wordData.highlights.forEach(highlight => {
        // Add disappearing animation classes (same 0.3s duration as purple highlights)
        highlight.classList.add('word-disappearing');
        
        // Add disappearing animation to green cross button
        const greenBtn = highlight.querySelector('.vocab-word-remove-explained-btn');
        if (greenBtn) {
          greenBtn.classList.add('button-disappearing');
        }
        
        // Wait for animation to complete before removing elements (0.3s same duration)
        setTimeout(() => {
          // Remove the green explained class
          highlight.classList.remove('vocab-word-explained', 'word-disappearing');
          
          // Remove the green cross button
          if (greenBtn) {
            greenBtn.remove();
          }
          
          // Remove data attributes
          highlight.removeAttribute('data-meaning');
          highlight.removeAttribute('data-examples');
          highlight.removeAttribute('data-popup-id');
          
          // Remove the highlight wrapper completely
          const parent = highlight.parentNode;
          if (parent) {
            // Move all child nodes out of the highlight wrapper
            while (highlight.firstChild) {
              parent.insertBefore(highlight.firstChild, highlight);
            }
            // Remove the empty highlight wrapper
            highlight.remove();
            // Normalize parent to merge text nodes
            parent.normalize();
          }
        }, 300); // Same duration as animation (0.3s)
      });
    }
    
    // Remove from explainedWords Map
    this.explainedWords.delete(normalizedWord);
    
    // Remove from wordToHighlights Map
    this.wordToHighlights.delete(normalizedWord);
    
    // Also remove from selectedWords if present (to allow re-selection)
    if (this.selectedWords.has(normalizedWord)) {
      this.selectedWords.delete(normalizedWord);
      console.log('[WordSelector] Also removed from selectedWords:', normalizedWord);
    }
    
    // Also remove from analysis data structure for current tab
    ButtonPanel.removeWordFromAnalysisData(normalizedWord);
    
    // Hide any open popups for this word
    this.hideAllPopups();
    
    console.log('[WordSelector] Explained word removed:', word);
    console.log('[WordSelector] Remaining explained words:', this.explainedWords.size);
    console.log('[WordSelector] Remaining selected words:', this.selectedWords.size);
    
    // Update button states
    ButtonPanel.updateButtonStatesFromSelections();
  },
  
  /**
   * Inject CSS styles for word highlights
   */
  injectStyles() {
    const styleId = 'vocab-word-selector-styles';
    
    // Check if styles already injected
    if (document.getElementById(styleId)) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Word highlight wrapper */
      .vocab-word-highlight {
        position: relative;
        display: inline;
        background-color: rgba(149, 39, 245, 0.15);
        padding: 0 4px;
        border-radius: 8px;
        border: none;
        transition: background-color 0.2s ease;
        cursor: pointer;
        line-height: inherit;
        box-decoration-break: clone;
        -webkit-box-decoration-break: clone;
        /* DO NOT set font properties - preserve all formatting from child elements */
        /* Child elements (bold, italic, spans with different font sizes) will maintain their formatting */
        /* Text nodes will inherit naturally from their original parent context */
      }
      
      .vocab-word-highlight:hover {
        background-color: rgba(149, 39, 245, 0.25);
      }
      
      /* Remove button - Clean cross icon without circle */
      .vocab-word-remove-btn {
        position: absolute;
        top: -10px;
        right: -10px;
        width: 18px;
        height: 18px;
        background-color: #FFFFFF !important; /* Fully opaque white background */
        background: #FFFFFF !important; /* Fully opaque white background */
        border: 1px solid #9527F5 !important; /* Thin purple border */
        border-radius: 50% !important; /* Circular shape */
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 1 !important; /* Fully opaque */
        transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out, scale 0.3s ease-in-out, background-color 0.2s ease, border-color 0.2s ease;
        padding: 0;
        z-index: 999999;
        box-shadow: 0 1px 3px rgba(149, 39, 245, 0.2);
        box-sizing: border-box;
      }
      
      .vocab-word-highlight:hover .vocab-word-remove-btn {
        opacity: 1 !important;
      }
      
      .vocab-word-remove-btn:hover {
        transform: scale(1.15);
        opacity: 1 !important; /* Fully opaque on hover */
        background-color: #FFFFFF !important; /* Keep fully opaque white background on hover */
        background: #FFFFFF !important; /* Keep fully opaque white background on hover */
        border-color: #7a1fd9 !important; /* Slightly darker purple border on hover */
      }
      
      .vocab-word-remove-btn:active {
        transform: scale(0.95);
      }
      
      .vocab-word-remove-btn svg {
        pointer-events: none;
        display: block;
        width: 10px;
        height: 10px;
      }
      
      /* Make sure highlight doesn't interfere with text flow */
      .vocab-word-highlight * {
        box-sizing: border-box;
      }
      
      /* Pulsating purple animation for words being processed */
      @keyframes vocab-word-loading-breathe {
        0%, 100% {
          background-color: rgba(196, 181, 253, 0.7); /* Purple with slight transparency - lighter shade */
        }
        50% {
          background-color: rgba(167, 139, 250, 0.8); /* Purple with slight transparency - darker shade */
        }
      }
      
      .vocab-word-loading {
        animation: vocab-word-loading-breathe 0.75s ease-in-out infinite;
      }
      
      /* Green background for explained words */
      .vocab-word-explained {
        background-color: rgba(134, 239, 172, 0.7) !important; /* Lighter green with slight transparency */
        cursor: pointer;
        border-radius: 8px;
        border: none !important;
        padding: 0 2px;
        margin-top: 0 !important; /* Prevent top margin from affecting line spacing */
        margin-bottom: 0 !important; /* Prevent bottom margin from affecting line spacing */
        display: inline-block !important; /* Use inline-block for transform support */
        width: auto !important; /* Prevent width from expanding to full line */
        max-width: fit-content !important; /* Ensure it only wraps the text content */
        min-width: auto !important; /* Prevent min-width from forcing expansion */
        user-select: none;
        -webkit-user-select: none;
        transition: background-color 0.3s ease-in-out, opacity 0.3s ease-in-out, transform 0.15s ease-out;
        box-decoration-break: clone; /* Ensure background wraps correctly on line breaks */
        -webkit-box-decoration-break: clone;
        line-height: normal !important; /* Use normal line height to prevent expansion */
        vertical-align: middle !important; /* Align to middle to minimize line height impact */
        height: auto !important; /* Ensure height doesn't expand */
        max-height: none !important; /* Remove max-height constraints */
        box-sizing: border-box !important; /* Include padding in width calculation */
        margin: 0 !important; /* Remove any margins that could affect spacing */
      }
      
      /* Breathing animation for green word when it first appears - breathes twice (same as book icon) */
      .vocab-word-explained.word-breathing {
        display: inline-block !important; /* Need inline-block for transform animation */
        width: auto !important; /* Prevent width from expanding */
        max-width: fit-content !important; /* Ensure it only wraps the text content */
        animation: wordGreenBreathing 0.8s ease-in-out;
      }
      
      @keyframes wordGreenBreathing {
        0% {
          transform: scale(1);
        }
        25% {
          transform: scale(1.15);
        }
        50% {
          transform: scale(1);
        }
        75% {
          transform: scale(1.15);
        }
        100% {
          transform: scale(1);
        }
      }
      
      .vocab-word-explained:hover {
        background-color: rgba(74, 222, 128, 0.8) !important; /* Lighter green on hover with slight transparency */
      }
      
      .vocab-word-explained:active,
      .vocab-word-explained.vocab-word-clicking {
        transform: scale(0.97) !important; /* Reduced scale-down animation - less pronounced */
        background-color: rgba(74, 222, 128, 0.8) !important; /* Lighter green on active with slight transparency */
      }
      
      /* Smooth animation for green word highlight disappearance - 0.3s duration */
      .vocab-word-explained.word-disappearing {
        animation: wordFadeOut 0.3s ease-in-out forwards;
      }
      
      @keyframes wordFadeOut {
        0% {
          background-color: rgba(134, 239, 172, 0.7); /* Lighter green with slight transparency */
          opacity: 1;
        }
        100% {
          background-color: transparent;
          opacity: 0;
        }
      }
      
      /* Green cross button for explained words - white circular background with thin green border */
      .vocab-word-remove-explained-btn {
        position: absolute;
        top: -10px;
        right: -10px;
        width: 18px;
        height: 18px;
        background: white !important; /* White circular non-transparent background */
        border: 1px solid #4ade80 !important; /* Thin green border */
        border-radius: 50% !important; /* Circular shape */
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 0.9;
        transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out, scale 0.3s ease-in-out, background-color 0.2s ease, border-color 0.2s ease;
        padding: 0;
        z-index: 999999;
        box-shadow: 0 1px 3px rgba(34, 197, 94, 0.2);
        box-sizing: border-box;
      }
      
      /* Smooth animation for green cross button disappearance - 0.3s duration */
      .vocab-word-remove-explained-btn.button-disappearing {
        animation: greenButtonFadeOut 0.3s ease-in-out forwards;
      }
      
      @keyframes greenButtonFadeOut {
        0% {
          opacity: 0.8;
          transform: scale(1);
        }
        100% {
          opacity: 0;
          transform: scale(0.8);
        }
      }
      
      .vocab-word-explained:hover .vocab-word-remove-explained-btn {
        opacity: 1;
      }
      
      .vocab-word-remove-explained-btn:hover {
        transform: scale(1.15);
        opacity: 1;
        background-color: #f0fdf4 !important; /* Light green tint on hover */
        border-color: #22c55e !important; /* Slightly darker green border on hover */
      }
      
      .vocab-word-remove-explained-btn:active {
        transform: scale(0.95);
      }
      
      .vocab-word-remove-explained-btn svg {
        pointer-events: none;
        display: block;
        width: 10px;
        height: 10px;
      }
      
      /* Contextual Meaning Popup Card */
      .vocab-word-popup {
        position: absolute;
        background: white;
        border-radius: 30px;
        padding: 24px;
        box-shadow: 0 8px 24px rgba(149, 39, 245, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1);
        z-index: 10000010;
        max-width: 380px;
        min-width: 300px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        opacity: 0;
        transform: none;
        transition: opacity 0.2s ease;
        pointer-events: none;
      }
      
      /* Reduce padding and margin when "Get more examples" button is hidden */
      .vocab-word-popup.no-more-examples-button {
        padding: 24px; /* Consistent padding when button is hidden */
      }
      
      .vocab-word-popup.no-more-examples-button .vocab-word-popup-examples-container {
        margin-bottom: 60px; /* Keep margin for tab group even when button is hidden */
      }
      
      .vocab-word-popup.visible {
        opacity: 1;
        transform: none;
        pointer-events: all;
      }
      
      /* Expanding animation - scale up from word element position */
      .vocab-word-popup.expanding {
        animation: expandWordPopupFromWord 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards !important;
        transition: none !important; /* Disable transition during animation */
        pointer-events: none !important;
        will-change: transform !important; /* Optimize for animation */
        opacity: 1 !important;
      }
      
      .vocab-word-popup.expanding.visible {
        animation: expandWordPopupFromWord 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards !important;
        transition: none !important;
      }
      
      @keyframes expandWordPopupFromWord {
        0% {
          transform: var(--expand-start-transform, translate(0, 0) scale(0)) !important;
          opacity: 1;
        }
        100% {
          transform: var(--expand-end-transform, translate(0, 0) scale(1)) !important;
          opacity: 1;
        }
      }
      
      /* Closing animation - move to word position while scaling down */
      .vocab-word-popup.closing {
        animation: closeWordPopupToWord 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards !important;
        transition: none !important;
        pointer-events: none !important;
        will-change: transform !important;
        opacity: 1 !important;
      }
      
      @keyframes closeWordPopupToWord {
        0% {
          transform: var(--close-start-transform, translate(0, 0) scale(1)) !important;
          opacity: 1;
        }
        100% {
          transform: var(--close-end-transform, translate(0, 0) scale(0)) !important;
          opacity: 0;
        }
      }
      
      .vocab-word-popup.sticky {
        pointer-events: all;
      }
      
      .vocab-word-popup-header {
        text-align: center;
        color: #A020F0;
        font-weight: 600;
        font-size: 16px;
        margin-bottom: 14px;
      }
      
      .vocab-word-popup-meaning {
        color: #333;
        font-size: 15px;
        line-height: 1.5;
        margin-bottom: 14px;
        padding-top: 0; /* No padding by default */
      }
      
      /* No padding-top needed since speaker icon is now in bottom container */
      
      .vocab-word-popup-meaning .word-bold {
        font-weight: 600;
        color: #A020F0;
      }
      
      /* Examples container with scrolling */
      .vocab-word-popup-examples-container {
        overflow-y: auto;
        margin-bottom: 70px; /* Increased margin to prevent overlap with tab group and button */
        margin-top: 16px; /* Space above separator line */
        padding-top: 16px; /* Space below separator line */
        padding-bottom: 8px; /* Additional padding at bottom */
        max-height: none; /* Flexible height based on content */
        position: relative;
        z-index: 1;
        border-top: 0.5px solid rgba(149, 39, 245, 0.3); /* Light purple thin separator line */
      }
      
      .vocab-word-popup-examples-container::-webkit-scrollbar {
        width: 4px;
      }
      
      .vocab-word-popup-examples-container::-webkit-scrollbar-track {
        background: #F8F2FC;
        border-radius: 2px;
      }
      
      .vocab-word-popup-examples-container::-webkit-scrollbar-thumb {
        background: #D8C1E8;
        border-radius: 4px;
      }
      
      .vocab-word-popup-examples {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      
      .vocab-word-popup-examples li {
        position: relative;
        padding-left: 18px;
        margin-bottom: 10px;
        color: #333;
        font-size: 14px;
        line-height: 1.4;
      }
      
      .vocab-word-popup-examples li:last-child {
        margin-bottom: 0;
      }
      
      .vocab-word-popup-examples li:before {
        content: '';
        position: absolute;
        left: 0;
        top: 7px;
        width: 6px;
        height: 6px;
        background: #A020F0;
        border-radius: 50%;
      }
      
      .vocab-word-popup-examples li .word-bold {
        font-weight: 600;
        color: #A020F0;
      }
      
      /* Bottom container for speaker icon, tab group, and button */
      .vocab-word-popup-bottom-container {
        position: absolute;
        bottom: 24px;
        left: 24px;
        right: 24px;
        display: flex;
        justify-content: flex-start;
        align-items: center;
        z-index: 20;
        gap: 12px;
        background: white;
        padding: 4px 0;
      }
      
      /* Language tab group - left side */
      .vocab-word-popup-tab-group {
        display: inline-flex;
        gap: 0;
        background: #e5e7eb;
        border-radius: 10px;
        padding: 3px;
        position: relative;
        width: auto;
        min-width: 120px;
        flex-shrink: 0;
      }
      
      .vocab-word-popup-tab-group::before {
        content: '';
        position: absolute;
        top: 3px;
        left: 3px;
        height: calc(100% - 6px);
        background: #A020F0;
        border-radius: 10px;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 0;
        width: calc(50% - 3px);
        transform: translateX(0);
      }
      
      .vocab-word-popup-tab-group[data-active-tab="EN"]::before {
        transform: translateX(calc(100% + 3px));
      }
      
      .vocab-word-popup-tab {
        padding: 6px 12px;
        border: none;
        border-radius: 5px;
        background: transparent;
        color: #6b7280;
        font-weight: 600;
        font-size: 13px;
        cursor: pointer;
        transition: color 0.2s ease;
        text-align: center;
        width: 50%;
        box-sizing: border-box;
        min-width: 36px;
        flex: 0 0 auto;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        position: relative;
        z-index: 1;
        white-space: nowrap;
      }
      
      .vocab-word-popup-tab.vocab-word-popup-tab-active {
        color: white;
      }
      
      .vocab-word-popup-tab:hover:not(.loading):not(.vocab-word-popup-tab-active) {
        color: #4b5563;
      }
      
      .vocab-word-popup-tab:active:not(.loading) {
        transform: scale(0.95);
      }
      
      .vocab-word-popup-tab.loading {
        cursor: not-allowed;
        pointer-events: none;
      }
      
      .vocab-word-popup-tab.loading .vocab-loading-spinner {
        width: 8px;
        height: 8px;
        border: 1.5px solid white;
        border-top-color: transparent;
        border-radius: 50%;
        animation: vocab-spin 0.8s linear infinite;
      }
      
      /* View more button - bigger, right side */
      .vocab-word-popup-button {
        padding: 10px 18px;
        border: none;
        border-radius: 10px;
        background: #A020F0;
        color: white;
        font-weight: 600;
        font-size: 13px;
        cursor: pointer;
        transition: background-color 0.2s ease, opacity 0.2s ease, transform 0.2s ease;
        text-align: center;
        min-width: 140px; /* Ensure button has minimum width */
        flex-shrink: 0;
        margin-left: auto; /* Push button to the rightmost position */
      }
      
      .vocab-word-popup-button:hover:not(.loading) {
        background: #8B1AC4;
        transform: translateY(-1px);
      }
      
      .vocab-word-popup-button:active:not(.loading) {
        background: #7016A8;
        transform: translateY(0) scale(0.95);
      }
      
      .vocab-word-popup-button.loading {
        opacity: 0.6;
        cursor: not-allowed;
      }
      
      .vocab-word-popup-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      
      /* Close button for popup */
      .vocab-word-popup-close {
        position: absolute;
        top: 12px;
        right: 12px;
        width: 22px;
        height: 22px;
        border: none;
        background: transparent;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 0.8;
        transition: opacity 0.2s ease, transform 0.2s ease;
        z-index: 10;
      }
      
      .vocab-word-popup-close:hover {
        opacity: 1;
        transform: scale(1.2);
      }
      
      .vocab-word-popup-close:active {
        transform: scale(0.9);
      }
      
      .vocab-word-popup-close svg {
        width: 16px;
        height: 16px;
      }
      
      /* Speaker icon for pronunciation - now in bottom container */
      .vocab-word-popup-speaker {
        position: relative;
        width: 28px;
        height: 28px;
        background: #9527F5;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        opacity: 1;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-shadow: 0 2px 8px rgba(149, 39, 245, 0.3);
      }
      
      .vocab-word-popup-speaker:hover:not(.loading) {
        background: #7B1FA2;
        transform: scale(1.1);
        box-shadow: 0 4px 12px rgba(149, 39, 245, 0.4);
      }
      
      .vocab-word-popup-speaker:active:not(.loading) {
        transform: scale(0.95);
        background: #6A1B9A;
      }
      
      .vocab-word-popup-speaker.loading {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none;
      }
      
      .vocab-word-popup-speaker svg {
        width: 14px;
        height: 14px;
        pointer-events: none;
      }
      
      /* Loading spinner animation */
      .vocab-loading-spinner {
        animation: vocab-spin 1s linear infinite;
      }
      
      @keyframes vocab-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      /* Error banner */
      .vocab-error-banner {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff4444;
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(255, 68, 68, 0.3);
        z-index: 1000000;
        opacity: 0;
        transform: translateX(100%);
        transition: opacity 0.3s ease, transform 0.3s ease;
        max-width: 400px;
      }
      
      .vocab-error-banner.visible {
        opacity: 1;
        transform: translateX(0);
      }
      
      .vocab-error-content {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        gap: 8px;
      }
      
      .vocab-error-icon {
        font-size: 16px;
        flex-shrink: 0;
      }
      
      .vocab-error-message {
        flex: 1;
        font-size: 14px;
        font-weight: 500;
        line-height: 1.4;
      }
      
      .vocab-error-close {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        font-weight: bold;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s ease, transform 0.2s ease;
        flex-shrink: 0;
      }
      
      .vocab-error-close:hover {
        background: rgba(255, 255, 255, 0.2);
      }
    `;
    
    document.head.appendChild(style);
  }
};

// ===================================
// Text Selector Module - Handles text selection and highlighting
// ===================================
const TextSelector = {
  // Use Set for O(1) insertion, deletion, and lookup
  selectedTexts: new Set(),
  
  // Map to store text -> highlight element
  textToHighlights: new Map(),
  
  // Map to store textKey -> {textStartIndex, textLength, text, range}
  textPositions: new Map(),
  
  // Container for texts that have been asked (moved from selectedTexts)
  askedTexts: new Map(), // Map of textKey -> {text, textKey, highlight, simplifiedText}
  
  // Container for simplified texts metadata
  simplifiedTexts: new Map(), // Map of textKey -> {textStartIndex, textLength, text, simplifiedText, previousSimplifiedTexts: Array, shouldAllowSimplifyMore}
  
  // Track if the feature is enabled
  isEnabled: false,
  
  // Counter for generating unique IDs
  highlightIdCounter: 0,
  
  // Store bound handler for proper cleanup
  boundMouseUpHandler: null,
  
  /**
   * Initialize text selector
   */
  async init() {
    console.log('[TextSelector] Initializing...');
    
    // Bind the handler once for proper cleanup
    this.boundMouseUpHandler = this.handleMouseUp.bind(this);
    
    // Inject styles for text highlights
    this.injectStyles();
    
    // Check if extension is enabled for current domain
    const isExtensionEnabled = await this.checkExtensionEnabled();
    
    if (isExtensionEnabled) {
      this.enable();
    }
    
    console.log('[TextSelector] Initialized. Enabled:', isExtensionEnabled);
  },
  
  /**
   * Check if extension is enabled from storage
   * @returns {Promise<boolean>}
   */
  async checkExtensionEnabled() {
    try {
      const GLOBAL_STORAGE_KEY = 'is_extension_globally_enabled';
      const result = await chrome.storage.local.get([GLOBAL_STORAGE_KEY]);
      let isEnabled = result[GLOBAL_STORAGE_KEY];
      
      // If not found, create it and set to true (enabled by default)
      if (isEnabled === undefined) {
        isEnabled = true;
        await chrome.storage.local.set({ [GLOBAL_STORAGE_KEY]: isEnabled });
        console.log('[TextSelector] Global toggle state not found, created with default value: true');
      }
      
      return isEnabled;
    } catch (error) {
      console.error('[TextSelector] Error checking global extension state:', error);
      return true; // Default to true (enabled) on error
    }
  },
  
  /**
   * Enable text selector
   */
  enable() {
    if (this.isEnabled) return;
    
    this.isEnabled = true;
    document.addEventListener('mouseup', this.boundMouseUpHandler);
    console.log('[TextSelector] Enabled');
  },
  
  /**
   * Disable text selector
   */
  disable() {
    if (!this.isEnabled) return;
    
    this.isEnabled = false;
    document.removeEventListener('mouseup', this.boundMouseUpHandler);
    console.log('[TextSelector] Disabled');
  },
  
  /**
   * Check if an element or range is within allowed selection areas
   * Allowed: Main website content and .vocab-custom-content-editor-content
   * Disallowed: All other extension UI components
   * @param {Element|Range} elementOrRange - The element or range to check
   * @returns {boolean} True if selection is allowed, false otherwise
   */
  isSelectionAllowed(elementOrRange) {
    // Get the container element from element or range
    let containerElement = null;
    
    if (elementOrRange instanceof Range) {
      // For range, check the common ancestor container
      containerElement = elementOrRange.commonAncestorContainer;
      // If it's a text node, get its parent
      if (containerElement && containerElement.nodeType === Node.TEXT_NODE) {
        containerElement = containerElement.parentElement;
      } else if (containerElement && containerElement.nodeType === Node.ELEMENT_NODE) {
        containerElement = containerElement;
      }
    } else if (elementOrRange instanceof Element) {
      containerElement = elementOrRange;
    } else if (elementOrRange instanceof Node) {
      // For other node types (like text nodes), get parent element
      if (elementOrRange.nodeType === Node.TEXT_NODE) {
        containerElement = elementOrRange.parentElement;
      } else if (elementOrRange.nodeType === Node.ELEMENT_NODE) {
        containerElement = elementOrRange;
      }
    }
    
    // Ensure we have an Element (not a Text node or null)
    if (!containerElement || !(containerElement instanceof Element)) {
      return false;
    }
    
    // First check: If inside .vocab-custom-content-editor-content, allow it
    // This is the exception - even though it's inside vocab-custom-content-modal,
    // we want to allow selection in the editor content
    const editorContent = containerElement.closest('.vocab-custom-content-editor-content');
    if (editorContent) {
      return true;
    }
    
    // Second check: If inside any extension UI component, disallow it
    // List of extension UI component selectors
    const extensionUISelectors = [
      '.vocab-helper-panel',
      '.vocab-topics-modal',
      '.vocab-topics-modal-overlay',
      '.vocab-chat-dialog',
      '.vocab-custom-content-modal',
      '.vocab-custom-content-info-banner',
      '.vocab-word-popup',
      '.vocab-notification'
    ];
    
    // Check if the container is inside any extension UI component
    for (const selector of extensionUISelectors) {
      if (containerElement.closest(selector)) {
        return false;
      }
    }
    
    // If not in extension UI and not in editor content, it's main website content - allow it
    return true;
  },
  
  /**
   * Handle mouse up event (after text selection)
   * @param {MouseEvent} event
   */
  handleMouseUp(event) {
    // CRITICAL: Check if feature is enabled
    if (!this.isEnabled) {
      return;
    }
    
    // Allow button clicks to proceed - don't interfere with button interactions
    if (event.target.closest('button') || event.target.tagName === 'BUTTON') {
      return;
    }
    
    // Check if clicking on existing highlights - allow interaction with them
    if (event.target.closest('.vocab-text-highlight') ||
        event.target.closest('.vocab-word-highlight')) {
      return;
    }
    
    // Check if selection is allowed in the clicked area
    if (!this.isSelectionAllowed(event.target)) {
      console.log('[TextSelector] Selection not allowed - clicked in extension UI');
      return;
    }
    
    // Small delay to ensure selection is complete
    setTimeout(() => {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();
      
      // Check if text was selected
      if (!selectedText || selectedText.length === 0) {
        return;
      }
      
      // Must have at least one space (to differentiate from single words)
      // Or be longer than typical word length
      if (!(/\s/.test(selectedText)) && selectedText.length < 15) {
        return; // Let WordSelector handle single words
      }
      
      // Check if text has at least 3 words
      const wordCount = selectedText.split(/\s+/).filter(word => word.length > 0).length;
      if (wordCount < 3) {
        console.log('[TextSelector] Not enough words selected:', wordCount);
        this.showNotification("Select atleast 3 words");
        selection.removeAllRanges();
        return;
      }
      
      // Get the range and validate
      if (selection.rangeCount === 0) {
        return;
      }
      
      const range = selection.getRangeAt(0);
      
      // IMPORTANT: Also validate the selection range itself
      // This ensures the selected text is not from extension UI
      if (!this.isSelectionAllowed(range)) {
        console.log('[TextSelector] Selection not allowed - range is in extension UI');
        selection.removeAllRanges();
        return;
      }
      
      // Check if this exact text is already selected
      const textKey = this.getContextualTextKey(selectedText);
      if (this.selectedTexts.has(textKey)) {
        console.log('[TextSelector] Text already selected');
        selection.removeAllRanges();
        return;
      }
      
      // Check if the range overlaps with any existing highlight (text or words)
      if (this.hasOverlap(range)) {
        console.log('[TextSelector] Selection overlaps with existing highlight');
        this.showNotification("Can't select an already selected text");
        selection.removeAllRanges();
        return;
      }
      
      // Add text to selected set with range for position tracking (O(1) operation)
      this.addText(selectedText, range);
      
      // Highlight the text
      this.highlightRange(range, selectedText);
      
      // Clear the selection
      selection.removeAllRanges();
      
      console.log('[TextSelector] Text selected:', selectedText.substring(0, 50) + '...');
      console.log('[TextSelector] Total selected texts:', this.selectedTexts.size);
    }, 10);
  },
  
  /**
   * Check if a range overlaps with any existing text highlights
   * (Word selections and text selections are independent)
   * @param {Range} range - The range to check
   * @returns {boolean} True if overlap detected
   */
  hasOverlap(range) {
    // Get all existing text highlight elements (only check text, not words)
    const existingTextHighlights = document.querySelectorAll('.vocab-text-highlight');
    
    for (const highlight of existingTextHighlights) {
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
        console.warn('[TextSelector] Error checking text highlight overlap:', error);
      }
    }
    
    return false; // No overlap
  },
  
  /**
   * Show notification banner at top right corner
   * @param {string} message - Message to display
   */
  showNotification(message) {
    // Check if notification already exists
    const existingNotification = document.getElementById('vocab-text-selector-notification');
    if (existingNotification) {
      existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.id = 'vocab-text-selector-notification';
    notification.className = 'vocab-notification';
    
    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'vocab-notification-close';
    closeBtn.setAttribute('aria-label', 'Close notification');
    closeBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 3L3 9M3 3l6 6" stroke="#9527F5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    
    // Close button click handler
    closeBtn.addEventListener('click', () => {
      notification.classList.remove('visible');
      setTimeout(() => {
        notification.remove();
      }, 300);
    });
    
    // Create message text
    const messageText = document.createElement('span');
    messageText.className = 'vocab-notification-message';
    messageText.textContent = message;
    
    // Append close button and message
    notification.appendChild(closeBtn);
    notification.appendChild(messageText);
    
    // Add to body
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => {
      notification.classList.add('visible');
    }, 10);
    
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      notification.classList.remove('visible');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  },
  
  /**
   * Get a unique key for the text (normalized)
   * @param {string} text - The text
   * @returns {string}
   */
  getTextKey(text) {
    return text.toLowerCase().replace(/\s+/g, ' ').trim();
  },

  /**
   * Generate contextual textKey based on current content context
   * @param {string} text - The text to generate key for
   * @returns {string} Contextual textKey
   */
  getContextualTextKey(text) {
    const normalizedText = this.getTextKey(text);
    
    // Check if we're in custom content context
    if (window.ButtonPanel && window.ButtonPanel.topicsModal && 
        window.ButtonPanel.topicsModal.customContentModal && 
        window.ButtonPanel.topicsModal.customContentModal.activeTabId) {
      
      const activeTabId = window.ButtonPanel.topicsModal.customContentModal.activeTabId;
      const activeContent = window.ButtonPanel.topicsModal.customContentModal.getContentByTabId(parseInt(activeTabId));
      
      if (activeContent) {
        // Generate contextual textKey for custom content
        const contextualTextKey = `${activeContent.contentType}-${activeTabId}-${normalizedText}`;
        console.log('[TextSelector] Generated contextual textKey:', contextualTextKey, 'for text:', normalizedText);
        return contextualTextKey;
      }
    }
    
    // Default to main page textKey
    console.log('[TextSelector] Generated main page textKey:', normalizedText);
    return normalizedText;
  },
  
  /**
   * Calculate text position in document (approximate position in plain text)
   * @param {Range} range - The range to calculate position for
   * @returns {{textStartIndex: number, textLength: number, text: string}}
   */
  calculateTextPosition(range) {
    const text = range.toString();
    const textLength = text.length;
    
    // Get the full text content of the body up to the start of the range
    const bodyText = document.body.innerText || document.body.textContent || '';
    
    // Find the approximate position by searching for the text in the body
    // This is approximate as we're using innerText which may differ from actual positions
    const rangeText = range.toString();
    const textStartIndex = bodyText.indexOf(rangeText);
    
    return {
      textStartIndex: textStartIndex >= 0 ? textStartIndex : 0,
      textLength: textLength,
      text: text
    };
  },
  
  /**
   * Add a text to the selected texts set
   * @param {string} text - The text to add
   * @param {Range} range - The range object (optional, for position tracking)
   */
  addText(text, range = null) {
    // Generate contextual textKey based on current context
    const textKey = this.getContextualTextKey(text);
    this.selectedTexts.add(textKey); // O(1) operation
    
    // Store position information if range is provided
    if (range) {
      const positionData = this.calculateTextPosition(range);
      this.textPositions.set(textKey, positionData);
    }
    
    // Update button states
    ButtonPanel.updateButtonStatesFromSelections();
  },
  
  /**
   * Remove a text from the selected texts set
   * @param {string} text - The text to remove
   */
  removeText(text) {
    const textKey = this.getContextualTextKey(text);
    
    // Get the highlight for this text
    const highlight = this.textToHighlights.get(textKey);
    
    if (highlight) {
      // Remove highlight element
      this.removeHighlight(highlight);
      
      // Clean up the mapping
      this.textToHighlights.delete(textKey); // O(1) operation
    }
    
    // Remove from selected texts set
    this.selectedTexts.delete(textKey); // O(1) operation
    
    // Clean up position data
    this.textPositions.delete(textKey);
    
    console.log('[TextSelector] Text removed');
    console.log('[TextSelector] Remaining selected texts:', this.selectedTexts.size);
    
    // Update button states
    ButtonPanel.updateButtonStatesFromSelections();
  },
  
  /**
   * Highlight a range with a styled span
   * @param {Range} range - The range to highlight
   * @param {string} text - The text being highlighted
   */
  highlightRange(range, text) {
    const textKey = this.getContextualTextKey(text);
    
    // Create highlight wrapper
    // DO NOT apply font properties to the highlight span - let child elements preserve their formatting
    // The highlight span should only provide the underline decoration, not override text formatting
    const highlight = document.createElement('span');
    highlight.className = 'vocab-text-highlight underline-appearing';
    highlight.setAttribute('data-text-key', textKey);
    highlight.setAttribute('data-highlight-id', `text-highlight-${this.highlightIdCounter++}`);
    
    // Ensure the highlight span doesn't interfere with child formatting
    // Set display to inline to preserve text flow
    highlight.style.setProperty('display', 'inline', 'important');
    highlight.style.setProperty('position', 'relative', 'important');
    // DO NOT set font properties - let children inherit or use their own styles
    
    console.log('[TextSelector] Highlight element created with data-text-key:', textKey);
    console.log('[TextSelector] Preserving all formatting from selected range - no font overrides applied');
    
    // Wrap the selected range FIRST
    // This preserves all formatting (bold, italic, font sizes, colors, etc.) from the original content
    try {
      // Check if range might contain formatting elements by checking the HTML
      const rangeClone = range.cloneContents();
      const hasFormattingElements = rangeClone.querySelector('b, strong, em, i, u, span, font, a, h1, h2, h3, h4, h5, h6');
      
      if (hasFormattingElements) {
        // Range contains formatting elements - use extractContents to preserve structure
        console.log('[TextSelector] Range contains formatting elements - using extractContents to preserve formatting');
        const extractedContents = range.extractContents();
        highlight.appendChild(extractedContents);
        range.insertNode(highlight);
        console.log('[TextSelector] Used extractContents - formatting preserved');
      } else {
        // No formatting elements - try surroundContents
        range.surroundContents(highlight);
        console.log('[TextSelector] Used surroundContents - formatting preserved');
      }
    } catch (error) {
      // surroundContents failed - use extractContents which preserves DOM structure
      console.warn('[TextSelector] surroundContents failed, using extractContents:', error);
      const extractedContents = range.extractContents();
      highlight.appendChild(extractedContents);
      range.insertNode(highlight);
      console.log('[TextSelector] Used extractContents (fallback) - formatting preserved');
    }
    
    // After wrapping, ensure all child elements with color classes or inline styles maintain their colors
    // This is a safety measure in case CSS doesn't work as expected
    setTimeout(() => {
      const colorElements = highlight.querySelectorAll('[class*="user-"], [class*="rated-"], [style*="color"], [style*="Color"]');
      colorElements.forEach(element => {
        const computedStyle = window.getComputedStyle(element);
        const originalColor = computedStyle.color;
        // If the element has a color class or inline style, ensure it's preserved
        if (element.classList.contains('user-orange') || element.classList.contains('rated-user') || 
            element.hasAttribute('style') && element.getAttribute('style').includes('color')) {
          // The color should already be preserved, but log for debugging
          console.log('[TextSelector] Color element found:', element.className, 'computed color:', originalColor);
        }
      });
    }, 0);
    
    // Create and append remove button FIRST (at top-left of highlight)
    const removeBtn = this.createRemoveButton(text);
    highlight.appendChild(removeBtn);
    
    // Create icons wrapper for magic-meaning button (positioned to the left)
    const iconsWrapper = document.createElement('div');
    iconsWrapper.className = 'vocab-text-icons-wrapper';
    iconsWrapper.setAttribute('data-text-key', textKey);
    
    // Add magic-meaning button
    const magicMeaningBtn = this.createMagicMeaningButton(textKey);
    iconsWrapper.appendChild(magicMeaningBtn);
    
    // Append icons wrapper to highlight
    highlight.appendChild(iconsWrapper);
    
    // Position icons relative to highlight - on the left side, outside text content
    // Force absolute positioning to ensure it's always outside the text
    iconsWrapper.style.setProperty('position', 'absolute', 'important');
    iconsWrapper.style.setProperty('display', 'flex', 'important');
    iconsWrapper.style.setProperty('margin', '0', 'important');
    iconsWrapper.style.setProperty('padding', '0', 'important');
    
    const highlightRect = highlight.getBoundingClientRect();
    const isInModal = highlight.closest('.vocab-custom-content-modal');
    
    if (isInModal) {
      // In modal context: position to the left with sufficient margin
      iconsWrapper.style.setProperty('left', '-50px', 'important');
      iconsWrapper.style.setProperty('right', 'auto', 'important');
      iconsWrapper.style.setProperty('top', '-2px', 'important');
    } else {
      // In main webpage context: position to the left, outside text content
      iconsWrapper.style.setProperty('left', '-45px', 'important');
      iconsWrapper.style.setProperty('right', 'auto', 'important');
      iconsWrapper.style.setProperty('top', '0px', 'important');
    }
    
    // Remove the appearing class after animation completes
    setTimeout(() => {
      highlight.classList.remove('underline-appearing');
    }, 300);
    
    // Store the highlight in our map (O(1) operation)
    this.textToHighlights.set(textKey, highlight);
  },
  
  /**
   * Create a remove button for the highlight
   * @param {string} text - The text this button will remove
   * @returns {HTMLElement}
   */
  createRemoveButton(text) {
    const btn = document.createElement('button');
    btn.className = 'vocab-text-remove-btn button-appearing';
    btn.setAttribute('aria-label', `Remove highlight for selected text`);
    btn.innerHTML = this.createCloseIcon();
    
    // Add click handler
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.removeText(text);
    });
    
    // Remove the appearing class after animation completes (0.3s same as underline)
    setTimeout(() => {
      btn.classList.remove('button-appearing');
    }, 300);
    
    return btn;
  },
  
  /**
   * Create close/cross icon SVG - Purple cross icon
   * @returns {string} SVG markup
   */
  createCloseIcon() {
    return `
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 2L10 10M10 2L2 10" stroke="#9527F5" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  },

  /**
   * Create green cross icon for text removal
   * @returns {string} SVG markup
   */
  createGreenRemoveIcon() {
    return `
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 2L10 10M10 2L2 10" stroke="#22c55e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  },
  
  /**
   * Remove a highlight element and restore original text
   * @param {HTMLElement} highlight - The highlight element to remove
   */
  removeHighlight(highlight) {
    const parent = highlight.parentNode;
    if (!parent) return;
    
    // Add disappearing animation classes (same 0.3s duration)
    // Only add if not already present (might be added by removeFromSimplifiedTexts)
    const btn = highlight.querySelector('.vocab-text-remove-btn');
    if (btn && !btn.classList.contains('button-disappearing')) {
      btn.classList.add('button-disappearing');
    }
    if (!highlight.classList.contains('underline-disappearing')) {
      highlight.classList.add('underline-disappearing');
    }
    
    // Wait for animation to complete before removing (0.3s same duration for both)
    setTimeout(() => {
      // Remove button first
      if (btn) {
        btn.remove();
      }
      
      // Remove icons wrapper and magic meaning button before moving child nodes
      const iconsWrapper = highlight.querySelector('.vocab-text-icons-wrapper');
      if (iconsWrapper) {
        iconsWrapper.remove();
      }
      
      // Also remove any magic meaning button that might be directly in highlight
      const magicBtn = highlight.querySelector('.vocab-text-magic-meaning-btn');
      if (magicBtn) {
        magicBtn.remove();
      }
      
      // Move all remaining child nodes back to parent (only text content, not UI elements)
      while (highlight.firstChild) {
        parent.insertBefore(highlight.firstChild, highlight);
      }
      
      // Remove the empty highlight span
      highlight.remove();
      
      // Normalize the parent to merge adjacent text nodes
      parent.normalize();
    }, 300); // Same duration as animation (0.3s)
  },
  
  /**
   * Get all selected texts
   * @returns {Set<string>}
   */
  getSelectedTexts() {
    return new Set(this.selectedTexts); // Return a copy
  },
  
  /**
   * Clear all selections
   */
  clearAll() {
    // Remove all highlights
    this.textToHighlights.forEach((highlight) => {
      this.removeHighlight(highlight);
    });
    
    // Clear data structures (O(1) for Set clear)
    this.selectedTexts.clear();
    this.textToHighlights.clear();
    
    console.log('[TextSelector] All selections cleared');
    
    // Update button states
    ButtonPanel.updateButtonStatesFromSelections();
  },

  /**
   * Clear only selections (purple highlights) but preserve meanings (green highlights and chat icons)
   */
  clearSelectionsOnly() {
    console.log('[TextSelector] Clearing only selections, preserving meanings');
    
    // Only clear selected texts (purple highlights)
    this.selectedTexts.forEach(textKey => {
      const highlight = this.textToHighlights.get(textKey);
      if (highlight) {
        // Only remove if it's a selection highlight (purple), not asked/simplified (green)
        if (highlight.classList.contains('vocab-text-highlight') && 
            !highlight.classList.contains('vocab-text-simplified') &&
            !highlight.querySelector('.vocab-text-chat-btn')) {
          this.removeHighlight(highlight);
        }
      }
    });
    
    // Clear only selection data structures
    this.selectedTexts.clear();
    this.textPositions.clear();
    
    // Keep askedTexts, simplifiedTexts, and their highlights intact
    
    console.log('[TextSelector] Selections cleared, meanings preserved');
    
    // Update button states
    ButtonPanel.updateButtonStatesFromSelections();
  },
  
  /**
   * Move text from selectedTexts to askedTexts
   * @param {string} textKey - The text key
   * @returns {boolean} Success status
   */
  moveToAskedTexts(textKey) {
    const highlight = this.textToHighlights.get(textKey);
    
    if (!highlight) {
      console.warn('[TextSelector] No highlight found for textKey:', textKey);
      return false;
    }
    
    // Get the original text
    const originalText = highlight.textContent.replace(/\s+/g, ' ').trim();
    
    // Remove from selectedTexts
    this.selectedTexts.delete(textKey);
    
    // Move to askedTexts
    this.askedTexts.set(textKey, {
      text: originalText,
      textKey: textKey,
      highlight: highlight
    });
    
    // Remove existing button (purple cross)
    const existingBtn = highlight.querySelector('.vocab-text-remove-btn');
    if (existingBtn) {
      existingBtn.remove();
    }
    
    // Remove underline by changing text-decoration to none
    highlight.style.textDecoration = 'none';
    
    // Create wrapper for icons
    const iconsWrapper = document.createElement('div');
    iconsWrapper.className = 'vocab-text-icons-wrapper';
    iconsWrapper.setAttribute('data-text-key', textKey);
    
    // Determine context and set appropriate data attribute
    const isInModal = highlight.closest('.vocab-custom-content-modal');
    iconsWrapper.setAttribute('data-icon-context', isInModal ? 'custom-content-modal' : 'main-webpage');
    
    // Add chat icon button first (top position)
    const chatBtn = this.createChatButton(textKey, true); // true = green color
    iconsWrapper.appendChild(chatBtn);
    
    // Add green remove button second (bottom position)
    const greenRemoveBtn = this.createGreenRemoveButtonForAskedText(textKey);
    iconsWrapper.appendChild(greenRemoveBtn);
    
    // Append wrapper to highlight
    highlight.appendChild(iconsWrapper);
    
    // Position icons relative to highlight - on the left side, outside text content
    // Force absolute positioning to ensure it's always outside the text
    iconsWrapper.style.setProperty('position', 'absolute', 'important');
    iconsWrapper.style.setProperty('display', 'flex', 'important');
    iconsWrapper.style.setProperty('margin', '0', 'important');
    iconsWrapper.style.setProperty('padding', '0', 'important');
    
    const highlightRect = highlight.getBoundingClientRect();
    
    if (isInModal) {
      // In modal context: position to the left with sufficient margin to avoid overlap
      iconsWrapper.style.setProperty('left', '-50px', 'important'); // 50px to the left with !important
      iconsWrapper.style.setProperty('right', 'auto', 'important');
      // Align upper border with text upper border by adjusting top position
      iconsWrapper.style.setProperty('top', '-2px', 'important'); // Slight adjustment to align upper borders
    } else {
      // In main webpage context: position to the left, outside text content
      iconsWrapper.style.setProperty('left', '-45px', 'important'); // 45px to the left of the highlight
      iconsWrapper.style.setProperty('right', 'auto', 'important');
      iconsWrapper.style.setProperty('top', '0px', 'important'); // Align with top edge of selected text
    }
    
    // Pulsate the text once with green color
    this.pulsateText(highlight, true); // true = green pulsate
    
    // Update button states
    ButtonPanel.updateButtonStatesFromSelections();
    
    console.log('[TextSelector] Text moved to askedTexts:', textKey);
    return true;
  },
  
  /**
   * Remove text from askedTexts and restore to normal
   * @param {string} textKey - The text key
   */
  removeFromAskedTexts(textKey) {
    const askedData = this.askedTexts.get(textKey);
    
    if (!askedData) {
      console.warn('[TextSelector] No asked text found for textKey:', textKey);
      return;
    }
    
    const highlight = askedData.highlight;
    
    // Close ChatDialog if it's open for this textKey or related textKey
    if (typeof ChatDialog !== 'undefined' && ChatDialog.isOpen) {
      console.log('[TextSelector] ChatDialog is open - currentTextKey:', ChatDialog.currentTextKey, 'removing textKey:', textKey);
      
      // Check if the current chat is related to this textKey
      // ChatDialog might have textKey in format: textKey-selected, textKey-generic, or exact match
      const shouldClose = ChatDialog.currentTextKey === textKey || 
                         ChatDialog.currentTextKey?.startsWith(textKey + '-') ||
                         ChatDialog.currentTextKey?.includes(textKey) ||
                         textKey?.includes(ChatDialog.currentTextKey?.split('-').slice(0, -1).join('-'));
      
      if (shouldClose) {
        console.log('[TextSelector] Closing ChatDialog for asked text - currentTextKey:', ChatDialog.currentTextKey, 'removing textKey:', textKey);
        ChatDialog.close();
      } else {
        console.log('[TextSelector] ChatDialog open but for different text - currentTextKey:', ChatDialog.currentTextKey, 'removing textKey:', textKey);
        console.log('[TextSelector] Not closing chat as textKeys do not match');
      }
    }
    
    // Remove icons wrapper
    const iconsWrapper = highlight.querySelector('.vocab-text-icons-wrapper');
    if (iconsWrapper) {
      iconsWrapper.remove();
    }
    
    // Remove highlight completely
    this.removeHighlight(highlight);
    
    // Remove from askedTexts map
    this.askedTexts.delete(textKey);
    
    // Remove from textToHighlights map if present
    this.textToHighlights.delete(textKey);
    
    // Remove from analysis data structure for current tab
    ButtonPanel.removeAskedTextFromAnalysisData(textKey);
    
    // Update button states to hide "Remove meanings" if no more data exists
    ButtonPanel.updateButtonStatesFromSelections();
    
    console.log('[TextSelector] Text removed from askedTexts:', textKey);
  },

  /**
   * Remove text from simplifiedTexts and restore to normal
   * @param {string} textKey - The text key
   */
  removeFromSimplifiedTexts(textKey) {
    const simplifiedData = this.simplifiedTexts.get(textKey);
    
    if (!simplifiedData) {
      console.warn('[TextSelector] No simplified text found for textKey:', textKey);
      return;
    }
    
    const highlight = simplifiedData.highlight;
    
    if (!highlight) {
      console.warn('[TextSelector] No highlight element found for simplified text:', textKey);
      this.simplifiedTexts.delete(textKey);
      return;
    }
    
    // Close ChatDialog if it's open (always close when green cross is clicked)
    if (typeof ChatDialog !== 'undefined' && ChatDialog.isOpen) {
      console.log('[TextSelector] ChatDialog is open - closing it when green cross clicked');
      console.log('[TextSelector] Current textKey:', ChatDialog.currentTextKey, 'removing textKey:', textKey);
      ChatDialog.close();
    }
    
    // Immediately add disappearing animation to green cross button (same as purple cross)
    const greenCrossBtn = highlight.querySelector('.vocab-text-remove-green-btn');
    if (greenCrossBtn && !greenCrossBtn.classList.contains('button-disappearing')) {
      greenCrossBtn.classList.add('button-disappearing');
      // Remove button after animation completes (300ms)
      setTimeout(() => {
        greenCrossBtn.remove();
      }, 300);
    }
    
    // Find icons wrapper
    let iconsWrapper = highlight.querySelector('.vocab-text-icons-wrapper');
    if (!iconsWrapper) {
      // Check if icons are in modal overlay (for modal context)
      const modalOverlay = ButtonPanel.topicsModal.customContentModal.overlay;
      if (modalOverlay) {
        iconsWrapper = modalOverlay.querySelector(`[data-text-key="${textKey}"]`);
      }
      // Check if icons are in document body (for main webpage context)
      if (!iconsWrapper) {
        iconsWrapper = document.body.querySelector(`[data-text-key="${textKey}"]`);
      }
    }
    
    // Trigger vanishing animations
    if (iconsWrapper) {
      iconsWrapper.classList.add('vocab-icons-vanishing');
    }
    // Only animate the underline color, not the text itself
    highlight.classList.add('vocab-text-vanishing');
    
    // Immediately add disappearing class to prevent purple underline from appearing
    // This ensures if purple underline becomes visible after simplified class is removed,
    // it will already be in disappearing state
    highlight.classList.add('underline-disappearing');
    
    // Wait for green underline animation to complete before removing elements
    setTimeout(() => {
      // Remove icons wrapper
      if (iconsWrapper) {
        iconsWrapper.remove();
      }
      
      // Remove the simplified class (green underline)
      // After this, if purple underline is visible, it will already be fading out
      highlight.classList.remove('vocab-text-simplified', 'vocab-text-vanishing');
      
      // Continue with removal - purple underline should already be disappearing
      // Wait for purple underline to fade out before actually removing
      setTimeout(() => {
        this.removeHighlight(highlight);
      }, 300); // Wait for purple underline fade-out animation
    }, 300); // Wait for green underline fade-out animation
    
    // Remove from simplifiedTexts map
    this.simplifiedTexts.delete(textKey);
    console.log('[TextSelector] Removed from simplifiedTexts map:', textKey);
    
    // Remove from textToHighlights map if present
    this.textToHighlights.delete(textKey);
    console.log('[TextSelector] Removed from textToHighlights map:', textKey);
    
    // Remove from analysis data structure for current tab
    ButtonPanel.removeSimplifiedTextFromAnalysisData(textKey);
    
    // Update button states to hide "Remove meanings" if no more data exists
    ButtonPanel.updateButtonStatesFromSelections();
    
    console.log('[TextSelector] Text removal completed for:', textKey);
  },
  
  /**
   * Create green remove button for asked texts
   * @param {string} textKey - The text key
   * @returns {HTMLElement} Button element
   */
  createGreenRemoveButtonForAskedText(textKey) {
    const btn = document.createElement('button');
    btn.className = 'vocab-text-remove-green-btn';
    btn.setAttribute('aria-label', 'Remove asked text');
    btn.innerHTML = this.createGreenRemoveIcon();
    
    // Add click handler
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('[TextSelector] Green remove button clicked for asked text:', textKey);
      this.removeFromAskedTexts(textKey);
    });
    
    return btn;
  },

  /**
   * Create green remove button for simplified texts
   * @param {string} textKey - The text key
   * @returns {HTMLElement} Button element
   */
  createGreenRemoveButtonForSimplifiedText(textKey) {
    const btn = document.createElement('button');
    btn.className = 'vocab-text-remove-green-btn';
    btn.setAttribute('aria-label', 'Remove simplified text');
    btn.innerHTML = this.createGreenRemoveIcon();
    
    // Add click handler
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('[TextSelector] Green remove button clicked for simplified text:', textKey);
      this.removeFromSimplifiedTexts(textKey);
    });
    
    return btn;
  },

  /**
   * Create a chat button for the highlight
   * @param {string} textKey - The text key
   * @param {boolean} isGreen - Whether to use green color (default: false for purple)
   * @returns {HTMLElement}
   */
  createChatButton(textKey, isGreen = false) {
    const btn = document.createElement('button');
    btn.className = isGreen ? 'vocab-text-chat-btn vocab-text-chat-btn-green chat-breathing' : 'vocab-text-chat-btn chat-breathing';
    btn.setAttribute('aria-label', 'Open chat');
    btn.innerHTML = this.createChatIcon(isGreen);
    
    // Add click handler
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Get text from askedTexts or textToHighlights
      const askedData = this.askedTexts.get(textKey);
      const highlight = askedData ? askedData.highlight : this.textToHighlights.get(textKey);
      
      if (highlight) {
        // Use green pulsate if it's a green icon (from askedTexts)
        this.pulsateText(highlight, isGreen);
        
        // Open chat dialog with selected context
        const originalText = highlight.textContent.replace(/\s+/g, ' ').trim();
        ChatDialog.open(originalText, textKey, 'ask', null, 'selected');
      }
    });
    
    // Remove breathing class after animation completes
    setTimeout(() => {
      btn.classList.remove('chat-breathing');
    }, 1600); // Match animation duration
    
    return btn;
  },
  
  /**
   * Create chat icon SVG - Solid circle with white chat icon (bigger)
   * @param {boolean} isGreen - Whether to use green color (default: false for purple)
   * @returns {string} SVG markup
   */
  createChatIcon(isGreen = false) {
    const color = isGreen ? '#22c55e' : '#9527F5';
    return `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="10" r="9" fill="${color}"/>
        <path d="M10 6C8.239 6 6.5 7.459 6.5 8.875C6.5 9.681 6.994 10.4 7.348 10.856L6.744 12.246C6.664 12.39 6.664 12.569 6.744 12.714C6.825 12.858 6.999 12.951 7.181 12.951C7.241 12.951 7.301 12.939 7.358 12.915L8.571 12.464C9.404 12.656 10.318 12.75 11.25 12.75C12.511 12.75 13.75 11.791 13.75 10.375C13.75 8.959 12.511 6 10 6Z" fill="white"/>
        <circle cx="8" cy="9.25" r="0.8" fill="${color}"/>
        <circle cx="10" cy="9.25" r="0.8" fill="${color}"/>
        <circle cx="12" cy="9.25" r="0.8" fill="${color}"/>
      </svg>
    `;
  },
  
  /**
   * Create book icon button for simplified texts
   * @param {string} textKey - The text key
   * @returns {HTMLElement}
   */
  createBookButton(textKey) {
    const btn = document.createElement('button');
    btn.className = 'vocab-text-book-btn book-breathing';
    btn.setAttribute('aria-label', 'View simplified text');
    btn.innerHTML = this.createBookIcon();
    
    // Add click handler with improved toggle logic - use capture phase to ensure it fires
    // Use a flag to prevent double-triggering from multiple event handlers
    let isProcessing = false;
    
    const handleBookClick = (e) => {
      // Prevent double-triggering
      if (isProcessing) {
        console.log('[TextSelector] Book click already processing, ignoring duplicate event');
        return;
      }
      
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation(); // Prevent other handlers from interfering
      
      isProcessing = true;
      
      console.log('[TextSelector] Book icon clicked for:', textKey);
      
      // Get simplified text data first
      const simplifiedData = this.simplifiedTexts.get(textKey);
      if (!simplifiedData) {
        console.warn('[TextSelector] No simplified data found for textKey:', textKey);
        isProcessing = false;
        return;
      }
      
      // Comprehensive check if chat dialog is already open for this text segment
      // Handle all possible textKey format variations
      // Also check if dialog is currently opening (expanding) to prevent race conditions
      let isChatOpenForThisText = false;
      let isDialogOpening = false;
      
      if (typeof ChatDialog !== 'undefined') {
        // Check if dialog is currently opening (expanding animation)
        if (ChatDialog.dialogContainer && ChatDialog.dialogContainer.classList.contains('expanding')) {
          isDialogOpening = true;
          console.log('[TextSelector] Dialog is currently opening (expanding), waiting...');
        }
        
        // Only check if dialog is open if it's not currently opening
        if (ChatDialog.isOpen && ChatDialog.currentTextKey && !isDialogOpening) {
          const currentKey = ChatDialog.currentTextKey;
          const originalTextKey = textKey;
          
          // Strategy 1: Exact match
          if (currentKey === originalTextKey) {
            isChatOpenForThisText = true;
          }
          // Strategy 2: Match with -selected suffix
          else if (currentKey === `${originalTextKey}-selected`) {
            isChatOpenForThisText = true;
          }
          // Strategy 3: Match when currentKey starts with textKey
          else if (currentKey.startsWith(originalTextKey + '-')) {
            isChatOpenForThisText = true;
          }
          // Strategy 4: Match when textKey is part of currentKey (for complex formats)
          else if (currentKey.includes(originalTextKey)) {
            isChatOpenForThisText = true;
          }
          // Strategy 5: Match by simplifiedData (textStartIndex and textLength)
          else if (simplifiedData && simplifiedData.textStartIndex !== undefined && simplifiedData.textLength !== undefined) {
            // Extract start index and length from currentKey if it's in format: contentType-tabId-startIndex-length
            const currentKeyParts = currentKey.split('-');
            if (currentKeyParts.length >= 4) {
              const currentStartIndex = parseInt(currentKeyParts[currentKeyParts.length - 2]);
              const currentLength = parseInt(currentKeyParts[currentKeyParts.length - 1]);
              
              if (currentStartIndex === simplifiedData.textStartIndex && 
                  currentLength === simplifiedData.textLength) {
                isChatOpenForThisText = true;
              }
            }
            // Strategy 6: Match by checking if currentKey ends with startIndex-length pattern
            const expectedSuffix = `${simplifiedData.textStartIndex}-${simplifiedData.textLength}`;
            if (currentKey.endsWith(expectedSuffix)) {
              isChatOpenForThisText = true;
            }
          }
          // Strategy 7: Reverse check - check if originalTextKey contains parts of currentKey
          if (!isChatOpenForThisText) {
            const currentKeyPartsForBase = currentKey.split('-');
            const originalKeyParts = originalTextKey.split('-');
            if (currentKeyPartsForBase.length >= 2 && originalKeyParts.length >= 2) {
              // Compare base parts (contentType-tabId)
              const currentBase = currentKeyPartsForBase.slice(0, 2).join('-');
              const originalBase = originalKeyParts.slice(0, 2).join('-');
              if (currentBase === originalBase && simplifiedData) {
                // If base matches and we have simplifiedData, check by position
                if (currentKeyPartsForBase.length >= 4) {
                  const currentStartIndex = parseInt(currentKeyPartsForBase[currentKeyPartsForBase.length - 2]);
                  const currentLength = parseInt(currentKeyPartsForBase[currentKeyPartsForBase.length - 1]);
                  if (currentStartIndex === simplifiedData.textStartIndex && 
                      currentLength === simplifiedData.textLength) {
                    isChatOpenForThisText = true;
                  }
                }
              }
            }
          }
          
          console.log('[TextSelector] Toggle check - isOpen:', ChatDialog.isOpen, 'currentTextKey:', currentKey, 'originalTextKey:', originalTextKey, 'isChatOpenForThisText:', isChatOpenForThisText);
        }
      }
      
      // If dialog is currently opening, wait a bit and check again
      if (isDialogOpening) {
        console.log('[TextSelector] Dialog is opening, waiting before checking toggle state...');
        setTimeout(() => {
          isProcessing = false;
          // Re-trigger the click after dialog finishes opening
          setTimeout(() => {
            handleBookClick(e);
          }, 350); // Wait for expansion animation to complete (0.3s + small buffer)
        }, 50);
        return;
      }
      
      if (isChatOpenForThisText) {
        // Chat is already open for this text - close it (toggle off)
        console.log('[TextSelector] Chat dialog is already open for this text, closing it');
        ChatDialog.close();
        isProcessing = false;
        return;
      }
      
      // Chat is not open for this text - open it (toggle on)
        // Pulsate the text
        const highlight = this.textToHighlights.get(textKey);
        if (highlight) {
          this.pulsateText(highlight, true);
        }
        
        // Open ChatDialog in simplified mode with selected context
        // Always use 'selected' context when opening from book icon to ensure expansion animation
      // Note: ChatDialog.open() will handle the toggle if dialog is already open for same text
        ChatDialog.open(simplifiedData.text, textKey, 'simplified', simplifiedData, 'selected');
      
      // Reset processing flag after a delay to allow for state changes
      // Use longer delay to ensure dialog is fully opened before allowing another click
      setTimeout(() => {
        isProcessing = false;
      }, 600); // Wait for dialog to fully open (0.3s animation + buffer)
    };
    
    // Add both click and mousedown handlers to ensure it works on all websites
    // Use capture phase to ensure handlers fire before website handlers
    btn.addEventListener('click', handleBookClick, { capture: true, passive: false });
    btn.addEventListener('mousedown', (e) => {
      // Only trigger on left mouse button and if click handler didn't fire
      if (e.button === 0 && !isProcessing) {
        // Small delay to let click handler run first if it exists
        setTimeout(() => {
          if (!isProcessing) {
            handleBookClick(e);
          }
        }, 10);
      }
    }, { capture: true, passive: false });
    
    // Remove breathing class after animation completes
    setTimeout(() => {
      btn.classList.remove('book-breathing');
    }, 1600); // Match animation duration
    
    return btn;
  },
  
  /**
   * Create book icon SVG - Wireframe open book icon with thick green lines
   * @returns {string} SVG markup
   */
  createBookIcon() {
    return `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 19.5C4 18.837 4.526 18 5.5 18H11M20 19.5C20 18.837 19.474 18 18.5 18H13" stroke="#22c55e" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 18V6M12 6C12 6 10 4 6.5 4C4.5 4 4 5 4 6V18C4 18 4.5 18 6.5 18C10 18 12 18 12 18M12 6C12 6 14 4 17.5 4C19.5 4 20 5 20 6V18C20 18 19.5 18 17.5 18C14 18 12 18 12 18" stroke="#22c55e" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  },
  
  /**
   * Create magic-meaning button for text selection
   * @param {string} textKey - The text key
   * @returns {HTMLElement}
   */
  createMagicMeaningButton(textKey) {
    const btn = document.createElement('button');
    btn.className = 'vocab-text-magic-meaning-btn magic-meaning-breathing';
    btn.setAttribute('aria-label', 'Get magic meaning');
    btn.innerHTML = this.createMagicMeaningIcon();
    
    // Add click handler
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      console.log('[TextSelector] Magic-meaning button clicked for:', textKey);
      
      // Get the highlight element
      const highlight = this.textToHighlights.get(textKey);
      if (!highlight) {
        console.warn('[TextSelector] No highlight found for textKey:', textKey);
        return;
      }
      
      // Add fast pulsating animation to the text
      highlight.classList.add('vocab-text-loading');
      
      // Show spinner in place of magic-meaning button
      const iconsWrapper = highlight.querySelector('.vocab-text-icons-wrapper');
      if (iconsWrapper) {
        const magicBtn = iconsWrapper.querySelector('.vocab-text-magic-meaning-btn');
        if (magicBtn) {
          // Hide the button and show spinner
          magicBtn.style.display = 'none';
          
          // Create and show spinner
          const spinnerContainer = document.createElement('div');
          spinnerContainer.className = 'vocab-magic-meaning-spinner-container';
          spinnerContainer.setAttribute('data-text-key', textKey);
          
          const spinner = document.createElement('div');
          spinner.className = 'vocab-magic-meaning-spinner';
          
          spinnerContainer.appendChild(spinner);
          iconsWrapper.appendChild(spinnerContainer);
        }
      }
      
      // Call handleMagicMeaning for this specific text only
      ButtonPanel.handleMagicMeaningForText(textKey);
    });
    
    return btn;
  },
  
  /**
   * Create magic-meaning icon SVG - White sparkle icon (matching main button design)
   * @returns {string} SVG markup
   */
  createMagicMeaningIcon() {
    return `
      <svg width="24" height="24" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 0L17 8L25 11L17 14L14 22L11 14L3 11L11 8L14 0Z" fill="#9527F5"/>
        <path d="M22 16L23.5 20L27.5 21.5L23.5 23L22 27L20.5 23L16.5 21.5L20.5 20L22 16Z" fill="#9527F5"/>
        <path d="M8 21L9.5 24.5L13 26L9.5 27.5L8 31L6.5 27.5L3 26L6.5 24.5L8 21Z" fill="#9527F5"/>
      </svg>
    `;
  },
  
  /**
   * Pulsate text highlight with color (green for asked texts, purple for selected)
   * @param {HTMLElement} highlight - The highlight element
   * @param {boolean} isGreen - Whether to use green color (default: false for purple)
   */
  pulsateText(highlight, isGreen = false) {
    // Add appropriate pulsate class
    const className = isGreen ? 'vocab-text-pulsate-green' : 'vocab-text-pulsate';
    highlight.classList.add(className);
    
    // Remove class after animation completes (0.6s for purple, 1.2s for green)
    const duration = isGreen ? 1200 : 600;
    setTimeout(() => {
      highlight.classList.remove(className);
    }, duration);
  },
  
  /**
   * Inject CSS styles for text highlights
   */
  injectStyles() {
    const styleId = 'vocab-text-selector-styles';
    
    // Check if styles already injected
    if (document.getElementById(styleId)) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Text highlight wrapper - Dashed underline that works across paragraphs */
      .vocab-text-highlight {
        position: relative;
        text-decoration-line: underline;
        text-decoration-style: dashed;
        text-decoration-color: #B88AE6; /* Lighter purple - fully opaque */
        text-decoration-thickness: 0.6px;
        text-underline-offset: 2px;
        cursor: text;
        overflow: visible;
        transition: text-decoration-color 0.3s ease-in-out, opacity 0.3s ease-in-out;
        opacity: 1;
        font-size: inherit !important; /* Preserve original font size */
        font-family: inherit !important; /* Preserve original font family */
        font-weight: inherit !important; /* Preserve original font weight */
        line-height: inherit !important; /* Preserve original line height */
        /* DO NOT set color: inherit on the highlight span - it can interfere with child element colors */
        /* Text nodes will inherit naturally from the highlight span's parent context */
        /* Child elements with inline styles or color classes will maintain their colors */
        letter-spacing: inherit !important; /* Preserve original letter spacing */
      }
      
      /* Smooth animation for underline appearance - 0.3s duration */
      .vocab-text-highlight.underline-appearing {
        text-decoration-color: transparent;
        animation: underlineFadeIn 0.3s ease-in-out forwards;
      }
      
      /* Smooth animation for underline disappearance - same 0.3s duration */
      .vocab-text-highlight.underline-disappearing {
        animation: underlineFadeOut 0.3s ease-in-out forwards;
      }
      
      /* Prevent purple underline from appearing when simplified text is being removed */
      /* Keep underline transparent during disappearing animation to avoid glitch */
      .vocab-text-highlight.underline-disappearing:not(.vocab-text-simplified) {
        text-decoration-color: transparent !important;
        animation: none; /* Prevent animation from purple, keep it transparent */
      }
      
      @keyframes underlineFadeIn {
        0% {
          text-decoration-color: transparent;
        }
        100% {
          text-decoration-color: #B88AE6; /* Lighter purple - fully opaque */
        }
      }
      
      @keyframes underlineFadeOut {
        0% {
          text-decoration-color: #B88AE6; /* Lighter purple - fully opaque */
        }
        100% {
          text-decoration-color: transparent;
        }
      }
      
      /* For block-level elements inside highlight, maintain underline */
      /* DO NOT override font-weight or color for formatting elements - let them use their own styles */
      /* Exclude elements with color classes or inline styles from the universal selector */
      .vocab-text-highlight *:not([class*="user-"]):not([class*="rated-"]):not([style*="color"]):not([style*="Color"]) {
        text-decoration: inherit;
        box-sizing: border-box;
        font-size: inherit !important; /* Preserve original font size for child elements */
        font-family: inherit !important; /* Preserve original font family for child elements */
        /* DO NOT set font-weight: inherit - let formatting elements (b, strong) use their default bold */
        /* DO NOT set color: inherit - let child elements use their own colors (inline styles, classes, etc.) */
        line-height: inherit !important; /* Preserve original line height for child elements */
        letter-spacing: inherit !important; /* Preserve original letter spacing for child elements */
      }
      
      /* Apply base styles to all elements, but exclude color-related elements */
      .vocab-text-highlight * {
        text-decoration: inherit;
        box-sizing: border-box;
      }
      
      /* Ensure formatting elements maintain their bold/italic styling */
      .vocab-text-highlight b,
      .vocab-text-highlight strong {
        font-weight: bold !important; /* Force bold for b and strong tags */
      }
      
      .vocab-text-highlight em,
      .vocab-text-highlight i {
        font-style: italic !important; /* Force italic for em and i tags */
      }
      
      /* Preserve colors on child elements - don't force inherit */
      /* Child elements with inline styles, classes, or default colors will maintain them */
      /* Text nodes will naturally inherit from the highlight span, which inherits from the original parent */
      
      /* Ensure elements with inline color styles maintain their colors */
      /* Inline styles have highest specificity - they will work automatically */
      /* No CSS rule needed - inline styles cannot be overridden by CSS */
      
      /* Ensure elements with color classes maintain their colors AND the underline */
      /* DO NOT override color for these elements - let website's CSS apply */
      /* BUT ensure the purple underline is preserved */
      .vocab-text-highlight a.user-orange,
      .vocab-text-highlight a.rated-user,
      .vocab-text-highlight a[class*="user-orange"],
      .vocab-text-highlight a[class*="user-red"],
      .vocab-text-highlight a[class*="user-blue"],
      .vocab-text-highlight a[class*="user-green"],
      .vocab-text-highlight a[class*="user-purple"],
      .vocab-text-highlight a[class*="user-yellow"],
      .vocab-text-highlight a[class*="user-cyan"],
      .vocab-text-highlight a[class*="user-gray"],
      .vocab-text-highlight a[class*="user-black"],
      .vocab-text-highlight .user-orange,
      .vocab-text-highlight .user-red,
      .vocab-text-highlight .user-blue,
      .vocab-text-highlight .user-green,
      .vocab-text-highlight .user-purple,
      .vocab-text-highlight .user-yellow,
      .vocab-text-highlight .user-cyan,
      .vocab-text-highlight .user-gray,
      .vocab-text-highlight .user-black,
      .vocab-text-highlight .rated-user {
        /* Don't set color at all - let the website's CSS for these classes apply */
        /* The website's CSS should have the same or higher specificity */
        /* By not setting color here, the website's CSS will apply */
        /* BUT preserve the purple underline from the parent highlight */
        text-decoration: inherit !important; /* Inherit the purple underline from parent */
        text-decoration-line: underline !important; /* Ensure underline is visible */
        text-decoration-style: dashed !important; /* Ensure dashed style */
        text-decoration-color: #B88AE6 !important; /* Ensure purple color */
        text-decoration-thickness: 0.6px !important; /* Ensure thickness */
        text-underline-offset: 2px !important; /* Ensure offset */
      }
      
      /* Also ensure elements with inline color styles preserve the underline */
      .vocab-text-highlight [style*="color"],
      .vocab-text-highlight [style*="Color"] {
        /* Preserve the purple underline even for elements with inline color styles */
        text-decoration: inherit !important; /* Inherit the purple underline from parent */
        text-decoration-line: underline !important; /* Ensure underline is visible */
        text-decoration-style: dashed !important; /* Ensure dashed style */
        text-decoration-color: #B88AE6 !important; /* Ensure purple color */
        text-decoration-thickness: 0.6px !important; /* Ensure thickness */
        text-underline-offset: 2px !important; /* Ensure offset */
      }
      
      /* Ensure elements with inline color styles work - inline styles have highest specificity */
      /* No CSS rule needed - inline styles cannot be overridden by CSS */
      
      /* Remove button - White circle with purple border and purple cross on top-left */
      .vocab-text-remove-btn {
        position: absolute;
        top: -10px;
        left: -10px;
        width: 18px;
        height: 18px;
        background-color: #FFFFFF !important; /* Fully opaque white background */
        background: #FFFFFF !important; /* Fully opaque white background */
        border: 1px solid #9527F5 !important; /* Thin purple border */
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 1 !important; /* Fully opaque */
        transition: opacity 0.3s ease-in-out, transform 0.1s ease, background-color 0.2s ease, scale 0.3s ease-in-out, border-color 0.2s ease;
        padding: 0;
        z-index: 10000003;
        box-shadow: 0 2px 4px rgba(149, 39, 245, 0.4);
        pointer-events: auto;
        box-sizing: border-box;
      }
      
      /* Smooth animation for button appearance - 0.3s duration (same as underline) */
      .vocab-text-remove-btn.button-appearing {
        opacity: 0;
        transform: scale(0.8);
        animation: buttonFadeIn 0.3s ease-in-out forwards;
      }
      
      /* Smooth animation for button disappearance - 0.3s duration (same as underline) */
      .vocab-text-remove-btn.button-disappearing {
        animation: buttonFadeOut 0.3s ease-in-out forwards;
      }
      
      @keyframes buttonFadeIn {
        0% {
          opacity: 0;
          transform: scale(0.8);
        }
        100% {
          opacity: 1;
          transform: scale(1);
        }
      }
      
      @keyframes buttonFadeOut {
        0% {
          opacity: 1;
          transform: scale(1);
        }
        100% {
          opacity: 0;
          transform: scale(0.8);
        }
      }
      
      .vocab-text-highlight:hover .vocab-text-remove-btn {
        opacity: 1 !important;
      }
      
      .vocab-text-remove-btn:hover {
        transform: scale(1.15);
        opacity: 1 !important; /* Fully opaque on hover */
        background-color: #FFFFFF !important; /* Keep fully opaque white background on hover */
        background: #FFFFFF !important; /* Keep fully opaque white background on hover */
        border-color: #7a1fd9 !important; /* Slightly darker purple border on hover */
      }
      
      .vocab-text-remove-btn:active {
        transform: scale(0.95);
      }
      
      .vocab-text-remove-btn svg {
        pointer-events: none;
        display: block;
        width: 10px;
        height: 10px;
      }
      
      /* Remove purple border from cross button when text is loading (spinner active) */
      .vocab-text-highlight.vocab-text-loading .vocab-text-remove-btn {
        border: none !important;
      }
      
      /* Make cross icon green when text has green dashed underline (simplified/explained) */
      .vocab-text-highlight.vocab-text-simplified .vocab-text-remove-btn {
        border-color: #22c55e !important; /* Green border */
        box-shadow: 0 2px 4px rgba(34, 197, 94, 0.4) !important; /* Green shadow */
      }
      
      .vocab-text-highlight.vocab-text-simplified .vocab-text-remove-btn:hover {
        border-color: #16a34a !important; /* Darker green border on hover */
      }
      
      /* Make cross icon green - use multiple selectors to ensure it overrides inline styles */
      .vocab-text-highlight.vocab-text-simplified .vocab-text-remove-btn svg path,
      .vocab-text-highlight.vocab-text-simplified .vocab-text-remove-btn svg > path {
        stroke: #22c55e !important; /* Green cross icon */
        fill: none !important;
      }
      
      /* Also target the SVG element itself to ensure green color */
      .vocab-text-highlight.vocab-text-simplified .vocab-text-remove-btn svg {
        color: #22c55e !important;
      }
      
      /* Wrapper containers for icon groups */
      .vocab-text-icons-wrapper {
        position: absolute !important; /* Force absolute positioning */
        display: flex !important;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        z-index: 10000003 !important;
        animation: vocab-icon-appear 0.4s ease-out;
        pointer-events: auto !important;
        transition: opacity 0.3s ease-out, transform 0.3s ease-out;
        left: -45px !important; /* Default: position on left side, outside text */
        right: auto !important; /* Ensure right is not set */
        top: 0px !important; /* Align with top of text */
        margin: 0 !important; /* Remove any margins */
        padding: 0 !important; /* Remove any padding */
        width: auto !important; /* Auto width */
        height: auto !important; /* Auto height */
        min-width: 0 !important; /* No min-width */
        max-width: none !important; /* No max-width */
      }

      /* Modal context: enhanced styling */
      .vocab-custom-content-modal .vocab-text-icons-wrapper {
        z-index: 10000005;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 8px;
        padding: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        left: -50px !important; /* Position on left side in modal context */
        right: auto !important; /* Ensure right is not set */
      }
      
      /* Chat button - Solid purple circle with white chat icon on top-left (bigger) */
      /* Smooth icon appearance animation - slide from left */
      @keyframes vocab-icon-appear {
        0% {
          opacity: 0;
          transform: translateX(-15px) scale(0.8); /* Slide from left */
        }
        60% {
          transform: translateX(0) scale(1.05);
        }
        100% {
          opacity: 0.95;
          transform: translateX(0) scale(1);
        }
      }
      
      .vocab-text-chat-btn {
        position: relative;
        width: 28px;
        height: 28px;
        background: transparent;
        border: none;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 0.95;
        transition: opacity 0.2s ease, transform 0.1s ease;
        padding: 0;
        flex-shrink: 0;
      }
      
      .vocab-text-highlight:hover .vocab-text-icons-wrapper {
        opacity: 1;
      }
      
      .vocab-text-chat-btn:hover {
        transform: scale(1.15);
        opacity: 1;
      }
      
      .vocab-text-chat-btn:active {
        transform: scale(0.95);
      }
      
      .vocab-text-chat-btn svg {
        pointer-events: none;
        display: block;
        width: 28px;
        height: 28px;
      }
      
      /* Book button - Wireframe open book icon on top-left */
      .vocab-text-book-btn {
        position: relative;
        width: 28px;
        height: 28px;
        background: #d1fae5 !important; /* Circular light green opaque container (no transparency) */
        border: none !important; /* No border */
        border-radius: 50% !important; /* Circular shape */
        display: flex !important;
        align-items: center;
        justify-content: center;
        cursor: pointer !important;
        opacity: 0.95;
        transition: opacity 0.2s ease, transform 0.15s ease;
        padding: 0;
        flex-shrink: 0;
        box-shadow: 0 2px 4px rgba(34, 197, 94, 0.2); /* Subtle green shadow for depth */
        pointer-events: auto !important; /* Ensure button is clickable on all websites */
        z-index: 10000004 !important; /* Ensure button is above other elements */
        user-select: none !important; /* Prevent text selection */
        -webkit-user-select: none !important;
      }
      
      .vocab-text-book-btn:hover {
        transform: scale(1.1);
        opacity: 1;
      }
      
      .vocab-text-book-btn:active {
        transform: scale(0.9);
      }
      
      .vocab-text-book-btn svg {
        pointer-events: none;
        display: block;
        width: 24px;
        height: 24px;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
      }
      
      /* Book button breathing animation when first appears */
      .vocab-text-book-btn.book-breathing {
        animation: bookBreathing 1.6s ease-in-out;
      }
      
      /* Magic-meaning button - Purple sparkle icon with light purple opaque background */
      .vocab-text-magic-meaning-btn {
        position: relative !important;
        width: 32px !important;
        height: 32px !important;
        min-width: 32px !important; /* Ensure minimum width */
        min-height: 32px !important; /* Ensure minimum height */
        max-width: 32px !important; /* Ensure maximum width */
        max-height: 32px !important; /* Ensure maximum height */
        aspect-ratio: 1 / 1 !important; /* Force perfect square/circle */
        background: #e9d5ff !important; /* Circular light purple opaque container (no transparency) */
        border: none !important; /* Remove border */
        border-radius: 50% !important; /* Circular shape */
        display: flex !important;
        align-items: center;
        justify-content: center;
        cursor: pointer !important;
        opacity: 0.95;
        transition: opacity 0.2s ease, transform 0.15s ease, background-color 0.2s ease;
        padding: 0 !important;
        flex-shrink: 0;
        box-sizing: border-box !important; /* Include border in width/height */
        box-shadow: 0 2px 4px rgba(149, 39, 245, 0.2); /* Subtle purple shadow for depth */
        margin: 0 !important; /* No margin */
      }
      
      /* Magic-meaning button continuous breathing animation */
      .vocab-text-magic-meaning-btn.magic-meaning-breathing {
        animation: magicMeaningBreathingContinuous 2s ease-in-out infinite;
      }
      
      @keyframes magicMeaningBreathingContinuous {
        0%, 100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.15);
        }
      }
      
      .vocab-text-magic-meaning-btn:hover {
        opacity: 1;
        background-color: #ddd6fe !important; /* Slightly darker purple on hover */
        animation: magicMeaningBreathingContinuous 2s ease-in-out infinite; /* Keep breathing on hover */
      }
      
      .vocab-text-magic-meaning-btn:active {
        transform: scale(0.9);
      }
      
      .vocab-text-magic-meaning-btn svg {
        pointer-events: none;
        display: block;
        width: 22px;
        height: 22px;
        filter: drop-shadow(0 1px 2px rgba(149, 39, 245, 0.3));
        transform: translateY(-1px);
      }
      
      /* Spinner container for magic-meaning button during API call */
      .vocab-magic-meaning-spinner-container {
        position: relative !important;
        width: 32px !important;
        height: 32px !important;
        min-width: 32px !important; /* Ensure minimum width */
        min-height: 32px !important; /* Ensure minimum height */
        max-width: 32px !important; /* Ensure maximum width */
        max-height: 32px !important; /* Ensure maximum height */
        aspect-ratio: 1 / 1 !important; /* Force perfect square/circle */
        background: white !important; /* Circular white opaque container */
        border: none !important; /* No border */
        border-radius: 50% !important; /* Circular shape */
        display: block !important; /* Block display for absolute child positioning */
        flex-shrink: 0 !important;
        box-shadow: 0 2px 4px rgba(149, 39, 245, 0.2); /* Subtle purple shadow */
        box-sizing: border-box !important; /* Include border in width/height */
        padding: 0 !important; /* No padding */
        margin: 0 !important; /* No margin */
        overflow: visible !important; /* Ensure spinner is visible */
        line-height: 0 !important; /* Remove line height */
        vertical-align: middle !important; /* Vertical alignment */
      }
      
      /* Spinner - dark purple spinning circle */
      .vocab-magic-meaning-spinner {
        position: absolute !important; /* Use absolute positioning for perfect centering */
        width: 18px !important;
        height: 18px !important;
        min-width: 18px !important; /* Ensure minimum width */
        min-height: 18px !important; /* Ensure minimum height */
        max-width: 18px !important; /* Ensure maximum width */
        max-height: 18px !important; /* Ensure maximum height */
        aspect-ratio: 1 / 1 !important; /* Force perfect square/circle */
        border-width: 2px 2px 2px 2px !important; /* Uniform border width on all sides */
        border-style: solid !important; /* Solid border style */
        border-color: rgba(149, 39, 245, 0.2) !important; /* Light purple border */
        border-top-color: #9527F5 !important; /* Dark purple top border for spinner effect */
        border-radius: 50% !important; /* Perfect circle */
        animation: vocab-magic-spinner-spin 0.8s linear infinite !important; /* Ensure animation runs */
        box-sizing: border-box !important; /* Include border in width/height */
        padding: 0 !important; /* No padding */
        margin: 0 !important; /* No margin */
        flex-shrink: 0 !important; /* Prevent shrinking */
        display: block !important; /* Block display */
        top: 50% !important; /* Center vertically */
        left: 50% !important; /* Center horizontally */
        transform-origin: center center !important; /* Rotation center */
        line-height: 0 !important; /* Remove line height */
        vertical-align: middle !important; /* Vertical alignment */
        overflow: visible !important; /* Allow spinner to be visible */
        will-change: transform !important; /* Optimize animation */
        /* Initial transform will be set by animation */
      }
      
      @keyframes vocab-magic-spinner-spin {
        0% {
          transform: translate(-50%, -50%) rotate(0deg);
        }
        100% {
          transform: translate(-50%, -50%) rotate(360deg);
        }
      }
      
      @keyframes bookBreathing {
        0% {
          transform: scale(1);
          opacity: 0.7;
        }
        25% {
          transform: scale(1.3);
          opacity: 1;
        }
        50% {
          transform: scale(1);
          opacity: 0.8;
        }
        75% {
          transform: scale(1.3);
          opacity: 1;
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }
      
      /* Chat button breathing animation when first appears */
      .vocab-text-chat-btn.chat-breathing {
        animation: chatBreathing 1.6s ease-in-out;
      }
      
      @keyframes chatBreathing {
        0% {
          transform: scale(1);
          opacity: 0.7;
        }
        25% {
          transform: scale(2.0);
          opacity: 1;
        }
        50% {
          transform: scale(1);
          opacity: 0.8;
        }
        75% {
          transform: scale(2.0);
          opacity: 1;
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }
      
      /* Green remove button - green cross on white circular background with green border */
      .vocab-text-remove-green-btn {
        position: relative;
        width: 18px;
        height: 18px;
        background-color: #FFFFFF !important; /* Fully opaque white background */
        background: #FFFFFF !important; /* Fully opaque white background */
        border: 1px solid #22c55e !important; /* Green border */
        border-radius: 50% !important; /* Circular shape */
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 1 !important; /* Fully opaque */
        transition: opacity 0.2s ease, transform 0.15s ease, background-color 0.2s ease, border-color 0.2s ease;
        padding: 0;
        flex-shrink: 0;
        box-sizing: border-box;
        box-shadow: 0 1px 3px rgba(34, 197, 94, 0.2);
      }
      
      .vocab-text-remove-green-btn:hover {
        transform: scale(1.15);
        opacity: 1 !important; /* Fully opaque on hover */
        background-color: #FFFFFF !important; /* Keep fully opaque white background on hover */
        background: #FFFFFF !important; /* Keep fully opaque white background on hover */
        border-color: #16a34a !important; /* Slightly darker green border on hover */
      }
      
      .vocab-text-remove-green-btn:active {
        transform: scale(0.95);
      }
      
      .vocab-text-remove-green-btn.button-disappearing {
        animation: buttonFadeOut 0.3s ease-in-out forwards;
      }
      
      .vocab-text-remove-green-btn svg {
        pointer-events: none;
        display: block;
        width: 10px;
        height: 10px;
      }
      
      /* Light green dashed underline for simplified texts - same green as chat icon */
      .vocab-text-simplified {
        text-decoration-color: #22c55e !important;
        text-decoration-style: dashed !important;
        text-decoration-thickness: 1.1px !important;
        transition: text-decoration-color 0.3s ease-out;
      }
      
      /* Vanishing animation for simplified text */
      .vocab-text-simplified.vocab-text-vanishing {
        text-decoration-color: transparent !important;
        transition: text-decoration-color 0.3s ease-out;
      }
      
      /* Vanishing animation for icons wrapper */
      .vocab-text-icons-wrapper.vocab-icons-vanishing {
        opacity: 0;
        transform: scale(0.8) translateY(-10px);
        pointer-events: none;
        transition: opacity 0.3s ease-out, transform 0.3s ease-out;
        animation: none; /* Disable appearance animation when vanishing */
      }
      
      /* Pulsate animation for text highlights - light purple */
      @keyframes vocab-text-pulsate {
        0% {
          background-color: transparent;
        }
        50% {
          background-color: rgba(196, 181, 253, 0.7); /* Purple with slight transparency - lighter shade */
        }
        100% {
          background-color: transparent;
        }
      }
      
      .vocab-text-pulsate {
        animation: vocab-text-pulsate 0.6s ease-in-out;
      }
      
      /* Loading animation - pulsating light purple background (fast) */
      @keyframes vocab-text-loading-breathe {
        0%, 100% {
          background-color: transparent;
        }
        50% {
          background-color: rgba(196, 181, 253, 0.7); /* Purple with slight transparency - lighter shade */
        }
      }
      
      .vocab-text-loading {
        animation: vocab-text-loading-breathe 0.75s ease-in-out infinite;
        text-decoration: none !important;
        border-radius: 3px;
      }
      
      /* Pulsate animation for text highlights - light green (pulsates twice) */
      @keyframes vocab-text-pulsate-green {
        0% {
          background-color: transparent;
        }
        25% {
          background-color: rgba(34, 197, 94, 0.15);
        }
        50% {
          background-color: transparent;
        }
        75% {
          background-color: rgba(34, 197, 94, 0.15);
        }
        100% {
          background-color: transparent;
        }
      }
      
      .vocab-text-pulsate-green {
        animation: vocab-text-pulsate-green 1.2s ease-in-out;
      }
      
      /* Notification banner at top right */
      .vocab-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        color: #9527F5;
        padding: 12px 40px 12px 20px;
        border-radius: 12px;
        border: 1px solid #9527F5;
        font-size: 14px;
        font-weight: 500;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        box-shadow: 0 4px 12px rgba(149, 39, 245, 0.3);
        z-index: 9999999;
        opacity: 0;
        transform: translateX(400px);
        transition: opacity 0.3s ease, transform 0.3s ease;
        pointer-events: all;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .vocab-notification.visible {
        opacity: 1;
        transform: translateX(0);
      }
      
      /* Close button inside notification */
      .vocab-notification-close {
        position: absolute;
        left: 8px;
        top: 50%;
        transform: translateY(-50%);
        width: 20px;
        height: 20px;
        background: none;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 0.6;
        transition: opacity 0.2s ease, transform 0.1s ease;
        padding: 0;
      }
      
      .vocab-notification-close:hover {
        opacity: 1;
        transform: translateY(-50%) scale(1.1);
      }
      
      .vocab-notification-close:active {
        transform: translateY(-50%) scale(0.9);
      }
      
      .vocab-notification-close svg {
        pointer-events: none;
        display: block;
      }
      
      /* Notification message text */
      .vocab-notification-message {
        margin-left: 24px;
      }
      
      /* Notification types */
      .vocab-notification-error {
        background: #ffebee;
        color: #c62828;
        border-left: 4px solid #c62828;
      }
      
      .vocab-notification-success {
        background: #e8f5e8;
        color: #2e7d32;
        border-left: 4px solid #2e7d32;
      }
      
      .vocab-notification-info {
        background: #e3f2fd;
        color: #1565c0;
        border-left: 4px solid #1565c0;
      }
      
      /* Top-right ask-about-page button */
      .vocab-ask-about-page-btn {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 48px;
        height: 48px;
        background: #9527F5;
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 0.95;
        transition: opacity 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        padding: 0;
        z-index: 10000000;
        box-shadow: 0 2px 8px rgba(149, 39, 245, 0.4);
        pointer-events: auto;
        user-select: none;
        -webkit-user-select: none;
      }
      
      /* Hidden state - button is off-screen to the right with slide-out animation */
      .vocab-ask-about-page-btn-hidden {
        transform: translateX(100px);
        opacity: 0;
        pointer-events: none;
        transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease;
      }
      
      /* Visible state - button slides in from the right */
      .vocab-ask-about-page-btn-visible {
        transform: translateX(0);
        opacity: 0.95;
        pointer-events: auto;
        transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease;
      }
      
      .vocab-ask-about-page-btn-visible:hover {
        transform: translateX(0) scale(1.1);
        opacity: 1;
        box-shadow: 0 4px 12px rgba(149, 39, 245, 0.6);
      }
      
      .vocab-ask-about-page-btn-visible:active {
        transform: translateX(0) scale(0.95);
      }
      
      .vocab-ask-about-page-btn svg {
        pointer-events: none;
        display: block;
        width: 24px;
        height: 24px;
      }
      
      /* Tooltip for ask-about-page button - Similar to import-content button tooltip */
      .vocab-ask-about-page-tooltip {
        position: fixed !important;
        background: white !important;
        color: #b29cfb !important;
        padding: 10px 20px !important;
        border-radius: 20px !important;
        font-size: 13px !important;
        font-weight: 500 !important;
        white-space: nowrap !important;
        text-align: center !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif !important;
        box-shadow: 0 0 20px rgba(178, 156, 251, 0.3), 0 4px 12px rgba(178, 156, 251, 0.2) !important;
        z-index: 9999999 !important;
        pointer-events: none !important;
        opacity: 0 !important;
        transform: translateY(5px) scale(0.95) !important;
        transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), 
                   transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        visibility: visible !important;
        width: auto !important;
        height: auto !important;
        min-height: 40px !important;
      }
      
      .vocab-ask-about-page-tooltip.visible {
        opacity: 1 !important;
        transform: translateY(0) scale(1) !important;
      }
      
      /* Tooltip arrow - pointing upward to the button (since tooltip is below, on the left side) */
      .vocab-ask-about-page-tooltip::after {
        content: '';
        position: absolute;
        bottom: 100%;
        right: 20px;
        border: 6px solid transparent;
        border-bottom-color: white;
        filter: drop-shadow(0 2px 3px rgba(167, 139, 250, 0.2));
      }
    `;
    
    document.head.appendChild(style);
  }
};

// ===================================
// Drag Handle Module - Manages drag-and-drop functionality
// ===================================
const DragHandle = {
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,
  elementStartX: 0,
  elementStartY: 0,
  targetElement: null,
  handleElement: null,
  
  /**
   * Initialize drag handle
   * @param {HTMLElement} handle - The drag handle element
   * @param {HTMLElement} target - The element to be dragged
   */
  init(handle, target) {
    this.handleElement = handle;
    this.targetElement = target;
    
    // Attach event listeners
    this.handleElement.addEventListener('mousedown', this.onDragStart.bind(this));
    document.addEventListener('mousemove', this.onDragMove.bind(this));
    document.addEventListener('mouseup', this.onDragEnd.bind(this));
    
    // Touch events for mobile
    this.handleElement.addEventListener('touchstart', this.onTouchStart.bind(this));
    document.addEventListener('touchmove', this.onTouchMove.bind(this));
    document.addEventListener('touchend', this.onDragEnd.bind(this));
  },
  
  /**
   * Handle mouse drag start
   * @param {MouseEvent} e - Mouse event
   */
  onDragStart(e) {
    e.preventDefault();
    e.stopPropagation();
    
    this.isDragging = true;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    
    const rect = this.targetElement.getBoundingClientRect();
    this.elementStartX = rect.left;
    this.elementStartY = rect.top;
    
    // Add dragging visual feedback
    this.targetElement.style.transition = 'none';
    this.handleElement.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    
    // Disable pointer events on buttons to prevent hover tooltips during drag
    this.targetElement.style.pointerEvents = 'none';
    this.handleElement.style.pointerEvents = 'auto'; // Keep handle interactive
    
    // Remove any existing tooltips
    this.removeAllTooltips();
  },
  
  /**
   * Handle touch drag start
   * @param {TouchEvent} e - Touch event
   */
  onTouchStart(e) {
    const touch = e.touches[0];
    this.onDragStart({
      preventDefault: () => e.preventDefault(),
      stopPropagation: () => e.stopPropagation(),
      clientX: touch.clientX,
      clientY: touch.clientY
    });
  },
  
  /**
   * Handle drag move
   * @param {MouseEvent} e - Mouse event
   */
  onDragMove(e) {
    if (!this.isDragging) return;
    
    e.preventDefault();
    
    const deltaX = e.clientX - this.dragStartX;
    const deltaY = e.clientY - this.dragStartY;
    
    const newLeft = this.elementStartX + deltaX;
    const newTop = this.elementStartY + deltaY;
    
    // Apply constraints to keep panel within viewport
    const constraints = this.calculateConstraints();
    const constrainedLeft = Math.max(constraints.minX, Math.min(constraints.maxX, newLeft));
    const constrainedTop = Math.max(constraints.minY, Math.min(constraints.maxY, newTop));
    
    // Update position
    this.targetElement.style.left = `${constrainedLeft}px`;
    this.targetElement.style.top = `${constrainedTop}px`;
    this.targetElement.style.right = 'auto';
    this.targetElement.style.transform = 'none';
  },
  
  /**
   * Handle touch drag move
   * @param {TouchEvent} e - Touch event
   */
  onTouchMove(e) {
    if (!this.isDragging) return;
    const touch = e.touches[0];
    this.onDragMove({
      preventDefault: () => e.preventDefault(),
      clientX: touch.clientX,
      clientY: touch.clientY
    });
  },
  
  /**
   * Handle drag end
   */
  onDragEnd() {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    
    // Remove visual feedback
    this.handleElement.style.cursor = 'grab';
    document.body.style.userSelect = '';
    
    // Re-enable pointer events on buttons
    this.targetElement.style.pointerEvents = '';
    
    // Save position
    const rect = this.targetElement.getBoundingClientRect();
    PositionManager.savePosition({
      left: rect.left,
      top: rect.top
    });
  },
  
  /**
   * Calculate viewport constraints to keep panel fully visible
   * @returns {Object} Constraint boundaries
   */
  calculateConstraints() {
    const rect = this.targetElement.getBoundingClientRect();
    const minVisibleArea = rect.width * 0.8; // Keep 80% of the panel visible
    
    return {
      minX: -rect.width + minVisibleArea,
      maxX: window.innerWidth - minVisibleArea,
      minY: 0,
      maxY: window.innerHeight - rect.height
    };
  },
  
  /**
   * Apply saved position to target element
   * @param {Object} position - Position object {left, top}
   */
  applyPosition(position) {
    if (!position || !this.targetElement) return;
    
    this.targetElement.style.left = `${position.left}px`;
    this.targetElement.style.top = `${position.top}px`;
    this.targetElement.style.right = 'auto';
    this.targetElement.style.transform = 'none';
  },
  
  /**
   * Reset to default position
   */
  resetPosition() {
    this.targetElement.style.left = '0';
    this.targetElement.style.top = '';
    this.targetElement.style.right = '';
    this.targetElement.style.transform = '';
    PositionManager.clearPosition();
  },
  
  /**
   * Remove all visible tooltips
   */
  removeAllTooltips() {
    const tooltips = document.querySelectorAll('.vocab-btn-tooltip');
    tooltips.forEach(tooltip => tooltip.remove());
  }
};

// ===================================
// Chat Dialog Module - Manages the chat popup interface
// ===================================
const ChatDialog = {
  dialogContainer: null,
  isOpen: false,
  currentText: null,
  currentTextKey: null,
  chatHistory: [],
  chatHistories: new Map(), // Store chat history for each textKey
  mode: 'ask', // 'ask' or 'simplified'
  simplifiedData: null, // For simplified mode
  isSimplifying: false, // Track if currently simplifying more
  chatContext: 'general', // 'general' for content chat, 'selected' for selected text chat
  isRecording: false, // Track if currently recording voice
  mediaRecorder: null, // MediaRecorder instance
  audioChunks: [], // Store audio chunks during recording
  pageSummary: null, // Store the fetched page summary
  
  /**
   * Initialize chat dialog
   */
  init() {
    console.log('[ChatDialog] Initializing...');
    this.injectStyles();
  },
  
  /**
   * Open chat dialog with selected text
   * @param {string} text - The selected text
   * @param {string} textKey - The text key for identification
   * @param {string} mode - The dialog mode: 'ask' or 'simplified'
   * @param {Object} simplifiedData - Simplified text data (for simplified mode)
   * @param {string} chatContext - The chat context: 'general' or 'selected'
   */
  open(text, textKey, mode = 'ask', simplifiedData = null, chatContext = 'general') {
    console.log('[ChatDialog] ===== OPEN FUNCTION CALLED =====');
    console.log('[ChatDialog] open() called with:', {
      textLength: text ? text.length : 0,
      textKey: textKey,
      mode: mode,
      chatContext: chatContext,
      isOpen: this.isOpen,
      currentTextKey: this.currentTextKey
    });
    console.log('[ChatDialog] ChatHistories Map contents:', Array.from(this.chatHistories.keys()));
    
    // Set the chat context
    this.chatContext = chatContext;
    
    // Clear page summary when opening a new page (if textKey starts with 'page-general')
    // This ensures the button is enabled for a new page
    if (textKey && textKey.startsWith('page-general')) {
      // Only clear if it's a different page (different textKey)
      if (this.currentTextKey !== textKey && this.currentTextKey !== null) {
        console.log('[ChatDialog] Clearing page summary for new page');
        this.pageSummary = null;
      }
    } else {
      // Clear summary if not a page-general context
      this.pageSummary = null;
    }
    
    // Generate proper contextual textKey based on chat context
    let contextualTextKey;
    if (chatContext === 'general') {
      // For general chat: <content type>-<tab id>-generic
      // Extract content type and tab ID from textKey
      const parts = textKey.split('-');
      if (parts.length >= 3) {
        const contentType = parts[0]; // e.g., "pdf"
        const tabId = parts[1]; // e.g., "tabId2"
        contextualTextKey = `${contentType}-${tabId}-generic`;
      } else {
        // Fallback for custom content
        contextualTextKey = `${textKey}-generic`;
      }
    } else if (chatContext === 'selected') {
      // For selected text chat: <content type>-<tab id>-<start index>-<selected text length>
      // Extract content type and tab ID from textKey
      const parts = textKey.split('-');
      if (parts.length >= 3) {
        const contentType = parts[0]; // e.g., "pdf"
        const tabId = parts[1]; // e.g., "tabId2"
        // For selected text, we need start index and length from simplifiedData or textKey
        if (simplifiedData && simplifiedData.textStartIndex !== undefined && simplifiedData.textLength !== undefined) {
          contextualTextKey = `${contentType}-${tabId}-${simplifiedData.textStartIndex}-${simplifiedData.textLength}`;
        } else if (parts.length >= 5) {
          // textKey already contains start index and length
          contextualTextKey = textKey;
        } else {
          // Fallback - use simplified format
          contextualTextKey = `${contentType}-${tabId}-selected`;
        }
      } else {
        // Fallback for custom content
        contextualTextKey = `${textKey}-selected`;
      }
    } else {
      // Fallback to old format
      contextualTextKey = `${textKey}-${chatContext}`;
    }
    
    console.log('[ChatDialog] Generated contextualTextKey:', contextualTextKey, 'for chatContext:', chatContext);
    
    // If dialog is already open for the same text and context
    if (this.isOpen && this.currentTextKey === contextualTextKey) {
      console.log('[ChatDialog] Dialog already open for same textKey and context:', contextualTextKey);
      // If opening in simplified mode and already open for same text
      if (mode === 'simplified') {
        // Dialog is already open - this means user clicked book icon again, so close it
        console.log('[ChatDialog] Already open for this text, closing it (toggle off)');
        this.close();
        return;
      }
      // If opening in 'ask' mode, just switch to ask tab
      else {
        console.log('[ChatDialog] Switching to ask tab');
        this.switchTab('ask');
      }
      return; // Don't re-create the dialog
    }
    
    // If dialog is open for different text, close it first
    if (this.isOpen) {
      console.log('[ChatDialog] Dialog open for different text, closing first');
      // Force immediate cleanup if minimizing or expanding (to prevent invisible dialog)
      const wasMinimizing = this.dialogContainer && this.dialogContainer.classList.contains('minimizing');
      const wasExpanding = this.dialogContainer && this.dialogContainer.classList.contains('expanding');
      
      if (wasMinimizing || wasExpanding) {
        // Cancel any ongoing animation and clean up immediately
        if (this.dialogContainer) {
          this.dialogContainer.classList.remove('minimizing', 'expanding');
          this.dialogContainer.style.removeProperty('transition');
          this.dialogContainer.style.removeProperty('animation');
          
          // Clean up CSS variables
          this.dialogContainer.style.removeProperty('--minimize-target-x');
          this.dialogContainer.style.removeProperty('--minimize-target-y');
          this.dialogContainer.style.removeProperty('--minimize-start-transform');
          this.dialogContainer.style.removeProperty('--minimize-end-transform');
          this.dialogContainer.style.removeProperty('--expand-start-transform');
          this.dialogContainer.style.removeProperty('--expand-end-transform');
          
          // Force a reflow to ensure cleanup is applied
          void this.dialogContainer.offsetHeight;
        }
      }
      
      this.close();
      
      // Wait for close animation to complete and ensure cleanup
      setTimeout(() => {
        // Double-check dialog is fully removed and cleaned up
        if (this.dialogContainer && this.dialogContainer.parentNode) {
          console.log('[ChatDialog] Dialog still exists, forcing removal');
          // Clean up any remaining animation classes and CSS variables
          this.dialogContainer.classList.remove('minimizing', 'expanding', 'visible');
          this.dialogContainer.style.removeProperty('animation');
          this.dialogContainer.style.removeProperty('transition');
          this.dialogContainer.style.removeProperty('--minimize-target-x');
          this.dialogContainer.style.removeProperty('--minimize-target-y');
          this.dialogContainer.style.removeProperty('--minimize-start-transform');
          this.dialogContainer.style.removeProperty('--minimize-end-transform');
          this.dialogContainer.style.removeProperty('--expand-start-transform');
          this.dialogContainer.style.removeProperty('--expand-end-transform');
          
          this.dialogContainer.remove();
          this.dialogContainer = null;
          this.isOpen = false;
        }
        console.log('[ChatDialog] Opening dialog after close delay');
        this.openDialog(text, contextualTextKey, mode, simplifiedData);
      }, 350); // Wait for animation to complete (300ms) + small buffer
    } else {
      // Dialog is not open, open it
      console.log('[ChatDialog] Dialog not open, opening directly');
      this.openDialog(text, contextualTextKey, mode, simplifiedData);
    }
  },
  
  /**
   * Internal method to open dialog
   * @param {string} text - The selected text
   * @param {string} contextualTextKey - The contextual text key for identification
   * @param {string} mode - The dialog mode: 'ask' or 'simplified'
   * @param {Object} simplifiedData - Simplified text data (for simplified mode)
   */
  openDialog(text, contextualTextKey, mode = 'ask', simplifiedData = null) {
    console.log('[ChatDialog] ===== OPEN DIALOG FUNCTION CALLED =====');
    console.log('[ChatDialog] openDialog() called with:', {
      textLength: text ? text.length : 0,
      contextualTextKey: contextualTextKey,
      mode: mode,
      hasSimplifiedData: !!simplifiedData
    });
    
    this.currentText = text;
    this.currentTextKey = contextualTextKey;
    
    // Load existing chat history for this text, or create new empty array
    console.log('[ChatDialog] ===== LOADING CHAT HISTORY =====');
    console.log('[ChatDialog] Looking for contextualTextKey:', contextualTextKey);
    console.log('[ChatDialog] Available keys in chatHistories:', Array.from(this.chatHistories.keys()));
    console.log('[ChatDialog] ChatHistories Map size:', this.chatHistories.size);
    
    this.chatHistory = this.chatHistories.get(contextualTextKey) || [];
    console.log('[ChatDialog] Loaded chat history:', this.chatHistory.length, 'messages');
    console.log('[ChatDialog] Chat history for contextualTextKey', contextualTextKey, ':', this.chatHistory);
    
    this.mode = mode;
    
    // For simplified mode, always load the latest data from TextSelector.simplifiedTexts
    // This ensures we get all explanations including ones generated via "Simplify more"
    if (mode === 'simplified' && contextualTextKey) {
      // Get original textKey (remove -selected suffix if present)
      const originalTextKey = contextualTextKey.replace(/-selected$/, '').replace(/-generic$/, '');
      const latestSimplifiedData = TextSelector.simplifiedTexts.get(originalTextKey);
      
      if (latestSimplifiedData) {
        console.log('[ChatDialog] Loaded latest simplified data from TextSelector:', latestSimplifiedData);
        console.log('[ChatDialog] Previous simplified texts count:', latestSimplifiedData.previousSimplifiedTexts?.length || 0);
        console.log('[ChatDialog] Current simplified text exists:', !!latestSimplifiedData.simplifiedText);
        this.simplifiedData = latestSimplifiedData;
      } else if (simplifiedData) {
        // Fallback to passed simplifiedData if not found in TextSelector
        console.log('[ChatDialog] Using passed simplifiedData (not found in TextSelector)');
        this.simplifiedData = simplifiedData;
      } else {
        console.warn('[ChatDialog] No simplified data available for simplified mode');
        this.simplifiedData = null;
      }
    } else {
      this.simplifiedData = simplifiedData;
    }
    
    console.log('[ChatDialog] Creating dialog...');
    this.createDialog();
    console.log('[ChatDialog] Showing dialog...');
    this.show();
    
    // Hide Focus buttons for custom content (pdf, text, topics, image)
    this.hideFocusButtonsForCustomContent(contextualTextKey);
    
    console.log('[ChatDialog] Opened in', mode, 'mode for text:', text.substring(0, 50) + '...');
    console.log('[ChatDialog] Loaded', this.chatHistory.length, 'chat messages');
  },
  
  /**
   * Hide Focus buttons for custom content types (pdf, text, topics, image)
   * @param {string} textKey - The text key to check if it's custom content
   */
  hideFocusButtonsForCustomContent(textKey) {
    // Hide focus buttons for general chat (chat icon), show for selected text chat (book icon)
    // Also hide for page-general (ask-about-page button) - check for both 'page-general' and 'page-general-generic'
    const isPageGeneral = textKey && (textKey === 'page-general' || textKey.startsWith('page-general'));
    
    if (isPageGeneral) {
      console.log('[ChatDialog] Hiding Focus buttons for page-general:', textKey, 'chatContext:', this.chatContext);
      
      // Hide the top-right Focus button
      const topRightFocusBtn = this.dialogContainer.querySelector('.vocab-chat-focus-btn-top-right');
      if (topRightFocusBtn) {
        topRightFocusBtn.style.display = 'none';
        topRightFocusBtn.style.visibility = 'hidden';
        console.log('[ChatDialog] Focus button hidden via hideFocusButtonsForCustomContent');
      }
      
      // Hide Focus button containers in tab contents
      const focusBtnContainers = this.dialogContainer.querySelectorAll('.vocab-chat-focus-btn-container');
      focusBtnContainers.forEach(container => {
        container.style.display = 'none';
        container.style.visibility = 'hidden';
      });
      
      console.log('[ChatDialog] Focus buttons hidden for page-general');
    } else if (this.chatContext === 'general') {
      // Hide for other general chats too
      console.log('[ChatDialog] Hiding Focus buttons for general chat:', textKey);
      
      // Hide the top-right Focus button
      const topRightFocusBtn = this.dialogContainer.querySelector('.vocab-chat-focus-btn-top-right');
      if (topRightFocusBtn) {
        topRightFocusBtn.style.display = 'none';
        topRightFocusBtn.style.visibility = 'hidden';
      }
      
      // Hide Focus button containers in tab contents
      const focusBtnContainers = this.dialogContainer.querySelectorAll('.vocab-chat-focus-btn-container');
      focusBtnContainers.forEach(container => {
        container.style.display = 'none';
        container.style.visibility = 'hidden';
      });
      
      console.log('[ChatDialog] Focus buttons hidden for general chat');
    } else {
      console.log('[ChatDialog] Showing Focus buttons for selected text chat:', textKey);
      
      // Show the top-right Focus button
      const topRightFocusBtn = this.dialogContainer.querySelector('.vocab-chat-focus-btn-top-right');
      if (topRightFocusBtn) {
        topRightFocusBtn.style.display = 'block';
        topRightFocusBtn.style.visibility = 'visible';
      }
      
      // Show Focus button containers in tab contents
      const focusBtnContainers = this.dialogContainer.querySelectorAll('.vocab-chat-focus-btn-container');
      focusBtnContainers.forEach(container => {
        container.style.display = 'block';
        container.style.visibility = 'visible';
      });
      
      console.log('[ChatDialog] Focus buttons shown for selected text chat');
    }
  },
  
  /**
   * Close chat dialog
   */
  close() {
    console.log('[ChatDialog] ===== CLOSE FUNCTION CALLED =====');
    
    // Prevent closing if dialog is currently opening (expanding)
    if (this.dialogContainer && this.dialogContainer.classList.contains('expanding')) {
      console.log('[ChatDialog] Dialog is currently opening (expanding), cannot close yet');
      return;
    }
    
    // If already minimizing, don't close again (prevent double-close)
    if (this.dialogContainer && this.dialogContainer.classList.contains('minimizing')) {
      console.log('[ChatDialog] Dialog is already minimizing, ignoring close request');
      return;
    }
    
    console.log('[ChatDialog] Current state - isOpen:', this.isOpen, 'currentTextKey:', this.currentTextKey);
    console.log('[ChatDialog] chatContext:', this.chatContext);
    console.log('[ChatDialog] dialogContainer exists:', !!this.dialogContainer);
    
    if (!this.isOpen) {
      console.log('[ChatDialog] Dialog not open, nothing to close');
      return;
    }
    
    // Save chat history before closing
    if (this.currentTextKey && this.chatHistory.length > 0) {
      this.chatHistories.set(this.currentTextKey, [...this.chatHistory]);
      console.log('[ChatDialog] Saved', this.chatHistory.length, 'chat messages for', this.currentTextKey);
      
      // Also save to analysis data for persistence
      this.saveChatHistoryToAnalysisData();
    }
    
    // Save current dimensions before closing
    this.saveDimensions();
    
    // Check if we should minimize to book icon (only for selected text chat with textKey)
    // OR minimize to ask-about-page button (for page-general context)
    console.log('[ChatDialog] ===== CHECKING MINIMIZATION CONDITIONS =====');
    console.log('[ChatDialog] Condition 1 - currentTextKey exists:', !!this.currentTextKey, 'value:', this.currentTextKey);
    console.log('[ChatDialog] Condition 2 - chatContext === "selected":', this.chatContext === 'selected', 'value:', this.chatContext);
    console.log('[ChatDialog] Condition 3 - currentTextKey === "page-general":', this.currentTextKey === 'page-general');
    console.log('[ChatDialog] Condition 4 - dialogContainer exists:', !!this.dialogContainer);
    
    // Check for ask-about-page button if textKey is 'page-general' (check for both original and transformed key)
    let askAboutPageButton = null;
    if (this.currentTextKey && (this.currentTextKey === 'page-general' || this.currentTextKey.startsWith('page-general')) && this.dialogContainer) {
      askAboutPageButton = document.getElementById('vocab-ask-about-page-btn');
      if (askAboutPageButton) {
        console.log('[ChatDialog] ✓✓✓ FOUND ASK-ABOUT-PAGE BUTTON! Will minimize to it...');
      }
    }
    
    if (this.currentTextKey && this.chatContext === 'selected' && this.dialogContainer) {
      console.log('[ChatDialog] ✓ All conditions met! Proceeding with minimization animation...');
      // IMMEDIATELY disable transition to prevent slide-out animation
      this.dialogContainer.style.setProperty('transition', 'none', 'important');
      
      // Extract original textKey from contextualTextKey
      // contextualTextKey format can be:
      // 1. Full text with "-selected" appended: "long text here-selected"
      // 2. <contentType>-<tabId>-<startIndex>-<length>
      // 3. <contentType>-<tabId>-selected
      // The book icon uses the original textKey without "-selected"
      
      let originalTextKey = this.currentTextKey;
      const textKeysToTry = [this.currentTextKey]; // Always try the current key first
      
      // If contextualTextKey ends with "-selected", remove it
      if (this.currentTextKey.endsWith('-selected')) {
        originalTextKey = this.currentTextKey.slice(0, -'-selected'.length);
        textKeysToTry.push(originalTextKey);
        console.log('[ChatDialog] Removed "-selected" suffix, originalTextKey:', originalTextKey);
      }
      
      // Also try extracting from format: contentType-tabId-selected
      const parts = this.currentTextKey.split('-');
      if (parts.length >= 3 && parts[parts.length - 1] === 'selected') {
        const baseKey = parts.slice(0, -1).join('-');
        if (!textKeysToTry.includes(baseKey)) {
          textKeysToTry.push(baseKey);
        }
      }
      
      console.log('[ChatDialog] Looking for book icon with textKeys to try:', textKeysToTry);
      console.log('[ChatDialog] Original textKey (without -selected):', originalTextKey);
      
      // Find the book icon for this textKey - use multiple strategies
      const allIconsWrappers = document.querySelectorAll('.vocab-text-icons-wrapper');
      console.log('[ChatDialog] All icons wrappers found:', allIconsWrappers.length);
      
      // Log all available textKeys for debugging
      const availableTextKeys = [];
      allIconsWrappers.forEach((wrapper, index) => {
        const wrapperTextKey = wrapper.getAttribute('data-text-key');
        availableTextKeys.push(wrapperTextKey);
        console.log(`[ChatDialog] Icons wrapper ${index + 1} has textKey:`, wrapperTextKey);
      });
      console.log('[ChatDialog] Available textKeys in DOM:', availableTextKeys);
      
      let iconsWrapper = null;
      let bookIcon = null;
      
      // Strategy 1: Try exact match with textKeysToTry
      for (const wrapper of allIconsWrappers) {
        const wrapperTextKey = wrapper.getAttribute('data-text-key');
        if (textKeysToTry.includes(wrapperTextKey)) {
          iconsWrapper = wrapper;
          bookIcon = iconsWrapper.querySelector('.vocab-text-book-btn');
          if (bookIcon) {
            console.log('[ChatDialog] ✓✓✓ MATCH FOUND! Icons wrapper with textKey:', wrapperTextKey);
            break;
          }
        }
      }
      
      // Strategy 2: Try matching by simplifiedData if available
      if (!bookIcon && this.simplifiedData) {
        console.log('[ChatDialog] Trying to find book icon by matching simplifiedData...');
        for (const wrapper of allIconsWrappers) {
          const wrapperTextKey = wrapper.getAttribute('data-text-key');
          const simplifiedData = TextSelector.simplifiedTexts.get(wrapperTextKey);
          if (simplifiedData && 
              simplifiedData.textStartIndex === this.simplifiedData.textStartIndex &&
              simplifiedData.textLength === this.simplifiedData.textLength) {
            iconsWrapper = wrapper;
            bookIcon = iconsWrapper.querySelector('.vocab-text-book-btn');
            if (bookIcon) {
              console.log('[ChatDialog] ✓✓✓ FOUND BOOK ICON by matching simplifiedData with textKey:', wrapperTextKey);
              break;
            }
          }
        }
      }
      
      // Strategy 3: Try partial matching (check if currentTextKey contains or is contained in wrapperTextKey)
      if (!bookIcon) {
        console.log('[ChatDialog] Trying partial textKey matching...');
        for (const wrapper of allIconsWrappers) {
          const wrapperTextKey = wrapper.getAttribute('data-text-key');
          // Check if keys share common parts
          const currentParts = this.currentTextKey.split('-');
          const wrapperParts = wrapperTextKey.split('-');
          
          // Match if they share at least 3 common parts (contentType, tabId, and one more)
          if (currentParts.length >= 3 && wrapperParts.length >= 3) {
            const commonParts = currentParts.filter(part => wrapperParts.includes(part));
            if (commonParts.length >= 3) {
              iconsWrapper = wrapper;
              bookIcon = iconsWrapper.querySelector('.vocab-text-book-btn');
              if (bookIcon) {
                console.log('[ChatDialog] ✓✓✓ FOUND BOOK ICON by partial matching with textKey:', wrapperTextKey);
                break;
              }
            }
          }
        }
      }
      
      console.log('[ChatDialog] ===== BOOK ICON SEARCH RESULTS =====');
      console.log('[ChatDialog] Total icons wrappers found:', allIconsWrappers.length);
      console.log('[ChatDialog] Icons wrapper found:', !!iconsWrapper);
      console.log('[ChatDialog] Book icon found:', !!bookIcon);
      
      if (bookIcon) {
        console.log('[ChatDialog] ✓✓✓ FOUND BOOK ICON! Starting minimization animation...');
        
        // Check if dialogContainer still exists before proceeding
        if (!this.dialogContainer) {
          console.error('[ChatDialog] ERROR: dialogContainer is null, cannot minimize');
          return;
        }
        
        // Force a reflow to ensure book icon is in its final position
        void bookIcon.offsetHeight;
        
        // Get dialog size (use getBoundingClientRect for accurate size)
        const dialogRect = this.dialogContainer.getBoundingClientRect();
        const dialogHeight = dialogRect.height;
        const dialogWidth = dialogRect.width;
        
        // Get book icon position (use getBoundingClientRect for accurate viewport coordinates)
        // Force a reflow before getting position to ensure accurate coordinates
        void bookIcon.offsetHeight;
        const bookIconRect = bookIcon.getBoundingClientRect();
        const bookIconCenterX = bookIconRect.left + bookIconRect.width / 2;
        const bookIconCenterY = bookIconRect.top + bookIconRect.height / 2;
        
        console.log('[ChatDialog] Book icon center:', { x: bookIconCenterX, y: bookIconCenterY });
        console.log('[ChatDialog] Book icon rect:', { left: bookIconRect.left, top: bookIconRect.top, width: bookIconRect.width, height: bookIconRect.height });
        console.log('[ChatDialog] Dialog size:', { width: dialogWidth, height: dialogHeight });
        
        // Calculate the translation needed to move dialog center to book icon center
        // IMPORTANT: Always calculate from the dialog's DEFAULT position, not its current position
        // This ensures consistent minimization regardless of where the dialog was moved to
        // The dialog's default position is:
        // - position: fixed
        // - right: 0
        // - top: 50%
        // - transform: translateY(-50%) translateX(0) when visible
        // This means the dialog center is at:
        // X: viewportWidth - dialogWidth/2 (from right edge)
        // Y: viewportHeight / 2 (from top: 50% with translateY(-50%))
        
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        // Calculate DEFAULT dialog center position (not current position)
        // Default X: from right edge (right: 0), center is at viewportWidth - dialogWidth/2
        const defaultDialogCenterX = viewportWidth - dialogWidth / 2;
        // Default Y: from top: 50% with translateY(-50%), center is at viewportHeight / 2
        const defaultDialogCenterY = viewportHeight / 2;
        
        // Calculate target position: book icon center (viewport coordinates)
        // This is ALWAYS the same - the book icon's position is fixed
        const targetCenterX = bookIconCenterX;
        const targetCenterY = bookIconCenterY;
        
        // Calculate how much to move from DEFAULT center to target center
        // This ensures consistent calculation regardless of dialog's current position
        const deltaX = targetCenterX - defaultDialogCenterX;
        const deltaY = targetCenterY - defaultDialogCenterY;
        
        // Calculate final transform values
        // Start transform: translateY(-50%) translateX(0) (default position)
        // To move the center to the book icon:
        // - translateY: -50% (to center vertically) + deltaY in pixels
        // - translateX: 0 (from right edge) + deltaX in pixels
        
        // Convert -50% to pixels: -dialogHeight / 2
        const negativeHalfHeight = -dialogHeight / 2; // -50% of height in pixels
        const finalTranslateY = negativeHalfHeight + deltaY;
        
        // For X: dialog is positioned from right edge, so translateX(0) means no horizontal offset
        // To move center to book icon center, we need to move by deltaX
        const finalTranslateX = deltaX;
        
        console.log('[ChatDialog] Transform calculation (using DEFAULT position for consistency):');
        console.log('[ChatDialog]   viewportHeight:', viewportHeight, 'viewportWidth:', viewportWidth);
        console.log('[ChatDialog]   dialogHeight:', dialogHeight, 'dialogWidth:', dialogWidth);
        console.log('[ChatDialog]   defaultDialogCenterX:', defaultDialogCenterX, 'defaultDialogCenterY:', defaultDialogCenterY);
        console.log('[ChatDialog]   targetCenterX (book icon):', targetCenterX, 'targetCenterY (book icon):', targetCenterY);
        console.log('[ChatDialog]   deltaX:', deltaX, 'deltaY:', deltaY);
        console.log('[ChatDialog]   finalTranslateX:', finalTranslateX, 'finalTranslateY:', finalTranslateY);
        
        // Get current transform to use as start transform
        const currentComputedStyle = window.getComputedStyle(this.dialogContainer);
        const currentTransform = currentComputedStyle.transform;
        const currentTop = currentComputedStyle.top;
        const currentRight = currentComputedStyle.right;
        
        // Calculate current dialog center from actual position
        const currentDialogCenterX = dialogRect.left + dialogWidth / 2;
        const currentDialogCenterY = dialogRect.top + dialogHeight / 2;
        
        // Calculate delta from CURRENT position to book icon (not default position)
        // This ensures smooth animation from wherever the dialog currently is
        const deltaXFromCurrent = targetCenterX - currentDialogCenterX;
        const deltaYFromCurrent = targetCenterY - currentDialogCenterY;
        
        // Parse current transform to get translate values
        // If transform is "none" or doesn't match expected format, use default
        let startTranslateX = 0;
        let startTranslateY = -dialogHeight / 2; // Default: -50% of height
        
        if (currentTransform && currentTransform !== 'none') {
          // Try to extract translate values from matrix or translate string
          const matrixMatch = currentTransform.match(/matrix\([^)]+\)/);
          if (matrixMatch) {
            // For matrix, we need to extract translateX and translateY
            // Matrix format: matrix(a, b, c, d, tx, ty)
            const values = currentTransform.match(/[-+]?[0-9]*\.?[0-9]+/g);
            if (values && values.length >= 6) {
              startTranslateX = parseFloat(values[4]) || 0;
              startTranslateY = parseFloat(values[5]) || -dialogHeight / 2;
            }
          } else {
            // Try to match translateX and translateY
            const translateXMatch = currentTransform.match(/translateX\(([^)]+)\)/);
            const translateYMatch = currentTransform.match(/translateY\(([^)]+)\)/);
            if (translateXMatch) {
              const val = translateXMatch[1].replace('px', '').trim();
              startTranslateX = parseFloat(val) || 0;
            }
            if (translateYMatch) {
              const val = translateYMatch[1].replace('px', '').replace('%', '').trim();
              if (translateYMatch[1].includes('%')) {
                startTranslateY = (parseFloat(val) / 100) * dialogHeight;
              } else {
                startTranslateY = parseFloat(val) || -dialogHeight / 2;
              }
            }
          }
        }
        
        // Calculate end transform from current position
        const endTranslateX = startTranslateX + deltaXFromCurrent;
        const endTranslateY = startTranslateY + deltaYFromCurrent;
        
        console.log('[ChatDialog] Animation calculation from CURRENT position:');
        console.log('[ChatDialog]   currentTransform:', currentTransform);
        console.log('[ChatDialog]   currentDialogCenterX:', currentDialogCenterX, 'currentDialogCenterY:', currentDialogCenterY);
        console.log('[ChatDialog]   startTranslateX:', startTranslateX, 'startTranslateY:', startTranslateY);
        console.log('[ChatDialog]   deltaXFromCurrent:', deltaXFromCurrent, 'deltaYFromCurrent:', deltaYFromCurrent);
        console.log('[ChatDialog]   endTranslateX:', endTranslateX, 'endTranslateY:', endTranslateY);
        
        // Clean up any previous animation state FIRST before setting new properties
        this.dialogContainer.classList.remove('minimizing', 'expanding');
        this.dialogContainer.style.removeProperty('--minimize-target-x');
        this.dialogContainer.style.removeProperty('--minimize-target-y');
        this.dialogContainer.style.removeProperty('--minimize-start-transform');
        this.dialogContainer.style.removeProperty('--minimize-end-transform');
        this.dialogContainer.style.removeProperty('--expand-start-transform');
        this.dialogContainer.style.removeProperty('--expand-end-transform');
        this.dialogContainer.style.removeProperty('animation');
        this.dialogContainer.style.removeProperty('transition');
        
        // Force a reflow to ensure cleanup is applied
        void this.dialogContainer.offsetHeight;
        
        // Set CSS custom properties for the animation
        // Use current transform as start, and calculate end from current position
        this.dialogContainer.style.setProperty('--minimize-target-x', `${targetCenterX}px`);
        this.dialogContainer.style.setProperty('--minimize-target-y', `${targetCenterY}px`);
        this.dialogContainer.style.setProperty('--minimize-start-transform', `translateY(${startTranslateY}px) translateX(${startTranslateX}px)`);
        this.dialogContainer.style.setProperty('--minimize-end-transform', `translateY(${endTranslateY}px) translateX(${endTranslateX}px)`);
        
        // Ensure dialog is visible before animation starts
        if (!this.dialogContainer.classList.contains('visible')) {
          this.dialogContainer.classList.add('visible');
        }
        
        // Force a reflow to ensure styles are applied
        void this.dialogContainer.offsetHeight;
        
        console.log('[ChatDialog] Set CSS properties:');
        console.log('[ChatDialog] --minimize-target-x:', targetCenterX);
        console.log('[ChatDialog] --minimize-target-y:', targetCenterY);
        console.log('[ChatDialog] --minimize-start-transform:', `translateY(${startTranslateY}px) translateX(${startTranslateX}px)`);
        console.log('[ChatDialog] --minimize-end-transform:', `translateY(${endTranslateY}px) translateX(${endTranslateX}px)`);
        console.log('[ChatDialog] Dialog height:', dialogHeight);
        
        // Force a reflow to ensure styles are applied
        void this.dialogContainer.offsetHeight;
        
        // Add minimizing class to trigger animation (DO NOT remove visible class)
        // Check if dialogContainer still exists before accessing classList
        if (!this.dialogContainer) {
          console.error('[ChatDialog] ERROR: dialogContainer is null before adding minimizing class');
          return;
        }
        
        // Now add the minimizing class to trigger animation
        // The CSS will handle the animation via the .minimizing class
        this.dialogContainer.classList.add('minimizing');
        
        // Force a reflow to ensure animation starts
        void this.dialogContainer.offsetHeight;
        
        // Verify animation is applied
        if (!this.dialogContainer) {
          console.error('[ChatDialog] ERROR: dialogContainer is null before getting computed style');
          return;
        }
        const computedStyle = window.getComputedStyle(this.dialogContainer);
        const animationName = computedStyle.animationName;
        const animationDuration = computedStyle.animationDuration;
        const animationState = computedStyle.animationPlayState;
        const transform = computedStyle.transform;
        
        console.log('[ChatDialog] ===== ANIMATION VERIFICATION =====');
        console.log('[ChatDialog] Minimization animation started');
        console.log('[ChatDialog] Dialog has minimizing class:', this.dialogContainer && this.dialogContainer.classList.contains('minimizing'));
        console.log('[ChatDialog] Animation name:', animationName);
        console.log('[ChatDialog] Animation duration:', animationDuration);
        console.log('[ChatDialog] Animation play state:', animationState);
        console.log('[ChatDialog] Current transform:', transform);
        console.log('[ChatDialog] CSS custom properties:');
        if (this.dialogContainer) {
        console.log('[ChatDialog]   --minimize-start-transform:', this.dialogContainer.style.getPropertyValue('--minimize-start-transform'));
        console.log('[ChatDialog]   --minimize-end-transform:', this.dialogContainer.style.getPropertyValue('--minimize-end-transform'));
        console.log('[ChatDialog]   --minimize-target-x:', this.dialogContainer.style.getPropertyValue('--minimize-target-x'));
        console.log('[ChatDialog]   --minimize-target-y:', this.dialogContainer.style.getPropertyValue('--minimize-target-y'));
        }
        
        // Wait for animation to complete, then hide dialog
        setTimeout(() => {
          console.log('[ChatDialog] Minimization animation completed, hiding dialog');
          
          // Check if dialogContainer still exists before accessing it
          if (!this.dialogContainer) {
            console.log('[ChatDialog] Dialog container already removed, skipping cleanup');
            return;
          }
          
          // Clean up animation class and CSS properties
          this.dialogContainer.classList.remove('minimizing');
          this.dialogContainer.style.removeProperty('--minimize-target-x');
          this.dialogContainer.style.removeProperty('--minimize-target-y');
          this.dialogContainer.style.removeProperty('--minimize-start-transform');
          this.dialogContainer.style.removeProperty('--minimize-end-transform');
          
          // Remove dialog container immediately (no need for hide() since animation is done)
          console.log('[ChatDialog] Removing dialog container...');
          if (this.dialogContainer) {
            this.dialogContainer.remove();
            this.dialogContainer = null;
            console.log('[ChatDialog] Dialog container removed');
          }
          // Reset state
          this.isOpen = false;
          this.currentText = null;
          this.currentTextKey = null;
          console.log('[ChatDialog] Dialog state reset');
        }, 300); // 0.3s animation duration (same as appearing animation)
        
        return; // Exit early, cleanup will continue in setTimeout
      } else {
        console.log('[ChatDialog] ✗✗✗ BOOK ICON NOT FOUND! Cannot minimize to book icon.');
        console.log('[ChatDialog] Falling back to regular close...');
      }
    } else if (askAboutPageButton) {
      console.log('[ChatDialog] ✓✓✓ FOUND ASK-ABOUT-PAGE BUTTON! Starting minimization animation...');
      
      // Check if dialogContainer still exists before proceeding
      if (!this.dialogContainer) {
        console.error('[ChatDialog] ERROR: dialogContainer is null, cannot minimize');
        return;
      }
      
      // IMMEDIATELY disable transition to prevent slide-out animation
      this.dialogContainer.style.setProperty('transition', 'none', 'important');
      
      // Force a reflow to ensure button is in its final position
      void askAboutPageButton.offsetHeight;
      
      // Get dialog size (use getBoundingClientRect for accurate size)
      const dialogRect = this.dialogContainer.getBoundingClientRect();
      const dialogHeight = dialogRect.height;
      const dialogWidth = dialogRect.width;
      
      // Get button position (use getBoundingClientRect for accurate viewport coordinates)
      void askAboutPageButton.offsetHeight;
      const buttonRect = askAboutPageButton.getBoundingClientRect();
      const buttonCenterX = buttonRect.left + buttonRect.width / 2;
      const buttonCenterY = buttonRect.top + buttonRect.height / 2;
      
      console.log('[ChatDialog] Ask-about-page button center:', { x: buttonCenterX, y: buttonCenterY });
      console.log('[ChatDialog] Button rect:', { left: buttonRect.left, top: buttonRect.top, width: buttonRect.width, height: buttonRect.height });
      console.log('[ChatDialog] Dialog size:', { width: dialogWidth, height: dialogHeight });
      
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      // Calculate DEFAULT dialog center position (not current position)
      const defaultDialogCenterX = viewportWidth - dialogWidth / 2;
      const defaultDialogCenterY = viewportHeight / 2;
      
      // Calculate target position: button center (viewport coordinates)
      const targetCenterX = buttonCenterX;
      const targetCenterY = buttonCenterY;
      
      // Calculate how much to move from DEFAULT center to target center
      const deltaX = targetCenterX - defaultDialogCenterX;
      const deltaY = targetCenterY - defaultDialogCenterY;
      
      // Calculate current dialog center from actual position
      const currentDialogCenterX = dialogRect.left + dialogWidth / 2;
      const currentDialogCenterY = dialogRect.top + dialogHeight / 2;
      
      // Calculate delta from CURRENT position to button (not default position)
      const deltaXFromCurrent = targetCenterX - currentDialogCenterX;
      const deltaYFromCurrent = targetCenterY - currentDialogCenterY;
      
      // Parse current transform to get translate values
      const currentComputedStyle = window.getComputedStyle(this.dialogContainer);
      const currentTransform = currentComputedStyle.transform;
      
      let startTranslateX = 0;
      let startTranslateY = -dialogHeight / 2; // Default: -50% of height
      
      if (currentTransform && currentTransform !== 'none') {
        // Try to extract translate values from matrix or translate string
        const matrixMatch = currentTransform.match(/matrix\([^)]+\)/);
        if (matrixMatch) {
          const values = currentTransform.match(/[-+]?[0-9]*\.?[0-9]+/g);
          if (values && values.length >= 6) {
            startTranslateX = parseFloat(values[4]) || 0;
            startTranslateY = parseFloat(values[5]) || -dialogHeight / 2;
          }
        } else {
          const translateXMatch = currentTransform.match(/translateX\(([^)]+)\)/);
          const translateYMatch = currentTransform.match(/translateY\(([^)]+)\)/);
          if (translateXMatch) {
            const val = translateXMatch[1].replace('px', '').trim();
            startTranslateX = parseFloat(val) || 0;
          }
          if (translateYMatch) {
            const val = translateYMatch[1].replace('px', '').replace('%', '').trim();
            if (translateYMatch[1].includes('%')) {
              startTranslateY = (parseFloat(val) / 100) * dialogHeight;
            } else {
              startTranslateY = parseFloat(val) || -dialogHeight / 2;
            }
          }
        }
      }
      
      // Calculate end transform from current position
      const endTranslateX = startTranslateX + deltaXFromCurrent;
      const endTranslateY = startTranslateY + deltaYFromCurrent;
      
      console.log('[ChatDialog] Animation calculation from CURRENT position:');
      console.log('[ChatDialog]   currentTransform:', currentTransform);
      console.log('[ChatDialog]   currentDialogCenterX:', currentDialogCenterX, 'currentDialogCenterY:', currentDialogCenterY);
      console.log('[ChatDialog]   startTranslateX:', startTranslateX, 'startTranslateY:', startTranslateY);
      console.log('[ChatDialog]   deltaXFromCurrent:', deltaXFromCurrent, 'deltaYFromCurrent:', deltaYFromCurrent);
      console.log('[ChatDialog]   endTranslateX:', endTranslateX, 'endTranslateY:', endTranslateY);
      
      // Clean up any previous animation state FIRST before setting new properties
      this.dialogContainer.classList.remove('minimizing', 'expanding');
      this.dialogContainer.style.removeProperty('--minimize-target-x');
      this.dialogContainer.style.removeProperty('--minimize-target-y');
      this.dialogContainer.style.removeProperty('--minimize-start-transform');
      this.dialogContainer.style.removeProperty('--minimize-end-transform');
      this.dialogContainer.style.removeProperty('--expand-start-transform');
      this.dialogContainer.style.removeProperty('--expand-end-transform');
      this.dialogContainer.style.removeProperty('animation');
      this.dialogContainer.style.removeProperty('transition');
      
      // Force a reflow to ensure cleanup is applied
      void this.dialogContainer.offsetHeight;
      
      // Set CSS custom properties for the animation
      this.dialogContainer.style.setProperty('--minimize-target-x', `${targetCenterX}px`);
      this.dialogContainer.style.setProperty('--minimize-target-y', `${targetCenterY}px`);
      this.dialogContainer.style.setProperty('--minimize-start-transform', `translateY(${startTranslateY}px) translateX(${startTranslateX}px) scale(1)`);
      this.dialogContainer.style.setProperty('--minimize-end-transform', `translateY(${endTranslateY}px) translateX(${endTranslateX}px) scale(0)`);
      
      // Ensure dialog is visible before animation starts
      if (!this.dialogContainer.classList.contains('visible')) {
        this.dialogContainer.classList.add('visible');
      }
      
      // Force a reflow to ensure styles are applied
      void this.dialogContainer.offsetHeight;
      
      // Add minimizing class to trigger animation
      this.dialogContainer.classList.add('minimizing');
      
      // Force a reflow to ensure animation starts
      void this.dialogContainer.offsetHeight;
      
      // Wait for animation to complete, then hide dialog
      setTimeout(() => {
        console.log('[ChatDialog] Minimization animation completed, hiding dialog');
        
        // Check if dialogContainer still exists before accessing it
        if (!this.dialogContainer) {
          console.log('[ChatDialog] Dialog container already removed, skipping cleanup');
          return;
        }
        
        // Clean up animation class and CSS properties
          this.dialogContainer.classList.remove('minimizing');
        this.dialogContainer.style.removeProperty('--minimize-target-x');
        this.dialogContainer.style.removeProperty('--minimize-target-y');
          this.dialogContainer.style.removeProperty('--minimize-start-transform');
          this.dialogContainer.style.removeProperty('--minimize-end-transform');
        
        // Remove dialog container immediately (no need for hide() since animation is done)
        console.log('[ChatDialog] Removing dialog container...');
        if (this.dialogContainer) {
          this.dialogContainer.remove();
          this.dialogContainer = null;
          console.log('[ChatDialog] Dialog container removed');
        }
        // Reset state
          this.isOpen = false;
          this.currentText = null;
          this.currentTextKey = null;
        console.log('[ChatDialog] Dialog state reset');
      }, 300); // 0.3s animation duration (same as appearing animation)
      
      return; // Exit early, cleanup will continue in setTimeout
    } else {
      console.log('[ChatDialog] ✗✗✗ MINIMIZATION CONDITIONS NOT MET!');
      console.log('[ChatDialog] Reasons:');
      if (!this.currentTextKey) console.log('[ChatDialog]   - currentTextKey is missing');
      const isPageGeneral = this.currentTextKey && (this.currentTextKey === 'page-general' || this.currentTextKey.startsWith('page-general'));
      if (this.chatContext !== 'selected' && !isPageGeneral) console.log('[ChatDialog]   - chatContext is not "selected" and textKey is not "page-general"');
      if (!this.dialogContainer) console.log('[ChatDialog]   - dialogContainer is missing');
    }
    
    // Fallback to original behavior if no book icon found or not selected text chat
    console.log('[ChatDialog] ===== USING FALLBACK CLOSE (NO MINIMIZATION) =====');
    console.log('[ChatDialog] No book icon or ask-about-page button found, using fallback close');
    
    // If dialog is visible, use slide-out animation
    if (this.dialogContainer && this.dialogContainer.classList.contains('visible')) {
      this.dialogContainer.classList.remove('visible');
      setTimeout(() => {
        this.hide();
      }, 300);
    } else {
      this.hide();
    }
    
    // Keep the chat icon on the text (don't remove it)
    // The text should remain in askedTexts container
    
    setTimeout(() => {
      console.log('[ChatDialog] Removing dialog container...');
      if (this.dialogContainer) {
        this.dialogContainer.remove();
        this.dialogContainer = null;
        console.log('[ChatDialog] Dialog container removed');
      }
      // Reset state
      this.isOpen = false;
      this.currentText = null;
      this.currentTextKey = null;
      console.log('[ChatDialog] Dialog state reset');
    }, 300); // Wait for slide-out animation
    
    console.log('[ChatDialog] Closed');
  },
  
  /**
   * Create dialog DOM structure
   */
  createDialog() {
    console.log('[ChatDialog] ===== CREATE DIALOG FUNCTION CALLED =====');
    console.log('[ChatDialog] Creating dialog container...');
    
    // Create main container
    this.dialogContainer = document.createElement('div');
    this.dialogContainer.id = 'vocab-chat-dialog';
    this.dialogContainer.className = 'vocab-chat-dialog';
    
    console.log('[ChatDialog] Dialog container created:', this.dialogContainer.id);
    
    // Create dialog content
    const dialogContent = document.createElement('div');
    dialogContent.className = 'vocab-chat-content';
    
    // Create left side button container (collapse and delete buttons stacked vertically)
    const leftButtonContainer = document.createElement('div');
    leftButtonContainer.className = 'vocab-chat-left-buttons';
    
    // Create collapse button (smaller size)
    const collapseBtn = document.createElement('button');
    collapseBtn.className = 'vocab-chat-collapse-btn-small';
    collapseBtn.setAttribute('aria-label', 'Close chat');
    collapseBtn.innerHTML = this.createCollapseIcon();
    collapseBtn.addEventListener('click', () => this.close());
    
    leftButtonContainer.appendChild(collapseBtn);
    
    // Create focus button for top right corner
    const focusButton = document.createElement('button');
    focusButton.className = 'vocab-chat-focus-btn-top-right';
    focusButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="10,7 4,12 10,17" fill="white"/>
        <rect x="10" y="10.5" width="10" height="3" fill="white"/>
      </svg>
      <span>Focus</span>
    `;
    
    // Hide focus button immediately if it's for page-general (ask-about-page)
    // Check for both 'page-general' and 'page-general-generic' (the transformed key)
    if (this.currentTextKey && (this.currentTextKey === 'page-general' || this.currentTextKey.startsWith('page-general'))) {
      focusButton.style.display = 'none';
      focusButton.style.visibility = 'hidden';
      console.log('[ChatDialog] Hiding focus button for page-general, currentTextKey:', this.currentTextKey, 'chatContext:', this.chatContext);
    }
    
    // Add click handler for focus button
    focusButton.addEventListener('click', () => {
      console.log('[Focus Button] Clicked, currentTextKey:', this.currentTextKey);
      console.log('[Focus Button] chatContext:', this.chatContext);
      
      if (this.currentTextKey) {
        // For selected text chat, use original textKey to find highlight
        const originalTextKey = this.currentTextKey.replace(/-selected$/, '').replace(/-generic$/, '');
        console.log('[Focus Button] Original textKey:', originalTextKey);
        
        // Try exact match first with current key
        let highlight = TextSelector.textToHighlights.get(this.currentTextKey);
        let matchedKey = this.currentTextKey;
        
        // If no match, try with originalTextKey (after removing suffixes)
        if (!highlight) {
          highlight = TextSelector.textToHighlights.get(originalTextKey);
          matchedKey = originalTextKey;
          console.log('[Focus Button] Trying with originalTextKey:', originalTextKey, 'Found:', !!highlight);
        }
        
        // If still no match, try checking askedTexts map (for green chat icon texts)
        if (!highlight) {
          console.log('[Focus Button] Trying to find in askedTexts...');
          const askedData = TextSelector.askedTexts.get(originalTextKey);
          if (askedData && askedData.highlight) {
            highlight = askedData.highlight;
            matchedKey = originalTextKey;
            console.log('[Focus Button] Found in askedTexts:', originalTextKey);
          } else {
            // Try iterating through askedTexts to find a partial match
            console.log('[Focus Button] Trying to find matching asked text by iteration...');
            for (const [key, data] of TextSelector.askedTexts) {
              if (key.includes(originalTextKey) || originalTextKey.includes(key)) {
                highlight = data.highlight;
                matchedKey = key;
                console.log('[Focus Button] Found matching asked text:', key);
                break;
              }
            }
          }
        }
        
        // If still no match, try checking simplifiedTexts map
        if (!highlight) {
          console.log('[Focus Button] Trying to find in simplifiedTexts...');
          const simplifiedData = TextSelector.simplifiedTexts.get(originalTextKey);
          if (simplifiedData && simplifiedData.highlight) {
            highlight = simplifiedData.highlight;
            matchedKey = originalTextKey;
            console.log('[Focus Button] Found in simplifiedTexts:', originalTextKey);
          } else {
            // Try to find a matching key in simplifiedTexts by comparing text positions
            console.log('[Focus Button] Trying to find matching simplified text by position...');
            const parts = originalTextKey.split('-');
            if (parts.length >= 4) {
              const contentType = parts[0];
              const tabId = parts[1];
              const startIndex = parseInt(parts[2]);
              const textLength = parseInt(parts[3]);
              
              // Search through simplifiedTexts for matching position
              for (const [key, data] of TextSelector.simplifiedTexts) {
                if (data.textStartIndex === startIndex && data.textLength === textLength) {
                  highlight = data.highlight;
                  matchedKey = key;
                  console.log('[Focus Button] Found matching simplified text by position:', key);
                  break;
                }
              }
            }
          }
        }
        
        // If no exact match, try searching by comparing the current text with highlight text
        if (!highlight && this.currentText) {
          console.log('[Focus Button] Trying to match by text content...');
          const currentText = this.currentText.trim();
          
          // Search through all highlights
          for (const [key, element] of TextSelector.textToHighlights) {
            const elementText = element.textContent.replace(/\s+/g, ' ').trim();
            if (elementText === currentText || elementText.includes(currentText) || currentText.includes(elementText)) {
              highlight = element;
              matchedKey = key;
              console.log('[Focus Button] Found match by text content:', key.substring(0, 50) + '...');
              break;
            }
          }
        }
        
        // If no exact match, try fuzzy matching
        if (!highlight) {
          console.log('[Focus Button] No exact match, trying fuzzy matching...');
          
          // Find the best matching key by comparing text content
          let bestMatch = null;
          let bestScore = 0;
          
          for (const [key, element] of TextSelector.textToHighlights) {
            // Calculate similarity score based on common text length
            const commonLength = this.calculateCommonTextLength(originalTextKey, key);
            const score = commonLength / Math.max(originalTextKey.length, key.length);
            
            console.log('[Focus Button] Comparing with key:', key.substring(0, 50) + '...', 'Score:', score);
            
            if (score > bestScore && score > 0.7) { // Require at least 70% similarity
              bestScore = score;
              bestMatch = element;
              matchedKey = key;
            }
          }
          
          if (bestMatch) {
            highlight = bestMatch;
            console.log('[Focus Button] Found fuzzy match with score:', bestScore, 'Key:', matchedKey);
          }
        }
        
        console.log('[Focus Button] Found highlight:', highlight);
        
        if (highlight) {
          console.log('[Focus Button] Scrolling to highlight and pulsating');
          
          // First scroll to the element
          highlight.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
          
          // Determine pulsate color based on text type
          let isGreenPulsate = false;
          
          // Check if it's asked text (has green chat icon)
          const hasChatBtn = highlight.querySelector('.vocab-text-chat-btn');
          const hasGreenChatBtn = highlight.querySelector('.vocab-text-chat-btn-green');
          console.log('[Focus Button] Checking for chat button:', hasChatBtn, 'Green:', hasGreenChatBtn);
          if (hasChatBtn || hasGreenChatBtn) {
            isGreenPulsate = true; // Green pulsate for asked text
            console.log('[Focus Button] Detected asked text - using green pulsate');
          }
          
          // Check if it's explained text (has green dashed underline or book icon)
          const isSimplified = highlight.classList.contains('vocab-text-simplified');
          const hasBookBtn = highlight.querySelector('.vocab-text-book-btn');
          console.log('[Focus Button] Checking for simplified class:', isSimplified, 'Book button:', hasBookBtn);
          if (isSimplified || hasBookBtn) {
            isGreenPulsate = true; // Green pulsate for explained text
            console.log('[Focus Button] Detected explained text - using green pulsate');
          }
          
          // Additional check: look for asked text in the askedTexts map using matchedKey
          const isInAskedTexts = TextSelector.askedTexts.has(matchedKey) || TextSelector.askedTexts.has(originalTextKey);
          console.log('[Focus Button] Checking if text is in askedTexts (matchedKey:', matchedKey, 'originalTextKey:', originalTextKey, '):', isInAskedTexts);
          if (isInAskedTexts) {
            isGreenPulsate = true; // Green pulsate for asked text
            console.log('[Focus Button] Detected asked text via askedTexts map - using green pulsate');
          }
          
          // Additional check: look for simplified text in simplifiedTexts map using matchedKey
          const isInSimplifiedTexts = TextSelector.simplifiedTexts.has(matchedKey) || TextSelector.simplifiedTexts.has(originalTextKey);
          console.log('[Focus Button] Checking if text is in simplifiedTexts (matchedKey:', matchedKey, 'originalTextKey:', originalTextKey, '):', isInSimplifiedTexts);
          if (isInSimplifiedTexts) {
            isGreenPulsate = true; // Green pulsate for simplified text
            console.log('[Focus Button] Detected simplified text via simplifiedTexts map - using green pulsate');
          }
          
          console.log('[Focus Button] Using green pulsate:', isGreenPulsate);
          
          // Then pulsate with appropriate color
          setTimeout(() => {
            TextSelector.pulsateText(highlight, isGreenPulsate);
            console.log('[Focus Button] Pulsate animation triggered');
          }, 300); // Small delay to let scroll complete
        } else {
          console.log('[Focus Button] No highlight found for textKey:', originalTextKey);
          console.log('[Focus Button] Current textKey:', this.currentTextKey);
          console.log('[Focus Button] Available textToHighlights keys:', Array.from(TextSelector.textToHighlights.keys()));
          console.log('[Focus Button] Available askedTexts keys:', Array.from(TextSelector.askedTexts.keys()));
          console.log('[Focus Button] Available simplifiedTexts keys:', Array.from(TextSelector.simplifiedTexts.keys()));
        }
      } else {
        console.log('[Focus Button] No currentTextKey available');
      }
    });
    
    // Create content area
    const contentArea = document.createElement('div');
    contentArea.className = 'vocab-chat-content-area';
    
    // Create simplified content (always present)
    const simplifiedContent = this.createSimplifiedContent();
    contentArea.appendChild(simplifiedContent);
    
    // Create input area
    const inputArea = this.createInputArea();
    
    // Create resize handles
    const resizeHandles = this.createResizeHandles();
    
    // Assemble dialog
    dialogContent.appendChild(leftButtonContainer);
    dialogContent.appendChild(focusButton);
    dialogContent.appendChild(contentArea);
    dialogContent.appendChild(inputArea);
    
    this.dialogContainer.appendChild(dialogContent);
    this.dialogContainer.appendChild(resizeHandles.left);
    this.dialogContainer.appendChild(resizeHandles.bottom);
    this.dialogContainer.appendChild(resizeHandles.bottomLeft);
    this.dialogContainer.appendChild(resizeHandles.topLeft);
    
    document.body.appendChild(this.dialogContainer);
    console.log('[ChatDialog] Dialog container appended to body');
    
    // Initialize resize functionality
    this.initResize();
    
    // Load saved dimensions after dialog is created
    this.loadSavedDimensions();
  },
  
  /**
   * Create resize handles
   */
  createResizeHandles() {
    const leftHandle = document.createElement('div');
    leftHandle.className = 'vocab-chat-resize-handle vocab-chat-resize-left';
    
    const bottomHandle = document.createElement('div');
    bottomHandle.className = 'vocab-chat-resize-handle vocab-chat-resize-bottom';
    
    const bottomLeftHandle = document.createElement('div');
    bottomLeftHandle.className = 'vocab-chat-resize-handle vocab-chat-resize-bottom-left';
    
    const topLeftHandle = document.createElement('div');
    topLeftHandle.className = 'vocab-chat-resize-handle vocab-chat-resize-top-left';
    
    return {
      left: leftHandle,
      bottom: bottomHandle,
      bottomLeft: bottomLeftHandle,
      topLeft: topLeftHandle
    };
  },
  
  /**
   * Initialize resize functionality
   */
  initResize() {
    let isResizing = false;
    let resizeType = null;
    let startX = 0;
    let startY = 0;
    let startWidth = 0;
    let startHeight = 0;
    
    const startResize = (e, type) => {
      isResizing = true;
      resizeType = type;
      startX = e.clientX;
      startY = e.clientY;
      
      const rect = this.dialogContainer.getBoundingClientRect();
      startWidth = rect.width;
      startHeight = rect.height;
      
      e.preventDefault();
      document.body.style.userSelect = 'none';
    };
    
    const resize = (e) => {
      if (!isResizing) return;
      
      const deltaX = startX - e.clientX; // Inverted for right-side panel
      const deltaY = e.clientY - startY;
      
      if (resizeType === 'left' || resizeType === 'bottom-left' || resizeType === 'top-left') {
        const newWidth = Math.max(300, Math.min(800, startWidth + deltaX));
        this.dialogContainer.style.setProperty('width', `${newWidth}px`, 'important');
        console.log('[ChatDialog] DEBUG: Resizing width to:', newWidth);
      }
      
      if (resizeType === 'bottom' || resizeType === 'bottom-left') {
        const newHeight = Math.max(400, Math.min(window.innerHeight * 0.9, startHeight + deltaY));
        this.dialogContainer.style.setProperty('height', `${newHeight}px`, 'important');
        console.log('[ChatDialog] DEBUG: Resizing height to:', newHeight);
      }
      
      if (resizeType === 'top-left') {
        const newHeight = Math.max(400, Math.min(window.innerHeight * 0.9, startHeight - deltaY));
        this.dialogContainer.style.setProperty('height', `${newHeight}px`, 'important');
        console.log('[ChatDialog] DEBUG: Resizing height (top-left) to:', newHeight);
      }
    };
    
    const stopResize = () => {
      if (!isResizing) return;
      
      console.log('[ChatDialog] DEBUG: Stopping resize, current dimensions:', {
        width: this.dialogContainer.style.width,
        height: this.dialogContainer.style.height
      });
      
      // Save current dimensions to session storage
      this.saveDimensions();
      
      isResizing = false;
      resizeType = null;
      document.body.style.userSelect = '';
    };
    
    // Attach event listeners to resize handles
    const leftHandle = this.dialogContainer.querySelector('.vocab-chat-resize-left');
    const bottomHandle = this.dialogContainer.querySelector('.vocab-chat-resize-bottom');
    const bottomLeftHandle = this.dialogContainer.querySelector('.vocab-chat-resize-bottom-left');
    const topLeftHandle = this.dialogContainer.querySelector('.vocab-chat-resize-top-left');
    
    leftHandle.addEventListener('mousedown', (e) => startResize(e, 'left'));
    bottomHandle.addEventListener('mousedown', (e) => startResize(e, 'bottom'));
    bottomLeftHandle.addEventListener('mousedown', (e) => startResize(e, 'bottom-left'));
    topLeftHandle.addEventListener('mousedown', (e) => startResize(e, 'top-left'));
    
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResize);
  },
  
  /**
   * Save current dialog dimensions to localStorage
   */
  saveDimensions() {
    if (!this.dialogContainer) {
      console.log('[ChatDialog] ERROR: No dialog container to save dimensions');
      return;
    }
    
    // Get computed dimensions to ensure we capture the actual size
    const computedStyle = window.getComputedStyle(this.dialogContainer);
    const dimensions = {
      width: computedStyle.width || this.dialogContainer.style.width || '400px',
      height: computedStyle.height || this.dialogContainer.style.height || '600px'
    };
    
    console.log('[ChatDialog] DEBUG: Saving dimensions:', dimensions);
    
    try {
      localStorage.setItem('chatDialogDimensions', JSON.stringify(dimensions));
      console.log('[ChatDialog] SUCCESS: Dimensions saved to localStorage:', dimensions);
    } catch (error) {
      console.log('[ChatDialog] ERROR saving dimensions:', error);
    }
  },
  
  /**
   * Load saved dimensions from localStorage and apply them
   */
  loadSavedDimensions() {
    console.log('[ChatDialog] DEBUG: Attempting to load saved dimensions...');
    
    try {
      const savedDimensions = localStorage.getItem('chatDialogDimensions');
      console.log('[ChatDialog] DEBUG: localStorage result:', savedDimensions);
      
      if (savedDimensions && this.dialogContainer) {
        const dimensions = JSON.parse(savedDimensions);
        const { width, height } = dimensions;
        console.log('[ChatDialog] DEBUG: Found saved dimensions:', { width, height });
        
        // Apply dimensions with !important to override CSS
        this.dialogContainer.style.setProperty('width', width, 'important');
        this.dialogContainer.style.setProperty('height', height, 'important');
        
        console.log('[ChatDialog] SUCCESS: Applied dimensions:', { width, height });
      } else {
        console.log('[ChatDialog] DEBUG: No saved dimensions found or no dialog container');
      }
    } catch (error) {
      console.log('[ChatDialog] ERROR loading dimensions:', error);
    }
  },
  
  /**
   * Create tabs section
   */
  createTabs() {
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'vocab-chat-tabs';
    
    // First tab: "Original text" for ask mode, "Simplified" for simplified mode
    const firstTab = document.createElement('button');
    
    if (this.mode === 'simplified') {
      // In simplified mode, first tab is "Simplified explanation" and is active
      firstTab.className = 'vocab-chat-tab active';
      firstTab.setAttribute('data-tab', 'simplified');
      firstTab.textContent = 'Simplified explanation';
      firstTab.addEventListener('click', () => this.switchTab('simplified'));
    } else {
      // In ask mode, first tab is "Simplified explanation" and is not active
      firstTab.className = 'vocab-chat-tab';
      firstTab.setAttribute('data-tab', 'simplified');
      firstTab.textContent = 'Simplified explanation';
      firstTab.addEventListener('click', () => this.switchTab('simplified'));
    }
    
    // Second tab: Always "Ask on content"
    const chatTab = document.createElement('button');
    // Chat tab is active in ask mode, not active in simplified mode
    chatTab.className = this.mode === 'simplified' ? 'vocab-chat-tab' : 'vocab-chat-tab active';
    chatTab.setAttribute('data-tab', 'ask');
    chatTab.textContent = 'Ask on content';
    chatTab.addEventListener('click', () => this.switchTab('ask'));
    
    // Create sliding indicator
    const indicator = document.createElement('div');
    indicator.className = 'vocab-chat-tab-indicator';
    indicator.id = 'vocab-chat-tab-indicator';
    
    tabsContainer.appendChild(firstTab);
    tabsContainer.appendChild(chatTab);
    tabsContainer.appendChild(indicator);
    
    // Set initial indicator position after a brief delay to let tabs render
    setTimeout(() => {
      this.updateIndicatorPosition();
    }, 50);
    
    return tabsContainer;
  },
  
  /**
   * Create simplified text content
   */
  createSimplifiedContent() {
    const content = document.createElement('div');
    content.className = 'vocab-chat-tab-content active';
    content.setAttribute('data-content', 'simplified');
    content.style.display = 'flex';
    content.style.flexDirection = 'column';
    content.style.height = '100%';
    content.style.overflow = 'hidden';
    
    // Create scrollable container for all content
    const scrollableContainer = document.createElement('div');
    scrollableContainer.className = 'vocab-chat-scrollable-content';
    scrollableContainer.style.flex = '1';
    scrollableContainer.style.overflowY = 'auto';
    scrollableContainer.style.padding = '16px';
    
    // Container for all simplified explanations
    const explanationsContainer = document.createElement('div');
    explanationsContainer.id = 'vocab-chat-simplified-container';
    
    // Build all simplified explanations (current + previous)
    this.renderSimplifiedExplanations(explanationsContainer);
    
    // Create summary container (above button) for ask-about-page chat
    if (this.chatContext === 'general' && this.currentTextKey && this.currentTextKey.startsWith('page-general')) {
      const summaryContainer = document.createElement('div');
      summaryContainer.id = 'vocab-chat-page-summary-container';
      summaryContainer.className = 'vocab-chat-page-summary-container';
      
      // Render summary if it exists
      if (this.pageSummary) {
        summaryContainer.innerHTML = `
          <div class="vocab-chat-page-summary-content">
            ${this.renderMarkdown(this.pageSummary)}
          </div>
        `;
      }
      
      scrollableContainer.appendChild(summaryContainer);
    }
    
    // Create "Simplify more" button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'vocab-chat-simplify-more-container';
    
    // Only show "Simplify more" button for selected text chat, not for general content chat
    // For ask-about-page (page-general), show "Summarise the page" button instead
    console.log('[ChatDialog] Creating Simplify more button - chatContext:', this.chatContext, 'mode:', this.mode, 'textKey:', this.currentTextKey);
    // Check for both 'page-general' and 'page-general-generic' (the transformed key)
    if (this.chatContext === 'general' && this.currentTextKey && this.currentTextKey.startsWith('page-general')) {
      // Show "Summarise the page" button for ask-about-page chat
      console.log('[ChatDialog] Adding Summarise the page button');
      const summariseBtn = document.createElement('button');
      summariseBtn.className = 'vocab-chat-simplify-more-btn';
      summariseBtn.textContent = 'Summarise the page';
      summariseBtn.id = 'vocab-chat-summarise-page-btn';
      
      // Disable button if summary already exists
      if (this.pageSummary) {
        summariseBtn.disabled = true;
        summariseBtn.classList.add('disabled');
        console.log('[ChatDialog] Summarise button disabled - summary already exists');
      }
      
      // Add onclick handler to call summarise API
      // Use capture phase to ensure it runs before TextSelector's handler
      summariseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.log('[ChatDialog] Summarise button clicked in simplified content!');
        this.handleSummarisePage();
      }, true); // Use capture phase
      
      buttonContainer.appendChild(summariseBtn);
    } else if (this.chatContext !== 'general' && this.mode === 'simplified') {
      console.log('[ChatDialog] Adding Simplify more button');
      const simplifyMoreBtn = document.createElement('button');
      simplifyMoreBtn.className = 'vocab-chat-simplify-more-btn';
      simplifyMoreBtn.textContent = 'Simplify more';
      simplifyMoreBtn.id = 'vocab-chat-simplify-more-btn';
      
      // Set initial disabled state based on shouldAllowSimplifyMore
      if (this.simplifiedData && this.simplifiedData.shouldAllowSimplifyMore) {
        simplifyMoreBtn.disabled = false;
      } else {
        simplifyMoreBtn.disabled = true;
        simplifyMoreBtn.classList.add('disabled');
      }
      
      // Add click handler
      simplifyMoreBtn.addEventListener('click', () => this.handleSimplifyMore());
      
      buttonContainer.appendChild(simplifyMoreBtn);
    } else {
      console.log('[ChatDialog] NOT adding Simplify more button - chatContext:', this.chatContext, 'mode:', this.mode);
    }
    
    // Create chat container below Simplify more button with top margin
    const chatContainer = document.createElement('div');
    chatContainer.className = 'vocab-chat-messages';
    chatContainer.id = 'vocab-chat-messages';
    chatContainer.style.marginTop = '20px';
    
    // If we have existing chat history, render it
    if (this.chatHistory && this.chatHistory.length > 0) {
      this.chatHistory.forEach(item => {
        this.renderChatMessage(chatContainer, item.type, item.message);
      });
      
      // Update delete button visibility and scroll to bottom after rendering
      setTimeout(() => {
        this.updateGlobalClearButton();
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }, 10);
    } else {
      // Show appropriate message based on chat context
      const promptText = this.chatContext === 'selected' 
        ? 'Anything to ask on the selected content ?' 
        : 'Ask me anything about the page';
      
      const noChatsMsg = document.createElement('div');
      noChatsMsg.className = 'vocab-chat-no-messages';
      noChatsMsg.innerHTML = `
        <div class="vocab-chat-no-messages-content">
          ${this.createChatEmptyIcon()}
          <span>${promptText}</span>
          <span class="vocab-chat-regional-lang-text">You can voice record your question in regional language</span>
        </div>
      `;
      chatContainer.appendChild(noChatsMsg);
    }
    
    // Add all content to scrollable container
    scrollableContainer.appendChild(explanationsContainer);
    scrollableContainer.appendChild(buttonContainer);
    scrollableContainer.appendChild(chatContainer);
    
    // Add scrollable container to main content
    content.appendChild(scrollableContainer);
    
    return content;
  },
  
  /**
   * Render all simplified explanations with headers
   * @param {HTMLElement} container - Container element to render into
   */
  renderSimplifiedExplanations(container) {
    // Use simplifiedData if available, otherwise try to get it from TextSelector
    let dataToRender = this.simplifiedData;
    
    if (!dataToRender && this.currentTextKey) {
      // Try to get data from TextSelector using the original textKey
      const originalTextKey = this.currentTextKey.replace(/-selected$/, '').replace(/-generic$/, '');
      dataToRender = TextSelector.simplifiedTexts.get(originalTextKey);
      console.log('[ChatDialog] Retrieved simplified data from TextSelector for key:', originalTextKey, dataToRender);
    }
    
    if (!dataToRender) {
      console.log('[ChatDialog] No simplified data available to render');
      return;
    }
    
    container.innerHTML = '';
    
    // Ensure previousSimplifiedTexts is an array
    const previousSimplifiedTextsArray = Array.isArray(dataToRender.previousSimplifiedTexts)
      ? dataToRender.previousSimplifiedTexts
      : (dataToRender.previousSimplifiedTexts ? [dataToRender.previousSimplifiedTexts] : []);
    
    // Get all explanations (previous + current)
    const allExplanations = [
      ...previousSimplifiedTextsArray,
      ...(dataToRender.simplifiedText ? [dataToRender.simplifiedText] : [])
    ].filter(Boolean); // Remove any null/undefined values
    
    console.log('[ChatDialog] Rendering', allExplanations.length, 'simplified explanations');
    console.log('[ChatDialog] Previous explanations count:', previousSimplifiedTextsArray.length);
    console.log('[ChatDialog] Current simplified text exists:', !!dataToRender.simplifiedText);
    
    // Render each explanation with header
    allExplanations.forEach((explanation, index) => {
      const item = document.createElement('div');
      item.className = 'vocab-chat-simplified-item';
      
      // Create header
      const header = document.createElement('div');
      header.className = 'vocab-chat-simplified-header';
      header.textContent = `Simplified explanation ${index + 1}`;
      
      // Create text display
      const textDisplay = document.createElement('div');
      textDisplay.className = 'vocab-chat-simplified-text';
      textDisplay.textContent = explanation;
      
      item.appendChild(header);
      item.appendChild(textDisplay);
      container.appendChild(item);
    });
  },
  
  /**
   * Handle "Simplify more" button click
   */
  async handleSimplifyMore() {
    if (!this.simplifiedData || !this.currentTextKey) return;
    if (this.isSimplifying) return;
    
    console.log('[ChatDialog] Simplify more clicked');
    
    this.isSimplifying = true;
    
    // Disable button and show loading state
    const simplifyMoreBtn = document.getElementById('vocab-chat-simplify-more-btn');
    if (simplifyMoreBtn) {
      simplifyMoreBtn.disabled = true;
      simplifyMoreBtn.classList.add('disabled', 'loading');
      simplifyMoreBtn.textContent = 'Simplifying...';
    }
    
    // Build API request with previous simplified text
    const previousSimplifiedTexts = [
      ...this.simplifiedData.previousSimplifiedTexts,
      this.simplifiedData.simplifiedText
    ];
    
    const textSegments = [{
      textStartIndex: this.simplifiedData.textStartIndex,
      textLength: this.simplifiedData.textLength,
      text: this.simplifiedData.text,
      previousSimplifiedTexts: previousSimplifiedTexts
    }];
    
    // Call SimplifyService
    SimplifyService.simplify(
      textSegments,
      // onEvent callback
      (eventData) => {
        console.log('[ChatDialog] Received new simplified text:', eventData);
        
        // Ensure previousSimplifiedTexts is always an array
        const previousSimplifiedTextsArray = Array.isArray(previousSimplifiedTexts) 
          ? previousSimplifiedTexts 
          : (previousSimplifiedTexts ? [previousSimplifiedTexts] : []);
        
        // Update simplified data - store all explanations in previousSimplifiedTexts array
        this.simplifiedData = {
          textStartIndex: eventData.textStartIndex,
          textLength: eventData.textLength,
          text: eventData.text,
          simplifiedText: eventData.simplifiedText,
          previousSimplifiedTexts: previousSimplifiedTextsArray, // Array of all previous simplified texts
          shouldAllowSimplifyMore: eventData.shouldAllowSimplifyMore || false
        };
        
        // Update stored data - use original text key for storage
        const originalTextKey = this.currentTextKey.replace(/-selected$/, '').replace(/-generic$/, '');
        TextSelector.simplifiedTexts.set(originalTextKey, this.simplifiedData);
        
        console.log('[ChatDialog] Updated simplified data in TextSelector:', {
          textKey: originalTextKey,
          previousSimplifiedTextsCount: previousSimplifiedTextsArray.length,
          hasCurrentSimplifiedText: !!eventData.simplifiedText,
          shouldAllowSimplifyMore: eventData.shouldAllowSimplifyMore || false
        });
        
        // Update UI - re-render all explanations
        const container = this.dialogContainer.querySelector('#vocab-chat-simplified-container');
        if (container) {
          this.renderSimplifiedExplanations(container);
        }
        
        // Reset button
        if (simplifyMoreBtn) {
          simplifyMoreBtn.classList.remove('loading');
          simplifyMoreBtn.textContent = 'Simplify more';
          
          if (this.simplifiedData.shouldAllowSimplifyMore) {
            simplifyMoreBtn.disabled = false;
            simplifyMoreBtn.classList.remove('disabled');
          } else {
            simplifyMoreBtn.disabled = true;
            simplifyMoreBtn.classList.add('disabled');
          }
        }
        
        this.isSimplifying = false;
      },
      // onComplete callback
      () => {
        console.log('[ChatDialog] Simplification complete');
        this.isSimplifying = false;
      },
      // onError callback
      async (error) => {
        console.error('[ChatDialog] Error during simplification:', error);
        
        // Check if it's a 429 rate limit error
        const isRateLimit = error.status === 429 || 
                           error.message.includes('429') || 
                           error.message.includes('Rate limit') ||
                           error.message.includes('too fast');
        
        if (isRateLimit && typeof ErrorBanner !== 'undefined') {
          await ErrorBanner.show('You are requesting too fast, please retry after few seconds');
        }
        
        // Reset button
        if (simplifyMoreBtn) {
          simplifyMoreBtn.classList.remove('loading');
          simplifyMoreBtn.textContent = 'Simplify more';
        }
        
        this.isSimplifying = false;
        
        // Show error
        TextSelector.showNotification('Error simplifying text. Please try again.');
      }
    );
  },
  
  /**
   * Handle "Summarise the page" button click
   */
  async handleSummarisePage() {
    console.log('[ChatDialog] ===== handleSummarisePage CALLED =====');
    
    // Get pageTextContent from global variable
    const pageTextContent = window.pageTextContent;
    console.log('[ChatDialog] pageTextContent from window:', pageTextContent ? 'exists' : 'null/undefined');
    
    if (!pageTextContent) {
      console.warn('[ChatDialog] pageTextContent is not available');
      this.addMessageToChat('ai', '⚠️ Page content is not yet loaded. Please wait a moment and try again.');
      return;
    }
    
    console.log('[ChatDialog] pageTextContent is available, length:', pageTextContent.length);
    
    // Get the button
    const summariseBtn = document.getElementById('vocab-chat-summarise-page-btn');
    if (!summariseBtn) {
      console.warn('[ChatDialog] Summarise button not found');
      return;
    }
    
    // Disable button and show loading state with white spinner
    summariseBtn.disabled = true;
    summariseBtn.classList.add('disabled', 'loading');
    
    // Store original content
    const originalText = summariseBtn.textContent;
    
    // Show white spinner inside button
    summariseBtn.innerHTML = `
      <div class="vocab-summarise-spinner" style="width: 16px; height: 16px; border: 2px solid white; border-top-color: transparent; border-radius: 50%; animation: vocab-spin 0.8s linear infinite; margin: 0 auto;"></div>
    `;
    
    try {
      // Parse pageTextContent to get the text
      const contentData = JSON.parse(pageTextContent);
      let pageText = contentData.text || '';
      
      if (!pageText) {
        throw new Error('No text content available');
      }
      
      // Limit text length to avoid API errors (use first 50000 characters for summarisation)
      // The API might have limits on text length
      const MAX_TEXT_LENGTH = 50000;
      if (pageText.length > MAX_TEXT_LENGTH) {
        console.log('[ChatDialog] Page text is too long, truncating to', MAX_TEXT_LENGTH, 'characters');
        pageText = pageText.substring(0, MAX_TEXT_LENGTH);
      }
      
      console.log('[ChatDialog] Calling summarise API for page summarisation...');
      console.log('[ChatDialog] Text length:', pageText.length, 'text preview:', pageText.substring(0, 100) + '...');
      console.log('[ChatDialog] SummariseService available:', typeof SummariseService !== 'undefined');
      
      // Call SummariseService
      try {
        const response = await SummariseService.summarise(pageText);
        
        console.log('[ChatDialog] Received summarise response:', response);
        
        // Store and display the summary (NOT in chat history)
        if (response && response.summary) {
          // Store the summary in separate variable (NOT in chat history)
          this.pageSummary = response.summary;
          console.log('[ChatDialog] Page summary stored (separate from chat history):', this.pageSummary ? 'exists' : 'null');
          
          // Display summary above the button (NOT as a chat message)
          this.renderPageSummary();
        } else {
          throw new Error('No summary received from API');
        }
        
        // Keep button disabled after successful fetch
        if (summariseBtn) {
          summariseBtn.disabled = true;
          summariseBtn.classList.add('disabled');
          summariseBtn.classList.remove('loading');
          summariseBtn.textContent = originalText;
          console.log('[ChatDialog] Summarise button disabled after successful fetch');
        }
      } catch (error) {
        console.error('[ChatDialog] Error during summarisation:', error);
        console.error('[ChatDialog] Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
        
        // Check if it's a 429 rate limit error
        const isRateLimit = error.status === 429 || 
                           error.message.includes('429') || 
                           error.message.includes('Rate limit') ||
                           error.message.includes('too fast');
        
        if (isRateLimit && typeof ErrorBanner !== 'undefined') {
          await ErrorBanner.show('You are requesting too fast, please retry after few seconds');
        }
        
        // Show error message in chat with more details
        const errorMessage = error.message || 'Please try again.';
        this.addMessageToChat('ai', `⚠️ **Error:**\n\nFailed to summarise the page. ${errorMessage}`);
        
        // Reset button
        if (summariseBtn) {
          summariseBtn.disabled = false;
          summariseBtn.classList.remove('disabled', 'loading');
          summariseBtn.textContent = originalText;
        }
      }
    } catch (error) {
      console.error('[ChatDialog] Error parsing pageTextContent:', error);
      
      // Show error message in chat
      this.addMessageToChat('ai', `⚠️ **Error:**\n\nFailed to parse page content. ${error.message || 'Please try again.'}`);
      
      // Reset button
      if (summariseBtn) {
        summariseBtn.disabled = false;
        summariseBtn.classList.remove('disabled', 'loading');
        summariseBtn.textContent = originalText;
      }
    }
  },
  
  /**
   * Render page summary above the "Summarise the page" button
   * This is separate from chat history
   */
  renderPageSummary() {
    if (!this.pageSummary) {
      return;
    }
    
    // Find or create summary container
    let summaryContainer = document.getElementById('vocab-chat-page-summary-container');
    if (!summaryContainer) {
      // Find the button container to insert summary above it
      const buttonContainer = document.querySelector('.vocab-chat-simplify-more-container');
      if (!buttonContainer) {
        console.warn('[ChatDialog] Button container not found, cannot render summary');
        return;
      }
      
      // Create summary container
      summaryContainer = document.createElement('div');
      summaryContainer.id = 'vocab-chat-page-summary-container';
      summaryContainer.className = 'vocab-chat-page-summary-container';
      
      // Insert before button container
      buttonContainer.parentNode.insertBefore(summaryContainer, buttonContainer);
    }
    
    // Render summary content
    summaryContainer.innerHTML = `
      <div class="vocab-chat-page-summary-content">
        ${this.renderMarkdown(this.pageSummary)}
      </div>
    `;
    
    console.log('[ChatDialog] Page summary rendered above button');
  },
  
  /**
   * Create ask/chat content
   */
  createAskContent() {
    const content = document.createElement('div');
    content.className = this.mode === 'simplified' ? 'vocab-chat-tab-content' : 'vocab-chat-tab-content active';
    content.setAttribute('data-content', 'ask');
    
    if (this.mode === 'simplified') {
      content.style.display = 'none';
    }
    
    // Create summary container (above button) for ask-about-page chat
    if (this.chatContext === 'general' && this.currentTextKey && this.currentTextKey.startsWith('page-general')) {
      const summaryContainer = document.createElement('div');
      summaryContainer.id = 'vocab-chat-page-summary-container';
      summaryContainer.className = 'vocab-chat-page-summary-container';
      
      // Render summary if it exists
      if (this.pageSummary) {
        summaryContainer.innerHTML = `
          <div class="vocab-chat-page-summary-content">
            ${this.renderMarkdown(this.pageSummary)}
          </div>
        `;
      }
      
      content.appendChild(summaryContainer);
    }
    
    // Create "Summarise the page" button container for ask-about-page chat
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'vocab-chat-simplify-more-container';
    
    // Show "Summarise the page" button for ask-about-page chat (page-general)
    // Check for both 'page-general' and 'page-general-generic' (the transformed key)
    if (this.chatContext === 'general' && this.currentTextKey && this.currentTextKey.startsWith('page-general')) {
      console.log('[ChatDialog] Adding Summarise the page button to ask content');
      const summariseBtn = document.createElement('button');
      summariseBtn.className = 'vocab-chat-simplify-more-btn';
      summariseBtn.textContent = 'Summarise the page';
      summariseBtn.id = 'vocab-chat-summarise-page-btn';
      
      // Disable button if summary already exists
      if (this.pageSummary) {
        summariseBtn.disabled = true;
        summariseBtn.classList.add('disabled');
        console.log('[ChatDialog] Summarise button disabled - summary already exists');
      }
      
      // Add onclick handler to call summarise API
      // Use capture phase to ensure it runs before TextSelector's handler
      summariseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.log('[ChatDialog] Summarise button clicked!');
        this.handleSummarisePage();
      }, true); // Use capture phase
      
      buttonContainer.appendChild(summariseBtn);
      content.appendChild(buttonContainer);
    }
    
    // Create chat messages container
    const chatContainer = document.createElement('div');
    chatContainer.className = 'vocab-chat-messages';
    chatContainer.id = 'vocab-chat-messages';
    
    // If we have existing chat history, render it
    if (this.chatHistory && this.chatHistory.length > 0) {
      this.chatHistory.forEach(item => {
        this.renderChatMessage(chatContainer, item.type, item.message);
      });
      
      // Update delete button visibility and scroll to bottom after rendering
      setTimeout(() => {
        this.updateGlobalClearButton();
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }, 10);
    } else {
      // Show appropriate message based on chat context
      const promptText = this.chatContext === 'selected' 
        ? 'Anything to ask on the selected content ?' 
        : 'Ask me anything about the page';
      
      const noChatsMsg = document.createElement('div');
      noChatsMsg.className = 'vocab-chat-no-messages';
      noChatsMsg.innerHTML = `
        <div class="vocab-chat-no-messages-content">
          ${this.createChatEmptyIcon()}
          <span>${promptText}</span>
          <span class="vocab-chat-regional-lang-text">You can voice record your question in regional language</span>
        </div>
      `;
      chatContainer.appendChild(noChatsMsg);
    }
    
    content.appendChild(chatContainer);
    
    return content;
  },
  
  /**
   * Re-render all chat messages in the existing container
   */
  renderChatMessages() {
    console.log('[ChatDialog] Re-rendering chat messages, chatHistory length:', this.chatHistory.length);
    
    const chatContainer = document.getElementById('vocab-chat-messages');
    if (!chatContainer) {
      console.log('[ChatDialog] Chat container not found, cannot re-render messages');
      return;
    }
    
    // Clear existing messages
    chatContainer.innerHTML = '';
    
    // If we have existing chat history, render it
    if (this.chatHistory && this.chatHistory.length > 0) {
      this.chatHistory.forEach(item => {
        this.renderChatMessage(chatContainer, item.type, item.message);
      });
      
      // Update delete button visibility and scroll to bottom after rendering
      setTimeout(() => {
        this.updateGlobalClearButton();
        this.scrollToBottom(chatContainer);
      }, 10);
    } else {
      // Show appropriate message based on chat context
      const promptText = this.chatContext === 'selected' 
        ? 'Anything to ask on the selected content ?' 
        : 'Ask me anything about the page';
      
      const noChatsMsg = document.createElement('div');
      noChatsMsg.className = 'vocab-chat-no-messages';
      noChatsMsg.innerHTML = `
        <div class="vocab-chat-no-messages-content">
          ${this.createChatEmptyIcon()}
          <span>${promptText}</span>
          <span class="vocab-chat-regional-lang-text">You can voice record your question in regional language</span>
        </div>
      `;
      chatContainer.appendChild(noChatsMsg);
    }
    
    console.log('[ChatDialog] Chat messages re-rendered successfully');
  },
  
  /**
   * Render a chat message in the container
   * @param {HTMLElement} container - Container element
   * @param {string} type - Message type ('user' or 'assistant')
   * @param {string} message - Message content
   */
  renderChatMessage(container, type, message) {
    // Create message bubble with correct class names
    const messageBubble = document.createElement('div');
    messageBubble.className = `vocab-chat-message vocab-chat-message-${type}`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'vocab-chat-message-content';
    
    // For AI messages, render markdown; for user messages, use textContent
    if (type === 'ai') {
      messageContent.innerHTML = this.renderMarkdown(message);
    } else {
      messageContent.textContent = message;
    }
    
    messageBubble.appendChild(messageContent);
    container.appendChild(messageBubble);
  },
  
  /**
   * Create input area
   */
  createInputArea() {
    console.log('[ChatDialog] ===== CREATE INPUT AREA FUNCTION CALLED =====');
    const inputArea = document.createElement('div');
    inputArea.className = 'vocab-chat-input-area';
    
    const inputField = document.createElement('textarea');
    inputField.className = 'vocab-chat-input';
    inputField.id = 'vocab-chat-input';
    inputField.placeholder = 'Type your question here ...';
    inputField.rows = 1;
    
    // Apply inline styles as a fallback to ensure visibility even if CSS is overridden
    // Inline styles have the highest specificity and will override most site CSS
    inputField.style.color = '#1f2937';
    inputField.style.caretColor = '#9527F5';
    inputField.style.backgroundColor = 'white';
    
    console.log('[ChatDialog] Input field created with ID:', inputField.id);
    
    // Reapply visibility styles if they get removed (safeguard against site JavaScript)
    const ensureVisibility = () => {
      inputField.style.color = '#1f2937';
      inputField.style.caretColor = '#9527F5';
      inputField.style.backgroundColor = 'white';
    };
    
    // Ensure visibility on focus and key events (in case site JavaScript tries to override)
    inputField.addEventListener('focus', ensureVisibility);
    inputField.addEventListener('keydown', ensureVisibility);
    inputField.addEventListener('keyup', ensureVisibility);
    
    // Auto-resize textarea with scroll when max height reached
    inputField.addEventListener('input', (e) => {
      e.target.style.height = 'auto';
      const maxHeight = 120; // Maximum height in pixels
      const newHeight = Math.min(e.target.scrollHeight, maxHeight);
      e.target.style.height = newHeight + 'px';
      
      // Add scroll when max height is reached
      if (e.target.scrollHeight > maxHeight) {
        e.target.style.overflowY = 'auto';
      } else {
        e.target.style.overflowY = 'hidden';
      }
      
      // Ensure visibility is maintained during input
      ensureVisibility();
    });
    
    // Handle Enter key (Shift+Enter for new line)
    inputField.addEventListener('keydown', (e) => {
      console.log('[ChatDialog] ===== KEYDOWN EVENT =====');
      console.log('[ChatDialog] Key pressed:', e.key, 'Shift:', e.shiftKey);
      if (e.key === 'Enter' && !e.shiftKey) {
        console.log('[ChatDialog] Enter key pressed, calling sendMessage()');
        e.preventDefault();
        this.sendMessage();
      }
    });
    
    // Create mic button for voice input
    const micBtn = document.createElement('button');
    micBtn.className = 'vocab-chat-mic-btn';
    micBtn.id = 'vocab-chat-mic-btn';
    micBtn.setAttribute('aria-label', 'Voice input');
    micBtn.title = 'Record voice';
    micBtn.innerHTML = this.createMicIcon();
    micBtn.addEventListener('click', () => this.toggleVoiceRecording());
    
    // Create send button (restore original styling but same size as delete)
    const sendBtn = document.createElement('button');
    sendBtn.className = 'vocab-chat-send-btn';
    sendBtn.setAttribute('aria-label', 'Send message');
    sendBtn.innerHTML = this.createSendIcon();
    sendBtn.addEventListener('click', () => {
      console.log('[ChatDialog] ===== SEND BUTTON CLICKED =====');
      console.log('[ChatDialog] Send button clicked, calling sendMessage()');
      this.sendMessage();
    });
    
    // Create delete button (same size as send button)
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'vocab-chat-delete-conversation-btn';
    deleteBtn.id = 'vocab-chat-delete-conversation-btn';
    deleteBtn.setAttribute('aria-label', 'Delete conversation');
    deleteBtn.title = 'Delete conversation';
    deleteBtn.innerHTML = this.createTrashIcon();
    deleteBtn.style.display = 'none'; // Hidden by default
    deleteBtn.addEventListener('click', () => this.deleteConversation());
    
    inputArea.appendChild(inputField);
    inputArea.appendChild(micBtn);
    inputArea.appendChild(sendBtn);
    inputArea.appendChild(deleteBtn);
    
    console.log('[ChatDialog] Input area assembled with input field, send button, and delete button');
    console.log('[ChatDialog] Input field in DOM:', !!document.getElementById('vocab-chat-input'));
    
    return inputArea;
  },
  
  /**
   * Switch between tabs
   * @param {string} tabName - Tab name ('simplified' or 'ask')
   */
  switchTab(tabName) {
    console.log('[ChatDialog] Switching to tab:', tabName);
    
    // Update tab buttons
    const tabs = this.dialogContainer.querySelectorAll('.vocab-chat-tab');
    tabs.forEach(tab => {
      tab.classList.remove('active');
      if (tab.getAttribute('data-tab') === tabName) {
        tab.classList.add('active');
      }
    });
    
    // Update tab content
    const contents = this.dialogContainer.querySelectorAll('.vocab-chat-tab-content');
    contents.forEach(content => {
      content.classList.remove('active');
      content.style.display = 'none';
      if (content.getAttribute('data-content') === tabName) {
        content.classList.add('active');
        content.style.display = 'flex';
      }
    });
    
    // Update indicator position
    this.updateIndicatorPosition();
    
    // If switching to ask tab, focus the input and scroll to bottom
    if (tabName === 'ask') {
      const inputField = document.getElementById('vocab-chat-input');
      if (inputField) {
        setTimeout(() => inputField.focus(), 100);
      }
      
      // Auto-scroll to bottom when switching to chat tab (if there are messages)
      setTimeout(() => {
        const chatContainer = document.getElementById('vocab-chat-messages');
        if (chatContainer && this.chatHistory.length > 0) {
          this.scrollToBottom(chatContainer);
          console.log('[ChatDialog] Auto-scrolled to bottom on tab switch to ask');
        }
      }, 150);
    }
  },
  
  /**
   * Update indicator position to match active tab
   */
  updateIndicatorPosition() {
    const indicator = document.getElementById('vocab-chat-tab-indicator');
    if (!indicator) return;
    
    const activeTab = this.dialogContainer.querySelector('.vocab-chat-tab.active');
    if (!activeTab) return;
    
    const tabsContainer = activeTab.parentElement;
    const containerRect = tabsContainer.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();
    
    // Calculate position relative to container
    const left = tabRect.left - containerRect.left;
    const width = tabRect.width;
    
    // Update indicator position and width
    indicator.style.left = `${left}px`;
    indicator.style.width = `${width}px`;
  },
  
  /**
   * Send message in chat
   */
  async sendMessage() {
    console.log('[ChatDialog] ===== SEND MESSAGE FUNCTION CALLED =====');
    const inputField = document.getElementById('vocab-chat-input');
    console.log('[ChatDialog] Input field found:', !!inputField);
    
    if (!inputField) {
      console.log('[ChatDialog] ERROR: Input field not found!');
      return;
    }
    
    const message = inputField.value.trim();
    console.log('[ChatDialog] Message to send:', message);
    
    if (!message) {
      console.log('[ChatDialog] Empty message, returning');
      return;
    }
    
    console.log('[ChatDialog] Current textKey:', this.currentTextKey);
    console.log('[ChatDialog] Current mode:', this.mode);
    
    // Add user message to chat
    this.addMessageToChat('user', message);
    
    // Clear input
    inputField.value = '';
    inputField.style.height = 'auto';
    
    // Show loading animation
    this.showLoadingAnimation();
    
    // Capture the current textKey and text at the time of making the request
    // This ensures the response goes to the correct chat even if user switches tabs
    const requestTextKey = this.currentTextKey;
    const requestText = this.currentText;
    
    // Prepare chat history from chatHistory
    const chat_history = this.chatHistory.map(item => ({
      role: item.type === 'user' ? 'user' : 'assistant',
      content: item.message
    }));
    
    try {
      // Call API
      const response = await ApiService.ask({
        initial_context: requestText,
        chat_history: chat_history,
        question: message
      });
      
      // Remove loading animation
      this.removeLoadingAnimation();
      
      if (response.success) {
        console.log('[ChatDialog] API response data:', response.data);
        
        // Extract the latest assistant response from chat_history
        const chatHistory = response.data.chat_history || [];
        
        console.log('[ChatDialog] Chat history from API:', chatHistory);
        
        // Find the last assistant message (the latest AI response)
        let aiResponse = 'No response received';
        for (let i = chatHistory.length - 1; i >= 0; i--) {
          if (chatHistory[i].role === 'assistant') {
            aiResponse = chatHistory[i].content;
            break;
          }
        }
        
        console.log('[ChatDialog] Extracted AI response:', aiResponse);
        
        // Check if we're still in the same chat tab that initiated the request
        if (this.currentTextKey === requestTextKey) {
          // We're still in the same chat, add the response normally
          this.addMessageToChat('ai', aiResponse);
        } else {
          // User switched to a different chat tab, add response to the correct chat history
          console.log('[ChatDialog] User switched tabs, adding response to correct chat history for textKey:', requestTextKey);
          
          // Get the chat history for the original textKey
          const originalChatHistory = this.chatHistories.get(requestTextKey) || [];
          
          // Only add the AI response (user message was already added when request was made)
          originalChatHistory.push({
            type: 'ai',
            message: aiResponse,
            timestamp: new Date().toISOString()
          });
          
          // Update the stored chat history
          this.chatHistories.set(requestTextKey, originalChatHistory);
          
          console.log('[ChatDialog] Added AI response to original chat history for textKey:', requestTextKey);
        }
      } else {
        // Handle error case - check if we're still in the same chat
        // Check if it's a 429 rate limit error
        const isRateLimit = response.error && (
          response.error.includes('429') || 
          response.error.includes('Rate limit') ||
          response.error.includes('too fast')
        );
        
        if (isRateLimit && typeof ErrorBanner !== 'undefined') {
          await ErrorBanner.show('You are requesting too fast, please retry after few seconds');
          
          // If this is a text selection (not page-general), stop pulsating and return to normal state
          if (requestTextKey && !requestTextKey.startsWith('page-general')) {
            const highlight = TextSelector.textToHighlights.get(requestTextKey);
            if (highlight) {
              // Stop pulsating animation
              highlight.classList.remove('vocab-text-loading', 'vocab-text-pulsate', 'vocab-text-pulsate-green');
              
              // Remove any loading states
              const spinnerContainer = highlight.querySelector('.vocab-magic-meaning-spinner-container');
              if (spinnerContainer) {
                spinnerContainer.remove();
              }
              
              // Restore magic-meaning button if it was hidden
              const iconsWrapper = highlight.querySelector('.vocab-text-icons-wrapper');
              if (iconsWrapper) {
                const magicBtn = iconsWrapper.querySelector('.vocab-text-magic-meaning-btn');
                if (magicBtn) {
                  magicBtn.style.display = '';
                }
              }
              
              console.log('[ChatDialog] Stopped pulsating animation and restored normal state for text selection');
            }
          }
        }
        
        if (this.currentTextKey === requestTextKey) {
          this.addMessageToChat('ai', `⚠️ **Error:**\n\n${response.error}`);
        } else {
          // Add error to the original chat history
          const originalChatHistory = this.chatHistories.get(requestTextKey) || [];
          
          // Only add the error response (user message was already added when request was made)
          originalChatHistory.push({
            type: 'ai',
            message: `⚠️ **Error:**\n\n${response.error}`,
            timestamp: new Date().toISOString()
          });
          
          this.chatHistories.set(requestTextKey, originalChatHistory);
          console.log('[ChatDialog] Added error response to original chat history for textKey:', requestTextKey);
        }
      }
    } catch (error) {
      console.error('[ChatDialog] Error sending message:', error);
      this.removeLoadingAnimation();
      
      // Check if it's a 429 rate limit error
      const isRateLimit = error.status === 429 || 
                         error.message.includes('429') || 
                         error.message.includes('Rate limit') ||
                         error.message.includes('too fast');
      
      if (isRateLimit && typeof ErrorBanner !== 'undefined') {
        await ErrorBanner.show('You are requesting too fast, please retry after few seconds');
        
        // If this is a text selection (not page-general), stop pulsating and return to normal state
        if (requestTextKey && !requestTextKey.startsWith('page-general')) {
          const highlight = TextSelector.textToHighlights.get(requestTextKey);
          if (highlight) {
            // Stop pulsating animation
            highlight.classList.remove('vocab-text-loading', 'vocab-text-pulsate', 'vocab-text-pulsate-green');
            
            // Remove any loading states
            const spinnerContainer = highlight.querySelector('.vocab-magic-meaning-spinner-container');
            if (spinnerContainer) {
              spinnerContainer.remove();
            }
            
            // Restore magic-meaning button if it was hidden
            const iconsWrapper = highlight.querySelector('.vocab-text-icons-wrapper');
            if (iconsWrapper) {
              const magicBtn = iconsWrapper.querySelector('.vocab-text-magic-meaning-btn');
              if (magicBtn) {
                magicBtn.style.display = '';
              }
            }
            
            console.log('[ChatDialog] Stopped pulsating animation and restored normal state for text selection');
          }
        }
      }
      
      // Handle error case - check if we're still in the same chat
      if (this.currentTextKey === requestTextKey) {
        this.addMessageToChat('ai', `Error: Failed to get response from server`);
      } else {
        // Add error to the original chat history
        const originalChatHistory = this.chatHistories.get(requestTextKey) || [];
        
        // Only add the error response (user message was already added when request was made)
        originalChatHistory.push({
          type: 'ai',
          message: `Error: Failed to get response from server`,
          timestamp: new Date().toISOString()
        });
        
        this.chatHistories.set(requestTextKey, originalChatHistory);
        console.log('[ChatDialog] Added error response to original chat history for textKey:', requestTextKey);
      }
    }
    
    console.log('[ChatDialog] Message sent:', message);
  },
  
  /**
   * Toggle voice recording on/off
   */
  async toggleVoiceRecording() {
    console.log('[ChatDialog] ===== TOGGLE VOICE RECORDING =====');
    
    if (!this.isRecording) {
      // Start recording
      await this.startVoiceRecording();
    } else {
      // Stop recording
      await this.stopVoiceRecording();
    }
  },
  
  /**
   * Start voice recording
   */
  async startVoiceRecording() {
    console.log('[ChatDialog] Starting voice recording...');
    
    try {
      // Request microphone permission - this will trigger browser's native permission prompt
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      console.log('[ChatDialog] Microphone access granted');
      
      // Use webm format with opus codec for smallest file size
      const options = {
        mimeType: 'audio/webm;codecs=opus'
      };
      
      this.mediaRecorder = new MediaRecorder(stream, options);
      this.audioChunks = [];
      
      this.mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      });
      
      this.mediaRecorder.addEventListener('stop', () => {
        this.handleRecordingStop();
      });
      
      this.mediaRecorder.start();
      this.isRecording = true;
      
      // Update mic button to show recording state
      const micBtn = document.getElementById('vocab-chat-mic-btn');
      if (micBtn) {
        micBtn.classList.add('recording');
        micBtn.title = 'Stop recording';
      }
      
      console.log('[ChatDialog] Recording started');
    } catch (error) {
      console.error('[ChatDialog] Error starting recording:', error);
      alert('Failed to access microphone. Please allow microphone access in your browser settings and refresh the page.');
    }
  },
  
  /**
   * Stop voice recording
   */
  async stopVoiceRecording() {
    console.log('[ChatDialog] Stopping voice recording...');
    
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      
      // Stop all audio tracks
      const tracks = this.mediaRecorder.stream.getTracks();
      tracks.forEach(track => track.stop());
      
      this.isRecording = false;
      
      // Update mic button to show normal state
      const micBtn = document.getElementById('vocab-chat-mic-btn');
      if (micBtn) {
        micBtn.classList.remove('recording');
        micBtn.title = 'Record voice';
      }
      
      console.log('[ChatDialog] Recording stopped');
    }
  },
  
  /**
   * Handle recording stop and process audio
   */
  async handleRecordingStop() {
    console.log('[ChatDialog] Processing recorded audio...');
    
    // Create blob from audio chunks
    const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
    console.log('[ChatDialog] Audio blob size:', audioBlob.size, 'bytes');
    
    // Show loading spinner at the bottom of chat
    this.showVoiceLoadingSpinner();
    
    // Disable mic button during processing
    const micBtn = document.getElementById('vocab-chat-mic-btn');
    if (micBtn) {
      micBtn.disabled = true;
    }
    
    try {
      // Call voice-to-text API
      const transcribedText = await this.sendAudioToAPI(audioBlob);
      
      // Remove loading spinner
      this.removeVoiceLoadingSpinner();
      
      // Enable mic button
      if (micBtn) {
        micBtn.disabled = false;
      }
      
      if (transcribedText) {
        // Display transcribed text in input field
        const inputField = document.getElementById('vocab-chat-input');
        if (inputField) {
          inputField.value = transcribedText;
          inputField.style.height = 'auto';
          inputField.style.height = inputField.scrollHeight + 'px';
        }
        
        // Automatically send the message
        this.sendMessage();
      }
    } catch (error) {
      console.error('[ChatDialog] Error processing audio:', error);
      
      // Remove loading spinner
      this.removeVoiceLoadingSpinner();
      
      // Enable mic button
      if (micBtn) {
        micBtn.disabled = false;
      }
      
      // Show error message
      alert('Failed to transcribe audio. Please try again.');
    }
    
    // Clear audio chunks
    this.audioChunks = [];
  },
  
  /**
   * Send audio to voice-to-text API
   * @param {Blob} audioBlob - Audio blob to send
   * @returns {Promise<string>} Transcribed text
   */
  async sendAudioToAPI(audioBlob) {
    console.log('[ChatDialog] Sending audio to API...');
    
    // Create FormData
    const formData = new FormData();
    formData.append('audio_file', audioBlob, 'recording.webm');
    
    try {
      const response = await ApiService.voiceToText(formData);
      
      if (response.success && response.data && response.data.text) {
        console.log('[ChatDialog] Transcription successful:', response.data.text);
        return response.data.text;
      } else {
        console.error('[ChatDialog] API error:', response.error);
        throw new Error(response.error || 'Failed to transcribe audio');
      }
    } catch (error) {
      console.error('[ChatDialog] Error calling API:', error);
      throw error;
    }
  },
  
  /**
   * Show loading spinner for voice processing
   */
  showVoiceLoadingSpinner() {
    const chatContainer = document.getElementById('vocab-chat-messages');
    if (!chatContainer) return;
    
    // Remove existing spinner if any
    this.removeVoiceLoadingSpinner();
    
    // Create spinner element
    const spinner = document.createElement('div');
    spinner.className = 'vocab-chat-voice-spinner';
    spinner.id = 'vocab-chat-voice-spinner';
    spinner.innerHTML = `
      <div class="vocab-spinner-circle"></div>
      <span>Transcribing...</span>
    `;
    
    chatContainer.appendChild(spinner);
    
    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
  },
  
  /**
   * Remove loading spinner for voice processing
   */
  removeVoiceLoadingSpinner() {
    const spinner = document.getElementById('vocab-chat-voice-spinner');
    if (spinner) {
      spinner.remove();
    }
  },
  
  /**
   * Add message to chat
   * @param {string} type - 'user' or 'ai'
   * @param {string} message - Message content
   */
  addMessageToChat(type, message) {
    const chatContainer = document.getElementById('vocab-chat-messages');
    
    // Remove "Ask me anything about the page" message if exists
    const noChatsMsg = chatContainer.querySelector('.vocab-chat-no-messages');
    if (noChatsMsg) {
      noChatsMsg.remove();
    }
    
    // Create message bubble
    const messageBubble = document.createElement('div');
    messageBubble.className = `vocab-chat-message vocab-chat-message-${type}`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'vocab-chat-message-content';
    
    // For AI messages, render markdown
    if (type === 'ai') {
      messageContent.innerHTML = this.renderMarkdown(message);
    } else {
      messageContent.textContent = message;
    }
    
    messageBubble.appendChild(messageContent);
    chatContainer.appendChild(messageBubble);
    
    // Show global clear button
    this.updateGlobalClearButton();
    
    // Auto-scroll to bottom with smooth behavior
    this.scrollToBottom(chatContainer);
    
    // Fallback: Also try scrolling after a short delay to ensure DOM is fully updated
    setTimeout(() => {
      this.scrollToBottom(chatContainer);
    }, 100);
    
    // Store in history
    const messageData = { type, message, timestamp: new Date().toISOString() };
    this.chatHistory.push(messageData);
    
    // Also update the stored chat history for this textKey
    if (this.currentTextKey) {
      console.log('[ChatDialog] ===== SAVING TO CHATHISTORIES MAP =====');
      console.log('[ChatDialog] Saving to chatHistories with key:', this.currentTextKey);
      console.log('[ChatDialog] Messages to save:', this.chatHistory.length);
      console.log('[ChatDialog] ChatHistories Map before set:', Array.from(this.chatHistories.keys()));
      
      this.chatHistories.set(this.currentTextKey, [...this.chatHistory]);
      
      console.log('[ChatDialog] ChatHistories Map after set:', Array.from(this.chatHistories.keys()));
    }
    
    // Store chat message in analysis data for persistence
    if (this.currentTextKey && window.ButtonPanel && window.ButtonPanel.topicsModal && window.ButtonPanel.topicsModal.customContentModal && window.ButtonPanel.topicsModal.customContentModal.activeTabId) {
      const activeContent = window.ButtonPanel.topicsModal.customContentModal.getContentByTabId(parseInt(window.ButtonPanel.topicsModal.customContentModal.activeTabId));
      if (activeContent && activeContent.analysis) {
        // Ensure chats array is initialized
        if (!activeContent.analysis.chats) {
          activeContent.analysis.chats = [];
          console.log('[ChatDialog] Initialized chats array in analysis data');
        }
        
        console.log('[ChatDialog] Storing chat message for currentTextKey:', this.currentTextKey, 'ChatContext:', this.chatContext);
        console.log('[ChatDialog] Available chats in analysis:', activeContent.analysis.chats.map(c => c.textKey));
        // Check if this textKey already exists in chats
        const existingChatIndex = activeContent.analysis.chats.findIndex(c => 
          c.textKey === this.currentTextKey
        );
        
        const chatData = {
          textKey: this.currentTextKey,
          messages: [...this.chatHistory], // Store all messages for this textKey
          lastUpdated: new Date().toISOString()
        };
        
        if (existingChatIndex !== -1) {
          // Update existing chat
          activeContent.analysis.chats[existingChatIndex] = chatData;
          console.log(`[ChatDialog] Updated existing chat for textKey "${this.currentTextKey}" in analysis data`);
        } else {
          // Add new chat
          activeContent.analysis.chats.push(chatData);
          console.log(`[ChatDialog] Added new chat for textKey "${this.currentTextKey}" to analysis data`);
        }
        console.log('[ChatDialog] Final chats in analysis:', activeContent.analysis.chats.map(c => c.textKey));
      }
    }
    
    console.log('[ChatDialog] ===== MESSAGE SAVED IMMEDIATELY =====');
    console.log('[ChatDialog] Message type:', type, 'Total messages:', this.chatHistory.length);
  },
  
  /**
   * Scroll chat container to bottom with smooth behavior
   * @param {HTMLElement} chatContainer - The chat messages container
   */
  scrollToBottom(chatContainer) {
    if (!chatContainer) {
      console.log('[ChatDialog] scrollToBottom: No chat container provided');
      return;
    }
    
    // Find the scrollable parent container (tab content)
    const tabContent = chatContainer.closest('.vocab-chat-tab-content');
    if (!tabContent) {
      console.log('[ChatDialog] scrollToBottom: No tab content found');
      return;
    }
    
    console.log('[ChatDialog] scrollToBottom: Scrolling tab content to bottom');
    console.log('[ChatDialog] scrollToBottom: Tab content scrollHeight:', tabContent.scrollHeight);
    console.log('[ChatDialog] scrollToBottom: Tab content clientHeight:', tabContent.clientHeight);
    
    // Use requestAnimationFrame to ensure DOM updates are complete
    requestAnimationFrame(() => {
      // Scroll the tab content (outer scrollbar) to bottom
      tabContent.scrollTop = tabContent.scrollHeight;
      
      // Also try smooth scroll
      tabContent.scrollTo({
        top: tabContent.scrollHeight,
        behavior: 'smooth'
      });
    });
  },
  
  /**
   * Show loading animation (three dots waving)
   */
  showLoadingAnimation() {
    const chatContainer = document.getElementById('vocab-chat-messages');
    
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'vocab-chat-typing-indicator';
    loadingIndicator.id = 'vocab-chat-loading';
    loadingIndicator.innerHTML = `
      <span></span>
      <span></span>
      <span></span>
    `;
    
    chatContainer.appendChild(loadingIndicator);
    
    // Auto-scroll to bottom with smooth behavior
    this.scrollToBottom(chatContainer);
  },
  
  /**
   * Remove loading animation
   */
  removeLoadingAnimation() {
    const loadingBubble = document.getElementById('vocab-chat-loading');
    if (loadingBubble) {
      loadingBubble.remove();
    }
  },
  
  /**
   * Simple markdown renderer
   * @param {string} text - Markdown text
   * @returns {string} HTML string
   */
  renderMarkdown(text) {
    if (!text) return '';
    
    let html = text;
    
    // Escape HTML first
    html = html.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;');
    
    // Code blocks (```)
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
    
    // Inline code (`)
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Bold (**text** or __text__)
    html = html.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    
    // Italic (*text* or _text_)
    html = html.replace(/\*([^\*]+)\*/g, '<em>$1</em>');
    html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
    
    // Links [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    // Headings
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    
    // Line breaks
    html = html.replace(/\n\n/g, '<br><br>');
    html = html.replace(/\n/g, '<br>');
    
    // Lists
    html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    
    // Wrap consecutive <li> in <ul>
    html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
    
    return html;
  },
  
  /**
   * Clear chat history (but preserve summary if it exists)
   * Summary is stored separately and displayed above the button, not in chat history
   */
  clearChat() {
    const chatContainer = document.getElementById('vocab-chat-messages');
    
    // Summary is stored separately in pageSummary variable and displayed above button
    // It's NOT in chat history, so we don't need to preserve it here
    // The summary container is separate from chat messages
    
    chatContainer.innerHTML = '';
    
    // Show appropriate message based on chat context
    const promptText = this.chatContext === 'selected' 
      ? 'Anything to ask on the selected content ?' 
      : 'Ask me anything about the page';
    
    const noChatsMsg = document.createElement('div');
    noChatsMsg.className = 'vocab-chat-no-messages';
    noChatsMsg.innerHTML = `
      <div class="vocab-chat-no-messages-content">
        ${this.createChatEmptyIcon()}
        <span>${promptText}</span>
      </div>
    `;
    chatContainer.appendChild(noChatsMsg);
    
    // Clear chat history (but keep pageSummary variable - it's separate)
    this.chatHistory = [];
    
    // Update stored chat history for this textKey (but keep pageSummary)
    if (this.currentTextKey) {
      this.chatHistories.set(this.currentTextKey, []);
    }
    
    // Hide global clear button if no messages
    // Note: Summary is separate, so we only check chatHistory
    this.updateGlobalClearButton();
    
    console.log('[ChatDialog] Chat cleared (summary is separate and preserved)');
  },
  
  /**
   * Update visibility of delete conversation button
   */
  updateGlobalClearButton() {
    const deleteBtn = document.getElementById('vocab-chat-delete-conversation-btn');
    if (!deleteBtn) return;
    
    // Show button if there are messages OR if there's a summary
    // (Summary is preserved separately, so we check both)
    if (this.chatHistory.length > 0 || this.pageSummary) {
      deleteBtn.style.display = 'flex';
    } else {
      deleteBtn.style.display = 'none';
    }
  },
  
  /**
   * Show dialog
   */
  show() {
    console.log('[ChatDialog] ===== SHOW FUNCTION CALLED =====');
    console.log('[ChatDialog] Dialog container exists:', !!this.dialogContainer);
    if (this.dialogContainer) {
      console.log('[ChatDialog] Setting isOpen to true');
      this.isOpen = true;
      
      // Check if we should expand from book icon (only for selected text chat with textKey)
      const shouldExpandFromBook = this.currentTextKey && this.chatContext === 'selected';
      
      // Check if we should expand from ask-about-page button (for page-general context)
      const shouldExpandFromAskAboutPage = this.currentTextKey && this.chatContext === 'general' && 
        (this.currentTextKey === 'page-general' || this.currentTextKey.startsWith('page-general'));
      
      if (shouldExpandFromBook) {
        console.log('[ChatDialog] Opening from book icon - setting up expansion animation');
        
        // Find the book icon - try multiple strategies
        let bookIcon = null;
        let iconsWrapper = null;
        
        // Strategy 1: Try exact match with currentTextKey (use safe method to avoid CSS selector issues)
        const allIconsWrappersForExpansion = document.querySelectorAll('.vocab-text-icons-wrapper');
        for (const wrapper of allIconsWrappersForExpansion) {
          const wrapperTextKey = wrapper.getAttribute('data-text-key');
          if (wrapperTextKey === this.currentTextKey) {
            iconsWrapper = wrapper;
            bookIcon = iconsWrapper.querySelector('.vocab-text-book-btn');
            if (bookIcon) {
              console.log('[ChatDialog] Found book icon with exact currentTextKey:', this.currentTextKey);
              break;
            }
          }
        }
        
        // Strategy 2: Try variations of currentTextKey
        if (!bookIcon) {
          const textKeysToTry = [this.currentTextKey];
          
          // Remove -selected suffix if present
          if (this.currentTextKey.endsWith('-selected')) {
            textKeysToTry.push(this.currentTextKey.replace(/-selected$/, ''));
          }
          
          // Try extracting base key from format: contentType-tabId-startIndex-length
          const parts = this.currentTextKey.split('-');
          if (parts.length >= 4) {
            // Try: contentType-tabId-startIndex-length
            textKeysToTry.push(this.currentTextKey);
            // Try: contentType-tabId-startIndex (without length)
            if (parts.length >= 3) {
              textKeysToTry.push(parts.slice(0, -1).join('-'));
            }
          }
          
          for (const textKey of textKeysToTry) {
            if (textKey === this.currentTextKey) continue; // Already tried
            for (const wrapper of allIconsWrappersForExpansion) {
              const wrapperTextKey = wrapper.getAttribute('data-text-key');
              if (wrapperTextKey === textKey) {
                iconsWrapper = wrapper;
                bookIcon = iconsWrapper.querySelector('.vocab-text-book-btn');
                if (bookIcon) {
                  console.log('[ChatDialog] Found book icon with textKey variation:', textKey);
                  break;
                }
              }
            }
            if (bookIcon) break;
          }
        }
        
        // Strategy 3: Search all book icons and match by simplifiedData if available
        if (!bookIcon && this.simplifiedData) {
          console.log('[ChatDialog] Trying to find book icon by matching simplifiedData...');
          const allIconsWrappers = document.querySelectorAll('.vocab-text-icons-wrapper');
          for (const wrapper of allIconsWrappers) {
            const wrapperTextKey = wrapper.getAttribute('data-text-key');
            const simplifiedData = TextSelector.simplifiedTexts.get(wrapperTextKey);
            if (simplifiedData && 
                simplifiedData.textStartIndex === this.simplifiedData.textStartIndex &&
                simplifiedData.textLength === this.simplifiedData.textLength) {
              bookIcon = wrapper.querySelector('.vocab-text-book-btn');
              if (bookIcon) {
                console.log('[ChatDialog] Found book icon by matching simplifiedData with textKey:', wrapperTextKey);
                iconsWrapper = wrapper;
                break;
              }
            }
          }
        }
        
        // Strategy 4: Retry finding book icon with a small delay if not found (for auto-open case)
        if (!bookIcon && this.simplifiedData) {
          console.log('[ChatDialog] Book icon not found immediately, retrying after short delay...');
          // Wait a bit and try again (book icon might still be animating in)
          setTimeout(() => {
            const allIconsWrappers = document.querySelectorAll('.vocab-text-icons-wrapper');
            for (const wrapper of allIconsWrappers) {
              const wrapperTextKey = wrapper.getAttribute('data-text-key');
              const simplifiedData = TextSelector.simplifiedTexts.get(wrapperTextKey);
              if (simplifiedData && 
                  simplifiedData.textStartIndex === this.simplifiedData.textStartIndex &&
                  simplifiedData.textLength === this.simplifiedData.textLength) {
                const retryBookIcon = wrapper.querySelector('.vocab-text-book-btn');
                if (retryBookIcon && this.dialogContainer && this.dialogContainer.classList.contains('expanding')) {
                  console.log('[ChatDialog] Found book icon on retry, updating animation...');
                  // Update animation if dialog is still expanding
                  const bookIconRect = retryBookIcon.getBoundingClientRect();
                  const bookIconCenterX = bookIconRect.left + bookIconRect.width / 2;
                  const bookIconCenterY = bookIconRect.top + retryBookIcon.height / 2;
                  
                  const dialogRect = this.dialogContainer.getBoundingClientRect();
                  const dialogHeight = dialogRect.height || 600;
                  const viewportHeight = window.innerHeight;
                  const dialogTop = viewportHeight / 2;
                  const targetCenterY = bookIconCenterY;
                  const translateYOffset = targetCenterY - dialogTop;
                  const finalTranslateY = -dialogHeight / 2 + translateYOffset;
                  
                  const dialogWidth = dialogRect.width || 400;
                  const dialogCenterX = window.innerWidth - dialogWidth / 2;
                  const targetX = bookIconCenterX - dialogCenterX;
                  
                  const startTransform = `translateY(${finalTranslateY}px) translateX(${targetX}px) scale(0)`;
                  this.dialogContainer.style.setProperty('--expand-start-transform', startTransform);
                  this.dialogContainer.style.setProperty('--expand-end-transform', 'translateY(-50%) translateX(0) scale(1)');
                  this.dialogContainer.style.setProperty('transform', startTransform);
                  break;
                }
              }
            }
          }, 100);
        }
        
        // Check for ask-about-page button if textKey is 'page-general' (for book icon context)
        let askAboutPageButton = null;
        if (this.currentTextKey === 'page-general' || this.currentTextKey.startsWith('page-general')) {
          askAboutPageButton = document.getElementById('vocab-ask-about-page-btn');
          if (askAboutPageButton) {
            console.log('[ChatDialog] ✓✓✓ FOUND ASK-ABOUT-PAGE BUTTON! Starting expansion animation...');
          }
        }
        
        if (bookIcon) {
          console.log('[ChatDialog] ✓✓✓ FOUND BOOK ICON! Starting expansion animation...');
          
          // Get book icon position
          const bookIconRect = bookIcon.getBoundingClientRect();
          const bookIconCenterX = bookIconRect.left + bookIconRect.width / 2;
          const bookIconCenterY = bookIconRect.top + bookIconRect.height / 2;
          
          // Get dialog dimensions
          const dialogRect = this.dialogContainer.getBoundingClientRect();
          const dialogHeight = dialogRect.height || 600;
          const viewportHeight = window.innerHeight;
          const dialogTop = viewportHeight / 2;
          const currentCenterY = dialogTop;
          const targetCenterY = bookIconCenterY;
          const translateYOffset = targetCenterY - currentCenterY;
          const finalTranslateY = -dialogHeight / 2 + translateYOffset;
          
          // Calculate target X (book icon center X - dialog center X)
          const dialogWidth = dialogRect.width || 400;
          const dialogCenterX = window.innerWidth - dialogWidth / 2;
          const targetX = bookIconCenterX - dialogCenterX;
          
          // Set initial position at book icon (small scale)
          const startTransform = `translateY(${finalTranslateY}px) translateX(${targetX}px) scale(0)`;
          this.dialogContainer.style.setProperty('transform', startTransform);
          this.dialogContainer.style.setProperty('transition', 'none');
          
          // Set CSS variables for expansion animation
          this.dialogContainer.style.setProperty('--expand-target-x', `${targetX}px`);
          this.dialogContainer.style.setProperty('--expand-target-y', `${finalTranslateY}px`);
          this.dialogContainer.style.setProperty('--expand-start-transform', startTransform);
          this.dialogContainer.style.setProperty('--expand-end-transform', 'translateY(-50%) translateX(0) scale(1)');
          
          // Force a reflow to ensure initial position is set
          this.dialogContainer.offsetHeight;
          
          // Add expanding class to trigger animation
          this.dialogContainer.classList.add('expanding');
          
          // Add visible class immediately (but animation will override transform)
          this.dialogContainer.classList.add('visible');
          
          // Remove expanding class after animation completes and restore normal state
          setTimeout(() => {
            // Set final transform explicitly to ensure dialog stays in position
            this.dialogContainer.style.setProperty('transform', 'translateY(-50%) translateX(0) scale(1)');
            // Remove expanding class after transform is set
            this.dialogContainer.classList.remove('expanding');
            // Restore transition for normal interactions
            this.dialogContainer.style.setProperty('transition', '');
            // Clean up CSS variables
            this.dialogContainer.style.removeProperty('--expand-target-x');
            this.dialogContainer.style.removeProperty('--expand-target-y');
            this.dialogContainer.style.removeProperty('--expand-start-transform');
            this.dialogContainer.style.removeProperty('--expand-end-transform');
            // Re-enable pointer events
            this.dialogContainer.style.setProperty('pointer-events', '');
            this.dialogContainer.style.setProperty('will-change', '');
          }, 300); // 0.3s animation duration (same as appearing animation)
        } else if (askAboutPageButton) {
          console.log('[ChatDialog] ✓✓✓ FOUND ASK-ABOUT-PAGE BUTTON! Starting expansion animation...');
          
          // Get ask-about-page button position
          const buttonRect = askAboutPageButton.getBoundingClientRect();
          const buttonCenterX = buttonRect.left + buttonRect.width / 2;
          const buttonCenterY = buttonRect.top + buttonRect.height / 2;
          
          // Get dialog dimensions
          const dialogRect = this.dialogContainer.getBoundingClientRect();
          const dialogHeight = dialogRect.height || 600;
          const viewportHeight = window.innerHeight;
          const dialogTop = viewportHeight / 2;
          const currentCenterY = dialogTop;
          const targetCenterY = buttonCenterY;
          const translateYOffset = targetCenterY - currentCenterY;
          const finalTranslateY = -dialogHeight / 2 + translateYOffset;
          
          // Calculate target X (button center X - dialog center X)
          const dialogWidth = dialogRect.width || 400;
          const dialogCenterX = window.innerWidth - dialogWidth / 2;
          const targetX = buttonCenterX - dialogCenterX;
          
          // Set initial position at button (small scale)
          const startTransform = `translateY(${finalTranslateY}px) translateX(${targetX}px) scale(0)`;
          this.dialogContainer.style.setProperty('transform', startTransform);
          this.dialogContainer.style.setProperty('transition', 'none');
          
          // Set CSS variables for expansion animation
          this.dialogContainer.style.setProperty('--expand-target-x', `${targetX}px`);
          this.dialogContainer.style.setProperty('--expand-target-y', `${finalTranslateY}px`);
          this.dialogContainer.style.setProperty('--expand-start-transform', startTransform);
          this.dialogContainer.style.setProperty('--expand-end-transform', 'translateY(-50%) translateX(0) scale(1)');
          
          // Force a reflow to ensure initial position is set
          this.dialogContainer.offsetHeight;
          
          // Add expanding class to trigger animation
          this.dialogContainer.classList.add('expanding');
          
          // Add visible class immediately (but animation will override transform)
          this.dialogContainer.classList.add('visible');
          
          // Remove expanding class after animation completes and restore normal state
          setTimeout(() => {
            // Set final transform explicitly to ensure dialog stays in position
            this.dialogContainer.style.setProperty('transform', 'translateY(-50%) translateX(0) scale(1)');
            // Remove expanding class after transform is set
            this.dialogContainer.classList.remove('expanding');
            // Restore transition for normal interactions
            this.dialogContainer.style.setProperty('transition', '');
            // Clean up CSS variables
            this.dialogContainer.style.removeProperty('--expand-target-x');
            this.dialogContainer.style.removeProperty('--expand-target-y');
            this.dialogContainer.style.removeProperty('--expand-start-transform');
            this.dialogContainer.style.removeProperty('--expand-end-transform');
            // Re-enable pointer events
            this.dialogContainer.style.setProperty('pointer-events', '');
            this.dialogContainer.style.setProperty('will-change', '');
          }, 300); // 0.3s animation duration (same as appearing animation)
        } else {
          console.log('[ChatDialog] Book icon or ask-about-page button not found, using normal slide-in animation');
          setTimeout(() => {
            this.dialogContainer.classList.add('visible');
          }, 10);
        }
      } else if (shouldExpandFromAskAboutPage) {
        // Expand from ask-about-page button
        console.log('[ChatDialog] Opening from ask-about-page button - setting up expansion animation');
        
        const askAboutPageButton = document.getElementById('vocab-ask-about-page-btn');
        if (askAboutPageButton) {
          console.log('[ChatDialog] ✓✓✓ FOUND ASK-ABOUT-PAGE BUTTON! Starting expansion animation...');
          
          // Get ask-about-page button position
          const buttonRect = askAboutPageButton.getBoundingClientRect();
          const buttonCenterX = buttonRect.left + buttonRect.width / 2;
          const buttonCenterY = buttonRect.top + buttonRect.height / 2;
          
          // Get dialog dimensions
          const dialogRect = this.dialogContainer.getBoundingClientRect();
          const dialogHeight = dialogRect.height || 600;
          const viewportHeight = window.innerHeight;
          const dialogTop = viewportHeight / 2;
          const currentCenterY = dialogTop;
          const targetCenterY = buttonCenterY;
          const translateYOffset = targetCenterY - currentCenterY;
          const finalTranslateY = -dialogHeight / 2 + translateYOffset;
          
          // Calculate target X (button center X - dialog center X)
          const dialogWidth = dialogRect.width || 400;
          const dialogCenterX = window.innerWidth - dialogWidth / 2;
          const targetX = buttonCenterX - dialogCenterX;
          
          // Set initial position at button (small scale)
          const startTransform = `translateY(${finalTranslateY}px) translateX(${targetX}px) scale(0)`;
          this.dialogContainer.style.setProperty('transform', startTransform);
          this.dialogContainer.style.setProperty('transition', 'none');
          
          // Set CSS variables for expansion animation
          this.dialogContainer.style.setProperty('--expand-target-x', `${targetX}px`);
          this.dialogContainer.style.setProperty('--expand-target-y', `${finalTranslateY}px`);
          this.dialogContainer.style.setProperty('--expand-start-transform', startTransform);
          this.dialogContainer.style.setProperty('--expand-end-transform', 'translateY(-50%) translateX(0) scale(1)');
          
          // Force a reflow to ensure initial position is set
          this.dialogContainer.offsetHeight;
          
          // Add expanding class to trigger animation
          this.dialogContainer.classList.add('expanding');
          
          // Add visible class immediately (but animation will override transform)
          this.dialogContainer.classList.add('visible');
          
          // Remove expanding class after animation completes and restore normal state
          setTimeout(() => {
            // Set final transform explicitly to ensure dialog stays in position
            this.dialogContainer.style.setProperty('transform', 'translateY(-50%) translateX(0) scale(1)');
            // Remove expanding class after transform is set
            this.dialogContainer.classList.remove('expanding');
            // Restore transition for normal interactions
            this.dialogContainer.style.setProperty('transition', '');
            // Clean up CSS variables
            this.dialogContainer.style.removeProperty('--expand-target-x');
            this.dialogContainer.style.removeProperty('--expand-target-y');
            this.dialogContainer.style.removeProperty('--expand-start-transform');
            this.dialogContainer.style.removeProperty('--expand-end-transform');
            // Re-enable pointer events
            this.dialogContainer.style.setProperty('pointer-events', '');
            this.dialogContainer.style.setProperty('will-change', '');
          }, 300); // 0.3s animation duration (same as appearing animation)
        } else {
          console.log('[ChatDialog] Ask-about-page button not found, using normal slide-in animation');
          setTimeout(() => {
            this.dialogContainer.classList.add('visible');
          }, 10);
        }
      } else {
        // Normal slide-in animation
        setTimeout(() => {
          console.log('[ChatDialog] Adding visible class to dialog');
          this.dialogContainer.classList.add('visible');
          console.log('[ChatDialog] Dialog should now be visible');
        }, 10);
      }
      
      // Auto-focus the question input for both generic and selected text chat
      setTimeout(() => {
        const questionInput = this.dialogContainer.querySelector('.vocab-chat-input');
        if (questionInput) {
          questionInput.focus();
          console.log(`[ChatDialog] Auto-focused question input for ${this.chatContext} chat`);
        }
      }, 100);
      
      // Auto-scroll to bottom when dialog opens (if there are messages)
      setTimeout(() => {
        const chatContainer = document.getElementById('vocab-chat-messages');
        if (chatContainer && this.chatHistory.length > 0) {
          this.scrollToBottom(chatContainer);
          console.log('[ChatDialog] Auto-scrolled to bottom on dialog open');
        }
      }, 150);
      
      // Ensure focus buttons are hidden/shown based on chat context after dialog is rendered
      setTimeout(() => {
        this.hideFocusButtonsForCustomContent(this.currentTextKey);
      }, 200);
    } else {
      console.log('[ChatDialog] ERROR: Dialog container not found!');
    }
  },
  
  /**
   * Hide dialog
   */
  hide() {
    console.log('[ChatDialog] ===== HIDE FUNCTION CALLED =====');
    console.log('[ChatDialog] Dialog container exists:', !!this.dialogContainer);
    if (this.dialogContainer) {
      console.log('[ChatDialog] Removing visible class from dialog');
      this.dialogContainer.classList.remove('visible');
      console.log('[ChatDialog] Dialog should now be hidden');
    } else {
      console.log('[ChatDialog] ERROR: Dialog container not found for hiding!');
    }
  },
  
  /**
   * Create collapse icon (minus/hyphen icon)
   */
  createCollapseIcon() {
    return `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 10H16" stroke="#9527F5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  },
  
  /**
   * Calculate common text length between two strings for fuzzy matching
   * @param {string} text1 - First text string
   * @param {string} text2 - Second text string
   * @returns {number} Length of common text
   */
  calculateCommonTextLength(text1, text2) {
    // Remove common suffixes that might differ (like coordinates)
    const cleanText1 = text1.replace(/-\d+-\d+$/, '').trim();
    const cleanText2 = text2.replace(/-\d+-\d+$/, '').trim();
    
    // Find the longest common substring
    let maxLength = 0;
    const len1 = cleanText1.length;
    const len2 = cleanText2.length;
    
    // Use dynamic programming to find longest common substring
    const dp = Array(len1 + 1).fill().map(() => Array(len2 + 1).fill(0));
    
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        if (cleanText1[i - 1] === cleanText2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
          maxLength = Math.max(maxLength, dp[i][j]);
        } else {
          dp[i][j] = 0;
        }
      }
    }
    
    return maxLength;
  },
  
  /**
   * Create delete icon
   */
  createDeleteIcon() {
    return `
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2.25 4.5h13.5M6 4.5V3a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 12 3v1.5m2.25 0v10.5a1.5 1.5 0 0 1-1.5 1.5h-7.5a1.5 1.5 0 0 1-1.5-1.5V4.5h10.5Z" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M7.5 8.25v4.5M10.5 8.25v4.5" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  },
  
  /**
   * Delete the conversation history (clear chat messages)
   * NOTE: This does NOT clear pageSummary - the summary is preserved
   */
  deleteConversation() {
    if (!this.currentTextKey) return;
    
    // IMPORTANT: Do NOT clear pageSummary - preserve it
    // The summary should remain in the variable and UI
    
    // Clear the current chat history
    this.chatHistory = [];
    
    // Clear the stored chat history for this textKey
    this.chatHistories.set(this.currentTextKey, []);
    
    // Clear the chat display (this will preserve the summary in UI)
    this.clearChat();
    
    console.log('[ChatDialog] Conversation history cleared for textKey:', this.currentTextKey, '(summary preserved:', !!this.pageSummary, ')');
  },
  
  /**
   * Create send icon (up arrow) - purple color for wireframe button
   */
  createSendIcon() {
    return `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 15V5M10 5L5 10M10 5L15 10" stroke="#9527F5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  },
  
  /**
   * Create trash icon - red color for wireframe button
   */
  createTrashIcon() {
    return `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 5h14M6.5 5V3.5a1.5 1.5 0 0 1 1.5-1.5h4a1.5 1.5 0 0 1 1.5 1.5V5M15 5v10.5a1.5 1.5 0 0 1-1.5 1.5h-7a1.5 1.5 0 0 1-1.5-1.5V5h10Z" stroke="#ef4444" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8 9v5M12 9v5" stroke="#ef4444" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  },
  
  /**
   * Create mic icon for voice input
   */
  createMicIcon() {
    return `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#9527F5" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
      </svg>
    `;
  },
  
  /**
   * Create chat empty icon (professional purple)
   */
  createChatEmptyIcon() {
    // Use the actual logo PNG file
    const iconUrl = chrome.runtime.getURL('logo_1-removebg.png');
    return `<img src="${iconUrl}" alt="Cat with glasses" class="vocab-chat-empty-cat-icon">`;
  },
  
  /**
   * Inject styles for chat dialog
   */
  injectStyles() {
    const styleId = 'vocab-chat-dialog-styles';
    
    if (document.getElementById(styleId)) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Global button underline prevention */
      button, .vocab-btn, .vocab-chat-tab, .vocab-chat-focus-btn, .vocab-chat-send-btn, .vocab-chat-mic-btn, .vocab-chat-delete-conversation-btn, .vocab-chat-collapse-btn, .vocab-chat-simplify-more-btn, .vocab-chat-collapse-btn-small, .vocab-chat-delete-conversation-btn-small, .vocab-chat-focus-btn-top-right {
        text-decoration: none !important;
      }
      
      button:hover, .vocab-btn:hover, .vocab-chat-tab:hover, .vocab-chat-focus-btn:hover, .vocab-chat-send-btn:hover, .vocab-chat-mic-btn:hover, .vocab-chat-delete-conversation-btn:hover, .vocab-chat-collapse-btn:hover, .vocab-chat-simplify-more-btn:hover, .vocab-chat-collapse-btn-small:hover, .vocab-chat-delete-conversation-btn-small:hover, .vocab-chat-focus-btn-top-right:hover {
        text-decoration: none !important;
      }
      
      /* Chat Dialog Container */
      .vocab-chat-dialog {
        position: fixed;
        right: 0;
        top: 50%;
        transform: translateY(-50%) translateX(100%);
        width: 400px;
        max-width: 90vw;
        height: 600px;
        max-height: 80vh;
        z-index: 2147483647 !important; /* Maximum z-index to ensure chat dialog is always on top of ads and other elements */
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        user-select: none;  /* Disable text selection in popup */
        background: white !important;
        border-radius: 16px 0 0 16px; /* top-left top-right bottom-right bottom-left */
      }
      
      .vocab-chat-dialog.visible {
        transform: translateY(-50%) translateX(0);
      }
      
      /* Minimize Animation - Scale down and move to book icon */
      /* IMPORTANT: When minimizing, completely override all transitions and use animation only */
      .vocab-chat-dialog.minimizing {
        animation: minimizeChatDialogToBook 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards !important; /* Same duration as appearing animation */
        transition: none !important; /* Completely disable transition during animation */
        pointer-events: none !important;
        z-index: 2147483647 !important; /* Maximum z-index to ensure dialog appears above everything during animation */
        will-change: transform !important; /* Optimize for animation */
      }
      
      /* Completely disable transition when minimizing - even if visible class is present */
      .vocab-chat-dialog.minimizing.visible {
        transition: none !important;
        /* Don't override transform - let animation handle it */
      }

      @keyframes minimizeChatDialogToBook {
        0% {
          transform: var(--minimize-start-transform, translateY(-50%) translateX(0)) scale(1) !important;
          opacity: 1;
        }
        100% {
          transform: var(--minimize-end-transform, translateY(-50%) translateX(0)) scale(0) !important;
          opacity: 1;
        }
      }
      
      /* Expand Animation - Scale up and move from book icon (reverse of minimize) */
      .vocab-chat-dialog.expanding {
        animation: expandChatDialogFromBook 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards !important; /* Same duration as appearing animation */
        transition: none !important; /* Completely disable transition during animation */
        pointer-events: none !important;
        z-index: 2147483647 !important; /* Maximum z-index to ensure dialog appears above everything during animation */
        will-change: transform !important; /* Optimize for animation */
        opacity: 1 !important;
      }
      
      /* Ensure dialog stays visible after expansion animation */
      .vocab-chat-dialog.expanding.visible {
        animation: expandChatDialogFromBook 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards !important; /* Same duration as appearing animation */
        transition: none !important;
      }
      
      @keyframes expandChatDialogFromBook {
        0% {
          transform: var(--expand-start-transform, translateY(-50%) translateX(0) scale(0)) !important;
          opacity: 1;
        }
        100% {
          transform: var(--expand-end-transform, translateY(-50%) translateX(0) scale(1)) !important;
          opacity: 1;
        }
      }
      
      /* Dialog Content */
      .vocab-chat-content {
        background: white !important;
        height: 100%;
        border-radius: 16px 0 0 16px; /* top-left top-right bottom-right bottom-left */
        box-shadow: -4px 0 24px rgba(149, 39, 245, 0.2), -2px 0 12px rgba(149, 39, 245, 0.1);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        position: relative;
      }
      
      /* Collapse Button */
      .vocab-chat-collapse-btn {
        position: absolute;
        top: 20px;
        left: 20px;
        width: 32px;
        height: 32px;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 10;
        transition: all 0.2s ease;
        margin-bottom: 8px;
        text-decoration: none;
      }
      
      .vocab-chat-collapse-btn:hover {
        background: #f9fafb;
        border-color: #9527F5;
        text-decoration: none;
      }
      
      /* Horizontally flip collapse icon to left-pointing arrow */
      .vocab-chat-collapse-btn-small svg {
        transform: scaleX(-1);
      }
      
      /* Left Button Container */
      .vocab-chat-left-buttons {
        position: absolute;
        top: 20px;
        left: 20px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        z-index: 10;
      }
      
      /* Small Collapse Button */
      .vocab-chat-collapse-btn-small {
        width: 32px;
        height: 32px;
        background: white;
        border: 1.5px solid #d1d5db;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        text-decoration: none;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
        opacity: 0.95;
      }
      
      .vocab-chat-collapse-btn-small:hover {
        background: #f3f4f6;
        border-color: #9527F5;
        box-shadow: 0 3px 6px rgba(149, 39, 245, 0.15);
        transform: scale(1.05);
        opacity: 1;
        text-decoration: none;
      }
      
      .vocab-chat-collapse-btn-small:active {
        transform: scale(0.95);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }
      
      .vocab-chat-collapse-btn-small svg {
        width: 16px;
        height: 16px;
        opacity: 0.7;
        transition: opacity 0.2s ease;
      }
      
      .vocab-chat-collapse-btn-small:hover svg {
        opacity: 1;
      }
      
      /* Small Delete Button */
      .vocab-chat-delete-conversation-btn-small {
        width: 24px;
        height: 24px;
        background: white;
        border: 1px solid #ef4444;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        text-decoration: none;
      }
      
      .vocab-chat-delete-conversation-btn-small:hover {
        background: #fef2f2;
        border-color: #dc2626;
        text-decoration: none;
      }
      
      .vocab-chat-delete-conversation-btn-small svg {
        width: 12px;
        height: 12px;
      }
      
      /* Circular Delete Button - Bottom Right */
      .vocab-chat-delete-conversation-btn-circular {
        width: 32px;
        height: 32px;
        background: white;
        border: 2px solid #ef4444;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        text-decoration: none;
        flex-shrink: 0;
        margin-left: 8px;
      }
      
      .vocab-chat-delete-conversation-btn-circular:hover {
        background: #fef2f2;
        border-color: #dc2626;
        transform: translateY(-1px);
        text-decoration: none;
      }
      
      .vocab-chat-delete-conversation-btn-circular:active {
        transform: translateY(0) scale(0.95);
      }
      
      .vocab-chat-delete-conversation-btn-circular svg {
        width: 14px;
        height: 14px;
      }
      
      
      /* Focus Button - Top Right */
      .vocab-chat-focus-btn-top-right {
        position: absolute;
        top: 20px;
        right: 20px;
        padding: 6px 12px;
        background: #9527F5;
        border: none;
        border-radius: 6px;
        display: flex !important;
        flex-direction: row !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 6px !important;
        cursor: pointer;
        z-index: 10;
        transition: all 0.2s ease;
        font-size: 12px;
        font-weight: 500;
        color: white;
        text-decoration: none;
      }
      
      .vocab-chat-focus-btn-top-right:hover {
        background: #7a1fd9;
        text-decoration: none;
      }
      
      .vocab-chat-focus-btn-top-right svg {
        flex-shrink: 0 !important;
        display: inline-block !important;
        width: 16px !important;
        height: 16px !important;
        order: 1 !important;
      }
      
      .vocab-chat-focus-btn-top-right span {
        font-size: 12px;
        font-weight: 500;
        color: white;
        order: 2 !important;
        display: inline-block !important;
      }
      
      /* Tabs */
      .vocab-chat-tabs {
        display: flex;
        gap: 0;
        padding: 12px 60px 0px 60px;
        border-bottom: 1px solid #e5e7eb;
        width: 100%;
        box-sizing: border-box;
        position: relative;
      }
      
      .vocab-chat-tab {
        flex: 1;
        padding: 10px 8px 12px 8px;
        border: none;
        background: transparent;
        border-radius: 0;
        font-size: 12px;
        font-weight: 600;
        color: #6b7280;
        cursor: pointer;
        transition: color 0.2s ease, background-color 0.2s ease;
        letter-spacing: 0.5px;
        text-align: center;
        margin: 0 4px;
        min-width: 0;
        position: relative;
        text-decoration: none;
      }
      
      .vocab-chat-tab:first-child {
        margin-left: 0;
      }
      
      .vocab-chat-tab:last-child {
        margin-right: 0;
      }
      
      .vocab-chat-tab.active {
        color: #9527F5;
      }
      
      .vocab-chat-tab:hover:not(.active) {
        color: #9ca3af;
        text-decoration: none;
      }
      
      /* Sliding tab indicator */
      .vocab-chat-tab-indicator {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        background: #9527F5;
        border-radius: 3px 3px 0 0;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 1;
      }
      
      /* Content Area */
      .vocab-chat-content-area {
        flex: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        padding-top: 50px; /* Add padding to account for focus button */
      }
      
      .vocab-chat-tab-content {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: none;
        flex-direction: column;
        background: white !important;
      }
      
      .vocab-chat-tab-content.active {
        display: flex;
      }
      
      /* Tab content sliding animations */
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      @keyframes slideOutRight {
        from {
          opacity: 1;
          transform: translateX(0);
        }
        to {
          opacity: 0;
          transform: translateX(-20px);
        }
      }
      
      .vocab-chat-tab-content.slide-in {
        animation: slideIn 0.3s ease-out;
      }
      
      .vocab-chat-tab-content.slide-out-right {
        animation: slideOutRight 0.3s ease-out;
      }
      
      /* Scrollable Content Container */
      .vocab-chat-scrollable-content {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        scrollbar-width: thin;
        scrollbar-color: #cbd5e1 #f1f5f9;
        background: white !important;
      }
      
      .vocab-chat-scrollable-content::-webkit-scrollbar {
        width: 6px;
      }
      
      .vocab-chat-scrollable-content::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 3px;
      }
      
      .vocab-chat-scrollable-content::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 3px;
      }
      
      .vocab-chat-scrollable-content::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
      
      /* Original Text Content */
      .vocab-chat-original-text {
        padding: 16px;
        background: #f9fafb;
        border-radius: 12px;
        font-size: 14px;
        line-height: 1.6;
        color: #374151;
        white-space: pre-wrap;
        word-wrap: break-word;
      }
      
      /* Simplified Text */
      .vocab-chat-simplified-text {
        padding: 16px;
        background: #faf5ff;
        border-radius: 12px;
        font-size: 14px;
        line-height: 1.6;
        color: #374151;
        white-space: pre-wrap;
        word-wrap: break-word;
        margin-bottom: 12px;
      }
      
      .vocab-chat-simplified-header {
        font-size: 13px;
        font-weight: 600;
        color: #9527F5;
        margin-bottom: 8px;
      }
      
      .vocab-chat-simplified-item {
        margin-bottom: 16px;
      }
      
      .vocab-chat-simplified-item:last-child {
        margin-bottom: 0;
      }
      
      /* Page Summary Container - Above "Summarise the page" button */
      .vocab-chat-page-summary-container {
        margin: 16px;
        margin-bottom: 12px;
        padding: 0;
      }
      
      .vocab-chat-page-summary-content {
        padding: 16px;
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        font-size: 14px;
        line-height: 1.6;
        color: #374151;
        word-wrap: break-word;
        overflow-wrap: break-word;
      }
      
      .vocab-chat-page-summary-content p {
        margin: 0 0 12px 0;
      }
      
      .vocab-chat-page-summary-content p:last-child {
        margin-bottom: 0;
      }
      
      .vocab-chat-page-summary-content strong {
        font-weight: 600;
        color: #1f2937;
      }
      
      .vocab-chat-simplify-more-container {
        display: flex;
        justify-content: flex-end;
        margin-top: 12px;
      }
      
      .vocab-chat-simplify-more-btn {
        background: #9527F5;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 10px 20px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: inherit;
        text-decoration: none;
      }
      
      .vocab-chat-simplify-more-btn:hover:not(.disabled) {
        background: #7a1fd9;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(149, 39, 245, 0.3);
        text-decoration: none;
      }
      
      .vocab-chat-simplify-more-btn:active:not(.disabled) {
        transform: translateY(0) scale(0.95);
      }
      
      .vocab-chat-simplify-more-btn.disabled {
        background: #d1d5db;
        cursor: not-allowed;
        opacity: 0.6;
      }
      
      .vocab-chat-simplify-more-btn.loading {
        position: relative;
        color: transparent;
      }
      
      .vocab-chat-simplify-more-btn.loading::after {
        content: '';
        position: absolute;
        width: 16px;
        height: 16px;
        top: 50%;
        left: 50%;
        margin-left: -8px;
        margin-top: -8px;
        border: 2px solid white;
        border-radius: 50%;
        border-top-color: transparent;
        animation: vocab-chat-spin 0.6s linear infinite;
      }
      
      @keyframes vocab-chat-spin {
        to {
          transform: rotate(360deg);
        }
      }
      
      /* Chat Messages */
      .vocab-chat-messages {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 0;
      }
      
      /* No Messages State */
      .vocab-chat-no-messages {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .vocab-chat-no-messages-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        opacity: 0.5;
      }
      
      .vocab-chat-no-messages-content span {
        font-size: 16px;
        font-weight: 500;
        color: #9527F5;
      }
      
      .vocab-chat-regional-lang-text {
        font-size: 13px !important;
        font-weight: 400 !important;
        color: #9527F5 !important;
        animation: pulse 2s ease-in-out infinite;
        text-align: center;
        display: none; /* Hidden for now - voice recording feature not implemented yet */
      }
      
      @keyframes pulse {
        0%, 100% {
          opacity: 0.6;
          transform: scale(1);
        }
        50% {
          opacity: 1;
          transform: scale(1.05);
        }
      }
      
      /* Cat icon with breathing animation */
      .vocab-chat-empty-cat-icon {
        width: 80px;
        height: 80px;
        object-fit: contain;
        animation: catBreathing 2s ease-in-out infinite;
        display: block;
        filter: brightness(1.1) saturate(1.4) hue-rotate(5deg);
      }
      
      @keyframes catBreathing {
        0%, 100% {
          transform: scale(1);
          filter: brightness(1.1) saturate(1.4) hue-rotate(5deg) drop-shadow(0 0 8px rgba(160, 32, 240, 0.4));
        }
        50% {
          transform: scale(1.15);
          filter: brightness(1.1) saturate(1.4) hue-rotate(5deg) drop-shadow(0 0 20px rgba(160, 32, 240, 0.8)) drop-shadow(0 0 30px rgba(160, 32, 240, 0.5));
        }
      }
      
      /* Message Bubbles */
      .vocab-chat-message {
        display: flex;
        flex-direction: column;
        position: relative;
      }
      
      .vocab-chat-message-user {
        align-items: flex-end;
        margin-right: 8px;
      }
      
      .vocab-chat-message-ai {
        align-items: flex-start;
        margin-left: 12px;
      }
      
      .vocab-chat-message-content {
        padding: 12px 16px;
        border-radius: 12px;
        font-size: 14px;
        line-height: 1.5;
        max-width: 85%;
        word-wrap: break-word;
        white-space: pre-wrap;
      }
      
      .vocab-chat-message-user .vocab-chat-message-content {
        background: #f3e8ff;
        color: #374151;
      }
      
      .vocab-chat-message-ai .vocab-chat-message-content {
        background: white;
        color: #374151;
        box-shadow: 0 2px 8px rgba(149, 39, 245, 0.15), 0 1px 4px rgba(149, 39, 245, 0.1);
      }
      
      /* Loading Animation - Three Dots Waving */
      .vocab-chat-typing-indicator {
        display: flex;
        gap: 3px;
        align-items: center;
        padding: 12px 0;
        justify-content: flex-start;
        margin-left: 16px;
      }
      
      .vocab-chat-typing-indicator span {
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: #9527F5;
        animation: typing-wave 1.4s ease-in-out infinite;
        opacity: 0.7;
      }
      
      .vocab-chat-typing-indicator span:nth-child(1) {
        animation-delay: 0s;
      }
      
      .vocab-chat-typing-indicator span:nth-child(2) {
        animation-delay: 0.2s;
      }
      
      .vocab-chat-typing-indicator span:nth-child(3) {
        animation-delay: 0.4s;
      }
      
      @keyframes typing-wave {
        0%, 60%, 100% {
          transform: translateY(0);
          opacity: 0.7;
        }
        30% {
          transform: translateY(-6px);
          opacity: 1;
        }
      }
      
      /* Markdown Styling in AI Messages */
      .vocab-chat-message-ai .vocab-chat-message-content code {
        background: #f3f4f6;
        color: #9527F5;
        padding: 2px 6px;
        border-radius: 4px;
        font-family: 'Courier New', Courier, monospace;
        font-size: 13px;
      }
      
      .vocab-chat-message-ai .vocab-chat-message-content pre {
        background: #f3f4f6;
        padding: 12px;
        border-radius: 8px;
        overflow-x: auto;
        margin: 8px 0;
      }
      
      .vocab-chat-message-ai .vocab-chat-message-content pre code {
        background: transparent;
        padding: 0;
        font-size: 12px;
        line-height: 1.5;
      }
      
      .vocab-chat-message-ai .vocab-chat-message-content strong {
        font-weight: 600;
        color: #1f2937;
      }
      
      .vocab-chat-message-ai .vocab-chat-message-content em {
        font-style: italic;
      }
      
      .vocab-chat-message-ai .vocab-chat-message-content a {
        color: #9527F5;
        text-decoration: underline;
      }
      
      .vocab-chat-message-ai .vocab-chat-message-content a:hover {
        color: #7a1fd9;
      }
      
      .vocab-chat-message-ai .vocab-chat-message-content h1,
      .vocab-chat-message-ai .vocab-chat-message-content h2,
      .vocab-chat-message-ai .vocab-chat-message-content h3 {
        font-weight: 600;
        margin: 8px 0;
        color: #1f2937;
      }
      
      .vocab-chat-message-ai .vocab-chat-message-content h1 {
        font-size: 18px;
      }
      
      .vocab-chat-message-ai .vocab-chat-message-content h2 {
        font-size: 16px;
      }
      
      .vocab-chat-message-ai .vocab-chat-message-content h3 {
        font-size: 15px;
      }
      
      .vocab-chat-message-ai .vocab-chat-message-content ul {
        margin: 8px 0;
        padding-left: 20px;
      }
      
      .vocab-chat-message-ai .vocab-chat-message-content li {
        margin: 4px 0;
      }
      
      /* Input Area */
      .vocab-chat-input-area {
        display: flex;
        gap: 8px;
        padding: 16px;
        border-top: 1px solid #e5e7eb;
        background: white;
        align-items: flex-end;
      }
      
      .vocab-chat-input {
        flex: 1;
        padding: 10px 12px;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        font-size: 14px;
        font-family: inherit;
        resize: none;
        outline: none;
        transition: border-color 0.2s ease;
        min-height: 40px;
        max-height: 120px;
        color: #1f2937 !important; /* Ensure text is visible */
        caret-color: #9527F5 !important; /* Ensure cursor is visible */
        background-color: white !important; /* Ensure background is white */
      }
      
      .vocab-chat-input:focus {
        border-color: #9527F5;
        color: #1f2937 !important; /* Ensure text is visible on focus */
        caret-color: #9527F5 !important; /* Ensure cursor is visible on focus */
      }
      
      .vocab-chat-input::placeholder {
        color: #9ca3af !important; /* Ensure placeholder is visible */
      }
      
      /* Send Button - Wireframe Purple Circular */
      .vocab-chat-send-btn {
        width: 44px;
        height: 44px;
        background: white;
        border: 2px solid #9527F5;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        flex-shrink: 0;
        text-decoration: none;
      }
      
      .vocab-chat-send-btn:hover {
        background: #f0e6ff;
        border-color: #7a1fd9;
        transform: translateY(-1px);
        text-decoration: none;
      }
      
      .vocab-chat-send-btn:active {
        transform: translateY(0) scale(0.95);
      }
      
      /* Mic Button - Voice Input */
      .vocab-chat-mic-btn {
        width: 44px;
        height: 44px;
        background: white;
        border: 2px solid #9527F5;
        border-radius: 50%;
        display: none; /* Hidden for now - voice recording feature not implemented yet */
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        flex-shrink: 0;
        text-decoration: none;
      }
      
      .vocab-chat-mic-btn:hover {
        background: #f0e6ff;
        border-color: #7a1fd9;
        transform: translateY(-1px);
        text-decoration: none;
      }
      
      .vocab-chat-mic-btn:active {
        transform: translateY(0) scale(0.95);
      }
      
      .vocab-chat-mic-btn.recording {
        background: #9527F5;
        border-color: #9527F5;
        animation: recording-pulse 1s ease-in-out infinite;
      }
      
      .vocab-chat-mic-btn.recording svg {
        fill: white;
      }
      
      .vocab-chat-mic-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      @keyframes recording-pulse {
        0%, 100% {
          box-shadow: 0 0 0 0 rgba(149, 39, 245, 0.7);
        }
        50% {
          box-shadow: 0 0 0 10px rgba(149, 39, 245, 0);
        }
      }
      
      /* Voice Loading Spinner */
      .vocab-chat-voice-spinner {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        margin: 8px 0;
        background: #f9fafb;
        border-radius: 10px;
      }
      
      .vocab-spinner-circle {
        width: 20px;
        height: 20px;
        border: 2px solid #e5e7eb;
        border-top-color: #9527F5;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
      }
      
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      
      .vocab-chat-voice-spinner span {
        font-size: 14px;
        color: #9527F5;
        font-weight: 500;
      }
      
      /* Microphone Permission Modal */
      .vocab-mic-permission-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000000;
        animation: fadeIn 0.2s ease;
      }
      
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      
      .vocab-mic-permission-modal {
        background: white;
        border-radius: 16px;
        max-width: 480px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(149, 39, 245, 0.3);
        animation: slideUp 0.3s ease;
        overflow: hidden;
      }
      
      @keyframes slideUp {
        from {
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      
      .vocab-mic-permission-header {
        text-align: center;
        padding: 32px 24px 24px;
        border-bottom: 1px solid #e5e7eb;
      }
      
      .vocab-mic-permission-header svg {
        margin-bottom: 16px;
      }
      
      .vocab-mic-permission-header h2 {
        font-size: 24px;
        font-weight: 600;
        color: #1f2937;
        margin: 0 0 8px 0;
      }
      
      .vocab-mic-permission-header p {
        font-size: 14px;
        color: #6b7280;
        margin: 0;
      }
      
      .vocab-mic-permission-body {
        padding: 24px;
      }
      
      .vocab-mic-permission-step {
        display: flex;
        gap: 16px;
        margin-bottom: 20px;
      }
      
      .vocab-mic-permission-step:last-of-type {
        margin-bottom: 24px;
      }
      
      .vocab-mic-step-number {
        width: 32px;
        height: 32px;
        background: #f0e6ff;
        color: #9527F5;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 14px;
        flex-shrink: 0;
      }
      
      .vocab-mic-step-content h3 {
        font-size: 16px;
        font-weight: 600;
        color: #1f2937;
        margin: 0 0 4px 0;
      }
      
      .vocab-mic-step-content p {
        font-size: 14px;
        color: #6b7280;
        margin: 0;
        line-height: 1.5;
      }
      
      .vocab-mic-permission-note {
        background: #fef3c7;
        border: 1px solid #fcd34d;
        border-radius: 8px;
        padding: 12px;
        font-size: 13px;
        color: #92400e;
        line-height: 1.5;
      }
      
      .vocab-mic-permission-note strong {
        font-weight: 600;
        color: #78350f;
      }
      
      .vocab-mic-permission-visual-guide {
        margin: 20px 0;
      }
      
      .vocab-mic-address-bar-demo {
        background: #f3f4f6;
        border: 2px solid #d1d5db;
        border-radius: 8px;
        padding: 12px 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 0 auto;
        max-width: 300px;
      }
      
      .vocab-mic-lock-icon {
        font-size: 20px;
        animation: bounce 1s ease-in-out infinite;
      }
      
      @keyframes bounce {
        0%, 100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-5px);
        }
      }
      
      .vocab-mic-url-demo {
        font-size: 14px;
        color: #374151;
        font-weight: 500;
      }
      
      .vocab-mic-permission-footer {
        padding: 16px 24px;
        background: #f9fafb;
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        border-top: 1px solid #e5e7eb;
      }
      
      .vocab-mic-permission-btn-secondary,
      .vocab-mic-permission-btn-primary {
        padding: 10px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        border: none;
        outline: none;
        font-family: inherit;
      }
      
      .vocab-mic-permission-btn-secondary {
        background: white;
        color: #6b7280;
        border: 1px solid #d1d5db;
      }
      
      .vocab-mic-permission-btn-secondary:hover {
        background: #f9fafb;
        border-color: #9ca3af;
      }
      
      .vocab-mic-permission-btn-primary {
        background: #9527F5;
        color: white;
        display: flex;
        align-items: center;
        gap: 8px;
        animation: buttonPulse 2s ease-in-out infinite;
        box-shadow: 0 4px 12px rgba(149, 39, 245, 0.4);
      }
      
      @keyframes buttonPulse {
        0%, 100% {
          box-shadow: 0 4px 12px rgba(149, 39, 245, 0.4);
        }
        50% {
          box-shadow: 0 6px 20px rgba(149, 39, 245, 0.6);
        }
      }
      
      .vocab-mic-permission-btn-primary:hover {
        background: #7a1fd9;
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(149, 39, 245, 0.5) !important;
        animation: none;
      }
      
      .vocab-mic-permission-btn-primary:active {
        transform: translateY(0) scale(0.95);
      }
      
      /* Delete Conversation Button - Wireframe Red Circular */
      .vocab-chat-delete-conversation-btn {
        width: 44px;
        height: 44px;
        background: white;
        border: 2px solid #ef4444;
        border-radius: 50%;
        display: none;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        flex-shrink: 0;
        margin-left: 4px;
        text-decoration: none;
      }
      
      .vocab-chat-delete-conversation-btn:hover {
        background: #fef2f2;
        border-color: #dc2626;
        transform: translateY(-1px);
        text-decoration: none;
      }
      
      .vocab-chat-delete-conversation-btn:active {
        transform: translateY(0) scale(0.95);
      }
      
      /* Resize Handles */
      .vocab-chat-resize-handle {
        position: absolute;
        z-index: 1000001;
      }
      
      .vocab-chat-resize-left {
        left: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        cursor: ew-resize;
        background: transparent;
        transition: all 0.2s ease;
      }
      
      .vocab-chat-resize-left::before {
        content: '';
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 4px;
        height: 40px;
        border-radius: 2px;
        background: #9527F5;
        box-shadow: 0 0 8px rgba(149, 39, 245, 0.3);
        transition: all 0.2s ease;
      }
      
      .vocab-chat-resize-left:hover::before {
        background: #9527F5;
        box-shadow: 0 0 12px rgba(149, 39, 245, 0.5);
        transform: translate(-50%, -50%) scale(1.1);
      }
      
      .vocab-chat-resize-bottom {
        left: 0;
        right: 0;
        bottom: 0;
        height: 4px;
        cursor: ns-resize;
        background: transparent;
        transition: background 0.2s ease;
      }
      
      .vocab-chat-resize-bottom:hover {
        background: rgba(149, 39, 245, 0.3);
      }
      
      .vocab-chat-resize-bottom-left {
        left: 0;
        bottom: 0;
        width: 20px;
        height: 20px;
        cursor: nesw-resize;
        background: transparent;
      }
      
      .vocab-chat-resize-bottom-left::before {
        content: '';
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 20px;
        height: 20px;
        background: transparent;
        box-shadow: none;
        border-bottom: 4px solid #9527F5;
        border-left: 4px solid #9527F5;
        border-right: none;
        border-top: none;
        border-radius: 0 0 0 20px;
        transition: all 0.2s ease;
      }
      
      .vocab-chat-resize-bottom-left:hover::before {
        transform: translate(-50%, -50%) scale(1.1);
        box-shadow: none;
      }
      
      .vocab-chat-resize-top-left {
        left: 0;
        top: 0;
        width: 20px;
        height: 20px;
        cursor: nw-resize;
        background: transparent;
      }
      
      .vocab-chat-resize-top-left::before {
        content: '';
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 20px;
        height: 20px;
        background: transparent;
        box-shadow: none;
        border-top: 4px solid #9527F5;
        border-left: 4px solid #9527F5;
        border-right: none;
        border-bottom: none;
        border-radius: 20px 0 0 0;
        transition: all 0.2s ease;
      }
      
      .vocab-chat-resize-top-left:hover::before {
        transform: translate(-50%, -50%) scale(1.1);
        box-shadow: none;
      }
      
      /* Focus Button Styles */
      .vocab-chat-focus-btn-container {
        padding: 16px 16px 12px 16px;
        margin-bottom: 12px;
      }
      
      .vocab-chat-focus-btn {
        display: inline-flex !important;
        flex-direction: row !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 6px !important;
        width: auto;
        padding: 8px 14px;
        margin: 0;
        background: white;
        border: 2px solid #9527F5;
        border-radius: 6px;
        color: #9527F5;
        font-weight: 500;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 1px 2px rgba(149, 39, 245, 0.05);
        text-decoration: none;
      }
      
      .vocab-chat-focus-btn:hover {
        background: #f9f5ff;
        border-color: #7a1fd9;
        box-shadow: 0 2px 4px rgba(149, 39, 245, 0.1);
        text-decoration: none;
      }
      
      .vocab-chat-focus-btn:active {
        transform: scale(0.98);
      }
      
      .vocab-chat-focus-btn svg {
        flex-shrink: 0 !important;
        display: inline-block !important;
        width: 16px !important;
        height: 16px !important;
        order: 1 !important;
      }
      
      .vocab-chat-focus-btn span {
        color: #9527F5;
        font-weight: 500;
        order: 2 !important;
        display: inline-block !important;
      }
      
      /* Responsive */
      @media (max-width: 768px) {
        .vocab-chat-dialog {
          width: 100vw;
          max-width: 100vw;
          height: 100vh;
          max-height: 100vh;
        }
        
        .vocab-chat-resize-handle {
          display: none;
        }
      }

      /* Processing Overlay Styles */
      .vocab-processing-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
        border-radius: 20px;
      }

      .vocab-processing-overlay.visible {
        opacity: 1;
        visibility: visible;
      }

      .vocab-processing-content {
        background: transparent;
        border-radius: 20px;
        padding: 40px;
        box-shadow: none;
        text-align: center;
        max-width: 400px;
        width: 90%;
      }

      .vocab-processing-text {
        font-size: 20px;
        font-weight: 600;
        color: #A24EFF;
        margin-bottom: 20px;
        font-family: 'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }

      .vocab-processing-icon {
        width: 40px;
        height: 40px;
        margin: 20px auto 0 auto;
        position: relative;
      }

      /* Image Processing Overlay Styles */
      .vocab-image-processing-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
        border-radius: 20px;
      }

      .vocab-image-processing-overlay.visible {
        opacity: 1;
        visibility: visible;
      }

      .vocab-image-processing-content {
        background: transparent;
        border-radius: 20px;
        padding: 40px;
        box-shadow: none;
        text-align: center;
        max-width: 400px;
        width: 90%;
      }

      .vocab-image-processing-text {
        margin-bottom: 0;
      }

      .vocab-image-processing-main {
        font-size: 20px;
        font-weight: 600;
        color: #A24EFF;
        margin-bottom: 8px;
        font-family: 'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }

      .vocab-image-processing-sub {
        font-size: 14px;
        font-weight: 400;
        color: #666;
        margin: 0;
        font-family: 'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }

      .vocab-image-processing-spinner {
        width: 40px;
        height: 40px;
        margin: 0 auto 20px;
        position: relative;
      }

      .vocab-image-processing-spinner-circle {
        width: 100%;
        height: 100%;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #A24EFF;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .vocab-processing-icon::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(45deg, #A24EFF, #8B3AE8);
        border-radius: 50%;
        animation: vocab-processing-pulse 1.5s ease-in-out infinite;
      }

      .vocab-processing-icon::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 20px;
        height: 20px;
        background: white;
        border-radius: 50%;
        transform: translate(-50%, -50%);
        animation: vocab-processing-bounce 1.5s ease-in-out infinite;
      }

      @keyframes vocab-processing-pulse {
        0%, 100% {
          transform: scale(1);
          opacity: 1;
        }
        50% {
          transform: scale(1.2);
          opacity: 0.7;
        }
      }

      @keyframes vocab-processing-bounce {
        0%, 100% {
          transform: translate(-50%, -50%) scale(1);
        }
        50% {
          transform: translate(-50%, -50%) scale(1.3);
        }
      }

      /* Custom Content Modal Styles - Enhanced Modular Design */
      
      /* CSS Custom Properties for Theme System */
      :root {
        --vocab-primary-color: #A24EFF;
        --vocab-primary-hover: #8B3FE8;
        --vocab-primary-light: rgba(162, 78, 255, 0.1);
        --vocab-primary-lighter: rgba(162, 78, 255, 0.05);
        --vocab-secondary-color: #F8F9FA;
        --vocab-border-color: #E6D6FF;
        --vocab-border-light: rgba(162, 78, 255, 0.1);
        --vocab-text-primary: #333;
        --vocab-text-secondary: #666;
        --vocab-text-muted: #999;
        --vocab-background-white: #FFFFFF;
        --vocab-background-light: #F8F9FA;
        --vocab-shadow-light: 0 4px 12px rgba(162, 78, 255, 0.15);
        --vocab-shadow-medium: 0 8px 24px rgba(162, 78, 255, 0.2);
        --vocab-shadow-heavy: 0 25px 50px rgba(162, 78, 255, 0.25);
        --vocab-border-radius-sm: 8px;
        --vocab-border-radius-md: 12px;
        --vocab-border-radius-lg: 20px;
        --vocab-border-radius-xl: 40px;
        --vocab-transition-fast: 0.15s ease;
        --vocab-transition-normal: 0.2s ease;
        --vocab-transition-slow: 0.3s ease;
        --vocab-spacing-xs: 4px;
        --vocab-spacing-sm: 8px;
        --vocab-spacing-md: 16px;
        --vocab-spacing-lg: 24px;
        --vocab-spacing-xl: 32px;
        --vocab-spacing-xxl: 48px;
      }

      /* Overlay Component */
      .vocab-custom-content-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
        opacity: 0;
        visibility: hidden;
        transition: opacity var(--vocab-transition-slow), visibility var(--vocab-transition-slow);
        animation: overlayFadeIn var(--vocab-transition-slow) ease-out;
      }

      .vocab-custom-content-overlay.visible {
        opacity: 1;
        visibility: visible;
      }

      /* Context-aware blurring: Only blur main webpage icons when custom content modal is open */
      body.vocab-custom-content-modal-open .vocab-text-icons-wrapper[data-icon-context="main-webpage"] {
        filter: blur(8px) !important;
        opacity: 0.3 !important;
        pointer-events: none !important;
        transition: filter 0.3s ease, opacity 0.3s ease;
      }
      
      /* Ensure custom content modal icons remain visible and functional */
      body.vocab-custom-content-modal-open .vocab-text-icons-wrapper[data-icon-context="custom-content-modal"] {
        filter: none !important;
        opacity: 1 !important;
        pointer-events: auto !important;
      }
      
      /* Hide main webpage individual buttons when custom content modal is open */
      body.vocab-custom-content-modal-open .vocab-text-icons-wrapper[data-icon-context="main-webpage"] .vocab-word-remove-explained-btn,
      body.vocab-custom-content-modal-open .vocab-text-icons-wrapper[data-icon-context="main-webpage"] .vocab-text-book-btn,
      body.vocab-custom-content-modal-open .vocab-text-icons-wrapper[data-icon-context="main-webpage"] .vocab-text-remove-btn,
      body.vocab-custom-content-modal-open .vocab-text-icons-wrapper[data-icon-context="main-webpage"] .vocab-text-chat-btn,
      body.vocab-custom-content-modal-open .vocab-text-icons-wrapper[data-icon-context="main-webpage"] .vocab-text-remove-green-btn {
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
        transition: opacity 0.2s ease, visibility 0.2s ease;
      }
      
      /* Ensure custom content modal individual buttons remain visible and functional */
      body.vocab-custom-content-modal-open .vocab-text-icons-wrapper[data-icon-context="custom-content-modal"] .vocab-word-remove-explained-btn,
      body.vocab-custom-content-modal-open .vocab-text-icons-wrapper[data-icon-context="custom-content-modal"] .vocab-text-book-btn,
      body.vocab-custom-content-modal-open .vocab-text-icons-wrapper[data-icon-context="custom-content-modal"] .vocab-text-remove-btn,
      body.vocab-custom-content-modal-open .vocab-text-icons-wrapper[data-icon-context="custom-content-modal"] .vocab-text-chat-btn,
      body.vocab-custom-content-modal-open .vocab-text-icons-wrapper[data-icon-context="custom-content-modal"] .vocab-text-remove-green-btn {
        opacity: 1 !important;
        visibility: visible !important;
        pointer-events: auto !important;
      }

      /* Blur icons wrapper when other modals are open (image, pdf, text, topics) */
      body.vocab-image-modal-open .vocab-text-icons-wrapper,
      body.vocab-pdf-modal-open .vocab-text-icons-wrapper,
      body.vocab-text-modal-open .vocab-text-icons-wrapper,
      body.vocab-topics-modal-open .vocab-text-icons-wrapper {
        filter: blur(8px) !important;
        opacity: 0.3 !important;
        pointer-events: none !important;
        transition: filter 0.3s ease, opacity 0.3s ease;
      }
      
      /* Hide individual buttons when other modals are open */
      body.vocab-image-modal-open .vocab-word-remove-explained-btn,
      body.vocab-image-modal-open .vocab-text-book-btn,
      body.vocab-image-modal-open .vocab-text-remove-btn,
      body.vocab-image-modal-open .vocab-text-chat-btn,
      body.vocab-image-modal-open .vocab-text-remove-green-btn,
      body.vocab-pdf-modal-open .vocab-word-remove-explained-btn,
      body.vocab-pdf-modal-open .vocab-text-book-btn,
      body.vocab-pdf-modal-open .vocab-text-remove-btn,
      body.vocab-pdf-modal-open .vocab-text-chat-btn,
      body.vocab-pdf-modal-open .vocab-text-remove-green-btn,
      body.vocab-text-modal-open .vocab-word-remove-explained-btn,
      body.vocab-text-modal-open .vocab-text-book-btn,
      body.vocab-text-modal-open .vocab-text-remove-btn,
      body.vocab-text-modal-open .vocab-text-chat-btn,
      body.vocab-text-modal-open .vocab-text-remove-green-btn,
      body.vocab-topics-modal-open .vocab-word-remove-explained-btn,
      body.vocab-topics-modal-open .vocab-text-book-btn,
      body.vocab-topics-modal-open .vocab-text-remove-btn,
      body.vocab-topics-modal-open .vocab-text-chat-btn,
      body.vocab-topics-modal-open .vocab-text-remove-green-btn {
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
        transition: opacity 0.2s ease, visibility 0.2s ease;
      }

      /* Hide explained words cross icon when custom content modal is open (main webpage only) */
      body.vocab-custom-content-modal-open .vocab-text-icons-wrapper[data-icon-context="main-webpage"] .vocab-word-remove-explained-btn {
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
        transition: opacity 0.2s ease, visibility 0.2s ease;
      }

      /* Hide green cross icons for all explained words on main webpage when custom content modal is open */
      body.vocab-custom-content-modal-open .vocab-word-explained:not(.vocab-custom-content-modal .vocab-word-explained) .vocab-word-remove-explained-btn {
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
        transition: opacity 0.2s ease, visibility 0.2s ease;
      }

      @keyframes overlayFadeIn {
        from {
          opacity: 0;
          backdrop-filter: blur(0px);
        }
        to {
          opacity: 1;
          backdrop-filter: blur(8px);
        }
      }

      /* Modal Component */
      .vocab-custom-content-modal {
        background: var(--vocab-background-white);
        border-radius: 20px;
        box-shadow: var(--vocab-shadow-heavy), 0 0 0 1px var(--vocab-border-light);
        width: 90%;
        max-width: 900px;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        font-family: 'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        position: absolute;
        z-index: 10000010; /* Higher than all other elements including icons (10000005) */
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        animation: modalSlideIn var(--vocab-transition-slow) ease-out;
        overflow: hidden;
      }

      @keyframes modalSlideIn {
        from {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.95) translateY(20px);
        }
        to {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1) translateY(0);
        }
      }

      /* Minimize Button Component */
      .vocab-custom-content-minimize {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 40px;
        height: 40px;
        border: none;
        background: transparent;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        z-index: 1000;
        color: #9F7BDB;
      }

      .vocab-custom-content-minimize:hover {
        background: rgba(162, 78, 255, 0.1);
        transform: scale(1.2);
      }

      .vocab-custom-content-minimize:active {
        transform: scale(0.9);
      }

      /* Minimize Animation - Scale down and move to import-content button */
      .vocab-custom-content-modal.minimizing {
        animation: minimizeToButton 0.2s ease-out forwards;
        pointer-events: none;
        z-index: 10000010 !important; /* Ensure modal appears above everything during animation */
        position: fixed !important; /* Break out of overlay stacking context */
      }

      @keyframes minimizeToButton {
        0% {
          transform: var(--minimize-start-transform, translate(-50%, -50%)) scale(1);
          opacity: 1;
        }
        100% {
          transform: var(--minimize-end-transform, translate(calc(-50% + var(--minimize-target-x)), calc(-50% + var(--minimize-target-y)))) scale(0);
          opacity: 1;
        }
      }

      /* Dragging state */
      .vocab-custom-content-modal.dragging {
        cursor: grabbing;
        user-select: none;
      }

      .vocab-custom-content-modal.dragging * {
        pointer-events: none;
      }

      .vocab-custom-content-modal.dragging .vocab-custom-content-minimize {
        pointer-events: auto;
      }

      /* Palm cursor for draggable areas */
      .vocab-custom-content-modal {
        cursor: grab;
      }

      .vocab-custom-content-modal:active {
        cursor: grabbing;
      }

      /* Ensure interactive elements don't show palm cursor */
      .vocab-custom-content-modal input,
      .vocab-custom-content-modal button,
      .vocab-custom-content-modal textarea,
      .vocab-custom-content-modal .vocab-custom-content-tab-arrow,
      .vocab-custom-content-modal .vocab-custom-content-minimize,
      .vocab-custom-content-modal .vocab-custom-content-editor-content {
        cursor: default;
      }

      /* Resize handles should show proper resize cursors */
      .vocab-custom-content-modal .vocab-custom-content-resize-handle-top,
      .vocab-custom-content-modal .vocab-custom-content-resize-handle-bottom {
        cursor: ns-resize !important;
      }
      
      .vocab-custom-content-modal .vocab-custom-content-resize-handle-left,
      .vocab-custom-content-modal .vocab-custom-content-resize-handle-right {
        cursor: ew-resize !important;
      }
      
      .vocab-custom-content-modal .vocab-custom-content-resize-handle-top-left {
        cursor: nw-resize !important;
      }
      
      .vocab-custom-content-modal .vocab-custom-content-resize-handle-top-right {
        cursor: ne-resize !important;
      }
      
      .vocab-custom-content-modal .vocab-custom-content-resize-handle-bottom-left {
        cursor: sw-resize !important;
      }
      
      .vocab-custom-content-modal .vocab-custom-content-resize-handle-bottom-right {
        cursor: se-resize !important;
      }

      /* Tabs Component */
      .vocab-custom-content-tabs {
        display: flex;
        align-items: center;
        padding: calc(var(--vocab-spacing-lg) + 20px) var(--vocab-spacing-lg) 0 var(--vocab-spacing-lg);
        background: var(--vocab-background-white);
        border-bottom: none;
        min-height: 40px;
        position: relative;
        margin: 0;
        margin-bottom: 0;
        gap: 8px;
      }

      .vocab-custom-content-tabs::before {
        display: none;
      }

      .vocab-custom-content-tabs-container {
        display: flex;
        flex: 1;
        overflow-x: auto;
        scrollbar-width: none;
        -ms-overflow-style: none;
        gap: 0;
        padding: 0;
        border: none;
        margin: 0;
        position: relative;
        max-width: calc(100% - 80px);
      }

      .vocab-custom-content-tabs-container::-webkit-scrollbar {
        display: none;
      }

      /* Sliding tab background */
      .vocab-custom-content-tabs-container::before {
        content: '';
        position: absolute;
        top: 0;
        left: var(--sliding-bg-left, 0);
        width: var(--sliding-bg-width, 0);
        height: 100%;
        background: rgba(162, 78, 255, 0.1);
        border-radius: 10px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 0;
        pointer-events: none;
        opacity: 0;
      }

      .vocab-custom-content-tabs-container.has-active-tab::before {
        opacity: 1;
      }

      /* Tab transition animation */
      .vocab-custom-content-tabs-container.tab-transitioning .vocab-custom-content-tab {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      /* Tab Navigation Arrows */
      .vocab-custom-content-tab-arrow {
        background: transparent;
        border: none;
        color: rgba(162, 78, 255, 0.8);
        cursor: pointer;
        padding: var(--vocab-spacing-xs);
        border-radius: var(--vocab-border-radius-sm);
        transition: all var(--vocab-transition-normal);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 1;
        box-shadow: none;
        min-width: 32px;
        height: 32px;
      }

      .vocab-custom-content-tab-arrow:hover {
        background: rgba(162, 78, 255, 0.1);
        opacity: 1;
        transform: translateY(-1px);
        box-shadow: none;
      }

      .vocab-custom-content-tab-arrow:disabled {
        opacity: 0.3;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }

      .vocab-custom-content-tab-arrow:disabled:hover {
        background: var(--vocab-background-white);
        transform: none;
        box-shadow: var(--vocab-shadow-light);
      }

      /* Individual Tab Styling */
      .vocab-custom-content-tab {
        display: flex;
        align-items: center;
        padding: var(--vocab-spacing-xs) var(--vocab-spacing-sm);
        background: transparent;
        border: none;
        border-radius: 0;
        cursor: pointer;
        transition: all var(--vocab-transition-normal);
        min-width: 140px;
        max-width: 220px;
        position: relative;
        box-shadow: none;
        overflow: hidden;
        color: rgba(162, 78, 255, 0.7);
        z-index: 1;
      }

      /* Add vertical separators between tabs */
      .vocab-custom-content-tab:not(:last-child)::after {
        content: '';
        position: absolute;
        right: 0;
        top: 20%;
        bottom: 20%;
        width: 1px;
        background: rgba(162, 78, 255, 0.2);
        z-index: 1;
      }

      /* Remove separator after active tab */
      .vocab-custom-content-tab.active::after {
        display: none;
      }

      /* Remove separator before active tab */
      .vocab-custom-content-tab.active + .vocab-custom-content-tab::after {
        display: none;
      }

      /* Remove separator after tab that comes before active tab */
      .vocab-custom-content-tab:has(+ .vocab-custom-content-tab.active)::after {
        display: none;
      }

      /* Ensure separators show between non-active tabs */
      .vocab-custom-content-tab:not(.active):not(:last-child)::after {
        display: block;
      }

      .vocab-custom-content-tab::before {
        display: none;
      }

      .vocab-custom-content-tab:hover {
        background: #f5f5f5;
        transform: none;
        box-shadow: none;
      }

      .vocab-custom-content-tab:hover::before {
        transform: none;
      }

      .vocab-custom-content-tab.active {
        background: transparent;
        border: none;
        color: rgba(162, 78, 255, 0.9);
        z-index: 1;
        transform: none;
        box-shadow: none;
        border-radius: 0;
      }

      .vocab-custom-content-tab.active::before {
        transform: none;
      }

      /* Remove borders between active tab and adjacent tabs */
      .vocab-custom-content-tab.active {
        border-left: none;
        border-right: none;
      }

      /* Remove right border of tab that comes before active tab */
      .vocab-custom-content-tab.active + .vocab-custom-content-tab {
        border-left: none;
      }

      /* Remove left border of tab that comes after active tab */
      .vocab-custom-content-tab:has(+ .vocab-custom-content-tab.active) {
        border-right: none;
      }

      .vocab-custom-content-tab-title {
        flex: 1;
        font-size: 14px;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-right: var(--vocab-spacing-sm);
        color: inherit;
        cursor: pointer;
        transition: all var(--vocab-transition-fast);
      }

      .vocab-tab-title-truncated {
        position: relative;
      }

      .vocab-tab-title-truncated:hover {
        color: var(--vocab-primary-color);
        transform: scale(1.02);
      }


      .vocab-custom-content-tab-close {
        background: none;
        border: none;
        color: var(--vocab-text-muted);
        cursor: pointer;
        padding: var(--vocab-spacing-xs);
        border-radius: var(--vocab-border-radius-sm);
        transition: all var(--vocab-transition-fast);
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        opacity: 0.6;
      }

      .vocab-custom-content-tab-close:hover {
        background: rgba(255, 77, 77, 0.1);
        color: #FF4D4D;
        opacity: 1;
        transform: scale(1.1);
      }

      /* Add Tab Button */
      .vocab-custom-content-add-tab {
        background: #9527F5;
        border: none;
        color: white;
        cursor: pointer !important;
        padding: var(--vocab-spacing-xs);
        border-radius: 8px;
        transition: background-color var(--vocab-transition-normal), transform 0.1s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 32px;
        height: 32px;
        flex-shrink: 0;
        position: relative;
        z-index: 10;
        outline: none;
        box-shadow: none;
      }

      .vocab-custom-content-add-tab:hover {
        background: #7a1fd9;
        color: white;
        cursor: pointer;
      }

      .vocab-custom-content-add-tab:active {
        background: #6a1b9a;
        color: white;
        outline: none;
        box-shadow: none;
        transform: scale(0.95);
      }

      .vocab-custom-content-add-tab:focus {
        outline: none;
        box-shadow: none;
      }




      /* Editor Component */
      .vocab-custom-content-editor {
        flex: 1;
        padding: 0;
        overflow-y: auto;
        height: 450px;
        border: 1px solid rgba(162, 78, 255, 0.3);
        margin: 0 var(--vocab-spacing-lg) var(--vocab-spacing-lg) var(--vocab-spacing-lg);
        margin-top: 0;
        position: relative;
        border-radius: 20px 20px 20px 20px;
        background: var(--vocab-background-white);
        box-shadow: none;
        /* Add fade effect at top and bottom */
        background: linear-gradient(to bottom, 
          rgba(255, 255, 255, 1) 0px,
          rgba(255, 255, 255, 1) 20px,
          rgba(255, 255, 255, 0.95) 30px,
          rgba(255, 255, 255, 1) calc(100% - 30px),
          rgba(255, 255, 255, 1) calc(100% - 20px),
          rgba(255, 255, 255, 1) 100%
        );
      }

      /* Chat Icon */
      .vocab-custom-content-chat-icon {
        position: absolute;
        bottom: 30px;
        right: 35px;
        width: 40px;
        height: 40px;
        background: #9527F5;
        border: none;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer !important;
        transition: all 0.3s ease;
        z-index: 1000;
        pointer-events: auto;
        outline: none;
        box-shadow: 0 2px 8px rgba(149, 39, 245, 0.3);
      }

      .vocab-custom-content-chat-icon:hover {
        background: #7B1FA2;
        transform: scale(1.1);
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(149, 39, 245, 0.4);
      }

      .vocab-custom-content-chat-icon:active {
        transform: scale(0.95);
        background: #6A1B9A;
      }

      .vocab-custom-content-chat-icon:focus {
        outline: none;
      }

      /* Remove focus outline for mouse clicks, keep for keyboard navigation */
      .vocab-custom-content-chat-icon:focus:not(:focus-visible) {
        outline: none;
      }

      .vocab-custom-content-chat-icon svg {
        width: 48px;
        height: 48px;
        fill: #9527F5;
      }

      /* Scrollbar styling */
      .vocab-custom-content-editor::-webkit-scrollbar {
        width: 8px;
      }

      .vocab-custom-content-editor::-webkit-scrollbar-thumb {
        background: #D8C1E8;
        border-radius: 4px;
      }

      .vocab-custom-content-editor::-webkit-scrollbar-track {
        background: #F8F2FC;
        border-radius: 4px;
      }

      /* When scrollbar is visible, remove right corner radius */
      .vocab-custom-content-editor.has-scrollbar {
        border-radius: 20px 0 0 20px;
      }

      /* Add extra padding when scrollbar is visible */
      .vocab-custom-content-editor.has-scrollbar .vocab-custom-content-editor-content {
        padding: calc(var(--vocab-spacing-xl) + var(--vocab-spacing-md)) var(--vocab-spacing-xl) calc(var(--vocab-spacing-xl) + var(--vocab-spacing-md)) calc(var(--vocab-spacing-xl) + 40px); /* Extra 40px left padding for icons */
      }

      .vocab-custom-content-editor::before {
        display: none;
      }

      .vocab-custom-content-editor-content {
        line-height: 1.7;
        color: var(--vocab-text-primary);
        font-size: 16px;
        border-radius: var(--vocab-border-radius-md);
        overflow: visible;
        scrollbar-width: thin;
        scrollbar-color: var(--vocab-primary-color) var(--vocab-primary-lighter);
        padding: var(--vocab-spacing-xl) var(--vocab-spacing-xl) var(--vocab-spacing-xl) calc(var(--vocab-spacing-xl) + 40px); /* Extra 40px left padding for icons */
        background: transparent;
        opacity: 1;
        transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative; /* Enable absolute positioning for icons within editor */
      }

      .vocab-custom-content-editor-content.fade-out {
        opacity: 0;
      }

      .vocab-custom-content-editor-content.fade-in {
        opacity: 1;
      }

      .vocab-custom-content-editor-content::-webkit-scrollbar {
        width: 10px;
      }

      .vocab-custom-content-editor-content::-webkit-scrollbar-track {
        background: #F8F2FC;
        border-radius: var(--vocab-border-radius-lg);
        margin: var(--vocab-spacing-sm);
      }

      .vocab-custom-content-editor-content::-webkit-scrollbar-thumb {
        background: #D8C1E8;
        border-radius: 4px;
        border: 2px solid var(--vocab-background-white);
      }

      /* Custom Content Info Banner */
      .vocab-custom-content-info-banner {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border: 1px solid #9527F5;
        border-radius: 12px;
        padding: 16px 20px;
        box-shadow: 0 4px 12px rgba(149, 39, 245, 0.3);
        z-index: 10000002;
        max-width: 400px;
        opacity: 0;
        transform: translateX(400px);
        transition: opacity 0.3s ease, transform 0.3s ease;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        pointer-events: all;
      }

      .vocab-custom-content-info-banner.visible {
        opacity: 1;
        transform: translateX(0);
      }

      .vocab-custom-content-info-banner-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        gap: 12px;
      }

      .vocab-custom-content-info-banner-title {
        font-size: 16px;
        font-weight: 600;
        color: #9527F5;
        margin: 0;
        flex: 1;
      }

      .vocab-custom-content-info-banner-close {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #9527F5;
        transition: opacity 0.2s ease, transform 0.1s ease;
        opacity: 0.6;
        flex-shrink: 0;
      }

      .vocab-custom-content-info-banner-close:hover {
        opacity: 1;
        transform: scale(1.1);
      }

      .vocab-custom-content-info-banner-close svg {
        width: 16px;
        height: 16px;
      }

      .vocab-custom-content-info-banner-content {
        margin-bottom: 14px;
      }

      .vocab-custom-content-info-banner-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .vocab-custom-content-info-banner-list li {
        margin-bottom: 10px;
        padding-left: 20px;
        position: relative;
        color: #333;
        font-size: 14px;
        line-height: 1.5;
        font-weight: 400;
      }

      .vocab-custom-content-info-banner-list li:last-child {
        margin-bottom: 0;
      }

      .vocab-custom-content-info-banner-list li::before {
        content: '•';
        position: absolute;
        left: 6px;
        color: #9527F5;
        font-weight: bold;
        font-size: 16px;
      }

      .vocab-custom-content-info-banner-highlight {
        background: rgba(149, 39, 245, 0.15);
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 500;
        color: #9527F5;
      }

      .vocab-custom-content-info-banner-footer {
        display: flex;
        justify-content: flex-end;
        padding-top: 10px;
        margin-top: 2px;
      }

      .vocab-custom-content-info-banner-dismiss-btn {
        background: white;
        color: #B8A3E8;
        border: 2px solid #9527F5;
        padding: 6px 14px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        font-family: inherit;
        display: flex;
        align-items: center;
        gap: 6px;
        position: relative;
        overflow: hidden;
      }

      .vocab-custom-content-info-banner-dismiss-btn::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(149, 39, 245, 0.1), transparent);
        transition: left 0.5s ease;
      }

      .vocab-custom-content-info-banner-dismiss-btn:hover {
        background: #9527F5;
        color: white;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(149, 39, 245, 0.3);
      }

      .vocab-custom-content-info-banner-dismiss-btn:hover::before {
        left: 100%;
      }

      .vocab-custom-content-info-banner-dismiss-btn:active {
        transform: translateY(0) scale(0.95);
      }

      .vocab-custom-content-editor-content::-webkit-scrollbar-thumb:hover {
        background: #D8C1E8;
        opacity: 0.8;
      }

      /* Content Typography */
      .vocab-custom-content-editor-content h1,
      .vocab-custom-content-editor-content h2,
      .vocab-custom-content-editor-content h3,
      .vocab-custom-content-editor-content h4,
      .vocab-custom-content-editor-content h5,
      .vocab-custom-content-editor-content h6 {
        color: var(--vocab-primary-color);
        margin-top: var(--vocab-spacing-lg);
        margin-bottom: var(--vocab-spacing-md);
        font-weight: 600;
        letter-spacing: -0.5px;
      }

      .vocab-custom-content-editor-content h1 {
        font-size: 32px;
        font-weight: 700;
        border-bottom: 2px solid var(--vocab-border-light);
        padding-bottom: var(--vocab-spacing-sm);
      }

      .vocab-custom-content-editor-content h2 {
        font-size: 28px;
        font-weight: 600;
      }

      .vocab-custom-content-editor-content h3 {
        font-size: 24px;
        font-weight: 600;
      }

      .vocab-custom-content-editor-content h4 {
        font-size: 20px;
        font-weight: 500;
      }

      .vocab-custom-content-editor-content p {
        margin-bottom: var(--vocab-spacing-md);
        color: var(--vocab-text-primary);
      }

      .vocab-custom-content-editor-content ul,
      .vocab-custom-content-editor-content ol {
        margin-bottom: var(--vocab-spacing-md);
        padding-left: var(--vocab-spacing-lg);
        margin-left: 0;
        margin-top: var(--vocab-spacing-sm);
      }

      .vocab-custom-content-editor-content ul {
        list-style-type: disc;
      }

      .vocab-custom-content-editor-content ol {
        list-style-type: decimal;
      }

      .vocab-custom-content-editor-content li {
        margin-bottom: var(--vocab-spacing-sm);
        color: var(--vocab-text-primary);
        line-height: 1.6;
        padding-left: var(--vocab-spacing-xs);
      }

      /* Nested lists */
      .vocab-custom-content-editor-content ul ul,
      .vocab-custom-content-editor-content ol ol,
      .vocab-custom-content-editor-content ul ol,
      .vocab-custom-content-editor-content ol ul {
        margin-top: var(--vocab-spacing-xs);
        margin-bottom: var(--vocab-spacing-xs);
        padding-left: var(--vocab-spacing-lg);
      }

      .vocab-custom-content-editor-content ul ul {
        list-style-type: circle;
      }

      .vocab-custom-content-editor-content ul ul ul {
        list-style-type: square;
      }

      .vocab-custom-content-editor-content blockquote {
        border-left: 4px solid var(--vocab-primary-color);
        padding-left: var(--vocab-spacing-md);
        margin: var(--vocab-spacing-md) 0;
        color: var(--vocab-text-secondary);
        font-style: italic;
        background: var(--vocab-primary-lighter);
        padding: var(--vocab-spacing-md);
        border-radius: var(--vocab-border-radius-sm);
      }

      .vocab-custom-content-editor-content code {
        background: var(--vocab-background-light);
        padding: var(--vocab-spacing-xs) var(--vocab-spacing-sm);
        border-radius: var(--vocab-border-radius-sm);
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 14px;
        color: var(--vocab-primary-color);
        border: 1px solid var(--vocab-border-light);
      }

      .vocab-custom-content-editor-content pre {
        background: var(--vocab-background-light);
        padding: var(--vocab-spacing-md);
        border-radius: var(--vocab-border-radius-md);
        overflow-x: auto;
        margin: var(--vocab-spacing-md) 0;
        border: 1px solid var(--vocab-border-light);
        box-shadow: var(--vocab-shadow-light);
      }

      .vocab-custom-content-editor-content pre code {
        background: none;
        padding: 0;
        border: none;
        color: var(--vocab-text-primary);
      }

      /* Search highlighting */
      .vocab-search-highlight {
        background: linear-gradient(120deg, #FFE066 0%, #FFD700 100%);
        padding: var(--vocab-spacing-xs) var(--vocab-spacing-sm);
        border-radius: var(--vocab-border-radius-sm);
        font-weight: 600;
        box-shadow: 0 2px 4px rgba(255, 224, 102, 0.3);
        animation: highlightPulse 2s ease-in-out infinite;
      }

      @keyframes highlightPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); }
      }

      /* Responsive Design for Custom Content Modal */
      @media (max-width: 768px) {
        .vocab-custom-content-modal {
          width: 95%;
          margin: 20px;
        }

        .vocab-custom-content-header {
          padding: var(--vocab-spacing-lg) var(--vocab-spacing-xl);
          margin: 0;
        }

        .vocab-custom-content-title {
          font-size: 20px;
        }


        .vocab-custom-content-editor {
          padding: 20px;
          min-height: 300px;
        }
      }

      @media (max-width: 480px) {
        .vocab-custom-content-modal {
          width: 98%;
          margin: 10px;
        }

        .vocab-custom-content-header {
          padding: var(--vocab-spacing-md) var(--vocab-spacing-lg);
          margin: 0;
        }

        .vocab-custom-content-title {
          font-size: 18px;
        }


        .vocab-custom-content-editor {
          padding: 15px;
          min-height: 250px;
        }
      }

      /* Resize Handles Component */
      .vocab-custom-content-resize-handles {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        z-index: 20;
      }

      .vocab-custom-content-resize-handle {
        position: absolute;
        background: transparent;
        border: none;
        pointer-events: all;
        cursor: pointer;
        opacity: 0.6;
        transition: opacity var(--vocab-transition-normal), background-color var(--vocab-transition-normal);
        z-index: 10;
      }
      
      .vocab-custom-content-resize-handle:hover {
        opacity: 1;
        background: rgba(162, 78, 255, 0.1);
      }
      
      /* Edge handles - larger for easier grabbing */
      .vocab-custom-content-resize-handle-top,
      .vocab-custom-content-resize-handle-bottom {
        left: 15px;
        right: 15px;
        height: 12px;
        cursor: ns-resize;
      }
      
      .vocab-custom-content-resize-handle-top {
        top: -6px;
      }
      
      .vocab-custom-content-resize-handle-bottom {
        bottom: -6px;
      }
      
      .vocab-custom-content-resize-handle-left,
      .vocab-custom-content-resize-handle-right {
        top: 15px;
        bottom: 15px;
        width: 12px;
        cursor: ew-resize;
      }
      
      .vocab-custom-content-resize-handle-left {
        left: -6px;
      }
      
      .vocab-custom-content-resize-handle-right {
        right: -6px;
      }
      
      /* Corner handles - larger for easier grabbing */
      .vocab-custom-content-resize-handle-top-left,
      .vocab-custom-content-resize-handle-top-right,
      .vocab-custom-content-resize-handle-bottom-left,
      .vocab-custom-content-resize-handle-bottom-right {
        width: 24px;
        height: 24px;
        border-radius: 50%;
      }

      .vocab-custom-content-resize-handle-top-left {
        top: -2px;
        left: -2px;
        cursor: nw-resize;
      }

      .vocab-custom-content-resize-handle-top-right {
        top: -2px;
        right: -2px;
        cursor: ne-resize;
      }

      .vocab-custom-content-resize-handle-bottom-left {
        bottom: -2px;
        left: -2px;
        cursor: sw-resize;
      }

      .vocab-custom-content-resize-handle-bottom-right {
        bottom: -2px;
        right: -2px;
        cursor: se-resize;
      }

      /* Gripper icons - purple strips always visible */
      .vocab-custom-content-resize-handle::before {
        content: '';
        position: absolute;
        background: #9527F5;
        transition: all var(--vocab-transition-normal);
        box-shadow: 0 0 8px rgba(149, 39, 245, 0.3);
      }

      /* Top and bottom edge grippers */
      .vocab-custom-content-resize-handle-top::before,
      .vocab-custom-content-resize-handle-bottom::before {
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 40px;
        height: 4px;
        border-radius: 2px;
      }

      /* Left and right edge grippers */
      .vocab-custom-content-resize-handle-left::before,
      .vocab-custom-content-resize-handle-right::before {
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 4px;
        height: 40px;
        border-radius: 2px;
      }

      /* Corner grippers - curved arcs following rounded corners */
      .vocab-custom-content-resize-handle-top-left::before,
      .vocab-custom-content-resize-handle-top-right::before,
      .vocab-custom-content-resize-handle-bottom-left::before,
      .vocab-custom-content-resize-handle-bottom-right::before {
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 20px;
        height: 20px;
        background: transparent;
        box-shadow: none;
      }

      /* Top-left corner arc */
      .vocab-custom-content-resize-handle-top-left::before {
        border-top: 4px solid #9527F5;
        border-left: 4px solid #9527F5;
        border-right: none;
        border-bottom: none;
        border-radius: 20px 0 0 0;
        background: transparent;
      }

      /* Top-right corner arc */
      .vocab-custom-content-resize-handle-top-right::before {
        border-top: 4px solid #9527F5;
        border-right: 4px solid #9527F5;
        border-left: none;
        border-bottom: none;
        border-radius: 0 20px 0 0;
        background: transparent;
      }

      /* Bottom-left corner arc */
      .vocab-custom-content-resize-handle-bottom-left::before {
        border-bottom: 4px solid #9527F5;
        border-left: 4px solid #9527F5;
        border-right: none;
        border-top: none;
        border-radius: 0 0 0 20px;
        background: transparent;
      }

      /* Bottom-right corner arc */
      .vocab-custom-content-resize-handle-bottom-right::before {
        border-bottom: 4px solid #9527F5;
        border-right: 4px solid #9527F5;
        border-left: none;
        border-top: none;
        border-radius: 0 0 20px 0;
        background: transparent;
      }

      /* Handles are always visible */

      /* Enhanced purple strips on handle hover */
      .vocab-custom-content-resize-handle:hover::before {
        background: #9527F5;
        box-shadow: 0 0 12px rgba(149, 39, 245, 0.5);
        transform: translate(-50%, -50%) scale(1.1);
      }

      /* Corner strips maintain arc styling on hover - no color change */
      .vocab-custom-content-resize-handle-top-left:hover::before,
      .vocab-custom-content-resize-handle-top-right:hover::before,
      .vocab-custom-content-resize-handle-bottom-left:hover::before,
      .vocab-custom-content-resize-handle-bottom-right:hover::before {
        background: transparent !important;
        transform: translate(-50%, -50%) scale(1.1);
        box-shadow: none;
      }

      /* Enhanced Responsive Design */
      @media (max-width: 1200px) {
        .vocab-custom-content-modal {
          max-width: 95%;
          width: 95%;
        }
      }

      /* Accessibility Improvements */
      .vocab-custom-content-modal:focus-within {
        outline: none;
      }

      .vocab-custom-content-tab:focus,
      .vocab-custom-content-tab-arrow:focus,
      .vocab-custom-content-add-tab:focus,
      .vocab-custom-content-close:focus,
      .vocab-custom-content-chat-icon:focus {
        outline: 2px solid var(--vocab-primary-color);
        outline-offset: 2px;
      }

      /* Remove focus outline for mouse clicks, keep for keyboard navigation */
      .vocab-custom-content-add-tab:focus:not(:focus-visible) {
        outline: none;
      }

      .vocab-custom-content-chat-icon:focus:not(:focus-visible) {
        outline: none;
      }


      /* High contrast mode support */
      @media (prefers-contrast: high) {
        :root {
          --vocab-primary-color: #0000FF;
          --vocab-border-color: #000000;
          --vocab-text-primary: #000000;
          --vocab-background-white: #FFFFFF;
        }
      }

      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        .vocab-custom-content-overlay,
        .vocab-custom-content-modal,
        .vocab-custom-content-tab,
        .vocab-custom-content-tab-arrow,
        .vocab-custom-content-add-tab,
        .vocab-custom-content-close {
          transition: none;
          animation: none;
        }
      }
    `;
    
    document.head.appendChild(style);
  },
  
  /**
   * Save chat history to analysis data for persistence
   */
  saveChatHistoryToAnalysisData() {
    if (!this.currentTextKey || !window.ButtonPanel || !window.ButtonPanel.topicsModal || !window.ButtonPanel.topicsModal.customContentModal || !window.ButtonPanel.topicsModal.customContentModal.activeTabId) {
      console.log('[ChatDialog] Cannot save to analysis data - missing required components');
      return;
    }
    
    const activeContent = window.ButtonPanel.topicsModal.customContentModal.getContentByTabId(parseInt(window.ButtonPanel.topicsModal.customContentModal.activeTabId));
    if (!activeContent || !activeContent.analysis) {
      console.log('[ChatDialog] Cannot save to analysis data - no active content or analysis');
      return;
    }
    
    // Ensure chats array is initialized
    if (!activeContent.analysis.chats) {
      activeContent.analysis.chats = [];
      console.log('[ChatDialog] Initialized chats array in analysis data (close function)');
    }
    
    // Extract the tab ID from the currentTextKey
    const chatTabId = this.currentTextKey.replace(/^[^-]+-(\d+)-.*/, '$1');
    console.log('[ChatDialog] Saving chat history to analysis data for tab:', chatTabId);
    
    // Check if this textKey already exists in chats
    const existingChatIndex = activeContent.analysis.chats.findIndex(c => 
      c.textKey === this.currentTextKey
    );
    
    const chatData = {
      textKey: this.currentTextKey,
      messages: [...this.chatHistory],
      lastUpdated: new Date().toISOString()
    };
    
    if (existingChatIndex !== -1) {
      // Update existing chat
      activeContent.analysis.chats[existingChatIndex] = chatData;
      console.log(`[ChatDialog] Updated existing chat for textKey "${this.currentTextKey}" in analysis data`);
    } else {
      // Add new chat
      activeContent.analysis.chats.push(chatData);
      console.log(`[ChatDialog] Added new chat for textKey "${this.currentTextKey}" to analysis data`);
    }
  }
};
// Button Panel Module - Manages the floating button UI
// ===================================
const ButtonPanel = {
  panelContainer: null,
  upperButtonGroup: null,
  verticalButtonGroup: null,
  
  // State variables for button visibility and enabled states
  state: {
    isMagicMeaningEnabled: false,  // Controls enabled/disabled state of "Magic meaning" button
    showAsk: false,                // Controls visibility of "Ask" button
    showVerticalGroup: false       // Controls visibility of vertical button group
  },

  // API completion tracking
  apiCompletionState: {
    simplifyCompleted: true,
    wordsExplanationCompleted: true,
    shouldTrack: false  // Only track when magic meaning is clicked
  },

  /**
   * Initialize the button panel
   */
  async init() {
    this.createPanel();
    
    // Load and apply saved position
    await this.loadAndApplyPosition();
    
    // Initialize drag functionality - drag the entire panel container
    const dragHandle = document.getElementById('vocab-drag-handle');
    if (dragHandle && this.panelContainer) {
      DragHandle.init(dragHandle, this.panelContainer);
    }
    
    // Apply initial state
    this.updateButtonStates();
    
    // Attach event listeners after panel is created and added to DOM
    this.attachEventListeners();
    
    // Check if extension is enabled and show/hide accordingly
    const isEnabled = await this.checkExtensionEnabled();
    if (isEnabled) {
      this.show();
    } else {
      this.hide();
    }
    
    console.log('Button panel initialized. Enabled:', isEnabled);
    
    // Expose ButtonPanel to window for debugging
    window.ButtonPanel = ButtonPanel;
    console.log('[ButtonPanel] Exposed to window.ButtonPanel for debugging');
    
    // Add simple global functions for debugging
    window.checkTopicsContent = () => {
      console.log('[DEBUG] Checking topics content...');
      if (ButtonPanel.topicsModal && ButtonPanel.topicsModal.customContentModal) {
        const topics = ButtonPanel.topicsModal.customContentModal.topicContents;
        console.log('[DEBUG] Topics content:', topics);
        console.log('[DEBUG] Topics count:', topics.length);
        return topics;
      } else {
        console.log('[DEBUG] No topicsModal found');
        return null;
      }
    };
    
    window.showAllIndicators = () => {
      console.log('[DEBUG] Forcing all indicators to be visible...');
      const indicators = ['pdf-content-indicator', 'image-content-indicator', 'topics-content-indicator', 'text-content-indicator'];
      indicators.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          element.style.display = 'block';
          element.style.visibility = 'visible';
          element.style.opacity = '1';
          element.style.backgroundColor = '#16a34a';
          console.log(`[DEBUG] Made ${id} visible`);
        } else {
          console.log(`[DEBUG] ${id} not found`);
        }
      });
    };
  },

  /**
   * Load and apply saved position to the panel
   */
  async loadAndApplyPosition() {
    try {
      const savedPosition = await PositionManager.loadPosition();
      if (savedPosition && this.panelContainer) {
        // Apply constraints to ensure panel stays within viewport
        const constraints = this.calculateConstraints();
        const constrainedLeft = Math.max(constraints.minX, Math.min(constraints.maxX, savedPosition.left));
        const constrainedTop = Math.max(constraints.minY, Math.min(constraints.maxY, savedPosition.top));
        
        // Check if saved position is valid (not off-screen on the right)
        // If left position is too far right, reset to default left position
        if (constrainedLeft > window.innerWidth / 2) {
          console.log('[ButtonPanel] Saved position appears to be from right-side config, resetting...');
          await PositionManager.clearPosition();
          return; // Let CSS handle default positioning
        }
        
        // Apply the position
        this.panelContainer.style.left = `${constrainedLeft}px`;
        this.panelContainer.style.top = `${constrainedTop}px`;
        this.panelContainer.style.right = 'auto';
        this.panelContainer.style.transform = 'translateY(-50%)';
        
        console.log('[ButtonPanel] Applied saved position:', { left: constrainedLeft, top: constrainedTop });
      }
    } catch (error) {
      console.error('[ButtonPanel] Error loading position:', error);
    }
  },

  /**
   * Calculate viewport constraints to keep panel fully visible
   * @returns {Object} Constraint boundaries
   */
  calculateConstraints() {
    if (!this.panelContainer) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }
    
    const panelRect = this.panelContainer.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    return {
      minX: 0,
      maxX: viewportWidth - panelRect.width,
      minY: 0,
      maxY: viewportHeight - panelRect.height
    };
  },

  /**
   * Check if extension is enabled from storage for current domain
   * @returns {Promise<boolean>} Whether the extension is enabled
   */
  async checkExtensionEnabled() {
    try {
      const GLOBAL_STORAGE_KEY = 'is_extension_globally_enabled';
      const result = await chrome.storage.local.get([GLOBAL_STORAGE_KEY]);
      let isEnabled = result[GLOBAL_STORAGE_KEY];
      
      // If not found, create it and set to true (enabled by default)
      if (isEnabled === undefined) {
        isEnabled = true;
        await chrome.storage.local.set({ [GLOBAL_STORAGE_KEY]: isEnabled });
        console.log('[ButtonPanel] Global toggle state not found, created with default value: true');
      }
      
      return isEnabled;
    } catch (error) {
      console.error('[ButtonPanel] Error checking global extension state:', error);
      return true; // Default to true (enabled) on error
    }
  },

  /**
   * Create the button panel DOM structure
   */
  createPanel() {
    // Create main container
    this.panelContainer = document.createElement('div');
    this.panelContainer.id = 'vocab-helper-button-panel';
    this.panelContainer.className = 'vocab-helper-panel';

    // Create wrapper container (invisible, holds button group + pan button)
    const wrapperContainer = document.createElement('div');
    wrapperContainer.id = 'vocab-wrapper-container';
    wrapperContainer.className = 'vocab-wrapper-container';

    // Create main button group container with shadow
    const mainButtonGroup = document.createElement('div');
    mainButtonGroup.className = 'vocab-button-group-main';

    // Create upper button group (Remove all meanings)
    this.upperButtonGroup = document.createElement('div');
    this.upperButtonGroup.className = 'vocab-button-group-upper';

    const upperButtons = [];

    upperButtons.forEach(btnConfig => {
      const button = this.createButton(btnConfig);
      this.upperButtonGroup.appendChild(button);
    });

    // Create lower button group (Magic meaning, Ask, Custom content)
    const lowerButtonGroup = document.createElement('div');
    lowerButtonGroup.className = 'vocab-button-group-lower';

    const lowerButtons = [
      {
        id: 'magic-meaning',
        className: 'vocab-btn vocab-btn-solid-purple',
        icon: this.createSparkleIcon(),
        text: 'Magic meaning',
        type: 'solid-purple'
      },
      {
        id: 'ask',
        className: 'vocab-btn vocab-btn-solid-purple',
        icon: this.createChatIcon(),
        text: 'Ask anything',
        type: 'solid-purple'
      },
      {
        id: 'import-content',
        className: 'vocab-btn vocab-btn-solid-purple',
        icon: this.createUploadIcon(),
        text: 'Import content',
        type: 'solid-purple'
      }
    ];

    lowerButtons.forEach(btnConfig => {
      const button = this.createButton(btnConfig);
      lowerButtonGroup.appendChild(button);
    });

    // Append upper and lower groups to main group
    mainButtonGroup.appendChild(this.upperButtonGroup);
    mainButtonGroup.appendChild(lowerButtonGroup);

    // Create vertical button group
    this.verticalButtonGroup = this.createVerticalButtonGroup();

    // Create drag handle (separate from button group)
    const dragHandle = this.createDragHandle();

    // Append button group and drag handle to wrapper
    wrapperContainer.appendChild(mainButtonGroup);
    wrapperContainer.appendChild(dragHandle);

    // Append vertical button group to wrapper (positioned absolutely)
    wrapperContainer.appendChild(this.verticalButtonGroup);

    // Append wrapper to panel
    this.panelContainer.appendChild(wrapperContainer);

    // Inject styles
    this.injectStyles();

    // Append to body
    document.body.appendChild(this.panelContainer);
  },
  
  /**
   * Create drag handle element
   * @returns {HTMLElement} Drag handle element
   */
  createDragHandle() {
    const dragHandle = document.createElement('div');
    dragHandle.id = 'vocab-drag-handle';
    dragHandle.className = 'vocab-drag-handle';
    dragHandle.title = 'Drag to reposition';
    
    // Add pan icon
    dragHandle.innerHTML = this.createPanIcon();
    
    return dragHandle;
  },
  
  /**
   * Create pan/move icon SVG - Simple grip dots icon
   * @returns {string} SVG markup
   */
  createPanIcon() {
    return `
      <svg width="20" height="16" viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="6" cy="4" r="1.5" fill="#d4b5f5"/>
        <circle cx="10" cy="4" r="1.5" fill="#d4b5f5"/>
        <circle cx="14" cy="4" r="1.5" fill="#d4b5f5"/>
        <circle cx="6" cy="8" r="1.5" fill="#d4b5f5"/>
        <circle cx="10" cy="8" r="1.5" fill="#d4b5f5"/>
        <circle cx="14" cy="8" r="1.5" fill="#d4b5f5"/>
        <circle cx="6" cy="12" r="1.5" fill="#d4b5f5"/>
        <circle cx="10" cy="12" r="1.5" fill="#d4b5f5"/>
        <circle cx="14" cy="12" r="1.5" fill="#d4b5f5"/>
      </svg>
    `;
  },

  /**
   * Create a button element
   * @param {Object} config - Button configuration
   * @returns {HTMLElement} Button element
   */
  createButton(config) {
    const button = document.createElement('button');
    button.id = config.id;
    button.className = config.className;
    button.setAttribute('data-type', config.type);

    // Create icon container
    const iconSpan = document.createElement('span');
    iconSpan.className = 'vocab-btn-icon';
    iconSpan.innerHTML = config.icon;

    // Create text span
    const textSpan = document.createElement('span');
    textSpan.className = 'vocab-btn-text';
    textSpan.textContent = config.text;

    button.appendChild(iconSpan);
    button.appendChild(textSpan);

    // Add content indicator for import-content button
    if (config.id === 'import-content') {
      const indicator = document.createElement('div');
      indicator.className = 'vocab-content-indicator';
      indicator.id = 'import-content-indicator';
      button.appendChild(indicator);
    }

    return button;
  },

  /**
   * Create vertical button group
   * @returns {HTMLElement} Vertical button group element
   */
  createVerticalButtonGroup() {
    const group = document.createElement('div');
    group.className = 'vocab-vertical-button-group';
    group.id = 'vocab-vertical-button-group';
    group.style.pointerEvents = 'none'; // Initially not interactive

    // Create PDF button
    const pdfButton = document.createElement('button');
    pdfButton.className = 'vocab-vertical-btn';
    pdfButton.id = 'vocab-pdf-btn';
    pdfButton.innerHTML = `
      <div class="vocab-vertical-btn-icon">${this.createPDFIcon()}</div>
      <div class="vocab-content-indicator" id="pdf-content-indicator"></div>
    `;

    // Create Image button
    const imageButton = document.createElement('button');
    imageButton.className = 'vocab-vertical-btn';
    imageButton.id = 'vocab-image-btn';
    imageButton.innerHTML = `
      <div class="vocab-vertical-btn-icon">${this.createImageIcon()}</div>
      <div class="vocab-content-indicator" id="image-content-indicator"></div>
    `;

    // Create Topics button
    const topicsButton = document.createElement('button');
    topicsButton.className = 'vocab-vertical-btn';
    topicsButton.id = 'vocab-topics-btn';
    topicsButton.innerHTML = `
      <div class="vocab-vertical-btn-icon">${this.createTopicsIcon()}</div>
      <div class="vocab-content-indicator" id="topics-content-indicator"></div>
    `;

    // Create Text button
    const textButton = document.createElement('button');
    textButton.className = 'vocab-vertical-btn';
    textButton.id = 'vocab-text-btn';
    textButton.innerHTML = `
      <div class="vocab-vertical-btn-icon">${this.createTextIcon()}</div>
      <div class="vocab-content-indicator" id="text-content-indicator"></div>
    `;

    // Append buttons to group
    group.appendChild(pdfButton);
    group.appendChild(imageButton);
    group.appendChild(topicsButton);
    group.appendChild(textButton);

    // Update content indicators after creating buttons
    // Add a delay to ensure DOM is fully ready
    setTimeout(() => {
      this.updateContentIndicators();
    }, 50);

    return group;
  },

  /**
   * Update content indicators for all content import buttons
   */
  updateContentIndicators() {
    console.log('[ButtonPanel] ===== UPDATE CONTENT INDICATORS DEBUG =====');
    
    if (!this.topicsModal || !this.topicsModal.customContentModal) {
      console.log('[ButtonPanel] No topicsModal or customContentModal found');
      return;
    }

    // Check the actual storage arrays directly
    console.log('[ButtonPanel] === CHECKING STORAGE ARRAYS ===');
    console.log('[ButtonPanel] topicContents:', this.topicsModal.customContentModal.topicContents);
    console.log('[ButtonPanel] imageContents:', this.topicsModal.customContentModal.imageContents);
    console.log('[ButtonPanel] pdfContents:', this.topicsModal.customContentModal.pdfContents);
    console.log('[ButtonPanel] textContents:', this.topicsModal.customContentModal.textContents);
    console.log('[ButtonPanel] topicContents length:', this.topicsModal.customContentModal.topicContents.length);
    console.log('[ButtonPanel] imageContents length:', this.topicsModal.customContentModal.imageContents.length);
    console.log('[ButtonPanel] pdfContents length:', this.topicsModal.customContentModal.pdfContents.length);
    console.log('[ButtonPanel] textContents length:', this.topicsModal.customContentModal.textContents.length);

    const contentTypes = [
      { type: 'pdf', indicatorId: 'pdf-content-indicator' },
      { type: 'image', indicatorId: 'image-content-indicator' },
      { type: 'topic', indicatorId: 'topics-content-indicator' },
      { type: 'text', indicatorId: 'text-content-indicator' }
    ];
    let hasAnyContent = false;
    
    contentTypes.forEach(({ type, indicatorId }) => {
      const indicator = document.getElementById(indicatorId);
      
      console.log(`[ButtonPanel] Checking ${type}:`);
      console.log(`[ButtonPanel] - Indicator element:`, indicator);
      
      if (indicator) {
        // Check if content exists for this type
        const contents = this.topicsModal.customContentModal.getContentByType(type);
        const hasContent = contents && contents.length > 0;
        
        console.log(`[ButtonPanel] - Contents array:`, contents);
        console.log(`[ButtonPanel] - Has content:`, hasContent);
        console.log(`[ButtonPanel] - Content count:`, contents ? contents.length : 0);
        
        // Show or hide indicator based on content existence
        if (hasContent) {
          indicator.style.display = 'block';
          indicator.style.visibility = 'visible';
          indicator.style.opacity = '1';
          hasAnyContent = true;
          console.log(`[ButtonPanel] - Showing indicator for ${type}`);
        } else {
          indicator.style.display = 'none';
          indicator.style.visibility = 'hidden';
          indicator.style.opacity = '0';
          console.log(`[ButtonPanel] - Hiding indicator for ${type}`);
        }
      } else {
        console.log(`[ButtonPanel] - Indicator element not found for ${type}`);
      }
    });
    
    // Update import-content indicator based on whether any content exists
    console.log(`[ButtonPanel] === IMPORT-CONTENT INDICATOR UPDATE ===`);
    console.log(`[ButtonPanel] hasAnyContent: ${hasAnyContent}`);
    
    const importIndicator = document.getElementById('import-content-indicator');
    console.log(`[ButtonPanel] importIndicator element:`, importIndicator);
    
    if (importIndicator) {
      if (hasAnyContent) {
        importIndicator.style.display = 'block';
        importIndicator.style.visibility = 'visible';
        importIndicator.style.opacity = '1';
        console.log(`[ButtonPanel] - Showing import-content indicator (hasAnyContent: ${hasAnyContent})`);
      } else {
        importIndicator.style.display = 'none';
        importIndicator.style.visibility = 'hidden';
        importIndicator.style.opacity = '0';
        console.log(`[ButtonPanel] - Hiding import-content indicator (hasAnyContent: ${hasAnyContent})`);
      }
    } else {
      console.log(`[ButtonPanel] - Import-content indicator element not found`);
    }
    
    console.log('[ButtonPanel] ===== END UPDATE CONTENT INDICATORS DEBUG =====');
  },

  /**
   * Manual function to check storage and update indicators (for debugging)
   * Call this from browser console: window.ButtonPanel.debugCheckStorage()
   */
  debugCheckStorage() {
    console.log('[ButtonPanel] ===== MANUAL STORAGE CHECK =====');
    
    if (!this.topicsModal || !this.topicsModal.customContentModal) {
      console.log('[ButtonPanel] No topicsModal or customContentModal found');
      return;
    }

    console.log('[ButtonPanel] === DIRECT STORAGE ARRAY CHECK ===');
    console.log('[ButtonPanel] topicContents:', this.topicsModal.customContentModal.topicContents);
    console.log('[ButtonPanel] imageContents:', this.topicsModal.customContentModal.imageContents);
    console.log('[ButtonPanel] pdfContents:', this.topicsModal.customContentModal.pdfContents);
    console.log('[ButtonPanel] textContents:', this.topicsModal.customContentModal.textContents);
    
    console.log('[ButtonPanel] === ARRAY LENGTHS ===');
    console.log('[ButtonPanel] topicContents.length:', this.topicsModal.customContentModal.topicContents.length);
    console.log('[ButtonPanel] imageContents.length:', this.topicsModal.customContentModal.imageContents.length);
    console.log('[ButtonPanel] pdfContents.length:', this.topicsModal.customContentModal.pdfContents.length);
    console.log('[ButtonPanel] textContents.length:', this.topicsModal.customContentModal.textContents.length);
    
    console.log('[ButtonPanel] === INDICATOR ELEMENTS CHECK ===');
    const indicators = ['pdf-content-indicator', 'image-content-indicator', 'topics-content-indicator', 'text-content-indicator'];
    indicators.forEach(id => {
      const element = document.getElementById(id);
      console.log(`[ButtonPanel] ${id}:`, element);
      if (element) {
        console.log(`[ButtonPanel] ${id} display style:`, element.style.display);
        console.log(`[ButtonPanel] ${id} computed display:`, window.getComputedStyle(element).display);
      }
    });
    
    // Force update indicators
    console.log('[ButtonPanel] === FORCING INDICATOR UPDATE ===');
    this.updateContentIndicators();
    
    console.log('[ButtonPanel] ===== END MANUAL STORAGE CHECK =====');
  },

  /**
   * Force show all indicators for testing (call from console: window.ButtonPanel.forceShowIndicators())
   */
  forceShowIndicators() {
    console.log('[ButtonPanel] ===== FORCE SHOWING ALL INDICATORS =====');
    const indicators = ['pdf-content-indicator', 'image-content-indicator', 'topics-content-indicator', 'text-content-indicator'];
    indicators.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.style.display = 'block';
        element.style.visibility = 'visible';
        element.style.opacity = '1';
        console.log(`[ButtonPanel] Forced ${id} to be visible`);
      } else {
        console.log(`[ButtonPanel] ${id} not found`);
      }
    });
    console.log('[ButtonPanel] ===== END FORCE SHOWING INDICATORS =====');
  },

  /**
   * Quick fix function to manually check and update topics indicator
   * Call this from console: window.ButtonPanel.fixTopicsIndicator()
   */
  fixTopicsIndicator() {
    console.log('[ButtonPanel] ===== FIXING TOPICS INDICATOR =====');
    
    // Check if topics content exists
    const topicsContent = this.topicsModal.customContentModal.topicContents;
    console.log('[ButtonPanel] Topics content:', topicsContent);
    console.log('[ButtonPanel] Topics content length:', topicsContent.length);
    
    // Find the topics indicator
    const indicator = document.getElementById('topics-content-indicator');
    console.log('[ButtonPanel] Topics indicator element:', indicator);
    
    if (indicator) {
      if (topicsContent.length > 0) {
        indicator.style.display = 'block';
        indicator.style.visibility = 'visible';
        indicator.style.opacity = '1';
        console.log('[ButtonPanel] Topics indicator should now be visible');
      } else {
        indicator.style.display = 'none';
        console.log('[ButtonPanel] No topics content found, hiding indicator');
      }
    } else {
      console.log('[ButtonPanel] Topics indicator element not found!');
    }
    
    console.log('[ButtonPanel] ===== END FIXING TOPICS INDICATOR =====');
  },

  /**
   * Create trash icon SVG
   * @param {string} color - Icon color (green or purple)
   * @returns {string} SVG markup
   */
  createTrashIcon(color) {
    const strokeColor = color === 'green' ? '#16a34a' : '#9527F5';
    return `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 5h14M6.5 5V3.5a1.5 1.5 0 0 1 1.5-1.5h4a1.5 1.5 0 0 1 1.5 1.5V5M15 5v10.5a1.5 1.5 0 0 1-1.5 1.5h-7a1.5 1.5 0 0 1-1.5-1.5V5h10Z" stroke="${strokeColor}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8 9v5M12 9v5" stroke="${strokeColor}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  },

  /**
   * Create AI sparkle icon SVG (solid white, larger and prominent)
   * @returns {string} SVG markup
   */
  createSparkleIcon() {
    return `
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 0L17 8L25 11L17 14L14 22L11 14L3 11L11 8L14 0Z" fill="white"/>
        <path d="M22 16L23.5 20L27.5 21.5L23.5 23L22 27L20.5 23L16.5 21.5L20.5 20L22 16Z" fill="white"/>
        <path d="M8 21L9.5 24.5L13 26L9.5 27.5L8 31L6.5 27.5L3 26L6.5 24.5L8 21Z" fill="white"/>
      </svg>
    `;
  },

  /**
   * Create chat bubble icon SVG - Purple wireframe chatbot agent
   * @returns {string} SVG markup
   */
  createChatIcon() {
    return `
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="4" width="12" height="10" rx="2" stroke="#9527F5" stroke-width="2" fill="none"/>
        <line x1="10" y1="2" x2="10" y2="4" stroke="#9527F5" stroke-width="2" stroke-linecap="round"/>
        <circle cx="10" cy="1.5" r="0.8" fill="#9527F5"/>
        <circle cx="7.5" cy="8.5" r="1.2" fill="#9527F5"/>
        <circle cx="12.5" cy="8.5" r="1.2" fill="#9527F5"/>
        <path d="M7 11C7.5 11.8 8.5 12.5 10 12.5C11.5 12.5 12.5 11.8 13 11" stroke="#9527F5" stroke-width="2" stroke-linecap="round" fill="none"/>
        <path d="M10 14L10 16.5L8 15" stroke="#9527F5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  },

  /**
   * Create upload icon SVG - Purple wireframe
   * @returns {string} SVG markup
   */
  createUploadIcon() {
    return `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 14V6M10 6L7 9M10 6L13 9" stroke="#9527F5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M4 14V16C4 17.1046 4.89543 18 6 18H14C15.1046 18 16 17.1046 16 16V14" stroke="#9527F5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  },

  /**
   * Create processing spinner icon SVG
   * @returns {string} SVG markup
   */
  createProcessingSpinner() {
    return `
      <svg class="vocab-processing-spinner" width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="14" cy="14" r="10" stroke="white" stroke-width="3" stroke-opacity="0.3" fill="none"/>
        <path d="M14 4 A10 10 0 0 1 24 14" stroke="white" stroke-width="3" stroke-linecap="round" fill="none"/>
      </svg>
    `;
  },

  /**
   * Create success check icon SVG
   * @returns {string} SVG markup
   */
  createSuccessCheckIcon() {
    return `
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 14L11 19L22 8" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  },

  /**
   * Create content icon SVG (solid white)
   * @returns {string} SVG markup
   */
  createContentIcon() {
    return `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="5" cy="10" r="1.5" fill="#9527F5"/>
        <circle cx="10" cy="10" r="1.5" fill="#9527F5"/>
        <circle cx="15" cy="10" r="1.5" fill="#9527F5"/>
      </svg>
    `;
  },

  /**
   * Create PDF icon SVG (white)
   * @returns {string} SVG markup
   */
  createPDFIcon() {
    return `
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Document body with folded corner -->
        <path d="M5 2C4.44772 2 4 2.44772 4 3V21C4 21.5523 4.44772 22 5 22H19C19.5523 22 20 21.5523 20 21V8L14 2H5Z" fill="#9527F5"/>
        <!-- Folded corner -->
        <path d="M14 2V7C14 7.55228 14.4477 8 15 8H20L14 2Z" fill="#7c1fd9"/>
        <!-- PDF text -->
        <text x="6" y="14" font-family="Arial, sans-serif" font-size="7" font-weight="900" letter-spacing="0.5" fill="white">PDF</text>
        <!-- Upload arrow -->
        <path d="M17 16V20" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M15 18L17 16L19 18" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  },

  /**
   * Create Image icon SVG (white)
   * @returns {string} SVG markup
   */
  createImageIcon() {
    return `
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Purple rounded rectangle background -->
        <rect x="2" y="4" width="20" height="16" rx="4" fill="#9527F5"/>
        <!-- Purple border frame with rounded corners -->
        <rect x="2" y="4" width="20" height="16" rx="4" stroke="#9527F5" stroke-width="2" fill="none"/>
        <!-- White mountain range with two V-shaped peaks -->
        <path d="M2 18L6 10L10 14L14 8L18 12L22 18V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V18Z" fill="white"/>
        <!-- White sun/circle in top right -->
        <circle cx="18" cy="8" r="2" fill="white"/>
      </svg>
    `;
  },

  /**
   * Create Topics icon SVG (white)
   * @returns {string} SVG markup
   */
  createTopicsIcon() {
    return `
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="distress-filter-topics" x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise"/>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" xChannelSelector="R" yChannelSelector="G"/>
          </filter>
        </defs>
        <text x="18" y="14" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" font-weight="900" fill="#9527F5" filter="url(#distress-filter-topics)">KEY</text>
        <text x="18" y="25" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" font-weight="900" fill="#9527F5" filter="url(#distress-filter-topics)">WORD</text>
      </svg>
    `;
  },

  /**
   * Create Text icon SVG (white)
   * @returns {string} SVG markup
   */
  createTextIcon() {
    return `
      <svg width="36" height="36" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="distress-filter-text" x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise"/>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" xChannelSelector="R" yChannelSelector="G"/>
          </filter>
        </defs>
        <text x="2" y="16" font-family="Arial, sans-serif" font-size="14" font-weight="900" fill="#9527F5" filter="url(#distress-filter-text)">TXT</text>
      </svg>
    `;
  },

  /**
   * Update magic meaning button to show processing state
   */
  setMagicMeaningProcessing() {
    const magicBtn = document.getElementById('magic-meaning');
    if (magicBtn) {
      const iconSpan = magicBtn.querySelector('.vocab-btn-icon');
      if (iconSpan) {
        iconSpan.innerHTML = this.createProcessingSpinner();
      }
      magicBtn.classList.add('processing');
      magicBtn.disabled = true;
      
      // Remove any existing tooltips when state changes
      this.removeAllTooltips();
    }
  },

  /**
   * Update magic meaning button to show success state
   */
  setMagicMeaningSuccess() {
    const magicBtn = document.getElementById('magic-meaning');
    if (magicBtn) {
      const iconSpan = magicBtn.querySelector('.vocab-btn-icon');
      if (iconSpan) {
        iconSpan.innerHTML = this.createSuccessCheckIcon();
      }
      magicBtn.classList.remove('processing');
      magicBtn.classList.add('success');
      // Keep button disabled during success animation
      magicBtn.disabled = true;
      
      // Remove any existing tooltips when state changes
      this.removeAllTooltips();
    }
  },

  /**
   * Reset magic meaning button to its proper state based on selections
   */
  resetMagicMeaningButton() {
    const magicBtn = document.getElementById('magic-meaning');
    if (magicBtn) {
      const iconSpan = magicBtn.querySelector('.vocab-btn-icon');
      if (iconSpan) {
        iconSpan.innerHTML = this.createSparkleIcon();
      }
      magicBtn.classList.remove('processing', 'success');
      
      // Remove any existing tooltips when state changes
      this.removeAllTooltips();
      
      // Update button state based on current selections
      // This will enable the button if there are new selections, or disable it if there aren't
      this.updateButtonStatesFromSelections();
    }
  },

  /**
   * Remove all tooltips from the page
   */
  removeAllTooltips() {
    const tooltips = document.querySelectorAll('.vocab-btn-tooltip');
    tooltips.forEach(tooltip => {
      tooltip.classList.remove('visible');
      tooltip.remove();
    });
  },

  /**
   * Check if all APIs have completed
   */
  checkAPICompletion() {
    if (!this.apiCompletionState.shouldTrack) {
      return;
    }

    console.log('[ButtonPanel] Checking API completion:', this.apiCompletionState);

    if (this.apiCompletionState.simplifyCompleted && this.apiCompletionState.wordsExplanationCompleted) {
      console.log('[ButtonPanel] All APIs completed!');
      
      // Stop tracking
      this.apiCompletionState.shouldTrack = false;

      // Show success state
      this.setMagicMeaningSuccess();

      // Reset button after 2 seconds
      setTimeout(() => {
        this.resetMagicMeaningButton();
      }, 2000);
    }
  },

  /**
   * Inject CSS styles for the button panel
   */
  injectStyles() {
    const styleId = 'vocab-helper-button-panel-styles';
    
    // Check if styles already injected
    if (document.getElementById(styleId)) {
      return;
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Main Panel Container */
      .vocab-helper-panel {
        position: fixed;
        left: 0;
        top: 50%;
        transform: translateY(-50%) translateX(-100%);
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        opacity: 1;
      }

      /* Panel visible state */
      .vocab-helper-panel.visible {
        transform: translateY(-50%) translateX(0);
      }

      /* Wrapper Container - Unified container for button group + drag handle */
      .vocab-wrapper-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0;
        overflow: visible !important;
        border-radius: 100px;
        box-shadow: 0 4px 20px rgba(149, 39, 245, 0.3), 0 2px 8px rgba(149, 39, 245, 0.2);
        background: white;
        transform-origin: center;
      }

      /* Pop-in animation for wrapper container appearing */
      .vocab-wrapper-container.pop-in {
        animation: wrapperContainerPopIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      }

      /* Pop-out animation for wrapper container disappearing */
      .vocab-wrapper-container.pop-out {
        animation: wrapperContainerPopOut 0.3s cubic-bezier(0.6, 0, 0.4, 1) forwards;
      }

      @keyframes wrapperContainerPopIn {
        0% {
          opacity: 0;
          transform: scale(0);
        }
        60% {
          opacity: 1;
          transform: scale(1.1);
        }
        100% {
          opacity: 1;
          transform: scale(1);
        }
      }

      @keyframes wrapperContainerPopOut {
        0% {
          opacity: 1;
          transform: scale(1);
        }
        100% {
          opacity: 0;
          transform: scale(0);
        }
      }

      /* Main Button Group with Purple Shadow */
      .vocab-button-group-main {
        display: none !important;
        flex-direction: column;
        gap: 0;
        background: white;
        padding: 0;
        border-radius: 100px;
        box-shadow: none;
        // border: 1px solid rgba(149, 39, 245, 0.15);
        border: none;
        overflow: visible !important;
      }

      /* Upper Button Group with smooth transitions */
      .vocab-button-group-upper {
        display: flex;
        flex-direction: column;
        gap: 0;
        max-height: 0;
        overflow: hidden;
        opacity: 0;
        transform: scaleY(0);
        transform-origin: top;
        transition: max-height 0.3s ease, opacity 0.3s ease, transform 0.3s ease, margin 0.3s ease, padding 0.3s ease;
        margin-bottom: 0;
        padding: 0;
        background: transparent;
      }
      
      .vocab-button-group-upper.visible {
        max-height: 200px;
        opacity: 1;
        transform: scaleY(1);
        margin-bottom: 0;
        padding: 0;
      }

      /* Lower Button Group (no additional styling) */
      .vocab-button-group-lower {
        display: flex;
        flex-direction: column;
        gap: 0;
        padding: 0;
        transition: gap 0.3s ease;
        overflow: visible;
        background: transparent;
      }

      /* Drag Handle Styles - Semi-circular (bottom half rounded) */
      .vocab-drag-handle {
        display: none !important;
        justify-content: center;
        align-items: center;
        padding: 6px 6px 8px 6px;
        cursor: grab;
        user-select: none;
        border-radius: 0 0 100px 100px;
        background: white;
        width: 46px;
        margin-top: 0;
        box-shadow: none;
        border: none;
      }

      .vocab-drag-handle:hover {
        background: white;
      }

      .vocab-drag-handle:active {
        cursor: grabbing;
        background: white;
      }

      .vocab-drag-handle svg {
        pointer-events: none;
        display: block;
      }

      /* Base Button Styles - Icon Only */
      .vocab-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 12px;
        border-radius: 50%;
        font-size: 11.5px;
        font-weight: 500;
        border: none;
        cursor: pointer;
        transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
        outline: none;
        width: 46px;
        height: 46px;
        max-height: 100px;
        overflow: hidden;
        opacity: 1;
        text-decoration: none;
        margin: 6px;
        flex-shrink: 0;
      }
      
      /* Disable transitions during animations to prevent conflicts */
      .vocab-btn.showing,
      .vocab-btn.hiding {
        transition: none !important;
      }
      
      .vocab-btn.hidden {
        display: none !important;
      }
      
      /* Animation classes for smooth transitions */
      .vocab-btn.hiding {
        animation: buttonSlideOutRight 0.35s cubic-bezier(0.6, 0, 0.4, 1) forwards;
        pointer-events: none !important;
      }

      @keyframes buttonSlideOutRight {
        0% {
          opacity: 1;
          transform: translateX(0) scale(1);
          max-height: 100px;
          margin-top: 0;
          margin-bottom: 0;
        }
        100% {
          opacity: 0;
          transform: translateX(-120px) scale(0.8);
          max-height: 0;
          margin-top: 0;
          margin-bottom: 0;
          padding-top: 0;
          padding-bottom: 0;
        }
      }
      
      .vocab-btn.showing {
        animation: buttonSlideInRight 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      }

      @keyframes buttonSlideInRight {
        0% {
          opacity: 0;
          transform: translateX(-120px) scale(0.8);
          max-height: 0;
          margin-top: 0;
          margin-bottom: 0;
          padding: 0;
        }
        60% {
          opacity: 1;
        }
        100% {
          opacity: 1;
          transform: translateX(0) scale(1);
          max-height: 100px;
          margin-top: 0;
          margin-bottom: 0;
          padding: 12px;
        }
      }

      .vocab-btn:active:not(.hidden) {
        transform: scale(0.95) !important;
      }

      /* Button Icon */
      .vocab-btn-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
      }
      
      .vocab-btn-icon svg {
        width: 22px;
        height: 22px;
      }

      .vocab-btn-text {
        display: none !important;
      }

      /* Green Outline Button - Remove Meanings */
      .vocab-btn-outline-green {
        background: #d1fae5 !important;
        border: none !important;
        color: #16a34a;
      }

      .vocab-btn-outline-green:hover {
        background: #a7f3d0 !important;
        color: #15803d;
        text-decoration: none;
      }

      /* Purple Outline Button */
      .vocab-btn-outline-purple {
        background: white;
        border-color: #9527F5;
        color: #9527F5;
      }

      .vocab-btn-outline-purple:hover {
        background: #f0e6ff;
        border-color: #7a1fd9;
        color: #7a1fd9;
        text-decoration: none;
      }

      /* Solid Purple Button */
      .vocab-btn-solid-purple {
        background: #9527F5;
        border-color: #9527F5;
        color: white;
      }

      .vocab-btn-solid-purple:hover:not(.disabled) {
        background: #7a1fd9;
        border-color: #7a1fd9;
        text-decoration: none;
      }

      /* Import Content Button - Light Purple BG with Upload Icon */
      #import-content {
        background: #ede5ff !important;
        border: none !important;
        border-color: transparent !important;
        outline: none !important;
        box-shadow: none !important;
      }

      #import-content:hover {
        background: #ddc8ff !important;
        border: none !important;
        border-color: transparent !important;
        outline: none !important;
        box-shadow: none !important;
      }
      
      /* Ask Anything Button - Light Purple BG with Purple Wireframe Icon */
      #ask {
        background: #ede5ff !important;
        border: none !important;
        padding: 8px 12px !important;
      }

      #ask:hover:not(.disabled) {
        background: #ddc8ff !important;
      }

      /* Magic Meaning Button - VIBGYOROYGBIV Flowing Gradient when enabled */
      /* Magic meaning button - solid purple when enabled with breathing animation */
      #magic-meaning:not(.disabled) {
        background: #9527F5 !important;
        border-color: #9527F5 !important;
        color: white !important;
        animation: magicMeaningBreathing 2s ease-in-out infinite !important;
      }
      
      #magic-meaning:hover:not(.disabled) {
        background: #7a1fd9 !important;
        border-color: #7a1fd9 !important;
      }

      @keyframes magicMeaningBreathing {
        0%, 100% {
          transform: scale(1);
          box-shadow: 0 2px 8px rgba(149, 39, 245, 0.3);
        }
        50% {
          transform: scale(1.05);
          box-shadow: 0 4px 16px rgba(149, 39, 245, 0.5), 0 0 20px rgba(149, 39, 245, 0.3);
        }
      }

      /* Disabled Button State */
      .vocab-btn.disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .vocab-btn-solid-purple.disabled {
        background: #c5aee3;
        border-color: #c5aee3;
        opacity: 1;
      }

      .vocab-btn-solid-purple.disabled:hover {
        background: #c5aee3;
        border-color: #c5aee3;
      }

      .vocab-btn-solid-purple.disabled .vocab-btn-icon svg {
        opacity: 0.7;
      }

      .vocab-btn-solid-purple.disabled .vocab-btn-text {
        opacity: 0.85;
      }

      /* Allow hover events on disabled buttons for tooltips */
      .vocab-btn.disabled {
        pointer-events: auto; /* Allow hover events on the button itself */
      }
      
      .vocab-btn.disabled * {
        pointer-events: none; /* But disable pointer events on child elements */
      }
      
      /* Allow tooltips to be visible on disabled buttons */
      .vocab-btn.disabled .vocab-btn-tooltip {
        pointer-events: auto;
      }

      /* Tooltip Styles */
      .vocab-btn-tooltip {
        position: fixed !important;
        background: white !important;
        color: #b29cfb !important;
        padding: 10px 20px !important;
        border-radius: 20px !important;
        font-size: 13px !important;
        font-weight: 500 !important;
        white-space: nowrap !important;
        text-align: center !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif !important;
        box-shadow: 0 0 20px rgba(178, 156, 251, 0.3), 0 4px 12px rgba(178, 156, 251, 0.2) !important;
        z-index: 9999999 !important;
        pointer-events: none !important;
        opacity: 0 !important;
        transform: translateY(5px) scale(0.95) !important;
        transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), 
                   transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        visibility: visible !important;
        width: auto !important;
        height: auto !important;
        min-height: 40px !important;
      }

      .vocab-btn-tooltip.visible {
        opacity: 1 !important;
        transform: translateY(0) scale(1) !important;
      }

      /* Tooltip arrow */
      .vocab-btn-tooltip::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 20px;
        border: 6px solid transparent;
        border-top-color: white;
        filter: drop-shadow(0 2px 3px rgba(167, 139, 250, 0.2));
      }

      /* Button container needs relative positioning for tooltip */
      .vocab-btn {
        position: relative;
      }

      /* Responsive adjustments */
      @media (max-width: 768px) {
        .vocab-helper-panel {
          left: 0;
        }

        .vocab-button-group-main {
          display: none !important;
          padding: 4px;
        }

        .vocab-btn {
          width: 40px;
          height: 40px;
          padding: 10px;
        }

        .vocab-btn-icon {
          width: 18px;
          height: 18px;
        }
        
        .vocab-btn-icon svg {
          width: 18px;
          height: 18px;
        }
      }

      /* Vertical Button Group Styles */
      .vocab-vertical-button-group {
        position: absolute;
        left: 100%;
        top: 50%;
        transform: translateY(-50%) translateX(4px);
        display: flex;
        flex-direction: column;
        gap: 6px;
        background: transparent;
        padding: 0;
        border-radius: 0;
        box-shadow: none;
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 1000000;
        min-width: auto;
      }

      .vocab-vertical-button-group.visible {
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
        transform: translateY(-50%) translateX(8px);
      }


      .vocab-vertical-btn {
        position: relative;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        padding: 4px;
        background: white;
        border: 2px solid #9527F5;
        border-radius: 12px;
        color: #9527F5;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s ease;
        width: 44px;
        height: 44px;
      }

      .vocab-vertical-btn:hover {
        background: #ede5ff;
        border-color: #7c1fd9;
      }

      .vocab-vertical-btn:active {
        background: #ddc8ff;
        border-color: #7c1fd9;
        transform: scale(0.95);
      }

      .vocab-vertical-btn-icon {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      
      .vocab-vertical-btn-icon svg {
        width: 36px;
        height: 36px;
      }

      .vocab-vertical-btn-text {
        display: none;
      }

      /* Content indicator styles */
      .vocab-content-indicator {
        position: absolute;
        top: 6px;
        right: 6px;
        width: 8px;
        height: 8px;
        background-color: #16a34a;
        border-radius: 50%;
        display: none;
        z-index: 10;
        border: 1px solid white;
      }


      /* Responsive adjustments for vertical button group */
      @media (max-width: 768px) {
        .vocab-vertical-button-group {
          left: 100%;
          transform: translateY(-50%) translateX(12px);
          padding: 0;
          gap: 4px;
          flex-direction: column;
        }

        .vocab-vertical-button-group.visible {
          transform: translateY(-50%) translateX(15px);
        }

        .vocab-vertical-btn {
          padding: 3px;
          width: 36px;
          height: 36px;
        }

        .vocab-vertical-btn-icon {
          width: 30px;
          height: 30px;
        }
        
        .vocab-vertical-btn-icon svg {
          width: 30px;
          height: 30px;
        }

        /* Adjust content indicator size for mobile */
        .vocab-content-indicator {
          width: 6px;
          height: 6px;
          top: 4px;
          right: 4px;
        }
      }

      /* Topics Modal Styles */
      .vocab-topics-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1000000;
        display: flex;
        justify-content: center;
        align-items: center;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
        font-family: 'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }

      .vocab-topics-modal-overlay.visible {
        opacity: 1;
        visibility: visible;
      }

      .vocab-topics-modal {
        background: white;
        border-radius: 20px;
        box-shadow: 0 25px 50px rgba(162, 78, 255, 0.25), 0 0 0 1px rgba(162, 78, 255, 0.1);
        padding: 20px;
        max-width: 700px;
        width: 90%;
        max-height: 80vh;
        overflow: hidden;
        transform: scale(0.9) translateY(20px);
        opacity: 0;
        visibility: hidden;
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        position: relative;
      }

      .vocab-topics-content-container {
        background: #F8F4FF;
        border-radius: 16px;
        padding: 20px;
        margin-top: 20px;
        max-height: calc(80vh - 120px);
        overflow-y: auto;
      }

      .vocab-topics-modal.visible {
        transform: scale(1) translateY(0);
        opacity: 1;
        visibility: visible;
      }

      .vocab-topics-modal-header {
        position: relative;
        margin: 20px 0 30px 0;
        text-align: center;
      }

      .vocab-topics-modal-title {
        font-size: 28px;
        font-weight: 400;
        color: #9B6EDA;
        margin: 0;
        text-align: center;
      }

      .vocab-topics-modal-close {
        position: absolute;
        top: 4px;
        right: 4px;
        background: none;
        border: none;
        color: #9B6EDA;
        font-size: 32px;
        font-weight: 200;
        cursor: pointer;
        width: 56px;
        height: 56px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.2s ease, transform 0.2s ease;
        border-radius: 50%;
        padding: 0;
        z-index: 10;
      }

      .vocab-topics-modal-close:hover {
        color: #7A5BC7;
        transform: scale(1.2);
      }

      .vocab-topics-modal-close svg {
        width: 24px;
        height: 24px;
        stroke-width: 1.5;
      }


      /* First Container - Input */
      .vocab-topics-first-container {
        margin-bottom: 25px;
      }

      .vocab-topics-input-section {
        width: 70%;
        margin: 0 auto;
      }

      .vocab-topics-input-container {
        position: relative;
      }

      .vocab-topics-generate-btn {
        background: #A24EFF;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 15px;
        font-size: 20px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s ease, transform 0.2s ease;
        font-family: inherit;
        white-space: nowrap;
        min-width: 150px;
        margin: 15px auto 0;
        display: block;
      }

      .vocab-topics-generate-btn:hover {
        background: #7A5BC7;
        transform: scale(1.05);
      }

      .vocab-topics-generate-btn:active {
        background: #7A5BC7;
      }

      /* Second Container - Topic Tags + Controls */
      .vocab-topics-second-container {
        display: flex;
        gap: 20px;
        align-items: stretch;
      }

      .vocab-topics-tags-section {
        flex: 2;
      }

      .vocab-topics-controls-section {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 35px;
        justify-content: center;
      }

      .vocab-topics-input {
        width: 100%;
        padding: 8px 45px 8px 16px;
        border: 2px solid #E6D6FF;
        border-radius: 25px;
        font-size: 16px;
        background: white;
        color: #333;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
        box-sizing: border-box;
        font-family: inherit;
        text-align: center;
      }

      .vocab-topics-input:focus {
        outline: none;
        border-color: #A24EFF;
        box-shadow: 0 0 0 3px rgba(162, 78, 255, 0.1);
      }

      .vocab-topics-input::placeholder {
        color: #B19CD9;
        font-style: italic;
        font-weight: 300;
      }

      .vocab-topics-search-icon {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: #A24EFF;
        cursor: pointer;
        transition: background-color 0.2s ease, opacity 0.2s ease;
        background: #A24EFF;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .vocab-topics-search-icon:hover:not(.disabled) {
        background: #8B3AE8;
      }

      .vocab-topics-search-icon.disabled {
        background: #c5aee3;
        cursor: pointer;
        opacity: 0.6;
      }

      .vocab-topics-tags-container {
        margin-bottom: 15px;
        height: 200px;
        border: 2px solid #E6D6FF;
        border-radius: 16px;
        padding: 12px;
        background: white;
        flex: 2;
        overflow-y: auto;
      }


      .vocab-topics-second-container {
        transition: opacity 0.3s ease, transform 0.3s ease;
        opacity: 1;
        transform: translateY(0);
      }

      .vocab-topics-second-container.hidden {
        display: none;
        opacity: 0;
        transform: translateY(-10px);
        pointer-events: none;
      }

      .vocab-topics-generate-btn.hidden {
        display: none;
        opacity: 0;
        transform: translateY(-10px);
        pointer-events: none;
      }

      .vocab-topics-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        min-height: 36px;
      }

      .vocab-topics-tag {
        background: #E6D6FF;
        color: #A24EFF;
        padding: 2px 6px 2px 12px;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 3px;
        animation: slideIn 0.3s ease;
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .vocab-topics-tag-remove {
        background: none;
        border: none;
        color: #A24EFF;
        cursor: pointer;
        font-size: 18px;
        font-weight: 400;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s ease, transform 0.2s ease;
      }

      .vocab-topics-tag-remove:hover {
        background-color: rgba(162, 78, 255, 0.1);
      }

      .vocab-topics-control-group {
        display: flex;
        flex-direction: column;
        gap: 12px;
        justify-content: center;
      }

      .vocab-topics-word-count-group {
        display: flex;
        flex-direction: column;
        gap: 12px;
        justify-content: center;
        align-items: center;
      }

      .vocab-topics-difficulty-group {
        display: flex;
        flex-direction: column;
        gap: 12px;
        justify-content: center;
        align-items: center;
      }

      .vocab-topics-control-label {
        font-size: 20px;
        font-weight: 500;
        color: #9B6EDA;
        margin: 0;
        font-family: inherit;
      }

      .vocab-topics-word-count-buttons {
        display: flex;
        background: white;
        border: 1px solid #E6D6FF;
        border-radius: 12px;
        padding: 2px;
        position: relative;
        width: fit-content;
        align-items: center;
      }

      .vocab-topics-word-count-slider {
        position: absolute;
        top: 2px;
        left: 2px;
        height: calc(100% - 4px);
        background: #9B6EDA;
        border-radius: 10px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 1;
      }

      .vocab-topics-word-count-btn {
        padding: 8px 20px;
        border: none;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 500;
        color: #9B6EDA;
        cursor: pointer;
        background: white;
        font-family: inherit;
        position: relative;
        z-index: 2;
        min-width: 70px;
        text-align: center;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s ease, transform 0.2s ease;
      }

      .vocab-topics-word-count-btn:hover {
        background-color: rgba(155, 110, 218, 0.1);
      }

      .vocab-topics-word-count-btn:active {
        transform: scale(0.95);
      }

      .vocab-topics-word-count-btn.selected {
        color: white;
        background: transparent;
      }

      .vocab-topics-difficulty-buttons {
        display: flex;
        background: white;
        border: 1px solid #E6D6FF;
        border-radius: 12px;
        padding: 2px;
        position: relative;
        width: fit-content;
        align-items: center;
      }

      .vocab-topics-difficulty-slider {
        position: absolute;
        top: 2px;
        left: 2px;
        height: calc(100% - 4px);
        background: #9B6EDA;
        border-radius: 10px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 1;
      }

      .vocab-topics-difficulty-btn {
        padding: 8px 20px;
        border: none;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        background: white;
        font-family: inherit;
        position: relative;
        z-index: 2;
        min-width: 70px;
        text-align: center;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s ease, transform 0.2s ease;
      }

      .vocab-topics-difficulty-btn:hover {
        background-color: rgba(155, 110, 218, 0.1);
      }

      .vocab-topics-difficulty-btn:active {
        transform: scale(0.95);
      }

      .vocab-topics-difficulty-btn.easy {
        color: #36D86B;
      }

      .vocab-topics-difficulty-btn.medium {
        color: #F9D43F;
      }

      .vocab-topics-difficulty-btn.hard {
        color: #FF4D4D;
      }

      .vocab-topics-difficulty-btn.selected {
        color: white;
        background: transparent;
      }

      .vocab-topics-difficulty-btn.easy.selected ~ .vocab-topics-difficulty-slider {
        background: #36D86B;
      }

      .vocab-topics-difficulty-btn.medium.selected ~ .vocab-topics-difficulty-slider {
        background: #F9D43F;
      }

      .vocab-topics-difficulty-btn.hard.selected ~ .vocab-topics-difficulty-slider {
        background: #FF4D4D;
      }

      /* Responsive Design */
      @media (max-width: 768px) {
        .vocab-topics-modal {
          padding: 30px;
          margin: 20px;
          width: calc(100% - 40px);
          max-width: 650px;
        }

        .vocab-topics-modal-title {
          font-size: 24px;
        }

        .vocab-topics-first-container {
          margin-bottom: 20px;
        }

        .vocab-topics-input-section {
          width: 80%;
        }

        .vocab-topics-second-container {
          flex-direction: column;
          gap: 20px;
        }

        .vocab-topics-tags-container {
          height: 150px;
          margin-bottom: 15px;
        }

        .vocab-topics-input {
          font-size: 16px;
          padding: 14px 45px 14px 14px;
        }

        .vocab-topics-difficulty-buttons {
          flex-direction: column;
        }

        .vocab-topics-difficulty-btn {
          flex: none;
        }

        .vocab-topics-word-count-buttons {
          width: 100%;
        }

        .vocab-topics-difficulty-buttons {
          width: 100%;
        }
      }

      @media (max-width: 480px) {
        .vocab-topics-modal {
          padding: 25px;
          margin: 15px;
          width: calc(100% - 30px);
          max-width: 600px;
        }

        .vocab-topics-modal-title {
          font-size: 22px;
        }

        .vocab-topics-generate-btn {
          padding: 14px 24px;
          font-size: 16px;
          min-width: auto;
          width: 100%;
          margin: 10px auto 0;
        }

        .vocab-topics-input-section {
          width: 85%;
        }

        .vocab-topics-tags-container {
          height: 120px;
          margin-bottom: 10px;
        }
      }

      /* Image Upload Modal Styles */
      .vocab-image-upload-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000000;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
        padding: 20px;
        box-sizing: border-box;
      }

      .vocab-image-upload-overlay.visible {
        opacity: 1;
        visibility: visible;
      }

      .vocab-image-upload-overlay.drag-over {
        background: rgba(149, 39, 245, 0.1);
      }

      .vocab-image-upload-modal {
        background: white;
        border-radius: 40px;
        padding: 0;
        width: 90%;
        max-width: 800px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 25px 50px rgba(149, 39, 245, 0.25), 0 0 0 1px rgba(149, 39, 245, 0.1);
        transform: scale(0.9) translateY(20px);
        opacity: 0;
        visibility: hidden;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease, visibility 0.3s ease;
        font-family: 'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }

      .vocab-image-upload-modal.visible {
        transform: scale(1) translateY(0);
        opacity: 1;
        visibility: visible;
      }

      @keyframes modalSlideIn {
        0% {
          opacity: 0;
          transform: scale(0.9) translateY(-20px);
        }
        100% {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }

      .vocab-image-upload-header {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px 24px 15px 24px;
        position: relative;
      }

      .vocab-image-upload-title {
        font-size: 24px;
        font-weight: 500;
        color: #9B6EDA;
        margin: 0;
        padding: 0;
        line-height: 1.2;
      }

      .vocab-image-upload-close {
        position: absolute;
        right: 20px;
        top: 20px;
        background: none;
        border: none;
        color: #A24EFF;
        cursor: pointer;
        padding: 8px;
        border-radius: 8px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .vocab-image-upload-close:hover {
        transform: scale(1.2);
      }

      .vocab-image-upload-content {
        padding: 0 24px 24px 24px;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
      }

      .vocab-image-upload-content-container {
        background: #FCF8FF;
        border: 2px dashed rgba(162, 78, 255, 0.4);
        border-radius: 30px;
        padding: 30px 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 24px;
        width: calc(100% - 80px);
        margin: 10px 40px 5px 40px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .vocab-image-upload-content-container:hover {
        border-color: rgba(162, 78, 255, 0.6);
        transform: scale(1.02);
      }

      .vocab-image-upload-icon {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100px;
        height: 100px;
        background: transparent;
        border-radius: 50%;
        transition: all 0.3s ease;
      }

      .vocab-image-upload-icon:hover {
        background: transparent;
        transform: scale(1.05);
      }

      .vocab-image-upload-plus {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 24px;
        font-weight: 700;
        color: #9527F5;
        pointer-events: none;
      }

      .vocab-image-upload-instructions {
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-width: 400px;
      }

      .vocab-image-upload-main-text {
        font-size: 18px;
        font-weight: 600;
        color: #666;
        margin: 0;
        line-height: 1.4;
      }

      .vocab-image-upload-format-text {
        font-size: 16px;
        font-weight: 400;
        color: #888;
        margin: 0;
        line-height: 1.4;
      }

      .vocab-image-upload-secondary-text {
        font-size: 14px;
        color: #666;
        margin: 0;
        line-height: 1.5;
      }

      .vocab-image-upload-size-text {
        font-size: 13px;
        color: #999;
        margin: 0;
        font-weight: 500;
      }

      .vocab-image-upload-browse-btn {
        background: #A24EFF;
        color: white;
        border: none;
        border-radius: 15px;
        padding: 12px 24px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        min-width: 150px;
        margin: 15px auto 0;
        display: block;
      }

      .vocab-image-upload-browse-btn:hover {
        background: #7A5BC7;
        transform: scale(1.05);
      }

      .vocab-image-upload-browse-btn:active {
        background: #7A5BC7;
        transform: scale(0.95);
      }

      /* Responsive Design */
      @media (max-width: 768px) {
        .vocab-image-upload-modal {
          width: 95%;
          margin: 20px;
        }

        .vocab-image-upload-title {
          font-size: 20px;
        }

        .vocab-image-upload-content {
          padding: 0 20px 20px 20px;
          gap: 16px;
        }

        .vocab-image-upload-content-container {
          padding: 24px 20px;
          gap: 20px;
          width: calc(100% - 60px);
          margin: 30px 30px 5px 30px;
        }

        .vocab-image-upload-icon {
          width: 80px;
          height: 80px;
        }

        .vocab-image-upload-plus {
          font-size: 20px;
        }

        .vocab-image-upload-main-text {
          font-size: 16px;
        }

        .vocab-image-upload-secondary-text {
          font-size: 13px;
        }

        .vocab-image-upload-browse-btn {
          padding: 12px 24px;
          font-size: 15px;
        }
      }

      @media (max-width: 480px) {
        .vocab-image-upload-overlay {
          padding: 10px;
        }

        .vocab-image-upload-modal {
          width: 98%;
          margin: 10px;
        }

        .vocab-image-upload-header {
          padding: 20px 20px 12px 20px;
        }

        .vocab-image-upload-title {
          font-size: 18px;
        }

        .vocab-image-upload-content {
          padding: 0 16px 16px 16px;
          gap: 14px;
        }

        .vocab-image-upload-content-container {
          padding: 20px 16px;
          gap: 18px;
          width: calc(100% - 40px);
          margin: 20px 20px 5px 20px;
        }

        .vocab-image-upload-icon {
          width: 70px;
          height: 70px;
        }

        .vocab-image-upload-plus {
          font-size: 18px;
        }

        .vocab-image-upload-main-text {
          font-size: 15px;
        }

        .vocab-image-upload-secondary-text {
          font-size: 12px;
        }

        .vocab-image-upload-size-text {
          font-size: 11px;
        }

        .vocab-image-upload-browse-btn {
          padding: 10px 20px;
          font-size: 14px;
          min-width: 100px;
        }
      }

      /* PDF Upload Modal Styles */
      .vocab-pdf-upload-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000000;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
        padding: 20px;
        box-sizing: border-box;
      }

      .vocab-pdf-upload-overlay.visible {
        opacity: 1;
        visibility: visible;
      }

      .vocab-pdf-upload-overlay.drag-over {
        background: rgba(149, 39, 245, 0.1);
      }

      .vocab-pdf-upload-modal {
        background: white;
        border-radius: 40px;
        padding: 0;
        width: 90%;
        max-width: 800px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 25px 50px rgba(149, 39, 245, 0.25), 0 0 0 1px rgba(149, 39, 245, 0.1);
        transform: scale(0.9) translateY(20px);
        opacity: 0;
        visibility: hidden;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease, visibility 0.3s ease;
        font-family: 'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }

      .vocab-pdf-upload-modal.visible {
        transform: scale(1) translateY(0);
        opacity: 1;
        visibility: visible;
      }

      .vocab-pdf-upload-header {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px 24px 15px 24px;
        position: relative;
      }

      .vocab-pdf-upload-title {
        font-size: 24px;
        font-weight: 500;
        color: #9B6EDA;
        margin: 0;
        padding: 0;
        text-align: center;
      }

      .vocab-pdf-upload-close {
        position: absolute;
        right: 20px;
        top: 20px;
        background: none;
        border: none;
        color: #A24EFF;
        cursor: pointer;
        padding: 8px;
        border-radius: 8px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .vocab-pdf-upload-close:hover {
        transform: scale(1.2);
      }

      .vocab-pdf-upload-close svg {
        width: 24px;
        height: 24px;
        stroke-width: 1.5;
      }

      .vocab-pdf-upload-content {
        padding: 0 24px 24px 24px;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
      }

      .vocab-pdf-upload-content-container {
        background: #FCF8FF;
        border: 2px dashed rgba(162, 78, 255, 0.4);
        border-radius: 30px;
        padding: 30px 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 24px;
        width: calc(100% - 80px);
        margin: 10px 40px 5px 40px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .vocab-pdf-upload-content-container:hover {
        border-color: rgba(162, 78, 255, 0.6);
        transform: scale(1.02);
      }

      .vocab-pdf-upload-icon {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 120px;
        height: 120px;
        background: transparent;
        border-radius: 50%;
        transition: all 0.3s ease;
      }

      .vocab-pdf-upload-icon:hover {
        background: transparent;
        transform: scale(1.05);
      }

      .vocab-pdf-upload-plus {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 24px;
        color: #9527F5;
        font-weight: bold;
        pointer-events: none;
      }

      .vocab-pdf-upload-instructions {
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-items: center;
      }

      .vocab-pdf-upload-main-text {
        font-size: 18px;
        color: #333;
        margin: 0;
        font-weight: 500;
      }

      .vocab-pdf-upload-secondary-text {
        font-size: 14px;
        color: #666;
        margin: 0;
        line-height: 1.5;
      }

      .vocab-pdf-upload-size-text {
        font-size: 13px;
        color: #999;
        margin: 0;
        font-weight: 500;
      }

      .vocab-pdf-upload-browse-btn {
        background: #A24EFF;
        color: white;
        border: none;
        border-radius: 15px;
        padding: 12px 24px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        min-width: 150px;
        margin: 15px auto 0;
        display: block;
      }

      .vocab-pdf-upload-browse-btn:hover {
        background: #7A5BC7;
        transform: scale(1.05);
      }

      .vocab-pdf-upload-browse-btn:active {
        background: #7A5BC7;
        transform: scale(0.95);
      }

      /* Responsive styles for PDF upload modal */
      @media (max-width: 768px) {
        .vocab-pdf-upload-modal {
          width: 95%;
          margin: 20px;
        }

        .vocab-pdf-upload-title {
          font-size: 20px;
        }

        .vocab-pdf-upload-content {
          padding: 0 20px 20px 20px;
          gap: 16px;
        }

        .vocab-pdf-upload-content-container {
          padding: 24px 20px;
          gap: 20px;
          width: calc(100% - 60px);
          margin: 30px 30px 5px 30px;
        }

        .vocab-pdf-upload-icon {
          width: 100px;
          height: 100px;
        }

        .vocab-pdf-upload-plus {
          font-size: 20px;
        }

        .vocab-pdf-upload-main-text {
          font-size: 16px;
        }

        .vocab-pdf-upload-secondary-text {
          font-size: 13px;
        }

        .vocab-pdf-upload-size-text {
          font-size: 11px;
        }

        .vocab-pdf-upload-browse-btn {
          padding: 12px 24px;
          font-size: 15px;
        }
      }

      @media (max-width: 480px) {
        .vocab-pdf-upload-modal {
          width: 98%;
          margin: 10px;
        }

        .vocab-pdf-upload-header {
          padding: 20px 20px 12px 20px;
        }

        .vocab-pdf-upload-title {
          font-size: 18px;
        }

        .vocab-pdf-upload-content {
          padding: 0 16px 16px 16px;
          gap: 14px;
        }

        .vocab-pdf-upload-content-container {
          padding: 20px 16px;
          gap: 18px;
          width: calc(100% - 40px);
          margin: 20px 20px 5px 20px;
        }

        .vocab-pdf-upload-icon {
          width: 90px;
          height: 90px;
        }

        .vocab-pdf-upload-plus {
          font-size: 18px;
        }

        .vocab-pdf-upload-main-text {
          font-size: 15px;
        }

        .vocab-pdf-upload-secondary-text {
          font-size: 12px;
        }

        .vocab-pdf-upload-size-text {
          font-size: 11px;
        }

        .vocab-pdf-upload-browse-btn {
          padding: 10px 20px;
          font-size: 14px;
          min-width: 100px;
        }
      }

      /* Text Input Modal Styles */
      .vocab-text-input-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000001;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        padding: 20px;
        box-sizing: border-box;
      }

      .vocab-text-input-overlay.visible {
        opacity: 1;
        visibility: visible;
      }

      .vocab-text-input-modal {
        background: white;
        border-radius: 20px;
        padding: 0;
        width: 90%;
        max-width: 800px;
        max-height: 80vh;
        transform: scale(0.9) translateY(20px);
        opacity: 0;
        visibility: hidden;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease, visibility 0.3s ease;
        font-family: 'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .vocab-text-input-modal.visible {
        transform: scale(1) translateY(0);
        opacity: 1;
        visibility: visible;
      }

      .vocab-text-input-header {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 30px 40px 20px 40px;
        position: relative;
        border-bottom: 1px solid #f0f0f0;
      }

      .vocab-text-input-title {
        font-size: 28px;
        font-weight: 400;
        color: #9B6EDA;
        margin: 0;
        text-align: center;
      }

      .vocab-text-input-close {
        position: absolute;
        right: 20px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        cursor: pointer;
        padding: 8px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #A24EFF;
        transition: all 0.2s ease;
      }

      .vocab-text-input-close:hover {
        background: #f5f5f5;
        color: #7A5BC7;
        transform: translateY(-50%) scale(1.2);
      }

      .vocab-text-input-close svg {
        width: 20px;
        height: 20px;
      }

      .vocab-text-input-search {
        display: flex;
        justify-content: center;
        padding: 20px 40px;
        transition: opacity 0.3s ease, max-height 0.3s ease;
      }

      .vocab-text-input-search.hidden {
        display: none;
      }

      .vocab-text-input-search-input {
        width: 400px;
        padding: 8px 20px;
        border: 1px solid #D1B3FF;
        border-radius: 25px;
        font-size: 16px;
        font-family: 'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        outline: none;
        transition: border-color 0.2s ease;
        box-sizing: border-box;
        text-align: center;
      }

      .vocab-text-input-search-input:focus {
        border-color: #A24EFF;
      }

      .vocab-text-input-content {
        padding: 20px 40px 10px 40px;
        flex: 1;
        display: flex;
        flex-direction: column;
        transition: padding 0.3s ease;
      }

      .vocab-text-input-content.empty {
        padding-bottom: 40px;
      }

      .vocab-text-input-textarea {
        width: 100%;
        min-height: 200px;
        max-height: 400px;
        padding: 20px;
        border: 1px solid #D1B3FF;
        border-radius: 20px;
        font-size: 16px;
        font-family: 'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        line-height: 1.5;
        resize: none;
        outline: none;
        transition: border-color 0.2s ease;
        box-sizing: border-box;
        overflow-y: auto;
        white-space: pre-wrap;
        word-wrap: break-word;
      }

      .vocab-text-input-textarea:focus {
        border-color: #A24EFF;
      }

      .vocab-text-input-textarea::placeholder {
        color: #999;
      }

      .vocab-text-input-textarea:empty:before {
        content: attr(data-placeholder);
        color: #999;
        pointer-events: none;
      }

      .vocab-text-input-textarea .vocab-search-highlight {
        background: linear-gradient(120deg, #FFE066 0%, #FFD700 100%);
        padding: 2px 4px;
        border-radius: 4px;
        font-weight: 600;
        box-shadow: 0 2px 4px rgba(255, 224, 102, 0.3);
      }

      /* Custom scrollbar for textarea */
      .vocab-text-input-textarea::-webkit-scrollbar {
        width: 8px;
      }

      .vocab-text-input-textarea::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
      }

      .vocab-text-input-textarea::-webkit-scrollbar-thumb {
        background: #D1B3FF;
        border-radius: 4px;
      }

      .vocab-text-input-textarea::-webkit-scrollbar-thumb:hover {
        background: #A24EFF;
      }

      .vocab-text-input-textarea-container {
        position: relative;
        width: 100%;
      }

      .vocab-text-input-proceed-btn {
        background: #A24EFF;
        color: white;
        border: none;
        border-radius: 20px;
        padding: 16px 32px;
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s ease;
        align-self: center;
        margin: 10px 0 20px 0;
        min-width: 120px;
      }

      .vocab-text-input-proceed-btn.hidden {
        display: none;
      }

      .vocab-text-input-proceed-btn:hover {
        background: #7A5BC7;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(162, 78, 255, 0.3);
      }

      .vocab-text-input-proceed-btn:active {
        transform: translateY(0);
      }

      /* Responsive Design for Text Input Modal */
      @media (max-width: 768px) {
        .vocab-text-input-modal {
          width: 95%;
          margin: 20px;
        }

        .vocab-text-input-title {
          font-size: 20px;
        }

        .vocab-text-input-header {
          padding: 20px 30px 15px 30px;
        }

        .vocab-text-input-search {
          padding: 15px 30px;
        }

        .vocab-text-input-search-input {
          width: 350px;
          padding: 6px 16px;
          font-size: 15px;
        }

        .vocab-text-input-content {
          padding: 15px 30px 5px 30px;
        }

        .vocab-text-input-textarea {
          min-height: 150px;
          max-height: 300px;
          font-size: 15px;
        }

        .vocab-text-input-proceed-btn {
          padding: 14px 28px;
          font-size: 15px;
          margin: 10px 0 20px 0;
        }
      }

      @media (max-width: 480px) {
        .vocab-text-input-overlay {
          padding: 10px;
        }

        .vocab-text-input-modal {
          width: 98%;
          margin: 10px;
        }

        .vocab-text-input-header {
          padding: 15px 20px 10px 20px;
        }

        .vocab-text-input-title {
          font-size: 18px;
        }

        .vocab-text-input-search {
          padding: 10px 20px;
        }

        .vocab-text-input-search-input {
          width: 280px;
          padding: 6px 14px;
          font-size: 14px;
        }

        .vocab-text-input-content {
          padding: 10px 20px 5px 20px;
        }

        .vocab-text-input-textarea {
          min-height: 120px;
          max-height: 250px;
          font-size: 14px;
        }

        .vocab-text-input-proceed-btn {
          padding: 12px 24px;
          font-size: 14px;
          margin: 10px 0 15px 0;
        }
      }

      /* ===================================
         Processing Spinner Animation
         =================================== */
      .vocab-processing-spinner {
        animation: vocab-spin 1s linear infinite;
      }

      @keyframes vocab-spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      /* ===================================
         Magic Meaning Button States
         =================================== */
      .vocab-btn.processing {
        pointer-events: none;
        opacity: 1;
      }

      .vocab-btn.success {
        background: #22c55e !important;
        border-color: #22c55e !important;
      }

      .vocab-btn.success:hover {
        background: #16a34a !important;
        border-color: #16a34a !important;
      }

      /* Magic Meaning Button - Ready/Enabled State Animation */
      #magic-meaning:not(.disabled):not(.processing):not(.success) {
        position: relative;
        overflow: hidden;
        isolation: isolate;
      }

      /* Attention-grabbing animation when button becomes enabled */


    `;

    document.head.appendChild(style);
  },

  /**
   * Attach event listeners to buttons
   */
  attachEventListeners() {
    const buttons = {
      magicMeaning: document.getElementById('magic-meaning'),
      ask: document.getElementById('ask'),
      importContent: document.getElementById('import-content')
    };

    // Magic meaning button
    buttons.magicMeaning?.addEventListener('click', (e) => {
      if (buttons.magicMeaning.classList.contains('disabled')) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      console.log('Magic meaning clicked');
      this.handleMagicMeaning();
    });

    // Ask button
    buttons.ask?.addEventListener('click', (e) => {
      if (buttons.ask.classList.contains('disabled')) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      console.log('Ask clicked');
      this.handleAsk();
    });

    // Import content button
    buttons.importContent?.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent event from bubbling up
      console.log('Import content clicked');
      this.toggleVerticalButtonGroup();
    });

    // Add event listeners for vertical button group buttons
    const pdfBtn = document.getElementById('vocab-pdf-btn');
    const imageBtn = document.getElementById('vocab-image-btn');
    const topicsBtn = document.getElementById('vocab-topics-btn');
    const textBtn = document.getElementById('vocab-text-btn');
    
    console.log('Button elements found:');
    console.log('PDF button:', pdfBtn);
    console.log('Image button:', imageBtn);
    console.log('Topics button:', topicsBtn);
    console.log('Text button:', textBtn);

    pdfBtn?.addEventListener('click', () => {
      console.log('PDF button clicked');
      this.handlePDFButton();
    });

    imageBtn?.addEventListener('click', () => {
      console.log('Image button clicked');
      this.handleImageButton();
    });

    topicsBtn?.addEventListener('click', (e) => {
      console.log('Topics button clicked');
      this.handleTopicsButton();
    });

    textBtn?.addEventListener('click', (e) => {
      console.log('Text button clicked');
      this.handleTextButton();
    });

    // Prevent clicks inside vertical button group from closing it
    this.verticalButtonGroup?.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Add tooltip event listeners
    
    if (buttons.magicMeaning) {
      console.log('[ButtonPanel] Attaching tooltip to Magic meaning button');
      this.attachTooltipListeners(buttons.magicMeaning, 'magic-meaning');
    } else {
      console.warn('[ButtonPanel] Magic meaning button not found');
    }
    
    if (buttons.ask) {
      console.log('[ButtonPanel] Attaching tooltip to Ask button');
      this.attachTooltipListeners(buttons.ask, 'ask');
    } else {
      console.warn('[ButtonPanel] Ask button not found');
    }
    
    if (buttons.importContent) {
      console.log('[ButtonPanel] Attaching tooltip to Import content button');
      this.attachTooltipListeners(buttons.importContent, 'import-content');
    } else {
      console.warn('[ButtonPanel] Import content button not found');
    }

    // Attach tooltips to vertical button group buttons
    const pdfBtnForTooltip = document.getElementById('vocab-pdf-btn');
    const imageBtnForTooltip = document.getElementById('vocab-image-btn');
    const topicsBtnForTooltip = document.getElementById('vocab-topics-btn');
    const textBtnForTooltip = document.getElementById('vocab-text-btn');

    if (pdfBtnForTooltip) {
      console.log('[ButtonPanel] Attaching tooltip to PDF button');
      this.attachTooltipListeners(pdfBtnForTooltip, 'pdf-upload');
    } else {
      console.warn('[ButtonPanel] PDF button not found for tooltip');
    }

    if (imageBtnForTooltip) {
      console.log('[ButtonPanel] Attaching tooltip to Image button');
      this.attachTooltipListeners(imageBtnForTooltip, 'image-upload');
    } else {
      console.warn('[ButtonPanel] Image button not found for tooltip');
    }

    if (topicsBtnForTooltip) {
      console.log('[ButtonPanel] Attaching tooltip to Topics button');
      this.attachTooltipListeners(topicsBtnForTooltip, 'topics-input');
    } else {
      console.warn('[ButtonPanel] Topics button not found for tooltip');
    }

    if (textBtnForTooltip) {
      console.log('[ButtonPanel] Attaching tooltip to Text button');
      this.attachTooltipListeners(textBtnForTooltip, 'text-input');
    } else {
      console.warn('[ButtonPanel] Text button not found for tooltip');
    }

    // Close vertical button group when clicking outside
    document.addEventListener('click', (e) => {
      if (this.verticalButtonGroup && this.verticalButtonGroup.classList.contains('visible')) {
        // Check if click is outside both the import content button and the vertical group
        const clickedInsideButton = buttons.importContent?.contains(e.target);
        const clickedInsideGroup = this.verticalButtonGroup?.contains(e.target);
        
        if (!clickedInsideButton && !clickedInsideGroup) {
          this.hideVerticalButtonGroup();
        }
      }
    });
  },

  /**
   * Attach tooltip event listeners to a button
   * @param {HTMLElement} button - Button element
   * @param {string} buttonType - Type of button ('magic-meaning' or 'ask')
   */
  attachTooltipListeners(button, buttonType) {
    if (!button) {
      console.log(`[ButtonPanel] attachTooltipListeners: No button provided for ${buttonType}`);
      return;
    }

    console.log(`[ButtonPanel] attachTooltipListeners: Setting up tooltip for ${buttonType} button`, button);

    let tooltip = null;

    button.addEventListener('mouseenter', () => {
      console.log(`[ButtonPanel] Mouse enter on ${buttonType} button`);
      console.log(`[ButtonPanel] Button element:`, button);
      console.log(`[ButtonPanel] Button classes:`, button.className);
      
      // Clean up any existing tooltips first
      this.removeAllTooltips();
      
      const isDisabled = button.classList.contains('disabled');
      console.log(`[ButtonPanel] Is disabled: ${isDisabled}`);
      
      let message = '';

      // Determine tooltip message based on button type and state
      if (buttonType === 'magic-meaning') {
        message = isDisabled 
          ? 'Select words or passages first' 
          : 'Get contextual explanations';
        console.log(`[ButtonPanel] Magic-meaning button message: "${message}"`);
      } else if (buttonType === 'ask') {
        if (isDisabled) {
          // Check specific conditions for Ask button
          const textCount = TextSelector.selectedTexts.size;
          if (textCount === 0) {
            message = 'Select a text first';
          } else if (textCount > 1) {
            message = 'Select only one text';
          } else {
            message = 'Select a text first'; // Fallback
          }
        } else {
          message = 'Ask anything about the selected content';
        }
        console.log(`[ButtonPanel] Ask button message: "${message}" (textCount: ${TextSelector.selectedTexts.size})`);
      } else if (buttonType === 'import-content') {
        message = 'Import content';
        console.log(`[ButtonPanel] Import-content button message: "${message}"`);
      } else if (buttonType === 'pdf-upload') {
        // Check if PDF content exists
        const hasContent = this.topicsModal && this.topicsModal.customContentModal && 
                          this.topicsModal.customContentModal.pdfContents && 
                          this.topicsModal.customContentModal.pdfContents.length > 0;
        message = hasContent ? 'View PDF content' : 'Upload PDF containing text';
        console.log(`[ButtonPanel] PDF-upload button message: "${message}" (hasContent: ${hasContent})`);
      } else if (buttonType === 'image-upload') {
        // Check if image content exists
        const hasContent = this.topicsModal && this.topicsModal.customContentModal && 
                          this.topicsModal.customContentModal.imageContents && 
                          this.topicsModal.customContentModal.imageContents.length > 0;
        message = hasContent ? 'View image content' : 'Upload image containing text';
        console.log(`[ButtonPanel] Image-upload button message: "${message}" (hasContent: ${hasContent})`);
      } else if (buttonType === 'topics-input') {
        // Check if topics content exists
        const hasContent = this.topicsModal && this.topicsModal.customContentModal && 
                          this.topicsModal.customContentModal.topicContents && 
                          this.topicsModal.customContentModal.topicContents.length > 0;
        message = hasContent ? 'View keyword content' : 'Keywords or topics which you want to study on';
        console.log(`[ButtonPanel] Topics-input button message: "${message}" (hasContent: ${hasContent})`);
      } else if (buttonType === 'text-input') {
        // Check if text content exists
        const hasContent = this.topicsModal && this.topicsModal.customContentModal && 
                          this.topicsModal.customContentModal.textContents && 
                          this.topicsModal.customContentModal.textContents.length > 0;
        message = hasContent ? 'View text content' : 'Copy content from elsewhere and paste here';
        console.log(`[ButtonPanel] Text-input button message: "${message}" (hasContent: ${hasContent})`);
      }

      console.log(`[ButtonPanel] Final tooltip message: "${message}" (disabled: ${isDisabled})`);

      // Create and show tooltip
      console.log(`[ButtonPanel] Creating tooltip element...`);
      tooltip = this.createTooltip(message);
      console.log(`[ButtonPanel] Tooltip created:`, tooltip);
      
      console.log(`[ButtonPanel] Appending tooltip to document.body...`);
      document.body.appendChild(tooltip);
      console.log(`[ButtonPanel] Tooltip appended to body`);
      
      // Position tooltip relative to button (top-right since panel is on left)
      const buttonRect = button.getBoundingClientRect();
      tooltip.style.position = 'fixed';
      tooltip.style.top = (buttonRect.top - 50) + 'px';
      // Position tooltip to the right of the button
      tooltip.style.left = (buttonRect.right + 10) + 'px';
      tooltip.style.zIndex = '9999999';
      console.log(`[ButtonPanel] Tooltip positioned at:`, tooltip.style.top, tooltip.style.left);
      console.log(`[ButtonPanel] Button rect:`, buttonRect);
      
      // Trigger animation
      console.log(`[ButtonPanel] Setting timeout to show tooltip...`);
      setTimeout(() => {
        console.log(`[ButtonPanel] Adding 'visible' class to tooltip...`);
        tooltip.classList.add('visible');
        console.log(`[ButtonPanel] Tooltip classes after adding visible:`, tooltip.className);
        const computedStyle = window.getComputedStyle(tooltip);
        console.log(`[ButtonPanel] Tooltip computed style - display:`, computedStyle.display);
        console.log(`[ButtonPanel] Tooltip computed style - visibility:`, computedStyle.visibility);
        console.log(`[ButtonPanel] Tooltip computed style - opacity:`, computedStyle.opacity);
        console.log(`[ButtonPanel] Tooltip computed style - position:`, computedStyle.position);
        console.log(`[ButtonPanel] Tooltip computed style - z-index:`, computedStyle.zIndex);
        console.log(`[ButtonPanel] Tooltip computed style - top:`, computedStyle.top);
        console.log(`[ButtonPanel] Tooltip computed style - right:`, computedStyle.right);
        console.log(`[ButtonPanel] Tooltip computed style - bottom:`, computedStyle.bottom);
        console.log(`[ButtonPanel] Tooltip computed style - pointer-events:`, computedStyle.pointerEvents);
        console.log(`[ButtonPanel] Tooltip getBoundingClientRect:`, tooltip.getBoundingClientRect());
        console.log(`[ButtonPanel] Button getBoundingClientRect:`, button.getBoundingClientRect());
      }, 10);
    });

    button.addEventListener('mouseleave', () => {
      console.log(`[ButtonPanel] Mouse leave on ${buttonType} button`);
      if (tooltip) {
        console.log(`[ButtonPanel] Hiding tooltip...`);
        tooltip.classList.remove('visible');
        setTimeout(() => {
          console.log(`[ButtonPanel] Tooltip removed from DOM`);
          tooltip.remove();
          tooltip = null;
        }, 200);
      } else {
        console.log(`[ButtonPanel] No tooltip to remove`);
      }
    });

    button.addEventListener('click', () => {
      console.log(`[ButtonPanel] Click on ${buttonType} button - hiding tooltip`);
      if (tooltip) {
        console.log(`[ButtonPanel] Hiding tooltip on click...`);
        tooltip.classList.remove('visible');
        setTimeout(() => {
          console.log(`[ButtonPanel] Tooltip removed from DOM on click`);
          tooltip.remove();
          tooltip = null;
        }, 200);
      }
    });
  },

  /**
   * Create a tooltip element
   * @param {string} message - Tooltip message
   * @returns {HTMLElement} Tooltip element
   */
  createTooltip(message) {
    console.log(`[ButtonPanel] createTooltip: Creating tooltip with message: "${message}"`);
    const tooltip = document.createElement('div');
    tooltip.className = 'vocab-btn-tooltip';
    tooltip.textContent = message;
    console.log(`[ButtonPanel] createTooltip: Tooltip element created:`, tooltip);
    console.log(`[ButtonPanel] createTooltip: Tooltip classes:`, tooltip.className);
    console.log(`[ButtonPanel] createTooltip: Tooltip text content:`, tooltip.textContent);
    return tooltip;
  },


  /**
   * Get the current content context (main page or specific custom content tab)
   * @returns {Object} Context object with type, contentType, tabId, and textKeyPrefix
   */
  getCurrentContentContext() {
    // Check if custom content modal is open and has active tab
    if (this.topicsModal && 
        this.topicsModal.customContentModal && 
        this.topicsModal.customContentModal.activeTabId) {
      
      const activeTabId = this.topicsModal.customContentModal.activeTabId;
      const activeContent = this.topicsModal.customContentModal.getContentByTabId(parseInt(activeTabId));
      
      if (activeContent) {
        return {
          type: 'custom-content',
          contentType: activeContent.contentType,
          tabId: activeTabId,
          textKeyPrefix: `${activeContent.contentType}-${activeTabId}`,
          activeContent: activeContent
        };
      }
    }
    
    // Default to main page context
    return {
      type: 'main-page',
      contentType: 'main',
      tabId: null,
      textKeyPrefix: 'main',
      activeContent: null
    };
  },

  /**
   * Check if a textKey belongs to the current context
   * @param {string} textKey - The textKey to check
   * @param {Object} context - The current context (optional, will be detected if not provided)
   * @returns {boolean} True if the textKey belongs to current context
   */
  isTextKeyInCurrentContext(textKey, context = null) {
    if (!context) {
      context = this.getCurrentContentContext();
    }
    
    if (context.type === 'main-page') {
      // For main page, textKey should NOT have content type prefix
      // Main page textKeys are typically just the normalized text
      return !textKey.includes('-') || !['pdf', 'image', 'topic', 'text'].some(type => textKey.startsWith(type + '-'));
    } else {
      // For custom content, textKey should start with the context prefix
      // Format: ${contentType}-${tabId}-${normalizedText}
      return textKey.startsWith(context.textKeyPrefix + '-');
    }
  },

  /**
   * Check if a word belongs to the current context
   * @param {string} word - The word to check
   * @param {Object} context - The current context (optional, will be detected if not provided)
   * @returns {boolean} True if the word belongs to current context
   */
  isWordInCurrentContext(word, context = null) {
    if (!context) {
      context = this.getCurrentContentContext();
    }
    
    // Check if the word has highlights in the current context
    const wordData = WordSelector.explainedWords.get(word);
    if (!wordData || !wordData.highlights) {
      return false;
    }
    
    // For main page context, check if any highlight is in the main document
    if (context.type === 'main-page') {
      return Array.from(wordData.highlights).some(highlight => {
        // Check if highlight is in the main document (not in custom content modal)
        return highlight.closest('.vocab-custom-content-modal') === null;
      });
    } else {
      // For custom content context, check if any highlight is in the current tab's content
      const activeContentElement = this.topicsModal.customContentModal.modal.querySelector('.vocab-custom-content-editor-content');
      return Array.from(wordData.highlights).some(highlight => {
        return activeContentElement && activeContentElement.contains(highlight);
      });
    }
  },


  /**
   * Remove specific asked text from analysis data structure for current tab
   * @param {string} textKey - The text key to remove
   */
  removeAskedTextFromAnalysisData(textKey) {
    console.log('[ButtonPanel] Removing asked text from analysis data:', textKey);
    
    // Check if custom content modal is open and has active tab
    if (!this.topicsModal || !this.topicsModal.customContentModal || !this.topicsModal.customContentModal.activeTabId) {
      console.log('[ButtonPanel] No active tab in custom content modal');
      return;
    }
    
    const activeTabId = this.topicsModal.customContentModal.activeTabId;
    const activeContent = this.topicsModal.customContentModal.getContentByTabId(parseInt(activeTabId));
    
    if (!activeContent || !activeContent.analysis) {
      console.log('[ButtonPanel] No analysis data found for tab:', activeTabId);
      return;
    }
    
    // Remove from chats array if present
    if (activeContent.analysis.chats && activeContent.analysis.chats.length > 0) {
      const initialLength = activeContent.analysis.chats.length;
      activeContent.analysis.chats = activeContent.analysis.chats.filter(chatData => 
        chatData.textKey !== textKey
      );
      
      const removedCount = initialLength - activeContent.analysis.chats.length;
      if (removedCount > 0) {
        console.log('[ButtonPanel] Removed', removedCount, 'chat(s) for textKey:', textKey, 'from analysis data');
        
        // Also remove from ChatDialog's chatHistories
        if (typeof ChatDialog !== 'undefined' && ChatDialog.chatHistories && ChatDialog.chatHistories.has(textKey)) {
          ChatDialog.chatHistories.delete(textKey);
          console.log('[ButtonPanel] Removed chat history from ChatDialog for textKey:', textKey);
        }
      }
    }
  },

  /**
   * Remove specific simplified text from analysis data structure for current tab
   * @param {string} textKey - The text key to remove
   */
  removeSimplifiedTextFromAnalysisData(textKey) {
    console.log('[ButtonPanel] Removing simplified text from analysis data:', textKey);
    
    // Check if custom content modal is open and has active tab
    if (!this.topicsModal || !this.topicsModal.customContentModal || !this.topicsModal.customContentModal.activeTabId) {
      console.log('[ButtonPanel] No active tab in custom content modal');
      return;
    }
    
    const activeTabId = this.topicsModal.customContentModal.activeTabId;
    const activeContent = this.topicsModal.customContentModal.getContentByTabId(parseInt(activeTabId));
    
    if (!activeContent || !activeContent.analysis || !activeContent.analysis.simplifiedMeanings) {
      console.log('[ButtonPanel] No simplified meanings found in analysis data for tab:', activeTabId);
      return;
    }
    
    // Find and remove the specific text from simplifiedMeanings array
    const initialLength = activeContent.analysis.simplifiedMeanings.length;
    activeContent.analysis.simplifiedMeanings = activeContent.analysis.simplifiedMeanings.filter(textData => 
      textData.textKey !== textKey
    );
    
    const removedCount = initialLength - activeContent.analysis.simplifiedMeanings.length;
    if (removedCount > 0) {
      console.log('[ButtonPanel] Removed', removedCount, 'simplified text(s) for textKey:', textKey, 'from analysis data');
    } else {
      console.log('[ButtonPanel] No simplified text found for textKey:', textKey, 'in analysis data');
    }
    
    // Also remove any associated chat history
    if (activeContent.analysis.chats && activeContent.analysis.chats.length > 0) {
      const initialChatLength = activeContent.analysis.chats.length;
      activeContent.analysis.chats = activeContent.analysis.chats.filter(chatData => 
        chatData.textKey !== textKey
      );
      
      const removedChatCount = initialChatLength - activeContent.analysis.chats.length;
      if (removedChatCount > 0) {
        console.log('[ButtonPanel] Also removed', removedChatCount, 'associated chat(s) for textKey:', textKey);
        
        // Also remove from ChatDialog's chatHistories
        if (typeof ChatDialog !== 'undefined' && ChatDialog.chatHistories && ChatDialog.chatHistories.has(textKey)) {
          ChatDialog.chatHistories.delete(textKey);
          console.log('[ButtonPanel] Removed chat history from ChatDialog for textKey:', textKey);
        }
      }
    }
  },

  /**
   * Remove specific word from analysis data structure for current tab
   * @param {string} normalizedWord - The normalized word to remove
   */
  removeWordFromAnalysisData(normalizedWord) {
    console.log('[ButtonPanel] Removing word from analysis data:', normalizedWord);
    
    // Check if custom content modal is open and has active tab
    if (!this.topicsModal || !this.topicsModal.customContentModal || !this.topicsModal.customContentModal.activeTabId) {
      console.log('[ButtonPanel] No active tab in custom content modal');
      return;
    }
    
    const activeTabId = this.topicsModal.customContentModal.activeTabId;
    const activeContent = this.topicsModal.customContentModal.getContentByTabId(parseInt(activeTabId));
    
    if (!activeContent || !activeContent.analysis || !activeContent.analysis.wordMeanings) {
      console.log('[ButtonPanel] No word meanings found in analysis data for tab:', activeTabId);
      return;
    }
    
    // Find and remove the specific word from wordMeanings array
    const initialLength = activeContent.analysis.wordMeanings.length;
    activeContent.analysis.wordMeanings = activeContent.analysis.wordMeanings.filter(wordData => 
      wordData.normalizedWord !== normalizedWord
    );
    
    const removedCount = initialLength - activeContent.analysis.wordMeanings.length;
    if (removedCount > 0) {
      console.log('[ButtonPanel] Removed', removedCount, 'word meaning(s) for word:', normalizedWord, 'from analysis data');
    } else {
      console.log('[ButtonPanel] No word meaning found for word:', normalizedWord, 'in analysis data');
    }
  },


  /**
   * Handler for Magic meaning button for a specific text
   * @param {string} textKey - The specific text key to process
   */
  async handleMagicMeaningForText(textKey) {
    console.log('[ButtonPanel] Magic meaning clicked for specific text:', textKey);
    
    // Check if textKey exists in selectedTexts
    if (!TextSelector.selectedTexts.has(textKey)) {
      console.warn('[ButtonPanel] Text key not found in selectedTexts:', textKey);
      return;
    }
    
    // Get position data for this specific text
    const positionData = TextSelector.textPositions.get(textKey);
    if (!positionData) {
      console.warn('[ButtonPanel] No position data found for textKey:', textKey);
      return;
    }
    
    // Get the highlight element
    const highlight = TextSelector.textToHighlights.get(textKey);
    if (!highlight) {
      console.warn('[ButtonPanel] No highlight found for textKey:', textKey);
      return;
    }
    
    // Initialize API completion tracking for single text
    this.apiCompletionState.simplifyCompleted = false;
    this.apiCompletionState.wordsExplanationCompleted = true; // No words to process
    this.apiCompletionState.shouldTrack = true;
    
    // Set button to processing state
    this.setMagicMeaningProcessing();
    
    console.log('[ButtonPanel] Processing single text segment for:', textKey);
    
    // Build API request payload for this single text
    const textSegments = [{
      textStartIndex: positionData.textStartIndex,
      textLength: positionData.textLength,
      text: positionData.text,
      previousSimplifiedTexts: []
    }];
    
    // Remove text from selectedTexts container as API call starts
    TextSelector.selectedTexts.delete(textKey);
    
    // Update button states after removing from selectedTexts
    this.updateButtonStatesFromSelections();
    
    // Remove any existing buttons (remove button and magic-meaning button)
    const existingRemoveBtn = highlight.querySelector('.vocab-text-remove-btn');
    if (existingRemoveBtn) {
      existingRemoveBtn.remove();
    }
    
    const existingMagicBtn = highlight.querySelector('.vocab-text-magic-meaning-btn');
    if (existingMagicBtn) {
      existingMagicBtn.remove();
    }
    
    // Remove icons wrapper if empty
    const iconsWrapper = highlight.querySelector('.vocab-text-icons-wrapper');
    if (iconsWrapper && iconsWrapper.children.length === 0) {
      iconsWrapper.remove();
    }
    
    // Add loading animation class (already added in click handler, but ensure it's there)
    highlight.classList.add('vocab-text-loading');
    
    // Call SimplifyService with SSE for this single text
    SimplifyService.simplify(
      textSegments,
      // onEvent callback - called for each SSE event
      (eventData) => {
        console.log('[ButtonPanel] Received simplified text:', eventData);
        
        // Verify this event matches our textKey
        if (positionData.textStartIndex === eventData.textStartIndex &&
            positionData.textLength === eventData.textLength) {
          
          // Remove loading animation
          highlight.classList.remove('vocab-text-loading');
          
          // Hide spinner if it exists and restore button
          const iconsWrapper = highlight.querySelector('.vocab-text-icons-wrapper');
          if (iconsWrapper) {
            const spinnerContainer = iconsWrapper.querySelector('.vocab-magic-meaning-spinner-container');
            if (spinnerContainer) {
              spinnerContainer.remove();
            }
            
            // Restore magic-meaning button (though it won't be needed since book icon will be shown)
            const magicBtn = iconsWrapper.querySelector('.vocab-text-magic-meaning-btn');
            if (magicBtn) {
              magicBtn.style.display = '';
            }
          }
          
          // Change underline to light green
          highlight.classList.add('vocab-text-simplified');
          
          // Replace purple cross button with green cross button at top-left
          const existingPurpleCross = highlight.querySelector('.vocab-text-remove-btn');
          if (existingPurpleCross) {
            existingPurpleCross.remove();
          }
          
          // Create green cross button at top-left (same position as purple cross)
          const greenCrossBtn = document.createElement('button');
          greenCrossBtn.className = 'vocab-text-remove-green-btn';
          greenCrossBtn.setAttribute('aria-label', 'Remove simplified text');
          greenCrossBtn.style.position = 'absolute';
          greenCrossBtn.style.top = '-10px';
          greenCrossBtn.style.left = '-10px';
          greenCrossBtn.style.width = '18px';
          greenCrossBtn.style.height = '18px';
          greenCrossBtn.style.background = '#FFFFFF';
          greenCrossBtn.style.borderRadius = '50%';
          greenCrossBtn.style.zIndex = '10000003';
          greenCrossBtn.style.boxShadow = '0 2px 4px rgba(34, 197, 94, 0.4)';
          greenCrossBtn.style.display = 'flex';
          greenCrossBtn.style.alignItems = 'center';
          greenCrossBtn.style.justifyContent = 'center';
          greenCrossBtn.style.cursor = 'pointer';
          greenCrossBtn.style.opacity = '1';
          greenCrossBtn.style.border = '1px solid #22c55e';
          greenCrossBtn.style.padding = '0';
          greenCrossBtn.style.boxSizing = 'border-box';
          // Use green cross icon
          greenCrossBtn.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 10px; height: 10px;">
              <path d="M2 2L10 10M10 2L2 10" stroke="#22c55e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          `;
          // Add click handler - same functionality as green remove button
          greenCrossBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('[TextSelector] Green cross button clicked for simplified text:', textKey);
            TextSelector.removeFromSimplifiedTexts(textKey);
          });
          highlight.appendChild(greenCrossBtn);
          
          // Create wrapper for icons
          const newIconsWrapper = document.createElement('div');
          newIconsWrapper.className = 'vocab-text-icons-wrapper';
          newIconsWrapper.setAttribute('data-text-key', textKey);
          
          // Add book icon first (top position)
          const bookBtn = TextSelector.createBookButton(textKey);
          newIconsWrapper.appendChild(bookBtn);
          
          // Don't add green remove button - green cross button at top-left has same functionality
          
          // Append icons wrapper directly to highlight for absolute positioning
          highlight.appendChild(newIconsWrapper);
          
          // Force a reflow to ensure book icon is in DOM
          newIconsWrapper.offsetHeight;
          
          // Automatically open chat dialog for simplified text
          const simplifiedData = {
            text: eventData.text,
            simplifiedText: eventData.simplifiedText,
            textStartIndex: eventData.textStartIndex,
            textLength: eventData.textLength,
            previousSimplifiedTexts: eventData.previousSimplifiedTexts || [],
            shouldAllowSimplifyMore: eventData.shouldAllowSimplifyMore || false,
            highlight: highlight
          };
          
          // Store simplified text data first so it's available when dialog opens
          TextSelector.simplifiedTexts.set(textKey, {
            textStartIndex: eventData.textStartIndex,
            textLength: eventData.textLength,
            text: eventData.text,
            simplifiedText: eventData.simplifiedText,
            previousSimplifiedTexts: eventData.previousSimplifiedTexts || [],
            shouldAllowSimplifyMore: eventData.shouldAllowSimplifyMore || false,
            highlight: highlight
          });
          
          // Wait for book icon to be in DOM and visible before opening dialog
          // Use requestAnimationFrame to ensure DOM is fully updated
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              // Verify book icon is in DOM before opening (use safe method to avoid CSS selector issues)
              let verifyBookIcon = null;
              const allIconsWrappers = document.querySelectorAll('.vocab-text-icons-wrapper');
              for (const wrapper of allIconsWrappers) {
                const wrapperTextKey = wrapper.getAttribute('data-text-key');
                if (wrapperTextKey === textKey) {
                  verifyBookIcon = wrapper.querySelector('.vocab-text-book-btn');
                  if (verifyBookIcon) break;
                }
              }
              
              if (verifyBookIcon) {
                console.log('[ButtonPanel] Book icon verified in DOM, opening dialog');
                ChatDialog.open(eventData.text, textKey, 'simplified', simplifiedData, 'selected');
              } else {
                console.log('[ButtonPanel] Book icon not found, retrying after delay...');
                setTimeout(() => {
                  ChatDialog.open(eventData.text, textKey, 'simplified', simplifiedData, 'selected');
                }, 200);
              }
            });
          });
          
          // Position icons relative to highlight
          const highlightRect = highlight.getBoundingClientRect();
          const isInModal = highlight.closest('.vocab-custom-content-modal');
          
          if (isInModal) {
            // In modal context: position to the left with sufficient margin
            newIconsWrapper.style.setProperty('left', '-50px', 'important');
            newIconsWrapper.style.setProperty('top', '-2px', 'important');
          } else {
            // In main webpage context: position to the left
            newIconsWrapper.style.setProperty('left', '-40px', 'important');
            newIconsWrapper.style.setProperty('top', '0px', 'important');
          }
          
          // Simplified text data already stored above before opening dialog
          
          // Store simplified text in analysis data for persistence
          if (this.topicsModal && this.topicsModal.customContentModal && this.topicsModal.customContentModal.activeTabId) {
            const activeContent = this.topicsModal.customContentModal.getContentByTabId(parseInt(this.topicsModal.customContentModal.activeTabId));
            if (activeContent && activeContent.analysis) {
              const simplifiedTextData = {
                textKey: textKey,
                textStartIndex: eventData.textStartIndex,
                textLength: eventData.textLength,
                originalText: eventData.text,
                simplifiedText: eventData.simplifiedText,
                previousSimplifiedTexts: eventData.previousSimplifiedTexts || [],
                shouldAllowSimplifyMore: eventData.shouldAllowSimplifyMore || false,
                timestamp: new Date().toISOString()
              };
              
              // Check if this text already exists in simplifiedMeanings
              const existingTextIndex = activeContent.analysis.simplifiedMeanings.findIndex(s => 
                s.textKey === textKey
              );
              
              if (existingTextIndex !== -1) {
                // Update existing simplified text
                activeContent.analysis.simplifiedMeanings[existingTextIndex] = simplifiedTextData;
                console.log(`[ButtonPanel] Updated existing simplified text for textKey "${textKey}" in analysis data`);
              } else {
                // Add new simplified text
                activeContent.analysis.simplifiedMeanings.push(simplifiedTextData);
                console.log(`[ButtonPanel] Added new simplified text for textKey "${textKey}" to analysis data`);
              }
            }
          }
          
          // Update button states after adding to simplifiedTexts
          this.updateButtonStatesFromSelections();
          
          console.log('[ButtonPanel] Text simplified successfully for:', textKey);
        }
      },
      // onComplete callback
      () => {
        console.log('[ButtonPanel] Single text simplification API call completed for:', textKey);
        
        // Mark simplify as completed
        this.apiCompletionState.simplifyCompleted = true;
        
        // Check if all APIs are completed
        this.checkAPICompletion();
      },
      // onError callback
      (error) => {
        console.error('[ButtonPanel] Error during single text simplification:', error);
        
        // Remove loading animation on error
        highlight.classList.remove('vocab-text-loading');
        
        // Hide spinner and restore button on error
        const iconsWrapper = highlight.querySelector('.vocab-text-icons-wrapper');
        if (iconsWrapper) {
          // Hide spinner
          const spinnerContainer = iconsWrapper.querySelector('.vocab-magic-meaning-spinner-container');
          if (spinnerContainer) {
            spinnerContainer.remove();
          }
          
          // Restore magic-meaning button
          const magicBtn = iconsWrapper.querySelector('.vocab-text-magic-meaning-btn');
          if (magicBtn) {
            magicBtn.style.display = '';
          }
        }
        
        // Mark simplify as completed (even on error) to allow button reset
        this.apiCompletionState.simplifyCompleted = true;
        
        // Check if all APIs are completed
        this.checkAPICompletion();
      }
    );
  },

  /**
   * Handler for Magic meaning button
   */
  async handleMagicMeaning() {
    console.log('[ButtonPanel] Magic meaning clicked');
    
    // Get all selected texts and words
    const selectedTexts = TextSelector.getSelectedTexts();
    const selectedWords = WordSelector.getSelectedWords();
    
    if (selectedTexts.size === 0 && selectedWords.size === 0) {
      console.warn('[ButtonPanel] No text or words selected');
      return;
    }

    // Initialize API completion tracking
    this.apiCompletionState.simplifyCompleted = selectedTexts.size === 0; // If no texts, mark as completed
    this.apiCompletionState.wordsExplanationCompleted = selectedWords.size === 0; // If no words, mark as completed
    this.apiCompletionState.shouldTrack = true;

    // Set button to processing state
    this.setMagicMeaningProcessing();

    console.log('[ButtonPanel] API tracking initialized:', this.apiCompletionState);
    
    // ========== Process Text Segments (existing functionality) ==========
    if (selectedTexts.size > 0) {
      // Build API request payload
      const textSegments = [];
      const textKeysToProcess = [];
      
      for (const textKey of selectedTexts) {
        const positionData = TextSelector.textPositions.get(textKey);
        
        if (positionData) {
          textSegments.push({
            textStartIndex: positionData.textStartIndex,
            textLength: positionData.textLength,
            text: positionData.text,
            previousSimplifiedTexts: []
          });
          textKeysToProcess.push(textKey);
        }
      }
      
      if (textSegments.length > 0) {
        console.log('[ButtonPanel] Processing', textSegments.length, 'text segments');
        
        // Remove texts from selectedTexts container as API call starts
        for (const textKey of textKeysToProcess) {
          TextSelector.selectedTexts.delete(textKey);
        }
        
        // Update button states after removing from selectedTexts
        this.updateButtonStatesFromSelections();
        
        // Start loading animation on all selected highlights
        for (const textKey of textKeysToProcess) {
          const highlight = TextSelector.textToHighlights.get(textKey);
          if (highlight) {
            // Remove any existing buttons (remove button and magic-meaning button)
            const existingRemoveBtn = highlight.querySelector('.vocab-text-remove-btn');
            if (existingRemoveBtn) {
              existingRemoveBtn.remove();
            }
            
            const existingMagicBtn = highlight.querySelector('.vocab-text-magic-meaning-btn');
            if (existingMagicBtn) {
              existingMagicBtn.remove();
            }
            
            // Remove icons wrapper if empty
            const iconsWrapper = highlight.querySelector('.vocab-text-icons-wrapper');
            if (iconsWrapper && iconsWrapper.children.length === 0) {
              iconsWrapper.remove();
            }
            
            // Add loading animation class
            highlight.classList.add('vocab-text-loading');
          }
        }
        
        // Call SimplifyService with SSE
        SimplifyService.simplify(
          textSegments,
          // onEvent callback - called for each SSE event
          (eventData) => {
            console.log('[ButtonPanel] Received simplified text:', eventData);
            
            // Find the corresponding textKey for this event
            // Match by textStartIndex and textLength
            const matchingTextKey = textKeysToProcess.find(textKey => {
              const posData = TextSelector.textPositions.get(textKey);
              return posData && 
                     posData.textStartIndex === eventData.textStartIndex &&
                     posData.textLength === eventData.textLength;
            });
            
            if (matchingTextKey) {
              const highlight = TextSelector.textToHighlights.get(matchingTextKey);
              
              if (highlight) {
                // Remove loading animation
                highlight.classList.remove('vocab-text-loading');
                
                // Change underline to light green
                highlight.classList.add('vocab-text-simplified');
                
                // Replace purple cross button with green cross button at top-left
                const existingPurpleCross = highlight.querySelector('.vocab-text-remove-btn');
                if (existingPurpleCross) {
                  existingPurpleCross.remove();
                }
                
                // Create green cross button at top-left (same position as purple cross)
                const greenCrossBtn = document.createElement('button');
                greenCrossBtn.className = 'vocab-text-remove-green-btn';
                greenCrossBtn.setAttribute('aria-label', 'Remove simplified text');
                greenCrossBtn.style.position = 'absolute';
                greenCrossBtn.style.top = '-10px';
                greenCrossBtn.style.left = '-10px';
                greenCrossBtn.style.width = '18px';
                greenCrossBtn.style.height = '18px';
                greenCrossBtn.style.background = '#FFFFFF';
                greenCrossBtn.style.borderRadius = '50%';
                greenCrossBtn.style.zIndex = '10000003';
                greenCrossBtn.style.boxShadow = '0 2px 4px rgba(34, 197, 94, 0.4)';
                greenCrossBtn.style.display = 'flex';
                greenCrossBtn.style.alignItems = 'center';
                greenCrossBtn.style.justifyContent = 'center';
                greenCrossBtn.style.cursor = 'pointer';
                greenCrossBtn.style.opacity = '1';
                greenCrossBtn.style.border = '1px solid #22c55e';
                greenCrossBtn.style.padding = '0';
                greenCrossBtn.style.boxSizing = 'border-box';
                // Use green cross icon
                greenCrossBtn.innerHTML = `
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 8px; height: 8px;">
                    <path d="M2 2L8 8M8 2L2 8" stroke="#22c55e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                `;
                // Add click handler - same functionality as green remove button
                greenCrossBtn.addEventListener('click', (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('[TextSelector] Green cross button clicked for simplified text:', matchingTextKey);
                  TextSelector.removeFromSimplifiedTexts(matchingTextKey);
                });
                highlight.appendChild(greenCrossBtn);
                
                // Create wrapper for icons
                const iconsWrapper = document.createElement('div');
                iconsWrapper.className = 'vocab-text-icons-wrapper';
                iconsWrapper.setAttribute('data-text-key', matchingTextKey);
                
                // Add book icon first (top position)
                const bookBtn = TextSelector.createBookButton(matchingTextKey);
                iconsWrapper.appendChild(bookBtn);
                
                // Don't add green remove button - green cross button at top-left has same functionality
                
                // Automatically open chat dialog for simplified text
                const simplifiedData = {
                  text: eventData.text,
                  simplifiedText: eventData.simplifiedText,
                  textStartIndex: eventData.textStartIndex,
                  textLength: eventData.textLength,
                  previousSimplifiedTexts: eventData.previousSimplifiedTexts || [],
                  shouldAllowSimplifyMore: eventData.shouldAllowSimplifyMore || false
                };
                
                // Use a small delay to ensure DOM is updated
                setTimeout(() => {
                  ChatDialog.open(eventData.text, matchingTextKey, 'simplified', simplifiedData, 'selected');
                }, 100);
                
                // Append icons wrapper directly to highlight for absolute positioning
                highlight.appendChild(iconsWrapper);
                
                // Position icons relative to highlight
                const highlightRect = highlight.getBoundingClientRect();
                const isInModal = highlight.closest('.vocab-custom-content-modal');
                
                if (isInModal) {
                  // In modal context: position to the left with sufficient margin to avoid overlap
                  iconsWrapper.style.setProperty('left', '-50px', 'important'); // 50px to the left with !important
                  // Align upper border with text upper border by adjusting top position
                  iconsWrapper.style.setProperty('top', '-2px', 'important'); // Slight adjustment to align upper borders
                } else {
                  // In main webpage context: position to the left as before
                  iconsWrapper.style.setProperty('left', '-40px', 'important'); // 40px to the left of the highlight
                  iconsWrapper.style.setProperty('top', '0px', 'important'); // Align with top edge of selected text
                }
                
                // Store simplified text data
                TextSelector.simplifiedTexts.set(matchingTextKey, {
                  textStartIndex: eventData.textStartIndex,
                  textLength: eventData.textLength,
                  text: eventData.text,
                  simplifiedText: eventData.simplifiedText,
                  previousSimplifiedTexts: eventData.previousSimplifiedTexts || [],
                  shouldAllowSimplifyMore: eventData.shouldAllowSimplifyMore || false,
                  highlight: highlight
                });
                
                // Force repositioning after a short delay to ensure DOM is updated
                setTimeout(() => {
                  const isInModalAfterDelay = highlight.closest('.vocab-custom-content-modal');
                  if (isInModalAfterDelay) {
                    iconsWrapper.style.setProperty('left', '-50px', 'important');
                    iconsWrapper.style.setProperty('top', '-2px', 'important');
                  }
                }, 100);
                
                // Store simplified text in analysis data for persistence
                if (this.topicsModal.customContentModal.activeTabId) {
                  const activeContent = this.topicsModal.customContentModal.getContentByTabId(parseInt(this.topicsModal.customContentModal.activeTabId));
                  if (activeContent && activeContent.analysis) {
                    const simplifiedTextData = {
                      textKey: matchingTextKey,
                      textStartIndex: eventData.textStartIndex,
                      textLength: eventData.textLength,
                      originalText: eventData.text,
                      simplifiedText: eventData.simplifiedText,
                      previousSimplifiedTexts: eventData.previousSimplifiedTexts || [],
                      shouldAllowSimplifyMore: eventData.shouldAllowSimplifyMore || false,
                      timestamp: new Date().toISOString()
                    };
                    
                    // Check if this text already exists in simplifiedMeanings
                    const existingTextIndex = activeContent.analysis.simplifiedMeanings.findIndex(s => 
                      s.textKey === matchingTextKey
                    );
                    
                    if (existingTextIndex !== -1) {
                      // Update existing simplified text
                      activeContent.analysis.simplifiedMeanings[existingTextIndex] = simplifiedTextData;
                      console.log(`[ButtonPanel] Updated existing simplified text for textKey "${matchingTextKey}" in analysis data`);
                    } else {
                      // Add new simplified text
                      activeContent.analysis.simplifiedMeanings.push(simplifiedTextData);
                      console.log(`[ButtonPanel] Added new simplified text for textKey "${matchingTextKey}" to analysis data`);
                    }
                  }
                }
                
                // Update button states after adding to simplifiedTexts
                ButtonPanel.updateButtonStatesFromSelections();
                
                console.log('[ButtonPanel] Updated UI for text segment:', matchingTextKey);
              }
            }
          },
          // onComplete callback
          () => {
            console.log('[ButtonPanel] All text simplification complete');
            
            // Remove loading animation from any remaining highlights (in case some failed)
            for (const textKey of textKeysToProcess) {
              const highlight = TextSelector.textToHighlights.get(textKey);
              if (highlight && highlight.classList.contains('vocab-text-loading')) {
                highlight.classList.remove('vocab-text-loading');
              }
            }

            // Mark simplify API as completed
            this.apiCompletionState.simplifyCompleted = true;
            console.log('[ButtonPanel] Simplify API marked as completed');
            
            // Check if all APIs are complete
            this.checkAPICompletion();
          },
          // onError callback
          (error) => {
            console.error('[ButtonPanel] Error during text simplification:', error);
            
            // Remove loading animation from all highlights
            for (const textKey of textKeysToProcess) {
              const highlight = TextSelector.textToHighlights.get(textKey);
              if (highlight) {
                highlight.classList.remove('vocab-text-loading');
              }
            }
            
            // Show error notification
            TextSelector.showNotification('Error simplifying text. Please try again.');

            // Mark simplify API as completed (even on error)
            this.apiCompletionState.simplifyCompleted = true;
            console.log('[ButtonPanel] Simplify API marked as completed (with error)');
            
            // Check if all APIs are complete
            this.checkAPICompletion();
          }
        );
      }
    }
    
    // ========== Process Word Selections (new functionality) ==========
    if (selectedWords.size > 0) {
      console.log('[ButtonPanel] ===== MAGIC MEANING: Processing Words =====');
      console.log('[ButtonPanel] Processing', selectedWords.size, 'selected words');
      console.log('[ButtonPanel] Selected words list:', Array.from(selectedWords));
      
      // Build API payload for words with 10-word context
      const wordPayload = WordSelector.buildWordsExplanationPayload();
      
      if (wordPayload.length === 0) {
        console.warn('[ButtonPanel] No word segments with position data');
        
        // Mark words explanation API as completed (no payload to process)
        this.apiCompletionState.wordsExplanationCompleted = true;
        console.log('[ButtonPanel] Words explanation API marked as completed (no payload)');
        
        // Check if all APIs are complete
        this.checkAPICompletion();
        return;
      }
      
      console.log('[ButtonPanel] Word payload segments:', wordPayload.length);
      console.log('[ButtonPanel] Full word payload:', JSON.stringify(wordPayload.map(s => ({
        textStartIndex: s.textStartIndex,
        text: s.text.substring(0, 100) + '...',
        words: s.important_words_location.map(w => w.word),
        highlightCount: s._wordHighlights ? s._wordHighlights.length : 0
      })), null, 2));
      
      // Track all word highlights for this request
      const allWordHighlights = [];
      wordPayload.forEach(segment => {
        if (segment._wordHighlights) {
          allWordHighlights.push(...segment._wordHighlights);
        }
      });
      
      console.log('[ButtonPanel] Total word highlights to process:', allWordHighlights.length);
      
      // Remove words from selectedWords container as API call starts
      selectedWords.forEach(word => {
        WordSelector.selectedWords.delete(word);
      });
      
      // Update button states
      this.updateButtonStatesFromSelections();
      
      // Visual feedback: Remove cross icons and start pulsating animation
      allWordHighlights.forEach((highlight, idx) => {
        const word = highlight.getAttribute('data-word');
        console.log(`[ButtonPanel] Setting up highlight #${idx + 1} for word "${word}"`);
        
        // Remove cross button
        const existingBtn = highlight.querySelector('.vocab-word-remove-btn');
        if (existingBtn) {
          existingBtn.remove();
        }
        
        // Add pulsating purple animation
        highlight.classList.add('vocab-word-loading');
      });
      
      // Prepare API payload (remove internal tracking property)
      const apiPayload = wordPayload.map(segment => ({
        textStartIndex: segment.textStartIndex,
        text: segment.text,
        important_words_location: segment.important_words_location
      }));
      
      console.log('[ButtonPanel] Sending API request with payload:', JSON.stringify(apiPayload, null, 2));
      
      // Call WordExplanationService with SSE
      WordExplanationService.explainWords(
        apiPayload,
        // onEvent callback - called for each word explanation
        (eventData) => {
          console.log('[ButtonPanel] ===== SSE EVENT RECEIVED =====');
          console.log('[ButtonPanel] Full event data:', JSON.stringify(eventData, null, 2));
          
          const wordInfo = eventData.word_info;
          if (!wordInfo) {
            console.warn('[ButtonPanel] No word_info in event data');
            return;
          }
          
          // Use word_info.location.word for matching instead of word_info.word
          // This fixes issues with incorrect word extraction and case sensitivity
          const targetWord = wordInfo.location?.word || wordInfo.word;
          const normalizedTargetWord = targetWord.toLowerCase().trim();
          
          console.log(`[ButtonPanel] ===== PROCESSING WORD: "${targetWord}" =====`);
          console.log(`[ButtonPanel] Word info - word: "${wordInfo.word}" (original)`);
          console.log(`[ButtonPanel] Word info - location.word: "${wordInfo.location?.word}" (using for matching)`);
          console.log(`[ButtonPanel] Target word for matching: "${targetWord}"`);
          console.log(`[ButtonPanel] Normalized target word: "${normalizedTargetWord}"`);
          console.log(`[ButtonPanel] Word info - textStartIndex: ${wordInfo.textStartIndex}`);
          console.log(`[ButtonPanel] Word location:`, wordInfo.location);
          console.log(`[ButtonPanel] Word meaning:`, wordInfo.meaning);
          console.log(`[ButtonPanel] Word examples:`, wordInfo.examples);
          
          // Special debugging for "government" word
          if (normalizedTargetWord === 'government' || wordInfo.word?.toLowerCase().includes('government')) {
            console.log(`[ButtonPanel] ===== SPECIAL DEBUG FOR GOVERNMENT WORD =====`);
            console.log(`[ButtonPanel] This is the government word!`);
            console.log(`[ButtonPanel] Full event data for government:`, JSON.stringify(eventData, null, 2));
          }
          
          // Log all available segments for debugging
          console.log('[ButtonPanel] Available segments for matching:');
          wordPayload.forEach((segment, idx) => {
            console.log(`[ButtonPanel] Segment #${idx + 1}:`, {
              textStartIndex: segment.textStartIndex,
              textEnd: segment.textStartIndex + segment.text.length,
              textPreview: segment.text.substring(0, 50) + '...',
              words: segment.important_words_location.map(w => w.word),
              highlightCount: segment._wordHighlights ? segment._wordHighlights.length : 0
            });
            
            // Special debugging for government word segments
            if (normalizedTargetWord === 'government' || wordInfo.word?.toLowerCase().includes('government')) {
              console.log(`[ButtonPanel] ===== GOVERNMENT SEGMENT DEBUG #${idx + 1} =====`);
              console.log(`[ButtonPanel] Segment textStartIndex: ${segment.textStartIndex}`);
              console.log(`[ButtonPanel] Segment text: "${segment.text}"`);
              console.log(`[ButtonPanel] Important words in segment:`, segment.important_words_location);
              console.log(`[ButtonPanel] Highlights in segment:`, segment._wordHighlights?.map(hl => ({
                dataWord: hl.getAttribute('data-word'),
                textContent: hl.textContent.trim(),
                classes: hl.className
              })));
            }
          });
          
          // Find the corresponding segment and highlight
          // First try exact match
          let matchingSegment = wordPayload.find(segment => 
            segment.textStartIndex === wordInfo.textStartIndex
          );
          
          console.log(`[ButtonPanel] Exact match result:`, matchingSegment ? 'FOUND' : 'NOT FOUND');
          
          // Special debugging for government word matching
          if (normalizedTargetWord === 'government' || wordInfo.word?.toLowerCase().includes('government')) {
            console.log(`[ButtonPanel] ===== GOVERNMENT EXACT MATCH DEBUG =====`);
            console.log(`[ButtonPanel] Looking for textStartIndex: ${wordInfo.textStartIndex}`);
            wordPayload.forEach((segment, idx) => {
              const isMatch = segment.textStartIndex === wordInfo.textStartIndex;
              console.log(`[ButtonPanel] Segment #${idx + 1} textStartIndex: ${segment.textStartIndex}, matches: ${isMatch}`);
            });
            console.log(`[ButtonPanel] Matching segment found:`, matchingSegment ? 'YES' : 'NO');
          }
          
          // If no exact match, try to find by word name and location within merged segments
          if (!matchingSegment) {
            console.log(`[ButtonPanel] No exact match for textStartIndex ${wordInfo.textStartIndex}, trying word-based matching`);
            
            matchingSegment = wordPayload.find(segment => {
              // Check if this segment contains the word using normalized target word
              const wordLocation = segment.important_words_location.find(w => 
                w.word.toLowerCase() === normalizedTargetWord
              );
              
              if (!wordLocation) return false;
              
              // Check if the textStartIndex falls within this segment's range
              const segmentEnd = segment.textStartIndex + segment.text.length;
              const isInRange = wordInfo.textStartIndex >= segment.textStartIndex && wordInfo.textStartIndex < segmentEnd;
              
              console.log(`[ButtonPanel] Checking segment (${segment.textStartIndex}-${segmentEnd}): word "${normalizedTargetWord}" found: ${!!wordLocation}, inRange: ${isInRange}`);
              
              // Special debugging for government word
              if (normalizedTargetWord === 'government' || wordInfo.word?.toLowerCase().includes('government')) {
                console.log(`[ButtonPanel] ===== GOVERNMENT WORD-BASED MATCH DEBUG =====`);
                console.log(`[ButtonPanel] Segment textStartIndex: ${segment.textStartIndex}`);
                console.log(`[ButtonPanel] Segment textEnd: ${segmentEnd}`);
                console.log(`[ButtonPanel] Word textStartIndex: ${wordInfo.textStartIndex}`);
                console.log(`[ButtonPanel] Word location found:`, wordLocation);
                console.log(`[ButtonPanel] Is in range: ${isInRange}`);
                console.log(`[ButtonPanel] All words in segment:`, segment.important_words_location.map(w => w.word));
              }
              
              return isInRange;
            });
            
            console.log(`[ButtonPanel] Word-based match result:`, matchingSegment ? 'FOUND' : 'NOT FOUND');
          }
          
          if (!matchingSegment) {
            console.error(`[ButtonPanel] ✗ NO MATCHING SEGMENT FOUND for textStartIndex ${wordInfo.textStartIndex}, word: "${targetWord}"`);
            console.log('[ButtonPanel] Available segments:', wordPayload.map(s => ({ 
              textStartIndex: s.textStartIndex, 
              textEnd: s.textStartIndex + s.text.length,
              words: s.important_words_location.map(w => w.word) 
            })));
            console.log(`[ButtonPanel] ✗ SKIPPING WORD "${targetWord}" - NO SEGMENT MATCH`);
            return;
          }
          
          console.log(`[ButtonPanel] ✓ Found matching segment with ${matchingSegment._wordHighlights ? matchingSegment._wordHighlights.length : 0} highlights`);
          
          if (matchingSegment && matchingSegment._wordHighlights) {
            // Find the specific word highlight within this segment
            const wordLocation = wordInfo.location;
            console.log(`[ButtonPanel] ===== LOOKING FOR HIGHLIGHT ELEMENT =====`);
            console.log(`[ButtonPanel] Looking for word "${targetWord}" (normalized: "${normalizedTargetWord}") in ${matchingSegment._wordHighlights.length} highlights`);
            
            // Log all highlights in detail
            matchingSegment._wordHighlights.forEach((hl, idx) => {
              const dataWord = hl.getAttribute('data-word');
              const textContent = hl.textContent.trim();
              const classes = hl.className;
              const isCurrentlyLoading = hl.classList.contains('vocab-word-loading');
              const isAlreadyExplained = hl.classList.contains('vocab-word-explained');
              
              console.log(`[ButtonPanel] Highlight #${idx + 1}:`, {
                dataWord: dataWord,
                textContent: textContent,
                classes: classes,
                isCurrentlyLoading: isCurrentlyLoading,
                isAlreadyExplained: isAlreadyExplained,
                matchesTargetWord: dataWord && dataWord.toLowerCase() === normalizedTargetWord
              });
              
              // Special debugging for government word highlights
              if (normalizedTargetWord === 'government' || wordInfo.word?.toLowerCase().includes('government')) {
                console.log(`[ButtonPanel] ===== GOVERNMENT HIGHLIGHT DEBUG #${idx + 1} =====`);
                console.log(`[ButtonPanel] Highlight data-word: "${dataWord}"`);
                console.log(`[ButtonPanel] Highlight textContent: "${textContent}"`);
                console.log(`[ButtonPanel] Highlight classes: "${classes}"`);
                console.log(`[ButtonPanel] Target word: "${normalizedTargetWord}"`);
                console.log(`[ButtonPanel] Does data-word match target: ${dataWord && dataWord.toLowerCase() === normalizedTargetWord}`);
                console.log(`[ButtonPanel] Does textContent match target: ${textContent.toLowerCase() === normalizedTargetWord}`);
                console.log(`[ButtonPanel] Is currently loading: ${isCurrentlyLoading}`);
                console.log(`[ButtonPanel] Is already explained: ${isAlreadyExplained}`);
              }
            });
            
            // Try multiple matching strategies for robustness
            console.log(`[ButtonPanel] ===== ATTEMPTING HIGHLIGHT MATCHING =====`);
            
            let wordHighlight = matchingSegment._wordHighlights.find(hl => {
              const dataWord = hl.getAttribute('data-word');
              const matches = dataWord && dataWord.toLowerCase() === normalizedTargetWord;
              console.log(`[ButtonPanel] Strategy 1 (data-word): "${dataWord}" === "${normalizedTargetWord}" = ${matches}`);
              
              // Special debugging for government word
              if (normalizedTargetWord === 'government' || wordInfo.word?.toLowerCase().includes('government')) {
                console.log(`[ButtonPanel] ===== GOVERNMENT STRATEGY 1 DEBUG =====`);
                console.log(`[ButtonPanel] Checking highlight with data-word: "${dataWord}"`);
                console.log(`[ButtonPanel] Target normalized word: "${normalizedTargetWord}"`);
                console.log(`[ButtonPanel] Match result: ${matches}`);
              }
              
              return matches;
            });
            
            // If not found by data-word attribute, try by text content
            if (!wordHighlight) {
              console.log(`[ButtonPanel] Strategy 1 failed, trying Strategy 2 (text content) for word "${normalizedTargetWord}"`);
              wordHighlight = matchingSegment._wordHighlights.find(hl => {
                const highlightText = hl.textContent.trim().toLowerCase();
                const matches = highlightText === normalizedTargetWord;
                console.log(`[ButtonPanel] Strategy 2 (text content): "${highlightText}" === "${normalizedTargetWord}" = ${matches}`);
                
                // Special debugging for government word
                if (normalizedTargetWord === 'government' || wordInfo.word?.toLowerCase().includes('government')) {
                  console.log(`[ButtonPanel] ===== GOVERNMENT STRATEGY 2 DEBUG =====`);
                  console.log(`[ButtonPanel] Checking highlight with textContent: "${highlightText}"`);
                  console.log(`[ButtonPanel] Target normalized word: "${normalizedTargetWord}"`);
                  console.log(`[ButtonPanel] Match result: ${matches}`);
                }
                
                return matches;
              });
            }
            
            // If still not found, try partial matching
            if (!wordHighlight) {
              console.log(`[ButtonPanel] Strategy 2 failed, trying Strategy 3 (partial matching) for word "${normalizedTargetWord}"`);
              wordHighlight = matchingSegment._wordHighlights.find(hl => {
                const highlightText = hl.textContent.trim().toLowerCase();
                const matches = highlightText.includes(normalizedTargetWord) || 
                       normalizedTargetWord.includes(highlightText);
                console.log(`[ButtonPanel] Strategy 3 (partial): "${highlightText}" includes "${normalizedTargetWord}" = ${matches}`);
                
                // Special debugging for government word
                if (normalizedTargetWord === 'government' || wordInfo.word?.toLowerCase().includes('government')) {
                  console.log(`[ButtonPanel] ===== GOVERNMENT STRATEGY 3 DEBUG =====`);
                  console.log(`[ButtonPanel] Checking highlight with textContent: "${highlightText}"`);
                  console.log(`[ButtonPanel] Target normalized word: "${normalizedTargetWord}"`);
                  console.log(`[ButtonPanel] Partial match result: ${matches}`);
                }
                
                return matches;
              });
            }
            
            if (wordHighlight) {
              console.log(`[ButtonPanel] ===== APPLYING GREEN BACKGROUND =====`);
              console.log(`[ButtonPanel] ✓ Found matching highlight for word "${targetWord}"`);
              console.log(`[ButtonPanel] Highlight element before changes:`, {
                classes: wordHighlight.className,
                dataWord: wordHighlight.getAttribute('data-word'),
                textContent: wordHighlight.textContent.trim(),
                hasLoadingClass: wordHighlight.classList.contains('vocab-word-loading'),
                hasExplainedClass: wordHighlight.classList.contains('vocab-word-explained')
              });
              
              // Remove pulsating animation
              console.log(`[ButtonPanel] Removing loading class from highlight`);
              wordHighlight.classList.remove('vocab-word-loading');
              
              // Remove old purple cross button if exists
              const oldBtn = wordHighlight.querySelector('.vocab-word-remove-btn');
              if (oldBtn) {
                console.log(`[ButtonPanel] Removing old purple cross button`);
                oldBtn.remove();
              }
              
              // Change background to green with breathing animation
              console.log(`[ButtonPanel] Adding vocab-word-explained class for green background`);
              wordHighlight.classList.add('vocab-word-explained', 'word-breathing');
              
              // Remove breathing animation after it completes (0.8s)
              setTimeout(() => {
                wordHighlight.classList.remove('word-breathing');
              }, 800);
              
              // Store explanation data on the element
              console.log(`[ButtonPanel] Storing explanation data on element`);
              wordHighlight.setAttribute('data-meaning', wordInfo.meaning);
              wordHighlight.setAttribute('data-examples', JSON.stringify(wordInfo.examples));
              
              // Store word explanation in analysis data for persistence
              if (this.topicsModal.customContentModal.activeTabId) {
                const activeContent = this.topicsModal.customContentModal.getContentByTabId(parseInt(this.topicsModal.customContentModal.activeTabId));
                if (activeContent && activeContent.analysis) {
                  // Check if this word already exists in wordMeanings
                  const existingWordIndex = activeContent.analysis.wordMeanings.findIndex(w => 
                    w.word.toLowerCase() === normalizedTargetWord
                  );
                  
                  const wordExplanationData = {
                    word: targetWord,
                    normalizedWord: normalizedTargetWord,
                    meaning: wordInfo.meaning,
                    examples: wordInfo.examples,
                    shouldAllowFetchMoreExamples: wordInfo.shouldAllowFetchMoreExamples || false,
                    textStartIndex: wordInfo.textStartIndex,
                    location: wordInfo.location,
                    timestamp: new Date().toISOString()
                  };
                  
                  if (existingWordIndex !== -1) {
                    // Update existing word explanation
                    activeContent.analysis.wordMeanings[existingWordIndex] = wordExplanationData;
                    console.log(`[ButtonPanel] Updated existing word explanation for "${targetWord}" in analysis data`);
                  } else {
                    // Add new word explanation
                    activeContent.analysis.wordMeanings.push(wordExplanationData);
                    console.log(`[ButtonPanel] Added new word explanation for "${targetWord}" to analysis data`);
                  }
                }
              }
              
              // Add green wireframe cross button
              console.log(`[ButtonPanel] Adding green cross button`);
              const greenCrossBtn = WordSelector.createRemoveExplainedButton(targetWord);
              wordHighlight.appendChild(greenCrossBtn);
              
              // Store in explainedWords map
              // Extract languageCode from eventData (could be at top level or in word_info)
              const languageCode = eventData.languageCode || wordInfo.languageCode || null;
              const normalizedWord = normalizedTargetWord;
              
              if (!WordSelector.explainedWords.has(normalizedWord)) {
                console.log(`[ButtonPanel] Creating new entry in explainedWords map for "${normalizedWord}"`);
                WordSelector.explainedWords.set(normalizedWord, {
                  word: targetWord,
                  meaning: wordInfo.meaning,
                  examples: wordInfo.examples,
                  shouldAllowFetchMoreExamples: wordInfo.shouldAllowFetchMoreExamples || false,
                  hasCalledGetMoreExamples: false, // Track if get-more-explanations API has been called
                  languageCode: languageCode,
                  highlights: new Set()
                });
              } else {
                // Update existing entry with languageCode if not already set
                const existingEntry = WordSelector.explainedWords.get(normalizedWord);
                if (!existingEntry.languageCode && languageCode) {
                  existingEntry.languageCode = languageCode;
                }
              }
              WordSelector.explainedWords.get(normalizedWord).highlights.add(wordHighlight);
              
              // Setup hover and click interactions for this word
              console.log(`[ButtonPanel] Setting up word interactions`);
              WordSelector.setupWordInteractions(wordHighlight);
              
              // Update button states to show "Remove meanings" button
              console.log(`[ButtonPanel] Updating button states`);
              ButtonPanel.updateButtonStatesFromSelections();
              
              console.log(`[ButtonPanel] ===== GREEN BACKGROUND APPLIED SUCCESSFULLY =====`);
              console.log('[ButtonPanel] ✓ Updated UI for word:', targetWord);
              console.log('[ButtonPanel] Highlight element after changes:', {
                classes: wordHighlight.className,
                hasLoadingClass: wordHighlight.classList.contains('vocab-word-loading'),
                hasExplainedClass: wordHighlight.classList.contains('vocab-word-explained')
              });
              console.log('[ButtonPanel] explainedWords container size:', WordSelector.explainedWords.size);
              
              // Automatically show word meaning popup after green background is applied
              // Use a small delay to ensure DOM is updated and breathing animation starts
              setTimeout(() => {
                console.log('[ButtonPanel] ===== AUTO-SHOWING WORD MEANING POPUP =====');
                const normalizedTargetWord = targetWord.toLowerCase();
                console.log('[ButtonPanel] Word highlight element:', {
                  element: wordHighlight,
                  isInDOM: document.body.contains(wordHighlight),
                  classes: wordHighlight.className,
                  hasExplainedClass: wordHighlight.classList.contains('vocab-word-explained'),
                  textContent: wordHighlight.textContent.trim(),
                  dataWord: wordHighlight.getAttribute('data-word'),
                  normalizedWord: normalizedTargetWord,
                  isInExplainedWords: WordSelector.explainedWords.has(normalizedTargetWord)
                });
                
                // Validate element before showing popup
                if (!wordHighlight || !document.body.contains(wordHighlight)) {
                  console.error('[ButtonPanel] ✗ Word highlight element is not in DOM, cannot show popup');
                  return;
                }
                
                if (!wordHighlight.classList.contains('vocab-word-explained')) {
                  console.error('[ButtonPanel] ✗ Word highlight does not have vocab-word-explained class, cannot show popup');
                  console.error('[ButtonPanel] Current classes:', wordHighlight.className);
                  return;
                }
                
                if (!WordSelector.explainedWords.has(normalizedTargetWord)) {
                  console.error('[ButtonPanel] ✗ Word not found in explainedWords map, cannot show popup');
                  console.error('[ButtonPanel] Available words in map:', Array.from(WordSelector.explainedWords.keys()));
                  return;
                }
                
                console.log('[ButtonPanel] ✓ All validations passed, showing popup');
                WordSelector.showWordPopup(wordHighlight, true); // Show as sticky popup
              }, 100);
            } else {
              console.error(`[ButtonPanel] ===== HIGHLIGHT MATCHING FAILED =====`);
              console.error(`[ButtonPanel] ✗ No matching highlight found for word "${targetWord}"`);
              console.error(`[ButtonPanel] All matching strategies failed for word "${targetWord}"`);
              console.error(`[ButtonPanel] Available highlights:`, matchingSegment._wordHighlights.map(hl => ({
                word: hl.getAttribute('data-word'),
                text: hl.textContent.trim(),
                classes: hl.className
              })));
              console.error(`[ButtonPanel] ✗ WORD "${targetWord}" WILL NOT GET GREEN BACKGROUND`);
            }
          }
        },
        // onComplete callback
        () => {
          console.log('[ButtonPanel] ===== SSE STREAM COMPLETE =====');
          console.log('[ButtonPanel] All word explanations complete');
          
          // Count how many words are still loading
          let stillLoading = 0;
          const stillLoadingWords = [];
          
          console.log('[ButtonPanel] ===== CHECKING FINAL STATUS OF ALL HIGHLIGHTS =====');
          allWordHighlights.forEach((highlight, idx) => {
            const word = highlight.getAttribute('data-word');
            const isStillLoading = highlight.classList.contains('vocab-word-loading');
            const isExplained = highlight.classList.contains('vocab-word-explained');
            
            console.log(`[ButtonPanel] Highlight #${idx + 1} for word "${word}":`, {
              isStillLoading: isStillLoading,
              isExplained: isExplained,
              classes: highlight.className,
              textContent: highlight.textContent.trim()
            });
            
            if (isStillLoading) {
              stillLoading++;
              stillLoadingWords.push(word);
              console.warn(`[ButtonPanel] ⚠️ Highlight #${idx + 1} for word "${word}" still in loading state - NO API RESPONSE RECEIVED`);
              console.warn(`[ButtonPanel] ⚠️ This word will NOT get green background because no API response was received`);
              highlight.classList.remove('vocab-word-loading');
            } else if (isExplained) {
              console.log(`[ButtonPanel] ✅ Highlight #${idx + 1} for word "${word}" successfully explained with green background`);
            } else {
              console.warn(`[ButtonPanel] ❓ Highlight #${idx + 1} for word "${word}" is neither loading nor explained - UNKNOWN STATE`);
            }
          });
          
          console.log(`[ButtonPanel] ===== FINAL SUMMARY =====`);
          console.log(`[ButtonPanel] Total highlights: ${allWordHighlights.length}`);
          console.log(`[ButtonPanel] Successfully explained: ${allWordHighlights.length - stillLoading}`);
          console.log(`[ButtonPanel] Still loading (no response): ${stillLoading}`);
          console.log(`[ButtonPanel] Success rate: ${Math.round((allWordHighlights.length - stillLoading) / allWordHighlights.length * 100)}%`);
          
          if (stillLoadingWords.length > 0) {
            console.warn(`[ButtonPanel] ⚠️ Words that did NOT receive API responses:`, stillLoadingWords);
            console.warn(`[ButtonPanel] ⚠️ These words will remain purple (not green) because no backend response was received`);
          }
          
          console.log('[ButtonPanel] ===== MAGIC MEANING: Complete =====');

          // Mark words explanation API as completed
          this.apiCompletionState.wordsExplanationCompleted = true;
          console.log('[ButtonPanel] Words explanation API marked as completed');
          
          // Check if all APIs are complete
          this.checkAPICompletion();
        },
        // onError callback
        (error) => {
          console.error('[ButtonPanel] ===== SSE ERROR =====');
          console.error('[ButtonPanel] Error during word explanation:', error);
          
          // Remove pulsating animation from all highlights
          allWordHighlights.forEach((highlight, idx) => {
            const word = highlight.getAttribute('data-word');
            console.log(`[ButtonPanel] Removing loading state from highlight #${idx + 1} for word "${word}"`);
            highlight.classList.remove('vocab-word-loading');
          });
          
          // Show error notification
          TextSelector.showNotification('Error getting word meanings. Please try again.');

          // Mark words explanation API as completed (even on error)
          this.apiCompletionState.wordsExplanationCompleted = true;
          console.log('[ButtonPanel] Words explanation API marked as completed (with error)');
          
          // Check if all APIs are complete
          this.checkAPICompletion();
        }
      );
    }
  },

  /**
   * Handler for Ask button
   */
  handleAsk() {
    console.log('[ButtonPanel] Ask button clicked');
    
    // Get the first selected text
    const selectedTexts = TextSelector.getSelectedTexts();
    
    if (selectedTexts.size === 0) {
      console.warn('[ButtonPanel] No text selected');
      return;
    }
    
    if (selectedTexts.size > 1) {
      console.warn('[ButtonPanel] Multiple texts selected, button should be disabled');
      return;
    }
    
    // Get the first (and only) text
    const textKey = Array.from(selectedTexts)[0];
    const textHighlight = TextSelector.textToHighlights.get(textKey);
    
    if (textHighlight) {
      const originalText = textHighlight.textContent.replace(/\s+/g, ' ').trim();
      
      // Move text from selectedTexts to askedTexts
      TextSelector.moveToAskedTexts(textKey);
      
      // Open chat dialog with selected context
      ChatDialog.open(originalText, textKey, 'ask', null, 'selected');
    }
  },

  /**
   * Handler for Custom content button
   */
  handleCustomContent() {
    console.log('[ButtonPanel] Custom content button clicked');
    
    // For now, just show an alert - this can be expanded later
    alert('Custom content feature coming soon!');
  },

  /**
   * Check if the custom content modal is currently open
   * @returns {boolean} True if the modal is open, false otherwise
   */
  isCustomContentModalOpen() {
    return this.topicsModal.customContentModal.overlay && 
           this.topicsModal.customContentModal.overlay.classList.contains('visible');
  },

  /**
   * Get the currently active content type from the custom content modal
   * @returns {string|null} The active content type ('pdf', 'image', 'topic', 'text') or null if no modal is open
   */
  getCurrentContentType() {
    if (!this.isCustomContentModalOpen()) {
      return null;
    }
    
    // Check which content type is currently active
    return this.topicsModal.currentContentType || null;
  },

  /**
   * Show the vertical button group
   */
  showVerticalButtonGroup() {
    if (this.verticalButtonGroup) {
      // Show all buttons first
      this.showAllVerticalButtons();
      
      // If custom content modal is open, hide the button for the current content type
      const currentContentType = this.getCurrentContentType();
      if (currentContentType) {
        this.hideVerticalButtonForContentType(currentContentType);
        console.log(`[ButtonPanel] Hiding ${currentContentType} button because modal is open`);
      }
      
      this.verticalButtonGroup.classList.add('visible');
      this.verticalButtonGroup.style.pointerEvents = 'auto';
      this.updateState({ showVerticalGroup: true });
      
      // Update content indicators when showing the button group
      // Add a small delay to ensure DOM is ready
      setTimeout(() => {
        this.updateContentIndicators();
        
        // FORCE topics indicator to be visible if topics content exists
        if (this.topicsModal && this.topicsModal.customContentModal && 
            this.topicsModal.customContentModal.topicContents && 
            this.topicsModal.customContentModal.topicContents.length > 0) {
          const topicsIndicator = document.getElementById('topics-content-indicator');
          if (topicsIndicator) {
            topicsIndicator.style.display = 'block';
            topicsIndicator.style.visibility = 'visible';
            topicsIndicator.style.opacity = '1';
            topicsIndicator.style.backgroundColor = '#16a34a';
            topicsIndicator.style.border = '1px solid white';
            console.log('[ButtonPanel] FORCED topics indicator to be visible when showing button group');
          }
        }
      }, 100);
    }
  },

  /**
   * Show all vertical buttons (make them visible)
   */
  showAllVerticalButtons() {
    const buttons = [
      document.getElementById('vocab-pdf-btn'),
      document.getElementById('vocab-image-btn'),
      document.getElementById('vocab-topics-btn'),
      document.getElementById('vocab-text-btn')
    ];
    
    buttons.forEach(button => {
      if (button) {
        button.style.display = 'flex';
        button.style.visibility = 'visible';
      }
    });
  },

  /**
   * Hide a specific vertical button based on content type
   * @param {string} contentType - The content type ('pdf', 'image', 'topic', 'text')
   */
  hideVerticalButtonForContentType(contentType) {
    const buttonIdMap = {
      'pdf': 'vocab-pdf-btn',
      'image': 'vocab-image-btn',
      'topic': 'vocab-topics-btn',
      'text': 'vocab-text-btn'
    };
    
    const buttonId = buttonIdMap[contentType];
    if (buttonId) {
      const button = document.getElementById(buttonId);
      if (button) {
        button.style.display = 'none';
        button.style.visibility = 'hidden';
      }
    }
  },

  /**
   * Update vertical button visibility based on current content type
   */
  updateVerticalButtonVisibility() {
    console.log('[ButtonPanel] Updating vertical button visibility');
    const currentContentType = this.getCurrentContentType();
    console.log('[ButtonPanel] Current content type:', currentContentType);
    
    if (currentContentType) {
      // Hide the button for the current content type
      this.hideVerticalButtonForContentType(currentContentType);
      console.log(`[ButtonPanel] Hidden ${currentContentType} button because modal is open`);
    }
  },

  /**
   * Hide the vertical button group
   */
  hideVerticalButtonGroup() {
    if (this.verticalButtonGroup) {
      // Restore all buttons to visible state when hiding the group
      this.showAllVerticalButtons();
      
      this.verticalButtonGroup.classList.remove('visible');
      this.verticalButtonGroup.style.pointerEvents = 'none';
      this.updateState({ showVerticalGroup: false });
    }
  },

  /**
   * Hide the import content button
   */
  hideCustomContentButton() {
    const importContentBtn = document.getElementById('import-content');
    console.log('[ButtonPanel] Attempting to hide import content button:', importContentBtn);
    
    if (importContentBtn) {
      // Store the button's parent and next sibling for reinsertion
      this.importContentButtonParent = importContentBtn.parentNode;
      this.importContentButtonNextSibling = importContentBtn.nextSibling;
      
      console.log('[ButtonPanel] Stored parent:', this.importContentButtonParent);
      console.log('[ButtonPanel] Stored next sibling:', this.importContentButtonNextSibling);
      
      // Simply remove from DOM - this will immediately fix the layout
      importContentBtn.remove();
      console.log('[ButtonPanel] Import content button removed from DOM');
    } else {
      console.log('[ButtonPanel] Import content button not found!');
    }
  },

  /**
   * Show the import content button
   */
  showCustomContentButton() {
    // Only recreate if we have the stored references
    if (this.importContentButtonParent) {
      // Recreate the button
      const importContentBtn = this.createButton({
        id: 'import-content',
        className: 'vocab-btn vocab-btn-solid-purple',
        icon: this.createUploadIcon(),
        text: 'Import content',
        type: 'solid-purple'
      });
      
      // Reattach event listeners
      importContentBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent event from bubbling up
        console.log('Import content clicked');
        this.toggleVerticalButtonGroup();
      });
      
      // Insert back into the DOM
      if (this.importContentButtonNextSibling) {
        this.importContentButtonParent.insertBefore(importContentBtn, this.importContentButtonNextSibling);
      } else {
        this.importContentButtonParent.appendChild(importContentBtn);
      }
      
      // Store reference for future removal
      this.importContentButton = importContentBtn;
      
      // SAFETY CHECK: Ensure indicator exists after button recreation
      setTimeout(() => {
        const indicator = document.getElementById('import-content-indicator');
        if (!indicator) {
          console.log('[ButtonPanel] Creating missing import-content indicator after button recreation...');
          const newIndicator = document.createElement('div');
          newIndicator.className = 'vocab-content-indicator';
          newIndicator.id = 'import-content-indicator';
          importContentBtn.appendChild(newIndicator);
          
          // Update indicators to show/hide based on content
          if (this.updateContentIndicators) {
            this.updateContentIndicators();
          }
        }
      }, 100);
    }
  },

  /**
   * Toggle the vertical button group
   */
  toggleVerticalButtonGroup() {
    if (this.verticalButtonGroup) {
      if (this.verticalButtonGroup.classList.contains('visible')) {
        this.hideVerticalButtonGroup();
      } else {
        this.showVerticalButtonGroup();
      }
    }
  },

  /**
   * Handler for PDF button
   */
  handlePDFButton() {
    console.log('[ButtonPanel] PDF button clicked');
    // Hide the vertical group after selection
    this.hideVerticalButtonGroup();
    
    // Check if there's already PDF content in memory
    const pdfContents = this.topicsModal.customContentModal.getContentByType('pdf');
    if (pdfContents && pdfContents.length > 0) {
      // Show custom content modal with only PDF contents
      this.topicsModal.currentContentType = 'pdf';
      this.showCustomContentModalWithContents('pdf');
    } else {
      // Show the PDF upload modal for new content
      this.showPDFUploadModal();
    }
  },

  /**
   * Handler for Image button
   */
  handleImageButton() {
    console.log('[ButtonPanel] Image button clicked');
    // Hide the vertical group after selection
    this.hideVerticalButtonGroup();
    
    // Check if there's already image content in memory
    const imageContents = this.topicsModal.customContentModal.getContentByType('image');
    if (imageContents && imageContents.length > 0) {
      // Show custom content modal with only image contents
      this.topicsModal.currentContentType = 'image';
      this.showCustomContentModalWithContents('image');
    } else {
      // Show the image upload modal for new content
      this.showImageUploadModal();
    }
  },

  /**
   * Handler for Topics button
   */
  handleTopicsButton() {
    console.log('[ButtonPanel] Topics button clicked');
    // Hide the vertical group after selection
    this.hideVerticalButtonGroup();
    
    // Check if there's already topic content in memory
    const topicContents = this.topicsModal.customContentModal.getContentByType('topic');
    if (topicContents && topicContents.length > 0) {
      // Show custom content modal with only topic contents
      this.topicsModal.currentContentType = 'topic';
      this.showCustomContentModalWithContents('topic');
    } else {
      // Show the topics modal for new content
      this.showTopicsModal();
    }
  },

  /**
   * Handler for Text button
   */
  handleTextButton() {
    console.log('[ButtonPanel] Text button clicked');
    // Hide the vertical group after selection
    this.hideVerticalButtonGroup();
    
    // Check if there's already text content in memory
    const textContents = this.topicsModal.customContentModal.getContentByType('text');
    if (textContents && textContents.length > 0) {
      // Show custom content modal with only text contents
      this.topicsModal.currentContentType = 'text';
      this.showCustomContentModalWithContents('text');
    } else {
      // Show the text input modal for new content
      this.showTextInputModal();
    }
  },

  /**
   * Show text input modal
   */
  showTextInputModal() {
    console.log('[ButtonPanel] Showing text input modal');
    
    // Create modal if it doesn't exist
    if (!this.textInputModal) {
      this.createTextInputModal();
      
      // Wait for DOM to be ready before showing modal using double requestAnimationFrame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.showTextModalWithAnimation();
        });
      });
    } else {
      // Modal already exists, just show it
      this.showTextModalWithAnimation();
    }
  },

  /**
   * Create text input modal HTML structure
   */
  createTextInputModal() {
    console.log('[ButtonPanel] Creating text input modal...');
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'vocab-text-input-overlay';
    overlay.id = 'vocab-text-input-overlay';
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'vocab-text-input-modal';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'vocab-text-input-header';
    
    const title = document.createElement('h2');
    title.className = 'vocab-text-input-title';
    title.textContent = 'Paste content to study';
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'vocab-text-input-close';
    closeBtn.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    closeBtn.setAttribute('aria-label', 'Close modal');
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    
    
    // Create content container
    const contentContainer = document.createElement('div');
    contentContainer.className = 'vocab-text-input-content empty';
    
    // Create textarea (using contenteditable div for highlighting support)
    const textarea = document.createElement('div');
    textarea.className = 'vocab-text-input-textarea';
    textarea.setAttribute('contenteditable', 'true');
    textarea.setAttribute('data-placeholder', 'Paste your content here');
    textarea.setAttribute('role', 'textbox');
    textarea.setAttribute('aria-multiline', 'true');
    
    contentContainer.appendChild(textarea);
    
    // Create proceed button
    const proceedBtn = document.createElement('button');
    proceedBtn.className = 'vocab-text-input-proceed-btn hidden';
    proceedBtn.textContent = 'Proceed';
    
    // Assemble modal
    modal.appendChild(header);
    modal.appendChild(contentContainer);
    modal.appendChild(proceedBtn);
    
    overlay.appendChild(modal);
    
    // Append to body
    document.body.appendChild(overlay);
    
    // Store references
    this.textInputModal = {
      overlay: overlay,
      modal: modal,
      textarea: textarea,
      proceedBtn: proceedBtn,
      closeBtn: closeBtn
    };
    
    // Attach event listeners
    this.attachTextInputModalListeners();
  },

  /**
   * Show text modal with animation
   */
  showTextModalWithAnimation() {
    console.log('[ButtonPanel] Showing text modal with animation');
    
    // Clear all selections when opening modal
    this.clearSelectionsOnModalOpen();
    
    if (this.textInputModal && this.textInputModal.overlay) {
      this.textInputModal.overlay.classList.add('visible');
      this.textInputModal.modal.classList.add('visible');
      
      // Add class to body to blur webpage icons
      document.body.classList.add('vocab-text-modal-open');
      
      // Focus on textarea and check border radius
      setTimeout(() => {
        if (this.textInputModal.textarea) {
          this.textInputModal.textarea.focus();
          this.updateTextareaBorderRadius(this.textInputModal.textarea);
        }
      }, 300);
    }
  },

  /**
   * Hide text input modal
   */
  hideTextInputModal() {
    console.log('[ButtonPanel] Hiding text input modal');
    
    // Hide search preview if visible
    this.hideTextSearchPreview();
    
    if (this.textInputModal && this.textInputModal.overlay) {
      this.textInputModal.overlay.classList.remove('visible');
      this.textInputModal.modal.classList.remove('visible');
      
      // Remove class from body to show webpage icons again
      document.body.classList.remove('vocab-text-modal-open');
      
      // Clear textarea after animation and hide search bar and proceed button
      setTimeout(() => {
        if (this.textInputModal.textarea) {
          this.textInputModal.textarea.textContent = '';
          this.textInputModal.textarea.innerHTML = '';
        }
        
        // Clear search input
        if (this.textInputModal.searchInput) {
          this.textInputModal.searchInput.value = '';
        }
        
        // Hide search bar and proceed button
        const searchBar = this.textInputModal.modal.querySelector('.vocab-text-input-search');
        if (searchBar) {
          searchBar.classList.add('hidden');
        }
        if (this.textInputModal.proceedBtn) {
          this.textInputModal.proceedBtn.classList.add('hidden');
        }
        
        // Add empty class back to content container
        const contentContainer = this.textInputModal.modal.querySelector('.vocab-text-input-content');
        if (contentContainer) {
          contentContainer.classList.add('empty');
        }
      }, 300);
    }
    
    // Show the custom content button again
    this.showCustomContentButton();
  },

  /**
   * Attach event listeners to text input modal
   */
  attachTextInputModalListeners() {
    const overlay = this.textInputModal.overlay;
    const modal = this.textInputModal.modal;
    const closeBtn = this.textInputModal.closeBtn;
    const proceedBtn = this.textInputModal.proceedBtn;
    const textarea = this.textInputModal.textarea;
    
    if (!overlay || !modal || !closeBtn || !proceedBtn || !textarea) {
      console.error('Text input modal: Missing required elements for event listeners');
      return;
    }
    
    // Close modal events
    closeBtn.addEventListener('click', () => this.hideTextInputModal());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.hideTextInputModal();
      }
    });
    
    // Update border radius when content changes and toggle visibility of proceed button
    textarea.addEventListener('input', () => {
      this.updateTextareaBorderRadius(textarea);
      
      // Show/hide proceed button based on whether there's text
      const hasText = textarea.textContent.trim().length > 0;
      const proceedBtn = this.textInputModal.proceedBtn;
      const contentContainer = this.textInputModal.modal.querySelector('.vocab-text-input-content');
      
      if (hasText) {
        proceedBtn.classList.remove('hidden');
        contentContainer.classList.remove('empty');
      } else {
        proceedBtn.classList.add('hidden');
        contentContainer.classList.add('empty');
      }
    });
    
    // Update border radius on resize
    textarea.addEventListener('resize', () => {
      this.updateTextareaBorderRadius(textarea);
    });
    
    // Initial border radius check
    setTimeout(() => {
      this.updateTextareaBorderRadius(textarea);
    }, 100);
    
    // Proceed button event
    proceedBtn.addEventListener('click', () => {
      const textContent = textarea.textContent.trim();
      if (textContent) {
        this.handleTextProceed(textContent);
      }
    });
    
    // Enter key to proceed (Ctrl+Enter for contenteditable)
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        const textContent = textarea.textContent.trim();
        if (textContent) {
          this.handleTextProceed(textContent);
        }
      }
    });
  },


  /**
   * Show search preview with highlighted matches for textarea
   */
  showTextSearchPreview(textarea, text, searchTerm) {
    // Remove existing preview if any
    this.hideTextSearchPreview();
    
    // Create preview overlay
    const preview = document.createElement('div');
    preview.className = 'vocab-text-search-preview';
    preview.style.cssText = `
      position: fixed;
      background: white;
      border: 2px solid #FFE066;
      border-radius: 8px;
      padding: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      max-width: 400px;
      max-height: 200px;
      overflow-y: auto;
      font-size: 14px;
      line-height: 1.4;
      font-family: inherit;
    `;
    
    // Create highlighted content
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gim');
    const highlightedContent = text.replace(regex, '<span style="background: linear-gradient(120deg, #FFE066 0%, #FFD700 100%); padding: 2px 4px; border-radius: 3px; font-weight: 600; color: #333;">$1</span>');
    
    // Count matches
    const matches = text.match(regex);
    const matchCount = matches ? matches.length : 0;
    
    preview.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 8px; color: #333; border-bottom: 1px solid #eee; padding-bottom: 4px;">
        Search Results: ${matchCount} match${matchCount !== 1 ? 'es' : ''} found
      </div>
      <div style="white-space: pre-wrap;">${highlightedContent}</div>
    `;
    
    // Position relative to textarea
    const rect = textarea.getBoundingClientRect();
    preview.style.top = (rect.top + rect.height + 10) + 'px';
    preview.style.left = Math.max(10, rect.left) + 'px';
    
    document.body.appendChild(preview);
    
    // Store reference for cleanup
    this.textSearchPreview = preview;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      this.hideTextSearchPreview();
    }, 5000);
  },

  /**
   * Hide text search preview overlay
   */
  hideTextSearchPreview() {
    if (this.textSearchPreview) {
      this.textSearchPreview.remove();
      this.textSearchPreview = null;
    }
  },

  /**
   * Scroll to the first text match in textarea
   */
  scrollToTextMatch(textarea, searchTerm) {
    const text = textarea.value;
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gim');
    const match = regex.exec(text);
    
    if (match) {
      const matchIndex = match.index;
      
      // Calculate line number and position
      const textBeforeMatch = text.substring(0, matchIndex);
      const lines = textBeforeMatch.split('\n');
      const lineNumber = lines.length - 1;
      
      // Scroll to the line containing the match
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 20;
      const scrollTop = lineNumber * lineHeight;
      
      textarea.scrollTop = Math.max(0, scrollTop - textarea.clientHeight / 2);
      
      // Don't focus the textarea - this causes cursor to jump from search input
    }
  },

  /**
   * Update textarea border radius based on scrollbar presence
   */
  updateTextareaBorderRadius(textarea) {
    if (!textarea) return;
    
    // Check if scrollbar is present
    const hasScrollbar = textarea.scrollHeight > textarea.clientHeight;
    
    if (hasScrollbar) {
      // Scrollbar present - make top-right and bottom-right corners square
      textarea.style.borderRadius = '20px 0 0 20px';
    } else {
      // No scrollbar - keep all corners rounded
      textarea.style.borderRadius = '20px';
    }
  },

  /**
   * Handle text proceed button click
   */
  handleTextProceed(textContent) {
    console.log('[ButtonPanel] Processing text content, length:', textContent.length);
    
    // Hide the text input modal
    this.hideTextInputModal();
    
    // Set current content type
    this.topicsModal.currentContentType = 'text';
    
    // Create tab name from first 3 words
    const words = textContent.trim().split(/\s+/);
    const tabName = words.slice(0, 3).join(' ');
    
    console.log('[ButtonPanel] Creating text content with name:', tabName);
    
    // Create text content using the new data structure
    const newContent = this.topicsModal.customContentModal.addContent('text', tabName, textContent, {
      inputText: textContent,
      createdAt: new Date().toISOString()
    });
    
    if (!newContent) {
      console.error('[ButtonPanel] ===== FAILED TO CREATE TEXT CONTENT =====');
      this.showNotification('Failed to create text content. Please try again.', 'error');
      return;
    }

    console.log('[ButtonPanel] Text content created successfully');
    
    // Show modal with only text contents, and switch to the new tab
    this.showCustomContentModalWithContents('text', newContent.tabId);
    
    // Ensure custom content modal is visible
    console.log('[ButtonPanel] Ensuring custom content modal is visible...');
    if (!this.topicsModal.customContentModal.overlay.classList.contains('visible')) {
      this.topicsModal.customContentModal.overlay.classList.add('visible');
      
      // Clear all selections when opening modal
      this.clearSelectionsOnModalOpen();
      
      // Add class to body to hide webpage icons
      document.body.classList.add('vocab-custom-content-modal-open');
      
      console.log('[ButtonPanel] Custom content modal is now visible');
    } else {
      console.log('[ButtonPanel] Custom content modal was already visible');
    }
    
    // Update modal title
    console.log('[ButtonPanel] Updating modal title to Text...');
    this.updateCustomContentModalTitle('text');
  },

  /**
   * Show the button panel
   */
  show() {
    if (this.panelContainer) {
      this.panelContainer.style.display = 'block';
      // Ensure left-side positioning if no custom position is set
      if (!this.panelContainer.style.left || this.panelContainer.style.left === '') {
        this.panelContainer.style.left = '0';
        this.panelContainer.style.right = 'auto';
      }
      // Add visible class for initial slide-in animation
      this.panelContainer.classList.add('visible');
      
      // Get the wrapper container and trigger pop-in animation
      const wrapperContainer = this.panelContainer.querySelector('.vocab-wrapper-container');
      if (wrapperContainer) {
        // Remove any previous animation classes
        wrapperContainer.classList.remove('pop-out', 'pop-in');
        // Force reflow to ensure class removal is processed
        void wrapperContainer.offsetHeight;
        // Add pop-in animation class
        wrapperContainer.classList.add('pop-in');
        // Remove animation class after animation completes
        setTimeout(() => {
          wrapperContainer.classList.remove('pop-in');
        }, 500);
      }
      
      console.log('[ButtonPanel] Panel shown at left:', this.panelContainer.style.left);
    }
  },

  /**
   * Hide the button panel
   */
  hide() {
    if (this.panelContainer) {
      // Get the wrapper container and trigger pop-out animation
      const wrapperContainer = this.panelContainer.querySelector('.vocab-wrapper-container');
      if (wrapperContainer) {
        // Remove any previous animation classes
        wrapperContainer.classList.remove('pop-in', 'pop-out');
        // Force reflow to ensure class removal is processed
        void wrapperContainer.offsetHeight;
        // Add pop-out animation class
        wrapperContainer.classList.add('pop-out');
        
        // Wait for animation to complete before hiding
        setTimeout(() => {
          this.panelContainer.style.display = 'none';
          wrapperContainer.classList.remove('pop-out');
          console.log('[ButtonPanel] Panel hidden');
        }, 300); // Match animation duration
      } else {
        // Fallback if wrapper container not found
        this.panelContainer.style.display = 'none';
        console.log('[ButtonPanel] Panel hidden');
      }
    }
  },

  /**
   * Remove the button panel from DOM
   */
  destroy() {
    if (this.panelContainer) {
      this.panelContainer.remove();
      this.panelContainer = null;
    }
  },

  /**
   * Smoothly show a button with animation
   */
  showButtonSmooth(button) {
    if (!button) return;
    
    if (button.classList.contains('hidden')) {
      button.classList.remove('hidden');
      button.classList.add('showing');
      
      // Remove showing class after animation (400ms to match animation duration)
      setTimeout(() => {
        button.classList.remove('showing');
      }, 400);
    }
  },

  /**
   * Smoothly hide a button with animation
   */
  hideButtonSmooth(button) {
    if (!button) return;
    
    if (!button.classList.contains('hidden')) {
      button.classList.add('hiding');
      
      // Wait for animation to complete, then hide (350ms to match animation duration)
      setTimeout(() => {
        button.classList.remove('hiding');
        button.classList.add('hidden');
      }, 350);
    }
  },

  /**
   * Update button states based on state variables
   */
  updateButtonStates() {
    // Hide upper button group since it's now empty
    if (this.upperButtonGroup) {
      this.upperButtonGroup.classList.remove('visible');
    }

    // Update enabled/disabled state of magic meaning button
    const magicMeaningBtn = document.getElementById('magic-meaning');
    if (magicMeaningBtn) {
      const wasDisabled = magicMeaningBtn.classList.contains('disabled');
      
      if (this.state.isMagicMeaningEnabled) {
        magicMeaningBtn.classList.remove('disabled');
        magicMeaningBtn.disabled = false; // Remove disabled attribute
      } else {
        magicMeaningBtn.classList.add('disabled');
        magicMeaningBtn.disabled = true; // Add disabled attribute
      }
    }

    // Update visibility of Ask button with smooth animation
    const askBtn = document.getElementById('ask');
    if (askBtn) {
      if (this.state.showAsk) {
        this.showButtonSmooth(askBtn);
      } else {
        this.hideButtonSmooth(askBtn);
      }
    }
  },


  /**
   * Update state and refresh button states
   * @param {Object} newState - Partial state object to update
   */
  updateState(newState) {
    this.state = { ...this.state, ...newState };
    this.updateButtonStates();
    console.log('Button panel state updated:', this.state);
  },
  
  /**
   * Update button states based on selections
   */
  updateButtonStatesFromSelections() {
    const hasWords = WordSelector.selectedWords.size > 0;
    const hasTexts = TextSelector.selectedTexts.size > 0;
    const hasExactlyOneText = TextSelector.selectedTexts.size === 1;
    
    // Get current context
    const context = this.getCurrentContentContext();
    console.log('[ButtonPanel] Current context for button states:', context);
    
    // Check for meanings in current context only
    const hasAskedTextsInContext = Array.from(TextSelector.askedTexts.keys()).some(textKey => 
      this.isTextKeyInCurrentContext(textKey, context)
    );
    const hasSimplifiedTextsInContext = Array.from(TextSelector.simplifiedTexts.keys()).some(textKey => 
      this.isTextKeyInCurrentContext(textKey, context)
    );
    const hasExplainedWordsInContext = Array.from(WordSelector.explainedWords.keys()).some(word => 
      this.isWordInCurrentContext(word, context)
    );
    
    // Debug logging
    console.log('[ButtonPanel] Button state checks:', {
      context: context.type,
      hasWords,
      hasTexts,
      hasAskedTextsInContext,
      hasSimplifiedTextsInContext,
      hasExplainedWordsInContext,
      totalAskedTexts: TextSelector.askedTexts.size,
      totalSimplifiedTexts: TextSelector.simplifiedTexts.size,
      totalExplainedWords: WordSelector.explainedWords.size,
      askedTextKeys: Array.from(TextSelector.askedTexts.keys()),
      simplifiedTextKeys: Array.from(TextSelector.simplifiedTexts.keys()),
      explainedWordKeys: Array.from(WordSelector.explainedWords.keys())
    });
    
    // Legacy global checks (for backward compatibility)
    const hasAskedTexts = TextSelector.askedTexts.size > 0;
    const hasSimplifiedTexts = TextSelector.simplifiedTexts.size > 0;
    const hasExplainedWords = WordSelector.explainedWords.size > 0;
    
    console.log('[ButtonPanel] Updating button states:', {
      context: context.type,
      hasWords,
      hasTexts,
      hasAskedTextsInContext,
      hasSimplifiedTextsInContext,
      hasExplainedWordsInContext
    });
    
    
    // Enable "Magic meaning" if there are any words or texts selected
    this.setMagicMeaningEnabled(hasWords || hasTexts);
    
    // Show "Ask" only if exactly one text is selected AND custom content modal is not open
    const isCustomModalOpen = this.isCustomContentModalOpen();
    this.setAskVisible(hasExactlyOneText && !isCustomModalOpen);
  },



  /**
   * Set enabled state of Magic meaning button
   * @param {boolean} enabled - Whether to enable the button
   */
  setMagicMeaningEnabled(enabled) {
    this.updateState({ isMagicMeaningEnabled: enabled });
  },

  /**
   * Set visibility of Ask button
   * @param {boolean} show - Whether to show the button
   */
  setAskVisible(show) {
    this.updateState({ showAsk: show });
  },

  /**
   * Show notification banner at top right corner
   * @param {string} message - Message to display
   * @param {string} type - Type of notification ('success', 'error', 'info')
   */
  showNotification(message, type = 'info') {
    console.log('[ButtonPanel] ===== SHOWING NOTIFICATION =====');
    console.log('[ButtonPanel] Message:', message);
    console.log('[ButtonPanel] Type:', type);
    
    // Check if notification already exists
    const existingNotification = document.getElementById('vocab-button-panel-notification');
    if (existingNotification) {
      existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.id = 'vocab-button-panel-notification';
    notification.className = `vocab-notification vocab-notification-${type}`;
    
    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'vocab-notification-close';
    closeBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 3L3 9M3 3l6 6" stroke="#9527F5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    
    // Close button click handler
    closeBtn.addEventListener('click', () => {
      notification.classList.remove('visible');
      setTimeout(() => {
        notification.remove();
      }, 300);
    });
    
    // Create message text
    const messageText = document.createElement('span');
    messageText.className = 'vocab-notification-message';
    messageText.textContent = message;
    
    // Assemble notification
    notification.appendChild(closeBtn);
    notification.appendChild(messageText);
    
    // Add to document
    document.body.appendChild(notification);
    
    // Show with animation
    setTimeout(() => {
      notification.classList.add('visible');
    }, 100);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.classList.remove('visible');
        setTimeout(() => {
          notification.remove();
        }, 300);
      }
    }, 5000);
    
    console.log('[ButtonPanel] Notification displayed successfully');
  },

  /**
   * Handle PDF file upload and processing
   * @param {File} file - The PDF file to process
   */
  async handlePDFUpload(file) {
    console.log('[ButtonPanel] ===== PDF UPLOAD PROCESSING STARTED =====');
    console.log('[ButtonPanel] Processing file:', file.name);
    
    try {
      console.log('[ButtonPanel] Creating FormData for API call...');
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      
      console.log('[ButtonPanel] Making API call to:', ApiConfig.getUrl(ApiConfig.ENDPOINTS.PDF_TO_TEXT));
      // Make API call to process PDF
      const response = await fetch(ApiConfig.getUrl(ApiConfig.ENDPOINTS.PDF_TO_TEXT), {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      console.log('[ButtonPanel] API response received, status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[ButtonPanel] ===== API SUCCESS =====');
      console.log('[ButtonPanel] Response data:', data);
      console.log('[ButtonPanel] Text content length:', data.text ? data.text.length : 'No text');
      
      // API SUCCESS: Close both processing overlay and PDF modal, then open custom content modal
      console.log('[ButtonPanel] Hiding processing overlay...');
      this.hidePDFProcessingOverlayFromModal();
      
      console.log('[ButtonPanel] Closing PDF upload modal...');
      this.hidePDFUploadModal();
      
      console.log('[ButtonPanel] Creating PDF tab and loading content...');
      await this.createPDFTabAndLoadContent(file.name, data.text);
      
      console.log('[ButtonPanel] ===== PDF UPLOAD PROCESSING COMPLETED SUCCESSFULLY =====');
      
    } catch (error) {
      console.error('[ButtonPanel] ===== API ERROR =====');
      console.error('[ButtonPanel] Error details:', error);
      
      // API ERROR: Close processing overlay, keep PDF modal open, show error banner
      console.log('[ButtonPanel] Hiding processing overlay due to error...');
      this.hidePDFProcessingOverlayFromModal();
      
      console.log('[ButtonPanel] Keeping PDF modal open and showing error notification...');
      this.showNotification('Failed to process PDF file. Please try again.', 'error');
      
      console.log('[ButtonPanel] ===== PDF UPLOAD PROCESSING FAILED =====');
    }
  },

  /**
   * Show PDF processing loading state
   */
  showPDFProcessingState() {
    console.log('[ButtonPanel] Showing PDF processing overlay');
    
    // Create processing overlay if it doesn't exist
    if (!this.topicsModal.processingOverlay) {
      this.createProcessingOverlay();
    }
    
    // Update the processing text for PDF
    const processingText = this.topicsModal.processingOverlay.querySelector('.vocab-processing-text');
    if (processingText) {
      processingText.textContent = 'Reading PDF file';
    }
    
    // Show the overlay
    this.topicsModal.processingOverlay.classList.add('visible');
  },

  /**
   * Hide PDF processing loading state
   */
  hidePDFProcessingState() {
    console.log('[ButtonPanel] Hiding PDF processing overlay');
    
    if (this.topicsModal.processingOverlay) {
      this.topicsModal.processingOverlay.classList.remove('visible');
    }
  },

  /**
   * Create PDF tab and load generated content
   * @param {string} fileName - Name of the PDF file
   * @param {string} content - Generated markdown content
   */
  async createPDFTabAndLoadContent(fileName, content) {
    console.log('[ButtonPanel] ===== CREATING PDF TAB AND LOADING CONTENT =====');
    console.log('[ButtonPanel] File name:', fileName);
    console.log('[ButtonPanel] Content length:', content ? content.length : 'No content');
    
    // Set current content type
    this.topicsModal.currentContentType = 'pdf';
    
    // Create PDF content using the new data structure
    const tabName = fileName.replace('.pdf', '');
    console.log('[ButtonPanel] Creating content with name:', tabName);
    
    const newContent = this.topicsModal.customContentModal.addContent('pdf', tabName, content, {
      fileName: fileName,
      uploadedAt: new Date().toISOString()
    });
    
    if (!newContent) {
      console.error('[ButtonPanel] ===== FAILED TO CREATE PDF CONTENT =====');
      this.showNotification('Failed to create PDF content. Please try again.', 'error');
      return;
    }

    console.log('[ButtonPanel] PDF content created successfully');
    
    // Show modal with only PDF contents, and switch to the new tab
    this.showCustomContentModalWithContents('pdf', newContent.tabId);
    
    // Ensure custom content modal is visible
    console.log('[ButtonPanel] Ensuring custom content modal is visible...');
    if (!this.topicsModal.customContentModal.overlay.classList.contains('visible')) {
      this.topicsModal.customContentModal.overlay.classList.add('visible');
      
      // Clear all selections when opening modal
      this.clearSelectionsOnModalOpen();
      
      // Add class to body to hide webpage icons
      document.body.classList.add('vocab-custom-content-modal-open');
      
      console.log('[ButtonPanel] Custom content modal is now visible');
    } else {
      console.log('[ButtonPanel] Custom content modal was already visible');
    }
    
    // Update modal title
    console.log('[ButtonPanel] Updating modal title to PDF...');
    this.updateCustomContentModalTitle('pdf');
    
    // Load content in editor
    console.log('[ButtonPanel] Loading content in editor...');
    console.log('[ButtonPanel] Content preview:', content.substring(0, 200) + '...');
    this.updateCustomContentEditor(content);
    
    console.log('[ButtonPanel] ===== PDF TAB CREATED AND CONTENT LOADED SUCCESSFULLY =====');
  },

  // ===================================
  // Topics Modal Functionality
  // ===================================
  
  /**
   * Topics modal state
   */
  topicsModal: {
    overlay: null,
    modal: null,
    topics: [],
    wordCount: 100,
    difficulty: 'hard',
    processingOverlay: null,
    currentContentType: 'topic', // Track which content type is currently active ('pdf', 'image', 'topic', 'text')
    textInputModal: null, // Text input modal
    customContentModal: {
      overlay: null,
      modal: null,
      searchTerm: '',
      activeTabId: null,
      activeContentType: null, // 'pdf', 'image', 'topic', 'text'
      
      // New simplified data structure
      topicContents: [],
      imageContents: [],
      pdfContents: [],
      textContents: [],
      nextTabId: 1, // Global counter for unique tab IDs
      
      // Helper methods for content management
      getContentByType: function(contentType) {
        switch(contentType) {
          case 'topic': return this.topicContents;
          case 'image': return this.imageContents;
          case 'pdf': return this.pdfContents;
          case 'text': return this.textContents;
          default: return [];
        }
      },
      
      getContentByTabId: function(tabId) {
        // Search through all content types to find the content with matching tabId
        // Return reference to original object, not a copy
        for (let i = 0; i < this.topicContents.length; i++) {
          if (this.topicContents[i].tabId === tabId) {
            this.topicContents[i].contentType = 'topic';
            return this.topicContents[i];
          }
        }
        
        for (let i = 0; i < this.imageContents.length; i++) {
          if (this.imageContents[i].tabId === tabId) {
            this.imageContents[i].contentType = 'image';
            return this.imageContents[i];
          }
        }
        
        for (let i = 0; i < this.pdfContents.length; i++) {
          if (this.pdfContents[i].tabId === tabId) {
            this.pdfContents[i].contentType = 'pdf';
            return this.pdfContents[i];
          }
        }
        
        for (let i = 0; i < this.textContents.length; i++) {
          if (this.textContents[i].tabId === tabId) {
            this.textContents[i].contentType = 'text';
            return this.textContents[i];
          }
        }
        
        return null;
      },
      
      removeContentByTabId: function(tabId) {
        console.log('[ButtonPanel] ===== REMOVE CONTENT BY TAB ID DEBUG =====');
        console.log('[ButtonPanel] removeContentByTabId called with tabId:', tabId);
        console.log('[ButtonPanel] Before removal - Topic contents:', this.topicContents);
        console.log('[ButtonPanel] Before removal - Image contents:', this.imageContents);
        console.log('[ButtonPanel] Before removal - PDF contents:', this.pdfContents);
        console.log('[ButtonPanel] Before removal - Text contents:', this.textContents);
        
        // Find and remove content by tabId
        const content = this.getContentByTabId(tabId);
        console.log('[ButtonPanel] Found content:', content);
        
        if (!content) {
          console.log('[ButtonPanel] No content found for tabId:', tabId);
          console.log('[ButtonPanel] ===== END REMOVE CONTENT DEBUG (NO CONTENT FOUND) =====');
          return false;
        }
        
        const contentType = content.contentType;
        console.log('[ButtonPanel] Content type:', contentType);
        
        const contents = this.getContentByType(contentType);
        console.log('[ButtonPanel] Contents array before removal:', contents);
        
        const index = contents.findIndex(item => item.tabId === tabId);
        console.log('[ButtonPanel] Index to remove:', index);
        
        if (index !== -1) {
          contents.splice(index, 1);
          console.log('[ButtonPanel] Content removed successfully');
          console.log('[ButtonPanel] After removal - Topic contents:', this.topicContents);
          console.log('[ButtonPanel] After removal - Image contents:', this.imageContents);
          console.log('[ButtonPanel] After removal - PDF contents:', this.pdfContents);
          console.log('[ButtonPanel] After removal - Text contents:', this.textContents);
          console.log('[ButtonPanel] ===== END REMOVE CONTENT DEBUG (SUCCESS) =====');
          
          // Update content indicators after removing content
          if (window.ButtonPanel && window.ButtonPanel.updateContentIndicators) {
            window.ButtonPanel.updateContentIndicators();
          }
          
          return content; // Return the content object so cleanup can be done by caller
        }
        
        console.log('[ButtonPanel] Content not found in array');
        console.log('[ButtonPanel] ===== END REMOVE CONTENT DEBUG (NOT FOUND) =====');
        return false;
      },
      
      // Migration function to ensure all existing content objects have contentType field
      migrateContentTypes: function() {
        // Migrate topic contents
        this.topicContents.forEach(content => {
          if (!content.contentType) {
            content.contentType = 'topic';
            console.log('[CustomContentModal] Migrated topic content to have contentType');
          }
        });
        
        // Migrate image contents
        this.imageContents.forEach(content => {
          if (!content.contentType) {
            content.contentType = 'image';
            console.log('[CustomContentModal] Migrated image content to have contentType');
          }
        });
        
        // Migrate PDF contents
        this.pdfContents.forEach(content => {
          if (!content.contentType) {
            content.contentType = 'pdf';
            console.log('[CustomContentModal] Migrated PDF content to have contentType');
          }
        });
        
        // Migrate text contents
        this.textContents.forEach(content => {
          if (!content.contentType) {
            content.contentType = 'text';
            console.log('[CustomContentModal] Migrated text content to have contentType');
          }
        });
      },
      
      addContent: function(contentType, tabName, content, metadata = {}) {
        const newContent = {
          tabId: this.nextTabId++,
          tabName: tabName,
          content: content,
          contentType: contentType, // Store the content type
          input: {
            topics: metadata.topics || [],
            wordCount: metadata.wordCount || 100,
            difficultyLevel: metadata.difficulty || 'HARD'
          },
          metadata: metadata,
          searchTerm: '',
          createdAt: new Date().toISOString(),
          analysis: {
            wordMeanings: [], // Store word meaning objects here per each word
            simplifiedMeanings: [], // Store word simplified (expln1, expln2 for a selected text) explanations per each selected text
            chats: [] // Store chats
          }
        };
        
        // Ensure all existing content objects have contentType field (migration)
        this.migrateContentTypes();
        
        switch(contentType) {
          case 'topic':
            this.topicContents.push(newContent);
            break;
          case 'image':
            this.imageContents.push(newContent);
            break;
          case 'pdf':
            this.pdfContents.push(newContent);
            break;
          case 'text':
            this.textContents.push(newContent);
            break;
          default:
            return null;
        }
        
        // Update content indicators after adding content
        if (window.ButtonPanel && window.ButtonPanel.updateContentIndicators) {
          window.ButtonPanel.updateContentIndicators();
        }
        
        // FORCE topics indicator to be visible if topics content was added
        if (contentType === 'topic') {
          setTimeout(() => {
            const topicsIndicator = document.getElementById('topics-content-indicator');
            if (topicsIndicator) {
              topicsIndicator.style.display = 'block';
              topicsIndicator.style.visibility = 'visible';
              topicsIndicator.style.opacity = '1';
              topicsIndicator.style.backgroundColor = '#16a34a';
              topicsIndicator.style.border = '1px solid white';
              console.log('[ButtonPanel] FORCED topics indicator to be visible after content added');
            }
          }, 100);
        }
        
        return newContent;
      },
      
      removeContent: function(contentType, index) {
        const contents = this.getContentByType(contentType);
        if (index >= 0 && index < contents.length) {
          contents.splice(index, 1);
          
          // Update content indicators after removing content
          if (window.ButtonPanel && window.ButtonPanel.updateContentIndicators) {
            window.ButtonPanel.updateContentIndicators();
          }
          
          return true;
        }
        return false;
      },
      
      clearContentType: function(contentType) {
        switch(contentType) {
          case 'topic':
            this.topicContents = [];
            break;
          case 'image':
            this.imageContents = [];
            break;
          case 'pdf':
            this.pdfContents = [];
            break;
          case 'text':
            this.textContents = [];
            break;
        }
        
        // Update content indicators after clearing content
        if (window.ButtonPanel && window.ButtonPanel.updateContentIndicators) {
          window.ButtonPanel.updateContentIndicators();
        }
      },
      
      clearAllContents: function() {
        this.topicContents = [];
        this.imageContents = [];
        this.pdfContents = [];
        this.textContents = [];
        
        // Update content indicators after clearing all content
        if (window.ButtonPanel && window.ButtonPanel.updateContentIndicators) {
          window.ButtonPanel.updateContentIndicators();
        }
      },
      
      getAllTabs: function() {
        console.log('[ButtonPanel] ===== GET ALL TABS DEBUG =====');
        console.log('[ButtonPanel] Topic contents length:', this.topicContents.length);
        console.log('[ButtonPanel] Image contents length:', this.imageContents.length);
        console.log('[ButtonPanel] PDF contents length:', this.pdfContents.length);
        console.log('[ButtonPanel] Text contents length:', this.textContents.length);
        
        // Return all tabs from all content types
        const allTabs = [
          ...this.topicContents.map(content => ({ ...content, id: content.tabId.toString() })),
          ...this.imageContents.map(content => ({ ...content, id: content.tabId.toString() })),
          ...this.pdfContents.map(content => ({ ...content, id: content.tabId.toString() })),
          ...this.textContents.map(content => ({ ...content, id: content.tabId.toString() }))
        ];
        
        console.log('[ButtonPanel] All tabs result:', allTabs);
        console.log('[ButtonPanel] All tabs length:', allTabs.length);
        console.log('[ButtonPanel] ===== END GET ALL TABS DEBUG =====');
        
        return allTabs;
      },
      
      getTabsByType: function(contentType) {
        // Return tabs for a specific content type
        const contents = this.getContentByType(contentType);
        return contents.map(content => ({ ...content, id: content.tabId.toString() }));
      }
    }
  },

  /**
   * Create and show the topics modal
   * @param {boolean} clearInputs - Whether to clear inputs (true for new content, false for regeneration)
   */
  showTopicsModal(clearInputs = true) {
    console.log('[ButtonPanel] Showing topics modal, clearInputs:', clearInputs);
    
  
    // Create modal if it doesn't exist
    if (!this.topicsModal.overlay) {
      this.createTopicsModal();
      
      // Wait for DOM to be ready before showing modal using a single requestAnimationFrame
      requestAnimationFrame(() => {
        this.showModalWithAnimation();
      });
    
      // Hide the vertical button group
      this.hideVerticalButtonGroup();
    } else {
      // Modal already exists
      if (clearInputs) {
        // Clear inputs for new content
        this.clearTopicsModalInputs();
      }
      this.showModalWithAnimation();
    }
  },

  /**
   * Show modal with animation and initialize everything
   */
  showModalWithAnimation() {
    // Clear all selections when opening modal
    this.clearSelectionsOnModalOpen();
    
    // Show modal with animation
    this.topicsModal.overlay.classList.add('visible');
    this.topicsModal.modal.classList.add('visible');
    
    // Add class to body to blur webpage icons
    document.body.classList.add('vocab-topics-modal-open');
    
    // Focus on input field
    const input = this.topicsModal.modal.querySelector('.vocab-topics-input');
    if (input) {
      setTimeout(() => input.focus(), 300);
    }
    
    // Initialize plus icon state
    setTimeout(() => {
      if (this.updatePlusIconState) {
        this.updatePlusIconState();
      }
    }, 300);
    
    // Initialize topics UI state
    setTimeout(() => {
      this.updateTopicsUIState();
    }, 300);
  },

  /**
   * Hide the topics modal
   */
  hideTopicsModal() {
    console.log('[ButtonPanel] Hiding topics modal');
    
    if (this.topicsModal.overlay) {
      this.topicsModal.overlay.classList.remove('visible');
      this.topicsModal.modal.classList.remove('visible');
    }
    
    // Remove class from body to show webpage icons again
    document.body.classList.remove('vocab-topics-modal-open');
    
    // Remove blur from custom content modal if it was blurred
    if (this.topicsModal.customContentModal.overlay) {
      this.topicsModal.customContentModal.overlay.style.filter = 'none';
    }
    
    // Only show the custom content button if the CustomContent modal is not open
    // AND if we're not in the process of showing it (check if overlay exists)
    if ((!this.topicsModal.customContentModal.overlay || 
         !this.topicsModal.customContentModal.overlay.classList.contains('visible'))) {
      this.showCustomContentButton();
    }

    // Clear inputs on close so next open starts clean
    this.clearTopicsModalInputs();
  },

  /**
   * Create the topics modal HTML structure
   */
  createTopicsModal() {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'vocab-topics-modal-overlay';
    overlay.id = 'vocab-topics-modal-overlay';
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'vocab-topics-modal';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'vocab-topics-modal-header';
    
    const title = document.createElement('h2');
    title.className = 'vocab-topics-modal-title';
    title.textContent = 'Enter keywords or topic you want to study on';
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'vocab-topics-modal-close';
    closeBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 4L4 12M4 4L12 12" stroke="#A24EFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    closeBtn.setAttribute('aria-label', 'Close modal');
    
    header.appendChild(title);
    
    // Create first container (input + generate button)
    const firstContainer = document.createElement('div');
    firstContainer.className = 'vocab-topics-first-container';
    
    // Input section (left side of first container)
    const inputSection = document.createElement('div');
    inputSection.className = 'vocab-topics-input-section';
    
    const inputContainer = document.createElement('div');
    inputContainer.className = 'vocab-topics-input-container';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'vocab-topics-input';
    input.placeholder = 'Type keywords or topic here';
    
    const searchIcon = document.createElement('div');
    searchIcon.className = 'vocab-topics-search-icon disabled';
    searchIcon.innerHTML = this.createPlusIcon();
    
    inputContainer.appendChild(input);
    inputContainer.appendChild(searchIcon);
    inputSection.appendChild(inputContainer);
    
    // Generate button (right side of first container)
    const generateBtn = document.createElement('button');
    generateBtn.className = 'vocab-topics-generate-btn hidden';
    generateBtn.textContent = 'Generate content';
    
    firstContainer.appendChild(inputSection);
    
    // Create second container (topic tags + controls)
    const secondContainer = document.createElement('div');
    secondContainer.className = 'vocab-topics-second-container hidden';
    
    // Topic tags section (left side of second container)
    const tagsSection = document.createElement('div');
    tagsSection.className = 'vocab-topics-tags-section';
    
    const tagsContainer = document.createElement('div');
    tagsContainer.className = 'vocab-topics-tags-container';
    
    const tags = document.createElement('div');
    tags.className = 'vocab-topics-tags';
    tags.id = 'vocab-topics-tags';
    
    // Tags container starts empty
    tagsContainer.appendChild(tags);
    tagsSection.appendChild(tagsContainer);
    
    // Controls section (right side of second container)
    const controlsSection = document.createElement('div');
    controlsSection.className = 'vocab-topics-controls-section';
    
    // Word count control (top of controls section)
    const wordCountGroup = document.createElement('div');
    wordCountGroup.className = 'vocab-topics-word-count-group';
    
    const wordCountLabel = document.createElement('h3');
    wordCountLabel.className = 'vocab-topics-control-label';
    wordCountLabel.textContent = 'Total Word Count';
    
    const wordCountButtons = document.createElement('div');
    wordCountButtons.className = 'vocab-topics-word-count-buttons';
    
    // Create sliding background
    const wordCountSlider = document.createElement('div');
    wordCountSlider.className = 'vocab-topics-word-count-slider';
    wordCountSlider.id = 'word-count-slider';
    
    const btn100 = document.createElement('button');
    btn100.className = 'vocab-topics-word-count-btn selected';
    btn100.textContent = '100';
    btn100.setAttribute('data-count', '100');
    
    const btn250 = document.createElement('button');
    btn250.className = 'vocab-topics-word-count-btn';
    btn250.textContent = '250';
    btn250.setAttribute('data-count', '250');
    
    const btn500 = document.createElement('button');
    btn500.className = 'vocab-topics-word-count-btn';
    btn500.textContent = '500';
    btn500.setAttribute('data-count', '500');
    
    wordCountButtons.appendChild(wordCountSlider);
    wordCountButtons.appendChild(btn100);
    wordCountButtons.appendChild(btn250);
    wordCountButtons.appendChild(btn500);
    
    wordCountGroup.appendChild(wordCountLabel);
    wordCountGroup.appendChild(wordCountButtons);
    
    // Difficulty control (bottom of controls section)
    const difficultyGroup = document.createElement('div');
    difficultyGroup.className = 'vocab-topics-difficulty-group';
    
    const difficultyLabel = document.createElement('h3');
    difficultyLabel.className = 'vocab-topics-control-label';
    difficultyLabel.textContent = 'Difficulty Level';
    
    const difficultyButtons = document.createElement('div');
    difficultyButtons.className = 'vocab-topics-difficulty-buttons';
    
    // Create sliding background
    const difficultySlider = document.createElement('div');
    difficultySlider.className = 'vocab-topics-difficulty-slider';
    difficultySlider.id = 'difficulty-slider';
    
    const easyBtn = document.createElement('button');
    easyBtn.className = 'vocab-topics-difficulty-btn easy';
    easyBtn.textContent = 'Easy';
    easyBtn.setAttribute('data-difficulty', 'easy');
    
    const mediumBtn = document.createElement('button');
    mediumBtn.className = 'vocab-topics-difficulty-btn medium';
    mediumBtn.textContent = 'Medium';
    mediumBtn.setAttribute('data-difficulty', 'medium');
    
    const hardBtn = document.createElement('button');
    hardBtn.className = 'vocab-topics-difficulty-btn hard selected';
    hardBtn.textContent = 'Hard';
    hardBtn.setAttribute('data-difficulty', 'hard');
    
    difficultyButtons.appendChild(difficultySlider);
    difficultyButtons.appendChild(easyBtn);
    difficultyButtons.appendChild(mediumBtn);
    difficultyButtons.appendChild(hardBtn);
    
    difficultyGroup.appendChild(difficultyLabel);
    difficultyGroup.appendChild(difficultyButtons);
    
    // Assemble controls section
    controlsSection.appendChild(wordCountGroup);
    controlsSection.appendChild(difficultyGroup);
    
    // Assemble second container
    secondContainer.appendChild(tagsSection);
    secondContainer.appendChild(controlsSection);
    
    // Create content container for everything except header and generate button
    const contentContainer = document.createElement('div');
    contentContainer.className = 'vocab-topics-content-container';
    
    // Add content to the container (excluding generate button)
    contentContainer.appendChild(firstContainer);
    contentContainer.appendChild(secondContainer);
    
    // Assemble modal
    modal.appendChild(header);
    modal.appendChild(contentContainer);
    modal.appendChild(generateBtn);
    modal.appendChild(closeBtn);
    
    overlay.appendChild(modal);
    
    // Add to document
    document.body.appendChild(overlay);
    
    // Store references
    this.topicsModal.overlay = overlay;
    this.topicsModal.modal = modal;
    
    // Attach event listeners
    this.attachTopicsModalListeners();
  },

  /**
   * Attach event listeners to topics modal
   */
  attachTopicsModalListeners() {
    const overlay = this.topicsModal.overlay;
    const modal = this.topicsModal.modal;
    
    const input = modal.querySelector('.vocab-topics-input');
    const closeBtn = modal.querySelector('.vocab-topics-modal-close');
    const generateBtn = modal.querySelector('.vocab-topics-generate-btn');
    const wordCountButtons = modal.querySelectorAll('.vocab-topics-word-count-btn');
    const difficultyButtons = modal.querySelectorAll('.vocab-topics-difficulty-btn');
    const plusIcon = modal.querySelector('.vocab-topics-search-icon');
    
    // Check for null elements before adding listeners
    if (!overlay || !modal || !closeBtn || !input || !generateBtn || !plusIcon) {
      console.error('Topics modal: Missing required elements for event listeners');
      return;
    }
    
    // Close modal events
    closeBtn.addEventListener('click', () => this.hideTopicsModal());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.hideTopicsModal();
      }
    });
    
    // Function to add topic
    const addTopicFromInput = () => {
      const topic = input.value.trim();
      if (topic) {
        this.addTopic(topic);
        input.value = '';
        updatePlusIconState();
      }
    };
    
    // Function to update plus icon state
    const updatePlusIconState = () => {
      if (plusIcon) {
        if (input.value.trim()) {
          plusIcon.classList.remove('disabled');
        } else {
          plusIcon.classList.add('disabled');
        }
      }
    };
    
    // Store reference for external access
    this.updatePlusIconState = updatePlusIconState;
    
    // Initialize plus icon state immediately
    updatePlusIconState();
    
    // Input events - add topic on Enter
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault(); // Prevent form submission if this is in a form
        addTopicFromInput();
      }
    });
    
    // Input change events - update plus icon state
    input.addEventListener('input', () => {
      updatePlusIconState();
    });
    
    // Plus icon click event
    plusIcon.addEventListener('click', () => {
      if (!plusIcon.classList.contains('disabled')) {
        addTopicFromInput();
      }
    });
    
    // Generate button
    generateBtn.addEventListener('click', () => this.handleGenerateStory());
    
    // Word count buttons
    wordCountButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        // Don't remove selected class yet - animate first
        // Animate slider to new position
        this.animateSlider('word-count-slider', e.target);
        
        // Update word count
        this.topicsModal.wordCount = parseInt(e.target.getAttribute('data-count'));
        
        // Remove selected class from all buttons after animation starts
        wordCountButtons.forEach(b => b.classList.remove('selected'));
        
        // Add selected class to clicked button
        e.target.classList.add('selected');
      });
    });
    
    // Difficulty buttons
    difficultyButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        // Don't remove selected class yet - animate first
        // Animate slider to new position and update color
        this.animateSlider('difficulty-slider', e.target);
        this.updateDifficultySliderColor(e.target);
        
        // Update difficulty
        this.topicsModal.difficulty = e.target.getAttribute('data-difficulty');
        
        // Remove selected class from all buttons after animation starts
        difficultyButtons.forEach(b => b.classList.remove('selected'));
        
        // Add selected class to clicked button
        e.target.classList.add('selected');
      });
    });
  },

  /**
   * Add a topic to the list
   * @param {string} topic - The topic to add
   */
  addTopic(topic) {
    if (!topic || this.topicsModal.topics.includes(topic)) {
      return;
    }
    
    console.log('[ButtonPanel] Adding topic:', topic);
    
    // Add to topics array
    this.topicsModal.topics.push(topic);
    
    // Create and add tag element
    const tag = this.createTopicTag(topic);
    const tagsContainer = this.topicsModal.modal.querySelector('#vocab-topics-tags');
    tagsContainer.appendChild(tag);
    
    // Update UI state
    this.updateTopicsUIState();
  },

  /**
   * Create a topic tag element
   * @param {string} topic - The topic text
   * @returns {HTMLElement} Topic tag element
   */
  createTopicTag(topic) {
    const tag = document.createElement('div');
    tag.className = 'vocab-topics-tag';
    tag.setAttribute('data-topic', topic);
    
    const tagText = document.createElement('span');
    tagText.textContent = topic;
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'vocab-topics-tag-remove';
    removeBtn.innerHTML = '×';
    removeBtn.setAttribute('aria-label', `Remove ${topic}`);
    
    tag.appendChild(tagText);
    tag.appendChild(removeBtn);
    
    // Add remove event listener
    removeBtn.addEventListener('click', () => this.removeTopic(topic));
    
    return tag;
  },

  /**
   * Remove a topic from the list
   * @param {string} topic - The topic to remove
   */
  removeTopic(topic) {
    console.log('[ButtonPanel] Removing topic:', topic);
    
    // Remove from topics array
    const index = this.topicsModal.topics.indexOf(topic);
    if (index > -1) {
      this.topicsModal.topics.splice(index, 1);
    }
    
    // Remove tag element
    const tag = this.topicsModal.modal.querySelector(`[data-topic="${topic}"]`);
    if (tag) {
      tag.remove();
    }
    
    // Update UI state
    this.updateTopicsUIState();
  },

  /**
   * Update UI state based on whether there are topics
   */
  updateTopicsUIState() {
    // Check if topics modal exists before trying to access it
    if (!this.topicsModal.modal) {
      console.log('[ButtonPanel] Topics modal does not exist, skipping updateTopicsUIState');
      return;
    }
    
    const hasTopics = this.topicsModal.topics.length > 0;
    const secondContainer = this.topicsModal.modal.querySelector('.vocab-topics-second-container');
    const generateBtn = this.topicsModal.modal.querySelector('.vocab-topics-generate-btn');
    const contentContainer = this.topicsModal.modal.querySelector('.vocab-topics-content-container');
    
    if (secondContainer) {
      if (hasTopics) {
        secondContainer.classList.remove('hidden');
        // Ensure it's visible and interactive
        secondContainer.style.display = 'flex';
        
        // Initialize sliders after container becomes visible
        setTimeout(() => {
          this.initializeSliders();
        }, 100);
      } else {
        secondContainer.classList.add('hidden');
        // Hide after animation completes
        setTimeout(() => {
          if (secondContainer.classList.contains('hidden')) {
            secondContainer.style.display = 'none';
          }
        }, 300);
      }
    }
    
    if (generateBtn) {
      if (hasTopics) {
        generateBtn.classList.remove('hidden');
        // Ensure it's visible and interactive
        generateBtn.style.display = 'block';
      } else {
        generateBtn.classList.add('hidden');
        // Hide after animation completes
        setTimeout(() => {
          if (generateBtn.classList.contains('hidden')) {
            generateBtn.style.display = 'none';
          }
        }, 300);
      }
    }
  },

  /**
   * Handle generate story button click
   */
  async handleGenerateStory() {
    console.log('[ButtonPanel] ===== GENERATE STORY STARTED =====');
    console.log('[ButtonPanel] Generating story with topics:', this.topicsModal.topics);
    console.log('[ButtonPanel] Word count:', this.topicsModal.wordCount);
    console.log('[ButtonPanel] Difficulty:', this.topicsModal.difficulty);
    console.log('[ButtonPanel] customContentModal state:', this.topicsModal.customContentModal);
    
    if (this.topicsModal.topics.length === 0) {
      alert('Please add at least one topic before generating a story.');
      return;
    }
    
    // Check if this is a regeneration
    const generateBtn = this.topicsModal.modal.querySelector('.vocab-topics-generate-btn');
    const isRegenerate = generateBtn && generateBtn.getAttribute('data-regenerate') === 'true';
    const tabId = generateBtn ? generateBtn.getAttribute('data-tab-id') : null;
    
    // Show processing overlay
    this.showProcessingOverlay();
    
    try {
      // Call the get-random-paragraph API
      const response = await ApiService.getRandomParagraph({
        topics: this.topicsModal.topics,
        difficulty_level: this.topicsModal.difficulty,
        word_count: this.topicsModal.wordCount
      });
      
      if (response.success) {
        console.log('[ButtonPanel] API response successful');
        // Hide processing overlay
        this.hideProcessingOverlay();
        
        if (isRegenerate && tabId) {
          console.log('[ButtonPanel] Regenerating content for tab:', tabId);
          // Update existing content using new data structure
          const content = this.topicsModal.customContentModal.getContentByTabId(parseInt(tabId));
          if (content) {
            // Update content
            content.content = response.data.text;
            
            // Update input data with current settings
            content.input = {
              topics: this.topicsModal.topics || [],
              wordCount: this.topicsModal.wordCount || 100,
              difficultyLevel: this.topicsModal.difficulty || 'HARD'
            };
            
            // Update metadata with current settings
            content.metadata = {
              ...content.metadata,
              topics: this.topicsModal.topics || [],
              wordCount: this.topicsModal.wordCount || 100,
              difficulty: this.topicsModal.difficulty || 'hard'
            };
            
            // Update topicName if available
            if (response.data.topicName) {
              content.tabName = response.data.topicName;
              content.metadata.topicName = response.data.topicName;
              
              // Update the tab title in DOM
              const tabElement = this.topicsModal.customContentModal.modal.querySelector(`[data-tab-id="${tabId}"]`);
              if (tabElement) {
                const titleElement = tabElement.querySelector('.vocab-custom-content-tab-title');
                if (titleElement) {
                  this.setupTabTitleWithTooltip(titleElement, response.data.topicName);
                }
              }
            }
            
            // Update the editor content
            this.updateCustomContentEditor(response.data.text);
            
            console.log('[ButtonPanel] Content regenerated and stored:', content);
          }
        } else {
          console.log('[ButtonPanel] Creating new tab with content');
          // Show custom content modal with the response (new tab)
          this.showCustomContentModal(response.data.text, 'topic', {
            topics: this.topicsModal.topics,
            wordCount: this.topicsModal.wordCount,
            difficulty: this.topicsModal.difficulty,
            topicName: response.data.topicName // Add topicName from API response
          });
        }
        
        // Reset generate button if it was regenerating
        if (isRegenerate && generateBtn) {
          generateBtn.textContent = 'Generate content';
          generateBtn.removeAttribute('data-regenerate');
          generateBtn.removeAttribute('data-tab-id');
        }
        
        // Auto-close topics modal after successful generation
        this.hideTopicsModal();
      } else {
        // Hide processing overlay
        this.hideProcessingOverlay();
        
        // Show error message
        alert(`Error generating story: ${response.error}`);
      }
    } catch (error) {
      console.error('[ButtonPanel] Error generating story:', error);
      
      // Hide processing overlay
      this.hideProcessingOverlay();
      
      // Show error message
      alert(`Error generating story: ${error.message}`);
    }
  },

  /**
   * Show processing overlay
   */
  showProcessingOverlay() {
    console.log('[ButtonPanel] Showing processing overlay');
    
    // Create processing overlay if it doesn't exist
    if (!this.topicsModal.processingOverlay) {
      this.createProcessingOverlay();
    }
    
    // Show the overlay
    this.topicsModal.processingOverlay.classList.add('visible');
  },

  /**
   * Hide processing overlay
   */
  hideProcessingOverlay() {
    console.log('[ButtonPanel] Hiding processing overlay');
    
    if (this.topicsModal.processingOverlay) {
      this.topicsModal.processingOverlay.classList.remove('visible');
    }
  },

  /**
   * Create processing overlay HTML structure
   */
  createProcessingOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'vocab-processing-overlay';
    overlay.id = 'vocab-processing-overlay';
    
    const content = document.createElement('div');
    content.className = 'vocab-processing-content';
    
    const text = document.createElement('div');
    text.className = 'vocab-processing-text';
    text.textContent = 'Generating contents on topics...';
    
    const icon = document.createElement('div');
    icon.className = 'vocab-processing-icon';
    
    content.appendChild(text);
    content.appendChild(icon);
    overlay.appendChild(content);
    
    // Add to topics modal instead of document body
    this.topicsModal.modal.appendChild(overlay);
    
    // Store reference
    this.topicsModal.processingOverlay = overlay;
  },

  /**
   * Show custom content modal with new content
   * @param {string} content - The markdown content to display
   * @param {string} contentType - The content type ('pdf', 'image', 'topic')
   * @param {Object} metadata - Additional metadata for the tab
   */
  showCustomContentModal(content, contentType = 'topic', metadata = {}) {
    console.log('[ButtonPanel] Showing custom content modal');
    console.log('[ButtonPanel] Content:', content ? 'Present' : 'Missing');
    console.log('[ButtonPanel] Content type:', contentType);
    
    // Hide topics modal first
    this.hideTopicsModal();
    
    // Remove blur from custom content modal if it was blurred
    if (this.topicsModal.customContentModal.overlay) {
      this.topicsModal.customContentModal.overlay.style.filter = 'none';
    }
    
    // Create modal if it doesn't exist
    if (!this.topicsModal.customContentModal.overlay) {
      this.createCustomContentModal();
    }
    
    // Create new content using the new data structure
    const tabTitle = this.generateTabTitle(contentType, metadata);
    const newContent = this.topicsModal.customContentModal.addContent(contentType, tabTitle, content, metadata);
    
    if (!newContent) {
      console.error('[ButtonPanel] Failed to create content');
      this.showNotification('Failed to create content. Please try again.', 'error');
      return;
    }
    
    // Set current content type immediately
    this.topicsModal.currentContentType = contentType;
    console.log('[ButtonPanel] Set currentContentType to:', contentType);
    
    // Synchronize activeContentType for proper plus icon behavior
    if (this.topicsModal.customContentModal) {
      this.topicsModal.customContentModal.activeContentType = contentType;
    }
    
    // Show modal with only the specified content type, and switch to the new tab
    this.showCustomContentModalWithContents(contentType, newContent.tabId);
    
    // Show the modal with a slight delay for smooth transition
    setTimeout(() => {
      this.topicsModal.customContentModal.overlay.classList.add('visible');
      
      // Clear all selections when opening modal
      this.clearSelectionsOnModalOpen();
      
      // Add class to body to hide webpage icons
      document.body.classList.add('vocab-custom-content-modal-open');
      
      // Update button visibility after modal is shown
      setTimeout(() => {
        this.updateVerticalButtonVisibility();
      }, 100);
    }, 100);
  },

  /**
   * Generate tab title based on content type and metadata
   * @param {string} contentType - The content type ('pdf', 'image', 'topic')
   * @param {Object} metadata - Additional metadata for the tab
   * @returns {string} Generated tab title
   */
  generateTabTitle(contentType, metadata = {}) {
    const titleMap = {
      'pdf': () => {
        if (metadata.fileName) {
          return `PDF: ${metadata.fileName}`;
        }
        return 'PDF Content';
      },
      'image': () => {
        if (metadata.fileName) {
          return `Image: ${metadata.fileName}`;
        }
        return 'Image Content';
      },
      'topic': () => {
        // Prioritize topicName from API response
        if (metadata.topicName) {
          return metadata.topicName;
        }
        // Fallback to topics list if topicName not available
        if (metadata.topics && metadata.topics.length > 0) {
          const topicList = metadata.topics.slice(0, 3).join(', ');
          const suffix = metadata.topics.length > 3 ? '...' : '';
          return `Topics: ${topicList}${suffix}`;
        }
        return 'Topic Content';
      },
      'text': () => {
        if (metadata.inputText) {
          const words = metadata.inputText.trim().split(/\s+/);
          return words.slice(0, 3).join(' ');
        }
        return 'Text Content';
      },
      'default': () => 'Generated Content'
    };
    
    const generator = titleMap[contentType] || titleMap['default'];
    return generator();
  },

  /**
   * Clear all text and word selections when opening modals
   */
  clearSelectionsOnModalOpen() {
    console.log('[ButtonPanel] Clearing only selections due to modal opening, preserving meanings');
    
    // Clear word selections only (preserve meanings)
    if (typeof WordSelector !== 'undefined' && WordSelector.clearSelectionsOnly) {
      WordSelector.clearSelectionsOnly();
    }
    
    // Clear text selections only (preserve meanings)
    if (typeof TextSelector !== 'undefined' && TextSelector.clearSelectionsOnly) {
      TextSelector.clearSelectionsOnly();
    }
    
    // Clear any browser text selection
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    }
    
    console.log('[ButtonPanel] Selections cleared, meanings preserved');
  },

  /**
   * Update icon context attributes for existing icons
   */
  updateIconContexts() {
    // Update all existing icon wrappers with proper context
    const allIconWrappers = document.querySelectorAll('.vocab-text-icons-wrapper');
    allIconWrappers.forEach(wrapper => {
      if (!wrapper.hasAttribute('data-icon-context')) {
        const isInModal = wrapper.closest('.vocab-custom-content-modal');
        wrapper.setAttribute('data-icon-context', isInModal ? 'custom-content-modal' : 'main-webpage');
      }
    });
  },

  /**
   * Hide custom content modal
   */
  hideCustomContentModal() {
    console.log('[ButtonPanel] ===== HIDE CUSTOM CONTENT MODAL DEBUG =====');
    console.log('[ButtonPanel] Hiding custom content modal');
    console.log('[ButtonPanel] Modal overlay exists:', !!this.topicsModal.customContentModal.overlay);
    
    if (this.topicsModal.customContentModal.overlay) {
      const modal = this.topicsModal.customContentModal.modal;
      const overlay = this.topicsModal.customContentModal.overlay;
      
      // Get import-content button coordinates
      const importButton = document.getElementById('import-content');
      if (importButton && modal) {
        // Get current modal position and size
        const modalRect = modal.getBoundingClientRect();
        const modalCenterX = modalRect.left + modalRect.width / 2;
        const modalCenterY = modalRect.top + modalRect.height / 2;
        
        // Get import-content button position
        const buttonRect = importButton.getBoundingClientRect();
        const buttonCenterX = buttonRect.left + buttonRect.width / 2;
        const buttonCenterY = buttonRect.top + buttonRect.height / 2;
        
        // Calculate the translation needed to move modal center to button center
        // After resetting transform to 'none', the modal will be positioned at its natural position
        // So we need to calculate from the modal's current center to the button center
        const targetX = buttonCenterX - modalCenterX;
        const targetY = buttonCenterY - modalCenterY;
        
        console.log('[ButtonPanel] Modal center:', { x: modalCenterX, y: modalCenterY });
        console.log('[ButtonPanel] Button center:', { x: buttonCenterX, y: buttonCenterY });
        console.log('[ButtonPanel] Target translation:', { x: targetX, y: targetY });
        
        // Disable overlay transitions to prevent fade effect during animation
        overlay.style.transition = 'none';
        
        // Check modal's current positioning mode
        const computedStyle = window.getComputedStyle(modal);
        const isCentered = computedStyle.left === '50%' || 
                          computedStyle.left === 'auto' || 
                          computedStyle.transform.includes('translate(-50%');
        
        // Set CSS custom properties for the animation based on positioning mode
        modal.style.setProperty('--minimize-target-x', `${targetX}px`);
        modal.style.setProperty('--minimize-target-y', `${targetY}px`);
        
        if (isCentered) {
          // Modal is in centered mode - use original animation
          modal.style.setProperty('--minimize-start-transform', 'translate(-50%, -50%)');
          modal.style.setProperty('--minimize-end-transform', 'translate(calc(-50% + var(--minimize-target-x)), calc(-50% + var(--minimize-target-y)))');
        } else {
          // Modal is in absolute mode - use direct translation
          modal.style.setProperty('--minimize-start-transform', 'none');
          modal.style.setProperty('--minimize-end-transform', `translate(${targetX}px, ${targetY}px)`);
        }
        
        // Add minimizing class to trigger animation
        modal.classList.add('minimizing');
        
        // Wait for animation to complete, then hide modal
        setTimeout(() => {
          console.log('[ButtonPanel] Animation completed, hiding modal');
          
          // Directly hide the modal element to prevent reappear effect
          modal.style.display = 'none';
          
          // Hide overlay immediately without transition
          overlay.classList.remove('visible');
          
          // Remove class from body to show webpage icons again
          document.body.classList.remove('vocab-custom-content-modal-open');
          
          // Clean up animation class and restore overlay transitions
          modal.classList.remove('minimizing');
          overlay.style.transition = ''; // Restore original transition
          
          // Clean up CSS custom properties
          modal.style.removeProperty('--minimize-target-x');
          modal.style.removeProperty('--minimize-target-y');
          modal.style.removeProperty('--minimize-start-transform');
          modal.style.removeProperty('--minimize-end-transform');
          
          // Continue with the rest of the cleanup
          this.continueModalCleanup();
        }, 200); // 0.2s animation duration (faster)
        
        return; // Exit early, cleanup will continue in setTimeout
      } else {
        console.log('[ButtonPanel] Import-content button or modal not found, using fallback');
        // Fallback to original behavior if button not found
        overlay.classList.remove('visible');
        document.body.classList.remove('vocab-custom-content-modal-open');
      }
      
      // Continue with cleanup for both animation and fallback cases
      this.continueModalCleanup();
    }
  },

  /**
   * Continue modal cleanup after animation or immediate hide
   */
  continueModalCleanup() {
    console.log('[ButtonPanel] Overlay classes after removal:', this.topicsModal.customContentModal.overlay.classList.toString());
    console.log('[ButtonPanel] Overlay is now visible:', this.topicsModal.customContentModal.overlay.classList.contains('visible'));
    
    // Close ChatDialog if it's open when modal is minimized/closed
    if (typeof ChatDialog !== 'undefined' && ChatDialog.isOpen) {
      console.log('[ButtonPanel] ChatDialog is open - closing it when custom content modal is minimized/closed');
      console.log('[ButtonPanel] Current ChatDialog textKey:', ChatDialog.currentTextKey);
      ChatDialog.close();
    }
    
    // Update button states after modal closes
    this.updateButtonStatesFromSelections();
    
    // Hide info banner if visible
    this.hideCustomContentInfoBanner();
    
    // Update icon contexts for all existing icons
    this.updateIconContexts();
    
    // Restore any icon wrappers that were moved to modal overlay back to their original highlights
    const iconWrappers = this.topicsModal.customContentModal.overlay.querySelectorAll('.vocab-text-icons-wrapper');
    iconWrappers.forEach(wrapper => {
      const textKey = wrapper.getAttribute('data-text-key');
      if (textKey) {
        // Try to find the original highlight element
        let highlight = document.querySelector(`[data-text-highlight="${textKey}"]`);
        
        // If not found by data-text-highlight, try to find by checking simplifiedTexts
        if (!highlight && TextSelector.simplifiedTexts.has(textKey)) {
          const simplifiedData = TextSelector.simplifiedTexts.get(textKey);
          if (simplifiedData && simplifiedData.highlight) {
            highlight = simplifiedData.highlight;
          }
        }
        
        // Only restore if we found a highlight AND it's definitely from the main webpage (not modal content)
        if (highlight && !highlight.closest('.vocab-custom-content-modal') && highlight.closest('body')) {
          // This is a main webpage highlight, move the icons back
          console.log('[ButtonPanel] Restoring icons for textKey:', textKey);
          highlight.appendChild(wrapper);
          // Update context to main-webpage since it's being restored to main webpage
          wrapper.setAttribute('data-icon-context', 'main-webpage');
        } else {
          // This is modal content or highlight not found, keep the wrapper in the modal overlay
          // Don't remove it as it might be needed for modal content
          console.log('[ButtonPanel] Keeping modal content icons for textKey:', textKey);
          // Update context to custom-content-modal since it's staying in modal
          wrapper.setAttribute('data-icon-context', 'custom-content-modal');
        }
      } else {
        // No textKey, keep the wrapper in the modal overlay
        console.log('[ButtonPanel] Keeping icon wrapper without textKey');
      }
    });
    
    console.log('[ButtonPanel] ===== END HIDE CUSTOM CONTENT MODAL DEBUG =====');
  },

  /**
   * Show image upload modal
   */
  showImageUploadModal() {
    console.log('[ButtonPanel] Showing image upload modal');
    
    // Create modal if it doesn't exist
    if (!this.imageUploadModal) {
      this.createImageUploadModal();
      
      // Wait for DOM to be ready before showing modal using double requestAnimationFrame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.showImageModalWithAnimation();
        });
      });
    } else {
      // Modal already exists; show with animation
      this.showImageModalWithAnimation();
    }
  },

  /**
   * Show image modal with animation
   */
  showImageModalWithAnimation() {
    // Clear all selections when opening modal
    this.clearSelectionsOnModalOpen();
    
    if (this.imageUploadModal.overlay) {
      this.imageUploadModal.overlay.classList.add('visible');
    }
    if (this.imageUploadModal.modal) {
      this.imageUploadModal.modal.classList.add('visible');
    }
    
    // Add class to body to blur webpage icons
    document.body.classList.add('vocab-image-modal-open');
  },

  /**
   * Hide image upload modal
   */
  hideImageUploadModal() {
    console.log('[ButtonPanel] Hiding image upload modal');
    
    if (this.imageUploadModal && this.imageUploadModal.overlay) {
      this.imageUploadModal.overlay.classList.remove('visible');
    }
    if (this.imageUploadModal && this.imageUploadModal.modal) {
      this.imageUploadModal.modal.classList.remove('visible');
    }
    
    // Remove class from body to show webpage icons again
    document.body.classList.remove('vocab-image-modal-open');
    
    // Show the custom content button again
    this.showCustomContentButton();
  },

  /**
   * Create image upload modal HTML structure
   */
  createImageUploadModal() {
    console.log('[ButtonPanel] Creating image upload modal...');
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'vocab-image-upload-overlay';
    overlay.id = 'vocab-image-upload-overlay';
    
    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'vocab-image-upload-modal';
    
    // Create modal content
    modal.innerHTML = `
      <div class="vocab-image-upload-header">
        <h2 class="vocab-image-upload-title">Upload Image containing text</h2>
        <button class="vocab-image-upload-close" id="vocab-image-upload-close">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
      
      <div class="vocab-image-upload-content">
        <div class="vocab-image-upload-content-container">
          <div class="vocab-image-upload-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="#9527F5"/>
              <circle cx="16" cy="8" r="2" fill="#9527F5"/>
              <path d="M12 6H12.01" stroke="#9527F5" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <div class="vocab-image-upload-plus">+</div>
          </div>
          
          <div class="vocab-image-upload-instructions">
            <p class="vocab-image-upload-main-text">Drop, Upload or Paste Image file</p>
            <p class="vocab-image-upload-format-text">Supporting formats: JPG, PNG, JPEG, HEIC</p>
            <p class="vocab-image-upload-secondary-text">use Ctrl+V (Windows) / Cmd+V (Mac) to paste from clipboard.</p>
            <p class="vocab-image-upload-size-text">Maximum file size 5 MB.</p>
          </div>
          
          <button class="vocab-image-upload-browse-btn" id="vocab-image-upload-browse">
            Browse
          </button>
        </div>
        
        <input type="file" id="vocab-image-upload-input" accept="image/*" style="display: none;">
      </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Store references
    this.imageUploadModal = {
      overlay: overlay,
      modal: modal,
      closeBtn: modal.querySelector('#vocab-image-upload-close'),
      browseBtn: modal.querySelector('#vocab-image-upload-browse'),
      fileInput: modal.querySelector('#vocab-image-upload-input')
    };
    
    // Add event listeners
    this.setupImageUploadModalEvents();
    
    console.log('[ButtonPanel] Image upload modal created successfully');
  },

  /**
   * Setup event listeners for image upload modal
   */
  setupImageUploadModalEvents() {
    const { overlay, closeBtn, browseBtn, fileInput } = this.imageUploadModal;
    const container = overlay.querySelector('.vocab-image-upload-content-container');
    
    // Close modal events
    closeBtn.addEventListener('click', () => this.hideImageUploadModal());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.hideImageUploadModal();
      }
    });
    
    // Browse button click
    browseBtn.addEventListener('click', () => {
      fileInput.click();
    });
    
    // Container click to open file dialog
    container.addEventListener('click', () => {
      fileInput.click();
    });
    
    // File input change
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.handleImageFile(file);
      }
    });
    
    // Drag and drop functionality
    overlay.addEventListener('dragover', (e) => {
      e.preventDefault();
      overlay.classList.add('drag-over');
    });
    
    overlay.addEventListener('dragleave', (e) => {
      e.preventDefault();
      overlay.classList.remove('drag-over');
    });
    
    overlay.addEventListener('drop', (e) => {
      e.preventDefault();
      overlay.classList.remove('drag-over');
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
          this.handleImageFile(file);
        } else {
          alert('Please select an image file.');
        }
      }
    });
    
    // Paste functionality
    document.addEventListener('paste', (e) => {
      if (overlay.classList.contains('visible')) {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.startsWith('image/')) {
            const file = items[i].getAsFile();
            this.handleImageFile(file);
            break;
          }
        }
      }
    });
  },

  /**
   * Handle uploaded image file
   */
  handleImageFile(file) {
    console.log('[ButtonPanel] ===== IMAGE FILE UPLOAD STARTED =====');
    console.log('[ButtonPanel] File details:', {
      name: file.name,
      size: file.size,
      type: file.type
    });
    
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      this.showNotification('File size exceeds 5MB limit. Please select a smaller image.', 'error');
      return;
    }
    
    // Check file type - support JPG, PNG, JPEG, HEIC
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      this.showNotification('Please select a valid image file (JPG, PNG, JPEG, HEIC).', 'error');
      return;
    }
    
    console.log('[ButtonPanel] File validation passed, starting processing...');
    this.showImageProcessingOverlayOnModal(); // Keep image modal open and show processing overlay on top
    this.handleImageUpload(file);
  },

  /**
   * Handle image upload API call
   */
  async handleImageUpload(file) {
    console.log('[ButtonPanel] ===== IMAGE UPLOAD PROCESSING STARTED =====');
    console.log('[ButtonPanel] Uploading file:', file.name);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      console.log('[ButtonPanel] Making API call to image-to-text endpoint...');
      const response = await fetch(ApiConfig.getUrl(ApiConfig.ENDPOINTS.IMAGE_TO_TEXT), {
        method: 'POST',
        body: formData
      });
      
      console.log('[ButtonPanel] API response received:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[ButtonPanel] ===== API SUCCESS =====');
      console.log('[ButtonPanel] Response data:', data);
      
      this.hideImageProcessingOverlayFromModal();
      this.hideImageUploadModal(); // Close image upload modal on success
      await this.createImageTabAndLoadContent(data.topicName, data.text);
      
      console.log('[ButtonPanel] ===== IMAGE UPLOAD PROCESSING COMPLETED SUCCESSFULLY =====');
      
    } catch (error) {
      console.error('[ButtonPanel] ===== API ERROR =====');
      console.error('[ButtonPanel] Error details:', error);
      
      this.hideImageProcessingOverlayFromModal();
      // Image modal remains open
      this.showNotification('Failed to process image file. Please try again.', 'error');
    }
  },

  /**
   * Create image tab and load content
   */
  async createImageTabAndLoadContent(topicName, content) {
    console.log('[ButtonPanel] ===== CREATING IMAGE TAB AND LOADING CONTENT =====');
    console.log('[ButtonPanel] Topic name:', topicName);
    console.log('[ButtonPanel] Content length:', content.length);
    
    // Ensure modal is initialized
    if (!this.topicsModal || !this.topicsModal.customContentModal) {
      console.error('[ButtonPanel] Topics modal not initialized');
      this.showNotification('Modal not initialized. Please try again.', 'error');
      return;
    }
    
    // Set current content type
    this.topicsModal.currentContentType = 'image';
    
    // Synchronize activeContentType for proper plus icon behavior
    if (this.topicsModal.customContentModal) {
      this.topicsModal.customContentModal.activeContentType = 'image';
    }
    
    // Create modal if it doesn't exist
    if (!this.topicsModal.customContentModal.overlay) {
      console.log('[ButtonPanel] Creating custom content modal...');
      this.createCustomContentModal();
    }
    
    // Create new content for image
    const newContent = this.topicsModal.customContentModal.addContent('image', topicName, content);
    console.log('[ButtonPanel] New content created:', newContent);
    
    // Check if content was created successfully
    if (!newContent) {
      console.error('[ButtonPanel] Failed to create image content - addContent returned null');
      this.showNotification('Failed to create image content. Please try again.', 'error');
      return;
    }
    
    console.log('[ButtonPanel] New content created successfully');
    
    // Show modal with only image contents, and switch to the new tab
    this.showCustomContentModalWithContents('image', newContent.tabId);
    
    // Ensure custom content modal is visible
    if (!this.topicsModal.customContentModal.overlay.classList.contains('visible')) {
      this.topicsModal.customContentModal.overlay.classList.add('visible');
      
      // Clear all selections when opening modal
      this.clearSelectionsOnModalOpen();
      
      // Add class to body to hide webpage icons
      document.body.classList.add('vocab-custom-content-modal-open');
    }
    
    // Update modal title
    this.updateCustomContentModalTitle('image');
    
    // Load content into editor
    this.updateCustomContentEditor(content);
    
    console.log('[ButtonPanel] ===== IMAGE TAB AND CONTENT LOADED SUCCESSFULLY =====');
  },

  /**
   * Show image processing overlay on modal
   */
  showImageProcessingOverlayOnModal() {
    console.log('[ButtonPanel] ===== SHOWING IMAGE PROCESSING OVERLAY =====');
    
    if (!this.imageUploadModal || !this.imageUploadModal.modal) {
      console.error('[ButtonPanel] Image upload modal not found');
      return;
    }
    
    // Create processing overlay if it doesn't exist
    if (!this.imageProcessingOverlay) {
      this.createImageProcessingOverlay();
    }
    
    // Show the overlay
    if (this.imageProcessingOverlay) {
      this.imageProcessingOverlay.classList.add('visible');
      console.log('[ButtonPanel] Image processing overlay shown');
    }
  },

  /**
   * Hide image processing overlay from modal
   */
  hideImageProcessingOverlayFromModal() {
    console.log('[ButtonPanel] ===== HIDING IMAGE PROCESSING OVERLAY =====');
    
    if (this.imageProcessingOverlay) {
      this.imageProcessingOverlay.classList.remove('visible');
      console.log('[ButtonPanel] Image processing overlay hidden');
    }
  },

  /**
   * Create image processing overlay
   */
  createImageProcessingOverlay() {
    console.log('[ButtonPanel] ===== CREATING IMAGE PROCESSING OVERLAY =====');
    
    if (!this.imageUploadModal || !this.imageUploadModal.modal) {
      console.error('[ButtonPanel] Image upload modal not found for overlay creation');
      return;
    }
    
    // Create overlay element
    const overlay = document.createElement('div');
    overlay.className = 'vocab-image-processing-overlay';
    overlay.id = 'vocab-image-processing-overlay';
    
    // Create processing content
    overlay.innerHTML = `
      <div class="vocab-image-processing-content">
        <div class="vocab-image-processing-text">
          <p class="vocab-image-processing-main">Reading image file</p>
          <p class="vocab-image-processing-sub">Extracting text from image</p>
        </div>
        <div class="vocab-processing-icon"></div>
      </div>
    `;
    
    // Append to image upload modal
    this.imageUploadModal.modal.appendChild(overlay);
    
    // Store reference
    this.imageProcessingOverlay = overlay;
    
    console.log('[ButtonPanel] Image processing overlay created successfully');
  },

  /**
   * Hide image upload modal for processing (without showing custom content button)
   */
  hideImageUploadModalForProcessing() {
    console.log('[ButtonPanel] Hiding image upload modal for processing');
    
    if (this.imageUploadModal && this.imageUploadModal.overlay) {
      this.imageUploadModal.overlay.classList.remove('visible');
    }
    if (this.imageUploadModal && this.imageUploadModal.modal) {
      this.imageUploadModal.modal.classList.remove('visible');
    }
    
    // Don't show the custom content button - we want to keep the custom content modal visible
  },

  /**
   * Show PDF upload modal
   */
  showPDFUploadModal() {
    console.log('[ButtonPanel] Showing PDF upload modal');
    
    // Create modal if it doesn't exist
    if (!this.pdfUploadModal) {
      this.createPDFUploadModal();
      
      // Wait for DOM to be ready before showing modal using double requestAnimationFrame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.showPDFModalWithAnimation();
        });
      });
    } else {
      // Modal already exists; show with animation
      this.showPDFModalWithAnimation();
    }
  },

  /**
   * Show PDF modal with animation
   */
  showPDFModalWithAnimation() {
    // Clear all selections when opening modal
    this.clearSelectionsOnModalOpen();
    
    if (this.pdfUploadModal.overlay) {
      this.pdfUploadModal.overlay.classList.add('visible');
    }
    if (this.pdfUploadModal.modal) {
      this.pdfUploadModal.modal.classList.add('visible');
    }
    
    // Add class to body to blur webpage icons
    document.body.classList.add('vocab-pdf-modal-open');
  },

  /**
   * Show processing overlay on top of PDF modal
   */
  showPDFProcessingOverlayOnModal() {
    console.log('[ButtonPanel] ===== SHOWING PDF PROCESSING OVERLAY =====');
    
    // Create processing overlay if it doesn't exist
    if (!this.pdfUploadModal.processingOverlay) {
      this.createPDFProcessingOverlay();
    }
    
    // Update the processing text for PDF
    const processingText = this.pdfUploadModal.processingOverlay.querySelector('.vocab-processing-text');
    if (processingText) {
      processingText.textContent = 'Reading PDF file';
    }
    
    // Show the overlay on top of PDF modal
    this.pdfUploadModal.processingOverlay.classList.add('visible');
    console.log('[ButtonPanel] PDF processing overlay is now visible');
  },

  /**
   * Hide processing overlay from PDF modal
   */
  hidePDFProcessingOverlayFromModal() {
    console.log('[ButtonPanel] ===== HIDING PDF PROCESSING OVERLAY =====');
    
    if (this.pdfUploadModal.processingOverlay) {
      this.pdfUploadModal.processingOverlay.classList.remove('visible');
      console.log('[ButtonPanel] PDF processing overlay hidden');
    }
  },

  /**
   * Create processing overlay for PDF modal
   */
  createPDFProcessingOverlay() {
    console.log('[ButtonPanel] ===== CREATING PDF PROCESSING OVERLAY =====');
    
    const overlay = document.createElement('div');
    overlay.className = 'vocab-processing-overlay';
    overlay.id = 'vocab-pdf-processing-overlay';
    
    const content = document.createElement('div');
    content.className = 'vocab-processing-content';
    
    const text = document.createElement('div');
    text.className = 'vocab-processing-text';
    text.textContent = 'Reading PDF file';
    
    const icon = document.createElement('div');
    icon.className = 'vocab-processing-icon';
    
    content.appendChild(text);
    content.appendChild(icon);
    overlay.appendChild(content);
    
    // Add to PDF modal instead of document body
    this.pdfUploadModal.modal.appendChild(overlay);
    
    // Store reference
    this.pdfUploadModal.processingOverlay = overlay;
    
    console.log('[ButtonPanel] PDF processing overlay created and added to PDF modal');
  },

  /**
   * Hide PDF upload modal for processing (without showing custom content button)
   */
  hidePDFUploadModalForProcessing() {
    console.log('[ButtonPanel] Hiding PDF upload modal for processing');
    
    if (this.pdfUploadModal && this.pdfUploadModal.overlay) {
      this.pdfUploadModal.overlay.classList.remove('visible');
    }
    if (this.pdfUploadModal && this.pdfUploadModal.modal) {
      this.pdfUploadModal.modal.classList.remove('visible');
    }
    
    // Reset the file input to allow re-uploading the same file
    if (this.pdfUploadModal && this.pdfUploadModal.fileInput) {
      this.pdfUploadModal.fileInput.value = '';
      console.log('[ButtonPanel] PDF file input reset for processing');
    }
    
    // Remove class from body to show webpage icons again
    document.body.classList.remove('vocab-pdf-modal-open');
    
    // Don't show the custom content button - we want to keep the custom content modal visible
  },

  /**
   * Hide PDF upload modal
   */
  hidePDFUploadModal() {
    console.log('[ButtonPanel] Hiding PDF upload modal');
    
    if (this.pdfUploadModal && this.pdfUploadModal.overlay) {
      this.pdfUploadModal.overlay.classList.remove('visible');
    }
    if (this.pdfUploadModal && this.pdfUploadModal.modal) {
      this.pdfUploadModal.modal.classList.remove('visible');
    }
    
    // Reset the file input to allow re-uploading the same file
    if (this.pdfUploadModal && this.pdfUploadModal.fileInput) {
      this.pdfUploadModal.fileInput.value = '';
      console.log('[ButtonPanel] PDF file input reset');
    }
    
    // Remove class from body to show webpage icons again
    document.body.classList.remove('vocab-pdf-modal-open');
    
    // Show the custom content button again
    setTimeout(() => {
      this.showCustomContentButton();
    }, 100);
  },

  /**
   * Create PDF upload modal HTML structure
   */
  createPDFUploadModal() {
    console.log('[ButtonPanel] Creating PDF upload modal...');
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'vocab-pdf-upload-overlay';
    overlay.id = 'vocab-pdf-upload-overlay';
    
    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'vocab-pdf-upload-modal';
    
    // Create modal content
    modal.innerHTML = `
      <div class="vocab-pdf-upload-header">
        <h2 class="vocab-pdf-upload-title">Upload PDF containing text</h2>
        <button class="vocab-pdf-upload-close" id="vocab-pdf-upload-close">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
      
      <div class="vocab-pdf-upload-content">
        <div class="vocab-pdf-upload-content-container">
          <div class="vocab-pdf-upload-icon">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <!-- Main document rectangle -->
              <rect x="4" y="3" width="16" height="20" rx="2" fill="#9527F5"/>
              <!-- Folded corner -->
              <path d="M16 3L20 7V3H16Z" fill="#7A3FD1"/>
              <!-- PDF text in the center -->
              <text x="12" y="14" font-family="Arial, sans-serif" font-size="4" font-weight="bold" fill="white" text-anchor="middle">PDF</text>
              <!-- Upload arrow on the right side pointing upward -->
              <path d="M18 16L16 18M18 16L20 18M18 16V20" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          
          <div class="vocab-pdf-upload-instructions">
            <p class="vocab-pdf-upload-main-text">Drop, Upload or Paste PDF file</p>
            <p class="vocab-pdf-upload-secondary-text">use Ctrl+V (Windows) / Cmd+V (Mac) to paste from clipboard.</p>
            <p class="vocab-pdf-upload-size-text">Maximum file size 5 MB.</p>
          </div>
          
          <button class="vocab-pdf-upload-browse-btn" id="vocab-pdf-upload-browse">
            Browse
          </button>
        </div>
        
        <input type="file" id="vocab-pdf-upload-input" accept=".pdf" style="display: none;">
      </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Store references
    this.pdfUploadModal = {
      overlay: overlay,
      modal: modal,
      closeBtn: modal.querySelector('#vocab-pdf-upload-close'),
      browseBtn: modal.querySelector('#vocab-pdf-upload-browse'),
      fileInput: modal.querySelector('#vocab-pdf-upload-input')
    };
    
    // Add event listeners
    this.setupPDFUploadModalEvents();
    
    console.log('[ButtonPanel] PDF upload modal created successfully');
  },

  /**
   * Setup event listeners for PDF upload modal
   */
  setupPDFUploadModalEvents() {
    const { overlay, closeBtn, browseBtn, fileInput } = this.pdfUploadModal;
    const container = overlay.querySelector('.vocab-pdf-upload-content-container');
    
    // Close modal events
    closeBtn.addEventListener('click', () => this.hidePDFUploadModal());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.hidePDFUploadModal();
      }
    });
    
    // Browse button click
    browseBtn.addEventListener('click', () => {
      fileInput.click();
    });
    
    // Container click to open file dialog
    container.addEventListener('click', () => {
      fileInput.click();
    });
    
    // File input change
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.handlePDFFile(file);
      }
    });
    
    // Drag and drop functionality
    overlay.addEventListener('dragover', (e) => {
      e.preventDefault();
      overlay.classList.add('drag-over');
    });
    
    overlay.addEventListener('dragleave', (e) => {
      e.preventDefault();
      overlay.classList.remove('drag-over');
    });
    
    overlay.addEventListener('drop', (e) => {
      e.preventDefault();
      overlay.classList.remove('drag-over');
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (file.type === 'application/pdf') {
          this.handlePDFFile(file);
        } else {
          alert('Please select a PDF file.');
        }
      }
    });
    
    // Paste functionality
    document.addEventListener('paste', (e) => {
      if (overlay.classList.contains('visible')) {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type === 'application/pdf') {
            const file = items[i].getAsFile();
            this.handlePDFFile(file);
            break;
          }
        }
      }
    });
  },

  /**
   * Handle uploaded PDF file
   */
  handlePDFFile(file) {
    console.log('[ButtonPanel] ===== PDF FILE UPLOAD STARTED =====');
    console.log('[ButtonPanel] File details:', {
      name: file.name,
      size: file.size,
      type: file.type
    });
    
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      console.log('[ButtonPanel] File size exceeds limit:', file.size);
      alert('File size exceeds 5MB limit. Please select a smaller PDF.');
      return;
    }
    
    // Check file type
    if (file.type !== 'application/pdf') {
      console.log('[ButtonPanel] Invalid file type:', file.type);
      alert('Please select a valid PDF file.');
      return;
    }
    
    console.log('[ButtonPanel] File validation passed, starting processing...');
    
    // Keep PDF modal open and show processing overlay on top
    this.showPDFProcessingOverlayOnModal();
    
    // Process the PDF file using the existing handlePDFUpload method
    this.handlePDFUpload(file);
  },

  /**
   * Create custom content modal HTML structure
   */
  createCustomContentModal() {
    console.log('[ButtonPanel] Creating custom content modal...');
    const overlay = document.createElement('div');
    overlay.className = 'vocab-custom-content-overlay';
    overlay.id = 'vocab-custom-content-overlay';
    
    const modal = document.createElement('div');
    modal.className = 'vocab-custom-content-modal';
    
    // Create minimize button positioned at top right corner
    const minimizeBtn = document.createElement('button');
    minimizeBtn.className = 'vocab-custom-content-minimize';
    minimizeBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 10H16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    minimizeBtn.setAttribute('aria-label', 'Minimize modal');
    
    // Tabs section
    const tabsSection = document.createElement('div');
    tabsSection.className = 'vocab-custom-content-tabs';
    
    // Left arrow for tab navigation
    const leftArrow = document.createElement('button');
    leftArrow.className = 'vocab-custom-content-tab-arrow vocab-custom-content-tab-arrow-left';
    leftArrow.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    leftArrow.setAttribute('title', 'Scroll tabs left');
    
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'vocab-custom-content-tabs-container';
    console.log('[ButtonPanel] Created tabsContainer:', tabsContainer);
    
    // Right arrow for tab navigation
    const rightArrow = document.createElement('button');
    rightArrow.className = 'vocab-custom-content-tab-arrow vocab-custom-content-tab-arrow-right';
    rightArrow.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    rightArrow.setAttribute('title', 'Scroll tabs right');
    
    const addTabBtn = document.createElement('button');
    addTabBtn.className = 'vocab-custom-content-add-tab';
    addTabBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    addTabBtn.setAttribute('title', 'New tab');
    
    tabsSection.appendChild(leftArrow);
    tabsSection.appendChild(tabsContainer);
    tabsSection.appendChild(addTabBtn);
    tabsSection.appendChild(rightArrow);
    
    // Editor section
    const editorSection = document.createElement('div');
    editorSection.className = 'vocab-custom-content-editor';
    
    const editorContent = document.createElement('div');
    editorContent.className = 'vocab-custom-content-editor-content';
    
    editorSection.appendChild(editorContent);
    
    // Add chat icon to bottom right corner of editor
    const chatIcon = document.createElement('button');
    chatIcon.className = 'vocab-custom-content-chat-icon';
    chatIcon.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="5" width="10" height="8" rx="1.5" stroke="white" stroke-width="1.1" fill="none"/>
        <line x1="10" y1="2.5" x2="10" y2="5" stroke="white" stroke-width="1.1" stroke-linecap="round"/>
        <circle cx="10" cy="2" r="0.6" fill="white"/>
        <circle cx="8" cy="9" r="0.8" fill="white"/>
        <circle cx="12" cy="9" r="0.8" fill="white"/>
        <path d="M8 11.5C8.3 12 9 12.3 10 12.3C11 12.3 11.7 12 12 11.5" stroke="white" stroke-width="1.1" stroke-linecap="round" fill="none"/>
        <path d="M10 13L10 15L8.5 14" stroke="white" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    chatIcon.setAttribute('title', 'Ask me anything !!!');
    
    // Add click handler for chat icon
    chatIcon.addEventListener('click', () => {
      console.log('[ButtonPanel] ===== CHAT ICON CLICKED =====');
      console.log('[ButtonPanel] Chat icon clicked, toggling chat popup');
      
      // Check if chat is already open for this tab
      const activeTabId = this.topicsModal.customContentModal.activeTabId;
      const contentType = this.topicsModal.customContentModal.getContentByTabId(parseInt(activeTabId))?.contentType || 'custom-content';
      const textKey = `${contentType}-${activeTabId}`;
      const contextualTextKey = `${contentType}-${activeTabId}-generic`;
      
      if (ChatDialog.isOpen && ChatDialog.currentTextKey === contextualTextKey) {
        console.log('[ButtonPanel] Chat already open for this tab, closing it');
        ChatDialog.close();
      } else {
        console.log('[ButtonPanel] Opening chat for current content');
        this.openChatForCurrentContent();
      }
    });
    
    // Store chat icon reference for later appending to modal
    this.topicsModal.customContentModal.chatIcon = chatIcon;
    console.log('[ButtonPanel] Chat icon created and stored:', !!chatIcon);
    
    // Function to check and update scrollbar visibility
    const updateScrollbarVisibility = () => {
      const hasScrollbar = editorSection.scrollHeight > editorSection.clientHeight;
      if (hasScrollbar) {
        editorSection.classList.add('has-scrollbar');
      } else {
        editorSection.classList.remove('has-scrollbar');
      }
    };
    
    // Check scrollbar visibility after content is loaded
    setTimeout(updateScrollbarVisibility, 100);
    
    // Monitor content changes to update scrollbar visibility
    const observer = new MutationObserver(updateScrollbarVisibility);
    observer.observe(editorContent, { childList: true, subtree: true });
    
    // Assemble modal
    modal.appendChild(minimizeBtn);
    modal.appendChild(tabsSection);
    modal.appendChild(editorSection);
    
    // Add resize handles
    const resizeHandles = this.createResizeHandles();
    modal.appendChild(resizeHandles);
    
    // Add chat icon to modal (positioned relative to modal, not editor content)
    console.log('[ButtonPanel] Appending chat icon to modal:', !!this.topicsModal.customContentModal.chatIcon);
    modal.appendChild(this.topicsModal.customContentModal.chatIcon);
    console.log('[ButtonPanel] Chat icon appended to modal successfully');
    
    overlay.appendChild(modal);
    
    // Add to document
    document.body.appendChild(overlay);
    
    // Initialize modal positioning for resize functionality
    this.initializeModalPositioning(modal);
    
    // Store references
    console.log('[ButtonPanel] Storing modal references...');
    this.topicsModal.customContentModal.overlay = overlay;
    this.topicsModal.customContentModal.modal = modal;
    this.topicsModal.customContentModal.editorContent = editorContent;
    this.topicsModal.customContentModal.tabsContainer = tabsContainer;
    this.topicsModal.customContentModal.addTabBtn = addTabBtn;
    this.topicsModal.customContentModal.leftArrow = leftArrow;
    this.topicsModal.customContentModal.rightArrow = rightArrow;
    this.topicsModal.customContentModal.minimizeBtn = minimizeBtn;
    console.log('[ButtonPanel] Stored tabsContainer:', this.topicsModal.customContentModal.tabsContainer);
    
    // Attach event listeners
    this.attachCustomContentModalListeners();
  },

  /**
   * Attach event listeners to custom content modal
   */
  attachCustomContentModalListeners() {
    console.log('[ButtonPanel] Attaching custom content modal listeners...');
    const overlay = this.topicsModal.customContentModal.overlay;
    const modal = this.topicsModal.customContentModal.modal;
    const minimizeBtn = this.topicsModal.customContentModal.minimizeBtn;
    const panIcon = modal.querySelector('.vocab-custom-content-pan-icon');
    const addTabBtn = this.topicsModal.customContentModal.addTabBtn;
    const tabsContainer = this.topicsModal.customContentModal.tabsContainer;
    console.log('[ButtonPanel] tabsContainer in attachCustomContentModalListeners:', tabsContainer);
    
    // Minimize modal events
    minimizeBtn.addEventListener('click', () => this.hideCustomContentModal());
    
    // Initialize dragging functionality
    this.initModalDragging(modal);
    
    
    // Add tab functionality
    addTabBtn.addEventListener('click', () => {
      // Check current content type to determine which modal to show
      const currentContentType = this.topicsModal.currentContentType;
      
      if (currentContentType === 'pdf') {
        this.showPDFUploadModal();
      } else if (currentContentType === 'image') {
        this.showImageUploadModal();
      } else if (currentContentType === 'text') {
        this.showTextInputModal();
      } else {
        this.showTopicsModalForNewTab();
      }
    });
    
    
    // Tab navigation arrows
    const leftArrow = this.topicsModal.customContentModal.leftArrow;
    const rightArrow = this.topicsModal.customContentModal.rightArrow;
    
    leftArrow.addEventListener('click', () => {
      this.scrollTabs('left');
    });
    
    rightArrow.addEventListener('click', () => {
      this.scrollTabs('right');
    });
    
    // Mouse wheel scrolling on tabs container
    tabsContainer.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        this.scrollTabs('left');
      } else {
        this.scrollTabs('right');
      }
    });
    
    // Update arrow states initially (with delay to ensure DOM is ready)
    setTimeout(() => {
      try {
        this.updateTabArrowStates();
      } catch (error) {
        console.error('[ButtonPanel] Error in updateTabArrowStates:', error);
        console.error('[ButtonPanel] Error stack:', error.stack);
      }
    }, 100);
    
    // Drag functionality for modal
    const header = modal.querySelector('.vocab-custom-content-header');
    if (header) {
      this.initModalDrag(header, modal);
    }
    
    // Resize functionality for modal
    this.initModalResize(modal);
  },

  /**
   * Show topics modal for creating a new tab
   */
  showTopicsModalForNewTab() {
    console.log('[ButtonPanel] Showing topics modal for new tab');
    
    // Blur the custom content modal background
    if (this.topicsModal.customContentModal.overlay) {
      this.topicsModal.customContentModal.overlay.style.filter = 'blur(2px)';
    }
    
    // Clear existing topics and inputs
    this.topicsModal.topics = [];
    this.topicsModal.wordCount = 100;
    this.topicsModal.difficulty = 'hard';
    
    // Clear topics tags if modal exists
    if (this.topicsModal.modal) {
      const tagsContainer = this.topicsModal.modal.querySelector('#vocab-topics-tags');
      if (tagsContainer) {
        tagsContainer.innerHTML = '';
      }
      
      // Clear input field
      const input = this.topicsModal.modal.querySelector('.vocab-topics-input');
      if (input) {
        input.value = '';
      }
      
      // Reset word count and difficulty selections
      const wordCountButtons = this.topicsModal.modal.querySelectorAll('.vocab-topics-word-count-btn');
      wordCountButtons.forEach(btn => btn.classList.remove('selected'));
      const wordCountBtn100 = this.topicsModal.modal.querySelector('[data-count="100"]');
      if (wordCountBtn100) {
        wordCountBtn100.classList.add('selected');
      }
      
      const difficultyButtons = this.topicsModal.modal.querySelectorAll('.vocab-topics-difficulty-btn');
      difficultyButtons.forEach(btn => btn.classList.remove('selected'));
      const hardBtn = this.topicsModal.modal.querySelector('[data-difficulty="hard"]');
      if (hardBtn) {
        hardBtn.classList.add('selected');
      }
      
      // Update UI state
      this.updateTopicsUIState();
    }
    
    // Show the topics modal
    this.showTopicsModal();
  },

  /**
   * Show topics modal for regenerating content
   */
  showTopicsModalForRegenerate() {
    console.log('[ButtonPanel] Showing topics modal for regenerate');
    
    // Blur the custom content modal background
    if (this.topicsModal.customContentModal.overlay) {
      this.topicsModal.customContentModal.overlay.style.filter = 'blur(2px)';
    }
    
    // Get current active tab data using new data structure
    const activeTabId = parseInt(this.topicsModal.customContentModal.activeTabId);
    const activeContent = this.topicsModal.customContentModal.getContentByTabId(activeTabId);
    if (!activeContent) {
      console.log('[ButtonPanel] No active content found, cannot regenerate');
      return;
    }
    
    // Check if this is a topic tab (can be regenerated)
    if (activeContent.contentType !== 'topic') {
      console.log('[ButtonPanel] Only topic tabs can be regenerated, current type:', activeContent.contentType);
      return;
    }
    
    // Load the topics data from the active content metadata
    if (activeContent.input) {
      // Restore the topics and settings from the content input data
      this.topicsModal.topics = activeContent.input.topics || [];
      this.topicsModal.wordCount = activeContent.input.wordCount || 100;
      this.topicsModal.difficulty = activeContent.input.difficultyLevel || 'hard';
    } else if (activeContent.metadata) {
      // Fallback to metadata for backward compatibility
      this.topicsModal.topics = activeContent.metadata.topics || [];
      this.topicsModal.wordCount = activeContent.metadata.wordCount || 100;
      this.topicsModal.difficulty = activeContent.metadata.difficulty || 'hard';
    }
    
    // Show the topics modal
    this.showTopicsModal(false);
    
    // Populate form fields with stored metadata
    setTimeout(() => {
      this.populateTopicsFormFields();
      
      // Change the generate button text to "Re-generate content"
      const generateBtn = this.topicsModal.modal.querySelector('.vocab-topics-generate-btn');
      if (generateBtn) {
        generateBtn.textContent = 'Re-generate content';
        generateBtn.setAttribute('data-regenerate', 'true');
        generateBtn.setAttribute('data-tab-id', activeTabId.toString());
      }
    }, 100);
  },

  /**
   * Populate topics form fields with stored metadata
   */
  populateTopicsFormFields() {
    console.log('[ButtonPanel] Populating topics form fields');
    
    // Clear existing topic tags
    const tagsContainer = this.topicsModal.modal.querySelector('#vocab-topics-tags');
    if (tagsContainer) {
      tagsContainer.innerHTML = '';
    }
    
    // Add topic tags from stored metadata
    this.topicsModal.topics.forEach(topic => {
      const tag = this.createTopicTag(topic);
      const tagsContainer = this.topicsModal.modal.querySelector('#vocab-topics-tags');
      if (tagsContainer) {
        tagsContainer.appendChild(tag);
      }
    });
    
    // Set word count buttons
    const wordCountButtons = this.topicsModal.modal.querySelectorAll('.vocab-topics-word-count-btn');
    wordCountButtons.forEach(btn => {
      btn.classList.remove('selected');
      if (btn.getAttribute('data-count') === this.topicsModal.wordCount.toString()) {
        btn.classList.add('selected');
      }
    });
    
    // Set difficulty buttons
    const difficultyButtons = this.topicsModal.modal.querySelectorAll('.vocab-topics-difficulty-btn');
    difficultyButtons.forEach(btn => {
      btn.classList.remove('selected');
      if (btn.getAttribute('data-difficulty') === this.topicsModal.difficulty) {
        btn.classList.add('selected');
      }
    });
    
    // Initialize sliders to show the selected options
    setTimeout(() => {
      this.initializeSliders();
    }, 50);
    
    // Update UI state
    this.updateTopicsUIState();
  },

  /**
   * Show custom content modal with contents of specific type
   */
  showCustomContentModalWithContents(contentType, activeTabId = null) {
    console.log('[ButtonPanel] Showing custom content modal with', contentType, 'contents');
    console.log('[ButtonPanel] Active tab ID to switch to:', activeTabId);
    
    // Create modal if it doesn't exist
    if (!this.topicsModal.customContentModal.overlay) {
      this.createCustomContentModal();
    }
    
    // Get contents for the specified type
    const contents = this.topicsModal.customContentModal.getContentByType(contentType);
    console.log('[ButtonPanel] Contents to show:', contents);
    
    // Update modal title
    this.updateCustomContentModalTitle(contentType);
    
    // Clear existing tabs and render new ones using original tab system
    const existingTabs = this.topicsModal.customContentModal.modal.querySelectorAll('.vocab-custom-content-tab');
    existingTabs.forEach(tab => tab.remove());
    
    // Convert contents to tab format and render using original system
    contents.forEach((contentItem) => {
      const tabId = contentItem.tabId.toString();
      const tab = {
        id: tabId,
        name: contentItem.tabName,
        content: contentItem.content,
        searchTerm: contentItem.searchTerm || '',
        metadata: contentItem.metadata,
        createdAt: contentItem.createdAt
      };
      this.renderTab(tab);
    });
    
    // Switch to the specified tab or first tab if available
    if (contents.length > 0) {
      // Use requestAnimationFrame to ensure DOM is fully rendered before switching tabs
      requestAnimationFrame(() => {
        if (activeTabId) {
          // Switch to the specified tab if it exists
          const targetContent = contents.find(content => content.tabId === activeTabId);
          if (targetContent) {
            console.log('[ButtonPanel] Switching to specified tab:', activeTabId);
            this.switchToTab(targetContent.tabId.toString());
          } else {
            console.log('[ButtonPanel] Specified tab not found, switching to first tab');
            this.switchToTab(contents[0].tabId.toString());
          }
        } else {
          // Switch to the first tab if no specific tab is specified
          console.log('[ButtonPanel] No specific tab specified, switching to first tab');
          this.switchToTab(contents[0].tabId.toString());
        }
        
        // Ensure visual selection is updated after a brief delay to account for any animations
        setTimeout(() => {
          this.updateTabSelectionVisual();
        }, 50);
      });
    }
    
    // Ensure modal is visible and add body class for blur effect
    if (!this.topicsModal.customContentModal.overlay.classList.contains('visible')) {
      this.topicsModal.customContentModal.overlay.classList.add('visible');
    }
    
    // Restore modal display if it was hidden during minimize animation
    if (this.topicsModal.customContentModal.modal) {
      this.topicsModal.customContentModal.modal.style.display = '';
    }
    
    // Always add body class to blur webpage icons
    document.body.classList.add('vocab-custom-content-modal-open');
    console.log('[ButtonPanel] Added vocab-custom-content-modal-open body class for blur effect');
    console.log('[ButtonPanel] Body classes:', document.body.classList.toString());
    
    // Update icon contexts for all existing icons
    this.updateIconContexts();
    
    // Show the modal
    setTimeout(() => {
      this.topicsModal.customContentModal.overlay.classList.add('visible');
      
      // Clear all selections when opening modal
      this.clearSelectionsOnModalOpen();
      
      // Add class to body to hide webpage icons
      document.body.classList.add('vocab-custom-content-modal-open');
      
      // Update button states after modal opens to reflect new context
      this.updateButtonStatesFromSelections();
      
      // Show info banner after a short delay
      setTimeout(() => {
        this.showCustomContentInfoBanner();
      }, 500);
    }, 100);
  },

  /**
   * Create custom content info banner
   */
  createCustomContentInfoBanner() {
    console.log('[ButtonPanel] Creating custom content info banner');
    
    // Check if banner already exists
    if (document.querySelector('.vocab-custom-content-info-banner')) {
      console.log('[ButtonPanel] Banner already exists');
      return;
    }
    
    // Create banner
    const banner = document.createElement('div');
    banner.className = 'vocab-custom-content-info-banner';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'vocab-custom-content-info-banner-header';
    
    const title = document.createElement('h3');
    title.className = 'vocab-custom-content-info-banner-title';
    title.textContent = 'Quick Tips';
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'vocab-custom-content-info-banner-close';
    closeBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    closeBtn.setAttribute('aria-label', 'Close banner');
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    
    // Create content
    const content = document.createElement('div');
    content.className = 'vocab-custom-content-info-banner-content';
    
    const list = document.createElement('ul');
    list.className = 'vocab-custom-content-info-banner-list';
    
    const item1 = document.createElement('li');
    item1.innerHTML = 'Double click a <span class="vocab-custom-content-info-banner-highlight">word</span> to select';
    
    const item2 = document.createElement('li');
    item2.innerHTML = 'Select a <span class="vocab-custom-content-info-banner-highlight">passage containing multiple words</span> or sentences';
    
    list.appendChild(item1);
    list.appendChild(item2);
    content.appendChild(list);
    
    // Create footer
    const footer = document.createElement('div');
    footer.className = 'vocab-custom-content-info-banner-footer';
    
    const dismissBtn = document.createElement('button');
    dismissBtn.className = 'vocab-custom-content-info-banner-dismiss-btn';
    dismissBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Don't show this again
    `;
    
    footer.appendChild(dismissBtn);
    
    // Assemble banner
    banner.appendChild(header);
    banner.appendChild(content);
    banner.appendChild(footer);
    
    // Add to document
    document.body.appendChild(banner);
    
    // Attach event listeners
    closeBtn.addEventListener('click', () => {
      banner.classList.remove('visible');
      setTimeout(() => {
        banner.remove();
      }, 300);
    });
    
    dismissBtn.addEventListener('click', () => {
      // Set session storage flag
      sessionStorage.setItem('vocab-hide-custom-content-info-banner', 'true');
      banner.classList.remove('visible');
      setTimeout(() => {
        banner.remove();
      }, 300);
    });
    
    console.log('[ButtonPanel] Info banner created successfully');
  },

  /**
   * Show custom content info banner
   */
  showCustomContentInfoBanner() {
    console.log('[ButtonPanel] Showing custom content info banner');
    
    // Check if user has dismissed the banner
    const shouldHide = sessionStorage.getItem('vocab-hide-custom-content-info-banner');
    if (shouldHide === 'true') {
      console.log('[ButtonPanel] User has dismissed banner, not showing');
      return;
    }
    
    // Create banner if it doesn't exist
    let banner = document.querySelector('.vocab-custom-content-info-banner');
    if (!banner) {
      this.createCustomContentInfoBanner();
      banner = document.querySelector('.vocab-custom-content-info-banner');
    }
    
    // Show with animation
    if (banner) {
      setTimeout(() => {
        banner.classList.add('visible');
      }, 100);
    }
  },

  /**
   * Hide custom content info banner
   */
  hideCustomContentInfoBanner() {
    console.log('[ButtonPanel] Hiding custom content info banner');
    const banner = document.querySelector('.vocab-custom-content-info-banner');
    if (banner) {
      banner.classList.remove('visible');
      setTimeout(() => {
        banner.remove();
      }, 300);
    }
  },

  /**
   * Show custom content modal with existing tabs
   */
  showCustomContentModalWithTabs(contentType = null, shouldFilter = false) {
    console.log('[ButtonPanel] Showing custom content modal with existing tabs');
    console.log('[ButtonPanel] Content type:', contentType);
    console.log('[ButtonPanel] Should filter:', shouldFilter);
    
    // Create modal if it doesn't exist
    if (!this.topicsModal.customContentModal.overlay) {
      this.createCustomContentModal();
    }
    
    // Determine which tabs to show
    let tabsToShow = [];
    let filteredContentType = contentType;
    
    if (shouldFilter && contentType) {
      // Filter tabs for specific content type (used when creating new content)
      tabsToShow = this.topicsModal.customContentModal.getTabsByType(contentType);
      this.topicsModal.customContentModal.activeContentType = contentType;
      this.updateCustomContentModalTitle(contentType);
      console.log('[ButtonPanel] Filtering tabs for content type:', contentType);
    } else if (!shouldFilter && contentType) {
      // Show ALL tabs but set the specified content type as active (used by button handlers)
      tabsToShow = this.topicsModal.customContentModal.getAllTabs();
      this.topicsModal.customContentModal.activeContentType = contentType;
      this.updateCustomContentModalTitle(contentType);
      console.log('[ButtonPanel] Showing all tabs with', contentType, 'as active content type');
    } else {
      // Show all tabs from all containers
      tabsToShow = this.topicsModal.customContentModal.getAllTabs();
      console.log('[ButtonPanel] Showing all tabs');
    }
    
    console.log('[ButtonPanel] Tabs to show:', tabsToShow);
    
    // Clear existing tabs and render new ones
    const existingTabs = this.topicsModal.customContentModal.modal.querySelectorAll('.vocab-custom-content-tab');
    existingTabs.forEach(tab => tab.remove());
    
    // Render all tabs to show
    tabsToShow.forEach(tab => {
      this.renderTab(tab);
    });
    
    // Switch to the active tab or first tab
    if (this.topicsModal.customContentModal.activeTabId) {
      this.switchToTab(this.topicsModal.customContentModal.activeTabId);
    } else if (tabsToShow.length > 0) {
      this.switchToTab(tabsToShow[0].id);
    }
    
    // Show the modal
    setTimeout(() => {
      this.topicsModal.customContentModal.overlay.classList.add('visible');
      
      // Restore modal display if it was hidden during minimize animation
      if (this.topicsModal.customContentModal.modal) {
        this.topicsModal.customContentModal.modal.style.display = '';
      }
      
      // Clear all selections when opening modal
      this.clearSelectionsOnModalOpen();
      
      // Add class to body to hide webpage icons
      document.body.classList.add('vocab-custom-content-modal-open');
      
      // Show info banner after a short delay
      setTimeout(() => {
        this.showCustomContentInfoBanner();
      }, 500);
    }, 100);
  },

  /**
   * Filter tabs to show only the specified content type
   * @param {string} contentType - The content type to filter by ('pdf', 'image', 'topic')
   */
  filterTabsByContentType(contentType) {
    console.log('[ButtonPanel] Filtering tabs by content type:', contentType);
    
    // Get tabs for the specified content type
    const tabsToShow = this.topicsModal.customContentModal.getTabsByType(contentType);
    console.log('[ButtonPanel] Tabs to show for', contentType + ':', tabsToShow);
    
    // Clear existing tabs from the UI
    const existingTabs = this.topicsModal.customContentModal.modal.querySelectorAll('.vocab-custom-content-tab');
    existingTabs.forEach(tab => tab.remove());
    
    // Render only the filtered tabs
    tabsToShow.forEach(tab => {
      this.renderTab(tab);
    });
    
    // Update active content type
    this.topicsModal.customContentModal.activeContentType = contentType;
    
    console.log('[ButtonPanel] Filtered tabs successfully for content type:', contentType);
  },

  /**
   * Create a new tab
   * @param {string} title - The tab title
   * @param {string} content - The tab content
   * @param {string} contentType - The content type ('pdf', 'image', 'topic')
   * @param {Object} metadata - Additional metadata for the tab
   * @returns {string} Tab ID
   */
  createTab(title, content, contentType = 'topic', metadata = {}) {
    console.log('[ButtonPanel] Creating new tab:', title, 'for content type:', contentType);
    console.log('[ButtonPanel] tabsContainer before renderTab:', this.topicsModal.customContentModal.tabsContainer);
    
    // Set current content type
    this.topicsModal.currentContentType = contentType;
    console.log('[ButtonPanel] Set currentContentType to:', contentType);
    
    // Update button visibility
    setTimeout(() => {
      this.updateVerticalButtonVisibility();
    }, 100);
    
    // Use the new container system to add tab
    const newTab = this.topicsModal.customContentModal.addTab(contentType, title, content, metadata);
    
    if (!newTab) {
      console.error('[ButtonPanel] Failed to create tab for content type:', contentType);
      return null;
    }
    
    try {
      this.renderTab(newTab);
    } catch (error) {
      console.error('[ButtonPanel] Error in renderTab:', error);
      console.error('[ButtonPanel] Error stack:', error.stack);
    }
    
    // Set as active tab if it's the first one for this content type
    const containerTabs = this.topicsModal.customContentModal.getTabsByType(contentType);
    if (containerTabs.length === 1) {
      this.switchToTab(newTab.id);
    }
    
    return newTab.id;
  },

  /**
   * Render a tab element
   * @param {Object} tab - Tab object
   */
  renderTab(tab) {
    const tabsContainer = this.topicsModal.customContentModal.tabsContainer;
    if (!tabsContainer) {
      console.warn('[ButtonPanel] tabsContainer not found, cannot render tab');
      return;
    }
    
    const tabElement = document.createElement('div');
    tabElement.className = 'vocab-custom-content-tab';
    tabElement.setAttribute('data-tab-id', tab.id);
    
    // Add content type indicator
    const contentType = tab.id.split('-')[0];
    tabElement.setAttribute('data-content-type', contentType);
    
    const titleElement = document.createElement('div');
    titleElement.className = 'vocab-custom-content-tab-title';
    
    // Get the full title - prioritize topicName from metadata for topic tabs
    let fullTitle = tab.name || tab.title; // Support both new and old structure
    
    // For topic tabs, use topicName from metadata if available
    if (contentType === 'topic' && tab.metadata && tab.metadata.topicName) {
      fullTitle = tab.metadata.topicName;
    }
    
    // Set up truncation and tooltip
    this.setupTabTitleWithTooltip(titleElement, fullTitle);
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'vocab-custom-content-tab-close';
    closeBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    closeBtn.setAttribute('aria-label', 'Close tab');
    
    tabElement.appendChild(titleElement);
    tabElement.appendChild(closeBtn);
    tabsContainer.appendChild(tabElement);
    
    // Add event listeners
    tabElement.addEventListener('click', (e) => {
      if (e.target !== closeBtn && !closeBtn.contains(e.target)) {
        this.switchToTab(tab.id);
      }
    });
    
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeTab(tab.id);
    });
    
    // Update arrow states after adding tab
    setTimeout(() => {
      this.updateTabArrowStates();
    }, 100);
  },

  /**
   * Set up tab title with truncation and hover tooltip
   * @param {HTMLElement} titleElement - The title element to configure
   * @param {string} fullTitle - The complete title text
   */
  setupTabTitleWithTooltip(titleElement, fullTitle) {
    const maxLength = 25; // Maximum characters to show before truncation
    
    if (fullTitle.length <= maxLength) {
      // Title is short enough, just set it directly
      titleElement.textContent = fullTitle;
      return;
    }
    
    // Title is too long, truncate it
    const truncatedTitle = fullTitle.substring(0, maxLength - 3) + '...';
    titleElement.textContent = truncatedTitle;
    
    // Add tooltip functionality - use custom CSS tooltip only
    titleElement.setAttribute('title', fullTitle); // This enables the CSS tooltip
    titleElement.setAttribute('data-full-title', fullTitle); // Store for custom tooltip if needed
    
    // Add CSS class for styling
    titleElement.classList.add('vocab-tab-title-truncated');
  },

  /**
   * Switch to a specific tab
   * @param {string} tabId - The tab ID to switch to
   */
  switchToTab(tabId) {
    // Check if modal and required elements exist
    if (!this.topicsModal || !this.topicsModal.customContentModal || !this.topicsModal.customContentModal.modal) {
      console.error('[ButtonPanel] Cannot switch tab - modal not initialized');
      return;
    }
    
    // Update active tab
    this.topicsModal.customContentModal.activeTabId = tabId;
    
    // Update active content type based on the tab being switched to
    const tabContent = this.topicsModal.customContentModal.getContentByTabId(parseInt(tabId));
    if (tabContent) {
      // Determine content type from the content data
      let contentType = 'topic'; // default
      if (tabContent.metadata && tabContent.metadata.fileName) {
        contentType = 'pdf';
      } else if (tabContent.metadata && tabContent.metadata.inputText) {
        contentType = 'text';
      } else if (tabContent.metadata && tabContent.metadata.imageUrl) {
        contentType = 'image';
      } else if (tabContent.metadata && tabContent.metadata.topics) {
        contentType = 'topic';
      }
      
      this.topicsModal.customContentModal.activeContentType = contentType;
      console.log('[ButtonPanel] Updated active content type to:', contentType, 'for tab:', tabId);
    }
    
    // Handle chat popup when switching tabs
    this.handleChatPopupOnTabSwitch(tabId);
    
    // Add smooth transition class to tabs container
    const tabsContainer = this.topicsModal.customContentModal.tabsContainer;
    if (tabsContainer) {
      tabsContainer.classList.add('tab-transitioning');
      tabsContainer.classList.add('has-active-tab');
    }
    
    // Update tab visual states
    const tabs = this.topicsModal.customContentModal.modal.querySelectorAll('.vocab-custom-content-tab');
    tabs.forEach(tab => {
      tab.classList.remove('active');
      if (tab.getAttribute('data-tab-id') === tabId) {
        tab.classList.add('active');
      }
    });
    
    // Get content from new data structure using tabId
    const activeContent = this.topicsModal.customContentModal.getContentByTabId(parseInt(tabId));
    const contentType = activeContent ? activeContent.contentType : null;
    
    // Update sliding background position
    const activeTabElement = tabsContainer.querySelector(`[data-tab-id="${tabId}"]`);
    if (activeTabElement) {
      const tabRect = activeTabElement.getBoundingClientRect();
      const containerRect = tabsContainer.getBoundingClientRect();
      const left = tabRect.left - containerRect.left + tabsContainer.scrollLeft;
      const width = tabRect.width;
      tabsContainer.style.setProperty('--sliding-bg-left', `${left}px`);
      tabsContainer.style.setProperty('--sliding-bg-width', `${width}px`);
    }
    
    // Update content with fade transition
    const editorContent = this.topicsModal.customContentModal.modal.querySelector('.vocab-custom-content-editor-content');
    
    if (activeContent && editorContent) {
      // Fade out current content
      editorContent.classList.add('fade-out');
      
      setTimeout(() => {
        // Update content
        this.updateCustomContentEditor(activeContent.content);
        
        // Restore analysis data for this tab
        this.restoreAnalysisData(activeContent);
      
      // Update heading based on content type
      this.updateCustomContentHeading(contentType);
      
        // Fade in new content
        editorContent.classList.remove('fade-out');
        editorContent.classList.add('fade-in');
        
        setTimeout(() => {
          editorContent.classList.remove('fade-in');
        }, 300);
      }, 150);
    }
    
    // Remove transition class after animation
    setTimeout(() => {
      if (tabsContainer) {
        tabsContainer.classList.remove('tab-transitioning');
      }
      
      // Update button states after tab switch to reflect new context
      this.updateButtonStatesFromSelections();
    }, 300);
  },

  /**
   * Restore analysis data for a tab (word meanings, simplified texts, chats)
   * @param {Object} activeContent - The active content object with analysis data
   */
  restoreAnalysisData(activeContent) {
    if (!activeContent || !activeContent.analysis) {
      console.log('[ButtonPanel] No analysis data to restore for tab:', activeContent?.tabId);
      return;
    }

    console.log('[ButtonPanel] Restoring analysis data for tab:', activeContent.tabId);
    console.log('[ButtonPanel] Analysis data:', activeContent.analysis);

    // Wait for content to be fully loaded before restoring visual elements
    setTimeout(() => {
      // Verify content element is ready
      const contentElement = this.topicsModal.customContentModal.modal.querySelector('.vocab-custom-content-editor-content');
      if (!contentElement) {
        console.log('[ButtonPanel] Content element not ready, retrying restoration in 200ms');
        setTimeout(() => this.restoreAnalysisData(activeContent), 200);
        return;
      }
      
      console.log('[ButtonPanel] Content element ready, proceeding with restoration');
      console.log('[ButtonPanel] Content text length:', contentElement.textContent.length);
      
      // Clear existing highlights first to avoid duplicates
      this.clearExistingHighlights();
      
      // Restore simplified texts FIRST to establish text highlight containers
      if (activeContent.analysis.simplifiedMeanings && activeContent.analysis.simplifiedMeanings.length > 0) {
        console.log('[ButtonPanel] Restoring', activeContent.analysis.simplifiedMeanings.length, 'simplified texts');
        // Add extra delay for simplified texts to ensure content is fully rendered
        setTimeout(() => {
          activeContent.analysis.simplifiedMeanings.forEach(simplifiedData => {
            this.restoreSimplifiedText(simplifiedData);
          });
          
          // After text highlights are restored, restore word meanings
          setTimeout(() => {
            if (activeContent.analysis.wordMeanings && activeContent.analysis.wordMeanings.length > 0) {
              console.log('[ButtonPanel] Restoring', activeContent.analysis.wordMeanings.length, 'word meanings');
              activeContent.analysis.wordMeanings.forEach(wordData => {
                this.restoreWordExplanationWithHierarchy(wordData);
              });
            }
            
            // Additional repositioning after all highlights are restored
            setTimeout(() => {
              this.repositionAllSimplifiedIcons();
            }, 100);
          }, 100);
        }, 200);
      } else {
        // If no simplified texts, restore word meanings directly
        if (activeContent.analysis.wordMeanings && activeContent.analysis.wordMeanings.length > 0) {
          console.log('[ButtonPanel] Restoring', activeContent.analysis.wordMeanings.length, 'word meanings');
          activeContent.analysis.wordMeanings.forEach(wordData => {
            this.restoreWordExplanation(wordData);
          });
        }
      }

      // Restore chats
      if (activeContent.analysis.chats && activeContent.analysis.chats.length > 0) {
        console.log('[ButtonPanel] Restoring', activeContent.analysis.chats.length, 'chats');
        activeContent.analysis.chats.forEach(chatData => {
          // Restore chat history in ChatDialog
          if (chatData.messages && chatData.messages.length > 0) {
            console.log('[ButtonPanel] ===== RESTORING FROM ANALYSIS DATA =====');
            console.log('[ButtonPanel] Restoring chat history for textKey:', chatData.textKey, 'with', chatData.messages.length, 'messages');
            console.log('[ButtonPanel] ChatDialog.chatHistories before analysis restore:', Array.from(ChatDialog.chatHistories.keys()));
            
            ChatDialog.chatHistories.set(chatData.textKey, chatData.messages);
            
            console.log('[ButtonPanel] ChatDialog.chatHistories after analysis restore:', Array.from(ChatDialog.chatHistories.keys()));
            console.log('[ButtonPanel] Chat messages:', chatData.messages);
          }
        });
      }

      // Update button states to reflect restored data
      this.updateButtonStatesFromSelections();
      
      console.log('[ButtonPanel] Analysis data restoration complete');
    }, 500); // Wait for content to be fully rendered
  },

  /**
   * Clear existing highlights from the content
   */
  clearExistingHighlights() {
    const contentElement = this.topicsModal.customContentModal.modal.querySelector('.vocab-custom-content-editor-content');
    if (!contentElement) {
      return;
    }

    // Remove all word highlights
    const wordHighlights = contentElement.querySelectorAll('.vocab-word-highlight');
    wordHighlights.forEach(highlight => {
      const parent = highlight.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
        parent.normalize();
      }
    });

    // Remove all text highlights
    const textHighlights = contentElement.querySelectorAll('.vocab-text-highlight');
    textHighlights.forEach(highlight => {
      const parent = highlight.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
        parent.normalize();
      }
    });

    // Remove only icon wrappers from modal overlay (if in modal context)
    const modalOverlay = this.topicsModal.customContentModal.overlay;
    if (modalOverlay) {
      const iconWrappers = modalOverlay.querySelectorAll('.vocab-text-icons-wrapper');
      iconWrappers.forEach(wrapper => {
        wrapper.remove();
      });
    }

    // Don't remove icon wrappers from document body - they should be preserved for main webpage
    // The main webpage icons should remain visible and functional

    console.log('[ButtonPanel] Cleared existing highlights');
  },

  /**
   * Restore visual word explanation elements with hierarchy awareness
   * @param {Object} wordData - Word explanation data
   */
  restoreWordExplanationWithHierarchy(wordData) {
    console.log('[ButtonPanel] Restoring word explanation with hierarchy for:', wordData.word);
    console.log('[ButtonPanel] Word data:', wordData);
    
    // Find the content element
    const contentElement = this.topicsModal.customContentModal.modal.querySelector('.vocab-custom-content-editor-content');
    if (!contentElement) {
      console.log('[ButtonPanel] Content element not found for word restoration');
      return;
    }

    const textContent = contentElement.textContent || contentElement.innerText;
    if (!textContent) {
      console.log('[ButtonPanel] No text content found for word restoration');
      return;
    }

    // Use stored textStartIndex if available, otherwise fall back to regex search
    if (wordData.textStartIndex !== undefined && wordData.location !== undefined) {
      console.log('[ButtonPanel] Using stored positioning data - textStartIndex:', wordData.textStartIndex, 'location:', wordData.location);
      console.log('[ButtonPanel] Text content length:', textContent.length);
      console.log('[ButtonPanel] Text content preview:', textContent.substring(0, 200));
      
      // Use the stored location data to find the word
      const wordStart = wordData.textStartIndex + wordData.location.index;
      const wordEnd = wordStart + wordData.location.length;
      
      console.log('[ButtonPanel] Calculated word position:', wordStart, '-', wordEnd);
      
      // Verify the word matches at this position
      const wordAtPosition = textContent.substring(wordStart, wordEnd);
      console.log('[ButtonPanel] Word at calculated position:', wordAtPosition);
      
      if (wordAtPosition.toLowerCase() === wordData.normalizedWord) {
        console.log('[ButtonPanel] Word matches at calculated position');
        
        // Check if this word is inside an existing text highlight
        const textHighlights = contentElement.querySelectorAll('.vocab-text-highlight');
        let targetTextHighlight = null;
        
        for (const textHighlight of textHighlights) {
          const textHighlightStart = this.getTextNodeOffset(textHighlight);
          const textHighlightEnd = textHighlightStart + textHighlight.textContent.length;
          
          console.log('[ButtonPanel] Checking text highlight:', textHighlightStart, '-', textHighlightEnd);
          
          // Check if word position is within this text highlight
          if (wordStart >= textHighlightStart && wordEnd <= textHighlightEnd) {
            console.log('[ButtonPanel] Word is inside text highlight, will nest it');
            targetTextHighlight = textHighlight;
            break;
          }
        }
        
        if (targetTextHighlight) {
          // Word should be nested inside the text highlight
          this.createNestedWordHighlight(targetTextHighlight, wordStart, wordEnd, wordData);
        } else {
          // Word is not inside any text highlight, create standalone highlight
          this.createStandaloneWordHighlight(contentElement, wordStart, wordEnd, wordData);
        }
      } else {
        console.log('[ButtonPanel] Word does not match at calculated position, falling back to regex search');
        this.restoreWordExplanation(wordData);
      }
    } else {
      console.log('[ButtonPanel] No stored positioning data, falling back to regex search');
      this.restoreWordExplanation(wordData);
    }
  },

  /**
   * Create a word highlight nested inside a text highlight
   * @param {HTMLElement} textHighlight - The parent text highlight element
   * @param {number} wordStart - Start position of the word
   * @param {number} wordEnd - End position of the word
   * @param {Object} wordData - Word explanation data
   */
  createNestedWordHighlight(textHighlight, wordStart, wordEnd, wordData) {
    console.log('[ButtonPanel] Creating nested word highlight for:', wordData.word);
    
    const textHighlightStart = this.getTextNodeOffset(textHighlight);
    const relativeWordStart = wordStart - textHighlightStart;
    const relativeWordEnd = wordEnd - textHighlightStart;
    
    console.log('[ButtonPanel] Text highlight start:', textHighlightStart);
    console.log('[ButtonPanel] Relative word position:', relativeWordStart, '-', relativeWordEnd);
    
    // Create word highlight element
    const wordHighlight = document.createElement('span');
    wordHighlight.className = 'vocab-word-highlight vocab-word-explained';
    wordHighlight.setAttribute('data-word-highlight', `${wordData.normalizedWord}-0`);
    wordHighlight.setAttribute('data-meaning', wordData.meaning);
    wordHighlight.setAttribute('data-examples', JSON.stringify(wordData.examples));
    
    // Replace the word text within the text highlight
    this.replaceTextInElement(textHighlight, relativeWordStart, relativeWordEnd, wordHighlight);
    
    // Add to WordSelector explained words
    if (!WordSelector.explainedWords.has(wordData.normalizedWord)) {
      WordSelector.explainedWords.set(wordData.normalizedWord, {
        word: wordData.word,
        meaning: wordData.meaning,
        examples: wordData.examples,
        shouldAllowFetchMoreExamples: wordData.shouldAllowFetchMoreExamples || false,
        hasCalledGetMoreExamples: false,
        languageCode: wordData.languageCode || null,
        highlights: new Set()
      });
    }
    WordSelector.explainedWords.get(wordData.normalizedWord).highlights.add(wordHighlight);

    // Add green cross button
    const greenCrossBtn = WordSelector.createRemoveExplainedButton(wordData.word);
    wordHighlight.appendChild(greenCrossBtn);

    // Setup word interactions
    WordSelector.setupWordInteractions(wordHighlight);

    console.log('[ButtonPanel] Created nested word highlight for:', wordData.word);
  },

  /**
   * Create a standalone word highlight (not nested)
   * @param {HTMLElement} contentElement - The content element
   * @param {number} wordStart - Start position of the word
   * @param {number} wordEnd - End position of the word
   * @param {Object} wordData - Word explanation data
   */
  createStandaloneWordHighlight(contentElement, wordStart, wordEnd, wordData) {
    console.log('[ButtonPanel] Creating standalone word highlight for:', wordData.word);
    
    // Create word highlight element
    const wordHighlight = document.createElement('span');
    wordHighlight.className = 'vocab-word-highlight vocab-word-explained';
    wordHighlight.setAttribute('data-word-highlight', `${wordData.normalizedWord}-0`);
    wordHighlight.setAttribute('data-meaning', wordData.meaning);
    wordHighlight.setAttribute('data-examples', JSON.stringify(wordData.examples));
    
    // Replace the word text in the content
    this.replaceTextInElement(contentElement, wordStart, wordEnd, wordHighlight);
    
    // Add to WordSelector explained words
    if (!WordSelector.explainedWords.has(wordData.normalizedWord)) {
      WordSelector.explainedWords.set(wordData.normalizedWord, {
        word: wordData.word,
        meaning: wordData.meaning,
        examples: wordData.examples,
        shouldAllowFetchMoreExamples: wordData.shouldAllowFetchMoreExamples || false,
        hasCalledGetMoreExamples: false,
        languageCode: wordData.languageCode || null,
        highlights: new Set()
      });
    }
    WordSelector.explainedWords.get(wordData.normalizedWord).highlights.add(wordHighlight);

    // Add green cross button
    const greenCrossBtn = WordSelector.createRemoveExplainedButton(wordData.word);
    wordHighlight.appendChild(greenCrossBtn);

    // Setup word interactions
    WordSelector.setupWordInteractions(wordHighlight);

    console.log('[ButtonPanel] Created standalone word highlight for:', wordData.word);
  },

  /**
   * Get the text node offset of an element within its parent
   * @param {HTMLElement} element - The element to get offset for
   * @returns {number} The offset position
   */
  getTextNodeOffset(element) {
    let offset = 0;
    let node = element.previousSibling;
    
    while (node) {
      if (node.nodeType === Node.TEXT_NODE) {
        offset += node.textContent.length;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        offset += node.textContent.length;
      }
      node = node.previousSibling;
    }
    
    return offset;
  },

  /**
   * Restore visual word explanation elements (original function for fallback)
   * @param {Object} wordData - Word explanation data
   */
  restoreWordExplanation(wordData) {
    console.log('[ButtonPanel] Restoring word explanation for:', wordData.word);
    console.log('[ButtonPanel] Word data:', wordData);
    
    // Find the content element
    const contentElement = this.topicsModal.customContentModal.modal.querySelector('.vocab-custom-content-editor-content');
    if (!contentElement) {
      console.log('[ButtonPanel] Content element not found for word restoration');
      return;
    }

    const textContent = contentElement.textContent || contentElement.innerText;
    if (!textContent) {
      console.log('[ButtonPanel] No text content found for word restoration');
      return;
    }

    // Use stored textStartIndex if available, otherwise fall back to regex search
    if (wordData.textStartIndex !== undefined && wordData.location !== undefined) {
      console.log('[ButtonPanel] Using stored positioning data - textStartIndex:', wordData.textStartIndex, 'location:', wordData.location);
      console.log('[ButtonPanel] Text content length:', textContent.length);
      console.log('[ButtonPanel] Text content preview:', textContent.substring(0, 200));
      
      // Use the stored location data to find the word
      const wordStart = wordData.textStartIndex + wordData.location.index;
      const wordEnd = wordStart + wordData.location.length;
      
      console.log('[ButtonPanel] Calculated word position:', wordStart, '-', wordEnd);
      
      // Verify the word matches at this position
      const wordAtPosition = textContent.substring(wordStart, wordEnd);
      console.log('[ButtonPanel] Word at calculated position:', wordAtPosition);
      console.log('[ButtonPanel] Expected word:', wordData.word);
      
      if (wordAtPosition.toLowerCase() === wordData.word.toLowerCase()) {
        console.log('[ButtonPanel] Found word at stored position:', wordAtPosition);
        
        // Check if this word is already highlighted
        const existingHighlight = contentElement.querySelector(`[data-word-highlight="${wordData.normalizedWord}-0"]`);
        if (existingHighlight) {
          console.log('[ButtonPanel] Word already highlighted:', wordData.word);
          return;
        }

        // Create word highlight element
        const highlight = document.createElement('span');
        highlight.className = 'vocab-word-highlight vocab-word-explained';
        highlight.setAttribute('data-word-highlight', `${wordData.normalizedWord}-0`);
        highlight.setAttribute('data-meaning', wordData.meaning);
        highlight.setAttribute('data-examples', JSON.stringify(wordData.examples));
        highlight.textContent = wordAtPosition;

        // Replace the word in the DOM using stored position
        this.replaceTextInElement(contentElement, wordStart, wordEnd, highlight);

        // Add to WordSelector explained words
        if (!WordSelector.explainedWords.has(wordData.normalizedWord)) {
          WordSelector.explainedWords.set(wordData.normalizedWord, {
            word: wordData.word,
            meaning: wordData.meaning,
            examples: wordData.examples,
            shouldAllowFetchMoreExamples: wordData.shouldAllowFetchMoreExamples || false,
            hasCalledGetMoreExamples: false,
            languageCode: wordData.languageCode || null,
            highlights: new Set()
          });
        }
        WordSelector.explainedWords.get(wordData.normalizedWord).highlights.add(highlight);

        // Add green cross button
        const greenCrossBtn = WordSelector.createRemoveExplainedButton(wordData.word);
        highlight.appendChild(greenCrossBtn);

        // Setup word interactions
        WordSelector.setupWordInteractions(highlight);

        console.log('[ButtonPanel] Restored word highlight for:', wordData.word, 'at position', wordStart, '-', wordEnd);
        return;
      } else {
        console.log('[ButtonPanel] Word mismatch at stored position. Expected:', wordData.word, 'Found:', wordAtPosition);
        console.log('[ButtonPanel] Falling back to regex search');
      }
    }

    // Fallback: Find word positions using regex (original logic)
    console.log('[ButtonPanel] Using regex search fallback for word:', wordData.word);
    const wordRegex = new RegExp(`\\b${wordData.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    let match;
    const wordPositions = [];
    
    while ((match = wordRegex.exec(textContent)) !== null) {
      wordPositions.push({
        start: match.index,
        end: match.index + match[0].length,
        word: match[0]
      });
    }

    console.log('[ButtonPanel] Found', wordPositions.length, 'instances of word:', wordData.word);

    // Create highlights for each word instance
    wordPositions.forEach((pos, index) => {
      // Check if this word is already highlighted
      const existingHighlight = contentElement.querySelector(`[data-word-highlight="${wordData.normalizedWord}-${index}"]`);
      if (existingHighlight) {
        console.log('[ButtonPanel] Word already highlighted:', wordData.word, 'instance', index);
        return;
      }

      // Create word highlight element
      const highlight = document.createElement('span');
      highlight.className = 'vocab-word-highlight vocab-word-explained';
      highlight.setAttribute('data-word-highlight', `${wordData.normalizedWord}-${index}`);
      highlight.setAttribute('data-meaning', wordData.meaning);
      highlight.setAttribute('data-examples', JSON.stringify(wordData.examples));
      highlight.textContent = pos.word;

      // Replace the word in the DOM
      this.replaceTextInElement(contentElement, pos.start, pos.end, highlight);

      // Add to WordSelector explained words
      if (!WordSelector.explainedWords.has(wordData.normalizedWord)) {
        WordSelector.explainedWords.set(wordData.normalizedWord, {
          word: wordData.word,
          meaning: wordData.meaning,
          examples: wordData.examples,
          shouldAllowFetchMoreExamples: wordData.shouldAllowFetchMoreExamples || false,
          hasCalledGetMoreExamples: false,
          highlights: new Set()
        });
      }
      WordSelector.explainedWords.get(wordData.normalizedWord).highlights.add(highlight);

      // Add green cross button
      const greenCrossBtn = WordSelector.createRemoveExplainedButton(wordData.word);
      highlight.appendChild(greenCrossBtn);

      // Setup word interactions
      WordSelector.setupWordInteractions(highlight);

      console.log('[ButtonPanel] Restored word highlight for:', wordData.word, 'instance', index);
    });
  },

  /**
   * Restore visual simplified text elements
   * @param {Object} simplifiedData - Simplified text data
   */
  restoreSimplifiedText(simplifiedData) {
    console.log('[ButtonPanel] ===== RESTORING SIMPLIFIED TEXT =====');
    console.log('[ButtonPanel] Restoring simplified text for textKey:', simplifiedData.textKey);
    console.log('[ButtonPanel] Simplified data:', simplifiedData);
    
    const contentElement = this.topicsModal.customContentModal.modal.querySelector('.vocab-custom-content-editor-content');
    if (!contentElement) {
      console.log('[ButtonPanel] Content element not found for simplified text restoration');
      return;
    }

    const textContent = contentElement.textContent || contentElement.innerText;
    if (!textContent) {
      console.log('[ButtonPanel] No text content found for simplified text restoration');
      return;
    }

    // Instead of using indices, search for the original text content
    const originalText = simplifiedData.originalText;
    if (!originalText) {
      console.log('[ButtonPanel] No original text found in simplified data');
      return;
    }

    console.log('[ButtonPanel] Searching for original text:', originalText.substring(0, 50) + '...');
    console.log('[ButtonPanel] Content length:', textContent.length);

    // Find the text segment in the content using text matching
    const textIndex = textContent.indexOf(originalText);
    if (textIndex === -1) {
      console.log('[ButtonPanel] Original text not found in current content');
      // Try to find a partial match
      const words = originalText.split(' ').slice(0, 5); // First 5 words
      const partialText = words.join(' ');
      const partialIndex = textContent.indexOf(partialText);
      if (partialIndex !== -1) {
        console.log('[ButtonPanel] Found partial match, using first 5 words');
        this.createSimplifiedHighlight(contentElement, partialIndex, partialText.length, partialText, simplifiedData);
      } else {
        console.log('[ButtonPanel] No match found for simplified text');
      }
      return;
    }

    console.log('[ButtonPanel] Found original text at index:', textIndex);
    this.createSimplifiedHighlight(contentElement, textIndex, originalText.length, originalText, simplifiedData);
    console.log('[ButtonPanel] ===== SIMPLIFIED TEXT RESTORATION COMPLETE =====');
  },

  /**
   * Create a simplified text highlight
   * @param {HTMLElement} contentElement - The content element
   * @param {number} startIndex - Start index of the text
   * @param {number} length - Length of the text
   * @param {string} text - The text content
   * @param {Object} simplifiedData - The simplified data object
   */
  createSimplifiedHighlight(contentElement, startIndex, length, text, simplifiedData) {
    console.log('[ButtonPanel] ===== CREATING SIMPLIFIED HIGHLIGHT =====');
    console.log('[ButtonPanel] Start index:', startIndex, 'Length:', length, 'Text:', text.substring(0, 50) + '...');
    
    // Check if this text is already highlighted
    const existingHighlight = contentElement.querySelector(`[data-text-highlight="${simplifiedData.textKey}"]`);
    if (existingHighlight) {
      console.log('[ButtonPanel] Text already highlighted for textKey:', simplifiedData.textKey);
      return;
    }

    console.log('[ButtonPanel] Creating simplified text highlight for:', text.substring(0, 30) + '...');

    // Create text highlight element
    const highlight = document.createElement('span');
    highlight.className = 'vocab-text-highlight vocab-text-simplified';
    highlight.setAttribute('data-text-highlight', simplifiedData.textKey);
    highlight.textContent = text;

    // Replace the text in the DOM
    this.replaceTextInElement(contentElement, startIndex, startIndex + length, highlight);

    // Create wrapper for icons
    const iconsWrapper = document.createElement('div');
    iconsWrapper.className = 'vocab-text-icons-wrapper';
    iconsWrapper.setAttribute('data-text-key', simplifiedData.textKey);
    
    // Add book button first (top position)
    const bookBtn = TextSelector.createBookButton(simplifiedData.textKey);
    iconsWrapper.appendChild(bookBtn);
    
    // Add green remove button second (bottom position)
    const greenRemoveBtn = TextSelector.createGreenRemoveButtonForSimplifiedText(simplifiedData.textKey);
    iconsWrapper.appendChild(greenRemoveBtn);
    
    // Check if we're in modal context or main webpage context
    const modalOverlay = this.topicsModal.customContentModal.overlay;
    if (modalOverlay && contentElement.closest('.vocab-custom-content-modal')) {
      // Modal context: append to editor container so icons scroll with text
      const editorContainer = contentElement.closest('.vocab-custom-content-editor-content');
      if (editorContainer) {
        editorContainer.appendChild(iconsWrapper);
        iconsWrapper.setAttribute('data-icon-context', 'custom-content-modal');
        this.positionIconsRelativeToHighlight(iconsWrapper, highlight);
      } else {
        // Fallback to modal overlay if editor container not found
        modalOverlay.appendChild(iconsWrapper);
        iconsWrapper.setAttribute('data-icon-context', 'custom-content-modal');
        this.positionIconsRelativeToHighlight(iconsWrapper, highlight);
      }
    } else {
      // Main webpage context: append to document body and position relative to highlight
      document.body.appendChild(iconsWrapper);
      iconsWrapper.setAttribute('data-icon-context', 'main-webpage');
      this.positionIconsRelativeToHighlight(iconsWrapper, highlight);
    }

    // Add to TextSelector simplified texts
    TextSelector.simplifiedTexts.set(simplifiedData.textKey, {
      textStartIndex: startIndex,
      textLength: length,
      text: text,
      simplifiedText: simplifiedData.simplifiedText,
      previousSimplifiedTexts: simplifiedData.previousSimplifiedTexts || [],
      shouldAllowSimplifyMore: simplifiedData.shouldAllowSimplifyMore || false,
      highlight: highlight
    });

    console.log('[ButtonPanel] Restored simplified text highlight for textKey:', simplifiedData.textKey);
    console.log('[ButtonPanel] ===== SIMPLIFIED HIGHLIGHT CREATION COMPLETE =====');
  },

  /**
   * Position icons relative to a text highlight
   * @param {HTMLElement} iconsWrapper - The icons wrapper element
   * @param {HTMLElement} highlight - The text highlight element
   */
  positionIconsRelativeToHighlight(iconsWrapper, highlight) {
    // Function to perform the actual positioning
    const performPositioning = () => {
      const highlightRect = highlight.getBoundingClientRect();
      const isModalContext = highlight.closest('.vocab-custom-content-modal');
      
      // Check if highlight has valid dimensions
      if (highlightRect && highlightRect.width > 0 && highlightRect.height > 0) {
        if (isModalContext) {
          // Modal context: position relative to editor container
          const editorContainer = highlight.closest('.vocab-custom-content-editor-content');
          if (editorContainer) {
            const editorRect = editorContainer.getBoundingClientRect();
            
            // Position icons on the top left of the highlight (like main webpage)
            const top = highlightRect.top - editorRect.top - 40; // 40px above
            const left = highlightRect.left - editorRect.left - 60; // 60px to the left
            
            iconsWrapper.style.top = `${Math.max(10, top)}px`; // Ensure it doesn't go above editor
            iconsWrapper.style.left = `${Math.max(10, left)}px`; // Ensure it doesn't go left of editor
            iconsWrapper.style.position = 'absolute'; // Ensure absolute positioning within editor
            
            console.log('[ButtonPanel] Modal context - Positioned icons relative to editor:', { 
              top: iconsWrapper.style.top, 
              left: iconsWrapper.style.left,
              highlightRect: { top: highlightRect.top, left: highlightRect.left },
              editorRect: { top: editorRect.top, left: editorRect.left }
            });
          } else {
            // Fallback to modal overlay positioning
            const modalOverlay = this.topicsModal.customContentModal.overlay;
            if (modalOverlay) {
              const overlayRect = modalOverlay.getBoundingClientRect();
              
              const top = highlightRect.top - overlayRect.top - 40;
              const left = highlightRect.left - overlayRect.left - 60;
              
              iconsWrapper.style.top = `${Math.max(10, top)}px`;
              iconsWrapper.style.left = `${Math.max(10, left)}px`;
            }
          }
        } else {
          // Main webpage context: position relative to viewport (original behavior)
          const top = highlightRect.top - 40; // 40px above
          const left = highlightRect.left - 40; // 40px to the left
          
          iconsWrapper.style.top = `${Math.max(10, top)}px`; // Ensure it doesn't go above viewport
          iconsWrapper.style.left = `${Math.max(10, left)}px`; // Ensure it doesn't go left of viewport
          
          console.log('[ButtonPanel] Main webpage context - Positioned icons at:', { 
            top: iconsWrapper.style.top, 
            left: iconsWrapper.style.left,
            highlightRect: { top: highlightRect.top, left: highlightRect.left }
          });
        }
        return true; // Successfully positioned
      }
      return false; // Not ready yet
    };

    // Try positioning immediately
    if (performPositioning()) {
      return;
    }

    // If not ready, try with increasing delays
    const delays = [50, 100, 200, 300];
    delays.forEach(delay => {
      setTimeout(() => {
        if (!performPositioning()) {
          console.log('[ButtonPanel] Positioning attempt failed at delay:', delay);
        }
      }, delay);
    });
  },

  /**
   * Reposition all simplified text icons after restoration
   */
  repositionAllSimplifiedIcons() {
    console.log('[ButtonPanel] Repositioning all simplified text icons');
    
    // Get all simplified text highlights
    const contentElement = this.topicsModal.customContentModal.modal.querySelector('.vocab-custom-content-editor-content');
    if (!contentElement) {
      console.log('[ButtonPanel] No content element found for repositioning');
      return;
    }
    
    const simplifiedHighlights = contentElement.querySelectorAll('.vocab-text-highlight.vocab-text-simplified');
    console.log('[ButtonPanel] Found', simplifiedHighlights.length, 'simplified highlights to reposition');
    
    simplifiedHighlights.forEach(highlight => {
      const textKey = highlight.getAttribute('data-text-highlight');
      if (textKey) {
        // Find the corresponding icon wrapper
        const modalOverlay = this.topicsModal.customContentModal.overlay;
        if (modalOverlay) {
          const iconsWrapper = modalOverlay.querySelector(`[data-text-key="${textKey}"]`);
          if (iconsWrapper) {
            console.log('[ButtonPanel] Repositioning icons for textKey:', textKey);
            this.positionIconsRelativeToHighlight(iconsWrapper, highlight);
          }
        }
      }
    });
    
    console.log('[ButtonPanel] Completed repositioning all simplified text icons');
  },

  /**
   * Open chat dialog for current content tab
   */
  openChatForCurrentContent() {
    console.log('[ButtonPanel] ===== OPENING CHAT FOR CURRENT CONTENT =====');
    console.log('[ButtonPanel] Opening chat for current content');
    
    // Get the currently active tab content
    const activeTabId = this.topicsModal.customContentModal.activeTabId;
    console.log('[ButtonPanel] Active tab ID:', activeTabId);
    if (!activeTabId) {
      console.log('[ButtonPanel] ERROR: No active tab found');
      return;
    }
    
    const activeContent = this.topicsModal.customContentModal.getContentByTabId(parseInt(activeTabId));
    console.log('[ButtonPanel] Active content found:', !!activeContent);
    if (!activeContent) {
      console.log('[ButtonPanel] ERROR: No active content found for tabId:', activeTabId);
      return;
    }
    
    console.log('[ButtonPanel] Active content details:', {
      tabId: activeContent.tabId,
      tabName: activeContent.tabName,
      contentType: activeContent.contentType,
      hasAnalysis: !!activeContent.analysis,
      chatsCount: activeContent.analysis?.chats?.length || 0
    });
    
    // Get the text content from the editor
    const editorContent = this.topicsModal.customContentModal.modal.querySelector('.vocab-custom-content-editor-content');
    if (!editorContent) {
      console.log('[ButtonPanel] No editor content found');
      return;
    }
    
    // Get the text content (remove any HTML tags)
    let textContent = editorContent.textContent || editorContent.innerText;
    if (!textContent || textContent.trim().length === 0) {
      console.log('[ButtonPanel] No text content found in editor');
      return;
    }
    
    // Truncate text content if it's too large to prevent API 422 errors
    // Most APIs have limits around 50,000 characters for context
    const MAX_CONTEXT_LENGTH = 40000; // Leave some buffer
    if (textContent.length > MAX_CONTEXT_LENGTH) {
      console.log('[ButtonPanel] Text content too large (' + textContent.length + ' chars), truncating to ' + MAX_CONTEXT_LENGTH + ' chars');
      textContent = textContent.substring(0, MAX_CONTEXT_LENGTH) + '...\n\n[Content truncated for API processing]';
    }
    
    console.log('[ButtonPanel] Text content length:', textContent.length);
    console.log('[ButtonPanel] Text content preview:', textContent.substring(0, 100) + '...');
    
    // Generate a consistent textKey for this content tab using proper format
    const contentType = activeContent.contentType || 'custom-content';
    const textKey = `${contentType}-${activeTabId}`;
    console.log('[ButtonPanel] Generated textKey:', textKey, 'for contentType:', contentType, 'tabId:', activeTabId);
    
    // Check if chat dialog is already open for this tab
    if (ChatDialog.isOpen && ChatDialog.currentTextKey === textKey) {
      console.log('[ButtonPanel] Chat already open for this tab, closing it');
      ChatDialog.close();
      return;
    }
    
    // Check if there's existing chat history for this tab
    let existingChatHistory = null;
    const contextualTextKey = `${contentType}-${activeTabId}-generic`;
    console.log('[ButtonPanel] Looking for chat history with contextualTextKey:', contextualTextKey);
    
    if (activeContent.analysis && activeContent.analysis.chats) {
      console.log('[ButtonPanel] Available chats in analysis:', activeContent.analysis.chats.map(c => c.textKey));
      
      // Find chat history for this specific contextual textKey
      existingChatHistory = activeContent.analysis.chats.find(chat => 
        chat.textKey === contextualTextKey && chat.messages && chat.messages.length > 0
      );
      
      if (existingChatHistory) {
        console.log('[ButtonPanel] Found existing chat history for contextualTextKey:', contextualTextKey, 'with', existingChatHistory.messages.length, 'messages');
      } else {
        console.log('[ButtonPanel] No existing chat history found for contextualTextKey:', contextualTextKey);
      }
    }
    
    console.log('[ButtonPanel] Existing chat history found:', existingChatHistory ? existingChatHistory.messages.length : 0, 'messages');
    
    // Open the chat dialog with the current content as initial context
    console.log('[ButtonPanel] Calling ChatDialog.open with:', {
      textContentLength: textContent.length,
      textKey: textKey,
      mode: 'ask',
      chatContext: 'general'
    });
    ChatDialog.open(textContent, textKey, 'ask', null, 'general');
    console.log('[ButtonPanel] ChatDialog.open called successfully');
    
    // If there's existing chat history, restore it to the ChatDialog
    if (existingChatHistory && existingChatHistory.messages.length > 0) {
      console.log('[ButtonPanel] ===== RESTORING CHAT HISTORY =====');
      console.log('[ButtonPanel] Restoring chat history for contextualTextKey:', contextualTextKey);
      console.log('[ButtonPanel] Messages to restore:', existingChatHistory.messages.length);
      console.log('[ButtonPanel] ChatDialog.chatHistories before set:', Array.from(ChatDialog.chatHistories.keys()));
      
      ChatDialog.chatHistories.set(contextualTextKey, existingChatHistory.messages);
      ChatDialog.chatHistory = [...existingChatHistory.messages];
      
      console.log('[ButtonPanel] ChatDialog.chatHistories after set:', Array.from(ChatDialog.chatHistories.keys()));
      console.log('[ButtonPanel] ChatDialog.chatHistory length:', ChatDialog.chatHistory.length);
      
      // Re-render the chat messages
      setTimeout(() => {
        ChatDialog.renderChatMessages();
      }, 100);
    } else {
      // No existing chat history in analysis data - check if it exists in ChatDialog.chatHistories
      console.log('[ButtonPanel] No existing chat history in analysis data, checking ChatDialog.chatHistories');
      console.log('[ButtonPanel] Available keys in ChatDialog.chatHistories:', Array.from(ChatDialog.chatHistories.keys()));
      
      const existingInMemory = ChatDialog.chatHistories.get(contextualTextKey);
      if (existingInMemory && existingInMemory.length > 0) {
        console.log('[ButtonPanel] Found existing chat history in memory for contextualTextKey:', contextualTextKey);
        ChatDialog.chatHistory = [...existingInMemory];
        
        // Re-render the chat messages
        setTimeout(() => {
          ChatDialog.renderChatMessages();
        }, 100);
      } else {
        // No existing chat history anywhere - start fresh
        console.log('[ButtonPanel] No existing chat history anywhere, starting fresh');
        ChatDialog.chatHistory = []; // Clear current chat history only
        
        // Re-render the chat messages to show empty state
        setTimeout(() => {
          ChatDialog.renderChatMessages();
        }, 100);
      }
    }
    
    // Auto-focus is now handled by ChatDialog.show() based on chat context
    // No need to auto-focus here since generic chat should not be auto-focused
    
    console.log('[ButtonPanel] Chat dialog opened for current content');
  },

  /**
   * Handle chat popup behavior when switching tabs
   * @param {string} tabId - The tab ID being switched to
   */
  handleChatPopupOnTabSwitch(tabId) {
    console.log('[ButtonPanel] Handling chat popup for tab switch to:', tabId);
    
    // Get the PREVIOUS tab ID (the one we're leaving)
    const previousTabId = this.topicsModal.customContentModal.activeTabId;
    console.log('[ButtonPanel] Previous tab ID:', previousTabId);
    
    // Save current chat history to analysis data before closing (for the tab where chat was opened)
    if (ChatDialog.isOpen && ChatDialog.currentTextKey && ChatDialog.chatHistory.length > 0) {
      // Extract the tab ID from the currentTextKey (format: <contentType>-<tabId>-generic or <contentType>-<tabId>-<startIndex>-<length>)
      const chatTabId = ChatDialog.currentTextKey.replace(/^[^-]+-(\d+)-.*/, '$1');
      console.log('[ButtonPanel] Saving current chat history for chat tab:', chatTabId);
      console.log('[ButtonPanel] Chat was opened for tab:', chatTabId, 'but switching to tab:', tabId);
      console.log('[ButtonPanel] CurrentTextKey:', ChatDialog.currentTextKey, 'ChatContext:', ChatDialog.chatContext);
      
      // Get the content for the tab where the chat was originally opened
      const chatActiveContent = this.topicsModal.customContentModal.getContentByTabId(parseInt(chatTabId));
      if (chatActiveContent && chatActiveContent.analysis) {
        console.log('[ButtonPanel] Available chats before saving:', chatActiveContent.analysis.chats.map(c => c.textKey));
        const existingChatIndex = chatActiveContent.analysis.chats.findIndex(c =>
          c.textKey === ChatDialog.currentTextKey
        );

        const chatData = {
          textKey: ChatDialog.currentTextKey,
          originalText: ChatDialog.currentText,
          messages: [...ChatDialog.chatHistory],
          lastUpdated: new Date().toISOString()
        };

        if (existingChatIndex !== -1) {
          chatActiveContent.analysis.chats[existingChatIndex] = chatData;
          console.log(`[ButtonPanel] Updated existing chat for textKey "${ChatDialog.currentTextKey}" in analysis data for tab ${chatTabId}`);
        } else {
          chatActiveContent.analysis.chats.push(chatData);
          console.log(`[ButtonPanel] Added new chat for textKey "${ChatDialog.currentTextKey}" to analysis data for tab ${chatTabId}`);
        }
      }
    }
    
    // Close current chat popup if it's open
    if (ChatDialog.isOpen) {
      console.log('[ButtonPanel] Closing current chat popup');
      ChatDialog.close();
    }
    
    // NO AUTO-OPENING - just track chat history per tab in memory
    console.log('[ButtonPanel] Chat history saved, no auto-opening chat popup');
  },


  /**
   * Replace text in an element with a new element
   * @param {HTMLElement} element - The element containing the text
   * @param {number} startIndex - Start index of text to replace
   * @param {number} endIndex - End index of text to replace
   * @param {HTMLElement} newElement - The new element to insert
   */
  replaceTextInElement(element, startIndex, endIndex, newElement) {
    console.log('[ButtonPanel] replaceTextInElement called with:', { startIndex, endIndex, newElement: newElement.textContent });
    
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let currentPos = 0;
    let node;
    let targetNode = null;
    let targetStart = 0;

    // Find the text node containing our target range
    while (node = walker.nextNode()) {
      const nodeLength = node.textContent.length;
      
      if (currentPos + nodeLength > startIndex) {
        targetNode = node;
        targetStart = startIndex - currentPos;
        break;
      }
      currentPos += nodeLength;
    }

    if (!targetNode) {
      console.log('[ButtonPanel] Could not find target text node for replacement at position', startIndex);
      console.log('[ButtonPanel] Element text content length:', element.textContent.length);
      console.log('[ButtonPanel] Element text content preview:', element.textContent.substring(0, 100));
      return;
    }

    // Verify the target text matches what we expect
    const targetText = targetNode.textContent.substring(targetStart, targetStart + (endIndex - startIndex));
    const expectedText = newElement.textContent;
    
    console.log('[ButtonPanel] Target text at position:', targetText);
    console.log('[ButtonPanel] Expected text:', expectedText);
    
    if (targetText.toLowerCase() !== expectedText.toLowerCase()) {
      console.warn('[ButtonPanel] Text mismatch at position. Expected:', expectedText, 'Found:', targetText);
      // Continue anyway, as the text might have slight differences (case, whitespace)
    }

    // Split the text node if necessary
    const beforeText = targetNode.textContent.substring(0, targetStart);
    const afterText = targetNode.textContent.substring(targetStart + (endIndex - startIndex));

    // Create new text nodes
    if (beforeText) {
      const beforeNode = document.createTextNode(beforeText);
      targetNode.parentNode.insertBefore(beforeNode, targetNode);
    }

    // Insert the new element
    targetNode.parentNode.insertBefore(newElement, targetNode);

    if (afterText) {
      const afterNode = document.createTextNode(afterText);
      targetNode.parentNode.insertBefore(afterNode, targetNode);
    }

    // Remove the original node
    targetNode.remove();
    
    console.log('[ButtonPanel] Successfully replaced text at position', startIndex, '-', endIndex);
  },

  /**
   * Clean up analysis data when content is removed
   * @param {Object} content - The content object being removed
   */
  cleanupAnalysisData(content) {
    if (!content || !content.analysis) {
      console.log('[ButtonPanel] No analysis data to clean up for content:', content?.tabId);
      return;
    }

    console.log('[ButtonPanel] Cleaning up analysis data for content:', content.tabId);

    // Clean up word meanings
    if (content.analysis.wordMeanings && content.analysis.wordMeanings.length > 0) {
      console.log('[ButtonPanel] Cleaning up', content.analysis.wordMeanings.length, 'word meanings');
      content.analysis.wordMeanings.forEach(wordData => {
        // Remove from WordSelector if it exists
        if (WordSelector.explainedWords.has(wordData.normalizedWord)) {
          WordSelector.explainedWords.delete(wordData.normalizedWord);
          console.log('[ButtonPanel] Cleaned up word explanation for:', wordData.word);
        }
      });
    }

    // Clean up simplified texts
    if (content.analysis.simplifiedMeanings && content.analysis.simplifiedMeanings.length > 0) {
      console.log('[ButtonPanel] Cleaning up', content.analysis.simplifiedMeanings.length, 'simplified texts');
      content.analysis.simplifiedMeanings.forEach(simplifiedData => {
        // Remove from TextSelector if it exists
        if (TextSelector.simplifiedTexts.has(simplifiedData.textKey)) {
          TextSelector.simplifiedTexts.delete(simplifiedData.textKey);
          console.log('[ButtonPanel] Cleaned up simplified text for textKey:', simplifiedData.textKey);
        }
        
        // Remove visual elements from DOM
        this.removeSimplifiedTextHighlights(simplifiedData.textKey);
      });
    }

    // Clean up chats
    if (content.analysis.chats && content.analysis.chats.length > 0) {
      console.log('[ButtonPanel] Cleaning up', content.analysis.chats.length, 'chats');
      content.analysis.chats.forEach(chatData => {
        // Remove from ChatDialog if it exists
        if (ChatDialog.chatHistories.has(chatData.textKey)) {
          ChatDialog.chatHistories.delete(chatData.textKey);
          console.log('[ButtonPanel] Cleaned up chat history for textKey:', chatData.textKey);
        }
      });
    }

    console.log('[ButtonPanel] Analysis data cleanup complete');
  },

  /**
   * Remove simplified text highlights from DOM
   * @param {string} textKey - The text key to remove highlights for
   */
  removeSimplifiedTextHighlights(textKey) {
    console.log('[ButtonPanel] Removing simplified text highlights for textKey:', textKey);
    
    // Find all simplified text highlights with this textKey
    const contentElement = this.topicsModal.customContentModal.modal.querySelector('.vocab-custom-content-editor-content');
    if (!contentElement) {
      console.log('[ButtonPanel] Content element not found');
      return;
    }
    
    // Find all simplified text highlights
    const simplifiedHighlights = contentElement.querySelectorAll('.vocab-text-highlight');
    simplifiedHighlights.forEach(highlight => {
      const highlightTextKey = highlight.getAttribute('data-text-key');
      if (highlightTextKey === textKey) {
        console.log('[ButtonPanel] Removing simplified text highlight for textKey:', textKey);
        
        // Remove the book icon button if it exists
        const bookButton = highlight.querySelector('.vocab-simplified-text-btn');
        if (bookButton) {
          bookButton.remove();
        }
        
        // Replace the highlight span with plain text
        const parent = highlight.parentNode;
        if (parent) {
          parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
          parent.normalize();
        }
      }
    });
    
    // Also remove explanations from the explainedText container if chat dialog is open
    this.removeSimplifiedTextExplanations(textKey);
    
    console.log('[ButtonPanel] Simplified text highlights removal complete');
  },

  /**
   * Remove simplified text explanations from explainedText container
   * @param {string} textKey - The text key to remove explanations for
   */
  removeSimplifiedTextExplanations(textKey) {
    console.log('[ButtonPanel] Removing simplified text explanations for textKey:', textKey);
    
    // Find the simplified explanations container in chat dialog
    const explanationsContainer = document.getElementById('vocab-chat-simplified-container');
    if (!explanationsContainer) {
      console.log('[ButtonPanel] Explanations container not found (chat dialog may not be open)');
      return;
    }
    
    // Find all explanation elements with this textKey
    const explanationElements = explanationsContainer.querySelectorAll(`[data-text-key="${textKey}"]`);
    explanationElements.forEach(element => {
      console.log('[ButtonPanel] Removing explanation element for textKey:', textKey);
      element.remove();
    });
    
    // If no explanations left, hide the container
    const remainingExplanations = explanationsContainer.querySelectorAll('[data-text-key]');
    if (remainingExplanations.length === 0) {
      explanationsContainer.style.display = 'none';
      console.log('[ButtonPanel] No explanations left, hiding container');
    }
    
    console.log('[ButtonPanel] Simplified text explanations removal complete');
  },

  /**
   * Close a tab
   * @param {string} tabId - The tab ID to close
   */
  closeTab(tabId) {
    console.log('[ButtonPanel] Closing tab:', tabId);
    
    // Get the content type of the tab being closed BEFORE removing it
    const contentToClose = this.topicsModal.customContentModal.getContentByTabId(parseInt(tabId));
    if (!contentToClose) {
      console.log('[ButtonPanel] Content not found for tabId:', tabId);
      return;
    }
    
    const contentTypeToClose = contentToClose.contentType;
    console.log('[ButtonPanel] Closing tab of content type:', contentTypeToClose);
    
    // Remove content from new data structure using tabId
    const removedContent = this.topicsModal.customContentModal.removeContentByTabId(parseInt(tabId));
    console.log('[ButtonPanel] Content removed:', removedContent);
    
    if (!removedContent) return;
    
    // Clean up analysis data for this tab
    this.cleanupAnalysisData(removedContent);
    
    // Remove tab element from DOM
    const tabElement = this.topicsModal.customContentModal.modal.querySelector(`[data-tab-id="${tabId}"]`);
    if (tabElement) {
      tabElement.remove();
      console.log('[ButtonPanel] Tab element removed from DOM');
    }
    
    // Check if there are any tabs left at all (across all content types)
    const allTabs = this.topicsModal.customContentModal.getAllTabs();
    
    // Also check DOM to ensure sync
    const visibleTabs = this.topicsModal.customContentModal.modal.querySelectorAll('.vocab-custom-content-tab');
    
    console.log('[ButtonPanel] ===== TAB CLOSING DEBUG INFO =====');
    console.log('[ButtonPanel] Tab being closed ID:', tabId);
    console.log('[ButtonPanel] Content type being closed:', contentTypeToClose);
    console.log('[ButtonPanel] Active tab ID:', this.topicsModal.customContentModal.activeTabId);
    console.log('[ButtonPanel] Total remaining tabs (data):', allTabs.length);
    console.log('[ButtonPanel] Total remaining tabs (DOM):', visibleTabs.length);
    console.log('[ButtonPanel] All remaining tabs:', allTabs);
    console.log('[ButtonPanel] Topic contents:', this.topicsModal.customContentModal.topicContents);
    console.log('[ButtonPanel] Image contents:', this.topicsModal.customContentModal.imageContents);
    console.log('[ButtonPanel] PDF contents:', this.topicsModal.customContentModal.pdfContents);
    console.log('[ButtonPanel] Text contents:', this.topicsModal.customContentModal.textContents);
    
    // Check if this is the last tab (no tabs remaining in data OR DOM)
    const isLastTab = allTabs.length === 0 || visibleTabs.length === 0;
    
    if (isLastTab) {
      console.log('[ButtonPanel] ===== LAST TAB - CLOSING MODAL =====');
      console.log('[ButtonPanel] No tabs remaining, closing modal');
      console.log('[ButtonPanel] Calling clearTopicsModalInputs()');
      this.clearTopicsModalInputs();
      console.log('[ButtonPanel] Calling hideCustomContentModal()');
      this.hideCustomContentModal();
      console.log('[ButtonPanel] Modal close sequence completed');
    } else if (this.topicsModal.customContentModal.activeTabId === tabId) {
      // Only handle active tab switching if we're not closing the modal
      console.log('[ButtonPanel] Closing active tab - switching to another tab');
      console.log('[ButtonPanel] Switching to tab ID:', allTabs[0].id);
      if (allTabs.length > 0) {
        this.switchToTab(allTabs[0].id);
      }
    } else {
      console.log('[ButtonPanel] Tab being closed was not active, updating visual selection');
      // Update the visual selection indicator to match the current active tab
      this.updateTabSelectionVisual();
    }
    
    console.log('[ButtonPanel] ===== END TAB CLOSING DEBUG =====');
    
    // Update arrow states after removing tab
    setTimeout(() => {
      this.updateTabArrowStates();
    }, 100);
  },

  /**
   * Update tab selection visual indicator without switching tabs
   */
  updateTabSelectionVisual() {
    console.log('[ButtonPanel] Updating tab selection visual indicator');
    
    const modal = this.topicsModal.customContentModal.modal;
    if (!modal) {
      console.log('[ButtonPanel] Modal not found, cannot update visual selection');
      return;
    }
    
    const tabsContainer = modal.querySelector('.vocab-custom-content-tabs-container');
    if (!tabsContainer) {
      console.log('[ButtonPanel] Tabs container not found, cannot update visual selection');
      return;
    }
    
    const activeTabId = this.topicsModal.customContentModal.activeTabId;
    if (!activeTabId) {
      console.log('[ButtonPanel] No active tab ID, cannot update visual selection');
      return;
    }
    
    // Update sliding background position
    const activeTabElement = tabsContainer.querySelector(`[data-tab-id="${activeTabId}"]`);
    if (activeTabElement) {
      const tabRect = activeTabElement.getBoundingClientRect();
      const containerRect = tabsContainer.getBoundingClientRect();
      const left = tabRect.left - containerRect.left + tabsContainer.scrollLeft;
      const width = tabRect.width;
      tabsContainer.style.setProperty('--sliding-bg-left', `${left}px`);
      tabsContainer.style.setProperty('--sliding-bg-width', `${width}px`);
      console.log('[ButtonPanel] Updated sliding background position:', { left, width });
    } else {
      console.log('[ButtonPanel] Active tab element not found for ID:', activeTabId);
    }
  },

  /**
   * Initialize modal positioning for resize functionality
   * Converts modal from centered positioning to absolute positioning
   * @param {HTMLElement} modal - The modal element to initialize
   */
  initializeModalPositioning(modal) {
    // Wait for modal to be rendered and positioned
    requestAnimationFrame(() => {
      const rect = modal.getBoundingClientRect();
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      // Convert from centered positioning to absolute positioning
      modal.style.left = `${centerX - rect.width / 2}px`;
      modal.style.top = `${centerY - rect.height / 2}px`;
      modal.style.transform = 'none';
      
      console.log('[ButtonPanel] Initialized modal positioning for resize functionality');
    });
  },

  /**
   * Create resize handles for the modal
   * @returns {HTMLElement} Container with resize handles
   */
  createResizeHandles() {
    const container = document.createElement('div');
    container.className = 'vocab-custom-content-resize-handles';
    
    // Create handles for all four edges
    const edgePositions = ['top', 'bottom', 'left', 'right'];
    
    edgePositions.forEach(position => {
      const handle = document.createElement('div');
      handle.className = `vocab-custom-content-resize-handle vocab-custom-content-resize-handle-${position}`;
      handle.setAttribute('data-position', position);
      container.appendChild(handle);
    });
    
    // Create handles for all four corners
    const cornerPositions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
    
    cornerPositions.forEach(position => {
      const handle = document.createElement('div');
      handle.className = `vocab-custom-content-resize-handle vocab-custom-content-resize-handle-${position}`;
      handle.setAttribute('data-position', position);
      container.appendChild(handle);
    });
    
    return container;
  },

  /**
   * Initialize resize functionality for modal
   * @param {HTMLElement} modal - The modal element to resize
   */
  initModalResize(modal) {
    const handles = modal.querySelectorAll('.vocab-custom-content-resize-handle');
    
    handles.forEach(handle => {
      handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const position = handle.getAttribute('data-position');
        const startX = e.clientX;
        const startY = e.clientY;
        // Get current modal dimensions and position using getBoundingClientRect for accuracy
        const rect = modal.getBoundingClientRect();
        const startWidth = rect.width;
        const startHeight = rect.height;
        const startLeft = rect.left;
        const startTop = rect.top;
        
        // Modal should already be in absolute positioning mode
        const computedStyle = window.getComputedStyle(modal);
        let actualStartLeft = parseFloat(computedStyle.left) || startLeft;
        let actualStartTop = parseFloat(computedStyle.top) || startTop;
        
        const handleMouseMove = (e) => {
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        let newWidth = startWidth;
        let newHeight = startHeight;
        let newLeft = actualStartLeft;
        let newTop = actualStartTop;
        
          // Calculate new dimensions based on position with proportional scaling
          switch (position) {
            case 'right':
              newWidth = startWidth + deltaX;
              break;
            case 'left':
              newWidth = startWidth - deltaX;
              newLeft = actualStartLeft + deltaX;
              break;
            case 'bottom':
              newHeight = startHeight + deltaY;
              break;
            case 'top':
              newHeight = startHeight - deltaY;
              newTop = actualStartTop + deltaY;
              break;
            case 'top-right':
              newWidth = startWidth + deltaX;
              newHeight = startHeight - deltaY;
              newTop = actualStartTop + deltaY;
              break;
            case 'top-left':
              newWidth = startWidth - deltaX;
              newHeight = startHeight - deltaY;
              newLeft = actualStartLeft + deltaX;
              newTop = actualStartTop + deltaY;
              break;
            case 'bottom-right':
              newWidth = startWidth + deltaX;
              newHeight = startHeight + deltaY;
              break;
            case 'bottom-left':
              newWidth = startWidth - deltaX;
              newHeight = startHeight + deltaY;
              newLeft = actualStartLeft + deltaX;
              break;
          }
        
          // Apply viewport constraints with better proportions and resistance
        const minWidth = 400;
        const minHeight = 300;
          const maxWidth = Math.min(900, window.innerWidth - 40); // Respect CSS max-width and viewport
          const maxHeight = Math.min(window.innerHeight * 0.9, window.innerHeight - 40); // Respect CSS max-height
        
          // Add resistance when approaching limits for smoother feel
          const resistanceFactor = 0.3; // How much resistance to apply near limits
          
          // Apply resistance to width
          if (newWidth < minWidth + 50) {
            const resistance = (minWidth + 50 - newWidth) * resistanceFactor;
            newWidth = Math.max(minWidth, newWidth + resistance);
          } else if (newWidth > maxWidth - 50) {
            const resistance = (newWidth - (maxWidth - 50)) * resistanceFactor;
            newWidth = Math.min(maxWidth, newWidth - resistance);
          }
          
          // Apply resistance to height
          if (newHeight < minHeight + 50) {
            const resistance = (minHeight + 50 - newHeight) * resistanceFactor;
            newHeight = Math.max(minHeight, newHeight + resistance);
          } else if (newHeight > maxHeight - 50) {
            const resistance = (newHeight - (maxHeight - 50)) * resistanceFactor;
            newHeight = Math.min(maxHeight, newHeight - resistance);
          }
        
          // Final constraint check
        newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
        newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
        
          // Constrain position to keep modal within viewport
          const maxLeft = window.innerWidth - newWidth;
          const maxTop = window.innerHeight - newHeight;
          
          newLeft = Math.max(0, Math.min(maxLeft, newLeft));
          newTop = Math.max(0, Math.min(maxTop, newTop));
          
          // Apply new dimensions with smooth transitions
        modal.style.width = `${newWidth}px`;
        modal.style.height = `${newHeight}px`;
        modal.style.left = `${newLeft}px`;
        modal.style.top = `${newTop}px`;
      };
      
      const handleMouseUp = () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = handle.style.cursor;
        document.body.style.userSelect = 'none';
      });
    });
  },

  /**
   * Clear topics modal inputs
   */
  clearTopicsModalInputs() {
    console.log('[ButtonPanel] Clearing topics modal inputs');
    
    // Check if topics modal exists before trying to clear it
    if (!this.topicsModal.modal) {
      console.log('[ButtonPanel] Topics modal does not exist, skipping clearTopicsModalInputs');
      return;
    }
    
    // Clear topics array
    this.topicsModal.topics = [];
    this.topicsModal.wordCount = 100;
    this.topicsModal.difficulty = 'hard';
    
    // Clear UI elements
    const topicsContainer = this.topicsModal.modal?.querySelector('.vocab-topics-tags');
    const inputField = this.topicsModal.modal?.querySelector('.vocab-topics-input');
    const wordCountButtons = this.topicsModal.modal?.querySelectorAll('.vocab-topics-word-count-btn');
    const difficultyButtons = this.topicsModal.modal?.querySelectorAll('.vocab-topics-difficulty-btn');
    
    if (topicsContainer) {
      topicsContainer.innerHTML = '';
    }
    
    if (inputField) {
      inputField.value = '';
    }
    
    // Reset word count buttons
    if (wordCountButtons) {
      wordCountButtons.forEach(btn => {
        btn.classList.remove('selected');
        if (btn.getAttribute('data-count') === '100') {
          btn.classList.add('selected');
        }
      });
    }
    
    // Reset difficulty buttons
    if (difficultyButtons) {
      difficultyButtons.forEach(btn => {
        btn.classList.remove('selected');
        if (btn.getAttribute('data-difficulty') === 'hard') {
          btn.classList.add('selected');
        }
      });
    }
    
    this.updateTopicsUIState();
  },

  /**
   * Scroll tabs left or right
   * @param {string} direction - 'left' or 'right'
   */
  scrollTabs(direction) {
    const tabsContainer = this.topicsModal.customContentModal.tabsContainer;
    if (!tabsContainer) {
      console.warn('[ButtonPanel] tabsContainer not found, skipping scroll');
      return;
    }
    
    const scrollAmount = 200; // pixels to scroll
    
    if (direction === 'left') {
      tabsContainer.scrollLeft -= scrollAmount;
    } else {
      tabsContainer.scrollLeft += scrollAmount;
    }
    
    // Update arrow states after scrolling
    setTimeout(() => {
      this.updateTabArrowStates();
    }, 100);
  },

  /**
   * Update tab arrow states based on scroll position
   */
  updateTabArrowStates() {
    console.log('[ButtonPanel] updateTabArrowStates called');
    const tabsContainer = this.topicsModal.customContentModal.tabsContainer;
    const leftArrow = this.topicsModal.customContentModal.leftArrow;
    const rightArrow = this.topicsModal.customContentModal.rightArrow;
    
    console.log('[ButtonPanel] tabsContainer in updateTabArrowStates:', tabsContainer);
    console.log('[ButtonPanel] leftArrow:', leftArrow);
    console.log('[ButtonPanel] rightArrow:', rightArrow);
    
    if (!tabsContainer || !leftArrow || !rightArrow) {
      console.log('[ButtonPanel] Missing elements in updateTabArrowStates, returning early');
      return;
    }
    
    const isAtStart = tabsContainer.scrollLeft <= 0;
    const isAtEnd = tabsContainer.scrollLeft >= (tabsContainer.scrollWidth - tabsContainer.clientWidth);
    
    leftArrow.disabled = isAtStart;
    rightArrow.disabled = isAtEnd;
  },

  /**
   * Initialize drag functionality for modal
   * @param {HTMLElement} dragHandle - The drag handle element
   * @param {HTMLElement} modal - The modal element to drag
   */
  initModalDrag(dragHandle, modal) {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialLeft = 0;
    let initialTop = 0;

    const handleMouseDown = (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      
      // Get current position
      const rect = modal.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;
      
      // Change cursor
      dragHandle.style.cursor = 'grabbing';
      modal.style.cursor = 'grabbing';
      
      e.preventDefault();
    };

    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      const newLeft = initialLeft + deltaX;
      const newTop = initialTop + deltaY;
      
      // Apply constraints to keep modal within viewport
      const maxLeft = window.innerWidth - modal.offsetWidth;
      const maxTop = window.innerHeight - modal.offsetHeight;
      
      const constrainedLeft = Math.max(0, Math.min(maxLeft, newLeft));
      const constrainedTop = Math.max(0, Math.min(maxTop, newTop));
      
      modal.style.left = `${constrainedLeft}px`;
      modal.style.top = `${constrainedTop}px`;
      modal.style.right = 'auto';
      modal.style.transform = 'none';
    };

    const handleMouseUp = () => {
      if (isDragging) {
        isDragging = false;
        dragHandle.style.cursor = 'grab';
        modal.style.cursor = 'default';
      }
    };

    // Add event listeners
    dragHandle.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Touch events for mobile
    dragHandle.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      handleMouseDown({
        clientX: touch.clientX,
        clientY: touch.clientY,
        preventDefault: () => e.preventDefault()
      });
    });
    
    document.addEventListener('touchmove', (e) => {
      const touch = e.touches[0];
      handleMouseMove({
        clientX: touch.clientX,
        clientY: touch.clientY
      });
    });
    
    document.addEventListener('touchend', handleMouseUp);
  },

  /**
   * Update custom content heading based on content type
   * @param {string} contentType - The content type ('pdf', 'image', 'topic')
   */
  updateCustomContentHeading(contentType) {
    const title = this.topicsModal.customContentModal.modal?.querySelector('.vocab-custom-content-title');
    if (title) {
      const headingMap = {
        'pdf': 'PDF Content',
        'image': 'Image content', 
        'topic': 'Topic content',
        'text': 'Content',
        'default': 'Generated Content'
      };
      
      title.textContent = headingMap[contentType] || headingMap['default'];
    }
  },

  /**
   * Update custom content editor with content
   * @param {string} content - The content to display
   */
  updateCustomContentEditor(content) {
    console.log('[ButtonPanel] ===== UPDATING CUSTOM CONTENT EDITOR =====');
    
    const editorContent = this.topicsModal.customContentModal.editorContent;
    
    if (!editorContent) {
      console.error('[ButtonPanel] ===== EDITOR CONTENT ELEMENT NOT FOUND =====');
      return;
    }
    
    console.log('[ButtonPanel] Editor content element found:', !!editorContent);
    console.log('[ButtonPanel] Content to load:', content.substring(0, 100) + '...');
    
    // Enhanced markdown detection - check for various markdown patterns
    const hasMarkdownFormatting = /^#+\s|\*\*[^*]+\*\*|\*[^*]+\*|^```|^`|^\- |^\d+\. |^\+ |^● /m.test(content);
    
    console.log('[ButtonPanel] Markdown detection result:', hasMarkdownFormatting);
    console.log('[ButtonPanel] Content sample for detection:', content.substring(0, 200));
    
    let htmlContent;
    
    if (hasMarkdownFormatting) {
      console.log('[ButtonPanel] Content appears to have markdown formatting, converting to HTML');
      
      // Use a more robust markdown renderer
      htmlContent = this.renderMarkdownToHtml(content);
    } else {
      console.log('[ButtonPanel] Content appears to be plain text, displaying as-is');
      // For plain text, just escape HTML and preserve line breaks
      htmlContent = content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/\n/g, '<br>');
      
      // Wrap in a single paragraph to maintain proper spacing
      htmlContent = '<p>' + htmlContent + '</p>';
    }
    
    console.log('[ButtonPanel] HTML content generated, length:', htmlContent.length);
    console.log('[ButtonPanel] HTML preview:', htmlContent.substring(0, 200) + '...');
    
    editorContent.innerHTML = htmlContent;
    
    console.log('[ButtonPanel] ===== EDITOR CONTENT UPDATED SUCCESSFULLY =====');
  },

  /**
   * Enhanced markdown to HTML renderer
   * @param {string} markdown - Markdown text to convert
   * @returns {string} HTML string
   */
  renderMarkdownToHtml(markdown) {
    if (!markdown) return '';
    
    console.log('[ButtonPanel] renderMarkdownToHtml called with:', markdown.substring(0, 200) + '...');
    
    let html = markdown;
    
    // Escape HTML first to prevent XSS
    html = html.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;');
    
    // Code blocks (```)
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');
    
    // Inline code (`)
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Bold (**text** or __text__) - handle both patterns
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    
    console.log('[ButtonPanel] After bold processing:', html.substring(0, 300) + '...');
    
    // Debug bullet processing
    const bulletMatches = html.match(/^[\s]*[\*\-+●] (.+)$/gm);
    if (bulletMatches) {
      console.log('[ButtonPanel] Found bullet points:', bulletMatches);
    }
    
    // Italic (*text* or _text_) - but not if it's part of bold
    html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
    html = html.replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>');
    
    // Links [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Headings (process from largest to smallest to avoid conflicts)
    html = html.replace(/^###### (.+)$/gm, '<h6>$1</h6>');
    html = html.replace(/^##### (.+)$/gm, '<h5>$1</h5>');
    html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    
    // Lists - handle unordered lists (*, -, +, ●)
    html = html.replace(/^[\s]*[\*\-+●] (.+)$/gm, (match, content) => {
      // Clean up extra spaces in bullet content
      const cleanedContent = content.trim().replace(/\s+/g, ' ');
      return `<li>${cleanedContent}</li>`;
    });
    
    // Ordered lists (1., 2., etc.)
    html = html.replace(/^[\s]*\d+\. (.+)$/gm, (match, content) => {
      // Clean up extra spaces in ordered list content
      const cleanedContent = content.trim().replace(/\s+/g, ' ');
      return `<li>${cleanedContent}</li>`;
    });
    
    console.log('[ButtonPanel] After bullet processing:', html.substring(0, 400) + '...');
    
    // Debug ordered list detection
    const orderedMatches = markdown.match(/^\s*\d+\./gm);
    if (orderedMatches) {
      console.log('[ButtonPanel] Found ordered list items:', orderedMatches);
    }
    
    // Wrap consecutive <li> elements in <ul> or <ol>
    // First, identify ordered vs unordered lists by checking original markdown
    const originalLines = markdown.split('\n');
    const lines = html.split('\n');
    let processedLines = [];
    let inList = false;
    let listType = 'ul';
    let listItems = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isListItem = line.includes('<li>');
      
      // Check if this line was originally an ordered list item
      const originalLine = originalLines[i] || '';
      const isOrderedListItem = isListItem && /^\s*\d+\./.test(originalLine);
      
      if (isListItem) {
        if (!inList) {
          inList = true;
          listType = isOrderedListItem ? 'ol' : 'ul';
          console.log('[ButtonPanel] Starting list type:', listType, 'for line:', originalLine);
          listItems = [];
        }
        listItems.push(line);
      } else {
        if (inList) {
          // Close the current list
          processedLines.push(`<${listType}>`);
          processedLines.push(...listItems);
          processedLines.push(`</${listType}>`);
          inList = false;
          listItems = [];
        }
        processedLines.push(line);
      }
    }
    
    // Handle case where list is at the end
    if (inList) {
      processedLines.push(`<${listType}>`);
      processedLines.push(...listItems);
      processedLines.push(`</${listType}>`);
    }
    
    html = processedLines.join('\n');
    
    // Convert line breaks
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    
    // Wrap in paragraphs
    html = '<p>' + html + '</p>';
    
    // Clean up empty paragraphs and fix paragraph structure
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p><br><\/p>/g, '');
    html = html.replace(/<p>\s*<\/p>/g, '');
    
    // Fix paragraphs that contain only whitespace
    html = html.replace(/<p>\s*<br>\s*<\/p>/g, '');
    
    return html;
  },

  /**
   * Update custom content modal title based on content type
   * @param {string} contentType - The type of content (pdf, image, etc.)
   */
  updateCustomContentModalTitle(contentType) {
    console.log('[ButtonPanel] ===== UPDATING CUSTOM CONTENT MODAL TITLE =====');
    console.log('[ButtonPanel] Content type:', contentType);
    
    const titleElement = this.topicsModal.customContentModal.modal.querySelector('.vocab-custom-content-title');
    
    if (!titleElement) {
      console.error('[ButtonPanel] Title element not found');
      return;
    }
    
    // Set heading based on content type
    const headingMap = {
      'pdf': 'PDF Content',
      'image': 'Image content', 
      'topic': 'Topic content',
      'text': 'Content',
      'default': 'Generated Content'
    };
    
    titleElement.textContent = headingMap[contentType] || headingMap['default'];
    console.log('[ButtonPanel] Title updated to:', titleElement.textContent);
    
    console.log('[ButtonPanel] ===== MODAL TITLE UPDATED SUCCESSFULLY =====');
  },

  /**
   * Perform search in the content
   */
  performSearch() {
    console.log('[ButtonPanel] performSearch called');
    
    // Get search term from current active tab
    let searchTerm = '';
    if (this.topicsModal.customContentModal.activeTabId) {
      const tabId = parseInt(this.topicsModal.customContentModal.activeTabId);
      const activeContent = this.topicsModal.customContentModal.getContentByTabId(tabId);
      if (activeContent) {
        searchTerm = activeContent.searchTerm || '';
      }
    }
    
    const editorContent = this.topicsModal.customContentModal.editorContent;
    
    console.log('[ButtonPanel] Search term:', JSON.stringify(searchTerm));
    console.log('[ButtonPanel] Editor content element:', editorContent);
    console.log('[ButtonPanel] Active tab ID:', this.topicsModal.customContentModal.activeTabId);
    
    if (!editorContent) {
      console.error('[ButtonPanel] Editor content element not found!');
      return;
    }
    
    if (!searchTerm || !searchTerm.trim()) {
      console.log('[ButtonPanel] No search term, removing highlights');
      // Remove all highlights
      const highlights = editorContent.querySelectorAll('.vocab-search-highlight');
      highlights.forEach(highlight => {
        const parent = highlight.parentNode;
        parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
        parent.normalize();
      });
      return;
    }
    
    // Get the original content without highlights
    let content = editorContent.innerHTML;
    console.log('[ButtonPanel] Original content length:', content.length);
    console.log('[ButtonPanel] Content preview:', content.substring(0, 200));
    
    // Remove existing highlights
    content = content.replace(/<span class="vocab-search-highlight">(.*?)<\/span>/gim, '$1');
    
    // Add new highlights
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gim');
    const matches = content.match(regex);
    console.log('[ButtonPanel] Found matches:', matches ? matches.length : 0);
    
    content = content.replace(regex, '<span class="vocab-search-highlight">$1</span>');
    
    console.log('[ButtonPanel] Updated content with highlights');
    editorContent.innerHTML = content;
    
    // Auto-scroll to first match if it's outside visible area
    this.scrollToFirstMatch(editorContent, searchTerm);
  },

  /**
   * Scroll to the first search match if it's outside the visible area
   * @param {HTMLElement} editorContent - The editor content element
   * @param {string} searchTerm - The search term
   */
  scrollToFirstMatch(editorContent, searchTerm) {
    const firstHighlight = editorContent.querySelector('.vocab-search-highlight');
    if (!firstHighlight) {
      console.log('[ButtonPanel] No search highlights found');
      return;
    }
    
    // Get the editor container (the scrollable element)
    const editorContainer = editorContent.closest('.vocab-custom-content-editor');
    if (!editorContainer) {
      console.log('[ButtonPanel] Editor container not found');
      return;
    }
    
    // Get the bounding rectangles
    const highlightRect = firstHighlight.getBoundingClientRect();
    const containerRect = editorContainer.getBoundingClientRect();
    
    // Check if the highlight is outside the visible area
    const isAboveVisible = highlightRect.top < containerRect.top;
    const isBelowVisible = highlightRect.bottom > containerRect.bottom;
    
    if (isAboveVisible || isBelowVisible) {
      console.log('[ButtonPanel] First match is outside visible area, scrolling to it');
      
      // Calculate the scroll position to center the highlight
      const containerScrollTop = editorContainer.scrollTop;
      const highlightOffsetTop = firstHighlight.offsetTop;
      const containerHeight = editorContainer.clientHeight;
      const highlightHeight = firstHighlight.offsetHeight;
      
      // Center the highlight in the visible area
      const targetScrollTop = highlightOffsetTop - (containerHeight / 2) + (highlightHeight / 2);
      
      // Smooth scroll to the target position
      editorContainer.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth'
      });
    } else {
      console.log('[ButtonPanel] First match is already visible');
    }
  },

  /**
   * Initialize slider positions
   */
  initializeSliders() {
    // Initialize word count slider
    const wordCountSelected = this.topicsModal.modal.querySelector('.vocab-topics-word-count-btn.selected');
    if (wordCountSelected) {
      this.animateSlider('word-count-slider', wordCountSelected);
    }
    
    // Initialize difficulty slider
    const difficultySelected = this.topicsModal.modal.querySelector('.vocab-topics-difficulty-btn.selected');
    if (difficultySelected) {
      this.animateSlider('difficulty-slider', difficultySelected);
      this.updateDifficultySliderColor(difficultySelected);
    }
  },

  /**
   * Animate slider to selected tab
   * @param {string} sliderId - ID of the slider element
   * @param {HTMLElement} selectedButton - The selected button element
   */
  animateSlider(sliderId, selectedButton) {
    const slider = document.getElementById(sliderId);
    if (!slider || !selectedButton) return;
    
    // Use requestAnimationFrame to ensure smooth animation
    requestAnimationFrame(() => {
      const buttonRect = selectedButton.getBoundingClientRect();
      const containerRect = selectedButton.parentElement.getBoundingClientRect();
      
      const left = buttonRect.left - containerRect.left;
      const width = buttonRect.width;
      
      slider.style.left = `${left}px`;
      slider.style.width = `${width}px`;
    });
  },

  /**
   * Update difficulty slider color based on selected difficulty
   * @param {HTMLElement} selectedButton - The selected difficulty button
   */
  updateDifficultySliderColor(selectedButton) {
    const slider = document.getElementById('difficulty-slider');
    if (!slider) return;
    
    const difficulty = selectedButton.getAttribute('data-difficulty');
    switch (difficulty) {
      case 'easy':
        slider.style.background = '#36D86B';
        break;
      case 'medium':
        slider.style.background = '#F9D43F';
        break;
      case 'hard':
        slider.style.background = '#FF4D4D';
        break;
    }
  },

  /**
   * Create plus icon SVG
   * @returns {string} SVG markup
   */
  createPlusIcon() {
    return `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 3V13M3 8H13" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  },

  /**
   * Initialize modal dragging functionality
   * @param {HTMLElement} modal - The modal element to make draggable
   */
  initModalDragging(modal) {
    let isDragging = false;
    let startX, startY, initialX, initialY;
    
    // Function to check if the clicked element should allow dragging
    const isDraggableElement = (element) => {
      // Don't drag if clicking on interactive elements
      const nonDraggableSelectors = [
        'input',
        'button',
        'textarea',
        '.vocab-custom-content-tab-arrow',
        '.vocab-custom-content-add-tab',
        '.vocab-custom-content-minimize',
        '.vocab-custom-content-chat-icon',
        '.vocab-custom-content-resize-handle',
        '.vocab-custom-content-editor-content',
        '.vocab-custom-content-tab'
      ];
      
      // Check if the element or any of its parents match non-draggable selectors
      let currentElement = element;
      while (currentElement && currentElement !== modal) {
        for (const selector of nonDraggableSelectors) {
          if (currentElement.matches && currentElement.matches(selector)) {
            return false;
          }
        }
        currentElement = currentElement.parentElement;
      }
      
      return true;
    };
    
    // Mouse down event
    modal.addEventListener('mousedown', (e) => {
      if (!isDraggableElement(e.target)) {
        return;
      }
      
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      
      // Get current modal position - always use getBoundingClientRect for accuracy
      const rect = modal.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;
      
      // If this is the first drag, ensure we have proper positioning
      const computedStyle = window.getComputedStyle(modal);
      const isCentered = computedStyle.left === '50%' || 
                        computedStyle.left === 'auto' || 
                        computedStyle.transform.includes('translate(-50%');
      
      if (isCentered) {
        // Modal is centered, set absolute positioning immediately
        modal.style.left = initialX + 'px';
        modal.style.top = initialY + 'px';
        modal.style.transform = 'none';
      }
      
      // Add dragging class for visual feedback
      modal.classList.add('dragging');
      
      // Prevent text selection during drag
      e.preventDefault();
    });
    
    // Mouse move event
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      const newX = initialX + deltaX;
      const newY = initialY + deltaY;
      
      // Constrain to viewport bounds
      const maxX = window.innerWidth - modal.offsetWidth;
      const maxY = window.innerHeight - modal.offsetHeight;
      
      const constrainedX = Math.max(0, Math.min(newX, maxX));
      const constrainedY = Math.max(0, Math.min(newY, maxY));
      
      // Remove transform and set absolute positioning
      modal.style.transform = 'none';
      modal.style.left = constrainedX + 'px';
      modal.style.top = constrainedY + 'px';
    });
    
    // Mouse up event
    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        modal.classList.remove('dragging');
      }
    });
    
    // Touch events for mobile support
    modal.addEventListener('touchstart', (e) => {
      if (!isDraggableElement(e.target)) {
        return;
      }
      
      isDragging = true;
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      
      // Get current modal position - always use getBoundingClientRect for accuracy
      const rect = modal.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;
      
      // If this is the first drag, ensure we have proper positioning
      const computedStyle = window.getComputedStyle(modal);
      const isCentered = computedStyle.left === '50%' || 
                        computedStyle.left === 'auto' || 
                        computedStyle.transform.includes('translate(-50%');
      
      if (isCentered) {
        // Modal is centered, set absolute positioning immediately
        modal.style.left = initialX + 'px';
        modal.style.top = initialY + 'px';
        modal.style.transform = 'none';
      }
      
      modal.classList.add('dragging');
      e.preventDefault();
    });
    
    document.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      
      const touch = e.touches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      
      const newX = initialX + deltaX;
      const newY = initialY + deltaY;
      
      const maxX = window.innerWidth - modal.offsetWidth;
      const maxY = window.innerHeight - modal.offsetHeight;
      
      const constrainedX = Math.max(0, Math.min(newX, maxX));
      const constrainedY = Math.max(0, Math.min(newY, maxY));
      
      // Remove transform and set absolute positioning
      modal.style.transform = 'none';
      modal.style.left = constrainedX + 'px';
      modal.style.top = constrainedY + 'px';
      
      e.preventDefault();
    });
    
    document.addEventListener('touchend', () => {
      if (isDragging) {
        isDragging = false;
        modal.classList.remove('dragging');
      }
    });
  },

};

