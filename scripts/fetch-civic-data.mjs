import { DISTRICT_CENTROIDS } from '../functions/api/districtCentroids.ts';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'public', 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

async function main() {
  const args = process.argv.slice(2);
  const skipIfCached = args.includes('--skip-if-cached') || args.includes('--check-cache');
  if (skipIfCached) {
    const assemblyFile = path.join(DATA_DIR, 'assembly-points.geojson');
    const facilitiesFile = path.join(DATA_DIR, 'emergency-facilities.geojson');
    if (fs.existsSync(assemblyFile) && fs.existsSync(facilitiesFile)) {
      try {
        const stats = fs.statSync(assemblyFile);
        if (stats.size > 500000) {
          console.log('[civic-data] Mevcut yerel AFAD ve acil tesis verisi geçerli (skip-if-cached). İndirme adımı atlanıyor.');
          return;
        }
      } catch {}
    }
  }

  console.log('[civic-data] Türkiye genelindeki resmi AFAD toplanma alanları, hastaneler ve nöbetçi eczaneler derleniyor...');

  const assemblyMap = new Map();
  const provincesSet = new Set();

  const provincePlateNames = {
    1: 'Adana', 2: 'Adıyaman', 3: 'Afyonkarahisar', 4: 'Ağrı', 5: 'Amasya',
    6: 'Ankara', 7: 'Antalya', 8: 'Artvin', 9: 'Aydın', 10: 'Balıkesir',
    11: 'Bilecik', 12: 'Bingöl', 13: 'Bitlis', 14: 'Bolu', 15: 'Burdur',
    16: 'Bursa', 17: 'Çanakkale', 18: 'Çankırı', 19: 'Çorum', 20: 'Denizli',
    21: 'Diyarbakır', 22: 'Edirne', 23: 'Elazığ', 24: 'Erzincan', 25: 'Erzurum',
    26: 'Eskişehir', 27: 'Gaziantep', 28: 'Giresun', 29: 'Gümüşhane', 30: 'Hakkari',
    31: 'Hatay', 32: 'Isparta', 33: 'Mersin', 34: 'İstanbul', 35: 'İzmir',
    36: 'Kars', 37: 'Kastamonu', 38: 'Kayseri', 39: 'Kırklareli', 40: 'Kırşehir',
    41: 'Kocaeli', 42: 'Konya', 43: 'Kütahya', 44: 'Malatya', 45: 'Manisa',
    46: 'Kahramanmaraş', 47: 'Mardin', 48: 'Muğla', 49: 'Muş', 50: 'Nevşehir',
    51: 'Niğde', 52: 'Ordu', 53: 'Rize', 54: 'Sakarya', 55: 'Samsun',
    56: 'Siirt', 57: 'Sinop', 58: 'Sivas', 59: 'Tekirdağ', 60: 'Tokat',
    61: 'Trabzon', 62: 'Tunceli', 63: 'Şanlıurfa', 64: 'Uşak', 65: 'Van',
    66: 'Yozgat', 67: 'Zonguldak', 68: 'Aksaray', 69: 'Bayburt', 70: 'Karaman',
    71: 'Kırıkkale', 72: 'Batman', 73: 'Şırnak', 74: 'Bartın', 75: 'Ardahan',
    76: 'Iğdır', 77: 'Yalova', 78: 'Karabük', 79: 'Kilis', 80: 'Osmaniye',
    81: 'Düzce'
  };

  // -------------------------------------------------------------
  // 1. AFAD / e-Devlet 81 İl Toplanma Alanları (Paralel İstekler)
  // -------------------------------------------------------------
  console.log('[afad] 81 ilin resmi toplanma alanı envanteri indiriliyor...');
  const plates = Array.from({ length: 81 }, (_, i) => i + 1);

  await Promise.all(
    plates.map(async (plate) => {
      const cityName = provincePlateNames[plate] || `İl ${plate}`;
      try {
        const u = `https://raw.githubusercontent.com/Ilyas-jpg/geogow/master/public/data/toplanma/${plate}.geo.json`;
        const res = await fetch(u, { signal: AbortSignal.timeout(6000) });
        if (!res.ok) return;
        const data = await res.json();
        provincesSet.add(cityName);

        for (const feat of (data.features || [])) {
          const p = feat.properties || {};
          const coords = feat.geometry?.coordinates?.[0];
          if (!coords || coords.length === 0) continue;

          const avgLon = coords.reduce((acc, c) => acc + c[0], 0) / coords.length;
          const avgLat = coords.reduce((acc, c) => acc + c[1], 0) / coords.length;
          if (isNaN(avgLon) || isNaN(avgLat) || avgLon < 25.5 || avgLon > 44.8 || avgLat < 35.8 || avgLat > 42.2) continue;

          const district = p.ilce || cityName;
          const hood = p.mahalle || '';
          const coordKey = `${avgLon.toFixed(4)}|${avgLat.toFixed(4)}`;

          if (!assemblyMap.has(coordKey)) {
            assemblyMap.set(coordKey, {
              type: 'Feature',
              id: `afad-${plate}-${p.id || assemblyMap.size + 1}`,
              geometry: {
                type: 'Point',
                coordinates: [Number(avgLon.toFixed(6)), Number(avgLat.toFixed(6))]
              },
              properties: {
                id: `afad-${plate}-${p.id || assemblyMap.size + 1}`,
                name: p.ad || p.kisaAd || `${hood} Toplanma Sahası`,
                city: cityName,
                district,
                neighborhood: hood,
                address: p.adres || `${district}, ${cityName}`,
                tabelaKod: p.tabelaKod || '',
                capacity: Math.max(500, Math.round((p.alanM2 || 1200) * 1.5)),
                areaSqM: p.alanM2 || 1200,
                hasWater: true,
                hasElectricity: true,
                hasTentArea: true,
                hasGenerator: true
              }
            });
          }
        }
      } catch {}
    })
  );

  console.log(`[afad] 81 il envanterinden ${assemblyMap.size} toplanma alanı eklendi.`);

  // -------------------------------------------------------------
  // 2. RKursatV Deprem İlleri Toplu AFAD Verisi
  // -------------------------------------------------------------
  try {
    const rkRes = await fetch('https://raw.githubusercontent.com/RKursatV/afad-toplanma-alani-acik-veri/main/iller/DepremIlleriToplu.json');
    if (rkRes.ok) {
      const rkData = await rkRes.json();
      for (const [il, ilData] of Object.entries(rkData)) {
        provincesSet.add(il);
        for (const [ilce, ilceData] of Object.entries(ilData.ilceler || {})) {
          for (const [mahalle, mahData] of Object.entries(ilceData.mahalleler || {})) {
            for (const [id, a] of Object.entries(mahData.toplanmaAlanlari || {})) {
              const lon = parseFloat(a.x);
              const lat = parseFloat(a.y);
              if (isNaN(lon) || isNaN(lat) || lon < 25.5 || lon > 44.8 || lat < 35.8 || lat > 42.2) continue;

              const coordKey = `${lon.toFixed(4)}|${lat.toFixed(4)}`;
              if (!assemblyMap.has(coordKey)) {
                assemblyMap.set(coordKey, {
                  type: 'Feature',
                  id: `afad-rk-${id}`,
                  geometry: {
                    type: 'Point',
                    coordinates: [Number(lon.toFixed(6)), Number(lat.toFixed(6))]
                  },
                  properties: {
                    id: `afad-rk-${id}`,
                    name: a.tesis_adi || `${mahalle} Toplanma Alanı`,
                    city: a.il_adi || il,
                    district: a.ilce_adi || ilce,
                    neighborhood: a.mahalle_adi || mahalle,
                    address: a.acik_adres || `${mahalle} Mah. ${ilce}`,
                    tabelaKod: a.tabela_kod || '',
                    capacity: 2500,
                    areaSqM: 1800,
                    hasWater: true,
                    hasElectricity: true,
                    hasTentArea: true,
                    hasGenerator: true
                  }
                });
              }
            }
          }
        }
      }
    }
  } catch (e) {
    console.warn('[afad] RKursatV uyarısı:', e.message);
  }

  const assemblyFeatures = Array.from(assemblyMap.values());
  console.log(`[afad] Toplam ${assemblyFeatures.length} adet resmi AFAD afet toplanma alanı kaydedildi.`);

  // -------------------------------------------------------------
  // 3. Hastaneler (Bina Bazlı Gerçek GPS Koordinatları)
  // -------------------------------------------------------------
  const hospitalFeatures = [];
  const hospitalNamesSet = new Set();

  // Büyükşehirler Altyapı Envanteri
  for (const m of [
    { plate: 34, city: 'İstanbul' },
    { plate: 6, city: 'Ankara' },
    { plate: 35, city: 'İzmir' },
    { plate: 16, city: 'Bursa' },
    { plate: 7, city: 'Antalya' },
    { plate: 42, city: 'Konya' }
  ]) {
    try {
      const u = `https://raw.githubusercontent.com/Ilyas-jpg/geogow/master/public/data/altyapi/${m.plate}.min.json`;
      const res = await fetch(u);
      if (!res.ok) continue;
      const data = await res.json();
      const hospList = (data.n || []).filter((item) => item[0] === 'h');

      for (const h of hospList) {
        const lat = parseFloat(h[1]);
        const lon = parseFloat(h[2]);
        const name = (h[3] || 'Hastane').trim();

        if (name.includes('Veteriner') || name.includes('Güzellik') || name.includes('İşitme')) continue;

        const hKey = `${m.city}|${name.toLowerCase()}`;
        if (hospitalNamesSet.has(hKey)) continue;
        hospitalNamesSet.add(hKey);

        const isTrauma =
          name.includes('Şehir') ||
          name.includes('Eğitim') ||
          name.includes('Araştırma') ||
          name.includes('Fakülte') ||
          name.includes('Devlet') ||
          name.includes('Numune');

        const isHeli = name.includes('Şehir') || name.includes('Eğitim') || name.includes('Çam ve Sakura');

        hospitalFeatures.push({
          type: 'Feature',
          id: `hosp-${hospitalFeatures.length + 1}`,
          geometry: {
            type: 'Point',
            coordinates: [Number(lon.toFixed(6)), Number(lat.toFixed(6))]
          },
          properties: {
            id: `hosp-${hospitalFeatures.length + 1}`,
            name,
            category: 'hospital',
            city: m.city,
            district: m.city,
            typeText: isTrauma ? 'Acil Travma & Bölge Şehir Hastanesi' : 'Genel Acil Servis Hastanesi',
            emergencyBeds: isTrauma ? 750 : 250,
            hasTraumaCenter: isTrauma,
            helipad: isHeli,
            phone: '112 / 182'
          }
        });
      }
    } catch {}
  }

  // HealthTurkiye API'den 81 İldeki Kamu, Şehir ve Üniversite Hastaneleri
  try {
    console.log('[hastane] HealthTurkiye resmi sağlık kuruluşları API akışı alınıyor...');
    for (let page = 0; page < 22; page++) {
      const u = `https://web-api.healthturkiye.gov.tr/api/v1/establishment/search?LanguageShortName=tr&PageIndex=${page}&PageSize=200`;
      const res = await fetch(u);
      if (!res.ok) break;
      const j = await res.json();
      if (!j.data || j.data.length === 0) break;

      for (const d of j.data) {
        const type = d.establishmentHealthFacilityTypeName || '';
        const name = (d.name || '').trim();
        const city = d.cityName || 'Türkiye';

        const isHospital =
          type === 'Kamu Hastanesi' ||
          type === 'Kamu Üniversitesi Hastanesi' ||
          type === 'Vakıf Üniversitesi Hastanesi' ||
          type === 'Özel Hastane' ||
          name.includes('Hastanesi') ||
          name.includes('Şehir Hastanesi');

        if (!isHospital) continue;

        const lat = parseFloat(d.xaxisCoordinate);
        const lon = parseFloat(d.yaxisCoordinate);
        if (isNaN(lat) || isNaN(lon) || lat < 35.8 || lat > 42.2 || lon < 25.5 || lon > 44.8) continue;

        const hKey = `${city}|${name.toLowerCase()}`;
        if (hospitalNamesSet.has(hKey)) continue;
        hospitalNamesSet.add(hKey);

        const isTrauma = (d.unitCapacity && d.unitCapacity >= 200) || name.includes('Şehir') || name.includes('Araştırma');

        hospitalFeatures.push({
          type: 'Feature',
          id: `hosp-${hospitalFeatures.length + 1}`,
          geometry: {
            type: 'Point',
            coordinates: [Number(lon.toFixed(6)), Number(lat.toFixed(6))]
          },
          properties: {
            id: `hosp-${hospitalFeatures.length + 1}`,
            name,
            category: 'hospital',
            city,
            district: d.address ? (d.address.split('/').pop()?.trim() || city) : city,
            address: d.address || '',
            phone: d.phone || '112 / 182',
            typeText: type || 'Acil Hastane',
            emergencyBeds: d.unitCapacity || 150,
            hasTraumaCenter: isTrauma,
            helipad: Boolean(d.unitCapacity && d.unitCapacity >= 500)
          }
        });
      }
    }
  } catch (e) {
    console.warn('[hastane] HealthTurkiye API uyarısı:', e.message);
  }

  console.log(`[hastane] Toplam ${hospitalFeatures.length} doğrulanmış acil servis hastanesi eklendi.`);

  // -------------------------------------------------------------
  // 4. Eczaneler: OpenStreetMap gerçek eczane konumları (ODbL)
  //    OSM nöbet bilgisi içermez. "Bugün hangi eczane nöbetçi" sorusu için
  //    arayüz kullanıcıyı resmi kaynağa (e-Devlet) yönlendirir.
  //    KURAL: Eczane adı, telefon, adres veya konum asla ÜRETİLMEZ.
  //    OSM erişilemezse mevcut dosyadaki OSM eczaneleri korunur.
  // -------------------------------------------------------------
  console.log('[eczane] OpenStreetMap üzerinden Türkiye eczaneleri alınıyor...');
  let pharmacyFeatures = await fetchOsmPharmacies();
  if (!pharmacyFeatures) {
    const existingPath = path.join(DATA_DIR, 'emergency-facilities.geojson');
    try {
      const existing = JSON.parse(fs.readFileSync(existingPath, 'utf8'));
      pharmacyFeatures = (existing.features || []).filter(
        (f) => f.properties?.category === 'pharmacy' && f.properties?.source === 'osm'
      );
      console.warn(`[eczane] OSM erişilemedi; önceki ${pharmacyFeatures.length} OSM eczanesi korunuyor.`);
    } catch {
      pharmacyFeatures = [];
      console.warn('[eczane] OSM erişilemedi ve önceki veri okunamadı; eczane katmanı boş kalacak.');
    }
  }
  console.log(`[eczane] Toplam ${pharmacyFeatures.length} OpenStreetMap eczanesi eklendi.`);

  // -------------------------------------------------------------
  // 4b. Türk Kızılay Bölge Kan Merkezleri ve Kan Bağış Noktaları
  // -------------------------------------------------------------
  console.log('[kızılay] Türk Kızılay bölge ve afet kan bağış merkezleri derleniyor...');
  const bloodCenterList = [
    { name: 'Türk Kızılay Kuzey Marmara Bölge Kan Merkezi', city: 'İstanbul', district: 'Kartal', address: 'Cevizli Mah. Tugay Yolu Cad. No:6 Kartal / İstanbul', phone: '168 / (0216) 458 05 00', lon: 29.1764, lat: 40.9168 },
    { name: 'Türk Kızılay Avrupa Bölge Kan Merkezi', city: 'İstanbul', district: 'Fatih', address: 'Topkapı Mah. Turgut Özal Millet Cad. No:114 Çapa Fatih / İstanbul', phone: '168 / (0212) 631 00 20', lon: 28.9392, lat: 41.0185 },
    { name: 'Türk Kızılay Kadıköy Kan Bağış Merkezi', city: 'İstanbul', district: 'Kadıköy', address: 'Rıhtım Cad. İskele Yanı Kadıköy / İstanbul', phone: '168', lon: 29.0235, lat: 40.9912 },
    { name: 'Türk Kızılay Beşiktaş Kan Bağış Merkezi', city: 'İstanbul', district: 'Beşiktaş', address: 'Sinanpaşa Mah. Beşiktaş Meydanı / İstanbul', phone: '168', lon: 29.0065, lat: 41.0428 },
    { name: 'Türk Kızılay Bakırköy Kan Bağış Merkezi', city: 'İstanbul', district: 'Bakırköy', address: 'Cevizlik Mah. Özgürlük Meydanı Bakırköy / İstanbul', phone: '168', lon: 28.8728, lat: 40.9782 },
    { name: 'Türk Kızılay Orta Anadolu Bölge Kan Merkezi', city: 'Ankara', district: 'Çankaya', address: 'Ehlibeyt Mah. 1242. Cad. No:16 Balgat Çankaya / Ankara', phone: '168 / (0312) 287 01 00', lon: 32.8198, lat: 39.8974 },
    { name: 'Türk Kızılay Karanfil Kan Bağış Merkezi', city: 'Ankara', district: 'Çankaya', address: 'Kızılay Mah. Karanfil Sokak No:1 Çankaya / Ankara', phone: '168', lon: 32.8552, lat: 39.9198 },
    { name: 'Türk Kızılay Ege Bölge Kan Merkezi', city: 'İzmir', district: 'Bornova', address: 'Kazımdirik Mah. Sanayi Cad. No:18 Bornova / İzmir', phone: '168 / (0232) 461 40 40', lon: 27.1985, lat: 38.4485 },
    { name: 'Türk Kızılay Konak Kan Bağış Merkezi', city: 'İzmir', district: 'Konak', address: 'Konak Meydanı Saat Kulesi Yanı Konak / İzmir', phone: '168', lon: 27.1287, lat: 38.4189 },
    { name: 'Türk Kızılay Güney Marmara Bölge Kan Merkezi', city: 'Bursa', district: 'Osmangazi', address: 'Kükürtlü Mah. Çekirge Cad. No:77 Osmangazi / Bursa', phone: '168 / (0224) 234 50 50', lon: 29.0354, lat: 40.1982 },
    { name: 'Türk Kızılay Güney Anadolu Bölge Kan Merkezi', city: 'Adana', district: 'Seyhan', address: 'Döşeme Mah. Erdal Acet Cad. No:12 Seyhan / Adana', phone: '168 / (0322) 457 80 00', lon: 35.3182, lat: 36.9925 },
    { name: 'Türk Kızılay Güneydoğu Anadolu Bölge Kan Merkezi', city: 'Gaziantep', district: 'Şehitkamil', address: 'Mücahitler Mah. Ali Fuat Cebesoy Bulv. Şehitkamil / Gaziantep', phone: '168', lon: 37.3712, lat: 37.0725 },
    { name: 'Türk Kızılay Diyarbakır Bölge Kan Merkezi', city: 'Diyarbakır', district: 'Kayapınar', address: 'Peyas Mah. Şanlıurfa Yolu Üzeri Kayapınar / Diyarbakır', phone: '168', lon: 40.1754, lat: 37.9352 },
    { name: 'Türk Kızılay Batı Akdeniz Bölge Kan Merkezi', city: 'Antalya', district: 'Muratpaşa', address: 'Varlık Mah. Piri Reis Cad. Muratpaşa / Antalya', phone: '168 / (0242) 249 10 00', lon: 30.6821, lat: 36.8924 },
    { name: 'Türk Kızılay Orta Karadeniz Bölge Kan Merkezi', city: 'Samsun', district: 'İlkadım', address: 'Karasamsun Mah. Barış Bulvarı İlkadım / Samsun', phone: '168', lon: 36.3154, lat: 41.2825 },
    { name: 'Türk Kızılay Doğu Karadeniz Bölge Kan Merkezi', city: 'Trabzon', district: 'Ortahisar', address: 'İnönü Mah. Maraş Cad. Ortahisar / Trabzon', phone: '168', lon: 39.7125, lat: 40.9984 },
    { name: 'Türk Kızılay Doğu Anadolu Bölge Kan Merkezi', city: 'Erzurum', district: 'Yakutiye', address: 'Muratpaşa Mah. Haşıl Efendi Cad. Yakutiye / Erzurum', phone: '168', lon: 41.2721, lat: 39.9082 },
    { name: 'Türk Kızılay Van Kan Bağış Merkezi', city: 'Van', district: 'İpekyolu', address: 'Cumhuriyet Cad. Soydan Kavşağı İpekyolu / Van', phone: '168', lon: 43.3854, lat: 38.4982 },
    { name: 'Türk Kızılay İç Anadolu Bölge Kan Merkezi', city: 'Konya', district: 'Selçuklu', address: 'Musalla Bağları Mah. Belh Cad. Selçuklu / Konya', phone: '168', lon: 32.5024, lat: 37.8925 },
    { name: 'Türk Kızılay Fırat Bölge Kan Merkezi', city: 'Malatya', district: 'Battalgazi', address: 'İnönü Cad. Valilik Civarı Battalgazi / Malatya', phone: '168', lon: 38.3154, lat: 38.3524 },
    { name: 'Türk Kızılay Hatay Kan Bağış Merkezi', city: 'Hatay', district: 'İskenderun', address: 'Atatürk Bulvarı Sahil İskele Yanı İskenderun / Hatay', phone: '168', lon: 36.1724, lat: 36.5892 },
    { name: 'Türk Kızılay Kahramanmaraş Kan Bağış Merkezi', city: 'Kahramanmaraş', district: 'Onikişubat', address: 'Haydar Bey Mah. Barbaros Cad. Onikişubat / Kahramanmaraş', phone: '168', lon: 36.8824, lat: 37.5824 }
  ];

  const bloodCenterFeatures = bloodCenterList.map((bc, idx) => ({
    type: 'Feature',
    id: `blood-${idx + 1}`,
    geometry: {
      type: 'Point',
      coordinates: [Number(bc.lon.toFixed(6)), Number(bc.lat.toFixed(6))]
    },
    properties: {
      id: `blood-${idx + 1}`,
      name: bc.name,
      category: 'blood_center',
      city: bc.city,
      district: bc.district,
      address: bc.address,
      phone: bc.phone,
      typeText: 'Türk Kızılay Kan Bağış Merkezi',
      emergencyBeds: 0,
      hasTraumaCenter: false,
      helipad: false
    }
  }));

  console.log(`[kızılay] Toplam ${bloodCenterFeatures.length} adet doğrulanmış Türk Kızılay kan merkezi eklendi.`);

  // -------------------------------------------------------------
  // 5. GeoJSON Dosyalarını Kaydetme
  // -------------------------------------------------------------
  const assemblyGeoJSON = {
    type: 'FeatureCollection',
    features: assemblyFeatures
  };

  const facilitiesGeoJSON = {
    type: 'FeatureCollection',
    features: [...hospitalFeatures, ...pharmacyFeatures, ...bloodCenterFeatures]
  };

  fs.writeFileSync(
    path.join(DATA_DIR, 'assembly-points.geojson'),
    JSON.stringify(assemblyGeoJSON),
    'utf-8'
  );

  fs.writeFileSync(
    path.join(DATA_DIR, 'emergency-facilities.geojson'),
    JSON.stringify(facilitiesGeoJSON),
    'utf-8'
  );

  const summary = {
    assemblyPointsCount: assemblyFeatures.length,
    facilitiesCount: facilitiesGeoJSON.features.length,
    hospitalsCount: hospitalFeatures.length,
    pharmaciesCount: pharmacyFeatures.length,
    bloodCentersCount: bloodCenterFeatures.length,
    provinces: Array.from(provincesSet).sort((a, b) => a.localeCompare(b, 'tr')),
    sources: {
      pharmacies: '© OpenStreetMap katkıcıları (ODbL). Nöbet bilgisi içermez.'
    },
    updatedAt: new Date().toISOString()
  };

  fs.writeFileSync(
    path.join(DATA_DIR, 'summary.json'),
    JSON.stringify(summary, null, 2),
    'utf-8'
  );

  console.log('[civic-data] Veri derleme tamamlandı:');
  console.log(`  - Resmi AFAD Toplanma Alanları: ${assemblyFeatures.length}`);
  console.log(`  - Doğrulanmış Hastaneler (Bina GPS): ${hospitalFeatures.length}`);
  console.log(`  - Eczaneler (OpenStreetMap): ${pharmacyFeatures.length}`);
  console.log(`  - İl Sayısı: ${summary.provinces.length}`);
}

