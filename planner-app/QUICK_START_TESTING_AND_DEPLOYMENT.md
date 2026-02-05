# Quick Start: Testing & Deployment

## Quick Commands

### Development
```bash
npm run dev                    # Start dev server at http://localhost:5173
npm run build                  # Build for production
npm run preview                # Preview production build
```

### Testing
```bash
# Unit Tests
npm run test                   # Watch mode
npm run test:run               # Run once
npm run test:coverage          # With coverage

# E2E Tests
npm run test:e2e:open          # Interactive (Cypress UI)
npm run test:e2e               # Headless (CI mode)
npm run cy:open                # Cypress UI only
npm run cy:run                 # Cypress headless only

# Specific E2E Test
npx cypress run --spec "cypress/e2e/tasks.cy.ts"
```

### Code Quality
```bash
npm run lint                   # Check for issues
npm run lint:fix               # Auto-fix issues
npm run format                 # Format all code
npm run format:check           # Check formatting
```

### Deployment
```bash
npm run verify:deployment      # Check deployment readiness
vercel --prod                  # Deploy to Vercel
firebase deploy                # Deploy to Firebase
```

## E2E Testing Quick Guide

### Running Tests Locally

**Interactive Mode** (Best for development):
```bash
npm run test:e2e:open
```
- Opens Cypress UI
- Click on test file to run
- See real-time results
- Use time-travel debugging

**Headless Mode** (Best for CI/CD):
```bash
npm run test:e2e
```
- Starts dev server automatically
- Runs all tests
- Generates reports
- Exits when complete

### Writing Tests

Basic test structure:
```typescript
describe('Feature Name', () => {
  beforeEach(() => {
    cy.clearAllTasks();
    cy.login();
    cy.waitForAppReady();
  });

  it('should do something', () => {
    cy.get('[data-testid="element"]').click();
    cy.contains('Expected Text').should('be.visible');
  });
});
```

Custom commands:
```typescript
cy.login();                                    // Login as test user
cy.createTask({ title: 'Task', priority: 'A1' }); // Create task
cy.waitForAppReady();                          // Wait for app to load
cy.clearAllTasks();                            // Clean up data
```

### Adding Test IDs to Components

Add `data-testid` attributes:
```tsx
<button data-testid="add-task-button">Add Task</button>
<input data-testid="task-title-input" />
<div data-testid="task-item">{task.title}</div>
```

## Deployment Quick Guide

### Pre-Deployment Checklist

```bash
# 1. Verify everything is ready
npm run verify:deployment

# 2. Run all tests
npm run test:run
npm run test:e2e

# 3. Check code quality
npm run lint
npm run format:check

# 4. Build for production
npm run build

# 5. Preview locally
npm run preview
```

### Deploy to Vercel

**First Time Setup:**
```bash
npm install -g vercel
vercel login
vercel link
```

**Deploy:**
```bash
# Preview deployment (staging)
vercel

# Production deployment
vercel --prod
```

### Deploy to Firebase

**First Time Setup:**
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
```

**Deploy:**
```bash
# Deploy hosting only
firebase deploy --only hosting

# Deploy everything
firebase deploy
```

### Environment Variables

**Local Development:**
1. Copy `.env.example` to `.env.local`
2. Fill in your Firebase credentials
3. Add Google Calendar API keys

**Production:**
1. Copy `.env.production.example` to `.env.production`
2. Fill in production credentials
3. Set environment variables in hosting platform:
   - Vercel: Project Settings → Environment Variables
   - Firebase: Use `firebase functions:config:set`

**Required Variables:**
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_GOOGLE_CLIENT_ID
VITE_GOOGLE_API_KEY
```

## CI/CD with GitHub Actions

### Automatic Deployment

**Setup:**
1. Push code to GitHub
2. Add secrets in repository settings:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
   - Or `FIREBASE_SERVICE_ACCOUNT`
3. Uncomment deployment step in `.github/workflows/ci.yml`

**Triggers:**
- Every push to main/master → runs tests + deploys
- Every pull request → runs tests only
- Manual workflow dispatch

**Pipeline:**
1. **Test** → Lint, unit tests, type check, build
2. **E2E** → Cypress tests with Chrome
3. **Deploy** → Deploy to production (main/master only)

### Viewing Results
- Go to GitHub repository
- Click "Actions" tab
- View workflow runs
- Check test results
- Download artifacts (screenshots, videos on failure)

## Troubleshooting

### Build Fails
```bash
# Check TypeScript errors
npx tsc --noEmit

# Fix known issues
npm run lint:fix
npm run format

# Clean rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Tests Fail
```bash
# Unit tests
npm run test:run -- --reporter=verbose

# E2E tests - check specific test
npm run cy:run -- --spec "cypress/e2e/auth.cy.ts"

# Clean test data
cy.clearAllTasks()  # In test
```

### Deployment Issues
```bash
# Verify configuration
npm run verify:deployment

# Check environment variables
cat .env.production

# Test build locally
npm run build
npm run preview
```

### Cypress Issues
```bash
# Verify Cypress installation
npx cypress verify

# Open Cypress for debugging
npm run cy:open

# Clear Cypress cache
npx cypress cache clear
```

## Important Links

- **Full Deployment Checklist**: `DEPLOYMENT_CHECKLIST.md`
- **Cypress Testing Guide**: `cypress/README.md`
- **Implementation Status**: `PHASE_12.4_STATUS.md`
- **Summary**: `PHASE_12.4_SUMMARY.md`

## Common Workflows

### Adding a New Feature
```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Develop and test
npm run dev
npm run test

# 3. Write E2E test
# Edit cypress/e2e/my-feature.cy.ts

# 4. Run all tests
npm run test:run
npm run test:e2e

# 5. Verify quality
npm run lint:fix
npm run format

# 6. Commit and push
git add .
git commit -m "Add my feature"
git push origin feature/my-feature

# 7. Create PR on GitHub
# CI will run automatically
```

### Fixing a Bug
```bash
# 1. Reproduce with test
# Add test to appropriate cypress/e2e/*.cy.ts

# 2. Fix the bug
npm run dev

# 3. Verify fix
npm run test:e2e:open
# Run specific test

# 4. Ensure all tests pass
npm run test:run
npm run test:e2e

# 5. Deploy
git commit -am "Fix bug"
git push
```

### Deploying to Production
```bash
# 1. Ensure on main branch
git checkout main
git pull

# 2. Final verification
npm run verify:deployment
npm run test:run
npm run test:e2e

# 3. Build and preview
npm run build
npm run preview
# Test at http://localhost:4173

# 4. Deploy
vercel --prod
# or
firebase deploy

# 5. Verify production
# Open production URL
# Test key features
# Check console for errors
```

## Getting Help

- **Cypress Issues**: See `cypress/README.md`
- **Deployment Issues**: See `DEPLOYMENT_CHECKLIST.md`
- **TypeScript Errors**: Run `npx tsc --noEmit` for details
- **Build Issues**: Check `PHASE_12.4_STATUS.md` for known issues

## Next Steps

1. ✅ Phase 12.4 is complete
2. ⚠️ Fix TypeScript compilation errors
3. 🔄 Add `data-testid` attributes to components
4. ✅ Run full test suite
5. ✅ Configure production environment
6. 🚀 Deploy to production

---

**Quick Reference Complete** | For detailed information, see the comprehensive documentation files listed above.
