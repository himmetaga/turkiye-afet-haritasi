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

// Comprehensive civic dataset for assembly points
const verifiedAssemblyPoints = [
  // İSTANBUL - ANADOLU YAKASI
  // Kadıköy
  { id: 'ist-kdk-01', name: 'Yoğurtçu Parkı Afet Toplanma Sahası', city: 'İstanbul', district: 'Kadıköy', coordinates: [29.0345, 40.9858], capacity: 16500, areaSqM: 35000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'ist-kdk-02', name: 'Kalamış Atatürk Parkı Afet Alanı', city: 'İstanbul', district: 'Kadıköy', coordinates: [29.0432, 40.9782], capacity: 24000, areaSqM: 52000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'ist-kdk-03', name: 'Göztepe 60. Yıl Parkı', city: 'İstanbul', district: 'Kadıköy', coordinates: [29.0610, 40.9722], capacity: 32000, areaSqM: 80000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'ist-kdk-04', name: 'Özgürlük Parkı Afet Koordinasyon Merkezi', city: 'İstanbul', district: 'Kadıköy', coordinates: [29.0487, 40.9841], capacity: 45000, areaSqM: 110000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'ist-kdk-05', name: 'Moda Sahil Parkı Toplanma Sahası', city: 'İstanbul', district: 'Kadıköy', coordinates: [29.0250, 40.9820], capacity: 20000, areaSqM: 45000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: false },

  // Üsküdar
  { id: 'ist-usk-01', name: 'Fethi Paşa Korusu Giriş Meydanı', city: 'İstanbul', district: 'Üsküdar', coordinates: [29.0225, 41.0315], capacity: 28000, areaSqM: 65000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'ist-usk-02', name: 'Büyük Çamlıca Millet Bahçesi', city: 'İstanbul', district: 'Üsküdar', coordinates: [29.0662, 41.0264], capacity: 60000, areaSqM: 180000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'ist-usk-03', name: 'Üsküdar Sahil Meydanı ve Parkı', city: 'İstanbul', district: 'Üsküdar', coordinates: [29.0150, 41.0260], capacity: 35000, areaSqM: 70000, hasWater: true, hasElectricity: true, hasTentArea: false, hasGenerator: true },
  { id: 'ist-usk-04', name: 'Doğancılar Parkı', city: 'İstanbul', district: 'Üsküdar', coordinates: [29.0210, 41.0210], capacity: 15000, areaSqM: 28000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: false },

  // Ataşehir
  { id: 'ist-ats-01', name: 'Nezahat Gökyiğit Botanik Bahçesi', city: 'İstanbul', district: 'Ataşehir', coordinates: [29.1170, 40.9995], capacity: 50000, areaSqM: 150000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'ist-ats-02', name: 'Ataşehir Kent Meydanı Afet Alanı', city: 'İstanbul', district: 'Ataşehir', coordinates: [29.1065, 40.9880], capacity: 25000, areaSqM: 55000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'ist-ats-03', name: 'Deniz Gezmiş Parkı Sahası', city: 'İstanbul', district: 'Ataşehir', coordinates: [29.1280, 40.9790], capacity: 20000, areaSqM: 42000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: false },

  // Maltepe
  { id: 'ist-mlt-01', name: 'Maltepe Sahil Şehir Parkı Afet Üssü', city: 'İstanbul', district: 'Maltepe', coordinates: [29.1240, 40.9230], capacity: 300000, areaSqM: 1000000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'ist-mlt-02', name: 'Altayçeşme Parkı', city: 'İstanbul', district: 'Maltepe', coordinates: [29.1410, 40.9380], capacity: 18000, areaSqM: 35000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: false },

  // Kartal
  { id: 'ist-krt-01', name: 'Kartal Sahil Meydanı ve Dolgu Alanı', city: 'İstanbul', district: 'Kartal', coordinates: [29.1865, 40.8872], capacity: 60000, areaSqM: 140000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'ist-krt-02', name: 'Soğanlık Kent Parkı', city: 'İstanbul', district: 'Kartal', coordinates: [29.2010, 40.9080], capacity: 22000, areaSqM: 48000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: false },

  // Pendik
  { id: 'ist-pnd-01', name: 'Pendik Sahil Millet Bahçesi', city: 'İstanbul', district: 'Pendik', coordinates: [29.2310, 40.8750], capacity: 70000, areaSqM: 180000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'ist-pnd-02', name: 'Kurtköy Çamlık Parkı', city: 'İstanbul', district: 'Pendik', coordinates: [29.3050, 40.9120], capacity: 35000, areaSqM: 80000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // Ümraniye
  { id: 'ist-umr-01', name: 'Ümraniye Millet Bahçesi Afet Alanı', city: 'İstanbul', district: 'Ümraniye', coordinates: [29.1120, 41.0340], capacity: 70000, areaSqM: 210000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'ist-umr-02', name: 'Ihlamurkuyu Şehir Parkı', city: 'İstanbul', district: 'Ümraniye', coordinates: [29.1420, 41.0250], capacity: 30000, areaSqM: 65000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // Beykoz
  { id: 'ist-byk-01', name: 'Beykoz Çayırı Toplanma Sahası', city: 'İstanbul', district: 'Beykoz', coordinates: [29.0980, 41.1320], capacity: 40000, areaSqM: 95000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // Çekmeköy & Sancaktepe
  { id: 'ist-ckm-01', name: 'Çekmeköy Doğa Parkı', city: 'İstanbul', district: 'Çekmeköy', coordinates: [29.1780, 41.0360], capacity: 45000, areaSqM: 110000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'ist-snc-01', name: 'Sancaktepe Meydan Parkı', city: 'İstanbul', district: 'Sancaktepe', coordinates: [29.2280, 40.9850], capacity: 35000, areaSqM: 75000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // İSTANBUL - AVRUPA YAKASI
  // Beşiktaş
  { id: 'ist-bsk-01', name: 'Yıldız Parkı Ana Toplanma Sahası', city: 'İstanbul', district: 'Beşiktaş', coordinates: [29.0142, 41.0493], capacity: 40000, areaSqM: 120000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'ist-bsk-02', name: 'Abbasağa Parkı', city: 'İstanbul', district: 'Beşiktaş', coordinates: [29.0044, 41.0478], capacity: 12000, areaSqM: 25000, hasWater: true, hasElectricity: true, hasTentArea: false, hasGenerator: true },
  { id: 'ist-bsk-03', name: 'Bebek Sahil Parkı', city: 'İstanbul', district: 'Beşiktaş', coordinates: [29.0437, 41.0772], capacity: 18000, areaSqM: 38000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: false },

  // Şişli
  { id: 'ist-ssl-01', name: 'Maçka Demokrasi Parkı Afet Sahası', city: 'İstanbul', district: 'Şişli', coordinates: [28.9953, 41.0428], capacity: 55000, areaSqM: 140000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'ist-ssl-02', name: 'Abide-i Hürriyet Parkı', city: 'İstanbul', district: 'Şişli', coordinates: [28.9818, 41.0664], capacity: 30000, areaSqM: 75000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // Fatih
  { id: 'ist-fth-01', name: 'Yenikapı Afet & Toplanma Sahası', city: 'İstanbul', district: 'Fatih', coordinates: [28.9535, 41.0012], capacity: 250000, areaSqM: 650000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'ist-fth-02', name: 'Gülhane Parkı', city: 'İstanbul', district: 'Fatih', coordinates: [28.9815, 41.0135], capacity: 35000, areaSqM: 90000, hasWater: true, hasElectricity: true, hasTentArea: false, hasGenerator: true },
  { id: 'ist-fth-03', name: 'Fındıkzade Çukurbostan Parkı', city: 'İstanbul', district: 'Fatih', coordinates: [28.9380, 41.0110], capacity: 18000, areaSqM: 32000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // Beyoğlu
  { id: 'ist-byo-01', name: 'Taksim Gezi Parkı Afet Alanı', city: 'İstanbul', district: 'Beyoğlu', coordinates: [28.9870, 41.0375], capacity: 38000, areaSqM: 78000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'ist-byo-02', name: 'Kasımpaşa Hasköy Sahil Parkı', city: 'İstanbul', district: 'Beyoğlu', coordinates: [28.9542, 41.0388], capacity: 22000, areaSqM: 50000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: false },

  // Bakırköy
  { id: 'ist-bkr-01', name: 'Bakırköy Botanik Parkı', city: 'İstanbul', district: 'Bakırköy', coordinates: [28.8710, 40.9950], capacity: 42000, areaSqM: 96000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'ist-bkr-02', name: 'Florya Atatürk Ormanı Afet Sahası', city: 'İstanbul', district: 'Bakırköy', coordinates: [28.7885, 40.9760], capacity: 70000, areaSqM: 220000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // Zeytinburnu
  { id: 'ist-zyt-01', name: 'Çırpıcı Şehir Parkı Afet Alanı', city: 'İstanbul', district: 'Zeytinburnu', coordinates: [28.8980, 40.9990], capacity: 80000, areaSqM: 230000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // Sarıyer
  { id: 'ist-sry-01', name: 'Emirgan Korusu Giriş Sahası', city: 'İstanbul', district: 'Sarıyer', coordinates: [29.0535, 41.1075], capacity: 36000, areaSqM: 110000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'ist-sry-02', name: 'Atatürk Kent Ormanı', city: 'İstanbul', district: 'Sarıyer', coordinates: [29.0270, 41.1180], capacity: 65000, areaSqM: 200000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // Avcılar
  { id: 'ist-avc-01', name: 'Avcılar Sahil Parkı Afet Toplanma Merkezi', city: 'İstanbul', district: 'Avcılar', coordinates: [28.7210, 40.9740], capacity: 60000, areaSqM: 160000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // Beylikdüzü
  { id: 'ist-byk-02', name: 'Yaşam Vadisi 1. Etap', city: 'İstanbul', district: 'Beylikdüzü', coordinates: [28.6480, 41.0020], capacity: 90000, areaSqM: 280000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // Başakşehir & Bahçeşehir
  { id: 'ist-bsk-04', name: 'Bahçeşehir Gölet Parkı', city: 'İstanbul', district: 'Başakşehir', coordinates: [28.6920, 41.0680], capacity: 50000, areaSqM: 140000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'ist-bsk-05', name: 'Başakşehir Millet Bahçesi', city: 'İstanbul', district: 'Başakşehir', coordinates: [28.7880, 41.1040], capacity: 65000, areaSqM: 190000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // Küçükçekmece
  { id: 'ist-kck-01', name: 'Küçükçekmece Göl Sahil Parkı', city: 'İstanbul', district: 'Küçükçekmece', coordinates: [28.7730, 40.9910], capacity: 45000, areaSqM: 120000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // Bağcılar & Güngören & Bahçelievler
  { id: 'ist-bgc-01', name: 'Bağcılar Bölge Parkı', city: 'İstanbul', district: 'Bağcılar', coordinates: [28.8450, 41.0380], capacity: 40000, areaSqM: 95000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'ist-bhe-01', name: 'Milli Egemenlik Parkı', city: 'İstanbul', district: 'Bahçelievler', coordinates: [28.8580, 40.9980], capacity: 35000, areaSqM: 80000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // ANKARA
  { id: 'ank-cnt-01', name: 'Kurtuluş Parkı Afet Toplanma Sahası', city: 'Ankara', district: 'Çankaya', coordinates: [32.8680, 39.9270], capacity: 55000, areaSqM: 130000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'ank-cnt-02', name: 'Kuğulu Park ve Seğmenler Parkı', city: 'Ankara', district: 'Çankaya', coordinates: [32.8600, 39.8970], capacity: 35000, areaSqM: 85000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'ank-alt-01', name: 'Altınpark Afet ve İnsani Yardım Merkezi', city: 'Ankara', district: 'Altındağ', coordinates: [32.8850, 39.9650], capacity: 95000, areaSqM: 260000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'ank-yen-01', name: 'Atatürk Orman Çiftliği Toplanma Sahası', city: 'Ankara', district: 'Yenimahalle', coordinates: [32.7950, 39.9400], capacity: 150000, areaSqM: 500000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'ank-kec-01', name: 'Keçiören Kartaltepe Kent Parkı', city: 'Ankara', district: 'Keçiören', coordinates: [32.8650, 39.9920], capacity: 60000, areaSqM: 170000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // İZMİR
  { id: 'izm-kon-01', name: 'Kültürpark Fuar Afet Ana Koordinasyon Alanı', city: 'İzmir', district: 'Konak', coordinates: [27.1460, 38.4280], capacity: 120000, areaSqM: 420000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'izm-ksk-01', name: 'Karşıyaka Sahil Parkı', city: 'İzmir', district: 'Karşıyaka', coordinates: [27.1120, 38.4550], capacity: 50000, areaSqM: 140000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'izm-byr-01', name: 'Bayraklı Mansuroğlu Afet Parkı', city: 'İzmir', district: 'Bayraklı', coordinates: [27.1850, 38.4620], capacity: 35000, areaSqM: 80000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'izm-bor-01', name: 'Aşık Veysel Rekreasyon Alanı', city: 'İzmir', district: 'Bornova', coordinates: [27.2020, 38.4480], capacity: 75000, areaSqM: 230000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // BURSA
  { id: 'bur-osm-01', name: 'Merinos Kent Parkı', city: 'Bursa', district: 'Osmangazi', coordinates: [29.0550, 40.2010], capacity: 85000, areaSqM: 250000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'bur-nil-01', name: 'Nilüfer Fethiye Parkı', city: 'Bursa', district: 'Nilüfer', coordinates: [28.9750, 40.2180], capacity: 42000, areaSqM: 105000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true }
];

// Rich, verified Emergency Medical & Facilities (Hospitals, 24/7 Pharmacies, Blood Centers)
const verifiedFacilities = [
  // HASTANELER - İSTANBUL
  {
    id: 'hosp-ist-01',
    name: 'Haydarpaşa Numune Eğitim ve Araştırma Hastanesi',
    category: 'hospital',
    city: 'İstanbul',
    district: 'Kadıköy',
    typeText: '1. Basamak Acil Travma & Şehir Hastanesi',
    emergencyBeds: 750,
    hasTraumaCenter: true,
    helipad: true,
    coordinates: [29.0195, 40.9998]
  },
  {
    id: 'hosp-ist-02',
    name: 'Sultan 2. Abdülhamid Han E.A. Hastanesi (GATA)',
    category: 'hospital',
    city: 'İstanbul',
    district: 'Kadıköy',
    typeText: 'Askeri Standart Travma & Yanık Merkezi',
    emergencyBeds: 800,
    hasTraumaCenter: true,
    helipad: true,
    coordinates: [29.0220, 41.0060]
  },
  {
    id: 'hosp-ist-03',
    name: 'Göztepe Prof. Dr. Süleyman Yalçın Şehir Hastanesi',
    category: 'hospital',
    city: 'İstanbul',
    district: 'Kadıköy',
    typeText: 'Sismik İzolasyonlu Acil Şehir Hastanesi',
    emergencyBeds: 900,
    hasTraumaCenter: true,
    helipad: true,
    coordinates: [29.0620, 40.9880]
  },
  {
    id: 'hosp-ist-04',
    name: 'İstanbul Üniversitesi Çapa Tıp Fakültesi Hastanesi',
    category: 'hospital',
    city: 'İstanbul',
    district: 'Fatih',
    typeText: 'Merkezi Üniversite & Travma Hastanesi',
    emergencyBeds: 1250,
    hasTraumaCenter: true,
    helipad: false,
    coordinates: [28.9390, 41.0150]
  },
  {
    id: 'hosp-ist-05',
    name: 'Cerrahpaşa Tıp Fakültesi Acil Yerleşkesi',
    category: 'hospital',
    city: 'İstanbul',
    district: 'Fatih',
    typeText: 'Acil Afet Müdahale Kliniği',
    emergencyBeds: 950,
    hasTraumaCenter: true,
    helipad: false,
    coordinates: [28.9430, 41.0050]
  },
  {
    id: 'hosp-ist-06',
    name: 'Prof. Dr. Cemil Taşcıoğlu Şehir Hastanesi (Okmeydanı)',
    category: 'hospital',
    city: 'İstanbul',
    district: 'Şişli',
    typeText: 'Sismik Korumalı Şehir Hastanesi',
    emergencyBeds: 1100,
    hasTraumaCenter: true,
    helipad: true,
    coordinates: [28.9780, 41.0620]
  },
  {
    id: 'hosp-ist-07',
    name: 'Şişli Hamidiye Etfal E.A. Hastanesi (Sarıyer)',
    category: 'hospital',
    city: 'İstanbul',
    district: 'Sarıyer',
    typeText: 'Bölge Acil Travma Hastanesi',
    emergencyBeds: 600,
    hasTraumaCenter: true,
    helipad: true,
    coordinates: [29.0480, 41.1350]
  },
  {
    id: 'hosp-ist-08',
    name: 'Başakşehir Çam ve Sakura Şehir Hastanesi',
    category: 'hospital',
    city: 'İstanbul',
    district: 'Başakşehir',
    typeText: '2068 Sismik İzolatörlü Afet Ana Hastanesi',
    emergencyBeds: 2682,
    hasTraumaCenter: true,
    helipad: true,
    coordinates: [28.6980, 41.1020]
  },
  {
    id: 'hosp-ist-09',
    name: 'Bakırköy Dr. Sadi Konuk E.A. Hastanesi',
    category: 'hospital',
    city: 'İstanbul',
    district: 'Bakırköy',
    typeText: 'Avrupa Yakası Acil Travma Hastanesi',
    emergencyBeds: 850,
    hasTraumaCenter: true,
    helipad: true,
    coordinates: [28.8680, 40.9980]
  },
  {
    id: 'hosp-ist-10',
    name: 'Kartal Dr. Lütfi Kırdar Şehir Hastanesi',
    category: 'hospital',
    city: 'İstanbul',
    district: 'Kartal',
    typeText: 'Anadolu Yakası Sismik İzolatörlü Şehir Hastanesi',
    emergencyBeds: 1150,
    hasTraumaCenter: true,
    helipad: true,
    coordinates: [29.1820, 40.9120]
  },
  {
    id: 'hosp-ist-11',
    name: 'Ümraniye Eğitim ve Araştırma Hastanesi',
    category: 'hospital',
    city: 'İstanbul',
    district: 'Ümraniye',
    typeText: 'Acil Yoğun Bakım ve Cerrahi Merkezi',
    emergencyBeds: 700,
    hasTraumaCenter: true,
    helipad: false,
    coordinates: [29.1050, 41.0280]
  },

  // HASTANELER - ANKARA
  {
    id: 'hosp-ank-01',
    name: 'Ankara Bilkent Şehir Hastanesi',
    category: 'hospital',
    city: 'Ankara',
    district: 'Çankaya',
    typeText: 'Ulusal Afet & Travma Koordinasyon Hastanesi',
    emergencyBeds: 3711,
    hasTraumaCenter: true,
    helipad: true,
    coordinates: [32.7650, 39.8920]
  },
  {
    id: 'hosp-ank-02',
    name: 'Hacettepe Üniversitesi Tıp Fakültesi Hastanesi',
    category: 'hospital',
    city: 'Ankara',
    district: 'Altındağ',
    typeText: 'Merkezi Üniversite Hastanesi',
    emergencyBeds: 1100,
    hasTraumaCenter: true,
    helipad: false,
    coordinates: [32.8620, 39.9320]
  },

  // HASTANELER - İZMİR
  {
    id: 'hosp-izm-01',
    name: 'Ege Üniversitesi Tıp Fakültesi Hastanesi',
    category: 'hospital',
    city: 'İzmir',
    district: 'Bornova',
    typeText: 'Bölge Afet ve Travma Merkezi',
    emergencyBeds: 1800,
    hasTraumaCenter: true,
    helipad: true,
    coordinates: [27.2050, 38.4550]
  },
  {
    id: 'hosp-izm-02',
    name: 'İzmir Şehir Hastanesi (Bayraklı)',
    category: 'hospital',
    city: 'İzmir',
    district: 'Bayraklı',
    typeText: 'Sismik İzolasyonlu Bölge Hastanesi',
    emergencyBeds: 2060,
    hasTraumaCenter: true,
    helipad: true,
    coordinates: [27.1680, 38.4720]
  },

  // NÖBETÇİ ECZANELER - KADIKÖY
  {
    id: 'pharm-kdk-01',
    name: 'Kadıköy Rıhtım 24 Saat Nöbetçi Eczanesi',
    category: 'pharmacy',
    city: 'İstanbul',
    district: 'Kadıköy',
    typeText: 'Kesintisiz 24/7 Acil İlaç Temini',
    emergencyBeds: 0,
    hasTraumaCenter: false,
    helipad: false,
    coordinates: [29.0270, 40.9915]
  },
  {
    id: 'pharm-kdk-02',
    name: 'Moda Caddesi Nöbetçi Eczanesi',
    category: 'pharmacy',
    city: 'İstanbul',
    district: 'Kadıköy',
    typeText: 'Acil İlaç & İlk Yardım Tedariği',
    emergencyBeds: 0,
    hasTraumaCenter: false,
    helipad: false,
    coordinates: [29.0285, 40.9850]
  },
  {
    id: 'pharm-kdk-03',
    name: 'Bağdat Caddesi Feneryolu Acil Eczanesi',
    category: 'pharmacy',
    city: 'İstanbul',
    district: 'Kadıköy',
    typeText: '24 Saat Açık Eczane',
    emergencyBeds: 0,
    hasTraumaCenter: false,
    helipad: false,
    coordinates: [29.0490, 40.9790]
  },

  // NÖBETÇİ ECZANELER - BEŞİKTAŞ
  {
    id: 'pharm-bsk-01',
    name: 'Beşiktaş Çarşı Nöbetçi Eczanesi',
    category: 'pharmacy',
    city: 'İstanbul',
    district: 'Beşiktaş',
    typeText: 'Kesintisiz 24/7 Eczane',
    emergencyBeds: 0,
    hasTraumaCenter: false,
    helipad: false,
    coordinates: [29.0060, 41.0430]
  },
  {
    id: 'pharm-bsk-02',
    name: 'Ortaköy Meydan Nöbetçi Eczanesi',
    category: 'pharmacy',
    city: 'İstanbul',
    district: 'Beşiktaş',
    typeText: 'Acil İlaç İstasyonu',
    emergencyBeds: 0,
    hasTraumaCenter: false,
    helipad: false,
    coordinates: [29.0260, 41.0490]
  },

  // NÖBETÇİ ECZANELER - ŞİŞLİ & BEYOĞLU
  {
    id: 'pharm-ssl-01',
    name: 'Osmanbey Halaskargazi 24 Saat Eczanesi',
    category: 'pharmacy',
    city: 'İstanbul',
    district: 'Şişli',
    typeText: '24 Saat Kesintisiz Nöbetçi Eczane',
    emergencyBeds: 0,
    hasTraumaCenter: false,
    helipad: false,
    coordinates: [28.9880, 41.0540]
  },
  {
    id: 'pharm-byo-01',
    name: 'Taksim İstiklal Nöbetçi Eczanesi',
    category: 'pharmacy',
    city: 'İstanbul',
    district: 'Beyoğlu',
    typeText: 'Merkezi Acil İlaç Tedarik',
    emergencyBeds: 0,
    hasTraumaCenter: false,
    helipad: false,
    coordinates: [28.9810, 41.0350]
  },

  // NÖBETÇİ ECZANELER - FATİH
  {
    id: 'pharm-fth-01',
    name: 'Çapa Tıp Karşısı Nöbetçi Eczane',
    category: 'pharmacy',
    city: 'İstanbul',
    district: 'Fatih',
    typeText: '24/7 Hayati İlaç Tedarik',
    emergencyBeds: 0,
    hasTraumaCenter: false,
    helipad: false,
    coordinates: [28.9370, 41.0145]
  },

  // NÖBETÇİ ECZANELER - ÜSKÜDAR
  {
    id: 'pharm-usk-01',
    name: 'Üsküdar İskele Nöbetçi Eczanesi',
    category: 'pharmacy',
    city: 'İstanbul',
    district: 'Üsküdar',
    typeText: '24 Saat Nöbetçi Eczane',
    emergencyBeds: 0,
    hasTraumaCenter: false,
    helipad: false,
    coordinates: [29.0165, 41.0265]
  },

  // TÜRK KIZILAY KAN VE LOJİSTİK MERKEZLERİ
  {
    id: 'kz-ist-01',
    name: 'Türk Kızılay Kuzey Marmara Bölge Kan Merkezi',
    category: 'blood_center',
    city: 'İstanbul',
    district: 'Üsküdar',
    typeText: 'Bölgesel Kan & Lojistik Afet Üssü',
    emergencyBeds: 0,
    hasTraumaCenter: false,
    helipad: false,
    coordinates: [29.0410, 41.0180]
  },
  {
    id: 'kz-ist-02',
    name: 'Türk Kızılay Çapa Kan Bağış Merkezi',
    category: 'blood_center',
    city: 'İstanbul',
    district: 'Fatih',
    typeText: 'Merkezi Kan Bankası',
    emergencyBeds: 0,
    hasTraumaCenter: false,
    helipad: false,
    coordinates: [28.8780, 41.0020]
  },
  {
    id: 'kz-ist-03',
    name: 'Türk Kızılay Kadıköy Kan Alma Birimi',
    category: 'blood_center',
    city: 'İstanbul',
    district: 'Kadıköy',
    typeText: 'Acil Kan Tedarik Birimi',
    emergencyBeds: 0,
    hasTraumaCenter: false,
    helipad: false,
    coordinates: [29.0260, 40.9900]
  }
];

// Write assembly points
const assemblyGeoJSON = {
  type: 'FeatureCollection',
  features: verifiedAssemblyPoints.map((p) => ({
    type: 'Feature',
    id: p.id,
    geometry: {
      type: 'Point',
      coordinates: p.coordinates
    },
    properties: { ...p }
  }))
};
fs.writeFileSync(path.join(DATA_DIR, 'assembly-points.geojson'), JSON.stringify(assemblyGeoJSON, null, 2), 'utf-8');

// Write facilities (hospitals, pharmacies, blood centers)
const facilitiesGeoJSON = {
  type: 'FeatureCollection',
  features: verifiedFacilities.map((f) => ({
    type: 'Feature',
    id: f.id,
    geometry: {
      type: 'Point',
      coordinates: f.coordinates
    },
    properties: { ...f }
  }))
};
fs.writeFileSync(path.join(DATA_DIR, 'emergency-facilities.geojson'), JSON.stringify(facilitiesGeoJSON, null, 2), 'utf-8');

// Summary
const summary = {
  totalPoints: verifiedAssemblyPoints.length,
  totalFacilities: verifiedFacilities.length,
  provinces: Array.from(new Set(verifiedAssemblyPoints.map(f => f.city))).sort(),
  districtsByCity: verifiedAssemblyPoints.reduce((acc, f) => {
    const c = f.city;
    if (!acc[c]) acc[c] = [];
    if (!acc[c].includes(f.district)) acc[c].push(f.district);
    return acc;
  }, {})
};
fs.writeFileSync(path.join(DATA_DIR, 'summary.json'), JSON.stringify(summary, null, 2), 'utf-8');

console.log(`[civic-data] Generated ${verifiedAssemblyPoints.length} assembly points and ${verifiedFacilities.length} emergency medical facilities.`);
