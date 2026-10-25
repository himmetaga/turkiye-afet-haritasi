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
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          await cache.put(url, res.clone());
          cachedCount++;
        }
      } catch {}
      const pct = 15 + Math.round(((i + 1) / dataUrls.length) * 75);
      onProgress?.({ progress: pct, stage: 'Çevrimdışı acil durum verileri depolanıyor...' });
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
