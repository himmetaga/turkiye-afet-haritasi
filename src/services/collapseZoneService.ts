/**
 * Building Collapse Zone & Debris Shadow Standoff Service
 * (Enkaz & Hasarlı Bina Yıkılma Güvenlik Çemberi Motoru)
 *
 * Uluslararası Standartlar:
 * 1. USAR (INSARAG / FEMA) Standoff Kuralı:
 *    - Güvenli Yıkılma Çemberi: D_safe = 1.5 x Bina Yüksekliği (H)
 *    - Ağır Parça & Cam Fırlama Menzili: D_shrapnel = 2.0 x H
 * 2. Kentsel Ölüm Kanyonu Analizi (Street Canyon Width W vs D_safe):
 *    - Eğer Sokak Genişliği W < 1.5 x H ise, sokağın karşı kaldırımı dahi GÜVENLİ DEĞİLDİR.
 *      Enkaz karşı binanın cephesine çarparak sokağı bir mezara dönüştürür.
 * 3. Yapı Tipolojisi Çökme Karakteristiği (Betonarme, Yığma, Çelik)
 */

export type StructuralType = 'concrete_frame' | 'masonry' | 'steel_prefab';

export interface StructureProfile {
  name: string;
  failureMode: string;
  parapetBlastRisk: 'HIGH' | 'EXTREME' | 'MODERATE';
  debrisSpillMultiplier: number;
  description: string;
}

export const STRUCTURE_PROFILES: Record<StructuralType, StructureProfile> = {
  concrete_frame: {
    name: 'Betonarme Karkas (Tipik Türkiye Apartmanı)',
    failureMode: 'Yumuşak Kat (Soft-Story) / Toptan Sandviç (Pancake) / Yanal Devrilme',
    parapetBlastRisk: 'EXTREME',
    debrisSpillMultiplier: 1.5,
    description: 'Ağır beton döşemeler, balkonlar ve tuğla dolgu duvarlar sokağa doğru patlayarak devrilir.'
  },
  masonry: {
    name: 'Yığma Tuğla / Taş / Kerpiç Yapı',
    failureMode: 'Dışa Doğru Patlama (Outward Blow-out) / Çatı Çökmesi',
    parapetBlastRisk: 'HIGH',
    debrisSpillMultiplier: 1.4,
    description: 'Harç bağlayıcılığını yitirmiş duvarlar blok halinde kaldırıma ve sokağa saçılır.'
  },
  steel_prefab: {
    name: 'Çelik / Prefabrik Endüstriyel Yapı',
    failureMode: 'Kolon Burkulması (Buckling) / Yanal Salınım / Panel Kopması',
    parapetBlastRisk: 'MODERATE',
    debrisSpillMultiplier: 1.2,
    description: 'Çatı makasları ve cephe kaplama panelleri geniş bir alana savrulabilir.'
  }
};

export interface CollapseAssessment {
  floors: number;
  buildingHeightM: number;
  streetWidthM: number;
  structuralType: StructuralType;
  structureProfile: StructureProfile;
  safeStandoffRadiusM: number;      // 1.5 x H
  shrapnelRadiusM: number;         // 2.0 x H
  isStreetDeathTrap: boolean;      // Sokak genişliği < 1.5 x H
  streetCoveragePct: number;       // Enkazın sokağı kaplama yüzdesi
  dangerRating: 'FATAL_TRAP' | 'HIGH_RISK' | 'CAUTION' | 'SAFE_DISTANCE';
  dangerColor: string;
  tacticalRules: string[];
}

export class CollapseZoneService {
  private static instance: CollapseZoneService;

  private constructor() {}

  public static getInstance(): CollapseZoneService {
    if (!CollapseZoneService.instance) {
      CollapseZoneService.instance = new CollapseZoneService();
    }
    return CollapseZoneService.instance;
  }

  /**
   * Hasarlı bina parametrelerine göre USAR yıkılma güvenlik çemberini hesaplar
   */
  public evaluateCollapseZone(
    floors: number,
    streetWidthM: number = 8.0,
    structuralType: StructuralType = 'concrete_frame'
  ): CollapseAssessment {
    const validFloors = Math.max(1, Math.min(60, floors));
    const validStreetWidth = Math.max(2, Math.min(100, streetWidthM));
    const profile = STRUCTURE_PROFILES[structuralType] || STRUCTURE_PROFILES.concrete_frame;

    // Türkiye standart kat yüksekliği: 3.0 metre
    const buildingHeightM = Math.round(validFloors * 3.0 * 10) / 10;

    // USAR / FEMA 1.5x Standart Standoff Yarıçapı
    const safeStandoffRadiusM = Math.round(buildingHeightM * 1.5 * profile.debrisSpillMultiplier / 1.5 * 10) / 10;

    // Ağır Parça & Cam Saçılma Menzili (2.0x)
    const shrapnelRadiusM = Math.round(buildingHeightM * 2.0 * 10) / 10;

    // Sokak Genişliği Karşılaştırması
    const isStreetDeathTrap = validStreetWidth < safeStandoffRadiusM;
    const streetCoveragePct = Math.min(100, Math.round((safeStandoffRadiusM / validStreetWidth) * 100));

    let dangerRating: CollapseAssessment['dangerRating'] = 'SAFE_DISTANCE';
    let dangerColor = '#10B981';

    if (isStreetDeathTrap && validFloors >= 4) {
      dangerRating = 'FATAL_TRAP';
      dangerColor = '#EF4444';
    } else if (isStreetDeathTrap) {
      dangerRating = 'HIGH_RISK';
      dangerColor = '#F97316';
    } else if (validStreetWidth < shrapnelRadiusM) {
      dangerRating = 'CAUTION';
      dangerColor = '#F59E0B';
    }

    const tacticalRules: string[] = [];

    tacticalRules.push(
      `⛔ ASGARİ GÜVENLİ MESAFE: Bu binadan en az ${safeStandoffRadiusM} metre uzakta durulmalıdır (1.5 x H Kuralı).`
    );

    if (isStreetDeathTrap) {
      tacticalRules.push(
        `🚨 ÖLÜM KANYONU UYARISI: Sokak genişliği (${validStreetWidth}m), enkaz gölgesinden (${safeStandoffRadiusM}m) DAR! Karşı kaldırım güvenli DEĞİLDİR! Enkaz sokağın tamamını doldurur.`
      );
    } else {
      tacticalRules.push(
        `✅ SOKAK TAHLİYESİ: Sokak genişliği (${validStreetWidth}m), enkaz alanından büyüktür; karşı kaldırımın arkasındaki açık alan tercih edilebilir.`
      );
    }

    tacticalRules.push(
      `🏢 CAM & PARAPET PATLAMASI: İkincil artçılarda cam, klima dış ünitesi ve çatı kiremitleri ${shrapnelRadiusM} metreye kadar savrulur.`
    );

    tacticalRules.push(
      `🚶 HAREKET PROTOKOLÜ: Binanın cephesi boyunca asla yürümeyiniz; sokağa dik kesişen ana caddelere veya açık toplanma parklarına doğru çıkınız.`
    );

    return {
      floors: validFloors,
      buildingHeightM,
      streetWidthM: validStreetWidth,
      structuralType,
      structureProfile: profile,
      safeStandoffRadiusM,
      shrapnelRadiusM,
      isStreetDeathTrap,
      streetCoveragePct,
      dangerRating,
      dangerColor,
      tacticalRules
    };
  }
}

export const collapseZoneService = CollapseZoneService.getInstance();

