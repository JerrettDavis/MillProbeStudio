// src/utils/functional.ts
// Functional utilities for declarative programming patterns

// Higher-order functions for state management
export const createStateUpdater = <T>() => ({
  // Deep update utility for nested objects
  updateNested: <K extends keyof T>(
    setState: (updater: (prev: T) => T) => void,
    path: K,
    value: T[K] | ((prev: T[K]) => T[K])
  ) => {
    setState(prev => ({
      ...prev,
      [path]: typeof value === 'function' ? (value as (prev: T[K]) => T[K])(prev[path]) : value
    }));
  },

  // Batch multiple updates
  updateMultiple: (
    setState: (updater: (prev: T) => T) => void,
    updates: Partial<T>
  ) => {
    setState(prev => ({ ...prev, ...updates }));
  },

  // Update array element by index
  updateArrayElement: <K extends keyof T>(
    setState: (updater: (prev: T) => T) => void,
    arrayKey: K,
    index: number,
    value: T[K] extends (infer U)[] ? U : never
  ) => {
    setState(prev => ({
      ...prev,
      [arrayKey]: (prev[arrayKey] as unknown[]).map((item, i) => 
        i === index ? value : item
      )
    }));
  }
});

// Input validation utilities
export const validators = {
  number: (value: string, min?: number, max?: number): number => {
    const num = parseFloat(value) || 0;
    if (min !== undefined && num < min) return min;
    if (max !== undefined && num > max) return max;
    return num;
  },

  clamp: (value: number, min: number, max: number): number => 
    Math.max(min, Math.min(max, value)),

  parseFloat: (value: string, fallback = 0): number => 
    parseFloat(value) || fallback,

  isValidNumber: (value: string): boolean => 
    !isNaN(parseFloat(value)) && isFinite(parseFloat(value))
};

// Array manipulation utilities
export const arrays = {
  updateAt: <T>(array: T[], index: number, value: T): T[] =>
    array.map((item, i) => i === index ? value : item),

  removeAt: <T>(array: T[], index: number): T[] =>
    array.filter((_, i) => i !== index),

  move: <T>(array: T[], fromIndex: number, toIndex: number): T[] => {
    const newArray = [...array];
    const [removed] = newArray.splice(fromIndex, 1);
    newArray.splice(toIndex, 0, removed);
    return newArray;
  },

  findByProperty: <T, K extends keyof T>(
    array: T[], 
    property: K, 
    value: T[K]
  ): T | undefined =>
    array.find(item => item[property] === value),

  updateByProperty: <T, K extends keyof T>(
    array: T[], 
    property: K, 
    value: T[K], 
    updates: Partial<T>
  ): T[] =>
    array.map(item => 
      item[property] === value ? { ...item, ...updates } : item
    )
};

// Object utilities
export const objects = {
  pick: <T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> =>
    keys.reduce((acc, key) => ({ ...acc, [key]: obj[key] }), {} as Pick<T, K>),

  omit: <T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
    const result = { ...obj };
    keys.forEach(key => delete result[key]);
    return result;
  },

  mapValues: <T, U>(
    obj: Record<string, T>, 
    mapper: (value: T, key: string) => U
  ): Record<string, U> =>
    Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, mapper(value, key)])
    ),

  isEmpty: (obj: object): boolean => Object.keys(obj).length === 0
};

// Function composition utilities
export const compose = {
  pipe: <T>(...fns: Array<(arg: T) => T>) => (value: T): T =>
    fns.reduce((acc, fn) => fn(acc), value),

  debounce: <T extends (...args: unknown[]) => void>(
    fn: T, 
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  },

  throttle: <T extends (...args: unknown[]) => void>(
    fn: T, 
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let lastCall = 0;
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        fn(...args);
      }
    };
  }
};

// Conditional execution utilities
export const conditionally = {
  when: <T>(condition: boolean, value: T): T | undefined =>
    condition ? value : undefined,

  ifElse: <T>(condition: boolean, trueValue: T, falseValue: T): T =>
    condition ? trueValue : falseValue,

  maybe: <T, U>(value: T | null | undefined, mapper: (value: T) => U): U | undefined =>
    value != null ? mapper(value) : undefined
};

// ID generation utility
export const generateId = (prefix = 'id'): string => 
  `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Type-safe event handling
export const eventHandlers = {
  inputValue: (handler: (value: string) => void) => 
    (e: React.ChangeEvent<HTMLInputElement>) => handler(e.target.value),

  inputNumberValue: (handler: (value: number) => void, min?: number, max?: number) => 
    (e: React.ChangeEvent<HTMLInputElement>) => 
      handler(validators.number(e.target.value, min, max)),

  selectValue: (handler: (value: string) => void) => 
    (value: string) => handler(value)
};
