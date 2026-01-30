/* eslint-disable no-undef */
const getChromeStorage = () => {
  if (typeof chrome !== 'undefined' && chrome?.storage?.sync) {
    return chrome.storage.sync;
  }
  return null;
};

export const chromeStorageService = {
  async get<T>(key: string): Promise<T | null> {
    const storage = getChromeStorage();

    if (!storage) {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) as T : null;
    }

    try {
      const result = await storage.get(key);
      return (result[key] as T) || null;
    } catch (error) {
      console.error('Error getting item from Chrome storage:', error);
      return null;
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    const storage = getChromeStorage();

    if (!storage) {
      localStorage.setItem(key, JSON.stringify(value));
      return;
    }

    try {
      await storage.set({ [key]: value });
    } catch (error) {
      console.error('Error setting item in Chrome storage:', error);
    }
  },

  async remove(key: string): Promise<void> {
    const storage = getChromeStorage();

    if (!storage) {
      localStorage.removeItem(key);
      return;
    }

    try {
      await storage.remove(key);
    } catch (error) {
      console.error('Error removing item from Chrome storage:', error);
    }
  },

  async clear(): Promise<void> {
    const storage = getChromeStorage();

    if (!storage) {
      localStorage.clear();
      return;
    }

    try {
      await storage.clear();
    } catch (error) {
      console.error('Error clearing Chrome storage:', error);
    }
  },
};
