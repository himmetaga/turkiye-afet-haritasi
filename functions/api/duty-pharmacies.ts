// Cloudflare Pages Edge Function: /api/duty-pharmacies
// Türkiye il ve ilçeleri için günlük canlı nöbetçi eczane verisi sağlar.

export async function onRequest(context: any): Promise<Response> {
  const url = new URL(context.request.url);
  const province = (url.searchParams.get('province') || 'istanbul').toLowerCase().trim();
  const district = (url.searchParams.get('district') || '').toLowerCase().trim();
  const limit = url.searchParams.get('limit') || '50';

  // Türkçe karakter normalizasyonu (slug)
  const provSlug = province
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');

  // Bugünün tarihi (YYYY-MM-DD)
  const todayStr = new Date().toISOString().slice(0, 10);

  // 1. İzmir için doğrudan İzmir Büyükşehir Belediyesi Açık Veri API'si
  if (provSlug === 'izmir') {
    try {
      const res = await fetch('https://openapi.izmir.bel.tr/api/ibb/nobetcieczaneler', {
        headers: { 'User-Agent': 'afet.live/2.0 (+https://afet.live)' }
      });
      if (res.ok) {
        const data = await res.json();
        const pharmacies = (Array.isArray(data) ? data : [])
          .map((item: any, idx: number) => {
            const lat = parseFloat(item.LokasyonX);
            const lon = parseFloat(item.LokasyonY);
            if (isNaN(lat) || isNaN(lon) || lat < 37.8 || lat > 39.5 || lon < 26.2 || lon > 28.5) return null;
            return {
              id: `pharm-live-izmir-${idx + 1}`,
              name: item.Adi || 'Nöbetçi Eczane',
              city: 'İzmir',
              district: item.Bolge || 'Merkez',
              neighborhood: item.BolgeAciklama || '',
              address: (item.Adres || '').trim(),
              phone: item.Telefon || '',
              isDuty: true,
              dutyDate: item.Tarih ? item.Tarih.slice(0, 10) : todayStr,
              coordinates: [Number(lon.toFixed(6)), Number(lat.toFixed(6))]
            };
          })
          .filter(Boolean);

        return new Response(
          JSON.stringify({
            province: 'izmir',
            date: todayStr,
            count: pharmacies.length,
            pharmacies
          }),
          {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'public, max-age=300, s-maxage=1800, stale-while-revalidate=7200'
            }
          }
        );
      }
    } catch {}
  }

  // 2. Diğer tüm iller için EczaneBul API (en güncel tarihe göre sıralı)
  const distParam = district ? `&district=${encodeURIComponent(district)}` : '';
  const targetUrl = `https://eczanebul.co/v1/duty-pharmacies/?province=${encodeURIComponent(provSlug)}${distParam}&ordering=-date&limit=${limit}`;

  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'afet.live/2.0 (Civic Emergency Map; +https://afet.live)'
      }
    });

    if (!res.ok) {
      return new Response(
        JSON.stringify({ province: provSlug, date: todayStr, count: 0, pharmacies: [] }),
        {
          status: res.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    const data = await res.json();
    const rawResults = data.results || [];
    const pharmacies = rawResults
      .map((item: any, idx: number) => {
        const p = item.pharmacy;
        if (!p) return null;
        const lat = parseFloat(p.latitude);
        const lon = parseFloat(p.longitude);
        if (isNaN(lat) || isNaN(lon) || lat < 35.5 || lat > 42.5 || lon < 25.5 || lon > 44.9) return null;

        return {
          id: `pharm-live-${provSlug}-${idx + 1}`,
          name: p.name ? `${p.name} (Nöbetçi)` : 'Nöbetçi Eczane',
          city: province.charAt(0).toUpperCase() + province.slice(1),
          district: p.district || district || '',
          neighborhood: p.neighborhood || '',
          address: p.address || '',
          phone: p.phone || '',
          isDuty: true,
          dutyDate: item.date || todayStr,
          coordinates: [Number(lon.toFixed(6)), Number(lat.toFixed(6))]
        };
      })
      .filter(Boolean);

    return new Response(
      JSON.stringify({
        province: provSlug,
        date: todayStr,
        count: pharmacies.length,
        pharmacies,
        results: rawResults
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=300, s-maxage=1800, stale-while-revalidate=7200'
        }
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        province: provSlug,
        date: todayStr,
        error: err?.message || 'Eczane verisi alınamadı',
        count: 0,
        pharmacies: []
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}
