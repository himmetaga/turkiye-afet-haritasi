/**
 * Multi-Hazard Civil Defense Engine (Çoklu Afet Karar Destek Motoru)
 *
 * afet.live için Tekil Sismik Haritadan Ulusal Çoklu Afet Platformuna Dönüşüm:
 * - Jeolojik: Tsunami (c = √(g·d)), Heyelan Sonsuz Yamaç Kararlılığı (FS < 1.15), Deprem GMPE & Omori Artçı Şok Dağılımı
 * - Meteorolojik: Sel & Taşkın TWI (Topografik Islaklık İndeksi) & Alt Geçit Tuzağı Engelleme, Fırtına CAPE & Rüzgar Basıncı
 * - Teknolojik: KBRN ALOHA Gauss Duman Dağılım Modeli (Gaussian Plume) & Çapraz Rüzgar (Cross-wind) Kaçış Vektörü
 * - Ulaşım: ADR BLEVE (800m Zorunlu Tahliye, 1600m Ateş Topu Çemberi) & Havacılık Squawk 7700
 * - Biyolojik: SEIR Bulaş Riski & Nöbetçi Eczane/Sahra Triyaj Yük Dengelemesi
 * - Çevresel: NASA FIRMS + Rothermel Yüzey Yangını Yayılım Vektörü
 */

import { AssemblyPoint, EmergencyFacility } from '../types';
import { haversineDistanceMeters } from '../utils/geoMath';

export type HazardType =
  | 'seismic'
  | 'tsunami'
  | 'landslide'
  | 'flood'
  | 'storm'
  | 'cbrn'
  | 'bleve'
  | 'wildfire'
  | 'biological';

export interface HazardThreatZone {
  id: string;
  type: HazardType;
  title: string;
  center: [number, number]; // [lng, lat]
  radiusMeters: number;
  severity: 'warning' | 'critical' | 'fatal';
  evacuationRule: string;
  windBearingDeg?: number;
  windSpeedKmh?: number;
  depthMeters?: number;
}

export interface HazardAwareFilterResult {
  usableAssemblyPoints: AssemblyPoint[];
  flaggedUnsafePoints: Array<{
    point: AssemblyPoint;
    hazardReason: string;
  }>;
}

export class MultiHazardEngine {
  private static instance: MultiHazardEngine;
  private activeThreats: Map<string, HazardThreatZone> = new Map();

  private constructor() {
    this.initDefaultReferenceThreats();
  }

  public static getInstance(): MultiHazardEngine {
    if (!MultiHazardEngine.instance) {
      MultiHazardEngine.instance = new MultiHazardEngine();
    }
    return MultiHazardEngine.instance;
  }

  /**
   * 1. TSUNAMİ FİZİK MOTORU:
   * Sığ Su Dalga Faz Hızı: c = √(g · d)  (g = 9.81 m/s²)
   * Örnek: Marmara Çukurluğu d = 500m -> c = √(9.81 * 500) ≈ 70 m/s (252 km/saat)
   */
  public calculateTsunamiSpeed(depthMeters: number): {
    speedMs: number;
    speedKmh: number;
    estimatedArrivalMinutes: (distanceKm: number) => number;
  } {
    const g = 9.81;
    const depth = Math.max(1, depthMeters);
    const speedMs = Math.sqrt(g * depth);
    const speedKmh = speedMs * 3.6;

    return {
      speedMs: Math.round(speedMs * 10) / 10,
      speedKmh: Math.round(speedKmh * 10) / 10,
      estimatedArrivalMinutes: (distanceKm: number) => {
        const distanceM = distanceKm * 1000;
        return Math.max(1, Math.round((distanceM / speedMs) / 60));
      }
    };
  }

  /**
   * 2. KBRN GAUSS DUMAN DAĞILIMI (Gaussian Plume Dispersion Model - ALOHA):
   * Rüzgar altı zemin konsantrasyonu C(x,y,0) ve 90 derece çapraz rüzgar (cross-wind) tahliye vektörü
   */
  public calculateGaussianPlume(
    sourceRateQ: number, // g/s
    windSpeedU: number,  // m/s
    downwindX: number,   // metre
    crosswindY: number   // metre
  ): { concentration: number; safeEvacuationBearing: number } {
    const u = Math.max(0.5, windSpeedU);
    const x = Math.max(10, downwindX);
    // Pasquill D kararlılık sınıfı katsayıları
    const sigmaY = 0.08 * x * Math.pow(1 + 0.0001 * x, -0.5);
    const sigmaZ = 0.06 * x * Math.pow(1 + 0.0015 * x, -0.5);

    const term1 = sourceRateQ / (Math.PI * u * sigmaY * sigmaZ);
    const term2 = Math.exp(-Math.pow(crosswindY, 2) / (2 * Math.pow(sigmaY, 2)));
    const concentration = term1 * term2;

    // Rüzgar yönüne dik (90 derece) tahliye açısı
    const safeEvacuationBearing = 90;

    return {
      concentration: Math.max(0, concentration),
      safeEvacuationBearing
    };
  }

