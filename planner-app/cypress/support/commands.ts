/// <reference types="cypress" />
/// <reference types="@testing-library/cypress" />

import '@testing-library/cypress/add-commands';

// Custom command for Firebase authentication mock
Cypress.Commands.add('login', () => {
  // Mock Firebase auth for e2e tests
  cy.window().then((win) => {
    win.localStorage.setItem('firebase:authUser', JSON.stringify({
      uid: 'test-user-123',
      email: 'test@example.com',
      displayName: 'Test User',
    }));
  });
  cy.visit('/');
});

// Custom command for creating a task
Cypress.Commands.add('createTask', (taskData: {
  title: string;
  priority?: string;
  category?: string;
  date?: string;
}) => {
  cy.get('[data-testid="add-task-button"]').click();
  cy.get('[data-testid="task-title-input"]').type(taskData.title);

  if (taskData.priority) {
    cy.get('[data-testid="task-priority-input"]').type(taskData.priority);
  }

  if (taskData.category) {
    cy.get('[data-testid="task-category-input"]').type(taskData.category);
  }

  if (taskData.date) {
    cy.get('[data-testid="task-date-input"]').type(taskData.date);
  }

  cy.get('[data-testid="save-task-button"]').click();
});

// Custom command for waiting for app to be ready
Cypress.Commands.add('waitForAppReady', () => {
  cy.get('[data-testid="app-container"]', { timeout: 10000 }).should('exist');
});

// Custom command for clearing all tasks
Cypress.Commands.add('clearAllTasks', () => {
  cy.window().then((win) => {
    // Clear IndexedDB
    win.indexedDB.deleteDatabase('neill-planner');
  });
  cy.reload();
});

// Declare custom commands for TypeScript
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login with mocked Firebase auth
       * @example cy.login()
       */
      login(): Chainable<void>;

      /**
       * Custom command to create a task
       * @example cy.createTask({ title: 'My Task', priority: 'A1' })
       */
      createTask(taskData: {
        title: string;
        priority?: string;
        category?: string;
        date?: string;
      }): Chainable<void>;

      /**
       * Custom command to wait for app to be ready
       * @example cy.waitForAppReady()
       */
      waitForAppReady(): Chainable<void>;

      /**
       * Custom command to clear all tasks from IndexedDB
       * @example cy.clearAllTasks()
       */
      clearAllTasks(): Chainable<void>;
    }
  }
}

export {};
