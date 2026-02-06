/**
 * Admin Thunks
 *
 * Redux Toolkit async thunks for admin operations.
 * Handles allowed user management (fetch, add, remove, update role).
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import type { AllowedUser, AddAllowedUserInput, UserRole } from '../../types';
import {
  getAllAllowedUsers,
  addAllowedUser,
  removeAllowedUser,
  updateAllowedUserRole,
} from '../../services/firebase/allowedUsers.service';

// =============================================================================
// Thunks
// =============================================================================

/**
 * Fetch all allowed users from Firestore
 */
export const fetchAllowedUsers = createAsyncThunk<AllowedUser[], void>(
  'admin/fetchAllowedUsers',
  async () => {
    const users = await getAllAllowedUsers();
    return users;
  }
);

/**
 * Add a new allowed user to the whitelist
 */
export const addAllowedUserAsync = createAsyncThunk<
  AllowedUser,
  { input: AddAllowedUserInput; userId: string }
>('admin/addAllowedUser', async ({ input, userId }) => {
  const newUser = await addAllowedUser(input, userId);
  return newUser;
});

/**
 * Remove an allowed user from the whitelist
 */
export const removeAllowedUserAsync = createAsyncThunk<string, { email: string }>(
  'admin/removeAllowedUser',
  async ({ email }) => {
    await removeAllowedUser(email);
    return email; // Return email so reducer can remove it from state
  }
);

/**
 * Update an allowed user's role
 */
export const updateAllowedUserRoleAsync = createAsyncThunk<
  AllowedUser,
  { email: string; role: UserRole }
>('admin/updateAllowedUserRole', async ({ email, role }) => {
  const updatedUser = await updateAllowedUserRole(email, role);
  return updatedUser;
});
