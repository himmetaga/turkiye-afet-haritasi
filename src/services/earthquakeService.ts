import { Earthquake } from '../types';
import { saveEarthquakesToDB, getEarthquakesFromDB } from './storageService';

const PRIMARY_API = 'https://api.orhanaydogdu.com.tr/deprem/kandilli/live?limit=60';
const SECONDARY_API = 'https://api.orhanaydogdu.com.tr/deprem/afad/live?limit=60';
const TIMEOUT_MS = 5000;

const BASELINE_EARTHQUAKES: Earthquake[] = [
  {
    id: 'base-eq-01',
    title: 'MARMARA DENIZI (SILIVRI ACIKLARI)',
    location: 'Marmara Denizi (Silivri)',
    mag: 3.4,
    depth: 9.8,
    coordinates: [28.182, 40.852],
    date: '2025.01.15 14:22:10',
    timestamp: Date.now() - 3600000 * 2
  },
  {
    id: 'base-eq-02',
    title: 'EGE DENIZI (GOKOVA KORFEZI)',
    location: 'Muğla (Gökova Körfezi)',
    mag: 4.2,
    depth: 7.2,
    coordinates: [27.785, 36.920],
    date: '2025.01.15 11:15:00',
    timestamp: Date.now() - 3600000 * 5
  },
  {
    id: 'base-eq-03',
    title: 'KAHRAMANMARAS (PAZARCIK)',
    location: 'Kahramanmaraş (Pazarcık)',
    mag: 3.1,
    depth: 8.5,
    coordinates: [37.310, 37.490],
    date: '2025.01.15 08:40:12',
    timestamp: Date.now() - 3600000 * 8
  },
  {
    id: 'base-eq-04',
    title: 'CANAKKALE (AYVACIK)',
    location: 'Çanakkale (Ayvacık)',
    mag: 2.8,
    depth: 10.1,
    coordinates: [26.250, 39.580],
    date: '2025.01.15 06:12:00',
    timestamp: Date.now() - 3600000 * 10
  },
  {
    id: 'base-eq-05',
    title: 'MALATYA (YESILYURT)',
    location: 'Malatya (Yeşilyurt)',
    mag: 3.8,
    depth: 6.4,
    coordinates: [38.250, 38.290],
    date: '2025.01.15 03:05:44',
    timestamp: Date.now() - 3600000 * 13
  }
];

async function fetchWithTimeout(url: string, timeout = TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

function parseOrhanAydogdu(json: any): Earthquake[] {
  if (!json || !Array.isArray(json.result)) return [];
  return json.result.map((item: any, idx: number) => {
    const coords = item.geojson?.coordinates || [item.lng, item.lat];
    const mag = Number(item.mag || item.ml || item.mw || 0);
    const depth = Number(item.depth || 0);
    return {
      id: item._id || item.earthquake_id || `eq-${idx}-${Date.now()}`,
      title: item.title || item.location || 'Deprem',
      location: item.location || item.title || '',
      mag,
      depth,
      coordinates: [Number(coords[0]), Number(coords[1])],
      date: item.date || item.date_time || '',
      timestamp: item.date_time ? new Date(item.date_time).getTime() : Date.now()
    };
  });
}

export async function fetchLiveEarthquakes(): Promise<{ earthquakes: Earthquake[]; isOffline: boolean; cachedTime?: number }> {
  try {
    let res = await fetchWithTimeout(PRIMARY_API).catch(() => null);
    if (!res || !res.ok) {
      res = await fetchWithTimeout(SECONDARY_API).catch(() => null);
    }

    if (res && res.ok) {
      const data = await res.json();
      const list = parseOrhanAydogdu(data);
      if (list.length > 0) {
        await saveEarthquakesToDB(list);
        return { earthquakes: list, isOffline: false };
      }
    }
  } catch {
    // network or parse error
  }

  const cached = await getEarthquakesFromDB();
  if (cached.data && cached.data.length > 0) {
    return {
      earthquakes: cached.data as Earthquake[],
      isOffline: true,
      cachedTime: cached.timestamp
    };
  }

  return {
    earthquakes: BASELINE_EARTHQUAKES,
    isOffline: true,
    cachedTime: Date.now()
  };
}
