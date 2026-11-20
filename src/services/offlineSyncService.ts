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

export interface SyncResult {
  /** Yalnızca üç temel veri seti (toplanma alanları, tesisler, fay hatları) gerçekten kaydedildiyse true. */
  success: boolean;
  /** Gerçekten kaydedilen dosya sayısı (veri + harita karosu). */
  cachedItems: number;
  /** Kaydedilmesi denenen toplam dosya sayısı. */
  totalItems: number;
  /** Temel veri setlerinin üçü de kaydedildi mi? */
  coreOk: boolean;
  /** Kaydedilen harita karosu sayısı. */
  tilesCached: number;
  /** Denenen harita karosu sayısı (konum yoksa ya da karo adresi bulunamadıysa 0). */
  tilesTotal: number;
}

const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/dark';
const CORE_DATASETS = ['assembly-points.geojson', 'emergency-facilities.geojson', 'fault-lines.geojson'];

/**
 * Harita karolarının gerçek adres şablonunu stil dosyasından okur
 * (stil → kaynak → TileJSON → tiles[0]). Şablon bulunamazsa null döner;
 * adres tahmin edilmez.
 */
async function resolveVectorTileTemplate(): Promise<string | null> {
  try {
    const styleRes = await fetch(MAP_STYLE_URL, { signal: AbortSignal.timeout(8000) });
    if (!styleRes.ok) return null;
    const style = await styleRes.json();
    const sources = style && typeof style.sources === 'object' ? Object.values(style.sources as Record<string, any>) : [];
    for (const src of sources) {
      if (!src || src.type !== 'vector') continue;
      if (Array.isArray(src.tiles) && typeof src.tiles[0] === 'string') return src.tiles[0];
      if (typeof src.url === 'string') {
        try {
          const tjRes = await fetch(src.url, { signal: AbortSignal.timeout(8000) });
          if (!tjRes.ok) continue;
          const tj = await tjRes.json();
          if (tj && Array.isArray(tj.tiles) && typeof tj.tiles[0] === 'string') return tj.tiles[0];
        } catch {}
      }
    }
  } catch {}
  return null;
}

/**
 * Temel verileri ve (konum verilmişse) çevredeki harita karolarını bu cihaza kaydeder.
 * Sonuç olduğu gibi bildirilir: hiçbir şey kaydedilemediyse "başarılı" denmez.
 * centerCoords null ise harita karosu indirilmez.
 */
export async function syncCurrentRegionOffline(
  centerCoords: [number, number] | null,
  onProgress?: (p: SyncProgress) => void
): Promise<SyncResult> {
  const failed: SyncResult = { success: false, cachedItems: 0, totalItems: 0, coreOk: false, tilesCached: 0, tilesTotal: 0 };
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
      MAP_STYLE_URL,
      'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
    ];

    let cachedCount = 0;
    const coreStored = new Set<string>();
    for (let i = 0; i < dataUrls.length; i++) {
      const url = dataUrls[i];
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
        if (res.ok) {
          await cache.put(url, res.clone());
          cachedCount++;
          const coreName = CORE_DATASETS.find((name) => url.includes(name));
          if (coreName) coreStored.add(coreName);

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
                  areaSqM: Number(f.properties.areaSqM || 0)
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
                  bedCapacity: Number(f.properties.bedCapacity) > 0 ? Number(f.properties.bedCapacity) : undefined,
                  openingHours: f.properties.openingHours || undefined,
                  source: f.properties.source || undefined,
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
      onProgress?.({ progress: pct, stage: 'Veriler kaydediliyor...' });
    }

    // 2. Regional map vector tiles around centerCoords (only with a location and a resolved tile address)
    onProgress?.({ progress: 70, stage: 'Çevredeki harita karoları kaydediliyor...' });
    const tileUrls: string[] = [];
    const tileTemplate = centerCoords ? await resolveVectorTileTemplate() : null;

    if (centerCoords && tileTemplate) {
      const [lng, lat] = centerCoords;
      // Zooms 11-14, 3x3 grid around the location
      for (const z of [11, 12, 13, 14]) {
        const cx = long2tile(lng, z);
        const cy = lat2tile(lat, z);
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            tileUrls.push(
              tileTemplate
                .replace('{z}', String(z))
                .replace('{x}', String(cx + dx))
                .replace('{y}', String(cy + dy))
            );
          }
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

    const totalItems = dataUrls.length + tileUrls.length;
    const coreOk = CORE_DATASETS.every((name) => coreStored.has(name));

    onProgress?.({
      progress: 100,
      stage: coreOk
        ? `Kaydedildi: ${cachedCount}/${totalItems} dosya`
        : `Çevrimdışı kayıt tamamlanamadı (${cachedCount}/${totalItems} dosya)`
    });

    // "Kayıtlı" işareti yalnızca temel veriler gerçekten kaydedildiyse konur.
    if (coreOk) {
      try {
        localStorage.setItem('afet_offline_protection', 'true');
        localStorage.setItem('afet_offline_synced_at', String(Date.now()));
      } catch {}
    }

    return {
      success: coreOk,
      cachedItems: cachedCount,
      totalItems,
      coreOk,
      tilesCached: tileCached,
      tilesTotal: tileUrls.length
    };
  } catch {
    return failed;
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