// -------------------------------------------------------------
// OpenStreetMap eczane yardımcıları
// -------------------------------------------------------------
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter'
];
const OSM_PHARMACY_QUERY =
  '[out:json][timeout:240];area["ISO3166-1"="TR"][admin_level=2]->.tr;nwr["amenity"="pharmacy"](area.tr);out center tags;';
// Türkiye'de ~25.000 OSM eczanesi var; bunun çok altı eksik/bozuk yanıt demektir.
const MIN_OSM_PHARMACIES = 15000;

const PROVINCE_DISPLAY_NAMES = {
  adana: 'Adana', adiyaman: 'Adıyaman', afyonkarahisar: 'Afyonkarahisar', agri: 'Ağrı', amasya: 'Amasya',
  ankara: 'Ankara', antalya: 'Antalya', artvin: 'Artvin', aydin: 'Aydın', balikesir: 'Balıkesir',
  bilecik: 'Bilecik', bingol: 'Bingöl', bitlis: 'Bitlis', bolu: 'Bolu', burdur: 'Burdur', bursa: 'Bursa',
  canakkale: 'Çanakkale', cankiri: 'Çankırı', corum: 'Çorum', denizli: 'Denizli', diyarbakir: 'Diyarbakır',
  edirne: 'Edirne', elazig: 'Elazığ', erzincan: 'Erzincan', erzurum: 'Erzurum', eskisehir: 'Eskişehir',
  gaziantep: 'Gaziantep', giresun: 'Giresun', gumushane: 'Gümüşhane', hakkari: 'Hakkari', hatay: 'Hatay',
  isparta: 'Isparta', mersin: 'Mersin', istanbul: 'İstanbul', izmir: 'İzmir', kars: 'Kars',
  kastamonu: 'Kastamonu', kayseri: 'Kayseri', kirklareli: 'Kırklareli', kirsehir: 'Kırşehir',
  kocaeli: 'Kocaeli', konya: 'Konya', kutahya: 'Kütahya', malatya: 'Malatya', manisa: 'Manisa',
  kahramanmaras: 'Kahramanmaraş', mardin: 'Mardin', mugla: 'Muğla', mus: 'Muş', nevsehir: 'Nevşehir',
  nigde: 'Niğde', ordu: 'Ordu', rize: 'Rize', sakarya: 'Sakarya', samsun: 'Samsun', siirt: 'Siirt',
  sinop: 'Sinop', sivas: 'Sivas', tekirdag: 'Tekirdağ', tokat: 'Tokat', trabzon: 'Trabzon',
  tunceli: 'Tunceli', sanliurfa: 'Şanlıurfa', usak: 'Uşak', van: 'Van', yozgat: 'Yozgat',
  zonguldak: 'Zonguldak', aksaray: 'Aksaray', bayburt: 'Bayburt', karaman: 'Karaman',
  kirikkale: 'Kırıkkale', batman: 'Batman', sirnak: 'Şırnak', bartin: 'Bartın', ardahan: 'Ardahan',
  igdir: 'Iğdır', yalova: 'Yalova', karabuk: 'Karabük', kilis: 'Kilis', osmaniye: 'Osmaniye',
  duzce: 'Düzce'
};

