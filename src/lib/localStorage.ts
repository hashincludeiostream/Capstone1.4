/**
 * Safe localStorage utilities with error handling and validation
 */

export const localStorage = {
  /**
   * Safely get an item from localStorage
   */
  getItem: (key: string): string | null => {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return null;
    }
  },

  /**
   * Safely set an item in localStorage
   */
  setItem: (key: string, value: string): boolean => {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
      return false;
    }
  },

  /**
   * Safely remove an item from localStorage
   */
  removeItem: (key: string): boolean => {
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
      return false;
    }
  },

  /**
   * Safely clear all items from localStorage
   */
  clear: (): boolean => {
    try {
      window.localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  },

  /**
   * Get and parse JSON from localStorage
   */
  getJSON: <T>(key: string): T | null => {
    try {
      const item = window.localStorage.getItem(key);
      if (!item) return null;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Error parsing JSON from localStorage key "${key}":`, error);
      // Remove corrupted data
      window.localStorage.removeItem(key);
      return null;
    }
  },

  /**
   * Stringify and set JSON in localStorage
   */
  setJSON: <T>(key: string, value: T): boolean => {
    try {
      const json = JSON.stringify(value);
      return window.localStorage.setItem(key, json) !== null;
    } catch (error) {
      console.error(`Error setting JSON in localStorage key "${key}":`, error);
      return false;
    }
  }
};

/**
 * Check if localStorage is available
 */
export const isLocalStorageAvailable = (): boolean => {
  try {
    const testKey = '__localStorage_test__';
    window.localStorage.setItem(testKey, 'test');
    window.localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    console.error('localStorage is not available:', error);
    return false;
  }
};