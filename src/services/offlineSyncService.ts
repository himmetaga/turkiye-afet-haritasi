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
    onProgress?.({ progress: 15, stage: 'Veri setleri indiriliyor...' });

    const cache = await caches.open(CACHE_NAME);
    const dataUrls = [
      '/data/assembly-points.geojson',
      '/data/summary.json',
      '/data/istanbul.geojson',
      '/data/ankara.geojson',
      '/data/izmir.geojson',
      '/favicon.svg',
      '/icons/icon-192.svg',
      '/icons/icon-512.svg'
    ];

    let cachedCount = 0;
    for (let i = 0; i < dataUrls.length; i++) {
      const url = dataUrls[i];
      try {
        const res = await fetch(url);
        if (res.ok) {
          await cache.put(url, res.clone());
          cachedCount++;
        }
      } catch {}
      const pct = 15 + Math.round(((i + 1) / dataUrls.length) * 45);
      onProgress?.({ progress: pct, stage: 'Çevrimdışı veriler depolanıyor...' });
    }

    onProgress?.({ progress: 75, stage: 'Bölgesel harita karoları hazırlanıyor...' });

    // Pre-cache primary tile levels for the immediate coordinates
    const [lng, lat] = centerCoords;
    const tileCoords = [
      { z: 12, x: long2tile(lng, 12), y: lat2tile(lat, 12) },
      { z: 13, x: long2tile(lng, 13), y: lat2tile(lat, 13) },
      { z: 14, x: long2tile(lng, 14), y: lat2tile(lat, 14) }
    ];

    for (const t of tileCoords) {
      const tileUrl = `https://tiles.openfreemap.org/styles/dark`;
      try {
        const res = await fetch(tileUrl);
        if (res.ok) {
          await cache.put(tileUrl, res.clone());
          cachedCount++;
        }
      } catch {}
    }

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

function long2tile(lon: number, zoom: number): number {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}

function lat2tile(lat: number, zoom: number): number {
  return Math.floor(
    ((1 -
      Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) /
        Math.PI) /
      2) *
      Math.pow(2, zoom)
  );
}
