import { defineConfig } from 'wxt';
import { getHostPermissions } from './core/config/buildConfig.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname);
const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf-8'));

export default defineConfig({
  publicDir: 'assets',
  manifest: {
    name: 'XplainO',
    version: packageJson.version,
    description: 'Enhance your reading, vocabulary, and comprehension instantly in any language with AI-powered insights.',
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

