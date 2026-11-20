/**
 * Gönüllü bilgi kartı (kişisel beyan).
 *
 * Kullanıcının kendi yazdığı bilgileri cihazda saklar ve bunlardan bir metin /
 * QR üretir. Hiçbir şey doğrulanmaz, hiçbir kuruma gönderilmez, sevk ya da
 * akreditasyon yapılmaz. Kart resmi bir kimlik değildir.
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
        if (parsed && typeof parsed === 'object' && typeof parsed.fullName === 'string' && parsed.fullName) {
          const str = (v: unknown, max = 120) => (typeof v === 'string' ? v.slice(0, max) : '');
          const role = (Object.keys(VOLUNTEER_ROLES) as VolunteerSkillRole[]).includes(parsed.primaryRole)
            ? (parsed.primaryRole as VolunteerSkillRole)
            : 'GENERAL_SUPPORT';
          const experienceLevel = ['BEGINNER', 'INTERMEDIATE', 'CERTIFIED_EXPERT'].includes(parsed.experienceLevel)
            ? parsed.experienceLevel
            : 'BEGINNER';
          const availability = ['READY_NOW', 'WITHIN_24H', 'LOCAL_ONLY'].includes(parsed.availability)
            ? parsed.availability
            : 'READY_NOW';
          return {
            fullName: str(parsed.fullName),
            bloodGroup: str(parsed.bloodGroup, 20) || 'Bilinmiyor',
            phone: str(parsed.phone, 30),
            city: str(parsed.city),
            nationalIdLast4: str(parsed.nationalIdLast4, 4),
            primaryRole: role,
            experienceLevel,
            certifications: str(parsed.certifications, 200),
            emergencyContact: str(parsed.emergencyContact),
            availability,
            hasVehicle: parsed.hasVehicle === true,
            vehicleType: str(parsed.vehicleType)
          };
        }
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

  private experienceText(level: VolunteerProfile['experienceLevel']): string {
    if (level === 'CERTIFIED_EXPERT') return 'Sertifikalı olduğunu beyan ediyor';
    if (level === 'INTERMEDIATE') return 'Daha önce sahada görev aldığını beyan ediyor';
    return 'Başlangıç';
  }

  private availabilityText(a: VolunteerProfile['availability']): string {
    if (a === 'WITHIN_24H') return '24 saat içinde hazır';
    if (a === 'LOCAL_ONLY') return 'Yalnızca kendi şehrinde';
    return 'Hemen hazır';
  }

  /**
   * Kartın metin / QR içeriği. Tümü kullanıcının kendi beyanıdır; doğrulama kodu üretilmez.
   */
  public generateQrPayload(profile: VolunteerProfile): string {
    const roleDef = VOLUNTEER_ROLES[profile.primaryRole] || VOLUNTEER_ROLES.GENERAL_SUPPORT;
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);

    return [
      `GÖNÜLLÜ BİLGİ KARTI (kişisel beyan — resmi kimlik değildir)`,
      `AD SOYAD: ${profile.fullName || 'Girilmedi'}`,
      profile.nationalIdLast4 ? `TC SON 4: ${profile.nationalIdLast4}` : '',
      `KAN GRUBU: ${profile.bloodGroup}`,
      `BEYAN EDİLEN ALAN: ${roleDef.title}`,
      `DENEYİM: ${this.experienceText(profile.experienceLevel)}`,
      `TELEFON: ${profile.phone || 'Girilmedi'}`,
      `ŞEHİR: ${profile.city || 'Belirtilmedi'}`,
      `HAZIRLIK: ${this.availabilityText(profile.availability)}`,
      profile.emergencyContact ? `ACİL DURUM YAKINI: ${profile.emergencyContact}` : '',
      `OLUŞTURULMA: ${timestamp}`,
      `Bu bilgiler doğrulanmamıştır. afet.live`
    ].filter(Boolean).join('\n');
  }

  public generateCoordinationSms(profile: VolunteerProfile): string {
    const roleDef = VOLUNTEER_ROLES[profile.primaryRole] || VOLUNTEER_ROLES.GENERAL_SUPPORT;
    return `[GÖNÜLLÜ BİLGİSİ — kişisel beyan]\n` +
      `Ad Soyad: ${profile.fullName}\n` +
      `Kan: ${profile.bloodGroup} | Şehir: ${profile.city}\n` +
      `Alan: ${roleDef.title} (${this.experienceText(profile.experienceLevel)})\n` +
      `Telefon: ${profile.phone}\n` +
      `Durum: Gönüllü olarak yardım etmek istiyorum (${this.availabilityText(profile.availability)}).\n` +
      `Belge / ekipman: ${profile.certifications || 'Belirtilmedi'}\n` +
      `afet.live ile oluşturuldu.`;
  }
}

export const volunteerDispatchService = VolunteerDispatchService.getInstance();

