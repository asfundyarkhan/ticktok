/**
 * Custom hook for safely storing and retrieving state from localStorage
 * with built-in protection against infinite update loops
 */

import { useState, useEffect, useRef } from 'react';
import { getFromLocalStorage, setToLocalStorage } from './localStorage';

/**
 * A hook that syncs state with localStorage while preventing infinite update loops
 * 
 * @param key - The localStorage key to store the value under
 * @param initialValue - The initial value to use if nothing exists in localStorage
 * @returns [storedValue, setValue] - A tuple with the current value and a function to update it
 */
export function useLocalStorageState<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Only create the state once, using a function to compute it from localStorage if available
  const [storedValue, setStoredValue] = useState<T>(() => {
    return getFromLocalStorage<T>(key, initialValue);
  });
  
  // Keep track of the previous value to prevent unnecessary localStorage updates
  const prevValueRef = useRef<T>(storedValue);
  
  // Helper function for deep equality check of objects and arrays
  const isEqual = (a: T, b: T): boolean => {
    if (a === b) return true;
    
    // For objects and arrays, do a deep comparison
    if (typeof a === 'object' && a !== null && typeof b === 'object' && b !== null) {
      return JSON.stringify(a) === JSON.stringify(b);
    }
    
    return false;
  };

  // Update the value in localStorage when it changes
  useEffect(() => {
    // Only update localStorage if the value has actually changed
    if (!isEqual(prevValueRef.current, storedValue)) {
      setToLocalStorage(key, storedValue);
      prevValueRef.current = storedValue;
    }
  }, [key, storedValue]);

  // Wrapper around setState that updates both state and localStorage
  const setValue = (value: T | ((val: T) => T)): void => {
    try {
      // Allow value to be a function for the same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // localStorage update is handled by the useEffect
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

/**
 * Example usage:
 * 
 * // In a component
 * const [name, setName] = useLocalStorageState<string>('name', 'Default Name');
 * 
 * // Update the value
 * setName('New Name');
 * 
 * // Use with functional updates
 * setName(prevName => prevName + ' Updated');
 */
