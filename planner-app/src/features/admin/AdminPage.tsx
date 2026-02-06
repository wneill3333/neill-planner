/**
 * AdminPage Component
 *
 * Admin panel for user management.
 * Allows admins to add/remove allowed users and manage roles.
 */

import { useState, useCallback, type FormEvent, type ChangeEvent } from 'react';
import { useAuth } from '../auth/useAuth';
import { useAllowedUsers } from './hooks';
import type { UserRole, AllowedUser } from '../../types';
import { USER_ROLE_LABELS } from '../../types';
import { AppLayout } from '../../components/layout/AppLayout';
import type { AppView } from '../../components/layout/Header';
import { Button } from '../../components/common/Button';

// =============================================================================
// Types
// =============================================================================

export interface AdminPageProps {
  /** Current active view */
  currentView?: AppView;
  /** Callback when navigation item is clicked */
  onNavigate?: (view: AppView) => void;
}

// =============================================================================
// Component
// =============================================================================

/**
 * AdminPage - User Management Panel
 *
 * Features:
 * - View all allowed users
 * - Add new users to whitelist
 * - Update user roles
 * - Remove users from whitelist
 * - Self-protection (can't demote/remove yourself)
 * - Last-admin protection (can't demote/remove last admin)
 */
export function AdminPage({ currentView = 'admin', onNavigate }: AdminPageProps) {
  const { user } = useAuth();
  const {
    allowedUsers,
    loading,
    saving,
    error,
    adminCount,
    addUser,
    removeUser,
    updateRole,
  } = useAllowedUsers();

  // Add user form state
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('standard');
  const [newUserDisplayName, setNewUserDisplayName] = useState('');
  const [addSuccess, setAddSuccess] = useState(false);

  // Handle add user form submit
  const handleAddUser = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      if (!newUserEmail.trim()) return;

      const success = await addUser({
        email: newUserEmail.trim(),
        role: newUserRole,
        displayName: newUserDisplayName.trim() || undefined,
      });

      if (success) {
        setNewUserEmail('');
        setNewUserRole('standard');
        setNewUserDisplayName('');
        setAddSuccess(true);
        setTimeout(() => setAddSuccess(false), 3000);
      }
    },
    [addUser, newUserEmail, newUserRole, newUserDisplayName]
  );

  // Handle role change
  const handleRoleChange = useCallback(
    async (email: string, newRole: UserRole) => {
      await updateRole(email, newRole);
    },
    [updateRole]
  );

  // Handle remove user
  const handleRemoveUser = useCallback(
    async (email: string) => {
      if (!window.confirm(`Are you sure you want to remove ${email} from allowed users?`)) {
        return;
      }

      await removeUser(email);
    },
    [removeUser]
  );

  // Check if user can be modified (not self, not last admin)
  const canModifyUser = useCallback(
    (allowedUser: AllowedUser): boolean => {
      // Can't modify yourself
      if (user?.email?.toLowerCase() === allowedUser.email.toLowerCase()) {
        return false;
      }

      // Can't demote/remove the last admin
      if (allowedUser.role === 'admin' && adminCount === 1) {
        return false;
      }

      return true;
    },
    [user, adminCount]
  );

  // Format date for display
  const formatDate = (date: Date | null): string => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <AppLayout currentView={currentView} onNavigate={onNavigate}>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="mt-4 text-gray-600">Loading users...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout currentView={currentView} onNavigate={onNavigate}>
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="mt-2 text-gray-600">Manage allowed users and access permissions</p>
        </div>

        {/* Add User Section */}
        <section className="mb-8 rounded-lg border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Add New User</h2>

          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  value={newUserEmail}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setNewUserEmail(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  placeholder="user@example.com"
                />
              </div>

              <div className="sm:col-span-1">
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                  Display Name
                </label>
                <input
                  type="text"
                  id="displayName"
                  value={newUserDisplayName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setNewUserDisplayName(e.target.value)
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  placeholder="Optional"
                />
              </div>

              <div className="sm:col-span-1">
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Role *
                </label>
                <select
                  id="role"
                  value={newUserRole}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setNewUserRole(e.target.value as UserRole)
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="standard">Standard User</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                {addSuccess && (
                  <span className="text-sm text-green-700 font-medium">User added successfully!</span>
                )}
              </div>
              <Button type="submit" variant="primary" disabled={saving || !newUserEmail.trim()}>
                {saving ? 'Adding...' : 'Add User'}
              </Button>
            </div>
          </form>
        </section>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Allowed Users Table */}
        <section className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-900">
              Allowed Users ({allowedUsers.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Email
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Display Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Role
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Last Login
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allowedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No users found. Add your first user above.
                    </td>
                  </tr>
                ) : (
                  allowedUsers.map((allowedUser) => {
                    const isCurrentUser = user?.email?.toLowerCase() === allowedUser.email.toLowerCase();
                    const canModify = canModifyUser(allowedUser);

                    return (
                      <tr key={allowedUser.email} className={isCurrentUser ? 'bg-amber-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">
                              {allowedUser.email}
                              {isCurrentUser && (
                                <span className="ml-2 text-xs text-amber-700 font-semibold">
                                  (You)
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {allowedUser.displayName || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={allowedUser.role}
                            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                              handleRoleChange(allowedUser.email, e.target.value as UserRole)
                            }
                            disabled={!canModify || saving}
                            className={`
                              text-sm rounded-md border px-2 py-1
                              ${allowedUser.role === 'admin' ? 'border-amber-300 bg-amber-100 text-amber-800' : 'border-gray-300 bg-gray-100 text-gray-800'}
                              ${canModify && !saving ? 'cursor-pointer hover:bg-opacity-80' : 'cursor-not-allowed opacity-60'}
                              focus:outline-none focus:ring-2 focus:ring-amber-500
                            `}
                            title={
                              !canModify
                                ? isCurrentUser
                                  ? "You can't change your own role"
                                  : "Can't demote the last administrator"
                                : undefined
                            }
                          >
                            <option value="standard">{USER_ROLE_LABELS.standard}</option>
                            <option value="admin">{USER_ROLE_LABELS.admin}</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(allowedUser.lastLoginAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <button
                            type="button"
                            onClick={() => handleRemoveUser(allowedUser.email)}
                            disabled={!canModify || saving}
                            className={`
                              text-red-600 hover:text-red-800 font-medium
                              ${!canModify || saving ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                            `}
                            title={
                              !canModify
                                ? isCurrentUser
                                  ? "You can't remove yourself"
                                  : "Can't remove the last administrator"
                                : 'Remove user from allowed list'
                            }
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Info Message */}
        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Only users on this list can sign in to Neill Planner. You cannot
            modify your own role or remove yourself. The last administrator cannot be demoted or
            removed.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
