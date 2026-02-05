/// <reference types="cypress" />

describe('Search Functionality', () => {
  beforeEach(() => {
    cy.clearAllTasks();
    cy.login();
    cy.waitForAppReady();

    // Create test tasks
    cy.createTask({ title: 'Write documentation', priority: 'A1', category: 'Work' });
    cy.createTask({ title: 'Review code', priority: 'B1', category: 'Work' });
    cy.createTask({ title: 'Call dentist', priority: 'C1', category: 'Personal' });
    cy.createTask({ title: 'Buy groceries', priority: 'C2', category: 'Personal' });
  });

  it('should display search bar', () => {
    cy.get('[data-testid="search-input"]').should('be.visible');
  });

  it('should filter tasks by search term', () => {
    cy.get('[data-testid="search-input"]').type('documentation');

    // Should show matching task
    cy.contains('Write documentation').should('be.visible');

    // Should hide non-matching tasks
    cy.contains('Review code').should('not.be.visible');
    cy.contains('Call dentist').should('not.be.visible');
  });

  it('should show all tasks when search is cleared', () => {
    cy.get('[data-testid="search-input"]').type('documentation');
    cy.contains('Write documentation').should('be.visible');

    // Clear search
    cy.get('[data-testid="search-input"]').clear();

    // All tasks should be visible
    cy.contains('Write documentation').should('be.visible');
    cy.contains('Review code').should('be.visible');
    cy.contains('Call dentist').should('be.visible');
  });

  it('should search case-insensitively', () => {
    cy.get('[data-testid="search-input"]').type('REVIEW');
    cy.contains('Review code').should('be.visible');
  });

  it('should search by partial match', () => {
    cy.get('[data-testid="search-input"]').type('doc');
    cy.contains('Write documentation').should('be.visible');
  });

  it('should show no results message when no matches', () => {
    cy.get('[data-testid="search-input"]').type('nonexistent task xyz');

    cy.contains(/no tasks found/i).should('be.visible');
  });

  it('should search across multiple fields', () => {
    // Search by category
    cy.get('[data-testid="search-input"]').clear().type('Work');
    cy.contains('Write documentation').should('be.visible');
    cy.contains('Review code').should('be.visible');
    cy.contains('Call dentist').should('not.be.visible');
  });

  it('should clear search with clear button', () => {
    cy.get('[data-testid="search-input"]').type('documentation');

    // Click clear button if exists
    cy.get('[data-testid="clear-search-button"]').click();

    cy.get('[data-testid="search-input"]').should('have.value', '');
    cy.contains('Review code').should('be.visible');
  });
});
