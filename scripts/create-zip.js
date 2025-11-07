#!/usr/bin/env node

import { readFileSync, existsSync, renameSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Read package.json to get version
const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf-8'));
const version = packageJson.version;
const packageName = packageJson.name;

// Use "Magic comprehension" for the zip filename (replace spaces with hyphens for filename)
const extensionDisplayName = 'Magic comprehension';
const zipFileName = `${extensionDisplayName.replace(/\s+/g, '-').toLowerCase()}-${version}.zip`;

const outputDir = join(rootDir, '.output');
const zipFilePath = join(outputDir, zipFileName);

// Use WXT to create zip (it creates <name>-<version>-<browser>.zip)
console.log('Creating zip file with WXT...');
try {
  execSync('wxt zip', { cwd: rootDir, stdio: 'inherit' });
} catch (error) {
  console.error('Failed to create zip with WXT:', error.message);
  process.exit(1);
}

// Find the zip file that WXT created (pattern: <name>-<version>-chrome.zip)
const wxtZipPattern = `${packageName}-${version}-chrome.zip`;
const wxtZipPath = join(outputDir, wxtZipPattern);

if (!existsSync(wxtZipPath)) {
  console.error(`WXT zip file not found: ${wxtZipPattern}`);
  console.error('Please check the .output directory for the created zip file.');
  process.exit(1);
}

// Rename the file to remove the browser suffix
console.log(`Renaming ${wxtZipPattern} to ${zipFileName}...`);
try {
  renameSync(wxtZipPath, zipFilePath);
  console.log(`✓ Successfully created ${zipFileName}`);
  console.log(`  Location: ${zipFilePath}`);
} catch (error) {
  console.error(`Failed to rename zip file: ${error.message}`);
  console.error(`Original file: ${wxtZipPath}`);
  process.exit(1);
}

