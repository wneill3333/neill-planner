/**
 * Status Utility Functions Tests
 *
 * Comprehensive tests for status manipulation and display utilities.
 */

import { describe, it, expect } from 'vitest';
import type { TaskStatus } from '../../types';
import {
  STATUS_ORDER,
  getNextStatus,
  getPreviousStatus,
  STATUS_LABELS,
  getStatusLabel,
  getStatusSymbol,
  STATUS_COLORS,
  STATUS_COLOR_CLASSES,
  getStatusColor,
  getStatusColorClasses,
  STATUS_DESCRIPTIONS,
  getStatusDescription,
  isClosedStatus,
  isActiveStatus,
  getAllStatuses,
} from '../statusUtils';

// =============================================================================
// Status Order Tests
// =============================================================================

describe('STATUS_ORDER', () => {
  it('should contain all five statuses', () => {
    expect(STATUS_ORDER).toHaveLength(5);
    expect(STATUS_ORDER).toContain('in_progress');
    expect(STATUS_ORDER).toContain('complete');
    expect(STATUS_ORDER).toContain('forward');
    expect(STATUS_ORDER).toContain('delegate');
    expect(STATUS_ORDER).toContain('delete');
  });

  it('should start with in_progress', () => {
    expect(STATUS_ORDER[0]).toBe('in_progress');
  });
});

// =============================================================================
// getNextStatus Tests
// =============================================================================

describe('getNextStatus', () => {
  it('should cycle in_progress to complete', () => {
    expect(getNextStatus('in_progress')).toBe('complete');
  });

  it('should cycle complete to forward', () => {
    expect(getNextStatus('complete')).toBe('forward');
  });

  it('should cycle forward to delegate', () => {
    expect(getNextStatus('forward')).toBe('delegate');
  });

  it('should cycle delegate to delete', () => {
    expect(getNextStatus('delegate')).toBe('delete');
  });

  it('should cycle delete back to in_progress', () => {
    expect(getNextStatus('delete')).toBe('in_progress');
  });

  it('should complete full cycle', () => {
    let status: TaskStatus = 'in_progress';
    const seen: TaskStatus[] = [status];

    for (let i = 0; i < STATUS_ORDER.length; i++) {
      status = getNextStatus(status);
      if (i < STATUS_ORDER.length - 1) {
        expect(seen).not.toContain(status);
        seen.push(status);
      }
    }

    // After full cycle, should be back to in_progress
    expect(status).toBe('in_progress');
  });
});

// =============================================================================
// getPreviousStatus Tests
// =============================================================================

describe('getPreviousStatus', () => {
  it('should go backwards from in_progress to delete', () => {
    expect(getPreviousStatus('in_progress')).toBe('delete');
  });

  it('should go backwards from complete to in_progress', () => {
    expect(getPreviousStatus('complete')).toBe('in_progress');
  });

  it('should go backwards from forward to complete', () => {
    expect(getPreviousStatus('forward')).toBe('complete');
  });

  it('should go backwards from delegate to forward', () => {
    expect(getPreviousStatus('delegate')).toBe('forward');
  });

  it('should go backwards from delete to delegate', () => {
    expect(getPreviousStatus('delete')).toBe('delegate');
  });

  it('should be inverse of getNextStatus', () => {
    for (const status of STATUS_ORDER) {
      const next = getNextStatus(status);
      const backToOriginal = getPreviousStatus(next);
      expect(backToOriginal).toBe(status);
    }
  });
});

// =============================================================================
// Status Labels Tests
// =============================================================================

describe('STATUS_LABELS', () => {
  it('should have labels for all statuses', () => {
    expect(STATUS_LABELS.in_progress).toBe('In Progress');
    expect(STATUS_LABELS.forward).toBe('Forwarded');
    expect(STATUS_LABELS.complete).toBe('Complete');
    expect(STATUS_LABELS.delete).toBe('Deleted');
    expect(STATUS_LABELS.delegate).toBe('Delegated');
  });
});

describe('getStatusLabel', () => {
  it('should return correct label for each status', () => {
    expect(getStatusLabel('in_progress')).toBe('In Progress');
    expect(getStatusLabel('forward')).toBe('Forwarded');
    expect(getStatusLabel('complete')).toBe('Complete');
    expect(getStatusLabel('delete')).toBe('Deleted');
    expect(getStatusLabel('delegate')).toBe('Delegated');
  });
});

// =============================================================================
// Status Symbols Tests
// =============================================================================

describe('getStatusSymbol', () => {
  it('should return correct symbol for in_progress', () => {
    expect(getStatusSymbol('in_progress')).toBe('●');
  });

  it('should return correct symbol for forward', () => {
    expect(getStatusSymbol('forward')).toBe('➜');
  });

  it('should return correct symbol for complete', () => {
    expect(getStatusSymbol('complete')).toBe('✔');
  });

  it('should return correct symbol for delete', () => {
    expect(getStatusSymbol('delete')).toBe('✘');
  });

  it('should return correct symbol for delegate', () => {
    expect(getStatusSymbol('delegate')).toBe('◯');
  });
});

// =============================================================================
// Status Colors Tests
// =============================================================================