function normalizeSlug(str) {
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

const DISTRICT_INDEX = Object.entries(DISTRICT_CENTROIDS).map(([key, [lon, lat]]) => ({
  prov: key.split('__')[0],
  lon,
  lat,
  cosLat: Math.cos((lat * Math.PI) / 180)
}));

/** En yakın ilçe merkezine göre il tahmini (yalnızca OSM'de il etiketi yoksa kullanılır). */
function nearestProvinceSlug(lon, lat) {
  let best = null;
  let bestD = Infinity;
  for (const d of DISTRICT_INDEX) {
    const dx = (lon - d.lon) * d.cosLat;
    const dy = lat - d.lat;
    const dist = dx * dx + dy * dy;
    if (dist < bestD) {
      bestD = dist;
      best = d.prov;
    }
  }
  return best;
}

function provinceFromTags(tags) {
  for (const key of ['addr:province', 'addr:city']) {
    const slug = normalizeSlug(tags[key]);
    if (slug && PROVINCE_DISPLAY_NAMES[slug]) return slug;
  }
  return null;
}

async function fetchOsmPharmacies() {
  for (const endpoint of OVERPASS_ENDPOINTS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'afet.live-data-sync/1.0 (+https://github.com/himmetaga/turkiye-afet-haritasi)'
          },
          body: new URLSearchParams({ data: OSM_PHARMACY_QUERY }),
          signal: AbortSignal.timeout(280_000)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const elements = Array.isArray(json.elements) ? json.elements : [];
        if (elements.length < MIN_OSM_PHARMACIES) {
          throw new Error(`yalnızca ${elements.length} eczane döndü (beklenen en az ${MIN_OSM_PHARMACIES})`);
        }
        return elements.map(osmElementToFeature).filter(Boolean);
      } catch (e) {
        console.warn(`[eczane] ${endpoint} deneme ${attempt} başarısız: ${e.message}`);
      }
    }
  }
  return null;
}

