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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function idbGet(key: string): Promise<any> {
  try {
    const db = await openDB();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new Promise<any>((resolve, reject) => {
      const tx = db.transaction("datasets", "readonly");
      const store = tx.objectStore("datasets");
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function idbSet(key: string, value: any): Promise<void> {
  try {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction("datasets", "readwrite");
      const store = tx.objectStore("datasets");
      const shouldWrap =
        typeof key === "string" &&
        (key.startsWith("summary:") || key.startsWith("raw:"));
      const toStore = shouldWrap
        ? {
            data: value,
            timestamp: Date.now(),
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
          }
        : value;
      const req = store.put(toStore, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // ignore
  }
}

export async function idbDelete(key: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction("datasets", "readwrite");
      const store = tx.objectStore("datasets");
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // ignore
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function idbGetUnwrapped(key: string): Promise<any> {
  const val = await idbGet(key);
  try {
    if (!val) return null;
    if (val && typeof val === "object" && "expiresAt" in val) {
      const now = Date.now();
      if (typeof val.expiresAt === "number" && now > val.expiresAt) {
        await idbDelete(key);
        return null;
      }
      return "data" in val ? val.data : val;
    }
    return val;
  } catch {
    return null;
  }
}

export async function idbClearExpired(prefix?: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction("datasets", "readwrite");
      const store = tx.objectStore("datasets");
      const req = store.openCursor();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      req.onsuccess = (event: any) => {
        const cursor = event.target.result;
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
            if (
              typeof value.expiresAt === "number" &&
              Date.now() > value.expiresAt
            ) {
              cursor.delete();
            }
          }
        } catch {
          try {
            cursor.delete();
          } catch {
            /* ignore */
          }
        }
        cursor.continue();
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    // ignore
  }
}
