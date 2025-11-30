# CompreAI - Vocabulary & Comprehension Extension

A Chrome extension for enhancing vocabulary, comprehension, and multilingual learning with AI-powered word meanings, text explanations, and conversational AI support. Built with WXT.

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development

Run the development server:

```bash
npm run dev
```

This will start WXT in development mode. Follow the instructions in the terminal to load the extension in Chrome:

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `.output/chrome-mv3` directory from this project

### Build for Production

```bash
npm run build
```

The production build will be created in the `.output` directory.

### Create ZIP for Distribution

```bash
npm run zip
```

This will create a ZIP file ready for Chrome Web Store submission.

## Features

- 🎨 Modern UI with purple accent colors and soft glowing shadow
- 😺 Cat mascot with glasses
- 🔄 iOS-style toggle switch (ON/OFF)
- 📝 Word Meaning: Get instant AI-powered word definitions and explanations
- 📖 Text Explanation: Receive comprehensive explanations of selected text passages
- 📄 **Page Summarisation:** One-click AI-powered summarisation of entire webpages using the `/api/v2/summarise` API
- 🔍 **Ask About Page:** Click the "Ask about page" button to open a chat interface for page-wide questions and summaries
- 🌍 Multilingual AI Chat: Communicate with AI in any language (Arabic, Spanish, French, Hindi, Chinese, Japanese, and more) regardless of the website's content language
- 💬 Conversational AI: Ask questions and get responses in your preferred regional language
- 💜 Highlighted key terms with purple pill styling
- ⚡ Background content processing for efficient page summarisation

## Project Structure

- `entrypoints/popup.html` - The popup HTML file
- `assets/popup.css` - Modular CSS styling (separate from HTML)
- `assets/popup.js` - Toggle functionality JavaScript
- `assets/logo_1-removebg.png` - Cat logo image
- `core/services/` - Service files for API integration, word explanations, and text simplification
  - `ApiService.js` - Centralized API service handling all API calls including chat functionality, text simplification (`/api/v2/simplify`), page summarisation (`/api/v2/summarise`), word explanations (`/api/v2/words-explanation`), and web search (`/api/v2/web-search-stream`)
- `core/config/` - Configuration files for API and build settings
- `wxt.config.ts` - WXT configuration file
- `package.json` - Project dependencies and scripts

## API Integration

### Page Summarisation API

The extension uses the `/api/v2/summarise` endpoint for page summarisation:

- **Endpoint:** `/api/v2/summarise`
- **Method:** POST
- **Format:** JSON request/response
- **Request Payload:** `{ "text": "..." }`
- **Response:** `{ "summary": "..." }`
- **Features:**
  - Automatic page content extraction in background threads
  - Content caching in JSON format (`pageTextContent` variable)
  - Simple JSON-based API (not SSE)
  - Error handling with detailed error messages
  - Text length limiting (50,000 characters max) for optimal performance

## Learn More

- [WXT Documentation](https://wxt.dev)
- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)

