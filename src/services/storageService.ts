const DB_NAME = 'turkiye_afet_db';
const DB_VERSION = 1;
const STORE_EARTHQUAKES = 'afet_last_earthquakes';
const STORE_SETTINGS = 'afet_settings';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_EARTHQUAKES)) {
        db.createObjectStore(STORE_EARTHQUAKES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveEarthquakesToDB(earthquakes: any[]): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_EARTHQUAKES, 'readwrite');
    const store = tx.objectStore(STORE_EARTHQUAKES);
    await new Promise<void>((resolve, reject) => {
      const clearReq = store.clear();
      clearReq.onsuccess = () => resolve();
      clearReq.onerror = () => reject(clearReq.error);
    });

    for (const eq of earthquakes) {
      store.put(eq);
    }

    localStorage.setItem('afet_cached_earthquakes', JSON.stringify({
      data: earthquakes,
      timestamp: Date.now()
    }));
  } catch {
    try {
      localStorage.setItem('afet_cached_earthquakes', JSON.stringify({
        data: earthquakes,
        timestamp: Date.now()
      }));
    } catch {
      // storage full or disabled
    }
  }
}

export async function getEarthquakesFromDB(): Promise<{ data: any[]; timestamp?: number }> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_EARTHQUAKES, 'readonly');
    const store = tx.objectStore(STORE_EARTHQUAKES);
    const result = await new Promise<any[]>((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    if (result && result.length > 0) {
      const raw = localStorage.getItem('afet_cached_earthquakes');
      let timestamp = Date.now();
      if (raw) {
        try {
          timestamp = JSON.parse(raw).timestamp || timestamp;
        } catch {}
      }
      return { data: result, timestamp };
    }
  } catch {
    // fallback to localStorage
  }

  try {
    const raw = localStorage.getItem('afet_cached_earthquakes');
    if (raw) {
      const parsed = JSON.parse(raw);
      return { data: parsed.data || [], timestamp: parsed.timestamp };
    }
  } catch {}

  return { data: [] };
}
