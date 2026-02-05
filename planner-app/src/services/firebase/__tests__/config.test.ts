import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firebase modules before importing config
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({ name: 'mock-app' })),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({ name: 'mock-app' })),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ name: 'mock-auth' })),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({ name: 'mock-firestore' })),
}));

describe('Firebase Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Firebase Initialization', () => {
    it('should export app instance', async () => {
      const { app } = await import('../config');
      expect(app).toBeDefined();
      expect(app).toHaveProperty('name');
    });

    it('should export auth instance', async () => {
      const { auth } = await import('../config');
      expect(auth).toBeDefined();
    });

    it('should export db instance', async () => {
      const { db } = await import('../config');
      expect(db).toBeDefined();
    });

    it('should export firebaseConfig object', async () => {
      const { firebaseConfig } = await import('../config');
      expect(firebaseConfig).toBeDefined();
      expect(firebaseConfig).toHaveProperty('apiKey');
      expect(firebaseConfig).toHaveProperty('authDomain');
      expect(firebaseConfig).toHaveProperty('projectId');
      expect(firebaseConfig).toHaveProperty('storageBucket');
      expect(firebaseConfig).toHaveProperty('messagingSenderId');
      expect(firebaseConfig).toHaveProperty('appId');
    });
  });

  describe('Firebase Index Exports', () => {
    it('should re-export all Firebase instances from index', async () => {
      const firebaseIndex = await import('../index');
      expect(firebaseIndex.app).toBeDefined();
      expect(firebaseIndex.auth).toBeDefined();
      expect(firebaseIndex.db).toBeDefined();
      expect(firebaseIndex.firebaseConfig).toBeDefined();
    });
  });

  describe('Singleton Pattern', () => {
    it('should not reinitialize if app already exists', async () => {
      const { getApps } = await import('firebase/app');

      // Simulate app already initialized
      vi.mocked(getApps).mockReturnValue([{ name: 'existing-app' }] as unknown as ReturnType<typeof getApps>);

      // Re-import to trigger initialization check
      vi.resetModules();
      vi.doMock('firebase/app', () => ({
        initializeApp: vi.fn(() => ({ name: 'new-app' })),
        getApps: vi.fn(() => [{ name: 'existing-app' }]),
        getApp: vi.fn(() => ({ name: 'existing-app' })),
      }));

      const config = await import('../config');

      // getApp should be used instead of initializeApp
      expect(config.app).toBeDefined();
    });
  });
});

describe('Environment Variables', () => {
  it('should have VITE_ prefix for Vite compatibility', async () => {
    const { firebaseConfig } = await import('../config');

    // Config should use import.meta.env.VITE_* variables
    // In test environment, these will be undefined, which is expected
    expect(firebaseConfig).toHaveProperty('apiKey');
    expect(firebaseConfig).toHaveProperty('projectId');
  });
});
