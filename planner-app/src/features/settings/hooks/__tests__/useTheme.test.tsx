/**
 * useTheme Hook Tests
 *
 * Test suite for theme management hook.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useTheme } from '../useTheme';
import settingsReducer from '../../settingsSlice';
import type { ThemeOption } from '../../../../types';

// =============================================================================
// Test Setup
// =============================================================================

const createMockStore = (theme: ThemeOption) => {
  return configureStore({
    reducer: {
      settings: settingsReducer,
    },
    preloadedState: {
      settings: {
        settings: {
          userId: 'test-user',
          theme,
          fontSize: 'medium',
          defaultPriorityLetter: 'B',
          defaultReminderMinutes: 15,
          timezone: 'America/New_York',
          weekStartsOn: 0,
          notifications: {
            push: true,
            email: false,
            inApp: true,
          },
          googleCalendarSyncEnabled: false,
          platform: 'web',
        },
        loading: false,
        saving: false,
        error: null,
        initialized: true,
      },
    },
  });
};

// =============================================================================
// Tests
// =============================================================================

describe('useTheme', () => {
  let originalMatchMedia: typeof window.matchMedia;
  let mockMatchMedia: any;

  beforeEach(() => {
    // Save original matchMedia
    originalMatchMedia = window.matchMedia;

    // Mock matchMedia
    mockMatchMedia = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    };

    window.matchMedia = vi.fn().mockReturnValue(mockMatchMedia);

    // Clear document classes
    document.documentElement.className = '';

    // Add meta theme-color tag
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = '#ffffff';
    document.head.appendChild(meta);
  });

  afterEach(() => {
    // Restore original matchMedia
    window.matchMedia = originalMatchMedia;

    // Clean up
    document.documentElement.className = '';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.remove();
    }
  });

  it('should apply light theme class', () => {
    const store = createMockStore('light');

    renderHook(() => useTheme(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should apply dark theme class', () => {
    const store = createMockStore('dark');

    renderHook(() => useTheme(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });

  it('should apply system theme (light) when system prefers light', () => {
    mockMatchMedia.matches = false; // prefers light

    const store = createMockStore('system');

    renderHook(() => useTheme(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should apply system theme (dark) when system prefers dark', () => {
    mockMatchMedia.matches = true; // prefers dark

    const store = createMockStore('system');

    renderHook(() => useTheme(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });

  it('should update meta theme-color for light theme', () => {
    const store = createMockStore('light');

    renderHook(() => useTheme(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    const meta = document.querySelector('meta[name="theme-color"]');
    expect(meta?.getAttribute('content')).toBe('#ffffff');
  });

  it('should update meta theme-color for dark theme', () => {
    const store = createMockStore('dark');

    renderHook(() => useTheme(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    const meta = document.querySelector('meta[name="theme-color"]');
    expect(meta?.getAttribute('content')).toBe('#1f2937');
  });

  it('should listen for system theme changes when theme is system', () => {
    const store = createMockStore('system');

    const { unmount } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    // Check that event listener was added
    expect(mockMatchMedia.addEventListener || mockMatchMedia.addListener).toHaveBeenCalled();

    // Unmount to trigger cleanup
    unmount();

    // Check that event listener was removed
    expect(mockMatchMedia.removeEventListener || mockMatchMedia.removeListener).toHaveBeenCalled();
  });

  it('should not listen for system theme changes when theme is not system', () => {
    const store = createMockStore('light');

    renderHook(() => useTheme(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    // Event listeners should not be added for non-system themes
    expect(mockMatchMedia.addEventListener).not.toHaveBeenCalled();
    expect(mockMatchMedia.addListener).not.toHaveBeenCalled();
  });

  it('should handle missing meta theme-color tag gracefully', () => {
    // Remove meta tag
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.remove();
    }

    const store = createMockStore('light');

    expect(() => {
      renderHook(() => useTheme(), {
        wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
      });
    }).not.toThrow();
  });
});
