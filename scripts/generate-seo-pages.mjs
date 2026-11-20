/**
 * generate-seo-pages.mjs
 * =============================================================================
 * afet.live — Arama motorları için statik sayfa üreteci (SSG)
 * =============================================================================
 * Googlebot ve diğer arama motorları JavaScript çalıştırmadan veya WebGL
 * yüklenmeden önce tam teşekküllü, zengin semantik HTML, Schema.org ve
 * coğrafi meta verisi bekler.
 *
 * Bu betik:
 * 1. 81 il için clean-URL statik sayfalar (/istanbul, /ankara, /hatay vb.)
 * 2. 20+ kritik afet aracı için statik sayfalar (/afet-dudugu, /son-depremler vb.)
 * 3. sitemap.xml ve robots.txt üretir.
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
    title: 'Afet Düdüğü — Telefondan Yüksek Sesli Düdük Tonu',
    desc: 'Telefon hoparlöründen yaklaşık 3 kHz yüksek sesli düdük tonu ve aralıklı bip çalar. Yalnızca yakındakiler duyar; ekran kapanırsa ses durabilir.',
    h1: 'Afet Düdüğü (yüksek sesli düdük tonu)',
    badge: 'Dikkat Çekme'
  },
  {
    slug: 'son-depremler',
    aliases: ['deprem-haritasi'],
    title: 'Son Depremler Listesi ve Haritası (Kandilli / AFAD) — afet.live',
    desc: 'Kandilli ve AFAD deprem listelerinden Türkiye ve çevresindeki son depremler: yer, büyüklük ve derinlik. Liste 20 saniyede bir yenilenir; erken uyarı değildir.',
    h1: 'Son Depremler Listesi ve Haritası',
    badge: 'Deprem Listesi'
  },
  {
    slug: 'toplanma-alanlari',
    aliases: ['toplanma'],
    title: 'AFAD Toplanma Alanları Sorgulama ve Haritası — afet.live',
    desc: 'AFAD açık verisinden derlenen 27.331 toplanma alanı haritada. Konumunuza en yakın alanları mesafe ve yön bilgisiyle listeler. Resmi kurum yayını değildir.',
    h1: '81 İlde AFAD Toplanma Alanı Sorgulama',
    badge: 'Toplanma Alanları'
  },
  {
    slug: 'bina-hasar-tespiti',
    aliases: ['hasar-tespit'],
    title: 'Deprem Sonrası Kişisel Hasar Notları — afet.live',
    desc: 'Deprem sonrası gördüğünüz çatlak ve hasarları kendi cihazınıza not edin. Bu notlar hasar tespiti veya delil sayılmaz; kesin karar için uzman incelemesi gerekir.',
    h1: 'Kişisel Hasar Notları',
    badge: 'Kişisel Not'
  },
  {
    slug: 'bina-risk',
    aliases: ['risk'],
    title: 'Bina Deprem Farkındalık Kartı ve Fay Zonu Mesafesi — afet.live',
    desc: 'Binanızın büyük fay zonlarına yaklaşık mesafesi ve bina yaşına göre kaba deprem farkındalık tahmini. Mühendislik analizi değildir.',
    h1: 'Bina Deprem Farkındalık Kartı',
    badge: 'Kaba Tahmin'
  },
  {
    slug: 'afetbilgi',
    aliases: ['asevi', 'barinma'],
    title: 'Acil Hatlar ve Yardım Bilgisi — afet.live',
    desc: 'Afet anında aranacak hatlar: 112 Acil, Kızılay 168, ALO 184 ve ALO 144. Açık yardım noktalarını AFAD ve Kızılay duyurur; bu sayfada güncel liste yoktur.',
    h1: 'Acil Hatlar ve Yardım Bilgisi',
    badge: 'Acil Hatlar'
  },
  {
    slug: 'pluscode',
    aliases: ['telsiz-grid'],
    title: 'Plus Code Konum Kodu ve Fonetik Okunuşu — afet.live',
    desc: 'Konumunuzu yaklaşık 14 metrelik kareyi gösteren Plus Code\'a çevirir ve NATO fonetik alfabesiyle okunuşunu verir. Kod hesabı çevrimdışı çalışır.',
    h1: 'Plus Code Konum Kodu ve Fonetik Okunuşu',
    badge: 'Açık Konum Kodu'
  },
  {
    slug: 'insarag',
    aliases: ['enkaz-isaret'],
    title: 'Enkaz Duvar İşaretlerini Okuma Yardımcısı — afet.live',
    desc: 'Arama ekiplerinin enkaz duvarına yazdığı işaretleri okumaya yardım eden basitleştirilmiş kılavuz. Ekip el kitabının yerini tutmaz; işaret ne olursa olsun binaya girmeyin.',
    h1: 'Enkaz İşaretlerini Okuma Yardımcısı',
    badge: 'Basitleştirilmiş Kılavuz'
  },
  {
    slug: 'hayatta-kalma-rasyonu',
    aliases: ['rasyon'],
    title: 'Aile Su ve Erzak Hesaplayıcısı — afet.live',
    desc: 'Hane sayısına göre su ve erzak ihtiyacını hesaplar: kişi başı günde toplam 15 litre su (yaklaşık 3 litresi içme) ve 2.100 kcal. Sphere asgari değerlerine dayanır.',
    h1: 'Aile Su ve Erzak Hesaplayıcısı',
    badge: 'Hazırlık Planı'
  },
  {
    slug: 'deprem-cantasi',
    aliases: ['canta'],
    title: 'Deprem Çantası Malzeme Kontrol Listesi — afet.live',
    desc: 'Deprem ve acil durum çantası için genel malzeme kontrol listesi. Eksikleri işaretleyin, listeyi SMS veya WhatsApp ile paylaşın.',
    h1: 'Deprem Çantası Malzeme Kontrol Listesi',
    badge: 'Aile Hazırlığı'
  },
  {
    slug: 'apartman-afisi',
    aliases: ['afis'],
    title: 'Apartman Girişi Acil Durum Afişi (A4) — afet.live',
    desc: 'Binanıza en yakın toplanma alanlarını, en yakın hastaneyi ve QR kodu içeren yazdırılabilir A4 apartman afişi. Veriler açık kaynaklardan gelir; yerinde doğrulayın.',
    h1: 'Apartman ve Site Girişi Acil Durum Afişi',
    badge: 'A4 Yazdırılabilir'
  },
  {
    slug: 'cpr-kocu',
    aliases: ['cpr'],
    title: 'Kalp Masajı (CPR) Metronomu — 110 Vuruş/Dakika — afet.live',
    desc: 'Kalp masajı ritmini tutmanız için dakikada 110 vuruşluk sesli metronom ve temel hatırlatmalar. İlk yardım eğitiminin yerini tutmaz; önce 112\'yi arayın.',
    h1: 'Kalp Masajı (CPR) Metronomu',
    badge: 'İlk Yardım'
  },
  {
    slug: 'turnike-zamanlayici',
    aliases: ['turnike'],
    title: 'Turnike Süre Takibi — afet.live',
    desc: 'Turnikenin uygulandığı saati kaydeder ve geçen süreyi gösterir. Turnikeyi gevşetmeyin; 112\'yi arayın. İlk yardım eğitiminin yerini tutmaz.',
    h1: 'Turnike Süre Takibi',
    badge: 'İlk Yardım'
  },
  {
    slug: 'su-aritma',
    aliases: ['su'],
    title: 'Acil Durumda Su Dezenfeksiyonu Hesaplayıcısı — afet.live',
    desc: 'Kokusuz çamaşır suyu ile içme suyu dezenfeksiyonu için damla hesabı ve 30 dakikalık bekleme sayacı. Mümkünse suyu kaynatın; genel rehberdir.',
    h1: 'Acil Durumda Su Dezenfeksiyonu',
    badge: 'Genel Rehber'
  },
  {
    slug: 'kbrn',
    aliases: [],
    title: 'KBRN ve Kimyasal Sızıntıda Korunma Rehberi — afet.live',
    desc: 'Kimyasal, biyolojik, radyolojik ve nükleer olaylarda kapalı alanda korunma, rüzgara göre uzaklaşma ve arınma için genel bilgiler. Yetkililerin talimatı önceliklidir.',
    h1: 'KBRN ve Kimyasal Sızıntıda Korunma Rehberi',
    badge: 'Genel Rehber'
  },
  {
    slug: 'gece-nobeti',
    aliases: [],
    title: 'Gece Nöbeti — Telefon Sarsıntı Alarmı — afet.live',
    desc: 'Telefon sabit dururken ivmeölçeri güçlü ve sürekli sarsıntı algılarsa yüksek sesle alarm çalar. Ekran açık kalmalıdır; çalacağı kesin değildir.',
    h1: 'Gece Nöbeti (telefon sarsıntı alarmı)',
    badge: 'Telefon Sensörü'
  },
  {
    slug: 'sel-radari',
    aliases: ['sel'],
    title: 'Sel ve Taşkın Riski Tahmini (Open-Meteo / GloFAS) — afet.live',
    desc: 'Konumunuz için Open-Meteo yağış verisi ve GloFAS nehir debisi tahminine dayalı kaba sel riski göstergesi. Meteoroloji uyarılarının yerini tutmaz.',
    h1: 'Sel ve Taşkın Riski Tahmini',
    badge: 'Open-Meteo / GloFAS'
  },
  {
    slug: 'tsunami-radari',
    aliases: ['tsunami'],
    title: 'Tsunami Bilgi ve Kıyı Tahliye Rehberi — afet.live',
    desc: 'Kıyıda güçlü ya da uzun süren sarsıntıdan sonra ne yapmalı: uyarı beklemeden yükseğe ve iç kesime gidin. Bu sayfa tsunami uyarısı vermez, deniz seviyesi ölçmez.',
    h1: 'Tsunami Bilgi ve Kıyı Tahliye Rehberi',
    badge: 'Kıyı Güvenliği'
  },
  {
    slug: 'afet-telsizi',
    aliases: ['telsiz'],
    title: 'PMR446 Telsiz Kanalları ve Frekans Listesi — afet.live',
    desc: 'Lisans gerektirmeyen PMR446 el telsizi kanalları ve frekansları. Belirlenmiş bir afet kanalı yoktur; amatör telsiz bantları lisans gerektirir.',
    h1: 'PMR446 Telsiz Kanalları ve Frekans Listesi',
    badge: 'Telsiz Bilgisi'
  },
  {
    slug: 'yangin-kacis',
    aliases: ['yangin', 'orman-yangini'],
    title: 'Orman Yangınında Rüzgara Göre Yön Rehberi — afet.live',
    desc: 'Seçtiğiniz rüzgar yönüne göre rüzgara dik olası uzaklaşma yönlerini gösterir. Yangının yerini bilmez; 112\'yi arayın, tahliye talimatı önceliklidir.',
    h1: 'Orman Yangınında Rüzgara Göre Yön Rehberi',
    badge: 'Genel Kural'
  },
  {
    slug: 'cig-radari',
    aliases: ['cig', 'hipotermi', 'ruzgar-sogugu'],
    title: 'Çığ Eğimi, Rüzgar Soğuğu ve Hipotermi Rehberi — afet.live',
    desc: 'Rüzgar soğuğu (hissedilen sıcaklık) hesabı, telefonla yamaç eğimi ölçümü ve hipotermiye karşı genel bilgiler. Çığ bülteni değildir.',
    h1: 'Çığ Eğimi, Rüzgar Soğuğu ve Hipotermi Rehberi',
    badge: 'Kış Güvenliği'
  },
  {
    slug: 'canta-skt',
    aliases: ['deprem-cantasi-skt', 'miad-takibi', 'rotasyon'],
    title: 'Deprem Çantası Son Kullanma Tarihi Takibi — afet.live',
    desc: 'Çantanızdaki su, gıda, ilaç ve pillerin son kullanma tarihini ambalajdan okuyup girin; yaklaşan ve geçen tarihleri gösterir. Kayıt cihazınızda kalır.',
    h1: 'Deprem Çantası Son Kullanma Tarihi Takibi',
    badge: 'SKT Takibi'
  },
  {
    slug: 'afet-gonullu',
    aliases: ['gonullu-karti', 'sahra-pasaportu', 'gonullu'],
    title: 'Gönüllü Bilgi Kartı (kişisel beyan) — afet.live',
    desc: 'Adınızı, kan grubunuzu ve becerilerinizi içeren kişisel beyan kartı ve QR kodu. Kimlik ya da yetki belgesi değildir. Gönüllülük başvurusu: gonullu.afad.gov.tr',
    h1: 'Gönüllü Bilgi Kartı (kişisel beyan)',
    badge: 'Kişisel Beyan'
  },
  {
    slug: 'enkaz-cemberi',
    aliases: ['yikilma-alani', 'moloz-golgesi'],
    title: 'Hasarlı Binadan Uzak Durma Mesafesi (1,5 × yükseklik) — afet.live',
    desc: 'Hasarlı binadan ne kadar uzak durmanız gerektiğini bina yüksekliğinin en az 1,5 katı kuralıyla tahmin eder. Kaba hesaptır; artçılarda binalardan uzak durun.',
    h1: 'Hasarlı Binadan Uzak Durma Mesafesi',
    badge: 'Tahmini Mesafe'
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
  const desc = `${prov.name} genelinde AFAD açık verisinden toplanma alanları, hastaneler, eczaneler ve basitleştirilmiş fay zonları haritası. Ücretsiz.`;
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
      "@type": "Service",
      "name": "${prov.name} Toplanma Alanları Haritası (afet.live)",
      "serviceType": "Toplanma alanı haritası (gönüllü, açık kaynak; kamu kurumu hizmeti değildir)",
      "areaServed": {
        "@type": "AdministrativeArea",
        "name": "${prov.name}, Türkiye"
      },
      "provider": {
        "@type": "Organization",
        "name": "afet.live (gönüllü açık kaynak proje)",
        "url": "https://afet.live/${prov.slug}"
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
            "text": "afet.live/${prov.slug} adresine girdiğinizde veya konum butonuna bastığınızda, ${prov.name} sınırları içinde konumunuza en yakın toplanma alanları mesafe ve yön bilgisiyle listelenir. Veriler AFAD açık verisinden derlenir; afet.live bir kamu kurumu yayını değildir."
          }
        },
        {
          "@type": "Question",
          "name": "${prov.name} deprem toplanma alanları internetsiz çalışır mı?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Kısmen. Siteyi internet varken açıp verileri cihazınıza kaydederseniz ${prov.name}'deki toplanma alanları ve hastaneler çoğu durumda internetsiz de görüntülenebilir. Tarayıcı kayıtlı veriyi silebilir; çevrimdışı açılış kesin değildir. Harita görüntüsü ve yürüyüş rotası internet gerektirir."
          }
        },
        {
          "@type": "Question",
          "name": "${prov.name} diri fay hatları nereden geçiyor?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "afet.live'daki basitleştirilmiş fay zonları katmanı ${prov.name} için büyük fay zonlarına yaklaşık mesafeyi gösterir. Bu katman MTA'nın resmi Diri Fay Haritası değildir; kesin bilgi için MTA'ya başvurun."
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
        ${prov.name} genelinde AFAD açık verisinden toplanma alanları, hastaneler, eczaneler ve basitleştirilmiş fay zonları haritası. Ücretsizdir; bir kamu kurumu yayını değildir.
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
          <div style="font-size:16px;font-weight:900;color:#f59e0b;">950+</div>
          <div style="font-size:9.5px;color:#94a3b8;margin-top:2px;">Hastane</div>
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
      "applicationCategory": "UtilitiesApplication",
      "description": "${tool.desc}",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "TRY"
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
        <span style="font-size:11px;color:#94a3b8;font-family:monospace;">Ücretsiz</span>
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

/**
 * Uygulamanın yol tabanlı açtığı araçlar (src/utils/deepLink.ts → TOOL_PATH_MAP).
 * Statik SEO sayfası olmayanlar için index.html kopyası yazılır; böylece site
 * bilinmeyen adreslere ana sayfa yerine gerçek 404 döndürebilir.
 */
