/**
 * Tabs Component Tests
 *
 * Comprehensive tests for the Tabs component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tabs, type Tab } from '../Tabs';

// =============================================================================
// Test Data
// =============================================================================

const mockTabs: Tab[] = [
  { id: 'tab1', label: 'First Tab' },
  { id: 'tab2', label: 'Second Tab' },
  { id: 'tab3', label: 'Third Tab' },
];

const mockTabsWithIcons: Tab[] = [
  { id: 'tasks', label: 'Tasks', icon: <span data-testid="icon-tasks">✓</span> },
  { id: 'calendar', label: 'Calendar', icon: <span data-testid="icon-calendar">📅</span> },
  { id: 'notes', label: 'Notes', icon: <span data-testid="icon-notes">📝</span> },
];

// =============================================================================
// Rendering Tests
// =============================================================================

describe('Tabs - Rendering', () => {
  it('should render tabs component', () => {
    const handleTabChange = vi.fn();
    render(<Tabs tabs={mockTabs} activeTabId="tab1" onTabChange={handleTabChange} />);

    expect(screen.getByTestId('tabs')).toBeInTheDocument();
  });

  it('should render with custom testId', () => {
    const handleTabChange = vi.fn();
    render(
      <Tabs
        tabs={mockTabs}
        activeTabId="tab1"
        onTabChange={handleTabChange}
        testId="custom-tabs"
      />
    );

    expect(screen.getByTestId('custom-tabs')).toBeInTheDocument();
  });

  it('should render all tab buttons', () => {
    const handleTabChange = vi.fn();
    render(<Tabs tabs={mockTabs} activeTabId="tab1" onTabChange={handleTabChange} />);

    expect(screen.getByTestId('tab-tab1')).toBeInTheDocument();
    expect(screen.getByTestId('tab-tab2')).toBeInTheDocument();
    expect(screen.getByTestId('tab-tab3')).toBeInTheDocument();
  });

  it('should render tab labels', () => {
    const handleTabChange = vi.fn();
    render(<Tabs tabs={mockTabs} activeTabId="tab1" onTabChange={handleTabChange} />);

    expect(screen.getByText('First Tab')).toBeInTheDocument();
    expect(screen.getByText('Second Tab')).toBeInTheDocument();
    expect(screen.getByText('Third Tab')).toBeInTheDocument();
  });

  it('should render tabs with icons', () => {
    const handleTabChange = vi.fn();
    render(<Tabs tabs={mockTabsWithIcons} activeTabId="tasks" onTabChange={handleTabChange} />);

    expect(screen.getByTestId('icon-tasks')).toBeInTheDocument();
    expect(screen.getByTestId('icon-calendar')).toBeInTheDocument();
    expect(screen.getByTestId('icon-notes')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const handleTabChange = vi.fn();
    render(
      <Tabs
        tabs={mockTabs}
        activeTabId="tab1"
        onTabChange={handleTabChange}
        className="custom-class"
      />
    );

    expect(screen.getByTestId('tabs')).toHaveClass('custom-class');
  });

  it('should render with custom aria-label', () => {
    const handleTabChange = vi.fn();
    render(
      <Tabs
        tabs={mockTabs}
        activeTabId="tab1"
        onTabChange={handleTabChange}
        ariaLabel="Custom tabs"
      />
    );

    expect(screen.getByRole('tablist', { name: 'Custom tabs' })).toBeInTheDocument();
  });
});

// =============================================================================
// Active Tab Tests
// =============================================================================

describe('Tabs - Active Tab', () => {
  it('should mark first tab as active', () => {
    const handleTabChange = vi.fn();
    render(<Tabs tabs={mockTabs} activeTabId="tab1" onTabChange={handleTabChange} />);

    expect(screen.getByTestId('tab-tab1')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('tab-tab2')).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByTestId('tab-tab3')).toHaveAttribute('aria-selected', 'false');
  });

  it('should mark second tab as active', () => {
    const handleTabChange = vi.fn();
    render(<Tabs tabs={mockTabs} activeTabId="tab2" onTabChange={handleTabChange} />);

    expect(screen.getByTestId('tab-tab1')).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByTestId('tab-tab2')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('tab-tab3')).toHaveAttribute('aria-selected', 'false');
  });

  it('should apply active styling to active tab', () => {
    const handleTabChange = vi.fn();
    render(<Tabs tabs={mockTabs} activeTabId="tab1" onTabChange={handleTabChange} />);

    const activeTab = screen.getByTestId('tab-tab1');
    expect(activeTab).toHaveClass('border-amber-500');
    expect(activeTab).toHaveClass('text-amber-700');
    expect(activeTab).toHaveClass('bg-amber-50');
  });

  it('should apply inactive styling to inactive tabs', () => {
    const handleTabChange = vi.fn();
    render(<Tabs tabs={mockTabs} activeTabId="tab1" onTabChange={handleTabChange} />);

    const inactiveTab = screen.getByTestId('tab-tab2');
    expect(inactiveTab).toHaveClass('border-transparent');
    expect(inactiveTab).toHaveClass('text-gray-600');
  });

  it('should update active tab when activeTabId prop changes', () => {
    const handleTabChange = vi.fn();
    const { rerender } = render(
      <Tabs tabs={mockTabs} activeTabId="tab1" onTabChange={handleTabChange} />
    );

    expect(screen.getByTestId('tab-tab1')).toHaveAttribute('aria-selected', 'true');

    rerender(<Tabs tabs={mockTabs} activeTabId="tab2" onTabChange={handleTabChange} />);

    expect(screen.getByTestId('tab-tab1')).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByTestId('tab-tab2')).toHaveAttribute('aria-selected', 'true');
  });
});

// =============================================================================
// Click Interaction Tests
// =============================================================================

describe('Tabs - Click Interaction', () => {
  it('should call onTabChange when tab clicked', () => {
    const handleTabChange = vi.fn();
    render(<Tabs tabs={mockTabs} activeTabId="tab1" onTabChange={handleTabChange} />);

    fireEvent.click(screen.getByTestId('tab-tab2'));

    expect(handleTabChange).toHaveBeenCalledTimes(1);
    expect(handleTabChange).toHaveBeenCalledWith('tab2');
  });

  it('should call onTabChange with correct tab ID', () => {
    const handleTabChange = vi.fn();
    render(<Tabs tabs={mockTabs} activeTabId="tab1" onTabChange={handleTabChange} />);

    fireEvent.click(screen.getByTestId('tab-tab3'));

    expect(handleTabChange).toHaveBeenCalledWith('tab3');
  });

  it('should allow clicking active tab', () => {
    const handleTabChange = vi.fn();
    render(<Tabs tabs={mockTabs} activeTabId="tab1" onTabChange={handleTabChange} />);

    fireEvent.click(screen.getByTestId('tab-tab1'));

    expect(handleTabChange).toHaveBeenCalledWith('tab1');
  });

  it('should handle rapid tab clicks', () => {
    const handleTabChange = vi.fn();
    render(<Tabs tabs={mockTabs} activeTabId="tab1" onTabChange={handleTabChange} />);

    fireEvent.click(screen.getByTestId('tab-tab2'));
    fireEvent.click(screen.getByTestId('tab-tab3'));
    fireEvent.click(screen.getByTestId('tab-tab1'));

    expect(handleTabChange).toHaveBeenCalledTimes(3);
  });
});

// =============================================================================
// Keyboard Navigation Tests
// =============================================================================

describe('Tabs - Keyboard Navigation', () => {
  it('should navigate to next tab with ArrowRight', () => {
    const handleTabChange = vi.fn();
    render(<Tabs tabs={mockTabs} activeTabId="tab1" onTabChange={handleTabChange} />);

    const firstTab = screen.getByTestId('tab-tab1');
    firstTab.focus();
    fireEvent.keyDown(firstTab, { key: 'ArrowRight' });

    expect(handleTabChange).toHaveBeenCalledWith('tab2');
  });

  it('should navigate to previous tab with ArrowLeft', () => {
    const handleTabChange = vi.fn();
    render(<Tabs tabs={mockTabs} activeTabId="tab2" onTabChange={handleTabChange} />);

    const secondTab = screen.getByTestId('tab-tab2');
    secondTab.focus();
    fireEvent.keyDown(secondTab, { key: 'ArrowLeft' });

    expect(handleTabChange).toHaveBeenCalledWith('tab1');
  });

  it('should wrap to first tab when ArrowRight at last tab', () => {
    const handleTabChange = vi.fn();
    render(<Tabs tabs={mockTabs} activeTabId="tab3" onTabChange={handleTabChange} />);

    const lastTab = screen.getByTestId('tab-tab3');
    lastTab.focus();
    fireEvent.keyDown(lastTab, { key: 'ArrowRight' });

    expect(handleTabChange).toHaveBeenCalledWith('tab1');
  });

  it('should wrap to last tab when ArrowLeft at first tab', () => {
    const handleTabChange = vi.fn();
    render(<Tabs tabs={mockTabs} activeTabId="tab1" onTabChange={handleTabChange} />);

    const firstTab = screen.getByTestId('tab-tab1');
    firstTab.focus();
    fireEvent.keyDown(firstTab, { key: 'ArrowLeft' });

    expect(handleTabChange).toHaveBeenCalledWith('tab3');
  });

  it('should not change tab on other keys', () => {
    const handleTabChange = vi.fn();
    render(<Tabs tabs={mockTabs} activeTabId="tab1" onTabChange={handleTabChange} />);

    const firstTab = screen.getByTestId('tab-tab1');
    firstTab.focus();
    fireEvent.keyDown(firstTab, { key: 'Enter' });
    fireEvent.keyDown(firstTab, { key: 'Space' });
    fireEvent.keyDown(firstTab, { key: 'Tab' });

    expect(handleTabChange).not.toHaveBeenCalled();
  });

  it('should prevent default on ArrowRight', () => {
    const handleTabChange = vi.fn();
    render(<Tabs tabs={mockTabs} activeTabId="tab1" onTabChange={handleTabChange} />);

    const firstTab = screen.getByTestId('tab-tab1');
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    firstTab.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should prevent default on ArrowLeft', () => {
    const handleTabChange = vi.fn();
    render(<Tabs tabs={mockTabs} activeTabId="tab1" onTabChange={handleTabChange} />);

    const firstTab = screen.getByTestId('tab-tab1');
    const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    firstTab.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });
});

// =============================================================================
// Accessibility Tests
// =============================================================================

describe('Tabs - Accessibility', () => {
  it('should have tablist role', () => {
    const handleTabChange = vi.fn();
    render(<Tabs tabs={mockTabs} activeTabId="tab1" onTabChange={handleTabChange} />);

    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('should have default aria-label', () => {
    const handleTabChange = vi.fn();
    render(<Tabs tabs={mockTabs} activeTabId="tab1" onTabChange={handleTabChange} />);

    expect(screen.getByRole('tablist', { name: 'Tabs' })).toBeInTheDocument();
  });

  it('should have tab role on all tabs', () => {
    const handleTabChange = vi.fn();
    render(<Tabs tabs={mockTabs} activeTabId="tab1" onTabChange={handleTabChange} />);

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
  });

  it('should have type="button" on all tabs', () => {
    const handleTabChange = vi.fn();
    render(<Tabs tabs={mockTabs} activeTabId="tab1" onTabChange={handleTabChange} />);

    expect(screen.getByTestId('tab-tab1')).toHaveAttribute('type', 'button');
    expect(screen.getByTestId('tab-tab2')).toHaveAttribute('type', 'button');
    expect(screen.getByTestId('tab-tab3')).toHaveAttribute('type', 'button');
  });

  it('should have id attributes on tabs', () => {
    const handleTabChange = vi.fn();
    render(<Tabs tabs={mockTabs} activeTabId="tab1" onTabChange={handleTabChange} />);

    expect(screen.getByTestId('tab-tab1')).toHaveAttribute('id', 'tab-tab1');
    expect(screen.getByTestId('tab-tab2')).toHaveAttribute('id', 'tab-tab2');
    expect(screen.getByTestId('tab-tab3')).toHaveAttribute('id', 'tab-tab3');
  });

  it('should have aria-controls on tabs', () => {
    const handleTabChange = vi.fn();
    render(<Tabs tabs={mockTabs} activeTabId="tab1" onTabChange={handleTabChange} />);

    expect(screen.getByTestId('tab-tab1')).toHaveAttribute('aria-controls', 'tab1-panel');
    expect(screen.getByTestId('tab-tab2')).toHaveAttribute('aria-controls', 'tab2-panel');
    expect(screen.getByTestId('tab-tab3')).toHaveAttribute('aria-controls', 'tab3-panel');
  });

  it('should have focus styles', () => {
    const handleTabChange = vi.fn();
    render(<Tabs tabs={mockTabs} activeTabId="tab1" onTabChange={handleTabChange} />);

    const firstTab = screen.getByTestId('tab-tab1');
    expect(firstTab).toHaveClass('focus:outline-none');
    expect(firstTab).toHaveClass('focus:ring-2');
    expect(firstTab).toHaveClass('focus:ring-amber-500');
  });

  it('should have aria-hidden on icon spans', () => {
    const handleTabChange = vi.fn();
    const { container } = render(
      <Tabs tabs={mockTabsWithIcons} activeTabId="tasks" onTabChange={handleTabChange} />
    );

    const iconSpans = container.querySelectorAll('span[aria-hidden="true"]');
    expect(iconSpans.length).toBe(3); // One for each icon wrapper
  });
});

// =============================================================================
// Memoization Tests
// =============================================================================

describe('Tabs - Memoization', () => {
  it('should not re-render when props unchanged', () => {
    const handleTabChange = vi.fn();
    const { rerender } = render(
      <Tabs tabs={mockTabs} activeTabId="tab1" onTabChange={handleTabChange} />
    );

    const firstRenderElement = screen.getByTestId('tabs');

    rerender(<Tabs tabs={mockTabs} activeTabId="tab1" onTabChange={handleTabChange} />);

    const secondRenderElement = screen.getByTestId('tabs');

    expect(firstRenderElement).toBe(secondRenderElement);
  });

  it('should re-render when activeTabId changes', () => {
    const handleTabChange = vi.fn();
    const { rerender } = render(
      <Tabs tabs={mockTabs} activeTabId="tab1" onTabChange={handleTabChange} />
    );

    expect(screen.getByTestId('tab-tab1')).toHaveAttribute('aria-selected', 'true');

    rerender(<Tabs tabs={mockTabs} activeTabId="tab2" onTabChange={handleTabChange} />);

    expect(screen.getByTestId('tab-tab2')).toHaveAttribute('aria-selected', 'true');
  });
});

// =============================================================================
// Edge Cases
// =============================================================================

describe('Tabs - Edge Cases', () => {
  it('should handle single tab', () => {
    const handleTabChange = vi.fn();
    const singleTab: Tab[] = [{ id: 'only', label: 'Only Tab' }];
    render(<Tabs tabs={singleTab} activeTabId="only" onTabChange={handleTabChange} />);

    expect(screen.getByTestId('tab-only')).toBeInTheDocument();
    expect(screen.getByTestId('tab-only')).toHaveAttribute('aria-selected', 'true');
  });

  it('should wrap correctly with single tab on ArrowRight', () => {
    const handleTabChange = vi.fn();
    const singleTab: Tab[] = [{ id: 'only', label: 'Only Tab' }];
    render(<Tabs tabs={singleTab} activeTabId="only" onTabChange={handleTabChange} />);

    const tab = screen.getByTestId('tab-only');
    fireEvent.keyDown(tab, { key: 'ArrowRight' });

    expect(handleTabChange).toHaveBeenCalledWith('only');
  });

  it('should handle many tabs', () => {
    const handleTabChange = vi.fn();
    const manyTabs: Tab[] = Array.from({ length: 10 }, (_, i) => ({
      id: `tab${i}`,
      label: `Tab ${i}`,
    }));

    render(<Tabs tabs={manyTabs} activeTabId="tab0" onTabChange={handleTabChange} />);

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(10);
  });

  it('should handle tabs with empty labels', () => {
    const handleTabChange = vi.fn();
    const tabsWithEmptyLabel: Tab[] = [
      { id: 'tab1', label: '' },
      { id: 'tab2', label: 'Tab 2' },
    ];

    render(<Tabs tabs={tabsWithEmptyLabel} activeTabId="tab1" onTabChange={handleTabChange} />);

    expect(screen.getByTestId('tab-tab1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
  });

  it('should handle tabs with special characters in IDs', () => {
    const handleTabChange = vi.fn();
    const specialTabs: Tab[] = [
      { id: 'tab-one', label: 'Tab One' },
      { id: 'tab_two', label: 'Tab Two' },
    ];

    render(<Tabs tabs={specialTabs} activeTabId="tab-one" onTabChange={handleTabChange} />);

    expect(screen.getByTestId('tab-tab-one')).toBeInTheDocument();
    expect(screen.getByTestId('tab-tab_two')).toBeInTheDocument();
  });
});
