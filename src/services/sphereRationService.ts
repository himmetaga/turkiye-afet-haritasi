/**
 * sphereRationService.ts
 * =============================================================================
 * Sphere Project (Humanitarian Charter & Minimum Standards in Disaster Response)
 * & WHO Acil Durum Beslenme ve Su İhtiyacı Standartları
 * Referans: The Sphere Handbook (Chapter: Water Supply, Sanitation & Food Security)
 * =============================================================================
 * Afet sonrasında arama kurtarma ve insani yardımın ulaşamadığı ilk 72 saat
 * ("Altın 72 Saat") ve takip eden 7 gün boyunca bir ailenin hayatta kalabilmesi
 * için gereken minimum içme suyu, hijyen suyu ve kalori ihtiyacını hesaplar.
 */

export interface SphereHouseholdInput {
  adultsCount: number;
  childrenCount: number; // 2-12 yaş
  infantsCount: number; // 0-2 yaş
  pregnantLactatingCount: number;
  isColdWinter: boolean; // Kış / Soğuk hava koşulu (+%15-20 kalori ihtiyacı)
  durationDays: 3 | 7 | 14;
}

export interface RationItem {
  name: string;
  category: 'water' | 'carb' | 'protein' | 'energy' | 'infant';
  dailyAmountPerPerson: string;
  totalHouseholdAmount: string;
  unit: string;
  notes: string;
  shelfLife: string;
}

export interface SpherePlanResult {
  totalDrinkingWaterLiters: number;
  totalHygieneWaterLiters: number;
  totalWaterLiters: number;
  dailyTotalCalories: number;
  totalPlanCalories: number;
  items: RationItem[];
  dailySchedule: { day: number; title: string; waterSchedule: string; mealSchedule: string }[];
  criticalWarnings: string[];
}

