import { defineConfig } from 'wxt';
import { getHostPermissions } from './src/config/buildConfig';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import react from '@vitejs/plugin-react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname);
const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf-8'));

export default defineConfig({
  publicDir: 'assets',
  vite: () => ({
    plugins: [react()],
    resolve: {
      alias: {
        '@': join(rootDir, 'src'),
        '@components': join(rootDir, 'src/components'),
        '@services': join(rootDir, 'src/services'),
        '@store': join(rootDir, 'src/store'),
        '@types': join(rootDir, 'src/types'),
        '@utils': join(rootDir, 'src/utils'),
        '@hooks': join(rootDir, 'src/hooks'),
        '@config': join(rootDir, 'src/config'),
      },
    },
  }),
  manifest: {
    name: 'XplainO',
    version: packageJson.version,
    description: 'Get AI-powered contextual explanations, summaries, and instant answers in any language—right as you browse',
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
        resources: ['logo_1-removebg.png', 'branding-removebg.png', '*.png', '*.svg'],
        matches: ['<all_urls>']
      }
    ],
  },
});