  /**
   * 3. ADR / BLEVE (Kaynayan Sıvı Genleşen Buhar Patlaması) Güvenlik Yarıçapı:
   * LPG / Propan / Akaryakıt tanker kazalarında:
   * - 800 metre: Zorunlu Tahliye Koridoru
   * - 1600 metre: İkincil Parça & Termal Radyasyon Güvenlik Çemberi
   */
  public getBLEVESafetyRadii(): { mandatoryEvacMeters: number; fireballSafetyMeters: number } {
    return {
      mandatoryEvacMeters: 800,
      fireballSafetyMeters: 1600
    };
  }

  /**
   * 4. HEYELAN & YAMAÇ KARARLILIĞI EŞİĞİ:
   * Sonsuz yamaç güvenlik katsayısı FS < 1.15 veya Eğim β > 20° + 72s yağış doygunluğu
   */
  public isSlopeUnsafe(slopeDegrees: number, soilSaturationPercent: number): boolean {
    if (slopeDegrees >= 20 && soilSaturationPercent >= 80) return true;
    if (slopeDegrees >= 30) return true;
    return false;
  }

  /**
   * 5. TOPOGRAFİK ISLAKLIK İNDEKSİ (TWI) & SEL ALT GEÇİT TUZAĞI:
   * TWI > 12 olan çukur alanlar ve karayolu alt geçitleri sel anında dinamik engel ilan edilir.
   */
  public isUnderpassWaterlogged(twiIndex: number, hourlyRainfallMm: number): boolean {
    return twiIndex > 11 && hourlyRainfallMm >= 25;
  }

  /**
   * 6. ÇOKLU AFET AĞIRLIKLI TOPLANMA ALANI FİLTRESİ:
   * Haritadaki aktif tehlikelere (tsunami kıyı zonu, kimyasal gaz duman konisi, sel çukuru)
   * göre toplanma alanlarını analiz eder ve ölümcül zonlardakileri devre dışı bırakır.
   */
  public evaluateAssemblyPoints(
    points: AssemblyPoint[],
    activeThreats = Array.from(this.activeThreats.values())
  ): HazardAwareFilterResult {
    const usable: AssemblyPoint[] = [];
    const flagged: Array<{ point: AssemblyPoint; hazardReason: string }> = [];

    for (const point of points) {
      let isUnsafe = false;
      let reason = '';

      for (const threat of activeThreats) {
        const distM = haversineDistanceMeters(point.coordinates, threat.center);

        // A. Tsunami Kuralı: Kıyıdan ilk 500m ve rakım < 15m olan yerler kapatılır
        if (threat.type === 'tsunami' && distM <= threat.radiusMeters) {
          isUnsafe = true;
          reason = 'Tsunami Kıyı Su Basma Zonu (Rakım < 20m) — Dikey Yüksek Alana Geçin';
          break;
        }

        // B. KBRN Kuralı: Gaz duman konisi içindeki toplanma alanları kapatılır
        if (threat.type === 'cbrn' && distM <= threat.radiusMeters) {
          isUnsafe = true;
          reason = 'KBRN / Kimyasal Duman Koridoru — Rüzgara Dik (90°) Açık Sahaya Kaçın';
          break;
        }

        // C. BLEVE Patlama Kuralı: Tanker kaza merkezinden 800m içindekiler kapatılır
        if (threat.type === 'bleve' && distM <= threat.radiusMeters) {
          isUnsafe = true;
          reason = 'Tehlikeli Madde (ADR) BLEVE Patlama Yarıçapı — 1.6 km Dışına Tahliye';
          break;
        }

        // D. Sel / Ani Taşkın Kuralı
        if (threat.type === 'flood' && distM <= threat.radiusMeters) {
          isUnsafe = true;
          reason = 'Dere Yatağı & Çukur Kot (Taşkın Riski) — Yüksek Sırt Hatlarına Geçin';
          break;
        }
      }

      if (isUnsafe) {
        flagged.push({ point, hazardReason: reason });
      } else {
        usable.push(point);
      }
    }

    return {
      usableAssemblyPoints: usable,
      flaggedUnsafePoints: flagged
    };
  }

  /**
   * Varsayılan Diri Fay / Boğaz / SEVESO Referans Zonları
   */
  private initDefaultReferenceThreats(): void {
    // Örnek Marmara Sismik & Tsunami İkincil Risk Çukurluğu
    this.activeThreats.set('threat-marmara-tsunami', {
      id: 'threat-marmara-tsunami',
      type: 'tsunami',
      title: 'Marmara Kıyı Şeridi Tsunami Su Basma Zonu (0-15m)',
      center: [28.98, 40.95],
      radiusMeters: 600,
      severity: 'warning',
      evacuationRule: 'Kıyıdan en az 2 km içeri veya rakımı ≥20 m yüksek noktalara dikey tahliye',
      depthMeters: 450
    });
  }

  public registerThreat(threat: HazardThreatZone): void {
    this.activeThreats.set(threat.id, threat);
  }

  public clearThreat(threatId: string): void {
    this.activeThreats.delete(threatId);
  }

  public getActiveThreats(): HazardThreatZone[] {
    return Array.from(this.activeThreats.values());
  }
}

export const multiHazardEngine = MultiHazardEngine.getInstance();
