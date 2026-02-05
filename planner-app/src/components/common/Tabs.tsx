/**
 * Tabs Component
 *
 * A reusable tab navigation component with keyboard accessibility.
 *
 * Features:
 * - Horizontal tab bar with customizable tabs
 * - Active tab highlighted with amber theme
 * - Click to switch tabs
 * - Keyboard accessible (Arrow Left/Right to navigate)
 * - Automatic focus management
 * - Support for icons in tabs
 *
 * Accessibility:
 * - ARIA tablist/tab pattern
 * - Keyboard navigation with arrow keys
 * - Focus management and indicators
 */

import { memo, useCallback, useRef, type KeyboardEvent, type ReactNode } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface Tab {
  /** Unique identifier for the tab */
  id: string;
  /** Display label for the tab */
  label: string;
  /** Optional icon component to display before label */
  icon?: ReactNode;
}

export interface TabsProps {
  /** Array of tab definitions */
  tabs: Tab[];
  /** Currently active tab ID */
  activeTabId: string;
  /** Callback when tab changes */
  onTabChange: (tabId: string) => void;
  /** Optional className for styling */
  className?: string;
  /** Test ID for testing */
  testId?: string;
  /** ARIA label for the tablist */
  ariaLabel?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Tabs - Horizontal tab navigation component
 *
 * @param props - TabsProps
 * @returns JSX element representing tab navigation
 *
 * @example
 * ```tsx
 * const tabs = [
 *   { id: 'tasks', label: 'Tasks', icon: <CheckIcon /> },
 *   { id: 'calendar', label: 'Calendar', icon: <CalendarIcon /> }
 * ];
 *
 * <Tabs
 *   tabs={tabs}
 *   activeTabId="tasks"
 *   onTabChange={(id) => setActiveTab(id)}
 * />
 * ```
 */
function TabsComponent({
  tabs,
  activeTabId,
  onTabChange,
  className = '',
  testId = 'tabs',
  ariaLabel = 'Tabs',
}: TabsProps) {
  // Refs for tab buttons to manage focus
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  /**
   * Handle keyboard navigation for tabs (Arrow Left/Right)
   */
  const handleTabKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, currentTabId: string) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') {
        return;
      }

      event.preventDefault();

      const currentIndex = tabs.findIndex((tab) => tab.id === currentTabId);
      let nextIndex: number;

      if (event.key === 'ArrowRight') {
        // Move to next tab, wrap to first if at end
        nextIndex = (currentIndex + 1) % tabs.length;
      } else {
        // Move to previous tab, wrap to last if at beginning
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      }

      const nextTab = tabs[nextIndex];
      onTabChange(nextTab.id);

      // Focus the next tab button
      tabRefs.current[nextTab.id]?.focus();
    },
    [tabs, onTabChange]
  );

  return (
    <div
      className={`flex border-b border-gray-200 ${className}`}
      role="tablist"
      aria-label={ariaLabel}
      data-testid={testId}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;

        return (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            ref={(el) => (tabRefs.current[tab.id] = el)}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`${tab.id}-panel`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onTabChange(tab.id)}
            onKeyDown={(e) => handleTabKeyDown(e, tab.id)}
            className={`
              flex-1 px-4 py-3 text-sm font-medium
              border-b-2 transition-colors duration-150
              focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
              ${
                isActive
                  ? 'border-amber-500 text-amber-700 bg-amber-50'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }
            `}
            data-testid={`tab-${tab.id}`}
          >
            <span className="flex items-center justify-center gap-2">
              {tab.icon && <span aria-hidden="true">{tab.icon}</span>}
              <span>{tab.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Custom comparison function for React.memo
 */
function arePropsEqual(prevProps: TabsProps, nextProps: TabsProps): boolean {
  return (
    prevProps.activeTabId === nextProps.activeTabId &&
    prevProps.tabs === nextProps.tabs &&
    prevProps.className === nextProps.className &&
    prevProps.testId === nextProps.testId &&
    prevProps.ariaLabel === nextProps.ariaLabel
  );
}

// Export memoized component
export const Tabs = memo(TabsComponent, arePropsEqual);

export default Tabs;
