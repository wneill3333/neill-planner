/// <reference types="cypress" />

describe('Filter Functionality', () => {
  beforeEach(() => {
    cy.clearAllTasks();
    cy.login();
    cy.waitForAppReady();

    // Create diverse test tasks
    cy.createTask({
      title: 'Complete A1 task',
      priority: 'A1',
      category: 'Work'
    });
    cy.createTask({
      title: 'Review B1 task',
      priority: 'B1',
      category: 'Work'
    });
    cy.createTask({
      title: 'Personal C1 task',
      priority: 'C1',
      category: 'Personal'
    });
  });

  it('should display filter controls', () => {
    cy.get('[data-testid="filter-toggle"]').should('be.visible');
  });

  it('should expand filter controls when clicked', () => {
    cy.get('[data-testid="filter-toggle"]').click();
    cy.get('[data-testid="filter-panel"]').should('be.visible');
  });

  describe('Status Filters', () => {
    beforeEach(() => {
      cy.get('[data-testid="filter-toggle"]').click();
    });

    it('should filter by incomplete status', () => {
      cy.get('[data-testid="filter-status-incomplete"]').click();

      // All created tasks should be visible (they're all incomplete by default)
      cy.contains('Complete A1 task').should('be.visible');
      cy.contains('Review B1 task').should('be.visible');
    });

    it('should filter by in-progress status', () => {
      // First mark a task as in-progress
      cy.get('[data-testid="status-symbol"]').first().click();

      // Apply filter
      cy.get('[data-testid="filter-toggle"]').click();
      cy.get('[data-testid="filter-status-in-progress"]').click();

      // Should show only in-progress tasks
      cy.get('[data-testid="task-item"]').should('have.length.at.least', 1);
    });

    it('should filter by complete status', () => {
      cy.get('[data-testid="filter-status-complete"]').click();

      // No complete tasks yet, should show empty state
      cy.contains(/no tasks/i).should('be.visible');
    });
  });

  describe('Category Filters', () => {
    beforeEach(() => {
      cy.get('[data-testid="filter-toggle"]').click();
    });

    it('should filter by Work category', () => {
      cy.get('[data-testid="filter-category-work"]').click();

      // Should show only Work tasks
      cy.contains('Complete A1 task').should('be.visible');
      cy.contains('Review B1 task').should('be.visible');
      cy.contains('Personal C1 task').should('not.be.visible');
    });

    it('should filter by Personal category', () => {
      cy.get('[data-testid="filter-category-personal"]').click();

      // Should show only Personal tasks
      cy.contains('Personal C1 task').should('be.visible');
      cy.contains('Complete A1 task').should('not.be.visible');
    });
  });

  describe('Priority Filters', () => {
    beforeEach(() => {
      cy.get('[data-testid="filter-toggle"]').click();
    });

    it('should filter by A priority', () => {
      cy.get('[data-testid="filter-priority-a"]').click();

      // Should show only A priority tasks
      cy.contains('Complete A1 task').should('be.visible');
      cy.contains('Review B1 task').should('not.be.visible');
    });

    it('should filter by B priority', () => {
      cy.get('[data-testid="filter-priority-b"]').click();

      // Should show only B priority tasks
      cy.contains('Review B1 task').should('be.visible');
      cy.contains('Complete A1 task').should('not.be.visible');
    });
  });

  describe('Combined Filters', () => {
    beforeEach(() => {
      cy.get('[data-testid="filter-toggle"]').click();
    });

    it('should apply multiple filters together', () => {
      // Filter by Work category AND A priority
      cy.get('[data-testid="filter-category-work"]').click();
      cy.get('[data-testid="filter-priority-a"]').click();

      // Should show only tasks matching both criteria
      cy.contains('Complete A1 task').should('be.visible');
      cy.contains('Review B1 task').should('not.be.visible');
      cy.contains('Personal C1 task').should('not.be.visible');
    });
  });

  describe('Clear Filters', () => {
    it('should clear all active filters', () => {
      cy.get('[data-testid="filter-toggle"]').click();

      // Apply some filters
      cy.get('[data-testid="filter-category-work"]').click();
      cy.get('[data-testid="filter-priority-a"]').click();

      // Clear filters
      cy.get('[data-testid="clear-filters-button"]').click();

      // All tasks should be visible again
      cy.contains('Complete A1 task').should('be.visible');
      cy.contains('Review B1 task').should('be.visible');
      cy.contains('Personal C1 task').should('be.visible');
    });

    it('should show filter count badge', () => {
      cy.get('[data-testid="filter-toggle"]').click();
      cy.get('[data-testid="filter-category-work"]').click();
      cy.get('[data-testid="filter-priority-a"]').click();

      // Should show count of active filters
      cy.get('[data-testid="filter-count-badge"]').should('contain', '2');
    });
  });
});