function readAppToolPaths() {
  const src = fs.readFileSync(path.join(ROOT_DIR, 'src', 'utils', 'deepLink.ts'), 'utf8');
  const start = src.indexOf('TOOL_PATH_MAP');
  const end = src.indexOf('export function parseDeepLink');
  const block = src.slice(start, end);
  const slugs = [...block.matchAll(/'([a-z0-9-]+)':\s*'/g)].map((x) => x[1]);
  // Ayrıştırma bozulursa sessizce eksik sayfa üretmek yerine build'i durdur.
  if (start < 0 || end < 0 || slugs.length < 50) {
    throw new Error(`deepLink.ts TOOL_PATH_MAP okunamadı (${slugs.length} yol bulundu)`);
  }
  return [...new Set(slugs)];
}

/** Uygulama içi araç yolu: arayüz aynı, dizine eklenmez, kanonik adres ana sayfa. */
function renderAppRouteHtml(templateHtml) {
  return templateHtml.replace(
    /<meta name="robots" content="[^"]*" \/>/,
    '<meta name="robots" content="noindex, follow" />'
  );
}

function render404Html() {
  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>Sayfa bulunamadı · afet.live</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<style>
  :root { color-scheme: dark; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #090a0f; color: #e5e7eb;
         font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; padding: 16px; box-sizing: border-box; }
  main { max-width: 420px; text-align: center; }
  h1 { font-size: 20px; margin: 0 0 8px; color: #fff; }
  p { font-size: 14px; line-height: 1.5; color: #9ca3af; margin: 0 0 20px; }
  a { display: inline-block; margin: 4px; padding: 10px 16px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 14px; }
  .primary { background: #10b981; color: #052e16; }
  .secondary { background: rgba(255,255,255,0.08); color: #fff; border: 1px solid rgba(255,255,255,0.15); }
  .code { font-family: ui-monospace, monospace; color: #34d399; font-size: 12px; letter-spacing: .1em; margin-bottom: 12px; }
</style>
</head>
<body>
<main>
  <div class="code">404</div>
  <h1>Aradığınız sayfa bulunamadı</h1>
  <p>Adres yanlış yazılmış ya da sayfa kaldırılmış olabilir. Toplanma alanları, hastaneler ve eczaneler haritada.</p>
  <a class="primary" href="/">🗺️ Haritaya git</a>
  <a class="secondary" href="/toplanma-alanlari">En yakın toplanma alanı</a>
  <p style="margin-top:20px;font-size:12px">Acil durumda 112'yi arayın.</p>
</main>
</body>
</html>
`;
}

async function main() {
  console.log('[seo-gen] Statik sayfa üretimi başlıyor...');

  const indexPath = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.error('[seo-gen] Hata: dist/index.html bulunamadı. Lütfen önce "vite build" çalıştırın.');
    process.exit(1);
  }

  const templateHtml = fs.readFileSync(indexPath, 'utf8');

  // 1. Generate 81 Province Static Pages
  let provCount = 0;
  for (const prov of PROVINCES) {
    // <slug>.html olarak yazılır: Cloudflare Pages /<slug> adresini sona '/' eklemeden sunar.
    // (<slug>/index.html, middleware'in sondaki '/' kaldırmasıyla sonsuz yönlendirme döngüsüne giriyordu.)
    const provHtml = renderProvinceHtml(templateHtml, prov);
    fs.writeFileSync(path.join(DIST_DIR, `${prov.slug}.html`), provHtml, 'utf8');
    provCount++;
  }
  console.log(`[seo-gen] ✓ 81 İl için statik SEO iniş sayfaları üretildi (${provCount} sayfa).`);

  // 2. Generate Disaster Tool Static Pages
  let toolCount = 0;
  for (const tool of DISASTER_TOOLS) {
    const slugsToGenerate = [tool.slug, ...tool.aliases];
    const toolHtml = renderToolHtml(templateHtml, tool);

    for (const s of slugsToGenerate) {
      fs.writeFileSync(path.join(DIST_DIR, `${s}.html`), toolHtml, 'utf8');
      toolCount++;
    }
  }
  console.log(`[seo-gen] ✓ Afet araçları için statik SEO sayfaları ve takma adlar üretildi (${toolCount} sayfa).`);

  // 2b. Statik sayfası olmayan uygulama içi araç yolları
  const appRouteHtml = renderAppRouteHtml(templateHtml);
  let appRouteCount = 0;
  for (const slug of readAppToolPaths()) {
    const file = path.join(DIST_DIR, `${slug}.html`);
    if (fs.existsSync(file)) continue;
    fs.writeFileSync(file, appRouteHtml, 'utf8');
    appRouteCount++;
  }
  console.log(`[seo-gen] ✓ Uygulama içi araç yolları için ${appRouteCount} sayfa üretildi (noindex).`);

  // 2c. Gerçek 404 sayfası. Cloudflare Pages, dist/404.html varsa bilinmeyen
  // adreslere ana sayfa (200) yerine bu sayfayı 404 durum koduyla döndürür.
  fs.writeFileSync(path.join(DIST_DIR, '404.html'), render404Html(), 'utf8');
  console.log('[seo-gen] ✓ 404.html yazıldı.');

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

  console.log('[seo-gen] Statik sayfa üretimi tamamlandı.');
}

main().catch((err) => {
  console.error('[seo-gen] Beklenmeyen hata:', err);
  process.exit(1);
});

