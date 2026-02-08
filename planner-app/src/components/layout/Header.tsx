/**
 * Header Component
 *
 * Application header with branding and user menu.
 * Includes hamburger menu for navigation.
 */

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../features/auth';
import { UserMenu } from './UserMenu';
import { SyncStatusIndicator } from '../common/SyncStatusIndicator';
import { SearchBar } from '../common/SearchBar';
import { SearchResults } from '../common/SearchResults';
import { RecurringTasksManager } from '../tasks/RecurringTasksManager';
import { RecurringEventsManager } from '../events/RecurringEventsManager';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectSearchQuery,
  selectSearchResults,
  selectIsSearching,
  setQuery,
  clearSearch,
} from '../../features/search/searchSlice';
import { searchAll } from '../../features/search/searchThunks';
import type { Task, Event, Note } from '../../types';

// =============================================================================
// Types
// =============================================================================

export type AppView = 'tasks' | 'categories' | 'settings' | 'admin';

export interface HeaderProps {
  /** Current active view */
  currentView?: AppView;
  /** Callback when navigation item is clicked */
  onNavigate?: (view: AppView) => void;
  /** Optional className for styling */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Header - Application header component
 *
 * Features:
 * - App logo and title
 * - Hamburger menu button (mobile navigation - placeholder)
 * - User menu on the right
 * - Responsive design
 * - Red/brown theme styling
 *
 * @example
 * ```tsx
 * <Header />
 * ```
 */
export function Header({ currentView = 'tasks', onNavigate, className, testId }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isRecurringManagerOpen, setIsRecurringManagerOpen] = useState(false);
  const [isRecurringEventsManagerOpen, setIsRecurringEventsManagerOpen] = useState(false);
  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();

  // Search state from Redux
  const query = useAppSelector(selectSearchQuery);
  const results = useAppSelector(selectSearchResults);
  const isSearching = useAppSelector(selectIsSearching);

  const handleNavigate = (view: AppView) => {
    onNavigate?.(view);
    setIsMobileMenuOpen(false);
  };

  const { user: authUser } = useAuth();

  const handleSettingsClick = () => {
    handleNavigate('settings');
  };

  const handleAdminClick = () => {
    handleNavigate('admin');
  };

  const handleManageRecurringClick = () => {
    setIsRecurringManagerOpen(true);
  };

  const handleManageRecurringEventsClick = () => {
    setIsRecurringEventsManagerOpen(true);
  };

  // Handle search query change
  const handleSearchChange = (newQuery: string) => {
    dispatch(setQuery(newQuery));

    // Trigger search if query is not empty
    if (newQuery.trim()) {
      dispatch(searchAll({ query: newQuery }));
    }

    // Show/hide results panel
    setIsSearchOpen(newQuery.trim().length > 0);
  };

  // Handle search clear
  const handleSearchClear = () => {
    dispatch(clearSearch());
    setIsSearchOpen(false);
  };

  // Handle click on search result
  const handleTaskClick = (_task: Task) => {
    // Clear search and close results
    dispatch(clearSearch());
    setIsSearchOpen(false);
    // Navigation functionality can be implemented when routing is added
  };

  const handleEventClick = (_event: Event) => {
    // Clear search and close results
    dispatch(clearSearch());
    setIsSearchOpen(false);
    // Navigation functionality can be implemented when routing is added
  };

  const handleNoteClick = (_note: Note) => {
    // Clear search and close results
    dispatch(clearSearch());
    setIsSearchOpen(false);
    // Navigation functionality can be implemented when routing is added
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isOutsideDesktop = !desktopSearchRef.current?.contains(target);
      const isOutsideMobile = !mobileSearchRef.current?.contains(target);

      if (isOutsideDesktop && isOutsideMobile) {
        setIsSearchOpen(false);
      }
    };

