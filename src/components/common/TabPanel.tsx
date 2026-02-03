/**
 * TabPanel Component
 *
 * A reusable tab panel component for displaying tab content.
 *
 * Features:
 * - Only renders children when active
 * - Proper ARIA attributes for accessibility
 * - Associates with corresponding tab via aria-labelledby
 *
 * Accessibility:
 * - ARIA tabpanel pattern
 * - Connected to tab via aria-labelledby
 */

import { memo, type ReactNode } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface TabPanelProps {
  /** Tab ID this panel is associated with */
  tabId: string;
  /** Whether this panel is currently active */
  isActive: boolean;
  /** Content to display when active */
  children: ReactNode;
  /** Optional className for styling */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * TabPanel - Container for tab content
 *
 * @param props - TabPanelProps
 * @returns JSX element representing tab panel, or null if inactive
 *
 * @example
 * ```tsx
 * <TabPanel tabId="tasks" isActive={activeTab === 'tasks'}>
 *   <TaskList />
 * </TabPanel>
 * ```
 */
function TabPanelComponent({
  tabId,
  isActive,
  children,
  className = '',
  testId,
}: TabPanelProps) {
  // Don't render inactive panels
  if (!isActive) {
    return null;
  }

  return (
    <div
      id={`${tabId}-panel`}
      role="tabpanel"
      aria-labelledby={`tab-${tabId}`}
      tabIndex={0}
      className={className}
      data-testid={testId || `${tabId}-panel`}
    >
      {children}
    </div>
  );
}

/**
 * Custom comparison function for React.memo
 */
function arePropsEqual(prevProps: TabPanelProps, nextProps: TabPanelProps): boolean {
  // If active state changed, re-render
  if (prevProps.isActive !== nextProps.isActive) {
    return false;
  }

  // If not active, don't need to check children
  if (!nextProps.isActive) {
    return true;
  }

  // If active, check other props
  return (
    prevProps.tabId === nextProps.tabId &&
    prevProps.children === nextProps.children &&
    prevProps.className === nextProps.className &&
    prevProps.testId === nextProps.testId
  );
}

// Export memoized component
export const TabPanel = memo(TabPanelComponent, arePropsEqual);

export default TabPanel;
