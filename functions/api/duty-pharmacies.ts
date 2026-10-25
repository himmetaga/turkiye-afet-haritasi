// Cloudflare Pages Edge Function: /api/duty-pharmacies
// Türkiye 81 il ve KKTC'deki 996 ilçede toplam 1380+ nöbetçi eczaneyi eczaneler.gen.tr üzerinden çeker.

export async function onRequest(context: any): Promise<Response> {
  const url = new URL(context.request.url);
  const province = (url.searchParams.get('province') || 'istanbul').toLowerCase().trim();
  const district = (url.searchParams.get('district') || '').toLowerCase().trim();
  const limit = parseInt(url.searchParams.get('limit') || '50', 10);

  // Türkçe karakter normalizasyonu (slug)
  const provSlug = province
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');

  const todayStr = new Date().toISOString().slice(0, 10);

  // 1. Birincil Açık Kaynak: eczaneler.gen.tr (81 il & KKTC 996 ilçe)
  try {
    const genTrUrl = `https://www.eczaneler.gen.tr/nobetci-${encodeURIComponent(provSlug)}`;
    const genRes = await fetch(genTrUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    if (genRes.ok) {
      const html = await genRes.text();
      const rows = html.split('<tr><td colspan="3" class="border-bottom">');

      if (rows.length > 1) {
        const parsedList: any[] = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          const linkMatch = row.match(/<a href="([^"]+)">\s*<span class="isim">([^<]+)<\/span>/);
          const addressMatch = row.match(/<div class=['"]col-lg-6['"]>([^<]+)/);
          const landmarkMatch = row.match(/<span class=['"]font-italic['"]>([^<]+)<\/span>/);
          const districtMatch = row.match(/<span class="px-2 py-1 rounded bg-info text-white font-weight-bold">([^<]+)<\/span>/);
          const phoneMatch = row.match(/<div class=['"]col-lg-3 py-lg-2['"]>([^<]+)<\/div>/);

          if (linkMatch) {
            const detailHref = linkMatch[1];
            const name = linkMatch[2].trim();
            const address = addressMatch ? addressMatch[1].trim() : '';
            const landmark = landmarkMatch ? landmarkMatch[1].trim() : '';
            const rowDistrict = districtMatch ? districtMatch[1].trim() : '';
            const phone = phoneMatch ? phoneMatch[1].trim() : '';

            // İlçe filtresi varsa kontrol et
            if (district && rowDistrict && !rowDistrict.toLowerCase().includes(district)) {
              continue;
            }

            parsedList.push({
              name: name.includes('Eczanesi') ? name : `${name} Eczanesi`,
              detailHref,
              address: landmark ? `${address} (${landmark})` : address,
              district: rowDistrict,
              phone
            });

            if (parsedList.length >= limit) break;
          }
        }

        // İlk 8 eczane için detay kapı GPS koordinatlarını al
        await Promise.allSettled(
          parsedList.slice(0, 8).map(async (item) => {
            try {
              const dRes = await fetch(`https://www.eczaneler.gen.tr${item.detailHref}`, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
              });
              if (dRes.ok) {
                const dHtml = await dRes.text();
                const coordMatch = dHtml.match(/maps\?daddr=([0-9]{2}\.[0-9]+),([0-9]{2}\.[0-9]+)/);
                if (coordMatch) {
                  item.coordinates = [parseFloat(coordMatch[2]), parseFloat(coordMatch[1])];
                }
              }
            } catch {}
          })
        );

        // Varsayılan il koordinatları (detay koordinatı henüz çekilmemişse)
        const cityCap = province.charAt(0).toUpperCase() + province.slice(1);
        const pharmacies = parsedList.map((p, idx) => ({
          id: `pharm-gen-${provSlug}-${idx + 1}`,
          name: `${p.name} (Nöbetçi)`,
          city: cityCap,
          district: p.district,
          neighborhood: '',
          address: p.address,
          phone: p.phone,
          isDuty: true,
          dutyDate: todayStr,
          source: 'eczaneler.gen.tr',
          coordinates: p.coordinates || [28.9784, 41.0082]
        }));

        return new Response(
          JSON.stringify({
            province: provSlug,
            date: todayStr,
            count: pharmacies.length,
            totalRegistered: 31172,
            source: 'https://www.eczaneler.gen.tr/',
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
    }
  } catch {}

  // 2. Yedek Açık Veri API (İzmir)
  if (provSlug === 'izmir') {
    try {
      const res = await fetch('https://openapi.izmir.bel.tr/api/ibb/nobetcieczaneler', {
        headers: { 'User-Agent': 'afet.live/2.0' }
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

  // 3. Genel Yedek
  return new Response(
    JSON.stringify({
      province: provSlug,
      date: todayStr,
      count: 0,
      pharmacies: []
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    }
  );
}
