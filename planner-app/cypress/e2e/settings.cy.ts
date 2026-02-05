/// <reference types="cypress" />

describe('Settings Page', () => {
  beforeEach(() => {
    cy.login();
    cy.waitForAppReady();
  });

  it('should navigate to settings page', () => {
    // Click settings link/button
    cy.get('[data-testid="settings-link"]').click();

    // Should be on settings page
    cy.url().should('include', '/settings');
    cy.contains(/settings/i).should('be.visible');
  });

  it('should display settings page sections', () => {
    cy.get('[data-testid="settings-link"]').click();

    // Check for main settings sections
    cy.contains(/appearance/i).should('be.visible');
    cy.contains(/preferences/i).should('be.visible');
  });

  describe('Theme Settings', () => {
    beforeEach(() => {
      cy.get('[data-testid="settings-link"]').click();
    });

    it('should display theme options', () => {
      cy.get('[data-testid="theme-selector"]').should('be.visible');
    });

    it('should change to dark theme', () => {
      cy.get('[data-testid="theme-dark"]').click();

      // Verify dark theme is applied
      cy.get('html').should('have.class', 'dark');
    });

    it('should change to light theme', () => {
      cy.get('[data-testid="theme-light"]').click();

      // Verify light theme is applied (dark class removed)
      cy.get('html').should('not.have.class', 'dark');
    });

    it('should persist theme selection', () => {
      cy.get('[data-testid="theme-dark"]').click();

      // Reload page
      cy.reload();
      cy.waitForAppReady();

      // Dark theme should still be active
      cy.get('html').should('have.class', 'dark');
    });
  });

  describe('Notification Settings', () => {
    beforeEach(() => {
      cy.get('[data-testid="settings-link"]').click();
    });

    it('should display notification preferences', () => {
      cy.contains(/notifications/i).should('be.visible');
      cy.get('[data-testid="notification-toggle"]').should('be.visible');
    });

    it('should toggle notification settings', () => {
      cy.get('[data-testid="notification-toggle"]').click();

      // Setting should be toggled
      cy.get('[data-testid="notification-toggle"]').should('have.attr', 'data-state', 'checked');
    });
  });

  describe('Default View Settings', () => {
    beforeEach(() => {
      cy.get('[data-testid="settings-link"]').click();
    });

    it('should allow changing default view', () => {
      cy.get('[data-testid="default-view-selector"]').should('be.visible');

      // Select a different view
      cy.get('[data-testid="default-view-selector"]').select('week');

      // Save settings
      cy.get('[data-testid="save-settings-button"]').click();

      // Should show success message
      cy.contains(/saved/i).should('be.visible');
    });
  });

  describe('Calendar Integration Settings', () => {
    beforeEach(() => {
      cy.get('[data-testid="settings-link"]').click();
    });

    it('should display calendar sync options', () => {
      cy.contains(/calendar/i).should('be.visible');
    });

    it('should show Google Calendar connection status', () => {
      cy.get('[data-testid="google-calendar-status"]').should('be.visible');
    });
  });

  describe('Save Settings', () => {
    beforeEach(() => {
      cy.get('[data-testid="settings-link"]').click();
    });

    it('should save settings when clicking save button', () => {
      // Make a change
      cy.get('[data-testid="theme-dark"]').click();

      // Save
      cy.get('[data-testid="save-settings-button"]').click();

      // Should show success message
      cy.contains(/settings saved/i).should('be.visible');
    });

    it('should persist settings across sessions', () => {
      // Change theme
      cy.get('[data-testid="theme-dark"]').click();
      cy.get('[data-testid="save-settings-button"]').click();

      // Navigate away and back
      cy.get('[data-testid="home-link"]').click();
      cy.get('[data-testid="settings-link"]').click();

      // Dark theme should still be selected
      cy.get('html').should('have.class', 'dark');
    });
  });

  describe('Reset Settings', () => {
    beforeEach(() => {
      cy.get('[data-testid="settings-link"]').click();
    });

    it('should display reset button', () => {
      cy.get('[data-testid="reset-settings-button"]').should('be.visible');
    });

    it('should reset settings to defaults', () => {
      // Make changes
      cy.get('[data-testid="theme-dark"]').click();
      cy.get('[data-testid="save-settings-button"]').click();

      // Reset
      cy.get('[data-testid="reset-settings-button"]').click();

      // Confirm reset
      cy.get('[data-testid="confirm-reset-button"]').click();

      // Should show success message
      cy.contains(/reset/i).should('be.visible');
    });
  });
});
