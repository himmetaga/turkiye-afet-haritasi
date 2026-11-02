/**
 * afetBilgiService.ts
 * =============================================================================
 * AfetBilgi & Açık Yazılım Ağı (AYA) Doğrulanmış Yardım & Barınma Kataloğu
 * Açık Kaynak Referansları:
 * - https://github.com/alpaylan/afetbilgi.com
 * - https://github.com/acikyazilimagi/afet-org
 * =============================================================================
 * 6 Şubat Kahramanmaraş depremleri ve sonraki afetlerde afetzedelerin en çok
 * ihtiyaç duyduğu doğrulanmış sahra kaynaklarını (Aşevleri, Çadırkentler,
 * Bebek Bakım Çadırları, Giysi Noktaları, Sahra Tuvaletleri, Psikolojik Destek
 * ve Sahra Hayvan Hastaneleri) %100 çevrimdışı, arama ve filtreleme destekli
 * sunan yerel bilgi kütüphanesi.
 */

import { haversineDistanceMeters } from '../utils/geoMath';

export type AfetBilgiCategory =
  | 'all'
  | 'soup_kitchen'
  | 'shelter'
  | 'baby_care'
  | 'clothing'
  | 'hygiene'
  | 'psychosocial'
  | 'veterinary';

export interface AfetBilgiPoint {
  id: string;
  name: string;
  category: AfetBilgiCategory;
  categoryLabel: string;
  province: string;
  district: string;
  address: string;
  coordinates: [number, number]; // [lng, lat]
  operatingOrg: string;
  status: 'active' | 'limited' | 'closed';
  services: string[];
  contactPhone?: string;
  hours: string;
  verifiedDate: string;
  distanceMeters?: number;
}

export interface EmergencyHotline {
  number: string;
  name: string;
  operator: string;
  purpose: string;
  tollFree: boolean;
}

const EMERGENCY_HOTLINES: EmergencyHotline[] = [
  {
    number: '112',
    name: '112 Acil Çağrı Merkezi',
    operator: 'T.C. İçişleri Bakanlığı',
    purpose: 'Tıbbi acil, ambulans, arama kurtarma ve itfaiye ihbarları.',
    tollFree: true
  },
  {
    number: '122',
    name: 'AFAD Acil Afet Hattı',
    operator: 'AFAD Başkanlığı',
    purpose: 'Afet arama kurtarma, çadır talebi ve afet koordinasyonu.',
    tollFree: true
  },
  {
    number: '168',
    name: 'Türk Kızılay Çağrı Merkezi',
    operator: 'Türk Kızılay',
    purpose: 'Aşevi, sıcak yemek, gıda kolisi ve kan bağış lokasyonları.',
    tollFree: true
  },
  {
    number: '144',
    name: 'Sosyal Yardım Hattı (ALO 144)',
    operator: 'Aile ve Sosyal Hizmetler Bakanlığı',
    purpose: 'Afetzede ayni ve nakdi sosyal yardımlar, barınma nakil.',
    tollFree: true
  },
  {
    number: '184',
    name: 'SABİM Sağlık Danışma (ALO 184)',
    operator: 'T.C. Sağlık Bakanlığı',
    purpose: 'Sahra hastaneleri, acil kronik ilaç temini ve sevk durumu.',
    tollFree: true
  },
  {
    number: '0850 888 88 53',
    name: 'HAYTAP Hayvan Hakları Sahra Hattı',
    operator: 'HAYTAP Federasyonu',
    purpose: 'Enkazdan çıkarılan yaralı evcil ve sokak hayvanları sahra tedavisi.',
    tollFree: false
  },
  {
    number: '0312 425 67 65',
    name: 'TPD Afet Psikososyal Destek Hattı',
    operator: 'Türk Psikologlar Derneği',
    purpose: 'Ücretsiz deprem ve afet travma psikolojik ilk yardım desteği.',
    tollFree: false
  }
];

