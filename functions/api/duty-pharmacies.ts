// Cloudflare Pages Edge Function: /api/duty-pharmacies
//
// Bugünün nöbetçi eczanelerini YALNIZCA resmi/açık veri API'lerinden döndürür.
// Şu an desteklenen kaynak: İzmir Büyükşehir Belediyesi Açık Veri Portalı.
// Diğer illerde boş liste ve resmi sorgu bağlantısı (officialUrl) döner.
//
// KURAL: Hiçbir koşulda eczane adı, telefon, adres veya konum ÜRETİLMEZ.
// Gerçek veri yoksa boş liste dönülür; arayüz kullanıcıyı resmi kaynağa yönlendirir.

const OFFICIAL_DUTY_URL = 'https://www.turkiye.gov.tr/saglik-titck-nobetci-eczane-sorgulama';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, User-Agent, X-Requested-With'
};

function normalizeSlug(str: string): string {
  return (str || '')
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '');
}

function json(body: unknown, cacheControl: string): Response {
  return new Response(JSON.stringify(body), {
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
      'Cache-Control': cacheControl
    }
  });
}

async function fetchIzmirDutyPharmacies(todayStr: string): Promise<any[]> {
  const res = await fetch('https://openapi.izmir.bel.tr/api/ibb/nobetcieczaneler', {
    headers: { 'User-Agent': 'afet.live/2.0' }
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (Array.isArray(data) ? data : [])
    .map((item: any, idx: number) => {
      const lat = parseFloat(item.LokasyonX);
      const lon = parseFloat(item.LokasyonY);
      if (isNaN(lat) || isNaN(lon) || lat < 37.8 || lat > 39.5 || lon < 26.2 || lon > 28.5) return null;
      return {
        id: `pharm-live-izmir-${idx + 1}`,
        name: item.Adi || 'Nöbetçi Eczane',
        city: 'İzmir',
        district: item.Bolge || '',
        neighborhood: item.BolgeAciklama || '',
        address: (item.Adres || '').trim(),
        phone: item.Telefon || '',
        isDuty: true,
        dutyDate: item.Tarih ? String(item.Tarih).slice(0, 10) : todayStr,
        source: 'İzmir Büyükşehir Belediyesi Açık Veri',
        coordinates: [Number(lon.toFixed(6)), Number(lat.toFixed(6))]
      };
    })
    .filter(Boolean);
}

export async function onRequest(context: any): Promise<Response> {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const url = new URL(context.request.url);
  const provSlug = normalizeSlug((url.searchParams.get('province') || '').trim());
  const districtSlug = normalizeSlug((url.searchParams.get('district') || '').trim());
  // Nöbet günü Türkiye saatine göre belirlenir (UTC gece yarısı ile 03:00 arası bir önceki günü verirdi).
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' });

  if (provSlug === 'izmir') {
    try {
      let pharmacies = await fetchIzmirDutyPharmacies(todayStr);
      if (districtSlug) {
        const filtered = pharmacies.filter((p: any) => normalizeSlug(p.district).includes(districtSlug));
        if (filtered.length > 0) pharmacies = filtered;
      }
      if (pharmacies.length > 0) {
        return json(
          {
            province: provSlug,
            district: districtSlug || undefined,
            date: todayStr,
            count: pharmacies.length,
            source: 'https://acikveri.bizizmir.com/',
            officialUrl: OFFICIAL_DUTY_URL,
            pharmacies
          },
          'public, max-age=300, s-maxage=1800, stale-while-revalidate=7200'
        );
      }
    } catch {}
  }

  // Bu il için doğrulanmış canlı kaynak yok: veri üretmek yerine resmi sorguya yönlendir.
  return json(
    {
      province: provSlug,
      district: districtSlug || undefined,
      date: todayStr,
      count: 0,
      officialUrl: OFFICIAL_DUTY_URL,
      pharmacies: []
    },
    'public, max-age=600, s-maxage=3600'
  );
}
