/**
/**
 * Disaster Volunteer Dispatch & Field Accreditation Service
 * (Afet Gönüllü Sevk, Görev Dağılımı ve Sahra Kimlik Kartı Motoru)
 *
 * Standartlar:
 * 1. AFAD Gönüllülük Sistemi (Temel, Destek ve Uzman Seviye)
 * 2. INSARAG Uluslararası Arama Kurtarma Saha Koordinasyon Standartları
 * 3. Kriz Masası Çevrimdışı Güvenlik Kontrolü ve Yetenek Eşleştirme
 */

export type VolunteerSkillRole =
  | 'SEARCH_RESCUE'
  | 'MEDICAL_TRIAGE'
  | 'HEAVY_OPERATOR'
  | 'RADIO_TELECOM'
  | 'LOGISTICS_FOOD'
  | 'TRANSLATOR'
  | 'ANIMAL_RESCUE'
  | 'GENERAL_SUPPORT';

export interface SkillRoleDefinition {
  id: VolunteerSkillRole;
  title: string;
  badgeColor: string;
  icon: string;
  description: string;
  requiredGear: string[];
}

export const VOLUNTEER_ROLES: Record<VolunteerSkillRole, SkillRoleDefinition> = {
  SEARCH_RESCUE: {
    id: 'SEARCH_RESCUE',
    title: 'Arama & Kurtarma (Enkaz)',
    badgeColor: '#EF4444',
    icon: '🏗️',
    description: 'Enkaz dinleme, akustik arama, beton kesme-ayırma ve tahkimat uzmanı.',
    requiredGear: ['Baret (EN 397)', 'FFP3 Toz Maskesi', 'Çelik Burunlu Bot', 'Kafa Feneri', 'Darbe Eldiveni']
  },
  MEDICAL_TRIAGE: {
    id: 'MEDICAL_TRIAGE',
    title: 'Acil Sağlık & Triyaj',
    badgeColor: '#10B981',
    icon: '🩺',
    description: 'Doktor, Paramedik, Acil Tıp Teknisyeni veya Hemşire. Sahra ilk yardım ve crush sendromu müdahalesi.',
    requiredGear: ['Turnike', 'Travma Makası', 'Steril Gazlı Bez', 'Stetoskop', 'Muayene Eldiveni']
  },
  HEAVY_OPERATOR: {
    id: 'HEAVY_OPERATOR',
    title: 'Ağır İş Makinesi Operatörü',
    badgeColor: '#F59E0B',
    icon: '🚜',
    description: 'Ekskavatör, vinç, loder, bobcat veya hilti operatörü. Enkaz kaldırma koordinasyonu.',
    requiredGear: ['G-Sınıfı Operatör Belgesi', 'Fosforlu Yelek', 'Koruyucu Gözlük', 'Kulak Tıkacı']
  },
  RADIO_TELECOM: {
    id: 'RADIO_TELECOM',
    title: 'Kriz Telsiz Muhaberesi (TRAC)',
    badgeColor: '#06B6D4',
    icon: '📻',
    description: 'Kıyı Emniyeti Lisanslı Amatör Telsizci. VHF/UHF röle, HF acil durum ağı ve saha haberleşmesi.',
    requiredGear: ['VHF/UHF El Telsizi', 'Yedek Batarya', 'Harici Manyetik Anten', 'Amatör Telsiz Belgesi']
  },
  LOGISTICS_FOOD: {
    id: 'LOGISTICS_FOOD',
    title: 'Lojistik & Sahra Mutfağı',
    badgeColor: '#8B5CF6',
    icon: '🍲',
    description: 'Yardım tırlarının tasnifi, çadır kent lojistiği, sıcak çorba/yemek dağıtımı.',
    requiredGear: ['Gıda Bonesi', 'Sıvı Geçirmez Önlük', 'Koli Kesici', 'Depo Eldiveni']
  },
  TRANSLATOR: {
    id: 'TRANSLATOR',
    title: 'Yabancı Ekip Çevirmeni',
    badgeColor: '#EC4899',
    icon: '🌐',
    description: 'Uluslararası INSARAG arama kurtarma birlikleri (İngilizce, İspanyolca vb.) saha refakatçisi.',
    requiredGear: ['Refakatçi Yeleği', 'Çevirmen Kartı', 'Not Defteri', 'Harita']
  },
  ANIMAL_RESCUE: {
    id: 'ANIMAL_RESCUE',
    title: 'Veteriner & Can Dost Kurtarma',
    badgeColor: '#14B8A6',
    icon: '🐾',
    description: 'Enkazdan çıkarılan evcil ve sokak hayvanlarının acil tedavisi ve beslenmesi.',
    requiredGear: ['Taşıma Kafesi', 'Isırık Önleyici Eldiven', 'Antiseptik', 'Kedi/Köpek Maması']
  },
  GENERAL_SUPPORT: {
    id: 'GENERAL_SUPPORT',
    title: 'Genel Destek & Çadır Kurulumu',
    badgeColor: '#64748B',
    icon: '⛺',
    description: 'Çadır tahsis, su dağıtımı, yaşlı ve engelli vatandaşlara refakat.',
    requiredGear: ['Çalışma Eldiveni', 'Yağmurluk', 'Fosforlu Yelek']
  }
};

