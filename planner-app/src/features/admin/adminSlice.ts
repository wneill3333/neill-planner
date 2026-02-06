/**
 * Admin Slice
 *
 * Redux Toolkit slice for admin state management.
 * Handles allowed users list and admin operations.
 */

import { createSlice, createSelector } from '@reduxjs/toolkit';
import type { AllowedUser } from '../../types';
import type { RootState } from '../../store';
import {
  fetchAllowedUsers,
  addAllowedUserAsync,
  removeAllowedUserAsync,
  updateAllowedUserRoleAsync,
} from './adminThunks';

// =============================================================================
// Types
// =============================================================================

/**
 * State shape for the admin slice
 */
export interface AdminState {
  /** List of allowed users */
  allowedUsers: AllowedUser[];
  /** Loading state for fetching */
  loading: boolean;
  /** Saving state for mutations (add/remove/update) */
  saving: boolean;
  /** Error message if any */
  error: string | null;
}

// =============================================================================
// Initial State
// =============================================================================

export const initialState: AdminState = {
  allowedUsers: [],
  loading: false,
  saving: false,
  error: null,
};

// =============================================================================
// Slice
// =============================================================================

export const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    /**
     * Clear any error messages
     */
    clearAdminError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch allowed users
    builder
      .addCase(fetchAllowedUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllowedUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.allowedUsers = action.payload;
      })
      .addCase(fetchAllowedUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch allowed users';
      });

    // Add allowed user
    builder
      .addCase(addAllowedUserAsync.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(addAllowedUserAsync.fulfilled, (state, action) => {
        state.saving = false;
        state.allowedUsers.push(action.payload);
      })
      .addCase(addAllowedUserAsync.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message || 'Failed to add allowed user';
      });

    // Remove allowed user
    builder
      .addCase(removeAllowedUserAsync.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(removeAllowedUserAsync.fulfilled, (state, action) => {
        state.saving = false;
        const emailToRemove = action.payload;
        state.allowedUsers = state.allowedUsers.filter((u) => u.email !== emailToRemove);
      })
      .addCase(removeAllowedUserAsync.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message || 'Failed to remove allowed user';
      });

    // Update allowed user role
    builder
      .addCase(updateAllowedUserRoleAsync.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateAllowedUserRoleAsync.fulfilled, (state, action) => {
        state.saving = false;
        const updatedUser = action.payload;
        const index = state.allowedUsers.findIndex((u) => u.email === updatedUser.email);
        if (index !== -1) {
          state.allowedUsers[index] = updatedUser;
        }
      })
      .addCase(updateAllowedUserRoleAsync.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message || 'Failed to update user role';
      });
  },
});

// =============================================================================
// Actions
// =============================================================================

export const { clearAdminError } = adminSlice.actions;

// =============================================================================
// Selectors
// =============================================================================

/**
 * Select all allowed users
 */
export const selectAllowedUsers = (state: RootState): AllowedUser[] =>
  state.admin.allowedUsers;

/**
 * Select loading state
 */
export const selectAdminLoading = (state: RootState): boolean => state.admin.loading;

/**
 * Select saving state
 */
export const selectAdminSaving = (state: RootState): boolean => state.admin.saving;

/**
 * Select error message
 */
export const selectAdminError = (state: RootState): string | null => state.admin.error;

/**
 * Select admin users count
 */
export const selectAdminCount = createSelector([selectAllowedUsers], (users) =>
  users.filter((u) => u.role === 'admin').length
);

// =============================================================================
// Reducer Export
// =============================================================================

export default adminSlice.reducer;