export class SphereRationService {
  /**
   * Sphere standartlarına göre hane halkı su ve kalori rasyonunu hesaplar.
   */
  public calculateRations(input: SphereHouseholdInput): SpherePlanResult {
    const adults = Math.max(0, input.adultsCount);
    const children = Math.max(0, input.childrenCount);
    const infants = Math.max(0, input.infantsCount);
    const mothers = Math.max(0, input.pregnantLactatingCount);
    const days = input.durationDays;
    const isCold = input.isColdWinter;

    // Kişi başı günlük içme ve temel yemek suyu: 3.0 Litre (WHO/Sphere)
    // Bebekler için anne sütü/mama suyu: 2.0 Litre
    const totalPeople = adults + children + infants;
    const dailyDrinkingWater = adults * 3.0 + children * 2.2 + infants * 1.5 + mothers * 0.8;
    const dailyHygieneWater = (adults + children) * 3.0 + infants * 2.0; // Temel el/yüz/bebek temizliği
    const totalDrinkingWaterLiters = Math.ceil(dailyDrinkingWater * days);
    const totalHygieneWaterLiters = Math.ceil(dailyHygieneWater * days);
    const totalWaterLiters = totalDrinkingWaterLiters + totalHygieneWaterLiters;

    // Kalori hesabı (Sphere Minimum Standard: 2,100 kcal / yetişkin)
    let baseCalories =
      adults * 2100 +
      children * 1500 +
      infants * 900 +
      mothers * 450; // Hamile/Emziren ek enerjisi

    if (isCold) {
      // Hipotermi ve soğuk havada vücut sıcaklığını korumak için %18 ek kalori
      baseCalories = Math.round(baseCalories * 1.18);
    }

    const dailyTotalCalories = Math.round(baseCalories);
    const totalPlanCalories = dailyTotalCalories * days;

    // Gıda ve Rasyon Listesi
    const items: RationItem[] = [
      {
        name: 'İçme Suyu (Şişeli / Arıtılmış)',
        category: 'water',
        dailyAmountPerPerson: '3.0 L (İçme + Hazırlık)',
        totalHouseholdAmount: `${totalDrinkingWaterLiters}`,
        unit: 'Litre',
        notes: 'Güneş görmeyen serin yerde saklanmalı, susama beklenmeden yudumlanmalı.',
        shelfLife: '12 - 24 Ay'
      },
      {
        name: 'Temel Hijyen Suyu',
        category: 'water',
        dailyAmountPerPerson: '3.0 L (El/Yüz/Yara Temizliği)',
        totalHouseholdAmount: `${totalHygieneWaterLiters}`,
        unit: 'Litre',
        notes: 'Klor tabletiyle dezenfekte edilmiş kapalı bidonlarda tutulabilir.',
        shelfLife: '6 Ay (Düzenli değişim)'
      },
      {
        name: 'Hazır Konserve Gıdalar (Barbunya, Nohut, Ton Balığı, Sarma)',
        category: 'protein',
        dailyAmountPerPerson: '1.5 Kutu (Yaklaşık 600g)',
        totalHouseholdAmount: `${Math.ceil((adults + children) * 1.5 * days)}`,
        unit: 'Kutu (400g)',
        notes: 'Açacak gerektirmeyen çek-aç kapaklı olanları tercih edin.',
        shelfLife: '2 - 4 Yıl'
      },
      {
        name: 'Yüksek Enerjili Bisküvi / Peksimet / Galeta',
        category: 'carb',
        dailyAmountPerPerson: '2 Paket (200g)',
        totalHouseholdAmount: `${Math.ceil((adults + children) * 2 * days)}`,
        unit: 'Paket (100g)',
        notes: 'Susuzluk yapmayan az tuzlu bisküviler ve krakerler.',
        shelfLife: '12 - 18 Ay'
      },
      {
        name: 'Tahin, Pekmez, Helva veya Fıstık Ezmesi',
        category: 'energy',
        dailyAmountPerPerson: '3-4 Yemek Kaşığı (Hızlı Glukoz & Yağ)',
        totalHouseholdAmount: `${Math.ceil(((adults + children) * 70 * days) / 1000 * 10) / 10}`,
        unit: 'Kilogram',
        notes: 'Pişirme gerektirmeyen, termal direnç sağlayan yoğun kalori deposu.',
        shelfLife: '12 Ay'
      },
      {
        name: 'Kuru Yemiş ve Kuru Meyve (Ceviz, Fındık, Kuru İncir, Kayısı)',
        category: 'energy',
        dailyAmountPerPerson: '1 Avuç (Yaklaşık 80g)',
        totalHouseholdAmount: `${Math.ceil(((adults + children) * 80 * days) / 1000 * 10) / 10}`,
        unit: 'Kilogram',
        notes: 'Magnezyum, potasyum ve krampları önleyen mineraller içerir.',
        shelfLife: '6 - 12 Ay'
      }
    ];

    if (infants > 0) {
      items.push({
        name: 'Bebek Maması / Devam Sütü Tozu',
        category: 'infant',
        dailyAmountPerPerson: '6 Öğün / Gün',
        totalHouseholdAmount: `${Math.ceil(infants * 0.4 * days * 10) / 10}`,
        unit: 'Kutu (800g)',
        notes: 'Yalnızca kaynatılmış veya güvenli şişe suyu ile hazırlanmalı.',
        shelfLife: '12 - 18 Ay'
      });
    }

    // Günlük rasyon tüketim planı
    const dailySchedule = [];
    for (let d = 1; d <= Math.min(days, 3); d++) {
      dailySchedule.push({
        day: d,
        title: d === 1 ? '1. Gün: Şok ve İlk İntibak' : d === 2 ? '2. Gün: Su ve Enerji Disiplini' : '3. Gün: Kritik Eşik (72 Saat)',
        waterSchedule: 'Sabah 500ml, Öğle 800ml, Akşam 800ml + 400ml gece nemlendirme.',
        mealSchedule: 'Sabah bisküvi ve helva/fındık; Öğle kuru meyve ve konserve; Akşam proteinli konserve ve galeta.'
      });
    }

    const criticalWarnings: string[] = [
      '💧 ASLA Susuzluğu geciktirmek için tükürük yutmayın veya deniz suyu/kar suyu direkt tüketmeyin (Kar suyu eritilip mineral katılmalıdır).',
      '🧂 Aşırı tuzlu cipslar, salamura veya kurutulmuş etler su kaybını 3 kat artırır; acil durumda tüketmeyin.',
      '👶 Bebek maması kaplarını açıkta bırakmayın; sahra koşullarında ishal en büyük ölüm sebebidir.',
      '❄️ Soğuk kış ortamında titreme başlarsa hemen pekmez veya tahin gibi hızlı kana karışan karbonhidrat verin.'
    ];

    return {
      totalDrinkingWaterLiters,
      totalHygieneWaterLiters,
      totalWaterLiters,
      dailyTotalCalories,
      totalPlanCalories,
      items,
      dailySchedule,
      criticalWarnings
    };
  }
}

export const sphereRationService = new SphereRationService();