export interface VolunteerProfile {
  fullName: string;
  bloodGroup: string;
  phone: string;
  city: string;
  nationalIdLast4: string;
  primaryRole: VolunteerSkillRole;
  experienceLevel: 'BEGINNER' | 'INTERMEDIATE' | 'CERTIFIED_EXPERT';
  certifications: string;
  emergencyContact: string;
  availability: 'READY_NOW' | 'WITHIN_24H' | 'LOCAL_ONLY';
  hasVehicle: boolean;
  vehicleType: string;
}

const STORAGE_KEY = 'afet_volunteer_pass_v1';

export class VolunteerDispatchService {
  private static instance: VolunteerDispatchService;

  private constructor() {}

  public static getInstance(): VolunteerDispatchService {
    if (!VolunteerDispatchService.instance) {
      VolunteerDispatchService.instance = new VolunteerDispatchService();
    }
    return VolunteerDispatchService.instance;
  }

  public getProfile(): VolunteerProfile {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.fullName) return parsed;
      }
    } catch {}

    return {
      fullName: '',
      bloodGroup: 'Bilinmiyor',
      phone: '',
      city: '',
      nationalIdLast4: '',
      primaryRole: 'GENERAL_SUPPORT',
      experienceLevel: 'BEGINNER',
      certifications: '',
      emergencyContact: '',
      availability: 'READY_NOW',
      hasVehicle: false,
      vehicleType: ''
    };
  }

  public saveProfile(profile: VolunteerProfile): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {}
  }

  /**
   * Çevrimdışı Güvenlik Noktası ve Kriz Masası için QR Metin Yükü (Payload) Üretir
   */
  public generateQrPayload(profile: VolunteerProfile): string {
    const roleDef = VOLUNTEER_ROLES[profile.primaryRole];
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    
    // Hash-like deterministic signature for accreditation verification
    const rawCheck = `${profile.fullName}-${profile.nationalIdLast4}-${profile.primaryRole}`;
    let hash = 0;
    for (let i = 0; i < rawCheck.length; i++) {
      hash = ((hash << 5) - hash) + rawCheck.charCodeAt(i);
      hash |= 0;
    }
    const authCode = `TR-VOL-${Math.abs(hash).toString(16).toUpperCase().padStart(6, '0')}`;

    return [
      `AFET.LIVE GÖNÜLLÜ SAHRA KİMLİĞİ`,
      `DOĞRULAMA KODU: ${authCode}`,
      `GÖREVLİ: ${profile.fullName.toUpperCase() || 'İSİMSİZ GÖNÜLLÜ'}`,
      `TC SON 4: ${profile.nationalIdLast4 || '----'}`,
      `KAN GRUBU: ${profile.bloodGroup}`,
      `UZMANLIK: ${roleDef.title}`,
      `DENEYİM: ${profile.experienceLevel}`,
      `İLETİŞİM: ${profile.phone || 'Girilmedi'}`,
      `ŞEHİR: ${profile.city || 'Belirtilmedi'}`,
      `HAZIRLIK: ${profile.availability}`,
      profile.hasVehicle ? `ARAÇ: ${profile.vehicleType || 'Mevcut'}` : 'ARAÇ: Yok',
      profile.emergencyContact ? `ACİL YAKINI: ${profile.emergencyContact}` : '',
      `TANZİM: ${timestamp}`
    ].filter(Boolean).join('\n');
  }

  public generateCoordinationSms(profile: VolunteerProfile): string {
    const roleDef = VOLUNTEER_ROLES[profile.primaryRole];
    return `[AFET GÖNÜLLÜ BİLDİRİMİ]\n` +
      `Ad Soyad: ${profile.fullName}\n` +
      `Kan: ${profile.bloodGroup} | Şehir: ${profile.city}\n` +
      `Uzmanlık: ${roleDef.title} (${profile.experienceLevel})\n` +
      `Telefon: ${profile.phone}\n` +
      `Durum: Sahra görevi için hazırım.\n` +
      `Sertifikalar: ${profile.certifications || 'Genel Destek'}\n` +
      `afet.live ile oluşturuldu.`;
  }
}

export const volunteerDispatchService = VolunteerDispatchService.getInstance();

