/**
 * Tests for StorageManager utility
 */

import storageManager from '../storageManager';

// Mock IndexedDB for testing
const mockIndexedDB = {
  open: jest.fn(),
  deleteDatabase: jest.fn()
};

Object.defineProperty(window, 'indexedDB', {
  writable: true,
  value: mockIndexedDB
});

describe('StorageManager', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Reset storage manager state
    storageManager.db = null;
    storageManager.isInitialized = false;
  });

  describe('Initialization', () => {
    it('should initialize successfully with IndexedDB', async () => {
      const mockDB = {
        objectStoreNames: {
          contains: jest.fn().mockReturnValue(false)
        },
        createObjectStore: jest.fn()
      };

      mockIndexedDB.open.mockImplementation((name, version) => ({
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
        result: mockDB
      }));

      // Mock the promise chain
      const initPromise = storageManager.init();
      const mockEvent = { target: { result: mockDB } };

      // Simulate successful initialization
      setTimeout(() => {
        mockIndexedDB.open.mock.calls[0][0].onsuccess(mockEvent);
      }, 0);

      await initPromise;
      expect(storageManager.isInitialized).toBe(true);
      expect(storageManager.db).toBe(mockDB);
    });

    it('should fallback to localStorage when IndexedDB fails', async () => {
      mockIndexedDB.open.mockImplementation(() => ({
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null
      }));

      // Mock the promise chain
      const initPromise = storageManager.init();
      const mockEvent = { target: {} };

      // Simulate error
      setTimeout(() => {
        mockIndexedDB.open.mock.calls[0][0].onerror(mockEvent);
      }, 0);

      await initPromise;
      expect(storageManager.isInitialized).toBe(true);
      expect(storageManager.db).toBe(null);
    });
  });

  describe('Data Storage', () => {
    beforeEach(async () => {
      // Initialize with mock DB
      const mockDB = {
        objectStoreNames: { contains: jest.fn().mockReturnValue(true) },
        transaction: jest.fn().mockReturnValue({
          objectStore: jest.fn().mockReturnValue({
            put: jest.fn().mockImplementation(() => ({
              onsuccess: jest.fn(),
              onerror: null
            }))
          })
        })
      };

      mockIndexedDB.open.mockImplementation(() => ({
        onsuccess: { handler: null },
        onerror: null,
        onupgradeneeded: null,
        result: mockDB
      }));

      await storageManager.init();
    });

    it('should store small data in localStorage', async () => {
      const testData = { test: 'small data' };
      const result = await storageManager.setItem('test_key', testData);

      expect(result).toBeDefined();
      expect(result.data).toEqual(testData);
    });

    it('should store large data in IndexedDB', async () => {
      // Create large data (> 1MB)
      const largeData = 'x'.repeat(2 * 1024 * 1024); // 2MB
      const testData = { data: largeData };

      const result = await storageManager.setItem('large_key', testData);

      expect(result).toBeDefined();
      expect(result.data).toEqual(testData);
    });
  });

  describe('Data Retrieval', () => {
    it('should retrieve data from localStorage', async () => {
      const testData = { retrieved: 'test data' };

      // Mock localStorage
      const originalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = jest.fn().mockReturnValue(JSON.stringify({
        id: 'test_key',
        data: testData,
        timestamp: Date.now()
      }));

      const result = await storageManager.getItem('test_key');

      expect(result).toEqual(testData);

      // Restore original method
      Storage.prototype.getItem = originalGetItem;
    });

    it('should return null for non-existent keys', async () => {
      const originalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = jest.fn().mockReturnValue(null);

      const result = await storageManager.getItem('nonexistent_key');

      expect(result).toBeNull();

      Storage.prototype.getItem = originalGetItem;
    });
  });

  describe('Data Removal', () => {
    it('should remove data from localStorage', async () => {
      const originalRemoveItem = Storage.prototype.removeItem;
      Storage.prototype.removeItem = jest.fn();

      await storageManager.removeItem('test_key');

      expect(Storage.prototype.removeItem).toHaveBeenCalledWith('test_key');

      Storage.prototype.removeItem = originalRemoveItem;
    });
  });

  describe('Storage Info', () => {
    it('should provide storage information', async () => {
      const info = await storageManager.getStorageInfo();

      expect(info).toHaveProperty('indexedDB');
      expect(info).toHaveProperty('localStorage');
      expect(info.indexedDB).toHaveProperty('used');
      expect(info.indexedDB).toHaveProperty('available');
      expect(info.localStorage).toHaveProperty('used');
      expect(info.localStorage).toHaveProperty('available');
    });
  });

  describe('Cleanup', () => {
    it('should cleanup old data', async () => {
      const originalRemoveItem = Storage.prototype.removeItem;
      Storage.prototype.removeItem = jest.fn();

      await storageManager.cleanupOldData(24 * 60 * 60 * 1000); // 1 day

      expect(Storage.prototype.removeItem).toHaveBeenCalled();

      Storage.prototype.removeItem = originalRemoveItem;
    });
  });
});