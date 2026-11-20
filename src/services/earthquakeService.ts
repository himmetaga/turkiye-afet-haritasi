import { Earthquake } from '../types';
import { saveEarthquakesToDB, getEarthquakesFromDB } from './storageService';
import { sanitizeExternalText } from '../utils/safeText';

const PRIMARY_API = 'https://api.orhanaydogdu.com.tr/deprem/kandilli/live?limit=60';
const SECONDARY_API = 'https://api.orhanaydogdu.com.tr/deprem/afad/live?limit=60';
const TERTIARY_EMSC_API = 'https://www.seismicportal.eu/fdsnws/event/1/query?format=json&limit=50&minlat=35&maxlat=43&minlon=25&maxlon=45';
const QUATERNARY_USGS_API = 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=2.2&minlatitude=35&maxlatitude=43&minlongitude=25&maxlongitude=45&limit=50';
const TIMEOUT_MS = 5000;

/**
 * Deprem kayıtları üçüncü taraf API'lerden gelir ve arayüzde innerHTML ile çizilir;
 * bu yüzden metin alanları burada temizlenir, sayılar doğrulanır.
 */
function cleanEarthquakes(list: Earthquake[]): Earthquake[] {
  return list
    .filter(
      (eq) =>
        eq &&
        Array.isArray(eq.coordinates) &&
        Number.isFinite(eq.coordinates[0]) &&
        Number.isFinite(eq.coordinates[1]) &&
        Number.isFinite(eq.mag)
    )
    .map((eq) => ({
      ...eq,
      id: sanitizeExternalText(String(eq.id ?? '')),
      title: sanitizeExternalText(String(eq.title ?? '')),
      location: sanitizeExternalText(String(eq.location ?? '')),
      date: sanitizeExternalText(String(eq.date ?? '')),
      depth: Number.isFinite(eq.depth) ? eq.depth : 0,
      timestamp: Number.isFinite(eq.timestamp) ? eq.timestamp : Date.now()
    }));
}

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

function parseGeoJsonEarthquakes(json: any, sourceName: string): Earthquake[] {
  if (!json || !Array.isArray(json.features)) return [];
  return json.features
    .map((feat: any, idx: number) => {
      const props = feat.properties || {};
      const geom = feat.geometry || {};
      const coords = geom.coordinates || [0, 0];
      const lon = Number(coords[0]);
      const lat = Number(coords[1]);
      const depth = Math.abs(Number(coords[2] ?? props.depth ?? 10));
      const mag = Number(props.mag || props.mag_b || 0);
      const timeMs = props.time
        ? typeof props.time === 'number'
          ? props.time
          : new Date(props.time).getTime()
        : Date.now();
      const loc = (props.flynn_region || props.place || props.title || 'Türkiye Bölgesi').trim();
      const d = new Date(timeMs);
      const dateStr = d.toISOString().replace('T', ' ').slice(0, 19);

      return {
        id: feat.id || `${sourceName}-${idx}-${timeMs}`,
        title: `${loc} (M${mag.toFixed(1)})`,
        location: loc,
        mag: Number(mag.toFixed(1)),
        depth: Number(depth.toFixed(1)),
        coordinates: [lon, lat] as [number, number],
        date: dateStr,
        timestamp: timeMs
      };
    })
    .filter(
      (eq: Earthquake) =>
        !isNaN(eq.coordinates[0]) &&
        !isNaN(eq.coordinates[1]) &&
        eq.coordinates[0] >= 25 &&
        eq.coordinates[0] <= 45 &&
        eq.coordinates[1] >= 35 &&
        eq.coordinates[1] <= 43
    );
}

export async function fetchLiveEarthquakes(): Promise<{ earthquakes: Earthquake[]; isOffline: boolean; cachedTime?: number }> {
  try {
    // 1. Birincil: Kandilli Rasathanesi
    let res = await fetchWithTimeout(PRIMARY_API).catch(() => null);
    if (res && res.ok) {
      const data = await res.json();
      const list = cleanEarthquakes(parseOrhanAydogdu(data));
      if (list.length > 0) {
        await saveEarthquakesToDB(list);
        return { earthquakes: list, isOffline: false };
      }
    }

    // 2. İkincil: AFAD Deprem Dairesi
    res = await fetchWithTimeout(SECONDARY_API).catch(() => null);
    if (res && res.ok) {
      const data = await res.json();
      const list = cleanEarthquakes(parseOrhanAydogdu(data));
      if (list.length > 0) {
        await saveEarthquakesToDB(list);
        return { earthquakes: list, isOffline: false };
      }
    }

    // 3. Üçüncül: EMSC (Avrupa-Akdeniz Sismoloji Merkezi)
    res = await fetchWithTimeout(TERTIARY_EMSC_API).catch(() => null);
    if (res && res.ok) {
      const data = await res.json();
      const list = cleanEarthquakes(parseGeoJsonEarthquakes(data, 'emsc'));
      if (list.length > 0) {
        await saveEarthquakesToDB(list);
        return { earthquakes: list, isOffline: false };
      }
    }

    // 4. Dördüncül: USGS Küresel Deprem Ağı
    res = await fetchWithTimeout(QUATERNARY_USGS_API).catch(() => null);
    if (res && res.ok) {
      const data = await res.json();
      const list = cleanEarthquakes(parseGeoJsonEarthquakes(data, 'usgs'));
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
      earthquakes: cleanEarthquakes(cached.data as Earthquake[]),
      isOffline: true,
      cachedTime: cached.timestamp
    };
  }

  // Ne canlı kaynak ne de önbellek var: örnek/uydurma deprem GÖSTERİLMEZ, liste boş döner.
  return { earthquakes: [], isOffline: true };
}
