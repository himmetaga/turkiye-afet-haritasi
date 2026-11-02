/**
 * Avalanche Risk & Winter Hypothermia Survival Service
 * (Çığ Riski ve Kış Hipotermi Hayatta Kalma Motoru)
 *
 * Fiziksel ve Biyometrik Standartlar:
 * 1. NOAA / National Weather Service (NWS) Rüzgar Soğuğu İndeksi (Wind Chill Temperature - Twc):
 *    Twc = 13.12 + 0.6215*T - 11.37*V^0.16 + 0.3965*T*V^0.16
 *    - Sıcaklık T (°C) ve Rüzgar Hızı V (km/s)
 *    - Açık deri donma süresi (Frostbite Time: 30 dk, 10 dk, 5 dk)
 * 2. European Avalanche Warning Services (EAWS) Çığ Eğimi Analizi:
 *    - 30° - 45°: Çığların %90'ının koptuğu tabaka (slab) çığ tuzağı
 *    - < 25°: Kar stabil kalır, çığ kopma olasılığı çok düşüktür
 *    - > 50°: Kar tutunamaz, küçük döküntüler akar, dev plaka oluşmaz
 * 3. Kar Mağarası ve Hipotermi Yalıtım Fiziği (Karın ısı iletkenliği k ≈ 0.05 - 0.15 W/mK)
 */

export type SnowPackType = 'powder' | 'wind_slab' | 'wet_spring' | 'hard_crust';

export interface SnowPackProfile {
  name: string;
  avalancheHazard: 'EXTREME' | 'HIGH' | 'MODERATE' | 'LOW';
  densityKgM3: number;
  triggerEase: string;
  description: string;
}

export const SNOWPACK_PROFILES: Record<SnowPackType, SnowPackProfile> = {
  wind_slab: {
    name: 'Rüzgar Karı Plakası (En Tehlikeli Tabaka)',
    avalancheHazard: 'EXTREME',
    densityKgM3: 350,
    triggerEase: 'Tek bir kişinin veya hafif artçı sarsıntının ağırlığıyla aniden kırılır.',
    description: 'Rüzgarın sırt arkasına yığdığı gerilimli sert tabaka; altındaki zayıf kristaller göçünce blok halinde kayar.'
  },
  powder: {
    name: 'Taze Toz Kar',
    avalancheHazard: 'HIGH',
    densityKgM3: 80,
    triggerEase: 'Yoğun yağış sonrası dik yamaçlardan toz bulutu halinde süpürülür.',
    description: 'Hafiftir ancak yüksek hızda (200+ km/s) hava basıncı şok dalgası oluşturur.'
  },
  wet_spring: {
    name: 'Ağır Islak Kar (Güneş / Bahar Karı)',
    avalancheHazard: 'HIGH',
    densityKgM3: 450,
    triggerEase: 'Havanın ısınması veya yağmurla ağırlaşarak kendi ağırlığıyla kayar.',
    description: 'Beton gibi ağırdır; enkaz ve çadırları doğrudan ezerek sürükler.'
  },
  hard_crust: {
    name: 'Sert Donmuş Kabuk',
    avalancheHazard: 'LOW',
    densityKgM3: 500,
    triggerEase: 'Gece donlarıyla sertleşmiştir; yeni kar yağmadıkça stabildir.',
    description: 'Kayma riski düşüktür ancak yüzey kaygandır, krampon/tutunma gerekir.'
  }
};

export interface HypothermiaAssessment {
  ambientTempC: number;
  windSpeedKmh: number;
  windChillC: number;
  frostbiteTimeMinutes: number | null; // null: 60+ dk veya donma riski yok
  hypothermiaRiskLevel: 'SAFE' | 'CAUTION' | 'DANGER' | 'EXTREME_FATAL';
  hypothermiaRiskColor: string;
  hypothermiaAdvice: string[];
}

export interface AvalancheAssessment {
  slopeAngleDeg: number;
  snowType: SnowPackType;
  snowProfile: SnowPackProfile;
  avalancheRiskLevel: 'SAFE' | 'MODERATE' | 'CRITICAL_TRAP' | 'EXTREME';
  avalancheRiskColor: string;
  isCriticalSlopeTrap: boolean; // 30° - 45°
  tacticalRules: string[];
}

export class AvalancheHypothermiaService {
  private static instance: AvalancheHypothermiaService;

  private constructor() {}

  public static getInstance(): AvalancheHypothermiaService {
    if (!AvalancheHypothermiaService.instance) {
      AvalancheHypothermiaService.instance = new AvalancheHypothermiaService();
    }
    return AvalancheHypothermiaService.instance;
  }

