import { EmergencyFacility } from '../types';

export interface LivePharmacyPayload {
  province: string;
  date: string;
  count: number;
  pharmacies: Array<{
    id: string;
    name: string;
    city: string;
    district: string;
    neighborhood?: string;
    address: string;
    phone: string;
    isDuty: boolean;
    dutyDate: string;
    coordinates: [number, number];
  }>;
}

export class LivePharmacyService {
  private static instance: LivePharmacyService;
  private cachedPharmaciesByProv: Map<string, EmergencyFacility[]> = new Map();
  private lastFetchedDate: string = '';

  private constructor() {
    this.lastFetchedDate = this.getTodayDateString();
  }

  public static getInstance(): LivePharmacyService {
    if (!LivePharmacyService.instance) {
      LivePharmacyService.instance = new LivePharmacyService();
    }
    return LivePharmacyService.instance;
  }

  public getTodayDateString(): string {
    return new Date().toISOString().slice(0, 10);
  }

  public getFormattedTodayDate(): string {
    const months = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    const now = new Date();
    return `${now.getDate()} ${months[now.getMonth()]}`;
  }

  /**
   * Belirtilen il için güncel nöbetçi eczaneleri API'den çeker
   */
  public async fetchDutyPharmacies(province: string = 'istanbul'): Promise<EmergencyFacility[]> {
    const today = this.getTodayDateString();
    const cacheKey = `${province.toLowerCase()}_${today}`;

    // Bellek önbelleği
    if (this.cachedPharmaciesByProv.has(cacheKey)) {
      return this.cachedPharmaciesByProv.get(cacheKey)!;
    }

    try {
      const res = await fetch(`/api/duty-pharmacies?province=${encodeURIComponent(province)}&limit=100`);
      if (!res.ok) return [];

      const data: LivePharmacyPayload = await res.json();
      if (!data || !Array.isArray(data.pharmacies) || data.pharmacies.length === 0) {
        return [];
      }

      const facilities: EmergencyFacility[] = data.pharmacies.map((p, idx) => ({
        id: p.id || `live-pharm-${province}-${idx + 1}`,
        name: p.name.includes('(Nöbetçi)') ? p.name : `${p.name} (Nöbetçi)`,
        category: 'pharmacy',
        city: p.city || province,
        district: p.district || '',
        neighborhood: p.neighborhood || '',
        address: p.address || '',
        phone: p.phone || '',
        typeText: 'Canlı Nöbetçi Eczane',
        emergencyBeds: 0,
        hasTraumaCenter: false,
        helipad: false,
        isDuty: true,
        dutyDate: p.dutyDate || data.date || today,
        closingHour: '7/24 Kesintisiz',
        coordinates: p.coordinates
      }));

      this.cachedPharmaciesByProv.set(cacheKey, facilities);
      return facilities;
    } catch {
      return [];
    }
  }

  /**
   * Statik tesis listesindeki eski eczaneleri, bugünün canlı nöbetçileriyle birleştirir
   */
  public mergeLivePharmacies(
    existingFacilities: EmergencyFacility[],
    livePharmacies: EmergencyFacility[]
  ): EmergencyFacility[] {
    if (!livePharmacies || livePharmacies.length === 0) {
      return existingFacilities;
    }

    // Hastaneleri ve diğer tesisleri olduğu gibi koru
    const nonPharmacies = existingFacilities.filter((f) => f.category !== 'pharmacy');

    // Canlı eczanelerin illerini tespit et
    const liveCities = new Set(livePharmacies.map((p) => p.city.toLowerCase()));

    // Canlı verisi gelmeyen diğer illerin eczanelerini yedek olarak tut
    const otherCityPharmacies = existingFacilities.filter(
      (f) => f.category === 'pharmacy' && !liveCities.has(f.city.toLowerCase())
    );

    return [...nonPharmacies, ...livePharmacies, ...otherCityPharmacies];
  }
}

export const livePharmacyService = LivePharmacyService.getInstance();
