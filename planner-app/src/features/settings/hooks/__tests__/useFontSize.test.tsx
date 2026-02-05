/**
 * useFontSize Hook Tests
 *
 * Test suite for font size management hook.
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useFontSize } from '../useFontSize';
import settingsReducer from '../../settingsSlice';
import type { FontSizeOption } from '../../../../types';

// =============================================================================
// Test Setup
// =============================================================================

const createMockStore = (fontSize: FontSizeOption) => {
  return configureStore({
    reducer: {
      settings: settingsReducer,
    },
    preloadedState: {
      settings: {
        settings: {
          userId: 'test-user',
          theme: 'light',
          fontSize,
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

describe('useFontSize', () => {
  beforeEach(() => {
    // Clear document classes and styles
    document.documentElement.className = '';
    document.documentElement.style.removeProperty('--font-size-base');
  });

  afterEach(() => {
    // Clean up
    document.documentElement.className = '';
    document.documentElement.style.removeProperty('--font-size-base');
  });

  it('should apply small font size class', () => {
    const store = createMockStore('small');

    renderHook(() => useFontSize(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    expect(document.documentElement.classList.contains('text-sm')).toBe(true);
    expect(document.documentElement.classList.contains('text-base')).toBe(false);
    expect(document.documentElement.classList.contains('text-lg')).toBe(false);
  });

  it('should apply medium font size class', () => {
    const store = createMockStore('medium');

    renderHook(() => useFontSize(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    expect(document.documentElement.classList.contains('text-base')).toBe(true);
    expect(document.documentElement.classList.contains('text-sm')).toBe(false);
    expect(document.documentElement.classList.contains('text-lg')).toBe(false);
  });

  it('should apply large font size class', () => {
    const store = createMockStore('large');

    renderHook(() => useFontSize(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    expect(document.documentElement.classList.contains('text-lg')).toBe(true);
    expect(document.documentElement.classList.contains('text-sm')).toBe(false);
    expect(document.documentElement.classList.contains('text-base')).toBe(false);
  });

  it('should set CSS custom property for small font size', () => {
    const store = createMockStore('small');

    renderHook(() => useFontSize(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    const customProperty = document.documentElement.style.getPropertyValue('--font-size-base');
    expect(customProperty).toBe('14px');
  });

  it('should set CSS custom property for medium font size', () => {
    const store = createMockStore('medium');

    renderHook(() => useFontSize(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    const customProperty = document.documentElement.style.getPropertyValue('--font-size-base');
    expect(customProperty).toBe('16px');
  });

  it('should set CSS custom property for large font size', () => {
    const store = createMockStore('large');

    renderHook(() => useFontSize(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    const customProperty = document.documentElement.style.getPropertyValue('--font-size-base');
    expect(customProperty).toBe('18px');
  });

  it('should remove old font size classes when changing', () => {
    // Start with small
    document.documentElement.classList.add('text-sm');

    const store = createMockStore('large');

    renderHook(() => useFontSize(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    // Should have large, not small
    expect(document.documentElement.classList.contains('text-lg')).toBe(true);
    expect(document.documentElement.classList.contains('text-sm')).toBe(false);
  });

  it('should update CSS custom property when changing font size', () => {
    // Set initial value
    document.documentElement.style.setProperty('--font-size-base', '14px');

    const store = createMockStore('large');

    renderHook(() => useFontSize(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    const customProperty = document.documentElement.style.getPropertyValue('--font-size-base');
    expect(customProperty).toBe('18px');
  });
});
