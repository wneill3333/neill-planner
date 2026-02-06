/**
 * Admin Hooks
 *
 * Custom hooks for admin/whitelist functionality.
 * Provides data fetching and operations for managing allowed users.
 */

import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useAuth } from '../auth/useAuth';
import {
  selectAllowedUsers,
  selectAdminLoading,
  selectAdminSaving,
  selectAdminError,
  selectAdminCount,
  clearAdminError,
} from './adminSlice';
import {
  fetchAllowedUsers,
  addAllowedUserAsync,
  removeAllowedUserAsync,
  updateAllowedUserRoleAsync,
} from './adminThunks';
import type { AllowedUser, AddAllowedUserInput, UserRole } from '../../types';

// =============================================================================
// Types
// =============================================================================

export interface UseAllowedUsersResult {
  /** List of all allowed users */
  allowedUsers: AllowedUser[];
  /** Whether the list is loading */
  loading: boolean;
  /** Whether a mutation is in progress */
  saving: boolean;
  /** Error message if any */
  error: string | null;
  /** Number of admin users */
  adminCount: number;
  /** Add a new user to the whitelist */
  addUser: (input: AddAllowedUserInput) => Promise<boolean>;
  /** Remove a user from the whitelist */
  removeUser: (email: string) => Promise<boolean>;
  /** Change a user's role */
  updateRole: (email: string, role: UserRole) => Promise<boolean>;
  /** Clear any error messages */
  clearError: () => void;
  /** Refetch the allowed users list */
  refetch: () => void;
}

// =============================================================================
// useAllowedUsers Hook
// =============================================================================

/**
 * Hook for managing the allowed users whitelist.
 *
 * Fetches allowed users on mount and provides CRUD operations.
 * Must be used by an admin user.
 *
 * @example
 * ```tsx
 * const { allowedUsers, addUser, removeUser, updateRole } = useAllowedUsers();
 *
 * // Add a new user
 * const success = await addUser({ email: 'new@example.com', role: 'standard' });
 *
 * // Change role
 * await updateRole('user@example.com', 'admin');
 *
 * // Remove user
 * await removeUser('user@example.com');
 * ```
 */
export function useAllowedUsers(): UseAllowedUsersResult {
  const dispatch = useAppDispatch();
  const { user } = useAuth();

  const allowedUsers = useAppSelector(selectAllowedUsers);
  const loading = useAppSelector(selectAdminLoading);
  const saving = useAppSelector(selectAdminSaving);
  const error = useAppSelector(selectAdminError);
  const adminCount = useAppSelector(selectAdminCount);

  // Fetch on mount
  useEffect(() => {
    dispatch(fetchAllowedUsers());
  }, [dispatch]);

  const addUser = useCallback(
    async (input: AddAllowedUserInput): Promise<boolean> => {
      if (!user) return false;
      const result = await dispatch(addAllowedUserAsync({ input, userId: user.id }));
      return addAllowedUserAsync.fulfilled.match(result);
    },
    [dispatch, user]
  );

  const removeUser = useCallback(
    async (email: string): Promise<boolean> => {
      const result = await dispatch(removeAllowedUserAsync({ email }));
      return removeAllowedUserAsync.fulfilled.match(result);
    },
    [dispatch]
  );

  const updateRole = useCallback(
    async (email: string, role: UserRole): Promise<boolean> => {
      const result = await dispatch(updateAllowedUserRoleAsync({ email, role }));
      return updateAllowedUserRoleAsync.fulfilled.match(result);
    },
    [dispatch]
  );

  const clearError = useCallback(() => {
    dispatch(clearAdminError());
  }, [dispatch]);

  const refetch = useCallback(() => {
    dispatch(fetchAllowedUsers());
  }, [dispatch]);

  return {
    allowedUsers,
    loading,
    saving,
    error,
    adminCount,
    addUser,
    removeUser,
    updateRole,
    clearError,
    refetch,
  };
}