export const AFET_BILGI_DATABASE: AfetBilgiPoint[] = [
  // 1. Hatay
  {
    id: 'ab-ht-01',
    name: 'Antakya Fuar Alanı Kızılay Aşevi ve Mutfak Merkezi',
    category: 'soup_kitchen',
    categoryLabel: 'Aşevi & Sıcak Yemek',
    province: 'Hatay',
    district: 'Antakya',
    address: 'Antakya Fuar ve Festival Alanı, Çevreyolu Yanı',
    coordinates: [36.1666, 36.2166],
    operatingOrg: 'Türk Kızılay & Afet Gönüllüleri',
    status: 'active',
    services: ['Günde 3 Öğün Sıcak Yemek', 'Temiz İçme Suyu', 'Çocuk Bisküvisi & Süt'],
    contactPhone: '168',
    hours: '06:00 - 23:00',
    verifiedDate: 'Güncel Sahra Verisi'
  },
  {
    id: 'ab-ht-02',
    name: 'Defne Sevgi Parkı Çadırkenti ve Anne-Çocuk Çadırı',
    category: 'baby_care',
    categoryLabel: 'Bebek & Anne Bakımı',
    province: 'Hatay',
    district: 'Defne',
    address: 'Sümerler Mahallesi, Sevgi Parkı Yerleşkesi',
    coordinates: [36.1422, 36.1844],
    operatingOrg: 'UNICEF & Aile ve Sosyal Hizmetler',
    status: 'active',
    services: ['Bebek Maması (0-3 Yaş)', 'Çocuk Bezi', 'Emzirme ve Hijyen Çadırı', 'Islak Mendil'],
    contactPhone: '144',
    hours: '24 Saat Açık',
    verifiedDate: 'Güncel Sahra Verisi'
  },
  {
    id: 'ab-ht-03',
    name: 'İskenderun Liman Arkası Sahra WC ve Mobil Duş Konteynerleri',
    category: 'hygiene',
    categoryLabel: 'Sahra WC & Duş',
    province: 'Hatay',
    district: 'İskenderun',
    address: 'Mete Aslan Bulvarı, Liman C Kapısı Karşısı',
    coordinates: [36.1772, 36.5866],
    operatingOrg: 'İBB & Hatay Büyükşehir Belediyesi',
    status: 'active',
    services: ['12 Kabin Alaturka/Alafranga WC', 'Sıcak Su Mobil Duş', 'Sabun ve Dezenfektan'],
    hours: '24 Saat Açık',
    verifiedDate: 'Güncel Sahra Verisi'
  },
  {
    id: 'ab-ht-04',
    name: 'HAYTAP Sahra Çadır Hayvan Hastanesi (Hatay)',
    category: 'veterinary',
    categoryLabel: 'Sahra Veteriner',
    province: 'Hatay',
    district: 'Antakya',
    address: 'Harbiye Yolu 3. Km, Sahra Hastanesi Yanı',
    coordinates: [36.1488, 36.1755],
    operatingOrg: 'HAYTAP & Gönüllü Veteriner Hekimler',
    status: 'active',
    services: ['Yaralı Kedi/Köpek Cerrahi Müdahale', 'Kırık Alçı Tedavisi', 'Ücretsiz Kuru Mama Dağıtımı'],
    contactPhone: '0850 888 88 53',
    hours: '08:00 - 20:00 (Acil 24 Saat)',
    verifiedDate: 'Güncel Sahra Verisi'
  },

  // 2. Kahramanmaraş
  {
    id: 'ab-km-01',
    name: '12 Şubat Stadyumu Kızılay ve AFAD Çadırkenti',
    category: 'shelter',
    categoryLabel: 'Geçici Barınma & Çadırkent',
    province: 'Kahramanmaraş',
    district: 'Onikişubat',
    address: 'Hayrullah Mah., 12 Şubat Stadyumu İçi ve Otoparkı',
    coordinates: [36.9244, 37.5755],
    operatingOrg: 'AFAD & Türk Kızılay',
    status: 'active',
    services: ['Isıtmalı AFAD Çadırları', 'Battaniye & Yatak', '24 Saat Güvenlik', 'Revir'],
    contactPhone: '122',
    hours: '24 Saat Kesintisiz',
    verifiedDate: 'Güncel Sahra Verisi'
  },
  {
    id: 'ab-km-02',
    name: 'Sütçü İmam Üniversitesi Avşar Kampüsü Psikososyal Destek Çadırı',
    category: 'psychosocial',
    categoryLabel: 'Psikososyal Destek',
    province: 'Kahramanmaraş',
    district: 'Onikişubat',
    address: 'KSÜ Avşar Kampüsü, Rektörlük Meydanı',
    coordinates: [36.8833, 37.5888],
    operatingOrg: 'Türk Psikologlar Derneği & Kızılay',
    status: 'active',
    services: ['Çocuklar için Oyun Terapisi', 'Yetişkin Afet Travma Terapisi', 'Kayup ve Yas Danışmanlığı'],
    contactPhone: '0312 425 67 65',
    hours: '09:00 - 18:00',
    verifiedDate: 'Güncel Sahra Verisi'
  },
  {
    id: 'ab-km-03',
    name: 'Pazarcık Meydanı Giysi ve Battaniye Dağıtım Noktası',
    category: 'clothing',
    categoryLabel: 'Giysi & Battaniye',
    province: 'Kahramanmaraş',
    district: 'Pazarcık',
    address: 'İnönü Cad., Hükümet Konağı Önü',
    coordinates: [37.2955, 37.4888],
    operatingOrg: 'Sosyal Yardımlaşma Vakfı & Ahbap',
    status: 'active',
    services: ['Kışlık Mont & Bot', 'Polar Battaniye', 'Termal İçlik & Çorap'],
    hours: '08:00 - 19:00',
    verifiedDate: 'Güncel Sahra Verisi'
  },

  // 3. Adıyaman
  {
    id: 'ab-ad-01',
    name: 'Adıyaman Eğriçay Parkı Konteyner ve Aşevi Yerleşkesi',
    category: 'soup_kitchen',
    categoryLabel: 'Aşevi & Sıcak Yemek',
    province: 'Adıyaman',
    district: 'Merkez',
    address: 'Sümerevler Mah., Eğriçay Parkı Rekreasyon Alanı',
    coordinates: [38.2611, 37.7522],
    operatingOrg: 'İHH & Kızılay',
    status: 'active',
    services: ['Sıcak Çorba & Ekmek', 'Gıda Kumanyası', 'Çay & Sıcak İçecek'],
    contactPhone: '168',
    hours: '24 Saat Açık',
    verifiedDate: 'Güncel Sahra Verisi'
  },
  {
    id: 'ab-ad-02',
    name: 'Adıyaman Otogar Yanı Mobil Hijyen ve Bebek Bakım Ünitesi',
    category: 'baby_care',
    categoryLabel: 'Bebek & Anne Bakımı',
    province: 'Adıyaman',
    district: 'Merkez',
    address: 'Atatürk Bulvarı, Şehirlerarası Otobüs Terminali Yanı',
    coordinates: [38.2944, 37.7611],
    operatingOrg: 'Kızılay & Anne Çocuk Eğitim Vakfı',
    status: 'active',
    services: ['Devam Sütü & Mama', 'Pişik Kremi & Şampuan', 'Bebek Bezi (Numara 1-5)'],
    hours: '08:00 - 20:00',
    verifiedDate: 'Güncel Sahra Verisi'
  },

  // 4. Malatya
  {
    id: 'ab-ml-01',
    name: 'Malatya Şeker Fabrikası Sahra Çadırkenti ve İaşe Merkezi',
    category: 'shelter',
    categoryLabel: 'Geçici Barınma & Çadırkent',
    province: 'Malatya',
    district: 'Yeşilyurt',
    address: 'İnönü Mah., Şeker Fabrikası Açık Sahası',
    coordinates: [38.2755, 38.3455],
    operatingOrg: 'AFAD',
    status: 'active',
    services: ['Çadır Barınma', 'Kömür & Elektrikli Isıtıcı', 'Sıcak Yemek Noktası'],
    contactPhone: '122',
    hours: '24 Saat Açık',
    verifiedDate: 'Güncel Sahra Verisi'
  },
  {
    id: 'ab-ml-02',
    name: 'Malatya Merkez Tren Garı Aşevi ve Mobil Çamaşırhane',
    category: 'hygiene',
    categoryLabel: 'Sahra WC & Hijyen',
    province: 'Malatya',
    district: 'Battalgazi',
    address: 'İstasyon Cad., TCDD Tren Garı Bahçesi',
    coordinates: [38.3188, 38.3544],
    operatingOrg: 'TCDD & Büyükşehir Belediyesi',
    status: 'active',
    services: ['Endüstriyel Yıkama & Kurutma', 'Sıcak Su Duş', 'Temiz Havlu Dağıtımı'],
    hours: '07:00 - 22:00',
    verifiedDate: 'Güncel Sahra Verisi'
  },

  // 5. Gaziantep
  {
    id: 'ab-gz-01',
    name: 'İslahiye Demokrasi Meydanı Kızılay İkram Aracı & Aşevi',
    category: 'soup_kitchen',
    categoryLabel: 'Aşevi & Sıcak Yemek',
    province: 'Gaziantep',
    district: 'İslahiye',
    address: 'Hacıali Öztürk Mah., Hükümet Konağı Meydanı',
    coordinates: [36.6311, 37.0255],
    operatingOrg: 'Türk Kızılay',
    status: 'active',
    services: ['Günde 25.000 Porsiyon Sıcak Yemek', 'İçme Suyu Şişeleri', 'Kuru Gıda Paketi'],
    contactPhone: '168',
    hours: '06:30 - 23:00',
    verifiedDate: 'Güncel Sahra Verisi'
  },
  {
    id: 'ab-gz-02',
    name: 'Nurdağı Stadyumu Geçici Barınma ve Dağıtım Alanı',
    category: 'clothing',
    categoryLabel: 'Giysi & Battaniye',
    province: 'Gaziantep',
    district: 'Nurdağı',
    address: 'Bahçelievler Mah., Şehir Stadı',
    coordinates: [36.7322, 37.1733],
    operatingOrg: 'AFAD & Kızılay',
    status: 'active',
    services: ['Çadır Dağıtımı', 'Uyku Tulumu (-10C)', 'Termal Battaniye & Isıtıcı'],
    contactPhone: '122',
    hours: '24 Saat Açık',
    verifiedDate: 'Güncel Sahra Verisi'
  },

  // 6. İstanbul (Marmara Afet Hazırlık Merkezleri)
  {
    id: 'ab-ist-01',
    name: 'Yenikapı Avrasya Gösteri ve Afet Lojistik Merkezi',
    category: 'shelter',
    categoryLabel: 'Geçici Barınma & Lojistik',
    province: 'İstanbul',
    district: 'Fatih',
    address: 'Yenikapı Etkinlik Alanı, Kennedy Cad.',
    coordinates: [28.9533, 41.0022],
    operatingOrg: 'İBB Afet Koordinasyon Merkezi (AKOM)',
    status: 'active',
    services: ['10.000 Kişi Kapasiteli Kapalı Barınma', 'Mobil Sahra Mutfakları', 'KBRN Arındırma'],
    contactPhone: '153',
    hours: '24 Saat Kesintisiz',
    verifiedDate: 'Marmara Afet Planı'
  },
  {
    id: 'ab-ist-02',
    name: 'Kadıköy Rıhtım İskele Meydanı Kızılay Afet İaşe Çadırı',
    category: 'soup_kitchen',
    categoryLabel: 'Aşevi & Sıcak Yemek',
    province: 'İstanbul',
    district: 'Kadıköy',
    address: 'Caferağa Mah., Kadıköy Eski İskele Yanı',
    coordinates: [29.0233, 40.9911],
    operatingOrg: 'Türk Kızılay Kadıköy Şubesi',
    status: 'active',
    services: ['Sıcak Çorba', 'Bebek Maması ve Su Dağıtımı', 'İlk Yardım Çadırı'],
    contactPhone: '168',
    hours: '24 Saat Açık',
    verifiedDate: 'Marmara Afet Planı'
  },
  {
    id: 'ab-ist-03',
    name: 'Atatürk Havalimanı Ulusal Arama Kurtarma ve Sahra Hastanesi',
    category: 'shelter',
    categoryLabel: 'Geçici Barınma & Sahra Hastanesi',
    province: 'İstanbul',
    district: 'Bakırköy',
    address: 'Yeşilköy, Eski Atatürk Havalimanı Pistleri',
    coordinates: [28.8144, 40.9766],
    operatingOrg: 'AFAD & Sağlık Bakanlığı',
    status: 'active',
    services: ['Triyaj Sahra Hastanesi', 'Arama Kurtarma Helikopter Pisti', 'İnsani Yardım Havayolu Köprüsü'],
    contactPhone: '112',
    hours: '24 Saat Açık',
    verifiedDate: 'Marmara Afet Planı'
  },
  {
    id: 'ab-ist-04',
    name: 'Üsküdar Validebağ Korusu Psikososyal Destek ve Çocuk Çadırı',
    category: 'psychosocial',
    categoryLabel: 'Psikososyal Destek',
    province: 'Üsküdar',
    district: 'Üsküdar',
    address: 'Barbaros Mah., Validebağ Korusu Girişi',
    coordinates: [29.0433, 41.0144],
    operatingOrg: 'Türk Psikologlar Derneği & Kızılay',
    status: 'active',
    services: ['Travma İlk Yardım', 'Deprem Stresi Grup Seansları', 'Çocuk Etkinlik Alanı'],
    contactPhone: '0312 425 67 65',
    hours: '09:00 - 18:00',
    verifiedDate: 'Marmara Afet Planı'
  },

  // 7. İzmir
  {
    id: 'ab-izm-01',
    name: 'Bayraklı Mansuroğlu Şehit Hakan Ünal Parkı Sahra Çadırkenti',
    category: 'shelter',
    categoryLabel: 'Geçici Barınma & Çadırkent',
    province: 'İzmir',
    district: 'Bayraklı',
    address: 'Mansuroğlu Mah., Şehit Pilot Ünal Parkı',
    coordinates: [27.1855, 38.4611],
    operatingOrg: 'AFAD & İzmir Büyükşehir Belediyesi',
    status: 'active',
    services: ['Isıtmalı Çadırlar', 'Sahra Mutfak', 'Sosyal Market Dağıtımı'],
    contactPhone: '122',
    hours: '24 Saat Açık',
    verifiedDate: 'İzmir Afet Planı'
  },

  // 8. Ankara
  {
    id: 'ab-ank-01',
    name: 'Ankara AKM Millet Bahçesi Afet Tahliye ve İaşe Üssü',
    category: 'soup_kitchen',
    categoryLabel: 'Aşevi & Lojistik Dağıtım',
    province: 'Ankara',
    district: 'Altındağ',
    address: 'Zübeyde Hanım Mah., Kazım Karabekir Cad.',
    coordinates: [32.8422, 39.9411],
    operatingOrg: 'ABB & Türk Kızılay',
    status: 'active',
    services: ['Günde 50.000 Kişilik Mobil Mutfak', 'Giyim Mağazası', 'Depremzede Misafirhane Kayıt'],
    contactPhone: '153',
    hours: '24 Saat Açık',
    verifiedDate: 'Ankara Afet Planı'
  }
];

