/**
 * Konumun NEREDEN geldiğini izler.
 *
 * Uygulama açılışta varsayılan bir harita merkeziyle başlar; konum izni yoksa
 * IP'den şehir düzeyinde tahmin yapılır, paylaşılan bağlantılar da koordinat taşır.
 * Bunların hiçbiri kullanıcının gerçek konumu değildir. Acil durum mesajlarına
 * ("konumum şurası") yalnızca cihazın kendi GPS ölçümü yazılabilir.
 */

export type LocationSource = 'gps' | 'cached' | 'ip' | 'shared' | 'none';

let source: LocationSource = 'none';
let fixTime: number | null = null;

export function setLocationSource(next: LocationSource, time: number | null = Date.now()): void {
  source = next;
  fixTime = next === 'none' ? null : time;
}

export function getLocationSource(): LocationSource {
  return source;
}

/** Cihazın bu oturumda aldığı gerçek GPS ölçümü var mı? */
export function hasGpsFix(): boolean {
  return source === 'gps';
}

/** Mesaja konum yazılabilir mi? (bu oturumdaki GPS ya da daha önce kaydedilmiş GPS ölçümü) */
export function hasUsableLocation(): boolean {
  return source === 'gps' || source === 'cached';
}

export function getLocationFixTime(): number | null {
  return fixTime;
}

/** Arayüzde kısa durum etiketi. */
export function getLocationSourceLabel(): string {
  switch (source) {
    case 'gps':
      return 'GPS konumu';
    case 'cached':
      return 'Son bilinen konum (güncel olmayabilir)';
    case 'ip':
      return 'Yaklaşık konum (IP, kilometrelerce hata olabilir)';
    case 'shared':
      return 'Paylaşılan bağlantıdaki konum (sizin konumunuz değil)';
    default:
      return 'Konum alınamadı';
  }
}

/**
 * Acil durum mesajlarına eklenecek konum satırı. Gerçek ölçüm yoksa koordinat
 * YAZILMAZ; kullanıcıdan adresini elle yazması istenir.
 */
export function describeLocationForMessage(coords: [number, number]): string {
  const url = `https://maps.google.com/?q=${coords[1].toFixed(5)},${coords[0].toFixed(5)}`;
  if (source === 'gps') return `Konumum (GPS): ${url}`;
  if (source === 'cached') return `Son bilinen konumum (güncel olmayabilir): ${url}`;
  return 'Konum alınamadı — adresimi ayrıca yazıyorum:';
}