  /**
   * NOAA NWS Wind Chill (Rüzgar Soğuğu) Formülü
   */
  public calculateWindChill(ambientTempC: number, windSpeedKmh: number): HypothermiaAssessment {
    const t = ambientTempC;
    const v = Math.max(1, windSpeedKmh);

    // Rüzgar 5 km/s altındaysa rüzgar soğuğu etkisi minimumdur
    let twc = t;
    if (v >= 4.8 && t <= 10) {
      twc = 13.12 + 0.6215 * t - 11.37 * Math.pow(v, 0.16) + 0.3965 * t * Math.pow(v, 0.16);
    }
    const windChillC = Math.round(twc * 10) / 10;

    let frostbiteTimeMinutes: number | null = null;
    let hypothermiaRiskLevel: HypothermiaAssessment['hypothermiaRiskLevel'] = 'SAFE';
    let hypothermiaRiskColor = '#10B981';

    if (windChillC <= -38) {
      frostbiteTimeMinutes = 5;
      hypothermiaRiskLevel = 'EXTREME_FATAL';
      hypothermiaRiskColor = '#EF4444';
    } else if (windChillC <= -27) {
      frostbiteTimeMinutes = 15;
      hypothermiaRiskLevel = 'DANGER';
      hypothermiaRiskColor = '#F97316';
    } else if (windChillC <= -12) {
      frostbiteTimeMinutes = 30;
      hypothermiaRiskLevel = 'CAUTION';
      hypothermiaRiskColor = '#F59E0B';
    }

    const hypothermiaAdvice: string[] = [];

    if (windChillC <= -25) {
      hypothermiaAdvice.push('🚨 AŞIRI HİPOTERMİ TEHLİKESİ: Açıkta kalan yüz ve parmaklar 10-15 dakika içinde kalıcı donma hasarına (Frostbite) uğrar.');
      hypothermiaAdvice.push('🧥 KATMAN KURALI (3 Katman): Teri atan termal içlik + yalıtıcı polar/yün + rüzgar/su geçirmez dış kabuk.');
      hypothermiaAdvice.push('🚫 ASLA KARLA OVMAYIN: Donmuş dokuyu karla ovmak buz kristalleriyle hücreleri parçalar; ılık suyla (38°C) yavaşça ısıtın.');
    } else if (windChillC <= -10) {
      hypothermiaAdvice.push('⚠️ RÜZGAR SOĞUĞU: Hissedilen dondurucu soğuk vücut ısısını hızla tüketir; çadır ve açık alanda rüzgar kesici siper oluşturun.');
      hypothermiaAdvice.push('☕ SICAK ŞEKERLİ İÇECEK: Titreme vücudun glikozunu tüketir; sıcak şekerli sıvılar içirin, asla alkol vermeyin (alkol damarları genişleterek ısı kaybını hızlandırır).');
    } else {
      hypothermiaAdvice.push('✅ Hissedilen rüzgar soğuğu güvenli sınırda; ıslak giysileri derhal kuru olanlarla değiştiriniz.');
    }

    return {
      ambientTempC,
      windSpeedKmh,
      windChillC,
      frostbiteTimeMinutes,
      hypothermiaRiskLevel,
      hypothermiaRiskColor,
      hypothermiaAdvice
    };
  }

  /**
   * EAWS Yamaç Eğimi ve Kar Profili Çığ Riski Analizi
   */
  public evaluateAvalanche(slopeAngleDeg: number, snowType: SnowPackType = 'wind_slab'): AvalancheAssessment {
    const angle = Math.max(0, Math.min(75, Math.round(slopeAngleDeg)));
    const profile = SNOWPACK_PROFILES[snowType] || SNOWPACK_PROFILES.wind_slab;

    // 30° - 45° kritik aralık
    const isCriticalSlopeTrap = angle >= 29 && angle <= 46;

    let avalancheRiskLevel: AvalancheAssessment['avalancheRiskLevel'] = 'SAFE';
    let avalancheRiskColor = '#10B981';

    if (isCriticalSlopeTrap) {
      if (profile.avalancheHazard === 'EXTREME') {
        avalancheRiskLevel = 'EXTREME';
        avalancheRiskColor = '#EF4444';
      } else {
        avalancheRiskLevel = 'CRITICAL_TRAP';
        avalancheRiskColor = '#F97316';
      }
    } else if (angle > 46) {
      avalancheRiskLevel = 'MODERATE';
      avalancheRiskColor = '#F59E0B';
    } else {
      avalancheRiskLevel = 'SAFE';
      avalancheRiskColor = '#10B981';
    }

    const tacticalRules: string[] = [];

    if (isCriticalSlopeTrap) {
      tacticalRules.push(`⛔ KRİTİK ÇIĞ TUZAĞI (${angle}° Eğim): Çığların %90'ı 30° ile 45° arasındaki yamaçlarda kopar. Bu yamaçtan derhal uzaklaşın.`);
      tacticalRules.push('🏔️ SIRT HATTI PROTOKOLÜ: Vadi tabanından veya yamaç ortasından değil, rüzgar almayan güvenli sırt hatlarından (ridge lines) intikal ediniz.');
      tacticalRules.push('🚶 TEKLİ GEÇİŞ KURALI: Eğer şüpheli bir yamaçtan geçmek zorunluysa, grup halinde değil; aralarında en az 50 metre mesafe bırakarak teker teker geçiniz.');
    } else if (angle > 46) {
      tacticalRules.push(`⚠️ SARP YAMAÇ (${angle}° Eğim): Kar birikimi dev plaka yapmaz ancak küçük kar akıntıları ve taş düşmesi riski taşır.`);
    } else {
      tacticalRules.push(`✅ GÜVENLİ DÜZ EĞİM (${angle}° Eğim): Yamaç eğimi çığ tetikleme eşiğinin altındadır; yukarıdaki dik yamaçların döküntü konisinde olmamaya dikkat ediniz.`);
    }

    tacticalRules.push('❄️ ÇIĞ ALTINDA KALINIRSA: Akış esnasında yüzme hareketleri yapın; durma anında ellerinizi yüzünüzün önüne alarak en az 1 litrelik HAVA BOŞLUĞU (Air pocket) açın.');

    return {
      slopeAngleDeg: angle,
      snowType,
      snowProfile: profile,
      avalancheRiskLevel,
      avalancheRiskColor,
      isCriticalSlopeTrap,
      tacticalRules
    };
  }
}

export const avalancheHypothermiaService = AvalancheHypothermiaService.getInstance();

