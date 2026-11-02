/**
 * Wildfire Escape & Fire Flank Evacuation Service (Orman & Arazi Yangını Kaçış Motoru)
 *
 * Fiziksel ve Taktiksel Modeller:
 * 1. Rothermel Yüzey Yangını Yayılma Modeli (Rate of Spread - ROS):
 *    - Rüzgar etkisi: U^1.4 çarpanı
 *    - Eğim etkisi: Şiddetli yamaç yukarı koşma (Chimney / Baca etkisi)
 * 2. 90° Çapraz Kanat Kaçış Vektörü (Escape Flank Protocol):
 *    - Yangın daima rüzgar altına (windBearing + 180°) koşar.
 *    - ASLA rüzgar altına kaçılmaz! ASLA yamaç yukarı alevlerin önüne koşulmaz!
 *    - En güvenli rotalar: Rüzgara 90° dik iki yan kanat (Left/Right Flanks), önceden yanmış siyah kül hattı veya su/kayalık hatları.
 * 3. USFS / NFPA 1051 Standoff Güvenlik Bölgesi Çemberi (Safety Zone: 4x Alev Boyu)
 * 4. Burnover (Alevlerin Arasında Kalma) Hayatta Kalma Protokolleri
 */

export type FuelType = 'grass' | 'brush' | 'timber' | 'slash';

export interface FuelProfile {
  name: string;
  fuelBedDepthM: number;
  baseSpreadMPerMin: number;
  flameLengthBaseM: number;
  description: string;
}

export const FUEL_PROFILES: Record<FuelType, FuelProfile> = {
  grass: {
    name: 'Kuru Ot & Ekin',
    fuelBedDepthM: 0.3,
    baseSpreadMPerMin: 12.0,
    flameLengthBaseM: 1.8,
    description: 'Son derece hızlı yayılır, rüzgarla aniden yön değiştirir, alev boyu 1-2.5m.'
  },
  brush: {
    name: 'Maki & Çalılık (Tipik Akdeniz)',
    fuelBedDepthM: 1.2,
    baseSpreadMPerMin: 6.5,
    flameLengthBaseM: 4.2,
    description: 'Yüksek reçine ve uçucu yağ içerir, şiddetli radyant ısı yayar, alev boyu 3-6m.'
  },
  timber: {
    name: 'Kızılçam & İğne Yapraklı Orman',
    fuelBedDepthM: 2.5,
    baseSpreadMPerMin: 3.2,
    flameLengthBaseM: 8.5,
    description: 'Tepe yangınına (Crown Fire) dönüşebilir, kozalak fırlamalarıyla nokta yangınları açar.'
  },
  slash: {
    name: 'Kuru Dal & Ağaç Artıkları',
    fuelBedDepthM: 0.8,
    baseSpreadMPerMin: 2.5,
    flameLengthBaseM: 3.0,
    description: 'Yüksek köz ve duman üretir, oksijeni hızla tüketir.'
  }
};

export interface WildfireAssessment {
  windBearingDeg: number;       // Rüzgarın geldiği yön (0: Kuzey, 90: Doğu, 180: Güney, 270: Batı)
  windSpeedKmh: number;         // Rüzgar hızı
  slopePct: number;             // Arazi eğimi (%)
  fuelType: FuelType;           // Yakıt türü
  fuelProfile: FuelProfile;
  rateOfSpreadMPerMin: number;  // Yayılma hızı (m/dk)
  rateOfSpreadKmH: number;      // Yayılma hızı (km/saat)
  estimatedFlameLengthM: number;// Tahmini alev boyu (m)
  safetyZoneRadiusM: number;    // Güvenlik bölgesi yarıçapı (m)
  threatDirectionDeg: number;   // Yangının koştuğu ölüm yönü (windBearing + 180°)
  leftFlankEscapeDeg: number;   // Güvenli Sol Kaçış Kanadı (threat - 90°)
  rightFlankEscapeDeg: number;  // Güvenli Sağ Kaçış Kanadı (threat + 90°)
  dangerLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
  dangerColor: string;
  tacticalAdvice: string[];
}

export class WildfireEscapeService {
  private static instance: WildfireEscapeService;

  private constructor() {}

  public static getInstance(): WildfireEscapeService {
    if (!WildfireEscapeService.instance) {
      WildfireEscapeService.instance = new WildfireEscapeService();
    }
    return WildfireEscapeService.instance;
  }

