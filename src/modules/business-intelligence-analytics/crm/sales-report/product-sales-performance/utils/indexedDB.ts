// Lightweight IndexedDB helper for storing raw and summarized datasets
export async function openDB(dbName = "bia-cache", version = 1) {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(dbName, version);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("datasets")) {
        db.createObjectStore("datasets");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function idbGet(key: string): Promise<unknown | null> {
  try {
    const db = await openDB();
    return new Promise<unknown>((resolve, reject) => {
      const tx = db.transaction("datasets", "readonly");
      const store = tx.objectStore("datasets");
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error("idbGet error", e);
    return null;
  }
}

export async function idbSet(key: string, value: unknown): Promise<void> {
  try {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction("datasets", "readwrite");
      const store = tx.objectStore("datasets");
      // Wrap summaries/raw data with expiry metadata so we can clean them up later.
      const shouldWrap =
        typeof key === "string" &&
        (key.startsWith("summary:") || key.startsWith("raw:"));
      const toStore = shouldWrap
        ? {
            data: value,
            timestamp: Date.now(),
            // Expires in 7 days. If fresh data is written, this will overwrite the
            // existing entry and reset the expiry to another 7 days from now.
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
          }
        : value;
      const req = store.put(toStore, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error("idbSet error", e);
  }
}

export async function idbDelete(key: string) {
  try {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction("datasets", "readwrite");
      const store = tx.objectStore("datasets");
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error("idbDelete error", e);
  }
}

/**
 * Get entry and automatically unwrap envelope and remove expired entries.
 */
export async function idbGetUnwrapped(key: string) {
  const val = await idbGet(key);
  try {
    if (!val) return null;
    // If this is an envelope with expiresAt
    if (val && typeof val === "object" && "expiresAt" in val) {
      const now = Date.now();
      if (typeof val.expiresAt === "number" && now > val.expiresAt) {
        // expired - remove
        await idbDelete(key);
        return null;
      }
      return "data" in val ? val.data : val;
    }
    return val;
  } catch (e) {
    console.error("idbGetUnwrapped error", e);
    return null;
  }
}

/**
 * Clear expired entries in the `datasets` object store. If `prefix` is provided,
 * only keys that start with the prefix will be considered.
 */
export async function idbClearExpired(prefix?: string) {
  try {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction("datasets", "readwrite");
      const store = tx.objectStore("datasets");
      const req = store.openCursor();
      req.onsuccess = async (event: Event) => {
        const cursor = (event.target as IDBRequest).result;
        if (!cursor) {
          resolve();
          return;
        }
        try {
          const key = cursor.key as string;
          if (prefix && !key.startsWith(prefix)) {
            cursor.continue();
            return;
          }
          const value = cursor.value;
          if (value && typeof value === "object" && "expiresAt" in value) {
            const now = Date.now();
            if (typeof value.expiresAt === "number" && now > value.expiresAt) {
              cursor.delete();
            }
          }
        } catch (err) {
          void err;
          // ignore malformed entries and delete them
          try {
            cursor.delete();
          } catch {}
        }
        cursor.continue();
      };
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.error("Error clearing expired IndexedDB entries:", error);
  }
}
