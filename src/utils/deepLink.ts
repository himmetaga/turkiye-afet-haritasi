// URL Deep Linking Helper for afet.live (V2)
// Handles coordinates, province/district, point ID and direct module launches.
// Supports both path-based clean URLs (/istanbul, /afet-dudugu) and query params (?il=..., ?mod=...).

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
    | 'radyo'
    | 'bitchat'
    | 'triyaj'
    | 'triage'
    | 'hava'
    | 'duman'
    | 'tsunami'
    | 'dalga'
    | 'kan'
    | 'kizilay'
    | 'turnike'
    | 'ilac'
    | 'recete'
    | 'tehlike-avi'
    | 'ihtiyac'
    | 'yardim'
    | 'sahra-yardim'
    | 'pati'
    | 'evcil-hayvan'
    | 'isinma-guvenligi'
    | 'soba'
    | 'pil-tasarrufu'
    | 'batarya'
    | 'psikolojik-yardim'
    | 'nefes'
    | 'enkaz-dinleme'
    | 'akustik-radar'
    | 'harita-indir'
    | 'cevrimdisi-harita'
    | 'sahra-durumu'
    | 'altyapi'
    | 'bebek-besleme'
    | 'telsiz-konus'
    | 'ptt'
    | 'kompas'
    | 'pusula'
    | 'sar-flasor'
    | 'flasor'
    | 'cpr'
    | 'kalp-masaji'
    | 'hasar-tespit'
    | 'su-aritma'
    | 'su'
    | 'kbrn'
    | 'kasa'
    | 'guvenli-kasa'
    | 'toplanma'
    | 'hastane'
    | 'eczane'
    | 'pluscode'
    | 'telsiz-grid'
    | 'olc'
    | 'afetbilgi'
    | 'asevi'
    | 'barinma'
    | 'insarag'
    | 'enkaz-isaret'
    | 'usar'
    | 'rasyon'
    | 'sphere'
    | 'gida-su';
}

const PROVINCE_SLUGS = new Set([
  'adana', 'adiyaman', 'afyonkarahisar', 'agri', 'amasya', 'ankara', 'antalya', 'artvin', 'aydin', 'balikesir',
  'bilecik', 'bingol', 'bitlis', 'bolu', 'burdur', 'bursa', 'canakkale', 'cankiri', 'corum', 'denizli',
  'diyarbakir', 'edirne', 'elazig', 'erzincan', 'erzurum', 'eskisehir', 'gaziantep', 'giresun', 'gumushane', 'hakkari',
  'hatay', 'isparta', 'mersin', 'istanbul', 'izmir', 'kars', 'kastamonu', 'kayseri', 'kirklareli', 'kirsehir',
  'kocaeli', 'konya', 'kutahya', 'malatya', 'manisa', 'kahramanmaras', 'mardin', 'mugla', 'mus', 'nevsehir',
  'nigde', 'ordu', 'rize', 'sakarya', 'samsun', 'siirt', 'sinop', 'sivas', 'tekirdag', 'tokat',
  'trabzon', 'tunceli', 'sanliurfa', 'usak', 'van', 'yozgat', 'zonguldak', 'aksaray', 'bayburt', 'karaman',
  'kirikkale', 'batman', 'sirnak', 'bartin', 'ardahan', 'igdir', 'yalova', 'karabuk', 'kilis', 'osmaniye', 'duzce'
]);

