/**
 * sphereRationService.ts
 * =============================================================================
 * Afet sonrası ilk günler için hane halkı su ve enerji ihtiyacı hesabı.
 *
 * Kullanılan iki sayı Sphere El Kitabı'nın asgari ölçüleridir:
 *  - Su: kişi başı günde toplam en az 15 litre (içme + yemek + hijyen);
 *        bunun yaklaşık 3 litresi içme ve yemek hazırlama içindir.
 *  - Enerji: kişi başı günde ortalama 2100 kcal (tüm yaşların ortalaması).
 *
 * Erzak listesi (konserve, bisküvi vb.) bir standart değil, örnek öneridir.
 * Başka çarpan ya da katsayı kullanılmaz.
 */

export const SPHERE_TOTAL_WATER_L_PER_PERSON_DAY = 15;
export const DRINKING_WATER_L_PER_PERSON_DAY = 3;
export const OTHER_WATER_L_PER_PERSON_DAY =
  SPHERE_TOTAL_WATER_L_PER_PERSON_DAY - DRINKING_WATER_L_PER_PERSON_DAY;
export const SPHERE_KCAL_PER_PERSON_DAY = 2100;

export interface SphereHouseholdInput {
  adultsCount: number;
  childrenCount: number; // 2-12 yaş
  infantsCount: number; // 0-2 yaş
  /** Yetişkinlerden kaçı hamile ya da emziriyor (ayrı kişi DEĞİL; yetişkin sayısını aşamaz) */
  pregnantLactatingCount: number;
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
  totalPeople: number;
  totalDrinkingWaterLiters: number;
  /** Yemek pişirme ve hijyen suyu */
  totalHygieneWaterLiters: number;
  totalWaterLiters: number;
  dailyTotalCalories: number;
  totalPlanCalories: number;
  items: RationItem[];
  dailySchedule: { day: number; title: string; waterSchedule: string; mealSchedule: string }[];
  criticalWarnings: string[];
}

