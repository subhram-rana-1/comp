export default defineContentScript({
  matches: ['<all_urls>'],
  
  main() {
    // Initialize the button panel when content script loads
    ButtonPanel.init();
  },
});

// ===================================
// Button Panel Module - Manages the floating button UI
// ===================================
const ButtonPanel = {
  panelContainer: null,

  /**
   * Initialize the button panel
   */
  init() {
    this.createPanel();
    this.attachEventListeners();
    console.log('Button panel initialized');
  },

  /**
   * Create the button panel DOM structure
   */
  createPanel() {
    // Create main container
    this.panelContainer = document.createElement('div');
    this.panelContainer.id = 'vocab-helper-button-panel';
    this.panelContainer.className = 'vocab-helper-panel';

    // Create main button group container with shadow
    const mainButtonGroup = document.createElement('div');
    mainButtonGroup.className = 'vocab-button-group-main';

    // Create upper button group (Remove all meanings, Deselect all)
    const upperButtonGroup = document.createElement('div');
    upperButtonGroup.className = 'vocab-button-group-upper';

    const upperButtons = [
      {
        id: 'remove-all-meanings',
        className: 'vocab-btn vocab-btn-outline-green',
        icon: this.createTrashIcon('green'),
        text: 'Remove meanings',
        type: 'outline-green'
      },
      {
        id: 'deselect-all',
        className: 'vocab-btn vocab-btn-outline-purple',
        icon: this.createTrashIcon('purple'),
        text: 'Deselect all',
        type: 'outline-purple'
      }
    ];

    upperButtons.forEach(btnConfig => {
      const button = this.createButton(btnConfig);
      upperButtonGroup.appendChild(button);
    });

    // Create lower button group (Magic meaning, Ask)
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
        text: 'Ask',
        type: 'solid-purple'
      }
    ];

    lowerButtons.forEach(btnConfig => {
      const button = this.createButton(btnConfig);
      lowerButtonGroup.appendChild(button);
    });

    // Append upper and lower groups to main group
    mainButtonGroup.appendChild(upperButtonGroup);
    mainButtonGroup.appendChild(lowerButtonGroup);

    // Append main group to panel
    this.panelContainer.appendChild(mainButtonGroup);

    // Inject styles
    this.injectStyles();

    // Append to body
    document.body.appendChild(this.panelContainer);
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

    return button;
  },

  /**
   * Create trash icon SVG
   * @param {string} color - Icon color (green or purple)
   * @returns {string} SVG markup
   */
  createTrashIcon(color) {
    const strokeColor = color === 'green' ? '#22c55e' : '#9527F5';
    return `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 0 1 1.334-1.334h2.666a1.333 1.333 0 0 1 1.334 1.334V4m2 0v9.333a1.333 1.333 0 0 1-1.334 1.334H4.667a1.333 1.333 0 0 1-1.334-1.334V4h9.334Z" stroke="${strokeColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M6.667 7.333v4M9.333 7.333v4" stroke="${strokeColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="12" cy="4" r="2" fill="white"/>
        <path d="M10.5 3l1 1m0 0l1 1m-1-1l1-1m-1 1l-1 1" stroke="${strokeColor}" stroke-width="1.2" stroke-linecap="round"/>
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
   * Create chat bubble icon SVG (solid white)
   * @returns {string} SVG markup
   */
  createChatIcon() {
    return `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 1C4.134 1 1 3.91 1 7.5C1 9.09 1.59 10.56 2.586 11.707L1.293 14.293C1.195 14.488 1.195 14.722 1.293 14.918C1.39 15.113 1.597 15.234 1.817 15.234C1.89 15.234 1.963 15.219 2.033 15.188L5.457 13.711C6.245 13.9 7.107 14 8 14C11.866 14 15 11.09 15 7.5C15 3.91 11.866 1 8 1Z" fill="white"/>
        <circle cx="5" cy="7.5" r="1" fill="#9527F5"/>
        <circle cx="8" cy="7.5" r="1" fill="#9527F5"/>
        <circle cx="11" cy="7.5" r="1" fill="#9527F5"/>
      </svg>
    `;
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
        right: 0;
        top: 50%;
        transform: translateY(-50%);
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      }

      /* Main Button Group with Purple Shadow */
      .vocab-button-group-main {
        display: flex;
        flex-direction: column;
        gap: 8px;
        background: white;
        padding: 10px;
        border-radius: 16px 0 0 16px;
        box-shadow: 0 4px 20px rgba(149, 39, 245, 0.3), 0 2px 8px rgba(149, 39, 245, 0.2);
        border: 1px solid rgba(149, 39, 245, 0.1);
        border-right: none;
      }

      /* Upper Button Group (no additional styling) */
      .vocab-button-group-upper {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      /* Lower Button Group (no additional styling) */
      .vocab-button-group-lower {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      /* Base Button Styles */
      .vocab-btn {
        display: grid;
        grid-template-columns: 20px 1fr;
        align-items: center;
        gap: 6px;
        padding: 8px 10px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 500;
        border: 2px solid;
        cursor: pointer;
        transition: all 0.2s ease;
        outline: none;
        width: 110px;
      }

      .vocab-btn:active {
        transform: scale(0.98);
      }

      /* Button Icon */
      .vocab-btn-icon {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        width: 20px;
        height: 20px;
      }

      .vocab-btn-text {
        text-align: left;
        line-height: 1.3;
        word-wrap: break-word;
      }

      /* Green Outline Button */
      .vocab-btn-outline-green {
        background: white;
        border-color: #22c55e;
        color: #22c55e;
      }

      .vocab-btn-outline-green:hover {
        background: #f0fdf4;
        border-color: #16a34a;
        color: #16a34a;
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
      }

      /* Solid Purple Button */
      .vocab-btn-solid-purple {
        background: #9527F5;
        border-color: #9527F5;
        color: white;
      }

      .vocab-btn-solid-purple:hover {
        background: #7a1fd9;
        border-color: #7a1fd9;
      }

      /* Responsive adjustments */
      @media (max-width: 768px) {
        .vocab-helper-panel {
          right: 0;
        }

        .vocab-button-group-main {
          padding: 8px;
        }

        .vocab-btn {
          width: 100px;
          padding: 7px 8px;
          font-size: 11px;
          grid-template-columns: 16px 1fr;
          gap: 5px;
        }

        .vocab-btn-icon {
          width: 16px;
          height: 16px;
        }
      }
    `;

    document.head.appendChild(style);
  },

  /**
   * Attach event listeners to buttons
   */
  attachEventListeners() {
    const buttons = {
      removeAllMeanings: document.getElementById('remove-all-meanings'),
      deselectAll: document.getElementById('deselect-all'),
      magicMeaning: document.getElementById('magic-meaning'),
      ask: document.getElementById('ask')
    };

    // Remove all meanings button
    buttons.removeAllMeanings?.addEventListener('click', () => {
      console.log('Remove all meanings clicked');
      this.handleRemoveAllMeanings();
    });

    // Deselect all button
    buttons.deselectAll?.addEventListener('click', () => {
      console.log('Deselect all clicked');
      this.handleDeselectAll();
    });

    // Magic meaning button
    buttons.magicMeaning?.addEventListener('click', () => {
      console.log('Magic meaning clicked');
      this.handleMagicMeaning();
    });

    // Ask button
    buttons.ask?.addEventListener('click', () => {
      console.log('Ask clicked');
      this.handleAsk();
    });
  },

  /**
   * Handler for Remove all meanings button
   */
  handleRemoveAllMeanings() {
    // TODO: Implement remove all meanings functionality
    console.log('Remove all meanings - to be implemented');
  },

  /**
   * Handler for Deselect all button
   */
  handleDeselectAll() {
    // TODO: Implement deselect all functionality
    console.log('Deselect all - to be implemented');
  },

  /**
   * Handler for Magic meaning button
   */
  handleMagicMeaning() {
    // TODO: Implement magic meaning functionality
    console.log('Magic meaning - to be implemented');
  },

  /**
   * Handler for Ask button
   */
  handleAsk() {
    // TODO: Implement ask functionality
    console.log('Ask - to be implemented');
  },

  /**
   * Show the button panel
   */
  show() {
    if (this.panelContainer) {
      this.panelContainer.style.display = 'block';
    }
  },

  /**
   * Hide the button panel
   */
  hide() {
    if (this.panelContainer) {
      this.panelContainer.style.display = 'none';
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
  }
};