    if (isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isSearchOpen]);

  // Close search results on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

  return (
    <header
      className={`shadow-lg bg-gradient-to-r from-red-900 to-red-700 ${className || ''}`}
      role="banner"
      data-testid={testId || 'header'}
    >
      <div className="max-w-4xl px-4 py-4 mx-auto sm:py-6">
        <div className="flex items-center justify-between">
          {/* Left side: Hamburger + Title */}
          <div className="flex items-center gap-3">
            {/* Hamburger menu button - visible on all screen sizes */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="
                p-2 text-white rounded-md
                hover:bg-red-600
                focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-red-900
                transition-colors duration-150
              "
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              data-testid="hamburger-menu-button"
            >
              {/* Hamburger icon */}
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                {isMobileMenuOpen ? (
                  // X icon when menu is open
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  // Hamburger icon when menu is closed
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>

            {/* App Title and Subtitle */}
            <div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                Neill Planner
              </h1>
              <p className="mt-1 text-sm text-red-100 sm:text-base">
                What matters most
              </p>
            </div>
          </div>

          {/* Center: Search Bar (Desktop) */}
          <div className="hidden md:block flex-1 max-w-md mx-4" ref={desktopSearchRef}>
            <SearchBar
              value={query}
              onChange={handleSearchChange}
              onClear={handleSearchClear}
              placeholder="Search tasks, events, notes, journals..."
              isSearching={isSearching}
            />
            {isSearchOpen && (
              <SearchResults
                query={query}
                tasks={results.tasks}
                events={results.events}
                notes={results.notes}
                journals={results.journals}
                isSearching={isSearching}
                onTaskClick={handleTaskClick}
                onEventClick={handleEventClick}
                onNoteClick={handleNoteClick}
                onClose={() => setIsSearchOpen(false)}
              />
            )}
          </div>

          {/* Right side: Sync Status + User Menu */}
          <div className="flex items-center gap-3">
            <SyncStatusIndicator />
            <UserMenu
              onSettingsClick={handleSettingsClick}
              onAdminClick={authUser?.role === 'admin' ? handleAdminClick : undefined}
              onManageRecurringClick={handleManageRecurringClick}
              onManageRecurringEventsClick={handleManageRecurringEventsClick}
            />
          </div>
        </div>

        {/* Hamburger menu with search and navigation */}
        {isMobileMenuOpen && (
          <div
            id="mobile-menu"
            className="pt-4 mt-4 border-t border-red-500"
            data-testid="mobile-menu"
          >
            {/* Search in hamburger menu (hidden on desktop where it's already visible) */}
            <div className="mb-4 md:hidden" ref={mobileSearchRef}>
              <SearchBar
                value={query}
                onChange={handleSearchChange}
                onClear={handleSearchClear}
                placeholder="Search tasks, events, notes, journals..."
                isSearching={isSearching}
              />
              {isSearchOpen && (
                <SearchResults
                  query={query}
                  tasks={results.tasks}
                  events={results.events}
                  notes={results.notes}
                  isSearching={isSearching}
                  onTaskClick={handleTaskClick}
                  onEventClick={handleEventClick}
                  onNoteClick={handleNoteClick}
                  onClose={() => setIsSearchOpen(false)}
                />
              )}
            </div>

            {/* Navigation */}
            <nav aria-label="Main navigation">
              <ul className="space-y-2">
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigate('tasks')}
                    className={`
                      w-full text-left px-3 py-2 rounded-md text-white
                      transition-colors duration-150
                      ${currentView === 'tasks' ? 'bg-red-600 font-medium' : 'hover:bg-red-600'}
                    `}
                    aria-current={currentView === 'tasks' ? 'page' : undefined}
                  >
                    Tasks
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigate('categories')}
                    className={`
                      w-full text-left px-3 py-2 rounded-md text-white
                      transition-colors duration-150
                      ${currentView === 'categories' ? 'bg-red-600 font-medium' : 'hover:bg-red-600'}
                    `}
                    aria-current={currentView === 'categories' ? 'page' : undefined}
                  >
                    Categories
                  </button>
                </li>
                {authUser?.role === 'admin' && (
                  <li>
                    <button
                      type="button"
                      onClick={() => handleNavigate('admin')}
                      className={`
                        w-full text-left px-3 py-2 rounded-md text-white
                        transition-colors duration-150
                        ${currentView === 'admin' ? 'bg-red-600 font-medium' : 'hover:bg-red-600'}
                      `}
                      aria-current={currentView === 'admin' ? 'page' : undefined}
                    >
                      User Management
                    </button>
                  </li>
                )}
              </ul>
            </nav>
          </div>
        )}
      </div>

      {/* Recurring Tasks Manager Modal */}
      <RecurringTasksManager
        isOpen={isRecurringManagerOpen}
        onClose={() => setIsRecurringManagerOpen(false)}
      />

      {/* Recurring Events Manager Modal */}
      <RecurringEventsManager
        isOpen={isRecurringEventsManagerOpen}
        onClose={() => setIsRecurringEventsManagerOpen(false)}
      />
    </header>
  );
}

export default Header;
