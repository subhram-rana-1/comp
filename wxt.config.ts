import { defineConfig } from 'wxt';
import { getHostPermissions } from './core/config/buildConfig.js';

export default defineConfig({
  publicDir: 'assets',
  manifest: {
    name: 'CompreAI',
    version: '1.0.0',
    description: 'Enhance your reading, vocabulary, and comprehension instantly with AI-powered insights.',
    action: {
      default_title: 'Boost your vocabulary and comprehension with AI',
    },
    icons: {
      16: 'chrome-extension-logo.png',
      32: 'chrome-extension-logo.png',
      48: 'chrome-extension-logo.png',
      128: 'chrome-extension-logo.png',
    },
    permissions: [
      'storage',
      'tabs',
      'activeTab'
    ],
    host_permissions: getHostPermissions(),
    web_accessible_resources: [
      {
        resources: ['logo_1-removebg.png', '*.png', '*.svg'],
        matches: ['<all_urls>']
      }
    ],
  },
});