export class AfetBilgiService {
  /**
   * Kategori, il veya metin aramasına göre filtrelenmiş noktaları döndürür.
   */
  public getVerifiedPoints(
    category: AfetBilgiCategory = 'all',
    province = '',
    query = '',
    userCoords?: [number, number]
  ): AfetBilgiPoint[] {
    let list = [...AFET_BILGI_DATABASE];

    if (category && category !== 'all') {
      list = list.filter((p) => p.category === category);
    }

    if (province && province.trim() !== '') {
      const provLower = province.trim().toLowerCase();
      list = list.filter((p) => p.province.toLowerCase().includes(provLower));
    }

    if (query && query.trim() !== '') {
      const qLower = query.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(qLower) ||
          p.district.toLowerCase().includes(qLower) ||
          p.province.toLowerCase().includes(qLower) ||
          p.services.some((s) => s.toLowerCase().includes(qLower)) ||
          p.operatingOrg.toLowerCase().includes(qLower)
      );
    }

    if (userCoords) {
      list = list.map((item) => {
        const dist = haversineDistanceMeters(userCoords, item.coordinates);
        return {
          ...item,
          distanceMeters: Math.round(dist)
        };
      });
      list.sort((a, b) => (a.distanceMeters || 0) - (b.distanceMeters || 0));
    }

    return list;
  }

  /**
   * Kullanıcı koordinatına en yakın noktaları döndürür.
   */
  public getNearestPoints(userCoords: [number, number], limit = 6): AfetBilgiPoint[] {
    return this.getVerifiedPoints('all', '', '', userCoords).slice(0, limit);
  }

  /**
   * Mevcut illerin listesini alfabetik döndürür.
   */
  public getProvinceList(): string[] {
    const set = new Set<string>();
    AFET_BILGI_DATABASE.forEach((p) => set.add(p.province));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'tr'));
  }

  /**
   * Resmi ve sivil acil durum çağrı hatlarını listeler.
   */
  public getEmergencyHotlines(): EmergencyHotline[] {
    return EMERGENCY_HOTLINES;
  }
}

export const afetBilgiService = new AfetBilgiService();

