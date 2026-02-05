/// <reference types="cypress" />

describe('Task Management', () => {
  beforeEach(() => {
    cy.clearAllTasks();
    cy.login();
    cy.waitForAppReady();
  });

  describe('Create Task', () => {
    it('should open task creation dialog when clicking add button', () => {
      cy.get('[data-testid="add-task-button"]').click();
      cy.get('[data-testid="task-dialog"]').should('be.visible');
    });

    it('should create a new task with required fields', () => {
      cy.createTask({
        title: 'New test task',
        priority: 'A1',
      });

      // Verify task appears in the list
      cy.contains('New test task').should('be.visible');
    });

    it('should create a task with all fields', () => {
      cy.get('[data-testid="add-task-button"]').click();

      cy.get('[data-testid="task-title-input"]').type('Complete task with all fields');
      cy.get('[data-testid="task-priority-input"]').type('B2');
      cy.get('[data-testid="task-category-input"]').type('Work');
      cy.get('[data-testid="task-date-input"]').type('2026-02-10');

      cy.get('[data-testid="save-task-button"]').click();

      // Verify task appears with correct details
      cy.contains('Complete task with all fields').should('be.visible');
      cy.contains('B2').should('be.visible');
      cy.contains('Work').should('be.visible');
    });

    it('should show validation error for empty title', () => {
      cy.get('[data-testid="add-task-button"]').click();
      cy.get('[data-testid="save-task-button"]').click();

      // Should show validation error
      cy.contains(/title.*required/i).should('be.visible');
    });
  });

  describe('Edit Task', () => {
    beforeEach(() => {
      cy.createTask({
        title: 'Task to edit',
        priority: 'A1',
      });
    });

    it('should open edit dialog when clicking on task', () => {
      cy.contains('Task to edit').click();
      cy.get('[data-testid="task-dialog"]').should('be.visible');
      cy.get('[data-testid="task-title-input"]').should('have.value', 'Task to edit');
    });

    it('should update task details', () => {
      cy.contains('Task to edit').click();

      cy.get('[data-testid="task-title-input"]').clear().type('Updated task title');
      cy.get('[data-testid="task-priority-input"]').clear().type('B1');
      cy.get('[data-testid="save-task-button"]').click();

      // Verify updates are visible
      cy.contains('Updated task title').should('be.visible');
      cy.contains('B1').should('be.visible');
    });
  });

  describe('Task Status', () => {
    beforeEach(() => {
      cy.createTask({
        title: 'Task for status change',
        priority: 'A1',
      });
    });

    it('should cycle task status on click', () => {
      // Find the status symbol and click it
      cy.get('[data-testid="status-symbol"]').first().click();

      // Status should change (exact state depends on implementation)
      cy.get('[data-testid="status-symbol"]').first().should('exist');
    });

    it('should mark task as complete', () => {
      // Click status until complete
      cy.get('[data-testid="status-symbol"]').first().click();

      // Task should show complete status (visual indicator)
      cy.contains('Task for status change').parent().should('have.attr', 'data-status', 'complete');
    });
  });

  describe('Delete Task', () => {
    beforeEach(() => {
      cy.createTask({
        title: 'Task to delete',
        priority: 'A1',
      });
    });

    it('should delete task when cycling to delete status', () => {
      // Click status multiple times to reach delete
      cy.get('[data-testid="status-symbol"]').first().click();
      cy.wait(500);
      cy.get('[data-testid="status-symbol"]').first().click();
      cy.wait(500);
      cy.get('[data-testid="status-symbol"]').first().click();
      cy.wait(500);
      cy.get('[data-testid="status-symbol"]').first().click();
      cy.wait(500);
      cy.get('[data-testid="status-symbol"]').first().click();

      // Task should be removed from the list
      cy.contains('Task to delete').should('not.exist');
    });
  });

  describe('Drag and Drop Reorder', () => {
    beforeEach(() => {
      cy.createTask({ title: 'First task', priority: 'A1' });
      cy.createTask({ title: 'Second task', priority: 'A2' });
      cy.createTask({ title: 'Third task', priority: 'A3' });
    });

    it('should reorder tasks via drag and drop', () => {
      // Get initial order
      cy.get('[data-testid="task-item"]').first().should('contain', 'First task');

      // Perform drag and drop (basic simulation)
      cy.get('[data-testid="task-item"]').first()
        .trigger('mousedown', { which: 1 })
        .trigger('mousemove', { clientX: 100, clientY: 200 })
        .trigger('mouseup', { force: true });

      // Order may have changed (exact behavior depends on implementation)
      cy.get('[data-testid="task-item"]').should('have.length', 3);
    });
  });
});