describe('STATUS_COLORS', () => {
  it('should have colors for all statuses', () => {
    expect(STATUS_COLORS.in_progress).toBe('#3B82F6'); // Blue
    expect(STATUS_COLORS.forward).toBe('#8B5CF6'); // Purple
    expect(STATUS_COLORS.complete).toBe('#22C55E'); // Green
    expect(STATUS_COLORS.delete).toBe('#EF4444'); // Red
    expect(STATUS_COLORS.delegate).toBe('#F97316'); // Orange
  });

  it('should have exactly 5 status colors', () => {
    expect(Object.keys(STATUS_COLORS)).toHaveLength(5);
  });
});

describe('getStatusColor', () => {
  it('should return correct color for each status', () => {
    expect(getStatusColor('in_progress')).toBe('#3B82F6');
    expect(getStatusColor('forward')).toBe('#8B5CF6');
    expect(getStatusColor('complete')).toBe('#22C55E');
    expect(getStatusColor('delete')).toBe('#EF4444');
    expect(getStatusColor('delegate')).toBe('#F97316');
  });
});

describe('STATUS_COLOR_CLASSES', () => {
  it('should have Tailwind classes for all statuses', () => {
    expect(STATUS_COLOR_CLASSES.in_progress).toEqual({
      bg: 'bg-blue-500',
      text: 'text-blue-600',
      border: 'border-blue-500',
    });
    expect(STATUS_COLOR_CLASSES.forward).toEqual({
      bg: 'bg-purple-500',
      text: 'text-purple-600',
      border: 'border-purple-500',
    });
    expect(STATUS_COLOR_CLASSES.complete).toEqual({
      bg: 'bg-green-500',
      text: 'text-green-600',
      border: 'border-green-500',
    });
    expect(STATUS_COLOR_CLASSES.delete).toEqual({
      bg: 'bg-red-500',
      text: 'text-red-600',
      border: 'border-red-500',
    });
    expect(STATUS_COLOR_CLASSES.delegate).toEqual({
      bg: 'bg-orange-500',
      text: 'text-orange-600',
      border: 'border-orange-500',
    });
  });
});

describe('getStatusColorClasses', () => {
  it('should return correct Tailwind classes for each status', () => {
    const inProgressClasses = getStatusColorClasses('in_progress');
    expect(inProgressClasses.bg).toBe('bg-blue-500');
    expect(inProgressClasses.text).toBe('text-blue-600');
    expect(inProgressClasses.border).toBe('border-blue-500');

    const completeClasses = getStatusColorClasses('complete');
    expect(completeClasses.bg).toBe('bg-green-500');
    expect(completeClasses.text).toBe('text-green-600');
    expect(completeClasses.border).toBe('border-green-500');
  });
});

// =============================================================================
// Status Descriptions Tests
// =============================================================================

describe('STATUS_DESCRIPTIONS', () => {
  it('should have descriptions for all statuses', () => {
    expect(STATUS_DESCRIPTIONS.in_progress).toBe('Task is active and in progress');
    expect(STATUS_DESCRIPTIONS.forward).toBe('Task has been moved to another day');
    expect(STATUS_DESCRIPTIONS.complete).toBe('Task has been completed');
    expect(STATUS_DESCRIPTIONS.delete).toBe('Task has been marked for deletion');
    expect(STATUS_DESCRIPTIONS.delegate).toBe('Task has been delegated to someone else');
  });
});

describe('getStatusDescription', () => {
  it('should return correct description for each status', () => {
    expect(getStatusDescription('in_progress')).toBe('Task is active and in progress');
    expect(getStatusDescription('complete')).toBe('Task has been completed');
    expect(getStatusDescription('delegate')).toBe('Task has been delegated to someone else');
  });
});

// =============================================================================
// Status Checking Tests
// =============================================================================

describe('isClosedStatus', () => {
  it('should return true for complete status', () => {
    expect(isClosedStatus('complete')).toBe(true);
  });

  it('should return true for delete status', () => {
    expect(isClosedStatus('delete')).toBe(true);
  });

  it('should return true for delegate status', () => {
    expect(isClosedStatus('delegate')).toBe(true);
  });

  it('should return false for in_progress status', () => {
    expect(isClosedStatus('in_progress')).toBe(false);
  });

  it('should return false for forward status', () => {
    expect(isClosedStatus('forward')).toBe(false);
  });
});

describe('isActiveStatus', () => {
  it('should return true for in_progress status', () => {
    expect(isActiveStatus('in_progress')).toBe(true);
  });

  it('should return true for forward status', () => {
    expect(isActiveStatus('forward')).toBe(true);
  });

  it('should return false for complete status', () => {
    expect(isActiveStatus('complete')).toBe(false);
  });

  it('should return false for delete status', () => {
    expect(isActiveStatus('delete')).toBe(false);
  });

  it('should return false for delegate status', () => {
    expect(isActiveStatus('delegate')).toBe(false);
  });

  it('should be inverse of isClosedStatus for all statuses', () => {
    for (const status of STATUS_ORDER) {
      expect(isActiveStatus(status)).toBe(!isClosedStatus(status));
    }
  });
});

describe('getAllStatuses', () => {
  it('should return all statuses', () => {
    const statuses = getAllStatuses();

    expect(statuses).toHaveLength(5);
    expect(statuses).toContain('in_progress');
    expect(statuses).toContain('complete');
    expect(statuses).toContain('forward');
    expect(statuses).toContain('delegate');
    expect(statuses).toContain('delete');
  });

  it('should return a new array (not the original)', () => {
    const statuses1 = getAllStatuses();
    const statuses2 = getAllStatuses();

    expect(statuses1).not.toBe(statuses2);
    expect(statuses1).toEqual(statuses2);
  });
});
