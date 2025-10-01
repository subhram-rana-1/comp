import { defineConfig } from 'wxt';

export default defineConfig({
  publicDir: 'assets',
  manifest: {
    name: 'Magic comprehension with AI',
    version: '1.0.0',
    description: 'Sharpen your vocabulary and comprehension skill',
    action: {
      default_title: 'Sharpen your vocabulary and comprehension skill',
    },
    icons: {
      16: 'chrome-extension-logo.png',
      32: 'chrome-extension-logo.png',
      48: 'chrome-extension-logo.png',
      128: 'chrome-extension-logo.png',
    },
  },
});