const TOOL_PATH_MAP: Record<string, string> = {
  'afet-dudugu': 'duduk',
  'duduk': 'duduk',
  'son-depremler': 'erken-uyari',
  'deprem-haritasi': 'erken-uyari',
  'erken-uyari': 'erken-uyari',
  'bina-hasar-tespiti': 'hasar-tespit',
  'hasar-tespit': 'hasar-tespit',
  'bina-risk': 'bina-risk',
  'risk': 'bina-risk',
  'afetbilgi': 'afetbilgi',
  'asevi': 'afetbilgi',
  'barinma': 'afetbilgi',
  'pluscode': 'pluscode',
  'telsiz-grid': 'pluscode',
  'insarag': 'insarag',
  'enkaz-isaret': 'insarag',
  'hayatta-kalma-rasyonu': 'rasyon',
  'rasyon': 'rasyon',
  'sphere': 'rasyon',
  'deprem-cantasi': 'canta',
  'canta': 'canta',
  'apartman-afisi': 'afis',
  'afis': 'afis',
  'poster': 'afis',
  'aile-afet-plani': 'kart',
  'aile': 'kart',
  'kart': 'kart',
  'kilit-ekrani': 'ice',
  'ice': 'ice',
  'rehber': 'rehber',
  'ilk-yardim': 'rehber',
  'sms': 'sms',
  'acil-sms': 'sms',
  'sel': 'sel',
  'sel-radari': 'sel',
  'tsunami': 'tsunami',
  'tsunami-radari': 'tsunami',
  'telsiz': 'telsiz',
  'radyo': 'telsiz',
  'telsiz-konus': 'telsiz-konus',
  'ptt': 'telsiz-konus',
  'gece-nobeti': 'gece-nobeti',
  'nobet': 'gece-nobeti',
  'sismograf': 'sismograf',
  'kriz': 'kriz',
  'bitchat': 'kriz',
  'triyaj': 'triyaj',
  'triage': 'triyaj',
  'hava': 'hava',
  'hava-kalitesi': 'hava',
  'kan': 'kan',
  'kan-bagisi': 'kan',
  'turnike': 'turnike',
  'ilac': 'ilac',
  'tehlike-avi': 'tehlike-avi',
  'ihtiyac': 'ihtiyac',
  'pati': 'pati',
  'isinma-guvenligi': 'isinma-guvenligi',
  'pil-tasarrufu': 'pil-tasarrufu',
  'psikolojik-yardim': 'psikolojik-yardim',
  'nefes': 'psikolojik-yardim',
  'enkaz-dinleme': 'enkaz-dinleme',
  'harita-indir': 'harita-indir',
  'sahra-durumu': 'sahra-durumu',
  'bebek-besleme': 'bebek-besleme',
  'tatbikat': 'tatbikat',
  'kompas': 'kompas',
  'pusula': 'kompas',
  'sar-flasor': 'sar-flasor',
  'cpr': 'cpr',
  'su-aritma': 'su-aritma',
  'kbrn': 'kbrn',
  'kasa': 'kasa',
  'toplanma-alanlari': 'toplanma',
  'toplanma': 'toplanma'
};

export function parseDeepLink(
  search = typeof window !== 'undefined' ? window.location.search : '',
  pathname = typeof window !== 'undefined' ? window.location.pathname : ''
): ParsedDeepLink {
  const params = new URLSearchParams(search);
  const result: ParsedDeepLink = {};

  // 1. Path-based resolution (/istanbul or /afet-dudugu)
  if (pathname && pathname !== '/' && pathname !== '/index.html') {
    const cleanPath = pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
    if (PROVINCE_SLUGS.has(cleanPath)) {
      result.city = cleanPath;
    } else if (TOOL_PATH_MAP[cleanPath]) {
      result.mod = TOOL_PATH_MAP[cleanPath] as any;
    }
  }

  // 2. Query param resolution (lat, lng, zoom, il, mod)
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
  if (il) result.city = il.trim().toLowerCase();

  const ilce = params.get('ilce') || params.get('district');
  if (ilce) result.district = ilce.trim();

  const point = params.get('point') || params.get('id');
  if (point) result.pointId = point.trim();

  const mod = params.get('mod') || params.get('mode');
  if (mod) {
    const cleanMod = mod.trim().toLowerCase();
    if (TOOL_PATH_MAP[cleanMod]) {
      result.mod = TOOL_PATH_MAP[cleanMod] as any;
    } else {
      result.mod = cleanMod as any;
    }
  }

  return result;
}

export function buildPointShareUrl(pointId: string): string {
  const base = 'https://afet.live/';
  return `${base}?point=${encodeURIComponent(pointId)}`;
}

export function buildCoordShareUrl(coords: [number, number], zoom = 16): string {
  const [lng, lat] = coords;
  return `https://afet.live/?lat=${lat.toFixed(5)}&lng=${lng.toFixed(5)}&zoom=${zoom}`;
}