  /**
   * Rothermel Yüzey Yangını ve Taktik Kaçış Vektörlerini Hesaplar
   */
  public evaluateWildfire(
    windBearingDeg: number,
    windSpeedKmh: number,
    slopePct: number,
    fuelType: FuelType = 'brush'
  ): WildfireAssessment {
    const normBearing = ((windBearingDeg % 360) + 360) % 360;
    const profile = FUEL_PROFILES[fuelType] || FUEL_PROFILES.brush;

    // 1. Rüzgar Katsayısı (Wind Factor: U^1.3)
    const windMs = Math.max(0, windSpeedKmh) / 3.6;
    const phiW = 0.05 * Math.pow(windMs, 1.35);

    // 2. Eğim Katsayısı (Slope Factor: 5.275 * tan(slope)^2)
    const slopeRad = Math.atan(Math.max(0, slopePct) / 100);
    const phiS = 5.275 * Math.pow(Math.tan(slopeRad), 2);

    // 3. Yayılma Hızı (Rate of Spread)
    const rosMPerMin = Math.round(profile.baseSpreadMPerMin * (1 + phiW + phiS) * 10) / 10;
    const rosKmH = Math.round((rosMPerMin * 60 / 1000) * 10) / 10;

    // 4. Alev Boyu ve Güvenlik Çemberi (Byram / Butler Standardı: 4 x FlameLength)
    const flameLengthM = Math.round((profile.flameLengthBaseM * Math.pow(1 + phiW * 0.6, 0.46)) * 10) / 10;
    const safetyZoneRadiusM = Math.max(25, Math.round(flameLengthM * 4.0));

    // 5. Yön Vektörleri
    // Yangın rüzgarın estiği yöne (rüzgar altına) doğru koşar
    const threatDirectionDeg = (normBearing + 180) % 360;
    // Güvenli kaçış kanatları: Yangın cephesine 90 derece dik iki açı
    const rightFlankEscapeDeg = (threatDirectionDeg + 90) % 360;
    const leftFlankEscapeDeg = (threatDirectionDeg + 270) % 360;

    // 6. Tehlike Seviyesi
    let dangerLevel: WildfireAssessment['dangerLevel'] = 'LOW';
    let dangerColor = '#10B981';

    if (rosKmH >= 8.0 || windSpeedKmh >= 45 || flameLengthM >= 6.0) {
      dangerLevel = 'EXTREME';
      dangerColor = '#EF4444';
    } else if (rosKmH >= 4.0 || windSpeedKmh >= 28 || flameLengthM >= 3.5) {
      dangerLevel = 'HIGH';
      dangerColor = '#F97316';
    } else if (rosKmH >= 1.5 || windSpeedKmh >= 15) {
      dangerLevel = 'MODERATE';
      dangerColor = '#F59E0B';
    }

    // 7. Taktik Hayatta Kalma Tavsiyeleri
    const tacticalAdvice: string[] = [];

    tacticalAdvice.push(
      `🚨 ASLA RÜZGAR ALTINA KOŞMAYIN: Yangın ${this.bearingToText(threatDirectionDeg)} (${threatDirectionDeg}°) yönüne doğru saatte ${rosKmH} km hızla ilerliyor.`
    );

    tacticalAdvice.push(
      `🧭 EN GÜVENLİ KAÇIŞ VEKTÖRLERİ: Yangın cephesine 90° dik kanatlara doğru ilerleyin: Sağ Kanat ${this.bearingToText(rightFlankEscapeDeg)} (${rightFlankEscapeDeg}°) veya Sol Kanat ${this.bearingToText(leftFlankEscapeDeg)} (${leftFlankEscapeDeg}°).`
    );

    if (slopePct > 15) {
      tacticalAdvice.push(
        `⛰️ YAMAÇ YUKARI KOŞMAYIN: Eğim yangını baca etkisiyle 3 kat hızlandırır. Yangının önündeki tepeye değil, yamacın yanına veya düzlüğe doğru kaçın.`
      );
    }

    tacticalAdvice.push(
      `🛡️ ASGARİ GÜVENLİ MESAFE: Radyant ısıdan korunmak için alev cephesinden en az ${safetyZoneRadiusM} metre açık alanda (veya yanmış siyah kül bölgesinde) kalın.`
    );

    tacticalAdvice.push(
      `🔥 SİYAH BÖLGE AVANTAJI: Yanıp kül olmuş siyah arazi (yanacak yakıt kalmadığı için) alevlerin ortasında kalındığında en güvenli sığınma zeminidir.`
    );

    return {
      windBearingDeg: normBearing,
      windSpeedKmh,
      slopePct,
      fuelType,
      fuelProfile: profile,
      rateOfSpreadMPerMin: rosMPerMin,
      rateOfSpreadKmH: rosKmH,
      estimatedFlameLengthM: flameLengthM,
      safetyZoneRadiusM,
      threatDirectionDeg,
      leftFlankEscapeDeg,
      rightFlankEscapeDeg,
      dangerLevel,
      dangerColor,
      tacticalAdvice
    };
  }

  /**
   * Derece açısını Türkçe pusula yönüne çevirir
   */
  public bearingToText(deg: number): string {
    const d = ((deg % 360) + 360) % 360;
    if (d >= 337.5 || d < 22.5) return 'Kuzey (K)';
    if (d >= 22.5 && d < 67.5) return 'Kuzeydoğu (KD)';
    if (d >= 67.5 && d < 112.5) return 'Doğu (D)';
    if (d >= 112.5 && d < 157.5) return 'Güneydoğu (GD)';
    if (d >= 157.5 && d < 202.5) return 'Güney (G)';
    if (d >= 202.5 && d < 247.5) return 'Güneybatı (GB)';
    if (d >= 247.5 && d < 292.5) return 'Batı (B)';
    return 'Kuzeybatı (KB)';
  }
}

export const wildfireEscapeService = WildfireEscapeService.getInstance();
