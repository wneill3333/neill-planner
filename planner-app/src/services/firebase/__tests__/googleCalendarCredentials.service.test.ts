/**
 * @vitest-environment node
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveCredentials,
  getCredentials,
  deleteCredentials,
  updateTokens,
  hasCredentials,
} from '../googleCalendarCredentials.service';
import type { GoogleCalendarCredentials } from '../../../types/googleCalendar.types';
import { ValidationError } from '../../../utils/validation';

// Mock Firebase
vi.mock('../config', () => ({
  db: {},
}));

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    collection: vi.fn(),
    doc: vi.fn(() => ({ id: 'mock-doc-id' })),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    deleteDoc: vi.fn(),
    updateDoc: vi.fn(),
    Timestamp: {
      fromDate: vi.fn((date: Date) => ({
        toDate: () => date,
        seconds: Math.floor(date.getTime() / 1000),
        nanoseconds: 0,
      })),
    },
  };
});

const { getDoc, setDoc, deleteDoc, updateDoc } = await import('firebase/firestore');

describe('googleCalendarCredentials.service', () => {
  const mockUserId = 'user123';
  const mockCredentials: GoogleCalendarCredentials = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresAt: new Date('2026-12-31T23:59:59Z'),
    scope: 'https://www.googleapis.com/auth/calendar',
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveCredentials', () => {
    it('should save credentials successfully', async () => {
      vi.mocked(setDoc).mockResolvedValue(undefined);

      await expect(saveCredentials(mockUserId, mockCredentials)).resolves.toBeUndefined();
      expect(setDoc).toHaveBeenCalledTimes(1);
    });

    it('should throw ValidationError for invalid userId', async () => {
      await expect(saveCredentials('', mockCredentials)).rejects.toThrow(ValidationError);
      expect(setDoc).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for missing accessToken', async () => {
      const invalidCredentials = { ...mockCredentials, accessToken: '' };
      await expect(saveCredentials(mockUserId, invalidCredentials)).rejects.toThrow(
        ValidationError
      );
      expect(setDoc).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for missing refreshToken', async () => {
      const invalidCredentials = { ...mockCredentials, refreshToken: '' };
      await expect(saveCredentials(mockUserId, invalidCredentials)).rejects.toThrow(
        ValidationError
      );
      expect(setDoc).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for invalid expiresAt', async () => {
      const invalidCredentials = {
        ...mockCredentials,
        expiresAt: new Date('invalid'),
      };
      await expect(saveCredentials(mockUserId, invalidCredentials)).rejects.toThrow(
        ValidationError
      );
      expect(setDoc).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for missing scope', async () => {
      const invalidCredentials = { ...mockCredentials, scope: '' };
      await expect(saveCredentials(mockUserId, invalidCredentials)).rejects.toThrow(
        ValidationError
      );
      expect(setDoc).not.toHaveBeenCalled();
    });

    it('should handle Firestore errors', async () => {
      vi.mocked(setDoc).mockRejectedValue(new Error('Firestore error'));

      await expect(saveCredentials(mockUserId, mockCredentials)).rejects.toThrow(
        'Failed to save Google Calendar credentials'
      );
    });
  });

  describe('getCredentials', () => {
    it('should get credentials successfully', async () => {
      const mockDocData = {
        accessToken: mockCredentials.accessToken,
        refreshToken: mockCredentials.refreshToken,
        expiresAt: {
          toDate: () => mockCredentials.expiresAt,
        },
        scope: mockCredentials.scope,
        updatedAt: {
          toDate: () => mockCredentials.updatedAt,
        },
      };

      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockDocData,
      } as any);

      const result = await getCredentials(mockUserId);
      expect(result).toEqual(mockCredentials);
      expect(getDoc).toHaveBeenCalledTimes(1);
    });

    it('should return null when credentials do not exist', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      const result = await getCredentials(mockUserId);
      expect(result).toBeNull();
    });

    it('should throw ValidationError for invalid userId', async () => {
      await expect(getCredentials('')).rejects.toThrow(ValidationError);
      expect(getDoc).not.toHaveBeenCalled();
    });

    it('should handle Firestore errors', async () => {
      vi.mocked(getDoc).mockRejectedValue(new Error('Firestore error'));

      await expect(getCredentials(mockUserId)).rejects.toThrow(
        'Failed to get Google Calendar credentials'
      );
    });
  });

  describe('deleteCredentials', () => {
    it('should delete credentials successfully', async () => {
      vi.mocked(deleteDoc).mockResolvedValue(undefined);

      await expect(deleteCredentials(mockUserId)).resolves.toBeUndefined();
      expect(deleteDoc).toHaveBeenCalledTimes(1);
    });

    it('should throw ValidationError for invalid userId', async () => {
      await expect(deleteCredentials('')).rejects.toThrow(ValidationError);
      expect(deleteDoc).not.toHaveBeenCalled();
    });

    it('should handle Firestore errors', async () => {
      vi.mocked(deleteDoc).mockRejectedValue(new Error('Firestore error'));

      await expect(deleteCredentials(mockUserId)).rejects.toThrow(
        'Failed to delete Google Calendar credentials'
      );
    });
  });

  describe('updateTokens', () => {
    const newAccessToken = 'new-access-token';
    const newExpiresAt = new Date('2027-01-01T00:00:00Z');

    it('should update tokens successfully', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
      } as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      await expect(updateTokens(mockUserId, newAccessToken, newExpiresAt)).resolves.toBeUndefined();
      expect(getDoc).toHaveBeenCalledTimes(1);
      expect(updateDoc).toHaveBeenCalledTimes(1);
    });

    it('should throw error when credentials do not exist', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      await expect(updateTokens(mockUserId, newAccessToken, newExpiresAt)).rejects.toThrow(
        'Credentials not found for user'
      );
      expect(updateDoc).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for invalid userId', async () => {
      await expect(updateTokens('', newAccessToken, newExpiresAt)).rejects.toThrow(
        ValidationError
      );
      expect(getDoc).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for missing accessToken', async () => {
      await expect(updateTokens(mockUserId, '', newExpiresAt)).rejects.toThrow(ValidationError);
      expect(getDoc).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for invalid expiresAt', async () => {
      await expect(updateTokens(mockUserId, newAccessToken, new Date('invalid'))).rejects.toThrow(
        ValidationError
      );
      expect(getDoc).not.toHaveBeenCalled();
    });

    it('should handle Firestore errors', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
      } as any);
      vi.mocked(updateDoc).mockRejectedValue(new Error('Firestore error'));

      await expect(updateTokens(mockUserId, newAccessToken, newExpiresAt)).rejects.toThrow(
        'Failed to update Google Calendar tokens'
      );
    });
  });

  describe('hasCredentials', () => {
    it('should return true when credentials exist', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
      } as any);

      const result = await hasCredentials(mockUserId);
      expect(result).toBe(true);
      expect(getDoc).toHaveBeenCalledTimes(1);
    });

    it('should return false when credentials do not exist', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      const result = await hasCredentials(mockUserId);
      expect(result).toBe(false);
    });

    it('should throw ValidationError for invalid userId', async () => {
      await expect(hasCredentials('')).rejects.toThrow(ValidationError);
      expect(getDoc).not.toHaveBeenCalled();
    });

    it('should handle Firestore errors', async () => {
      vi.mocked(getDoc).mockRejectedValue(new Error('Firestore error'));

      await expect(hasCredentials(mockUserId)).rejects.toThrow(
        'Failed to check Google Calendar credentials'
      );
    });
  });
});