export class SphereRationService {
  public calculateRations(input: SphereHouseholdInput): SpherePlanResult {
    const adults = Math.max(0, input.adultsCount);
    const children = Math.max(0, input.childrenCount);
    const infants = Math.max(0, input.infantsCount);
    // Hamile / emziren sayısı yetişkinlerin içindedir; ayrı kişi olarak sayılmaz.
    const mothers = Math.min(adults, Math.max(0, input.pregnantLactatingCount));
    const days = input.durationDays;

    const totalPeople = adults + children + infants;

    const totalDrinkingWaterLiters = Math.ceil(totalPeople * DRINKING_WATER_L_PER_PERSON_DAY * days);
    const totalHygieneWaterLiters = Math.ceil(totalPeople * OTHER_WATER_L_PER_PERSON_DAY * days);
    const totalWaterLiters = totalDrinkingWaterLiters + totalHygieneWaterLiters;

    const dailyTotalCalories = totalPeople * SPHERE_KCAL_PER_PERSON_DAY;
    const totalPlanCalories = dailyTotalCalories * days;

    const eaters = adults + children;

    const items: RationItem[] = [
      {
        name: 'İçme ve Yemek Hazırlama Suyu (şişe ya da arıtılmış)',
        category: 'water',
        dailyAmountPerPerson: `${DRINKING_WATER_L_PER_PERSON_DAY} L`,
        totalHouseholdAmount: `${totalDrinkingWaterLiters}`,
        unit: 'Litre',
        notes: 'Güneş görmeyen serin yerde saklayın; susamayı beklemeden için.',
        shelfLife: 'Şişe üzerindeki tarihe bakın'
      },
      {
        name: 'Yemek Pişirme ve Hijyen Suyu',
        category: 'water',
        dailyAmountPerPerson: `${OTHER_WATER_L_PER_PERSON_DAY} L`,
        totalHouseholdAmount: `${totalHygieneWaterLiters}`,
        unit: 'Litre',
        notes: 'Kapalı bidonlarda saklayın. İçme suyu kadar temiz olması gerekmez ama el yıkama ve yemek için güvenli olmalı.',
        shelfLife: 'Düzenli yenileyin'
      },
      {
        name: 'Hazır Konserve Gıdalar (barbunya, nohut, ton balığı, sarma)',
        category: 'protein',
        dailyAmountPerPerson: 'Yaklaşık 1,5 kutu',
        totalHouseholdAmount: `${Math.ceil(eaters * 1.5 * days)}`,
        unit: 'Kutu (400g)',
        notes: 'Açacak gerektirmeyen çek-aç kapaklı olanları tercih edin.',
        shelfLife: 'Kutu üzerindeki tarihe bakın'
      },
      {
        name: 'Bisküvi / Peksimet / Galeta',
        category: 'carb',
        dailyAmountPerPerson: 'Yaklaşık 2 paket',
        totalHouseholdAmount: `${Math.ceil(eaters * 2 * days)}`,
        unit: 'Paket (100g)',
        notes: 'Az tuzlu olanları seçin.',
        shelfLife: 'Paket üzerindeki tarihe bakın'
      },
      {
        name: 'Tahin, Pekmez, Helva veya Fıstık Ezmesi',
        category: 'energy',
        dailyAmountPerPerson: '3-4 yemek kaşığı',
        totalHouseholdAmount: `${Math.ceil(((eaters * 70 * days) / 1000) * 10) / 10}`,
        unit: 'Kilogram',
        notes: 'Pişirme gerektirmez, az yer kaplar, enerjisi yüksektir.',
        shelfLife: 'Paket üzerindeki tarihe bakın'
      },
      {
        name: 'Kuru Yemiş ve Kuru Meyve (ceviz, fındık, kuru incir, kayısı)',
        category: 'energy',
        dailyAmountPerPerson: '1 avuç (yaklaşık 80g)',
        totalHouseholdAmount: `${Math.ceil(((eaters * 80 * days) / 1000) * 10) / 10}`,
        unit: 'Kilogram',
        notes: 'Pişirme gerektirmez; tuzsuz olanları seçin.',
        shelfLife: 'Paket üzerindeki tarihe bakın'
      }
    ];

    if (infants > 0) {
      items.push({
        name: 'Bebek Maması / Devam Sütü (anne sütü almayan bebekler için)',
        category: 'infant',
        dailyAmountPerPerson: 'Kutudaki ölçüye göre',
        totalHouseholdAmount: 'Kutudaki günlük ölçü × gün sayısı',
        unit: '',
        notes: 'Yalnızca kaynatılıp ılıtılmış ya da güvenli şişe suyuyla hazırlayın. Emzirme sürüyorsa devam edin.',
        shelfLife: 'Kutu üzerindeki tarihe bakın'
      });
    }

    const dailySchedule = [];
    for (let d = 1; d <= Math.min(days, 3); d++) {
      dailySchedule.push({
        day: d,
        title: `${d}. Gün`,
        waterSchedule: `Kişi başı yaklaşık ${DRINKING_WATER_L_PER_PERSON_DAY} litreyi güne yayarak için; susamayı beklemeyin.`,
        mealSchedule: 'Gün içine yayılmış üç öğün: bisküvi/galeta, konserve, kuru yemiş ya da helva.'
      });
    }

    const criticalWarnings: string[] = [
      '💧 Deniz suyu içmeyin. Karı eritip mümkünse kaynatarak için; kar yemek vücut ısısını düşürür.',
      '🧂 Çok tuzlu yiyecekler susuzluğu artırır; su kısıtlıysa az tüketin.',
      '👶 Mama kaplarını ve biberonları açıkta bırakmayın; ishal bebekler için hayati tehlikedir.',
      '❄️ Soğukta enerji ihtiyacı artar. Titreyen kişiyi kuru ve sıcak tutun; bilinci açıksa sıcak, şekerli içecek verin.'
    ];

    if (mothers > 0) {
      criticalWarnings.push(
        '🤰 Hamile ve emziren kadınların su ve enerji ihtiyacı ortalamadan fazladır; onlara daha büyük pay ayırın.'
      );
    }

    return {
      totalPeople,
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
