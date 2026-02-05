/**
 * Tests for SearchBar component
 *
 * Tests search input with debouncing, clear button, and keyboard accessibility.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from '../SearchBar';

// =============================================================================
// Tests - Rendering
// =============================================================================

describe('SearchBar - Rendering', () => {
  it('should render with default props', () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);

    const input = screen.getByTestId('search-input');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'Search...');
  });

  it('should render with custom placeholder', () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} placeholder="Custom placeholder" />);

    const input = screen.getByTestId('search-input');
    expect(input).toHaveAttribute('placeholder', 'Custom placeholder');
  });

  it('should display search icon by default', () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);

    // Search icon should be present (svg with path containing search icon d attribute)
    const searchIcon = document.querySelector('svg[stroke="currentColor"]');
    expect(searchIcon).toBeInTheDocument();
  });

  it('should display loading spinner when isSearching is true', () => {
    const onChange = vi.fn();
    render(<SearchBar value="test" onChange={onChange} isSearching={true} />);

    // Spinner should be present (svg with animate-spin class)
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should display value in input', () => {
    const onChange = vi.fn();
    render(<SearchBar value="test query" onChange={onChange} />);

    const input = screen.getByTestId('search-input') as HTMLInputElement;
    expect(input.value).toBe('test query');
  });

  it('should display clear button when value is present', () => {
    const onChange = vi.fn();
    render(<SearchBar value="test" onChange={onChange} />);

    const clearButton = screen.getByTestId('search-clear-button');
    expect(clearButton).toBeInTheDocument();
  });

  it('should not display clear button when value is empty', () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);

    const clearButton = screen.queryByTestId('search-clear-button');
    expect(clearButton).not.toBeInTheDocument();
  });
});

// =============================================================================
// Tests - Input Change and Debouncing
// =============================================================================

describe('SearchBar - Input Change', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should update local input value immediately', () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);

    const input = screen.getByTestId('search-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'test' } });

    expect(input.value).toBe('test');
  });

  it('should debounce onChange callback', () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} debounceMs={300} />);

    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: 'test' } });

    // onChange should not be called immediately
    expect(onChange).not.toHaveBeenCalled();

    // Fast-forward time by 300ms
    vi.advanceTimersByTime(300);

    // Now onChange should be called
    expect(onChange).toHaveBeenCalledWith('test');
  });

  it('should reset debounce timer on each keystroke', () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} debounceMs={300} />);

    const input = screen.getByTestId('search-input');

    // Type 't'
    fireEvent.change(input, { target: { value: 't' } });
    vi.advanceTimersByTime(100);

    // Type 'e'
    fireEvent.change(input, { target: { value: 'te' } });
    vi.advanceTimersByTime(100);

    // Type 's'
    fireEvent.change(input, { target: { value: 'tes' } });
    vi.advanceTimersByTime(100);

    // onChange should not be called yet (only 100ms after last keystroke)
    expect(onChange).not.toHaveBeenCalled();

    // Type 't'
    fireEvent.change(input, { target: { value: 'test' } });

    // Fast-forward 300ms from last keystroke
    vi.advanceTimersByTime(300);

    // Now onChange should be called with full text
    expect(onChange).toHaveBeenCalledWith('test');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('should use custom debounce delay', () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} debounceMs={500} />);

    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: 'test' } });

    // Should not be called after 300ms
    vi.advanceTimersByTime(300);
    expect(onChange).not.toHaveBeenCalled();

    // Should be called after 500ms
    vi.advanceTimersByTime(200);
    expect(onChange).toHaveBeenCalledWith('test');
  });
});

// =============================================================================
// Tests - Clear Functionality
// =============================================================================

describe('SearchBar - Clear', () => {
  it('should clear input when clear button is clicked', async () => {
    const onChange = vi.fn();
    const onClear = vi.fn();
    render(<SearchBar value="test" onChange={onChange} onClear={onClear} />);

    const clearButton = screen.getByTestId('search-clear-button');
    await userEvent.click(clearButton);

    expect(onChange).toHaveBeenCalledWith('');
    expect(onClear).toHaveBeenCalled();
  });

  it('should clear input when Escape key is pressed', async () => {
    const onChange = vi.fn();
    const onClear = vi.fn();
    render(<SearchBar value="test" onChange={onChange} onClear={onClear} />);

    const input = screen.getByTestId('search-input');
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(onChange).toHaveBeenCalledWith('');
    expect(onClear).toHaveBeenCalled();
  });

  it('should focus input after clearing', async () => {
    const onChange = vi.fn();
    render(<SearchBar value="test" onChange={onChange} />);

    const input = screen.getByTestId('search-input');
    const clearButton = screen.getByTestId('search-clear-button');

    await userEvent.click(clearButton);

    expect(input).toHaveFocus();
  });

  it('should not call onClear if not provided', async () => {
    const onChange = vi.fn();
    render(<SearchBar value="test" onChange={onChange} />);

    const clearButton = screen.getByTestId('search-clear-button');

    // Should not throw error
    await userEvent.click(clearButton);

    expect(onChange).toHaveBeenCalledWith('');
  });
});

// =============================================================================
// Tests - Accessibility
// =============================================================================

describe('SearchBar - Accessibility', () => {
  it('should have aria-label for search input', () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);

    const input = screen.getByTestId('search-input');
    expect(input).toHaveAttribute('aria-label', 'Search');
  });

  it('should have aria-label for clear button', () => {
    const onChange = vi.fn();
    render(<SearchBar value="test" onChange={onChange} />);

    const clearButton = screen.getByTestId('search-clear-button');
    expect(clearButton).toHaveAttribute('aria-label', 'Clear search');
  });

  it('should link input to clear button with aria-describedby', () => {
    const onChange = vi.fn();
    render(<SearchBar value="test" onChange={onChange} />);

    const input = screen.getByTestId('search-input');
    const clearButton = screen.getByTestId('search-clear-button');

    expect(input).toHaveAttribute('aria-describedby', clearButton.id);
  });

  it('should not have aria-describedby when value is empty', () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);

    const input = screen.getByTestId('search-input');
    expect(input).not.toHaveAttribute('aria-describedby');
  });

  it('should have aria-hidden on icons', () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);

    const icons = document.querySelectorAll('svg[aria-hidden="true"]');
    expect(icons.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// Tests - Keyboard Interactions
// =============================================================================

describe('SearchBar - Keyboard', () => {
  it('should handle text input via keyboard', async () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);

    const input = screen.getByTestId('search-input');
    await userEvent.type(input, 'search text');

    expect((input as HTMLInputElement).value).toBe('search text');
  });

  it('should clear on Escape key', async () => {
    const onChange = vi.fn();
    render(<SearchBar value="test" onChange={onChange} />);

    const input = screen.getByTestId('search-input');
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(onChange).toHaveBeenCalledWith('');
  });

  it('should not interfere with other keyboard events', async () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);

    const input = screen.getByTestId('search-input');

    // Press Enter (should not trigger anything special)
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();

    // Press Tab (should not trigger anything special)
    fireEvent.keyDown(input, { key: 'Tab' });
    expect(onChange).not.toHaveBeenCalled();
  });
});

// =============================================================================
// Tests - External Value Updates
// =============================================================================

describe('SearchBar - External Updates', () => {
  it('should update input when value prop changes', () => {
    const onChange = vi.fn();
    const { rerender } = render(<SearchBar value="initial" onChange={onChange} />);

    const input = screen.getByTestId('search-input') as HTMLInputElement;
    expect(input.value).toBe('initial');

    // Update value prop
    rerender(<SearchBar value="updated" onChange={onChange} />);

    expect(input.value).toBe('updated');
  });

  it('should sync local state with prop changes', () => {
    const onChange = vi.fn();
    const { rerender } = render(<SearchBar value="" onChange={onChange} />);

    const input = screen.getByTestId('search-input') as HTMLInputElement;

    // Type some text
    fireEvent.change(input, { target: { value: 'local text' } });
    expect(input.value).toBe('local text');

    // External update should override local state
    rerender(<SearchBar value="external text" onChange={onChange} />);
    expect(input.value).toBe('external text');
  });
});

// =============================================================================
// Tests - Custom Styling
// =============================================================================

describe('SearchBar - Styling', () => {
  it('should apply custom className', () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} className="custom-class" />);

    const container = screen.getByTestId('search-bar');
    expect(container).toHaveClass('custom-class');
  });

  it('should apply custom testId', () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} testId="custom-search" />);

    expect(screen.getByTestId('custom-search')).toBeInTheDocument();
  });
});
