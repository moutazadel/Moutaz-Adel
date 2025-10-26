// Fix: Import React to use React types like React.Dispatch.
import React, { useState, useEffect } from 'react';

export function useLocalStorage<T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const stored = JSON.parse(item);
        // If the initial value is an object, we expect the stored value to be one too for merging.
        if (initialValue != null && typeof initialValue === 'object' && !Array.isArray(initialValue)) {
            // If stored value is also a compatible object, merge them. This handles adding new keys to the state over time.
            if (stored != null && typeof stored === 'object' && !Array.isArray(stored)) {
                const merged = { ...(initialValue as object), ...stored };

                // --- Data Migration ---
                // Add portfolioName if it's missing from old data
                if (typeof (merged as any).portfolioName !== 'string' || (merged as any).portfolioName.trim() === '') {
                    (merged as any).portfolioName = 'محفظتي';
                }

                // Migrate single 'target: number' to 'targets: Target[]'
                if (typeof (merged as any).target === 'number' && (!Array.isArray((merged as any).targets) || (merged as any).targets.length === 0)) {
                  console.warn(`Migrating legacy 'target' to 'targets' array for key "${key}".`);
                  (merged as any).targets = [{
                    id: 'default_target',
                    name: 'الهدف الأولي',
                    amount: (merged as any).target
                  }];
                  delete (merged as any).target;
                }
                
                // --------------------

                // Ensure that properties that are arrays in the initial value remain arrays.
                // This prevents crashes if stored data has `null` for an array property.
                for (const k of Object.keys(initialValue)) {
                    const initialProp = (initialValue as any)[k];
                    const mergedProp = (merged as any)[k];
                    if (Array.isArray(initialProp) && !Array.isArray(mergedProp)) {
                        console.warn(`LocalStorage property "${k}" for key "${key}" was corrupted. Resetting to default.`);
                        (merged as any)[k] = initialProp;
                    }
                }
                
                return merged as T;
            }
            // If stored value is not a compatible object, it's corrupted/outdated. Fallback to the initial value.
            console.warn(`LocalStorage key "${key}" has invalid data. Falling back to initial value.`);
            return initialValue;
        }
        // For non-object types, or if the initial value is not an object, return the stored value as is.
        return stored;
      }
      return initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      const valueToStore = storedValue;
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}