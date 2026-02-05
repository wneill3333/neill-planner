/// <reference types="cypress" />

describe('Authentication Flow', () => {
  beforeEach(() => {
    // Clear auth state before each test
    cy.clearAllCookies();
    cy.clearLocalStorage();
    cy.visit('/');
  });

  it('should display the login page when not authenticated', () => {
    // Check that login page elements are visible
    cy.contains('Neill Planner').should('be.visible');
    cy.contains('Sign in').should('be.visible');
  });

  it('should show Google sign-in button', () => {
    // Verify Google sign-in button is present
    cy.get('button').contains(/sign in/i).should('be.visible');
  });

  it('should redirect to app after mock login', () => {
    // Mock Firebase authentication
    cy.login();

    // Wait for app to be ready
    cy.waitForAppReady();

    // Verify we're on the main app page
    cy.url().should('include', '/');
    cy.get('[data-testid="app-container"]').should('be.visible');
  });

  it('should show user menu when authenticated', () => {
    cy.login();
    cy.waitForAppReady();

    // Check for user menu or profile elements
    cy.get('[data-testid="user-menu"]', { timeout: 5000 }).should('exist');
  });

  it('should allow logout', () => {
    cy.login();
    cy.waitForAppReady();

    // Open user menu
    cy.get('[data-testid="user-menu"]').click();

    // Click logout
    cy.get('[data-testid="logout-button"]').click();

    // Should return to login page
    cy.contains('Sign in', { timeout: 5000 }).should('be.visible');
  });
});
