import {
  saveAssemblyPointsToDB,
  saveFacilitiesToDB,
  saveFaultLinesToDB
} from './storageService';
import { AssemblyPoint, EmergencyFacility, FaultLine } from '../types';

const CACHE_NAME = 'turkiye-afet-offline-v1';

export interface SyncProgress {
  progress: number;
  stage: string;
}

export async function syncCurrentRegionOffline(
  centerCoords: [number, number],
  onProgress?: (p: SyncProgress) => void
): Promise<{ success: boolean; cachedItems: number }> {
  try {
    onProgress?.({ progress: 10, stage: 'Acil durum veri setleri indiriliyor...' });

    const cache = await caches.open(CACHE_NAME);
    const dataUrls = [
      '/data/assembly-points.geojson',
      '/data/emergency-facilities.geojson',
      '/data/fault-lines.geojson',
      '/data/summary.json',
      '/data/istanbul.geojson',
      '/data/ankara.geojson',
      '/data/izmir.geojson',
      '/favicon.svg',
      '/icons/icon-192.svg',
      '/icons/icon-512.svg',
      'https://tiles.openfreemap.org/styles/dark',
      'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
    ];

    let cachedCount = 0;
    for (let i = 0; i < dataUrls.length; i++) {
      const url = dataUrls[i];
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
        if (res.ok) {
          await cache.put(url, res.clone());
          cachedCount++;

          // Dual-tier persist to IndexedDB
          if (url.includes('assembly-points.geojson')) {
            try {
              const geo = await res.json();
              if (geo.features) {
                const points: AssemblyPoint[] = geo.features.map((f: any) => ({
                  id: f.id || f.properties.id,
                  name: f.properties.name,
                  city: f.properties.city,
                  district: f.properties.district,
                  coordinates: f.geometry.coordinates as [number, number],
                  capacity: Number(f.properties.capacity || 0),
                  areaSqM: Number(f.properties.areaSqM || 0),
                  hasWater: f.properties.hasWater ?? true,
                  hasElectricity: f.properties.hasElectricity ?? true,
                  hasTentArea: f.properties.hasTentArea ?? true,
                  hasGenerator: f.properties.hasGenerator ?? true
                }));
                await saveAssemblyPointsToDB(points);
              }
            } catch {}
          } else if (url.includes('emergency-facilities.geojson')) {
            try {
              const geo = await res.json();
              if (geo.features) {
                const facilities: EmergencyFacility[] = geo.features.map((f: any) => ({
                  id: f.id || f.properties.id,
                  name: f.properties.name,
                  category: f.properties.category,
                  city: f.properties.city,
                  district: f.properties.district,
                  neighborhood: f.properties.neighborhood,
                  address: f.properties.address,
                  phone: f.properties.phone,
                  isDuty: Boolean(f.properties.isDuty),
                  closingHour: f.properties.closingHour,
                  dutyDate: f.properties.dutyDate,
                  typeText: f.properties.typeText,
                  emergencyBeds: Number(f.properties.emergencyBeds || 0),
                  hasTraumaCenter: Boolean(f.properties.hasTraumaCenter),
                  helipad: Boolean(f.properties.helipad),
                  coordinates: f.geometry.coordinates as [number, number]
                }));
                await saveFacilitiesToDB(facilities);
              }
            } catch {}
          } else if (url.includes('fault-lines.geojson')) {
            try {
              const geo = await res.json();
              if (geo.features) {
                const faults: FaultLine[] = geo.features.map((f: any) => ({
                  id: f.id || f.properties.name,
                  name: f.properties.name,
                  zone: f.properties.zone,
                  slipRateMmYear: Number(f.properties.slipRateMmYear || 0),
                  riskLevel: f.properties.riskLevel || 'high',
                  description: f.properties.description || '',
                  coordinates: f.geometry.coordinates as [number, number][]
                }));
                await saveFaultLinesToDB(faults);
              }
            } catch {}
          }
        }
      } catch {}
      const pct = 10 + Math.round(((i + 1) / dataUrls.length) * 55);
      onProgress?.({ progress: pct, stage: 'Çevrimdışı acil veriler depolanıyor...' });
    }

    // 2. Regional Map Vector Tiles (OpenFreeMap .pbf tiles covering centerCoords)
    onProgress?.({ progress: 70, stage: 'Bölgesel harita karoları önbelleğe alınıyor...' });
    const [lng, lat] = centerCoords;
    const tileUrls: string[] = [];

    // Preload zooms 11, 12, 13, 14 around user
    for (const z of [11, 12, 13, 14]) {
      const cx = long2tile(lng, z);
      const cy = lat2tile(lat, z);
      const radius = z <= 12 ? 1 : 1; // 3x3 grid around user
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          tileUrls.push(`https://tiles.openfreemap.org/planet/${z}/${cx + dx}/${cy + dy}.pbf`);
        }
      }
    }

    let tileCached = 0;
    await Promise.allSettled(
      tileUrls.map(async (tUrl) => {
        try {
          const tRes = await fetch(tUrl, { signal: AbortSignal.timeout(4000) });
          if (tRes.ok) {
            await cache.put(tUrl, tRes.clone());
            tileCached++;
          }
        } catch {}
      })
    );
    cachedCount += tileCached;

    onProgress?.({ progress: 100, stage: 'Çevrimdışı Koruma Aktif!' });

    localStorage.setItem('afet_offline_protection', 'true');
    localStorage.setItem('afet_offline_synced_at', String(Date.now()));

    return { success: true, cachedItems: cachedCount };
  } catch {
    return { success: false, cachedItems: 0 };
  }
}

export function isOfflineProtected(): boolean {
  return localStorage.getItem('afet_offline_protection') === 'true';
}

export function long2tile(lon: number, zoom: number): number {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}

export function lat2tile(lat: number, zoom: number): number {
  return Math.floor(
    ((1 -
      Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) /
        Math.PI) /
      2) *
      Math.pow(2, zoom)
  );
}

