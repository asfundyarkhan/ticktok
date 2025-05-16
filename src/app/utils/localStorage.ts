/**
 * Utility functions for safely interacting with localStorage in a Next.js application
 * This prevents issues with server-side rendering when localStorage is not available
 */

/**
 * Get an item from localStorage with proper error handling and SSR awareness
 */
export function getFromLocalStorage<T>(key: string, defaultValue: T): T {
  // Check if running in a browser environment
  if (typeof window === 'undefined') {
    return defaultValue;
  }

  try {
    const item = window.localStorage.getItem(key);
    if (!item) return defaultValue;
    
    // Handle raw string case
    if (typeof defaultValue === 'string') {
      return item as unknown as T;
    }
    
    // Parse the item
    return JSON.parse(item);
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
}

/**
 * Set an item to localStorage with proper error handling and SSR awareness
 */
export function setToLocalStorage<T>(key: string, value: T): void {
  // Check if running in a browser environment
  if (typeof window === 'undefined') {
    return;
  }

  try {
    // Handle raw string case
    if (typeof value === 'string') {
      window.localStorage.setItem(key, value);
    } else {
      // Stringify and store the value
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (error) {
    console.error(`Error writing ${key} to localStorage:`, error);
  }
}

/**
 * Remove an item from localStorage with proper error handling and SSR awareness
 */
export function removeFromLocalStorage(key: string): void {
  // Check if running in a browser environment
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing ${key} from localStorage:`, error);
  }
}
