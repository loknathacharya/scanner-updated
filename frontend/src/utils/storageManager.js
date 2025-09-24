/**
 * Storage Manager for Backtest Results
 *
 * Provides a unified interface for storing large backtest results using IndexedDB
 * Falls back to localStorage for smaller datasets or when IndexedDB is unavailable
 */

class StorageManager {
  constructor() {
    this.dbName = 'BacktestEngineDB';
    this.dbVersion = 1;
    this.storeName = 'backtestResults';
    this.db = null;
    this.isInitialized = false;
  }

  /**
   * Initialize IndexedDB database
   */
  async init() {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.warn('IndexedDB not available, falling back to localStorage');
        this.isInitialized = true;
        resolve(false);
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        this.isInitialized = true;
        console.log('✅ IndexedDB initialized successfully');
        resolve(true);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          console.log('Created IndexedDB object store:', this.storeName);
        }
      };
    });
  }

  /**
   * Store backtest results
   * @param {string} key - Storage key
   * @param {any} data - Data to store
   * @param {Object} options - Storage options
   */
  async setItem(key, data, options = {}) {
    await this.init();

    const item = {
      id: key,
      data: data,
      timestamp: Date.now(),
      size: this.getDataSize(data),
      ...options
    };

    // Check if we should use IndexedDB or localStorage
    if (this.db && item.size > 1024 * 1024) { // > 1MB use IndexedDB
      return this.setItemIndexedDB(key, item);
    } else {
      return this.setItemLocalStorage(key, item);
    }
  }

  /**
   * Store item in IndexedDB
   */
  async setItemIndexedDB(key, item) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(item);

      request.onsuccess = () => {
        console.log(`✅ Stored ${key} in IndexedDB (${item.size} bytes)`);
        resolve(item);
      };

      request.onerror = () => {
        console.error('❌ Failed to store in IndexedDB:', request.error);
        // Fallback to localStorage
        this.setItemLocalStorage(key, item).then(resolve).catch(reject);
      };
    });
  }

  /**
   * Store item in localStorage
   */
  async setItemLocalStorage(key, item) {
    try {
      const serialized = JSON.stringify(item);
      localStorage.setItem(key, serialized);
      console.log(`✅ Stored ${key} in localStorage (${item.size} bytes)`);
      return item;
    } catch (error) {
      console.error('❌ Failed to store in localStorage:', error);

      // If it's a quota error, try to clean up old data
      if (error.name === 'QuotaExceededError') {
        console.log('🧹 Attempting to clean up storage...');
        this.cleanupOldData().then(() => {
          // Try again after cleanup
          try {
            const serialized = JSON.stringify(item);
            localStorage.setItem(key, serialized);
            console.log(`✅ Stored ${key} in localStorage after cleanup (${item.size} bytes)`);
            return item;
          } catch (retryError) {
            console.error('❌ Still failed after cleanup:', retryError);
            throw retryError;
          }
        }).catch(cleanupError => {
          console.error('❌ Cleanup failed:', cleanupError);
          throw error;
        });
      } else {
        throw error;
      }
    }
  }

  /**
   * Retrieve backtest results
   * @param {string} key - Storage key
   */
  async getItem(key) {
    await this.init();

    if (this.db) {
      try {
        return await this.getItemIndexedDB(key);
      } catch (error) {
        console.warn('Failed to get from IndexedDB, trying localStorage:', error);
        return this.getItemLocalStorage(key);
      }
    } else {
      return this.getItemLocalStorage(key);
    }
  }

  /**
   * Get item from IndexedDB
   */
  async getItemIndexedDB(key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onsuccess = (event) => {
        const item = event.target.result;
        if (item) {
          console.log(`✅ Retrieved ${key} from IndexedDB (${item.size} bytes)`);
          resolve(item.data);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Get item from localStorage
   */
  getItemLocalStorage(key) {
    try {
      const serialized = localStorage.getItem(key);
      if (serialized) {
        const item = JSON.parse(serialized);
        console.log(`✅ Retrieved ${key} from localStorage (${item.size} bytes)`);
        return item.data;
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to retrieve from localStorage:', error);
      return null;
    }
  }

  /**
   * Remove item from storage
   * @param {string} key - Storage key
   */
  async removeItem(key) {
    await this.init();

    if (this.db) {
      try {
        await this.removeItemIndexedDB(key);
      } catch (error) {
        console.warn('Failed to remove from IndexedDB, trying localStorage:', error);
        this.removeItemLocalStorage(key);
      }
    } else {
      this.removeItemLocalStorage(key);
    }
  }

  /**
   * Remove item from IndexedDB
   */
  async removeItemIndexedDB(key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onsuccess = () => {
        console.log(`✅ Removed ${key} from IndexedDB`);
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Remove item from localStorage
   */
  removeItemLocalStorage(key) {
    try {
      localStorage.removeItem(key);
      console.log(`✅ Removed ${key} from localStorage`);
    } catch (error) {
      console.error('❌ Failed to remove from localStorage:', error);
    }
  }

  /**
   * Clean up old backtest results to free up space
   */
  async cleanupOldData(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days default
    const cutoffTime = Date.now() - maxAge;

    // Clean up localStorage
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('backtest_results')) {
          try {
            const item = JSON.parse(localStorage.getItem(key));
            if (item.timestamp && item.timestamp < cutoffTime) {
              keysToRemove.push(key);
            }
          } catch (e) {
            // If we can't parse it, consider it for removal
            keysToRemove.push(key);
          }
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`🧹 Cleaned up ${keysToRemove.length} old items from localStorage`);
    } catch (error) {
      console.warn('Failed to cleanup localStorage:', error);
    }

    // Clean up IndexedDB
    if (this.db) {
      try {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const index = store.index('timestamp');
        const request = index.openCursor();

        let removedCount = 0;
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            if (cursor.value.timestamp < cutoffTime) {
              cursor.delete();
              removedCount++;
            }
            cursor.continue();
          } else {
            console.log(`🧹 Cleaned up ${removedCount} old items from IndexedDB`);
          }
        };
      } catch (error) {
        console.warn('Failed to cleanup IndexedDB:', error);
      }
    }
  }

  /**
   * Get storage usage information
   */
  async getStorageInfo() {
    const info = {
      indexedDB: { used: 0, available: 0 },
      localStorage: { used: 0, available: 0 }
    };

    // Estimate localStorage usage
    try {
      let totalSize = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        totalSize += key.length + value.length;
      }
      info.localStorage.used = totalSize;
      info.localStorage.available = 5 * 1024 * 1024; // Assume 5MB limit
    } catch (error) {
      console.warn('Failed to get localStorage info:', error);
    }

    // Get IndexedDB usage (approximate)
    if (this.db) {
      try {
        const transaction = this.db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.count();

        request.onsuccess = () => {
          info.indexedDB.used = request.result * 1024; // Rough estimate
          info.indexedDB.available = 500 * 1024 * 1024; // Assume 500MB limit
        };
      } catch (error) {
        console.warn('Failed to get IndexedDB info:', error);
      }
    }

    return info;
  }

  /**
   * Calculate approximate size of data in bytes
   */
  getDataSize(data) {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch (error) {
      console.warn('Failed to calculate data size:', error);
      return 0;
    }
  }
}

// Create singleton instance
const storageManager = new StorageManager();

export default storageManager;