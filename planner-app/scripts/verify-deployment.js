#!/usr/bin/env node

/**
 * Deployment Verification Script
 *
 * Checks that all required files and configurations are in place
 * before attempting deployment.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const { green, red, yellow, blue, cyan, reset } = colors;

let hasErrors = false;
let hasWarnings = false;

function log(message, color = reset) {
  console.log(`${color}${message}${reset}`);
}

function checkFile(filePath, description) {
  const fullPath = join(rootDir, filePath);
  const exists = existsSync(fullPath);

  if (exists) {
    log(`✓ ${description}`, green);
  } else {
    log(`✗ ${description} - Missing: ${filePath}`, red);
    hasErrors = true;
  }

  return exists;
}

function checkEnvVariable(envFile, variable) {
  const fullPath = join(rootDir, envFile);

  if (!existsSync(fullPath)) {
    return false;
  }

  const content = readFileSync(fullPath, 'utf-8');
  const hasVar = content.includes(variable);

  return hasVar;
}

function warn(message) {
  log(`⚠ ${message}`, yellow);
  hasWarnings = true;
}

function info(message) {
  log(`ℹ ${message}`, cyan);
}

function section(title) {
  log(`\n${title}`, blue);
  log('='.repeat(title.length), blue);
}

// Main verification
console.log('\n');
log('Neill Planner - Deployment Verification', blue);
log('========================================', blue);

section('Required Configuration Files');
checkFile('package.json', 'package.json');
checkFile('vite.config.ts', 'Vite configuration');
checkFile('tsconfig.json', 'TypeScript configuration');
checkFile('firebase.json', 'Firebase configuration');
checkFile('firestore.rules', 'Firestore security rules');
checkFile('firestore.indexes.json', 'Firestore indexes');
checkFile('vercel.json', 'Vercel configuration');

section('Environment Files');
checkFile('.env.example', 'Development environment template');
checkFile('.env.production.example', 'Production environment template');
checkFile('.env.staging.example', 'Staging environment template');

if (!existsSync(join(rootDir, '.env.local'))) {
  warn('No .env.local file found - create from .env.example for local development');
}

if (!existsSync(join(rootDir, '.env.production'))) {
  warn('No .env.production file found - required for production deployment');
}

section('Cypress E2E Tests');
checkFile('cypress.config.ts', 'Cypress configuration');
checkFile('cypress/support/commands.ts', 'Cypress custom commands');
checkFile('cypress/support/e2e.ts', 'Cypress E2E support');
checkFile('cypress/fixtures/testUser.json', 'Cypress test fixtures');
checkFile('cypress/e2e/auth.cy.ts', 'Authentication E2E tests');
checkFile('cypress/e2e/tasks.cy.ts', 'Task management E2E tests');
checkFile('cypress/e2e/search.cy.ts', 'Search E2E tests');
checkFile('cypress/e2e/filters.cy.ts', 'Filter E2E tests');
checkFile('cypress/e2e/settings.cy.ts', 'Settings E2E tests');

section('CI/CD Configuration');
checkFile('.github/workflows/ci.yml', 'GitHub Actions workflow');

section('Documentation');
checkFile('README.md', 'Project README');
checkFile('DEPLOYMENT_CHECKLIST.md', 'Deployment checklist');
checkFile('cypress/README.md', 'Cypress testing guide');

section('Package.json Scripts');
try {
  const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf-8'));
  const scripts = packageJson.scripts || {};

  const requiredScripts = {
    'dev': 'Development server',
    'build': 'Production build',
    'preview': 'Preview production build',
    'test': 'Unit tests',
    'test:run': 'Run tests once',
    'lint': 'Linter',
    'cy:open': 'Cypress UI',
    'cy:run': 'Cypress headless',
    'test:e2e': 'E2E test suite',
  };

  for (const [script, description] of Object.entries(requiredScripts)) {
    if (scripts[script]) {
      log(`✓ ${description} (${script})`, green);
    } else {
      log(`✗ ${description} (${script}) - Missing script`, red);
      hasErrors = true;
    }
  }
} catch (error) {
  log(`✗ Failed to parse package.json: ${error.message}`, red);
  hasErrors = true;
}

section('Build Verification');
info('Checking if build artifacts exist...');
if (existsSync(join(rootDir, 'dist'))) {
  log('✓ Build directory exists', green);
  info('Run "npm run preview" to test the production build locally');
} else {
  warn('Build directory not found - run "npm run build" to create production build');
}

section('Git Configuration');
if (existsSync(join(rootDir, '.git'))) {
  log('✓ Git repository initialized', green);
} else {
  warn('Not a git repository - initialize with "git init"');
}

if (existsSync(join(rootDir, '.gitignore'))) {
  log('✓ .gitignore exists', green);

  const gitignore = readFileSync(join(rootDir, '.gitignore'), 'utf-8');
  const requiredIgnores = [
    '*.local',
    '.env.production',
    'node_modules',
    'dist',
    'cypress/screenshots',
    'cypress/videos',
  ];

  for (const pattern of requiredIgnores) {
    if (gitignore.includes(pattern)) {
      log(`  ✓ Ignoring ${pattern}`, green);
    } else {
      warn(`  .gitignore should include: ${pattern}`);
    }
  }
} else {
  log('✗ .gitignore missing', red);
  hasErrors = true;
}

section('Next Steps');
console.log('\n');

if (hasErrors) {
  log('❌ Verification failed with errors', red);
  log('Please fix the errors above before deploying.', red);
  process.exit(1);
} else if (hasWarnings) {
  log('⚠️  Verification passed with warnings', yellow);
  log('Review the warnings above and take action if needed.', yellow);
  console.log('\n');
  info('To deploy:');
  info('1. Fix TypeScript compilation errors: npm run build');
  info('2. Run tests: npm run test:run && npm run test:e2e');
  info('3. Review DEPLOYMENT_CHECKLIST.md');
  info('4. Configure production environment variables');
  info('5. Deploy to Vercel: vercel --prod');
  info('   or Firebase: firebase deploy');
} else {
  log('✅ All checks passed!', green);
  console.log('\n');
  info('Ready to deploy! Follow these steps:');
  info('1. Fix TypeScript compilation errors: npm run build');
  info('2. Run all tests: npm run test:run && npm run test:e2e');
  info('3. Review DEPLOYMENT_CHECKLIST.md');
  info('4. Configure production environment variables');
  info('5. Push to GitHub to trigger CI/CD');
  info('   or deploy manually: vercel --prod / firebase deploy');
}

console.log('\n');
