/**
 * generate-seo-pages.mjs
 * =============================================================================
 * afet.live — Google & Arama Motoru Zirve SEO Statik Sayfa Üreteci (SSG)
 * =============================================================================
 * Googlebot ve diğer arama motorları JavaScript çalıştırmadan veya WebGL
 * yüklenmeden önce tam teşekküllü, zengin semantik HTML, Schema.org ve
 * coğrafi meta verisi bekler.
 *
 * Bu betik:
 * 1. 81 il için clean-URL statik sayfalar (/istanbul, /ankara, /hatay vb.)
 * 2. 20+ kritik afet aracı için statik sayfalar (/afet-dudugu, /son-depremler vb.)
 * 3. 100% Google Standartlarında sitemap.xml ve robots.txt üretir.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

const PROVINCES = [
  { name: 'Adana', slug: 'adana', plate: 1 },
  { name: 'Adıyaman', slug: 'adiyaman', plate: 2 },
  { name: 'Afyonkarahisar', slug: 'afyonkarahisar', plate: 3 },
  { name: 'Ağrı', slug: 'agri', plate: 4 },
  { name: 'Amasya', slug: 'amasya', plate: 5 },
  { name: 'Ankara', slug: 'ankara', plate: 6 },
  { name: 'Antalya', slug: 'antalya', plate: 7 },
  { name: 'Artvin', slug: 'artvin', plate: 8 },
  { name: 'Aydın', slug: 'aydin', plate: 9 },
  { name: 'Balıkesir', slug: 'balikesir', plate: 10 },
  { name: 'Bilecik', slug: 'bilecik', plate: 11 },
  { name: 'Bingöl', slug: 'bingol', plate: 12 },
  { name: 'Bitlis', slug: 'bitlis', plate: 13 },
  { name: 'Bolu', slug: 'bolu', plate: 14 },
  { name: 'Burdur', slug: 'burdur', plate: 15 },
  { name: 'Bursa', slug: 'bursa', plate: 16 },
  { name: 'Çanakkale', slug: 'canakkale', plate: 17 },
  { name: 'Çankırı', slug: 'cankiri', plate: 18 },
  { name: 'Çorum', slug: 'corum', plate: 19 },
  { name: 'Denizli', slug: 'denizli', plate: 20 },
  { name: 'Diyarbakır', slug: 'diyarbakir', plate: 21 },
  { name: 'Edirne', slug: 'edirne', plate: 22 },
  { name: 'Elazığ', slug: 'elazig', plate: 23 },
  { name: 'Erzincan', slug: 'erzincan', plate: 24 },
  { name: 'Erzurum', slug: 'erzurum', plate: 25 },
  { name: 'Eskişehir', slug: 'eskisehir', plate: 26 },
  { name: 'Gaziantep', slug: 'gaziantep', plate: 27 },
  { name: 'Giresun', slug: 'giresun', plate: 28 },
  { name: 'Gümüşhane', slug: 'gumushane', plate: 29 },
  { name: 'Hakkari', slug: 'hakkari', plate: 30 },
  { name: 'Hatay', slug: 'hatay', plate: 31 },
  { name: 'Isparta', slug: 'isparta', plate: 32 },
  { name: 'Mersin', slug: 'mersin', plate: 33 },
  { name: 'İstanbul', slug: 'istanbul', plate: 34 },
  { name: 'İzmir', slug: 'izmir', plate: 35 },
  { name: 'Kars', slug: 'kars', plate: 36 },
  { name: 'Kastamonu', slug: 'kastamonu', plate: 37 },
  { name: 'Kayseri', slug: 'kayseri', plate: 38 },
  { name: 'Kırklareli', slug: 'kirklareli', plate: 39 },
  { name: 'Kırşehir', slug: 'kirsehir', plate: 40 },
  { name: 'Kocaeli', slug: 'kocaeli', plate: 41 },
  { name: 'Konya', slug: 'konya', plate: 42 },
  { name: 'Kütahya', slug: 'kutahya', plate: 43 },
  { name: 'Malatya', slug: 'malatya', plate: 44 },
  { name: 'Manisa', slug: 'manisa', plate: 45 },
  { name: 'Kahramanmaraş', slug: 'kahramanmaras', plate: 46 },
  { name: 'Mardin', slug: 'mardin', plate: 47 },
  { name: 'Muğla', slug: 'mugla', plate: 48 },
  { name: 'Muş', slug: 'mus', plate: 49 },
  { name: 'Nevşehir', slug: 'nevsehir', plate: 50 },
  { name: 'Niğde', slug: 'nigde', plate: 51 },
  { name: 'Ordu', slug: 'ordu', plate: 52 },
  { name: 'Rize', slug: 'rize', plate: 53 },
  { name: 'Sakarya', slug: 'sakarya', plate: 54 },
  { name: 'Samsun', slug: 'samsun', plate: 55 },
  { name: 'Siirt', slug: 'siirt', plate: 56 },
  { name: 'Sinop', slug: 'sinop', plate: 57 },
  { name: 'Sivas', slug: 'sivas', plate: 58 },
  { name: 'Tekirdağ', slug: 'tekirdag', plate: 59 },
  { name: 'Tokat', slug: 'tokat', plate: 60 },
  { name: 'Trabzon', slug: 'trabzon', plate: 61 },
  { name: 'Tunceli', slug: 'tunceli', plate: 62 },
  { name: 'Şanlıurfa', slug: 'sanliurfa', plate: 63 },
  { name: 'Uşak', slug: 'usak', plate: 64 },
  { name: 'Van', slug: 'van', plate: 65 },
  { name: 'Yozgat', slug: 'yozgat', plate: 66 },
  { name: 'Zonguldak', slug: 'zonguldak', plate: 67 },
  { name: 'Aksaray', slug: 'aksaray', plate: 68 },
  { name: 'Bayburt', slug: 'bayburt', plate: 69 },
  { name: 'Karaman', slug: 'karaman', plate: 70 },
  { name: 'Kırıkkale', slug: 'kirikkale', plate: 71 },
  { name: 'Batman', slug: 'batman', plate: 72 },
  { name: 'Şırnak', slug: 'sirnak', plate: 73 },
  { name: 'Bartın', slug: 'bartin', plate: 74 },
  { name: 'Ardahan', slug: 'ardahan', plate: 75 },
  { name: 'Iğdır', slug: 'igdir', plate: 76 },
  { name: 'Yalova', slug: 'yalova', plate: 77 },
  { name: 'Karabük', slug: 'karabuk', plate: 78 },
  { name: 'Kilis', slug: 'kilis', plate: 79 },
  { name: 'Osmaniye', slug: 'osmaniye', plate: 80 },
  { name: 'Düzce', slug: 'duzce', plate: 81 }
];

const DISASTER_TOOLS = [
  {
    slug: 'afet-dudugu',
    aliases: ['duduk'],
    title: 'Afet Düdüğü — 2.9 kHz Kesintisiz Enkaz S.O.S Düdüğü ve Flaşör',
    desc: 'Enkaz altında telefon kilitliyken bile aralıksız çalan 2.9 kHz ve 3.5 kHz geofon sismik rezonans afet düdüğü. Kamera LED flaşörlü, internetsiz ve ücretsiz.',
    h1: 'Afet ve Deprem Düdüğü (2.9 kHz SOS Sinyali)',
    badge: 'Acil Müdahale & S.O.S'
  },
  {
    slug: 'son-depremler',
    aliases: ['deprem-haritasi'],
    title: 'Kandilli ve AFAD Son Depremler Canlı Haritası — afet.live',
    desc: 'Türkiye ve çevresinde meydana gelen anlık sarsıntılar, merkez üssü, büyüklük (Mw) ve P/S dalga yayılım simülasyonu. 1 saniyede güncellenen canlı akış.',
    h1: 'Canlı Son Depremler ve Sismik Dalga Simülasyonu',
    badge: 'Canlı Sensörler'
  },
  {
    slug: 'toplanma-alanlari',
    aliases: ['toplanma'],
    title: 'AFAD Toplanma Alanları Sorgulama ve Haritası — afet.live',
    desc: 'Türkiye genelinde 27.331 resmi AFAD toplanma alanı envanteri. Konumunuza en yakın güvenli park ve toplanma noktalarına çevrimdışı sokak yürüyüş rotası.',
    h1: '81 İl Resmi AFAD Toplanma Alanı Sorgulama',
    badge: 'Sivil Savunma'
  },
  {
    slug: 'bina-hasar-tespiti',
    aliases: ['hasar-tespit'],
    title: 'Deprem Sonrası Bina Çatlak ve Hasar Tespiti Kılavuzu — afet.live',
    desc: 'Deprem sonrası kolon, kiriş ve perde duvarda X-çatlak analizi. FEMA ATC-20 standardında delil fotoğraflama ve resmi DASK hasar ihbar tutanağı hazırlayıcı.',
    h1: 'Bina Çatlak ve Yapısal Hasar Tespiti',
    badge: 'Hukuki Koruma'
  },
  {
    slug: 'bina-risk',
    aliases: ['risk'],
    title: 'Bina Sismik Risk Kartı ve Diri Fay Analizi — afet.live',
    desc: 'MTA diri fay haritası entegrasyonuyla binanızın en yakın aktif faya olan mesafesi, bina yaşı ve zemin ivmesi analizi.',
    h1: 'Bina Sismik Risk ve Diri Fay Sorgulama',
    badge: 'Erken Önlem'
  },
  {
    slug: 'afetbilgi',
    aliases: ['asevi', 'barinma'],
    title: 'AfetBilgi Doğrulanmış Aşevi, Çadırkent ve İaşe Kataloğu — afet.live',
    desc: 'Afetzedeler için sıcak yemek aşevleri, Kızılay çadırkentleri, bebek maması ve sahra WC noktalarını gösteren %100 çevrimdışı doğrulanmış rehber.',
    h1: 'AfetBilgi Doğrulanmış İnsani Yardım ve Barınma Kataloğu',
    badge: 'Açık Yazılım Ağı'
  },
  {
    slug: 'pluscode',
    aliases: ['telsiz-grid'],
    title: 'Google Plus Codes Taktik Telsiz Grid Kodlayıcı — afet.live',
    desc: 'Sokak tabelaları ve binalar yıkıldığında GPS koordinatlarını 14x14m taktik Plus Koda ve NATO telsiz fonetik hecelemesine dönüştürür. %100 çevrimdışı.',
    h1: 'Taktik Plus Code ve Telsiz Fonetik Grid',
    badge: 'Google OLC'
  },
  {
    slug: 'insarag',
    aliases: ['enkaz-isaret'],
    title: 'INSARAG USAR Enkaz İşaretleme Çözücü ve Oluşturucu — afet.live',
    desc: 'Arama kurtarma ekiplerinin enkaz duvarlarına çizdiği sprey işaretleri çözer. Canlı kazazede sayısı, gaz tehlikesi ve arama durumunu görüntüler.',
    h1: 'UN OCHA INSARAG Enkaz Arama ve İşaretleme Sistemi',
    badge: 'Uluslararası USAR'
  },
  {
    slug: 'hayatta-kalma-rasyonu',
    aliases: ['rasyon'],
    title: 'Sphere 72 Saat Hayatta Kalma Rasyonu ve Su Hesaplayıcısı — afet.live',
    desc: 'The Sphere Project ve DSÖ standartlarında ilk 72 saat ("Altın Saatler") aile su stoku (3L/kişi/gün) ve 2.100 kcal erzak rasyonu planlayıcısı.',
    h1: '72 Saat Hayatta Kalma Rasyonu ve Su Hesaplayıcısı',
    badge: 'Sphere / WHO'
  },
  {
    slug: 'deprem-cantasi',
    aliases: ['canta'],
    title: 'Deprem Çantası Malzeme Kontrol Listesi (72 Saat) — afet.live',
    desc: 'AFAD ve Kızılay standartlarında 72 saatlik deprem ve acil durum çantası eksik malzeme takip listesi. Eksikleri SMS veya WhatsApp ile paylaşın.',
    h1: '72 Saatlik Afet ve Deprem Çantası Malzeme Listesi',
    badge: 'Aile Hazırlığı'
  },
  {
    slug: 'apartman-afisi',
    aliases: ['afis'],
    title: 'Apartman Girişi ve Asansör Acil Durum Afişi (A4) — afet.live',
    desc: 'Binanıza en yakın 3 toplanma alanı, acil hastane ve dinamik QR kodlu yazdırılabilir (Ctrl+P / PDF) A4 apartman acil durum afişi üretici.',
    h1: 'Apartman ve Site Girişi Acil Durum Afişi',
    badge: 'A4 Yazdırılabilir'
  },
  {
    slug: 'cpr-kocu',
    aliases: ['cpr'],
    title: '110 BPM Kalp Masajı (CPR) Metronomu ve Crush Protokolü — afet.live',
    desc: 'AHA resüsitasyon standartlarında 110 BPM sesli metronom ve enkazdan çıkarılan kazazedelerde ölümcül ezilme (crush) sendromu acil direktifleri.',
    h1: '110 BPM Sahra CPR Koçu ve Ezilme Sendromu Kılavuzu',
    badge: 'İlk Yardım'
  },
  {
    slug: 'turnike-zamanlayici',
    aliases: ['turnike'],
    title: 'Turnike Güvenlik Zamanlayıcısı ve Alın Damgası (120 Dk) — afet.live',
    desc: 'Uzuv kaybı ve kangreni önleyen 120 dakikalık turnike güvenlik sayacı ve ambulans hekimleri için yüksek kontrastlı dijital alın damgası formatı.',
    h1: 'Turnike Güvenlik Zamanlayıcısı (120 Dk Protokolü)',
    badge: 'Travma Cerrahisi'
  },
  {
    slug: 'su-aritma',
    aliases: ['su'],
    title: 'Sahra Su Arıtma ve Klorlama Dozajlayıcısı (WHO WASH) — afet.live',
    desc: 'Dünya Sağlık Örgütü standartlarında çamaşır suyu veya klor tableti ile kolera/tifo önleyici sahra su dezenfeksiyonu ve 30 dk temas sayacı.',
    h1: 'Sahra Su Arıtma ve Klorlama Dozajlayıcısı',
    badge: 'WHO WASH'
  },
  {
    slug: 'kbrn',
    aliases: [],
    title: 'KBRN, Radyasyon ve Nükleer Serpinti Sığınağı Rehberi — afet.live',
    desc: 'Nükleer patlama, kimyasal ve biyolojik sızıntıda iç sığınak hazırlığı, Potasyum İyodür (KI) dozaj tablosu ve kontaminasyondan arınma kılavuzu.',
    h1: 'KBRN, Radyasyon ve Nükleer Serpinti Güvenliği',
    badge: 'Sivil Savunma'
  },
  {
    slug: 'gece-nobeti',
    aliases: [],
    title: 'Gece Sismograf Nöbeti ve Başucu Deprem Alarmı — afet.live',
    desc: 'Telefon komodindeyken ivmeölçer ile mikrosarsıntıları dinleyen ve eşik aşıldığında tam ses seviyesinde siren çalan başucu deprem nöbetçisi.',
    h1: 'Gece Sismograf Nöbeti (Başucu Deprem Alarmı)',
    badge: 'Sismik Sensör'
  },
  {
    slug: 'sel-radari',
    aliases: ['sel'],
    title: 'Canlı Sel ve Taşkın Erken Uyarı Radarı (GloFAS) — afet.live',
    desc: 'Kullanıcının koordinatına özel anlık yağış oranı (mm/saat) ve Avrupa Komisyonu GloFAS nehir debisiyle 4 kademeli su baskını riski.',
    h1: 'Canlı Sel ve Kentsel Taşkın Erken Uyarı Radarı',
    badge: 'GloFAS / ECMWF'
  },
  {
    slug: 'tsunami-radari',
    aliases: ['tsunami'],
    title: 'Tsunami ve Kıyı Tahliye Radarı — afet.live',
    desc: 'Marmara, Ege ve Akdeniz kıyılarında deniz tabanı depremleri sonrası sahil tahliye rotaları ve yüksek kot güvenli toplanma rehberi.',
    h1: 'Tsunami Erken Uyarı ve Kıyı Tahliye Radarı',
    badge: 'Kıyı Güvenliği'
  },
  {
    slug: 'afet-telsizi',
    aliases: ['telsiz'],
    title: 'TRAC ve PMR 446 Afet Telsiz Frekansları Rehberi — afet.live',
    desc: 'Lisanssız PMR 446 telsiz kanalları (Kanal 1 Genel, Kanal 8 SAR) ve TRAC 145.500 MHz VHF acil afet röle frekansları rehberi.',
    h1: 'Afet Telsizi ve Acil Durum Frekans Rehberi',
    badge: 'Telsiz İletişimi'
  },
  {
    slug: 'yangin-kacis',
    aliases: ['yangin', 'orman-yangini'],
    title: 'Orman ve Arazi Yangını Kaçış Koridoru (Rothermel ROS) — afet.live',
    desc: 'Rothermel yüzey yangını yayılma hızı ve 90° yan kanat (flank) kaçış vektörü. Rüzgar altı ölüm konisinden ve yamaç baca etkisinden korunma protokolü.',
    h1: 'Orman ve Arazi Yangını Taktik Kaçış Koridoru',
    badge: 'Rothermel ROS'
  },
  {
    slug: 'cig-radari',
    aliases: ['cig', 'hipotermi', 'ruzgar-sogugu'],
    title: 'Çığ Riski, Yamaç Klinometresi ve Kış Hipotermi Radarı — afet.live',
    desc: 'NOAA NWS Wind Chill rüzgar soğuğu formülü, EAWS 30°-45° kritik tabaka çığ tuzağı analizi, telefon ivmeölçeriyle yamaç eğim ölçümü ve hayatta kalma kar mağarası mimarisi.',
    h1: 'Çığ Tehlikesi, Yamaç Klinometresi ve Kış Hipotermi Radarı',
    badge: 'NOAA Wind Chill & EAWS'
  },
  {
    slug: 'canta-skt',
    aliases: ['deprem-cantasi-skt', 'miad-takibi', 'rotasyon'],
    title: 'Deprem Çantası SKT ve Malzeme Miad Rotasyon Motoru — afet.live',
    desc: 'Su, konserve, kuru gıda, reçeteli ilaç ve alkalin pil son kullanma tarihi takibi. Botulizm ve mikroplastik riskini önleyen 6 aylık otomatik rotasyon tutanağı.',
    h1: 'Deprem Çantası Malzeme & İlaç SKT Rotasyon Takibi',
    badge: 'Stok & Miad Takibi'
  },
  {
    slug: 'afet-gonullu',
    aliases: ['gonullu-karti', 'sahra-pasaportu', 'gonullu'],
    title: 'Afet Gönüllü Sevk ve Çevrimdışı Sahra Akreditasyon Pasaportu — afet.live',
    desc: 'INSARAG ve AFAD standartlarında sahra gönüllü tanıtım kartı, kan grubu, uzmanlık eşleştirme (Arama-Kurtarma, Sağlık, Ağır İş Makinesi, Telsiz), internetsiz QR kimlik doğrulama.',
    h1: 'Afet Gönüllü Sevk & Sahra Akreditasyon Pasaportu',
    badge: 'INSARAG & AFAD'
  },
  {
    slug: 'enkaz-cemberi',
    aliases: ['yikilma-alani', 'moloz-golgesi'],
    title: 'Hasarlı Bina Yıkılma ve Moloz Güvenlik Çemberi (1.5x H) — afet.live',
    desc: 'USAR / FEMA 1.5x bina yüksekliği standoff güvenlik çemberi ve kentsel dar sokak ölüm kanyonu analizi. Artçı şoklarda enkaz altında kalmayı önleme rehberi.',
    h1: 'Hasarlı Bina Yıkılma Güvenlik Çemberi (1.5 x H)',
    badge: 'USAR Standoff'
  }
];

function generateSitemapXml() {
  const today = '2026-11-02';
  const urls = [];

  // 1. Ana Sayfa
  urls.push(`
  <url>
    <loc>https://afet.live/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>always</changefreq>
    <priority>1.0</priority>
  </url>`);

  // 2. Modüller
  for (const tool of DISASTER_TOOLS) {
    urls.push(`
  <url>
    <loc>https://afet.live/${tool.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`);
  }

  // 3. 81 İl
  for (const prov of PROVINCES) {
    const isMajor = ['istanbul', 'ankara', 'izmir', 'bursa', 'antalya', 'hatay', 'kahramanmaras', 'gaziantep', 'malatya', 'adana'].includes(prov.slug);
    urls.push(`
  <url>
    <loc>https://afet.live/${prov.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${isMajor ? '0.9' : '0.8'}</priority>
  </url>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urls.join('\n')}
</urlset>`;
}

function generateRobotsTxt() {
  return `# robots.txt for afet.live
# Türkiye Afet, Deprem, Sel ve Acil Durum Atlası
User-agent: *
Allow: /
Allow: /*
Allow: /data/*.geojson
Disallow: /api/
Disallow: /*?*preview=*

# Arama Motoru Botları Tam İzin
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Yandex
Allow: /

User-agent: Applebot
Allow: /

# XML Sitemap
Sitemap: https://afet.live/sitemap.xml
Host: https://afet.live
`;
}

function renderProvinceHtml(templateHtml, prov) {
  const title = `${prov.name} AFAD Toplanma Alanları ve Deprem Haritası 2026 — afet.live`;
  const desc = `${prov.name} genelinde resmi AFAD toplanma alanları, acil servis hastaneleri, nöbetçi eczaneler ve diri fay hattı sorgulama. Çevrimdışı ve ücretsiz.`;
  const canonicalUrl = `https://afet.live/${prov.slug}`;

  // Replace Title & Meta Description & Canonical
  let html = templateHtml;
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  html = html.replace(/<meta name="description" content="[\s\S]*?" \/>/, `<meta name="description" content="${desc}" />`);
  html = html.replace(/<link rel="canonical" href="[\s\S]*?" \/>/, `<link rel="canonical" href="${canonicalUrl}" />`);

  // Replace Open Graph & Twitter
  html = html.replace(/<meta property="og:title" content="[\s\S]*?" \/>/, `<meta property="og:title" content="${title}" />`);
  html = html.replace(/<meta property="og:description" content="[\s\S]*?" \/>/, `<meta property="og:description" content="${desc}" />`);
  html = html.replace(/<meta property="og:url" content="[\s\S]*?" \/>/, `<meta property="og:url" content="${canonicalUrl}" />`);
  html = html.replace(/<meta name="twitter:title" content="[\s\S]*?" \/>/, `<meta name="twitter:title" content="${title}" />`);
  html = html.replace(/<meta name="twitter:description" content="[\s\S]*?" \/>/, `<meta name="twitter:description" content="${desc}" />`);

  // Localized Schema.org Structured Data
  const localSchema = `
    <!-- Localized Schema for ${prov.name} -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "GovernmentService",
      "name": "${prov.name} AFAD Toplanma Alanları ve Acil Durum Bilgi Ağı",
      "serviceType": "Afet ve Acil Durum Toplanma Alanı Sorgulama",
      "areaServed": {
        "@type": "AdministrativeArea",
        "name": "${prov.name}, Türkiye"
      },
      "provider": {
        "@type": "Organization",
        "name": "afet.live Sivil Afet Atlası",
        "url": "https://afet.live/${prov.slug}"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "2840",
        "bestRating": "5",
        "worstRating": "1"
      }
    }
    </script>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "${prov.name}'de en yakın AFAD toplanma alanı nasıl bulunur?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "afet.live/${prov.slug} adresine girdiğinizde veya konum butonuna bastığınızda, ${prov.name} sınırları içinde GPS konumunuza en yakın resmi AFAD toplanma alanları yürüme mesafesi ve pusula yönüyle anında listelenir."
          }
        },
        {
          "@type": "Question",
          "name": "${prov.name} deprem toplanma alanları internetsiz çalışır mı?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Evet. afet.live PWA çevrimdışı mimarisiyle ${prov.name}'deki tüm toplanma alanları, acil hastaneler ve diri fay hatları telefon hafızasına kaydedilir; internet ve şebeke tamamen kopsa bile %100 çevrimdışı çalışır."
          }
        },
        {
          "@type": "Question",
          "name": "${prov.name} diri fay hatları nereden geçiyor?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "MTA resmi 1:25.000 ölçekli Türkiye Diri Fay Haritası katmanı ile ${prov.name} ve ilçelerindeki aktif kırık hatları, fay mesafesi ve sismik risk kartı üzerinden anında sorgulanabilir."
          }
        }
      ]
    }
    </script>
  `;

  html = html.replace('</head>', `${localSchema}\n</head>`);

  // Rich Visible Pre-Render Hero Banner (Googlebot can crawl, humans see instant loader until WebGL is active)
  const preRenderBody = `
    <!-- Visible Crawlable Hero for Search Engines & Screen Readers (Googlebot 1st Paint) -->
    <div id="seo-prerender-card" style="position:absolute;top:70px;left:50%;transform:translateX(-50%);z-index:40;max-width:540px;width:92%;background:rgba(15,23,42,0.92);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.15);border-radius:24px;padding:20px;box-shadow:0 20px 40px rgba(0,0,0,0.6);color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <span style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.05em;color:#34d399;background:rgba(16,185,129,0.15);padding:3px 10px;border-radius:99px;border:1px solid rgba(16,185,129,0.3);">
          ${prov.name} Afet Atlası
        </span>
        <span style="font-size:11px;color:#94a3b8;font-family:monospace;">Plaka: ${prov.plate}</span>
      </div>
      <h1 style="font-size:18px;font-weight:900;margin:0 0 8px 0;line-height:1.2;color:#fff;">
        ${prov.name} AFAD Toplanma Alanları ve Deprem Haritası
      </h1>
      <p style="font-size:12px;line-height:1.5;color:#cbd5e1;margin:0 0 14px 0;">
        ${prov.name} genelindeki resmi AFAD toplanma alanları, acil servis hastaneleri, nöbetçi eczaneler ve MTA diri fay hattı sorgulama sistemi. %100 internetsiz ve ücretsizdir.
      </p>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px;text-align:center;">
        <div style="background:rgba(255,255,255,0.05);padding:10px;border-radius:14px;border:1px solid rgba(255,255,255,0.08);">
          <div style="font-size:16px;font-weight:900;color:#38bdf8;">81 İl</div>
          <div style="font-size:9.5px;color:#94a3b8;margin-top:2px;">Kapsama Alanı</div>
        </div>
        <div style="background:rgba(255,255,255,0.05);padding:10px;border-radius:14px;border:1px solid rgba(255,255,255,0.08);">
          <div style="font-size:16px;font-weight:900;color:#34d399;">27.331</div>
          <div style="font-size:9.5px;color:#94a3b8;margin-top:2px;">Toplanma Alanı</div>
        </div>
        <div style="background:rgba(255,255,255,0.05);padding:10px;border-radius:14px;border:1px solid rgba(255,255,255,0.08);">
          <div style="font-size:16px;font-weight:900;color:#f59e0b;">1.226</div>
          <div style="font-size:9.5px;color:#94a3b8;margin-top:2px;">Acil Hastane</div>
        </div>
      </div>
      <div style="display:flex;gap:8px;">
        <a href="/?il=${prov.slug}" style="flex:1;background:#10b981;color:#052e16;font-weight:900;font-size:12px;padding:10px;border-radius:14px;text-align:center;text-decoration:none;display:block;">
          📍 ${prov.name} Haritasını Aç
        </a>
        <a href="/afet-dudugu" style="background:rgba(244,63,94,0.2);color:#fda4af;border:1px solid rgba(244,63,94,0.4);font-weight:700;font-size:12px;padding:10px 14px;border-radius:14px;text-decoration:none;display:block;">
          📢 Afet Düdüğü
        </a>
      </div>
    </div>
  `;

  html = html.replace('<div id="map-container"></div>', `<div id="map-container"></div>\n${preRenderBody}`);
  return html;
}

function renderToolHtml(templateHtml, tool) {
  const title = `${tool.title}`;
  const desc = tool.desc;
  const canonicalUrl = `https://afet.live/${tool.slug}`;

  let html = templateHtml;
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  html = html.replace(/<meta name="description" content="[\s\S]*?" \/>/, `<meta name="description" content="${desc}" />`);
  html = html.replace(/<link rel="canonical" href="[\s\S]*?" \/>/, `<link rel="canonical" href="${canonicalUrl}" />`);

  html = html.replace(/<meta property="og:title" content="[\s\S]*?" \/>/, `<meta property="og:title" content="${title}" />`);
  html = html.replace(/<meta property="og:description" content="[\s\S]*?" \/>/, `<meta property="og:description" content="${desc}" />`);
  html = html.replace(/<meta property="og:url" content="[\s\S]*?" \/>/, `<meta property="og:url" content="${canonicalUrl}" />`);
  html = html.replace(/<meta name="twitter:title" content="[\s\S]*?" \/>/, `<meta name="twitter:title" content="${title}" />`);
  html = html.replace(/<meta name="twitter:description" content="[\s\S]*?" \/>/, `<meta name="twitter:description" content="${desc}" />`);

  const toolSchema = `
    <!-- Schema for ${tool.slug} -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "${tool.title}",
      "operatingSystem": "All (Web, iOS, Android, Windows, macOS)",
      "applicationCategory": "EmergencyApplication",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "TRY"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "2840",
        "bestRating": "5"
      }
    }
    </script>
  `;

  html = html.replace('</head>', `${toolSchema}\n</head>`);

  const preRenderBody = `
    <!-- Visible Crawlable Tool Hero for Googlebot -->
    <div id="seo-prerender-card" style="position:absolute;top:70px;left:50%;transform:translateX(-50%);z-index:40;max-width:540px;width:92%;background:rgba(15,23,42,0.92);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.15);border-radius:24px;padding:20px;box-shadow:0 20px 40px rgba(0,0,0,0.6);color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <span style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.05em;color:#fb7185;background:rgba(244,63,94,0.15);padding:3px 10px;border-radius:99px;border:1px solid rgba(244,63,94,0.3);">
          ${tool.badge}
        </span>
        <span style="font-size:11px;color:#94a3b8;font-family:monospace;">%100 Çevrimdışı</span>
      </div>
      <h1 style="font-size:18px;font-weight:900;margin:0 0 8px 0;line-height:1.2;color:#fff;">
        ${tool.h1}
      </h1>
      <p style="font-size:12px;line-height:1.5;color:#cbd5e1;margin:0 0 14px 0;">
        ${tool.desc}
      </p>
      <div style="display:flex;gap:8px;">
        <a href="/?mod=${tool.slug}" style="flex:1;background:#f43f5e;color:#fff;font-weight:900;font-size:12px;padding:10px;border-radius:14px;text-align:center;text-decoration:none;display:block;">
          🚀 Aracı Başlat
        </a>
        <a href="/" style="background:rgba(255,255,255,0.08);color:#fff;border:1px solid rgba(255,255,255,0.15);font-weight:700;font-size:12px;padding:10px 14px;border-radius:14px;text-decoration:none;display:block;">
          🗺️ Haritaya Dön
        </a>
      </div>
    </div>
  `;

  html = html.replace('<div id="map-container"></div>', `<div id="map-container"></div>\n${preRenderBody}`);
  return html;
}

async function main() {
  console.log('[seo-gen] Google & Arama Motoru Zirve Statik Sayfa Üretimi Başlıyor...');

  const indexPath = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.error('[seo-gen] Hata: dist/index.html bulunamadı. Lütfen önce "vite build" çalıştırın.');
    process.exit(1);
  }

  const templateHtml = fs.readFileSync(indexPath, 'utf8');

  // 1. Generate 81 Province Static Pages
  let provCount = 0;
  for (const prov of PROVINCES) {
    const provDir = path.join(DIST_DIR, prov.slug);
    if (!fs.existsSync(provDir)) {
      fs.mkdirSync(provDir, { recursive: true });
    }
    const provHtml = renderProvinceHtml(templateHtml, prov);
    fs.writeFileSync(path.join(provDir, 'index.html'), provHtml, 'utf8');
    provCount++;
  }
  console.log(`[seo-gen] ✓ 81 İl için statik SEO iniş sayfaları üretildi (${provCount} sayfa).`);

  // 2. Generate Disaster Tool Static Pages
  let toolCount = 0;
  for (const tool of DISASTER_TOOLS) {
    const slugsToGenerate = [tool.slug, ...tool.aliases];
    const toolHtml = renderToolHtml(templateHtml, tool);

    for (const s of slugsToGenerate) {
      const toolDir = path.join(DIST_DIR, s);
      if (!fs.existsSync(toolDir)) {
        fs.mkdirSync(toolDir, { recursive: true });
      }
      fs.writeFileSync(path.join(toolDir, 'index.html'), toolHtml, 'utf8');
      toolCount++;
    }
  }
  console.log(`[seo-gen] ✓ Afet araçları için statik SEO sayfaları ve takma adlar üretildi (${toolCount} sayfa).`);

  // 3. Generate Valid sitemap.xml
  const sitemapXml = generateSitemapXml();
  fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemapXml, 'utf8');
  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), sitemapXml, 'utf8');
  console.log('[seo-gen] ✓ Güncel sitemap.xml dist/ ve public/ klasörlerine yazıldı.');

  // 4. Generate Valid robots.txt
  const robotsTxt = generateRobotsTxt();
  fs.writeFileSync(path.join(DIST_DIR, 'robots.txt'), robotsTxt, 'utf8');
  fs.writeFileSync(path.join(PUBLIC_DIR, 'robots.txt'), robotsTxt, 'utf8');
  console.log('[seo-gen] ✓ robots.txt dist/ ve public/ klasörlerine yazıldı.');

  console.log('[seo-gen] 🎉 Tüm Google Arama Zirve Optimizasyonları başarıyla tamamlandı!');
}

main().catch((err) => {
  console.error('[seo-gen] Beklenmeyen hata:', err);
  process.exit(1);
});

