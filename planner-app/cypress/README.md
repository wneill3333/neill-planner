# Cypress E2E Testing Guide

This directory contains End-to-End (E2E) tests for Neill Planner built with Cypress.

## Directory Structure

```
cypress/
├── e2e/                    # Test files
│   ├── auth.cy.ts         # Authentication tests
│   ├── tasks.cy.ts        # Task management tests
│   ├── search.cy.ts       # Search functionality tests
│   ├── filters.cy.ts      # Filter functionality tests
│   └── settings.cy.ts     # Settings page tests
├── fixtures/              # Test data
│   └── testUser.json      # Mock user and task data
└── support/               # Support files
    ├── commands.ts        # Custom Cypress commands
    └── e2e.ts            # Global configuration
```

## Running Tests

### Interactive Mode (Cypress UI)
```bash
# Start dev server and open Cypress UI
npm run test:e2e:open

# Or manually
npm run cy:open
```

### Headless Mode (CI/CD)
```bash
# Start dev server and run all tests
npm run test:e2e

# Or run Cypress directly (requires running dev server)
npm run cy:run
```

### Running Specific Tests
```bash
# Run a specific test file
npx cypress run --spec "cypress/e2e/tasks.cy.ts"

# Run tests matching a pattern
npx cypress run --spec "cypress/e2e/**/*auth*.cy.ts"
```

## Custom Commands

We've created custom Cypress commands to simplify test writing:

### cy.login()
Mocks Firebase authentication and logs in a test user.
```typescript
cy.login();
```

### cy.createTask(taskData)
Creates a task with the specified data.
```typescript
cy.createTask({
  title: 'My Task',
  priority: 'A1',
  category: 'Work',
  date: '2026-02-10'
});
```

### cy.waitForAppReady()
Waits for the application to be fully loaded.
```typescript
cy.waitForAppReady();
```

### cy.clearAllTasks()
Clears all tasks from IndexedDB (useful for test cleanup).
```typescript
cy.clearAllTasks();
```

## Writing New Tests

### Basic Test Structure
```typescript
/// <reference types="cypress" />

describe('Feature Name', () => {
  beforeEach(() => {
    cy.clearAllTasks();
    cy.login();
    cy.waitForAppReady();
  });

  it('should do something', () => {
    // Your test code
    cy.get('[data-testid="element"]').should('be.visible');
  });
});
```

### Best Practices

1. **Use data-testid attributes**: Always select elements using `data-testid` attributes
   ```typescript
   cy.get('[data-testid="add-task-button"]').click();
   ```

2. **Clean up before tests**: Use `beforeEach` to ensure a clean state
   ```typescript
   beforeEach(() => {
     cy.clearAllTasks();
     cy.login();
   });
   ```

3. **Wait for async operations**: Use Cypress's built-in waiting
   ```typescript
   cy.contains('Task created').should('be.visible');
   ```

4. **Avoid hard-coded waits**: Prefer assertions over `cy.wait(ms)`
   ```typescript
   // Bad
   cy.wait(1000);
   cy.get('[data-testid="task"]').should('exist');

   // Good
   cy.get('[data-testid="task"]', { timeout: 5000 }).should('exist');
   ```

5. **Group related tests**: Use `describe` blocks to organize tests
   ```typescript
   describe('Task Creation', () => {
     describe('Valid Input', () => {
       it('should create task with title only', () => {});
       it('should create task with all fields', () => {});
     });

     describe('Invalid Input', () => {
       it('should show error for empty title', () => {});
     });
   });
   ```

## Test Data

Test data is stored in `cypress/fixtures/testUser.json`. This includes:
- Mock user credentials
- Sample tasks for testing

To use fixture data in tests:
```typescript
cy.fixture('testUser.json').then((data) => {
  // Use data.testTasks, data.email, etc.
});
```

## Debugging Tests

### Interactive Debugging
1. Open Cypress UI: `npm run test:e2e:open`
2. Click on a test file to run it
3. Use the time-travel feature to step through commands
4. Click on commands to see DOM snapshots

### Screenshots and Videos
- Screenshots are automatically captured on failure
- Videos can be enabled in `cypress.config.ts`
- Artifacts are saved to `cypress/screenshots` and `cypress/videos`

### Console Logs
```typescript
cy.get('[data-testid="element"]').then(($el) => {
  console.log('Element:', $el);
});
```

## CI/CD Integration

Tests run automatically in GitHub Actions on:
- Push to main/master branch
- Pull requests

See `.github/workflows/ci.yml` for CI configuration.

## Common Issues

### Issue: Tests fail with "element not found"
**Solution**: Ensure the element has a `data-testid` attribute and the app is fully loaded.

### Issue: Firebase auth errors
**Solution**: Our custom commands mock Firebase auth. Make sure `cy.login()` is called before tests that require authentication.

### Issue: IndexedDB conflicts
**Solution**: Call `cy.clearAllTasks()` in `beforeEach` to ensure clean state.

### Issue: Timeouts
**Solution**: Increase timeout in individual commands or globally in `cypress.config.ts`:
```typescript
cy.get('[data-testid="element"]', { timeout: 10000 }).should('exist');
```

## Adding data-testid Attributes

For E2E tests to work, components need `data-testid` attributes:

```tsx
// Add to buttons
<button data-testid="add-task-button">Add Task</button>

// Add to inputs
<input data-testid="task-title-input" />

// Add to containers
<div data-testid="task-item">{task.title}</div>
```

### Priority Components Needing data-testid:
1. Task management UI (add, edit, delete buttons)
2. Form inputs (title, priority, category, date)
3. Status symbols
4. Search bar and clear button
5. Filter controls
6. Settings page elements
7. Navigation elements
8. User menu

## Resources

- [Cypress Documentation](https://docs.cypress.io)
- [Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Testing Library with Cypress](https://testing-library.com/docs/cypress-testing-library/intro)
- [TypeScript Support](https://docs.cypress.io/guides/tooling/typescript-support)

## Next Steps

1. Fix TypeScript compilation errors
2. Add `data-testid` attributes to components
3. Run tests locally to verify they work
4. Adjust test selectors based on actual DOM structure
5. Add more test scenarios as needed
