const memoryStore = new Map();

const getStorage = () => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    const testKey = '__smart_phonebook_storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return window.localStorage;
  } catch (_error) {
    return null;
  }
};

export const safeStorage = {
  getItem(key) {
    const storage = getStorage();
    if (storage) {
      return storage.getItem(key);
    }
    return memoryStore.get(key) || null;
  },

  setItem(key, value) {
    const storage = getStorage();
    if (storage) {
      storage.setItem(key, value);
      return;
    }
    memoryStore.set(key, value);
  },

  removeItem(key) {
    const storage = getStorage();
    if (storage) {
      storage.removeItem(key);
      return;
    }
    memoryStore.delete(key);
  },
};
