import { AssemblyPoint, EmergencyFacility, FaultLine, Earthquake } from '../types';

const DB_NAME = 'turkiye_afet_db';
const DB_VERSION = 2;
const STORE_EARTHQUAKES = 'afet_last_earthquakes';
const STORE_SETTINGS = 'afet_settings';
const STORE_FACILITIES = 'afet_emergency_facilities';
const STORE_ASSEMBLY = 'afet_assembly_points';
const STORE_FAULTS = 'afet_fault_lines';

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
      if (!db.objectStoreNames.contains(STORE_FACILITIES)) {
        db.createObjectStore(STORE_FACILITIES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_ASSEMBLY)) {
        db.createObjectStore(STORE_ASSEMBLY, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_FAULTS)) {
        db.createObjectStore(STORE_FAULTS, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveEarthquakesToDB(earthquakes: Earthquake[]): Promise<void> {
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

    localStorage.setItem(
      'afet_cached_earthquakes',
      JSON.stringify({
        data: earthquakes,
        timestamp: Date.now()
      })
    );
  } catch {
    try {
      localStorage.setItem(
        'afet_cached_earthquakes',
        JSON.stringify({
          data: earthquakes,
          timestamp: Date.now()
        })
      );
    } catch {
      // storage full or disabled
    }
  }
}

export async function getEarthquakesFromDB(): Promise<{ data: Earthquake[]; timestamp?: number }> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_EARTHQUAKES, 'readonly');
    const store = tx.objectStore(STORE_EARTHQUAKES);
    const result = await new Promise<Earthquake[]>((resolve, reject) => {
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

export async function saveFacilitiesToDB(facilities: EmergencyFacility[]): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_FACILITIES, 'readwrite');
    const store = tx.objectStore(STORE_FACILITIES);
    await new Promise<void>((resolve, reject) => {
      const clearReq = store.clear();
      clearReq.onsuccess = () => resolve();
      clearReq.onerror = () => reject(clearReq.error);
    });

    for (const fac of facilities) {
      store.put(fac);
    }
  } catch (err) {
    console.warn('[Storage] Facilities DB save error:', err);
  }
}

export async function getFacilitiesFromDB(): Promise<EmergencyFacility[]> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_FACILITIES, 'readonly');
    const store = tx.objectStore(STORE_FACILITIES);
    return await new Promise<EmergencyFacility[]>((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function saveAssemblyPointsToDB(points: AssemblyPoint[]): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_ASSEMBLY, 'readwrite');
    const store = tx.objectStore(STORE_ASSEMBLY);
    await new Promise<void>((resolve, reject) => {
      const clearReq = store.clear();
      clearReq.onsuccess = () => resolve();
      clearReq.onerror = () => reject(clearReq.error);
    });

    for (const pt of points) {
      store.put(pt);
    }
  } catch (err) {
    console.warn('[Storage] Assembly points DB save error:', err);
  }
}

export async function getAssemblyPointsFromDB(): Promise<AssemblyPoint[]> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_ASSEMBLY, 'readonly');
    const store = tx.objectStore(STORE_ASSEMBLY);
    return await new Promise<AssemblyPoint[]>((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function saveFaultLinesToDB(faults: FaultLine[]): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_FAULTS, 'readwrite');
    const store = tx.objectStore(STORE_FAULTS);
    await new Promise<void>((resolve, reject) => {
      const clearReq = store.clear();
      clearReq.onsuccess = () => resolve();
      clearReq.onerror = () => reject(clearReq.error);
    });

    for (const fl of faults) {
      store.put(fl);
    }
  } catch (err) {
    console.warn('[Storage] Fault lines DB save error:', err);
  }
}

export async function getFaultLinesFromDB(): Promise<FaultLine[]> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_FAULTS, 'readonly');
    const store = tx.objectStore(STORE_FAULTS);
    return await new Promise<FaultLine[]>((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

