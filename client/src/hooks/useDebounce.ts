import { useState, useEffect } from 'react';

/**
 * Hook that debounces a value, useful for auto-save functionality
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds
 * @returns The debounced value
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up a timer to update the debounced value after the delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clear the timeout if value changes before delay is complete
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};