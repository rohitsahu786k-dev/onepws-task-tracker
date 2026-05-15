import { useCallback, useState } from 'react';

export function useLocalStorage(key, initialValue = null) {
  const [value, setStoredValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((nextValue) => {
    setStoredValue((current) => {
      const resolved = typeof nextValue === 'function' ? nextValue(current) : nextValue;
      localStorage.setItem(key, JSON.stringify(resolved));
      return resolved;
    });
  }, [key]);

  const remove = useCallback(() => {
    localStorage.removeItem(key);
    setStoredValue(initialValue);
  }, [initialValue, key]);

  return [value, setValue, remove];
}

export default useLocalStorage;
