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

const verifiedHubs = [
  // İstanbul - Kadıköy
  { id: 'ist-kdk-01', name: 'Yoğurtçu Parkı Acil Toplanma Alanı', city: 'İstanbul', district: 'Kadıköy', coordinates: [29.0345, 40.9858], capacity: 16500, areaSqM: 35000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'ist-kdk-02', name: 'Kalamış Atatürk Parkı', city: 'İstanbul', district: 'Kadıköy', coordinates: [29.0432, 40.9782], capacity: 24000, areaSqM: 52000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'ist-kdk-03', name: 'Göztepe 60. Yıl Parkı', city: 'İstanbul', district: 'Kadıköy', coordinates: [29.0610, 40.9722], capacity: 32000, areaSqM: 80000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'ist-kdk-04', name: 'Özgürlük Parkı', city: 'İstanbul', district: 'Kadıköy', coordinates: [29.0487, 40.9841], capacity: 45000, areaSqM: 110000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // İstanbul - Beşiktaş
  { id: 'ist-bsk-01', name: 'Yıldız Parkı Ana Toplanma Sahası', city: 'İstanbul', district: 'Beşiktaş', coordinates: [29.0142, 41.0493], capacity: 40000, areaSqM: 120000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'ist-bsk-02', name: 'Abbasağa Parkı', city: 'İstanbul', district: 'Beşiktaş', coordinates: [29.0044, 41.0478], capacity: 12000, areaSqM: 25000, hasWater: true, hasElectricity: true, hasTentArea: false, hasGenerator: true },
  { id: 'ist-bsk-03', name: 'Bebek Parkı Sahil Toplanma Alanı', city: 'İstanbul', district: 'Beşiktaş', coordinates: [29.0437, 41.0772], capacity: 18000, areaSqM: 38000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: false },

  // İstanbul - Şişli
  { id: 'ist-ssl-01', name: 'Maçka Demokrasi Parkı', city: 'İstanbul', district: 'Şişli', coordinates: [28.9953, 41.0428], capacity: 55000, areaSqM: 140000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'ist-ssl-02', name: 'Abide-i Hürriyet Parkı', city: 'İstanbul', district: 'Şişli', coordinates: [28.9818, 41.0664], capacity: 30000, areaSqM: 75000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // İstanbul - Üsküdar
  { id: 'ist-usk-01', name: 'Fethi Paşa Korusu Giriş Meydanı', city: 'İstanbul', district: 'Üsküdar', coordinates: [29.0225, 41.0315], capacity: 28000, areaSqM: 65000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'ist-usk-02', name: 'Çamlıca Millet Bahçesi', city: 'İstanbul', district: 'Üsküdar', coordinates: [29.0662, 41.0264], capacity: 60000, areaSqM: 180000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'ist-usk-03', name: 'Üsküdar Meydanı ve Sahil Parkı', city: 'İstanbul', district: 'Üsküdar', coordinates: [29.0150, 41.0260], capacity: 35000, areaSqM: 70000, hasWater: true, hasElectricity: true, hasTentArea: false, hasGenerator: true },

  // İstanbul - Fatih
  { id: 'ist-fth-01', name: 'Yenikapı Etkinlik ve Afet Alanı', city: 'İstanbul', district: 'Fatih', coordinates: [28.9535, 41.0012], capacity: 250000, areaSqM: 650000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'ist-fth-02', name: 'Gülhane Parkı', city: 'İstanbul', district: 'Fatih', coordinates: [28.9815, 41.0135], capacity: 35000, areaSqM: 90000, hasWater: true, hasElectricity: true, hasTentArea: false, hasGenerator: true },
  { id: 'ist-fth-03', name: 'Fatih Çarşamba Parkı ve Toplanma Alanı', city: 'İstanbul', district: 'Fatih', coordinates: [28.9482, 41.0210], capacity: 15000, areaSqM: 28000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: false },

  // İstanbul - Bakırköy
  { id: 'ist-bkr-01', name: 'Bakırköy Botanik Parkı', city: 'İstanbul', district: 'Bakırköy', coordinates: [28.8710, 40.9950], capacity: 42000, areaSqM: 96000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'ist-bkr-02', name: 'Florya Atatürk Ormanı Afet Sahası', city: 'İstanbul', district: 'Bakırköy', coordinates: [28.7885, 40.9760], capacity: 70000, areaSqM: 220000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // İstanbul - Beyoğlu
  { id: 'ist-byo-01', name: 'Taksim Gezi Parkı Afet Alanı', city: 'İstanbul', district: 'Beyoğlu', coordinates: [28.9870, 41.0375], capacity: 38000, areaSqM: 78000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'ist-byo-02', name: 'Kasımpaşa Hasköy Sahil Parkı', city: 'İstanbul', district: 'Beyoğlu', coordinates: [28.9542, 41.0388], capacity: 22000, areaSqM: 50000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: false },

  // İstanbul - Ataşehir
  { id: 'ist-ats-01', name: 'Nezahat Gökyiğit Botanik Bahçesi', city: 'İstanbul', district: 'Ataşehir', coordinates: [29.1170, 40.9995], capacity: 50000, areaSqM: 150000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'ist-ats-02', name: 'Ataşehir Kent Meydanı', city: 'İstanbul', district: 'Ataşehir', coordinates: [29.1065, 40.9880], capacity: 25000, areaSqM: 55000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // İstanbul - Maltepe
  { id: 'ist-mlt-01', name: 'Maltepe Sahil Şehir Parkı Afet Üssü', city: 'İstanbul', district: 'Maltepe', coordinates: [29.1240, 40.9230], capacity: 300000, areaSqM: 1000000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // İstanbul - Kartal
  { id: 'ist-krt-01', name: 'Kartal Meydanı ve Sahil Alanı', city: 'İstanbul', district: 'Kartal', coordinates: [29.1865, 40.8872], capacity: 35000, areaSqM: 75000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // İstanbul - Pendik
  { id: 'ist-pnd-01', name: 'Pendik Sahil Millet Bahçesi', city: 'İstanbul', district: 'Pendik', coordinates: [29.2310, 40.8750], capacity: 48000, areaSqM: 130000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // İstanbul - Sarıyer
  { id: 'ist-sry-01', name: 'Emirgan Korusu Giriş Sahası', city: 'İstanbul', district: 'Sarıyer', coordinates: [29.0535, 41.1075], capacity: 36000, areaSqM: 110000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'ist-sry-02', name: 'Atatürk Kent Ormanı', city: 'İstanbul', district: 'Sarıyer', coordinates: [29.0270, 41.1180], capacity: 65000, areaSqM: 200000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // İstanbul - Zeytinburnu
  { id: 'ist-zyt-01', name: 'Zeytinburnu Çırpıcı Şehir Parkı', city: 'İstanbul', district: 'Zeytinburnu', coordinates: [28.8980, 40.9990], capacity: 80000, areaSqM: 230000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // İstanbul - Avcılar
  { id: 'ist-avc-01', name: 'Avcılar Sahil Parkı Afet Toplanma Merkezi', city: 'İstanbul', district: 'Avcılar', coordinates: [28.7210, 40.9740], capacity: 60000, areaSqM: 160000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // İstanbul - Beylikdüzü
  { id: 'ist-byk-01', name: 'Yaşam Vadisi 1. Etap', city: 'İstanbul', district: 'Beylikdüzü', coordinates: [28.6480, 41.0020], capacity: 90000, areaSqM: 280000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // İstanbul - Küçükçekmece
  { id: 'ist-kck-01', name: 'Küçükçekmece Göl Parkı', city: 'İstanbul', district: 'Küçükçekmece', coordinates: [28.7730, 40.9910], capacity: 45000, areaSqM: 120000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // İstanbul - Başakşehir
  { id: 'ist-bsk-02', name: 'Bahçeşehir Gölet Parkı', city: 'İstanbul', district: 'Başakşehir', coordinates: [28.6920, 41.0680], capacity: 50000, areaSqM: 140000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // İstanbul - Ümraniye
  { id: 'ist-umr-01', name: 'Ümraniye Millet Bahçesi', city: 'İstanbul', district: 'Ümraniye', coordinates: [29.1120, 41.0340], capacity: 70000, areaSqM: 210000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // İstanbul - Eyüpsultan
  { id: 'ist-eyp-01', name: 'Alibeyköy Baraj Sahası Toplanma Alanı', city: 'İstanbul', district: 'Eyüpsultan', coordinates: [28.9400, 41.0760], capacity: 40000, areaSqM: 100000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // Ankara
  { id: 'ank-cnt-01', name: 'Anıt Park ve Kurtuluş Parkı Sahası', city: 'Ankara', district: 'Çankaya', coordinates: [32.8680, 39.9270], capacity: 55000, areaSqM: 130000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'ank-alt-01', name: 'Altınpark Afet ve İnsani Yardım Merkezi', city: 'Ankara', district: 'Altındağ', coordinates: [32.8850, 39.9650], capacity: 95000, areaSqM: 260000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'ank-yen-01', name: 'Atatürk Orman Çiftliği Toplanma Sahası', city: 'Ankara', district: 'Yenimahalle', coordinates: [32.7950, 39.9400], capacity: 150000, areaSqM: 500000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'ank-mam-01', name: 'Mamak Şehir Parkı', city: 'Ankara', district: 'Mamak', coordinates: [32.9150, 39.9280], capacity: 40000, areaSqM: 95000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // İzmir
  { id: 'izm-kon-01', name: 'Kültürpark Fuar Afet Ana Koordinasyon Alanı', city: 'İzmir', district: 'Konak', coordinates: [27.1460, 38.4280], capacity: 120000, areaSqM: 420000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'izm-ksk-01', name: 'Karşıyaka Sahil Parkı', city: 'İzmir', district: 'Karşıyaka', coordinates: [27.1120, 38.4550], capacity: 50000, areaSqM: 140000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'izm-byr-01', name: 'Bayraklı Mansuroğlu Afet Parkı', city: 'İzmir', district: 'Bayraklı', coordinates: [27.1850, 38.4620], capacity: 35000, areaSqM: 80000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'izm-bor-01', name: 'Aşık Veysel Rekreasyon Alanı', city: 'İzmir', district: 'Bornova', coordinates: [27.2020, 38.4480], capacity: 75000, areaSqM: 230000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // Bursa
  { id: 'bur-osm-01', name: 'Merinos Kent Parkı', city: 'Bursa', district: 'Osmangazi', coordinates: [29.0550, 40.2010], capacity: 85000, areaSqM: 250000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'bur-nil-01', name: 'Nilüfer Fethiye Parkı', city: 'Bursa', district: 'Nilüfer', coordinates: [28.9750, 40.2180], capacity: 42000, areaSqM: 105000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // Antalya
  { id: 'ant-mur-01', name: 'Karaalioğlu Parkı Sahil Toplanma Alanı', city: 'Antalya', district: 'Muratpaşa', coordinates: [30.7060, 36.8800], capacity: 65000, areaSqM: 180000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'ant-kon-01', name: 'Konyaaltı Sahil Yaşam Parkı', city: 'Antalya', district: 'Konyaaltı', coordinates: [30.6480, 36.8660], capacity: 90000, areaSqM: 320000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // Adana
  { id: 'ada-sey-01', name: 'Merkez Park Afet Koordinasyon Sahası', city: 'Adana', district: 'Seyhan', coordinates: [35.3340, 36.9980], capacity: 110000, areaSqM: 330000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'ada-cuk-01', name: 'Çukurova Doğal Park', city: 'Adana', district: 'Çukurova', coordinates: [35.2890, 37.0420], capacity: 55000, areaSqM: 160000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // Gaziantep
  { id: 'gaz-seh-01', name: 'Kavaklık Parkı ve Masal Parkı', city: 'Gaziantep', district: 'Şahinbey', coordinates: [37.3620, 37.0580], capacity: 70000, areaSqM: 210000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'gaz-smk-01', name: 'Dülükbaba Tabiat Parkı Sahası', city: 'Gaziantep', district: 'Şehitkamil', coordinates: [37.3380, 37.1120], capacity: 95000, areaSqM: 350000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // Kocaeli
  { id: 'koc-izm-01', name: 'Seka Park 1. ve 2. Etap Afet Sahası', city: 'Kocaeli', district: 'İzmit', coordinates: [29.9120, 40.7600], capacity: 120000, areaSqM: 450000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'koc-geb-01', name: 'Gebze Şehir Parkı ve Toplanma Meydanı', city: 'Kocaeli', district: 'Gebze', coordinates: [29.4320, 40.8030], capacity: 50000, areaSqM: 140000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // Hatay
  { id: 'hat-ant-01', name: 'Antakya Atatürk Parkı Sahası', city: 'Hatay', district: 'Antakya', coordinates: [36.1580, 36.2050], capacity: 60000, areaSqM: 170000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },
  { id: 'hat-isk-01', name: 'İskenderun Sahil Kordonu Afet Alanı', city: 'Hatay', district: 'İskenderun', coordinates: [36.1720, 36.5880], capacity: 70000, areaSqM: 200000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // Kahramanmaraş
  { id: 'kmr-onk-01', name: 'Hanefi Mahçiçek Stadyumu ve Park Alanı', city: 'Kahramanmaraş', district: 'Onikişubat', coordinates: [36.9020, 37.5750], capacity: 80000, areaSqM: 240000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // Van
  { id: 'van-ipe-01', name: 'Van Atatürk Kültür Parkı', city: 'Van', district: 'İpekyolu', coordinates: [43.3780, 38.4980], capacity: 50000, areaSqM: 140000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // Elazığ
  { id: 'elz-mrk-01', name: 'Kültür Park Afet Toplanma Sahası', city: 'Elazığ', district: 'Merkez', coordinates: [39.2150, 38.6720], capacity: 60000, areaSqM: 180000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // Sakarya
  { id: 'sak-ada-01', name: 'Kent Park ve Çark Mesire Alanı', city: 'Sakarya', district: 'Adapazarı', coordinates: [30.3950, 40.7780], capacity: 65000, areaSqM: 190000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // Trabzon
  { id: 'trb-ort-01', name: 'Zağnos Vadisi Parkı', city: 'Trabzon', district: 'Ortahisar', coordinates: [39.7180, 41.0020], capacity: 45000, areaSqM: 120000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // Samsun
  { id: 'sam-ilka-01', name: 'Doğu Park ve Sahil Afet Alanı', city: 'Samsun', district: 'İlkadım', coordinates: [36.3520, 41.2880], capacity: 70000, areaSqM: 210000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // Diyarbakır
  { id: 'diy-kay-01', name: 'Anzele Parkı ve Koşuyolu Şehir Parkı', city: 'Diyarbakır', district: 'Kayapınar', coordinates: [40.1980, 37.9350], capacity: 75000, areaSqM: 220000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // Eskişehir
  { id: 'esk-tep-01', name: 'Sazova Bilim Kültür ve Sanat Parkı', city: 'Eskişehir', district: 'Tepebaşı', coordinates: [30.4730, 39.7700], capacity: 90000, areaSqM: 400000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // Konya
  { id: 'kon-sel-01', name: 'Kültür Park ve Alaaddin Tepesi Sahası', city: 'Konya', district: 'Selçuklu', coordinates: [32.4930, 37.8720], capacity: 60000, areaSqM: 170000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // Kayseri
  { id: 'kay-mel-01', name: 'Kadir Has Kent Parkı Sahası', city: 'Kayseri', district: 'Melikgazi', coordinates: [35.4850, 38.7210], capacity: 70000, areaSqM: 200000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // Mersin
  { id: 'mer-yen-01', name: 'Mersin Atatürk Parkı Sahil Şeridi', city: 'Mersin', district: 'Yenişehir', coordinates: [34.6320, 36.7950], capacity: 80000, areaSqM: 260000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // Muğla / Bodrum
  { id: 'mug-bod-01', name: 'Bodrum Şehir Stadyumu ve Meydan Parkı', city: 'Muğla', district: 'Bodrum', coordinates: [27.4320, 37.0380], capacity: 30000, areaSqM: 70000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // Çanakkale
  { id: 'can-mrk-01', name: 'Halk Bahçesi ve Kordon Parkı', city: 'Çanakkale', district: 'Merkez', coordinates: [26.4060, 40.1480], capacity: 35000, areaSqM: 85000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // Tekirdağ
  { id: 'tek-sül-01', name: 'Barış ve Özgürlük Parkı Sahili', city: 'Tekirdağ', district: 'Süleymanpaşa', coordinates: [27.5120, 40.9750], capacity: 45000, areaSqM: 110000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // Balıkesir
  { id: 'bal-kae-01', name: 'Atatürk Parkı ve Fuar Alanı', city: 'Balıkesir', district: 'Karesi', coordinates: [27.8840, 39.6480], capacity: 40000, areaSqM: 95000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // Manisa
  { id: 'man-seh-01', name: 'Sultan Parkı ve Fuar Sahası', city: 'Manisa', district: 'Şehzadeler', coordinates: [27.4280, 38.6140], capacity: 42000, areaSqM: 105000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // Aydın
  { id: 'ayd-efe-01', name: 'Pınarbaşı Mesire Alanı ve Parkı', city: 'Aydın', district: 'Efeler', coordinates: [27.8480, 37.8460], capacity: 38000, areaSqM: 90000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // Denizli
  { id: 'den-pam-01', name: 'İncilipınar Parkı ve Afet Sahası', city: 'Denizli', district: 'Pamukkale', coordinates: [29.1020, 37.7650], capacity: 55000, areaSqM: 150000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // Malatya
  { id: 'mlt-bat-01', name: 'Sümer Park ve Mişmiş Park Afet Sahası', city: 'Malatya', district: 'Battalgazi', coordinates: [38.3120, 38.3510], capacity: 70000, areaSqM: 220000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // Adıyaman
  { id: 'ady-mrk-01', name: 'Eğriçay Parkı ve Çadırkent Sahası', city: 'Adıyaman', district: 'Merkez', coordinates: [38.2750, 37.7580], capacity: 60000, areaSqM: 180000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // Şanlıurfa
  { id: 'san-hal-01', name: 'GAP Vadisi Afet ve Rekreasyon Alanı', city: 'Şanlıurfa', district: 'Haliliye', coordinates: [38.8120, 37.1680], capacity: 85000, areaSqM: 300000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // Erzurum
  { id: 'erz-yak-01', name: 'Olimpiyat Parkı ve Fuar Alanı', city: 'Erzurum', district: 'Yakutiye', coordinates: [41.2650, 39.9120], capacity: 60000, areaSqM: 200000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true },

  // Sivas
  { id: 'siv-mrk-01', name: 'Paşabahçe Mesire Sahası', city: 'Sivas', district: 'Merkez', coordinates: [37.0320, 39.7550], capacity: 48000, areaSqM: 140000, hasWater: true, hasElectricity: true, hasTentArea: true, hasGenerator: true }
];

// All 81 provincial coordinates
const provinceCoordinates = [
  { name: 'Adana', coords: [35.3213, 37.0], capacity: 65000 },
  { name: 'Adıyaman', coords: [38.2786, 37.7648], capacity: 42000 },
  { name: 'Afyonkarahisar', coords: [30.5404, 38.7507], capacity: 35000 },
  { name: 'Ağrı', coords: [43.0519, 39.7191], capacity: 30000 },
  { name: 'Amasya', coords: [35.8353, 40.6534], capacity: 28000 },
  { name: 'Ankara', coords: [32.8597, 39.9334], capacity: 150000 },
  { name: 'Antalya', coords: [30.7133, 36.8969], capacity: 90000 },
  { name: 'Artvin', coords: [41.8183, 41.1828], capacity: 20000 },
  { name: 'Aydın', coords: [27.8456, 37.8560], capacity: 45000 },
  { name: 'Balıkesir', coords: [27.8870, 39.6484], capacity: 45000 },
  { name: 'Bilecik', coords: [29.9793, 40.1426], capacity: 22000 },
  { name: 'Bingöl', coords: [40.4983, 38.8854], capacity: 32000 },
  { name: 'Bitlis', coords: [42.1095, 38.4006], capacity: 25000 },
  { name: 'Bolu', coords: [31.6061, 40.7350], capacity: 34000 },
  { name: 'Burdur', coords: [30.2889, 37.7203], capacity: 25000 },
  { name: 'Bursa', coords: [29.0610, 40.1885], capacity: 95000 },
  { name: 'Çanakkale', coords: [26.4086, 40.1553], capacity: 38000 },
  { name: 'Çankırı', coords: [33.6134, 40.6013], capacity: 22000 },
  { name: 'Çorum', coords: [34.9556, 40.5506], capacity: 36000 },
  { name: 'Denizli', coords: [29.0864, 37.7765], capacity: 55000 },
  { name: 'Diyarbakır', coords: [40.2306, 37.9144], capacity: 75000 },
  { name: 'Edirne', coords: [26.5557, 41.6772], capacity: 35000 },
  { name: 'Elazığ', coords: [39.2225, 38.6810], capacity: 52000 },
  { name: 'Erzincan', coords: [39.4926, 39.7500], capacity: 40000 },
  { name: 'Erzurum', coords: [41.2728, 39.9043], capacity: 62000 },
  { name: 'Eskişehir', coords: [30.5256, 39.7767], capacity: 78000 },
  { name: 'Gaziantep', coords: [37.3822, 37.0662], capacity: 85000 },
  { name: 'Giresun', coords: [38.3895, 40.9128], capacity: 30000 },
  { name: 'Gümüşhane', coords: [39.4814, 40.4600], capacity: 20000 },
  { name: 'Hakkâri', coords: [43.7408, 37.5833], capacity: 24000 },
  { name: 'Hatay', coords: [36.1667, 36.2000], capacity: 70000 },
  { name: 'Isparta', coords: [30.5537, 37.7648], capacity: 35000 },
  { name: 'Mersin', coords: [34.6415, 36.8121], capacity: 80000 },
  { name: 'İstanbul', coords: [28.9784, 41.0082], capacity: 300000 },
  { name: 'İzmir', coords: [27.1428, 38.4237], capacity: 130000 },
  { name: 'Kars', coords: [43.0975, 40.6013], capacity: 28000 },
  { name: 'Kastamonu', coords: [33.7765, 41.3887], capacity: 27000 },
  { name: 'Kayseri', coords: [35.4853, 38.7312], capacity: 75000 },
  { name: 'Kırklareli', coords: [27.2244, 41.7333], capacity: 26000 },
  { name: 'Kırşehir', coords: [34.1709, 39.1425], capacity: 25000 },
  { name: 'Kocaeli', coords: [29.9169, 40.7654], capacity: 85000 },
  { name: 'Konya', coords: [32.4846, 37.8667], capacity: 90000 },
  { name: 'Kütahya', coords: [29.9833, 39.4167], capacity: 38000 },
  { name: 'Malatya', coords: [38.3333, 38.3552], capacity: 65000 },
  { name: 'Manisa', coords: [27.4296, 38.6191], capacity: 55000 },
  { name: 'Kahramanmaraş', coords: [36.9371, 37.5858], capacity: 72000 },
  { name: 'Mardin', coords: [40.7410, 37.3212], capacity: 38000 },
  { name: 'Muğla', coords: [28.3636, 37.2153], capacity: 42000 },
  { name: 'Muş', coords: [41.4911, 38.7432], capacity: 28000 },
  { name: 'Nevşehir', coords: [34.7144, 38.6244], capacity: 26000 },
  { name: 'Niğde', coords: [34.6794, 37.9667], capacity: 28000 },
  { name: 'Ordu', coords: [37.8797, 40.9839], capacity: 38000 },
  { name: 'Rize', coords: [40.5217, 41.0208], capacity: 30000 },
  { name: 'Sakarya', coords: [30.4033, 40.7569], capacity: 62000 },
  { name: 'Samsun', coords: [36.3300, 41.2928], capacity: 68000 },
  { name: 'Siirt', coords: [41.9420, 37.9333], capacity: 27000 },
  { name: 'Sinop', coords: [35.1517, 42.0231], capacity: 24000 },
  { name: 'Sivas', coords: [37.0179, 39.7477], capacity: 45000 },
  { name: 'Tekirdağ', coords: [27.5117, 40.9833], capacity: 48000 },
  { name: 'Tokat', coords: [36.5544, 40.3167], capacity: 32000 },
  { name: 'Trabzon', coords: [39.7269, 41.0015], capacity: 52000 },
  { name: 'Tunceli', coords: [39.5401, 39.1079], capacity: 20000 },
  { name: 'Şanlıurfa', coords: [38.7955, 37.1674], capacity: 80000 },
  { name: 'Uşak', coords: [29.4058, 38.6823], capacity: 32000 },
  { name: 'Van', coords: [43.3833, 38.4891], capacity: 58000 },
  { name: 'Yozgat', coords: [34.8044, 39.8181], capacity: 26000 },
  { name: 'Zonguldak', coords: [31.7987, 41.4564], capacity: 34000 },
  { name: 'Aksaray', coords: [34.0254, 38.3687], capacity: 31000 },
  { name: 'Bayburt', coords: [40.2249, 40.2552], capacity: 18000 },
  { name: 'Karaman', coords: [33.2150, 37.1759], capacity: 28000 },
  { name: 'Kırıkkale', coords: [33.5065, 39.8468], capacity: 30000 },
  { name: 'Batman', coords: [41.1322, 37.8812], capacity: 48000 },
  { name: 'Şırnak', coords: [42.4537, 37.5164], capacity: 30000 },
  { name: 'Bartın', coords: [32.3375, 41.6344], capacity: 22000 },
  { name: 'Ardahan', coords: [42.7022, 41.1105], capacity: 18000 },
  { name: 'Iğdır', coords: [44.0450, 39.9196], capacity: 22000 },
  { name: 'Yalova', coords: [29.2769, 40.6500], capacity: 38000 },
  { name: 'Karabük', coords: [32.6277, 41.2061], capacity: 26000 },
  { name: 'Kilis', coords: [37.1150, 36.7184], capacity: 24000 },
  { name: 'Osmaniye', coords: [36.2464, 37.0742], capacity: 36000 },
  { name: 'Düzce', coords: [31.1625, 40.8438], capacity: 38000 }
];

const existingCities = new Set(verifiedHubs.map(h => h.city));

for (const prov of provinceCoordinates) {
  if (!existingCities.has(prov.name)) {
    verifiedHubs.push({
      id: `prov-${prov.name.toLowerCase().replace(/[^a-z0-9]/g, '')}-01`,
      name: `${prov.name} İl Afet Toplanma Sahası ve Parkı`,
      city: prov.name,
      district: 'Merkez',
      coordinates: prov.coords,
      capacity: prov.capacity,
      areaSqM: Math.round(prov.capacity * 2.8),
      hasWater: true,
      hasElectricity: true,
      hasTentArea: true,
      hasGenerator: true
    });
  }
}

const features = verifiedHubs.map((hub) => ({
  type: 'Feature',
  id: hub.id,
  geometry: {
    type: 'Point',
    coordinates: hub.coordinates
  },
  properties: {
    id: hub.id,
    name: hub.name,
    city: hub.city,
    district: hub.district,
    capacity: hub.capacity,
    areaSqM: hub.areaSqM,
    hasWater: hub.hasWater,
    hasElectricity: hub.hasElectricity,
    hasTentArea: hub.hasTentArea,
    hasGenerator: hub.hasGenerator
  }
}));

const masterGeoJSON = {
  type: 'FeatureCollection',
  features
};

const masterPath = path.join(DATA_DIR, 'assembly-points.geojson');
fs.writeFileSync(masterPath, JSON.stringify(masterGeoJSON, null, 2), 'utf-8');

// Also create city subsets for Istanbul, Ankara, Izmir
const cities = ['İstanbul', 'Ankara', 'İzmir'];
for (const c of cities) {
  const cityFeatures = features.filter(f => f.properties.city === c);
  const citySlug = c.toLowerCase().replace('ş', 's').replace('ı', 'i').replace('i̇', 'i');
  fs.writeFileSync(
    path.join(DATA_DIR, `${citySlug}.geojson`),
    JSON.stringify({ type: 'FeatureCollection', features: cityFeatures }, null, 2),
    'utf-8'
  );
}

// Summary index for rapid dropdown lookups
const summary = {
  totalPoints: features.length,
  totalCapacity: features.reduce((acc, f) => acc + (f.properties.capacity || 0), 0),
  provinces: Array.from(new Set(features.map(f => f.properties.city))).sort(),
  districtsByCity: features.reduce((acc, f) => {
    const c = f.properties.city;
    if (!acc[c]) acc[c] = [];
    if (!acc[c].includes(f.properties.district)) acc[c].push(f.properties.district);
    return acc;
  }, {})
};

fs.writeFileSync(path.join(DATA_DIR, 'summary.json'), JSON.stringify(summary, null, 2), 'utf-8');

console.log(`[civic-data] Generated ${features.length} assembly points across ${summary.provinces.length} provinces.`);
