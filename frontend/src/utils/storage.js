export const storage = {
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      // Try to parse as JSON, if it fails return as string
      try {
        return JSON.parse(item);
      } catch {
        return item;
      }
    } catch {
      return null;
    }
  },
  set: (key, value) => {
    try {
      // Store strings as-is, objects as JSON
      if (typeof value === 'string') {
        localStorage.setItem(key, value);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },
  remove: (key) => {
    localStorage.removeItem(key);
  },
  clear: () => {
    localStorage.clear();
  },
};

