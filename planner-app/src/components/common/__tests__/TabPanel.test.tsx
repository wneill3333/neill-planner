/**
 * TabPanel Component Tests
 *
 * Comprehensive tests for the TabPanel component.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TabPanel } from '../TabPanel';

// =============================================================================
// Rendering Tests
// =============================================================================

describe('TabPanel - Rendering', () => {
  it('should render when active', () => {
    render(
      <TabPanel tabId="test" isActive={true}>
        <div>Panel Content</div>
      </TabPanel>
    );

    expect(screen.getByTestId('test-panel')).toBeInTheDocument();
  });

  it('should not render when inactive', () => {
    render(
      <TabPanel tabId="test" isActive={false}>
        <div>Panel Content</div>
      </TabPanel>
    );

    expect(screen.queryByTestId('test-panel')).not.toBeInTheDocument();
  });

  it('should render children when active', () => {
    render(
      <TabPanel tabId="test" isActive={true}>
        <div>Panel Content</div>
      </TabPanel>
    );

    expect(screen.getByText('Panel Content')).toBeInTheDocument();
  });

  it('should not render children when inactive', () => {
    render(
      <TabPanel tabId="test" isActive={false}>
        <div>Panel Content</div>
      </TabPanel>
    );

    expect(screen.queryByText('Panel Content')).not.toBeInTheDocument();
  });

  it('should render with custom testId', () => {
    render(
      <TabPanel tabId="test" isActive={true} testId="custom-panel">
        <div>Panel Content</div>
      </TabPanel>
    );

    expect(screen.getByTestId('custom-panel')).toBeInTheDocument();
  });

  it('should apply custom className when active', () => {
    render(
      <TabPanel tabId="test" isActive={true} className="custom-class">
        <div>Panel Content</div>
      </TabPanel>
    );

    expect(screen.getByTestId('test-panel')).toHaveClass('custom-class');
  });

  it('should not render className when inactive', () => {
    render(
      <TabPanel tabId="test" isActive={false} className="custom-class">
        <div>Panel Content</div>
      </TabPanel>
    );

    expect(screen.queryByTestId('test-panel')).not.toBeInTheDocument();
  });
});

// =============================================================================
// Active/Inactive State Tests
// =============================================================================

describe('TabPanel - Active/Inactive State', () => {
  it('should show panel when becoming active', () => {
    const { rerender } = render(
      <TabPanel tabId="test" isActive={false}>
        <div>Panel Content</div>
      </TabPanel>
    );

    expect(screen.queryByTestId('test-panel')).not.toBeInTheDocument();

    rerender(
      <TabPanel tabId="test" isActive={true}>
        <div>Panel Content</div>
      </TabPanel>
    );

    expect(screen.getByTestId('test-panel')).toBeInTheDocument();
  });

  it('should hide panel when becoming inactive', () => {
    const { rerender } = render(
      <TabPanel tabId="test" isActive={true}>
        <div>Panel Content</div>
      </TabPanel>
    );

    expect(screen.getByTestId('test-panel')).toBeInTheDocument();

    rerender(
      <TabPanel tabId="test" isActive={false}>
        <div>Panel Content</div>
      </TabPanel>
    );

    expect(screen.queryByTestId('test-panel')).not.toBeInTheDocument();
  });

  it('should maintain content when staying active', () => {
    const { rerender } = render(
      <TabPanel tabId="test" isActive={true}>
        <div>Panel Content</div>
      </TabPanel>
    );

    expect(screen.getByText('Panel Content')).toBeInTheDocument();

    rerender(
      <TabPanel tabId="test" isActive={true}>
        <div>Panel Content</div>
      </TabPanel>
    );

    expect(screen.getByText('Panel Content')).toBeInTheDocument();
  });
});

// =============================================================================
// Accessibility Tests
// =============================================================================

describe('TabPanel - Accessibility', () => {
  it('should have tabpanel role when active', () => {
    render(
      <TabPanel tabId="test" isActive={true}>
        <div>Panel Content</div>
      </TabPanel>
    );

    expect(screen.getByRole('tabpanel')).toBeInTheDocument();
  });

  it('should have correct id attribute', () => {
    render(
      <TabPanel tabId="test" isActive={true}>
        <div>Panel Content</div>
      </TabPanel>
    );

    const panel = screen.getByTestId('test-panel');
    expect(panel).toHaveAttribute('id', 'test-panel');
  });

  it('should have aria-labelledby attribute', () => {
    render(
      <TabPanel tabId="test" isActive={true}>
        <div>Panel Content</div>
      </TabPanel>
    );

    const panel = screen.getByTestId('test-panel');
    expect(panel).toHaveAttribute('aria-labelledby', 'tab-test');
  });

  it('should connect to tab via aria-labelledby', () => {
    render(
      <TabPanel tabId="tasks" isActive={true}>
        <div>Tasks Content</div>
      </TabPanel>
    );

    const panel = screen.getByTestId('tasks-panel');
    expect(panel).toHaveAttribute('aria-labelledby', 'tab-tasks');
  });

  it('should have correct id format for panel', () => {
    render(
      <TabPanel tabId="calendar" isActive={true}>
        <div>Calendar Content</div>
      </TabPanel>
    );

    const panel = screen.getByTestId('calendar-panel');
    expect(panel).toHaveAttribute('id', 'calendar-panel');
  });
});

// =============================================================================
// Children Rendering Tests
// =============================================================================

describe('TabPanel - Children Rendering', () => {
  it('should render simple text children', () => {
    render(
      <TabPanel tabId="test" isActive={true}>
        Simple Text
      </TabPanel>
    );

    expect(screen.getByText('Simple Text')).toBeInTheDocument();
  });

  it('should render complex component children', () => {
    const ComplexComponent = () => (
      <div>
        <h1>Title</h1>
        <p>Paragraph</p>
        <button>Button</button>
      </div>
    );

    render(
      <TabPanel tabId="test" isActive={true}>
        <ComplexComponent />
      </TabPanel>
    );

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Paragraph')).toBeInTheDocument();
    expect(screen.getByText('Button')).toBeInTheDocument();
  });

  it('should render multiple children', () => {
    render(
      <TabPanel tabId="test" isActive={true}>
        <div>First Child</div>
        <div>Second Child</div>
        <div>Third Child</div>
      </TabPanel>
    );

    expect(screen.getByText('First Child')).toBeInTheDocument();
    expect(screen.getByText('Second Child')).toBeInTheDocument();
    expect(screen.getByText('Third Child')).toBeInTheDocument();
  });

  it('should render nested children', () => {
    render(
      <TabPanel tabId="test" isActive={true}>
        <div>
          <div>
            <span>Deeply Nested</span>
          </div>
        </div>
      </TabPanel>
    );

    expect(screen.getByText('Deeply Nested')).toBeInTheDocument();
  });

  it('should handle null children gracefully', () => {
    render(
      <TabPanel tabId="test" isActive={true}>
        {null}
      </TabPanel>
    );

    expect(screen.getByTestId('test-panel')).toBeInTheDocument();
  });

  it('should handle undefined children gracefully', () => {
    render(
      <TabPanel tabId="test" isActive={true}>
        {undefined}
      </TabPanel>
    );

    expect(screen.getByTestId('test-panel')).toBeInTheDocument();
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('TabPanel - Integration', () => {
  it('should work with multiple panels where only one is active', () => {
    const { container } = render(
      <div>
        <TabPanel tabId="tab1" isActive={true}>
          <div>Tab 1 Content</div>
        </TabPanel>
        <TabPanel tabId="tab2" isActive={false}>
          <div>Tab 2 Content</div>
        </TabPanel>
        <TabPanel tabId="tab3" isActive={false}>
          <div>Tab 3 Content</div>
        </TabPanel>
      </div>
    );

    expect(screen.getByText('Tab 1 Content')).toBeInTheDocument();
    expect(screen.queryByText('Tab 2 Content')).not.toBeInTheDocument();
    expect(screen.queryByText('Tab 3 Content')).not.toBeInTheDocument();

    const panels = container.querySelectorAll('[role="tabpanel"]');
    expect(panels).toHaveLength(1);
  });

  it('should switch active panel correctly', () => {
    const { rerender } = render(
      <div>
        <TabPanel tabId="tab1" isActive={true}>
          <div>Tab 1 Content</div>
        </TabPanel>
        <TabPanel tabId="tab2" isActive={false}>
          <div>Tab 2 Content</div>
        </TabPanel>
      </div>
    );

    expect(screen.getByText('Tab 1 Content')).toBeInTheDocument();
    expect(screen.queryByText('Tab 2 Content')).not.toBeInTheDocument();

    rerender(
      <div>
        <TabPanel tabId="tab1" isActive={false}>
          <div>Tab 1 Content</div>
        </TabPanel>
        <TabPanel tabId="tab2" isActive={true}>
          <div>Tab 2 Content</div>
        </TabPanel>
      </div>
    );

    expect(screen.queryByText('Tab 1 Content')).not.toBeInTheDocument();
    expect(screen.getByText('Tab 2 Content')).toBeInTheDocument();
  });
});

// =============================================================================
// Memoization Tests
// =============================================================================

describe('TabPanel - Memoization', () => {
  it('should not re-render inactive panel when props unchanged', () => {
    const { rerender } = render(
      <TabPanel tabId="test" isActive={false}>
        <div>Panel Content</div>
      </TabPanel>
    );

    expect(screen.queryByTestId('test-panel')).not.toBeInTheDocument();

    rerender(
      <TabPanel tabId="test" isActive={false}>
        <div>Panel Content</div>
      </TabPanel>
    );

    expect(screen.queryByTestId('test-panel')).not.toBeInTheDocument();
  });

  it('should re-render when isActive changes', () => {
    const { rerender } = render(
      <TabPanel tabId="test" isActive={false}>
        <div>Panel Content</div>
      </TabPanel>
    );

    expect(screen.queryByTestId('test-panel')).not.toBeInTheDocument();

    rerender(
      <TabPanel tabId="test" isActive={true}>
        <div>Panel Content</div>
      </TabPanel>
    );

    expect(screen.getByTestId('test-panel')).toBeInTheDocument();
  });

  it('should re-render active panel when children change', () => {
    const { rerender } = render(
      <TabPanel tabId="test" isActive={true}>
        <div>First Content</div>
      </TabPanel>
    );

    expect(screen.getByText('First Content')).toBeInTheDocument();

    rerender(
      <TabPanel tabId="test" isActive={true}>
        <div>Second Content</div>
      </TabPanel>
    );

    expect(screen.queryByText('First Content')).not.toBeInTheDocument();
    expect(screen.getByText('Second Content')).toBeInTheDocument();
  });
});

// =============================================================================
// Edge Cases
// =============================================================================

describe('TabPanel - Edge Cases', () => {
  it('should handle very long tabId', () => {
    const longId = 'a'.repeat(100);
    render(
      <TabPanel tabId={longId} isActive={true}>
        <div>Content</div>
      </TabPanel>
    );

    const panel = screen.getByText('Content').parentElement;
    expect(panel).toHaveAttribute('id', `${longId}-panel`);
  });

  it('should handle tabId with special characters', () => {
    render(
      <TabPanel tabId="tab-1_test" isActive={true}>
        <div>Content</div>
      </TabPanel>
    );

    const panel = screen.getByTestId('tab-1_test-panel');
    expect(panel).toHaveAttribute('id', 'tab-1_test-panel');
    expect(panel).toHaveAttribute('aria-labelledby', 'tab-tab-1_test');
  });

  it('should handle empty className', () => {
    render(
      <TabPanel tabId="test" isActive={true} className="">
        <div>Content</div>
      </TabPanel>
    );

    expect(screen.getByTestId('test-panel')).toBeInTheDocument();
  });

  it('should handle whitespace in className', () => {
    render(
      <TabPanel tabId="test" isActive={true} className="  class1   class2  ">
        <div>Content</div>
      </TabPanel>
    );

    const panel = screen.getByTestId('test-panel');
    expect(panel).toHaveClass('class1', 'class2');
  });

  it('should handle rapid active state changes', () => {
    const { rerender } = render(
      <TabPanel tabId="test" isActive={true}>
        <div>Content</div>
      </TabPanel>
    );

    for (let i = 0; i < 10; i++) {
      rerender(
        <TabPanel tabId="test" isActive={i % 2 === 0}>
          <div>Content</div>
        </TabPanel>
      );
    }

    // Last iteration is i=9, which is odd, so panel should be hidden
    expect(screen.queryByTestId('test-panel')).not.toBeInTheDocument();

    // Rerender one more time with even number to make it visible
    rerender(
      <TabPanel tabId="test" isActive={true}>
        <div>Content</div>
      </TabPanel>
    );
    expect(screen.getByTestId('test-panel')).toBeInTheDocument();
  });
});
