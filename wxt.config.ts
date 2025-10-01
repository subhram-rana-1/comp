import { defineConfig } from 'wxt';

export default defineConfig({
  publicDir: 'assets',
  manifest: {
    name: 'Hello World Extension',
    version: '1.0.0',
    description: 'A simple Hello World Chrome extension',
  },
});

