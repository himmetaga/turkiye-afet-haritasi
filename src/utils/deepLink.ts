// URL Deep Linking Helper for afet.live (V2)
// Handles coordinates, province/district, point ID and direct module launches.

export interface ParsedDeepLink {
  coords?: [number, number]; // [lng, lat]
  zoom?: number;
  city?: string;
  district?: string;
  pointId?: string;
  mod?:
    | 'gece-nobeti'
    | 'bina-risk'
    | 'qr'
    | 'duduk'
    | 'sismograf'
    | 'erken-uyari'
    | 'kriz'
    | 'canta'
    | 'tatbikat'
    | 'afis'
    | 'kart'
    | 'kilit-ekrani'
    | 'ice'
    | 'rehber'
    | 'ilk-yardim'
    | 'sms'
    | 'acil-sms'
    | 'sel'
    | 'taskin'
    | 'telsiz'
    | 'radyo';
}

export function parseDeepLink(search = window.location.search): ParsedDeepLink {
  const params = new URLSearchParams(search);
  const result: ParsedDeepLink = {};

  const lat = parseFloat(params.get('lat') || '');
  const lng = parseFloat(params.get('lng') || '');
  if (!isNaN(lat) && !isNaN(lng) && lat >= 35 && lat <= 43 && lng >= 25 && lng <= 46) {
    result.coords = [lng, lat];
  }

  const zoom = parseFloat(params.get('zoom') || '');
  if (!isNaN(zoom) && zoom >= 4 && zoom <= 20) {
    result.zoom = zoom;
  }

  const il = params.get('il') || params.get('city');
  if (il) result.city = il.trim();

  const ilce = params.get('ilce') || params.get('district');
  if (ilce) result.district = ilce.trim();

  const point = params.get('point') || params.get('id');
  if (point) result.pointId = point.trim();

  const mod = params.get('mod') || params.get('mode');
  if (mod) {
    const cleanMod = mod.trim().toLowerCase();
    const validMods = [
      'gece-nobeti',
      'bina-risk',
      'qr',
      'duduk',
      'sismograf',
      'erken-uyari',
      'kriz',
      'canta',
      'tatbikat',
      'afis',
      'kart',
      'kilit-ekrani',
      'ice',
      'rehber',
      'ilk-yardim',
      'sms',
      'acil-sms',
      'sel',
      'taskin',
      'telsiz',
      'radyo'
    ];
    if (validMods.includes(cleanMod)) {
      result.mod = cleanMod as any;
    }
  }

  return result;
}

export function buildPointShareUrl(pointId: string, pointName?: string): string {
  const base = 'https://afet.live/';
  return `${base}?point=${encodeURIComponent(pointId)}`;
}

export function buildCoordShareUrl(coords: [number, number], zoom = 16): string {
  const [lng, lat] = coords;
  return `https://afet.live/?lat=${lat.toFixed(5)}&lng=${lng.toFixed(5)}&zoom=${zoom}`;
}
