/**
 * UserMenu Component
 *
 * Dropdown menu displaying user information and actions.
 * Triggered by clicking on the user avatar.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../features/auth';

// =============================================================================
// Types
// =============================================================================

export interface UserMenuProps {
  /** Optional className for styling */
  className?: string;
  /** Test ID for testing */
  testId?: string;
  /** Callback when settings is clicked */
  onSettingsClick?: () => void;
  /** Callback when admin panel is clicked (only passed for admin users) */
  onAdminClick?: () => void;
  /** Callback when manage recurring tasks is clicked */
  onManageRecurringClick?: () => void;
  /** Callback when manage recurring events is clicked */
  onManageRecurringEventsClick?: () => void;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get user initials from display name or email
 */
function getUserInitials(displayName: string | null, email: string | null): string {
  if (displayName) {
    const parts = displayName.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return displayName.substring(0, 2).toUpperCase();
  }

  if (email) {
    return email.substring(0, 2).toUpperCase();
  }

  return 'U';
}

// =============================================================================
// Component
// =============================================================================

/**
 * UserMenu - User dropdown menu component
 *
 * Features:
 * - User avatar with initials
 * - Dropdown menu with user info
 * - Settings link (placeholder)
 * - Sign out button
 * - Keyboard accessible
 * - Click outside to close
 *
 * @example
 * ```tsx
 * <UserMenu />
 * ```
 */
export function UserMenu({ className, testId, onSettingsClick, onAdminClick, onManageRecurringClick, onManageRecurringEventsClick }: UserMenuProps = {}) {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle escape key to close menu
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleSettingsClick = useCallback(() => {
    onSettingsClick?.();
    setIsOpen(false);
  }, [onSettingsClick]);

  const handleAdminClick = useCallback(() => {
    onAdminClick?.();
    setIsOpen(false);
  }, [onAdminClick]);

  const handleManageRecurringClick = useCallback(() => {
    onManageRecurringClick?.();
    setIsOpen(false);
  }, [onManageRecurringClick]);

  const handleManageRecurringEventsClick = useCallback(() => {
    onManageRecurringEventsClick?.();
    setIsOpen(false);
  }, [onManageRecurringEventsClick]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      setIsOpen(false);
    } catch (error) {
      console.error('Sign out error:', error);
      // Error is already handled by useAuth
    }
  }, [signOut]);

  if (!user) {
    return null;
  }

  const initials = getUserInitials(user.displayName, user.email);

  return (
    <div className={`relative ${className || ''}`} data-testid={testId || 'user-menu'}>
      {/* Avatar Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex items-center justify-center
          w-10 h-10 rounded-full
          bg-amber-500 hover:bg-amber-400
          text-white font-semibold text-sm
          focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-amber-700
          transition-colors duration-150
        "
        aria-label="User menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
        data-testid="user-menu-button"
      >
        {initials}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          className="
            absolute right-0 mt-2 w-64
            bg-white rounded-lg shadow-xl
            border border-gray-200
            z-50
            overflow-hidden
          "
          role="menu"
          aria-label="User menu options"
          data-testid="user-menu-dropdown"
        >
          {/* User Info Section */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 text-amber-700 font-semibold">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                {user.displayName && (
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.displayName}
                  </p>
                )}
                {user.email && (
                  <p className="text-xs text-gray-600 truncate">
                    {user.email}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {/* Settings */}
            <button
              type="button"
              onClick={handleSettingsClick}
              className="
                w-full px-4 py-2 text-left text-sm text-gray-700
                hover:bg-gray-100
                focus:outline-none focus:bg-gray-100
                transition-colors duration-150
              "
              role="menuitem"
              data-testid="settings-button"
            >
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Settings
              </div>
            </button>

            {/* Manage Recurring Tasks */}
            <button
              type="button"
              onClick={handleManageRecurringClick}
              className="
                w-full px-4 py-2 text-left text-sm text-gray-700
                hover:bg-gray-100
                focus:outline-none focus:bg-gray-100
                transition-colors duration-150
              "
              role="menuitem"
              data-testid="manage-recurring-button"
            >
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Manage Recurring Tasks
              </div>
            </button>

            {/* Manage Recurring Events */}
            <button
              type="button"
              onClick={handleManageRecurringEventsClick}
              className="
                w-full px-4 py-2 text-left text-sm text-gray-700
                hover:bg-gray-100
                focus:outline-none focus:bg-gray-100
                transition-colors duration-150
              "
              role="menuitem"
              data-testid="manage-recurring-events-button"
            >
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9"
                  />
                </svg>
                Manage Recurring Events
              </div>
            </button>

            {/* User Management (admin only) */}
            {onAdminClick && (
              <button
                type="button"
                onClick={handleAdminClick}
                className="
                  w-full px-4 py-2 text-left text-sm text-gray-700
                  hover:bg-gray-100
                  focus:outline-none focus:bg-gray-100
                  transition-colors duration-150
                "
                role="menuitem"
                data-testid="admin-button"
              >
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                    />
                  </svg>
                  User Management
                </div>
              </button>
            )}

            {/* Separator */}
            <div className="my-1 border-t border-gray-200" role="separator" />

            {/* Sign Out */}
            <button
              type="button"
              onClick={handleSignOut}
              className="
                w-full px-4 py-2 text-left text-sm text-red-700
                hover:bg-red-50
                focus:outline-none focus:bg-red-50
                transition-colors duration-150
              "
              role="menuitem"
              data-testid="sign-out-button"
            >
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Sign out
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserMenu;