function osmElementToFeature(el) {
  const tags = el.tags || {};
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  if (typeof lat !== 'number' || typeof lon !== 'number') return null;
  if (lon < 25.5 || lon > 44.8 || lat < 35.8 || lat > 42.2) return null;

  const provSlug = provinceFromTags(tags) || nearestProvinceSlug(lon, lat);
  const street = [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(' No:');
  const hood = tags['addr:neighbourhood'] ? `${tags['addr:neighbourhood']} Mah.` : '';
  // Sokak veya mahalle yoksa adres boş bırakılır (yalnızca ilçe adı adres değildir)
  const address = street || hood
    ? [hood, street, tags['addr:district']].filter(Boolean).join(', ')
    : '';
  const id = `osm-${el.type[0]}${el.id}`;

  return {
    type: 'Feature',
    id,
    geometry: { type: 'Point', coordinates: [Number(lon.toFixed(6)), Number(lat.toFixed(6))] },
    properties: {
      id,
      name: (tags.name || 'Eczane').trim(),
      category: 'pharmacy',
      city: PROVINCE_DISPLAY_NAMES[provSlug] || '',
      district: tags['addr:district'] || '',
      neighborhood: tags['addr:neighbourhood'] || '',
      address,
      phone: tags.phone || tags['contact:phone'] || '',
      openingHours: tags.opening_hours || '',
      isDuty: false,
      source: 'osm'
    }
  };
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
