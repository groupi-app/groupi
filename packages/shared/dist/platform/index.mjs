// src/platform/navigation.ts
var navigationAdapter = null;
function setNavigationAdapter(adapter) {
  navigationAdapter = adapter;
}
function getNavigationAdapter() {
  if (!navigationAdapter) {
    throw new Error(
      "Navigation adapter not set. Call setNavigationAdapter() first."
    );
  }
  return navigationAdapter;
}
var navigation = {
  /**
   * Navigate to a new screen/page
   */
  push(path) {
    getNavigationAdapter().push(path);
  },
  /**
   * Replace current screen/page
   */
  replace(path) {
    getNavigationAdapter().replace(path);
  },
  /**
   * Go back to previous screen/page
   */
  back() {
    getNavigationAdapter().back();
  },
  /**
   * Check if navigation can go back
   */
  canGoBack() {
    return getNavigationAdapter().canGoBack();
  }
};
function useNavigation() {
  return navigation;
}

// src/platform/storage.ts
var storageAdapter = null;
function setStorageAdapter(adapter) {
  storageAdapter = adapter;
}
function getStorageAdapter() {
  if (!storageAdapter) {
    throw new Error("Storage adapter not set. Call setStorageAdapter() first.");
  }
  return storageAdapter;
}
var storage = {
  /**
   * Get item from storage
   */
  async getItem(key) {
    return getStorageAdapter().getItem(key);
  },
  /**
   * Set item in storage
   */
  async setItem(key, value) {
    return getStorageAdapter().setItem(key, value);
  },
  /**
   * Remove item from storage
   */
  async removeItem(key) {
    return getStorageAdapter().removeItem(key);
  },
  /**
   * Clear all items from storage
   */
  async clear() {
    return getStorageAdapter().clear();
  },
  /**
   * Get JSON item from storage
   */
  async getJSON(key) {
    const item = await getStorageAdapter().getItem(key);
    if (item === null) return null;
    try {
      return JSON.parse(item);
    } catch {
      return null;
    }
  },
  /**
   * Set JSON item in storage
   */
  async setJSON(key, value) {
    return getStorageAdapter().setItem(key, JSON.stringify(value));
  }
};
function useStorage() {
  return storage;
}

// src/platform/toast.ts
var toastAdapter = null;
function setToastAdapter(adapter) {
  toastAdapter = adapter;
}
function getToastAdapter() {
  if (!toastAdapter) {
    throw new Error("Toast adapter not set. Call setToastAdapter() first.");
  }
  return toastAdapter;
}
var toast = {
  /**
   * Show a toast with full options
   */
  show(options) {
    getToastAdapter().show(options);
  },
  /**
   * Show a success toast
   */
  success(message, title) {
    getToastAdapter().success(message, title);
  },
  /**
   * Show an error toast
   */
  error(message, title) {
    getToastAdapter().error(message, title);
  },
  /**
   * Show an info toast
   */
  info(message, title) {
    getToastAdapter().info(message, title);
  }
};
function useToast() {
  return toast;
}

export { getNavigationAdapter, getStorageAdapter, getToastAdapter, navigation, setNavigationAdapter, setStorageAdapter, setToastAdapter, storage, toast, useNavigation, useStorage, useToast };
//# sourceMappingURL=index.mjs.map
//# sourceMappingURL=index.mjs.map