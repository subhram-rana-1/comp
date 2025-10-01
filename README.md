# Hello World Chrome Extension

A simple "Hello World" Chrome extension built with WXT.

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

## Project Structure

- `entrypoints/popup.html` - The popup HTML file that shows "Hello World"
- `wxt.config.ts` - WXT configuration file
- `package.json` - Project dependencies and scripts

## Learn More

- [WXT Documentation](https://wxt.dev)
- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)

